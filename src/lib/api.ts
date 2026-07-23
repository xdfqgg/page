const BASE = "https://cf-backend-lake.vercel.app";

async function get(url: string) {
  const res = await fetch(`${BASE}${url}`);
  return res;
}

async function post(url: string, body: object) {
  const res = await fetch(`${BASE}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export const api = {
  /** 登录 */
  login: (username: string, password: string) =>
    post("/api/auth/login", { username, password }) as Promise<{
      error?: string; success?: boolean; role?: string;
    }>,

  /** 注册 */
  register: (username: string, password: string) =>
    post("/api/auth/register", { username, password }) as Promise<{
      error?: string; success?: boolean;
    }>,

  /** 文章列表 */
  fetchPosts: async () => {
    const res = await get("/api/posts");
    if (!res.ok) return [];
    return res.json() as Promise<Array<{
      slug: string; title: string; date: string; tags: string[]; excerpt: string;
    }>>;
  },

  /** 文章 Markdown 原文 */
  fetchPostRaw: async (slug: string) => {
    const res = await get(`/api/posts/${slug}`);
    if (!res.ok) return null;
    return res.text();
  },

  /** 创建文章 */
  createPost: (data: {
    title: string; tags: string[]; excerpt: string; content: string;
  }) => post("/api/posts/create", data) as Promise<{
    error?: string; success?: boolean; slug?: string;
  }>,

  /** 编辑文章 */
  updatePost: (data: {
    slug: string; title: string; tags: string[]; excerpt: string; content: string;
  }) => post("/api/posts/update", data) as Promise<{
    error?: string; success?: boolean; slug?: string;
  }>,
};
