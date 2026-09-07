import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Users, 
  ShieldCheck, 
  Lock, 
  Send, 
  AlertTriangle,
  HeartPulse,
  Sparkles
} from 'lucide-react';
import { Modal } from '../../components/Modal';
import { AttendanceStatus, ATTENDANCE_STATUS_LIST } from '../../types/attendance';
import { ClassDay } from '../../types';
import { toast } from 'sonner';

export interface LecturerSessionSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  classDays: ClassDay[];
  students: { name: string; email?: string }[];
  initialClassDayId?: string;
  currentAttendanceByStudent?: Record<string, AttendanceStatus>;
  onSubmitSession?: (payload: {
    classDayId: string;
    classDayName: string;
    records: { studentName: string; status: AttendanceStatus; notes?: string }[];
    lockAfterSubmission: boolean;
    lockDeadlineHours: number;
  }) => Promise<void> | void;
  onSubmit?: (payload: {
    classDayId: string;
    classDayName: string;
    records: { studentName: string; status: AttendanceStatus; notes?: string }[];
    lockAfterSubmission: boolean;
    lockDeadlineHours: number;
  }) => Promise<void> | void;
  isSessionLocked?: boolean;
}

export const LecturerSessionSubmissionModal: React.FC<LecturerSessionSubmissionModalProps> = ({
  isOpen,
  onClose,
  classDays = [],
  students = [],
  initialClassDayId = '',
  currentAttendanceByStudent = {},
  onSubmitSession,
  onSubmit,
  isSessionLocked = false
}) => {
  const submitHandler = onSubmitSession || onSubmit;
  const [selectedDayId, setSelectedDayId] = useState(initialClassDayId || (classDays[0]?.id || ''));
  const [studentStatusMap, setStudentStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [studentNotesMap, setStudentNotesMap] = useState<Record<string, string>>({});
  const [lockAfterSubmission, setLockAfterSubmission] = useState(true);
  const [lockDeadlineHours, setLockDeadlineHours] = useState(24);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or re-sync status map when opened
  React.useEffect(() => {
    if (isOpen) {
      const activeDay = initialClassDayId || (classDays[0]?.id || '');
      setSelectedDayId(activeDay);

      const initialMap: Record<string, AttendanceStatus> = {};
      students.forEach(st => {
        initialMap[st.name] = currentAttendanceByStudent[st.name] || 'Present';
      });
      setStudentStatusMap(initialMap);
      setStudentNotesMap({});
    }
  }, [isOpen, initialClassDayId, classDays, students, currentAttendanceByStudent]);

  const selectedClassDay = classDays.find(cd => cd.id === selectedDayId);
  const classDayName = selectedClassDay?.name || selectedDayId;

  // Calculation metrics
  const total = students.length || 1;
  const counts = Object.values(studentStatusMap).reduce(
    (acc, status) => {
      if (status === 'Present') acc.present++;
      else if (status === 'Late') acc.late++;
      else if (status === 'Excused') acc.excused++;
      else if (status === 'Medical / Approved Leave') acc.medical++;
      else acc.absent++;
      return acc;
    },
    { present: 0, late: 0, excused: 0, medical: 0, absent: 0 }
  );

  const effectiveAttended = counts.present + (counts.late * 0.85) + counts.excused + counts.medical;
  const sessionRate = Math.min(100, Math.round((effectiveAttended / total) * 100));

  const handleSetAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach(st => {
      updated[st.name] = status;
    });
    setStudentStatusMap(updated);
  };

  const handleStatusChange = (studentName: string, status: AttendanceStatus) => {
    setStudentStatusMap(prev => ({ ...prev, [studentName]: status }));
  };

  const handleNoteChange = (studentName: string, note: string) => {
    setStudentNotesMap(prev => ({ ...prev, [studentName]: note }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDayId) {
      toast.error('Please select a valid class session.');
      return;
    }

    try {
      setIsSubmitting(true);
      const records = students.map(st => ({
        studentName: st.name,
        status: studentStatusMap[st.name] || 'Present',
        notes: studentNotesMap[st.name] || undefined
      }));

      if (submitHandler) {
        await submitHandler({
          classDayId: selectedDayId,
          classDayName,
          records,
          lockAfterSubmission,
          lockDeadlineHours
        });
      }

      toast.success(`Session attendance for ${classDayName} submitted successfully.`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit session attendance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Class Session Roll-Call"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Session Selector & Live Stats Bar */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Class Session
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedDayId}
                onChange={(e) => setSelectedDayId(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                {classDays.map((cd) => (
                  <option key={cd.id} value={cd.id}>
                    {cd.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-center">
            <div className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className={`text-base font-bold ${sessionRate >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {sessionRate}%
              </span>
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Attendance</span>
            </div>

            <div className="text-left text-xs text-slate-500 space-y-0.5">
              <div>Present: <strong className="text-emerald-600">{counts.present}</strong> | Late: <strong className="text-amber-600">{counts.late}</strong></div>
              <div>Excused: <strong className="text-sky-600">{counts.excused + counts.medical}</strong> | Absent: <strong className="text-rose-600">{counts.absent}</strong></div>
            </div>
          </div>
        </div>

        {/* Quick Bulk Action Buttons */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {students.length} Candidates Enrolled
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSetAll('Present')}
              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 rounded-md border border-emerald-200 dark:border-emerald-800 transition-colors"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => handleSetAll('Absent')}
              className="px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 rounded-md border border-rose-200 dark:border-rose-800 transition-colors"
            >
              All Absent
            </button>
          </div>
        </div>

        {/* Students Roll-Call List */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-[45vh] overflow-y-auto">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {students.map((st) => {
              const currentSt = studentStatusMap[st.name] || 'Present';

              return (
                <div key={st.name} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex-1">
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      {st.name}
                    </div>
                    {st.email && (
                      <div className="text-[11px] text-slate-400 font-mono">
                        {st.email}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ATTENDANCE_STATUS_LIST.map((status) => {
                      const isSelected = currentSt === status;

                      let btnStyle = 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200';
                      if (isSelected) {
                        if (status === 'Present') btnStyle = 'bg-emerald-600 text-white font-bold shadow-sm';
                        else if (status === 'Absent') btnStyle = 'bg-rose-600 text-white font-bold shadow-sm';
                        else if (status === 'Late') btnStyle = 'bg-amber-500 text-white font-bold shadow-sm';
                        else if (status === 'Excused') btnStyle = 'bg-sky-600 text-white font-bold shadow-sm';
                        else btnStyle = 'bg-purple-600 text-white font-bold shadow-sm';
                      }

                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusChange(st.name, status)}
                          className={`px-2.5 py-1 text-[11px] rounded-lg transition-all ${btnStyle}`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lock Deadline & Anti-Fraud Settings */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <label className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lockAfterSubmission}
                  onChange={(e) => setLockAfterSubmission(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                Finalize & Lock Session (Anti-Fraud Policy)
              </label>
              <p className="text-slate-500 mt-0.5 text-[11px]">
                Once locked, only authorized administrators can alter records. Lecturers must file correction requests.
              </p>
            </div>
          </div>

          {lockAfterSubmission && (
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <span className="text-[11px] text-slate-500">Lock Window:</span>
              <select
                value={lockDeadlineHours}
                onChange={(e) => setLockDeadlineHours(Number(e.target.value))}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
              >
                <option value={0}>Immediate Lock</option>
                <option value={12}>12 Hours</option>
                <option value={24}>24 Hours (Standard)</option>
                <option value={48}>48 Hours</option>
                <option value={72}>72 Hours</option>
              </select>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? 'Submitting Roll-Call...' : 'Submit Session Attendance'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
