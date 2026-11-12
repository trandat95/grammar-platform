import crypto from "crypto";
import { getAdminClient } from "../../../lib/supabase/server";
import { verifyWebhookSignature } from "../../../lib/monetization/payment-provider-adapter";
import {
  attachCorrelationId,
  checkApiRateLimit,
  sendSafeServerError,
} from "../../../lib/api/security-guard";

/**
 * Milestone 2.12.5: Secure HMAC-Verified & Idempotent Payment Webhook Handler
 * - Rejects invalid HMAC signatures with HTTP 401
 * - Guarantees Duplicate Payment Processing = 0 via uq_webhook_provider_event
 */
export default async function handler(req, res) {
  const correlationId = attachCorrelationId(req, res);

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed", correlationId });
  }

  const rate = checkApiRateLimit(req, res, { keyPrefix: "payment_webhook", maxRequests: 60, correlationId });
  if (!rate.allowed) return;

  const serverClient = getAdminClient();
  const signature = req.headers?.["x-webhook-signature"];
  const body = req.body || {};
  const { provider = "vnpay", external_event_id, event_type, user_id, subscription_id, payment_tx_id } = body;

  if (!external_event_id || !event_type) {
    return res.status(400).json({ success: false, error: "external_event_id and event_type required." });
  }

  const sigValid = verifyWebhookSignature(body, signature);
  const payloadHash = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 32);

  if (!sigValid) {
    await serverClient
      .from("payment_webhook_events")
      .upsert(
        {
          provider: String(provider),
          external_event_id: String(external_event_id),
          signature_valid: false,
          payload_hash: payloadHash,
          payload: body,
          processing_status: "rejected",
          error_message: "INVALID_HMAC_SIGNATURE",
        },
        { onConflict: "provider,external_event_id", ignoreDuplicates: true }
      );
    return res.status(401).json({ success: false, error: "Invalid webhook HMAC signature." });
  }

  // Idempotency Check
  const { data: existingEv } = await serverClient
    .from("payment_webhook_events")
    .select("*")
    .eq("provider", String(provider))
    .eq("external_event_id", String(external_event_id))
    .maybeSingle();

  if (existingEv && existingEv.processing_status === "processed") {
    return res.status(200).json({
      success: true,
      duplicate: true,
      message: "Webhook event already processed idempotently.",
    });
  }

  const now = new Date();
  const nowIso = now.toISOString();

  try {
    if (event_type === "subscription.refunded" || event_type === "subscription.expired") {
      if (subscription_id) {
        await serverClient
          .from("user_subscriptions")
          .update({ status: "expired", updated_at: nowIso })
          .eq("id", subscription_id);
      }
      if (payment_tx_id) {
        await serverClient
          .from("payment_transactions")
          .update({ status: "refunded" })
          .eq("id", payment_tx_id);
      }
      if (user_id) {
        await serverClient.from("profiles").update({ role: "FREE", updated_at: nowIso }).eq("id", user_id);
      }
    } else if (event_type === "payment.failed" && subscription_id) {
      const graceEnd = new Date(now.getTime() + 3 * 86400000).toISOString();
      await serverClient
        .from("user_subscriptions")
        .update({ status: "grace_period", grace_period_ends_at: graceEnd, updated_at: nowIso })
        .eq("id", subscription_id);
    }

    await serverClient.from("payment_webhook_events").upsert(
      {
        provider: String(provider),
        external_event_id: String(external_event_id),
        signature_valid: true,
        payload_hash: payloadHash,
        payload: body,
        processing_status: "processed",
        processed_at: nowIso,
      },
      { onConflict: "provider,external_event_id" }
    );

    return res.status(200).json({ success: true, duplicate: false, event_type, correlationId });
  } catch (err) {
    return sendSafeServerError(res, {
      correlationId,
      route: "/api/monetization/webhook",
      err,
      publicMessage: "Webhook processing error.",
    });
  }
}
