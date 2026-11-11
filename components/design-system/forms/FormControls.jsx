import React, { useId } from "react";
import { getThemeTokens, getComponentTokens } from "../../../lib/tokens/design-tokens";
import { RADII, MOTION } from "../../../lib/tokens/spacing.tokens";

export function Input({
  label,
  error,
  hint,
  isLight = false,
  id,
  style = {},
  ...rest
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  const T = getThemeTokens(isLight);
  const C = getComponentTokens(isLight);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      {label && (
        <label htmlFor={fieldId} style={{ fontSize: "0.8rem", fontWeight: 700, color: T.textSecondary }}>
          {label}
        </label>
      )}
      <input
        id={fieldId}
        aria-invalid={error ? "true" : undefined}
        className="ds-focusable"
        style={{
          width: "100%",
          boxSizing: "border-box",
          minHeight: "38px",
          padding: "0.5rem 0.75rem",
          borderRadius: RADII.radiusMd,
          backgroundColor: C.input.bg,
          color: C.input.color,
          border: `1.5px solid ${error ? C.input.errorBorder : C.input.border}`,
          fontSize: "0.85rem",
          transition: `border-color ${MOTION.durationFast}`,
          ...style,
        }}
        {...rest}
      />
      {error && (
        <span role="alert" style={{ fontSize: "0.75rem", color: T.danger, fontWeight: 600 }}>
          {error}
        </span>
      )}
      {!error && hint && (
        <span style={{ fontSize: "0.74rem", color: T.textMuted }}>{hint}</span>
      )}
    </div>
  );
}

export function Select({ label, error, options = [], isLight = false, id, style = {}, children, ...rest }) {
  const autoId = useId();
  const fieldId = id || autoId;
  const T = getThemeTokens(isLight);
  const C = getComponentTokens(isLight);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      {label && (
        <label htmlFor={fieldId} style={{ fontSize: "0.8rem", fontWeight: 700, color: T.textSecondary }}>
          {label}
        </label>
      )}
      <select
        id={fieldId}
        aria-invalid={error ? "true" : undefined}
        className="ds-focusable"
        style={{
          width: "100%",
          minHeight: "38px",
          padding: "0.45rem 0.7rem",
          borderRadius: RADII.radiusMd,
          backgroundColor: C.input.bg,
          color: C.input.color,
          border: `1.5px solid ${error ? C.input.errorBorder : C.input.border}`,
          fontSize: "0.85rem",
          ...style,
        }}
        {...rest}
      >
        {children ||
          options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
      </select>
      {error && (
        <span role="alert" style={{ fontSize: "0.75rem", color: T.danger, fontWeight: 600 }}>
          {error}
        </span>
      )}
    </div>
  );
}

export function Textarea({ label, error, isLight = false, id, rows = 3, style = {}, ...rest }) {
  const autoId = useId();
  const fieldId = id || autoId;
  const T = getThemeTokens(isLight);
  const C = getComponentTokens(isLight);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      {label && (
        <label htmlFor={fieldId} style={{ fontSize: "0.8rem", fontWeight: 700, color: T.textSecondary }}>
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={error ? "true" : undefined}
        className="ds-focusable"
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "0.55rem 0.75rem",
          borderRadius: RADII.radiusMd,
          backgroundColor: C.input.bg,
          color: C.input.color,
          border: `1.5px solid ${error ? C.input.errorBorder : C.input.border}`,
          fontSize: "0.85rem",
          lineHeight: 1.5,
          ...style,
        }}
        {...rest}
      />
      {error && (
        <span role="alert" style={{ fontSize: "0.75rem", color: T.danger, fontWeight: 600 }}>
          {error}
        </span>
      )}
    </div>
  );
}

export function Checkbox({ label, checked, onChange, isLight = false, id, ...rest }) {
  const autoId = useId();
  const fieldId = id || autoId;
  const T = getThemeTokens(isLight);

  return (
    <label
      htmlFor={fieldId}
      className="ds-target-min"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        cursor: "pointer",
        fontSize: "0.85rem",
        color: T.text,
        userSelect: "none",
      }}
    >
      <input
        id={fieldId}
        type="checkbox"
        checked={Boolean(checked)}
        onChange={onChange}
        style={{ width: "18px", height: "18px", accentColor: T.accent, cursor: "pointer" }}
        {...rest}
      />
      {label && <span>{label}</span>}
    </label>
  );
}

export function Switch({ label, checked = false, onChange, isLight = false, disabled = false }) {
  const T = getThemeTokens(isLight);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange && onChange(!checked)}
      className="ds-focusable ds-target-min"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.55rem",
        background: "transparent",
        border: "none",
        padding: "2px 0",
        cursor: disabled ? "not-allowed" : "pointer",
        color: T.text,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "40px",
          height: "22px",
          borderRadius: RADII.radiusFull,
          backgroundColor: checked ? T.accent : T.borderStrong,
          position: "relative",
          transition: `background-color ${MOTION.durationFast}`,
          display: "inline-block",
        }}
      >
        <span
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            position: "absolute",
            top: "3px",
            left: checked ? "21px" : "3px",
            transition: `left ${MOTION.durationFast}`,
          }}
        />
      </span>
      {label && <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>{label}</span>}
    </button>
  );
}
