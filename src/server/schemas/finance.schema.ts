import { z } from "zod";

// Zod schema for recording a payment transaction
export const RecordPaymentSchema = z.object({
  payment: z.object({
    invoiceId: z.string().uuid("Invalid UUID format for invoiceId"),
    amount: z.number()
      .positive("Amount must be a positive number")
      .refine((val) => val > 0, "Amount must be strictly greater than 0"),
    paymentMethod: z.enum([
      'stripe', 'card', 'bank_transfer', 'cash', 'check', 'scholarship', 'other'
    ]).refine(val => ['stripe', 'card', 'bank_transfer', 'cash', 'check', 'scholarship', 'other'].includes(val), {
      message: "Unsupported payment method"
    }),
    paymentDate: z.string().datetime({ message: "Invalid ISO date format for paymentDate" }),
    transactionReference: z.string().max(100, "Reference excessively long").optional(),
    
    // Legacy support / loose bindings in the router:
    studentId: z.string().uuid().optional(),
    studentName: z.string().optional(),
  }).strict().optional(),
  
  transaction: z.object({
    invoiceId: z.string().uuid("Invalid UUID format for invoiceId"),
    amount: z.number()
      .positive("Amount must be a positive number")
      .refine((val) => val > 0, "Amount must be strictly greater than 0"),
    paymentMethod: z.enum([
      'stripe', 'card', 'bank_transfer', 'cash', 'check', 'scholarship', 'other'
    ]).refine(val => ['stripe', 'card', 'bank_transfer', 'cash', 'check', 'scholarship', 'other'].includes(val), {
      message: "Unsupported payment method"
    }),
    paymentDate: z.string().datetime({ message: "Invalid ISO date format for paymentDate" }),
    transactionReference: z.string().max(100, "Reference excessively long").optional(),

    studentId: z.string().uuid().optional(),
    studentName: z.string().optional(),
  }).strict().optional(),
}).refine(data => data.payment !== undefined || data.transaction !== undefined, {
  message: "Request body must contain either 'payment' or 'transaction' object",
});
