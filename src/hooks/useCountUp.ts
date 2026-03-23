import { useEffect, useState } from 'react';

export function useCountUp(end: number, duration = 2000, enabled = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) { setCount(0); return; }

    let start: number | null = null;
    let frame: number;

    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.floor(end * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [end, duration, enabled]);

  return count;
}
