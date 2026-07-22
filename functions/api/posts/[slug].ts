/**
 * GET /api/posts/:slug — 获取单篇文章的 Markdown 原文
 */

interface Env {
  GITHUB_TOKEN: string;
}

const API = "https://api.github.com/repos/xdfqgg/wz/contents/posts";

export async function onRequestGet(context: {
  request: Request;
  env: Env;
  params: { slug: string };
}) {
  const { env, params } = context;
  const { slug } = params;

  try {
    const res = await fetch(`${API}/${slug}.md`, {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "User-Agent": "xdfq-blog",
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) {
      return new Response("文章未找到", { status: 404 });
    }

    const data = (await res.json()) as { content?: string };
    if (!data.content) {
      return new Response("文章内容为空", { status: 404 });
    }

    // 解码 base64 → 返回 Markdown 原文
    const markdown = Buffer.from(data.content, "base64").toString("utf-8");
    return new Response(markdown, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch {
    return new Response("服务器错误", { status: 500 });
  }
}
