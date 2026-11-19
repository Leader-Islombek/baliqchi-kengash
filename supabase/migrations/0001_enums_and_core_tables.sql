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
