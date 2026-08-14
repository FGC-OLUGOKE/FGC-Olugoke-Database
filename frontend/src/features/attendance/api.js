import { mockAttendanceHistory } from "./mockData";

const SIMULATED_DELAY_MS = 300;

function simulateNetwork(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

/**
 * Data-access layer for Attendance. Same pattern as
 * features/members/api.js — swap the mock implementation for a real
 * fetch() when the backend endpoint exists; callers never change.
 */
export async function getAttendanceHistory() {
  // TODO: replace with:
  //   const res = await fetch("/api/attendance");
  //   if (!res.ok) throw new Error("Failed to load attendance");
  //   return res.json();
  return simulateNetwork(mockAttendanceHistory);
}

export async function recordAttendance(entryData) {
  // TODO: replace with a real POST to `/api/attendance`
  const created = { id: Date.now(), ...entryData };
  return simulateNetwork(created);
}