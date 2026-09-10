import React, { useState } from 'react';
import { X, CreditCard, DollarSign, Calendar, Tag } from 'lucide-react';
import { Invoice, PaymentInput } from '../types';

interface PaymentFormProps {
  invoice?: Invoice | null;
  onClose: () => void;
  onSubmit: (input: PaymentInput) => Promise<void>;
  isLoading?: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  invoice,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const defaultAmount = invoice
    ? ((invoice as any).outstandingBalance ?? (invoice as any).balance ?? (invoice as any).totalTuition ?? 0)
    : 250;

  const [studentName, setStudentName] = useState(invoice?.student_name || '');
  const [studentId, setStudentId] = useState(invoice?.student_id || '');
  const [invoiceId, setInvoiceId] = useState(invoice?.id || '');
  const [amount, setAmount] = useState<number | string>(defaultAmount);
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than $0.');
      return;
    }

    if (!studentName.trim() && !studentId.trim()) {
      setError('Student name or student ID is required.');
      return;
    }

    try {
      await onSubmit({
        invoiceId: invoiceId || undefined,
        studentId: studentId.trim() || undefined,
        studentName: studentName.trim() || undefined,
        amount: numAmount,
        paymentMethod,
        paymentDate,
        transactionReference: transactionReference.trim() || undefined,
        notes: notes.trim() || undefined,
        allocations: invoiceId
          ? [
              {
                invoiceId,
                amount: numAmount,
              },
            ]
          : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment transaction.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" id="payment-form-modal">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Record Payment Transaction
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Post incoming student tuition payments and allocate to active invoice.
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
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                  Target Invoice
                </span>
                <div className="font-semibold text-slate-900 dark:text-white font-mono">
                  {invoice.invoice_number || invoice.id}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Outstanding Balance
                </span>
                <div className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                  ${((invoice as any).outstandingBalance ?? (invoice as any).balance ?? 0).toFixed(2)}
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
                id="payment-student-name"
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Payment Amount */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Amount Paid ($ USD) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Payment Method *
              </label>
              <select
                id="payment-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="card">Credit / Debit Card</option>
                <option value="stripe">Stripe Gateway</option>
                <option value="bank_transfer">Bank Wire / ACH</option>
                <option value="cash">Cash Record</option>
                <option value="check">Official Check</option>
                <option value="scholarship">Grant / Scholarship Credit</option>
                <option value="other">Other Method</option>
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Payment Date
              </label>
              <input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Transaction Reference / Check #
            </label>
            <input
              id="payment-reference"
              type="text"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder="e.g. CHK-98421 or STRIPE-TX-1002"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Receipt Memo / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Partial installment for Spring 2026..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
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
              id="submit-payment-btn"
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Confirm & Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
