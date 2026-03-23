import { useRef, useCallback, useState, type MouseEvent } from 'react';

interface GlowPosition {
  x: number;
  y: number;
  visible: boolean;
}

export function useMouseGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [glow, setGlow] = useState<GlowPosition>({ x: 0, y: 0, visible: false });

  const onMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setGlow({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  }, []);

  const onLeave = useCallback(() => {
    setGlow((prev) => ({ ...prev, visible: false }));
  }, []);

  return { ref, glow, onMove, onLeave };
}
