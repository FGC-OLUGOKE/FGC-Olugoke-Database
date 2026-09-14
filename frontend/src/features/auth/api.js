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
export const setInitialPassword = (password, confirmPassword) =>
  apiRequest("/auth/set-password/", {
    method: "POST",
    body: JSON.stringify({ password, confirmPassword }),
  });
export const changePassword = (currentPassword, password, confirmPassword) =>
  apiRequest("/auth/change-password/", { method: "POST", body: JSON.stringify({ currentPassword, password, confirmPassword }) });
export const changeProfilePhoto = (photoUrl) =>
  apiRequest("/auth/profile-photo/", { method: "PATCH", body: JSON.stringify({ photoUrl }) });
export const createAdminAccount = (data) => apiRequest("/users/", { method: "POST", body: JSON.stringify(data) });
export const updateAdminAccount = (id, data) => apiRequest(`/users/${id}/`, { method: "PATCH", body: JSON.stringify(data) });
export const removeAdminAccount = (id) => apiRequest(`/users/${id}/`, { method: "DELETE" });
export const getDepartmentAdminCandidates = () => apiRequest("/users/department_admin_candidates/");
export const appointDepartmentAdmin = (departmentId, userId) => apiRequest("/users/appoint_department_admin/", { method: "POST", body: JSON.stringify({ department_id: departmentId, user_id: userId }) });
export const revokeDepartmentAdmin = (departmentId) => apiRequest("/users/revoke_department_admin/", { method: "POST", body: JSON.stringify({ department_id: departmentId }) });
export const getNotifications = () => apiRequest("/notifications/");
export const markNotificationRead = (id) => apiRequest(`/notifications/${id}/mark_read/`, { method: "POST" });
