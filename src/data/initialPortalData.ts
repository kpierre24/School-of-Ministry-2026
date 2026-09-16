import { 
  PaymentRecord, 
  CustomAssignment, 
  AssignmentSubmission, 
  ScheduleItem, 
  LibraryResource, 
  AppMessage, 
  Course 
} from '../types';

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    "id": "pay-sheet-1",
    "studentName": "Afeshia Burke",
    "studentId": "HTEIM-2026-1226",
    "email": "afeshiajones16@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 600,
    "status": "Partial",
    "lastPaymentDate": "8th april 2026",
    "paymentMethod": "Cash",
    "notes": "Google Sheet Record #1. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $400 on 8th June 2026, $200 on 8th april 2026."
  },
  {
    "id": "pay-sheet-2",
    "studentName": "Afi Thompson",
    "studentId": "HTEIM-2026-1160",
    "email": "Afireforestation2016@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #2. Country: Tobago. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-3",
    "studentName": "ANNE-MARIE DAVIS",
    "studentId": "HTEIM-2026-1108",
    "email": "annejazz2014@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 600,
    "status": "Partial",
    "lastPaymentDate": "22/03/2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #3. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $400 on 20/05/2026, $200 on 22/03/2026."
  }
];

export const INITIAL_ASSIGNMENTS: CustomAssignment[] = [];
export const INITIAL_SUBMISSIONS: AssignmentSubmission[] = [];
export const INITIAL_SCHEDULE: ScheduleItem[] = [];
export const INITIAL_MESSAGES: AppMessage[] = [];
export const INITIAL_COURSES: Course[] = [];

export const INITIAL_RESOURCES: LibraryResource[] = [
  {
    id: 'res_som_mod4_video',
    title: 'Livestream Video: Apostolic Governance & Five-Fold Ministry Alignment',
    category: 'Livestream Recording',
    author: 'Apostle Dr. Kendell Pierre',
    courseCode: 'SOM-MOD-4',
    moduleTrack: 'SOM-MOD-4',
    format: 'VIDEO',
    size: '1.2 GB (HD Video)',
    downloadUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    summary: 'Official HTEIM livestream video recording covering foundational apostolic architecture, Ephesians 4:11 five-fold alignment, and spiritual governance.',
    keyTakeaways: [
      'Apostolic foundation based on Ephesians 2:20 & 4:11',
      'Synergy between Apostle, Prophet, Evangelist, Pastor, and Teacher',
      'Governmental authority and building spiritual fathers'
    ],
    fullContent: 'HTEIM School of Ministry Module 4: Apostolic Governance & Five-Fold Alignment\nInstructor: Apostle Dr. Kendell Pierre\n\n1. Apostolic Foundations\n2. Five-Fold Ministry Mechanics\n3. Spiritual Authority and Order\n4. Commissioning and Global Impact.',
    aiEvaluated: true,
    isRequiredReading: true,
    uploadedAt: '2026-08-25'
  },
  {
    id: 'res_som_mod5_video',
    title: 'Livestream Video: Prophetic Ministry, Spiritual Discernment & Warfare',
    category: 'Livestream Recording',
    author: 'Apostolic Faculty Team',
    courseCode: 'SOM-MOD-5',
    moduleTrack: 'SOM-MOD-5',
    format: 'VIDEO',
    size: '950 MB (HD Video)',
    downloadUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    summary: 'Classroom video recording on cultivating spiritual discernment, testing prophecy according to scripture, and prophetic assembly protocols.',
    keyTakeaways: [
      'Distinction between gift of prophecy and prophetic office',
      'Testing prophecy by scripture and spiritual fruit (1 Cor 14)',
      'Prophetic protocol in ministry assemblies'
    ],
    fullContent: 'HTEIM School of Ministry Module 5: Prophetic Ministry & Spiritual Discernment\n\n1. The Operation of Prophecy\n2. Judging and Discerning Spiritual Manifestations\n3. Warfare and Prophetic Intercession\n4. Order in the Sanctuary.',
    aiEvaluated: true,
    isRequiredReading: true,
    uploadedAt: '2026-08-26'
  }
];
