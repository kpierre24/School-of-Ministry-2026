import React, { useRef, useEffect, useState } from 'react';
import { LogoImage } from './LogoImage';
import { PWAInstallButton } from './PWAInstallButton';
import { NotificationCenter } from './NotificationCenter';
import {
  GraduationCap,
  ChevronDown,
  MessageSquare,
  MoreHorizontal,
  Sparkles,
  Play,
  Search,
  Cloud,
  RefreshCw,
  Radio,
  ShieldCheck,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Lock,
  Menu,
} from 'lucide-react';
import { AppUser } from '../lib/userAuth';
import { TabType, AppNotification, Cohort } from '../types';

export interface AppHeaderProps {
  activeCohort: Cohort | null;
  onOpenCohortModal: () => void;
  onGoHome: () => void;
  appUser: AppUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onNavigate: (tab: TabType) => void;
  unreadMessagesCount: number;
  filteredNotifications: AppNotification[];
  onMarkNotifAsRead: (id: string) => void;
  onMarkAllNotifsAsRead: () => void;
  onClearNotifs: () => void;
  onSelectNotif: (notif: AppNotification) => void;
  onTriggerNotifScan: () => void;
  onAddTestNotif: (notif: AppNotification) => void;
  onOpenIntro: () => void;
  onOpenPresentation: () => void;
  onOpenCommandPalette: () => void;
  onOpenRoleSwitch: () => void;
  isCloudSyncing: boolean;
  onPushToCloud: () => void;
  dataSource: string;
  isLoading: boolean;
  onLoadSheets: (e?: React.FormEvent, customUrl?: string) => void;
  onOpenBroadcast: () => void;
  onOpenAuditLog: () => void;
  onOpenUserManagement: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onToggleMobileDrawer: () => void;
  onOpenOfflineDrawer?: () => void;
  onOpenPINCheckin?: () => void;
}

const ROLE_COLORS: Record<string, { avatar: string; label: string; dot: string }> = {
  super_admin: {
    avatar: 'bg-purple-700 text-white dark:bg-purple-950 dark:text-purple-200',
    label: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-600',
  },
  admin: {
    avatar: 'bg-[#023264] text-white dark:bg-[#dceaf8] dark:text-[#023264]',
    label: 'text-[#025798] dark:text-[#7dd3fc]',
    dot: 'bg-[#025798]',
  },
  registrar: {
    avatar: 'bg-blue-600 text-white dark:bg-blue-950 dark:text-blue-200',
    label: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  lecturer: {
    avatar: 'bg-[#01883c] text-white dark:bg-[#d1fae5] dark:text-[#01883c]',
    label: 'text-[#01883c] dark:text-[#4ade80]',
    dot: 'bg-[#01883c]',
  },
  teacher: {
    avatar: 'bg-[#01883c] text-white dark:bg-[#d1fae5] dark:text-[#01883c]',
    label: 'text-[#01883c] dark:text-[#4ade80]',
    dot: 'bg-[#01883c]',
  },
  student: {
    avatar: 'bg-[#b38f53] text-white dark:bg-[#fef3c7] dark:text-[#8c6a32]',
    label: 'text-[#b38f53] dark:text-[#dfc18b]',
    dot: 'bg-[#b38f53]',
  },
  finance_officer: {
    avatar: 'bg-emerald-700 text-white dark:bg-emerald-950 dark:text-emerald-200',
    label: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-600',
  },
  librarian: {
    avatar: 'bg-amber-600 text-white dark:bg-amber-950 dark:text-amber-200',
    label: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  viewer: {
    avatar: 'bg-slate-600 text-white dark:bg-slate-800 dark:text-slate-300',
    label: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-500',
  },
};

export function AppHeader({
  activeCohort, onOpenCohortModal, onGoHome,
  appUser, onOpenLogin, onLogout,
  onNavigate,
  unreadMessagesCount,
  filteredNotifications, onMarkNotifAsRead, onMarkAllNotifsAsRead,
  onClearNotifs, onSelectNotif, onTriggerNotifScan, onAddTestNotif,
  onOpenIntro, onOpenPresentation, onOpenCommandPalette, onOpenRoleSwitch,
  isCloudSyncing, onPushToCloud, dataSource, isLoading, onLoadSheets,
  onOpenBroadcast, onOpenAuditLog, onOpenUserManagement, onOpenSettings, onOpenHelp,
  onToggleMobileDrawer, onOpenOfflineDrawer, onOpenPINCheckin,
}: AppHeaderProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMoreMenu) return;
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMoreMenu]);

  useEffect(() => {
    if (!showMoreMenu) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowMoreMenu(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showMoreMenu]);

  const rc = appUser ? (ROLE_COLORS[appUser.role] ?? ROLE_COLORS.student) : null;

  return (
    <header className="relative bg-white/85 dark:bg-[#08182c]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-[#1a385c] px-3 sm:px-4 py-2 sm:py-2.5 shadow-xs mb-3 flex-shrink-0 sticky top-2 z-40 max-w-full overflow-visible transition-all rounded-xl">
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-[#023264]/0 via-[#025798]/60 via-[#b38f53]/70 to-[#0277b8]/0 pointer-events-none" />
      <div className="flex items-center justify-between gap-2 sm:gap-3 flex-nowrap">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 shrink group" onClick={onGoHome}>
          <LogoImage alt="HTEIM Logo" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl object-contain bg-transparent p-0 group-hover:opacity-80 transition-opacity" />
          <div className="min-w-0 shrink flex items-center gap-1.5 sm:gap-2">
            <h1 className="font-display text-xs sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
              <span className="hidden sm:inline">HTEIM School of Ministry</span>
              <span className="sm:hidden">HTEIM</span>
            </h1>
            {appUser && (appUser.role === 'admin' || appUser.role === 'teacher') ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onOpenCohortModal(); }}
                className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/90 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all cursor-pointer shadow-2xs shrink-0"
                title={appUser.role === 'admin' ? "Click to manage academic cohorts" : "Click to switch academic cohort view"}
              >
                <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="hidden xs:inline">{activeCohort?.name || 'Class of 2026'}</span>
                <span className="xs:hidden">{activeCohort?.name ? activeCohort.name.replace('Class of ', "'") : "'26"}</span>
                <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-70 shrink-0" />
              </button>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs shrink-0 cursor-default"
                title={`Enrolled cohort: ${activeCohort?.name || 'Class of 2026'}`}
              >
                <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <span className="hidden xs:inline">{activeCohort?.name || 'Class of 2026'}</span>
                <span className="xs:hidden">{activeCohort?.name ? activeCohort.name.replace('Class of ', "'") : "'26"}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 ml-auto shrink-0 flex-nowrap justify-end">
          <div className="hidden sm:block"><PWAInstallButton /></div>
          {appUser && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('messages')}
                aria-label="Open messages"
                className="relative p-2 rounded-lg transition-colors cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                title="Messages"
              >
                <MessageSquare className="w-4 h-4" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center px-1">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
              <NotificationCenter
                notifications={filteredNotifications}
                onMarkAsRead={onMarkNotifAsRead}
                onMarkAllAsRead={onMarkAllNotifsAsRead}
                onClearNotifications={onClearNotifs}
                onSelectNotification={onSelectNotif}
                onTriggerScan={onTriggerNotifScan}
                onAddTestNotification={onAddTestNotif}
                currentRole={appUser?.role}
                currentStudentName={appUser?.studentName || appUser?.name}
              />
            </>
          )}

          <div className="relative shrink-0" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu(prev => !prev)}
              className="p-2 rounded-lg transition-colors cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
              aria-label="More actions"
              aria-expanded={showMoreMenu}
              aria-haspopup="true"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 z-40 space-y-0.5" style={{ boxShadow: 'var(--md-elev-2)' }}>
                <div className="space-y-0.5">
                  <button onClick={() => { setShowMoreMenu(false); onOpenIntro(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /><span>Play Intro (6s)</span>
                  </button>
                  <button onClick={() => { setShowMoreMenu(false); onOpenPresentation(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <Play className="w-3.5 h-3.5 text-slate-500" /><span>30s Demo</span>
                  </button>
                  <button onClick={() => { setShowMoreMenu(false); onOpenCommandPalette(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <Search className="w-3.5 h-3.5 text-slate-500" /><span>Search</span>
                    <span className="ml-auto text-[10px] text-slate-400 font-mono">⌘K</span>
                  </button>
                </div>
                {appUser?.role === 'admin' && (
                  <div className="space-y-0.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 pt-1">Tools</p>
                    <button onClick={() => { setShowMoreMenu(false); onPushToCloud(); }} disabled={isCloudSyncing} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed">
                      {isCloudSyncing ? <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin" /> : <Cloud className="w-3.5 h-3.5 text-slate-500" />}
                      <span>Cloud Backup</span>
                    </button>
                    {dataSource === 'sheets' && (
                      <button onClick={() => { setShowMoreMenu(false); onLoadSheets(); }} disabled={isLoading} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed">
                        <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} /><span>Sync Sheets</span>
                      </button>
                    )}
                    <button onClick={() => { setShowMoreMenu(false); onOpenBroadcast(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <Radio className="w-3.5 h-3.5 text-slate-500" /><span>Broadcast</span>
                    </button>
                    <button onClick={() => { setShowMoreMenu(false); onOpenAuditLog(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /><span>Audit Log</span>
                    </button>
                    <button onClick={() => { setShowMoreMenu(false); onOpenUserManagement(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <Users className="w-3.5 h-3.5 text-slate-500" /><span>Manage Users</span>
                    </button>
                    {onOpenPINCheckin && (
                      <button onClick={() => { setShowMoreMenu(false); onOpenPINCheckin(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /><span>Live QR & PIN Check-in</span>
                      </button>
                    )}
                    {onOpenOfflineDrawer && (
                      <button onClick={() => { setShowMoreMenu(false); onOpenOfflineDrawer(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-500" /><span>Offline Sync Drawer</span>
                      </button>
                    )}
                  </div>
                )}
                <div className="space-y-0.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  {appUser?.role === 'admin' ? (
                    <button onClick={() => { setShowMoreMenu(false); onOpenSettings(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <Settings className="w-3.5 h-3.5 text-slate-500" /><span>Settings</span>
                    </button>
                  ) : (
                    <button disabled className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60" title="Settings can only be changed by Administrator">
                      <div className="flex items-center gap-2.5"><Settings className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" /><span>Settings</span></div>
                      <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">Admin Only</span>
                    </button>
                  )}
                  <button onClick={() => { setShowMoreMenu(false); onOpenHelp(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" /><span>Help</span>
                  </button>
                </div>
                <div className="space-y-0.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => { setShowMoreMenu(false); onOpenRoleSwitch(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-slate-500" /><span>Switch Role</span>
                  </button>
                  {appUser && (
                    <button onClick={() => { setShowMoreMenu(false); onLogout(); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                      <LogOut className="w-3.5 h-3.5" /><span>Logout</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {appUser ? (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 sm:gap-2 p-1 pr-2 sm:pr-2.5 rounded-full transition-all cursor-pointer shrink-0 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0e2540] border border-slate-200/80 dark:border-[#1a385c]"
              aria-label={`Account: ${appUser.name}`}
              title="Account & Role Settings"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ${rc?.avatar ?? ''}`}>
                {appUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-none pr-0.5">
                <span className="text-xs font-bold truncate max-w-[100px]">{appUser.name.split(' ')[0]}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${rc?.label ?? 'text-slate-400'}`}>{appUser.role}</span>
              </div>
              <span className={`sm:hidden w-2 h-2 rounded-full shrink-0 ${rc?.dot ?? 'bg-slate-400'}`} aria-hidden="true" />
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 bg-[#023264] hover:bg-[#025798] text-white font-bold text-xs shadow-xs whitespace-nowrap border border-[#b38f53]/30"
              aria-label="Sign In to Portal"
              title="Sign in to Student or Faculty Portal"
            >
              <Lock className="w-3.5 h-3.5 shrink-0 text-[#dfc18b]" /><span>Sign In</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleMobileDrawer}
            aria-label="Toggle navigation drawer"
            title="Open Navigation Menu"
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden shrink-0 cursor-pointer transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
        </div>
      </div>
    </header>
  );
}
