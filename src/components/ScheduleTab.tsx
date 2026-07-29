import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  Plus, 
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Grid,
  List,
  LayoutGrid,
  Trash2,
  Copy,
  X,
  Edit3,
  BookOpen,
  Filter,
  Sparkles,
  Zap,
  Info,
  Video,
  ExternalLink,
  Check,
  AlertTriangle,
  Bell,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { ScheduleItem } from '../types';
import { UserRole } from '../lib/userAuth';

export const CORE_MODULES = [
  { id: 'm1', code: 'SOM-MOD-1', name: 'Module 1: Introduction', shortName: 'Introduction', color: 'emerald' },
  { id: 'm2', code: 'SOM-MOD-2', name: 'Module 2: Evangelism', shortName: 'Evangelism', color: 'cyan' },
  { id: 'm3', code: 'SOM-MOD-3', name: 'Module 3: Ministerial Ethics', shortName: 'Ministerial Ethics', color: 'purple' },
  { id: 'm4', code: 'SOM-MOD-4', name: 'Module 4: Apostolic Ministry', shortName: 'Apostolic Ministry', color: 'indigo' },
  { id: 'm5', code: 'SOM-MOD-5', name: 'Module 5: Prophetic Ministry', shortName: 'Prophetic Ministry', color: 'amber' },
  { id: 'm6', code: 'SOM-MOD-6', name: 'Module 6: School of the Pastors and Teachers', shortName: 'Pastors & Teachers', color: 'rose' },
];

export const PERIODS = [
  { id: 'p1', label: '1ST PERIOD', time: '09:00 - 10:00 am' },
  { id: 'p2', label: '2ND PERIOD', time: '10:00 - 11:00 am' },
  { id: 'p3', label: '3RD PERIOD', time: '11:15 - 12:15 pm' },
  { id: 'p4', label: '4TH PERIOD', time: '01:15 - 02:15 pm' },
  { id: 'p5', label: '5TH PERIOD', time: '02:15 - 03:15 pm' },
  { id: 'eve', label: 'EVENING SESSION', time: '07:00 - 09:00 pm EST' },
];

const INITIAL_SCHEDULE: ScheduleItem[] = [
  // Past Classes (June 2026)
  {
    id: 'sch_p1',
    classDayId: 'cd_1',
    title: 'Orientation & Kingdom Citizenship Mandate',
    courseCode: 'SOM-MOD-1',
    moduleName: 'Module 1: Introduction',
    date: '2026-06-02',
    timeSlot: '07:00 - 09:00 pm EST',
    period: 'EVENING SESSION',
    instructor: 'Dr. Faculty Director',
    room: 'Main Sanctuary Hall',
    status: 'completed'
  },
  {
    id: 'sch_p2',
    classDayId: 'cd_2',
    title: 'Scripture Memory Recitation & Attendance Integrity',
    courseCode: 'SOM-MOD-1',
    moduleName: 'Module 1: Introduction',
    date: '2026-06-09',
    timeSlot: '07:00 - 09:00 pm EST',
    period: 'EVENING SESSION',
    instructor: 'Rev. Academic Dean',
    room: 'Main Sanctuary Hall',
    status: 'completed'
  },
  {
    id: 'sch_p3',
    classDayId: 'cd_3',
    title: 'Great Commission Mandate & Personal Witnessing (Matt 28)',
    courseCode: 'SOM-MOD-2',
    moduleName: 'Module 2: Evangelism',
    date: '2026-06-16',
    timeSlot: '07:00 - 09:00 pm EST',
    period: 'EVENING SESSION',
    instructor: 'Evangelism Ministry Lead',
    room: 'Outreach Training Room',
    status: 'completed'
  },
  {
    id: 'sch_p4',
    classDayId: 'cd_4',
    title: 'Overcoming Objections & Street Evangelism Practicum',
    courseCode: 'SOM-MOD-2',
    moduleName: 'Module 2: Evangelism',
    date: '2026-06-23',
    timeSlot: '07:00 - 09:00 pm EST',
    period: 'EVENING SESSION',
    instructor: 'Evangelism Ministry Lead',
    room: 'Outreach Training Room',
    status: 'completed'
  },

  // July 2026 Classes
  {
    id: 'sch_p5',
    classDayId: 'cd_5',
    title: 'Character & Financial Integrity in Ministry',
    courseCode: 'SOM-MOD-3',
    moduleName: 'Module 3: Ministerial Ethics',
    date: '2026-07-07',
    timeSlot: '07:00 - 09:00 pm EST',
    period: 'EVENING SESSION',
    instructor: 'Pastor Senior Advisor',
    room: 'Leadership Center B',
    status: 'completed'
  },
  {
    id: 'sch_p6',
    classDayId: 'cd_6',
    title: 'Conflict Resolution & Confidentiality in Counseling',
    courseCode: 'SOM-MOD-3',
    moduleName: 'Module 3: Ministerial Ethics',
    date: '2026-07-14',
    timeSlot: '07:00 - 09:00 pm EST',
    period: 'EVENING SESSION',
    instructor: 'Pastor Senior Advisor',
    room: 'Leadership Center B',
    status: 'completed'
  },
  {
    id: 'sch_live_1',
    classDayId: 'cd_7',
    title: 'Apostolic Mandate & Five-Fold Governance (Eph 2:20)',
    courseCode: 'SOM-MOD-4',
    moduleName: 'Module 4: Apostolic Ministry',
    date: '2026-07-24', // Today
    timeSlot: '07:00 - 09:00 pm EST',
    period: 'EVENING SESSION',
    instructor: 'Dr. Faculty Director',
    room: 'Main Sanctuary Hall A',
    status: 'live'
  },
  {
    id: 'sch_fut_1',
    classDayId: 'cd_8',
    title: 'Marks & Signs of True Apostolic Oversight',
    courseCode: 'SOM-MOD-4',
    moduleName: 'Module 4: Apostolic Ministry',
    date: '2026-07-28',
    timeSlot: '07:00 - 09:00 pm EST',
    period: 'EVENING SESSION',
    instructor: 'Dr. Faculty Director',
    room: 'Main Sanctuary Hall A',
    status: 'upcoming'
  },

  // Future Classes (August 2026 & September 2026)
  {
    id: 'sch_fut_2',
    classDayId: 'cd_9',
    title: 'Hearing the Voice of God & Prophetic Discernment',
    courseCode: 'SOM-MOD-5',
    moduleName: 'Module 5: Prophetic Ministry',
    date: '2026-08-04',
    timeSlot: '07:00 - 09:00 pm EST',
    period: 'EVENING SESSION',
    instructor: 'Prophetic Faculty Director',
    room: 'Prayer & Warfare Chapel',
    status: 'upcoming'
  },
  {
    id: 'sch_fut_3',
    classDayId: 'cd_10',
    title: 'Testing & Judging Prophecy Against Scripture',
    courseCode: 'SOM-MOD-5',
    moduleName: 'Module 5: Prophetic Ministry',
    date: '2026-08-11',
    timeSlot: '07:00 - 09:00 pm EST',
    period: 'EVENING SESSION',
    instructor: 'Prophetic Faculty Director',
    room: 'Prayer & Warfare Chapel',
    status: 'upcoming'
  },
  {
    id: 'sch_fut_4',
    classDayId: 'cd_11',
    title: 'Shepherding the Flock & Pastoral Care',
    courseCode: 'SOM-MOD-6',
    moduleName: 'Module 6: School of the Pastors and Teachers',
    date: '2026-08-18',
    timeSlot: '07:00 - 09:00 pm EST',
    period: 'EVENING SESSION',
    instructor: 'Rev. Academic Dean',
    room: 'Lecture Hall A',
    status: 'upcoming'
  },
  {
    id: 'sch_fut_5',
    classDayId: 'cd_12',
    title: 'Expository Preaching & Teaching Sound Doctrine',
    courseCode: 'SOM-MOD-6',
    moduleName: 'Module 6: School of the Pastors and Teachers',
    date: '2026-08-25',
    timeSlot: '07:00 - 09:00 pm EST',
    period: 'EVENING SESSION',
    instructor: 'Rev. Academic Dean',
    room: 'Lecture Hall A',
    status: 'upcoming'
  },
  {
    id: 'sch_fut_6',
    classDayId: 'cd_13',
    title: 'Ministerial Commissioning & Practical Ordination Practicum',
    courseCode: 'SOM-MOD-6',
    moduleName: 'Module 6: School of the Pastors and Teachers',
    date: '2026-09-08',
    timeSlot: '07:00 - 09:00 pm EST',
    period: 'EVENING SESSION',
    instructor: 'HTEIM Academic Directorate',
    room: 'Main Sanctuary Hall',
    status: 'upcoming'
  }
];

interface ScheduleTabProps {
  classDays: { id: string; name: string }[];
  onTakeAttendanceForDay: (dayId: string) => void;
  userRole?: UserRole;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  classDays,
  onTakeAttendanceForDay,
  userRole = 'admin'
}) => {
  const isStudent = userRole === 'student';
  // Saved Schedule State
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('hteim_scheduled_classes');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('hteim_scheduled_classes', JSON.stringify(schedules));
  }, [schedules]);

  // View mode: 'calendar' (Monthly Grid), 'timetable' (Weekly Matrix Grid), or 'agenda' (List)
  const [viewMode, setViewMode] = useState<'calendar' | 'timetable' | 'agenda'>('calendar');

  // Selected module filter
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');

  // Zoom Exception & Copy State
  const [zoomCopiedField, setZoomCopiedField] = useState<string | null>(null);
  const [showZoomExceptionModal, setShowZoomExceptionModal] = useState(false);
  const [zoomExceptionNote, setZoomExceptionNote] = useState<string>(() => {
    return localStorage.getItem('hteim_zoom_exception_note') || '';
  });
  const [hasZoomException, setHasZoomException] = useState<boolean>(() => {
    return localStorage.getItem('hteim_has_zoom_exception') === 'true';
  });

  const handleCopyZoomText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setZoomCopiedField(field);
    setTimeout(() => setZoomCopiedField(null), 2000);
  };

  const handleSaveZoomException = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('hteim_zoom_exception_note', zoomExceptionNote);
    localStorage.setItem('hteim_has_zoom_exception', hasZoomException ? 'true' : 'false');
    setShowZoomExceptionModal(false);
  };

  // Calendar Month Navigation State (Default July 2026)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 6, 1)); // July 2026

  // Modal State for Adding/Editing Class
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [isCopyingMode, setIsCopyingMode] = useState(false);

  // Form State
  const [formDate, setFormDate] = useState<string>('2026-07-24');
  const [formModuleCode, setFormModuleCode] = useState<string>('SOM-MOD-1');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formPeriod, setFormPeriod] = useState<string>('EVENING SESSION');
  const [formTimeSlot, setFormTimeSlot] = useState<string>('07:00 - 09:00 pm EST');
  const [formInstructor, setFormInstructor] = useState<string>('Dr. Faculty Director');
  const [formRoom, setFormRoom] = useState<string>('Main Sanctuary Hall A');
  const [formStatus, setFormStatus] = useState<'upcoming' | 'completed' | 'live'>('upcoming');

  // Helper to open modal for a fresh date or item
  const handleOpenAddModal = (defaultDateStr?: string, defaultPeriod?: string) => {
    if (isStudent) return;
    setEditingItem(null);
    setIsCopyingMode(false);
    setFormDate(defaultDateStr || new Date().toISOString().split('T')[0]);
    setFormModuleCode(selectedModuleFilter !== 'all' ? selectedModuleFilter : 'SOM-MOD-1');
    setFormTitle('');
    setFormPeriod(defaultPeriod || 'EVENING SESSION');
    setFormTimeSlot(defaultPeriod ? PERIODS.find(p => p.label === defaultPeriod)?.time || '07:00 - 09:00 pm EST' : '07:00 - 09:00 pm EST');
    setFormInstructor('Dr. Faculty Director');
    setFormRoom('Main Sanctuary Hall A');
    setFormStatus('upcoming');
    setShowScheduleModal(true);
  };

  const handleOpenEditModal = (item: ScheduleItem) => {
    if (isStudent) return;
    setEditingItem(item);
    setIsCopyingMode(false);
    setFormDate(item.date);
    setFormModuleCode(item.courseCode || 'SOM-MOD-1');
    setFormTitle(item.title);
    setFormPeriod(item.period || 'EVENING SESSION');
    setFormTimeSlot(item.timeSlot);
    setFormInstructor(item.instructor);
    setFormRoom(item.room);
    setFormStatus(item.status);
    setShowScheduleModal(true);
  };

  // Save Scheduled Class
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStudent) return;
    if (!formTitle.trim() || !formDate) return;

    const moduleObj = CORE_MODULES.find(m => m.code === formModuleCode) || CORE_MODULES[0];

    // Auto calculate status if user didn't manually set
    const todayStr = new Date().toISOString().split('T')[0];
    let computedStatus = formStatus;
    if (formDate < todayStr) computedStatus = 'completed';
    else if (formDate === todayStr) computedStatus = 'live';

    if (editingItem) {
      setSchedules(prev => prev.map(s => s.id === editingItem.id ? {
        ...s,
        title: formTitle,
        courseCode: moduleObj.code,
        moduleName: moduleObj.name,
        date: formDate,
        timeSlot: formTimeSlot,
        period: formPeriod,
        instructor: formInstructor,
        room: formRoom,
        status: computedStatus
      } : s));
    } else {
      const newClass: ScheduleItem = {
        id: `sch_user_${Date.now()}`,
        classDayId: `cd_custom_${Date.now()}`,
        title: formTitle,
        courseCode: moduleObj.code,
        moduleName: moduleObj.name,
        date: formDate,
        timeSlot: formTimeSlot,
        period: formPeriod,
        instructor: formInstructor,
        room: formRoom,
        status: computedStatus
      };
      setSchedules(prev => [...prev, newClass]);
    }

    setShowScheduleModal(false);
  };

  // Delete Scheduled Class
  const handleDeleteSchedule = (id: string) => {
    if (isStudent) return;
    setSchedules(prev => prev.filter(s => s.id !== id));
    setShowScheduleModal(false);
  };

  // Copy / Duplicate Scheduled Class to a target date
  const handleCopySchedule = (item: ScheduleItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isStudent) return;
    setEditingItem(null);
    setIsCopyingMode(true);
    setFormDate(item.date); // pre-fills current date as default starting point
    setFormModuleCode(item.courseCode || 'SOM-MOD-1');
    setFormTitle(item.title);
    setFormPeriod(item.period || 'EVENING SESSION');
    setFormTimeSlot(item.timeSlot);
    setFormInstructor(item.instructor);
    setFormRoom(item.room);
    setFormStatus(item.status);
    setShowScheduleModal(true);
  };

  // Filter schedules by module
  const filteredSchedules = schedules.filter(s => {
    if (selectedModuleFilter !== 'all' && s.courseCode !== selectedModuleFilter) {
      return false;
    }
    return true;
  });

  // Calendar Grid Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // First day of current month
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Prev month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // Next month navigation
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  // Map module code to color classes
  const getModuleBadgeStyle = (code: string) => {
    switch (code) {
      case 'SOM-MOD-1':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'SOM-MOD-2':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'SOM-MOD-3':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'SOM-MOD-4':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'SOM-MOD-5':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'SOM-MOD-6':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  // Weekly Timetable Days (Mon - Fri)
  const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="space-y-6 animate-fadeIn text-slate-100">
      {/* Sleek Dark Header Bar matching uploaded mockup */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Class Schedule & Academic Timetable
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Admin Control
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure core classes, assign dates (past & future), set time slots, and designate module assignments.
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          {/* Module Selector Filter */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedModuleFilter}
              onChange={(e) => setSelectedModuleFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 border-none focus:outline-none cursor-pointer pr-2"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Core Modules (6)</option>
              {CORE_MODULES.map(m => (
                <option key={m.id} value={m.code} className="bg-slate-900 text-slate-200">
                  {m.code} - {m.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle Switcher */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Monthly Calendar View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Monthly Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('timetable')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'timetable' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Weekly Matrix Timetable View"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Weekly Timetable</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'agenda' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Agenda List View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda List</span>
            </button>
          </div>

          {/* + Schedule Lecture Button with Restricted Hover Tooltip */}
          {isStudent ? (
            <div className="relative group">
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed opacity-80"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Schedule Lecture</span>
              </button>
              <div className="absolute right-0 top-full mt-1.5 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-amber-300 text-[10px] font-bold rounded-lg border border-amber-500/30 shadow-xl whitespace-nowrap z-50 animate-fadeIn">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Requires Instructor or Administrator Privileges</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Lecture</span>
            </button>
          )}
        </div>
      </div>

      {/* Weekly Tuesday Live Zoom Schedule Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-2xl text-white relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold flex-shrink-0 shadow-inner">
              <Video className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-blue-500/25 text-blue-300 border border-blue-400/40 text-[10px] font-mono font-black uppercase rounded-full">
                  Recurring Class Cadence
                </span>
                <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Every Tuesday @ 7:00 PM - 9:00 PM EST
                </span>
                {hasZoomException && (
                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase rounded-full flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-rose-400" /> Exception Active
                  </span>
                )}
              </div>
              
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                Classes Go Live via Zoom Every Tuesday
                <span className="text-slate-400 text-xs font-normal">(Unless notified otherwise)</span>
              </h3>

              {hasZoomException ? (
                <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-200 text-xs font-medium flex items-center gap-2 mt-1">
                  <Bell className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span><strong>Schedule Update:</strong> {zoomExceptionNote || 'Tuesday class schedule modified for this week.'}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-300 leading-relaxed">
                  All School of Ministry module lectures are hosted live on Zoom every Tuesday evening. Students can join using the meeting credentials below.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto flex-shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
            <div className="bg-slate-950/90 border border-blue-400/30 rounded-xl p-2 px-3 flex items-center justify-between gap-3 text-xs font-mono">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-400">Meeting ID</p>
                <p className="font-extrabold text-blue-200">815 0537 7396</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyZoomText('815 0537 7396', 'meetingId')}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Copy Meeting ID"
              >
                {zoomCopiedField === 'meetingId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="bg-slate-950/90 border border-blue-400/30 rounded-xl p-2 px-3 flex items-center justify-between gap-3 text-xs font-mono">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-400">Passcode</p>
                <p className="font-extrabold text-amber-300">163738</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyZoomText('163738', 'passcode')}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Copy Passcode"
              >
                {zoomCopiedField === 'passcode' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <a
              href="https://zoom.us/j/81505377396"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Launch Zoom</span>
              <ExternalLink className="w-3 h-3 text-blue-200" />
            </a>

            {isStudent ? (
              <div className="relative group">
                <button
                  disabled
                  className="px-3 py-2.5 bg-slate-900/80 text-slate-400 border border-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed opacity-75"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xl:inline">Exception Alert</span>
                </button>
                <div className="absolute right-0 top-full mt-1.5 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-amber-300 text-[10px] font-bold rounded-lg border border-amber-500/30 shadow-xl whitespace-nowrap z-50 animate-fadeIn">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Requires Instructor or Administrator Privileges</span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowZoomExceptionModal(true)}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Broadcast Schedule Exception / Alert"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline">Exception Alert</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: MONTHLY CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-6">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black text-white font-mono tracking-wide">
                {monthName} {year}
              </h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                {filteredSchedules.length} Scheduled Classes Total
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGoToToday}
                className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handlePrevMonth}
                className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wider text-slate-400 py-2 border-b border-slate-800/80">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Grid (Days) */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty padding cells for starting day */}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[110px] bg-slate-950/40 border border-slate-800/40 rounded-xl p-2 opacity-30" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              
              // Check if today
              const todayStr = new Date().toISOString().split('T')[0];
              const isToday = dateStr === todayStr;

              // Classes on this specific date
              const dayClasses = filteredSchedules.filter(s => s.date === dateStr);

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => !isStudent && handleOpenAddModal(dateStr)}
                  className={`min-h-[110px] bg-slate-950 border rounded-xl p-2.5 flex flex-col justify-between transition-all ${
                    !isStudent ? 'cursor-pointer group hover:border-indigo-500/60 hover:bg-slate-900/90' : 'cursor-default'
                  } ${
                    isToday
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-950/20'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg ${
                      isToday 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-300 group-hover:text-indigo-400'
                    }`}>
                      {dayNum}
                    </span>

                    {!isStudent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddModal(dateStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-md text-[10px] font-bold transition-all"
                        title="Add class on this date"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Scheduled Classes Badges on this day */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar my-1">
                    {dayClasses.map(cls => (
                      <div
                        key={cls.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isStudent) handleOpenEditModal(cls);
                        }}
                        className={`p-1.5 rounded-lg border text-[11px] leading-tight transition-all shadow-xs relative group/item ${
                          !isStudent ? 'hover:scale-[1.02] cursor-pointer' : 'cursor-default'
                        } ${getModuleBadgeStyle(cls.courseCode)}`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-extrabold font-mono text-[9px] uppercase tracking-wider">
                            {cls.courseCode}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-mono opacity-80">
                              {cls.timeSlot?.split(' ')[0] || ''}
                            </span>
                            {!isStudent && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopySchedule(cls, e)}
                                  className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:bg-indigo-600 hover:text-white rounded text-slate-300 transition-all cursor-pointer"
                                  title="Duplicate / Copy class card"
                                >
                                  <Copy className="w-2.5 h-2.5 text-indigo-300 hover:text-white" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSchedule(cls.id);
                                  }}
                                  className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:bg-rose-600 hover:text-white rounded text-slate-300 transition-all cursor-pointer"
                                  title="Remove class from schedule"
                                >
                                  <Trash2 className="w-2.5 h-2.5 text-rose-400 hover:text-white" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <p className="font-bold line-clamp-2 text-slate-100">
                          {cls.title}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-[9px] opacity-80 pt-0.5 border-t border-white/10">
                          <span className="truncate max-w-[80px]">{cls.instructor}</span>
                          {cls.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                          {cls.status === 'live' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                        </div>
                      </div>
                    ))}
                  </div>

                  {dayClasses.length === 0 && (
                    <div className="text-[10px] text-slate-600 italic group-hover:text-slate-400 transition-colors">
                      + Add class
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: WEEKLY TIMETABLE MATRIX GRID VIEW (Matches Uploaded Mockup Screenshot) */}
      {viewMode === 'timetable' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Grid className="w-4 h-4 text-indigo-400" />
                Weekly Period Matrix Schedule
              </h3>
              <p className="text-xs text-slate-400">
                Interactive timetable grid by weekday and course periods. Click any cell to assign or edit lectures.
              </p>
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/30 font-bold">
              5 Daily Periods + Evening Slots
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400">
                  <th className="p-4 w-32 border-r border-slate-800">DAY</th>
                  {PERIODS.slice(0, 5).map(p => (
                    <th key={p.id} className="p-4 text-center border-r border-slate-800 min-w-[150px]">
                      <div className="text-slate-200 font-extrabold">{p.label}</div>
                      <div className="text-[10px] text-slate-500 font-mono normal-case font-medium mt-0.5">{p.time}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {WEEK_DAYS.map((dayName) => (
                  <tr key={dayName} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-black text-slate-200 bg-slate-950/40 border-r border-slate-800 font-mono">
                      {dayName}
                    </td>

                    {PERIODS.slice(0, 5).map((p) => {
                      // Match scheduled classes corresponding to this period/day
                      const cellClasses = filteredSchedules.filter(s => {
                        if (!s.period) return false;
                        return s.period.toLowerCase().includes(p.label.toLowerCase().slice(0, 3));
                      });

                      const classInSlot = cellClasses[0]; // If mapped

                      return (
                        <td 
                          key={p.id} 
                          className={`p-3 text-center border-r border-slate-800/80 align-top transition-all group relative min-h-[90px] ${
                            !isStudent ? 'hover:bg-slate-800/50 cursor-pointer' : ''
                          }`}
                          onClick={() => {
                            if (isStudent) return;
                            if (classInSlot) handleOpenEditModal(classInSlot);
                            else handleOpenAddModal(undefined, p.label);
                          }}
                        >
                          {classInSlot ? (
                            <div className={`p-2.5 rounded-xl border text-left shadow-sm relative group/cell ${getModuleBadgeStyle(classInSlot.courseCode)}`}>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[10px] font-black font-mono uppercase">
                                  {classInSlot.courseCode}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold opacity-75">{classInSlot.date}</span>
                                  {!isStudent && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={(e) => handleCopySchedule(classInSlot, e)}
                                        className="opacity-0 group-hover/cell:opacity-100 p-1 hover:bg-indigo-600 hover:text-white rounded bg-slate-900/60 text-indigo-300 transition-all cursor-pointer"
                                        title="Copy card"
                                      >
                                        <Copy className="w-3 h-3 text-indigo-400 hover:text-white" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteSchedule(classInSlot.id);
                                        }}
                                        className="opacity-0 group-hover/cell:opacity-100 p-1 hover:bg-rose-600 hover:text-white rounded bg-slate-900/60 text-rose-300 transition-all cursor-pointer"
                                        title="Remove class"
                                      >
                                        <Trash2 className="w-3 h-3 text-rose-400 hover:text-white" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <p className="font-extrabold text-white text-xs line-clamp-2">
                                {classInSlot.title}
                              </p>
                              <div className="mt-1.5 text-[10px] text-slate-300 font-medium flex items-center justify-between">
                                <span className="truncate max-w-[100px]">{classInSlot.instructor}</span>
                                <span className="opacity-75">{classInSlot.room}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="py-6 text-slate-500 italic text-xs font-serif transition-colors flex flex-col items-center justify-center gap-1">
                              <span>No Lecture</span>
                              {!isStudent && <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity" />}
                            </div>
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
      )}

      {/* VIEW 3: AGENDA LIST VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <List className="w-4 h-4 text-indigo-400" />
              All Scheduled Classes ({filteredSchedules.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">Past, Present & Future Dates</span>
          </div>

          <div className="space-y-3">
            {filteredSchedules.map((item) => (
              <div 
                key={item.id}
                onClick={() => !isStudent && handleOpenEditModal(item)}
                className={`p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                  !isStudent ? 'hover:border-indigo-500/50 cursor-pointer hover:bg-slate-800/40' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl border flex flex-col items-center justify-center font-mono font-bold text-xs min-w-[90px] ${getModuleBadgeStyle(item.courseCode)}`}>
                    <span className="text-[10px] uppercase font-extrabold">{item.courseCode}</span>
                    <span className="text-xs text-white">{item.date}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950 border border-indigo-800/60 px-2 py-0.5 rounded">
                        {item.moduleName || item.courseCode}
                      </span>
                      {item.status === 'completed' && (
                        <span className="text-[10px] font-extrabold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      )}
                      {item.status === 'live' && (
                        <span className="text-[10px] font-extrabold text-white bg-rose-600 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <span className="w-1.5 h-1.5 bg-white rounded-full" /> Live Today
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-extrabold text-white">{item.title}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1 text-slate-300 font-mono">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" /> {item.timeSlot}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-amber-400" /> {item.instructor}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" /> {item.room}
                      </span>
                    </div>
                  </div>
                </div>

                {!isStudent && (
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {item.classDayId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTakeAttendanceForDay(item.classDayId!);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Attendance
                      </button>
                    )}
                    <button
                      onClick={(e) => handleCopySchedule(item, e)}
                      className="p-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 rounded-lg transition-colors cursor-pointer border border-indigo-800/60"
                      title="Copy / Duplicate Class"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(item);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer border border-slate-700"
                      title="Edit Class"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSchedule(item.id);
                      }}
                      className="p-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg transition-colors cursor-pointer border border-rose-800/60"
                      title="Remove Class from Calendar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCHEDULE LECTURE MODAL */}
      {!isStudent && showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                {isCopyingMode ? (
                  <Copy className="w-5 h-5 text-amber-400" />
                ) : (
                  <CalendarIcon className="w-5 h-5 text-indigo-400" />
                )}
                <h3 className="text-base font-extrabold">
                  {editingItem ? 'Edit Scheduled Class' : isCopyingMode ? 'Copy Class to Target Date' : 'Schedule New Class Lecture'}
                </h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSchedule} className="p-5 space-y-4">
              {isCopyingMode && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-start gap-2.5">
                  <Copy className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-amber-300">Duplicating Class Card</p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      Select the new target date below to place this class on a different date in the schedule calendar.
                    </p>
                  </div>
                </div>
              )}

              {/* Date Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Target Class Date *</span>
                  {isCopyingMode && <span className="text-amber-400 font-mono text-[10px]">Select New Date Below</span>}
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className={`w-full p-2.5 bg-slate-950 border rounded-xl text-xs font-mono font-bold text-white focus:ring-2 focus:outline-none ${
                    isCopyingMode 
                      ? 'border-amber-500/70 ring-2 ring-amber-500/30 focus:ring-amber-500' 
                      : 'border-slate-800 focus:ring-indigo-500/50 focus:border-indigo-500'
                  }`}
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Choose any date on the calendar where you want this class session to be placed.
                </p>
              </div>

              {/* Module Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Select Core Module
                </label>
                <select
                  value={formModuleCode}
                  onChange={(e) => setFormModuleCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  {CORE_MODULES.map(m => (
                    <option key={m.id} value={m.code} className="bg-slate-900 text-white">
                      {m.code}: {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lecture Title / Topic */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Lecture Title & Topic
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Five-Fold Governance & Spiritual Authority"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Period & Time Slot */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Period Slot
                  </label>
                  <select
                    value={formPeriod}
                    onChange={(e) => {
                      setFormPeriod(e.target.value);
                      const p = PERIODS.find(item => item.label === e.target.value);
                      if (p) setFormTimeSlot(p.time);
                    }}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {PERIODS.map(p => (
                      <option key={p.id} value={p.label} className="bg-slate-900 text-white">
                        {p.label} ({p.time})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Time Range
                  </label>
                  <input
                    type="text"
                    required
                    value={formTimeSlot}
                    onChange={(e) => setFormTimeSlot(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Instructor & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Instructor
                  </label>
                  <input
                    type="text"
                    required
                    value={formInstructor}
                    onChange={(e) => setFormInstructor(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    required
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Session Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="upcoming" className="bg-slate-900 text-white">Upcoming Session</option>
                  <option value="live" className="bg-slate-900 text-white">Live Active Session</option>
                  <option value="completed" className="bg-slate-900 text-white">Completed Session</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                {editingItem ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteSchedule(editingItem.id)}
                      className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        setIsCopyingMode(true);
                      }}
                      className="px-3 py-2 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/60 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      title="Convert this into a copy to place on a new target date"
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicate to New Date
                    </button>
                  </div>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 text-white font-black text-xs rounded-xl shadow-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isCopyingMode 
                        ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30' 
                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                    }`}
                  >
                    {isCopyingMode ? (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Class to Target Date
                      </>
                    ) : editingItem ? (
                      'Update Class'
                    ) : (
                      'Save & Schedule'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Schedule Exception / Alert Modal */}
      {showZoomExceptionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleUp text-slate-100">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white">Broadcast Schedule Exception Alert</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowZoomExceptionModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveZoomException} className="p-6 space-y-4">
              <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl text-xs text-blue-200">
                Standard Rule: <strong>Classes go live via Zoom every Tuesday (7:00 PM - 9:00 PM EST)</strong>. Use this toggle to notify students if a specific Tuesday class is modified, canceled, or moved.
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-white">Activate Schedule Exception Banner</p>
                  <p className="text-[10px] text-slate-400">Display notice on Student Portal & Schedule Tab</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasZoomException}
                    onChange={(e) => setHasZoomException(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                  Exception Details / Announcement Note
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Note: Class on Tuesday, August 4 will start at 7:30 PM EST via Zoom due to faculty convocation."
                  value={zoomExceptionNote}
                  onChange={(e) => setZoomExceptionNote(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowZoomExceptionModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  Save & Post Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
