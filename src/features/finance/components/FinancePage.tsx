import React, { useState } from 'react';
import {
  DollarSign,
  FileText,
  CreditCard,
  SlidersHorizontal,
  RotateCcw,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useFinance } from '../hooks/useFinance';
import { FinancialSummary } from './FinancialSummary';
import { InvoiceList } from './InvoiceList';
import { InvoiceDetails } from './InvoiceDetails';
import { InvoiceForm } from './InvoiceForm';
import { PaymentForm } from './PaymentForm';
import { AdjustmentForm } from './AdjustmentForm';
import { RefundForm } from './RefundForm';
import { Invoice, InvoiceInput, PaymentInput, AdjustmentInput, RefundInput } from '../types';
import { formatCurrency } from '../services/invoiceService';

export const FinancePage: React.FC = () => {
  const {
    filteredInvoices,
    payments,
    adjustments,
    refunds,
    selectedInvoice,
    setSelectedInvoiceId,
    searchQuery,
    setSearchQuery,
    selectedTrack,
    setSelectedTrack,
    selectedStatus,
    setSelectedStatus,
    stats,
    isLoading,
    error,
    reloadAll,
    recordPayment,
    applyAdjustment,
    recordRefund,
    setInvoices,
    invoices,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'adjustments' | 'refunds'>('invoices');

  // Modal triggers
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);

  // Active Target for Form Modals
  const [activeTargetInvoice, setActiveTargetInvoice] = useState<Invoice | null>(null);

  // Handlers
  const handleOpenPaymentModal = (invoice?: Invoice) => {
    setActiveTargetInvoice(invoice || null);
    setShowPaymentForm(true);
  };

  const handleOpenAdjustmentModal = (invoice?: Invoice) => {
    setActiveTargetInvoice(invoice || null);
    setShowAdjustmentForm(true);
  };

  const handleOpenRefundModal = (invoice?: Invoice) => {
    setActiveTargetInvoice(invoice || null);
    setShowRefundForm(true);
  };

  const handleInvoiceFormSubmit = async (input: InvoiceInput) => {
    // Call API service directly through invoice hook or reload
    const { createOrUpdateInvoiceApi } = await import('../services/invoiceService');
    await createOrUpdateInvoiceApi(input);
    await reloadAll();
  };

  const handlePaymentFormSubmit = async (input: PaymentInput) => {
    await recordPayment(input);
    await reloadAll();
  };

  const handleAdjustmentFormSubmit = async (input: AdjustmentInput) => {
    await applyAdjustment(input);
    await reloadAll();
  };

  const handleRefundFormSubmit = async (input: RefundInput) => {
    await recordRefund(input);
    await reloadAll();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto" id="finance-page-container">
      {/* KPI Overview Summary Header */}
      <FinancialSummary stats={stats} onRefresh={reloadAll} isLoading={isLoading} />

      {/* Error Notice if any */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={reloadAll}
            className="underline font-semibold hover:text-rose-900 dark:hover:text-rose-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-700 gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-px">
          <button
            id="tab-invoices"
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Institutional Invoices ({invoices.length})
          </button>

          <button
            id="tab-payments"
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Payment Transactions ({payments.length})
          </button>

          <button
            id="tab-adjustments"
            onClick={() => setActiveTab('adjustments')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'adjustments'
                ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Scholarships & Adjustments ({adjustments.length})
          </button>

          <button
            id="tab-refunds"
            onClick={() => setActiveTab('refunds')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'refunds'
                ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Refund Records ({refunds.length})
          </button>
        </div>

        {/* Global Action Trigger Buttons */}
        <div className="flex items-center gap-2 py-2 sm:py-0">
          <button
            id="global-record-payment-btn"
            onClick={() => handleOpenPaymentModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Record Payment
          </button>

          <button
            id="global-apply-adjustment-btn"
            onClick={() => handleOpenAdjustmentModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Grant Aid / Scholarship
          </button>
        </div>
      </div>

      {/* Tab Content Panels */}
      {activeTab === 'invoices' && (
        <InvoiceList
          invoices={filteredInvoices}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={selectedStatus}
          onStatusFilterChange={setSelectedStatus}
          trackFilter={selectedTrack}
          onTrackFilterChange={setSelectedTrack}
          onSelectInvoice={(inv) => setSelectedInvoiceId(inv.id)}
          onCreateInvoice={() => setShowInvoiceForm(true)}
          onRecordPayment={handleOpenPaymentModal}
          onApplyAdjustment={handleOpenAdjustmentModal}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Institutional Payment Audit Log
            </h3>
            <button
              onClick={() => handleOpenPaymentModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Record Payment
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Receipt / Ref #</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs text-slate-700 dark:text-slate-300">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No payment transactions logged.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                        {p.receipt_number || p.payment_number || p.id}
                      </td>
                      <td className="px-4 py-3 font-medium">{p.student_name || 'N/A'}</td>
                      <td className="px-4 py-3 capitalize">{p.payment_method?.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Completed
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{p.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'adjustments' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Scholarships, Grants & Financial Adjustments
            </h3>
            <button
              onClick={() => handleOpenAdjustmentModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Apply Adjustment
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Adjustment #</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Category / Type</th>
                  <th className="px-4 py-3">Nature</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Authorized By</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs text-slate-700 dark:text-slate-300">
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No adjustments or scholarships applied.
                    </td>
                  </tr>
                ) : (
                  adjustments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                        {a.adjustment_number || a.id}
                      </td>
                      <td className="px-4 py-3 font-medium">{a.student_name || 'N/A'}</td>
                      <td className="px-4 py-3">{a.category_name || a.adjustment_type}</td>
                      <td className="px-4 py-3 font-semibold">
                        {a.is_charge ? (
                          <span className="text-rose-600 dark:text-rose-400">Additional Charge (+)</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">Credit / Waiver (-)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">{formatCurrency(a.amount)}</td>
                      <td className="px-4 py-3 text-slate-500">{a.authorized_by || 'Admin'}</td>
                      <td className="px-4 py-3 text-slate-500">{a.reason || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'refunds' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Tuition Refund & Reimbursement Log
            </h3>
            <button
              onClick={() => handleOpenRefundModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Issue Refund
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Refund #</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Approved By</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs text-slate-700 dark:text-slate-300">
                {refunds.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No tuition refunds recorded.
                    </td>
                  </tr>
                ) : (
                  refunds.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                        {r.refund_number || r.id}
                      </td>
                      <td className="px-4 py-3 font-medium">{r.student_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {r.refund_date ? new Date(r.refund_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{r.approved_by_user_id || 'Finance Officer'}</td>
                      <td className="px-4 py-3 text-slate-500">{r.reason || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <InvoiceDetails
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoiceId(null)}
          onRecordPayment={handleOpenPaymentModal}
          onApplyAdjustment={handleOpenAdjustmentModal}
          onRecordRefund={handleOpenRefundModal}
        />
      )}

      {/* Invoice Form Modal */}
      {showInvoiceForm && (
        <InvoiceForm
          onClose={() => setShowInvoiceForm(false)}
          onSubmit={handleInvoiceFormSubmit}
          isLoading={isLoading}
        />
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <PaymentForm
          invoice={activeTargetInvoice}
          onClose={() => setShowPaymentForm(false)}
          onSubmit={handlePaymentFormSubmit}
          isLoading={isLoading}
        />
      )}

      {/* Adjustment Form Modal */}
      {showAdjustmentForm && (
        <AdjustmentForm
          invoice={activeTargetInvoice}
          onClose={() => setShowAdjustmentForm(false)}
          onSubmit={handleAdjustmentFormSubmit}
          isLoading={isLoading}
        />
      )}

      {/* Refund Form Modal */}
      {showRefundForm && (
        <RefundForm
          invoice={activeTargetInvoice}
          onClose={() => setShowRefundForm(false)}
          onSubmit={handleRefundFormSubmit}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
