import React, { useMemo } from 'react';
import { useIDEStore } from '../useIDEStore';

interface Symbol {
  name: string;
  kind: 'function' | 'class' | 'variable' | 'interface' | 'type' | 'import' | 'export' | 'method' | 'property' | 'enum' | 'const';
  line: number;
  indent: number;
}

const SYMBOL_ICONS: Record<string, string> = {
  function: '𝑓',
  class: '𝐶',
  variable: '𝑥',
  interface: '𝐼',
  type: '𝑇',
  import: '↓',
  export: '↑',
  method: '𝑚',
  property: '◆',
  enum: '𝐸',
  const: '𝐾',
};

const SYMBOL_COLORS: Record<string, string> = {
  function: '#c084fc',
  class: '#fbbf24',
  variable: '#60a5fa',
  interface: '#34d399',
  type: '#34d399',
  import: '#94a3b8',
  export: '#f472b6',
  method: '#c084fc',
  property: '#60a5fa',
  enum: '#fbbf24',
  const: '#fb923c',
};

function parseSymbols(content: string, language: string): Symbol[] {
  const symbols: Symbol[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    // Imports
    if (/^import\s/.test(trimmed)) {
      const m = trimmed.match(/import\s+(?:{([^}]+)}|\*\s+as\s+(\w+)|(\w+))/);
      if (m) symbols.push({ name: `import ${(m[1] || m[2] || m[3] || '').trim().substring(0, 30)}`, kind: 'import', line: i + 1, indent: 0 });
      continue;
    }

    // Export default
    if (/^export\s+default\s/.test(trimmed)) {
      const m = trimmed.match(/export\s+default\s+(?:function|class)?\s*(\w+)?/);
      symbols.push({ name: `export default ${m?.[1] || ''}`.trim(), kind: 'export', line: i + 1, indent: 0 });
      continue;
    }

    // Class
    if (/^(?:export\s+)?class\s+\w+/.test(trimmed)) {
      const m = trimmed.match(/class\s+(\w+)/);
      if (m) symbols.push({ name: m[1], kind: 'class', line: i + 1, indent: Math.floor(indent / 2) });
      continue;
    }

    // Interface / Type
    if (/^(?:export\s+)?(?:interface|type)\s+\w+/.test(trimmed)) {
      const m = trimmed.match(/(interface|type)\s+(\w+)/);
      if (m) symbols.push({ name: m[2], kind: m[1] as 'interface' | 'type', line: i + 1, indent: Math.floor(indent / 2) });
      continue;
    }

    // Enum
    if (/^(?:export\s+)?enum\s+\w+/.test(trimmed)) {
      const m = trimmed.match(/enum\s+(\w+)/);
      if (m) symbols.push({ name: m[1], kind: 'enum', line: i + 1, indent: Math.floor(indent / 2) });
      continue;
    }

    // Function declarations (arrow + named)
    if (/^(?:export\s+)?(?:async\s+)?function\s+\w+/.test(trimmed)) {
      const m = trimmed.match(/function\s+(\w+)/);
      if (m) symbols.push({ name: m[1], kind: 'function', line: i + 1, indent: Math.floor(indent / 2) });
      continue;
    }

    // Arrow functions assigned to const/let/var
    if (/^(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:\(|<)/.test(trimmed)) {
      const m = trimmed.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\(|<)/);
      if (m) symbols.push({ name: m[1], kind: 'function', line: i + 1, indent: Math.floor(indent / 2) });
      continue;
    }

    // Const/let/var (non-function)
    if (/^(?:export\s+)?(?:const|let|var)\s+\w+/.test(trimmed) && !/=>/.test(trimmed)) {
      const m = trimmed.match(/(?:const|let|var)\s+(\w+)/);
      if (m) {
        const isConst = trimmed.startsWith('const') || trimmed.startsWith('export const');
        symbols.push({ name: m[1], kind: isConst ? 'const' : 'variable', line: i + 1, indent: Math.floor(indent / 2) });
      }
      continue;
    }

    // Python-style function/class
    if (language === 'python') {
      if (/^def\s+\w+/.test(trimmed)) {
        const m = trimmed.match(/def\s+(\w+)/);
        if (m) symbols.push({ name: m[1], kind: 'function', line: i + 1, indent: Math.floor(indent / 4) });
      }
      if (/^class\s+\w+/.test(trimmed)) {
        const m = trimmed.match(/class\s+(\w+)/);
        if (m) symbols.push({ name: m[1], kind: 'class', line: i + 1, indent: Math.floor(indent / 4) });
      }
    }
  }

  return symbols;
}

export function OutlinePanel() {
  const { openTabs, activeTabId, currentTheme, sidebarWidth, setCursorPosition } = useIDEStore();
  const activeTab = openTabs.find(t => t.id === activeTabId);

  const symbols = useMemo(() => {
    if (!activeTab) return [];
    return parseSymbols(activeTab.content, activeTab.language);
  }, [activeTab?.content, activeTab?.language]);

  const goToSymbol = (line: number) => {
    setCursorPosition(line, 1);
    // Try to tell Monaco to go to this line
    const editors = (window as any).monaco?.editor?.getEditors?.();
    if (editors?.[0]) {
      editors[0].revealLineInCenter(line);
      editors[0].setPosition({ lineNumber: line, column: 1 });
      editors[0].focus();
    }
  };

  return (
    <div
      className="h-full overflow-y-auto overflow-x-hidden select-none"
      style={{ width: sidebarWidth, backgroundColor: currentTheme.sidebar }}
    >
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center justify-between"
        style={{ color: currentTheme.textMuted }}>
        <span>Outline</span>
        {symbols.length > 0 && (
          <span className="text-xs opacity-50">{symbols.length}</span>
        )}
      </div>

      {!activeTab && (
        <div className="px-4 py-6 text-center text-xs" style={{ color: currentTheme.textMuted }}>
          <p className="opacity-50">No file open</p>
        </div>
      )}

      {activeTab && symbols.length === 0 && (
        <div className="px-4 py-6 text-center text-xs" style={{ color: currentTheme.textMuted }}>
          <p className="opacity-50">No symbols found</p>
          <p className="text-[10px] mt-1 opacity-30">Open a code file to see its outline</p>
        </div>
      )}

      <div className="px-1">
        {symbols.map((sym, i) => (
          <button
            key={`${sym.name}-${sym.line}-${i}`}
            onClick={() => goToSymbol(sym.line)}
            className="w-full text-left flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-white/5 transition-colors group"
            style={{ paddingLeft: `${sym.indent * 12 + 12}px` }}
          >
            <span className="w-4 text-center font-bold text-[11px] shrink-0"
              style={{ color: SYMBOL_COLORS[sym.kind] || currentTheme.textMuted }}>
              {SYMBOL_ICONS[sym.kind] || '●'}
            </span>
            <span className="truncate" style={{ color: currentTheme.text }}>{sym.name}</span>
            <span className="ml-auto text-[10px] opacity-0 group-hover:opacity-50 shrink-0"
              style={{ color: currentTheme.textMuted }}>
              :{sym.line}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
