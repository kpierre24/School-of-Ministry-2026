import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Volume2, VolumeX } from 'lucide-react';

interface IntroSplashScreenProps {
  onComplete: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

export const IntroSplashScreen: React.FC<IntroSplashScreenProps> = ({ onComplete }) => {
  // 4 progressive stages over 6.0 seconds:
  // 0s - 1.5s: 'bokeh' (particles & deep navy atmosphere)
  // 1.5s - 3.2s: 'globe' (3D earth globe emerging & rotating with light rays)
  // 3.2s - 4.6s: 'hand_seal' (divine hand touching globe & gold seal forming)
  // 4.6s - 6.0s: 'motto' (official emblem + "BRINGING HEAVEN TO EARTH, TAKING PEOPLE TO HEAVEN")
  const [stage, setStage] = useState<'bokeh' | 'globe' | 'hand_seal' | 'motto'>('bokeh');
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Generate 45 golden bokeh light orbs
  const particles = useRef<Particle[]>(
    Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 3,
      delay: Math.random() * 2,
      duration: Math.random() * 4 + 3,
      opacity: Math.random() * 0.5 + 0.25,
    }))
  ).current;

  // Synthesize ambient celestial chord progression
  const playAmbientSound = () => {
    try {
      if (audioContextRef.current) return;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0, ctx.currentTime);
      mainGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1.5);

      filter.connect(mainGain);
      mainGain.connect(ctx.destination);

      // Majestic celestial chord (D major 9th)
      const freqs = [146.83, 220.0, 293.66, 369.99, 440.0, 554.37];

      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = index % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.detune.setValueAtTime((Math.random() - 0.5) * 6, ctx.currentTime);

        oscGain.gain.setValueAtTime(0, ctx.currentTime);
        oscGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.2 + index * 0.1);

        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();

        oscGain.gain.setValueAtTime(0.06, ctx.currentTime + 5.0);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 6.0);
        osc.stop(ctx.currentTime + 6.1);
      });

      // High crystal shimmer bell at 3.2s
      setTimeout(() => {
        if (ctx.state === 'closed') return;
        const chimeOsc = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(1174.66, ctx.currentTime); // D6 bell
        chimeGain.gain.setValueAtTime(0, ctx.currentTime);
        chimeGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);
        chimeOsc.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        chimeOsc.start();
        chimeOsc.stop(ctx.currentTime + 2.6);
      }, 3200);
    } catch (e) {
      console.warn("AudioContext init skipped:", e);
    }
  };

  // Precise 6.0 second sequence matching the video
  useEffect(() => {
    const startTime = Date.now();
    const totalDuration = 6000; // strictly 6.0 seconds

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentPct = Math.min(100, (elapsed / totalDuration) * 100);
      setProgress(currentPct);
    }, 40);

    const tGlobe = setTimeout(() => setStage('globe'), 1500);
    const tHandSeal = setTimeout(() => setStage('hand_seal'), 3200);
    const tMotto = setTimeout(() => setStage('motto'), 4600);
    const tComplete = setTimeout(() => {
      onComplete();
    }, 6000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(tGlobe);
      clearTimeout(tHandSeal);
      clearTimeout(tMotto);
      clearTimeout(tComplete);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [onComplete]);

  const handleMuteToggle = () => {
    if (muted) {
      setMuted(false);
      playAmbientSound();
    } else {
      setMuted(true);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  };

  return (
    <motion.div
      id="intro-splash-screen"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-[#070e1b] flex flex-col items-center justify-center overflow-hidden select-none"
      role="region"
      aria-label="HTEIM School of Ministry Cinematic Intro"
    >
      {/* Dynamic Background Transitions */}
      {/* Stage 1 & 2: Midnight Navy & Deep Cosmic Atmosphere */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 ${
          stage === 'motto' || stage === 'hand_seal' ? 'opacity-30' : 'opacity-100'
        } bg-[radial-gradient(ellipse_at_center,_#0f2240_0%,_#060d19_65%,_#03070d_100%)] pointer-events-none`} 
      />

      {/* Stage 3 & 4: Heavenly Bright Pearlescent Glow Transition (matching the clean white backdrop in the video end) */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 ${
          stage === 'motto' ? 'opacity-95' : stage === 'hand_seal' ? 'opacity-60' : 'opacity-0'
        } bg-[radial-gradient(circle_at_center,_#ffffff_0%,_#f5f6f8_50%,_#e2e6ec_100%)] pointer-events-none`} 
      />

      {/* Rotating Divine Golden Light Rays in Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className={`w-[800px] h-[800px] sm:w-[1100px] sm:h-[1100px] rounded-full opacity-30 transition-opacity duration-1000 ${
            stage === 'motto' ? 'opacity-15' : 'opacity-35'
          }`}
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(245,158,11,0.2) 20deg, transparent 40deg, rgba(245,158,11,0.25) 60deg, transparent 80deg, rgba(245,158,11,0.2) 110deg, transparent 140deg, rgba(245,158,11,0.3) 180deg, transparent 210deg, rgba(245,158,11,0.2) 240deg, transparent 270deg, rgba(245,158,11,0.25) 310deg, transparent 360deg)'
          }}
        />
      </div>

      {/* Floating Golden Bokeh Lights & Particles (Exact Match to Video Opening) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              opacity: 0, 
              x: `${p.x}vw`, 
              y: `${p.y + 8}vh`, 
              scale: 0.4 
            }}
            animate={{ 
              opacity: [0, p.opacity, p.opacity, 0],
              y: [`${p.y + 8}vh`, `${p.y - 18}vh`],
              scale: [0.4, 1.15, 1.15, 0.3]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut"
            }}
            style={{ width: p.size, height: p.size }}
            className={`absolute rounded-full blur-[1px] ${
              stage === 'motto' 
                ? 'bg-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]' 
                : 'bg-amber-300/70 shadow-[0_0_14px_rgba(251,191,36,0.6)]'
            }`}
          />
        ))}
      </div>

      {/* Bottom-Right Video Watermark Sparkle (Exact Reproduction from Video Frame) */}
      <div className="absolute bottom-6 right-8 pointer-events-none z-20 flex items-center gap-1">
        <motion.div
          animate={{ 
            scale: [0.85, 1.25, 0.85],
            opacity: [0.4, 0.9, 0.4],
            rotate: [0, 90, 180]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={`w-6 h-6 ${stage === 'motto' ? 'text-slate-400' : 'text-amber-200/60'}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </motion.div>
      </div>

      {/* Audio Controller Toggle */}
      <button
        onClick={handleMuteToggle}
        className={`absolute top-6 right-6 z-50 p-2.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider shadow-lg ${
          stage === 'motto'
            ? 'bg-slate-900/10 border-slate-300 text-slate-700 hover:bg-slate-900/20 hover:text-slate-950'
            : 'bg-white/10 border-white/15 text-slate-200 hover:border-amber-400/50 hover:text-amber-300'
        }`}
        title="Toggle atmospheric audio"
      >
        {muted ? (
          <>
            <VolumeX className="w-3.5 h-3.5 text-amber-500" />
            <span>Sound Off</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Sound On</span>
          </>
        )}
      </button>

      {/* Central Visual Stage */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-xl px-4 text-center w-full">
        
        {/* Main Emblem / Globe Stage Area */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
          
          {/* Radiant Halo Backlight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: stage === 'bokeh' ? 0.3 : stage === 'motto' ? 0.6 : 0.85, 
              scale: stage === 'bokeh' ? 0.6 : 1 
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-gradient-to-tr from-amber-400/30 via-yellow-200/20 to-sky-400/20 blur-2xl animate-pulse" />
          </motion.div>

          {/* Stage 1 & 2: 3D Earth Globe Spinning */}
          <AnimatePresence>
            {(stage === 'globe' || stage === 'bokeh') && (
              <motion.div
                key="earth-globe"
                initial={{ scale: 0.1, opacity: 0, rotate: -45 }}
                animate={{ 
                  scale: stage === 'globe' ? 1 : 0.2, 
                  opacity: stage === 'globe' ? 1 : 0, 
                  rotate: 0 
                }}
                exit={{ scale: 1.15, opacity: 0 }}
                transition={{ 
                  scale: { duration: 1.6, ease: [0.16, 1, 0.3, 1] },
                  rotate: { duration: 2.0, ease: "easeOut" },
                  opacity: { duration: 0.8 }
                }}
                className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full overflow-hidden bg-[#0d2a54] border-[3px] border-amber-400/90 shadow-[0_0_45px_rgba(245,158,11,0.45)] flex items-center justify-center"
              >
                {/* 3D Spherical Atmosphere Specular Shading */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0.05)_40%,rgba(0,0,0,0.85)_100%)] z-20 pointer-events-none" />
                
                {/* Glowing Blue Outer Rim */}
                <div className="absolute inset-0 rounded-full border border-sky-300/40 shadow-inner z-20 pointer-events-none" />

                {/* Animated Rotating Continents Map */}
                <motion.div
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 bottom-0 w-[200%] flex z-0 opacity-95"
                >
                  <div className="w-1/2 h-full relative text-emerald-400">
                    <svg className="w-full h-full" viewBox="0 0 200 200" fill="currentColor">
                      {/* Realistic Green Continent Silhouettes */}
                      <path d="M25,35 Q45,20 65,38 T85,25 T95,55 T65,75 T35,55 Z" fill="#22c55e" />
                      <path d="M70,85 Q90,95 75,135 T55,170 T45,145 T50,105 Z" fill="#16a34a" />
                      <path d="M115,75 Q145,65 165,100 T150,155 T120,130 T115,100 Z" fill="#22c55e" />
                      <path d="M110,25 Q135,18 145,38 T120,62 T105,42 Z" fill="#4ade80" />
                      <path d="M150,90 Q170,80 185,110 T170,140 T150,115 Z" fill="#15803d" />
                    </svg>
                  </div>
                  <div className="w-1/2 h-full relative text-emerald-400">
                    <svg className="w-full h-full" viewBox="0 0 200 200" fill="currentColor">
                      <path d="M25,35 Q45,20 65,38 T85,25 T95,55 T65,75 T35,55 Z" fill="#22c55e" />
                      <path d="M70,85 Q90,95 75,135 T55,170 T45,145 T50,105 Z" fill="#16a34a" />
                      <path d="M115,75 Q145,65 165,100 T150,155 T120,130 T115,100 Z" fill="#22c55e" />
                      <path d="M110,25 Q135,18 145,38 T120,62 T105,42 Z" fill="#4ade80" />
                      <path d="M150,90 Q170,80 185,110 T170,140 T150,115 Z" fill="#15803d" />
                    </svg>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stage 3 & 4: The Official HTEIM Emblem with Heavenly Hand Touching the Earth */}
          <AnimatePresence>
            {(stage === 'hand_seal' || stage === 'motto') && (
              <motion.div
                key="official-hteim-seal"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center justify-center z-30"
              >
                {/* High-Resolution Emblem Render */}
                <div className="relative w-52 h-52 sm:w-68 sm:h-68 flex items-center justify-center filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
                  <img
                    src="/hteim_logo.svg"
                    alt="Heaven Touching Earth Int'l Ministries Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback to png if svg render fails
                      (e.currentTarget as HTMLImageElement).src = '/hteim_logo.png';
                    }}
                  />
                  
                  {/* Subtle Divine Light Sweep across the Seal */}
                  <motion.div
                    initial={{ x: '-120%' }}
                    animate={{ x: '120%' }}
                    transition={{ duration: 1.4, delay: 0.2, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stage 4: Inspiring Motto & Official Slogan Reveal (Exact match to video ending) */}
        <div className="h-24 mt-4 sm:mt-6 flex flex-col items-center justify-center">
          <AnimatePresence>
            {stage === 'motto' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="flex flex-col items-center max-w-md px-2"
              >
                {/* Official Motto: "BRINGING HEAVEN TO EARTH, TAKING PEOPLE TO HEAVEN" */}
                <h2 className="text-xs sm:text-sm md:text-base font-black tracking-[0.18em] uppercase text-slate-800 font-syne text-center">
                  BRINGING HEAVEN TO EARTH,
                </h2>
                <h3 className="text-xs sm:text-sm md:text-base font-black tracking-[0.18em] uppercase text-slate-800 font-syne text-center mt-1">
                  TAKING PEOPLE TO HEAVEN
                </h3>

                {/* Sparkling Accent Divider */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-12 sm:w-16 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <div className="w-12 sm:w-16 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 6-Second Progress Bar & Skip Intro Control */}
        <div className="absolute bottom-8 w-full max-w-xs px-4 flex flex-col items-center gap-2 z-50">
          <div className="w-full h-1 bg-slate-300/30 rounded-full overflow-hidden backdrop-blur-xs">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            type="button"
            onClick={onComplete}
            className={`px-4 py-1.5 rounded-full flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 ${
              stage === 'motto'
                ? 'bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 hover:text-slate-950 border border-slate-300'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 hover:text-amber-300 border border-white/20'
            }`}
          >
            <span>Skip Intro</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>
    </motion.div>
  );
};

export default IntroSplashScreen;
