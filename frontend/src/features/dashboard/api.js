import { getMembers } from "../members/api";
import { getDepartments } from "../departments/api";
import { getAttendanceHistory } from "../attendance/api";
// import { getEvents } from "../events/api"; // Uncomment if you bring events back
import { apiRequest } from "../../lib/apiClient";

export const getMembershipGrowth = () => apiRequest("/membership-growth/");
export const getRecentActivity = () => apiRequest("/activity-log/");

export async function getDashboardData() {
  // Promise.allSettled ensures that if a restricted role gets a 403/401 
  // on specific endpoints, it doesn't crash the entire dashboard load.
  const results = await Promise.allSettled([
    getMembers(),
    getDepartments(),
    getMembershipGrowth(),
    getAttendanceHistory(),
    // getEvents ? getEvents() : Promise.resolve([]),
    getRecentActivity(),
  ]);

  return {
    members: results[0].status === "fulfilled" ? results[0].value : [],
    departments: results[1].status === "fulfilled" ? results[1].value : [],
    growth: results[2].status === "fulfilled" ? results[2].value : [],
    attendance: results[3].status === "fulfilled" ? results[3].value : [],
    events: [], // Fallback empty array since getEvents wasn't imported
    activity: results[4].status === "fulfilled" ? results[4].value : [],
  };
}