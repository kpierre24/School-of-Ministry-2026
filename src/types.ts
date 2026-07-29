export type TabType = 'home' | 'attendance' | 'students' | 'courses' | 'exams' | 'schedule' | 'library' | 'payments';

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
  paymentMethod: 'Credit Card' | 'Bank Transfer' | 'Zelle' | 'Check' | 'Scholarship' | 'Cash';
  notes?: string;
  receiptUrl?: string;
  receiptName?: string;
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
  type: 'due_date' | 'past_due' | 'graded' | 'submission' | 'general';
  targetRole?: 'admin' | 'teacher' | 'student' | 'all';
  studentName?: string;
  assignmentId?: string;
  createdAt: string;
  read: boolean;
  priority?: 'high' | 'normal' | 'low';
  actionTab?: TabType;
};

