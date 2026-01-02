import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'gradient' | 'outline';
  onClick?: () => void;
}

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  variant = 'default',
  onClick,
}: CardProps) {
  const variants = {
    default: 'bg-white border border-gray-200 shadow-sm hover:shadow-md',
    gradient: 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 shadow-md hover:shadow-lg',
    outline: 'bg-transparent border-2 border-gray-300 hover:border-blue-500',
  };

  const baseStyles = 'rounded-xl p-6 transition-all';
  const clickableStyles = onClick ? 'cursor-pointer hover:scale-105' : '';

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${clickableStyles} ${className}`}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-xl font-bold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
