import type { StateCreator } from 'zustand';
import type { IDETheme, Notification, IDESetting } from '../types';
import { HAVEN_THEMES } from '../types';
import type { IDEState } from './types';
import { DEFAULT_SETTINGS } from './constants';

export interface LayoutSlice {
  sidebarVisible: boolean;
  toggleSidebar: () => void;
  sidebarWidth: number;
  setSidebarWidth: (w: number) => void;
  activeSidebarPanel: string;
  setActiveSidebarPanel: (panel: string) => void;
  currentTheme: IDETheme;
  themeName: string;
  setTheme: (name: string) => void;
  searchOpen: boolean;
  toggleSearch: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  commandPaletteOpen: boolean;
  toggleCommandPalette: () => void;
  minimapVisible: boolean;
  toggleMinimap: () => void;
  cursorLine: number;
  cursorCol: number;
  setCursorPosition: (line: number, col: number) => void;
  zenMode: boolean;
  toggleZenMode: () => void;
  breadcrumbs: string[];
  bottomPanelTab: string;
  setBottomPanelTab: (tab: string) => void;
  aiPanelVisible: boolean;
  toggleAiPanel: () => void;
  aiMessages: { role: 'user' | 'assistant'; content: string }[];
  addAiMessage: (msg: { role: 'user' | 'assistant'; content: string }) => void;
  markdownPreviewVisible: boolean;
  toggleMarkdownPreview: () => void;
  goToLineOpen: boolean;
  toggleGoToLine: () => void;
  splitEditorActive: boolean;
  toggleSplitEditor: () => void;
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  settings: IDESetting[];
  settingsOpen: boolean;
  toggleSettings: () => void;
  updateSetting: (id: string, value: boolean | number | string) => void;
  getSetting: (id: string) => boolean | number | string;
}

export const createLayoutSlice: StateCreator<IDEState, [], [], LayoutSlice> = (set, get) => ({
  // Sidebar
  sidebarVisible: true,
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  sidebarWidth: 260,
  setSidebarWidth: (w) => set({ sidebarWidth: Math.max(180, Math.min(500, w)) }),
  activeSidebarPanel: 'explorer',
  setActiveSidebarPanel: (panel) => set({ activeSidebarPanel: panel, sidebarVisible: true, searchOpen: panel === 'search' }),

  // Theme
  currentTheme: HAVEN_THEMES['haven-dark'],
  themeName: 'haven-dark',
  setTheme: (name) => { const theme = HAVEN_THEMES[name]; if (theme) set({ currentTheme: theme, themeName: name }); },

  // Search
  searchOpen: false,
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen, activeSidebarPanel: !state.searchOpen ? 'search' : state.activeSidebarPanel })),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  // Command palette / editor
  commandPaletteOpen: false,
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  minimapVisible: true,
  toggleMinimap: () => set((state) => ({ minimapVisible: !state.minimapVisible })),
  cursorLine: 1,
  cursorCol: 1,
  setCursorPosition: (line, col) => set({ cursorLine: line, cursorCol: col }),

  // Zen Mode
  zenMode: false,
  toggleZenMode: () => set((state) => ({
    zenMode: !state.zenMode,
    sidebarVisible: state.zenMode,
    terminalVisible: state.zenMode,
  })),

  breadcrumbs: [],
  bottomPanelTab: 'terminal',
  setBottomPanelTab: (tab) => set({ bottomPanelTab: tab, terminalVisible: true }),

  // AI
  aiPanelVisible: false,
  toggleAiPanel: () => set((state) => ({ aiPanelVisible: !state.aiPanelVisible })),
  aiMessages: [{ role: 'assistant', content: '⚡ HAVEN AI v5.0 — Ready.\nType /help for commands.' }],
  addAiMessage: (msg) => set((state) => ({ aiMessages: [...state.aiMessages, msg] })),

  // Markdown preview
  markdownPreviewVisible: false,
  toggleMarkdownPreview: () => set((state) => ({ markdownPreviewVisible: !state.markdownPreviewVisible })),

  goToLineOpen: false,
  toggleGoToLine: () => set((state) => ({ goToLineOpen: !state.goToLineOpen })),
  splitEditorActive: false,
  toggleSplitEditor: () => set((state) => ({ splitEditorActive: !state.splitEditorActive })),

  // Notifications
  notifications: [],
  addNotification: (n) => {
    const notification: Notification = { ...n, id: `notif-${Date.now()}`, timestamp: Date.now() };
    set((state) => ({ notifications: [...state.notifications, notification] }));
    setTimeout(() => { get().dismissNotification(notification.id); }, 5000);
  },
  dismissNotification: (id) => set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),

  // Settings
  settings: DEFAULT_SETTINGS,
  settingsOpen: false,
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  updateSetting: (id, value) => set((state) => ({ settings: state.settings.map((s) => s.id === id ? { ...s, value } : s) })),
  getSetting: (id) => get().settings.find((s) => s.id === id)?.value ?? '',
});
