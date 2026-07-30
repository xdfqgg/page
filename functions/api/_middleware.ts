/**
 * functions/api/_middleware.ts — /api/* 路径的共享中间件
 *
 * 职责：
 * 1. OPTIONS 预检 → 返回 CORS 头
 * 2. 所有请求附加 CORS 头
 * 3. 不做鉴权（各端点按需调用 auth.ts 验证）
 *
 * Cloudflare Pages Functions 约定：
 *   functions/api/_middleware.ts → 作用于 /api/* 所有路径
 */

import { corsHeaders, getAllowedOrigin, handlePreflight } from "../lib/cors";

export async function onRequest(
  context: EventContext<unknown, string, unknown>,
): Promise<Response> {
  const { request, next } = context;

  // OPTIONS 预检：直接返回，不进入端点逻辑
  if (request.method === "OPTIONS") {
    return handlePreflight(request);
  }

  // 执行端点逻辑
  const response = await next();

  // 附加 CORS 头到响应
  const origin = getAllowedOrigin(request);
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
