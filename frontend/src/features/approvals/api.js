import { apiRequest } from "../../lib/apiClient";
export const getApprovalRequests = () => apiRequest("/approval-requests/");
export const submitApprovalRequest = (data) => apiRequest("/approval-requests/", { method: "POST", body: JSON.stringify(data) });
export const reviewApprovalRequest = (id, status) => apiRequest(`/approval-requests/${id}/`, { method: "PATCH", body: JSON.stringify({ status }) });
