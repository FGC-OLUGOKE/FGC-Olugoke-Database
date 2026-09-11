import { apiRequest, clearToken, setToken } from "../../lib/apiClient";

export const getUsers = () => apiRequest("/users/");
export const getCurrentUser = () => apiRequest("/me/");
export async function login(email, password) { clearToken(); const result = await apiRequest("/auth/login/", { method: "POST", body: JSON.stringify({ email, password }) }); setToken(result.token); return result.user; }
export async function logout() { try { await apiRequest("/auth/logout/", { method: "POST" }); } finally { clearToken(); } }
export const requestPasswordReset = (email) => apiRequest("/auth/password-reset/request/", { method: "POST", body: JSON.stringify({ email }) });
export const confirmPasswordReset = (token, password, confirmPassword) =>
  apiRequest(`/auth/password-reset/confirm/${encodeURIComponent(token)}/`, {
    method: "POST",
    body: JSON.stringify({ password, confirmPassword }),
  });
export const createAdminAccount = (data) => apiRequest("/users/", { method: "POST", body: JSON.stringify(data) });
export const updateAdminAccount = (id, data) => apiRequest(`/users/${id}/`, { method: "PATCH", body: JSON.stringify(data) });
export const removeAdminAccount = (id) => apiRequest(`/users/${id}/`, { method: "DELETE" });
