import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  BookOpen, 
  User, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw, 
  X, 
  Check,
  GraduationCap,
  Compass,
  Save,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { QuizAssignment, QuizSubmission, QuizSubmissionResponse } from '../types';

interface QuizTakerViewProps {
  quiz: QuizAssignment;
  studentRoster?: { name: string }[];
  currentStudentName?: string;
  studentName?: string;
  previousSubmission?: QuizSubmission | null;
  onSubmitQuiz?: (submission: QuizSubmission) => void;
  onComplete?: (submission: QuizSubmission) => void;
  onClose: () => void;
}

export const QuizTakerView: React.FC<QuizTakerViewProps> = ({
  quiz,
  studentRoster = [],
  currentStudentName,
  studentName,
  previousSubmission,
  onSubmitQuiz,
  onComplete,
  onClose
}) => {
  const loggedInStudentName = studentName || currentStudentName || '';
  const initialStudentName = loggedInStudentName || (studentRoster[0]?.name || '');
  const [selectedStudentName, setSelectedStudentName] = useState(initialStudentName);
  const [customStudentName, setCustomStudentName] = useState(loggedInStudentName);
  const [isCustomName, setIsCustomName] = useState(!loggedInStudentName && studentRoster.length === 0);

  // Selected answers state: questionId -> optionId
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(!!previousSubmission);
  const [submissionResult, setSubmissionResult] = useState<QuizSubmission | null>(previousSubmission || null);

  useEffect(() => {
    if (previousSubmission) {
      setIsSubmitted(true);
      setSubmissionResult(previousSubmission);
    }
  }, [previousSubmission]);

  useEffect(() => {
    if (loggedInStudentName) {
      setSelectedStudentName(loggedInStudentName);
      setCustomStudentName(loggedInStudentName);
    }
  }, [loggedInStudentName]);

  // Auto-save & draft restoration state
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);
  const [restoredFromDraft, setRestoredFromDraft] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Optional Timer State
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(
    quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null
  );

  // Load saved draft on initial mount
  useEffect(() => {
    const draftKey = `quiz_draft_${quiz.id}`;
    try {
      const savedData = localStorage.getItem(draftKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed && parsed.answers && Object.keys(parsed.answers).length > 0) {
          setAnswers(parsed.answers);
          if (typeof parsed.secondsRemaining === 'number' && parsed.secondsRemaining > 0) {
            setSecondsRemaining(parsed.secondsRemaining);
          }
          if (parsed.studentName) {
            if (studentRoster.some(s => s.name === parsed.studentName)) {
              setSelectedStudentName(parsed.studentName);
              setIsCustomName(false);
            } else {
              setCustomStudentName(parsed.studentName);
              setIsCustomName(true);
            }
          }
          setRestoredFromDraft(true);
          if (parsed.savedAt) {
            setLastAutoSavedAt(new Date(parsed.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load quiz draft from localStorage', err);
    }
  }, [quiz.id]);

  useEffect(() => {
    if (secondsRemaining === null || isSubmitted) return;
    if (secondsRemaining <= 0) {
      // Auto submit when timer runs out
      handleSubmit();
      return;
    }
    const interval = setInterval(() => {
      setSecondsRemaining(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining, isSubmitted]);

  const activeStudentName = isCustomName ? customStudentName.trim() : selectedStudentName.trim();

  // Auto-save to localStorage every 30 seconds and whenever answers/student changes
  useEffect(() => {
    if (isSubmitted) return;

    const draftKey = `quiz_draft_${quiz.id}`;

    const saveDraft = () => {
      if (Object.keys(answers).length > 0 || activeStudentName) {
        const payload = {
          quizId: quiz.id,
          answers,
          secondsRemaining,
          studentName: activeStudentName,
          savedAt: new Date().toISOString()
        };
        try {
          localStorage.setItem(draftKey, JSON.stringify(payload));
          const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastAutoSavedAt(timeString);
        } catch (err) {
          console.error('Failed to auto-save quiz session', err);
        }
      }
    };

    saveDraft();

    const interval = setInterval(() => {
      saveDraft();
    }, 30000); // 30 seconds auto-save interval

    return () => clearInterval(interval);
  }, [quiz.id, answers, secondsRemaining, activeStudentName, isSubmitted]);

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(`quiz_draft_${quiz.id}`);
    } catch (err) {}
    setAnswers({});
    setRestoredFromDraft(false);
    setLastAutoSavedAt(null);
  };

  // Progress metrics
  const answeredCount = Object.keys(answers).filter(qId => Boolean(answers[qId])).length;
  const totalQuestionsCount = quiz.questions?.length || 0;
  const unansweredCount = Math.max(0, totalQuestionsCount - answeredCount);
  const progressPercentage = totalQuestionsCount > 0 ? Math.round((answeredCount / totalQuestionsCount) * 100) : 0;

  const scrollToQuestion = (qId: string) => {
    const el = document.getElementById(`q-card-${qId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Roster match helper
  const findMatchingRosterName = (inputName: string): string | null => {
    if (!inputName || !inputName.trim()) return null;
    const cleanInput = (inputName || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!studentRoster || studentRoster.length === 0) return inputName.trim();

    for (const student of studentRoster) {
      const cleanRosterName = (student.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (cleanInput === cleanRosterName) return student.name;

      const inputParts = cleanInput.split(' ').filter(Boolean);
      const rosterParts = cleanRosterName.split(' ').filter(Boolean);

      if (inputParts.length >= 2 && rosterParts.length >= 2) {
        if (inputParts[0] === rosterParts[0] && inputParts[inputParts.length - 1] === rosterParts[rosterParts.length - 1]) {
          return student.name;
        }
      }
    }
    return null;
  };

  const matchedRosterName = isCustomName ? findMatchingRosterName(customStudentName) : selectedStudentName;

  const handleSelectOption = (qId: string, optId: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optId }));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!activeStudentName) {
      setSubmitError('Please select or enter your name before submitting the quiz.');
      return;
    }

    // Verify student is registered in roster if not logged in
    if (studentRoster.length > 0 && !loggedInStudentName) {
      const matched = findMatchingRosterName(activeStudentName);
      if (!matched) {
        setSubmitError(`Student name "${activeStudentName}" is not registered in the student roster. Please spell your First and Last Name correctly as registered.`);
        return;
      }
    }

    setSubmitError(null);

    // Check if all questions answered
    const unansweredCount = quiz.questions.filter(q => !answers[q.id]).length;
    if (unansweredCount > 0 && secondsRemaining !== 0) {
      if (!confirm(`You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`)) {
        return;
      }
    }

    // Tally score
    let totalScore = 0;
    const responses: QuizSubmissionResponse[] = [];

    quiz.questions.forEach(q => {
      const selectedOptionId = answers[q.id] || '';
      const isCorrect = selectedOptionId === q.correctOptionId;
      const pointsEarned = isCorrect ? (q.weight || 10) : 0;
      totalScore += pointsEarned;

      responses.push({
        questionId: q.id,
        selectedOptionId,
        isCorrect,
        pointsEarned
      });
    });

    const maxPoints = quiz.totalPoints || 100;
    const scorePercentage = maxPoints > 0 ? Math.round((totalScore / maxPoints) * 100) : 0;

    const newSubmission: QuizSubmission = {
      id: `qsub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      studentName: activeStudentName,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      responses,
      totalScore,
      maxPoints,
      scorePercentage,
      score: totalScore,
      totalPossible: maxPoints,
      percentage: scorePercentage
    };

    setSubmissionResult(newSubmission);
    setIsSubmitted(true);

    try {
      localStorage.removeItem(`quiz_draft_${quiz.id}`);
    } catch (err) {}

    onSubmitQuiz?.(newSubmission);
    onComplete?.(newSubmission);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-6 animate-fadeIn">
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] my-auto flex flex-col overflow-hidden relative z-[100000]">
        
        {/* Google Forms Purple Header Accent */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 text-white p-6 sm:p-8 relative flex-shrink-0 shadow-lg">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-black transition-all flex items-center gap-1.5 border border-white/25 shadow-md cursor-pointer active:scale-95 z-20"
            aria-label="Exit Quiz">
            <X className="w-4 h-4" />
            <span>Exit Quiz</span>
          </button>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-purple-200">
              <span className="px-3 py-1 bg-white/20 rounded-full border border-purple-300/30 font-mono">
                {quiz.courseCode || 'MIN-101'}
              </span>
              {quiz.moduleTrack && (
                <span className="px-3 py-1 bg-purple-900/50 rounded-full border border-purple-400/30">
                  {quiz.moduleTrack}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {quiz.title}
            </h1>

            {quiz.description && (
              <p className="text-xs sm:text-sm text-purple-100/90 max-w-2xl">
                {quiz.description}
              </p>
            )}

            <div className="pt-3 border-t border-purple-500/30 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-purple-100">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-mono">
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>Total Weight: <strong className="text-amber-300 font-bold">{quiz.totalPoints} Points</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-purple-300" />
                  <span>{quiz.questions.length} Questions</span>
                </span>
              </div>

              {secondsRemaining !== null && !isSubmitted && (
                <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono font-black text-sm border shadow-sm ${
                  secondsRemaining < 60 ? 'bg-rose-600 text-white border-rose-400 animate-pulse' : 'bg-white/15 text-white border-purple-300/30'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span>Time Left: {formatTimer(secondsRemaining)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* RESULT CARD IF SUBMITTED */}
          {isSubmitted && submissionResult ? (
            <div className="space-y-6 animate-fadeIn">
              {previousSubmission && (
                <div className="bg-amber-50 dark:bg-amber-950/80 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-4 flex items-center gap-3 text-amber-900 dark:text-amber-200 text-xs font-bold shadow-2xs">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <p className="font-extrabold text-xs">🔒 Quiz Retake Restricted</p>
                    <p className="text-[11px] font-medium opacity-90">You have already submitted an attempt for this quiz on {submissionResult.submittedAt || 'an earlier date'}. Scores are compiled into the academic matrix and multiple attempts are restricted.</p>
                  </div>
                </div>
              )}

              {/* Score Header */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border-2 border-purple-200 dark:border-purple-900/60 shadow-xl text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 shadow-inner">
                  {submissionResult.scorePercentage >= 70 ? (
                    <Award className="w-9 h-9 text-amber-500" />
                  ) : (
                    <AlertCircle className="w-9 h-9 text-rose-500" />
                  )}
                </div>

                <div>
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Quiz Submission Result
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                    {submissionResult.studentName}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
                  <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-extrabold uppercase text-slate-400">Total Score</p>
                    <p className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                      {submissionResult.totalScore} / {submissionResult.maxPoints} pts
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-extrabold uppercase text-slate-400">Percentage</p>
                    <p className={`text-2xl font-black font-mono ${
                      submissionResult.scorePercentage >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {submissionResult.scorePercentage}%
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                  Your quiz response has been graded and automatically recorded in the Quiz Scores Matrix.
                </p>
              </div>

              {/* Itemized Answer Sheet Review */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Itemized Answer Breakdown</span>
                </h3>

                {quiz.questions.map((q, idx) => {
                  const resp = submissionResult.responses.find(r => r.questionId === q.id);
                  const isCorrect = resp?.isCorrect || false;
                  const selectedOpt = q.options.find(o => o.id === resp?.selectedOptionId);
                  const correctOpt = q.options.find(o => o.id === q.correctOptionId);

                  return (
                    <div 
                      key={q.id}
                      className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 shadow-sm space-y-3 transition-all ${
                        isCorrect ? 'border-emerald-200 dark:border-emerald-900/50' : 'border-rose-200 dark:border-rose-900/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center font-mono flex-shrink-0 mt-0.5 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            {idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {q.questionText}
                          </h4>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-xs font-black font-mono flex items-center gap-1 flex-shrink-0 ${
                          isCorrect ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                        }`}>
                          {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>{resp?.pointsEarned || 0} / {q.weight} pts</span>
                        </span>
                      </div>

                      {/* Options breakdown */}
                      <div className="space-y-1.5 pt-2 pl-8">
                        {q.options.map((opt, optIdx) => {
                          const optionLetter = String.fromCharCode(65 + optIdx);
                          const isSelected = resp?.selectedOptionId === opt.id;
                          const isTheCorrectOpt = q.correctOptionId === opt.id;

                          return (
                            <div 
                              key={opt.id}
                              className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-between gap-2 ${
                                isTheCorrectOpt 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold'
                                  : isSelected && !isTheCorrectOpt
                                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 line-through'
                                  : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[11px]">{optionLetter}.</span>
                                <span>{opt.text}</span>
                              </div>

                              {isTheCorrectOpt && (
                                <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                                  Correct Choice
                                </span>
                              )}
                              {isSelected && !isTheCorrectOpt && (
                                <span className="text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-400">
                                  Your Choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="ml-8 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 text-xs text-purple-900 dark:text-purple-200 font-medium">
                          <strong className="font-bold uppercase tracking-wider text-[10px] block text-purple-700 dark:text-purple-300 mb-0.5">Explanation:</strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs rounded-2xl shadow-xl hover:opacity-90 transition-all"
                >
                  Return to Portal Matrix
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE QUIZ QUESTIONNAIRE */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* RESTORED SESSION DRAFT BANNER */}
              {restoredFromDraft && (
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200 font-bold shadow-xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span>Resumed quiz progress from your previous auto-saved draft.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900"
                    title="Clear saved draft and restart fresh"
                  >
                    <Trash2 className="w-3 h-3" /> Clear Draft
                  </button>
                </div>
              )}

              {/* Student Identification Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 border-purple-200 dark:border-purple-900/60 shadow-sm space-y-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <span>Student Identification <span className="text-rose-500">*</span></span>
                </label>

                {loggedInStudentName ? (
                  <div className="bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm shrink-0">
                        {loggedInStudentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Logged In Student Profile
                        </span>
                        <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                          {loggedInStudentName}
                        </h4>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-purple-200/80 dark:bg-purple-900/80 text-purple-950 dark:text-purple-100 text-[11px] font-mono font-black rounded-lg border border-purple-300 dark:border-purple-700 shrink-0">
                      Auto-Embedded
                    </span>
                  </div>
                ) : studentRoster.length > 0 && !isCustomName ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedStudentName ?? ''}
                      onChange={(e) => setSelectedStudentName(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      {studentRoster.map(s => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setIsCustomName(true)}
                      className="px-3.5 py-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex-shrink-0"
                    >
                      Enter Different Name
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={customStudentName ?? ''}
                        onChange={(e) => setCustomStudentName(e.target.value)}
                        placeholder="Enter full student name (e.g. Samuel K. Johnson)"
                        required
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      />

                      {studentRoster.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsCustomName(false)}
                          className="px-3.5 py-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex-shrink-0 cursor-pointer"
                        >
                          Choose From Roster
                        </button>
                      )}
                    </div>

                    {/* Live Roster Name Matching Helper */}
                    {customStudentName.trim() && (
                      <div className="text-xs font-bold px-1 pt-1">
                        {matchedRosterName ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            Verified Student Roster Match: <strong className="font-extrabold">{matchedRosterName}</strong>
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Name not found in registered student roster. Please enter registered First and Last Name.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PROGRESS BAR & QUESTION NAVIGATOR */}
              {totalQuestionsCount > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border-2 border-purple-200 dark:border-purple-900/60 shadow-sm space-y-3.5 sticky top-0 z-20 backdrop-blur-md bg-white/95 dark:bg-slate-800/95">
                  {/* Progress Header & Stats */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider rounded-md border border-purple-200 dark:border-purple-800">
                        Quiz Progress
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 text-xs">
                        <strong>{answeredCount}</strong> of <strong>{totalQuestionsCount}</strong> Answered
                      </span>

                      {/* Auto-Save Indicator Badge */}
                      {lastAutoSavedAt && (
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-bold rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1" title="Progress auto-saved to browser storage every 30s">
                          <Save className="w-3 h-3 text-emerald-500" /> Auto-Saved ({lastAutoSavedAt})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={`font-mono text-xs font-black ${answeredCount === totalQuestionsCount ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'}`}>
                        {progressPercentage}% Completed
                      </span>
                      {unansweredCount > 0 ? (
                        <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                          {unansweredCount} Left
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Complete!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual Progress Bar Track */}
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-600 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300 ease-out shadow-xs"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>

                  {/* Question Navigator Pill Buttons */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 dark:text-slate-400 mb-2">
                      <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <Compass className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Question Navigator</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                        Click any number to jump directly
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap max-h-28 overflow-y-auto custom-scrollbar p-1.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      {quiz.questions.map((q, idx) => {
                        const isAnswered = Boolean(answers[q.id]);
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => scrollToQuestion(q.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                              isAnswered
                                ? 'bg-purple-600 dark:bg-purple-500 text-white shadow-xs hover:bg-purple-700 dark:hover:bg-purple-600'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-purple-400'
                            }`}
                            title={`Jump to Question ${idx + 1} (${isAnswered ? 'Answered' : 'Unanswered'})`}
                          >
                            <span>Q{idx + 1}</span>
                            {isAnswered && <Check className="w-3 h-3 text-purple-200" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-6">
                {quiz.questions.map((q, idx) => {
                  const selectedOptId = answers[q.id];

                  return (
                    <div 
                      key={q.id}
                      id={`q-card-${q.id}`}
                      className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700/80 shadow-md space-y-4 hover:border-purple-300 transition-all scroll-mt-24"
                    >
                      <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                        <div className="flex items-start gap-3">
                          <span className="w-8 h-8 rounded-2xl bg-purple-600 text-white font-black text-sm flex items-center justify-center font-mono shadow-md shadow-purple-600/20 flex-shrink-0">
                            {idx + 1}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                            {q.questionText}
                          </h3>
                        </div>

                        <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-black font-mono rounded-full border border-amber-200 dark:border-amber-800 flex-shrink-0">
                          {q.weight} pts
                        </span>
                      </div>

                      {/* Choices Options */}
                      <div className="space-y-2.5 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const optionLetter = String.fromCharCode(65 + optIdx);
                          const isSelected = selectedOptId === opt.id;

                          return (
                            <label
                              key={opt.id}
                              onClick={() => handleSelectOption(q.id, opt.id)}
                              className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                                isSelected
                                  ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-600 dark:border-purple-500 shadow-md'
                                  : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected ? 'border-purple-600 bg-purple-600' : 'border-slate-300 dark:border-slate-600'
                              }`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>

                              <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center font-mono flex-shrink-0 ${
                                isSelected ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}>
                                {optionLetter}
                              </span>

                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-1">
                                {opt.text}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit Action */}
              <div className="pt-4 text-center space-y-3">
                {submitError && (
                  <div role="alert" className="flex items-center gap-2 px-4 py-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-700 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-medium animate-fadeIn text-left">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{submitError}</span>
                    <button onClick={() => setSubmitError(null)} className="ml-auto text-rose-400 hover:text-rose-600" aria-label="Dismiss error">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Submit Quiz Answers for Tallying</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-3.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-2xl border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <X className="w-4 h-4 shrink-0" />
                    <span>Exit Quiz & Save Draft</span>
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
