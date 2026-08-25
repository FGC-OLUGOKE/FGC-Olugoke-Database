// Shared option lists for the Members feature.
//
// CATEGORY TERMINOLOGY: exactly "Children", "Teenager", "Youth",
// "Adult" (singular Teenager/Adult) — this exact wording is required
// consistently across Members, Dashboard, Birthdays, and Reports per
// the Reports page spec. Previously this said "Teenagers"/"Adults";
// chart so it's consistent everywhere, not just in Reports.
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

// NOTE: TITLES was removed entirely — the Title field no longer
// exists in member registration per the registration-rules update.

export const GENDERS = ["Male", "Female"];

export const MARITAL_STATUSES = ["Single", "Married", "Widowed", "Divorced"];