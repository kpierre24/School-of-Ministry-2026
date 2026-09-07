import { useState, useEffect, useMemo, useRef } from 'react';
import { User } from 'firebase/auth';
import { 
  TabType, 
  AppNotification, 
  CustomAssignment, 
  AssignmentSubmission, 
  AcademicLevel, 
  Course, 
  ScheduleItem, 
  LibraryResource, 
  MediaResource, 
  PaymentRecord, 
  ClassDay, 
  AppMessage, 
  AttendanceRecord, 
  Cohort, 
  DEFAULT_COHORTS, 
  UserRole 
} from '../types';
import { AppUser, UserCredential, generateStudentUsername, isMatchingCredential, DEFAULT_USER_PASSWORD } from '../lib/userAuth';
import { 
  loadAuthoritativeState as loadFromSupabase, 
  saveAuthoritativeState as saveToSupabase 
} from '../services/dataSyncService';
import { updatePasswordInSupabase } from '../lib/supabaseAuth';
import { logoutUserSession as logout, logoutUserSession as supabaseLogout } from '../services/authService';
import { CURRICULUM_CLASS_DAYS, MASTER_ENROLLED_STUDENTS } from '../data/constants';
import { DEMO_ATTENDANCE_RECORDS, RAW_CURRICULUM_RECORDS } from '../data/fixtures';
import { getStudentPaymentDetails, StudentPaymentSummary } from '../lib/paymentUtils';
import { logActivity } from '../lib/auditLogger';
import { INITIAL_COURSES } from '../components/CoursesTab';
import { INITIAL_ASSIGNMENTS, INITIAL_SUBMISSIONS } from '../components/ExamsTab';
import { INITIAL_SCHEDULE } from '../components/ScheduleTab';
import { INITIAL_RESOURCES } from '../components/LibraryTab';
import { INITIAL_PAYMENTS } from '../components/PaymentTab';
import { INITIAL_MESSAGES } from '../components/MessagesTab';
import { DEFAULT_FACULTY_TEACHERS } from '../components/HomeTab';
import { DEFAULT_PRESET_MEDIA } from '../components/ClassroomMediaPlayer';

const EXCLUDED_STUDENTS = [
  'gale agrant',
  'gillian selkridge',
  'sam selk',
];

const MANUAL_ALIASES: Record<string, string> = {
  'shellon liddel': 'Shellon Liddel',
  'shellon liddell': 'Shellon Liddel',
  'shellon massiah': 'Shellon Liddel',
  'niomi': 'Niomi Loverne Joseph Marksman',
  'niomi marksman': 'Niomi Loverne Joseph Marksman',
  'krystal mohammed': 'Krystal Mohammed',
  'vanessa': 'Vanessa Mohammed',
  'denise edwards': 'Denise Edwards',
  'kabrina': 'Kabrina Morris-Jack',
  'mishael daniel': 'Mishael Daniel',
  'colette blackburn joseph': 'Colette Blackburne Joseph',
  'ingrid': 'Ingrid Bonval-Butcher',
  'julie charles': 'Julie-Ann Fernandes-Charles',
  'marlene walker': 'Marlene Walker-Castle',
};

const isExcludedStudent = (name?: string) => {
  if (!name || typeof name !== 'string') return false;
  const lower = name.toLowerCase().trim();
  return EXCLUDED_STUDENTS.some(excluded => lower.includes(excluded));
};

export function usePortalState() {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [userCredentials, setUserCredentials] = useState<UserCredential[]>(() => {
    try {
      const saved = localStorage.getItem('hteim_user_credentials');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [activeErpTab, setActiveErpTab] = useState<TabType>('home');
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem('hteim_intro_shown');
    } catch {
      return true;
    }
  });

  // Modal Visibility States
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);
  const [showAdminAuditModal, setShowAdminAuditModal] = useState<boolean>(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState<boolean>(false);
  const [showPresentationModal, setShowPresentationModal] = useState<boolean>(false);
  const [showOfflineDrawer, setShowOfflineDrawer] = useState<boolean>(false);
  const [showPINCheckinModal, setShowPINCheckinModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showLiveCheckinModal, setShowLiveCheckinModal] = useState<boolean>(false);
  const [liveCheckinDayId, setLiveCheckinDayId] = useState<string>('day_1');

  // ERP Domain Data States
  const [records, setRecords] = useState<AttendanceRecord[]>(DEMO_ATTENDANCE_RECORDS);
  const [classDays, setClassDays] = useState<ClassDay[]>(CURRICULUM_CLASS_DAYS);
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});
  const [excusedAbsences, setExcusedAbsences] = useState<Record<string, boolean>>({});
  const [rubricScores, setRubricScores] = useState<Record<string, any>>({});
  const [deletedStudentNames, setDeletedStudentNames] = useState<string[]>([]);
  const [studentPhotos, setStudentPhotos] = useState<Record<string, string>>({});
  const [studentLevels, setStudentLevels] = useState<Record<string, AcademicLevel>>({});
  const [customAssignments, setCustomAssignments] = useState<CustomAssignment[]>(INITIAL_ASSIGNMENTS);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(INITIAL_SUBMISSIONS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(INITIAL_SCHEDULE);
  const [libraryResources, setLibraryResources] = useState<LibraryResource[]>(INITIAL_RESOURCES);
  const [classroomMedia, setClassroomMedia] = useState<MediaResource[]>(DEFAULT_PRESET_MEDIA);
  const [facultyTeachers, setFacultyTeachers] = useState(DEFAULT_FACULTY_TEACHERS);
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [messages, setMessages] = useState<AppMessage[]>(INITIAL_MESSAGES);
  const [syncedBannerMessage, setSyncedBannerMessage] = useState<string | null>(null);

  // Outstanding Payment Banner State
  const [showOutstandingPaymentBanner, setShowOutstandingPaymentBanner] = useState<boolean>(false);
  const [studentPaymentSummary, setStudentPaymentSummary] = useState<StudentPaymentSummary | null>(null);

  useEffect(() => {
    if (appUser && appUser.role === 'student') {
      const sName = appUser.studentName || appUser.name;
      const summary = getStudentPaymentDetails(sName);
      setStudentPaymentSummary(summary);
      setShowOutstandingPaymentBanner(summary.hasOutstanding);
    } else {
      setShowOutstandingPaymentBanner(false);
      setStudentPaymentSummary(null);
    }
  }, [appUser]);

  // Auth Handlers
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
      setShowOutstandingPaymentBanner(summary.hasOutstanding);
    }
  };

  const handleAppLogout = async () => {
    const prevUser = appUser;
    try { await supabaseLogout(); } catch (e) {}
    try { await logout(); } catch (e) {}
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

  const handleQuickRoleSwitch = (role: UserRole | string, customName?: string, studentIdChoice?: string) => {
    let newUser: AppUser;
    const cleanRole = (role || 'student') as UserRole;

    if (cleanRole === 'super_admin') {
      newUser = { id: 'u-super-admin', username: 'superadmin', name: customName || 'Apostle Kendell Pierre', role: 'super_admin', email: 'kpierre24@gmail.com' };
    } else if (cleanRole === 'admin') {
      newUser = { id: 'u-admin', username: 'admin', name: customName || 'Administrator Sarah', role: 'admin', email: 'admin@hteim.edu' };
    } else if (cleanRole === 'registrar') {
      newUser = { id: 'u-registrar', username: 'registrar', name: customName || 'Dr. Evelyn Registrar', role: 'registrar', email: 'registrar@hteim.edu' };
    } else if (cleanRole === 'lecturer' || cleanRole === 'teacher') {
      newUser = { id: 'u-lecturer', username: 'lecturer', name: customName || 'Rev. Dr. Matthew Faculty', role: 'lecturer', email: 'lecturer@hteim.edu', assignedCourses: ['SOM-101', 'SOM-102'] };
    } else if (cleanRole === 'finance_officer') {
      newUser = { id: 'u-finance', username: 'finance', name: customName || 'Minister David Bursar', role: 'finance_officer', email: 'finance@hteim.edu' };
    } else if (cleanRole === 'librarian') {
      newUser = { id: 'u-librarian', username: 'librarian', name: customName || 'Sister Grace Librarian', role: 'librarian', email: 'librarian@hteim.edu' };
    } else if (cleanRole === 'viewer') {
      newUser = { id: 'u-viewer', username: 'viewer', name: customName || 'Guest Observer', role: 'viewer', email: 'guest@hteim.edu' };
    } else {
      const chosenName = customName || MASTER_ENROLLED_STUDENTS[0] || 'Aaron Miller';
      newUser = {
        id: `u-student-${chosenName.toLowerCase().replace(/\s+/g, '-')}`,
        username: generateStudentUsername(chosenName),
        name: chosenName,
        role: 'student',
        studentName: chosenName,
        studentId: studentIdChoice || 'HTEIM-2026-0001',
        email: `${generateStudentUsername(chosenName).toLowerCase()}@student.hteim.edu`
      };
    }
    setAppUser(newUser);
    setShowRoleMenu(false);
    setSyncedBannerMessage(`🎭 Role Switch: Previewing portal as ${cleanRole.toUpperCase().replace('_', ' ')} (${newUser.name})`);
    setTimeout(() => setSyncedBannerMessage(null), 4500);
  };

  const handleNavigate = (tab: TabType) => {
    setActiveErpTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url.toString());
    }
  };

  return {
    user,
    appUser,
    setAppUser,
    userCredentials,
    setUserCredentials,
    activeErpTab,
    setActiveErpTab: handleNavigate,
    showIntro,
    setShowIntro,
    showLoginModal,
    setShowLoginModal,
    showRoleMenu,
    setShowRoleMenu,
    showAdminAuditModal,
    setShowAdminAuditModal,
    showUserManagementModal,
    setShowUserManagementModal,
    showCommandPalette,
    setShowCommandPalette,
    showMobileMoreMenu,
    setShowMobileMoreMenu,
    showSettingsModal,
    setShowSettingsModal,
    showDiagnosticModal,
    setShowDiagnosticModal,
    showPresentationModal,
    setShowPresentationModal,
    showOfflineDrawer,
    setShowOfflineDrawer,
    showPINCheckinModal,
    setShowPINCheckinModal,
    showGuideModal,
    setShowGuideModal,
    showLiveCheckinModal,
    setShowLiveCheckinModal,
    liveCheckinDayId,
    setLiveCheckinDayId,
    records,
    setRecords,
    classDays,
    setClassDays,
    studentNotes,
    setStudentNotes,
    excusedAbsences,
    setExcusedAbsences,
    rubricScores,
    setRubricScores,
    deletedStudentNames,
    setDeletedStudentNames,
    studentPhotos,
    setStudentPhotos,
    studentLevels,
    setStudentLevels,
    customAssignments,
    setCustomAssignments,
    submissions,
    setSubmissions,
    notifications,
    setNotifications,
    courses,
    setCourses,
    schedules,
    setSchedules,
    libraryResources,
    setLibraryResources,
    classroomMedia,
    setClassroomMedia,
    facultyTeachers,
    setFacultyTeachers,
    payments,
    setPayments,
    messages,
    setMessages,
    syncedBannerMessage,
    setSyncedBannerMessage,
    showOutstandingPaymentBanner,
    setShowOutstandingPaymentBanner,
    studentPaymentSummary,
    handleAppLoginSuccess,
    handleAppLogout,
    handleQuickRoleSwitch,
    handleNavigate
  };
}

export default usePortalState;
