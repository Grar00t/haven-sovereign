import { useEffect, useState } from 'react';

export function useScrollSpy(ids: string[], offset = 100) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + offset;
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i]);
        if (el && el.offsetTop <= y) { setActiveId(ids[i]); return; }
      }
      setActiveId('');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [ids, offset]);

  return activeId;
}
