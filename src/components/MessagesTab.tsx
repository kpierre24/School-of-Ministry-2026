import React, { useState, useMemo, useRef } from 'react';
import { 
  MessageSquare, 
  MessageSquarePlus, 
  Send, 
  Paperclip, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  X, 
  User, 
  Shield, 
  GraduationCap, 
  ChevronRight, 
  Download, 
  Trash2, 
  Archive, 
  Check, 
  Sparkles, 
  Mail, 
  Tag,
  ArrowLeft,
  PaperclipIcon,
  RefreshCw,
  HelpCircle,
  Briefcase,
  Database
} from 'lucide-react';
import { EmptyState } from './UXPrimitives';
import { AppMessage, MessageCategory, MessagePriority, MessageReply, MessageAttachment } from '../types';
import { AppUser } from '../lib/userAuth';
import { sanitizeInput } from '../lib/securityHelper';

export const INITIAL_MESSAGES: AppMessage[] = [
  {
    id: 'msg_welcome_101',
    subject: 'Welcome to HTEIM Academic Portal - Student Support & Guidance',
    category: 'general',
    priority: 'important',
    senderName: 'Dr. Joseph - Dean of Academics',
    senderRole: 'admin',
    senderEmail: 'academics@hteim.edu',
    recipientType: 'all_staff',
    recipientName: 'All Students & Faculty',
    content: 'Welcome to the Holy Trinity Evangelical International Ministry Educational Portal! You can use this Messaging Center to reach out directly to your Course Instructors, Academic Advisors, or the Financial Office. We are here to support your spiritual and academic journey.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    isReadByRecipient: true,
    isReadBySender: true,
    status: 'open',
    replies: [
      {
        id: 'reply_welcome_1',
        senderName: 'Afeshia',
        senderRole: 'student',
        senderEmail: 'afeshia@hteim.edu',
        message: 'Thank you Dean Joseph! Blessed to be part of Level 1 Foundation Certificate.',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      }
    ]
  },
  {
    id: 'msg_tuition_inquiry_1',
    subject: 'Tuition Payment Confirmation & Status Update',
    category: 'tuition',
    priority: 'normal',
    senderName: 'Alicia Noray Bowles',
    senderRole: 'student',
    senderEmail: 'alicia.noray.bowles@hteim.edu',
    senderStudentId: 'STU-2026-002',
    recipientType: 'admin',
    recipientName: 'Bursar & Financial Office',
    content: 'Good day Administration, I have uploaded my recent Zelle receipt for the Level 2 Intermediate Diploma tuition fee. Could you please confirm receipt and update my payment status?',
    createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    isReadByRecipient: false,
    isReadBySender: true,
    status: 'in_progress',
    replies: [
      {
        id: 'reply_tuition_1',
        senderName: 'Bursar Office (Admin)',
        senderRole: 'admin',
        senderEmail: 'bursar@hteim.edu',
        message: 'Greetings Alicia. We have received your payment submission and your account balance has been updated to Paid In Full. God bless you!',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      }
    ]
  },
  {
    id: 'msg_zoom_class_1',
    subject: 'Question on Tuesday Live Zoom Recording & Assignment #3',
    category: 'assignment',
    priority: 'urgent',
    senderName: 'Atiya Williams',
    senderRole: 'student',
    senderEmail: 'atiya.williams@hteim.edu',
    senderStudentId: 'STU-2026-003',
    recipientType: 'teacher',
    recipientName: 'Apostolic Ministry Faculty',
    content: 'Shalom Teacher, I missed 15 minutes of last Tuesday’s Live Zoom session due to connection issues. Is the audio recording available in the Library tab or Classroom player?',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    isReadByRecipient: false,
    isReadBySender: true,
    status: 'open',
    replies: []
  }
];

interface MessagesTabProps {
  appUser?: AppUser | null;
  messages: AppMessage[];
  onSendMessage: (msg: Omit<AppMessage, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'isReadByRecipient' | 'isReadBySender' | 'status'>) => void;
  onReplyMessage: (messageId: string, replyText: string, attachments?: MessageAttachment[]) => void;
  onUpdateStatus: (messageId: string, status: AppMessage['status']) => void;
  onDeleteMessage?: (messageId: string) => void;
  availableStudents?: { name: string; email?: string }[];
  initialNewMsgOpen?: boolean;
  prefilledRecipient?: string;
  prefilledCategory?: MessageCategory;
  prefilledSubject?: string;
}

export const MessagesTab: React.FC<MessagesTabProps> = ({
  appUser,
  messages,
  onSendMessage,
  onReplyMessage,
  onUpdateStatus,
  onDeleteMessage,
  availableStudents = [],
  initialNewMsgOpen = false,
  prefilledRecipient = 'All Administration & Faculty',
  prefilledCategory = 'general',
  prefilledSubject = ''
}) => {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(() => messages[0]?.id || null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'open' | 'in_progress' | 'resolved' | 'archived' | 'sent_by_me'>('all');
  const [selectedCategory, setSelectedCategory] = useState<MessageCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Message Modal State
  const [showNewMsgModal, setShowNewMsgModal] = useState(initialNewMsgOpen);
  const [recipientName, setRecipientName] = useState(prefilledRecipient);
  const [category, setCategory] = useState<MessageCategory>(prefilledCategory);
  const [priority, setPriority] = useState<MessagePriority>('normal');
  const [subject, setSubject] = useState(prefilledSubject);
  const [content, setContent] = useState('');
  const [newAttachments, setNewAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Reply State
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<MessageAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  const currentUserRole = appUser?.role || 'student';
  const currentUserName = appUser?.studentName || appUser?.name || 'Student';
  const currentUserEmail = appUser?.email || `${currentUserName.toLowerCase().replace(/\s+/g, '.')}@hteim.edu`;

  // Filtered Messages
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      // Role filter visibility
      if (currentUserRole === 'student') {
        const isSender = msg.senderName.toLowerCase() === currentUserName.toLowerCase() || msg.senderEmail === currentUserEmail;
        const isRecipient = msg.recipientName?.toLowerCase().includes(currentUserName.toLowerCase()) || msg.recipientType === 'all_staff';
        if (!isSender && !isRecipient) return false;
      }

      // Filter Tab
      if (activeFilter === 'archived') {
        if (msg.status !== 'archived') return false;
      } else if (activeFilter === 'all') {
        if (msg.status === 'archived' && !searchQuery) return false;
      } else {
        if (msg.status === 'archived') return false;
      }

      if (activeFilter === 'unread' && msg.isReadByRecipient) return false;
      if (activeFilter === 'open' && msg.status !== 'open') return false;
      if (activeFilter === 'in_progress' && msg.status !== 'in_progress') return false;
      if (activeFilter === 'resolved' && msg.status !== 'resolved') return false;
      if (activeFilter === 'sent_by_me' && msg.senderName.toLowerCase() !== currentUserName.toLowerCase()) return false;

      // Category
      if (selectedCategory !== 'all' && msg.category !== selectedCategory) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSub = msg.subject.toLowerCase().includes(q);
        const matchSender = msg.senderName.toLowerCase().includes(q);
        const matchBody = msg.content.toLowerCase().includes(q);
        const matchRecipient = (msg.recipientName || '').toLowerCase().includes(q);
        if (!matchSub && !matchSender && !matchBody && !matchRecipient) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [messages, currentUserRole, currentUserName, currentUserEmail, activeFilter, selectedCategory, searchQuery]);

  const activeMessage = useMemo(() => {
    return messages.find(m => m.id === selectedMessageId) || filteredMessages[0] || null;
  }, [messages, selectedMessageId, filteredMessages]);

  // Statistics
  const stats = useMemo(() => {
    const total = messages.length;
    const unread = messages.filter(m => !m.isReadByRecipient).length;
    const open = messages.filter(m => m.status === 'open' || m.status === 'in_progress').length;
    const resolved = messages.filter(m => m.status === 'resolved').length;
    return { total, unread, open, resolved };
  }, [messages]);

  // Handle File Upload to Base64 Data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'reply') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const promises: Promise<MessageAttachment>[] = (Array.from(files) as File[]).map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            name: file.name,
            url: event.target?.result as string,
            type: file.type
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(uploadedFiles => {
      if (target === 'new') {
        setNewAttachments(prev => [...prev, ...uploadedFiles]);
      } else {
        setReplyAttachments(prev => [...prev, ...uploadedFiles]);
      }
      setIsUploading(false);
      e.target.value = '';
    });
  };

  const handleSendNewMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;

    onSendMessage({
      subject: sanitizeInput(subject),
      category,
      priority,
      senderName: currentUserName,
      senderRole: currentUserRole === 'admin' ? 'admin' : (currentUserRole === 'teacher' ? 'teacher' : 'student'),
      senderEmail: currentUserEmail,
      senderStudentId: appUser?.studentId,
      recipientType: recipientName.includes('Student') ? 'student' : (recipientName.includes('Faculty') || recipientName.includes('Teacher') ? 'teacher' : 'admin'),
      recipientName,
      content: sanitizeInput(content),
      attachments: []
    });

    setShowNewMsgModal(false);
    setSubject('');
    setContent('');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMessage || !replyText.trim()) return;

    onReplyMessage(activeMessage.id, sanitizeInput(replyText), []);
    setReplyText('');
  };

  // Quick Preset Templates for Students
  const applyStudentTemplate = (templateType: 'absence' | 'tuition' | 'extension' | 'peer') => {
    if (templateType === 'absence') {
      setCategory('attendance');
      setSubject('Notice of Absence - Tuesday Live Zoom Class');
      setContent('Greetings Instructor,\n\nI am writing to respectfully inform you that I will be unable to attend the upcoming Tuesday Live Zoom Class due to prior commitments. I will review the class recording and study materials once posted.\n\nThank you for your understanding.\n\nBlessings,\n' + currentUserName);
    } else if (templateType === 'tuition') {
      setCategory('tuition');
      setRecipientName('Bursar & Financial Office');
      setSubject('Tuition Balance Inquiry / Receipt Verification');
      setContent('Dear Financial Office,\n\nI would like to inquire about my current tuition statement and confirm receipt of my recent payment submission.\n\nPlease let me know if any further documents or receipts are required.\n\nRespectfully,\n' + currentUserName);
    } else if (templateType === 'extension') {
      setCategory('assignment');
      setSubject('Assignment Extension Request - Module Coursework');
      setContent('Dear Course Instructor,\n\nI am requesting a short extension on the upcoming assignment submission due to unforeseen personal obligations. Please let me know if an extension is possible and the revised deadline.\n\nThank you,\n' + currentUserName);
    } else if (templateType === 'peer') {
      setCategory('general');
      setSubject('Classmate Inquiry / Peer Study Collaboration');
      setContent('Greetings,\n\nI am reaching out to connect regarding our course topics and upcoming class discussions. Let me know if you would like to collaborate on study notes or discuss the lecture material.\n\nBlessings,\n' + currentUserName);
    }
  };

  return (
    <div className="material-screen space-y-6 animate-fadeIn pb-28 sm:pb-24 md:pb-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              Direct Communication Center
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Messages & Academic Support
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Send direct inquiries to Course Instructors, Academic Deans, or the Bursar's Office. Receive official updates, assignment feedback, and support.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setShowNewMsgModal(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Compose New Message</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Total Conversations</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Unread Messages</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400">{stats.unread}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Open Inquiries</p>
            <p className="text-xl font-black text-blue-600 dark:text-blue-400">{stats.open}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Resolved</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.resolved}</p>
          </div>
        </div>
      </div>

      {/* Mobile back button — shown above the grid on small screens when a message is open */}
      {activeMessage && (
        <div className="lg:hidden flex items-center gap-2 px-1 -mb-2">
          <button
            onClick={() => setSelectedMessageId(null)}
            className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-bold py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
            aria-label="Back to message list"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Messages
          </button>
        </div>
      )}

      {/* Main Workspace Layout (Sidebar Threads List + Chat View) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* LEFT COLUMN: Threads List (4 cols on lg) */}
        <div className={`lg:col-span-5 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40 ${activeMessage && 'hidden lg:flex'}`}>
          {/* Search & Filter Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search messages, subject, or sender..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 text-[11px] font-bold">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({messages.length})
              </button>

              <button
                onClick={() => setActiveFilter('unread')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === 'unread'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Unread
              </button>

              <button
                onClick={() => setActiveFilter('open')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === 'open'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Open
              </button>

              <button
                onClick={() => setActiveFilter('resolved')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === 'resolved'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Resolved
              </button>

              <button
                onClick={() => setActiveFilter('sent_by_me')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === 'sent_by_me'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sent by Me
              </button>

              <button
                onClick={() => setActiveFilter('archived')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'archived'
                    ? 'bg-indigo-700 text-white shadow-xs font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Archive className="w-3 h-3" />
                Archived ({messages.filter(m => m.status === 'archived').length})
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-1 text-[10px] font-semibold text-slate-500">
              <span className="text-slate-400 uppercase font-black text-[9px]">Category:</span>
              {(['all', 'general', 'assignment', 'attendance', 'tuition', 'exam', 'technical'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded-full capitalize transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 font-bold border border-indigo-300 dark:border-indigo-700'
                      : 'bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Thread List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-200/80 dark:divide-slate-800">
            {filteredMessages.length === 0 ? (
              <EmptyState
                title="No messages match these filters"
                description="Try clearing the search or selecting a different message category."
                icon={<MessageSquare className="h-6 w-6" />}
                action={<button type="button" onClick={() => { setActiveFilter('all'); setSelectedCategory('all'); setSearchQuery(''); }} className="md-btn-tonal text-sm">Reset filters</button>}
              />
            ) : (
              filteredMessages.map(msg => {
                const isSelected = activeMessage?.id === msg.id;
                const isUnread = !msg.isReadByRecipient;
                const replyCount = msg.replies.length;
                const latestReply = msg.replies[msg.replies.length - 1];

                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessageId(msg.id)}
                    className={`p-4 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-indigo-600 dark:border-indigo-400'
                        : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                    } ${isUnread ? 'bg-amber-50/40 dark:bg-amber-950/20 font-medium' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          msg.status === 'open' ? 'bg-blue-500' :
                          msg.status === 'in_progress' ? 'bg-amber-500' :
                          msg.status === 'resolved' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`} />
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {msg.senderName}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                          msg.senderRole === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300' :
                          msg.senderRole === 'teacher' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300' :
                          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                        }`}>
                          {msg.senderRole}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(msg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1">
                      {msg.subject}
                    </h4>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight mb-2">
                      {latestReply ? `Re: ${latestReply.message}` : msg.content}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold capitalize">
                          {msg.category}
                        </span>
                        {msg.priority === 'urgent' && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-black uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                            Urgent
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-slate-400">
                        {msg.attachments && msg.attachments.length > 0 && (
                          <Paperclip className="w-3 h-3 text-slate-400" />
                        )}
                        {replyCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold">
                            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Conversation Workspace (7 cols on lg) */}
        <div className={`lg:col-span-7 flex flex-col bg-white dark:bg-slate-900 ${!activeMessage && 'hidden lg:flex'}`}>
          {activeMessage ? (
            <div className="flex flex-col h-full">
              {/* Thread Top Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedMessageId(null)}
                    className="lg:hidden text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1 mb-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Threads
                  </button>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      activeMessage.status === 'open' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' :
                      activeMessage.status === 'in_progress' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200' :
                      activeMessage.status === 'resolved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {activeMessage.status.replace('_', ' ')}
                    </span>

                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold capitalize">
                      {activeMessage.category}
                    </span>

                    {activeMessage.priority === 'urgent' && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 text-[10px] font-black uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" /> Urgent
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {activeMessage.subject}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>From: <strong className="text-slate-800 dark:text-slate-200">{activeMessage.senderName}</strong> ({activeMessage.senderRole})</span>
                    <span>•</span>
                    <span>To: <strong className="text-slate-800 dark:text-slate-200">{activeMessage.recipientName}</strong></span>
                  </p>
                </div>

                {/* Status Toggle & Supabase Archive Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <select
                    value={activeMessage.status}
                    onChange={(e) => onUpdateStatus(activeMessage.id, e.target.value as AppMessage['status'])}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                  >
                    <option value="open">Status: Open</option>
                    <option value="in_progress">Status: In Progress</option>
                    <option value="resolved">Status: Resolved</option>
                    <option value="archived">Status: Archived</option>
                  </select>

                  {activeMessage.status !== 'archived' ? (
                    <button
                      onClick={() => onUpdateStatus(activeMessage.id, 'archived')}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                      title="Archive this message thread in Supabase database"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive Thread</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateStatus(activeMessage.id, 'open')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200 text-xs font-bold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800 transition-all cursor-pointer"
                      title="Unarchive and reopen this thread"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Unarchive</span>
                    </button>
                  )}

                  {onDeleteMessage && currentUserRole === 'admin' && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this message thread?')) {
                          onDeleteMessage(activeMessage.id);
                          setSelectedMessageId(null);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all"
                      title="Delete Thread"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Conversation Bubbles */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/20 max-h-[480px]">
                {/* Original Parent Message Card */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {activeMessage.senderName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          {activeMessage.senderName}
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                            {activeMessage.senderRole}
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400">{activeMessage.senderEmail}</p>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400">
                      {new Date(activeMessage.createdAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {activeMessage.content}
                  </div>

                  {/* Attachments list if any */}
                  {activeMessage.attachments && activeMessage.attachments.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase flex items-center gap-1">
                        <Paperclip className="w-3 h-3" /> Attachments ({activeMessage.attachments.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {activeMessage.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            download={att.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-600 transition-all"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="max-w-[140px] truncate">{att.name}</span>
                            <Download className="w-3 h-3 ml-1 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Conversation Replies Timeline */}
                {activeMessage.replies.map((reply) => {
                  const isStaffReply = reply.senderRole === 'teacher' || reply.senderRole === 'admin';

                  return (
                    <div
                      key={reply.id}
                      className={`flex gap-3 ${isStaffReply ? 'justify-start' : 'justify-start'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center shrink-0 mt-1">
                        {reply.senderName.charAt(0)}
                      </div>

                      <div className={`flex-1 rounded-2xl p-4 shadow-2xs space-y-2 border ${
                        isStaffReply
                          ? 'bg-indigo-900/10 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}>
                        <div className="flex items-center justify-between pb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {reply.senderName}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                              isStaffReply ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                              {reply.senderRole}
                            </span>
                          </div>

                          <span className="text-[10px] text-slate-400">
                            {new Date(reply.createdAt).toLocaleString(undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {reply.message}
                        </p>

                        {reply.attachments && reply.attachments.length > 0 && (
                          <div className="pt-2 flex flex-wrap gap-2">
                            {reply.attachments.map((att, idx) => (
                              <a
                                key={idx}
                                href={att.url}
                                download={att.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-600"
                              >
                                <Paperclip className="w-3 h-3" />
                                <span className="max-w-[120px] truncate">{att.name}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input Box */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                {/* Staff Quick Reply Presets */}
                {currentUserRole !== 'student' && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 overflow-x-auto custom-scrollbar pb-1">
                    <span className="text-slate-400 uppercase text-[9px] shrink-0">Quick Reply:</span>
                    <button
                      type="button"
                      onClick={() => setReplyText('Thank you for reaching out. Your request has been approved and logged in your student portal.')}
                      className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 text-slate-700 dark:text-slate-300 shrink-0 cursor-pointer"
                    >
                      "Request Approved"
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyText('Greetings! We have verified your tuition payment receipt. Your account status is now Paid In Full.')}
                      className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 text-slate-700 dark:text-slate-300 shrink-0 cursor-pointer"
                    >
                      "Payment Confirmed"
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyText('Please refer to the Library tab and Classroom Media player for the recorded Zoom session audio.')}
                      className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 text-slate-700 dark:text-slate-300 shrink-0 cursor-pointer"
                    >
                      "Check Class Recording"
                    </button>
                  </div>
                )}

                {/* Text-Only Policy Banner */}
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-[11px] font-medium">
                      Messaging is for <strong>typed text only</strong>. Submit assignment files in the <strong>Exams</strong> tab.
                    </span>
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      rows={2}
                      placeholder="Write a typed reply or follow-up question..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-all cursor-pointer h-full"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-md">
                <MessageSquare className="w-8 h-8" />
              </div>

              <div className="space-y-1 max-w-sm">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Select a Conversation Thread
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose an existing message from the left panel or compose a new direct message to administration or fellow students.
                </p>
              </div>

              <button
                onClick={() => setShowNewMsgModal(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Compose New Message</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* COMPOSE NEW MESSAGE MODAL */}
      {showNewMsgModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-fadeIn my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
                  <MessageSquarePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Compose Direct Message
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Send a typed message to faculty, staff, or fellow students
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowNewMsgModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Presets */}
            {currentUserRole === 'student' && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/60">
                <p className="text-[11px] font-black text-indigo-900 dark:text-indigo-200 uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Message Templates:
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => applyStudentTemplate('absence')}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 shadow-2xs transition-all cursor-pointer"
                  >
                    Class Absence Notice
                  </button>
                  <button
                    type="button"
                    onClick={() => applyStudentTemplate('tuition')}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 shadow-2xs transition-all cursor-pointer"
                  >
                    Tuition Balance Query
                  </button>
                  <button
                    type="button"
                    onClick={() => applyStudentTemplate('extension')}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 shadow-2xs transition-all cursor-pointer"
                  >
                    Assignment Extension
                  </button>
                  <button
                    type="button"
                    onClick={() => applyStudentTemplate('peer')}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 shadow-2xs transition-all cursor-pointer"
                  >
                    Classmate Study Question
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSendNewMessage} className="space-y-4">
              {/* Recipient */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Send To (Recipient):
                </label>
                <select
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500/50"
                >
                  <optgroup label="Faculty & Administration">
                    <option value="All Administration & Faculty">All Administration & Faculty</option>
                    <option value="Dr. Joseph - Dean of Academics">Dr. Joseph - Dean of Academics</option>
                    <option value="Apostolic Ministry Faculty">Apostolic Ministry Faculty</option>
                    <option value="Bursar & Financial Office">Bursar & Financial Office</option>
                  </optgroup>

                  {availableStudents.length > 0 && (
                    <optgroup label="Enrolled Classmates & Students">
                      {availableStudents
                        .filter(st => st.name.toLowerCase() !== currentUserName.toLowerCase())
                        .map(st => {
                          const val = st.name.startsWith('Student:') ? st.name : `Student: ${st.name}`;
                          return (
                            <option key={st.name} value={val}>
                              {val}
                            </option>
                          );
                        })}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MessageCategory)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="assignment">Assignment & Coursework</option>
                    <option value="attendance">Attendance & Absence</option>
                    <option value="tuition">Tuition & Financial</option>
                    <option value="exam">Exam & Grades</option>
                    <option value="technical">Technical Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level:
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as MessagePriority)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Header:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Question regarding module study notes"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Message Details (Typed Text Only):
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write your message here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 resize-none"
                />
              </div>

              {/* Policy Notice: No File Attachments in Messaging */}
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <span>Typed Text Communication Policy</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Messaging is restricted to typed text to ensure academic records remain organized. File attachments and coursework submissions must be uploaded through the <strong>Exams</strong> tab.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewMsgModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!subject.trim() || !content.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
