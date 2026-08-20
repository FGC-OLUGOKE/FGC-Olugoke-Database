// Mock admin accounts for the three-role permission system. Reuses
// real member names already in the app (Grace Okafor is Youth, Mary
// Johnson is an Adults-category member serving as Children Admin,
// etc.) purely for demo realism — an admin account is conceptually
// separate from a member record, even though the same person could
// plausibly be both.
//
// `scope` is the category name (for category_admin) or department
// name (for department_admin); null for super_admin, who isn't
// scoped to anything.

const mockUsers = [
  { id: 1, name: "Pastor John Doe", email: "john.doe@example.com", role: "super_admin", scope: null },
  { id: 2, name: "Mary Johnson", email: "mary.j@example.com", role: "category_admin", scope: "Children" },
  { id: 3, name: "David Eze", email: "david.eze@example.com", role: "category_admin", scope: "Teenager" },
  { id: 4, name: "Grace Okafor", email: "grace.okafor@example.com", role: "category_admin", scope: "Youth" },
  { id: 5, name: "Emmanuel Nwosu", email: "emmanuel.n@example.com", role: "category_admin", scope: "Adult" },
  { id: 6, name: "Peter Achebe", email: "peter.achebe@example.com", role: "department_admin", scope: "Media" },
  { id: 7, name: "Samuel Adeyemi", email: "samuel.a@example.com", role: "department_admin", scope: "Ushering" },
];

export default mockUsers;