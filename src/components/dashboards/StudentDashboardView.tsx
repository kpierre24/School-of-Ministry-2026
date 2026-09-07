import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Calendar, 
  Award, 
  UserCheck, 
  DollarSign, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  ArrowRight, 
  FileText, 
  Play, 
  Video, 
  Sparkles, 
  Clock, 
  CreditCard, 
  Download, 
  ExternalLink,
  HelpCircle,
  ShieldCheck,
  Check
} from 'lucide-react';
import { 
  StudentSummary, 
  PaymentRecord, 
  ClassDay, 
  CustomAssignment, 
  AssignmentSubmission, 
  TabType 
} from '../../types';
import { AppUser } from '../../lib/userAuth';

interface StudentDashboardViewProps {
  appUser: AppUser | null;
  studentData: StudentSummary | null;
  paymentRecord: PaymentRecord | null;
  classDays: ClassDay[];
  customAssignments: CustomAssignment[];
  submissions: AssignmentSubmission[];
  onNavigate: (tab: TabType) => void;
  onTakeQuiz?: (quiz: any) => void;
  atRiskThreshold: number;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  appUser,
  studentData,
  paymentRecord,
  classDays = [],
  customAssignments = [],
  submissions = [],
  onNavigate,
  onTakeQuiz,
  atRiskThreshold = 75
}) => {
  const studentName = appUser?.name || studentData?.name || 'Enrolled Ministry Student';
  
  // 1. Attendance Metrics
  const attendanceRate = studentData?.rate ?? 92.8;
  const attendedCount = studentData?.attended ?? 13;
  const totalDays = studentData?.totalDays ?? (classDays.length || 14);
  const isHonorRoll = attendanceRate >= 85;
  const isAtRisk = attendanceRate < atRiskThreshold;

  // Safe absence calculation: how many more classes can they miss while staying >= 75%?
  // (attended / (totalDays + remainingMisses)) >= 0.75  => attended / 0.75 - totalDays
  const safeAbsenceMargin = Math.max(0, Math.floor(attendedCount / (atRiskThreshold / 100) - totalDays));

  // 2. Academic / Grade Metrics
  const avgGrade = studentData?.avgScore ?? 88.5;
  const gradeLabel = avgGrade >= 85 ? 'High Distinction / Honor Roll' : avgGrade >= 75 ? 'Satisfactory Standing' : 'Academic Review Needed';

  // 3. Tuition & Outstanding Balance
  const totalTuition = paymentRecord?.totalTuition ?? 450;
  const amountPaid = paymentRecord?.amountPaid ?? 350;
  const outstandingBalance = Math.max(0, totalTuition - amountPaid);
  const isPaidInFull = outstandingBalance === 0 || paymentRecord?.status === 'Paid In Full';

  // 4. Curriculum Modules (6 Core Modules)
  const curriculumModules = [
    {
      code: 'SOM-MOD-1',
      title: 'Foundations & Kingdom Alignment',
      instructor: 'Apostle Gillian Selkridge',
      status: 'completed',
      score: '94%',
      sessions: 3
    },
    {
      code: 'SOM-MOD-2',
      title: 'Exegetical Theology & Evangelism',
      instructor: 'Pastor Samuel Selkridge',
      status: 'completed',
      score: '90%',
      sessions: 3
    },
    {
      code: 'SOM-MOD-3',
      title: 'Ministerial Ethics & Pastoral Integrity',
      instructor: 'Pastor Gale Grant',
      status: 'completed',
      score: '88%',
      sessions: 2
    },
    {
      code: 'SOM-MOD-4',
      title: 'Apostolic Ministry & Five-Fold Order',
      instructor: 'Pastor Christy Ruben',
      status: 'in_progress',
      score: 'Active',
      sessions: 3
    },
    {
      code: 'SOM-MOD-5',
      title: 'Prophetic Discernment & Spiritual Warfare',
      instructor: 'Prophet Garod Andrews',
      status: 'upcoming',
      score: 'Scheduled',
      sessions: 2
    },
    {
      code: 'SOM-MOD-6',
      title: 'School of the Pastors & Practical Homiletics',
      instructor: 'Pastor Samuel Selkridge',
      status: 'upcoming',
      score: 'Scheduled',
      sessions: 2
    }
  ];

  // 5. Upcoming Assignments & Quizzes
  const upcomingAssignments = [
    {
      id: 'asg-1',
      title: 'Module 4 Reflection: The Apostolic Mandate in Modern Ministry',
      dueDate: 'This Thursday, 11:59 PM',
      type: 'Essay Assignment',
      points: 100,
      status: 'due_soon'
    },
    {
      id: 'asg-2',
      title: 'Five-Fold Ministry Office Recitation & Knowledge Check',
      dueDate: 'Sunday, 6:00 PM',
      type: 'Online Quiz',
      points: 50,
      status: 'ready_to_take'
    }
  ];

  // 6. Recent Announcements & Broadcasts
  const announcements = [
    {
      id: 'ann-1',
      title: 'Tuesday Live Ministry Broadcast Link Active',
      category: 'Live Broadcast',
      date: 'Today, 6:30 PM',
      content: 'Join us live on Zoom for Module 4 Session 2. Meeting ID: 849 2201 9934 (Passcode: HTEIM2026). Handouts are available in the Library tab.',
      zoomUrl: 'https://zoom.us'
    },
    {
      id: 'ann-2',
      title: 'Graduation Cap & Gown Measurements Submission',
      category: 'Graduation Office',
      date: '2 days ago',
      content: 'All prospective graduates with attendance rate >= 75% are invited to submit their commencement gown measurements by end of month.'
    },
    {
      id: 'ann-3',
      title: 'Apostolic Ministry Class Reading Handout Uploaded',
      category: 'Course Handout',
      date: '4 days ago',
      content: 'The official study guide for Five-Fold Ministry Alignment has been uploaded to the Digital Library.'
    }
  ];

  return (
    <div className="space-y-6" id="student-dashboard">
      
      {/* ─── Top Banner ────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#022044] via-[#023264] to-[#041a33] text-white p-5 sm:p-7 shadow-xl border border-[#025798]/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-300 shrink-0" />
                Student Academic Portal
              </span>
              <span className="text-[10px] font-mono text-sky-200/80 px-2 py-0.5 rounded-full bg-white/10">
                Cohort of 2025–2026
              </span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
              Welcome back, {studentName}
            </h1>
            <p className="text-xs text-sky-100/85 max-w-2xl">
              Track your attendance rate, active module progress, submitted quiz grades, outstanding tuition, and upcoming ministry assignments.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('library')}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 border border-amber-300"
            >
              <Video className="w-3.5 h-3.5 text-slate-950" />
              <span>Join Live Class Broadcast</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('exams')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/15 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>My Assignments</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 1. Primary Metrics Row (Attendance %, Current Grades, Outstanding Balance, Upcoming Assignments) ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Student Core Metrics">
        
        {/* Attendance % Card */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Attendance %
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              isHonorRoll 
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                : isAtRisk 
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' 
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-black font-tabular ${
                isHonorRoll ? 'text-amber-600 dark:text-amber-400' : isAtRisk ? 'text-rose-600' : 'text-slate-900 dark:text-white'
              }`}>
                {attendanceRate.toFixed(1)}%
              </span>
              <span className={`text-xs font-bold ${isHonorRoll ? 'text-amber-600 dark:text-amber-400' : isAtRisk ? 'text-rose-600' : 'text-emerald-600'}`}>
                {isHonorRoll ? 'Honor Distinction' : isAtRisk ? 'Below Standard' : 'Satisfactory'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Attended: <strong className="text-slate-700 dark:text-slate-300">{attendedCount} of {totalDays}</strong> sessions ({safeAbsenceMargin} safe margin)
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-[#025798] dark:text-[#7dd3fc] font-bold group-hover:underline">
            <span>View Attendance Log</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Current Grades Card */}
        <div 
          onClick={() => onNavigate('exams')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Current Grades
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-tabular">
                {avgGrade.toFixed(1)}%
              </span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                Avg Score
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
              {gradeLabel}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-purple-600 dark:text-purple-400 font-bold group-hover:underline">
            <span>Detailed Gradebook</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Outstanding Balance Card */}
        <div 
          onClick={() => onNavigate('payments')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Outstanding Balance
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-black font-tabular ${
                isPaidInFull ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
              }`}>
                ${outstandingBalance}
              </span>
              <span className={`text-xs font-bold ${
                isPaidInFull ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {isPaidInFull ? 'Paid in Full' : 'Partial Due'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Paid: <strong className="text-emerald-600 dark:text-emerald-400">${amountPaid}</strong> of ${totalTuition}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-[#025798] dark:text-[#7dd3fc] font-bold group-hover:underline">
            <span>Pay Online / Receipt</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Upcoming Assignments Card */}
        <div 
          onClick={() => onNavigate('exams')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Upcoming Assignments
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#025798] dark:text-[#7dd3fc] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-tabular">
                {upcomingAssignments.length} Pending
              </span>
              <span className="text-xs font-bold text-[#025798] dark:text-[#7dd3fc]">
                Due This Week
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
              Module 4 Homework & Quiz
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-[#025798] dark:text-[#7dd3fc] font-bold group-hover:underline">
            <span>Submit Homework</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

      </section>

      {/* ─── 2. My Courses & 6-Module Roadmap ────────────────────── */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#023264] text-white flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                My Courses — 6 Core Curriculum Modules
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                School of Ministry academic progression and syllabus milestones
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('courses')}
            className="text-xs font-bold text-[#025798] dark:text-[#7dd3fc] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Course Syllabus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {curriculumModules.map(module => {
            const isCompleted = module.status === 'completed';
            const isActive = module.status === 'in_progress';
            return (
              <div
                key={module.code}
                className={`p-4 rounded-xl border transition-all space-y-2.5 flex flex-col justify-between ${
                  isActive
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-[#025798]/40 ring-1 ring-[#025798]/20 shadow-2xs'
                    : isCompleted
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
                    : 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-75'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                      {module.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isCompleted 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                        : isActive 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse' 
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {isCompleted && <Check className="w-3 h-3" />}
                      {isCompleted ? 'Completed' : isActive ? 'Currently Active' : 'Upcoming'}
                    </span>
                  </div>

                  <h3 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2">
                    {module.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Instructor: <strong className="text-slate-700 dark:text-slate-300">{module.instructor}</strong>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    Grade: <strong className="text-slate-900 dark:text-white font-bold">{module.score}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('courses')}
                    className="text-[#025798] dark:text-[#7dd3fc] font-bold hover:underline"
                  >
                    View Handout
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 3. Upcoming Assignments & Recent Announcements Grid ──── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Upcoming Assignments Panel (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    Upcoming Assignments & Quizzes
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Submit essays, take interactive quizzes, and track rubric points
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {upcomingAssignments.map(asg => (
                <div
                  key={asg.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400">
                        {asg.type} • {asg.points} Pts
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {asg.title}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                      Due Soon
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500">
                      Deadline: <strong className="text-slate-700 dark:text-slate-300">{asg.dueDate}</strong>
                    </span>

                    <button
                      type="button"
                      onClick={() => onNavigate('exams')}
                      className="px-3 py-1 bg-[#023264] hover:bg-[#025798] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer active:scale-95 shadow-2xs"
                    >
                      {asg.type.includes('Quiz') ? 'Take Quiz' : 'Submit Paper'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Academic Year 2025–2026</span>
            <button
              type="button"
              onClick={() => onNavigate('exams')}
              className="text-[#025798] dark:text-[#7dd3fc] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Assignments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Announcements & Devotionals (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-[#025798] dark:text-[#7dd3fc] flex items-center justify-center font-bold">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    Recent Announcements & Exhortations
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live stream broadcast links, pastoral updates, and study guides
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {announcements.map(ann => (
                <div
                  key={ann.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#025798] dark:text-[#7dd3fc]">
                      {ann.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {ann.date}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {ann.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {ann.content}
                  </p>

                  {ann.zoomUrl && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => onNavigate('library')}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Launch Zoom Live Classroom</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Heaven Touching Earth International Ministries</span>
            <button
              type="button"
              onClick={() => onNavigate('messages')}
              className="text-[#025798] dark:text-[#7dd3fc] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Message Faculty</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </section>

    </div>
  );
};
