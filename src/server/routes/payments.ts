import { Router, Request, Response } from "express";
import { getAuthoritativeState, saveAuthoritativeState, logAuditEvent } from "../services/supabaseServer";
import { requireAuth, requirePermission, requireResourceOwnership } from "../middleware/rbac";
import { roleHasPermission } from "../../types/rbac";
import { logger } from "../../lib/logger";
import { isDemoPayment } from "../../data/guards";

export const paymentsRouter = Router();

/**
 * Helper to ensure state has financial sub-collections with strict exclusion of demo payments
 */
function getFinancialState(state: any) {
  return {
    invoices: (state?.invoices || []).filter((i: any) => !isDemoPayment(i)),
    transactions: (state?.transactions || state?.payments || []).filter((t: any) => !isDemoPayment(t)),
    receipts: (state?.receipts || []).filter((r: any) => !isDemoPayment(r)),
    adjustments: (state?.adjustments || []).filter((a: any) => !isDemoPayment(a)),
    auditLogs: state?.auditLogs || []
  };
}

/**
 * GET /api/payments/invoices
 * Retrieves invoices, optionally filtered by studentName.
 * RBAC: Students can only view their own invoices.
 */
paymentsRouter.get("/invoices", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const userEmail = user?.email || (req.query.userEmail as string) || undefined;
    let studentName = (req.query.studentName as string) || undefined;
    const state = await getAuthoritativeState(userEmail);
    const fin = getFinancialState(state);

    let invoices = fin.invoices;

    // RBAC: If student without finance:view_all permission, restrict to own invoices
    if (user && user.role === "student" && !roleHasPermission(user.role, "finance:view_all")) {
      const ownName = user.studentName || user.name || user.email.split("@")[0];
      studentName = ownName;
    }

    if (studentName) {
      const norm = studentName.toLowerCase().trim();
      invoices = invoices.filter((i: any) => (i.studentName || "").toLowerCase().trim() === norm);
    }

    return res.status(200).json({
      invoices,
      total: invoices.length,
      updatedAt: state?.updatedAt || new Date().toISOString()
    });
  } catch (err: any) {
    logger.error("GET /api/payments/invoices error:", err);
    return res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

/**
 * POST /api/payments/invoices
 * Creates or updates an institutional tuition invoice
 * RBAC: Only super_admin, admin, finance_officer
 */
paymentsRouter.post(
  "/invoices",
  requireAuth,
  requirePermission(["finance:record_payment", "finance:adjustments", "all:access"]),
  async (req: Request, res: Response) => {
  try {
    const { invoice } = req.body;
    const actorEmail = req.user?.email || "finance";
    if (!invoice || !invoice.studentName || !invoice.totalTuition) {
      return res.status(400).json({ error: "studentName and totalTuition are required" });
    }

    const state = (await getAuthoritativeState(actorEmail)) || {};
    const fin = getFinancialState(state);
    const invoices = [...fin.invoices];

    const cleanNum = (invoices.length + 101).toString().padStart(4, '0');
    const invoiceId = invoice.id || `INV-2026-${cleanNum}`;

    const discounts = Number(invoice.discounts || 0);
    const scholarships = Number(invoice.scholarships || 0);
    const refunds = Number(invoice.refunds || 0);
    const adjustments = Number(invoice.adjustments || 0);
    const totalTuition = Number(invoice.totalTuition);
    const netTuition = Math.max(0, totalTuition - discounts - scholarships - adjustments + refunds);
    const amountPaid = Number(invoice.amountPaid || 0);
    const outstandingBalance = Math.max(0, netTuition - amountPaid);

    let status = invoice.status || 'Unpaid';
    if (outstandingBalance <= 0) {
      status = 'Paid';
    } else if (amountPaid > 0) {
      status = 'Partially Paid';
    }

    const newInvoice = {
      id: invoiceId,
      studentId: invoice.studentId || `HTEIM-2026-${cleanNum}`,
      studentName: invoice.studentName.trim(),
      email: invoice.email || '',
      phone: invoice.phone || '',
      moduleTrack: invoice.moduleTrack || 'Core Ministry Curriculum',
      term: invoice.term || '2026 Semester 1',
      academicYear: invoice.academicYear || '2026-2027',
      issueDate: invoice.issueDate || new Date().toISOString().split('T')[0],
      dueDate: invoice.dueDate || '2026-05-15',
      totalTuition,
      discounts,
      scholarships,
      refunds,
      adjustments,
      netTuition,
      amountPaid,
      outstandingBalance,
      paymentPlan: invoice.paymentPlan || 'Monthly Installments',
      status,
      notes: invoice.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingIdx = invoices.findIndex((i: any) => i.id === invoiceId);
    if (existingIdx >= 0) {
      invoices[existingIdx] = newInvoice;
    } else {
      invoices.unshift(newInvoice);
    }

    const updatedState = {
      ...state,
      invoices,
      updatedAt: new Date().toISOString(),
      updatedBy: actorEmail
    };

    await saveAuthoritativeState(
      updatedState,
      actorEmail,
      `Created/Updated tuition invoice ${newInvoice.id} for ${newInvoice.studentName}`
    );

    return res.status(201).json({ status: "saved", invoice: newInvoice });
  } catch (err: any) {
    logger.error("POST /api/payments/invoices error:", err);
    return res.status(500).json({ error: "Failed to create invoice" });
  }
});

/**
 * GET /api/payments/transactions
 * Retrieves payment transactions
 * RBAC: Students only retrieve their own transactions.
 */
paymentsRouter.get("/transactions", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const userEmail = user?.email || (req.query.userEmail as string) || undefined;
    const invoiceId = (req.query.invoiceId as string) || undefined;
    let studentName = (req.query.studentName as string) || undefined;
    const state = await getAuthoritativeState(userEmail);
    const fin = getFinancialState(state);

    let transactions = fin.transactions;

    // RBAC: If student lacking finance:view_all, restrict to own transactions
    if (user && user.role === "student" && !roleHasPermission(user.role, "finance:view_all")) {
      const ownName = user.studentName || user.name || user.email.split("@")[0];
      studentName = ownName;
    }

    if (invoiceId) {
      transactions = transactions.filter((t: any) => t.invoiceId === invoiceId);
    }
    if (studentName) {
      const norm = studentName.toLowerCase().trim();
      transactions = transactions.filter((t: any) => (t.studentName || "").toLowerCase().trim() === norm);
    }

    return res.status(200).json({
      transactions,
      total: transactions.length
    });
  } catch (err: any) {
    logger.error("GET /api/payments/transactions error:", err);
    return res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

/**
 * POST /api/payments/transactions
 * Architectural Core: Records transaction -> generates official receipt -> recomputes invoice paid & balance strictly from transactions
 * RBAC: super_admin, admin, finance_officer
 */
paymentsRouter.post(
  "/transactions",
  requireAuth,
  requirePermission(["finance:record_payment", "all:access"]),
  async (req: Request, res: Response) => {
  try {
    const { transaction } = req.body;
    const actorEmail = req.user?.email || "finance";
    if (!transaction || !transaction.invoiceId || !transaction.amount) {
      return res.status(400).json({ error: "invoiceId and amount are required" });
    }

    const state = (await getAuthoritativeState(actorEmail)) || {};
    const fin = getFinancialState(state);
    const invoices = [...fin.invoices];
    const transactions = [...fin.transactions];
    const receipts = [...fin.receipts];

    const invIndex = invoices.findIndex((i: any) => i.id === transaction.invoiceId);
    if (invIndex === -1) {
      return res.status(404).json({ error: "Target invoice not found" });
    }

    const targetInvoice = invoices[invIndex];
    const cleanNum = (transactions.length + 101).toString().padStart(4, '0');
    const transactionId = transaction.id || `TXN-2026-${cleanNum}`;
    const receiptNumber = transaction.receiptNumber || `RCP-2026-${cleanNum}`;
    const paymentDate = transaction.paymentDate || new Date().toISOString().split('T')[0];

    const newTransaction = {
      id: transactionId,
      invoiceId: targetInvoice.id,
      studentName: targetInvoice.studentName,
      studentId: targetInvoice.studentId,
      amount: Number(transaction.amount),
      paymentDate,
      paymentMethod: transaction.paymentMethod || 'Bank Transfer',
      paymentReference: transaction.paymentReference || `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      receiptNumber,
      status: 'Completed',
      notes: transaction.notes || '',
      recordedBy: actorEmail,
      reconciliationStatus: 'Unreconciled',
      createdAt: new Date().toISOString()
    };
    transactions.unshift(newTransaction);

    // Sum transactions for invoice
    const invCompletedTxs = transactions.filter((t: any) => t.invoiceId === targetInvoice.id && t.status === 'Completed');
    const totalPaid = invCompletedTxs.reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
    const newBalance = Math.max(0, targetInvoice.netTuition - totalPaid);

    let updatedStatus = 'Unpaid';
    if (newBalance <= 0) updatedStatus = 'Paid';
    else if (totalPaid > 0) updatedStatus = 'Partially Paid';

    const updatedInvoice = {
      ...targetInvoice,
      amountPaid: totalPaid,
      outstandingBalance: newBalance,
      status: updatedStatus,
      updatedAt: new Date().toISOString()
    };
    invoices[invIndex] = updatedInvoice;

    // Generate Official Receipt
    const newReceipt = {
      id: `REC-2026-${cleanNum}`,
      receiptNumber,
      paymentId: newTransaction.id,
      invoiceId: targetInvoice.id,
      studentName: targetInvoice.studentName,
      studentId: targetInvoice.studentId,
      amountPaid: newTransaction.amount,
      paymentDate,
      paymentMethod: newTransaction.paymentMethod,
      paymentReference: newTransaction.paymentReference,
      issuedAt: new Date().toISOString(),
      issuedBy: actorEmail || 'HTEIM Bursar & Finance Office',
      academicTerm: targetInvoice.term || '2026 Semester 1',
      courseOrModule: targetInvoice.moduleTrack,
      totalTuitionBilled: targetInvoice.totalTuition,
      discountsAndScholarships: (targetInvoice.discounts || 0) + (targetInvoice.scholarships || 0),
      balanceRemaining: newBalance,
      verificationCode: `HTEIM-VERIFY-${cleanNum}`,
      notes: transaction.notes || 'Official Institutional Tuition Receipt'
    };
    receipts.unshift(newReceipt);

    const updatedState = {
      ...state,
      invoices,
      transactions,
      receipts,
      payments: transactions, // maintain backward compatibility
      updatedAt: new Date().toISOString(),
      updatedBy: actorEmail
    };

    await saveAuthoritativeState(
      updatedState,
      actorEmail,
      `Recorded transaction of $${newTransaction.amount} for ${newTransaction.studentName} (Receipt ${receiptNumber})`
    );

    await logAuditEvent({
      actorUserId: actorEmail,
      entityType: "payment_transaction",
      entityId: newTransaction.id,
      action: "create",
      newValues: { transaction: newTransaction, receipt: newReceipt, updatedInvoice }
    });

    return res.status(201).json({
      status: "recorded",
      transaction: newTransaction,
      receipt: newReceipt,
      updatedInvoice
    });
  } catch (err: any) {
    logger.error("POST /api/payments/transactions error:", err);
    return res.status(500).json({ error: "Failed to record payment transaction" });
  }
});

/**
 * GET /api/payments/receipts
 * Retrieves receipts.
 * RBAC: Students only retrieve their own receipts.
 */
paymentsRouter.get("/receipts", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const userEmail = user?.email || (req.query.userEmail as string) || undefined;
    let studentName = (req.query.studentName as string) || undefined;
    const state = await getAuthoritativeState(userEmail);
    const fin = getFinancialState(state);

    let receipts = fin.receipts;

    // RBAC: If student without finance:view_all, restrict to own receipts
    if (user && user.role === "student" && !roleHasPermission(user.role, "finance:view_all")) {
      const ownName = user.studentName || user.name || user.email.split("@")[0];
      studentName = ownName;
    }

    if (studentName) {
      const norm = studentName.toLowerCase().trim();
      receipts = receipts.filter((r: any) => (r.studentName || "").toLowerCase().trim() === norm);
    }

    return res.status(200).json({ receipts, total: receipts.length });
  } catch (err: any) {
    logger.error("GET /api/payments/receipts error:", err);
    return res.status(500).json({ error: "Failed to fetch receipts" });
  }
});

/**
 * POST /api/payments/adjustments
 * Applies a financial adjustment (Discount, Scholarship, Refund, Fee Adjustment)
 * RBAC: super_admin, admin, finance_officer
 */
paymentsRouter.post(
  "/adjustments",
  requireAuth,
  requirePermission(["finance:adjustments", "all:access"]),
  async (req: Request, res: Response) => {
  try {
    const { adjustment } = req.body;
    const actorEmail = req.user?.email || "finance";
    if (!adjustment || !adjustment.invoiceId || !adjustment.amount || !adjustment.type) {
      return res.status(400).json({ error: "invoiceId, amount, and type are required" });
    }

    const state = (await getAuthoritativeState(actorEmail)) || {};
    const fin = getFinancialState(state);
    const invoices = [...fin.invoices];
    const adjustments = [...fin.adjustments];
    const transactions = [...fin.transactions];

    const invIndex = invoices.findIndex((i: any) => i.id === adjustment.invoiceId);
    if (invIndex === -1) {
      return res.status(404).json({ error: "Target invoice not found" });
    }

    const targetInvoice = invoices[invIndex];
    const adjId = `ADJ-2026-${(adjustments.length + 101).toString().padStart(4, '0')}`;

    const newAdjustment = {
      id: adjId,
      invoiceId: targetInvoice.id,
      studentId: targetInvoice.studentId,
      studentName: targetInvoice.studentName,
      type: adjustment.type,
      categoryName: adjustment.categoryName || `${adjustment.type.toUpperCase()} Applied`,
      amount: Number(adjustment.amount),
      appliedDate: adjustment.appliedDate || new Date().toISOString().split('T')[0],
      authorizedBy: adjustment.authorizedBy || actorEmail || 'Bursar',
      notes: adjustment.notes || ''
    };
    adjustments.unshift(newAdjustment);

    // Recompute invoice discounts/scholarships/netTuition
    const invoiceAdjs = adjustments.filter((a: any) => a.invoiceId === targetInvoice.id);
    let discounts = 0;
    let scholarships = 0;
    let refunds = 0;
    let otherAdj = 0;

    invoiceAdjs.forEach((a: any) => {
      if (a.type === 'discount' || a.type === 'fee_waiver') discounts += a.amount;
      else if (a.type === 'scholarship') scholarships += a.amount;
      else if (a.type === 'refund') refunds += a.amount;
      else if (a.type === 'adjustment' || a.type === 'late_fee') otherAdj += a.amount;
    });

    const netTuition = Math.max(0, targetInvoice.totalTuition - discounts - scholarships - otherAdj + refunds);
    const paid = transactions
      .filter((t: any) => t.invoiceId === targetInvoice.id && t.status === 'Completed')
      .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
    const newBalance = Math.max(0, netTuition - paid);

    let status = 'Unpaid';
    if (newBalance <= 0) status = 'Paid';
    else if (paid > 0) status = 'Partially Paid';

    const updatedInvoice = {
      ...targetInvoice,
      discounts,
      scholarships,
      refunds,
      adjustments: otherAdj,
      netTuition,
      amountPaid: paid,
      outstandingBalance: newBalance,
      status,
      updatedAt: new Date().toISOString()
    };
    invoices[invIndex] = updatedInvoice;

    const updatedState = {
      ...state,
      invoices,
      adjustments,
      updatedAt: new Date().toISOString(),
      updatedBy: actorEmail
    };

    await saveAuthoritativeState(
      updatedState,
      actorEmail,
      `Applied ${newAdjustment.type} of $${newAdjustment.amount} to invoice ${targetInvoice.id}`
    );

    return res.status(201).json({
      status: "applied",
      adjustment: newAdjustment,
      updatedInvoice
    });
  } catch (err: any) {
    logger.error("POST /api/payments/adjustments error:", err);
    return res.status(500).json({ error: "Failed to apply financial adjustment" });
  }
});

/**
 * GET /api/payments/summary
 * Returns overall tuition analytics and metrics.
 */
paymentsRouter.get("/summary", async (req: Request, res: Response) => {
  try {
    const userEmail = (req.query.userEmail as string) || undefined;
    const state = await getAuthoritativeState(userEmail);
    const fin = getFinancialState(state);

    const invoices = fin.invoices;
    const transactions = fin.transactions;

    const totalInvoiced = invoices.reduce((acc: number, i: any) => acc + (Number(i.totalTuition) || 0), 0);
    const totalDiscounts = invoices.reduce((acc: number, i: any) => acc + (Number(i.discounts) || 0), 0);
    const totalScholarships = invoices.reduce((acc: number, i: any) => acc + (Number(i.scholarships) || 0), 0);
    const netBilled = invoices.reduce((acc: number, i: any) => acc + (Number(i.netTuition) || 0), 0);
    const totalCollected = transactions
      .filter((t: any) => t.status === 'Completed' || t.status === 'completed' || t.status === 'paid')
      .reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
    const totalOutstanding = Math.max(0, netBilled - totalCollected);
    const collectionRate = netBilled > 0 ? ((totalCollected / netBilled) * 100).toFixed(1) : "100.0";

    const pastDueCount = invoices.filter((i: any) => i.status === 'Past Due' || (i.outstandingBalance > 0 && new Date(i.dueDate) < new Date())).length;

    return res.status(200).json({
      totalInvoiced,
      totalDiscounts,
      totalScholarships,
      netBilled,
      totalCollected,
      totalOutstanding,
      collectionRate: Number(collectionRate),
      invoicesCount: invoices.length,
      transactionsCount: transactions.length,
      pastDueCount,
      currency: "USD"
    });
  } catch (err: any) {
    logger.error("GET /api/payments/summary error:", err);
    return res.status(500).json({ error: "Failed to fetch payment summary" });
  }
});

/**
 * GET /api/payments/profile/:studentName
 * Returns comprehensive student financial profile
 * RBAC: Resource Ownership Check enforced
 */
paymentsRouter.get(
  "/profile/:studentName",
  requireAuth,
  requirePermission(["finance:view_all", "finance:view_own"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentName: decodeURIComponent(req.params.studentName).trim(),
      targetStudentId: req.params.studentName,
    }),
    allowedRoles: ["super_admin", "admin", "finance_officer"],
  }),
  async (req: Request, res: Response) => {
  try {
    const { studentName } = req.params;
    const userEmail = (req.query.userEmail as string) || undefined;
    const state = await getAuthoritativeState(userEmail);
    const fin = getFinancialState(state);

    const norm = studentName.toLowerCase().trim();
    const studentInvoices = fin.invoices.filter((i: any) => (i.studentName || "").toLowerCase().trim() === norm);
    const studentTxs = fin.transactions.filter((t: any) => (t.studentName || "").toLowerCase().trim() === norm);
    const studentReceipts = fin.receipts.filter((r: any) => (r.studentName || "").toLowerCase().trim() === norm);
    const studentAdjs = fin.adjustments.filter((a: any) => (a.studentName || "").toLowerCase().trim() === norm);

    const totalTuition = studentInvoices.reduce((acc: number, i: any) => acc + (Number(i.totalTuition) || 0), 0);
    const discounts = studentInvoices.reduce((acc: number, i: any) => acc + (Number(i.discounts) || 0), 0);
    const scholarships = studentInvoices.reduce((acc: number, i: any) => acc + (Number(i.scholarships) || 0), 0);
    const refunds = studentInvoices.reduce((acc: number, i: any) => acc + (Number(i.refunds) || 0), 0);
    const netTuition = studentInvoices.reduce((acc: number, i: any) => acc + (Number(i.netTuition) || 0), 0);
    const amountPaid = studentTxs
      .filter((t: any) => t.status === 'Completed' || t.status === 'completed')
      .reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
    const outstandingBalance = Math.max(0, netTuition - amountPaid);

    return res.status(200).json({
      studentName,
      totalTuition,
      discounts,
      scholarships,
      refunds,
      netTuition,
      amountPaid,
      outstandingBalance,
      invoices: studentInvoices,
      transactions: studentTxs,
      receipts: studentReceipts,
      adjustments: studentAdjs
    });
  } catch (err: any) {
    logger.error("GET /api/payments/profile error:", err);
    return res.status(500).json({ error: "Failed to fetch student financial profile" });
  }
});
