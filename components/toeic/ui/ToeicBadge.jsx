import React from 'react';

export default function ToeicBadge({
  children,
  variant = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'muted'
  className = '',
  icon = null,
  style = {}
}) {
  const variantClass = `toeic-badge-${variant}`;

  return (
    <span
      className={`toeic-badge ${variantClass} ${className}`.trim()}
      style={style}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
}
