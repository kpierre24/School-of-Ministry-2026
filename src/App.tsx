import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { LogoImage } from './components/LogoImage';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import stringSimilarity from 'string-similarity';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  FileSpreadsheet, 
  AlertCircle, 
  Filter,
  User as UserIcon, 
  Upload, 
  Loader2, 
  Database,
  Search,
  Download,
  ArrowUpDown,
  ArrowRight,
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
  Timer,
  Play,
  Pause,
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
  Plus,
  Menu,
  MessageSquare,
  LogOut,
  MoreHorizontal,
  Users
} from 'lucide-react';
import { loadAuthoritativeState as loadFromSupabase, saveAuthoritativeState as saveToSupabase } from './services/dataSyncService';
import { testSupabaseConnection, loadFromSupabase as loadDirectFromSupabase } from './lib/supabaseSync';
import { supabase, uploadToSupabaseStorage, ensureSupabaseStorageUrl, syncLibraryFromSupabaseBucket, syncFacultyImagesToSupabase, syncStudentPhotosToSupabase } from './lib/supabaseClient';
import { SupabaseDiagnosticModal } from './components/SupabaseDiagnosticModal';
import { BatchAnnouncementModal } from './components/BatchAnnouncementModal';
import { MobileDownloadCenterModal } from './components/MobileDownloadCenterModal';
import { ManageClassDaysModal } from './components/ManageClassDaysModal';
import { SheetMergeConflictModal } from './components/SheetMergeConflictModal';
import { getAttendanceLockInfo, isAttendanceLocked, ATTENDANCE_LOCK_WINDOW_HOURS } from './lib/attendanceLock';
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
import { subscribeToOAuthState as initAuth, loginWithGoogleOAuth as googleSignIn, logoutUserSession as logout, logoutUserSession as supabaseLogout } from './services/authService';
import { fetchSpreadsheetMetadata, fetchMultipleRanges, extractSpreadsheetId, fetchPublicSpreadsheetData } from './lib/sheets';
import { getDemoAttendance } from './data';
import { TabType, AppNotification, CustomAssignment, AssignmentSubmission, ACADEMIC_LEVELS, getDefaultLevelForStudent, AcademicLevel, Course, ScheduleItem, LibraryResource, MediaResource, PaymentRecord, ClassDay, StudentSummary, AppMessage, MessageReply, MessageAttachment, AttendanceRecord } from './types';
import { AppUser, generateStudentUsername, UserCredential, ensureUserCredentials, resetUserPassword, isMatchingCredential, mergeUserCredentials, DEFAULT_USER_PASSWORD } from './lib/userAuth';
import { updatePasswordInSupabase } from './lib/supabaseAuth';
import { NotificationCenter } from './components/NotificationCenter';
import { generateAutomatedNotifications, filterNotificationsForUser } from './lib/notifications';
import { CentralNotificationService } from './services/notification/CentralNotificationService';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { SettingsModal, ThemeMode } from './components/SettingsModal';
import { StudentAttendancePortal } from './components/StudentAttendancePortal';
import { HomeTab, DEFAULT_FACULTY_TEACHERS } from './components/HomeTab';
import { StudentsTab } from './components/StudentsTab';
import { CoursesTab, INITIAL_COURSES } from './components/CoursesTab';
import { ExamsTab, INITIAL_ASSIGNMENTS, INITIAL_SUBMISSIONS } from './components/ExamsTab';
import { ScheduleTab, INITIAL_SCHEDULE } from './components/ScheduleTab';
import { LibraryTab, INITIAL_RESOURCES } from './components/LibraryTab';
import { PaymentTab, INITIAL_PAYMENTS } from './components/PaymentTab';
import { MessagesTab, INITIAL_MESSAGES } from './components/MessagesTab';
import { ReportsTab } from './components/ReportsTab';
import { DEFAULT_PRESET_MEDIA } from './components/ClassroomMediaPlayer';
import { IntroSplashScreen } from './components/IntroSplashScreen';
import { OutstandingPaymentBanner } from './components/OutstandingPaymentBanner';

// Subtle Page-Fade transition variants for smooth tab navigation
const pageFadeVariants = {
  initial: { opacity: 0, y: 8, filter: 'blur(3px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -6, filter: 'blur(2px)' },
};

const pageFadeTransition = {
  duration: 0.22,
  ease: [0.16, 1, 0.3, 1] as const,
};
import { getStudentPaymentDetails, StudentPaymentSummary } from './lib/paymentUtils';
import { SwipeableAttendanceCard } from './components/SwipeableAttendanceCard';
import { AdminAuditAndBackupModal } from './components/AdminAuditAndBackupModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { AppPresentationModal } from './components/AppPresentationModal';
import { EmptyState } from './components/UXPrimitives';
import { ErrorBoundary } from './components/ErrorBoundary';
import { displayErrorToUser } from './lib/errorHandler';
import { logActivity } from './lib/auditLogger';
import { exportFullBackupJSON } from './lib/backupSuite';
import { trackUxEvent } from './lib/uxTelemetry';

const EXCLUDED_STUDENTS = [
  'gale agrant',
  'gillian selkridge',
  'sam selk',
];

const VALID_TABS: TabType[] = ['home', 'attendance', 'students', 'courses', 'exams', 'schedule', 'library', 'payments', 'messages', 'reports'];

const getTabFromLocation = (): TabType => {
  if (typeof window === 'undefined') return 'home';
  const candidate = new URLSearchParams(window.location.search).get('tab') as TabType | null;
  return candidate && VALID_TABS.includes(candidate) ? candidate : 'home';
};

const isExcludedStudent = (name?: string) => {
  if (!name || typeof name !== 'string') return false;
  const lower = (name || '').toLowerCase().trim();
  return EXCLUDED_STUDENTS.some(excluded => lower.includes(excluded));
};

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
  'colette blackburn joseph': 'Colette Blackburne Joseph',
  'colette blackburne joseph': 'Colette Blackburne Joseph',
  'colette blackburne joseph ': 'Colette Blackburne Joseph',
  'colette blackburn': 'Colette Blackburne Joseph',
  'colette blackburne': 'Colette Blackburne Joseph',
};

const getCanonicalNamesMap = (rawNames: string[]): Map<string, string> => {
  const nameGroups: string[][] = [];
  const canonicalNames = new Map<string, string>();

  rawNames.forEach((rawName: string) => {
    if (!rawName) return;
    let foundGroup = false;
    const lowerRaw = (rawName || '').toLowerCase().trim();
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

  return canonicalNames;
};

type MergeConflict = {
  studentName: string;
  classDay: string;
  localStatus: 'present' | 'absent';
  sheetsStatus: 'present' | 'absent';
  sheetsScore: string;
  sheetsTimestamp: string;
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

const LazyHomeTab = HomeTab;
const LazyStudentsTab = StudentsTab;
const LazyCoursesTab = CoursesTab;
const LazyExamsTab = ExamsTab;
const LazyScheduleTab = ScheduleTab;
const LazyLibraryTab = LibraryTab;
const LazyPaymentTab = PaymentTab;
const LazyMessagesTab = MessagesTab;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const lastFetchTimeRef = useRef<number>(0);

  // App User & Role State (Admin, Teacher, Student) - In-memory only via Supabase Verification
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  // Dynamic User Credentials State - In-memory state synchronized with Supabase & cached in localStorage
  const [userCredentials, setUserCredentials] = useState<UserCredential[]>(() => {
    try {
      const saved = localStorage.getItem('hteim_user_credentials');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed loading user credentials from local storage:", e);
    }
    return [];
  });

  // Clear any legacy auth session remnants on initial load while preserving credentials registry
  useEffect(() => {
    try {
      localStorage.removeItem('hteim_app_user');
      sessionStorage.removeItem('hteim_app_user');
      sessionStorage.removeItem('hteim_user_credentials');
    } catch (e) {}
  }, []);

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem('hteim_intro_shown');
    } catch {
      return true;
    }
  });

  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);
  const [showToolsMenu, setShowToolsMenu] = useState<boolean>(false);
  const [showAdminAuditModal, setShowAdminAuditModal] = useState<boolean>(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [isNavOpen, setIsNavOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      } else if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowRoleMenu(false);
        setShowToolsMenu(false);
        setShowMobileMoreMenu(false);
        setShowMoreMenu(false);
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
        id: `u-student-${(chosenName || '').toLowerCase().replace(/\s+/g, '-')}`,
        username: generateStudentUsername(chosenName),
        name: chosenName,
        role: 'student',
        studentName: chosenName,
        email: `${(generateStudentUsername(chosenName) || '').toLowerCase()}@hteim.edu`
      };
    }
    setAppUser(newUser);
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

  const handleAppLogout = async () => {
    const prevUser = appUser;
    try {
      await supabaseLogout();
    } catch (e) {
      console.warn("Supabase sign out notice:", e);
    }
    try {
      await logout();
    } catch (e) {}
    setAppUser(null);
    setActiveErpTab('home');
    setShowLoginModal(false);
    if (prevUser) {
      logActivity({
        actor: prevUser.name || 'User',
        role: prevUser.role || 'student',
        actionCategory: 'System Settings',
        actionTitle: 'User Logged Out',
        details: `Signed out of portal: ${prevUser.name}`
      });
    }
    setSyncedBannerMessage('🔒 Logged out of HTEIM Portal.');
    setTimeout(() => setSyncedBannerMessage(null), 3500);
  };

  const handleChangeUserPassword = async (usernameOrEmail: string | AppUser | undefined | null, newPin: string) => {
    if (!usernameOrEmail) return;

    let currentList = userCredentials;
    if (!currentList || currentList.length === 0) {
      try {
        const saved = localStorage.getItem('hteim_user_credentials');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentList = parsed;
          }
        }
      } catch (e) {}
    }

    const updatedCreds = (currentList || []).map(c => {
      if (isMatchingCredential(c, usernameOrEmail)) {
        return {
          ...c,
          passwordHash: newPin,
          mustChangePassword: false,
          lastLoginAt: new Date().toISOString()
        };
      }
      return c;
    });

    setUserCredentials(updatedCreds);
    try {
      localStorage.setItem('hteim_user_credentials', JSON.stringify(updatedCreds));
    } catch (e) {}

    // Update active appUser state if currently logged in
    setAppUser(prev => {
      if (!prev) return prev;
      if (isMatchingCredential({
        id: prev.id,
        email: prev.email,
        username: prev.username,
        name: prev.name,
        studentName: prev.studentName,
        role: prev.role,
        passwordHash: '',
        mustChangePassword: true,
        status: 'active',
        createdAt: ''
      }, usernameOrEmail)) {
        return { ...prev, mustChangePassword: false };
      }
      return prev;
    });

    // Synchronously write the updated credentials registry to Supabase immediately for real-time security
    try {
      const activeEmail = appUser?.email || user?.email || (typeof usernameOrEmail === 'string' && usernameOrEmail.includes('@') ? usernameOrEmail : undefined);
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
        facultyTeachers,
        payments,
        messages,
        zoomExceptionNote,
        hasZoomException,
        userCredentials: updatedCreds
      };
      await saveToSupabase(activeEmail, stateToSave);
      await updatePasswordInSupabase(usernameOrEmail, newPin, updatedCreds);
    } catch (err) {
      console.error("Supabase password change sync failure:", err);
    }
  };

  const handleResetStudentPassword = async (studentName: string | undefined | null) => {
    if (!studentName) return;
    const username = generateStudentUsername(studentName);
    if (!username) return;

    let currentList = userCredentials;
    if (!currentList || currentList.length === 0) {
      try {
        const saved = localStorage.getItem('hteim_user_credentials');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentList = parsed;
          }
        }
      } catch (e) {}
    }
    
    const updatedCreds = (currentList || []).map(c => {
      if (
        c.username?.toLowerCase() === (username || '').toLowerCase() ||
        c.studentName?.toLowerCase().trim() === (studentName || '').toLowerCase().trim() ||
        c.name?.toLowerCase().trim() === (studentName || '').toLowerCase().trim()
      ) {
        return {
          ...c,
          passwordHash: DEFAULT_USER_PASSWORD, // 'password1'
          mustChangePassword: true
        };
      }
      return c;
    });

    setUserCredentials(updatedCreds);
    try {
      localStorage.setItem('hteim_user_credentials', JSON.stringify(updatedCreds));
    } catch (e) {}

    // Direct push to Supabase central registry
    try {
      const activeEmail = appUser?.email || user?.email;
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
        facultyTeachers,
        payments,
        messages,
        zoomExceptionNote,
        hasZoomException,
        userCredentials: updatedCreds
      };
      await saveToSupabase(activeEmail, stateToSave);
      setSyncedBannerMessage(`⚡ School Registry: Successfully reset password for ${studentName} to "password1" and synchronized across all servers.`);
      setTimeout(() => setSyncedBannerMessage(null), 5000);
    } catch (err) {
      console.error("Supabase password reset sync failure:", err);
    }
  };
  
  const [sheetUrl, setSheetUrl] = useState(() => {
    const saved = localStorage.getItem('sheetUrl');
    if (!saved || saved.includes('gid=283667804')) {
      return 'https://docs.google.com/spreadsheets/d/1k9Vn2-ZkHtePYeQO0mQstzesCW4-UJLAELoFCVuVfEI/edit?gid=614888378#gid=614888378';
    }
    return saved;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'info' | 'warning' | 'error'; title: string; message: string }>>([]);

  useEffect(() => {
    (window as any).triggerPortalToast = (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts(prev => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5500);
    };
    return () => {
      delete (window as any).triggerPortalToast;
    };
  }, []);

  // Synchronized States
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('hteim_courses');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('hteim_scheduled_classes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter((s: any) => !String(s.id).startsWith('sch_p'));
      } catch {}
    }
    return [];
  });
  const [libraryResources, setLibraryResources] = useState<LibraryResource[]>(() => {
    const saved = localStorage.getItem('hteim_library_resources');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter((r: any) => !['r_gdrive_livestream_1', 'r1', 'r2', 'r3', 'r4'].includes(r.id));
      } catch {}
    }
    return [];
  });
  const [classroomMedia, setClassroomMedia] = useState<MediaResource[]>(() => {
    const saved = localStorage.getItem('hteim_classroom_media');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter((m: any) => !['m_preset_gdrive_1', 'm_preset_1', 'm_preset_2', 'm_preset_3'].includes(m.id));
      } catch {}
    }
    return [];
  });
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('hteim_student_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });
  const [facultyTeachers, setFacultyTeachers] = useState<any[]>(() => {
    const saved = localStorage.getItem('hteim_faculty_teachers_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_FACULTY_TEACHERS;
  });
  const [zoomExceptionNote, setZoomExceptionNote] = useState<string>(() => {
    return localStorage.getItem('hteim_zoom_exception_note') || '';
  });
  const [hasZoomException, setHasZoomException] = useState<boolean>(() => {
    return localStorage.getItem('hteim_has_zoom_exception') === 'true';
  });
  
  // Permanent Default Class Days
  const defaultPermanentClassDays: ClassDay[] = useMemo(() => [
    { id: 'Day 1', name: 'Class Day 1 - Pneumatology & Holy Spirit' },
    { id: 'Day 2', name: 'Class Day 2 - Hermeneutics & Exegesis' },
    { id: 'Day 3', name: 'Class Day 3 - Ministerial Ethics' },
    { id: 'Day 4', name: 'Class Day 4 - Homiletics & Preaching' },
    { id: 'Day 5', name: 'Class Day 5 - Pastoral Care & Leadership' },
    { id: 'Day 6', name: 'Class Day 6 - Church History & Doctrine' },
  ], []);

  const [classDays, setClassDays] = useState<ClassDay[]>(() => {
    const saved = localStorage.getItem('classDays');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { id: 'Day 1', name: 'Class Day 1 - Pneumatology & Holy Spirit' },
      { id: 'Day 2', name: 'Class Day 2 - Hermeneutics & Exegesis' },
      { id: 'Day 3', name: 'Class Day 3 - Ministerial Ethics' },
      { id: 'Day 4', name: 'Class Day 4 - Homiletics & Preaching' },
      { id: 'Day 5', name: 'Class Day 5 - Pastoral Care & Leadership' },
      { id: 'Day 6', name: 'Class Day 6 - Church History & Doctrine' },
    ];
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
        if (Array.isArray(loaded) && loaded.length > 0) {
          return loaded.filter(r => {
            if (!r || !r.name) return false;
            const nameLower = (r?.name || '').toLowerCase().trim();
            if (isExcludedStudent(r.name)) return false;
            if (deletedList.some(d => (d || '').toLowerCase().trim() === nameLower)) return false;
            return true;
          });
        }
      } catch (e) {}
    }

    // Default permanent attendance records for enrolled students
    const initialStudentNames = Array.from(
      new Set(INITIAL_PAYMENTS.map(p => p.studentName.trim()))
    );
    const defaultDays = [
      { id: 'Day 1' }, { id: 'Day 2' }, { id: 'Day 3' },
      { id: 'Day 4' }, { id: 'Day 5' }, { id: 'Day 6' }
    ];
    const defaultRecs: AttendanceRecord[] = [];
    initialStudentNames.forEach((studentName, idx) => {
      defaultDays.forEach((day, dayIdx) => {
        const isPresent = (idx + dayIdx) % 7 !== 0;
        defaultRecs.push({
          name: studentName,
          classDay: day.id,
          present: isPresent,
          timestamp: new Date().toLocaleDateString(),
          score: isPresent ? String(80 + ((idx * 3 + dayIdx * 5) % 20)) : '0',
          manualOverride: true
        });
      });
    });
    return defaultRecs;
  });
  const [deletedClassDayIds, setDeletedClassDayIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('deletedClassDayIds');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('deletedClassDayIds', JSON.stringify(deletedClassDayIds));
  }, [deletedClassDayIds]);
  const [dataSource, setDataSource] = useState<'demo' | 'sheets' | null>(() => {
    return (localStorage.getItem('dataSource') as any) || null;
  });

  const [sheetMergePolicy, setSheetMergePolicy] = useState<'sheets' | 'manual' | 'prompt'>(() => {
    return (localStorage.getItem('hteim_sheet_merge_policy') as any) || 'manual';
  });

  const [pendingConflicts, setPendingConflicts] = useState<MergeConflict[]>([]);
  const [pendingSyncData, setPendingSyncData] = useState<{
    preservedRecords: AttendanceRecord[];
    newSyncedRecords: AttendanceRecord[];
    updatedClassDays: ClassDay[];
  } | null>(null);

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'at_risk' | 'moderate' | 'perfect' | 'fifty_percent' | 'unpaid' | 'honor_roll'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'rate_desc' | 'rate_asc'>('name_asc');
  
  // Selected Student for Detail Modal
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  
  // Deleted / Excluded Students state
  const [deletedStudentNames, setDeletedStudentNames] = useState<string[]>(() => {
    const saved = localStorage.getItem('deletedStudentNames');
    let list: string[] = [];
    if (saved) {
      try { list = JSON.parse(saved); } catch {}
    }
    return list.filter(name => {
      const lower = (name || '').toLowerCase().trim();
      return !lower.includes('colette') && !lower.includes('blackburn');
    });
  });

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

  const handleUpdateStudentPhoto = async (studentName: string, photoDataUrl: string) => {
    const key = (studentName || '').toLowerCase().trim();
    const cleanKey = key.replace(/[^a-z0-9]/g, '_');
    const fileName = `student_portrait_${cleanKey}.jpg`;

    let finalUrl = photoDataUrl;
    try {
      finalUrl = await ensureSupabaseStorageUrl('classroom_media', fileName, photoDataUrl);
    } catch (err) {
      console.error("Failed to upload student photo to Supabase storage:", err);
    }

    const updatedPhotos = { ...studentPhotos, [key]: finalUrl };
    setStudentPhotos(updatedPhotos);
    try {
      localStorage.setItem('hteim_student_photos', JSON.stringify(updatedPhotos));
    } catch (e) {}

    // Persist updated photo dictionary to Supabase cloud database immediately
    const activeEmail = appUser?.email || user?.email;
    const stateToSave = {
      records,
      classDays,
      studentNotes,
      excusedAbsences,
      rubricScores,
      deletedStudentNames,
      studentPhotos: updatedPhotos,
      studentLevels,
      customAssignments,
      submissions,
      notifications,
      sheetUrl,
      courses,
      schedules,
      libraryResources,
      classroomMedia,
      facultyTeachers,
      payments,
      messages,
      zoomExceptionNote,
      hasZoomException,
      userCredentials,
      updatedAt: new Date().toISOString()
    };
    try {
      await saveToSupabase(activeEmail, stateToSave);
    } catch (saveErr) {
      console.warn("Notice saving updated student photo to Supabase database:", saveErr);
    }
  };

  // Student Academic Levels State
  const [studentLevels, setStudentLevels] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('hteim_student_levels');
    return saved ? JSON.parse(saved) : {};
  });

  const handleUpdateStudentLevel = (studentName: string, levelId: string) => {
    const key = (studentName || '').toLowerCase().trim();
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
    return CentralNotificationService.getNotifications() as AppNotification[];
  });

  // Lifted Custom Assignments & Submissions State
  const [customAssignments, setCustomAssignments] = useState<CustomAssignment[]>(() => {
    const saved = localStorage.getItem('hteim_custom_assignments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter((a: any) => !['ASG-Q100', 'ASG-100', 'ASG-101', 'ASG-102', 'ASG-103'].includes(a.id));
      } catch (e) { console.error(e); }
    }
    return [];
  });

  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(() => {
    const saved = localStorage.getItem('hteim_assignment_submissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter((s: any) => !['SUB-101-ABurke', 'SUB-101-CDavis', 'SUB-102-EEvans'].includes(s.id));
      } catch (e) { console.error(e); }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('hteim_custom_assignments', JSON.stringify(customAssignments));
  }, [customAssignments]);

  useEffect(() => {
    localStorage.setItem('hteim_assignment_submissions', JSON.stringify(submissions));
  }, [submissions]);

  // Lifted Messages State & Communication Center Logic
  const [messages, setMessages] = useState<AppMessage[]>(() => {
    const saved = localStorage.getItem('hteim_app_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter((m: any) => !['msg_welcome_101', 'msg_tuition_inquiry_1', 'msg_zoom_class_1'].includes(m.id));
      } catch (e) { console.error(e); }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('hteim_app_messages', JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = (msgData: Omit<AppMessage, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'isReadByRecipient' | 'isReadBySender' | 'status'>) => {
    const senderName = msgData.senderName || appUser?.studentName || appUser?.name || 'Student';
    const senderRole = msgData.senderRole || appUser?.role || 'student';
    const newMessage: AppMessage = {
      ...msgData,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderName,
      senderRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'open',
      isReadBySender: true,
      isReadByRecipient: false,
      replies: [],
      attachments: msgData.attachments || []
    };

    setMessages(prev => [newMessage, ...prev]);

    logActivity({
      actor: senderName,
      role: senderRole,
      actionCategory: 'System Settings',
      actionTitle: 'New Message Sent',
      details: `Sent message '${msgData.subject}' to ${msgData.recipientName}`
    });
  };

  const handleReplyMessage = (messageId: string, replyText: string, attachments?: MessageAttachment[]) => {
    const replierName = appUser?.name || 'User';
    const replierRole = appUser?.role || 'student';

    const newReply: MessageReply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderName: replierName,
      senderRole: replierRole === 'admin' ? 'admin' : replierRole === 'teacher' ? 'teacher' : 'student',
      senderEmail: appUser?.email,
      message: replyText,
      createdAt: new Date().toISOString(),
      attachments
    };

    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return {
          ...m,
          replies: [...m.replies, newReply],
          updatedAt: new Date().toISOString(),
          status: 'in_progress',
          isReadByRecipient: false
        };
      }
      return m;
    }));
  };

  const handleUpdateMessageStatus = (messageId: string, status: AppMessage['status']) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status, updatedAt: new Date().toISOString() } : m));
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  // Compute unread count for current logged-in user
  const unreadMessagesCount = useMemo(() => {
    const userRole = appUser?.role || 'student';
    const userName = (appUser?.studentName || appUser?.name || '').toLowerCase();

    return messages.filter(m => {
      if (m.status === 'archived') return false;
      
      if (userRole === 'admin') {
        return (m.recipientType === 'admin' || m.recipientType === 'all_staff') && !m.isReadByRecipient;
      } else if (userRole === 'teacher') {
        return (m.recipientType === 'teacher' || m.recipientType === 'all_staff') && !m.isReadByRecipient;
      } else {
        const isFromStudent = (m.senderName || '').toLowerCase().includes(userName) || m.senderEmail === appUser?.email;
        if (isFromStudent) {
          return m.status === 'in_progress' || m.status === 'open';
        }
        return false;
      }
    }).length;
  }, [messages, appUser]);

  // Subscribe to CentralNotificationService to keep notifications in sync
  useEffect(() => {
    setNotifications(CentralNotificationService.getNotifications() as AppNotification[]);
    const unsubscribe = CentralNotificationService.subscribe(() => {
      setNotifications(CentralNotificationService.getNotifications() as AppNotification[]);
    });
    return () => unsubscribe();
  }, []);

  // Handler to scan assignments & submissions for automated notification generation
  const handleRunNotificationScan = () => {
    const updated = generateAutomatedNotifications(
      customAssignments,
      submissions,
      CentralNotificationService.getNotifications() as AppNotification[],
      appUser?.role,
      appUser?.studentName || appUser?.name
    );
    CentralNotificationService.setNotifications(updated as any);
  };

  useEffect(() => {
    handleRunNotificationScan();
  }, [appUser, customAssignments, submissions]);

  const handleMarkNotifAsRead = (id: string) => {
    CentralNotificationService.markAsRead(id);
  };

  const handleMarkAllNotifsAsRead = () => {
    CentralNotificationService.markAllAsRead(appUser?.role, appUser?.studentName || appUser?.name);
  };

  const handleClearNotifs = () => {
    CentralNotificationService.clearAll();
  };

  const handleAddTestNotif = (notif: AppNotification) => {
    const current = CentralNotificationService.getNotifications();
    CentralNotificationService.setNotifications([notif as any, ...current]);
  };

  const handleSelectNotif = (notif: AppNotification) => {
    if (notif.actionTab) {
      setActiveErpTab(notif.actionTab);
    }
  };

  // Batch Announcements & PWA Mobile Offline Sync State
  const [showBatchBroadcastModal, setShowBatchBroadcastModal] = useState(false);
  const [showPresentationModal, setShowPresentationModal] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncedBannerMessage, setSyncedBannerMessage] = useState<string | null>(null);

  // Report Modal Search & Sorting & View Detail state
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportSortBy, setReportSortBy] = useState<'name' | 'rate' | 'score'>('name');
  const [reportSortDir, setReportSortDir] = useState<'asc' | 'desc'>('asc');
  const [reportViewDetailMode, setReportViewDetailMode] = useState<'compact' | 'detailed'>('compact');

  const handleNavigate = (tab: TabType) => {
    if (!appUser && tab !== 'home') {
      setShowLoginModal(true);
      return;
    }
    setActiveErpTab(tab);
    setIsNavOpen(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({ tab }, '', url);
    }
    trackUxEvent('navigation_changed', { tab, role: appUser?.role || 'guest' });
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      trackUxEvent('online_restored');
      setSyncedBannerMessage('🟢 Internet Reconnected! Mobile PWA auto-synced local attendance & student records.');
      setTimeout(() => setSyncedBannerMessage(null), 6000);
    };
    const handleOffline = () => {
      setIsOffline(true);
      trackUxEvent('offline_detected');
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
    const current = CentralNotificationService.getNotifications();
    CentralNotificationService.setNotifications([notif as any, ...current]);
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
      if (parsed.notifications) CentralNotificationService.setNotifications(parsed.notifications);
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
    CentralNotificationService.clearAll();
    setStudentNotes({});
    setExcusedAbsences({});
    setAtRiskThreshold(70);
    setSatisfactoryThreshold(80);
    window.location.reload();
  };

  // View Mode: Matrix (Grid) vs Cards
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');
  const [mobileRollCallMode, setMobileRollCallMode] = useState<'cards' | 'rapid'>('rapid');

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
  const [activeErpTab, setActiveErpTab] = useState<TabType>(getTabFromLocation);

  // Lock body scroll when any custom inline modal is active
  useEffect(() => {
    const isAnyModalOpen = !!selectedStudent || showStudentTranscriptModal || showCertificateModal;
    if (isAnyModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [selectedStudent, showStudentTranscriptModal, showCertificateModal]);

  // Keep guest users strictly on home tab
  useEffect(() => {
    if (!appUser && activeErpTab !== 'home') {
      setActiveErpTab('home');
    }
  }, [appUser, activeErpTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeErpTab);
    window.history.replaceState({ tab: activeErpTab }, '', url);
  }, [activeErpTab]);

  useEffect(() => {
    const handlePopState = () => {
      const targetTab = getTabFromLocation();
      if (!appUser && targetTab !== 'home') {
        setActiveErpTab('home');
        setShowLoginModal(true);
      } else {
        setActiveErpTab(targetTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [appUser]);

  const handleUpdateRubric = (studentName: string, key: 'participation' | 'scripture' | 'assignment', val: number) => {
    const studentKey = (studentName || '').toLowerCase().trim();
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
        setSyncedBannerMessage('Report element not found — switching to browser print.');
        setTimeout(() => setSyncedBannerMessage(null), 4000);
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

  // Live Check-in Session Stopwatch Timer State
  const [checkinTimerSeconds, setCheckinTimerSeconds] = useState<number>(0);
  const [isCheckinTimerRunning, setIsCheckinTimerRunning] = useState<boolean>(false);

  // Auto-start stopwatch timer when live check-in modal opens if not running
  useEffect(() => {
    if (showLiveCheckinModal) {
      setIsCheckinTimerRunning(true);
    }
  }, [showLiveCheckinModal]);

  // Stopwatch timer ticker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (showLiveCheckinModal && isCheckinTimerRunning) {
      interval = setInterval(() => {
        setCheckinTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showLiveCheckinModal, isCheckinTimerRunning]);

  // Format stopwatch seconds into HH:MM:SS or MM:SS
  const formatStopwatch = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

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

  // Floating Active Quiz Banner State
  const [showFloatingQuizBanner, setShowFloatingQuizBanner] = useState<boolean>(true);

  const activeQuizzesList = useMemo(() => {
    return customAssignments.filter(a => (a.type === 'quiz' || a.quizData) && a.quizData?.isPublished !== false);
  }, [customAssignments]);

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
  const [supabaseTableMissing, setSupabaseTableMissing] = useState<boolean>(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState<boolean>(false);

  // Pull from cloud on startup / login user change
  useEffect(() => {
    let active = true;
    const initialPull = async () => {
      setIsCloudSyncing(true);
      setCloudSyncError(null);
      setSupabaseTableMissing(false);
      const activeEmail = appUser?.email || user?.email;
      try {
        const cloudState = await loadFromSupabase(activeEmail);
        if (cloudState && active) {
          if (cloudState.records !== undefined) setRecords(cloudState.records);
          if (cloudState.classDays !== undefined) setClassDays(cloudState.classDays);
          if (cloudState.studentNotes !== undefined) setStudentNotes(cloudState.studentNotes);
          if (cloudState.excusedAbsences !== undefined) setExcusedAbsences(cloudState.excusedAbsences);
          if (cloudState.rubricScores !== undefined) setRubricScores(cloudState.rubricScores);
          if (cloudState.deletedStudentNames !== undefined) {
            setDeletedStudentNames(cloudState.deletedStudentNames.filter((name: string) => {
              const lower = (name || '').toLowerCase().trim();
              return !lower.includes('colette') && !lower.includes('blackburn');
            }));
          }
          if (cloudState.studentPhotos !== undefined) setStudentPhotos(cloudState.studentPhotos);
          if (cloudState.studentLevels !== undefined) setStudentLevels(cloudState.studentLevels);

          // Smart merge for customAssignments, submissions, libraryResources, classroomMedia so local uploads are not wiped
          if (cloudState.customAssignments !== undefined) {
            setCustomAssignments(prev => {
              const cloudIds = new Set(cloudState.customAssignments.map((a: any) => a.id));
              const localOnly = prev.filter(a => !cloudIds.has(a.id));
              return [...cloudState.customAssignments, ...localOnly];
            });
          }
          if (cloudState.submissions !== undefined) {
            setSubmissions(prev => {
              const cloudIds = new Set(cloudState.submissions.map((s: any) => s.id));
              const localOnly = prev.filter(s => !cloudIds.has(s.id));
              return [...cloudState.submissions, ...localOnly];
            });
          }
          if (cloudState.libraryResources !== undefined) {
            setLibraryResources(prev => {
              const cloudIds = new Set(cloudState.libraryResources.map((r: any) => r.id));
              const localOnly = prev.filter(r => !cloudIds.has(r.id));
              const merged = [...cloudState.libraryResources, ...localOnly];
              
              // Asynchronously scan Supabase 'library' storage bucket for any files uploaded directly
              syncLibraryFromSupabaseBucket(merged).then(({ updatedResources, addedCount }) => {
                if (addedCount > 0) {
                  setLibraryResources(updatedResources);
                }
              }).catch(() => {});

              return merged;
            });
          } else {
            syncLibraryFromSupabaseBucket(libraryResources).then(({ updatedResources, addedCount }) => {
              if (addedCount > 0) {
                setLibraryResources(updatedResources);
              }
            }).catch(() => {});
          }
          if (cloudState.classroomMedia !== undefined) {
            setClassroomMedia(prev => {
              const cloudIds = new Set(cloudState.classroomMedia.map((m: any) => m.id));
              const localOnly = prev.filter(m => !cloudIds.has(m.id));
              return [...cloudState.classroomMedia, ...localOnly];
            });
          }

          if (cloudState.notifications !== undefined) CentralNotificationService.setNotifications(cloudState.notifications);
          if (cloudState.sheetUrl !== undefined) setSheetUrl(cloudState.sheetUrl);
          if (cloudState.courses !== undefined) setCourses(cloudState.courses);
          if (cloudState.schedules !== undefined) setSchedules(cloudState.schedules);
          if (cloudState.payments !== undefined) setPayments(cloudState.payments);
          if (cloudState.messages !== undefined) setMessages(cloudState.messages);
          if (cloudState.zoomExceptionNote !== undefined) setZoomExceptionNote(cloudState.zoomExceptionNote);
          if (cloudState.hasZoomException !== undefined) setHasZoomException(cloudState.hasZoomException);
          if (cloudState.userCredentials !== undefined && Array.isArray(cloudState.userCredentials) && cloudState.userCredentials.length > 0) {
            setUserCredentials(prev => {
              const merged = mergeUserCredentials(prev, cloudState.userCredentials);
              try {
                localStorage.setItem('hteim_user_credentials', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
          if (Array.isArray(cloudState.facultyTeachers) && cloudState.facultyTeachers.length > 0) {
            setFacultyTeachers(cloudState.facultyTeachers);
            try {
              localStorage.setItem('hteim_faculty_teachers_v1', JSON.stringify(cloudState.facultyTeachers));
            } catch (e) {
              console.error("Failed writing facultyTeachers from cloud to localStorage:", e);
            }
          }
          
          if (cloudState.updatedAt) {
            const timeStr = new Date(cloudState.updatedAt).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            });
            setLastSyncedTime(timeStr);
          }
          setSyncedBannerMessage("⚡ Supabase Sync: Successfully pulled latest school database from Supabase.");
          setTimeout(() => setSyncedBannerMessage(null), 4500);
        } else if (cloudState === null && active) {
          // If no cloud data is present, immediately upload the existing local storage database to Supabase
          let facultyList: any[] = [];
          try {
            facultyList = JSON.parse(localStorage.getItem('hteim_faculty_teachers_v1') || '[]');
          } catch (e) {}

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
            facultyTeachers: facultyList,
            payments,
            messages,
            zoomExceptionNote,
            hasZoomException,
            userCredentials
          };
          const success = await saveToSupabase(activeEmail, stateToSave);
          if (success) {
            const timeStr = new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            });
            setLastSyncedTime(timeStr);
            setSyncedBannerMessage("⚡ Supabase Cloud Connected: Successfully uploaded existing database.");
            setTimeout(() => setSyncedBannerMessage(null), 5000);
          }
        }
      } catch (err: any) {
        console.error("Cloud pull error:", err);
        if (err.message === 'TABLE_NOT_FOUND') {
          setSupabaseTableMissing(true);
          setCloudSyncError("Supabase setup required: 'app_states' table not found.");
        } else {
          setCloudSyncError("Could not retrieve cloud sync data.");
        }
      } finally {
        if (active) setIsCloudSyncing(false);
      }
    };

    initialPull();
    return () => {
      active = false;
    };
  }, [user, appUser]);

  const handleSaveFacultyTeachers = async (newList: any[]) => {
    setFacultyTeachers(newList);
    try {
      localStorage.setItem('hteim_faculty_teachers_v1', JSON.stringify(newList));
    } catch (e) {}

    let syncedList = newList;
    try {
      // Ensure images are uploaded to Supabase Storage bucket ('classroom_media') if reachable
      syncedList = await syncFacultyImagesToSupabase(newList);
      setFacultyTeachers(syncedList);
      try {
        localStorage.setItem('hteim_faculty_teachers_v1', JSON.stringify(syncedList));
      } catch (e) {}
    } catch (err) {
      console.warn("Notice syncing faculty portraits to Supabase storage:", err);
    }

    // Save directly to Supabase cloud database
    const activeEmail = appUser?.email || user?.email;
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
      facultyTeachers: syncedList,
      payments,
      messages,
      zoomExceptionNote,
      hasZoomException,
      userCredentials
    };
    await saveToSupabase(activeEmail, stateToSave);
  };

  const handlePushToCloud = async () => {
    setIsCloudSyncing(true);
    setCloudSyncError(null);
    setSupabaseTableMissing(false);
    const activeEmail = appUser?.email || user?.email;
    try {
      let syncedStudentPhotos = studentPhotos;
      let syncedFaculty = facultyTeachers;

      try {
        syncedStudentPhotos = await syncStudentPhotosToSupabase(studentPhotos);
        setStudentPhotos(syncedStudentPhotos);
        try {
          localStorage.setItem('hteim_student_photos', JSON.stringify(syncedStudentPhotos));
        } catch (e) {}
      } catch (err) {
        console.warn("Notice syncing student photos to Supabase storage:", err);
      }

      try {
        syncedFaculty = await syncFacultyImagesToSupabase(facultyTeachers);
        setFacultyTeachers(syncedFaculty);
        try {
          localStorage.setItem('hteim_faculty_teachers_v1', JSON.stringify(syncedFaculty));
        } catch (e) {}
      } catch (err) {
        console.warn("Notice syncing faculty portraits to Supabase storage:", err);
      }

      const stateToSave = {
        records,
        classDays,
        studentNotes,
        excusedAbsences,
        rubricScores,
        deletedStudentNames,
        studentPhotos: syncedStudentPhotos,
        studentLevels,
        customAssignments,
        submissions,
        notifications,
        sheetUrl,
        courses,
        schedules,
        libraryResources,
        classroomMedia,
        facultyTeachers: syncedFaculty,
        payments,
        messages,
        zoomExceptionNote,
        hasZoomException,
        userCredentials
      };
      const success = await saveToSupabase(activeEmail, stateToSave);
      if (success) {
        setLastSyncedTime(new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }));
        setSyncedBannerMessage("⚡ Cloud Backup Saved: Your workspace is fully synchronized in Supabase.");
        setTimeout(() => setSyncedBannerMessage(null), 4000);
      } else {
        setCloudSyncError("Cloud save failed.");
      }
    } catch (err: any) {
      console.error("Cloud push error:", err);
      if (err.message === 'TABLE_NOT_FOUND') {
        setSupabaseTableMissing(true);
        setCloudSyncError("Supabase setup required: 'app_states' table not found.");
      } else {
        setCloudSyncError("Failed to save backup to Supabase.");
      }
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleVerifySupabase = async () => {
    setIsCloudSyncing(true);
    setCloudSyncError(null);
    setSupabaseTableMissing(false);
    const activeEmail = appUser?.email || user?.email;
    try {
      const isConnected = await testSupabaseConnection();
      if (isConnected) {
        setSupabaseTableMissing(false);
        // Table verified, let's load data
        const cloudState = await loadFromSupabase(activeEmail);
        if (cloudState) {
          if (cloudState.records !== undefined) setRecords(cloudState.records);
          if (cloudState.classDays !== undefined) setClassDays(cloudState.classDays);
          if (cloudState.studentNotes !== undefined) setStudentNotes(cloudState.studentNotes);
          if (cloudState.excusedAbsences !== undefined) setExcusedAbsences(cloudState.excusedAbsences);
          if (cloudState.rubricScores !== undefined) setRubricScores(cloudState.rubricScores);
          if (cloudState.deletedStudentNames !== undefined) {
            setDeletedStudentNames(cloudState.deletedStudentNames.filter((name: string) => {
              const lower = (name || '').toLowerCase().trim();
              return !lower.includes('colette') && !lower.includes('blackburn');
            }));
          }
          if (cloudState.studentPhotos !== undefined) setStudentPhotos(cloudState.studentPhotos);
          if (cloudState.studentLevels !== undefined) setStudentLevels(cloudState.studentLevels);
          if (cloudState.customAssignments !== undefined) setCustomAssignments(cloudState.customAssignments);
          if (cloudState.submissions !== undefined) setSubmissions(cloudState.submissions);
          if (cloudState.notifications !== undefined) CentralNotificationService.setNotifications(cloudState.notifications);
          if (cloudState.sheetUrl !== undefined) setSheetUrl(cloudState.sheetUrl);
          if (cloudState.courses !== undefined) setCourses(cloudState.courses);
          if (cloudState.schedules !== undefined) setSchedules(cloudState.schedules);
          if (cloudState.libraryResources !== undefined) setLibraryResources(cloudState.libraryResources);
          if (cloudState.classroomMedia !== undefined) setClassroomMedia(cloudState.classroomMedia);
          if (cloudState.payments !== undefined) setPayments(cloudState.payments);
          if (cloudState.zoomExceptionNote !== undefined) setZoomExceptionNote(cloudState.zoomExceptionNote);
          if (cloudState.hasZoomException !== undefined) setHasZoomException(cloudState.hasZoomException);
          
          setLastSyncedTime(new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          }));
        }
        setSyncedBannerMessage("⚡ Supabase Connected: Table verified, workspace synced successfully.");
        setTimeout(() => setSyncedBannerMessage(null), 5000);
      } else {
        setSupabaseTableMissing(true);
        setCloudSyncError("Verification failed: 'app_states' table still missing.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setCloudSyncError("Connection failed. Check your network or credentials.");
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Debounced auto-save to cloud on state changes
  useEffect(() => {
    if (isCloudSyncing) return;

    const timer = setTimeout(async () => {
      if (records.length === 0 && classDays.length === 0 && courses.length === 0 && schedules.length === 0 && libraryResources.length === 0) return;

      const activeEmail = appUser?.email || user?.email;
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
          messages,
          zoomExceptionNote,
          hasZoomException,
          userCredentials
        };
        await saveToSupabase(activeEmail, stateToSave);
        setLastSyncedTime(new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }));
      } catch (err: any) {
        console.error("Auto-sync save failed:", err);
        if (err.message === 'TABLE_NOT_FOUND') {
          setSupabaseTableMissing(true);
        }
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
    messages,
    zoomExceptionNote,
    hasZoomException,
    userCredentials,
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
    localStorage.setItem('hteim_sheet_merge_policy', sheetMergePolicy);
  }, [sheetMergePolicy]);

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
    const key = (studentName || '').toLowerCase().trim();
    setStudentNotes(prev => ({ ...prev, [key]: note }));
  };

  const handleToggleExcusedAbsence = (studentName: string, classDayId: string) => {
    const key = (studentName || '').toLowerCase().trim();
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
    if (!studentName || !studentName.trim()) return;
    const targetClean = (studentName || '').replace(/\u00A0/g, ' ').toLowerCase().trim().replace(/\s+/g, ' ');

    // 1. Add to deletedStudentNames registry
    setDeletedStudentNames(prev => {
      if (prev.some(n => (n || '').replace(/\u00A0/g, ' ').toLowerCase().trim().replace(/\s+/g, ' ') === targetClean)) {
        return prev;
      }
      return [...prev, studentName];
    });

    // Helper for exact canonical name matching
    const matchesTarget = (nameCandidate?: string | null) => {
      if (!nameCandidate) return false;
      const cleanCandidate = nameCandidate.toString().replace(/\u00A0/g, ' ').toLowerCase().trim().replace(/\s+/g, ' ');
      return cleanCandidate === targetClean;
    };

    // 2. Filter out corresponding attendance records across all class sessions
    setRecords(prev => {
      const filtered = prev.filter(r => {
        if (!r) return false;
        const rName = r.name || (r as any).studentName || '';
        return !matchesTarget(rName);
      });
      localStorage.setItem('attendanceRecords', JSON.stringify(filtered));
      return filtered;
    });

    // 3. Filter out corresponding payment/tuition fee records
    setPayments(prev => {
      const filtered = prev.filter(p => {
        if (!p) return false;
        const pName = p.studentName || '';
        return !matchesTarget(pName);
      });
      localStorage.setItem('hteim_student_payments', JSON.stringify(filtered));
      return filtered;
    });

    // 4. Filter out corresponding assignment and exam submissions
    setSubmissions(prev => {
      const filtered = prev.filter(s => {
        if (!s) return false;
        const sName = s.studentName || '';
        return !matchesTarget(sName);
      });
      return filtered;
    });

    // 5. Deselect from detail modal if currently open
    if (selectedStudent && matchesTarget(selectedStudent.name)) {
      setSelectedStudent(null);
    }

    logActivity({
      actor: appUser?.role === 'admin' ? 'Administrator' : appUser?.name || 'Staff User',
      role: 'admin',
      actionCategory: 'Student Record',
      actionTitle: 'Student & Records Purged',
      details: `Student "${studentName}" was removed from system. Attendance logs and tuition records updated across portal.`,
      targetStudent: studentName
    });
  };

  const handleRestoreStudent = (studentName: string) => {
    const lower = (studentName || '').toLowerCase().trim();
    setDeletedStudentNames(prev => prev.filter(n => (n || '').toLowerCase().trim() !== lower));
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

  const handleLoadDemo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDemoAttendance();
      if (data.length === 0) throw new Error("Demo data is empty");
      
      const headers = Object.keys(data[0]);
      const rows = data.map(item => headers.map(h => item[h]));
      
      const classDayName = 'Lesson 2 Assignment';
      setClassDays([{ id: classDayName, name: `${classDayName} (05/05/2026)` }]);

      let nameIndex = headers.findIndex(h => h && String(h || '').toLowerCase().includes('first and last name'));
      if (nameIndex === -1) nameIndex = headers.findIndex(h => h && String(h || '').toLowerCase().includes('name'));
      if (nameIndex === -1) nameIndex = 2;

      let timestampIndex = headers.findIndex(h => h && String(h || '').toLowerCase().includes('timestamp'));
      let scoreIndex = headers.findIndex(h => h && String(h || '').toLowerCase().includes('score'));
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
      let batchData: any = null;
      let docTitle = 'Google Sheet Attendance';

      if (token) {
        // 1. Authenticated Google API fetch attempt
        try {
          const metadata = await fetchSpreadsheetMetadata(spreadsheetId, token);
          docTitle = metadata.properties?.title || 'Google Sheet Attendance';
          addRecentSheet(targetUrl, docTitle);

          const allSheets = metadata.sheets.map((s: any) => s.properties.title);
          const sheets = allSheets;
          
          if (sheets.length > 0) {
            batchData = await fetchMultipleRanges(spreadsheetId, sheets, token);
          }
        } catch (authErr) {
          console.warn("Authenticated sheet fetch failed, falling back to public fetch...", authErr);
        }
      }

      // 2. Fallback or direct load for completely public Google Sheets
      if (!batchData) {
        const publicData = await fetchPublicSpreadsheetData(spreadsheetId);
        docTitle = publicData.properties?.title || 'Public Google Sheet';
        addRecentSheet(targetUrl, docTitle);
        batchData = publicData;
      }
      
      const syncedSheetTitles = new Set<string>();
      if (batchData.valueRanges) {
        batchData.valueRanges.forEach((rangeData: any, index: number) => {
          const rangeName = rangeData.range || '';
          const sheetTitle = rangeName 
            ? rangeName.split('!')[0].replace(/^'|'$/g, '') 
            : `Sheet${index + 1}`;
          syncedSheetTitles.add(sheetTitle);
        });
      }

      // Filter out existing records that correspond to these synced sheets
      const preservedRecords = records.filter(r => r && r.classDay && !syncedSheetTitles.has(r.classDay));

      const parsedSheetDataByClassDay = new Map<string, {
        displayDate: string;
        studentsCompleted: Map<string, { score: string; timestamp: string }>;
      }>();
      const allRawNames = new Set<string>();

      // Initialize all raw names with names from preserved records
      preservedRecords.forEach(r => {
        const name = (r.name || r.studentName || '').toString().trim();
        if (name && name !== 'Unknown' && !isExcludedStudent(name)) {
          allRawNames.add(name);
        }
      });

      if (batchData.valueRanges) {
        batchData.valueRanges.forEach((rangeData: any, index: number) => {
          const rangeName = rangeData.range || '';
          const sheetTitle = rangeName 
            ? rangeName.split('!')[0].replace(/^'|'$/g, '') 
            : `Sheet${index + 1}`;

          if (!rangeData.values || rangeData.values.length === 0) {
            parsedSheetDataByClassDay.set(sheetTitle, {
              displayDate: sheetTitle,
              studentsCompleted: new Map()
            });
            return;
          }

          const headers = rangeData.values[0] as string[];
          const rows = rangeData.values.slice(1) as string[][];
          
          let nameIndex = headers.findIndex(h => h && String(h || '').toLowerCase().includes('first and last name'));
          if (nameIndex === -1) nameIndex = headers.findIndex(h => h && String(h || '').toLowerCase().includes('name'));
          if (nameIndex === -1) nameIndex = 2; // fallback
          
          let timestampIndex = headers.findIndex(h => h && String(h || '').toLowerCase().includes('timestamp'));
          let scoreIndex = headers.findIndex(h => h && String(h || '').toLowerCase().includes('score'));
          if (timestampIndex === -1) timestampIndex = 0;
          if (scoreIndex === -1) scoreIndex = 1;
          
          let displayDate = sheetTitle;
          if (rows.length > 0) {
            const firstTimestamp = rows[0][timestampIndex];
            if (firstTimestamp) {
              const datePart = firstTimestamp.split(' ')[0];
              if (datePart && datePart.trim() !== '') {
                const trimmedDate = datePart.trim();
                if ((sheetTitle || '').toLowerCase().includes((trimmedDate || '').toLowerCase())) {
                  displayDate = sheetTitle;
                } else {
                  displayDate = `${sheetTitle} (${trimmedDate})`;
                }
              }
            }
          }

          const studentsCompleted = new Map<string, { score: string; timestamp: string }>();

          rows.forEach(row => {
            const rawName = row[nameIndex] || 'Unknown';
            const name = rawName.trim().replace(/[\r\n]+/g, ' ');
            if (!name || name === '' || name === 'Unknown') return;
            if (/^[\d\s\/]+$/.test(name)) return;
            if (isExcludedStudent(name)) return;

            allRawNames.add(name);

            const rowScore = row[scoreIndex] || '';
            const rowTimestamp = row[timestampIndex] || '';

            studentsCompleted.set((name || '').toLowerCase().trim(), {
              score: rowScore,
              timestamp: rowTimestamp
            });
          });

          parsedSheetDataByClassDay.set(sheetTitle, {
            displayDate,
            studentsCompleted
          });
        });
      }

      const canonicalNamesMap = getCanonicalNamesMap(Array.from(allRawNames));
      const allCanonicalStudentNames = Array.from(new Set(Array.from(allRawNames).map(n => canonicalNamesMap.get(n) || n)));

      const newSyncedRecords: AttendanceRecord[] = [];
      const updatedClassDays = [...classDays.filter(d => !syncedSheetTitles.has(d.id))];
      const conflictsList: MergeConflict[] = [];

      parsedSheetDataByClassDay.forEach((data, sheetTitle) => {
        // Skip explicitly deleted class sessions
        if (deletedClassDayIds.some(del => del && del.toLowerCase().trim() === (sheetTitle || '').toLowerCase().trim())) {
          return;
        }

        if (!updatedClassDays.some(d => d.id === sheetTitle)) {
          const existingDay = classDays.find(d => d.id === sheetTitle);
          updatedClassDays.push({ id: sheetTitle, name: existingDay ? existingDay.name : data.displayDate });
        }

        const { studentsCompleted } = data;

        allCanonicalStudentNames.forEach(studentName => {
          let completionRow: { score: string; timestamp: string } | null = null;
          for (const [rawLower, rowData] of Array.from(studentsCompleted.entries())) {
            const matchedRawName = Array.from(allRawNames).find(n => (n || '').toLowerCase().trim() === rawLower);
            if (matchedRawName) {
              const mappedCanonical = canonicalNamesMap.get(matchedRawName) || matchedRawName;
              if ((mappedCanonical || '').toLowerCase().trim() === (studentName || '').toLowerCase().trim()) {
                completionRow = rowData;
                break;
              }
            }
          }

          const existingRecord = records.find(r => r && (r.name || r.studentName || '').toLowerCase().trim() === (studentName || '').toLowerCase().trim() && r.classDay === sheetTitle);
          const hasManualOverride = existingRecord && existingRecord.manualOverride === true;
          const sheetsPresent = !!completionRow;
          const localPresent = existingRecord ? existingRecord.present : false;
          const sheetsScore = completionRow ? completionRow.score : '';
          const sheetsTimestamp = completionRow ? completionRow.timestamp : '';
          const localScore = existingRecord?.score || '';
          const localTimestamp = existingRecord?.timestamp || '';

          if (hasManualOverride && sheetsPresent !== localPresent) {
            conflictsList.push({
              studentName,
              classDay: sheetTitle,
              localStatus: localPresent ? 'present' : 'absent',
              sheetsStatus: sheetsPresent ? 'present' : 'absent',
              sheetsScore,
              sheetsTimestamp
            });
          }

          if (sheetMergePolicy === 'manual' && hasManualOverride) {
            // Prefer local manual override
            newSyncedRecords.push({
              ...existingRecord,
              score: completionRow ? completionRow.score : existingRecord.score || '',
              timestamp: completionRow ? completionRow.timestamp : existingRecord.timestamp || ''
            });
          } else {
            // Default: Sheets rules
            newSyncedRecords.push({
              name: studentName,
              timestamp: completionRow ? completionRow.timestamp : '',
              score: completionRow ? completionRow.score : '',
              classDay: sheetTitle,
              present: sheetsPresent,
              manualOverride: existingRecord ? existingRecord.manualOverride : false
            });
          }
        });
      });

      if (sheetMergePolicy === 'prompt' && conflictsList.length > 0) {
        setPendingConflicts(conflictsList);
        setPendingSyncData({
          preservedRecords,
          newSyncedRecords,
          updatedClassDays
        });
      } else {
        // Apply the synced records and class days to local state
        const finalRecords = [...preservedRecords, ...newSyncedRecords];
        setClassDays(updatedClassDays);
        setRecords(finalRecords);
        setDataSource('sheets');
        setLastSyncedTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err: any) {
      const appErr = displayErrorToUser(err, 'handleSyncWithGoogleSheets - sync sequence failure', 'network');
      setError(appErr.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveConflicts = (resolutions: Record<string, 'local' | 'sheets'>) => {
    if (!pendingSyncData) return;

    const { preservedRecords, newSyncedRecords, updatedClassDays } = pendingSyncData;

    const resolvedSyncedRecords = newSyncedRecords.map(r => {
      const key = `${r.name}||${r.classDay}`;
      if (resolutions[key] === 'local') {
        const localRecord = records.find(oldRec => 
          oldRec && 
          (oldRec.name || oldRec.studentName || '').toLowerCase().trim() === (r.name || r.studentName || '').toLowerCase().trim() && 
          oldRec.classDay === r.classDay
        );
        if (localRecord) {
          return {
            ...r,
            present: localRecord.present,
            score: localRecord.score || '',
            timestamp: localRecord.timestamp || '',
            manualOverride: true
          };
        }
      }
      return r;
    });

    const finalRecords = [...preservedRecords, ...resolvedSyncedRecords];
    setClassDays(updatedClassDays);
    setRecords(finalRecords);
    setDataSource('sheets');
    setLastSyncedTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    
    setPendingConflicts([]);
    setPendingSyncData(null);
  };

  // Auto-Sync Interval Timer
  useEffect(() => {
    if (autoSyncInterval <= 0 || dataSource !== 'sheets' || isLoading) return;

    const intervalId = setInterval(() => {
      handleLoadSheets();
    }, autoSyncInterval * 1000);

    return () => clearInterval(intervalId);
  }, [autoSyncInterval, dataSource, isLoading, sheetUrl]);

  // Tab Focus Auto-Sync
  useEffect(() => {
    if (!syncOnTabFocus || dataSource !== 'sheets') return;

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
  }, [syncOnTabFocus, dataSource, isLoading, sheetUrl]);

  // Auto-sync Google Sheets when the user loads the app or navigates to 'exams' or 'home' tab (Attendance is permanent manual)
  useEffect(() => {
    if ((activeErpTab === 'exams' || activeErpTab === 'home') && sheetUrl) {
      handleLoadSheets(undefined, sheetUrl).catch(err => {
        console.warn("Auto-sync of public sheets failed:", err);
      });
    }
  }, [activeErpTab, sheetUrl]);

  const { uniqueStudents, avgAttendance, avgScoreOverall, classDayStats } = useMemo(() => {
    const recordNames = records.filter(r => r && (r.name || r.studentName)).map(r => (r.name || r.studentName || '').toString().trim());
    const paymentNames = payments.filter(p => p && p.studentName).map(p => p.studentName.trim());
    const userNames = userCredentials.filter(c => c && c.name && c.role === 'student').map(c => c.name.trim());

    const combinedRawNames = Array.from(new Set([...recordNames, ...paymentNames, ...userNames]))
      .filter((name: string) => name && !isExcludedStudent(name));

    const canonicalNames = getCanonicalNamesMap(combinedRawNames);

    const studentMap = new Map<string, StudentSummary>();

    // Seed every student into the map so ALL students are permanently present in Attendance
    combinedRawNames.forEach(rawName => {
      const canonicalName = canonicalNames.get(rawName) || rawName;
      const key = (canonicalName || '').toLowerCase().trim();

      if (!deletedStudentNames.some(d => (d || '').toLowerCase().trim() === key)) {
        if (!studentMap.has(key)) {
          studentMap.set(key, { 
            name: canonicalName, 
            attendanceByDay: {}, 
            rate: 0, 
            attended: 0,
            totalDays: 0,
            avgScore: null,
            note: studentNotes[key] || '',
            levelId: studentLevels[key] || getDefaultLevelForStudent(canonicalName, 0)
          });
        }
      }
    });

    records.forEach(r => {
      if (!r) return;
      const recName = (r.name || r.studentName || '').toString().trim();
      if (!recName) return;
      const canonicalName = canonicalNames.get(recName) || recName;
      const key = (canonicalName || '').toLowerCase().trim();

      if (studentMap.has(key)) {
        const student = studentMap.get(key)!;
        student.attendanceByDay[r.classDay] = {
          present: r.present === true,
          timestamp: r.timestamp,
          score: r.score
        };
      }
    });
    
    const totalClasses = classDays.length;
    let totalRates = 0;
    let totalScoresSum = 0;
    let studentsWithScoresCount = 0;

    const students: StudentSummary[] = Array.from(studentMap.values()).map((student, idx) => {
      const attended = Object.values(student.attendanceByDay).filter(att => att && att.present).length;
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
        const subName = (sub?.studentName || '').toLowerCase().trim();
        const stName = (student?.name || '').toLowerCase().trim();
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

      const key = (student?.name || '').toLowerCase().trim();
      const note = studentNotes[key] || '';
      const photoUrl = studentPhotos[key] || '';
      const levelId = studentLevels[key] || getDefaultLevelForStudent(student?.name || '', idx);

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

  // Synchronize credentials database when student directory is loaded/updated
  useEffect(() => {
    const studentNames = uniqueStudents ? uniqueStudents.map(s => s.name) : [];
    const studentEmailMap: Record<string, string> = {};
    if (uniqueStudents) {
      uniqueStudents.forEach(st => {
        if (st && st.name) {
          const key = st.name.toLowerCase().trim();
          if (st.email && st.email.trim()) {
            studentEmailMap[key] = st.email.trim();
          }
        }
      });
    }
    const { updatedCredentials, changed } = ensureUserCredentials(userCredentials, studentNames, facultyTeachers, studentEmailMap);
    if (changed) {
      setUserCredentials(updatedCredentials);
      try {
        localStorage.setItem('hteim_user_credentials', JSON.stringify(updatedCredentials));
      } catch (e) {}
    }
  }, [uniqueStudents, facultyTeachers, userCredentials]);

  // Find current student stats if a student is logged in
  const loggedInStudentData = useMemo(() => {
    if (appUser && appUser.role === 'student') {
      const rawName = appUser.studentName || appUser.name || '';
      const studentNameLower = (rawName || '').toLowerCase().trim();
      return uniqueStudents.find(st => st && st.name && (st?.name || '').toLowerCase().trim() === studentNameLower);
    }
    return null;
  }, [appUser, uniqueStudents]);

  const currentStudentPortalData = useMemo(() => {
    const sName = appUser?.studentName || appUser?.name || 'Student';
    if (loggedInStudentData) {
      return {
        name: loggedInStudentData.name,
        rate: loggedInStudentData.rate,
        attended: loggedInStudentData.attended,
        totalDays: loggedInStudentData.totalDays,
        avgScore: loggedInStudentData.avgScore,
        attendanceByDay: loggedInStudentData.attendanceByDay,
        note: loggedInStudentData.note,
        photoUrl: studentPhotos[(sName || '').toLowerCase().trim()] || loggedInStudentData.photoUrl
      };
    }
    return {
      name: sName,
      rate: 100,
      attended: classDays.length,
      totalDays: classDays.length || 1,
      avgScore: 95,
      attendanceByDay: {},
      photoUrl: studentPhotos[(sName || '').toLowerCase().trim()] || ''
    };
  }, [appUser, loggedInStudentData, studentPhotos, classDays.length]);

  const uncollectedTuitionAmount = useMemo(() => {
    return payments.reduce((sum, p) => sum + Math.max(0, (p.totalTuition || 0) - (p.amountPaid || 0)), 0);
  }, [payments]);

  const pendingAssignmentsCount = useMemo(() => {
    if (appUser?.role === 'student') {
      const studentNameLower = (appUser.studentName || appUser.name || '').toLowerCase().trim();
      const submittedIds = new Set(
        submissions
          .filter(s => s.studentName && (s?.studentName || '').toLowerCase().trim() === studentNameLower)
          .map(s => s.assignmentId)
      );
      return customAssignments.filter(a => !submittedIds.has(a.id)).length;
    }
    const unGraded = submissions.filter(s => s.status === 'Submitted' || s.status === 'Pending Review').length;
    return unGraded > 0 ? unGraded : customAssignments.length;
  }, [appUser, submissions, customAssignments]);

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

  const handleToggleStudentAttendance = (studentName: string, classDayId: string, newStatus: 'present' | 'absent' | 'excused' | 'unmarked') => {
    if (!studentName || !classDayId) return;
    const studentKey = (studentName || '').toLowerCase().trim();
    const day = classDays.find(d => d.id === classDayId || d.name === classDayId);
    const dayName = day ? day.name : classDayId;

    // Check 24-hour fraud-prevention lock
    const existingRecord = records.find(r => r && (r.studentName || r.name) && (r?.studentName || r?.name || '').toLowerCase().trim() === studentKey && r.classDay === classDayId);
    const lockInfo = getAttendanceLockInfo(existingRecord, day || classDayId);

    if (lockInfo.isLocked) {
      const lockMsg = `🔒 Attendance Locked: Attendance for "${studentName}" in "${dayName}" was captured on ${lockInfo.capturedDate ? lockInfo.capturedDate.toLocaleString() : 'a previous session'} (>24 hours ago) and is permanently locked to prevent fraud. Changes are only permitted within 24 hours of capture.`;
      setError(lockMsg);
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
      logActivity({
        actor: appUser?.name || 'User',
        role: appUser?.role === 'student' ? 'student' : 'admin',
        actionCategory: 'Attendance Override',
        actionTitle: 'Locked Record Edit Blocked',
        details: `Prevented modification of 24h locked attendance for ${studentName} (${dayName}).`
      });
      return;
    }

    // Clear error
    setError(null);

    // 1. Update excused absences
    setExcusedAbsences(prev => {
      const copy = { ...prev };
      const studentMap = { ...(copy[studentKey] || {}) };
      if (newStatus === 'excused') {
        studentMap[classDayId] = true;
      } else {
        delete studentMap[classDayId];
      }
      copy[studentKey] = studentMap;
      return copy;
    });

    // 2. Update or delete attendance records
    const nowIso = new Date().toISOString();
    setRecords(prev => {
      const updated = [...prev];
      const existingIdx = updated.findIndex(r => r && (r.studentName || r.name) && (r?.studentName || r?.name || '').toLowerCase().trim() === studentKey && r.classDay === classDayId);

      if (newStatus === 'unmarked') {
        if (existingIdx >= 0) {
          updated.splice(existingIdx, 1);
        }
      } else if (newStatus === 'present') {
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            present: true,
            manualOverride: true,
            timestamp: nowIso,
            capturedAt: updated[existingIdx].capturedAt || nowIso
          };
        } else {
          updated.push({
            studentName: studentName,
            name: studentName,
            classDay: classDayId,
            present: true,
            score: '',
            timestamp: nowIso,
            capturedAt: nowIso,
            manualOverride: true
          });
        }
      } else {
        // absent or excused
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            present: false,
            manualOverride: true,
            timestamp: nowIso,
            capturedAt: updated[existingIdx].capturedAt || nowIso
          };
        } else {
          updated.push({
            studentName: studentName,
            name: studentName,
            classDay: classDayId,
            present: false,
            score: '',
            timestamp: nowIso,
            capturedAt: nowIso,
            manualOverride: true
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

  const handleRecordBatchAttendance = (newRecords: AttendanceRecord[]) => {
    const nowIso = new Date().toISOString();
    let lockedCount = 0;
    setRecords(prev => {
      let updated = [...prev];
      newRecords.forEach(newRec => {
        const studentKey = (newRec.name || newRec.studentName || '').toLowerCase().trim();
        const existingIdx = updated.findIndex(r => r && (r.studentName || r.name || '').toLowerCase().trim() === studentKey && r.classDay === newRec.classDay);
        if (existingIdx >= 0) {
          if (isAttendanceLocked(updated[existingIdx], newRec.classDay)) {
            lockedCount++;
            return;
          }
          updated[existingIdx] = {
            ...updated[existingIdx],
            present: newRec.present,
            manualOverride: true,
            timestamp: newRec.timestamp || nowIso,
            capturedAt: updated[existingIdx].capturedAt || nowIso
          };
        } else {
          updated.push({
            ...newRec,
            capturedAt: newRec.capturedAt || nowIso,
            timestamp: newRec.timestamp || nowIso
          });
        }
      });
      return updated;
    });
    
    if (lockedCount > 0) {
      setError(`Notice: ${lockedCount} student record(s) are locked (>24h old) and were preserved.`);
    }

    logActivity({
      actor: appUser?.name || 'Admin',
      role: appUser?.role === 'student' ? 'student' : 'admin',
      actionCategory: 'Attendance Override',
      actionTitle: 'Batch Zoom Attendance Registered',
      details: `Registered Zoom attendance for ${newRecords.length} students (${lockedCount} locked records preserved)`
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

  const handleDeleteClassDay = (dayId: string, skipConfirm = false) => {
    if (!dayId) return;
    const targetKey = dayId.trim();
    const day = classDays.find(d => 
      d.id === targetKey || 
      (d?.id || '').toLowerCase().trim() === (targetKey || '').toLowerCase() ||
      (d?.name || '').toLowerCase().trim() === (targetKey || '').toLowerCase()
    );
    const dayName = day ? day.name : targetKey;
    const dayActualId = day ? day.id : targetKey;

    let confirmed = skipConfirm;
    if (!confirmed) {
      try {
        if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
          confirmed = window.confirm(`Are you sure you want to delete class session "${dayName}"?\n\nThis will also permanently delete all student attendance records associated with this session.`);
        } else {
          confirmed = true;
        }
      } catch (e) {
        confirmed = true;
      }
    }

    if (confirmed) {
      const updatedDays = classDays.filter(d => 
        d.id !== dayActualId && 
        (d?.id || '').toLowerCase().trim() !== (targetKey || '').toLowerCase() &&
        (d?.name || '').toLowerCase().trim() !== (targetKey || '').toLowerCase()
      );
      setClassDays(updatedDays);
      localStorage.setItem('classDays', JSON.stringify(updatedDays));

      // Track deleted day ID so auto sync won't recreate it
      setDeletedClassDayIds(prev => {
        const next = Array.from(new Set([...prev, dayActualId, targetKey, dayName]));
        localStorage.setItem('deletedClassDayIds', JSON.stringify(next));
        return next;
      });
      
      // Remove all attendance records for this deleted day
      setRecords(prev => {
        const filtered = prev.filter(r => 
          r.classDay !== dayActualId && 
          r.classDay !== targetKey &&
          (r.classDay || '').toLowerCase().trim() !== (targetKey || '').toLowerCase()
        );
        localStorage.setItem('attendanceRecords', JSON.stringify(filtered));
        return filtered;
      });
      
      // Clean up excused absences map for this day
      setExcusedAbsences(prev => {
        const copy = { ...prev };
        Object.keys(copy).forEach(k => {
          if (copy[k]) {
            delete copy[k][dayActualId];
            delete copy[k][targetKey];
          }
        });
        return copy;
      });

      if (liveCheckinDayId === dayActualId || liveCheckinDayId === targetKey) {
        setLiveCheckinDayId(updatedDays.length > 0 ? updatedDays[0].id : '');
      }
      
      logActivity({
        actor: appUser?.name || 'Admin',
        role: appUser?.role === 'student' ? 'student' : 'admin',
        actionCategory: 'Attendance Override',
        actionTitle: 'Class Session Deleted',
        details: `Deleted class session "${dayName}" and purged all associated attendance records.`
      });
    }
  };

  const handleClearClassDayRecords = (dayId: string, skipConfirm = false) => {
    if (!dayId) return;
    const targetKey = dayId.trim();
    const day = classDays.find(d => 
      d.id === targetKey || 
      (d?.id || '').toLowerCase().trim() === (targetKey || '').toLowerCase() ||
      (d?.name || '').toLowerCase().trim() === (targetKey || '').toLowerCase()
    );
    const dayName = day ? day.name : targetKey;
    const dayActualId = day ? day.id : targetKey;

    // Check if records for this day are locked (> 24 hours)
    const dayRecords = records.filter(r => 
      r.classDay === dayActualId || 
      r.classDay === targetKey ||
      (r.classDay || '').toLowerCase().trim() === (targetKey || '').toLowerCase()
    );
    const lockedRecords = dayRecords.filter(r => isAttendanceLocked(r, day || dayActualId));

    if (dayRecords.length > 0 && lockedRecords.length === dayRecords.length) {
      setError(`🔒 Class Session Locked: All ${dayRecords.length} attendance records for "${dayName}" were captured over 24 hours ago and are permanently locked against clearing to prevent fraud.`);
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
      return;
    }

    let confirmed = skipConfirm;
    if (!confirmed) {
      try {
        const warning = lockedRecords.length > 0 
          ? `Clear active (unlocked) attendance records for "${dayName}"?\n\nNote: ${lockedRecords.length} locked record(s) captured > 24hrs ago will be protected and preserved to prevent fraud.`
          : `Are you sure you want to clear ALL attendance records for "${dayName}"?\n\nThe class session will remain active, but all present/absent logs for this day will be reset.`;
        confirmed = window.confirm(warning);
      } catch (e) {
        confirmed = true;
      }
    }

    if (confirmed) {
      setRecords(prev => prev.filter(r => {
        const isThisDay = r.classDay === dayActualId || 
          r.classDay === targetKey ||
          (r.classDay || '').toLowerCase().trim() === (targetKey || '').toLowerCase();
        if (!isThisDay) return true;
        // Keep locked records!
        return isAttendanceLocked(r, day || dayActualId);
      }));
      setExcusedAbsences(prev => {
        const copy = { ...prev };
        Object.keys(copy).forEach(k => {
          if (copy[k]) {
            delete copy[k][dayActualId];
            delete copy[k][targetKey];
          }
        });
        return copy;
      });
      logActivity({
        actor: appUser?.name || 'Admin',
        role: appUser?.role === 'student' ? 'student' : 'admin',
        actionCategory: 'Attendance Override',
        actionTitle: 'Class Records Cleared',
        details: `Cleared active attendance records for class session "${dayName}" (${lockedRecords.length} locked records preserved).`
      });
    }
  };

  const handleClearStudentAttendanceRecords = (studentName: string, skipConfirm = false) => {
    if (!studentName) return;
    const studentKey = (studentName || '').toLowerCase().trim();

    const studentRecords = records.filter(r => (r.studentName || r.name || '').toLowerCase().trim() === studentKey);
    const lockedRecords = studentRecords.filter(r => isAttendanceLocked(r, classDays.find(d => d.id === r.classDay)));

    if (studentRecords.length > 0 && lockedRecords.length === studentRecords.length) {
      setError(`🔒 Student Records Locked: All attendance records for "${studentName}" were captured over 24 hours ago and are permanently locked to prevent fraud.`);
      return;
    }

    let confirmed = skipConfirm;
    if (!confirmed) {
      try {
        const warning = lockedRecords.length > 0 
          ? `Delete active attendance records for "${studentName}"?\n\nNote: ${lockedRecords.length} locked record(s) captured > 24hrs ago will be protected and preserved.`
          : `Are you sure you want to delete all attendance records for "${studentName}"?`;
        confirmed = window.confirm(warning);
      } catch (e) {
        confirmed = true;
      }
    }

    if (confirmed) {
      setRecords(prev => prev.filter(r => {
        const isThisStudent = (r.studentName || r.name || '').toLowerCase().trim() === studentKey;
        if (!isThisStudent) return true;
        return isAttendanceLocked(r, classDays.find(d => d.id === r.classDay));
      }));
      setExcusedAbsences(prev => {
        const copy = { ...prev };
        delete copy[studentKey];
        return copy;
      });
      logActivity({
        actor: appUser?.name || 'Admin',
        role: appUser?.role === 'student' ? 'student' : 'admin',
        actionCategory: 'Attendance Override',
        actionTitle: 'Student Attendance Cleared',
        details: `Cleared active attendance records for student "${studentName}" (${lockedRecords.length} locked records preserved).`
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
          if (!(student?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())) {
            return false;
          }
        }
        if (statusFilter === 'at_risk' && student.rate >= atRiskThreshold) return false;
        if (statusFilter === 'moderate' && (student.rate < atRiskThreshold || student.rate >= satisfactoryThreshold)) return false;
        if (statusFilter === 'perfect' && student.rate < satisfactoryThreshold) return false;
        if (statusFilter === 'fifty_percent' && student.rate > 50) return false;
        if (statusFilter === 'honor_roll') {
          const isHonor = student.rate >= 100 || (student.avgScore !== null && student.avgScore >= 85);
          if (!isHonor) return false;
        }
        if (statusFilter === 'unpaid') {
          const pDetails = getStudentPaymentDetails(student.name);
          if (!pDetails.hasOutstanding) return false;
        }

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
    <>
      <AnimatePresence>
        {showIntro && (
          <IntroSplashScreen
            onComplete={() => {
              setShowIntro(false);
              sessionStorage.setItem('hteim_intro_shown', 'true');
            }}
          />
        )}
      </AnimatePresence>

      <a href="#main-workspace" className="md-skip-link">Skip to main content</a>
      <div className="flex flex-col min-h-screen w-full app-ambient-shell text-slate-900 dark:text-slate-100 font-sans p-2.5 sm:p-5 md:p-6 pb-mobile-nav md:pb-6 touch-pan-y select-text">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs px-4 py-2.5 rounded-2xl mb-3 flex items-center justify-between shadow-sm animate-fade-slide-up flex-shrink-0" role="status" aria-live="polite">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600" />
            <span className="font-medium">Working offline — changes are saved locally and will sync when connection restores.</span>
          </div>
          <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-semibold">PWA Ready</span>
        </div>
      )}



      {cloudSyncError && !isOffline && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-2.5 rounded-2xl mb-3 flex flex-wrap items-center justify-between gap-3 shadow-sm" role="alert">
          <div className="flex items-center gap-2 min-w-0">
            <CloudOff className="w-4 h-4 shrink-0 text-red-600" aria-hidden="true" />
            <span className="font-medium">{cloudSyncError}</span>
          </div>
          <button
            type="button"
            onClick={() => { trackUxEvent('sync_retry_requested', { role: appUser?.role || 'guest' }); handlePushToCloud(); }}
            disabled={isCloudSyncing}
            className="md-btn-tonal text-xs px-3 py-1.5 shrink-0"
          >
            {isCloudSyncing ? 'Retrying…' : 'Retry sync'}
          </button>
        </div>
      )}

      {pendingConflicts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 text-orange-900 text-xs px-4 py-2.5 rounded-2xl mb-3 flex flex-wrap items-center justify-between gap-3 shadow-sm" role="alert">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-orange-600" aria-hidden="true" />
            <span className="font-medium">{pendingConflicts.length} attendance sync conflict{pendingConflicts.length === 1 ? '' : 's'} need review.</span>
          </div>
          <button type="button" onClick={() => handleNavigate('attendance')} className="md-btn-tonal text-xs px-3 py-1.5 shrink-0">Review conflicts</button>
        </div>
      )}

      {supabaseTableMissing && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-3 text-slate-800 animate-fade-slide-up flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 text-red-700 rounded-xl shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="font-semibold text-sm text-red-900">Supabase Table Setup Required</h4>
              <p className="text-xs text-red-700">
                The <code className="bg-red-100 px-1.5 rounded font-mono">app_states</code> table doesn't exist in your Supabase database yet.
              </p>
              <div className="bg-slate-900 text-slate-100 p-3 rounded-xl text-xs font-mono select-all max-h-40 overflow-y-auto custom-scrollbar">
                {`create table if not exists app_states (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by text
);
alter table app_states enable row level security;
create policy "Allow public read access" on app_states for select using (true);
create policy "Allow public insert" on app_states for insert with check (true);
create policy "Allow public update" on app_states for update using (true) with check (true);`}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <p className="text-xs text-red-700">Open Supabase Dashboard → SQL Editor, paste and click Run.</p>
                <button
                  onClick={async () => {
                    try {
                      await loadDirectFromSupabase(user?.email);
                      setSupabaseTableMissing(false);
                      setSyncedBannerMessage("✅ Supabase table verified — workspace synced.");
                      setTimeout(() => setSyncedBannerMessage(null), 4000);
                    } catch (e) {
                      console.log("Still table missing:", e);
                    }
                  }}
                  className="ml-auto md-btn-filled text-xs px-3 py-1.5"
                  style={{ background: '#dc2626' }}
                >
                  Verify Setup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {syncedBannerMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs px-4 py-2.5 rounded-2xl mb-3 flex items-center justify-between shadow-sm animate-fade-slide-up flex-shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{syncedBannerMessage}</span>
          </div>
          <button onClick={() => setSyncedBannerMessage(null)} className="md-icon-btn w-6 h-6">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* PWA Install Banner */}
      {pwaHook.isInstallable && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs px-4 py-2.5 rounded-2xl mb-3 flex items-center justify-between gap-3 shadow-sm animate-fade-slide-up flex-shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate font-medium">Install HTEIM as a standalone app for quick access.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => pwaHook.triggerInstall()}
              className="md-btn-filled text-xs px-3 py-1.5"
            >
              Install
            </button>
            <button
              onClick={() => setShowMobileDownloadModal(true)}
              className="md-btn-tonal text-xs px-3 py-1.5"
            >
              APK
            </button>
          </div>
        </div>
      )}

      {/* MD3 AppBar */}
      <header className="relative bg-white/85 dark:bg-[#08182c]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-[#1a385c] px-3 sm:px-4 py-2 sm:py-2.5 shadow-xs mb-3 flex-shrink-0 sticky top-2 z-40 max-w-full overflow-visible transition-all rounded-2xl">
        {/* Subtle Brand Accent Line (HTEIM Royal Navy & Ministry Gold) */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-[#023264]/0 via-[#025798]/60 via-[#b38f53]/70 to-[#0277b8]/0 pointer-events-none" />
        <div className="flex items-center justify-between gap-2 sm:gap-3 flex-nowrap">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 shrink group" onClick={() => setActiveErpTab('home')}>
            <LogoImage
              alt="HTEIM Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl object-contain bg-transparent p-0 group-hover:opacity-80 transition-opacity"
            />
            <div className="min-w-0 shrink flex items-center gap-2">
              <h1 className="text-xs sm:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[140px] xs:max-w-[200px] sm:max-w-[280px]">
                HTEIM School of Ministry
              </h1>
              <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#0e2540] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1a385c]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#01883c] animate-pulse"></span>
                Spring 2026 • Term 2
              </span>
            </div>
          </div>

          {/* MD3 AppBar Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 ml-auto shrink-0 flex-nowrap justify-end">
            {/* Only show Messages and Notifications when user is logged in */}
            {appUser && (
              <>
                {/* Messages */}
                <button
                  type="button"
                  onClick={() => handleNavigate('messages')}
                  aria-label="Open messages"
                  className="relative p-2 rounded-lg transition-colors cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                  title="Messages"
                >
                  <MessageSquare className="w-4 h-4" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-bold flex items-center justify-center px-1">
                      {unreadMessagesCount}
                    </span>
                  )}
                </button>

                {/* Notifications */}
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
              </>
            )}

            {/* More Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 rounded-lg transition-colors cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                aria-label="More actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 z-40 space-y-0.5"
                  style={{ boxShadow: 'var(--md-elev-2)' }}>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => { setShowMoreMenu(false); setShowIntro(true); }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Play Intro (6s)</span>
                    </button>
                    <button
                      onClick={() => { setShowMoreMenu(false); setShowPresentationModal(true); }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Play className="w-3.5 h-3.5 text-slate-500" />
                      <span>30s Demo</span>
                    </button>
                    <button
                      onClick={() => { setShowMoreMenu(false); setShowCommandPalette(true); }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Search className="w-3.5 h-3.5 text-slate-500" />
                      <span>Search</span>
                      <span className="ml-auto text-[10px] text-slate-400 font-mono">⌘K</span>
                    </button>
                  </div>

                  {appUser?.role === 'admin' && (
                    <div className="space-y-0.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 pt-1">Tools</p>
                      <button
                        onClick={() => { setShowMoreMenu(false); handlePushToCloud(); }}
                        disabled={isCloudSyncing}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isCloudSyncing ? <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin" /> : <Cloud className="w-3.5 h-3.5 text-slate-500" />}
                        <span>Cloud Backup</span>
                      </button>
                      {dataSource === 'sheets' && (
                        <button
                          onClick={() => { setShowMoreMenu(false); handleLoadSheets(); }}
                          disabled={isLoading}
                          className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                          <span>Sync Sheets</span>
                        </button>
                      )}
                      <button
                        onClick={() => { setShowMoreMenu(false); setShowBatchBroadcastModal(true); }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Radio className="w-3.5 h-3.5 text-slate-500" />
                        <span>Broadcast</span>
                      </button>
                      <button
                        onClick={() => { setShowMoreMenu(false); setShowAdminAuditModal(true); }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>Audit Log</span>
                      </button>
                      <button
                        onClick={() => { setShowMoreMenu(false); setShowUserManagementModal(true); }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>Manage Users</span>
                      </button>
                    </div>
                  )}

                  <div className="space-y-0.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    {appUser?.role === 'admin' ? (
                      <button
                        onClick={() => { setShowMoreMenu(false); setShowSettingsModal(true); }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        <span>Settings</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60"
                        title="Settings can only be changed by Administrator"
                      >
                        <div className="flex items-center gap-2.5">
                          <Settings className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                          <span>Settings</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">Admin Only</span>
                      </button>
                    )}
                    <button
                      onClick={() => { setShowMoreMenu(false); setShowGuideModal(true); }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Help</span>
                    </button>
                  </div>

                  <div className="space-y-0.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => { setShowMoreMenu(false); setShowRoleMenu(true); }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                      <span>Switch Role</span>
                    </button>
                    {appUser && (
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          handleAppLogout();
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar / Sign In */}
            {appUser ? (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 sm:gap-2 p-1 pr-2 sm:pr-2.5 rounded-full transition-all cursor-pointer shrink-0 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0e2540] border border-slate-200/80 dark:border-[#1a385c]"
                aria-label={`Account: ${appUser.name}`}
                title="Account & Role Settings"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ${
                  appUser?.role === 'admin' ? 'bg-[#023264] text-white dark:bg-[#dceaf8] dark:text-[#023264]' :
                  appUser?.role === 'teacher' ? 'bg-[#01883c] text-white dark:bg-[#d1fae5] dark:text-[#01883c]' :
                  'bg-[#b38f53] text-white dark:bg-[#fef3c7] dark:text-[#8c6a32]'
                }`}>
                  {appUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden xl:flex flex-col text-left leading-none pr-0.5">
                  <span className="text-xs font-bold truncate max-w-[100px]">
                    {appUser.name.split(' ')[0]}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${
                    appUser?.role === 'admin' ? 'text-[#025798] dark:text-[#7dd3fc]' :
                    appUser?.role === 'teacher' ? 'text-[#01883c] dark:text-[#4ade80]' :
                    appUser?.role === 'student' ? 'text-[#b38f53] dark:text-[#dfc18b]' :
                    'text-slate-400'
                  }`}>
                    {appUser?.role}
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 bg-[#023264] hover:bg-[#025798] text-white font-bold text-xs shadow-xs whitespace-nowrap border border-[#b38f53]/30"
                aria-label="Sign In to Portal"
                title="Sign in to Student or Faculty Portal"
              >
                <Lock className="w-3.5 h-3.5 shrink-0 text-[#dfc18b]" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      {appUser && (
        <nav aria-label="Primary portal navigation" className="hidden md:block sticky top-[64px] sm:top-[70px] z-30 mb-4 py-0.5 pointer-events-auto">
          <div className="flex items-center gap-0.5 p-1 bg-slate-100/95 dark:bg-[#08182c]/95 backdrop-blur-md rounded-xl w-fit shadow-xs border border-slate-200/60 dark:border-[#1a385c]">
            {[
              { tab: 'home', label: 'Home', Icon: Sparkles },
              { tab: 'attendance', label: 'Attendance', Icon: UserCheck },
              { tab: 'students', label: 'Students', Icon: GraduationCap, adminOnly: true },
              { tab: 'courses', label: 'Courses', Icon: BookOpen },
              { tab: 'exams', label: 'Exams', Icon: Award },
              { tab: 'schedule', label: 'Schedule', Icon: Calendar },
              { tab: 'library', label: 'Library', Icon: Bookmark },
              { tab: 'payments', label: 'Payments', Icon: DollarSign, paymentOnly: true },
              { tab: 'messages', label: 'Messages', Icon: MessageSquare, badgeAlert: unreadMessagesCount > 0, badgeCount: unreadMessagesCount },
              { tab: 'reports', label: 'Reports', Icon: FileText, adminOrTeacherOnly: true },
            ].filter(item => {
              if ((item as any).adminOnly && appUser?.role === 'student') return false;
              if ((item as any).adminOrTeacherOnly && appUser?.role === 'student') return false;
              if ((item as any).paymentOnly && appUser?.role === 'teacher') return false;
              return true;
            }).map(({ tab, label, Icon, badgeAlert, badgeCount }: any) => {
              const isActive = activeErpTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleNavigate(tab as TabType)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-white dark:bg-[#0e2540] text-[#023264] dark:text-white shadow-sm font-bold border border-[#025798]/20 dark:border-[#0277b8]/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#023264] dark:hover:text-white hover:bg-white/50 dark:hover:bg-[#0e2540]/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#025798] dark:text-[#7dd3fc]' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="hidden lg:inline">{label}</span>
                  {badgeAlert && (
                    <span className={`text-[10px] min-w-4 h-4 px-1 rounded-full font-bold flex items-center justify-center ${
                      isActive 
                        ? 'bg-[#023264] dark:bg-[#dfc18b] text-white dark:text-[#023264]' 
                        : 'bg-[#b38f53] text-white animate-pulse'
                    }`}>
                      {badgeCount || '•'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Horizontal Gradient Divider Delineating Navigation from Main Workspace */}
      <div 
        aria-hidden="true" 
        className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700/80 to-transparent my-3.5 shrink-0 opacity-90" 
      />

      {/* Main Workspace */}
      <main id="main-workspace" tabIndex={-1} className="flex flex-col flex-1 gap-6 relative touch-pan-y min-h-[calc(100vh-220px)] sm:min-h-[calc(100vh-240px)]">
        <AnimatePresence mode="wait">
          {activeErpTab === 'home' && (
            <motion.div
              key="home"
              variants={pageFadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageFadeTransition}
              className="flex-1 touch-pan-y w-full"
            >
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
                <ErrorBoundary label="Home Tab">
                  <LazyHomeTab
                    onNavigate={handleNavigate}
                    appUser={appUser}
                    onOpenLogin={() => setShowLoginModal(true)}
                    onLogout={handleAppLogout}
                    onOpenPresentationDemo={() => setShowPresentationModal(true)}
                    studentsCount={uniqueStudents.length}
                    students={uniqueStudents}
                    payments={payments}
                    classDays={classDays}
                    records={records}
                    coursesCount={courses.length || 6}
                    classDaysCount={classDays.length}
                    avgAttendanceRate={avgAttendance}
                    onPlayIntro={() => setShowIntro(true)}
                    pendingAssignmentsCount={pendingAssignmentsCount}
                    uncollectedTuitionAmount={uncollectedTuitionAmount}
                    libraryResourcesCount={libraryResources.length}
                    nextClassTitle={classDays.length > 0 ? classDays[classDays.length - 1].name : 'Session 1'}
                    isCloudSyncing={isCloudSyncing}
                    cloudSyncError={cloudSyncError}
                    lastSyncedTime={lastSyncedTime}
                    onPushToCloud={handlePushToCloud}
                    userEmail={user?.email}
                    supabaseTableMissing={supabaseTableMissing}
                    onVerifySetup={handleVerifySupabase}
                    atRiskThreshold={atRiskThreshold}
                    customAssignments={customAssignments}
                    submissions={submissions}
                    facultyTeachers={facultyTeachers}
                    onSaveFacultyTeachers={handleSaveFacultyTeachers}
                    onTakeQuiz={(quiz) => {
                      setActiveErpTab('exams');
                    }}
                  />
                </ErrorBoundary>
            </Suspense>
            </motion.div>
          )}

          {/* Render Non-Attendance ERP Tabs */}
          {activeErpTab === 'students' && appUser?.role !== 'student' && (
            <motion.div
              key="students"
              variants={pageFadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageFadeTransition}
              className="flex-1 w-full"
            >
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
                <ErrorBoundary label="Students Tab">
                  <LazyStudentsTab
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
                    const updated = { ...prev, [(name || '').toLowerCase().trim()]: note };
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
                onToggleAttendance={handleToggleStudentAttendance}
                excusedAbsences={excusedAbsences}
                appRole={appUser?.role}
                  onResetPassword={handleResetStudentPassword}
                />
              </ErrorBoundary>
            </Suspense>
            </motion.div>
          )}

          {activeErpTab === 'courses' && (
            <motion.div
              key="courses"
              variants={pageFadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageFadeTransition}
              className="flex-1 w-full"
            >
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
                <ErrorBoundary label="Courses Tab">
                  <LazyCoursesTab
                userRole={appUser?.role} 
                courses={courses}
                  setCourses={setCourses}
                />
              </ErrorBoundary>
            </Suspense>
            </motion.div>
          )}

          {activeErpTab === 'exams' && (
            <motion.div
              key="exams"
              variants={pageFadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageFadeTransition}
              className="flex-1 w-full"
            >
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
                <ErrorBoundary label="Exams Tab">
                  <LazyExamsTab
                students={uniqueStudents.map(s => {
                  const rawRec = records.find(r => r && (r.name || r.studentName || '').toLowerCase().trim() === (s.name || '').toLowerCase().trim() && r.score);
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
                onNotificationCreated={(notif) => CentralNotificationService.setNotifications([notif as any, ...CentralNotificationService.getNotifications()])}
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
                lastSyncedTime={lastSyncedTime}
                recentSheets={recentSheets}
                  onRemoveRecentSheet={handleRemoveRecentSheet}
                />
              </ErrorBoundary>
            </Suspense>
            </motion.div>
          )}

          {activeErpTab === 'schedule' && (
            <motion.div
              key="schedule"
              variants={pageFadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageFadeTransition}
              className="flex-1 w-full"
            >
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
                <ErrorBoundary label="Schedule Tab">
                  <LazyScheduleTab
                classDays={classDays}
                userRole={appUser?.role}
                onDeleteClassDay={handleDeleteClassDay}
                onClearClassDayRecords={handleClearClassDayRecords}
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
              </ErrorBoundary>
            </Suspense>
            </motion.div>
          )}

          {activeErpTab === 'library' && (
            <motion.div
              key="library"
              variants={pageFadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageFadeTransition}
              className="flex-1 w-full"
            >
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
                <ErrorBoundary label="Library Tab">
                  <LazyLibraryTab
                userRole={appUser?.role} 
                resources={libraryResources}
                setResources={setLibraryResources}
                classroomMedia={classroomMedia}
                setClassroomMedia={setClassroomMedia}
                  onOpenDiagnostics={appUser?.role === 'admin' ? () => setShowDiagnosticModal(true) : undefined}
                />
              </ErrorBoundary>
            </Suspense>
            </motion.div>
          )}

          {activeErpTab === 'payments' && (appUser?.role === 'admin' || appUser?.role === 'student') && (
            <motion.div
              key="payments"
              variants={pageFadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageFadeTransition}
              className="flex-1 w-full"
            >
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
                <ErrorBoundary label="Payments Tab">
                  <LazyPaymentTab
                availableStudents={uniqueStudents.map(s => ({ name: s.name || '', email: `${(s.name || '').toLowerCase().replace(/\s+/g, '.')}@hteim.edu` }))}
                isAdmin={appUser?.role === 'admin'}
                userRole={appUser?.role}
                currentStudentName={appUser?.studentName || appUser?.name}
                payments={payments}
                setPayments={setPayments}
                onDeleteStudent={handleDeleteStudent}
                  onRestoreStudent={handleRestoreStudent}
                />
              </ErrorBoundary>
            </Suspense>
            </motion.div>
          )}

          {activeErpTab === 'messages' && (
            <motion.div
              key="messages"
              variants={pageFadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageFadeTransition}
              className="flex-1 w-full"
            >
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
                <ErrorBoundary label="Messages Tab">
                  <LazyMessagesTab
                appUser={appUser}
                messages={messages}
                onSendMessage={handleSendMessage}
                onReplyMessage={handleReplyMessage}
                onUpdateStatus={handleUpdateMessageStatus}
                onDeleteMessage={handleDeleteMessage}
                  availableStudents={uniqueStudents.map(s => {
                    const name = (typeof s === 'string' ? s : s?.name) || '';
                    return { name, email: `${(name || '').toLowerCase().replace(/\s+/g, '.')}@hteim.edu` };
                  })}
                />
              </ErrorBoundary>
            </Suspense>
            </motion.div>
          )}

          {activeErpTab === 'reports' && (
            <motion.div
              key="reports"
              variants={pageFadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageFadeTransition}
              className="flex-1 w-full"
            >
              <ErrorBoundary label="Reports Tab">
                <ReportsTab
                  students={uniqueStudents}
                  attendanceRecords={records}
                  payments={payments}
                  courses={courses}
                  assignments={customAssignments}
                  submissions={submissions}
                  currentUserRole={appUser?.role}
                  onRefreshData={handlePushToCloud}
                />
              </ErrorBoundary>
            </motion.div>
          )}

          {activeErpTab === 'attendance' && (
            <motion.div
              key="attendance"
              variants={pageFadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageFadeTransition}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col touch-pan-y w-full"
            >
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
                <ErrorBoundary label="Attendance Tab">
                  {appUser?.role === 'student' ? (
              <StudentAttendancePortal
                student={currentStudentPortalData}
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
                      attendanceByDay: s.attendanceByDay,
                      levelId: s.levelId || 'level_1'
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
            ) : (records.length > 0 || classDays.length > 0 || uniqueStudents.length > 0) ? (
              <>
                {/* Toolbar: Search, Filter, Date Range, View Mode & Settings */}
              {/* Sticky Search Header & Mobile Quick Filter Chips Toolbar */}
              <div className="sticky top-0 z-20 p-2 sm:p-3 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col gap-2 flex-shrink-0 shadow-2xs">
                {/* Search Bar & Mobile View Mode Switcher */}
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Desktop View Switcher & Action Buttons */}
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    <div className="flex bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                      <button
                        onClick={() => setViewMode('matrix')}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'matrix' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                        title="Visual Attendance Matrix (Grid)"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode('cards')}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                        title="Student Profile Cards View"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {(appUser?.role as string) !== 'student' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAddClassDay()}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                          title="Add a new class session"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Class Day</span>
                        </button>
                        <button
                          onClick={() => setShowClassDaysModal(true)}
                          className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer shrink-0"
                          title="Manage class session titles"
                        >
                          <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Manage ({classDays.length})</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Touch-Scrollable Dropdowns & Filter Chips Row */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar touch-pan-x py-0.5 max-w-full">
                  {/* Date Range Filter */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-xs text-slate-600 dark:text-slate-300 shrink-0">
                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                    <select
                      value={dateRangeFilter}
                      onChange={(e: any) => setDateRangeFilter(e.target.value)}
                      className="bg-transparent focus:outline-none font-bold text-[11px] sm:text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="all">All Dates</option>
                      <option value="30days">Last 30 Days</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>

                  {/* Academic Module Filter */}
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl px-2 py-1 text-xs text-amber-900 dark:text-amber-200 shrink-0">
                    <Layers className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    <select
                      value={selectedModule}
                      onChange={(e: any) => setSelectedModule(e.target.value)}
                      className="bg-transparent focus:outline-none font-bold text-[11px] sm:text-xs text-amber-900 dark:text-amber-200 cursor-pointer"
                    >
                      <option value="all">All Modules</option>
                      <option value="m1">Module 1</option>
                      <option value="m2">Module 2</option>
                      <option value="m3">Module 3</option>
                    </select>
                  </div>

                  {/* Sorting */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-xs text-slate-600 dark:text-slate-300 shrink-0">
                    <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="bg-transparent focus:outline-none font-bold text-[11px] sm:text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="name_asc">Name (A-Z)</option>
                      <option value="name_desc">Name (Z-A)</option>
                      <option value="rate_desc">Rate (Highest)</option>
                      <option value="rate_asc">Rate (Lowest)</option>
                    </select>
                  </div>
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
                          const studentKey = (student?.name || '').toLowerCase().trim();
                          const cardPhoto = studentPhotos[studentKey] || student.photoUrl;
                          const note = studentNotes[studentKey] || student.note;
                          const studentBadges = getStudentBadges(student);

                          return (
                            <motion.div 
                              key={student.name}
                              layout
                              initial={{ opacity: 0, scale: 0.92, y: 12 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.88, y: -12 }}
                              transition={{
                                layout: { type: 'spring', stiffness: 280, damping: 28, mass: 0.8 },
                                opacity: { duration: 0.2 },
                                scale: { duration: 0.2 },
                                y: { duration: 0.2 }
                              }}
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
                    <EmptyState
                      title="No students found"
                      description="No students match your current search or filter criteria."
                    />
                  )}
                </div>
              ) : (
                /* Attendance Matrix View Container */
                <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
                  
                  {/* Mobile Attendance Matrix Card Format (< 768px / md:hidden) */}
                  <div className="md:hidden flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-3 bg-slate-50/50 dark:bg-slate-950/50 custom-scrollbar">
                    {/* Mobile Active Check-in Session Quick Controller Bar */}
                    {(appUser?.role as string) !== 'student' && effectiveClassDays.length > 0 && (
                      <div className="sticky top-0 z-10 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-2.5">
                        {/* Session Header & Mode Selector */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                              Active Roll Call Session
                            </span>
                          </div>

                          {/* Mobile View Mode Switcher: Rapid List vs Full Cards */}
                          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                            <button
                              type="button"
                              onClick={() => setMobileRollCallMode('rapid')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                                mobileRollCallMode === 'rapid' 
                                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs' 
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              <Zap className="w-3 h-3 text-amber-500" />
                              <span>Rapid List</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMobileRollCallMode('cards')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                                mobileRollCallMode === 'cards' 
                                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs' 
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              <LayoutGrid className="w-3 h-3" />
                              <span>Cards</span>
                            </button>
                          </div>
                        </div>

                        {/* Full Width Styled Session Selector Dropdown */}
                        <div className="relative">
                          <select
                            value={liveCheckinDayId || (effectiveClassDays.length > 0 ? effectiveClassDays[effectiveClassDays.length - 1].id : '')}
                            onChange={(e) => setLiveCheckinDayId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer pr-8 truncate appearance-none"
                          >
                            {effectiveClassDays.map(d => (
                              <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                {d.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Quick Action Row */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                          <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 shrink-0">
                            <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded font-extrabold">
                              {filteredAndSortedStudents.length} Students
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const activeDay = liveCheckinDayId || (effectiveClassDays.length > 0 ? effectiveClassDays[effectiveClassDays.length - 1].id : '');
                              if (!activeDay) return;
                              filteredAndSortedStudents.forEach(s => {
                                const currentAtt = s.attendanceByDay[activeDay];
                                if (!currentAtt || currentAtt.present === undefined) {
                                  handleToggleStudentAttendance(s.name, activeDay, 'present');
                                }
                              });
                              if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black shrink-0 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Unmarked Present</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {filteredAndSortedStudents.length > 0 ? (
                      mobileRollCallMode === 'cards' ? (
                        <AnimatePresence mode="popLayout">
                          {filteredAndSortedStudents.map((student) => (
                            <motion.div
                              key={student.name}
                              layout
                              initial={{ opacity: 0, scale: 0.95, y: 8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -8 }}
                              transition={{
                                layout: { type: 'spring', stiffness: 280, damping: 28, mass: 0.8 },
                                opacity: { duration: 0.2 },
                                scale: { duration: 0.2 },
                                y: { duration: 0.2 }
                              }}
                            >
                              <SwipeableAttendanceCard
                                student={student}
                                effectiveClassDays={effectiveClassDays}
                                activeDayId={liveCheckinDayId || (effectiveClassDays.length > 0 ? effectiveClassDays[effectiveClassDays.length - 1].id : '')}
                                studentPhotos={studentPhotos}
                                studentNotes={studentNotes}
                                excusedAbsences={excusedAbsences}
                                isSelected={selectedStudentNames.includes(student.name)}
                                satisfactoryThreshold={satisfactoryThreshold}
                                atRiskThreshold={atRiskThreshold}
                                studentBadges={getStudentBadges(student)}
                                onToggleAttendance={handleToggleStudentAttendance}
                                onSelectStudent={setSelectedStudent}
                                onToggleSelectStudent={toggleSelectStudent}
                                appRole={appUser?.role}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      ) : (
                        /* Rapid Roll Call Mode: Super Compact 1-Line Row per Student */
                        <div className="space-y-2">
                          {filteredAndSortedStudents.map((student) => {
                            const studentKey = (student?.name || '').toLowerCase().trim();
                            const cardPhoto = studentPhotos[studentKey] || student.photoUrl;
                            const activeDayId = liveCheckinDayId || (effectiveClassDays.length > 0 ? effectiveClassDays[effectiveClassDays.length - 1].id : '');
                            const att = student.attendanceByDay[activeDayId];
                            const isPresent = att?.present === true;
                            const isExcused = !isPresent && !!(excusedAbsences[studentKey] || {})[activeDayId];
                            const isAbsent = !isPresent && !isExcused && att?.present === false;

                            return (
                              <div
                                key={student.name}
                                className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2"
                              >
                                <div 
                                  onClick={() => setSelectedStudent(student)}
                                  className="flex items-center gap-2 min-w-0 cursor-pointer group"
                                >
                                  {cardPhoto ? (
                                    <img src={cardPhoto} alt={student.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                                      {student.name.charAt(0)}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                                      {student.name}
                                    </h4>
                                    <p className="text-[9px] text-slate-400 font-mono">
                                      {student.attended}/{effectiveClassDays.length} ({Math.round(student.rate)}%)
                                    </p>
                                  </div>
                                </div>

                                {(appUser?.role as string) !== 'student' && activeDayId && (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleToggleStudentAttendance(student.name, activeDayId, 'present');
                                        if (navigator.vibrate) navigator.vibrate(20);
                                      }}
                                      className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl font-black text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-min-44 ${
                                        isPresent 
                                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400' 
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                      }`}
                                      title="Mark Present"
                                    >
                                      P
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleToggleStudentAttendance(student.name, activeDayId, 'excused');
                                        if (navigator.vibrate) navigator.vibrate(20);
                                      }}
                                      className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl font-black text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-min-44 ${
                                        isExcused 
                                          ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-300' 
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                      }`}
                                      title="Mark Excused"
                                    >
                                      E
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleToggleStudentAttendance(student.name, activeDayId, 'absent');
                                        if (navigator.vibrate) navigator.vibrate(20);
                                      }}
                                      className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl font-black text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-min-44 ${
                                        isAbsent 
                                          ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400' 
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                      }`}
                                      title="Mark Absent"
                                    >
                                      A
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      <EmptyState
                        title="No students found"
                        description="No students match your current search or filter criteria."
                      />
                    )}
                  </div>

                  {/* Desktop Attendance Matrix Table (>= 768px / hidden md:block) */}
                  <div className="hidden md:block flex-1 overflow-auto custom-scrollbar relative">
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
{(appUser?.role as string) !== 'student' && (
                                      <div className="flex items-center gap-0.5 opacity-80 group-hover/th:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newName = prompt('Rename Class Day Title:', day.name);
                                            if (newName && newName.trim() !== '') {
                                              handleEditClassDayTitle(day.id, newName.trim());
                                            }
                                          }}
                                          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600 transition-all cursor-pointer flex-shrink-0"
                                          title="Rename class day title"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleClearClassDayRecords(day.id);
                                          }}
                                          className="p-1 hover:bg-amber-100 rounded text-slate-400 hover:text-amber-600 transition-all cursor-pointer flex-shrink-0"
                                          title="Clear all attendance records for this day"
                                        >
                                          <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClassDay(day.id);
                                          }}
                                          className="p-1 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-600 transition-all cursor-pointer flex-shrink-0"
                                          title="Delete this class session completely"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
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
                            const studentKey = (student?.name || '').toLowerCase().trim();
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
                      Select All At-Risk Students
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (window.confirm(`Clear all attendance records for the ${selectedStudentNames.length} selected student(s)?`)) {
                          selectedStudentNames.forEach(name => {
                            const key = (name || '').toLowerCase().trim();
                            setRecords(prev => prev.filter(r => (r.studentName || r.name || '').toLowerCase().trim() !== key));
                            setExcusedAbsences(prev => {
                              const copy = { ...prev };
                              delete copy[key];
                              return copy;
                            });
                          });
                          logActivity({
                            actor: appUser?.name || 'Admin',
                            role: appUser?.role === 'student' ? 'student' : 'admin',
                            actionCategory: 'Attendance Override',
                            actionTitle: 'Batch Records Cleared',
                            details: `Cleared attendance records for ${selectedStudentNames.length} selected students.`
                          });
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                      title="Clear attendance history for all selected students"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Clear Attendance ({selectedStudentNames.length})
                    </button>

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
            <div className="flex flex-col items-center justify-center flex-1 p-6 text-center animate-fadeIn">
              <EmptyState
                title="No attendance records available"
                description="Click '+ Class Day' above to create session days, or mark attendance manually for enrolled students."
                action={
                  <button
                    onClick={() => handleAddClassDay()}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Class Day
                  </button>
                }
              />
            </div>
          )}
              </ErrorBoundary>
            </Suspense>
        </motion.div>
      )}

        {/* Error notification if any */}
        {(activeErpTab === 'attendance' || activeErpTab === 'exams') && appUser?.role !== 'student' && error && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 shadow-lg animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs font-medium text-rose-800 break-words w-full">{error}</div>
          </div>
        )}

        {/* Centralized Global Toasts Stack */}
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
          <AnimatePresence>
            {toasts.map((toast) => {
              const themeClasses = {
                success: 'bg-emerald-50/95 border-emerald-200 text-emerald-800 dark:bg-emerald-950/95 dark:border-emerald-800 dark:text-emerald-100',
                info: 'bg-indigo-50/95 border-indigo-200 text-indigo-800 dark:bg-slate-900/95 dark:border-slate-800 dark:text-slate-100',
                warning: 'bg-amber-50/95 border-amber-200 text-amber-800 dark:bg-amber-950/95 dark:border-amber-800 dark:text-amber-100',
                error: 'bg-rose-50/95 border-rose-200 text-rose-800 dark:bg-rose-950/95 dark:border-rose-900 dark:text-rose-100',
              };

              const Icon = {
                success: CheckCircle2,
                info: Info,
                warning: AlertCircle,
                error: XCircle,
              }[toast.type] || AlertCircle;

              return (
                <motion.div
                  key={toast.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  className={`pointer-events-auto p-3.5 rounded-xl border flex items-start gap-3 shadow-lg backdrop-blur-md ${themeClasses[toast.type] || themeClasses.info}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold leading-tight">{toast.title}</p>
                    <p className="text-[11px] font-medium opacity-90 mt-1.5 break-words">{toast.message}</p>
                  </div>
                  <button
                    onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg flex-shrink-0 cursor-pointer"
                  >
                    <X className="w-3 h-3 opacity-60" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        </AnimatePresence>
      </main>

      {/* Student Detail Modal */}
      <AnimatePresence>
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
• Attendance Rate: ${Math.round(selectedStudent.rate)}%
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
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
              onScroll={(e) => { e.currentTarget.scrollTop = 0; }}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Spacebar') {
                  e.stopPropagation();
                  const target = e.target as HTMLElement;
                  const isInput = target.tagName === 'INPUT' || 
                                  target.tagName === 'TEXTAREA' || 
                                  target.isContentEditable;
                  if (!isInput) {
                    e.preventDefault();
                  }
                }
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  setSelectedStudent(null);
                  setShowEmailDraftModal(false);
                }}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="relative z-10 bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col"
              >
              {/* Modal Header */}
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-700 text-white font-bold text-lg flex items-center justify-center flex-shrink-0 border border-slate-600 uppercase">
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
                            type="range" min="0" max="100" value={studentRubric?.participation ?? 90}
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
                            type="range" min="0" max="100" value={studentRubric?.assignment ?? 85}
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
                            {(appUser?.role as string) !== 'student' && (
                              <>
                                <button
                                  onClick={() => handleToggleStudentAttendance(selectedStudent.name, day.id, isPresent ? 'absent' : 'present')}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                    isPresent ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                                  }`}
                                  title="Toggle Present / Absent"
                                >
                                  {isPresent ? 'Mark Absent' : 'Mark Present'}
                                </button>
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
                                {(isPresent || isExcused || att) && (
                                  <button
                                    onClick={() => handleToggleStudentAttendance(selectedStudent.name, day.id, 'unmarked')}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 rounded transition-colors cursor-pointer"
                                    title="Delete/Clear this day's attendance record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
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
                    value={currentNote ?? ''}
                    onChange={(e) => handleSaveStudentNote(selectedStudent.name, e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleDeleteStudent(selectedStudent.name)}
                    className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    title="Remove student from local active roster"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Exclude Student
                  </button>
                  {(appUser?.role as string) !== 'student' && (
                    <button
                      onClick={() => handleClearStudentAttendanceRecords(selectedStudent.name)}
                      className="flex items-center gap-1.5 px-3 py-2 text-amber-700 hover:bg-amber-100 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      title="Clear all attendance logs for this student"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Clear Attendance History
                    </button>
                  )}
                </div>
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
            </motion.div>
          </div>
        );
      })()}
      </AnimatePresence>

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

        if (reportSearchQuery.trim()) {
          const q = reportSearchQuery.toLowerCase().trim();
          reportStudents = reportStudents.filter(s => 
            s.name.toLowerCase().includes(q) || (s.note && s.note.toLowerCase().includes(q))
          );
        }

        // Apply sorting
        reportStudents = [...reportStudents].sort((a, b) => {
          let comp = 0;
          if (reportSortBy === 'name') {
            comp = a.name.localeCompare(b.name);
          } else if (reportSortBy === 'rate') {
            comp = a.rate - b.rate;
          } else if (reportSortBy === 'score') {
            const scoreA = a.avgScore ?? -1;
            const scoreB = b.avgScore ?? -1;
            comp = scoreA - scoreB;
          }
          return reportSortDir === 'asc' ? comp : -comp;
        });
        
        let filterSuffix = '';
        if (selectedReportAttendanceFilter === 'fifty_percent') {
          filterSuffix = ' (Low Attendance: \u2264 50%)';
        } else if (selectedReportAttendanceFilter === 'at_risk') {
          filterSuffix = ' (At Risk)';
        } else if (selectedReportAttendanceFilter === 'satisfactory') {
          filterSuffix = ' (Satisfactory Standing)';
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

        const handleHeaderSort = (field: 'name' | 'rate' | 'score') => {
          if (reportSortBy === field) {
            setReportSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
          } else {
            setReportSortBy(field);
            setReportSortDir(field === 'name' ? 'asc' : 'desc');
          }
        };

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

              {/* Advanced Filter & Search Sub-Bar */}
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                {/* Attendance Criteria Row */}
                <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 mr-1.5 flex items-center gap-1 flex-shrink-0">
                    <Filter className="w-3 h-3 text-purple-600" /> Filter:
                  </span>
                  <button
                    onClick={() => setSelectedReportAttendanceFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedReportAttendanceFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    All Statuses
                  </button>
                  <button
                    onClick={() => setSelectedReportAttendanceFilter('fifty_percent')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      selectedReportAttendanceFilter === 'fifty_percent'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
                    }`}
                  >
                    <span>Low (&le;50%)</span>
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
                    <span>At-Risk Students</span>
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
                    <span>Satisfactory Standing</span>
                    <span className="opacity-75 font-mono text-[10px]">
                      ({uniqueStudents.filter(s => s.rate >= satisfactoryThreshold).length})
                    </span>
                  </button>
                </div>

                {/* Quick Search in Report */}
                <div className="relative flex-1 min-w-[200px] max-w-[280px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={reportSearchQuery}
                    onChange={(e) => setReportSearchQuery(e.target.value)}
                    placeholder="Search roster..."
                    className="w-full pl-8 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500 shadow-2xs"
                  />
                  {reportSearchQuery && (
                    <button
                      onClick={() => setReportSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Report Document Body */}
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-slate-800" id="printable-report">
                {/* Document Header with HTEIM Logo & Ministry Letterhead */}
                <div className="border-b-2 border-slate-900 pb-5 flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <LogoImage 
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
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">At-Risk Students</p>
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
                      At-Risk Students (Attendance Follow-Up)
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
                    <div className="flex items-center gap-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Student Roster ({reportStudents.length})
                      </h3>
                      <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setReportViewDetailMode('compact')}
                          className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                            reportViewDetailMode === 'compact' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Compact Summary
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportViewDetailMode('detailed')}
                          className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                            reportViewDetailMode === 'detailed' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Detailed Session Grid
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium italic">
                      Click headers to sort column values
                    </p>
                  </div>

                  {reportStudents.length > 0 ? (
                    reportViewDetailMode === 'compact' ? (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b-2 border-slate-800 bg-slate-100 text-slate-700">
                          <th 
                            onClick={() => handleHeaderSort('name')}
                            className="p-2 font-bold cursor-pointer hover:bg-slate-200 transition-colors select-none"
                          >
                            <div className="flex items-center gap-1">
                              Student Name
                              {reportSortBy === 'name' && (
                                <span className="text-indigo-600 font-extrabold">{reportSortDir === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </th>
                          <th className="p-2 font-bold text-center">Attended / Total</th>
                          <th 
                            onClick={() => handleHeaderSort('rate')}
                            className="p-2 font-bold text-center cursor-pointer hover:bg-slate-200 transition-colors select-none"
                          >
                            <div className="flex items-center justify-center gap-1">
                              Attendance %
                              {reportSortBy === 'rate' && (
                                <span className="text-indigo-600 font-extrabold">{reportSortDir === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleHeaderSort('score')}
                            className="p-2 font-bold text-center cursor-pointer hover:bg-slate-200 transition-colors select-none"
                          >
                            <div className="flex items-center justify-center gap-1">
                              Avg Score
                              {reportSortBy === 'score' && (
                                <span className="text-indigo-600 font-extrabold">{reportSortDir === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </th>
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
                      /* Detailed Session Grid View */
                      <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-lg">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b-2 border-slate-800 bg-slate-100 text-slate-700">
                              <th className="p-2 font-bold sticky left-0 bg-slate-100 z-10 w-48 shadow-[1px_0_3px_rgba(0,0,0,0.05)]">Student Name</th>
                              {effectiveClassDays.map(day => (
                                <th key={day.id} className="p-2 font-bold text-center border-r border-slate-200 min-w-[70px]">
                                  {day.name.substring(0, 8)}
                                </th>
                              ))}
                              <th className="p-2 font-bold text-center bg-slate-200/80 min-w-[75px]">Rate %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {reportStudents.map((st, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="p-2 font-bold text-slate-900 sticky left-0 bg-white z-10 shadow-[1px_0_3px_rgba(0,0,0,0.05)] truncate max-w-[192px]">
                                  {st.name}
                                </td>
                                {effectiveClassDays.map(day => {
                                  const attendance = st.attendanceByDay[day.id];
                                  const isPresent = attendance?.present;
                                  return (
                                    <td key={day.id} className="p-1.5 text-center border-r border-slate-100 font-bold font-mono">
                                      {isPresent ? (
                                        <span className="text-emerald-600">✓</span>
                                      ) : (
                                        <span className="text-rose-500">✗</span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="p-2 text-center font-mono font-bold bg-slate-50">
                                  <span className={st.rate >= satisfactoryThreshold ? 'text-emerald-700' : st.rate >= atRiskThreshold ? 'text-amber-700' : 'text-rose-700'}>
                                    {Math.round(st.rate)}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
                      No students match the selected attendance filter criteria.
                    </div>
                  )}
                </div>

                {/* Report Footer & Official Seal */}
                <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between text-slate-500 text-[10px]">
                  <div className="flex items-center gap-2">
                    <LogoImage alt="HTEIM Logo" className="w-6 h-6 rounded-full border border-amber-400 p-0.5 object-contain bg-white" />
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
        sheetMergePolicy={sheetMergePolicy}
        setSheetMergePolicy={setSheetMergePolicy}
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
        onPhotosMigrated={handlePushToCloud}
      />

      {/* Admin Audit Trail & Data Tools Modal */}
      <AdminAuditAndBackupModal
        isOpen={showAdminAuditModal}
        onClose={() => setShowAdminAuditModal(false)}
        currentUserRole={appUser?.role}
        currentActorName={appUser ? (appUser.role === 'admin' ? 'Administrator' : appUser.name) : 'Administrator'}
        onDataRestored={() => {
          // Rehydrate all records and database entities from local storage upon restoration
          try {
            const savedAtt = localStorage.getItem('attendanceRecords');
            if (savedAtt) setRecords(JSON.parse(savedAtt));
          } catch(e){}

          try {
            const savedPay = localStorage.getItem('hteim_student_payments');
            if (savedPay) setPayments(JSON.parse(savedPay));
          } catch(e){}

          try {
            const savedAssign = localStorage.getItem('hteim_custom_assignments');
            if (savedAssign) setCustomAssignments(JSON.parse(savedAssign));
          } catch(e){}

          try {
            const savedSubs = localStorage.getItem('hteim_assignment_submissions');
            if (savedSubs) setSubmissions(JSON.parse(savedSubs));
          } catch(e){}

          try {
            const savedCreds = localStorage.getItem('hteim_user_credentials');
            if (savedCreds) setUserCredentials(JSON.parse(savedCreds));
          } catch(e){}

          try {
            const savedFaculty = localStorage.getItem('hteim_faculty_teachers_v1');
            if (savedFaculty) setFacultyTeachers(JSON.parse(savedFaculty));
          } catch(e){}

          try {
            const savedAtRisk = localStorage.getItem('atRiskThreshold');
            if (savedAtRisk) setAtRiskThreshold(Number(savedAtRisk));
            const savedSat = localStorage.getItem('satisfactoryThreshold');
            if (savedSat) setSatisfactoryThreshold(Number(savedSat));
          } catch(e){}
        }}
        userCredentials={userCredentials}
        onResetPassword={handleChangeUserPassword}
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
      <AnimatePresence>
        {showStudentTranscriptModal && selectedStudent && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
            onScroll={(e) => { e.currentTarget.scrollTop = 0; }}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Spacebar') {
                e.stopPropagation();
                const target = e.target as HTMLElement;
                const isInput = target.tagName === 'INPUT' || 
                                target.tagName === 'TEXTAREA' || 
                                target.isContentEditable;
                if (!isInput) {
                  e.preventDefault();
                }
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowStudentTranscriptModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative z-10 bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
            >
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
                  <LogoImage 
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
                  <LogoImage alt="HTEIM Logo" className="w-5 h-5 rounded-full border border-amber-400 p-0.5 object-contain bg-white" />
                  <span className="font-bold text-slate-700">HTEIM School of Ministry</span>
                </div>
                <div className="italic font-serif text-slate-600">
                  "Bringing Heaven to Earth, Taking People to Heaven"
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
      {showCertificateModal && certificateData && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-hidden"
          onScroll={(e) => { e.currentTarget.scrollTop = 0; }}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Spacebar') {
              e.stopPropagation();
              const target = e.target as HTMLElement;
              const isInput = target.tagName === 'INPUT' || 
                              target.tagName === 'TEXTAREA' || 
                              target.isContentEditable;
              if (!isInput) {
                e.preventDefault();
              }
            }
          }}
        >
          <div className="bg-white border-8 border-double border-amber-600 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto animate-scaleUp p-8 text-center relative text-slate-900 print:border-8 print:shadow-none print:m-0" id="printable-certificate">
            {/* Top Certificate Header */}
            <div className="flex flex-col items-center justify-center mb-6">
              <LogoImage 
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

      {/* Batch Announcement Broadcast Modal */}
      {showBatchBroadcastModal && (
        <BatchAnnouncementModal
          isOpen={showBatchBroadcastModal}
          onClose={() => setShowBatchBroadcastModal(false)}
          availableStudents={uniqueStudents.map(s => ({
            name: s.name,
            email: `${(s.name || '').toLowerCase().replace(/\s+/g, '.')}@hteim.edu`,
            phone: '+1 (868) 555-0199',
            track: 'Active Ministry Module'
          }))}
          onSendBroadcast={handleSendBatchBroadcast}
        />
      )}



      {/* Sheet Merge Conflict Resolution Modal */}
      {pendingConflicts.length > 0 && (
        <SheetMergeConflictModal
          isOpen={pendingConflicts.length > 0}
          conflicts={pendingConflicts}
          onResolve={handleResolveConflicts}
          onCancel={() => {
            setPendingConflicts([]);
            setPendingSyncData(null);
          }}
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
          paymentList={payments.map(p => ({
            name: p.studentName,
            status: p.status,
            track: p.moduleTrack
          }))}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenAdminTools={() => setShowAdminAuditModal(true)}
          onOpenBatchBroadcast={() => setShowBatchBroadcastModal(true)}
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
        onClearClassDayRecords={handleClearClassDayRecords}
        uniqueStudentsCount={uniqueStudents.length}
        classDayStats={classDayStats}
      />

      {/* Login Portal Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          currentUser={appUser}
          onLoginSuccess={handleAppLoginSuccess}
          onLogout={handleAppLogout}
          onClose={() => setShowLoginModal(false)}
          userCredentials={userCredentials}
          onChangePassword={handleChangeUserPassword}
          onSyncCredentials={(syncedCreds) => {
            setUserCredentials(syncedCreds);
          }}
        />
      )}

      {/* Mobile Slide-Up "More" Options Drawer */}
      <AnimatePresence>
        {showMobileMoreMenu && appUser && (
          <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMoreMenu(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="relative z-10 w-full bg-slate-900 border-t-2 border-indigo-500/40 rounded-t-3xl shadow-2xl p-4 text-white max-h-[85dvh] overflow-y-auto custom-scrollbar pb-safe"
            >
              {/* Drawer Drag Handle / Header */}
              <div className="flex flex-col items-center mb-3">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mb-3" />
                <div className="flex items-center justify-between w-full pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-black text-amber-300">HTEIM Mobile Navigation & Tools</h3>
                  </div>
                  <button 
                    onClick={() => setShowMobileMoreMenu(false)}
                    className="p-1 bg-slate-800 rounded-xl text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mobile Quick Modules Section */}
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] uppercase font-mono font-bold text-slate-400 mb-2">Modules</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setActiveErpTab('library');
                        setShowMobileMoreMenu(false);
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        activeErpTab === 'library'
                          ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                      <div>
                        <p className="text-xs font-semibold">Library</p>
                        <p className="text-[9px] text-slate-400">Files & Media</p>
                      </div>
                    </button>

                    {(appUser?.role === 'admin' || appUser?.role === 'student') && (
                      <button
                        onClick={() => {
                          setActiveErpTab('payments');
                          setShowMobileMoreMenu(false);
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          activeErpTab === 'payments'
                            ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <DollarSign className="w-4 h-4" />
                        <div>
                          <p className="text-xs font-semibold">Payments</p>
                          <p className="text-[9px] text-slate-400">Tuition</p>
                        </div>
                      </button>
                    )}

                    {(appUser?.role as string) !== 'student' && (
                      <button
                        onClick={() => {
                          setActiveErpTab('students');
                          setShowMobileMoreMenu(false);
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          activeErpTab === 'students'
                            ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <GraduationCap className="w-4 h-4" />
                        <div>
                          <p className="text-xs font-semibold">Students</p>
                          <p className="text-[9px] text-slate-400">{uniqueStudents.length} Enrolled</p>
                        </div>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setActiveErpTab('messages');
                        setShowMobileMoreMenu(false);
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all col-span-2 ${
                        activeErpTab === 'messages'
                          ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MessageSquare className="w-4 h-4" />
                        <div>
                          <p className="text-xs font-semibold">Messaging</p>
                          <p className="text-[9px] text-slate-400">Direct Messages</p>
                        </div>
                      </div>
                      {unreadMessagesCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold">
                          {unreadMessagesCount} New
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-mono">
                          Open
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Mobile Quick Actions */}
                <div>
                  <p className="text-[10px] uppercase font-mono font-bold text-slate-400 mb-2">Quick Actions</p>
                  <div className="space-y-1.5">
                    {(appUser?.role as string) !== 'student' && (
                      <button
                        onClick={() => {
                          setShowMobileMoreMenu(false);
                          setShowLiveCheckinModal(true);
                          if (!liveCheckinDayId && classDays.length > 0) {
                            setLiveCheckinDayId(classDays[classDays.length - 1].id);
                          }
                        }}
                        className="w-full p-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          <span>Live Check-In</span>
                        </div>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowMobileMoreMenu(false);
                        setShowIntro(true);
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Play Intro (6s)</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowMobileMoreMenu(false);
                        setShowCommandPalette(true);
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-slate-400" />
                        <span>Search</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">⌘K</span>
                    </button>

                    {appUser?.role === 'admin' ? (
                      <button
                        onClick={() => {
                          setShowMobileMoreMenu(false);
                          setShowSettingsModal(true);
                        }}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Settings</span>
                        </div>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 text-slate-400 dark:text-slate-600 text-xs font-medium rounded-xl flex items-center justify-between cursor-not-allowed opacity-60"
                        title="Settings can only be changed by Administrator"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                          <span>Settings</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-400">Admin Only</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Role & Account Section */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] uppercase font-mono font-bold text-slate-400 mb-2">Account</p>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        appUser?.role === 'admin' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' :
                        appUser?.role === 'teacher' ? 'bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900' :
                        'bg-slate-500 dark:bg-slate-400 text-white'
                      }`}>
                        {appUser ? appUser.name.charAt(0).toUpperCase() : 'G'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">{appUser ? appUser.name : 'Guest User'}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-mono">{appUser?.role || 'Guest'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowMobileMoreMenu(false);
                        setShowRoleMenu(true);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Switch Role
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Supabase Storage & Data Diagnostic Modal */}
      <SupabaseDiagnosticModal
        isOpen={showDiagnosticModal}
        onClose={() => setShowDiagnosticModal(false)}
        userEmail={appUser?.email || user?.email}
        userRole={appUser?.role}
        onRefreshData={handlePushToCloud}
      />

      {/* Dynamic User Credentials Management Modal */}
      {showUserManagementModal && (
        <UserManagementModal
          isOpen={showUserManagementModal}
          onClose={() => setShowUserManagementModal(false)}
          userCredentials={userCredentials}
          onUpdateCredentials={async (updatedCreds) => {
            setUserCredentials(updatedCreds);
            try {
              localStorage.setItem('hteim_user_credentials', JSON.stringify(updatedCreds));
            } catch (e) {}
            
            // Instantly sync the new account configuration to Supabase
            try {
              const activeEmail = appUser?.email || user?.email;
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
                facultyTeachers,
                payments,
                messages,
                zoomExceptionNote,
                hasZoomException,
                userCredentials: updatedCreds
              };
              await saveToSupabase(activeEmail, stateToSave);
            } catch (err) {
              console.error("Failed syncing manual credentials update to Supabase:", err);
            }
          }}
          uniqueStudents={uniqueStudents}
          facultyTeachers={facultyTeachers}
          currentAdminEmail="kpierre24@gmail.com"
          onTriggerCloudSync={handlePushToCloud}
        />
      )}

      {/* 30-Second Student Presentation Demo Video Modal */}
      <AppPresentationModal
        isOpen={showPresentationModal}
        onClose={() => setShowPresentationModal(false)}
        onNavigateTab={(tab) => setActiveErpTab(tab)}
      />

      {/* Portal Footer */}
      <footer id="portal-footer" className="mt-auto md:mt-8 mb-16 md:mb-0 px-3 sm:px-6 py-2.5 sm:py-3 border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3 text-[11px] text-slate-500 dark:text-slate-400 z-10 relative shrink-0 shadow-xs">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" title="System Operational"></span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">HTEIM School of Ministry</p>
          </div>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>75% Attendance Policy Enforced</span>
          </div>
          <span className="hidden md:inline text-slate-300 dark:text-slate-700">•</span>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
            <Cloud className="w-3 h-3 text-indigo-500 shrink-0" />
            <span>Cloud & Offline PWA Active</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowGuideModal(true)}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Guide</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          {appUser?.role === 'admin' ? (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          ) : (
            <span className="text-slate-400 dark:text-slate-600 flex items-center gap-1 cursor-not-allowed text-[11px] font-medium" title="Settings can only be changed by Administrator">
              <Lock className="w-3 h-3 text-slate-400 dark:text-slate-600" />
              <span>Settings (Admin)</span>
            </span>
          )}
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">HTEIM © 2026</p>
        </div>
      </footer>



      {/* Floating Active Quiz Banner (Students Only) */}
      {appUser?.role === 'student' && activeQuizzesList.length > 0 && showFloatingQuizBanner && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: [1, 1.02, 1],
            borderColor: [
              'rgba(192, 132, 252, 0.6)',
              'rgba(251, 191, 36, 0.9)',
              'rgba(192, 132, 252, 0.6)'
            ],
            boxShadow: [
              '0 20px 25px -5px rgba(147, 51, 234, 0.3), 0 8px 10px -6px rgba(147, 51, 234, 0.2)',
              '0 25px 35px -5px rgba(245, 158, 11, 0.5), 0 10px 15px -6px rgba(168, 85, 247, 0.4)',
              '0 20px 25px -5px rgba(147, 51, 234, 0.3), 0 8px 10px -6px rgba(147, 51, 234, 0.2)'
            ]
          }}
          transition={{
            opacity: { duration: 0.3 },
            y: { duration: 0.3 },
            scale: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' },
            borderColor: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' },
            boxShadow: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' }
          }}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-80 bg-slate-900/95 dark:bg-purple-950/95 backdrop-blur-md text-white p-4 rounded-2xl border-2 shadow-2xl flex flex-col gap-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="tracking-wide">Active Class Day Quiz Live</span>
            </div>
            <button 
              onClick={() => setShowFloatingQuizBanner(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="Dismiss floating banner"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h4 className="text-sm font-black text-white line-clamp-1 leading-tight">
              {activeQuizzesList[0].title}
            </h4>
            <p className="text-[11px] text-purple-200/90 mt-1 font-medium">
              {activeQuizzesList[0].maxPoints} Points Max • {activeQuizzesList[0].quizData?.timeLimitMinutes ? `${activeQuizzesList[0].quizData.timeLimitMinutes} min limit` : 'Timed Quiz'}
            </p>
          </div>

          <button
            onClick={() => {
              setActiveErpTab('exams');
            }}
            className="w-full mt-0.5 px-3.5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-slate-950 shrink-0" />
            <span>Take Active Quiz Now</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-950 shrink-0" />
          </button>
        </motion.div>
      )}

      {/* Mobile Bottom Navigation */}
      {appUser && (
        <nav aria-label="Mobile bottom navigation" className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-[#08182c]/95 border-t border-slate-200/90 dark:border-[#1a385c] backdrop-blur-xl shadow-2xl flex flex-row flex-nowrap items-center justify-around px-1 py-1 w-full min-h-[56px] pb-[max(0.375rem,env(safe-area-inset-bottom,0.375rem))] overflow-hidden">
          {[
            { tab: 'home', Icon: Sparkles, label: 'Home' },
            { tab: 'attendance', Icon: UserCheck, label: 'Attendance' },
            { tab: 'courses', Icon: BookOpen, label: 'Courses' },
            { tab: 'exams', Icon: Award, label: 'Exams' },
          ].map(({ tab, Icon, label }: any) => {
            const isActive = activeErpTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleNavigate(tab as TabType)}
                aria-label={`Open ${label}`}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 shrink-0 max-w-[20%] min-h-[44px] py-1 px-0.5 flex flex-col items-center justify-center gap-0.5 cursor-pointer rounded-xl transition-all active:scale-95 touch-min-44 ${
                  isActive
                    ? 'bg-slate-100 dark:bg-[#0e2540] text-[#023264] dark:text-white font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-[#025798] dark:text-[#7dd3fc]' : 'text-slate-400 dark:text-slate-500'}`} />
                </div>
                <span className={`text-[10px] tracking-tight truncate max-w-full ${
                  isActive ? 'text-[#023264] dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'
                }`}>{label}</span>
              </button>
            );
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setShowMobileMoreMenu(true)}
            aria-label="Open more portal sections"
            className={`relative flex-1 shrink-0 max-w-[20%] min-h-[44px] py-1 px-0.5 flex flex-col items-center justify-center gap-0.5 cursor-pointer rounded-xl transition-all active:scale-95 touch-min-44 ${
              showMobileMoreMenu
                ? 'bg-slate-100 dark:bg-[#0e2540] text-[#023264] dark:text-white font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <Menu className={`w-5 h-5 transition-transform ${
                showMobileMoreMenu ? 'scale-110 text-[#025798] dark:text-[#7dd3fc]' : 'text-slate-400 dark:text-slate-500'
              }`} />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-3.5 h-3.5 rounded-full bg-[#b38f53] text-white font-bold text-[8px] flex items-center justify-center px-0.5">
                  {unreadMessagesCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] tracking-tight ${
              showMobileMoreMenu ? 'text-[#023264] dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}>More</span>
          </button>
        </nav>
      )}
    </div>
    </>
  );
}
