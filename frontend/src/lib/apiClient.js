// Use the same-origin Django route by default. A blank Vercel environment
// value must not override this fallback.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";
const TOKEN_KEY = "fgcAuthToken";
const pendingRequests = new Map();
const cachedGets = new Map();
const GET_CACHE_TTL = 2000;
export function getToken() { return window.localStorage.getItem(TOKEN_KEY); }
export function setToken(token) { window.localStorage.setItem(TOKEN_KEY, token); }
export function clearToken() { window.localStorage.removeItem(TOKEN_KEY); }
export async function apiRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const requestKey = `${method}:${path}:${options.body || ""}`;
  if (method === "GET") {
    const cached = cachedGets.get(path);
    if (cached && cached.expiresAt > Date.now()) return cached.data;
    if (pendingRequests.has(requestKey)) return pendingRequests.get(requestKey);
  }
  if (method !== "GET" && pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }

  const request = (async () => {
  const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Token ${token}`;
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) clearToken();
    const validationMessage = Object.values(data)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .find((value) => typeof value === "string");
    const error = new Error(data.detail ?? validationMessage ?? "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
  })();

  if (method !== "GET") pendingRequests.set(requestKey, request);
  else pendingRequests.set(requestKey, request);
  try {
    const result = await request;
    if (method === "GET") cachedGets.set(path, { data: result, expiresAt: Date.now() + GET_CACHE_TTL });
    return result;
  } finally {
    pendingRequests.delete(requestKey);
    if (method !== "GET") {
      for (const key of cachedGets.keys()) {
        if (key.split("/")[1] === path.split("/")[1]) cachedGets.delete(key);
      }
    }
  }
}
