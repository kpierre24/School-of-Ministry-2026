import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] p-5 text-[var(--md-on-surface)] transition-all ${
        onClick ? 'cursor-pointer hover:border-[var(--md-primary)] hover:shadow-sm' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
