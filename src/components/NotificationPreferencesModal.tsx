import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Check,
  RotateCcw,
  Sliders,
  Mail,
  MessageSquare,
  Smartphone,
  Shield,
  Info,
  Clock,
  Award,
  AlertCircle,
  DollarSign,
  CheckCircle,
  UserCheck,
  Radio,
  Sparkles
} from 'lucide-react';
import {
  NotificationCategory,
  NotificationChannel,
  UserNotificationPreferences,
  CATEGORY_LABELS,
  DEFAULT_NOTIFICATION_PREFERENCES
} from '../types/notifications';
import { CentralNotificationService } from '../services/notification/CentralNotificationService';
import { useAccessibleModal } from '../lib/useAccessibleModal';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: () => void;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess
}) => {
  const dialogRef = useAccessibleModal(isOpen, onClose);
  const [preferences, setPreferences] = useState<UserNotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPreferences(CentralNotificationService.getPreferences());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = Object.keys(CATEGORY_LABELS) as NotificationCategory[];

  const handleToggleChannel = (category: NotificationCategory, channel: NotificationChannel) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel]
      }
    }));
  };

  const handleEnableAll = () => {
    const updated = { ...preferences };
    categories.forEach(cat => {
      updated[cat] = { in_app: true, email: true, sms: true, whatsapp: true };
    });
    setPreferences(updated);
  };

  const handleResetDefaults = () => {
    setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
  };

  const handleSave = () => {
    CentralNotificationService.updatePreferences(preferences);
    setSaveSuccessBanner(true);
    setTimeout(() => {
      setSaveSuccessBanner(false);
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    }, 1000);
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'assignment_due':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'assignment_graded':
        return <Award className="w-4 h-4 text-emerald-500" />;
      case 'attendance_warning':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'payment_due':
        return <DollarSign className="w-4 h-4 text-red-500" />;
      case 'payment_received':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'application_status':
        return <UserCheck className="w-4 h-4 text-indigo-500" />;
      case 'announcement':
        return <Radio className="w-4 h-4 text-blue-500" />;
      case 'system':
        return <Shield className="w-4 h-4 text-slate-500" />;
      default:
        return <Bell className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        ref={dialogRef}
        className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight uppercase">
                Centralized Notification Preferences
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure delivery channels (In-App, Email, SMS, WhatsApp) across all notification categories
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {saveSuccessBanner && (
          <div className="p-3 bg-emerald-500 text-white text-xs font-bold text-center flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Preferences saved and synchronized successfully!
          </div>
        )}

        {/* Quick Presets Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span>Customize how alerts reach you in real-time</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEnableAll}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Enable All
            </button>
            <button
              onClick={handleResetDefaults}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>

        {/* Preferences Matrix Table */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* Table Legend */}
          <div className="grid grid-cols-12 gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
            <div className="col-span-6 sm:col-span-6">Category & Description</div>
            <div className="col-span-6 sm:col-span-6 grid grid-cols-4 text-center">
              <div className="flex flex-col items-center gap-0.5" title="In-App Portal Feeds">
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>In-App</span>
              </div>
              <div className="flex flex-col items-center gap-0.5" title="Email Notifications">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span>Email</span>
              </div>
              <div className="flex flex-col items-center gap-0.5" title="SMS Text Messages">
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                <span>SMS</span>
              </div>
              <div className="flex flex-col items-center gap-0.5" title="WhatsApp Business Alerts">
                <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                <span>WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Categories Rows */}
          {categories.map(category => {
            const meta = CATEGORY_LABELS[category];
            const pref = preferences[category] || { in_app: true, email: true, sms: false, whatsapp: false };

            return (
              <div
                key={category}
                className="grid grid-cols-12 gap-2 p-3 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 items-center hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors"
              >
                {/* Category Info */}
                <div className="col-span-6 sm:col-span-6 flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5 shadow-2xs">
                    {getCategoryIcon(category)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {meta.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {meta.description}
                    </p>
                  </div>
                </div>

                {/* Channel Toggles */}
                <div className="col-span-6 sm:col-span-6 grid grid-cols-4 items-center justify-items-center">
                  {(['in_app', 'email', 'sms', 'whatsapp'] as NotificationChannel[]).map(channel => {
                    const isChecked = pref[channel];
                    return (
                      <button
                        key={channel}
                        onClick={() => handleToggleChannel(category, channel)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer focus:outline-none ring-offset-2 focus:ring-1 focus:ring-amber-500 ${
                          isChecked ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        title={`Toggle ${channel} for ${meta.label}`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            isChecked ? 'transform translate-x-4' : ''
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Saved preferences apply immediately to all automated notifications.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" /> Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
