/**
 * http.ts — 共享 HTTP 工具库
 *
 * 职责：
 * 1. 鉴权头构建（从 localStorage 读取 token，自动附加到请求）
 * 2. 统一错误格式（ApiError，包含 code 便于前端判断）
 * 3. 乐观重试（409 并发冲突 / 429 限速 / 5xx 服务端错误）
 * 4. 超时控制（默认 30s）
 *
 * 设计原则：
 * - 不裸传用户名/密码（token 自动附带）
 * - 写操作默认重试，读操作不重试（幂等无关）
 * - 错误格式统一 { error: 'msg', code: 'ERR_NAME' }
 */

// ── 配置 ──────────────────────────────────────────

/** 后端地址 */
const BASE = "https://cf-backend-lake.vercel.app";

/** 最大重试次数 */
const MAX_RETRIES = 3;

/** 请求超时（毫秒） */
const TIMEOUT_MS = 30_000;

/** localStorage 中存储 token 的 key */
const TOKEN_KEY = "auth_token";

// ── 错误类型 ──────────────────────────────────────

/** 统一的 API 错误 */
export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }

  /** 友好的错误提示 */
  toUserMessage(): string {
    switch (this.code) {
      case "RATE_LIMIT":
        return "请求太频繁，请稍后再试";
      case "CONFLICT":
        return "数据冲突，已自动重试";
      case "UNAUTHORIZED":
        return "登录已过期，请重新登录";
      case "NETWORK":
        return "网络连接失败，请检查网络";
      case "TIMEOUT":
        return "请求超时，请稍后重试";
      default:
        return this.message || "未知错误";
    }
  }
}

// ── 鉴权 ──────────────────────────────────────────

/** 从 localStorage 获取 token */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** 保存 token */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** 清除 token */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** 构建请求头：自动附加 Content-Type 和 Auth token */
function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// ── 重试判断 ──────────────────────────────────────

/** 哪些状态码值得重试 */
function shouldRetry(status: number): boolean {
  // 409: 并发写冲突（GitHub API 等）
  // 429: 限速
  // 5xx: 服务端临时故障
  return status === 409 || status === 429 || status >= 500;
}

/** 指数退避：1s → 2s → 4s */
function backoff(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 10_000);
}

// ── 核心请求函数 ──────────────────────────────────

interface RequestOptions {
  /** 请求方法 */
  method?: string;
  /** 请求体（自动 JSON.stringify） */
  body?: unknown;
  /** 额外的请求头 */
  headers?: Record<string, string>;
  /** 是否重试（写操作默认 true） */
  retry?: boolean;
  /** 超时时间（ms） */
  timeout?: number;
}

/**
 * 统一的请求函数
 *
 * 特性：
 * - 自动附加 Auth token
 * - 写操作（POST/PUT/DELETE）自动重试 409/429/5xx
 * - 超时控制
 * - 统一抛出 ApiError
 */
async function request<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const method = opts.method || "GET";
  const shouldAutoRetry = opts.retry ?? (method !== "GET");
  const maxRetries = shouldAutoRetry ? MAX_RETRIES : 0;

  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // 重试前等待（指数退避）
    if (attempt > 0 && lastError) {
      await new Promise((r) => setTimeout(r, backoff(attempt - 1)));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts.timeout || TIMEOUT_MS);

    try {
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers: buildHeaders(opts.headers),
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 成功：尝试解析 JSON，失败则返回原始文本
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          return (await res.json()) as T;
        }
        return (await res.text()) as unknown as T;
      }

      // 失败：解析错误体
      let errorData: { error?: string; code?: string } = {};
      try {
        errorData = await res.json();
      } catch {
        // 无法解析 JSON，使用状态文本
      }

      const message = errorData.error || res.statusText || "请求失败";
      const code = errorData.code || `HTTP_${res.status}`;

      lastError = new ApiError(message, code, res.status);

      // 不值得重试的状态码，直接抛出
      if (!shouldRetry(res.status)) {
        throw lastError;
      }

      // 值得重试，继续循环
      console.warn(
        `[http] ${method} ${path} → ${res.status}，第 ${attempt + 1}/${maxRetries + 1} 次尝试`,
      );
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof ApiError) {
        lastError = err;
        if (!shouldRetry(err.status)) throw err;
        continue;
      }

      // AbortError（超时）
      if (err instanceof DOMException && err.name === "AbortError") {
        lastError = new ApiError("请求超时", "TIMEOUT", 0);
        if (maxRetries > 0) continue;
        throw lastError;
      }

      // 网络错误（fetch 失败）
      lastError = new ApiError(
        "网络连接失败",
        "NETWORK",
        0,
      );
      if (maxRetries > 0) continue;
      throw lastError;
    }
  }

  // 所有重试耗尽
  throw lastError || new ApiError("请求失败", "UNKNOWN", 0);
}

// ── 便捷方法 ──────────────────────────────────────

export const http = {
  get<T = unknown>(path: string, opts?: RequestOptions) {
    return request<T>(path, { ...opts, method: "GET" });
  },

  post<T = unknown>(path: string, body?: unknown, opts?: RequestOptions) {
    return request<T>(path, { ...opts, method: "POST", body });
  },

  put<T = unknown>(path: string, body?: unknown, opts?: RequestOptions) {
    return request<T>(path, { ...opts, method: "PUT", body });
  },

  del<T = unknown>(path: string, opts?: RequestOptions) {
    return request<T>(path, { ...opts, method: "DELETE", ...opts });
  },
};

export default http;
