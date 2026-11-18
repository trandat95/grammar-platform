import React, { useState } from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import { KitIcon, StatusDot } from "../ui-2026/KitIcon";

/**
 * Milestone 2.3.4 & 2.3.11: SyncStatusIndicator Component
 * Displays live 5-state Offline-First Sync status pill + interactive Telemetry & Multi-Device Pull popover.
 */
export default function SyncStatusIndicator({
  syncState = { status: "SYNCED", pendingCount: 0 },
  isLight = false,
  isGuest = false,
  onOpenAuth,
  onTriggerSync,
  onPullRemote,
}) {
  const [openDetails, setOpenDetails] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const T = getThemeTokens(isLight);

  if (isGuest) {
    return (
      <button
        type="button"
        onClick={() => onOpenAuth && onOpenAuth()}
        title="Đăng nhập 1 chạm để lưu chuỗi ngày học & XP lên đám mây"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          backgroundColor: T.warningBg,
          border: `1px solid ${T.warningBorder}`,
          borderRadius: "999px",
          padding: "0.32rem 0.72rem",
          color: T.warning,
          fontSize: "0.75rem",
          fontWeight: "700",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <StatusDot tone="warning" size={7} />
        <span>
          Lưu tiến trình
          <span className="ge-hide-laptop-compact"> (1 chạm)</span>
        </span>
      </button>
    );
  }

  const status = syncState?.status || "SYNCED";
  const pendingCount = syncState?.pendingCount || 0;
  const telemetry = syncState?.telemetry || {};

  const statusMeta = {
    SYNCED: {
      tone: "success",
      label: "Đã đồng bộ",
      bg: T.successBg,
      border: T.successBorder,
      color: T.success,
      tooltip: `Dữ liệu an toàn trên Cloud lúc ${syncState.lastSyncTime || "vừa xong"}.`,
    },
    SYNCING: {
      tone: "warning",
      label: "Đang đồng bộ...",
      bg: T.accentBg,
      border: T.accentBorder,
      color: T.accent,
      tooltip: "Đang truyền mẻ dữ liệu lên Supabase PostgreSQL 17...",
    },
    PENDING: {
      tone: "warning",
      label: `Chờ gửi (${pendingCount})`,
      bg: T.warningBg,
      border: T.warningBorder,
      color: T.warning,
      tooltip: `${pendingCount} sự kiện đang xếp hàng trong IndexedDB Queue.`,
    },
    OFFLINE: {
      tone: "neutral",
      label: "Offline",
      bg: T.bgElevated,
      border: T.border,
      color: T.textMuted,
      tooltip: "Đang học ngoại tuyến (IndexedDB Multi-Store active). Sẽ tự động đồng bộ khi có mạng.",
    },
    ERROR: {
      tone: "danger",
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
        <StatusDot tone={current.tone} size={8} pulse={status === "SYNCING"} />
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
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: "800", color: T.text }}>
              <KitIcon name="refresh" size={14} color={T.accent} />
              <span>Resilient Sync Engine</span>
            </span>
            <button
              type="button"
              onClick={() => setOpenDetails(false)}
              aria-label="Đóng chi tiết đồng bộ"
              style={{
                background: "none",
                border: "none",
                color: T.textMuted,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                padding: "2px",
              }}
            >
              <KitIcon name="close" size={14} />
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
                color: "var(--ds-text-on-accent)",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.3rem",
              }}
            >
              <KitIcon name="upload" size={12} />
              <span>Đẩy Queue</span>
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
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.3rem",
              }}
            >
              <KitIcon name="download" size={12} />
              <span>{isPulling ? "Đang kéo..." : "Pull Cloud"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
