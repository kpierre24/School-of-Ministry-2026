import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`material-feedback flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] p-8 text-center ${className}`}
    >
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--md-primary-container)] text-[var(--md-primary)]"
        aria-hidden="true"
      >
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <h2 className="text-base font-bold text-[var(--md-on-surface)]">{title}</h2>
      {description && <p className="mt-1 max-w-md text-sm text-[var(--md-on-surface-variant)]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
