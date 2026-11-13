import React from 'react';

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

  return (
    <button
      type={type}
      className={`toeic-btn ${variantClass} ${sizeClass} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      style={{
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style
      }}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}
