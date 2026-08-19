// Placeholder weekly attendance data. Replace with real records once
// features/attendance/api.js points at a real endpoint.
//
// `date` (ISO) added alongside the display-friendly `week` label so
// the Reports page can actually filter attendance by report period
// (This Month / Last 3 Months / Custom Range / etc.) — the label
// alone had no year and couldn't be range-filtered correctly.

export const mockAttendanceHistory = [
  { date: "2026-06-15", week: "Jun 15", adults: 58, youth: 16, teenagers: 9, children: 12, total: 95 },
  { date: "2026-06-22", week: "Jun 22", adults: 60, youth: 17, teenagers: 9, children: 13, total: 99 },
  { date: "2026-06-29", week: "Jun 29", adults: 59, youth: 17, teenagers: 10, children: 13, total: 99 },
  { date: "2026-07-06", week: "Jul 06", adults: 61, youth: 18, teenagers: 10, children: 14, total: 103 },
  { date: "2026-07-13", week: "Jul 13", adults: 62, youth: 18, teenagers: 10, children: 14, total: 104 },
  { date: "2026-07-20", week: "Jul 20", adults: 65, youth: 20, teenagers: 11, children: 15, total: 111 },
  { date: "2026-07-27", week: "Jul 27", adults: 64, youth: 19, teenagers: 12, children: 16, total: 111 },
  { date: "2026-08-03", week: "Aug 03", adults: 68, youth: 22, teenagers: 13, children: 17, total: 120 },
  { date: "2026-08-10", week: "Aug 10", adults: 70, youth: 23, teenagers: 14, children: 18, total: 125 },
];