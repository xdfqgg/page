/**
 * api.ts — 前端 API 客户端
 *
 * 改造要点（Copilot 审计驱动）：
 * 1. 使用 http 工具库（统一错误格式、自动重试、超时控制）
 * 2. Token 鉴权：登录后后端返回 token，后续请求自动携带
 *    （token 由 http.ts 的 getToken() 自动读取并附加到 Authorization 头）
 * 3. 写操作（create/update/delete）自动重试 409/429/5xx
 * 4. 类型安全的返回值
 */

import { http, setToken, clearToken, ApiError } from "./http";

// ── 用户认证 ──────────────────────────────────────

export const auth = {
  /** 登录 — 成功后保存 token 到 localStorage */
  async login(username: string, password: string) {
    const data = await http.post<{
      error?: string;
      success?: boolean;
      token?: string;
      role?: string;
    }>("/api/auth/login", { username, password });

    if (data.error) return { ok: false as const, error: data.error };

    // 保存 token（如果后端返回了）
    if (data.token) {
      setToken(data.token);
    }

    return {
      ok: true as const,
      token: data.token,
      role: data.role || "user",
    };
  },

  /** 注册 — 成功后保存 token */
  async register(username: string, password: string) {
    const data = await http.post<{
      error?: string;
      success?: boolean;
      token?: string;
    }>("/api/auth/register", { username, password });

    if (data.error) return { ok: false as const, error: data.error };

    if (data.token) {
      setToken(data.token);
    }

    return { ok: true as const, token: data.token };
  },

  /** 登出 — 清除 localStorage 中的 token */
  logout() {
    clearToken();
  },
};

// ── 文章类型 ──────────────────────────────────────

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
}

export interface PostCreateInput {
  title: string;
  tags: string[];
  excerpt: string;
  content: string;
}

export interface PostUpdateInput extends PostCreateInput {
  slug: string;
}

// ── 文章 CRUD ─────────────────────────────────────

export const posts = {
  /** 文章列表 */
  async list(): Promise<PostMeta[]> {
    try {
      return await http.get<PostMeta[]>("/api/posts");
    } catch {
      return [];
    }
  },

  /** 文章 Markdown 原文 */
  async getRaw(slug: string): Promise<string | null> {
    try {
      return await http.get<string>(`/api/posts/${slug}`);
    } catch {
      return null;
    }
  },

  /** 创建文章（写操作，自动重试） */
  async create(data: PostCreateInput) {
    return http.post<{
      error?: string;
      success?: boolean;
      slug?: string;
    }>("/api/posts/create", data);
  },

  /** 编辑文章（写操作，自动重试） */
  async update(data: PostUpdateInput) {
    return http.post<{
      error?: string;
      success?: boolean;
      slug?: string;
    }>("/api/posts/update", data);
  },

  /** 删除文章（写操作，自动重试） */
  async remove(slug: string) {
    return http.post<{
      error?: string;
      success?: boolean;
    }>("/api/posts/delete", { slug });
  },
};

// ── 兼容旧 API（逐步迁移用） ──────────────────────

/**
 * @deprecated 使用 auth.login / posts.list 等新 API。
 * 保留此导出是为了让现有页面不做大改动，渐进过渡。
 */
export const api = {
  login: (username: string, password: string) =>
    auth.login(username, password).then((r) => ({
      error: r.ok ? undefined : r.error,
      success: r.ok ? true : undefined,
      role: "role" in r ? r.role : undefined,
    })),

  register: (username: string, password: string) =>
    auth.register(username, password).then((r) => ({
      error: r.ok ? undefined : r.error,
      success: r.ok ? true : undefined,
    })),

  fetchPosts: () => posts.list(),
  fetchPostRaw: (slug: string) => posts.getRaw(slug),

  createPost: (data: PostCreateInput) => posts.create(data),
  updatePost: (data: PostUpdateInput) => posts.update(data),
  deletePost: (slug: string) => posts.remove(slug),
};
