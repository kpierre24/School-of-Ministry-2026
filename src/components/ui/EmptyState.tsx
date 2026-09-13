import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  secondaryAction,
  icon,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center dark:bg-slate-900/40 dark:border-slate-800 ${className}`}
      role="status"
    >
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--md-primary-container)] text-[var(--color-primary)] shadow-xs dark:bg-sky-950/60 dark:text-sky-300"
        aria-hidden="true"
      >
        {icon || <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="text-base font-bold text-[var(--color-text)] dark:text-slate-100">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-[var(--color-text-muted)] dark:text-slate-400">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
