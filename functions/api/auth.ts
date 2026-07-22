/**
 * /api/auth — 用户认证
 *
 * POST /api/auth/login    — 登录，返回 JWT
 * POST /api/auth/register — 注册新用户
 * GET  /api/auth/me       — 验证 Token，返回用户信息
 *
 * 用户数据存储在私密 GitHub 仓库 xdfqgg/wz 的 data/users.json。
 * GITHUB_TOKEN 为 Cloudflare Secret，用于读写 wz 仓库。
 */

interface Env {
  GITHUB_TOKEN: string;
  JWT_SECRET: string;
}

interface User {
  username: string;
  password: string; // SHA-256 hash
  role: "admin" | "user";
  created: string;
}

const WZ_API = "https://api.github.com/repos/xdfqgg/wz/contents";
const USERS_PATH = "data/users.json";

/** GitHub API 请求头 */
function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "User-Agent": "xdfq-blog",
    Accept: "application/vnd.github.v3+json",
  };
}

/** SHA-256 哈希 */
async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 从 wz 仓库读取 users.json */
async function getUsers(
  token: string
): Promise<{ users: User[]; sha: string }> {
  const res = await fetch(`${WZ_API}/${USERS_PATH}`, {
    headers: ghHeaders(token),
  });
  if (!res.ok) throw new Error("无法读取用户数据");
  const data = (await res.json()) as { content: string; sha: string };
  const users = JSON.parse(atob(data.content)) as User[];
  return { users, sha: data.sha };
}

/** 更新 wz 仓库中的 users.json */
async function saveUsers(
  token: string,
  users: User[],
  sha: string
): Promise<void> {
  const content = btoa(JSON.stringify(users, null, 2));
  const body = JSON.stringify({
    message: "update users.json",
    content,
    sha,
  });
  await fetch(`${WZ_API}/${USERS_PATH}`, {
    method: "PUT",
    headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body,
  });
}

/** 生成简单的 JWT（HMAC-SHA256） */
async function signToken(
  payload: object,
  secret: string
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const full = { ...payload, iat: now, exp: now + 86400 * 7 }; // 7天过期

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const headerB64 = encode(header);
  const payloadB64 = encode(full);
  const toSign = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(toSign)
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${toSign}.${sigB64}`;
}

/** 验证 JWT */
async function verifyToken(
  tokenStr: string,
  secret: string
): Promise<Record<string, unknown> | null> {
  try {
    const parts = tokenStr.split(".");
    if (parts.length !== 3) return null;

    const toSign = `${parts[0]}.${parts[1]}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = Uint8Array.from(atob(parts[2].replace(/-/g, "+").replace(/_/g, "/")), (c) =>
      c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(toSign)
    );

    if (!valid) return null;

    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>;

    // 检查过期
    if (payload.exp && (payload.exp as number) < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ─── 路由分发 ───

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  const { env, request } = context;
  const url = new URL(request.url);

  if (url.pathname.endsWith("/login")) {
    return handleLogin(request, env);
  }
  if (url.pathname.endsWith("/register")) {
    return handleRegister(request, env);
  }

  return Response.json({ error: "not found" }, { status: 404 });
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  const { env, request } = context;
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");

  const payload = await verifyToken(token, env.JWT_SECRET);
  if (!payload) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  return Response.json({ username: payload.username, role: payload.role });
}

/** 登录 */
async function handleLogin(request: Request, env: Env) {
  try {
    const { username, password } = (await request.json()) as {
      username?: string;
      password?: string;
    };

    if (!username || !password) {
      return Response.json({ error: "请输入用户名和密码" }, { status: 400 });
    }

    const { users } = await getUsers(env.GITHUB_TOKEN);
    const user = users.find((u) => u.username === username);

    if (!user) {
      return Response.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const hash = await sha256(password);
    if (hash !== user.password) {
      return Response.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const token = await signToken(
      { username: user.username, role: user.role },
      env.JWT_SECRET
    );

    return Response.json({ success: true, token, role: user.role });
  } catch (err) {
    console.error("login error:", err);
    return Response.json({ error: "服务器错误" }, { status: 500 });
  }
}

/** 注册 */
async function handleRegister(request: Request, env: Env) {
  try {
    const { username, password } = (await request.json()) as {
      username?: string;
      password?: string;
    };

    if (!username || !password) {
      return Response.json({ error: "请输入用户名和密码" }, { status: 400 });
    }

    if (username.length < 2 || password.length < 6) {
      return Response.json(
        { error: "用户名至少2位，密码至少6位" },
        { status: 400 }
      );
    }

    const { users, sha } = await getUsers(env.GITHUB_TOKEN);

    if (users.find((u) => u.username === username)) {
      return Response.json({ error: "用户名已存在" }, { status: 409 });
    }

    const hash = await sha256(password);
    const newUser: User = {
      username,
      password: hash,
      role: "user",
      created: new Date().toISOString().slice(0, 10),
    };

    users.push(newUser);
    await saveUsers(env.GITHUB_TOKEN, users, sha);

    const token = await signToken(
      { username: newUser.username, role: newUser.role },
      env.JWT_SECRET
    );

    return Response.json({ success: true, token, role: "user" });
  } catch (err) {
    console.error("register error:", err);
    return Response.json({ error: "服务器错误" }, { status: 500 });
  }
}
