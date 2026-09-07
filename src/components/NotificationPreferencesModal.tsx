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
  BookOpen,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import {
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

  const primaryCategories = [
    'academic',
    'attendance',
    'financial',
    'announcement',
    'enrollment',
    'library',
    'system'
  ];

  const handleToggleChannel = (categoryKey: string, channel: NotificationChannel) => {
    setPreferences(prev => {
      const current = prev[categoryKey] || { in_app: true, email: true, push: true, whatsapp: false };
      return {
        ...prev,
        [categoryKey]: {
          ...current,
          [channel]: !current[channel]
        }
      };
    });
  };

  const handleEnableAll = () => {
    const updated = { ...preferences };
    primaryCategories.forEach(cat => {
      updated[cat] = { in_app: true, email: true, push: true, whatsapp: true };
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
    }, 900);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic':
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
      case 'attendance':
        return <Clock className="w-4 h-4 text-rose-500" />;
      case 'financial':
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'announcement':
        return <Radio className="w-4 h-4 text-indigo-500" />;
      case 'enrollment':
        return <UserCheck className="w-4 h-4 text-purple-500" />;
      case 'library':
        return <BookOpen className="w-4 h-4 text-teal-500" />;
      case 'system':
        return <Shield className="w-4 h-4 text-slate-500" />;
      default:
        return <Bell className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" id="notification-preferences-modal">
      <div
        ref={dialogRef}
        className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight uppercase">
                Notification Delivery Settings
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure delivery channels (In-App, Email, Push, WhatsApp) across institutional categories
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
          <div className="p-3 bg-emerald-500 text-white text-xs font-bold text-center flex items-center justify-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4" /> Preferences saved and synchronized to cloud engine!
          </div>
        )}

        {/* Quick Presets Bar */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span>Customize how real-time ministerial alerts reach your devices</span>
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
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {/* Table Legend */}
          <div className="grid grid-cols-12 gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
            <div className="col-span-6 sm:col-span-6">Category & Scope</div>
            <div className="col-span-6 sm:col-span-6 grid grid-cols-4 text-center">
              <div className="flex flex-col items-center gap-0.5" title="In-App Real-Time Feeds">
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>In-App</span>
              </div>
              <div className="flex flex-col items-center gap-0.5" title="Email Broadcasts">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span>Email</span>
              </div>
              <div className="flex flex-col items-center gap-0.5" title="Web / Mobile Push">
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                <span>Push</span>
              </div>
              <div className="flex flex-col items-center gap-0.5" title="WhatsApp Business Alerts (Planned)">
                <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                <span>WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Categories Rows */}
          {primaryCategories.map(catKey => {
            const meta = CATEGORY_LABELS[catKey] || { label: catKey, description: '' };
            const pref = preferences[catKey] || { in_app: true, email: true, push: true, whatsapp: false };

            return (
              <div
                key={catKey}
                className="grid grid-cols-12 gap-2 p-3 bg-slate-50/60 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800/80 items-center hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors"
              >
                {/* Category Info */}
                <div className="col-span-6 sm:col-span-6 flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5 shadow-2xs">
                    {getCategoryIcon(catKey)}
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
                  {(['in_app', 'email', 'push', 'whatsapp'] as NotificationChannel[]).map(channel => {
                    const isChecked = pref[channel];
                    const isPlanned = channel === 'whatsapp';
                    return (
                      <button
                        key={channel}
                        onClick={() => handleToggleChannel(catKey, channel)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer focus:outline-none ring-offset-2 focus:ring-1 focus:ring-amber-500 ${
                          isChecked ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                        } ${isPlanned ? 'opacity-70' : ''}`}
                        title={isPlanned ? `WhatsApp delivery staged for next phase (Toggle: ${isChecked ? 'Queued' : 'Off'})` : `Toggle ${channel} for ${meta.label}`}
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
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Delivery engine dispatches in-app alerts instantly, with Email & Web Push active.
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
