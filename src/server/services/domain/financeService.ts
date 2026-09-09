import crypto from 'crypto';
import { getServerSupabase, logAuditEvent } from '../supabaseServer';
import { logger } from '../../../lib/logger';
import { AuthenticatedUser } from '../../../types/rbac';

function isUuid(val: any): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

/**
 * Obtains the next sequence number formatted as PRE-YYYY-000001 (6 digits zero-padded)
 */
export async function getNextDatabaseSequenceNumber(
  type: 'invoice' | 'payment' | 'refund' | 'adjustment' | 'receipt',
  year: string = '2026',
  supabaseInstance?: any
): Promise<string> {
  const supabase = supabaseInstance || getServerSupabase();
  const prefixMap: Record<string, string> = {
    invoice: 'INV',
    payment: 'PAY',
    refund: 'REF',
    adjustment: 'ADJ',
    receipt: 'RCP',
  };
  const prefix = prefixMap[type] || type.toUpperCase().slice(0, 3);

  // 1. Try atomic PostgreSQL RPC
  try {
    const { data, error } = await supabase.rpc('get_next_document_number', {
      p_type: type,
      p_year: year,
    });
    if (!error && data && typeof data === 'string') {
      return data;
    }
  } catch {
    // Ignore RPC failure if table/function pending migration
  }

  // 2. Try document_sequences table
  try {
    const { data: seqRow } = await supabase
      .from('document_sequences')
      .select('current_value')
      .eq('sequence_type', type)
      .maybeSingle();

    const nextVal = (Number(seqRow?.current_value) || 0) + 1;
    await supabase.from('document_sequences').upsert({
      sequence_type: type,
      prefix,
      year,
      current_value: nextVal,
      updated_at: new Date().toISOString(),
    });
    return `${prefix}-${year}-${String(nextVal).padStart(6, '0')}`;
  } catch {
    // Ignore table failure
  }

  // 3. Fallback to count + 1
  try {
    const tableName =
      type === 'invoice'
        ? 'invoices'
        : type === 'payment'
        ? 'payments'
        : type === 'refund'
        ? 'refunds'
        : 'financial_adjustments';
    const { count } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
    const nextVal = (Number(count) || 0) + 1;
    return `${prefix}-${year}-${String(nextVal).padStart(6, '0')}`;
  } catch {
    const nextVal = Math.floor(1 + Math.random() * 9999);
    return `${prefix}-${year}-${String(nextVal).padStart(6, '0')}`;
  }
}

export interface AuthoritativeInvoiceFinancialSummary {
  invoiceTotal: number;
  applicableCharges: number;
  paymentsTotal: number;
  refundsTotal: number;
  netPayments: number;
  discounts: number;
  scholarships: number;
  approvedAdjustments: number;
  netTuition: number;
  balance: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Past Due' | 'Cancelled';
  lines: any[];
  allocations: any[];
  refundAllocations: any[];
  adjustments: any[];
}

export const financeService = {
  /**
   * Authoritative Core Calculation Engine:
   * Recomputes an invoice's financial ledger strictly on the server:
   *
   *   balance =
   *     invoice total
   *     - payments
   *     - approved adjustments
   *     + applicable charges
   *
   * where:
   *   invoice total = sum of invoice_lines
   *   payments = sum of completed payment_allocations - approved refund_allocations
   *   approved adjustments = sum of approved credits (discounts, scholarships, fee waivers)
   *   applicable charges = sum of approved charges (late fees, course fees)
   */
  async calculateAuthoritativeInvoiceFinancials(
    invoiceId: string,
    existingClient?: any
  ): Promise<AuthoritativeInvoiceFinancialSummary> {
    const supabase = existingClient || getServerSupabase();

    // 1. Query invoice header
    const { data: inv } = await supabase
      .from('invoices')
      .select('id, due_date, status, created_at')
      .eq('id', invoiceId)
      .maybeSingle();

    // 2. Query invoice lines
    const { data: dbLines } = await supabase
      .from('invoice_lines')
      .select('*')
      .eq('invoice_id', invoiceId);
    const lines = dbLines || [];

    const invoiceTotal = lines.reduce((acc: number, line: any) => {
      const lineTotal = Number(line.total_amount ?? (Number(line.quantity || 1) * Number(line.unit_amount || 0)));
      return acc + (isNaN(lineTotal) ? 0 : lineTotal);
    }, 0);

    // 3. Query payment allocations (completed payments only)
    const { data: dbAllocations } = await supabase
      .from('payment_allocations')
      .select(`
        *,
        payments (
          id,
          status,
          payment_date,
          payment_method,
          transaction_reference,
          deleted_at
        )
      `)
      .eq('invoice_id', invoiceId);

    const validAllocations = (dbAllocations || []).filter((a: any) => {
      const p = Array.isArray(a.payments) ? a.payments[0] : a.payments;
      return p && p.status === 'completed' && !p.deleted_at;
    });

    const paymentsTotal = validAllocations.reduce((acc: number, a: any) => {
      const amt = Number(a.allocated_amount || 0);
      return acc + (isNaN(amt) ? 0 : amt);
    }, 0);

    // 4. Query refund allocations (approved / processed only)
    const { data: dbRefundAllocations } = await supabase
      .from('refund_allocations')
      .select(`
        *,
        refunds (
          id,
          status,
          refund_date,
          amount
        )
      `)
      .eq('invoice_id', invoiceId);

    const validRefunds = (dbRefundAllocations || []).filter((ra: any) => {
      const r = Array.isArray(ra.refunds) ? ra.refunds[0] : ra.refunds;
      return r && (r.status === 'approved' || r.status === 'processed');
    });

    const refundsTotal = validRefunds.reduce((acc: number, ra: any) => {
      const amt = Number(ra.allocated_amount || 0);
      return acc + (isNaN(amt) ? 0 : amt);
    }, 0);

    // Effective payments applied to the invoice is payments minus refunds
    const netPayments = Math.max(0, paymentsTotal - refundsTotal);

    // 5. Query financial adjustments (only 'approved' status affects balance!)
    const { data: dbAdjustments } = await supabase
      .from('financial_adjustments')
      .select('*')
      .eq('invoice_id', invoiceId);

    const adjustments = dbAdjustments || [];
    const approvedAdjustmentsList = adjustments.filter((a: any) => a.status === 'approved');

    let discounts = 0;
    let scholarships = 0;
    let applicableCharges = 0;

    approvedAdjustmentsList.forEach((adj: any) => {
      const amt = Number(adj.amount || 0);
      if (isNaN(amt) || amt <= 0) return;

      if (adj.is_charge === true || adj.adjustment_type === 'applicable_charge' || adj.adjustment_type === 'late_fee' || adj.adjustment_type === 'administrative_charge') {
        applicableCharges += amt;
      } else if (adj.adjustment_type === 'scholarship') {
        scholarships += amt;
      } else {
        // discount, fee_waiver, administrative_credit
        discounts += amt;
      }
    });

    const approvedAdjustments = discounts + scholarships;

    // Authoritative Formula:
    // balance = invoice total - payments - approved adjustments + applicable charges
    const netTuition = Math.max(0, (invoiceTotal + applicableCharges) - approvedAdjustments);
    const balance = Math.max(0, (invoiceTotal + applicableCharges) - netPayments - approvedAdjustments);

    // Calculate effective status
    let effectiveStatus: AuthoritativeInvoiceFinancialSummary['status'] = 'Unpaid';
    const dueDate = inv?.due_date ? new Date(inv.due_date) : null;
    const now = new Date();

    if (balance <= 0) {
      effectiveStatus = 'Paid';
    } else if (netPayments > 0 || approvedAdjustments > 0) {
      effectiveStatus = 'Partially Paid';
    } else if (dueDate && dueDate < now) {
      effectiveStatus = 'Past Due';
    } else {
      effectiveStatus = 'Unpaid';
    }

    // Synchronize the server-calculated values back into the invoices cache columns
    try {
      await supabase
        .from('invoices')
        .update({
          total_amount: invoiceTotal,
          net_amount: netTuition,
          paid_amount: netPayments,
          balance_due: balance,
          discounts,
          scholarships,
          refunds: refundsTotal,
          adjustments: applicableCharges,
          status: effectiveStatus === 'Paid' ? 'paid' : effectiveStatus === 'Partially Paid' ? 'partially_paid' : effectiveStatus === 'Past Due' ? 'overdue' : 'unpaid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
    } catch (err: any) {
      logger.warn(`Could not update invoice cache for ${invoiceId}:`, err.message);
    }

    return {
      invoiceTotal,
      applicableCharges,
      paymentsTotal,
      refundsTotal,
      netPayments,
      discounts,
      scholarships,
      approvedAdjustments,
      netTuition,
      balance,
      status: effectiveStatus,
      lines,
      allocations: validAllocations,
      refundAllocations: validRefunds,
      adjustments,
    };
  },

  /**
   * Retrieves invoices from relational invoices table.
   * Derives all totals dynamically on the server from lines, allocations, refunds, and adjustments.
   */
  async getInvoices(
    filters?: { studentId?: string; studentName?: string } | string,
    user?: AuthenticatedUser
  ): Promise<{ invoices: any[]; total: number }> {
    const supabase = getServerSupabase();
    const filterObj = typeof filters === 'string' ? { studentName: filters } : filters;

    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          students (
            id,
            student_number,
            cohort_level,
            profiles (
              first_name,
              last_name,
              phone
            ),
            users (
              email
            )
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (filterObj?.studentId) {
        query = query.eq('student_id', filterObj.studentId);
      }

      const { data: dbInvoices, error } = await query;

      if (dbInvoices && dbInvoices.length > 0) {
        // Hydrate child ledger records for each invoice to ensure authoritative calculation
        const formatted = await Promise.all(
          dbInvoices.map(async (inv: any) => {
            const std = inv.students;
            const prof = Array.isArray(std?.profiles) ? std?.profiles[0] : std?.profiles;
            const userObj = Array.isArray(std?.users) ? std?.users[0] : std?.users;
            const name = prof
              ? `${prof.first_name || ''} ${prof.last_name || ''}`.trim()
              : (inv.student_name || 'Student');

            // Compute ledger totals server-side
            const summary = await financeService.calculateAuthoritativeInvoiceFinancials(inv.id, supabase);

            return {
              id: inv.id,
              invoiceNumber: inv.invoice_number || inv.id,
              studentId: inv.student_id,
              student: {
                id: inv.student_id,
                name,
                email: userObj?.email || '',
                phone: prof?.phone || '',
              },
              studentName: name,
              email: userObj?.email || '',
              phone: prof?.phone || '',
              moduleTrack: inv.module_track || 'Core Ministry Curriculum',
              term: inv.term || '2026 Semester 1',
              academicYear: inv.academic_year || '2026-2027',
              issueDate: inv.issue_date || inv.created_at?.split('T')[0],
              dueDate: inv.due_date,
              // Server-calculated authoritative fields:
              lines: summary.lines,
              allocations: summary.allocations,
              refundAllocations: summary.refundAllocations,
              adjustmentsList: summary.adjustments,
              totalTuition: summary.invoiceTotal,
              applicableCharges: summary.applicableCharges,
              discounts: summary.discounts,
              scholarships: summary.scholarships,
              refunds: summary.refundsTotal,
              adjustments: summary.applicableCharges,
              netTuition: summary.netTuition,
              amountPaid: summary.netPayments,
              outstandingBalance: summary.balance,
              status: summary.status,
              paymentPlan: inv.payment_plan || 'Monthly Installments',
              notes: inv.notes || '',
              createdAt: inv.created_at,
              updatedAt: inv.updated_at,
            };
          })
        );

        let result = formatted;
        if (user && user.role === 'student') {
          const ownId = user.studentId || user.userId;
          const ownName = (user.studentName || user.name || user.email.split('@')[0]).toLowerCase().trim();
          result = formatted.filter(
            (i) => (i.studentId && i.studentId === ownId) || i.studentName.toLowerCase().trim() === ownName
          );
        } else if (filterObj?.studentId) {
          result = formatted.filter((i) => i.studentId === filterObj.studentId);
        } else if (filterObj?.studentName) {
          const norm = filterObj.studentName.toLowerCase().trim();
          result = formatted.filter((i) => i.studentName.toLowerCase().trim() === norm);
        }

        return { invoices: result, total: result.length };
      }
    } catch (err) {
      logger.error('Error fetching invoices from relational table:', err);
      throw err;
    }
  },

  /**
   * Creates or updates a tuition invoice in the relational invoices and invoice_lines tables.
   *
   * CRITICAL SECURITY DIRECTIVE:
   * Rejects / strips client-submitted `totalTuition`, `amountPaid`, `discount`, `refund`, and `balance`.
   * The server calculates all totals from `invoice_lines`, allocations, and approved adjustments.
   */
  async saveInvoice(
    invoiceInput: any,
    actorUserId?: string,
    actorRole?: string
  ): Promise<{ status: string; invoice: any }> {
    const supabase = getServerSupabase();
    const timestamp = new Date().toISOString();

    try {
      // 1. Strictly strip and ignore client-submitted authoritative values
      const {
        totalTuition: _ignoredTotal,
        amountPaid: _ignoredPaid,
        discount: _ignoredDiscount,
        discounts: _ignoredDiscounts,
        scholarships: _ignoredScholarships,
        refund: _ignoredRefund,
        refunds: _ignoredRefunds,
        balance: _ignoredBalance,
        outstandingBalance: _ignoredOutstanding,
        netTuition: _ignoredNet,
        ...safePayload
      } = invoiceInput;

      // 2. Resolve or fallback student ID
      let studentId = safePayload.studentId;
      let studentName = safePayload.studentName || 'Student';

      if (!studentId && studentName) {
        const parts = studentName.trim().split(' ');
        const { data: prof } = await supabase
          .from('profiles')
          .select('user_id, students(id)')
          .ilike('first_name', parts[0])
          .maybeSingle();
        if (prof?.students && prof.students[0]?.id) {
          studentId = prof.students[0].id;
        }
      }

      if (!studentId) {
        const { data: std } = await supabase.from('students').select('id').limit(1).maybeSingle();
        studentId = std?.id;
      }

      const invoiceId = (safePayload.id && isUuid(safePayload.id)) ? safePayload.id : crypto.randomUUID();
      const invoiceNumber = safePayload.invoiceNumber || await getNextDatabaseSequenceNumber('invoice', '2026', supabase);

      // 3. Insert or update invoice header
      const invoiceHeader = {
        id: invoiceId,
        invoice_number: invoiceNumber,
        student_id: studentId,
        student_name: studentName,
        module_track: safePayload.moduleTrack || 'Core Ministry Curriculum',
        term: safePayload.term || '2026 Semester 1',
        academic_year: safePayload.academicYear || '2026-2027',
        due_date: safePayload.dueDate || '2026-05-15',
        payment_plan: safePayload.paymentPlan || 'Monthly Installments',
        notes: safePayload.notes || '',
        updated_at: timestamp,
      };

      const { error: headerErr } = await supabase
        .from('invoices')
        .upsert(invoiceHeader, { onConflict: 'id' });

      if (headerErr) {
        logger.error('Invoice header upsert failed:', headerErr.message);
        throw new Error(`Failed to save invoice header: ${headerErr.message}`);
      }

      // 4. Authoritative Line Items Handling:
      // If client supplied lines, use them; otherwise, create standard tuition line
      let inputLines: any[] = Array.isArray(safePayload.lines) && safePayload.lines.length > 0
        ? safePayload.lines
        : [
            {
              lineType: 'tuition',
              description: safePayload.notes || 'Core Ministry Curriculum Tuition',
              quantity: 1,
              unitAmount: 750.00,
            },
          ];

      // Delete existing lines and re-insert normalized lines
      const { error: delErr } = await supabase.from('invoice_lines').delete().eq('invoice_id', invoiceId);
      if (delErr) {
        logger.error('Invoice lines deletion failed:', delErr.message);
        throw new Error(`Failed to update invoice lines: ${delErr.message}`);
      }

      const linesToInsert = inputLines.map((l) => {
        const qty = Number(l.quantity || 1);
        const unit = Number(l.unitAmount || 0);
        return {
          id: (l.id && isUuid(l.id)) ? l.id : crypto.randomUUID(),
          invoice_id: invoiceId,
          line_type: l.lineType || 'tuition',
          description: l.description || 'Curriculum Tuition',
          quantity: qty,
          unit_amount: unit,
          total_amount: Math.round(qty * unit * 100) / 100,
          updated_at: timestamp,
        };
      });

      const { error: lineErr } = await supabase.from('invoice_lines').insert(linesToInsert);
      if (lineErr) {
        logger.error('Invoice lines insertion failed:', lineErr.message);
        throw new Error(`Failed to save invoice lines: ${lineErr.message}`);
      }

      // 5. Run Server Calculation Engine to compute authoritative balance
      const summary = await financeService.calculateAuthoritativeInvoiceFinancials(invoiceId, supabase);

      await logAuditEvent({
        actorUserId: actorUserId || null,
        actorRole: actorRole || 'finance_officer',
        entityType: 'invoice',
        entityId: invoiceId,
        action: 'create',
        newValues: {
          invoiceId,
          studentId,
          invoiceTotal: summary.invoiceTotal,
          balance: summary.balance,
          linesCount: linesToInsert.length,
        },
        changedFields: ['invoiceTotal', 'balance', 'lines'],
        reason: `Tuition invoice created for ${studentName}`,
      });

      return {
        status: 'saved',
        invoice: {
          ...safePayload,
          id: invoiceId,
          invoiceNumber: invoiceHeader.invoice_number,
          studentId,
          studentName,
          lines: summary.lines,
          totalTuition: summary.invoiceTotal,
          applicableCharges: summary.applicableCharges,
          discounts: summary.discounts,
          scholarships: summary.scholarships,
          refunds: summary.refundsTotal,
          adjustments: summary.applicableCharges,
          netTuition: summary.netTuition,
          amountPaid: summary.netPayments,
          outstandingBalance: summary.balance,
          status: summary.status,
          dueDate: invoiceHeader.due_date,
          updatedAt: timestamp,
        },
      };
    } catch (err: any) {
      logger.error('Error saving invoice in financial architecture:', err);
      throw err;
    }
  },

  /**
   * Retrieves payments and transactions from relational payments table with allocations.
   */
  async getTransactions(
    filters?: { invoiceId?: string; studentId?: string; studentName?: string },
    user?: AuthenticatedUser
  ): Promise<{ transactions: any[]; total: number }> {
    const supabase = getServerSupabase();

    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          students (
            id,
            student_number,
            profiles (
              first_name,
              last_name
            )
          ),
          payment_allocations (
            id,
            invoice_id,
            allocated_amount,
            notes
          )
        `)
        .is('deleted_at', null)
        .order('payment_date', { ascending: false });

      if (filters?.studentId) {
        query = query.eq('student_id', filters.studentId);
      }

      const { data: dbPayments } = await query;

      if (dbPayments && dbPayments.length > 0) {
        const formatted = dbPayments.map((p: any) => {
          const std = p.students;
          const prof = Array.isArray(std?.profiles) ? std?.profiles[0] : std?.profiles;
          const studentName = prof ? `${prof.first_name || ''} ${prof.last_name || ''}`.trim() : (p.student_name || 'Student');
          const allocations = Array.isArray(p.payment_allocations) ? p.payment_allocations : [];

          // Primary invoiceId from first allocation or legacy field
          const primaryInvoiceId = allocations[0]?.invoice_id || p.invoice_id || '';

          return {
            id: p.id,
            transactionId: p.transaction_reference || p.id,
            invoiceId: primaryInvoiceId,
            allocations,
            studentId: p.student_id,
            student: {
              id: p.student_id,
              name: studentName,
            },
            studentName,
            amount: Number(p.amount || 0),
            date: p.payment_date,
            method: p.payment_method || 'Bank Transfer',
            status: p.status === 'completed' ? 'Completed' : 'Pending',
            reference: p.transaction_reference || '',
            notes: p.notes || '',
            createdAt: p.created_at,
          };
        });

        let result = formatted;
        if (user && user.role === 'student') {
          const ownId = user.studentId || user.userId;
          const ownName = (user.studentName || user.name || user.email.split('@')[0]).toLowerCase().trim();
          result = formatted.filter(
            (t) => (t.studentId && t.studentId === ownId) || t.studentName.toLowerCase().trim() === ownName
          );
        } else if (filters?.studentId) {
          result = formatted.filter((t) => t.studentId === filters.studentId);
        } else if (filters?.studentName) {
          const target = filters.studentName.toLowerCase().trim();
          result = formatted.filter((t) => t.studentName.toLowerCase().trim() === target);
        }

        return { transactions: result, total: result.length };
      }
    } catch (err) {
      logger.error('Error fetching transactions from relational table:', err);
    }

    return { transactions: [], total: 0 };
  },

  /**
   * Records a payment transaction with explicit payment allocations:
   * payment -> payment_allocation
   * Recomputes the affected invoices' balance server-side.
   */
  async recordPayment(
    paymentInput: any,
    actorUserId?: string,
    actorRole?: string
  ): Promise<{ status: string; payment: any; updatedInvoices?: any[] }> {
    const supabase = getServerSupabase();
    const timestamp = new Date().toISOString();

    try {
      const amount = Number(paymentInput.amount || 0);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Payment amount must be greater than zero');
      }

      // Resolve student
      let studentId = paymentInput.studentId;
      let studentName = paymentInput.studentName || 'Student';

      if (!studentId && studentName) {
        const parts = studentName.trim().split(' ');
        const { data: prof } = await supabase
          .from('profiles')
          .select('user_id, students(id)')
          .ilike('first_name', parts[0])
          .maybeSingle();
        if (prof?.students && prof.students[0]?.id) {
          studentId = prof.students[0].id;
        }
      }

      const paymentId = (paymentInput.id && isUuid(paymentInput.id)) ? paymentInput.id : crypto.randomUUID();
      const paymentNumber = paymentInput.paymentNumber || await getNextDatabaseSequenceNumber('payment', '2026', supabase);
      const reference = paymentInput.reference || paymentInput.transactionReference || paymentNumber;

      // 1. Insert payment record
      const paymentPayload = {
        id: paymentId,
        payment_number: paymentNumber,
        invoice_id: paymentInput.invoiceId || null,
        student_id: studentId,
        student_name: studentName,
        amount,
        payment_method: (paymentInput.paymentMethod || paymentInput.method || 'Bank Transfer').toLowerCase().replace(/\s+/g, '_'),
        transaction_reference: reference,
        payment_date: paymentInput.paymentDate || paymentInput.date || timestamp.split('T')[0],
        status: 'completed',
        notes: paymentInput.notes || '',
        recorded_by_user_id: actorUserId || null,
        updated_at: timestamp,
      };

      const { error: pmtErr } = await supabase.from('payments').upsert(paymentPayload, { onConflict: 'id' });
      if (pmtErr) {
        logger.error('Payment insert failed:', pmtErr.message);
        throw new Error(`Failed to record payment: ${pmtErr.message}`);
      }

      // 2. Insert Payment Allocations:
      // payment -> payment_allocation
      const targetInvoiceIds: string[] = [];
      const allocationsToInsert: any[] = [];

      if (Array.isArray(paymentInput.allocations) && paymentInput.allocations.length > 0) {
        paymentInput.allocations.forEach((alloc: any) => {
          if (alloc.invoiceId && Number(alloc.amount || alloc.allocatedAmount) > 0) {
            targetInvoiceIds.push(alloc.invoiceId);
            allocationsToInsert.push({
              id: (alloc.id && isUuid(alloc.id)) ? alloc.id : crypto.randomUUID(),
              payment_id: paymentId,
              invoice_id: alloc.invoiceId,
              allocated_amount: Number(alloc.amount || alloc.allocatedAmount),
              notes: alloc.notes || paymentInput.notes || 'Tuition payment allocation',
              created_at: timestamp,
            });
          }
        });
      } else if (paymentInput.invoiceId) {
        targetInvoiceIds.push(paymentInput.invoiceId);
        allocationsToInsert.push({
          id: crypto.randomUUID(),
          payment_id: paymentId,
          invoice_id: paymentInput.invoiceId,
          allocated_amount: amount,
          notes: paymentInput.notes || 'Direct invoice payment allocation',
          created_at: timestamp,
        });
      }

      if (allocationsToInsert.length > 0) {
        const { error: allocErr } = await supabase.from('payment_allocations').insert(allocationsToInsert);
        if (allocErr) {
          logger.error('Payment allocations insert failed:', allocErr.message);
          throw new Error(`Failed to record payment allocations: ${allocErr.message}`);
        }
      }

      // 3. Recalculate Authoritative Balances for each affected invoice
      const updatedInvoices: any[] = [];
      for (const invId of targetInvoiceIds) {
        const summary = await financeService.calculateAuthoritativeInvoiceFinancials(invId, supabase);
        updatedInvoices.push({
          invoiceId: invId,
          balance: summary.balance,
          amountPaid: summary.netPayments,
          status: summary.status,
        });
      }

      await logAuditEvent({
        actorUserId: actorUserId || null,
        actorRole: actorRole || 'finance_officer',
        entityType: 'payment',
        entityId: paymentId,
        action: 'create',
        newValues: {
          paymentId,
          amount,
          targetInvoiceIds,
          allocationsCount: allocationsToInsert.length,
          studentName,
        },
        changedFields: ['amount', 'status', 'allocations'],
        reason: `Payment of $${amount} recorded for ${studentName}`,
      });

      return {
        status: 'recorded',
        payment: {
          ...paymentInput,
          id: paymentId,
          allocations: allocationsToInsert,
        },
        updatedInvoices,
      };
    } catch (err: any) {
      logger.error('Error recording payment in financial architecture:', err);
      throw err;
    }
  },

  /**
   * Applies a financial adjustment:
   * financial_adjustment
   * Recomputes balance: balance = invoice total - payments - approved adjustments + applicable charges
   */
  async applyFinancialAdjustment(
    adjInput: any,
    actorUserId?: string,
    actorRole?: string
  ): Promise<{ status: string; adjustment: any; updatedInvoice?: any }> {
    const supabase = getServerSupabase();
    const timestamp = new Date().toISOString();

    try {
      const amount = Number(adjInput.amount || 0);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Adjustment amount must be greater than zero');
      }

      const invoiceId = adjInput.invoiceId;
      if (!invoiceId) {
        throw new Error('invoiceId is required for financial adjustment');
      }

      const adjType = adjInput.type || adjInput.adjustmentType || 'adjustment';
      const isCharge = adjInput.isCharge === true || adjType === 'applicable_charge' || adjType === 'late_fee' || adjType === 'administrative_charge';
      const status = adjInput.status || 'approved'; // Only 'approved' adjustments alter balance!

      const adjId = (adjInput.id && isUuid(adjInput.id)) ? adjInput.id : crypto.randomUUID();
      const adjustmentNumber = adjInput.adjustmentNumber || await getNextDatabaseSequenceNumber('adjustment', '2026', supabase);

      const adjustmentPayload = {
        id: adjId,
        adjustment_number: adjustmentNumber,
        invoice_id: invoiceId,
        student_id: adjInput.studentId || null,
        student_name: adjInput.studentName || 'Student',
        adjustment_type: adjType,
        is_charge: isCharge,
        amount,
        status,
        category_name: adjInput.categoryName || adjInput.category || 'Institutional Adjustment',
        reason: adjInput.reason || adjInput.notes || '',
        receipt_or_doc_ref: adjInput.receiptOrDocRef || '',
        authorized_by: adjInput.authorizedBy || actorUserId || 'Finance Admin',
        applied_date: adjInput.appliedDate || timestamp.split('T')[0],
        notes: adjInput.notes || '',
        updated_at: timestamp,
      };

      const { error: adjErr } = await supabase
        .from('financial_adjustments')
        .upsert(adjustmentPayload, { onConflict: 'id' });

      if (adjErr) {
        logger.error('Adjustment insert failed:', adjErr.message);
        throw new Error(`Failed to apply financial adjustment: ${adjErr.message}`);
      }

      // Recompute invoice balance authoritatively
      const summary = await financeService.calculateAuthoritativeInvoiceFinancials(invoiceId, supabase);

      await logAuditEvent({
        actorUserId: actorUserId || null,
        actorRole: actorRole || 'finance_officer',
        entityType: 'adjustment',
        entityId: adjId,
        action: 'create',
        newValues: {
          adjId,
          invoiceId,
          type: adjType,
          amount,
          isCharge,
          status,
          newBalance: summary.balance,
        },
        changedFields: ['amount', 'status', 'balance'],
        reason: adjInput.reason || `Financial adjustment of $${amount} applied to invoice ${invoiceId}`,
      });

      return {
        status: 'applied',
        adjustment: adjustmentPayload,
        updatedInvoice: {
          id: invoiceId,
          totalTuition: summary.invoiceTotal,
          applicableCharges: summary.applicableCharges,
          discounts: summary.discounts,
          scholarships: summary.scholarships,
          refunds: summary.refundsTotal,
          amountPaid: summary.netPayments,
          outstandingBalance: summary.balance,
          status: summary.status,
        },
      };
    } catch (err: any) {
      logger.error('Error applying financial adjustment in financial architecture:', err);
      throw err;
    }
  },

  /**
   * Records a refund with explicit refund allocations:
   * refund -> refund_allocation
   * Refunds reduce net payments, increasing outstanding balance accordingly.
   */
  async recordRefund(
    refundInput: any,
    actorUserId?: string,
    actorRole?: string
  ): Promise<{ status: string; refund: any; updatedInvoices?: any[] }> {
    const supabase = getServerSupabase();
    const timestamp = new Date().toISOString();

    try {
      const amount = Number(refundInput.amount || 0);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Refund amount must be greater than zero');
      }

      const refundId = (refundInput.id && isUuid(refundInput.id)) ? refundInput.id : crypto.randomUUID();
      const refundNumber = refundInput.refundNumber || await getNextDatabaseSequenceNumber('refund', '2026', supabase);

      // 1. Insert refund record
      const refundPayload = {
        id: refundId,
        refund_number: refundNumber,
        payment_id: refundInput.paymentId || null,
        student_id: refundInput.studentId || null,
        student_name: refundInput.studentName || 'Student',
        amount,
        reason: refundInput.reason || 'Tuition Overpayment / Course Drop',
        status: refundInput.status || 'approved',
        refund_date: refundInput.refundDate || timestamp.split('T')[0],
        approved_by_user_id: actorUserId || refundInput.approvedBy || 'Finance Bursar',
        notes: refundInput.notes || '',
        updated_at: timestamp,
      };

      const { error: refErr } = await supabase.from('refunds').upsert(refundPayload, { onConflict: 'id' });
      if (refErr) {
        logger.error('Refund insert failed:', refErr.message);
        throw new Error(`Failed to record refund: ${refErr.message}`);
      }

      // 2. Insert Refund Allocations:
      // refund -> refund_allocation
      const targetInvoiceIds: string[] = [];
      const allocationsToInsert: any[] = [];

      if (Array.isArray(refundInput.allocations) && refundInput.allocations.length > 0) {
        refundInput.allocations.forEach((alloc: any) => {
          if (alloc.invoiceId && Number(alloc.amount || alloc.allocatedAmount) > 0) {
            targetInvoiceIds.push(alloc.invoiceId);
            allocationsToInsert.push({
              id: (alloc.id && isUuid(alloc.id)) ? alloc.id : crypto.randomUUID(),
              refund_id: refundId,
              invoice_id: alloc.invoiceId,
              payment_allocation_id: alloc.paymentAllocationId || null,
              allocated_amount: Number(alloc.amount || alloc.allocatedAmount),
              created_at: timestamp,
            });
          }
        });
      } else if (refundInput.invoiceId) {
        targetInvoiceIds.push(refundInput.invoiceId);
        allocationsToInsert.push({
          id: crypto.randomUUID(),
          refund_id: refundId,
          invoice_id: refundInput.invoiceId,
          allocated_amount: amount,
          created_at: timestamp,
        });
      }

      if (allocationsToInsert.length > 0) {
        const { error: refAllocErr } = await supabase.from('refund_allocations').insert(allocationsToInsert);
        if (refAllocErr) {
          logger.error('Refund allocations insert failed:', refAllocErr.message);
          throw new Error(`Failed to record refund allocations: ${refAllocErr.message}`);
        }
      }

      // 3. Recalculate Authoritative Balances for each affected invoice
      const updatedInvoices: any[] = [];
      for (const invId of targetInvoiceIds) {
        const summary = await financeService.calculateAuthoritativeInvoiceFinancials(invId, supabase);
        updatedInvoices.push({
          invoiceId: invId,
          balance: summary.balance,
          amountPaid: summary.netPayments,
          refunds: summary.refundsTotal,
          status: summary.status,
        });
      }

      await logAuditEvent({
        actorUserId: actorUserId || null,
        actorRole: actorRole || 'finance_officer',
        entityType: 'refund',
        entityId: refundId,
        action: 'create',
        newValues: {
          refundId,
          amount,
          targetInvoiceIds,
        },
        changedFields: ['amount', 'status', 'allocations'],
        reason: refundInput.reason || `Refund of $${amount} recorded`,
      });

      return {
        status: 'recorded',
        refund: {
          ...refundPayload,
          allocations: allocationsToInsert,
        },
        updatedInvoices,
      };
    } catch (err: any) {
      logger.error('Error recording refund in financial architecture:', err);
      throw err;
    }
  },

  /**
   * Retrieves financial adjustments.
   */
  async getAdjustments(
    filters?: { invoiceId?: string; studentId?: string },
    user?: AuthenticatedUser
  ): Promise<{ adjustments: any[]; total: number }> {
    const supabase = getServerSupabase();
    try {
      let query = supabase.from('financial_adjustments').select('*').order('applied_date', { ascending: false });

      if (filters?.invoiceId) {
        query = query.eq('invoice_id', filters.invoiceId);
      }
      if (filters?.studentId) {
        query = query.eq('student_id', filters.studentId);
      }

      const { data } = await query;
      const adjustments = data || [];

      if (user && user.role === 'student') {
        const ownId = user.studentId || user.userId;
        const ownName = (user.studentName || user.name || user.email.split('@')[0]).toLowerCase().trim();
        const filtered = adjustments.filter(
          (a: any) => (a.student_id && a.student_id === ownId) || (a.student_name && a.student_name.toLowerCase().trim() === ownName)
        );
        return { adjustments: filtered, total: filtered.length };
      }

      return { adjustments, total: adjustments.length };
    } catch (err) {
      logger.error('Error getting financial adjustments:', err);
      return { adjustments: [], total: 0 };
    }
  },

  /**
   * Retrieves refunds.
   */
  async getRefunds(
    filters?: { invoiceId?: string; studentId?: string },
    user?: AuthenticatedUser
  ): Promise<{ refunds: any[]; total: number }> {
    const supabase = getServerSupabase();
    try {
      let query = supabase
        .from('refunds')
        .select(`
          *,
          refund_allocations (*)
        `)
        .order('refund_date', { ascending: false });

      if (filters?.studentId) {
        query = query.eq('student_id', filters.studentId);
      }

      const { data } = await query;
      const refunds = data || [];

      if (user && user.role === 'student') {
        const ownId = user.studentId || user.userId;
        const ownName = (user.studentName || user.name || user.email.split('@')[0]).toLowerCase().trim();
        const filtered = refunds.filter(
          (r: any) => (r.student_id && r.student_id === ownId) || (r.student_name && r.student_name.toLowerCase().trim() === ownName)
        );
        return { refunds: filtered, total: filtered.length };
      }

      return { refunds, total: refunds.length };
    } catch (err) {
      logger.error('Error getting refunds:', err);
      return { refunds: [], total: 0 };
    }
  },

  /**
   * Sequence generator for human-facing document numbers (e.g. INV-2026-000001)
   */
  async getNextSequenceNumber(
    type: 'invoice' | 'payment' | 'refund' | 'adjustment' | 'receipt',
    year: string = '2026'
  ): Promise<string> {
    return getNextDatabaseSequenceNumber(type, year);
  },
};
