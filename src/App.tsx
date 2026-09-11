import { PortalFooter, MobileBottomNav } from './components/layout';
import { FloatingQuizBanner } from './features/assignments';
import { PWAInstallButton } from "./components/PWAInstallButton";
import { AppHeader } from './components/AppHeader';
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
  ArrowUp,
  ArrowDown,
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
  Users,
  BookOpenCheck
} from 'lucide-react';
import { loadAuthoritativeState as loadFromSupabase, saveAuthoritativeState as saveToSupabase } from './services/dataSyncService';
import { testSupabaseConnection, loadFromSupabase as loadDirectFromSupabase } from './lib/supabaseSync';
import { supabase, uploadToSupabaseStorage, ensureSupabaseStorageUrl, syncLibraryFromSupabaseBucket, syncFacultyImagesToSupabase, syncStudentPhotosToSupabase } from './lib/supabaseClient';
import { SupabaseDiagnosticModal } from './components/SupabaseDiagnosticModal';
import { BatchAnnouncementModal } from './components/BatchAnnouncementModal';
import { MobileDownloadCenterModal } from './components/MobileDownloadCenterModal';
import { ManageClassDaysModal } from './components/ManageClassDaysModal';
import { SheetMergeConflictModal } from './components/SheetMergeConflictModal';
import { OfflineSyncDrawer } from './components/OfflineSyncDrawer';
import { FinancePage } from './features/finance';
import { PINCheckinQRModal } from './components/PINCheckinQRModal';
import { RoleManagementModal } from './components/RoleManagementModal';
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
import { getDemoAttendance, CURRICULUM_CLASS_DAYS, MASTER_ENROLLED_STUDENTS, RAW_CURRICULUM_RECORDS } from './data';
import { TabType, AppNotification, CustomAssignment, AssignmentSubmission, ACADEMIC_LEVELS, getDefaultLevelForStudent, AcademicLevel, Course, ScheduleItem, LibraryResource, MediaResource, PaymentRecord, ClassDay, StudentSummary, AppMessage, MessageReply, MessageAttachment, AttendanceRecord, Cohort, DEFAULT_COHORTS, UserRole } from './types';
import { AppUser, generateStudentUsername, UserCredential, ensureUserCredentials, resetUserPassword, isMatchingCredential, mergeUserCredentials, DEFAULT_USER_PASSWORD } from './lib/userAuth';
import { updatePasswordInSupabase } from './lib/supabaseAuth';
import { NotificationCenter } from './components/NotificationCenter';
import { generateAutomatedNotifications, filterNotificationsForUser } from './lib/notifications';
import { CentralNotificationService } from './services/notification/CentralNotificationService';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { SettingsModal, ThemeMode } from './components/SettingsModal';
import { CohortManagementModal } from './components/CohortManagementModal';
import { portalApiClient } from './services/api/portalApiClient';
import { AttendanceStatus } from './types/database';
import { StudentAttendancePortal } from './components/StudentAttendancePortal';
import { AttendanceWorkspace as AttendanceTab } from './features/attendance/AttendanceWorkspace';
import { HomeTab, DEFAULT_FACULTY_TEACHERS } from './components/HomeTab';
import { StudentsTab } from './components/StudentsTab';
import { CoursesTab, INITIAL_COURSES } from './components/CoursesTab';
import { ExamsTab, INITIAL_ASSIGNMENTS, INITIAL_SUBMISSIONS } from './components/ExamsTab';
import { ScheduleTab, INITIAL_SCHEDULE } from './components/ScheduleTab';
import { LibraryTab, INITIAL_RESOURCES } from './features/library/components/LibraryTab';
import { PaymentTab, INITIAL_PAYMENTS } from './components/PaymentTab';
import { MessagesTab, INITIAL_MESSAGES } from './components/MessagesTab';
import { ReportsTab } from './components/ReportsTab';
import { StudentNotesBibleTab } from './components/StudentNotesBibleTab';
import { DEFAULT_PRESET_MEDIA } from './components/ClassroomMediaPlayer';
import { IntroSplashScreen } from './components/IntroSplashScreen';
import { OutstandingPaymentBanner } from './components/OutstandingPaymentBanner';
import { StudentDetailModal } from './features/students/StudentDetailModal';
import { StudentTranscriptModal } from './features/students/StudentTranscriptModal';
import { CertificateModal } from './features/students/CertificateModal';
import { BatchEmailModal } from './features/attendance/BatchEmailModal';
import { PrintableReportModal } from './features/attendance/PrintableReportModal';
import { GuideModal } from './components/shared/GuideModal';
import { MobileMoreMenuDrawer } from './components/layout/MobileMoreMenuDrawer';

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
import { BackToTopButton } from './components/BackToTopButton';
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
  // Shellon Liddel (synced with Shellon Massiah)
  'shellon liddel': 'Shellon Liddel',
  'shellon liddell': 'Shellon Liddel',
  'shellon  liddel': 'Shellon Liddel',
  'shellon  liddell': 'Shellon Liddel',
  'shellon liddel-selby': 'Shellon Liddel',
  'shellon liddell-selby': 'Shellon Liddel',
  'shellon liddel selby': 'Shellon Liddel',
  'shellon liddell selby': 'Shellon Liddel',
  's liddel': 'Shellon Liddel',
  's. liddel': 'Shellon Liddel',
  's liddell': 'Shellon Liddel',
  's. liddell': 'Shellon Liddel',
  'uvanie@yahoo.com': 'Shellon Liddel',
  'shellon massiah': 'Shellon Liddel',
  'shellon  massiah': 'Shellon Liddel',
  'shellon messiah': 'Shellon Liddel',
  's massiah': 'Shellon Liddel',
  's. massiah': 'Shellon Liddel',
  'massiahshellon@gmail.com': 'Shellon Liddel',

  // Niomi Loverne Joseph Marksman
  'niomi': 'Niomi Loverne Joseph Marksman',
  'niomi.': 'Niomi Loverne Joseph Marksman',
  'niomi marksman': 'Niomi Loverne Joseph Marksman',
  'niomi joseph': 'Niomi Loverne Joseph Marksman',
  'niomi loverne': 'Niomi Loverne Joseph Marksman',
  'niomi laverne': 'Niomi Loverne Joseph Marksman',
  'loverne joseph': 'Niomi Loverne Joseph Marksman',
  'laverne joseph marksman': 'Niomi Loverne Joseph Marksman',
  'niomi loverne joseph': 'Niomi Loverne Joseph Marksman',
  'niomi laverne joseph': 'Niomi Loverne Joseph Marksman',
  'niomi loverne joseph marksman': 'Niomi Loverne Joseph Marksman',
  'niomi laverne joseph marksman': 'Niomi Loverne Joseph Marksman',
  'niomi. laverne joseph marksman': 'Niomi Loverne Joseph Marksman',
  'lovernejosephempress@gmail.com': 'Niomi Loverne Joseph Marksman',

  // Krystal Mohammed
  'krystal mohammed': 'Krystal Mohammed',
  'krystal mohamed': 'Krystal Mohammed',
  'k mohammed': 'Krystal Mohammed',
  'k. mohammed': 'Krystal Mohammed',
  'krystal': 'Krystal Mohammed',
  'krystalmoh02@gmail.com': 'Krystal Mohammed',
  'krystalmoh2@gmail.com': 'Krystal Mohammed',

  // Vanessa Mohammed (distinct student)
  'vanessa': 'Vanessa Mohammed',
  'vanessa mohammed': 'Vanessa Mohammed',
  'vanessa  mohammed': 'Vanessa Mohammed',
  'v mohammed': 'Vanessa Mohammed',
  'v. mohammed': 'Vanessa Mohammed',

  // Denise Edwards
  'denise edwards': 'Denise Edwards',
  'deniseedwards6561@gmail.com': 'Denise Edwards',
  'deniseedwards6561@gmeil.com': 'Denise Edwards',
  'denise edwards6561@gmail.com': 'Denise Edwards',
  'denise edwards 6561@gmail.com': 'Denise Edwards',
  'd edwards': 'Denise Edwards',
  'd. edwards': 'Denise Edwards',

  // Kabrina Morris-Jack
  'kabrina': 'Kabrina Morris-Jack',
  'kabrina jack': 'Kabrina Morris-Jack',
  'kabrina morris jack': 'Kabrina Morris-Jack',
  'kabrina morris-jack': 'Kabrina Morris-Jack',
  'kabrinamorrisjack': 'Kabrina Morris-Jack',

  // Mishael Daniel
  'mishael daniel': 'Mishael Daniel',
  'mishaeldaniel06@gmail.com': 'Mishael Daniel',
  'mishaeldaniel06@gmeil.com': 'Mishael Daniel',
  'mishael daniel06@gmail.com': 'Mishael Daniel',
  'mishael daniel06@gmeil.com': 'Mishael Daniel',

  // Colette Blackburne Joseph
  'colette blackburn joseph': 'Colette Blackburne Joseph',
  'colette blackburne joseph': 'Colette Blackburne Joseph',
  'colette blackburne joseph ': 'Colette Blackburne Joseph',
  'colette blackburn': 'Colette Blackburne Joseph',
  'colette blackburne': 'Colette Blackburne Joseph',
  'colette blackburne-joseph': 'Colette Blackburne Joseph',
  'colette blackburne -joseph': 'Colette Blackburne Joseph',

  // Ingrid Bonval-Butcher
  'ingrid': 'Ingrid Bonval-Butcher',
  'ingrid butcher': 'Ingrid Bonval-Butcher',
  'ingrid bonval butcher': 'Ingrid Bonval-Butcher',
  'ingrid bonval-butcher': 'Ingrid Bonval-Butcher',
  'ingrid bonval-butcher k': 'Ingrid Bonval-Butcher',

  // Julie-Ann Fernandes-Charles
  'julie charles': 'Julie-Ann Fernandes-Charles',
  'julie-ann charles': 'Julie-Ann Fernandes-Charles',
  'julie ann fernandes charles': 'Julie-Ann Fernandes-Charles',
  'julie-ann fernandes-charles': 'Julie-Ann Fernandes-Charles',

  // Marlene Walker-Castle
  'marlene walker': 'Marlene Walker-Castle',
  'marlene walker castle': 'Marlene Walker-Castle',
  'marlene walker-castle': 'Marlene Walker-Castle',

  // Regina Joseph-Gonzales
  'regina joseph-gonzales': 'Regina Joseph-Gonzales',
  'regina joseph gonzales': 'Regina Joseph-Gonzales',
  'regina gonzales': 'Regina Joseph-Gonzales',
  'regina joseph': 'Regina Joseph-Gonzales',
  'regina joseph- gonzales': 'Regina Joseph-Gonzales',
  'regina joseph - gonzales': 'Regina Joseph-Gonzales',

  // Whitney Tracey Seelochan
  'whitney tracey seelochan': 'Whitney Tracey Seelochan',
  'whitney seelochan': 'Whitney Tracey Seelochan',

  // Racine Roy
  'racian': 'Racine Roy',
  'racian roy': 'Racine Roy',
  'racine roy': 'Racine Roy',

  // Kemrolene Opadeyi
  'kemrolene opadeyi': 'Kemrolene Opadeyi',
  'kemrolene bowens-opadeyi': 'Kemrolene Opadeyi',

  // Keyshana Gomes
  'keyshana gomes': 'Keyshana Gomes',
  'ice4evah@gmail.com': 'Keyshana Gomes',

  // Jenetta Pierre
  'jenetta pierre': 'Jenetta Pierre',
  'jenetta.pierre04@gmail.com': 'Jenetta Pierre',

  // Nevillean Dundas
  'nevillean dundas': 'Nevillean Dundas',
  'nevellean dundas': 'Nevillean Dundas',

  // Alicia Noray Bowles
  'alicia noray bowles': 'Alicia Noray Bowles',
  'alicia bowles': 'Alicia Noray Bowles',

  // Anne-Marie Davis
  'anne marie davis': 'Anne-Marie Davis',
  'anne-marie davis': 'Anne-Marie Davis',

  // Susan Spark
  'susan spark': 'Susan Spark',
  'susan sparks': 'Susan Spark',

  // Wendy Woodruffe
  'wendy woodruffe': 'Wendy Woodruffe',
  'wendy wondruffe': 'Wendy Woodruffe',

  // Racquel Gumbs
  'racquel gumbs': 'Racquel Gumbs',
  'raquel gumbs': 'Racquel Gumbs',

  // Kathleen Joseph-Sandy
  'kathleen joseph-sandy': 'Kathleen Joseph-Sandy',
  'kathleen  joseph-sandy': 'Kathleen Joseph-Sandy',

  // Richard Roberts
  'richard roberts': 'Richard Roberts',
  'richard  roberts': 'Richard Roberts',

  // Tessa Phipps
  'tessa phipps': 'Tessa Phipps',
  'tessa  phipps': 'Tessa Phipps',

  // Afeshia Burke
  'afeshia': 'Afeshia Burke',
  'afeshia burke': 'Afeshia Burke',

  // Rennie Bowles
  'rennie': 'Rennie Bowles',
  'rennie bowles': 'Rennie Bowles',

  // Roxanne Sealey
  'roxanne': 'Roxanne Sealey',
  'roxanne sealey': 'Roxanne Sealey',

  // Diana Selkridge & Beverly Selkridge
  'diana selkridge': 'Diana Selkridge',
  'beverly selkridge': 'Beverly Selkridge',
  'vikash ramnarace': 'Vikash Ramnarace',
  'francisca swift': 'Francisca Swift',
};

const getCanonicalNamesMap = (rawNames: string[]): Map<string, string> => {
  const nameGroups: string[][] = [];
  const canonicalNames = new Map<string, string>();

  // Helper to normalize strings for comparison
  const normalize = (str: string) => (str || '').toLowerCase().trim().replace(/[\u00A0\s]+/g, ' ');

  rawNames.forEach((rawName: string) => {
    if (!rawName) return;
    const lowerRaw = normalize(rawName);
    const explicitCanonical = MANUAL_ALIASES[lowerRaw];
    const normalizedRaw = lowerRaw.replace(/[^a-z0-9 ]/g, ' ').trim();

    let foundGroup = false;
    for (const group of nameGroups) {
      const representative = group[0];
      const lowerRep = normalize(representative);
      const explicitRepCanonical = MANUAL_ALIASES[lowerRep];

      // If both map to the same manual alias, group together immediately
      if (explicitCanonical && explicitRepCanonical && explicitCanonical === explicitRepCanonical) {
        group.push(rawName);
        foundGroup = true;
        break;
      }
      if (explicitCanonical && group.some((n: string) => MANUAL_ALIASES[normalize(n)] === explicitCanonical)) {
        group.push(rawName);
        foundGroup = true;
        break;
      }

      // If both have different explicit canonical names, do NOT merge
      if (explicitCanonical && explicitRepCanonical && explicitCanonical !== explicitRepCanonical) {
        continue;
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

      // Prevent merging distinct students with different last names
      if (rawParts.length >= 2 && repParts.length >= 2) {
        const rawFirst = rawParts[0];
        const rawLast = rawParts[rawParts.length - 1];
        const repFirst = repParts[0];
        const repLast = repParts[repParts.length - 1];

        // If last names are different and not initials or compound, keep separate
        if (rawLast !== repLast && rawLast.length > 2 && repLast.length > 2) {
          const isCompoundSurname = rawLast.includes(repLast) || repLast.includes(rawLast);
          if (!isCompoundSurname && rawFirst !== rawLast) {
            continue;
          }
        }

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
      const alias = MANUAL_ALIASES[normalize(name)];
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
  // showMoreMenu is now local state inside <AppHeader /> — removed from App
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
        // showMoreMenu Escape is handled internally by AppHeader
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleQuickRoleSwitch = (role: UserRole | string, customName?: string, studentIdChoice?: string) => {
    let newUser: AppUser;
    const cleanRole = (role || 'student') as UserRole;

    if (cleanRole === 'super_admin') {
      newUser = {
        id: 'u-super-admin',
        username: 'superadmin',
        name: customName || 'Apostle Kendell Pierre',
        role: 'super_admin',
        email: 'kpierre24@gmail.com'
      };
    } else if (cleanRole === 'admin') {
      newUser = {
        id: 'u-admin',
        username: 'admin',
        name: customName || 'Administrator Sarah',
        role: 'admin',
        email: 'admin@hteim.edu'
      };
    } else if (cleanRole === 'registrar') {
      newUser = {
        id: 'u-registrar',
        username: 'registrar',
        name: customName || 'Dr. Evelyn Registrar',
        role: 'registrar',
        email: 'registrar@hteim.edu'
      };
    } else if (cleanRole === 'lecturer' || cleanRole === 'teacher') {
      newUser = {
        id: 'u-lecturer',
        username: 'lecturer',
        name: customName || 'Rev. Dr. Matthew Faculty',
        role: 'lecturer',
        email: 'lecturer@hteim.edu',
        assignedCourses: ['SOM-101', 'SOM-102']
      };
    } else if (cleanRole === 'finance_officer') {
      newUser = {
        id: 'u-finance',
        username: 'finance',
        name: customName || 'Minister David Bursar',
        role: 'finance_officer',
        email: 'finance@hteim.edu'
      };
    } else if (cleanRole === 'librarian') {
      newUser = {
        id: 'u-librarian',
        username: 'librarian',
        name: customName || 'Sister Grace Librarian',
        role: 'librarian',
        email: 'librarian@hteim.edu'
      };
    } else if (cleanRole === 'viewer') {
      newUser = {
        id: 'u-viewer',
        username: 'viewer',
        name: customName || 'Guest Observer',
        role: 'viewer',
        email: 'guest@hteim.edu'
      };
    } else {
      let chosenName = customName || 'Aaron Miller';
      if (!customName) {
        if (uniqueStudents && uniqueStudents.length > 0) {
          const firstStudent = uniqueStudents[0];
          if (typeof firstStudent === 'string') {
            chosenName = firstStudent;
          } else if (firstStudent && typeof (firstStudent as any).name === 'string') {
            chosenName = (firstStudent as any).name;
          }
        }
      }

      newUser = {
        id: `u-student-${(chosenName || '').toLowerCase().replace(/\s+/g, '-')}`,
        username: generateStudentUsername(chosenName),
        name: chosenName,
        role: 'student',
        studentName: chosenName,
        studentId: studentIdChoice || 'HTEIM-2026-0001',
        email: `${(generateStudentUsername(chosenName) || '').toLowerCase()}@student.hteim.edu`
      };
    }
    setAppUser(newUser);
    setShowRoleMenu(false);
    setSyncedBannerMessage(`🎭 Role Switch: Previewing portal as ${cleanRole.toUpperCase().replace('_', ' ')} (${newUser.name})`);
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
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize names using MANUAL_ALIASES (specifically Shellon Massiah / Shellon Liddell -> Shellon Liddel)
          const normalized = parsed.map((p: any) => {
            if (!p || !p.studentName) return p;
            const pLower = p.studentName.toLowerCase().trim().replace(/[\u00A0\s]+/g, ' ');
            const alias = MANUAL_ALIASES[pLower];
            if (alias && alias !== p.studentName) {
              return { ...p, studentName: alias };
            }
            return p;
          });
          // De-duplicate if multiple records exist for the same student (e.g. Shellon Liddel)
          const seen = new Set<string>();
          const deduped: PaymentRecord[] = [];
          normalized.forEach((p: any) => {
            const key = (p?.studentName || '').toLowerCase().trim();
            if (key) {
              if (seen.has(key)) {
                const existing = deduped.find(d => (d?.studentName || '').toLowerCase().trim() === key);
                if (existing) {
                  existing.amountPaid = (Number(existing.amountPaid) || 0) + (Number(p.amountPaid) || 0);
                  if (existing.amountPaid >= (existing.totalTuition || 1200)) existing.status = 'Paid In Full';
                  else if (existing.amountPaid > 0) existing.status = 'Partial';
                }
                return;
              }
              seen.add(key);
            }
            deduped.push(p);
          });
          // Merge INITIAL_PAYMENTS to guarantee every enrolled student is present
          const existingNames = new Set(deduped.map((p: any) => (p?.studentName || '').toLowerCase().trim()));
          const missing = INITIAL_PAYMENTS.filter(p => !existingNames.has((p.studentName || '').toLowerCase().trim()));
          return [...deduped, ...missing];
        }
      } catch (e) {}
    }
    return INITIAL_PAYMENTS;
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
  const defaultPermanentClassDays: ClassDay[] = useMemo(() => CURRICULUM_CLASS_DAYS, []);

  const [classDays, setClassDays] = useState<ClassDay[]>(() => {
    const saved = localStorage.getItem('classDays');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 14) return parsed;
      } catch (e) {}
    }
    return CURRICULUM_CLASS_DAYS;
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
        if (Array.isArray(loaded) && loaded.length >= 50) {
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

    // Default permanent attendance records for all 14 curriculum classes
    return RAW_CURRICULUM_RECORDS.filter(r => !isExcludedStudent(r.name));
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
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'last_name_asc' | 'last_name_desc' | 'rate_desc' | 'rate_asc' | 'score_desc' | 'score_asc'>('name_asc');
  
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
  const [showCohortModal, setShowCohortModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showMobileDownloadModal, setShowMobileDownloadModal] = useState(false);
  const [showClassDaysModal, setShowClassDaysModal] = useState(false);

  // Cohort Management State
  const [cohorts, setCohorts] = useState<Cohort[]>(() => {
    try {
      const saved = localStorage.getItem('hteim_cohorts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_COHORTS;
  });

  const [activeCohortId, setActiveCohortId] = useState<string>(() => {
    return localStorage.getItem('hteim_active_cohort_id') || 'cohort_2026';
  });

  useEffect(() => {
    localStorage.setItem('hteim_cohorts', JSON.stringify(cohorts));
  }, [cohorts]);

  useEffect(() => {
    localStorage.setItem('hteim_active_cohort_id', activeCohortId);
  }, [activeCohortId]);

  const activeCohort = useMemo(() => {
    return cohorts.find(c => c.id === activeCohortId) || cohorts[0] || DEFAULT_COHORTS[0];
  }, [cohorts, activeCohortId]);

  const handleSaveCohort = (cohort: Cohort) => {
    setCohorts(prev => {
      const idx = prev.findIndex(c => c.id === cohort.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = cohort;
        return copy;
      }
      return [...prev, cohort];
    });
  };

  const handleDeleteCohort = (cohortId: string) => {
    setCohorts(prev => prev.filter(c => c.id !== cohortId));
    if (activeCohortId === cohortId) {
      setActiveCohortId('cohort_2026');
    }
  };

  const handleArchiveToggleCohort = (cohortId: string) => {
    setCohorts(prev => prev.map(c => c.id === cohortId ? { ...c, isArchived: !c.isArchived } : c));
  };

  const handleAssignStudentCohort = (studentName: string, cohortId: string) => {
    const key = `hteim_student_cohort_${studentName.toLowerCase().trim()}`;
    localStorage.setItem(key, cohortId);
  };

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
  const [showOfflineDrawer, setShowOfflineDrawer] = useState(false);
  const [showPINCheckinModal, setShowPINCheckinModal] = useState(false);

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
      setClassDays(CURRICULUM_CLASS_DAYS);
      const processed: AttendanceRecord[] = RAW_CURRICULUM_RECORDS.filter(r => !isExcludedStudent(r.name));
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

    const targetUrl = customUrl || activeCohort?.sheetUrl || sheetUrl;
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

          // Auto-categorization check for cohort matching sheet tab pattern or title
          const matchedCohortForTab = cohorts.find(c => {
            if (c.sheetTabPattern && c.sheetTabPattern.trim() !== '') {
              const pattern = c.sheetTabPattern.toLowerCase().trim();
              const titleLower = sheetTitle.toLowerCase().trim();
              return titleLower.includes(pattern) || pattern.includes(titleLower);
            }
            const yearStr = c.academicYear ? c.academicYear.toString() : '';
            return (yearStr && sheetTitle.toLowerCase().includes(yearStr)) || sheetTitle.toLowerCase().includes(c.name.toLowerCase());
          });

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

            // If a tab matched a cohort, auto-tag the student's cohort
            if (matchedCohortForTab) {
              const studentKey = name.toLowerCase().trim();
              if (!localStorage.getItem(`hteim_student_cohort_${studentKey}`)) {
                localStorage.setItem(`hteim_student_cohort_${studentKey}`, matchedCohortForTab.id);
              }
            }

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
    const currentUrl = activeCohort?.sheetUrl || sheetUrl;
    if ((activeErpTab === 'exams' || activeErpTab === 'home') && currentUrl) {
      handleLoadSheets(undefined, currentUrl).catch(err => {
        console.warn("Auto-sync of public sheets failed:", err);
      });
    }
  }, [activeErpTab, sheetUrl, activeCohortId, activeCohort?.sheetUrl]);

  const { uniqueStudents, avgAttendance, avgScoreOverall, classDayStats } = useMemo(() => {
    const recordNames = records.filter(r => r && (r.name || r.studentName)).map(r => (r.name || r.studentName || '').toString().trim());
    const paymentNames = payments.filter(p => p && p.studentName).map(p => p.studentName.trim());
    const userNames = userCredentials.filter(c => c && c.name && c.role === 'student').map(c => c.name.trim());

    const combinedRawNames = Array.from(new Set([...recordNames, ...paymentNames, ...userNames, ...MASTER_ENROLLED_STUDENTS]))
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
            levelId: studentLevels[key] || getDefaultLevelForStudent(canonicalName, 0),
            cohortId: localStorage.getItem(`hteim_student_cohort_${key}`) || activeCohortId || 'cohort_2026'
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

      return { ...student, rate, attended, totalDays: totalClasses, avgScore, note, photoUrl, levelId };
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
  }, [records, classDays, payments, userCredentials, deletedStudentNames, studentNotes, studentPhotos, studentLevels, customAssignments, submissions, excusedAbsences]);

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
    payments.forEach(p => {
      if (p && p.studentName && p.email) {
        const pLower = p.studentName.toLowerCase().trim().replace(/[\u00A0\s]+/g, ' ');
        const canonical = (MANUAL_ALIASES[pLower] || p.studentName).toLowerCase().trim();
        if (!studentEmailMap[canonical]) {
          studentEmailMap[canonical] = p.email.trim();
        }
      }
    });
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
      const studentNameLower = (rawName || '').toLowerCase().trim().replace(/[\u00A0\s]+/g, ' ');
      const mappedCanonical = (MANUAL_ALIASES[studentNameLower] || rawName).toLowerCase().trim();

      return uniqueStudents.find(st => {
        if (!st || !st.name) return false;
        const stLower = st.name.toLowerCase().trim().replace(/[\u00A0\s]+/g, ' ');
        const stCanonical = (MANUAL_ALIASES[stLower] || st.name).toLowerCase().trim();
        return stLower === studentNameLower || stLower === mappedCanonical || stCanonical === mappedCanonical || stCanonical === studentNameLower;
      });
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
      avgScore: null,
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
    const resolvedStudentId = getStudentIdForName(studentName);

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

    // 2. Strict Enum Mapping (PRESENT, ABSENT, EXCUSED, LATE)
    const strictStatus: AttendanceStatus =
      newStatus === 'present'
        ? AttendanceStatus.PRESENT
        : newStatus === 'excused'
        ? AttendanceStatus.EXCUSED
        : AttendanceStatus.ABSENT;

    // 3. Update attendance records (Non-destructive UPSERT in local state)
    const nowIso = new Date().toISOString();
    setRecords(prev => {
      const updated = [...prev];
      const existingIdx = updated.findIndex(r => r && (r.studentName || r.name) && (r?.studentName || r?.name || '').toLowerCase().trim() === studentKey && r.classDay === classDayId);

      if (newStatus === 'unmarked') {
        if (existingIdx >= 0) {
          updated.splice(existingIdx, 1);
        }
      } else {
        const isPresent = strictStatus === AttendanceStatus.PRESENT;
        const recordData: AttendanceRecord = {
          studentId: resolvedStudentId,
          sessionId: classDayId,
          studentName: studentName,
          name: studentName,
          classDay: classDayId,
          status: strictStatus,
          present: isPresent,
          score: existingIdx >= 0 ? updated[existingIdx].score : '',
          timestamp: nowIso,
          capturedAt: existingIdx >= 0 ? (updated[existingIdx].capturedAt || nowIso) : nowIso,
          manualOverride: true,
        };

        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            ...recordData,
          };
        } else {
          updated.push(recordData);
        }
      }
      return updated;
    });

    // 4. Asynchronously persist check-in / override to backend via transactional API
    if (newStatus !== 'unmarked') {
      portalApiClient
        .recordCheckin({
          studentId: resolvedStudentId,
          studentName,
          sessionId: classDayId,
          date: day?.name || classDayId,
          status: strictStatus,
          manualOverride: true,
        })
        .catch(apiErr => {
          console.warn('Backend attendance checkin sync notice:', apiErr);
        });
    }
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
    const upsertedBatch: AttendanceRecord[] = [];

    // Non-destructive transactional local UPSERT:
    // Completely eliminates "delete all records for date"
    setRecords(prev => {
      let updated = [...prev];
      newRecords.forEach(newRec => {
        const studentKey = (newRec.name || newRec.studentName || '').toLowerCase().trim();
        const existingIdx = updated.findIndex(
          r => r && (r.studentName || r.name || '').toLowerCase().trim() === studentKey && r.classDay === newRec.classDay
        );

        if (existingIdx >= 0) {
          if (isAttendanceLocked(updated[existingIdx], newRec.classDay)) {
            lockedCount++;
            return;
          }
          const strictStatus = newRec.present ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT;
          const merged: AttendanceRecord = {
            ...updated[existingIdx],
            studentId: newRec.studentId || updated[existingIdx].studentId || getStudentIdForName(newRec.name || newRec.studentName || ''),
            sessionId: newRec.classDay,
            status: strictStatus,
            present: newRec.present,
            manualOverride: true,
            timestamp: newRec.timestamp || nowIso,
            capturedAt: updated[existingIdx].capturedAt || nowIso
          };
          updated[existingIdx] = merged;
          upsertedBatch.push(merged);
        } else {
          const strictStatus = newRec.present ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT;
          const item: AttendanceRecord = {
            ...newRec,
            studentId: newRec.studentId || getStudentIdForName(newRec.name || newRec.studentName || ''),
            sessionId: newRec.classDay,
            status: strictStatus,
            capturedAt: newRec.capturedAt || nowIso,
            timestamp: newRec.timestamp || nowIso,
            manualOverride: true
          };
          updated.push(item);
          upsertedBatch.push(item);
        }
      });
      return updated;
    });

    // Asynchronously dispatch transactional batch UPSERT to backend API
    // Groups by session/date and calls UPSERT attendance_record inside an atomic transaction
    if (upsertedBatch.length > 0) {
      const byClassDay = new Map<string, AttendanceRecord[]>();
      upsertedBatch.forEach(rec => {
        const key = rec.classDay || 'session';
        if (!byClassDay.has(key)) byClassDay.set(key, []);
        byClassDay.get(key)!.push(rec);
      });

      byClassDay.forEach((dayRecords, dayId) => {
        const dayObj = classDays.find(d => d.id === dayId || d.name === dayId);
        const sessionDate = dayObj ? dayObj.name : dayId;
        portalApiClient
          .recordBatchAttendance({
            date: sessionDate,
            sessionId: dayId,
            sessionTitle: dayObj?.name || dayId,
            records: dayRecords.map(r => ({
              studentId: r.studentId,
              studentName: r.name || r.studentName,
              status: r.present ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
              manualOverride: true,
            })),
          })
          .catch(batchErr => {
            console.warn('Backend transactional batch upsert notice:', batchErr);
          });
      });
    }

    if (lockedCount > 0) {
      setError(`Notice: ${lockedCount} student record(s) are locked (>24h old) and were preserved.`);
    }

    logActivity({
      actor: appUser?.name || 'Admin',
      role: appUser?.role === 'student' ? 'student' : 'admin',
      actionCategory: 'Attendance Override',
      actionTitle: 'Batch Zoom Attendance Registered',
      details: `Registered Zoom attendance for ${newRecords.length} students (${lockedCount} locked records preserved via non-destructive UPSERT)`
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
        const nameA = (a?.name || '').trim();
        const nameB = (b?.name || '').trim();

        const getLastName = (fullName: string) => {
          const parts = fullName.trim().split(/\s+/);
          return parts.length > 1 ? parts[parts.length - 1] : fullName;
        };

        if (sortBy === 'name_asc') {
          return nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true });
        }
        if (sortBy === 'name_desc') {
          return nameB.localeCompare(nameA, undefined, { sensitivity: 'base', numeric: true });
        }
        if (sortBy === 'last_name_asc') {
          const lastCmp = getLastName(nameA).localeCompare(getLastName(nameB), undefined, { sensitivity: 'base', numeric: true });
          return lastCmp !== 0 ? lastCmp : nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true });
        }
        if (sortBy === 'last_name_desc') {
          const lastCmp = getLastName(nameB).localeCompare(getLastName(nameA), undefined, { sensitivity: 'base', numeric: true });
          return lastCmp !== 0 ? lastCmp : nameB.localeCompare(nameA, undefined, { sensitivity: 'base', numeric: true });
        }
        if (sortBy === 'rate_desc') {
          return b.rate - a.rate || nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true });
        }
        if (sortBy === 'rate_asc') {
          return a.rate - b.rate || nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true });
        }
        if (sortBy === 'score_desc') {
          return ((b.avgScore ?? 0) - (a.avgScore ?? 0)) || nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true });
        }
        if (sortBy === 'score_asc') {
          return ((a.avgScore ?? 0) - (b.avgScore ?? 0)) || nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true });
        }
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
      <div className="flex flex-col min-h-screen w-full app-ambient-shell text-slate-900 dark:text-slate-100 font-sans p-2.5 sm:p-5 md:p-6 pb-mobile-nav md:pb-6 select-text">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs px-4 py-2.5 rounded-xl mb-3 flex items-center justify-between shadow-xs animate-fade-slide-up flex-shrink-0" role="status" aria-live="polite">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600" />
            <span className="font-medium">Working offline — changes are saved locally and will sync when connection restores.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOfflineDrawer(true)}
              className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
            >
              Open Sync Queue
            </button>
            <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-semibold">PWA Ready</span>
          </div>
        </div>
      )}



      {cloudSyncError && !isOffline && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-2.5 rounded-xl mb-3 flex flex-wrap items-center justify-between gap-3 shadow-xs" role="alert">
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
        <div className="bg-orange-50 border border-orange-200 text-orange-900 text-xs px-4 py-2.5 rounded-xl mb-3 flex flex-wrap items-center justify-between gap-3 shadow-xs" role="alert">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-orange-600" aria-hidden="true" />
            <span className="font-medium">{pendingConflicts.length} attendance sync conflict{pendingConflicts.length === 1 ? '' : 's'} need review.</span>
          </div>
          <button type="button" onClick={() => handleNavigate('attendance')} className="md-btn-tonal text-xs px-3 py-1.5 shrink-0">Review conflicts</button>
        </div>
      )}

      {supabaseTableMissing && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3 text-slate-800 animate-fade-slide-up flex-shrink-0">
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
  version integer not null default 1,
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
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs px-4 py-2.5 rounded-xl mb-3 flex items-center justify-between shadow-xs animate-fade-slide-up flex-shrink-0">
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
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs px-4 py-2.5 rounded-xl mb-3 flex items-center justify-between gap-3 shadow-xs animate-fade-slide-up flex-shrink-0">
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

      {/* MD3 AppBar — extracted into AppHeader component */}
      <AppHeader
        activeCohort={activeCohort}
        onOpenCohortModal={() => setShowCohortModal(true)}
        onGoHome={() => setActiveErpTab('home')}
        appUser={appUser}
        onOpenLogin={() => setShowLoginModal(true)}
        onLogout={handleAppLogout}
        onNavigate={handleNavigate}
        unreadMessagesCount={unreadMessagesCount}
        filteredNotifications={filterNotificationsForUser(notifications, appUser?.role, appUser?.studentName || appUser?.name)}
        onMarkNotifAsRead={handleMarkNotifAsRead}
        onMarkAllNotifsAsRead={handleMarkAllNotifsAsRead}
        onClearNotifs={handleClearNotifs}
        onSelectNotif={handleSelectNotif}
        onTriggerNotifScan={handleRunNotificationScan}
        onAddTestNotif={handleAddTestNotif}
        onOpenIntro={() => setShowIntro(true)}
        onOpenPresentation={() => setShowPresentationModal(true)}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onOpenRoleSwitch={() => setShowRoleMenu(true)}
        isCloudSyncing={isCloudSyncing}
        onPushToCloud={handlePushToCloud}
        dataSource={dataSource}
        isLoading={isLoading}
        onLoadSheets={handleLoadSheets}
        onOpenBroadcast={() => setShowBatchBroadcastModal(true)}
        onOpenAuditLog={() => setShowAdminAuditModal(true)}
        onOpenUserManagement={() => setShowUserManagementModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenHelp={() => setShowGuideModal(true)}
        onToggleMobileDrawer={() => setShowMobileMoreMenu(prev => !prev)}
        onOpenOfflineDrawer={() => setShowOfflineDrawer(true)}
        onOpenPINCheckin={() => setShowPINCheckinModal(true)}
      />


      {/* Sacred Scripture Motto Ribbon */}
      <div className="scripture-ribbon relative overflow-hidden px-3 py-1.5 text-center text-[10px] sm:text-[11px] text-slate-700 dark:text-[#dfc18b] font-medium tracking-wide flex items-center justify-center gap-2 rounded-xl mb-3 shadow-2xs border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent animate-shimmer pointer-events-none" />
        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-gentle-float" />
        {/* truncate prevents overflow on very narrow screens (320px) */}
        <span className="truncate min-w-0 font-semibold relative z-10">"Study to shew thyself approved unto God, a workman that needeth not to be ashamed" — 2 Timothy 2:15</span>
        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 hidden md:inline animate-gentle-float" />
      </div>

      {/* Desktop Navigation — sticky offset uses CSS var so header height changes stay in sync */}
      {appUser && (
        <nav aria-label="Primary portal navigation" className="hidden md:block sticky top-[var(--header-h)] z-30 mb-4 py-0.5 pointer-events-auto">
          <div className="flex items-center gap-0.5 p-1 bg-slate-100/95 dark:bg-[#08182c]/95 backdrop-blur-md rounded-xl w-fit shadow-xs border border-slate-200/60 dark:border-[#1a385c]">
            {[
              { tab: 'home', label: 'Home', Icon: Sparkles },
              { tab: 'attendance', label: 'Attendance', Icon: UserCheck },
              { tab: 'students', label: 'Students', Icon: GraduationCap, adminOnly: true },
              { tab: 'courses', label: 'Courses', Icon: BookOpen },
              { tab: 'exams', label: 'Exams', Icon: Award },
              { tab: 'notes', label: 'Notes & Bible', Icon: BookOpenCheck },
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
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer active:opacity-80 ${
                    isActive
                      ? 'bg-white dark:bg-[#0e2540] text-[#023264] dark:text-white shadow-xs font-bold border border-[#025798]/20 dark:border-[#0277b8]/30'
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
      <main id="main-workspace" tabIndex={-1} className="flex flex-col flex-1 gap-6 relative min-h-[calc(100vh-220px)] sm:min-h-[calc(100vh-240px)] pb-24 md:pb-8">
        <AnimatePresence mode="wait">
          {activeErpTab === 'home' && (
            <motion.div
              key="home"
              variants={pageFadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageFadeTransition}
              className="flex-1 w-full"
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
                  const sLower = (s.name || '').toLowerCase().trim();
                  const rawRec = records.find(r => {
                    if (!r || !r.score) return false;
                    const rName = (r.name || r.studentName || '').toString().trim();
                    const rLower = rName.toLowerCase().trim();
                    const rCanonical = (MANUAL_ALIASES[rLower] || rName).toLowerCase().trim();
                    return rLower === sLower || rCanonical === sLower;
                  });
                  return {
                    name: s.name,
                    scoreStr: rawRec?.score || (s.avgScore !== null ? `${Math.round(s.avgScore)}%` : ''),
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
                    studentName={appUser?.name || selectedStudent?.name || 'General Student'}
                    onOpenNotes={() => handleNavigate('notes')}
                    onOpenInBible={() => handleNavigate('notes')}
                    onOpenDiagnostics={appUser?.role === 'admin' ? () => setShowDiagnosticModal(true) : undefined}
                  />
              </ErrorBoundary>
            </Suspense>
            </motion.div>
          )}

          {activeErpTab === 'notes' && (
            <motion.div
              key="notes"
              variants={pageFadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageFadeTransition}
              className="flex-1 w-full"
            >
              <ErrorBoundary label="Student Notes & AMP Bible Tab">
                <StudentNotesBibleTab
                  currentStudentName={appUser?.studentName || appUser?.name || 'Student'}
                  userRole={appUser?.role}
                  availableClassDays={effectiveClassDays}
                  onNavigateTab={(tab: string) => handleNavigate(tab as TabType)}
                />
              </ErrorBoundary>
            </motion.div>
          )}

          {activeErpTab === 'payments' && appUser?.role === 'admin' && (
            <motion.div
              key="finance"
              variants={pageFadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageFadeTransition}
              className="flex-1 w-full"
            >
              <ErrorBoundary label="Finance Page">
                <FinancePage />
              </ErrorBoundary>
            </motion.div>
          )}

          {activeErpTab === 'payments' && appUser?.role === 'student' && (
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
                isAdmin={false}
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

          {/* Attendance Tab */}
          {activeErpTab === 'attendance' && (
            <motion.div
              key="attendance"
              variants={pageFadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageFadeTransition}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col w-full"
            >
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
                <ErrorBoundary label="Attendance Tab">
                  <AttendanceTab
                    appUser={appUser}
                    currentStudentPortalData={currentStudentPortalData}
                    classDays={classDays}
                    rubricScores={rubricScores}
                    onUpdateStudentPhoto={handleUpdateStudentPhoto}
                    onRequestTranscript={(s) => {
                      const found = uniqueStudents.find(u => u.name === s.name);
                      if (found) {
                        setSelectedStudent(found);
                        setShowStudentTranscriptModal(true);
                      }
                    }}
                    onRequestCertificate={(s) => {
                      setCertificateData({
                        studentName: s.name,
                        awardTitle: s.rate >= 100 ? 'Perfect Attendance Honor Distinction' : 'Ministry Academic Completion Award',
                        criteria: `Demonstrated commitment with ${s.rate.toFixed(1)}% class attendance.`,
                        rate: s.rate,
                        avgScore: s.avgScore ?? undefined
                      });
                      setShowCertificateModal(true);
                    }}
                    atRiskThreshold={atRiskThreshold}
                    satisfactoryThreshold={satisfactoryThreshold}
                    records={records}
                    uniqueStudents={uniqueStudents}
                    excusedAbsences={excusedAbsences}
                    studentPhotos={studentPhotos}
                    studentNotes={studentNotes}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    dateRangeFilter={dateRangeFilter}
                    setDateRangeFilter={setDateRangeFilter}
                    selectedModule={selectedModule}
                    setSelectedModule={setSelectedModule}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    densityMode={densityMode}
                    setDensityMode={setDensityMode}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    selectedStudent={selectedStudent}
                    setSelectedStudent={setSelectedStudent}
                    selectedStudentNames={selectedStudentNames}
                    setSelectedStudentNames={setSelectedStudentNames}
                    filteredAndSortedStudents={filteredAndSortedStudents}
                    effectiveClassDays={effectiveClassDays}
                    classDayStats={classDayStats}
                    trendChartData={trendChartData}
                    getStudentBadges={getStudentBadges}
                    handleToggleStudentAttendance={handleToggleStudentAttendance}
                    handleAddClassDay={handleAddClassDay}
                    handleEditClassDayTitle={handleEditClassDayTitle}
                    handleDeleteClassDay={handleDeleteClassDay}
                    handleClearClassDayRecords={handleClearClassDayRecords}
                    handleSaveStudentNote={handleSaveStudentNote}
                    handleToggleExcusedAbsence={handleToggleExcusedAbsence}
                    handleSelectAllDisplayed={handleSelectAllDisplayed}
                    handleSelectAllAtRisk={handleSelectAllAtRisk}
                    clearBatchSelection={clearBatchSelection}
                    handleExportCSV={handleExportCSV}
                    handleLoadDemo={handleLoadDemo}
                    isLoading={isLoading}
                    dataSource={dataSource}
                    error={error}
                    showReportModal={showReportModal}
                    setShowReportModal={setShowReportModal}
                    showEmailDraftModal={showEmailDraftModal}
                    setShowEmailDraftModal={setShowEmailDraftModal}
                    copiedEmail={copiedEmail}
                    setCopiedEmail={setCopiedEmail}
                    showStudentTranscriptModal={showStudentTranscriptModal}
                    setShowStudentTranscriptModal={setShowStudentTranscriptModal}
                    showCertificateModal={showCertificateModal}
                    setShowCertificateModal={setShowCertificateModal}
                    showBatchEmailModal={showBatchEmailModal}
                    setShowBatchEmailModal={setShowBatchEmailModal}
                    certificateData={certificateData}
                    setCertificateData={setCertificateData}
                    isGeneratingPDF={isGeneratingPDF}
                    showClassDaysModal={showClassDaysModal}
                    setShowClassDaysModal={setShowClassDaysModal}
                    liveCheckinDayId={liveCheckinDayId}
                    setLiveCheckinDayId={setLiveCheckinDayId}
                    handleClearStudentAttendanceRecords={handleClearStudentAttendanceRecords}
                    selectedReportLevel={selectedReportLevel}
                    setSelectedReportLevel={setSelectedReportLevel}
                    selectedReportAttendanceFilter={selectedReportAttendanceFilter}
                    setSelectedReportAttendanceFilter={setSelectedReportAttendanceFilter}
                    toggleSelectStudent={toggleSelectStudent}
                    setRecords={setRecords}
                    setExcusedAbsences={setExcusedAbsences}
                  />
                </ErrorBoundary>
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>

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
      </main>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          selectedStudent={selectedStudent}
          onClose={() => {
            setSelectedStudent(null);
            setShowEmailDraftModal(false);
          }}
          studentNotes={studentNotes}
          excusedAbsences={excusedAbsences}
          effectiveClassDays={effectiveClassDays}
          classDays={classDays}
          studentPhotos={studentPhotos}
          satisfactoryThreshold={satisfactoryThreshold}
          atRiskThreshold={atRiskThreshold}
          getStudentBadges={getStudentBadges}
          rubricScores={rubricScores}
          setRubricScores={setRubricScores}
          onOpenTranscript={() => setShowStudentTranscriptModal(true)}
          onOpenCertificate={(certData) => {
            setCertificateData(certData);
            setShowCertificateModal(true);
          }}
          handleToggleStudentAttendance={handleToggleStudentAttendance}
          handleToggleExcusedAbsence={handleToggleExcusedAbsence}
          handleSaveStudentNote={handleSaveStudentNote}
          handleDeleteStudent={handleDeleteStudent}
          handleClearStudentAttendanceRecords={handleClearStudentAttendanceRecords}
          appUser={appUser}
        />
      )}
      {/* Printable Report Modal */}
      <PrintableReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        uniqueStudents={uniqueStudents}
        effectiveClassDays={effectiveClassDays}
        atRiskThreshold={atRiskThreshold}
        satisfactoryThreshold={satisfactoryThreshold}
        isGeneratingPDF={isGeneratingPDF}
        handleExportPDF={handleExportPDF}
        selectedReportAttendanceFilter={selectedReportAttendanceFilter}
        setSelectedReportAttendanceFilter={setSelectedReportAttendanceFilter}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        userRole={appUser?.role || 'user'}
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
        onOpenCohortManager={() => setShowCohortModal(true)}
        onPhotosMigrated={handlePushToCloud}
      />

      {/* Cohort Management Modal */}
      <CohortManagementModal
        isOpen={showCohortModal}
        onClose={() => setShowCohortModal(false)}
        cohorts={cohorts}
        activeCohortId={activeCohortId}
        onSelectActiveCohort={(id) => {
          setActiveCohortId(id);
          setShowCohortModal(false);
        }}
        onSaveCohort={handleSaveCohort}
        onDeleteCohort={handleDeleteCohort}
        onArchiveToggle={handleArchiveToggleCohort}
        students={uniqueStudents}
        courses={courses}
        userRole={appUser?.role || 'user'}
        onAssignStudentCohort={handleAssignStudentCohort}
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
      <GuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />

      {/* Individual Student Academic Transcript PDF Modal */}
      <StudentTranscriptModal
        isOpen={showStudentTranscriptModal}
        onClose={() => setShowStudentTranscriptModal(false)}
        selectedStudent={selectedStudent}
        effectiveClassDays={effectiveClassDays}
        rubricScores={rubricScores}
        excusedAbsences={excusedAbsences}
        satisfactoryThreshold={satisfactoryThreshold}
        atRiskThreshold={atRiskThreshold}
        isGeneratingPDF={isGeneratingPDF}
        handleExportPDF={handleExportPDF}
        handleToggleStudentAttendance={handleToggleStudentAttendance}
        appUser={appUser}
      />

      {/* Milestone / Achievement Certificate Modal */}
      <CertificateModal
        isOpen={showCertificateModal}
        onClose={() => {
          setShowCertificateModal(false);
          setCertificateData(null);
        }}
        certificateData={certificateData}
        isGeneratingPDF={isGeneratingPDF}
        handleExportPDF={handleExportPDF}
      />

      {/* 2. Batch At-Risk Email Notice Modal */}
      <BatchEmailModal
        isOpen={showBatchEmailModal}
        onClose={() => setShowBatchEmailModal(false)}
        selectedStudentNames={selectedStudentNames}
        uniqueStudents={uniqueStudents}
        effectiveClassDays={effectiveClassDays}
        atRiskThreshold={atRiskThreshold}
        clearBatchSelection={() => setSelectedStudentNames([])}
      />

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
      <MobileMoreMenuDrawer
        isOpen={showMobileMoreMenu}
        onClose={() => setShowMobileMoreMenu(false)}
        activeErpTab={activeErpTab}
        setActiveErpTab={setActiveErpTab}
        appUser={appUser}
        uniqueStudentsCount={uniqueStudents.length}
        unreadMessagesCount={unreadMessagesCount}
        setShowLoginModal={setShowLoginModal}
        setShowLiveCheckinModal={setShowLiveCheckinModal}
        liveCheckinDayId={liveCheckinDayId}
        setLiveCheckinDayId={setLiveCheckinDayId}
        classDays={classDays}
        setShowIntro={setShowIntro}
        setShowCommandPalette={setShowCommandPalette}
        setShowSettingsModal={setShowSettingsModal}
        setShowRoleMenu={setShowRoleMenu}
      />

      {/* Role-Based Access Control (RBAC) & Persona Switcher Modal */}
      {showRoleMenu && (
        <RoleManagementModal
          isOpen={showRoleMenu}
          onClose={() => setShowRoleMenu(false)}
          currentUser={appUser}
          onSwitchRole={handleQuickRoleSwitch}
        />
      )}

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
          appUser={appUser}
        />
      )}

      {/* 30-Second Student Presentation Demo Video Modal */}
      <AppPresentationModal
        isOpen={showPresentationModal}
        onClose={() => setShowPresentationModal(false)}
        onNavigateTab={(tab) => setActiveErpTab(tab)}
      />

      {/* Portal Footer */}
      <PortalFooter
        appUser={appUser}
        onOpenGuide={() => setShowGuideModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Floating Active Quiz Banner (Students Only) */}
      <FloatingQuizBanner
        appUser={appUser}
        activeQuizzesList={activeQuizzesList}
        showFloatingQuizBanner={showFloatingQuizBanner}
        onDismiss={() => setShowFloatingQuizBanner(false)}
        onTakeQuiz={() => setActiveErpTab('exams')}
      />

      {/* Offline Sync Queue Drawer */}
      <OfflineSyncDrawer
        isOpen={showOfflineDrawer}
        onClose={() => setShowOfflineDrawer(false)}
        isOnline={!isOffline}
        onTriggerFullSync={async () => {
          await handlePushToCloud();
        }}
      />

      {/* Dynamic Rotating PIN & QR Check-in Modal */}
      {showPINCheckinModal && (
        <PINCheckinQRModal
          classDayName={CURRICULUM_CLASS_DAYS[0]?.name || "Classroom Session"}
          classDayId={CURRICULUM_CLASS_DAYS[0]?.id || "day_1"}
          onClose={() => setShowPINCheckinModal(false)}
        />
      )}

      {/* Mobile Bottom Navigation Dock */}
      <MobileBottomNav
        appUser={appUser}
        activeErpTab={activeErpTab}
        handleNavigate={handleNavigate}
        showMobileMoreMenu={showMobileMoreMenu}
        setShowMobileMoreMenu={setShowMobileMoreMenu}
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* Floating Back-To-Top Button (#4) */}
      <BackToTopButton />
    </div>
    </>
  );
}
