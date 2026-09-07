import { LibraryResource, MediaResource } from '../../types';

export type { LibraryResource, MediaResource };

export interface LibraryFilterOptions {
  searchQuery: string;
  category: string;
  moduleCode?: string;
  mediaType?: 'all' | 'pdf' | 'docx' | 'audio' | 'video' | 'link';
}

export const LIBRARY_CATEGORIES = [
  { id: 'all', label: 'All Resources' },
  { id: 'handout', label: 'Lecture Handouts' },
  { id: 'textbook', label: 'Required Textbooks' },
  { id: 'audio', label: 'Audio Lectures' },
  { id: 'video', label: 'Video Broadcasts' },
  { id: 'syllabus', label: 'Course Syllabi' },
  { id: 'archive', label: 'Ministry Archives' },
];
