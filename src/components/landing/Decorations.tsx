import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export const NeuralNetwork = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
    <svg width="100%" height="100%" className="absolute inset-0">
      <pattern id="neural-grid" width="100" height="100" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="var(--neon-green)" />
        <path d="M2 2 L100 100 M2 2 L100 2 M2 2 L2 100" stroke="var(--neon-green)" strokeWidth="0.5" strokeOpacity="0.2" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#neural-grid)" />
    </svg>
    <motion.div
      animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
      transition={{ duration: 10, repeat: Infinity }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-green/10 blur-[150px] rounded-full"
    />
  </div>
);

export const ParticleTrail = () => {
  const [particles, setParticles] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    let lastTime = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastTime < 50) return; // throttle to ~20fps
      lastTime = now;
      const id = now;
      setParticles(prev => [...prev.slice(-20), { x: e.clientX, y: e.clientY, id }]);
      setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 1000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1000]">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 0 }}
          style={{
            position: 'absolute', left: p.x, top: p.y,
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: 'var(--neon-green)',
            boxShadow: '0 0 10px var(--neon-green)',
            marginLeft: -4, marginTop: -4,
          }}
        />
      ))}
    </div>
  );
};

