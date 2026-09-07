import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Search, 
  GraduationCap, 
  Award, 
  Mail, 
  FileText, 
  Sparkles,
  ChevronDown,
  Camera,
  Trash2,
  UserX,
  X,
  History,
  Check,
  Image,
  List,
  Grid,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { generateStudentUsername } from '../lib/userAuth';
import { 
  PageHeader, 
  LoadingState, 
  EmptyState, 
  ErrorState, 
  PermissionDeniedState, 
  ConfirmationDialog, 
  Button, 
  StatusPill, 
  showToast,
  StudentGridSkeleton 
} from './UXPrimitives';

export type StudentSummaryData = {
  name: string;
  rate: number;
  attended: number;
  totalDays: number;
  avgScore: number | null;
  note?: string;
  photoUrl?: string;
  levelId?: string;
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
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
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
  onResetPassword,
  isLoading = false,
  error = null,
  onRetry
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'perfect' | 'satisfactory' | 'at_risk' | 'fifty_percent'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'last_name_asc' | 'last_name_desc' | 'rate_desc' | 'rate_asc' | 'score_desc' | 'score_asc'>('name_asc');
  const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');
  const [confirmingDeleteFor, setConfirmingDeleteFor] = useState<string | null>(null);
  
  const [expandedTimelineStudent, setExpandedTimelineStudent] = useState<string | null>(null);

  // View mode state: 'cards' | 'list' | 'gallery'
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

  // Gallery view active class day ID
  const activeGalleryDayId = useMemo(() => {
    if (selectedGalleryDayId) return selectedGalleryDayId;
    if (classDays && classDays.length > 0) return classDays[classDays.length - 1].id;
    return '';
  }, [selectedGalleryDayId, classDays]);

  // Photo Upload Trigger Helper
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetStudent, setUploadTargetStudent] = useState<string | null>(null);

  const handleTriggerUpload = (studentName: string) => {
    setUploadTargetStudent(studentName);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTargetStudent && onUpdateStudentPhoto) {
      if (file.size > 2 * 1024 * 1024) {
        showToast.error("File is too large", "Profile photos must be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onUpdateStudentPhoto(uploadTargetStudent, base64String);
        showToast.success(`Profile photo updated for ${uploadTargetStudent}`);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
    setUploadTargetStudent(null);
  };

  const handleSaveNote = (studentName: string) => {
    onUpdateNote(studentName, tempNoteText);
    setEditingNoteFor(null);
    showToast.success(`Note saved for ${studentName}`);
  };

  // Helper for Last Name extraction
  const getLastName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1] : parts[0];
  };

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter(s => {
      const matchesSearch = !q || s.name.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'perfect') return s.rate >= 100;
      if (statusFilter === 'satisfactory') return s.rate >= satisfactoryThreshold;
      if (statusFilter === 'at_risk') return s.rate < atRiskThreshold;
      if (statusFilter === 'fifty_percent') return s.rate <= 50;
      return true;
    }).sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
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

  const handleMarkAllGalleryStudents = (status: 'present' | 'absent') => {
    if (!onToggleAttendance || !activeGalleryDayId) return;
    filteredAndSortedStudents.forEach(s => {
      onToggleAttendance(s.name, activeGalleryDayId, status);
    });
    showToast.success(`Marked all candidates as ${status}`);
  };

  // Calculate high level stats
  const totalStudents = students.length;
  const perfectStudents = students.filter(s => s.rate >= 100).length;
  const atRiskStudents = students.filter(s => s.rate < atRiskThreshold).length;
  const fiftyPercentStudents = students.filter(s => s.rate <= 50).length;
  const satisfactoryStudents = students.filter(s => s.rate >= satisfactoryThreshold).length;

  // 1. Permission-denied State
  if (appRole === 'student') {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Portal' },
            { label: 'Students', active: true }
          ]}
          title="Student Enrolment Directory"
          description="Administrative roster and academic standing records."
        />
        <PermissionDeniedState
          title="Access Restricted"
          description="Student candidate accounts cannot access the administrative student directory or manage classmate records."
          requiredRole="Teacher or Administrator"
        />
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
        <PageHeader
          breadcrumbs={[
            { label: 'Portal' },
            { label: 'Students', active: true }
          ]}
          title="Student Enrolment Directory"
          description="Centralized management of student profiles, attendance records, academic standing, and official transcripts."
        />
        <ErrorState
          title="We could not load student records. Try again."
          description={error}
          onRetry={onRetry}
        />
      </div>
    );
  }

  // 3. Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 pb-28 sm:pb-24 md:pb-8 w-full max-w-full">
        <PageHeader
          breadcrumbs={[
            { label: 'Portal' },
            { label: 'Students', active: true }
          ]}
          title="Student Enrolment Directory"
          description="Centralized management of student profiles, attendance records, academic standing, and official transcripts."
          badge={<StatusPill tone="info" label="Loading roster…" />}
        />
        <LoadingState
          label="Loading students…"
          description="Retrieving candidate directory, attendance metrics, and academic standings…"
        />
        <StudentGridSkeleton count={6} />
      </div>
    );
  }

  // 4. Initial Empty State (no students registered at all)
  if (students.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
        <PageHeader
          breadcrumbs={[
            { label: 'Portal' },
            { label: 'Students', active: true }
          ]}
          title="Student Enrolment Directory"
          description="Centralized management of student profiles, attendance records, academic standing, and official transcripts."
        />
        <EmptyState
          icon={<GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
          title="No students have been registered yet."
          description="Sync data from Google Sheets or enroll candidates to start tracking attendance, grades, and graduation eligibility."
          action={
            onRetry ? (
              <Button variant="primary" size="sm" onClick={onRetry}>
                Refresh Student Data
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-28 sm:pb-24 md:pb-8 material-screen w-full max-w-full overflow-x-hidden">
      {/* Hidden File Input for Student Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Confirmation Dialog for Deleting Student */}
      <ConfirmationDialog
        isOpen={!!confirmingDeleteFor}
        onClose={() => setConfirmingDeleteFor(null)}
        onConfirm={() => {
          if (confirmingDeleteFor && onDeleteStudent) {
            onDeleteStudent(confirmingDeleteFor);
            showToast.success(`Student ${confirmingDeleteFor} removed from directory`);
          }
          setConfirmingDeleteFor(null);
        }}
        title="Remove Student"
        description={`Are you sure you want to remove ${confirmingDeleteFor} completely from all courses and directory records? You can restore excluded students at any time from Settings.`}
        confirmText="Remove Student"
        cancelText="Cancel"
        isDestructive={true}
        icon={<UserX className="w-5 h-5 text-red-600 dark:text-red-400" />}
      />

      {/* Standardized Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Portal' },
          { label: 'Students', active: true }
        ]}
        title="Student Enrolment Directory"
        description="Centralized management of student profiles, attendance records, academic standing, and official transcripts."
        badge={
          <StatusPill
            tone="info"
            icon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            label="HTEIM Cohort 2026"
          />
        }
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenAttendanceReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenAttendanceReport('all')}
                leftIcon={<FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              >
                Attendance Report
              </Button>
            )}
          </div>
        }
      />

      {/* Quick Metrics Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 sm:p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Enrolled</p>
            <p className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1">{totalStudents}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">Ministry Candidates</p>
          </div>
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-3 sm:p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Satisfactory</p>
            <p className="text-xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 sm:mt-1">{satisfactoryStudents}</p>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 truncate">&ge; {satisfactoryThreshold}% Attendance</p>
          </div>
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl p-3 sm:p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">Perfect 100%</p>
            <p className="text-xl sm:text-3xl font-black text-amber-800 dark:text-amber-400 mt-0.5 sm:mt-1">{perfectStudents}</p>
            <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5 truncate">100% Commendation</p>
          </div>
          <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 rounded-xl p-3 sm:p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">At-Risk Alert</p>
            <p className="text-xl sm:text-3xl font-black text-rose-700 dark:text-rose-400 mt-0.5 sm:mt-1">{atRiskStudents}</p>
            <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5 truncate">&lt; {atRiskThreshold}% Attendance</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="sticky top-1 sm:top-3 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col space-y-3 transition-all w-full max-w-full">
        {/* Row 1: Search & Action Tools */}
        <div className="flex items-center justify-between gap-2.5 sm:gap-3 flex-wrap md:flex-nowrap w-full">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0 w-full md:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student profile by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-between md:justify-end w-full md:w-auto overflow-x-auto no-scrollbar py-0.5">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setDirectoryViewMode('list')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  directoryViewMode === 'list' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Compact Table List View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                type="button"
                onClick={() => setDirectoryViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  directoryViewMode === 'cards' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Detailed Profile Cards View"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setDirectoryViewMode('gallery')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  directoryViewMode === 'gallery' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Photo Roll & Session Check-in View"
              >
                <Image className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gallery</span>
              </button>
            </div>

            {/* Sorting Menu Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-1.5 sm:py-2 pl-3 pr-7 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none"
              >
                <option value="name_asc">First Name (A-Z)</option>
                <option value="name_desc">First Name (Z-A)</option>
                <option value="last_name_asc">Last Name (A-Z)</option>
                <option value="last_name_desc">Last Name (Z-A)</option>
                <option value="rate_desc">Attendance (High &rarr; Low)</option>
                <option value="rate_asc">Attendance (Low &rarr; High)</option>
                <option value="score_desc">Academic Score (High &rarr; Low)</option>
                <option value="score_asc">Academic Score (Low &rarr; High)</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row 2: Standing Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full flex-nowrap scroll-smooth touch-pan-x">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'all' 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>All Candidates</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              statusFilter === 'all' 
                ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {students.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('perfect')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'perfect' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
            }`}
          >
            <span>100% Perfect</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              statusFilter === 'perfect' 
                ? 'bg-white/20 text-white' 
                : 'bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
            }`}>
              {perfectStudents}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('satisfactory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'satisfactory' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
            }`}
          >
            <span>Satisfactory</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              statusFilter === 'satisfactory' 
                ? 'bg-white/20 text-white' 
                : 'bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200'
            }`}>
              {satisfactoryStudents}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('at_risk')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'at_risk' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
            }`}
          >
            <span>At-Risk (&lt;{atRiskThreshold}%)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              statusFilter === 'at_risk' 
                ? 'bg-white/20 text-white' 
                : 'bg-rose-200/70 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200'
            }`}>
              {atRiskStudents}
            </span>
          </button>
        </div>
      </div>

      {/* 5. Filtered Search Empty State */}
      {filteredAndSortedStudents.length === 0 ? (
        <EmptyState
          title="No matching student records found"
          description="No student profiles match your search keywords or standing filter criteria."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            >
              Clear Search &amp; Filters
            </Button>
          }
        />
      ) : directoryViewMode === 'gallery' ? (
        /* Photo Roll & Rapid Check-in Gallery */
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3.5 sm:p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active Session:</span>
              <select
                value={activeGalleryDayId}
                onChange={(e) => setSelectedGalleryDayId(e.target.value)}
                className="py-1 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
              >
                {classDays?.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Quick Mark All:</span>
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleMarkAllGalleryStudents('present')}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              >
                All Present
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleMarkAllGalleryStudents('absent')}
                leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}
              >
                All Absent
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredAndSortedStudents.map((s, idx) => {
              const studentKey = (s.name || '').toLowerCase().trim();
              const photoUrl = studentPhotos[studentKey] || s.photoUrl;
              const isExcused = !!(excusedAbsences?.[studentKey]?.[activeGalleryDayId]);
              const att = s.attendanceByDay?.[activeGalleryDayId];
              const isPresent = !isExcused && !!att?.present;
              const isAbsent = !isExcused && !att?.present;

              return (
                <div
                  key={`gallery-${s.name || idx}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center text-center space-y-2 relative shadow-xs"
                >
                  <div
                    onClick={() => handleTriggerUpload(s.name)}
                    className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 cursor-pointer relative group flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold"
                    title="Click to update photo"
                  >
                    {photoUrl ? (
                      <img src={photoUrl} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{s.name.charAt(0)}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Camera className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="min-w-0 w-full">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={s.name}>
                      {s.name}
                    </p>
                    <p className="text-[10px] text-slate-500">{Math.round(s.rate)}% Attendance</p>
                  </div>

                  {onToggleAttendance && activeGalleryDayId && (
                    <div className="flex items-center gap-1 w-full pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => onToggleAttendance(s.name, activeGalleryDayId, 'present')}
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                          isPresent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleAttendance(s.name, activeGalleryDayId, 'absent')}
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                          isAbsent
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : directoryViewMode === 'list' ? (
        /* Compact List Table View */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">Candidate</th>
                  <th scope="col" className="px-4 py-3">Standing</th>
                  <th scope="col" className="px-4 py-3">Attendance</th>
                  <th scope="col" className="px-4 py-3">Academic Score</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAndSortedStudents.map((s, idx) => {
                  const studentKey = (s.name || '').toLowerCase().trim();
                  const photoUrl = studentPhotos[studentKey] || s.photoUrl;
                  const canIssueDocs = s.rate >= 80;

                  return (
                    <tr key={`list-${s.name || idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => handleTriggerUpload(s.name)}
                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 shrink-0 cursor-pointer"
                            title="Update photo"
                          >
                            {photoUrl ? <img src={photoUrl} alt={s.name} className="w-full h-full object-cover" /> : s.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                            <p className="text-[11px] text-slate-500">{s.attended} of {s.totalDays} sessions</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {s.rate >= 100 ? (
                          <StatusPill tone="warning" label="100% Perfect" />
                        ) : s.rate >= satisfactoryThreshold ? (
                          <StatusPill tone="success" label="Satisfactory" />
                        ) : (
                          <StatusPill tone="danger" label="At-Risk" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {Math.round(s.rate)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {s.avgScore !== null ? (
                          <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                            {Math.round(s.avgScore)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => canIssueDocs && onSelectStudentForTranscript(s)}
                            disabled={!canIssueDocs}
                            title={canIssueDocs ? "Generate Transcript PDF" : "Requires ≥80% Attendance"}
                          >
                            Transcript
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => canIssueDocs && onSelectStudentForCertificate(s)}
                            disabled={!canIssueDocs}
                            title={canIssueDocs ? "Award Certificate" : "Requires ≥80% Attendance"}
                          >
                            Certificate
                          </Button>
                          {onDeleteStudent && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => setConfirmingDeleteFor(s.name)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Detailed Student Profile Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-full">
          {filteredAndSortedStudents.map((s, idx) => {
            const studentKey = (s.name || '').toLowerCase().trim();
            const photoUrl = studentPhotos[studentKey] || s.photoUrl;
            const currentNote = studentNotes[studentKey] || s.note || '';
            const canIssueDocs = s.rate >= 80;

            return (
              <div
                key={`card-${s.name || idx}`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative w-full"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        onClick={() => handleTriggerUpload(s.name)}
                        className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 cursor-pointer relative group flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold shrink-0"
                        title="Click to change photo"
                      >
                        {photoUrl ? (
                          <img src={photoUrl} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base">{s.name.charAt(0)}</span>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Camera className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate" title={s.name}>
                          {s.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {s.attended} of {s.totalDays} sessions attended
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {s.rate >= 100 ? (
                        <StatusPill tone="warning" label="100%" />
                      ) : s.rate >= satisfactoryThreshold ? (
                        <StatusPill tone="success" label={`${Math.round(s.rate)}%`} />
                      ) : (
                        <StatusPill tone="danger" label={`${Math.round(s.rate)}%`} />
                      )}
                    </div>
                  </div>

                  {/* Attendance & Score Progress Bar */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 dark:text-slate-400">Attendance Rate</span>
                      <span className="font-mono text-slate-900 dark:text-slate-100">{Math.round(s.rate)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          s.rate >= satisfactoryThreshold
                            ? 'bg-emerald-500'
                            : s.rate >= atRiskThreshold
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, s.rate))}%` }}
                      />
                    </div>
                  </div>

                  {/* Academic Average if available */}
                  {s.avgScore !== null && (
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Quiz / Academic Avg:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {Math.round(s.avgScore)}%
                      </span>
                    </div>
                  )}

                  {/* Notes snippet or editor */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    {editingNoteFor === s.name ? (
                      <div className="space-y-2">
                        <textarea
                          value={tempNoteText}
                          onChange={(e) => setTempNoteText(e.target.value)}
                          placeholder="Add teacher notes about student progress..."
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white resize-none h-16"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setEditingNoteFor(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleSaveNote(s.name)}
                          >
                            Save Note
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingNoteFor(s.name);
                          setTempNoteText(currentNote);
                        }}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer transition-colors"
                        title="Click to edit teacher notes"
                      >
                        <p className="line-clamp-2 italic text-[11px]">
                          {currentNote ? `“${currentNote}”` : "+ Add teacher observation note…"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Button
                    variant="tonal"
                    size="sm"
                    onClick={() => canIssueDocs && onSelectStudentForTranscript(s)}
                    disabled={!canIssueDocs}
                    leftIcon={<FileText className="w-3.5 h-3.5" />}
                    className="flex-1"
                    title={canIssueDocs ? "Generate Transcript PDF" : "Requires ≥80% Attendance"}
                  >
                    Transcript
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => canIssueDocs && onSelectStudentForCertificate(s)}
                    disabled={!canIssueDocs}
                    leftIcon={<Award className="w-3.5 h-3.5" />}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                    title={canIssueDocs ? "Award Milestone Certificate" : "Requires ≥80% Attendance"}
                  >
                    Certificate
                  </Button>
                  {s.rate < atRiskThreshold && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onSelectStudentForEmail(s)}
                      aria-label={`Send warning to ${s.name}`}
                      title="Send warning notice"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {onDeleteStudent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmingDeleteFor(s.name)}
                      className="text-slate-400 hover:text-red-600"
                      title="Delete student"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
