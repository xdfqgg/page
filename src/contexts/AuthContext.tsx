import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * AuthContext — 用户认证
 *
 * 登录后 JWT Token 存 localStorage，每次请求带 Authorization header。
 */

interface AuthState {
  isLoggedIn: boolean;
  username: string | null;
  role: string | null;
  token: string | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("auth_token")
  );
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem("auth_username")
  );
  const [role, setRole] = useState<string | null>(() =>
    localStorage.getItem("auth_role")
  );

  const isLoggedIn = !!token;

  const login = async (
    uname: string,
    pwd: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: uname, password: pwd }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        token?: string;
        role?: string;
      };

      if (!res.ok || !data.success) {
        return { ok: false, error: data.error || "登录失败" };
      }

      localStorage.setItem("auth_token", data.token!);
      localStorage.setItem("auth_username", uname);
      localStorage.setItem("auth_role", data.role!);
      setToken(data.token!);
      setUsername(uname);
      setRole(data.role!);
      return { ok: true };
    } catch {
      return { ok: false, error: "网络错误" };
    }
  };

  const register = async (
    uname: string,
    pwd: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: uname, password: pwd }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        token?: string;
        role?: string;
      };

      if (!res.ok || !data.success) {
        return { ok: false, error: data.error || "注册失败" };
      }

      localStorage.setItem("auth_token", data.token!);
      localStorage.setItem("auth_username", uname);
      localStorage.setItem("auth_role", data.role!);
      setToken(data.token!);
      setUsername(uname);
      setRole(data.role!);
      return { ok: true };
    } catch {
      return { ok: false, error: "网络错误" };
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_username");
    localStorage.removeItem("auth_role");
    setToken(null);
    setUsername(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, username, role, token, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必须在 AuthProvider 内使用");
  return ctx;
}
