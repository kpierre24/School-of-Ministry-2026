import React from 'react';
import {
  X,
  FileText,
  User,
  Calendar,
  CreditCard,
  SlidersHorizontal,
  RotateCcw,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Invoice } from '../types';
import { formatCurrency, normalizeInvoiceStatus } from '../services/invoiceService';

interface InvoiceDetailsProps {
  invoice: Invoice | null;
  onClose: () => void;
  onRecordPayment?: (invoice: Invoice) => void;
  onApplyAdjustment?: (invoice: Invoice) => void;
  onRecordRefund?: (invoice: Invoice) => void;
}

export const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({
  invoice,
  onClose,
  onRecordPayment,
  onApplyAdjustment,
  onRecordRefund,
}) => {
  if (!invoice) return null;

  const total = (invoice as any).totalTuition ?? (invoice as any).total_amount ?? 0;
  const paid = (invoice as any).amountPaid ?? (invoice as any).paid_amount ?? 0;
  const balance = (invoice as any).outstandingBalance ?? (invoice as any).balance ?? Math.max(0, total - paid);
  const status = normalizeInvoiceStatus(invoice.status);
  const lineItems = (invoice as any).lines || (invoice as any).lineItems || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" id="invoice-details-modal">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  Invoice {invoice.invoice_number || invoice.id}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : status === 'overdue'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                }`}>
                  {status.toUpperCase().replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Created on {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <button
            id="close-invoice-details-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Student & Course Info Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Student Account
              </span>
              <div className="mt-1 font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                {invoice.student_name || 'N/A'}
              </div>
              <div className="mt-1 text-slate-500 dark:text-slate-400">
                ID: {invoice.student_id || 'N/A'}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Module & Academic Term
              </span>
              <div className="mt-1 font-medium text-slate-900 dark:text-white">
                {invoice.module_track || 'HTEIM Core Curriculum'}
              </div>
              <div className="mt-1 text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Term: {invoice.term || 'Spring 2026'} ({invoice.academic_year || '2026'})
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-xs uppercase tracking-wider">
              Billed Line Items
            </h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-500 uppercase">
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Amount</th>
                    <th className="px-3 py-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td className="px-3 py-2 font-medium">Tuition</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                        {invoice.module_track || 'School of Ministry Module Tuition'}
                      </td>
                      <td className="px-3 py-2 text-center">1</td>
                      <td className="px-3 py-2 text-right font-mono">{formatCurrency(total)}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{formatCurrency(total)}</td>
                    </tr>
                  ) : (
                    lineItems.map((line: any, idx: number) => (
                      <tr key={line.id || idx}>
                        <td className="px-3 py-2 font-semibold capitalize text-slate-700 dark:text-slate-300">
                          {line.line_type || line.lineType || 'Tuition'}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                          {line.description || 'Module Tuition'}
                        </td>
                        <td className="px-3 py-2 text-center">{line.quantity || 1}</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {formatCurrency(line.unit_amount || line.unitAmount || 0)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">
                          {formatCurrency(line.total_amount || line.totalAmount || (line.quantity * line.unit_amount) || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Balance Calculation Summary Card */}
          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/50 space-y-2">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Total Billed Tuition & Fees:</span>
              <span className="font-mono font-semibold">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Payments Received & Allocated:</span>
              <span className="font-mono font-semibold">-{formatCurrency(paid)}</span>
            </div>
            <div className="pt-2 border-t border-amber-200 dark:border-amber-900/50 flex justify-between text-slate-900 dark:text-white font-bold text-sm">
              <span>Authoritative Outstanding Balance:</span>
              <span className={`font-mono ${balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {formatCurrency(balance)}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1">
              * Note: Server remains authoritative for final invoice totals, payment allocations, and balances.
            </p>
          </div>

          {/* Additional Notes */}
          {invoice.notes && (
            <div className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="font-semibold block text-[10px] uppercase text-slate-400">Notes / Payment Plan</span>
              {invoice.notes}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print Statement
          </button>

          <div className="flex items-center gap-2">
            {onApplyAdjustment && (
              <button
                id="modal-apply-adjustment-btn"
                onClick={() => {
                  onClose();
                  onApplyAdjustment(invoice);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Apply Scholarship / Waiver
              </button>
            )}

            {onRecordPayment && balance > 0 && (
              <button
                id="modal-record-payment-btn"
                onClick={() => {
                  onClose();
                  onRecordPayment(invoice);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5" /> Record Payment
              </button>
            )}

            {onRecordRefund && paid > 0 && (
              <button
                id="modal-record-refund-btn"
                onClick={() => {
                  onClose();
                  onRecordRefund(invoice);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Issue Refund
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
