import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  Users, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Check, 
  Copy, 
  ExternalLink, 
  Upload, 
  Trash2, 
  Search, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Play, 
  Square, 
  Calendar, 
  FileSpreadsheet, 
  Clock, 
  ArrowRight,
  HelpCircle,
  Pin
} from 'lucide-react';
import { StudentSummary, LibraryResource, ClassDay, AttendanceRecord } from '../types';

// Lightweight, self-contained Dice's Coefficient string similarity algorithm for smart participant matching
const getSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;

  const getBigrams = (str: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  let intersection = 0;
  b2.forEach(b => {
    if (b1.has(b)) intersection++;
  });

  return (2.0 * intersection) / (b1.size + b2.size);
};

// Preset scriptures for easy selection in HTEIM School of Ministry
const PRESET_SCRIPTURES = [
  {
    reference: "Romans 12:1-2",
    text: "I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service. And be not conformed to this world: but be ye transformed by the renewing of your mind..."
  },
  {
    reference: "Ephesians 4:11-12",
    text: "And he gave some, apostles; and some, prophets; and some, evangelists; and some, pastors and teachers; For the perfecting of the saints, for the work of the ministry, for the edifying of the body of Christ."
  },
  {
    reference: "Mark 16:15",
    text: "And he said unto them, Go ye into all the world, and preach the gospel to every creature."
  },
  {
    reference: "Matthew 28:19-20",
    text: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost: Teaching them to observe all things whatsoever I have commanded you: and, lo, I am with you alway..."
  },
  {
    reference: "2 Timothy 2:15",
    text: "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth."
  },
  {
    reference: "Luke 10:2",
    text: "Therefore said he unto them, The harvest truly is great, but the labourers are few: pray ye therefore the Lord of the harvest, that he would send forth labourers into his harvest."
  }
];

// Active Zoom Session structure matching what will be handled globally
export interface ActiveZoomSession {
  isSessionLive: boolean;
  activeScripture?: {
    reference: string;
    text: string;
  };
  activeHandout?: {
    id: string;
    title: string;
    url: string;
  };
  activePrompt?: string;
  meetingId: string;
  passcode: string;
  startedAt?: string;
  studentResponses?: Record<string, { studentName: string; text: string; timestamp: string }>;
}

interface ZoomCoPilotTabProps {
  students: StudentSummary[];
  libraryResources: LibraryResource[];
  classDays: ClassDay[];
  onAddClassDay?: (date: string, topic?: string) => void;
  onRecordBatchAttendance?: (records: AttendanceRecord[]) => void;
  activeZoomSession: ActiveZoomSession;
  onChangeActiveZoomSession: (session: ActiveZoomSession) => void;
}

export const ZoomCoPilotTab: React.FC<ZoomCoPilotTabProps> = ({
  students = [],
  libraryResources = [],
  classDays = [],
  onAddClassDay,
  onRecordBatchAttendance,
  activeZoomSession,
  onChangeActiveZoomSession
}) => {
  // Tabs within Zoom Co-Pilot
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'scripture' | 'handouts' | 'prompts'>('attendance');

  // Copied notifications
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Class Day selection
  const [selectedClassDay, setSelectedClassDay] = useState<string>(() => {
    if (classDays.length > 0) {
      return classDays[0].id;
    }
    return new Date().toISOString().split('T')[0];
  });
  const [newClassDayTopic, setNewClassDayTopic] = useState<string>('Zoom Live Lecture');

  // Attendance Textarea state
  const [rawParticipantsText, setRawParticipantsText] = useState<string>('');
  const [parsedMatches, setParsedMatches] = useState<Array<{
    rawName: string;
    matchedStudent: StudentSummary | null;
    similarity: number;
    approved: boolean;
    possibleMatches: Array<{ student: StudentSummary; score: number }>;
  }>>([]);

  // Scripture Board state
  const [customScriptureRef, setCustomScriptureRef] = useState<string>('');
  const [customScriptureText, setCustomScriptureText] = useState<string>('');
  const [scriptureStatusMessage, setScriptureStatusMessage] = useState<string | null>(null);

  // Prompt Board state
  const [currentPromptText, setCurrentPromptText] = useState<string>('');

  // Handle Copy text helper
  const handleCopyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Create new class day if requested
  const handleCreateClassDay = () => {
    const today = new Date().toISOString().split('T')[0];
    if (onAddClassDay) {
      onAddClassDay(today, newClassDayTopic);
      setSelectedClassDay(today);
      alert(`Created and selected new class session day: ${today} (${newClassDayTopic})`);
    }
  };

  // Active Session start/stop
  const handleToggleSession = () => {
    const isNowLive = !activeZoomSession.isSessionLive;
    onChangeActiveZoomSession({
      ...activeZoomSession,
      isSessionLive: isNowLive,
      startedAt: isNowLive ? new Date().toISOString() : undefined,
      // Keep other active items if desired, or reset
      activePrompt: isNowLive ? activeZoomSession.activePrompt : undefined,
      activeScripture: isNowLive ? activeZoomSession.activeScripture : undefined,
      activeHandout: isNowLive ? activeZoomSession.activeHandout : undefined
    });
  };

  // Analyze Zoom Participant Paste List
  const handleAnalyzeParticipants = () => {
    if (!rawParticipantsText.trim()) {
      setParsedMatches([]);
      return;
    }

    // Split text by lines and filter out empty / Zoom metadata
    const lines = rawParticipantsText
      .split(/[\n,]/)
      .map(line => line.trim())
      .filter(line => {
        if (!line) return false;
        const lower = line.toLowerCase();
        // Remove Zoom interface strings or participants sidebar noise
        if (lower === 'participants' || lower === 'host' || lower === 'co-host' || lower === 'me' || lower === 'chat') return false;
        if (lower.startsWith('mush') || lower.includes('waiting room') || lower.includes('invite')) return false;
        return true;
      });

    const results = lines.map(rawLine => {
      // Clean up common Zoom appended noise like "(Host)", "(Co-host)", "(Me)", "(Guest)"
      let cleaned = rawLine
        .replace(/\(host\)/i, '')
        .replace(/\(co-host\)/i, '')
        .replace(/\(me\)/i, '')
        .replace(/\(guest\)/i, '')
        .replace(/\d+/g, '') // remove numbers
        .replace(/@.*$/, '') // remove email suffixes if any
        .trim();

      if (!cleaned) return { rawName: rawLine, matchedStudent: null, similarity: 0, approved: false, possibleMatches: [] };

      // Compute similarity score against all students
      const scores = students.map(student => {
        const score = getSimilarity(cleaned, student.name);
        return { student, score };
      });

      // Sort by similarity score descending
      scores.sort((a, b) => b.score - a.score);

      const topMatch = scores[0];
      const exactMatchThreshold = 0.75; // high confidence
      const possibleMatches = scores.filter(s => s.score > 0.3 && s.score < exactMatchThreshold).slice(0, 3);

      return {
        rawName: rawLine,
        matchedStudent: topMatch && topMatch.score >= exactMatchThreshold ? topMatch.student : null,
        similarity: topMatch ? topMatch.score : 0,
        approved: topMatch && topMatch.score >= exactMatchThreshold,
        possibleMatches: topMatch && topMatch.score < exactMatchThreshold ? scores.filter(s => s.score > 0.2).slice(0, 4) : possibleMatches
      };
    });

    setParsedMatches(results);
  };

  // Select fuzzy match for raw input
  const handleSelectFuzzyMatch = (index: number, student: StudentSummary) => {
    const updated = [...parsedMatches];
    updated[index].matchedStudent = student;
    updated[index].approved = true;
    updated[index].similarity = 1.0; // Overridden as manual approval
    setParsedMatches(updated);
  };

  // Toggle single match approval
  const handleToggleApproved = (index: number) => {
    const updated = [...parsedMatches];
    updated[index].approved = !updated[index].approved;
    setParsedMatches(updated);
  };

  // Commit batch attendance
  const handleApplyAttendance = () => {
    const approvedMatches = parsedMatches.filter(m => m.approved && m.matchedStudent);
    if (approvedMatches.length === 0) {
      alert("No matched students are approved or selected to record.");
      return;
    }

    if (!selectedClassDay) {
      alert("Please select or create an active Class Session Day first.");
      return;
    }

    const timestampIso = new Date().toISOString();
    const attendanceRecordsToRecord: AttendanceRecord[] = approvedMatches.map(m => ({
      name: m.matchedStudent!.name,
      studentName: m.matchedStudent!.name,
      classDay: selectedClassDay,
      present: true,
      timestamp: timestampIso,
      score: "Zoom Session Active Check-In",
      manualOverride: true
    }));

    if (onRecordBatchAttendance) {
      onRecordBatchAttendance(attendanceRecordsToRecord);
      alert(`Successfully registered ${approvedMatches.length} students as PRESENT for class day ${selectedClassDay} via Zoom Import!`);
      // Reset
      setRawParticipantsText('');
      setParsedMatches([]);
    } else {
      alert("Parent attendance recording service is not wired. Could not save.");
    }
  };

  // Select preset scripture
  const handleSelectPresetScripture = (preset: { reference: string; text: string }) => {
    setCustomScriptureRef(preset.reference);
    setCustomScriptureText(preset.text);
  };

  // Pushes scripture to live display
  const handlePinScripture = () => {
    if (!customScriptureRef || !customScriptureText) {
      alert("Please fill in scripture reference and text.");
      return;
    }

    onChangeActiveZoomSession({
      ...activeZoomSession,
      activeScripture: {
        reference: customScriptureRef,
        text: customScriptureText
      }
    });

    setScriptureStatusMessage("📖 Scripture is now pinned live to all active Student Dashboards!");
    setTimeout(() => setScriptureStatusMessage(null), 4000);
  };

  // Copy scripture formatted specifically for pasting inside Zoom chat window
  const handleCopyForZoomChat = () => {
    if (!customScriptureRef || !customScriptureText) return;
    const formattedText = `📖 [HTEIM School of Ministry Live Reading] 📖\n\nScripture: ${customScriptureRef}\n\n"${customScriptureText}"\n\nJoin the live lecture discussion in the app!`;
    handleCopyText(formattedText, 'zoomChatScripture');
  };

  // Pin Library document to dashboard
  const handlePinHandout = (resource: LibraryResource) => {
    onChangeActiveZoomSession({
      ...activeZoomSession,
      activeHandout: {
        id: resource.id,
        title: resource.title,
        url: resource.downloadUrl || resource.fileDataUrl || '#'
      }
    });
    alert(`📄 Handout "${resource.title}" is now featured on active Student Dashboards for easy Tuesday class download!`);
  };

  // Clear currently pinned items
  const handleClearActiveItem = (type: 'scripture' | 'handout' | 'prompt') => {
    const updated = { ...activeZoomSession };
    if (type === 'scripture') updated.activeScripture = undefined;
    if (type === 'handout') updated.activeHandout = undefined;
    if (type === 'prompt') {
      updated.activePrompt = undefined;
      updated.studentResponses = undefined;
    }
    onChangeActiveZoomSession(updated);
  };

  // Pin Active Teaching Prompt
  const handlePinPrompt = () => {
    if (!currentPromptText.trim()) {
      alert("Please enter a study or discussion prompt first.");
      return;
    }

    onChangeActiveZoomSession({
      ...activeZoomSession,
      activePrompt: currentPromptText,
      studentResponses: {} // clear responses on new prompt or initialize
    });
    alert("💬 Discussion Prompt published live! Students can now submit responses directly on their dashboards.");
  };

  // Pre-fill prompt generator
  const handleSelectPresetPrompt = (text: string) => {
    setCurrentPromptText(text);
  };

  const PRESET_PROMPTS = [
    "Discussion: What is the primary role of an evangelist in the digital age?",
    "Reflection: In Romans 12, what does it mean to be a 'living sacrifice'?",
    "Review: Detail how your curriculum Module this week connects to practical community ministry.",
    "Theology Checklist: Share your understanding of the 5-fold ministry offices."
  ];

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-100">
      
      {/* Upper Zoom Controller Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full filter blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${activeZoomSession.isSessionLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-300 uppercase">
                {activeZoomSession.isSessionLive ? 'Class Active & Pinned Live' : 'Weekly Zoom Live Companion'}
              </span>
            </div>
            <h2 className="text-2xl font-black font-syne tracking-tight">HTEIM Tuesday Zoom Co-Pilot</h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Conduct efficient class lectures. Import student rosters directly from Zoom Participant lists, pin scripture readings, display reading PDFs, and push live discussion prompts instantly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Launch Zoom button */}
            <a 
              href="https://zoom.us/j/81505377396"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-sky-600/20"
            >
              <Video className="w-4 h-4" />
              <span>Launch Zoom</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Toggle Class Live Switch */}
            <button
              onClick={handleToggleSession}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeZoomSession.isSessionLive 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {activeZoomSession.isSessionLive ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span>End Live Session</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Go Live for Students</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Zoom Meeting ID</p>
              <p className="font-mono font-bold tracking-wider mt-0.5">{activeZoomSession.meetingId}</p>
            </div>
            <button 
              onClick={() => handleCopyText(activeZoomSession.meetingId, 'meetingId')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
            >
              {copiedField === 'meetingId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Passcode</p>
              <p className="font-mono font-bold tracking-wider mt-0.5">{activeZoomSession.passcode}</p>
            </div>
            <button 
              onClick={() => handleCopyText(activeZoomSession.passcode, 'passcode')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
            >
              {copiedField === 'passcode' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Class Day Sync</p>
              <p className="font-semibold text-amber-400 mt-0.5">
                {classDays.find(d => d.id === selectedClassDay)?.name || 'Lecture Slot'}
              </p>
            </div>
            <div className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] font-mono uppercase font-bold">
              {classDays.find(d => d.id === selectedClassDay)?.id || selectedClassDay}
            </div>
          </div>
        </div>
      </div>

      {/* active state alerts */}
      {(activeZoomSession.activeScripture || activeZoomSession.activeHandout || activeZoomSession.activePrompt) && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Pin className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Active Class Pins:</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {activeZoomSession.activeScripture && (
                  <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 text-[10px] font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
                    <a
                      href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(activeZoomSession.activeScripture.reference)}&version=NKJV`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1 cursor-pointer"
                      title="Search in bible translations"
                    >
                      <span>📖 Reading: {activeZoomSession.activeScripture.reference}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-75" />
                    </a>
                    <button onClick={() => handleClearActiveItem('scripture')} className="hover:text-rose-500 font-bold ml-1">×</button>
                  </span>
                )}
                {activeZoomSession.activeHandout && (
                  <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                    <span>📄 PDF Handout: {activeZoomSession.activeHandout.title}</span>
                    <button onClick={() => handleClearActiveItem('handout')} className="hover:text-rose-500 font-bold">×</button>
                  </span>
                )}
                {activeZoomSession.activePrompt && (
                  <span className="px-2.5 py-0.5 bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 text-[10px] font-bold rounded-lg border border-sky-200 dark:border-sky-800 flex items-center gap-1.5">
                    <span>💬 Active Discussion Prompt</span>
                    <button onClick={() => handleClearActiveItem('prompt')} className="hover:text-rose-500 font-bold">×</button>
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 italic">
            * Pinned assets appear live on student attendance portals.
          </p>
        </div>
      )}

      {/* Sub tabs navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-px">
        {[
          { id: 'attendance', label: 'Zoom Attendance Parser', Icon: Users },
          { id: 'scripture', label: 'Scripture Sharing', Icon: BookOpen },
          { id: 'handouts', label: 'Featured Handouts', Icon: FileText },
          { id: 'prompts', label: 'Interactive Study Prompts', Icon: MessageSquare },
        ].map(({ id, label, Icon }) => {
          const isActive = activeSubTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveSubTab(id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                isActive 
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        
        {/* TAB 1: ATTENDANCE PARSER */}
        {activeSubTab === 'attendance' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white font-syne">Zoom Roster Attendance Matcher</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pasting the participant column from Zoom can save you 15 minutes of manual attendance input. Copy and paste your participant list below.
              </p>
            </div>

            {/* Config Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Target Class Session Day</label>
                <div className="flex gap-2">
                  <select
                    value={selectedClassDay}
                    onChange={(e) => setSelectedClassDay(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold flex-1 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {classDays.map(day => (
                      <option key={day.id} value={day.id}>
                        {day.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Or Create New Class Day Session</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Class Day Topic"
                    value={newClassDayTopic}
                    onChange={(e) => setNewClassDayTopic(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold flex-1 outline-none"
                  />
                  <button
                    onClick={handleCreateClassDay}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>

            {/* Input & Output Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Text Area */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Paste Zoom Participants Column</label>
                  <button
                    onClick={() => setRawParticipantsText(
                      "Pastor Vanessa Mohammed\nDenise Edwards (co-host)\nMishael Daniel (Co-host)\nNiomi Marksman\nGuest User\nKabrina M"
                    )}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    Load Sample Roster
                  </button>
                </div>

                <textarea
                  rows={10}
                  value={rawParticipantsText}
                  onChange={(e) => setRawParticipantsText(e.target.value)}
                  placeholder="Paste Zoom attendee lists, chat listings, or CSV names here. Each name should occupy a separate line."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                />

                <button
                  onClick={handleAnalyzeParticipants}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze & Smart-Match Students</span>
                </button>
              </div>

              {/* Right Column: Matched List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Matched Roster Preview</h4>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-lg">
                    {parsedMatches.filter(m => m.approved).length} Approved
                  </span>
                </div>

                {parsedMatches.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold">No participants analyzed yet.</p>
                    <p className="text-[10px] max-w-xs mx-auto">
                      Paste Zoom room names in the left-hand editor and click "Analyze" to execute similarity matching.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                    {parsedMatches.map((match, index) => (
                      <div 
                        key={index} 
                        className={`p-3 border rounded-xl flex items-center justify-between gap-4 text-xs transition-colors ${
                          match.approved 
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/60' 
                            : 'bg-amber-50/20 dark:bg-amber-950/5 border-amber-200/50 dark:border-amber-900/20'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[10px] text-slate-400">Pasted: "{match.rawName}"</p>
                          
                          {/* Match Result Display */}
                          {match.matchedStudent ? (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1 font-syne text-[13px]">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                {match.matchedStudent.name}
                              </span>
                              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-1.5 py-0.5 rounded">
                                {Math.round(match.similarity * 100)}% match
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1.5 mt-1">
                              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                Fuzzy/Unresolved Match
                              </span>
                              
                              {/* Option list */}
                              {match.possibleMatches.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {match.possibleMatches.map(p => (
                                    <button
                                      key={p.student.name}
                                      onClick={() => handleSelectFuzzyMatch(index, p.student)}
                                      className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 text-[10px] rounded-lg transition-colors"
                                    >
                                      {p.student.name} ({Math.round(p.score * 100)}%)
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Approved Checkbox */}
                        {match.matchedStudent && (
                          <button
                            onClick={() => handleToggleApproved(index)}
                            className={`p-2 rounded-xl transition-all ${
                              match.approved 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={handleApplyAttendance}
                      className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>Commit Attendance for Matched Students ({parsedMatches.filter(m => m.approved).length})</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCRIPTURE BOARD */}
        {activeSubTab === 'scripture' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white font-syne">Scripture Sharing Board</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share Holy Scriptures for the current sermon or lecture block. Pin them to students' dashboards in real-time or copy specialized Zoom-Chat formatting.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Select Core HTEIM Preset Scripture</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {PRESET_SCRIPTURES.map(p => (
                  <button
                    key={p.reference}
                    onClick={() => handleSelectPresetScripture(p)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-xl text-left border border-slate-200 dark:border-slate-800 transition-colors"
                  >
                    <p className="font-syne font-black text-xs text-slate-900 dark:text-white flex items-center justify-between">
                      <span>{p.reference}</span>
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">"{p.text}"</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4 space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Scripture Reference</label>
                <input
                  type="text"
                  placeholder="Ex: Romans 12:1-2"
                  value={customScriptureRef}
                  onChange={(e) => setCustomScriptureRef(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="md:col-span-8 space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Scripture Body Text</label>
                <textarea
                  rows={3}
                  placeholder="Enter the full verse text here..."
                  value={customScriptureText}
                  onChange={(e) => setCustomScriptureText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>
            </div>

            {/* Copyable preview block */}
            {customScriptureRef && customScriptureText && (
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
                    Scripture Board Live Preview:
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyForZoomChat}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                    >
                      {copiedField === 'zoomChatScripture' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy for Zoom Chat</span>
                    </button>

                    <button
                      onClick={handlePinScripture}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg flex items-center gap-1.5"
                    >
                      <Pin className="w-3.5 h-3.5" />
                      <span>Pin to Student Dashboards</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl text-center max-w-xl mx-auto space-y-2">
                  <h4 className="font-serif italic font-black text-slate-800 dark:text-white text-base">
                    "{customScriptureText}"
                  </h4>
                  <p className="font-syne font-black text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-widest pt-1">
                    — {customScriptureRef} —
                  </p>
                  
                  {/* Active Translation Links */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-center gap-1.5 mt-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500">Search Translations:</span>
                    {['KJV', 'NKJV', 'NIV', 'ESV', 'AMP'].map(trans => (
                      <a
                        key={trans}
                        href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(customScriptureRef)}&version=${trans}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-950/70 border border-slate-200/40 dark:border-slate-800 rounded text-[9px] text-slate-600 dark:text-slate-400 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{trans}</span>
                        <ExternalLink className="w-2 h-2 opacity-60" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {scriptureStatusMessage && (
              <div className="p-3 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>{scriptureStatusMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FEATURED HANDOUTS */}
        {activeSubTab === 'handouts' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white font-syne">Featured Class Handouts</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instantly push reading materials, slide notes, or study worksheets to active students' screens. Featured handouts appear pinned at the top of the student portal during live lectures.
              </p>
            </div>

            {/* Library list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {libraryResources.length === 0 ? (
                <div className="col-span-2 py-12 text-center text-slate-400">
                  <p className="text-xs font-semibold">No materials found in the School Library.</p>
                  <p className="text-[10px] mt-1">Upload curriculum handouts in the main Library Tab first.</p>
                </div>
              ) : (
                libraryResources.map(resource => {
                  const isCurrentlyPinned = activeZoomSession.activeHandout?.id === resource.id;
                  return (
                    <div 
                      key={resource.id} 
                      className={`p-4 border rounded-2xl flex items-center justify-between gap-4 transition-all ${
                        isCurrentlyPinned 
                          ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-sm' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[9px] font-mono font-bold uppercase rounded-lg">
                          {resource.courseCode || 'General Resource'}
                        </span>
                        <h4 className="font-syne font-black text-xs text-slate-900 dark:text-white">{resource.title}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                          Type: {resource.format || 'PDF Handout'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrentlyPinned ? (
                          <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white font-extrabold text-[10px] rounded-xl border border-emerald-500">
                            <Check className="w-3.5 h-3.5" />
                            <span>Live featured</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePinHandout(resource)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-extrabold text-[10px] rounded-xl transition-colors"
                          >
                            Feature Live
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: INTERACTIVE STUDY PROMPTS */}
        {activeSubTab === 'prompts' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white font-syne">Interactive Class Study Prompts</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pique student interest by writing a live question, theology puzzle, or sermon prompt. Responses from student screens will feed into the panel below in real-time.
              </p>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Quick Preset Prompts</label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => handleSelectPresetPrompt(p)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 text-[10px] rounded-lg font-semibold border border-slate-200 dark:border-slate-700"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Input & Pin button */}
            <div className="space-y-3">
              <textarea
                rows={3}
                placeholder="Enter discussion prompt or pop-quiz question here..."
                value={currentPromptText}
                onChange={(e) => setCurrentPromptText(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
              />

              <button
                onClick={handlePinPrompt}
                disabled={!currentPromptText.trim()}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center gap-2"
              >
                <Pin className="w-4 h-4" />
                <span>Publish Discussion Prompt Live</span>
              </button>
            </div>

            {/* Live Feed Panel */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  Live Student Responses
                </span>
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg">
                  {Object.keys(activeZoomSession.studentResponses || {}).length} Submitted
                </span>
              </div>

              {Object.keys(activeZoomSession.studentResponses || {}).length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                  No responses received yet. Students will see the prompt displayed in real-time when they enter their Attendance portal.
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {Object.values(activeZoomSession.studentResponses || {}).map((resp: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        <span className="text-indigo-600 dark:text-indigo-400 font-syne font-black text-xs">
                          {resp.studentName}
                        </span>
                        <span>{new Date(resp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                        "{resp.text}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
