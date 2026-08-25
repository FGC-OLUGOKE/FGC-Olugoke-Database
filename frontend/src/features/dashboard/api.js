import { getMembers } from "../members/api";
import { getDepartments } from "../departments/api";
import { getAttendanceHistory } from "../attendance/api";
import { getEvents } from "../events/api";
import { apiRequest } from "../../lib/apiClient";
export const getMembershipGrowth = () => apiRequest("/membership-growth/");
export const getRecentActivity = () => apiRequest("/activity-log/");
export async function getDashboardData() {
  const [members, departments, growth, attendance, events, activity] = await Promise.all([getMembers(), getDepartments(), getMembershipGrowth(), getAttendanceHistory(), getEvents(), getRecentActivity()]);
  return { members, departments, growth, attendance, events, activity };
}
