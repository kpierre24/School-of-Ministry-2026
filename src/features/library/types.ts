import { LibraryResource as BaseLibraryResource } from '../../types';

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
