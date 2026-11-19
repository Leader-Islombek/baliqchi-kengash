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
