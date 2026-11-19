# Baliqchi tumani O‘quvchilar Kengashi — Ishga Tushirish va Vercel Deployment Qo‘llanmasi

## 1. Supabase Loyihasini Sozlash

1. [supabase.com](https://supabase.com) da yangi loyiha yarating (region: eng yaqin Yevropa/Markaziy Osiyo serveri).
2. Supabase **SQL Editor** bo‘limida quyidagi 6 ta migratsiyani ketma-ket ishga tushiring:
   - `supabase/migrations/0001_enums_and_core_tables.sql`
   - `supabase/migrations/0002_projects_voting_monitoring.sql`
   - `supabase/migrations/0003_groups_events_rankings_audit.sql`
   - `supabase/migrations/0004_atomic_functions_and_triggers.sql`
   - `supabase/migrations/0005_rls_policies.sql`
   - `supabase/migrations/0006_seed_official_data.sql`
3. **Authentication -> Providers -> Email** bo‘limida `Confirm email` opsiyasini o‘chiring (telefon raqami + parol bilan tezkor kirish uchun).

## 2. Environment Variables (`.env.local` va Vercel)

`.env.example` faylini `.env.local` nomi bilan nusxalang va Supabase kalitlarini kiriting:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
AUTH_PHONE_DOMAIN=baliqchi-kengash.uz
SECURITY_HASH_SALT=kamida-32-belgili-tasodifiy-maxfiy-kalit
```

> **Diqqat:** `SUPABASE_SERVICE_ROLE_KEY` hech qachon kod ichiga yozilmasin va faqat server muhitida (`.env.local` / Vercel Environment Variables) saqlansin!

## 3. Birinchi Super Administratorni Tayinlash

1. Platformada `/royxatdan-otish` sahifasi orqali o‘z akkauntingizni yarating.
2. Supabase SQL Editor’da quyidagi so‘rovni bajaring (o‘z telefon raqamingizni yozib):

```sql
INSERT INTO public.user_roles (user_id, role, status, reviewed_at)
SELECT u.user_id, 'super_admin', 'approved', now()
FROM public.user_private_details u
WHERE u.phone_e164 = '+998901234567'
ON CONFLICT DO NOTHING;
```

Shundan so‘ng `/admin` paneli siz uchun to‘liq ochiladi.

## 4. GitHub va Vercel orqali Deploy Qilish

```bash
git add .
git commit -m "Baliqchi tumani O'quvchilar Kengashi platformasi v1.0"
git remote add origin https://github.com/<USERNAME>/baliqchi-kengash.git
git push -u origin main
```

1. [vercel.com](https://vercel.com) → **Add New Project** → GitHub repository’ni import qiling.
2. **Environment Variables** bo‘limiga yuqoridagi barcha kalitlarni qo‘shing.
3. **Deploy** tugmasini bosing — avtomatik `npm run build` bajariladi va production URL beriladi.
4. Istasangiz **Domains** bo‘limidan rasmiy domeningizni ulang.
