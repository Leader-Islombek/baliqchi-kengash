// ============================================================================
// Baliqchi tumani O'quvchilar Kengashi — Domen va Ma'lumotlar Bazasi Turlari
// ============================================================================

export type AppRole =
  | "student"
  | "school_coordinator"
  | "school_leader"
  | "district_coordinator"
  | "district_leader"
  | "school_advisor"
  | "super_admin";

export type AccountStatus = "pending" | "active" | "suspended" | "rejected";
export type RoleRequestStatus = "pending" | "approved" | "rejected" | "revoked";

export type ProjectStatus =
  | "draft"
  | "submitted"
  | "moderation"
  | "voting"
  | "weekly_winner"
  | "under_review"
  | "approved"
  | "in_progress"
  | "completed"
  | "rejected";

export type GroupType = "direction" | "future_leaders";
export type EventStatus = "planned" | "ongoing" | "completed" | "cancelled";
export type RankingPeriod = "weekly" | "monthly" | "overall";

export interface School {
  id: string;
  school_number: number;
  name: string;
  slug: string;
  address: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Direction {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  description: string;
  duties_summary: string | null;
  icon_name: string;
  accent_color: string;
  sort_order: number;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  school_id: string | null;
  grade: number | null;
  class_letter: string | null;
  avatar_url: string | null;
  bio: string | null;
  can_submit_projects: boolean;
  account_status: AccountStatus;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  school?: Pick<School, "id" | "school_number" | "name" | "slug"> | null;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: AppRole;
  school_id: string | null;
  direction_id: string | null;
  status: RoleRequestStatus;
  request_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  user?: Pick<UserProfile, "id" | "first_name" | "last_name" | "grade" | "school_id"> | null;
  school?: Pick<School, "id" | "school_number" | "name"> | null;
  direction?: Pick<Direction, "id" | "name" | "slug"> | null;
}

export interface CoordinatorRecord {
  id: string;
  user_id: string;
  role: AppRole;
  school_id: string | null;
  direction_id: string | null;
  appointed_at: string;
  term_end: string | null;
  is_active: boolean;
  notes: string | null;
  user?: Pick<UserProfile, "id" | "first_name" | "last_name" | "grade" | "avatar_url"> | null;
  school?: Pick<School, "id" | "school_number" | "name" | "slug"> | null;
  direction?: Pick<Direction, "id" | "name" | "slug" | "icon_name" | "accent_color"> | null;
}

export interface ClassRepresentative {
  id: string;
  school_id: string;
  user_id: string | null;
  full_name: string;
  grade: number;
  class_letter: string;
  academic_year: string;
  is_active: boolean;
}

export interface SchoolClub {
  id: string;
  school_id: string;
  direction_id: string | null;
  name: string;
  description: string | null;
  mentor_name: string | null;
  leader_user_id: string | null;
  is_active: boolean;
  members_count?: number;
}

export interface VotingWeek {
  id: string;
  week_code: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  status: "upcoming" | "active" | "closed" | "finalized";
  winner_project_id: string | null;
  is_tie_resolved: boolean;
  tie_resolution_note: string | null;
  finalized_by: string | null;
  finalized_at: string | null;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  due_date?: string;
  completed: boolean;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  direction_id: string;
  school_id: string;
  author_id: string;
  problem_statement: string;
  goal: string;
  proposed_solution: string;
  implementation_plan: string;
  expected_result: string;
  required_resources: string;
  duration_text: string;
  cover_image_url: string | null;
  media_urls: string[];
  status: ProjectStatus;
  voting_week_id: string | null;
  votes_count: number;
  responsible_user_id: string | null;
  progress_percent: number;
  milestones: ProjectMilestone[];
  final_results_summary: string | null;
  moderation_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  school?: Pick<School, "id" | "school_number" | "name" | "slug"> | null;
  direction?: Pick<Direction, "id" | "name" | "slug" | "icon_name" | "accent_color"> | null;
  author?: Pick<UserProfile, "id" | "first_name" | "last_name" | "grade" | "avatar_url"> | null;
  responsible?: Pick<UserProfile, "id" | "first_name" | "last_name" | "avatar_url"> | null;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  author_id: string;
  title: string;
  content: string;
  progress_percent: number;
  results_achieved: string | null;
  challenges: string | null;
  media_urls: string[];
  show_on_homepage: boolean;
  created_at: string;
  author?: Pick<UserProfile, "id" | "first_name" | "last_name" | "avatar_url"> | null;
  project?: Pick<Project, "id" | "slug" | "title" | "status" | "school_id" | "direction_id"> | null;
}

export interface ProjectReport {
  id: string;
  project_id: string | null;
  school_id: string | null;
  direction_id: string | null;
  author_id: string;
  period_label: string;
  summary: string;
  metrics: Record<string, unknown>;
  attachment_urls: string[];
  status: "submitted" | "reviewed" | "approved" | "needs_revision";
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  school?: Pick<School, "id" | "school_number" | "name"> | null;
  direction?: Pick<Direction, "id" | "name" | "slug"> | null;
  author?: Pick<UserProfile, "id" | "first_name" | "last_name"> | null;
}

export interface Group {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  group_type: GroupType;
  direction_id: string | null;
  manager_id: string | null;
  is_active: boolean;
  members_count?: number;
  manager?: Pick<UserProfile, "id" | "first_name" | "last_name" | "avatar_url"> | null;
  direction?: Pick<Direction, "id" | "name" | "slug" | "icon_name" | "accent_color"> | null;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  author_id: string;
  message_type: "message" | "announcement" | "task" | "report";
  title: string | null;
  content: string;
  attachments: { name: string; url: string; type?: string }[];
  is_pinned: boolean;
  is_edited: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Pick<UserProfile, "id" | "first_name" | "last_name" | "avatar_url" | "school_id"> | null;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  school_id: string | null;
  direction_id: string | null;
  organizer_id: string;
  location: string;
  starts_at: string;
  ends_at: string | null;
  status: EventStatus;
  cover_image_url: string | null;
  media_urls: string[];
  participants_count: number;
  is_featured: boolean;
  created_at: string;
  school?: Pick<School, "id" | "school_number" | "name" | "slug"> | null;
  direction?: Pick<Direction, "id" | "name" | "slug"> | null;
}

export interface AnnouncementItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: "news" | "announcement" | "charter_update";
  scope: "district" | "school" | "direction";
  school_id: string | null;
  direction_id: string | null;
  author_id: string;
  cover_image_url: string | null;
  media_urls: string[];
  is_pinned: boolean;
  is_published: boolean;
  published_at: string;
  created_at: string;
  school?: Pick<School, "id" | "school_number" | "name" | "slug"> | null;
  direction?: Pick<Direction, "id" | "name" | "slug"> | null;
}

export interface CommentItem {
  id: string;
  project_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_hidden: boolean;
  created_at: string;
  user?: Pick<UserProfile, "id" | "first_name" | "last_name" | "grade" | "avatar_url" | "school_id"> | null;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SchoolRanking {
  id: string;
  school_id: string;
  period_type: RankingPeriod;
  period_key: string;
  rank_position: number;
  total_score: number;
  metrics_breakdown: {
    completed_projects?: number;
    active_projects?: number;
    events_count?: number;
    reports_count?: number;
    active_directions?: number;
    active_students?: number;
  };
  calculated_at: string;
  school?: Pick<School, "id" | "school_number" | "name" | "slug"> | null;
}

export interface RankingSettings {
  id: number;
  completed_projects_weight: number;
  in_progress_projects_weight: number;
  events_weight: number;
  reports_weight: number;
  direction_activity_weight: number;
  participation_weight: number;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
  actor?: Pick<UserProfile, "id" | "first_name" | "last_name"> | null;
}

export interface PlatformStats {
  schoolsCount: number;
  registeredStudentsCount: number;
  councilMembersCount: number;
  coordinatorsCount: number;
  totalProjectsCount: number;
  completedProjectsCount: number;
  inProgressProjectsCount: number;
  eventsCount: number;
  isDatabaseConnected: boolean;
}

export interface CurrentUserContext {
  user: UserProfile;
  roles: UserRoleRecord[];
  primaryRole: AppRole;
  isSuperAdmin: boolean;
  isDistrictLeader: boolean;
  isDistrictCoordinator: boolean;
  isSchoolLeader: boolean;
  isSchoolCoordinator: boolean;
  isSchoolAdvisor: boolean;
  activeAssignments: CoordinatorRecord[];
  unreadNotificationsCount: number;
}
