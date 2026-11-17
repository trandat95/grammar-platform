import React from 'react';
import KitIcon from '../../ui-2026/KitIcon';

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
      {icon && (
        <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
          {typeof icon === 'string' ? <KitIcon name={icon} size={13} /> : icon}
        </span>
      )}
      {children}
    </span>
  );
}
