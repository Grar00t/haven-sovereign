import type { StateCreator } from 'zustand';
import type { FileNode, Tab, IDESetting } from '../types';
import { HAVEN_THEMES } from '../types';
import type { IDEState } from './types';
import { readDirectoryHandle, processDropEntry, idbPut, idbGet } from './helpers';

export interface FSSlice {
  directoryHandle: FileSystemDirectoryHandle | null;
  fileHandles: Map<string, FileSystemFileHandle>;
  openRealFolder: () => Promise<void>;
  saveFile: (id: string) => Promise<void>;
  saveAllFiles: () => Promise<void>;
  isRealFS: boolean;
  persistToIDB: () => Promise<void>;
  restoreFromIDB: () => Promise<void>;
  importDroppedItems: (items: DataTransferItemList) => Promise<void>;
}

export const createFSSlice: StateCreator<IDEState, [], [], FSSlice> = (set, get) => ({
  directoryHandle: null,
  fileHandles: new Map<string, FileSystemFileHandle>(),
  isRealFS: false,

  openRealFolder: async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        get().addNotification({ type: 'error', message: 'File System Access API not supported in this browser. Use Chrome or Edge.' });
        return;
      }
      const dirHandle = await (window as Window & { showDirectoryPicker(opts: { mode: string }): Promise<FileSystemDirectoryHandle> }).showDirectoryPicker({ mode: 'readwrite' });
      const fileHandles = new Map<string, FileSystemFileHandle>();
      const rootId = `fs-${dirHandle.name}`;

      get().addNotification({ type: 'info', message: `Reading folder: ${dirHandle.name}...` });

      const children = await readDirectoryHandle(dirHandle, fileHandles, rootId);

      const rootNode: FileNode = {
        id: rootId,
        name: dirHandle.name,
        type: 'folder',
        children,
      };

      set({
        files: [rootNode],
        directoryHandle: dirHandle,
        fileHandles,
        isRealFS: true,
        expandedFolders: new Set([rootId]),
        openTabs: [],
        activeTabId: null,
      });

      get().addNotification({ type: 'success', message: `Opened: ${dirHandle.name} (${fileHandles.size} files)` });
      await get().persistToIDB();
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      if (e.name !== 'AbortError') {
        get().addNotification({ type: 'error', message: `Failed to open folder: ${e.message}` });
      }
    }
  },

  saveFile: async (id: string) => {
    const state = get();
    const tab = state.openTabs.find(t => t.id === id);
    if (!tab) return;

    const handle = state.fileHandles.get(id);
    if (handle) {
      try {
        const writable = await handle.createWritable();
        await writable.write(tab.content);
        await writable.close();
        set((s) => ({
          openTabs: s.openTabs.map(t => t.id === id ? { ...t, isModified: false } : t),
        }));
        get().addNotification({ type: 'success', message: `Saved: ${tab.name}` });
      } catch (err: unknown) {
        const e = err instanceof Error ? err : new Error(String(err));
        get().addNotification({ type: 'error', message: `Save failed: ${e.message}` });
      }
    } else {
      function updateContent(nodes: FileNode[]): FileNode[] {
        return nodes.map(n => {
          if (n.id === id) return { ...n, content: tab!.content };
          if (n.children) return { ...n, children: updateContent(n.children) };
          return n;
        });
      }
      set((s) => ({
        files: updateContent(s.files),
        openTabs: s.openTabs.map(t => t.id === id ? { ...t, isModified: false } : t),
      }));
      get().addNotification({ type: 'success', message: `Saved: ${tab.name} (virtual)` });
      await get().persistToIDB();
    }
  },

  saveAllFiles: async () => {
    const state = get();
    const modified = state.openTabs.filter(t => t.isModified);
    for (const tab of modified) {
      await get().saveFile(tab.id);
    }
    if (modified.length > 0) {
      get().addNotification({ type: 'success', message: `Saved ${modified.length} file(s)` });
    }
  },

  persistToIDB: async () => {
    try {
      const state = get();
      await idbPut('haven-files', JSON.parse(JSON.stringify(state.files)));
      await idbPut('haven-tabs', state.openTabs.map(t => ({ ...t })));
      await idbPut('haven-activeTab', state.activeTabId);
      await idbPut('haven-theme', state.themeName);
      await idbPut('haven-settings', JSON.parse(JSON.stringify(state.settings)));
    } catch { /* silently fail — IDB not critical */ }
  },

  restoreFromIDB: async () => {
    try {
      const files = await idbGet<FileNode[]>('haven-files');
      const tabs = await idbGet<Tab[]>('haven-tabs');
      const activeTab = await idbGet<string | null>('haven-activeTab');
      const theme = await idbGet<string>('haven-theme');
      const settings = await idbGet<IDESetting[]>('haven-settings');

      const updates: Partial<IDEState> = {};
      if (files && files.length > 0) updates.files = files;
      if (tabs) updates.openTabs = tabs;
      if (activeTab !== undefined) updates.activeTabId = activeTab;
      if (theme && HAVEN_THEMES[theme]) {
        updates.themeName = theme;
        updates.currentTheme = HAVEN_THEMES[theme];
      }
      if (settings) updates.settings = settings;

      if (Object.keys(updates).length > 0) {
        set(updates as Partial<IDEState>);
        get().addNotification({ type: 'info', message: 'Previous session restored from storage' });
      }
    } catch { /* silently fail */ }
  },

  importDroppedItems: async (items: DataTransferItemList) => {
    const state = get();
    const parentId = state.files[0]?.children?.[0]?.id || state.files[0]?.id || 'root';
    const newNodes: FileNode[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const entry = item.webkitGetAsEntry?.();
      if (entry) {
        const node = await processDropEntry(entry, parentId, state.fileHandles);
        if (node) newNodes.push(node);
      }
    }

    if (newNodes.length === 0) return;

    set((s) => {
      const addToFirst = (nodes: FileNode[]): FileNode[] => {
        if (nodes.length === 0) return newNodes;
        const root = { ...nodes[0], children: [...(nodes[0].children || []), ...newNodes] };
        return [root, ...nodes.slice(1)];
      };
      return { files: addToFirst(s.files) };
    });

    get().addNotification({ type: 'success', message: `Imported ${newNodes.length} item(s)` });
    await get().persistToIDB();
  },
});
