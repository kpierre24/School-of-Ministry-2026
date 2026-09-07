import { TabType } from '../types';

export interface RouteConfig {
  tab: TabType;
  label: string;
  description: string;
  allowedRoles: Array<'student' | 'teacher' | 'admin' | 'guest'>;
  badge?: string;
  iconName: string;
  isQuickNav?: boolean;
}

export const PORTAL_ROUTES: RouteConfig[] = [
  {
    tab: 'home',
    label: 'Home',
    description: 'School overview, dean message, announcements, and quick access',
    allowedRoles: ['student', 'teacher', 'admin', 'guest'],
    iconName: 'Sparkles',
    isQuickNav: true,
  },
  {
    tab: 'attendance',
    label: 'Attendance',
    description: 'Class session logs, 75% policy compliance, and check-in records',
    allowedRoles: ['student', 'teacher', 'admin'],
    iconName: 'UserCheck',
    isQuickNav: true,
  },
  {
    tab: 'students',
    label: 'Students',
    description: 'Student directory, individual academic profiles, transcripts, and notes',
    allowedRoles: ['teacher', 'admin'],
    iconName: 'GraduationCap',
    isQuickNav: true,
  },
  {
    tab: 'courses',
    label: '6 Modules',
    description: 'Curriculum syllabus, foundational modules, objectives, and teachers',
    allowedRoles: ['student', 'teacher', 'admin', 'guest'],
    iconName: 'BookOpen',
    isQuickNav: true,
  },
  {
    tab: 'exams',
    label: 'Exams & Quizzes',
    description: 'Classroom quizzes, scripture tests, timed evaluations, and gradebook',
    allowedRoles: ['student', 'teacher', 'admin'],
    iconName: 'Award',
    isQuickNav: true,
  },
  {
    tab: 'schedule',
    label: 'Schedule',
    description: 'Term calendar, live session times, lecture dates, and holidays',
    allowedRoles: ['student', 'teacher', 'admin', 'guest'],
    iconName: 'Calendar',
    isQuickNav: true,
  },
  {
    tab: 'library',
    label: 'Library & Media',
    description: 'Study handouts, sermon recordings, PDF lesson guides, and resources',
    allowedRoles: ['student', 'teacher', 'admin', 'guest'],
    iconName: 'Bookmark',
    isQuickNav: true,
  },
  {
    tab: 'payments',
    label: 'Tuition & Fees',
    description: 'Tuition statements, installment plans, receipts, and sponsorship funds',
    allowedRoles: ['student', 'teacher', 'admin'],
    iconName: 'DollarSign',
    isQuickNav: true,
  },
  {
    tab: 'messages',
    label: 'Faculty Messages',
    description: 'Direct inquiries, academic announcements, and student guidance threads',
    allowedRoles: ['student', 'teacher', 'admin'],
    iconName: 'MessageSquare',
  },
  {
    tab: 'reports',
    label: 'Analytics & Reports',
    description: 'Cohort summary trends, at-risk flags, retention rates, and charts',
    allowedRoles: ['teacher', 'admin'],
    iconName: 'BarChart3',
  },
  {
    tab: 'notes',
    label: 'Study Notes & Bible',
    description: 'Personal ministerial notes, King James scripture references, and journal',
    allowedRoles: ['student', 'teacher', 'admin'],
    iconName: 'FileText',
  },
];

export function isRouteAccessible(tab: TabType, role?: string): boolean {
  const route = PORTAL_ROUTES.find(r => r.tab === tab);
  if (!route) return false;
  if (!role) {
    return route.allowedRoles.includes('guest');
  }
  return route.allowedRoles.includes(role as 'student' | 'teacher' | 'admin');
}

export function getDefaultRouteForRole(role?: string): TabType {
  if (role === 'student') return 'home';
  if (role === 'teacher' || role === 'admin') return 'attendance';
  return 'home';
}

export function getNavRoutesForRole(role?: string): RouteConfig[] {
  return PORTAL_ROUTES.filter(r => isRouteAccessible(r.tab, role));
}
