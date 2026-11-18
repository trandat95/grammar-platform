import React, { useEffect, useId, useRef } from "react";
import { getThemeTokens, getComponentTokens } from "../../../lib/tokens/design-tokens";
import { RADII } from "../../../lib/tokens/spacing.tokens";
import KitIcon from "../../ui-2026/KitIcon";

/**
 * WCAG 2.2 AA Consolidated Modal (Replaces FocusTrapModal2026 duplication)
 * Supports Focus Trap (Tab / Shift+Tab), Escape Close, Backdrop Dismiss, and Automatic Focus Restoration.
 */
export function Modal({
  id,
  isOpen = false,
  onClose,
  title,
  headerLeft = null,
  children,
  maxWidth = "640px",
  padding = "1.25rem",
  dataNoDict = true,
  isLight = undefined,
}) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const resolvedIsLight =
    typeof isLight === "boolean"
      ? isLight
      : typeof document !== "undefined"
        ? document.documentElement.getAttribute("data-theme") !== "dark"
        : true;
  const T = getThemeTokens(resolvedIsLight);
  const C = getComponentTokens(resolvedIsLight);

  useEffect(() => {
    if (!isOpen) return undefined;
    previousFocusRef.current = document.activeElement;

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const timer = setTimeout(() => {
      const modalEl = dialogRef.current;
      if (!modalEl) return;
      if (modalEl.contains(document.activeElement) && document.activeElement !== modalEl) {
        return;
      }
      const firstInput = modalEl.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
      if (firstInput) {
        firstInput.focus();
        return;
      }
      const focusables = modalEl.querySelectorAll(focusableSelector);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        modalEl.focus();
      }
    }, 10);

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onCloseRef.current) {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(dialogRef.current.querySelectorAll(focusableSelector));
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

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id={id}
      data-no-dict={dataNoDict ? "true" : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title && !headerLeft ? titleId : undefined}
      aria-label={headerLeft && typeof title === "string" ? title : undefined}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: C.modal.zIndex,
        backgroundColor: C.modal.backdrop,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
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
          boxSizing: "border-box",
        }}
      >
        {(title || headerLeft || onClose) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              padding: "0.95rem 1.25rem",
              borderBottom: `1px solid ${T.borderSubtle}`,
              backgroundColor: C.modal.headerBg,
            }}
          >
            {headerLeft ? (
              headerLeft
            ) : title ? (
              <h3 id={titleId} style={{ margin: 0, fontSize: "1.02rem", fontWeight: 800, color: T.textHeading }}>
                {title}
              </h3>
            ) : (
              <span />
            )}
            {onClose && (
              <button
                type="button"
                aria-label="Đóng hộp thoại"
                onClick={onClose}
                className="ds-focusable ds-target-min"
                style={{
                  width: "34px",
                  height: "34px",
                  minWidth: "34px",
                  minHeight: "34px",
                  borderRadius: "50%",
                  border: `1px solid ${T.border}`,
                  backgroundColor: T.bgElevated,
                  color: T.text,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <KitIcon name="close" size={16} />
              </button>
            )}
          </div>
        )}
        <div style={{ padding }}>{children}</div>
      </div>
    </div>
  );
}
