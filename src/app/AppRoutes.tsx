import React, { Suspense, lazy } from 'react';
import { TabType } from '../types';
import { isRouteAccessible } from './routes';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ShieldAlert } from 'lucide-react';

// Lazy-loaded Feature Pages
const PaymentsPage = lazy(() => import('../features/payments/PaymentsPage'));
const AttendancePage = lazy(() => import('../features/attendance/AttendancePage'));
const StudentsPage = lazy(() => import('../features/students/StudentsPage'));
const CoursesPage = lazy(() => import('../features/academics/CoursesPage'));
const ExamsPage = lazy(() => import('../features/assignments/ExamsPage'));
const SchedulePage = lazy(() => import('../features/schedule/SchedulePage'));
const HomePage = lazy(() => import('../features/home/HomePage'));
const LibraryPage = lazy(() => import('../features/library/LibraryPage'));
const MessagesPage = lazy(() => import('../features/messages/MessagesPage'));
const ReportsPage = lazy(() => import('../features/reports/ReportsPage'));
const NotesPage = lazy(() => import('../features/notes/NotesPage'));

export interface AppRoutesProps {
  currentTab: TabType;
  userRole?: string;
  onNavigate: (tab: TabType) => void;
  // Feature Props
  attendanceProps?: any;
  studentsProps?: any;
  paymentsProps?: any;
  homeProps?: any;
  coursesProps?: any;
  examsProps?: any;
  scheduleProps?: any;
  libraryProps?: any;
  messagesProps?: any;
  reportsProps?: any;
  notesProps?: any;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
  currentTab,
  userRole = 'guest',
  onNavigate,
  attendanceProps,
  studentsProps,
  paymentsProps,
  homeProps,
  coursesProps,
  examsProps,
  scheduleProps,
  libraryProps,
  messagesProps,
  reportsProps,
  notesProps
}) => {
  // Permission Guard
  const hasAccess = isRouteAccessible(currentTab, userRole);

  if (!hasAccess) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Restricted Access</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            The <span className="font-bold text-amber-600 dark:text-amber-400 capitalize">{currentTab}</span> module requires faculty or administrator authorization.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
          >
            Return to School Portal Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-[500px] flex flex-col items-center justify-center gap-3 p-8 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-xs font-bold tracking-wide uppercase">Loading module...</span>
        </div>
      }
    >
      <motion.div
        key={currentTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        {currentTab === 'home' && <HomePage {...homeProps} />}
        {currentTab === 'attendance' && <AttendancePage {...attendanceProps} />}
        {currentTab === 'students' && <StudentsPage {...studentsProps} />}
        {currentTab === 'payments' && <PaymentsPage {...paymentsProps} />}
        {currentTab === 'courses' && <CoursesPage {...coursesProps} />}
        {currentTab === 'exams' && <ExamsPage {...examsProps} />}
        {currentTab === 'schedule' && <SchedulePage {...scheduleProps} />}
        {currentTab === 'library' && <LibraryPage {...libraryProps} />}
        {currentTab === 'messages' && <MessagesPage {...messagesProps} />}
        {currentTab === 'reports' && <ReportsPage {...reportsProps} />}
        {currentTab === 'notes' && <NotesPage {...notesProps} />}
      </motion.div>
    </Suspense>
  );
};

export default AppRoutes;
