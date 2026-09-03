import { getMembers } from "../members/api";
import { getDepartments } from "../departments/api";
import { getAttendanceHistory } from "../attendance/api";
// import { getEvents } from "../events/api"; // Uncomment if you bring events back
import { getMembershipGrowth } from "../dashboard/api";

export async function getReportsData() {
  // Promise.allSettled ensures that if a restricted role gets a 403/401 
  // on specific endpoints, it doesn't crash the entire reports load.
  const results = await Promise.allSettled([
    getMembers(),
    getDepartments(),
    getAttendanceHistory(),
    // getEvents ? getEvents() : Promise.resolve([]),
    getMembershipGrowth(),
  ]);

  return {
    members: results[0].status === "fulfilled" ? results[0].value : [],
    departments: results[1].status === "fulfilled" ? results[1].value : [],
    attendance: results[2].status === "fulfilled" ? results[2].value : [],
    events: [], // Fallback empty array since getEvents wasn't imported
    growth: results[3].status === "fulfilled" ? results[3].value : [],
  };
}