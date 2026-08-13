import React, { useState, useEffect, useMemo } from 'react';
import { logActivity } from '../lib/auditLogger';
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
  FolderOpen,
  Lock,
  ShieldAlert,
  Image,
  Share2,
  Loader2,
  Bookmark,
  ShieldCheck,
  CloudDownload,
  UploadCloud,
  ArrowLeft
} from 'lucide-react';

import { EmptyState } from './UXPrimitives';
import { UserRole } from '../lib/userAuth';
import { uploadToSupabaseStorage, syncAssignmentsFromSupabaseBucket } from '../lib/supabaseClient';
import { CustomAssignment, AssignmentSubmission, AppNotification, QuizAssignment, QuizSubmission } from '../types';
import { generateGoogleCalendarUrl } from '../lib/calendarExport';
import { QuizCreatorModal } from './QuizCreatorModal';
import { QuizTakerView } from './QuizTakerView';
import { AdminQuizzesDashboard } from './AdminQuizzesDashboard';
import { Modal } from './Modal';
import { usePortalRouter } from '../lib/usePortalRouter';

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

  // Google Sheets Quiz Sync Props
  googleUser?: any;
  googleToken?: string | null;
  isLoggingIn?: boolean;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
  sheetUrl?: string;
  setSheetUrl?: (url: string) => void;
  onLoadSheets?: (e?: React.FormEvent, customUrl?: string) => Promise<void>;
  isLoadingSheets?: boolean;
  lastSyncedTime?: string | null;
  recentSheets?: { id: string; title: string; url: string; lastLoaded?: string }[];
  onRemoveRecentSheet?: (id: string, e: React.MouseEvent) => void;
}

export const INITIAL_ASSIGNMENTS: CustomAssignment[] = [];

export const INITIAL_SUBMISSIONS: AssignmentSubmission[] = [];

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
  setSubmissions,
  googleUser,
  googleToken,
  isLoggingIn,
  onGoogleLogin,
  onGoogleLogout,
  sheetUrl = '',
  setSheetUrl,
  onLoadSheets,
  isLoadingSheets,
  lastSyncedTime,
  recentSheets = [],
  onRemoveRecentSheet
}) => {
  const isStudent = userRole === 'student';
  const isTeacherOrAdmin = userRole === 'admin' || userRole === 'teacher';

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sub tab view: 'assignments' (default) vs 'quizzes' vs 'admin_dashboard'
  const [subTab, setSubTab] = useState<'assignments' | 'quizzes' | 'admin_dashboard'>('assignments');

  const { route, navigate } = usePortalRouter('exams');

  // Quiz Creator & Quiz Taker State
  const [showQuizCreatorModal, setShowQuizCreatorModal] = useState(false);
  const [editingQuizData, setEditingQuizData] = useState<QuizAssignment | null>(null);
  const [activeQuizTaker, setActiveQuizTaker] = useState<QuizAssignment | null>(null);
  const [activeCollatingQuiz, setActiveCollatingQuiz] = useState<CustomAssignment | null>(null);
  const [copiedLinkToast, setCopiedLinkToast] = useState<string | null>(null);

  // Stored Quiz Submissions List
  const [quizSubmissionsList, setQuizSubmissionsList] = useState<QuizSubmission[]>([]);

  // Listen for direct quiz link in URL query or hash
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const quizParam = urlParams.get('quiz') || urlParams.get('quizId');
    const hash = window.location.hash;
    let codeFromHash = '';
    if (hash.includes('#quiz/')) {
      codeFromHash = hash.split('#quiz/')[1];
    }

    const targetCode = quizParam || codeFromHash;
    if (targetCode && customAssignments.length > 0) {
      const matched = customAssignments.find(
        a => a.type === 'quiz' && a.quizData && (a.quizData.shareCode === targetCode || a.quizData.id === targetCode || a.id === targetCode)
      );
      if (matched && matched.quizData) {
        setActiveQuizTaker(matched.quizData);
        setSubTab('quizzes');
      }
    }
  }, [customAssignments]);

  // Quiz Management Handlers
  const handleSaveQuiz = (quizData: QuizAssignment) => {
    const existingIndex = customAssignments.findIndex(
      a => a.id === quizData.id || a.quizData?.id === quizData.id
    );

    const asgObj: CustomAssignment = {
      id: quizData.id,
      title: quizData.title,
      courseCode: quizData.courseCode,
      moduleTrack: quizData.moduleTrack,
      description: quizData.description || 'Interactive Google Forms style class day quiz.',
      dueDate: quizData.dueDate || '2026-08-30',
      maxPoints: quizData.totalPoints || 100,
      createdAt: quizData.createdAt,
      type: 'quiz',
      quizData
    };

    if (existingIndex >= 0) {
      const updated = [...customAssignments];
      updated[existingIndex] = asgObj;
      setCustomAssignments(updated);
    } else {
      setCustomAssignments([asgObj, ...customAssignments]);

      if (onNotificationCreated) {
        onNotificationCreated({
          id: `NOTIF-QUIZ-${Date.now()}`,
          title: `📝 New Active Quiz Published: ${quizData.title}`,
          message: `A new class day quiz "${quizData.title}" (${quizData.totalPoints} pts${quizData.timeLimitMinutes ? `, ${quizData.timeLimitMinutes} min limit` : ''}) is now active. Access it on your Home screen or Exams tab!`,
          type: 'assignment',
          targetRole: 'student',
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          read: false,
          priority: 'high',
          actionTab: 'exams'
        });
      }
    }

    logActivity({
      actor: userRole === 'admin' ? 'Administrator' : 'Instructor',
      role: userRole === 'admin' ? 'admin' : 'teacher',
      actionCategory: 'Quiz Management',
      actionTitle: existingIndex >= 0 ? 'Quiz Assignment Updated' : 'Class Day Quiz Created',
      details: `Saved weighted quiz "${quizData.title}" (${quizData.questions.length} questions, ${quizData.totalPoints} points max). Share Code: ${quizData.shareCode}`
    });

    setShowQuizCreatorModal(false);
    setEditingQuizData(null);
    navigate({ action: undefined, id: undefined });
  };

  const handleDuplicateQuiz = (quiz: QuizAssignment) => {
    const asg = customAssignments.find(a => a.quizData?.id === quiz.id || a.id === quiz.id);
    if (!asg?.quizData) return;

    const newShareCode = `qz_${Math.random().toString(36).substring(2, 8)}`;
    const newQuizId = `quiz_${Date.now()}`;
    const duplicatedQuiz: QuizAssignment = {
      ...quiz,
      id: newQuizId,
      title: `${quiz.title} (Copy)`,
      shareCode: newShareCode,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const newAsg: CustomAssignment = {
      id: `ASG-${newQuizId}`,
      title: duplicatedQuiz.title,
      courseCode: duplicatedQuiz.courseCode,
      moduleTrack: duplicatedQuiz.moduleTrack,
      description: duplicatedQuiz.description || '',
      dueDate: duplicatedQuiz.dueDate || new Date().toISOString().split('T')[0],
      maxPoints: duplicatedQuiz.totalPoints || 100,
      createdAt: new Date().toISOString().split('T')[0],
      type: 'quiz',
      quizData: duplicatedQuiz
    };

    setCustomAssignments(prev => [newAsg, ...prev]);

    logActivity({
      actor: userRole === 'admin' ? 'Administrator' : 'Instructor',
      role: userRole === 'admin' ? 'admin' : 'teacher',
      actionCategory: 'Quiz Management',
      actionTitle: 'Class Day Quiz Duplicated',
      details: `Duplicated "${quiz.title}" to create "${newAsg.title}". New Share Code: ${newShareCode}`
    });
  };

  const handleCopyQuizLink = (quiz: QuizAssignment) => {
    const link = `${window.location.origin}/#quiz/${quiz.shareCode || quiz.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLinkToast(`Quiz link copied! (${link})`);
      setTimeout(() => setCopiedLinkToast(null), 3000);
    }).catch(() => {
      setCopiedLinkToast(`Share Code: ${quiz.shareCode}`);
      setTimeout(() => setCopiedLinkToast(null), 3000);
    });
  };

  const handleQuizSubmissionComplete = (submission: QuizSubmission) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Save into quizSubmissionsList
    setQuizSubmissionsList(prev => [submission, ...prev]);

    // Match quiz assignment maxPoints
    const matchingAsg = customAssignments.find(a => a.quizData?.id === submission.quizId || a.id === submission.quizId);
    const maxPoints = matchingAsg ? matchingAsg.maxPoints : submission.totalPossible;

    // Convert into standard AssignmentSubmission so it updates student score matrix
    const newAssignmentSub: AssignmentSubmission = {
      id: `SUB-${submission.id}`,
      assignmentId: matchingAsg?.id || submission.quizId,
      studentName: submission.studentName,
      submittedAt: submission.submittedAt || nowStr,
      score: submission.score,
      studentFileName: `Quiz_AutoGraded_${submission.quizId}.json`,
      studentNotes: `Completed Google Forms Class Day Quiz (${submission.percentage}% score). Correct tally: ${submission.score}/${submission.totalPossible} pts.`,
      status: 'Graded',
      teacherFeedback: `Automated quiz tally: ${submission.score}/${submission.totalPossible} points (${submission.percentage}%). Completed on ${submission.submittedAt}.`,
      updatedAt: nowStr
    };

    setSubmissions(prev => {
      const filtered = prev.filter(s => !(s.assignmentId === newAssignmentSub.assignmentId && s.studentName.toLowerCase().trim() === submission.studentName.toLowerCase().trim()));
      return [newAssignmentSub, ...filtered];
    });

    logActivity({
      actor: submission.studentName,
      role: 'student',
      actionCategory: 'Quiz Completed',
      actionTitle: 'Class Day Quiz Submitted',
      details: `Submitted quiz answers. Score: ${submission.score}/${submission.totalPossible} (${submission.percentage}%).`,
      targetStudent: submission.studentName
    });

    // Notify teacher/admin
    if (onNotificationCreated) {
      onNotificationCreated({
        id: `NOTIF-QUIZ-${Date.now()}`,
        title: `📝 Quiz Submitted: ${submission.studentName}`,
        message: `${submission.studentName} completed class day quiz with score ${submission.score}/${submission.totalPossible} (${submission.percentage}%).`,
        type: 'submission',
        targetRole: 'admin',
        studentName: submission.studentName,
        assignmentId: matchingAsg?.id || submission.quizId,
        createdAt: nowStr,
        read: false,
        priority: 'normal',
        actionTab: 'exams'
      });
    }

    setActiveQuizTaker(null);
  };
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | 'perfect' | 'passed' | 'failed'>('all');
  const [isSyncingAssignments, setIsSyncingAssignments] = useState(false);
  const [syncBannerMessage, setSyncBannerMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showSyncBanner = (type: 'success' | 'error' | 'info', text: string) => {
    setSyncBannerMessage({ type, text });
    setTimeout(() => setSyncBannerMessage(null), 5000);
  };

  // Identify Student Profile
  const studentRecordTmp = students.find(s => {
    if (currentStudentName && s && s.name) {
      const sName = (s.name || '').toLowerCase().trim();
      const currName = (currentStudentName || '').toLowerCase().trim();
      return sName === currName || sName.includes(currName);
    }
    return false;
  }) || (userRole === 'student' ? students[0] : null);

  const activeStudentNameTmp = studentRecordTmp?.name || currentStudentName || 'Student Candidate';

  // Auto-scan Supabase storage bucket for missing uploaded assignment files on mount
  useEffect(() => {
    const stds = students.map(s => ({ name: s.name }));
    syncAssignmentsFromSupabaseBucket(customAssignments, submissions, stds, activeStudentNameTmp)
      .then(({ updatedAssignments, updatedSubmissions, addedSubmissionsCount, addedAssignmentsCount }) => {
        if (addedSubmissionsCount > 0 || addedAssignmentsCount > 0) {
          setCustomAssignments(updatedAssignments);
          setSubmissions(updatedSubmissions);
        }
      })
      .catch(err => {
        console.warn("Assignment storage auto-sync skipped:", err);
      });
  }, []);

  const handleSyncAssignmentsFromBucket = async () => {
    setIsSyncingAssignments(true);
    try {
      const stds = students.map(s => ({ name: s.name }));
      const { updatedAssignments, updatedSubmissions, addedSubmissionsCount, addedAssignmentsCount } = 
        await syncAssignmentsFromSupabaseBucket(customAssignments, submissions, stds, activeStudentNameTmp);
      
      if (addedSubmissionsCount > 0 || addedAssignmentsCount > 0) {
        setCustomAssignments(updatedAssignments);
        setSubmissions(updatedSubmissions);
        showSyncBanner('success', `Synced ${addedSubmissionsCount} submission(s) and created ${addedAssignmentsCount} assignment(s) from Supabase storage.`);
      } else {
        showSyncBanner('info', "All assignment files are already synced — no new submissions found.");
      }
    } catch (err: any) {
      console.error("Assignment storage sync failed:", err);
      showSyncBanner('error', `Assignment sync failed: ${err.message || String(err)}`);
    } finally {
      setIsSyncingAssignments(false);
    }
  };

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
  const [uploadFilesList, setUploadFilesList] = useState<{ name: string; url: string; type?: string }[]>([]);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadTypedResponse, setUploadTypedResponse] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);

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
  const [directStudentFiles, setDirectStudentFiles] = useState<{ name: string; url: string; type?: string }[]>([]);
  const [directStudentNotes, setDirectStudentNotes] = useState('');

  // Identify Student Profile
  const studentRecord = students.find(s => {
    if (currentStudentName && s && s.name) {
      const sName = (s.name || '').toLowerCase().trim();
      const currName = (currentStudentName || '').toLowerCase().trim();
      return sName === currName || sName.includes(currName);
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
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s => s && s.name && s.name.toLowerCase().includes(q));
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

  // Helper File Upload Handler with Supabase Storage Integration
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (fileUrl: string, fileName: string, fileType: string) => void,
    bucketName: string = 'assignments'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Url = event.target?.result as string;
        try {
          const publicUrl = await uploadToSupabaseStorage(bucketName, file.name, file);
          onComplete(publicUrl || base64Url, file.name, file.type);
        } catch (err) {
          console.error("Supabase Storage upload failed, using local fallback URL:", err);
          onComplete(base64Url, file.name, file.type);
        } finally {
          setIsUploadingFile(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File upload error:", err);
      setIsUploadingFile(false);
    }
  };

  // Helper Multi-File Upload Handler for Batch Document Processing
  const handleMultiFileUpload = async (
    files: FileList | File[],
    onCompleteMany: (uploadedFiles: { url: string; name: string; type?: string }[]) => void,
    bucketName: string = 'assignments'
  ) => {
    if (!files || files.length === 0) return;

    setIsUploadingFile(true);
    const fileList = Array.from(files);
    const results: { url: string; name: string; type?: string }[] = [];

    for (const file of fileList) {
      try {
        const base64Url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target?.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        try {
          const publicUrl = await uploadToSupabaseStorage(bucketName, file.name, file);
          results.push({
            url: publicUrl || base64Url,
            name: file.name,
            type: file.type
          });
        } catch (err) {
          console.error("Supabase Storage upload failed, using local fallback URL:", err);
          results.push({
            url: base64Url,
            name: file.name,
            type: file.type
          });
        }
      } catch (err) {
        console.error("Multi-file upload error for", file.name, err);
      }
    }

    setIsUploadingFile(false);
    if (results.length > 0) {
      onCompleteMany(results);
    }
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

      logActivity({
        actor: userRole === 'admin' ? 'Administrator' : 'Instructor',
        role: userRole === 'admin' ? 'admin' : 'teacher',
        actionCategory: 'Assignment Action',
        actionTitle: 'Written Assignment Updated',
        details: `Updated assignment "${newAsgTitle.trim()}". Due date: ${newAsgDueDate}, Max Points: ${newAsgMaxPoints}.`
      });
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

      logActivity({
        actor: userRole === 'admin' ? 'Administrator' : 'Instructor',
        role: userRole === 'admin' ? 'admin' : 'teacher',
        actionCategory: 'Assignment Action',
        actionTitle: 'New Written Assignment Created',
        details: `Created assignment "${newAsgTitle.trim()}". Module: ${newAsgModule || 'General'}, Due date: ${newAsgDueDate}, Max Points: ${newAsgMaxPoints}.`
      });
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
    const targetName = (activeStudentName || '').toLowerCase().trim();
    const existing = submissions.find(s => s.assignmentId === asg.id && (s.studentName || '').toLowerCase().trim() === targetName);
    if (existing) {
      setUploadFileName(existing.studentFileName || '');
      setUploadFileUrl(existing.studentFileUrl || '');
      setUploadFileType(existing.studentFileType || '');
      setUploadNotes(existing.studentNotes || '');
      setUploadTypedResponse(existing.studentTypedResponse || '');
      setUploadFilesList(existing.studentFiles || (existing.studentFileUrl ? [{ name: existing.studentFileName || 'Student_Response_Document.pdf', url: existing.studentFileUrl, type: existing.studentFileType }] : []));
    } else {
      setUploadFileName('');
      setUploadFileUrl('');
      setUploadFileType('');
      setUploadNotes('');
      setUploadTypedResponse('');
      setUploadFilesList([]);
    }

    setShowUploadModal(true);
  };

  const handleSaveStudentSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignmentForStudent) return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const targetName = (activeStudentName || '').toLowerCase().trim();
    const existingIndex = submissions.findIndex(
      s => s.assignmentId === activeAssignmentForStudent.id && (s.studentName || '').toLowerCase().trim() === targetName
    );

    const firstFile = uploadFilesList[0];

    if (existingIndex >= 0) {
      // Update existing submission
      const updated = [...submissions];
      updated[existingIndex] = {
        ...updated[existingIndex],
        studentFileName: firstFile?.name || uploadFileName || updated[existingIndex].studentFileName || (uploadTypedResponse ? 'Typed_Assignment_Response.txt' : 'Student_Response_Document.pdf'),
        studentFileUrl: firstFile?.url || uploadFileUrl || updated[existingIndex].studentFileUrl || (uploadTypedResponse ? `data:text/plain;charset=utf-8,${encodeURIComponent(uploadTypedResponse)}` : undefined),
        studentFileType: firstFile?.type || uploadFileType || updated[existingIndex].studentFileType || (uploadTypedResponse ? 'text/plain' : undefined),
        studentFiles: uploadFilesList,
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
        studentFileName: firstFile?.name || uploadFileName || (uploadTypedResponse ? 'Typed_Assignment_Response.txt' : 'Student_Response_Document.pdf'),
        studentFileUrl: firstFile?.url || uploadFileUrl || (uploadTypedResponse ? `data:text/plain;charset=utf-8,${encodeURIComponent(uploadTypedResponse)}` : 'data:text/plain;base64,U1RVRUVOVCBTVUJNSVNTSU9OIERPQ1VNRU5U'),
        studentFileType: firstFile?.type || uploadFileType || (uploadTypedResponse ? 'text/plain' : 'application/pdf'),
        studentFiles: uploadFilesList,
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

    logActivity({
      actor: userRole === 'admin' ? 'Administrator' : 'Instructor',
      role: userRole === 'admin' ? 'admin' : 'teacher',
      actionCategory: 'Grade Adjustment',
      actionTitle: 'Grade & Essay Correction Saved',
      details: `Graded "${assignment.title}" for ${studentName}. Score: ${correctionScore}/${assignment.maxPoints}.${correctionFeedback ? ` Feedback: "${correctionFeedback}"` : ''}`,
      targetStudent: studentName
    });

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
    const selectedStudent = studentName || (students[0]?.name || '');
    const selectedAsg = asgId || (customAssignments[0]?.id || '');

    setTargetStudentName(selectedStudent);
    setTargetAssignmentId(selectedAsg);

    const existing = submissions.find(
      s => s.assignmentId === selectedAsg && s.studentName.toLowerCase().trim() === selectedStudent.toLowerCase().trim()
    );

    if (existing) {
      setDirectStudentFileName(existing.studentFileName || '');
      setDirectStudentFileUrl(existing.studentFileUrl || '');
      setDirectStudentFiles(existing.studentFiles || (existing.studentFileUrl ? [{ name: existing.studentFileName || 'Student_File.pdf', url: existing.studentFileUrl }] : []));
      setDirectStudentNotes(existing.studentNotes || '');
    } else {
      setDirectStudentFileName('');
      setDirectStudentFileUrl('');
      setDirectStudentFiles([]);
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

    const firstFile = directStudentFiles[0];

    if (existingIndex >= 0) {
      const updated = [...submissions];
      updated[existingIndex] = {
        ...updated[existingIndex],
        studentFileName: firstFile?.name || directStudentFileName || 'Teacher_Uploaded_Student_File.pdf',
        studentFileUrl: firstFile?.url || directStudentFileUrl || updated[existingIndex].studentFileUrl,
        studentFiles: directStudentFiles,
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
        studentFileName: firstFile?.name || directStudentFileName || 'Teacher_Uploaded_Student_File.pdf',
        studentFileUrl: firstFile?.url || directStudentFileUrl || 'data:text/plain;base64,VVBMT0FERUQgQllBIEZBQ1VMVFkgRk9SIFNUVURFTlQ=',
        studentFiles: directStudentFiles,
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
    <div className="material-screen space-y-4 sm:space-y-6 animate-fadeIn pb-28 sm:pb-24 md:pb-8">
      
      {/* Sync Feedback Banner */}
      {syncBannerMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm font-medium shadow-sm animate-fadeIn ${
            syncBannerMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-300' :
            syncBannerMessage.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-300' :
            'bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-300'
          }`}
        >
          <span>{syncBannerMessage.text}</span>
          <button onClick={() => setSyncBannerMessage(null)} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Dismiss notification">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Sub-Tab Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 relative md:sticky md:top-0 z-30">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-300 shrink-0" />
              <h2 className="text-base sm:text-xl font-bold tracking-tight leading-snug break-words text-slate-900 dark:text-white">Exams, Written Assignments & Evaluations</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              HTEIM School of Ministry portal for manual course assignments, student document uploads, instructor corrections, and Google Forms quiz logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
            {isTeacherOrAdmin && (
              <>
                <button
                  onClick={() => {
                    setEditingQuizData(null);
                    setShowQuizCreatorModal(true);
                  }}
                  className="flex-1 sm:flex-none min-h-11 px-3.5 sm:px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Create Class Day Quiz</span>
                </button>

                {subTab === 'assignments' && (
                  <button
                    onClick={handleOpenCreateAssignment}
                    className="flex-1 sm:flex-none min-h-11 px-3.5 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Add Assignment</span>
                  </button>
                )}
              </>
            )}



            <button
              onClick={exportExamsCSV}
              className="flex-1 sm:flex-none min-h-11 px-3.5 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Switcher */}
        <div className="grid grid-cols-3 md:flex md:items-center gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 w-full shrink-0">
          <button
            onClick={() => setSubTab('assignments')}
            className={`min-h-11 px-1 py-1.5 sm:px-3 sm:px-3.5 py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-colors cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center whitespace-normal sm:whitespace-nowrap shrink-0 ${
              subTab === 'assignments'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>
              <span className="hidden sm:inline">Written Assignments</span>
              <span className="sm:hidden">Assignments</span>
              <span> ({customAssignments.length})</span>
            </span>
          </button>

          <button
            onClick={() => setSubTab('quizzes')}
            className={`min-h-11 px-1 py-1.5 sm:px-3 sm:px-3.5 py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-colors cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center whitespace-normal sm:whitespace-nowrap shrink-0 ${
              subTab === 'quizzes'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span>
              <span className="hidden sm:inline">Quiz Score Matrix</span>
              <span className="sm:hidden">Matrix</span>
              <span> ({allQuizSheets.length})</span>
            </span>
          </button>

          <button
            onClick={() => setSubTab('admin_dashboard')}
            className={`min-h-11 px-1 py-1.5 sm:px-3 sm:px-3.5 py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-colors cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center whitespace-normal sm:whitespace-nowrap shrink-0 ${
              subTab === 'admin_dashboard'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>
              <span className="hidden sm:inline">Admin Quizzes Dashboard</span>
              <span className="sm:hidden">Quizzes</span>
            </span>
          </button>
        </div>
      </div>

      {/* SUB TAB 1: WRITTEN ASSIGNMENTS & STUDENT UPLOADS WORKSPACE */}
      {subTab === 'assignments' && (
        <div className="space-y-6">
          
          {/* TEACHER / ADMIN QUICK ACTION BAR */}
          {isTeacherOrAdmin && (
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 min-w-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 shrink-0">
                  <Filter className="w-4 h-4 text-indigo-600 shrink-0" /> Filter Assignment:
                </span>
                <select
                  value={selectedAssignmentId}
                  onChange={(e) => setSelectedAssignmentId(e.target.value)}
                  className="min-h-11 p-2.5 sm:p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full sm:w-auto"
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
                  className="w-full min-h-11 pl-10 pr-4 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                onClick={() => handleOpenDirectStudentUpload()}
                className="min-h-11 px-3.5 py-2.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-2xs w-full sm:w-auto"
              >
                <FileUp className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Upload for Specific Student</span>
              </button>
            </div>
          )}

          {/* STUDENT PROGRESS ANALYTICS DASHBOARD (IF STUDENT) */}
          {isStudent && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-lg">
                    {activeStudentName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                      <span>{activeStudentName}</span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">Student Candidate</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Personalized Academic Trajectory & Performance Analytics</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Overall Quiz Score</p>
                    <p className="text-base font-mono font-bold text-slate-900 dark:text-white">
                      {studentRecord?.percentage !== null ? `${Math.round(studentRecord!.percentage)}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Attendance Rate</p>
                    <p className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {studentRecord ? `${Math.round(studentRecord.attendanceRate)}%` : '100%'}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Assignments Completed</p>
                    <p className="text-base font-mono font-bold text-slate-900 dark:text-white">
                      {submissions.filter(s => s.studentName.toLowerCase().trim() === activeStudentName.toLowerCase().trim() && s.score !== undefined).length} / {customAssignments.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Graphical Trajectory Sparkline & Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-slate-500" /> Grade Trajectory</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">+4.2% this month</span>
                  </div>
                  <div className="h-14 flex items-end gap-1.5 pt-2">
                    {[78, 82, 88, 85, 92, 96].map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-slate-900 dark:bg-white rounded-t-sm transition-all"
                          style={{ height: `${val}%` }}
                          title={`Score: ${val}%`}
                        />
                        <span className="text-[9px] text-slate-400 font-mono">Q{idx+1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-slate-500" /> Coursework Breakdown</span>
                    <span className="text-[10px] text-slate-400 font-mono">4 Modules</span>
                  </div>
                  <div className="space-y-1.5 text-xs pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5 text-slate-600 dark:text-slate-300">
                        <span>Hermeneutics Exegesis</span>
                        <span className="font-bold text-slate-900 dark:text-white">96/100</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-900 dark:bg-white h-full rounded-full" style={{ width: '96%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5 text-slate-600 dark:text-slate-300">
                        <span>Homiletics Outline</span>
                        <span className="font-bold text-slate-900 dark:text-white">92/100</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-slate-500" /> Academic Standing</span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-semibold">First Class Honor</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Student is meeting all School of Ministry theological and practical competency requirements with distinction.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ASSIGNMENTS OVERVIEW CARDS */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4.5 h-4.5 text-indigo-600" /> Assigned Ministry Coursework
                </h3>
                <button
                  onClick={handleSyncAssignmentsFromBucket}
                  disabled={isSyncingAssignments}
                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-extrabold text-[10px] sm:text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                  title="Scan and import uploaded assignment documents from Supabase 'assignments' Storage bucket"
                >
                  <CloudDownload className={`w-3.5 h-3.5 text-emerald-600 ${isSyncingAssignments ? 'animate-bounce' : ''}`} /> 
                  {isSyncingAssignments ? 'Syncing...' : 'Sync Uploaded Assignments'}
                </button>
              </div>
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
                        
                        <div className="flex items-center gap-2">
                          {asg.dueDate && (
                            <a
                              href={generateGoogleCalendarUrl({
                                id: asg.id,
                                title: `[Due] ${asg.title}`,
                                description: `Assignment Due Date for HTEIM School of Ministry.\nModule Track: ${asg.moduleTrack || 'Core'}\nDescription: ${asg.description}`,
                                date: asg.dueDate,
                                startTime: '11:59 pm',
                                courseCode: asg.courseCode || 'ASG'
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1"
                              title="Sync due date to Google Calendar"
                            >
                              <Share2 className="w-3 h-3 text-blue-600" />
                              <span>Sync Cal</span>
                            </a>
                          )}
                          {countdown && (
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full border shadow-2xs ${countdown.color}`}>
                              {countdown.text}
                            </span>
                          )}
                        </div>
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
                              {sub?.studentFiles && sub.studentFiles.length > 0 ? (
                                <div className="space-y-1 bg-white p-2 rounded-lg border border-indigo-100 max-h-36 overflow-y-auto custom-scrollbar">
                                  <span className="text-[10px] text-indigo-700 font-bold block mb-1">Uploaded Files ({sub.studentFiles.length}):</span>
                                  {sub.studentFiles.map((file, fIdx) => (
                                    <button
                                      key={fIdx}
                                      type="button"
                                      onClick={() => setPreviewFile({ name: file.name, url: file.url })}
                                      className="flex items-center gap-1.5 w-full text-left text-[11px] text-indigo-800 hover:text-indigo-950 hover:bg-slate-50 p-1 rounded font-medium truncate transition-colors"
                                    >
                                      <span className="text-xs">📄</span>
                                      <span className="truncate flex-1">{file.name}</span>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[11px] text-indigo-800 font-medium truncate">File: {sub?.studentFileName}</p>
                              )}
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
              <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4.5 h-4.5 text-amber-400" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider">Student Assignment Submissions & Corrections Matrix</h3>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 text-[10px] sm:text-[11px] text-slate-400">
                  <span className="sm:hidden text-amber-300 font-bold bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700/80 flex items-center gap-1">
                    <span>← Swipe horizontally →</span>
                  </span>
                  <span className="font-mono text-slate-400">
                    {filteredSubmissions.length} Record(s) Shown
                  </span>
                </div>
              </div>

              <div className="overflow-auto custom-scrollbar max-h-[600px] relative border-t border-slate-200 touch-pan-x overscroll-x-contain">
                <table className="w-full text-left border-separate border-spacing-0 text-xs min-w-[950px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3 pl-3 sm:pl-4 min-w-[140px] sm:min-w-[170px] max-w-[150px] sm:max-w-none sticky top-0 left-0 z-30 bg-slate-100 border-b border-r border-slate-200/90 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-indigo-600 shrink-0 hidden sm:inline" />
                          <span>Student Name</span>
                        </div>
                      </th>
                      <th className="p-3 sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs min-w-[200px]">Assignment Title</th>
                      <th className="p-3 sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs min-w-[140px]">Submission Status</th>
                      <th className="p-3 sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs min-w-[180px]">Student's Uploaded Response</th>
                      <th className="p-3 sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs min-w-[180px]">Teacher Corrected Document</th>
                      <th className="p-3 text-center sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs min-w-[90px]">Score</th>
                      <th className="p-3 text-right pr-4 sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs min-w-[180px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(displayedStudents.length === 0 || customAssignments.length === 0) && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <EmptyState
                            title="No submissions to display"
                            description="There are no assignment submissions matching your current filters."
                          />
                        </td>
                      </tr>
                    )}
                    {displayedStudents.length > 0 && customAssignments.length > 0 && displayedStudents.map(std => {
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
                          <tr key={`${std.name}-${asg.id}`} className="group hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 pl-3 sm:pl-4 font-bold text-slate-900 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-b border-r border-slate-200/90 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)] transition-colors min-w-[140px] sm:min-w-[170px] max-w-[150px] sm:max-w-none">
                              <div className="truncate font-bold text-slate-900 text-xs" title={std.name}>
                                {std.name}
                              </div>
                            </td>
                            <td className="p-3 text-slate-700 font-medium max-w-[220px] border-b border-slate-200" title={asg.title}>
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
                              {sub?.studentFiles && sub.studentFiles.length > 0 ? (
                                <div className="space-y-1 max-w-[220px]">
                                  {sub.studentFiles.map((file, fIdx) => (
                                    <div key={fIdx} className="flex items-center justify-between gap-1.5 bg-indigo-50/50 p-1 px-1.5 rounded-lg border border-indigo-100/40 text-[11px] hover:bg-indigo-50 transition-colors">
                                      <span className="font-mono text-indigo-800 font-bold truncate flex-1" title={file.name}>
                                        📄 {file.name}
                                      </span>
                                      <button
                                        onClick={() => setPreviewFile({ name: file.name, url: file.url })}
                                        className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer flex-shrink-0"
                                        title={`View ${file.name}`}
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : sub?.studentFileName ? (
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

      {/* SUB TAB 2: GOOGLE FORMS & QUIZ SCORE MATRIX */}
      {subTab === 'quizzes' && (
        <div className="space-y-6">

          {/* Toast Notification Banner */}
          {copiedLinkToast && (
            <div className="p-3 bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl shadow-lg border border-amber-500 flex items-center justify-between animate-fadeIn">
              <span className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-slate-900" />
                <span>{copiedLinkToast}</span>
              </span>
              <button onClick={() => setCopiedLinkToast(null)} className="text-slate-900 font-black hover:opacity-80">✕</button>
            </div>
          )}

          {/* CLASS DAY INTERACTIVE QUIZ MANAGEMENT DECK */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider rounded-md">
                    Google Forms Format
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Class Day Quizzes & Student Assignments
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Students choose correct answers from weighted options. Link-accessible quizzes tally automatically and aggregate directly into the Quiz Scores Matrix below.
                </p>
              </div>

              {isTeacherOrAdmin && (
                <button
                  onClick={() => {
                    setEditingQuizData(null);
                    setShowQuizCreatorModal(true);
                  }}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap self-start sm:self-center"
                >
                  <Plus className="w-4 h-4" /> Create New Class Quiz
                </button>
              )}
            </div>

            {/* Quiz Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customAssignments
                .filter(a => a.type === 'quiz' || a.quizData)
                .map(asg => {
                  const quiz = asg.quizData || {
                    id: asg.id,
                    title: asg.title,
                    courseCode: asg.courseCode,
                    moduleTrack: asg.moduleTrack,
                    description: asg.description,
                    totalPoints: asg.maxPoints,
                    createdAt: asg.createdAt || '2026-08-01',
                    dueDate: asg.dueDate,
                    shareCode: `qz_${asg.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`,
                    questions: []
                  };

                  const submissionCount = quizSubmissionsList.filter(s => s.quizId === quiz.id).length;

                  return (
                    <div 
                      key={asg.id} 
                      className="bg-slate-50/80 border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 shadow-2xs space-y-3.5 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 text-[10px] font-mono font-black rounded-md">
                            {quiz.courseCode || 'MIN-101'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 font-mono">
                            Code: <span className="text-indigo-600 font-extrabold">{quiz.shareCode}</span>
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                          {quiz.title}
                        </h4>

                        <p className="text-xs text-slate-600 line-clamp-2">
                          {quiz.description}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="font-bold flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-indigo-600" /> {quiz.questions.length} Questions
                          </span>
                          <span className="font-bold flex items-center gap-1 text-amber-700">
                            <Award className="w-3.5 h-3.5 text-amber-600" /> {quiz.totalPoints} Total Points
                          </span>
                          <span className="font-bold text-slate-700">
                            {submissionCount} Submissions
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-200/80 flex items-center gap-1.5 flex-wrap">
                        {/* Take / Practice Quiz */}
                        <button
                          onClick={() => setActiveQuizTaker(quiz)}
                          className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <ChevronRight className="w-3.5 h-3.5" /> {isStudent ? 'Take Quiz' : 'Test Quiz View'}
                        </button>

                        {/* Copy Link */}
                        <button
                          onClick={() => handleCopyQuizLink(quiz)}
                          className="p-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                          title="Copy Share Link for Students"
                        >
                          <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                        </button>

                        {/* Copy / Duplicate Quiz for Future Class Days */}
                        {isTeacherOrAdmin && (
                          <button
                            onClick={() => handleDuplicateQuiz(quiz)}
                            className="p-1.5 bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            title="Duplicate Quiz for Future Class Day"
                          >
                            <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                          </button>
                        )}

                        {/* Edit Quiz */}
                        {isTeacherOrAdmin && (
                          <button
                            onClick={() => {
                              setEditingQuizData(quiz);
                              setShowQuizCreatorModal(true);
                            }}
                            className="p-1.5 bg-white border border-slate-200 hover:border-amber-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            title="Edit Questions & Options"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                        )}

                        {/* Collation Matrix View */}
                        {isTeacherOrAdmin && (
                          <button
                            onClick={() => setActiveCollatingQuiz(asg)}
                            className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            title="View Collated Answers & Item Analysis"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" /> Matrix
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          
          {/* Google Sheets Connection / Sync Card */}
          {isTeacherOrAdmin && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Google Forms Quiz Score Sync
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Connect your Google account and load your School of Ministry Quiz Sheets to automatically tabulate exam scores.
                  </p>
                </div>
                {googleUser && (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs self-start sm:self-center">
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-300 flex-shrink-0 bg-white flex items-center justify-center">
                      {googleUser.photoURL ? <img src={googleUser.photoURL} alt="User" className="w-full h-full object-cover" /> : <User className="w-3 h-3 text-slate-500" />}
                    </div>
                    <span className="font-semibold text-slate-700 truncate max-w-[120px]" title={googleUser.displayName || googleUser.email}>{googleUser.displayName || googleUser.email}</span>
                    <button 
                      type="button" 
                      onClick={onGoogleLogout} 
                      className="text-[10px] text-rose-600 hover:text-rose-700 font-bold ml-2 hover:underline cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {!googleUser ? (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-indigo-900">Sign in to pull quiz records</p>
                    <p className="text-xs text-indigo-700">Authorise Google access to safely parse classroom exam spreadsheets.</p>
                  </div>
                  <button 
                    onClick={onGoogleLogin}
                    disabled={isLoggingIn}
                    className="flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all uppercase disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    {isLoggingIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                    Sign in with Google
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    if (onLoadSheets) onLoadSheets(e);
                  }} 
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
                >
                  <div className="md:col-span-8 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Google Spreadsheet URL</label>
                      <div className="flex items-center gap-2">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Offline Fallback Mode
                          </span>
                        )}
                        {lastSyncedTime && (
                          <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-full">
                            Last Synced: {lastSyncedTime}
                          </span>
                        )}
                      </div>
                    </div>
                    <input 
                      type="url" 
                      required
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl && setSheetUrl(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 font-medium"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <button 
                      type="submit"
                      disabled={isLoadingSheets || !sheetUrl}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all uppercase disabled:opacity-50 cursor-pointer h-[38px]"
                    >
                      {isLoadingSheets ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Sync Quiz Scores
                    </button>
                  </div>

                  {/* Recent Sheets Quick Select */}
                  {recentSheets && recentSheets.length > 0 && (
                    <div className="md:col-span-12 pt-1 border-t border-slate-100 mt-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                        <Bookmark className="w-3 h-3 text-indigo-500" /> Recent Spreadsheets
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {recentSheets.map(s => (
                          <div 
                            key={s.id}
                            className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                              s.url === sheetUrl 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold' 
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                            onClick={() => {
                              if (setSheetUrl) setSheetUrl(s.url);
                              if (onLoadSheets) onLoadSheets(undefined, s.url);
                            }}
                          >
                            <span className="truncate max-w-[200px]">{s.title}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onRemoveRecentSheet) onRemoveRecentSheet(s.id, e);
                              }}
                              className="text-slate-400 hover:text-rose-500 rounded p-0.5"
                              title="Remove from history"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}

          {/* Analytics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-slate-500">Evaluated Candidates</p>
              <p className="text-xl sm:text-2xl font-black font-mono mt-1 text-slate-900">{totalEvaluated}</p>
              <p className="text-[10px] text-indigo-600 font-medium mt-0.5 truncate">Quiz Submissions Logged</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-slate-500">Class Exam Average</p>
              <p className="text-xl sm:text-2xl font-black font-mono mt-1 text-indigo-700">{classExamAvg}%</p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">Overall Pass Rate</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-slate-500">Perfect 100% Scores</p>
              <p className="text-xl sm:text-2xl font-black font-mono mt-1 text-emerald-600">{perfectScores}</p>
              <p className="text-[10px] text-emerald-700 font-bold mt-0.5 truncate">A+ Distinctions</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-slate-500">Needs Review (&lt;70%)</p>
              <p className="text-xl sm:text-2xl font-black font-mono mt-1 text-rose-600">{failedScores}</p>
              <p className="text-[10px] text-rose-700 font-medium mt-0.5 truncate">Recommended Retake</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student exam record by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto custom-scrollbar">
              <button
                onClick={() => setGradeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-none text-center ${
                  gradeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                All ({students.length})
              </button>
              <button
                onClick={() => setGradeFilter('passed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-none text-center ${
                  gradeFilter === 'passed' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                Passed ({passedScores})
              </button>
            </div>
          </div>

          {/* Main Quiz Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider">Exam, Quiz & Written Assignment Score Matrix</h3>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 text-[10px] sm:text-[11px] text-slate-400">
                <span className="sm:hidden text-amber-300 font-bold bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700/80 flex items-center gap-1">
                  <span>← Swipe horizontally →</span>
                </span>
                <span className="font-mono text-slate-300">
                  {allQuizSheets.length} Quizzes & {customAssignments.length} Assignments
                </span>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto custom-scrollbar max-h-[600px] relative border-t border-slate-200 touch-pan-x overscroll-x-contain">
              <table className="w-full text-left border-separate border-spacing-0 text-xs min-w-[1000px] sm:min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3 pl-3 sm:pl-4 min-w-[140px] sm:min-w-[180px] max-w-[160px] sm:max-w-none sticky top-0 left-0 z-30 bg-slate-100 border-b border-r border-slate-200/90 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-indigo-600 shrink-0 hidden sm:inline" />
                        <span>Student Candidate</span>
                      </div>
                    </th>
                    {allQuizSheets.map(qs => (
                      <th key={qs} className="p-3 text-center min-w-[120px] sm:min-w-[130px] sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs" title={qs}>{qs}</th>
                    ))}
                    {customAssignments.map(asg => (
                      <th key={asg.id} className="p-3 text-center min-w-[140px] sm:min-w-[150px] sticky top-0 z-20 bg-indigo-50/95 text-indigo-900 border-b border-indigo-200 shadow-2xs" title={asg.title}>
                        {asg.title} ({asg.maxPoints} pts)
                      </th>
                    ))}
                    <th className="p-3 text-center min-w-[90px] sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs">Overall Avg</th>
                    <th className="p-3 text-center min-w-[70px] sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs">Grade</th>
                    <th className="p-3 text-center min-w-[100px] sm:min-w-[110px] sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs">Participation</th>
                    <th className="p-3 text-center min-w-[100px] sm:min-w-[110px] sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs">Assignments</th>
                    <th className="p-3 text-center min-w-[105px] sticky top-0 z-20 bg-indigo-100/90 text-indigo-950 border-b border-indigo-200 shadow-2xs">Composite Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedStudents.map((s) => {
                    const studentKey = s.name.toLowerCase().trim();
                    const rub = rubricScores[studentKey] || { participation: 90, scripture: 95, assignment: 85 };
                    const qPct = s.percentage !== null ? Math.round(s.percentage) : 0;
                    const composite = Math.round((qPct + rub.participation + rub.assignment) / 3);
                    const gradeLetter = getGradeLetter(s.percentage);

                    return (
                      <tr key={s.name} className="group hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 pl-3 sm:pl-4 font-bold text-slate-900 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-b border-r border-slate-200/90 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)] transition-colors min-w-[140px] sm:min-w-[180px] max-w-[160px] sm:max-w-none">
                          <div className="truncate font-bold text-slate-900 text-xs" title={s.name}>
                            {s.name}
                          </div>
                        </td>
                        {allQuizSheets.map(qs => {
                          const score = s.attendanceByDay?.[qs]?.score || '—';
                          const hasScore = score !== '—';
                          return (
                            <td key={`${qs}-${score}`} className={`p-3 text-center font-mono font-bold text-slate-800 border-b border-slate-200 transition-all duration-300 ${hasScore ? 'animate-grade-pulse' : ''}`}>
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
                            <td key={`${asg.id}-${sub?.score || 0}-${sub?.updatedAt || ''}`} className={`p-3 text-center font-mono border-b border-slate-200 transition-all duration-300 ${badgeColor}`}>
                              {scoreDisplay}
                            </td>
                          );
                        })}
                        <td className="p-3 text-center font-mono font-extrabold text-indigo-700 border-b border-slate-200 transition-all duration-300 animate-grade-pulse">
                          {s.percentage !== null ? `${Math.round(s.percentage)}%` : 'N/A'}
                        </td>
                        <td className="p-3 text-center border-b border-slate-200">
                          <span className="px-2 py-0.5 rounded font-mono font-black text-[11px] bg-indigo-100 text-indigo-800 transition-all duration-300 inline-block animate-grade-pulse">
                            {gradeLetter}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono border-b border-slate-200">
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
                        <td className="p-3 text-center font-mono border-b border-slate-200">
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
                        <td className="p-3 text-center font-mono font-black text-indigo-900 bg-indigo-50/50 border-b border-slate-200">
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

      {/* SUB TAB 3: ADMIN QUIZZES DASHBOARD */}
      {subTab === 'admin_dashboard' && (
        <AdminQuizzesDashboard
          userRole={userRole}
          quizzes={customAssignments.filter(a => a.type === 'quiz' || a.quizData).map(a => a.quizData || {
            id: a.id,
            title: a.title,
            courseCode: a.courseCode,
            moduleTrack: a.moduleTrack,
            description: a.description,
            totalPoints: a.maxPoints,
            createdAt: a.createdAt || '2026-08-01',
            dueDate: a.dueDate,
            shareCode: `qz_${a.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`,
            questions: []
          })}
          submissions={quizSubmissionsList}
          onSaveQuiz={handleSaveQuiz}
          onDeleteQuiz={(quizId) => {
            setCustomAssignments(prev => prev.filter(a => a.id !== quizId && a.quizData?.id !== quizId));
          }}
          onDuplicateQuiz={handleDuplicateQuiz}
          onTakeQuiz={(quiz) => setActiveQuizTaker(quiz)}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD/EDIT ASSIGNMENT (TEACHER / ADMIN) */}
      {/* ========================================================= */}
      {showAddAssignmentModal && (
        <Modal
          isOpen={showAddAssignmentModal}
          onClose={handleCloseAddAssignmentModal}
          title={editingAssignmentId ? 'Edit Course Assignment' : 'Create Manual Course Assignment'}
          icon={editingAssignmentId ? <Edit3 className="w-5 h-5 text-indigo-600 shrink-0" /> : <Plus className="w-5 h-5 text-indigo-600 shrink-0" />}
          size="lg"
        >
          <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs font-medium">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Module / Track</label>
                <input
                  type="text"
                  value={newAsgModule}
                  onChange={(e) => setNewAsgModule(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Start Date
                </label>
                <input
                  type="date"
                  value={newAsgStartDate}
                  onChange={(e) => setNewAsgStartDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={newAsgDueDate}
                  onChange={(e) => setNewAsgDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                />
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
                <Paperclip className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Optional Worksheet / Rubric File
              </label>
              <div className="flex items-center gap-2">
                {isUploadingFile ? (
                  <div className="flex items-center gap-1.5 p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 animate-pulse text-[11px] font-bold w-full">
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>Uploading worksheet reference...</span>
                  </div>
                ) : (
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, (url, name) => {
                      setNewAsgAttachmentUrl(url);
                      setNewAsgAttachmentName(name);
                    })}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                )}
              </div>
              {newAsgAttachmentName && (
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Attached: {newAsgAttachmentName}
                </p>
              )}
            </div>

            <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={handleCloseAddAssignmentModal}
                className="px-4 py-2.5 sm:py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer text-center"
              >
                {editingAssignmentId ? 'Save Changes' : 'Create Assignment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: STUDENT UPLOAD RESPONSE */}
      {/* ========================================================= */}
      {showUploadModal && activeAssignmentForStudent && (
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload Assignment Response"
          subtitle={activeAssignmentForStudent.title}
          icon={<Upload className="w-5 h-5 text-indigo-600 shrink-0" />}
          size="lg"
        >
          <form onSubmit={handleSaveStudentSubmission} className="space-y-4 text-xs font-medium">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900">
                <p className="font-bold text-xs">Student Candidate: <strong>{activeStudentName}</strong></p>
                <p className="text-[11px] text-indigo-700 mt-0.5">Due Date: {activeAssignmentForStudent.dueDate} | Max Points: {activeAssignmentForStudent.maxPoints}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Edit3 className="w-4 h-4 text-indigo-600 shrink-0" /> Type Out Assignment Response Directly
                </label>
                <textarea
                  rows={5}
                  placeholder="Type or paste your assignment essay, theological reflections, or exam answers directly here..."
                  value={uploadTypedResponse}
                  onChange={(e) => setUploadTypedResponse(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-sans text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-500">You can type your response above, upload a document file below, or do both!</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <FileUp className="w-4 h-4 text-indigo-600 shrink-0" /> Upload Documents or Images
                  </label>
                  <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200/80">
                    Multi-Document Upload Enabled
                  </span>
                </div>

                {/* Drag and Drop Dropzone Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingUpload(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDraggingUpload(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingUpload(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleMultiFileUpload(e.dataTransfer.files, (newFiles) => {
                        setUploadFilesList(prev => {
                          const existingNames = new Set(prev.map(f => f.name));
                          const filteredNew = newFiles.filter(f => !existingNames.has(f.name));
                          const combined = [...prev, ...filteredNew];
                          if (combined.length > 0) {
                            setUploadFileName(combined[0].name);
                            setUploadFileUrl(combined[0].url);
                            setUploadFileType(combined[0].type || '');
                          }
                          return combined;
                        });
                      });
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                    isDraggingUpload
                      ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]'
                      : 'border-slate-200 hover:border-indigo-300 bg-slate-50/50'
                  }`}
                >
                  {isUploadingFile ? (
                    <div className="flex flex-col items-center justify-center py-3 space-y-2 text-indigo-700">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                      <p className="text-xs font-bold">Uploading assignment documents to portal storage...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Drag & drop multiple files here, or choose files
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Upload multiple PDF, Word (.docx), TXT, PNG, or JPG files at once
                        </p>
                      </div>

                      <div className="pt-1">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.txt,.rtf,.png,.jpg,.jpeg,.gif,.webp,image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleMultiFileUpload(e.target.files, (newFiles) => {
                                setUploadFilesList(prev => {
                                  const existingNames = new Set(prev.map(f => f.name));
                                  const filteredNew = newFiles.filter(f => !existingNames.has(f.name));
                                  const combined = [...prev, ...filteredNew];
                                  if (combined.length > 0) {
                                    setUploadFileName(combined[0].name);
                                    setUploadFileUrl(combined[0].url);
                                    setUploadFileType(combined[0].type || '');
                                  }
                                  return combined;
                                });
                              });
                              e.target.value = '';
                            }
                          }}
                          className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {uploadFilesList.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Documents Selected ({uploadFilesList.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadFilesList([]);
                          setUploadFileName('');
                          setUploadFileUrl('');
                          setUploadFileType('');
                        }}
                        className="text-[10px] text-rose-600 hover:underline font-bold cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {uploadFilesList.map((file, idx) => {
                        const isImage = file.url?.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);
                        return (
                          <div key={idx} className="flex flex-col p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/70 transition-all gap-2 animate-fadeIn">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-base shrink-0">{isImage ? '🖼️' : '📄'}</span>
                                <div className="text-left overflow-hidden">
                                  <p className="text-xs font-bold text-slate-800 truncate" title={file.name}>{file.name}</p>
                                  <p className="text-[10px] text-slate-500 capitalize">{file.type?.split('/')[1] || 'document'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile({ name: file.name, url: file.url })}
                                  className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                  title="Preview file"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadFilesList(prev => {
                                      const filtered = prev.filter((_, i) => i !== idx);
                                      if (filtered.length > 0) {
                                        setUploadFileName(filtered[0].name);
                                        setUploadFileUrl(filtered[0].url);
                                        setUploadFileType(filtered[0].type || '');
                                      } else {
                                        setUploadFileName('');
                                        setUploadFileUrl('');
                                        setUploadFileType('');
                                      }
                                      return filtered;
                                    });
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Remove file"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            {isImage && file.url && (
                              <div className="p-1.5 bg-white border border-slate-200 rounded-lg text-center">
                                <img 
                                  src={file.url} 
                                  alt={file.name} 
                                  className="max-h-20 mx-auto rounded border border-slate-200 object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">No document files attached yet.</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Student Notes / Reflections (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Add any comments for the instructor regarding your submission..."
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 sm:py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>Submit Response</span>
                </button>
              </div>
            </form>
          </Modal>
        )}

      {/* ========================================================= */}
      {/* MODAL 3: TEACHER GRADE & UPLOAD CORRECTED ASSIGNMENT */}
      {/* ========================================================= */}
      {showCorrectionModal && activeSubmissionForCorrection && (
        <Modal
          isOpen={showCorrectionModal}
          onClose={() => setShowCorrectionModal(false)}
          title="Grade & Attach Correction"
          subtitle={`Student: ${activeSubmissionForCorrection.studentName}`}
          icon={<FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />}
          size="lg"
        >
          <form onSubmit={handleSaveCorrection} className="space-y-4 text-xs font-medium">
              {/* Student Submission Quick View */}
              {activeSubmissionForCorrection.submission?.studentFiles && activeSubmissionForCorrection.submission.studentFiles.length > 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Student's Uploaded Documents ({activeSubmissionForCorrection.submission.studentFiles.length})</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                    {activeSubmissionForCorrection.submission.studentFiles.map((file, fIdx) => (
                      <div key={fIdx} className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-100">
                        <p className="font-bold text-slate-900 truncate flex-1" title={file.name}>📄 {file.name}</p>
                        <button
                          type="button"
                          onClick={() => setPreviewFile({
                            name: file.name,
                            url: file.url
                          })}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 font-bold rounded-lg flex items-center gap-1 cursor-pointer text-[11px] transition-colors shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeSubmissionForCorrection.submission?.studentFileName ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                  <div className="space-y-0.5 overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Student's Document</p>
                    <p className="font-bold text-slate-900 truncate">{activeSubmissionForCorrection.submission.studentFileName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewFile({
                      name: activeSubmissionForCorrection.submission!.studentFileName!,
                      url: activeSubmissionForCorrection.submission!.studentFileUrl
                    })}
                    className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-100 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600" /> Inspect
                  </button>
                </div>
              ) : null}

              {activeSubmissionForCorrection.submission?.studentTypedResponse && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold text-indigo-900 uppercase flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Student's Typed Response
                    </p>
                    <button
                      type="button"
                      onClick={() => setPreviewFile({
                        name: `Typed Response - ${activeSubmissionForCorrection.studentName}`,
                        content: activeSubmissionForCorrection.submission!.studentTypedResponse
                      })}
                      className="text-[10px] bg-white text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-300 hover:bg-indigo-50 cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Eye className="w-3 h-3" /> Expand
                    </button>
                  </div>
                  <div className="max-h-24 overflow-y-auto bg-white p-2 rounded-lg border border-indigo-100 text-[11px] text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
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
                  rows={2}
                  placeholder="Provide constructive feedback, commendations, or theological guidance..."
                  value={correctionFeedback}
                  onChange={(e) => setCorrectionFeedback(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* UPLOAD CORRECTED ASSIGNMENT FILE */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <label className="font-bold text-slate-800 flex items-center gap-1 text-xs">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" /> Upload Corrected Document
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, (url, name, type) => {
                    setCorrectedFileUrl(url);
                    setCorrectedFileName(name);
                    setCorrectedFileType(type);
                  })}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                />
                {correctedFileName && (
                  <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Attached: {correctedFileName}
                  </p>
                )}
              </div>

              <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2.5 sm:py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 text-center"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Save Grade & Return</span>
                </button>
              </div>
            </form>
          </Modal>
        )}

      {/* ========================================================= */}
      {/* MODAL 4: TEACHER DIRECT UPLOAD TO SPECIFIC STUDENT / EDIT UPLOAD */}
      {/* ========================================================= */}
      {showDirectStudentModal && (
        <Modal
          isOpen={showDirectStudentModal}
          onClose={() => setShowDirectStudentModal(false)}
          title="Upload or Edit Student Assignment File"
          icon={<FileUp className="w-5 h-5 text-indigo-600 shrink-0" />}
          size="lg"
        >
          <form onSubmit={handleSaveDirectStudentUpload} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Upload / Replace Documents (Multiple Allowed)</label>
                  <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    Multi-Upload
                  </span>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.rtf,.png,.jpg,.jpeg,.gif,.webp,image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleMultiFileUpload(e.target.files, (newFiles) => {
                        setDirectStudentFiles(prev => {
                          const existingNames = new Set(prev.map(f => f.name));
                          const filtered = newFiles.filter(f => !existingNames.has(f.name));
                          const combined = [...prev, ...filtered];
                          if (combined.length > 0) {
                            setDirectStudentFileName(combined[0].name);
                            setDirectStudentFileUrl(combined[0].url);
                          }
                          return combined;
                        });
                      });
                      e.target.value = '';
                    }
                  }}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />

                {directStudentFiles.length > 0 ? (
                  <div className="space-y-1.5 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Attached Documents ({directStudentFiles.length})</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                      {directStudentFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-xs">
                          <span className="font-bold text-slate-800 truncate flex-1">📄 {file.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setDirectStudentFiles(prev => {
                                const filtered = prev.filter((_, i) => i !== idx);
                                if (filtered.length > 0) {
                                  setDirectStudentFileName(filtered[0].name);
                                  setDirectStudentFileUrl(filtered[0].url);
                                } else {
                                  setDirectStudentFileName('');
                                  setDirectStudentFileUrl('');
                                }
                                return filtered;
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : directStudentFileName ? (
                  <p className="text-[11px] text-emerald-700 font-bold mt-1">Selected File: {directStudentFileName}</p>
                ) : null}
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

              <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDirectStudentModal(false)}
                  className="px-4 py-2.5 sm:py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer text-center"
                >
                  Save Student Upload
                </button>
              </div>
            </form>
          </Modal>
        )}

      {/* ========================================================= */}
      {/* MODAL 5: DOCUMENT PREVIEW MODAL */}
      {/* ========================================================= */}
      {previewFile && (
        <Modal
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          title={previewFile.name}
          icon={<Eye className="w-5 h-5 text-indigo-600 shrink-0" />}
          size="2xl"
        >
          <div className="space-y-4">
              {previewFile.content && (
                <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <p className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-indigo-600 shrink-0" /> Student Typed Response Content
                  </p>
                  <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 font-sans leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {previewFile.content}
                  </div>
                </div>
              )}

              {previewFile.url && (() => {
                const isImage = previewFile.url?.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(previewFile.name);
                return isImage ? (
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <p className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Image className="w-4 h-4 text-indigo-600 shrink-0" /> Image Submission Preview
                    </p>
                    <div className="p-2 sm:p-4 bg-white rounded-xl border border-slate-200 text-center overflow-auto">
                      <img 
                        src={previewFile.url} 
                        alt={previewFile.name} 
                        className="max-h-[300px] sm:max-h-[350px] mx-auto rounded-xl border border-slate-300 object-contain shadow-md bg-slate-50"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" /> Document Stream Ready
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      File <strong>"{previewFile.name}"</strong> is securely encoded in the School of Ministry repository. Click download below to save the full document locally.
                    </p>
                  </div>
                );
              })()}
            </div>

            {previewFile.url && (
              <div className="p-4 sm:p-6 pt-0 shrink-0">
                <div className="text-center py-4 sm:py-5 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2.5">
                  <FolderOpen className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400 mx-auto" />
                  <p className="text-xs text-slate-700 font-bold truncate max-w-xs mx-auto">{previewFile.name}</p>
                  <a
                    href={previewFile.url}
                    download={previewFile.name}
                    className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 shrink-0" /> Download Complete File
                  </a>
                </div>
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer text-center hover:bg-slate-200"
              >
                Close Preview
              </button>
            </div>
          </Modal>
        )}

      {/* ========================================================= */}
      {/* MODAL: GOOGLE FORMS QUIZ CREATOR */}
      {/* ========================================================= */}
      {showQuizCreatorModal && (
        <QuizCreatorModal
          isOpen={showQuizCreatorModal}
          onClose={() => {
            setShowQuizCreatorModal(false);
            setEditingQuizData(null);
            navigate({ action: undefined, id: undefined });
          }}
          onSaveQuiz={handleSaveQuiz}
          initialData={editingQuizData}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: QUIZ TAKER VIEW (STUDENT / PRACTICE) */}
      {/* ========================================================= */}
      {activeQuizTaker && (
        <QuizTakerView
          quiz={activeQuizTaker}
          currentStudentName={activeStudentName}
          onClose={() => setActiveQuizTaker(null)}
          onSubmitQuiz={handleQuizSubmissionComplete}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: QUIZ COLLATION & ANSWER MATRIX */}
      {/* ========================================================= */}
      {activeCollatingQuiz && activeCollatingQuiz.quizData && (
        <Modal
          isOpen={!!activeCollatingQuiz}
          onClose={() => setActiveCollatingQuiz(null)}
          title={`${activeCollatingQuiz.quizData.title} — Answers Matrix`}
          subtitle="Collated student submission analytics"
          icon={<FileSpreadsheet className="w-5 h-5 text-indigo-600 shrink-0" />}
          size="4xl"
        >
          <div className="space-y-6">
              {/* Question Item Analysis Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Question Item Analytics ({activeCollatingQuiz.quizData.questions.length} Questions)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeCollatingQuiz.quizData.questions.map((q, idx) => {
                    const quizSubs = quizSubmissionsList.filter(s => s.quizId === activeCollatingQuiz.quizData!.id);
                    const correctCount = quizSubs.filter(s => {
                      const resp = s.responses.find(r => r.questionId === q.id);
                      return resp && resp.selectedOptionId === q.correctOptionId;
                    }).length;
                    const correctPct = quizSubs.length > 0 ? Math.round((correctCount / quizSubs.length) * 100) : 0;

                    return (
                      <div key={q.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-900">Q{idx + 1}. Weight: {q.weight} pts</span>
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold ${
                            correctPct >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {correctPct}% Correct ({correctCount}/{quizSubs.length})
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-snug">{q.questionText}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Student Collation Response Matrix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Student Response Collation Grid</h4>
                  <span className="sm:hidden text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    ← Swipe matrix →
                  </span>
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-x-auto custom-scrollbar shadow-2xs touch-pan-x max-h-[450px]">
                  <table className="w-full text-left text-xs min-w-[700px] border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase">
                        <th className="p-3 sticky top-0 left-0 z-30 bg-slate-100 border-b border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[140px]">Student Name</th>
                        <th className="p-3 sticky top-0 z-20 bg-slate-100 border-b border-slate-200 min-w-[120px]">Submitted At</th>
                        <th className="p-3 text-center sticky top-0 z-20 bg-slate-100 border-b border-slate-200 min-w-[90px]">Tally Score</th>
                        <th className="p-3 text-center sticky top-0 z-20 bg-slate-100 border-b border-slate-200 min-w-[70px]">Pct</th>
                        {activeCollatingQuiz.quizData.questions.map((q, i) => (
                          <th key={q.id} className="p-3 text-center sticky top-0 z-20 bg-slate-100 border-b border-slate-200 min-w-[80px]">Q{i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {quizSubmissionsList
                        .filter(s => s.quizId === activeCollatingQuiz.quizData!.id)
                        .map(sub => (
                          <tr key={sub.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-slate-900 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-b border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[140px] truncate max-w-[160px]">{sub.studentName}</td>
                            <td className="p-3 text-slate-500 font-mono text-[11px] border-b border-slate-100">{sub.submittedAt}</td>
                            <td className="p-3 text-center font-mono font-bold text-indigo-700 border-b border-slate-100">{sub.score} / {sub.totalPossible}</td>
                            <td className="p-3 text-center font-mono font-extrabold text-emerald-700 border-b border-slate-100">{sub.percentage}%</td>
                            {activeCollatingQuiz.quizData!.questions.map(q => {
                              const resp = sub.responses.find(r => r.questionId === q.id);
                              const isCorrect = resp?.selectedOptionId === q.correctOptionId;
                              return (
                                <td key={q.id} className="p-3 text-center border-b border-slate-100">
                                  {isCorrect ? (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">✓ Correct</span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded">✕ Incorrect</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button 
                onClick={() => setActiveCollatingQuiz(null)}
                className="px-5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Matrix
              </button>
            </div>
          </Modal>
        )}

      {/* ========================================================= */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ========================================================= */}
      {deleteConfirmId && (
        <Modal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          title="Delete Assignment"
          icon={<Trash2 className="w-5 h-5 text-rose-600 shrink-0" />}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete this assignment and all associated student submissions? This action cannot be undone.
            </p>
            <div className="flex items-center gap-2">
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
        </Modal>
      )}

    </div>
  );
};
