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
  AlertCircle,
  Settings,
  Eye,
  Sliders,
  CheckSquare,
  MessageSquare,
  FileText,
  Layers,
  Image as ImageIcon,
  Download,
  Upload,
  RotateCcw,
  Sparkle,
  Calendar,
  Shuffle
} from 'lucide-react';
import { 
  QuizAssignment, 
  QuizQuestion, 
  QuizQuestionOption, 
  QuizQuestionType, 
  QuizSettings 
} from '../types';
import { DEFAULT_QUIZ_TEMPLATES } from '../data/quizTemplates';

export interface QuizCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizToEdit?: QuizAssignment | null;
  initialData?: QuizAssignment | null;
  onSaveQuiz: (quiz: QuizAssignment) => void;
  onDuplicateQuiz?: (quiz: QuizAssignment) => void;
}

export const QuizCreatorModal: React.FC<QuizCreatorModalProps> = ({
  isOpen,
  onClose,
  quizToEdit,
  initialData,
  onSaveQuiz,
  onDuplicateQuiz
}) => {
  const source = initialData ?? quizToEdit;
  
  // Navigation tab in modal
  const [activeTab, setActiveTab] = useState<'questions' | 'settings' | 'preview' | 'templates'>('questions');

  // Quiz Meta
  const [title, setTitle] = useState(source?.title || '');
  const [courseCode, setCourseCode] = useState(source?.courseCode || 'MIN-101');
  const [moduleTrack, setModuleTrack] = useState(source?.moduleTrack || 'Module 1: Scripture & Hermeneutics');
  const [description, setDescription] = useState(source?.description || 'Complete this interactive ministry quiz. Review each question carefully.');
  const [dueDate, setDueDate] = useState(source?.dueDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | undefined>(source?.timeLimitMinutes || undefined);
  const [isTemplate, setIsTemplate] = useState(source?.isTemplate || false);
  const [category, setCategory] = useState(source?.category || 'Scripture Knowledge');
  const [copiedLink, setCopiedLink] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Expanded Quiz Settings (Google Forms Quizzes Style)
  const [settings, setSettings] = useState<QuizSettings>(source?.settings || {
    shuffleQuestions: false,
    shuffleOptions: false,
    showCorrectAnswers: true,
    showPointValues: true,
    showFeedback: true,
    passingScorePercentage: 75,
    allowMultipleAttempts: true,
    maxAttempts: 2,
    gradeReleasePolicy: 'immediate',
    requireAllQuestionsAnswered: false,
    collectStudentEmail: true
  });

  // Expanded Questions State
  const [questions, setQuestions] = useState<QuizQuestion[]>(source?.questions && source.questions.length > 0 ? source.questions : [
    {
      id: 'q_1',
      questionText: 'What is the primary biblical foundation for the Great Commission in the Gospels?',
      type: 'multiple_choice',
      options: [
        { id: 'opt_1a', text: 'Matthew 28:18-20' },
        { id: 'opt_1b', text: 'Genesis 1:1' },
        { id: 'opt_1c', text: 'Romans 8:28' },
        { id: 'opt_1d', text: 'Revelation 22:20' }
      ],
      correctOptionId: 'opt_1a',
      weight: 10,
      required: true,
      explanation: 'Matthew 28:18-20 records Jesus giving the Great Commission to make disciples of all nations.',
      feedbackCorrect: 'Amen! Matthew 28:18-20 is the apostolic foundation for global discipleship.',
      feedbackIncorrect: 'See Matthew 28:18-20 for Christ\'s explicit command to disciple all nations.'
    },
    {
      id: 'q_2',
      questionText: 'Which of the following are Ascension Leadership Gifts listed in Ephesians 4:11? (Select all that apply)',
      type: 'checkboxes',
      options: [
        { id: 'opt_2a', text: 'Apostles' },
        { id: 'opt_2b', text: 'Prophets' },
        { id: 'opt_2c', text: 'Evangelists' },
        { id: 'opt_2d', text: 'Pastors and Teachers' }
      ],
      correctOptionIds: ['opt_2a', 'opt_2b', 'opt_2c', 'opt_2d'],
      weight: 15,
      required: true,
      explanation: 'Ephesians 4:11 lists Apostles, Prophets, Evangelists, Pastors, and Teachers given to equip the saints.',
      feedbackCorrect: 'Praise God! All four options represent the five-fold ministry gifts of Christ.',
      feedbackIncorrect: 'All five gifts in Ephesians 4:11 work synergistically to build up the body.'
    },
    {
      id: 'q_3',
      questionText: 'True or False: Biblical Exegesis means reading our personal modern preferences into the ancient text.',
      type: 'true_false',
      options: [
        { id: 'opt_3t', text: 'True' },
        { id: 'opt_3f', text: 'False' }
      ],
      correctOptionId: 'opt_3f',
      weight: 10,
      required: true,
      explanation: 'Exegesis means drawing out what the text says (out of the text), whereas Eisegesis means reading into the text.',
      feedbackCorrect: 'Correct! Eisegesis is reading into the text; Exegesis is drawing the truth out of the text.',
      feedbackIncorrect: 'False. Exegesis draws out the original meaning; Eisegesis reads personal biases in.'
    }
  ]);

  // Preview interactive state
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});
  const [previewScore, setPreviewScore] = useState<{ score: number; total: number; percent: number } | null>(null);

  if (!isOpen) return null;

  // Calculate total points
  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.weight) || 0), 0);

  // Unique share code
  const shareCode = source?.shareCode || `qz_${Math.random().toString(36).substring(2, 8)}`;

  // Question manipulation handlers
  const handleAddQuestion = (type: QuizQuestionType = 'multiple_choice') => {
    const newId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    
    let defaultOptions: QuizQuestionOption[] = [];
    let defaultCorrectId: string | undefined = undefined;
    let defaultCorrectIds: string[] | undefined = undefined;

    if (type === 'multiple_choice') {
      defaultOptions = [
        { id: `opt_a_${newId}`, text: '' },
        { id: `opt_b_${newId}`, text: '' },
        { id: `opt_c_${newId}`, text: '' },
        { id: `opt_d_${newId}`, text: '' }
      ];
      defaultCorrectId = `opt_a_${newId}`;
    } else if (type === 'checkboxes') {
      defaultOptions = [
        { id: `opt_a_${newId}`, text: '' },
        { id: `opt_b_${newId}`, text: '' },
        { id: `opt_c_${newId}`, text: '' }
      ];
      defaultCorrectIds = [`opt_a_${newId}`];
    } else if (type === 'true_false') {
      defaultOptions = [
        { id: `opt_t_${newId}`, text: 'True' },
        { id: `opt_f_${newId}`, text: 'False' }
      ];
      defaultCorrectId = `opt_t_${newId}`;
    }

    const newQ: QuizQuestion = {
      id: newId,
      questionText: '',
      type,
      options: defaultOptions,
      correctOptionId: defaultCorrectId,
      correctOptionIds: defaultCorrectIds,
      acceptableAnswers: type === 'short_answer' || type === 'fill_blank' ? [''] : undefined,
      weight: 10,
      required: true,
      explanation: '',
      feedbackCorrect: '',
      feedbackIncorrect: ''
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
      setValidationError('A quiz must contain at least one question.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleDuplicateQuestion = (index: number) => {
    const target = questions[index];
    const newId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const duplicated: QuizQuestion = {
      ...JSON.parse(JSON.stringify(target)),
      id: newId,
      questionText: `${target.questionText} (Copy)`
    };
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, duplicated);
    setQuestions(newQuestions);
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

  // Option handlers for multiple choice & checkboxes
  const handleAddOption = (qIndex: number) => {
    const q = questions[qIndex];
    const optId = `opt_${Date.now()}_${Math.random().toString(36).substring(2, 4)}`;
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
    if (q.options.length <= 2 && q.type !== 'checkboxes') {
      setValidationError('Multiple choice questions require at least two options.');
      return;
    }
    const optToDelete = q.options[optIndex];
    const newOptions = q.options.filter((_, i) => i !== optIndex);
    let newCorrect = q.correctOptionId;
    if (newCorrect === optToDelete.id && newOptions.length > 0) {
      newCorrect = newOptions[0].id;
    }
    const newCorrectIds = (q.correctOptionIds || []).filter(id => id !== optToDelete.id);
    handleUpdateQuestion(qIndex, { 
      ...q, 
      options: newOptions, 
      correctOptionId: newCorrect,
      correctOptionIds: newCorrectIds.length > 0 ? newCorrectIds : (newOptions[0] ? [newOptions[0].id] : [])
    });
  };

  // Toggle checkbox correct choice
  const handleToggleCheckboxCorrect = (qIndex: number, optId: string) => {
    const q = questions[qIndex];
    const current = q.correctOptionIds || [];
    const exists = current.includes(optId);
    let updated: string[];
    if (exists) {
      updated = current.filter(id => id !== optId);
      if (updated.length === 0) updated = [optId]; // keep at least one
    } else {
      updated = [...current, optId];
    }
    handleUpdateQuestion(qIndex, { ...q, correctOptionIds: updated });
  };

  // Acceptable answers for short answer
  const handleAddAcceptableAnswer = (qIndex: number) => {
    const q = questions[qIndex];
    const acceptable = q.acceptableAnswers || [];
    handleUpdateQuestion(qIndex, { ...q, acceptableAnswers: [...acceptable, ''] });
  };

  const handleUpdateAcceptableAnswer = (qIndex: number, ansIdx: number, val: string) => {
    const q = questions[qIndex];
    const acceptable = [...(q.acceptableAnswers || [])];
    acceptable[ansIdx] = val;
    handleUpdateQuestion(qIndex, { ...q, acceptableAnswers: acceptable });
  };

  const handleDeleteAcceptableAnswer = (qIndex: number, ansIdx: number) => {
    const q = questions[qIndex];
    const acceptable = (q.acceptableAnswers || []).filter((_, i) => i !== ansIdx);
    handleUpdateQuestion(qIndex, { ...q, acceptableAnswers: acceptable.length > 0 ? acceptable : [''] });
  };

  // Switch question type
  const handleQuestionTypeChange = (qIndex: number, newType: QuizQuestionType) => {
    const q = questions[qIndex];
    if (q.type === newType) return;

    let updatedOptions = q.options;
    let correctId = q.correctOptionId;
    let correctIds = q.correctOptionIds;
    let acceptable = q.acceptableAnswers;

    if (newType === 'true_false') {
      updatedOptions = [
        { id: `opt_t_${q.id}`, text: 'True' },
        { id: `opt_f_${q.id}`, text: 'False' }
      ];
      correctId = `opt_t_${q.id}`;
    } else if (newType === 'multiple_choice') {
      if (updatedOptions.length < 2) {
        updatedOptions = [
          { id: `opt_a_${q.id}`, text: 'Option A' },
          { id: `opt_b_${q.id}`, text: 'Option B' }
        ];
      }
      correctId = updatedOptions[0]?.id;
    } else if (newType === 'checkboxes') {
      if (updatedOptions.length < 2) {
        updatedOptions = [
          { id: `opt_a_${q.id}`, text: 'Option A' },
          { id: `opt_b_${q.id}`, text: 'Option B' }
        ];
      }
      correctIds = [updatedOptions[0]?.id];
    } else if (newType === 'short_answer' || newType === 'fill_blank') {
      acceptable = acceptable && acceptable.length > 0 ? acceptable : [''];
    }

    handleUpdateQuestion(qIndex, {
      ...q,
      type: newType,
      options: updatedOptions,
      correctOptionId: correctId,
      correctOptionIds: correctIds,
      acceptableAnswers: acceptable
    });
  };

  // Load template
  const handleApplyTemplate = (tmpl: QuizAssignment) => {
    setTitle(tmpl.title);
    setCourseCode(tmpl.courseCode || 'MIN-101');
    setModuleTrack(tmpl.moduleTrack || 'Curriculum Module');
    setDescription(tmpl.description || '');
    setCategory(tmpl.category || 'Scripture Knowledge');
    if (tmpl.timeLimitMinutes) setTimeLimitMinutes(tmpl.timeLimitMinutes);
    if (tmpl.settings) setSettings(tmpl.settings);
    setQuestions(JSON.parse(JSON.stringify(tmpl.questions)));
    setActiveTab('questions');
    setValidationError(null);
  };

  // Test grading in preview tab
  const handleTestGrading = () => {
    let score = 0;
    questions.forEach(q => {
      const weight = Number(q.weight) || 10;
      const ans = previewAnswers[q.id];
      if (q.type === 'multiple_choice' || q.type === 'true_false' || !q.type) {
        if (ans === q.correctOptionId) score += weight;
      } else if (q.type === 'checkboxes') {
        const correct = q.correctOptionIds || [];
        const chosen = Array.isArray(ans) ? ans : [];
        if (correct.length === chosen.length && correct.every(id => chosen.includes(id))) {
          score += weight;
        }
      } else if (q.type === 'short_answer' || q.type === 'fill_blank') {
        const acceptable = (q.acceptableAnswers || []).map(a => a.trim().toLowerCase());
        const userText = (typeof ans === 'string' ? ans : '').trim().toLowerCase();
        if (acceptable.some(a => a === userText || a.replace(/[^a-z0-9]/g, '') === userText.replace(/[^a-z0-9]/g, ''))) {
          score += weight;
        }
      } else if (q.type === 'paragraph') {
        if (typeof ans === 'string' && ans.trim().length > 10) score += weight;
      }
    });

    const percent = Math.round((score / (totalPoints || 1)) * 100);
    setPreviewScore({ score, total: totalPoints, percent });
  };

  // Final validation and save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim()) {
      setValidationError('Please specify a Quiz Title.');
      setActiveTab('questions');
      return;
    }

    if (questions.length === 0) {
      setValidationError('The quiz must include at least one question.');
      setActiveTab('questions');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        setValidationError(`Question #${i + 1} has an empty question prompt.`);
        setActiveTab('questions');
        return;
      }

      if (q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'true_false') {
        const nonEmpty = q.options.filter(o => o.text.trim().length > 0);
        if (nonEmpty.length < 2) {
          setValidationError(`Question #${i + 1} must have at least 2 non-empty choice options.`);
          setActiveTab('questions');
          return;
        }
      }

      if (q.type === 'short_answer' || q.type === 'fill_blank') {
        const validAcc = (q.acceptableAnswers || []).filter(a => a.trim().length > 0);
        if (validAcc.length === 0) {
          setValidationError(`Question #${i + 1} requires at least one acceptable answer for auto-grading.`);
          setActiveTab('questions');
          return;
        }
      }
    }

    const quizObj: QuizAssignment = {
      id: source?.id || `quiz_${Date.now()}`,
      title: title.trim(),
      courseCode: courseCode.trim() || 'MIN-101',
      moduleTrack: moduleTrack.trim(),
      description: description.trim(),
      questions,
      totalPoints,
      dueDate,
      createdAt: source?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      isPublished: true,
      isTemplate,
      shareCode,
      timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
      settings,
      category
    };

    onSaveQuiz(quizObj);
    onClose();
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#quiz/${shareCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn modal-material-scrim">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden modal-material-dialog">
        
        {/* Google Forms Inspired Top Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 text-white p-4 sm:p-5 relative shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl text-white shadow-inner shrink-0">
                <FileText className="w-5 h-5 text-purple-200" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-purple-500/30 px-2 py-0.5 rounded-full border border-purple-300/30 text-purple-100">
                    Google Forms Quiz Engine
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30 px-2 py-0.5 rounded-full">
                    {totalPoints} Total Points
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5 truncate">
                  {title.trim() ? title : (source ? 'Edit Quiz Assignment' : 'Create Google Forms Style Quiz')}
                </h2>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Subtabs (Google Forms: Questions / Settings / Preview / Templates) */}
          <div className="mt-4 pt-3 border-t border-purple-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl backdrop-blur-xs">
              <button
                type="button"
                onClick={() => setActiveTab('questions')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'questions'
                    ? 'bg-white text-purple-950 shadow-md'
                    : 'text-purple-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Questions ({questions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'settings'
                    ? 'bg-white text-purple-950 shadow-md'
                    : 'text-purple-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Quiz Settings</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-white text-purple-950 shadow-md'
                    : 'text-purple-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Student Preview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'templates'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-amber-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Ministry Presets</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="px-3 py-1.5 bg-white text-purple-900 hover:bg-purple-50 font-bold rounded-lg flex items-center gap-1 text-xs shadow-sm transition-all"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-purple-700" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
              </button>

              {source && onDuplicateQuiz && (
                <button
                  type="button"
                  onClick={() => {
                    onDuplicateQuiz(source);
                    onClose();
                  }}
                  className="px-2.5 py-1.5 bg-purple-900/60 hover:bg-purple-900 text-white font-bold rounded-lg flex items-center gap-1 text-xs border border-purple-400/40 transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-300" />
                  <span>Duplicate</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: QUESTIONS EDITOR */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              
              {/* General Quiz Details Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 space-y-4 shadow-xs">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Quiz Header & Module Metadata</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    Code: <strong className="text-purple-600 dark:text-purple-400">{shareCode}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                  <div className="md:col-span-8">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Quiz Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Day 3: Expository Hermeneutics & Homiletics Exam"
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Category Track
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="Scripture Knowledge">Scripture Knowledge</option>
                      <option value="Hermeneutics">Biblical Hermeneutics</option>
                      <option value="Ministry Leadership">Five-Fold Ministry Leadership</option>
                      <option value="Pastoral Theology">Pastoral Theology & Homiletics</option>
                      <option value="Apostolic Governance">Apostolic Governance</option>
                      <option value="Spiritual Warfare">Spiritual Warfare & Prayer</option>
                      <option value="General">General Assessment</option>
                    </select>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Course Code
                    </label>
                    <input
                      type="text"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      placeholder="MIN-101"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Module Track / Class Session
                    </label>
                    <input
                      type="text"
                      value={moduleTrack}
                      onChange={(e) => setModuleTrack(e.target.value)}
                      placeholder="Module 1: Scripture"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-12">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Instructions / Description for Students
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detailed instructions for students taking this quiz..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Questions Section Header & Quick Add Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50 dark:bg-purple-950/30 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/60">
                <div>
                  <h3 className="text-sm font-black text-purple-950 dark:text-purple-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>Interactive Question Builder ({questions.length} Questions • {totalPoints} Points)</span>
                  </h3>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                    Select question format, assign point weights, and set correct answer keys.
                  </p>
                </div>

                {/* Quick Add Buttons by Type */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('multiple_choice')}
                    className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Multiple Choice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('checkboxes')}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 transition-all"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Checkboxes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('true_false')}
                    className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 transition-all"
                  >
                    <span>True/False</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('short_answer')}
                    className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 transition-all"
                  >
                    <span>Short Answer</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-5">
                {questions.map((q, qIndex) => {
                  const qType = q.type || 'multiple_choice';

                  return (
                    <div 
                      key={q.id}
                      className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border-2 border-slate-200 dark:border-slate-700 shadow-sm space-y-4 hover:border-purple-400 dark:hover:border-purple-600 transition-all relative"
                    >
                      {/* Top Action Bar per Question */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-900/70 -mx-5 -mt-5 p-3 px-5 rounded-t-2xl border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                            {qIndex + 1}
                          </span>
                          <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Question #{qIndex + 1}
                          </span>
                          {q.required && (
                            <span className="text-rose-500 font-bold text-xs" title="Required question">*</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Question Type Switcher */}
                          <select
                            value={qType}
                            onChange={(e) => handleQuestionTypeChange(qIndex, e.target.value as QuizQuestionType)}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="multiple_choice">Multiple Choice (Single Answer)</option>
                            <option value="checkboxes">Checkboxes (Select All That Apply)</option>
                            <option value="true_false">True / False</option>
                            <option value="short_answer">Short Answer (Auto-Graded)</option>
                            <option value="fill_blank">Fill in the Blank</option>
                            <option value="paragraph">Paragraph Reflection / Open Essay</option>
                          </select>

                          {/* Points / Weight */}
                          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold">
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={q.weight ?? 10}
                              onChange={(e) => handleUpdateQuestion(qIndex, { ...q, weight: Math.max(0, Number(e.target.value) || 0) })}
                              className="w-12 text-center bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded font-mono font-black text-xs py-0.5"
                            />
                            <span>pts</span>
                          </div>

                          {/* Quick points presets */}
                          <div className="hidden sm:flex items-center gap-0.5">
                            {[5, 10, 15, 20].map(pt => (
                              <button
                                key={pt}
                                type="button"
                                onClick={() => handleUpdateQuestion(qIndex, { ...q, weight: pt })}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  q.weight === pt 
                                    ? 'bg-amber-500 text-white' 
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                                }`}
                              >
                                {pt}p
                              </button>
                            ))}
                          </div>

                          {/* Reorder / Duplicate / Delete */}
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
                              onClick={() => handleDuplicateQuestion(qIndex)}
                              className="p-1 text-slate-400 hover:text-purple-600 transition-colors"
                              title="Duplicate Question"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(qIndex)}
                              className="p-1 text-rose-400 hover:text-rose-600 transition-colors"
                              title="Delete Question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Question Prompt */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Question Prompt <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={q.questionText || ''}
                          onChange={(e) => handleUpdateQuestion(qIndex, { ...q, questionText: e.target.value })}
                          placeholder="e.g. Which scripture passage records Jesus establishing the New Covenant at the Last Supper?"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none shadow-2xs"
                        />
                      </div>

                      {/* Question Format Specific Options */}

                      {/* 1. Multiple Choice */}
                      {qType === 'multiple_choice' && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Multiple Choice Options (Select Radio Button for Correct Answer)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAddOption(qIndex)}
                              className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Option</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => {
                              const isCorrect = q.correctOptionId === opt.id;
                              const optionLetter = String.fromCharCode(65 + optIdx);

                              return (
                                <div 
                                  key={opt.id}
                                  className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                    isCorrect 
                                      ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-xs' 
                                      : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <label className="flex items-center gap-2 cursor-pointer shrink-0">
                                    <input
                                      type="radio"
                                      name={`correct_opt_${q.id}`}
                                      checked={isCorrect}
                                      onChange={() => handleUpdateQuestion(qIndex, { ...q, correctOptionId: opt.id })}
                                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span className={`w-6 h-6 rounded-md text-xs font-black flex items-center justify-center font-mono ${
                                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}>
                                      {optionLetter}
                                    </span>
                                  </label>

                                  <input
                                    type="text"
                                    value={opt.text ?? ''}
                                    onChange={(e) => handleUpdateOption(qIndex, optIdx, e.target.value)}
                                    placeholder={`Option ${optionLetter} text...`}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                                  />

                                  {isCorrect && (
                                    <span className="text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 shrink-0">
                                      Correct Answer Key
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOption(qIndex, optIdx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                    title="Delete Option"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 2. Checkboxes (Multi-Select) */}
                      {qType === 'checkboxes' && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                              <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Checkboxes (Check All Correct Answers)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAddOption(qIndex)}
                              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Option</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => {
                              const isChecked = (q.correctOptionIds || []).includes(opt.id);
                              const optionLetter = String.fromCharCode(65 + optIdx);

                              return (
                                <div 
                                  key={opt.id}
                                  className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                    isChecked 
                                      ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-700 shadow-xs' 
                                      : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <label className="flex items-center gap-2 cursor-pointer shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleCheckboxCorrect(qIndex, opt.id)}
                                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <span className={`w-6 h-6 rounded-md text-xs font-black flex items-center justify-center font-mono ${
                                      isChecked ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}>
                                      {optionLetter}
                                    </span>
                                  </label>

                                  <input
                                    type="text"
                                    value={opt.text ?? ''}
                                    onChange={(e) => handleUpdateOption(qIndex, optIdx, e.target.value)}
                                    placeholder={`Choice ${optionLetter}...`}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />

                                  {isChecked && (
                                    <span className="text-[10px] font-extrabold uppercase bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-300 shrink-0">
                                      Correct
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOption(qIndex, optIdx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 3. True / False */}
                      {qType === 'true_false' && (
                        <div className="space-y-2 pt-1">
                          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Select Correct Binary Answer:
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {q.options.map(opt => {
                              const isCorrect = q.correctOptionId === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleUpdateQuestion(qIndex, { ...q, correctOptionId: opt.id })}
                                  className={`p-3 rounded-xl border-2 font-bold text-xs flex items-center justify-between transition-all ${
                                    isCorrect 
                                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-sm' 
                                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                                  }`}
                                >
                                  <span>{opt.text}</span>
                                  {isCorrect ? (
                                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-black">
                                      Correct Key
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">Set as Correct</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 4. Short Answer & Fill Blank */}
                      {(qType === 'short_answer' || qType === 'fill_blank') && (
                        <div className="space-y-2 pt-1 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Acceptable Answer Variations (Auto-Graded Case-Insensitive)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAddAcceptableAnswer(qIndex)}
                              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Acceptable Variation</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(q.acceptableAnswers || ['']).map((ans, ansIdx) => (
                              <div key={ansIdx} className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 w-6">
                                  #{ansIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={ans}
                                  onChange={(e) => handleUpdateAcceptableAnswer(qIndex, ansIdx, e.target.value)}
                                  placeholder={ansIdx === 0 ? "Primary correct answer (e.g. 'Orthotomeo')" : "Alternative spelling / synonym"}
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                {(q.acceptableAnswers || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAcceptableAnswer(qIndex, ansIdx)}
                                    className="p-1 text-slate-400 hover:text-rose-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 5. Paragraph Reflection */}
                      {qType === 'paragraph' && (
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          <p className="font-bold flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Open Reflection Essay Question
                          </p>
                          <p>
                            Students will receive an expanded textarea to write their essay. You can review submissions and provide manual feedback / point adjustments in the Quiz Analytics Dashboard.
                          </p>
                        </div>
                      )}

                      {/* Google Forms Style Answer Feedback Section */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                            Feedback for Correct Answers (Optional)
                          </label>
                          <input
                            type="text"
                            value={q.feedbackCorrect || ''}
                            onChange={(e) => handleUpdateQuestion(qIndex, { ...q, feedbackCorrect: e.target.value })}
                            placeholder="e.g. Amen! Praise God for your sound knowledge (John 1:1)."
                            className="w-full px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200 text-xs italic outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-rose-700 dark:text-rose-400 mb-1">
                            Feedback for Incorrect Answers (Optional)
                          </label>
                          <input
                            type="text"
                            value={q.feedbackIncorrect || ''}
                            onChange={(e) => handleUpdateQuestion(qIndex, { ...q, feedbackIncorrect: e.target.value })}
                            placeholder="e.g. Review Ephesians 4:11-16 in your study guide."
                            className="w-full px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50/40 dark:bg-rose-950/20 text-slate-800 dark:text-slate-200 text-xs italic outline-none focus:ring-2 focus:ring-rose-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                            General Scripture Explanation (Shown to student on graded review sheet)
                          </label>
                          <input
                            type="text"
                            value={q.explanation || ''}
                            onChange={(e) => handleUpdateQuestion(qIndex, { ...q, explanation: e.target.value })}
                            placeholder="e.g. Scripture citation, Greek/Hebrew nuance, or theological context..."
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 text-xs italic outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* Required Question Switch */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={q.required ?? true}
                            onChange={(e) => handleUpdateQuestion(qIndex, { ...q, required: e.target.checked })}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span>Required Question (Student must answer before submitting)</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Question Footer Card */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => handleAddQuestion('multiple_choice')}
                  className="w-full py-3 border-2 border-dashed border-purple-300 dark:border-purple-800 hover:border-purple-500 dark:hover:border-purple-500 rounded-2xl text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-purple-50/60 dark:hover:bg-purple-950/40 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Next Question (Total: {questions.length} Questions • {totalPoints} Points)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE FORMS STYLE QUIZ SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-6 shadow-xs">
                
                {/* 1. Grade Release Policy */}
                <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span>Grade Release & Scoring Policy</span>
                  </h4>

                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 cursor-pointer">
                      <input
                        type="radio"
                        name="gradeRelease"
                        checked={settings.gradeReleasePolicy === 'immediate'}
                        onChange={() => setSettings({ ...settings, gradeReleasePolicy: 'immediate' })}
                        className="w-4 h-4 text-purple-600 mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Immediately after each submission</p>
                        <p className="text-[11px] text-slate-500">Students instantly see their score %, points earned, and graded answer key upon clicking submit.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 cursor-pointer">
                      <input
                        type="radio"
                        name="gradeRelease"
                        checked={settings.gradeReleasePolicy === 'manual'}
                        onChange={() => setSettings({ ...settings, gradeReleasePolicy: 'manual' })}
                        className="w-4 h-4 text-purple-600 mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Later, after manual instructor review</p>
                        <p className="text-[11px] text-slate-500">Grades and feedback are locked until the faculty reviews essay answers and clicks "Release Grades".</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 2. Respondent Review Options */}
                <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>Respondent Visibility Settings</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showCorrectAnswers ?? true}
                        onChange={(e) => setSettings({ ...settings, showCorrectAnswers: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Show Correct Answers</p>
                        <p className="text-[10px] text-slate-500">Respondents can see correct answers after grading</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showPointValues ?? true}
                        onChange={(e) => setSettings({ ...settings, showPointValues: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Show Point Values</p>
                        <p className="text-[10px] text-slate-500">Respondents can see points for each question</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showFeedback ?? true}
                        onChange={(e) => setSettings({ ...settings, showFeedback: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Show Biblical Feedback</p>
                        <p className="text-[10px] text-slate-500">Display scripture references and explanations</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.collectStudentEmail ?? true}
                        onChange={(e) => setSettings({ ...settings, collectStudentEmail: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Collect Student Email</p>
                        <p className="text-[10px] text-slate-500">Record email for notification and confirmation</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 3. Shuffle & Randomization */}
                <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Shuffle className="w-4 h-4 text-amber-600" />
                    <span>Presentation & Randomization</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.shuffleQuestions ?? false}
                        onChange={(e) => setSettings({ ...settings, shuffleQuestions: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Shuffle Question Order</p>
                        <p className="text-[10px] text-slate-500">Randomize question sequence for each student</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.shuffleOptions ?? false}
                        onChange={(e) => setSettings({ ...settings, shuffleOptions: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Shuffle Answer Choices</p>
                        <p className="text-[10px] text-slate-500">Randomize A, B, C, D choices per question</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 4. Time Limit & Retakes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Time Limit (Minutes)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={timeLimitMinutes || ''}
                        onChange={(e) => setTimeLimitMinutes(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="No limit (untimed)"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold"
                      />
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Passing Score Standard (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={settings.passingScorePercentage || 75}
                        onChange={(e) => setSettings({ ...settings, passingScorePercentage: Number(e.target.value) || 75 })}
                        className="w-24 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold"
                      />
                      <span className="text-xs font-bold text-slate-500">
                        (HTEIM Standard: <strong>75%</strong> Satisfactory)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Maximum Retake Attempts
                    </label>
                    <select
                      value={settings.maxAttempts || 2}
                      onChange={(e) => setSettings({ ...settings, maxAttempts: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold"
                    >
                      <option value={1}>1 Attempt (Strict Examination)</option>
                      <option value={2}>2 Attempts (Recommended)</option>
                      <option value={3}>3 Attempts</option>
                      <option value={99}>Unlimited Practice Attempts</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={isTemplate}
                        onChange={(e) => setIsTemplate(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span>Save as Reusable Module Template</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE STUDENT PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="bg-purple-900 text-white p-4 rounded-xl flex items-center justify-between shadow-md">
                <div>
                  <h4 className="text-sm font-black flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-300" />
                    <span>Interactive Student Test-Drive</span>
                  </h4>
                  <p className="text-xs text-purple-200">
                    Test answering questions and verify your auto-grading answer keys before publishing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestGrading}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Test Auto-Grade
                </button>
              </div>

              {previewScore && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-950 dark:text-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider">Test Run Evaluation</span>
                    <h3 className="text-xl font-black">{previewScore.score} / {previewScore.total} Points ({previewScore.percent}%)</h3>
                  </div>
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${
                    previewScore.percent >= (settings.passingScorePercentage || 75)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}>
                    {previewScore.percent >= (settings.passingScorePercentage || 75) ? 'Satisfactory Pass' : 'At-Risk (<75%)'}
                  </span>
                </div>
              )}

              {/* Preview Quiz Paper */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">{title || 'Untitled Quiz'}</h2>
                  <p className="text-xs text-slate-500 mt-1">{description}</p>
                </div>

                <div className="space-y-6">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-purple-700 dark:text-purple-300">
                          Question {idx + 1} of {questions.length} • {q.weight} pts
                        </span>
                        {q.required && <span className="text-rose-500 text-xs font-bold">* Required</span>}
                      </div>

                      <p className="text-sm font-bold text-slate-900 dark:text-white">{q.questionText || '(No prompt entered)'}</p>

                      {/* Options */}
                      {q.type === 'multiple_choice' && (
                        <div className="space-y-2">
                          {q.options.map(opt => (
                            <label key={opt.id} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs font-medium">
                              <input
                                type="radio"
                                name={`preview_${q.id}`}
                                checked={previewAnswers[q.id] === opt.id}
                                onChange={() => setPreviewAnswers({ ...previewAnswers, [q.id]: opt.id })}
                                className="w-4 h-4 text-purple-600"
                              />
                              <span>{opt.text}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {q.type === 'checkboxes' && (
                        <div className="space-y-2">
                          {q.options.map(opt => {
                            const chosen: string[] = previewAnswers[q.id] || [];
                            const isChecked = chosen.includes(opt.id);
                            return (
                              <label key={opt.id} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs font-medium">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const next = isChecked ? chosen.filter(id => id !== opt.id) : [...chosen, opt.id];
                                    setPreviewAnswers({ ...previewAnswers, [q.id]: next });
                                  }}
                                  className="w-4 h-4 text-indigo-600 rounded"
                                />
                                <span>{opt.text}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'true_false' && (
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setPreviewAnswers({ ...previewAnswers, [q.id]: opt.id })}
                              className={`p-2 rounded-lg border text-xs font-bold text-center ${
                                previewAnswers[q.id] === opt.id 
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {opt.text}
                            </button>
                          ))}
                        </div>
                      )}

                      {(q.type === 'short_answer' || q.type === 'fill_blank') && (
                        <input
                          type="text"
                          value={previewAnswers[q.id] || ''}
                          onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                          placeholder="Type your answer here..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium"
                        />
                      )}

                      {q.type === 'paragraph' && (
                        <textarea
                          rows={3}
                          value={previewAnswers[q.id] || ''}
                          onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                          placeholder="Type your open reflection response here..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRE-BUILT MINISTRY TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>HTEIM Ministry Question Bank & Curriculum Presets</span>
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    1-Click load ready-made theological quizzes with pre-configured answer keys and biblical feedback.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DEFAULT_QUIZ_TEMPLATES.map((tmpl) => (
                  <div 
                    key={tmpl.id}
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 shadow-xs flex flex-col justify-between space-y-3 transition-all"
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full">
                        {tmpl.courseCode}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-2 line-clamp-2">
                        {tmpl.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">
                        {tmpl.description}
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                        <span>{tmpl.questions.length} Questions</span>
                        <span>•</span>
                        <span>{tmpl.totalPoints} Points</span>
                        <span>•</span>
                        <span>{tmpl.timeLimitMinutes}m</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Load This Template</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-3 shrink-0 modal-material-footer">
          {validationError && (
            <div role="alert" className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-700 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-medium animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{validationError}</span>
              <button onClick={() => setValidationError(null)} className="ml-auto text-rose-400 hover:text-rose-600" aria-label="Dismiss"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
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
                <span>Copy Share Link</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:opacity-80 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Publish Quiz ({totalPoints} pts)</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
