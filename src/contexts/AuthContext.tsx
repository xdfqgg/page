import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

/**
 * AuthContext — 管理员认证状态管理
 *
 * 登录后 token 存 localStorage，刷新页面不丢失。
 * 退出时清除 token。
 */

interface AuthState {
  isLoggedIn: boolean;
  token: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("admin_token");
  });

  const isLoggedIn = !!token;

  /** 登录：POST /api/auth 验证密码 */
  const login = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "登录失败");
      }

      const data = (await res.json()) as { token: string };
      localStorage.setItem("admin_token", data.token);
      setToken(data.token);
      return true;
    } catch (err) {
      console.error("登录失败:", err);
      return false;
    }
  };

  /** 退出 */
  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook：在组件中获取认证状态 */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必须在 AuthProvider 内使用");
  return ctx;
}
