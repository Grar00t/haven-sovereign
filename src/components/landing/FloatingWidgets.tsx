import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ghost, Sparkles, Terminal, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { InteractiveTerminal } from '../shared/InteractiveTerminal';

export const FloatingWidgets = () => {
  const { isSovereign, toggleSovereign, terminalOpen, setTerminalOpen } = useStore();
  const [showOverlay, setShowOverlay] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    if (isSovereign) {
      document.documentElement.style.setProperty('--neon-green', '#FFD700');
      document.body.classList.add('sovereign-theme');
      setShowOverlay(true);
      setTimeout(() => setShowOverlay(false), 3000);
    } else {
      document.documentElement.style.setProperty('--neon-green', '#00FF00');
      document.body.classList.remove('sovereign-theme');
    }
  }, [isSovereign]);

  return (
    <>
      {/* Sovereign Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] pointer-events-none bg-yellow-500/5 backdrop-blur-[2px]" />
            <motion.div initial={{ opacity: 0, scale: 0.5, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5, y: 50 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2001] pointer-events-none text-center">
              <div className="text-6xl md:text-8xl font-black text-yellow-500 mb-4 tracking-tighter drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]">ROYAL MODE</div>
              <div className="text-xl md:text-2xl text-yellow-500/80 font-mono uppercase tracking-[0.5em]">Neural Sovereignty Activated</div>
              <div className="mt-8 text-2xl text-white font-bold">"من الرماد ينهض العنقاء" 🇸🇦</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Haven widget */}
      <motion.div drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-10 right-10 z-[100] cursor-grab active:cursor-grabbing hidden lg:block">
        <div className={cn("glass p-4 rounded-2xl w-64 shadow-2xl border-neon-green/30 relative overflow-hidden transition-all duration-500",
          isSovereign && "border-yellow-500/50 shadow-yellow-500/20")}>
          <div className={cn("absolute top-0 left-0 w-full h-1 bg-neon-green/50 transition-colors duration-500", isSovereign && "bg-yellow-500/50")} />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Ghost className="w-4 h-4 text-neon-green transition-colors duration-500" />
              <span className="text-[10px] font-bold tracking-tighter uppercase">Haven: Magical Companion</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-neon-green animate-pulse transition-colors duration-500" />
              <div className={cn("w-2 h-2 rounded-full animate-pulse transition-colors duration-500", isSovereign ? "bg-yellow-500" : "bg-neon-green")} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div initial={{ width: "0%" }} animate={{ width: "65%" }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                className="h-full bg-neon-green/40 transition-colors duration-500" />
            </div>
            <div className="text-[9px] font-mono text-white/40">
              CONTEXT: LOSSLESS ACTIVE <br />MODEL: HAVEN-405B [ARSENAL] <br />
              STATUS: {isSovereign ? 'ROYAL SOVEREIGN' : 'SOVEREIGN'}
            </div>
          </div>
          <button onClick={toggleSovereign}
            className={cn("mt-4 w-full py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border border-white/5",
              isSovereign ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" : "bg-white/5 hover:bg-white/10")}>
            {isSovereign ? 'Deactivate Royal Mode' : 'Activate Royal Mode'}
          </button>
        </div>
        <div className="absolute -top-2 -right-2 bg-neon-green text-black text-[8px] font-bold px-1.5 py-0.5 rounded uppercase transition-colors duration-500">Ghost Mode</div>
      </motion.div>

      {/* Terminal */}
      <div className="fixed bottom-32 right-10 z-[90]">
        <AnimatePresence>
          {terminalOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-[420px] h-[340px] mb-4 shadow-2xl"
            >
              <InteractiveTerminal className="w-full h-full" />
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setTerminalOpen(!terminalOpen)}
          className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-xl border border-neon-green/30 flex items-center justify-center text-neon-green hover:scale-110 transition-transform shadow-lg">
          <Terminal className="w-5 h-5" />
        </button>
      </div>

      {/* Ghost Video Bubble */}
      <div className="fixed bottom-10 left-10 z-[100] flex flex-col items-start gap-4 pointer-events-none">
        <AnimatePresence>
          {videoOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.5, y: 50, x: -50 }} animate={{ opacity: 1, scale: 1, y: 0, x: 0 }} exit={{ opacity: 0, scale: 0.5, y: 50, x: -50 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="glass p-2 rounded-3xl shadow-2xl border-neon-green/30 w-[320px] md:w-[480px] aspect-video overflow-hidden pointer-events-auto">
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black">
                <iframe src="https://www.youtube.com/embed/bMIIC9FYpJM?autoplay=1" title="HAVEN Magical Preview"
                  className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                <button onClick={() => setVideoOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-red-500/50 rounded-full text-white backdrop-blur-md transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div drag dragConstraints={{ left: 0, right: 100, top: -500, bottom: 0 }}
          whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9, rotate: -5 }}
          onClick={() => setVideoOpen(!videoOpen)}
          className="w-16 h-16 bg-neon-green/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-neon-green/30 shadow-[0_0_30px_rgba(0,255,0,0.2)] cursor-pointer pointer-events-auto relative group">
          <div className="absolute -top-12 left-0 bg-neon-green text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Watch Magic ✨</div>
          <Ghost className="text-neon-green w-8 h-8 drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]" />
          <div className="absolute inset-0 rounded-full border-2 border-neon-green animate-ping opacity-20" />
        </motion.div>
      </div>
    </>
  );
};
