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
  GraduationCap,
  Sliders,
  DollarSign,
  CheckCircle,
  UserCheck,
  Radio,
  Shield
} from 'lucide-react';
import { AppNotification, TabType } from '../types';
import { NotificationCategory, CATEGORY_LABELS } from '../types/notifications';
import { CentralNotificationService } from '../services/notification/CentralNotificationService';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';

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
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const isAdminOrTeacher = currentRole === 'admin' || currentRole === 'teacher';
  
  // Category Filter Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | NotificationCategory>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Compute unread count from Central Notification Service
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

  // Filter notifications by active category or unread status
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab !== 'all') {
      // Match category cleanly or map legacy types
      if (n.category) return n.category === activeTab;
      if (activeTab === 'assignment_due') return n.type === 'due_date' || n.type === 'past_due';
      if (activeTab === 'assignment_graded') return n.type === 'graded';
      if (activeTab === 'attendance_warning') return n.type === 'at_risk_attendance';
      if (activeTab === 'payment_due' || activeTab === 'payment_received') return n.type === 'payment_past_due';
      if (activeTab === 'announcement') return n.type === 'general';
      return true;
    }
    return true;
  });

  const getNotifIcon = (notif: AppNotification) => {
    const category = (notif.category || notif.type) as string;
    switch (category) {
      case 'assignment_due':
      case 'due_date':
      case 'past_due':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'assignment_graded':
      case 'graded':
        return <Award className="w-4 h-4 text-emerald-600" />;
      case 'attendance_warning':
      case 'at_risk_attendance':
        return <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />;
      case 'payment_due':
      case 'payment_past_due':
        return <DollarSign className="w-4 h-4 text-red-600" />;
      case 'payment_received':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'application_status':
        return <UserCheck className="w-4 h-4 text-indigo-600" />;
      case 'announcement':
      case 'general':
        return <Radio className="w-4 h-4 text-blue-600" />;
      case 'system':
        return <Shield className="w-4 h-4 text-slate-600" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getNotifBadgeStyle = (notif: AppNotification) => {
    const category = (notif.category || notif.type) as string;
    switch (category) {
      case 'assignment_due':
      case 'due_date':
      case 'past_due':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300';
      case 'assignment_graded':
      case 'graded':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'attendance_warning':
      case 'at_risk_attendance':
      case 'payment_due':
      case 'payment_past_due':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300';
      case 'payment_received':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'application_status':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300';
      case 'announcement':
      case 'general':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  // Helper trigger test notifications for any category
  const handleTriggerCategoryTest = (category: NotificationCategory) => {
    CentralNotificationService.notify({
      category,
      title: `${CATEGORY_LABELS[category].label} Test Alert`,
      message: `Simulated centralized notification trigger for category "${category}".`,
      targetRole: isAdminOrTeacher ? 'admin' : 'student',
      studentName: currentStudentName,
      priority: 'high',
      actionTab: 'home'
    }).then(newNotif => {
      if (onAddTestNotification) {
        onAddTestNotification(newNotif as any);
      }
    });
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Icon Button with Unread Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/50 shadow-md font-bold'
            : unreadCount > 0
            ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}
        title="Centralized Notification Center"
      >
        {unreadCount > 0 ? (
          <BellRing className={`w-4 h-4 ${isOpen ? 'text-slate-950' : 'text-amber-500 animate-bounce'}`} />
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
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4.5 h-4.5 text-amber-400" />
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Notification Center
                </h3>
                <p className="text-[10px] text-slate-400">
                  Real-time alerts, due dates & status updates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowPreferencesModal(true)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-300 rounded-lg transition-colors cursor-pointer"
                title="Notification Preferences"
              >
                <Sliders className="w-4 h-4" />
              </button>
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
          <div className="p-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onTriggerScan?.()}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                title="Sync and scan for automated alerts"
              >
                <RefreshCw className="w-3 h-3" /> Sync Scan
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
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

          {/* Filter Sub-Tabs */}
          <div className="flex items-center justify-start bg-slate-100 dark:bg-slate-800 p-1 border-b border-slate-200 dark:border-slate-700 text-[10px] font-extrabold gap-1 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              All ({notifications.length})
            </button>

            <button
              onClick={() => setActiveTab('unread')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'unread'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Unread ({unreadCount})
            </button>

            <button
              onClick={() => setActiveTab('assignment_due')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'assignment_due'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 font-black shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Due Dates
            </button>

            <button
              onClick={() => setActiveTab('assignment_graded')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'assignment_graded'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 font-black shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Grading
            </button>

            <button
              onClick={() => setActiveTab('attendance_warning')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'attendance_warning'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 font-black shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Attendance
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  No Notifications
                </p>
                <p className="text-[10px] text-slate-400">
                  {unreadCount === 0 && activeTab === 'unread'
                    ? 'All notifications are read!'
                    : 'You are all caught up! Real-time alerts will appear here.'}
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
                  className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer flex items-start gap-3 relative ${
                    !notif.read
                      ? 'bg-amber-500/5 dark:bg-amber-500/10 border-l-4 border-amber-500'
                      : 'opacity-85'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex-shrink-0 mt-0.5">
                    {getNotifIcon(notif)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider border ${getNotifBadgeStyle(
                          notif
                        )}`}
                      >
                        {(notif.category || notif.type || 'system').replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {notif.createdAt}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug truncate">
                      {notif.title}
                    </h4>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] pt-1">
                      <span className="text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-0.5 hover:underline">
                        {notif.actionTab
                          ? `View in ${notif.actionTab.charAt(0).toUpperCase() + notif.actionTab.slice(1)}`
                          : 'View Details'}{' '}
                        <ChevronRight className="w-3 h-3" />
                      </span>

                      {!notif.read && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onMarkAsRead(notif.id);
                          }}
                          className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-200 font-bold transition-colors"
                          title="Mark as read"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Test Category Trigger Footer */}
          <div className="p-3 bg-slate-900 text-white border-t border-slate-800 flex items-center justify-between text-[11px] flex-wrap gap-2">
            <span className="text-slate-400 font-medium text-[10px] flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Test Category Alert:
            </span>

            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => handleTriggerCategoryTest('assignment_due')}
                className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded hover:bg-amber-400 transition-colors cursor-pointer"
              >
                + Due
              </button>
              <button
                onClick={() => handleTriggerCategoryTest('assignment_graded')}
                className="px-2 py-0.5 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                + Grade
              </button>
              <button
                onClick={() => handleTriggerCategoryTest('attendance_warning')}
                className="px-2 py-0.5 bg-rose-600 text-white font-bold text-[10px] rounded hover:bg-rose-500 transition-colors cursor-pointer"
              >
                + Att
              </button>
              <button
                onClick={() => handleTriggerCategoryTest('payment_due')}
                className="px-2 py-0.5 bg-indigo-600 text-white font-bold text-[10px] rounded hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                + Tuition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
      />
    </div>
  );
};
