/**
 * Central permission logic for the three-level admin system.
 *
 * Roles:
 * - Super Admin: church-wide authority.
 * - Category Admin: scoped to one category (Children, Teenager, Youth, Adult).
 * - Department Admin: scoped to one department.
 *
 * This module is intentionally pure: it only evaluates the user object and
 * data passed to it. Backend authorization remains the final authority.
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
export function getScopedMembers(user, members = []) {
  if (!user) return [];
  if (isSuperAdmin(user)) return members;
  if (isCategoryAdmin(user)) return members.filter((m) => m.category === user.scope);
  if (isDepartmentAdmin(user)) {
    return members.filter((m) => (m.departments ?? []).includes(user.scope));
  }
  return [];
}

/** Departments visible to this user, scoped by role. */
export function getScopedDepartments(user, departments = []) {
  if (!user) return [];
  if (isSuperAdmin(user)) return departments;
  if (isDepartmentAdmin(user)) return departments.filter((d) => d.name === user.scope);
  return [];
}

/** Creating a brand-new member is reserved for Super Admin and Category Admin. */
export function canCreateMember(user) {
  return isSuperAdmin(user) || isCategoryAdmin(user);
}

/** Super Admin edits directly; Category Admin edits through approval requests. */
export function canEditMemberDirectly(user) {
  return isSuperAdmin(user);
}

/** Super Admin deletes directly; Category Admin deletes through approval requests. */
export function canDeleteMemberDirectly(user) {
  return isSuperAdmin(user);
}

export function canRequestMemberEdit(user) {
  return isCategoryAdmin(user);
}

export function canRequestMemberDelete(user) {
  return isCategoryAdmin(user);
}

/** Department Admins can only manage membership inside their own department. */
export function canAssignMembersToDepartment(user) {
  return isDepartmentAdmin(user);
}

export function canRemoveMembersFromDepartment(user) {
  return isDepartmentAdmin(user);
}

/** Only Super Admin can create, edit, or delete departments. */
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

export function canPromoteDemoteMembers(user) {
  return isSuperAdmin(user);
}

/**
 * Which nav paths this role is allowed to see.
 * null means no restriction (Super Admin sees everything).
 */
export function getAllowedNavPaths(user) {
  if (isSuperAdmin(user)) return null;
  if (isCategoryAdmin(user)) return ["dashboard", "members", "attendance", "birthdays", "reports"];
  if (isDepartmentAdmin(user)) return ["dashboard", "members", "birthdays", "reports"];
  return ["dashboard"];
}

export function getRoleLabel(user) {
  if (!user) return "";
  if (isSuperAdmin(user)) return "Super Admin";
  if (isCategoryAdmin(user)) return `${user.scope} Category Admin`;
  if (isDepartmentAdmin(user)) return `${user.scope} Department Admin`;
  return "Unknown Role";
}
