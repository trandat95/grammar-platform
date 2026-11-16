import { supabaseServer } from "../../../lib/supabase/server";
import {
  attachCorrelationId,
  checkApiRateLimit,
  sanitizeShortText,
  sendSafeServerError,
} from "../../../lib/api/security-guard";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Milestone 2.15.27: Instant Auto-Confirmed Registration API
 * Creates a Supabase Auth user with `email_confirm: true` via service_role
 * so learners can register and log in immediately without email verification.
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed", correlationId });
  }

  const rate = checkApiRateLimit(req, res, {
    keyPrefix: "auth_register",
    maxRequests: 15,
    windowMs: 60 * 1000,
    correlationId,
  });
  if (!rate.allowed) return;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({
      success: false,
      code: "SERVICE_ROLE_UNAVAILABLE",
      error: "Auto-confirm registration unavailable; fallback to standard signUp.",
      correlationId,
    });
  }

  try {
    const { email, password, fullName = "" } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");
    const cleanName = sanitizeShortText(String(fullName || cleanEmail.split("@")[0] || "Học viên"), 120);

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(422).json({
        success: false,
        code: "INVALID_EMAIL",
        error: "Địa chỉ email không hợp lệ.",
        correlationId,
      });
    }

    if (cleanPassword.length < 6 || cleanPassword.length > 128) {
      return res.status(422).json({
        success: false,
        code: "INVALID_PASSWORD",
        error: "Mật khẩu phải có từ 6 đến 128 ký tự.",
        correlationId,
      });
    }

    const { data, error } = await supabaseServer.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        role: "FREE",
      },
    });

    if (error) {
      const msg = String(error.message || "");
      if (/already been registered|already exists|duplicate|email_exists/i.test(msg)) {
        return res.status(409).json({
          success: false,
          code: "EMAIL_EXISTS",
          error: `Email "${cleanEmail}" đã được đăng ký trước đó. Vui lòng chuyển sang tab Đăng nhập!`,
          correlationId,
        });
      }
      return res.status(400).json({
        success: false,
        code: "REGISTER_FAILED",
        error: msg || "Không thể tạo tài khoản lúc này.",
        correlationId,
      });
    }

    if (data?.user?.id) {
      await supabaseServer
        .from("profiles")
        .upsert(
          {
            id: data.user.id,
            email: cleanEmail,
            full_name: cleanName,
            role: "FREE",
            status: "ACTIVE",
          },
          { onConflict: "id", ignoreDuplicates: true }
        );
    }

    return res.status(200).json({
      success: true,
      autoConfirmed: true,
      user: data.user,
      correlationId,
    });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: "/api/auth/register",
      err,
      publicMessage: "Lỗi hệ thống khi tạo tài khoản.",
    });
  }
}
