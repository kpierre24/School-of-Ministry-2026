import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Calendar, 
  User, 
  Clock, 
  Lock, 
  Unlock 
} from 'lucide-react';
import { Modal } from '../../components/Modal';
import { AttendanceStatus, ATTENDANCE_STATUS_LIST } from '../../types/attendance';
import { toast } from 'sonner';

export interface AdminOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  classDayId: string;
  classDayName?: string;
  currentStatus: AttendanceStatus | string;
  onConfirmOverride?: (payload: {
    studentName: string;
    classDayId: string;
    newStatus: AttendanceStatus;
    overrideReason: string;
  }) => Promise<void> | void;
  onConfirm?: (payload: {
    studentName: string;
    classDayId: string;
    newStatus: AttendanceStatus;
    overrideReason: string;
  }) => Promise<void> | void;
}

export const AdminOverrideModal: React.FC<AdminOverrideModalProps> = ({
  isOpen,
  onClose,
  studentName,
  classDayId,
  classDayName = '',
  currentStatus = 'Absent',
  onConfirmOverride,
  onConfirm
}) => {
  const confirmHandler = onConfirmOverride || onConfirm;
  const [newStatus, setNewStatus] = useState<AttendanceStatus>(
    (currentStatus as AttendanceStatus) === 'Present' ? 'Absent' : 'Present'
  );
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setNewStatus((currentStatus as AttendanceStatus) === 'Present' ? 'Absent' : 'Present');
      setOverrideReason('');
    }
  }, [isOpen, currentStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      toast.error('Mandatory audit justification reason is required for administrator overrides.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (confirmHandler) {
        await confirmHandler({
          studentName,
          classDayId,
          newStatus,
          overrideReason: overrideReason.trim()
        });
      }
      toast.success(`Administrative override logged for ${studentName}: ${newStatus}`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record administrative override.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Administrative Attendance Override"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning Banner */}
        <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-start gap-2.5 text-xs text-purple-900 dark:text-purple-200">
          <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Authoritative Administrative Override</p>
            <p className="mt-0.5 text-purple-700 dark:text-purple-300">
              You are directly altering a locked historical record. Your user ID, timestamp, previous status, and justification reason will be logged immutably.
            </p>
          </div>
        </div>

        {/* Target Details */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Student:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{studentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Session Date:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{classDayName || classDayId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Current Status:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{currentStatus}</span>
          </div>
        </div>

        {/* New Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            New Authoritative Status <span className="text-rose-500">*</span>
          </label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as AttendanceStatus)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-indigo-900 dark:text-indigo-200 focus:ring-2 focus:ring-indigo-500"
          >
            {ATTENDANCE_STATUS_LIST.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Audit Justification Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Document why this locked record is being altered (e.g. Dean approved medical waiver, proctor mistake confirmed)..."
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 resize-none"
            required
          />
        </div>

        {/* Actions */}
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
            disabled={isSubmitting || !overrideReason.trim()}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isSubmitting ? 'Logging Override...' : 'Confirm Admin Override'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
