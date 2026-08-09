import React, { useState, useEffect } from 'react';
import { useAccessibleModal } from '../lib/useAccessibleModal';
import { 
  Database, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  UploadCloud, 
  FileText, 
  ExternalLink, 
  X, 
  Copy, 
  Check, 
  Search,
  ShieldAlert,
  FolderOpen
} from 'lucide-react';
import { runSupabaseDiagnostics, SupabaseDiagnosticReport, uploadToSupabaseStorage } from '../lib/supabaseClient';

interface SupabaseDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userRole?: string;
  onRefreshData?: () => void;
}

export const SupabaseDiagnosticModal: React.FC<SupabaseDiagnosticModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  userRole,
  onRefreshData
}) => {
  const dialogRef = useAccessibleModal(isOpen, onClose);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SupabaseDiagnosticReport | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'library' | 'assignments' | 'sql_guide'>('overview');
  const [testUploadStatus, setTestUploadStatus] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const executeDiagnostics = async () => {
    setLoading(true);
    setTestUploadStatus(null);
    try {
      const diagReport = await runSupabaseDiagnostics(userEmail);
      setReport(diagReport);
    } catch (err: any) {
      console.error("Diagnostic execution error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      executeDiagnostics();
    }
  }, [isOpen, userEmail]);

  if (!isOpen) return null;

  if (userRole && userRole !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 modal-material-scrim">
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="supabase-access-title" className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full text-center space-y-4 modal-material-dialog">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 id="supabase-access-title" className="text-base font-extrabold text-slate-900 dark:text-white">Admin Restricted Diagnostics</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Storage and database diagnostics are restricted strictly to portal Administrators.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleTestUpload = async (bucket: 'library' | 'assignments') => {
    setTestUploadStatus(`Uploading test file to ${bucket} bucket...`);
    try {
      const testContent = `Student Portal Test Document uploaded at ${new Date().toLocaleString()}\nUser Email: ${userEmail || 'anonymous'}`;
      const blob = new Blob([testContent], { type: 'text/plain' });
      const fileName = `diag_test_doc_${Date.now()}.txt`;
      
      const pubUrl = await uploadToSupabaseStorage(bucket, fileName, new File([blob], fileName, { type: 'text/plain' }));
      if (pubUrl && !pubUrl.startsWith('data:')) {
        setTestUploadStatus(`Success! File uploaded to ${bucket} bucket: ${pubUrl}`);
      } else {
        setTestUploadStatus(`Upload completed with fallback to base64. Storage bucket '${bucket}' may lack write permissions or public RLS.`);
      }
      // Refresh report
      await executeDiagnostics();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setTestUploadStatus(`Test upload failed: ${err.message || String(err)}`);
    }
  };

  const copySqlGuide = () => {
    const sqlText = `-- ========================================================
-- HEAVEN TOUCHING EARTH SCHOOL OF MINISTRY (HTEIM)
-- ADVANCED SUPABASE SECURITY & RLS POLICIES
-- ========================================================

-- 1. DATABASE SCHEMA SETUP
-- Setup state synchronization table for HTEIM Portal
CREATE TABLE IF NOT EXISTS public.app_state (
  email text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on Database Tables
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- POLICY A: SECURE STUDENT-ISOLATED ACCESS (RECOMMENDED)
-- Students can only read/write their own state; Admins can read/write everything.
CREATE POLICY "Student Isolated Read" ON public.app_state
  FOR SELECT USING (
    (auth.jwt() ->> 'email') = email 
    OR (auth.jwt() ->> 'role' = 'service_role')
  );

CREATE POLICY "Student Isolated Upsert" ON public.app_state
  FOR ALL WITH CHECK (
    (auth.jwt() ->> 'email') = email 
    OR (auth.jwt() ->> 'role' = 'service_role')
  );

-- POLICY B: DELEGATED ACCESS (ANONYMOUS CLIENT FALLBACK)
-- Use this if you are using anonymous public token clients
-- CREATE POLICY "Delegated SELECT" ON public.app_state FOR SELECT USING (true);
-- CREATE POLICY "Delegated ALL" ON public.app_state FOR ALL USING (true);


-- 2. STORAGE BUCKET ROW LEVEL SECURITY (RLS)
-- Go to Supabase Dashboard -> Storage -> Create Buckets: 'library', 'assignments', 'classroom_media'
-- Enforce proper policies to prevent unauthorized file manipulation.

-- Allow public read access to all public portal files
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('library', 'assignments', 'classroom_media'));

-- LIBRARY BUCKET: Only admins/instructors can write, upload or delete
CREATE POLICY "Library Admin Insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'library' 
    AND (
      (auth.jwt() ->> 'email') IN ('kpierre24@gmail.com', 'admin@hteim.org') 
      OR (auth.jwt() ->> 'role' = 'service_role')
    )
  );

CREATE POLICY "Library Admin Delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'library' 
    AND (
      (auth.jwt() ->> 'email') IN ('kpierre24@gmail.com', 'admin@hteim.org') 
      OR (auth.jwt() ->> 'role' = 'service_role')
    )
  );

-- ASSIGNMENTS BUCKET: Authenticated students can upload, admins can review and delete
CREATE POLICY "Student Assignment Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'assignments' 
    AND (
      (auth.jwt() ->> 'email') IS NOT NULL
      OR (auth.jwt() ->> 'role' = 'service_role')
    )
  );

CREATE POLICY "Assignments Admin Control" ON storage.objects
  FOR ALL USING (
    bucket_id = 'assignments'
    AND (
      (auth.jwt() ->> 'email') IN ('kpierre24@gmail.com', 'admin@hteim.org')
      OR (auth.jwt() ->> 'role' = 'service_role')
    )
  );
`;
    navigator.clipboard.writeText(sqlText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const filterFiles = (files: any[]) => {
    if (!searchTerm) return files;
    return files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto modal-material-scrim">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="supabase-diagnostic-title" className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200 modal-material-dialog">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 modal-material-header">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 id="supabase-diagnostic-title" className="text-lg font-bold text-white flex items-center gap-2">
                Supabase Storage & Data Diagnostics
              </h2>
              <p className="text-xs text-slate-400">
                Evaluating database rows, bucket permissions, & missing library documents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 gap-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 bg-white font-semibold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Overview & Status
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'library'
                ? 'border-indigo-600 text-indigo-600 bg-white font-semibold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Library Bucket ({report?.libraryFiles.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'assignments'
                ? 'border-indigo-600 text-indigo-600 bg-white font-semibold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Assignments Bucket ({report?.assignmentsFiles.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('sql_guide')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'sql_guide'
                ? 'border-indigo-600 text-indigo-600 bg-white font-semibold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Setup & SQL Fixes
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm font-medium text-slate-700">Running Supabase storage & database tests...</p>
              <p className="text-xs text-slate-500">Testing connection, buckets 'library' and 'assignments', RLS policies...</p>
            </div>
          ) : report ? (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  
                  {/* Quick Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Target User Account</span>
                      <span className="text-sm font-bold text-slate-800">{userEmail || 'Anonymous / Guest'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={executeDiagnostics}
                        className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Re-run Tests
                      </button>
                      <button
                        onClick={() => handleTestUpload('library')}
                        className="px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                      >
                        <UploadCloud className="w-3.5 h-3.5" /> Test Upload to Library
                      </button>
                    </div>
                  </div>

                  {testUploadStatus && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-medium text-indigo-900 flex items-center justify-between">
                      <span>{testUploadStatus}</span>
                      <button onClick={() => setTestUploadStatus(null)} className="text-indigo-500 hover:text-indigo-800">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Summary Metric Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Database Health */}
                    <div className={`p-4 rounded-xl border ${report.dbConnected ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/60 border-amber-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">DB Table (`app_state`)</span>
                        {report.dbConnected ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {report.dbConnected ? 'Connected & Ready' : 'Database Error'}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {report.dbConnected 
                          ? `Found ${report.userRowCount} saved state record(s) for active user.`
                          : report.dbError || 'Table not found or blocked.'}
                      </p>
                    </div>

                    {/* Library Bucket Storage */}
                    <div className={`p-4 rounded-xl border ${report.libraryBucketWriteOk ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/60 border-amber-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">'library' Storage Bucket</span>
                        {report.libraryBucketWriteOk ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {report.libraryFiles.length} Document(s)
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {report.libraryBucketWriteOk 
                          ? 'Write permission verified. Files stored safely.' 
                          : report.libraryBucketWriteError || 'Bucket missing or upload restricted.'}
                      </p>
                    </div>

                    {/* Assignments Bucket Storage */}
                    <div className={`p-4 rounded-xl border ${report.assignmentsBucketWriteOk ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/60 border-amber-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">'assignments' Bucket</span>
                        {report.assignmentsBucketWriteOk ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {report.assignmentsFiles.length} Document(s)
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {report.assignmentsBucketWriteOk 
                          ? 'Write permission verified.' 
                          : report.assignmentsBucketWriteError || 'Bucket missing or upload restricted.'}
                      </p>
                    </div>
                  </div>

                  {/* Findings & Evaluation */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-indigo-600" />
                      Evaluation & Diagnosis
                    </h3>
                    <div className="space-y-2">
                      {report.diagnosis.map((msg, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                          <span>{msg}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Environment & Configuration Info */}
                  <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between font-mono">
                      <span>Supabase Project URL:</span>
                      <span className="text-indigo-400 font-semibold">{report.supabaseUrl}</span>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span>Anon Key Present:</span>
                      <span className={report.hasAnonKey ? 'text-emerald-400' : 'text-rose-400'}>
                        {report.hasAnonKey ? 'YES (Valid)' : 'NO'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span>Available Buckets in Storage:</span>
                      <span className="text-amber-300">
                        {report.availableBuckets.length > 0 ? report.availableBuckets.join(', ') : 'None listed (Check RLS)'}
                      </span>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: LIBRARY BUCKET OBJECTS */}
              {activeTab === 'library' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search library storage files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      onClick={() => handleTestUpload('library')}
                      className="px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                    >
                      <UploadCloud className="w-3.5 h-3.5" /> Upload Test File
                    </button>
                  </div>

                  {filterFiles(report.libraryFiles).length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                      <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No objects found in 'library' bucket</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        If files were uploaded earlier, verify if the bucket named `library` exists in your Supabase project with public access enabled.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-3 px-4">File Name</th>
                            <th className="py-3 px-4">Created At</th>
                            <th className="py-3 px-4">Size</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {filterFiles(report.libraryFiles).map((file, i) => (
                            <tr key={i} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                                <span className="truncate max-w-xs">{file.name}</span>
                              </td>
                              <td className="py-3 px-4 text-slate-500">
                                {file.created_at ? new Date(file.created_at).toLocaleString() : 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-slate-500 font-mono">
                                {file.sizeBytes ? `${(file.sizeBytes / 1024).toFixed(1)} KB` : 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {file.publicUrl && (
                                  <a
                                    href={file.publicUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                                  >
                                    View File <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ASSIGNMENTS BUCKET OBJECTS */}
              {activeTab === 'assignments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search assignments storage files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      onClick={() => handleTestUpload('assignments')}
                      className="px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                    >
                      <UploadCloud className="w-3.5 h-3.5" /> Upload Test File
                    </button>
                  </div>

                  {filterFiles(report.assignmentsFiles).length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No objects found in 'assignments' bucket</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Verify that the storage bucket named `assignments` is created in Supabase with Public policies.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-3 px-4">File Name</th>
                            <th className="py-3 px-4">Created At</th>
                            <th className="py-3 px-4">Size</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {filterFiles(report.assignmentsFiles).map((file, i) => (
                            <tr key={i} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                                <span className="truncate max-w-xs">{file.name}</span>
                              </td>
                              <td className="py-3 px-4 text-slate-500">
                                {file.created_at ? new Date(file.created_at).toLocaleString() : 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-slate-500 font-mono">
                                {file.sizeBytes ? `${(file.sizeBytes / 1024).toFixed(1)} KB` : 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {file.publicUrl && (
                                  <a
                                    href={file.publicUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                                  >
                                    View File <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SQL FIXES & SUPABASE DASHBOARD SETUP */}
              {activeTab === 'sql_guide' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                    <p className="font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Supabase Setup & RLS Policy Guide
                    </p>
                    <p className="leading-relaxed">
                      If documents fail to save or show as missing in Supabase, execute this standard SQL snippet in your <strong>Supabase SQL Editor</strong> to create the database table and enable public reads/uploads on the storage buckets.
                    </p>
                  </div>

                  <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                    <div className="px-4 py-2 bg-slate-800 flex items-center justify-between border-b border-slate-700">
                      <span className="text-xs font-mono text-slate-300">supabase_setup.sql</span>
                      <button
                        onClick={copySqlGuide}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-semibold flex items-center gap-1 transition"
                      >
                        {copiedText ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy SQL
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-72">
{`-- HEAVEN TOUCHING EARTH SCHOOL OF MINISTRY (HTEIM)
-- 1. Create app_state table if not exists
CREATE TABLE IF NOT EXISTS public.app_state (
  email text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for database row protection
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow users to read/update their own state row
CREATE POLICY "Student Isolated Read" ON public.app_state
  FOR SELECT USING ((auth.jwt() ->> 'email') = email OR (auth.jwt() ->> 'role' = 'service_role'));

CREATE POLICY "Student Isolated Upsert" ON public.app_state
  FOR ALL WITH CHECK ((auth.jwt() ->> 'email') = email OR (auth.jwt() ->> 'role' = 'service_role'));

-- 2. Storage Buckets (library, assignments, classroom_media)
-- Go to Supabase -> Storage and create these public buckets.
-- Enforce policies: Read access is public, but writes are role-restricted:

-- Read access to all files
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('library', 'assignments', 'classroom_media'));

-- Library bucket: Only Admins/Instructors can upload/delete
CREATE POLICY "Library Admin Insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'library' AND ((auth.jwt() ->> 'email') IN ('kpierre24@gmail.com', 'admin@hteim.org')));

-- Assignments bucket: Students can upload, admins manage
CREATE POLICY "Student Assignment Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'assignments' AND ((auth.jwt() ->> 'email') IS NOT NULL));`}
                    </pre>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between modal-material-footer">
          <div className="text-xs text-slate-500">
            Last evaluated: {report ? new Date(report.timestamp).toLocaleTimeString() : 'Never'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            Close Diagnostics
          </button>
        </div>

      </div>
    </div>
  );
};
