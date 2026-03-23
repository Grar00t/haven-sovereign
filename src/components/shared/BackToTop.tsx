import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp } from 'lucide-react';

export const BackToTop = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 z-[80] w-11 h-11 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-neon-green hover:border-neon-green/30 transition-colors shadow-lg group"
          aria-label="Back to top"
        >
          <ChevronUp className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_rgba(0,255,0,0.5)]" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
