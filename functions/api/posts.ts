/**
 * GET /api/posts — 获取文章列表
 *
 * 用 GitHub API 读取私密仓库 xdfqgg/wz 中的 posts.json。
 * GITHUB_TOKEN 通过 Cloudflare 环境变量注入（wrangler secret）。
 * 响应不包含 Token，前端安全。
 */

interface Env {
  GITHUB_TOKEN: string;
}

/** GitHub API 基础地址 */
const API = "https://api.github.com/repos/xdfqgg/wz/contents";

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  const { env } = context;

  try {
    const res = await fetch(`${API}/posts.json`, {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "User-Agent": "xdfq-blog",
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) {
      return Response.json(
        { error: "无法获取文章列表" },
        { status: res.status }
      );
    }

    // GitHub API 返回 { content: base64, encoding: "base64", ... }
    const data = (await res.json()) as { content?: string };
    if (!data.content) {
      return Response.json([]);
    }

    // 解码 base64
    const json = Buffer.from(data.content, "base64").toString("utf-8");
    return new Response(json, {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json({ error: "服务器错误" }, { status: 500 });
  }
}
