import type { FileNode } from '../types';
import type { IDESetting } from '../types';

// ── Default project tree ──────────────────────────────────────────
export const DEFAULT_WORKSPACE_NAME = 'virtual-workspace';
export const DEFAULT_CWD = `/${DEFAULT_WORKSPACE_NAME}`;

export const DEFAULT_FILES: FileNode[] = [
  {
    id: 'root', name: DEFAULT_WORKSPACE_NAME, type: 'folder',
    children: [
      {
        id: 'src', name: 'src', type: 'folder',
        children: [
          { id: 'main-tsx', name: 'main.tsx', type: 'file', language: 'typescript', gitStatus: null, content: `import { createRoot } from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\ncreateRoot(document.getElementById('root')!).render(<App />);` },
          { id: 'app-tsx', name: 'App.tsx', type: 'file', language: 'typescript', gitStatus: 'modified', content: `// HAVEN — The Sovereign Algorithm\n// Built by أبو خوارزم\n\nexport default function App() {\n  return <div className="min-h-screen bg-haven-black">HAVEN</div>;\n}` },
          { id: 'index-css', name: 'index.css', type: 'file', language: 'css', gitStatus: null, content: `@import "tailwindcss";\n\nbody { @apply bg-haven-black text-white; }` },
          {
            id: 'components-folder', name: 'components', type: 'folder',
            children: [
              { id: 'hero-tsx', name: 'Hero.tsx', type: 'file', language: 'typescript', gitStatus: 'added', content: `export function Hero() {\n  return <section>HAVEN — The Sovereign Algorithm</section>;\n}` },
              { id: 'navbar-tsx', name: 'Navbar.tsx', type: 'file', language: 'typescript', gitStatus: 'added', content: `export function Navbar() {\n  return <nav>HAVEN</nav>;\n}` },
            ],
          },
          {
            id: 'lib-folder', name: 'lib', type: 'folder',
            children: [
              { id: 'utils-ts', name: 'utils.ts', type: 'file', language: 'typescript', gitStatus: null, content: `import { clsx } from 'clsx';\nimport { twMerge } from 'tailwind-merge';\n\nexport const cn = (...i: any[]) => twMerge(clsx(i));` },
            ],
          },
          {
            id: 'store-folder', name: 'store', type: 'folder',
            children: [
              { id: 'usestore-ts', name: 'useStore.ts', type: 'file', language: 'typescript', gitStatus: 'modified', content: `import { create } from 'zustand';\n\nexport const useStore = create((set) => ({\n  isSovereign: false,\n  toggleSovereign: () => set((s) => ({ isSovereign: !s.isSovereign })),\n}));` },
            ],
          },
        ],
      },
      { id: 'package-json', name: 'package.json', type: 'file', language: 'json', gitStatus: null, content: `{\n  "name": "haven-sovereign",\n  "version": "2.0.0",\n  "scripts": { "dev": "vite", "build": "tsc && vite build" }\n}` },
      { id: 'vite-config', name: 'vite.config.ts', type: 'file', language: 'typescript', gitStatus: null, content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({ plugins: [react()] });` },
      { id: 'tsconfig', name: 'tsconfig.json', type: 'file', language: 'json', gitStatus: null, content: `{\n  "compilerOptions": { "target": "ES2020", "jsx": "react-jsx", "strict": true }\n}` },
      { id: 'readme', name: 'README.md', type: 'file', language: 'markdown', gitStatus: null, content: `# HAVEN Virtual Workspace\n\nThis is a safe local sandbox inside HAVEN IDE.\n\n- Use **Open Folder** to load a real project from disk.\n- Drag and drop files or folders to import them.\n- Nothing here should pretend to be your real repository until you choose one.\n\nBuilt for human-first, local-first development.` },
      { id: 'env', name: '.env', type: 'file', language: 'plaintext', gitStatus: null, content: `VITE_APP_NAME=HAVEN\nVITE_SOVEREIGN_MODE=true` },
      { id: 'gitignore', name: '.gitignore', type: 'file', language: 'plaintext', gitStatus: null, content: `node_modules/\ndist/\n.env\n*.log` },
    ],
  },
];

// ── Default settings ──────────────────────────────────────────────
export const DEFAULT_SETTINGS: IDESetting[] = [
  { id: 'editor.fontSize', category: 'Editor', label: 'Font Size', description: 'Controls the font size in pixels', type: 'number', value: 14 },
  { id: 'editor.tabSize', category: 'Editor', label: 'Tab Size', description: 'The number of spaces a tab is equal to', type: 'number', value: 2 },
  { id: 'editor.wordWrap', category: 'Editor', label: 'Word Wrap', description: 'Controls how lines should wrap', type: 'select', value: 'on', options: ['on', 'off', 'wordWrapColumn', 'bounded'] },
  { id: 'editor.minimap', category: 'Editor', label: 'Minimap Enabled', description: 'Controls whether the minimap is shown', type: 'boolean', value: true },
  { id: 'editor.lineNumbers', category: 'Editor', label: 'Line Numbers', description: 'Controls the display of line numbers', type: 'select', value: 'on', options: ['on', 'off', 'relative', 'interval'] },
  { id: 'editor.bracketPairColorization', category: 'Editor', label: 'Bracket Pair Colorization', description: 'Colorize matching brackets', type: 'boolean', value: true },
  { id: 'editor.cursorBlinking', category: 'Editor', label: 'Cursor Blinking', description: 'Controls the cursor animation style', type: 'select', value: 'smooth', options: ['blink', 'smooth', 'phase', 'expand', 'solid'] },
  { id: 'editor.smoothScrolling', category: 'Editor', label: 'Smooth Scrolling', description: 'Enable smooth scrolling', type: 'boolean', value: true },
  { id: 'editor.formatOnPaste', category: 'Editor', label: 'Format On Paste', description: 'Format pasted content', type: 'boolean', value: true },
  { id: 'editor.fontLigatures', category: 'Editor', label: 'Font Ligatures', description: 'Enable font ligatures (e.g. => becomes arrow)', type: 'boolean', value: true },
  { id: 'editor.renderWhitespace', category: 'Editor', label: 'Render Whitespace', description: 'Controls how whitespace is rendered', type: 'select', value: 'selection', options: ['none', 'boundary', 'selection', 'trailing', 'all'] },
  { id: 'editor.cursorStyle', category: 'Editor', label: 'Cursor Style', description: 'Controls the cursor style', type: 'select', value: 'line', options: ['line', 'block', 'underline', 'line-thin', 'block-outline', 'underline-thin'] },
  { id: 'editor.scrollBeyondLastLine', category: 'Editor', label: 'Scroll Beyond Last Line', description: 'Allow scrolling past the last line', type: 'boolean', value: false },
  { id: 'editor.formatOnType', category: 'Editor', label: 'Format On Type', description: 'Auto-format while typing', type: 'boolean', value: true },
  { id: 'editor.guides.indentation', category: 'Editor', label: 'Indentation Guides', description: 'Show indentation guides in the editor', type: 'boolean', value: true },
  { id: 'editor.guides.bracketPairs', category: 'Editor', label: 'Bracket Pair Guides', description: 'Show bracket pair guides', type: 'boolean', value: true },
  { id: 'editor.renderLineHighlight', category: 'Editor', label: 'Render Line Highlight', description: 'Controls how the current line is highlighted', type: 'select', value: 'all', options: ['none', 'gutter', 'line', 'all'] },
  { id: 'terminal.fontSize', category: 'Terminal', label: 'Font Size', description: 'Terminal font size', type: 'number', value: 13 },
  { id: 'terminal.cursorBlink', category: 'Terminal', label: 'Cursor Blink', description: 'Blink the terminal cursor', type: 'boolean', value: true },
  { id: 'files.autoSave', category: 'Files', label: 'Auto Save', description: 'Auto save of editors', type: 'select', value: 'off', options: ['off', 'afterDelay', 'onFocusChange'] },
  { id: 'files.autoSaveDelay', category: 'Files', label: 'Auto Save Delay', description: 'Delay in ms before auto-saving (when afterDelay)', type: 'number', value: 3000 },
  { id: 'files.trimTrailingWhitespace', category: 'Files', label: 'Trim Trailing Whitespace', description: 'Trim trailing whitespace on save', type: 'boolean', value: false },
  { id: 'workbench.sidebarPosition', category: 'Workbench', label: 'Sidebar Position', description: 'Controls the sidebar position', type: 'select', value: 'left', options: ['left', 'right'] },
  { id: 'workbench.statusBarVisible', category: 'Workbench', label: 'Status Bar Visible', description: 'Show the status bar', type: 'boolean', value: true },
  { id: 'workbench.activityBarVisible', category: 'Workbench', label: 'Activity Bar Visible', description: 'Show the activity bar', type: 'boolean', value: true },
];

// ── ASCII art ─────────────────────────────────────────────────────
export const HAVEN_ASCII = `
 ██╗  ██╗ █████╗ ██╗   ██╗███████╗███╗   ██╗
 ██║  ██║██╔══██╗██║   ██║██╔════╝████╗  ██║
 ███████║███████║██║   ██║█████╗  ██╔██╗ ██║
 ██╔══██║██╔══██║╚██╗ ██╔╝██╔══╝  ██║╚██╗██║
 ██║  ██║██║  ██║ ╚████╔╝ ███████╗██║ ╚████║
 ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝
`;
