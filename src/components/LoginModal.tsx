import React, { useState, useMemo } from 'react';
import { useAccessibleModal } from '../lib/useAccessibleModal';
import hteimLogoAsset from '../assets/hteim_logo.png';
import hteimBannerAsset from '../assets/images/regenerated_image_1785852170450.png';
import { 
  ShieldCheck, 
  GraduationCap, 
  UserCheck, 
  KeyRound, 
  Lock, 
  User, 
  Sparkles, 
  AlertCircle, 
  ArrowRight,
  X,
  Globe,
  Flame,
  BookOpenCheck,
  Quote,
  RefreshCw,
  Landmark,
  Award
} from 'lucide-react';
import { AppUser, UserRole, authenticateUser, UserCredential } from '../lib/userAuth';

interface LoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: AppUser) => void;
  userCredentials: UserCredential[];
  onChangePassword: (username: string, newPin: string) => void;
  currentUser?: AppUser | null;
}

// Welcoming Scripture Verse Database
const MINISTRY_SCRIPTURES = [
  {
    verse: "2 Timothy 2:15",
    text: "Study to show thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.",
    theme: "Academic Diligence"
  },
  {
    verse: "Matthew 28:19-20",
    text: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost: Teaching them to observe all things whatsoever I have commanded you.",
    theme: "The Great Commission"
  },
  {
    verse: "Proverbs 4:7",
    text: "Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding. Exalt her, and she shall promote thee.",
    theme: "Godly Wisdom"
  },
  {
    verse: "Ephesians 4:11-12",
    text: "And he gave some, apostles; and some, prophets; and some, evangelists; and some, pastors and teachers; For the perfecting of the saints, for the work of the ministry, for the edifying of the body of Christ.",
    theme: "Ministry Calling"
  },
  {
    verse: "Colossians 3:23-24",
    text: "And whatsoever ye do, do it heartily, as to the Lord, and not unto men; Knowing that of the Lord ye shall receive the reward of the inheritance: for ye serve the Lord Christ.",
    theme: "Servant Leadership"
  },
  {
    verse: "Joshua 1:8",
    text: "This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night, that thou mayest observe to do according to all that is written therein: for then thou shalt make thy way prosperous.",
    theme: "Spiritual Meditation"
  }
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen = true,
  onClose,
  onLoginSuccess,
  userCredentials = [],
  onChangePassword,
  currentUser = null
}) => {
  const [activeTab, setActiveTab] = useState<UserRole>('student');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scriptureIndex, setScriptureIndex] = useState(0);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // First-time login change PIN/password states
  const [showPasswordChangeForm, setShowPasswordChangeForm] = useState(false);
  const [pendingUser, setPendingUser] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeError, setChangeError] = useState<string | null>(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const validateUsername = (value: string): string | null => {
    if (!value.trim()) return 'Username is required';
    if (value.trim().length < 2) return 'Username must be at least 2 characters';
    if (activeTab === 'student' && !/^[A-Z][a-z]+[A-Z][a-z]+$/i.test(value.trim())) {
      return 'Student format: First Initial + Last Name (e.g. ABurke)';
    }
    return null;
  };

  const validatePassword = (value: string): string | null => {
    if (!value) return 'Password is required';
    if (value.length < 4) return 'Password must be at least 4 characters';
    return null;
  };

  const isLoginFormValid = () => {
    return validateUsername(usernameInput) === null && validatePassword(passwordInput) === null;
  };

  React.useEffect(() => {
    setUsernameInput('');
    setPasswordInput('');
    setUsernameError(null);
    setPasswordError(null);
  }, [activeTab]);

  if (!isOpen) return null;

  // Quick tab switch handler
  const handleSelectTab = (tab: UserRole) => {
    setActiveTab(tab);
    setErrorMessage(null);
    setUsernameInput('');
    setPasswordInput('');
    setShowPasswordChangeForm(false);
    setPendingUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = authenticateUser(usernameInput, passwordInput, userCredentials);
    if (result.success && result.user) {
      if (result.mustChangePassword) {
        // Enforce change pin/password on first try
        setPendingUser(result.user);
        setShowPasswordChangeForm(true);
        setNewPassword('');
        setConfirmPassword('');
        setChangeError(null);
      } else {
        onLoginSuccess(result.user);
        if (onClose) onClose();
      }
    } else {
      setErrorMessage(result.error || 'Authentication failed');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);

    const newPass = newPassword.trim();
    const confPass = confirmPassword.trim();

    if (!newPass) {
      setChangeError('Please enter a new password/PIN.');
      return;
    }

    if (newPass.length < 4) {
      setChangeError('Password/PIN must be at least 4 characters long.');
      return;
    }

    if (newPass === '1234' || newPass === '12345') {
      setChangeError('You cannot use default 1234 or 12345 passwords. Please select a unique, custom password/PIN.');
      return;
    }

    if (newPass !== confPass) {
      setChangeError('Passwords do not match.');
      return;
    }

    if (pendingUser) {
      onChangePassword(pendingUser.username, newPass);
      onLoginSuccess(pendingUser);
      setShowPasswordChangeForm(false);
      setPendingUser(null);
      if (onClose) onClose();
    }
  };

  const nextScripture = () => {
    setScriptureIndex((prev) => (prev + 1) % MINISTRY_SCRIPTURES.length);
  };

  const currentScripture = MINISTRY_SCRIPTURES[scriptureIndex];
  const isDashboardLayout = currentUser === null;

  if (isDashboardLayout) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-between font-sans relative overflow-x-hidden animate-fadeIn select-none">
        
        {/* Subtle Elegant Background Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-100/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-25%] right-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-50/40 blur-3xl pointer-events-none" />
        
        {/* Top Minimalist Brand Banner */}
        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-slate-200/60 relative z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <img 
              src={hteimLogoAsset} 
              alt="HTEIM Logo" 
              className="w-14 h-14 rounded-xl border-2 border-amber-300 shadow-sm object-contain bg-white p-0.5 flex-shrink-0"
            />
            <div>
              <p className="text-xs font-black text-slate-800 uppercase tracking-wider leading-none">HTEIM</p>
              <p className="text-[10px] font-bold text-amber-700 font-serif tracking-tight mt-0.5">Heaven Touching Earth International Ministries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-slate-200/70 border border-slate-300/40 px-3 py-1 rounded-full text-slate-600 font-extrabold uppercase tracking-widest font-mono">
              Academic Year 2026
            </span>
          </div>
        </div>

        {/* Main Dashboard Workspace Grid */}
        <main className="w-full max-w-7xl mx-auto px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* LEFT PANEL: Welcoming Information, Mission, Pillars & Scriptures */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Official HTEIM Banner Display */}
            <div className="rounded-2xl overflow-hidden border border-amber-300/50 shadow-lg bg-white p-1">
              <img 
                src={hteimBannerAsset} 
                alt="HTEIM School of Ministry Banner" 
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[180px] object-contain bg-white rounded-xl"
              />
            </div>

            {/* Main Welcome Hero */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded-full text-[10px] font-black tracking-wider uppercase shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> School of Ministry Teaching Portal
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-none">
                Equipping Faithful Leaders <br />
                <span className="text-indigo-600">For the Harvest Fields</span>
              </h1>
              <p className="text-slate-600 text-sm leading-relaxed max-w-xl">
                Welcome to the digital teaching and evaluating platform of the <strong>HTEIM School of Ministry</strong>. 
                Our curriculum is designed to activate spiritual callings, instill deep theological foundations, 
                and mentor practical ministerial competence in the light of God's Word. Log in to access your designated records.
              </p>
            </div>

            {/* School Pillars Asymmetric Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                  <BookOpenCheck className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Biblical Foundations</h3>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Deepening scriptural truth, theology, and rigorous hermeneutical studies to dividing the word accurately.
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center mb-3">
                  <Flame className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Active Ministry</h3>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Developing active homiletics, pastoral counseling, and servant church leadership for modern ministry.
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                  <Globe className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Global Missions</h3>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Fulfilling the great commission with compassion, signs and wonders, and practical field evangelism.
                </p>
              </div>
            </div>

            {/* Interactive Scripture Encouragement Generator */}
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200/30 pb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-amber-600" /> Daily Ministry Word
                </span>
                <span className="text-[9px] font-bold text-amber-700/80 italic font-mono bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg">
                  {currentScripture.theme}
                </span>
              </div>
              <blockquote className="space-y-2">
                <p className="text-xs text-slate-700 italic font-medium leading-relaxed font-serif">
                  "{currentScripture.text}"
                </p>
                <cite className="block text-[10px] font-extrabold text-amber-800 text-right not-italic">
                  — {currentScripture.verse}
                </cite>
              </blockquote>
              <div className="flex justify-end pt-1">
                <button
                  onClick={nextScripture}
                  className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-800 font-bold text-[10px] rounded-lg border border-amber-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} /> Next Reflection
                </button>
              </div>
            </div>

            {/* General School Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3.5 bg-white border border-slate-200/60 rounded-xl">
                <p className="text-xl font-black text-indigo-700">24+</p>
                <p className="text-[9px] uppercase font-extrabold text-slate-400 mt-0.5">Classes Offered</p>
              </div>
              <div className="p-3.5 bg-white border border-slate-200/60 rounded-xl">
                <p className="text-xl font-black text-indigo-700">200+</p>
                <p className="text-[9px] uppercase font-extrabold text-slate-400 mt-0.5">Ministers Sent</p>
              </div>
              <div className="p-3.5 bg-white border border-slate-200/60 rounded-xl">
                <p className="text-xl font-black text-indigo-700">15+</p>
                <p className="text-[9px] uppercase font-extrabold text-slate-400 mt-0.5">Years of Legacy</p>
              </div>
              <div className="p-3.5 bg-white border border-slate-200/60 rounded-xl">
                <p className="text-xl font-black text-indigo-700">100%</p>
                <p className="text-[9px] uppercase font-extrabold text-slate-400 mt-0.5">Biblical Doctrine</p>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: Embedded Intuitive Login Hub */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
            
            {/* Login Tab Headers */}
            <div className="bg-slate-900 text-white p-5">
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <Landmark className="w-5 h-5 text-amber-400" /> Teaching Portal Sign-In
              </h2>
              <p className="text-[11px] text-slate-300 mt-1">
                {showPasswordChangeForm ? 'Create a secure custom password before proceeding.' : 'Enter your credentials below to access your designated workspace.'}
              </p>
            </div>

            {/* Custom Tab Selectors (only visible when not in password change mode) */}
            {!showPasswordChangeForm && (
              <div className="grid grid-cols-3 bg-slate-100 p-1.5 border-b border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => handleSelectTab('student')}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    activeTab === 'student'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('teacher')}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    activeTab === 'teacher'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Teacher</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('admin')}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    activeTab === 'admin'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin</span>
                </button>
              </div>
            )}

            {/* Form Workspace */}
            {showPasswordChangeForm ? (
              <form onSubmit={handleChangePasswordSubmit} className="p-6 space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-bold flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold">First-Time PIN Change Required</p>
                    <p className="font-medium mt-0.5 text-slate-700">
                      Welcome, <span className="text-indigo-600 font-bold">{pendingUser?.name}</span>! 
                      For security, you must set a new confidential password/PIN before proceeding.
                    </p>
                  </div>
                </div>

                {changeError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-bold flex items-start gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{changeError}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      New Password/PIN
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          const err = validatePassword(e.target.value) || (e.target.value === '1234' || e.target.value === '12345' ? 'Cannot use default 1234 or 12345' : null);
                          setNewPasswordError(err);
                        }}
                        onBlur={() => {
                          const err = validatePassword(newPassword) || (newPassword === '1234' || newPassword === '12345' ? 'Cannot use default 1234 or 12345' : null);
                          setNewPasswordError(err);
                        }}
                        placeholder="Choose custom password"
                        className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white ${newPasswordError ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200'}`}
                        required
                        autoFocus
                      />
                    </div>
                    {newPasswordError && (
                      <p className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {newPasswordError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Confirm New Password/PIN
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          const err = e.target.value !== newPassword ? 'Passwords do not match' : null;
                          setConfirmPasswordError(err);
                        }}
                        onBlur={() => {
                          const err = confirmPassword !== newPassword ? 'Passwords do not match' : null;
                          setConfirmPasswordError(err);
                        }}
                        placeholder="Verify chosen PIN"
                        className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white ${confirmPasswordError ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200'}`}
                        required
                      />
                    </div>
                    {confirmPasswordError && (
                      <p className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {confirmPasswordError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChangeForm(false);
                      setPendingUser(null);
                      setNewPasswordError(null);
                      setConfirmPasswordError(null);
                    }}
                    className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!!newPasswordError || !!confirmPasswordError || !newPassword || !confirmPassword}
                    className="flex-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set PIN & Enter Portal
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-bold flex items-start gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
                      <span>Username</span>
                      {activeTab === 'student' && (
                        <span className="text-[8px] text-slate-400 font-mono italic normal-case">
                          Format: First Initial + Last Name (e.g. ABurke)
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => {
                          setUsernameInput(e.target.value);
                          setUsernameError(validateUsername(e.target.value));
                        }}
                        onBlur={() => setUsernameError(validateUsername(usernameInput))}
                        placeholder={activeTab === 'admin' ? 'Enter admin username' : activeTab === 'teacher' ? 'Enter teacher username' : 'e.g. ABurke'}
                        className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white ${usernameError ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200'}`}
                        required
                      />
                    </div>
                    {usernameError && (
                      <p className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {usernameError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
                      <span>Password / PIN</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => {
                          setPasswordInput(e.target.value);
                          setPasswordError(validatePassword(e.target.value));
                        }}
                        onBlur={() => setPasswordError(validatePassword(passwordInput))}
                        placeholder="••••••"
                        className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white ${passwordError ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200'}`}
                        required
                      />
                    </div>
                    {passwordError && (
                      <p className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {passwordError}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isLoginFormValid()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Enter {activeTab === 'admin' ? 'Admin Suite' : activeTab === 'teacher' ? 'Faculty Suite' : 'Student Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Portal Announcement Widget */}
            <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-2">
              <span className="text-[9px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-indigo-600" /> Portal Announcements
              </span>
              <div className="text-[10px] space-y-1.5 text-slate-600">
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">●</span>
                  <span><strong>Student Payments:</strong> Tuition statement receipts are now available under the My Payments tab.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-indigo-600 font-bold">●</span>
                  <span><strong>Practical Ministry Practicum:</strong> Keep logs of missionary hours and evaluation records directly inside your dashboard.</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Minimalist Footer */}
        <footer className="w-full max-w-7xl mx-auto px-6 py-4 border-t border-slate-200/60 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10 flex-shrink-0">
          <span>HTEIM School of Ministry © 2026. Heaven Touching Earth International Ministries. All Rights Reserved.</span>
          <span className="font-mono text-indigo-700 font-bold">Equipping Saints • Perfecting Ministries</span>
        </footer>
      </div>
    );
  }

  // ELSE WORKFLOW:
  // Render the original compact Modal overlay (when the user is ALREADY logged in and clicked "Switch User role")
  const dialogRef = useAccessibleModal(!isDashboardLayout && (isOpen ?? true), onClose || (() => {}));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn modal-material-scrim">
      <div 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="HTEIM School of Ministry Portal Authentication"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col relative my-8 modal-material-dialog"
      >
        
        {/* Header Banner */}
        <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 relative modal-material-header">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
             aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3 mb-2">
            <img 
              src={hteimLogoAsset} 
              alt="HTEIM Logo" 
              className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-600 object-contain bg-white p-0.5"
            />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">HTEIM School of Ministry</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" /> Portal Authentication & Access Control
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Log in to access your designated view. Administrators, Teachers, and Ministry Students have custom tailored dashboards and permissions.
          </p>
        </div>

        {/* Role Type Tabs (only visible when not in password change mode) */}
        {!showPasswordChangeForm && (
          <div className="grid grid-cols-3 bg-slate-100 p-1.5 border-b border-slate-200 gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectTab('student')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'student'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('teacher')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Teacher View</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('admin')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin View</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        {showPasswordChangeForm ? (
          <form onSubmit={handleChangePasswordSubmit} className="p-6 space-y-5">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-bold flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">First-Time PIN Change Required</p>
                <p className="font-medium mt-0.5 text-slate-700">
                  Welcome, <span className="text-indigo-600 font-bold">{pendingUser?.name}</span>! 
                  For security, you must set a new confidential password/PIN before proceeding.
                </p>
              </div>
            </div>

            {changeError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{changeError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-600 tracking-wider">
                  New Password/PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Choose custom password"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-600 tracking-wider">
                  Confirm New Password/PIN
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Verify chosen PIN"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordChangeForm(false);
                  setPendingUser(null);
                }}
                className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer text-center"
              >
                Set PIN & Enter Portal
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-600 tracking-wider flex items-center justify-between">
                <span>Username</span>
                {activeTab === 'student' && (
                  <span className="text-[10px] text-slate-400 font-mono normal-case">
                    Format: First Initial + Last Name (e.g. ABurke)
                  </span>
                )}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder={activeTab === 'admin' ? 'Enter admin username' : activeTab === 'teacher' ? 'Enter teacher username' : 'e.g. ABurke'}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-600 tracking-wider flex items-center justify-between">
                <span>Password / PIN</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Current Logged In Banner */}
            {currentUser && (
              <div className="p-3 bg-slate-100 rounded-xl text-xs flex items-center justify-between text-slate-700">
                <span className="font-medium">Currently logged in as: <strong>{currentUser.name}</strong> ({currentUser.role})</span>
                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-bold">Active</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Log In to {activeTab === 'admin' ? 'Admin View' : activeTab === 'teacher' ? 'Teacher Portal' : 'Student Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <div>
            <span>HTEIM School of Ministry © 2026</span>
            <span className="mx-1 text-slate-300">•</span>
            <span className="text-slate-600">App created by <strong className="text-slate-800">Rockproxy Technologies</strong></span>
          </div>
          <span className="font-mono text-indigo-700 font-bold">Role Access: Admin • Teacher • Student</span>
        </div>
      </div>
    </div>
  );
};
