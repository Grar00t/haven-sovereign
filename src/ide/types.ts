export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  language?: string;
  icon?: string;
  gitStatus?: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed' | null;
}

export interface Tab {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  isModified: boolean;
  isPinned: boolean;
  isPreview: boolean;
  editorGroupId: number;
}

export interface EditorGroup {
  id: number;
  tabs: string[]; // tab IDs
  activeTabId: string | null;
  size: number; // percentage
}

export type TerminalProfile = 'local' | 'python' | 'local-ai' | 'gemini' | 'forensics' | 'msf';

export interface TerminalInstance {
  id: string;
  name: string;
  lines: TerminalLine[];
  cwd: string;
  profile: TerminalProfile;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  detail?: string;
  timestamp: number;
  actions?: { label: string; action: () => void }[];
}

export interface IDESetting {
  id: string;
  category: string;
  label: string;
  description: string;
  type: 'boolean' | 'number' | 'string' | 'select';
  value: boolean | number | string;
  options?: string[];
}

export interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'system' | 'success';
  timestamp: number;
}

export interface IDETheme {
  name: string;
  bg: string;
  sidebar: string;
  editor: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
  selection: string;
  lineHighlight: string;
}

export const HAVEN_THEMES: Record<string, IDETheme> = {
  'haven-dark': {
    name: 'Haven Dark',
    bg: '#050505',
    sidebar: '#0a0a0a',
    editor: '#0d0d0d',
    accent: '#00FF00',
    text: '#e0e0e0',
    textMuted: '#666666',
    border: '#1a1a1a',
    selection: '#00FF0020',
    lineHighlight: '#ffffff08',
  },
  'sovereign-gold': {
    name: 'Sovereign Gold',
    bg: '#0a0800',
    sidebar: '#0d0b00',
    editor: '#100e02',
    accent: '#FFD700',
    text: '#e0d8b0',
    textMuted: '#8a7a40',
    border: '#2a2200',
    selection: '#FFD70020',
    lineHighlight: '#FFD70008',
  },
  'dragon-403': {
    name: 'Dragon 403',
    bg: '#0a0005',
    sidebar: '#0d0008',
    editor: '#10000a',
    accent: '#FF0040',
    text: '#e0b0c0',
    textMuted: '#8a4060',
    border: '#2a0015',
    selection: '#FF004020',
    lineHighlight: '#FF004008',
  },
  'monokai-pro': {
    name: 'Monokai Pro',
    bg: '#2d2a2e',
    sidebar: '#221f22',
    editor: '#2d2a2e',
    accent: '#ffd866',
    text: '#fcfcfa',
    textMuted: '#727072',
    border: '#403e41',
    selection: '#ffd86630',
    lineHighlight: '#ffffff08',
  },
  'one-dark-pro': {
    name: 'One Dark Pro',
    bg: '#282c34',
    sidebar: '#21252b',
    editor: '#282c34',
    accent: '#61afef',
    text: '#abb2bf',
    textMuted: '#636d83',
    border: '#3e4452',
    selection: '#61afef30',
    lineHighlight: '#2c313a',
  },
  'catppuccin-mocha': {
    name: 'Catppuccin Mocha',
    bg: '#1e1e2e',
    sidebar: '#181825',
    editor: '#1e1e2e',
    accent: '#cba6f7',
    text: '#cdd6f4',
    textMuted: '#6c7086',
    border: '#313244',
    selection: '#cba6f720',
    lineHighlight: '#31324480',
  },
  'tokyo-night': {
    name: 'Tokyo Night',
    bg: '#1a1b26',
    sidebar: '#16161e',
    editor: '#1a1b26',
    accent: '#7aa2f7',
    text: '#a9b1d6',
    textMuted: '#565f89',
    border: '#292e42',
    selection: '#7aa2f720',
    lineHighlight: '#292e4280',
  },
  'github-dark': {
    name: 'GitHub Dark',
    bg: '#0d1117',
    sidebar: '#010409',
    editor: '#0d1117',
    accent: '#58a6ff',
    text: '#c9d1d9',
    textMuted: '#8b949e',
    border: '#21262d',
    selection: '#58a6ff30',
    lineHighlight: '#161b2280',
  },
  'nord': {
    name: 'Nord',
    bg: '#2e3440',
    sidebar: '#272c36',
    editor: '#2e3440',
    accent: '#88c0d0',
    text: '#d8dee9',
    textMuted: '#616e88',
    border: '#3b4252',
    selection: '#88c0d020',
    lineHighlight: '#3b425280',
  },
  'dracula': {
    name: 'Dracula',
    bg: '#282a36',
    sidebar: '#21222c',
    editor: '#282a36',
    accent: '#bd93f9',
    text: '#f8f8f2',
    textMuted: '#6272a4',
    border: '#44475a',
    selection: '#bd93f930',
    lineHighlight: '#44475a50',
  },
};

export const FILE_ICONS: Record<string, string> = {
  ts: '🟦',
  tsx: '⚛️',
  js: '🟨',
  jsx: '⚛️',
  css: '🎨',
  html: '🌐',
  json: '📋',
  md: '📝',
  py: '🐍',
  rs: '🦀',
  go: '🐹',
  java: '☕',
  cpp: '⚡',
  c: '⚡',
  sh: '🐚',
  yml: '⚙️',
  yaml: '⚙️',
  toml: '⚙️',
  svg: '🖼️',
  png: '🖼️',
  jpg: '🖼️',
  gif: '🖼️',
  txt: '📄',
  env: '🔒',
  gitignore: '🙈',
  lock: '🔐',
};

export function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return FILE_ICONS[ext] || '📄';
}

export const LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  css: 'css',
  html: 'html',
  json: 'json',
  md: 'markdown',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  sh: 'shell',
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'ini',
  svg: 'xml',
  txt: 'plaintext',
};
