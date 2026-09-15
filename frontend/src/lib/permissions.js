/**
 * Central permission logic for the three-level admin system.
 *
 * Roles:
 * - Super Admin: church-wide authority.
 * - Category Admin: scoped to one category (Children, Teenager, Youth, Adult).
 * - Department Admin: scoped to one department.
 * - Managing Departments: read-only access to all church information.
 * - Pastorate Admin: church-wide member visibility and management of assigned departments.
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
  if (isPastorate(user)) {
    const assigned = Array.isArray(user.scope) ? user.scope : [];
    return departments.filter((d) => assigned.includes(d.name));
  }
  return departments;
}

/** Pastorate Admins can view members, but cannot create member profiles. */
export function canCreateMember(user) {
  return isSuperAdmin(user) || isCategoryAdmin(user);
}

/** Pastorate Admins cannot edit ordinary member profiles. */
export function canEditMemberDirectly(user) {
  return isSuperAdmin(user);
}

/** Pastorate Admins cannot delete ordinary members. */
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
  return isDepartmentAdmin(user) || isPastorate(user);
}

export function canRemoveMembersFromDepartment(user) {
  return isDepartmentAdmin(user) || isPastorate(user);
}

/** Super Admin and Pastorate Admin manage departments in their scope. */
export function canManageDepartments(user) {
  return isSuperAdmin(user) || isPastorate(user);
}

export function canViewFullReports(user) {
  return isSuperAdmin(user) || isManagingDepartments(user) || isPastorate(user);
}

export function canReviewApprovalRequests(user) {
  return isSuperAdmin(user) || isPastorate(user);
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
  if (isDepartmentAdmin(user)) return ["dashboard", "members", "departments", "birthdays", "reports"];
  if (isManagingDepartments(user)) return ["dashboard", "members", "attendance", "birthdays", "reports"];
  if (isPastorate(user)) return ["dashboard", "members", "departments", "attendance", "birthdays", "reports", "approvals"];
  return ["dashboard"];
}

export function getRoleLabel(user) {
  if (!user) return "";
  if (isSuperAdmin(user)) return "Super Admin";
  if (isCategoryAdmin(user)) return `${user.scope} Category Admin`;
  if (isDepartmentAdmin(user)) return `${user.scope} Department Admin`;
  if (isManagingDepartments(user)) return "Managing Departments";
  if (isPastorate(user)) return "Pastorate Admin";
  return "Unknown Role";
}
