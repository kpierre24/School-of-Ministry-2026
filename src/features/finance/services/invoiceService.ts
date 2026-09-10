import { Invoice, InvoiceInput, FinanceFilterOptions } from '../types';

/**
 * Normalizes status strings for display and filtering.
 */
export function normalizeInvoiceStatus(status: string = ''): string {
  const s = status.toLowerCase().trim();
  if (s === 'paid') return 'paid';
  if (s.includes('partial')) return 'partially_paid';
  if (s.includes('overdue') || s.includes('past')) return 'overdue';
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('draft')) return 'draft';
  return 'issued';
}

/**
 * Format currency nicely.
 */
export function formatCurrency(amount: number = 0, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Filter invoice records on client side.
 */
export function filterInvoices(
  invoices: Invoice[] = [],
  filters: FinanceFilterOptions = {}
): Invoice[] {
  const { search = '', status = '', studentId, studentName, moduleTrack } = filters;

  return invoices.filter((inv) => {
    if (studentId && inv.student_id && inv.student_id !== studentId) return false;

    if (studentName) {
      const target = studentName.toLowerCase().trim();
      const name = (inv.student_name || '').toLowerCase().trim();
      if (!name.includes(target)) return false;
    }

    if (moduleTrack && moduleTrack !== 'all') {
      if ((inv.module_track || '').toLowerCase() !== moduleTrack.toLowerCase()) return false;
    }

    if (status && status !== 'all') {
      const normStatus = normalizeInvoiceStatus(inv.status);
      const targetStatus = normalizeInvoiceStatus(status);
      if (normStatus !== targetStatus) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchNumber = (inv.invoice_number || '').toLowerCase().includes(q);
      const matchName = (inv.student_name || '').toLowerCase().includes(q);
      const matchTrack = (inv.module_track || '').toLowerCase().includes(q);
      const matchNotes = (inv.notes || '').toLowerCase().includes(q);
      if (!matchNumber && !matchName && !matchTrack && !matchNotes) return false;
    }

    return true;
  });
}

// ==========================================
// API Operations
// ==========================================

export async function fetchInvoicesApi(filters: FinanceFilterOptions = {}): Promise<Invoice[]> {
  try {
    const params = new URLSearchParams();
    if (filters.studentId) params.append('studentId', filters.studentId);
    if (filters.studentName) params.append('studentName', filters.studentName);

    const res = await fetch(`/api/invoices?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch invoices: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.invoices || [];
  } catch (err) {
    console.warn('API invoice fetch warning, using fallback state:', err);
    return [];
  }
}

export async function fetchInvoiceByIdApi(id: string): Promise<Invoice | null> {
  try {
    const res = await fetch(`/api/invoices/${encodeURIComponent(id)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch invoice ${id}`);
    }
    const data = await res.json();
    return data.invoice || null;
  } catch (err) {
    console.warn(`API fetch invoice ${id} failed:`, err);
    return null;
  }
}

export async function createOrUpdateInvoiceApi(input: InvoiceInput): Promise<any> {
  const isUpdate = Boolean(input.id);
  const url = isUpdate ? `/api/invoices/${encodeURIComponent(input.id!)}` : '/api/invoices';
  const method = isUpdate ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice: input }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to ${isUpdate ? 'update' : 'create'} invoice: HTTP ${res.status}`);
  }

  return res.json();
}
