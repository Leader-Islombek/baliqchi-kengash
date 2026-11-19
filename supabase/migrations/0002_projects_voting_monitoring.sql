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
