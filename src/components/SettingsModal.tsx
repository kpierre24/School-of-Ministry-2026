import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  Sliders, 
  Zap, 
  Moon, 
  Sun, 
  Monitor, 
  Info, 
  GraduationCap, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  Bell, 
  BookOpen, 
  Check, 
  ShieldCheck, 
  Mail, 
  ExternalLink,
  Sparkles,
  HelpCircle,
  FileText,
  Building2,
  UserCheck,
  Code2
} from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'system' | 'high-contrast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  atRiskThreshold: number;
  setAtRiskThreshold: (val: number) => void;
  satisfactoryThreshold: number;
  setSatisfactoryThreshold: (val: number) => void;
  autoSyncInterval: number;
  setAutoSyncInterval: (val: number) => void;
  syncOnTabFocus: boolean;
  setSyncOnTabFocus: (val: boolean) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  onResetAllData?: () => void;
  onExportBackup?: () => void;
  onImportBackup?: (jsonData: string) => boolean;
  onOpenGuide?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  atRiskThreshold,
  setAtRiskThreshold,
  satisfactoryThreshold,
  setSatisfactoryThreshold,
  autoSyncInterval,
  setAutoSyncInterval,
  syncOnTabFocus,
  setSyncOnTabFocus,
  themeMode,
  setThemeMode,
  onResetAllData,
  onExportBackup,
  onImportBackup,
  onOpenGuide
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'academic' | 'sync' | 'about'>('appearance');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importErrorMessage, setImportErrorMessage] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        if (onImportBackup) {
          const success = onImportBackup(content);
          if (success) {
            setImportStatus('success');
            setTimeout(() => setImportStatus('idle'), 3000);
          } else {
            setImportStatus('error');
            setImportErrorMessage('Invalid backup file structure.');
          }
        }
      } catch (err) {
        setImportStatus('error');
        setImportErrorMessage('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Settings className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight">Portal Settings & System Information</h2>
              <p className="text-[10px] text-slate-400">Configure app preferences, thresholds, sync & institutional profile</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center justify-around bg-slate-100 p-1.5 border-b border-slate-200 text-xs font-extrabold flex-shrink-0">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-white text-indigo-700 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setActiveTab('academic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'academic'
                ? 'bg-white text-emerald-700 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Academic Thresholds</span>
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'sync'
                ? 'bg-white text-amber-700 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Sync & Backup</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'about'
                ? 'bg-white text-purple-700 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About HTEIM</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-5 text-xs text-slate-700 bg-white">
          
          {/* 1. APPEARANCE & THEME TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-extrabold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5 text-[11px]">
                  <Sun className="w-4 h-4 text-amber-500" />
                  Color Theme & Visual Mode
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  Choose your preferred workspace display aesthetic for late-night grading or daytime instruction.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {/* Light Mode */}
                  <button
                    onClick={() => setThemeMode('light')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      themeMode === 'light'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Sun className="w-5 h-5 text-amber-500" />
                      {themeMode === 'light' && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900">Light Mode</h4>
                      <p className="text-[10px] text-slate-500">Standard crisp classroom theme</p>
                    </div>
                  </button>

                  {/* Dark Mode */}
                  <button
                    onClick={() => setThemeMode('dark')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      themeMode === 'dark'
                        ? 'border-indigo-600 bg-slate-900 text-white ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Moon className="w-5 h-5 text-indigo-400" />
                      {themeMode === 'dark' && <Check className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <div>
                      <h4 className={`font-extrabold ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>Dark Mode</h4>
                      <p className={`text-[10px] ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Eye-safe dark slate contrast</p>
                    </div>
                  </button>

                  {/* System Default */}
                  <button
                    onClick={() => setThemeMode('system')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      themeMode === 'system'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Monitor className="w-5 h-5 text-slate-600" />
                      {themeMode === 'system' && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900">System Auto</h4>
                      <p className="text-[10px] text-slate-500">Sync with OS preferences</p>
                    </div>
                  </button>

                  {/* High-Contrast Academic Mode */}
                  <button
                    onClick={() => setThemeMode('high-contrast')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 col-span-3 sm:col-span-1 ${
                      themeMode === 'high-contrast'
                        ? 'border-amber-400 bg-black text-amber-300 ring-2 ring-amber-400/50'
                        : 'border-slate-200 bg-slate-900 text-white hover:bg-black'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <ShieldCheck className="w-5 h-5 text-amber-400" />
                      {themeMode === 'high-contrast' && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white">High Contrast</h4>
                      <p className="text-[10px] text-amber-200">Accessibility compliant mode</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Preview Banner */}
              <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-slate-800 text-xs">High-Contrast Accessibility Styling Enabled</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">WCAG 2.1 Compliant</span>
              </div>
            </div>
          )}

          {/* 2. ACADEMIC THRESHOLDS TAB */}
          {activeTab === 'academic' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5 text-[11px]">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  Custom Performance & Attendance Thresholds
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  Define the attendance boundary percentages used across matrices, student cards, and transcript generators.
                </p>

                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {/* At-Risk Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-rose-700">At-Risk Standing Threshold (&lt; {atRiskThreshold}%)</label>
                      <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">{atRiskThreshold}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="75" 
                      step="5"
                      value={atRiskThreshold} 
                      onChange={(e) => setAtRiskThreshold(parseInt(e.target.value, 10))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Students with attendance below this rate are flagged in batch email notices & statistics.</p>
                  </div>

                  {/* Satisfactory Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-emerald-700">Satisfactory Standing Threshold (&ge; {satisfactoryThreshold}%)</label>
                      <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">{satisfactoryThreshold}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="60" 
                      max="100" 
                      step="5"
                      value={satisfactoryThreshold} 
                      onChange={(e) => setSatisfactoryThreshold(parseInt(e.target.value, 10))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Students meeting or exceeding this rate are highlighted green as satisfactory.</p>
                  </div>
                </div>
              </div>

              {/* Default Rubric Weighting Reference */}
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1.5">
                <h4 className="font-extrabold text-indigo-950 flex items-center gap-1.5 text-xs">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Standard Evaluation Rubric Weighting
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 bg-white rounded-lg border border-indigo-100">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Participation</span>
                    <span className="font-mono font-extrabold text-emerald-700">30%</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-indigo-100">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Reading</span>
                    <span className="font-mono font-extrabold text-indigo-700">30%</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-indigo-100">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Exams & Essays</span>
                    <span className="font-mono font-extrabold text-purple-700">40%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. SYNC & BACKUP TAB */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5 text-[11px]">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Google Sheets Auto-Sync Settings
                </h3>

                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Automatic Refresh Frequency</label>
                    <select
                      value={autoSyncInterval}
                      onChange={(e) => setAutoSyncInterval(parseInt(e.target.value, 10))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value={0}>Manual Refresh Only</option>
                      <option value={300}>Auto-refresh every 5 minutes</option>
                      <option value={600}>Auto-refresh every 10 minutes</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer pt-1">
                    <input 
                      type="checkbox"
                      checked={syncOnTabFocus}
                      onChange={(e) => setSyncOnTabFocus(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Auto-sync attendance data when switching browser tabs</span>
                  </label>
                </div>
              </div>

              {/* Data Backup & Restore */}
              <div>
                <h3 className="font-extrabold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5 text-[11px]">
                  <Database className="w-4 h-4 text-indigo-600" />
                  System Backup & Local Data Management
                </h3>

                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900">Export Local Portal Data</h4>
                      <p className="text-[10px] text-slate-500">Download a full JSON backup of custom assignments, submissions & notifications.</p>
                    </div>
                    <button
                      onClick={onExportBackup}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" /> Export JSON
                    </button>
                  </div>

                  <hr className="border-slate-200" />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900">Restore Backup File</h4>
                      <p className="text-[10px] text-slate-500">Upload a previously exported JSON backup file.</p>
                    </div>
                    <label className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs">
                      <Upload className="w-3.5 h-3.5" /> Restore JSON
                      <input 
                        type="file" 
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden" 
                      />
                    </label>
                  </div>

                  {importStatus === 'success' && (
                    <p className="text-emerald-700 font-bold text-[11px] bg-emerald-50 border border-emerald-200 p-2 rounded-lg flex items-center gap-1">
                      <Check className="w-4 h-4 text-emerald-600" /> Data backup successfully restored!
                    </p>
                  )}

                  {importStatus === 'error' && (
                    <p className="text-rose-700 font-bold text-[11px] bg-rose-50 border border-rose-200 p-2 rounded-lg">
                      ⚠️ {importErrorMessage}
                    </p>
                  )}

                  <hr className="border-slate-200" />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div>
                      <h4 className="font-bold text-rose-700">Reset Local System Storage</h4>
                      <p className="text-[10px] text-slate-500">Clear custom data and restore default demo assignments & grades.</p>
                    </div>

                    {!showResetConfirm ? (
                      <button
                        onClick={() => setShowResetConfirm(true)}
                        className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-lg transition-colors cursor-pointer border border-rose-300 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset Data
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onResetAllData?.();
                            setShowResetConfirm(false);
                          }}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Confirm Reset
                        </button>
                        <button
                          onClick={() => setShowResetConfirm(false)}
                          className="px-2 py-1 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. ABOUT HTEIM SCHOOL OF MINISTRY TAB */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              {/* Institution Hero */}
              <div className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-100/30 to-indigo-50 border border-amber-200 rounded-2xl flex items-center gap-4">
                <img 
                  src="/hteim_logo.jpg" 
                  alt="HTEIM Logo" 
                  className="w-16 h-16 rounded-full border-2 border-amber-500 shadow-md object-contain bg-white p-0.5 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">
                    HTEIM SCHOOL OF MINISTRY
                  </h3>
                  <p className="text-xs font-bold text-amber-900">Heaven Touching Earth Int'l Ministries</p>
                  <p className="text-xs italic font-serif text-slate-600 mt-1">
                    "Bringing Heaven to Earth, Taking People to Heaven"
                  </p>
                </div>
              </div>

              {/* Mission & Purpose */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Institutional Mission & Core Objective
                </h4>
                <p className="text-slate-600 leading-relaxed text-xs">
                  The HTEIM School of Ministry exists to equip, empower, and commission ministerial leaders with rigorous biblical foundations, hermeneutical accuracy, and practical pastoral competencies for global Christian ministry.
                </p>
              </div>

              {/* Developer & Software Technology Partner Information */}
              <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-900/50 shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-wider text-indigo-200">
                        App Developer & Technology Partner
                      </h4>
                      <p className="text-sm font-black text-white">Rockproxy Technologies</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono rounded-full font-bold">
                    Official Software Partner
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-indigo-900/60">
                  <div className="flex items-center gap-2 text-slate-300">
                    <UserCheck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>Director: <strong className="text-white">Kendell Pierre</strong></span>
                  </div>

                  <a 
                    href="mailto:rockproxytechnologies@gmail.com" 
                    className="flex items-center gap-2 text-indigo-300 hover:text-white transition-colors group"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-400 group-hover:text-amber-400 flex-shrink-0" />
                    <span className="underline font-mono text-[11px] truncate">rockproxytechnologies@gmail.com</span>
                  </a>
                </div>
              </div>

              {/* Portal System Information */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">System Build</span>
                  <span className="font-extrabold text-slate-900 block">v2.5.0 Enterprise Portal</span>
                  <span className="text-[10px] text-slate-500 block">React 18 • Vite • Tailwind CSS</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Live Data Sync</span>
                  <span className="font-extrabold text-emerald-700 block">Google Sheets REST API</span>
                  <span className="text-[10px] text-slate-500 block">Real-time attendance & grades</span>
                </div>
              </div>

              {/* User Guide Button */}
              {onOpenGuide && (
                <div className="pt-2 flex justify-between items-center bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
                  <div>
                    <h5 className="font-bold text-indigo-950 text-xs">Need help using the portal?</h5>
                    <p className="text-[10px] text-slate-600">Open the complete guide for sharing, PDF printing & CSV export.</p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenGuide();
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Open Guide
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 flex-shrink-0">
          <div className="text-[10px] text-slate-500 font-medium">
            <span>HTEIM Ministry ERP • 2026</span>
            <span className="mx-1.5 text-slate-300">•</span>
            <span>Created by <strong className="text-slate-800">Rockproxy Technologies</strong> (Director: Kendell Pierre)</span>
          </div>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            Save & Close Settings
          </button>
        </div>

      </div>
    </div>
  );
};
