import React from 'react';
import { motion } from 'motion/react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'fade';

interface Props {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
}

const offsets: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 60 },
  down: { y: -60 },
  left: { x: 60 },
  right: { x: -60 },
  fade: {},
};

export const ScrollReveal: React.FC<Props> = ({ children, direction = 'up', delay = 0, duration = 0.6, className }) => {
  const offset = offsets[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
