import { getServerSupabase, logAuditEvent } from '../supabaseServer';
import { logger } from '../../../lib/logger';
import { AuthenticatedUser } from '../../../types/rbac';

export const financeService = {
  /**
   * Retrieves invoices from relational invoices table.
   */
  async getInvoices(studentName?: string, user?: AuthenticatedUser): Promise<{ invoices: any[]; total: number }> {
    const supabase = getServerSupabase();

    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          students (
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

      const { data: dbInvoices, error } = await query;

      if (dbInvoices && dbInvoices.length > 0) {
        const formatted = dbInvoices.map((inv: any) => {
          const std = inv.students;
          const prof = Array.isArray(std?.profiles) ? std?.profiles[0] : std?.profiles;
          const userObj = Array.isArray(std?.users) ? std?.users[0] : std?.users;
          const name = prof ? `${prof.first_name || ''} ${prof.last_name || ''}`.trim() : (inv.student_name || 'Student');

          return {
            id: inv.id,
            invoiceNumber: inv.invoice_number || inv.id,
            studentId: inv.student_id,
            studentName: name,
            email: userObj?.email || '',
            phone: prof?.phone || '',
            moduleTrack: inv.module_track || 'Core Ministry Curriculum',
            term: inv.term || '2026 Semester 1',
            academicYear: inv.academic_year || '2026-2027',
            issueDate: inv.issue_date || inv.created_at?.split('T')[0],
            dueDate: inv.due_date,
            totalTuition: Number(inv.total_amount || 0),
            discounts: Number(inv.discounts || 0),
            scholarships: Number(inv.scholarships || 0),
            refunds: Number(inv.refunds || 0),
            adjustments: Number(inv.adjustments || 0),
            netTuition: Number(inv.net_amount || inv.total_amount || 0),
            amountPaid: Number(inv.paid_amount || 0),
            outstandingBalance: Number(inv.balance_due || 0),
            paymentPlan: inv.payment_plan || 'Monthly Installments',
            status: inv.status === 'paid' ? 'Paid' : inv.status === 'partially_paid' ? 'Partially Paid' : 'Unpaid',
            notes: inv.notes || '',
            createdAt: inv.created_at,
            updatedAt: inv.updated_at,
          };
        });

        let result = formatted;
        if (user && user.role === 'student') {
          const ownName = (user.studentName || user.name || user.email.split('@')[0]).toLowerCase().trim();
          result = formatted.filter((i) => i.studentName.toLowerCase().trim() === ownName);
        } else if (studentName) {
          const norm = studentName.toLowerCase().trim();
          result = formatted.filter((i) => i.studentName.toLowerCase().trim() === norm);
        }

        return { invoices: result, total: result.length };
      }
    } catch (err) {
      logger.error('Error fetching invoices from relational table:', err);
    }

    return { invoices: [], total: 0 };
  },

  /**
   * Creates or updates a tuition invoice in the relational invoices table.
   */
  async saveInvoice(invoice: any, actorUserId?: string): Promise<{ status: string; invoice: any }> {
    const supabase = getServerSupabase();
    const timestamp = new Date().toISOString();

    try {
      const totalTuition = Number(invoice.totalTuition || 0);
      const discounts = Number(invoice.discounts || 0);
      const scholarships = Number(invoice.scholarships || 0);
      const refunds = Number(invoice.refunds || 0);
      const adjustments = Number(invoice.adjustments || 0);
      const netTuition = Math.max(0, totalTuition - discounts - scholarships - adjustments + refunds);
      const amountPaid = Number(invoice.amountPaid || 0);
      const outstandingBalance = Math.max(0, netTuition - amountPaid);

      let status = 'unpaid';
      if (outstandingBalance <= 0) {
        status = 'paid';
      } else if (amountPaid > 0) {
        status = 'partially_paid';
      }

      // Resolve student ID
      let studentId = invoice.studentId;
      if (!studentId && invoice.studentName) {
        const parts = invoice.studentName.trim().split(' ');
        const { data: prof } = await supabase
          .from('profiles')
          .select('user_id, students(id)')
          .ilike('first_name', parts[0])
          .maybeSingle();
        if (prof?.students && prof.students[0]?.id) {
          studentId = prof.students[0].id;
        }
      }

      const invoicePayload = {
        id: invoice.id || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        invoice_number: invoice.id || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        student_id: studentId,
        total_amount: totalTuition,
        discounts,
        scholarships,
        refunds,
        adjustments,
        net_amount: netTuition,
        paid_amount: amountPaid,
        balance_due: outstandingBalance,
        status,
        due_date: invoice.dueDate || '2026-05-15',
        notes: invoice.notes || '',
        updated_at: timestamp,
      };

      const { data: saved, error } = await supabase
        .from('invoices')
        .upsert(invoicePayload, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        logger.warn('Invoice upsert warning:', error.message);
      }

      await logAuditEvent({
        actorUserId,
        entityType: 'invoice',
        entityId: invoicePayload.id,
        action: 'create',
        newValues: invoicePayload,
      });

      return {
        status: 'saved',
        invoice: {
          ...invoice,
          id: invoicePayload.id,
          totalTuition,
          netTuition,
          amountPaid,
          outstandingBalance,
          status: status === 'paid' ? 'Paid' : status === 'partially_paid' ? 'Partially Paid' : 'Unpaid',
        },
      };
    } catch (err: any) {
      logger.error('Error saving invoice in relational service:', err);
      throw err;
    }
  },

  /**
   * Retrieves payments and transactions from relational payments table.
   */
  async getTransactions(
    filters?: { invoiceId?: string; studentName?: string },
    user?: AuthenticatedUser
  ): Promise<{ transactions: any[]; total: number }> {
    const supabase = getServerSupabase();

    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          students (
            student_number,
            profiles (
              first_name,
              last_name
            )
          ),
          invoices (
            invoice_number,
            total_amount
          )
        `)
        .is('deleted_at', null)
        .order('payment_date', { ascending: false });

      if (filters?.invoiceId) {
        query = query.eq('invoice_id', filters.invoiceId);
      }

      const { data: dbPayments } = await query;

      if (dbPayments && dbPayments.length > 0) {
        const formatted = dbPayments.map((p: any) => {
          const std = p.students;
          const prof = Array.isArray(std?.profiles) ? std?.profiles[0] : std?.profiles;
          const studentName = prof ? `${prof.first_name || ''} ${prof.last_name || ''}`.trim() : 'Student';
          const inv = Array.isArray(p.invoices) ? p.invoices[0] : p.invoices;

          return {
            id: p.id,
            transactionId: p.transaction_reference || p.id,
            invoiceId: p.invoice_id,
            invoiceNumber: inv?.invoice_number || p.invoice_id,
            studentId: p.student_id,
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
          const ownName = (user.studentName || user.name || user.email.split('@')[0]).toLowerCase().trim();
          result = formatted.filter((t) => t.studentName.toLowerCase().trim() === ownName);
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
   * Records a payment transaction directly in relational payments table and updates the invoice.
   */
  async recordPayment(payment: any, actorUserId?: string): Promise<{ status: string; payment: any }> {
    const supabase = getServerSupabase();
    const timestamp = new Date().toISOString();

    try {
      const amount = Number(payment.amount || 0);

      // Resolve student ID
      let studentId = payment.studentId;
      if (!studentId && payment.studentName) {
        const parts = payment.studentName.trim().split(' ');
        const { data: prof } = await supabase
          .from('profiles')
          .select('user_id, students(id)')
          .ilike('first_name', parts[0])
          .maybeSingle();
        if (prof?.students && prof.students[0]?.id) {
          studentId = prof.students[0].id;
        }
      }

      const paymentPayload = {
        id: payment.id || `PAY-${Date.now()}`,
        invoice_id: payment.invoiceId || null,
        student_id: studentId,
        amount,
        payment_method: (payment.method || 'Bank Transfer').toLowerCase().replace(/\s+/g, '_'),
        transaction_reference: payment.reference || payment.transactionId || `TXN-${Date.now()}`,
        payment_date: payment.date || timestamp.split('T')[0],
        status: 'completed',
        notes: payment.notes || '',
        recorded_by_user_id: actorUserId || null,
        updated_at: timestamp,
      };

      const { data: saved, error } = await supabase
        .from('payments')
        .upsert(paymentPayload, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        logger.warn('Payment upsert warning:', error.message);
      }

      // If tied to an invoice, increment paid_amount
      if (payment.invoiceId) {
        const { data: inv } = await supabase.from('invoices').select('*').eq('id', payment.invoiceId).maybeSingle();
        if (inv) {
          const newPaid = Number(inv.paid_amount || 0) + amount;
          const net = Number(inv.net_amount || inv.total_amount || 0);
          const newBalance = Math.max(0, net - newPaid);
          const newStatus = newBalance <= 0 ? 'paid' : 'partially_paid';

          await supabase
            .from('invoices')
            .update({
              paid_amount: newPaid,
              balance_due: newBalance,
              status: newStatus,
              updated_at: timestamp,
            })
            .eq('id', payment.invoiceId);
        }
      }

      await logAuditEvent({
        actorUserId,
        entityType: 'payment',
        entityId: paymentPayload.id,
        action: 'create',
        newValues: paymentPayload,
      });

      return {
        status: 'recorded',
        payment: {
          ...payment,
          id: paymentPayload.id,
        },
      };
    } catch (err: any) {
      logger.error('Error recording payment in relational service:', err);
      throw err;
    }
  },
};
