import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from "./api";
import { clearGetCache, prefetch } from "../../lib/apiClient";
import { isSuperAdmin } from "../../lib/permissions";

const AuthContext = createContext(null);

const PREFETCH_PATHS = [
  "/members/",
  "/departments/",
  "/attendance/",
  "/approval-requests/",
  "/membership-growth/",
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  
  const refresh = useCallback(async () => { 
    try { 
      const current = await getCurrentUser(); 
      setUser(current);
      if (current) {
        const paths = isSuperAdmin(current)
          ? [...PREFETCH_PATHS, "/activity-log/", "/users/"]
          : PREFETCH_PATHS;
        prefetch(paths).catch((error) => {
          console.warn("Background data prefetch failed.", error);
        });
      }
    } catch { 
      setUser(null); 
    } finally { 
      setIsLoading(false); 
    } }, []);

  useEffect(() => { 
    refresh(); 
  }, [refresh]);

  const login = useCallback(async (email, password) => { 
    const current = await loginRequest(email, password); 
    setUser(current); 
    const paths = isSuperAdmin(current)
      ? [...PREFETCH_PATHS, "/activity-log/", "/users/"]
      : PREFETCH_PATHS;
    prefetch(paths).catch((error) => {
      console.warn("Background data prefetch failed.", error);
    });
    return current;
  }, []);

  const logout = useCallback(async () => { 
    try {
      await logoutRequest();
    } catch {
      // Logging out locally must still work if the token was already revoked
      // or the server cannot be reached.
    } finally {
      clearGetCache();
      setUser(null);
    }
  }, []);

  return <AuthContext.Provider value={{ user, isLoading, login, logout, refresh }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); 
if (!context) throw new Error("useAuth must be used within an AuthProvider"); 
return context; }
