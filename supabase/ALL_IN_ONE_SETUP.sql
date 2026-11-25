-- ============================================================================
-- 0001_enums_and_core_tables.sql
-- Baliqchi tumani O'quvchilar Kengashi Platformasi
-- Rasmiy 365-son buyruq (2026-yil 25-sentabr) 2-ilovasiga muvofiq
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. ENUM TURLARI
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'student',
    'school_coordinator',
    'school_leader',
    'district_coordinator',
    'district_leader',
    'school_advisor',
    'super_admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM (
    'pending',
    'active',
    'suspended',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.role_request_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'revoked'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM (
    'draft',
    'submitted',
    'moderation',
    'voting',
    'weekly_winner',
    'under_review',
    'approved',
    'in_progress',
    'completed',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.group_type AS ENUM (
    'direction',
    'future_leaders'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.event_status AS ENUM (
    'planned',
    'ongoing',
    'completed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ranking_period AS ENUM (
    'weekly',
    'monthly',
    'overall'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 2. MAKTABLAR (61 ta maktab)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_number integer NOT NULL UNIQUE CHECK (school_number > 0),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  address text,
  description text,
  logo_url text,
  cover_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schools_number ON public.schools (school_number);
CREATE INDEX IF NOT EXISTS idx_schools_active ON public.schools (is_active);

-- ----------------------------------------------------------------------------
-- 3. YO'NALISHLAR (Rasmiy 7 ta yo'nalish - kengaytiriluvchan)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.directions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL UNIQUE,
  short_name text NOT NULL,
  description text NOT NULL,
  duties_summary text,
  icon_name text NOT NULL DEFAULT 'Sparkles',
  accent_color text NOT NULL DEFAULT 'blue',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_directions_order ON public.directions (sort_order);

-- ----------------------------------------------------------------------------
-- 4. FOYDALANUVCHILAR (Ommaviy xavfsiz profil)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  grade smallint CHECK (grade IS NULL OR (grade BETWEEN 5 AND 11)),
  class_letter text,
  avatar_url text,
  bio text,
  can_submit_projects boolean NOT NULL DEFAULT false,
  account_status public.account_status NOT NULL DEFAULT 'active',
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_school ON public.users (school_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users (account_status, is_verified);

-- ----------------------------------------------------------------------------
-- 5. MAXFIY FOYDALANUVCHI MA'LUMOTLARI (Voyaga yetmaganlar PII himoyasi)
-- Faqat foydalanuvchining o'zi va Super Admin ko'ra oladi!
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_private_details (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  phone_e164 text NOT NULL UNIQUE,
  phone_hash text NOT NULL UNIQUE,
  identity_fingerprint text,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_private_phone_hash ON public.user_private_details (phone_hash);

-- ----------------------------------------------------------------------------
-- 6. FOYDALANUVCHI ROLLARI VA ARIZALAR
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  direction_id uuid REFERENCES public.directions(id) ON DELETE SET NULL,
  status public.role_request_status NOT NULL DEFAULT 'pending',
  request_note text,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles (user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role, status);
CREATE INDEX IF NOT EXISTS idx_user_roles_scope ON public.user_roles (school_id, direction_id);

-- ----------------------------------------------------------------------------
-- 7. KOORDINATORLAR VA KELAJAK LIDERLARI (Rasmiy tayinlovlar)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coordinators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL CHECK (
    role IN (
      'school_coordinator',
      'school_leader',
      'district_coordinator',
      'district_leader',
      'school_advisor'
    )
  ),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  direction_id uuid REFERENCES public.directions(id) ON DELETE SET NULL,
  appointed_at timestamptz NOT NULL DEFAULT now(),
  term_end timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tumanda faqat 1 ta aktiv Tuman Kelajak Lideri
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_district_leader
  ON public.coordinators (role)
  WHERE role = 'district_leader' AND is_active = true;

-- Har bir yo'nalishda faqat 1 ta aktiv Tuman yo'nalish koordinatori
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_district_coordinator
  ON public.coordinators (direction_id)
  WHERE role = 'district_coordinator' AND is_active = true;

-- Har bir maktabda faqat 1 ta aktiv Maktab Kelajak Lideri
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_school_leader
  ON public.coordinators (school_id)
  WHERE role = 'school_leader' AND is_active = true;

-- Har bir maktab + yo'nalishda faqat 1 ta aktiv Maktab yo'nalish koordinatori
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_school_coordinator
  ON public.coordinators (school_id, direction_id)
  WHERE role = 'school_coordinator' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_coordinators_user ON public.coordinators (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_coordinators_school ON public.coordinators (school_id, is_active);

-- ----------------------------------------------------------------------------
-- 8. SINF VAKILLARI VA KLUBLAR (Nizom 3-bobga muvofiq)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  grade smallint NOT NULL CHECK (grade BETWEEN 5 AND 11),
  class_letter text NOT NULL DEFAULT 'A',
  academic_year text NOT NULL DEFAULT '2026-2027',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_reps_school ON public.class_representatives (school_id, is_active);

CREATE TABLE IF NOT EXISTS public.school_clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  direction_id uuid REFERENCES public.directions(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  mentor_name text,
  leader_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_clubs_school ON public.school_clubs (school_id, is_active);

CREATE TABLE IF NOT EXISTS public.club_members (
  club_id uuid NOT NULL REFERENCES public.school_clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, user_id)
);

-- ============================================================================
-- 0002_projects_voting_monitoring.sql
-- Loyihalar, Haftalik Atomar Ovoz Berish, Monitoring va Hisobotlar
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HAFTALIK OVOZ BERISH DAVRLARI
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.voting_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'upcoming' CHECK (
    status IN ('upcoming', 'active', 'closed', 'finalized')
  ),
  winner_project_id uuid,
  is_tie_resolved boolean NOT NULL DEFAULT false,
  tie_resolution_note text,
  finalized_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_single_active_voting_week
  ON public.voting_weeks (status)
  WHERE status = 'active';

-- ----------------------------------------------------------------------------
-- 2. LOYIHALAR (12 ta majburiy maydon + 10 holat + monitoring)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  -- 1-4: Asosiy identifikatsiya
  title text NOT NULL,
  direction_id uuid NOT NULL REFERENCES public.directions(id) ON DELETE RESTRICT,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE RESTRICT,
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  -- 5-11: Loyiha mazmuni
  problem_statement text NOT NULL,
  goal text NOT NULL,
  proposed_solution text NOT NULL,
  implementation_plan text NOT NULL,
  expected_result text NOT NULL,
  required_resources text NOT NULL,
  duration_text text NOT NULL,
  -- 12: Media
  cover_image_url text,
  media_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Holat va ovoz berish
  status public.project_status NOT NULL DEFAULT 'draft',
  voting_week_id uuid REFERENCES public.voting_weeks(id) ON DELETE SET NULL,
  votes_count integer NOT NULL DEFAULT 0 CHECK (votes_count >= 0),
  -- Monitoring
  responsible_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  progress_percent smallint NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  milestones jsonb NOT NULL DEFAULT '[]'::jsonb,
  final_results_summary text,
  -- Moderatsiya va ko'rib chiqish
  moderation_note text,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.voting_weeks
  DROP CONSTRAINT IF EXISTS fk_voting_weeks_winner_project;

ALTER TABLE public.voting_weeks
  ADD CONSTRAINT fk_voting_weeks_winner_project
  FOREIGN KEY (winner_project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_school ON public.projects (school_id);
CREATE INDEX IF NOT EXISTS idx_projects_direction ON public.projects (direction_id);
CREATE INDEX IF NOT EXISTS idx_projects_voting_week ON public.projects (voting_week_id, votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_projects_author ON public.projects (author_id);

-- ----------------------------------------------------------------------------
-- 3. HAFTALIK OVOZLAR (QAT'IY: HAR BIR O'QUVCHI HAFTASIGA JAMI 1 TA OVOZ)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voting_week_id uuid NOT NULL REFERENCES public.voting_weeks(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_one_vote_per_user_per_week UNIQUE (user_id, voting_week_id)
);

CREATE INDEX IF NOT EXISTS idx_project_votes_project ON public.project_votes (project_id);
CREATE INDEX IF NOT EXISTS idx_project_votes_week ON public.project_votes (voting_week_id);

-- ----------------------------------------------------------------------------
-- 4. LOYIHA AMALGA OSHIRISH YANGILANISHLARI (Monitoring & Homepage Feed)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  title text NOT NULL,
  content text NOT NULL,
  progress_percent smallint NOT NULL CHECK (progress_percent BETWEEN 0 AND 100),
  results_achieved text,
  challenges text,
  media_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  show_on_homepage boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_updates_project ON public.project_updates (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_updates_homepage ON public.project_updates (show_on_homepage, created_at DESC);

-- ----------------------------------------------------------------------------
-- 5. FAOLIYAT HISOBOTLARI (Haftalik, Oylik, Choraklik)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  direction_id uuid REFERENCES public.directions(id) ON DELETE SET NULL,
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  period_label text NOT NULL,
  summary text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  attachment_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'submitted' CHECK (
    status IN ('submitted', 'reviewed', 'approved', 'needs_revision')
  ),
  review_note text,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_reports_school ON public.project_reports (school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_reports_direction ON public.project_reports (direction_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 6. O'QUVCHI TASHABBUSLARI (Oddiy o'quvchi o'z maktab lideriga yuboradigan g'oyalar)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  direction_id uuid NOT NULL REFERENCES public.directions(id) ON DELETE RESTRICT,
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  problem_summary text NOT NULL,
  idea_details text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'reviewing', 'accepted', 'converted', 'declined')
  ),
  reviewer_note text,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  converted_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_initiatives_school ON public.student_initiatives (school_id, status);

-- ============================================================================
-- 0003_groups_events_rankings_audit.sql
-- 8 ta Boshqaruv Guruhi, Tadbirlar, Yangiliklar, Izohlar, Reyting va Audit Log
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. GURUHLAR (7 ta yo'nalish guruhi + 1 ta Kelajak Liderlari guruhi = 8 ta)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  group_type public.group_type NOT NULL,
  direction_id uuid REFERENCES public.directions(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  member_role text NOT NULL DEFAULT 'member' CHECK (
    member_role IN ('manager', 'moderator', 'member')
  ),
  is_muted boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_group_member UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members (group_id);

CREATE TABLE IF NOT EXISTS public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_type text NOT NULL DEFAULT 'message' CHECK (
    message_type IN ('message', 'announcement', 'task', 'report')
  ),
  title text,
  content text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_pinned boolean NOT NULL DEFAULT false,
  is_edited boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_messages_group ON public.group_messages (group_id, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_group_messages_pinned ON public.group_messages (group_id, is_pinned)
  WHERE is_pinned = true AND deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 2. TADBIRLAR (Rejalashtirilgan va o'tkazilgan)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  direction_id uuid REFERENCES public.directions(id) ON DELETE SET NULL,
  organizer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  location text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  status public.event_status NOT NULL DEFAULT 'planned',
  cover_image_url text,
  media_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  participants_count integer DEFAULT 0 CHECK (participants_count >= 0),
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_starts_at ON public.events (starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_school ON public.events (school_id, starts_at DESC);

-- ----------------------------------------------------------------------------
-- 3. YANGILIKLAR VA E'LONLAR
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'news' CHECK (
    category IN ('news', 'announcement', 'charter_update')
  ),
  scope text NOT NULL DEFAULT 'district' CHECK (
    scope IN ('district', 'school', 'direction')
  ),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  direction_id uuid REFERENCES public.directions(id) ON DELETE SET NULL,
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  cover_image_url text,
  media_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_pinned boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements (is_published, is_pinned DESC, published_at DESC);

-- ----------------------------------------------------------------------------
-- 4. IZOHLAR (Loyiha muhokamasi)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) >= 2 AND char_length(content) <= 2000),
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_project ON public.comments (project_id, created_at ASC)
  WHERE is_hidden = false;

-- ----------------------------------------------------------------------------
-- 5. BILDIRISHNOMALAR
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  link_url text,
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, is_read, created_at DESC);

-- ----------------------------------------------------------------------------
-- 6. FAOL MAKTABLAR REYTINGI VA SOZLANADIGAN MEZONLAR
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ranking_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  completed_projects_weight numeric(6,2) NOT NULL DEFAULT 30.00,
  in_progress_projects_weight numeric(6,2) NOT NULL DEFAULT 12.00,
  events_weight numeric(6,2) NOT NULL DEFAULT 10.00,
  reports_weight numeric(6,2) NOT NULL DEFAULT 8.00,
  direction_activity_weight numeric(6,2) NOT NULL DEFAULT 15.00,
  participation_weight numeric(6,2) NOT NULL DEFAULT 2.00,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.school_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  period_type public.ranking_period NOT NULL,
  period_key text NOT NULL,
  rank_position integer NOT NULL CHECK (rank_position > 0),
  total_score numeric(10,2) NOT NULL DEFAULT 0,
  metrics_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_school_ranking_period UNIQUE (school_id, period_type, period_key)
);

CREATE INDEX IF NOT EXISTS idx_school_rankings_lookup ON public.school_rankings (period_type, period_key, rank_position ASC);

-- ----------------------------------------------------------------------------
-- 7. PLATFORMA SOZLAMALARI (Super Admin boshqaruvi uchun)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 8. AUDIT LOG (Admin va muhim tizim amallari tarixi)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON public.activity_logs (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs (entity_type, entity_id);

-- ============================================================================
-- 0004_atomic_functions_and_triggers.sql
-- Yordamchi RBAC funksiyalari, Atomar Ovoz Berish RPC, Reyting Hisoblash, Triggerlar
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RBAC YORDAMCHI FUNKSIYALARI
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin(p_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_uid
      AND role = 'super_admin'
      AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_approved_role(
  p_role public.app_role,
  p_uid uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_uid
      AND role = p_role
      AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(
  p_group_id uuid,
  p_uid uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin(p_uid)
    OR EXISTS (
      SELECT 1
      FROM public.group_members
      WHERE group_id = p_group_id AND user_id = p_uid
    );
$$;

CREATE OR REPLACE FUNCTION public.is_group_manager(
  p_group_id uuid,
  p_uid uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin(p_uid)
    OR EXISTS (
      SELECT 1
      FROM public.groups
      WHERE id = p_group_id AND manager_id = p_uid
    )
    OR EXISTS (
      SELECT 1
      FROM public.group_members
      WHERE group_id = p_group_id
        AND user_id = p_uid
        AND member_role IN ('manager', 'moderator')
    );
$$;

-- ----------------------------------------------------------------------------
-- 2. UPDATED_AT TRIGGERI
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'schools', 'directions', 'users', 'user_private_details', 'user_roles',
    'coordinators', 'school_clubs', 'voting_weeks', 'projects',
    'project_reports', 'student_initiatives', 'groups', 'group_messages',
    'events', 'announcements', 'comments'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 3. LOYIHA PROGRESS SINXRONIZATSIYASI TRIGGERI
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_project_progress_from_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.projects
  SET
    progress_percent = NEW.progress_percent,
    status = CASE
      WHEN NEW.progress_percent = 100 AND status = 'in_progress' THEN 'completed'::public.project_status
      ELSE status
    END,
    updated_at = now()
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_project_progress ON public.project_updates;
CREATE TRIGGER trg_sync_project_progress
AFTER INSERT ON public.project_updates
FOR EACH ROW
EXECUTE FUNCTION public.sync_project_progress_from_update();

-- ----------------------------------------------------------------------------
-- 4. KOORDINATOR/LIDER TAYINLANGANDA AVTOMATIK GURUHGA QO'SHISH TRIGGERI
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_coordinator_group_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
  v_member_role text;
BEGIN
  IF NEW.is_active = false THEN
    RETURN NEW;
  END IF;

  IF NEW.role IN ('district_leader', 'school_leader') THEN
    SELECT id INTO v_group_id
    FROM public.groups
    WHERE group_type = 'future_leaders' AND is_active = true
    LIMIT 1;

    v_member_role := CASE WHEN NEW.role = 'district_leader' THEN 'manager' ELSE 'member' END;

    IF v_group_id IS NOT NULL THEN
      INSERT INTO public.group_members (group_id, user_id, member_role)
      VALUES (v_group_id, NEW.user_id, v_member_role)
      ON CONFLICT (group_id, user_id) DO UPDATE SET member_role = EXCLUDED.member_role;

      IF NEW.role = 'district_leader' THEN
        UPDATE public.groups SET manager_id = NEW.user_id WHERE id = v_group_id;
      END IF;
    END IF;

  ELSIF NEW.role IN ('district_coordinator', 'school_coordinator') AND NEW.direction_id IS NOT NULL THEN
    SELECT id INTO v_group_id
    FROM public.groups
    WHERE group_type = 'direction' AND direction_id = NEW.direction_id AND is_active = true
    LIMIT 1;

    v_member_role := CASE WHEN NEW.role = 'district_coordinator' THEN 'manager' ELSE 'member' END;

    IF v_group_id IS NOT NULL THEN
      INSERT INTO public.group_members (group_id, user_id, member_role)
      VALUES (v_group_id, NEW.user_id, v_member_role)
      ON CONFLICT (group_id, user_id) DO UPDATE SET member_role = EXCLUDED.member_role;

      IF NEW.role = 'district_coordinator' THEN
        UPDATE public.groups SET manager_id = NEW.user_id WHERE id = v_group_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_coordinator_group ON public.coordinators;
CREATE TRIGGER trg_sync_coordinator_group
AFTER INSERT OR UPDATE OF is_active, role, direction_id ON public.coordinators
FOR EACH ROW
EXECUTE FUNCTION public.sync_coordinator_group_membership();

-- ----------------------------------------------------------------------------
-- 5. ATOMAR HAFTALIK OVOZ BERISH RPC FUNKSIYASI
-- ASOSIY QOIDA: Har bir tasdiqlangan o'quvchi haftasiga barcha 7 yo'nalish
-- bo'yicha JAMI 1 TA ovoz bera oladi.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cast_weekly_vote(
  p_project_id uuid,
  p_ip_hash text DEFAULT NULL,
  p_ua_hash text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_user record;
  v_week record;
  v_project record;
  v_new_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED', 'message', 'Ovoz berish uchun tizimga kiring.');
  END IF;

  SELECT id, account_status, is_verified
  INTO v_user
  FROM public.users
  WHERE id = v_uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PROFILE_NOT_FOUND', 'message', 'Foydalanuvchi profili topilmadi.');
  END IF;

  IF v_user.account_status <> 'active' OR v_user.is_verified <> true THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_VERIFIED', 'message', 'Faqat tasdiqlangan va faol o''quvchilar ovoz bera oladi.');
  END IF;

  -- Faol ovoz berish haftasini tekshirish
  SELECT *
  INTO v_week
  FROM public.voting_weeks
  WHERE status = 'active'
    AND now() BETWEEN starts_at AND ends_at
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NO_ACTIVE_WEEK', 'message', 'Hozirda faol haftalik ovoz berish davri ochiq emas.');
  END IF;

  -- Loyihani qulflash va tekshirish
  SELECT id, title, status, voting_week_id, votes_count
  INTO v_project
  FROM public.projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PROJECT_NOT_FOUND', 'message', 'Loyiha topilmadi.');
  END IF;

  IF v_project.status <> 'voting' OR v_project.voting_week_id <> v_week.id THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE', 'message', 'Ushbu loyiha joriy haftalik ovoz berishda ishtirok etmayapti.');
  END IF;

  -- Atomar ovoz yozish (UNIQUE(user_id, voting_week_id) takroriy ovozni bloklaydi)
  BEGIN
    INSERT INTO public.project_votes (voting_week_id, project_id, user_id, ip_hash, user_agent_hash)
    VALUES (v_week.id, v_project.id, v_uid, p_ip_hash, p_ua_hash);
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'ALREADY_VOTED_THIS_WEEK',
      'message', 'Siz ushbu haftada barcha 7 yo''nalish bo''yicha o''z yagona ovozingizni allaqachon bergansiz.'
    );
  END;

  UPDATE public.projects
  SET votes_count = votes_count + 1
  WHERE id = v_project.id
  RETURNING votes_count INTO v_new_count;

  INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, new_data, ip_hash)
  VALUES (
    v_uid,
    'cast_weekly_vote',
    'project',
    v_project.id,
    jsonb_build_object('voting_week_id', v_week.id, 'votes_count', v_new_count),
    p_ip_hash
  );

  RETURN jsonb_build_object(
    'ok', true,
    'code', 'VOTED',
    'message', 'Ovozingiz muvaffaqiyatli qabul qilindi!',
    'project_id', v_project.id,
    'voting_week_id', v_week.id,
    'votes_count', v_new_count
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. HAFTALIK G'OLIBNI ANIQLASH RPC (Tenglikni aniqlash + Avtomatik tasdiqlamaslik)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finalize_voting_week(
  p_week_id uuid,
  p_override_winner_project_id uuid DEFAULT NULL,
  p_tie_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_max_votes integer;
  v_top_count integer;
  v_winner_id uuid;
  v_winner_title text;
  v_winner_direction uuid;
BEGIN
  IF NOT public.is_super_admin(v_uid) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'FORBIDDEN', 'message', 'Faqat Super Administrator ovoz berish haftasini yakunlashi mumkin.');
  END IF;

  SELECT MAX(votes_count) INTO v_max_votes
  FROM public.projects
  WHERE voting_week_id = p_week_id AND status = 'voting';

  IF v_max_votes IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NO_PROJECTS', 'message', 'Ushbu haftada ovoz berishda qatnashayotgan loyihalar yo''q.');
  END IF;

  SELECT COUNT(*) INTO v_top_count
  FROM public.projects
  WHERE voting_week_id = p_week_id AND status = 'voting' AND votes_count = v_max_votes;

  IF v_top_count > 1 AND p_override_winner_project_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'TIE_DETECTED',
      'message', format('Eng yuqori %s ta ovoz bilan %s ta loyiha teng keldi. Adolatli tartib bo''yicha g''olibni qo''lda tasdiqlang.', v_max_votes, v_top_count)
    );
  END IF;

  IF p_override_winner_project_id IS NOT NULL THEN
    v_winner_id := p_override_winner_project_id;
  ELSE
    SELECT id INTO v_winner_id
    FROM public.projects
    WHERE voting_week_id = p_week_id AND status = 'voting' AND votes_count = v_max_votes
    LIMIT 1;
  END IF;

  -- Muhim: Haftalik g'olib avtomatik 'approved' bo'lmaydi, 'weekly_winner' holatiga o'tadi!
  UPDATE public.projects
  SET status = 'weekly_winner', updated_at = now()
  WHERE id = v_winner_id
  RETURNING title, direction_id INTO v_winner_title, v_winner_direction;

  UPDATE public.voting_weeks
  SET
    status = 'finalized',
    winner_project_id = v_winner_id,
    is_tie_resolved = (v_top_count > 1),
    tie_resolution_note = p_tie_note,
    finalized_by = v_uid,
    finalized_at = now()
  WHERE id = p_week_id;

  -- Tuman Kelajak Lideri va tegishli Tuman koordinatoriga bildirishnoma yuborish
  INSERT INTO public.notifications (user_id, type, title, body, link_url)
  SELECT
    c.user_id,
    'weekly_winner_review',
    'Haftalik g''olib loyiha ko''rib chiqishni kutmoqda',
    format('"%s" loyihasi haftalik g''olib bo''ldi. Amalga oshirishdan oldin tuman darajasida ko''rib chiqing.', v_winner_title),
    '/kabinet'
  FROM public.coordinators c
  WHERE c.is_active = true
    AND (c.role = 'district_leader' OR (c.role = 'district_coordinator' AND c.direction_id = v_winner_direction));

  INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, new_data)
  VALUES (
    v_uid,
    'finalize_voting_week',
    'voting_week',
    p_week_id,
    jsonb_build_object('winner_project_id', v_winner_id, 'max_votes', v_max_votes, 'tie_resolved', v_top_count > 1, 'note', p_tie_note)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'winner_project_id', v_winner_id,
    'winner_title', v_winner_title,
    'max_votes', v_max_votes
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. FAOL MAKTABLAR REYTINGINI QAYTA HISOBLASH RPC (Ko'p mezonli formula)
-- Faqat ovozlar soniga emas: yakunlangan loyihalar, jarayondagi loyihalar,
-- tadbirlar, hisobotlar, yo'nalishlar faolligi va ishtirokka asoslanadi.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_school_rankings(
  p_period_type public.ranking_period DEFAULT 'overall',
  p_period_key text DEFAULT 'all-time'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_weights record;
  v_since timestamptz;
BEGIN
  IF v_uid IS NOT NULL AND NOT (
    public.is_super_admin(v_uid) OR public.has_approved_role('district_leader', v_uid)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Reytingni qayta hisoblash uchun ruxsat yo''q.');
  END IF;

  SELECT * INTO v_weights FROM public.ranking_settings WHERE id = 1;
  IF NOT FOUND THEN
    INSERT INTO public.ranking_settings (id) VALUES (1) RETURNING * INTO v_weights;
  END IF;

  v_since := CASE
    WHEN p_period_type = 'weekly' THEN now() - interval '7 days'
    WHEN p_period_type = 'monthly' THEN now() - interval '30 days'
    ELSE '1970-01-01'::timestamptz
  END;

  WITH raw_metrics AS (
    SELECT
      s.id AS school_id,
      COALESCE((
        SELECT COUNT(*) FROM public.projects p
        WHERE p.school_id = s.id AND p.status = 'completed' AND p.updated_at >= v_since
      ), 0) AS completed_projects,
      COALESCE((
        SELECT COUNT(*) FROM public.projects p
        WHERE p.school_id = s.id AND p.status IN ('approved', 'in_progress') AND p.updated_at >= v_since
      ), 0) AS active_projects,
      COALESCE((
        SELECT COUNT(*) FROM public.events e
        WHERE e.school_id = s.id AND e.status IN ('ongoing', 'completed') AND e.starts_at >= v_since
      ), 0) AS events_count,
      COALESCE((
        SELECT COUNT(*) FROM public.project_reports r
        WHERE r.school_id = s.id AND r.status IN ('submitted', 'reviewed', 'approved') AND r.created_at >= v_since
      ), 0) AS reports_count,
      COALESCE((
        SELECT COUNT(DISTINCT p.direction_id) FROM public.projects p
        WHERE p.school_id = s.id AND p.status NOT IN ('draft', 'rejected') AND p.created_at >= v_since
      ), 0) AS active_directions,
      COALESCE((
        SELECT COUNT(*) FROM public.users u
        WHERE u.school_id = s.id AND u.account_status = 'active'
      ), 0) AS active_students
    FROM public.schools s
    WHERE s.is_active = true
  ),
  scored AS (
    SELECT
      rm.*,
      ROUND((
        rm.completed_projects * v_weights.completed_projects_weight +
        rm.active_projects * v_weights.in_progress_projects_weight +
        rm.events_count * v_weights.events_weight +
        rm.reports_count * v_weights.reports_weight +
        rm.active_directions * v_weights.direction_activity_weight +
        LEAST(rm.active_students, 50) * v_weights.participation_weight
      )::numeric, 2) AS total_score
    FROM raw_metrics rm
  ),
  ranked AS (
    SELECT
      school_id,
      total_score,
      ROW_NUMBER() OVER (ORDER BY total_score DESC, completed_projects DESC, events_count DESC, school_id ASC) AS rank_position,
      jsonb_build_object(
        'completed_projects', completed_projects,
        'active_projects', active_projects,
        'events_count', events_count,
        'reports_count', reports_count,
        'active_directions', active_directions,
        'active_students', active_students
      ) AS metrics_breakdown
    FROM scored
  )
  INSERT INTO public.school_rankings (school_id, period_type, period_key, rank_position, total_score, metrics_breakdown, calculated_at)
  SELECT school_id, p_period_type, p_period_key, rank_position, total_score, metrics_breakdown, now()
  FROM ranked
  ON CONFLICT (school_id, period_type, period_key)
  DO UPDATE SET
    rank_position = EXCLUDED.rank_position,
    total_score = EXCLUDED.total_score,
    metrics_breakdown = EXCLUDED.metrics_breakdown,
    calculated_at = now();

  RETURN jsonb_build_object('ok', true, 'period_type', p_period_type, 'period_key', p_period_key);
END;
$$;

-- ============================================================================
-- 0005_rls_policies.sql
-- Row Level Security (RLS) Siyosatlari
-- 1. Super Admin barcha jadvallarda to'liq (ALL) huquqqa ega
-- 2. Voyaga yetmaganlar maxfiy ma'lumotlari (user_private_details) qat'iy himoyalangan
-- 3. Har bir rol o'z maktabi/yo'nalishi doirasida boshqaradi
-- ============================================================================

-- Barcha jadvallarda RLS yoqish
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'schools', 'directions', 'users', 'user_private_details', 'user_roles',
    'coordinators', 'class_representatives', 'school_clubs', 'club_members',
    'voting_weeks', 'projects', 'project_votes', 'project_updates',
    'project_reports', 'student_initiatives', 'groups', 'group_members',
    'group_messages', 'events', 'announcements', 'comments', 'notifications',
    'ranking_settings', 'school_rankings', 'platform_settings', 'activity_logs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    -- Super Admin uchun har bir jadvalda to'liq cheksiz nazorat (Rule #6)
    EXECUTE format('DROP POLICY IF EXISTS "super_admin_all_%I" ON public.%I;', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "super_admin_all_%I" ON public.%I FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- OMMAVIY O'QISH MUMKIN BO'LGAN MA'LUMOTLAR (PII siz)
-- ----------------------------------------------------------------------------
CREATE POLICY "schools_public_read" ON public.schools
  FOR SELECT USING (is_active = true);

CREATE POLICY "directions_public_read" ON public.directions
  FOR SELECT USING (is_active = true);

-- Ommaviy profil (telefon raqami YO'Q - u user_private_details da!)
CREATE POLICY "users_public_read" ON public.users
  FOR SELECT USING (account_status = 'active' OR auth.uid() = id);

CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- MAXFIY MA'LUMOTLAR: Faqat egasi (va super_admin_all orqali Admin)
CREATE POLICY "user_private_self_read" ON public.user_private_details
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_private_self_insert" ON public.user_private_details
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_private_self_update" ON public.user_private_details
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- USER ROLES
CREATE POLICY "user_roles_read_approved_or_self" ON public.user_roles
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "user_roles_request_self" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending' AND role <> 'super_admin');

-- COORDINATORS, SINF VAKILLARI VA KLUBLAR
CREATE POLICY "coordinators_public_read" ON public.coordinators
  FOR SELECT USING (is_active = true);

CREATE POLICY "class_reps_public_read" ON public.class_representatives
  FOR SELECT USING (is_active = true);

CREATE POLICY "class_reps_school_leader_manage" ON public.class_representatives
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.coordinators c
      WHERE c.user_id = auth.uid() AND c.is_active = true
        AND c.role = 'school_leader' AND c.school_id = class_representatives.school_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coordinators c
      WHERE c.user_id = auth.uid() AND c.is_active = true
        AND c.role = 'school_leader' AND c.school_id = class_representatives.school_id
    )
  );

CREATE POLICY "school_clubs_public_read" ON public.school_clubs
  FOR SELECT USING (is_active = true);

CREATE POLICY "school_clubs_school_leader_manage" ON public.school_clubs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.coordinators c
      WHERE c.user_id = auth.uid() AND c.is_active = true
        AND c.role IN ('school_leader', 'school_advisor')
        AND c.school_id = school_clubs.school_id
    )
  );

CREATE POLICY "club_members_public_read" ON public.club_members
  FOR SELECT USING (true);

CREATE POLICY "club_members_self_join" ON public.club_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "club_members_self_leave" ON public.club_members
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- VOTING WEEKS
CREATE POLICY "voting_weeks_public_read" ON public.voting_weeks
  FOR SELECT USING (true);

-- PROJECTS
CREATE POLICY "projects_public_read" ON public.projects
  FOR SELECT USING (
    status IN ('voting', 'weekly_winner', 'under_review', 'approved', 'in_progress', 'completed')
    OR author_id = auth.uid()
    OR public.has_approved_role('district_leader', auth.uid())
    OR public.has_approved_role('district_coordinator', auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.coordinators c
      WHERE c.user_id = auth.uid() AND c.is_active = true
        AND c.school_id = projects.school_id
        AND c.role IN ('school_leader', 'school_advisor')
    )
  );

CREATE POLICY "projects_authorized_insert" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.can_submit_projects = true)
      OR EXISTS (
        SELECT 1 FROM public.coordinators c
        WHERE c.user_id = auth.uid() AND c.is_active = true
          AND c.role IN ('school_coordinator', 'school_leader', 'district_coordinator', 'district_leader')
      )
    )
  );

CREATE POLICY "projects_authorized_update" ON public.projects
  FOR UPDATE TO authenticated
  USING (
    (author_id = auth.uid() AND status IN ('draft', 'submitted'))
    OR responsible_user_id = auth.uid()
    OR public.has_approved_role('district_leader', auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.coordinators c
      WHERE c.user_id = auth.uid() AND c.is_active = true
        AND (
          (c.role = 'district_coordinator' AND c.direction_id = projects.direction_id)
          OR (c.role = 'school_leader' AND c.school_id = projects.school_id)
        )
    )
  );

-- PROJECT VOTES (Faqat cast_weekly_vote RPC orqali kiritiladi; foydalanuvchi o'z ovozini ko'radi)
CREATE POLICY "project_votes_self_read" ON public.project_votes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_approved_role('district_leader', auth.uid()));

-- PROJECT UPDATES
CREATE POLICY "project_updates_public_read" ON public.project_updates
  FOR SELECT USING (true);

CREATE POLICY "project_updates_authorized_insert" ON public.project_updates
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_updates.project_id
        AND (
          p.author_id = auth.uid()
          OR p.responsible_user_id = auth.uid()
          OR public.has_approved_role('district_leader', auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.coordinators c
            WHERE c.user_id = auth.uid() AND c.is_active = true
              AND (
                (c.role = 'school_leader' AND c.school_id = p.school_id)
                OR (c.role = 'district_coordinator' AND c.direction_id = p.direction_id)
                OR (c.role = 'school_coordinator' AND c.school_id = p.school_id AND c.direction_id = p.direction_id)
              )
          )
        )
    )
  );

-- PROJECT REPORTS
CREATE POLICY "project_reports_scoped_read" ON public.project_reports
  FOR SELECT TO authenticated
  USING (
    author_id = auth.uid()
    OR public.has_approved_role('district_leader', auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.coordinators c
      WHERE c.user_id = auth.uid() AND c.is_active = true
        AND (
          (c.role = 'district_coordinator' AND c.direction_id = project_reports.direction_id)
          OR (c.role IN ('school_leader', 'school_advisor') AND c.school_id = project_reports.school_id)
        )
    )
  );

CREATE POLICY "project_reports_authorized_insert" ON public.project_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.coordinators c
      WHERE c.user_id = auth.uid() AND c.is_active = true
        AND c.role IN ('school_coordinator', 'school_leader', 'district_coordinator', 'district_leader')
    )
  );

-- STUDENT INITIATIVES (Oddiy o'quvchi tashabbuslari)
CREATE POLICY "student_initiatives_read" ON public.student_initiatives
  FOR SELECT TO authenticated
  USING (
    author_id = auth.uid()
    OR public.has_approved_role('district_leader', auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.coordinators c
      WHERE c.user_id = auth.uid() AND c.is_active = true
        AND c.school_id = student_initiatives.school_id
        AND c.role IN ('school_leader', 'school_coordinator', 'school_advisor')
    )
  );

CREATE POLICY "student_initiatives_insert" ON public.student_initiatives
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "student_initiatives_school_leader_update" ON public.student_initiatives
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.coordinators c
      WHERE c.user_id = auth.uid() AND c.is_active = true
        AND c.school_id = student_initiatives.school_id
        AND c.role = 'school_leader'
    )
  );

-- GROUPS & MESSAGES (Faqat a'zolar, Tuman Lideri va Super Admin)
CREATE POLICY "groups_member_read" ON public.groups
  FOR SELECT TO authenticated
  USING (
    public.is_group_member(id, auth.uid())
    OR public.has_approved_role('district_leader', auth.uid())
  );

CREATE POLICY "group_members_member_read" ON public.group_members
  FOR SELECT TO authenticated
  USING (
    public.is_group_member(group_id, auth.uid())
    OR public.has_approved_role('district_leader', auth.uid())
  );

CREATE POLICY "group_messages_member_read" ON public.group_messages
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.is_group_member(group_id, auth.uid())
      OR public.has_approved_role('district_leader', auth.uid())
    )
  );

CREATE POLICY "group_messages_member_insert" ON public.group_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND public.is_group_member(group_id, auth.uid())
  );

CREATE POLICY "group_messages_author_or_manager_update" ON public.group_messages
  FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid() OR public.is_group_manager(group_id, auth.uid())
  );

-- EVENTS & ANNOUNCEMENTS
CREATE POLICY "events_public_read" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "events_authorized_write" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (
    organizer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.coordinators c
      WHERE c.user_id = auth.uid() AND c.is_active = true
        AND c.role IN ('school_leader', 'school_coordinator', 'district_coordinator', 'district_leader')
    )
  );

CREATE POLICY "announcements_public_read" ON public.announcements
  FOR SELECT USING (is_published = true);

CREATE POLICY "announcements_leaders_write" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.coordinators c
      WHERE c.user_id = auth.uid() AND c.is_active = true
        AND c.role IN ('school_leader', 'district_coordinator', 'district_leader')
    )
  );

-- COMMENTS
CREATE POLICY "comments_public_read" ON public.comments
  FOR SELECT USING (is_hidden = false);

CREATE POLICY "comments_auth_insert" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "comments_self_update" ON public.comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "comments_self_delete" ON public.comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- NOTIFICATIONS
CREATE POLICY "notifications_self_read" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_self_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RANKINGS & SETTINGS
CREATE POLICY "ranking_settings_public_read" ON public.ranking_settings
  FOR SELECT USING (true);

CREATE POLICY "school_rankings_public_read" ON public.school_rankings
  FOR SELECT USING (true);

CREATE POLICY "platform_settings_public_read" ON public.platform_settings
  FOR SELECT USING (true);

-- ACTIVITY LOGS (Faqat Super Admin - super_admin_all orqali, va Tuman Lideri ko'ra oladi)
CREATE POLICY "activity_logs_district_leader_read" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (public.has_approved_role('district_leader', auth.uid()));

-- ----------------------------------------------------------------------------
-- STORAGE BUCKETS (Xavfsiz media yuklash)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('project-media', 'project-media', true, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('group-files', 'group-files', false, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('documents', 'documents', true, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 0006_seed_official_data.sql
-- Rasmiy 365-son buyruq (2026-yil 25-sentabr) 2-ilovasiga muvofiq boshlang'ich
-- tizim ma'lumotlari:
-- 1. 7 ta rasmiy yo'nalish
-- 2. 8 ta rasmiy boshqaruv guruhi (7 yo'nalish + Kelajak Liderlari)
-- 3. Baliqchi tumanining 61 ta maktabi (raqamlangan shablon - admin tahrirlaydi)
-- 4. Standart reyting koeffitsiyentlari va platforma sozlamalari
-- ============================================================================

-- 1. RASMIY 7 TA YO'NALISH (Nizom 3-bob, 10-band asosida)
INSERT INTO public.directions (slug, name, short_name, description, duties_summary, icon_name, accent_color, sort_order)
VALUES
  (
    'talim',
    'Ta’lim',
    'Ta’lim',
    'O‘quvchilarning o‘zlashtirish darajasini ko‘tarish, ta’lim sifatini oshirish, fan va til to‘garaklari hamda akademik tashabbuslarni rivojlantirish.',
    'Bilimli, a’lochi o‘quvchilar orasidan saylanadi. Fan va til to‘garaklari, dars sifati bo‘yicha so‘rovlar va rahbariyatga takliflar kiritishni tashkil etadi.',
    'GraduationCap',
    'blue',
    1
  ),
  (
    'madaniyat',
    'Madaniyat',
    'Madaniyat',
    'Milliy urf-odat va qadriyatlarni asrab-avaylash, “Turon maktab teatri”, “Iqtidor maktab ansambli”, “Jadidlar izidan” tanlovlari hamda ijodiy tadbirlarni rivojlantirish.',
    'Iqtidorli va ijodkor o‘quvchilardan saylanadi. Madaniy tadbirlar, tarixiy obida va muzeylarga tashriflar, musiqa va san’at maktablariga yo‘naltirishni tashkil etadi.',
    'Palette',
    'violet',
    2
  ),
  (
    'it-va-suniy-intellekt',
    'IT va sun’iy intellekt',
    'IT va AI',
    'Kengash faoliyatini raqamlashtirish, zamonaviy platformalar, bot va saytlar yaratish, dasturlash va sun’iy intellekt to‘garaklarini rivojlantirish.',
    'Axborot texnologiyalari, sun’iy intellekt va dasturlashga qiziquvchi o‘quvchilardan saylanadi. “Kelajak” markazi tarmoq to‘garaklarini rivojlantirishga ko‘maklashadi.',
    'Cpu',
    'cyan',
    3
  ),
  (
    'sport',
    'Sport',
    'Sport',
    'O‘quvchilar o‘rtasida sportni keng targ‘ib qilish, ommalashtirish, sog‘lom turmush tarzini qaror toptirish va sport musobaqalarini tashkil etish.',
    'Sport bilan muntazam shug‘ullanadigan o‘quvchilardan saylanadi. Bolalar va o‘smirlar sport maktablariga yo‘naltirish va sport tadbirlarini muvofiqlashtiradi.',
    'Trophy',
    'emerald',
    4
  ),
  (
    'ekologiya',
    'Ekologiya',
    'Ekologiya',
    'Atrof-muhitni asrash, salomatlikni targ‘ib etish, chiqindilarni kamaytirish va qayta ishlash aksiyalari hamda “Eko-maktab” loyihalarini amalga oshirish.',
    'Tabiiy fanlar bo‘yicha bilimdon va faol jamoatchi o‘quvchilardan saylanadi. Ilmiy-amaliy konferensiyalar va ekologik aksiyalarni o‘tkazadi.',
    'Leaf',
    'teal',
    5
  ),
  (
    'media',
    'Media',
    'Media',
    'Maktab hayoti va Kengash faoliyatini yoritish, bolalar jurnalistikasi, matbuot xizmati, gazeta, jurnal, sayt va maktab radiosi faoliyatini yo‘lga qo‘yish.',
    'Ijodkor, qalami o‘tkir va notiq o‘quvchilardan saylanadi. Media jamoasini shakllantiradi, yangilik va tahliliy materiallar tayyorlaydi.',
    'Radio',
    'sky',
    6
  ),
  (
    'ijtimoiy-tashabbus',
    'Ijtimoiy tashabbus',
    'Ijtimoiy tashabbus',
    'O‘quvchilarning ijtimoiy g‘oya va tashabbuslarini aniqlash, jamoatchilik faoliyatiga jalb etish, xayriya va foydali ijtimoiy loyihalarni amalga oshirish.',
    'Tashabbuskor va faol o‘quvchilardan saylanadi. Tashabbuskor yoshlarni birlashtirib, ijtimoiy loyihalarni tashkil etish va amalga oshirishni muvofiqlashtiradi.',
    'HeartHandshake',
    'amber',
    7
  )
ON CONFLICT (slug) DO NOTHING;

-- 2. RASMIY 8 TA BOSHQARUV GURUHI (7 ta yo'nalish + 1 ta Kelajak Liderlari)
INSERT INTO public.groups (slug, name, description, group_type, direction_id)
SELECT
  d.slug || '-koordinatorlari',
  d.name || ' koordinatori guruhi',
  'Baliqchi tumanidagi 61 ta maktabning ' || d.name || ' yo‘nalishi koordinatorlari va Tuman yo‘nalish koordinatori muloqot hamda topshiriqlar maydoni.',
  'direction'::public.group_type,
  d.id
FROM public.directions d
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.groups (slug, name, description, group_type, direction_id)
VALUES (
  'kelajak-liderlari',
  'Kelajak Liderlari guruhi',
  'Baliqchi tumani 1 nafar Tuman Kelajak Lideri va 61 nafar Maktab Kelajak Liderlarining mustaqil boshqaruv, e’lonlar, topshiriqlar va hisobotlar guruhi.',
  'future_leaders'::public.group_type,
  NULL
)
ON CONFLICT (slug) DO NOTHING;

-- 3. BALIQCHI TUMANIDAGI 61 TA MAKTAB (Rasmiy raqamlangan shablon - Admin panelda tahrirlanadi)
INSERT INTO public.schools (school_number, name, slug, address, description)
SELECT
  n,
  n || '-sonli umumiy o‘rta ta’lim maktabi',
  'maktab-' || n,
  'Baliqchi tumani, Andijon viloyati',
  'Baliqchi tumani ' || n || '-sonli umumiy o‘rta ta’lim maktabi O‘quvchilar Kengashi raqamli profili.'
FROM generate_series(1, 61) AS n
ON CONFLICT (school_number) DO NOTHING;

-- 4. STANDART REYTING KOEFFITSIYENTLARI (Faqat ovozlarga emas, real faoliyatga asoslangan)
INSERT INTO public.ranking_settings (
  id,
  completed_projects_weight,
  in_progress_projects_weight,
  events_weight,
  reports_weight,
  direction_activity_weight,
  participation_weight
)
VALUES (1, 30.00, 12.00, 10.00, 8.00, 15.00, 2.00)
ON CONFLICT (id) DO NOTHING;

-- 5. PLATFORMA SOZLAMALARI
INSERT INTO public.platform_settings (key, value, description)
VALUES
  (
    'site_meta',
    '{"name": "Baliqchi tumani O‘quvchilar Kengashi", "region": "Baliqchi tumani, Andijon viloyati", "schools_count": 61, "slogan": "G‘oyadan — haqiqiy natijagacha: 61 maktab yoshlarining yagona tashabbus platformasi"}'::jsonb,
    'Platformaning asosiy nomlanishi va shiori'
  ),
  (
    'official_clubs',
    '["“Turon teatri” klubi", "“Iqtidor ansambli” klubi", "“Jadidlar izidan” klubi", "“Eco-Schools Uzbekistan” klubi", "“Kelajak uchun xorijiy til” klubi", "“Debat” klubi", "“Raqamli avlod qizlari” klubi"]'::jsonb,
    '365-son buyruq 2-ilovasidagi rasmiy 7 ta klub andozasi'
  ),
  (
    'voting_rules',
    '{"votes_per_week": 1, "require_verified_account": true, "auto_approve_winner": false}'::jsonb,
    'Haftalik ovoz berish qoidalari (o‘zgartirish faqat Super Admin)'
  )
ON CONFLICT (key) DO NOTHING;

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
