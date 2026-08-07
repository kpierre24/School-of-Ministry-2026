import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { LogoImage } from './LogoImage';
import { Sparkles, ArrowRight } from 'lucide-react';

interface IntroSplashScreenProps {
  onComplete: () => void;
}

export const IntroSplashScreen: React.FC<IntroSplashScreenProps> = ({ onComplete }) => {
  const [startTypewriter, setStartTypewriter] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);

  // Split title "School of Ministry" into individual characters
  const mainTitle = "School of Ministry";
  const subTitle = "Heaven Touching Earth International Ministries";
  const titleChars = mainTitle.split("");

  useEffect(() => {
    // Delay typing start slightly after logo appears
    const typeTimer = setTimeout(() => {
      setStartTypewriter(true);
    }, 800);

    // Auto complete the intro after typewriter finishes + a longer reading delay (3200ms instead of 1200ms)
    const totalDuration = 800 + (titleChars.length * 80) + 3200;
    const completeTimer = setTimeout(() => {
      setAnimationFinished(true);
      // Give a tiny fadeout window
      const fadeTimer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(fadeTimer);
    }, totalDuration);

    return () => {
      clearTimeout(typeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, titleChars.length]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      }
    }
  };

  const letterVariants = {
    hidden: { 
      opacity: 0, 
      y: 12, 
      scale: 0.7,
      filter: "blur(4px)" 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 150
      }
    }
  };

  const logoPulseVariants = {
    pulse: {
      scale: [1, 1.04, 1],
      rotate: [0, 0.5, -0.5, 0],
      boxShadow: [
        "0 0 15px 2px rgba(245, 158, 11, 0.15)",
        "0 0 35px 12px rgba(245, 158, 11, 0.35)",
        "0 0 15px 2px rgba(245, 158, 11, 0.15)"
      ],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      id="intro-splash-screen"
      initial={{ opacity: 1 }}
      animate={{ opacity: animationFinished ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* Cinematic Ambient Glow & Particles */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,27,75,0.45)_0%,rgba(9,12,22,1)_100%)] pointer-events-none" />
      
      {/* Soft Starbursts/Reflections */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-amber-300 rounded-full animate-ping [animation-duration:4s]" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-indigo-300 rounded-full animate-ping [animation-duration:5s]" />
        <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse [animation-duration:3s]" />
        <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse [animation-duration:3.5s]" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center">
        {/* Pulsing Logo Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <motion.div
            variants={logoPulseVariants}
            animate="pulse"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-2 border-amber-400/80 shadow-2xl bg-white p-1.5 flex items-center justify-center overflow-hidden cursor-pointer"
          >
            <LogoImage className="w-full h-full object-contain" />
          </motion.div>
        </motion.div>

        {/* Built-up Main Title */}
        <div className="h-10 mb-2 flex items-center justify-center">
          {startTypewriter ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-0.5 justify-center flex-wrap"
            >
              {titleChars.map((char, index) => (
                <motion.span
                  key={index}
                  variants={letterVariants}
                  className={`${
                    char === " " ? "w-2.5" : ""
                  } text-xl sm:text-2xl md:text-3xl font-black text-amber-400 dark:text-amber-300 font-syne tracking-tight drop-shadow-[0_2px_8px_rgba(245,158,11,0.25)]`}
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>
          ) : (
            <span className="text-xl sm:text-2xl font-black text-transparent select-none font-syne">
              School of Ministry
            </span>
          )}
        </div>

        {/* Subtitle with dynamic fade-in */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: startTypewriter ? 0.75 : 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-indigo-200/90 font-mono"
        >
          {subTitle}
        </motion.p>

        {/* Interactive Skip Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: startTypewriter ? 0.6 : 0 }}
          whileHover={{ opacity: 1, scale: 1.05 }}
          onClick={onComplete}
          className="mt-12 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/40 rounded-full flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-300 hover:text-amber-400 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          Skip Intro
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default IntroSplashScreen;
