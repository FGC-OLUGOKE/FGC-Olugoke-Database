import mockDepartments from "./mockData";

/**
 * Data-access layer for Departments — same pattern as
 * features/members/api.js. Every page goes through these functions;
 * swapping to a real backend later means editing ONLY this file.
 */

const SIMULATED_DELAY_MS = 300;

function simulateNetwork(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

export async function getDepartments() {
  // TODO: replace with:
  //   const res = await fetch("/api/departments");
  //   if (!res.ok) throw new Error("Failed to load departments");
  //   return res.json();
  return simulateNetwork(mockDepartments);
}

export async function createDepartment(departmentData) {
  // TODO: replace with a real POST to `/api/departments`
  const created = { id: Date.now(), ...departmentData };
  return simulateNetwork(created);
}

export async function updateDepartment(id, departmentData) {
  // TODO: replace with a real PUT/PATCH to `/api/departments/${id}`
  const updated = { id, ...departmentData };
  return simulateNetwork(updated);
}

export async function deleteDepartment(id) {
  // TODO: replace with a real DELETE to `/api/departments/${id}`
  return simulateNetwork({ id });
}