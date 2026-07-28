import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Award, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  Filter,
  Sparkles,
  AlertCircle,
  FileText,
  User,
  GraduationCap,
  Calendar,
  BookOpen,
  Plus,
  Upload,
  FileUp,
  FileCheck,
  Edit3,
  Trash2,
  Eye,
  MessageSquare,
  Clock,
  ArrowRight,
  Check,
  X,
  Paperclip,
  ChevronRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

import { UserRole } from '../lib/userAuth';
import { CustomAssignment, AssignmentSubmission, AppNotification } from '../types';

type StudentScoreRecord = {
  name: string;
  scoreStr: string;
  percentage: number | null;
  attendedSessions: number;
  totalSessions: number;
  attendanceRate: number;
  attendanceByDay?: Record<string, { present: boolean; timestamp?: string; score?: string }>;
};

interface ExamsTabProps {
  students: StudentScoreRecord[];
  allQuizSheets: string[];
  rubricScores: Record<string, { participation: number; scripture: number; assignment: number }>;
  onUpdateRubric: (studentName: string, key: 'participation' | 'scripture' | 'assignment', val: number) => void;
  userRole?: UserRole;
  currentStudentName?: string;
  onNotificationCreated?: (notif: AppNotification) => void;
  customAssignments: CustomAssignment[];
  setCustomAssignments: React.Dispatch<React.SetStateAction<CustomAssignment[]>>;
  submissions: AssignmentSubmission[];
  setSubmissions: React.Dispatch<React.SetStateAction<AssignmentSubmission[]>>;
}

export const INITIAL_ASSIGNMENTS: CustomAssignment[] = [
  {
    id: 'ASG-100',
    title: 'Biblical Worldview & Apologetics Reflection Paper',
    courseCode: 'MIN-100',
    moduleTrack: 'Biblical Foundations & Hermeneutics',
    description: 'A 2-page critical essay reflecting on foundational worldview principles and responding to contemporary secular philosophical objections.',
    dueDate: '2026-07-20',
    maxPoints: 100,
    createdAt: '2026-07-05'
  },
  {
    id: 'ASG-101',
    title: 'Exegesis Paper: Hermeneutical Principles of Romans 8',
    courseCode: 'MIN-101',
    moduleTrack: 'Biblical Foundations & Hermeneutics',
    description: 'Provide a comprehensive 4-page exegetical analysis of Romans 8:14-28. Analyze key Greek terminology (e.g., "huiothesia", "prothesis"), historical context, and practical ministerial applications for modern believers.',
    dueDate: '2026-08-10',
    maxPoints: 100,
    createdAt: '2026-07-15',
    teacherAttachmentName: 'Romans_8_Exegesis_Rubric.pdf',
    teacherAttachmentUrl: 'data:text/plain;base64,Uk9NQU5TIDggRVhFR0VTSVMgUlVCUklDAjEuIEdyZWVrIFRlcm1pbm9sb2d5IChDMikNCjIuIENvbnRleHQgJiBUaGVvbG9neSAoQzMpDQozLiBNaW5pc3RlcmlhbCBBcHBsaWNhdGlvbiAocDQuKQ=='
  },
  {
    id: 'ASG-102',
    title: 'Homiletics Expository Sermon Outline & Reflection',
    courseCode: 'MIN-202',
    moduleTrack: 'Practical Ministry & Preaching',
    description: 'Construct a 3-point expository sermon outline on Matthew 28:18-20. Include an introductory hook, main points supported by scripture cross-references, and a clear altar call application.',
    dueDate: '2026-08-20',
    maxPoints: 100,
    createdAt: '2026-07-18',
    teacherAttachmentName: 'Expository_Sermon_Template.docx'
  },
  {
    id: 'ASG-103',
    title: 'Field Ministry Practicum & Evangelism Journal',
    courseCode: 'MIN-303',
    moduleTrack: 'Global Missions & Outreach',
    description: 'Document 5 hours of practical community outreach, visitation, or prayer ministry. Detail individual conversations, prayer requests, and field ministry observations.',
    startDate: '2026-06-28',
    dueDate: '2026-08-28',
    maxPoints: 100,
    createdAt: '2026-07-20'
  }
];

export const INITIAL_SUBMISSIONS: AssignmentSubmission[] = [
  {
    id: 'SUB-101-ABurke',
    assignmentId: 'ASG-101',
    studentName: 'A. Burke',
    submittedAt: '2026-07-22 14:30',
    studentFileName: 'A_Burke_Romans8_Exegesis_Final.pdf',
    studentFileType: 'application/pdf',
    studentNotes: 'Attached is my completed exegesis paper focusing on Romans 8:28-30 and divine purpose in ministry trials.',
    score: 96,
    teacherFeedback: 'Outstanding work! Your breakdown of "prothesis" in verse 28 was exceptional. I attached my corrected document with a few structural suggestions on page 3.',
    teacherCorrectedFileName: 'A_Burke_Romans8_Exegesis_GRADED_CORRECTED.pdf',
    teacherCorrectedFileType: 'application/pdf',
    teacherCorrectedFileUrl: 'data:text/plain;base64,R1JBREVEIEFORCBDT1JSRUNURUQgQllBIEZBQ1VMVFk6DQpTY29yZTogOTYvMTAwLg0KR3JlYXQgZXhlZ2VzaXMgYW5kIHNjcmlwdHVyYWwgY29udGV4dC4=',
    status: 'Correction Returned',
    updatedAt: '2026-07-23 10:15'
  },
  {
    id: 'SUB-101-CDavis',
    assignmentId: 'ASG-101',
    studentName: 'C. Davis',
    submittedAt: '2026-07-24 09:15',
    studentFileName: 'C_Davis_Romans_Exegesis_Paper.docx',
    studentFileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    studentNotes: 'Submitted for instructor evaluation.',
    status: 'Submitted',
    updatedAt: '2026-07-24 09:15'
  },
  {
    id: 'SUB-102-EEvans',
    assignmentId: 'ASG-102',
    studentName: 'E. Evans',
    submittedAt: '2026-07-23 11:00',
    studentFileName: 'E_Evans_Homiletics_Outline.pdf',
    studentFileType: 'application/pdf',
    studentNotes: 'Sermon title: The Authority of the Believer in the Great Commission.',
    score: 92,
    teacherFeedback: 'Very clear sermon outline! Great transitions between points. Check attached file for formatting notes.',
    teacherCorrectedFileName: 'E_Evans_Homiletics_Outline_CORRECTED.pdf',
    teacherCorrectedFileType: 'application/pdf',
    teacherCorrectedFileUrl: 'data:text/plain;base64,R1JBREVEIEJZIElOU1RSVUNUT1I6IDkyLzEwMC4gQ2xlYXIgZXhwb3NpdG9yeSBvdXRsaW5lLg==',
    status: 'Correction Returned',
    updatedAt: '2026-07-24 16:20'
  }
];

const parseScorePercentage = (scoreStr?: string): number | null => {
  if (!scoreStr) return null;
  const str = scoreStr.trim();
  if (!str) return null;

  if (str.includes('/')) {
    const parts = str.split('/');
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (!isNaN(num) && !isNaN(den) && den > 0) {
      return (num / den) * 100;
    }
  }

  if (str.includes('%')) {
    const num = parseFloat(str.replace('%', ''));
    if (!isNaN(num)) return num;
  }

  const num = parseFloat(str);
  if (!isNaN(num)) return num;

  return null;
};

export const ExamsTab: React.FC<ExamsTabProps> = ({
  students,
  allQuizSheets,
  rubricScores,
  onUpdateRubric,
  userRole = 'admin',
  currentStudentName,
  onNotificationCreated,
  customAssignments,
  setCustomAssignments,
  submissions,
  setSubmissions
}) => {
  const isStudent = userRole === 'student';
  const isTeacherOrAdmin = userRole === 'admin' || userRole === 'teacher';

  // Sub tab view: 'assignments' (default) vs 'quizzes'
  const [subTab, setSubTab] = useState<'assignments' | 'quizzes'>('assignments');

  // Filters & Selected Assignment
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | 'perfect' | 'passed' | 'failed'>('all');

  // Modals
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showDirectStudentModal, setShowDirectStudentModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; url?: string; content?: string } | null>(null);

  // Active items for modals
  const [activeAssignmentForStudent, setActiveAssignmentForStudent] = useState<CustomAssignment | null>(null);
  const [activeSubmissionForCorrection, setActiveSubmissionForCorrection] = useState<{
    submission?: AssignmentSubmission;
    assignment: CustomAssignment;
    studentName: string;
  } | null>(null);

  // Form States
  // 1. New Assignment Form
  const [newAsgTitle, setNewAsgTitle] = useState('');
  const [newAsgModule, setNewAsgModule] = useState('MIN-101 Biblical Foundations');
  const [newAsgStartDate, setNewAsgStartDate] = useState('');
  const [newAsgDueDate, setNewAsgDueDate] = useState('2026-08-15');
  const [newAsgMaxPoints, setNewAsgMaxPoints] = useState(100);
  const [newAsgDescription, setNewAsgDescription] = useState('');
  const [newAsgAttachmentName, setNewAsgAttachmentName] = useState('');
  const [newAsgAttachmentUrl, setNewAsgAttachmentUrl] = useState('');

  // 2. Student Upload Form
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [uploadFileType, setUploadFileType] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadTypedResponse, setUploadTypedResponse] = useState('');

  // 3. Teacher Correction Form
  const [correctionScore, setCorrectionScore] = useState<number>(95);
  const [correctionFeedback, setCorrectionFeedback] = useState('');
  const [correctedFileName, setCorrectedFileName] = useState('');
  const [correctedFileUrl, setCorrectedFileUrl] = useState('');
  const [correctedFileType, setCorrectedFileType] = useState('');

  // 4. Direct Upload / Edit Student Upload Form (Teacher capability)
  const [targetStudentName, setTargetStudentName] = useState('');
  const [targetAssignmentId, setTargetAssignmentId] = useState('');
  const [directStudentFileName, setDirectStudentFileName] = useState('');
  const [directStudentFileUrl, setDirectStudentFileUrl] = useState('');
  const [directStudentNotes, setDirectStudentNotes] = useState('');

  // Identify Student Profile
  const studentRecord = students.find(s => {
    if (currentStudentName) {
      return s.name.toLowerCase().trim() === currentStudentName.toLowerCase().trim() ||
             s.name.toLowerCase().includes(currentStudentName.toLowerCase().trim());
    }
    return false;
  }) || (isStudent ? students[0] : null);

  const activeStudentName = studentRecord?.name || currentStudentName || 'Student Candidate';

  // Grade Metrics for Quizzes Tab
  const studentsWithQuiz = students.filter(s => s.percentage !== null);
  const totalEvaluated = studentsWithQuiz.length;
  const sumScores = studentsWithQuiz.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
  const classExamAvg = totalEvaluated > 0 ? Math.round(sumScores / totalEvaluated) : 0;
  const perfectScores = studentsWithQuiz.filter(s => (s.percentage || 0) >= 100).length;
  const passedScores = studentsWithQuiz.filter(s => (s.percentage || 0) >= 70 && (s.percentage || 0) < 100).length;
  const failedScores = studentsWithQuiz.filter(s => (s.percentage || 0) < 70).length;

  const displayedStudents = useMemo(() => {
    let list = isStudent && studentRecord ? [studentRecord] : students;
    if (searchQuery.trim()) {
      list = list.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
    }
    if (gradeFilter === 'passed') {
      list = list.filter(s => (s.percentage || 0) >= 70 && (s.percentage || 0) < 100);
    } else if (gradeFilter === 'perfect') {
      list = list.filter(s => (s.percentage || 0) >= 100);
    } else if (gradeFilter === 'failed') {
      list = list.filter(s => (s.percentage || 0) < 70);
    }
    return list;
  }, [isStudent, studentRecord, students, searchQuery, gradeFilter]);

  const getGradeLetter = (pct: number | null) => {
    if (pct === null) return 'N/A';
    if (pct >= 100) return 'A+';
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  };

  // Helper File Upload Handler
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (fileDataUrl: string, fileName: string, fileType: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const resultUrl = event.target?.result as string;
      onComplete(resultUrl, file.name, file.type);
    };
    reader.readAsDataURL(file);
  };

  // HANDLERS:
  // 1. Create or Edit Manual Assignment
  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsgTitle.trim()) return;

    if (editingAssignmentId) {
      setCustomAssignments(prev => prev.map(asg => {
        if (asg.id === editingAssignmentId) {
          return {
            ...asg,
            title: newAsgTitle.trim(),
            moduleTrack: newAsgModule,
            startDate: newAsgStartDate || undefined,
            dueDate: newAsgDueDate,
            maxPoints: newAsgMaxPoints,
            description: newAsgDescription.trim(),
            teacherAttachmentName: newAsgAttachmentName || undefined,
            teacherAttachmentUrl: newAsgAttachmentUrl || undefined
          };
        }
        return asg;
      }));
    } else {
      const newAssignment: CustomAssignment = {
        id: `ASG-${Date.now().toString().slice(-4)}`,
        title: newAsgTitle.trim(),
        moduleTrack: newAsgModule,
        startDate: newAsgStartDate || undefined,
        dueDate: newAsgDueDate,
        maxPoints: newAsgMaxPoints,
        description: newAsgDescription.trim(),
        createdAt: new Date().toISOString().split('T')[0],
        teacherAttachmentName: newAsgAttachmentName || undefined,
        teacherAttachmentUrl: newAsgAttachmentUrl || undefined
      };
      setCustomAssignments(prev => [newAssignment, ...prev]);
    }

    handleCloseAddAssignmentModal();
  };

  const handleOpenEditAssignment = (asg: CustomAssignment) => {
    setEditingAssignmentId(asg.id);
    setNewAsgTitle(asg.title);
    setNewAsgModule(asg.moduleTrack || '');
    setNewAsgStartDate(asg.startDate || '');
    setNewAsgDueDate(asg.dueDate || '');
    setNewAsgMaxPoints(asg.maxPoints);
    setNewAsgDescription(asg.description || '');
    setNewAsgAttachmentName(asg.teacherAttachmentName || '');
    setNewAsgAttachmentUrl(asg.teacherAttachmentUrl || '');
    setShowAddAssignmentModal(true);
  };

  const handleCloseAddAssignmentModal = () => {
    setShowAddAssignmentModal(false);
    setEditingAssignmentId(null);
    setNewAsgTitle('');
    setNewAsgStartDate('');
    setNewAsgDescription('');
    setNewAsgAttachmentName('');
    setNewAsgAttachmentUrl('');
  };

  const handleOpenCreateAssignment = () => {
    setEditingAssignmentId(null);
    setNewAsgTitle('');
    setNewAsgModule('MIN-101 Biblical Foundations');
    setNewAsgStartDate('');
    setNewAsgDueDate('2026-08-15');
    setNewAsgMaxPoints(100);
    setNewAsgDescription('');
    setNewAsgAttachmentName('');
    setNewAsgAttachmentUrl('');
    setShowAddAssignmentModal(true);
  };

  // 2. Delete Assignment
  const handleDeleteAssignment = (assignmentId: string) => {
    setDeleteConfirmId(assignmentId);
  };

  const executeDeleteAssignment = (assignmentId: string) => {
    setCustomAssignments(prev => prev.filter(a => a.id !== assignmentId));
    setSubmissions(prev => prev.filter(s => s.assignmentId !== assignmentId));
    setDeleteConfirmId(null);
  };

  // 3. Student Submit / Upload Response
  const handleOpenStudentUpload = (asg: CustomAssignment) => {
    setActiveAssignmentForStudent(asg);
    
    // Check if existing submission
    const existing = submissions.find(s => s.assignmentId === asg.id && s.studentName.toLowerCase().trim() === activeStudentName.toLowerCase().trim());
    if (existing) {
      setUploadFileName(existing.studentFileName || '');
      setUploadFileUrl(existing.studentFileUrl || '');
      setUploadFileType(existing.studentFileType || '');
      setUploadNotes(existing.studentNotes || '');
      setUploadTypedResponse(existing.studentTypedResponse || '');
    } else {
      setUploadFileName('');
      setUploadFileUrl('');
      setUploadFileType('');
      setUploadNotes('');
      setUploadTypedResponse('');
    }

    setShowUploadModal(true);
  };

  const handleSaveStudentSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignmentForStudent) return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const existingIndex = submissions.findIndex(
      s => s.assignmentId === activeAssignmentForStudent.id && s.studentName.toLowerCase().trim() === activeStudentName.toLowerCase().trim()
    );

    if (existingIndex >= 0) {
      // Update existing submission
      const updated = [...submissions];
      updated[existingIndex] = {
        ...updated[existingIndex],
        studentFileName: uploadFileName || updated[existingIndex].studentFileName || (uploadTypedResponse ? 'Typed_Assignment_Response.txt' : 'Student_Response_Document.pdf'),
        studentFileUrl: uploadFileUrl || updated[existingIndex].studentFileUrl || (uploadTypedResponse ? `data:text/plain;charset=utf-8,${encodeURIComponent(uploadTypedResponse)}` : undefined),
        studentFileType: uploadFileType || updated[existingIndex].studentFileType || (uploadTypedResponse ? 'text/plain' : undefined),
        studentNotes: uploadNotes,
        studentTypedResponse: uploadTypedResponse,
        submittedAt: nowStr,
        status: updated[existingIndex].status === 'Correction Returned' ? 'Correction Returned' : 'Submitted',
        updatedAt: nowStr
      };
      setSubmissions(updated);
    } else {
      // Create new submission
      const newSub: AssignmentSubmission = {
        id: `SUB-${activeAssignmentForStudent.id}-${Date.now().toString().slice(-4)}`,
        assignmentId: activeAssignmentForStudent.id,
        studentName: activeStudentName,
        submittedAt: nowStr,
        studentFileName: uploadFileName || (uploadTypedResponse ? 'Typed_Assignment_Response.txt' : 'Student_Response_Document.pdf'),
        studentFileUrl: uploadFileUrl || (uploadTypedResponse ? `data:text/plain;charset=utf-8,${encodeURIComponent(uploadTypedResponse)}` : 'data:text/plain;base64,U1RVRUVOVCBTVUJNSVNTSU9OIERPQ1VNRU5U'),
        studentFileType: uploadFileType || (uploadTypedResponse ? 'text/plain' : 'application/pdf'),
        studentNotes: uploadNotes,
        studentTypedResponse: uploadTypedResponse,
        status: 'Submitted',
        updatedAt: nowStr
      };
      setSubmissions(prev => [newSub, ...prev]);
    }

    // Trigger Notification
    if (onNotificationCreated) {
      onNotificationCreated({
        id: `NOTIF-SUBMIT-${Date.now()}`,
        title: `📄 Submission Uploaded: ${activeStudentName}`,
        message: `${activeStudentName} uploaded document response for "${activeAssignmentForStudent.title}". Pending instructor review & evaluation.`,
        type: 'submission',
        targetRole: 'admin',
        studentName: activeStudentName,
        assignmentId: activeAssignmentForStudent.id,
        createdAt: nowStr,
        read: false,
        priority: 'normal',
        actionTab: 'exams'
      });
    }

    setShowUploadModal(false);
  };

  // 4. Teacher Grade & Attach Corrected File
  const handleOpenCorrection = (asg: CustomAssignment, studentName: string) => {
    const sub = submissions.find(s => s.assignmentId === asg.id && s.studentName.toLowerCase().trim() === studentName.toLowerCase().trim());
    
    setActiveSubmissionForCorrection({
      submission: sub,
      assignment: asg,
      studentName
    });

    if (sub) {
      setCorrectionScore(sub.score || 95);
      setCorrectionFeedback(sub.teacherFeedback || '');
      setCorrectedFileName(sub.teacherCorrectedFileName || '');
      setCorrectedFileUrl(sub.teacherCorrectedFileUrl || '');
      setCorrectedFileType(sub.teacherCorrectedFileType || '');
    } else {
      setCorrectionScore(95);
      setCorrectionFeedback('');
      setCorrectedFileName('');
      setCorrectedFileUrl('');
      setCorrectedFileType('');
    }

    setShowCorrectionModal(true);
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmissionForCorrection) return;

    const { assignment, studentName, submission } = activeSubmissionForCorrection;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    if (submission) {
      // Update submission with grade and corrected file
      setSubmissions(prev => prev.map(s => {
        if (s.id === submission.id) {
          return {
            ...s,
            score: correctionScore,
            teacherFeedback: correctionFeedback,
            teacherCorrectedFileName: correctedFileName || 'Teacher_Corrected_Assignment.pdf',
            teacherCorrectedFileUrl: correctedFileUrl || s.teacherCorrectedFileUrl || 'data:text/plain;base64,R1JBREVEIEFORCBDT1JSRUNURUQgQllBIEZBQ1VMVFk=',
            teacherCorrectedFileType: correctedFileType || 'application/pdf',
            status: correctedFileName || correctedFileUrl ? 'Correction Returned' : 'Graded',
            updatedAt: nowStr
          };
        }
        return s;
      }));
    } else {
      // Create new submission on behalf of student with correction
      const newSub: AssignmentSubmission = {
        id: `SUB-${assignment.id}-${Date.now().toString().slice(-4)}`,
        assignmentId: assignment.id,
        studentName,
        submittedAt: nowStr,
        studentFileName: 'Direct_Student_Submission.pdf',
        score: correctionScore,
        teacherFeedback: correctionFeedback,
        teacherCorrectedFileName: correctedFileName || 'Teacher_Corrected_Assignment.pdf',
        teacherCorrectedFileUrl: correctedFileUrl || 'data:text/plain;base64,R1JBREVEIEFORCBDT1JSRUNURUQgQllBIEZBQ1VMVFk=',
        teacherCorrectedFileType: correctedFileType || 'application/pdf',
        status: correctedFileName || correctedFileUrl ? 'Correction Returned' : 'Graded',
        updatedAt: nowStr
      };
      setSubmissions(prev => [newSub, ...prev]);
    }

    // Trigger Grading Notification
    if (onNotificationCreated) {
      onNotificationCreated({
        id: `NOTIF-GRADE-${Date.now()}`,
        title: `🎓 Assignment Graded: ${assignment.title}`,
        message: `${studentName}'s submission received a score of ${correctionScore}/${assignment.maxPoints}.${correctionFeedback ? ` Instructor Feedback: "${correctionFeedback}"` : ''}${correctedFileName ? ' Corrected document attached.' : ''}`,
        type: 'graded',
        targetRole: 'student',
        studentName,
        assignmentId: assignment.id,
        createdAt: nowStr,
        read: false,
        priority: 'high',
        actionTab: 'exams'
      });
    }

    setShowCorrectionModal(false);
  };

  // 5. Teacher Direct Upload / Edit Student Upload
  const handleOpenDirectStudentUpload = (studentName?: string, asgId?: string) => {
    const selectedStudent = studentName || (students[0]?.name || 'A. Burke');
    const selectedAsg = asgId || (customAssignments[0]?.id || 'ASG-101');

    setTargetStudentName(selectedStudent);
    setTargetAssignmentId(selectedAsg);

    const existing = submissions.find(
      s => s.assignmentId === selectedAsg && s.studentName.toLowerCase().trim() === selectedStudent.toLowerCase().trim()
    );

    if (existing) {
      setDirectStudentFileName(existing.studentFileName || '');
      setDirectStudentFileUrl(existing.studentFileUrl || '');
      setDirectStudentNotes(existing.studentNotes || '');
    } else {
      setDirectStudentFileName('');
      setDirectStudentFileUrl('');
      setDirectStudentNotes('');
    }

    setShowDirectStudentModal(true);
  };

  const handleSaveDirectStudentUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentName || !targetAssignmentId) return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const existingIndex = submissions.findIndex(
      s => s.assignmentId === targetAssignmentId && s.studentName.toLowerCase().trim() === targetStudentName.toLowerCase().trim()
    );

    if (existingIndex >= 0) {
      const updated = [...submissions];
      updated[existingIndex] = {
        ...updated[existingIndex],
        studentFileName: directStudentFileName || 'Teacher_Uploaded_Student_File.pdf',
        studentFileUrl: directStudentFileUrl || updated[existingIndex].studentFileUrl,
        studentNotes: directStudentNotes,
        updatedAt: nowStr
      };
      setSubmissions(updated);
    } else {
      const newSub: AssignmentSubmission = {
        id: `SUB-${targetAssignmentId}-${Date.now().toString().slice(-4)}`,
        assignmentId: targetAssignmentId,
        studentName: targetStudentName,
        submittedAt: nowStr,
        studentFileName: directStudentFileName || 'Teacher_Uploaded_Student_File.pdf',
        studentFileUrl: directStudentFileUrl || 'data:text/plain;base64,VVBMT0FERUQgQllBIEZBQ1VMVFkgRk9SIFNUVURFTlQ=',
        studentNotes: directStudentNotes,
        status: 'Submitted',
        updatedAt: nowStr
      };
      setSubmissions(prev => [newSub, ...prev]);
    }

    setShowDirectStudentModal(false);
  };

  // Export Grades CSV
  const exportExamsCSV = () => {
    let csv = '';
    const targets = isStudent && studentRecord ? [studentRecord] : students;
    
    csv += 'Student Name,';
    allQuizSheets.forEach(qs => {
      csv += `"${qs} Score",`;
    });
    customAssignments.forEach(asg => {
      csv += `"${asg.title.replace(/"/g, '""')} (${asg.maxPoints}pts)",`;
    });
    csv += 'Overall Average %,Grade Letter,Participation Score,Assignment Score,Composite Final Average\n';

    targets.forEach(s => {
      const studentKey = s.name.toLowerCase().trim();
      const rub = rubricScores[studentKey] || { participation: 90, scripture: 95, assignment: 85 };
      const qPct = s.percentage !== null ? Math.round(s.percentage) : 0;
      const composite = Math.round((qPct + rub.participation + rub.assignment) / 3);
      
      csv += `"${s.name}",`;
      allQuizSheets.forEach(qs => {
        csv += `"${s.attendanceByDay?.[qs]?.score || 'N/A'}",`;
      });
      customAssignments.forEach(asg => {
        const sub = submissions.find(subItem => 
          subItem.assignmentId === asg.id && 
          (subItem.studentName.toLowerCase().trim() === studentKey || 
           studentKey.includes(subItem.studentName.toLowerCase().trim()))
        );
        const scoreVal = sub && sub.score !== undefined ? `${sub.score}/${asg.maxPoints}` : 'N/A';
        csv += `"${scoreVal}",`;
      });
      csv += `${qPct}%,${getGradeLetter(s.percentage)},${rub.participation}%,${rub.assignment}%,${composite}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = isStudent && studentRecord
      ? `${studentRecord.name.replace(/\s+/g, '_')}_Exams_Report.csv`
      : 'HTEIM_School_of_Ministry_Exam_Grades.csv';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Submissions for Table / Cards
  const filteredSubmissions = submissions.filter(sub => {
    if (selectedAssignmentId !== 'all' && sub.assignmentId !== selectedAssignmentId) return false;
    if (searchQuery.trim() && !sub.studentName.toLowerCase().includes(searchQuery.toLowerCase().trim())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner & Sub-Tab Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-900/50 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-black tracking-tight">Exams, Written Assignments & Evaluations</h2>
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              HTEIM School of Ministry portal for manual course assignments, student document uploads, instructor corrections, and Google Forms quiz logs.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {isTeacherOrAdmin && subTab === 'assignments' && (
              <button
                onClick={handleOpenCreateAssignment}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Assignment
              </button>
            )}

            <button
              onClick={exportExamsCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer flex-shrink-0"
            >
              <Download className="w-4 h-4" /> Export Grades CSV
            </button>
          </div>
        </div>

        {/* Sub Navigation Switcher */}
        <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl border border-white/10 w-full md:w-auto md:max-w-max overflow-x-auto custom-scrollbar flex-shrink-0">
          <button
            onClick={() => setSubTab('assignments')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              subTab === 'assignments'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Written Assignments & Submissions ({customAssignments.length})</span>
          </button>

          <button
            onClick={() => setSubTab('quizzes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              subTab === 'quizzes'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Quiz Score Matrix ({allQuizSheets.length})</span>
          </button>
        </div>
      </div>

      {/* SUB TAB 1: WRITTEN ASSIGNMENTS & STUDENT UPLOADS WORKSPACE */}
      {subTab === 'assignments' && (
        <div className="space-y-6">
          
          {/* TEACHER / ADMIN QUICK ACTION BAR */}
          {isTeacherOrAdmin && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-indigo-600" /> Filter Assignment:
                </span>
                <select
                  value={selectedAssignmentId}
                  onChange={(e) => setSelectedAssignmentId(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Course Assignments ({customAssignments.length})</option>
                  {customAssignments.map(asg => (
                    <option key={asg.id} value={asg.id}>{asg.title}</option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 w-full md:w-auto">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student submission by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                onClick={() => handleOpenDirectStudentUpload()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 shadow-2xs"
              >
                <FileUp className="w-4 h-4 text-amber-400" /> Upload for Specific Student
              </button>
            </div>
          )}

          {/* STUDENT PROGRESS ANALYTICS DASHBOARD (IF STUDENT) */}
          {isStudent && (
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/30 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                    {activeStudentName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold flex items-center gap-2">
                      <span>{activeStudentName}</span>
                      <span className="text-[10px] bg-indigo-500/40 text-indigo-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Student Candidate</span>
                    </h3>
                    <p className="text-xs text-indigo-300 mt-0.5">Personalized Academic Trajectory & Performance Analytics</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-center">
                    <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">Overall Quiz Score</p>
                    <p className="text-base font-mono font-black text-amber-400">
                      {studentRecord?.percentage !== null ? `${Math.round(studentRecord!.percentage)}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-center">
                    <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">Attendance Rate</p>
                    <p className="text-base font-mono font-black text-emerald-400">
                      {studentRecord ? `${Math.round(studentRecord.attendanceRate)}%` : '100%'}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-center">
                    <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">Assignments Completed</p>
                    <p className="text-base font-mono font-black text-indigo-200">
                      {submissions.filter(s => s.studentName.toLowerCase().trim() === activeStudentName.toLowerCase().trim() && s.score !== undefined).length} / {customAssignments.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Graphical Trajectory Sparkline & Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-200">
                    <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-400" /> Grade Trajectory</span>
                    <span className="text-[10px] text-emerald-400 font-mono">+4.2% this month</span>
                  </div>
                  <div className="h-14 flex items-end gap-1.5 pt-2">
                    {[78, 82, 88, 85, 92, 96].map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-sm transition-all hover:brightness-125"
                          style={{ height: `${val}%` }}
                          title={`Score: ${val}%`}
                        />
                        <span className="text-[9px] text-indigo-300 font-mono">Q{idx+1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-200">
                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Coursework Breakdown</span>
                    <span className="text-[10px] text-indigo-300 font-mono">4 Modules</span>
                  </div>
                  <div className="space-y-1.5 text-xs pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5 text-indigo-200">
                        <span>Hermeneutics Exegesis</span>
                        <span className="font-bold text-amber-400">96/100</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: '96%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5 text-indigo-200">
                        <span>Homiletics Outline</span>
                        <span className="font-bold text-emerald-400">92/100</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: '92%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-200">
                    <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-400" /> Academic Standing</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">First Class Honor</span>
                  </div>
                  <p className="text-[11px] text-indigo-300 leading-relaxed">
                    Student is meeting all School of Ministry theological and practical competency requirements with distinction.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ASSIGNMENTS OVERVIEW CARDS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-indigo-600" /> Assigned Ministry Coursework
              </h3>
              {isStudent && (
                <span className="text-xs text-slate-500 font-medium">
                  Logged in as Student: <strong className="text-slate-900">{activeStudentName}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {customAssignments.map(asg => {
                const sub = submissions.find(
                  s => s.assignmentId === asg.id && s.studentName.toLowerCase().trim() === activeStudentName.toLowerCase().trim()
                );

                const todayStr = new Date().toISOString().split('T')[0];
                const isPastDue = Boolean(asg.dueDate && asg.dueDate < todayStr);
                const hasSubmitted = !!sub;
                const isGraded = sub?.status === 'Graded' || sub?.status === 'Correction Returned';
                const hasCorrectedFile = !!sub?.teacherCorrectedFileName || !!sub?.teacherCorrectedFileUrl;

                // Countdown badge calculation
                const getCountdown = (dueDateStr?: string) => {
                  if (!dueDateStr) return null;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const due = new Date(dueDateStr);
                  due.setHours(0, 0, 0, 0);
                  const diffTime = due.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  if (diffDays < 0) {
                    return { text: `Overdue by ${Math.abs(diffDays)}d`, color: 'bg-rose-100 text-rose-800 border-rose-300 font-bold' };
                  } else if (diffDays === 0) {
                    return { text: 'Due Today', color: 'bg-amber-100 text-amber-900 border-amber-300 font-black animate-pulse' };
                  } else if (diffDays === 1) {
                    return { text: 'Due Tomorrow', color: 'bg-amber-50 text-amber-800 border-amber-200 font-bold' };
                  } else if (diffDays <= 5) {
                    return { text: `Due in ${diffDays} days`, color: 'bg-indigo-50 text-indigo-800 border-indigo-200 font-medium' };
                  } else {
                    return { text: `Due in ${diffDays} days`, color: 'bg-slate-100 text-slate-700 border-slate-200 font-medium' };
                  }
                };

                const countdown = getCountdown(asg.dueDate);

                return (
                  <div key={asg.id} className={`bg-white border rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all ${
                    isPastDue && !isGraded ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
                  }`}>
                    
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                            {asg.moduleTrack || 'Ministry Core'}
                          </span>
                          {isPastDue && (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                              <AlertCircle className="w-3 h-3 text-rose-600" /> Past Due
                            </span>
                          )}
                        </div>
                        
                        {isTeacherOrAdmin && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleOpenEditAssignment(asg)}
                              className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit Assignment"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAssignment(asg.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Delete Assignment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{asg.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">{asg.description}</p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 font-medium flex-wrap gap-1.5">
                        <span className={`flex items-center gap-1 ${isPastDue ? 'text-rose-700 font-bold' : 'text-slate-500'}`}>
                          <Calendar className={`w-3.5 h-3.5 ${isPastDue ? 'text-rose-600' : 'text-slate-400'}`} />
                          <span>Due: {asg.dueDate || 'No Due Date'}</span>
                        </span>
                        {countdown && (
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full border shadow-2xs ${countdown.color}`}>
                            {countdown.text}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono font-bold text-slate-800 text-right">
                        Max Points: {asg.maxPoints}
                      </div>

                      {asg.teacherAttachmentName && (
                        <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-[11px]">
                          <span className="text-slate-700 font-medium truncate flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-indigo-600" /> {asg.teacherAttachmentName}
                          </span>
                          <button
                            onClick={() => setPreviewFile({ name: asg.teacherAttachmentName!, url: asg.teacherAttachmentUrl })}
                            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 text-[10px] cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                        </div>
                      )}
                    </div>

                    {/* STATUS & ACTIONS */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      
                      {/* STUDENT VIEW STATUS */}
                      {isStudent && (
                        <div>
                          {isGraded ? (
                            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Completed & Graded</span>
                                <span className="font-mono text-emerald-700 font-black">{sub?.score}/{asg.maxPoints}</span>
                              </div>

                              {sub?.teacherFeedback && (
                                <p className="text-[11px] text-emerald-800 italic bg-white p-2 rounded-lg border border-emerald-100">
                                  "{sub.teacherFeedback}"
                                </p>
                              )}

                              {sub?.studentTypedResponse && (
                                <button
                                  onClick={() => setPreviewFile({ name: `Typed Response - ${asg.title}`, content: sub.studentTypedResponse })}
                                  className="w-full py-1 bg-white border border-emerald-200 text-emerald-800 font-bold text-[11px] rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer flex items-center justify-center gap-1 mt-1"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View Typed Response
                                </button>
                              )}

                              {hasCorrectedFile && (
                                <div className="p-2 bg-emerald-600 text-white rounded-lg flex items-center justify-between text-xs">
                                  <span className="font-extrabold flex items-center gap-1 text-[11px] truncate">
                                    <FileCheck className="w-3.5 h-3.5" /> Corrected Document Attached
                                  </span>
                                  <button
                                    onClick={() => setPreviewFile({ name: sub!.teacherCorrectedFileName!, url: sub!.teacherCorrectedFileUrl })}
                                    className="px-2 py-0.5 bg-white text-emerald-900 font-bold text-[10px] rounded hover:bg-emerald-100 cursor-pointer flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" /> View Corrected
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : hasSubmitted ? (
                            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                                <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-indigo-600" /> Submitted (Awaiting Grading)</span>
                                <span className="text-[10px] font-mono text-indigo-700">{sub?.submittedAt}</span>
                              </div>
                              <p className="text-[11px] text-indigo-800 font-medium truncate">File: {sub?.studentFileName}</p>
                              <button
                                onClick={() => handleOpenStudentUpload(asg)}
                                className="w-full py-1.5 bg-white border border-indigo-300 text-indigo-700 font-bold text-xs rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Re-upload / Update Response
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenStudentUpload(asg)}
                              className={`w-full py-2.5 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                isPastDue ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
                              }`}
                            >
                              {isPastDue ? <AlertCircle className="w-4 h-4 text-amber-300" /> : <Upload className="w-4 h-4" />}
                              {isPastDue ? 'Upload Response File (Past Due)' : 'Upload Response File'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* TEACHER VIEW ASSIGNMENT STATS */}
                      {isTeacherOrAdmin && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Submissions:</span>
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {submissions.filter(s => s.assignmentId === asg.id).length} Logged
                          </span>
                        </div>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* TEACHER / ADMIN SUBMISSIONS MATRIX TABLE */}
          {isTeacherOrAdmin && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden space-y-0">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4.5 h-4.5 text-amber-400" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider">Student Assignment Submissions & Corrections Matrix</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {filteredSubmissions.length} Record(s) Shown
                </span>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3 pl-4">Student Name</th>
                      <th className="p-3">Assignment Title</th>
                      <th className="p-3">Submission Status</th>
                      <th className="p-3">Student's Uploaded Response</th>
                      <th className="p-3">Teacher Corrected Document</th>
                      <th className="p-3 text-center">Score</th>
                      <th className="p-3 text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {/* Render rows for each student / assignment combination */}
                    {displayedStudents.map(std => {
                      const targetAsgs = selectedAssignmentId === 'all' ? customAssignments : customAssignments.filter(a => a.id === selectedAssignmentId);

                      return targetAsgs.map(asg => {
                        const sub = submissions.find(s => s.assignmentId === asg.id && s.studentName.toLowerCase().trim() === std.name.toLowerCase().trim());
                        
                        if (searchQuery.trim() && !std.name.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
                          return null;
                        }

                        const todayStr = new Date().toISOString().split('T')[0];
                        const isPastDue = Boolean(asg.dueDate && asg.dueDate < todayStr);
                        const isGraded = sub?.status === 'Graded' || sub?.status === 'Correction Returned';

                        return (
                          <tr key={`${std.name}-${asg.id}`} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 pl-4 font-black text-slate-900">
                              {std.name}
                            </td>
                            <td className="p-3 text-slate-700 font-medium max-w-[220px]" title={asg.title}>
                              <div className="font-bold text-slate-900 truncate">{asg.title}</div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3 text-slate-400" /> Due: {asg.dueDate || 'N/A'}
                                {isPastDue && (
                                  <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-200 font-black px-1.5 py-0.2 rounded uppercase">
                                    Past Due
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              {sub ? (
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 ${
                                  isGraded ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                  'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                }`}>
                                  {isGraded ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-indigo-600" />}
                                  {sub.status}
                                </span>
                              ) : isPastDue ? (
                                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-rose-600" /> Past Due (Missing)
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                  Not Submitted
                                </span>
                              )}
                            </td>

                            {/* STUDENT'S FILE */}
                            <td className="p-3">
                              {sub?.studentFileName ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-indigo-700 font-bold truncate max-w-[150px]" title={sub.studentFileName}>
                                    {sub.studentFileName}
                                  </span>
                                  <button
                                    onClick={() => setPreviewFile({ name: sub.studentFileName!, url: sub.studentFileUrl })}
                                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                    title="View Student Document"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">—</span>
                              )}
                            </td>

                            {/* TEACHER'S CORRECTED FILE */}
                            <td className="p-3">
                              {sub?.teacherCorrectedFileName ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-emerald-700 font-bold truncate max-w-[150px]" title={sub.teacherCorrectedFileName}>
                                    {sub.teacherCorrectedFileName}
                                  </span>
                                  <button
                                    onClick={() => setPreviewFile({ name: sub.teacherCorrectedFileName!, url: sub.teacherCorrectedFileUrl })}
                                    className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                    title="View Corrected Document"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">No correction uploaded</span>
                              )}
                            </td>

                            {/* SCORE */}
                            <td className="p-3 text-center font-mono font-black text-slate-900">
                              {sub?.score !== undefined ? `${sub.score}/${asg.maxPoints}` : '—'}
                            </td>

                            {/* ACTIONS */}
                            <td className="p-3 text-right pr-4 space-x-2">
                              <button
                                onClick={() => handleOpenCorrection(asg, std.name)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                              >
                                <Edit3 className="w-3 h-3" /> {sub?.score !== undefined ? 'Edit Grade' : 'Grade & Correct'}
                              </button>

                              <button
                                onClick={() => handleOpenDirectStudentUpload(std.name, asg.id)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                                title="Upload or edit student response file directly"
                              >
                                <Upload className="w-3 h-3 text-slate-500" /> Edit Upload
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* SUB TAB 2: GOOGLE FORMS & QUIZ SCORE MATRIX (Existing Tab content) */}
      {subTab === 'quizzes' && (
        <div className="space-y-6">
          
          {/* Analytics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-slate-500">Evaluated Candidates</p>
              <p className="text-2xl font-black font-mono mt-1 text-slate-900">{totalEvaluated}</p>
              <p className="text-[10px] text-indigo-600 font-medium mt-0.5">Quiz Submissions Logged</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-slate-500">Class Exam Average</p>
              <p className="text-2xl font-black font-mono mt-1 text-indigo-700">{classExamAvg}%</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Overall Knowledge Pass Rate</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-slate-500">Perfect 100% Scores</p>
              <p className="text-2xl font-black font-mono mt-1 text-emerald-600">{perfectScores}</p>
              <p className="text-[10px] text-emerald-700 font-bold mt-0.5">A+ Distinctions</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-slate-500">Needs Review (&lt;70%)</p>
              <p className="text-2xl font-black font-mono mt-1 text-rose-600">{failedScores}</p>
              <p className="text-[10px] text-rose-700 font-medium mt-0.5">Recommended Retake</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student exam record by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
              <button
                onClick={() => setGradeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  gradeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                All ({students.length})
              </button>
              <button
                onClick={() => setGradeFilter('passed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  gradeFilter === 'passed' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                Passed ({passedScores})
              </button>
            </div>
          </div>

          {/* Main Quiz Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider">Exam, Quiz & Written Assignment Score Matrix</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {allQuizSheets.length} Quizzes & {customAssignments.length} Written Assignments Logged
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3 pl-4 min-w-[155px]">Student Candidate</th>
                    {allQuizSheets.map(qs => (
                      <th key={qs} className="p-3 text-center min-w-[130px]" title={qs}>{qs}</th>
                    ))}
                    {customAssignments.map(asg => (
                      <th key={asg.id} className="p-3 text-center min-w-[140px] bg-indigo-50/70 text-indigo-900" title={asg.title}>
                        {asg.title} ({asg.maxPoints} pts)
                      </th>
                    ))}
                    <th className="p-3 text-center min-w-[85px]">Overall Avg</th>
                    <th className="p-3 text-center min-w-[70px]">Grade</th>
                    <th className="p-3 text-center min-w-[110px]">Participation</th>
                    <th className="p-3 text-center min-w-[110px]">Assignments</th>
                    <th className="p-3 text-center min-w-[100px]">Composite Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {displayedStudents.map((s) => {
                    const studentKey = s.name.toLowerCase().trim();
                    const rub = rubricScores[studentKey] || { participation: 90, scripture: 95, assignment: 85 };
                    const qPct = s.percentage !== null ? Math.round(s.percentage) : 0;
                    const composite = Math.round((qPct + rub.participation + rub.assignment) / 3);
                    const gradeLetter = getGradeLetter(s.percentage);

                    return (
                      <tr key={s.name} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 pl-4 font-bold text-slate-900">{s.name}</td>
                        {allQuizSheets.map(qs => {
                          const score = s.attendanceByDay?.[qs]?.score || '—';
                          const hasScore = score !== '—';
                          return (
                            <td key={`${qs}-${score}`} className={`p-3 text-center font-mono font-bold text-slate-800 transition-all duration-300 ${hasScore ? 'animate-grade-pulse' : ''}`}>
                              {score}
                            </td>
                          );
                        })}
                        {customAssignments.map(asg => {
                          const sub = submissions.find(subItem => 
                            subItem.assignmentId === asg.id && 
                            (subItem.studentName.toLowerCase().trim() === studentKey || 
                             studentKey.includes(subItem.studentName.toLowerCase().trim()))
                          );
                          const scoreDisplay = sub && sub.score !== undefined ? `${sub.score}/${asg.maxPoints}` : (sub?.status === 'Submitted' ? 'Submitted' : '—');
                          const badgeColor = sub && sub.score !== undefined ? 'text-indigo-700 font-bold bg-indigo-50/40 animate-grade-pulse' : 'text-slate-400';
                          return (
                            <td key={`${asg.id}-${sub?.score || 0}-${sub?.updatedAt || ''}`} className={`p-3 text-center font-mono transition-all duration-300 ${badgeColor}`}>
                              {scoreDisplay}
                            </td>
                          );
                        })}
                        <td className="p-3 text-center font-mono font-extrabold text-indigo-700 transition-all duration-300 animate-grade-pulse">
                          {s.percentage !== null ? `${Math.round(s.percentage)}%` : 'N/A'}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded font-mono font-black text-[11px] bg-indigo-100 text-indigo-800 transition-all duration-300 inline-block animate-grade-pulse">
                            {gradeLetter}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono">
                          <input 
                            type="number" 
                            min="0" 
                            max="100"
                            value={rub.participation}
                            disabled={isStudent}
                            onChange={(e) => onUpdateRubric(studentKey, 'participation', parseInt(e.target.value, 10) || 0)}
                            className="w-14 p-1 text-center bg-slate-50 border border-slate-200 rounded font-bold text-xs"
                          /> %
                        </td>
                        <td className="p-3 text-center font-mono">
                          <input 
                            type="number" 
                            min="0" 
                            max="100"
                            value={rub.assignment}
                            disabled={isStudent}
                            onChange={(e) => onUpdateRubric(studentKey, 'assignment', parseInt(e.target.value, 10) || 0)}
                            className="w-14 p-1 text-center bg-slate-50 border border-slate-200 rounded font-bold text-xs"
                          /> %
                        </td>
                        <td className="p-3 text-center font-mono font-black text-indigo-900 bg-indigo-50/50">
                          {composite}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD/EDIT ASSIGNMENT (TEACHER / ADMIN) */}
      {/* ========================================================= */}
      {showAddAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {editingAssignmentId ? <Edit3 className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-amber-400" />}
                <h3 className="text-base font-extrabold">{editingAssignmentId ? 'Edit Course Assignment' : 'Create Manual Course Assignment'}</h3>
              </div>
              <button
                onClick={handleCloseAddAssignmentModal}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
 
            <form onSubmit={handleSaveAssignment} className="p-6 space-y-4 text-xs font-medium">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assignment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Exegesis Paper: Hermeneutical Principles"
                  value={newAsgTitle}
                  onChange={(e) => setNewAsgTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
 
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Module / Course Track</label>
                  <input
                    type="text"
                    value={newAsgModule}
                    onChange={(e) => setNewAsgModule(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newAsgStartDate}
                    onChange={(e) => setNewAsgStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500">
                    Start of the submission period.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newAsgDueDate}
                    onChange={(e) => setNewAsgDueDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500">
                    Submissions after this are overdue.
                  </p>
                </div>
              </div>
 
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description / Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Enter explicit assignment instructions, word count, or grading expectations..."
                  value={newAsgDescription}
                  onChange={(e) => setNewAsgDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
 
              {/* Optional Teacher Reference File Upload */}
              <div className="space-y-1 pt-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-600" /> Optional Reference Worksheet / Rubric File
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, (url, name) => {
                      setNewAsgAttachmentUrl(url);
                      setNewAsgAttachmentName(name);
                    })}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>
                {newAsgAttachmentName && (
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                    <Check className="w-3.5 h-3.5" /> Attached: {newAsgAttachmentName}
                  </p>
                )}
              </div>
 
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseAddAssignmentModal}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  {editingAssignmentId ? 'Save Changes' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: STUDENT UPLOAD RESPONSE */}
      {/* ========================================================= */}
      {showUploadModal && activeAssignmentForStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-extrabold">Upload Assignment Response</h3>
                  <p className="text-[11px] text-slate-300 truncate max-w-xs">{activeAssignmentForStudent.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentSubmission} className="p-6 space-y-4 text-xs font-medium">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900">
                <p className="font-bold">Student Candidate: <strong>{activeStudentName}</strong></p>
                <p className="text-[11px] text-indigo-700 mt-0.5">Due Date: {activeAssignmentForStudent.dueDate} | Max Points: {activeAssignmentForStudent.maxPoints}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Edit3 className="w-4 h-4 text-indigo-600" /> Type Out Assignment Response Directly
                </label>
                <textarea
                  rows={6}
                  placeholder="Type or paste your assignment essay, theological reflections, or exam answers directly here..."
                  value={uploadTypedResponse}
                  onChange={(e) => setUploadTypedResponse(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-sans text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-500">You can type your response above, upload a document file below, or do both!</p>
              </div>

              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <FileUp className="w-4 h-4 text-indigo-600" /> Upload Document File (Optional)
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, (url, name, type) => {
                    setUploadFileUrl(url);
                    setUploadFileName(name);
                    setUploadFileType(type);
                  })}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                />
                {uploadFileName && (
                  <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-1 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Ready for upload: {uploadFileName}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Student Notes / Reflections (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Add any comments for the instructor regarding your submission..."
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Upload className="w-4 h-4" /> Submit Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: TEACHER GRADE & UPLOAD CORRECTED ASSIGNMENT */}
      {/* ========================================================= */}
      {showCorrectionModal && activeSubmissionForCorrection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-extrabold">Grade & Attach Corrected Assignment</h3>
                  <p className="text-[11px] text-slate-300">Student: <strong>{activeSubmissionForCorrection.studentName}</strong></p>
                </div>
              </div>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="p-6 space-y-4 text-xs font-medium">
              {/* Student Submission Quick View */}
              {activeSubmissionForCorrection.submission?.studentFileName && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Student's Uploaded Document</p>
                    <p className="font-bold text-slate-900 truncate max-w-xs">{activeSubmissionForCorrection.submission.studentFileName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewFile({
                      name: activeSubmissionForCorrection.submission!.studentFileName!,
                      url: activeSubmissionForCorrection.submission!.studentFileUrl
                    })}
                    className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600" /> Inspect File
                  </button>
                </div>
              )}

              {activeSubmissionForCorrection.submission?.studentTypedResponse && (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-indigo-900 uppercase flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600" /> Student's Typed Assignment Response
                    </p>
                    <button
                      type="button"
                      onClick={() => setPreviewFile({
                        name: `Typed Response - ${activeSubmissionForCorrection.studentName}`,
                        content: activeSubmissionForCorrection.submission!.studentTypedResponse
                      })}
                      className="text-[10px] bg-white text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-300 hover:bg-indigo-50 cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Expand Full View
                    </button>
                  </div>
                  <div className="max-h-32 overflow-y-auto bg-white p-2.5 rounded-lg border border-indigo-100 text-[11px] text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                    {activeSubmissionForCorrection.submission.studentTypedResponse}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Score / Points Earned (Max: {activeSubmissionForCorrection.assignment.maxPoints})</label>
                <input
                  type="number"
                  min="0"
                  max={activeSubmissionForCorrection.assignment.maxPoints}
                  value={correctionScore}
                  onChange={(e) => setCorrectionScore(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Teacher Feedback & Evaluation Notes</label>
                <textarea
                  rows={3}
                  placeholder="Provide constructive feedback, commendations, or theological guidance..."
                  value={correctionFeedback}
                  onChange={(e) => setCorrectionFeedback(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* UPLOAD CORRECTED ASSIGNMENT FILE */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <label className="font-bold text-slate-800 flex items-center gap-1 text-xs">
                  <FileCheck className="w-4 h-4 text-emerald-600" /> Upload Corrected Assignment Document
                </label>
                <p className="text-[11px] text-slate-500">
                  Attach a corrected PDF or document with instructor red-pen annotations, rubric breakdown, or grade certificate.
                </p>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, (url, name, type) => {
                    setCorrectedFileUrl(url);
                    setCorrectedFileName(name);
                    setCorrectedFileType(type);
                  })}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                />
                {correctedFileName && (
                  <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Attached Corrected File: {correctedFileName}
                  </p>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Save Grade & Return Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: TEACHER DIRECT UPLOAD TO SPECIFIC STUDENT / EDIT UPLOAD */}
      {/* ========================================================= */}
      {showDirectStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold">Upload or Edit Student Assignment File</h3>
              </div>
              <button
                onClick={() => setShowDirectStudentModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDirectStudentUpload} className="p-6 space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Select Target Student</label>
                  <select
                    value={targetStudentName}
                    onChange={(e) => setTargetStudentName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 cursor-pointer"
                  >
                    {students.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Select Assignment</label>
                  <select
                    value={targetAssignmentId}
                    onChange={(e) => setTargetAssignmentId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 cursor-pointer"
                  >
                    {customAssignments.map(a => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Upload / Replace Response File</label>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, (url, name) => {
                    setDirectStudentFileUrl(url);
                    setDirectStudentFileName(name);
                  })}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />
                {directStudentFileName && (
                  <p className="text-[11px] text-emerald-700 font-bold mt-1">Selected File: {directStudentFileName}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Submission Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes accompanying this student upload..."
                  value={directStudentNotes}
                  onChange={(e) => setDirectStudentNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDirectStudentModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  Save Student Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: DOCUMENT PREVIEW MODAL */}
      {/* ========================================================= */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-extrabold truncate max-w-md">{previewFile.name}</h3>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {previewFile.content ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <p className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-indigo-600" /> Student Typed Response Content
                  </p>
                  <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 font-sans leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {previewFile.content}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" /> Document Document Stream Ready
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    File <strong>"{previewFile.name}"</strong> is securely encoded in the School of Ministry repository. Click download below to save the full document locally.
                  </p>
                </div>
              )}

              {previewFile.url && (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                  <FolderOpen className="w-12 h-12 text-indigo-400 mx-auto" />
                  <p className="text-xs text-slate-700 font-bold">{previewFile.name}</p>
                  <a
                    href={previewFile.url}
                    download={previewFile.name}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download Complete File
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ========================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Assignment</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete this assignment and all associated student submissions? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => executeDeleteAssignment(deleteConfirmId)}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
