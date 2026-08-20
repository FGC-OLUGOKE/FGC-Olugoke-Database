import mockUsers from "./mockUsers";

const SIMULATED_DELAY_MS = 300;
const CURRENT_USER_STORAGE_KEY = "mockCurrentUserId"; // dev-only, see AuthContext.jsx

function simulateNetwork(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

/**
 * Data-access layer for auth/users — same api.js pattern as every
 * other feature. The important seam is getCurrentUser(): right now
 * it just reads whichever mock account was last picked via the
 * dev-only role switcher (persisted in localStorage so it survives
 * a refresh). Once real login exists, replace the body of
 * getCurrentUser() with a real "who am I" call and DELETE
 * setCurrentUser() entirely (it has no real-world equivalent —
 * you don't "set" who's logged in, a session/token determines that).
 * Nothing outside this file needs to change: every consumer just
 * calls getCurrentUser() and gets a { id, name, email, role, scope }
 * object back, same shape either way.
 */

export async function getUsers() {
  // TODO: replace with `GET /api/users` (Super Admin only — the
  // real backend should enforce that, not just the frontend hiding
  // the page).
  return simulateNetwork(mockUsers);
}

export async function getCurrentUser() {
  // TODO: replace with:
  //   const res = await fetch("/api/me", { credentials: "include" });
  //   if (!res.ok) throw new Error("Not authenticated");
  //   return res.json();
  const storedId = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  const id = storedId ? Number(storedId) : mockUsers[0].id;
  const user = mockUsers.find((u) => u.id === id) ?? mockUsers[0];
  return simulateNetwork(user);
}

/**
 * Dev-only — backs the role switcher so you can preview the app as
 * any mock account. DELETE this function once real login exists;
 * it has no real-world equivalent.
 */
export async function setCurrentUser(userId) {
  window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, String(userId));
}

export async function createAdminAccount(accountData) {
  // TODO: replace with a real POST to `/api/users`
  const created = { id: Date.now(), ...accountData };
  return simulateNetwork(created);
}