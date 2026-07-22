import { marked } from "marked";

/**
 * blog.ts — 博客数据层
 *
 * 文章存储在私密 GitHub 仓库 xdfqgg/wz。
 * 通过 GitHub API 读取，Token 从浏览器 localStorage 获取。
 * 未登录用户只能看到公开缓存，已登录管理员可读写私密仓库。
 */

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
}

export interface Post extends PostMeta {
  content: string;
}

const API = "https://api.github.com/repos/xdfqgg/wz/contents";

/** 获取存储的 GitHub Token */
function getToken(): string | null {
  return localStorage.getItem("gh_token");
}

/** GitHub API 请求头 */
function headers(): Record<string, string> {
  const h: Record<string, string> = {
    "User-Agent": "xdfq-blog",
    Accept: "application/vnd.github.v3+json",
  };
  const token = getToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

/** 获取文章列表 */
export async function fetchPosts(): Promise<PostMeta[]> {
  try {
    const res = await fetch(`${API}/posts.json`, { headers: headers() });

    // 如果是公开访问且仓库私密 → 返回空（需要登录）
    if (!res.ok) {
      if (res.status === 404 || res.status === 403) return [];
      throw new Error(`HTTP ${res.status}`);
    }

    const data = (await res.json()) as { content?: string };
    if (!data.content) return [];

    const json = atob(data.content); // base64 解码
    return JSON.parse(json);
  } catch {
    return [];
  }
}

/** 获取单篇文章 */
export async function fetchPost(slug: string): Promise<Post | null> {
  try {
    const posts = await fetchPosts();
    const meta = posts.find((p) => p.slug === slug);

    const res = await fetch(`${API}/posts/${slug}.md`, { headers: headers() });
    if (!res.ok) return null;

    const data = (await res.json()) as { content?: string };
    if (!data.content) return null;

    const raw = atob(data.content);
    const html = await marked.parse(raw);

    return {
      slug,
      title: meta?.title ?? slug,
      date: meta?.date ?? "",
      tags: meta?.tags ?? [],
      excerpt: meta?.excerpt ?? "",
      content: html,
    };
  } catch {
    return null;
  }
}
