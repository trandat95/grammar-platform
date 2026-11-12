import { verifyAdmin } from "../supabase/middleware";
import { attachCorrelationId } from "../api/security-guard";

/**
 * Milestone 2.4.6 & 2.4.9: Centralized Admin RBAC Guard, Sliding-Window Rate Limiter
 * (max 30 ops/min/IP) & Step-Up Security Confirmation ('CONFIRM_SECURITY_ACTION').
 */

export const STEP_UP_PHRASE = "CONFIRM_SECURITY_ACTION";
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_OPS = 30;

const rateLimitStore = new Map();

export function getClientIp(req) {
  const fwd = req?.headers?.["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim();
  }
  return req?.socket?.remoteAddress || "unknown";
}

export function checkAdminRateLimit(req, keyPrefix = "admin") {
  const ip = getClientIp(req);
  const bucketKey = `${keyPrefix}:${ip}`;
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;

  const timestamps = (rateLimitStore.get(bucketKey) || []).filter((ts) => ts > cutoff);
  if (timestamps.length >= RATE_LIMIT_MAX_OPS) {
    return { allowed: false, remaining: 0, retryAfterSeconds: 60 };
  }

  timestamps.push(now);
  rateLimitStore.set(bucketKey, timestamps);
  return { allowed: true, remaining: RATE_LIMIT_MAX_OPS - timestamps.length, retryAfterSeconds: 0 };
}

/**
 * Runs 3-stage Admin Authorization:
 * 1. Rate Limit Check (HTTP 429)
 * 2. Zero-Trust JWT + DB Role Check (HTTP 403)
 * 3. Optional Step-Up Confirmation Check for high-risk mutations (HTTP 400)
 */
export async function verifyAdminWithGuard(
  req,
  res,
  { requireStepUp = false, rateLimitKeyPrefix = "admin_sensitive" } = {}
) {
  const correlationId = attachCorrelationId(req, res);
  const rate = checkAdminRateLimit(req, rateLimitKeyPrefix);
  if (!rate.allowed) {
    res.setHeader("Retry-After", String(rate.retryAfterSeconds));
    res.status(429).json({
      success: false,
      error: "Too Many Requests: Vượt ngưỡng 30 thao tác quản trị/phút. Vui lòng thử lại sau 60 giây.",
      correlationId,
    });
    return null;
  }

  const adminContext = await verifyAdmin(req);
  if (!adminContext) {
    console.warn(`[Security Alert] correlationId=${correlationId} Unauthorized admin API attempt from IP=${getClientIp(req)} path=${req?.url}`);
    res.status(403).json({
      success: false,
      error: "Forbidden: Yêu cầu chữ ký Quản trị viên (ADMIN) hợp lệ từ Supabase Auth.",
      correlationId,
    });
    return null;
  }

  if (requireStepUp) {
    const providedPhrase = req?.body?.confirmationText;
    if (providedPhrase !== STEP_UP_PHRASE) {
      res.status(400).json({
        success: false,
        requiresStepUp: true,
        error: `Hành động nhạy cảm yêu cầu nhập chính xác chuỗi xác nhận '${STEP_UP_PHRASE}'.`,
        correlationId,
      });
      return null;
    }
  }

  return { ...adminContext, correlationId };
}
