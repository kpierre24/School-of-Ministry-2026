import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import hteimBannerAsset from '../assets/images/regenerated_image_1785852170450.png';
import biblicalHeroAsset from '../assets/images/caribbean_bible_school_clean_1786453783620.jpg';
import gillianSelkridgeAsset from '../assets/images/gillian_selkridge_1786642912894.jpg';
import samuelSelkridgeAsset from '../assets/images/samuel_selkridge_1786642928268.jpg';
import galeGrantAsset from '../assets/images/gale_grant_1786642942313.jpg';
import christyRubenAsset from '../assets/images/christy_ruben_1786642955859.jpg';
import garodAndrewsAsset from '../assets/images/garod_andrews_1786642969381.jpg';
import { LogoImage } from './LogoImage';
import { 
  BookOpen, 
  GraduationCap, 
  Award, 
  Calendar, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Trophy, 
  TrendingUp, 
  BookMarked,
  Clock,
  MapPin,
  Compass,
  CheckCircle2,
  Lock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Sliders,
  PenSquare,
  DollarSign,
  Cloud,
  RefreshCw,
  Database,
  Copy,
  Check,
  Share2,
  AlertCircle,
  ExternalLink,
  AlertTriangle,
  UserX,
  MessageSquare,
  Filter,
  BarChart2,
  PieChart,
  Activity,
  CheckCircle,
  Send,
  Search,
  Bell,
  ShieldAlert,
  Flame,
  Radio,
  Bookmark,
  Quote,
  FileText,
  Layers,
  Video,
  UserCheck,
  Edit3,
  LogOut,
  Settings
} from 'lucide-react';
import { TabType, StudentSummary, ClassDay, PaymentRecord, CustomAssignment, AssignmentSubmission, QuizAssignment, FacultyTeacher } from '../types';
import { FacultyManagerModal } from './FacultyManagerModal';
import { syncFacultyImagesToSupabase } from '../lib/supabaseClient';
import { AppUser } from '../lib/userAuth';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  Cell, 
  AreaChart,
  Area
} from 'recharts';
import { EmptyState } from './UXPrimitives';
import { Modal } from './Modal';

interface HomeTabProps {
  onNavigate: (tab: TabType) => void;
  appUser: AppUser | null;
  onOpenLogin: () => void;
  onLogout?: () => void;
  onOpenPresentationDemo?: () => void;
  studentsCount: number;
  students?: StudentSummary[];
  payments?: PaymentRecord[];
  classDays?: ClassDay[];
  records?: any[];
  coursesCount: number;
  classDaysCount: number;
  avgAttendanceRate: number;
  pendingAssignmentsCount?: number;
  uncollectedTuitionAmount?: number;
  libraryResourcesCount?: number;
  nextClassTitle?: string;
  isCloudSyncing?: boolean;
  cloudSyncError?: string | null;
  lastSyncedTime?: string | null;
  onPushToCloud?: () => Promise<void>;
  userEmail?: string | null;
  supabaseTableMissing?: boolean;
  onVerifySetup?: () => Promise<void>;
  atRiskThreshold?: number;
  customAssignments?: CustomAssignment[];
  submissions?: AssignmentSubmission[];
  onTakeQuiz?: (quiz: QuizAssignment) => void;
  facultyTeachers?: FacultyTeacher[];
  onSaveFacultyTeachers?: (newList: FacultyTeacher[]) => void;
}

export const DEFAULT_FACULTY_TEACHERS: FacultyTeacher[] = [
  {
    id: 'gillian-selkridge',
    name: 'Apostle Gillian Selkridge',
    title: 'Senior Apostle & School Director',
    role: 'Apostolic Oversight & Ministerial Governance',
    bio: 'Visionary founder of Heaven Touching Earth International Ministries. Overseeing apostolic alignment, ministerial ethics, and five-fold leadership equipping across the 6 core modules.',
    module: 'Module 1 & 6: Apostolic Governance',
    image: gillianSelkridgeAsset,
    badgeColor: 'bg-purple-100 text-purple-900 dark:bg-purple-900/90 dark:text-purple-100 border-purple-300 dark:border-purple-700'
  },
  {
    id: 'samuel-selkridge',
    name: 'Pastor Samuel Selkridge',
    title: 'Senior Pastor & Faculty Dean',
    role: 'Exegetical Theology & Pastoral Care',
    bio: 'Senior Pastor and Dean of Faculty with decades of pastoral devotion. Teaching deep scriptural hermeneutics, flock care, and foundational Christian doctrine.',
    module: 'Module 2: Exegetical Theology & Doctrine',
    image: samuelSelkridgeAsset,
    badgeColor: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/90 dark:text-indigo-100 border-indigo-300 dark:border-indigo-700'
  },
  {
    id: 'gale-grant',
    name: 'Pastor Gale Grant',
    title: 'Senior Instructor & Curriculum Chair',
    role: 'Systematic Theology & Church Ethics',
    bio: 'Leading curriculum development and systematic theology. Specialized in biblical worldview, ministerial integrity, and structured church administration.',
    module: 'Module 3: Systematic Theology & Ethics',
    image: galeGrantAsset,
    badgeColor: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/90 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700'
  },
  {
    id: 'christy-ruben',
    name: 'Pastor Christy Ruben',
    title: 'Lead Instructor & Student Mentor',
    role: 'Homiletics & Practical Preaching',
    bio: 'Dedicated to empowering ministers in the art of sermon preparation, spirit-led homiletics, pulpit decorum, and transformative community outreach.',
    module: 'Module 4: Homiletics & Practical Preaching',
    image: christyRubenAsset,
    badgeColor: 'bg-amber-100 text-amber-950 dark:bg-amber-900/90 dark:text-amber-100 border-amber-300 dark:border-amber-700'
  },
  {
    id: 'garod-andrews',
    name: 'Prophet Garod Andrews',
    title: 'Lead Instructor & Prophetic Department Head',
    role: 'Prophetic Ministry & Spiritual Protocol',
    bio: 'Equipping saints in spiritual discernment, prophetic protocol, intercessory prayer warfare, and operating with spiritual authority.',
    module: 'Module 5: Prophetic Ministry & Intercession',
    image: garodAndrewsAsset,
    badgeColor: 'bg-sky-100 text-sky-900 dark:bg-sky-900/90 dark:text-sky-100 border-sky-300 dark:border-sky-700'
  }
];

export const HomeTab: React.FC<HomeTabProps> = ({
  onNavigate,
  appUser,
  onOpenLogin,
  onLogout,
  onOpenPresentationDemo,
  studentsCount,
  students = [],
  payments = [],
  classDays = [],
  records = [],
  coursesCount,
  classDaysCount,
  avgAttendanceRate,
  pendingAssignmentsCount = 0,
  uncollectedTuitionAmount = 0,
  libraryResourcesCount = 6,
  nextClassTitle = 'Day 1',
  isCloudSyncing = false,
  cloudSyncError = null,
  lastSyncedTime = null,
  onPushToCloud,
  userEmail = null,
  supabaseTableMissing = false,
  onVerifySetup,
  atRiskThreshold = 75,
  customAssignments = [],
  submissions = [],
  onTakeQuiz,
  facultyTeachers: facultyTeachersProp,
  onSaveFacultyTeachers
}) => {
  const isStudent = appUser?.role === 'student';
  const isAdminOrTeacher = appUser?.role === 'admin' || appUser?.role === 'teacher';
  const isAdmin = appUser?.role === 'admin';

  // Active Quiz Link Copy Toast State
  const [copiedQuizLink, setCopiedQuizLink] = useState<string | null>(null);

  // Active Published Quizzes computation
  const activeQuizzes = useMemo(() => {
    return customAssignments.filter(a => a.type === 'quiz' && a.quizData && a.quizData.isPublished !== false);
  }, [customAssignments]);

  // Internal Faculty Teachers State (Fallback if prop not provided)
  const [internalFacultyTeachers, setInternalFacultyTeachers] = useState<FacultyTeacher[]>(() => {
    try {
      const saved = localStorage.getItem('hteim_faculty_teachers_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.error("Failed loading faculty teachers state:", err);
    }
    return DEFAULT_FACULTY_TEACHERS;
  });

  const facultyTeachers = (facultyTeachersProp && facultyTeachersProp.length > 0)
    ? facultyTeachersProp
    : internalFacultyTeachers;

  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);

  const handleSaveFacultyList = (newList: FacultyTeacher[]) => {
    setInternalFacultyTeachers(newList);
    try {
      localStorage.setItem('hteim_faculty_teachers_v1', JSON.stringify(newList));
    } catch (err) {
      console.error("Failed saving faculty teachers:", err);
    }

    if (onSaveFacultyTeachers) {
      onSaveFacultyTeachers(newList);
    } else {
      // Ensure images in newList are saved to Supabase Storage bucket
      syncFacultyImagesToSupabase(newList).then(syncedList => {
        setInternalFacultyTeachers(syncedList);
        try {
          localStorage.setItem('hteim_faculty_teachers_v1', JSON.stringify(syncedList));
        } catch (err) {
          console.error("Failed saving updated faculty list:", err);
        }
      });
    }
  };

  const handleResetFacultyList = () => {
    setInternalFacultyTeachers(DEFAULT_FACULTY_TEACHERS);
    try {
      localStorage.removeItem('hteim_faculty_teachers_v1');
    } catch (err) {
      console.error("Failed resetting faculty teachers:", err);
    }
    if (onSaveFacultyTeachers) {
      onSaveFacultyTeachers(DEFAULT_FACULTY_TEACHERS);
    }
  };

  // Showcase & Faculty Revolving Carousel State (Slide 0 = Opening Intro, Slide 1..N = Faculty Members)
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isTeacherAutoplay, setIsTeacherAutoplay] = useState(true);

  const totalSlides = 1 + facultyTeachers.length;

  // Bounds safety check if slide count changes
  useEffect(() => {
    if (currentSlideIdx >= totalSlides) {
      setCurrentSlideIdx(0);
    }
  }, [totalSlides, currentSlideIdx]);

  useEffect(() => {
    if (!isTeacherAutoplay || totalSlides <= 0) return;
    const timer = setInterval(() => {
      setCurrentSlideIdx((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, [isTeacherAutoplay, totalSlides]);

  const activeTeacherIdx = currentSlideIdx > 0 ? currentSlideIdx - 1 : 0;
  const activeTeacher = facultyTeachers[activeTeacherIdx] || facultyTeachers[0] || DEFAULT_FACULTY_TEACHERS[0];

  const handleNextSlide = () => {
    if (totalSlides <= 0) return;
    setCurrentSlideIdx((prev) => (prev + 1) % totalSlides);
  };

  const handlePrevSlide = () => {
    if (totalSlides <= 0) return;
    setCurrentSlideIdx((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Section visibility states
  const [adminTab, setAdminTab] = useState<'at_risk' | 'trends' | 'sync'>('at_risk');
  const [isAdminPanelExpanded, setIsAdminPanelExpanded] = useState(false);

  // At-Risk Notification Card State
  const [atRiskFilter, setAtRiskFilter] = useState<'all' | 'critical' | 'moderate'>('all');
  const [atRiskSearch, setAtRiskSearch] = useState('');
  const [sentAlertStudent, setSentAlertStudent] = useState<string | null>(null);

  // Module-Based Attendance Trends State
  const [trendChartType, setTrendChartType] = useState<'bar' | 'area'>('bar');

  // At-Risk Calculation
  const rawAtRiskStudents = useMemo(() => {
    if (!students || students.length === 0) return [];
    return students.filter(s => s.rate < atRiskThreshold).sort((a, b) => a.rate - b.rate);
  }, [students, atRiskThreshold]);

  const filteredAtRiskStudents = useMemo(() => {
    return rawAtRiskStudents.filter(s => {
      if (atRiskFilter === 'critical' && s.rate > 50) return false;
      if (atRiskFilter === 'moderate' && (s.rate <= 50 || s.rate >= atRiskThreshold)) return false;
      if (atRiskSearch.trim()) {
        return (s?.name || '').toLowerCase().includes(atRiskSearch.toLowerCase().trim());
      }
      return true;
    });
  }, [rawAtRiskStudents, atRiskFilter, atRiskSearch, atRiskThreshold]);

  // Module-Based Attendance Trend Data Computation
  const moduleTrendData = useMemo(() => {
    const modulesList = [
      { code: 'SOM-MOD-1', title: 'Mod 1: Intro', fullName: 'Module 1: Introduction' },
      { code: 'SOM-MOD-2', title: 'Mod 2: Evangelism', fullName: 'Module 2: Evangelism' },
      { code: 'SOM-MOD-3', title: 'Mod 3: Ethics', fullName: 'Module 3: Ministerial Ethics' },
      { code: 'SOM-MOD-4', title: 'Mod 4: Apostolic', fullName: 'Module 4: Apostolic Ministry' },
      { code: 'SOM-MOD-5', title: 'Mod 5: Prophetic', fullName: 'Module 5: Prophetic Ministry' },
      { code: 'SOM-MOD-6', title: 'Mod 6: Pastoral', fullName: 'Module 6: School of Pastors & Teachers' }
    ];

    const totalClassDays = classDays && classDays.length > 0 ? classDays : [];
    const numDays = totalClassDays.length;

    return modulesList.map((mod, idx) => {
      let modDays: ClassDay[] = [];
      if (numDays > 0) {
        const daysPerMod = Math.max(1, Math.ceil(numDays / 6));
        const start = idx * daysPerMod;
        modDays = totalClassDays.slice(start, start + daysPerMod);
      }

      let presentTotal = 0;
      let absentTotal = 0;
      let totalExpected = 0;

      if (students && students.length > 0 && modDays.length > 0) {
        students.forEach(st => {
          modDays.forEach(day => {
            totalExpected++;
            const att = st.attendanceByDay[day.id];
            if (att && att.present) {
              presentTotal++;
            } else {
              absentTotal++;
            }
          });
        });
      }

      const attendanceRate = totalExpected > 0 
        ? Math.round((presentTotal / totalExpected) * 100) 
        : Math.max(50, 88 - (idx * 4));

      const absenceRate = 100 - attendanceRate;

      return {
        code: mod.code,
        name: mod.title,
        fullName: mod.fullName,
        attendanceRate,
        absenceRate,
        presentCount: presentTotal,
        absentCount: absentTotal,
        totalClasses: modDays.length,
        isHighAbsence: attendanceRate < 75
      };
    });
  }, [classDays, students]);

  // Collapsible banner state
  const [isBannerCollapsed, setIsBannerCollapsed] = useState<boolean>(() => {
    return false;
  });

  const toggleBannerCollapse = () => {
    setIsBannerCollapsed(prev => !prev);
  };

  useEffect(() => {
    localStorage.setItem('hteim_home_banner_collapsed', String(isBannerCollapsed));
  }, [isBannerCollapsed]);

  // Metrics
  const activeStudents = studentsCount;
  const scheduledClasses = classDaysCount;
  const attendanceRate = Math.round(avgAttendanceRate || 0);

  // Find logged in student data
  const loggedInStudentData = useMemo(() => {
    if (!isStudent || !appUser) return null;
    const nameToMatch = (appUser.studentName || appUser.name || '').toLowerCase().trim();
    return students.find(s => (s?.name || '').toLowerCase().trim() === nameToMatch) || null;
  }, [isStudent, appUser, students]);

  // Find logged in student tuition statement
  const loggedInStudentPayment = useMemo(() => {
    if (!isStudent || !appUser) return null;
    const nameToMatch = (appUser.studentName || appUser.name || '').toLowerCase().trim();
    return payments.find(p => (p?.studentName || '').toLowerCase().trim() === nameToMatch) || null;
  }, [isStudent, appUser, payments]);

  return (
    <div className="space-y-6 pb-28 sm:pb-24 md:pb-12 animate-fadeIn material-screen" id="som-home-container">
      
      {/* Course Faculty & Opening Intro Revolving Showcase Banner */}
      <section 
        className="bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden my-2 transition-all"
        onMouseEnter={() => setIsTeacherAutoplay(false)}
        onMouseLeave={() => setIsTeacherAutoplay(true)}
      >
        {/* Banner Top Header Controls */}
        <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 sm:px-6 py-3.5 flex items-center justify-between flex-wrap gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-sm shrink-0">
              {currentSlideIdx === 0 ? <Sparkles className="w-4 h-4 text-slate-950" /> : <Users className="w-4 h-4 text-slate-950" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
                  {currentSlideIdx === 0 ? 'HTEIM School of Ministry — Opening Vision' : 'Course Faculty & Anointed Instructors'}
                </h2>
                <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1">
                  <Flame className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  {currentSlideIdx === 0 ? 'Opening Intro' : `Instructor 0${currentSlideIdx} of 0${facultyTeachers.length}`}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {currentSlideIdx === 0 
                  ? 'Anointed biblical instruction, exegesis, and ministerial governance' 
                  : `Equipping saints with five-fold wisdom and ministerial excellence (${activeTeacher.name})`}
              </p>
            </div>
          </div>

          {/* Navigation, Autoplay & Admin Edit Controls */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setIsFacultyModalOpen(true)}
                className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-[11px] font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95 border border-amber-300"
                title="Manage Faculty Roster & Photos"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-950" />
                <span>Edit Faculty</span>
              </button>
            )}

            <button
              onClick={() => setIsTeacherAutoplay(!isTeacherAutoplay)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title={isTeacherAutoplay ? "Pause auto-rotation" : "Resume auto-rotation"}
            >
              {isTeacherAutoplay ? (
                <>
                  <Pause className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="hidden xs:inline text-[10px] font-bold">Autoplay</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="hidden xs:inline text-[10px] font-bold">Paused</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={handlePrevSlide}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono font-extrabold text-amber-400 px-1.5">
                0{currentSlideIdx + 1}/0{totalSlides}
              </span>
              <button
                onClick={handleNextSlide}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={toggleBannerCollapse}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer shrink-0"
              title={isBannerCollapsed ? "Expand Banner" : "Collapse Banner"}
            >
              {isBannerCollapsed ? <ChevronDown className="w-4 h-4 text-amber-400" /> : <ChevronUp className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>

        {/* Main Banner Slide Content Area with AnimatePresence Smooth Fade */}
        {!isBannerCollapsed && (
          <div className="p-4 sm:p-6 md:p-8 relative">
            <AnimatePresence mode="wait">
              {currentSlideIdx === 0 ? (
                /* Slide 0: Opening Intro Hero Card */
                <motion.div
                  key="opening-intro-slide"
                  initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
                  transition={{ duration: 0.55, ease: 'easeInOut' }}
                  className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-10 min-h-[340px] flex flex-col justify-between shadow-2xl"
                >
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={biblicalHeroAsset} 
                      alt="HTEIM School of Ministry" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                  </div>

                  <div className="relative z-10 w-full max-w-4xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 text-[10px] sm:text-[11px] font-bold tracking-wide rounded-full border border-amber-400/30">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Heaven Touching Earth International Ministries</span>
                    </div>

                    <div className="space-y-1.5">
                      <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white font-syne">
                        Anointed Biblical Instruction & <br className="hidden sm:inline" />
                        <span className="inline-block my-1 px-3 py-1 bg-amber-400 text-slate-950 font-black rounded-xl text-base sm:text-3xl md:text-4xl shadow-lg">
                          Ministerial Governance
                        </span>
                      </h1>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="px-3 py-1 bg-white/10 text-white border border-white/15 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                        6 Core Curriculum Modules
                      </span>
                      <span className="px-3 py-1 bg-white/10 text-white border border-white/15 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        75% Attendance Standard
                      </span>
                      <span className="px-3 py-1 bg-white/10 text-white border border-white/15 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                        <Radio className="w-3.5 h-3.5 text-amber-400" />
                        Live Hybrid Classes
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm md:text-base text-slate-200/95 leading-relaxed max-w-2xl font-medium">
                      "Bringing Heaven to Earth, Taking People to Heaven." Equipping saints through deep exegesis, high ministerial ethics, prophetic discernment, and five-fold apostolic oversight.
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 flex-wrap">
                      <button
                        onClick={() => onNavigate('courses')}
                        className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 border border-indigo-400"
                      >
                        <BookOpen className="w-4 h-4 text-amber-300" /> 6 Core Modules
                      </button>

                      <button
                        onClick={() => onNavigate('schedule')}
                        className="w-full sm:w-auto px-5 py-3 bg-slate-900/90 hover:bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl backdrop-blur-md transition-all border border-slate-700 cursor-pointer flex items-center justify-center gap-2 shadow-md"
                      >
                        <Calendar className="w-4 h-4 text-emerald-400" /> Class Schedule
                      </button>

                      <button
                        onClick={handleNextSlide}
                        className="w-full sm:w-auto px-4 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                      >
                        <span>View Faculty Banner</span>
                        <ArrowRight className="w-4 h-4 text-slate-950" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Slide 1..N: Faculty Instructor Cards */
                <motion.div
                  key={`faculty-slide-${activeTeacher.id}`}
                  initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
                  transition={{ duration: 0.55, ease: 'easeInOut' }}
                  className="p-5 sm:p-7 relative overflow-hidden bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-2xl"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Instructor Portrait Photo */}
                    <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center justify-center">
                      <div className="relative group w-full max-w-[250px] sm:max-w-[270px]">
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-purple-600 to-indigo-600 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
                        
                        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-2xl aspect-[3/4] w-full">
                          <img
                            src={activeTeacher.image}
                            alt={activeTeacher.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                          
                          <div className="absolute bottom-3 left-3 right-3">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-md ${activeTeacher.badgeColor}`}>
                              {activeTeacher.module}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Instructor Details & Bio */}
                    <div className="md:col-span-7 lg:col-span-8 space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 bg-purple-950/80 text-purple-200 border border-purple-800 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            HTEIM Course Faculty
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            • Instructor {currentSlideIdx} of {facultyTeachers.length}
                          </span>
                        </div>

                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug font-syne">
                          {activeTeacher.name}
                        </h3>
                        
                        <p className="text-xs sm:text-sm font-extrabold text-amber-400 uppercase tracking-wide">
                          {activeTeacher.role} — {activeTeacher.title}
                        </p>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-xs italic">
                        "{activeTeacher.bio}"
                      </p>

                      <div className="pt-1 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => onNavigate('courses')}
                          className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                        >
                          <BookOpen className="w-4 h-4 shrink-0" />
                          <span>Explore Course Curriculum</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </button>

                        <button
                          onClick={() => onNavigate('schedule')}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>View Class Schedule</span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => setIsFacultyModalOpen(true)}
                            className="px-4 py-2.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-extrabold text-xs rounded-xl border border-amber-400/40 transition-all cursor-pointer flex items-center gap-2"
                          >
                            <Edit3 className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Edit Faculty Info</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Revolving Slide Selectors (Intro + 5 Faculty Members) */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Showcase Slides (Opening Vision + {facultyTeachers.length} Course Faculty)
                </span>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalSlides }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIdx(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === currentSlideIdx 
                          ? 'w-6 bg-amber-400 shadow-xs' 
                          : 'w-2 bg-slate-700 hover:bg-slate-600'
                      }`}
                      aria-label={`Go to slide ${idx}`}
                    />
                  ))}
                </div>
              </div>

              {/* Slide Thumbnail Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {/* Slide 0 Thumbnail: Opening Intro */}
                <button
                  onClick={() => setCurrentSlideIdx(0)}
                  className={`p-2 rounded-xl text-left transition-all cursor-pointer flex items-center gap-2 border ${
                    currentSlideIdx === 0
                      ? 'bg-amber-400/20 border-amber-400 text-white shadow-md ring-1 ring-amber-400'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-950 flex items-center justify-center">
                    <img
                      src={biblicalHeroAsset}
                      alt="Opening Intro"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-extrabold truncate text-white">Opening Intro</p>
                    <p className="text-[9px] text-amber-400 truncate font-mono">HTEIM Vision</p>
                  </div>
                </button>

                {/* Slides 1..N Thumbnails: Faculty Instructors */}
                {facultyTeachers.map((teacher, idx) => {
                  const slideNum = idx + 1;
                  const isActive = slideNum === currentSlideIdx;
                  return (
                    <button
                      key={teacher.id}
                      onClick={() => setCurrentSlideIdx(slideNum)}
                      className={`p-2 rounded-xl text-left transition-all cursor-pointer flex items-center gap-2 border ${
                        isActive
                          ? 'bg-amber-400/20 border-amber-400 text-white shadow-md ring-1 ring-amber-400'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-950">
                        <img
                          src={teacher.image}
                          alt={teacher.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-extrabold truncate text-white">{teacher.name}</p>
                        <p className="text-[9px] text-amber-400 truncate font-mono">Faculty {slideNum}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Active Class Quiz Announcement Banner (Students Only) */}
      {isStudent && activeQuizzes.length > 0 && (
        <section className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 rounded-2xl border-2 border-purple-500/40 p-4 sm:p-6 text-white shadow-xl relative overflow-hidden animate-fadeIn my-2">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/30 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" /> Active Class Quiz Available
                </span>
                <span className="text-xs text-purple-200 font-medium hidden sm:inline">
                  ({activeQuizzes.length} published quiz{activeQuizzes.length > 1 ? 'zes' : ''} active)
                </span>
              </div>

              <span className="text-[11px] font-mono font-bold text-purple-200 bg-purple-800/60 px-2.5 py-1 rounded-lg border border-purple-400/30">
                Auto-Compiled to Total Grade Score
              </span>
            </div>

            <div className="space-y-3">
              {activeQuizzes.map((asg) => {
                const quiz = asg.quizData!;
                const currentStudentName = appUser?.studentName || appUser?.name || userEmail || '';
                const targetName = (currentStudentName || '').toLowerCase().trim();
                const hasSubmitted = submissions?.some(
                  s => s.assignmentId === asg.id && (s.studentName || '').toLowerCase().trim() === targetName
                );

                return (
                  <div key={asg.id} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 hover:border-purple-300/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-purple-500/30 text-purple-100 font-mono font-bold text-[10px] rounded border border-purple-300/30">
                          {asg.courseCode || 'MIN-101'}
                        </span>
                        <span className="text-xs font-semibold text-purple-200">
                          {asg.moduleTrack || 'Module 1'}
                        </span>
                        {hasSubmitted && (
                          <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 font-extrabold text-[10px] rounded-full border border-emerald-400/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-300" /> Completed
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                        {quiz.title}
                      </h3>

                      <p className="text-xs text-purple-100/80 line-clamp-2 leading-relaxed">
                        {quiz.description || 'Complete this weighted class day quiz to compile your academic score.'}
                      </p>

                      {/* Metrics row */}
                      <div className="flex items-center gap-3 pt-1 text-xs text-purple-200 font-mono font-bold flex-wrap">
                        <span className="flex items-center gap-1 bg-purple-900/60 px-2.5 py-1 rounded-lg border border-purple-400/20">
                          <Award className="w-3.5 h-3.5 text-amber-300" />
                          <span>{quiz.totalPoints || asg.maxPoints} Points Max</span>
                        </span>

                        <span className="flex items-center gap-1 bg-purple-900/60 px-2.5 py-1 rounded-lg border border-purple-400/20">
                          <Clock className="w-3.5 h-3.5 text-indigo-300" />
                          <span>{quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} Mins Limit` : 'No Time Limit'}</span>
                        </span>

                        <span className="flex items-center gap-1 bg-purple-900/60 px-2.5 py-1 rounded-lg border border-purple-400/20">
                          <Calendar className="w-3.5 h-3.5 text-purple-300" />
                          <span>Due: {quiz.dueDate || asg.dueDate}</span>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-purple-500/30">
                      <button
                        type="button"
                        onClick={() => {
                          const shareUrl = `${window.location.origin}${window.location.pathname}?quiz=${quiz.shareCode || quiz.id}`;
                          navigator.clipboard.writeText(shareUrl);
                          setCopiedQuizLink(quiz.id);
                          setTimeout(() => setCopiedQuizLink(null), 2500);
                        }}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Copy shareable link for this quiz"
                      >
                        {copiedQuizLink === quiz.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-purple-200" />}
                        <span>{copiedQuizLink === quiz.id ? 'Copied!' : 'Copy Link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onTakeQuiz) {
                            onTakeQuiz(quiz);
                          } else {
                            onNavigate('exams');
                          }
                        }}
                        className={`px-4 py-2.5 ${
                          hasSubmitted 
                            ? 'bg-purple-800/90 hover:bg-purple-800 text-white font-bold border border-purple-400/40' 
                            : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-lg hover:shadow-amber-400/20 active:scale-95'
                        } text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5`}
                      >
                        {hasSubmitted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <BookOpen className="w-4 h-4" />}
                        <span>{hasSubmitted ? 'Completed (View Score)' : 'Take Quiz Now'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Welcome & Pathway Selector (Only shown for guest/prospective mode) */}
      {!appUser && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Welcome to HTEIM School of Ministry Portal
                </h2>
                <p className="text-[10px] text-slate-500">Select your path below for guided access.</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">
                {appUser ? `Logged in as ${(appUser as AppUser).role.toUpperCase()}` : 'Guest Mode'}
              </span>
            </div>
          </div>

          {/* 2 Pathway Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Enrolled Students */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Enrolled Students
                </span>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Student Academic Hub</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Log attendance, take scripture evaluation quizzes, download lecture handouts, and view tuition records.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => onNavigate('attendance')}
                  className="flex-1 py-2 px-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[11px] rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  <span>My Attendance</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigate('exams')}
                  className="py-2 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Quizzes
                </button>
              </div>
            </div>

            {/* Card 2: Faculty & Staff */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Faculty & Leadership
                </span>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Faculty & Administrative Suite</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Oversee student roster, monitor the 75% at-risk attendance triggers, manage payments, and sync cloud data.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                {appUser ? (
                  <button
                    onClick={() => onNavigate('students')}
                    className="flex-1 py-2 px-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[11px] rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    <span>Roster Directory</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={onOpenLogin}
                    className="flex-1 py-2 px-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[11px] rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Faculty Sign In</span>
                  </button>
                )}
                <button
                  onClick={() => onNavigate('schedule')}
                  className="py-2 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Student Quick Command Hub */}
      {isStudent && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">Student Quick Hub</h3>
                <p className="text-[10px] text-slate-500 leading-none mt-0.5">Quick actions for your account</p>
              </div>
            </div>
            {loggedInStudentData && (
              <span className={`px-2.5 py-1 text-[9px] font-bold rounded-full uppercase tracking-wider shrink-0 ${
                loggedInStudentData.rate >= atRiskThreshold 
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}>
                {loggedInStudentData.rate >= atRiskThreshold ? 'Satisfactory' : 'At-Risk'}
              </span>
            )}
          </div>

          {/* At-Risk Mobile Alert Banner for Student */}
          {loggedInStudentData && loggedInStudentData.rate < atRiskThreshold && (
            <div className="p-3 bg-rose-500/10 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 rounded-xl flex items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2.5 text-rose-800 dark:text-rose-200">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
                <div>
                  <p className="font-bold">Attendance Alert ({Math.round(loggedInStudentData.rate)}%)</p>
                  <p className="text-[10px] text-rose-700 dark:text-rose-300">Below the 75% threshold. Check in during live classes.</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('attendance')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg shrink-0 shadow-xs cursor-pointer active:scale-95 transition-transform"
              >
                Check-In
              </button>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider truncate">My Attendance</p>
              <p className={`text-sm sm:text-base font-bold font-mono mt-0.5 ${
                loggedInStudentData && loggedInStudentData.rate < atRiskThreshold ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {loggedInStudentData ? `${Math.round(loggedInStudentData.rate)}%` : '—'}
              </p>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider truncate">My Avg Grade</p>
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                {loggedInStudentData?.avgScore !== null && loggedInStudentData?.avgScore !== undefined
                  ? `${Math.round(loggedInStudentData.avgScore)}%`
                  : 'N/A'}
              </p>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider truncate">Pending Tasks</p>
              <p className={`text-sm sm:text-base font-bold font-mono mt-0.5 ${
                pendingAssignmentsCount > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400'
              }`}>
                {pendingAssignmentsCount}
              </p>
            </div>
          </div>

          {/* Touch Actions Grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              onClick={() => onNavigate('attendance')}
              className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserCheck className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Self-Attendance</span>
            </button>

            <button
              onClick={() => onNavigate('exams')}
              className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-colors cursor-pointer"
            >
              <Award className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Quizzes & Grades</span>
            </button>

            <button
              onClick={() => onNavigate('library')}
              className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Handouts & PDFs</span>
            </button>

            <button
              onClick={() => onNavigate('messages')}
              className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Message Teacher</span>
            </button>
          </div>
        </section>
      )}

      {/* 4. MAIN STRUCTURAL LAYOUT: Portal Access, Broadcast & Covenant Mandate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Portal Access Card */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Academic Portal Account</h3>
            </div>

            {appUser ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg flex items-center justify-center font-bold text-sm">
                      {appUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{appUser.name}</p>
                      <p className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase font-bold">{appUser.role} Account</p>
                    </div>
                  </div>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-md text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      title="Sign Out"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Signed in to HTEIM Academic Portal. Check attendance, take scripture quizzes, download handouts, and view tuition balances.
                </p>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => onNavigate('attendance')}
                    className="w-full py-2.5 px-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Attendance Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {isStudent ? (
                    <button
                      onClick={() => onNavigate('payments')}
                      className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Tuition Statement
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigate('students')}
                      className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Student Roster Directory
                    </button>
                  )}

                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="w-full py-2 px-3 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out Account</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Sign in to access your student records, submit assignments, view tuition statements, and track academic attendance.
                </p>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={onOpenLogin}
                    className="w-full py-2.5 px-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Log in to Student Portal</span>
                  </button>

                  <button
                    onClick={onOpenLogin}
                    className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    Faculty Sign In
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Live Broadcast & Upcoming Class Day */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Live Class Schedule
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Next: {nextClassTitle}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-900 dark:text-white">
                <span>Tuesday & Thursday Session</span>
                <span className="text-slate-600 dark:text-slate-300 font-mono">7:00 PM EST</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Live online broadcast & in-person lecture hall check-in.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('schedule')}
            className="w-full py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-300 text-white dark:text-slate-900 font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-auto"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>View All Class Sessions</span>
          </button>
        </section>

        {/* Core Vision & Covenant Mandate */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3.5">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">HTEIM Covenant Mandate</h3>
            
            <div className="space-y-3 text-xs">
              <div className="border-l-2 border-slate-300 dark:border-slate-600 pl-3">
                <span className="font-semibold text-[10px] uppercase text-slate-600 dark:text-slate-300 block">Vision</span>
                <p className="text-slate-800 dark:text-slate-200 font-bold italic font-serif">
                  "Bringing Heaven to Earth, Taking People to Heaven"
                </p>
              </div>

              <div className="border-l-2 border-slate-300 dark:border-slate-600 pl-3">
                <span className="font-semibold text-[10px] uppercase text-slate-600 dark:text-slate-300 block">Ephesians 2:20 Grounded</span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Built on the foundation of the apostles and prophets, Christ Jesus Himself being the chief cornerstone.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Admin & Faculty Academic Insights Panel */}
      {isAdminOrTeacher && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div 
          onClick={() => setIsAdminPanelExpanded(prev => !prev)}
          className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white tracking-tight">
                  Academic Analytics & At-Risk Monitoring
                </h3>
                {rawAtRiskStudents.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500 text-white">
                    {rawAtRiskStudents.length} At-Risk
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Faculty tools for student attendance intervention, module trends, and cloud state synchronization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 hidden sm:inline">
              {isAdminPanelExpanded ? 'Collapse' : 'Expand'}
            </span>
            {isAdminPanelExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </div>
        </div>

        {isAdminPanelExpanded && (
          <div className="p-5 sm:p-6 space-y-6 animate-fadeIn">
            {/* Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3 flex-wrap">
              <button
                type="button"
                onClick={() => setAdminTab('at_risk')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  adminTab === 'at_risk'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>At-Risk Triggers ({rawAtRiskStudents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('trends')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  adminTab === 'trends'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Module Attendance Trends</span>
              </button>
            </div>

            {/* At-Risk Tab Content */}
            {adminTab === 'at_risk' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student..."
                      value={atRiskSearch}
                      onChange={(e) => setAtRiskSearch(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-1">
                    <button
                      type="button"
                      onClick={() => setAtRiskFilter('all')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${atRiskFilter === 'all' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}
                    >
                      All ({rawAtRiskStudents.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAtRiskFilter('critical')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${atRiskFilter === 'critical' ? 'bg-rose-600 text-white' : 'text-slate-500'}`}
                    >
                      Critical (≤50%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAtRiskFilter('moderate')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${atRiskFilter === 'moderate' ? 'bg-amber-500 text-white' : 'text-slate-500'}`}
                    >
                      Warning (51-74%)
                    </button>
                  </div>
                </div>

                {filteredAtRiskStudents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredAtRiskStudents.map((student) => {
                      const isCritical = student.rate <= 50;
                      const totalClasses = classDays.length || 6;
                      const missedClasses = Math.max(0, totalClasses - student.attended);

                      return (
                        <div 
                          key={student.name}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 ${
                            isCritical 
                              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900' 
                              : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                                isCritical ? 'bg-rose-600' : 'bg-amber-600'
                              }`}>
                                {student.photoUrl ? (
                                  <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                  student.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">{student.name}</h4>
                                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                  Missed {missedClasses} of {totalClasses} Sessions
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                                isCritical 
                                  ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900 dark:text-rose-200' 
                                  : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200'
                              }`}>
                                <AlertTriangle className="w-3 h-3" /> {Math.round(student.rate)}%
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              <span>Attendance Rate</span>
                              <span>{student.attended} / {totalClasses} Attended</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-rose-600' : 'bg-amber-500'}`}
                                style={{ width: `${Math.max(5, student.rate)}%` }}
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-1.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => onNavigate('attendance')}
                              className="flex-1 py-1 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <UserX className="w-3 h-3 text-rose-500" /> Review
                            </button>
                            <button
                              type="button"
                              onClick={() => onNavigate('messages')}
                              className="flex-1 py-1 px-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-md font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <MessageSquare className="w-3 h-3" /> Direct Msg
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSentAlertStudent(student.name);
                                setTimeout(() => setSentAlertStudent(null), 3000);
                              }}
                              className={`py-1 px-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                                sentAlertStudent === student.name
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                              }`}
                            >
                              {sentAlertStudent === student.name ? <CheckCircle className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                              {sentAlertStudent === student.name ? 'Alerted' : 'Flag'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="All students meeting expectations"
                    description="No students are currently falling below the attendance threshold in this filter view."
                    icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                  />
                )}
              </div>
            )}

            {/* Trends Tab Content */}
            {adminTab === 'trends' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Attendance Rates by Core Module</span>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTrendChartType('bar')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                        trendChartType === 'bar' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500'
                      }`}
                    >
                      <BarChart2 className="w-3.5 h-3.5" /> Bar View
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendChartType('area')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                        trendChartType === 'area' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" /> Trend Line
                    </button>
                  </div>
                </div>

                <div className="h-64 w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    {trendChartType === 'bar' ? (
                      <BarChart data={moduleTrendData} margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} interval={0} angle={-10} textAnchor="end" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700 }} unit="%" />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl text-xs space-y-1 shadow-lg border border-slate-800">
                                  <p className="font-extrabold text-amber-400">{data.fullName}</p>
                                  <p>Attendance Rate: <strong className="text-emerald-400">{data.attendanceRate}%</strong></p>
                                  <p>Absence Rate: <strong className="text-rose-400">{data.absenceRate}%</strong></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="attendanceRate" radius={[8, 8, 0, 0]} name="Attendance Rate (%)">
                          {moduleTrendData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.attendanceRate < 75 ? '#F43F5E' : '#4F46E5'} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <AreaChart data={moduleTrendData} margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                        <defs>
                          <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} interval={0} angle={-10} textAnchor="end" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700 }} unit="%" />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl text-xs space-y-1 shadow-lg border border-slate-800">
                                  <p className="font-extrabold text-amber-400">{data.fullName}</p>
                                  <p>Attendance Rate: <strong className="text-emerald-400">{data.attendanceRate}%</strong></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area type="monotone" dataKey="attendanceRate" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendance)" />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      )}

      {/* Admin Faculty & Instructors Manager Modal */}
      {isAdmin && (
        <FacultyManagerModal
          isOpen={isFacultyModalOpen}
          onClose={() => setIsFacultyModalOpen(false)}
          facultyList={facultyTeachers}
          onSaveFacultyList={handleSaveFacultyList}
          onResetToDefault={handleResetFacultyList}
        />
      )}

    </div>
  );
};
