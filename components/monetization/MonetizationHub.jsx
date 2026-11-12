import React, { useState, useEffect, useCallback, useRef } from "react";
import { StorageAdapter } from "../../lib/sync/indexed-db";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import { Alert, Badge, Button, Input, Modal, Skeleton, Switch } from "../design-system";
import { BANNER_PATHS, VIP_SHOWCASE_PATHS } from "../ui-2026/assetMap";

const FEATURE_VISUAL_META = {
  unlimited_exercises: { icon: "📚", freeLabel: "10 câu / bài", pct: 8 },
  unlimited_quizzes: { icon: "🎯", freeLabel: "2 đề / ngày", pct: 12 },
  diagnostic_root_cause: { icon: "🧭", freeLabel: "1 lần xem thử", pct: 15 },
  ai_advisor_full: { icon: "🤖", freeLabel: "3 lượt / phiên", pct: 15 },
  advanced_mastery_radar: { icon: "📈", freeLabel: "1 biểu đồ cơ bản", pct: 12 },
  fsrs_unlimited_sr: { icon: "🧠", freeLabel: "20 thẻ tối đa", pct: 14 },
  pdf_exam_export: { icon: "📥", freeLabel: "Khóa hoàn toàn", pct: 0 },
};

const DEFAULT_PROVIDER = "sepay";

// Client-side SWR cache eliminates 2-3s Skeleton reload & prevents double-fetch loops
const monetizationOverviewCache = new Map();
const monetizationOverviewInflight = new Map();

export function getCachedMonetizationOverview(userId = null) {
  return monetizationOverviewCache.get(userId || "guest") || null;
}

export function invalidateMonetizationClientCache() {
  monetizationOverviewCache.clear();
  monetizationOverviewInflight.clear();
}

export function prefetchMonetizationData({ userId = null, authToken = null } = {}) {
  if (typeof window === "undefined") return Promise.resolve();
  const cacheKey = userId || "guest";
  if (monetizationOverviewCache.has(cacheKey) || monetizationOverviewInflight.has(cacheKey)) {
    return monetizationOverviewInflight.get(cacheKey) || Promise.resolve();
  }
  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  const url = userId ? `/api/monetization/overview?user_id=${encodeURIComponent(userId)}` : "/api/monetization/overview";
  const p = fetch(url, { headers })
    .then((res) => res.json())
    .then((json) => {
      if (json?.success) monetizationOverviewCache.set(cacheKey, json);
    })
    .catch(() => {})
    .finally(() => monetizationOverviewInflight.delete(cacheKey));
  monetizationOverviewInflight.set(cacheKey, p);
  return p;
}

/**
 * Milestone 2.12: Intelligent Monetization, Pricing Psychology, Checkout & Subscription Management Hub
 * Unifies: Value Comparison, 4 Plans (Monthly/Quarterly/Yearly/Lifetime), Coupon Engine,
 * SePay VA Dynamic VietQR Checkout, 2-Click Transparent Cancel, Marketing Opt-out & Protected VIP Report Export.
 */
export default function MonetizationHub({
  userId = null,
  authToken = null,
  isLight = false,
  onEntitlementSync,
  onRequireLogin,
  onRequireRegister,
}) {
  const T = getThemeTokens(isLight);
  const cacheKey = userId || "guest";
  const cachedInitial = monetizationOverviewCache.get(cacheKey) || null;
  const [data, setData] = useState(cachedInitial);
  const [loading, setLoading] = useState(!cachedInitial);
  const [loadError, setLoadError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponPreview, setCouponPreview] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [sepayOrder, setSepayOrder] = useState(null);
  const [checkingSepay, setCheckingSepay] = useState(false);
  const [copiedField, setCopiedField] = useState("");
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("COMPLETED_GOAL");
  const [statusNotice, setStatusNotice] = useState(null);
  const onEntSyncRef = useRef(onEntitlementSync);
  onEntSyncRef.current = onEntitlementSync;

  const copyText = async (label, value) => {
    try {
      await navigator.clipboard.writeText(String(value || ""));
      setCopiedField(label);
      setTimeout(() => setCopiedField(""), 1800);
    } catch {}
  };

  const loadOverview = useCallback(async () => {
    if (!monetizationOverviewCache.has(cacheKey)) setLoading(true);
    setLoadError("");
    try {
      const headers = userId && authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const url = userId ? `/api/monetization/overview?user_id=${encodeURIComponent(userId)}` : "/api/monetization/overview";
      let res = await fetch(url, { headers });
      if (res.status === 401 && headers.Authorization) {
        // Retry as public catalog if Bearer token expired
        res = await fetch("/api/monetization/overview");
      }
      const json = await res.json();
      if (res.ok && json.success) {
        monetizationOverviewCache.set(cacheKey, json);
        setData(json);
        if (onEntSyncRef.current && json.entitlement) {
          onEntSyncRef.current(json.entitlement);
        }
      } else {
        setLoadError(json?.error || "Không thể tải bảng giá VIP lúc này.");
      }
    } catch (err) {
      console.warn("Monetization overview warning:", err.message);
      setLoadError(err?.message || "Lỗi kết nối khi tải thông tin gói VIP.");
    } finally {
      setLoading(false);
    }
  }, [userId, authToken, cacheKey]);

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

  const [checkoutError, setCheckoutError] = useState("");

  const checkSepayOrderStatus = useCallback(
    async (orderCode, silent = false) => {
      if (!orderCode) return;
      if (!silent) setCheckingSepay(true);
      try {
        const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
        const res = await fetch(
          `/api/monetization/sepay-status?order_code=${encodeURIComponent(orderCode)}`,
          { headers }
        );
        const json = await res.json();
        if (res.ok && json.paid) {
          const paidSub = json.entitlement?.subscription;
          const paidPlanName = paidSub?.plan?.name_vi || selectedPlan?.name_vi || "Gói VIP";
          const isLife = paidSub?.plan?.billing_cycle === "lifetime";
          const paidExpiry = isLife
            ? "Trọn đời (Vĩnh viễn)"
            : paidSub?.current_period_end
            ? new Date(paidSub.current_period_end).toLocaleDateString("vi-VN")
            : "đã kích hoạt";
          setSepayOrder(null);
          setSelectedPlan(null);
          setCheckoutError("");
          setCouponPreview(null);
          setCouponInput("");
          invalidateMonetizationClientCache();
          setStatusNotice({
            tone: "success",
            text: `🎉 SePay VA đã xác nhận chuyển khoản! ${paidPlanName} đã được kích hoạt (Hạn sử dụng: ${paidExpiry}).`,
          });
          if (onEntSyncRef.current && json.entitlement) {
            onEntSyncRef.current(json.entitlement);
          }
          await loadOverview();
        } else if (!silent && res.ok) {
          setCheckoutError(
            `Đơn ${orderCode} đang chờ SePay xác nhận tiền vào (nếu bạn vừa chuyển khoản xong, vui lòng đợi 3–5 giây rồi bấm kiểm tra lại).`
          );
        }
      } catch {
        // Silent retry on poll
      } finally {
        if (!silent) setCheckingSepay(false);
      }
    },
    [authToken, loadOverview]
  );

  useEffect(() => {
    if (!selectedPlan || !sepayOrder?.order_code) return undefined;
    const timer = setInterval(() => {
      checkSepayOrderStatus(sepayOrder.order_code, true);
    }, 3000);
    return () => clearInterval(timer);
  }, [selectedPlan, sepayOrder?.order_code, checkSepayOrderStatus]);

  const handleCheckoutAction = async (actionType, planObj = selectedPlan) => {
    if (!userId) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    setCheckoutBusy(true);
    setStatusNotice(null);
    setCheckoutError("");
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
          provider: DEFAULT_PROVIDER,
          coupon_code: couponPreview ? couponInput.trim() : null,
          idempotency_key: StorageAdapter.generateUUIDv4(),
          cancellation_reason: cancelReason,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const errMsg = json.error || "Giao dịch chưa hoàn thành.";
        setCheckoutError(errMsg);
        setStatusNotice({ tone: "danger", text: errMsg });
        return;
      }
      if (json.pendingPayment && json.gateway) {
        setSepayOrder({
          order_code: json.order_code,
          transaction: json.transaction,
          gateway: json.gateway,
        });
        await loadOverview();
        return;
      }
      setSepayOrder(null);
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

  if (!data) {
    return (
      <div
        style={{
          backgroundColor: T.card,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: "14px",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.85rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "1.5rem" }}>💎</div>
        <div style={{ fontSize: "1rem", fontWeight: 800, color: T.textHeading }}>
          {loadError || "Chưa thể tải bảng giá Gói VIP"}
        </div>
        <div style={{ fontSize: "0.82rem", color: T.textMuted, maxWidth: "460px" }}>
          Bạn cần đăng ký hoặc đăng nhập tài khoản để nâng cấp VIP và lưu tiến độ học tập.
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Button variant="secondary" isLight={isLight} onClick={loadOverview}>
            🔄 Thử tải lại
          </Button>
          {(onRequireRegister || onRequireLogin) && (
            <Button variant="primary" isLight={isLight} onClick={() => (onRequireRegister ? onRequireRegister() : onRequireLogin())}>
              📝 Đăng ký / Đăng nhập ngay
            </Button>
          )}
        </div>
      </div>
    );
  }

  const {
    guestMode,
    entitlement = {},
    plans = [],
    sepayGateway = null,
    features = [],
    campaigns = [],
    psychology = {},
    segment = {},
    transactions = [],
    marketingOptOut = false,
  } = data;

  const hasVip = Boolean(entitlement.hasVipAccess);
  const sub = entitlement.subscription;

  const requireGuestAuth = () => {
    if (onRequireRegister) {
      onRequireRegister();
    } else if (onRequireLogin) {
      onRequireLogin();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {statusNotice && (
        <Alert tone={statusNotice.tone} isLight={isLight}>
          {statusNotice.text}
        </Alert>
      )}

      {(guestMode || !userId) && (
        <div
          style={{
            backgroundColor: T.warningBg,
            border: `1px solid ${T.warningBorder}`,
            borderRadius: "12px",
            padding: "1rem 1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.85rem",
          }}
        >
          <div style={{ flex: "1 1 380px" }}>
            <div style={{ fontSize: "0.92rem", fontWeight: 800, color: T.textHeading }}>
              🔒 Bạn chưa đăng nhập — Cần đăng ký tài khoản để nâng cấp VIP
            </div>
            <div style={{ fontSize: "0.8rem", color: T.textSecondary, marginTop: "0.2rem", lineHeight: 1.45 }}>
              Hãy tạo tài khoản miễn phí (chỉ 15 giây) hoặc đăng nhập trước khi thanh toán để hệ thống kích hoạt đặc quyền VIP và đồng bộ toàn bộ tiến độ cho bạn.
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {onRequireLogin && (
              <Button size="sm" variant="secondary" isLight={isLight} onClick={onRequireLogin}>
                🔑 Đăng nhập
              </Button>
            )}
            <Button size="sm" variant="primary" isLight={isLight} onClick={requireGuestAuth}>
              📝 Đăng ký tài khoản ngay
            </Button>
          </div>
        </div>
      )}

      {/* Behavioral Psychology Value Banner + 2026 AI Coach VIP Artwork */}
      <div
        className="ge-hero-banner-card"
        style={{
          border: `1px solid ${hasVip ? T.successBorder : T.accentBorder}`,
          padding: "1.35rem",
        }}
      >
        <img
          src={BANNER_PATHS.vip}
          alt="Học viên luyện phát âm IPA & AI Study Coach VIP"
          className="ge-hero-banner-bg"
        />
        <div className="ge-hero-banner-scrim" />
        <div
          className="ge-hero-banner-content"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}
        >
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
                : "Đầu tư Hệ thống Cải thiện Ngữ pháp Cá nhân hóa Toàn Diện"}
            </h1>
            <p style={{ margin: 0, fontSize: "0.86rem", color: T.textSecondary, lineHeight: 1.55 }}>
              <strong>{psychology.progressHighlight}</strong> {psychology.personalizedHook}
            </p>
            <div style={{ fontSize: "0.78rem", color: T.textMuted, marginTop: "0.4rem" }}>
              {psychology.goalGradientHint} • {psychology.selfDeterminationNote}
            </div>

            {hasVip && sub && (
              <div
                style={{
                  marginTop: "0.75rem",
                  backgroundColor: T.card,
                  border: `1px solid ${T.successBorder}`,
                  borderRadius: "10px",
                  padding: "0.65rem 0.85rem",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.9rem",
                  fontSize: "0.78rem",
                }}
              >
                <div>
                  <span style={{ color: T.textMuted }}>Gói đang dùng: </span>
                  <strong style={{ color: T.textHeading }}>{sub.plan?.name_vi || "Gói VIP"}</strong>
                </div>
                <div>
                  <span style={{ color: T.textMuted }}>Ngày kích hoạt: </span>
                  <strong style={{ color: T.textSecondary }}>
                    {sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString("vi-VN") : "—"}
                  </strong>
                </div>
                <div>
                  <span style={{ color: T.textMuted }}>Ngày hết hạn: </span>
                  <strong style={{ color: T.success }}>
                    {sub.plan?.billing_cycle === "lifetime"
                      ? "Trọn đời (Vĩnh viễn)"
                      : (sub.status === "trialing" && sub.trial_ends_at ? sub.trial_ends_at : sub.current_period_end)
                      ? `${new Date(
                          sub.status === "trialing" && sub.trial_ends_at ? sub.trial_ends_at : sub.current_period_end
                        ).toLocaleDateString("vi-VN")} (Còn ${Math.max(
                          0,
                          Math.ceil(
                            (new Date(
                              sub.status === "trialing" && sub.trial_ends_at ? sub.trial_ends_at : sub.current_period_end
                            ).getTime() -
                              Date.now()) /
                              86400000
                          )
                        )} ngày)`
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span style={{ color: T.textMuted }}>Cổng: </span>
                  <strong style={{ color: T.accent }}>
                    {sub.provider === "sepay" ? "SePay VA (VietQR)" : sub.provider === "manual" ? "Kích hoạt Hệ thống" : sub.provider?.toUpperCase()}
                  </strong>
                </div>
              </div>
            )}
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
                      requireGuestAuth();
                      return;
                    }
                    setSelectedPlan(p);
                    setSepayOrder(null);
                    setCheckoutError("");
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
                  {!userId ? "📝 Đăng ký để nâng cấp VIP" : hasVip ? "Chuyển sang gói này" : "Chọn gói VIP"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Side-by-Side Tier Duel + Detailed FREE vs VIP Matrix */}
      <div
        style={{
          backgroundColor: T.card,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: "16px",
          padding: "1.35rem",
          boxShadow: T.shadowSm,
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.08rem", fontWeight: 800, color: T.textHeading }}>
              ⚖️ Khác biệt Trực quan: Gói FREE vs Thành viên VIP
            </h2>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: T.textMuted }}>
              So sánh trực tiếp giới hạn học thử so với đặc quyền bứt phá không giới hạn của tài khoản VIP.
            </p>
          </div>
          {!hasVip && plans.length > 0 && (
            <Button
              size="sm"
              variant="primary"
              isLight={isLight}
              onClick={() => {
                const rec = plans.find((p) => p.is_recommended) || plans[0];
                if (!userId) {
                  requireGuestAuth();
                  return;
                }
                setSelectedPlan(rec);
                setSepayOrder(null);
                setCheckoutError("");
              }}
            >
              {!userId ? "📝 Đăng ký để mở khóa VIP ➔" : "⚡ Mở khóa VIP ngay ➔"}
            </Button>
          )}
        </div>

        {/* Side-by-Side Illustrated Comparison Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {/* FREE Card */}
          <div
            style={{
              backgroundColor: T.bgElevated,
              border: `1px solid ${T.border}`,
              borderRadius: "14px",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: T.textSecondary }}>
                👤 Gói FREE (Cơ bản)
              </div>
              <Badge tone="neutral" isLight={isLight}>
                Giới hạn lượt
              </Badge>
            </div>

            <div
              style={{
                borderRadius: "10px",
                overflow: "hidden",
                border: `1px solid ${T.borderSubtle}`,
                backgroundColor: T.card,
              }}
            >
              <img
                src={VIP_SHOWCASE_PATHS.free}
                alt="Minh họa Gói FREE có giới hạn lượt học"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.78rem", color: T.textSecondary }}>
              <div>⏱️ Chỉ mở <strong>10 câu / bài tập</strong> và <strong>2 lượt Quiz / ngày</strong></div>
              <div>🤖 AI Grammar Coach giới hạn <strong>3 câu hỏi / phiên</strong></div>
              <div>🧠 Ôn tập Spaced Repetition tối đa <strong>20 thẻ</strong></div>
              <div style={{ color: T.textMuted }}>🔒 Khóa Radar 12 Chuyên đề chuyên sâu &amp; Xuất báo cáo</div>
            </div>
          </div>

          {/* VIP Card */}
          <div
            className="ge-lb-row-top1"
            style={{
              position: "relative",
              overflow: "hidden",
              backgroundColor: T.accentBg,
              border: `2px solid ${T.accentBorder}`,
              borderRadius: "14px",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              boxShadow: T.shadowSm,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: T.textHeading }}>
                👑 Thành viên VIP Toàn diện
              </div>
              <Badge tone="success" isLight={isLight}>
                ∞ Không giới hạn
              </Badge>
            </div>

            <div
              style={{
                borderRadius: "10px",
                overflow: "hidden",
                border: `1px solid ${T.accentBorder}`,
                backgroundColor: T.card,
              }}
            >
              <img
                src={VIP_SHOWCASE_PATHS.vip}
                alt="Minh họa Thành viên VIP mở khóa 100% tính năng"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.78rem", color: T.textHeading, fontWeight: 600 }}>
              <div>✅ Mở khóa trọn bộ <strong>2,939 câu hỏi</strong> &amp; Quiz 50/30/20 không giới hạn</div>
              <div>✅ <strong>AI Grammar Coach ∞</strong> giải thích cặn kẽ mọi bẫy thi cử</div>
              <div>✅ <strong>Radar 12 Chuyên đề</strong> + Spaced Repetition FSRS mọi câu sai</div>
              <div>✅ <strong>Xuất Báo cáo Năng lực</strong> &amp; Bộ đề cá nhân hóa mọi lúc</div>
            </div>
          </div>
        </div>

        {/* Detailed Visual Quota Comparison Table */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div
            className="ge-vip-matrix-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 0.85fr 0.85fr",
              gap: "0.65rem",
              padding: "0.55rem 0.85rem",
              borderRadius: "8px",
              backgroundColor: T.bgSub,
              border: `1px solid ${T.borderSubtle}`,
              fontSize: "0.72rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: T.textMuted,
            }}
          >
            <div>Tính năng &amp; Công cụ Học thuật</div>
            <div style={{ textAlign: "center" }}>👤 Gói FREE</div>
            <div style={{ textAlign: "center", color: T.success }}>👑 Thành viên VIP</div>
          </div>

          {features.map((f) => {
            const meta = FEATURE_VISUAL_META[f.feature_key] || {
              icon: "✨",
              freeLabel: f.free_quota > 0 ? `Giới hạn (${f.free_quota})` : "Khóa",
              pct: f.free_quota > 0 ? 15 : 0,
            };
            const isLockedFree = Number(f.free_quota || 0) <= 0;
            return (
              <div
                key={f.feature_key}
                className="ge-vip-matrix-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 0.85fr 0.85fr",
                  gap: "0.65rem",
                  alignItems: "center",
                  padding: "0.7rem 0.85rem",
                  borderRadius: "10px",
                  backgroundColor: T.bgElevated,
                  border: `1px solid ${T.borderSubtle}`,
                  fontSize: "0.82rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "9px",
                      backgroundColor: T.card,
                      border: `1px solid ${T.borderSubtle}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.1rem",
                      flexShrink: 0,
                    }}
                  >
                    {meta.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: T.textHeading }}>{f.title_vi}</div>
                    <div style={{ fontSize: "0.73rem", color: T.textMuted, marginTop: "0.1rem" }}>{f.description_vi}</div>
                  </div>
                </div>

                {/* FREE Quota Visual Meter */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                  {isLockedFree ? (
                    <Badge tone="danger" isLight={isLight}>
                      🔒 Chưa mở
                    </Badge>
                  ) : (
                    <>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: T.textSecondary }}>
                        {meta.freeLabel}
                      </span>
                      <div
                        style={{
                          width: "92px",
                          height: "6px",
                          borderRadius: "999px",
                          backgroundColor: T.borderSubtle,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${meta.pct}%`,
                            height: "100%",
                            backgroundColor: T.textMuted,
                            borderRadius: "999px",
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* VIP Unlimited Highlight */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.28rem" }}>
                  <Badge tone="success" isLight={isLight}>
                    {isLockedFree ? "✓ Mở khóa 100%" : "∞ Không giới hạn"}
                  </Badge>
                  <div
                    className="ge-energy-bar-track"
                    style={{
                      width: "92px",
                      height: "6px",
                      backgroundColor: T.successBg,
                    }}
                  >
                    <div
                      className="ge-energy-bar-fill"
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: T.success,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
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
                    <strong style={{ color: T.textHeading }}>{tx.plan?.name_vi || (tx.provider === "sepay" ? "SePay VA VietQR" : tx.provider)}</strong>
                    <div style={{ fontSize: "0.68rem", color: T.textMuted }}>
                      {tx.provider === "sepay" ? "SEPAY VA" : tx.provider?.toUpperCase()}
                      {tx.provider_tx_id ? ` • ${tx.provider_tx_id}` : ""} • {new Date(tx.created_at).toLocaleString("vi-VN")}
                      {tx.coupon_code ? ` • Mã ${tx.coupon_code}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, color: T.textHeading }}>{Number(tx.final_amount_vnd).toLocaleString()}đ</div>
                    <Badge
                      tone={tx.status === "succeeded" ? "success" : tx.status === "pending" ? "warning" : "danger"}
                      isLight={isLight}
                    >
                      {tx.status === "succeeded" ? "Thành công" : tx.status === "pending" ? "Chờ CK" : tx.status}
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
            Mọi giao dịch thanh toán VietQR qua SePay VA đều sử dụng `idempotency_key` chống trùng lặp, đối soát Webhook tự động bảo mật API Key và giữ nguyên 100% lịch sử học tập khi hủy gói.
          </div>
        </div>
      </div>

      {/* Checkout Modal (SePay VA & Dynamic VietQR) */}
      <Modal
        isOpen={Boolean(selectedPlan)}
        onClose={() => {
          if (selectedPlan && !sepayOrder && userId) {
            fetch("/api/monetization/overview", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
              body: JSON.stringify({ action: "track_event", user_id: userId, event_name: "CHECKOUT_ABANDONED", metadata: { planCode: selectedPlan.code } }),
            }).catch(() => {});
          }
          setSepayOrder(null);
          setCheckoutError("");
          setSelectedPlan(null);
        }}
        title={
          selectedPlan
            ? sepayOrder
              ? `Quét VietQR (SePay VA): ${selectedPlan.name_vi}`
              : `Thanh toán: ${selectedPlan.name_vi}`
            : "Thanh toán VIP"
        }
        isLight={isLight}
        maxWidth="540px"
      >
        {selectedPlan && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {checkoutError && (
              <Alert tone="danger" isLight={isLight}>
                {checkoutError}
              </Alert>
            )}

            {!sepayOrder ? (
              <>
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

                <div
                  style={{
                    backgroundColor: T.accentBg,
                    border: `1px solid ${T.accentBorder}`,
                    borderRadius: "10px",
                    padding: "0.75rem 0.85rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.84rem", fontWeight: 800, color: T.textHeading }}>
                      🏦 Chuyển khoản VietQR Tự Động (SePay VA)
                    </span>
                    <Badge tone={sepayGateway?.account_number ? "success" : "warning"} isLight={isLight}>
                      {sepayGateway?.account_number ? `${sepayGateway.bank_code} • Sẵn sàng` : "Chờ cấu hình VA"}
                    </Badge>
                  </div>
                  <div style={{ fontSize: "0.76rem", color: T.textSecondary, lineHeight: 1.45 }}>
                    Quét mã VietQR bằng mọi app Ngân hàng Việt Nam. Hệ thống đối soát qua Tài khoản ảo (VA) SePay và tự động kích hoạt VIP sau 1–5 giây.
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
                    onClick={() => handleCheckoutAction("create_sepay_order", selectedPlan)}
                  >
                    {checkoutBusy ? "Đang tạo mã VietQR..." : "Tạo mã VietQR thanh toán ➔"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: "0.9rem",
                    alignItems: "center",
                    backgroundColor: T.bgElevated,
                    border: `1px solid ${T.borderSubtle}`,
                    borderRadius: "12px",
                    padding: "0.9rem",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        padding: "0.65rem",
                        borderRadius: "10px",
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      <img
                        src={sepayOrder.gateway.qr_url}
                        alt={`VietQR SePay ${sepayOrder.order_code}`}
                        style={{ width: "200px", height: "200px", objectFit: "contain", display: "block" }}
                      />
                    </div>
                    <span style={{ fontSize: "0.7rem", color: T.textMuted }}>
                      Quét bằng App Ngân hàng (VietQR / NAPAS 247)
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8rem" }}>
                    <div>
                      <div style={{ fontSize: "0.7rem", color: T.textMuted }}>Ngân hàng thụ hưởng:</div>
                      <strong style={{ color: T.textHeading }}>{sepayOrder.gateway.bank_code}</strong>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.7rem", color: T.textMuted }}>Số tài khoản / VA SePay:</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                        <strong style={{ color: T.textHeading, fontSize: "0.9rem" }}>{sepayOrder.gateway.account_number}</strong>
                        <Button
                          size="sm"
                          variant="secondary"
                          isLight={isLight}
                          onClick={() => copyText("acc", sepayOrder.gateway.account_number)}
                          style={{ fontSize: "0.68rem", minHeight: "24px", padding: "0 0.45rem" }}
                        >
                          {copiedField === "acc" ? "✓ Đã copy" : "Copy"}
                        </Button>
                      </div>
                    </div>

                    {sepayOrder.gateway.account_name && (
                      <div>
                        <div style={{ fontSize: "0.7rem", color: T.textMuted }}>Chủ tài khoản:</div>
                        <strong style={{ color: T.textHeading }}>{sepayOrder.gateway.account_name}</strong>
                      </div>
                    )}

                    <div>
                      <div style={{ fontSize: "0.7rem", color: T.textMuted }}>Số tiền chính xác:</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                        <strong style={{ color: T.success, fontSize: "0.95rem" }}>
                          {Number(sepayOrder.transaction?.final_amount_vnd || 0).toLocaleString()}đ
                        </strong>
                        <Button
                          size="sm"
                          variant="secondary"
                          isLight={isLight}
                          onClick={() => copyText("amount", sepayOrder.transaction?.final_amount_vnd || 0)}
                          style={{ fontSize: "0.68rem", minHeight: "24px", padding: "0 0.45rem" }}
                        >
                          {copiedField === "amount" ? "✓ Đã copy" : "Copy"}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.7rem", color: T.textMuted }}>Nội dung chuyển khoản (Bắt buộc):</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                        <code
                          style={{
                            fontSize: "0.86rem",
                            fontWeight: 800,
                            color: T.accent,
                            backgroundColor: T.accentBg,
                            border: `1px solid ${T.accentBorder}`,
                            padding: "0.18rem 0.45rem",
                            borderRadius: "6px",
                          }}
                        >
                          {sepayOrder.order_code}
                        </code>
                        <Button
                          size="sm"
                          variant="secondary"
                          isLight={isLight}
                          onClick={() => copyText("code", sepayOrder.order_code)}
                          style={{ fontSize: "0.68rem", minHeight: "24px", padding: "0 0.45rem" }}
                        >
                          {copiedField === "code" ? "✓ Đã copy" : "Copy"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert tone="info" isLight={isLight}>
                  ⏳ Hệ thống tự động kiểm tra giao dịch mỗi 3 giây. Giữ nguyên nội dung <strong>{sepayOrder.order_code}</strong> và số tiền để SePay mở khóa VIP tức thì ngay khi tiền vào!
                </Alert>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Button
                    variant="ghost"
                    isLight={isLight}
                    onClick={() => {
                      setSepayOrder(null);
                      setCheckoutError("");
                    }}
                  >
                    ← Đổi mã giảm giá
                  </Button>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Button
                      variant="secondary"
                      isLight={isLight}
                      onClick={() => {
                        setSepayOrder(null);
                        setCheckoutError("");
                        setSelectedPlan(null);
                      }}
                    >
                      Đóng
                    </Button>
                    <Button
                      variant="primary"
                      isLight={isLight}
                      disabled={checkingSepay}
                      onClick={() => checkSepayOrderStatus(sepayOrder.order_code, false)}
                    >
                      {checkingSepay ? "Đang kiểm tra..." : "🔄 Kiểm tra đã chuyển khoản"}
                    </Button>
                  </div>
                </div>
              </>
            )}
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
