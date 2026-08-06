import React, { useState, useMemo } from 'react';
import hteimBannerAsset from '../assets/images/regenerated_image_1785852170450.png';
import biblicalHeroAsset from '../assets/images/hteim_people_hero_banner_1786036369689.jpg';
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
  ChevronDown,
  ChevronUp,
  Play,
  Sliders,
  PenSquare,
  DollarSign,
  Cloud,
  RefreshCw,
  Database,
  Copy,
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
  Share2,
  Quote,
  FileText,
  Layers,
  Video,
  UserCheck
} from 'lucide-react';
import { TabType, StudentSummary, ClassDay, PaymentRecord } from '../types';
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
import { 
  DashboardCustomizerModal, 
  DEFAULT_WIDGET_ORDER, 
  DEFAULT_ENABLED_WIDGETS 
} from './DashboardCustomizerModal';

interface HomeTabProps {
  onNavigate: (tab: TabType) => void;
  appUser: AppUser | null;
  onOpenLogin: () => void;
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
}

export const HomeTab: React.FC<HomeTabProps> = ({
  onNavigate,
  appUser,
  onOpenLogin,
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
  atRiskThreshold = 75
}) => {
  const isStudent = appUser?.role === 'student';
  const isAdminOrTeacher = appUser?.role === 'admin' || appUser?.role === 'teacher';

  // Section visibility states
  const [activePillarTab, setActivePillarTab] = useState(0);
  const [activeVerseIndex, setActiveVerseIndex] = useState(0);
  const [copiedVerse, setCopiedVerse] = useState(false);
  const [adminTab, setAdminTab] = useState<'at_risk' | 'trends' | 'sync'>('at_risk');
  const [isAdminPanelExpanded, setIsAdminPanelExpanded] = useState(false);

  // At-Risk Notification Card State
  const [atRiskFilter, setAtRiskFilter] = useState<'all' | 'critical' | 'moderate'>('all');
  const [atRiskSearch, setAtRiskSearch] = useState('');
  const [sentAlertStudent, setSentAlertStudent] = useState<string | null>(null);

  // Module-Based Attendance Trends State
  const [trendChartType, setTrendChartType] = useState<'bar' | 'area'>('bar');

  // Daily Scriptures Collection
  const dailyScriptures = [
    {
      reference: '2 Timothy 2:15',
      verse: 'Study to show thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.',
      theme: 'Exegesis & Academic Rigor',
      application: 'Pursue deep biblical diligence. True spiritual authority flows from faithful handling of Holy Scripture.',
      tag: 'Word & Doctrine'
    },
    {
      reference: 'Ephesians 4:11-12',
      verse: 'And he gave some, apostles; and some, prophets; and some, evangelists; and some, pastors and teachers; for the perfecting of the saints, for the work of the ministry.',
      theme: 'Five-Fold Ministry Calling',
      application: 'Every believer is equipped for kingdom impact. Align your unique spiritual gifts with church governance.',
      tag: 'Apostolic Mandate'
    },
    {
      reference: 'Joshua 1:8',
      verse: 'This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night, that thou mayest observe to do according to all that is written therein.',
      theme: 'Spiritual Discipline',
      application: 'Continuous meditation on God’s Word yields spiritual prosperity, divine wisdom, and unwavering courage.',
      tag: 'Character & Faith'
    },
    {
      reference: '1 Timothy 3:2',
      verse: 'A bishop then must be blameless, the husband of one wife, vigilant, sober, of good behaviour, given to hospitality, apt to teach.',
      theme: 'Ministerial Ethics',
      application: 'Leadership in the body of Christ requires flawless integrity, emotional sobriety, and teachable stewardship.',
      tag: 'Ethics & Stewardship'
    }
  ];

  const currentScripture = dailyScriptures[activeVerseIndex];

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
        return s.name.toLowerCase().includes(atRiskSearch.toLowerCase().trim());
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
    return localStorage.getItem('hteim_home_banner_collapsed') === 'true';
  });

  const toggleBannerCollapse = () => {
    setIsBannerCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('hteim_home_banner_collapsed', String(next));
      return next;
    });
  };

  // Widget customizer local state
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('hteim_home_widget_order');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_WIDGET_ORDER; }
    }
    return DEFAULT_WIDGET_ORDER;
  });

  const [enabledWidgets, setEnabledWidgets] = useState<string[]>(() => {
    const saved = localStorage.getItem('hteim_home_widget_enabled');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_ENABLED_WIDGETS; }
    }
    return DEFAULT_ENABLED_WIDGETS;
  });

  const [showCustomizerModal, setShowCustomizerModal] = useState(false);

  const handleCopyScripture = () => {
    const text = `"${currentScripture.verse}" — ${currentScripture.reference} (HTEIM School of Ministry)`;
    navigator.clipboard.writeText(text);
    setCopiedVerse(true);
    setTimeout(() => setCopiedVerse(false), 2000);
  };

  const handleSaveWidgetLayout = (newOrder: string[], newEnabled: string[]) => {
    setWidgetOrder(newOrder);
    setEnabledWidgets(newEnabled);
    localStorage.setItem('hteim_home_widget_order', JSON.stringify(newOrder));
    localStorage.setItem('hteim_home_widget_enabled', JSON.stringify(newEnabled));
  };

  const handleResetWidgetLayout = () => {
    setWidgetOrder(DEFAULT_WIDGET_ORDER);
    setEnabledWidgets(DEFAULT_ENABLED_WIDGETS);
    localStorage.removeItem('hteim_home_widget_order');
    localStorage.removeItem('hteim_home_widget_enabled');
  };

  // Metrics
  const activeStudents = studentsCount;
  const scheduledClasses = classDaysCount;
  const attendanceRate = Math.round(avgAttendanceRate || 0);

  // Find logged in student data
  const loggedInStudentData = useMemo(() => {
    if (!isStudent || !appUser) return null;
    const nameToMatch = (appUser.studentName || appUser.name || '').toLowerCase().trim();
    return students.find(s => s.name.toLowerCase().trim() === nameToMatch) || null;
  }, [isStudent, appUser, students]);

  // Find logged in student tuition statement
  const loggedInStudentPayment = useMemo(() => {
    if (!isStudent || !appUser) return null;
    const nameToMatch = (appUser.studentName || appUser.name || '').toLowerCase().trim();
    return payments.find(p => p.studentName.toLowerCase().trim() === nameToMatch) || null;
  }, [isStudent, appUser, payments]);

  const ministryPillars = [
    {
      id: 'pillar_1',
      title: 'Word & Biblical Exegesis',
      subtitle: 'Hermeneutics & Doctrine',
      description: 'Rigorous study of Scripture, original textual context, hermeneutical principles, and sound theological interpretation.',
      scripture: '2 Timothy 2:15 — "Study to show thyself approved unto God..."',
      icon: <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      badge: 'Core Curriculum',
      color: 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-200'
    },
    {
      id: 'pillar_2',
      title: 'Ministerial Character & Ethics',
      subtitle: 'Moral Integrity & Stewardship',
      description: 'Cultivating Christ-like integrity, financial faithfulness, conflict resolution, and blameless administrative oversight.',
      scripture: '1 Timothy 3:2 — "A bishop then must be blameless..."',
      icon: <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      badge: 'Leadership Standard',
      color: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-200'
    },
    {
      id: 'pillar_3',
      title: 'Spiritual Discernment & Power',
      subtitle: 'Prophetic & Spiritual Disciplines',
      description: 'Deepening communion with the Holy Spirit, hearing God’s voice, prayer, fasting, and testing spiritual gifts scripturally.',
      scripture: '1 Corinthians 14:1 — "Follow after charity, and desire spiritual gifts..."',
      icon: <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      badge: 'Spiritual Formation',
      color: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-200'
    },
    {
      id: 'pillar_4',
      title: 'Apostolic Governance & Shepherding',
      subtitle: 'Five-Fold Ministry & Pastoring',
      description: 'Equipping leaders for institutional expansion, church plant management, and pastoral counseling of the local flock.',
      scripture: 'Ephesians 4:11-12 — "And he gave some, apostles; and some, prophets..."',
      icon: <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      badge: 'Advanced Oversight',
      color: 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/80 text-purple-950 dark:text-purple-200'
    }
  ];

  const coreModules = [
    {
      code: 'SOM-MOD-1',
      title: 'Module 1: Introduction',
      desc: 'Foundational orientation into the School of Ministry, covenant alignment, spiritual disciplines, and academic integrity.',
      instructor: 'HTEIM Academic Directorate',
      credits: 5,
      status: 'Active Track'
    },
    {
      code: 'SOM-MOD-2',
      title: 'Module 2: Evangelism',
      desc: 'Soul-winning strategies, personal witnessing, street outreach, the Great Commission mandate, and follow-up discipleship.',
      instructor: 'Evangelism Ministry Lead',
      credits: 5,
      status: 'Active Track'
    },
    {
      code: 'SOM-MOD-3',
      title: 'Module 3: Ministerial Ethics',
      desc: 'Standards of high character, financial stewardship, church accountability, conflict resolution, and biblical servant leadership.',
      instructor: 'Pastor Senior Advisor',
      credits: 5,
      status: 'Core Requirement'
    },
    {
      code: 'SOM-MOD-4',
      title: 'Module 4: Apostolic Ministry',
      desc: 'Apostolic mandates, five-fold governance, spiritual authority (Ephesians 2:20), and distinguishing true vs false ministries.',
      instructor: 'Dr. Faculty Director',
      credits: 5,
      status: 'Advanced Track'
    },
    {
      code: 'SOM-MOD-5',
      title: 'Module 5: Prophetic Ministry',
      desc: 'Prophetic discernment, hearing the voice of God, testing prophecy against Scripture, and maintaining order in the local church.',
      instructor: 'Prophetic Faculty Director',
      credits: 5,
      status: 'Advanced Track'
    },
    {
      code: 'SOM-MOD-6',
      title: 'Module 6: School of the Pastors & Teachers',
      desc: 'Shepherding the flock, pastoral counseling, expository sermon preparation, hermeneutics, and teaching sound biblical doctrine.',
      instructor: 'Rev. Academic Dean',
      credits: 5,
      status: 'Practicum'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pb-28 sm:pb-24 md:pb-12 animate-fadeIn" id="som-home-container">
      
      {/* 1. HERO BANNER: Cinematic Biblical Training Atmosphere with Glassmorphism Overlay */}
      <section className={`relative overflow-hidden rounded-3xl border border-amber-300/60 dark:border-amber-500/30 shadow-xl group transition-all duration-300 ${
        isBannerCollapsed ? 'min-h-0' : 'min-h-[380px] sm:min-h-[440px] flex flex-col justify-between'
      }`}>
        {/* Background Artwork */}
        <div className="absolute inset-0 z-0">
          <img 
            src={biblicalHeroAsset} 
            alt="HTEIM School of Ministry Discipleship, Bible Study & Evangelism Outreach" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-[1.02]"
          />
          {/* Multi-stage Gradient Mask for Readable Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/40 dark:from-slate-950 dark:via-slate-950/90 dark:to-slate-950/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
        </div>

        {/* Banner Top Header */}
        <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between gap-4 w-full">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-400/20 text-amber-300 text-[10px] sm:text-[11px] font-black tracking-widest uppercase rounded-full border border-amber-400/40 backdrop-blur-md shadow-xs">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>HTEIM School of Ministry • Kingdom Equipping</span>
          </div>

          <button
            type="button"
            onClick={toggleBannerCollapse}
            className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-slate-200 hover:text-white text-[11px] font-extrabold rounded-xl border border-amber-400/40 shadow-xs backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shrink-0"
            title={isBannerCollapsed ? "Expand hero banner" : "Collapse hero banner"}
          >
            {isBannerCollapsed ? (
              <>
                <span>Expand Banner</span>
                <ChevronDown className="w-4 h-4 text-amber-400" />
              </>
            ) : (
              <>
                <span>Collapse</span>
                <ChevronUp className="w-4 h-4 text-amber-400" />
              </>
            )}
          </button>
        </div>

        {!isBannerCollapsed ? (
          <div className="relative z-10 px-6 pb-8 pt-2 sm:px-10 sm:pb-10 md:px-12 md:pb-12 w-full max-w-4xl space-y-5 animate-fadeIn">
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold font-mono uppercase tracking-widest text-amber-400/90">
                Heaven Touching Earth International Ministries
              </span>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white font-syne">
                Anointed Biblical Instruction & <br className="hidden sm:inline" />
                <span className="inline-block my-1 px-3 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black rounded-xl shadow-md border border-amber-300">
                  Ministerial Governance
                </span>
              </h1>
            </div>

            <p className="text-xs sm:text-sm md:text-base text-slate-200/90 leading-relaxed max-w-2xl font-medium">
              "Bringing Heaven to Earth, Taking People to Heaven." Equipping saints through deep exegesis, high ministerial ethics, prophetic discernment, and five-fold apostolic oversight.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3.5 pt-2 flex-wrap">
              {onOpenPresentationDemo && (
                <button
                  onClick={onOpenPresentationDemo}
                  className="w-full sm:w-auto px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 border border-amber-300"
                >
                  <Play className="w-4 h-4 text-slate-950 fill-slate-950" /> Play 30s Student Presentation
                </button>
              )}

              <button
                onClick={() => onNavigate('courses')}
                className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 border border-indigo-400"
              >
                <BookOpen className="w-4 h-4 text-amber-300" /> Explore 6 Core Modules
              </button>

              <button
                onClick={() => onNavigate('schedule')}
                className="w-full sm:w-auto px-5 py-3 bg-slate-900/80 hover:bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl backdrop-blur-md transition-all border border-slate-700/80 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <Calendar className="w-4 h-4 text-emerald-400" /> Class Schedule
              </button>
            </div>
          </div>
        ) : (
          <div className="relative z-10 px-6 pb-4 pt-1 w-full flex items-center justify-between gap-4 animate-fadeIn">
            <p className="text-xs sm:text-sm font-extrabold text-white truncate">
              HTEIM School of Ministry — "Bringing Heaven to Earth, Taking People to Heaven"
            </p>
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigate('courses')}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-lg shadow-xs cursor-pointer"
              >
                Explore Modules
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Student Quick Touch Command Hub - Mobile & Student View Optimization */}
      {isStudent && (
        <section className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 border border-indigo-500/30 shadow-lg space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white font-syne tracking-tight">Student Quick Command Hub</h3>
                <p className="text-[10px] text-slate-300 leading-none mt-0.5">1-Touch mobile actions optimized for student accounts</p>
              </div>
            </div>
            {loggedInStudentData && (
              <span className={`px-2.5 py-1 text-[9px] font-black rounded-full uppercase tracking-wider shrink-0 ${
                loggedInStudentData.rate >= atRiskThreshold 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                  : 'bg-rose-500/20 text-rose-300 border border-rose-400/30 animate-pulse'
              }`}>
                {loggedInStudentData.rate >= atRiskThreshold ? 'Satisfactory Standing' : 'At-Risk Standing'}
              </span>
            )}
          </div>

          {/* Quick Stats Grid for Students on Mobile */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-2.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider truncate">My Attendance</p>
              <p className={`text-sm sm:text-base font-black font-mono mt-0.5 ${
                loggedInStudentData && loggedInStudentData.rate < atRiskThreshold ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {loggedInStudentData ? `${Math.round(loggedInStudentData.rate)}%` : '—'}
              </p>
            </div>
            <div className="p-2.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider truncate">My Avg Grade</p>
              <p className="text-sm sm:text-base font-black text-amber-300 font-mono mt-0.5">
                {loggedInStudentData?.avgScore !== null && loggedInStudentData?.avgScore !== undefined
                  ? `${Math.round(loggedInStudentData.avgScore)}%`
                  : 'N/A'}
              </p>
            </div>
            <div className="p-2.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider truncate">Pending Tasks</p>
              <p className={`text-sm sm:text-base font-black font-mono mt-0.5 ${
                pendingAssignmentsCount > 0 ? 'text-indigo-300' : 'text-slate-400'
              }`}>
                {pendingAssignmentsCount}
              </p>
            </div>
          </div>

          {/* Touch Actions Grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              onClick={() => onNavigate('attendance')}
              className="p-3 bg-indigo-600/10 hover:bg-indigo-600/35 border border-indigo-400/20 hover:border-indigo-400/40 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <UserCheck className="w-5 h-5 text-indigo-400" />
              <span className="text-[11px] font-extrabold text-white">Self-Attendance</span>
            </button>

            <button
              onClick={() => onNavigate('exams')}
              className="p-3 bg-amber-500/10 hover:bg-amber-500/35 border border-amber-400/20 hover:border-amber-400/40 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Award className="w-5 h-5 text-amber-400" />
              <span className="text-[11px] font-extrabold text-white">Quizzes & Grades</span>
            </button>

            <button
              onClick={() => onNavigate('library')}
              className="p-3 bg-teal-500/10 hover:bg-teal-500/35 border border-teal-400/20 hover:border-teal-400/40 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <FileText className="w-5 h-5 text-teal-400" />
              <span className="text-[11px] font-extrabold text-white">Handouts & PDFs</span>
            </button>

            <button
              onClick={() => onNavigate('messages')}
              className="p-3 bg-purple-500/10 hover:bg-purple-500/35 border border-purple-400/20 hover:border-purple-400/40 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <span className="text-[11px] font-extrabold text-white">Message Teacher</span>
            </button>
          </div>
        </section>
      )}

      {/* 2. DAILY SCRIPTURE MEMORY SPOTLIGHT & REFLECTION CARD */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-indigo-900/80 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                Scripture Memory Spotlight
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/10 text-indigo-200 border border-white/10">
                {currentScripture.tag}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm sm:text-lg font-serif italic text-amber-100 font-bold leading-relaxed">
                "{currentScripture.verse}"
              </p>
              <p className="text-xs font-black text-amber-400 font-mono tracking-wider">
                — {currentScripture.reference}
              </p>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-300 block">Ministry Application</span>
              <p className="text-slate-300 leading-normal">{currentScripture.application}</p>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center gap-2 w-full md:w-auto shrink-0 justify-between">
            <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              {dailyScriptures.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveVerseIndex(idx)}
                  className={`w-6 h-6 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    activeVerseIndex === idx ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  0{idx+1}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyScripture}
              className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-400/40 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              {copiedVerse ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedVerse ? 'Copied' : 'Copy Verse'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. KEY METRICS DASHBOARD (Clean, Uncluttered, Customizable Grid) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Portal Academic Overview</span>
            </h2>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[9px] font-mono font-bold border border-slate-200 dark:border-slate-700">
              {widgetOrder.filter(id => enabledWidgets.includes(id)).length} Metrics Active
            </span>
          </div>

          <button
            onClick={() => setShowCustomizerModal(true)}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-[11px] rounded-xl border border-slate-200 dark:border-slate-700 shadow-3xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
            title="Drag, reorder, or toggle metric cards on your dashboard"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Customize View</span>
          </button>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {widgetOrder
            .filter(id => enabledWidgets.includes(id))
            .map(widgetId => {
              switch (widgetId) {
                case 'total_enrolled':
                  return (
                    <div 
                      key={widgetId} 
                      onClick={() => onNavigate(isStudent ? 'attendance' : 'students')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-3xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 leading-tight truncate">
                          {isStudent ? 'My Classmates' : 'Enrolled Students'}
                        </p>
                        <p className="text-sm sm:text-lg font-black text-slate-900 dark:text-white leading-tight font-syne">
                          {isStudent ? `${activeStudents} Cohort` : `${activeStudents} Enrollees`}
                        </p>
                      </div>
                    </div>
                  );

                case 'active_curriculum':
                  return (
                    <div 
                      key={widgetId} 
                      onClick={() => onNavigate('courses')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-3xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-500/50 transition-all flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 leading-tight truncate">Core Modules</p>
                        <p className="text-sm sm:text-lg font-black text-slate-900 dark:text-white leading-tight font-syne">{coursesCount} Modules</p>
                      </div>
                    </div>
                  );

                case 'scheduled_lessons':
                  return (
                    <div 
                      key={widgetId} 
                      onClick={() => onNavigate('schedule')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-3xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 leading-tight truncate">Class Sessions</p>
                        <p className="text-sm sm:text-lg font-black text-slate-900 dark:text-white leading-tight font-syne">{scheduledClasses} Class Days</p>
                      </div>
                    </div>
                  );

                case 'avg_attendance': {
                  const studentRate = loggedInStudentData ? Math.round(loggedInStudentData.rate) : null;
                  const isAtRisk = studentRate !== null && studentRate < atRiskThreshold;
                  return (
                    <div 
                      key={widgetId} 
                      onClick={() => onNavigate('attendance')}
                      className={`bg-white dark:bg-slate-900 border rounded-2xl p-3.5 sm:p-4 shadow-3xs hover:shadow-md transition-all flex items-center gap-3 cursor-pointer group ${
                        isStudent && isAtRisk 
                          ? 'border-rose-300 dark:border-rose-950/85 hover:border-rose-400' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-500/50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                        isStudent && isAtRisk
                          ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/50'
                          : 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800'
                      }`}>
                        <TrendingUp className={`w-5 h-5 ${isStudent && isAtRisk ? 'text-rose-500' : 'text-rose-600 dark:text-rose-400'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 leading-tight truncate">
                          {isStudent ? 'My Attendance' : 'Avg Attendance'}
                        </p>
                        <p className={`text-sm sm:text-lg font-black leading-tight font-syne ${
                          isStudent && isAtRisk ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                        }`}>
                          {isStudent 
                            ? (studentRate !== null ? `${studentRate}% Rate` : 'No Record') 
                            : `${attendanceRate}% Rate`}
                        </p>
                      </div>
                    </div>
                  );
                }

                case 'pending_assignments':
                  return (
                    <div 
                      key={widgetId} 
                      onClick={() => onNavigate('exams')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-3xs hover:shadow-md hover:border-purple-300 transition-all flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <PenSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 leading-tight truncate">
                          {isStudent ? 'My Pending Tasks' : 'Pending Quizzes'}
                        </p>
                        <p className="text-sm sm:text-lg font-black text-slate-900 dark:text-white leading-tight font-mono">{pendingAssignmentsCount} Tasks</p>
                      </div>
                    </div>
                  );

                case 'uncollected_tuition': {
                  const balanceDue = loggedInStudentPayment 
                    ? Math.max(0, loggedInStudentPayment.totalTuition - loggedInStudentPayment.amountPaid)
                    : 0;
                  return (
                    <div 
                      key={widgetId} 
                      onClick={() => onNavigate('payments')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-3xs hover:shadow-md hover:border-rose-300 transition-all flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <DollarSign className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 leading-tight truncate">
                          {isStudent ? 'My Tuition Due' : 'Unpaid Tuition'}
                        </p>
                        <p className="text-sm sm:text-lg font-black text-slate-900 dark:text-white leading-tight font-mono">
                          {isStudent 
                            ? `$${balanceDue.toLocaleString()}`
                            : `$${uncollectedTuitionAmount.toLocaleString()} Due`}
                        </p>
                      </div>
                    </div>
                  );
                }

                case 'library_resources':
                  return (
                    <div 
                      key={widgetId} 
                      onClick={() => onNavigate('library')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-3xs hover:shadow-md hover:border-teal-300 transition-all flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 leading-tight truncate">Library Resources</p>
                        <p className="text-sm sm:text-lg font-black text-slate-900 dark:text-white leading-tight font-mono">{libraryResourcesCount} Handouts</p>
                      </div>
                    </div>
                  );

                case 'upcoming_class':
                  return (
                    <div 
                      key={widgetId} 
                      onClick={() => onNavigate('schedule')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-3xs hover:shadow-md hover:border-sky-300 transition-all flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 leading-tight truncate">Next Class</p>
                        <p className="text-sm sm:text-lg font-black text-slate-900 dark:text-white leading-tight font-mono truncate">{nextClassTitle}</p>
                      </div>
                    </div>
                  );

                default:
                  return null;
              }
            })}
        </div>

        {/* Quick Launch Portal Action Bar */}
        <div className="pt-2 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Quick Launch:</span>
          <button
            onClick={() => onNavigate('attendance')}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-900 dark:text-indigo-200 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <UserX className="w-3.5 h-3.5 text-indigo-600" /> Take Attendance
          </button>
          <button
            onClick={() => onNavigate('library')}
            className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/80 hover:bg-amber-100 text-amber-900 dark:text-amber-200 font-bold text-xs rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" /> Download Handouts
          </button>
          <button
            onClick={() => onNavigate('exams')}
            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 text-emerald-900 dark:text-emerald-200 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <PenSquare className="w-3.5 h-3.5 text-emerald-600" /> Evaluation Grades
          </button>
          <button
            onClick={() => onNavigate('payments')}
            className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/80 hover:bg-purple-100 text-purple-900 dark:text-purple-200 font-bold text-xs rounded-xl border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5 text-purple-600" /> Tuition Portal
          </button>
        </div>
      </section>

      {/* 4. MAIN STRUCTURAL LAYOUT: Core Curriculum & Ministry Formation Pathways */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Core Curriculum & Five-Fold Pillars */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Core Learning Path - 6 Modules Overview */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  6-Module Core Curriculum Roadmap
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Structured progression spanning Hermeneutics, Evangelism, Ethics, Apostolic Oversight, and Pastoral Care.
                </p>
              </div>

              <button
                onClick={() => onNavigate('courses')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>View Full Syllabus</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coreModules.map((mod) => (
                <div 
                  key={mod.code}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-3xs hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px] font-mono font-bold text-slate-700 dark:text-slate-300">
                        {mod.code}
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> {mod.credits} Credits
                      </span>
                    </div>

                    <h3 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-3">
                      {mod.desc}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Faculty: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{mod.instructor}</strong></span>
                    <button 
                      onClick={() => onNavigate('courses')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-[10px] flex items-center gap-0.5"
                    >
                      <span>Syllabus</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* School of Ministry Core Pillars */}
          <section className="space-y-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Four Pillars of Kingdom Formation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rooted in Ephesians 2:20 and 2 Timothy 2:15 to develop sound leaders.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-3xs space-y-6">
              {/* Interactive Pillar Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {ministryPillars.map((pillar, idx) => {
                  const isActive = activePillarTab === idx;
                  return (
                    <button
                      key={pillar.id}
                      onClick={() => setActivePillarTab(idx)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isActive 
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 shadow-sm ring-2 ring-indigo-500/20' 
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-3xs">
                          {pillar.icon}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">0{idx+1}</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">{pillar.title}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{pillar.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Pillar Display Card */}
              {(() => {
                const active = ministryPillars[activePillarTab];
                return (
                  <div className={`p-5 rounded-2xl border ${active.color} space-y-4 relative overflow-hidden transition-all duration-300 animate-fadeIn`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 dark:border-white/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
                          {active.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-black">{active.title}</h3>
                          <p className="text-xs font-medium opacity-80">{active.subtitle}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-white/80 dark:bg-slate-900/80 border border-black/5 dark:border-white/10 rounded-full text-[10px] font-black uppercase tracking-wider shadow-3xs self-start sm:self-auto">
                        {active.badge}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs leading-relaxed font-sans">
                        {active.description}
                      </p>

                      <div className="p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-black/5 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <span className="font-serif italic font-bold text-slate-900 dark:text-amber-300">{active.scripture}</span>
                        <button
                          onClick={() => onNavigate('courses')}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                        >
                          Explore Modules <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>

        </div>

        {/* Right 1 Column: Portal Access, Broadcast Live & FAQs */}
        <div className="space-y-6">
          
          {/* Portal Access Card */}
          <section className="bg-gradient-to-b from-indigo-950 via-slate-950 to-slate-950 border border-indigo-900/80 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 font-mono">Academic Portal Account</h3>
              </div>

              {appUser ? (
                <div className="space-y-4">
                  <div className="p-3 bg-white/10 border border-white/10 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center font-black text-sm">
                      {appUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">{appUser.name}</p>
                      <p className="text-[9px] font-mono text-amber-300 uppercase font-bold">{appUser.role} Account</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Signed in to HTEIM Academic Portal. Check attendance, take scripture quizzes, download handouts, and view tuition balances.
                  </p>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => onNavigate('attendance')}
                      className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <span>Attendance Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {isStudent ? (
                      <button
                        onClick={() => onNavigate('payments')}
                        className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Tuition Statement
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate('students')}
                        className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Student Roster Directory
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sign in to access your student records, submit assignments, view tuition statements, and track academic attendance.
                  </p>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={onOpenLogin}
                      className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Log in to Student Portal</span>
                    </button>

                    <button
                      onClick={onOpenLogin}
                      className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-xl transition-all border border-white/10 cursor-pointer"
                    >
                      Faculty Sign In
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Live Broadcast & Upcoming Class Day */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-3xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Live Class Schedule
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                Next: {nextClassTitle}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-black text-slate-900 dark:text-white">
                  <span>Tuesday & Thursday Session</span>
                  <span className="text-amber-600 font-mono">7:00 PM EST</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Live online broadcast & in-person lecture hall check-in.
                </p>
              </div>

              <button
                onClick={() => onNavigate('schedule')}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>View All Class Sessions</span>
              </button>
            </div>
          </section>

          {/* Core Vision & Covenant Mandate */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-3xs space-y-3.5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">HTEIM Covenant Mandate</h3>
            
            <div className="space-y-3 text-xs">
              <div className="border-l-2 border-amber-500 pl-3">
                <span className="font-black text-[10px] uppercase text-amber-700 dark:text-amber-400 block">Vision</span>
                <p className="text-slate-800 dark:text-slate-200 font-bold italic font-serif">
                  "Bringing Heaven to Earth, Taking People to Heaven"
                </p>
              </div>

              <div className="border-l-2 border-indigo-500 pl-3">
                <span className="font-black text-[10px] uppercase text-indigo-700 dark:text-indigo-400 block">Ephesians 2:20 Grounded</span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Built on the foundation of the apostles and prophets, Christ Jesus Himself being the chief cornerstone.
                </p>
              </div>
            </div>
          </section>

        </div>

      </div>

      {/* 5. ADMIN & FACULTY ACADEMIC INSIGHTS PANEL (Collapsible Section for At-Risk Triggers & Trends) */}
      {isAdminOrTeacher && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div 
          onClick={() => setIsAdminPanelExpanded(prev => !prev)}
          className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Academic Analytics & At-Risk Monitoring System
                </h3>
                {rawAtRiskStudents.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500 text-white shadow-3xs">
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
            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hidden sm:inline">
              {isAdminPanelExpanded ? 'Collapse Insights' : 'Expand Insights'}
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
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
              <button
                type="button"
                onClick={() => setAdminTab('at_risk')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  adminTab === 'at_risk'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>At-Risk Triggers ({rawAtRiskStudents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('trends')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  adminTab === 'trends'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
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
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setAtRiskFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${atRiskFilter === 'all' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs' : 'text-slate-500'}`}
                    >
                      All ({rawAtRiskStudents.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAtRiskFilter('critical')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${atRiskFilter === 'critical' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500'}`}
                    >
                      Critical (≤50%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAtRiskFilter('moderate')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${atRiskFilter === 'moderate' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-500'}`}
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
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                            isCritical 
                              ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900' 
                              : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-2xs ${
                                isCritical ? 'bg-rose-600' : 'bg-amber-600'
                              }`}>
                                {student.photoUrl ? (
                                  <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                  student.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{student.name}</h4>
                                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                  Missed {missedClasses} of {totalClasses} Sessions
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black font-mono border ${
                                isCritical 
                                  ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900 dark:text-rose-200' 
                                  : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200'
                              }`}>
                                <AlertTriangle className="w-3 h-3" /> {Math.round(student.rate)}%
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
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
                              className="flex-1 py-1 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <UserX className="w-3 h-3 text-rose-500" /> Review
                            </button>
                            <button
                              type="button"
                              onClick={() => onNavigate('messages')}
                              className="flex-1 py-1 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <MessageSquare className="w-3 h-3" /> Direct Msg
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSentAlertStudent(student.name);
                                setTimeout(() => setSentAlertStudent(null), 3000);
                              }}
                              className={`py-1 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
                  <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">All Students Meeting Attendance Expectations</p>
                    <p className="text-[11px] text-slate-400">No students are currently falling below the 75% threshold in this filter view.</p>
                  </div>
                )}
              </div>
            )}

            {/* Trends Tab Content */}
            {adminTab === 'trends' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Attendance Rates by Core Module</span>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTrendChartType('bar')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        trendChartType === 'bar' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      <BarChart2 className="w-3.5 h-3.5" /> Bar View
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendChartType('area')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        trendChartType === 'area' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" /> Trend Line
                    </button>
                  </div>
                </div>

                <div className="h-64 w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl p-3">
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

      {/* Dashboard Widgets Customizer Modal */}
      {showCustomizerModal && (
        <DashboardCustomizerModal
          isOpen={showCustomizerModal}
          onClose={() => setShowCustomizerModal(false)}
          widgetOrder={widgetOrder}
          enabledWidgets={enabledWidgets}
          onSave={handleSaveWidgetLayout}
          onReset={handleResetWidgetLayout}
        />
      )}

    </div>
  );
};
