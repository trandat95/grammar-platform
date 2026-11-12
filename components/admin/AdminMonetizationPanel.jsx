import React, { useState, useEffect, useCallback } from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import { Alert, Badge, Button, Progress, Skeleton } from "../design-system";
import { invalidateMonetizationClientCache } from "../monetization/MonetizationHub";

/**
 * Milestone 2.12.14: Admin Monetization Revenue (MRR/ARR/LTV), 14-Stage Funnel & Dynamic Plan Pricing Editor
 */
export default function AdminMonetizationPanel({ authToken = null, isLight = false }) {
  const T = getThemeTokens(isLight);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState("success");
  const [planDrafts, setPlanDrafts] = useState({});
  const [savingPlanCode, setSavingPlanCode] = useState(null);
  const [couponDraft, setCouponDraft] = useState({
    code: "",
    discount_type: "percent",
    discount_value: "15",
    min_amount_vnd: "0",
    max_uses: "500",
    expires_in_days: "30",
  });
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [busyCouponCode, setBusyCouponCode] = useState(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch("/api/admin/monetization", { headers });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
        const drafts = {};
        for (const p of json.plans || []) {
          drafts[p.code] = {
            price_vnd: String(p.price_vnd ?? 0),
            compare_at_vnd: String(p.compare_at_vnd ?? p.price_vnd ?? 0),
            trial_days: String(p.trial_days ?? 0),
            is_active: p.is_active !== false,
          };
        }
        setPlanDrafts(drafts);
      }
    } catch (err) {
      console.warn("Admin monetization fetch warning:", err.message);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleTogglePaywall = async (triggerKey, nextActive) => {
    setNotice("");
    const res = await fetch("/api/admin/monetization", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ action: "toggle_paywall", trigger_key: triggerKey, is_active: nextActive }),
    });
    if (res.ok) {
      setNoticeTone("success");
      setNotice(`Đã cập nhật trạng thái Paywall '${triggerKey}'.`);
      await loadMetrics();
    }
  };

  const handleSavePlanPrice = async (planCode, overrideActive = null) => {
    const draft = planDrafts[planCode];
    if (!draft) return;
    setSavingPlanCode(planCode);
    setNotice("");
    try {
      const res = await fetch("/api/admin/monetization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          action: "update_plan_price",
          plan_code: planCode,
          price_vnd: Math.max(0, Math.round(Number(draft.price_vnd || 0))),
          compare_at_vnd: Math.max(0, Math.round(Number(draft.compare_at_vnd || 0))),
          trial_days: Math.max(0, Math.round(Number(draft.trial_days || 0))),
          is_active: typeof overrideActive === "boolean" ? overrideActive : Boolean(draft.is_active),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        invalidateMonetizationClientCache();
        setNoticeTone("success");
        setNotice(`✅ Đã cập nhật giá gói ${planCode} (${Number(json.plan?.price_vnd || draft.price_vnd).toLocaleString()}đ) trực tiếp trên Database & áp dụng ngay!`);
        await loadMetrics();
      } else {
        setNoticeTone("danger");
        setNotice(`⚠️ Lỗi cập nhật gói ${planCode}: ${json.error || "Không rõ"}`);
      }
    } catch (err) {
      setNoticeTone("danger");
      setNotice(`⚠️ Lỗi kết nối: ${err.message}`);
    } finally {
      setSavingPlanCode(null);
    }
  };

  const generateRandomCouponCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let suffix = "";
    for (let i = 0; i < 6; i += 1) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    setCouponDraft((prev) => ({ ...prev, code: `VIP_${suffix}` }));
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    const trimmedCode = String(couponDraft.code || "").trim().toUpperCase();
    if (!trimmedCode) {
      setNoticeTone("danger");
      setNotice("⚠️ Vui lòng nhập mã giảm giá (hoặc bấm Ngẫu nhiên).");
      return;
    }
    setSavingCoupon(true);
    setNotice("");
    try {
      const res = await fetch("/api/admin/monetization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          action: "create_coupon",
          coupon_code: trimmedCode,
          discount_type: couponDraft.discount_type,
          discount_value: Number(couponDraft.discount_value || 0),
          min_amount_vnd: Number(couponDraft.min_amount_vnd || 0),
          max_uses: Number(couponDraft.max_uses || 1000),
          expires_in_days: Number(couponDraft.expires_in_days || 0),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNoticeTone("success");
        setNotice(`✅ Đã tạo / cập nhật mã giảm giá ${json.coupon?.code || trimmedCode} thành công!`);
        setCouponDraft((prev) => ({ ...prev, code: "" }));
        await loadMetrics();
      } else {
        setNoticeTone("danger");
        setNotice(`⚠️ Lỗi tạo mã giảm giá: ${json.error || "Không rõ"}`);
      }
    } catch (err) {
      setNoticeTone("danger");
      setNotice(`⚠️ Lỗi kết nối: ${err.message}`);
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (couponCode, nextActive) => {
    setBusyCouponCode(couponCode);
    setNotice("");
    try {
      const res = await fetch("/api/admin/monetization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          action: "toggle_coupon",
          coupon_code: couponCode,
          is_active: nextActive,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNoticeTone("success");
        setNotice(`✅ Đã ${nextActive ? "kích hoạt" : "tạm dừng"} mã giảm giá ${couponCode}.`);
        await loadMetrics();
      } else {
        setNoticeTone("danger");
        setNotice(`⚠️ Lỗi cập nhật mã ${couponCode}: ${json.error || "Không rõ"}`);
      }
    } catch (err) {
      setNoticeTone("danger");
      setNotice(`⚠️ Lỗi kết nối: ${err.message}`);
    } finally {
      setBusyCouponCode(null);
    }
  };

  const handleDeleteCoupon = async (couponCode) => {
    setBusyCouponCode(couponCode);
    setNotice("");
    try {
      const res = await fetch("/api/admin/monetization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          action: "delete_coupon",
          coupon_code: couponCode,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNoticeTone("success");
        setNotice(
          json.softDeactivated
            ? `ℹ️ Mã ${couponCode} đã có lượt sử dụng nên hệ thống chuyển sang Tạm dừng để bảo toàn lịch sử giao dịch.`
            : `✅ Đã xóa vĩnh viễn mã giảm giá ${couponCode}.`
        );
        await loadMetrics();
      } else {
        setNoticeTone("danger");
        setNotice(`⚠️ Lỗi xóa mã ${couponCode}: ${json.error || "Không rõ"}`);
      }
    } catch (err) {
      setNoticeTone("danger");
      setNotice(`⚠️ Lỗi kết nối: ${err.message}`);
    } finally {
      setBusyCouponCode(null);
    }
  };

  const handlePrefillCoupon = (c) => {
    const remainingDays = c.expires_at
      ? Math.max(1, Math.ceil((new Date(c.expires_at).getTime() - Date.now()) / 86400000))
      : 0;
    setCouponDraft({
      code: c.code || "",
      discount_type: c.discount_type === "fixed_vnd" ? "fixed_vnd" : "percent",
      discount_value: String(c.discount_value ?? 15),
      min_amount_vnd: String(c.min_amount_vnd ?? 0),
      max_uses: String(c.max_uses ?? 1000),
      expires_in_days: String(remainingDays),
    });
  };

  if (loading) return <Skeleton height="160px" width="100%" />;
  if (!data) return null;

  const { metrics = {}, funnel = [], abTesting = {}, paywallConfigs = [], plans = [], coupons = [] } = data;
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.users));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
      <div
        style={{
          backgroundColor: T.card,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: "14px",
          padding: "1.25rem",
          boxShadow: T.shadow,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.9rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.02rem", fontWeight: 800, color: T.textHeading }}>
              💎 Monetization Revenue, 14-Stage Funnel &amp; A/B Analytics (M2.12)
            </h3>
            <p style={{ margin: "0.15rem 0 0", fontSize: "0.78rem", color: T.textMuted }}>
              Dữ liệu doanh thu thực, MRR/ARR/LTV, tỷ lệ chuyển đổi và kiểm định A/B theo thời gian thực.
            </p>
          </div>
          <Button size="sm" variant="secondary" isLight={isLight} onClick={loadMetrics}>
            Làm mới số liệu
          </Button>
        </div>

        {notice && <Alert tone={noticeTone} isLight={isLight} style={{ marginBottom: "0.75rem" }}>{notice}</Alert>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.65rem", marginBottom: "1rem" }}>
          {[
            { label: "Total Revenue", val: `${Number(metrics.totalRevenueVnd || 0).toLocaleString()}đ`, tone: T.success },
            { label: "MRR", val: `${Number(metrics.mrrVnd || 0).toLocaleString()}đ`, tone: T.accent },
            { label: "ARR", val: `${Number(metrics.arrVnd || 0).toLocaleString()}đ`, tone: T.textHeading },
            { label: "Active VIP", val: metrics.activeSubscribers ?? 0, tone: T.success },
            { label: "Churn Rate", val: `${metrics.churnRatePercent ?? 0}%`, tone: T.warning },
            { label: "Est. LTV", val: `${Number(metrics.ltvVnd || 0).toLocaleString()}đ`, tone: T.accent },
          ].map((k) => (
            <div
              key={k.label}
              style={{
                backgroundColor: T.bgElevated,
                border: `1px solid ${T.borderSubtle}`,
                borderRadius: "10px",
                padding: "0.7rem 0.85rem",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: 700 }}>{k.label}</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: k.tone, marginTop: "0.15rem" }}>{k.val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "1rem" }}>
          {/* A/B Experiment Card */}
          <div style={{ backgroundColor: T.bgElevated, border: `1px solid ${T.borderSubtle}`, borderRadius: "10px", padding: "0.9rem" }}>
            <div style={{ fontSize: "0.84rem", fontWeight: 800, color: T.textHeading, marginBottom: "0.45rem" }}>
              🧪 A/B Testing: {abTesting.experimentKey}
            </div>
            <div style={{ fontSize: "0.78rem", color: T.textSecondary, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <div>Control ({abTesting.controlCount || 0} users): <strong>{abTesting.rateA ?? 0}% CVR</strong></div>
              <div>Progress-Anchored ({abTesting.treatmentCount || 0} users): <strong>{abTesting.rateB ?? 0}% CVR</strong></div>
              <div>
                Z-Score: <strong>{abTesting.zScore ?? 0}</strong> • Lift: <strong>{abTesting.liftPercent ?? 0}%</strong>{" "}
                <Badge tone={abTesting.pApproxSignificant ? "success" : "neutral"} isLight={isLight}>
                  {abTesting.pApproxSignificant ? "Stat. Significant (p<0.05)" : "Collecting Sample"}
                </Badge>
              </div>
            </div>
          </div>

          {/* 6 Paywall Config Controls */}
          <div style={{ backgroundColor: T.bgElevated, border: `1px solid ${T.borderSubtle}`, borderRadius: "10px", padding: "0.9rem" }}>
            <div style={{ fontSize: "0.84rem", fontWeight: 800, color: T.textHeading, marginBottom: "0.45rem" }}>
              🎛️ Paywall Trigger Controls (Cap &amp; Toggle)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxHeight: "155px", overflowY: "auto" }}>
              {paywallConfigs.map((pw) => (
                <div key={pw.trigger_key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                  <span style={{ color: T.textHeading }}>
                    <strong>{pw.trigger_key}</strong> (Cap: {pw.daily_cap}/d)
                  </span>
                  <Button
                    size="sm"
                    variant={pw.is_active ? "success" : "secondary"}
                    isLight={isLight}
                    onClick={() => handleTogglePaywall(pw.trigger_key, !pw.is_active)}
                    style={{ fontSize: "0.68rem", padding: "0.18rem 0.5rem", minHeight: "24px" }}
                  >
                    {pw.is_active ? "Active" : "Paused"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Funnel Stages */}
        <div style={{ marginTop: "0.9rem", backgroundColor: T.bgElevated, border: `1px solid ${T.borderSubtle}`, borderRadius: "10px", padding: "0.9rem" }}>
          <div style={{ fontSize: "0.84rem", fontWeight: 800, color: T.textHeading, marginBottom: "0.5rem" }}>
            📉 Phễu Chuyển Đổi (14-Stage Funnel)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.5rem" }}>
            {funnel.slice(0, 8).map((f) => (
              <div key={f.stage} style={{ fontSize: "0.73rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: T.textSecondary, marginBottom: "0.2rem" }}>
                  <span>{f.stage}</span>
                  <strong>{f.users}</strong>
                </div>
                <Progress value={f.users} max={maxFunnel} tone="accent" isLight={isLight} height={5} />
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic VIP Plan Pricing Manager (Zero-Code Database Pricing) */}
        <div style={{ marginTop: "0.95rem", backgroundColor: T.bgElevated, border: `1px solid ${T.borderSubtle}`, borderRadius: "10px", padding: "0.95rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.65rem" }}>
            <div>
              <div style={{ fontSize: "0.86rem", fontWeight: 800, color: T.textHeading }}>
                💳 Quản Lý &amp; Điều Chỉnh Giá Gói VIP (Lưu DB — Không Cần Sửa Code)
              </div>
              <div style={{ fontSize: "0.74rem", color: T.textMuted }}>
                Thay đổi giá bán, giá niêm yết hoặc bật/tắt gói trực tiếp trên Supabase PostgreSQL. Trang nâng cấp VIP đồng bộ tức thì.
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "0.7rem" }}>
            {plans.map((p) => {
              const draft = planDrafts[p.code] || {
                price_vnd: String(p.price_vnd ?? 0),
                compare_at_vnd: String(p.compare_at_vnd ?? p.price_vnd ?? 0),
                trial_days: String(p.trial_days ?? 0),
                is_active: p.is_active !== false,
              };
              const isSaving = savingPlanCode === p.code;
              return (
                <div
                  key={p.code}
                  style={{
                    backgroundColor: T.card,
                    border: `1px solid ${draft.is_active ? T.cardBorder : T.dangerBorder}`,
                    borderRadius: "10px",
                    padding: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.4rem" }}>
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 800, color: T.textHeading }}>{p.name_vi || p.code}</div>
                      <div style={{ fontSize: "0.68rem", color: T.textMuted }}>{p.code} • {p.billing_cycle}</div>
                    </div>
                    <Badge tone={draft.is_active ? "success" : "danger"} isLight={isLight}>
                      {draft.is_active ? "Đang bán" : "Tạm ẩn"}
                    </Badge>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.45rem" }}>
                    <label style={{ fontSize: "0.7rem", color: T.textMuted, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <span>Giá bán (VNĐ)</span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={draft.price_vnd}
                        onChange={(e) =>
                          setPlanDrafts((prev) => ({
                            ...prev,
                            [p.code]: { ...draft, price_vnd: e.target.value },
                          }))
                        }
                        className="ds-focusable"
                        style={{
                          width: "100%",
                          padding: "0.35rem 0.5rem",
                          borderRadius: "6px",
                          border: `1px solid ${T.border}`,
                          backgroundColor: T.inputBg,
                          color: T.textHeading,
                          fontSize: "0.8rem",
                          fontWeight: 700,
                        }}
                      />
                    </label>
                    <label style={{ fontSize: "0.7rem", color: T.textMuted, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <span>Giá niêm yết (VNĐ)</span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={draft.compare_at_vnd}
                        onChange={(e) =>
                          setPlanDrafts((prev) => ({
                            ...prev,
                            [p.code]: { ...draft, compare_at_vnd: e.target.value },
                          }))
                        }
                        className="ds-focusable"
                        style={{
                          width: "100%",
                          padding: "0.35rem 0.5rem",
                          borderRadius: "6px",
                          border: `1px solid ${T.border}`,
                          backgroundColor: T.inputBg,
                          color: T.textSecondary,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                        }}
                      />
                    </label>
                  </div>

                  <label style={{ fontSize: "0.7rem", color: T.textMuted, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                    <span>Số ngày dùng thử (Trial days):</span>
                    <input
                      type="number"
                      min={0}
                      max={365}
                      step={1}
                      value={draft.trial_days}
                      onChange={(e) =>
                        setPlanDrafts((prev) => ({
                          ...prev,
                          [p.code]: { ...draft, trial_days: e.target.value },
                        }))
                      }
                      className="ds-focusable"
                      style={{
                        width: "76px",
                        padding: "0.28rem 0.45rem",
                        borderRadius: "6px",
                        border: `1px solid ${T.border}`,
                        backgroundColor: T.inputBg,
                        color: T.textHeading,
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        textAlign: "right",
                      }}
                    />
                  </label>

                  <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.15rem" }}>
                    <Button
                      size="sm"
                      variant="primary"
                      isLight={isLight}
                      disabled={isSaving}
                      onClick={() => handleSavePlanPrice(p.code)}
                      style={{ flex: 1, fontSize: "0.74rem", minHeight: "30px" }}
                    >
                      {isSaving ? "Đang lưu..." : "Lưu giá"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      isLight={isLight}
                      disabled={isSaving}
                      onClick={() => handleSavePlanPrice(p.code, !draft.is_active)}
                      style={{ fontSize: "0.72rem", minHeight: "30px" }}
                    >
                      {draft.is_active ? "Ẩn" : "Mở bán"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Discount Coupons Creator & Manager */}
        <div style={{ marginTop: "0.95rem", backgroundColor: T.bgElevated, border: `1px solid ${T.borderSubtle}`, borderRadius: "10px", padding: "0.95rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <div>
              <div style={{ fontSize: "0.86rem", fontWeight: 800, color: T.textHeading }}>
                🎟️ Quản Lý &amp; Tạo Mã Giảm Giá (Coupons)
              </div>
              <div style={{ fontSize: "0.74rem", color: T.textMuted }}>
                Tạo hoặc cập nhật mã giảm giá (% hoặc VNĐ cố định), giới hạn lượt dùng, đơn tối thiểu và tạm dừng/xóa trực tiếp.
              </div>
            </div>
            <Badge tone="info" isLight={isLight}>
              {coupons.length} mã trong hệ thống
            </Badge>
          </div>

          <form
            onSubmit={handleCreateCoupon}
            style={{
              backgroundColor: T.card,
              border: `1px solid ${T.cardBorder}`,
              borderRadius: "10px",
              padding: "0.8rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.65rem",
              marginBottom: "0.8rem",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.55rem" }}>
              <label style={{ fontSize: "0.71rem", color: T.textMuted, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <span>Mã Coupon (A-Z, 0-9)</span>
                <div style={{ display: "flex", gap: "0.3rem" }}>
                  <input
                    type="text"
                    placeholder="VD: VIP25"
                    value={couponDraft.code}
                    onChange={(e) => setCouponDraft((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="ds-focusable"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "0.35rem 0.5rem",
                      borderRadius: "6px",
                      border: `1px solid ${T.border}`,
                      backgroundColor: T.inputBg,
                      color: T.textHeading,
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    isLight={isLight}
                    onClick={generateRandomCouponCode}
                    style={{ fontSize: "0.68rem", padding: "0 0.5rem", minHeight: "30px", whiteSpace: "nowrap" }}
                  >
                    Ngẫu nhiên
                  </Button>
                </div>
              </label>

              <label style={{ fontSize: "0.71rem", color: T.textMuted, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <span>Loại giảm</span>
                <select
                  value={couponDraft.discount_type}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    setCouponDraft((prev) => ({
                      ...prev,
                      discount_type: nextType,
                      discount_value: nextType === "fixed_vnd" ? "30000" : "15",
                    }));
                  }}
                  className="ds-focusable"
                  style={{
                    width: "100%",
                    padding: "0.35rem 0.5rem",
                    borderRadius: "6px",
                    border: `1px solid ${T.border}`,
                    backgroundColor: T.inputBg,
                    color: T.textHeading,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  <option value="percent">Theo phần trăm (%)</option>
                  <option value="fixed_vnd">Giảm thẳng (VNĐ)</option>
                </select>
              </label>

              <label style={{ fontSize: "0.71rem", color: T.textMuted, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <span>{couponDraft.discount_type === "fixed_vnd" ? "Số tiền giảm (VNĐ)" : "Mức giảm (%) [1–90]"}</span>
                <input
                  type="number"
                  min={couponDraft.discount_type === "fixed_vnd" ? 1000 : 1}
                  max={couponDraft.discount_type === "fixed_vnd" ? 5000000 : 90}
                  step={couponDraft.discount_type === "fixed_vnd" ? 5000 : 1}
                  value={couponDraft.discount_value}
                  onChange={(e) => setCouponDraft((prev) => ({ ...prev, discount_value: e.target.value }))}
                  className="ds-focusable"
                  style={{
                    width: "100%",
                    padding: "0.35rem 0.5rem",
                    borderRadius: "6px",
                    border: `1px solid ${T.border}`,
                    backgroundColor: T.inputBg,
                    color: T.textHeading,
                    fontSize: "0.8rem",
                    fontWeight: 700,
                  }}
                />
              </label>

              <label style={{ fontSize: "0.71rem", color: T.textMuted, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <span>Đơn tối thiểu (VNĐ)</span>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={couponDraft.min_amount_vnd}
                  onChange={(e) => setCouponDraft((prev) => ({ ...prev, min_amount_vnd: e.target.value }))}
                  className="ds-focusable"
                  style={{
                    width: "100%",
                    padding: "0.35rem 0.5rem",
                    borderRadius: "6px",
                    border: `1px solid ${T.border}`,
                    backgroundColor: T.inputBg,
                    color: T.textSecondary,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                />
              </label>

              <label style={{ fontSize: "0.71rem", color: T.textMuted, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <span>Số lượt tối đa</span>
                <input
                  type="number"
                  min={1}
                  max={1000000}
                  step={10}
                  value={couponDraft.max_uses}
                  onChange={(e) => setCouponDraft((prev) => ({ ...prev, max_uses: e.target.value }))}
                  className="ds-focusable"
                  style={{
                    width: "100%",
                    padding: "0.35rem 0.5rem",
                    borderRadius: "6px",
                    border: `1px solid ${T.border}`,
                    backgroundColor: T.inputBg,
                    color: T.textSecondary,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                />
              </label>

              <label style={{ fontSize: "0.71rem", color: T.textMuted, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <span>Hạn dùng (ngày, 0 = vô hạn)</span>
                <input
                  type="number"
                  min={0}
                  max={3650}
                  step={1}
                  value={couponDraft.expires_in_days}
                  onChange={(e) => setCouponDraft((prev) => ({ ...prev, expires_in_days: e.target.value }))}
                  className="ds-focusable"
                  style={{
                    width: "100%",
                    padding: "0.35rem 0.5rem",
                    borderRadius: "6px",
                    border: `1px solid ${T.border}`,
                    backgroundColor: T.inputBg,
                    color: T.textSecondary,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.71rem", color: T.textMuted }}>
                💡 Nhập trùng mã đang có sẽ cập nhật lại thông số của mã đó (upsert).
              </span>
              <Button type="submit" size="sm" variant="primary" isLight={isLight} disabled={savingCoupon}>
                {savingCoupon ? "Đang lưu mã..." : "+ Tạo / Cập nhật Mã Giảm Giá"}
              </Button>
            </div>
          </form>

          {coupons.length === 0 ? (
            <div style={{ fontSize: "0.78rem", color: T.textMuted, padding: "0.5rem 0" }}>
              Chưa có mã giảm giá nào trong hệ thống.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.6rem" }}>
              {coupons.map((c) => {
                const isExpired = c.expires_at ? new Date(c.expires_at).getTime() <= Date.now() : false;
                const isBusy = busyCouponCode === c.code;
                const discountLabel =
                  c.discount_type === "fixed_vnd"
                    ? `-${Number(c.discount_value || 0).toLocaleString()}đ`
                    : `-${c.discount_value || 0}%`;

                return (
                  <div
                    key={c.id || c.code}
                    style={{
                      backgroundColor: T.card,
                      border: `1px solid ${c.is_active && !isExpired ? T.cardBorder : T.dangerBorder}`,
                      borderRadius: "9px",
                      padding: "0.68rem 0.78rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.42rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.4rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                        <code
                          style={{
                            fontSize: "0.84rem",
                            fontWeight: 800,
                            color: T.accent,
                            backgroundColor: T.accentBg,
                            border: `1px solid ${T.accentBorder}`,
                            padding: "0.12rem 0.42rem",
                            borderRadius: "6px",
                          }}
                        >
                          {c.code}
                        </code>
                        <strong style={{ fontSize: "0.82rem", color: T.success }}>{discountLabel}</strong>
                      </div>
                      <Badge
                        tone={!c.is_active ? "danger" : isExpired ? "warning" : "success"}
                        isLight={isLight}
                      >
                        {!c.is_active ? "Tạm dừng" : isExpired ? "Hết hạn" : "Đang chạy"}
                      </Badge>
                    </div>

                    <div style={{ fontSize: "0.71rem", color: T.textSecondary, display: "flex", flexWrap: "wrap", gap: "0.55rem" }}>
                      <span>Đơn tối thiểu: <strong>{Number(c.min_amount_vnd || 0) > 0 ? `${Number(c.min_amount_vnd).toLocaleString()}đ` : "0đ"}</strong></span>
                      <span>Đã dùng: <strong>{c.used_count || 0}/{c.max_uses || "∞"}</strong></span>
                      <span>Hết hạn: <strong>{c.expires_at ? new Date(c.expires_at).toLocaleDateString("vi-VN") : "Vô hạn"}</strong></span>
                    </div>

                    <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.1rem" }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        isLight={isLight}
                        disabled={isBusy}
                        onClick={() => handleToggleCoupon(c.code, !c.is_active)}
                        style={{ flex: 1, fontSize: "0.7rem", minHeight: "28px" }}
                      >
                        {c.is_active ? "Tạm dừng" : "Kích hoạt"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        isLight={isLight}
                        disabled={isBusy}
                        onClick={() => handlePrefillCoupon(c)}
                        style={{ fontSize: "0.7rem", minHeight: "28px" }}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        isLight={isLight}
                        disabled={isBusy}
                        onClick={() => handleDeleteCoupon(c.code)}
                        style={{ fontSize: "0.7rem", minHeight: "28px" }}
                      >
                        {(c.used_count || 0) > 0 ? "Ngừng" : "Xóa"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
