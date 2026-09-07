/**
 * ============================================================================
 * PAYMENT SERVICE
 * HTEIM School of Ministry
 * ============================================================================
 * Handles student tuition fees, receipts, invoices, installments, and
 * balance calculations. Communicates authoritatively with Express API (/api/payments).
 */

import { apiClient, ApiClientError } from './apiClient';
import { PaymentRecord } from '../types';
import { isDemoPayment, isDemoUser } from '../data/guards';

export interface PaymentSummaryResponse {
  totalPayments: number;
  totalCollected: number;
  pendingCount: number;
  currency: string;
}

export interface PaymentsResponse {
  payments: PaymentRecord[];
  total: number;
}

export interface InvoicesResponse {
  invoices: any[];
  total: number;
}

export interface RecordPaymentPayload {
  studentName: string;
  amount: number;
  date?: string;
  paymentMethod?: string;
  paymentPlan?: string;
  receiptNumber?: string;
  notes?: string;
  verified?: boolean;
  userEmail?: string;
}

export interface CreateInvoicePayload {
  id?: string;
  studentName: string;
  totalTuition: number;
  dueDate?: string;
  discounts?: number;
  scholarships?: number;
  moduleTrack?: string;
  term?: string;
  paymentPlan?: string;
  userEmail?: string;
}

export interface FinancialAdjustmentPayload {
  studentName: string;
  type: 'discount' | 'scholarship' | 'refund' | 'adjustment' | 'fee_waiver' | 'late_fee';
  amount: number;
  reason: string;
  approvedBy?: string;
  userEmail?: string;
}

export class PaymentService {
  /**
   * Retrieves authoritative payment transaction records.
   */
  public async getPayments(studentName?: string, userEmail?: string): Promise<PaymentsResponse> {
    const params: Record<string, any> = {};
    if (studentName) params.studentName = studentName.trim();
    if (userEmail) params.userEmail = userEmail;

    const res = await apiClient.get<PaymentsResponse>('/payments', params);
    const filtered = (res.payments || []).filter(p => !isDemoPayment(p));
    return {
      payments: filtered,
      total: filtered.length,
    };
  }

  /**
   * Records a verified tuition payment transaction.
   */
  public async recordPayment(
    payload: RecordPaymentPayload
  ): Promise<{ status: string; payment: PaymentRecord }> {
    const cleanName = payload.studentName?.trim();
    if (!cleanName) {
      throw new ApiClientError('Student name is required for payment', 400, '/payments', 'validation');
    }

    if (typeof payload.amount !== 'number' || isNaN(payload.amount) || payload.amount <= 0) {
      throw new ApiClientError('Payment amount must be a positive number', 400, '/payments', 'validation');
    }

    if (isDemoUser(cleanName)) {
      throw new ApiClientError('Demo payment transactions cannot be saved to authoritative database', 403, '/payments', 'unauthorized');
    }

    return apiClient.post<{ status: string; payment: PaymentRecord }>('/payments', {
      payment: {
        id: `PMT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        studentName: cleanName,
        amount: payload.amount,
        date: payload.date || new Date().toISOString().split('T')[0],
        paymentMethod: payload.paymentMethod || 'Credit Card / Online',
        paymentPlan: payload.paymentPlan,
        receiptNumber: payload.receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
        notes: payload.notes || '',
        verified: payload.verified ?? true,
      },
      userEmail: payload.userEmail,
    });
  }

  /**
   * Retrieves overarching tuition collection metrics and totals.
   */
  public async getPaymentSummary(userEmail?: string): Promise<PaymentSummaryResponse> {
    const params = userEmail ? { userEmail } : undefined;
    return apiClient.get<PaymentSummaryResponse>('/payments/summary', params);
  }

  /**
   * Retrieves invoices for students or a specific student.
   */
  public async getInvoices(studentName?: string, userEmail?: string): Promise<InvoicesResponse> {
    const params: Record<string, any> = {};
    if (studentName) params.studentName = studentName.trim();
    if (userEmail) params.userEmail = userEmail;

    return apiClient.get<InvoicesResponse>('/payments/invoices', params);
  }

  /**
   * Creates or updates a formal tuition invoice.
   */
  public async createInvoice(
    payload: CreateInvoicePayload
  ): Promise<{ status: string; invoice: any }> {
    const cleanName = payload.studentName?.trim();
    if (!cleanName) {
      throw new ApiClientError('Student name is required to create invoice', 400, '/payments/invoices', 'validation');
    }

    if (typeof payload.totalTuition !== 'number' || isNaN(payload.totalTuition) || payload.totalTuition < 0) {
      throw new ApiClientError('Tuition total must be a valid non-negative number', 400, '/payments/invoices', 'validation');
    }

    return apiClient.post<{ status: string; invoice: any }>('/payments/invoices', {
      invoice: {
        ...payload,
        studentName: cleanName,
      },
      userEmail: payload.userEmail,
    });
  }

  /**
   * Applies financial adjustments (scholarship, discount, refund, fee waiver).
   */
  public async recordAdjustment(
    payload: FinancialAdjustmentPayload
  ): Promise<{ status: string; adjustment: any }> {
    const cleanName = payload.studentName?.trim();
    if (!cleanName) {
      throw new ApiClientError('Student name is required for adjustment', 400, '/payments/adjustments', 'validation');
    }

    if (typeof payload.amount !== 'number' || isNaN(payload.amount) || payload.amount <= 0) {
      throw new ApiClientError('Adjustment amount must be a positive number', 400, '/payments/adjustments', 'validation');
    }

    return apiClient.post<{ status: string; adjustment: any }>('/payments/adjustments', {
      adjustment: {
        ...payload,
        studentName: cleanName,
      },
      userEmail: payload.userEmail,
    });
  }
}

export const paymentService = new PaymentService();
