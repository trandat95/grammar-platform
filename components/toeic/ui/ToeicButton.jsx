import React from 'react';
import KitIcon from '../../ui-2026/KitIcon';

export default function ToeicButton({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  onClick,
  disabled = false,
  className = '',
  style = {},
  type = 'button',
  icon = null,
  ...props
}) {
  const sizeClass = size === 'sm' ? 'toeic-btn-sm' : size === 'lg' ? 'toeic-btn-lg' : '';
  const variantClass = `toeic-btn-${variant}`;
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <button
      type={type}
      className={`toeic-btn ds-focusable ${variantClass} ${sizeClass} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      style={{
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style
      }}
      {...props}
    >
      {icon && (
        <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
          {typeof icon === 'string' ? <KitIcon name={icon} size={iconSize} /> : icon}
        </span>
      )}
      {children}
    </button>
  );
}
