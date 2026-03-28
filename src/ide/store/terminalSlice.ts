import type { StateCreator } from 'zustand';
import type {
  FileNode,
  Tab,
  TerminalInstance,
  TerminalLine,
  TerminalProfile,
} from '../types';
import { HAVEN_THEMES } from '../types';
import type { IDEState } from './types';
import { DEFAULT_CWD, HAVEN_ASCII } from './constants';
import { collectGitChanges } from './helpers';
import { niyahEngine } from '../engine/NiyahEngine';
import {
  sovereignTauri,
  type TerminalCommandResult,
  type TerminalToolStatus,
} from '../engine/SovereignTauri';

const PROFILE_NAMES: Record<TerminalProfile, string> = {
  local: 'local-shell',
  python: 'python-dev',
  'local-ai': 'local-ai',
  gemini: 'gemini-cli',
  forensics: 'forensics',
  msf: 'msf-detect',
};

const PROFILE_NOTES: Record<TerminalProfile, string> = {
  local: 'Local workspace commands plus real desktop tool passthroughs.',
  python: 'Bare input is routed to python unless you call another explicit tool.',
  'local-ai': 'Bare input is routed to ollama for local AI inspection commands.',
  gemini: 'Bare input is routed to Gemini CLI. Best for one-shot flags inside HAVEN.',
  forensics: 'Grounded local diagnostics mode for scans and desktop tool status.',
  msf: 'Detection-only profile. HAVEN will report Metasploit presence but will not fake an embedded PTY.',
};

const DESKTOP_TOOL_COMMANDS = new Set(['python', 'py', 'node', 'npm', 'git', 'ollama', 'gemini']);

const ALL_COMMANDS = [
  'help', 'clear', 'cls', 'exit', 'echo', 'ls', 'cat', 'cd', 'pwd', 'whoami', 'date',
  'ascii', 'neofetch', 'touch', 'mkdir', 'rm', 'open', 'save', 'zen', 'theme',
  'tools', 'profile', 'scan', 'phalanx', 'haven', 'niyah',
  'python', 'py', 'node', 'npm', 'git', 'ollama', 'gemini', 'msf',
];

function tokenizeCommand(input: string): string[] {
  const tokens: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|`([^`]*)`|([^\s]+)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3] ?? match[4] ?? '');
  }

  return tokens;
}

function formatHelp(profile: TerminalProfile): string {
  return `┌──────────────────────────────────────────────────────┐
│  HAVEN IDE — Hybrid Sovereign Terminal               │
├──────────────────────────────────────────────────────┤
│  Active profile: ${PROFILE_NAMES[profile].padEnd(33)}│
│  ${PROFILE_NOTES[profile].slice(0, 52).padEnd(52)}│
├──────────────────────────────────────────────────────┤
│  Local workspace                                     │
│  help clear ls cat touch mkdir rm open save cd pwd   │
│  theme zen ascii neofetch                            │
├──────────────────────────────────────────────────────┤
│  Real desktop tools (Tauri shell only)               │
│  tools               Detect python/node/git/ollama   │
│  profile use <name>  local | python | local-ai ...   │
│  python ...          Run local Python                │
│  gemini ...          Run Gemini CLI                  │
│  ollama ...          Run local Ollama                │
│  git/node/npm ...    Pass through to desktop shell   │
│  msf status          Detect Metasploit only          │
├──────────────────────────────────────────────────────┤
│  Practical HAVEN commands                            │
│  haven              Show official CLI entrypoints     │
│  phalanx            Check desktop bridge health       │
│  niyah [intent]     Local Niyah reasoning session     │
│  scan [--deep]      Honest local sovereignty scan     │
└──────────────────────────────────────────────────────┘`;
}

function formatTools(tools: TerminalToolStatus[], filter?: string): string {
  const selected = filter ? tools.filter(tool => tool.name === filter) : tools;
  if (selected.length === 0) {
    return `No tool matched "${filter}". Run "tools" to inspect the desktop shell.`;
  }

  return [
    'Desktop Tooling — live detection',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ...selected.map((tool) => {
      const state = tool.available ? 'READY' : 'MISSING';
      const path = tool.path ? `\n  path: ${tool.path}` : '';
      const mode = tool.interactive ? 'interactive' : 'one-shot';
      return `${tool.name.padEnd(10)} ${state.padEnd(7)} ${tool.category} (${mode})${path}\n  note: ${tool.note}`;
    }),
  ].join('\n');
}

function formatCommandResult(result: TerminalCommandResult): string {
  const lines = [
    `↳ desktop cwd: ${result.cwd}`,
    `↳ duration: ${result.durationMs}ms`,
  ];

  if (typeof result.exitCode === 'number') {
    lines.push(`↳ exit code: ${result.exitCode}`);
  }

  if (result.stdout.trim()) {
    lines.push('');
    lines.push(result.stdout.trimEnd());
  }

  if (result.stderr.trim()) {
    lines.push('');
    lines.push(result.stderr.trimEnd());
  }

  if (!result.stdout.trim() && !result.stderr.trim()) {
    lines.push('');
    lines.push(result.ok ? '[command finished with no output]' : '[command failed with no output]');
  }

  return lines.join('\n');
}

function searchFileContent(nodes: FileNode[], fileName: string): string | null {
  for (const node of nodes) {
    if (node.type === 'file' && node.name === fileName) return node.content || '(empty)';
    if (node.children) {
      const found = searchFileContent(node.children, fileName);
      if (found) return found;
    }
  }
  return null;
}

function searchFileNode(nodes: FileNode[], fileName: string, path: string): { node: FileNode; path: string } | null {
  for (const node of nodes) {
    const currentPath = path ? `${path}/${node.name}` : node.name;
    if (node.type === 'file' && node.name === fileName) return { node, path: currentPath };
    if (node.children) {
      const found = searchFileNode(node.children, fileName, currentPath);
      if (found) return found;
    }
  }
  return null;
}

function searchNodeId(nodes: FileNode[], name: string): string | null {
  for (const node of nodes) {
    if (node.name === name) return node.id;
    if (node.children) {
      const found = searchNodeId(node.children, name);
      if (found) return found;
    }
  }
  return null;
}

function resolveProxyCommand(profile: TerminalProfile, rawCommand: string, args: string[]) {
  if (DESKTOP_TOOL_COMMANDS.has(rawCommand)) {
    return { command: rawCommand, args };
  }

  switch (profile) {
    case 'python':
      return { command: 'python', args: [rawCommand, ...args] };
    case 'local-ai':
      return { command: 'ollama', args: [rawCommand, ...args] };
    case 'gemini':
      return { command: 'gemini', args: [rawCommand, ...args] };
    default:
      return null;
  }
}

function createBootLines(profile: TerminalProfile = 'local'): TerminalLine[] {
  return [
    { text: HAVEN_ASCII, type: 'system', timestamp: Date.now() },
    { text: '⚡ HAVEN IDE — Hybrid Sovereign Terminal', type: 'system', timestamp: Date.now() },
    { text: `   Profile: ${PROFILE_NAMES[profile]} | Type "help" for grounded commands.`, type: 'system', timestamp: Date.now() },
  ];
}

export interface TerminalSlice {
  terminalVisible: boolean;
  terminals: TerminalInstance[];
  activeTerminalId: string;
  toggleTerminal: () => void;
  addTerminalLine: (line: TerminalLine) => void;
  executeCommand: (command: string) => Promise<void>;
  createTerminal: (name?: string, profile?: TerminalProfile) => void;
  closeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;
  setTerminalProfile: (profile: TerminalProfile, id?: string) => void;
  terminalHeight: number;
  setTerminalHeight: (h: number) => void;
}

export const createTerminalSlice: StateCreator<IDEState, [], [], TerminalSlice> = (set, get) => ({
  terminalVisible: true,
  terminals: [{
    id: 'terminal-1',
    name: PROFILE_NAMES.local,
    cwd: DEFAULT_CWD,
    profile: 'local',
    lines: createBootLines('local'),
  }],
  activeTerminalId: 'terminal-1',
  terminalHeight: 220,
  setTerminalHeight: (h) => set({ terminalHeight: Math.max(80, Math.min(500, h)) }),
  toggleTerminal: () => set((state) => ({ terminalVisible: !state.terminalVisible })),
  addTerminalLine: (line) =>
    set((state) => ({
      terminals: state.terminals.map((t) =>
        t.id === state.activeTerminalId ? { ...t, lines: [...t.lines, line] } : t
      ),
    })),
  createTerminal: (name, profile = 'local') =>
    set((state) => {
      const id = `terminal-${Date.now()}`;
      return {
        terminals: [
          ...state.terminals,
          {
            id,
            name: name || PROFILE_NAMES[profile],
            cwd: DEFAULT_CWD,
            profile,
            lines: createBootLines(profile),
          },
        ],
        activeTerminalId: id,
        terminalVisible: true,
      };
    }),
  closeTerminal: (id) =>
    set((state) => {
      const remaining = state.terminals.filter((terminal) => terminal.id !== id);
      if (remaining.length === 0) return { terminalVisible: false };
      return {
        terminals: remaining,
        activeTerminalId: state.activeTerminalId === id ? remaining[remaining.length - 1].id : state.activeTerminalId,
      };
    }),
  setActiveTerminal: (id) => set({ activeTerminalId: id }),
  setTerminalProfile: (profile, id) =>
    set((state) => {
      const targetId = id || state.activeTerminalId;
      return {
        terminals: state.terminals.map((terminal) => (
          terminal.id === targetId
            ? {
                ...terminal,
                profile,
                name: PROFILE_NAMES[profile],
                lines: [
                  ...terminal.lines,
                  {
                    text: `Profile switched to ${PROFILE_NAMES[profile]} — ${PROFILE_NOTES[profile]}`,
                    type: 'system',
                    timestamp: Date.now(),
                  },
                ],
              }
            : terminal
        )),
      };
    }),
  executeCommand: async (command) => {
    const state = get();
    const trimmed = command.trim();
    if (!trimmed) return;

    const tokens = tokenizeCommand(trimmed);
    const [rawCommand, ...args] = tokens;
    const cmd = rawCommand.toLowerCase();
    const activeTerminal = state.terminals.find((terminal) => terminal.id === state.activeTerminalId);
    const activeProfile = activeTerminal?.profile || 'local';

    state.addTerminalLine({ text: `$ ${trimmed}`, type: 'input', timestamp: Date.now() });

    if (cmd === 'clear' || cmd === 'cls') {
      set((s) => ({
        terminals: s.terminals.map((terminal) => (
          terminal.id === s.activeTerminalId
            ? { ...terminal, lines: [] }
            : terminal
        )),
      }));
      return;
    }

    if (cmd === 'exit') {
      state.closeTerminal(state.activeTerminalId);
      return;
    }

    if (cmd === 'help') {
      state.addTerminalLine({ text: formatHelp(activeProfile), type: 'output', timestamp: Date.now() });
      return;
    }

    if (cmd === 'echo') {
      state.addTerminalLine({ text: args.join(' '), type: 'output', timestamp: Date.now() });
      return;
    }

    if (cmd === 'pwd') {
      state.addTerminalLine({ text: activeTerminal?.cwd || DEFAULT_CWD, type: 'output', timestamp: Date.now() });
      return;
    }

    if (cmd === 'whoami') {
      state.addTerminalLine({ text: 'HAVEN desktop operator — human-first local shell', type: 'output', timestamp: Date.now() });
      return;
    }

    if (cmd === 'date') {
      state.addTerminalLine({ text: new Date().toLocaleString('en-SA', { dateStyle: 'full', timeStyle: 'medium' }), type: 'output', timestamp: Date.now() });
      return;
    }

    if (cmd === 'ascii') {
      state.addTerminalLine({ text: HAVEN_ASCII, type: 'system', timestamp: Date.now() });
      return;
    }

    if (cmd === 'neofetch') {
      state.addTerminalLine({
        text: [
          'HAVEN Hybrid Terminal',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          `profile: ${PROFILE_NAMES[activeProfile]}`,
          `cwd:     ${activeTerminal?.cwd || DEFAULT_CWD}`,
          `theme:   ${state.themeName}`,
          `tabs:    ${state.openTabs.length}`,
          `desktop: ${sovereignTauri.isDesktopShell() ? 'tauri-shell' : 'browser-preview'}`,
        ].join('\n'),
        type: 'output',
        timestamp: Date.now(),
      });
      return;
    }

    if (cmd === 'ls') {
      const files = state.files[0]?.children?.map((file) => file.type === 'folder' ? `  ${file.name}/` : `  ${file.name}`) || [];
      state.addTerminalLine({
        text: files.length > 0 ? files.join('\n') : '[virtual workspace is empty]',
        type: 'output',
        timestamp: Date.now(),
      });
      return;
    }

    if (cmd === 'cat') {
      const fileName = args[0];
      if (!fileName) {
        state.addTerminalLine({ text: 'Usage: cat <filename>', type: 'error', timestamp: Date.now() });
        return;
      }
      const content = searchFileContent(state.files, fileName);
      state.addTerminalLine({
        text: content || `cat: ${fileName}: No such file in the virtual workspace`,
        type: content ? 'output' : 'error',
        timestamp: Date.now(),
      });
      return;
    }

    if (cmd === 'touch') {
      const name = args[0];
      if (!name) {
        state.addTerminalLine({ text: 'Usage: touch <filename>', type: 'error', timestamp: Date.now() });
        return;
      }
      state.createFile('src', name);
      state.addTerminalLine({ text: `Created: ${name}`, type: 'success', timestamp: Date.now() });
      state.addNotification({ type: 'success', message: `File created: ${name}` });
      return;
    }

    if (cmd === 'mkdir') {
      const name = args[0];
      if (!name) {
        state.addTerminalLine({ text: 'Usage: mkdir <dirname>', type: 'error', timestamp: Date.now() });
        return;
      }
      state.createFolder('src', name);
      state.addTerminalLine({ text: `Created directory: ${name}/`, type: 'success', timestamp: Date.now() });
      return;
    }

    if (cmd === 'rm') {
      const name = args[0];
      if (!name) {
        state.addTerminalLine({ text: 'Usage: rm <filename>', type: 'error', timestamp: Date.now() });
        return;
      }
      const fileId = searchNodeId(state.files, name);
      if (!fileId) {
        state.addTerminalLine({ text: `rm: ${name}: No such file in the virtual workspace`, type: 'error', timestamp: Date.now() });
        return;
      }
      state.deleteFile(fileId);
      state.addTerminalLine({ text: `Removed: ${name}`, type: 'success', timestamp: Date.now() });
      return;
    }

    if (cmd === 'cd') {
      const cwd = args[0] || DEFAULT_CWD;
      set((s) => ({
        terminals: s.terminals.map((terminal) => (
          terminal.id === s.activeTerminalId ? { ...terminal, cwd } : terminal
        )),
      }));
      state.addTerminalLine({ text: `cwd -> ${cwd}`, type: 'system', timestamp: Date.now() });
      return;
    }

    if (cmd === 'open') {
      const fileName = args[0];
      if (!fileName) {
        state.addTerminalLine({ text: 'Usage: open <filename>', type: 'error', timestamp: Date.now() });
        return;
      }
      const found = searchFileNode(state.files, fileName, '');
      if (!found) {
        state.addTerminalLine({ text: `open: ${fileName}: No such file in the virtual workspace`, type: 'error', timestamp: Date.now() });
        return;
      }
      state.openFile(found.node, found.path);
      state.addTerminalLine({ text: `Opened: ${found.path}`, type: 'success', timestamp: Date.now() });
      return;
    }

    if (cmd === 'save') {
      const activeTab = state.openTabs.find((tab) => tab.id === state.activeTabId);
      if (!activeTab) {
        state.addTerminalLine({ text: 'No active file to save.', type: 'error', timestamp: Date.now() });
        return;
      }
      state.saveFile(activeTab.id);
      state.addTerminalLine({ text: `Saved: ${activeTab.name}`, type: 'success', timestamp: Date.now() });
      return;
    }

    if (cmd === 'theme') {
      const themeName = args[0];
      if (themeName && HAVEN_THEMES[themeName]) {
        state.setTheme(themeName);
        state.addTerminalLine({ text: `Theme: ${themeName}`, type: 'system', timestamp: Date.now() });
      } else {
        state.addTerminalLine({ text: `Themes: ${Object.keys(HAVEN_THEMES).join(', ')}`, type: 'output', timestamp: Date.now() });
      }
      return;
    }

    if (cmd === 'zen') {
      state.toggleZenMode();
      state.addTerminalLine({
        text: `Zen Mode ${get().zenMode ? 'ACTIVATED — focus absolute' : 'DEACTIVATED'}`,
        type: 'system',
        timestamp: Date.now(),
      });
      return;
    }

    if (cmd === 'tools') {
      const tools = await sovereignTauri.listTerminalTools();
      const filter = args[0]?.toLowerCase();
      state.addTerminalLine({ text: formatTools(tools, filter), type: 'output', timestamp: Date.now() });
      return;
    }

    if (cmd === 'profile') {
      const sub = args[0]?.toLowerCase();
      if (!sub || sub === 'current') {
        state.addTerminalLine({
          text: `Current profile: ${PROFILE_NAMES[activeProfile]}\n${PROFILE_NOTES[activeProfile]}`,
          type: 'output',
          timestamp: Date.now(),
        });
        return;
      }

      if (sub === 'list') {
        state.addTerminalLine({
          text: Object.entries(PROFILE_NAMES)
            .map(([profile, name]) => `${name.padEnd(12)} ${PROFILE_NOTES[profile as TerminalProfile]}`)
            .join('\n'),
          type: 'output',
          timestamp: Date.now(),
        });
        return;
      }

      if (sub === 'use') {
        const profile = args[1] as TerminalProfile | undefined;
        if (!profile || !(profile in PROFILE_NAMES)) {
          state.addTerminalLine({
            text: `Usage: profile use <${Object.keys(PROFILE_NAMES).join('|')}>`,
            type: 'error',
            timestamp: Date.now(),
          });
          return;
        }
        state.setTerminalProfile(profile);
        return;
      }

      state.addTerminalLine({ text: 'Usage: profile <list|current|use <name>>', type: 'error', timestamp: Date.now() });
      return;
    }

    if (cmd === 'phalanx') {
      const healthy = await sovereignTauri.checkPhalanxHealth();
      state.addTerminalLine({
        text: healthy
          ? 'Phalanx bridge health: CLEAN — desktop guard responded without findings.'
          : 'Phalanx bridge health: DEGRADED — desktop guard did not respond cleanly.',
        type: healthy ? 'success' : 'error',
        timestamp: Date.now(),
      });
      return;
    }

    if (cmd === 'haven') {
      state.addTerminalLine({
        text: [
          'HAVEN official local entrypoints',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          'CLI: npm run niyah:cli -- doctor --json',
          'Fast model check: ollama ps',
          'Hybrid shell: tools / profile use gemini / gemini --help',
          'Note: virtual-workspace commands stay local to the editor until you load a real folder.',
        ].join('\n'),
        type: 'output',
        timestamp: Date.now(),
      });
      return;
    }

    if (cmd === 'scan') {
      const deep = args.includes('--deep') || args.includes('-d');
      const tools = await sovereignTauri.listTerminalTools();
      const ready = tools.filter((tool) => tool.available).map((tool) => tool.name);
      state.addTerminalLine({
        text: [
          'Local Sovereignty Scan',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          `mode: ${deep ? 'deep' : 'quick'}`,
          `desktop shell: ${sovereignTauri.isDesktopShell() ? 'attached' : 'browser-preview'}`,
          `ready tools: ${ready.length > 0 ? ready.join(', ') : 'none detected'}`,
          'network stance: local-first, no fake cloud claims',
        ].join('\n'),
        type: 'output',
        timestamp: Date.now(),
      });
      return;
    }

    if (cmd === 'niyah') {
      const inputStr = args.join(' ') || 'sovereign intent analysis';
      const activeTab = state.openTabs.find((tab: Tab) => tab.id === state.activeTabId);
      const session = niyahEngine.process(inputStr, {
        activeFile: activeTab?.name,
        language: activeTab?.language,
      });
      get().updateNiyahVector(session);
      state.addTerminalLine({ text: niyahEngine.getTerminalOutput(session), type: 'output', timestamp: Date.now() });
      return;
    }

    if (cmd === 'msf') {
      const tools = await sovereignTauri.listTerminalTools();
      const msf = tools.find((tool) => tool.name === 'msfconsole');
      state.addTerminalLine({
        text: msf
          ? formatTools([msf])
          : 'Metasploit status is unavailable because the desktop bridge did not return msfconsole.',
        type: msf?.available ? 'output' : 'error',
        timestamp: Date.now(),
      });
      return;
    }

    const proxied = resolveProxyCommand(activeProfile, cmd, args);
    if (proxied) {
      state.addTerminalLine({
        text: `↳ running ${proxied.command} inside the desktop shell...`,
        type: 'system',
        timestamp: Date.now(),
      });
      const result = await sovereignTauri.runTerminalCommand(
        proxied.command,
        proxied.args,
        activeTerminal?.cwd,
        proxied.command === 'npm' ? 25000 : 15000,
      );
      state.addTerminalLine({
        text: formatCommandResult(result),
        type: result.ok ? 'output' : 'error',
        timestamp: Date.now(),
      });
      return;
    }

    if (activeProfile === 'msf') {
      state.addTerminalLine({
        text: 'MSF profile is detection-only right now. Run "msf" to inspect installation status; HAVEN will not fake an embedded Metasploit console.',
        type: 'error',
        timestamp: Date.now(),
      });
      return;
    }

    if (cmd === 'git') {
      const changes = collectGitChanges(state.files);
      if (args[0] === 'status' && changes.length === 0) {
        state.addTerminalLine({
          text: 'Virtual workspace status: clean. Use "cd <real path>" and "git status" in a real profile for desktop Git.',
          type: 'output',
          timestamp: Date.now(),
        });
        return;
      }
    }

    state.addTerminalLine({
      text: `Command not found: ${cmd}. Type "help" for grounded commands or switch profile with "profile use gemini".`,
      type: 'error',
      timestamp: Date.now(),
    });
  },
});
