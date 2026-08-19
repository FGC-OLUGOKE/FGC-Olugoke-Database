// Placeholder church events. Replace with real records once
// features/events/api.js points at a real endpoint.
//
// `type` added for the Reports page's "break events down by type"
// requirement — status ("Upcoming"/"Completed") is derived at read
// time by comparing `date` to today, not stored, so it's always
// accurate without needing to update records as time passes.

const mockEvents = [
  { id: 1, name: "Sunday Service", type: "Sunday Service", date: "2026-08-16", time: "9:00 AM", location: "Main Auditorium" },
  { id: 2, name: "Midweek Bible Study", type: "Bible Study", date: "2026-08-19", time: "6:00 PM", location: "Fellowship Hall" },
  { id: 3, name: "Workers Meeting", type: "Workers Meeting", date: "2026-08-22", time: "5:00 PM", location: "Conference Room" },
  { id: 4, name: "Youth Program", type: "Youth Program", date: "2026-08-29", time: "4:00 PM", location: "Youth Center" },
  { id: 5, name: "Annual Convention", type: "Convention", date: "2026-09-10", time: "All Day", location: "Main Auditorium" },
  { id: 6, name: "Sunday Service", type: "Sunday Service", date: "2026-08-09", time: "9:00 AM", location: "Main Auditorium" },
  { id: 7, name: "Sunday Service", type: "Sunday Service", date: "2026-08-02", time: "9:00 AM", location: "Main Auditorium" },
  { id: 8, name: "Prayer Meeting", type: "Prayer Meeting", date: "2026-07-28", time: "6:00 PM", location: "Fellowship Hall" },
];

export default mockEvents;