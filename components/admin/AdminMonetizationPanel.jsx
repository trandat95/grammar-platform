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
  const [planDrafts, setPlanDrafts] = useState({});
  const [savingPlanCode, setSavingPlanCode] = useState(null);

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
            original_price_vnd: String(p.original_price_vnd ?? p.price_vnd ?? 0),
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
          original_price_vnd: Math.max(0, Math.round(Number(draft.original_price_vnd || 0))),
          is_active: typeof overrideActive === "boolean" ? overrideActive : Boolean(draft.is_active),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        invalidateMonetizationClientCache();
        setNotice(`✅ Đã cập nhật giá gói ${planCode} (${Number(json.plan?.price_vnd || draft.price_vnd).toLocaleString()}đ) trực tiếp trên Database & áp dụng ngay!`);
        await loadMetrics();
      } else {
        setNotice(`⚠️ Lỗi cập nhật gói ${planCode}: ${json.error || "Không rõ"}`);
      }
    } catch (err) {
      setNotice(`⚠️ Lỗi kết nối: ${err.message}`);
    } finally {
      setSavingPlanCode(null);
    }
  };

  if (loading) return <Skeleton height="160px" width="100%" />;
  if (!data) return null;

  const { metrics = {}, funnel = [], abTesting = {}, paywallConfigs = [], plans = [] } = data;
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

        {notice && <Alert tone="success" isLight={isLight} style={{ marginBottom: "0.75rem" }}>{notice}</Alert>}

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
                original_price_vnd: String(p.original_price_vnd ?? p.price_vnd ?? 0),
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
                      <span>Giá gốc (VNĐ)</span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={draft.original_price_vnd}
                        onChange={(e) =>
                          setPlanDrafts((prev) => ({
                            ...prev,
                            [p.code]: { ...draft, original_price_vnd: e.target.value },
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
      </div>
    </div>
  );
}
