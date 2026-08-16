import React, { useState } from 'react';
import { 
  X, 
  GraduationCap, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  BookOpen, 
  Phone, 
  Mail, 
  User, 
  HelpCircle,
  Clock,
  ShieldCheck,
  Download
} from 'lucide-react';
import { Modal } from './Modal';
import { ACADEMIC_LEVELS } from '../types';

export interface EnrollmentInquiry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  academicLevel: string;
  learningFormat: 'hybrid' | 'online' | 'in_person';
  callingBackground: string;
  timestamp: string;
  status: 'new' | 'contacted' | 'approved';
}

interface EnrollmentInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnrollmentInquiryModal: React.FC<EnrollmentInquiryModalProps> = ({
  isOpen,
  onClose
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [academicLevel, setAcademicLevel] = useState('level_1');
  const [learningFormat, setLearningFormat] = useState<'hybrid' | 'online' | 'in_person'>('hybrid');
  const [callingBackground, setCallingBackground] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<EnrollmentInquiry | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setIsSubmitting(true);

    const inquiry: EnrollmentInquiry = {
      id: `inq_${Date.now()}`,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      academicLevel,
      learningFormat,
      callingBackground: callingBackground.trim(),
      timestamp: new Date().toISOString(),
      status: 'new'
    };

    // Store in localStorage for persistent admin access
    try {
      const existing = JSON.parse(localStorage.getItem('hteim_enrollment_inquiries') || '[]');
      localStorage.setItem('hteim_enrollment_inquiries', JSON.stringify([inquiry, ...existing]));
    } catch (err) {
      console.error('Failed to save enrollment inquiry:', err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setSubmittedData(inquiry);
    }, 600);
  };

  const handleReset = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setAcademicLevel('level_1');
    setLearningFormat('hybrid');
    setCallingBackground('');
    setIsSubmitted(false);
    setSubmittedData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Cohort Enrollment Application & Inquiry"
      size="lg"
    >
      {isSubmitted && submittedData ? (
        <div className="p-6 space-y-6 text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Application Received!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Praise God, <strong className="text-slate-900 dark:text-white">{submittedData.fullName}</strong>! Your enrollment inquiry for the upcoming HTEIM School of Ministry cohort has been logged.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-slate-500 font-medium">Inquiry Reference</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{submittedData.id}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-slate-500 font-medium">Target Study Track</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {ACADEMIC_LEVELS.find(l => l.id === submittedData.academicLevel)?.name || 'Level 1: Foundation Certificate'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-slate-500 font-medium">Learning Delivery</span>
              <span className="font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
                {submittedData.learningFormat.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Class Sessions</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Tuesdays & Thursdays @ 7:00 PM EST</span>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/50 text-indigo-900 dark:text-indigo-200 text-xs flex items-center gap-3 text-left">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <p>
              Our admissions team and ministry faculty will contact you at <strong>{submittedData.email}</strong> with orientation packets and preparatory reading.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer"
            >
              Done & Return to Portal
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 border border-amber-300 dark:border-amber-700">
                <Sparkles className="w-3 h-3 text-amber-500" /> Open Admissions
              </span>
              <span className="text-xs text-slate-500 font-medium">Fall & Spring Cohorts</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Join the Next Ministry Cohort
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete this brief form to reserve your seat or request detailed syllabus information from the dean of faculty.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Full Name *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Min. David Johnson"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address *</span>
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Phone / WhatsApp</span>
              </label>
              <input
                type="tel"
                placeholder="(555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <span>Study Track Interest</span>
              </label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white font-medium"
              >
                {ACADEMIC_LEVELS.map(level => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Learning Format */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Preferred Learning Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLearningFormat('hybrid')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  learningFormat === 'hybrid'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                Hybrid (Live & Campus)
              </button>

              <button
                type="button"
                onClick={() => setLearningFormat('online')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  learningFormat === 'online'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                100% Online Stream
              </button>

              <button
                type="button"
                onClick={() => setLearningFormat('in_person')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  learningFormat === 'in_person'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                In-Person Campus
              </button>
            </div>
          </div>

          {/* Ministry Goals / Questions */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Ministry Calling, Church Affiliation, or Questions</span>
              <span className="text-[10px] text-slate-400 font-normal">Optional</span>
            </label>
            <textarea
              rows={3}
              placeholder="Tell us briefly about your spiritual calling, current ministry role, or specific questions about the 6 curriculum modules..."
              value={callingBackground}
              onChange={(e) => setCallingBackground(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* Info pill */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl flex items-center gap-2.5 text-[11px] text-slate-600 dark:text-slate-400">
            <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Next cohort begins: <strong>Tuesday & Thursday Sessions @ 7:00 PM EST</strong></span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !fullName.trim() || !email.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Enrollment Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
