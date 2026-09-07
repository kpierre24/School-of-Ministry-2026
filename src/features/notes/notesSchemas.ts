import { StudentClassNote, STARTER_STUDENT_NOTES } from '../../utils/notesStorage';

export type { StudentClassNote };
export { STARTER_STUDENT_NOTES };

export type LayoutMode = 'parallel' | 'notes-wide' | 'bible-wide' | 'notes-only' | 'bible-only';

export interface NoteFilterOptions {
  searchQuery: string;
  dayId?: string;
  tag?: string;
}
