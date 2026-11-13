import React, { useEffect, useRef } from 'react';

/**
 * FocusTrapModal2026.jsx
 * Giải quyết lỗi P1: Legacy Modals (#auth-modal, #vocab-modal, #new-user-modal) thiếu Focus Trap và phím Esc.
 */
export default function FocusTrapModal2026({
  isOpen,
  onClose,
  title,
  maxWidth = '520px',
  children,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement;

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const modalEl = dialogRef.current;
    if (modalEl) {
      const focusables = modalEl.querySelectorAll(focusableSelector);
      if (focusables.length > 0) focusables[0].focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab' && modalEl) {
        const focusables = Array.from(modalEl.querySelectorAll(focusableSelector));
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

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ge-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'var(--ds-backdrop)',
        backdropFilter: 'blur(6px)',
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '16px',
          background: 'var(--ds-card)',
          border: '1px solid var(--ds-card-border)',
          boxShadow: 'var(--ds-shadow-lg)',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <h2 id="ge-modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="ds-btn"
            style={{
              width: 34,
              height: 34,
              borderRadius: 9999,
              border: '1px solid var(--ds-border)',
              background: 'var(--ds-bg-elevated)',
              color: 'var(--ds-text)',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
