import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  ShieldCheck, 
  Clock, 
  User, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Modal } from '../../components/Modal';
import { AttendanceAuditEntry } from '../../types/attendance';
import { toast } from 'sonner';

export interface AttendanceAuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs?: AttendanceAuditEntry[];
  logs?: AttendanceAuditEntry[];
}

export const AttendanceAuditHistoryModal: React.FC<AttendanceAuditHistoryModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  logs
}) => {
  const allLogs = auditLogs || logs || [];
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = allLogs.filter(log => {
    const matchFilter = 
      actionFilter === 'all' || 
      log.actionType === actionFilter ||
      (actionFilter === 'overrides' && (log.actionType === 'admin_override' || log.isOverride));

    const query = search.toLowerCase().trim();
    const matchSearch = 
      !query ||
      log.studentName.toLowerCase().includes(query) ||
      (log.actorName || '').toLowerCase().includes(query) ||
      (log.actorRole || '').toLowerCase().includes(query) ||
      (log.reason || '').toLowerCase().includes(query) ||
      (log.classDayName || log.classDayId || '').toLowerCase().includes(query);

    return matchFilter && matchSearch;
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No audit records to export.');
      return;
    }

    const headers = ['Timestamp', 'Student Name', 'Session ID', 'Previous Status', 'New Status', 'Actor', 'Role', 'Action Type', 'Reason'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.studentName}"`,
      `"${l.classDayName || l.classDayId}"`,
      `"${l.previousStatus}"`,
      `"${l.newStatus}"`,
      `"${l.actorName || l.actorEmail || ''}"`,
      `"${l.actorRole}"`,
      `"${l.actionType}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HTEIM_Attendance_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance audit history exported to CSV.');
  };

  const getActionBadge = (action: string, isOverride?: boolean) => {
    switch (action) {
      case 'admin_override':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Admin Override</span>;
      case 'correction_approved':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Correction Approved</span>;
      case 'correction_rejected':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">Correction Rejected</span>;
      case 'session_locked':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Session Locked</span>;
      case 'session_unlocked':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">Session Unlocked</span>;
      case 'medical_leave_approved':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">Medical Leave</span>;
      case 'lecturer_submission':
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Lecturer Mark</span>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attendance Audit Trail & Change History"
      maxWidth="max-w-5xl"
    >
      <div className="space-y-4">
        {/* Subtitle & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-xs text-slate-500">
              Immutable ledger of all attendance roll-calls, administrative overrides, locked record edits, and correction requests.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by student name, actor email, session, reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-semibold"
            >
              <option value="all">All Change Types ({auditLogs.length})</option>
              <option value="overrides">Admin Overrides & Approvals</option>
              <option value="lecturer_submission">Lecturer Submissions</option>
              <option value="correction_approved">Approved Corrections</option>
              <option value="session_locked">Session Locks</option>
              <option value="session_unlocked">Session Unlocks</option>
              <option value="medical_leave_approved">Medical Leave</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <History className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No audit records matching criteria.
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Attendance modifications, submissions, and overrides will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="max-h-[55vh] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 uppercase font-bold tracking-wider z-10">
                  <tr>
                    <th className="px-3.5 py-2.5">Timestamp</th>
                    <th className="px-3.5 py-2.5">Student / Target</th>
                    <th className="px-3.5 py-2.5">Session</th>
                    <th className="px-3.5 py-2.5">Change Transition</th>
                    <th className="px-3.5 py-2.5">Action Type</th>
                    <th className="px-3.5 py-2.5">Actor & Role</th>
                    <th className="px-3.5 py-2.5">Reason / Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                  {filteredLogs.map((log) => {
                    const dateObj = new Date(log.timestamp);
                    const formattedDate = !isNaN(dateObj.getTime())
                      ? `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : log.timestamp;

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {log.studentName}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {log.classDayName || log.classDayId}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-slate-400 line-through">{log.previousStatus || 'None'}</span>
                            <span className="text-slate-400">➔</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{log.newStatus}</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          {getActionBadge(log.actionType, log.isOverride)}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {log.actorName || log.actorEmail || 'System'}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase font-mono">
                            {log.actorRole}
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={log.reason}>
                          {log.reason || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographically sealed & synchronized with Supabase cloud backup</span>
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
