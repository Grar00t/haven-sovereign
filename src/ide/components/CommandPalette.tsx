import React, { useState, useEffect, useRef } from 'react';
import { useIDEStore } from '../useIDEStore';
import type { FileNode } from '../types';

function flattenFiles(nodes: FileNode[], path = ''): { node: FileNode; path: string }[] {
  const result: { node: FileNode; path: string }[] = [];
  for (const node of nodes) {
    const currentPath = path ? `${path}/${node.name}` : node.name;
    if (node.type === 'file') result.push({ node, path: currentPath });
    if (node.children) result.push(...flattenFiles(node.children, currentPath));
  }
  return result;
}

export function CommandPalette() {
  const {
    commandPaletteOpen, toggleCommandPalette, currentTheme,
    files, openFile, setTheme, toggleTerminal, toggleSidebar,
    toggleMinimap, toggleAiPanel, toggleSearch,
    toggleZenMode, toggleSettings, toggleGoToLine,
    toggleMarkdownPreview, toggleSplitEditor,
    createTerminal, addNotification,
  } = useIDEStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFileMode = !query.startsWith('>');
  const searchTerm = isFileMode ? query : query.slice(1).trim();

  const allFiles = flattenFiles(files);
  const commands = [
    { id: 'toggle-terminal', label: 'Toggle Terminal', detail: 'Ctrl+`', icon: '🖥️', action: toggleTerminal },
    { id: 'toggle-sidebar', label: 'Toggle Sidebar', detail: 'Ctrl+B', icon: '📁', action: toggleSidebar },
    { id: 'toggle-minimap', label: 'Toggle Minimap', detail: 'Toggle minimap visibility', icon: '🗺️', action: toggleMinimap },
    { id: 'toggle-ai', label: 'Toggle AI Panel', detail: 'Show/hide HAVEN AI', icon: '⚡', action: toggleAiPanel },
    { id: 'toggle-search', label: 'Search in Files', detail: 'Ctrl+Shift+F', icon: '🔍', action: toggleSearch },
    { id: 'zen-mode', label: 'Toggle Zen Mode', detail: 'Ctrl+K', icon: '🧘', action: toggleZenMode },
    { id: 'settings', label: 'Open Settings', detail: 'Ctrl+,', icon: '⚙️', action: toggleSettings },
    { id: 'go-to-line', label: 'Go to Line...', detail: 'Ctrl+G', icon: '↕️', action: toggleGoToLine },
    { id: 'md-preview', label: 'Toggle Markdown Preview', detail: 'Preview .md files', icon: '📝', action: toggleMarkdownPreview },
    { id: 'split-editor', label: 'Split Editor Right', detail: 'Ctrl+\\', icon: '⬜', action: toggleSplitEditor },
    { id: 'new-terminal', label: 'Create New Terminal', detail: 'Ctrl+Shift+`', icon: '➕', action: () => createTerminal() },
    // Themes — 10 total
    { id: 'theme-haven', label: 'Theme: Haven Dark', detail: 'Switch theme', icon: '🎨', action: () => setTheme('haven-dark') },
    { id: 'theme-gold', label: 'Theme: Sovereign Gold', detail: 'Switch theme', icon: '👑', action: () => setTheme('sovereign-gold') },
    { id: 'theme-dragon', label: 'Theme: Dragon 403', detail: 'Switch theme', icon: '🐉', action: () => setTheme('dragon-403') },
    { id: 'theme-monokai', label: 'Theme: Monokai Pro', detail: 'Switch theme', icon: '🎨', action: () => setTheme('monokai-pro') },
    { id: 'theme-onedark', label: 'Theme: One Dark Pro', detail: 'Switch theme', icon: '🎨', action: () => setTheme('one-dark-pro') },
    { id: 'theme-catppuccin', label: 'Theme: Catppuccin Mocha', detail: 'Switch theme', icon: '🐱', action: () => setTheme('catppuccin-mocha') },
    { id: 'theme-tokyo', label: 'Theme: Tokyo Night', detail: 'Switch theme', icon: '🌃', action: () => setTheme('tokyo-night') },
    { id: 'theme-github', label: 'Theme: GitHub Dark', detail: 'Switch theme', icon: '🐙', action: () => setTheme('github-dark') },
    { id: 'theme-nord', label: 'Theme: Nord', detail: 'Switch theme', icon: '❄️', action: () => setTheme('nord') },
    { id: 'theme-dracula', label: 'Theme: Dracula', detail: 'Switch theme', icon: '🧛', action: () => setTheme('dracula') },
    // Actions
    { id: 'open-folder', label: 'Open Folder', detail: 'Open real folder from disk', icon: '📂', action: () => useIDEStore.getState().openRealFolder() },
    { id: 'save-file', label: 'Save File', detail: 'Ctrl+S', icon: '💾', action: () => { const s = useIDEStore.getState(); if (s.activeTabId) s.saveFile(s.activeTabId); } },
    { id: 'save-all', label: 'Save All Files', detail: 'Ctrl+Shift+S', icon: '💾', action: () => useIDEStore.getState().saveAllFiles() },
    { id: 'close-tab', label: 'Close Active Tab', detail: 'Ctrl+W', icon: '✕', action: () => { const s = useIDEStore.getState(); if (s.activeTabId) s.closeTab(s.activeTabId); } },
    { id: 'close-all', label: 'Close All Tabs', detail: 'Close all open editors', icon: '✕', action: () => useIDEStore.getState().closeAllTabs() },
    { id: 'explorer-panel', label: 'Show Explorer', detail: 'File tree', icon: '📁', action: () => useIDEStore.getState().setActiveSidebarPanel('explorer') },
    { id: 'git-panel', label: 'Show Source Control', detail: 'Git panel', icon: '🔀', action: () => useIDEStore.getState().setActiveSidebarPanel('git') },
    { id: 'extensions-panel', label: 'Show Extensions', detail: 'Marketplace', icon: '🧩', action: () => useIDEStore.getState().setActiveSidebarPanel('extensions') },
    { id: 'outline-panel', label: 'Show Outline', detail: 'Code symbols', icon: '🏗️', action: () => useIDEStore.getState().setActiveSidebarPanel('outline') },
    { id: 'keyboard', label: 'Keyboard Shortcuts', detail: 'Ctrl+Shift+K', icon: '⌨️', action: () => addNotification({ type: 'info', message: 'Press Ctrl+Shift+K to open Keyboard Shortcuts panel' }) },
  ];

  type Item = { id: string; label: string; detail: string; icon?: string; action: () => void };

  let items: Item[];
  if (isFileMode) {
    items = allFiles
      .filter((f) => f.path.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((f) => ({ id: f.node.id, label: f.node.name, detail: f.path, action: () => openFile(f.node, f.path) }));
  } else {
    items = commands.filter(
      (c) => c.label.toLowerCase().includes(searchTerm.toLowerCase()) || c.detail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  useEffect(() => {
    setQuery('');
    setSelectedIndex(0);
    if (commandPaletteOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [commandPaletteOpen]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') { e.preventDefault(); toggleCommandPalette(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p' && !e.shiftKey) { e.preventDefault(); toggleCommandPalette(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette]);

  if (!commandPaletteOpen) return null;

  const handleSelect = (item: Item) => { item.action(); toggleCommandPalette(); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((prev) => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (items[selectedIndex]) handleSelect(items[selectedIndex]); }
    else if (e.key === 'Escape') { toggleCommandPalette(); }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={toggleCommandPalette} />
      <div
        className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[560px] max-h-[400px] rounded-lg shadow-2xl z-50 overflow-hidden"
        style={{ backgroundColor: currentTheme.sidebar, border: `1px solid ${currentTheme.border}` }}
      >
        <div className="flex items-center px-3 border-b" style={{ borderColor: currentTheme.border }}>
          <span className="text-sm mr-2" style={{ color: currentTheme.accent }}>⚡</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isFileMode ? 'Search files... (type > for commands)' : 'Type a command...'}
            className="flex-1 bg-transparent outline-none py-2.5 text-sm"
            style={{ color: currentTheme.text }}
          />
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: currentTheme.border, color: currentTheme.textMuted }}>
            Esc
          </span>
        </div>
        <div className="overflow-y-auto max-h-[300px]">
          {items.length === 0 && (
            <div className="px-4 py-6 text-center text-sm" style={{ color: currentTheme.textMuted }}>
              No results found
            </div>
          )}
          {items.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer text-sm"
              style={{ backgroundColor: i === selectedIndex ? currentTheme.selection : 'transparent', color: currentTheme.text }}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              {item.icon && <span className="text-sm">{item.icon}</span>}
              <span className="truncate flex-1">{item.label}</span>
              <span className="text-xs truncate" style={{ color: currentTheme.textMuted }}>{item.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
