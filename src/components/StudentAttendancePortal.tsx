import React, { useState, useRef, useEffect } from 'react';
import { 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Award, 
  FileText, 
  Trophy, 
  AlertCircle, 
  GraduationCap, 
  Sparkles, 
  Calendar,
  Clock,
  BookOpen,
  Medal,
  Download,
  Video,
  ExternalLink,
  Copy,
  Check,
  Camera,
  Upload,
  User,
  Lock
} from 'lucide-react';

export type StudentPortalSummary = {
  name: string;
  rate: number;
  attended: number;
  totalDays: number;
  avgScore: number | null;
  attendanceByDay: Record<string, { present: boolean; timestamp?: string; score?: string }>;
  note?: string;
  photoUrl?: string;
};

interface StudentAttendancePortalProps {
  student: StudentPortalSummary;
  classDays: { id: string; name: string }[];
  rubricScores: Record<string, { participation: number; scripture: number; assignment: number }>;
  onRequestTranscript: (student: any) => void;
  onRequestCertificate: (student: any) => void;
  onUpdateStudentPhoto?: (studentName: string, photoDataUrl: string) => void;
  atRiskThreshold: number;
  satisfactoryThreshold: number;
}

export const StudentAttendancePortal: React.FC<Partial<StudentAttendancePortalProps>> = ({
  student,
  classDays = [],
  rubricScores = {},
  onRequestTranscript = (_s?: any) => {},
  onRequestCertificate = (_s?: any) => {},
  onUpdateStudentPhoto,
  atRiskThreshold = 75,
  satisfactoryThreshold = 85
}) => {
  const safeName = student?.name || 'Student';
  const studentKey = safeName.toLowerCase().trim();
  const safeRate = student?.rate ?? 0;
  const safeAttended = student?.attended ?? 0;
  const safeTotalDays = student?.totalDays ?? (classDays.length || 1);
  const safeAvgScore = student?.avgScore ?? null;
  const safeAttendanceByDay = student?.attendanceByDay || {};

  const [currentPhoto, setCurrentPhoto] = useState<string>(student?.photoUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (student?.photoUrl) {
      setCurrentPhoto(student.photoUrl);
    }
  }, [student?.photoUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

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
          setCurrentPhoto(resizedDataUrl);
          if (onUpdateStudentPhoto) {
            onUpdateStudentPhoto(safeName, resizedDataUrl);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const rubric = rubricScores[studentKey] || { participation: 90, scripture: 95, assignment: 85 };
  const rubAvg = Math.round((rubric.participation + rubric.assignment) / 2);
  const canDownloadDocs = false;

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 animate-fadeIn custom-scrollbar">
      {/* Weekly Tuesday Live Zoom Class Notice Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 text-white border border-blue-500/30 shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold flex-shrink-0 shadow-inner">
              <Video className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono font-black uppercase rounded-full">
                  Weekly Live Schedule
                </span>
                <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Every Tuesday @ 7:00 PM EST
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-white">
                Classes Go Live via Zoom Every Tuesday (Unless Notified Otherwise)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Official School of Ministry live lectures take place every Tuesday evening at 7:00 PM EST. Check announcements for any schedule updates.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-blue-800/60">
            <div className="bg-slate-950/80 border border-blue-400/30 rounded-2xl p-2.5 flex items-center justify-between gap-3 text-xs font-mono">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-400">Meeting ID</p>
                <p className="font-extrabold text-blue-200">815 0537 7396</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyText('815 0537 7396', 'meetingId')}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Copy Meeting ID"
              >
                {copiedField === 'meetingId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="bg-slate-950/80 border border-blue-400/30 rounded-2xl p-2.5 flex items-center justify-between gap-3 text-xs font-mono">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-400">Passcode</p>
                <p className="font-extrabold text-amber-300">163738</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyText('163738', 'passcode')}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Copy Passcode"
              >
                {copiedField === 'passcode' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <a
              href="https://zoom.us/j/81505377396"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <span>Join Tuesday Live Zoom</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
      {/* Student Welcome & Status Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white/20 flex-shrink-0 group cursor-pointer bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-2xl flex items-center justify-center uppercase"
              title="Click to upload profile photo"
            >
              {currentPhoto ? (
                <img 
                  src={currentPhoto} 
                  alt={safeName} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                />
              ) : (
                <span>{safeName.charAt(0)}{safeName.split(' ')[1] ? safeName.split(' ')[1].charAt(0) : ''}</span>
              )}

              {/* Upload overlay on hover */}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1">
                <Camera className="w-5 h-5 text-amber-300" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-amber-200 mt-0.5">Upload</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black tracking-tight text-white">{safeName}</h2>
                <span className="px-3 py-0.5 text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-950 rounded-full flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" /> Student Portal
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-indigo-100 hover:text-white rounded-lg text-[11px] font-bold border border-white/20 flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-300" />
                  <span>{currentPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
              </div>
              <p className="text-xs text-indigo-200 mt-1 flex items-center gap-2 flex-wrap font-medium">
                <span>HTEIM Ministry Candidate</span>
                <span>•</span>
                <span className="font-mono text-amber-300">ID: HTEIM-2026-{Math.abs(safeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)).toString().substring(0, 4)}</span>
              </p>
            </div>
          </div>

          {/* Download Transcript & Certificate Buttons for Student (Locked until end of course) */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3.5 py-2 rounded-xl text-xs text-indigo-200">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Transcripts & Certificates unlock at course completion</span>
            </div>
          </div>
        </div>

        {/* 4 Summary Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200">Attendance Rate</p>
            <p className="text-2xl font-black font-mono text-white mt-1">{Math.round(safeRate)}%</p>
            <p className="text-[10px] text-indigo-300 mt-0.5">{safeAttended} of {safeTotalDays} sessions attended</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200">Academic Standing</p>
            <div className="mt-1">
              {safeRate >= 100 ? (
                <span className="inline-flex items-center gap-1 font-bold text-amber-300 text-sm">
                  <Trophy className="w-4 h-4 text-amber-400" /> Perfect Standing
                </span>
              ) : safeRate >= satisfactoryThreshold ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-400 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Good Standing
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-rose-300 text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-400" /> Attendance Advisory
                </span>
              )}
            </div>
            <p className="text-[10px] text-indigo-300 mt-0.5">Required for graduation: ≥ 80%</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200">Sessions Attended</p>
            <p className="text-2xl font-black font-mono text-amber-300 mt-1">
              {safeAttended} / {safeTotalDays}
            </p>
            <p className="text-[10px] text-indigo-300 mt-0.5">Classes Attended</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200">Absences Recorded</p>
            <p className="text-2xl font-black font-mono text-indigo-200 mt-1">{Math.max(0, safeTotalDays - safeAttended)}</p>
            <p className="text-[10px] text-indigo-300 mt-0.5">Missed Sessions</p>
          </div>
        </div>
      </div>

      {/* Class Attendance History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>My Class Attendance Log</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified record of your class attendance presence recorded by ministry instructors.
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold rounded-xl">
            {classDays.length} Total Sessions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3.5 rounded-l-xl">Class Day / Session</th>
                <th className="p-3.5">Attendance Status</th>
                <th className="p-3.5 rounded-r-xl">Attendance Date / Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {classDays.map((day) => {
                const att = safeAttendanceByDay[day.id];
                const isPresent = !!att?.present;

                return (
                  <tr key={day.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                      <span>{day.name}</span>
                    </td>
                    <td className="p-3.5">
                      {isPresent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/50">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                          <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Absent
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {att?.timestamp ? (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {att.timestamp}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advisory & Faculty Comment Box */}
      {student?.note && (
        <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl space-y-1">
          <p className="text-xs font-black uppercase text-amber-900 dark:text-amber-400 tracking-wider">Faculty Advisory Note for You:</p>
          <p className="text-xs text-amber-950 dark:text-amber-200 font-medium leading-relaxed italic">"{student.note}"</p>
        </div>
      )}
    </div>
  );
};
