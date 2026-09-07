import { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * HTEIM Centralized Request Validation Schemas
 */

// 1. Student Creation/Enrollment Schema
export const StudentCreateSchema = z.object({
  name: z.string().trim().min(2, "Student name must be at least 2 characters long"),
  level: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email format").optional().or(z.literal("")),
  photoUrl: z.string().trim().url("Invalid photo URL format").optional().or(z.literal("")),
});

// 2. Payment/Transaction Record Schema
export const PaymentCreateSchema = z.object({
  transaction: z.object({
    invoiceId: z.string().trim().min(1, "Invoice ID is required"),
    amount: z.number().positive("Transaction amount must be a positive number"),
    paymentDate: z.string().trim().optional(),
    paymentMethod: z.string().trim().optional(),
    paymentReference: z.string().trim().optional(),
    receiptNumber: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  }),
  userEmail: z.string().trim().email().optional(),
});

// 3. Attendance Record Checkin Schema
export const AttendanceRecordSchema = z.object({
  studentName: z.string().trim().min(1, "Student name is required"),
  date: z.string().trim().optional(),
  classDayId: z.string().trim().optional(),
  status: z.enum(["Present", "Absent", "Excused", "Late", "excused_absence"]),
  notes: z.string().trim().optional(),
}).refine((data) => data.date || data.classDayId, {
  message: "Either date or classDayId must be specified for attendance check-in",
  path: ["date"],
});

// 4. Grade Submission/Evaluation Schema
export const GradeSubmissionSchema = z.object({
  submissionId: z.string().trim().optional(),
  studentName: z.string().trim().optional(),
  score: z.number().min(0, "Score cannot be negative").max(100, "Score cannot exceed 100"),
  feedback: z.string().trim().optional(),
  rubricScores: z.record(z.string(), z.any()).optional(),
}).refine((data) => data.submissionId || data.studentName, {
  message: "Either submissionId or studentName is required to log a grade override",
  path: ["submissionId"],
});

// 5. Assignment/Quiz Submission Schema
export const AssignmentSubmissionSchema = z.object({
  submission: z.object({
    assignmentId: z.string().trim().min(1, "Assignment ID is required"),
    studentName: z.string().trim().min(1, "Student name is required"),
    content: z.string().optional(),
    fileUrl: z.string().trim().optional(),
    fileName: z.string().trim().optional(),
    score: z.number().optional(),
    grade: z.number().optional(),
    feedback: z.string().optional(),
  }),
});

// 6. Role Change/Credential Schema (Admin role adjustments)
export const RoleChangeSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  role: z.enum([
    "super_admin",
    "admin",
    "registrar",
    "finance_officer",
    "lecturer",
    "librarian",
    "viewer",
    "student",
  ]),
  studentName: z.string().trim().optional(),
  studentId: z.string().trim().optional(),
});

/**
 * Validation Middleware helper
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      // Replace req.body with parsed/sanitized value
      req.body = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation Failed",
          details: err.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}
