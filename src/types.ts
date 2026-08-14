export type TabType = 'home' | 'attendance' | 'students' | 'courses' | 'exams' | 'schedule' | 'library' | 'payments' | 'messages';

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
  studentName: string;
  studentId: string;
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
};

export type CustomAssignment = {
  id: string;
  title: string;
  courseCode?: string;
  moduleTrack?: string;
  description: string;
  startDate?: string;
  dueDate: string;
  maxPoints: number;
  createdAt: string;
  teacherAttachmentUrl?: string;
  teacherAttachmentName?: string;
  type?: 'document' | 'quiz';
  quizData?: QuizAssignment;
};

export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  studentName: string;
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
  status: 'Submitted' | 'Graded' | 'Correction Returned' | 'Pending Review';
  updatedAt: string;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: 'due_date' | 'past_due' | 'graded' | 'submission' | 'general' | 'at_risk_attendance' | 'payment_past_due';
  targetRole?: 'admin' | 'teacher' | 'student' | 'all';
  studentName?: string;
  assignmentId?: string;
  createdAt: string;
  read: boolean;
  priority?: 'high' | 'normal' | 'low';
  actionTab?: TabType;
  channelSent?: ('portal' | 'email' | 'sms' | 'whatsapp')[];
};

export type AttendanceRecord = {
  name: string;
  studentName?: string;
  timestamp: string;
  capturedAt?: string;
  score: string;
  classDay: string;
  present: boolean;
  manualOverride?: boolean;
  locked?: boolean;
};

export type ClassDay = {
  id: string;
  name: string;
};

export type StudentSummary = {
  name: string;
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
  senderRole: 'student' | 'teacher' | 'admin';
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
  senderRole: 'student' | 'teacher' | 'admin';
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
  studentName: string;
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
  studentName: string;
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

