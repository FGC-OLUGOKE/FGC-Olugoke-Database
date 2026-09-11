/**
 * Central permission logic for the three-level admin system.
 *
 * Roles:
 * - Super Admin: church-wide authority.
 * - Category Admin: scoped to one category (Children, Teenager, Youth, Adult).
 * - Department Admin: scoped to one department.
 * - Managing Departments: read-only access to all church information.
 * - Pastorate: read access to everything and write access to assigned departments.
 *
 * This module is intentionally pure: it only evaluates the user object and
 * data passed to it. Backend authorization remains the final authority.
 */

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  CATEGORY_ADMIN: "category_admin",
  DEPARTMENT_ADMIN: "department_admin",
  MANAGING_DEPARTMENTS: "managing_departments",
  PASTORATE: "pastorate",
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

export function isManagingDepartments(user) {
  return user?.role === ROLES.MANAGING_DEPARTMENTS;
}

export function isPastorate(user) {
  return user?.role === ROLES.PASTORATE;
}

/** Members visible to this user, scoped by role. */
export function getScopedMembers(user, members = []) {
  if (!user) return [];
  if (isSuperAdmin(user)) return members;
  if (isCategoryAdmin(user)) return members.filter((m) => m.category === user.scope);
  if (isDepartmentAdmin(user)) {
    return members.filter((m) => (m.departments ?? []).includes(user.scope));
  }
  return members;
}

/** Departments visible to this user, scoped by role. */
export function getScopedDepartments(user, departments = []) {
  if (!user) return [];
  if (isSuperAdmin(user)) return departments;
  if (isDepartmentAdmin(user)) return departments.filter((d) => d.name === user.scope);
  return departments;
}

/** Creating a brand-new member is reserved for Super Admin and Category Admin. */
export function canCreateMember(user) {
  return isSuperAdmin(user) || isCategoryAdmin(user) || isPastorate(user);
}

/** Super Admin edits directly; Category Admin edits through approval requests. */
export function canEditMemberDirectly(user) {
  return isSuperAdmin(user) || isPastorate(user);
}

/** Super Admin deletes directly; Category Admin deletes through approval requests. */
export function canDeleteMemberDirectly(user) {
  return isSuperAdmin(user) || isPastorate(user);
}

export function canRequestMemberEdit(user) {
  return isCategoryAdmin(user);
}

export function canRequestMemberDelete(user) {
  return isCategoryAdmin(user);
}

/** Department Admins can only manage membership inside their own department. */
export function canAssignMembersToDepartment(user) {
  return isDepartmentAdmin(user) || isPastorate(user);
}

export function canRemoveMembersFromDepartment(user) {
  return isDepartmentAdmin(user) || isPastorate(user);
}

/** Only Super Admin can create, edit, or delete departments. */
export function canManageDepartments(user) {
  return isSuperAdmin(user);
}

export function canViewFullReports(user) {
  return isSuperAdmin(user) || isManagingDepartments(user) || isPastorate(user);
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
  if (isCategoryAdmin(user)) return ["dashboard", "members", "attendance", "birthdays", "reports", "approvals"];
  if (isDepartmentAdmin(user)) return ["dashboard", "members", "birthdays", "reports"];
  if (isManagingDepartments(user) || isPastorate(user)) return ["dashboard", "members", "attendance", "birthdays", "reports"];
  return ["dashboard"];
}

export function getRoleLabel(user) {
  if (!user) return "";
  if (isSuperAdmin(user)) return "Super Admin";
  if (isCategoryAdmin(user)) return `${user.scope} Category Admin`;
  if (isDepartmentAdmin(user)) return `${user.scope} Department Admin`;
  if (isManagingDepartments(user)) return "Managing Departments";
  if (isPastorate(user)) return "Pastorate";
  return "Unknown Role";
}
