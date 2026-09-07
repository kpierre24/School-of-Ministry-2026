import React, { useState, useMemo } from 'react';
import { Invoice, PaymentTransaction } from '../../types';
import { Search, ArrowUpDown, Filter, Download, CheckCircle2, Clock, AlertTriangle, XCircle, FileText, Eye, DollarSign } from 'lucide-react';

export interface PaymentTableProps {
  invoices: Invoice[];
  transactions: PaymentTransaction[];
  onSelectStudent?: (studentName: string) => void;
  onRecordPaymentForStudent?: (studentName: string) => void;
  onViewReceipt?: (transactionId: string) => void;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  invoices,
  transactions,
  onSelectStudent,
  onRecordPaymentForStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'studentName' | 'netTuition' | 'amountPaid' | 'balance'>('studentName');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = 
        inv.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.id && inv.id.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const balance = inv.outstandingBalance ?? Math.max(0, (inv.netTuition || inv.totalTuition || 0) - (inv.amountPaid || 0));
      let matchStatus = true;
      if (statusFilter === 'paid') matchStatus = balance <= 0;
      else if (statusFilter === 'partial') matchStatus = (inv.amountPaid || 0) > 0 && balance > 0;
      else if (statusFilter === 'unpaid') matchStatus = (inv.amountPaid || 0) === 0;
      else if (statusFilter === 'overdue') matchStatus = inv.status === 'Past Due' || (balance > 0 && inv.dueDate && new Date(inv.dueDate) < new Date());

      return matchSearch && matchStatus;
    }).sort((a, b) => {
      let aVal: any = a[sortField === 'netTuition' ? 'netTuition' : sortField];
      let bVal: any = b[sortField === 'netTuition' ? 'netTuition' : sortField];
      if (sortField === 'balance') {
        aVal = a.outstandingBalance ?? Math.max(0, (a.netTuition || a.totalTuition || 0) - (a.amountPaid || 0));
        bVal = b.outstandingBalance ?? Math.max(0, (b.netTuition || b.totalTuition || 0) - (b.amountPaid || 0));
      }
      if (typeof aVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
    });
  }, [invoices, searchTerm, statusFilter, sortField, sortAsc]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Search & Filter Toolbar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student or invoice #..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter payment status"
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid in Full</option>
            <option value="partial">Partial Payment</option>
            <option value="unpaid">No Payment</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3.5 cursor-pointer" onClick={() => toggleSort('studentName')}>
                <div className="flex items-center gap-1">
                  <span>Student Name</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th className="p-3.5 cursor-pointer" onClick={() => toggleSort('netTuition')}>
                <div className="flex items-center gap-1">
                  <span>Total Invoiced</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th className="p-3.5 cursor-pointer" onClick={() => toggleSort('amountPaid')}>
                <div className="flex items-center gap-1">
                  <span>Amount Paid</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th className="p-3.5 cursor-pointer" onClick={() => toggleSort('balance')}>
                <div className="flex items-center gap-1">
                  <span>Remaining Balance</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                  No invoice records match the search or filter criteria.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const balance = inv.outstandingBalance ?? Math.max(0, (inv.netTuition || inv.totalTuition || 0) - (inv.amountPaid || 0));
                const isPaid = balance <= 0;
                const isPartial = (inv.amountPaid || 0) > 0 && balance > 0;

                return (
                  <tr key={inv.id || inv.studentName} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <button
                        onClick={() => onSelectStudent?.(inv.studentName)}
                        className="font-black text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-left"
                      >
                        {inv.studentName}
                      </button>
                      <div className="text-[11px] text-slate-400 font-mono">{inv.id || 'INV-2026'}</div>
                    </td>
                    <td className="p-3.5 font-bold font-mono text-slate-700 dark:text-slate-300">
                      ${(inv.netTuition || inv.totalTuition || 0).toFixed(2)}
                    </td>
                    <td className="p-3.5 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      ${(inv.amountPaid || 0).toFixed(2)}
                    </td>
                    <td className="p-3.5 font-bold font-mono">
                      <span className={balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}>
                        ${balance.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Paid Full
                        </span>
                      ) : isPartial ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                          <Clock className="w-3 h-3" /> Partial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                          <AlertTriangle className="w-3 h-3" /> Unpaid
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onRecordPaymentForStudent?.(inv.studentName)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-black transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Record</span>
                        </button>
                        <button
                          onClick={() => onSelectStudent?.(inv.studentName)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Profile</span>
                        </button>
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

