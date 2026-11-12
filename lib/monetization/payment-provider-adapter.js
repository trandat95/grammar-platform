import crypto from "crypto";

/**
 * Milestone 2.12.4 & 2.12.5: Multi-Provider Payment Adapter (VNPay, MoMo, Stripe),
 * Authoritative Server Pricing Calculation & HMAC-SHA256 Webhook Security
 */

function getWebhookSecret() {
  const configured = process.env.PAYMENT_WEBHOOK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (configured) return configured;
  if (process.env.NODE_ENV !== "production") {
    return "grammar_dev_webhook_secret_v1";
  }
  return "";
}

export function createWebhookSignature(payloadObj) {
  const secret = getWebhookSecret();
  if (!secret) return "";
  const serialized = typeof payloadObj === "string" ? payloadObj : JSON.stringify(payloadObj || {});
  return crypto.createHmac("sha256", secret).update(serialized).digest("hex");
}

export function verifyWebhookSignature(payloadObj, providedSig = "") {
  const secret = getWebhookSecret();
  if (!secret || !providedSig || typeof providedSig !== "string") return false;
  const expected = createWebhookSignature(payloadObj);
  if (!expected) return false;
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(String(providedSig).trim(), "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Pure server-side checkout pricing calculator (zero trust on client amounts or intent scores).
 */
export function calculateServerOrderPricing({ plan, coupon = null, now = new Date() }) {
  const basePrice = Math.max(0, Math.round(Number(plan?.price_vnd || 0)));
  if (!coupon || !coupon.is_active) {
    return { basePrice, discountVnd: 0, finalPrice: basePrice, couponApplied: null, couponError: coupon ? "Mã giảm giá không còn hiệu lực." : null };
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= now.getTime()) {
    return { basePrice, discountVnd: 0, finalPrice: basePrice, couponApplied: null, couponError: "Mã giảm giá đã hết hạn." };
  }
  if (Number(coupon.used_count || 0) >= Number(coupon.max_uses || 1000)) {
    return { basePrice, discountVnd: 0, finalPrice: basePrice, couponApplied: null, couponError: "Mã giảm giá đã hết lượt sử dụng." };
  }
  if (basePrice < Number(coupon.min_amount_vnd || 0)) {
    return { basePrice, discountVnd: 0, finalPrice: basePrice, couponApplied: null, couponError: `Áp dụng cho đơn tối thiểu ${Number(coupon.min_amount_vnd).toLocaleString()}đ.` };
  }

  let discountVnd = 0;
  if (coupon.discount_type === "percent") {
    discountVnd = Math.round((basePrice * Math.min(90, Number(coupon.discount_value || 0))) / 100);
  } else {
    discountVnd = Math.min(basePrice, Math.round(Number(coupon.discount_value || 0)));
  }

  return {
    basePrice,
    discountVnd,
    finalPrice: Math.max(0, basePrice - discountVnd),
    couponApplied: coupon.code,
    couponError: null,
  };
}

/**
 * Computes subscription period end date from billing cycle cleanly.
 */
export function computeSubscriptionEndDate(billingCycle = "monthly", now = new Date(), isTrial = false, trialDays = 7) {
  const end = new Date(now.getTime());
  if (isTrial) {
    end.setUTCDate(end.getUTCDate() + Math.max(1, Number(trialDays || 7)));
    return end;
  }
  if (billingCycle === "quarterly") {
    end.setUTCMonth(end.getUTCMonth() + 3);
  } else if (billingCycle === "yearly") {
    end.setUTCFullYear(end.getUTCFullYear() + 1);
  } else if (billingCycle === "lifetime") {
    end.setUTCFullYear(end.getUTCFullYear() + 50);
  } else {
    end.setUTCMonth(end.getUTCMonth() + 1);
  }
  return end;
}

/**
 * Provider-normalized payment adapter summary (SePay VA VietQR primary).
 */
export function normalizePaymentProviderAdapter(provider = "sepay") {
  const p = String(provider || "sepay").toLowerCase();
  const map = {
    sepay: { key: "sepay", label: "Chuyển khoản VietQR Tự Động (SePay VA)", currency: "VND" },
    vnpay: { key: "vnpay", label: "VNPay QR / ATM Nội địa", currency: "VND" },
    momo: { key: "momo", label: "Ví MoMo Siêu Tốc", currency: "VND" },
    stripe: { key: "stripe", label: "Stripe (Visa / Mastercard)", currency: "VND" },
  };
  return map[p] || map.sepay;
}

/**
 * Generates a dynamic SePay VietQR image URL (supports standard & Virtual Accounts).
 */
export function buildSepayVietQrUrl({
  bankCode = "MBBank",
  accountNumber = "",
  amountVnd = 0,
  orderCode = "",
  template = "compact",
} = {}) {
  const acc = encodeURIComponent(String(accountNumber || "").replace(/\s+/g, ""));
  const bank = encodeURIComponent(String(bankCode || "MBBank").replace(/\s+/g, ""));
  const amt = Math.max(0, Math.round(Number(amountVnd || 0)));
  const des = encodeURIComponent(String(orderCode || "").trim());
  const tpl = encodeURIComponent(String(template || "compact").trim());
  return `https://qr.sepay.vn/img?acc=${acc}&bank=${bank}&amount=${amt}&des=${des}&template=${tpl}`;
}
