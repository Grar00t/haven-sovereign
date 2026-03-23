import type { StateCreator } from 'zustand';
import type { FileNode } from '../types';
import type { IDEState } from './types';
import { DEFAULT_FILES } from './constants';
import { addFileToTree, removeFromTree, renameInTree, getLanguageFromName } from './helpers';

export interface FileSlice {
  files: FileNode[];
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
  createFile: (parentId: string, name: string, content?: string) => void;
  createFolder: (parentId: string, name: string) => void;
  deleteFile: (id: string) => void;
  renameFile: (id: string, newName: string) => void;
}

export const createFileSlice: StateCreator<IDEState, [], [], FileSlice> = (set) => ({
  files: DEFAULT_FILES,
  expandedFolders: new Set(['root', 'src', 'components-folder']),
  toggleFolder: (id) =>
    set((state) => {
      const newSet = new Set(state.expandedFolders);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return { expandedFolders: newSet };
    }),
  createFile: (parentId, name, content = '') =>
    set((state) => ({
      files: addFileToTree(state.files, parentId, {
        id: `file-${Date.now()}`, name, type: 'file', content,
        language: getLanguageFromName(name), gitStatus: 'untracked',
      }),
    })),
  createFolder: (parentId, name) =>
    set((state) => ({
      files: addFileToTree(state.files, parentId, {
        id: `folder-${Date.now()}`, name, type: 'folder', children: [],
      }),
    })),
  deleteFile: (id) =>
    set((state) => ({
      files: removeFromTree(state.files, id),
      openTabs: state.openTabs.filter((t) => t.id !== id),
    })),
  renameFile: (id, newName) =>
    set((state) => ({
      files: renameInTree(state.files, id, newName),
      openTabs: state.openTabs.map((t) => t.id === id ? { ...t, name: newName } : t),
    })),
});
