import {
  Invoice,
  InvoiceLine,
  Payment,
  PaymentAllocation,
  Refund,
  RefundAllocation,
  FinancialAdjustment,
  FinancialSummary,
  InvoiceInput,
  PaymentInput,
} from '../../types/finance';

export type {
  Invoice,
  InvoiceLine,
  Payment,
  PaymentAllocation,
  Refund,
  RefundAllocation,
  FinancialAdjustment,
  FinancialSummary,
  InvoiceInput,
  PaymentInput,
};

export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export type PaymentMethod = 'stripe' | 'card' | 'bank_transfer' | 'cash' | 'check' | 'scholarship' | 'other';

export interface FinanceFilterOptions {
  search?: string;
  status?: string;
  studentId?: string;
  studentName?: string;
  moduleTrack?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface FinanceKpiStats {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  totalScholarshipsDiscounts: number;
  totalRefunds: number;
  collectionRatePercentage: number;
  invoiceCount: number;
  pendingInvoiceCount: number;
}

export interface AdjustmentInput {
  invoiceId: string;
  studentId?: string;
  studentName: string;
  categoryName: string;
  adjustmentType: string;
  isCharge: boolean;
  amount: number;
  reason: string;
  receiptOrDocRef?: string;
  authorizedBy?: string;
  notes?: string;
}

export interface RefundInput {
  paymentId?: string;
  invoiceId?: string;
  studentId?: string;
  studentName: string;
  amount: number;
  reason: string;
  approvedByUserId?: string;
  notes?: string;
}
