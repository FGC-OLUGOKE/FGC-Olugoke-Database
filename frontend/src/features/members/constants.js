// Shared option lists for the Members feature.
// Centralized here so SearchBar, MemberForm, and MemberList
// all reference the same source of truth — no duplicated arrays.

export const CATEGORIES = ["All", "Children", "Teenager", "Youth", "Adult"];

export const DEPARTMENTS = [
  "All Departments",
  "Choir",
  "Media",
  "Ushering",
  "Children Church",
  "Prayer",
  "Evangelism",
];

export const STATUSES = ["All Status", "Active", "Inactive"];

export const SORT_OPTIONS = [
  { value: "az", label: "Sort: A - Z" },
  { value: "za", label: "Sort: Z - A" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

// Filtered variants for use in MemberForm, where "All"/"All Status"/
// "All Departments" aren't valid values for an actual member record.
export const FORM_CATEGORIES = CATEGORIES.filter((c) => c !== "All");
export const FORM_DEPARTMENTS = DEPARTMENTS.filter((d) => d !== "All Departments");
export const FORM_STATUSES = STATUSES.filter((s) => s !== "All Status");

export const TITLES = [
  "Mr",
  "Mrs",
  "Miss",
  "Pastor",
  "Elder",
  "Deacon",
  "Deaconess",
  "Brother",
  "Sister",
  "Master",
];

export const GENDERS = ["Male", "Female"];

export const MARITAL_STATUSES = ["Single", "Married", "Widowed", "Divorced"];