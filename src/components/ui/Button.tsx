import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-[var(--md-primary)] text-white hover:opacity-90 dark:bg-[var(--md-primary)]',
    secondary: 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] hover:bg-[var(--md-primary-container)]/80',
    outline: 'border border-[var(--md-outline)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container)]',
    ghost: 'text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container)]',
    danger: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-lg',
    md: 'px-4 py-2 text-sm font-semibold rounded-xl',
    lg: 'px-5 py-2.5 text-base font-semibold rounded-xl',
  };

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
