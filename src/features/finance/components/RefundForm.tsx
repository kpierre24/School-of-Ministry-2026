import React, { useState } from 'react';
import { X, RotateCcw, DollarSign } from 'lucide-react';
import { Invoice, RefundInput } from '../types';

interface RefundFormProps {
  invoice?: Invoice | null;
  onClose: () => void;
  onSubmit: (input: RefundInput) => Promise<void>;
  isLoading?: boolean;
}

export const RefundForm: React.FC<RefundFormProps> = ({
  invoice,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const maxRefundable = (invoice as any)?.amountPaid ?? (invoice as any)?.paid_amount ?? 100;

  const [studentName, setStudentName] = useState(invoice?.student_name || '');
  const [studentId, setStudentId] = useState(invoice?.student_id || '');
  const [invoiceId, setInvoiceId] = useState(invoice?.id || '');
  const [amount, setAmount] = useState<number | string>(maxRefundable);
  const [reason, setReason] = useState('Course drop / tuition overpayment refund');
  const [approvedByUserId, setApprovedByUserId] = useState('Finance Admin');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid refund amount.');
      return;
    }

    try {
      await onSubmit({
        invoiceId: invoiceId || undefined,
        studentId: studentId.trim() || undefined,
        studentName: studentName.trim() || 'Student Account',
        amount: numAmount,
        reason,
        approvedByUserId,
        notes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process refund.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" id="refund-form-modal">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Issue Tuition Refund
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Process refund allocations to student accounts or original payment methods.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {invoice && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">
                  Associated Invoice
                </span>
                <div className="font-semibold text-slate-900 dark:text-white font-mono">
                  {invoice.invoice_number || invoice.id} ({invoice.student_name})
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Total Paid
                </span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ${maxRefundable.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Name */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Refund Amount */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Refund Amount ($ USD) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-semibold focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Refund Reason *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Overpayment adjustment or module withdrawal..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Approved By */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Approving Official / Reference
            </label>
            <input
              type="text"
              value={approvedByUserId}
              onChange={(e) => setApprovedByUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Submit Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-refund-btn"
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Confirm & Issue Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
