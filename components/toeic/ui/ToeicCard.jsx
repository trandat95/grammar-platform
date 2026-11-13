import React from 'react';

export default function ToeicCard({
  children,
  className = '',
  variant = 'default', // 'default' | 'hero' | 'subtle' | 'interactive'
  onClick,
  style = {},
  ...props
}) {
  let variantClass = 'toeic-card';
  if (variant === 'hero') variantClass = 'toeic-card-hero';
  else if (variant === 'subtle') variantClass = 'toeic-card-subtle';
  else if (variant === 'interactive') variantClass = 'toeic-card toeic-card-interactive';

  return (
    <div
      className={`${variantClass} ${className}`.trim()}
      onClick={onClick}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
