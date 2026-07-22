import { marked } from "marked";

/**
 * blog.ts — 博客数据层
 *
 * 文章存储在私密 GitHub 仓库 xdfqgg/wz。
 * 前端不直接访问 GitHub，而是通过 Cloudflare Pages Functions 代理。
 *
 * API 端点：
 *   GET  /api/posts        → 文章列表
 *   GET  /api/posts/:slug  → 单篇文章（Markdown 原文）
 */

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
}

export interface Post extends PostMeta {
  content: string; // HTML
}

/** 获取文章列表 */
export async function fetchPosts(): Promise<PostMeta[]> {
  try {
    const res = await fetch("/api/posts");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    console.warn("无法获取文章列表");
    return [];
  }
}

/** 获取单篇文章 */
export async function fetchPost(slug: string): Promise<Post | null> {
  try {
    // 1. 先拿到元数据
    const posts = await fetchPosts();
    const meta = posts.find((p) => p.slug === slug);

    // 2. 获取 Markdown 原文（通过代理 API）
    const res = await fetch(`/api/posts/${slug}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.text();

    // 3. 渲染为 HTML
    const html = await marked.parse(raw);

    return {
      slug,
      title: meta?.title ?? slug,
      date: meta?.date ?? "",
      tags: meta?.tags ?? [],
      excerpt: meta?.excerpt ?? "",
      content: html,
    };
  } catch (err) {
    console.error(`无法获取文章 "${slug}":`, err);
    return null;
  }
}
