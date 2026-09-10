import { useState, useCallback, useEffect } from 'react';
import {
  Payment,
  FinancialAdjustment,
  Refund,
  PaymentInput,
  AdjustmentInput,
  RefundInput,
} from '../types';
import {
  fetchPaymentsApi,
  recordPaymentApi,
  fetchAdjustmentsApi,
  applyAdjustmentApi,
  fetchRefundsApi,
  recordRefundApi,
} from '../services/paymentService';

interface UsePaymentsProps {
  initialPayments?: Payment[];
  initialAdjustments?: FinancialAdjustment[];
  initialRefunds?: Refund[];
  autoFetch?: boolean;
}

export function usePayments({
  initialPayments = [],
  initialAdjustments = [],
  initialRefunds = [],
  autoFetch = true,
}: UsePaymentsProps = {}) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [adjustments, setAdjustments] = useState<FinancialAdjustment[]>(initialAdjustments);
  const [refunds, setRefunds] = useState<Refund[]>(initialRefunds);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pmts, adjs, rfds] = await Promise.all([
        fetchPaymentsApi(),
        fetchAdjustmentsApi(),
        fetchRefundsApi(),
      ]);

      if (pmts && pmts.length > 0) setPayments(pmts);
      if (adjs && adjs.length > 0) setAdjustments(adjs);
      if (rfds && rfds.length > 0) setRefunds(rfds);
    } catch (err: any) {
      setError(err.message || 'Failed to load financial transaction records');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      reloadData();
    }
  }, [autoFetch, reloadData]);

  const recordPayment = useCallback(
    async (input: PaymentInput): Promise<any> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await recordPaymentApi(input);
        await reloadData();
        return result;
      } catch (err: any) {
        setError(err.message || 'Payment recording failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [reloadData]
  );

  const applyAdjustment = useCallback(
    async (input: AdjustmentInput): Promise<any> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await applyAdjustmentApi(input);
        await reloadData();
        return result;
      } catch (err: any) {
        setError(err.message || 'Adjustment failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [reloadData]
  );

  const recordRefund = useCallback(
    async (input: RefundInput): Promise<any> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await recordRefundApi(input);
        await reloadData();
        return result;
      } catch (err: any) {
        setError(err.message || 'Refund failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [reloadData]
  );

  return {
    payments,
    adjustments,
    refunds,
    recordPayment,
    applyAdjustment,
    recordRefund,
    reloadData,
    isLoading,
    error,
  };
}
