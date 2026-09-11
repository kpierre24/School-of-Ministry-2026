import React from 'react';
import { TabType } from '../types';
import { Permission } from '../types/rbac';
import { 
  Sparkles, 
  UserCheck, 
  GraduationCap, 
  BookOpen, 
  Award, 
  BookOpenCheck, 
  Calendar, 
  Bookmark, 
  DollarSign, 
  MessageSquare, 
  FileText,
  LucideIcon
} from 'lucide-react';

import {
  DashboardPage,
  StudentsPage,
  AttendancePage,
  CoursesPage,
  ExamsPage,
  SchedulePage,
  LibraryPage,
  NotesPage,
  FinancePage,
  MessagesPage,
  ReportsPage
} from '../pages';

export interface NavigationItem {
  id: string;
  label: string;
  component: React.ComponentType<any>;
  permissions: Permission[];
  icon?: LucideIcon;
  description?: string;
  aliases?: string[];
  adminOnly?: boolean;
  adminOrTeacherOnly?: boolean;
  paymentOnly?: boolean;
  badgeAlert?: boolean;
  badgeCount?: number;
}

export interface RouteConfig {
  tab: TabType;
  label: string;
  description: string;
  allowedRoles: Array<'student' | 'teacher' | 'admin' | 'guest'>;
  badge?: string;
  iconName: string;
  Icon?: LucideIcon;
  isQuickNav?: boolean;
}

export interface NavItem {
  tab: TabType;
  label: string;
  Icon: LucideIcon;
  adminOnly?: boolean;
  adminOrTeacherOnly?: boolean;
  paymentOnly?: boolean;
  badgeAlert?: boolean;
  badgeCount?: number;
}

/**
 * Core Navigation registry mapping routes, components, and permission scopes.
 */
export const navigation: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    component: DashboardPage,
    permissions: ['students:read'],
    icon: Sparkles,
    description: 'School overview, dean message, announcements, and quick access',
    aliases: ['home'],
  },
  {
    id: 'students',
    label: 'Students',
    component: StudentsPage,
    permissions: ['students:read'],
    icon: GraduationCap,
    description: 'Student directory, individual academic profiles, transcripts, and notes',
    adminOrTeacherOnly: true,
  },
  {
    id: 'attendance',
    label: 'Attendance',
    component: AttendancePage,
    permissions: ['attendance:read'],
    icon: UserCheck,
    description: 'Class session logs, 75% policy compliance, and check-in records',
  },
  {
    id: 'courses',
    label: '6 Modules',
    component: CoursesPage,
    permissions: ['students:read'],
    icon: BookOpen,
    description: 'Curriculum syllabus, foundational modules, objectives, and teachers',
  },
  {
    id: 'exams',
    label: 'Exams & Grades',
    component: ExamsPage,
    permissions: ['grades:read'],
    icon: Award,
    description: 'Classroom quizzes, scripture tests, timed evaluations, and gradebook',
    aliases: ['grades'],
  },
  {
    id: 'schedule',
    label: 'Schedule',
    component: SchedulePage,
    permissions: ['students:read'],
    icon: Calendar,
    description: 'Term calendar, live session times, lecture dates, and holidays',
  },
  {
    id: 'library',
    label: 'Library & Media',
    component: LibraryPage,
    permissions: ['students:read'],
    icon: Bookmark,
    description: 'Study handouts, sermon recordings, PDF lesson guides, and resources',
  },
  {
    id: 'payments',
    label: 'Tuition & Fees',
    component: FinancePage,
    permissions: ['finance:read'],
    icon: DollarSign,
    description: 'Tuition statements, installment plans, receipts, and sponsorship funds',
    aliases: ['finance'],
    paymentOnly: true,
  },
  {
    id: 'messages',
    label: 'Faculty Messages',
    component: MessagesPage,
    permissions: ['students:read'],
    icon: MessageSquare,
    description: 'Direct inquiries, academic announcements, and student guidance threads',
  },
  {
    id: 'reports',
    label: 'Analytics & Reports',
    component: ReportsPage,
    permissions: ['audit:read'],
    icon: FileText,
    description: 'Cohort summary trends, at-risk flags, retention rates, and charts',
    adminOrTeacherOnly: true,
  },
  {
    id: 'notes',
    label: 'Study Notes & Bible',
    component: NotesPage,
    permissions: ['students:read'],
    icon: BookOpenCheck,
    description: 'Personal ministerial notes, King James scripture references, and journal',
  },
];

export const VALID_TABS: TabType[] = [
  'home', 
  'attendance', 
  'students', 
  'courses', 
  'exams', 
  'schedule', 
  'library', 
  'payments', 
  'messages', 
  'reports', 
  'notes'
];

export const PORTAL_ROUTES: RouteConfig[] = [
  {
    tab: 'home',
    label: 'Home',
    description: 'School overview, dean message, announcements, and quick access',
    allowedRoles: ['student', 'teacher', 'admin', 'guest'],
    iconName: 'Sparkles',
    Icon: Sparkles,
    isQuickNav: true,
  },
  {
    tab: 'attendance',
    label: 'Attendance',
    description: 'Class session logs, 75% policy compliance, and check-in records',
    allowedRoles: ['student', 'teacher', 'admin'],
    iconName: 'UserCheck',
    Icon: UserCheck,
    isQuickNav: true,
  },
  {
    tab: 'students',
    label: 'Students',
    description: 'Student directory, individual academic profiles, transcripts, and notes',
    allowedRoles: ['teacher', 'admin'],
    iconName: 'GraduationCap',
    Icon: GraduationCap,
    isQuickNav: true,
  },
  {
    tab: 'courses',
    label: '6 Modules',
    description: 'Curriculum syllabus, foundational modules, objectives, and teachers',
    allowedRoles: ['student', 'teacher', 'admin', 'guest'],
    iconName: 'BookOpen',
    Icon: BookOpen,
    isQuickNav: true,
  },
  {
    tab: 'exams',
    label: 'Exams & Quizzes',
    description: 'Classroom quizzes, scripture tests, timed evaluations, and gradebook',
    allowedRoles: ['student', 'teacher', 'admin'],
    iconName: 'Award',
    Icon: Award,
    isQuickNav: true,
  },
  {
    tab: 'schedule',
    label: 'Schedule',
    description: 'Term calendar, live session times, lecture dates, and holidays',
    allowedRoles: ['student', 'teacher', 'admin', 'guest'],
    iconName: 'Calendar',
    Icon: Calendar,
    isQuickNav: true,
  },
  {
    tab: 'library',
    label: 'Library & Media',
    description: 'Study handouts, sermon recordings, PDF lesson guides, and resources',
    allowedRoles: ['student', 'teacher', 'admin', 'guest'],
    iconName: 'Bookmark',
    Icon: Bookmark,
    isQuickNav: true,
  },
  {
    tab: 'payments',
    label: 'Tuition & Fees',
    description: 'Tuition statements, installment plans, receipts, and sponsorship funds',
    allowedRoles: ['student', 'teacher', 'admin'],
    iconName: 'DollarSign',
    Icon: DollarSign,
    isQuickNav: true,
  },
  {
    tab: 'messages',
    label: 'Faculty Messages',
    description: 'Direct inquiries, academic announcements, and student guidance threads',
    allowedRoles: ['student', 'teacher', 'admin'],
    iconName: 'MessageSquare',
    Icon: MessageSquare,
  },
  {
    tab: 'reports',
    label: 'Analytics & Reports',
    description: 'Cohort summary trends, at-risk flags, retention rates, and charts',
    allowedRoles: ['teacher', 'admin'],
    iconName: 'BarChart3',
    Icon: FileText,
  },
  {
    tab: 'notes',
    label: 'Study Notes & Bible',
    description: 'Personal ministerial notes, King James scripture references, and journal',
    allowedRoles: ['student', 'teacher', 'admin'],
    iconName: 'FileText',
    Icon: BookOpenCheck,
  },
];

export const DESKTOP_NAV_ITEMS: NavItem[] = [
  { tab: 'home', label: 'Home', Icon: Sparkles },
  { tab: 'attendance', label: 'Attendance', Icon: UserCheck },
  { tab: 'students', label: 'Students', Icon: GraduationCap, adminOnly: true },
  { tab: 'courses', label: 'Courses', Icon: BookOpen },
  { tab: 'exams', label: 'Exams', Icon: Award },
  { tab: 'notes', label: 'Notes & Bible', Icon: BookOpenCheck },
  { tab: 'schedule', label: 'Schedule', Icon: Calendar },
  { tab: 'library', label: 'Library', Icon: Bookmark },
  { tab: 'payments', label: 'Payments', Icon: DollarSign, paymentOnly: true },
  { tab: 'messages', label: 'Messages', Icon: MessageSquare },
  { tab: 'reports', label: 'Reports', Icon: FileText, adminOrTeacherOnly: true },
];

/**
 * Finds a navigation entry by ID or alias.
 */
export function getNavigationItem(idOrTab: string): NavigationItem | undefined {
  return navigation.find(
    item => item.id === idOrTab || item.aliases?.includes(idOrTab)
  );
}

/**
 * Checks if a user has access to a navigation item based on role or permissions.
 */
export function isNavigationAccessible(item: NavigationItem, role?: string, userPermissions?: Permission[]): boolean {
  if (!role) {
    return item.id === 'dashboard' || item.id === 'courses' || item.id === 'schedule' || item.id === 'library';
  }
  if (role === 'super_admin' || role === 'admin') return true;
  if (item.adminOnly && role !== 'admin') return false;
  if (item.adminOrTeacherOnly && role === 'student') return false;
  if (item.paymentOnly && role === 'teacher') return false;

  if (userPermissions && userPermissions.length > 0) {
    if (userPermissions.includes('all:access')) return true;
    return item.permissions.some(perm => userPermissions.includes(perm));
  }

  return true;
}

export function getTabFromLocation(): TabType {
  if (typeof window === 'undefined') return 'home';
  const candidate = new URLSearchParams(window.location.search).get('tab') as TabType | null;
  return candidate && VALID_TABS.includes(candidate) ? candidate : 'home';
}

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

export function filterNavItemsForUser(items: NavItem[], userRole?: string): NavItem[] {
  return items.filter(item => {
    if (item.adminOnly && userRole === 'student') return false;
    if (item.adminOrTeacherOnly && userRole === 'student') return false;
    if (item.paymentOnly && userRole === 'teacher') return false;
    return true;
  });
}
