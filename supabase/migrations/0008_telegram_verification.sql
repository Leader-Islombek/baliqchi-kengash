-- ============================================================================
-- 0008_telegram_verification.sql
-- Telegram Bot orqali 6 xonali OTP va haqiqiy telefon raqamini tasdiqlash
-- ============================================================================

-- 1. user_private_details jadvaliga Telegram ID ustunlarini qo'shish
ALTER TABLE public.user_private_details
  ADD COLUMN IF NOT EXISTS telegram_user_id bigint UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_verified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_user_private_telegram_id
  ON public.user_private_details (telegram_user_id)
  WHERE telegram_user_id IS NOT NULL;

-- 2. Telegram 6 xonali OTP kodlari jadvali (faqat server / service_role boshqaradi)
CREATE TABLE IF NOT EXISTS public.telegram_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id bigint NOT NULL,
  phone_e164 text NOT NULL,
  phone_hash text NOT NULL,
  code_hash text NOT NULL,
  purpose text NOT NULL DEFAULT 'register' CHECK (purpose IN ('register', 'reset_password')),
  attempts smallint NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tg_verify_lookup
  ON public.telegram_verifications (phone_hash, purpose, expires_at DESC)
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tg_verify_tg_user
  ON public.telegram_verifications (telegram_user_id, created_at DESC);

-- RLS yoqish — faqat service_role (server) va Super Admin kira oladi, anon/student kira olmaydi!
ALTER TABLE public.telegram_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_all_telegram_verifications" ON public.telegram_verifications;
CREATE POLICY "super_admin_all_telegram_verifications"
  ON public.telegram_verifications
  FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

GRANT ALL ON TABLE public.telegram_verifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.telegram_verifications TO authenticated;
