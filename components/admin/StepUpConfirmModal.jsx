import React, { useState, useEffect } from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";

const REQUIRED_PHRASE = "CONFIRM_SECURITY_ACTION";

/**
 * Milestone 2.4.9: Step-Up Confirmation Dialog for High-Risk Admin Actions
 * Requires exact entry of 'CONFIRM_SECURITY_ACTION' before mutating roles, locks, or quota policies.
 */
export default function StepUpConfirmModal({
  isOpen = false,
  title = "Xác thực Bảo mật Cấp cao (Step-Up Auth)",
  description = "Hành động này sẽ thay đổi quyền truy cập hoặc chính sách hệ thống và được ghi vĩnh viễn vào Audit Log bất biến.",
  targetLabel = "",
  isSubmitting = false,
  errorMsg = "",
  onConfirm,
  onCancel,
  isLight = false,
}) {
  const [phrase, setPhrase] = useState("");
  const T = getThemeTokens(isLight);

  useEffect(() => {
    if (isOpen) {
      setPhrase("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSubmitting && onCancel) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) return null;

  const isExactMatch = phrase.trim() === REQUIRED_PHRASE;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isExactMatch || isSubmitting) return;
    if (onConfirm) onConfirm(REQUIRED_PHRASE);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stepup-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        backgroundColor: "rgba(2, 6, 23, 0.72)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: T.card,
          border: `1px solid ${T.dangerBorder}`,
          borderRadius: "14px",
          boxShadow: T.shadowElevated,
          padding: "1.4rem",
          color: T.text,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", marginBottom: "0.75rem" }}>
          <span
            style={{
              backgroundColor: T.dangerBg,
              color: T.danger,
              border: `1px solid ${T.dangerBorder}`,
              borderRadius: "8px",
              padding: "0.28rem 0.5rem",
              fontSize: "0.8rem",
              fontWeight: "800",
            }}
          >
            🛡️ STEP-UP
          </span>
          <h3 id="stepup-modal-title" style={{ margin: 0, fontSize: "1.02rem", fontWeight: "800", color: T.textHeading }}>
            {title}
          </h3>
        </div>

        <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.86rem", lineHeight: 1.5, color: T.textSecondary }}>
          {description}
        </p>

        {targetLabel && (
          <div
            style={{
              backgroundColor: T.bgElevated,
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: "8px",
              padding: "0.55rem 0.75rem",
              fontSize: "0.8rem",
              fontWeight: "600",
              color: T.text,
              marginBottom: "0.9rem",
            }}
          >
            Đối tượng tác động: <span style={{ color: T.accent }}>{targetLabel}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="stepup-confirm-input"
            style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: T.textSecondary, marginBottom: "0.4rem" }}
          >
            Nhập chính xác chuỗi{" "}
            <code
              style={{
                backgroundColor: T.codeBg,
                color: T.danger,
                padding: "0.1rem 0.35rem",
                borderRadius: "4px",
                fontWeight: "800",
              }}
            >
              {REQUIRED_PHRASE}
            </code>{" "}
            để tiếp tục:
          </label>

          <input
            id="stepup-confirm-input"
            type="text"
            autoFocus
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder={REQUIRED_PHRASE}
            disabled={isSubmitting}
            style={{
              width: "100%",
              boxSizing: "border-box",
              backgroundColor: T.inputBg,
              border: `1.5px solid ${isExactMatch ? T.success : T.inputBorder}`,
              borderRadius: "8px",
              padding: "0.6rem 0.75rem",
              color: T.text,
              fontSize: "0.86rem",
              fontFamily: "monospace",
              fontWeight: "700",
              outline: "none",
              marginBottom: "0.65rem",
            }}
          />

          {errorMsg && (
            <div
              role="alert"
              style={{
                backgroundColor: T.dangerBg,
                border: `1px solid ${T.dangerBorder}`,
                color: T.danger,
                borderRadius: "8px",
                padding: "0.5rem 0.7rem",
                fontSize: "0.78rem",
                fontWeight: "600",
                marginBottom: "0.75rem",
              }}
            >
              {errorMsg}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.4rem" }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                backgroundColor: T.bgElevated,
                border: `1px solid ${T.border}`,
                color: T.textSecondary,
                borderRadius: "8px",
                padding: "0.5rem 0.9rem",
                fontSize: "0.82rem",
                fontWeight: "600",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={!isExactMatch || isSubmitting}
              style={{
                backgroundColor: isExactMatch && !isSubmitting ? T.danger : T.bgElevated,
                border: `1px solid ${isExactMatch && !isSubmitting ? T.danger : T.border}`,
                color: isExactMatch && !isSubmitting ? "#ffffff" : T.textMuted,
                borderRadius: "8px",
                padding: "0.5rem 1rem",
                fontSize: "0.82rem",
                fontWeight: "700",
                cursor: isExactMatch && !isSubmitting ? "pointer" : "not-allowed",
                transition: "all 0.15s ease",
              }}
            >
              {isSubmitting ? "Đang xác thực..." : "Xác nhận Thực thi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
