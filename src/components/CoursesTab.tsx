import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Users, 
  Clock, 
  FileText, 
  Download, 
  CheckCircle2, 
  GraduationCap, 
  Layers, 
  Calendar, 
  ChevronRight, 
  Award, 
  Sparkles, 
  Edit3, 
  Trash2, 
  X, 
  MapPin, 
  Save, 
  Tag, 
  Lock, 
  ShieldAlert, 
  BrainCircuit, 
  Filter, 
  UserCheck, 
  AlertTriangle 
} from 'lucide-react';
import { 
  PageHeader, 
  LoadingState, 
  EmptyState, 
  ErrorState, 
  PermissionDeniedState, 
  Button, 
  StatusPill,
  showToast 
} from './UXPrimitives';
import { InteractiveFlashcards } from './InteractiveFlashcards';
import { Course } from '../types';
import { UserRole } from '../lib/userAuth';
import { 
  AcademicYear, 
  Term, 
  MasterCourse, 
  CourseOffering, 
  AcademicStructureData 
} from '../types/academicEngine';
import { 
  DEFAULT_ACADEMIC_YEARS, 
  DEFAULT_TERMS, 
  DEFAULT_MASTER_COURSES, 
  DEFAULT_COURSE_OFFERINGS,
  INITIAL_ACADEMIC_STRUCTURE
} from '../data/defaultAcademicData';
import { CourseOfferingDetailModal } from '../features/academics/CourseOfferingDetailModal';
import { ScheduleOfferingModal } from '../features/academics/ScheduleOfferingModal';
import { MasterCourseCatalogView } from '../features/academics/MasterCourseCatalogView';
import { AcademicCalendarView } from '../features/academics/AcademicCalendarView';
import { portalApi } from '../services/api/portalApiClient';

export interface CoursesTabProps {
  userRole?: UserRole;
  courses?: Course[];
  setCourses?: React.Dispatch<React.SetStateAction<Course[]>>;
  uniqueStudents?: { name: string; email?: string; photoUrl?: string; levelId?: string }[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const INITIAL_COURSES: Course[] = [
  {
    id: 'c_main',
    code: 'SOM-CORE',
    title: 'HTEIM School of Ministry Core Program',
    instructor: 'HTEIM Faculty Leadership',
    credits: 30,
    description: 'The primary ministerial training program consisting of 6 core modules: Introduction, Evangelism, Ministerial Ethics, Apostolic Ministry, Prophetic Ministry, and School of the Pastors and Teachers.',
    scheduleDays: 'Tuesdays & Thursdays (7:00 PM - 9:00 PM EST)',
    location: 'HTEIM Main Sanctuary & Live Streaming',
    topics: [
      'Module 1: Introduction & Biblical Hermeneutics',
      'Module 2: Evangelism & The Great Commission',
      'Module 3: Ministerial Ethics & Pastoral Integrity',
      'Module 4: Apostolic Governance & Five-Fold Ministry',
      'Module 5: Prophetic Ministry & Spiritual Discernment',
      'Module 6: School of the Pastors and Teachers'
    ],
    enrolledCount: 38
  },
  {
    id: 'm1',
    code: 'SOM-MOD-1',
    title: 'Module 1: Biblical Hermeneutics & Exegesis',
    instructor: 'Pastor John Selkridge',
    credits: 5,
    description: 'Sound biblical interpretation, exegesis methodologies, historical-grammatical context, and delivering scriptural truth without doctrinal distortion.',
    scheduleDays: 'Tuesdays & Thursdays (7:00 PM - 9:00 PM EST)',
    location: 'Main Sanctuary Hall & Zoom Live',
    topics: ['Authority of Scripture & Canon', 'Historical-Grammatical Exegesis', 'The Christocentric Principle', 'Homiletical Application'],
    enrolledCount: 6
  },
  {
    id: 'm2',
    code: 'SOM-MOD-2',
    title: 'Module 2: Evangelism & The Great Commission',
    instructor: 'Minister Christy Ruben',
    credits: 5,
    description: 'Practical soul-winning strategies, personal witnessing, the Matthew 28 mandate, street ministry, and follow-up discipleship.',
    scheduleDays: 'Mondays (7:00 PM - 9:00 PM EST) & Outreach',
    location: 'Outreach Training Room & Field',
    topics: ['The Matthew 28 Mandate', 'Effective Witnessing Protocols', 'Overcoming Objections in Soul Winning', 'Discipleship & Follow-up'],
    enrolledCount: 2
  },
  {
    id: 'm3',
    code: 'SOM-MOD-3',
    title: 'Module 3: Ministerial Ethics & Pastoral Integrity',
    instructor: 'Rev. Gillian Selkridge',
    credits: 5,
    description: 'High standards of character, financial integrity, church accountability, conflict resolution, confidentiality, and biblical servant leadership.',
    scheduleDays: 'Wednesdays (7:00 PM - 9:00 PM EST)',
    location: 'Leadership Conference Center',
    topics: ['Integrity of the Leader', 'Financial Stewardship & Transparency', 'Pastoral Counseling Ethics', 'Handling Church Conflict'],
    enrolledCount: 38
  },
  {
    id: 'm4',
    code: 'SOM-MOD-4',
    title: 'Module 4: Apostolic Governance & Five-Fold Ministry',
    instructor: 'Apostle Dr. Kendell Pierre',
    credits: 5,
    description: 'Understanding the apostolic mandate, five-fold governance, spiritual authority according to Ephesians 4:11, and distinguishing true vs false apostolic marks.',
    scheduleDays: 'Fridays (7:00 PM - 9:30 PM EST)',
    location: 'Main Sanctuary & Global Apostolic Room',
    topics: ['Apostolic Foundation (Ephesians 2:20)', 'Marks and Signs of an Apostle', 'Five-Fold Synergy & Alignment', 'Apostolic Church Planting'],
    enrolledCount: 38
  },
  {
    id: 'm5',
    code: 'SOM-MOD-5',
    title: 'Module 5: Prophetic Ministry & Spiritual Discernment',
    instructor: 'Apostolic Faculty Team',
    credits: 5,
    description: 'The operation and biblical testing of prophecy, cultivating spiritual sensitivity, dream interpretation, and prophetic order according to 1 Cor 14.',
    scheduleDays: 'Class Session 9 & 10',
    location: 'Lecture Hall B',
    topics: ['The Gift of Prophecy vs Prophetic Office', 'Testing and Judging Prophecy', 'Spiritual Discernment & Warfare', 'Prophetic Protocol in Assembly'],
    enrolledCount: 38
  },
  {
    id: 'm6',
    code: 'SOM-MOD-6',
    title: 'Module 6: School of the Pastors and Teachers',
    instructor: 'Rev. Dr. Samuel Selkridge',
    credits: 5,
    description: 'Shepherding the flock, pastoral counseling, expository sermon preparation, sound biblical teaching, and nurturing believers unto maturity.',
    scheduleDays: 'Saturdays (9:00 AM - 1:00 PM EST)',
    location: 'Main Sanctuary & Online Broadcast',
    topics: ['Shepherding & Pastoral Care', 'Expository Preaching & Hermeneutics', 'Teaching Sound Doctrine', 'Building Sustainable Ministries'],
    enrolledCount: 38
  }
];

export const CoursesTab: React.FC<CoursesTabProps> = ({ 
  userRole = 'admin',
  courses: propCourses,
  setCourses: propSetCourses,
  uniqueStudents = [],
  isLoading = false,
  error = null,
  onRetry
}) => {
  const isStudent = userRole === 'student';
  const isTeacherOrAdmin = userRole === 'admin' || userRole === 'teacher';

  // --- Academic Engine Hierarchy State ---
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(() => {
    const saved = localStorage.getItem('hteim_academic_years');
    return saved ? JSON.parse(saved) : DEFAULT_ACADEMIC_YEARS;
  });

  const [terms, setTerms] = useState<Term[]>(() => {
    const saved = localStorage.getItem('hteim_academic_terms');
    return saved ? JSON.parse(saved) : DEFAULT_TERMS;
  });

  const [masterCourses, setMasterCourses] = useState<MasterCourse[]>(() => {
    const saved = localStorage.getItem('hteim_master_courses');
    return saved ? JSON.parse(saved) : DEFAULT_MASTER_COURSES;
  });

  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>(() => {
    const saved = localStorage.getItem('hteim_course_offerings');
    return saved ? JSON.parse(saved) : DEFAULT_COURSE_OFFERINGS;
  });

  // Active Filter: Academic Year and Term
  const [selectedTermId, setSelectedTermId] = useState<string>('term_2026_s1');
  const [activeTabMode, setActiveTabMode] = useState<'offerings' | 'catalog' | 'calendar'>('offerings');

  // Modal / Detail States
  const [selectedOffering, setSelectedOffering] = useState<CourseOffering | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [preselectedCourseForSchedule, setPreselectedCourseForSchedule] = useState<MasterCourse | null>(null);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Persist Academic Engine Data locally
  useEffect(() => {
    localStorage.setItem('hteim_academic_years', JSON.stringify(academicYears));
    localStorage.setItem('hteim_academic_terms', JSON.stringify(terms));
    localStorage.setItem('hteim_master_courses', JSON.stringify(masterCourses));
    localStorage.setItem('hteim_course_offerings', JSON.stringify(courseOfferings));
  }, [academicYears, terms, masterCourses, courseOfferings]);

  // Load authoritative academic structure on mount from Express API
  useEffect(() => {
    let isMounted = true;
    portalApi.getAcademicStructure().then(structure => {
      if (!isMounted || !structure) return;
      if (structure.academicYears?.length) setAcademicYears(structure.academicYears);
      if (structure.terms?.length) setTerms(structure.terms);
      if (structure.masterCourses?.length) setMasterCourses(structure.masterCourses);
      if (structure.courseOfferings?.length) setCourseOfferings(structure.courseOfferings);
      if (structure.activeTermId) setSelectedTermId(structure.activeTermId);
    }).catch(err => {
      console.warn('Using local academic structure fallback:', err);
    });
    return () => { isMounted = false; };
  }, []);

  // Active Term and Year Objects
  const activeTerm = useMemo(() => {
    return terms.find(t => t.id === selectedTermId) || terms[0];
  }, [terms, selectedTermId]);

  const activeYear = useMemo(() => {
    return academicYears.find(ay => ay.id === activeTerm?.academicYearId) || academicYears[0];
  }, [academicYears, activeTerm]);

  // Filter offerings by term and search
  const filteredOfferings = useMemo(() => {
    return courseOfferings.filter(offering => {
      const matchesTerm = selectedTermId === 'all' || offering.termId === selectedTermId;
      const matchesSearch = 
        offering.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offering.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offering.lecturer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offering.section.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTerm && matchesSearch;
    });
  }, [courseOfferings, selectedTermId, searchQuery]);

  // Handle updated offering from detail modal
  const handleUpdateOffering = (updatedOffering: CourseOffering) => {
    setCourseOfferings(prev => prev.map(o => o.id === updatedOffering.id ? updatedOffering : o));
    setSelectedOffering(updatedOffering);

    // Sync to Express API
    portalApi.saveCourseOffering(updatedOffering).catch(err => {
      console.warn('Failed to sync course offering to API:', err);
    });
  };

  // Handle scheduling new offering from master course
  const handleScheduleOffering = (newOffering: CourseOffering) => {
    setCourseOfferings(prev => [newOffering, ...prev]);
    setSelectedTermId(newOffering.termId);
    setActiveTabMode('offerings');
    setSelectedOffering(newOffering);

    // Sync to Express API
    portalApi.saveCourseOffering(newOffering).catch(err => {
      console.warn('Failed to sync new course offering to API:', err);
    });
  };

  // 1. Error State
  if (error) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
        <PageHeader
          breadcrumbs={[
            { label: 'Portal' },
            { label: 'Courses & Curriculum', active: true }
          ]}
          title="Academic Curriculum & Course Management"
          description="Curriculum catalog, course offerings, syllabus materials, and gradebooks."
        />
        <ErrorState
          title="We could not load course records. Try again."
          description={error}
          onRetry={onRetry}
        />
      </div>
    );
  }

  // 2. Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Portal' },
            { label: 'Courses & Curriculum', active: true }
          ]}
          title="Academic Curriculum & Course Management"
          description="Curriculum catalog, course offerings, syllabus materials, and gradebooks."
          badge={<StatusPill tone="info" label="Loading curriculum…" />}
        />
        <LoadingState
          label="Loading course offerings and curriculum modules…"
          description="Retrieving course catalog, assigned faculty lecturers, and enrollment rosters…"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 animate-fadeIn w-full max-w-full overflow-x-hidden">
      
      {/* Standardized Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Portal' },
          { label: 'Courses & Curriculum', active: true }
        ]}
        title="Academic Curriculum & Course Management"
        description="Distinguishing reusable Master Courses from term-specific Course Offerings with appointed Lecturers, Enrolled Students, Attendance, Assignments, Exams, and Gradebooks."
        badge={
          <StatusPill
            tone="info"
            icon={<Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
            label={`${activeYear?.name || '2026'} • ${activeTerm?.name || 'Semester 1'}`}
          />
        }
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFlashcards(true)}
              leftIcon={<BrainCircuit className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
            >
              Scripture Flashcards
            </Button>

            {isTeacherOrAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setPreselectedCourseForSchedule(null);
                  setShowScheduleModal(true);
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Schedule Offering
              </Button>
            )}
          </div>
        }
      />

      {/* View Mode Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg overflow-x-auto no-scrollbar max-w-full">
          <button
            type="button"
            onClick={() => setActiveTabMode('offerings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTabMode === 'offerings'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Course Offerings ({courseOfferings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabMode('catalog')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTabMode === 'catalog'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Master Curriculum Catalog ({masterCourses.length} Modules)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTabMode === 'calendar'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Academic Calendar</span>
          </button>
        </div>

        {/* Term Filter Dropdown when in Offerings view */}
        {activeTabMode === 'offerings' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Viewing Term:</span>
            <select
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              aria-label="Filter courses by academic term"
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Semesters &amp; Terms</option>
              {terms.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: COURSE OFFERINGS */}
      {activeTabMode === 'offerings' && (
        <div className="space-y-4">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search scheduled course offerings, lecturers, or sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {filteredOfferings.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
              title="No course offerings scheduled for this term."
              description="Schedule an offering from the Master Curriculum Catalog to appoint a Lecturer, enroll candidates, and begin tracking attendance and grades."
              action={
                isTeacherOrAdmin ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowScheduleModal(true)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Schedule Offering
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOfferings.map((offering) => {
                const atRiskEnrolled = offering.enrolledStudents.filter(
                  s => s.standing === 'at_risk' || s.attendanceRate < 75
                ).length;

                return (
                  <div
                    key={offering.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <StatusPill tone="info" label={offering.courseCode} />
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {offering.termName}
                        </span>
                      </div>

                      {/* Course Title */}
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {offering.courseTitle}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {offering.section}
                      </p>

                      {/* Lecturer Card snippet */}
                      <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                        <img
                          src={offering.lecturer.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                          alt={offering.lecturer.name}
                          className="w-8 h-8 rounded-full object-cover border border-indigo-200 dark:border-indigo-800 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                            Appointed Lecturer
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {offering.lecturer.name}
                          </h4>
                        </div>
                      </div>

                      {/* Schedule & Location */}
                      <div className="mt-2.5 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 truncate">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate text-[11px]">{offering.scheduleDays}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate text-[11px]">{offering.location}</span>
                        </div>
                      </div>

                      {/* Facet Summary stats */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-1.5 text-center">
                        <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-800/40">
                          <span className="text-[9px] text-slate-400 block">Enrolled</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {offering.enrolledStudents.length}/{offering.capacity}
                          </span>
                        </div>

                        <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-800/40">
                          <span className="text-[9px] text-slate-400 block">Sessions</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {offering.attendance.length}
                          </span>
                        </div>

                        <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-800/40">
                          <span className="text-[9px] text-slate-400 block">Coursework</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {offering.assignments.length + offering.exams.length}
                          </span>
                        </div>
                      </div>

                      {/* At-risk student badge if any */}
                      {atRiskEnrolled > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{atRiskEnrolled} student(s) below 75% attendance threshold</span>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedOffering(offering)}
                        rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700"
                      >
                        Course Workspace
                      </Button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* VIEW 2: MASTER CURRICULUM CATALOG */}
      {activeTabMode === 'catalog' && (
        <MasterCourseCatalogView
          masterCourses={masterCourses}
          courseOfferings={courseOfferings}
          onSelectCourseOffering={(offering) => setSelectedOffering(offering)}
          onScheduleCourse={(course) => {
            setPreselectedCourseForSchedule(course);
            setShowScheduleModal(true);
          }}
          userRole={userRole}
        />
      )}

      {/* VIEW 3: ACADEMIC CALENDAR & TERMS */}
      {activeTabMode === 'calendar' && (
        <AcademicCalendarView
          academicYears={academicYears}
          terms={terms}
          courseOfferings={courseOfferings}
          activeTermId={selectedTermId}
          onSelectTerm={(termId) => {
            setSelectedTermId(termId);
            setActiveTabMode('offerings');
          }}
          userRole={userRole}
        />
      )}

      {/* Course Offering Detail Deep-Dive Modal */}
      {selectedOffering && (
        <CourseOfferingDetailModal
          offering={selectedOffering}
          onClose={() => setSelectedOffering(null)}
          userRole={userRole}
          onUpdateOffering={handleUpdateOffering}
          availableStudents={uniqueStudents}
        />
      )}

      {/* Schedule Offering Modal */}
      {showScheduleModal && (
        <ScheduleOfferingModal
          masterCourses={masterCourses}
          academicYears={academicYears}
          terms={terms}
          preselectedCourse={preselectedCourseForSchedule}
          currentTermId={selectedTermId === 'all' ? terms[0]?.id : selectedTermId}
          currentYearId={activeYear?.id}
          onClose={() => setShowScheduleModal(false)}
          onSchedule={handleScheduleOffering}
        />
      )}

      {/* Interactive Scripture Flashcards Modal */}
      {showFlashcards && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowFlashcards(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <InteractiveFlashcards onClose={() => setShowFlashcards(false)} />
          </div>
        </div>
      )}

    </div>
  );
};
