import React, { useState } from 'react';
import { LogoImage } from './LogoImage';
import { 
  KeyRound, 
  Mail, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  GraduationCap, 
  UserCheck, 
  ShieldCheck, 
  Lock, 
  Sparkles,
  X,
  HelpCircle
} from 'lucide-react';
import { UserRole, UserCredential } from '../lib/userAuth';
import { requestPasswordResetForEmail, updatePasswordInSupabase } from '../lib/supabaseAuth';
import { triggerHapticFeedback } from '../lib/capacitorBridge';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
  userCredentials?: UserCredential[];
  onPasswordResetSuccess?: (email: string, newPassword?: string) => void;
  onOpenResetModal?: (email: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onBackToLogin,
  userCredentials = [],
  onPasswordResetSuccess,
  onOpenResetModal
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Direct Emergency Reset Mode for Demo/Offline Testing
  const [showEmergencyReset, setShowEmergencyReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emergencySuccess, setEmergencySuccess] = useState(false);

  if (!isOpen) return null;

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    setIsSuccess(false);
    
    // Auto-fill role placeholder demo email for quick testing
    if (role === 'admin' || role === 'super_admin') {
      setIdentifier('kpierre24@gmail.com');
    } else if (role === 'teacher' || role === 'lecturer') {
      const teacher = userCredentials.find(c => c.role === 'teacher' || c.role === 'lecturer');
      setIdentifier(teacher?.email || 'gillian.selkridge@hteim.edu');
    } else if (role === 'finance_officer') {
      const fin = userCredentials.find(c => c.role === 'finance_officer');
      setIdentifier(fin?.email || 'bursar@hteim.edu');
    } else {
      const student = userCredentials.find(c => c.role === 'student');
      setIdentifier(student?.email || 'aburke@student.hteim.edu');
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHapticFeedback('medium');
    setErrorMessage(null);

    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      setErrorMessage('Please enter your account email or username.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestPasswordResetForEmail(cleanId, userCredentials);
      setIsSubmitting(false);

      if (res.success) {
        triggerHapticFeedback('success');
        setIsSuccess(true);
        setSuccessMessage(res.message);
        if (onPasswordResetSuccess) {
          onPasswordResetSuccess(cleanId);
        }
      } else {
        triggerHapticFeedback('error');
        setErrorMessage(res.message || 'Unable to process password reset.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      triggerHapticFeedback('error');
      setErrorMessage(err.message || 'Failed to dispatch password recovery email.');
    }
  };

  const handleEmergencyPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPass = newPassword.trim();
    const confPass = confirmPassword.trim();

    if (!cleanPass || cleanPass.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (cleanPass !== confPass) {
      setErrorMessage('Passwords do not match. Please re-type.');
      return;
    }

    const cleanId = identifier.trim().toLowerCase();
    const matchingCred = userCredentials.find(
      c => c.email.toLowerCase() === cleanId || (c.username && c.username.toLowerCase() === cleanId)
    );

    setIsSubmitting(true);
    try {
      if (matchingCred) {
        await updatePasswordInSupabase(
          { id: matchingCred.id, email: matchingCred.email, name: matchingCred.name, role: matchingCred.role },
          cleanPass,
          userCredentials
        );
      }
      setIsSubmitting(false);
      triggerHapticFeedback('success');
      setEmergencySuccess(true);
      if (onPasswordResetSuccess) {
        onPasswordResetSuccess(cleanId, cleanPass);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      triggerHapticFeedback('error');
      setErrorMessage(err.message || 'Failed to update account password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="HTEIM Account Password Recovery Center"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden flex flex-col relative my-8"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-[#023264] to-[#011a36] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <LogoImage 
              alt="HTEIM Logo" 
              className="w-12 h-12 rounded-full border border-sky-400/30 object-contain bg-white p-0.5 shrink-0"
            />
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Security Center
              </span>
              <h2 className="text-lg font-black tracking-tight text-white mt-1">
                Account Password Recovery
              </h2>
            </div>
          </div>
          <p className="text-xs text-sky-100/80 leading-relaxed">
            Reset your HTEIM School of Ministry portal password for Students, Faculty, Administrators, and Bursar Accounts.
          </p>
        </div>

        {/* Role Selection Tabs */}
        {!emergencySuccess && (
          <div className="grid grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1.5 border-b border-slate-200 dark:border-slate-700 gap-1">
            <button
              type="button"
              onClick={() => handleRoleSelect('student')}
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedRole === 'student'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('teacher')}
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedRole === 'teacher' || selectedRole === 'lecturer'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Faculty</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedRole === 'admin' || selectedRole === 'super_admin'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('finance_officer')}
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedRole === 'finance_officer'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Bursar</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {emergencySuccess ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Password Reset Completed!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Your new password for <span className="font-bold text-indigo-600">{identifier}</span> has been set successfully. You can now log in immediately.
                </p>
              </div>

              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </button>
            </div>
          ) : isSuccess ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Recovery Instructions Sent</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {successMessage}
                </p>
              </div>

              {/* Direct Instant Reset Toggle for Offline / Demo Access */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Instant Password Reset Mode
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenResetModal && identifier) {
                        onOpenResetModal(identifier);
                      } else {
                        setShowEmergencyReset(!showEmergencyReset);
                      }
                    }}
                    className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 underline cursor-pointer"
                  >
                    {showEmergencyReset ? 'Hide' : 'Set New Password Now'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Allows instant password creation for demo accounts or direct testing.
                </p>
              </div>

              {showEmergencyReset && (
                <form onSubmit={handleEmergencyPasswordReset} className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-600 dark:text-slate-300">
                      New Confidential Password
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-600 dark:text-slate-300">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Verify chosen password"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <span>Save New Password & Continue</span>
                    )}
                  </button>
                </form>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Try Another Email
                </button>
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider flex justify-between">
                  <span>Registered Account Email or Username</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold capitalize">
                    {selectedRole.replace('_', ' ')} Role
                  </span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      selectedRole === 'admin' || selectedRole === 'super_admin'
                        ? 'kpierre24@gmail.com'
                        : selectedRole === 'teacher' || selectedRole === 'lecturer'
                        ? 'gillian.selkridge@hteim.edu'
                        : selectedRole === 'finance_officer'
                        ? 'bursar@hteim.edu'
                        : 'aburke@student.hteim.edu'
                    }
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed space-y-1">
                <div className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                  How Password Reset Works
                </div>
                <p>
                  We will send a password reset link to your email address or initiate emergency identity verification if using portal credentials.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !identifier.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Dispatching Recovery Email...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Send Password Reset Instructions</span>
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>HTEIM School of Ministry © 2026</span>
          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Secure Auth</span>
        </div>
      </div>
    </div>
  );
};
