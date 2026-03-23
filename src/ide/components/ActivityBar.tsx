import { type FC, type ReactNode, useRef, useEffect, useCallback } from 'react';
import { useIDEStore } from '../useIDEStore';
import { HAVEN_THEMES } from '../types';
import {
  FolderTree, Search, GitBranch, Puzzle, List, Zap, Brain,
  Monitor, Palette, Settings, Swords, Crown,
} from 'lucide-react';

export function ActivityBar() {
  const {
    currentTheme, sidebarVisible, activeSidebarPanel, setActiveSidebarPanel,
    toggleAiPanel, aiPanelVisible, toggleTerminal, terminalVisible,
    setTheme, themeName, toggleSettings, settingsOpen,
  } = useIDEStore();

  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const themeKeys = Object.keys(HAVEN_THEMES);
  const cycleTheme = () => {
    const currentIdx = themeKeys.indexOf(themeName);
    const next = themeKeys[(currentIdx + 1) % themeKeys.length];
    setTheme(next);
  };

  const handlePanelClick = (panel: string) => {
    if (activeSidebarPanel === panel && sidebarVisible) {
      useIDEStore.getState().toggleSidebar();
    } else {
      setActiveSidebarPanel(panel);
    }
  };

  // ── Keyboard navigation (Arrow keys, Home/End) ─────────────
  const handleGroupKeyDown = useCallback((e: KeyboardEvent) => {
    const el = document.activeElement as HTMLElement;
    const inTop = topRef.current?.contains(el);
    const inBottom = bottomRef.current?.contains(el);
    if (!inTop && !inBottom) return;
    const container = inTop ? topRef.current : bottomRef.current;
    if (!container) return;
    const btns: HTMLButtonElement[] = Array.from(container.querySelectorAll('button'));
    const idx = btns.indexOf(el as HTMLButtonElement);
    if (idx < 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault(); btns[(idx + 1) % btns.length]!.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault(); btns[(idx - 1 + btns.length) % btns.length]!.focus();
    } else if (e.key === 'Home') {
      e.preventDefault(); btns[0]!.focus();
    } else if (e.key === 'End') {
      e.preventDefault(); btns[btns.length - 1]!.focus();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleGroupKeyDown);
    return () => window.removeEventListener('keydown', handleGroupKeyDown);
  }, [handleGroupKeyDown]);

  const buttons: { icon: ReactNode; label: string; panel?: string; action?: () => void; active?: boolean }[] = [
    { icon: <FolderTree className="w-5 h-5" />, label: 'Explorer', panel: 'explorer' },
    { icon: <Search className="w-5 h-5" />, label: 'Search', panel: 'search' },
    { icon: <GitBranch className="w-5 h-5" />, label: 'Source Control', panel: 'git' },
    { icon: <Puzzle className="w-5 h-5" />, label: 'Extensions', panel: 'extensions' },
    { icon: <List className="w-5 h-5" />, label: 'Outline', panel: 'outline' },
    { icon: <Brain className="w-5 h-5" />, label: 'Niyah Engine', panel: 'niyah' },
    { icon: <Crown className="w-5 h-5" />, label: 'Sovereign Dashboard', panel: 'dashboard' },
    { icon: <Swords className="w-5 h-5" />, label: 'Sovereign Arsenal', panel: 'tools' },
    { icon: <Zap className="w-5 h-5" />, label: 'HAVEN AI', action: toggleAiPanel, active: aiPanelVisible },
  ];

  const bottomButtons: { icon: ReactNode; label: string; action: () => void; active: boolean }[] = [
    { icon: <Monitor className="w-5 h-5" />, label: 'Terminal', action: toggleTerminal, active: terminalVisible },
    { icon: <Palette className="w-5 h-5" />, label: `Theme: ${HAVEN_THEMES[themeName]?.name || themeName}`, action: cycleTheme, active: false },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', action: toggleSettings, active: settingsOpen },
  ];

  return (
    <div
      className="flex flex-col items-center justify-between py-3 shrink-0 select-none"
      style={{
        width: 52,
        backgroundColor: currentTheme.bg,
        borderRight: `1px solid ${currentTheme.border}`,
      }}
      role="toolbar"
      aria-label="Activity Bar"
    >
      {/* Top section */}
      <div ref={topRef} className="flex flex-col items-center gap-1" role="tablist" aria-orientation="vertical" aria-label="Sidebar panels">
        {buttons.map((btn) => {
          const isActive = btn.panel
            ? sidebarVisible && activeSidebarPanel === btn.panel
            : !!btn.active;
          return (
            <ActivityButton
              key={btn.label}
              icon={btn.icon}
              label={btn.label}
              isActive={isActive}
              accentColor={currentTheme.accent}
              onClick={btn.action || (() => handlePanelClick(btn.panel!))}
            />
          );
        })}
      </div>

      {/* Bottom section */}
      <div ref={bottomRef} className="flex flex-col items-center gap-1" role="tablist" aria-orientation="vertical" aria-label="Utilities">
        {bottomButtons.map((btn) => (
          <ActivityButton
            key={btn.label}
            icon={btn.icon}
            label={btn.label}
            isActive={btn.active}
            accentColor={currentTheme.accent}
            onClick={btn.action}
            isBottom
          />
        ))}
      </div>
    </div>
  );
}

// ── Reusable activity bar button with tooltip + ARIA ──────────
const ActivityButton: FC<{
  icon: ReactNode;
  label: string;
  isActive: boolean;
  accentColor: string;
  onClick: () => void;
  isBottom?: boolean;
}> = ({ icon, label, isActive, accentColor, onClick, isBottom }) => {
  const tooltipId = `tip-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        role="tab"
        aria-label={label}
        aria-pressed={isActive}
        aria-selected={isActive}
        aria-describedby={tooltipId}
        tabIndex={0}
        className="w-10 h-10 flex items-center justify-center rounded-md transition-all duration-150
                   hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-white/30"
        style={{
          borderLeft: isBottom ? 'none' : isActive ? `3px solid ${accentColor}` : '3px solid transparent',
          color: isActive ? accentColor : '#aaa',
          backgroundColor: isActive ? `${accentColor}10` : 'transparent',
        }}
      >
        {icon}
      </button>
      {/* Tooltip — backdrop-blur + shadow */}
      <div
        id={tooltipId}
        role="tooltip"
        className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md text-xs font-medium
                   whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible
                   transition-all duration-150 pointer-events-none z-50 shadow-xl
                   bg-neutral-900/95 backdrop-blur-sm border border-neutral-700/50 text-white/90"
      >
        {label}
      </div>
    </div>
  );
};
