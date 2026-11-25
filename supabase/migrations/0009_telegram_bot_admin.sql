-- ============================================================================
-- 0009_telegram_bot_admin.sql
-- Telegram Bot Admin Paneli, Majburiy Kanallar, Bot Foydalanuvchilari va Rassilka
-- ============================================================================

-- 1. Bot global sozlamalari (yagona qator: id = 1)
CREATE TABLE IF NOT EXISTS public.telegram_bot_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  require_subscription boolean NOT NULL DEFAULT true,
  notify_role_updates boolean NOT NULL DEFAULT true,
  notify_project_updates boolean NOT NULL DEFAULT true,
  notify_voting_weeks boolean NOT NULL DEFAULT true,
  maintenance_mode boolean NOT NULL DEFAULT false,
  welcome_message text NOT NULL DEFAULT '👋 <b>Baliqchi tumani O‘quvchilar Kengashi</b> rasmiy tasdiqlash botiga xush kelibsiz!\n\nRo‘yxatdan o‘tish va adolatli ovoz berish uchun pastdagi <b>«📱 Telefon raqamimni tasdiqlash»</b> tugmasini bosing:',
  subscribe_message text NOT NULL DEFAULT '📢 <b>Botdan foydalanish va 6 xonali kod olish uchun</b> Baliqchi tumani O‘quvchilar Kengashining rasmiy kanallariga a’zo bo‘ling.\n\nBarcha kanallarga qo‘shilgach, pastdagi <b>«✅ A’zo bo‘ldim — Tekshirish»</b> tugmasini bosing:',
  otp_footer_message text NOT NULL DEFAULT '⏱ Kod <b>10 daqiqa</b> amal qiladi. Uni hech kimga bermang va saytga kiriting.',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.telegram_bot_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- 2. Majburiy a'zo bo'lish kanallari
CREATE TABLE IF NOT EXISTS public.telegram_required_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  chat_id text NOT NULL UNIQUE,
  invite_link text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 10,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tg_channels_active_order
  ON public.telegram_required_channels (is_active, sort_order, created_at);

-- 3. Botga kirgan barcha Telegram foydalanuvchilari
CREATE TABLE IF NOT EXISTS public.telegram_bot_users (
  telegram_user_id bigint PRIMARY KEY,
  username text,
  first_name text,
  last_name text,
  linked_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  is_banned boolean NOT NULL DEFAULT false,
  is_blocked_by_user boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tg_bot_users_linked
  ON public.telegram_bot_users (linked_user_id)
  WHERE linked_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tg_bot_users_active_broadcast
  ON public.telegram_bot_users (is_banned, is_blocked_by_user, created_at DESC);

-- 4. Bot ichidagi tezkor /admin menyusi ruxsati berilgan Telegram ID lar
CREATE TABLE IF NOT EXISTS public.telegram_bot_admins (
  telegram_user_id bigint PRIMARY KEY,
  label text NOT NULL,
  added_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Ommaviy xabar yuborish (Rassilka / Broadcast) tarixi
CREATE TABLE IF NOT EXISTS public.telegram_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience text NOT NULL CHECK (audience IN ('all', 'registered', 'unregistered', 'school')),
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  message_text text NOT NULL,
  photo_url text,
  button_text text,
  button_url text,
  total_targets integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'completed', 'failed')),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_tg_broadcasts_created
  ON public.telegram_broadcasts (created_at DESC);

-- RLS yoqish — faqat Super Admin va service_role kira oladi!
ALTER TABLE public.telegram_bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_required_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_bot_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_bot_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_all_tg_settings" ON public.telegram_bot_settings;
CREATE POLICY "super_admin_all_tg_settings"
  ON public.telegram_bot_settings FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_all_tg_channels" ON public.telegram_required_channels;
CREATE POLICY "super_admin_all_tg_channels"
  ON public.telegram_required_channels FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_all_tg_users" ON public.telegram_bot_users;
CREATE POLICY "super_admin_all_tg_users"
  ON public.telegram_bot_users FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_all_tg_admins" ON public.telegram_bot_admins;
CREATE POLICY "super_admin_all_tg_admins"
  ON public.telegram_bot_admins FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_all_tg_broadcasts" ON public.telegram_broadcasts;
CREATE POLICY "super_admin_all_tg_broadcasts"
  ON public.telegram_broadcasts FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Explicit PostgreSQL GRANTs (service_role + authenticated; anon umuman kira olmaydi)
GRANT ALL ON TABLE public.telegram_bot_settings TO service_role;
GRANT ALL ON TABLE public.telegram_required_channels TO service_role;
GRANT ALL ON TABLE public.telegram_bot_users TO service_role;
GRANT ALL ON TABLE public.telegram_bot_admins TO service_role;
GRANT ALL ON TABLE public.telegram_broadcasts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.telegram_bot_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.telegram_required_channels TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.telegram_bot_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.telegram_bot_admins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.telegram_broadcasts TO authenticated;
