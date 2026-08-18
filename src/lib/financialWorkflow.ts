import { Invoice, PaymentTransaction, Receipt, PaymentRecord } from '../types';
import { INITIAL_PAYMENTS } from '../components/PaymentTab';

/**
 * Loads all invoices from local storage, or bootstraps them from PaymentRecords.
 */
export function getInvoices(paymentRecords: PaymentRecord[] = []): Invoice[] {
  const saved = localStorage.getItem('hteim_student_invoices');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }

  // Bootstrap from PaymentRecords
  const source = paymentRecords.length > 0 ? paymentRecords : INITIAL_PAYMENTS;
  const bootstrapped = bootstrapFromPaymentRecords(source);
  saveInvoices(bootstrapped.invoices);
  saveTransactions(bootstrapped.transactions);
  saveReceipts(bootstrapped.receipts);
  return bootstrapped.invoices;
}

/**
 * Saves invoices to local storage.
 */
export function saveInvoices(invoices: Invoice[]): void {
  localStorage.setItem('hteim_student_invoices', JSON.stringify(invoices));
}

/**
 * Loads all payment transactions.
 */
export function getTransactions(): PaymentTransaction[] {
  const saved = localStorage.getItem('hteim_student_transactions');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }
  return [];
}

/**
 * Saves payment transactions.
 */
export function saveTransactions(transactions: PaymentTransaction[]): void {
  localStorage.setItem('hteim_student_transactions', JSON.stringify(transactions));
}

/**
 * Loads all receipts.
 */
export function getReceipts(): Receipt[] {
  const saved = localStorage.getItem('hteim_student_receipts');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }
  return [];
}

/**
 * Saves receipts to local storage.
 */
export function saveReceipts(receipts: Receipt[]): void {
  localStorage.setItem('hteim_student_receipts', JSON.stringify(receipts));
}

/**
 * Bootstraps normalized invoices, transactions, and receipts from flat PaymentRecords.
 */
export function bootstrapFromPaymentRecords(records: PaymentRecord[]): {
  invoices: Invoice[];
  transactions: PaymentTransaction[];
  receipts: Receipt[];
} {
  const invoices: Invoice[] = [];
  const transactions: PaymentTransaction[] = [];
  const receipts: Receipt[] = [];

  records.forEach((p) => {
    // Determine scholarships vs discounts from payment method and notes
    let scholarships = 0;
    let discounts = 0;
    const notesLower = (p.notes || '').toLowerCase();
    const isScholarship = p.paymentMethod === 'Scholarship' || notesLower.includes('scholarship') || notesLower.includes('financial aid');
    
    if (isScholarship) {
      scholarships = p.totalTuition; // Set full scholarship
    } else if (notesLower.includes('discount')) {
      discounts = p.totalTuition - p.amountPaid; // Infer a discount
    }

    const netTuition = Math.max(0, p.totalTuition - discounts - scholarships);
    const amountPaid = isScholarship ? 0 : p.amountPaid;
    const outstandingBalance = Math.max(0, netTuition - amountPaid);

    let status: Invoice['status'] = 'Unpaid';
    if (outstandingBalance <= 0) {
      status = 'Paid';
    } else if (amountPaid > 0) {
      status = 'Partially Paid';
    } else if (p.status === 'Past Due') {
      status = 'Past Due';
    }

    const cleanId = p.id.replace('pay-sheet-', '');
    const invoiceId = `INV-2026-${cleanId.padStart(4, '0')}`;

    // 1. Create Invoice
    const invoice: Invoice = {
      id: invoiceId,
      studentId: p.studentId || `STU-2026-${cleanId}`,
      studentName: p.studentName,
      email: p.email,
      phone: p.phone,
      moduleTrack: p.moduleTrack,
      issueDate: '2026-01-15',
      dueDate: '2026-05-15',
      totalTuition: p.totalTuition,
      discounts,
      scholarships,
      netTuition,
      amountPaid,
      outstandingBalance,
      paymentPlan: p.paymentPlan || (p.amountPaid === p.totalTuition ? 'Pay In Full' : 'Monthly Installments'),
      status,
      notes: p.notes
    };
    invoices.push(invoice);

    // 2. Create Payment Transaction and Receipt if payments were made
    if (amountPaid > 0) {
      const transactionId = `TXN-2026-${cleanId.padStart(4, '0')}`;
      const receiptNumber = p.receiptNumber || `REC-2026-${cleanId.padStart(4, '0')}`;
      const paymentDate = p.lastPaymentDate && p.lastPaymentDate !== 'N/A' ? formatBootstrapDate(p.lastPaymentDate) : '2026-04-15';

      const transaction: PaymentTransaction = {
        id: transactionId,
        invoiceId: invoice.id,
        studentName: p.studentName,
        studentId: invoice.studentId,
        amount: amountPaid,
        paymentDate,
        paymentMethod: p.paymentMethod || 'Bank Transfer',
        receiptNumber,
        status: 'Completed',
        notes: p.notes || 'Invoiced registration payment'
      };
      transactions.push(transaction);

      const receipt: Receipt = {
        id: `REC-2026-${cleanId.padStart(4, '0')}`,
        receiptNumber,
        paymentId: transaction.id,
        invoiceId: invoice.id,
        studentName: p.studentName,
        studentId: invoice.studentId,
        amountPaid,
        paymentDate,
        paymentMethod: transaction.paymentMethod,
        issuedAt: paymentDate,
        notes: 'Official academic receipt'
      };
      receipts.push(receipt);
    }
  });

  return { invoices, transactions, receipts };
}

function formatBootstrapDate(dateStr: string): string {
  if (!dateStr || dateStr === 'N/A') return '2026-04-15';
  
  // Try mapping some typical formats
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${year}-${month}-${day}`;
    }
  }

  // default back
  return '2026-04-15';
}
