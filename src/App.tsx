import React, { useState, useEffect, useMemo, useRef } from 'react';
import hteimLogoAsset from './assets/hteim_logo.jpg';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import stringSimilarity from 'string-similarity';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  FileSpreadsheet, 
  AlertCircle, 
  User as UserIcon, 
  Upload, 
  Loader2, 
  Database,
  Search,
  Download,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  X,
  TrendingUp,
  UserCheck,
  Calendar,
  Sparkles,
  Trash2,
  UserX,
  RotateCcw,
  RefreshCw,
  Printer,
  FileText,
  Award,
  PenSquare,
  Settings,
  Clock,
  LayoutGrid,
  List,
  Bookmark,
  ChevronDown,
  Zap,
  Check,
  Share2,
  Sliders,
  HelpCircle,
  Info,
  Mail,
  Copy,
  Maximize2,
  Minimize2,
  BarChart2,
  Flame,
  Trophy,
  Smartphone,
  CheckSquare,
  Square,
  Layers,
  BookOpen,
  GraduationCap,
  Send,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Lock,
  Medal,
  DollarSign,
  WifiOff,
  Radio,
  Camera,
  Cloud,
  CloudOff,
  UploadCloud,
  Edit3,
  Plus
} from 'lucide-react';
import { loadFromFirestore, saveToFirestore } from './lib/firebaseSync';
import { BatchAnnouncementModal } from './components/BatchAnnouncementModal';
import { MobileDownloadCenterModal } from './components/MobileDownloadCenterModal';
import { ManageClassDaysModal } from './components/ManageClassDaysModal';
import { usePWAInstall } from './lib/pwa';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { initAuth, googleSignIn, logout } from './lib/auth';
import { fetchSpreadsheetMetadata, fetchMultipleRanges, extractSpreadsheetId } from './lib/sheets';
import { getDemoAttendance } from './data';
import { TabType, AppNotification, CustomAssignment, AssignmentSubmission, ACADEMIC_LEVELS, getDefaultLevelForStudent, AcademicLevel, Course, ScheduleItem, LibraryResource, MediaResource, PaymentRecord } from './types';
import { AppUser, generateStudentUsername } from './lib/userAuth';
import { NotificationCenter } from './components/NotificationCenter';
import { generateAutomatedNotifications, filterNotificationsForUser } from './lib/notifications';
import { LoginModal } from './components/LoginModal';
import { SettingsModal, ThemeMode } from './components/SettingsModal';
import { StudentAttendancePortal } from './components/StudentAttendancePortal';
import { StudentsTab } from './components/StudentsTab';
import { CoursesTab, INITIAL_COURSES } from './components/CoursesTab';
import { ExamsTab, INITIAL_ASSIGNMENTS, INITIAL_SUBMISSIONS } from './components/ExamsTab';
import { ScheduleTab, INITIAL_SCHEDULE } from './components/ScheduleTab';
import { LibraryTab, INITIAL_RESOURCES } from './components/LibraryTab';
import { PaymentTab, INITIAL_PAYMENTS } from './components/PaymentTab';
import { DEFAULT_PRESET_MEDIA } from './components/ClassroomMediaPlayer';
import { HomeTab } from './components/HomeTab';
import { OutstandingPaymentBanner } from './components/OutstandingPaymentBanner';
import { getStudentPaymentDetails, StudentPaymentSummary } from './lib/paymentUtils';
import { AdminAuditAndBackupModal } from './components/AdminAuditAndBackupModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { logActivity } from './lib/auditLogger';
import { exportFullBackupJSON } from './lib/backupSuite';

type ClassDay = {
  id: string;
  name: string;
};

const EXCLUDED_STUDENTS = [
  'gale agrant',
  'gillian selkridge',
  'sam selk',
];

const isExcludedStudent = (name?: string) => {
  if (!name || typeof name !== 'string') return false;
  const lower = name.toLowerCase().trim();
  return EXCLUDED_STUDENTS.some(excluded => lower.includes(excluded));
};

type AttendanceRecord = {
  name: string;
  timestamp: string;
  score: string;
  classDay: string;
  present: boolean;
};

type StudentSummary = {
  name: string;
  attendanceByDay: Record<string, { present: boolean; timestamp?: string; score?: string }>;
  rate: number;
  attended: number;
  avgScore: number | null;
  note?: string;
  photoUrl?: string;
  levelId: string;
};

const parseScorePercentage = (scoreStr?: any): number | null => {
  if (scoreStr === null || scoreStr === undefined) return null;
  const str = String(scoreStr).trim();
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
  if (!isNaN(num)) {
    if (num <= 10) return num * 10;
    if (num <= 100) return num;
  }

  return null;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const lastFetchTimeRef = useRef<number>(0);

  // App User & Role State (Admin, Teacher, Student)
  const [appUser, setAppUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('hteim_app_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Default to admin user for initial seamless experience
    return {
      id: 'u-admin',
      username: 'admin',
      name: 'Administrator',
      role: 'admin',
      email: 'admin@hteim.edu'
    };
  });
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);
  const [showToolsMenu, setShowToolsMenu] = useState<boolean>(false);
  const [showAdminAuditModal, setShowAdminAuditModal] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleQuickRoleSwitch = (role: 'admin' | 'teacher' | 'student', studentNameChoice?: string) => {
    let newUser: AppUser;
    if (role === 'admin') {
      newUser = {
        id: 'u-admin',
        username: 'admin',
        name: 'Administrator',
        role: 'admin',
        email: 'admin@hteim.edu'
      };
    } else if (role === 'teacher') {
      newUser = {
        id: 'u-teacher',
        username: 'teacher',
        name: 'Rev. Dr. Faculty Instructor',
        role: 'teacher',
        email: 'teacher@hteim.edu'
      };
    } else {
      let chosenName = 'Aaron Miller';
      if (typeof studentNameChoice === 'string' && studentNameChoice.trim()) {
        chosenName = studentNameChoice.trim();
      } else if (studentNameChoice && typeof (studentNameChoice as any).name === 'string') {
        chosenName = (studentNameChoice as any).name.trim();
      } else if (uniqueStudents && uniqueStudents.length > 0) {
        const firstStudent = uniqueStudents[0];
        if (typeof firstStudent === 'string') {
          chosenName = firstStudent;
        } else if (firstStudent && typeof (firstStudent as any).name === 'string') {
          chosenName = (firstStudent as any).name;
        }
      }

      newUser = {
        id: `u-student-${chosenName.toLowerCase().replace(/\s+/g, '-')}`,
        username: generateStudentUsername(chosenName),
        name: chosenName,
        role: 'student',
        studentName: chosenName,
        email: `${generateStudentUsername(chosenName).toLowerCase()}@hteim.edu`
      };
    }
    setAppUser(newUser);
    localStorage.setItem('hteim_app_user', JSON.stringify(newUser));
    setShowRoleMenu(false);
    setSyncedBannerMessage(`🎭 Role Switch: Previewing portal as ${role.toUpperCase()} (${newUser.name})`);
    setTimeout(() => {
      setSyncedBannerMessage('');
    }, 4500);
  };
  const [showOutstandingPaymentBanner, setShowOutstandingPaymentBanner] = useState<boolean>(false);
  const [studentPaymentSummary, setStudentPaymentSummary] = useState<StudentPaymentSummary | null>(null);

  useEffect(() => {
    if (appUser) {
      localStorage.setItem('hteim_app_user', JSON.stringify(appUser));
      if (appUser.role === 'student') {
        const sName = appUser.studentName || appUser.name;
        const summary = getStudentPaymentDetails(sName);
        setStudentPaymentSummary(summary);
        if (summary.hasOutstanding) {
          setShowOutstandingPaymentBanner(true);
        } else {
          setShowOutstandingPaymentBanner(false);
        }
      } else {
        setShowOutstandingPaymentBanner(false);
        setStudentPaymentSummary(null);
      }
    } else {
      localStorage.removeItem('hteim_app_user');
      setShowOutstandingPaymentBanner(false);
      setStudentPaymentSummary(null);
    }
  }, [appUser]);

  const handleAppLoginSuccess = (user: AppUser) => {
    setAppUser(user);
    setShowLoginModal(false);
    if (user.role === 'student') {
      if (activeErpTab === 'students') {
        setActiveErpTab('attendance');
      }
      const sName = user.studentName || user.name;
      const summary = getStudentPaymentDetails(sName);
      setStudentPaymentSummary(summary);
      if (summary.hasOutstanding) {
        setShowOutstandingPaymentBanner(true);
      }
    }
  };

  const handleAppLogout = () => {
    setAppUser(null);
    localStorage.removeItem('hteim_app_user');
    setShowLoginModal(true);
  };
  
  const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem('sheetUrl') || 'https://docs.google.com/spreadsheets/d/1k9Vn2-ZkHtePYeQO0mQstzesCW4-UJLAELoFCVuVfEI/edit?gid=283667804#gid=283667804');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronized States
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('hteim_courses');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('hteim_scheduled_classes');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
  });
  const [libraryResources, setLibraryResources] = useState<LibraryResource[]>(() => {
    const saved = localStorage.getItem('hteim_library_resources');
    return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
  });
  const [classroomMedia, setClassroomMedia] = useState<MediaResource[]>(() => {
    const saved = localStorage.getItem('hteim_classroom_media');
    return saved ? JSON.parse(saved) : DEFAULT_PRESET_MEDIA;
  });
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('hteim_student_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });
  const [zoomExceptionNote, setZoomExceptionNote] = useState<string>(() => {
    return localStorage.getItem('hteim_zoom_exception_note') || '';
  });
  const [hasZoomException, setHasZoomException] = useState<boolean>(() => {
    return localStorage.getItem('hteim_has_zoom_exception') === 'true';
  });
  
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('attendanceRecords');
    const savedDeleted = localStorage.getItem('deletedStudentNames');
    let deletedList: string[] = [];
    if (savedDeleted) {
      try { deletedList = JSON.parse(savedDeleted); } catch {}
    }
    if (saved) {
      try {
        const loaded: AttendanceRecord[] = JSON.parse(saved);
        // Purge excluded students completely from records
        return loaded.filter(r => {
          if (!r || !r.name) return false;
          const nameLower = r.name.toLowerCase().trim();
          if (isExcludedStudent(r.name)) return false;
          if (deletedList.some(d => (d || '').toLowerCase().trim() === nameLower)) return false;
          return true;
        });
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [classDays, setClassDays] = useState<ClassDay[]>(() => {
    const saved = localStorage.getItem('classDays');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [dataSource, setDataSource] = useState<'demo' | 'sheets' | null>(() => {
    return (localStorage.getItem('dataSource') as any) || null;
  });

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'at_risk' | 'moderate' | 'perfect' | 'fifty_percent'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'rate_desc' | 'rate_asc'>('name_asc');
  
  // Selected Student for Detail Modal
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  
  // Deleted / Excluded Students state
  const [deletedStudentNames, setDeletedStudentNames] = useState<string[]>([]);

  // Custom Student Notes & Excused Absences
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('studentNotes');
    return saved ? JSON.parse(saved) : {};
  });

  const [excusedAbsences, setExcusedAbsences] = useState<Record<string, Record<string, boolean>>>(() => {
    const saved = localStorage.getItem('excusedAbsences');
    return saved ? JSON.parse(saved) : {};
  });

  // Student Profile Photos State
  const [studentPhotos, setStudentPhotos] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('hteim_student_photos');
    return saved ? JSON.parse(saved) : {};
  });

  const handleUpdateStudentPhoto = (studentName: string, photoDataUrl: string) => {
    const key = studentName.toLowerCase().trim();
    setStudentPhotos(prev => {
      const updated = { ...prev, [key]: photoDataUrl };
      localStorage.setItem('hteim_student_photos', JSON.stringify(updated));
      return updated;
    });
  };

  // Student Academic Levels State
  const [studentLevels, setStudentLevels] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('hteim_student_levels');
    return saved ? JSON.parse(saved) : {};
  });

  const handleUpdateStudentLevel = (studentName: string, levelId: string) => {
    const key = studentName.toLowerCase().trim();
    setStudentLevels(prev => {
      const updated = { ...prev, [key]: levelId };
      localStorage.setItem('hteim_student_levels', JSON.stringify(updated));
      return updated;
    });
  };

  // Level Filters for Attendance Matrix & Printable Attendance Report Modal
  const [selectedReportLevel, setSelectedReportLevel] = useState<string>('all');
  const [selectedReportAttendanceFilter, setSelectedReportAttendanceFilter] = useState<'all' | 'fifty_percent' | 'at_risk' | 'satisfactory'>('all');

  // Printable Report & Settings Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showMobileDownloadModal, setShowMobileDownloadModal] = useState(false);
  const [showClassDaysModal, setShowClassDaysModal] = useState(false);

  // Mobile PWA Installation Hook
  const pwaHook = usePWAInstall();

  // Theme Mode State
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('hteim_theme_mode');
    return (saved as ThemeMode) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('hteim_theme_mode', themeMode);
    document.documentElement.classList.remove('dark', 'high-contrast');
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (themeMode === 'high-contrast') {
      document.documentElement.classList.add('high-contrast');
    } else if (themeMode === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    }
  }, [themeMode]);

  // Automated Due Date & Grading Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('hteim_app_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('hteim_app_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Lifted Custom Assignments & Submissions State
  const [customAssignments, setCustomAssignments] = useState<CustomAssignment[]>(() => {
    const saved = localStorage.getItem('hteim_custom_assignments');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ASSIGNMENTS;
  });

  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(() => {
    const saved = localStorage.getItem('hteim_assignment_submissions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_SUBMISSIONS;
  });

  useEffect(() => {
    localStorage.setItem('hteim_custom_assignments', JSON.stringify(customAssignments));
  }, [customAssignments]);

  useEffect(() => {
    localStorage.setItem('hteim_assignment_submissions', JSON.stringify(submissions));
  }, [submissions]);

  // Handler to scan assignments & submissions for automated notification generation
  const handleRunNotificationScan = () => {
    setNotifications(prev => generateAutomatedNotifications(customAssignments, submissions, prev, appUser?.role, appUser?.studentName || appUser?.name));
  };

  useEffect(() => {
    handleRunNotificationScan();
  }, [appUser, customAssignments, submissions]);

  const handleMarkNotifAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllNotifsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotifs = () => {
    setNotifications([]);
  };

  const handleAddTestNotif = (notif: AppNotification) => {
    setNotifications(prev => [notif, ...prev]);
  };

  const handleSelectNotif = (notif: AppNotification) => {
    if (notif.actionTab) {
      setActiveErpTab(notif.actionTab);
    }
  };

  // Batch Announcements & PWA Mobile Offline Sync State
  const [showBatchBroadcastModal, setShowBatchBroadcastModal] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncedBannerMessage, setSyncedBannerMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setSyncedBannerMessage('🟢 Internet Reconnected! Mobile PWA auto-synced local attendance & student records.');
      setTimeout(() => setSyncedBannerMessage(null), 6000);
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSendBatchBroadcast = (bcast: {
    title: string;
    message: string;
    channel: 'email' | 'sms' | 'portal' | 'all';
    targetGroup: string;
    recipientCount: number;
  }) => {
    const notif: AppNotification = {
      id: `bcast-notif-${Date.now()}`,
      type: 'due_date',
      title: `📢 Broadcast: ${bcast.title}`,
      message: `${bcast.message.slice(0, 100)}... (Sent via ${bcast.channel.toUpperCase()} to ${bcast.recipientCount} recipients)`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      priority: 'high'
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Export Backup Handler
  const handleExportBackup = () => {
    if (appUser?.role === 'student') return;
    const data = {
      exportDate: new Date().toISOString(),
      atRiskThreshold,
      satisfactoryThreshold,
      autoSyncInterval,
      syncOnTabFocus,
      notifications,
      rubricScores,
      studentNotes,
      excusedAbsences,
      assignments: JSON.parse(localStorage.getItem('hteim_custom_assignments') || '[]'),
      submissions: JSON.parse(localStorage.getItem('hteim_assignment_submissions') || '[]')
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HTEIM_Portal_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Backup Handler
  const handleImportBackup = (jsonContent: string): boolean => {
    if (appUser?.role === 'student') return false;
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed.atRiskThreshold !== undefined) setAtRiskThreshold(parsed.atRiskThreshold);
      if (parsed.satisfactoryThreshold !== undefined) setSatisfactoryThreshold(parsed.satisfactoryThreshold);
      if (parsed.autoSyncInterval !== undefined) setAutoSyncInterval(parsed.autoSyncInterval);
      if (parsed.syncOnTabFocus !== undefined) setSyncOnTabFocus(parsed.syncOnTabFocus);
      if (parsed.notifications) setNotifications(parsed.notifications);
      if (parsed.rubricScores) setRubricScores(parsed.rubricScores);
      if (parsed.studentNotes) setStudentNotes(parsed.studentNotes);
      if (parsed.excusedAbsences) setExcusedAbsences(parsed.excusedAbsences);
      if (parsed.assignments) {
        localStorage.setItem('hteim_custom_assignments', JSON.stringify(parsed.assignments));
        setCustomAssignments(parsed.assignments);
      }
      if (parsed.submissions) {
        localStorage.setItem('hteim_assignment_submissions', JSON.stringify(parsed.submissions));
        setSubmissions(parsed.submissions);
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  // Reset Data Handler
  const handleResetAllData = () => {
    if (appUser?.role === 'student') return;
    localStorage.removeItem('hteim_custom_assignments');
    localStorage.removeItem('hteim_assignment_submissions');
    localStorage.removeItem('hteim_app_notifications');
    localStorage.removeItem('studentNotes');
    localStorage.removeItem('excusedAbsences');
    setNotifications([]);
    setStudentNotes({});
    setExcusedAbsences({});
    setAtRiskThreshold(70);
    setSatisfactoryThreshold(80);
    window.location.reload();
  };

  // View Mode: Matrix (Grid) vs Cards
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');

  // Density Mode: Comfortable vs Dense
  const [densityMode, setDensityMode] = useState<'comfortable' | 'dense'>(() => {
    const saved = localStorage.getItem('densityMode');
    return (saved as 'comfortable' | 'dense') || 'comfortable';
  });

  // Trend Chart Visibility
  const [showTrendChart, setShowTrendChart] = useState<boolean>(true);

  // Email Draft Warning Modal State
  const [showEmailDraftModal, setShowEmailDraftModal] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  // 1. Printable Certificate Modal State
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [certificateData, setCertificateData] = useState<{
    studentName: string;
    awardTitle: string;
    criteria: string;
    rate: number;
    avgScore: number | null;
  } | null>(null);

  // 2. Term / Module Semester Filter State
  const [selectedModule, setSelectedModule] = useState<'all' | 'm1' | 'm2' | 'm3'>('all');

  // 3. Batch Selection & Batch At-Risk Email Modal State
  const [selectedStudentNames, setSelectedStudentNames] = useState<string[]>([]);
  const [showBatchEmailModal, setShowBatchEmailModal] = useState<boolean>(false);
  const [copiedBatchEmail, setCopiedBatchEmail] = useState<boolean>(false);

  // PDF Report Generation & Student Transcript Modal State
  const [showStudentTranscriptModal, setShowStudentTranscriptModal] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

  // ERP Classroom System Active Tab State
  const [activeErpTab, setActiveErpTab] = useState<TabType>('home');

  const handleUpdateRubric = (studentName: string, key: 'participation' | 'scripture' | 'assignment', val: number) => {
    const studentKey = studentName.toLowerCase().trim();
    setRubricScores(prev => {
      const existing = prev[studentKey] || { participation: 90, scripture: 95, assignment: 85 };
      return {
        ...prev,
        [studentKey]: {
          ...existing,
          [key]: Math.min(100, Math.max(0, val))
        }
      };
    });
  };

  // Helper to convert Tailwind v4 OKLCH color strings to standard RGB/RGBA for html2canvas compatibility
  const convertOklchInString = (str: string): string => {
    let result = str.replace(/oklch\s*\(\s*([0-9.%]+)\s+([0-9.%]+)\s+([0-9.%]+)(?:\s*[\/,]\s*([0-9.%]+))?\s*\)/gi, (match, lStr, cStr, hStr, aStr) => {
      try {
        let L = parseFloat(lStr);
        if (lStr.endsWith('%')) L = L / 100;

        let C = parseFloat(cStr);
        if (cStr.endsWith('%')) C = C / 100;

        let H = parseFloat(hStr);

        let alpha = 1;
        if (aStr) {
          alpha = parseFloat(aStr);
          if (aStr.endsWith('%')) alpha = alpha / 100;
        }

        if (isNaN(L) || isNaN(C) || isNaN(H)) return 'rgb(128, 128, 128)';

        const a_lab = C * Math.cos((H * Math.PI) / 180);
        const b_lab = C * Math.sin((H * Math.PI) / 180);

        const l_ = L + 0.3963377774 * a_lab + 0.2158037573 * b_lab;
        const m_ = L - 0.1055613458 * a_lab - 0.0638541728 * b_lab;
        const s_ = L - 0.0894841775 * a_lab - 1.2914855480 * b_lab;

        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;

        const r_lin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        const g_lin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        const b_lin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

        const gamma = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(0, x), 1 / 2.4) - 0.055);

        const r = Math.min(255, Math.max(0, Math.round(gamma(r_lin) * 255)));
        const g = Math.min(255, Math.max(0, Math.round(gamma(g_lin) * 255)));
        const b = Math.min(255, Math.max(0, Math.round(gamma(b_lin) * 255)));

        if (alpha < 1) {
          return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
        }
        return `rgb(${r}, ${g}, ${b})`;
      } catch {
        return 'rgb(128, 128, 128)';
      }
    });

    result = result.replace(/oklch\([^)]+\)/gi, 'rgb(128, 128, 128)');
    result = result.replace(/oklab\([^)]+\)/gi, 'rgb(128, 128, 128)');
    result = result.replace(/color-mix\([^)]+\)/gi, 'rgb(128, 128, 128)');

    return result;
  };

  // High-Quality PDF Exporter Function using html2canvas & jsPDF
  const handleExportPDF = async (elementId: string, defaultFileName: string) => {
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        alert('Report content element not found. Switching to browser print...');
        window.print();
        setIsGeneratingPDF(false);
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 5000,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Sanitize style tags containing oklch
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach(styleTag => {
            if (styleTag.textContent && (styleTag.textContent.includes('oklch') || styleTag.textContent.includes('color-mix') || styleTag.textContent.includes('oklab'))) {
              styleTag.textContent = convertOklchInString(styleTag.textContent);
            }
          });

          // Sanitize inline style attributes on cloned elements
          const allEls = clonedDoc.querySelectorAll('*');
          allEls.forEach(el => {
            const inlineStyle = el.getAttribute('style');
            if (inlineStyle && (inlineStyle.includes('oklch') || inlineStyle.includes('color-mix') || inlineStyle.includes('oklab'))) {
              el.setAttribute('style', convertOklchInString(inlineStyle));
            }
          });

          const clonedEl = clonedDoc.getElementById(elementId);
          if (clonedEl) {
            clonedEl.style.maxHeight = 'none';
            clonedEl.style.height = 'auto';
            clonedEl.style.overflow = 'visible';
            clonedEl.style.position = 'static';
            clonedEl.style.width = '100%';
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const scaledHeight = (imgHeight * pdfWidth) / imgWidth;

      if (scaledHeight <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, scaledHeight);
      } else {
        let heightLeft = scaledHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position -= pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledHeight);
          heightLeft -= pdfHeight;
        }
      }

      // Save PDF via standard method
      pdf.save(defaultFileName);

      // Secondary blob download fallback for iframe environments
      try {
        const blob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = defaultFileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 5000);
      } catch (err) {
        console.log('Blob download fallback skipped:', err);
      }

    } catch (err) {
      console.error('PDF Generation error, falling back to print dialog:', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // 4. Live Ministry Check-In Mode State
  const [showLiveCheckinModal, setShowLiveCheckinModal] = useState<boolean>(false);
  const [liveCheckinDayId, setLiveCheckinDayId] = useState<string>('');
  const [liveCheckinSearch, setLiveCheckinSearch] = useState<string>('');
  const [selectedCheckinStudents, setSelectedCheckinStudents] = useState<string[]>([]);

  // Clear selections when the active check-in day or the modal visibility changes
  useEffect(() => {
    setSelectedCheckinStudents([]);
  }, [liveCheckinDayId, showLiveCheckinModal]);

  // 5. Custom Evaluation Rubric Scores State (Participation, Scripture Memory, Assignments)
  const [rubricScores, setRubricScores] = useState<Record<string, { participation: number; scripture: number; assignment: number }>>(() => {
    const saved = localStorage.getItem('rubricScores');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('rubricScores', JSON.stringify(rubricScores));
  }, [rubricScores]);

  useEffect(() => {
    localStorage.setItem('densityMode', densityMode);
  }, [densityMode]);

  // Date Range Filter
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '30days' | 'month'>('all');

  // Custom Thresholds (At Risk & Satisfactory)
  const [atRiskThreshold, setAtRiskThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('atRiskThreshold');
    return saved ? parseInt(saved, 10) : 50;
  });

  const [satisfactoryThreshold, setSatisfactoryThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('satisfactoryThreshold');
    return saved ? parseInt(saved, 10) : 80;
  });

  // Recent Sheets Shortcuts
  type RecentSheet = {
    id: string;
    url: string;
    title: string;
    lastLoaded: string;
  };

  const [recentSheets, setRecentSheets] = useState<RecentSheet[]>(() => {
    const saved = localStorage.getItem('recentSheets');
    return saved ? JSON.parse(saved) : [];
  });

  // Auto-Sync Settings
  const [autoSyncInterval, setAutoSyncInterval] = useState<number>(() => {
    const saved = localStorage.getItem('autoSyncInterval');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [syncOnTabFocus, setSyncOnTabFocus] = useState<boolean>(() => {
    const saved = localStorage.getItem('syncOnTabFocus');
    return saved ? JSON.parse(saved) : true;
  });

  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);

  // Pull from cloud on startup / login user change
  useEffect(() => {
    let active = true;
    const initialPull = async () => {
      setIsCloudSyncing(true);
      setCloudSyncError(null);
      try {
        const cloudState = await loadFromFirestore(user?.email);
        if (cloudState && active) {
          if (cloudState.records !== undefined) setRecords(cloudState.records);
          if (cloudState.classDays !== undefined) setClassDays(cloudState.classDays);
          if (cloudState.studentNotes !== undefined) setStudentNotes(cloudState.studentNotes);
          if (cloudState.excusedAbsences !== undefined) setExcusedAbsences(cloudState.excusedAbsences);
          if (cloudState.rubricScores !== undefined) setRubricScores(cloudState.rubricScores);
          if (cloudState.deletedStudentNames !== undefined) setDeletedStudentNames(cloudState.deletedStudentNames);
          if (cloudState.studentPhotos !== undefined) setStudentPhotos(cloudState.studentPhotos);
          if (cloudState.studentLevels !== undefined) setStudentLevels(cloudState.studentLevels);
          if (cloudState.customAssignments !== undefined) setCustomAssignments(cloudState.customAssignments);
          if (cloudState.submissions !== undefined) setSubmissions(cloudState.submissions);
          if (cloudState.notifications !== undefined) setNotifications(cloudState.notifications);
          if (cloudState.sheetUrl !== undefined) setSheetUrl(cloudState.sheetUrl);
          
          if (cloudState.courses !== undefined) setCourses(cloudState.courses);
          if (cloudState.schedules !== undefined) setSchedules(cloudState.schedules);
          if (cloudState.libraryResources !== undefined) setLibraryResources(cloudState.libraryResources);
          if (cloudState.classroomMedia !== undefined) setClassroomMedia(cloudState.classroomMedia);
          if (cloudState.payments !== undefined) setPayments(cloudState.payments);
          if (cloudState.zoomExceptionNote !== undefined) setZoomExceptionNote(cloudState.zoomExceptionNote);
          if (cloudState.hasZoomException !== undefined) setHasZoomException(cloudState.hasZoomException);
          
          if (cloudState.updatedAt) {
            const timeStr = new Date(cloudState.updatedAt).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            });
            setLastSyncedTime(timeStr);
          }
          setSyncedBannerMessage("☁️ Cloud Sync: Successfully pulled latest school database from Firestore.");
          setTimeout(() => setSyncedBannerMessage(null), 4500);
        } else if (cloudState === null && active) {
          // If no cloud data is present, immediately upload the existing local storage database to Firestore
          const stateToSave = {
            records,
            classDays,
            studentNotes,
            excusedAbsences,
            rubricScores,
            deletedStudentNames,
            studentPhotos,
            studentLevels,
            customAssignments,
            submissions,
            notifications,
            sheetUrl,
            courses,
            schedules,
            libraryResources,
            classroomMedia,
            payments,
            zoomExceptionNote,
            hasZoomException
          };
          const success = await saveToFirestore(user?.email, stateToSave);
          if (success) {
            const timeStr = new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            });
            setLastSyncedTime(timeStr);
            setSyncedBannerMessage("☁️ Firestore Cloud Connected: Successfully uploaded existing local database.");
            setTimeout(() => setSyncedBannerMessage(null), 5000);
          }
        }
      } catch (err: any) {
        console.error("Cloud pull error:", err);
        setCloudSyncError("Could not retrieve cloud sync data.");
      } finally {
        if (active) setIsCloudSyncing(false);
      }
    };

    initialPull();
    return () => {
      active = false;
    };
  }, [user]);

  const handlePushToCloud = async () => {
    setIsCloudSyncing(true);
    setCloudSyncError(null);
    try {
      const stateToSave = {
        records,
        classDays,
        studentNotes,
        excusedAbsences,
        rubricScores,
        deletedStudentNames,
        studentPhotos,
        studentLevels,
        customAssignments,
        submissions,
        notifications,
        sheetUrl,
        courses,
        schedules,
        libraryResources,
        classroomMedia,
        payments,
        zoomExceptionNote,
        hasZoomException
      };
      const success = await saveToFirestore(user?.email, stateToSave);
      if (success) {
        setLastSyncedTime(new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }));
        setSyncedBannerMessage("☁️ Cloud Backup Saved: Your workspace is fully synchronized in Firestore.");
        setTimeout(() => setSyncedBannerMessage(null), 4000);
      } else {
        setCloudSyncError("Cloud save failed.");
      }
    } catch (err: any) {
      console.error("Cloud push error:", err);
      setCloudSyncError("Failed to save backup to Firestore.");
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Debounced auto-save to cloud on state changes
  useEffect(() => {
    if (isCloudSyncing) return;

    const timer = setTimeout(async () => {
      if (records.length === 0 && classDays.length === 0 && courses.length === 0 && schedules.length === 0 && libraryResources.length === 0) return;

      try {
        const stateToSave = {
          records,
          classDays,
          studentNotes,
          excusedAbsences,
          rubricScores,
          deletedStudentNames,
          studentPhotos,
          studentLevels,
          customAssignments,
          submissions,
          notifications,
          sheetUrl,
          courses,
          schedules,
          libraryResources,
          classroomMedia,
          payments,
          zoomExceptionNote,
          hasZoomException
        };
        await saveToFirestore(user?.email, stateToSave);
        setLastSyncedTime(new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }));
      } catch (err) {
        console.error("Auto-sync save failed:", err);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [
    records, 
    classDays, 
    studentNotes, 
    excusedAbsences, 
    rubricScores, 
    deletedStudentNames, 
    studentPhotos, 
    studentLevels, 
    customAssignments, 
    submissions, 
    notifications, 
    sheetUrl,
    courses,
    schedules,
    libraryResources,
    classroomMedia,
    payments,
    zoomExceptionNote,
    hasZoomException,
    user
  ]);

  useEffect(() => {
    localStorage.setItem('sheetUrl', sheetUrl);
  }, [sheetUrl]);

  useEffect(() => {
    localStorage.setItem('attendanceRecords', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('classDays', JSON.stringify(classDays));
  }, [classDays]);

  useEffect(() => {
    if (dataSource) {
      localStorage.setItem('dataSource', dataSource);
    } else {
      localStorage.removeItem('dataSource');
    }
  }, [dataSource]);

  useEffect(() => {
    localStorage.setItem('deletedStudentNames', JSON.stringify(deletedStudentNames));
  }, [deletedStudentNames]);

  useEffect(() => {
    localStorage.setItem('studentNotes', JSON.stringify(studentNotes));
  }, [studentNotes]);

  useEffect(() => {
    localStorage.setItem('excusedAbsences', JSON.stringify(excusedAbsences));
  }, [excusedAbsences]);

  useEffect(() => {
    localStorage.setItem('atRiskThreshold', atRiskThreshold.toString());
  }, [atRiskThreshold]);

  useEffect(() => {
    localStorage.setItem('satisfactoryThreshold', satisfactoryThreshold.toString());
  }, [satisfactoryThreshold]);

  useEffect(() => {
    localStorage.setItem('recentSheets', JSON.stringify(recentSheets));
  }, [recentSheets]);

  useEffect(() => {
    localStorage.setItem('autoSyncInterval', autoSyncInterval.toString());
  }, [autoSyncInterval]);

  useEffect(() => {
    localStorage.setItem('syncOnTabFocus', JSON.stringify(syncOnTabFocus));
  }, [syncOnTabFocus]);

  const addRecentSheet = (url: string, title: string) => {
    setRecentSheets(prev => {
      const sheetId = extractSpreadsheetId(url) || url;
      const filtered = prev.filter(s => extractSpreadsheetId(s.url) !== sheetId);
      const newEntry: RecentSheet = {
        id: sheetId,
        url,
        title: title || 'Google Sheet',
        lastLoaded: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      return [newEntry, ...filtered].slice(0, 8);
    });
  };

  const handleRemoveRecentSheet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSheets(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveStudentNote = (studentName: string, note: string) => {
    const key = studentName.toLowerCase().trim();
    setStudentNotes(prev => ({ ...prev, [key]: note }));
  };

  const handleToggleExcusedAbsence = (studentName: string, classDayId: string) => {
    const key = studentName.toLowerCase().trim();
    setExcusedAbsences(prev => {
      const studentMap = prev[key] || {};
      const current = !!studentMap[classDayId];
      return {
        ...prev,
        [key]: {
          ...studentMap,
          [classDayId]: !current
        }
      };
    });
  };

  const handleDeleteStudent = (studentName: string) => {
    setDeletedStudentNames(prev => {
      const lower = studentName.toLowerCase().trim();
      if (prev.some(n => n.toLowerCase().trim() === lower)) {
        return prev;
      }
      return [...prev, studentName];
    });
    if (selectedStudent && selectedStudent.name.toLowerCase().trim() === studentName.toLowerCase().trim()) {
      setSelectedStudent(null);
    }
  };

  const handleRestoreStudent = (studentName: string) => {
    const lower = studentName.toLowerCase().trim();
    setDeletedStudentNames(prev => prev.filter(n => n.toLowerCase().trim() !== lower));
  };

  const handleRestoreAllStudents = () => {
    setDeletedStudentNames([]);
  };
  
  // Initialize auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setToken(token);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
      }
    } catch (err: any) {
      if (
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request' ||
        err.message?.includes('popup-closed-by-user') ||
        err.message?.includes('cancelled-popup-request')
      ) {
        // User closed sign-in popup - set gentle notification instead of scary fatal error
        setError("Sign-in window was closed. Click 'Sign in with Google' whenever you are ready.");
      } else if (err.code === 'auth/popup-blocked' || err.message?.includes('popup-blocked')) {
        setError("Sign-in popup was blocked by your browser. Please allow popups for this site and try again.");
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    if (dataSource === 'sheets') {
      setRecords([]);
      setClassDays([]);
      setDataSource(null);
    }
  };

  const handleLoadDemo = () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = getDemoAttendance();
      if (data.length === 0) throw new Error("Demo data is empty");
      
      const headers = Object.keys(data[0]);
      const rows = data.map(item => headers.map(h => item[h]));
      
      const classDayName = 'Lesson 2 Assignment';
      setClassDays([{ id: classDayName, name: `${classDayName} (05/05/2026)` }]);

      let nameIndex = headers.findIndex(h => h.toLowerCase().includes('first and last name'));
      if (nameIndex === -1) nameIndex = headers.findIndex(h => h.toLowerCase().includes('name'));
      if (nameIndex === -1) nameIndex = 2;

      let timestampIndex = headers.findIndex(h => h.toLowerCase().includes('timestamp'));
      let scoreIndex = headers.findIndex(h => h.toLowerCase().includes('score'));
      if (timestampIndex === -1) timestampIndex = 0;
      if (scoreIndex === -1) scoreIndex = 1;

      const processed: AttendanceRecord[] = rows.map(row => {
        const rawName = row[nameIndex] || 'Unknown';
        const cleanName = rawName.trim().replace(/[\r\n]+/g, ' ');
        return {
          name: cleanName,
          timestamp: row[timestampIndex] || '',
          score: row[scoreIndex] || '',
          classDay: classDayName,
          present: true,
        };
      }).filter(r => r.name && r.name !== '' && r.name !== 'Unknown' && !/^[\d\s\/]+$/.test(r.name) && !isExcludedStudent(r.name));
      
      setRecords(processed);
      setDataSource('demo');
    } catch (err: any) {
      setError('Failed to load demo data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSheets = async (e?: React.FormEvent, customUrl?: string) => {
    if (e) e.preventDefault();
    if (!token) {
      setError("Please sign in with Google first.");
      return;
    }

    const targetUrl = customUrl || sheetUrl;
    if (customUrl) {
      setSheetUrl(customUrl);
    }
    
    const spreadsheetId = extractSpreadsheetId(targetUrl);
    if (!spreadsheetId) {
      setError("Invalid Google Sheets URL. Please paste a valid URL.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    lastFetchTimeRef.current = Date.now();
    try {
      const metadata = await fetchSpreadsheetMetadata(spreadsheetId, token);
      const docTitle = metadata.properties?.title || 'Google Sheet Attendance';
      addRecentSheet(targetUrl, docTitle);

      const allSheets = metadata.sheets.map((s: any) => s.properties.title);
      const sheets = allSheets;
      
      if (sheets.length === 0) {
        throw new Error("No valid class sheets found in the document.");
      }

      const batchData = await fetchMultipleRanges(spreadsheetId, sheets, token);
      
      // Get the final list of student names currently in the system
      const currentStudentNames = Array.from(new Set(
        records.map(r => (r.name || r.studentName || '').toString().trim())
               .filter(n => n && n !== 'Unknown' && !isExcludedStudent(n))
      )) as string[];
      const currentStudentNamesLower = new Set(currentStudentNames.map(n => n.toLowerCase().trim()));

      let updatedRecords = [...records];
      const updatedClassDays = [...classDays];
      
      if (batchData.valueRanges) {
        batchData.valueRanges.forEach((rangeData: any, index: number) => {
          const sheetTitle = sheets[index];
          if (!rangeData.values || rangeData.values.length === 0) {
            if (!updatedClassDays.some(d => d.id === sheetTitle)) {
              updatedClassDays.push({ id: sheetTitle, name: sheetTitle });
            }
            return;
          }
          
          const headers = rangeData.values[0] as string[];
          const rows = rangeData.values.slice(1) as string[][];
          
          let nameIndex = headers.findIndex(h => h.toLowerCase().includes('first and last name'));
          if (nameIndex === -1) nameIndex = headers.findIndex(h => h.toLowerCase().includes('name'));
          if (nameIndex === -1) nameIndex = 2; // fallback
          
          let timestampIndex = headers.findIndex(h => h.toLowerCase().includes('timestamp'));
          let scoreIndex = headers.findIndex(h => h.toLowerCase().includes('score'));
          if (timestampIndex === -1) timestampIndex = 0;
          if (scoreIndex === -1) scoreIndex = 1;
          
          let displayDate = sheetTitle;
          if (rows.length > 0) {
            const firstTimestamp = rows[0][timestampIndex];
            if (firstTimestamp) {
              const datePart = firstTimestamp.split(' ')[0];
              if (datePart && datePart.trim() !== '') {
                const trimmedDate = datePart.trim();
                if (sheetTitle.toLowerCase().includes(trimmedDate.toLowerCase())) {
                  displayDate = sheetTitle;
                } else {
                  displayDate = `${sheetTitle} (${trimmedDate})`;
                }
              }
            }
          }
          if (!updatedClassDays.some(d => d.id === sheetTitle)) {
            updatedClassDays.push({ id: sheetTitle, name: displayDate });
          }
          
          rows.forEach(row => {
            const rawName = row[nameIndex] || 'Unknown';
            const name = rawName.trim().replace(/[\r\n]+/g, ' ');
            if (!name || name === '' || name === 'Unknown') return;
            if (/^[\d\s\/]+$/.test(name)) return;
            if (isExcludedStudent(name)) return;
            
            const nameLower = name.toLowerCase().trim();
            // Only update or add score if the student exists in our final student list
            if (currentStudentNamesLower.has(nameLower)) {
              const existingRecordIdx = updatedRecords.findIndex(r => 
                (r.name || r.studentName || '').toString().trim().toLowerCase() === nameLower && 
                r.classDay === sheetTitle
              );

              const rowScore = row[scoreIndex] || '';
              const rowTimestamp = row[timestampIndex] || '';

              if (existingRecordIdx >= 0) {
                // Update score/timestamp, do NOT overwrite present field
                updatedRecords[existingRecordIdx] = {
                  ...updatedRecords[existingRecordIdx],
                  score: rowScore,
                  timestamp: rowTimestamp || updatedRecords[existingRecordIdx].timestamp
                };
              } else {
                // Find canonical name from our records
                const canonicalName = currentStudentNames.find(n => n.toLowerCase().trim() === nameLower) || name;
                // Add score record for existing student
                updatedRecords.push({
                  name: canonicalName,
                  timestamp: rowTimestamp,
                  score: rowScore,
                  classDay: sheetTitle,
                  present: false, // leave attendance as false (managed locally)
                });
              }
            }
          });
        });
      }
      
      setClassDays(updatedClassDays);
      setRecords(updatedRecords);
      setDataSource('sheets');
      setLastSyncedTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch spreadsheet data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-Sync Interval Timer
  useEffect(() => {
    if (autoSyncInterval <= 0 || dataSource !== 'sheets' || !token || isLoading) return;

    const intervalId = setInterval(() => {
      handleLoadSheets();
    }, autoSyncInterval * 1000);

    return () => clearInterval(intervalId);
  }, [autoSyncInterval, dataSource, token, isLoading, sheetUrl]);

  // Tab Focus Auto-Sync
  useEffect(() => {
    if (!syncOnTabFocus || dataSource !== 'sheets' || !token) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isLoading) {
        const now = Date.now();
        // Cooldown of 45 seconds for tab focus auto-sync to prevent spamming Google Sheets API
        if (now - lastFetchTimeRef.current > 45000) {
          handleLoadSheets();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncOnTabFocus, dataSource, token, isLoading, sheetUrl]);

  const { uniqueStudents, avgAttendance, avgScoreOverall, classDayStats } = useMemo(() => {
    const rawNames: string[] = (Array.from(new Set(records.filter(r => r && (r.name || r.studentName)).map(r => (r.name || r.studentName || '').toString().trim()))) as string[]).filter((name: string) => name && !isExcludedStudent(name));
    const nameGroups: string[][] = [];
    const canonicalNames = new Map<string, string>();

    const MANUAL_ALIASES: Record<string, string> = {
      'denise edwards': 'Denise Edwards',
      'deniseedwards6561@gmail.com': 'Denise Edwards',
      'deniseedwards6561@gmeil.com': 'Denise Edwards',
      'denise edwards6561@gmail.com': 'Denise Edwards',
      'denise edwards 6561@gmail.com': 'Denise Edwards',
      'kabrina morris jack': 'Kabrina Morris Jack',
      'kabrinamorrisjack': 'Kabrina Morris Jack',
      'mishael daniel': 'Mishael Daniel',
      'mishaeldaniel06@gmail.com': 'Mishael Daniel',
      'mishaeldaniel06@gmeil.com': 'Mishael Daniel',
      'mishael daniel06@gmail.com': 'Mishael Daniel',
      'mishael daniel06@gmeil.com': 'Mishael Daniel',
      'niomi loverne joseph': 'Niomi Loverne Joseph Marksman',
      'laverne joseph marksman': 'Niomi Loverne Joseph Marksman',
      'niomi loverne joseph marksman': 'Niomi Loverne Joseph Marksman',
      'vanessa mohammed': 'Vanessa Mohammed',
      'v mohammed': 'Vanessa Mohammed',
      'v. mohammed': 'Vanessa Mohammed',
    };
    
    rawNames.forEach((rawName: string) => {
      if (!rawName) return;
      let foundGroup = false;
      const lowerRaw = rawName.toLowerCase().trim();
      const explicitCanonical = MANUAL_ALIASES[lowerRaw];
      const normalizedRaw = lowerRaw.replace(/[^a-z0-9 ]/g, ' ').trim();
      
      for (const group of nameGroups) {
        const representative = group[0];
        const lowerRep = (representative || '').toLowerCase().trim();
        const explicitRepCanonical = MANUAL_ALIASES[lowerRep];

        if (explicitCanonical && (explicitCanonical === explicitRepCanonical || group.some((n: string) => MANUAL_ALIASES[(n || '').toLowerCase().trim()] === explicitCanonical))) {
          group.push(rawName);
          foundGroup = true;
          break;
        }

        const normalizedRep = lowerRep.replace(/[^a-z0-9 ]/g, ' ').trim();
        const rawCompact = normalizedRaw.replace(/\s/g, '');
        const repCompact = normalizedRep.replace(/\s/g, '');
        const rawNoDigits = rawCompact.replace(/\d+/g, '').replace(/@.*$/, '');
        const repNoDigits = repCompact.replace(/\d+/g, '').replace(/@.*$/, '');

        if (rawCompact === repCompact || (rawNoDigits.length > 4 && rawNoDigits === repNoDigits)) {
          group.push(rawName);
          foundGroup = true;
          break;
        }
        
        const rawParts = normalizedRaw.split(/\s+/).filter(Boolean);
        const repParts = normalizedRep.split(/\s+/).filter(Boolean);

        if (rawParts.length >= 2 && repParts.length >= 2) {
          const rawFirst = rawParts[0];
          const rawLast = rawParts[rawParts.length - 1];
          const repFirst = repParts[0];
          const repLast = repParts[repParts.length - 1];

          if (rawLast === repLast && rawFirst[0] === repFirst[0] && (rawFirst.length === 1 || repFirst.length === 1)) {
            group.push(rawName);
            foundGroup = true;
            break;
          }
        }

        const sim = stringSimilarity.compareTwoStrings(normalizedRaw, normalizedRep);
        if (sim > 0.8) {
          group.push(rawName);
          foundGroup = true;
          break;
        }
        
        const shorter = rawParts.length < repParts.length ? rawParts : repParts;
        const longer = rawParts.length < repParts.length ? repParts : rawParts;
        
        if (shorter.length > 0 && longer.length > 0) {
          let allPartsMatch = true;
          for (const sPart of shorter) {
            let bestMatch = 0;
            for (const lPart of longer) {
              const partSim = stringSimilarity.compareTwoStrings(sPart, lPart);
              if (partSim > bestMatch) bestMatch = partSim;
            }
            if (bestMatch < 0.75) {
              allPartsMatch = false;
              break;
            }
          }
          
          if (allPartsMatch && shorter.join('').length >= 4) {
            group.push(rawName);
            foundGroup = true;
            break;
          }
        }
      }
      
      if (!foundGroup) {
        nameGroups.push([rawName]);
      }
    });
    
    nameGroups.forEach((group: string[]) => {
      let canonical = group[0];
      for (const name of group) {
        const alias = MANUAL_ALIASES[(name || '').toLowerCase().trim()];
        if (alias) {
          canonical = alias;
          break;
        }
      }

      if (!Object.values(MANUAL_ALIASES).includes(canonical)) {
        for (const name of group) {
          if (name.length > canonical.length && !name.includes('@')) {
            canonical = name;
          }
        }
      }

      group.forEach((name: string) => {
        if (name) canonicalNames.set((name || '').trim(), canonical);
      });
    });

    const studentMap = new Map<string, StudentSummary>();
    
    records.forEach(r => {
      if (!r) return;
      const recName = (r.name || r.studentName || '').toString().trim();
      if (!recName) return;
      const canonicalName = canonicalNames.get(recName) || recName;
      const key = canonicalName.toLowerCase().trim();
      
      // Skip deleted students
      if (deletedStudentNames.some(d => (d || '').toLowerCase().trim() === key)) {
        return;
      }
      
      if (!studentMap.has(key)) {
        studentMap.set(key, { 
          name: canonicalName, 
          attendanceByDay: {}, 
          rate: 0, 
          attended: 0,
          avgScore: null,
          note: studentNotes[key] || '',
          levelId: studentLevels[key] || getDefaultLevelForStudent(canonicalName, 0)
        });
      }
      const student = studentMap.get(key)!;
      student.attendanceByDay[r.classDay] = {
        present: r.present === true,
        timestamp: r.timestamp,
        score: r.score
      };
    });
    
    const totalClasses = classDays.length;
    let totalRates = 0;
    let totalScoresSum = 0;
    let studentsWithScoresCount = 0;

    const students: StudentSummary[] = Array.from(studentMap.values()).map((student, idx) => {
      const attended = Object.keys(student.attendanceByDay).length;
      const rate = totalClasses > 0 ? (attended / totalClasses) * 100 : 0;
      totalRates += rate;

      // Calculate student average score percentage
      const scoresList: number[] = [];
      Object.values(student.attendanceByDay).forEach(att => {
        const val = parseScorePercentage(att.score);
        if (val !== null) scoresList.push(val);
      });

      // Missed classes count as 0 (unless excused)
      const studentKey = (student.name || '').toLowerCase().trim();
      classDays.forEach(day => {
        const att = student.attendanceByDay[day.id];
        if (!att || !att.present) {
          const isExcused = !!(excusedAbsences[studentKey] || {})[day.id];
          if (!isExcused) {
            scoresList.push(0);
          }
        }
      });

      // Include graded course assignments and exams
      const studentSubs = submissions.filter(sub => {
        if (!sub || !sub.studentName || !student.name) return false;
        const subName = sub.studentName.toLowerCase().trim();
        const stName = student.name.toLowerCase().trim();
        return (subName === stName || stName.includes(subName) || subName.includes(stName)) &&
          (sub.status === 'Graded' || sub.status === 'Correction Returned') &&
          sub.score !== undefined;
      });

      studentSubs.forEach(sub => {
        const asg = customAssignments.find(a => a.id === sub.assignmentId);
        const maxPoints = asg?.maxPoints || 100;
        const pct = (sub.score! / maxPoints) * 100;
        scoresList.push(pct);
      });

      const avgScore = scoresList.length > 0 
        ? scoresList.reduce((a, b) => a + b, 0) / scoresList.length 
        : null;

      if (avgScore !== null) {
        totalScoresSum += avgScore;
        studentsWithScoresCount++;
      }

      const key = student.name.toLowerCase().trim();
      const note = studentNotes[key] || '';
      const photoUrl = studentPhotos[key] || '';
      const levelId = studentLevels[key] || getDefaultLevelForStudent(student.name, idx);

      return { ...student, rate, attended, avgScore, note, photoUrl, levelId };
    });

    const avg = students.length > 0 ? (totalRates / students.length) : 0;
    const avgScoreOverall = studentsWithScoresCount > 0 ? (totalScoresSum / studentsWithScoresCount) : null;

    // Calculate attendance percentage per class day
    const classDayStats: Record<string, { count: number; percentage: number }> = {};
    classDays.forEach(day => {
      let presentCount = 0;
      students.forEach(st => {
        if (st.attendanceByDay[day.id]?.present) presentCount++;
      });
      classDayStats[day.id] = {
        count: presentCount,
        percentage: students.length > 0 ? (presentCount / students.length) * 100 : 0
      };
    });

    return { uniqueStudents: students, avgAttendance: avg, avgScoreOverall, classDayStats };
  }, [records, classDays, deletedStudentNames, studentNotes, studentPhotos, studentLevels, customAssignments, submissions, excusedAbsences]);

  // Find current student stats if a student is logged in
  const loggedInStudentData = useMemo(() => {
    if (appUser && appUser.role === 'student') {
      const rawName = appUser.studentName || appUser.name || '';
      const studentNameLower = rawName.toLowerCase().trim();
      return uniqueStudents.find(st => st && st.name && st.name.toLowerCase().trim() === studentNameLower);
    }
    return null;
  }, [appUser, uniqueStudents]);

  const getStudentIdForName = (studentName: string): string => {
    const nameClean = studentName.trim();
    const hash = Math.abs(nameClean.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    let hashStr = hash.toString();
    if (hashStr.length < 4) {
      hashStr = hashStr.padStart(4, '0');
    } else {
      hashStr = hashStr.substring(0, 4);
    }
    return `HTEIM-2026-${hashStr}`;
  };

  const handleToggleStudentAttendance = (studentName: string, classDayId: string, newStatus: 'present' | 'absent' | 'excused') => {
    if (!studentName || !classDayId) return;
    const studentKey = studentName.toLowerCase().trim();

    // 1. Update excused absences
    setExcusedAbsences(prev => ({
      ...prev,
      [studentKey]: {
        ...(prev[studentKey] || {}),
        [classDayId]: newStatus === 'excused'
      }
    }));

    // 2. Update attendance records
    setRecords(prev => {
      const updated = [...prev];
      const existingIdx = updated.findIndex(r => r && (r.studentName || r.name) && (r.studentName || r.name).toLowerCase().trim() === studentKey && r.classDay === classDayId);

      if (newStatus === 'present') {
        if (existingIdx >= 0) {
          updated[existingIdx].present = true;
        } else {
          updated.push({
            studentName: studentName,
            name: studentName,
            classDay: classDayId,
            present: true,
            score: '',
            timestamp: new Date().toLocaleDateString()
          });
        }
      } else {
        if (existingIdx >= 0) {
          updated[existingIdx].present = false;
        } else {
          updated.push({
            studentName: studentName,
            name: studentName,
            classDay: classDayId,
            present: false,
            score: '',
            timestamp: new Date().toLocaleDateString()
          });
        }
      }
      return updated;
    });
  };

  const handleAddClassDay = (customTitle?: string) => {
    const title = (customTitle || '').trim() || `Class Day ${classDays.length + 1}`;
    const newDay: ClassDay = {
      id: `day-${Date.now()}`,
      name: title
    };
    setClassDays(prev => [...prev, newDay]);
    if (!liveCheckinDayId) {
      setLiveCheckinDayId(newDay.id);
    }
    logActivity({
      actor: appUser?.name || 'Admin',
      role: appUser?.role === 'student' ? 'student' : 'admin',
      actionCategory: 'Attendance Override',
      actionTitle: 'Class Session Created',
      details: `Added new class session: ${title}`
    });
  };

  const handleEditClassDayTitle = (dayId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const trimmed = newTitle.trim();
    setClassDays(prev => prev.map(d => d.id === dayId ? { ...d, name: trimmed } : d));
    logActivity({
      actor: appUser?.name || 'Admin',
      role: appUser?.role === 'student' ? 'student' : 'admin',
      actionCategory: 'Attendance Override',
      actionTitle: 'Class Session Renamed',
      details: `Renamed class day to: ${trimmed}`
    });
  };

  const handleDeleteClassDay = (dayId: string) => {
    const day = classDays.find(d => d.id === dayId);
    if (!day) return;
    if (window.confirm(`Are you sure you want to delete class session "${day.name}"?`)) {
      const updated = classDays.filter(d => d.id !== dayId);
      setClassDays(updated);
      if (liveCheckinDayId === dayId) {
        setLiveCheckinDayId(updated.length > 0 ? updated[0].id : '');
      }
      logActivity({
        actor: appUser?.name || 'Admin',
        role: appUser?.role === 'student' ? 'student' : 'admin',
        actionCategory: 'Attendance Override',
        actionTitle: 'Class Session Deleted',
        details: `Deleted class day: ${day.name}`
      });
    }
  };

  // Find all sheets/class days that have at least one score
  const allQuizSheets = useMemo(() => {
    const sheets = new Set<string>();
    records.forEach(r => {
      if (r.score && r.score.trim() !== '') {
        const pct = parseScorePercentage(r.score);
        if (pct !== null) {
          sheets.add(r.classDay);
        }
      }
    });
    return classDays.map(d => d.id).filter(id => sheets.has(id));
  }, [records, classDays]);

  // Date Range & Module/Semester Filtering for Class Days
  const effectiveClassDays = useMemo(() => {
    let filtered = classDays;

    // Filter by Academic Module / Term
    if (selectedModule !== 'all' && classDays.length > 0) {
      const total = classDays.length;
      const m1Count = Math.ceil(total / 3);
      const m2Count = Math.ceil(total / 3);

      if (selectedModule === 'm1') {
        filtered = classDays.slice(0, m1Count);
      } else if (selectedModule === 'm2') {
        filtered = classDays.slice(m1Count, m1Count + m2Count);
      } else if (selectedModule === 'm3') {
        filtered = classDays.slice(m1Count + m2Count);
      }
    }

    // Filter by Date Range
    if (dateRangeFilter === 'all') return filtered;

    const now = new Date();
    return filtered.filter(day => {
      const record = records.find(r => r.classDay === day.id);
      const dateStr = record?.timestamp || day.name;
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) return true;

      if (dateRangeFilter === '30days') {
        const diffMs = now.getTime() - parsed.getTime();
        const diffDays = diffMs / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 30;
      }
      if (dateRangeFilter === 'month') {
        return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [classDays, records, dateRangeFilter, selectedModule]);

  // Attendance Trend Line Chart Data
  const trendChartData = useMemo(() => {
    return effectiveClassDays.map(day => {
      const stats = classDayStats[day.id] || { count: 0, percentage: 0 };
      return {
        name: day.name.length > 16 ? day.name.substring(0, 14) + '...' : day.name,
        fullName: day.name,
        rate: Math.round(stats.percentage),
        present: stats.count,
        total: uniqueStudents.length,
      };
    });
  }, [effectiveClassDays, classDayStats, uniqueStudents.length]);

  // Helper for Student Milestone & Honor Roll Badges
  const getStudentBadges = (student: StudentSummary) => {
    const badges = [];

    // Milestone Badge: 100% Perfect
    if (student.rate >= 100) {
      badges.push({
        id: 'perfect',
        label: '100% Perfect',
        bg: 'bg-emerald-100/90 text-emerald-800 border-emerald-300',
        icon: <Trophy className="w-3 h-3 text-amber-500 flex-shrink-0" />
      });
    } else if (student.rate >= satisfactoryThreshold) {
      badges.push({
        id: 'satisfactory',
        label: 'Satisfactory',
        bg: 'bg-indigo-100/90 text-indigo-800 border-indigo-200',
        icon: <Check className="w-3 h-3 text-indigo-600 flex-shrink-0" />
      });
    }

    // Honor Roll Badge: Avg Score >= 85
    if (student.avgScore !== null && student.avgScore >= 85) {
      badges.push({
        id: 'honor_roll',
        label: 'Honor Roll',
        bg: 'bg-amber-100/90 text-amber-900 border-amber-300',
        icon: <Award className="w-3 h-3 text-amber-600 flex-shrink-0" />
      });
    }

    // Hot Streak Badge: Attended last 3 available sessions
    if (effectiveClassDays.length >= 3) {
      const last3Days = effectiveClassDays.slice(-3);
      const attendedLast3 = last3Days.every(d => student.attendanceByDay[d.id]?.present);
      if (attendedLast3) {
        badges.push({
          id: 'streak',
          label: '3-Session Streak',
          bg: 'bg-rose-100/90 text-rose-800 border-rose-300',
          icon: <Flame className="w-3 h-3 text-rose-500 flex-shrink-0" />
        });
      }
    }

    return badges;
  };

  // Filter & Sort Students
  const filteredAndSortedStudents = useMemo(() => {
    return uniqueStudents
      .filter(student => {
        if (searchQuery.trim() !== '') {
          if (!student.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
          }
        }
        if (statusFilter === 'at_risk' && student.rate >= atRiskThreshold) return false;
        if (statusFilter === 'moderate' && (student.rate < atRiskThreshold || student.rate >= satisfactoryThreshold)) return false;
        if (statusFilter === 'perfect' && student.rate < satisfactoryThreshold) return false;
        if (statusFilter === 'fifty_percent' && student.rate > 50) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        if (sortBy === 'rate_desc') return b.rate - a.rate || a.name.localeCompare(b.name);
        if (sortBy === 'rate_asc') return a.rate - b.rate || a.name.localeCompare(b.name);
        return 0;
      });
  }, [uniqueStudents, searchQuery, statusFilter, sortBy, atRiskThreshold, satisfactoryThreshold]);

  // Batch Selection Helper Functions
  const toggleSelectStudent = (name: string) => {
    setSelectedStudentNames(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleSelectAllDisplayed = () => {
    if (selectedStudentNames.length >= filteredAndSortedStudents.length && filteredAndSortedStudents.length > 0) {
      setSelectedStudentNames([]);
    } else {
      setSelectedStudentNames(filteredAndSortedStudents.map(s => s.name));
    }
  };

  const handleSelectAllAtRisk = () => {
    const atRiskNames = uniqueStudents.filter(s => s.rate < atRiskThreshold).map(s => s.name);
    setSelectedStudentNames(atRiskNames);
  };

  const clearBatchSelection = () => {
    setSelectedStudentNames([]);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (uniqueStudents.length === 0) return;

    const headers = ['Student Name', ...classDays.map(d => `"${d.name.replace(/"/g, '""')}"`), 'Total Attended', 'Attendance Rate %'];
    const csvRows: string[] = [headers.join(',')];

    uniqueStudents.forEach(student => {
      const row = [
        `"${student.name.replace(/"/g, '""')}"`,
        ...classDays.map(d => student.attendanceByDay[d.id]?.present ? 'Present' : 'Absent'),
        student.attended,
        `${student.rate.toFixed(1)}%`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `HTEIM_School_of_Ministry_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col min-h-screen md:h-screen w-full bg-slate-50 text-slate-900 font-sans p-3 sm:p-5 md:p-6 overflow-y-auto md:overflow-hidden">
      {/* Mobile PWA & Offline Status Banners */}
      {isOffline && (
        <div className="bg-amber-500 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-2xl mb-3 flex items-center justify-between shadow-xs border border-amber-600 animate-fadeIn flex-shrink-0">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-slate-950 animate-pulse" />
            <span>Working Offline • Attendance records & updates are cached locally on your device. Auto-syncing when internet restores.</span>
          </div>
          <span className="px-2.5 py-0.5 bg-slate-950 text-amber-400 rounded-md text-[10px] font-mono uppercase font-black">
            PWA Offline Ready
          </span>
        </div>
      )}

      {syncedBannerMessage && (
        <div className="bg-emerald-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl mb-3 flex items-center justify-between shadow-xs border border-emerald-700 animate-fadeIn flex-shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{syncedBannerMessage}</span>
          </div>
          <button onClick={() => setSyncedBannerMessage(null)} className="text-emerald-200 hover:text-white p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PWA Mobile App Install Prompt Banner */}
      {pwaHook.isInstallable && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white text-xs px-4 py-2.5 rounded-2xl mb-3 flex items-center justify-between gap-3 shadow-md border border-amber-500/30 animate-fadeIn flex-shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate font-semibold">
              Install HTEIM ERP as a standalone app on your smartphone or desktop for quick access!
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => pwaHook.triggerInstall()}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-lg transition-all cursor-pointer shadow-xs"
            >
              Install App
            </button>
            <button
              onClick={() => setShowMobileDownloadModal(true)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] rounded-lg transition-all cursor-pointer border border-slate-700"
            >
              APK Download
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur-md border border-indigo-500/25 rounded-2xl p-3 sm:p-4 shadow-2xl mb-4 flex-shrink-0 relative z-30 group">
        {/* Futuristic Background Mesh Glows */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl" />
        </div>

        <div className="flex items-center justify-between gap-3 relative z-10 flex-wrap sm:flex-nowrap">
          {/* Logo & Brand Info */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group/brand" onClick={() => setActiveErpTab('home')}>
            <div className="relative group/logo flex-shrink-0">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-indigo-500 to-amber-500 rounded-xl blur-2xs opacity-70 group-hover/brand:opacity-100 transition-opacity" />
              <img 
                src={hteimLogoAsset} 
                alt="HTEIM School of Ministry Logo" 
                className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl border border-amber-400/80 shadow-md object-contain bg-white p-0.5 transition-transform group-hover/brand:scale-105"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-black tracking-tight bg-gradient-to-r from-amber-300 via-white to-indigo-200 bg-clip-text text-transparent group-hover/brand:from-amber-200 group-hover/brand:to-indigo-300 transition-all">
                  HTEIM School of Ministry
                </h1>
                <span className="hidden lg:inline-flex px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-300 rounded-full border border-amber-400/30 items-center gap-1 shadow-3xs">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Portal
                </span>
              </div>
              <p className="text-slate-400 text-[10px] sm:text-[11px] font-medium hidden sm:block leading-tight">
                Heaven Touching Earth Int'l Ministries
              </p>
            </div>
          </div>

          {/* Quick KPI Stat Chips */}
          {records.length > 0 && (
            <div className="hidden md:flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 px-3 py-1 rounded-xl text-xs font-medium">
              {appUser?.role === 'student' ? (
                <>
                  <div className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>My Att: {loggedInStudentData ? loggedInStudentData.rate.toFixed(1) : '0.0'}%</span>
                  </div>
                  <span className="text-slate-700">•</span>
                  <div className="flex items-center gap-1 text-indigo-300 font-mono text-[10px]">
                    <span>ID: {getStudentIdForName(appUser.studentName || appUser.name)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Att: {avgAttendance.toFixed(1)}%</span>
                  </div>
                  <span className="text-slate-700">•</span>
                  <div className="flex items-center gap-1 text-indigo-300 font-bold text-[11px]">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{uniqueStudents.length} Students</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Header Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            {/* Live Check-In Button */}
            {appUser?.role !== 'student' && (
              <button
                onClick={() => {
                  setShowLiveCheckinModal(true);
                  if (!liveCheckinDayId && classDays.length > 0) {
                    setLiveCheckinDayId(classDays[classDays.length - 1].id);
                  }
                }}
                className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
                </span>
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Live Check-In</span>
              </button>
            )}

            {/* Command Palette Search Button */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-bold text-xs rounded-xl border border-slate-700/60 transition-all cursor-pointer flex items-center gap-1.5"
              title="Global Search & Quick Jump (Ctrl+K or Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline text-[11px]">Search</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1 py-0.2 text-[9px] font-mono font-bold bg-slate-900 text-amber-300 rounded border border-slate-800">
                ⌘K
              </kbd>
            </button>

            {/* Consolidated Tools & Operations Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                  showToolsMenu
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/60'
                }`}
                title="Tools, Exports, Cloud & Admin Options"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden xs:inline text-[11px]">Tools</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showToolsMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Tools Dropdown Menu */}
              {showToolsMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 text-white border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-scaleUp space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      Tools & Operations
                    </h4>
                    <button 
                      onClick={() => setShowToolsMenu(false)}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Section 1: Sync & Cloud */}
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-mono font-bold text-slate-400 px-1">Sync & Cloud</p>
                    <button
                      onClick={() => {
                        setShowToolsMenu(false);
                        handlePushToCloud();
                      }}
                      disabled={isCloudSyncing}
                      className="w-full p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {isCloudSyncing ? (
                          <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        ) : (
                          <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        <div>
                          <p className="text-slate-200">Cloud Sync</p>
                          {lastSyncedTime && <p className="text-[9px] text-slate-400 font-mono">{lastSyncedTime}</p>}
                        </div>
                      </div>
                      <span className="text-[10px] text-indigo-400 font-semibold">Backup</span>
                    </button>

                    {dataSource === 'sheets' && (
                      <button
                        onClick={() => {
                          setShowToolsMenu(false);
                          handleLoadSheets();
                        }}
                        disabled={isLoading}
                        className="w-full p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
                          <span className="text-slate-200">Sync Google Sheets</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-semibold">Sheets</span>
                      </button>
                    )}
                  </div>

                  {/* Section 2: Exports & Broadcast */}
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-mono font-bold text-slate-400 px-1">Exports & Broadcast</p>
                    {records.length > 0 && appUser?.role !== 'student' && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            setShowToolsMenu(false);
                            setShowReportModal(true);
                          }}
                          className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-slate-200">PDF Report</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowToolsMenu(false);
                            handleExportCSV();
                          }}
                          className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-slate-200">CSV Export</span>
                        </button>
                      </div>
                    )}

                    {appUser?.role !== 'student' && (
                      <button
                        onClick={() => {
                          setShowToolsMenu(false);
                          setShowBatchBroadcastModal(true);
                        }}
                        className="w-full p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                          <span className="text-slate-200">Batch Broadcast</span>
                        </div>
                        <span className="text-[10px] text-indigo-300 font-semibold">Email & SMS</span>
                      </button>
                    )}
                  </div>

                  {/* Section 3: Applications & Admin */}
                  <div className="space-y-1 pt-1 border-t border-slate-800">
                    <p className="text-[9px] uppercase font-mono font-bold text-slate-400 px-1">Apps & Governance</p>
                    <button
                      onClick={() => {
                        setShowToolsMenu(false);
                        setShowMobileDownloadModal(true);
                      }}
                      className="w-full p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-slate-200">Mobile App / APK</span>
                      </div>
                      <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-black">v2.4</span>
                    </button>

                    {(appUser?.role === 'admin' || appUser?.role === 'teacher') ? (
                      <button
                        onClick={() => {
                          setShowToolsMenu(false);
                          setShowAdminAuditModal(true);
                        }}
                        className="w-full p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-slate-200">Admin Audit Tools</span>
                        </div>
                        <span className="text-[10px] text-amber-400 font-semibold">Admin</span>
                      </button>
                    ) : (
                      <div className="p-2 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs text-slate-500 cursor-not-allowed">
                        <div className="flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-amber-500/70" />
                          <span>Admin Audit Tools</span>
                        </div>
                        <span className="text-[9px] text-slate-600 font-mono">Restricted</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Center */}
            <NotificationCenter
              notifications={filterNotificationsForUser(notifications, appUser?.role, appUser?.studentName || appUser?.name)}
              onMarkAsRead={handleMarkNotifAsRead}
              onMarkAllAsRead={handleMarkAllNotifsAsRead}
              onClearNotifications={handleClearNotifs}
              onSelectNotification={handleSelectNotif}
              onTriggerScan={handleRunNotificationScan}
              onAddTestNotification={handleAddTestNotif}
              currentRole={appUser?.role}
              currentStudentName={appUser?.studentName || appUser?.name}
            />

            {/* Quick Utility Icon Buttons */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl border border-slate-700/60 transition-all cursor-pointer"
              title="Settings & Customization"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowGuideModal(true)}
              className="p-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-indigo-300 hover:text-indigo-200 rounded-xl border border-slate-700/60 transition-all cursor-pointer"
              title="Guide & Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Contextual Active Role Pill & Role Switcher Popover */}
            <div className="relative">
              <button 
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`px-2 sm:px-2.5 py-1 rounded-xl border text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 shadow-2xs cursor-pointer select-none transition-all hover:scale-[1.02] ${
                  appUser?.role === 'admin'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : appUser?.role === 'teacher'
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                    : 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                }`}
                title="Active Role Permission - Click to switch preview role"
              >
                {appUser?.role === 'admin' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                {appUser?.role === 'teacher' && <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />}
                {appUser?.role === 'student' && <UserCheck className="w-3.5 h-3.5 text-blue-400" />}
                <span className="hidden sm:inline">{appUser?.role === 'admin' ? 'Admin' : appUser?.role === 'teacher' ? 'Faculty' : 'Student'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Quick Role Switcher Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 text-white border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-scaleUp space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h4 className="text-xs font-black text-amber-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Demo Role Switcher
                      </h4>
                      <p className="text-[10px] text-slate-400">Instant portal permission preview</p>
                    </div>
                    <button 
                      onClick={() => setShowRoleMenu(false)}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {/* Admin Role Option */}
                    <button
                      onClick={() => handleQuickRoleSwitch('admin')}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        appUser?.role === 'admin'
                          ? 'bg-amber-500/20 border-amber-500/50 text-white ring-1 ring-amber-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold">
                          <Crown className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">Administrator</p>
                          <p className="text-[9px] text-slate-400">Full System Governance & Backups</p>
                        </div>
                      </div>
                      {appUser?.role === 'admin' && <Check className="w-4 h-4 text-amber-400" />}
                    </button>

                    {/* Instructor Role Option */}
                    <button
                      onClick={() => handleQuickRoleSwitch('teacher')}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        appUser?.role === 'teacher'
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-white ring-1 ring-indigo-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 font-bold">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">Instructor / Faculty</p>
                          <p className="text-[9px] text-slate-400">Class Scheduling, Attendance & Grading</p>
                        </div>
                      </div>
                      {appUser?.role === 'teacher' && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>

                    {/* Student Role Option */}
                    <div className="space-y-1">
                      <button
                        onClick={() => handleQuickRoleSwitch('student')}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          appUser?.role === 'student'
                            ? 'bg-blue-500/20 border-blue-500/50 text-white ring-1 ring-blue-500/30'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-white">Student Account</p>
                            <p className="text-[9px] text-slate-400">Student Portal & Personal Attendance</p>
                          </div>
                        </div>
                        {appUser?.role === 'student' && <Check className="w-4 h-4 text-blue-400" />}
                      </button>

                      {/* Quick Student Switcher if student mode */}
                      {appUser?.role === 'student' && uniqueStudents.length > 0 && (
                        <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1">
                          <label className="text-[9px] uppercase font-mono font-bold text-slate-400 block">Preview Specific Student:</label>
                          <select
                            value={appUser.studentName || appUser.name}
                            onChange={(e) => handleQuickRoleSwitch('student', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-1.5 text-xs font-bold cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {uniqueStudents.map(s => {
                              const nameStr = typeof s === 'string' ? s : s.name;
                              return (
                                <option key={nameStr} value={nameStr}>{nameStr}</option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Full Credentials Portal</span>
                    <button 
                      onClick={() => {
                        setShowRoleMenu(false);
                        setShowLoginModal(true);
                      }}
                      className="text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Open Login Modal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar / User Login Trigger */}
            <button 
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 p-1 sm:pr-2 rounded-xl transition-all cursor-pointer group"
              title="Open login portal / user details"
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                appUser?.role === 'admin' ? 'bg-amber-500 text-slate-950' :
                appUser?.role === 'teacher' ? 'bg-indigo-600 text-white' :
                'bg-blue-600 text-white'
              }`}>
                {appUser ? appUser.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <p className="text-xs font-bold text-slate-200 hidden xl:block group-hover:text-amber-300 transition-colors">
                {appUser ? appUser.name.split(' ')[0] : 'Guest'}
              </p>
            </button>
          </div>
        </div>
      </header>

      {/* ERP Classroom System Navigation Tabs */}
      <div className="bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur-md border border-slate-200 dark:border-indigo-500/20 rounded-2xl p-2 flex items-center justify-between overflow-x-auto custom-scrollbar shadow-md dark:shadow-2xl flex-shrink-0 relative z-20">
        <div className="flex items-center gap-2 min-w-max">
          <button
            onClick={() => setActiveErpTab('home')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeErpTab === 'home'
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-300 scale-105'
                : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-slate-950" />
            <span>Home Page</span>
          </button>
 
          <button
            onClick={() => setActiveErpTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeErpTab === 'attendance'
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] font-black border border-indigo-400/60 scale-105'
                : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Attendance Portal</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${activeErpTab === 'attendance' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              {uniqueStudents.length}
            </span>
          </button>
 
          {appUser?.role !== 'student' && (
            <button
              onClick={() => setActiveErpTab('students')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeErpTab === 'students'
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] font-black border border-indigo-400/60 scale-105'
                  : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-200" />
              <span>Students Directory</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${activeErpTab === 'students' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                {uniqueStudents.length}
              </span>
            </button>
          )}
 
          <button
            onClick={() => setActiveErpTab('courses')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeErpTab === 'courses'
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] font-black border border-indigo-400/60 scale-105'
                : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-300" />
            <span>Courses & Curriculum</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${activeErpTab === 'courses' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              6 Modules
            </span>
          </button>
 
          <button
            onClick={() => setActiveErpTab('exams')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeErpTab === 'exams'
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] font-black border border-indigo-400/60 scale-105'
                : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
            <span>Exams & Evaluation</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${activeErpTab === 'exams' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              {uniqueStudents.filter(s => s.avgScore !== null).length}
            </span>
          </button>
 
          <button
            onClick={() => setActiveErpTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeErpTab === 'schedule'
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] font-black border border-indigo-400/60 scale-105'
                : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-blue-300" />
            <span>Class Schedule</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${activeErpTab === 'schedule' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              {classDays.length} Days
            </span>
          </button>
 
          <button
            onClick={() => setActiveErpTab('library')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeErpTab === 'library'
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] font-black border border-indigo-400/60 scale-105'
                : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-teal-500 dark:text-teal-300" />
            <span>Library & Resources</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${activeErpTab === 'library' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              6 Files
            </span>
          </button>
 
          {(appUser?.role === 'admin' || appUser?.role === 'student') && (
            <button
              onClick={() => setActiveErpTab('payments')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeErpTab === 'payments'
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] font-black border border-indigo-400/60 scale-105'
                  : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-300" />
              <span>{appUser?.role === 'student' ? 'My Payments' : 'Student Payments'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${activeErpTab === 'payments' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                {appUser?.role === 'student' ? 'Statement' : 'Admin'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 gap-6 min-h-0">
        {activeErpTab === 'home' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <HomeTab
              onNavigate={(tab) => setActiveErpTab(tab)}
              appUser={appUser}
              onOpenLogin={() => setShowLoginModal(true)}
              studentsCount={uniqueStudents.length}
              coursesCount={6}
              classDaysCount={classDays.length}
              avgAttendanceRate={avgAttendance}
              isCloudSyncing={isCloudSyncing}
              cloudSyncError={cloudSyncError}
              lastSyncedTime={lastSyncedTime}
              onPushToCloud={handlePushToCloud}
              userEmail={user?.email}
            />
          </div>
        )}

        {/* Render Non-Attendance ERP Tabs */}
        {activeErpTab === 'students' && appUser?.role !== 'student' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <StudentsTab
              classDays={classDays}
              students={uniqueStudents.map(s => ({
                name: s.name,
                rate: s.rate,
                attended: s.attended,
                totalDays: s.totalDays,
                avgScore: s.avgScore,
                note: s.note,
                photoUrl: s.photoUrl,
                levelId: s.levelId,
                attendanceByDay: s.attendanceByDay
              }))}
              onDeleteStudent={handleDeleteStudent}
              onSelectStudentForTranscript={(s) => {
                const found = uniqueStudents.find(u => u.name === s.name);
                if (found) {
                  setSelectedStudent(found);
                  setShowStudentTranscriptModal(true);
                }
              }}
              onSelectStudentForCertificate={(s) => {
                setCertificateData({
                  studentName: s.name,
                  awardTitle: s.rate >= 100 ? 'Perfect Attendance Honor Distinction' : 'Ministry Academic Completion Award',
                  criteria: `Demonstrated exceptional commitment with ${s.rate.toFixed(1)}% class attendance across all required School of Ministry sessions.`,
                  rate: s.rate,
                  avgScore: s.avgScore
                });
                setShowCertificateModal(true);
              }}
              onSelectStudentForEmail={(s) => {
                const found = uniqueStudents.find(u => u.name === s.name);
                if (found) {
                  setSelectedStudent(found);
                  setShowEmailDraftModal(true);
                }
              }}
              rubricScores={rubricScores}
              onUpdateRubric={handleUpdateRubric}
              studentNotes={studentNotes}
              onUpdateNote={(name, note) => {
                setStudentNotes(prev => {
                  const updated = { ...prev, [name.toLowerCase().trim()]: note };
                  localStorage.setItem('studentNotes', JSON.stringify(updated));
                  return updated;
                });
              }}
              studentPhotos={studentPhotos}
              onUpdateStudentPhoto={handleUpdateStudentPhoto}
              studentLevels={studentLevels}
              onUpdateStudentLevel={handleUpdateStudentLevel}
              onOpenAttendanceReport={(filter) => {
                setSelectedReportLevel('all');
                if (filter) {
                  setSelectedReportAttendanceFilter(filter);
                } else {
                  setSelectedReportAttendanceFilter('all');
                }
                setShowReportModal(true);
              }}
              atRiskThreshold={atRiskThreshold}
              satisfactoryThreshold={satisfactoryThreshold}
            />
          </div>
        )}

        {activeErpTab === 'courses' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <CoursesTab 
              userRole={appUser?.role} 
              courses={courses}
              setCourses={setCourses}
            />
          </div>
        )}

        {activeErpTab === 'exams' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ExamsTab
              students={uniqueStudents.map(s => {
                const rawRec = records.find(r => r.name.toLowerCase().trim() === s.name.toLowerCase().trim() && r.score);
                return {
                  name: s.name,
                  scoreStr: rawRec?.score || '',
                  percentage: s.avgScore,
                  attendedSessions: s.attended,
                  totalSessions: s.totalDays,
                  attendanceRate: s.rate,
                  attendanceByDay: s.attendanceByDay
                };
              })}
              allQuizSheets={allQuizSheets}
              rubricScores={rubricScores}
              onUpdateRubric={handleUpdateRubric}
              userRole={appUser?.role}
              currentStudentName={appUser?.studentName || appUser?.name}
              onNotificationCreated={(notif) => setNotifications(prev => [notif, ...prev])}
              customAssignments={customAssignments}
              setCustomAssignments={setCustomAssignments}
              submissions={submissions}
              setSubmissions={setSubmissions}
              googleUser={user}
              googleToken={token}
              isLoggingIn={isLoggingIn}
              onGoogleLogin={handleLogin}
              onGoogleLogout={handleLogout}
              sheetUrl={sheetUrl}
              setSheetUrl={setSheetUrl}
              onLoadSheets={handleLoadSheets}
              isLoadingSheets={isLoading}
              recentSheets={recentSheets}
              onRemoveRecentSheet={handleRemoveRecentSheet}
            />
          </div>
        )}

        {activeErpTab === 'schedule' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ScheduleTab
              classDays={classDays}
              userRole={appUser?.role}
              onTakeAttendanceForDay={(dayId) => {
                if (appUser?.role === 'student') return;
                setActiveErpTab('attendance');
                setShowLiveCheckinModal(true);
                setLiveCheckinDayId(dayId);
              }}
              schedules={schedules}
              setSchedules={setSchedules}
              zoomExceptionNote={zoomExceptionNote}
              setZoomExceptionNote={setZoomExceptionNote}
              hasZoomException={hasZoomException}
              setHasZoomException={setHasZoomException}
            />
          </div>
        )}

        {activeErpTab === 'library' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <LibraryTab 
              userRole={appUser?.role} 
              resources={libraryResources}
              setResources={setLibraryResources}
              classroomMedia={classroomMedia}
              setClassroomMedia={setClassroomMedia}
            />
          </div>
        )}

        {activeErpTab === 'payments' && (appUser?.role === 'admin' || appUser?.role === 'student') && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <PaymentTab
              availableStudents={uniqueStudents.map(s => ({ name: s.name || '', email: `${(s.name || '').toLowerCase().replace(/\s+/g, '.')}@hteim.edu` }))}
              isAdmin={appUser?.role === 'admin'}
              userRole={appUser?.role}
              currentStudentName={appUser?.studentName || appUser?.name}
              payments={payments}
              setPayments={setPayments}
            />
          </div>
        )}

        {activeErpTab === 'attendance' && (
          <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col min-h-0 overflow-hidden">
            {appUser?.role === 'student' ? (() => {
              const sName = appUser.studentName || appUser.name || 'Student';
              const found = uniqueStudents.find(s => s && s.name && s.name.toLowerCase().trim() === sName.toLowerCase().trim());
              const studentObj = found ? {
                name: found.name,
                rate: found.rate,
                attended: found.attended,
                totalDays: found.totalDays,
                avgScore: found.avgScore,
                attendanceByDay: found.attendanceByDay,
                note: found.note,
                photoUrl: studentPhotos[sName.toLowerCase().trim()] || found.photoUrl
              } : {
                name: sName,
                rate: 100,
                attended: classDays.length,
                totalDays: classDays.length || 1,
                avgScore: 95,
                attendanceByDay: {},
                photoUrl: studentPhotos[sName.toLowerCase().trim()] || ''
              };

              return (
                <StudentAttendancePortal
                  student={studentObj}
                  classDays={classDays}
                  rubricScores={rubricScores}
                  onUpdateStudentPhoto={handleUpdateStudentPhoto}
                  onRequestTranscript={(s) => {
                    setSelectedStudent({
                      name: s.name,
                      rate: s.rate,
                      attended: s.attended,
                      totalDays: s.totalDays,
                      avgScore: s.avgScore || 90,
                      attendanceByDay: s.attendanceByDay
                    });
                    setShowStudentTranscriptModal(true);
                  }}
                  onRequestCertificate={(s) => {
                    setCertificateData({
                      studentName: s.name,
                      awardTitle: s.rate >= 100 ? 'Perfect Attendance Honor Distinction' : 'Ministry Academic Completion Award',
                      criteria: `Demonstrated commitment with ${s.rate.toFixed(1)}% class attendance.`,
                      rate: s.rate,
                      avgScore: s.avgScore || 90
                    });
                    setShowCertificateModal(true);
                  }}
                  atRiskThreshold={atRiskThreshold}
                  satisfactoryThreshold={satisfactoryThreshold}
                />
              );
            })() : (records.length > 0 || classDays.length > 0 || uniqueStudents.length > 0) ? (
              <>
                {/* Toolbar: Search, Filter, Date Range, View Mode & Settings */}
              <div className="p-3 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Filters */}
                  <div className="flex bg-slate-200/60 p-0.5 rounded-md text-xs font-medium text-slate-600 max-w-full overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-sm text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-900'}`}
                    >
                      All ({uniqueStudents.length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('perfect')}
                      className={`px-2.5 py-1 rounded-sm text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'perfect' ? 'bg-white text-emerald-700 shadow-sm' : 'hover:text-slate-900'}`}
                    >
                      Satisfactory (&ge;{satisfactoryThreshold}%)
                    </button>
                    <button
                      onClick={() => setStatusFilter('moderate')}
                      className={`px-2.5 py-1 rounded-sm text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'moderate' ? 'bg-white text-amber-700 shadow-sm' : 'hover:text-slate-900'}`}
                    >
                      {atRiskThreshold}%–{satisfactoryThreshold - 1}%
                    </button>
                    <button
                      onClick={() => setStatusFilter('at_risk')}
                      className={`px-2.5 py-1 rounded-sm text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'at_risk' ? 'bg-white text-rose-700 shadow-sm' : 'hover:text-slate-900'}`}
                    >
                      At Risk (&lt;{atRiskThreshold}%)
                    </button>
                    <button
                      onClick={() => setStatusFilter('fifty_percent')}
                      className={`px-2.5 py-1 rounded-sm text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'fifty_percent' ? 'bg-purple-700 text-white shadow-sm' : 'hover:text-slate-900 text-purple-700 font-extrabold'}`}
                    >
                      &le;50% Attendance ({uniqueStudents.filter(s => s.rate <= 50).length})
                    </button>
                  </div>

                  {/* Date Range Filter */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={dateRangeFilter}
                      onChange={(e: any) => setDateRangeFilter(e.target.value)}
                      className="bg-transparent focus:outline-none font-semibold text-xs text-slate-700 cursor-pointer"
                    >
                      <option value="all">All Dates / Sheets</option>
                      <option value="30days">Last 30 Days</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>

                  {/* Academic Module / Semester Filter */}
                  <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200/80 rounded-md px-2 py-1 text-xs text-amber-900">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <select
                      value={selectedModule}
                      onChange={(e: any) => setSelectedModule(e.target.value)}
                      className="bg-transparent focus:outline-none font-bold text-xs text-amber-900 cursor-pointer"
                    >
                      <option value="all">All Modules</option>
                      <option value="m1">Module 1: Foundations</option>
                      <option value="m2">Module 2: Leadership</option>
                      <option value="m3">Module 3: Biblical Studies</option>
                    </select>
                  </div>

                  {/* Sorting */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-600">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="bg-transparent focus:outline-none font-semibold text-xs text-slate-700 cursor-pointer"
                    >
                      <option value="name_asc">Name (A-Z)</option>
                      <option value="name_desc">Name (Z-A)</option>
                      <option value="rate_desc">Rate (Highest First)</option>
                      <option value="rate_asc">Rate (Lowest First)</option>
                    </select>
                  </div>

                  {/* View Mode Toggle (Grid vs Cards) */}
                  <div className="flex bg-slate-200/60 p-0.5 rounded-md text-xs text-slate-600">
                    <button
                      onClick={() => setViewMode('matrix')}
                      className={`p-1 rounded-sm transition-all cursor-pointer ${viewMode === 'matrix' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                      title="Visual Attendance Matrix (Grid)"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`p-1 rounded-sm transition-all cursor-pointer ${viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                      title="Student Profile Cards View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dense / Comfortable View Toggle */}
                  <div className="flex bg-slate-200/60 p-0.5 rounded-md text-xs text-slate-600">
                    <button
                      onClick={() => setDensityMode('comfortable')}
                      className={`px-2 py-1 rounded-sm transition-all cursor-pointer flex items-center gap-1 ${densityMode === 'comfortable' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                      title="Comfortable spacing"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span className="text-[10px]">Comfortable</span>
                    </button>
                    <button
                      onClick={() => setDensityMode('dense')}
                      className={`px-2 py-1 rounded-sm transition-all cursor-pointer flex items-center gap-1 ${densityMode === 'dense' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                      title="Dense compact matrix view"
                    >
                      <Minimize2 className="w-3 h-3" />
                      <span className="text-[10px]">Dense</span>
                    </button>
                  </div>

                  {/* Add Class Day & Manage Class Days Action Buttons */}
                  {appUser?.role !== 'student' && (
                    <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                      <button
                        onClick={() => handleAddClassDay()}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-extrabold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                        title="Add a new class session on the fly"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Class Day</span>
                      </button>
                      <button
                        onClick={() => setShowClassDaysModal(true)}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-md text-xs font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                        title="Manage and rename class session titles"
                      >
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Manage Days ({classDays.length})</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Workspace View Mode */}
              {viewMode === 'cards' ? (
                /* Student Profile Cards Grid View */
                <div className="flex-1 overflow-auto custom-scrollbar p-4 bg-slate-50/50">
                  {filteredAndSortedStudents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      <AnimatePresence mode="popLayout">
                        {filteredAndSortedStudents.map((student) => {
                          const studentKey = student.name.toLowerCase().trim();
                          const cardPhoto = studentPhotos[studentKey] || student.photoUrl;
                          const note = studentNotes[studentKey] || student.note;
                          const studentBadges = getStudentBadges(student);

                          return (
                            <motion.div 
                              key={student.name}
                              layout
                              initial={{ opacity: 0, scale: 0.92, y: 12 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.88, y: -12, transition: { duration: 0.18 } }}
                              transition={{ duration: 0.22, ease: 'easeOut' }}
                              onClick={() => setSelectedStudent(student)}
                              className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-shadow cursor-pointer flex flex-col justify-between group"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {cardPhoto ? (
                                      <img 
                                        src={cardPhoto} 
                                        alt={student.name} 
                                        className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0" 
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 font-black text-slate-700 text-xs flex items-center justify-center flex-shrink-0">
                                        {student.name.charAt(0)}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{student.name}</h4>
                                      <p className="text-[10px] text-slate-400">Attended {student.attended} of {effectiveClassDays.length} sessions</p>
                                    </div>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex-shrink-0 ${
                                    student.rate >= satisfactoryThreshold ? 'bg-emerald-100 text-emerald-800' : student.rate >= atRiskThreshold ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800 font-extrabold'
                                  }`}>
                                    {Math.round(student.rate)}%
                                  </span>
                                </div>

                                {/* Student Badges / Milestones */}
                                {studentBadges.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {studentBadges.map(b => (
                                      <span key={b.id} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${b.bg}`}>
                                        {b.icon}
                                        <span>{b.label}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Attendance Progress Bar */}
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-2">
                                  <div 
                                    className={`h-full transition-all duration-500 ${
                                      student.rate >= satisfactoryThreshold ? 'bg-emerald-500' : student.rate >= atRiskThreshold ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, student.rate))}%` }}
                                  />
                                </div>

                                {/* Note preview if available */}
                                {note && (
                                  <div className="mt-2 p-1.5 bg-indigo-50/60 border border-indigo-100 rounded text-[10px] text-indigo-900 line-clamp-2 italic">
                                    "{note}"
                                  </div>
                                )}
                              </div>

                              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                                <span>View Breakdown & Remarks</span>
                                <span>&rarr;</span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No students found matching your search or filter criteria.
                    </div>
                  )}
                </div>
              ) : (
                /* Attendance Matrix Scrollable Container */
                <div className="flex-1 overflow-auto custom-scrollbar relative">
                  <table className="w-full text-left border-collapse min-w-max">
                    {/* Table Sticky Header */}
                    <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
                      <tr>
                        <th className={`sticky left-0 z-30 bg-slate-100 border-r border-slate-200 ${densityMode === 'dense' ? 'p-2 text-[11px]' : 'p-3 text-xs'} font-black uppercase text-slate-700 tracking-wider w-64 min-w-[256px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox"
                                checked={selectedStudentNames.length > 0 && selectedStudentNames.length >= filteredAndSortedStudents.length}
                                onChange={handleSelectAllDisplayed}
                                className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
                                title="Select / Deselect all displayed students for batch operations"
                              />
                              <span>Student Name</span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400 normal-case">({filteredAndSortedStudents.length} shown)</span>
                          </div>
                        </th>

                        {effectiveClassDays.map(day => {
                          const stats = classDayStats[day.id] || { count: 0, percentage: 0 };
                          return (
                            <th 
                              key={day.id} 
                              className={`${densityMode === 'dense' ? 'p-2' : 'p-3'} border-r border-slate-200 text-center min-w-[110px] max-w-[150px] flex-1 hover:bg-slate-200/50 transition-colors group/th`}
                              title={`Sheet: ${day.name}\nPresent: ${stats.count} students (${Math.round(stats.percentage)}%)\nClick pencil to rename title`}
                            >
                              <div className="flex flex-col items-center justify-center">
                                <div className="flex items-center gap-1 justify-center max-w-[135px]">
                                  <span className={`${densityMode === 'dense' ? 'text-[11px]' : 'text-xs'} font-extrabold text-slate-800 truncate`} title={day.name}>
                                    {day.name}
                                  </span>
                                  {appUser?.role !== 'student' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newName = prompt('Rename Class Day Title:', day.name);
                                        if (newName && newName.trim() !== '') {
                                          handleEditClassDayTitle(day.id, newName.trim());
                                        }
                                      }}
                                      className="opacity-0 group-hover/th:opacity-100 p-0.5 hover:bg-slate-300/60 rounded text-slate-500 hover:text-indigo-700 transition-all cursor-pointer flex-shrink-0"
                                      title="Click to rename class day title"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/80 border border-slate-200 text-slate-600">
                                  <span>{stats.count}/{uniqueStudents.length}</span>
                                  <span className="text-emerald-600">({Math.round(stats.percentage)}%)</span>
                                </div>
                              </div>
                            </th>
                          );
                        })}

                        <th className={`${densityMode === 'dense' ? 'p-2 text-[11px]' : 'p-3 text-xs'} border-r border-slate-200 text-center font-black uppercase text-emerald-800 tracking-wider w-28 min-w-[112px] bg-emerald-50/60`}>
                          Attendance Rate
                        </th>
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody className="divide-y divide-slate-100">
                      {filteredAndSortedStudents.length > 0 ? (
                        filteredAndSortedStudents.map((student, idx) => {
                          const studentKey = student.name.toLowerCase().trim();
                          const isExcusedMap = excusedAbsences[studentKey] || {};
                          const studentBadges = getStudentBadges(student);

                          return (
                            <tr 
                              key={idx} 
                              onClick={() => setSelectedStudent(student)}
                              className="group hover:bg-indigo-50/40 transition-colors cursor-pointer"
                            >
                              {/* Student Name Sticky Column */}
                              <td className={`sticky left-0 z-10 ${densityMode === 'dense' ? 'py-1.5 px-2 text-[11px]' : 'p-3 text-xs'} border-r border-slate-200 font-bold text-slate-800 bg-white group-hover:bg-indigo-50/80 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] w-64 min-w-[256px] truncate ${student.rate < atRiskThreshold ? 'text-rose-700' : ''}`} title="Click to view student detail">
                                <div className="flex items-center justify-between gap-1 min-w-0">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={selectedStudentNames.includes(student.name)}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        toggleSelectStudent(student.name);
                                      }}
                                      className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer flex-shrink-0"
                                    />
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${student.rate >= satisfactoryThreshold ? 'bg-emerald-500' : student.rate >= atRiskThreshold ? 'bg-amber-400' : 'bg-rose-500'}`} />
                                    <span className="truncate">{student.name}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {studentBadges.map(b => (
                                      <span key={b.id} className={`inline-flex items-center p-0.5 rounded border ${b.bg}`} title={b.label}>
                                        {b.icon}
                                      </span>
                                    ))}
                                    {student.note && (
                                      <span className="text-indigo-500 bg-indigo-50 p-1 rounded" title={`Note: ${student.note}`}>
                                        <PenSquare className="w-3 h-3" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Attendance Status Per Sheet/Day */}
                              {effectiveClassDays.map(day => {
                                const attendance = student.attendanceByDay[day.id];
                                const isPresent = attendance?.present;
                                const isExcused = !isPresent && !!isExcusedMap[day.id];

                                return (
                                  <td 
                                    key={day.id} 
                                    className={`${densityMode === 'dense' ? 'py-1 px-1.5' : 'p-3'} border-r border-slate-100 text-center min-w-[110px] max-w-[150px]`}
                                    onClick={(e) => {
                                      if (appUser?.role === 'student') return;
                                      e.stopPropagation();
                                      handleToggleStudentAttendance(
                                        student.name, 
                                        day.id, 
                                        isPresent ? 'excused' : isExcused ? 'absent' : 'present'
                                      );
                                    }}
                                    title={appUser?.role !== 'student' ? 'Click to toggle manual attendance (Present -> Excused -> Absent)' : undefined}
                                  >
                                    {isPresent ? (
                                      <div className={`inline-flex items-center gap-1 ${densityMode === 'dense' ? 'px-2 py-0.2 text-[9px]' : 'px-2.5 py-0.5 text-[10px]'} rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors cursor-pointer`}>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>Present</span>
                                      </div>
                                    ) : isExcused ? (
                                      <div className={`inline-flex items-center gap-1 ${densityMode === 'dense' ? 'px-2 py-0.2 text-[9px]' : 'px-2.5 py-0.5 text-[10px]'} rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold hover:bg-amber-100 transition-colors cursor-pointer`}>
                                        <AlertCircle className="w-3 h-3 text-amber-500" />
                                        <span>Excused</span>
                                      </div>
                                    ) : (
                                      <div className={`inline-flex items-center gap-1 ${densityMode === 'dense' ? 'px-2 py-0.2 text-[9px]' : 'px-2.5 py-0.5 text-[10px]'} rounded-full bg-rose-50/60 border border-rose-200/50 text-rose-400 font-medium hover:bg-rose-100 transition-colors cursor-pointer`}>
                                        <XCircle className="w-3 h-3 text-rose-300" />
                                        <span>Absent</span>
                                      </div>
                                    )}
                                  </td>
                                );
                              })}

                              {/* Attendance Rate Badge */}
                              <td className={`${densityMode === 'dense' ? 'py-1.5 px-2 text-[10px]' : 'p-3 text-xs'} border-r border-slate-100 text-center font-mono font-bold w-28 min-w-[112px] bg-slate-50/50`}>
                                <span className={`inline-block px-2.5 py-0.5 rounded ${
                                  student.rate >= satisfactoryThreshold 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : student.rate >= atRiskThreshold 
                                    ? 'bg-amber-100 text-amber-800' 
                                    : 'bg-rose-100 text-rose-800 font-extrabold'
                                }`}>
                                  {Math.round(student.rate)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={effectiveClassDays.length + 2} className="p-8 text-center text-slate-400 text-xs">
                            No students found matching your search or filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Footer Legend */}
              <div className="p-2.5 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-slate-600">Legend:</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Present in Form Response
                  </span>
                  <span className="flex items-center gap-1 text-rose-600 font-medium">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" /> No Submission
                  </span>
                </div>
                <div className="text-slate-400 font-medium">
                  Showing <strong className="text-slate-700">{filteredAndSortedStudents.length}</strong> of <strong className="text-slate-700">{uniqueStudents.length}</strong> total evaluated students
                </div>
              </div>

              {/* Batch Selection Faculty Action Bar */}
              {selectedStudentNames.length > 0 && (
                <div className="p-3 bg-slate-900 text-white border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg animate-slideUp z-30">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-full">
                      {selectedStudentNames.length} Student{selectedStudentNames.length > 1 ? 's' : ''} Selected
                    </span>
                    <button
                      onClick={handleSelectAllAtRisk}
                      className="text-xs text-amber-300 hover:text-amber-200 underline font-semibold cursor-pointer"
                    >
                      Select All At-Risk (&lt;{atRiskThreshold}%)
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBatchEmailModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Batch At-Risk Email Notice
                    </button>

                    <button
                      onClick={clearBatchSelection}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 p-8 text-center animate-fadeIn">
              <div className="relative mb-4">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 blur-sm opacity-60"></div>
                <img 
                  src={hteimLogoAsset} 
                  alt="HTEIM School of Ministry" 
                  className="relative w-20 h-20 rounded-full border-2 border-white shadow-xl object-contain bg-white p-1"
                />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">HTEIM School of Ministry</h2>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mt-0.5">Heaven Touching Earth Int'l Ministries</p>
              <p className="text-xs italic font-serif text-slate-500 mt-1 max-w-sm">
                "Bringing Heaven to Earth, Taking People to Heaven"
              </p>
              <p className="text-xs text-slate-500 max-w-md mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                Click <strong>"Load Uploaded CSV"</strong> on the right sidebar or sign in with Google to analyze multi-sheet class attendance matrices.
              </p>
            </div>
          )}
        </div>
      )}

        {/* Sidebar Controls */}
        {activeErpTab === 'attendance' && appUser?.role !== 'student' && (
          <aside className="w-80 flex flex-col gap-4 overflow-y-auto pb-4 flex-shrink-0">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 shadow-sm animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs font-medium text-rose-800 break-words w-full">{error}</div>
              </div>
            )}

          {/* Data Source Switcher */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Data Source Connection
            </h3>
            
            <div className="space-y-3">
              <button 
                onClick={handleLoadDemo} 
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg transition-all uppercase disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {isLoading && dataSource === 'demo' ? <Loader2 className="w-4 h-4 animate-spin text-slate-600" /> : <Upload className="w-4 h-4 text-slate-600" />}
                Load Uploaded CSV
              </button>
            </div>
          </div>

          {/* Loaded Class Sheets / Class Sessions List */}
          {classDays.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Class Sessions ({classDays.length})
                </h3>
                {appUser?.role !== 'student' && (
                  <button
                    onClick={() => handleAddClassDay()}
                    className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Add class session on the fly"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Day</span>
                  </button>
                )}
              </div>

              <div className="space-y-1.5 overflow-y-auto custom-scrollbar pr-1 flex-1">
                {classDays.map((day, i) => {
                  const stats = classDayStats[day.id] || { count: 0, percentage: 0 };
                  return (
                    <div key={day.id} className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs group">
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                        <span className="w-5 h-5 rounded bg-white border border-slate-200 text-slate-500 text-[10px] font-mono font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-slate-700 truncate" title={day.name}>{day.name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {stats.count} ({Math.round(stats.percentage)}%)
                        </span>
                        {appUser?.role !== 'student' && (
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                const newName = prompt('Rename Class Day Title:', day.name);
                                if (newName && newName.trim() !== '') {
                                  handleEditClassDayTitle(day.id, newName.trim());
                                }
                              }}
                              className="p-1 hover:bg-indigo-100 text-slate-400 hover:text-indigo-700 rounded transition-colors cursor-pointer"
                              title="Rename Title"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClassDay(day.id)}
                              className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Delete Class Day"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          </aside>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (() => {
        const studentKey = (selectedStudent.name || '').toLowerCase().trim();
        const currentNote = studentNotes[studentKey] || '';
        const isExcusedMap = excusedAbsences[studentKey] || {};
        const studentBadges = getStudentBadges(selectedStudent);

        const missedDays = effectiveClassDays.filter(day => !selectedStudent.attendanceByDay[day.id]?.present);
        const missedListText = missedDays.map(d => ` • ${d.name}`).join('\n');
        
        const emailSubject = `[HTEIM School of Ministry] Academic Attendance Notice for ${selectedStudent.name}`;
        const emailBody = `Dear ${selectedStudent.name},

This is an official academic notice from HTEIM School of Ministry regarding your class attendance record.

Current Course Attendance & Evaluation Summary:
• Attendance Rate: ${Math.round(selectedStudent.rate)}% (Satisfactory Threshold: ${satisfactoryThreshold}%, At-Risk Threshold: ${atRiskThreshold}%)
• Total Sessions Attended: ${selectedStudent.attended} out of ${effectiveClassDays.length}
• Total Missed Sessions: ${missedDays.length}
${missedDays.length > 0 ? `Missed Class Sessions:\n${missedListText}\n\n` : ''}Consistent class attendance is essential to your ministry preparation and course completion. Please contact your instructor or administration team at HTEIM School of Ministry to discuss your standing.

In His Service,
Faculty & Academic Administration Team
HTEIM School of Ministry (Heaven Touching Earth Int'l Ministries)`;

        const handleCopyEmail = () => {
          navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`);
          setCopiedEmail(true);
          setTimeout(() => setCopiedEmail(false), 2500);
        };

        const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

        const modalPhoto = studentPhotos[studentKey] || selectedStudent.photoUrl;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-scaleUp max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-lg flex items-center justify-center flex-shrink-0 border border-white/20 uppercase">
                    {modalPhoto ? (
                      <img src={modalPhoto} alt={selectedStudent.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{selectedStudent.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-extrabold">{selectedStudent.name}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      selectedStudent.rate >= satisfactoryThreshold ? 'bg-emerald-500/20 text-emerald-300' : selectedStudent.rate >= atRiskThreshold ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300 font-extrabold'
                    }`}>
                      {Math.round(selectedStudent.rate)}% Rate
                    </span>
                  </div>

                  {/* Student Badges */}
                  {studentBadges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {studentBadges.map(b => (
                        <span key={b.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${b.bg}`}>
                          {b.icon}
                          <span>{b.label}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-slate-400 mt-1">
                    Attended {selectedStudent.attended} out of {effectiveClassDays.length} total class days
                  </p>
                </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedStudent(null);
                    setShowEmailDraftModal(false);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body Scrollable */}
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                {/* Draft Email Warning Button */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-900">Academic Attendance Communication</h4>
                        <p className="text-[10px] text-amber-700">Generate formatted email warning with attendance rate & missed dates</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowEmailDraftModal(prev => !prev);
                        setCopiedEmail(false);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 flex-shrink-0 shadow-2xs"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {showEmailDraftModal ? 'Hide Draft' : 'Draft Email Warning'}
                    </button>

                    <button
                      onClick={() => {
                        setShowStudentTranscriptModal(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0 shadow-2xs"
                      title="Generate official academic transcript & evaluation PDF report for this student"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      Academic Transcript PDF
                    </button>

                    <button
                      onClick={() => {
                        setCertificateData({
                          studentName: selectedStudent.name,
                          awardTitle: selectedStudent.rate >= 100 
                            ? "CERTIFICATE OF EXCELLENCE - 100% PERFECT ATTENDANCE" 
                            : selectedStudent.avgScore && selectedStudent.avgScore >= 85 
                            ? "HONOR ROLL COMMENDATION OF ACADEMIC DISTINCTION" 
                            : "COMMENDATION OF MINISTERIAL PROGRESS & DILIGENCE",
                          criteria: `Attendance Standing: ${Math.round(selectedStudent.rate)}% (${selectedStudent.attended}/${effectiveClassDays.length} Sessions Attended)${selectedStudent.avgScore !== null ? ` • Average Evaluation Score: ${Math.round(selectedStudent.avgScore)}%` : ''}`,
                          rate: selectedStudent.rate,
                          avgScore: selectedStudent.avgScore
                        });
                        setShowCertificateModal(true);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0 shadow-2xs"
                      title="Generate printable milestone certificate of achievement"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      Award Certificate
                    </button>
                  </div>

                  {/* Expanded Email Warning Composer */}
                  {showEmailDraftModal && (
                    <div className="mt-3 pt-3 border-t border-amber-200 space-y-2.5 animate-fadeIn">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-amber-800 mb-1">Subject</label>
                        <input
                          readOnly
                          type="text"
                          value={emailSubject}
                          className="w-full p-2 bg-white border border-amber-200 rounded text-xs font-bold text-slate-800 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-amber-800 mb-1">Generated Body</label>
                        <textarea
                          readOnly
                          rows={7}
                          value={emailBody}
                          className="w-full p-2.5 bg-white border border-amber-200 rounded text-xs font-mono text-slate-800 focus:outline-none custom-scrollbar"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={handleCopyEmail}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedEmail ? 'Copied to Clipboard!' : 'Copy Email Text'}
                        </button>

                        <a
                          href={mailtoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Open Mail Client
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Evaluation Breakdown (Participation, Assignments) */}
                {(() => {
                  const studentRubric = rubricScores[studentKey] || { participation: 90, scripture: 95, assignment: 85 };
                  const rubricAvg = Math.round((studentRubric.participation + studentRubric.assignment) / 2);

                  const handleUpdateRubric = (key: 'participation' | 'scripture' | 'assignment', val: number) => {
                    const updated = { ...studentRubric, [key]: Math.min(100, Math.max(0, val)) };
                    setRubricScores(prev => ({ ...prev, [studentKey]: updated }));
                  };

                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Rubric & Ministerial Evaluation</h4>
                        </div>
                        <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          Composite Score: {rubricAvg}%
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Participation */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-emerald-500" /> Class Participation
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-800">{studentRubric.participation}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="100" value={studentRubric.participation}
                            onChange={(e) => handleUpdateRubric('participation', parseInt(e.target.value, 10))}
                            className="w-full accent-emerald-600 cursor-pointer h-1.5"
                          />
                        </div>

                        {/* Reading Assignments */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                              <FileText className="w-3 h-3 text-indigo-500" /> Course Readings & Assignments
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-800">{studentRubric.assignment}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="100" value={studentRubric.assignment}
                            onChange={(e) => handleUpdateRubric('assignment', parseInt(e.target.value, 10))}
                            className="w-full accent-indigo-600 cursor-pointer h-1.5"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Attendance & Response Breakdown</p>
                  
                  <div className="space-y-2">
                    {classDays.map(day => {
                      const att = selectedStudent.attendanceByDay[day.id];
                      const isPresent = att?.present;
                      const isExcused = !isPresent && !!isExcusedMap[day.id];

                      return (
                        <div key={day.id} className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                          isPresent ? 'bg-emerald-50/40 border-emerald-200/60' : isExcused ? 'bg-amber-50/40 border-amber-200/60' : 'bg-slate-50 border-slate-200/60'
                        }`}>
                          <div className="flex items-center gap-3">
                            {isPresent ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            ) : isExcused ? (
                              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-bold text-slate-800">{day.name}</p>
                              {att?.timestamp && (
                                <p className="text-[10px] text-slate-500">Submitted: {att.timestamp}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isPresent && (
                              <button
                                onClick={() => handleToggleExcusedAbsence(selectedStudent.name, day.id)}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  isExcused ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-slate-200/80 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                                }`}
                                title="Toggle excused absence"
                              >
                                {isExcused ? 'Unmark Excused' : 'Mark Excused'}
                              </button>
                            )}
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isPresent ? 'bg-emerald-100 text-emerald-800' : isExcused ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {isPresent ? 'Present' : isExcused ? 'Excused' : 'Absent'}
                            </span>
                            {att?.score && (
                              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                {att.score}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Teacher Notes Section */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <PenSquare className="w-3.5 h-3.5 text-indigo-500" />
                    Teacher Notes & Remarks
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter custom remarks or flags for this student..."
                    value={currentNote}
                    onChange={(e) => handleSaveStudentNote(selectedStudent.name, e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center flex-shrink-0">
                <button 
                  onClick={() => handleDeleteStudent(selectedStudent.name)}
                  className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Exclude Student
                </button>
                <button 
                  onClick={() => {
                    setSelectedStudent(null);
                    setShowEmailDraftModal(false);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Printable Report Modal */}
      {showReportModal && (() => {
        // Filter by Attendance Status only (no level filter)
        let reportStudents = uniqueStudents;
        
        if (selectedReportAttendanceFilter === 'fifty_percent') {
          reportStudents = reportStudents.filter(s => s.rate <= 50);
        } else if (selectedReportAttendanceFilter === 'at_risk') {
          reportStudents = reportStudents.filter(s => s.rate < atRiskThreshold);
        } else if (selectedReportAttendanceFilter === 'satisfactory') {
          reportStudents = reportStudents.filter(s => s.rate >= satisfactoryThreshold);
        }
        
        let filterSuffix = '';
        if (selectedReportAttendanceFilter === 'fifty_percent') {
          filterSuffix = ' (Low Attendance: \u2264 50%)';
        } else if (selectedReportAttendanceFilter === 'at_risk') {
          filterSuffix = ` (At Risk: < ${atRiskThreshold}%)`;
        } else if (selectedReportAttendanceFilter === 'satisfactory') {
          filterSuffix = ` (Satisfactory: \u2265 ${satisfactoryThreshold}%)`;
        }

        const reportTitle = `School of Ministry Academic Attendance & Evaluation Report${filterSuffix}`;

        const reportAvgRate = reportStudents.length > 0 
          ? reportStudents.reduce((acc, s) => acc + s.rate, 0) / reportStudents.length 
          : 0;

        const scoresWithValues = reportStudents.map(s => s.avgScore).filter((s): s is number => s !== null);
        const reportAvgScore = scoresWithValues.length > 0
          ? scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length
          : null;

        const atRiskInReport = reportStudents.filter(s => s.rate < atRiskThreshold);
        const fiftyPercentInReport = reportStudents.filter(s => s.rate <= 50);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Report Header Toolbar */}
              <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h2 className="text-base font-extrabold leading-tight">Academic Attendance Report</h2>
                    <p className="text-[11px] text-slate-400">
                      Overall student attendance and grading roster
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportPDF('printable-report', `HTEIM_Attendance_Report_${selectedReportAttendanceFilter}.pdf`)}
                    disabled={isGeneratingPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                    title="Export high-definition PDF document for selected filters"
                  >
                    <Download className={`w-3.5 h-3.5 ${isGeneratingPDF ? 'animate-bounce' : ''}`} />
                    {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-700"
                    title="Print or save via browser print dialog"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Advanced Filter Sub-Bar */}
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex flex-col gap-2 flex-shrink-0">
                {/* Attendance Criteria Row (No Academic Level selector) */}
                <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 mr-2 flex items-center gap-1 flex-shrink-0">
                    <AlertCircle className="w-3.5 h-3.5 text-purple-600" /> Attendance Filter:
                  </span>
                  <button
                    onClick={() => setSelectedReportAttendanceFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedReportAttendanceFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    All Attendance Statuses
                  </button>
                  <button
                    onClick={() => setSelectedReportAttendanceFilter('fifty_percent')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      selectedReportAttendanceFilter === 'fifty_percent'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
                    }`}
                  >
                    <span>Low Attendance (&le;50%)</span>
                    <span className="opacity-75 font-mono text-[10px]">
                      ({uniqueStudents.filter(s => s.rate <= 50).length})
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedReportAttendanceFilter('at_risk')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      selectedReportAttendanceFilter === 'at_risk'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                    }`}
                  >
                    <span>At-Risk (&lt;{atRiskThreshold}%)</span>
                    <span className="opacity-75 font-mono text-[10px]">
                      ({uniqueStudents.filter(s => s.rate < atRiskThreshold).length})
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedReportAttendanceFilter('satisfactory')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      selectedReportAttendanceFilter === 'satisfactory'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    <span>Satisfactory (&ge;{satisfactoryThreshold}%)</span>
                    <span className="opacity-75 font-mono text-[10px]">
                      ({uniqueStudents.filter(s => s.rate >= satisfactoryThreshold).length})
                    </span>
                  </button>
                </div>
              </div>

              {/* Report Document Body */}
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-slate-800" id="printable-report">
                {/* Document Header with HTEIM Logo & Ministry Letterhead */}
                <div className="border-b-2 border-slate-900 pb-5 flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <img 
                      src={hteimLogoAsset} 
                      alt="HTEIM School of Ministry Logo" 
                      className="w-16 h-16 rounded-full border-2 border-amber-500 shadow-md object-contain bg-white p-0.5 flex-shrink-0"
                    />
                    <div>
                      <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">HTEIM SCHOOL OF MINISTRY</h1>
                      <p className="text-xs font-bold text-amber-900 tracking-wide">HEAVEN TOUCHING EARTH INT'L MINISTRIES</p>
                      <p className="text-[11px] italic font-serif text-slate-600 mt-0.5">"Bringing Heaven to Earth, Taking People to Heaven"</p>
                      <div className="mt-1.5 inline-block px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-extrabold uppercase tracking-wider rounded-lg shadow-2xs">
                        {reportTitle}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-600 font-mono space-y-0.5">
                    <p className="font-sans font-bold text-slate-800">{new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
                    <p>Evaluated Sessions: <strong className="text-slate-900">{effectiveClassDays.length}</strong></p>
                    <p>Students in Report: <strong className="text-slate-900">{reportStudents.length}</strong></p>
                  </div>
                </div>

                {/* KPI Summary Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Avg Attendance Rate</p>
                    <p className="text-2xl font-mono font-bold text-emerald-600 mt-1">{reportAvgRate.toFixed(1)}%</p>
                  </div>
                  {reportAvgScore !== null && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Avg Evaluation Score</p>
                      <p className="text-2xl font-mono font-bold text-amber-600 mt-1">{reportAvgScore.toFixed(1)}%</p>
                    </div>
                  )}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">At-Risk Students (&lt;{atRiskThreshold}%)</p>
                    <p className="text-2xl font-mono font-bold text-rose-600 mt-1">
                      {atRiskInReport.length}
                    </p>
                  </div>
                </div>

                {/* At Risk List Callout */}
                {atRiskInReport.length > 0 && selectedReportAttendanceFilter !== 'fifty_percent' && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                    <h3 className="text-xs font-bold uppercase text-rose-800 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      At-Risk Students (&lt;{atRiskThreshold}% Attendance)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {atRiskInReport.map((st, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white border border-rose-200 rounded-md text-xs font-semibold text-rose-800 shadow-2xs flex items-center gap-1.5">
                          <span>{st.name}</span>
                          <span className="font-mono font-bold">({Math.round(st.rate)}%)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Critical Low Attendance (<=50%) Callout */}
                {fiftyPercentInReport.length > 0 && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <h3 className="text-xs font-bold uppercase text-purple-900 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-purple-600" />
                      Critical Low Attendance (&le;50% Attendance) - Academic Standing Warning
                    </h3>
                    <p className="text-[11px] text-purple-700 mb-2.5">
                      The following students have attended 50% or fewer of the overall academic sessions and may require academic module recovery or attendance counseling.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {fiftyPercentInReport.map((st, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white border border-purple-200 rounded-md text-xs font-semibold text-purple-800 shadow-2xs flex items-center gap-1.5">
                          <span>{st.name}</span>
                          <span className="font-mono font-bold">({Math.round(st.rate)}%)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Student Table for Selected Level */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Student Roster ({reportStudents.length})
                    </h3>
                  </div>

                  {reportStudents.length > 0 ? (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b-2 border-slate-800 bg-slate-100 text-slate-700">
                          <th className="p-2 font-bold">Student Name</th>
                          <th className="p-2 font-bold text-center">Attended / Total</th>
                          <th className="p-2 font-bold text-center">Attendance %</th>
                          <th className="p-2 font-bold text-center">Avg Score</th>
                          <th className="p-2 font-bold">Notes / Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportStudents.map((st, idx) => {
                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="p-2 font-bold text-slate-900">{st.name}</td>
                              <td className="p-2 text-center font-mono">{st.attended} / {effectiveClassDays.length}</td>
                              <td className="p-2 text-center font-mono font-bold">
                                <span className={st.rate >= satisfactoryThreshold ? 'text-emerald-700' : st.rate >= atRiskThreshold ? 'text-amber-700' : 'text-rose-700'}>
                                  {Math.round(st.rate)}%
                                </span>
                              </td>
                              <td className="p-2 text-center font-mono">
                                {st.avgScore !== null ? `${Math.round(st.avgScore)}%` : '—'}
                              </td>
                              <td className="p-2 text-slate-600 italic">
                                {st.note || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
                      No students match the selected attendance filter criteria.
                    </div>
                  )}
                </div>

                {/* Report Footer & Official Seal */}
                <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between text-slate-500 text-[10px]">
                  <div className="flex items-center gap-2">
                    <img src={hteimLogoAsset} alt="HTEIM Logo" className="w-6 h-6 rounded-full border border-amber-400 p-0.5 object-contain bg-white" />
                    <span className="font-bold text-slate-700">HTEIM School of Ministry</span>
                    <span>•</span>
                    <span>Heaven Touching Earth Int'l Ministries</span>
                  </div>
                  <div className="text-right italic font-serif text-slate-600">
                    "Bringing Heaven to Earth, Taking People to Heaven"
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        userRole={appUser?.role || 'admin'}
        atRiskThreshold={atRiskThreshold}
        setAtRiskThreshold={setAtRiskThreshold}
        satisfactoryThreshold={satisfactoryThreshold}
        setSatisfactoryThreshold={setSatisfactoryThreshold}
        autoSyncInterval={autoSyncInterval}
        setAutoSyncInterval={setAutoSyncInterval}
        syncOnTabFocus={syncOnTabFocus}
        setSyncOnTabFocus={setSyncOnTabFocus}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onResetAllData={handleResetAllData}
        onOpenGuide={() => setShowGuideModal(true)}
        onOpenMobileDownloadCenter={() => setShowMobileDownloadModal(true)}
        onOpenAdminTools={() => {
          setShowSettingsModal(false);
          setShowAdminAuditModal(true);
        }}
      />

      {/* Admin Audit Trail & Data Tools Modal */}
      <AdminAuditAndBackupModal
        isOpen={showAdminAuditModal}
        onClose={() => setShowAdminAuditModal(false)}
        currentUserRole={appUser?.role}
        currentActorName={appUser ? (appUser.role === 'admin' ? 'Administrator' : appUser.name) : 'Administrator'}
        onDataRestored={() => {
          // Refresh records from local storage
          const savedAtt = localStorage.getItem('attendanceRecords');
          if (savedAtt) {
            try { setRecords(JSON.parse(savedAtt)); } catch(e){}
          }
        }}
      />

      {/* Mobile App & APK Download Center Modal */}
      <MobileDownloadCenterModal
        isOpen={showMobileDownloadModal}
        onClose={() => setShowMobileDownloadModal(false)}
      />

      {/* Guide & Access Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scaleUp">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-extrabold">HTEIM Portal - Access, Exporting & Sharing Guide</h2>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
                <h4 className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                  <Share2 className="w-4 h-4 text-indigo-600" />
                  1. How to Share this Live App with Others
                </h4>
                <p className="text-slate-600 text-[11px]">
                  Click the <strong>Share</strong> button located at the top toolbar of Google AI Studio. This generates a direct public link that colleagues, co-teachers, or admins can open in any browser tab to view attendance matrices in real time.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                  <Download className="w-4 h-4 text-emerald-600" />
                  2. How to Export Source Code or Publish to GitHub
                </h4>
                <p className="text-slate-600 text-[11px]">
                  To download the full source code or publish to GitHub for testing purposes, open the <strong>Settings / Export</strong> menu in the upper right corner of Google AI Studio. You can download a complete ZIP bundle or commit to a GitHub repository with one click.
                </p>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl space-y-1">
                <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                  <Printer className="w-4 h-4 text-amber-600" />
                  3. Export Printable PDF Reports & CSV Data
                </h4>
                <p className="text-slate-600 text-[11px]">
                  Use the <strong>Print Report</strong> button in the top bar to generate formatted PDF class summaries for official records, or click <strong>Export CSV</strong> to save raw spreadsheet data.
                </p>
              </div>

              {/* Developer / Creator Info */}
              <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-amber-400 uppercase text-[10px] tracking-wider">Application Software Creator</span>
                  <span className="text-[10px] text-slate-400 font-mono">Rockproxy Technologies</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Created by <strong>Rockproxy Technologies</strong> • Director: <strong>Kendell Pierre</strong>
                </p>
                <p className="text-indigo-300 font-mono text-[10px]">
                  Email: <a href="mailto:rockproxytechnologies@gmail.com" className="underline hover:text-white">rockproxytechnologies@gmail.com</a>
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-[10px] text-slate-500">
                Created by <strong>Rockproxy Technologies</strong> (Kendell Pierre)
              </span>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Student Academic Transcript PDF Modal */}
      {showStudentTranscriptModal && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Toolbar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-extrabold">Official Student Academic Transcript</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportPDF('printable-student-transcript', `HTEIM_Academic_Transcript_${selectedStudent.name.replace(/\s+/g, '_')}.pdf`)}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  title="Directly download high-definition PDF transcript"
                >
                  <Download className={`w-3.5 h-3.5 ${isGeneratingPDF ? 'animate-bounce' : ''}`} />
                  {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF Transcript'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Browser Print
                </button>
                <button
                  onClick={() => setShowStudentTranscriptModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Transcript Document Printable Canvas */}
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-slate-800" id="printable-student-transcript">
              {/* Document Letterhead */}
              <div className="border-b-2 border-slate-900 pb-5 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <img 
                    src={hteimLogoAsset} 
                    alt="HTEIM Logo" 
                    className="w-16 h-16 rounded-full border-2 border-amber-500 shadow-md object-contain bg-white p-0.5 flex-shrink-0"
                  />
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">HTEIM SCHOOL OF MINISTRY</h1>
                    <p className="text-xs font-bold text-amber-900 tracking-wide">HEAVEN TOUCHING EARTH INT'L MINISTRIES</p>
                    <p className="text-[11px] italic font-serif text-slate-600 mt-0.5">"Bringing Heaven to Earth, Taking People to Heaven"</p>
                    <div className="mt-1.5 inline-block px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-bold uppercase tracking-wider rounded">
                      Official Academic Transcript & Evaluation Report
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-600 space-y-1 font-mono">
                  <p className="font-sans font-bold text-slate-900">{new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
                  <p className="text-[10px] text-slate-500">Document Ref: HTEIM-TR-{Math.floor(100000 + Math.random() * 900000)}</p>
                </div>
              </div>

              {/* Student Summary Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Student Name</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{selectedStudent.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Attendance Rate</p>
                  <p className={`text-base font-mono font-bold mt-0.5 ${
                    selectedStudent.rate >= satisfactoryThreshold ? 'text-emerald-700' : selectedStudent.rate >= atRiskThreshold ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {Math.round(selectedStudent.rate)}% ({selectedStudent.attended}/{effectiveClassDays.length})
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Academic Standing</p>
                  <p className="text-xs font-extrabold uppercase mt-1">
                    {selectedStudent.rate >= 100 
                      ? <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">Perfect Standing</span>
                      : selectedStudent.rate >= satisfactoryThreshold
                      ? <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">Good Standing</span>
                      : <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">At-Risk Standing</span>
                    }
                  </p>
                </div>
                {(() => {
                  const studentKey = (selectedStudent.name || '').toLowerCase().trim();
                  const rub = rubricScores[studentKey] || { participation: 90, scripture: 95, assignment: 85 };
                  const rubAvg = Math.round((rub.participation + rub.assignment) / 2);
                  return (
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Composite Evaluation</p>
                      <p className="text-base font-mono font-bold text-indigo-700 mt-0.5">{rubAvg}% Average</p>
                    </div>
                  );
                })()}
              </div>

              {/* Rubric Evaluation Breakdown */}
              {(() => {
                const studentKey = (selectedStudent.name || '').toLowerCase().trim();
                const rub = rubricScores[studentKey] || { participation: 90, scripture: 95, assignment: 85 };
                return (
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Rubric & Ministerial Competency Breakdown</h3>
                    <div className="grid grid-cols-2 gap-3 bg-white p-3 border border-slate-200 rounded-xl text-center">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Class Participation</p>
                        <p className="text-lg font-mono font-bold text-emerald-700 mt-0.5">{rub.participation}%</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Course Readings & Assignments</p>
                        <p className="text-lg font-mono font-bold text-indigo-700 mt-0.5">{rub.assignment}%</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Session-by-Session Attendance Table */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Class Session Attendance Record</h3>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-800 bg-slate-100 text-slate-700">
                      <th className="p-2 font-bold">Class Session / Date</th>
                      <th className="p-2 font-bold text-center">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {effectiveClassDays.map(day => {
                      const att = selectedStudent.attendanceByDay[day.id];
                      const isPresent = att?.present;
                      const isExcused = !isPresent && !!(excusedAbsences[(selectedStudent.name || '').toLowerCase().trim()] || {})[day.id];

                      return (
                        <tr key={day.id} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-900">{day.name}</td>
                          <td className="p-2 text-center">
                            {appUser?.role !== 'student' ? (
                              <button
                                type="button"
                                onClick={() => handleToggleStudentAttendance(
                                  selectedStudent.name,
                                  day.id,
                                  isPresent ? 'excused' : isExcused ? 'absent' : 'present'
                                )}
                                className="cursor-pointer inline-block"
                                title="Click to cycle attendance status (Present -> Excused -> Absent)"
                              >
                                {isPresent ? (
                                  <span className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded transition-colors">Present</span>
                                ) : isExcused ? (
                                  <span className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold rounded transition-colors">Excused</span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold rounded transition-colors">Absent</span>
                                )}
                              </button>
                            ) : (
                              isPresent ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">Present</span>
                              ) : isExcused ? (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">Excused</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded">Absent</span>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Faculty Notes & Commentary */}
              {selectedStudent.note && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800 block mb-1">Faculty Academic Note:</span>
                  <p className="italic">{selectedStudent.note}</p>
                </div>
              )}

              {/* Official Signature Block */}
              <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t border-slate-200 text-slate-700 text-xs">
                <div className="flex flex-col items-center">
                  <div className="w-36 border-b border-slate-800 mb-1"></div>
                  <p className="font-bold text-slate-900">Dr. Faculty Director</p>
                  <p className="text-[10px] text-slate-400">Academic Dean, HTEIM School of Ministry</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-36 border-b border-slate-800 mb-1"></div>
                  <p className="font-bold text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-[10px] text-slate-400">Date of Issue</p>
                </div>
              </div>

              {/* Letterhead Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-slate-500 text-[10px]">
                <div className="flex items-center gap-2">
                  <img src={hteimLogoAsset} alt="HTEIM Logo" className="w-5 h-5 rounded-full border border-amber-400 p-0.5 object-contain bg-white" />
                  <span className="font-bold text-slate-700">HTEIM School of Ministry</span>
                </div>
                <div className="italic font-serif text-slate-600">
                  "Bringing Heaven to Earth, Taking People to Heaven"
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCertificateModal && certificateData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-8 border-double border-amber-600 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto animate-scaleUp p-8 text-center relative text-slate-900 print:border-8 print:shadow-none print:m-0" id="printable-certificate">
            {/* Top Certificate Header */}
            <div className="flex flex-col items-center justify-center mb-6">
              <img 
                src={hteimLogoAsset} 
                alt="HTEIM School of Ministry Logo" 
                className="w-20 h-20 rounded-full border-2 border-amber-500 shadow-md object-contain bg-white p-1 mb-2"
              />
              <h1 className="text-2xl font-black tracking-wider text-slate-900 uppercase">HTEIM SCHOOL OF MINISTRY</h1>
              <p className="text-xs font-extrabold text-amber-800 uppercase tracking-widest mt-0.5">Heaven Touching Earth Int'l Ministries</p>
              <p className="text-xs italic font-serif text-slate-600 mt-1">"Bringing Heaven to Earth, Taking People to Heaven"</p>
            </div>

            <div className="my-6 py-4 border-y border-amber-200 bg-amber-50/40 rounded-lg">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                Official Academic Commendation
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mt-3 uppercase">
                {certificateData.awardTitle}
              </h2>
            </div>

            <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">This Certificate is Proudly Awarded To</p>
            <h3 className="text-3xl font-serif font-black text-slate-900 my-3 text-amber-950 underline decoration-amber-400 underline-offset-8">
              {certificateData.studentName}
            </h3>

            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed my-4">
              In recognition of exceptional diligence, spiritual commitment, and outstanding academic engagement during the ministry training program at HTEIM School of Ministry.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg inline-block text-xs font-mono font-bold text-slate-800 my-2">
              {certificateData.criteria}
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-2 gap-8 mt-10 pt-6 border-t border-slate-200 text-slate-700 text-xs">
              <div className="flex flex-col items-center">
                <div className="w-36 border-b border-slate-800 mb-1"></div>
                <p className="font-bold text-slate-900">Dr. Faculty Director</p>
                <p className="text-[10px] text-slate-400">Academic Dean, HTEIM</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-36 border-b border-slate-800 mb-1"></div>
                <p className="font-bold text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <p className="text-[10px] text-slate-400">Date of Presentation</p>
              </div>
            </div>

            {/* Modal Action Buttons (Hidden when printing) */}
            <div className="mt-8 flex justify-end gap-2 print:hidden">
              <button 
                onClick={() => handleExportPDF('printable-certificate', `HTEIM_Certificate_${certificateData.studentName.replace(/\s+/g, '_')}.pdf`)}
                disabled={isGeneratingPDF}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className={`w-3.5 h-3.5 ${isGeneratingPDF ? 'animate-bounce' : ''}`} />
                {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF Certificate'}
              </button>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Browser Print
              </button>
              <button 
                onClick={() => setShowCertificateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Batch At-Risk Email Notice Modal */}
      {showBatchEmailModal && selectedStudentNames.length > 0 && (() => {
        const selectedStudentsData = uniqueStudents.filter(s => selectedStudentNames.includes(s.name));
        const atRiskSelected = selectedStudentsData.filter(s => s.rate < atRiskThreshold);

        const batchSubject = `[HTEIM School of Ministry] Batch Academic Notice - ${selectedStudentsData.length} Students`;
        
        let batchBody = `HTEIM SCHOOL OF MINISTRY - FACULTY BATCH ACADEMIC NOTICE\n`;
        batchBody += `Heaven Touching Earth Int'l Ministries\n`;
        batchBody += `Generated on ${new Date().toLocaleDateString()}\n\n`;
        batchBody += `The following ${selectedStudentsData.length} student(s) have been flagged for attendance review:\n\n`;

        selectedStudentsData.forEach((s, idx) => {
          const missedCount = effectiveClassDays.filter(day => !s.attendanceByDay[day.id]?.present).length;
          batchBody += `${idx + 1}. ${s.name}\n`;
          batchBody += `   • Attendance Standing: ${Math.round(s.rate)}% (${s.attended}/${effectiveClassDays.length} Attended, ${missedCount} Missed)\n`;
          if (s.avgScore !== null) {
            batchBody += `   • Evaluation Score: ${Math.round(s.avgScore)}%\n`;
          }
          batchBody += `\n`;
        });

        batchBody += `Please coordinate with academic advisors or students to maintain ministerial standard requirements.\n\nIn His Service,\nHTEIM Academic Administration`;

        const handleCopyBatchEmail = () => {
          navigator.clipboard.writeText(`Subject: ${batchSubject}\n\n${batchBody}`);
          setCopiedBatchEmail(true);
          setTimeout(() => setCopiedBatchEmail(false), 2500);
        };

        const batchMailtoUrl = `mailto:?subject=${encodeURIComponent(batchSubject)}&body=${encodeURIComponent(batchBody)}`;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-scaleUp">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-rose-400" />
                  <div>
                    <h2 className="text-sm font-extrabold">Batch At-Risk Email Notice</h2>
                    <p className="text-[10px] text-slate-400">{selectedStudentsData.length} Students Selected ({atRiskSelected.length} At-Risk)</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowBatchEmailModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Subject</label>
                  <input
                    readOnly
                    type="text"
                    value={batchSubject}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Consolidated Batch Notice Body</label>
                  <textarea
                    readOnly
                    rows={10}
                    value={batchBody}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-800 custom-scrollbar focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={clearBatchSelection}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Clear Selected
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyBatchEmail}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedBatchEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedBatchEmail ? 'Copied Batch Email!' : 'Copy Batch Email'}
                  </button>

                  <a
                    href={batchMailtoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Open Mail Client
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. Live Ministry Check-In Mode Modal (Mobile & Tablet) */}
      {showLiveCheckinModal && (
        appUser?.role === 'student' ? (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
            <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Access Restricted
                </span>
                <h3 className="text-base font-black text-white mt-1">Attendance Check-In Restricted</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Attendance marking and live check-ins are strictly reserved for Teachers and Administrators. Students cannot self-assign attendance.
                </p>
              </div>
              <button
                onClick={() => setShowLiveCheckinModal(false)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl h-full max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Live Checkin Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black tracking-tight">Live Ministry Check-In</h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Active Session
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Single-touch student check-in optimized for mobile & tablet</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLiveCheckinModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Session Toolbar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Class Day:</label>
                <select
                  value={liveCheckinDayId}
                  onChange={(e) => setLiveCheckinDayId(e.target.value)}
                  className="flex-1 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                >
                  {classDays.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {appUser?.role !== 'student' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = classDays.find(d => d.id === liveCheckinDayId);
                        if (selected) {
                          const newName = prompt('Rename Class Day Title:', selected.name);
                          if (newName && newName.trim() !== '') {
                            handleEditClassDayTitle(selected.id, newName.trim());
                          }
                        }
                      }}
                      className="p-1.5 bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      title="Rename active class day title"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddClassDay()}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shadow-sm"
                      title="Add a new class day on the fly"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Day</span>
                    </button>
                  </>
                )}
              </div>

              {/* Headcount Counter */}
              {(() => {
                const day = classDays.find(d => d.id === liveCheckinDayId) || classDays[0];
                let presentCount = 0;
                if (day) {
                  uniqueStudents.forEach(s => {
                    if (s.attendanceByDay[day.id]?.present) presentCount++;
                  });
                }
                const pct = uniqueStudents.length > 0 ? Math.round((presentCount / uniqueStudents.length) * 100) : 0;

                return (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-mono font-bold text-emerald-800">
                      {presentCount} / {uniqueStudents.length} Present ({pct}%)
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Search Input for Live Check-In */}
            <div className="p-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 flex-1 w-full min-w-0">
                {/* Select All Checkbox */}
                {(() => {
                  const searchLower = (liveCheckinSearch || '').toLowerCase();
                  const filteredCheckinStudents = uniqueStudents.filter(s => s && s.name && s.name.toLowerCase().includes(searchLower));
                  const allFilteredSelected = filteredCheckinStudents.length > 0 && filteredCheckinStudents.every(s => selectedCheckinStudents.includes(s.name));
                  const someFilteredSelected = filteredCheckinStudents.length > 0 && filteredCheckinStudents.some(s => selectedCheckinStudents.includes(s.name));
                  return (
                    <div className="flex items-center gap-2 flex-shrink-0 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                      <input
                        type="checkbox"
                        id="select-all-checkin"
                        checked={allFilteredSelected}
                        ref={el => {
                          if (el) {
                            el.indeterminate = someFilteredSelected && !allFilteredSelected;
                          }
                        }}
                        onChange={() => {
                          if (allFilteredSelected) {
                            setSelectedCheckinStudents(prev => prev.filter(name => !filteredCheckinStudents.some(f => f.name === name)));
                          } else {
                            setSelectedCheckinStudents(prev => {
                              const newSelection = [...prev];
                              filteredCheckinStudents.forEach(f => {
                                if (!newSelection.includes(f.name)) {
                                  newSelection.push(f.name);
                                }
                              });
                              return newSelection;
                            });
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="select-all-checkin" className="text-xs font-bold text-slate-500 cursor-pointer select-none">
                        All
                      </label>
                    </div>
                  );
                })()}

                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Filter student for check-in..."
                    value={liveCheckinSearch}
                    onChange={(e) => setLiveCheckinSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (!liveCheckinDayId) return;
                  // Toggle mark all present
                  const updatedRecords = [...records];
                  uniqueStudents.forEach(s => {
                    if (!s || !s.name) return;
                    const sNameLower = s.name.toLowerCase().trim();
                    const existingIdx = updatedRecords.findIndex(r => r && r.studentName && r.studentName.toLowerCase().trim() === sNameLower && r.classDay === liveCheckinDayId);
                    if (existingIdx >= 0) {
                      updatedRecords[existingIdx].present = true;
                    } else {
                      updatedRecords.push({
                        studentName: s.name,
                        classDay: liveCheckinDayId,
                        present: true,
                        score: null,
                        timestamp: new Date().toLocaleDateString()
                      });
                    }
                  });
                  setRecords(updatedRecords);
                }}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 transition-colors cursor-pointer flex-shrink-0"
              >
                Mark All Present
              </button>
            </div>

            {/* Selection-Based Bulk Action Bar */}
            {(() => {
              const handleBulkSetStatus = (status: 'present' | 'absent' | 'excused') => {
                if (!liveCheckinDayId || selectedCheckinStudents.length === 0) return;

                // 1. Prepare excusedAbsences updates
                setExcusedAbsences(prev => {
                  const updatedExcused = { ...prev };
                  selectedCheckinStudents.forEach(name => {
                    if (!name) return;
                    const studentKey = name.toLowerCase().trim();
                    updatedExcused[studentKey] = {
                      ...(updatedExcused[studentKey] || {}),
                      [liveCheckinDayId]: status === 'excused'
                    };
                  });
                  return updatedExcused;
                });

                // 2. Prepare records updates
                setRecords(prev => {
                  const updated = [...prev];
                  selectedCheckinStudents.forEach(name => {
                    if (!name) return;
                    const studentKey = name.toLowerCase().trim();
                    const existingIdx = updated.findIndex(
                      r => r && r.studentName && r.studentName.toLowerCase().trim() === studentKey && r.classDay === liveCheckinDayId
                    );

                    if (status === 'present') {
                      if (existingIdx >= 0) {
                        updated[existingIdx].present = true;
                      } else {
                        updated.push({
                          studentName: name,
                          classDay: liveCheckinDayId,
                          present: true,
                          score: null,
                          timestamp: new Date().toLocaleDateString()
                        });
                      }
                    } else {
                      // For absent or excused, set present to false
                      if (existingIdx >= 0) {
                        updated[existingIdx].present = false;
                      }
                    }
                  });
                  return updated;
                });

                // 3. Clear selections after successful action
                setSelectedCheckinStudents([]);
              };

              if (selectedCheckinStudents.length === 0) return null;

              return (
                <div className="px-4 py-3 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 border-b border-indigo-500/30 text-white flex flex-col sm:flex-row items-center justify-between gap-3 animate-slideDown shadow-md flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-indigo-500/20 text-indigo-300 p-1.5 rounded-lg border border-indigo-400/30 animate-pulse">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">
                        {selectedCheckinStudents.length} {selectedCheckinStudents.length === 1 ? 'Student' : 'Students'} Selected
                      </p>
                      <p className="text-[10px] text-slate-400">Apply status to all selected records</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleBulkSetStatus('present')}
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Present
                    </button>
                    <button
                      onClick={() => handleBulkSetStatus('excused')}
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      Excused
                    </button>
                    <button
                      onClick={() => handleBulkSetStatus('absent')}
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      Absent
                    </button>
                    <button
                      onClick={() => setSelectedCheckinStudents([])}
                      className="px-2.5 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Live Student Card List */}
            <div className="p-3 overflow-y-auto custom-scrollbar flex-1 space-y-2 bg-slate-50 dark:bg-slate-950">
              {uniqueStudents
                .filter(s => s && s.name && s.name.toLowerCase().includes((liveCheckinSearch || '').toLowerCase()))
                .map(s => {
                  const att = s.attendanceByDay[liveCheckinDayId];
                  const isPresent = att?.present;
                  const studentKey = (s.name || '').toLowerCase().trim();
                  const isExcused = !isPresent && !!(excusedAbsences[studentKey] || {})[liveCheckinDayId];
                  const isChecked = selectedCheckinStudents.includes(s.name);

                  const handleToggleSelect = () => {
                    setSelectedCheckinStudents(prev => 
                      prev.includes(s.name) 
                        ? prev.filter(name => name !== s.name)
                        : [...prev, s.name]
                    );
                  };

                  const handleSetStatus = (status: 'present' | 'absent' | 'excused') => {
                    if (!liveCheckinDayId) return;

                    if (status === 'excused') {
                      setExcusedAbsences(prev => ({
                        ...prev,
                        [studentKey]: {
                          ...(prev[studentKey] || {}),
                          [liveCheckinDayId]: true
                        }
                      }));
                    } else {
                      setExcusedAbsences(prev => ({
                        ...prev,
                        [studentKey]: {
                          ...(prev[studentKey] || {}),
                          [liveCheckinDayId]: false
                        }
                      }));
                    }

                    const updated = [...records];
                    const existingIdx = updated.findIndex(r => r && r.studentName && r.studentName.toLowerCase().trim() === studentKey && r.classDay === liveCheckinDayId);
                    
                    if (status === 'present') {
                      if (existingIdx >= 0) {
                        updated[existingIdx].present = true;
                      } else {
                        updated.push({
                          studentName: s.name,
                          classDay: liveCheckinDayId,
                          present: true,
                          score: null,
                          timestamp: new Date().toLocaleDateString()
                        });
                      }
                    } else {
                      if (existingIdx >= 0) {
                        updated[existingIdx].present = false;
                      }
                    }
                    setRecords(updated);
                  };

                  return (
                    <div 
                      key={s.name} 
                      className={`p-3 border rounded-xl flex items-center justify-between gap-3 shadow-2xs transition-all duration-200 ${
                        isChecked 
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 ring-1 ring-indigo-200 dark:ring-indigo-900' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Row Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={handleToggleSelect}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1" onClick={handleToggleSelect}>
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{s.name}</h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Overall Rate: {Math.round(s.rate)}%</p>
                        </div>
                      </div>

                      {/* Single-Touch 3-Button Toggle */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <motion.button
                          onClick={() => handleSetStatus('present')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.90 }}
                          animate={{ scale: isPresent ? 1.05 : 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isPresent 
                              ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/30' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Present
                        </motion.button>

                        <motion.button
                          onClick={() => handleSetStatus('excused')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.90 }}
                          animate={{ scale: isExcused ? 1.05 : 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isExcused 
                              ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/30' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-400'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          Excused
                        </motion.button>

                        <motion.button
                          onClick={() => handleSetStatus('absent')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.90 }}
                          animate={{ scale: (!isPresent && !isExcused) ? 1.05 : 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            !isPresent && !isExcused 
                              ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-500/30' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-400'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          Absent
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button 
                onClick={() => setShowLiveCheckinModal(false)}
                className="px-5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Done & Save Live Session
              </button>
            </div>
          </div>
        </div>
      )
    )}

      {/* Batch Announcement Broadcast Modal */}
      {showBatchBroadcastModal && (
        <BatchAnnouncementModal
          isOpen={showBatchBroadcastModal}
          onClose={() => setShowBatchBroadcastModal(false)}
          availableStudents={uniqueStudents.map(s => ({
            name: s.name,
            email: `${s.name.toLowerCase().replace(/\s+/g, '.')}@hteim.edu`,
            phone: '+1 (868) 555-0199',
            track: 'Active Ministry Module'
          }))}
          onSendBroadcast={handleSendBatchBroadcast}
        />
      )}

      {/* Outstanding Payment Notice Banner for Students */}
      {showOutstandingPaymentBanner && studentPaymentSummary && studentPaymentSummary.hasOutstanding && (
        <OutstandingPaymentBanner
          summary={studentPaymentSummary}
          onClose={() => setShowOutstandingPaymentBanner(false)}
          onViewStatement={() => {
            setActiveErpTab('payments');
            setShowOutstandingPaymentBanner(false);
          }}
        />
      )}

      {/* Global Command Palette Modal (Ctrl + K) */}
      {showCommandPalette && (
        <CommandPaletteModal
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          onNavigate={(tab) => setActiveErpTab(tab)}
          appUser={appUser}
          studentList={uniqueStudents.map(s => ({
            name: s.name,
            rate: s.rate,
            levelId: s.levelId,
            studentId: getStudentIdForName(s.name)
          }))}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenAdminTools={() => setShowAdminAuditModal(true)}
          onOpenBatchBroadcast={() => setShowBatchBroadcastModal(true)}
          onOpenLiveCheckin={() => {
            setShowLiveCheckinModal(true);
            if (!liveCheckinDayId && classDays.length > 0) {
              setLiveCheckinDayId(classDays[classDays.length - 1].id);
            }
          }}
          onOpenMobileDownload={() => setShowMobileDownloadModal(true)}
          onOpenLogin={() => setShowLoginModal(true)}
        />
      )}

      {/* Manage Class Days Modal */}
      <ManageClassDaysModal
        isOpen={showClassDaysModal}
        onClose={() => setShowClassDaysModal(false)}
        classDays={classDays}
        onAddClassDay={handleAddClassDay}
        onEditClassDayTitle={handleEditClassDayTitle}
        onDeleteClassDay={handleDeleteClassDay}
        uniqueStudentsCount={uniqueStudents.length}
        classDayStats={classDayStats}
      />

      {/* Login Portal Modal */}
      {(showLoginModal || !appUser) && (
        <LoginModal
          isOpen={showLoginModal || !appUser}
          availableStudentNames={uniqueStudents.map(s => s.name)}
          availableStudents={uniqueStudents.map(s => s.name)}
          currentUser={appUser}
          onLoginSuccess={handleAppLoginSuccess}
          onClose={() => {
            if (appUser) setShowLoginModal(false);
          }}
        />
      )}
    </div>
  );
}
