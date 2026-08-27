/**
 * Central permission logic for the two-role system (Super Admin,
 * Staff Admin). Every function here is pure —
 * it only looks at a `user` object ({ role, scope }) and doesn't
 * care where that user came from. That's deliberate: swapping the
 * authenticated API account returned by features/auth/api.js
 * means this file doesn't change at all, since real auth will still
 * hand back a user with the same { role, scope } shape.
 *
 * Current scope of what's implemented (see conversation for the
 * full plan): view/create scoping for Members, nav + route
 * restriction, and Dashboard data scoping. NOT yet implemented:
 * department-scoped staff workflows are enforced in both the UI and API.
 */

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  CATEGORY_ADMIN: "category_admin",
  DEPARTMENT_ADMIN: "department_admin",
};

export function isSuperAdmin(user) {
  return user?.role === ROLES.SUPER_ADMIN;
}

export function isDepartmentAdmin(user) {
  return user?.role === ROLES.DEPARTMENT_ADMIN;
}

export function isCategoryAdmin(user) {
  return user?.role === ROLES.CATEGORY_ADMIN;
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
  if (isCategoryAdmin(user)) return [];
  if (isDepartmentAdmin(user)) return departments.filter((d) => d.name === user.scope);
  return [];
}

export function canCreateMember(user) {
  // Department Admins assign EXISTING members to their department;
  // they never create brand-new member records.
  return isSuperAdmin(user) || isDepartmentAdmin(user);
}

export function canEditMemberDirectly(user) {
  return isSuperAdmin(user) || isDepartmentAdmin(user);
}

export function canDeleteMemberDirectly(user) {
  return isSuperAdmin(user) || isDepartmentAdmin(user);
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
  if (isCategoryAdmin(user) || isDepartmentAdmin(user)) return ["dashboard", "members", "birthdays", "reports"];
  return ["dashboard"];
}

/** Human-readable role label for display in the UI. */
export function getRoleLabel(user) {
  if (!user) return "";
  if (isSuperAdmin(user)) return "Super Admin";
  if (isCategoryAdmin(user)) return `${user.scope} Category Admin`;
  if (isDepartmentAdmin(user)) return `${user.scope} Departmental Admin`;
  return "Unknown Role";
}