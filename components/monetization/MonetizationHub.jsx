import React, { useState, useEffect, useCallback } from "react";
import { StorageAdapter } from "../../lib/sync/indexed-db";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import { Alert, Badge, Button, Input, Modal, Skeleton, Switch } from "../design-system";

const PROVIDERS = [
  { id: "vnpay", label: "VNPay QR / Ngân hàng" },
  { id: "momo", label: "Ví MoMo" },
  { id: "stripe", label: "Thẻ Visa / Mastercard (Stripe)" },
];

/**
 * Milestone 2.12: Intelligent Monetization, Pricing Psychology, Checkout & Subscription Management Hub
 * Unifies: Value Comparison, 4 Plans (Monthly/Quarterly/Yearly/Lifetime), Free Trial, Coupon Engine,
 * Checkout Adapter, 2-Click Transparent Cancel, Marketing Opt-out & Protected VIP Report Export.
 */
export default function MonetizationHub({
  userId = null,
  authToken = null,
  isLight = false,
  onEntitlementSync,
  onRequireLogin,
}) {
  const T = getThemeTokens(isLight);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [provider, setProvider] = useState("vnpay");
  const [couponInput, setCouponInput] = useState("");
  const [couponPreview, setCouponPreview] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("COMPLETED_GOAL");
  const [statusNotice, setStatusNotice] = useState(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const url = userId ? `/api/monetization/overview?user_id=${encodeURIComponent(userId)}` : "/api/monetization/overview";
      const res = await fetch(url, { headers });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
        if (onEntitlementSync && json.entitlement) {
          onEntitlementSync(json.entitlement);
        }
      }
    } catch (err) {
      console.warn("Monetization overview warning:", err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, authToken, onEntitlementSync]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (userId) {
      fetch("/api/monetization/overview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ action: "track_event", user_id: userId, event_name: "PRICING_VIEWED" }),
      }).catch(() => {});
    }
  }, [userId, authToken]);

  const handleValidateCoupon = async () => {
    if (!selectedPlan || !couponInput.trim()) return;
    setCouponError("");
    setCouponPreview(null);
    try {
      const res = await fetch("/api/monetization/overview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          action: "validate_coupon",
          user_id: userId,
          plan_code: selectedPlan.code,
          coupon_code: couponInput.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setCouponError(json.error || "Mã không hợp lệ.");
      } else {
        setCouponPreview(json.pricing);
      }
    } catch (err) {
      setCouponError(err.message);
    }
  };

  const handleCheckoutAction = async (actionType, planObj = selectedPlan) => {
    if (!userId) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    setCheckoutBusy(true);
    setStatusNotice(null);
    try {
      const res = await fetch("/api/monetization/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          action: actionType,
          user_id: userId,
          plan_code: planObj?.code || "VIP_YEARLY",
          provider,
          coupon_code: couponPreview ? couponInput.trim() : null,
          idempotency_key: StorageAdapter.generateUUIDv4(),
          cancellation_reason: cancelReason,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusNotice({ tone: "danger", text: json.error || "Giao dịch chưa hoàn thành." });
        return;
      }
      setSelectedPlan(null);
      setCancelConfirmOpen(false);
      setCouponPreview(null);
      setCouponInput("");
      setStatusNotice({
        tone: "success",
        text:
          json.disclosure ||
          json.message ||
          "🎉 Thanh toán xác thực thành công! Toàn bộ đặc quyền VIP đã được kích hoạt.",
      });
      if (onEntitlementSync && json.entitlement) {
        onEntitlementSync(json.entitlement);
      }
      await loadOverview();
    } catch (err) {
      setStatusNotice({ tone: "danger", text: err.message });
    } finally {
      setCheckoutBusy(false);
    }
  };

  const handleDownloadVipReport = async () => {
    if (!userId) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    const res = await fetch(`/api/monetization/export-report?user_id=${encodeURIComponent(userId)}`, { headers });
    if (res.status === 403) {
      const errJson = await res.json();
      setStatusNotice({ tone: "warning", text: errJson.error || "Tính năng xuất báo cáo yêu cầu gói VIP." });
      return;
    }
    const blobText = await res.text();
    const blob = new Blob([blobText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grammar_mastery_report_${userId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleMarketingOptOut = async (nextVal) => {
    if (!userId) return;
    await fetch("/api/monetization/overview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ action: "toggle_marketing_opt_out", user_id: userId, opt_out: nextVal }),
    });
    await loadOverview();
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Skeleton height="120px" width="100%" />
        <Skeleton height="280px" width="100%" />
      </div>
    );
  }

  if (!data) return null;

  const {
    guestMode,
    entitlement = {},
    plans = [],
    features = [],
    campaigns = [],
    psychology = {},
    segment = {},
    transactions = [],
    marketingOptOut = false,
  } = data;

  const hasVip = Boolean(entitlement.hasVipAccess);
  const sub = entitlement.subscription;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {statusNotice && (
        <Alert tone={statusNotice.tone} isLight={isLight}>
          {statusNotice.text}
        </Alert>
      )}

      {/* Behavioral Psychology Value Banner */}
      <div
        style={{
          backgroundColor: T.card,
          border: `1px solid ${hasVip ? T.successBorder : T.accentBorder}`,
          borderRadius: "14px",
          padding: "1.35rem",
          boxShadow: T.shadowSm,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ flex: "1 1 520px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.45rem" }}>
              <Badge tone={hasVip ? "success" : "accent"} isLight={isLight}>
                {hasVip ? `⭐ ${entitlement.effectiveRole} ACTIVE` : "👤 GÓI FREE • NÂNG CẤP HỆ THỐNG HỌC TẬP VIP"}
              </Badge>
              {!guestMode && segment?.segment && (
                <Badge tone="neutral" isLight={isLight}>
                  Phân khúc: {segment.segment}
                </Badge>
              )}
            </div>
            <h1 style={{ margin: "0 0 0.4rem", fontSize: "1.22rem", fontWeight: 800, color: T.textHeading }}>
              {hasVip
                ? "Bạn đang sở hữu Toàn quyền Hệ thống Ngữ pháp Cá nhân hóa VIP"
                : "Đầu tư Hệ thống Cải thiện Ngữ pháp Cá nhân hóa Chuẩn Mai Lan Hương"}
            </h1>
            <p style={{ margin: 0, fontSize: "0.86rem", color: T.textSecondary, lineHeight: 1.55 }}>
              <strong>{psychology.progressHighlight}</strong> {psychology.personalizedHook}
            </p>
            <div style={{ fontSize: "0.78rem", color: T.textMuted, marginTop: "0.4rem" }}>
              {psychology.goalGradientHint} • {psychology.selfDeterminationNote}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
            <Button variant={hasVip ? "success" : "secondary"} size="sm" isLight={isLight} onClick={handleDownloadVipReport}>
              📄 Xuất Báo cáo Năng lực (VIP API)
            </Button>
            {hasVip && sub && (
              <Button variant="ghost" size="sm" isLight={isLight} onClick={() => setCancelConfirmOpen(true)}>
                Quản lý / Hủy gói VIP
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Ethical Verified Campaigns Strip */}
      {campaigns.length > 0 && !hasVip && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
          {campaigns.map((camp) => (
            <Alert key={camp.id} tone="info" title={camp.title_vi} isLight={isLight}>
              <div>{camp.description_vi}</div>
              {camp.ends_at && (
                <div style={{ fontSize: "0.72rem", color: T.textMuted, marginTop: "0.25rem" }}>
                  Hiệu lực chiến dịch thực tế đến: {new Date(camp.ends_at).toLocaleDateString("vi-VN")}
                </div>
              )}
            </Alert>
          ))}
        </div>
      )}

      {/* 4 Subscription Pricing Cards (Price Anchoring & Annual Savings) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(225px, 1fr))", gap: "1rem" }}>
        {plans.map((p) => {
          const perMonth =
            p.billing_cycle === "yearly"
              ? Math.round(p.price_vnd / 12)
              : p.billing_cycle === "quarterly"
              ? Math.round(p.price_vnd / 3)
              : p.price_vnd;
          const savings = p.compare_at_vnd > p.price_vnd ? p.compare_at_vnd - p.price_vnd : 0;

          return (
            <div
              key={p.id}
              style={{
                backgroundColor: T.card,
                border: `2px solid ${p.is_recommended ? T.accent : T.cardBorder}`,
                borderRadius: "14px",
                padding: "1.2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "0.85rem",
                boxShadow: p.is_recommended ? T.shadowMd : T.shadowSm,
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.35rem", marginBottom: "0.5rem" }}>
                  <Badge tone={p.is_recommended ? "accent" : "neutral"} isLight={isLight}>
                    {p.badge_text || p.billing_cycle}
                  </Badge>
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: T.textHeading }}>{p.name_vi}</div>
                <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                  <span style={{ fontSize: "1.45rem", fontWeight: 900, color: p.is_recommended ? T.accent : T.textHeading }}>
                    {Number(p.price_vnd).toLocaleString()}đ
                  </span>
                  {p.compare_at_vnd > p.price_vnd && (
                    <span style={{ fontSize: "0.8rem", color: T.textMuted, textDecoration: "line-through" }}>
                      {Number(p.compare_at_vnd).toLocaleString()}đ
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.75rem", color: T.textMuted, marginTop: "0.2rem" }}>
                  {p.billing_cycle === "lifetime"
                    ? "Thanh toán 1 lần duy nhất • Sở hữu trọn đời"
                    : `Tương đương ~${Number(perMonth).toLocaleString()}đ/tháng`}
                </div>
                {savings > 0 && (
                  <div style={{ fontSize: "0.73rem", color: T.success, fontWeight: 700, marginTop: "0.2rem" }}>
                    Tiết kiệm thực tế: {Number(savings).toLocaleString()}đ
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                <Button
                  variant={p.is_recommended ? "primary" : "secondary"}
                  isLight={isLight}
                  disabled={checkoutBusy}
                  onClick={() => {
                    if (!userId) {
                      if (onRequireLogin) onRequireLogin();
                      return;
                    }
                    setSelectedPlan(p);
                    setCouponPreview(null);
                    setCouponError("");
                    fetch("/api/monetization/overview", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                      },
                      body: JSON.stringify({ action: "track_event", user_id: userId, event_name: "CHECKOUT_STARTED", metadata: { planCode: p.code } }),
                    }).catch(() => {});
                  }}
                >
                  {hasVip ? "Chuyển sang gói này" : "Chọn gói VIP"}
                </Button>

                {!hasVip && !sub && Number(p.trial_days || 0) > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    isLight={isLight}
                    disabled={checkoutBusy}
                    onClick={() => handleCheckoutAction("start_trial", p)}
                    style={{ fontSize: "0.74rem" }}
                  >
                    🎁 Dùng thử {p.trial_days} ngày miễn phí
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FREE vs VIP Feature Matrix */}
      <div
        style={{
          backgroundColor: T.card,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: "14px",
          padding: "1.25rem",
          boxShadow: T.shadowSm,
        }}
      >
        <h2 style={{ margin: "0 0 0.85rem", fontSize: "1.02rem", fontWeight: 800, color: T.textHeading }}>
          📊 So sánh Quyền lợi Hệ thống FREE vs VIP
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {features.map((f) => (
            <div
              key={f.feature_key}
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 0.7fr 0.8fr",
                gap: "0.5rem",
                alignItems: "center",
                padding: "0.65rem 0.75rem",
                borderRadius: "8px",
                backgroundColor: T.bgElevated,
                border: `1px solid ${T.borderSubtle}`,
                fontSize: "0.82rem",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: T.textHeading }}>{f.title_vi}</div>
                <div style={{ fontSize: "0.73rem", color: T.textMuted }}>{f.description_vi}</div>
              </div>
              <div style={{ textAlign: "center", color: T.textSecondary, fontWeight: 600 }}>
                {f.free_quota > 0 ? `Free: Giới hạn (${f.free_quota})` : "🔒 Khóa"}
              </div>
              <div style={{ textAlign: "center" }}>
                <Badge tone="success" isLight={isLight}>
                  ✅ VIP: Không giới hạn
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing History & Transparent Unsubscribe / Opt-Out Preferences */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
        <div
          style={{
            backgroundColor: T.card,
            border: `1px solid ${T.cardBorder}`,
            borderRadius: "14px",
            padding: "1.2rem",
            boxShadow: T.shadowSm,
          }}
        >
          <h3 style={{ margin: "0 0 0.65rem", fontSize: "0.95rem", fontWeight: 800, color: T.textHeading }}>
            🧾 Lịch sử Giao dịch Thanh toán (Idempotent)
          </h3>
          {transactions.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: T.textMuted }}>Chưa có giao dịch thanh toán nào.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", maxHeight: "210px", overflowY: "auto" }}>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0.7rem",
                    borderRadius: "8px",
                    backgroundColor: T.bgElevated,
                    border: `1px solid ${T.borderSubtle}`,
                    fontSize: "0.78rem",
                  }}
                >
                  <div>
                    <strong style={{ color: T.textHeading }}>{tx.plan?.name_vi || tx.provider}</strong>
                    <div style={{ fontSize: "0.68rem", color: T.textMuted }}>
                      {tx.provider?.toUpperCase()} • {new Date(tx.created_at).toLocaleString("vi-VN")}
                      {tx.coupon_code ? ` • Mã ${tx.coupon_code}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, color: T.textHeading }}>{Number(tx.final_amount_vnd).toLocaleString()}đ</div>
                    <Badge tone={tx.status === "succeeded" ? "success" : "danger"} isLight={isLight}>
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            backgroundColor: T.card,
            border: `1px solid ${T.cardBorder}`,
            borderRadius: "14px",
            padding: "1.2rem",
            boxShadow: T.shadowSm,
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: T.textHeading }}>
            🔔 Cài đặt Thông báo &amp; Quyền Người tiêu dùng
          </h3>
          <Switch
            label="Tắt thông báo tiếp thị & ưu đãi VIP (1-Click Unsubscribe)"
            isLight={isLight}
            checked={marketingOptOut}
            onChange={handleToggleMarketingOptOut}
          />
          <div style={{ fontSize: "0.76rem", color: T.textMuted, lineHeight: 1.5 }}>
            Mọi giao dịch thanh toán đều sử dụng `idempotency_key` chống trừ tiền kép, chữ ký HMAC Webhook và giữ nguyên 100% lịch sử học tập khi hủy gói.
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={Boolean(selectedPlan)}
        onClose={() => {
          if (selectedPlan && userId) {
            fetch("/api/monetization/overview", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
              body: JSON.stringify({ action: "track_event", user_id: userId, event_name: "CHECKOUT_ABANDONED", metadata: { planCode: selectedPlan.code } }),
            }).catch(() => {});
          }
          setSelectedPlan(null);
        }}
        title={selectedPlan ? `Thanh toán: ${selectedPlan.name_vi}` : "Thanh toán VIP"}
        isLight={isLight}
        maxWidth="520px"
      >
        {selectedPlan && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <div style={{ backgroundColor: T.bgElevated, padding: "0.85rem", borderRadius: "10px", border: `1px solid ${T.borderSubtle}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem" }}>
                <span style={{ color: T.textSecondary }}>Giá gói niêm yết:</span>
                <strong style={{ color: T.textHeading }}>{Number(selectedPlan.price_vnd).toLocaleString()}đ</strong>
              </div>
              {couponPreview && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", color: T.success, marginTop: "0.25rem" }}>
                  <span>Giảm giá ({couponPreview.couponApplied}):</span>
                  <strong>-{Number(couponPreview.discountVnd).toLocaleString()}đ</strong>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: 800, color: T.accent, marginTop: "0.45rem", paddingTop: "0.45rem", borderTop: `1px solid ${T.borderSubtle}` }}>
                <span>Tổng thanh toán:</span>
                <span>{Number(couponPreview ? couponPreview.finalPrice : selectedPlan.price_vnd).toLocaleString()}đ</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: T.textSecondary, marginBottom: "0.35rem" }}>
                Chọn Cổng thanh toán:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {PROVIDERS.map((pv) => (
                  <Button
                    key={pv.id}
                    size="sm"
                    variant={provider === pv.id ? "primary" : "secondary"}
                    isLight={isLight}
                    onClick={() => setProvider(pv.id)}
                  >
                    {pv.label}
                  </Button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Mã ưu đãi (Thử WELCOME15 hoặc STUDENT20):"
                  isLight={isLight}
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  error={couponError}
                  placeholder="Nhập mã giảm giá..."
                />
              </div>
              <Button variant="secondary" isLight={isLight} onClick={handleValidateCoupon}>
                Áp dụng
              </Button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <Button variant="ghost" isLight={isLight} onClick={() => setSelectedPlan(null)}>
                Đóng
              </Button>
              <Button
                variant="primary"
                isLight={isLight}
                disabled={checkoutBusy}
                onClick={() => handleCheckoutAction(hasVip ? "upgrade_switch" : "checkout", selectedPlan)}
              >
                {checkoutBusy ? "Đang xác thực..." : "Xác nhận Thanh toán VIP ➔"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Transparent 2-Click Cancel Flow Modal */}
      <Modal
        isOpen={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        title="Hủy Gia Hạn Gói VIP (Minh bạch 2 Chạm)"
        isLight={isLight}
        maxWidth="480px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <Alert tone="info" isLight={isLight}>
            Toàn bộ lịch sử học tập, Streak, XP, Sổ tay câu sai và Mastery của bạn sẽ được bảo lưu 100% khi quay về gói Free.
          </Alert>
          <Input
            label="Lý do hủy (giúp chúng tôi cải thiện dịch vụ):"
            isLight={isLight}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <Button variant="ghost" isLight={isLight} onClick={() => setCancelConfirmOpen(false)}>
              Giữ lại gói VIP
            </Button>
            <Button variant="danger" isLight={isLight} disabled={checkoutBusy} onClick={() => handleCheckoutAction("cancel")}>
              Xác nhận Hủy VIP ngay
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
