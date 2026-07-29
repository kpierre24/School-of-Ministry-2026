import React, { useState, useEffect, useRef } from 'react';
import mammoth from 'mammoth';
import { 
  BookOpen, 
  Search, 
  Download, 
  FileText, 
  Filter, 
  CheckCircle2, 
  Headphones, 
  Sparkles,
  BookMarked,
  Upload,
  Trash2,
  Plus,
  X,
  Eye,
  RotateCcw,
  FileCheck,
  Brain,
  Clock,
  User,
  Tag,
  Loader2,
  FileSpreadsheet,
  Lock,
  ShieldAlert,
  FileCode2,
  Copy,
  Pencil,
  Link,
  ExternalLink,
  Check,
  Edit3,
  Globe
} from 'lucide-react';
import { LibraryResource, MediaResource } from '../types';
import { UserRole } from '../lib/userAuth';
import { ClassroomMediaPlayer, DEFAULT_PRESET_MEDIA } from './ClassroomMediaPlayer';

interface LibraryTabProps {
  userRole?: UserRole;
}

// Helper to check if text contains raw binary zip code / PK header from DOCX
const isBinaryZipContent = (text?: string): boolean => {
  if (!text) return false;
  return text.startsWith('PK\x03\x04') || 
         text.startsWith('PK') || 
         text.includes('[Content_Types].xml') || 
         text.includes('word/_rels/') || 
         text.includes('word/document.xml');
};

// Helper to extract clean text from file using Mammoth for DOCX
const extractCleanTextFromFile = async (file: File): Promise<string> => {
  const fileNameLower = file.name.toLowerCase();
  const isDocx = fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc') || file.type.includes('wordprocessingml') || file.type.includes('msword');

  if (isDocx) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value && result.value.trim().length > 0) {
        return result.value.trim();
      }
    } catch (err) {
      console.warn('Mammoth DOCX parsing notice:', err);
    }
  }

  // Plain text formats
  if (file.type.startsWith('text/') || fileNameLower.endsWith('.txt') || fileNameLower.endsWith('.md') || fileNameLower.endsWith('.json') || fileNameLower.endsWith('.csv')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    });
  }

  return '';
};

// Helper to extract clean text from Base64 Data URL using Mammoth
const extractCleanTextFromDataUrl = async (dataUrl: string): Promise<string> => {
  try {
    const base64Parts = dataUrl.split(',');
    if (base64Parts.length < 2) return '';
    const base64Str = base64Parts[1];
    const binaryStr = atob(base64Str);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
    return result.value ? result.value.trim() : '';
  } catch (err) {
    console.warn('Failed to parse base64 DOCX data URL with mammoth:', err);
    return '';
  }
};

const INITIAL_RESOURCES: LibraryResource[] = [
  {
    id: 'r1',
    title: 'HTEIM School of Ministry Official Student Handbook 2026',
    category: 'Textbook',
    author: 'Dr. Faculty Director',
    courseCode: 'SOM-101',
    format: 'PDF',
    size: '4.2 MB',
    downloadUrl: 'https://hteim.org/resources/handbook2026.pdf',
    summary: 'Comprehensive academic code, attendance policies, five-fold ministry doctrine, and graduation guidelines.',
    fullContent: 'HTEIM School of Ministry Student Handbook 2026.\n\nSection 1: Academic Policies & Attendance Integrity.\nSection 2: Five-Fold Ministry Core Doctrine.\nSection 3: Student Conduct & Spiritual Discipline.',
    keyTakeaways: [
      'Maintain 85%+ attendance across all active modules.',
      'Align with apostolic five-fold ministry governance.',
      'Uphold ministerial ethics and covenant accountability.'
    ],
    aiEvaluated: true,
    uploadedAt: '2026-07-01'
  },
  {
    id: 'r2',
    title: 'Apostolic Foundations & Governance Study Guide',
    category: 'Study Guide',
    author: 'Rev. Academic Dean',
    courseCode: 'SOM-101',
    format: 'PDF',
    size: '1.8 MB',
    downloadUrl: 'https://hteim.org/resources/apostolic_guide.pdf',
    summary: 'Key study notes on Matthew 28:19-20, Ephesians 2:20, and distinguishing true vs false apostolic marks.',
    fullContent: 'Apostolic Foundations & Governance Study Guide.\n\nKey Exegesis on Ephesians 2:20: Built upon the foundation of apostles and prophets, Jesus Christ Himself being the chief cornerstone.',
    keyTakeaways: [
      'Understand foundational apostolic authority.',
      'Examine spiritual signs and marks of true apostleship.',
      'Apply Matthew 28:19-20 Great Commission to church governance.'
    ],
    aiEvaluated: true,
    uploadedAt: '2026-07-05'
  },
  {
    id: 'r3',
    title: 'Scripture Memory Recitation Verse Cards Pack (Module 1-4)',
    category: 'Scripture Memory',
    author: 'HTEIM Faculty',
    courseCode: 'SOM-CORE',
    format: 'DOC',
    size: '850 KB',
    downloadUrl: 'https://hteim.org/resources/scripture_cards.docx',
    summary: 'Printable scripture flashcards for memory recitation exams including Ephesians 4:11-12, 2 Timothy 2:2.',
    fullContent: 'Scripture Memory Verses:\n1. Ephesians 4:11-12 - And He gave some, apostles; and some, prophets...\n2. 2 Timothy 2:2 - And the things that thou hast heard of me...',
    keyTakeaways: [
      'Recite key ministry scriptures verbatim.',
      'Internalize scripture for rapid diagnostic exegesis.'
    ],
    aiEvaluated: true,
    uploadedAt: '2026-07-10'
  },
  {
    id: 'r4',
    title: 'Lecture Audio: The Five-Fold Apostolic Commission & Mandate',
    category: 'Lecture Audio',
    author: 'Dr. Faculty Director',
    courseCode: 'SOM-101',
    format: 'AUDIO',
    size: '28.5 MB',
    downloadUrl: 'https://hteim.org/resources/five_fold_lecture.mp3',
    summary: 'High-definition classroom lecture audio recording on the biblical role of apostles in modern church planting.',
    fullContent: 'Classroom audio transcript: Welcome students to Module 4. Today we break down the five-fold commission...',
    keyTakeaways: [
      'Differentiate between positional title and functional ministry.',
      'Explore historical and modern church planting paradigms.'
    ],
    aiEvaluated: true,
    uploadedAt: '2026-07-12'
  }
];

export const LibraryTab: React.FC<LibraryTabProps> = ({ userRole = 'admin' }) => {
  const isStudent = userRole === 'student';
  const [resources, setResources] = useState<LibraryResource[]>(() => {
    const saved = localStorage.getItem('hteim_library_resources');
    return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
  });

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('hteim_library_resources', JSON.stringify(resources));
  }, [resources]);

  // Global classroom sermon & lecture audio/video media player state
  const [classroomMedia, setClassroomMedia] = useState<MediaResource[]>(() => {
    const saved = localStorage.getItem('hteim_classroom_media');
    return saved ? JSON.parse(saved) : DEFAULT_PRESET_MEDIA;
  });

  useEffect(() => {
    localStorage.setItem('hteim_classroom_media', JSON.stringify(classroomMedia));
  }, [classroomMedia]);

  const handleAddGlobalMedia = (newMedia: MediaResource) => {
    setClassroomMedia(prev => [newMedia, ...prev]);
  };

  const handleRemoveGlobalMedia = (mediaId: string) => {
    setClassroomMedia(prev => prev.filter(m => m.id !== mediaId));
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  
  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewResource, setPreviewResource] = useState<LibraryResource | null>(null);
  const [previewExtractedText, setPreviewExtractedText] = useState<string>('');
  const [isParsingPreview, setIsParsingPreview] = useState<boolean>(false);
  const [deleteConfirmResourceId, setDeleteConfirmResourceId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // Editing state
  const [editingResource, setEditingResource] = useState<LibraryResource | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editKeyTakeaways, setEditKeyTakeaways] = useState('');
  const [editFullContent, setEditFullContent] = useState('');

  const startEditing = (res: LibraryResource, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingResource(res);
    setEditTitle(res.title);
    setEditCategory(res.category);
    setEditAuthor(res.author);
    setEditCourseCode(res.courseCode);
    setEditSummary(res.summary);
    setEditKeyTakeaways((res.keyTakeaways || []).join('\n'));
    setEditFullContent(res.fullContent || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;

    const updatedResources = resources.map(r => {
      if (r.id === editingResource.id) {
        return {
          ...r,
          title: editTitle.trim(),
          category: editCategory,
          author: editAuthor.trim(),
          courseCode: editCourseCode.toUpperCase().trim(),
          summary: editSummary.trim(),
          keyTakeaways: editKeyTakeaways.split('\n').map(line => line.trim()).filter(Boolean),
          fullContent: editFullContent
        };
      }
      return r;
    });

    setResources(updatedResources);
    setEditingResource(null);
  };

  // Inline Edit Mode State for Direct Card Edits
  const [editingInlineId, setEditingInlineId] = useState<string | null>(null);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineLink, setInlineLink] = useState('');
  const [inlineCategory, setInlineCategory] = useState('');
  const [inlineAuthor, setInlineAuthor] = useState('');
  const [inlineCourseCode, setInlineCourseCode] = useState('');
  const [inlineSummary, setInlineSummary] = useState('');

  const startInlineEdit = (res: LibraryResource, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingInlineId(res.id);
    setInlineTitle(res.title);
    setInlineLink(res.downloadUrl || '');
    setInlineCategory(res.category);
    setInlineAuthor(res.author);
    setInlineCourseCode(res.courseCode);
    setInlineSummary(res.summary);
  };

  const cancelInlineEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingInlineId(null);
  };

  const handleSaveInlineEdit = (id: string, e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setResources(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          title: inlineTitle.trim(),
          downloadUrl: inlineLink.trim() || undefined,
          category: inlineCategory,
          author: inlineAuthor.trim(),
          courseCode: inlineCourseCode.toUpperCase().trim(),
          summary: inlineSummary.trim()
        };
      }
      return r;
    }));
    setEditingInlineId(null);
  };

  // Automatically extract clean text for DOCX files when viewing preview
  useEffect(() => {
    if (!previewResource) {
      setPreviewExtractedText('');
      setIsParsingPreview(false);
      return;
    }

    if (previewResource.fullContent && !isBinaryZipContent(previewResource.fullContent)) {
      setPreviewExtractedText(previewResource.fullContent);
      setIsParsingPreview(false);
    } else if (previewResource.fileDataUrl) {
      setIsParsingPreview(true);
      extractCleanTextFromDataUrl(previewResource.fileDataUrl).then(cleanText => {
        if (cleanText) {
          setPreviewExtractedText(cleanText);
          // Also update stored resource in state so it doesn't need to re-parse next time
          setResources(prev => prev.map(r => r.id === previewResource.id ? { ...r, fullContent: cleanText } : r));
        } else {
          setPreviewExtractedText('');
        }
        setIsParsingPreview(false);
      });
    } else {
      setPreviewExtractedText('');
      setIsParsingPreview(false);
    }
  }, [previewResource]);

  // Upload Form State
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [textTitle, setTextTitle] = useState('');
  const [textAuthor, setTextAuthor] = useState('HTEIM Faculty');
  const [textCourseCode, setTextCourseCode] = useState('SOM-101');
  const [textContent, setTextContent] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear all lessons
  const handleClearAllLessons = () => {
    setShowClearAllConfirm(true);
  };

  const executeClearAllLessons = () => {
    setResources([]);
    setPreviewResource(null);
    setShowClearAllConfirm(false);
  };

  // Reset to sample lessons
  const handleResetSampleLessons = () => {
    setResources(INITIAL_RESOURCES);
  };

  // Delete single lesson
  const handleDeleteLesson = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setResources(prev => prev.filter(r => r.id !== id));
    if (previewResource?.id === id) {
      setPreviewResource(null);
    }
  };

  // Filter logic
  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.summary.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    return true;
  });

  // Download Handler
  const handleDownload = (resource: LibraryResource, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDownloadedIds(prev => [...prev, resource.id]);

    if (resource.fileDataUrl) {
      // Direct file data url download
      const link = document.createElement('a');
      link.href = resource.fileDataUrl;
      link.download = resource.fileName || `${resource.title.replace(/\s+/g, '_')}.${resource.format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Generate formatted text/markdown downloadable file
      const fileText = `=====================================================
HTEIM SCHOOL OF MINISTRY - OFFICIAL LESSON RESOURCE
=====================================================
TITLE: ${resource.title}
AUTHOR / INSTRUCTOR: ${resource.author}
COURSE CODE: ${resource.courseCode}
CATEGORY: ${resource.category}
EVALUATED BY AI: ${resource.aiEvaluated ? 'YES (Gemini AI)' : 'NO'}
UPLOADED DATE: ${resource.uploadedAt || 'N/A'}
=====================================================

AI LESSON EVALUATION SUMMARY:
-----------------------------------------------------
${resource.summary}

${resource.keyTakeaways && resource.keyTakeaways.length > 0 ? `KEY TAKEAWAYS & OUTCOMES:
${resource.keyTakeaways.map((k, i) => `${i + 1}. ${k}`).join('\n')}
-----------------------------------------------------` : ''}

LESSON CONTENT:
-----------------------------------------------------
${resource.fullContent || 'Full lesson document content loaded for student reference.'}
`;

      const blob = new Blob([fileText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resource.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Lesson.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Helper to trigger AI Evaluation via API
  const evaluateWithAI = async (title: string, content: string, author: string, courseCode: string, fileName?: string) => {
    try {
      const res = await fetch('/api/evaluate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, author, courseCode, fileName })
      });
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('AI evaluation API call fallback:', err);
      return {
        summary: content ? `Summary: ${content.slice(0, 160)}...` : `Ministry lesson on ${title} structured for student training.`,
        category: 'Study Guide',
        keyTakeaways: ['Key ministerial concepts and biblical principles included.'],
        courseCode: courseCode || 'SOM-CORE'
      };
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  // Process & Upload Lessons
  const handleProcessUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEvaluating(true);

    const newUploadedResources: LibraryResource[] = [];

    if (uploadMode === 'text') {
      if (!textTitle.trim() || !textContent.trim()) {
        setIsEvaluating(false);
        return;
      }

      setEvaluationProgress(`AI Evaluating "${textTitle}"...`);
      const aiResult = await evaluateWithAI(textTitle, textContent, textAuthor, textCourseCode);

      const newRes: LibraryResource = {
        id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: textTitle.trim(),
        category: aiResult.category || 'Study Guide',
        author: textAuthor.trim() || 'HTEIM Faculty',
        courseCode: aiResult.courseCode || textCourseCode.toUpperCase().trim(),
        format: 'TXT',
        size: `${(new Blob([textContent]).size / 1024).toFixed(1)} KB`,
        summary: aiResult.summary,
        fullContent: textContent,
        keyTakeaways: aiResult.keyTakeaways || [],
        aiEvaluated: true,
        uploadedAt: new Date().toISOString().split('T')[0]
      };

      newUploadedResources.push(newRes);
    } else {
      // Process File Uploads
      if (selectedFiles.length === 0) {
        setIsEvaluating(false);
        return;
      }

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setEvaluationProgress(`AI Evaluating (${i + 1}/${selectedFiles.length}): "${file.name}"...`);

        // Extract clean text from file (using Mammoth for DOCX / Word files)
        let fileContentText = await extractCleanTextFromFile(file);

        // Also create Data URL for full download persistence
        const fileDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve((event.target?.result as string) || '');
          };
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });

        const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

        // Send clean extracted text to AI evaluator
        const aiResult = await evaluateWithAI(
          cleanTitle, 
          fileContentText.length > 0 ? fileContentText.slice(0, 8000) : `Lesson document file: ${file.name}`, 
          textAuthor || 'Uploaded Faculty File', 
          textCourseCode || 'SOM-CORE',
          file.name
        );

        const newRes: LibraryResource = {
          id: `res_f_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          title: cleanTitle,
          category: aiResult.category || (ext === 'MP3' || ext === 'WAV' ? 'Lecture Audio' : 'Textbook'),
          author: textAuthor.trim() || 'HTEIM Faculty',
          courseCode: aiResult.courseCode || textCourseCode.toUpperCase().trim() || 'SOM-CORE',
          format: ext === 'MP3' || ext === 'WAV' || ext === 'M4A' ? 'AUDIO' : ext === 'PDF' ? 'PDF' : ext,
          size: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(1)} KB`,
          summary: aiResult.summary,
          fullContent: fileContentText || '',
          fileDataUrl,
          fileName: file.name,
          mimeType: file.type,
          keyTakeaways: aiResult.keyTakeaways || [],
          aiEvaluated: true,
          uploadedAt: new Date().toISOString().split('T')[0]
        };

        newUploadedResources.push(newRes);
      }
    }

    setResources(prev => [...newUploadedResources, ...prev]);
    setIsEvaluating(false);
    setEvaluationProgress('');
    setShowUploadModal(false);

    // Reset Form
    setSelectedFiles([]);
    setTextTitle('');
    setTextContent('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-900/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-black tracking-tight">Digital Library & AI Lesson Repository</h2>
          </div>
          <p className="text-xs text-indigo-200 mt-1">
            Upload custom lesson files or transcripts. AI automatically evaluates content, generates concise summaries, and makes files instantly downloadable anytime.
          </p>
        </div>

        {isStudent ? (
          <div className="relative group flex-shrink-0">
            <button
              disabled
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-400 font-bold text-xs rounded-xl flex items-center gap-2 cursor-not-allowed opacity-80"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Upload Lesson Files</span>
            </button>
            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-amber-300 text-[10px] font-bold rounded-lg border border-amber-500/30 shadow-xl whitespace-nowrap z-50 animate-fadeIn">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Requires Instructor or Administrator Privileges</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {resources.length > 0 ? (
              <button
                onClick={handleClearAllLessons}
                className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Clear current lessons to upload fresh lesson files"
              >
                <Trash2 className="w-4 h-4 text-rose-400" /> Clear All Lessons
              </button>
            ) : (
              <button
                onClick={handleResetSampleLessons}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" /> Restore Sample Lessons
              </button>
            )}

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Upload Lesson Files
            </button>
          </div>
        )}
      </div>

      {/* Classroom Sermon & Lecture Audio/Video Player */}
      <ClassroomMediaPlayer
        mediaResources={classroomMedia}
        userRole={userRole}
        onAddMedia={handleAddGlobalMedia}
        onRemoveMedia={handleRemoveGlobalMedia}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search uploaded lessons, topics, AI summaries, or course code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Category:
          </span>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              categoryFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Lessons ({resources.length})
          </button>
          <button
            onClick={() => setCategoryFilter('Textbook')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              categoryFilter === 'Textbook' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-800'
            }`}
          >
            Textbooks
          </button>
          <button
            onClick={() => setCategoryFilter('Study Guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              categoryFilter === 'Study Guide' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800'
            }`}
          >
            Study Guides
          </button>
          <button
            onClick={() => setCategoryFilter('Scripture Memory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              categoryFilter === 'Scripture Memory' ? 'bg-amber-500 text-slate-950' : 'bg-amber-50 text-amber-900'
            }`}
          >
            Scripture Memory
          </button>
          <button
            onClick={() => setCategoryFilter('Lecture Audio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              categoryFilter === 'Lecture Audio' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            Lecture Audio
          </button>
        </div>
      </div>

      {/* Empty State */}
      {resources.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">The Lesson Library is Currently Empty</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Upload your lesson files, PDFs, or lecture notes. Gemini AI will evaluate each lesson, generate a card summary, and make it available for instant student download.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Upload Lessons Now
            </button>
            <button
              onClick={handleResetSampleLessons}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Restore Sample Lessons
            </button>
          </div>
        </div>
      )}

      {/* Lesson Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredResources.map((res) => {
          const isDownloaded = downloadedIds.includes(res.id);
          const isInlineEditing = editingInlineId === res.id;

          if (isInlineEditing) {
            return (
              <div 
                key={res.id} 
                className="bg-slate-900 border-2 border-amber-500 rounded-2xl p-5 shadow-xl transition-all space-y-3.5 relative text-white animate-fadeIn"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" /> Inline Edit Mode
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleSaveInlineEdit(res.id, e)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-md"
                      title="Save inline changes"
                    >
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelInlineEdit}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                      title="Cancel inline editing"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  {/* Title Input */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Resource Title
                    </label>
                    <input
                      type="text"
                      value={inlineTitle}
                      onChange={(e) => setInlineTitle(e.target.value)}
                      placeholder="Resource title..."
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Resource Link / URL Input */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Link className="w-3 h-3 text-amber-400" /> Resource Link / Download URL
                    </label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="url"
                        value={inlineLink}
                        onChange={(e) => setInlineLink(e.target.value)}
                        placeholder="https://hteim.org/resources/file.pdf"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>

                  {/* Category & Course Code */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Category</label>
                      <select
                        value={inlineCategory}
                        onChange={(e) => setInlineCategory(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-[11px] font-bold text-slate-200 focus:outline-none"
                      >
                        <option value="Textbook">Textbook</option>
                        <option value="Study Guide">Study Guide</option>
                        <option value="Scripture Memory">Scripture Memory</option>
                        <option value="Lecture Audio">Lecture Audio</option>
                        <option value="Syllabus">Syllabus</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Course Code</label>
                      <input
                        type="text"
                        value={inlineCourseCode}
                        onChange={(e) => setInlineCourseCode(e.target.value)}
                        placeholder="SOM-101"
                        className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-[11px] font-mono text-slate-200 focus:outline-none uppercase"
                      />
                    </div>
                  </div>

                  {/* Author / Instructor */}
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Author / Instructor</label>
                    <input
                      type="text"
                      value={inlineAuthor}
                      onChange={(e) => setInlineAuthor(e.target.value)}
                      placeholder="Instructor Name"
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-[11px] font-medium text-slate-200 focus:outline-none"
                    />
                  </div>

                  {/* Summary / Notes */}
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Summary / AI Notes</label>
                    <textarea
                      rows={2}
                      value={inlineSummary}
                      onChange={(e) => setInlineSummary(e.target.value)}
                      placeholder="Brief lesson overview..."
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelInlineEdit}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSaveInlineEdit(res.id, e)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={res.id} 
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
            >
              <div>
                {/* Header Badge & Action Buttons */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      res.format === 'PDF' 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                        : res.format === 'AUDIO' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {res.format === 'AUDIO' ? <Headphones className="w-3 h-3 inline mr-1" /> : <FileText className="w-3 h-3 inline mr-1" />}
                      {res.format} ({res.size})
                    </span>

                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded">
                      {res.courseCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {res.aiEvaluated && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-extrabold flex items-center gap-1" title="Evaluated by Gemini AI">
                        <Sparkles className="w-3 h-3 text-amber-500" /> AI
                      </span>
                    )}
                    {!isStudent && (
                      <button
                        type="button"
                        onClick={(e) => startInlineEdit(res, e)}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        title="Inline edit title & link directly on card"
                      >
                        <Edit3 className="w-3 h-3 text-amber-600" /> Inline Edit
                      </button>
                    )}
                    {!isStudent && (
                      <button
                        type="button"
                        onClick={(e) => startEditing(res, e)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all cursor-pointer"
                        title="Full Modal Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!isStudent && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteLesson(res.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                        title="Delete Lesson"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 mb-1 leading-snug line-clamp-2">
                  {res.title}
                </h3>

                <p className="text-[11px] text-slate-500 mb-2 font-semibold flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> {res.author}
                </p>

                {/* Resource Link / URL Badge if present */}
                {res.downloadUrl && (
                  <div className="mb-3 p-2 bg-indigo-50/80 border border-indigo-200/80 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Link className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                      <span className="text-[10px] font-mono font-bold text-indigo-900 truncate">
                        {res.downloadUrl}
                      </span>
                    </div>
                    <a
                      href={res.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-md flex items-center gap-1 flex-shrink-0 cursor-pointer shadow-2xs"
                      title="Open external link in new tab"
                    >
                      <ExternalLink className="w-3 h-3" /> Visit
                    </a>
                  </div>
                )}

                {/* AI Summary Card Box */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-2 relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1">
                      <Brain className="w-3 h-3 text-indigo-600" /> AI Lesson Summary
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      {res.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                    {res.summary}
                  </p>
                </div>

                {/* Key Takeaways snippet if present */}
                {res.keyTakeaways && res.keyTakeaways.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Key Takeaways:</p>
                    {res.keyTakeaways.slice(0, 2).map((k, idx) => (
                      <p key={idx} className="text-[11px] text-slate-600 flex items-start gap-1 line-clamp-1">
                        <span className="text-emerald-500 font-bold">•</span> {k}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewResource(res)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Read
                </button>

                <button
                  onClick={(e) => handleDownload(res, e)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isDownloaded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                  title="Download lesson file anytime"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isDownloaded ? 'Downloaded' : 'Download File'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Modal with File Drag-Drop & AI Processing */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleProcessUpload} className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-scaleUp">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-extrabold">Upload Lessons & AI Content Evaluator</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Tab Selector: Upload Files vs Paste Text */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`pb-2.5 px-4 text-xs font-extrabold border-b-2 cursor-pointer transition-all ${
                    uploadMode === 'file' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Upload Lesson Documents / Audio
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('text')}
                  className={`pb-2.5 px-4 text-xs font-extrabold border-b-2 cursor-pointer transition-all ${
                    uploadMode === 'text' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Paste Lesson Notes / Text
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Author / Instructor</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Faculty Director"
                    value={textAuthor}
                    onChange={(e) => setTextAuthor(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Course Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SOM-101"
                    value={textCourseCode}
                    onChange={(e) => setTextCourseCode(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {uploadMode === 'file' ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Select Lesson Files</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 p-6 rounded-2xl text-center cursor-pointer transition-all space-y-2"
                  >
                    <Upload className="w-8 h-8 text-indigo-600 mx-auto" />
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">
                        {selectedFiles.length > 0 
                          ? `${selectedFiles.length} file(s) selected` 
                          : 'Click or drag files to upload lessons'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Supports PDF, TXT, DOC/DOCX, Audio (MP3), Markdown, etc.
                      </p>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto">
                      {selectedFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium">
                          <span className="truncate max-w-[280px]">📄 {f.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{(f.size / 1024).toFixed(1)} KB</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Lesson Title *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Expository Hermeneutics & Sermon Delivery"
                      value={textTitle}
                      onChange={(e) => setTextTitle(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Lesson Content / Transcript *</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Paste complete lesson notes, scripture references, or lecture transcript here..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none font-medium"
                    />
                  </div>
                </div>
              )}

              {/* AI Notice Box */}
              <div className="p-3 bg-gradient-to-r from-indigo-50 to-amber-50 border border-indigo-200 rounded-xl flex items-start gap-2.5 text-xs">
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-indigo-950">Automatic Gemini AI Evaluation</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Gemini AI will read the content, generate an executive summary for the lesson card, extract key takeaways, and assign the appropriate category.
                  </p>
                </div>
              </div>

              {isEvaluating && (
                <div className="p-4 bg-indigo-900 text-white rounded-xl text-center space-y-2 animate-pulse">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400" />
                  <p className="text-xs font-extrabold">{evaluationProgress || 'Evaluating lesson content with Gemini AI...'}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isEvaluating}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Evaluate & Save Lessons
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preview Full Lesson Modal */}
      {previewResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleUp">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/20 px-2 py-0.5 rounded border border-emerald-400/30">
                  {previewResource.courseCode} • {previewResource.category}
                </span>
                <h3 className="text-base font-extrabold mt-1">{previewResource.title}</h3>
              </div>
              <button 
                onClick={() => setPreviewResource(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs text-slate-800">
              {/* AI Evaluation Box */}
              <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-indigo-900 flex items-center gap-1.5 text-xs">
                    <Brain className="w-4 h-4 text-indigo-600" /> AI Executive Summary
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    {previewResource.format} ({previewResource.size})
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {previewResource.summary}
                </p>

                {previewResource.keyTakeaways && previewResource.keyTakeaways.length > 0 && (
                  <div className="pt-2 border-t border-indigo-200/60 space-y-1">
                    <span className="font-extrabold text-[10px] uppercase text-indigo-800">Key Learning Takeaways:</span>
                    {previewResource.keyTakeaways.map((k, i) => (
                      <p key={i} className="text-slate-700 flex items-start gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{k}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Full Content */}
              <div>
                <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Full Lesson Material / Document Content</span>
                  {isParsingPreview && (
                    <span className="text-amber-500 font-bold flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Parsing Word document...
                    </span>
                  )}
                </h4>

                {isParsingPreview ? (
                  <div className="p-8 bg-slate-900 text-slate-300 rounded-xl text-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400" />
                    <p className="text-xs font-bold">Extracting clean lesson text from Word (.docx) document...</p>
                  </div>
                ) : previewExtractedText && !isBinaryZipContent(previewExtractedText) ? (
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-sans text-xs whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto border border-slate-800">
                    {previewExtractedText}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-slate-800 space-y-3">
                    <div className="flex items-center gap-2.5 font-black text-indigo-950 text-sm">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <span>{previewResource.format} Document Attached ({previewResource.fileName || `${previewResource.title}.${previewResource.format.toLowerCase()}`})</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      This lesson is stored in native <strong>{previewResource.format}</strong> document format ({previewResource.size}). Gemini AI has evaluated the lesson structure and generated the full executive summary and key takeaways above.
                    </p>
                    <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {previewResource.courseCode} • Author: {previewResource.author}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDownload(previewResource, e)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" /> Download Original File
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">
                Author: {previewResource.author}
              </span>
              <div className="flex items-center gap-2">
                {!isStudent && (
                  <button
                    onClick={() => {
                      startEditing(previewResource);
                      setPreviewResource(null);
                    }}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit Resource
                  </button>
                )}
                <button
                  onClick={() => setPreviewResource(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={(e) => handleDownload(previewResource, e)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" /> Download File Anytime
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Resource Modal */}
      {editingResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-scaleUp">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-extrabold">Edit Library Resource Details</h3>
              </div>
              <button 
                type="button"
                onClick={() => setEditingResource(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Author / Instructor</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Faculty Director"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="SOM-101"
                    value={editCourseCode}
                    onChange={(e) => setEditCourseCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="Textbook">Textbook</option>
                    <option value="Study Guide">Study Guide</option>
                    <option value="Scripture Memory">Scripture Memory</option>
                    <option value="Lecture Audio">Lecture Audio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Format / Size</label>
                  <input
                    type="text"
                    disabled
                    value={`${editingResource.format} (${editingResource.size})`}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Resource Title *</label>
                <input
                  required
                  type="text"
                  placeholder="Expository Hermeneutics"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Executive Summary *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Summarize this library resource..."
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Key Learning Takeaways (one takeaway per line)</label>
                <textarea
                  rows={3}
                  placeholder="Add key learning points, each on a new line..."
                  value={editKeyTakeaways}
                  onChange={(e) => setEditKeyTakeaways(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Full Document Content / Transcripts</label>
                <textarea
                  rows={6}
                  placeholder="Complete reference text or lesson transcripts..."
                  value={editFullContent}
                  onChange={(e) => setEditFullContent(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 focus:bg-white font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CLEAR ALL CONFIRMATION */}
      {/* ========================================================= */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Clear Library</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to clear all current lessons from the library? You will still be able to upload your own custom lessons later.
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                onClick={() => setShowClearAllConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeClearAllLessons}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
