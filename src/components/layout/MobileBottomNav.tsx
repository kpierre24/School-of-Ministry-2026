import React from 'react';
import { Sparkles, UserCheck, BookOpen, DollarSign, GraduationCap, Award, Bookmark, Calendar, Menu } from 'lucide-react';

export type TabType = 'home' | 'attendance' | 'students' | 'courses' | 'exams' | 'schedule' | 'library' | 'payments' | 'messages' | 'reports' | 'notes';

export interface MobileBottomNavProps {
  appUser: any;
  activeErpTab: TabType;
  handleNavigate: (tab: TabType) => void;
  showMobileMoreMenu: boolean;
  setShowMobileMoreMenu: (show: boolean) => void;
  unreadMessagesCount: number;
}

export function MobileBottomNav({
  appUser,
  activeErpTab,
  handleNavigate,
  showMobileMoreMenu,
  setShowMobileMoreMenu,
  unreadMessagesCount,
}: MobileBottomNavProps) {
  const navItems = appUser ? (
    appUser.role === 'student' ? [
      { tab: 'home', Icon: Sparkles, label: 'Home' },
      { tab: 'attendance', Icon: UserCheck, label: 'Attendance' },
      { tab: 'courses', Icon: BookOpen, label: 'Courses' },
      { tab: 'payments', Icon: DollarSign, label: 'Tuition' },
    ] : [
      { tab: 'home', Icon: Sparkles, label: 'Home' },
      { tab: 'attendance', Icon: UserCheck, label: 'Attendance' },
      { tab: 'students', Icon: GraduationCap, label: 'Students' },
      { tab: 'exams', Icon: Award, label: 'Exams' },
    ]
  ) : [
    { tab: 'home', Icon: Sparkles, label: 'Home' },
    { tab: 'courses', Icon: BookOpen, label: '6 Modules' },
    { tab: 'library', Icon: Bookmark, label: 'Media' },
    { tab: 'schedule', Icon: Calendar, label: 'Schedule' },
  ];

  return (
    <nav 
      aria-label="Mobile bottom navigation" 
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-[#08182c]/95 border-t border-slate-200/90 dark:border-[#1a385c] backdrop-blur-xl shadow-xl flex flex-row flex-nowrap items-center justify-around px-1 py-1 w-full min-h-[56px] pb-[max(0.375rem,env(safe-area-inset-bottom,0.375rem))] overflow-hidden"
    >
      {navItems.map(({ tab, Icon, label }: any) => {
        const isActive = activeErpTab === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => handleNavigate(tab as TabType)}
            aria-label={`Open ${label}`}
            aria-current={isActive ? 'page' : undefined}
            className={`flex-1 shrink-0 max-w-[20%] min-h-[44px] py-1 px-0.5 flex flex-col items-center justify-center gap-0.5 cursor-pointer rounded-xl transition-all active:opacity-80 touch-min-44 ${
              isActive
                ? 'bg-slate-100 dark:bg-[#0e2540] text-[#023264] dark:text-white font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-[#025798] dark:text-[#7dd3fc]' : 'text-slate-400 dark:text-slate-500'}`} />
            </div>
            <span className={`text-[10px] tracking-tight truncate max-w-full ${
              isActive ? 'text-[#023264] dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}>
              {label}
            </span>
          </button>
        );
      })}

      {/* More / Menu button */}
      <button
        type="button"
        onClick={() => setShowMobileMoreMenu(true)}
        aria-label="Open more portal sections"
        className={`relative flex-1 shrink-0 max-w-[20%] min-h-[44px] py-1 px-0.5 flex flex-col items-center justify-center gap-0.5 cursor-pointer rounded-xl transition-all active:opacity-80 touch-min-44 ${
          showMobileMoreMenu
            ? 'bg-slate-100 dark:bg-[#0e2540] text-[#023264] dark:text-white font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div className="relative">
          <Menu className={`w-5 h-5 transition-transform ${
            showMobileMoreMenu ? 'scale-110 text-[#025798] dark:text-[#7dd3fc]' : 'text-slate-400 dark:text-slate-500'
          }`} />
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-1 -right-1.5 min-w-3.5 h-3.5 rounded-full bg-[#b38f53] text-white font-bold text-[8px] flex items-center justify-center px-0.5">
              {unreadMessagesCount}
            </span>
          )}
        </div>
        <span className={`text-[10px] tracking-tight ${
          showMobileMoreMenu ? 'text-[#023264] dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'
        }`}>
          {appUser ? 'More' : 'Menu'}
        </span>
      </button>
    </nav>
  );
}

export default MobileBottomNav;
