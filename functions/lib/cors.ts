/**
 * functions/lib/cors.ts — CORS 头构建工具
 *
 * 安全规则：
 * - 生产环境：只允许 ALLOWED_ORIGINS 中配置的来源
 * - 开发环境：允许 localhost:5173（Vite dev server）
 * - 绝不使用 Access-Control-Allow-Origin: "*"（尤其写接口）
 *
 * 用法（在 _middleware.ts 或端点中）：
 *   import { corsHeaders, getAllowedOrigin } from "../lib/cors";
 *   const origin = getAllowedOrigin(request);
 *   return new Response(JSON.stringify(data), {
 *     headers: { ...corsHeaders(origin), "Content-Type": "application/json" }
 *   });
 */

/**
 * 从请求头中获取 Origin，并检查是否在允许列表中
 *
 * @returns 允许的 origin 字符串，不在白名单中返回 null
 */
export function getAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) return null;

  const allowed = getAllowedOrigins();

  // 开发环境：允许所有 localhost 来源
  if (origin.startsWith("http://localhost:")) {
    return origin;
  }

  // 生产环境：精确匹配白名单
  if (allowed.includes(origin)) {
    return origin;
  }

  return null;
}

/**
 * 获取允许的来源列表
 *
 * 优先级：环境变量 > 默认值（生产域名 + 开发地址）
 */
function getAllowedOrigins(): string[] {
  // 从环境变量读取（逗号分隔）
  const envOrigins = (
    // Pages Functions 用 context.env，此处为通用的 process.env 写法
    typeof process !== "undefined" ? process.env.ALLOWED_ORIGINS : ""
  ) || "";

  if (envOrigins) {
    return envOrigins.split(",").map((s) => s.trim());
  }

  // 默认：开发地址（后续上线时改为你的域名）
  return [
    "http://localhost:5173",
    "http://localhost:8788",
    // TODO: 添加生产域名，例如：
    // "https://your-project.pages.dev",
  ];
}

/**
 * 构建 CORS 响应头
 *
 * @param origin - 允许的 origin（从 getAllowedOrigin 获取）
 * @returns CORS 相关的 Headers 对象
 */
export function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {};

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
  headers["Access-Control-Allow-Headers"] =
    "Content-Type, Authorization";
  headers["Access-Control-Max-Age"] = "86400"; // 预检缓存 24h

  return headers;
}

/**
 * 处理 OPTIONS 预检请求
 *
 * 在 _middleware.ts 中：
 *   if (request.method === "OPTIONS") {
 *     return handlePreflight(request);
 *   }
 */
export function handlePreflight(request: Request): Response {
  const origin = getAllowedOrigin(request);
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}
