import React, { useEffect, useRef } from "react";
import { getThemeTokens, getComponentTokens } from "../../../lib/tokens/design-tokens";
import { RADII } from "../../../lib/tokens/spacing.tokens";

/**
 * WCAG 2.2 AA Accessible Modal with Focus Trap, Escape Close & Focus Restoration
 */
export function Modal({
  isOpen = false,
  onClose,
  title,
  children,
  maxWidth = "640px",
  isLight = false,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const T = getThemeTokens(isLight);
  const C = getComponentTokens(isLight);

  useEffect(() => {
    if (!isOpen) return undefined;
    previousFocusRef.current = document.activeElement;

    const timer = setTimeout(() => {
      if (!dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        dialogRef.current.focus();
      }
    }, 10);

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : "Dialog"}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: C.modal.zIndex,
        backgroundColor: C.modal.backdrop,
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: C.modal.bg,
          border: `1px solid ${C.modal.border}`,
          borderRadius: RADII.radiusXl,
          boxShadow: C.modal.shadow,
          color: T.text,
          outline: "none",
        }}
      >
        {title && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1rem 1.25rem",
              borderBottom: `1px solid ${T.borderSubtle}`,
              backgroundColor: C.modal.headerBg,
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.02rem", fontWeight: 800, color: T.textHeading }}>{title}</h3>
            {onClose && (
              <button
                type="button"
                aria-label="Đóng hộp thoại"
                onClick={onClose}
                className="ds-focusable ds-target-min"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: `1px solid ${T.border}`,
                  backgroundColor: T.bgElevated,
                  color: T.text,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div style={{ padding: "1.25rem" }}>{children}</div>
      </div>
    </div>
  );
}
