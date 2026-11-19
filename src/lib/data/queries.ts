import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  OFFICIAL_DIRECTIONS,
  OFFICIAL_SCHOOLS_TEMPLATE,
} from "@/lib/constants/official-data";
import { getPrimaryRole } from "@/lib/auth/permissions";
import type {
  ActivityLog,
  AnnouncementItem,
  ClassRepresentative,
  CommentItem,
  CoordinatorRecord,
  CurrentUserContext,
  Direction,
  EventItem,
  Group,
  GroupMessage,
  NotificationItem,
  PlatformStats,
  Project,
  ProjectReport,
  ProjectStatus,
  ProjectUpdate,
  RankingPeriod,
  RankingSettings,
  School,
  SchoolClub,
  SchoolRanking,
  UserProfile,
  UserRoleRecord,
  VotingWeek,
} from "@/types/database";

// ============================================================================
// 1. JORIY FOYDALANUVCHI KONTEKSTI VA ROLLARI
// ============================================================================
export async function getCurrentUserContext(): Promise<CurrentUserContext | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const [{ data: profile }, { data: roles }, { data: assignments }, { count: unreadCount }] =
    await Promise.all([
      supabase
        .from("users")
        .select("*, school:schools(id, school_number, name, slug)")
        .eq("id", authUser.id)
        .maybeSingle(),
      supabase
        .from("user_roles")
        .select("*, school:schools(id, school_number, name), direction:directions(id, name, slug)")
        .eq("user_id", authUser.id),
      supabase
        .from("coordinators")
        .select(
          "*, school:schools(id, school_number, name, slug), direction:directions(id, name, slug, icon_name, accent_color)"
        )
        .eq("user_id", authUser.id)
        .eq("is_active", true),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", authUser.id)
        .eq("is_read", false),
    ]);

  if (!profile) return null;

  const roleRecords = (roles || []) as UserRoleRecord[];
  const approvedRoles = roleRecords
    .filter((r) => r.status === "approved")
    .map((r) => r.role);

  const primaryRole = getPrimaryRole(approvedRoles);

  return {
    user: profile as UserProfile,
    roles: roleRecords,
    primaryRole,
    isSuperAdmin: approvedRoles.includes("super_admin"),
    isDistrictLeader: approvedRoles.includes("district_leader"),
    isDistrictCoordinator: approvedRoles.includes("district_coordinator"),
    isSchoolLeader: approvedRoles.includes("school_leader"),
    isSchoolCoordinator: approvedRoles.includes("school_coordinator"),
    isSchoolAdvisor: approvedRoles.includes("school_advisor"),
    activeAssignments: (assignments || []) as CoordinatorRecord[],
    unreadNotificationsCount: unreadCount || 0,
  };
}

// ============================================================================
// 2. HAQIQIY STATISTIKA (Hech qachon soxta demo raqam ko'rsatilmaydi!)
// ============================================================================
export async function getPlatformStats(): Promise<PlatformStats> {
  if (!isSupabaseConfigured()) {
    return {
      schoolsCount: 61,
      registeredStudentsCount: 0,
      councilMembersCount: 0,
      coordinatorsCount: 0,
      totalProjectsCount: 0,
      completedProjectsCount: 0,
      inProgressProjectsCount: 0,
      eventsCount: 0,
      isDatabaseConnected: false,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      schoolsCount: 61,
      registeredStudentsCount: 0,
      councilMembersCount: 0,
      coordinatorsCount: 0,
      totalProjectsCount: 0,
      completedProjectsCount: 0,
      inProgressProjectsCount: 0,
      eventsCount: 0,
      isDatabaseConnected: false,
    };
  }

  const [
    schoolsRes,
    usersRes,
    coordinatorsRes,
    classRepsRes,
    projectsRes,
    completedRes,
    inProgressRes,
    eventsRes,
  ] = await Promise.all([
    supabase.from("schools").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("account_status", "active"),
    supabase.from("coordinators").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("class_representatives")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .not("status", "in", '("draft","rejected")'),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("events").select("*", { count: "exact", head: true }),
  ]);

  const coordinatorsCount = coordinatorsRes.count || 0;
  const classRepsCount = classRepsRes.count || 0;

  return {
    schoolsCount: schoolsRes.count || 61,
    registeredStudentsCount: usersRes.count || 0,
    councilMembersCount: coordinatorsCount + classRepsCount,
    coordinatorsCount,
    totalProjectsCount: projectsRes.count || 0,
    completedProjectsCount: completedRes.count || 0,
    inProgressProjectsCount: inProgressRes.count || 0,
    eventsCount: eventsRes.count || 0,
    isDatabaseConnected: !schoolsRes.error,
  };
}

// ============================================================================
// 3. YO'NALISHLAR VA 61 TA MAKTAB
// ============================================================================
export async function getDirections(): Promise<Direction[]> {
  if (!isSupabaseConfigured()) return OFFICIAL_DIRECTIONS;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return OFFICIAL_DIRECTIONS;

  const { data, error } = await supabase
    .from("directions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return OFFICIAL_DIRECTIONS;
  return data as Direction[];
}

export async function getDirectionBySlug(slug: string): Promise<Direction | null> {
  const directions = await getDirections();
  return directions.find((d) => d.slug === slug) || null;
}

export async function getSchools(): Promise<School[]> {
  if (!isSupabaseConfigured()) return OFFICIAL_SCHOOLS_TEMPLATE;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return OFFICIAL_SCHOOLS_TEMPLATE;

  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .eq("is_active", true)
    .order("school_number", { ascending: true });

  if (error || !data || data.length === 0) return OFFICIAL_SCHOOLS_TEMPLATE;
  return data as School[];
}

export async function getSchoolBySlugOrNumber(slugOrId: string): Promise<{
  school: School | null;
  coordinators: CoordinatorRecord[];
  classReps: ClassRepresentative[];
  clubs: SchoolClub[];
  projects: Project[];
  events: EventItem[];
  announcements: AnnouncementItem[];
  studentsCount: number;
  ranking: SchoolRanking | null;
}> {
  const emptyResult = {
    school: null,
    coordinators: [],
    classReps: [],
    clubs: [],
    projects: [],
    events: [],
    announcements: [],
    studentsCount: 0,
    ranking: null,
  };

  if (!isSupabaseConfigured()) {
    const found =
      OFFICIAL_SCHOOLS_TEMPLATE.find(
        (s) =>
          s.slug === slugOrId ||
          s.id === slugOrId ||
          String(s.school_number) === slugOrId
      ) || null;
    return { ...emptyResult, school: found };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return emptyResult;

  const isNumeric = /^\d+$/.test(slugOrId);
  let schoolQuery = supabase.from("schools").select("*");
  if (isNumeric) {
    schoolQuery = schoolQuery.eq("school_number", Number(slugOrId));
  } else if (/^[0-9a-f-]{36}$/i.test(slugOrId)) {
    schoolQuery = schoolQuery.eq("id", slugOrId);
  } else {
    schoolQuery = schoolQuery.eq("slug", slugOrId);
  }

  const { data: school } = await schoolQuery.maybeSingle();
  if (!school) return emptyResult;

  const [coordsRes, repsRes, clubsRes, projectsRes, eventsRes, newsRes, studentsRes, rankRes] =
    await Promise.all([
      supabase
        .from("coordinators")
        .select(
          "*, user:users(id, first_name, last_name, grade, avatar_url), direction:directions(id, name, slug, icon_name, accent_color)"
        )
        .eq("school_id", school.id)
        .eq("is_active", true),
      supabase
        .from("class_representatives")
        .select("*")
        .eq("school_id", school.id)
        .eq("is_active", true)
        .order("grade", { ascending: true }),
      supabase
        .from("school_clubs")
        .select("*")
        .eq("school_id", school.id)
        .eq("is_active", true),
      supabase
        .from("projects")
        .select(
          "*, direction:directions(id, name, slug, icon_name, accent_color), author:users!projects_author_id_fkey(id, first_name, last_name, grade)"
        )
        .eq("school_id", school.id)
        .not("status", "in", '("draft","rejected")')
        .order("created_at", { ascending: false }),
      supabase
        .from("events")
        .select("*, direction:directions(id, name, slug)")
        .eq("school_id", school.id)
        .order("starts_at", { ascending: false })
        .limit(12),
      supabase
        .from("announcements")
        .select("*")
        .eq("school_id", school.id)
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(8),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("school_id", school.id)
        .eq("account_status", "active"),
      supabase
        .from("school_rankings")
        .select("*")
        .eq("school_id", school.id)
        .eq("period_type", "overall")
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  return {
    school: school as School,
    coordinators: (coordsRes.data || []) as CoordinatorRecord[],
    classReps: (repsRes.data || []) as ClassRepresentative[],
    clubs: (clubsRes.data || []) as SchoolClub[],
    projects: (projectsRes.data || []) as Project[],
    events: (eventsRes.data || []) as EventItem[],
    announcements: (newsRes.data || []) as AnnouncementItem[],
    studentsCount: studentsRes.count || 0,
    ranking: (rankRes.data as SchoolRanking) || null,
  };
}

// ============================================================================
// 4. LOYIHALAR, HAFTALIK OVOZ BERISH VA MONITORING
// ============================================================================
export async function getProjects(filters?: {
  status?: ProjectStatus | ProjectStatus[];
  directionId?: string;
  schoolId?: string;
  votingWeekId?: string;
  search?: string;
  limit?: number;
  includeAllStatuses?: boolean;
}): Promise<Project[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  let query = supabase
    .from("projects")
    .select(
      "*, school:schools(id, school_number, name, slug), direction:directions(id, name, slug, icon_name, accent_color), author:users!projects_author_id_fkey(id, first_name, last_name, grade, avatar_url), responsible:users!projects_responsible_user_id_fkey(id, first_name, last_name, avatar_url)"
    );

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in("status", filters.status);
    } else {
      query = query.eq("status", filters.status);
    }
  } else if (!filters?.includeAllStatuses) {
    query = query.in("status", [
      "voting",
      "weekly_winner",
      "under_review",
      "approved",
      "in_progress",
      "completed",
    ]);
  }

  if (filters?.directionId) query = query.eq("direction_id", filters.directionId);
  if (filters?.schoolId) query = query.eq("school_id", filters.schoolId);
  if (filters?.votingWeekId) query = query.eq("voting_week_id", filters.votingWeekId);
  if (filters?.search) query = query.ilike("title", `%${filters.search}%`);

  query = query.order("votes_count", { ascending: false }).order("created_at", { ascending: false });

  if (filters?.limit) query = query.limit(filters.limit);

  const { data } = await query;
  return (data || []) as Project[];
}

export async function getProjectBySlug(slug: string): Promise<{
  project: Project | null;
  updates: ProjectUpdate[];
  comments: CommentItem[];
}> {
  if (!isSupabaseConfigured()) return { project: null, updates: [], comments: [] };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { project: null, updates: [], comments: [] };

  const { data: project } = await supabase
    .from("projects")
    .select(
      "*, school:schools(id, school_number, name, slug), direction:directions(id, name, slug, icon_name, accent_color), author:users!projects_author_id_fkey(id, first_name, last_name, grade, avatar_url), responsible:users!projects_responsible_user_id_fkey(id, first_name, last_name, avatar_url)"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!project) return { project: null, updates: [], comments: [] };

  const [updatesRes, commentsRes] = await Promise.all([
    supabase
      .from("project_updates")
      .select("*, author:users(id, first_name, last_name, avatar_url)")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("comments")
      .select("*, user:users(id, first_name, last_name, grade, avatar_url, school_id)")
      .eq("project_id", project.id)
      .eq("is_hidden", false)
      .order("created_at", { ascending: true }),
  ]);

  return {
    project: project as Project,
    updates: (updatesRes.data || []) as ProjectUpdate[],
    comments: (commentsRes.data || []) as CommentItem[],
  };
}

export async function getActiveVotingData(userId?: string | null): Promise<{
  activeWeek: VotingWeek | null;
  nominees: Project[];
  userVotedProjectId: string | null;
  totalVotesInWeek: number;
}> {
  if (!isSupabaseConfigured()) {
    return { activeWeek: null, nominees: [], userVotedProjectId: null, totalVotesInWeek: 0 };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { activeWeek: null, nominees: [], userVotedProjectId: null, totalVotesInWeek: 0 };
  }

  const { data: activeWeek } = await supabase
    .from("voting_weeks")
    .select("*")
    .eq("status", "active")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!activeWeek) {
    return { activeWeek: null, nominees: [], userVotedProjectId: null, totalVotesInWeek: 0 };
  }

  const [nomineesRes, userVoteRes] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "*, school:schools(id, school_number, name, slug), direction:directions(id, name, slug, icon_name, accent_color), author:users!projects_author_id_fkey(id, first_name, last_name, grade)"
      )
      .eq("voting_week_id", activeWeek.id)
      .eq("status", "voting")
      .order("votes_count", { ascending: false }),
    userId
      ? supabase
          .from("project_votes")
          .select("project_id")
          .eq("voting_week_id", activeWeek.id)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const nominees = (nomineesRes.data || []) as Project[];
  const totalVotesInWeek = nominees.reduce((sum, p) => sum + (p.votes_count || 0), 0);

  return {
    activeWeek: activeWeek as VotingWeek,
    nominees,
    userVotedProjectId: userVoteRes.data?.project_id || null,
    totalVotesInWeek,
  };
}

export async function getWeeklyWinnersArchive(): Promise<
  Array<VotingWeek & { winner_project?: Project | null }>
> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("voting_weeks")
    .select(
      "*, winner_project:projects!fk_voting_weeks_winner_project(*, school:schools(id, school_number, name, slug), direction:directions(id, name, slug, icon_name, accent_color), author:users!projects_author_id_fkey(id, first_name, last_name))"
    )
    .eq("status", "finalized")
    .order("ends_at", { ascending: false });

  return (data || []) as Array<VotingWeek & { winner_project?: Project | null }>;
}

export async function getRecentProjectUpdates(limit = 6): Promise<ProjectUpdate[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("project_updates")
    .select(
      "*, author:users(id, first_name, last_name, avatar_url), project:projects(id, slug, title, status, school_id, direction_id)"
    )
    .eq("show_on_homepage", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []) as ProjectUpdate[];
}

// ============================================================================
// 5. REYTINGLAR, YANGILIKLAR, TADBIRLAR, KOORDINATORLAR, GURUHLAR
// ============================================================================
export async function getSchoolRankings(
  periodType: RankingPeriod = "overall",
  limit = 61
): Promise<SchoolRanking[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("school_rankings")
    .select("*, school:schools(id, school_number, name, slug)")
    .eq("period_type", periodType)
    .order("rank_position", { ascending: true })
    .limit(limit);

  return (data || []) as SchoolRanking[];
}

export async function getRankingSettings(): Promise<RankingSettings> {
  const defaults: RankingSettings = {
    id: 1,
    completed_projects_weight: 30,
    in_progress_projects_weight: 12,
    events_weight: 10,
    reports_weight: 8,
    direction_activity_weight: 15,
    participation_weight: 2,
    updated_at: new Date().toISOString(),
  };
  if (!isSupabaseConfigured()) return defaults;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return defaults;

  const { data } = await supabase.from("ranking_settings").select("*").eq("id", 1).maybeSingle();
  return (data as RankingSettings) || defaults;
}

export async function getAnnouncements(limit = 12): Promise<AnnouncementItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("announcements")
    .select("*, school:schools(id, school_number, name, slug), direction:directions(id, name, slug)")
    .eq("is_published", true)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data || []) as AnnouncementItem[];
}

export async function getAnnouncementBySlug(slug: string): Promise<AnnouncementItem | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("announcements")
    .select("*, school:schools(id, school_number, name, slug), direction:directions(id, name, slug)")
    .eq("slug", slug)
    .maybeSingle();

  return (data as AnnouncementItem) || null;
}

export async function getEvents(limit = 20): Promise<EventItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("events")
    .select("*, school:schools(id, school_number, name, slug), direction:directions(id, name, slug)")
    .order("starts_at", { ascending: false })
    .limit(limit);

  return (data || []) as EventItem[];
}

export async function getEventBySlug(slug: string): Promise<EventItem | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("events")
    .select("*, school:schools(id, school_number, name, slug), direction:directions(id, name, slug)")
    .eq("slug", slug)
    .maybeSingle();

  return (data as EventItem) || null;
}

export async function getCoordinators(roles?: string[]): Promise<CoordinatorRecord[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  let query = supabase
    .from("coordinators")
    .select(
      "*, user:users(id, first_name, last_name, grade, avatar_url), school:schools(id, school_number, name, slug), direction:directions(id, name, slug, icon_name, accent_color)"
    )
    .eq("is_active", true);

  if (roles && roles.length > 0) {
    query = query.in("role", roles);
  }

  const { data } = await query.order("appointed_at", { ascending: false });
  return (data || []) as CoordinatorRecord[];
}

export async function getUserGroups(): Promise<Group[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("groups")
    .select(
      "*, manager:users!groups_manager_id_fkey(id, first_name, last_name, avatar_url), direction:directions(id, name, slug, icon_name, accent_color)"
    )
    .eq("is_active", true)
    .order("group_type", { ascending: false })
    .order("name", { ascending: true });

  return (data || []) as Group[];
}

export async function getGroupDetails(slug: string): Promise<{
  group: Group | null;
  messages: GroupMessage[];
  members: Array<{
    id: string;
    member_role: string;
    joined_at: string;
    user: Pick<UserProfile, "id" | "first_name" | "last_name" | "grade" | "avatar_url" | "school_id"> & {
      school?: Pick<School, "school_number" | "name"> | null;
    };
  }>;
}> {
  if (!isSupabaseConfigured()) return { group: null, messages: [], members: [] };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { group: null, messages: [], members: [] };

  const { data: group } = await supabase
    .from("groups")
    .select(
      "*, manager:users!groups_manager_id_fkey(id, first_name, last_name, avatar_url), direction:directions(id, name, slug, icon_name, accent_color)"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!group) return { group: null, messages: [], members: [] };

  const [messagesRes, membersRes] = await Promise.all([
    supabase
      .from("group_messages")
      .select("*, author:users(id, first_name, last_name, avatar_url, school_id)")
      .eq("group_id", group.id)
      .is("deleted_at", null)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("group_members")
      .select(
        "id, member_role, joined_at, user:users(id, first_name, last_name, grade, avatar_url, school_id, school:schools(school_number, name))"
      )
      .eq("group_id", group.id)
      .order("member_role", { ascending: true }),
  ]);

  return {
    group: group as Group,
    messages: (messagesRes.data || []) as GroupMessage[],
    members: (membersRes.data || []) as unknown as Array<{
      id: string;
      member_role: string;
      joined_at: string;
      user: Pick<UserProfile, "id" | "first_name" | "last_name" | "grade" | "avatar_url" | "school_id"> & {
        school?: Pick<School, "school_number" | "name"> | null;
      };
    }>,
  };
}

export async function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data || []) as NotificationItem[];
}

export async function getReports(limit = 30): Promise<ProjectReport[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("project_reports")
    .select(
      "*, school:schools(id, school_number, name), direction:directions(id, name, slug), author:users!project_reports_author_id_fkey(id, first_name, last_name)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []) as ProjectReport[];
}

export async function getAdminOverviewData() {
  if (!isSupabaseConfigured()) {
    return {
      pendingRoles: [] as UserRoleRecord[],
      users: [] as Array<UserProfile & { phone_e164?: string | null }>,
      projects: [] as Project[],
      votingWeeks: [] as VotingWeek[],
      logs: [] as ActivityLog[],
      schools: OFFICIAL_SCHOOLS_TEMPLATE,
      directions: OFFICIAL_DIRECTIONS,
      rankingSettings: await getRankingSettings(),
    };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      pendingRoles: [] as UserRoleRecord[],
      users: [] as Array<UserProfile & { phone_e164?: string | null }>,
      projects: [] as Project[],
      votingWeeks: [] as VotingWeek[],
      logs: [] as ActivityLog[],
      schools: OFFICIAL_SCHOOLS_TEMPLATE,
      directions: OFFICIAL_DIRECTIONS,
      rankingSettings: await getRankingSettings(),
    };
  }

  const [pendingRolesRes, usersRes, privateRes, projectsRes, weeksRes, logsRes, schoolsRes, dirsRes, weights] =
    await Promise.all([
      supabase
        .from("user_roles")
        .select(
          "*, user:users!user_roles_user_id_fkey(id, first_name, last_name, grade, school_id), school:schools(id, school_number, name), direction:directions(id, name, slug)"
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("users")
        .select("*, school:schools(id, school_number, name, slug)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("user_private_details").select("user_id, phone_e164"),
      supabase
        .from("projects")
        .select(
          "*, school:schools(id, school_number, name, slug), direction:directions(id, name, slug, icon_name, accent_color), author:users!projects_author_id_fkey(id, first_name, last_name, grade)"
        )
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("voting_weeks").select("*").order("starts_at", { ascending: false }),
      supabase
        .from("activity_logs")
        .select("*, actor:users(id, first_name, last_name)")
        .order("created_at", { ascending: false })
        .limit(80),
      supabase.from("schools").select("*").order("school_number", { ascending: true }),
      supabase.from("directions").select("*").order("sort_order", { ascending: true }),
      getRankingSettings(),
    ]);

  const phoneMap = new Map<string, string>();
  (privateRes.data || []).forEach((row: { user_id: string; phone_e164: string }) => {
    phoneMap.set(row.user_id, row.phone_e164);
  });

  const mergedUsers = ((usersRes.data || []) as UserProfile[]).map((u) => ({
    ...u,
    phone_e164: phoneMap.get(u.id) || null,
  }));

  return {
    pendingRoles: (pendingRolesRes.data || []) as UserRoleRecord[],
    users: mergedUsers,
    projects: (projectsRes.data || []) as Project[],
    votingWeeks: (weeksRes.data || []) as VotingWeek[],
    logs: (logsRes.data || []) as ActivityLog[],
    schools: ((schoolsRes.data || []) as School[]).length > 0 ? (schoolsRes.data as School[]) : OFFICIAL_SCHOOLS_TEMPLATE,
    directions: ((dirsRes.data || []) as Direction[]).length > 0 ? (dirsRes.data as Direction[]) : OFFICIAL_DIRECTIONS,
    rankingSettings: weights,
  };
}
