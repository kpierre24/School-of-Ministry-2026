import { useState, useMemo, useEffect, useCallback } from 'react';
import { StudentClassNote } from '../../utils/notesStorage';
import { LayoutMode } from './notesSchemas';
import { notesService } from './notesService';

export function useStudentNotesState(studentName?: string) {
  const [notes, setNotes] = useState<StudentClassNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('parallel');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState('all');

  useEffect(() => {
    const loaded = notesService.loadNotesForStudent(studentName);
    setNotes(loaded);
    if (loaded.length > 0) {
      setActiveNoteId(loaded[0].id);
    }
  }, [studentName]);

  const saveNotes = useCallback((updatedNotes: StudentClassNote[]) => {
    setNotes(updatedNotes);
    notesService.persistNotesForStudent(studentName, updatedNotes);
  }, [studentName]);

  const activeNote = useMemo(() => {
    return notes.find(n => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  const filteredNotes = useMemo(() => {
    return notesService.filterNotes(notes, {
      searchQuery,
      dayId: selectedDay,
    });
  }, [notes, searchQuery, selectedDay]);

  return {
    notes,
    setNotes: saveNotes,
    activeNoteId,
    setActiveNoteId,
    activeNote,
    layoutMode,
    setLayoutMode,
    searchQuery,
    setSearchQuery,
    selectedDay,
    setSelectedDay,
    filteredNotes,
  };
}
