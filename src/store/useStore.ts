import { create } from 'zustand';
import type { Language } from '../i18n/translations';

interface HavenState {
  // Sovereign Mode
  isSovereign: boolean;
  toggleSovereign: () => void;

  // Terminal
  terminalOpen: boolean;
  toggleTerminal: () => void;
  setTerminalOpen: (v: boolean) => void;

  // Language (AR/EN)
  language: Language;
  toggleLanguage: () => void;

  // Command Palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (v: boolean) => void;

  // Loading
  isLoaded: boolean;
  setLoaded: () => void;

  // Royal Mode (first-visit entrance)
  royalComplete: boolean;
  setRoyalComplete: () => void;
}

export const useStore = create<HavenState>((set) => ({
  // Sovereign Mode
  isSovereign: false,
  toggleSovereign: () => set((state) => ({ isSovereign: !state.isSovereign })),

  // Terminal
  terminalOpen: false,
  toggleTerminal: () => set((state) => ({ terminalOpen: !state.terminalOpen })),
  setTerminalOpen: (v) => set({ terminalOpen: v }),

  // Language
  language: 'en',
  toggleLanguage: () => set((state) => ({ language: state.language === 'en' ? 'ar' : 'en' })),

  // Command Palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),

  // Loading
  isLoaded: false,
  setLoaded: () => set({ isLoaded: true }),

  // Royal Mode — shows once per browser (localStorage flag)
  royalComplete: typeof window !== 'undefined' && localStorage.getItem('haven-royal-seen') === '1',
  setRoyalComplete: () => {
    localStorage.setItem('haven-royal-seen', '1');
    set({ royalComplete: true });
  },
}));
