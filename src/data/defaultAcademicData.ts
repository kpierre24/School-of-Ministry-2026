/**
 * ============================================================================
 * DEFAULT ACADEMIC STRUCTURE DATA
 * HTEIM School of Ministry
 * ============================================================================
 * Establishes the authoritative Academic Hierarchy:
 * Academic Year -> Semester/Term -> Master Course -> Course Offering
 * Demonstrating course definition reuse across terms and years with
 * full support for:
 *   - Lecturer
 *   - Enrolled Students
 *   - Attendance
 *   - Assignments
 *   - Exams
 *   - Grades
 */

import { 
  AcademicYear, 
  Term, 
  MasterCourse, 
  CourseOffering, 
  AcademicStructureData 
} from '../types/academicEngine';

export const DEFAULT_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: 'ay_2025_2026',
    code: 'AY-2025-2026',
    name: '2025–2026 Academic Year',
    startDate: '2025-09-01',
    endDate: '2026-06-30',
    status: 'active',
    theme: 'Equipping the Saints for Apostolic Impact & Kingdom Commission',
    description: 'Current ministerial training academic cycle covering foundational, ministerial, and apostolic leadership tracks.'
  },
  {
    id: 'ay_2026_2027',
    code: 'AY-2026-2027',
    name: '2026–2027 Academic Year',
    startDate: '2026-09-01',
    endDate: '2027-06-30',
    status: 'upcoming',
    theme: 'Deepening Theological Foundations & International Church Planting',
    description: 'Upcoming academic year featuring expanded five-fold governance and pastoral licensing practicums.'
  }
];

export const DEFAULT_TERMS: Term[] = [
  {
    id: 'term_2026_s1',
    academicYearId: 'ay_2025_2026',
    code: '2026-SEM-1',
    name: '2026 Semester 1 (Spring/Winter)',
    sequenceOrder: 1,
    startDate: '2026-01-12',
    endDate: '2026-05-28',
    status: 'active',
    weeksCount: 16,
    description: 'Active term covering hermeneutical exegesis, evangelism field campaigns, and ministerial integrity.'
  },
  {
    id: 'term_2026_s2',
    academicYearId: 'ay_2025_2026',
    code: '2026-SEM-2',
    name: '2026 Semester 2 (Summer/Fall)',
    sequenceOrder: 2,
    startDate: '2026-06-08',
    endDate: '2026-10-24',
    status: 'upcoming',
    weeksCount: 16,
    description: 'Upcoming term featuring advanced apostolic architecture, prophetic order, and pastoral counseling.'
  },
  {
    id: 'term_2027_s1',
    academicYearId: 'ay_2026_2027',
    code: '2027-SEM-1',
    name: '2027 Semester 1 (Spring/Winter)',
    sequenceOrder: 1,
    startDate: '2027-01-11',
    endDate: '2027-05-27',
    status: 'upcoming',
    weeksCount: 16,
    description: 'First semester of the 2026-2027 academic year.'
  }
];

/**
 * 6 CORE CURRICULUM MODULES (Master Course Catalog)
 * These definitions are eternal and reusable across all academic years and semesters.
 */
export const DEFAULT_MASTER_COURSES: MasterCourse[] = [
  {
    id: 'crs_hermeneutics',
    code: 'SOM-101',
    title: 'Biblical Hermeneutics & Exegesis',
    coreModuleNumber: 1,
    credits: 5.0,
    department: 'Biblical Studies',
    level: 'Foundation',
    description: 'Comprehensive study of sound biblical interpretation, exegesis methodologies, historical-grammatical context, genre analysis, and delivering scriptural truth without doctrinal distortion.',
    learningOutcomes: [
      'Master the historical-grammatical approach to Old and New Testament exegesis',
      'Distinguish between eisegesis and exegesis in sermon and lesson preparation',
      'Analyze original language nuances, covenants, and theological dispensations',
      'Apply biblical interpretation rules faithfully to modern ministry practice'
    ],
    prerequisites: ['SOM-099 Ministerial Orientation'],
    syllabusOutline: [
      { week: 1, topic: 'Introduction to Hermeneutics: The Authority of Scripture', description: 'Canonization, divine inspiration (2 Tim 3:16), and the illumination of the Holy Spirit.', scriptureReferences: ['2 Timothy 3:16-17', '2 Peter 1:20-21'] },
      { week: 2, topic: 'Literary Context & Genre Analysis', description: 'Interpreting Narrative, Epistles, Wisdom Literature, and Apocalyptic texts correctly.', scriptureReferences: ['Proverbs 1:1-7', 'Revelation 1:1-3'] },
      { week: 3, topic: 'Historical & Cultural Milieu', description: 'Ancient Near Eastern culture, Greco-Roman world, and Jewish customs behind New Testament epistles.', scriptureReferences: ['1 Corinthians 11:2-16', 'Galatians 3:23-29'] },
      { week: 4, topic: 'Grammatical and Theological Syntax', description: 'Word studies, verb tenses, rhetorical devices, and cross-referencing analogia fidei.', scriptureReferences: ['Romans 8:28-39', 'Ephesians 2:1-10'] },
      { week: 5, topic: 'The Christocentric Principle', description: 'Seeing Christ in all Scriptures from Genesis to Revelation (Luke 24:27, 44-45).', scriptureReferences: ['Luke 24:25-27', 'John 5:39'] },
      { week: 6, topic: 'Homiletical Application & Hermeneutics Defense', description: 'Bridge-building from the ancient text to contemporary pulpit application.', scriptureReferences: ['Nehemiah 8:8', 'Ezra 7:10'] }
    ],
    isActive: true
  },
  {
    id: 'crs_evangelism',
    code: 'SOM-102',
    title: 'Evangelism & The Great Commission',
    coreModuleNumber: 2,
    credits: 5.0,
    department: 'Practical Ministry',
    level: 'Foundation',
    description: 'Foundations and practical mechanics of soul winning, street and community outreach, personal witnessing, the Matthew 28 mandate, overcoming gospel objections, and follow-up discipleship.',
    learningOutcomes: [
      'Articulate the core message of the Gospel with clarity and conviction',
      'Conduct effective community street outreach and altar counseling',
      'Address common intellectual and spiritual objections to Christianity with grace',
      'Establish a structured new convert follow-up and discipleship pipeline'
    ],
    prerequisites: ['SOM-101 Biblical Hermeneutics & Exegesis'],
    syllabusOutline: [
      { week: 1, topic: 'The Great Commission Mandate', description: 'Exegetical analysis of Matthew 28:18-20, Mark 16:15-18, and Acts 1:8.', scriptureReferences: ['Matthew 28:18-20', 'Acts 1:8'] },
      { week: 2, topic: 'The Power of Personal Testimony', description: 'Crafting and sharing your redemption testimony like Paul before Agrippa.', scriptureReferences: ['Acts 26:1-23', 'Revelation 12:11'] },
      { week: 3, topic: 'Apologetics in Everyday Soul Winning', description: 'Responding to atheism, universalism, cults, and religious pluralism.', scriptureReferences: ['1 Peter 3:15', 'Colossians 4:5-6'] },
      { week: 4, topic: 'Field Practicum: Street Outreach & Intercession', description: 'Pre-outreach prayer warfare and direct street evangelism deployment.', scriptureReferences: ['Luke 10:1-12', 'Romans 10:13-15'] },
      { week: 5, topic: 'Discipleship & Follow-up Protocols', description: 'Retaining the harvest: assimilation into local church fellowship.', scriptureReferences: ['2 Timothy 2:2', 'Acts 2:41-47'] }
    ],
    isActive: true
  },
  {
    id: 'crs_ethics',
    code: 'SOM-103',
    title: 'Ministerial Ethics & Pastoral Integrity',
    coreModuleNumber: 3,
    credits: 5.0,
    department: 'Theology & Ethics',
    level: 'Diploma',
    description: 'Spiritual, moral, financial, and fiduciary standards expected of five-fold leaders. Covers ministerial confidentiality, conflict resolution, pulpit stewardship, sexual purity, and institutional transparency.',
    learningOutcomes: [
      'Maintain biblical ethical boundaries in pastoral counseling and leadership',
      'Understand fiduciary responsibility, church financial auditing, and tax compliance',
      'Resolve church conflict through biblical reconciliation protocols (Matthew 18)',
      'Protect ministerial calling from moral failure, burnout, and disqualification'
    ],
    prerequisites: ['SOM-101 Biblical Hermeneutics & Exegesis'],
    syllabusOutline: [
      { week: 1, topic: 'The Character Requirements of Church Leaders', description: 'In-depth study of 1 Timothy 3 and Titus 1 leadership standards.', scriptureReferences: ['1 Timothy 3:1-13', 'Titus 1:5-9'] },
      { week: 2, topic: 'Pastoral Counseling & Confidentiality Ethics', description: 'Privileged communication, mandatory reporting limits, and boundary protection.', scriptureReferences: ['Proverbs 11:13', 'Galatians 6:1-2'] },
      { week: 3, topic: 'Financial Integrity & Church Stewardship', description: 'Handling tithes, offerings, building funds, and accounting accountability.', scriptureReferences: ['2 Corinthians 8:20-21', 'Malachi 3:10'] },
      { week: 4, topic: 'Conflict Resolution & Matthew 18 Protocols', description: 'Restorative discipline and peacemaking among ministry teams.', scriptureReferences: ['Matthew 18:15-20', 'Romans 12:18'] }
    ],
    isActive: true
  },
  {
    id: 'crs_apostolic',
    code: 'SOM-104',
    title: 'Apostolic Governance & Five-Fold Ministry',
    coreModuleNumber: 4,
    credits: 5.0,
    department: 'Leadership & Governance',
    level: 'Degree',
    description: 'Examination of Ephesians 4:11-16 and 1 Corinthians 12 apostolic architecture. Explores governmental authority, church planting, spiritual fathers and sons, and distinguishing true apostolic order from authoritarianism.',
    learningOutcomes: [
      'Understand the biblical distinction between apostolic office and apostolic gifting',
      'Structure five-fold ministry alignment within local and network assemblies',
      'Execute strategic church planting and missionary dispatch models',
      'Recognize and counteract spiritual manipulation and false apostolic claims'
    ],
    prerequisites: ['SOM-103 Ministerial Ethics & Pastoral Integrity'],
    syllabusOutline: [
      { week: 1, topic: 'The Apostolic Foundation: Ephesians 2:20 & 4:11', description: 'Christ the Chief Cornerstone and foundational church builders.', scriptureReferences: ['Ephesians 2:20', 'Ephesians 4:11-16'] },
      { week: 2, topic: 'Apostolic Marks, Signs & Authority', description: 'Patience, signs, wonders, mighty deeds, and paternal love.', scriptureReferences: ['2 Corinthians 12:12', '1 Thessalonians 2:7-8'] },
      { week: 3, topic: 'Five-Fold Synergy & Alignment', description: 'How Apostles, Prophets, Evangelists, Pastors, and Teachers work in harmony.', scriptureReferences: ['1 Corinthians 12:28', 'Acts 13:1-3'] },
      { week: 4, topic: 'Apostolic Church Planting & Translocal Oversight', description: 'Multiplying assemblies and training elders in every city.', scriptureReferences: ['Titus 1:5', 'Acts 14:21-23'] }
    ],
    isActive: true
  },
  {
    id: 'crs_prophetic',
    code: 'SOM-105',
    title: 'Prophetic Ministry & Spiritual Discernment',
    coreModuleNumber: 5,
    credits: 5.0,
    department: 'Practical Ministry',
    level: 'Degree',
    description: 'The nature, function, and testing of prophetic ministry in the New Covenant church. Cultivating spiritual ears, delivering prophetic words with biblical modesty and love, and maintaining order (1 Cor 14).',
    learningOutcomes: [
      'Hear and discern God’s voice through Scriptural alignment and Holy Spirit promptings',
      'Apply the biblical rules of testing prophecy (1 Thessalonians 5:19-22)',
      'Administer personal and corporate prophetic words with humility and order',
      'Navigate prophetic intercession, spiritual warfare, and territorial breakthrough'
    ],
    prerequisites: ['SOM-101 Biblical Hermeneutics & Exegesis'],
    syllabusOutline: [
      { week: 1, topic: 'The New Testament Prophetic Office vs Gift of Prophecy', description: 'Fore-telling, forth-telling, and edification, exhortation, and comfort.', scriptureReferences: ['1 Corinthians 14:1-3', 'Acts 21:8-14'] },
      { week: 2, topic: 'Judging and Testing Prophecy', description: 'Scriptural alignment, Christological confession, and fruit evaluation.', scriptureReferences: ['1 Thessalonians 5:19-22', '1 John 4:1-6'] },
      { week: 3, topic: 'Prophetic Protocol & Decency in the Assembly', description: 'The spirits of prophets subject to prophets (1 Cor 14:32).', scriptureReferences: ['1 Corinthians 14:29-33', '1 Corinthians 14:40'] },
      { week: 4, topic: 'Prophetic Intercession & Spiritual Warfare', description: 'Watching upon the walls and hearing heavenly counsel.', scriptureReferences: ['Habakkuk 2:1-3', 'Isaiah 62:6-7'] }
    ],
    isActive: true
  },
  {
    id: 'crs_pastoral',
    code: 'SOM-106',
    title: 'School of the Pastors and Teachers',
    coreModuleNumber: 6,
    credits: 5.0,
    department: 'Practical Ministry',
    level: 'Executive',
    description: 'The art and science of pastoral shepherding, expository sermon delivery (homiletics), discipleship curriculum design, hospital and crisis visitation, and building sustainable ministerial institutions.',
    learningOutcomes: [
      'Prepare and deliver compelling expository sermons that transform lives',
      'Provide compassionate, spiritually sound pastoral counseling during family crises',
      'Design structured adult and youth Bible training curricula',
      'Build long-term ministry infrastructure, elder boards, and deaconate teams'
    ],
    prerequisites: ['SOM-103 Ministerial Ethics & Pastoral Integrity'],
    syllabusOutline: [
      { week: 1, topic: 'The Heart of the Shepherd: 1 Peter 5 & John 21', description: 'Feeding the lambs, guarding the flock, and not lording over God’s heritage.', scriptureReferences: ['1 Peter 5:1-4', 'John 21:15-17'] },
      { week: 2, topic: 'Expository Preaching (Homiletics Practicum)', description: 'Structure: Introduction, Exegetical Big Idea, Illustration, and Altar Call.', scriptureReferences: ['2 Timothy 4:1-5', '1 Timothy 4:13'] },
      { week: 3, topic: 'Crisis Pastoral Care & Bereavement Ministry', description: 'Conducting Christian weddings, funerals, and emergency hospital care.', scriptureReferences: ['James 5:14-16', 'Romans 12:15'] },
      { week: 4, topic: 'Teaching Sound Doctrine & Defending the Faith', description: 'Raising faithful men and women who will teach others also.', scriptureReferences: ['2 Timothy 2:2', 'Titus 2:1-8'] }
    ],
    isActive: true
  }
];

/**
 * DEFAULT COURSE OFFERINGS
 * Here is the exact realization of the user's requirement:
 * Course: Biblical Hermeneutics
 * Course Offering: Biblical Hermeneutics - 2026 Semester 1, Lecturer: Pastor John
 * AND
 * Course Offering: Biblical Hermeneutics - 2026 Semester 2, Lecturer: Rev. Samuel Selkridge
 *
 * This allows reusing the same course every year without duplicating the entire course definition!
 */
export const DEFAULT_COURSE_OFFERINGS: CourseOffering[] = [
  // 1. OFFERING: Biblical Hermeneutics in 2026 Semester 1 (Pastor John)
  {
    id: 'offering_som101_2026_s1',
    courseId: 'crs_hermeneutics',
    courseCode: 'SOM-101',
    courseTitle: 'Biblical Hermeneutics & Exegesis',
    academicYearId: 'ay_2025_2026',
    academicYearName: '2025–2026 Academic Year',
    termId: 'term_2026_s1',
    termName: '2026 Semester 1 (Spring/Winter)',
    section: 'Section 01 (Evening Sanctuary & Global Stream)',
    scheduleDays: 'Tuesdays & Thursdays (7:00 PM - 9:00 PM EST)',
    location: 'Main Sanctuary Lecture Hall & Zoom Live',
    zoomLink: 'https://zoom.us/j/hteim-hermeneutics-2026',
    capacity: 45,
    status: 'active',
    credits: 5.0,
    
    // ├── Lecturer
    lecturer: {
      id: 'lec_pastor_john',
      name: 'Pastor John Selkridge',
      title: 'Senior Faculty & Professor of Biblical Languages',
      email: 'pastor.john@hteim.edu',
      bio: 'Over 22 years of expository preaching, Hebrew and Greek exegesis, and pastoral mentorship across the Caribbean and North America.',
      officeHours: 'Tuesdays 4:00 PM - 6:00 PM EST via Zoom or Campus Study',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    },

    // ├── Enrolled Students
    enrolledStudents: [
      {
        studentId: 'st_1',
        studentName: 'Candice Pierre',
        studentNumber: 'HTEIM-2026-001',
        email: 'candice.pierre@hteim.edu',
        cohortLevel: 'Level 1 Foundation',
        enrolledAt: '2026-01-10',
        status: 'enrolled',
        attendanceRate: 94.1,
        assignmentsScore: 92.0,
        examsScore: 95.0,
        finalGrade: 93.8,
        letterGrade: 'A',
        standing: 'high_distinction',
        notes: 'Outstanding exegetical precision in Pauline Epistle studies.'
      },
      {
        studentId: 'st_2',
        studentName: 'Akeem Pierre',
        studentNumber: 'HTEIM-2026-002',
        email: 'akeem.pierre@hteim.edu',
        cohortLevel: 'Level 1 Foundation',
        enrolledAt: '2026-01-10',
        status: 'enrolled',
        attendanceRate: 88.2,
        assignmentsScore: 86.5,
        examsScore: 89.0,
        finalGrade: 87.8,
        letterGrade: 'A',
        standing: 'high_distinction',
        notes: 'Strong participation and deep theological reflections.'
      },
      {
        studentId: 'st_3',
        studentName: 'Shellon Liddel',
        studentNumber: 'HTEIM-2026-003',
        email: 'shellon.liddel@hteim.edu',
        cohortLevel: 'Level 1 Foundation',
        enrolledAt: '2026-01-10',
        status: 'enrolled',
        attendanceRate: 82.4,
        assignmentsScore: 80.0,
        examsScore: 81.5,
        finalGrade: 81.4,
        letterGrade: 'B',
        standing: 'satisfactory',
        notes: 'Consistent attendance and good grasp of historical context.'
      },
      {
        studentId: 'st_4',
        studentName: 'David Marshall',
        studentNumber: 'HTEIM-2026-004',
        email: 'david.marshall@hteim.edu',
        cohortLevel: 'Level 1 Foundation',
        enrolledAt: '2026-01-10',
        status: 'at_risk',
        attendanceRate: 64.7, // Below 75% at-risk trigger
        assignmentsScore: 68.0,
        examsScore: 65.0,
        finalGrade: 66.2,
        letterGrade: 'D',
        standing: 'at_risk',
        notes: 'At-risk attendance trigger active (< 75%). Pastoral contact initiated.'
      },
      {
        studentId: 'st_5',
        studentName: 'Esther George',
        studentNumber: 'HTEIM-2026-005',
        email: 'esther.george@hteim.edu',
        cohortLevel: 'Level 1 Foundation',
        enrolledAt: '2026-01-10',
        status: 'enrolled',
        attendanceRate: 91.2,
        assignmentsScore: 90.0,
        examsScore: 88.0,
        finalGrade: 89.8,
        letterGrade: 'A',
        standing: 'high_distinction'
      },
      {
        studentId: 'st_6',
        studentName: 'Michael Browne',
        studentNumber: 'HTEIM-2026-006',
        email: 'michael.browne@hteim.edu',
        cohortLevel: 'Level 1 Foundation',
        enrolledAt: '2026-01-10',
        status: 'enrolled',
        attendanceRate: 76.5,
        assignmentsScore: 78.0,
        examsScore: 75.0,
        finalGrade: 76.6,
        letterGrade: 'C',
        standing: 'satisfactory'
      }
    ],

    // ├── Attendance
    attendance: [
      {
        id: 'att_som101_s1',
        sessionNumber: 1,
        date: '2026-01-13',
        topic: 'Session 1: Divine Inspiration & The Canon of Scripture',
        records: [
          { studentName: 'Candice Pierre', status: 'Present' },
          { studentName: 'Akeem Pierre', status: 'Present' },
          { studentName: 'Shellon Liddel', status: 'Present' },
          { studentName: 'David Marshall', status: 'Absent', notes: 'Unexcused work conflict' },
          { studentName: 'Esther George', status: 'Present' },
          { studentName: 'Michael Browne', status: 'Present' }
        ],
        presentCount: 5,
        absentCount: 1,
        excusedCount: 0,
        attendanceRate: 83.3
      },
      {
        id: 'att_som101_s2',
        sessionNumber: 2,
        date: '2026-01-15',
        topic: 'Session 2: Historical-Grammatical Method & Avoiding Eisegesis',
        records: [
          { studentName: 'Candice Pierre', status: 'Present' },
          { studentName: 'Akeem Pierre', status: 'Present' },
          { studentName: 'Shellon Liddel', status: 'Present' },
          { studentName: 'David Marshall', status: 'Present' },
          { studentName: 'Esther George', status: 'Present' },
          { studentName: 'Michael Browne', status: 'Present' }
        ],
        presentCount: 6,
        absentCount: 0,
        excusedCount: 0,
        attendanceRate: 100.0
      },
      {
        id: 'att_som101_s3',
        sessionNumber: 3,
        date: '2026-01-20',
        topic: 'Session 3: Old Testament Types, Shadows, and Covenantal Law',
        records: [
          { studentName: 'Candice Pierre', status: 'Present' },
          { studentName: 'Akeem Pierre', status: 'Present' },
          { studentName: 'Shellon Liddel', status: 'Excused', notes: 'Medical appointment' },
          { studentName: 'David Marshall', status: 'Absent' },
          { studentName: 'Esther George', status: 'Present' },
          { studentName: 'Michael Browne', status: 'Present' }
        ],
        presentCount: 4,
        absentCount: 1,
        excusedCount: 1,
        attendanceRate: 83.3
      },
      {
        id: 'att_som101_s4',
        sessionNumber: 4,
        date: '2026-01-22',
        topic: 'Session 4: Exegesis of Romans 8: Christological Center',
        records: [
          { studentName: 'Candice Pierre', status: 'Present' },
          { studentName: 'Akeem Pierre', status: 'Present' },
          { studentName: 'Shellon Liddel', status: 'Present' },
          { studentName: 'David Marshall', status: 'Absent' },
          { studentName: 'Esther George', status: 'Present' },
          { studentName: 'Michael Browne', status: 'Present' }
        ],
        presentCount: 5,
        absentCount: 1,
        excusedCount: 0,
        attendanceRate: 83.3
      }
    ],

    // ├── Assignments
    assignments: [
      {
        id: 'asg_som101_1',
        title: 'Exegetical Paper: Romans 8:28-30 Contextual Analysis',
        description: 'Conduct a thorough historical-grammatical exegesis of Romans 8:28-30. Identify rhetorical flow, key Greek word origins (prognosis, proorizo), and avoid Calvinist/Arminian eisegesis.',
        type: 'exegesis',
        maxPoints: 100,
        weight: 25,
        dueDate: '2026-02-15',
        submissionsCount: 6,
        gradedCount: 6,
        avgScore: 84.5,
        rubricCriteria: [
          { name: 'Historical & Literary Context', maxPoints: 30, description: 'Correctly identifies audience, occasion, and surrounding chapter flow' },
          { name: 'Word & Syntax Analysis', maxPoints: 40, description: 'Examines Greek root nuances and biblical cross-references' },
          { name: 'Ministerial Application', maxPoints: 30, description: 'Sound pastoral and practical application without twisting Scripture' }
        ]
      },
      {
        id: 'asg_som101_2',
        title: 'Sermon Outline: The Christocentric Principle in Genesis 22',
        description: 'Develop an expository sermon outline showing how Abraham offering Isaac in Genesis 22 prefigures God offering His only begotten Son at Calvary.',
        type: 'essay',
        maxPoints: 100,
        weight: 20,
        dueDate: '2026-03-10',
        submissionsCount: 6,
        gradedCount: 5,
        avgScore: 88.0
      }
    ],

    // ├── Exams
    exams: [
      {
        id: 'exam_som101_mid',
        title: 'Midterm Examination: Hermeneutical Rules & Textual Criticism',
        description: 'Comprehensive mid-term evaluation of canonization, translation methodologies, hermeneutical axioms, and fallacy identification.',
        examType: 'midterm',
        totalPoints: 100,
        weight: 25,
        examDate: '2026-03-24',
        durationMinutes: 90,
        status: 'graded',
        avgScore: 85.2,
        passingScore: 75.0
      },
      {
        id: 'exam_som101_final',
        title: 'Final Examination: Comprehensive Biblical Exegesis Defense',
        description: 'End-of-term oral and written defense demonstrating mastery of Hermeneutics across both Testaments.',
        examType: 'final',
        totalPoints: 100,
        weight: 30,
        examDate: '2026-05-19',
        durationMinutes: 120,
        status: 'scheduled',
        avgScore: 0,
        passingScore: 75.0
      }
    ],

    // ├── Grades
    grades: [
      {
        studentName: 'Candice Pierre',
        studentNumber: 'HTEIM-2026-001',
        assignmentGrades: { asg_som101_1: 96, asg_som101_2: 98 },
        examGrades: { exam_som101_mid: 95 },
        attendancePercentage: 94.1,
        weightedScore: 95.2,
        letterGrade: 'A',
        standing: 'high_distinction',
        isPublished: true,
        facultyFeedback: 'Exceptional depth of scholarship and clear pastoral communication.'
      },
      {
        studentName: 'Akeem Pierre',
        studentNumber: 'HTEIM-2026-002',
        assignmentGrades: { asg_som101_1: 88, asg_som101_2: 90 },
        examGrades: { exam_som101_mid: 89 },
        attendancePercentage: 88.2,
        weightedScore: 88.6,
        letterGrade: 'A',
        standing: 'high_distinction',
        isPublished: true,
        facultyFeedback: 'Consistent high effort with great theological insight.'
      },
      {
        studentName: 'Shellon Liddel',
        studentNumber: 'HTEIM-2026-003',
        assignmentGrades: { asg_som101_1: 82, asg_som101_2: 84 },
        examGrades: { exam_som101_mid: 80 },
        attendancePercentage: 82.4,
        weightedScore: 81.9,
        letterGrade: 'B',
        standing: 'satisfactory',
        isPublished: true,
        facultyFeedback: 'Good solid work. Ensure cross-references to original Greek are expanded.'
      },
      {
        studentName: 'David Marshall',
        studentNumber: 'HTEIM-2026-004',
        assignmentGrades: { asg_som101_1: 68, asg_som101_2: 65 },
        examGrades: { exam_som101_mid: 64 },
        attendancePercentage: 64.7,
        weightedScore: 65.4,
        letterGrade: 'D',
        standing: 'at_risk',
        isPublished: true,
        facultyFeedback: 'At-risk warning: Attendance is currently below 75% policy. Please meet with the Dean of Students.'
      },
      {
        studentName: 'Esther George',
        studentNumber: 'HTEIM-2026-005',
        assignmentGrades: { asg_som101_1: 91, asg_som101_2: 92 },
        examGrades: { exam_som101_mid: 88 },
        attendancePercentage: 91.2,
        weightedScore: 90.1,
        letterGrade: 'A',
        standing: 'high_distinction',
        isPublished: true
      },
      {
        studentName: 'Michael Browne',
        studentNumber: 'HTEIM-2026-006',
        assignmentGrades: { asg_som101_1: 76, asg_som101_2: 80 },
        examGrades: { exam_som101_mid: 75 },
        attendancePercentage: 76.5,
        weightedScore: 76.8,
        letterGrade: 'C',
        standing: 'satisfactory',
        isPublished: true
      }
    ]
  },

  // 2. OFFERING: Biblical Hermeneutics REUSED in 2026 Semester 2 (Lecturer: Rev. Samuel Selkridge)
  // Demonstrates reusing the exact same master course definition for a new semester and lecturer!
  {
    id: 'offering_som101_2026_s2',
    courseId: 'crs_hermeneutics',
    courseCode: 'SOM-101',
    courseTitle: 'Biblical Hermeneutics & Exegesis',
    academicYearId: 'ay_2025_2026',
    academicYearName: '2025–2026 Academic Year',
    termId: 'term_2026_s2',
    termName: '2026 Semester 2 (Summer/Fall)',
    section: 'Section 02 (Weekend Intensive & Global Stream)',
    scheduleDays: 'Saturdays (9:00 AM - 1:00 PM EST)',
    location: 'HTEIM Main Sanctuary & Zoom Live',
    zoomLink: 'https://zoom.us/j/hteim-hermeneutics-summer2026',
    capacity: 40,
    status: 'upcoming',
    credits: 5.0,
    
    // ├── Lecturer
    lecturer: {
      id: 'lec_rev_samuel',
      name: 'Rev. Dr. Samuel Selkridge',
      title: 'President & Senior Academic Faculty',
      email: 'dr.selkridge@hteim.edu',
      bio: 'Founding leader and apostolic scholar with decades of academic administration and theological teaching.',
      officeHours: 'Thursdays 2:00 PM - 4:00 PM EST',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    enrolledStudents: [],
    attendance: [],
    assignments: [
      {
        id: 'asg_som101_s2_1',
        title: 'Exegetical Synthesis: Genesis Covenant Architecture',
        description: 'Examine the Abrahamic, Mosaic, and Davidic covenants through historical exegesis.',
        type: 'exegesis',
        maxPoints: 100,
        weight: 30,
        dueDate: '2026-07-25',
        submissionsCount: 0,
        gradedCount: 0,
        avgScore: 0
      }
    ],
    exams: [
      {
        id: 'exam_som101_s2_final',
        title: 'Comprehensive Hermeneutical Practicum Exam',
        description: 'Written exegesis of unassigned biblical passages under timed conditions.',
        examType: 'final',
        totalPoints: 100,
        weight: 40,
        examDate: '2026-10-10',
        durationMinutes: 120,
        status: 'scheduled',
        avgScore: 0,
        passingScore: 75.0
      }
    ],
    grades: []
  },

  // 3. OFFERING: Evangelism & Great Commission (SOM-102) in 2026 Semester 1 (Minister Christy Ruben)
  {
    id: 'offering_som102_2026_s1',
    courseId: 'crs_evangelism',
    courseCode: 'SOM-102',
    courseTitle: 'Evangelism & The Great Commission',
    academicYearId: 'ay_2025_2026',
    academicYearName: '2025–2026 Academic Year',
    termId: 'term_2026_s1',
    termName: '2026 Semester 1 (Spring/Winter)',
    section: 'Section 01 (Classroom & Field Outreach)',
    scheduleDays: 'Mondays (7:00 PM - 9:00 PM EST) & Saturday Outreach',
    location: 'HTEIM Outreach Training Hall & City Field Work',
    capacity: 50,
    status: 'active',
    credits: 5.0,
    lecturer: {
      id: 'lec_min_christy',
      name: 'Minister Christy Ruben',
      title: 'Evangelism Field Director & Faculty',
      email: 'christy.ruben@hteim.edu',
      bio: 'Pioneered regional city evangelism campaigns, soul winning mentorship, and prison ministry outreach.',
      officeHours: 'Mondays 5:00 PM - 6:30 PM EST',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    enrolledStudents: [
      {
        studentId: 'st_1',
        studentName: 'Candice Pierre',
        studentNumber: 'HTEIM-2026-001',
        cohortLevel: 'Level 1 Foundation',
        enrolledAt: '2026-01-10',
        status: 'enrolled',
        attendanceRate: 92.5,
        assignmentsScore: 94.0,
        examsScore: 91.0,
        finalGrade: 92.5,
        letterGrade: 'A',
        standing: 'high_distinction'
      },
      {
        studentId: 'st_2',
        studentName: 'Akeem Pierre',
        studentNumber: 'HTEIM-2026-002',
        cohortLevel: 'Level 1 Foundation',
        enrolledAt: '2026-01-10',
        status: 'enrolled',
        attendanceRate: 85.0,
        assignmentsScore: 88.0,
        examsScore: 86.0,
        finalGrade: 86.3,
        letterGrade: 'A',
        standing: 'high_distinction'
      }
    ],
    attendance: [],
    assignments: [
      {
        id: 'asg_som102_field',
        title: 'Field Evangelism Practicum & Discipleship Log',
        description: 'Document 10 personal soul-winning encounters, prayer points, and follow-up contact details.',
        type: 'practicum',
        maxPoints: 100,
        weight: 40,
        dueDate: '2026-03-30',
        submissionsCount: 2,
        gradedCount: 2,
        avgScore: 91.0
      }
    ],
    exams: [
      {
        id: 'exam_som102_quiz',
        title: 'Matthew 28 Mandate & Apologetics Assessment',
        description: 'Multiple-choice and short-essay evaluation on defending the resurrection.',
        examType: 'quiz',
        totalPoints: 50,
        weight: 20,
        examDate: '2026-02-23',
        durationMinutes: 45,
        status: 'graded',
        avgScore: 88.5,
        passingScore: 75.0
      }
    ],
    grades: []
  },

  // 4. OFFERING: Ministerial Ethics & Integrity (SOM-103) in 2026 Semester 1
  {
    id: 'offering_som103_2026_s1',
    courseId: 'crs_ethics',
    courseCode: 'SOM-103',
    courseTitle: 'Ministerial Ethics & Pastoral Integrity',
    academicYearId: 'ay_2025_2026',
    academicYearName: '2025–2026 Academic Year',
    termId: 'term_2026_s1',
    termName: '2026 Semester 1 (Spring/Winter)',
    section: 'Section 01 (Executive Evening)',
    scheduleDays: 'Wednesdays (7:00 PM - 9:00 PM EST)',
    location: 'Leadership Conference Center & Broadcast',
    capacity: 40,
    status: 'active',
    credits: 5.0,
    lecturer: {
      id: 'lec_rev_gillian',
      name: 'Rev. Gillian Selkridge',
      title: 'Vice President & Faculty Dean',
      email: 'rev.gillian@hteim.edu',
      bio: 'Renowned counselor, biblical ethics authority, and ministerial leader in marriage and family ministry.',
      officeHours: 'Wednesdays 3:00 PM - 5:00 PM EST',
      avatarUrl: 'https://images.unsplash.com/photo-1580894732470-349884e861d8?w=150&auto=format&fit=crop&q=80'
    },
    enrolledStudents: [],
    attendance: [],
    assignments: [],
    exams: [],
    grades: []
  },

  // 5. OFFERING: Apostolic Governance & Five-Fold Ministry (SOM-104) in 2026 Semester 1
  {
    id: 'offering_som104_2026_s1',
    courseId: 'crs_apostolic',
    courseCode: 'SOM-104',
    courseTitle: 'Apostolic Governance & Five-Fold Ministry',
    academicYearId: 'ay_2025_2026',
    academicYearName: '2025–2026 Academic Year',
    termId: 'term_2026_s1',
    termName: '2026 Semester 1 (Spring/Winter)',
    section: 'Section 01 (Advanced Ministerial Track)',
    scheduleDays: 'Fridays (7:00 PM - 9:30 PM EST)',
    location: 'Main Sanctuary & Global Apostolic Room',
    capacity: 40,
    status: 'active',
    credits: 5.0,
    lecturer: {
      id: 'lec_apostle_kendell',
      name: 'Apostle Dr. Kendell Pierre',
      title: 'Presiding Apostle & General Overseer',
      email: 'apostle.kendell@hteim.edu',
      bio: 'Visionary founder of Heaven Touching Earth International Ministries, apostle to the nations, author, and father to ministries worldwide.',
      officeHours: 'By Appointment via Executive Secretariat',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    enrolledStudents: [],
    attendance: [],
    assignments: [],
    exams: [],
    grades: []
  }
];

export const INITIAL_ACADEMIC_STRUCTURE: AcademicStructureData = {
  academicYears: DEFAULT_ACADEMIC_YEARS,
  terms: DEFAULT_TERMS,
  masterCourses: DEFAULT_MASTER_COURSES,
  courseOfferings: DEFAULT_COURSE_OFFERINGS,
  activeAcademicYearId: 'ay_2025_2026',
  activeTermId: 'term_2026_s1',
  policyThresholds: {
    atRiskAttendance: 75,
    criticalAttendance: 50,
    highDistinctionGrade: 85,
    satisfactoryGrade: 75
  }
};
