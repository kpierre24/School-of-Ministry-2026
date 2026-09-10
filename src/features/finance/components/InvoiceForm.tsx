import React, { useState } from 'react';
import { X, Plus, Trash2, FileText, Calendar, DollarSign } from 'lucide-react';
import { Invoice, InvoiceInput } from '../types';

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onClose: () => void;
  onSubmit: (input: InvoiceInput) => Promise<void>;
  isLoading?: boolean;
}

interface LineItemState {
  id?: string;
  lineType: 'tuition' | 'fee' | 'other';
  description: string;
  quantity: number;
  unitAmount: number;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [studentName, setStudentName] = useState(invoice?.student_name || '');
  const [studentId, setStudentId] = useState(invoice?.student_id || '');
  const [moduleTrack, setModuleTrack] = useState(invoice?.module_track || 'MIN-101');
  const [term, setTerm] = useState(invoice?.term || 'Spring 2026');
  const [academicYear, setAcademicYear] = useState(invoice?.academic_year || '2026');
  const [dueDate, setDueDate] = useState(invoice?.due_date || new Date().toISOString().split('T')[0]);
  const [paymentPlan, setPaymentPlan] = useState(invoice?.payment_plan || 'full');
  const [notes, setNotes] = useState(invoice?.notes || '');

  const [lines, setLines] = useState<LineItemState[]>(
    (invoice as any)?.lines || [
      {
        lineType: 'tuition',
        description: 'Module Tuition & Instruction Fee',
        quantity: 1,
        unitAmount: 250,
      },
    ]
  );

  const [error, setError] = useState<string | null>(null);

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        lineType: 'fee',
        description: 'Course Materials & Registration Fee',
        quantity: 1,
        unitAmount: 50,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof LineItemState, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentName.trim()) {
      setError('Student name is required');
      return;
    }

    try {
      await onSubmit({
        id: invoice?.id,
        invoiceNumber: invoice?.invoice_number,
        studentId: studentId.trim() || undefined,
        studentName: studentName.trim(),
        moduleTrack,
        term,
        academicYear,
        dueDate,
        paymentPlan,
        notes,
        lines: lines.map((l) => ({
          id: l.id,
          lineType: l.lineType,
          description: l.description,
          quantity: Number(l.quantity) || 1,
          unitAmount: Number(l.unitAmount) || 0,
        })),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save invoice');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" id="invoice-form-modal">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {invoice ? 'Edit Institutional Invoice' : 'Create Institutional Invoice'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Issued for student tuition, module fees, and academic track charges.
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Name */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Student Full Name *
              </label>
              <input
                id="invoice-student-name"
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Student ID / Ref
              </label>
              <input
                id="invoice-student-id"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. STU-2026-001"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Module Track */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Module Track *
              </label>
              <select
                id="invoice-module-track"
                value={moduleTrack}
                onChange={(e) => setModuleTrack(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="MIN-101">MIN-101 (Old Testament Survey)</option>
                <option value="MIN-102">MIN-102 (New Testament Survey)</option>
                <option value="MIN-201">MIN-201 (Systematic Theology)</option>
                <option value="MIN-202">MIN-202 (Christian Leadership)</option>
                <option value="MIN-301">MIN-301 (Homiletics & Preaching)</option>
                <option value="MIN-302">MIN-302 (Pneumatology & Worship)</option>
              </select>
            </div>

            {/* Term */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Academic Term
              </label>
              <input
                id="invoice-term"
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Spring 2026"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Due Date
              </label>
              <input
                id="invoice-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Payment Plan */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Payment Schedule
              </label>
              <select
                id="invoice-payment-plan"
                value={paymentPlan}
                onChange={(e) => setPaymentPlan(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="full">Full Upfront Payment</option>
                <option value="monthly_2">2 Monthly Installments</option>
                <option value="monthly_4">4 Monthly Installments</option>
              </select>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-900 dark:text-white">
                Billed Items / Charges
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line Item
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-3">
                    <select
                      value={line.lineType}
                      onChange={(e) => handleLineChange(idx, 'lineType', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="tuition">Tuition</option>
                      <option value="fee">Fee</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Description"
                      value={line.description}
                      onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={line.unitAmount}
                      onChange={(e) => handleLineChange(idx, 'unitAmount', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right font-mono"
                    />
                  </div>

                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      disabled={lines.length <= 1}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Field */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Internal Notes / Terms
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Scholarship waiver applied upon submission..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
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
              id="submit-invoice-btn"
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : invoice ? 'Update Invoice' : 'Issue Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
