import React, { useState } from 'react';
import { Search, Trophy, AlertTriangle, Download, ArrowRight, User } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { MobileAssessmentCard } from '../shared/MobileAssessmentCard';
import { StudentSummary } from '../../../types';

export interface GradebookProps {
  students: StudentSummary[];
  onSelectStudent?: (student: StudentSummary) => void;
  className?: string;
}

export const Gradebook: React.FC<GradebookProps> = ({
  students = [],
  onSelectStudent,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter((s) =>
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Overview Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student grade records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:outline-hidden dark:bg-slate-900 dark:border-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)]">
          <span>{filteredStudents.length} Students in Cohort</span>
        </div>
      </div>

      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {filteredStudents.map((student, idx) => {
          const avgScore = student.avgScore !== null && student.avgScore !== undefined ? Math.round(student.avgScore) : null;
          const status = avgScore !== null && avgScore >= 75 ? 'graded' : 'pending';

          return (
            <MobileAssessmentCard
              key={student.id ? `${student.id}-${idx}` : `std-card-${idx}`}
              studentName={student.name}
              courseTitle="Class of 2026 • Ministry Core"
              score={avgScore}
              status={status}
              onView={() => onSelectStudent?.(student)}
              actionLabel="View Record"
            />
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-slate-50 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] dark:bg-slate-800/60 dark:border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Student Name</th>
              <th className="px-5 py-3.5">Attendance</th>
              <th className="px-5 py-3.5">Standing</th>
              <th className="px-5 py-3.5">Average Score</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]/60 dark:divide-slate-800/60">
            {filteredStudents.map((student, idx) => {
              const avgScore = student.avgScore !== null && student.avgScore !== undefined ? Math.round(student.avgScore) : null;
              const isHonor = avgScore !== null && avgScore >= 85;
              const isPassing = avgScore !== null && avgScore >= 75;

              return (
                <tr
                  key={student.id ? `${student.id}-${idx}` : `std-row-${idx}`}
                  className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/40"
                >
                  <td className="px-5 py-4 font-bold text-[var(--color-text)] dark:text-slate-100">
                    {student.name}
                  </td>
                  <td className="px-5 py-4 text-xs font-medium">
                    <span className={student.rate < 75 ? 'text-rose-600 font-bold' : 'text-slate-600 dark:text-slate-300'}>
                      {student.rate}%
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {isHonor ? (
                      <Badge variant="accent" size="sm">
                        High Distinction
                      </Badge>
                    ) : isPassing ? (
                      <Badge variant="success" size="sm">
                        Satisfactory
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm">
                        At-Risk (&lt;75%)
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-4 font-black text-sm">
                    {avgScore !== null ? (
                      <span className={avgScore >= 85 ? 'text-amber-600' : 'text-emerald-600'}>
                        {avgScore}%
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectStudent?.(student)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
