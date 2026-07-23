/** Vercel 后端 API 地址 */
const BASE = "https://cf-backend-lake.vercel.app";

export const api = {
  /** 登录 */
  login: async (username: string, password: string) => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return res.json() as Promise<{
      error?: string;
      success?: boolean;
      role?: string;
    }>;
  },

  /** 注册 */
  register: async (username: string, password: string) => {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return res.json() as Promise<{
      error?: string;
      success?: boolean;
    }>;
  },
};
