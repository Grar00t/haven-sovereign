// ══════════════════════════════════════════════════════════════
// RoyalEntrance — The Sovereign Gate of HAVEN
// Dramatic cinematic entrance on first visit. Plays once per session.
// Built by أبو خوارزم — Sulaiman Alshammari — KHAWRIZM
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── Sovereign shield SVG ─────────────────────────────────────
const ShieldLogo = ({ size = 120 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shield-gold" x1="0" y1="0" x2="120" y2="120">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="50%" stopColor="#FFF4B0" />
        <stop offset="100%" stopColor="#FFD700" />
      </linearGradient>
      <filter id="royal-glow">
        <feGaussianBlur stdDeviation="4" />
        <feComposite in2="SourceGraphic" operator="over" />
      </filter>
    </defs>
    {/* Shield outline */}
    <path
      d="M60 8 L105 28 L105 60 C105 88 85 108 60 116 C35 108 15 88 15 60 L15 28 Z"
      fill="none"
      stroke="url(#shield-gold)"
      strokeWidth="2.5"
      filter="url(#royal-glow)"
    />
    {/* Inner glow */}
    <path
      d="M60 16 L98 33 L98 60 C98 84 80 101 60 108 C40 101 22 84 22 60 L22 33 Z"
      fill="rgba(255,215,0,0.06)"
    />
    {/* H letter */}
    <text
      x="60" y="72"
      textAnchor="middle"
      fontFamily="'Space Grotesk', sans-serif"
      fontSize="48"
      fontWeight="700"
      fill="url(#shield-gold)"
      filter="url(#royal-glow)"
    >
      H
    </text>
  </svg>
);

// ── Particle system ──────────────────────────────────────────
const GoldParticle: React.FC<{ delay: number; x: number }> = ({ delay, x }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      width: Math.random() * 3 + 1,
      height: Math.random() * 3 + 1,
      left: `${x}%`,
      bottom: '30%',
      background: `rgba(255,215,0,${Math.random() * 0.6 + 0.2})`,
      boxShadow: '0 0 6px rgba(255,215,0,0.4)',
    }}
    initial={{ opacity: 0, y: 0, scale: 0 }}
    animate={{
      opacity: [0, 0.8, 0],
      y: [0, -200 - Math.random() * 300],
      x: [0, (Math.random() - 0.5) * 100],
      scale: [0, 1, 0.3],
    }}
    transition={{
      duration: 3 + Math.random() * 2,
      delay: delay,
      repeat: Infinity,
      ease: 'easeOut',
    }}
  />
);

// ── Calligraphy line ─────────────────────────────────────────
const CalligraphyLine = ({ width = 200, delay = 0 }: { width?: number; delay?: number }) => (
  <motion.div
    className="h-px mx-auto"
    style={{
      width,
      background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
    }}
    initial={{ scaleX: 0, opacity: 0 }}
    animate={{ scaleX: 1, opacity: 0.6 }}
    transition={{ duration: 1.2, delay, ease: 'easeOut' }}
  />
);

// ── Main Component ───────────────────────────────────────────
export const RoyalEntrance = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState(0);
  const [exiting, setExiting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Phase timeline
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),     // Shield appears
      setTimeout(() => setPhase(2), 1500),    // Title reveals
      setTimeout(() => setPhase(3), 2800),    // Arabic text
      setTimeout(() => setPhase(4), 4200),    // Motto + particles
      setTimeout(() => {                       // Begin exit
        setExiting(true);
        setTimeout(onComplete, 1200);
      }, 6500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Skip on click/key
  const skip = useCallback(() => {
    setExiting(true);
    setTimeout(onComplete, 600);
  }, [onComplete]);

  useEffect(() => {
    const handler = (e: KeyboardEvent | MouseEvent) => {
      if (phase >= 2) skip();
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('click', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('click', handler);
    };
  }, [phase, skip]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
          style={{ background: '#030303' }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        >
          {/* Background radial */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.04) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Vertical gold lines */}
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,215,0,0.15), transparent)' }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />

          {/* Gold particles */}
          <div className="absolute inset-0 pointer-events-none">
            {phase >= 4 && Array.from({ length: 30 }).map((_, i) => (
              <GoldParticle key={i} delay={i * 0.15} x={Math.random() * 100} />
            ))}
          </div>

          {/* ── PHASE 1: Shield ── */}
          {phase >= 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1.2, type: 'spring', damping: 15 }}
              className="relative"
            >
              <ShieldLogo size={140} />
              {/* Pulsing rings */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: '1px solid rgba(255,215,0,0.2)' }}
                animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: '1px solid rgba(255,215,0,0.15)' }}
                animate={{ scale: [1, 3], opacity: [0.3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
              />
            </motion.div>
          )}

          {/* ── PHASE 2: Title ── */}
          {phase >= 2 && (
            <motion.div className="mt-8 text-center">
              <motion.h1
                className="font-display text-6xl sm:text-7xl font-bold tracking-[-0.04em]"
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFF4B0, #FFD700)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: 'none',
                  filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.3))',
                }}
                initial={{ opacity: 0, y: 30, letterSpacing: '0.3em' }}
                animate={{ opacity: 1, y: 0, letterSpacing: '-0.04em' }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                HAVEN
              </motion.h1>

              <CalligraphyLine width={250} delay={0.3} />

              <motion.p
                className="font-mono text-[11px] uppercase tracking-[0.5em] mt-3"
                style={{ color: 'rgba(255,215,0,0.5)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                Sovereign AI Infrastructure
              </motion.p>
            </motion.div>
          )}

          {/* ── PHASE 3: Arabic ── */}
          {phase >= 3 && (
            <motion.div className="mt-10 text-center" dir="rtl">
              <motion.p
                className="font-arabic text-2xl sm:text-3xl font-bold"
                style={{
                  color: 'rgba(255,215,0,0.8)',
                  textShadow: '0 0 20px rgba(255,215,0,0.15)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              >
                الخوارزمية دائماً تعود للوطن
              </motion.p>

              <CalligraphyLine width={180} delay={0.4} />

              <motion.p
                className="font-arabic text-sm mt-3"
                style={{ color: 'rgba(255,215,0,0.35)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                بُنيت بيد سعودية — أبو خوارزم
              </motion.p>
            </motion.div>
          )}

          {/* ── PHASE 4: Bottom motto ── */}
          {phase >= 4 && (
            <motion.div
              className="absolute bottom-12 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p
                className="font-mono text-[9px] uppercase tracking-[0.3em]"
                style={{ color: 'rgba(255,215,0,0.25)' }}
              >
                KHAWRIZM &copy; {new Date().getFullYear()} &mdash; The Algorithm Always Returns Home
              </p>
              <motion.p
                className="font-mono text-[9px] mt-2"
                style={{ color: 'rgba(255,255,255,0.15)' }}
                animate={{ opacity: [0.15, 0.4, 0.15] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                [ click or press any key to enter ]
              </motion.p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
