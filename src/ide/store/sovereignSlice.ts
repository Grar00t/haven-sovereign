import type { StateCreator } from 'zustand';
import type { IDEState } from './types';

export const createSovereignSlice: StateCreator<IDEState, [], [], Pick<IDEState, 'kernelPath' | 'triggerLockdown' | 'enforceNetworkSilence'>> = () => ({
  kernelPath: '/sovereign/kernel',
  triggerLockdown: async (reason: string) => {
    console.warn('[Sovereign] Lockdown requested:', reason);
  },
  enforceNetworkSilence: async () => {
    console.warn('[Sovereign] Network silence enforced (UI stub)');
  },
});
