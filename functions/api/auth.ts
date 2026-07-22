/**
 * POST /api/auth — 管理员登录验证
 *
 * 接收密码，和 Cloudflare 环境变量 ADMIN_PASSWORD 比对。
 * 成功后返回一个 token，前端存 localStorage。
 *
 * 部署后在 Cloudflare Dashboard 设置环境变量：
 *   Workers & Pages → 你的项目 → Settings → Variables
 *   添加 ADMIN_PASSWORD = 你的密码
 */

interface Env {
  ADMIN_PASSWORD: string;
  ADMIN_TOKEN: string;
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  const { env, request } = context;

  try {
    const { password } = (await request.json()) as { password?: string };

    if (!password) {
      return Response.json({ error: "请输入密码" }, { status: 400 });
    }

    if (password !== env.ADMIN_PASSWORD) {
      return Response.json({ error: "密码错误" }, { status: 401 });
    }

    // 登录成功，返回 token
    return Response.json({
      success: true,
      token: env.ADMIN_TOKEN || "admin-authenticated",
    });
  } catch {
    return Response.json({ error: "请求无效" }, { status: 400 });
  }
}
