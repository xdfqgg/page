import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

/**
 * AuthContext — 管理员认证
 *
 * 登录时输入 GitHub Token 来验证身份。
 * Token 存在浏览器 localStorage 中，不经过服务器。
 * 前端直接用 Token 调用 GitHub API 读取私密 wz 仓库。
 */

interface AuthState {
  isLoggedIn: boolean;
  /** GitHub Personal Access Token */
  token: string | null;
  /** 用 GitHub Token 登录 */
  login: (token: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("gh_token");
  });

  const isLoggedIn = !!token;

  /** 登录：用 GitHub Token 验证——尝试调用 API 看是否有效 */
  const login = async (inputToken: string): Promise<boolean> => {
    try {
      // 用 GitHub API 验证 Token 是否有效
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${inputToken}`,
          "User-Agent": "xdfq-blog",
        },
      });

      if (!res.ok) return false;

      localStorage.setItem("gh_token", inputToken);
      setToken(inputToken);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("gh_token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必须在 AuthProvider 内使用");
  return ctx;
}
