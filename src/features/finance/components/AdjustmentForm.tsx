import React, { useState } from 'react';
import { X, SlidersHorizontal, Award, DollarSign } from 'lucide-react';
import { Invoice, AdjustmentInput } from '../types';

interface AdjustmentFormProps {
  invoice?: Invoice | null;
  onClose: () => void;
  onSubmit: (input: AdjustmentInput) => Promise<void>;
  isLoading?: boolean;
}

export const AdjustmentForm: React.FC<AdjustmentFormProps> = ({
  invoice,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [studentName, setStudentName] = useState(invoice?.student_name || '');
  const [studentId, setStudentId] = useState(invoice?.student_id || '');
  const [invoiceId, setInvoiceId] = useState(invoice?.id || '');
  const [categoryName, setCategoryName] = useState('Scholarship / Financial Aid');
  const [adjustmentType, setAdjustmentType] = useState('Merit Scholarship');
  const [isCharge, setIsCharge] = useState(false); // Default to credit/discount
  const [amount, setAmount] = useState<number | string>(100);
  const [reason, setReason] = useState('Academic achievement scholarship waiver');
  const [authorizedBy, setAuthorizedBy] = useState('Dean of Admissions');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid adjustment amount.');
      return;
    }

    if (!invoiceId) {
      setError('An active invoice must be selected for financial adjustment.');
      return;
    }

    try {
      await onSubmit({
        invoiceId,
        studentId: studentId.trim() || undefined,
        studentName: studentName.trim() || 'Student Account',
        categoryName,
        adjustmentType,
        isCharge,
        amount: numAmount,
        reason,
        authorizedBy,
        notes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record adjustment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" id="adjustment-form-modal">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Apply Financial Adjustment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grant scholarships, fee waivers, tuition discounts, or late fee charges.
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
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/50">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Target Invoice: {invoice.invoice_number || invoice.id} ({invoice.student_name})
              </div>
            </div>
          )}

          {/* Adjustment Direction Toggle */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Adjustment Nature:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCharge(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  !isCharge
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Credit / Waiver (-)
              </button>
              <button
                type="button"
                onClick={() => setIsCharge(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isCharge
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Additional Charge (+)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Category
              </label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Scholarship / Financial Aid">Scholarship / Aid</option>
                <option value="Institutional Grant">Institutional Grant</option>
                <option value="Tuition Fee Waiver">Fee Waiver</option>
                <option value="Late Registration Fee">Late Fee</option>
                <option value="Other Adjustment">Other Adjustment</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Amount ($ USD) *
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
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-semibold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Reason / Justification *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Merit-based tuition reduction..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Authorization */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Authorized By
            </label>
            <input
              type="text"
              value={authorizedBy}
              onChange={(e) => setAuthorizedBy(e.target.value)}
              placeholder="e.g. Financial Committee"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
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
              id="submit-adjustment-btn"
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? 'Applying...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
