import { motion } from 'motion/react';

interface Props {
  className?: string;
  columns?: number;
  rows?: number;
}

export const GridPattern = ({ className = '', columns = 40, rows = 20 }: Props) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg width="100%" height="100%" className="opacity-[0.03]">
        <defs>
          <pattern id="haven-grid" width={100 / columns * columns} height={100 / rows * rows} patternUnits="userSpaceOnUse"
            x="0" y="0">
            {Array.from({ length: columns * rows }).map((_, i) => {
              const col = i % columns;
              const row = Math.floor(i / columns);
              return (
                <circle
                  key={i}
                  cx={col * (100 / columns) + 50 / columns}
                  cy={row * (100 / rows) + 50 / rows}
                  r="1"
                  fill="var(--neon-green)"
                />
              );
            })}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#haven-grid)" />
      </svg>
      {/* Animated spotlight over grid */}
      <motion.div
        animate={{
          x: ['-20%', '120%'],
          y: ['0%', '60%', '0%'],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0,255,0,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
};
