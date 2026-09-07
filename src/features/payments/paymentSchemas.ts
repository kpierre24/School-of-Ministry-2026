import { PaymentRecord, Invoice, PaymentTransaction, Receipt, StudentInstallmentPlan, SponsorshipDonation, PaymentMethod } from '../../types';

export interface PaymentSummaryStats {
  totalCollected: number;
  totalOutstanding: number;
  totalInvoiced: number;
  collectionRate: number;
  studentsPaidInFull: number;
  studentsPartial: number;
  studentsOverdue: number;
  studentsNoPayment: number;
  sponsorshipFunds: number;
}

export interface StudentFinancialProfile {
  studentName: string;
  studentEmail?: string;
  totalAssessed: number;
  totalPaid: number;
  balance: number;
  status: 'paid_in_full' | 'partial' | 'overdue' | 'unpaid';
  lastPaymentDate?: string;
  transactions: PaymentTransaction[];
  invoices: Invoice[];
  installmentPlan?: StudentInstallmentPlan;
  sponsorships: SponsorshipDonation[];
}

export interface RecordPaymentPayload {
  studentName: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  receivedBy: string;
  date?: string;
  invoiceId?: string;
}

export const TUITION_FEE_CONSTANTS = {
  STANDARD_FULL_TUITION: 250, // Standard term tuition
  MINIMUM_DOWN_PAYMENT: 50,
  INSTALLMENT_SPLIT_MONTHS: 3,
};
