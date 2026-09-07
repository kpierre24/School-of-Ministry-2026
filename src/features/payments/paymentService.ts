import { 
  Invoice, 
  PaymentTransaction, 
  Receipt, 
  PaymentRecord, 
  StudentInstallmentPlan, 
  SponsorshipDonation 
} from '../../types';
import { 
  getInvoices, 
  saveInvoices, 
  getTransactions, 
  saveTransactions, 
  getReceipts, 
  saveReceipts, 
  recordPaymentTransaction,
  getAuditLogs,
  getAdjustments
} from '../../lib/financialWorkflow';
import { RecordPaymentPayload, PaymentSummaryStats, StudentFinancialProfile } from './paymentSchemas';

export class PaymentService {
  /**
   * Calculate complete cohort financial metrics
   */
  public calculateStats(invoices: Invoice[], transactions: PaymentTransaction[]): PaymentSummaryStats {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let paidInFull = 0;
    let partial = 0;
    let overdue = 0;
    let noPayment = 0;

    for (const inv of invoices) {
      totalInvoiced += inv.netTuition || inv.totalTuition || 0;
      totalCollected += inv.amountPaid || 0;

      const bal = inv.outstandingBalance ?? Math.max(0, (inv.netTuition || inv.totalTuition || 0) - (inv.amountPaid || 0));
      if (bal <= 0) {
        paidInFull++;
      } else if (inv.amountPaid > 0) {
        partial++;
      } else {
        noPayment++;
      }

      if (inv.status === 'Past Due' || (bal > 0 && inv.dueDate && new Date(inv.dueDate) < new Date())) {
        overdue++;
      }
    }

    const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

    return {
      totalCollected,
      totalOutstanding: Math.max(0, totalInvoiced - totalCollected),
      totalInvoiced,
      collectionRate,
      studentsPaidInFull: paidInFull,
      studentsPartial: partial,
      studentsOverdue: overdue,
      studentsNoPayment: noPayment,
      sponsorshipFunds: 0,
    };
  }

  /**
   * Retrieve or build student financial profile
   */
  public getStudentProfile(studentName: string, invoices: Invoice[], transactions: PaymentTransaction[]): StudentFinancialProfile {
    const studentInvoices = invoices.filter(i => i.studentName.toLowerCase().trim() === studentName.toLowerCase().trim());
    const studentTx = transactions.filter(t => t.studentName.toLowerCase().trim() === studentName.toLowerCase().trim());

    const totalAssessed = studentInvoices.reduce((acc, i) => acc + (i.netTuition || i.totalTuition || 0), 0);
    const totalPaid = studentTx.reduce((acc, t) => acc + (t.amount || 0), 0);
    const balance = Math.max(0, totalAssessed - totalPaid);

    let status: StudentFinancialProfile['status'] = 'unpaid';
    if (balance <= 0 && totalAssessed > 0) {
      status = 'paid_in_full';
    } else if (totalPaid > 0) {
      status = 'partial';
    }

    return {
      studentName,
      totalAssessed,
      totalPaid,
      balance,
      status,
      transactions: studentTx,
      invoices: studentInvoices,
      sponsorships: []
    };
  }

  /**
   * Records a manual payment transaction
   */
  public async recordPayment(payload: RecordPaymentPayload): Promise<{ transaction: PaymentTransaction; receipt?: Receipt }> {
    let targetInvoiceId = payload.invoiceId;

    if (!targetInvoiceId) {
      const allInvoices = getInvoices();
      const studentInv = allInvoices.find(
        i => i.studentName.toLowerCase().trim() === payload.studentName.toLowerCase().trim()
      );
      if (studentInv) {
        targetInvoiceId = studentInv.id;
      } else {
        throw new Error(`No active invoice found for student: ${payload.studentName}`);
      }
    }

    const res = recordPaymentTransaction({
      invoiceId: targetInvoiceId,
      amount: payload.amount,
      paymentMethod: payload.method,
      paymentReference: payload.referenceNumber,
      notes: payload.notes,
      recordedBy: payload.receivedBy,
      paymentDate: payload.date
    });

    return { transaction: res.transaction, receipt: res.receipt };
  }

  public getAllInvoices(paymentRecords?: PaymentRecord[]): Invoice[] {
    return getInvoices(paymentRecords);
  }

  public getAllTransactions(): PaymentTransaction[] {
    return getTransactions();
  }

  public getAllReceipts(): Receipt[] {
    return getReceipts();
  }
}

export const paymentService = new PaymentService();

