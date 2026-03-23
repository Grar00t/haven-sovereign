import React from 'react';
import { motion } from 'motion/react';
import { useMouseGlow } from '../../hooks/useMouseGlow';

interface Props {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  glowSize?: number;
}

export const GlowCard: React.FC<Props> = ({ children, className = '', glowColor = 'rgba(0,255,0,0.15)', glowSize = 300 }) => {
  const { ref, glow, onMove, onLeave } = useMouseGlow();

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative overflow-hidden ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {/* Glow */}
      {glow.visible && (
        <div
          className="pointer-events-none absolute z-0 transition-opacity duration-300"
          style={{
            left: glow.x - glowSize / 2,
            top: glow.y - glowSize / 2,
            width: glowSize,
            height: glowSize,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            opacity: glow.visible ? 1 : 0,
          }}
        />
      )}
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
