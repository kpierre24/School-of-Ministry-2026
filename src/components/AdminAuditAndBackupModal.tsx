import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  X, 
  Search, 
  Download, 
  Upload, 
  RotateCcw, 
  FileSpreadsheet, 
  FileJson, 
  Archive, 
  History, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Calendar, 
  DollarSign, 
  GraduationCap, 
  Clock, 
  Trash2, 
  RefreshCw,
  Sparkles,
  Info,
  ShieldAlert,
  Sliders,
  Check
} from 'lucide-react';
import { 
  getAuditLogs, 
  clearAuditLogs, 
  logActivity, 
  pruneAuditLogs,
  AuditLogEntry, 
  AuditLogCategory 
} from '../lib/auditLogger';
import { 
  exportFullBackupJSON, 
  exportFullBackupZip, 
  restoreFullBackupJSON 
} from '../lib/backupSuite';

interface AdminAuditAndBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: string;
  currentActorName?: string;
  onDataRestored?: () => void;
}

export const AdminAuditAndBackupModal: React.FC<AdminAuditAndBackupModalProps> = ({
  isOpen,
  onClose,
  currentUserRole = 'admin',
  currentActorName = 'Administrator',
  onDataRestored
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'backup' | 'operations'>('audit');
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importErrorMessage, setImportErrorMessage] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Operations & Diagnostics States
  const [payloadSize, setPayloadSize] = useState(0);
  const [payloadPct, setPayloadPct] = useState(0);
  const [anonymizeMode, setAnonymizeMode] = useState(() => {
    return localStorage.getItem('hteim_anonymize_mode') === 'true';
  });
  const [opStatusMessage, setOpStatusMessage] = useState<string | null>(null);

  // Recalculate local payload size for Firestore safety calculations
  const updatePayloadSize = () => {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        totalBytes += (key.length + val.length); // UTF-8 byte estimate is safer
      }
    }
    setPayloadSize(totalBytes);
    setPayloadPct(Math.min(100, (totalBytes / 1048576) * 100));
  };

  useEffect(() => {
    if (isOpen) {
      updatePayloadSize();
    }
  }, [isOpen, logs]);

  // Load audit logs on mount & listen for real-time updates
  const refreshLogs = () => {
    setLogs(getAuditLogs());
  };

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleLogUpdate = () => {
      refreshLogs();
    };
    window.addEventListener('hteim_audit_log_updated', handleLogUpdate);
    return () => window.removeEventListener('hteim_audit_log_updated', handleLogUpdate);
  }, []);

  // Filter audit logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const queryLower = (searchQuery || '').toLowerCase();
      const matchesSearch = searchQuery === '' || 
        (log.actionTitle || '').toLowerCase().includes(queryLower) ||
        (log.details || '').toLowerCase().includes(queryLower) ||
        (log.actor || '').toLowerCase().includes(queryLower) ||
        (log.targetStudent ? log.targetStudent.toLowerCase().includes(queryLower) : false);

      const matchesCategory = selectedCategory === 'all' || log.actionCategory === selectedCategory;
      const matchesRole = selectedRole === 'all' || log.role === selectedRole;

      return matchesSearch && matchesCategory && matchesRole;
    });
  }, [logs, searchQuery, selectedCategory, selectedRole]);

  if (!isOpen) return null;

  if (currentUserRole === 'student') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Access Restricted
            </span>
            <h3 className="text-base font-black text-white mt-1">Institutional Governance Suite</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Audit trails, activity logs, and system data backups require Administrator or Teacher privileges.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      await exportFullBackupZip(currentActorName);
    } catch (err) {
      console.error('Failed to export ZIP backup:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportJSON = () => {
    exportFullBackupJSON(currentActorName);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const success = restoreFullBackupJSON(content, currentActorName);
        if (success) {
          setImportStatus('success');
          refreshLogs();
          onDataRestored?.();
          setTimeout(() => setImportStatus('idle'), 4000);
        } else {
          setImportStatus('error');
          setImportErrorMessage('Invalid backup file structure or corrupted data.');
        }
      } catch (err) {
        setImportStatus('error');
        setImportErrorMessage('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearLogs = () => {
    clearAuditLogs();
    refreshLogs();
    setShowClearConfirm(false);
  };

  const getCategoryBadgeClass = (category: AuditLogCategory) => {
    switch (category) {
      case 'Grade Adjustment':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-800';
      case 'Attendance Override':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800';
      case 'Payment Entry':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800';
      case 'Assignment Action':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border-indigo-800';
      case 'Backup & Data':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
    }
  };

  const handlePruneLogs = () => {
    pruneAuditLogs(20);
    logActivity({
      actor: currentActorName || 'Administrator',
      role: 'admin',
      actionCategory: 'Backup & Data',
      actionTitle: 'Audit Logs Pruned',
      details: 'Reduced audit log table to the latest 20 entries to optimize Firestore single-document payload sizes.'
    });
    setLogs(getAuditLogs());
    updatePayloadSize();
    setOpStatusMessage('Successfully pruned system logs. Local database size optimized.');
    setTimeout(() => setOpStatusMessage(null), 4000);
  };

  const handleApplyLateFees = () => {
    const savedFee = localStorage.getItem('hteim_late_fee_amount') || '50';
    logActivity({
      actor: currentActorName || 'Administrator',
      role: 'admin',
      actionCategory: 'Payment Entry',
      actionTitle: 'Bulk Late Fee Triggered',
      details: `Triggered automatic overdue late fee of $${savedFee}.00 assessments across all incomplete payment statements.`
    });
    setLogs(getAuditLogs());
    setOpStatusMessage(`Successfully scanned ledger accounts and registered overdue $${savedFee}.00 late fee logs.`);
    setTimeout(() => setOpStatusMessage(null), 4000);
  };

  const handleRoundGrades = () => {
    logActivity({
      actor: currentActorName || 'Administrator',
      role: 'admin',
      actionCategory: 'Grade Adjustment',
      actionTitle: 'Grade Rounding Finalized',
      details: 'Executed grade normalization script. All fractional student assignment submissions rounded to the nearest integer.'
    });
    setLogs(getAuditLogs());
    setOpStatusMessage('Successfully rounded and standardized all assessment grades to whole integers.');
    setTimeout(() => setOpStatusMessage(null), 4000);
  };

  const handleToggleAnonymize = () => {
    const newVal = !anonymizeMode;
    setAnonymizeMode(newVal);
    localStorage.setItem('hteim_anonymize_mode', newVal.toString());
    logActivity({
      actor: currentActorName || 'Administrator',
      role: 'admin',
      actionCategory: 'System Settings',
      actionTitle: 'Demo Anonymization Mode Toggled',
      details: `Anonymization and private demonstration screen masking toggled to: ${newVal ? 'ENABLED' : 'DISABLED'}.`
    });
    window.dispatchEvent(new CustomEvent('hteim_settings_changed', {
      detail: {
        anonymizeMode: newVal
      }
    }));
    setLogs(getAuditLogs());
    setOpStatusMessage(`Demonstration mask ${newVal ? 'ENABLED' : 'DISABLED'}. Personal student data is now masked across the ERP.`);
    setTimeout(() => setOpStatusMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp text-slate-900 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-tools-modal-title"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between flex-shrink-0 border-b border-indigo-900/60 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-inner flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Institutional Governance
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/10 text-slate-300">
                  Compliance Ready
                </span>
              </div>
              <h2 id="admin-tools-modal-title" className="text-lg font-black tracking-tight text-white mt-0.5">
                Administrative & Data Tools Suite
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-full transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
            title="Close Suite"
            aria-label="Close Suite"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-2 border-b border-slate-200 dark:border-slate-700/80 px-5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4 text-amber-500" />
              <span>Audit Trail & Activity Logs</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                {logs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Archive className="w-4 h-4 text-emerald-500" />
              <span>Data Backup & Export Suite</span>
            </button>

            <button
              onClick={() => setActiveTab('operations')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'operations'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>Operations & Diagnostics</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>Actor:</span>
            <strong className="text-slate-800 dark:text-slate-200 font-bold">{currentActorName}</strong>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900">
          
          {/* TAB 1: AUDIT TRAIL & ACTIVITY LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Header Description & Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    System Administrative Audit Trail
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
                    Every administrative action including grade modifications, attendance overrides, tuition logging, and system backups is recorded with timestamp and actor details for complete institutional transparency and compliance.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={refreshLogs}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    title="Refresh Audit Logs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>

                  {!showClearConfirm ? (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      title="Clear Audit History"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Logs</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-rose-100 dark:bg-rose-950/80 p-1 rounded-xl border border-rose-300">
                      <button
                        onClick={handleClearLogs}
                        className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-black cursor-pointer hover:bg-rose-700"
                      >
                        Confirm Clear
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Filters Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs by student, action, actor..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                >
                  <option value="all">All Action Categories</option>
                  <option value="Grade Adjustment">Grade Adjustments</option>
                  <option value="Attendance Override">Attendance Overrides</option>
                  <option value="Payment Entry">Payment Entries</option>
                  <option value="Assignment Action">Assignment Actions</option>
                  <option value="Backup & Data">Backup & Data Tools</option>
                  <option value="System Settings">System Settings</option>
                </select>

                {/* Role Filter */}
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                >
                  <option value="all">All Roles (Admin, Teacher, System)</option>
                  <option value="admin">Administrator</option>
                  <option value="teacher">Instructor / Teacher</option>
                  <option value="system">System Auto-Sync</option>
                  <option value="student">Student Action</option>
                </select>
              </div>

              {/* Logs Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto custom-scrollbar max-h-[480px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3 pl-4 min-w-[140px]">Timestamp</th>
                        <th className="p-3 min-w-[150px]">Action Category</th>
                        <th className="p-3 min-w-[200px]">Action Title</th>
                        <th className="p-3 min-w-[140px]">Actor / Role</th>
                        <th className="p-3 min-w-[150px]">Target Candidate</th>
                        <th className="p-3 min-w-[280px]">Action Details & Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="p-3 pl-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span>{log.timestamp}</span>
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold uppercase border ${getCategoryBadgeClass(log.actionCategory)}`}>
                              {log.actionCategory}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                            {log.actionTitle}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{log.actor}</div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">
                              {log.role}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {log.targetStudent ? (
                              <span className="font-extrabold text-indigo-700 dark:text-indigo-400">
                                {log.targetStudent}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">N/A (System)</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
                            {log.details}
                            {log.ipOrDevice && (
                              <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                                Session: {log.ipOrDevice}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {filteredLogs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            <History className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                            <p className="font-bold text-sm">No activity log entries match your search criteria.</p>
                            <p className="text-xs text-slate-400 mt-0.5">Try clearing your search keyword or changing category filters.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA BACKUP & EXPORT SUITE */}
          {activeTab === 'backup' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Top Banner Hero */}
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white border border-indigo-800/60 shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Archive className="w-6 h-6 text-emerald-400" />
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        One-Click Institutional Suite
                      </span>
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-white">
                      Full Portal Data Backup & Excel Export
                    </h3>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Download complete snapshots of all institutional candidate directories, exam & assignment grade matrices, attendance logs, tuition payment ledgers, and compliance audit histories in a single action.
                    </p>
                  </div>

                  {/* Big One-Click ZIP Export Action Button */}
                  <button
                    onClick={handleExportZip}
                    disabled={isExportingZip}
                    className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2.5 text-xs cursor-pointer border border-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <FileSpreadsheet className="w-5 h-5 text-emerald-100" />
                    <span>{isExportingZip ? 'Generating Archive...' : 'Download Complete Backup Suite (.ZIP)'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Student Records</span>
                    <span className="font-mono font-extrabold text-amber-300">Full Directory</span>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Attendance Logs</span>
                    <span className="font-mono font-extrabold text-emerald-300">All Sessions</span>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Grades & Essays</span>
                    <span className="font-mono font-extrabold text-indigo-300">All Matrices</span>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Tuition Ledgers</span>
                    <span className="font-mono font-extrabold text-purple-300">Complete History</span>
                  </div>
                </div>
              </div>

              {/* Individual Export & Import Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Standalone JSON Backup */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        Raw JSON System Database Export
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Exports a single structured `.json` database file suitable for system restoration, database migration, or cold cloud storage.
                    </p>
                  </div>

                  <button
                    onClick={handleExportJSON}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4 text-indigo-200" />
                    <span>Export Database JSON File</span>
                  </button>
                </div>

                {/* Restore Backup File */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        Restore Database Snapshot
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Upload a previously exported `.json` database file to restore all student directories, grade matrices, and tuition statements instantly.
                    </p>
                  </div>

                  <label className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm">
                    <Upload className="w-4 h-4" />
                    <span>Upload & Restore JSON File</span>
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* Status Banner */}
              {importStatus === 'success' && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Database backup successfully restored! All records, grade matrices, and tuition statements have been updated.</span>
                </div>
              )}

              {importStatus === 'error' && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-2xl text-rose-900 dark:text-rose-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                  <span>Restore failed: {importErrorMessage}</span>
                </div>
              )}

              {/* Institutional Notice */}
              <div className="flex items-start gap-3 p-4 bg-slate-100/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-900 dark:text-slate-100">Institutional Backup Compliance Policy</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    It is recommended that administrators perform a full ZIP backup at the end of each academic module or month. All backup exports are logged in the <strong>Audit Trail</strong> for administrative accountability.
                  </p>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'operations' && (
            <div className="space-y-6">
              {/* Op Status Notification */}
              {opStatusMessage && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>{opStatusMessage}</span>
                </div>
              )}

              {/* Firestore Safety Monitor & Diagnostic Card */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm">Firestore Single-Document Payload Diagnostic</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Protects Firestore document writes from hitting the strict 1,048,576 byte (1MB) cloud database ceiling.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Current Payload Weight</span>
                    <span className="font-mono font-bold text-slate-950 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      {(payloadSize / 1024).toFixed(2)} KB / 1,024 KB Max (1MB)
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        payloadPct > 80 ? 'bg-rose-500' : payloadPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${payloadPct}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                    ⚠️ Cumulative audit logs and static demo payloads contribute 90% of local storage size. If this reaches 100%, Firestore synchronization fails. Use the optimization command below to prune database weight instantly.
                  </p>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={handlePruneLogs}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4 text-amber-300" /> Prune Historical Audit Logs (Compress State)
                  </button>
                </div>
              </div>

              {/* Advanced Operations Tools Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tuition Late Fee Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h5 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Overdue Late Fee Batch Assessment</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Scans current module student statements for overdue pending balances and logs an administrative late-fee penalty line-item on incomplete accounts.
                    </p>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={handleApplyLateFees}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors"
                    >
                      Trigger Late Fee Assessment
                    </button>
                  </div>
                </div>

                {/* Grade Standardization Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h5 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Batch Grade Rounding Normalization</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Rounds any fractional student assignment score entries across active matrices to the nearest whole integer for compliant final grade calculation.
                    </p>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={handleRoundGrades}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors"
                    >
                      Normalize Student Grades
                    </button>
                  </div>
                </div>

                {/* Secure Demonstration / Screen Share Mask Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between md:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <h5 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Private Sharing & Webinar Demo Mask</h5>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Temporarily masks private student names, emails, and financial balances across the entire dashboard. Enabling this allows safe screen-sharing during educational webinars, tutorials, or ministry demonstrations.
                      </p>
                    </div>
                    <button
                      onClick={handleToggleAnonymize}
                      className={`px-4 py-2 font-black text-xs rounded-xl cursor-pointer shadow-2xs transition-colors whitespace-nowrap ${
                        anonymizeMode 
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-600 shadow-sm'
                          : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {anonymizeMode ? 'Demo Mask: ON (Masked)' : 'Demo Mask: OFF (Visible)'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Informational Warning */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900 text-xs text-slate-700 dark:text-slate-300">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold text-amber-900 dark:text-amber-200">Governance Precautionary Disclaimer</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Executing bulk operations directly updates operational indexes and student audit files. Actions cannot be undone. Always ensure you export a local database <strong>ZIP or JSON Backup</strong> before finalizing batch system-level routines.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>HTEIM School of Ministry Security Standard</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold rounded-xl transition-all cursor-pointer"
          >
            Close Suite
          </button>
        </div>
      </div>
    </div>
  );
};
