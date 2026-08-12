import React, { useState, useEffect, useRef } from 'react';
import mammoth from 'mammoth';
import { evaluateLesson } from '../lib/api/ai';
import { logger } from '../lib/logger';
import { 
  BookOpen, 
  Search, 
  Download, 
  FileText, 
  Filter, 
  CheckCircle2, 
  Headphones, 
  Video as VideoIcon,
  Play,
  Tv,
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
  Globe,
  RefreshCw,
  CloudDownload
} from 'lucide-react';
import { EmptyState } from './UXPrimitives';
import { Modal } from './Modal';
import { LibraryResource, MediaResource } from '../types';
import { UserRole } from '../lib/userAuth';
import { uploadToSupabaseStorage, syncLibraryFromSupabaseBucket } from '../lib/supabaseClient';
import { ClassroomMediaPlayer, DEFAULT_PRESET_MEDIA } from './ClassroomMediaPlayer';
import { parseVideoMediaUrl } from '../lib/mediaUtils';

interface LibraryTabProps {
  userRole?: UserRole;
  resources?: LibraryResource[];
  setResources?: React.Dispatch<React.SetStateAction<LibraryResource[]>>;
  classroomMedia?: MediaResource[];
  setClassroomMedia?: React.Dispatch<React.SetStateAction<MediaResource[]>>;
  onOpenDiagnostics?: () => void;
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

export const INITIAL_RESOURCES: LibraryResource[] = [];

export const LibraryTab: React.FC<LibraryTabProps> = ({ 
  userRole = 'admin',
  resources: propResources,
  setResources: propSetResources,
  classroomMedia: propClassroomMedia,
  setClassroomMedia: propSetClassroomMedia,
  onOpenDiagnostics
}) => {
  const isStudent = userRole === 'student';

  const [localResources, setLocalResources] = useState<LibraryResource[]>(() => {
    const saved = localStorage.getItem('hteim_library_resources');
    return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
  });

  const resources = propResources !== undefined ? propResources : localResources;
  const setResources = propSetResources !== undefined ? propSetResources : setLocalResources;

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('hteim_library_resources', JSON.stringify(resources));
  }, [resources]);

  // Global classroom sermon & lecture audio/video media player state
  const [localClassroomMedia, setLocalClassroomMedia] = useState<MediaResource[]>(() => {
    const saved = localStorage.getItem('hteim_classroom_media');
    return saved ? JSON.parse(saved) : DEFAULT_PRESET_MEDIA;
  });

  const classroomMedia = propClassroomMedia !== undefined ? propClassroomMedia : localClassroomMedia;
  const setClassroomMedia = propSetClassroomMedia !== undefined ? propSetClassroomMedia : setLocalClassroomMedia;

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
  const [isSyncingStorage, setIsSyncingStorage] = useState(false);
  
  // Auto-scan Supabase storage bucket for missing uploaded files on mount
  useEffect(() => {
    syncLibraryFromSupabaseBucket(resources).then(({ updatedResources, addedCount }) => {
      if (addedCount > 0) {
        setResources(updatedResources);
      }
    }).catch(err => {
      console.warn("Library storage auto-sync skipped:", err);
    });
  }, []);

  const [syncBannerMessage, setSyncBannerMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showSyncBanner = (type: 'success' | 'error' | 'info', text: string) => {
    setSyncBannerMessage({ type, text });
    setTimeout(() => setSyncBannerMessage(null), 5000);
  };

  const handleSyncFromSupabaseStorage = async () => {
    setIsSyncingStorage(true);
    try {
      const { updatedResources, addedCount } = await syncLibraryFromSupabaseBucket(resources);
      if (addedCount > 0) {
        setResources(updatedResources);
        showSyncBanner('success', `Synced ${addedCount} document(s) from Supabase 'library' storage into your Library.`);
      } else {
        showSyncBanner('info', "All files are already synced — no new documents found in Supabase storage.");
      }
    } catch (err: any) {
      console.error("Storage sync failed:", err);
      showSyncBanner('error', `Storage sync failed: ${err.message || String(err)}`);
    } finally {
      setIsSyncingStorage(false);
    }
  };
  
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
  const [uploadMode, setUploadMode] = useState<'file' | 'text' | 'gdrive'>('file');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [textTitle, setTextTitle] = useState('');
  const [textAuthor, setTextAuthor] = useState('HTEIM Faculty');
  const [textCourseCode, setTextCourseCode] = useState('SOM-101');
  const [textContent, setTextContent] = useState('');

  // Google Drive Upload State
  const [gdriveUrl, setGdriveUrl] = useState('');
  const [gdriveTitle, setGdriveTitle] = useState('');
  const [gdriveAuthor, setGdriveAuthor] = useState('Dr. Faculty Director');
  const [gdriveCourseCode, setGdriveCourseCode] = useState('SOM-101');
  const [gdriveCategory, setGdriveCategory] = useState('Livestream Recording');
  const [gdriveSummary, setGdriveSummary] = useState('');

  // Playing Video Lightbox Modal State
  const [playingVideoModalResource, setPlayingVideoModalResource] = useState<LibraryResource | null>(null);

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
      const result = await evaluateLesson({ title, content, author, courseCode, fileName });
      if (result.success && result.data) {
        return result.data;
      }
      logger.warn('AI evaluation API returned error:', result.error);
      return {
        summary: content ? `Summary: ${content.slice(0, 160)}...` : `Ministry lesson on ${title} structured for student training.`,
        category: 'Study Guide',
        keyTakeaways: ['Key ministerial concepts and biblical principles included.'],
        courseCode: courseCode || 'SOM-CORE'
      };
    } catch (err) {
      logger.warn('AI evaluation API call fallback:', err);
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

    if (uploadMode === 'gdrive') {
      if (!gdriveUrl.trim() || !gdriveTitle.trim()) {
        setIsEvaluating(false);
        return;
      }

      setEvaluationProgress(`AI Registering Google Drive Livestream "${gdriveTitle}"...`);

      const summaryText = gdriveSummary.trim() || 'Livestream video recording saved on Google Drive. Stream directly inside the app.';

      const newRes: LibraryResource = {
        id: `res_gdrive_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: gdriveTitle.trim(),
        category: gdriveCategory || 'Livestream Recording',
        author: gdriveAuthor.trim() || 'HTEIM Faculty',
        courseCode: gdriveCourseCode.toUpperCase().trim() || 'SOM-101',
        format: 'VIDEO',
        size: 'Google Drive HD',
        downloadUrl: gdriveUrl.trim(),
        summary: summaryText,
        fullContent: `Google Drive Livestream Video Recording.\nLink: ${gdriveUrl}\nTitle: ${gdriveTitle}`,
        keyTakeaways: [
          'Watch live stream video directly inside the app video player.',
          'Saved to Google Drive cloud storage.'
        ],
        aiEvaluated: true,
        uploadedAt: new Date().toISOString().split('T')[0]
      };

      newUploadedResources.push(newRes);

      // Auto-sync to Classroom Media Player tracks as well
      const newMediaTrack: MediaResource = {
        id: `media_gdrive_${Date.now()}`,
        title: gdriveTitle.trim(),
        speaker: gdriveAuthor.trim() || 'HTEIM Faculty',
        duration: 'Livestream',
        type: 'video',
        url: gdriveUrl.trim(),
        description: summaryText,
        dateAdded: new Date().toISOString().split('T')[0]
      };

      if (setClassroomMedia) {
        setClassroomMedia(prev => [newMediaTrack, ...prev]);
      }
    } else if (uploadMode === 'text') {
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

        // Upload lesson/media files directly to Supabase storage with a fallback to local Base64
        let fileDataUrl = '';
        try {
          fileDataUrl = await uploadToSupabaseStorage('library', file.name, file);
        } catch (err) {
          console.error("Failed to upload library resource to Supabase Storage:", err);
        }

        if (!fileDataUrl) {
          fileDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              resolve((event.target?.result as string) || '');
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
        }

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
          downloadUrl: fileDataUrl,
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
    setGdriveUrl('');
    setGdriveTitle('');
    setGdriveSummary('');
  };

  return (
    <div className="material-screen space-y-6 animate-fadeIn pb-28 sm:pb-24 md:pb-8">
      {/* Sync Feedback Banner */}
      {syncBannerMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm font-medium shadow-sm animate-fadeIn ${
            syncBannerMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-300' :
            syncBannerMessage.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-300' :
            'bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-300'
          }`}
        >
          <span>{syncBannerMessage.text}</span>
          <button onClick={() => setSyncBannerMessage(null)} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Digital Library & AI Lesson Repository</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload custom lesson files or transcripts. AI automatically evaluates content, generates concise summaries, and makes files instantly downloadable anytime.
          </p>
        </div>

        {!isStudent && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncFromSupabaseStorage}
              disabled={isSyncingStorage}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Fetch and import any documents from Supabase Storage bucket 'library' into your app"
            >
              <CloudDownload className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${isSyncingStorage ? 'animate-bounce' : ''}`} /> 
              {isSyncingStorage ? 'Scanning Storage...' : 'Sync Storage Files'}
            </button>

            {onOpenDiagnostics && (
              <button
                onClick={onOpenDiagnostics}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Evaluate Supabase storage buckets and permissions for missing files"
              >
                <ShieldAlert className="w-4 h-4 text-slate-600 dark:text-slate-300" /> Storage Diagnostics
              </button>
            )}

            {resources.length > 0 ? (
              <button
                onClick={handleClearAllLessons}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Clear current lessons to upload fresh lesson files"
              >
                <Trash2 className="w-4 h-4" /> Clear All Lessons
              </button>
            ) : (
              <button
                onClick={handleResetSampleLessons}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" /> Restore Sample Lessons
              </button>
            )}

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
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
          <button
            onClick={() => setCategoryFilter('Livestream Recording')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              categoryFilter === 'Livestream Recording' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800'
            }`}
          >
            🎥 Livestream Recordings
          </button>
        </div>
      </div>

      {/* Empty State */}
      {resources.length === 0 && (
        <EmptyState
          title="The lesson library is currently empty"
          description="Upload lesson files, PDFs, or lecture notes, or restore the sample lessons to get started."
          icon={<BookOpen className="h-6 w-6" />}
          action={<div className="flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={() => setShowUploadModal(true)} className="md-btn-filled inline-flex items-center gap-2 text-sm"><Upload className="h-4 w-4" /> Upload lessons</button>
            <button type="button" onClick={handleResetSampleLessons} className="md-btn-tonal text-sm">Restore samples</button>
          </div>}
        />
      )}

      {/* Lesson Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredResources.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title={resources.length === 0 ? 'No resources in your library yet' : 'No resources match your search'}
              description={resources.length === 0
                ? 'Upload lesson files, paste text content, or add a Google Drive link to get started.'
                : 'Try clearing your search query or selecting a different category filter.'
              }
              icon={<BookOpen className="h-6 w-6" />}
              action={
                resources.length === 0 && !isStudent ? (
                  <button type="button" onClick={() => setShowUploadModal(true)} className="md-btn-primary text-sm flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Upload First Resource
                  </button>
                ) : filteredResources.length === 0 && resources.length > 0 ? (
                  <button type="button" onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }} className="md-btn-tonal text-sm">
                    Clear Filters
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : filteredResources.map((res) => {
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
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewResource(res)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Read
                  </button>

                  {(res.format === 'VIDEO' || res.category === 'Livestream Recording' || parseVideoMediaUrl(res.downloadUrl).isDrive || parseVideoMediaUrl(res.downloadUrl).isYouTube) && (
                    <button
                      type="button"
                      onClick={() => setPlayingVideoModalResource(res)}
                      className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-sm animate-pulse hover:animate-none"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Play Video
                    </button>
                  )}
                </div>

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
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload Lessons & AI Content Evaluator"
          icon={<Upload className="w-5 h-5 text-indigo-600 shrink-0" />}
          size="xl"
        >
          <form onSubmit={handleProcessUpload} className="space-y-4">
              {/* Tab Selector: Upload Files vs Paste Text vs Google Drive */}
              <div className="flex border-b border-slate-200 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 cursor-pointer transition-all whitespace-nowrap ${
                    uploadMode === 'file' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Upload Files / Audio
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('text')}
                  className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 cursor-pointer transition-all whitespace-nowrap ${
                    uploadMode === 'text' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Paste Notes / Text
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('gdrive')}
                  className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 cursor-pointer transition-all whitespace-nowrap flex items-center gap-1 ${
                    uploadMode === 'gdrive' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-blue-500" /> Google Drive Recording
                </button>
              </div>

              {uploadMode !== 'gdrive' && (
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
              )}

              {uploadMode === 'gdrive' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                    <p className="font-extrabold flex items-center gap-1">
                      <Globe className="w-4 h-4 text-blue-600" /> Google Drive Livestream Video Player Integration
                    </p>
                    <p className="text-[11px] text-blue-700">
                      Paste any shareable Google Drive link (e.g. <code>https://drive.google.com/file/d/.../view</code>). The video will play directly inside the app with embedded video controls!
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold uppercase text-slate-500">
                        Google Drive Video Share Link *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setGdriveUrl('https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view?usp=sharing');
                          setGdriveTitle('Sunday Morning Livestream Worship & Sermon');
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Insert Sample Drive Link
                      </button>
                    </div>
                    <input
                      required
                      type="url"
                      placeholder="https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view?usp=sharing"
                      value={gdriveUrl}
                      onChange={(e) => setGdriveUrl(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-indigo-700 focus:outline-none"
                    />
                  </div>

                  {gdriveUrl && parseVideoMediaUrl(gdriveUrl).isDrive && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Valid Google Drive video URL detected! File ID: {parseVideoMediaUrl(gdriveUrl).fileId}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Recording Title *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Livestream: Sunday Worship & Prophetic Teaching"
                      value={gdriveTitle}
                      onChange={(e) => setGdriveTitle(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Speaker / Preacher</label>
                      <input
                        type="text"
                        placeholder="Dr. Faculty Director"
                        value={gdriveAuthor}
                        onChange={(e) => setGdriveAuthor(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Course Code</label>
                      <input
                        type="text"
                        placeholder="SOM-101"
                        value={gdriveCourseCode}
                        onChange={(e) => setGdriveCourseCode(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Brief Description / Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Key notes, prayer points, or scripture references..."
                      value={gdriveSummary}
                      onChange={(e) => setGdriveSummary(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                </div>
              ) : uploadMode === 'file' ? (
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

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isEvaluating}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Evaluate & Save Lessons
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Preview Full Lesson Modal */}
      {previewResource && (
        <Modal
          isOpen={!!previewResource}
          onClose={() => setPreviewResource(null)}
          title={previewResource.title}
          subtitle={`${previewResource.courseCode} • ${previewResource.category}`}
          icon={<BookMarked className="w-5 h-5 text-indigo-600 shrink-0" />}
          size="2xl"
        >
          <div className="space-y-4 text-xs text-slate-800">
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
                ) : (parseVideoMediaUrl(previewResource.downloadUrl || '').isDrive || previewResource.format === 'VIDEO') ? (
                  <div className="space-y-3">
                    {parseVideoMediaUrl(previewResource.downloadUrl || '').isDrive ? (
                      <iframe
                        src={parseVideoMediaUrl(previewResource.downloadUrl || '').embedUrl || ''}
                        title={previewResource.title}
                        className="w-full h-72 sm:h-80 border-0 rounded-2xl shadow-xl bg-slate-950"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        controls
                        src={previewResource.downloadUrl || previewResource.fileDataUrl}
                        className="w-full h-72 sm:h-80 rounded-2xl bg-slate-950 object-contain shadow-xl"
                      />
                    )}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 bg-slate-100 p-2.5 rounded-xl">
                      <span className="flex items-center gap-1 text-slate-800">
                        <Globe className="w-4 h-4 text-blue-600" /> Streamed via Google Drive Cloud
                      </span>
                      {previewResource.downloadUrl && (
                        <a
                          href={previewResource.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Open in Drive Tab
                        </a>
                      )}
                    </div>
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

            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
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
          </Modal>
        )}

      {/* Edit Resource Modal */}
      {editingResource && (
        <Modal
          isOpen={!!editingResource}
          onClose={() => setEditingResource(null)}
          title="Edit Library Resource Details"
          icon={<Pencil className="w-5 h-5 text-indigo-600 shrink-0" />}
          size="xl"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
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

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL: CLEAR ALL CONFIRMATION */}
      {/* ========================================================= */}
      {showClearAllConfirm && (
        <Modal
          isOpen={showClearAllConfirm}
          onClose={() => setShowClearAllConfirm(false)}
          title="Clear Library"
          icon={<Trash2 className="w-5 h-5 text-rose-600 shrink-0" />}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to clear all current lessons from the library? You will still be able to upload your own custom lessons later.
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
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
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL: VIDEO PLAYER LIGHTBOX (Google Drive & Video Embed) */}
      {/* ========================================================= */}
      {playingVideoModalResource && (() => {
        const parsed = parseVideoMediaUrl(playingVideoModalResource.downloadUrl || playingVideoModalResource.fileDataUrl || '');

        return (
          <Modal
            isOpen={!!playingVideoModalResource}
            onClose={() => setPlayingVideoModalResource(null)}
            title={playingVideoModalResource.title}
            subtitle={`${playingVideoModalResource.courseCode} • ${playingVideoModalResource.category}`}
            icon={<Tv className="w-5 h-5 text-indigo-400 shrink-0" />}
            size="4xl"
          >
            <div className="space-y-4">
              {/* Video Player Frame */}
              <div className="p-4 bg-black flex flex-col justify-center items-center overflow-hidden rounded-2xl">
                {parsed.isDrive && parsed.embedUrl ? (
                  <iframe
                    src={parsed.embedUrl}
                    title={playingVideoModalResource.title}
                    className="w-full h-80 sm:h-[420px] md:h-[500px] border-0 rounded-2xl shadow-2xl bg-slate-950"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : parsed.isYouTube && parsed.embedUrl ? (
                  <iframe
                    src={parsed.embedUrl}
                    title={playingVideoModalResource.title}
                    className="w-full h-80 sm:h-[420px] md:h-[500px] border-0 rounded-2xl shadow-2xl bg-slate-950"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    controls
                    autoPlay
                    src={playingVideoModalResource.downloadUrl || playingVideoModalResource.fileDataUrl}
                    className="w-full h-80 sm:h-[420px] md:h-[500px] rounded-2xl bg-slate-950 object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>

              {/* Controls & Details Footer */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-extrabold text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" /> Instructor / Speaker: {playingVideoModalResource.author}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {playingVideoModalResource.summary}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                  {playingVideoModalResource.downloadUrl && (
                    <a
                      href={playingVideoModalResource.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-blue-400" /> Open Link
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const newMediaTrack: MediaResource = {
                        id: `media_gdrive_${Date.now()}`,
                        title: playingVideoModalResource.title,
                        speaker: playingVideoModalResource.author,
                        duration: 'Livestream',
                        type: 'video',
                        url: playingVideoModalResource.downloadUrl || playingVideoModalResource.fileDataUrl || '',
                        description: playingVideoModalResource.summary,
                        dateAdded: new Date().toISOString().split('T')[0]
                      };
                      if (setClassroomMedia) {
                        setClassroomMedia(prev => [newMediaTrack, ...prev]);
                      }
                      setPlayingVideoModalResource(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Tv className="w-3.5 h-3.5" /> Send to Top Player
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}

    </div>
  );
};
