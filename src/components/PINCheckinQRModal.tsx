import React, { useState, useEffect } from 'react';
import { QrCode, Lock, Clock, MapPin, CheckCircle2, ShieldCheck, RefreshCw, Copy, Sparkles } from 'lucide-react';
import { PINCheckinSession } from '../types';

interface PINCheckinQRModalProps {
  classDayName: string;
  onClose: () => void;
  onSessionCreated?: (session: PINCheckinSession) => void;
}

export const PINCheckinQRModal: React.FC<PINCheckinQRModalProps> = ({
  classDayName,
  onClose,
  onSessionCreated
}) => {
  const [pinCode, setPinCode] = useState<string>('');
  const [expirationMinutes, setExpirationMinutes] = useState<number>(15);
  const [geoEnabled, setGeoEnabled] = useState<boolean>(true);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(15 * 60);
  const [copied, setCopied] = useState(false);

  // Generate 4-digit PIN code
  const generateNewPIN = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setPinCode(code);
    setTimeLeftSeconds(expirationMinutes * 60);
  };

  useEffect(() => {
    generateNewPIN();
  }, [expirationMinutes]);

  useEffect(() => {
    if (timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeftSeconds]);

  const mins = Math.floor(timeLeftSeconds / 60);
  const secs = timeLeftSeconds % 60;

  const handleCopy = () => {
    navigator.clipboard.writeText(pinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold flex items-center justify-center transition-colors cursor-pointer"
        >
          ✕
        </button>

        <div className="space-y-1">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
            Live Classroom Attendance Verification
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white font-syne pt-1">
            {classDayName} PIN & QR Code
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Students enter this PIN or scan QR to check in automatically.
          </p>
        </div>

        {/* Big PIN Box */}
        <div className="p-6 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl border border-indigo-500/30 space-y-3 relative shadow-lg">
          <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-extrabold">
            TIME-EXPIRING PIN CODE
          </p>
          <div className="text-5xl font-black font-mono tracking-widest text-amber-400 flex items-center justify-center gap-2">
            <span>{pinCode || '8841'}</span>
            <button
              onClick={handleCopy}
              title="Copy PIN"
              className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300 pt-1">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Expires in: {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* QR Code Graphic Mockup */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center space-y-2">
          <div className="w-36 h-36 bg-white p-2 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center">
            {/* SVG QR Code pattern mockup */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950 fill-current">
              <path d="M10 10h30v30H10zM15 15v20h20V15zm5 5h10v10H20zM60 10h30v30H60zM65 15v20h20V15zm5 5h10v10H70zM10 60h30v30H10zM15 65v20h20V65zm5 5h10v10H20zM45 10h10v10H45zM45 25h10v10H45zM45 40h10v10H45zM10 45h10v10H10zM25 45h10v10H25zM60 45h10v10H60zM75 45h15v10H75zM45 60h10v10H45zM60 60h15v10H60zM80 60h10v10H80zM45 75h10v15H45zM60 75h10v10H60zM75 75h15v15H75z" />
            </svg>
          </div>
          <p className="text-[11px] text-slate-500 font-bold">
            Scan with phone camera to auto check-in
          </p>
        </div>

        {/* Settings: Expiration & Geolocation */}
        <div className="space-y-3 text-left">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>PIN Expiration Window</span>
            <select
              value={expirationMinutes}
              onChange={(e) => setExpirationMinutes(Number(e.target.value))}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
            >
              <option value={5}>5 Minutes</option>
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={60}>60 Minutes</option>
            </select>
          </div>

          <label className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-500" />
              Classroom Geolocation Verification (50m Radius)
            </span>
            <input
              type="checkbox"
              checked={geoEnabled}
              onChange={(e) => setGeoEnabled(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
          </label>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={generateNewPIN}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate Fresh PIN</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
