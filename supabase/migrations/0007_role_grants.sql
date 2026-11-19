-- ============================================================================
-- 0007_role_grants.sql
-- Supabase 2026 loyihalarida anon, authenticated va service_role uchun
-- aniq jadval va funksiya ruxsatlari (RLS qoidalari bilan birga ishlaydi).
-- Maxfiy jadvallar (user_private_details, activity_logs va b.) anon'ga BERILMAYDI!
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Service Role (Server/Admin) to'liq ruxsat
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Authenticated foydalanuvchilar (har bir amal RLS siyosatlari orqali qat'iy tekshiriladi)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Anon (tizimga kirmagan tashrif buyuruvchilar): FAQAT ommaviy xavfsiz jadvallarni o'qish
GRANT SELECT ON
  public.schools,
  public.directions,
  public.users,
  public.user_roles,
  public.coordinators,
  public.class_representatives,
  public.school_clubs,
  public.club_members,
  public.voting_weeks,
  public.projects,
  public.project_updates,
  public.events,
  public.announcements,
  public.comments,
  public.ranking_settings,
  public.school_rankings,
  public.platform_settings
TO anon;

-- Kelajakda yaratiladigan jadvallar uchun default grantlar
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
