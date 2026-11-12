import React, { useState } from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";

/**
 * Milestone 2.3.4 & 2.3.11: SyncStatusIndicator Component
 * Displays live 5-state Offline-First Sync status pill + interactive Telemetry & Multi-Device Pull popover.
 */
export default function SyncStatusIndicator({
  syncState = { status: "SYNCED", pendingCount: 0 },
  isLight = false,
  onTriggerSync,
  onPullRemote,
}) {
  const [openDetails, setOpenDetails] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const T = getThemeTokens(isLight);

  const status = syncState?.status || "SYNCED";
  const pendingCount = syncState?.pendingCount || 0;
  const telemetry = syncState?.telemetry || {};

  const statusMeta = {
    SYNCED: {
      dot: "🟢",
      label: "Đã đồng bộ",
      bg: T.successBg,
      border: T.successBorder,
      color: T.success,
      tooltip: `Dữ liệu an toàn trên Cloud lúc ${syncState.lastSyncTime || "vừa xong"}.`,
    },
    SYNCING: {
      dot: "🟡",
      label: "Đang đồng bộ...",
      bg: T.accentBg,
      border: T.accentBorder,
      color: T.accent,
      tooltip: "Đang truyền mẻ dữ liệu lên Supabase PostgreSQL 17...",
    },
    PENDING: {
      dot: "🟠",
      label: `Chờ gửi (${pendingCount})`,
      bg: T.warningBg,
      border: T.warningBorder,
      color: T.warning,
      tooltip: `${pendingCount} sự kiện đang xếp hàng trong IndexedDB Queue.`,
    },
    OFFLINE: {
      dot: "⚪",
      label: "Offline",
      bg: T.bgElevated,
      border: T.border,
      color: T.textMuted,
      tooltip: "Đang học ngoại tuyến (IndexedDB Multi-Store active). Sẽ tự động đồng bộ khi có mạng.",
    },
    ERROR: {
      dot: "🔴",
      label: "Thử lại",
      bg: T.dangerBg,
      border: T.dangerBorder,
      color: T.danger,
      tooltip: "Kết nối gián đoạn. Hệ thống đang tự động backoff jitter & cho phép thử lại ngay.",
    },
  };

  const current = statusMeta[status] || statusMeta.SYNCED;

  const handlePull = async () => {
    if (!onPullRemote || isPulling) return;
    setIsPulling(true);
    try {
      await onPullRemote();
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpenDetails((prev) => !prev)}
        title={current.tooltip}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          backgroundColor: current.bg,
          border: `1px solid ${current.border}`,
          borderRadius: "999px",
          padding: "0.22rem 0.65rem",
          fontSize: "0.72rem",
          fontWeight: "700",
          color: current.color,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        <span style={{ fontSize: "0.65rem" }}>{current.dot}</span>
        <span>{current.label}</span>
      </button>

      {openDetails && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "305px",
            backgroundColor: T.card,
            border: `1px solid ${T.borderStrong}`,
            borderRadius: "10px",
            padding: "0.95rem 1rem",
            boxShadow: T.shadowElevated,
            zIndex: 950,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.55rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "800", color: T.text }}>
              🔄 Resilient Sync Engine
            </span>
            <button
              type="button"
              onClick={() => setOpenDetails(false)}
              style={{
                background: "none",
                border: "none",
                color: T.textMuted,
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              ✕
            </button>
          </div>

          <p style={{ fontSize: "0.75rem", color: T.textSecondary, margin: "0 0 0.7rem 0", lineHeight: "1.45" }}>
            {current.tooltip}
          </p>

          <div
            style={{
              backgroundColor: T.bgElevated,
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: "8px",
              padding: "0.6rem 0.75rem",
              fontSize: "0.72rem",
              fontFamily: "var(--font-sans)",
              color: T.textSecondary,
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              marginBottom: "0.75rem",
            }}
          >
            <div>Hàng đợi IndexedDB: <strong style={{ color: T.text }}>{pendingCount} sự kiện</strong></div>
            <div>P95 Độ trễ đồng bộ: <strong style={{ color: T.text }}>{telemetry.p95LatencyMs || 0} ms</strong></div>
            <div>Tỷ lệ thành công: <strong style={{ color: T.success }}>{telemetry.successRatePercent ?? 100}%</strong></div>
            <div>Đồng bộ gần nhất: <strong style={{ color: T.text }}>{syncState.lastSyncTime || "Chưa có"}</strong></div>
            {syncState.deviceId && (
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Thiết bị: <span style={{ color: T.textMuted }}>{syncState.deviceId}</span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.45rem" }}>
            <button
              type="button"
              onClick={() => onTriggerSync && onTriggerSync()}
              style={{
                flex: 1,
                padding: "0.4rem 0.6rem",
                fontSize: "0.74rem",
                fontWeight: "700",
                backgroundColor: T.accent,
                color: isLight ? "#ffffff" : T.bg,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              ⬆️ Đẩy Queue
            </button>
            <button
              type="button"
              disabled={isPulling}
              onClick={handlePull}
              style={{
                flex: 1,
                padding: "0.4rem 0.6rem",
                fontSize: "0.74rem",
                fontWeight: "700",
                backgroundColor: T.bgElevated,
                color: T.text,
                border: `1px solid ${T.border}`,
                borderRadius: "6px",
                cursor: isPulling ? "wait" : "pointer",
              }}
            >
              {isPulling ? "Đang kéo..." : "⬇️ Pull Cloud"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
