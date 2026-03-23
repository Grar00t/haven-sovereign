import { useEffect, useRef, type FC } from 'react';
import { motion } from 'motion/react';

/**
 * CursorSpotlight — a global cursor-following radial glow that illuminates the page.
 * Positioned fixed, follows mouse with a smooth trailing effect.
 */
export const CursorSpotlight: FC<{ size?: number; color?: string }> = ({
  size = 600,
  color = 'rgba(0,255,65,0.04)',
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let x = 0, y = 0;
    let currentX = 0, currentY = 0;
    let animFrame: number;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
    };

    const animate = () => {
      currentX += (x - currentX) * 0.08;
      currentY += (y - currentY) * 0.08;
      if (ref.current) {
        ref.current.style.transform = `translate(${currentX - size / 2}px, ${currentY - size / 2}px)`;
      }
      animFrame = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove);
    animFrame = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animFrame);
    };
  }, [size]);

  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 pointer-events-none z-[999]"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        willChange: 'transform',
      }}
    />
  );
};

/**
 * MeshGradient — animated multi-blob background that morphs organically.
 */
export const MeshGradient: FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
    <motion.div
      animate={{
        x: [0, 100, -50, 0],
        y: [0, -80, 60, 0],
        scale: [1, 1.2, 0.9, 1],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] bg-neon-green/[0.03] rounded-full blur-[120px]"
    />
    <motion.div
      animate={{
        x: [0, -70, 80, 0],
        y: [0, 50, -90, 0],
        scale: [1, 0.8, 1.3, 1],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      className="absolute -bottom-1/4 -right-1/4 w-[50%] h-[50%] bg-neon-green/[0.02] rounded-full blur-[140px]"
    />
    <motion.div
      animate={{
        x: [0, 60, -40, 0],
        y: [0, -60, 40, 0],
        scale: [1, 1.1, 0.85, 1],
      }}
      transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      className="absolute top-1/3 left-1/3 w-[40%] h-[40%] bg-neon-green/[0.015] rounded-full blur-[160px]"
    />
  </div>
);
