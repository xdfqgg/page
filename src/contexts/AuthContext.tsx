/**
 * AuthContext — 认证状态管理（改造版）
 *
 * 改造要点（Copilot 审计驱动）：
 * 1. 使用 auth.login/register/logout（内部管理 token，不再裸存密码凭据）
 * 2. 登录态判断：以 token 是否存在为准，而非仅靠用户名
 * 3. localStorage 只存 token + username（展示用），不存敏感信息
 */
import { createContext, useContext, useState, type ReactNode } from "react";
import { auth } from "@/lib/api";
import { getToken } from "@/lib/http";

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
  // 初始化：从 localStorage 恢复（token 存在即视为已登录）
  const [username, setUsername] = useState<string | null>(() => {
    const token = getToken();
    return token ? localStorage.getItem("auth_username") : null;
  });
  const [role, setRole] = useState<string | null>(() => {
    const token = getToken();
    return token ? localStorage.getItem("auth_role") : null;
  });

  const isLoggedIn = !!getToken();

  /** 登录：调用后端，成功后 token 由 auth.login 内部保存 */
  const login = async (uname: string, pwd: string) => {
    const result = await auth.login(uname, pwd);

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    localStorage.setItem("auth_username", uname);
    localStorage.setItem("auth_role", result.role || "user");
    setUsername(uname);
    setRole(result.role || "user");
    return { ok: true };
  };

  /** 注册：调用后端，成功后 token 由 auth.register 内部保存 */
  const register = async (uname: string, pwd: string) => {
    const result = await auth.register(uname, pwd);

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    localStorage.setItem("auth_username", uname);
    localStorage.setItem("auth_role", "user");
    setUsername(uname);
    setRole("user");
    return { ok: true };
  };

  /** 登出：清除 token 和展示信息 */
  const logout = () => {
    auth.logout(); // 清除 token
    localStorage.removeItem("auth_username");
    localStorage.removeItem("auth_role");
    setUsername(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, username, role, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth — 获取认证状态和操作方法
 *
 * 用法：
 *   const { isLoggedIn, username, login, logout } = useAuth();
 */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必须在 AuthProvider 内使用");
  return ctx;
}
