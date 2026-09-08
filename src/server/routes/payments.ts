import { Router, Request, Response } from "express";
import { financeService } from "../services/domain";
import { requireAuth, requirePermission, requireResourceOwnership } from "../middleware/rbac";
import { logger } from "../../lib/logger";

export const paymentsRouter = Router();

// Default-deny at the router level: All routes require authentication
paymentsRouter.use(requireAuth);

/**
 * GET /api/payments/invoices
 * Retrieves invoices from relational invoices table.
 * RBAC: Requires finance:read. Students can only view their own invoices.
 */
paymentsRouter.get(
  "/invoices",
  requirePermission(["finance:read", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const studentName = (req.query.studentName as string) || undefined;
      const result = await financeService.getInvoices(studentName, user);

      return res.status(200).json({
        invoices: result.invoices,
        total: result.total,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error("GET /api/payments/invoices error:", err);
      return res.status(500).json({ error: "Failed to fetch invoices" });
    }
  }
);

/**
 * POST /api/payments/invoices
 * Creates or updates an institutional tuition invoice in relational tables.
 * RBAC: Requires finance:write
 */
paymentsRouter.post(
  "/invoices",
  requireAuth,
  requirePermission(["finance:write", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { invoice } = req.body;
      const actorUserId = req.user?.email || "finance";

      if (!invoice || !invoice.studentName || !invoice.totalTuition) {
        return res.status(400).json({ error: "studentName and totalTuition are required" });
      }

      const result = await financeService.saveInvoice(invoice, actorUserId);
      return res.status(201).json(result);
    } catch (err: any) {
      logger.error("POST /api/payments/invoices error:", err);
      return res.status(500).json({ error: "Failed to create invoice" });
    }
  }
);

/**
 * GET /api/payments/transactions
 * Retrieves payment transactions from relational payments table.
 * RBAC: Requires finance:read. Students only retrieve their own transactions.
 */
paymentsRouter.get(
  "/transactions",
  requirePermission(["finance:read", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const invoiceId = (req.query.invoiceId as string) || undefined;
      const studentName = (req.query.studentName as string) || undefined;

      const result = await financeService.getTransactions({ invoiceId, studentName }, user);

      return res.status(200).json({
        transactions: result.transactions,
        total: result.total,
      });
    } catch (err: any) {
      logger.error("GET /api/payments/transactions error:", err);
      return res.status(500).json({ error: "Failed to fetch transactions" });
    }
  }
);

/**
 * POST /api/payments/transactions
 * Records an incoming institutional payment into relational tables and allocates to invoice.
 * RBAC: Requires finance:write
 */
paymentsRouter.post(
  "/transactions",
  requireAuth,
  requirePermission(["finance:write", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { transaction } = req.body;
      const actorUserId = req.user?.email || "finance";

      if (!transaction || !transaction.studentName || !transaction.amount) {
        return res.status(400).json({ error: "studentName and amount are required" });
      }

      const result = await financeService.recordPayment(transaction, actorUserId);
      return res.status(201).json(result);
    } catch (err: any) {
      logger.error("POST /api/payments/transactions error:", err);
      return res.status(500).json({ error: "Failed to record payment" });
    }
  }
);
