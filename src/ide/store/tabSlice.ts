import type { StateCreator } from 'zustand';
import type { FileNode, Tab } from '../types';
import type { IDEState } from './types';
import { getLanguageFromName } from './helpers';

export interface TabSlice {
  openTabs: Tab[];
  activeTabId: string | null;
  openFile: (file: FileNode, path: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  pinTab: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  closeAllTabs: () => void;
  closeTabsToRight: (id: string) => void;
  moveTab: (fromIdx: number, toIdx: number) => void;
}

export const createTabSlice: StateCreator<IDEState, [], [], TabSlice> = (set, get) => ({
  openTabs: [],
  activeTabId: null,
  openFile: (file, path) =>
    set((state) => {
      const existing = state.openTabs.find((t) => t.id === file.id);
      if (existing) return { activeTabId: file.id, breadcrumbs: path.split('/').filter(Boolean) };
      const newTab: Tab = {
        id: file.id, name: file.name, path,
        language: file.language || getLanguageFromName(file.name),
        content: file.content || '', isModified: false,
        isPinned: false, isPreview: false, editorGroupId: 1,
      };
      return { openTabs: [...state.openTabs, newTab], activeTabId: file.id, breadcrumbs: path.split('/').filter(Boolean) };
    }),
  closeTab: (id) =>
    set((state) => {
      const tab = state.openTabs.find((t) => t.id === id);
      if (tab?.isPinned) return state;
      const newTabs = state.openTabs.filter((t) => t.id !== id);
      let newActive = state.activeTabId;
      if (state.activeTabId === id) {
        const idx = state.openTabs.findIndex((t) => t.id === id);
        newActive = newTabs[Math.min(idx, newTabs.length - 1)]?.id || null;
      }
      return { openTabs: newTabs, activeTabId: newActive };
    }),
  setActiveTab: (id) => {
    const tab = get().openTabs.find(t => t.id === id);
    set({ activeTabId: id, breadcrumbs: tab ? tab.path.split('/').filter(Boolean) : [] });
  },
  updateTabContent: (id, content) =>
    set((state) => ({
      openTabs: state.openTabs.map((t) => t.id === id ? { ...t, content, isModified: true } : t),
    })),
  pinTab: (id) =>
    set((state) => ({
      openTabs: state.openTabs.map((t) => t.id === id ? { ...t, isPinned: !t.isPinned } : t),
    })),
  closeOtherTabs: (id) =>
    set((state) => ({ openTabs: state.openTabs.filter((t) => t.id === id || t.isPinned), activeTabId: id })),
  closeAllTabs: () => set((state) => ({
    openTabs: state.openTabs.filter((t) => t.isPinned),
    activeTabId: state.openTabs.find(t => t.isPinned)?.id || null,
  })),
  closeTabsToRight: (id) =>
    set((state) => {
      const idx = state.openTabs.findIndex((t) => t.id === id);
      return { openTabs: state.openTabs.filter((t, i) => i <= idx || t.isPinned) };
    }),
  moveTab: (fromIdx, toIdx) =>
    set((state) => {
      const newTabs = [...state.openTabs];
      const [moved] = newTabs.splice(fromIdx, 1);
      newTabs.splice(toIdx, 0, moved);
      return { openTabs: newTabs };
    }),
});
