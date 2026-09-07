import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Filter, 
  Search, 
  User, 
  Calendar, 
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import { Modal } from '../../components/Modal';
import { AttendanceCorrectionRequest, AttendanceStatus } from '../../types/attendance';
import { toast } from 'sonner';

interface AttendanceApprovalsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  requests: AttendanceCorrectionRequest[];
  onApprove: (requestId: string, reviewNotes?: string) => Promise<void> | void;
  onReject: (requestId: string, reviewNotes: string) => Promise<void> | void;
  currentUserRole?: string;
}

export const AttendanceApprovalsDrawer: React.FC<AttendanceApprovalsDrawerProps> = ({
  isOpen,
  onClose,
  requests = [],
  onApprove,
  onReject,
  currentUserRole = 'admin'
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [selectedReq, setSelectedReq] = useState<AttendanceCorrectionRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredRequests = requests.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter;
    const matchSearch = 
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      (r.classDayName || '').toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.submittedBy.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const handleExecuteAction = async () => {
    if (!selectedReq || !actionType) return;

    if (actionType === 'reject' && !reviewNotes.trim()) {
      toast.error('Please specify review notes explaining why this request was rejected.');
      return;
    }

    try {
      setIsProcessing(true);
      if (actionType === 'approve') {
        await onApprove(selectedReq.id, reviewNotes.trim() || undefined);
        toast.success(`Correction for ${selectedReq.studentName} approved and attendance updated.`);
      } else {
        await onReject(selectedReq.id, reviewNotes.trim());
        toast.info(`Correction for ${selectedReq.studentName} marked as rejected.`);
      }
      setSelectedReq(null);
      setActionType(null);
      setReviewNotes('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process request.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attendance Correction Requests & Approvals"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Header Summary & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {pendingCount} Pending Review
            </span>
            <span className="text-xs text-slate-500">
              {requests.length} Total Requests
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search candidate, reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setFilter('pending')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === 'pending'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === 'approved'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === 'rejected'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Rejected
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>

        {/* Request List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <FileCheck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No correction requests found.
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {filter === 'pending'
                ? 'All attendance correction requests have been addressed.'
                : 'No requests match your current filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {filteredRequests.map((req) => {
              const isPending = req.status === 'pending';
              const isApproved = req.status === 'approved';
              const isRejected = req.status === 'rejected';

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {req.studentName}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {req.classDayName || req.classDayId}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : isApproved
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {req.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Transition Details */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">Proposed Change:</span>
                        <span className="line-through text-slate-400 font-medium">
                          {req.currentStatus}
                        </span>
                        <span className="text-slate-400">➔</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {req.requestedStatus}
                        </span>
                      </div>

                      {/* Reason Quote */}
                      <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <strong className="text-slate-900 dark:text-slate-100">Reason: </strong>
                        {req.reason}
                      </div>

                      {/* Evidence Link */}
                      {req.evidenceUrl && (
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate max-w-sm">{req.evidenceUrl}</span>
                        </div>
                      )}

                      {/* Submitter & Timestamp */}
                      <div className="text-[11px] text-slate-400 flex items-center gap-3 flex-wrap pt-1">
                        <span>Submitted by: <strong>{req.submittedBy}</strong> ({req.submittedByRole})</span>
                        <span>Date: {new Date(req.submittedAt).toLocaleDateString()} at {new Date(req.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {req.reviewedBy && (
                          <span className="text-slate-500">
                            Reviewed by: <strong>{req.reviewedBy}</strong> ({new Date(req.reviewedAt || '').toLocaleDateString()})
                          </span>
                        )}
                      </div>

                      {/* Review Notes if available */}
                      {req.reviewNotes && (
                        <div className="text-xs text-slate-600 dark:text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                          Admin Notes: &ldquo;{req.reviewNotes}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Action Controls for Administrators */}
                    {isPending && (
                      <div className="flex items-center sm:flex-col gap-2 shrink-0 self-end sm:self-start">
                        <button
                          onClick={() => {
                            setSelectedReq(req);
                            setActionType('approve');
                            setReviewNotes('');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReq(req);
                            setActionType('reject');
                            setReviewNotes('');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 rounded-lg border border-rose-200 dark:border-rose-800 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Confirmation & Review Notes Sub-Modal */}
        {selectedReq && actionType && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                {actionType === 'approve' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Approve Correction for {selectedReq.studentName}
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Reject Correction for {selectedReq.studentName}
                  </>
                )}
              </h4>
              <button
                onClick={() => {
                  setSelectedReq(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {actionType === 'approve'
                ? `This will update the authoritative attendance record from '${selectedReq.currentStatus}' to '${selectedReq.requestedStatus}' and write an immutable audit log entry.`
                : `Specify reasons for rejection. The candidate or lecturer will be notified.`}
            </p>

            <textarea
              rows={2}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={
                actionType === 'approve'
                  ? 'Optional administrative remarks or verification reference...'
                  : 'Mandatory reason for rejection (e.g., student was not confirmed present by proctor)...'
              }
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 resize-none"
              required={actionType === 'reject'}
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedReq(null);
                  setActionType(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/50 rounded-lg"
              >
                Dismiss
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={isProcessing || (actionType === 'reject' && !reviewNotes.trim())}
                className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isProcessing ? 'Processing...' : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Strict Audit Logging &bull; HTEIM Academic Registry</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
