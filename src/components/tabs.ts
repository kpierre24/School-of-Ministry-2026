import React from 'react';

export const LazyHomeTab = React.lazy(() => import('./HomeTab').then(m => ({ default: m.HomeTab })));
export const LazyStudentsTab = React.lazy(() => import('./StudentsTab').then(m => ({ default: m.StudentsTab })));
export const LazyCoursesTab = React.lazy(() => import('./CoursesTab').then(m => ({ default: m.CoursesTab })));
export const LazyExamsTab = React.lazy(() => import('./ExamsTab').then(m => ({ default: m.ExamsTab })));
export const LazyScheduleTab = React.lazy(() => import('./ScheduleTab').then(m => ({ default: m.ScheduleTab })));
export const LazyLibraryTab = React.lazy(() => import('../features/library/components/LibraryTab').then(m => ({ default: m.LibraryTab })));
export const LazyPaymentTab = React.lazy(() => import('./PaymentTab').then(m => ({ default: m.PaymentTab })));
export const LazyMessagesTab = React.lazy(() => import('./MessagesTab').then(m => ({ default: m.MessagesTab })));
export const LazyReportsTab = React.lazy(() => import('./ReportsTab').then(m => ({ default: m.ReportsTab })));
export const LazyNotesTab = React.lazy(() => import('./StudentNotesBibleTab').then(m => ({ default: m.StudentNotesBibleTab })));
export const LazyAttendanceTab = React.lazy(() => import('../features/attendance/AttendanceWorkspace').then(m => ({ default: m.AttendanceWorkspace })));
