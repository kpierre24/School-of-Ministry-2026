import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  HelpCircle, 
  Copy, 
  Share2, 
  Clock, 
  Award, 
  Sparkles, 
  Check, 
  BookOpen, 
  ChevronUp, 
  ChevronDown, 
  Link as LinkIcon,
  AlertCircle
} from 'lucide-react';
import { QuizAssignment, QuizQuestion, QuizQuestionOption, CustomAssignment } from '../types';

interface QuizCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizToEdit?: QuizAssignment | null;
  onSaveQuiz: (quiz: QuizAssignment) => void;
  onDuplicateQuiz?: (quiz: QuizAssignment) => void;
}

export const QuizCreatorModal: React.FC<QuizCreatorModalProps> = ({
  isOpen,
  onClose,
  quizToEdit,
  onSaveQuiz,
  onDuplicateQuiz
}) => {
  const [title, setTitle] = useState(quizToEdit?.title || '');
  const [courseCode, setCourseCode] = useState(quizToEdit?.courseCode || 'MIN-101');
  const [moduleTrack, setModuleTrack] = useState(quizToEdit?.moduleTrack || 'Module 1: Introduction');
  const [description, setDescription] = useState(quizToEdit?.description || 'Complete this Google Forms style daily quiz. Select the correct answer for each weighted question.');
  const [dueDate, setDueDate] = useState(quizToEdit?.dueDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | undefined>(quizToEdit?.timeLimitMinutes || undefined);
  const [isTemplate, setIsTemplate] = useState(quizToEdit?.isTemplate || false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Questions state
  const [questions, setQuestions] = useState<QuizQuestion[]>(quizToEdit?.questions || [
    {
      id: 'q_1',
      questionText: 'What is the primary biblical foundation for the Great Commission in the Gospels?',
      type: 'multiple_choice',
      options: [
        { id: 'opt_a', text: 'Matthew 28:18-20' },
        { id: 'opt_b', text: 'Genesis 1:1' },
        { id: 'opt_c', text: 'Romans 8:28' },
        { id: 'opt_d', text: 'Revelation 22:20' }
      ],
      correctOptionId: 'opt_a',
      weight: 10,
      explanation: 'Matthew 28:18-20 records Jesus giving the Great Commission to go and make disciples of all nations.'
    },
    {
      id: 'q_2',
      questionText: 'According to Ephesians 4:11-12, what is the primary purpose of five-fold ministry leadership gifts?',
      type: 'multiple_choice',
      options: [
        { id: 'opt_a', text: 'To perform all ministry work alone without church involvement' },
        { id: 'opt_b', text: 'To equip the saints for the work of ministry and build up the body of Christ' },
        { id: 'opt_c', text: 'To establish organizational bureaucracy' },
        { id: 'opt_d', text: 'To replace personal prayer and study' }
      ],
      correctOptionId: 'opt_b',
      weight: 10,
      explanation: 'Ephesians 4:12 explicitly states that leaders are given to equip the saints for ministry.'
    }
  ]);

  if (!isOpen) return null;

  // Calculate total points
  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.weight) || 0), 0);

  // Generate unique share code
  const shareCode = quizToEdit?.shareCode || `qz_${Math.random().toString(36).substr(2, 7)}`;

  // Question handlers
  const handleAddQuestion = () => {
    const newId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newQ: QuizQuestion = {
      id: newId,
      questionText: '',
      type: 'multiple_choice',
      options: [
        { id: `opt_a_${newId}`, text: '' },
        { id: `opt_b_${newId}`, text: '' },
        { id: `opt_c_${newId}`, text: '' },
        { id: `opt_d_${newId}`, text: '' }
      ],
      correctOptionId: `opt_a_${newId}`,
      weight: 10,
      explanation: ''
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestion = (index: number, updated: QuizQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updated;
    setQuestions(newQuestions);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert('A quiz must have at least one question.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const newQuestions = [...questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[targetIdx];
    newQuestions[targetIdx] = temp;
    setQuestions(newQuestions);
  };

  // Option handlers
  const handleAddOption = (qIndex: number) => {
    const q = questions[qIndex];
    const optId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`;
    const newOptions = [...q.options, { id: optId, text: '' }];
    handleUpdateQuestion(qIndex, { ...q, options: newOptions });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, text: string) => {
    const q = questions[qIndex];
    const newOptions = [...q.options];
    newOptions[optIndex] = { ...newOptions[optIndex], text };
    handleUpdateQuestion(qIndex, { ...q, options: newOptions });
  };

  const handleDeleteOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    if (q.options.length <= 2) {
      alert('Questions require at least two choices.');
      return;
    }
    const optToDelete = q.options[optIndex];
    const newOptions = q.options.filter((_, i) => i !== optIndex);
    let newCorrect = q.correctOptionId;
    if (newCorrect === optToDelete.id) {
      newCorrect = newOptions[0].id;
    }
    handleUpdateQuestion(qIndex, { ...q, options: newOptions, correctOptionId: newCorrect });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a Quiz Title.');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        alert(`Question #${i + 1} is missing question text.`);
        return;
      }
      const validOptions = q.options.filter(o => o.text.trim().length > 0);
      if (validOptions.length < 2) {
        alert(`Question #${i + 1} must have at least 2 non-empty choices.`);
        return;
      }
    }

    const quizObj: QuizAssignment = {
      id: quizToEdit?.id || `quiz_${Date.now()}`,
      title: title.trim(),
      courseCode: courseCode.trim() || 'MIN-101',
      moduleTrack: moduleTrack.trim(),
      description: description.trim(),
      questions,
      totalPoints,
      dueDate,
      createdAt: quizToEdit?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      isPublished: true,
      isTemplate,
      shareCode,
      timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined
    };

    onSaveQuiz(quizObj);
    onClose();
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?quiz=${shareCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header Bar with Google Forms style accent */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white p-5 sm:p-6 relative flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl text-white shadow-inner">
                ?
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-purple-500/30 px-2.5 py-0.5 rounded-full border border-purple-300/30 text-purple-100">
                  Google Forms Style Quiz Creator
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                  {quizToEdit ? 'Modify Quiz Assignment' : 'Create New Class Day Quiz'}
                </h2>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-4 pt-3 border-t border-purple-500/30 flex flex-wrap items-center justify-between gap-3 text-xs text-purple-100 font-medium">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-mono font-bold bg-white/10 px-3 py-1 rounded-xl">
                <Award className="w-4 h-4 text-amber-300" />
                <span>Total Points: <strong className="text-amber-300 font-black text-sm">{totalPoints} pts</strong></span>
              </span>
              <span className="flex items-center gap-1.5 font-mono font-bold bg-white/10 px-3 py-1 rounded-xl">
                <HelpCircle className="w-4 h-4 text-purple-200" />
                <span>Questions: <strong className="text-white font-black">{questions.length}</strong></span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="px-3 py-1.5 bg-white text-purple-900 hover:bg-purple-50 font-bold rounded-xl flex items-center gap-1.5 text-xs shadow-md transition-all active:scale-95"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-purple-700" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
              </button>

              {quizToEdit && onDuplicateQuiz && (
                <button
                  type="button"
                  onClick={() => {
                    onDuplicateQuiz(quizToEdit);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-purple-900/60 hover:bg-purple-900 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs border border-purple-400/40 transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-300" />
                  <span>Duplicate Quiz</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Section 1: Quiz Settings */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>General Quiz Information</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quiz Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Day 4 Quiz: Prophetic Ministry & Biblical Hermeneutics"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Course / Module Code
                </label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="MIN-101"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Module Track / Class Session
                </label>
                <input
                  type="text"
                  value={moduleTrack}
                  onChange={(e) => setModuleTrack(e.target.value)}
                  placeholder="e.g. Session 4 (Hermeneutics)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Time Limit (Minutes, optional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={timeLimitMinutes || ''}
                    onChange={(e) => setTimeLimitMinutes(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="No time limit"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Instructions / Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instructions for students taking this quiz..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTemplate}
                    onChange={(e) => setIsTemplate(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Save as Reusable Quiz Template (for copying to future class days)
                  </span>
                </label>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Share Code: <span className="font-bold text-purple-600 dark:text-purple-400">{shareCode}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Questions Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>Weighted Quiz Questions ({questions.length})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assign point weights per question and mark the radio button next to the correct choice.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-5">
              {questions.map((q, qIndex) => (
                <div 
                  key={q.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 border-slate-200 dark:border-slate-700 shadow-sm relative space-y-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                >
                  {/* Top Bar for Question */}
                  <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 -mx-5 -mt-5 p-3.5 px-5 rounded-t-2xl border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shadow">
                        {qIndex + 1}
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Question #{qIndex + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Weight Selector */}
                      <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                        <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <label className="text-[11px] font-bold">Weight:</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={q.weight}
                          onChange={(e) => handleUpdateQuestion(qIndex, { ...q, weight: Number(e.target.value) || 0 })}
                          className="w-14 px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-center font-mono font-black text-xs text-amber-900 dark:text-amber-200 outline-none"
                        />
                        <span className="text-[11px] font-bold">pts</span>
                      </div>

                      {/* Reorder & Delete */}
                      <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                        <button
                          type="button"
                          disabled={qIndex === 0}
                          onClick={() => handleMoveQuestion(qIndex, 'up')}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30"
                          title="Move Up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={qIndex === questions.length - 1}
                          onClick={() => handleMoveQuestion(qIndex, 'down')}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30"
                          title="Move Down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(qIndex)}
                          className="p-1 text-rose-500 hover:text-rose-700 transition-colors ml-1"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Question Prompt
                    </label>
                    <input
                      type="text"
                      value={q.questionText}
                      onChange={(e) => handleUpdateQuestion(qIndex, { ...q, questionText: e.target.value })}
                      placeholder="e.g. Which chapter in Romans deals with life in the Holy Spirit and divine adoption?"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  {/* Multiple Choice Options */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Choices (Select the Radio Button for Correct Answer)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddOption(qIndex)}
                        className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Choice Option</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctOptionId === opt.id;
                        const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D...

                        return (
                          <div 
                            key={opt.id}
                            className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                              isCorrect 
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700' 
                                : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                              <input
                                type="radio"
                                name={`correct_opt_${q.id}`}
                                checked={isCorrect}
                                onChange={() => handleUpdateQuestion(qIndex, { ...q, correctOptionId: opt.id })}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center font-mono ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}>
                                {optionLetter}
                              </span>
                            </label>

                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleUpdateOption(qIndex, optIdx, e.target.value)}
                              placeholder={`Option ${optionLetter} text...`}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                            />

                            {isCorrect && (
                              <span className="text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 flex-shrink-0">
                                Correct Answer
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteOption(qIndex, optIdx)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete Choice"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation for Students */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Answer Explanation (Optional - displayed to student after submission)
                    </label>
                    <input
                      type="text"
                      value={q.explanation || ''}
                      onChange={(e) => handleUpdateQuestion(qIndex, { ...q, explanation: e.target.value })}
                      placeholder="e.g. Scripture citation or reasoning for the correct answer..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 text-xs italic focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="w-full py-3 border-2 border-dashed border-purple-300 dark:border-purple-800 hover:border-purple-500 dark:hover:border-purple-500 rounded-2xl text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Question (Total Currently: {questions.length})</span>
              </button>
            </div>
          </div>
        </form>

        {/* Footer Bar */}
        <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="px-4 py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors flex items-center gap-1.5"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Publish Quiz ({totalPoints} pts)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
