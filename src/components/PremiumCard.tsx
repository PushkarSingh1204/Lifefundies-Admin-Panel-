import React from 'react';

interface PremiumCardProps {
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'bordered' | 'elevated';
  hover?: boolean;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  className = '',
  children,
  variant = 'default',
  hover = true,
}) => {
  const variantClass = {
    default: 'card',
    glass: 'card card--glass',
    bordered: 'card card--bordered',
    elevated: 'card card--elevated',
  }[variant];

  const hoverClass = hover ? 'card--hoverable' : '';

  return (
    <div className={`${variantClass} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};
