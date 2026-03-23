import React, { useState, useEffect } from 'react';
import { useIDEStore } from '../useIDEStore';

const SHORTCUTS = [
  { category: 'General', shortcuts: [
    { keys: 'Ctrl+Shift+P', description: 'Command Palette' },
    { keys: 'Ctrl+P', description: 'Quick Open File' },
    { keys: 'Ctrl+,', description: 'Open Settings' },
    { keys: 'Ctrl+K', description: 'Toggle Zen Mode' },
    { keys: 'Ctrl+B', description: 'Toggle Sidebar' },
    { keys: 'Ctrl+`', description: 'Toggle Terminal' },
    { keys: 'Ctrl+\\', description: 'Split Editor' },
  ]},
  { category: 'File', shortcuts: [
    { keys: 'Ctrl+S', description: 'Save File' },
    { keys: 'Ctrl+Shift+S', description: 'Save All Files' },
    { keys: 'Ctrl+N', description: 'New File' },
    { keys: 'Ctrl+O', description: 'Open Folder' },
    { keys: 'Ctrl+W', description: 'Close Tab' },
  ]},
  { category: 'Editor', shortcuts: [
    { keys: 'Ctrl+G', description: 'Go to Line' },
    { keys: 'Ctrl+D', description: 'Select Next Occurrence' },
    { keys: 'Ctrl+Shift+L', description: 'Select All Occurrences' },
    { keys: 'Alt+↑/↓', description: 'Move Line Up/Down' },
    { keys: 'Ctrl+Shift+K', description: 'Delete Line' },
    { keys: 'Ctrl+/', description: 'Toggle Comment' },
    { keys: 'Ctrl+]', description: 'Indent Line' },
    { keys: 'Ctrl+[', description: 'Outdent Line' },
    { keys: 'Ctrl+H', description: 'Find and Replace' },
    { keys: 'Ctrl+F', description: 'Find in File' },
  ]},
  { category: 'Navigation', shortcuts: [
    { keys: 'Ctrl+Shift+F', description: 'Search in Files' },
    { keys: 'Ctrl+Tab', description: 'Switch Tab' },
    { keys: 'Ctrl+1-9', description: 'Switch to Tab N' },
    { keys: 'F12', description: 'Go to Definition' },
    { keys: 'Alt+←/→', description: 'Navigate Back/Forward' },
  ]},
  { category: 'Terminal', shortcuts: [
    { keys: 'Ctrl+Shift+`', description: 'New Terminal' },
    { keys: 'Ctrl+Shift+C', description: 'Copy Selection' },
    { keys: 'Ctrl+Shift+V', description: 'Paste' },
  ]},
];

export function KeyboardShortcuts() {
  const { currentTheme } = useIDEStore();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k' && e.shiftKey) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!open) return null;

  const filteredSections = SHORTCUTS.map(section => ({
    ...section,
    shortcuts: section.shortcuts.filter(s =>
      s.keys.toLowerCase().includes(filter.toLowerCase()) ||
      s.description.toLowerCase().includes(filter.toLowerCase())
    ),
  })).filter(s => s.shortcuts.length > 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setOpen(false)} />
      <div
        className="fixed top-[8%] left-1/2 -translate-x-1/2 w-[640px] max-h-[80vh] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
        style={{ backgroundColor: currentTheme.sidebar, border: `1px solid ${currentTheme.border}` }}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: currentTheme.border }}>
          <div className="flex items-center gap-2">
            <span style={{ color: currentTheme.accent }}>⌨️</span>
            <span className="text-sm font-semibold" style={{ color: currentTheme.text }}>Keyboard Shortcuts</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-xs opacity-40 hover:opacity-80 px-2 py-0.5 rounded"
            style={{ backgroundColor: currentTheme.border, color: currentTheme.text }}>Esc</button>
        </div>

        {/* Search */}
        <div className="px-5 py-2 border-b" style={{ borderColor: currentTheme.border }}>
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Type to search shortcuts..."
            className="w-full bg-transparent outline-none text-sm"
            style={{ color: currentTheme.text }}
            autoFocus
          />
        </div>

        {/* Shortcuts list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {filteredSections.map(section => (
            <div key={section.category}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: currentTheme.accent }}>{section.category}</div>
              <div className="space-y-1">
                {section.shortcuts.map(s => (
                  <div key={s.keys} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/5 text-sm">
                    <span style={{ color: currentTheme.text }}>{s.description}</span>
                    <kbd className="px-2 py-0.5 rounded text-xs font-mono"
                      style={{ backgroundColor: currentTheme.border, color: currentTheme.accent }}>{s.keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-2 border-t text-xs text-center" style={{ borderColor: currentTheme.border, color: currentTheme.textMuted }}>
          Press <kbd className="px-1 rounded" style={{ backgroundColor: currentTheme.border }}>Ctrl+Shift+K</kbd> to toggle
        </div>
      </div>
    </>
  );
}
