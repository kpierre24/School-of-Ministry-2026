import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Calendar,
  Search,
  Plus,
  Trash2,
  Share2,
  Download,
  Printer,
  Copy,
  Check,
  Sparkles,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Filter,
  Layers,
  Columns,
  Maximize2,
  Minimize2,
  GraduationCap,
  Save,
  CheckSquare,
  Square,
  Volume2,
  FileText,
  ExternalLink,
  Tag,
  PenTool
} from 'lucide-react';
import { toast } from 'sonner';
import { AMP_BIBLE_BOOKS, searchAmpBible, AmpBook, AmpChapter, AmpVerse } from '../data/ampBible';
import { getMultiTranslationVerse } from '../data/multiTranslationBible';
import {
  StudentClassNote,
  getStudentNotes,
  saveStudentNotes,
  STARTER_STUDENT_NOTES
} from '../utils/notesStorage';

interface StudentNotesBibleTabProps {
  currentStudentName?: string;
  userRole?: string;
  availableClassDays: { id: string; name: string; date?: string }[];
  onNavigateTab?: (tab: string) => void;
}

type LayoutMode = 'parallel' | 'notes-wide' | 'bible-wide' | 'notes-only' | 'bible-only';

export const StudentNotesBibleTab: React.FC<StudentNotesBibleTabProps> = ({
  currentStudentName = 'Student',
  userRole = 'student',
  availableClassDays = [],
  onNavigateTab
}) => {
  // --- Notes State ---
  const [notes, setNotes] = useState<StudentClassNote[]>(() =>
    getStudentNotes(currentStudentName)
  );
  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    const initial = getStudentNotes(currentStudentName);
    return initial[0]?.id || '';
  });

  // Filter & Search State
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [noteSearchQuery, setNoteSearchQuery] = useState<string>('');

  // Layout Mode
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('parallel');
  const [mobileActiveTab, setMobileActiveTab] = useState<'notes' | 'bible'>('notes');

  // Auto-save feedback
  const [isSaved, setIsSaved] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState<string>(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );

  // --- Bible State ---
  const [selectedBookId, setSelectedBookId] = useState<string>('2ti');
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<number>(2);
  const [bibleSearchQuery, setBibleSearchQuery] = useState<string>('');
  const [bibleFontSize, setBibleFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copiedVerse, setCopiedVerse] = useState<string | null>(null);
  const [bibleTranslation, setBibleTranslation] = useState<'AMP' | 'KJV' | 'parallel'>('AMP');

  // Active Bible Book & Chapter
  const currentBook = useMemo(() => {
    return AMP_BIBLE_BOOKS.find(b => b.id === selectedBookId) || AMP_BIBLE_BOOKS[0];
  }, [selectedBookId]);

  const currentChapter = useMemo(() => {
    return (
      currentBook.chapters.find(c => c.chapter === selectedChapterNumber) ||
      currentBook.chapters[0] || { chapter: 1, verses: [] }
    );
  }, [currentBook, selectedChapterNumber]);

  // Bible Search Results
  const bibleSearchResults = useMemo(() => {
    if (!bibleSearchQuery || bibleSearchQuery.trim().length < 2) return [];
    return searchAmpBible(bibleSearchQuery);
  }, [bibleSearchQuery]);

  // Current active note
  const activeNote = useMemo(() => {
    return notes.find(n => n.id === activeNoteId) || notes[0] || null;
  }, [notes, activeNoteId]);

  // Save notes whenever they change
  const saveNotesTimeoutRef = useRef<any>(null);
  const updateActiveNote = (updates: Partial<StudentClassNote>) => {
    if (!activeNote) return;
    setIsSaved(false);

    setNotes(prevNotes => {
      const nextNotes = prevNotes.map(n => {
        if (n.id === activeNote.id) {
          return {
            ...n,
            ...updates,
            updatedAt: new Date().toISOString()
          };
        }
        return n;
      });

      // Debounce saving
      if (saveNotesTimeoutRef.current) clearTimeout(saveNotesTimeoutRef.current);
      saveNotesTimeoutRef.current = setTimeout(() => {
        saveStudentNotes(currentStudentName, nextNotes);
        setIsSaved(true);
        setLastSavedTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      }, 600);

      return nextNotes;
    });
  };

  // Create new note
  const handleCreateNote = (preselectedClassDay?: { id: string; name: string; date?: string }) => {
    const classDay = preselectedClassDay || availableClassDays[0] || {
      id: 'custom-session',
      name: 'General Ministry Lecture',
      date: new Date().toISOString().split('T')[0]
    };

    const newNote: StudentClassNote = {
      id: `note-${Date.now()}`,
      studentName: currentStudentName,
      title: `Notes: ${classDay.name || 'Ministry Lecture'}`,
      classDayId: classDay.id,
      classDayName: classDay.name,
      classDate: classDay.date || new Date().toISOString().split('T')[0],
      moduleCode: 'SOM-MOD-1',
      instructor: 'School of Ministry Faculty',
      content: `### Class Summary & Key Takeaways\n- Write insights from today's lecture...\n\n### Practical Ministry Application\n- How to apply this truth this week...`,
      keyScriptures: [
        '2 Timothy 2:15 (AMP) - Study and do your utmost to present yourself approved unto God, a workman that needeth not to be ashamed, accurately handling and skillfully teaching the word of truth.'
      ],
      spiritualTakeaways: 'Revelation received from today\'s class...',
      actionPoints: ['Review class slides and notes', 'Pray over key scriptures'],
      tags: ['Class Lecture', 'Curriculum Study'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    setActiveNoteId(newNote.id);
    saveStudentNotes(currentStudentName, updated);
    toast.success('New class note created');
  };

  // Delete note
  const handleDeleteNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (notes.length <= 1) {
      toast.error('You must keep at least one note.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this class note?')) {
      const updated = notes.filter(n => n.id !== id);
      setNotes(updated);
      saveStudentNotes(currentStudentName, updated);
      if (activeNoteId === id) {
        setActiveNoteId(updated[0]?.id || '');
      }
      toast.success('Note removed');
    }
  };

  // Insert AMP Scripture into Active Note
  const handleInsertScriptureIntoNote = (scriptureText: string, reference: string) => {
    if (!activeNote) {
      toast.error('Please select or create a note first.');
      return;
    }

    const formattedVerse = `${reference} - ${scriptureText}`;

    // Add to keyScriptures array if not present
    const existingScriptures = activeNote.keyScriptures || [];
    const isAlreadyPresent = existingScriptures.some(s => s.includes(reference));

    let updatedScriptures = existingScriptures;
    if (!isAlreadyPresent) {
      updatedScriptures = [...existingScriptures, formattedVerse];
    }

    // Also append to markdown note content for fluid study reading
    const appendBlock = `\n\n> **${reference}**\n> "${scriptureText}"\n`;
    const updatedContent = (activeNote.content || '') + appendBlock;

    updateActiveNote({
      keyScriptures: updatedScriptures,
      content: updatedContent
    });

    toast.success(`Inserted ${reference} into your note!`);
  };

  // Copy scripture
  const handleCopyScripture = (text: string, refStr: string) => {
    const full = `"${text}" — ${refStr}`;
    navigator.clipboard.writeText(full);
    setCopiedVerse(refStr);
    toast.success('Copied scripture to clipboard');
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  // Print / Export Active Note
  const handlePrintNote = () => {
    if (!activeNote) return;
    window.print();
  };

  // Filtered Notes List
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      // Class session filter
      if (selectedClassFilter !== 'all' && note.classDayId !== selectedClassFilter) {
        return false;
      }

      // Date filter
      if (selectedDateFilter && note.classDate !== selectedDateFilter) {
        return false;
      }

      // Module filter
      if (selectedModuleFilter !== 'all' && note.moduleCode !== selectedModuleFilter) {
        return false;
      }

      // Search Query
      if (noteSearchQuery.trim()) {
        const q = noteSearchQuery.toLowerCase();
        const matchTitle = (note.title || '').toLowerCase().includes(q);
        const matchContent = (note.content || '').toLowerCase().includes(q);
        const matchClass = (note.classDayName || '').toLowerCase().includes(q);
        const matchScriptures = (note.keyScriptures || []).some(s => s.toLowerCase().includes(q));
        const matchTags = (note.tags || []).some(t => t.toLowerCase().includes(q));
        return matchTitle || matchContent || matchClass || matchScriptures || matchTags;
      }

      return true;
    });
  }, [notes, selectedClassFilter, selectedDateFilter, selectedModuleFilter, noteSearchQuery]);

  // Unique class dates from notes
  const availableNoteDates = useMemo(() => {
    const dates = new Set<string>();
    notes.forEach(n => {
      if (n.classDate) dates.add(n.classDate);
    });
    return Array.from(dates).sort().reverse();
  }, [notes]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[650px] bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Top Header Bar: Title, Layout Switches, and Quick Controls */}
      <header className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                Student Class Notes & Amplified Bible
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#023264] text-[#dfc18b] border border-[#b38f53]/40">
                AMP Translation
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Organized by class sessions & dates</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3 h-3" /> {isSaved ? `Auto-saved ${lastSavedTime}` : 'Saving...'}
              </span>
            </p>
          </div>
        </div>

        {/* Mobile View Toggle (Notes vs Bible) */}
        <div className="flex md:hidden items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMobileActiveTab('notes')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              mobileActiveTab === 'notes'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Class Notes ({filteredNotes.length})
          </button>
          <button
            onClick={() => setMobileActiveTab('bible')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              mobileActiveTab === 'bible'
                ? 'bg-[#023264] text-[#dfc18b] shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            AMP Bible
          </button>
        </div>

        {/* Desktop Layout Split Controls */}
        <div className="hidden md:flex items-center gap-1.5">
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setLayoutMode('parallel')}
              title="Parallel Side-by-Side (50/50)"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                layoutMode === 'parallel'
                  ? 'bg-white dark:bg-slate-900 text-[#025798] dark:text-[#7dd3fc] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="text-[11px]">Parallel Split</span>
            </button>
            <button
              onClick={() => setLayoutMode('notes-wide')}
              title="Wide Notes Focus (70/30)"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                layoutMode === 'notes-wide'
                  ? 'bg-white dark:bg-slate-900 text-[#025798] dark:text-[#7dd3fc] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="text-[11px]">Notes Focus</span>
            </button>
            <button
              onClick={() => setLayoutMode('bible-wide')}
              title="Wide Bible Focus (30/70)"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                layoutMode === 'bible-wide'
                  ? 'bg-[#023264] text-[#dfc18b] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-[11px]">Bible Focus</span>
            </button>
          </div>

          <button
            onClick={() => handleCreateNote()}
            className="px-3 py-1.5 bg-[#023264] hover:bg-[#022347] text-[#dfc18b] font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 border border-[#b38f53]/40"
          >
            <Plus className="w-3.5 h-3.5 text-[#dfc18b]" />
            <span>New Class Note</span>
          </button>
        </div>
      </header>

      {/* Main Parallel Workspace */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* ========================================================================= */}
        {/* PANEL 1: CLASS NOTES WORKSPACE (Left Side in Parallel Mode) */}
        {/* ========================================================================= */}
        <div
          className={`flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-0 transition-all duration-200 ${
            mobileActiveTab !== 'notes' ? 'hidden md:flex' : 'flex'
          } ${
            layoutMode === 'parallel'
              ? 'w-full md:w-1/2'
              : layoutMode === 'notes-wide'
              ? 'w-full md:w-3/5'
              : layoutMode === 'bible-wide'
              ? 'w-full md:w-2/5'
              : layoutMode === 'notes-only'
              ? 'w-full'
              : 'hidden'
          }`}
        >
          {/* Notes Sub-header: Class & Date Filters */}
          <div className="p-2.5 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Search input */}
            <div className="relative flex-1 min-w-[160px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={noteSearchQuery}
                onChange={e => setNoteSearchQuery(e.target.value)}
                placeholder="Search notes, scriptures, topics..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#025798]"
              />
            </div>

            {/* Class session dropdown selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                aria-label="Filter notes by class session"
                value={selectedClassFilter}
                onChange={e => setSelectedClassFilter(e.target.value)}
                className="py-1.5 px-2 text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-hidden max-w-[170px] truncate"
              >
                <option value="all">All Class Sessions</option>
                {availableClassDays.map((d, dIdx) => (
                  <option key={`class-opt-${d.id || dIdx}-${dIdx}`} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              {/* Date Filter */}
              {availableNoteDates.length > 0 && (
                <select
                  aria-label="Filter notes by class date"
                  value={selectedDateFilter}
                  onChange={e => setSelectedDateFilter(e.target.value)}
                  className="py-1.5 px-2 text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-hidden max-w-[125px]"
                >
                  <option value="">All Dates</option>
                  {availableNoteDates.map((dateStr, dtIdx) => (
                    <option key={`dt-opt-${dateStr}-${dtIdx}`} value={dateStr}>
                      {dateStr}
                    </option>
                  ))}
                </select>
              )}

              {/* Mobile "New Note" Button */}
              <button
                onClick={() => handleCreateNote()}
                className="md:hidden p-1.5 bg-[#023264] text-[#dfc18b] rounded-lg text-xs flex items-center justify-center"
                title="Create New Note"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notes Content Split (Left Note Selector list & Right Note Editor) */}
          <div className="flex-1 flex flex-col sm:flex-row min-h-0 overflow-hidden">
            {/* Sidebar list of student notes */}
            <div className="w-full sm:w-56 md:w-52 lg:w-60 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col shrink-0 min-h-0 overflow-y-auto max-h-48 sm:max-h-none">
              <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Notes ({filteredNotes.length})</span>
                <span className="text-[10px] lowercase text-slate-400">click to edit</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 flex-1">
                {filteredNotes.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 space-y-2">
                    <p>No notes match filter.</p>
                    <button
                      onClick={() => {
                        setSelectedClassFilter('all');
                        setSelectedDateFilter('');
                        setNoteSearchQuery('');
                      }}
                      className="text-[11px] text-[#025798] dark:text-[#7dd3fc] underline font-bold"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  filteredNotes.map((note, nIdx) => {
                    const isSelected = activeNote?.id === note.id;
                    return (
                      <div
                        key={`student-note-${note.id || nIdx}-${nIdx}`}
                        onClick={() => setActiveNoteId(note.id)}
                        className={`p-2.5 transition-colors cursor-pointer group flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 dark:bg-amber-500/15 border-l-3 border-[#b38f53]'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-mono font-black uppercase text-amber-700 dark:text-amber-300 truncate max-w-[120px]">
                              {note.classDayName ? note.classDayName.split('(')[0].trim() : 'Class Note'}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 shrink-0">
                              {note.classDate || 'No date'}
                            </span>
                          </div>
                          <h4
                            className={`text-xs font-bold line-clamp-1 ${
                              isSelected
                                ? 'text-slate-900 dark:text-white'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {note.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {note.content.replace(/[#*>\-_]/g, '').trim() || 'No notes written yet...'}
                          </p>
                        </div>

                        {note.keyScriptures && note.keyScriptures.length > 0 && (
                          <div className="mt-1.5 flex items-center gap-1 text-[9px] font-medium text-amber-800 dark:text-amber-300/90 truncate">
                            <BookOpen className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{note.keyScriptures[0].split('-')[0]}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Note Editor Area */}
            {activeNote ? (
              <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-y-auto">
                {/* Note Meta bar */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 space-y-2 shrink-0 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={activeNote.title}
                      onChange={e => updateActiveNote({ title: e.target.value })}
                      placeholder="Note Title..."
                      className="text-sm sm:text-base font-black text-slate-900 dark:text-white bg-transparent border-0 focus:outline-hidden focus:ring-0 w-full p-0"
                    />

                    {/* Actions: Print & Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={handlePrintNote}
                        title="Print / Save PDF of Note"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => handleDeleteNote(activeNote.id, e)}
                        title="Delete Note"
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Class Session & Date Link */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Class Session binding */}
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <select
                        aria-label="Assign note to curriculum class"
                        value={activeNote.classDayId}
                        onChange={e => {
                          const chosen = availableClassDays.find(d => d.id === e.target.value);
                          updateActiveNote({
                            classDayId: e.target.value,
                            classDayName: chosen?.name || e.target.value,
                            classDate: chosen?.date || activeNote.classDate
                          });
                        }}
                        className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md py-0.5 px-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                      >
                        {availableClassDays.map((d, dIdx) => (
                          <option key={`assign-class-${d.id || dIdx}-${dIdx}`} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Class Date */}
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="date"
                        aria-label="Class date"
                        value={activeNote.classDate || ''}
                        onChange={e => updateActiveNote({ classDate: e.target.value })}
                        className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md py-0.5 px-1.5 text-[11px] font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden"
                      />
                    </div>

                    {/* Module Badge */}
                    <select
                      aria-label="Select ministry curriculum module"
                      value={activeNote.moduleCode || 'SOM-MOD-1'}
                      onChange={e => updateActiveNote({ moduleCode: e.target.value })}
                      className="bg-[#023264]/10 dark:bg-[#023264]/40 text-[#023264] dark:text-[#7dd3fc] border border-[#023264]/30 rounded-md py-0.5 px-1.5 text-[10px] font-mono font-bold focus:outline-hidden"
                    >
                      <option value="SOM-MOD-1">MOD 1: Intro & Evangelism</option>
                      <option value="SOM-MOD-2">MOD 2: Deliverance & Warfare</option>
                      <option value="SOM-MOD-3">MOD 3: Ministerial Ethics</option>
                      <option value="SOM-MOD-4">MOD 4: Apostolic Ministry</option>
                      <option value="SOM-MOD-5">MOD 5: Prophetic Ministry</option>
                      <option value="SOM-MOD-6">MOD 6: Pastors & Teachers</option>
                    </select>
                  </div>
                </div>

                {/* Key Scriptures Attached to this Class Note */}
                {activeNote.keyScriptures && activeNote.keyScriptures.length > 0 && (
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-900/40 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-300">
                      <span className="flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        Attached AMP Scriptures ({activeNote.keyScriptures.length})
                      </span>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400/80 font-normal">
                        Click 'Insert' in Bible panel to add more
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {activeNote.keyScriptures.map((scrip, scIdx) => (
                        <div
                          key={`scrip-tag-${scIdx}`}
                          className="flex items-start justify-between gap-2 p-1.5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-lg text-xs shadow-2xs"
                        >
                          <p className="text-slate-800 dark:text-slate-200 text-[11px] leading-relaxed">
                            <span className="font-bold text-amber-700 dark:text-amber-300 font-mono">
                              {scrip.split('-')[0]}
                            </span>
                            {scrip.includes('-') && (
                              <span className="text-slate-600 dark:text-slate-400">
                                {' '}
                                — {scrip.substring(scrip.indexOf('-') + 1)}
                              </span>
                            )}
                          </p>
                          <button
                            onClick={() => {
                              const updated = activeNote.keyScriptures.filter((_, idx) => idx !== scIdx);
                              updateActiveNote({ keyScriptures: updated });
                            }}
                            className="text-slate-400 hover:text-rose-500 p-0.5"
                            title="Remove scripture"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Markdown / Text Note Body */}
                <div className="flex-1 p-3 flex flex-col min-h-[220px]">
                  <textarea
                    aria-label="Student class lecture notes"
                    value={activeNote.content}
                    onChange={e => updateActiveNote({ content: e.target.value })}
                    placeholder="Type your class notes here... (Supports lecture outlines, quotes, revelations, and AMP scriptures)"
                    className="flex-1 w-full bg-transparent border-0 focus:outline-hidden resize-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed custom-scrollbar"
                  />
                </div>

                {/* Spiritual Takeaway & Action Points Footer */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Spiritual Takeaway / Prophetic Revelation:
                    </label>
                    <input
                      type="text"
                      value={activeNote.spiritualTakeaways || ''}
                      onChange={e => updateActiveNote({ spiritualTakeaways: e.target.value })}
                      placeholder="What is God speaking to you through this class?"
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No Note Selected</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Create a new note or select an existing session from the list on the left.
                </p>
                <button
                  onClick={() => handleCreateNote()}
                  className="mt-3 px-3.5 py-2 bg-[#023264] text-[#dfc18b] font-bold text-xs rounded-xl shadow-xs"
                >
                  Create Class Note
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANEL 2: AMPLIFIED BIBLE (AMP) PARALLEL COMPONENT (Right Side) */}
        {/* ========================================================================= */}
        <div
          className={`flex flex-col bg-slate-50/60 dark:bg-slate-950/60 min-h-0 transition-all duration-200 ${
            mobileActiveTab !== 'bible' ? 'hidden md:flex' : 'flex'
          } ${
            layoutMode === 'parallel'
              ? 'w-full md:w-1/2'
              : layoutMode === 'notes-wide'
              ? 'w-full md:w-2/5'
              : layoutMode === 'bible-wide'
              ? 'w-full md:w-3/5'
              : layoutMode === 'bible-only'
              ? 'w-full'
              : 'hidden'
          }`}
        >
          {/* Bible Header & Controls */}
          <div className="p-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Book and Chapter Selectors */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <select
                  aria-label="Select Bible Book"
                  value={selectedBookId}
                  onChange={e => {
                    setSelectedBookId(e.target.value);
                    setSelectedChapterNumber(1);
                  }}
                  className="py-1.5 px-2.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
                >
                  <optgroup label="New Testament (Epistles & Gospels)">
                    {AMP_BIBLE_BOOKS.filter(b => b.testament === 'NT').map(b => (
                      <option key={`nt-${b.id}`} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Old Testament (Wisdom & Prophets)">
                    {AMP_BIBLE_BOOKS.filter(b => b.testament === 'OT').map(b => (
                      <option key={`ot-${b.id}`} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </optgroup>
                </select>

                {/* Chapter Select */}
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-500">Ch.</span>
                  <select
                    aria-label="Select Bible Chapter"
                    value={selectedChapterNumber}
                    onChange={e => setSelectedChapterNumber(Number(e.target.value))}
                    className="py-1.5 px-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    {currentBook.chapters.map(ch => (
                      <option key={`ch-${ch.chapter}`} value={ch.chapter}>
                        {ch.chapter}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Translation Mode Switcher */}
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setBibleTranslation('AMP')}
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all cursor-pointer ${
                    bibleTranslation === 'AMP'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  AMP
                </button>
                <button
                  type="button"
                  onClick={() => setBibleTranslation('KJV')}
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all cursor-pointer ${
                    bibleTranslation === 'KJV'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  KJV
                </button>
                <button
                  type="button"
                  onClick={() => setBibleTranslation('parallel')}
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all cursor-pointer ${
                    bibleTranslation === 'parallel'
                      ? 'bg-[#023264] text-[#dfc18b] font-black shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Parallel (AMP / KJV)
                </button>
              </div>

              {/* Font Size & Chapter Step */}
              <div className="flex items-center gap-1">
                <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px]">
                  <button
                    onClick={() => setBibleFontSize('normal')}
                    className={`px-1.5 py-0.5 rounded font-mono ${
                      bibleFontSize === 'normal'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                        : 'text-slate-400'
                    }`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setBibleFontSize('large')}
                    className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                      bibleFontSize === 'large'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-400'
                    }`}
                  >
                    A+
                  </button>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => {
                      const idx = currentBook.chapters.findIndex(c => c.chapter === selectedChapterNumber);
                      if (idx > 0) {
                        setSelectedChapterNumber(currentBook.chapters[idx - 1].chapter);
                      }
                    }}
                    disabled={selectedChapterNumber === currentBook.chapters[0]?.chapter}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Previous Chapter"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      const idx = currentBook.chapters.findIndex(c => c.chapter === selectedChapterNumber);
                      if (idx < currentBook.chapters.length - 1) {
                        setSelectedChapterNumber(currentBook.chapters[idx + 1].chapter);
                      }
                    }}
                    disabled={
                      selectedChapterNumber ===
                      currentBook.chapters[currentBook.chapters.length - 1]?.chapter
                    }
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Next Chapter"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Bible Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bibleSearchQuery}
                onChange={e => setBibleSearchQuery(e.target.value)}
                placeholder="Search AMP Bible (e.g. 'workman', 'shepherd', 'fivefold', or '2 Tim 2:15')..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              {bibleSearchQuery && (
                <button
                  onClick={() => setBibleSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Scripture Verses View */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {/* If searching Bible, show results list */}
            {bibleSearchQuery.trim().length >= 2 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>Search Results for "{bibleSearchQuery}"</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    {bibleSearchResults.length} verse{bibleSearchResults.length === 1 ? '' : 's'} found
                  </span>
                </div>

                {bibleSearchResults.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No matching scriptures found in the curriculum database. Try a keyword like "power",
                    "spirit", "faith", "love", or "pastor".
                  </div>
                ) : (
                  bibleSearchResults.map((res, rIdx) => (
                    <div
                      key={`search-res-${res.reference}-${rIdx}`}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-2xs hover:border-amber-400/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-700 dark:text-amber-400 font-mono">
                          {res.reference}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyScripture(res.text, res.reference)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title="Copy scripture"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleInsertScriptureIntoNote(res.text, res.reference)}
                            className="px-2 py-0.5 bg-[#023264] text-[#dfc18b] font-bold text-[10px] rounded-md flex items-center gap-1 shadow-2xs hover:bg-[#022347]"
                            title="Insert scripture directly into active class note"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Insert in Note</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                        {res.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Normal Chapter Reading View */
              <div className="space-y-4">
                {/* Chapter Heading */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-2 flex items-baseline justify-between flex-wrap gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {currentBook.name} {currentChapter.chapter}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">
                    {bibleTranslation === 'AMP' ? 'Amplified Bible (AMP)' : bibleTranslation === 'KJV' ? 'King James Version (KJV)' : 'Parallel View (AMP & KJV)'}
                  </span>
                </div>

                {/* Verses */}
                <div className="space-y-3">
                  {currentChapter.verses.map(v => {
                    const multi = getMultiTranslationVerse(currentBook.id, currentChapter.chapter, v.verse);
                    const ampText = multi?.amp || v.text;
                    const kjvText = multi?.kjv || v.text;

                    if (bibleTranslation === 'parallel') {
                      return (
                        <div
                          key={`v-parallel-${v.verse}`}
                          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 shadow-2xs hover:border-indigo-400/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                              {currentBook.name} {currentChapter.chapter}:{v.verse}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleInsertScriptureIntoNote(`${currentBook.name} ${currentChapter.chapter}:${v.verse}\nAMP: "${ampText}"\nKJV: "${kjvText}"`, `${currentBook.name} ${currentChapter.chapter}:${v.verse} (Parallel)`)}
                                className="px-2 py-0.5 bg-[#023264] hover:bg-[#022347] text-[#dfc18b] font-bold text-[10px] rounded-md flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Insert both AMP and KJV into active note"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Insert Both</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">Amplified (AMP)</span>
                                <button
                                  onClick={() => handleInsertScriptureIntoNote(ampText, `${currentBook.name} ${currentChapter.chapter}:${v.verse} (AMP)`)}
                                  className="text-[10px] text-amber-800 dark:text-amber-300 font-bold hover:underline cursor-pointer"
                                >
                                  + Insert
                                </button>
                              </div>
                              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-serif text-[11px] sm:text-xs">
                                {ampText}
                              </p>
                            </div>

                            <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-lg space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400">King James (KJV)</span>
                                <button
                                  onClick={() => handleInsertScriptureIntoNote(kjvText, `${currentBook.name} ${currentChapter.chapter}:${v.verse} (KJV)`)}
                                  className="text-[10px] text-indigo-800 dark:text-indigo-300 font-bold hover:underline cursor-pointer"
                                >
                                  + Insert
                                </button>
                              </div>
                              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-serif text-[11px] sm:text-xs">
                                {kjvText}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const displayText = bibleTranslation === 'KJV' ? kjvText : ampText;
                    const verseRef = `${currentBook.name} ${currentChapter.chapter}:${v.verse} (${bibleTranslation})`;
                    const isCopied = copiedVerse === verseRef;

                    return (
                      <div
                        key={`v-${v.verse}`}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1.5 group hover:border-amber-500/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                            {currentBook.name} {currentChapter.chapter}:{v.verse}
                          </span>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCopyScripture(displayText, verseRef)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[10px] flex items-center gap-0.5 cursor-pointer"
                              title="Copy Scripture"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>

                            <button
                              onClick={() => handleInsertScriptureIntoNote(displayText, verseRef)}
                              className="px-2 py-0.5 bg-[#023264] hover:bg-[#022347] text-[#dfc18b] font-bold text-[10px] rounded-md flex items-center gap-1 shadow-2xs border border-[#b38f53]/30 cursor-pointer"
                              title="Insert directly into your active note"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Insert to Note</span>
                            </button>
                          </div>
                        </div>

                        {/* Verse Text */}
                        <p
                          className={`text-slate-800 dark:text-slate-200 leading-relaxed font-serif ${
                            bibleFontSize === 'normal'
                              ? 'text-xs sm:text-sm'
                              : bibleFontSize === 'large'
                              ? 'text-sm sm:text-base'
                              : 'text-base sm:text-lg'
                          }`}
                        >
                          {displayText}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentNotesBibleTab;
