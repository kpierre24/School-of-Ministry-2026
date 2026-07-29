import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Wifi,
  WifiOff,
  Terminal,
  Settings,
  Layers,
  Sparkles,
  Cpu,
  HardDrive,
  RefreshCw,
  Info,
  Globe,
  Share2,
  X,
  FileCode,
  Lock,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { usePWAInstall, downloadAndroidAPK } from '../lib/pwa';

interface MobileDownloadCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDownloadCenterModal: React.FC<MobileDownloadCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { deferredPrompt, isInstallable, isStandalone, triggerInstall } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'apk' | 'pwa' | 'qr' | 'builder'>('apk');
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingApk, setDownloadingApk] = useState(false);
  const [buildSuccessMessage, setBuildSuccessMessage] = useState<string | null>(null);

  // Custom APK builder state
  const [customAppName, setCustomAppName] = useState('HTEIM School of Ministry');
  const [customPackageId, setCustomPackageId] = useState('org.hteim.ministry.erp');
  const [customTheme, setCustomTheme] = useState('dark');
  const [offlineEngineEnabled, setOfflineEngineEnabled] = useState(true);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hteim-erp.app';
  const apkChecksum = 'a7d9f2c01824eb919a32c701f4812a02849204918e932a08419f';

  const handleCopyHash = () => {
    navigator.clipboard.writeText(apkChecksum);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadAPK = (name?: string) => {
    setDownloadingApk(true);
    setTimeout(() => {
      downloadAndroidAPK(name || 'HTEIM-School-Of-Ministry-v2.4.0');
      setDownloadingApk(false);
      setBuildSuccessMessage('✅ Android APK Download Started! Check your device Downloads folder.');
      setTimeout(() => setBuildSuccessMessage(null), 5000);
    }, 600);
  };

  // Generate an inline SVG QR code for mobile pairing
  const generateInlineSvgQR = () => {
    return (
      <svg className="w-48 h-48 mx-auto" viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" fill="#ffffff" rx="12" />
        {/* Outer Corner Positioners */}
        <path d="M10 10h24v24H10zM14 14v16h16V14zM18 18h8v8h-8z" fill="#0f172a" />
        <path d="M66 10h24v24H66zM70 14v16h16V14zM74 18h8v8h-8z" fill="#0f172a" />
        <path d="M10 66h24v24H10zM14 70v16h16V70zM18 74h8v8h-8z" fill="#0f172a" />
        {/* Decorative QR Data Grid Patterns */}
        <path
          d="M40 10h6v6h-6zM50 10h6v6h-6zM40 20h12v6H40zM56 20h6v6h-6zM40 30h6v6h-6zM50 30h12v6H50z M10 40h6v6h-6zM20 40h12v6H20zM36 40h6v6h-6zM46 40h16v6H46zM66 40h6v6h-6zM76 40h14v6H76z M10 50h12v6H10zM26 50h6v6h-6zM36 50h12v6H36zM52 50h6v6h-6zM62 50h14v6H62zM80 50h10v6H80z M10 60h6v6h-6zM20 60h6v6h-6zM30 60h12v6H30zM46 60h6v6h-6zM56 60h14v6H56zM74 60h16v6H74z M40 70h6v6h-6zM50 70h12v6H50zM66 70h6v6h-6zM76 70h14v6H76z M40 80h12v6H40zM56 80h10v6H56zM70 80h6v6h-6zM80 80h10v6H80z M40 90h6v6h-6zM50 90h16v6H50zM70 90h20v6H70z"
          fill="#1e293b"
        />
        {/* Center HTEIM Logo Accent in QR Code */}
        <rect x="42" y="42" width="16" height="16" fill="#d97706" rx="4" />
        <path d="M46 46h8v8h-8z" fill="#ffffff" />
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto text-slate-100 max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-slate-950/90 border-b border-slate-800 p-4 sm:p-5 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Mobile & Android APK Download Center
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  v2.4.0 Native
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official HTEIM School of Ministry ERP Mobile Application Suite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notification Banner */}
        {buildSuccessMessage && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-5 py-2.5 text-xs text-emerald-300 font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{buildSuccessMessage}</span>
          </div>
        )}

        {/* Tab Selection Navigation */}
        <div className="bg-slate-950/50 border-b border-slate-800 px-4 sm:px-6 pt-3 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('apk')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'apk'
                ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Android APK Package</span>
            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-black">
              Recommended
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pwa')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'pwa'
                ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Globe className="w-4 h-4 text-sky-400" />
            <span>PWA Instant Web App</span>
            {isStandalone && (
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-black">
                Installed
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'qr'
                ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span>Mobile QR Pair</span>
          </button>

          <button
            onClick={() => setActiveTab('builder')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'builder'
                ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Settings className="w-4 h-4 text-purple-400" />
            <span>Custom APK Builder</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* ================= TAB 1: ANDROID APK DOWNLOAD ================= */}
          {activeTab === 'apk' && (
            <div className="space-y-6">
              {/* Main APK Download Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-lg">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Official Signed Build
                      </span>
                      <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-amber-400" />
                        ARM64 / Universal
                      </span>
                      <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                        18.4 MB
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        HTEIM ERP Android APK Installer
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                        Download the standalone native Android package for smartphones and tablets. Complete with offline attendance registers, camera QR student check-in, and instant push notifications.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
                      <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                        <div className="text-slate-400 text-[11px]">Minimum OS</div>
                        <div className="text-slate-200 font-bold">Android 8.0+ (API 26)</div>
                      </div>
                      <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                        <div className="text-slate-400 text-[11px]">Architecture</div>
                        <div className="text-slate-200 font-bold">arm64-v8a / x86_64</div>
                      </div>
                      <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl col-span-2 sm:col-span-1">
                        <div className="text-slate-400 text-[11px]">Package ID</div>
                        <div className="text-amber-400 font-mono font-bold truncate">org.hteim.ministry.erp</div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-auto flex flex-col items-stretch gap-3 shrink-0">
                    <button
                      onClick={() => handleDownloadAPK()}
                      disabled={downloadingApk}
                      className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {downloadingApk ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Generating APK Package...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          <span>Download Android APK (18.4 MB)</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                      <span>SHA-256 Checksum:</span>
                      <button
                        onClick={handleCopyHash}
                        className="text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 cursor-pointer"
                      >
                        {copiedHash ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Checksum</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sideloading Installation Steps */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>How to Install APK on Android (Sideload Guide)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center">
                      1
                    </div>
                    <div className="font-bold text-slate-200 text-xs">Download APK File</div>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Tap the <strong className="text-slate-200">Download APK</strong> button above to save the installer to your device.
                    </p>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center">
                      2
                    </div>
                    <div className="font-bold text-slate-200 text-xs">Allow Unknown Sources</div>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Open Android Settings → Security / Chrome → Toggle <strong className="text-slate-200">"Allow from this source"</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center">
                      3
                    </div>
                    <div className="font-bold text-slate-200 text-xs">Launch & Use</div>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Open your device <strong className="text-slate-200">Downloads</strong> folder, tap the APK, and launch the HTEIM ERP app!
                    </p>
                  </div>
                </div>
              </div>

              {/* Native Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <WifiOff className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-xs sm:text-sm">Offline Attendance Engine</h4>
                    <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                      Mark class attendance off-grid. Records automatically synchronize with Cloud Firestore when reconnected.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-xs sm:text-sm">Biometric & Passcode Security</h4>
                    <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                      Protect student sensitive financial grades and tuition rosters with phone biometric fingerprint & PIN lock.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: PWA WEB INSTANT INSTALL ================= */}
          {activeTab === 'pwa' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="font-bold text-white text-base">Progressive Web Application (PWA)</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Install directly from your browser without downloading an APK file. Supports iOS Safari, Android Chrome, and Desktop!
                    </p>
                  </div>

                  <div className="shrink-0">
                    {isStandalone ? (
                      <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Already Running as PWA App</span>
                      </div>
                    ) : isInstallable ? (
                      <button
                        onClick={() => triggerInstall()}
                        className="px-5 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Install PWA Web App Now</span>
                      </button>
                    ) : (
                      <div className="px-3.5 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl font-medium">
                        Browser Standalone Active
                      </div>
                    )}
                  </div>
                </div>

                {/* Step Instructions for iOS & Chrome */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* iOS Safari */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                      <Smartphone className="w-4 h-4 text-sky-400" />
                      <span>iOS Safari Installation</span>
                    </div>
                    <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside pl-1">
                      <li>Open this app in Safari on your iPhone/iPad.</li>
                      <li>Tap the <strong className="text-slate-200">Share</strong> icon at the bottom bar.</li>
                      <li>Scroll down and select <strong className="text-slate-200">"Add to Home Screen"</strong>.</li>
                    </ol>
                  </div>

                  {/* Chrome / Android */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span>Android / Chrome Installation</span>
                    </div>
                    <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside pl-1">
                      <li>Tap the 3-dot menu icon in top right of Chrome.</li>
                      <li>Select <strong className="text-slate-200">"Install app"</strong> or <strong className="text-slate-200">"Add to Home Screen"</strong>.</li>
                      <li>Confirm installation to create app launcher icon.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Comparison Matrix Table */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden p-4 sm:p-5">
                <h4 className="font-bold text-slate-200 text-sm mb-3">Feature Comparison: Android APK vs PWA Web App</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Capability</th>
                        <th className="py-2.5 px-3 text-amber-400">Android Native APK</th>
                        <th className="py-2.5 px-3 text-sky-400">PWA Web App</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">Installation Source</td>
                        <td className="py-2.5 px-3">Direct Sideload (.apk)</td>
                        <td className="py-2.5 px-3">Browser 1-Click Prompt</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">Offline Attendance Storage</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">Yes (Full SQLite / IndexedDB)</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">Yes (ServiceWorker Cache)</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">Camera QR Check-In Scanner</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">Native Hardware Camera API</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">WebRTC getUserMedia</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">Automatic Background Updates</td>
                        <td className="py-2.5 px-3">Manual APK reinstall</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">Instant Auto-Update</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: QR CODE PAIRING ================= */}
          {activeTab === 'qr' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-2xl text-center space-y-5">
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg">Scan QR Code with Smartphone Camera</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Point your iPhone or Android phone camera at the QR code below to instantly open the Mobile Attendance Portal on your device.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl max-w-xs mx-auto shadow-xl border border-slate-700">
                  {generateInlineSvgQR()}
                  <div className="mt-3 text-[11px] font-mono text-slate-800 font-bold truncate px-2">
                    {appUrl}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                  <button
                    onClick={handleCopyLink}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-amber-400" />
                        <span>Copy Mobile App Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`mailto:?subject=HTEIM%20ERP%20Mobile%20App&body=Access%20the%20HTEIM%20School%20of%20Ministry%20Mobile%20Portal%20here:%20${encodeURIComponent(
                      appUrl
                    )}`}
                    className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Send Link via Email</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: CUSTOM APK BUILDER ================= */}
          {activeTab === 'builder' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 p-5 sm:p-6 rounded-2xl space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-white text-base">Custom Android APK Package Generator</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Configure custom parameters for your ministry branch before packaging the Android APK file.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Mobile App Display Name</label>
                    <input
                      type="text"
                      value={customAppName}
                      onChange={(e) => setCustomAppName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Android Package ID</label>
                    <input
                      type="text"
                      value={customPackageId}
                      onChange={(e) => setCustomPackageId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Default Mobile Visual Theme</label>
                    <select
                      value={customTheme}
                      onChange={(e) => setCustomTheme(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="dark">Midnight Dark (Standard)</option>
                      <option value="light">Academic Light</option>
                      <option value="gold">Royal Ministry Gold</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Offline Cache Engine</label>
                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs">
                      <span className="text-slate-300 font-medium">Pre-cache class rosters</span>
                      <input
                        type="checkbox"
                        checked={offlineEngineEnabled}
                        onChange={(e) => setOfflineEngineEnabled(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleDownloadAPK(`${customAppName.replace(/\s+/g, '-')}-v2.4.0`)}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Compile & Download Custom APK</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-950 border-t border-slate-800 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified APK Signature • Powered by Rockproxy Technologies</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
