import { apiRequest } from "../../lib/apiClient";
export const getAttendanceHistory = () => apiRequest("/attendance/");
export const recordAttendance = (data) => apiRequest("/attendance/", { method: "POST", body: JSON.stringify(data) });
