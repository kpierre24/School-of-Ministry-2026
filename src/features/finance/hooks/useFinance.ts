import { useMemo, useCallback, useState, useEffect } from 'react';
import { useInvoices } from './useInvoices';
import { usePayments } from './usePayments';
import { FinanceKpiStats } from '../types';
import { fetchFinanceSummaryApi } from '../services/paymentService';

export function useFinance() {
  const invoiceState = useInvoices();
  const paymentState = usePayments();
  const [serverSummary, setServerSummary] = useState<any>(null);

  const reloadAll = useCallback(async () => {
    await Promise.all([
      invoiceState.reloadInvoices(),
      paymentState.reloadData(),
      fetchFinanceSummaryApi().then((data) => data && setServerSummary(data)),
    ]);
  }, [invoiceState.reloadInvoices, paymentState.reloadData]);

  useEffect(() => {
    fetchFinanceSummaryApi().then((data) => data && setServerSummary(data));
  }, []);

  const stats: FinanceKpiStats = useMemo(() => {
    if (serverSummary) {
      const totalBilled = serverSummary.totalBilled || 0;
      const totalCollected = serverSummary.totalCollected || 0;
      const totalOutstanding = serverSummary.totalOutstanding || 0;

      const rate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

      return {
        totalBilled,
        totalCollected,
        totalOutstanding,
        totalScholarshipsDiscounts: 0,
        totalRefunds: 0,
        collectionRatePercentage: rate,
        invoiceCount: invoiceState.invoices.length,
        pendingInvoiceCount: serverSummary.pendingCount || 0,
      };
    }

    // Fallback calculation from client-fetched records
    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let pendingCount = 0;

    invoiceState.invoices.forEach((inv: any) => {
      const amount = inv.totalTuition || inv.total_amount || 0;
      const paid = inv.amountPaid || inv.paid_amount || 0;
      const balance = inv.outstandingBalance ?? inv.balance ?? (amount - paid);

      totalBilled += amount;
      totalCollected += paid;
      totalOutstanding += Math.max(0, balance);
      if (inv.status !== 'paid' && inv.status !== 'Paid') {
        pendingCount += 1;
      }
    });

    const totalRefunds = paymentState.refunds.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalScholarshipsDiscounts = paymentState.adjustments
      .filter((a) => !a.is_charge)
      .reduce((sum, a) => sum + (a.amount || 0), 0);

    const rate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

    return {
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalScholarshipsDiscounts,
      totalRefunds,
      collectionRatePercentage: rate,
      invoiceCount: invoiceState.invoices.length,
      pendingInvoiceCount: pendingCount,
    };
  }, [serverSummary, invoiceState.invoices, paymentState.refunds, paymentState.adjustments]);

  return {
    ...invoiceState,
    ...paymentState,
    stats,
    reloadAll,
  };
}
