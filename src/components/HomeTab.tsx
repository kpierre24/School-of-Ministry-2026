import React, { useState } from 'react';
import hteimBannerAsset from '../assets/images/regenerated_image_1785852170450.png';
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
  ExternalLink
} from 'lucide-react';
import { TabType } from '../types';
import { AppUser } from '../lib/userAuth';
import { 
  DashboardCustomizerModal, 
  DEFAULT_WIDGET_ORDER, 
  DEFAULT_ENABLED_WIDGETS, 
  WIDGET_CATALOG 
} from './DashboardCustomizerModal';

interface HomeTabProps {
  onNavigate: (tab: TabType) => void;
  appUser: AppUser | null;
  onOpenLogin: () => void;
  onOpenPresentationDemo?: () => void;
  studentsCount: number;
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
}

export const HomeTab: React.FC<HomeTabProps> = ({
  onNavigate,
  appUser,
  onOpenLogin,
  onOpenPresentationDemo,
  studentsCount,
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
  onVerifySetup
}) => {
  const isStudent = appUser?.role === 'student';
  const [activePillarTab, setActivePillarTab] = useState(0);

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

  // Supabase copy sql & verification state at the top level of the component
  const [showSqlSetup, setShowSqlSetup] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const sqlSetupCode = `create table if not exists app_states (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by text
);

-- Enable Row Level Security (RLS)
alter table app_states enable row level security;

-- Create open public access policies
create policy "Allow public read access" on app_states for select using (true);
create policy "Allow public insert" on app_states for insert with check (true);
create policy "Allow public update" on app_states for update using (true) with check (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSetupCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
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

  // Dynamic metrics derived directly from passed props
  const activeStudents = studentsCount;
  const scheduledClasses = classDaysCount;
  const attendanceRate = Math.round(avgAttendanceRate || 0);

  const ministryPillars = [
    {
      id: 'pillar_1',
      title: 'Word & Biblical Exegesis',
      subtitle: 'Hermeneutics & Doctrine',
      description: 'Rigorous study of Scripture, original textual context, hermeneutical principles, and sound theological interpretation.',
      scripture: '2 Timothy 2:15 — "Study to show thyself approved unto God..."',
      icon: <BookOpen className="w-5 h-5 text-indigo-600" />,
      badge: 'Core Curriculum',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-900'
    },
    {
      id: 'pillar_2',
      title: 'Ministerial Character & Ethics',
      subtitle: 'Moral Integrity & Stewardship',
      description: 'Cultivating Christ-like integrity, financial faithfulness, conflict resolution, and blameless administrative oversight.',
      scripture: '1 Timothy 3:2 — "A bishop then must be blameless, the husband of one wife..."',
      icon: <ShieldCheck className="w-5 h-5 text-amber-600" />,
      badge: 'Leadership Standard',
      color: 'bg-amber-50 border-amber-200 text-amber-900'
    },
    {
      id: 'pillar_3',
      title: 'Spiritual Discernment & Power',
      subtitle: 'Prophetic & Spiritual Disciplines',
      description: 'Deepening communion with the Holy Spirit, hearing God’s voice, prayer, fasting, and testing spiritual gifts scripturally.',
      scripture: '1 Corinthians 14:1 — "Follow after charity, and desire spiritual gifts..."',
      icon: <Sparkles className="w-5 h-5 text-emerald-600" />,
      badge: 'Spiritual Formation',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-900'
    },
    {
      id: 'pillar_4',
      title: 'Apostolic Governance & Shepherding',
      subtitle: 'Five-Fold Ministry & Pastoring',
      description: 'Equipping leaders for institutional expansion, church plant management, and pastoral counseling of the local flock.',
      scripture: 'Ephesians 4:11-12 — "And he gave some, apostles; and some, prophets..."',
      icon: <Trophy className="w-5 h-5 text-purple-600" />,
      badge: 'Advanced Oversight',
      color: 'bg-purple-50 border-purple-200 text-purple-900'
    }
  ];

  const coreModules = [
    {
      code: 'SOM-MOD-1',
      title: 'Module 1: Introduction',
      desc: 'Foundational orientation into the School of Ministry, covenant alignment, spiritual disciplines, and academic integrity.',
      instructor: 'HTEIM Academic Directorate',
      credits: 5
    },
    {
      code: 'SOM-MOD-2',
      title: 'Module 2: Evangelism',
      desc: 'Soul-winning strategies, personal witnessing, street outreach, the Great Commission mandate, and follow-up discipleship.',
      instructor: 'Evangelism Ministry Lead',
      credits: 5
    },
    {
      code: 'SOM-MOD-3',
      title: 'Module 3: Ministerial Ethics',
      desc: 'Standards of high character, financial stewardship, church accountability, conflict resolution, and biblical servant leadership.',
      instructor: 'Pastor Senior Advisor',
      credits: 5
    },
    {
      code: 'SOM-MOD-4',
      title: 'Module 4: Apostolic Ministry',
      desc: 'Apostolic mandates, five-fold governance, spiritual authority (Ephesians 2:20), and distinguishing true vs false ministries.',
      instructor: 'Dr. Faculty Director',
      credits: 5
    },
    {
      code: 'SOM-MOD-5',
      title: 'Module 5: Prophetic Ministry',
      desc: 'Prophetic discernment, hearing the voice of God, testing prophecy against Scripture, and maintaining order in the local church.',
      instructor: 'Prophetic Faculty Director',
      credits: 5
    },
    {
      code: 'SOM-MOD-6',
      title: 'Module 6: School of the Pastors & Teachers',
      desc: 'Shepherding the flock, pastoral counseling, expository sermon preparation, hermeneutics, and teaching sound biblical doctrine.',
      instructor: 'Rev. Academic Dean',
      credits: 5
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pb-28 sm:pb-24 md:pb-12 animate-fadeIn" id="som-home-container">
      
      {/* Unified HTEIM Hero Banner Section (Collapsible) */}
      <section className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-300/80 shadow-xl group transition-all duration-300 ${
        isBannerCollapsed ? 'min-h-0' : 'min-h-[360px] sm:min-h-[420px] flex flex-col justify-center'
      }`}>
        {/* Banner graphics directly in the section background */}
        <div className="absolute inset-0 z-0">
          <img 
            src={hteimBannerAsset} 
            alt="HTEIM School of Ministry Banner" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-[1.02]"
          />
          {/* Subtle light glass overlay to preserve full banner visibility while keeping text crisp */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/40 sm:to-white/30 backdrop-blur-[2px]" />
        </div>

        {/* Top Header Row with Collapse / Expand Toggle */}
        <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between gap-4 w-full">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/10 text-amber-900 text-[10px] sm:text-[11px] font-black tracking-wider uppercase rounded-full border border-amber-400/50 backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Equipping Saints for Kingdom Ministry</span>
          </div>

          <button
            type="button"
            onClick={toggleBannerCollapse}
            className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 hover:text-slate-950 text-[11px] font-extrabold rounded-xl border border-amber-300/80 shadow-xs backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shrink-0"
            title={isBannerCollapsed ? "Expand hero banner" : "Collapse hero banner"}
          >
            {isBannerCollapsed ? (
              <>
                <span>Expand Banner</span>
                <ChevronDown className="w-4 h-4 text-amber-600" />
              </>
            ) : (
              <>
                <span>Collapse</span>
                <ChevronUp className="w-4 h-4 text-amber-600" />
              </>
            )}
          </button>
        </div>

        {!isBannerCollapsed ? (
          /* Full Expanded Hero Content Overlay */
          <div className="relative z-10 px-6 pb-6 pt-2 sm:px-10 sm:pb-10 md:px-12 md:pb-12 w-full max-w-4xl space-y-4 sm:space-y-5 animate-fadeIn">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight leading-tight text-slate-900 font-sans">
              World-Class Biblical & <br className="hidden sm:inline" />
              <span className="inline-block my-1 px-3 py-1 bg-amber-400 text-slate-950 font-black rounded-lg sm:rounded-xl shadow-xs border border-amber-500/30">
                Ministerial Training
              </span> <br />
              for Everyone, Everywhere.
            </h1>
            
            <p className="text-xs sm:text-sm md:text-base text-slate-800 leading-relaxed max-w-xl font-semibold">
              HTEIM School of Ministry provides structured, biblically-centered teaching designed to help you grow in faith, develop high standards of character, and activate your spiritual calling.
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3.5 pt-2 flex-wrap">
              {onOpenPresentationDemo && (
                <button
                  onClick={onOpenPresentationDemo}
                  className="w-full sm:w-auto px-5 py-3 sm:py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 border border-indigo-500"
                >
                  <Play className="w-4 h-4 text-amber-300 fill-amber-300" /> Play 30s Student Presentation Demo
                </button>
              )}

              <button
                onClick={() => onNavigate('courses')}
                className="w-full sm:w-auto px-5 py-3 sm:py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 border border-amber-400"
              >
                <BookOpen className="w-4 h-4 text-slate-950" /> Explore Curriculum
              </button>
              
              <button
                onClick={() => onNavigate('schedule')}
                className="w-full sm:w-auto px-5 py-3 sm:py-3.5 bg-slate-900/90 hover:bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-800 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                View Academic Calendar
              </button>
            </div>
          </div>
        ) : (
          /* Compact Collapsed Bar View */
          <div className="relative z-10 px-6 pb-4 pt-1 w-full flex items-center justify-between gap-4 animate-fadeIn">
            <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
              HTEIM School of Ministry — World-Class Biblical & Ministerial Training
            </p>
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigate('courses')}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[11px] rounded-lg shadow-xs cursor-pointer"
              >
                Explore Curriculum
              </button>
            </div>
          </div>
        )}
      </section>



      {/* Customizable Metric Widgets Dashboard Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Key Metrics</span>
            </h2>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[9px] font-mono font-bold border border-slate-200 dark:border-slate-700">
              {widgetOrder.filter(id => enabledWidgets.includes(id)).length} Active
            </span>
          </div>

          <button
            onClick={() => setShowCustomizerModal(true)}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-[11px] rounded-xl border border-slate-200 dark:border-slate-700 shadow-3xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
            title="Drag, reorder, or toggle metric cards on your dashboard"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Customize</span>
          </button>
        </div>

        {/* Dynamic Metric Grid - Scaled to never clip text on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {widgetOrder
            .filter(id => enabledWidgets.includes(id))
            .map(widgetId => {
              switch (widgetId) {
                case 'total_enrolled':
                  return (
                    <div 
                      key={widgetId} 
                      onClick={() => onNavigate('students')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 sm:p-4 shadow-3xs hover:shadow-md hover:border-indigo-300 transition-all flex items-center gap-2 sm:gap-3.5 cursor-pointer group"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 leading-tight line-clamp-1">Total Enrolled</p>
                        <p className="text-xs sm:text-base font-black text-slate-900 dark:text-white leading-tight font-mono">{activeStudents} Students</p>
                      </div>
                    </div>
                  );

                case 'active_curriculum':
                  return (
                    <div 
                      key={widgetId} 
                      onClick={() => onNavigate('courses')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 sm:p-4 shadow-3xs hover:shadow-md hover:border-amber-300 transition-all flex items-center gap-2 sm:gap-3.5 cursor-pointer group"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 leading-tight line-clamp-1">Active Curriculum</p>
                        <p className="text-xs sm:text-base font-black text-slate-900 dark:text-white leading-tight font-mono">{coursesCount} Core Modules</p>
                      </div>
                    </div>
                  );

                case 'scheduled_lessons':
                  return (
                    <div 
                      key={widgetId} 
                      onClick={() => onNavigate('schedule')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 sm:p-4 shadow-3xs hover:shadow-md hover:border-emerald-300 transition-all flex items-center gap-2 sm:gap-3.5 cursor-pointer group"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 leading-tight line-clamp-1">Scheduled Lessons</p>
                        <p className="text-xs sm:text-base font-black text-slate-900 dark:text-white leading-tight font-mono">{scheduledClasses} Class Days</p>
                      </div>
                    </div>
                  );

                case 'avg_attendance':
                  return (
                    <div 
                      key={widgetId} 
                      onClick={() => onNavigate('attendance')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 sm:p-4 shadow-3xs hover:shadow-md hover:border-rose-300 transition-all flex items-center gap-2 sm:gap-3.5 cursor-pointer group"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 leading-tight line-clamp-1">Avg Attendance</p>
                        <p className="text-xs sm:text-base font-black text-slate-900 dark:text-white leading-tight font-mono">{attendanceRate}% Rate</p>
                      </div>
                    </div>
                  );

                case 'pending_assignments':
                  return (
                    <div 
                      key={widgetId} 
                      onClick={() => onNavigate('exams')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 sm:p-4 shadow-3xs hover:shadow-md hover:border-purple-300 transition-all flex items-center gap-2 sm:gap-3.5 cursor-pointer group"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <PenSquare className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 leading-tight line-clamp-1">Pending Tasks</p>
                        <p className="text-xs sm:text-base font-black text-slate-900 dark:text-white leading-tight font-mono">{pendingAssignmentsCount} Tasks</p>
                      </div>
                    </div>
                  );

                case 'uncollected_tuition':
                  return (
                    <div 
                      key={widgetId} 
                      onClick={() => onNavigate('payments')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 sm:p-4 shadow-3xs hover:shadow-md hover:border-rose-300 transition-all flex items-center gap-2 sm:gap-3.5 cursor-pointer group"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 leading-tight line-clamp-1">Unpaid Tuition</p>
                        <p className="text-xs sm:text-base font-black text-slate-900 dark:text-white leading-tight font-mono">${uncollectedTuitionAmount.toLocaleString()} Due</p>
                      </div>
                    </div>
                  );

                case 'library_resources':
                  return (
                    <div 
                      key={widgetId} 
                      onClick={() => onNavigate('library')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 sm:p-4 shadow-3xs hover:shadow-md hover:border-teal-300 transition-all flex items-center gap-2 sm:gap-3.5 cursor-pointer group"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 leading-tight line-clamp-1">Library Files</p>
                        <p className="text-xs sm:text-base font-black text-slate-900 dark:text-white leading-tight font-mono">{libraryResourcesCount} Handouts</p>
                      </div>
                    </div>
                  );

                case 'upcoming_class':
                  return (
                    <div 
                      key={widgetId} 
                      onClick={() => onNavigate('schedule')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 sm:p-4 shadow-3xs hover:shadow-md hover:border-sky-300 transition-all flex items-center gap-2 sm:gap-3.5 cursor-pointer group"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 leading-tight line-clamp-1">Next Session</p>
                        <p className="text-xs sm:text-base font-black text-slate-900 dark:text-white leading-tight font-mono">{nextClassTitle}</p>
                      </div>
                    </div>
                  );

                default:
                  return null;
              }
            })}
        </div>
      </section>

      {/* Main Structural Body: Tracks & Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Study Tracks & Core Modules */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* School of Ministry Core Pillars & Training Pathway Graphic */}
          <section className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-indigo-600" />
                School of Ministry Training & Formation Pillars
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Explore the four foundational pillars anchoring our theological curriculum, spiritual discipline, and ministerial governance.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
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
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20' 
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-xl bg-white shadow-2xs`}>
                          {pillar.icon}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">0{idx+1}</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">{pillar.title}</h4>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{pillar.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Pillar Inspection Display Card */}
              {(() => {
                const active = ministryPillars[activePillarTab];
                return (
                  <div className={`p-6 rounded-2xl border ${active.color} space-y-4 relative overflow-hidden transition-all duration-300 animate-fadeIn`}>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/40 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-3 relative z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-white shadow-sm border border-black/5">
                          {active.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">{active.title}</h3>
                          <p className="text-xs font-medium text-slate-600">{active.subtitle}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-white/80 border border-black/5 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-800 shadow-2xs self-start sm:self-auto">
                        {active.badge}
                      </span>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <p className="text-xs text-slate-700 leading-relaxed font-sans">
                        {active.description}
                      </p>

                      <div className="p-3 bg-white/80 rounded-xl border border-black/5 flex items-center justify-between text-xs">
                        <span className="font-serif italic font-bold text-slate-900">{active.scripture}</span>
                        <button
                          onClick={() => onNavigate('courses')}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1"
                        >
                          View Modules <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>

          {/* Core Learning Path - 6 Modules Overview */}
          <section className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                Core Program Learning Modules
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every student goes through 6 intensive core modules designed for complete spiritual and practical readiness.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coreModules.map((mod, idx) => (
                <div 
                  key={mod.code}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono font-bold text-slate-700">
                        {mod.code}
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> {mod.credits} Credits
                      </span>
                    </div>

                    <h3 className="text-xs font-black text-slate-900">{mod.title}</h3>
                    <p className="text-[11px] text-slate-500 leading-normal line-clamp-3">
                      {mod.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Faculty: <strong className="text-slate-700 font-semibold">{mod.instructor}</strong></span>
                    <button 
                      onClick={() => onNavigate('courses')}
                      className="text-indigo-600 hover:underline font-bold text-[10px]"
                    >
                      Syllabus &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right 1 Column: Portal Access Dashboard, Mission Statement & FAQs */}
        <div className="space-y-6">
          
          {/* Portal Access Dashboard Card */}
          <section className="bg-gradient-to-b from-indigo-900 to-slate-950 border border-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="space-y-4 relative">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-200">School of Ministry Portal</h3>
              </div>

              {appUser ? (
                <div className="space-y-4">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm">
                      {appUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-black">{appUser.name}</p>
                      <p className="text-[9px] font-mono text-indigo-300 uppercase font-bold">{appUser.role} Account</p>
                    </div>
                  </div>

                  <p className="text-xs text-indigo-200/85 leading-relaxed">
                    You are signed in to the academic portal. Manage attendance, submit quizzes, view course files, and review receipts here.
                  </p>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => onNavigate(isStudent ? 'attendance' : 'attendance')}
                      className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Go to Attendance Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {isStudent ? (
                      <button
                        onClick={() => onNavigate('payments')}
                        className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        My Tuition Statement
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate('students')}
                        className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Manage Students Directory
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sign in with your student or faculty credentials to check class attendance, take exams, upload materials, and track grading lists.
                  </p>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={onOpenLogin}
                      className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Log in to Student Portal</span>
                    </button>

                    <button
                      onClick={onOpenLogin}
                      className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold rounded-xl transition-all border border-white/10 cursor-pointer"
                    >
                      Faculty Sign In
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* HTEIM Core Vision & Values */}
          <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Our Core Mandate</h3>
            
            <div className="space-y-3 text-xs">
              <div className="border-l-2 border-amber-500 pl-3">
                <span className="font-extrabold text-[10px] uppercase text-amber-700 block">Vision</span>
                <p className="text-slate-800 font-bold italic font-serif">
                  "Bringing Heaven to Earth, Taking People to Heaven"
                </p>
              </div>

              <div className="border-l-2 border-indigo-500 pl-3">
                <span className="font-extrabold text-[10px] uppercase text-indigo-700 block">Ephesians 2:20 Grounded</span>
                <p className="text-slate-600 leading-relaxed">
                  Built on the foundation of the apostles and prophets, Christ Jesus Himself being the chief cornerstone.
                </p>
              </div>

              <div className="border-l-2 border-emerald-500 pl-3">
                <span className="font-extrabold text-[10px] uppercase text-emerald-700 block">The Great Commission</span>
                <p className="text-slate-600 leading-relaxed">
                  Go therefore and make disciples of all nations, baptizing them and teaching them to obey everything commanded.
                </p>
              </div>
            </div>
          </section>

          {/* Quick FAQ / Help Section */}
          <section className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Frequently Asked Questions</h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <h4 className="font-black text-slate-900">Is attendance mandatory?</h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Yes, students must maintain at least an 80% attendance rate. Below 70% is considered at-risk.
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200">
                <h4 className="font-black text-slate-900">How do we submit scripture recitations?</h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Oral scripture examinations are conducted live during class sessions, and grades are logged in the Evaluation portal.
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200">
                <h4 className="font-black text-slate-900">Where are student materials?</h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Course handouts, homework sheets, and reading booklets can be downloaded instantly under the Library tab.
                </p>
              </div>
            </div>
          </section>

        </div>

      </div>

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
