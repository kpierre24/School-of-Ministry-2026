import React from 'react';
import { QuizAssignment, QuizSubmission } from '../types';
import { QuizTakerView } from './QuizTakerView';
import { GraduationCap, ArrowLeft, Share2, CheckCircle } from 'lucide-react';

export interface PublicQuizPageProps {
  quiz: QuizAssignment;
  studentRoster?: { name: string }[];
  currentStudentName?: string;
  onSubmitResponse?: (submission: QuizSubmission) => void;
  onClose: () => void;
}

export const PublicQuizPage: React.FC<PublicQuizPageProps> = ({
  quiz,
  studentRoster = [],
  currentStudentName,
  onSubmitResponse,
  onClose,
}) => {
  const shareUrl = `${window.location.origin}${window.location.pathname}?quiz=${quiz.shareCode || quiz.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    if ((window as any).triggerPortalToast) {
      (window as any).triggerPortalToast('success', 'Link Copied', 'Shareable quiz link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      {/* Top Branding Banner for External Users */}
      <header className="bg-slate-950/90 border-b border-purple-900/40 sticky top-0 z-50 backdrop-blur-md px-4 py-3.5 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-purple-900/30">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-purple-400 uppercase">
                  HTEIM School of Ministry
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                  Public Assessment
                </span>
              </div>
              <h1 className="text-sm font-black text-white truncate max-w-xs sm:max-w-md">
                {quiz.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copy share link"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs rounded-xl border border-purple-800/50 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share Link</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Quiz Taker Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 my-2">
        <QuizTakerView
          quiz={quiz}
          studentRoster={studentRoster}
          currentStudentName={currentStudentName}
          onSubmitQuiz={(sub) => {
            if (onSubmitResponse) {
              onSubmitResponse(sub);
            }
          }}
          onClose={onClose}
        />
      </main>

      {/* Footer Disclaimer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Heaven Touching Earth International Ministries (HTEIM) School of Ministry.</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Responses are automatically logged to the Course Directory gradebook.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
