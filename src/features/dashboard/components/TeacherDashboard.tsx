import React from 'react';
import { 
  CheckCircle, 
  FileText, 
  HelpCircle, 
  MessageSquare, 
  Users, 
  Clock, 
  ArrowRight,
  Sparkles,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { TabType } from '../../../types';
import { DashboardHeader } from './DashboardHeader';
import { QuickActions } from './QuickActions';
import { ActivityFeed } from './ActivityFeed';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { TeacherDashboardData } from '../hooks/useDashboard';

export interface TeacherDashboardProps {
  data: TeacherDashboardData;
  greetingTimeOfDay: string;
  onNavigate?: (tab: TabType) => void;
  className?: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  data,
  greetingTimeOfDay,
  onNavigate,
  className = '',
}) => {
  const quickActions = [
    {
      id: 'qa-attendance',
      label: 'Attendance',
      description: 'Take roll or record live check-ins',
      icon: <UserCheck className="h-6 w-6" />,
      onClick: () => onNavigate?.('attendance'),
      tone: 'primary' as const,
    },
    {
      id: 'qa-grade',
      label: 'Grade Assignments',
      description: 'Review submissions & post grades',
      icon: <FileText className="h-6 w-6" />,
      onClick: () => onNavigate?.('exams'),
      tone: 'accent' as const,
      badge: `${data.toReview.assignmentsCount} Due`,
    },
    {
      id: 'qa-quiz',
      label: 'Create Quiz',
      description: 'Design new assessments & tests',
      icon: <HelpCircle className="h-6 w-6" />,
      onClick: () => onNavigate?.('exams'),
      tone: 'info' as const,
    },
    {
      id: 'qa-messages',
      label: 'Message Students',
      description: 'Send announcements or email batch',
      icon: <MessageSquare className="h-6 w-6" />,
      onClick: () => onNavigate?.('messages'),
      tone: 'success' as const,
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header with greeting: Good evening, Pastor */}
      <DashboardHeader
        greeting={greetingTimeOfDay}
        userName={data.greetingName}
        role="teacher"
        cohortName={data.todaySchedule.cohortName}
      />

      {/* 2. Top Row: TODAY & TO REVIEW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* TODAY Section */}
        <Card
          variant="elevated"
          className="relative overflow-hidden border-2 border-[var(--color-primary)]/20 bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-surface)] dark:from-[#08182c] dark:to-[#040e1b] flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--color-primary)] dark:text-sky-400">
                TODAY
              </span>
              <Badge variant="success" size="sm">
                Active Session
              </Badge>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-[var(--color-text)] dark:text-slate-100 font-sans">
                {data.todaySchedule.className}
              </h3>
              <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)] dark:text-slate-400">
                <Clock className="h-4 w-4 text-[var(--color-primary)] dark:text-sky-400" />
                <span>{data.todaySchedule.time}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[var(--color-surface)] p-3.5 border border-[var(--color-border)] dark:bg-slate-900/50 dark:border-slate-800">
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Expected
                </p>
                <p className="text-xl sm:text-2xl font-black text-[var(--color-text)] dark:text-slate-100">
                  {data.todaySchedule.studentsExpected} students
                </p>
              </div>

              <div className="space-y-0.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Checked In
                </p>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {data.todaySchedule.studentsCheckedIn} checked in
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--color-border)]/60 dark:border-slate-800">
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => onNavigate?.('attendance')}
              leftIcon={<UserCheck className="h-4 w-4" />}
            >
              Take Attendance
            </Button>
          </div>
        </Card>

        {/* TO REVIEW Section */}
        <Card className="flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] dark:text-slate-400">
                TO REVIEW
              </h3>
              <Badge variant="accent" size="sm">
                Pending Actions
              </Badge>
            </div>

            <div className="space-y-3">
              {/* Assignments Item */}
              <div
                onClick={() => onNavigate?.('exams')}
                className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5 cursor-pointer hover:border-[var(--color-primary)] hover:bg-slate-50 transition-all dark:border-slate-800 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-text)] dark:text-slate-100">
                      {data.toReview.assignmentsCount} assignments
                    </h4>
                    <p className="text-xs text-[var(--color-text-muted)] dark:text-slate-400">
                      Submitted papers ready for evaluation
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />
              </div>

              {/* Quizzes Item */}
              <div
                onClick={() => onNavigate?.('exams')}
                className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5 cursor-pointer hover:border-[var(--color-primary)] hover:bg-slate-50 transition-all dark:border-slate-800 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-text)] dark:text-slate-100">
                      {data.toReview.quizzesCount} quizzes
                    </h4>
                    <p className="text-xs text-[var(--color-text-muted)] dark:text-slate-400">
                      Grading rubric & feedback required
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />
              </div>

              {/* Moderation Item */}
              <div
                onClick={() => onNavigate?.('messages')}
                className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5 cursor-pointer hover:border-[var(--color-primary)] hover:bg-slate-50 transition-all dark:border-slate-800 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-text)] dark:text-slate-100">
                      {data.toReview.moderationRequestsCount} moderation request
                    </h4>
                    <p className="text-xs text-[var(--color-text-muted)] dark:text-slate-400">
                      Student query or accommodation review
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => onNavigate?.('exams')}
            >
              Open Assessment Center
            </Button>
          </div>
        </Card>
      </div>

      {/* 3. Quick Actions */}
      <QuickActions actions={quickActions} columns={4} />

      {/* 4. Live Activity Feed */}
      <ActivityFeed title="CLASSROOM & ACADEMIC ACTIVITY" />
    </div>
  );
};
