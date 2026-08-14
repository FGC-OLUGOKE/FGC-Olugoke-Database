import mockEvents from "./mockData";

const SIMULATED_DELAY_MS = 300;

function simulateNetwork(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

/**
 * Data-access layer for Events. Same pattern as
 * features/members/api.js — swap the mock implementation for a real
 * fetch() when the backend endpoint exists; callers never change.
 */
export async function getEvents() {
  // TODO: replace with:
  //   const res = await fetch("/api/events");
  //   if (!res.ok) throw new Error("Failed to load events");
  //   return res.json();
  return simulateNetwork(mockEvents);
}

export async function createEvent(eventData) {
  // TODO: replace with a real POST to `/api/events`
  const created = { id: Date.now(), ...eventData };
  return simulateNetwork(created);
}

export async function updateEvent(id, eventData) {
  // TODO: replace with a real PUT/PATCH to `/api/events/${id}`
  const updated = { id, ...eventData };
  return simulateNetwork(updated);
}

export async function deleteEvent(id) {
  // TODO: replace with a real DELETE to `/api/events/${id}`
  return simulateNetwork({ id });
}