import { createContext, useContext, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

interface AuthState {
  isLoggedIn: boolean;
  username: string | null;
  role: string | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(
    () => localStorage.getItem("auth_username")
  );
  const [role, setRole] = useState<string | null>(
    () => localStorage.getItem("auth_role")
  );

  const isLoggedIn = !!username;

  const login = async (uname: string, pwd: string) => {
    const data = await api.login(uname, pwd);
    if (data.error) return { ok: false, error: data.error };

    localStorage.setItem("auth_username", uname);
    localStorage.setItem("auth_role", data.role || "user");
    setUsername(uname);
    setRole(data.role || "user");
    return { ok: true };
  };

  const register = async (uname: string, pwd: string) => {
    const data = await api.register(uname, pwd);
    if (data.error) return { ok: false, error: data.error };

    localStorage.setItem("auth_username", uname);
    localStorage.setItem("auth_role", "user");
    setUsername(uname);
    setRole("user");
    return { ok: true };
  };

  const logout = () => {
    localStorage.removeItem("auth_username");
    localStorage.removeItem("auth_role");
    setUsername(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, role, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必须在 AuthProvider 内使用");
  return ctx;
}
