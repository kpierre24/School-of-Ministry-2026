import React from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  CreditCard,
  SlidersHorizontal,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Invoice } from '../types';
import { formatCurrency, normalizeInvoiceStatus } from '../services/invoiceService';

interface InvoiceListProps {
  invoices: Invoice[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  trackFilter: string;
  onTrackFilterChange: (t: string) => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onCreateInvoice: () => void;
  onRecordPayment?: (invoice: Invoice) => void;
  onApplyAdjustment?: (invoice: Invoice) => void;
  isLoading?: boolean;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  trackFilter,
  onTrackFilterChange,
  onSelectInvoice,
  onCreateInvoice,
  onRecordPayment,
  onApplyAdjustment,
  isLoading = false,
}) => {
  const getStatusBadge = (statusStr: string) => {
    const status = normalizeInvoiceStatus(statusStr);
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            <Clock className="w-3 h-3" /> Partially Paid
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            Issued
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden" id="invoice-list-container">
      {/* Search and Filters Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
          {/* Search Field */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="invoice-search-input"
              type="text"
              placeholder="Search invoice # or student..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-44">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              id="invoice-status-filter"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="issued">Issued</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Module Track Filter */}
          <div className="relative w-full sm:w-48">
            <select
              id="invoice-track-filter"
              value={trackFilter}
              onChange={(e) => onTrackFilterChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Module Tracks</option>
              <option value="MIN-101">MIN-101 (Old Testament)</option>
              <option value="MIN-102">MIN-102 (New Testament)</option>
              <option value="MIN-201">MIN-201 (Systematic Theology)</option>
              <option value="MIN-202">MIN-202 (Leadership)</option>
              <option value="MIN-301">MIN-301 (Homiletics)</option>
              <option value="MIN-302">MIN-302 (Pneumatology)</option>
            </select>
          </div>
        </div>

        {/* Create Invoice Action Button */}
        <button
          id="create-invoice-btn"
          onClick={onCreateInvoice}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {/* Invoice Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" id="invoices-table">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">Track / Term</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Total Amount</th>
              <th className="px-4 py-3">Paid Amount</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs text-slate-700 dark:text-slate-300">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 dark:text-slate-400">
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 dark:text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No invoices found matching current search or filter criteria.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const total = (inv as any).totalTuition ?? (inv as any).total_amount ?? 0;
                const paid = (inv as any).amountPaid ?? (inv as any).paid_amount ?? 0;
                const balance = (inv as any).outstandingBalance ?? (inv as any).balance ?? Math.max(0, total - paid);

                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white font-mono">
                      {inv.invoice_number || inv.id}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {inv.student_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      <div>{inv.module_track || 'General'}</div>
                      <div className="text-[10px] text-slate-400">{inv.term || 'Spring 2026'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(total)}
                    </td>
                    <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatCurrency(paid)}
                    </td>
                    <td className={`px-4 py-3 font-bold ${balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                      {formatCurrency(balance)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          id={`view-invoice-${inv.id}`}
                          onClick={() => onSelectInvoice(inv)}
                          title="View Invoice Details"
                          className="p-1.5 text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {onRecordPayment && balance > 0 && (
                          <button
                            id={`pay-invoice-${inv.id}`}
                            onClick={() => onRecordPayment(inv)}
                            title="Record Payment"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        {onApplyAdjustment && (
                          <button
                            id={`adjust-invoice-${inv.id}`}
                            onClick={() => onApplyAdjustment(inv)}
                            title="Apply Adjustment / Scholarship"
                            className="p-1.5 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
