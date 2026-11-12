import React from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import { Alert, Badge, Button, Modal } from "../design-system";

/**
 * Milestone 2.12.8 & 2.12.9: Contextual Smart Paywall Modal
 * - Grounded in genuine learner progress (Progress Principle & Goal Gradient)
 * - Strictly Anti-Dark-Pattern: transparent terms, requires account registration for guests before VIP upgrade
 */
export default function SmartPaywallModal({
  isOpen = false,
  onClose,
  onDismiss,
  paywallContext = null,
  psychology = {},
  abVariant = "control",
  featurePreview = null,
  isGuest = false,
  onOpenFullPricing,
  onRequireRegister,
  isLight = false,
}) {
  if (!isOpen) return null;
  const T = getThemeTokens(isLight);
  const cfg = paywallContext?.config || {};

  const title =
    abVariant === "progress_anchored"
      ? psychology.progressHighlight || cfg.title_vi || "Mở rộng Tốc độ Tiến bộ với Hệ thống VIP"
      : cfg.title_vi || "Khám phá Hệ sinh thái Ngữ pháp Cá nhân hóa VIP";

  const handleDismiss = () => {
    if (onDismiss && cfg.trigger_key) {
      onDismiss(cfg.trigger_key);
    }
    if (onClose) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleDismiss} title="⭐ Lộ Trình Học Tập Nâng Cao VIP" isLight={isLight} maxWidth="580px">
      <div style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}>
        <div
          style={{
            backgroundColor: T.accentBg,
            border: `1px solid ${T.accentBorder}`,
            borderRadius: "12px",
            padding: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <Badge tone="accent" isLight={isLight}>
              Đề xuất theo Tiến độ Thực tế
            </Badge>
          </div>
          <h3 style={{ margin: "0 0 0.35rem", fontSize: "1.02rem", fontWeight: 800, color: T.textHeading }}>
            {title}
          </h3>
          <p style={{ margin: 0, fontSize: "0.84rem", color: T.textSecondary, lineHeight: 1.5 }}>
            {cfg.subtitle_vi ||
              psychology.personalizedHook ||
              "Mở khóa toàn bộ 2,939 câu bài tập, AI Coach & Lộ trình cá nhân hóa."}
          </p>
        </div>

        {psychology.goalGradientHint && (
          <Alert tone="info" isLight={isLight}>
            <strong>Tiến độ của bạn:</strong> {psychology.goalGradientHint}
          </Alert>
        )}

        {featurePreview && (
          <div
            style={{
              backgroundColor: T.bgElevated,
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: "10px",
              padding: "0.85rem",
            }}
          >
            <div style={{ fontSize: "0.78rem", fontWeight: 800, color: T.textMuted, marginBottom: "0.25rem" }}>
              XEM TRƯỚC TÍNH NĂNG ĐANG CHỌN:
            </div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: T.textHeading }}>{featurePreview.title}</div>
            <div style={{ fontSize: "0.8rem", color: T.textSecondary, marginTop: "0.2rem" }}>{featurePreview.description}</div>
          </div>
        )}

        {isGuest && (
          <Alert tone="warning" isLight={isLight}>
            <strong>Yêu cầu tài khoản:</strong> Bạn đang truy cập ở chế độ Khách. Vui lòng <strong>đăng ký tài khoản</strong> (hoặc đăng nhập) để hệ thống gắn quyền VIP vào hồ sơ cá nhân của bạn.
          </Alert>
        )}

        <div
          style={{
            fontSize: "0.78rem",
            color: T.textMuted,
            backgroundColor: T.bgElevated,
            padding: "0.7rem 0.85rem",
            borderRadius: "8px",
            border: `1px solid ${T.borderSubtle}`,
            lineHeight: 1.45,
          }}
        >
          <strong>Cam kết Minh bạch 100%:</strong> Thanh toán chuyển khoản VietQR Tự Động (SePay VA) kích hoạt VIP tức thì trong 1–5 giây, bảo lưu trọn vẹn XP, Streak &amp; Sổ tay câu sai của bạn.
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "0.6rem" }}>
          <Button variant="ghost" isLight={isLight} onClick={handleDismiss}>
            Để sau (Tiếp tục gói Free)
          </Button>
          {isGuest && onRequireRegister && (
            <Button
              variant="secondary"
              isLight={isLight}
              onClick={() => {
                if (onClose) onClose();
                onRequireRegister();
              }}
            >
              📝 Đăng ký để nâng cấp VIP
            </Button>
          )}
          <Button
            variant="primary"
            isLight={isLight}
            onClick={() => {
              if (onOpenFullPricing) onOpenFullPricing();
              if (onClose) onClose();
            }}
          >
            {cfg.cta_label || "Xem Bảng Giá & Quyền Lợi VIP ➔"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
