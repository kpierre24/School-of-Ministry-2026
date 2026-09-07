import { StudentClassNote, getStudentNotes, saveStudentNotes } from '../../utils/notesStorage';
import { NoteFilterOptions } from './notesSchemas';

export class NotesService {
  /**
   * Filter student notes by search query, day, or tag
   */
  public filterNotes(
    notes: StudentClassNote[],
    options: NoteFilterOptions
  ): StudentClassNote[] {
    const q = options.searchQuery.toLowerCase().trim();

    return notes.filter(n => {
      const matchSearch = !q ||
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(q)));

      const matchDay = !options.dayId || options.dayId === 'all' || n.classDayId === options.dayId;
      const matchTag = !options.tag || options.tag === 'all' || (n.tags && n.tags.includes(options.tag));

      return matchSearch && matchDay && matchTag;
    });
  }

  /**
   * Fetch notes for student from local storage
   */
  public loadNotesForStudent(studentName?: string): StudentClassNote[] {
    return getStudentNotes(studentName);
  }

  /**
   * Save notes list to local storage
   */
  public persistNotesForStudent(studentName: string | undefined, notes: StudentClassNote[]): void {
    saveStudentNotes(studentName, notes);
  }
}

export const notesService = new NotesService();
