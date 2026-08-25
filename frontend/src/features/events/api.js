import { apiRequest } from "../../lib/apiClient";
export const getEvents = () => apiRequest("/events/");
export const createEvent = (data) => apiRequest("/events/", { method: "POST", body: JSON.stringify(data) });
export const updateEvent = (id, data) => apiRequest(`/events/${id}/`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteEvent = (id) => apiRequest(`/events/${id}/`, { method: "DELETE" });
