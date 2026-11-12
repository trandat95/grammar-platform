import React, { useEffect, useId, useRef } from "react";

/**
 * FocusTrapModal2026.jsx
 * Accessible WCAG 2.2 AA Dialog with Focus Trap (Tab / Shift+Tab), Escape Close,
 * Backdrop Dismiss, and Automatic Focus Restoration on Close.
 */
export default function FocusTrapModal2026({
  id,
  isOpen = false,
  onClose,
  title,
  maxWidth = "520px",
  padding = "24px",
  dataNoDict = true,
  headerLeft = null,
  children,
}) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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
      aria-labelledby={title ? titleId : undefined}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        backgroundColor: "var(--ds-backdrop)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
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
          borderRadius: "16px",
          backgroundColor: "var(--ds-card)",
          border: "1px solid var(--ds-card-border)",
          boxShadow: "var(--ds-shadow-lg)",
          color: "var(--ds-text)",
          padding,
          outline: "none",
          boxSizing: "border-box",
        }}
      >
        {(title || headerLeft) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "16px",
              paddingBottom: "12px",
              borderBottom: "1px solid var(--ds-border-subtle)",
            }}
          >
            {headerLeft ? (
              headerLeft
            ) : (
              <h2
                id={titleId}
                style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--ds-text-heading)" }}
              >
                {title}
              </h2>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng hộp thoại"
                className="ds-btn ds-focusable"
                style={{
                  width: 34,
                  height: 34,
                  minWidth: 34,
                  minHeight: 34,
                  borderRadius: "9999px",
                  border: "1px solid var(--ds-border)",
                  backgroundColor: "var(--ds-bg-elevated)",
                  color: "var(--ds-text)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
