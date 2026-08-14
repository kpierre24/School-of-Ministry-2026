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
  User
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
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'rate_desc' | 'rate_asc' | 'score_desc'>('name_asc');
  const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');
  const [confirmingDeleteFor, setConfirmingDeleteFor] = useState<string | null>(null);
  
  const [expandedTimelineStudent, setExpandedTimelineStudent] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'present' | 'absent' | 'quizzes'>('all');

  // View mode state for directory view: 'cards' or 'gallery'
  const [directoryViewMode, setDirectoryViewMode] = useState<'cards' | 'gallery'>('cards');
  const [selectedGalleryDayId, setSelectedGalleryDayId] = useState<string>('');

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
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'rate_desc') return b.rate - a.rate;
      if (sortBy === 'rate_asc') return a.rate - b.rate;
      if (sortBy === 'score_desc') return (b.avgScore || 0) - (a.avgScore || 0);
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
    <div className="space-y-6 animate-fadeIn pb-28 sm:pb-24 md:pb-8 material-screen">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-slate-600 dark:text-slate-300 shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Student Enrolment Directory</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Centralized management of student profiles, attendance records, academic standing, and official transcripts.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <span>HTEIM Ministry Cohort 2026</span>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Enrolled</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">{totalStudents}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Ministry Candidates</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Satisfactory Standing</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{satisfactoryStudents}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">&ge; {satisfactoryThreshold}% Attendance</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Perfect Attendance</p>
            <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{perfectStudents}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">100% Session Commendation</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">At-Risk Alert</p>
            <p className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400 mt-1">{atRiskStudents}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">&lt; {atRiskThreshold}% Attendance</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col space-y-3 material-surface">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student profile by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0 flex-wrap justify-end">
            {/* View Mode Toggle: Cards vs Photo Gallery */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
              <button
                onClick={() => setDirectoryViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  directoryViewMode === 'cards'
                    ? 'bg-white text-indigo-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Detailed Student Profile Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
                <span>Profile Cards</span>
              </button>
              <button
                onClick={() => setDirectoryViewMode('gallery')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  directoryViewMode === 'gallery'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Visual Photo Gallery View with Thumbnail Attendance Marking"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Photo Gallery</span>
              </button>
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-extrabold text-slate-600 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs"
              >
                <option value="name_asc">Name (A &rarr; Z)</option>
                <option value="name_desc">Name (Z &rarr; A)</option>
                <option value="rate_desc">Attendance (High &rarr; Low)</option>
                <option value="rate_asc">Attendance (Low &rarr; High)</option>
                <option value="score_desc">Avg Score (High &rarr; Low)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full overflow-x-auto pb-1 justify-between flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Standing:
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center touch-min-44 ${
                statusFilter === 'all' 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Candidates ({students.length})
            </button>
            <button
              onClick={() => setStatusFilter('satisfactory')}
              className={`px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center touch-min-44 ${
                statusFilter === 'satisfactory' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              }`}
            >
              Good Standing ({satisfactoryStudents})
            </button>
            <button
              onClick={() => setStatusFilter('perfect')}
              className={`px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center touch-min-44 ${
                statusFilter === 'perfect' 
                  ? 'bg-amber-500 text-slate-950 shadow-xs' 
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
              }`}
            >
              Honor Roll ({perfectStudents})
            </button>
            <button
              onClick={() => setStatusFilter('at_risk')}
              className={`px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center touch-min-44 ${
                statusFilter === 'at_risk' 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40'
              }`}
            >
              At-Risk ({atRiskStudents})
            </button>
            <button
              onClick={() => setStatusFilter('fifty_percent')}
              className={`px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center touch-min-44 ${
                statusFilter === 'fifty_percent' 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800'
              }`}
            >
              Low Attendance (&le;50%) ({fiftyPercentStudents})
            </button>
          </div>

          {onOpenAttendanceReport && (
            <div className="flex items-center gap-2 pt-1 sm:pt-0">
              <button
                onClick={() => onOpenAttendanceReport('fifty_percent')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer whitespace-nowrap shadow-xs flex items-center gap-1.5"
                title="Generate printable/downloadable official report for candidates with 50% or lower attendance"
              >
                <FileText className="w-3.5 h-3.5 text-slate-900" />
                <span>Export &le;50% Report</span>
              </button>
              <button
                onClick={() => onOpenAttendanceReport('all')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 flex-shrink-0"
                title="Generate Printable Full Attendance Report"
              >
                <FileText className="w-3.5 h-3.5 text-white" />
                <span>Full Attendance Report</span>
              </button>
            </div>
          )}
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
                    {classDays.map(day => (
                      <option key={day.id} value={day.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
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
              {filteredAndSortedStudents.map((s) => {
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
                    key={s.name}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{
                      layout: { type: 'spring', stiffness: 280, damping: 28, mass: 0.8 },
                      opacity: { duration: 0.18 },
                      scale: { duration: 0.18 }
                    }}
                    className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between group/photoCard relative"
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
      ) : (
        /* Detailed Student Profile Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
          {filteredAndSortedStudents.map((s) => {
            const studentKey = (s.name || '').toLowerCase().trim();
            const photoUrl = studentPhotos[studentKey] || s.photoUrl;
            const currentNote = studentNotes[studentKey] || s.note || '';
            const canIssueDocs = s.rate >= 80;

            return (
              <motion.div 
                key={s.name}
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
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 relative group"
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
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Interactive Profile Photo Avatar */}
                      <div 
                        onClick={() => handleTriggerUpload(s.name)}
                        className="relative w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-black text-sm flex items-center justify-center shadow-md flex-shrink-0 uppercase cursor-pointer group/avatar border border-slate-200"
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

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                            {s.name}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleTriggerUpload(s.name)}
                            className="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition-colors cursor-pointer"
                            title="Upload profile photo"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: HTEIM-2026-{Math.abs(s.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)).toString().substring(0, 4)}
                        </p>
                      </div>
                    </div>

                    {/* Standing Badge */}
                    <div>
                      {s.rate >= 100 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          <Trophy className="w-3 h-3 text-amber-600" /> 100% Perfect
                        </span>
                      ) : s.rate >= satisfactoryThreshold ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Good Standing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                          <AlertCircle className="w-3 h-3 text-rose-600" /> At-Risk
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress & Stats Bar */}
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[11px] font-bold text-slate-600">Attendance Standing</span>
                      <span className="font-mono font-bold text-slate-900">{Math.round(s.rate)}% ({s.attended}/{s.totalDays})</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          s.rate >= satisfactoryThreshold ? 'bg-emerald-500' : s.rate >= atRiskThreshold ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, s.rate))}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Quiz / Academic Avg</span>
                        <span className="font-mono font-extrabold text-indigo-700">
                          {s.avgScore !== null ? `${Math.round(s.avgScore)}%` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Sessions Attended</span>
                        <span className="font-mono font-extrabold text-slate-800">{s.attended} / {s.totalDays}</span>
                      </div>
                    </div>
                  </div>

                  {/* Note Field */}
                  <div className="mt-3">
                    {editingNoteFor === studentKey ? (
                      <div className="space-y-1.5">
                        <textarea
                          rows={2}
                          value={tempNoteText ?? ''}
                          onChange={(e) => setTempNoteText(e.target.value)}
                          placeholder="Add faculty note or advisory comment..."
                          className="w-full p-2 bg-slate-50 border border-indigo-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingNoteFor(null)}
                            className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
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
                        className="p-2 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-[11px] italic truncate">
                          {currentNote || '+ Click to add faculty comment / advisory note'}
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
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          {/* Mini Visual Dot Strip */}
                          <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-[160px] sm:max-w-[190px]">
                            {timelineItems.length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic">No history</span>
                            ) : (
                              timelineItems.slice(0, 10).map((item, idx) => (
                                <div
                                  key={item.id || idx}
                                  onClick={() => setExpandedTimelineStudent(isExpanded ? null : s.name)}
                                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all hover:scale-125 cursor-pointer ${
                                    item.present ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-rose-500 ring-2 ring-rose-100'
                                  }`}
                                  title={`${item.name}: ${item.present ? 'Attended' : 'Absent'} (${item.score})`}
                                />
                              ))
                            )}
                            {timelineItems.length > 10 && (
                              <span className="text-[9px] font-extrabold text-slate-400">+{timelineItems.length - 10}</span>
                            )}
                          </div>

                          {/* Toggle History Button */}
                          <button
                            type="button"
                            onClick={() => setExpandedTimelineStudent(isExpanded ? null : s.name)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                              isExpanded 
                                ? 'bg-indigo-600 text-white shadow-xs' 
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80'
                            }`}
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>Timeline Feed ({timelineItems.length})</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
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
                              className="overflow-hidden"
                            >
                              <div className="bg-slate-900 rounded-xl p-3.5 text-white space-y-3 mt-2 border border-slate-800 shadow-inner">
                                {/* Feed Header & Filter Tabs */}
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Attendance & Quiz Feed</span>
                                  </div>

                                  <div className="flex items-center gap-1 text-[10px]">
                                    <button
                                      type="button"
                                      onClick={() => setTimelineFilter('all')}
                                      className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                                        timelineFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                      }`}
                                    >
                                      All ({timelineItems.length})
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTimelineFilter('present')}
                                      className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                                        timelineFilter === 'present' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                      }`}
                                    >
                                      Attended
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTimelineFilter('absent')}
                                      className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                                        timelineFilter === 'absent' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                      }`}
                                    >
                                      Absences
                                    </button>
                                  </div>
                                </div>

                                {/* Chronological Activity Line */}
                                <div className="relative pl-5 border-l-2 border-indigo-900/80 space-y-3.5 my-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                  {filteredItems.length === 0 ? (
                                    <EmptyState
                                      title="No activity yet"
                                      description="Attendance and quiz activity will appear here when records are available."
                                      icon={<Clock className="h-5 w-5" />}
                                    />
                                  ) : (
                                    filteredItems.map((item, idx) => (
                                      <div key={item.id || idx} className="relative group/timeline">
                                        {/* Node Icon on Timeline Line */}
                                        <div 
                                          className={`absolute -left-[27px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-slate-900 ${
                                            item.present 
                                              ? 'bg-emerald-500 text-slate-950 shadow-xs' 
                                              : 'bg-rose-500 text-white shadow-xs'
                                          }`}
                                        >
                                          {item.present ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[3]" />}
                                        </div>

                                        {/* Activity Content Card */}
                                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-1">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-extrabold text-slate-100">
                                              {item.name}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                              item.present ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                                            }`}>
                                              {item.present ? 'Attended' : 'Absent'}
                                            </span>
                                          </div>

                                          <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                                            <span className="flex items-center gap-1">
                                              <CalendarDays className="w-3 h-3 text-indigo-400" />
                                              {item.timestamp}
                                            </span>

                                            {item.score && (
                                              <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
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

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => canIssueDocs && onSelectStudentForTranscript(s)}
                    disabled={!canIssueDocs}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-colors flex items-center justify-center gap-1 ${
                      canIssueDocs 
                        ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 cursor-pointer' 
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                    }`}
                    title={canIssueDocs ? "Generate Official Transcript PDF" : `Disabled: Requires ≥80% class completion (Current: ${Math.round(s.rate)}%)`}
                  >
                    {canIssueDocs ? <FileText className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                    Transcript PDF
                  </button>

                  <button
                    onClick={() => canIssueDocs && onSelectStudentForCertificate(s)}
                    disabled={!canIssueDocs}
                    className={`py-1.5 px-2 text-[11px] font-black rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs ${
                      canIssueDocs 
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer' 
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 shadow-none'
                    }`}
                    title={canIssueDocs ? "Award Milestone Certificate" : `Disabled: Requires ≥80% class completion (Current: ${Math.round(s.rate)}%)`}
                  >
                    {canIssueDocs ? <Award className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                    Certificate
                  </button>

                  {s.rate < atRiskThreshold && (
                    <button
                      onClick={() => onSelectStudentForEmail(s)}
                      className="py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
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
          className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2"
        >
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-extrabold text-slate-700">No student profiles match your search or filter options</p>
          <p className="text-xs text-slate-400">Try adjusting your keyword search or standing filter.</p>
        </motion.div>
      )}
    </div>
  );
};
