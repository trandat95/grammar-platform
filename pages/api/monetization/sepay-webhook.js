import { supabaseServer } from "../../../lib/supabase/server";
import {
  attachCorrelationId,
  checkApiRateLimit,
  sendSafeServerError,
} from "../../../lib/api/security-guard";

/**
 * SePay VA & VietQR Real-Time Incoming Transfer Webhook
 * Supports SePay Dashboard JSON format + `Authorization: Apikey <YOUR_API_KEY>`.
 * Delegates atomic reconciliation & VIP activation to SECURITY DEFINER RPC `process_sepay_webhook`.
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed", correlationId });
  }

  const rate = checkApiRateLimit(req, res, { keyPrefix: "sepay_webhook", maxRequests: 60, correlationId });
  if (!rate.allowed) return;

  try {
    const authHeader =
      req.headers?.authorization ||
      req.headers?.["x-sepay-apikey"] ||
      req.headers?.["x-api-key"] ||
      "";
    const providedApiKey = String(authHeader)
      .replace(/^(Apikey|Bearer)\s+/i, "")
      .trim();

    if (!providedApiKey) {
      return res.status(401).json({ success: false, error: "Missing SePay API key.", correlationId });
    }

    const payload = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    const { data: rpcResult, error } = await supabaseServer.rpc("process_sepay_webhook", {
      p_provided_api_key: providedApiKey,
      p_payload: payload,
    });

    if (error) {
      return sendSafeServerError(res, {
        correlationId,
        route: "/api/monetization/sepay-webhook",
        err: error,
        publicMessage: "Webhook processing failed.",
      });
    }

    const status = Number(rpcResult?.http_status || 200);
    return res.status(status).json({
      success: Boolean(rpcResult?.ok),
      correlationId,
      ...rpcResult,
    });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: "/api/monetization/sepay-webhook",
      err,
      publicMessage: "Internal webhook error",
    });
  }
}
