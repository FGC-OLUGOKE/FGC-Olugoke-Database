import { apiRequest } from "../../lib/apiClient";
export const getMembers = () => apiRequest("/members/");
export const createMember = (data) => apiRequest("/members/", { method: "POST", body: JSON.stringify(data) });
export const updateMember = (id, data) => apiRequest(`/members/${id}/`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteMember = (id) => apiRequest(`/members/${id}/`, { method: "DELETE" });
export const assignMemberToDepartment = (memberId, departmentName) => apiRequest(`/members/${memberId}/departments/`, { method: "PATCH", body: JSON.stringify({ add: departmentName }) });
export const removeMemberFromDepartment = (memberId, departmentName) => apiRequest(`/members/${memberId}/departments/`, { method: "PATCH", body: JSON.stringify({ remove: departmentName }) });
export const promoteMemberToAdmin = (data) => apiRequest("/users/promote_member/", { method: "POST", body: JSON.stringify(data) });
export const demoteAdminToMember = (data) => apiRequest("/users/demote_admin/", { method: "POST", body: JSON.stringify(data) });
