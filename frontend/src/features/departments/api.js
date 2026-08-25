import { apiRequest } from "../../lib/apiClient";
export const getDepartments = () => apiRequest("/departments/");
export const createDepartment = (data) => apiRequest("/departments/", { method: "POST", body: JSON.stringify(data) });
export const updateDepartment = (id, data) => apiRequest(`/departments/${id}/`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteDepartment = (id) => apiRequest(`/departments/${id}/`, { method: "DELETE" });
