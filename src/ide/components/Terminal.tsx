import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useIDEStore } from '../useIDEStore';
import {
  Zap, X, Plus, ChevronRight,
  XCircle, AlertTriangle, Info, CheckCircle2,
  Bug, Play
} from 'lucide-react';

// ── Available command names for tab completion ──────────────────
const ALL_COMMANDS = [
  'help', 'clear', 'cls', 'exit', 'echo', 'ls', 'cd', 'pwd', 'whoami', 'date',
  'neofetch', 'theme', 'cat', 'ascii', 'touch', 'mkdir', 'rm',
  'git', 'npm', 'node', 'python', 'py', 'ollama', 'gemini',
  'tools', 'profile', 'haven', 'phalanx', 'niyah', 'scan', 'msf', 'zen', 'open', 'save',
];

export function Terminal() {
  const {
    terminalVisible, terminals, activeTerminalId, executeCommand, currentTheme,
    createTerminal, closeTerminal, setActiveTerminal, terminalHeight,
    bottomPanelTab, setBottomPanelTab, toggleTerminal,
  } = useIDEStore();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTerminal = terminals.find(t => t.id === activeTerminalId);
  const terminalLines = activeTerminal?.lines || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLines]);

  if (!terminalVisible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setHistory((prev) => [...prev, input]);
    setHistoryIndex(-1);
    executeCommand(input);
    setInput('');
  };

  // ── Fixed history navigation + Tab completion + Ctrl+L ────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      setInput(history[history.length - 1 - newIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = historyIndex - 1;
      setHistoryIndex(Math.max(newIndex, -1));
      setInput(newIndex < 0 ? '' : history[history.length - 1 - newIndex]);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (!input.trim()) return;
      const partial = input.trim().toLowerCase();
      const matches = ALL_COMMANDS.filter(c => c.startsWith(partial));
      if (matches.length === 1) {
        setInput(matches[0] + ' ');
      } else if (matches.length > 1) {
        useIDEStore.getState().addTerminalLine({ text: matches.join('  '), type: 'system', timestamp: Date.now() });
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      executeCommand('clear');
    }
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case 'input': return currentTheme.accent;
      case 'error': return '#ef4444';
      case 'success': return '#22c55e';
      case 'system': return currentTheme.accent + '99';
      default: return currentTheme.text;
    }
  };

  const panelTabs = [
    { key: 'terminal', label: 'Terminal', icon: Zap },
    { key: 'problems', label: 'Problems', icon: AlertTriangle },
    { key: 'output', label: 'Output', icon: Info },
    { key: 'debug console', label: 'Debug Console', icon: Bug },
  ];

  return (
    <div
      className="flex flex-col border-t shrink-0"
      style={{
        backgroundColor: currentTheme.bg,
        borderColor: currentTheme.border,
        height: terminalHeight,
      }}
    >
      {/* Panel header with tabs */}
      <div
        className="flex items-center justify-between px-1 text-xs shrink-0"
        style={{ borderBottom: `1px solid ${currentTheme.border}`, color: currentTheme.textMuted }}
      >
        <div className="flex items-center" role="tablist" aria-label="Panel tabs">
          {panelTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = bottomPanelTab === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setBottomPanelTab(tab.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 transition-colors"
                style={{
                  color: isActive ? currentTheme.accent : currentTheme.textMuted,
                  borderBottom: isActive ? `1px solid ${currentTheme.accent}` : '1px solid transparent',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 pr-2">
          {/* Terminal instance tabs */}
          {terminals.map(term => (
            <div
              key={term.id}
              className="flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer group"
              style={{
                backgroundColor: term.id === activeTerminalId ? currentTheme.accent + '15' : 'transparent',
                color: term.id === activeTerminalId ? currentTheme.accent : currentTheme.textMuted,
              }}
              onClick={() => setActiveTerminal(term.id)}
              title={`Profile: ${term.profile}`}
            >
              <Zap size={11} />
              <span className="text-xs">{term.name}</span>
              <span className="text-[9px] uppercase opacity-70">{term.profile}</span>
              {terminals.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); closeTerminal(term.id); }}
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 ml-0.5"
                  aria-label={`Close ${term.name}`}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => createTerminal()}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10"
            style={{ color: currentTheme.textMuted }}
            title="New Terminal"
            aria-label="New terminal"
          >
            <Plus size={13} />
          </button>
          <button
            onClick={() => toggleTerminal()}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 ml-1"
            style={{ color: currentTheme.textMuted }}
            title="Close Panel"
            aria-label="Close panel"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Terminal output */}
      {bottomPanelTab === 'terminal' && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 py-2 font-mono text-sm"
          onClick={() => inputRef.current?.focus()}
          style={{ color: currentTheme.text }}
        >
          {terminalLines.map((line, i) => (
            <pre
              key={i}
              className="whitespace-pre-wrap break-words leading-relaxed"
              style={{ color: getLineColor(line.type) }}
            >
              {line.text}
            </pre>
          ))}

          <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
            <ChevronRight
              size={14}
              style={{ color: currentTheme.accent }}
              className="shrink-0"
              aria-hidden
            />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none font-mono text-sm caret-current"
              style={{ color: currentTheme.text, caretColor: currentTheme.accent }}
              spellCheck={false}
              autoComplete="off"
              aria-label="Terminal input"
              placeholder="Type a command…"
            />
          </form>
        </div>
      )}

      {/* Problems tab */}
      {bottomPanelTab === 'problems' && (
        <ProblemsPanel />
      )}

      {/* Output tab */}
      {bottomPanelTab === 'output' && (
        <OutputPanel />
      )}

      {/* Debug Console */}
      {bottomPanelTab === 'debug console' && (
        <DebugConsolePanel />
      )}
    </div>
  );
}

// ── Problems Panel (memoized scan) ──────────────────────────────
interface Problem {
  file: string;
  line: number;
  col: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  source: string;
}

function ProblemsPanel() {
  const { openTabs, currentTheme } = useIDEStore();

  // Only re-compute diagnostics when open tabs change
  const problems = useMemo<Problem[]>(() => {
    const results: Problem[] = [];
    for (const tab of openTabs) {
      const lines = tab.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/\bany\b/.test(line) && /:\s*any/.test(line)) {
          results.push({ file: tab.name, line: i + 1, col: line.indexOf('any') + 1, severity: 'warning', message: 'Unexpected any. Specify a more specific type.', source: 'typescript' });
        }
        if (/console\.(log|warn|error|debug)/.test(line)) {
          results.push({ file: tab.name, line: i + 1, col: line.indexOf('console') + 1, severity: 'warning', message: 'Unexpected console statement.', source: 'eslint' });
        }
        if (/TODO|FIXME|HACK/.test(line)) {
          results.push({ file: tab.name, line: i + 1, col: 1, severity: 'info', message: line.trim().substring(0, 80), source: 'todo-tree' });
        }
      }
    }
    return results;
  }, [openTabs]);

  const counts = useMemo(() => ({
    errors: problems.filter(p => p.severity === 'error').length,
    warnings: problems.filter(p => p.severity === 'warning').length,
    infos: problems.filter(p => p.severity === 'info').length,
  }), [problems]);

  const SeverityIcon = ({ severity }: { severity: string }) => {
    if (severity === 'error') return <XCircle size={12} className="text-red-500 shrink-0" />;
    if (severity === 'warning') return <AlertTriangle size={12} className="text-yellow-400 shrink-0" />;
    return <Info size={12} className="text-blue-400 shrink-0" />;
  };

  const severityColor = (s: string) => s === 'error' ? '#ef4444' : s === 'warning' ? '#fbbf24' : '#60a5fa';

  return (
    <div role="tabpanel" className="flex-1 overflow-y-auto px-3 py-2">
      <div className="flex items-center gap-4 mb-2 text-xs" style={{ color: currentTheme.textMuted }}>
        <span className="flex items-center gap-1" style={{ color: '#ef4444' }}>
          <XCircle size={12} /> {counts.errors}
        </span>
        <span className="flex items-center gap-1" style={{ color: '#fbbf24' }}>
          <AlertTriangle size={12} /> {counts.warnings}
        </span>
        <span className="flex items-center gap-1" style={{ color: '#60a5fa' }}>
          <Info size={12} /> {counts.infos}
        </span>
      </div>

      {problems.length === 0 && (
        <div className="flex items-center gap-2 text-xs py-4 justify-center" style={{ color: currentTheme.textMuted }}>
          <CheckCircle2 size={14} className="text-green-400" />
          <span>No problems detected in workspace</span>
        </div>
      )}

      <div className="space-y-0.5">
        {problems.slice(0, 50).map((p, i) => (
          <div key={i} className="flex items-start gap-2 px-1 py-1 rounded text-xs hover:bg-white/5 cursor-pointer">
            <SeverityIcon severity={p.severity} />
            <span className="flex-1 break-words" style={{ color: severityColor(p.severity) }}>{p.message}</span>
            <span className="shrink-0 font-mono opacity-50" style={{ color: currentTheme.textMuted }}>
              {p.file}:{p.line}:{p.col}
            </span>
            <span className="shrink-0 opacity-30 font-mono" style={{ color: currentTheme.textMuted }}>{p.source}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Output Panel with live IDE logs (memoized) ─────────────────
function OutputPanel() {
  const { currentTheme, themeName, isRealFS, openTabs, files } = useIDEStore();
  const startTime = useRef(new Date().toLocaleTimeString());

  const logs = useMemo(() => {
    const now = startTime.current;
    const isElectron = typeof window !== 'undefined' && 'haven' in window;
    return [
      { time: now, msg: 'HAVEN IDE v5.0 — Sovereign Edition initialized', type: 'info' as const },
      { time: now, msg: `Editor: Monaco (${openTabs.length} tab${openTabs.length !== 1 ? 's' : ''} open)`, type: 'info' as const },
      { time: now, msg: `Theme: ${themeName}`, type: 'info' as const },
      { time: now, msg: `Filesystem: ${isRealFS ? 'LIVE (Electron IPC → OS)' : 'Virtual (in-memory)'}`, type: isRealFS ? 'success' as const : 'info' as const },
      { time: now, msg: `Project: ${countFiles(files)} files indexed`, type: 'info' as const },
      { time: now, msg: `Runtime: ${isElectron ? 'Electron (desktop)' : 'Browser (web)'}`, type: 'info' as const },
      { time: now, msg: `Ollama: checking 127.0.0.1:11434...`, type: 'info' as const },
      { time: now, msg: 'Niyah Engine: Three-Lobe architecture ready', type: 'success' as const },
      { time: now, msg: 'Phalanx: sovereign mode active', type: 'success' as const },
      { time: now, msg: 'Ready', type: 'success' as const },
    ];
  }, [openTabs.length, themeName, isRealFS, files]);

  const logColor = (type: string) => type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : currentTheme.textMuted;

  return (
    <div role="tabpanel" className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs" style={{ color: currentTheme.textMuted }}>
      {logs.map((l, i) => (
        <div key={i} className="flex gap-2 leading-relaxed">
          <span className="opacity-40 shrink-0">[{l.time}]</span>
          <span style={{ color: logColor(l.type) }}>{l.msg}</span>
        </div>
      ))}
    </div>
  );
}

function countFiles(nodes: import('../types').FileNode[]): number {
  let count = 0;
  for (const n of nodes) {
    if (n.type === 'file') count++;
    if (n.children) count += countFiles(n.children);
  }
  return count;
}

// ── Debug Console Panel ─────────────────────────────────────────
function DebugConsolePanel() {
  const { currentTheme } = useIDEStore();
  const [history, setHistory] = React.useState<{ input: string; output: string; isError: boolean }[]>([]);
  const [cmd, setCmd] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const runEval = () => {
    if (!cmd.trim()) return;
    let output: string;
    let isError = false;
    try {
      const result = Function('"use strict"; return (' + cmd + ')')();
      output = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
    } catch (e) {
      output = String(e);
      isError = true;
    }
    setHistory(prev => [...prev, { input: cmd, output, isError }]);
    setCmd('');
    setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 50);
  };

  return (
    <div role="tabpanel" className="flex-1 flex flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs space-y-1" style={{ color: currentTheme.text }}>
        {history.length === 0 && (
          <p className="opacity-30 py-2">Debug Console — type JavaScript expressions below</p>
        )}
        {history.map((h, i) => (
          <div key={i}>
            <div className="flex gap-1"><span style={{ color: currentTheme.accent }}>{'>'}</span><span>{h.input}</span></div>
            <div className="pl-3" style={{ color: h.isError ? '#ef4444' : '#22c55e' }}>{h.output}</div>
          </div>
        ))}
      </div>
      <div className="px-2 py-1 border-t flex items-center gap-1" style={{ borderColor: currentTheme.border }}>
        <span className="text-xs font-mono" style={{ color: currentTheme.accent }}>{'>'}</span>
        <input
          value={cmd}
          onChange={e => setCmd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runEval()}
          placeholder="Evaluate expression..."
          className="flex-1 bg-transparent outline-none text-xs font-mono"
          style={{ color: currentTheme.text }}
        />
      </div>
    </div>
  );
}
