/**
 * functions/lib/error.ts — 统一错误响应格式
 *
 * 所有 API 端点返回的错误都遵循此格式：
 *   { error: '人类可读的消息', code: 'ERR_NAME' }
 *
 * 前端 http.ts 会据此抛出 ApiError，Login 页面据此展示错误提示。
 */

/** 错误码常量：避免散落字符串 */
export const ErrorCode = {
  MISSING_FIELDS: "MISSING_FIELDS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_EXISTS: "USER_EXISTS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT: "RATE_LIMIT",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * 构建标准错误响应
 *
 * @param message - 人类可读的错误消息（不要暴露内部细节）
 * @param code - 错误码，前端据此做逻辑判断
 * @param status - HTTP 状态码
 */
export function errorResponse(
  message: string,
  code: ErrorCodeType,
  status: number,
): Response {
  return new Response(
    JSON.stringify({ error: message, code }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}

// 常用错误快捷方法

export const Err = {
  missingFields: (fields: string) =>
    errorResponse(`缺少必填字段：${fields}`, ErrorCode.MISSING_FIELDS, 400),

  invalidCredentials: () =>
    errorResponse("用户名或密码错误", ErrorCode.INVALID_CREDENTIALS, 401),

  userExists: () =>
    errorResponse("用户名已被注册", ErrorCode.USER_EXISTS, 409),

  unauthorized: () =>
    errorResponse("请先登录", ErrorCode.UNAUTHORIZED, 401),

  forbidden: () =>
    errorResponse("无权执行此操作", ErrorCode.FORBIDDEN, 403),

  notFound: (resource = "资源") =>
    errorResponse(`${resource}不存在`, ErrorCode.NOT_FOUND, 404),

  internal: () =>
    // 不暴露内部细节
    errorResponse("服务器内部错误", ErrorCode.INTERNAL, 500),
};
