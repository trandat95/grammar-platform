import React, { useState, useEffect, useCallback } from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import { KitIcon } from "../ui-2026/KitIcon";

/**
 * Milestone 2.4.5: Real-Time Operational Health Overview Panel
 * Queries /api/admin/overview with Zero-Trust Admin Bearer auth.
 */
export default function AdminOverviewPanel({
  authHeaders = {},
  isLight = false,
  onNavigateTab,
  onTriggerAdminLogin,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const T = getThemeTokens(isLight);

  const loadOverview = useCallback(async () => {
    if (!authHeaders?.Authorization) {
      setError("NO_AUTH_TOKEN");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/overview", { headers: authHeaders });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setData(json);
    } catch (e) {
      setError(e.message || "Không thể tải bảng tổng quan vận hành.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const cardStyle = {
    backgroundColor: T.card,
    border: `1px solid ${T.cardBorder}`,
    borderRadius: "12px",
    padding: "1rem 1.1rem",
    boxShadow: T.shadow,
  };

  const statRow = (label, value, color = T.textHeading) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.3rem 0", borderBottom: `1px dashed ${T.borderSubtle}` }}>
      <span style={{ fontSize: "0.8rem", color: T.textSecondary }}>{label}</span>
      <span style={{ fontSize: "0.88rem", fontWeight: "800", color }}>{value}</span>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.45rem", margin: 0, fontSize: "1.02rem", fontWeight: "800", color: T.textHeading }}>
            <KitIcon name="chart" size={18} color={T.accent} />
            <span>Tổng quan Vận hành Thời gian thực (Operational Health)</span>
          </h3>
          <div style={{ fontSize: "0.78rem", color: T.textMuted, marginTop: "0.2rem" }}>
            {data?.generatedAt ? `Cập nhật lúc: ${new Date(data.generatedAt).toLocaleString("vi-VN")} • Edge Cache 30s` : "Đang kết nối Supabase Telemetry..."}
          </div>
        </div>
        <button
          type="button"
          onClick={loadOverview}
          disabled={loading}
          style={{
            backgroundColor: T.accentBg,
            border: `1px solid ${T.accentBorder}`,
            color: T.accent,
            borderRadius: "8px",
            padding: "0.42rem 0.85rem",
            fontSize: "0.78rem",
            fontWeight: "700",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Đang tải..." : "↻ Làm mới Metrics"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            backgroundColor: error === "NO_AUTH_TOKEN" ? T.warningBg : T.dangerBg,
            border: `1px solid ${error === "NO_AUTH_TOKEN" ? T.warningBorder : T.dangerBorder}`,
            borderRadius: "10px",
            padding: "0.95rem 1.15rem",
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.88rem", fontWeight: "700", color: error === "NO_AUTH_TOKEN" ? T.warning : T.danger }}>
              {error === "NO_AUTH_TOKEN" && <KitIcon name="warning" size={15} color={T.warning} />}
              <span>{error === "NO_AUTH_TOKEN" ? "Yêu cầu chữ ký Quản trị viên từ Supabase Auth" : error}</span>
            </div>
            <div style={{ fontSize: "0.8rem", color: T.textSecondary, marginTop: "0.25rem" }}>
              {error === "NO_AUTH_TOKEN"
                ? "Hệ thống áp dụng chính sách bảo mật Zero-Trust. Vui lòng đăng nhập bằng tài khoản Quản trị viên Supabase Auth để kích hoạt kết nối thời gian thực."
                : "Phiên làm việc chưa có token hợp lệ."}
            </div>
          </div>
          {onTriggerAdminLogin && (
            <button
              type="button"
              onClick={onTriggerAdminLogin}
              style={{
                backgroundColor: T.accent,
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 0.95rem",
                fontSize: "0.82rem",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              <KitIcon name="key" size={14} />
              <span>Đăng nhập Quản trị viên</span>
            </button>
          )}
        </div>
      )}

      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.9rem" }}>
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", fontWeight: "800", color: T.accent, textTransform: "uppercase", marginBottom: "0.6rem" }}>
              <KitIcon name="users" size={14} color={T.accent} />
              <span>Người dùng &amp; Chuyển đổi</span>
            </div>
            {statRow("Tổng tài khoản", data.users?.totalUsers ?? 0)}
            {statRow("DAU (Hôm nay)", data.users?.dauCount ?? 0, T.success)}
            {statRow("WAU (7 ngày)", data.users?.wauCount ?? 0, T.accent)}
            {statRow("VIP / FREE / ADMIN", `${data.users?.vipCount ?? 0} / ${data.users?.freeCount ?? 0} / ${data.users?.adminCount ?? 0}`)}
            {statRow("Tỷ lệ chuyển đổi VIP", `${data.users?.vipConversionPercent ?? 0}%`, T.warning)}
            {statRow("Tài khoản đang khóa", data.users?.lockedAccounts ?? 0, data.users?.lockedAccounts > 0 ? T.danger : T.textMuted)}
          </div>

          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", fontWeight: "800", color: T.success, textTransform: "uppercase", marginBottom: "0.6rem" }}>
              <KitIcon name="target" size={14} color={T.success} />
              <span>Tương tác Học tập (24h)</span>
            </div>
            {statRow("Tổng XP tích lũy", Number(data.learning?.totalXp || 0).toLocaleString(), T.warning)}
            {statRow("Lượt hoàn thành bài học", Number(data.learning?.totalLessonsCompleted || 0).toLocaleString())}
            {statRow("Lượt Quiz trong 24h", data.learning?.quizzesCompleted24h ?? 0, T.accent)}
            {statRow("Độ chính xác TB (24h)", `${data.learning?.avgQuizAccuracy24h ?? 0}%`, T.success)}
          </div>

          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", fontWeight: "800", color: T.warning, textTransform: "uppercase", marginBottom: "0.6rem" }}>
              <KitIcon name="graduation" size={14} color={T.warning} />
              <span>Chất lượng Sư phạm (M2.5)</span>
            </div>
            {statRow("Lời giải chuẩn 5-Field (DB)", Number(data.pedagogy?.ingestedExplanations || 0).toLocaleString(), T.accent)}
            {statRow("Tổng Feedback học viên", data.pedagogy?.totalFeedback ?? 0)}
            {statRow("Tỷ lệ Hài lòng (Helpful)", `${data.pedagogy?.helpfulRatePercent ?? 100}%`, T.success)}
            {statRow("Báo lỗi cần kiểm duyệt", data.pedagogy?.errorReportsCount ?? 0, (data.pedagogy?.errorReportsCount || 0) > 0 ? T.danger : T.textMuted)}
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab("pedagogy")}
                style={{
                  marginTop: "0.75rem",
                  width: "100%",
                  backgroundColor: T.warningBg,
                  border: `1px solid ${T.warningBorder}`,
                  color: T.warning,
                  borderRadius: "8px",
                  padding: "0.42rem 0.65rem",
                  fontSize: "0.76rem",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Mở Kiểm duyệt Lời giải ➔
              </button>
            )}
          </div>

          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", fontWeight: "800", color: T.textSecondary, textTransform: "uppercase", marginBottom: "0.6rem" }}>
              <KitIcon name="lock" size={14} color={T.textSecondary} />
              <span>Governance &amp; Đồng bộ (M2.3 / M2.4)</span>
            </div>
            {statRow("Sync Idempotent (24h)", data.operations?.syncEvents24h ?? 0, T.accent)}
            {statRow("Tổng Audit Logs", Number(data.operations?.auditLogsCount || 0).toLocaleString())}
            {statRow("Policy Version", `v${data.operations?.policyVersion || 1}`, T.warning)}
            {statRow("Audit Immutability", data.operations?.immutableAuditTrigger ? "TRIGGER LOCKED" : "UNPROTECTED", T.success)}
            {statRow("Supabase Status", data.operations?.databaseStatus || "ACTIVE_HEALTHY", T.success)}
          </div>
        </div>
      )}
    </div>
  );
}
