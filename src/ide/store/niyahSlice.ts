import type { StateCreator } from 'zustand';
import type { NiyahSession } from '../engine/NiyahEngine';
import type { IDEState } from './types';

export interface NiyahSlice {
  niyahVector: NiyahSession | null;
  niyahHistory: NiyahSession[];
  updateNiyahVector: (session: NiyahSession) => void;
  clearNiyahHistory: () => void;
}

export const createNiyahSlice: StateCreator<IDEState, [], [], NiyahSlice> = (set) => ({
  niyahVector: null,
  niyahHistory: [],
  updateNiyahVector: (session) => set(state => ({
    niyahVector: session,
    niyahHistory: [...state.niyahHistory.slice(-99), session],
  })),
  clearNiyahHistory: () => set({ niyahVector: null, niyahHistory: [] }),
});
