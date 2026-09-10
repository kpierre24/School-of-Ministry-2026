import {
  Payment,
  FinancialAdjustment,
  Refund,
  FinancialSummary,
  PaymentInput,
  AdjustmentInput,
  RefundInput,
  FinanceFilterOptions,
} from '../types';

export async function fetchPaymentsApi(filters: FinanceFilterOptions = {}): Promise<Payment[]> {
  try {
    const params = new URLSearchParams();
    if (filters.studentId) params.append('studentId', filters.studentId);
    if (filters.studentName) params.append('studentName', filters.studentName);

    const res = await fetch(`/api/payments?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch payments: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.payments || data.transactions || [];
  } catch (err) {
    console.warn('API payment fetch warning:', err);
    return [];
  }
}

export async function recordPaymentApi(input: PaymentInput): Promise<any> {
  const res = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment: input }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to record payment: HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchAdjustmentsApi(filters: FinanceFilterOptions = {}): Promise<FinancialAdjustment[]> {
  try {
    const params = new URLSearchParams();
    if (filters.studentId) params.append('studentId', filters.studentId);

    const res = await fetch(`/api/payments/adjustments?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch adjustments: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.adjustments || [];
  } catch (err) {
    console.warn('API adjustments fetch warning:', err);
    return [];
  }
}

export async function applyAdjustmentApi(input: AdjustmentInput): Promise<any> {
  const res = await fetch('/api/payments/adjustments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adjustment: input }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to apply adjustment: HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchRefundsApi(filters: FinanceFilterOptions = {}): Promise<Refund[]> {
  try {
    const params = new URLSearchParams();
    if (filters.studentId) params.append('studentId', filters.studentId);

    const res = await fetch(`/api/payments/refunds?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch refunds: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.refunds || [];
  } catch (err) {
    console.warn('API refunds fetch warning:', err);
    return [];
  }
}

export async function recordRefundApi(input: RefundInput): Promise<any> {
  const res = await fetch('/api/payments/refunds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refund: input }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to record refund: HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchFinanceSummaryApi(): Promise<any> {
  try {
    const res = await fetch('/api/payments/summary');
    if (!res.ok) {
      throw new Error(`Failed to fetch financial summary: HTTP ${res.status}`);
    }
    return res.json();
  } catch (err) {
    console.warn('API finance summary fetch warning:', err);
    return null;
  }
}

export async function getNextSequenceNumberApi(type: 'invoice' | 'payment' | 'receipt', year: string = '2026'): Promise<string> {
  try {
    const res = await fetch(`/api/payments/sequence/next?type=${type}&year=${year}`);
    if (!res.ok) {
      throw new Error(`Failed to generate sequence number: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.sequenceNumber || `${type.toUpperCase().slice(0, 3)}-${year}-000001`;
  } catch (err) {
    return `${type.toUpperCase().slice(0, 3)}-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
  }
}
