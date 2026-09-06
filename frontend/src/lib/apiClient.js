// Use the same-origin Django route by default. A blank Vercel environment
// value must not override this fallback.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";
const TOKEN_KEY = "fgcAuthToken";
export function getToken() { return window.localStorage.getItem(TOKEN_KEY); }
export function setToken(token) { window.localStorage.setItem(TOKEN_KEY, token); }
export function clearToken() { window.localStorage.removeItem(TOKEN_KEY); }
export async function apiRequest(path, options = {}) {
  const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Token ${token}`;
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) clearToken();
    const error = new Error(data.detail ?? "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
