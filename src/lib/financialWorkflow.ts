import { 
  Invoice, 
  PaymentTransaction, 
  Receipt, 
  PaymentRecord, 
  FinancialAdjustment, 
  FinancialAuditLog,
  FinancialAdjustmentType
} from '../types';
import { INITIAL_PAYMENTS } from '../components/PaymentTab';

// Storage Keys
const INVOICES_STORAGE_KEY = 'hteim_student_invoices';
const TRANSACTIONS_STORAGE_KEY = 'hteim_student_transactions';
const RECEIPTS_STORAGE_KEY = 'hteim_student_receipts';
const ADJUSTMENTS_STORAGE_KEY = 'hteim_financial_adjustments';
const AUDIT_LOGS_STORAGE_KEY = 'hteim_financial_audit_logs';

/**
 * Loads all invoices from local storage or bootstraps from initial payment records.
 */
export function getInvoices(paymentRecords: PaymentRecord[] = []): Invoice[] {
  const saved = localStorage.getItem(INVOICES_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Error loading invoices from storage', e);
    }
  }

  // Bootstrap initial dataset
  const source = paymentRecords.length > 0 ? paymentRecords : INITIAL_PAYMENTS;
  const bootstrapped = bootstrapFromPaymentRecords(source);
  saveInvoices(bootstrapped.invoices);
  saveTransactions(bootstrapped.transactions);
  saveReceipts(bootstrapped.receipts);
  saveAdjustments(bootstrapped.adjustments);
  return bootstrapped.invoices;
}

export function saveInvoices(invoices: Invoice[]): void {
  localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
}

export function getTransactions(): PaymentTransaction[] {
  const saved = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error('Error loading transactions', e);
    }
  }
  return [];
}

export function saveTransactions(transactions: PaymentTransaction[]): void {
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
}

export function getReceipts(): Receipt[] {
  const saved = localStorage.getItem(RECEIPTS_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error('Error loading receipts', e);
    }
  }
  return [];
}

export function saveReceipts(receipts: Receipt[]): void {
  localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(receipts));
}

export function getAdjustments(): FinancialAdjustment[] {
  const saved = localStorage.getItem(ADJUSTMENTS_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error('Error loading financial adjustments', e);
    }
  }
  return [];
}

export function saveAdjustments(adjustments: FinancialAdjustment[]): void {
  localStorage.setItem(ADJUSTMENTS_STORAGE_KEY, JSON.stringify(adjustments));
}

export function getAuditLogs(): FinancialAuditLog[] {
  const saved = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error('Error loading audit logs', e);
    }
  }
  return [];
}

export function saveAuditLogs(logs: FinancialAuditLog[]): void {
  localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs));
}

export function logFinancialAudit(log: Omit<FinancialAuditLog, 'id' | 'timestamp'>): FinancialAuditLog {
  const logs = getAuditLogs();
  const newLog: FinancialAuditLog = {
    id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...log
  };
  logs.unshift(newLog);
  saveAuditLogs(logs);
  return newLog;
}

/**
 * Core Architectural Engine:
 * Student -> Invoice -> Payment (Transaction) -> Receipt
 * Never sets arbitrary balances directly; always computes from transaction ledger.
 */
export function recordPaymentTransaction(params: {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentReference?: string;
  paymentDate?: string;
  notes?: string;
  recordedBy?: string;
  actorRole?: string;
}): { transaction: PaymentTransaction; receipt: Receipt; updatedInvoice: Invoice } {
  const invoices = getInvoices();
  const transactions = getTransactions();
  const receipts = getReceipts();

  const invoiceIndex = invoices.findIndex(i => i.id === params.invoiceId);
  if (invoiceIndex === -1) {
    throw new Error(`Invoice not found: ${params.invoiceId}`);
  }

  const invoice = invoices[invoiceIndex];
  const paymentDate = params.paymentDate || new Date().toISOString().split('T')[0];
  const cleanNum = (transactions.length + 101).toString().padStart(4, '0');
  
  const transactionId = `TXN-2026-${cleanNum}`;
  const receiptNumber = `RCP-2026-${cleanNum}`;
  const verificationCode = `HTEIM-VERIFY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // 1. Create Transaction
  const newTransaction: PaymentTransaction = {
    id: transactionId,
    invoiceId: invoice.id,
    studentName: invoice.studentName,
    studentId: invoice.studentId,
    amount: Number(params.amount),
    paymentDate,
    paymentMethod: params.paymentMethod,
    paymentReference: params.paymentReference || `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    receiptNumber,
    status: 'Completed',
    notes: params.notes || '',
    recordedBy: params.recordedBy || 'Finance Office',
    reconciliationStatus: 'Unreconciled',
    createdAt: new Date().toISOString()
  };
  transactions.unshift(newTransaction);
  saveTransactions(transactions);

  // 2. Recompute Invoice Financials from all Completed Transactions
  const invoiceTransactions = transactions.filter(
    t => t.invoiceId === invoice.id && t.status === 'Completed'
  );
  const totalPaid = invoiceTransactions.reduce((acc, t) => acc + t.amount, 0);
  const newOutstanding = Math.max(0, invoice.netTuition - totalPaid);

  let updatedStatus: Invoice['status'] = 'Unpaid';
  if (newOutstanding <= 0) {
    updatedStatus = 'Paid';
  } else if (totalPaid > 0) {
    updatedStatus = 'Partially Paid';
  } else if (new Date(invoice.dueDate) < new Date()) {
    updatedStatus = 'Past Due';
  }

  const updatedInvoice: Invoice = {
    ...invoice,
    amountPaid: totalPaid,
    outstandingBalance: newOutstanding,
    status: updatedStatus,
    updatedAt: new Date().toISOString()
  };
  invoices[invoiceIndex] = updatedInvoice;
  saveInvoices(invoices);

  // 3. Generate Official Receipt
  const newReceipt: Receipt = {
    id: `REC-2026-${cleanNum}`,
    receiptNumber,
    paymentId: newTransaction.id,
    invoiceId: invoice.id,
    studentName: invoice.studentName,
    studentId: invoice.studentId,
    amountPaid: newTransaction.amount,
    paymentDate,
    paymentMethod: newTransaction.paymentMethod,
    paymentReference: newTransaction.paymentReference,
    issuedAt: new Date().toISOString(),
    issuedBy: params.recordedBy || 'Bursar & Finance Office',
    academicTerm: invoice.term || '2026 Semester 1',
    courseOrModule: invoice.moduleTrack,
    totalTuitionBilled: invoice.totalTuition,
    discountsAndScholarships: (invoice.discounts || 0) + (invoice.scholarships || 0),
    balanceRemaining: newOutstanding,
    verificationCode,
    notes: params.notes || 'Institutional Official Tuition Receipt'
  };
  receipts.unshift(newReceipt);
  saveReceipts(receipts);

  // 4. Audit Log
  logFinancialAudit({
    action: 'PAYMENT_RECORDED',
    actorName: params.recordedBy || 'Finance Admin',
    actorRole: params.actorRole || 'admin',
    studentId: invoice.studentId,
    studentName: invoice.studentName,
    entityId: newTransaction.id,
    entityType: 'transaction',
    amount: newTransaction.amount,
    details: `Posted payment of $${newTransaction.amount} via ${newTransaction.paymentMethod} (Receipt: ${receiptNumber}, Ref: ${newTransaction.paymentReference}) for invoice ${invoice.id}. Remaining balance: $${newOutstanding}.`
  });

  return { transaction: newTransaction, receipt: newReceipt, updatedInvoice };
}

/**
 * Apply a financial adjustment (Discount, Scholarship, Refund, Fee Adjustment)
 */
export function applyFinancialAdjustment(params: {
  invoiceId: string;
  type: FinancialAdjustmentType;
  categoryName: string;
  amount: number;
  authorizedBy: string;
  actorRole?: string;
  notes?: string;
  receiptOrDocRef?: string;
}): { adjustment: FinancialAdjustment; updatedInvoice: Invoice } {
  const invoices = getInvoices();
  const adjustments = getAdjustments();
  const transactions = getTransactions();

  const invoiceIndex = invoices.findIndex(i => i.id === params.invoiceId);
  if (invoiceIndex === -1) {
    throw new Error(`Invoice not found: ${params.invoiceId}`);
  }

  const invoice = invoices[invoiceIndex];
  const adjId = `ADJ-2026-${(adjustments.length + 101).toString().padStart(4, '0')}`;

  const newAdjustment: FinancialAdjustment = {
    id: adjId,
    invoiceId: invoice.id,
    studentId: invoice.studentId,
    studentName: invoice.studentName,
    type: params.type,
    categoryName: params.categoryName,
    amount: Number(params.amount),
    appliedDate: new Date().toISOString().split('T')[0],
    authorizedBy: params.authorizedBy,
    notes: params.notes || '',
    receiptOrDocRef: params.receiptOrDocRef
  };

  adjustments.unshift(newAdjustment);
  saveAdjustments(adjustments);

  // Recalculate invoice discounts, scholarships, refunds, adjustments
  const invoiceAdjustments = adjustments.filter(a => a.invoiceId === invoice.id);
  let totalDiscounts = 0;
  let totalScholarships = 0;
  let totalRefunds = 0;
  let totalOtherAdjustments = 0;

  invoiceAdjustments.forEach(adj => {
    if (adj.type === 'discount' || adj.type === 'fee_waiver') {
      totalDiscounts += adj.amount;
    } else if (adj.type === 'scholarship') {
      totalScholarships += adj.amount;
    } else if (adj.type === 'refund') {
      totalRefunds += adj.amount;
    } else if (adj.type === 'adjustment' || adj.type === 'late_fee') {
      totalOtherAdjustments += adj.amount;
    }
  });

  // Net tuition formula: totalTuition - discounts - scholarships - otherAdjustments + refunds
  const netTuition = Math.max(0, invoice.totalTuition - totalDiscounts - totalScholarships - totalOtherAdjustments + totalRefunds);
  
  // Re-verify transactions
  const totalPaid = transactions
    .filter(t => t.invoiceId === invoice.id && t.status === 'Completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const outstandingBalance = Math.max(0, netTuition - totalPaid);

  let updatedStatus: Invoice['status'] = 'Unpaid';
  if (outstandingBalance <= 0) {
    updatedStatus = 'Paid';
  } else if (totalPaid > 0) {
    updatedStatus = 'Partially Paid';
  } else if (new Date(invoice.dueDate) < new Date()) {
    updatedStatus = 'Past Due';
  }

  const updatedInvoice: Invoice = {
    ...invoice,
    discounts: totalDiscounts,
    scholarships: totalScholarships,
    refunds: totalRefunds,
    adjustments: totalOtherAdjustments,
    netTuition,
    amountPaid: totalPaid,
    outstandingBalance,
    status: updatedStatus,
    updatedAt: new Date().toISOString()
  };

  invoices[invoiceIndex] = updatedInvoice;
  saveInvoices(invoices);

  // Audit
  logFinancialAudit({
    action: params.type === 'scholarship' ? 'SCHOLARSHIP_AWARDED' : params.type === 'refund' ? 'REFUND_ISSUED' : 'ADJUSTMENT_APPLIED',
    actorName: params.authorizedBy,
    actorRole: params.actorRole || 'admin',
    studentId: invoice.studentId,
    studentName: invoice.studentName,
    entityId: newAdjustment.id,
    entityType: 'adjustment',
    amount: newAdjustment.amount,
    details: `Applied ${params.type.toUpperCase()} of $${newAdjustment.amount} (${params.categoryName}) to Invoice ${invoice.id}. Net tuition adjusted to $${netTuition}, balance $${outstandingBalance}.`
  });

  return { adjustment: newAdjustment, updatedInvoice };
}

/**
 * Reconcile a transaction with bank or gateway record
 */
export function reconcilePayment(params: {
  transactionId: string;
  status: 'Reconciled' | 'Discrepancy' | 'Unreconciled';
  depositBatchId?: string;
  reconciledBy: string;
  notes?: string;
}): PaymentTransaction {
  const transactions = getTransactions();
  const txIndex = transactions.findIndex(t => t.id === params.transactionId);
  if (txIndex === -1) {
    throw new Error(`Transaction not found: ${params.transactionId}`);
  }

  const tx = transactions[txIndex];
  const updatedTx: PaymentTransaction = {
    ...tx,
    reconciliationStatus: params.status,
    depositBatchId: params.depositBatchId || tx.depositBatchId,
    reconciledBy: params.reconciledBy,
    reconciledAt: new Date().toISOString(),
    notes: params.notes ? `${tx.notes ? tx.notes + ' | ' : ''}Reconciliation Note: ${params.notes}` : tx.notes
  };

  transactions[txIndex] = updatedTx;
  saveTransactions(transactions);

  logFinancialAudit({
    action: 'PAYMENT_RECONCILED',
    actorName: params.reconciledBy,
    actorRole: 'finance_admin',
    studentId: tx.studentId,
    studentName: tx.studentName,
    entityId: tx.id,
    entityType: 'transaction',
    amount: tx.amount,
    details: `Updated reconciliation status to ${params.status} for Transaction ${tx.id} (Deposit Batch: ${params.depositBatchId || 'N/A'}).`
  });

  return updatedTx;
}

/**
 * Computes complete Student Financial Profile
 */
export function calculateStudentFinancialProfile(studentName: string) {
  const norm = (studentName || '').toLowerCase().trim();
  const allInvoices = getInvoices();
  const allTransactions = getTransactions();
  const allReceipts = getReceipts();
  const allAdjustments = getAdjustments();

  const studentInvoices = allInvoices.filter(
    i => (i.studentName || '').toLowerCase().trim() === norm
  );
  const studentTransactions = allTransactions.filter(
    t => (t.studentName || '').toLowerCase().trim() === norm
  );
  const studentReceipts = allReceipts.filter(
    r => (r.studentName || '').toLowerCase().trim() === norm
  );
  const studentAdjustments = allAdjustments.filter(
    a => (a.studentName || '').toLowerCase().trim() === norm
  );

  const totalTuition = studentInvoices.reduce((acc, i) => acc + (i.totalTuition || 0), 0);
  const discounts = studentInvoices.reduce((acc, i) => acc + (i.discounts || 0), 0);
  const scholarships = studentInvoices.reduce((acc, i) => acc + (i.scholarships || 0), 0);
  const refunds = studentInvoices.reduce((acc, i) => acc + (i.refunds || 0), 0);
  const netTuition = studentInvoices.reduce((acc, i) => acc + (i.netTuition || 0), 0);
  const amountPaid = studentTransactions
    .filter(t => t.status === 'Completed')
    .reduce((acc, t) => acc + t.amount, 0);
  const outstandingBalance = Math.max(0, netTuition - amountPaid);

  return {
    studentName,
    totalTuition,
    discounts,
    scholarships,
    refunds,
    netTuition,
    amountPaid,
    outstandingBalance,
    invoices: studentInvoices,
    transactions: studentTransactions,
    receipts: studentReceipts,
    adjustments: studentAdjustments
  };
}

/**
 * Bootstrap normalized financial model from initial records
 */
export function bootstrapFromPaymentRecords(records: PaymentRecord[]): {
  invoices: Invoice[];
  transactions: PaymentTransaction[];
  receipts: Receipt[];
  adjustments: FinancialAdjustment[];
} {
  const invoices: Invoice[] = [];
  const transactions: PaymentTransaction[] = [];
  const receipts: Receipt[] = [];
  const adjustments: FinancialAdjustment[] = [];

  records.forEach((p, idx) => {
    const cleanId = (p.id ? p.id.replace('pay-sheet-', '') : (idx + 1).toString()).trim();
    const cleanNum = (idx + 1).toString().padStart(4, '0');
    const invoiceId = `INV-2026-${cleanNum}`;
    const studentId = p.studentId || `HTEIM-2026-${cleanNum}`;

    let scholarships = 0;
    let discounts = 0;
    const notesLower = (p.notes || '').toLowerCase();
    const isScholarship = p.paymentMethod === 'Scholarship' || notesLower.includes('scholarship') || notesLower.includes('financial aid');

    if (isScholarship) {
      scholarships = p.totalTuition;
      adjustments.push({
        id: `ADJ-2026-${cleanNum}`,
        invoiceId,
        studentId,
        studentName: p.studentName,
        type: 'scholarship',
        categoryName: 'Five-Fold Ministry Full Tuition Grant',
        amount: p.totalTuition,
        appliedDate: '2026-01-15',
        authorizedBy: 'Apostolic Council',
        notes: 'Full institutional scholarship award'
      });
    } else if (notesLower.includes('discount')) {
      discounts = Math.max(0, p.totalTuition - p.amountPaid);
      if (discounts > 0) {
        adjustments.push({
          id: `ADJ-2026-${cleanNum}`,
          invoiceId,
          studentId,
          studentName: p.studentName,
          type: 'discount',
          categoryName: 'Early Bird Ministry Registration Discount',
          amount: discounts,
          appliedDate: '2026-01-15',
          authorizedBy: 'Admissions Office',
          notes: 'Standard curriculum incentive discount'
        });
      }
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

    const invoice: Invoice = {
      id: invoiceId,
      studentId,
      studentName: p.studentName,
      email: p.email,
      phone: p.phone,
      moduleTrack: p.moduleTrack || 'School of Ministry Core Modules',
      term: '2026 Semester 1',
      academicYear: '2026-2027',
      issueDate: '2026-01-15',
      dueDate: '2026-05-15',
      totalTuition: p.totalTuition || 1200,
      discounts,
      scholarships,
      refunds: 0,
      adjustments: 0,
      netTuition,
      amountPaid,
      outstandingBalance,
      paymentPlan: p.paymentPlan || (amountPaid === p.totalTuition ? 'Pay In Full' : 'Monthly Installments'),
      status,
      notes: p.notes,
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-04-15T00:00:00Z'
    };
    invoices.push(invoice);

    if (amountPaid > 0) {
      const transactionId = `TXN-2026-${cleanNum}`;
      const receiptNumber = p.receiptNumber || `RCP-2026-${cleanNum}`;
      const paymentDate = p.lastPaymentDate && p.lastPaymentDate !== 'N/A' ? formatBootstrapDate(p.lastPaymentDate) : '2026-04-08';

      const transaction: PaymentTransaction = {
        id: transactionId,
        invoiceId: invoice.id,
        studentName: p.studentName,
        studentId: invoice.studentId,
        amount: amountPaid,
        paymentDate,
        paymentMethod: p.paymentMethod || 'Bank Transfer',
        paymentReference: `REF-BOS-${cleanNum}`,
        receiptNumber,
        status: 'Completed',
        notes: p.notes || 'Invoiced registration payment',
        recordedBy: 'Finance Bursar',
        reconciliationStatus: 'Reconciled',
        reconciledAt: paymentDate,
        reconciledBy: 'Pastor John Selkridge (Bursar)',
        createdAt: `${paymentDate}T12:00:00Z`
      };
      transactions.push(transaction);

      const receipt: Receipt = {
        id: `REC-2026-${cleanNum}`,
        receiptNumber,
        paymentId: transaction.id,
        invoiceId: invoice.id,
        studentName: p.studentName,
        studentId: invoice.studentId,
        amountPaid,
        paymentDate,
        paymentMethod: transaction.paymentMethod,
        paymentReference: transaction.paymentReference,
        issuedAt: `${paymentDate}T12:00:00Z`,
        issuedBy: 'HTEIM Bursar & Finance Office',
        academicTerm: '2026 Semester 1',
        courseOrModule: invoice.moduleTrack,
        totalTuitionBilled: invoice.totalTuition,
        discountsAndScholarships: discounts + scholarships,
        balanceRemaining: outstandingBalance,
        verificationCode: `HTEIM-VERIFY-${cleanNum}`,
        notes: 'Official Institutional Tuition Receipt'
      };
      receipts.push(receipt);
    }
  });

  return { invoices, transactions, receipts, adjustments };
}

function formatBootstrapDate(dateStr: string): string {
  if (!dateStr || dateStr === 'N/A') return '2026-04-15';
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  return '2026-04-15';
}

/**
 * CSV Exporters
 */
export function exportInvoicesToCSV(): void {
  const invoices = getInvoices();
  const headers = ['Invoice ID', 'Student Name', 'Student ID', 'Module Track', 'Term', 'Issue Date', 'Due Date', 'Total Tuition', 'Discounts', 'Scholarships', 'Refunds', 'Net Tuition', 'Amount Paid', 'Outstanding Balance', 'Status'];
  const rows = invoices.map(i => [
    i.id,
    `"${i.studentName.replace(/"/g, '""')}"`,
    i.studentId,
    `"${i.moduleTrack.replace(/"/g, '""')}"`,
    i.term || '2026 Semester 1',
    i.issueDate,
    i.dueDate,
    i.totalTuition,
    i.discounts,
    i.scholarships,
    i.refunds || 0,
    i.netTuition,
    i.amountPaid,
    i.outstandingBalance,
    i.status
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `HTEIM_Invoices_Report_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

export function exportTransactionsToCSV(): void {
  const transactions = getTransactions();
  const headers = ['Transaction ID', 'Invoice ID', 'Student Name', 'Student ID', 'Amount', 'Payment Date', 'Payment Method', 'Payment Reference', 'Receipt Number', 'Status', 'Reconciliation Status', 'Recorded By'];
  const rows = transactions.map(t => [
    t.id,
    t.invoiceId,
    `"${t.studentName.replace(/"/g, '""')}"`,
    t.studentId,
    t.amount,
    t.paymentDate,
    t.paymentMethod,
    t.paymentReference || '',
    t.receiptNumber,
    t.status,
    t.reconciliationStatus || 'Unreconciled',
    t.recordedBy || 'Finance Office'
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `HTEIM_Transactions_Ledger_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

export function exportAuditLogsToCSV(): void {
  const logs = getAuditLogs();
  const headers = ['Audit ID', 'Timestamp', 'Action', 'Actor Name', 'Actor Role', 'Student Name', 'Entity Type', 'Entity ID', 'Amount', 'Details'];
  const rows = logs.map(l => [
    l.id,
    l.timestamp,
    l.action,
    l.actorName,
    l.actorRole,
    `"${l.studentName.replace(/"/g, '""')}"`,
    l.entityType,
    l.entityId,
    l.amount || 0,
    `"${l.details.replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `HTEIM_Financial_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

function downloadBlob(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
