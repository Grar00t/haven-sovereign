// ══════════════════════════════════════════════════════════════════
// HAVEN IDE Store — Composed from domain slices
// ══════════════════════════════════════════════════════════════════
import { create } from 'zustand';
import {
  createFileSlice,
  createTabSlice,
  createTerminalSlice,
  createLayoutSlice,
  createFSSlice,
  createGitSlice,
  createNiyahSlice,
  type IDEState,
} from './store';

// Re-export for external consumers
export { collectGitChanges } from './store';
export type { IDEState } from './store';

export const useIDEStore = create<IDEState>()((...a) => ({
  ...createFileSlice(...a),
  ...createTabSlice(...a),
  ...createTerminalSlice(...a),
  ...createLayoutSlice(...a),
  ...createFSSlice(...a),
  ...createGitSlice(...a),
  ...createNiyahSlice(...a),
}));
