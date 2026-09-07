import React from 'react';
import { 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2, 
  ChevronRight, 
  Inbox, 
  Info, 
  Loader2, 
  Lock, 
  RefreshCw, 
  ShieldAlert, 
  X,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from './Modal';

// ─── Tone & Variant Definitions ──────────────────────────────────────────

export type FeedbackTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const toneClasses: Record<FeedbackTone, string> = {
  info: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800',
  warning: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800',
  danger: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800',
  neutral: 'bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
};

// ─── Standardized Breadcrumbs ─────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
  icon?: React.ReactNode;
}

export function Breadcrumbs({ items, className = '' }: { items: BreadcrumbItem[]; className?: string }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 ${className}`}>
      <ol className="flex items-center flex-wrap gap-1.5 list-none p-0 m-0">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const isClickable = !isLast && !!item.onClick;

          return (
            <li key={idx} className="inline-flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />}
              {isClickable ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus:underline font-medium"
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 ${
                    isLast
                      ? 'font-semibold text-slate-900 dark:text-slate-100'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Standardized Page Header ─────────────────────────────────────────────

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: React.ReactNode;
  action?: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  badge,
  action,
  onBack,
  backLabel = 'Back',
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`space-y-3 mb-6 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{backLabel}</span>
            </button>
          )}

          {eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {eyebrow}
            </p>
          )}

          <div className="flex items-center flex-wrap gap-2.5 mt-0.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>

          {description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Standardized Buttons & Controls ─────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'tonal' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingLabel?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingLabel,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const sizeClasses: Record<ButtonSize, string> = {
      xs: 'px-2.5 py-1 text-xs gap-1.5 rounded-md min-h-[28px]',
      sm: 'px-3 py-1.5 text-xs font-semibold gap-1.5 rounded-lg min-h-[34px]',
      md: 'px-4 py-2 text-sm font-medium gap-2 rounded-lg min-h-[40px]',
      lg: 'px-5 py-2.5 text-base font-semibold gap-2.5 rounded-xl min-h-[46px]',
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm border border-transparent disabled:bg-blue-300 dark:disabled:bg-blue-950/60 dark:bg-blue-600 dark:hover:bg-blue-500',
      secondary:
        'bg-slate-800 hover:bg-slate-900 active:bg-black text-white shadow-sm border border-transparent dark:bg-slate-700 dark:hover:bg-slate-600',
      tonal:
        'bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-800 border border-blue-200 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-200 dark:border-blue-800',
      outline:
        'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
      danger:
        'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm border border-transparent disabled:bg-red-300 dark:bg-red-600 dark:hover:bg-red-500',
      ghost:
        'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300 border border-transparent',
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={`inline-flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/40 select-none ${
          sizeClasses[size]
        } ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${
          isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            <span>{loadingLabel || children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ─── Standardized Status Badge / Pill ─────────────────────────────────────

export function StatusPill({
  tone = 'neutral',
  label,
  icon,
  size = 'sm',
  className = '',
}: {
  tone?: FeedbackTone | 'purple';
  label: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const pillToneClasses: Record<string, string> = {
    info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  };

  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border whitespace-nowrap select-none ${sizeClass} ${
        pillToneClasses[tone] || pillToneClasses.neutral
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
    </span>
  );
}

// ─── Standardized 5 Core Screen States ────────────────────────────────────

/**
 * 1. Loading State:
 * Shows a clear spinner and descriptive label (e.g. "Loading students…")
 */
export function LoadingState({
  label = 'Loading content…',
  description,
  className = '',
}: {
  label?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-48 flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-8 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 mb-3 shadow-xs">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{label}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">{description}</p>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * 2. Empty State:
 * Shows when a query returns zero results or no records have been added yet.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  className = '',
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 text-center shadow-xs ${className}`}
    >
      <div
        className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
        aria-hidden="true"
      >
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/**
 * 3. Error State:
 * Shows when a network/API request fails with a direct retry button.
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not complete your request. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  className = '',
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-48 flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/70 p-8 text-center dark:border-red-900/60 dark:bg-red-950/30 ${className}`}
      role="alert"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      )}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="h-4 w-4" />}
          className="mt-4 bg-white dark:bg-slate-900 border-red-200 dark:border-red-800 hover:bg-red-50 text-red-700 dark:text-red-300"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * 4. Permission Denied State:
 * Standardized gate when a user tries to access a view outside their authorized role.
 */
export function PermissionDeniedState({
  title = 'Access Restricted',
  description = 'You do not have permission to view or manage this section.',
  requiredRole,
  onAction,
  actionLabel = 'Return to Home',
  className = '',
}: {
  title?: string;
  description?: string;
  requiredRole?: string;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-56 flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50/60 p-8 text-center dark:border-amber-900/60 dark:bg-amber-950/30 ${className}`}
      role="alert"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        <Lock className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1.5 max-w-md text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
      {requiredRole && (
        <div className="mt-2">
          <StatusPill tone="warning" label={`Requires: ${requiredRole}`} />
        </div>
      )}
      {onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="mt-5 bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800 hover:bg-amber-50 text-amber-900 dark:text-amber-200"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * 5. Status Banner / Success Feedback:
 * Dismissible or inline alert message for transactions, saved changes, or warnings.
 */
export function StatusBanner({
  tone = 'info',
  title,
  children,
  onDismiss,
  className = '',
}: {
  tone?: FeedbackTone;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const iconMap: Record<FeedbackTone, React.ReactNode> = {
    info: <Info className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" aria-hidden="true" />,
    success: <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" aria-hidden="true" />,
    warning: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden="true" />,
    danger: <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" aria-hidden="true" />,
    neutral: <Info className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-400 mt-0.5" aria-hidden="true" />,
  };

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-xs sm:text-sm ${toneClasses[tone]} ${className}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        {iconMap[tone]}
        <div className="flex-1 min-w-0">
          {title && <h4 className="font-bold mb-0.5">{title}</h4>}
          <div className="text-current leading-relaxed">{children}</div>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 text-current"
          aria-label="Dismiss message"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ─── Standardized Confirmation Dialog ─────────────────────────────────────

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
  icon,
}: ConfirmationDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      size="sm"
      title={
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
          {icon || (
            <div
              className={`p-1.5 rounded-lg shrink-0 ${
                isDestructive
                  ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
              }`}
            >
              {isDestructive ? <ShieldAlert className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
          )}
          <span>{title}</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        {description}
      </p>
    </Modal>
  );
}

// ─── Standardized Table Primitives ────────────────────────────────────────

export function TableContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs ${className}`}>
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
      {children}
    </thead>
  );
}

export function TableHeadCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th scope="col" className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;
}

export function TableRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={`border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${className}`}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-slate-700 dark:text-slate-300 ${className}`}>{children}</td>;
}

// ─── Standardized Form Layout Primitives ──────────────────────────────────

export function FormSection({
  title,
  description,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2.5">
          {title && <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>}
          {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        </div>
      )}
      <div className="space-y-3.5">{children}</div>
    </div>
  );
}

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  id,
  className = '',
}: {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

// ─── Toast Helper ─────────────────────────────────────────────────────────

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 3500,
    });
  },
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 5000,
    });
  },
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 3500,
    });
  },
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 4500,
    });
  },
};

// ─── Skeleton Helpers ──────────────────────────────────────────────────────

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700/60 ${className}`}
    />
  );
}

export function StudentCardSkeleton() {
  return (
    <div aria-hidden="true" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/5" />
          <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-2/5" />
        </div>
        <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg shrink-0" />
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-full" />
      <div className="flex gap-2">
        <div className="h-7 flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="h-7 flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="h-7 flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
}

export function StudentGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading students…"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <StudentCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function PaymentRowSkeleton() {
  return (
    <tr aria-hidden="true" className="animate-pulse border-b border-slate-100 dark:border-slate-800">
      {[40, 20, 15, 12, 12, 10, 10, 8].map((w, i) => (
        <td key={i} className="px-3 py-2">
          <div className={`h-3 bg-slate-200 dark:bg-slate-700 rounded w-${w === 40 ? 'full' : `${w}/20`}`} />
        </td>
      ))}
    </tr>
  );
}

export function PaymentTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <tbody role="status" aria-label="Loading payments…">
      {Array.from({ length: rows }).map((_, i) => (
        <PaymentRowSkeleton key={i} />
      ))}
      <tr><td><span className="sr-only">Loading…</span></td></tr>
    </tbody>
  );
}

