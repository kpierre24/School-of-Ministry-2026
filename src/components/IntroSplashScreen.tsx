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
}

export const IntroSplashScreen: React.FC<IntroSplashScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'particles' | 'globe' | 'logo' | 'slogan'>('particles');
  const [muted, setMuted] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Generate 40 golden particles
  const particles = useRef<Particle[]>(
    Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1.5,
      delay: Math.random() * 4,
      duration: Math.random() * 6 + 4,
    }))
  ).current;

  // Synthesize a majestic ambient church pad chord when the user interacts or toggles sound
  const playAmbientSound = () => {
    try {
      if (audioContextRef.current) return;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // Base nodes
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      filter.Q.setValueAtTime(1, ctx.currentTime);

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0, ctx.currentTime);
      mainGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 2.5);

      filter.connect(mainGain);
      mainGain.connect(ctx.destination);

      // Uplifting minor 9th / major chord progression (Dmaj9 vibe: D, A, C#, E, F#)
      const freqs = [146.83, 220.00, 277.18, 329.63, 369.99];

      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        // Warm triangle and smooth sine wave blend
        osc.type = index % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Detune slightly for lush chorus effect
        osc.detune.setValueAtTime((Math.random() - 0.5) * 8, ctx.currentTime);

        oscGain.gain.setValueAtTime(0, ctx.currentTime);
        oscGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.5 + Math.random());

        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();

        // Slow fade out at the end
        oscGain.gain.setValueAtTime(0.08, ctx.currentTime + 8.5);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 10.5);
        osc.stop(ctx.currentTime + 11);
      });

      // Majestic high frequency chime at stage 2 (globe zoom)
      setTimeout(() => {
        if (ctx.state === 'closed') return;
        const chimeOsc = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(880, ctx.currentTime); // A5 chime
        chimeGain.gain.setValueAtTime(0, ctx.currentTime);
        chimeGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.5);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4.5);
        chimeOsc.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        chimeOsc.start();
        chimeOsc.stop(ctx.currentTime + 5);
      }, 2000);

    } catch (e) {
      console.warn("AudioContext block: User must interact first or browser muted", e);
    }
  };

  useEffect(() => {
    // Stage controller following the exact timings of the uploaded video
    const tGlobe = setTimeout(() => setStage('globe'), 1800);
    const tLogo = setTimeout(() => setStage('logo'), 4800);
    const tSlogan = setTimeout(() => setStage('slogan'), 7800);
    const tComplete = setTimeout(() => {
      // Small fade out window
      const exitTimer = setTimeout(() => onComplete(), 600);
      return () => clearTimeout(exitTimer);
    }, 11200);

    return () => {
      clearTimeout(tGlobe);
      clearTimeout(tLogo);
      clearTimeout(tSlogan);
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
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* 1. Cinematic Background with Radial Dark Blue Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,32,67,0.85)_0%,rgba(5,9,20,1)_100%)] pointer-events-none" />

      {/* 2. Floating Golden Particles (Bokeh) Loop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              opacity: 0, 
              x: `${p.x}vw`, 
              y: `${p.y + 10}vh`, 
              scale: 0.5 
            }}
            animate={{ 
              opacity: [0, 0.65, 0.65, 0],
              y: [`${p.y + 10}vh`, `${p.y - 15}vh`],
              scale: [0.5, 1.2, 1.2, 0.4]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut"
            }}
            style={{ width: p.size, height: p.size }}
            className="absolute bg-amber-400/60 rounded-full blur-[1px] shadow-[0_0_10px_rgba(251,191,36,0.5)]"
          />
        ))}
      </div>

      {/* 3. Audio Controller */}
      <button
        onClick={handleMuteToggle}
        className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-white/5 border border-white/10 hover:border-amber-400/40 text-slate-300 hover:text-amber-400 transition-all cursor-pointer flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider shadow-md"
      >
        {muted ? (
          <>
            <VolumeX className="w-3.5 h-3.5 text-amber-500" />
            <span>Enable Sound</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Sound On</span>
          </>
        )}
      </button>

      {/* Main Cinematic Visuals Wrapper */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-lg px-6 text-center w-full">
        
        {/* Globe Stage */}
        <div className="relative w-72 h-72 sm:w-85 sm:h-85 flex items-center justify-center">
          
          {/* Glowing Aura Rings behind Globe */}
          <AnimatePresence>
            {stage !== 'particles' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {/* Outer halo */}
                <div className="absolute w-64 h-64 rounded-full bg-amber-500/10 blur-3xl animate-pulse" />
                <div className="absolute w-52 h-52 rounded-full border border-amber-500/20 animate-spin [animation-duration:25s]" />
                <div className="absolute w-44 h-44 rounded-full border border-dashed border-amber-400/10 animate-spin [animation-duration:15s]" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Earth Globe (Stage: Globe) */}
          <AnimatePresence>
            {stage !== 'particles' && (
              <motion.div
                initial={{ scale: 0.1, rotate: -120, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ 
                  scale: { duration: 2.2, ease: [0.16, 1, 0.3, 1] },
                  rotate: { duration: 2.8, ease: "easeOut" },
                  opacity: { duration: 1.2 }
                }}
                className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden bg-sky-950 border-4 border-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.35)] flex items-center justify-center"
              >
                {/* 3D-like Spherical Shadow & Specular Highlight */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,transparent_30%,rgba(0,0,0,0.85)_100%)] z-20 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(255,255,255,0.25)_0%,transparent_50%)] z-20 pointer-events-none" />

                {/* Spinning Grid Lines */}
                <svg className="absolute inset-0 w-full h-full text-white/10 z-10" viewBox="0 0 100 100">
                  <ellipse cx="50" cy="50" rx="50" ry="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <ellipse cx="50" cy="50" rx="50" ry="38" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <ellipse cx="50" cy="50" rx="20" ry="50" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <ellipse cx="50" cy="50" rx="38" ry="50" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.5" />
                </svg>

                {/* Sliding Continents Map to create the rotating Earth illusion */}
                <motion.div
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 bottom-0 w-[200%] flex z-0 opacity-85"
                >
                  {/* Continent pattern set 1 */}
                  <div className="w-1/2 h-full relative text-emerald-500">
                    <svg className="w-full h-full" viewBox="0 0 200 200" fill="currentColor">
                      {/* North America */}
                      <path d="M20,40 Q40,30 60,45 T80,30 T90,60 T60,80 T30,60 Z" />
                      {/* South America */}
                      <path d="M65,90 Q85,100 70,140 T50,175 T40,150 T45,110 Z" />
                      {/* Africa */}
                      <path d="M120,85 Q145,75 160,110 T145,160 T115,130 T110,105 Z" />
                      {/* Europe */}
                      <path d="M110,30 Q130,25 140,45 T115,70 T100,50 Z" />
                    </svg>
                  </div>
                  {/* Continent pattern set 2 (Identical for seamless infinite scroll) */}
                  <div className="w-1/2 h-full relative text-emerald-500">
                    <svg className="w-full h-full" viewBox="0 0 200 200" fill="currentColor">
                      <path d="M20,40 Q40,30 60,45 T80,30 T90,60 T60,80 T30,60 Z" />
                      <path d="M65,90 Q85,100 70,140 T50,175 T40,150 T45,110 Z" />
                      <path d="M120,85 Q145,75 160,110 T145,160 T115,130 T110,105 Z" />
                      <path d="M110,30 Q130,25 140,45 T115,70 T100,50 Z" />
                    </svg>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core HTEIM Gold Logo Overlay & Drawn Hand (Stage: Logo) */}
          <AnimatePresence>
            {stage === 'logo' || stage === 'slogan' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute inset-0 flex flex-col items-center justify-center z-30"
              >
                {/* Gold Circle Frame */}
                <div className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full border-[6px] border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)] bg-slate-950/20 backdrop-blur-[1px] pointer-events-none" />

                {/* Hand outline drawn over the Earth */}
                <svg className="absolute w-44 h-44 sm:w-52 sm:h-52 text-white z-40" viewBox="0 0 100 100" fill="none">
                  <motion.path
                    d="M 50,22 Q 43,26 40,36 T 38,55 Q 38,65 44,70 T 56,70 T 62,55 T 60,36 Z"
                    stroke="#F59E0B"
                    strokeWidth="1.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                  {/* Detailed pointing hand silhouette */}
                  <motion.path
                    d="M 50,42 C 48,42 46,44 46,46 L 46,58 C 46,60 48,62 50,62 C 52,62 54,60 54,58 L 54,46 C 54,44 52,42 50,42 Z"
                    stroke="#FFFFFF"
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 0.6, ease: "easeInOut" }}
                  />
                </svg>

                {/* Elegant Circular Ministry Label */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 1 }}
                  className="absolute -bottom-2 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full border border-amber-300 text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap z-50 font-sans"
                >
                  HEAVEN TOUCHING EARTH
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Title & Slogan Area (Stage: Slogan) */}
        <div className="h-28 mt-4 flex flex-col items-center justify-center">
          <AnimatePresence>
            {stage === 'logo' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
              >
                <h2 className="text-xl sm:text-2xl font-black text-amber-400 font-syne tracking-widest drop-shadow-[0_2px_10px_rgba(245,158,11,0.25)]">
                  HTEIM
                </h2>
                <p className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mt-1">
                  School of Ministry
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {stage === 'slogan' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.4, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                {/* Slogan Top Row */}
                <h3 className="text-sm sm:text-base font-black text-white font-syne tracking-[0.18em] uppercase text-center max-w-sm">
                  BRINGING HEAVEN TO EARTH
                </h3>
                {/* Slogan Bottom Row */}
                <p className="text-[11px] sm:text-xs font-bold text-amber-400 font-sans tracking-[0.14em] uppercase text-center mt-1.5">
                  TAKING PEOPLE TO HEAVEN
                </p>
                <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Interactive Skip Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          whileHover={{ opacity: 1, scale: 1.05 }}
          onClick={onComplete}
          className="absolute bottom-10 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/40 rounded-full flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-300 hover:text-amber-400 transition-all cursor-pointer shadow-md active:scale-95 z-50"
        >
          Skip Intro
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default IntroSplashScreen;
