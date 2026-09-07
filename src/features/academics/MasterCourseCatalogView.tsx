import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Calendar, 
  Award, 
  CheckCircle2, 
  Plus, 
  ChevronRight, 
  Clock, 
  Layers, 
  Search,
  ExternalLink,
  BookMarked
} from 'lucide-react';
import { MasterCourse, CourseOffering } from '../../types/academicEngine';
import { UserRole } from '../../lib/userAuth';

interface MasterCourseCatalogViewProps {
  masterCourses: MasterCourse[];
  courseOfferings: CourseOffering[];
  onSelectCourseOffering: (offering: CourseOffering) => void;
  onScheduleCourse: (course: MasterCourse) => void;
  userRole?: UserRole;
}

export const MasterCourseCatalogView: React.FC<MasterCourseCatalogViewProps> = ({
  masterCourses,
  courseOfferings,
  onSelectCourseOffering,
  onScheduleCourse,
  userRole = 'admin'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const isTeacherOrAdmin = userRole === 'admin' || userRole === 'teacher';

  const departments = ['all', 'Biblical Studies', 'Practical Ministry', 'Leadership & Governance', 'Theology & Ethics'];

  const filteredCourses = masterCourses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDepartment === 'all' || course.department === selectedDepartment;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      
      {/* Intro Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-indigo-200 border border-white/10 mb-3">
            <BookMarked className="w-3.5 h-3.5" />
            Core Curriculum Architecture
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Master Curriculum Catalog (6 Core Modules)
          </h2>
          <p className="text-sm text-indigo-100/90 mt-2 leading-relaxed">
            These central course definitions establish the authoritative ministerial curriculum of HTEIM School of Ministry.
            Each course can be scheduled across multiple academic years and semesters with different appointed lecturers without duplicating the core definition.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search master curriculum courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedDepartment === dept
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {dept === 'all' ? 'All Departments' : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCourses.map(course => {
          const isExpanded = expandedCourseId === course.id;
          const offeringsForCourse = courseOfferings.filter(o => o.courseId === course.id);

          return (
            <div
              key={course.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header badges */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80">
                      {course.code}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/80">
                      Module {course.coreModuleNumber}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {course.credits} Credits
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {course.department}
                  </span>
                </div>

                {/* Course Title */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {course.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed line-clamp-3">
                  {course.description}
                </p>

                {/* Learning Outcomes & Syllabus Expansion */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                        Learning Outcomes
                      </h4>
                      <ul className="space-y-1.5">
                        {course.learningOutcomes.map((outcome, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                        Syllabus Outline
                      </h4>
                      <div className="space-y-2">
                        {course.syllabusOutline.map((item) => (
                          <div key={item.week} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              Week {item.week}: {item.topic}
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.description}
                            </p>
                            {item.scriptureReferences && item.scriptureReferences.length > 0 && (
                              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                                Scripture: {item.scriptureReferences.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Offerings of this master course */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">
                      Scheduled Offerings ({offeringsForCourse.length})
                    </span>
                    <button
                      onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                      className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      {isExpanded ? 'Show Less' : 'View Full Syllabus'}
                    </button>
                  </div>

                  {offeringsForCourse.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-1">
                      Not currently scheduled in an active semester.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {offeringsForCourse.map(offering => (
                        <div
                          key={offering.id}
                          onClick={() => onSelectCourseOffering(offering)}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                              {offering.termName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Lecturer: <strong className="text-slate-700 dark:text-slate-300">{offering.lecturer.name}</strong> • {offering.enrolledStudents.length} Students
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              {isTeacherOrAdmin && (
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onScheduleCourse(course)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Schedule Offering
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
