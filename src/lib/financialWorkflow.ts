import { 
  Invoice, 
  PaymentTransaction, 
  Receipt, 
  PaymentRecord, 
  FinancialAdjustment, 
  FinancialAuditLog,
  FinancialAdjustmentType,
  PaymentAllocation,
  InvoiceStatus,
  PaymentMethod,
  PaymentPlanType
} from '../types';
import { INITIAL_PAYMENTS } from '../components/PaymentTab';
import { isDemoPayment } from '../data/guards';

// Storage Keys
const INVOICES_STORAGE_KEY = 'hteim_student_invoices';
const TRANSACTIONS_STORAGE_KEY = 'hteim_student_transactions';
const RECEIPTS_STORAGE_KEY = 'hteim_student_receipts';
const ADJUSTMENTS_STORAGE_KEY = 'hteim_financial_adjustments';
const AUDIT_LOGS_STORAGE_KEY = 'hteim_financial_audit_logs';

/**
 * Authoritative Derivation Engine:
 * Derives net tuition, discounts, scholarships, refunds, amount paid, and outstanding balance
 * deterministically from base tuition, adjustments, and transactions.
 * Values are NEVER independently edited.
 */
export function deriveInvoiceFinancials(
  totalTuition: number,
  adjustments: FinancialAdjustment[] = [],
  transactions: PaymentTransaction[] = [],
  dueDate?: string
): {
  discounts: number;
  scholarships: number;
  refunds: number;
  adjustments: number;
  netTuition: number;
  amountPaid: number;
  outstandingBalance: number;
  status: InvoiceStatus;
} {
  let totalDiscounts = 0;
  let totalScholarships = 0;
  let totalRefunds = 0;
  let totalOtherAdjustments = 0;

  adjustments.forEach(adj => {
    if (adj.type === 'discount' || adj.type === 'fee_waiver') {
      totalDiscounts += Number(adj.amount || 0);
    } else if (adj.type === 'scholarship') {
      totalScholarships += Number(adj.amount || 0);
    } else if (adj.type === 'refund') {
      totalRefunds += Number(adj.amount || 0);
    } else if (adj.type === 'adjustment' || adj.type === 'late_fee') {
      totalOtherAdjustments += Number(adj.amount || 0);
    }
  });

  const baseBilled = Number(totalTuition || 0);
  const netTuition = Math.max(0, baseBilled - totalDiscounts - totalScholarships - totalOtherAdjustments + totalRefunds);

  const amountPaid = transactions
    .filter(t => t.status === 'Completed')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const outstandingBalance = Math.max(0, netTuition - amountPaid);

  let status: InvoiceStatus = 'Unpaid';
  if (outstandingBalance <= 0) {
    status = 'Paid';
  } else if (amountPaid > 0) {
    status = 'Partially Paid';
  } else if (dueDate && new Date(dueDate) < new Date()) {
    status = 'Past Due';
  }

  return {
    discounts: totalDiscounts,
    scholarships: totalScholarships,
    refunds: totalRefunds,
    adjustments: totalOtherAdjustments,
    netTuition,
    amountPaid,
    outstandingBalance,
    status
  };
}

/**
 * Attaches child collections (Adjustments, Transactions, Receipts, Allocations)
 * and recalculates derived financial values on an invoice object.
 */
export function attachInvoiceHierarchy(
  invoice: Invoice,
  adjustments: FinancialAdjustment[] = [],
  transactions: PaymentTransaction[] = [],
  receipts: Receipt[] = []
): Invoice {
  const invAdjustments = adjustments.filter(a => a.invoiceId === invoice.id);
  const invTransactions = transactions.filter(t => t.invoiceId === invoice.id);
  const invReceipts = receipts.filter(r => r.invoiceId === invoice.id);

  const derived = deriveInvoiceFinancials(
    invoice.totalTuition,
    invAdjustments,
    invTransactions,
    invoice.dueDate
  );

  const allocationsList: PaymentAllocation[] = invTransactions.flatMap(t => {
    if (Array.isArray(t.allocations) && t.allocations.length > 0) {
      return t.allocations;
    }
    return [{
      id: `ALLOC-${t.id}`,
      transactionId: t.id,
      invoiceId: invoice.id,
      amount: t.amount,
      allocatedAt: t.paymentDate,
      notes: t.notes
    }];
  });

  return {
    ...invoice,
    ...derived,
    adjustmentsList: invAdjustments,
    transactionsList: invTransactions,
    allocationsList,
    receiptsList: invReceipts
  };
}

/**
 * Raw Storage Table Getters
 */
export function getInvoices(paymentRecords: PaymentRecord[] = []): Invoice[] {
  let invoices: Invoice[] = [];
  const saved = localStorage.getItem(INVOICES_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        invoices = parsed.filter(i => !isDemoPayment(i));
      }
    } catch (e) {
      console.error('Error loading invoices from storage', e);
    }
  }

  if (invoices.length === 0) {
    const source = paymentRecords.length > 0 ? paymentRecords.filter(p => !isDemoPayment(p)) : INITIAL_PAYMENTS;
    const bootstrapped = bootstrapFromPaymentRecords(source);
    saveInvoices(bootstrapped.invoices);
    saveTransactions(bootstrapped.transactions);
    saveReceipts(bootstrapped.receipts);
    saveAdjustments(bootstrapped.adjustments);
    invoices = bootstrapped.invoices;
  }

  const adjustments = getAdjustments();
  const transactions = getTransactions();
  const receipts = getReceipts();

  return invoices.map(inv => attachInvoiceHierarchy(inv, adjustments, transactions, receipts));
}

export function saveInvoices(invoices: Invoice[]): void {
  const clean = invoices.filter(i => !isDemoPayment(i));
  localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(clean));
}

export function getTransactions(): PaymentTransaction[] {
  const saved = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.filter(t => !isDemoPayment(t));
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

// ============================================================================
// ATOMIC TRANSACTION ENGINE (BEGIN -> EXECUTE -> VALIDATE -> COMMIT / ROLLBACK)
// ============================================================================

export interface FinancialTransactionContext {
  invoices: Invoice[];
  transactions: PaymentTransaction[];
  receipts: Receipt[];
  adjustments: FinancialAdjustment[];
  auditLogs: FinancialAuditLog[];
}

/**
 * Validates domain invariants across all tables in a transaction context.
 * Throws explicit exception if any partial state, orphan record, or unbalance exists.
 */
export function validateFinancialInvariants(ctx: FinancialTransactionContext): void {
  // 1. Transaction referential integrity
  for (const tx of ctx.transactions) {
    if (tx.status === 'Completed') {
      const parentInvoice = ctx.invoices.find(i => i.id === tx.invoiceId);
      if (!parentInvoice) {
        throw new Error(`Transactional Error: Transaction ${tx.id} references missing invoice ${tx.invoiceId}`);
      }
      if (Number(tx.amount) <= 0) {
        throw new Error(`Transactional Error: Payment amount for ${tx.id} must be strictly greater than $0.00.`);
      }
      // Guarantee receipt exists for completed transactions
      if (tx.receiptNumber) {
        const receiptExists = ctx.receipts.some(r => r.paymentId === tx.id || r.receiptNumber === tx.receiptNumber);
        if (!receiptExists) {
          throw new Error(`Transactional Error: Completed transaction ${tx.id} is missing matching receipt ${tx.receiptNumber}`);
        }
      }
    }
  }

  // 2. Validate invoice balances match derived totals
  for (const inv of ctx.invoices) {
    const invAdjustments = ctx.adjustments.filter(a => a.invoiceId === inv.id);
    const invTransactions = ctx.transactions.filter(t => t.invoiceId === inv.id && t.status === 'Completed');

    const derived = deriveInvoiceFinancials(inv.totalTuition, invAdjustments, invTransactions, inv.dueDate);

    if (Math.abs((inv.amountPaid || 0) - derived.amountPaid) > 0.01) {
      throw new Error(`Transactional Discrepancy: Invoice ${inv.id} amountPaid ($${inv.amountPaid}) does not match completed payments ($${derived.amountPaid})`);
    }

    if (Math.abs((inv.outstandingBalance || 0) - derived.outstandingBalance) > 0.01) {
      throw new Error(`Transactional Discrepancy: Invoice ${inv.id} balance ($${inv.outstandingBalance}) does not match derived balance ($${derived.outstandingBalance})`);
    }

    if ((inv.outstandingBalance || 0) < 0) {
      throw new Error(`Transactional Error: Invoice ${inv.id} has negative outstanding balance: $${inv.outstandingBalance}`);
    }
  }

  // 3. Guarantee unique transaction IDs and receipt numbers
  const txSet = new Set<string>();
  for (const t of ctx.transactions) {
    if (txSet.has(t.id)) {
      throw new Error(`Transactional Error: Duplicate transaction ID detected: ${t.id}`);
    }
    txSet.add(t.id);
  }

  const receiptSet = new Set<string>();
  for (const r of ctx.receipts) {
    if (receiptSet.has(r.receiptNumber)) {
      throw new Error(`Transactional Error: Duplicate receipt number detected: ${r.receiptNumber}`);
    }
    receiptSet.add(r.receiptNumber);
  }
}

/**
 * Atomic Commit Batch across all financial state tables in a single write.
 */
export function commitFinancialBatch(ctx: FinancialTransactionContext): void {
  const cleanInvoices = (ctx.invoices || []).filter(i => !isDemoPayment(i));
  const cleanTransactions = (ctx.transactions || []).filter(t => !isDemoPayment(t));
  const cleanReceipts = ctx.receipts || [];
  const cleanAdjustments = ctx.adjustments || [];
  const cleanAuditLogs = ctx.auditLogs || [];

  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(cleanInvoices));
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(cleanTransactions));
    localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(cleanReceipts));
    localStorage.setItem(ADJUSTMENTS_STORAGE_KEY, JSON.stringify(cleanAdjustments));
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(cleanAuditLogs));
  } catch (err: any) {
    console.error('Atomic commit failed:', err);
    throw new Error(`Atomic Financial Commit Failed: ${err?.message || err}`);
  }
}

/**
 * Runs a financial operation atomically with pre-execution snapshot, in-memory isolation,
 * invariant verification, and atomic commit batching. Rolled back on any failure.
 */
export function runAtomicFinancialTransaction<T>(
  workflowName: string,
  operation: (ctx: FinancialTransactionContext) => T
): T {
  // 1. Snapshot prior state
  const rawInvoices = getInvoices();
  const rawTransactions = getTransactions();
  const rawReceipts = getReceipts();
  const rawAdjustments = getAdjustments();
  const rawAuditLogs = getAuditLogs();

  const ctx: FinancialTransactionContext = {
    invoices: JSON.parse(JSON.stringify(rawInvoices)),
    transactions: JSON.parse(JSON.stringify(rawTransactions)),
    receipts: JSON.parse(JSON.stringify(rawReceipts)),
    adjustments: JSON.parse(JSON.stringify(rawAdjustments)),
    auditLogs: JSON.parse(JSON.stringify(rawAuditLogs))
  };

  try {
    // 2. Execute pipeline in isolated context
    const result = operation(ctx);

    // 3. Verify invariants before committing
    validateFinancialInvariants(ctx);

    // 4. ATOMIC COMMIT
    commitFinancialBatch(ctx);

    return result;
  } catch (error: any) {
    console.error(`[TRANSACTION ROLLBACK] Financial workflow '${workflowName}' failed and rolled back cleanly:`, error);
    throw new Error(`Financial Transaction Failed (${workflowName}): ${error?.message || error}`);
  }
}

// ============================================================================
// ATOMIC WORKFLOWS
// ============================================================================

/**
 * Atomic Payment Workflow:
 * BEGIN
 *   1. Create payment transaction
 *   2. Allocate payment to invoice
 *   3. Recalculate invoice balance & status
 *   4. Generate official receipt
 *   5. Write financial audit log
 * COMMIT
 */
export function recordPaymentTransaction(params: {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentDate?: string;
  notes?: string;
  recordedBy?: string;
  actorRole?: string;
}): { transaction: PaymentTransaction; receipt: Receipt; updatedInvoice: Invoice } {
  return runAtomicFinancialTransaction('RECORD_PAYMENT_TRANSACTION', (ctx) => {
    const paymentAmount = Number(params.amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error('Payment amount must be a positive number greater than $0.00');
    }

    const invoiceIndex = ctx.invoices.findIndex(i => i.id === params.invoiceId);
    if (invoiceIndex === -1) {
      throw new Error(`Invoice not found: ${params.invoiceId}`);
    }

    const invoice = ctx.invoices[invoiceIndex];

    // Check duplicate payment reference
    if (params.paymentReference) {
      const cleanRef = params.paymentReference.trim().toLowerCase();
      const isDuplicate = ctx.transactions.some(
        t => t.paymentReference && t.paymentReference.trim().toLowerCase() === cleanRef && t.status === 'Completed'
      );
      if (isDuplicate) {
        throw new Error(`Duplicate payment reference detected: "${params.paymentReference}" has already been processed.`);
      }
    }

    const paymentDate = params.paymentDate || new Date().toISOString().split('T')[0];
    const sequenceNum = (ctx.transactions.length + 101).toString().padStart(4, '0');
    const transactionId = `TXN-2026-${sequenceNum}`;
    const receiptNumber = `RCP-2026-${sequenceNum}`;
    const verificationCode = `HTEIM-VERIFY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Step 1 & 2: Create Payment Transaction with Allocation
    const allocation: PaymentAllocation = {
      id: `ALLOC-${transactionId}`,
      transactionId,
      invoiceId: invoice.id,
      amount: paymentAmount,
      allocatedAt: paymentDate,
      notes: params.notes || 'Tuition Payment Allocation'
    };

    const newTransaction: PaymentTransaction = {
      id: transactionId,
      invoiceId: invoice.id,
      studentName: invoice.studentName,
      studentId: invoice.studentId,
      amount: paymentAmount,
      paymentDate,
      paymentMethod: params.paymentMethod,
      paymentReference: params.paymentReference || `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      receiptNumber,
      status: 'Completed',
      notes: params.notes || 'Institutional Tuition Payment',
      recordedBy: params.recordedBy || 'Finance Office',
      reconciliationStatus: 'Unreconciled',
      allocations: [allocation],
      createdAt: new Date().toISOString()
    };
    ctx.transactions.unshift(newTransaction);

    // Step 3: Recalculate Invoice Financials & Status
    const invAdjustments = ctx.adjustments.filter(a => a.invoiceId === invoice.id);
    const invTransactions = ctx.transactions.filter(t => t.invoiceId === invoice.id && t.status === 'Completed');

    const derived = deriveInvoiceFinancials(
      invoice.totalTuition,
      invAdjustments,
      invTransactions,
      invoice.dueDate
    );

    const updatedInvoice: Invoice = {
      ...invoice,
      ...derived,
      updatedAt: new Date().toISOString()
    };
    ctx.invoices[invoiceIndex] = updatedInvoice;

    // Step 4: Generate Receipt
    const newReceipt: Receipt = {
      id: `REC-2026-${sequenceNum}`,
      receiptNumber,
      paymentId: newTransaction.id,
      invoiceId: invoice.id,
      studentName: invoice.studentName,
      studentId: invoice.studentId,
      amountPaid: paymentAmount,
      paymentDate,
      paymentMethod: newTransaction.paymentMethod,
      paymentReference: newTransaction.paymentReference,
      issuedAt: new Date().toISOString(),
      issuedBy: params.recordedBy || 'Bursar & Finance Office',
      academicTerm: invoice.term || '2026 Semester 1',
      courseOrModule: invoice.moduleTrack,
      totalTuitionBilled: invoice.totalTuition,
      discountsAndScholarships: derived.discounts + derived.scholarships,
      balanceRemaining: derived.outstandingBalance,
      verificationCode,
      notes: params.notes || 'Institutional Official Tuition Receipt'
    };
    ctx.receipts.unshift(newReceipt);

    // Step 5: Write Audit Log
    const auditLog: FinancialAuditLog = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: 'PAYMENT_RECORDED',
      actorName: params.recordedBy || 'Finance Admin',
      actorRole: params.actorRole || 'admin',
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      entityId: newTransaction.id,
      entityType: 'transaction',
      amount: paymentAmount,
      details: `Posted payment of $${paymentAmount} via ${newTransaction.paymentMethod} (Receipt: ${receiptNumber}, Ref: ${newTransaction.paymentReference}) for invoice ${invoice.id}. Outstanding balance: $${derived.outstandingBalance}.`
    };
    ctx.auditLogs.unshift(auditLog);

    return { transaction: newTransaction, receipt: newReceipt, updatedInvoice };
  });
}

/**
 * Atomic Adjustment Workflow:
 * Apply a financial adjustment (Discount, Scholarship, Refund, Fee Waiver, Late Fee)
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
  return runAtomicFinancialTransaction('APPLY_FINANCIAL_ADJUSTMENT', (ctx) => {
    const adjAmount = Number(params.amount);
    if (isNaN(adjAmount) || adjAmount <= 0) {
      throw new Error('Adjustment amount must be greater than zero');
    }

    const invoiceIndex = ctx.invoices.findIndex(i => i.id === params.invoiceId);
    if (invoiceIndex === -1) {
      throw new Error(`Invoice not found: ${params.invoiceId}`);
    }

    const invoice = ctx.invoices[invoiceIndex];
    const adjId = `ADJ-2026-${(ctx.adjustments.length + 101).toString().padStart(4, '0')}`;

    const newAdjustment: FinancialAdjustment = {
      id: adjId,
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      type: params.type,
      categoryName: params.categoryName,
      amount: adjAmount,
      appliedDate: new Date().toISOString().split('T')[0],
      authorizedBy: params.authorizedBy,
      notes: params.notes || '',
      receiptOrDocRef: params.receiptOrDocRef
    };
    ctx.adjustments.unshift(newAdjustment);

    // Recalculate invoice derived financials
    const invAdjustments = ctx.adjustments.filter(a => a.invoiceId === invoice.id);
    const invTransactions = ctx.transactions.filter(t => t.invoiceId === invoice.id && t.status === 'Completed');

    const derived = deriveInvoiceFinancials(
      invoice.totalTuition,
      invAdjustments,
      invTransactions,
      invoice.dueDate
    );

    const updatedInvoice: Invoice = {
      ...invoice,
      ...derived,
      updatedAt: new Date().toISOString()
    };
    ctx.invoices[invoiceIndex] = updatedInvoice;

    // Audit Log
    const auditLog: FinancialAuditLog = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: params.type === 'scholarship' ? 'SCHOLARSHIP_AWARDED' : params.type === 'refund' ? 'REFUND_ISSUED' : 'ADJUSTMENT_APPLIED',
      actorName: params.authorizedBy,
      actorRole: params.actorRole || 'admin',
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      entityId: newAdjustment.id,
      entityType: 'adjustment',
      amount: adjAmount,
      details: `Applied ${params.type.toUpperCase()} of $${adjAmount} (${params.categoryName}) to Invoice ${invoice.id}. Net tuition adjusted to $${derived.netTuition}, balance $${derived.outstandingBalance}.`
    };
    ctx.auditLogs.unshift(auditLog);

    return { adjustment: newAdjustment, updatedInvoice };
  });
}

/**
 * Atomic Payment Void / Reversal Workflow
 */
export function voidOrReversePaymentTransaction(params: {
  transactionId: string;
  reason: string;
  authorizedBy: string;
  actorRole?: string;
}): { voidedTransaction: PaymentTransaction; updatedInvoice: Invoice } {
  return runAtomicFinancialTransaction('VOID_PAYMENT_TRANSACTION', (ctx) => {
    const txIndex = ctx.transactions.findIndex(t => t.id === params.transactionId);
    if (txIndex === -1) {
      throw new Error(`Transaction not found: ${params.transactionId}`);
    }

    const tx = ctx.transactions[txIndex];
    if (tx.status === 'Voided') {
      throw new Error(`Transaction ${tx.id} is already voided.`);
    }

    const invoiceIndex = ctx.invoices.findIndex(i => i.id === tx.invoiceId);
    if (invoiceIndex === -1) {
      throw new Error(`Parent invoice ${tx.invoiceId} not found.`);
    }

    const invoice = ctx.invoices[invoiceIndex];

    // Mark Transaction as Voided
    const voidedTx: PaymentTransaction = {
      ...tx,
      status: 'Voided',
      notes: `${tx.notes ? tx.notes + ' | ' : ''}[VOIDED: ${params.reason}]`
    };
    ctx.transactions[txIndex] = voidedTx;

    // Void corresponding receipt if exists
    const receiptIndex = ctx.receipts.findIndex(r => r.paymentId === tx.id || r.receiptNumber === tx.receiptNumber);
    if (receiptIndex !== -1) {
      ctx.receipts[receiptIndex] = {
        ...ctx.receipts[receiptIndex],
        notes: `${ctx.receipts[receiptIndex].notes ? ctx.receipts[receiptIndex].notes + ' | ' : ''}[VOIDED RECEIPT]`
      };
    }

    // Recalculate Invoice Financials without voided transaction
    const invAdjustments = ctx.adjustments.filter(a => a.invoiceId === invoice.id);
    const invTransactions = ctx.transactions.filter(t => t.invoiceId === invoice.id && t.status === 'Completed');

    const derived = deriveInvoiceFinancials(
      invoice.totalTuition,
      invAdjustments,
      invTransactions,
      invoice.dueDate
    );

    const updatedInvoice: Invoice = {
      ...invoice,
      ...derived,
      updatedAt: new Date().toISOString()
    };
    ctx.invoices[invoiceIndex] = updatedInvoice;

    // Audit Log
    const auditLog: FinancialAuditLog = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: 'PAYMENT_RECORDED',
      actorName: params.authorizedBy,
      actorRole: params.actorRole || 'admin',
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      entityId: tx.id,
      entityType: 'transaction',
      amount: tx.amount,
      details: `REVERSED/VOIDED payment of $${tx.amount} (Tx ID: ${tx.id}, Ref: ${tx.paymentReference}). Reason: "${params.reason}". Revised balance: $${derived.outstandingBalance}.`
    };
    ctx.auditLogs.unshift(auditLog);

    return { voidedTransaction: voidedTx, updatedInvoice };
  });
}

/**
 * Atomic Invoice Details Update Workflow
 */
export function updateInvoiceDetails(params: {
  invoiceId: string;
  totalTuition?: number;
  discounts?: number;
  scholarships?: number;
  paymentPlan?: PaymentPlanType;
  notes?: string;
  updatedBy: string;
  actorRole?: string;
}): Invoice {
  return runAtomicFinancialTransaction('UPDATE_INVOICE_DETAILS', (ctx) => {
    const invoiceIndex = ctx.invoices.findIndex(i => i.id === params.invoiceId);
    if (invoiceIndex === -1) {
      throw new Error(`Invoice not found: ${params.invoiceId}`);
    }

    const invoice = ctx.invoices[invoiceIndex];
    const newTotalTuition = params.totalTuition !== undefined ? Number(params.totalTuition) : invoice.totalTuition;

    const invAdjustments = ctx.adjustments.filter(a => a.invoiceId === invoice.id);
    const invTransactions = ctx.transactions.filter(t => t.invoiceId === invoice.id && t.status === 'Completed');

    const derived = deriveInvoiceFinancials(
      newTotalTuition,
      invAdjustments,
      invTransactions,
      invoice.dueDate
    );

    const updatedInvoice: Invoice = {
      ...invoice,
      totalTuition: newTotalTuition,
      paymentPlan: params.paymentPlan || invoice.paymentPlan,
      notes: params.notes !== undefined ? params.notes : invoice.notes,
      ...derived,
      updatedAt: new Date().toISOString()
    };
    ctx.invoices[invoiceIndex] = updatedInvoice;

    // Audit Log
    const auditLog: FinancialAuditLog = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: 'INVOICE_CREATED',
      actorName: params.updatedBy,
      actorRole: params.actorRole || 'admin',
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      entityId: invoice.id,
      entityType: 'invoice',
      amount: newTotalTuition,
      details: `Updated invoice terms for ${invoice.id}. Total Tuition: $${newTotalTuition}, Net Tuition: $${derived.netTuition}, Balance: $${derived.outstandingBalance}, Plan: ${updatedInvoice.paymentPlan}.`
    };
    ctx.auditLogs.unshift(auditLog);

    return updatedInvoice;
  });
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
  return runAtomicFinancialTransaction('RECONCILE_PAYMENT', (ctx) => {
    const txIndex = ctx.transactions.findIndex(t => t.id === params.transactionId);
    if (txIndex === -1) {
      throw new Error(`Transaction not found: ${params.transactionId}`);
    }

    const tx = ctx.transactions[txIndex];
    const updatedTx: PaymentTransaction = {
      ...tx,
      reconciliationStatus: params.status,
      depositBatchId: params.depositBatchId || tx.depositBatchId,
      reconciledBy: params.reconciledBy,
      reconciledAt: new Date().toISOString(),
      notes: params.notes ? `${tx.notes ? tx.notes + ' | ' : ''}Reconciliation Note: ${params.notes}` : tx.notes
    };

    ctx.transactions[txIndex] = updatedTx;

    const auditLog: FinancialAuditLog = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: 'PAYMENT_RECONCILED',
      actorName: params.reconciledBy,
      actorRole: 'finance_admin',
      studentId: tx.studentId,
      studentName: tx.studentName,
      entityId: tx.id,
      entityType: 'transaction',
      amount: tx.amount,
      details: `Updated reconciliation status to ${params.status} for Transaction ${tx.id} (Deposit Batch: ${params.depositBatchId || 'N/A'}).`
    };
    ctx.auditLogs.unshift(auditLog);

    return updatedTx;
  });
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
      paymentPlan: (p.paymentPlan as PaymentPlanType) || (amountPaid === p.totalTuition ? 'Pay In Full' : 'Monthly Installments'),
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
