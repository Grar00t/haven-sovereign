import type { FileSlice } from './fileSlice';
import type { TabSlice } from './tabSlice';
import type { TerminalSlice } from './terminalSlice';
import type { LayoutSlice } from './layoutSlice';
import type { FSSlice } from './fsSlice';
import type { GitSlice } from './gitSlice';
import type { NiyahSlice } from './niyahSlice';
// Sovereign Kernel integration
export interface SovereignCore {
  kernelPath: string;
  triggerLockdown: (reason: string) => Promise<void>;
  enforceNetworkSilence: () => Promise<void>;
}

export type IDEState =
  & FileSlice
  & TabSlice
  & TerminalSlice
  & LayoutSlice
  & FSSlice
  & GitSlice
  & NiyahSlice
  & SovereignCore;
