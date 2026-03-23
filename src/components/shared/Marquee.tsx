import React from 'react';
import { motion } from 'motion/react';

interface Props {
  children: React.ReactNode;
  speed?: number;
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  className?: string;
}

export const Marquee: React.FC<Props> = ({
  children,
  speed = 40,
  direction = 'left',
  pauseOnHover = true,
  className = '',
}) => {
  const dir = direction === 'left' ? '-50%' : '0%';
  const dirStart = direction === 'left' ? '0%' : '-50%';

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div
        className={`inline-flex gap-8 ${pauseOnHover ? 'hover:[animation-play-state:paused]' : ''}`}
        animate={{ x: [dirStart, dir] }}
        transition={{
          x: { repeat: Infinity, repeatType: 'loop', duration: speed, ease: 'linear' },
        }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
};
