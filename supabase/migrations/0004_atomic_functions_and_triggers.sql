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
