import { useEffect, useState, useMemo, type FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ghost } from 'lucide-react';

const MatrixColumn: FC<{ index: number; total: number }> = ({ index, total }) => {
  const chars = useMemo(() => {
    const pool = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي0123456789HAVEN';
    return Array.from({ length: 12 }, () => pool[Math.floor(Math.random() * pool.length)]);
  }, []);

  return (
    <motion.div
      className="absolute text-[10px] font-mono text-neon-green/30 leading-[1.4] select-none pointer-events-none"
      style={{ left: `${(index / total) * 100}%` }}
      initial={{ y: -200, opacity: 0 }}
      animate={{ y: '100vh', opacity: [0, 0.6, 0] }}
      transition={{ duration: 3 + Math.random() * 3, delay: Math.random() * 2, repeat: Infinity, ease: 'linear' }}
    >
      {chars.map((c, i) => (
        <div key={i} style={{ opacity: 1 - i * 0.08 }}>{c}</div>
      ))}
    </motion.div>
  );
};

export const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  const phases = [
    'Initializing Neural Network...',
    'Loading Sovereign Protocols...',
    'Establishing Mesh Connection...',
    'Calibrating Niyah Logic...',
    'System Ready.',
  ];

  const columnCount = 30;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 15 + 5;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 600);
          return 100;
        }
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    if (progress < 20) setPhase(0);
    else if (progress < 40) setPhase(1);
    else if (progress < 60) setPhase(2);
    else if (progress < 85) setPhase(3);
    else setPhase(4);
  }, [progress]);

  return (
    <AnimatePresence>
      <motion.div
        exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 z-[9999] bg-haven-black flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Matrix Rain */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: columnCount }).map((_, i) => (
            <MatrixColumn key={i} index={i} total={columnCount} />
          ))}
        </div>

        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-green/10 blur-[180px] rounded-full"
          />
        </div>

        {/* Ghost logo */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative mb-12 z-10"
        >
          <div className="w-24 h-24 bg-neon-green/20 rounded-3xl flex items-center justify-center border border-neon-green/30 backdrop-blur-xl shadow-[0_0_40px_rgba(0,255,0,0.15)]">
            <Ghost className="w-12 h-12 text-neon-green drop-shadow-[0_0_20px_rgba(0,255,0,0.5)]" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 border-2 border-neon-green/30 rounded-3xl"
          />
          <motion.div
            animate={{ scale: [1, 2, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            className="absolute inset-0 border border-neon-green/20 rounded-3xl"
          />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tighter mb-2 font-display z-10"
        >
          HAVEN
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[10px] font-mono text-neon-green uppercase tracking-[0.4em] mb-12 z-10"
        >
          Sovereign AI Infrastructure
        </motion.p>

        {/* Progress bar */}
        <div className="w-72 h-1 bg-white/5 rounded-full overflow-hidden mb-4 z-10">
          <motion.div
            className="h-full bg-neon-green rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.3 }}
            style={{ boxShadow: '0 0 15px rgba(0,255,0,0.4)' }}
          />
        </div>

        {/* Phase text */}
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-mono text-white/40 uppercase tracking-widest z-10"
        >
          {phases[phase]}
        </motion.p>

        {/* Progress percentage */}
        <p className="text-[10px] font-mono text-white/20 mt-2 z-10">{Math.floor(Math.min(progress, 100))}%</p>
      </motion.div>
    </AnimatePresence>
  );
};
