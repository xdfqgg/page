/**
 * functions/lib/auth.ts — 认证工具库
 *
 * 依赖（需要安装）：
 *   npm install bcryptjs jsonwebtoken
 *   npm install -D @types/bcryptjs @types/jsonwebtoken
 *
 * 安全要点：
 * - bcryptjs：纯 JS 实现，Cloudflare Workers/Pages Functions 兼容
 * - 12 轮 salt（成本因子）：暴力破解难度 ~2^12 = 4096 倍
 * - JWT 短期有效（1h），减少泄露后的影响窗口
 *
 * 用法：
 *   import { hashPassword, verifyPassword, createToken, verifyToken } from "../lib/auth";
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ── 配置 ──────────────────────────────────────────

/** bcrypt 成本因子：越高越安全，但越慢。12 是通用平衡点 */
const SALT_ROUNDS = 12;

/** JWT 过期时间 */
const JWT_EXPIRES_IN = "1h";

/**
 * 获取 JWT SECRET
 *
 * 必须通过环境变量 JWT_SECRET 设置！
 * 本地开发：在 .dev.vars 中设置（Cloudflare Pages Functions 本地开发文件）
 * 生产：在 Cloudflare Dashboard → Pages → Settings → Environment variables
 */
function getSecret(): string {
  // Pages Functions 用 context.env，此处为通用访问方式
  const secret =
    typeof process !== "undefined" ? process.env.JWT_SECRET : "";
  if (!secret) {
    throw new Error("JWT_SECRET 环境变量未设置！");
  }
  return secret;
}

// ── 密码散列 ──────────────────────────────────────

/**
 * 散列密码
 *
 * bcrypt 内部自动生成随机 salt + 嵌入 hash 中。
 * 同一个密码两次调用产生的结果不同（salt 不同），
 * 所以只能用 verifyPassword 比较，不能直接字符串比较。
 *
 * @param password - 明文密码
 * @returns bcrypt hash 字符串（60 字符，包含 salt 和成本因子）
 *
 * 示例输出：$2a$12$L9B7...（$2a=算法, 12=成本, 后面是 salt+hash）
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 *
 * @param password - 用户输入的明文密码
 * @param hash - 数据库中存储的 bcrypt hash
 * @returns true = 密码匹配
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 判断 hash 是否为 bcrypt 格式
 *
 * 用于迁移：如果旧用户还是 SHA-256，
 * 登录成功后重新散列为 bcrypt 并存回数据库。
 */
export function isBcryptHash(hash: string): boolean {
  return hash.startsWith("$2a$") || hash.startsWith("$2b$");
}

// ── JWT ───────────────────────────────────────────

interface TokenPayload {
  userId: string;
  role: string;
}

/**
 * 签发 JWT
 *
 * @param payload - 存入 token 的数据（不要放敏感信息，JWT 可解码）
 * @returns JWT 字符串
 */
export function createToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * 验证 JWT
 *
 * @param token - 从 Authorization: Bearer <token> 中提取的 token
 * @returns 解码后的 payload；无效/过期返回 null
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getSecret()) as TokenPayload;
  } catch {
    return null; // 过期、签名不匹配、格式错误
  }
}

/**
 * 从请求头中提取 Bearer token
 *
 * @param request - Fetch API 的 Request 对象
 * @returns token 字符串，无 token 返回 null
 */
export function extractToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7); // 去掉 "Bearer " 前缀
}
