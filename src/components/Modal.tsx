import React from 'react';
import { X } from 'lucide-react';
import { useAccessibleModal } from '../lib/useAccessibleModal';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  className?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl',
  '3xl': 'max-w-5xl',
  '4xl': 'max-w-6xl',
  '5xl': 'max-w-7xl',
  full: 'max-w-[96vw] h-[92vh]',
};

/**
 * Reusable, fully accessible Modal component.
 * Handles focus trapping, Escape key listener, aria-modal="true", role="dialog",
 * background scroll lock, and responsive viewport sizing.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  size = 'lg',
  className = '',
  showCloseButton = true,
  closeOnOverlayClick = true,
  ariaLabel,
  ariaLabelledBy,
  headerActions,
  footer,
}) => {
  const dialogRef = useAccessibleModal(isOpen, onClose);

  if (!isOpen) return null;

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.lg;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || (typeof title === 'string' ? title : 'Dialog')}
        aria-labelledby={ariaLabelledBy || (title ? 'modal-headline' : undefined)}
        className={`bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full ${sizeClass} max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp modal-material-dialog ${className}`}
      >
        {/* Modal Header (if title or close button provided) */}
        {(title || showCloseButton) && (
          <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/50">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 id="modal-headline" className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate tracking-tight">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  type="button"
                  aria-label="Close dialog"
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
