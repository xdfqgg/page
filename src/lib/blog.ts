import { marked } from "marked";

/**
 * blog.ts — 博客数据层
 *
 * 文章存储在 GitHub 仓库 `xdfqgg/wz` 中：
 *   - posts.json  → 文章索引（标题、日期、标签、摘要）
 *   - posts/*.md  → 文章正文（Markdown 格式）
 *
 * 使用 raw.githubusercontent.com 直链读取，不走 GitHub API，无频率限制。
 */

/** 文章元数据（来自 posts.json） */
export interface PostMeta {
  slug: string;    // 文件名（不含 .md），也是 URL 路径
  title: string;   // 标题
  date: string;    // 日期 YYYY-MM-DD
  tags: string[];  // 标签
  excerpt: string; // 摘要
}

/** 文章完整数据（元数据 + 正文 HTML） */
export interface Post extends PostMeta {
  content: string; // Markdown 渲染后的 HTML
}

/** wz 仓库 raw 地址 */
const RAW_BASE = "https://raw.githubusercontent.com/xdfqgg/wz/main";

/**
 * 获取所有文章的索引
 *
 * 从 wz 仓库根目录的 posts.json 读取。
 * 如果网络错误（仓库还没建、文件不存在等），返回空数组。
 */
export async function fetchPosts(): Promise<PostMeta[]> {
  try {
    const res = await fetch(`${RAW_BASE}/posts.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    console.warn("无法获取 posts.json，请确认 wz 仓库中存在该文件");
    return [];
  }
}

/**
 * 获取单篇文章（元数据 + 正文 HTML）
 *
 * @param slug — 文章文件名（不含 .md）
 */
export async function fetchPost(slug: string): Promise<Post | null> {
  try {
    // 1. 先从索引中找到这篇文章的元数据
    const posts = await fetchPosts();
    const meta = posts.find((p) => p.slug === slug);

    // 2. 获取 Markdown 原文
    const res = await fetch(`${RAW_BASE}/posts/${slug}.md`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.text();

    // 3. 解析 Markdown 为 HTML
    const html = await marked.parse(raw);

    return {
      // 如果没有在 posts.json 中找到元数据，用默认值
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
