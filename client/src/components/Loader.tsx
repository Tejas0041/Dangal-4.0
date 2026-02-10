import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function Loader() {
  // Start with true to prevent flash of content
  const [showLoader, setShowLoader] = useState(true);
  const [gifLoaded, setGifLoaded] = useState(false);

  useEffect(() => {
    // Check if this is a navigation (not a page load/reload)
    const perfEntries = window.performance.getEntriesByType('navigation');
    const isNavigation = perfEntries.length > 0 && 
      (perfEntries[0] as PerformanceNavigationTiming).type === 'navigate';
    
    // Check if loader has already been shown during this navigation session
    const loaderShownThisSession = sessionStorage.getItem('loaderShownThisSession');
    
    // Only show loader if:
    // 1. It's NOT a navigation (i.e., it's a reload or first load)
    // 2. OR it hasn't been shown in this session yet
    if (isNavigation && loaderShownThisSession === 'true') {
      setShowLoader(false);
      return;
    }

    // Check if loader should be shown from env
    const shouldShowLoader = import.meta.env.VITE_SHOW_LOADER === 'true';
    
    if (!shouldShowLoader) {
      setShowLoader(false);
      return;
    }

    // Show loader
    setShowLoader(true);

    // Preload the GIF
    const img = new Image();
    img.src = '/loader.gif';
    
    img.onload = () => {
      setGifLoaded(true);
      // Hide loader after GIF plays (assuming ~3 seconds for the GIF)
      setTimeout(() => {
        setShowLoader(false);
        // Mark loader as shown for this navigation session
        sessionStorage.setItem('loaderShownThisSession', 'true');
      }, 3000);
    };

    // Fallback: hide loader after 5 seconds even if GIF doesn't load
    const fallbackTimer = setTimeout(() => {
      setShowLoader(false);
      sessionStorage.setItem('loaderShownThisSession', 'true');
    }, 5000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  if (!showLoader) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Yellow Glow Effects - Away from GIF */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Top Left Glow */}
          <motion.div
            className="absolute -top-32 -left-32 w-[320px] h-[320px] md:w-[500px] md:h-[500px] rounded-full blur-[100px]"
            style={{
              background: 'radial-gradient(circle, rgba(255,215,0,0.35) 0%, rgba(255,215,0,0.18) 50%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.75, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Top Right Glow */}
          <motion.div
            className="absolute -top-32 -right-32 w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full blur-[90px]"
            style={{
              background: 'radial-gradient(circle, rgba(255,193,7,0.3) 0%, rgba(255,215,0,0.15) 50%, transparent 70%)',
            }}
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          
          {/* Bottom Center Glow - Near dots */}
          <motion.div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[280px] h-[280px] md:w-[420px] md:h-[420px] rounded-full blur-[100px]"
            style={{
              background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0.15) 40%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.45, 0.65, 0.45],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
          
          {/* Bottom Left Glow */}
          <motion.div
            className="absolute -bottom-32 -left-32 w-[320px] h-[320px] md:w-[480px] md:h-[480px] rounded-full blur-[95px]"
            style={{
              background: 'radial-gradient(circle, rgba(255,235,59,0.25) 0%, rgba(255,215,0,0.12) 50%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.35, 0.6, 0.35],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          
          {/* Bottom Right Glow */}
          <motion.div
            className="absolute -bottom-40 -right-40 w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full blur-[100px]"
            style={{
              background: 'radial-gradient(circle, rgba(255,215,0,0.28) 0%, rgba(255,193,7,0.14) 50%, transparent 70%)',
            }}
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.4, 0.65, 0.4],
            }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
        </div>

        {/* Loader Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* GIF Loader */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-12 relative"
          >
            <img 
              src="/loader.gif" 
              alt="Loading..." 
              className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 object-contain loader-gif"
              onLoad={() => setGifLoaded(true)}
            />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black font-display tracking-[0.2em] leading-none whitespace-nowrap">
              <span className="inline-block text-primary drop-shadow-[0_0_25px_rgba(255,215,0,0.8)]">
                ROAR
              </span>
              <span className="inline-block text-white/40 mx-2 sm:mx-4 text-4xl sm:text-5xl md:text-7xl">&</span>
              <span className="inline-block text-primary drop-shadow-[0_0_25px_rgba(255,215,0,0.8)]">
                RULE
              </span>
            </h1>
          </motion.div>

          {/* Enhanced Loading Dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-3"
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="relative"
                animate={{
                  y: [0, -12, 0],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }}
              >
                <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_15px_rgba(255,215,0,0.8)]" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
