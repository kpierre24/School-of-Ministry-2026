export type TabType = 'home' | 'attendance' | 'students' | 'courses' | 'exams' | 'schedule' | 'library' | 'payments' | 'messages' | 'reports' | 'notes';

import { UserRole } from './types/rbac';
export * from './types/rbac';
export * from './types/database';
export type { StudentClassNote } from './utils/notesStorage';

export interface FacultyTeacher {
  id: string;
  name: string;
  title: string;
  role: string;
  bio: string;
  module: string;
  image: string;
  badgeColor: string;
}

export interface GraduationPhoto {
  id: string;
  title: string;
  caption: string;
  cohortYear: string;
  date?: string;
  imageUrl: string;
  category: 'commencement' | 'diploma' | 'prayer' | 'celebration' | 'fellowship';
  featuredQuote?: string;
  scripture?: string;
  studentHonors?: string[];
  imageFit?: 'contain' | 'cover' | 'top';
}

export type AcademicLevel = {
  id: string;
  code: string;
  name: string;
  badge: string;
  sub: string;
  color: string;
  badgeBg: string;
};

export const ACADEMIC_LEVELS: AcademicLevel[] = [
  { 
    id: 'level_1', 
    code: 'Level 1', 
    name: 'Level 1: Foundation Certificate', 
    badge: 'L1: Foundation', 
    sub: 'Modules 1 & 2 (Intro & Evangelism)', 
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  { 
    id: 'level_2', 
    code: 'Level 2', 
    name: 'Level 2: Intermediate Diploma', 
    badge: 'L2: Diploma', 
    sub: 'Modules 3 & 4 (Ethics & Apostolic)', 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  { 
    id: 'level_3', 
    code: 'Level 3', 
    name: 'Level 3: Advanced Degree & License', 
    badge: 'L3: Degree', 
    sub: 'Modules 5 & 6 (Prophetic & Pastors)', 
    color: 'bg-amber-100 text-amber-900 border-amber-300',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  { 
    id: 'level_4', 
    code: 'Level 4', 
    name: 'Level 4: Executive Leadership & Faculty', 
    badge: 'L4: Executive', 
    sub: 'Postgraduate Leadership Cohort', 
    color: 'bg-purple-100 text-purple-900 border-purple-300',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200'
  },
];

export const getDefaultLevelForStudent = (studentName: string, index: number = 0): string => {
  const code = Math.abs(studentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), index)) % 4;
  if (code === 0) return 'level_1';
  if (code === 1) return 'level_2';
  if (code === 2) return 'level_3';
  return 'level_4';
};

export type PaymentRecord = {
  id: string;
  studentId: string; // Foreign Key / UUID
  studentName?: string;
  student?: {
    id: string;
    name: string;
    email?: string;
  };
  cohortId?: string;
  email?: string;
  phone?: string;
  moduleTrack: string;
  totalTuition: number;
  amountPaid: number;
  status: 'Paid In Full' | 'Partial' | 'Past Due' | 'Pending Review';
  lastPaymentDate: string;
  paymentMethod: 'Credit Card' | 'Bank Transfer' | 'Zelle' | 'Check' | 'Scholarship' | 'Cash' | 'PayPal' | 'Stripe';
  notes?: string;
  receiptUrl?: string;
  receiptName?: string;
  receiptNumber?: string;
  paymentPlan?: PaymentPlanType;
  isDemo?: boolean;
};

export type FinancialAdjustmentType = 'discount' | 'scholarship' | 'refund' | 'adjustment' | 'fee_waiver' | 'late_fee';

export type FinancialAdjustment = {
  id: string; // ADJ-2026-XXXX
  invoiceId: string;
  studentId: string; // Foreign Key / UUID
  studentName?: string;
  student?: {
    id: string;
    name: string;
  };
  type: FinancialAdjustmentType;
  categoryName: string; // e.g. "Five-Fold Ministry Scholarship", "Early Bird Discount", "Course Drop Refund"
  amount: number; // positive reduces invoice balance, negative increases
  appliedDate: string;
  authorizedBy: string;
  notes?: string;
  receiptOrDocRef?: string;
};

export type Invoice = {
  id: string; // INV-2026-XXXX
  studentId: string; // Foreign Key / UUID PK
  studentName?: string;
  student?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  email?: string;
  phone?: string;
  moduleTrack: string;
  term?: string; // e.g. "2026 Semester 1"
  academicYear?: string;
  issueDate: string;
  dueDate: string;
  totalTuition: number;
  discounts: number;
  scholarships: number;
  refunds?: number;
  adjustments?: number;
  netTuition: number; // totalTuition - discounts - scholarships - adjustments + refunds
  amountPaid: number; // sum of completed transactions
  outstandingBalance: number; // netTuition - amountPaid
  paymentPlan: 'Pay In Full' | 'Monthly Installments' | 'Custom Plan' | string;
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Past Due' | 'Refunded' | 'Cancelled';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentTransaction = {
  id: string; // TXN-2026-XXXX
  invoiceId: string;
  studentId: string; // Foreign Key / UUID
  studentName?: string;
  student?: {
    id: string;
    name: string;
  };
  amount: number;
  paymentDate: string;
  paymentMethod: 'Credit Card' | 'Bank Transfer' | 'Zelle' | 'Check' | 'Scholarship' | 'Cash' | 'PayPal' | 'Stripe' | string;
  paymentReference?: string; // wire confirmation, check #, transaction reference
  receiptNumber: string; // REC-2026-XXXX
  status: 'Completed' | 'Pending' | 'Failed' | 'Refunded';
  notes?: string;
  recordedBy?: string;
  reconciliationStatus?: 'Reconciled' | 'Unreconciled' | 'Discrepancy';
  reconciledAt?: string;
  reconciledBy?: string;
  depositBatchId?: string;
  createdAt?: string;
};

export type Receipt = {
  id: string; // REC-2026-XXXX
  receiptNumber: string;
  paymentId: string; // Links to transaction ID
  invoiceId: string;
  studentId: string; // Foreign Key / UUID
  studentName?: string;
  student?: {
    id: string;
    name: string;
  };
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  paymentReference?: string;
  issuedAt: string;
  issuedBy?: string;
  academicTerm?: string;
  courseOrModule?: string;
  totalTuitionBilled?: number;
  discountsAndScholarships?: number;
  balanceRemaining?: number;
  verificationCode?: string;
  notes?: string;
};

import { AuditLogEntry, AuditLogCategory, AuditActionCode } from './lib/auditLogger';
export type { AuditLogEntry, AuditLogCategory, AuditActionCode };
export { logActivity, logAuditEvent, getAuditLogs } from './lib/auditLogger';

export type FinancialAuditLog = {
  id: string;
  timestamp: string;
  action: 'INVOICE_CREATED' | 'PAYMENT_RECORDED' | 'ADJUSTMENT_APPLIED' | 'REFUND_ISSUED' | 'PAYMENT_RECONCILED' | 'INVOICE_UPDATED' | 'SCHOLARSHIP_AWARDED';
  actorName: string;
  actorRole: string;
  studentId: string;
  studentName: string;
  entityId: string;
  entityType: 'invoice' | 'transaction' | 'receipt' | 'adjustment';
  amount?: number;
  details: string;
  metadata?: Record<string, any>;
};

export type StudentProfile = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  enrolledModule: string;
  enrolmentDate: string;
  status: 'active' | 'probation' | 'graduated' | 'inactive';
};

export type MediaResource = {
  id: string;
  title: string;
  speaker: string;
  duration: string;
  type: 'audio' | 'video';
  url: string;
  description?: string;
  dateAdded?: string;
  chapters?: { time: number; title: string }[];
};

export type Course = {
  id: string;
  code: string;
  title: string;
  instructor: string;
  credits: number;
  description: string;
  scheduleDays: string;
  location: string;
  topics: string[];
  enrolledCount: number;
  mediaResources?: MediaResource[];
  expiryDate?: string; // YYYY-MM-DD
  cohortId?: string;
};

export type QuizQuestionOption = {
  id: string;
  text: string;
};

export type QuizQuestion = {
  id: string;
  questionText: string;
  type?: 'multiple_choice' | 'true_false';
  options: QuizQuestionOption[];
  correctOptionId: string;
  weight: number; // points for this question (e.g. 5, 10, 20)
  explanation?: string;
};

export type QuizAssignment = {
  id: string;
  title: string;
  courseCode?: string;
  moduleTrack?: string;
  description?: string;
  classDayId?: string;
  questions: QuizQuestion[];
  totalPoints: number; // sum of weights
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  isPublished?: boolean;
  isTemplate?: boolean;
  shareCode: string; // e.g. "qz_9f8a2" for shareable links
  timeLimitMinutes?: number;
  quizData?: QuizAssignment;
};

export type QuizSubmissionResponse = {
  questionId: string;
  selectedOptionId: string;
  isCorrect?: boolean;
  pointsEarned: number;
};

export type QuizSubmission = {
  id: string;
  quizId: string;
  quizTitle?: string;
  studentName: string;
  studentEmail?: string;
  submittedAt: string;
  responses: QuizSubmissionResponse[];
  totalScore?: number;
  maxPoints?: number;
  scorePercentage?: number;
  score: number;
  totalPossible: number;
  percentage: number;
};

export type ExamItem = {
  id: string;
  title: string;
  courseCode: string;
  date: string;
  maxPoints: number;
  weight: string;
  description: string;
};

export type ScheduleItem = {
  id: string;
  classDayId?: string;
  cohortId?: string;
  title: string;
  courseCode: string;
  moduleName?: string;
  date: string; // YYYY-MM-DD
  timeSlot: string;
  instructor: string;
  room: string;
  status: 'upcoming' | 'completed' | 'live';
  period?: string; // e.g. "1st Period", "2nd Period", "3rd Period", "4th Period", "5th Period", "Evening"
  zoomUrl?: string;
  recordingUrl?: string;
  postClassMaterialsUrl?: string;
  meetingPasscode?: string;
};

export type ResourceVersion = {
  version: string;
  date: string;
  note: string;
  author?: string;
  downloadUrl?: string;
};

export type LibraryResource = {
  id: string;
  title: string;
  category: string;
  author: string;
  courseCode: string;
  format: string;
  size: string;
  summary: string;
  downloadUrl?: string;
  isBorrowable?: boolean;
  fullContent?: string;
  fileDataUrl?: string;
  fileName?: string;
  mimeType?: string;
  keyTakeaways?: string[];
  aiEvaluated?: boolean;
  uploadedAt?: string;
  downloadCount?: number;
  versionsHistory?: ResourceVersion[];
  version?: string;
  audience?: string;
  moduleTrack?: string;
  isRequiredReading?: boolean;
  weekNumber?: number;
  completedByStudents?: string[];
  scriptureReferences?: string[];
};

export type CustomAssignment = {
  id: string;
  title: string;
  courseCode?: string;
  moduleTrack?: string;
  cohortId?: string;
  description: string;
  startDate?: string;
  dueDate: string;
  maxPoints: number;
  points?: number;
  createdAt: string;
  teacherAttachmentUrl?: string;
  teacherAttachmentName?: string;
  type?: 'document' | 'quiz';
  quizData?: QuizAssignment;
  isDemo?: boolean;
  isDraft?: boolean;
  published?: boolean;
};

export type GradeLifecycleStatus = 'SUBMITTED' | 'GRADED' | 'MODERATION' | 'RELEASED' | 'LOCKED' | 'submitted' | 'graded' | 'moderation' | 'released' | 'locked';

export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  studentId?: string; // Primary Foreign Key (UUID)
  studentName?: string; // Display Attribute
  student?: {
    id: string;
    name: string;
    email?: string;
  };
  submittedAt: string;
  
  // Student's response upload
  studentFileUrl?: string;
  studentFileName?: string;
  studentFileType?: string;
  studentFiles?: { name: string; url: string; type?: string }[];
  studentNotes?: string;
  studentTypedResponse?: string;
  
  // Quiz auto-graded responses
  quizSubmissionData?: QuizSubmission;

  // Teacher's correction, evaluation, and corrected document upload
  teacherCorrectedFileUrl?: string;
  teacherCorrectedFileName?: string;
  teacherCorrectedFileType?: string;
  teacherFeedback?: string;
  score?: number;
  status: GradeLifecycleStatus | 'Submitted' | 'Graded' | 'Correction Returned' | 'Pending Review';
  updatedAt: string;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type?: string;
  eventType?: string;
  category?: string;
  targetRole?: 'admin' | 'teacher' | 'student' | 'all';
  studentId?: string;
  studentName?: string;
  assignmentId?: string;
  courseOfferingId?: string;
  createdAt: string;
  read: boolean;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  actionTab?: TabType;
  actionUrl?: string;
  channelSent?: ('portal' | 'in_app' | 'email' | 'sms' | 'push' | 'whatsapp')[];
  deliveryLogs?: any[];
  channelDelivery?: any;
  metadata?: Record<string, any>;
};

export type AttendanceRecord = {
  id?: string;
  studentId?: string; // Primary Foreign Key (UUID)
  name?: string; // Display Attribute
  studentName?: string; // Display Attribute
  student?: {
    id: string;
    name: string;
    email?: string;
    photoUrl?: string | null;
  };
  timestamp: string;
  sessionDate?: string;
  capturedAt?: string;
  score: string;
  classDay: string;
  present: boolean;
  manualOverride?: boolean;
  locked?: boolean;
  cohortId?: string;
  notes?: string;
  status?: string;
};

export type ClassDay = {
  id: string;
  name: string;
  cohortId?: string;
  academicYear?: number;
};

export type StudentSummary = {
  id?: string; // Primary Key (UUID)
  name: string; // Display Attribute
  studentNumber?: string;
  totalDays: number;
  attendanceByDay: Record<string, { present: boolean; timestamp?: string; score?: string }>;
  rate: number;
  attended: number;
  avgScore: number | null;
  note?: string;
  photoUrl?: string;
  levelId: string;
  email?: string;
  phone?: string;
  enrolledModule?: string;
  cohortId?: string;
};

export type MessagePriority = 'normal' | 'important' | 'urgent';
export type MessageCategory = 'general' | 'assignment' | 'attendance' | 'tuition' | 'exam' | 'technical';

export type MessageAttachment = {
  name: string;
  url: string;
  type?: string;
};

export type MessageReply = {
  id: string;
  senderName: string;
  senderRole: UserRole | 'student' | 'teacher' | 'admin';
  senderEmail?: string;
  senderPhotoUrl?: string;
  message: string;
  attachments?: MessageAttachment[];
  createdAt: string;
};

export type AppMessage = {
  id: string;
  subject: string;
  category: MessageCategory;
  priority: MessagePriority;
  senderName: string;
  senderRole: UserRole | 'student' | 'teacher' | 'admin';
  senderEmail?: string;
  senderStudentId?: string;
  recipientType: 'admin' | 'teacher' | 'student' | 'all_staff';
  recipientName?: string; // e.g. "All Administration & Faculty", "Headmaster / Dean", "Apostolic Ministry Faculty" or specific student name
  recipientEmail?: string;
  courseCode?: string;
  content: string;
  attachments?: MessageAttachment[];
  createdAt: string;
  updatedAt: string;
  isReadByRecipient: boolean;
  isReadBySender: boolean;
  status: 'open' | 'in_progress' | 'resolved' | 'archived';
  replies: MessageReply[];
};

export type PaymentPlanType = 'full' | 'monthly' | 'scholarship' | 'custom' | 'Monthly Installments' | 'Pay In Full' | 'Financial Aid / Scholarship';

export type ExcusedAbsenceRequest = {
  id: string;
  studentId?: string; // Foreign Key / UUID
  studentName?: string;
  student?: {
    id: string;
    name: string;
  };
  classDayId: string;
  classDayName?: string;
  date?: string;
  reason: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'Pending' | 'Approved' | 'Rejected';
  documentUrl?: string;
  proofDocumentName?: string;
  approvedBy?: string;
  reviewedBy?: string;
  reviewNote?: string;
};

export type AttendanceCorrectionAudit = {
  id: string;
  studentId?: string; // Foreign Key / UUID
  studentName?: string;
  student?: {
    id: string;
    name: string;
  };
  classDayId: string;
  previousStatus: string;
  newStatus: string;
  changedBy: string;
  reason: string;
  timestamp: string;
};

export type PINCheckinSession = {
  id: string;
  classDayId: string;
  pin: string;
  active: boolean;
  expiresAt: string;
  checkedInStudents: string[];
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  author?: string;
  sentBy?: string;
  targetAudience?: 'all' | 'students' | 'faculty';
  targetRole?: 'all' | 'students' | 'student' | 'faculty' | 'admin' | 'teacher';
  targetCohort?: string;
  targetModule?: string;
  targetPaymentStatus?: string;
  templateCategory?: string;
  createdAt: string;
  scheduledFor?: string;
  isPublished?: boolean;
  priority?: 'normal' | 'urgent';
  readByStudentNames?: string[];
  channels?: ('portal' | 'email' | 'sms' | 'whatsapp')[];
};

export type StudentTimelineEvent = {
  id: string;
  type: string;
  title: string;
  date: string;
  description?: string;
  studentName?: string;
  badgeColor?: string;
};

export type StudentNote = {
  id: string;
  studentName: string;
  author: string;
  authorRole: 'admin' | 'teacher';
  text: string;
  date?: string;
  createdAt?: string;
  isPrivate?: boolean;
};

export type GraduationChecklist = {
  id?: string;
  studentName: string;
  allModulesPassed?: boolean;
  attendanceVerified?: boolean;
  tuitionCleared?: boolean;
  practicumCompleted?: boolean;
  approvedForGraduation?: boolean;
  attendanceRate?: number;
  averageGrade?: number;
  isReadyForGraduation?: boolean;
  meetsAttendance?: boolean;
  meetsGrade?: boolean;
  meetsAssignments?: boolean;
  assignmentsCompleted?: number;
  totalAssignments?: number;
  tuitionPaid?: boolean;
};

export type CertificateRecord = {
  id: string;
  studentName: string;
  levelName: string;
  issueDate: string;
  certificateNumber: string;
  signedBy: string;
  pdfUrl?: string;
};

export interface Cohort {
  id: string; // e.g., 'cohort_2026', 'cohort_2027'
  name: string; // 'Class of 2026'
  academicYear: number; // 2026
  term?: string; // 'Spring / Term 2'
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isArchived: boolean;
  isCurrent: boolean;
  description?: string;
  sheetUrl?: string; // Optional custom sheet URL for this cohort
  sheetTabPattern?: string; // e.g., '2026', 'Attendance_2026', 'Class of 2026'
  studentCount?: number;
  targetTuition?: number;
  themeColor?: string;
}

export const DEFAULT_COHORTS: Cohort[] = [
  {
    id: 'cohort_2026',
    name: 'Class of 2026',
    academicYear: 2026,
    term: 'Spring 2026 • Term 2',
    startDate: '2026-01-10',
    endDate: '2026-12-15',
    isArchived: false,
    isCurrent: true,
    description: 'Current active ministerial diploma & certificate cohort (Foundation to Executive Leadership).',
    themeColor: 'indigo',
    sheetTabPattern: '2026'
  },
  {
    id: 'cohort_2027',
    name: 'Class of 2027',
    academicYear: 2027,
    term: 'Fall 2026 / Spring 2027',
    startDate: '2027-01-09',
    endDate: '2027-12-14',
    isArchived: false,
    isCurrent: false,
    description: 'Upcoming academic year cohort for prospective & enrolled ministry students.',
    themeColor: 'emerald',
    sheetTabPattern: '2027'
  }
];

export interface InstallmentMilestone {
  id: string;
  milestoneNumber: number;
  dueDate: string;
  amount: number;
  isPaid: boolean;
  paidDate?: string;
  receiptNumber?: string;
  notes?: string;
}

export interface StudentInstallmentPlan {
  id: string;
  studentName: string;
  studentId: string;
  totalTuition: number;
  initialDeposit: number;
  remainingBalance: number;
  frequency: 'monthly' | 'biweekly';
  totalMilestones: number;
  milestones: InstallmentMilestone[];
  createdAt: string;
  status: 'active' | 'completed' | 'defaulted';
  notes?: string;
}

export interface SponsorshipDonation {
  id: string;
  sponsorName: string;
  organization?: string;
  sponsorEmail?: string;
  sponsorPhone?: string;
  recipientStudentName: string; // or 'General Ministry Fund'
  amount: number;
  date: string;
  sponsorshipType: 'Full Tuition' | 'Partial Grant (50%)' | 'Custom Ministry Grant' | 'Emergency Aid';
  notes?: string;
  receiptNumber: string;
  status: 'verified' | 'pledged';
}

export interface OfflineQueueItem {
  id: string;
  type: 'attendance_checkin' | 'student_note' | 'grade_update' | 'payment_record';
  description: string;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  retryCount: number;
  payload: any;
}

