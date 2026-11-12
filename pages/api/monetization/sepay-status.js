import { getAdminClient } from "../../../lib/supabase/server";
import { verifyServerSession } from "../../../lib/supabase/middleware";
import { resolveUserEntitlement } from "../../../lib/monetization/entitlement-engine";
import {
  attachCorrelationId,
  checkApiRateLimit,
  sendSafeServerError,
} from "../../../lib/api/security-guard";

/**
 * Polling endpoint for active SePay VietQR order status (`pending` -> `succeeded`).
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, error: "Method not allowed", correlationId });
  }

  const rate = checkApiRateLimit(req, res, { keyPrefix: "sepay_status", maxRequests: 60, correlationId });
  if (!rate.allowed) return;

  const authUser = await verifyServerSession(req);
  if (!authUser) {
    return res.status(401).json({ success: false, error: "Unauthorized", correlationId });
  }

  const orderCode = String(req.query?.order_code || "").trim().toUpperCase();
  if (!orderCode || orderCode.length > 48) {
    return res.status(400).json({ success: false, error: "Missing or invalid order_code parameter.", correlationId });
  }

  const serverClient = getAdminClient(req);
  try {
    const { data: tx, error } = await serverClient
      .from("payment_transactions")
      .select("id, status, provider, provider_tx_id, final_amount_vnd, coupon_code, created_at, metadata")
      .eq("user_id", authUser.id)
      .eq("provider_tx_id", orderCode)
      .maybeSingle();

    if (error) throw error;
    if (!tx) {
      return res.status(404).json({ success: false, error: "Không tìm thấy đơn thanh toán.", correlationId });
    }

    let entitlement = null;
    if (tx.status === "succeeded") {
      entitlement = await resolveUserEntitlement({ serverClient, userId: authUser.id });
    }

    return res.status(200).json({
      success: true,
      correlationId,
      transaction: tx,
      paid: tx.status === "succeeded",
      entitlement,
    });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: "/api/monetization/sepay-status",
      err,
      publicMessage: "Không thể kiểm tra trạng thái đơn thanh toán.",
    });
  }
}
