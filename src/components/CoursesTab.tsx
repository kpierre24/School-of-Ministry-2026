import React, { useState, useEffect } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import { Course } from '../types';
import { UserRole } from '../lib/userAuth';

interface CoursesTabProps {
  userRole?: UserRole;
  courses?: Course[];
  setCourses?: React.Dispatch<React.SetStateAction<Course[]>>;
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
      'Module 1: Introduction',
      'Module 2: Evangelism',
      'Module 3: Ministerial Ethics',
      'Module 4: Apostolic Ministry',
      'Module 5: Prophetic Ministry',
      'Module 6: School of the Pastors and Teachers'
    ],
    enrolledCount: 38
  },
  {
    id: 'm1',
    code: 'SOM-MOD-1',
    title: 'Module 1: Introduction',
    instructor: 'HTEIM Academic Directorate',
    credits: 5,
    description: 'Foundational orientation into the School of Ministry, covenant alignment, academic expectations, spiritual discipline, and ministerial commitment.',
    scheduleDays: 'Class Session 1 & 2',
    location: 'Main Sanctuary Hall',
    topics: ['Kingdom Citizenship & Purpose', 'Scripture Recitation Discipline', 'Classroom & Attendance Integrity', 'Foundational Doctrine'],
    enrolledCount: 38
  },
  {
    id: 'm2',
    code: 'SOM-MOD-2',
    title: 'Module 2: Evangelism',
    instructor: 'Evangelism Ministry Lead',
    credits: 5,
    description: 'Practical soul-winning strategies, personal witnessing, the Great Commission mandate (Matthew 28:19-20), street ministry, and follow-up discipleship.',
    scheduleDays: 'Class Session 3 & 4',
    location: 'Outreach Training Room',
    topics: ['The Matthew 28 Mandate', 'Effective Witnessing Protocols', 'Overcoming Objections in Soul Winning', 'Discipleship & Follow-up'],
    enrolledCount: 38
  },
  {
    id: 'm3',
    code: 'SOM-MOD-3',
    title: 'Module 3: Ministerial Ethics',
    instructor: 'Pastor Senior Advisor',
    credits: 5,
    description: 'High standards of character, financial integrity, church accountability, conflict resolution, confidentiality, and biblical servant leadership.',
    scheduleDays: 'Class Session 5 & 6',
    location: 'Leadership Conference Center',
    topics: ['Integrity of the Leader', 'Financial Stewardship & Transparency', 'Pastoral Counseling Ethics', 'Handling Church Conflict'],
    enrolledCount: 38
  },
  {
    id: 'm4',
    code: 'SOM-MOD-4',
    title: 'Module 4: Apostolic Ministry',
    instructor: 'Dr. Faculty Director',
    credits: 5,
    description: 'Understanding the apostolic mandate, five-fold governance, spiritual authority according to Ephesians 2:20, and distinguishing true vs false apostolic marks.',
    scheduleDays: 'Class Session 7 & 8',
    location: 'Main Sanctuary Hall',
    topics: ['Ephesians 2:20 Foundation', 'Apostolic Marks & Signs', 'Church Governance & Oversight', 'Kingdom Expansion'],
    enrolledCount: 38
  },
  {
    id: 'm5',
    code: 'SOM-MOD-5',
    title: 'Module 5: Prophetic Ministry',
    instructor: 'Prophetic Faculty Director',
    credits: 5,
    description: 'Developing prophetic discernment, hearing the voice of God, evaluating prophecy against Scripture, and maintaining order in prophetic ministry.',
    scheduleDays: 'Class Session 9 & 10',
    location: 'Prayer & Warfare Chapel',
    topics: ['Hearing the Voice of God', 'Testing & Judging Prophecy', 'Prophetic Protocol & Order', 'Spiritual Discernment'],
    enrolledCount: 38
  },
  {
    id: 'm6',
    code: 'SOM-MOD-6',
    title: 'Module 6: School of the Pastors and Teachers',
    instructor: 'Rev. Academic Dean',
    credits: 5,
    description: 'Shepherding the flock, pastoral counseling, expository sermon preparation, sound biblical teaching, and nurturing believers unto maturity.',
    scheduleDays: 'Class Session 11 & 12',
    location: 'Lecture Hall A',
    topics: ['Shepherding & Pastoral Care', 'Expository Preaching & Hermeneutics', 'Teaching Sound Doctrine', 'Building Sustainable Ministries'],
    enrolledCount: 38
  }
];

export const CoursesTab: React.FC<CoursesTabProps> = ({ 
  userRole = 'admin',
  courses: propCourses,
  setCourses: propSetCourses
}) => {
  const isStudent = userRole === 'student';
  const [localCourses, setLocalCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('hteim_courses');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const courses = propCourses !== undefined ? propCourses : localCourses;
  const setCourses = propSetCourses !== undefined ? propSetCourses : setLocalCourses;

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('hteim_courses', JSON.stringify(courses));
  }, [courses]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form Fields State
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formInstructor, setFormInstructor] = useState('');
  const [formCredits, setFormCredits] = useState(5);
  const [formEnrolled, setFormEnrolled] = useState(38);
  const [formSchedule, setFormSchedule] = useState('TBA');
  const [formLocation, setFormLocation] = useState('Main Sanctuary Hall');
  const [formDesc, setFormDesc] = useState('');
  const [formTopics, setFormTopics] = useState<string[]>([]);
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [newTopicInput, setNewTopicInput] = useState('');

  // Course Filter Tab: 'all' | 'active' | 'expired'
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');

  // Quick topic input for selected syllabus modal
  const [quickSyllabusTopic, setQuickSyllabusTopic] = useState('');

  const filteredCourses = courses.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchQuery.toLowerCase());

    const isExpired = c.expiryDate ? new Date(c.expiryDate) < new Date() : false;

    if (statusFilter === 'active') return matchesSearch && !isExpired;
    if (statusFilter === 'expired') return matchesSearch && isExpired;
    return matchesSearch;
  });

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingCourse(null);
    setFormCode('');
    setFormTitle('');
    setFormInstructor('HTEIM Faculty Member');
    setFormCredits(5);
    setFormEnrolled(38);
    setFormSchedule('TBA');
    setFormLocation('HTEIM Campus');
    setFormDesc('');
    setFormExpiryDate('');
    setFormTopics(['Course Orientation & Kingdom Mandate', 'Biblical Foundations & Hermeneutics']);
    setNewTopicInput('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormCode(course.code);
    setFormTitle(course.title);
    setFormInstructor(course.instructor);
    setFormCredits(course.credits);
    setFormEnrolled(course.enrolledCount);
    setFormSchedule(course.scheduleDays);
    setFormLocation(course.location);
    setFormDesc(course.description);
    setFormExpiryDate(course.expiryDate || '');
    setFormTopics([...course.topics]);
    setNewTopicInput('');
    setShowAddModal(true);
  };

  // Save Course (Create or Update)
  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formTitle.trim()) return;

    if (editingCourse) {
      const updatedList = courses.map(c => c.id === editingCourse.id ? {
        ...c,
        code: formCode.toUpperCase().trim(),
        title: formTitle.trim(),
        instructor: formInstructor.trim() || 'HTEIM Faculty Member',
        credits: formCredits,
        enrolledCount: formEnrolled,
        scheduleDays: formSchedule.trim() || 'TBA',
        location: formLocation.trim() || 'HTEIM Campus',
        description: formDesc.trim() || 'School of Ministry course module.',
        expiryDate: formExpiryDate.trim() || undefined,
        topics: formTopics.length > 0 ? formTopics : ['Course Introduction']
      } : c);

      setCourses(updatedList);

      // Also update selectedCourse if currently viewed
      if (selectedCourse && selectedCourse.id === editingCourse.id) {
        setSelectedCourse({
          ...selectedCourse,
          code: formCode.toUpperCase().trim(),
          title: formTitle.trim(),
          instructor: formInstructor.trim() || 'HTEIM Faculty Member',
          credits: formCredits,
          enrolledCount: formEnrolled,
          scheduleDays: formSchedule.trim() || 'TBA',
          location: formLocation.trim() || 'HTEIM Campus',
          description: formDesc.trim() || 'School of Ministry course module.',
          expiryDate: formExpiryDate.trim() || undefined,
          topics: formTopics.length > 0 ? formTopics : ['Course Introduction']
        });
      }
    } else {
      const newCourseObj: Course = {
        id: `c_${Date.now()}`,
        code: formCode.toUpperCase().trim(),
        title: formTitle.trim(),
        instructor: formInstructor.trim() || 'HTEIM Faculty Member',
        credits: formCredits,
        enrolledCount: formEnrolled,
        scheduleDays: formSchedule.trim() || 'TBA',
        location: formLocation.trim() || 'HTEIM Campus',
        description: formDesc.trim() || 'School of Ministry course module.',
        expiryDate: formExpiryDate.trim() || undefined,
        topics: formTopics.length > 0 ? formTopics : ['Course Introduction']
      };
      setCourses([...courses, newCourseObj]);
    }

    setShowAddModal(false);
  };

  // Delete Course
  const handleDeleteCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    if (selectedCourse?.id === id) {
      setSelectedCourse(null);
    }
    if (editingCourse?.id === id) {
      setShowAddModal(false);
    }
  };

  // Topic Management inside Modal
  const handleAddTopic = () => {
    if (!newTopicInput.trim()) return;
    setFormTopics([...formTopics, newTopicInput.trim()]);
    setNewTopicInput('');
  };

  const handleRemoveTopic = (index: number) => {
    setFormTopics(formTopics.filter((_, i) => i !== index));
  };

  // Quick Add Topic in Syllabus Detail View
  const handleQuickAddSyllabusTopic = (courseId: string) => {
    if (!quickSyllabusTopic.trim()) return;
    const updated = courses.map(c => {
      if (c.id === courseId) {
        return { ...c, topics: [...c.topics, quickSyllabusTopic.trim()] };
      }
      return c;
    });
    setCourses(updated);
    if (selectedCourse && selectedCourse.id === courseId) {
      setSelectedCourse({
        ...selectedCourse,
        topics: [...selectedCourse.topics, quickSyllabusTopic.trim()]
      });
    }
    setQuickSyllabusTopic('');
  };

  // Quick Remove Topic in Syllabus Detail View
  const handleQuickRemoveSyllabusTopic = (courseId: string, topicIndex: number) => {
    const updated = courses.map(c => {
      if (c.id === courseId) {
        return { ...c, topics: c.topics.filter((_, i) => i !== topicIndex) };
      }
      return c;
    });
    setCourses(updated);
    if (selectedCourse && selectedCourse.id === courseId) {
      setSelectedCourse({
        ...selectedCourse,
        topics: selectedCourse.topics.filter((_, i) => i !== topicIndex)
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-28 sm:pb-24 md:pb-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-900/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-400 shrink-0" />
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-syne">Ministry Courses & Academic Curriculum</h2>
          </div>
          <p className="text-xs text-indigo-200 mt-1 max-w-2xl font-sans">
            Manage structured theological modules, syllabus guidelines, and course cards for HTEIM School of Ministry.
          </p>
        </div>

        {!isStudent && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Add New Course
          </button>
        )}
      </div>

      {/* Search Bar & Counter & Status Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses by title, code (e.g. SOM-101), or instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg transition-all ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({courses.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-lg transition-all ${
              statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1 rounded-lg transition-all ${
              statusFilter === 'expired' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Expired
          </button>
        </div>

        <div className="text-xs font-bold text-slate-500 font-mono whitespace-nowrap">
          Showing {filteredCourses.length} Courses
        </div>
      </div>

      {/* Course List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCourses.map((course) => {
          const isExpired = course.expiryDate ? new Date(course.expiryDate) < new Date() : false;

          return (
            <div 
              key={course.id} 
              className={`bg-white border rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group ${
                isExpired ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header Badge & Action Buttons */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-mono font-black rounded-lg">
                      {course.code}
                    </span>
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold rounded-lg flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-600" /> {course.credits} Credits
                    </span>

                    {/* Expiry Badge */}
                    {course.expiryDate ? (
                      isExpired ? (
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black uppercase rounded-lg flex items-center gap-1">
                          <Clock className="w-3 h-3 text-rose-600" /> Expired ({course.expiryDate})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-semibold rounded-lg flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> Expires: {course.expiryDate}
                        </span>
                      )
                    ) : null}
                  </div>

                  {/* Edit & Remove Card Action Buttons */}
                  {!isStudent && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(course)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all cursor-pointer"
                        title="Edit Course Information"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-all cursor-pointer"
                        title="Remove Course Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

              <h3 className="text-base font-extrabold text-slate-900 mb-2 leading-snug">
                {course.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                {course.description}
              </p>

              {/* Course Info Cards */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-bold flex items-center gap-1.5 text-slate-500">
                    <GraduationCap className="w-4 h-4 text-indigo-600" /> Faculty Instructor:
                  </span>
                  <span className="font-bold text-slate-900">{course.instructor}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200/60">
                  <span className="font-bold flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-4 h-4 text-emerald-600" /> Schedule:
                  </span>
                  <span className="font-medium text-slate-800 text-[11px]">{course.scheduleDays}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200/60">
                  <span className="font-bold flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-4 h-4 text-rose-500" /> Location:
                  </span>
                  <span className="font-medium text-slate-800 text-[11px]">{course.location}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200/60">
                  <span className="font-bold flex items-center gap-1.5 text-slate-500">
                    <Users className="w-4 h-4 text-indigo-500" /> Enrolled Roster:
                  </span>
                  <span className="font-mono font-bold text-indigo-700">{course.enrolledCount} Students Enrolled</span>
                </div>
              </div>

              {/* Topics Pill List */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Key Syllabus Modules ({course.topics.length})
                  </p>
                  {!isStudent && (
                    <button
                      onClick={() => handleOpenEditModal(course)}
                      className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" /> Edit Topics
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {course.topics.slice(0, 3).map((topic, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md border border-slate-200 flex items-center gap-1">
                      • {topic}
                    </span>
                  ))}
                  {course.topics.length > 3 && (
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md">
                      +{course.topics.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedCourse(course)}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                View Full Syllabus & Materials <ChevronRight className="w-4 h-4" />
              </button>

              {!isStudent && (
                <button
                  onClick={() => handleOpenEditModal(course)}
                  className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-indigo-200"
                  title="Edit Course"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>
          </div>
        );
      })}
      </div>

      {/* Course Detail Syllabus Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleUp">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
                  {selectedCourse.code}
                </span>
                <h3 className="text-base font-extrabold mt-1">{selectedCourse.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {!isStudent && (
                  <button
                    onClick={() => {
                      const c = selectedCourse;
                      setSelectedCourse(null);
                      handleOpenEditModal(c);
                    }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Course
                  </button>
                )}
                <button 
                  onClick={() => setSelectedCourse(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs text-slate-800">
              <div>
                <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mb-1">Course Description</h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">{selectedCourse.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Instructor</span>
                  <span className="font-bold text-slate-900">{selectedCourse.instructor}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Schedule</span>
                  <span className="font-bold text-slate-900">{selectedCourse.scheduleDays}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Location</span>
                  <span className="font-bold text-slate-900">{selectedCourse.location}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Credits / Roster</span>
                  <span className="font-bold text-indigo-700">{selectedCourse.credits} Cr ({selectedCourse.enrolledCount} Enrolled)</span>
                </div>
              </div>

              {/* Complete Syllabus Modules & Quick Add Topic */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">
                    Syllabus Topics & Modules ({selectedCourse.topics.length})
                  </h4>
                  {!isStudent && <span className="text-[10px] text-slate-400">Click remove button to trim topic</span>}
                </div>

                <div className="space-y-2 mb-3">
                  {selectedCourse.topics.map((t, idx) => (
                    <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 font-bold text-slate-800 group/topic">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Module {idx + 1}: {t}</span>
                      </div>
                      {!isStudent && (
                        <button
                          onClick={() => handleQuickRemoveSyllabusTopic(selectedCourse.id, idx)}
                          className="opacity-0 group-hover/topic:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                          title="Remove Topic"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Quick Add Topic Input (Admin/Teacher only) */}
                {!isStudent && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder="Add a new syllabus topic or lecture module..."
                      value={quickSyllabusTopic}
                      onChange={(e) => setQuickSyllabusTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickAddSyllabusTopic(selectedCourse.id);
                        }
                      }}
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      onClick={() => handleQuickAddSyllabusTopic(selectedCourse.id)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Topic
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Course Modal */}
      {!isStudent && showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveCourse} className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-scaleUp">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-extrabold">
                  {editingCourse ? `Edit Course Card (${editingCourse.code})` : 'Add New Ministry Course'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Course Code *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. SOM-MOD-7"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formCredits}
                    onChange={(e) => setFormCredits(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Enrolled Count</label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={formEnrolled}
                    onChange={(e) => setFormEnrolled(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Course Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Practical Pastoral Ministry & Shepherding"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Instructor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Faculty Director"
                    value={formInstructor}
                    onChange={(e) => setFormInstructor(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Course Expiration Date</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Schedule Days</label>
                <input
                  type="text"
                  placeholder="e.g. Tuesdays (7:00 PM - 9:00 PM)"
                  value={formSchedule}
                  onChange={(e) => setFormSchedule(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Location / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Main Sanctuary Hall A"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide detailed course summary and objectives..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Topics / Syllabus List Editor */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Syllabus Topics ({formTopics.length})
                </label>
                <div className="space-y-1.5 mb-2 max-h-36 overflow-y-auto custom-scrollbar p-1">
                  {formTopics.map((top, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium">
                      <span className="truncate pr-2">• {top}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Remove Topic"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type new topic and press Add..."
                    value={newTopicInput}
                    onChange={(e) => setNewTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTopic();
                      }
                    }}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTopic}
                    className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    + Add Topic
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              {editingCourse ? (
                <button
                  type="button"
                  onClick={() => handleDeleteCourse(editingCourse.id)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Card
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  {editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
