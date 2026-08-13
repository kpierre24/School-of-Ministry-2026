import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Clock, 
  AlertCircle, 
  Award, 
  FileUp, 
  X, 
  Calendar, 
  Trash2, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Zap,
  GraduationCap
} from 'lucide-react';
import { AppNotification, TabType } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onSelectNotification: (notification: AppNotification) => void;
  onTriggerScan?: () => void;
  onAddTestNotification?: (notif: AppNotification) => void;
  currentRole?: string;
  currentStudentName?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
  onSelectNotification,
  onTriggerScan,
  onAddTestNotification,
  currentRole = 'admin',
  currentStudentName = 'Student'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isAdminOrTeacher = currentRole === 'admin' || currentRole === 'teacher';
  const [activeTab, setActiveTab] = useState<'all' | 'due' | 'graded' | 'submission' | 'announcements'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter notifications by sub-tab
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'due') return n.type === 'due_date' || n.type === 'past_due';
    if (activeTab === 'graded') return n.type === 'graded';
    if (activeTab === 'submission') return n.type === 'submission';
    if (activeTab === 'announcements') return n.type === 'general' || n.type === 'at_risk_attendance' || n.type === 'payment_past_due';
    return true;
  });

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'past_due':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'due_date':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'graded':
        return <Award className="w-4 h-4 text-emerald-600" />;
      case 'submission':
        return <FileUp className="w-4 h-4 text-indigo-600" />;
      case 'at_risk_attendance':
      case 'payment_past_due':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  const getNotifBadgeStyle = (type: AppNotification['type']) => {
    switch (type) {
      case 'past_due':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'due_date':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'graded':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'submission':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'at_risk_attendance':
      case 'payment_past_due':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const handleSimulateGradeAlert = () => {
    if (!onAddTestNotification) return;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    onAddTestNotification({
      id: `SIM-GRADE-${Date.now()}`,
      title: '🎓 Grading Notification: Exegesis Paper',
      message: `Your submitted paper for Romans 8 Exegesis has been evaluated. Score: 98/100. Instructor Feedback: "Superb Greek translation and contextual application!"`,
      type: 'graded',
      targetRole: 'student',
      studentName: currentStudentName,
      createdAt: nowStr,
      read: false,
      priority: 'high',
      actionTab: 'exams'
    });
  };

  const handleSimulateDueDateAlert = () => {
    if (!onAddTestNotification) return;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    onAddTestNotification({
      id: `SIM-DUE-${Date.now()}`,
      title: '⏰ Due Date Reminder: Homiletics Sermon Outline',
      message: 'The Homiletics sermon outline assignment is due in 24 hours. Ensure your document is uploaded in the Exams tab.',
      type: 'due_date',
      targetRole: 'student',
      studentName: currentStudentName,
      createdAt: nowStr,
      read: false,
      priority: 'high',
      actionTab: 'exams'
    });
  };

  const handleSimulateSubmissionAlert = () => {
    if (!onAddTestNotification) return;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    onAddTestNotification({
      id: `SIM-SUBMIT-${Date.now()}`,
      title: '📄 New Submission: Alicia Noray Bowles',
      message: 'Alicia Noray Bowles uploaded "Module_3_Exegesis_Paper.pdf" for Romans 8 Hermeneutics. Pending faculty review & evaluation.',
      type: 'submission',
      targetRole: 'admin',
      studentName: 'Alicia Noray Bowles',
      createdAt: nowStr,
      read: false,
      priority: 'normal',
      actionTab: 'exams'
    });
  };

  const handleSimulateAnnouncementAlert = () => {
    if (!onAddTestNotification) return;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    onAddTestNotification({
      id: `SIM-ANN-${Date.now()}`,
      title: '📢 Ministry Broadcast: Schedule Update',
      message: 'Saturday morning live Zoom session will start promptly at 9:00 AM EST. Please check the Schedule tab.',
      type: 'general',
      targetRole: 'all',
      createdAt: nowStr,
      read: false,
      priority: 'normal',
      actionTab: 'schedule'
    });
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50 shadow-md'
            : unreadCount > 0
            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
        }`}
        title="Classroom Notifications & Due Date Alerts"
      >
        {unreadCount > 0 ? (
          <BellRing className={`w-4 h-4 ${isOpen ? 'text-amber-300' : 'text-amber-600 animate-bounce'}`} />
        ) : (
          <Bell className="w-4 h-4" />
        )}

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-white font-mono font-black text-[10px] items-center justify-center shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Flyout Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-fadeIn">
          
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4.5 h-4.5 text-amber-400" />
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider">Automated Notifications</h3>
                <p className="text-[10px] text-slate-400">Due dates, grading updates & submissions</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-600 text-white font-mono font-bold text-[10px] rounded-full">
                  {unreadCount} New
                </span>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onTriggerScan?.();
                }}
                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                title="Scan current assignments for due dates"
              >
                <RefreshCw className="w-3 h-3" /> Sync Scan
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <CheckCheck className="w-3 h-3" /> Mark All Read
                </button>
              )}
            </div>

            <button
              onClick={onClearNotifications}
              className="text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>

          {/* Filter Sub-Tabs (Role-Aware) */}
          <div className="flex items-center justify-around bg-slate-100 p-1 border-b border-slate-200 text-[10px] font-extrabold flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({notifications.length})
            </button>
            {isAdminOrTeacher ? (
              <>
                <button
                  onClick={() => setActiveTab('submission')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeTab === 'submission' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'text-slate-600 hover:text-indigo-700'
                  }`}
                >
                  Submissions ({notifications.filter(n => n.type === 'submission').length})
                </button>
                <button
                  onClick={() => setActiveTab('announcements')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeTab === 'announcements' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-blue-700'
                  }`}
                >
                  Alerts & Broadcasts ({notifications.filter(n => n.type === 'general' || n.type === 'at_risk_attendance' || n.type === 'payment_past_due').length})
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('due')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeTab === 'due' ? 'bg-white text-amber-700 shadow-2xs font-black' : 'text-slate-600 hover:text-amber-700'
                  }`}
                >
                  Due Dates ({notifications.filter(n => n.type === 'due_date' || n.type === 'past_due').length})
                </button>
                <button
                  onClick={() => setActiveTab('graded')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeTab === 'graded' ? 'bg-white text-emerald-700 shadow-2xs font-black' : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  Grading ({notifications.filter(n => n.type === 'graded').length})
                </button>
                <button
                  onClick={() => setActiveTab('announcements')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeTab === 'announcements' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-blue-700'
                  }`}
                >
                  Announcements ({notifications.filter(n => n.type === 'general').length})
                </button>
              </>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No Notifications</p>
                <p className="text-[10px] text-slate-400">
                  {isAdminOrTeacher 
                    ? 'No new student submissions or administrative alerts pending.' 
                    : 'You are all caught up! Automated due dates and instructor feedback will appear here.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => {
                    onMarkAsRead(notif.id);
                    onSelectNotification(notif);
                    setIsOpen(false);
                  }}
                  className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 relative ${
                    !notif.read ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : 'opacity-85'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs flex-shrink-0 mt-0.5">
                    {getNotifIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider border ${getNotifBadgeStyle(notif.type)}`}>
                        {notif.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {notif.createdAt}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">
                      {notif.title}
                    </h4>

                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] pt-1">
                      <span className="text-indigo-600 font-extrabold flex items-center gap-0.5 hover:underline">
                        {notif.actionTab ? `View in ${notif.actionTab.charAt(0).toUpperCase() + notif.actionTab.slice(1)} Tab` : 'View Details'} <ChevronRight className="w-3 h-3" />
                      </span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Test / Simulation Action Footer */}
          <div className="p-3 bg-slate-900 text-white border-t border-slate-800 flex items-center justify-between text-[11px] flex-wrap gap-2">
            <span className="text-slate-400 font-medium text-[10px] flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Test Triggers:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {isAdminOrTeacher ? (
                <>
                  <button
                    onClick={handleSimulateSubmissionAlert}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded transition-all cursor-pointer"
                  >
                    + Test Submission
                  </button>
                  <button
                    onClick={handleSimulateAnnouncementAlert}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] rounded border border-slate-700 transition-all cursor-pointer"
                  >
                    + Test Broadcast
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSimulateGradeAlert}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded transition-all cursor-pointer"
                  >
                    + Test Grade
                  </button>
                  <button
                    onClick={handleSimulateDueDateAlert}
                    className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded transition-all cursor-pointer"
                  >
                    + Test Due Date
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
