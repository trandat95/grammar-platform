import crypto from "crypto";

/**
 * Milestone 2.11.3 & 2.11.8: Free-Tier Safe API Security, Rate-Limiting & Observability Guard
 * - Zero Supabase DB writes for rate limiting (bounded in-memory sliding window)
 * - Correlation ID propagation (`x-correlation-id`)
 * - Standardized HTTP 400 / 401 / 403 / 404 / 422 / 429 / 500 JSON responses
 * - Strict error sanitization (no stack traces, DB URIs, or secrets leaked to clients)
 * - Secret-redacting structured server logger
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CORRELATION_ID_REGEX = /^[a-zA-Z0-9._-]{8,64}$/;
const MAX_RATE_BUCKETS = 2000;

const globalRateStore = globalThis.__grammarRateLimitStore || new Map();
if (!globalThis.__grammarRateLimitStore) {
  globalThis.__grammarRateLimitStore = globalRateStore;
}

const SENSITIVE_KEY_PATTERN = /(password|token|secret|authorization|apikey|api_key|service_role|cookie)/i;

export function isValidUuid(value) {
  return typeof value === "string" && UUID_REGEX.test(value.trim());
}

export function getClientIp(req) {
  const fwd = req?.headers?.["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim().slice(0, 64);
  }
  const realIp = req?.headers?.["x-real-ip"];
  if (typeof realIp === "string" && realIp.length > 0) {
    return realIp.trim().slice(0, 64);
  }
  return req?.socket?.remoteAddress || "unknown";
}

export function attachCorrelationId(req, res) {
  const rawHeader = req?.headers?.["x-correlation-id"];
  const cleanIncoming =
    typeof rawHeader === "string" && CORRELATION_ID_REGEX.test(rawHeader.trim())
      ? rawHeader.trim()
      : null;
  const correlationId = cleanIncoming || crypto.randomUUID();
  if (res && typeof res.setHeader === "function") {
    res.setHeader("x-correlation-id", correlationId);
    res.setHeader("X-Content-Type-Options", "nosniff");
  }
  return correlationId;
}

export function getCorrelationId(req) {
  const rawHeader = req?.headers?.["x-correlation-id"];
  return typeof rawHeader === "string" && CORRELATION_ID_REGEX.test(rawHeader.trim())
    ? rawHeader.trim()
    : crypto.randomUUID();
}

export function checkApiRateLimit(
  req,
  res,
  { keyPrefix = "api_default", maxRequests = 60, windowMs = 60 * 1000, correlationId = null } = {}
) {
  const ip = getClientIp(req);
  const bucketKey = `${keyPrefix}:${ip}`;
  const now = Date.now();
  const cutoff = now - windowMs;

  if (globalRateStore.size >= MAX_RATE_BUCKETS && !globalRateStore.has(bucketKey)) {
    const oldestKey = globalRateStore.keys().next().value;
    if (oldestKey) globalRateStore.delete(oldestKey);
  }

  const timestamps = (globalRateStore.get(bucketKey) || []).filter((ts) => ts > cutoff);
  if (timestamps.length >= maxRequests) {
    const retryAfterSec = Math.max(1, Math.ceil((timestamps[0] + windowMs - now) / 1000));
    if (res && typeof res.setHeader === "function") {
      res.setHeader("Retry-After", String(retryAfterSec));
      res.setHeader("X-RateLimit-Limit", String(maxRequests));
      res.setHeader("X-RateLimit-Remaining", "0");
    }
    if (res && typeof res.status === "function") {
      res.status(429).json({
        success: false,
        code: "TOO_MANY_REQUESTS",
        error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây.",
        retryAfterSeconds: retryAfterSec,
        correlationId: correlationId || undefined,
      });
    }
    return { allowed: false, remaining: 0, retryAfterSeconds: retryAfterSec };
  }

  timestamps.push(now);
  globalRateStore.set(bucketKey, timestamps);

  if (res && typeof res.setHeader === "function") {
    res.setHeader("X-RateLimit-Limit", String(maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, maxRequests - timestamps.length)));
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - timestamps.length),
    retryAfterSeconds: 0,
  };
}

export function redactSensitiveData(input, depth = 0) {
  if (depth > 3 || input === null || input === undefined) return input;
  if (typeof input === "string") {
    if (input.length > 24 && /^(eyJ|Bearer\s+eyJ|sb_|sbp_|postgres:\/\/)/i.test(input)) {
      return "[REDACTED]";
    }
    return input;
  }
  if (Array.isArray(input)) {
    return input.slice(0, 20).map((item) => redactSensitiveData(item, depth + 1));
  }
  if (typeof input === "object") {
    const out = {};
    for (const [k, v] of Object.entries(input)) {
      if (SENSITIVE_KEY_PATTERN.test(k)) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = redactSensitiveData(v, depth + 1);
      }
    }
    return out;
  }
  return input;
}

export function logStructuredError({ correlationId, route, status = 500, err, context = {} }) {
  const payload = {
    level: status >= 500 ? "error" : "warn",
    timestamp: new Date().toISOString(),
    correlationId: correlationId || null,
    route: route || "unknown",
    status,
    errorCode: err?.code || null,
    message: typeof err === "string" ? err : err?.message || "Unexpected server error",
    context: redactSensitiveData(context),
  };
  console.error(JSON.stringify(payload));
}

/**
 * Prevents leaking Postgres internals, connection strings, or stack traces to HTTP clients.
 */
export function sendSafeServerError(
  res,
  {
    correlationId = null,
    route = "api",
    err = null,
    status = 500,
    publicMessage = "Hệ thống đang bận hoặc gặp sự cố tạm thời. Vui lòng thử lại sau.",
    context = {},
  } = {}
) {
  if (err) {
    logStructuredError({ correlationId, route, status, err, context });
  }
  return res.status(status).json({
    success: false,
    code: status === 422 ? "VALIDATION_ERROR" : status === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
    error: publicMessage,
    ...(correlationId ? { correlationId } : {}),
  });
}

export function sanitizeShortText(value, maxLength = 500) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength);
}
