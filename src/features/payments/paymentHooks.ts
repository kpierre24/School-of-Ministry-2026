import { useState, useEffect, useMemo, useCallback } from 'react';
import { Invoice, PaymentTransaction, Receipt, PaymentRecord } from '../../types';
import { paymentService } from './paymentService';
import { RecordPaymentPayload, PaymentSummaryStats } from './paymentSchemas';
import { toast } from 'sonner';

export function usePayments(initialPaymentRecords?: PaymentRecord[]) {
  const [invoices, setInvoices] = useState<Invoice[]>(() => paymentService.getAllInvoices(initialPaymentRecords));
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => paymentService.getAllTransactions());
  const [receipts, setReceipts] = useState<Receipt[]>(() => paymentService.getAllReceipts());
  const [loading, setLoading] = useState(false);

  const refreshData = useCallback(() => {
    setInvoices(paymentService.getAllInvoices());
    setTransactions(paymentService.getAllTransactions());
    setReceipts(paymentService.getAllReceipts());
  }, []);

  const stats = useMemo<PaymentSummaryStats>(() => {
    return paymentService.calculateStats(invoices, transactions);
  }, [invoices, transactions]);

  const handleRecordPayment = useCallback(async (payload: RecordPaymentPayload) => {
    setLoading(true);
    try {
      const res = await paymentService.recordPayment(payload);
      toast.success(`Payment of $${payload.amount.toFixed(2)} recorded for ${payload.studentName}`);
      refreshData();
      return res;
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshData]);

  return {
    invoices,
    transactions,
    receipts,
    stats,
    loading,
    refreshData,
    recordPayment: handleRecordPayment
  };
}
