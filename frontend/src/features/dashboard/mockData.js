// Data genuinely owned by the Dashboard (not Attendance/Events/
// Members/Departments, which each have their own mockData.js now).
// Membership growth is a computed trend series; activity log is a
// general admin audit feed. Replace once real endpoints exist.

export const mockMembershipGrowth = [
  { month: "Jan", total: 3 },
  { month: "Feb", total: 4 },
  { month: "Mar", total: 5 },
  { month: "Apr", total: 6 },
  { month: "May", total: 7 },
  { month: "Jun", total: 8 },
  { month: "Jul", total: 9 },
  { month: "Aug", total: 10 },
];

export const mockActivityLog = [
  { id: 1, description: "Added new member Blessing Umeh", timestamp: "2026-08-10T10:15:00", admin: "Pastor John Doe" },
  { id: 2, description: "Recorded attendance for Aug 10 service", timestamp: "2026-08-10T11:00:00", admin: "Pastor John Doe" },
  { id: 3, description: "Updated member status: Samuel Adeyemi marked Inactive", timestamp: "2026-08-08T09:30:00", admin: "Pastor John Doe" },
  { id: 4, description: "Created event: Annual Convention", timestamp: "2026-08-06T14:45:00", admin: "Pastor John Doe" },
  { id: 5, description: "Added new member Peter Achebe", timestamp: "2026-08-05T15:20:00", admin: "Pastor John Doe" },
];