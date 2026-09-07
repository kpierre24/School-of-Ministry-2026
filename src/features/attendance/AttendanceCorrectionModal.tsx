import React, { useState } from 'react';
import { 
  FileEdit, 
  AlertCircle, 
  Send, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Info 
} from 'lucide-react';
import { Modal } from '../../components/Modal';
import { AttendanceStatus, ATTENDANCE_STATUS_LIST, AttendanceCorrectionRequest } from '../../types/attendance';
import { ClassDay } from '../../types';
import { toast } from 'sonner';

export interface AttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  students?: { name: string; email?: string }[];
  classDays: ClassDay[];
  initialStudentName?: string;
  initialClassDayId?: string;
  initialCurrentStatus?: AttendanceStatus | string;
  onSubmitRequest?: (payload: {
    studentName: string;
    classDayId: string;
    classDayName: string;
    currentStatus: AttendanceStatus;
    requestedStatus: AttendanceStatus;
    reason: string;
    evidenceUrl?: string;
  }) => Promise<void> | void;
  onSubmit?: (payload: {
    studentName: string;
    classDayId: string;
    classDayName: string;
    currentStatus: AttendanceStatus;
    requestedStatus: AttendanceStatus;
    reason: string;
    evidenceUrl?: string;
  }) => Promise<void> | void;
  currentUserRole?: string;
  currentUserEmail?: string;
}

export const AttendanceCorrectionModal: React.FC<AttendanceCorrectionModalProps> = ({
  isOpen,
  onClose,
  students = [],
  classDays = [],
  initialStudentName = '',
  initialClassDayId = '',
  initialCurrentStatus = 'Absent',
  onSubmitRequest,
  onSubmit,
  currentUserRole = 'lecturer',
  currentUserEmail = ''
}) => {
  const submitHandler = onSubmitRequest || onSubmit;
  const [studentName, setStudentName] = useState(initialStudentName || (students[0]?.name || ''));
  const [classDayId, setClassDayId] = useState(initialClassDayId || (classDays[0]?.id || ''));
  const [currentStatus, setCurrentStatus] = useState<AttendanceStatus>(
    (initialCurrentStatus as AttendanceStatus) || 'Absent'
  );
  const [requestedStatus, setRequestedStatus] = useState<AttendanceStatus>('Present');
  const [reason, setReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial props when opened
  React.useEffect(() => {
    if (isOpen) {
      if (initialStudentName) setStudentName(initialStudentName);
      else if (students.length > 0 && !studentName) setStudentName(students[0].name);

      if (initialClassDayId) setClassDayId(initialClassDayId);
      else if (classDays.length > 0 && !classDayId) setClassDayId(classDays[0].id);

      if (initialCurrentStatus) setCurrentStatus(initialCurrentStatus as AttendanceStatus);
      setReason('');
      setEvidenceUrl('');
    }
  }, [isOpen, initialStudentName, initialClassDayId, initialCurrentStatus]);

  const selectedClassDay = classDays.find(cd => cd.id === classDayId);
  const classDayName = selectedClassDay?.name || classDayId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      toast.error('Please select a student.');
      return;
    }
    if (!classDayId) {
      toast.error('Please select a class session.');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please provide a justification reason for this correction request.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (submitHandler) {
        await submitHandler({
          studentName: studentName.trim(),
          classDayId,
          classDayName,
          currentStatus,
          requestedStatus,
          reason: reason.trim(),
          evidenceUrl: evidenceUrl.trim() || undefined
        });
      }
      toast.success('Attendance correction request submitted for administrative review.');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit correction request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Attendance Correction"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Policy Notice */}
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Administrative Approval Policy</p>
            <p className="mt-0.5 text-amber-700 dark:text-amber-300">
              Per academic integrity regulations, locked historical attendance changes require formal administrative review and an immutable audit log entry.
            </p>
          </div>
        </div>

        {/* Student Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Student Candidate <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              disabled={currentUserRole === 'student'}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 disabled:opacity-70"
            >
              {students.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} {s.email ? `(${s.email})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Session Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Class Session / Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={classDayId}
              onChange={(e) => setClassDayId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            >
              {classDays.map((cd) => (
                <option key={cd.id} value={cd.id}>
                  {cd.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Transition Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Recorded Status
            </label>
            <select
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value as AttendanceStatus)}
              className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
            >
              {ATTENDANCE_STATUS_LIST.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Requested Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={requestedStatus}
              onChange={(e) => setRequestedStatus(e.target.value as AttendanceStatus)}
              className="w-full px-3 py-2 text-sm bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl font-semibold text-indigo-900 dark:text-indigo-200 focus:ring-2 focus:ring-indigo-500"
            >
              {ATTENDANCE_STATUS_LIST.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Justification Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Justification & Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="State why this record needs correction (e.g., student was present in back row but missed during roll-call, or submitted medical note)..."
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 resize-none"
            required
          />
        </div>

        {/* Evidence or Documentation URL/Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Supporting Evidence / Note Link <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="e.g. Doctor's note URL, Zoom attendance log timestamp, or reference"
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Modal Actions */}
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
            disabled={isSubmitting || !reason.trim()}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
