import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useIDEStore } from './useIDEStore';
import { ActivityBar } from './components/ActivityBar';
import { FileExplorer } from './components/FileExplorer';
import { TabBar } from './components/TabBar';
import { CodeEditor } from './components/CodeEditor';
import { Terminal } from './components/Terminal';
import { StatusBar } from './components/StatusBar';
import { CommandPalette } from './components/CommandPalette';
import { AIPanel } from './components/AIPanel';
import { Zap } from 'lucide-react';
import { SearchPanel } from './components/SearchPanel';
import { Breadcrumbs } from './components/Breadcrumbs';
import { NotificationCenter } from './components/NotificationCenter';
import { SettingsEditor } from './components/SettingsEditor';
import { GitPanel } from './components/GitPanel';
import { GoToLine } from './components/GoToLine';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { ExtensionsPanel } from './components/ExtensionsPanel';
import { OutlinePanel } from './components/OutlinePanel';
import { NiyahPanel } from './components/NiyahPanel';
import { ToolsPanel } from './components/ToolsPanel';
import { SovereignDashboard } from './components/SovereignDashboard';
import { sovereignTauri } from './engine/SovereignTauri';
import { DEFAULT_WORKSPACE_NAME } from './store/constants';
import Editor from '@monaco-editor/react';

export function HavenIDE() {
  const {
    currentTheme, sidebarVisible, terminalVisible, aiPanelVisible,
    activeSidebarPanel, toggleCommandPalette, toggleTerminal, toggleSidebar,
    zenMode, toggleZenMode, settingsOpen, toggleSettings,
    sidebarWidth, setSidebarWidth, terminalHeight, setTerminalHeight,
    toggleGoToLine, addNotification, saveFile, saveAllFiles, activeTabId,
    restoreFromIDB, importDroppedItems, openRealFolder,
    splitEditorActive, openTabs, updateTabContent,
  } = useIDEStore();

  // Auto-save
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bootNotifiedRef = useRef(false);
  useEffect(() => {
    const autoSaveSetting = useIDEStore.getState().getSetting('files.autoSave');
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    if (autoSaveSetting === 'afterDelay') {
      autoSaveRef.current = setInterval(() => {
        const s = useIDEStore.getState();
        const modified = s.openTabs.filter(t => t.isModified);
        modified.forEach(t => s.saveFile(t.id));
      }, 3000);
    }
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, []);  // re-run on mount

  // Sidebar resize
  const sidebarResizeRef = useRef<boolean>(false);
  const terminalResizeRef = useRef<boolean>(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (sidebarResizeRef.current) {
      setSidebarWidth(e.clientX - 48); // 48 = activity bar width
    }
    if (terminalResizeRef.current) {
      const height = window.innerHeight - e.clientY - 24; // 24 = status bar
      setTerminalHeight(height);
    }
  }, [setSidebarWidth, setTerminalHeight]);

  const handleMouseUp = useCallback(() => {
    sidebarResizeRef.current = false;
    terminalResizeRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '`') { e.preventDefault(); toggleTerminal(); }
      if (e.ctrlKey && e.key === 'b') { e.preventDefault(); toggleSidebar(); }
      if (e.ctrlKey && e.key === 'k' && !e.shiftKey) { e.preventDefault(); toggleZenMode(); }
      if (e.ctrlKey && e.key === ',') { e.preventDefault(); toggleSettings(); }
      if (e.ctrlKey && e.key === 'g') { e.preventDefault(); toggleGoToLine(); }
      // Real Ctrl+S — save to disk or IDB
      if (e.ctrlKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        if (activeTabId) saveFile(activeTabId);
      }
      // Ctrl+Shift+S — save all
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        saveAllFiles();
      }
    };


    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTerminal, toggleSidebar, toggleZenMode, toggleSettings, toggleGoToLine, saveFile, saveAllFiles, activeTabId]);

  // Restore previous session from IndexedDB
  useEffect(() => {
    restoreFromIDB();
    if (!bootNotifiedRef.current) {
      bootNotifiedRef.current = true;
      addNotification({ type: 'success', message: 'HAVEN IDE v5.0 loaded — Sovereign Edition' });
    }
  }, [addNotification, restoreFromIDB]);

  const installPendingUpdate = useCallback(async () => {
    addNotification({
      type: 'info',
      message: 'Installing desktop update...',
      detail: 'Windows may briefly close HAVEN to complete the installer.',
    });

    try {
      const result = await sovereignTauri.installAppUpdate();
      addNotification({
        type: result.installed ? 'success' : 'warning',
        message: result.installed ? 'Desktop update installed' : 'Desktop update was not installed',
        detail: result.detail,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      addNotification({
        type: 'error',
        message: 'Desktop update installation failed',
        detail,
      });
    }
  }, [addNotification]);

  const checkForDesktopUpdates = useCallback(async (announceWhenCurrent = false) => {
    const status = await sovereignTauri.getUpdaterStatus();

    if (!status.configured) {
      if (announceWhenCurrent) {
        addNotification({
          type: 'warning',
          message: 'Desktop updates are not configured yet',
          detail: 'Set HAVEN_UPDATER_ENDPOINTS and HAVEN_UPDATER_PUBKEY before publishing releases.',
        });
      }
      return;
    }

    const update = await sovereignTauri.checkForAppUpdate();

    if (!update.configured) {
      if (announceWhenCurrent) {
        addNotification({
          type: 'warning',
          message: 'Desktop updater is disabled',
          detail: update.notes || 'No updater endpoint is configured for this build.',
        });
      }
      return;
    }

    if (update.available && update.version) {
      addNotification({
        type: 'info',
        message: `Desktop update available: v${update.version}`,
        detail: update.notes || `Current version: v${update.currentVersion}`,
        actions: [
          {
            label: 'Install now',
            action: () => { void installPendingUpdate(); },
          },
        ],
      });
      return;
    }

    if (announceWhenCurrent) {
      addNotification({
        type: 'success',
        message: `HAVEN is up to date (v${update.currentVersion})`,
        detail: `Update channel: ${status.channel}`,
      });
    }
  }, [addNotification, installPendingUpdate]);

  useEffect(() => {
    void checkForDesktopUpdates(false);
  }, [checkForDesktopUpdates]);

  // Drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.items.length > 0) {
      await importDroppedItems(e.dataTransfer.items);
    }
  }, [importDroppedItems]);

  const showSidebar = sidebarVisible && !zenMode;

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden relative"
      style={{
        backgroundColor: currentTheme.bg,
        color: currentTheme.text,
        fontFamily: "'Inter', 'JetBrains Mono', sans-serif",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag-and-drop overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none"
          style={{ backgroundColor: currentTheme.bg + 'e0', border: `3px dashed ${currentTheme.accent}` }}>
          <div className="text-center">
            <div className="text-5xl mb-4" style={{ color: currentTheme.accent, opacity: 0.6 }}>↓</div>
            <p className="text-xl font-bold" style={{ color: currentTheme.accent }}>Drop files or folders here</p>
            <p className="text-sm mt-1" style={{ color: currentTheme.textMuted }}>They'll be imported into the project</p>
          </div>
        </div>
      )}
      {/* Title Bar */}
      {!zenMode && <TitleBar onCheckForUpdates={() => { void checkForDesktopUpdates(true); }} />}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        {!zenMode && <ActivityBar />}

        {/* Sidebar */}
        {showSidebar && (
          <>
            {activeSidebarPanel === 'explorer' && <FileExplorer />}
            {activeSidebarPanel === 'search' && <SearchPanel />}
            {activeSidebarPanel === 'git' && <GitPanel />}
            {activeSidebarPanel === 'extensions' && <ExtensionsPanel />}
            {activeSidebarPanel === 'outline' && <OutlinePanel />}
            {activeSidebarPanel === 'niyah' && <NiyahPanel />}
            {activeSidebarPanel === 'dashboard' && <SovereignDashboard />}
            {activeSidebarPanel === 'tools' && <ToolsPanel />}

            {/* Sidebar resize handle */}
            <div
              className="w-[3px] cursor-col-resize hover:bg-opacity-100 transition-colors"
              style={{ backgroundColor: 'transparent' }}
              onMouseDown={(e) => {
                e.preventDefault();
                sidebarResizeRef.current = true;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = currentTheme.accent + '60'; }}
              onMouseLeave={(e) => { if (!sidebarResizeRef.current) (e.target as HTMLElement).style.backgroundColor = 'transparent'; }}
            />
          </>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {settingsOpen ? (
            <SettingsEditor />
          ) : (
            <>
              <TabBar />
              <Breadcrumbs />
              <div className="flex-1 flex overflow-hidden">
                <CodeEditor />
                {splitEditorActive && (
                  <>
                    <div className="w-[1px] shrink-0" style={{ backgroundColor: currentTheme.border }} />
                    <SplitEditor />
                  </>
                )}
              </div>
            </>
          )}

          {/* Terminal with resize handle */}
          {terminalVisible && !zenMode && (
            <>
              <div
                className="h-[3px] cursor-row-resize hover:bg-opacity-100 transition-colors shrink-0"
                style={{ backgroundColor: 'transparent' }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  terminalResizeRef.current = true;
                  document.body.style.cursor = 'row-resize';
                  document.body.style.userSelect = 'none';
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = currentTheme.accent + '60'; }}
                onMouseLeave={(e) => { if (!terminalResizeRef.current) (e.target as HTMLElement).style.backgroundColor = 'transparent'; }}
              />
              <Terminal />
            </>
          )}
        </div>

        {/* AI Panel */}
        {aiPanelVisible && !zenMode && <AIPanel />}
      </div>

      {/* Status Bar */}
      {!zenMode && <StatusBar />}

      {/* === Floating overlays === */}
      <CommandPalette />
      <GoToLine />
      <NotificationCenter />
      <KeyboardShortcuts />

      {/* Zen mode escape hint */}
      {zenMode && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 text-xs px-3 py-1 rounded-full animate-pulse"
          style={{ backgroundColor: currentTheme.accent + '20', color: currentTheme.accent }}>
          Zen Mode — Press Ctrl+K to exit
        </div>
      )}
    </div>
  );
}

function TitleBar({ onCheckForUpdates }: { onCheckForUpdates: () => void }) {
  const { currentTheme, breadcrumbs, openRealFolder, saveAllFiles, isRealFS } = useIDEStore();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menus: Record<string, { label: string; action?: () => void; shortcut?: string; divider?: boolean }[]> = {
    File: [
      { label: 'Open Folder...', action: openRealFolder, shortcut: '' },
      { label: '', divider: true },
      { label: 'Save', action: () => { const s = useIDEStore.getState(); if (s.activeTabId) s.saveFile(s.activeTabId); }, shortcut: 'Ctrl+S' },
      { label: 'Save All', action: saveAllFiles, shortcut: 'Ctrl+Shift+S' },
      { label: '', divider: true },
      { label: 'Settings', action: () => useIDEStore.getState().toggleSettings(), shortcut: 'Ctrl+,' },
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z' },
      { label: 'Redo', shortcut: 'Ctrl+Shift+Z' },
      { label: '', divider: true },
      { label: 'Find in Files', action: () => useIDEStore.getState().setActiveSidebarPanel('search'), shortcut: 'Ctrl+Shift+F' },
    ],
    View: [
      { label: 'Explorer', action: () => useIDEStore.getState().setActiveSidebarPanel('explorer') },
      { label: 'Search', action: () => useIDEStore.getState().setActiveSidebarPanel('search') },
      { label: 'Source Control', action: () => useIDEStore.getState().setActiveSidebarPanel('git') },
      { label: 'Extensions', action: () => useIDEStore.getState().setActiveSidebarPanel('extensions') },
      { label: 'Outline', action: () => useIDEStore.getState().setActiveSidebarPanel('outline') },
      { label: 'Niyah Engine', action: () => useIDEStore.getState().setActiveSidebarPanel('niyah') },
      { label: '', divider: true },
      { label: 'Terminal', action: () => useIDEStore.getState().toggleTerminal(), shortcut: 'Ctrl+`' },
      { label: 'Split Editor', action: () => useIDEStore.getState().toggleSplitEditor(), shortcut: 'Ctrl+\\' },
      { label: 'Zen Mode', action: () => useIDEStore.getState().toggleZenMode(), shortcut: 'Ctrl+K' },
      { label: '', divider: true },
      { label: 'Keyboard Shortcuts', shortcut: 'Ctrl+Shift+K' },
    ],
    Go: [
      { label: 'Go to Line...', action: () => useIDEStore.getState().toggleGoToLine(), shortcut: 'Ctrl+G' },
      { label: 'Go to File...', action: () => useIDEStore.getState().toggleCommandPalette(), shortcut: 'Ctrl+P' },
      { label: 'Go to Symbol...', action: () => useIDEStore.getState().setActiveSidebarPanel('outline') },
    ],
    Run: [
      { label: 'Run Without Debugging', shortcut: 'Ctrl+F5' },
      { label: 'Start Debugging', shortcut: 'F5' },
      { label: '', divider: true },
      { label: 'Configure...', action: () => useIDEStore.getState().addNotification({ type: 'info', message: 'Create launch.json in .vscode folder to configure debugging' }) },
    ],
    Help: [
      { label: 'About HAVEN IDE', action: () => useIDEStore.getState().addNotification({ type: 'info', message: 'HAVEN IDE v5.0 — Sovereign Edition\nBuilt by أبو خوارزم (Sulaiman Alshammari)\nPowered by Monaco Editor + React 19 + Zustand' }) },
      { label: 'Check for Updates', action: onCheckForUpdates },
      { label: 'Documentation' },
      { label: 'Report Issue' },
      { label: '', divider: true },
      { label: 'Keyboard Shortcuts', shortcut: 'Ctrl+Shift+K' },
      { label: 'Command Palette', action: () => useIDEStore.getState().toggleCommandPalette(), shortcut: 'Ctrl+Shift+P' },
    ],
  };

  return (
    <div
      className="flex items-center justify-between px-4 py-1.5 select-none shrink-0 relative"
      style={{
        backgroundColor: currentTheme.bg,
        borderBottom: `1px solid ${currentTheme.border}`,
      }}
    >
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold tracking-wider flex items-center gap-1.5" style={{ color: currentTheme.accent }}>
          <Zap size={13} />
          HAVEN IDE
        </span>
        <div className="flex items-center gap-0.5 text-xs" style={{ color: currentTheme.textMuted }}>
          {Object.keys(menus).map(m => (
            <div key={m} className="relative">
              <button
                className="px-2 py-0.5 rounded hover:bg-white/10 transition-colors"
                onClick={() => setActiveMenu(activeMenu === m ? null : m)}
                onMouseEnter={() => { if (activeMenu) setActiveMenu(m); }}
              >
                {m}
              </button>
              {activeMenu === m && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                  <div
                    className="absolute top-full left-0 mt-0.5 py-1 rounded-md shadow-2xl z-50 min-w-[220px]"
                    style={{ backgroundColor: currentTheme.sidebar, border: `1px solid ${currentTheme.border}` }}
                  >
                    {menus[m].map((item, i) =>
                      item.divider ? (
                        <div key={i} className="my-1 border-t" style={{ borderColor: currentTheme.border }} />
                      ) : (
                        <button
                          key={i}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 flex items-center justify-between"
                          style={{ color: currentTheme.text }}
                          onClick={() => { item.action?.(); setActiveMenu(null); }}
                        >
                          <span>{item.label}</span>
                          {item.shortcut && <span className="ml-4 opacity-40">{item.shortcut}</span>}
                        </button>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs flex items-center gap-1" style={{ color: currentTheme.textMuted }}>
        {isRealFS && <span className="mr-1" style={{ color: currentTheme.accent }}>● LIVE</span>}
        {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : DEFAULT_WORKSPACE_NAME}
        <span className="mx-1 opacity-40">—</span>
        <span style={{ color: currentTheme.accent, opacity: 0.6 }}>HAVEN IDE v5.0</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-yellow-500/80 cursor-pointer hover:bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-500/80 cursor-pointer hover:bg-green-400" />
        <div className="w-3 h-3 rounded-full bg-red-500/80 cursor-pointer hover:bg-red-400" />
      </div>
    </div>
  );
}

// ── Split Editor (second editor pane) ──────────────────────────
function SplitEditor() {
  const { openTabs, activeTabId, currentTheme, updateTabContent, minimapVisible, setCursorPosition } = useIDEStore();
  // Show the second most recent tab, or same tab
  const otherTabs = openTabs.filter(t => t.id !== activeTabId);
  const splitTab = otherTabs.length > 0 ? otherTabs[otherTabs.length - 1] : openTabs.find(t => t.id === activeTabId);

  if (!splitTab) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: currentTheme.editor, color: currentTheme.textMuted }}>
        <p className="text-sm opacity-40">Open another file to split</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ backgroundColor: currentTheme.editor }}>
      <div className="flex items-center px-3 py-1 text-xs border-b shrink-0" style={{ borderColor: currentTheme.border, color: currentTheme.textMuted }}>
        <span style={{ color: currentTheme.accent }} className="mr-2">◫</span>
        <span>{splitTab.name}</span>
      </div>
      <Editor
        height="100%"
        language={splitTab.language}
        value={splitTab.content}
        onChange={(v) => v !== undefined && updateTabContent(splitTab.id, v)}
        theme="haven-dark"
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          minimap: { enabled: minimapVisible, scale: 2 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          padding: { top: 16, bottom: 16 },
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          readOnly: false,
        }}
      />
    </div>
  );
}

export default HavenIDE;
