import React from 'react';
import { Users, AlertTriangle, Trophy, Calendar, BookOpen, DollarSign } from 'lucide-react';
import { StatCard } from './StatCard';
import { AttendanceSummary } from './AttendanceSummary';
import { GradeSummary } from './GradeSummary';
import { UpcomingEvents } from './UpcomingEvents';
import { useDashboard } from '../hooks/useDashboard';
import { StudentSummary, ClassDay, CustomAssignment, TabType } from '../../../types';
import { AppUser } from '../../../lib/userAuth';

export interface DashboardProps {
  appUser: AppUser | null;
  students?: StudentSummary[];
  classDays?: ClassDay[];
  assignments?: CustomAssignment[];
  onNavigate?: (tab: TabType) => void;
  className?: string;
}

export function Dashboard({
  appUser,
  students = [],
  classDays = [],
  assignments = [],
  onNavigate,
  className = '',
}: DashboardProps) {
  const { metrics, atRiskStudents, honorRollStudents } = useDashboard({
    students,
    classDays,
    assignments,
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Stat Overview Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Enrolled"
          value={metrics.totalStudents}
          subtitle="Active Ministry Students"
          icon={Users}
          badgeText="Active Roster"
          badgeVariant="info"
          onClick={() => onNavigate?.('students')}
        />
        <StatCard
          title="Attendance Rate"
          value={`${metrics.averageAttendanceRate}%`}
          subtitle="Cohort Average"
          icon={Calendar}
          badgeText={metrics.averageAttendanceRate >= 75 ? 'Satisfactory (≥75%)' : 'Needs Attention'}
          badgeVariant={metrics.averageAttendanceRate >= 75 ? 'success' : 'warning'}
          onClick={() => onNavigate?.('attendance')}
        />
        <StatCard
          title="At-Risk Alerts"
          value={metrics.atRiskStudentsCount}
          subtitle="Attendance < 75%"
          icon={AlertTriangle}
          badgeText={metrics.atRiskStudentsCount === 0 ? 'Optimal' : 'Action Required'}
          badgeVariant={metrics.atRiskStudentsCount === 0 ? 'success' : 'danger'}
          onClick={() => onNavigate?.('students')}
        />
        <StatCard
          title="Honor Roll"
          value={metrics.honorRollCount}
          subtitle="High Distinction (≥85%)"
          icon={Trophy}
          badgeText={`${metrics.honorRollCount} Scholars`}
          badgeVariant="success"
          onClick={() => onNavigate?.('students')}
        />
      </div>

      {/* Feature Deep Dive Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AttendanceSummary
          averageAttendanceRate={metrics.averageAttendanceRate}
          atRiskCount={metrics.atRiskStudentsCount}
          onViewAtRisk={() => onNavigate?.('students')}
        />
        <GradeSummary
          averageGradeScore={metrics.averageGradeScore}
          honorRollCount={metrics.honorRollCount}
          onViewHonorRoll={() => onNavigate?.('students')}
        />
        <UpcomingEvents
          classDays={classDays}
          onNavigateToSchedule={() => onNavigate?.('schedule')}
        />
      </div>
    </div>
  );
}
