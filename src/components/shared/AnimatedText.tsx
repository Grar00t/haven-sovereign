import React from 'react';
import { motion } from 'motion/react';

interface Props {
  text: string;
  className?: string;
  delay?: number;
  staggerChildren?: number;
  mode?: 'letter' | 'word';
}

export const AnimatedText: React.FC<Props> = ({
  text,
  className = '',
  delay = 0,
  staggerChildren = 0.03,
  mode = 'letter',
}) => {
  const items = mode === 'letter' ? text.split('') : text.split(' ');

  return (
    <motion.span
      className={`inline-flex flex-wrap ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ staggerChildren, delayChildren: delay }}
    >
      {items.map((item, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
            visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
          }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="inline-block"
        >
          {item}
          {mode === 'word' && '\u00A0'}
        </motion.span>
      ))}
    </motion.span>
  );
};
