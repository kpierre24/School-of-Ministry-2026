import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  Lock,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { GradeRecord } from '../types';
import { useGrades } from '../hooks/useGrades';
import { useGradeMutations } from '../hooks/useGradeMutations';
import { Gradebook } from './Gradebook';
import { ModerationPanel } from './ModerationPanel';
import { GradeReleasePanel } from './GradeReleasePanel';
import { GradeDetails } from './GradeDetails';
import { GradeForm } from './GradeForm';
import { fetchGradesApi } from '../services/gradesService';

interface GradesPageProps {
  initialGrades?: GradeRecord[];
  userRole?: string;
  defaultCourse?: string;
}

export const GradesPage: React.FC<GradesPageProps> = ({
  initialGrades = [],
  userRole = 'teacher',
  defaultCourse = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<'gradebook' | 'moderation' | 'release'>('gradebook');
  const [editingGrade, setEditingGrade] = useState<GradeRecord | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const mockGradesSeed: GradeRecord[] = [
    {
      id: 'gr_1',
      submissionId: 'sub_101',
      studentId: 'st_1',
      studentName: 'Daniel Vance',
      studentNumber: 'HTEIM-2026-001',
      assignmentId: 'asg_1',
      assignmentTitle: 'Hermeneutics Exegesis Paper',
      courseCode: 'MIN-101',
      score: 92,
      maxPoints: 100,
      percentage: 92,
      status: 'RELEASED',
      feedback: 'Excellent breakdown of original Greek context and ministry applications.',
      submittedAt: '2026-09-01T10:00:00Z',
    },
    {
      id: 'gr_2',
      submissionId: 'sub_102',
      studentId: 'st_2',
      studentName: 'Sarah Jenkins',
      studentNumber: 'HTEIM-2026-002',
      assignmentId: 'asg_1',
      assignmentTitle: 'Hermeneutics Exegesis Paper',
      courseCode: 'MIN-101',
      score: 88,
      maxPoints: 100,
      percentage: 88,
      status: 'MODERATION',
      feedback: 'Strong argument; ensure double check on bibliographical references.',
      submittedAt: '2026-09-02T14:30:00Z',
    },
    {
      id: 'gr_3',
      submissionId: 'sub_103',
      studentId: 'st_3',
      studentName: 'Michael Chang',
      studentNumber: 'HTEIM-2026-003',
      assignmentId: 'asg_2',
      assignmentTitle: 'Systematic Theology Exam',
      courseCode: 'THL-201',
      score: 71,
      maxPoints: 100,
      percentage: 71,
      status: 'GRADED',
      feedback: 'At-risk performance on pneumatology sections. Review chapter 4.',
      submittedAt: '2026-09-03T11:20:00Z',
    },
    {
      id: 'gr_4',
      submissionId: 'sub_104',
      studentId: 'st_4',
      studentName: 'Hannah Abbott',
      studentNumber: 'HTEIM-2026-004',
      assignmentId: 'asg_3',
      assignmentTitle: 'Homiletics Sermon Outline',
      courseCode: 'HOM-301',
      score: 96,
      maxPoints: 100,
      percentage: 96,
      status: 'LOCKED',
      feedback: 'High distinction sermon structure and delivery strategy.',
      submittedAt: '2026-08-28T09:15:00Z',
    },
    {
      id: 'gr_5',
      submissionId: 'sub_105',
      studentId: 'st_5',
      studentName: 'Ephraim Taylor',
      studentNumber: 'HTEIM-2026-005',
      assignmentId: 'asg_1',
      assignmentTitle: 'Hermeneutics Exegesis Paper',
      courseCode: 'MIN-101',
      score: 79,
      maxPoints: 100,
      percentage: 79,
      status: 'SUBMITTED',
      feedback: '',
      submittedAt: '2026-09-05T16:00:00Z',
    },
  ];

  const seed = initialGrades.length > 0 ? initialGrades : mockGradesSeed;

  const {
    grades,
    setGrades,
    filteredGrades,
    stats,
    selectedGrade,
    setSelectedGradeId,
    searchQuery,
    setSearchQuery,
    selectedCourse,
    setSelectedCourse,
    selectedStatus,
    setSelectedStatus,
  } = useGrades({
    initialGrades: seed,
    defaultCourse,
  });

  const { recordGrade, transitionStage, overrideGrade, isLoading, error } = useGradeMutations({
    setGrades,
  });

  const handleRefreshFromApi = async () => {
    setIsFetching(true);
    try {
      const apiRecords = await fetchGradesApi();
      if (apiRecords && apiRecords.length > 0) {
        setGrades(apiRecords);
      }
    } catch (e) {
      console.warn('Grade API refresh notice:', e);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    handleRefreshFromApi();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Academic Gradebook & Standing</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authoritative grade tracking, faculty moderation lifecycle, and transcript releases for HTEIM School of Ministry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshFromApi}
            disabled={isFetching}
            className="p-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Sync Latest Server Grades"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Grades
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {stats.totalGrades}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Recorded submissions</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Average Score
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {stats.averagePercentage}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Overall cohort average</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Honor Roll (&ge;85%)
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats.honorRollCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">High distinction standing</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Satisfactory (&ge;75%)
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.satisfactoryCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Meeting standard</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs col-span-2 lg:col-span-1">
          <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            At-Risk (&lt;75%)
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {stats.atRiskCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Academic warning level</div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('gradebook')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'gradebook'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Full Gradebook ({filteredGrades.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'moderation'
              ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Faculty Moderation Queue ({stats.gradedCount + stats.moderationCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('release')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'release'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Release & Publication Center</span>
        </button>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'gradebook' && (
        <Gradebook
          grades={filteredGrades}
          onSelectGrade={(g) => setSelectedGradeId(g.id || g.submissionId)}
          onEditGrade={(g) => setEditingGrade(g)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCourse={selectedCourse}
          onCourseChange={setSelectedCourse}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'moderation' && (
        <ModerationPanel
          grades={grades}
          onSelectGrade={(g) => setSelectedGradeId(g.id || g.submissionId)}
          onTransitionStage={async (submissionId, targetStage, reason) => {
            await transitionStage({ submissionId, targetStatus: targetStage, reason });
          }}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'release' && (
        <GradeReleasePanel
          grades={grades}
          onTransitionStage={async (submissionId, targetStage, reason) => {
            await transitionStage({ submissionId, targetStatus: targetStage, reason });
          }}
          isLoading={isLoading}
        />
      )}

      {/* Detail Modal */}
      {selectedGrade && (
        <GradeDetails
          grade={selectedGrade}
          onClose={() => setSelectedGradeId(null)}
          onEdit={(g) => {
            setSelectedGradeId(null);
            setEditingGrade(g);
          }}
          onTransitionStage={async (submissionId, targetStage, reason) => {
            await transitionStage({ submissionId, targetStatus: targetStage, reason }, selectedGrade);
          }}
          isLoading={isLoading}
        />
      )}

      {/* Grade / Form Edit Modal */}
      {editingGrade && (
        <GradeForm
          grade={editingGrade}
          onSave={async (input) => {
            if (editingGrade.status === 'LOCKED') {
              await overrideGrade(
                {
                  submissionId: input.submissionId,
                  score: input.score,
                  feedback: input.feedback,
                  reason: input.overrideReason || 'Administrative override',
                },
                editingGrade
              );
            } else {
              await recordGrade(input, editingGrade);
            }
          }}
          onClose={() => setEditingGrade(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
