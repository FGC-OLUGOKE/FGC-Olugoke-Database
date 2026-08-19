/**
 * Central permission logic for the three-role system (Super Admin,
 * Category Admin, Department Admin). Every function here is pure —
 * it only looks at a `user` object ({ role, scope }) and doesn't
 * care where that user came from. That's deliberate: swapping the
 * mock auth in features/auth/api.js for real backend auth later
 * means this file doesn't change at all, since real auth will still
 * hand back a user with the same { role, scope } shape.
 *
 * Current scope of what's implemented (see conversation for the
 * full plan): view/create scoping for Members, nav + route
 * restriction, and Dashboard data scoping. NOT yet implemented:
 * Category Admin's edit/delete approval-request *submission* (the
 * review side exists — see features/approvals — but nothing creates
 * new requests yet), and Department Admin's "assign existing member"
 * flow. Both are flagged as next steps.
 */

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  CATEGORY_ADMIN: "category_admin",
  DEPARTMENT_ADMIN: "department_admin",
};

export function isSuperAdmin(user) {
  return user?.role === ROLES.SUPER_ADMIN;
}

export function isCategoryAdmin(user) {
  return user?.role === ROLES.CATEGORY_ADMIN;
}

export function isDepartmentAdmin(user) {
  return user?.role === ROLES.DEPARTMENT_ADMIN;
}

/** Members visible to this user, scoped by role. */
export function getScopedMembers(user, members) {
  if (!user) return [];
  if (isSuperAdmin(user)) return members;
  if (isCategoryAdmin(user)) return members.filter((m) => m.category === user.scope);
  if (isDepartmentAdmin(user)) return members.filter((m) => m.departments.includes(user.scope));
  return [];
}

/** Departments visible to this user, scoped by role. */
export function getScopedDepartments(user, departments) {
  if (!user) return [];
  if (isSuperAdmin(user)) return departments;
  if (isDepartmentAdmin(user)) return departments.filter((d) => d.name === user.scope);
  // Category Admins don't manage departments at all.
  return [];
}

export function canCreateMember(user) {
  // Department Admins assign EXISTING members to their department;
  // they never create brand-new member records.
  return isSuperAdmin(user) || isCategoryAdmin(user);
}

export function canEditMemberDirectly(user) {
  // Category Admin edits are meant to go through an approval request
  // instead of a direct edit (see canRequestMemberEdit below) — that
  // submission flow isn't wired into the UI yet, so for now Category
  // Admins simply don't see an Edit action at all. Safer than a
  // half-built request flow with nowhere for Super Admin to review it.
  return isSuperAdmin(user);
}

export function canDeleteMemberDirectly(user) {
  return isSuperAdmin(user);
}

// Reserved for when the approval-request submission flow is built —
// Category Admins are allowed to REQUEST these, just not perform
// them directly. Not called from any UI yet.
export function canRequestMemberEdit(user) {
  return isCategoryAdmin(user);
}
export function canRequestMemberDeletion(user) {
  return isCategoryAdmin(user);
}

export function canManageDepartments(user) {
  return isSuperAdmin(user);
}

export function canViewFullReports(user) {
  return isSuperAdmin(user);
}

export function canReviewApprovalRequests(user) {
  return isSuperAdmin(user);
}

export function canManageUsers(user) {
  return isSuperAdmin(user);
}

/**
 * Which nav paths this role is allowed to see/access.
 * `null` means "no restriction" (Super Admin sees everything).
 */
export function getAllowedNavPaths(user) {
  if (isSuperAdmin(user)) return null;
  if (isCategoryAdmin(user)) return ["dashboard", "members", "birthdays", "reports"];
  if (isDepartmentAdmin(user)) return ["dashboard", "members"];
  return ["dashboard"];
}

/** Human-readable role label for display in the UI. */
export function getRoleLabel(user) {
  if (!user) return "";
  if (isSuperAdmin(user)) return "Super Admin";
  if (isCategoryAdmin(user)) return `${user.scope} Category Admin`;
  if (isDepartmentAdmin(user)) return `${user.scope} Department Admin`;
  return "Unknown Role";
}
