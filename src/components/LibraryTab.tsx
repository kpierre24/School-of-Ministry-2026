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
  RefreshCw
} from 'lucide-react';
import { EmptyState } from './UXPrimitives';
import { Modal } from './Modal';
import { LibraryResource, MediaResource } from '../types';
import { UserRole } from '../lib/userAuth';
import { ClassroomMediaPlayer, DEFAULT_PRESET_MEDIA } from './ClassroomMediaPlayer';
import { parseVideoMediaUrl } from '../lib/mediaUtils';
import { DocumentReaderModal } from './DocumentReaderModal';

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
  const fileNameLower = (file.name || '').toLowerCase();
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
    if (saved) {
      try {
        const parsed: LibraryResource[] = JSON.parse(saved);
        // Strip any Supabase file links or data urls from downloadUrl to ensure clean lesson cards
        return parsed.map(r => {
          let cleaned = { ...r };
          if (cleaned.downloadUrl && (cleaned.downloadUrl.includes('supabase.co') || cleaned.downloadUrl.startsWith('data:'))) {
            delete cleaned.downloadUrl;
          }
          if (cleaned.summary && cleaned.summary.includes("Imported from Supabase Storage bucket")) {
            cleaned.summary = `Curriculum resource titled "${cleaned.title}" for the School of Ministry student body.`;
          }
          return cleaned;
        });
      } catch (e) {
        return INITIAL_RESOURCES;
      }
    }
    return INITIAL_RESOURCES;
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

  const handleUpdateGlobalMedia = (updatedMedia: MediaResource) => {
    setClassroomMedia(prev => prev.map(m => m.id === updatedMedia.id ? updatedMedia : m));
    // Also sync corresponding lesson resource if one was registered in the library cards
    setResources(prev => prev.map(res => {
      if (res.id === updatedMedia.id || (res.category === 'Livestream Recording' && res.downloadUrl === updatedMedia.url)) {
        return {
          ...res,
          title: updatedMedia.title,
          author: updatedMedia.speaker,
          downloadUrl: updatedMedia.url,
          summary: updatedMedia.description || res.summary
        };
      }
      return res;
    }));
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

  // AI Lesson Summary states
  const [generatingSummaryId, setGeneratingSummaryId] = useState<string | null>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState<boolean>(false);
  const [selectedSummaryLesson, setSelectedSummaryLesson] = useState<LibraryResource | null>(null);
  const [copiedSummaryId, setCopiedSummaryId] = useState<string | null>(null);
  const [aiSummaryFeedback, setAiSummaryFeedback] = useState<{ id: string; message: string; type: 'success' | 'error' } | null>(null);

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
    const matchesSearch = (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.author || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.courseCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
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
      link.download = resource.fileName || `${resource.title.replace(/\s+/g, '_')}.${(resource.format || '').toLowerCase()}`;
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

  // Generate AI Lesson Summary for an individual lesson (when missing or requested)
  const handleGenerateAiSummary = async (lesson: LibraryResource, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setGeneratingSummaryId(lesson.id);
    setAiSummaryFeedback(null);

    try {
      let contentToEvaluate = lesson.fullContent || '';
      if (!contentToEvaluate && lesson.fileDataUrl) {
        contentToEvaluate = await extractCleanTextFromDataUrl(lesson.fileDataUrl);
      }
      if (!contentToEvaluate) {
        contentToEvaluate = `${lesson.title} - ${lesson.category} for course code ${lesson.courseCode} authored by ${lesson.author}. Download URL: ${lesson.downloadUrl || 'Internal'}`;
      }

      const evaluation = await evaluateWithAI(
        lesson.title,
        contentToEvaluate,
        lesson.author,
        lesson.courseCode,
        lesson.fileName || `${lesson.title}.pdf`
      );

      const updated = resources.map(r => {
        if (r.id === lesson.id) {
          return {
            ...r,
            summary: evaluation.summary || r.summary,
            category: (evaluation.category as any) || r.category,
            keyTakeaways: evaluation.keyTakeaways && evaluation.keyTakeaways.length > 0 ? evaluation.keyTakeaways : r.keyTakeaways,
            courseCode: evaluation.courseCode || r.courseCode,
            aiEvaluated: true
          };
        }
        return r;
      });

      setResources(updated);
      try {
        localStorage.setItem('schoolLibraryResources', JSON.stringify(updated));
      } catch (err) {
        console.warn('Storage save warning:', err);
      }

      setAiSummaryFeedback({
        id: lesson.id,
        message: `AI Summary successfully generated for "${lesson.title}"!`,
        type: 'success'
      });

      if (previewResource && previewResource.id === lesson.id) {
        setPreviewResource(prev => prev ? {
          ...prev,
          summary: evaluation.summary || prev.summary,
          category: evaluation.category || prev.category,
          keyTakeaways: evaluation.keyTakeaways || prev.keyTakeaways,
          aiEvaluated: true
        } : null);
      }

      if (selectedSummaryLesson && selectedSummaryLesson.id === lesson.id) {
        setSelectedSummaryLesson(prev => prev ? {
          ...prev,
          summary: evaluation.summary || prev.summary,
          category: evaluation.category || prev.category,
          keyTakeaways: evaluation.keyTakeaways || prev.keyTakeaways,
          aiEvaluated: true
        } : null);
      }

      setTimeout(() => {
        setAiSummaryFeedback(null);
      }, 4000);
    } catch (err) {
      logger.error('Failed to generate AI summary:', err);
      setAiSummaryFeedback({
        id: lesson.id,
        message: 'Failed to generate AI summary. Please try again.',
        type: 'error'
      });
    } finally {
      setGeneratingSummaryId(null);
    }
  };

  // Batch generate summaries for all lessons currently lacking a summary
  const handleBatchGenerateSummaries = async () => {
    const missingLessons = resources.filter(r => !r.summary || r.summary.trim() === '');
    if (missingLessons.length === 0) return;

    setIsBatchGenerating(true);
    let currentList = [...resources];

    for (const lesson of missingLessons) {
      try {
        setGeneratingSummaryId(lesson.id);
        let content = lesson.fullContent || '';
        if (!content && lesson.fileDataUrl) {
          content = await extractCleanTextFromDataUrl(lesson.fileDataUrl);
        }
        if (!content) {
          content = `${lesson.title} - ${lesson.category} (${lesson.courseCode})`;
        }

        const res = await evaluateWithAI(lesson.title, content, lesson.author, lesson.courseCode, lesson.fileName);
        currentList = currentList.map(r => r.id === lesson.id ? {
          ...r,
          summary: res.summary || r.summary,
          category: res.category || r.category,
          keyTakeaways: res.keyTakeaways || r.keyTakeaways,
          aiEvaluated: true
        } : r);
        setResources([...currentList]);
      } catch (err) {
        logger.warn('Batch summary item error:', err);
      }
    }

    try {
      localStorage.setItem('schoolLibraryResources', JSON.stringify(currentList));
    } catch (e) {}

    setGeneratingSummaryId(null);
    setIsBatchGenerating(false);
  };

  const handleCopySummary = (lesson: LibraryResource, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const textToCopy = `Lesson: ${lesson.title} (${lesson.courseCode})\nInstructor: ${lesson.author}\nCategory: ${lesson.category}\n\nAI Summary:\n${lesson.summary}\n\nKey Learning Takeaways:\n${(lesson.keyTakeaways || []).map(k => `• ${k}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSummaryId(lesson.id);
    setTimeout(() => setCopiedSummaryId(null), 2500);
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

        // Convert file to base64 data URL for reliable in-app reading and direct downloading
        let fileDataUrl = '';
        try {
          fileDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              resolve((event.target?.result as string) || '');
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
        } catch (err) {
          console.error("Failed to read file into data URL:", err);
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
      {/* AI Summary Feedback Toast Banner */}
      {aiSummaryFeedback && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-bold animate-fadeIn shadow-sm ${
            aiSummaryFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {aiSummaryFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{aiSummaryFeedback.message}</span>
          </div>
          <button
            onClick={() => setAiSummaryFeedback(null)}
            className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer"
            aria-label="Dismiss AI summary alert"
          >
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

            {resources.length > 0 && !isStudent && (
              (() => {
                const missingSummaryCount = resources.filter(r => !r.summary || r.summary.trim() === '').length;
                if (missingSummaryCount === 0) return null;
                return (
                  <button
                    type="button"
                    onClick={handleBatchGenerateSummaries}
                    disabled={isBatchGenerating}
                    className="px-3.5 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                    title="Generate AI summaries for all lessons currently lacking one"
                  >
                    {isBatchGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                        <span>Analyzing Lessons ({missingSummaryCount})...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>AI Summarize Missing ({missingSummaryCount})</span>
                      </>
                    )}
                  </button>
                );
              })()
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
        onUpdateMedia={handleUpdateGlobalMedia}
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

                <h3
                  onClick={() => setPreviewResource(res)}
                  className="text-sm font-extrabold text-slate-900 dark:text-white mb-1 leading-snug line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                  title="Click to read document"
                >
                  {res.title}
                </h3>

                <p className="text-[11px] text-slate-500 mb-2 font-semibold flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> {res.author}
                </p>

                {/* External Video / Stream Link Badge if present (Google Drive / YouTube) */}
                {res.downloadUrl && 
                  !res.downloadUrl.includes('supabase.co') && 
                  !res.downloadUrl.startsWith('data:') && 
                  (res.format === 'VIDEO' || res.category === 'Livestream Recording' || res.downloadUrl.includes('drive.google.com') || res.downloadUrl.includes('youtube.com') || res.downloadUrl.includes('youtu.be')) && (
                  <div className="mb-3 p-2 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Link className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                      <span className="text-[10px] font-mono font-bold text-indigo-900 dark:text-indigo-300 truncate">
                        {res.downloadUrl}
                      </span>
                    </div>
                    <a
                      href={res.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-md flex items-center gap-1 flex-shrink-0 cursor-pointer shadow-2xs"
                      title="Open video in new tab"
                    >
                      <ExternalLink className="w-3 h-3" /> Visit
                    </a>
                  </div>
                )}

                {/* AI Summary Card Box or Generate Button if Missing */}
                {res.summary && res.summary.trim() !== '' ? (
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-2 relative space-y-1.5">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedSummaryLesson(res)}
                        className="text-[9px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider flex items-center gap-1 hover:underline cursor-pointer"
                        title="View complete AI Lesson Summary breakdown"
                      >
                        <Brain className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> AI Lesson Summary
                      </button>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400">
                          {res.category}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleGenerateAiSummary(res, e)}
                          disabled={generatingSummaryId === res.id}
                          className="text-[9px] font-extrabold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                          title="Regenerate summary with Gemini 3.7 Flash"
                        >
                          {generatingSummaryId === res.id ? (
                            <>
                              <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-600" />
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                              <span>Regenerate</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {res.summary}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-amber-50/60 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-amber-950/30 border-2 border-dashed border-indigo-200 dark:border-indigo-800/80 rounded-xl mb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> No Summary Yet
                      </span>
                      <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900">
                        Gemini AI
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleGenerateAiSummary(res, e)}
                      disabled={generatingSummaryId === res.id}
                      className="w-full py-1.5 px-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-extrabold text-xs rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 active:scale-98"
                      title="Generate AI Lesson Summary for this lesson"
                    >
                      {generatingSummaryId === res.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Analyzing with Gemini AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>Generate AI Lesson Summary</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

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
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setPreviewResource(res)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Read
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!res.summary || res.summary.trim() === '') {
                        handleGenerateAiSummary(res);
                      } else {
                        setSelectedSummaryLesson(res);
                      }
                    }}
                    disabled={generatingSummaryId === res.id}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title={!res.summary ? "Generate AI Lesson Summary" : "View AI Lesson Summary"}
                  >
                    {generatingSummaryId === res.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    ) : (
                      <Brain className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    )}
                    <span>AI Summary</span>
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

      {/* Full Multi-Format Document Reader Modal (PDF, DOCX, Word, Text, Audio, Video) */}
      <DocumentReaderModal
        isOpen={!!previewResource}
        resource={previewResource}
        onClose={() => setPreviewResource(null)}
        onDownload={handleDownload}
        onEdit={startEditing}
        onGenerateSummary={handleGenerateAiSummary}
        isGeneratingSummary={generatingSummaryId === previewResource?.id}
        isStudent={isStudent}
      />

      {/* ========================================================= */}
      {/* MODAL: AI LESSON SUMMARY & THEOLOGICAL INSIGHTS */}
      {/* ========================================================= */}
      {selectedSummaryLesson && (
        <Modal
          isOpen={!!selectedSummaryLesson}
          onClose={() => setSelectedSummaryLesson(null)}
          title={selectedSummaryLesson.title}
          subtitle={`${selectedSummaryLesson.courseCode} • ${selectedSummaryLesson.category} • Instructor: ${selectedSummaryLesson.author}`}
          icon={<Brain className="w-5 h-5 text-indigo-600 shrink-0" />}
          size="2xl"
        >
          <div className="space-y-4 text-xs text-slate-800 dark:text-slate-200">
            {/* Header info banner */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-mono font-bold rounded-lg text-xs">
                  {selectedSummaryLesson.courseCode}
                </span>
                <span className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs">
                  {selectedSummaryLesson.category}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {selectedSummaryLesson.format} ({selectedSummaryLesson.size})
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {selectedSummaryLesson.summary && (
                  <button
                    type="button"
                    onClick={(e) => handleCopySummary(selectedSummaryLesson, e)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="Copy AI Summary & Key Takeaways"
                  >
                    {copiedSummaryId === selectedSummaryLesson.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Summary</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => handleGenerateAiSummary(selectedSummaryLesson, e)}
                  disabled={generatingSummaryId === selectedSummaryLesson.id}
                  className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-lg flex items-center gap-1 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  title="Regenerate summary using Gemini 3.7 Flash"
                >
                  {generatingSummaryId === selectedSummaryLesson.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Regenerating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{selectedSummaryLesson.summary ? 'Regenerate with AI' : 'Generate AI Summary'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Summary Content Card */}
            <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 text-sm">
                  <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Executive Lesson Summary
                </span>
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-extrabold text-[10px] rounded-md flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Powered by Gemini
                </span>
              </div>

              {selectedSummaryLesson.summary ? (
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium text-xs sm:text-sm">
                  {selectedSummaryLesson.summary}
                </p>
              ) : (
                <div className="py-4 text-center space-y-2">
                  <p className="text-slate-500 dark:text-slate-400 italic">No summary generated yet for this lesson.</p>
                  <button
                    type="button"
                    onClick={(e) => handleGenerateAiSummary(selectedSummaryLesson, e)}
                    disabled={generatingSummaryId === selectedSummaryLesson.id}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" /> Generate AI Summary Now
                  </button>
                </div>
              )}
            </div>

            {/* Key Learning Takeaways */}
            {selectedSummaryLesson.keyTakeaways && selectedSummaryLesson.keyTakeaways.length > 0 && (
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
                <span className="font-black text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <BookMarked className="w-4 h-4 text-emerald-600" /> Ministerial & Academic Takeaways
                </span>
                <div className="space-y-2 pt-1">
                  {selectedSummaryLesson.keyTakeaways.map((takeaway, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = selectedSummaryLesson;
                  setSelectedSummaryLesson(null);
                  setPreviewResource(target);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Eye className="w-4 h-4" /> Read Full Lesson
              </button>

              <button
                type="button"
                onClick={() => setSelectedSummaryLesson(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-sm"
              >
                Close
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
                    value={editAuthor ?? ''}
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
                    value={editCourseCode ?? ''}
                    onChange={(e) => setEditCourseCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Category</label>
                  <select
                    value={editCategory ?? ''}
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
                  value={editTitle ?? ''}
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
                  value={editSummary ?? ''}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Key Learning Takeaways (one takeaway per line)</label>
                <textarea
                  rows={3}
                  placeholder="Add key learning points, each on a new line..."
                  value={editKeyTakeaways ?? ''}
                  onChange={(e) => setEditKeyTakeaways(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Full Document Content / Transcripts</label>
                <textarea
                  rows={6}
                  placeholder="Complete reference text or lesson transcripts..."
                  value={editFullContent ?? ''}
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
                {parsed.isDrive ? (
                  <div className="w-full space-y-3">
                    <video
                      controls
                      autoPlay
                      src={parsed.proxyStreamUrl || `/api/drive-proxy/stream/${parsed.fileId}`}
                      className="w-full h-80 sm:h-[420px] md:h-[500px] rounded-2xl bg-slate-950 object-contain shadow-2xl"
                    >
                      Your browser does not support the video tag.
                    </video>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs px-1 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                        Google Drive Video Streamed via Server Proxy
                      </span>
                      <a
                        href={playingVideoModalResource.downloadUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:text-amber-300 font-extrabold flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-all self-end sm:self-auto"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in Google Drive</span>
                      </a>
                    </div>
                  </div>
                ) : (parsed.isYouTube || parsed.isVimeo || parsed.isLoom) && parsed.embedUrl ? (
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
