import React from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Award,
  RefreshCw,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { FinanceKpiStats } from '../types';
import { formatCurrency } from '../services/invoiceService';

interface FinancialSummaryProps {
  stats: FinanceKpiStats;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  stats,
  onRefresh,
  isLoading = false,
}) => {
  return (
    <div className="space-y-6" id="finance-summary-component">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Financial Dashboard & Revenue Overview
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Institutional tuition totals, incoming payment collections, and outstanding balances.
          </p>
        </div>

        {onRefresh && (
          <button
            id="refresh-finance-stats-btn"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Records
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div
          id="kpi-card-billed"
          className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Tuition Billed
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(stats.totalBilled)}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{stats.invoiceCount} Active Invoices</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {stats.pendingInvoiceCount} Pending
              </span>
            </div>
          </div>
        </div>

        {/* Total Collected */}
        <div
          id="kpi-card-collected"
          className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Collected
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(stats.totalCollected)}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Net Revenue Realized</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {stats.collectionRatePercentage}% Rate
              </span>
            </div>
          </div>
        </div>

        {/* Total Outstanding */}
        <div
          id="kpi-card-outstanding"
          className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Outstanding Balance
            </span>
            <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(stats.totalOutstanding)}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Unpaid & Past Due</span>
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                Due from Students
              </span>
            </div>
          </div>
        </div>

        {/* Scholarships & Adjustments */}
        <div
          id="kpi-card-scholarships"
          className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Scholarships & Grants
            </span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(stats.totalScholarshipsDiscounts)}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Institutional Aid</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                Approved Waivers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar for Collection Rate */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Institutional Collection Progress Rate
          </span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {stats.collectionRatePercentage}% Realized ({formatCurrency(stats.totalCollected)} of {formatCurrency(stats.totalBilled)})
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, stats.collectionRatePercentage))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
