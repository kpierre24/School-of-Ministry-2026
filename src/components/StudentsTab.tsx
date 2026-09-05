import { toast } from "sonner";
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  GraduationCap, 
  Award, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Trophy,
  Sliders,
  Sparkles,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Lock,
  Camera,
  Trash2,
  UserX,
  X,
  History,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  XCircle,
  CalendarDays,
  Check,
  LayoutGrid,
  Image,
  UserCheck,
  CheckCheck,
  Upload,
  Grid,
  Users,
  User,
  List
} from 'lucide-react';
import { generateStudentUsername } from '../lib/userAuth';
import { EmptyState } from './UXPrimitives';
import { getAttendanceLockInfo } from '../lib/attendanceLock';

export type StudentSummaryData = {
  name: string;
  rate: number;
  attended: number;
  totalDays: number;
  avgScore: number | null;
  note?: string;
  photoUrl?: string;
  attendanceByDay: Record<string, { present: boolean; timestamp?: string; score?: string }>;
};

interface StudentsTabProps {
  students: StudentSummaryData[];
  classDays?: { id: string; name: string }[];
  onSelectStudentForTranscript: (student: StudentSummaryData) => void;
  onSelectStudentForCertificate: (student: StudentSummaryData) => void;
  onSelectStudentForEmail: (student: StudentSummaryData) => void;
  onDeleteStudent?: (studentName: string) => void;
  rubricScores?: Record<string, { participation: number; scripture: number; assignment: number }>;
  onUpdateRubric?: (studentName: string, key: 'participation' | 'scripture' | 'assignment', val: number) => void;
  studentNotes: Record<string, string>;
  onUpdateNote: (studentName: string, note: string) => void;
  studentPhotos?: Record<string, string>;
  onUpdateStudentPhoto?: (studentName: string, photoDataUrl: string) => void;
  studentLevels?: Record<string, string>;
  onUpdateStudentLevel?: (studentName: string, levelId: string) => void;
  onOpenReportForLevel?: (levelId: string) => void;
  onOpenAttendanceReport?: (filter?: 'all' | 'fifty_percent' | 'at_risk') => void;
  atRiskThreshold: number;
  satisfactoryThreshold: number;
  onToggleAttendance?: (studentName: string, classDayId: string, newStatus: 'present' | 'absent' | 'excused') => void;
  excusedAbsences?: Record<string, Record<string, boolean>>;
  appRole?: string;
  onResetPassword?: (studentName: string) => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  students,
  classDays,
  onSelectStudentForTranscript,
  onSelectStudentForCertificate,
  onSelectStudentForEmail,
  onDeleteStudent,
  studentNotes,
  onUpdateNote,
  studentPhotos = {},
  onUpdateStudentPhoto,
  onOpenAttendanceReport,
  atRiskThreshold,
  satisfactoryThreshold,
  onToggleAttendance,
  excusedAbsences = {},
  appRole,
  onResetPassword
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'perfect' | 'satisfactory' | 'at_risk' | 'fifty_percent'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'last_name_asc' | 'last_name_desc' | 'rate_desc' | 'rate_asc' | 'score_desc' | 'score_asc'>('name_asc');
  const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');
  const [confirmingDeleteFor, setConfirmingDeleteFor] = useState<string | null>(null);
  
  const [expandedTimelineStudent, setExpandedTimelineStudent] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'present' | 'absent' | 'quizzes'>('all');

  // View mode state for directory view: 'cards', 'list' (compact card-based list), or 'gallery'
  const [directoryViewMode, setDirectoryViewMode] = useState<'cards' | 'list' | 'gallery'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 'list';
    }
    return 'cards';
  });
  const [selectedGalleryDayId, setSelectedGalleryDayId] = useState<string>('');
  const [showReportsDropdown, setShowReportsDropdown] = useState(false);
  const reportsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (reportsDropdownRef.current && !reportsDropdownRef.current.contains(e.target as Node)) {
        setShowReportsDropdown(false);
      }
    };
    if (showReportsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReportsDropdown]);

  useEffect(() => {
    if (classDays && classDays.length > 0 && !selectedGalleryDayId) {
      setSelectedGalleryDayId(classDays[classDays.length - 1].id);
    }
  }, [classDays, selectedGalleryDayId]);

  const activeGalleryDayId = selectedGalleryDayId || (classDays && classDays.length > 0 ? classDays[classDays.length - 1].id : '');

  const activeFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedStudentForPhotoUpload, setSelectedStudentForPhotoUpload] = useState<string | null>(null);

  const getTimelineItems = (s: StudentSummaryData) => {
    const dayMap = new Map<string, { id: string; name: string }>();
    if (classDays && classDays.length > 0) {
      classDays.forEach(d => dayMap.set(d.id, d));
    }
    Object.keys(s.attendanceByDay || {}).forEach(k => {
      if (!dayMap.has(k)) {
        dayMap.set(k, { id: k, name: k });
      }
    });

    return Array.from(dayMap.values()).map(day => {
      const rec = s.attendanceByDay?.[day.id];
      const isPresent = rec?.present === true;
      const rawTimestamp = rec?.timestamp;
      let formattedTime = 'No timestamp recorded';
      if (rawTimestamp) {
        try {
          const dateObj = new Date(rawTimestamp);
          if (!isNaN(dateObj.getTime())) {
            formattedTime = dateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } else {
            formattedTime = rawTimestamp;
          }
        } catch {
          formattedTime = rawTimestamp;
        }
      }

      return {
        id: day.id,
        name: day.name,
        present: isPresent,
        timestamp: formattedTime,
        rawTimestamp,
        score: rec?.score || (isPresent ? 'N/A' : '0%')
      };
    });
  };

  const handleTriggerUpload = (studentName: string) => {
    setSelectedStudentForPhotoUpload(studentName);
    if (activeFileInputRef.current) {
      activeFileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudentForPhotoUpload || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 480;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          if (onUpdateStudentPhoto) {
            onUpdateStudentPhoto(selectedStudentForPhotoUpload, resizedDataUrl);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  // Filtering & Sorting
  const filteredAndSortedStudents = useMemo(() => {
    const filtered = students.filter((s) => {
      if (!s || !s.name) return false;
      const matchesSearch = (s?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase());
      if (!matchesSearch) return false;

      if (statusFilter === 'perfect' && s.rate < 100) return false;
      if (statusFilter === 'satisfactory' && s.rate < satisfactoryThreshold) return false;
      if (statusFilter === 'at_risk' && s.rate >= atRiskThreshold) return false;
      if (statusFilter === 'fifty_percent' && s.rate > 50) return false;

      return true;
    });

    return [...filtered].sort((a, b) => {
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
        return ((b.avgScore || 0) - (a.avgScore || 0)) || nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true });
      }
      if (sortBy === 'score_asc') {
        return ((a.avgScore || 0) - (b.avgScore || 0)) || nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true });
      }
      return 0;
    });
  }, [students, searchQuery, statusFilter, satisfactoryThreshold, atRiskThreshold, sortBy]);

  // Gallery view stats for active session
  const gallerySessionStats = useMemo(() => {
    if (!activeGalleryDayId) return { present: 0, absent: 0, excused: 0 };
    let present = 0;
    let absent = 0;
    let excused = 0;

    filteredAndSortedStudents.forEach(s => {
      const studentKey = (s.name || '').toLowerCase().trim();
      const isExcused = !!(excusedAbsences?.[studentKey]?.[activeGalleryDayId]);
      const att = s.attendanceByDay?.[activeGalleryDayId];

      if (isExcused) {
        excused++;
      } else if (att?.present) {
        present++;
      } else {
        absent++;
      }
    });

    return { present, absent, excused };
  }, [filteredAndSortedStudents, activeGalleryDayId, excusedAbsences]);

  const handleMarkAllGalleryStudents = (status: 'present' | 'absent') => {
    if (!onToggleAttendance || !activeGalleryDayId) return;
    filteredAndSortedStudents.forEach(s => {
      onToggleAttendance(s.name, activeGalleryDayId, status);
    });
  };

  // Calculate high level stats
  const totalStudents = students.length;
  const perfectStudents = students.filter(s => s.rate >= 100).length;
  const atRiskStudents = students.filter(s => s.rate < atRiskThreshold).length;
  const fiftyPercentStudents = students.filter(s => s.rate <= 50).length;
  const satisfactoryStudents = students.filter(s => s.rate >= satisfactoryThreshold).length;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-28 sm:pb-24 md:pb-8 material-screen w-full max-w-full overflow-x-hidden">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3.5 sm:mb-6">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <h2 className="font-display text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Student Enrolment Directory</h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 max-w-2xl">
              Centralized management of student profiles, attendance records, academic standing, and official transcripts.
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
            <span className="font-display font-bold">HTEIM Cohort 2026</span>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <div className="tactile-card bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl p-2.5 sm:p-4">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Enrolled</p>
            <p className="font-display text-xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1">{totalStudents}</p>
            <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">Ministry Candidates</p>
          </div>
          <div className="tactile-card bg-slate-50 dark:bg-slate-800/90 border border-emerald-200/60 dark:border-emerald-800/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-4">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Satisfactory</p>
            <p className="font-display text-xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1">{satisfactoryStudents}</p>
            <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">&ge; {satisfactoryThreshold}% Attendance</p>
          </div>
          <div className="tactile-card bg-slate-50 dark:bg-slate-800/90 border border-amber-200/60 dark:border-amber-800/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-4">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Perfect 100%</p>
            <p className="font-display text-xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1">{perfectStudents}</p>
            <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">100% Commendation</p>
          </div>
          <div className="tactile-card bg-slate-50 dark:bg-slate-800/90 border border-rose-200/60 dark:border-rose-800/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-4">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">At-Risk Alert</p>
            <p className="font-display text-xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-0.5 sm:mt-1">{atRiskStudents}</p>
            <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">&lt; {atRiskThreshold}% Attendance</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Sticky for smooth scroll ergonomics) */}
      <div className="sticky top-1 sm:top-3 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md flex flex-col space-y-2.5 sm:space-y-3 material-surface transition-all w-full max-w-full">
        {/* Row 1: Search & Action Tools */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap md:flex-nowrap w-full">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0 w-full md:w-auto">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student profile by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-between md:justify-end w-full md:w-auto overflow-x-auto no-scrollbar py-0.5">
            {/* View Mode Toggle: Cards vs List vs Photo Gallery */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setDirectoryViewMode('list')}
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shrink-0 ${
                  directoryViewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Compact Responsive Card-Based List View (Optimized for Mobile)"
              >
                <List className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="hidden xs:inline">List</span>
              </button>
              <button
                type="button"
                onClick={() => setDirectoryViewMode('cards')}
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shrink-0 ${
                  directoryViewMode === 'cards'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Detailed Student Profile Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="hidden xs:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setDirectoryViewMode('gallery')}
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shrink-0 ${
                  directoryViewMode === 'gallery'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Visual Photo Gallery View with Attendance Marking"
              >
                <Camera className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline">Photos</span>
              </button>
            </div>

            {/* Sorting Dropdown & Quick Toggle */}
            <div className="flex items-center gap-1 shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs shrink-0 max-w-[110px] xs:max-w-[130px] sm:max-w-none truncate"
                title="Sort student list"
              >
                <option value="name_asc">Name (A → Z)</option>
                <option value="name_desc">Name (Z → A)</option>
                <option value="last_name_asc">Last Name (A → Z)</option>
                <option value="last_name_desc">Last Name (Z → A)</option>
                <option value="rate_desc">Att. (High → Low)</option>
                <option value="rate_asc">Att. (Low → High)</option>
                <option value="score_desc">Avg Score (High → Low)</option>
                <option value="score_asc">Avg Score (Low → High)</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSortBy(prev => prev === 'name_asc' ? 'name_desc' : 'name_asc');
                }}
                className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0 ${
                  sortBy === 'name_asc' || sortBy === 'name_desc'
                    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title={sortBy === 'name_asc' ? 'Currently sorted A to Z. Click for Z to A.' : 'Click to toggle Name Ascending (A-Z) / Descending (Z-A)'}
              >
                {sortBy === 'name_asc' ? (
                  <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 stroke-[2.5] shrink-0" />
                ) : sortBy === 'name_desc' ? (
                  <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 stroke-[2.5] shrink-0" />
                ) : (
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className="hidden md:inline font-bold">
                  {sortBy === 'name_desc' ? 'Z-A' : 'A-Z'}
                </span>
              </button>
            </div>

            {/* Attendance Reports - Desktop buttons & Mobile dropdown */}
            {onOpenAttendanceReport && (
              <div className="relative shrink-0" ref={reportsDropdownRef}>
                {/* Desktop view */}
                <div className="hidden lg:flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenAttendanceReport('fifty_percent')}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer whitespace-nowrap shadow-xs flex items-center gap-1.5 shrink-0"
                    title="Generate printable/downloadable official report for candidates with 50% or lower attendance"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                    <span>Export &le;50% Report</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAttendanceReport('all')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 whitespace-nowrap"
                    title="Generate Printable Full Attendance Report"
                  >
                    <FileText className="w-3.5 h-3.5 text-white shrink-0" />
                    <span>Full Report</span>
                  </button>
                </div>

                {/* Mobile / Tablet Compact Reports Menu Button */}
                <div className="lg:hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowReportsDropdown(!showReportsDropdown)}
                    className="px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                    title="Open Attendance Reports Menu"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="hidden xs:inline">Reports</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showReportsDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showReportsDropdown && (
                    <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 animate-fadeIn space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                        Attendance Reports
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenAttendanceReport('fifty_percent');
                          setShowReportsDropdown(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-extrabold text-xs truncate">Export &le;50% Report</p>
                            <p className="text-[10px] text-slate-400 font-normal truncate">Low attendance cohort</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 shrink-0">
                          {fiftyPercentStudents}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenAttendanceReport('all');
                          setShowReportsDropdown(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-extrabold text-xs truncate">Full Attendance Report</p>
                            <p className="text-[10px] text-slate-400 font-normal truncate">Complete candidate roster</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 shrink-0">
                          {students.length}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Standing Filter Chips (Horizontal Smooth Scroll, No Scrollbars, Zero Overlap) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full flex-nowrap scroll-smooth touch-pan-x">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs ${
              statusFilter === 'all' 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>All Candidates</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
              statusFilter === 'all' 
                ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {students.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('satisfactory')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs ${
              statusFilter === 'satisfactory' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
            <span>Good Standing</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">
              {satisfactoryStudents}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('perfect')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs ${
              statusFilter === 'perfect' 
                ? 'bg-amber-500 text-slate-950 shadow-xs' 
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>Honor Roll</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black bg-amber-200/60 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200">
              {perfectStudents}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('at_risk')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs ${
              statusFilter === 'at_risk' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
            <span>At-Risk</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black bg-rose-200/60 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200">
              {atRiskStudents}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('fifty_percent')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs ${
              statusFilter === 'fifty_percent' 
                ? 'bg-purple-600 text-white shadow-xs' 
                : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800'
            }`}
          >
            <span>&le;50% Low Att.</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black bg-purple-200/60 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200">
              {fiftyPercentStudents}
            </span>
          </button>
        </div>
      </div>

      {/* Hidden File Input for Student Photo Uploads */}
      <input 
        type="file" 
        ref={activeFileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileSelected} 
      />

      {/* View Mode Content Switcher */}
      {directoryViewMode === 'gallery' ? (
        /* Visual Student Photo Gallery View */
        <div className="space-y-5 animate-fadeIn">
          {/* Gallery Header Banner: Active Class Session Selector, Stats & Batch Actions */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Student Photo Gallery</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono font-semibold">
                    {filteredAndSortedStudents.length} Profiles
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Visual thumbnail grid for rapid identification, photo management, and manual attendance marking.
                </p>
              </div>
            </div>

            {/* Session Selector & Batch Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              {classDays && classDays.length > 0 && (
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 w-full sm:w-auto">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">Marking Session:</span>
                  <select
                    value={activeGalleryDayId ?? ''}
                    onChange={(e) => setSelectedGalleryDayId(e.target.value)}
                    className="bg-transparent font-semibold text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer w-full sm:w-auto pr-2"
                  >
                    {classDays.map((day, dIdx) => (
                      <option key={`gal-day-${day.id || 'day'}-${dIdx}`} value={day.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {day.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {onToggleAttendance && activeGalleryDayId && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleMarkAllGalleryStudents('present')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    title="Mark all displayed students as Present for this session"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark All Present</span>
                  </button>
                  <button
                    onClick={() => handleMarkAllGalleryStudents('absent')}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    title="Mark all displayed students as Absent for this session"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Mark All Absent</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Session Stats Banner */}
          {activeGalleryDayId && (
            <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs text-xs font-bold">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-500 font-extrabold flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-600" /> Session Status:
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{gallerySessionStats.present} Present</span>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-extrabold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{gallerySessionStats.absent} Absent</span>
                </span>
                {gallerySessionStats.excused > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-extrabold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>{gallerySessionStats.excused} Excused</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Use action buttons on any card to toggle student attendance in real time.
              </p>
            </div>
          )}

          {/* Photo Gallery Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedStudents.map((s, idx) => {
                const studentKey = (s.name || '').toLowerCase().trim();
                const photoUrl = studentPhotos[studentKey] || s.photoUrl;
                const isExcused = !!(excusedAbsences?.[studentKey]?.[activeGalleryDayId]);
                const dayRecord = s.attendanceByDay?.[activeGalleryDayId];
                const isPresent = !isExcused && dayRecord?.present === true;
                const isAbsent = !isExcused && (!dayRecord || dayRecord.present === false);
                const activeDayObj = classDays?.find(d => d.id === activeGalleryDayId);
                const cardLockInfo = getAttendanceLockInfo(dayRecord, activeDayObj);
                const isCardLocked = cardLockInfo.isLocked;

                return (
                  <motion.div
                    key={`gallery-${s.name || idx}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    whileHover={{ scale: 1.025, y: -3 }}
                    transition={{
                      layout: { type: 'spring', stiffness: 280, damping: 28, mass: 0.8 },
                      opacity: { duration: 0.18 },
                      scale: { duration: 0.18 },
                      y: { duration: 0.18 }
                    }}
                    className="bg-white border border-slate-200 hover:border-indigo-300 dark:hover:border-indigo-600 rounded-2xl p-3 shadow-2xs hover:shadow-xl transition-shadow flex flex-col justify-between group/photoCard relative cursor-pointer"
                  >
                    {/* Thumbnail Container */}
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white font-black text-xl flex items-center justify-center border border-slate-200 shadow-inner group/thumb">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={s.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-2">
                          <span className="text-2xl font-black uppercase tracking-wider mb-1">
                            {s.name.charAt(0)}
                          </span>
                          <span className="text-[9px] text-indigo-200 font-bold opacity-80 group-hover/thumb:opacity-100 transition-opacity">
                            Upload Photo
                          </span>
                        </div>
                      )}

                      {/* Photo Upload Hover Trigger */}
                      <div
                        onClick={() => handleTriggerUpload(s.name)}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer p-2 text-center"
                        title="Click to upload or change photo"
                      >
                        <Camera className="w-5 h-5 mb-1 text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-600 px-2 py-0.5 rounded-full shadow-sm">
                          {photoUrl ? 'Change Photo' : 'Upload Photo'}
                        </span>
                      </div>

                      {/* Top Left Overall Attendance Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-black shadow-md border ${
                          s.rate >= satisfactoryThreshold
                            ? 'bg-emerald-600/90 text-white border-emerald-400/50'
                            : s.rate >= atRiskThreshold
                            ? 'bg-amber-500/90 text-slate-950 border-amber-300/50'
                            : 'bg-rose-600/90 text-white border-rose-400/50'
                        }`}>
                          {Math.round(s.rate)}%
                        </span>
                      </div>

                      {/* Top Right Active Session Status Badge */}
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                        {isCardLocked && (
                          <span className="p-1 rounded-lg bg-slate-900/80 text-slate-300 backdrop-blur-xs shadow-md border border-slate-700" title="Locked (>24h since capture)">
                            <Lock className="w-3 h-3 text-slate-300" />
                          </span>
                        )}
                        {isExcused ? (
                          <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-amber-500 text-slate-950 shadow-md border border-amber-300 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Excused
                          </span>
                        ) : isPresent ? (
                          <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-emerald-600 text-white shadow-md border border-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Present
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-rose-600 text-white shadow-md border border-rose-400 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Absent
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Student Name & Info */}
                    <div className="mt-2.5 mb-2">
                      <h4 
                        className="text-xs font-black text-slate-900 line-clamp-1 group-hover/photoCard:text-indigo-600 transition-colors"
                        title={s.name}
                      >
                        {s.name}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mt-0.5">
                        <span>{s.attended} sessions attended</span>
                        {s.avgScore !== null && (
                          <span className="text-indigo-600 font-mono font-extrabold">{Math.round(s.avgScore)}% Score</span>
                        )}
                      </div>
                    </div>

                    {/* Manual Attendance Action Buttons */}
                    {onToggleAttendance && activeGalleryDayId ? (
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1">
                        <button
                          onClick={() => onToggleAttendance(s.name, activeGalleryDayId, 'present')}
                          className={`py-1 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-0.5 cursor-pointer ${
                            isPresent
                              ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          } ${isCardLocked ? 'opacity-85' : ''}`}
                          title={isCardLocked ? '🔒 Record Locked (>24h since capture)' : `Mark ${s.name} as Present`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="hidden xs:inline">Present</span>
                          {isCardLocked && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                        </button>

                        <button
                          onClick={() => onToggleAttendance(s.name, activeGalleryDayId, 'absent')}
                          className={`py-1 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-0.5 cursor-pointer ${
                            isAbsent
                              ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-400'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          } ${isCardLocked ? 'opacity-85' : ''}`}
                          title={isCardLocked ? '🔒 Record Locked (>24h since capture)' : `Mark ${s.name} as Absent`}
                        >
                          <XCircle className="w-3 h-3" />
                          <span className="hidden xs:inline">Absent</span>
                          {isCardLocked && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                        </button>

                        <button
                          onClick={() => onToggleAttendance(s.name, activeGalleryDayId, 'excused')}
                          className={`py-1 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-0.5 cursor-pointer ${
                            isExcused
                              ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-300'
                              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                          } ${isCardLocked ? 'opacity-85' : ''}`}
                          title={isCardLocked ? '🔒 Record Locked (>24h since capture)' : `Mark ${s.name} as Excused`}
                        >
                          <AlertCircle className="w-3 h-3" />
                          <span className="hidden xs:inline">Excused</span>
                          {isCardLocked && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center font-bold">
                        Read Only
                      </div>
                    )}

                    {/* Quick Document Actions Bar */}
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTriggerUpload(s.name)}
                          className="hover:text-indigo-600 min-w-[44px] min-h-[44px] p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer touch-min-44"
                          title="Upload/Update Photo"
                          aria-label={`Upload photo for ${s.name}`}
                        >
                          <Camera className="w-4 h-4 text-indigo-500" />
                        </button>

                        {appRole === 'admin' && onResetPassword && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to reset the password/PIN for ${s.name} back to default (1234)?`)) {
                                onResetPassword(s.name);
                              }
                            }}
                            className="hover:text-rose-600 min-w-[44px] min-h-[44px] p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer touch-min-44"
                            title="Reset Password/PIN to 1234"
                            aria-label={`Reset password for ${s.name}`}
                          >
                            <Lock className="w-4 h-4 text-rose-500" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onSelectStudentForTranscript(s)}
                          className="p-2.5 min-w-[44px] min-h-[44px] text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer touch-min-44"
                          title="Transcript"
                          aria-label={`View transcript for ${s.name}`}
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectStudentForCertificate(s)}
                          className="p-2.5 min-w-[44px] min-h-[44px] text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer touch-min-44"
                          title="Certificate"
                          aria-label={`View certificate for ${s.name}`}
                        >
                          <Award className="w-4 h-4 text-amber-500" />
                        </button>
                        <button
                          onClick={() => onSelectStudentForEmail(s)}
                          className="p-2.5 min-w-[44px] min-h-[44px] text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer touch-min-44"
                          title="Email Notice"
                          aria-label={`Send email notice to ${s.name}`}
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      ) : directoryViewMode === 'list' ? (
        /* Compact Responsive Card-Based List Format (Optimized for Mobile) */
        <div className="flex flex-col space-y-2.5 sm:space-y-3 w-full max-w-full">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedStudents.map((s, idx) => {
              const studentKey = (s.name || '').toLowerCase().trim();
              const photoUrl = studentPhotos[studentKey] || s.photoUrl;
              const currentNote = studentNotes[studentKey] || s.note || '';
              const canIssueDocs = s.rate >= 80;
              const timelineItems = getTimelineItems(s);
              const isExpanded = expandedTimelineStudent === s.name;

              return (
                <motion.div
                  key={`list-card-${s.name || idx}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs hover:shadow-md transition-all flex flex-col space-y-2.5 relative group overflow-hidden w-full max-w-full"
                >
                  {/* Delete Confirmation Overlay */}
                  {confirmingDeleteFor === s.name && (
                    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xs rounded-xl sm:rounded-2xl p-4 z-20 flex flex-col justify-between text-white animate-fadeIn">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-rose-400 font-extrabold text-xs">
                          <UserX className="w-4 h-4 shrink-0" />
                          <span>Delete Student Confirmation</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          Are you sure you want to remove <strong className="text-white">{s.name}</strong> from all courses and directory records?
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => setConfirmingDeleteFor(null)}
                          className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (onDeleteStudent) onDeleteStudent(s.name);
                            setConfirmingDeleteFor(null);
                          }}
                          className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Row 1: Primary Identity & Badges */}
                  <div className="flex items-center justify-between gap-2 w-full min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Compact Photo Avatar */}
                      <div 
                        onClick={() => handleTriggerUpload(s.name)}
                        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-xs shrink-0 uppercase cursor-pointer group/avatar border border-slate-200 dark:border-slate-700"
                        title="Click to upload profile photo"
                      >
                        {photoUrl ? (
                          <img src={photoUrl} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{s.name.charAt(0)}{s.name.split(' ')[1] ? s.name.split(' ')[1].charAt(0) : ''}</span>
                        )}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Camera className="w-3 h-3 text-amber-300" />
                        </div>
                      </div>

                      {/* Name & ID */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {s.name}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleTriggerUpload(s.name)}
                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5 rounded cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Upload photo"
                          >
                            <Camera className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                          ID: HTEIM-{Math.abs(s.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)).toString().substring(0, 4)}
                        </p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                      <span className={`font-mono text-[11px] sm:text-xs font-black px-2 py-0.5 rounded-lg ${
                        s.rate >= satisfactoryThreshold
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : s.rate >= atRiskThreshold
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {Math.round(s.rate)}%
                      </span>

                      {s.rate >= 100 ? (
                        <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          <Trophy className="w-2.5 h-2.5 text-amber-600" /> 100%
                        </span>
                      ) : s.rate >= satisfactoryThreshold ? (
                        <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Good
                        </span>
                      ) : (
                        <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 animate-pulse">
                          <AlertCircle className="w-2.5 h-2.5 text-rose-600" /> At-Risk
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Compact Metrics & Progress Bar */}
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-800/60 p-2 sm:p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 w-full">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          s.rate >= satisfactoryThreshold ? 'bg-emerald-500' : s.rate >= atRiskThreshold ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, s.rate))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 gap-1.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className="text-slate-400 dark:text-slate-500 font-semibold">Sessions:</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-mono">{s.attended}/{s.totalDays || classDays?.length || 0}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-slate-400 dark:text-slate-500 font-semibold">Quiz Avg:</span>
                        <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{s.avgScore !== null ? `${Math.round(s.avgScore)}%` : 'N/A'}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-slate-400 dark:text-slate-500 font-semibold">Status:</span>
                        <strong className={s.rate >= satisfactoryThreshold ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {s.rate >= 100 ? 'Honor Roll' : s.rate >= satisfactoryThreshold ? 'Satisfactory' : 'Below 75%'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Note Snippet or Add Note Button (Compact) */}
                  {editingNoteFor === studentKey ? (
                    <div className="space-y-1.5 pt-1">
                      <textarea
                        rows={2}
                        value={tempNoteText ?? ''}
                        onChange={(e) => setTempNoteText(e.target.value)}
                        placeholder="Add faculty note..."
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingNoteFor(null)}
                          className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onUpdateNote(s.name, tempNoteText);
                            setEditingNoteFor(null);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold bg-indigo-600 text-white rounded-md cursor-pointer"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  ) : currentNote ? (
                    <div 
                      onClick={() => {
                        setEditingNoteFor(studentKey);
                        setTempNoteText(currentNote);
                      }}
                      className="px-2 py-1 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-lg text-[10px] text-amber-800 dark:text-amber-300 italic truncate cursor-pointer flex items-center justify-between"
                      title="Click to edit faculty note"
                    >
                      <span className="truncate">Note: {currentNote}</span>
                      <span className="text-[9px] font-semibold underline shrink-0 ml-1">Edit</span>
                    </div>
                  ) : null}

                  {/* Row 3: Action Buttons & History Drawer Toggle (Zero horizontal overflow) */}
                  <div className="flex items-center gap-1.5 sm:gap-2 w-full pt-1">
                    <button
                      onClick={() => canIssueDocs && onSelectStudentForTranscript(s)}
                      disabled={!canIssueDocs}
                      className={`flex-1 min-w-0 py-1.5 px-2 text-[10px] sm:text-[11px] font-bold rounded-lg border transition-colors flex items-center justify-center gap-1 ${
                        canIssueDocs 
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 cursor-pointer' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                      }`}
                      title={canIssueDocs ? "Generate Official Transcript PDF" : `Requires ≥80% attendance (Current: ${Math.round(s.rate)}%)`}
                    >
                      {canIssueDocs ? <FileText className="w-3 h-3 shrink-0" /> : <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                      <span className="truncate">Transcript</span>
                    </button>

                    <button
                      onClick={() => canIssueDocs && onSelectStudentForCertificate(s)}
                      disabled={!canIssueDocs}
                      className={`flex-1 min-w-0 py-1.5 px-2 text-[10px] sm:text-[11px] font-black rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs ${
                        canIssueDocs 
                          ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60 shadow-none'
                      }`}
                      title={canIssueDocs ? "Award Milestone Certificate" : `Requires ≥80% attendance (Current: ${Math.round(s.rate)}%)`}
                    >
                      {canIssueDocs ? <Award className="w-3 h-3 shrink-0" /> : <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                      <span className="truncate">Certificate</span>
                    </button>

                    {s.rate < atRiskThreshold && (
                      <button
                        onClick={() => onSelectStudentForEmail(s)}
                        className="py-1.5 px-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] sm:text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                        title="Send Email Warning Notice"
                        aria-label={`Send email warning to ${s.name}`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Details & Timeline Toggle */}
                    <button
                      type="button"
                      onClick={() => setExpandedTimelineStudent(isExpanded ? null : s.name)}
                      className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                        isExpanded 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                      title={isExpanded ? "Collapse Timeline" : "View Attendance & Quiz Timeline"}
                    >
                      <History className="w-3 h-3 shrink-0" />
                      <span className="hidden xxs:inline">{isExpanded ? 'Hide' : 'Timeline'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
                    </button>
                  </div>

                  {/* Expandable Activity Feed and Notes Drawer */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden w-full max-w-full"
                      >
                        {/* Note creation prompt if empty */}
                        {!currentNote && editingNoteFor !== studentKey && (
                          <div 
                            onClick={() => {
                              setEditingNoteFor(studentKey);
                              setTempNoteText('');
                            }}
                            className="p-1.5 bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between mt-1 mb-2"
                          >
                            <span>+ Add faculty comment or note</span>
                          </div>
                        )}

                        {/* Dot Strip */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 w-full my-1">
                          <span className="text-[10px] text-slate-400 font-semibold mr-1 shrink-0">Recent:</span>
                          {timelineItems.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">No history recorded</span>
                          ) : (
                            timelineItems.slice(0, 14).map((item, dotIdx) => (
                              <div
                                key={`list-dot-${item.id || dotIdx}-${dotIdx}`}
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  item.present ? 'bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950' : 'bg-rose-500 ring-2 ring-rose-100 dark:ring-rose-950'
                                }`}
                                title={`${item.name}: ${item.present ? 'Attended' : 'Absent'} (${item.score})`}
                              />
                            ))
                          )}
                        </div>

                        {/* Feed box */}
                        <div className="bg-slate-900 rounded-xl p-3 text-white space-y-2.5 mt-2 border border-slate-800 shadow-inner w-full max-w-full overflow-hidden">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Timeline Feed</span>
                            </div>

                            <div className="flex items-center gap-1 text-[10px] overflow-x-auto no-scrollbar py-0.5">
                              <button
                                type="button"
                                onClick={() => setTimelineFilter('all')}
                                className={`px-2 py-0.5 rounded transition-colors cursor-pointer shrink-0 ${
                                  timelineFilter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                All ({timelineItems.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setTimelineFilter('present')}
                                className={`px-2 py-0.5 rounded transition-colors cursor-pointer shrink-0 ${
                                  timelineFilter === 'present' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => setTimelineFilter('absent')}
                                className={`px-2 py-0.5 rounded transition-colors cursor-pointer shrink-0 ${
                                  timelineFilter === 'absent' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() => setTimelineFilter('quizzes')}
                                className={`px-2 py-0.5 rounded transition-colors cursor-pointer shrink-0 ${
                                  timelineFilter === 'quizzes' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                Quizzes
                              </button>
                            </div>
                          </div>

                          {/* Chronological Activity Line */}
                          <div className="relative pl-5 ml-2.5 border-l-2 border-indigo-900/80 space-y-2.5 my-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                            {timelineItems
                              .filter(item => {
                                if (timelineFilter === 'present') return item.present;
                                if (timelineFilter === 'absent') return !item.present;
                                if (timelineFilter === 'quizzes') return item.score && item.score !== 'N/A' && item.score !== '0%';
                                return true;
                              })
                              .map((item, idx) => (
                                <div key={`list-tl-item-${item.id || idx}-${idx}`} className="relative group/timeline">
                                  <div 
                                    className={`absolute -left-[29px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-slate-900 ${
                                      item.present 
                                        ? 'bg-emerald-500 text-slate-950 shadow-xs' 
                                        : 'bg-rose-500 text-white shadow-xs'
                                    }`}
                                  >
                                    {item.present ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>

                                  <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-extrabold text-slate-100 truncate">
                                        {item.name}
                                      </span>
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                                        item.present ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                                      }`}>
                                        {item.present ? 'Attended' : 'Absent'}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                                      <span className="flex items-center gap-1 truncate">
                                        <CalendarDays className="w-3 h-3 text-indigo-400 shrink-0" />
                                        <span className="truncate">{item.timestamp}</span>
                                      </span>

                                      {item.score && (
                                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 ${
                                          item.present 
                                            ? 'bg-indigo-900/60 text-indigo-200 border border-indigo-700/50' 
                                            : 'bg-slate-900 text-slate-500'
                                        }`}>
                                          Quiz: {item.score}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>

                          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                            <span>Total Sessions Tracked: {timelineItems.length}</span>
                            <button
                              type="button"
                              onClick={() => setExpandedTimelineStudent(null)}
                              className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                            >
                              Collapse Feed
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Detailed Student Profile Cards Grid (Mobile-Optimized) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 w-full max-w-full">
          <AnimatePresence mode="popLayout">
          {filteredAndSortedStudents.map((s, idx) => {
            const studentKey = (s.name || '').toLowerCase().trim();
            const photoUrl = studentPhotos[studentKey] || s.photoUrl;
            const currentNote = studentNotes[studentKey] || s.note || '';
            const canIssueDocs = s.rate >= 80;

            return (
              <motion.div 
                key={`card-${s.name || idx}`}
                layout
                initial={{ opacity: 0, scale: 0.92, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: -12 }}
                whileHover={{ scale: 1.015, y: -3 }}
                transition={{
                  layout: { type: 'spring', stiffness: 280, damping: 28, mass: 0.8 },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                  y: { duration: 0.2 }
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-2xs hover:shadow-xl transition-shadow flex flex-col justify-between space-y-3 sm:space-y-4 relative group w-full max-w-full overflow-hidden"
              >
                {/* Delete Confirmation Overlay */}
                {confirmingDeleteFor === s.name && (
                  <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xs rounded-2xl p-5 z-20 flex flex-col justify-between text-white animate-fadeIn">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-rose-400 font-extrabold text-xs">
                        <UserX className="w-4 h-4" />
                        <span>Delete Student Confirmation</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        Are you sure you want to remove <strong className="text-white">{s.name}</strong> completely from all courses and directory records?
                      </p>
                      <p className="text-[10px] text-slate-400">
                        You can restore excluded students at any time from the Excluded Students section in the sidebar.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-3">
                      <button
                        onClick={() => setConfirmingDeleteFor(null)}
                        className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (onDeleteStudent) onDeleteStudent(s.name);
                          setConfirmingDeleteFor(null);
                        }}
                        className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
                {/* Card Header: Student Avatar & Basic Info */}
                <div>
                  <div className="flex items-start justify-between gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      {/* Interactive Profile Photo Avatar */}
                      <div 
                        onClick={() => handleTriggerUpload(s.name)}
                        className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-black text-sm flex items-center justify-center shadow-md flex-shrink-0 uppercase cursor-pointer group/avatar border border-slate-200 dark:border-slate-700"
                        title="Click to upload/change student profile photo"
                      >
                        {photoUrl ? (
                          <img 
                            src={photoUrl} 
                            alt={s.name} 
                            className="w-full h-full object-cover transition-transform group-hover/avatar:scale-105" 
                          />
                        ) : (
                          <span>{s.name.charAt(0)}{s.name.split(' ')[1] ? s.name.split(' ')[1].charAt(0) : ''}</span>
                        )}

                        {/* Camera icon overlay */}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Camera className="w-4 h-4 text-amber-300" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight truncate">
                            {s.name}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleTriggerUpload(s.name)}
                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                            title="Upload profile photo"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">
                          ID: HTEIM-{Math.abs(s.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)).toString().substring(0, 4)}
                        </p>
                      </div>
                    </div>

                    {/* Standing Badge */}
                    <div className="shrink-0">
                      {s.rate >= 100 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          <Trophy className="w-3 h-3 text-amber-600" /> 100%
                        </span>
                      ) : s.rate >= satisfactoryThreshold ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Good
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 animate-pulse">
                          <AlertCircle className="w-3 h-3 text-rose-600" /> At-Risk
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress & Stats Bar */}
                  <div className="space-y-1.5 sm:space-y-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 sm:p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-400">Attendance Standing</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{Math.round(s.rate)}% ({s.attended}/{s.totalDays || classDays?.length || 0})</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          s.rate >= satisfactoryThreshold ? 'bg-emerald-500' : s.rate >= atRiskThreshold ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, s.rate))}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1.5 sm:pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[9px] uppercase font-bold">Quiz / Acad. Avg</span>
                        <span className="font-mono font-extrabold text-indigo-700 dark:text-indigo-400 text-xs">
                          {s.avgScore !== null ? `${Math.round(s.avgScore)}%` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[9px] uppercase font-bold">Sessions Attended</span>
                        <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200 text-xs">{s.attended} / {s.totalDays || classDays?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Note Field */}
                  <div className="mt-2.5 sm:mt-3">
                    {editingNoteFor === studentKey ? (
                      <div className="space-y-1.5">
                        <textarea
                          rows={2}
                          value={tempNoteText ?? ''}
                          onChange={(e) => setTempNoteText(e.target.value)}
                          placeholder="Add faculty note or advisory comment..."
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingNoteFor(null)}
                            className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              onUpdateNote(s.name, tempNoteText);
                              setEditingNoteFor(null);
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold bg-indigo-600 text-white rounded-md cursor-pointer"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => {
                          setEditingNoteFor(studentKey);
                          setTempNoteText(currentNote);
                        }}
                        className="p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-[10px] sm:text-[11px] italic truncate">
                          {currentNote || '+ Add faculty comment / note'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Attendance History Timeline Bar & Feed Toggle */}
                  {(() => {
                    const timelineItems = getTimelineItems(s);
                    const isExpanded = expandedTimelineStudent === s.name;
                    const filteredItems = timelineItems.filter(item => {
                      if (timelineFilter === 'present') return item.present;
                      if (timelineFilter === 'absent') return !item.present;
                      if (timelineFilter === 'quizzes') return item.score && item.score !== 'N/A' && item.score !== '0%';
                      return true;
                    });

                    return (
                      <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 sm:space-y-3 w-full">
                        <div className="flex flex-wrap xs:flex-nowrap items-center justify-between gap-1.5 sm:gap-2 w-full">
                          {/* Mini Visual Dot Strip */}
                          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 shrink-0 max-w-[130px] xs:max-w-[160px] sm:max-w-[190px]">
                            {timelineItems.length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic">No history</span>
                            ) : (
                              timelineItems.slice(0, 10).map((item, dotIdx) => (
                                <div
                                  key={`dot-${item.id || dotIdx}-${dotIdx}`}
                                  onClick={() => setExpandedTimelineStudent(isExpanded ? null : s.name)}
                                  className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all hover:scale-125 cursor-pointer ${
                                    item.present ? 'bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950' : 'bg-rose-500 ring-2 ring-rose-100 dark:ring-rose-950'
                                  }`}
                                  title={`${item.name}: ${item.present ? 'Attended' : 'Absent'} (${item.score})`}
                                />
                              ))
                            )}
                            {timelineItems.length > 10 && (
                              <span className="text-[9px] font-extrabold text-slate-400 shrink-0">+{timelineItems.length - 10}</span>
                            )}
                          </div>

                          {/* Toggle History Button */}
                          <button
                            type="button"
                            onClick={() => setExpandedTimelineStudent(isExpanded ? null : s.name)}
                            className={`px-2 sm:px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shadow-2xs shrink-0 ${
                              isExpanded 
                                ? 'bg-indigo-600 text-white shadow-xs' 
                                : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800'
                            }`}
                          >
                            <History className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            <span>Timeline ({timelineItems.length})</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> : <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />}
                          </button>
                        </div>

                        {/* Expandable Chronological Activity Feed Panel */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.22 }}
                              className="overflow-hidden w-full max-w-full"
                            >
                              <div className="bg-slate-900 rounded-xl p-3 sm:p-3.5 text-white space-y-2.5 sm:space-y-3 mt-2 border border-slate-800 shadow-inner w-full max-w-full overflow-hidden">
                                {/* Feed Header & Filter Tabs */}
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-1.5 sm:gap-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>Attendance & Quiz Feed</span>
                                  </div>

                                  <div className="flex items-center gap-1 text-[10px] overflow-x-auto no-scrollbar py-0.5">
                                    <button
                                      type="button"
                                      onClick={() => setTimelineFilter('all')}
                                      className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer shrink-0 ${
                                        timelineFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                      }`}
                                    >
                                      All ({timelineItems.length})
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTimelineFilter('present')}
                                      className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer shrink-0 ${
                                        timelineFilter === 'present' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                      }`}
                                    >
                                      Attended
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTimelineFilter('absent')}
                                      className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer shrink-0 ${
                                        timelineFilter === 'absent' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                      }`}
                                    >
                                      Absences
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTimelineFilter('quizzes')}
                                      className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer shrink-0 ${
                                        timelineFilter === 'quizzes' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                      }`}
                                    >
                                      Quizzes
                                    </button>
                                  </div>
                                </div>

                                {/* Chronological Activity Line */}
                                <div className="relative pl-5 ml-2.5 border-l-2 border-indigo-900/80 space-y-3.5 my-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                  {filteredItems.length === 0 ? (
                                    <EmptyState
                                      title="No activity yet"
                                      description="Attendance and quiz activity will appear here when records are available."
                                      icon={<Clock className="h-5 w-5" />}
                                    />
                                  ) : (
                                    filteredItems.map((item, idx) => (
                                      <div key={`tl-item-${item.id || idx}-${idx}`} className="relative group/timeline">
                                        {/* Node Icon on Timeline Line */}
                                        <div 
                                          className={`absolute -left-[29px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-slate-900 ${
                                            item.present 
                                              ? 'bg-emerald-500 text-slate-950 shadow-xs' 
                                              : 'bg-rose-500 text-white shadow-xs'
                                          }`}
                                        >
                                          {item.present ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[3]" />}
                                        </div>

                                        {/* Activity Content Card */}
                                        <div className="bg-slate-800/80 p-2 sm:p-2.5 rounded-lg border border-slate-700/60 space-y-1">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-extrabold text-slate-100 truncate">
                                              {item.name}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                                              item.present ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                                            }`}>
                                              {item.present ? 'Attended' : 'Absent'}
                                            </span>
                                          </div>

                                          <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                                            <span className="flex items-center gap-1 truncate">
                                              <CalendarDays className="w-3 h-3 text-indigo-400 shrink-0" />
                                              <span className="truncate">{item.timestamp}</span>
                                            </span>

                                            {item.score && (
                                              <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 ${
                                                item.present 
                                                  ? 'bg-indigo-900/60 text-indigo-200 border border-indigo-700/50' 
                                                  : 'bg-slate-900 text-slate-500'
                                              }`}>
                                                Quiz: {item.score}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>

                                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                                  <span>Total Sessions Tracked: {timelineItems.length}</span>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedTimelineStudent(null)}
                                    className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                                  >
                                    Collapse Feed
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })()}
                </div>

                {/* Action Buttons (Adaptive fluid row with zero overflow) */}
                <div className="pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2 w-full">
                  <button
                    onClick={() => canIssueDocs && onSelectStudentForTranscript(s)}
                    disabled={!canIssueDocs}
                    className={`flex-1 min-w-0 py-1.5 sm:py-2 px-2 text-[11px] font-bold rounded-lg sm:rounded-xl border transition-colors flex items-center justify-center gap-1 ${
                      canIssueDocs 
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 cursor-pointer' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                    }`}
                    title={canIssueDocs ? "Generate Official Transcript PDF" : `Disabled: Requires ≥80% class completion (Current: ${Math.round(s.rate)}%)`}
                  >
                    {canIssueDocs ? <FileText className="w-3.5 h-3.5 shrink-0" /> : <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    <span className="truncate">Transcript<span className="hidden sm:inline"> PDF</span></span>
                  </button>

                  <button
                    onClick={() => canIssueDocs && onSelectStudentForCertificate(s)}
                    disabled={!canIssueDocs}
                    className={`flex-1 min-w-0 py-1.5 sm:py-2 px-2 text-[11px] font-black rounded-lg sm:rounded-xl transition-colors flex items-center justify-center gap-1 shadow-2xs ${
                      canIssueDocs 
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60 shadow-none'
                    }`}
                    title={canIssueDocs ? "Award Milestone Certificate" : `Disabled: Requires ≥80% class completion (Current: ${Math.round(s.rate)}%)`}
                  >
                    {canIssueDocs ? <Award className="w-3.5 h-3.5 shrink-0" /> : <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    <span className="truncate">Certificate</span>
                  </button>

                  {s.rate < atRiskThreshold && (
                    <button
                      onClick={() => onSelectStudentForEmail(s)}
                      className="py-1.5 sm:py-2 px-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg sm:rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                      title="Send Email Warning Notice"
                      aria-label={`Send email warning to ${s.name}`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      )}

      {filteredAndSortedStudents.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-2"
        >
          <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-extrabold text-slate-700 dark:text-slate-200">No student profiles match your search or filter options</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Try adjusting your keyword search or standing filter.</p>
        </motion.div>
      )}
    </div>
  );
};
