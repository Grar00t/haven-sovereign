import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[999] origin-left"
      style={{
        scaleX: progress / 100,
        background: 'linear-gradient(90deg, var(--neon-green), #00ff88)',
        boxShadow: '0 0 10px var(--neon-green)',
      }}
    />
  );
};
