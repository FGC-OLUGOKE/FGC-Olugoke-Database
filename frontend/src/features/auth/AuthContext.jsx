import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getCurrentUser, setCurrentUser as persistCurrentUser, getUsers } from "./api";

const AuthContext = createContext(null);

/**
 * AuthProvider
 *
 * Wraps the whole app (see App.jsx). Fetches the current user once
 * on load via features/auth/api.js. `switchUser` is the dev-only
 * role-switcher's hook into this — see RoleSwitcher.jsx.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCurrentUser(), getUsers()]).then(([currentUser, users]) => {
      setUser(currentUser);
      setAllUsers(users);
      setIsLoading(false);
    });
  }, []);

  const switchUser = useCallback(
    async (userId) => {
      await persistCurrentUser(userId);
      const next = allUsers.find((u) => u.id === userId);
      if (next) setUser(next);
    },
    [allUsers]
  );

  return (
    <AuthContext.Provider value={{ user, allUsers, isLoading, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}