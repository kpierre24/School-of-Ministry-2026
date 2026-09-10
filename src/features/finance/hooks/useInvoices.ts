import { useState, useMemo, useCallback, useEffect } from 'react';
import { Invoice, FinanceFilterOptions } from '../types';
import { filterInvoices, fetchInvoicesApi } from '../services/invoiceService';

interface UseInvoicesProps {
  initialInvoices?: Invoice[];
  defaultTrack?: string;
  autoFetch?: boolean;
}

export function useInvoices({
  initialInvoices = [],
  defaultTrack = 'all',
  autoFetch = true,
}: UseInvoicesProps = {}) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState(defaultTrack);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await fetchInvoicesApi();
      if (fetched && fetched.length > 0) {
        setInvoices(fetched);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      reloadInvoices();
    }
  }, [autoFetch, reloadInvoices]);

  const filterOptions: FinanceFilterOptions = useMemo(
    () => ({
      search: searchQuery,
      moduleTrack: selectedTrack,
      status: selectedStatus,
    }),
    [searchQuery, selectedTrack, selectedStatus]
  );

  const filteredInvoices = useMemo(() => {
    return filterInvoices(invoices, filterOptions);
  }, [invoices, filterOptions]);

  const selectedInvoice = useMemo(() => {
    if (!selectedInvoiceId) return null;
    return invoices.find((i) => i.id === selectedInvoiceId || i.invoice_number === selectedInvoiceId) || null;
  }, [invoices, selectedInvoiceId]);

  return {
    invoices,
    setInvoices,
    filteredInvoices,
    selectedInvoice,
    selectedInvoiceId,
    setSelectedInvoiceId,
    searchQuery,
    setSearchQuery,
    selectedTrack,
    setSelectedTrack,
    selectedStatus,
    setSelectedStatus,
    isLoading,
    error,
    reloadInvoices,
  };
}
