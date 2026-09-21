import { LibraryResource as BaseLibraryResource, ResourceVersion } from '../../types';

export type ResourceType =
  | 'document'
  | 'pdf'
  | 'video'
  | 'audio'
  | 'image'
  | 'presentation'
  | 'link'
  | 'scripture';

export type ResourceSource =
  | 'upload'
  | 'youtube'
  | 'vimeo'
  | 'external'
  | 'storage';

export type ResourceStatus =
  | 'draft'
  | 'published'
  | 'archived';

export type ResourceAccessLevel =
  | 'everyone'
  | 'students'
  | 'teachers'
  | 'specific-course'
  | 'specific-module';

export type ResourceViewerType =
  | 'pdf-viewer'
  | 'document-viewer'
  | 'video-player'
  | 'audio-player'
  | 'image-viewer'
  | 'presentation-viewer'
  | 'external-link'
  | 'scripture-viewer';

export interface LearningResource {
  id: string;

  title: string;
  description?: string;

  type: ResourceType;
  source: ResourceSource;

  url?: string;
  storagePath?: string;
  thumbnailUrl?: string;

  courseId?: string;
  moduleId?: string;
  lessonId?: string;

  category?: string;
  tags: string[];

  uploadedBy: string;

  status: ResourceStatus;
  accessLevel?: ResourceAccessLevel;
  accessCourseId?: string;
  accessModuleId?: string;

  isDownloadable: boolean;
  isPublished: boolean;

  createdAt: string;
  updatedAt: string;

  // Domain & Curriculum metadata
  author?: string;
  size?: string;
  mimeType?: string;
  fileName?: string;
  fileDataUrl?: string;
  fullContent?: string;
  durationSeconds?: number;
  pageCount?: number;
  weekNumber?: number;
  isRequiredReading?: boolean;
  scriptureReferences?: string[];
  version?: string;
  versionsHistory?: ResourceVersion[];
  completedByStudents?: string[];
  viewCount?: number;
  downloadCount?: number;
}

/**
 * Academic Curriculum Relationships Hierarchy:
 * Course
 *   │
 *   ├── Module
 *   │     │
 *   │     ├── Lesson
 *   │     │      │
 *   │     │      ├── PDF / Lesson Notes
 *   │     │      ├── Video / Lecture Video
 *   │     │      ├── Website / Recommended Link
 *   │     │      ├── Audio / Sermon & Audio Lecture
 *   │     │      ├── Presentation / Slide Deck
 *   │     │      └── Scripture References
 *   │     │
 *   │     └── Quiz
 *   │
 *   └── Assignments
 */

export interface LessonResourceBundle {
  notes: LearningResource[];
  videos: LearningResource[];
  websites: LearningResource[];
  audios: LearningResource[];
  presentations: LearningResource[];
  scriptures: string[];
  quizzes: any[]; // QuizAssignment
  assignments: any[]; // CustomAssignment
  downloadables: LearningResource[];
}

export interface AcademicLessonNode {
  id: string;
  lessonNumber: number;
  title: string;
  subtitle?: string;
  description?: string;
  moduleId: string;
  courseId: string;
  weekNumber?: number;
  date?: string;
  durationMinutes?: number;
  scriptureReferences: string[];
  keyTopics?: string[];
  resources: LearningResource[];
  quizzes: any[]; // QuizAssignment[]
  assignments: any[]; // CustomAssignment[]
  isCompleted?: boolean;
}

export interface AcademicModuleNode {
  id: string;
  code: string;
  title: string;
  fullName: string;
  description: string;
  instructor: string;
  courseId: string;
  orderIndex: number;
  credits?: number;
  lessons: AcademicLessonNode[];
  quizzes: any[]; // QuizAssignment[]
  assignments: any[]; // CustomAssignment[]
  generalResources: LearningResource[];
}

export interface AcademicCourseNode {
  id: string;
  code: string;
  title: string;
  programTitle?: string;
  instructor: string;
  credits: number;
  description: string;
  scheduleDays?: string;
  location?: string;
  modules: AcademicModuleNode[];
  courseAssignments: any[]; // CustomAssignment[]
}

export interface CurriculumHierarchy {
  courses: AcademicCourseNode[];
  selectedCourseId: string;
  selectedModuleId: string;
  selectedLessonId: string;
}

export interface Book extends BaseLibraryResource {
  isbn?: string;
  totalCopies?: number;
  availableCopies?: number;
  callNumber?: string;
  location?: string;
  coverImageUrl?: string;
  publisher?: string;
  publishYear?: number;
  weekNumber?: number;
  isRequiredReading?: boolean;
  scriptureReferences?: string[];
  completedByStudents?: string[];
  moduleTrack?: string;
}

export type LibraryResource = Book;
