import React, { useState, useRef, useEffect } from 'react';
import { useIDEStore } from '../useIDEStore';

export function GoToLine() {
  const { goToLineOpen, toggleGoToLine, currentTheme, setCursorPosition, activeTabId, openTabs } = useIDEStore();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (goToLineOpen) {
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [goToLineOpen]);

  // Ctrl+G handled in HavenIDE.tsx (global shortcuts)

  if (!goToLineOpen) return null;

  const activeTab = openTabs.find(t => t.id === activeTabId);
  const totalLines = activeTab ? activeTab.content.split('\n').length : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = value.split(':').map(s => parseInt(s.trim()));
    const line = parts[0] || 1;
    const col = parts[1] || 1;
    setCursorPosition(Math.max(1, Math.min(line, totalLines)), Math.max(1, col));
    toggleGoToLine();
  };

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={toggleGoToLine} />
      <div
        className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[400px] rounded-lg shadow-2xl z-50 overflow-hidden"
        style={{ backgroundColor: currentTheme.sidebar, border: `1px solid ${currentTheme.border}` }}
      >
        <form onSubmit={handleSubmit} className="flex items-center px-3 py-2">
          <span className="text-sm mr-2" style={{ color: currentTheme.accent }}>:</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') toggleGoToLine(); }}
            placeholder={`Go to line (1-${totalLines}), or line:column`}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: currentTheme.text }}
          />
        </form>
        <div className="px-3 pb-2 text-xs" style={{ color: currentTheme.textMuted }}>
          Type a line number and press Enter. Use line:col format for column.
        </div>
      </div>
    </>
  );
}
