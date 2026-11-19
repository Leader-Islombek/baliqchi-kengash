import type { AppRole, CurrentUserContext } from "@/types/database";

// ============================================================================
// RBAC — 7 ta Rol uchun Ruxsatlar Tizimi
// Super Administrator (super_admin) tizimda CHEKSIZ ruxsatga ega.
// ============================================================================

export type Permission =
  | "project:create"
  | "project:moderate"
  | "project:review_winner"
  | "project:approve_implementation"
  | "project:update_progress"
  | "project:delete_any"
  | "vote:cast"
  | "voting:manage_weeks"
  | "voting:resolve_tie"
  | "school:manage_own"
  | "school:manage_all"
  | "direction:manage_all"
  | "group:access_direction"
  | "group:access_future_leaders"
  | "group:manage_all"
  | "event:create"
  | "announcement:create"
  | "report:create"
  | "report:review"
  | "ranking:recalculate"
  | "ranking:edit_weights"
  | "users:manage_all"
  | "users:view_private_phone"
  | "roles:approve"
  | "audit:view"
  | "settings:manage"
  | "admin:access";

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  student: ["vote:cast"],
  school_coordinator: [
    "vote:cast",
    "project:create",
    "project:update_progress",
    "group:access_direction",
    "event:create",
    "report:create",
  ],
  school_leader: [
    "vote:cast",
    "project:create",
    "project:update_progress",
    "school:manage_own",
    "group:access_future_leaders",
    "event:create",
    "announcement:create",
    "report:create",
    "report:review",
  ],
  school_advisor: ["report:review", "project:review_winner"],
  district_coordinator: [
    "vote:cast",
    "project:create",
    "project:review_winner",
    "project:update_progress",
    "group:access_direction",
    "event:create",
    "announcement:create",
    "report:create",
    "report:review",
  ],
  district_leader: [
    "vote:cast",
    "project:create",
    "project:review_winner",
    "project:approve_implementation",
    "project:update_progress",
    "group:access_direction",
    "group:access_future_leaders",
    "event:create",
    "announcement:create",
    "report:create",
    "report:review",
    "ranking:recalculate",
    "audit:view",
  ],
  super_admin: [
    "project:create",
    "project:moderate",
    "project:review_winner",
    "project:approve_implementation",
    "project:update_progress",
    "project:delete_any",
    "vote:cast",
    "voting:manage_weeks",
    "voting:resolve_tie",
    "school:manage_own",
    "school:manage_all",
    "direction:manage_all",
    "group:access_direction",
    "group:access_future_leaders",
    "group:manage_all",
    "event:create",
    "announcement:create",
    "report:create",
    "report:review",
    "ranking:recalculate",
    "ranking:edit_weights",
    "users:manage_all",
    "users:view_private_phone",
    "roles:approve",
    "audit:view",
    "settings:manage",
    "admin:access",
  ],
};

export function hasPermission(ctx: CurrentUserContext | null, permission: Permission): boolean {
  if (!ctx) return false;
  // Super Admin istalgan amalni bajara oladi
  if (ctx.isSuperAdmin) return true;

  // Qo'shimcha vakolat berilgan oddiy o'quvchi loyiha joylay oladi
  if (permission === "project:create" && ctx.user.can_submit_projects) {
    return true;
  }

  const approvedRoles = ctx.roles
    .filter((r) => r.status === "approved")
    .map((r) => r.role);

  if (approvedRoles.length === 0) {
    approvedRoles.push("student");
  }

  return approvedRoles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
}

export function getPrimaryRole(roles: AppRole[]): AppRole {
  const priority: AppRole[] = [
    "super_admin",
    "district_leader",
    "district_coordinator",
    "school_leader",
    "school_advisor",
    "school_coordinator",
    "student",
  ];
  for (const r of priority) {
    if (roles.includes(r)) return r;
  }
  return "student";
}
