import { getMembers } from "../members/api";
import { getDepartments } from "../departments/api";
import { getAttendanceHistory } from "../attendance/api";
import { getEvents } from "../events/api";
import { getMembershipGrowth } from "../dashboard/api";

/**
 * Reports has no data of its own — it's purely an aggregation/
 * analysis layer over Members, Departments, Attendance, Events, and
 * Dashboard's growth series. All actual report computation (period
 * filtering, breakdowns, insights) happens in ReportsPage.jsx via
 * useMemo, not here — this just fetches the raw datasets each
 * report is built from.
 */
export async function getReportsData() {
  const [members, departments, attendance, events, growth] = await Promise.all([
    getMembers(),
    getDepartments(),
    getAttendanceHistory(),
    getEvents(),
    getMembershipGrowth(),
  ]);

  return { members, departments, attendance, events, growth };
}