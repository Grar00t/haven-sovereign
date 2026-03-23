import type { LucideIcon } from 'lucide-react';

export interface HackTool {
  id: string;
  name: string;
  nameAr: string;
  icon: LucideIcon;
  color: string;
  category: 'real' | 'recon' | 'exploit' | 'defense' | 'audit' | 'terminal';
  description: string;
  isReal: boolean;
  runner?: () => Promise<string[]>;
  command: string;
  simulatedOutput?: string[];
  duration: number;
}
