import { supabaseServer } from "../../../lib/supabase/server";

/**
 * SePay VA & VietQR Real-Time Incoming Transfer Webhook
 * Supports SePay Dashboard JSON format + `Authorization: Apikey <YOUR_API_KEY>`.
 * Delegates atomic reconciliation & VIP activation to SECURITY DEFINER RPC `process_sepay_webhook`.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const authHeader =
      req.headers?.authorization ||
      req.headers?.["x-sepay-apikey"] ||
      req.headers?.["x-api-key"] ||
      "";
    const providedApiKey = String(authHeader)
      .replace(/^(Apikey|Bearer)\s+/i, "")
      .trim();

    const payload = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    // Also allow optional fallback if deployment defines SEPAY_WEBHOOK_API_KEY env var and matches
    const envApiKey = process.env.SEPAY_WEBHOOK_API_KEY ? String(process.env.SEPAY_WEBHOOK_API_KEY).trim() : null;
    const effectiveKey =
      envApiKey && providedApiKey && envApiKey === providedApiKey
        ? providedApiKey
        : providedApiKey;

    const { data: rpcResult, error } = await supabaseServer.rpc("process_sepay_webhook", {
      p_provided_api_key: effectiveKey,
      p_payload: payload,
    });

    if (error) {
      console.error("SePay webhook RPC error:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    const status = Number(rpcResult?.http_status || 200);
    return res.status(status).json({
      success: Boolean(rpcResult?.ok),
      ...rpcResult,
    });
  } catch (err) {
    console.error("SePay webhook unexpected error:", err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || "Internal webhook error" });
  }
}
