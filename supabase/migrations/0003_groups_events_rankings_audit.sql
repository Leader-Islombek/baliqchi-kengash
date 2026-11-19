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
