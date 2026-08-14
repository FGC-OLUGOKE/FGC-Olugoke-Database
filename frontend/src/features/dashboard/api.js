import { getMembers } from "../members/api";
import { getDepartments } from "../departments/api";
import { getAttendanceHistory } from "../attendance/api";
import { getEvents } from "../events/api";
import { mockMembershipGrowth, mockActivityLog } from "./mockData";

const SIMULATED_DELAY_MS = 300;

function simulateNetwork(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

/**
 * Each dataset the Dashboard needs has its own dedicated function,
 * each mapping 1:1 to a real endpoint your backend can expose
 * independently (/api/members, /api/departments, /api/attendance,
 * /api/events, /api/membership-growth, /api/activity-log). Nothing
 * here needs to be "one big dashboard blob" — endpoints can be built
 * and swapped in one at a time.
 */

export async function getMembershipGrowth() {
  // TODO: replace with:
  //   const res = await fetch("/api/membership-growth");
  //   if (!res.ok) throw new Error("Failed to load membership growth");
  //   return res.json();
  return simulateNetwork(mockMembershipGrowth);
}

export async function getRecentActivity() {
  // TODO: replace with:
  //   const res = await fetch("/api/activity-log");
  //   if (!res.ok) throw new Error("Failed to load activity log");
  //   return res.json();
  return simulateNetwork(mockActivityLog);
}

/**
 * Convenience aggregator so DashboardPage can fetch everything with
 * one call. Internally this just calls each feature's own api.js —
 * if you swap any individual function above (or in members/api.js,
 * departments/api.js, attendance/api.js, events/api.js) for a real
 * request, this function's return shape doesn't change and
 * DashboardPage.jsx needs NO edits.
 */
export async function getDashboardData() {
  const [members, departments, growth, attendance, events, activity] = await Promise.all([
    getMembers(),
    getDepartments(),
    getMembershipGrowth(),
    getAttendanceHistory(),
    getEvents(),
    getRecentActivity(),
  ]);

  return { members, departments, growth, attendance, events, activity };
}