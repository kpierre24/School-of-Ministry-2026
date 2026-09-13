import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeight = 'max-h-[85vh]',
  className = '',
}) => {
  // ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Sheet Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className={`relative z-10 flex w-full max-w-2xl flex-col rounded-t-3xl border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-2xl dark:bg-[#08182c] dark:border-slate-800 ${maxHeight} ${className}`}
          >
            {/* Grab Handle */}
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" aria-hidden="true" />
            </div>

            {/* Header */}
            {(title || subtitle) && (
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-3 dark:border-slate-800">
                <div className="min-w-0 flex-1 pr-3">
                  {title && (
                    <h2 className="truncate text-lg font-bold text-[var(--color-text)] dark:text-slate-100">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)] dark:text-slate-400">
                      {subtitle}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-slate-100 hover:text-[var(--color-text)] transition-colors dark:hover:bg-slate-800 dark:text-slate-400"
                  aria-label="Close sheet"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3.5 dark:bg-slate-900/60 dark:border-slate-800">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
