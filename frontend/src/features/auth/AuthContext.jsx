import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getCurrentUser, getUsers, login as loginRequest, logout as logoutRequest } from "./api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); 
  const [allUsers, setAllUsers] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  const refresh = useCallback(async () => { 
    try { 
      const current = await getCurrentUser(); 
      setUser(current); 
      try { 
        setAllUsers(await getUsers()); 
      } catch { 
        setAllUsers([current]);
      } 
    } catch { 
      setUser(null); 
      setAllUsers([]); 
    } finally { 
      setIsLoading(false); 
    } }, []);

  useEffect(() => { 
    refresh(); 
  }, [refresh]);

  const login = useCallback(async (email, password) => { 
    const current = await loginRequest(email, password); 
    setUser(current); 
    try { 
      setAllUsers(await getUsers()); 
    } catch { 
      setAllUsers([current]); 
    } return current; 
  }, []);

  const logout = useCallback(async () => { 
    await logoutRequest(); 
    setUser(null); 
    setAllUsers([]); 
  }, []);

  return <AuthContext.Provider value={{ user, allUsers, isLoading, login, logout, refresh }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); 
if (!context) throw new Error("useAuth must be used within an AuthProvider"); 
return context; }
