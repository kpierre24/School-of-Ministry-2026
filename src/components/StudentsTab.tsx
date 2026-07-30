import React, { useState, useRef, useMemo } from 'react';
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
  Check
} from 'lucide-react';

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
  satisfactoryThreshold
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'perfect' | 'satisfactory' | 'at_risk' | 'fifty_percent'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'rate_desc' | 'rate_asc' | 'score_desc'>('name_asc');
  const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');
  const [confirmingDeleteFor, setConfirmingDeleteFor] = useState<string | null>(null);
  
  const [expandedTimelineStudent, setExpandedTimelineStudent] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'present' | 'absent' | 'quizzes'>('all');

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
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 300;
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
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
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
      const matchesSearch = s.name.toLowerCase().includes((searchQuery || '').toLowerCase());
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

  // Calculate high level stats
  const totalStudents = students.length;
  const perfectStudents = students.filter(s => s.rate >= 100).length;
  const atRiskStudents = students.filter(s => s.rate < atRiskThreshold).length;
  const fiftyPercentStudents = students.filter(s => s.rate <= 50).length;
  const satisfactoryStudents = students.filter(s => s.rate >= satisfactoryThreshold).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-900/50 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-indigo-400" />
              <h2 className="text-xl font-black tracking-tight">Student Enrolment Directory</h2>
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              Centralized management of student profiles, attendance records, academic standing, and official transcripts.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-900/60 border border-indigo-700/50 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-indigo-200">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>HTEIM Ministry Cohort 2026</span>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3.5">
            <p className="text-[10px] font-bold uppercase text-indigo-200">Total Enrolled</p>
            <p className="text-2xl font-black font-mono mt-1 text-white">{totalStudents}</p>
            <p className="text-[10px] text-indigo-300 mt-0.5">Ministry Candidates</p>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-xl p-3.5">
            <p className="text-[10px] font-bold uppercase text-emerald-200">Satisfactory Standing</p>
            <p className="text-2xl font-black font-mono mt-1 text-emerald-300">{satisfactoryStudents}</p>
            <p className="text-[10px] text-emerald-200 mt-0.5">&ge; {satisfactoryThreshold}% Attendance</p>
          </div>
          <div className="bg-amber-500/20 backdrop-blur-md border border-amber-500/30 rounded-xl p-3.5">
            <p className="text-[10px] font-bold uppercase text-amber-200">Perfect Attendance</p>
            <p className="text-2xl font-black font-mono mt-1 text-amber-300">{perfectStudents}</p>
            <p className="text-[10px] text-amber-200 mt-0.5">100% Session Commendation</p>
          </div>
          <div className="bg-rose-500/20 backdrop-blur-md border border-rose-500/30 rounded-xl p-3.5">
            <p className="text-[10px] font-bold uppercase text-rose-200">At-Risk Alert</p>
            <p className="text-2xl font-black font-mono mt-1 text-rose-300">{atRiskStudents}</p>
            <p className="text-[10px] text-rose-200 mt-0.5">&lt; {atRiskThreshold}% Attendance</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col space-y-3">
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

          <div className="flex items-center gap-1.5 w-full md:w-auto flex-shrink-0">
            <span className="text-xs font-extrabold text-slate-600 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs w-full md:w-auto"
            >
              <option value="name_asc">Name (A &rarr; Z)</option>
              <option value="name_desc">Name (Z &rarr; A)</option>
              <option value="rate_desc">Attendance (High &rarr; Low)</option>
              <option value="rate_asc">Attendance (Low &rarr; High)</option>
              <option value="score_desc">Avg Score (High &rarr; Low)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full overflow-x-auto pb-1 justify-between flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Standing:
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'all' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Candidates ({students.length})
            </button>
            <button
              onClick={() => setStatusFilter('satisfactory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'satisfactory' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Good Standing ({satisfactoryStudents})
            </button>
            <button
              onClick={() => setStatusFilter('perfect')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'perfect' 
                  ? 'bg-amber-500 text-slate-950 shadow-xs' 
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Honor Roll ({perfectStudents})
            </button>
            <button
              onClick={() => setStatusFilter('at_risk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'at_risk' 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              At-Risk ({atRiskStudents})
            </button>
            <button
              onClick={() => setStatusFilter('fifty_percent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'fifty_percent' 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
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

      {/* Student Profile Cards Grid */}
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
                exit={{ opacity: 0, scale: 0.88, y: -12, transition: { duration: 0.18 } }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
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
                          value={tempNoteText}
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
                                    <p className="text-[11px] text-slate-400 italic py-2">No records found for this filter.</p>
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
