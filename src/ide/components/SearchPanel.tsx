import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useIDEStore } from '../useIDEStore';
import type { FileNode } from '../types';

// Helper to search files/content — supports regex & case-sensitive
function searchInFiles(
  nodes: FileNode[],
  query: string,
  path = '',
  isRegex = false,
  caseSensitive = false,
): { filePath: string; fileName: string; line: number; text: string; node: FileNode }[] {
  const results: { filePath: string; fileName: string; line: number; text: string; node: FileNode }[] = [];
  if (!query) return results;

  let regex: RegExp;
  try {
    const flags = caseSensitive ? 'g' : 'gi';
    regex = isRegex ? new RegExp(query, flags) : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
  } catch {
    return results; // invalid regex — skip
  }

  for (const node of nodes) {
    const currentPath = path ? `${path}/${node.name}` : node.name;
    if (node.type === 'file' && node.content && !node.content.startsWith('data:')) {
      const lines = node.content.split('\n');
      lines.forEach((line, i) => {
        regex.lastIndex = 0;
        if (regex.test(line)) {
          results.push({ filePath: currentPath, fileName: node.name, line: i + 1, text: line.trim(), node });
        }
      });
    }
    if (node.children) {
      results.push(...searchInFiles(node.children, query, currentPath, isRegex, caseSensitive));
    }
  }
  return results;
}

export function SearchPanel() {
  const { currentTheme, files, openFile, searchQuery, setSearchQuery, sidebarWidth } = useIDEStore();
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceQuery, setReplaceQuery] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        useIDEStore.getState().toggleSearch();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const effectiveQuery = wholeWord && !isRegex ? `\\b${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b` : searchQuery;

  // Only re-compute when files or search options change (not every keystroke)
  const results = useMemo(
    () => searchInFiles(files, effectiveQuery, '', isRegex || wholeWord, caseSensitive),
    [files, effectiveQuery, isRegex, wholeWord, caseSensitive],
  );

  // Group by file
  const grouped = useMemo(() => results.reduce((acc, r) => {
    if (!acc[r.filePath]) acc[r.filePath] = [];
    acc[r.filePath].push(r);
    return acc;
  }, {} as Record<string, typeof results>), [results]);

  // Replace all in virtual files
  const handleReplaceAll = () => {
    if (!searchQuery || !replaceQuery) return;
    const state = useIDEStore.getState();
    function replaceInTree(nodes: FileNode[]): FileNode[] {
      return nodes.map(n => {
        if (n.type === 'file' && n.content && !n.content.startsWith('data:')) {
          try {
            const flags = caseSensitive ? 'g' : 'gi';
            const re = isRegex ? new RegExp(searchQuery, flags) : new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
            const newContent = n.content.replace(re, replaceQuery);
            if (newContent !== n.content) return { ...n, content: newContent, gitStatus: 'modified' as const };
          } catch { /* skip invalid regex */ }
        }
        if (n.children) return { ...n, children: replaceInTree(n.children) };
        return n;
      });
    }
    useIDEStore.setState({ files: replaceInTree(state.files) });
    // Also update open tabs
    useIDEStore.setState(s => ({
      openTabs: s.openTabs.map(t => {
        try {
          const flags = caseSensitive ? 'g' : 'gi';
          const re = isRegex ? new RegExp(searchQuery, flags) : new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
          const newContent = t.content.replace(re, replaceQuery);
          if (newContent !== t.content) return { ...t, content: newContent, isModified: true };
        } catch { /* skip */ }
        return t;
      }),
    }));
    state.addNotification({ type: 'success', message: `Replaced ${results.length} occurrences` });
  };

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ width: sidebarWidth, backgroundColor: currentTheme.sidebar, borderRight: `1px solid ${currentTheme.border}` }}
    >
      <div className="px-3 py-2" style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
        <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: currentTheme.textMuted }}>
          Search
        </div>
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRegex ? 'Regex pattern...' : 'Search...'}
            className="flex-1 bg-transparent border rounded px-2 py-1 text-sm outline-none"
            style={{ borderColor: currentTheme.border, color: currentTheme.text }}
          />
          {/* Search option toggles */}
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold"
            style={{
              backgroundColor: caseSensitive ? currentTheme.accent + '30' : 'transparent',
              color: caseSensitive ? currentTheme.accent : currentTheme.textMuted,
              border: `1px solid ${caseSensitive ? currentTheme.accent + '50' : currentTheme.border}`,
            }}
            title="Match Case"
          >Aa</button>
          <button
            onClick={() => setWholeWord(!wholeWord)}
            className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold"
            style={{
              backgroundColor: wholeWord ? currentTheme.accent + '30' : 'transparent',
              color: wholeWord ? currentTheme.accent : currentTheme.textMuted,
              border: `1px solid ${wholeWord ? currentTheme.accent + '50' : currentTheme.border}`,
            }}
            title="Whole Word"
          >ab</button>
          <button
            onClick={() => setIsRegex(!isRegex)}
            className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold"
            style={{
              backgroundColor: isRegex ? currentTheme.accent + '30' : 'transparent',
              color: isRegex ? currentTheme.accent : currentTheme.textMuted,
              border: `1px solid ${isRegex ? currentTheme.accent + '50' : currentTheme.border}`,
            }}
            title="Use Regex"
          >.*</button>
        </div>
        {replaceOpen && (
          <div className="flex items-center gap-1 mt-1">
            <input
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="Replace..."
              className="flex-1 bg-transparent border rounded px-2 py-1 text-sm outline-none"
              style={{ borderColor: currentTheme.border, color: currentTheme.text }}
            />
            <button
              onClick={handleReplaceAll}
              className="px-2 h-6 flex items-center justify-center rounded text-xs hover:bg-white/10"
              style={{ color: currentTheme.accent, border: `1px solid ${currentTheme.accent}40` }}
              title="Replace All"
            >All</button>
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <button
            onClick={() => setReplaceOpen(!replaceOpen)}
            className="text-xs opacity-60 hover:opacity-100"
            style={{ color: currentTheme.text }}
          >
            {replaceOpen ? '▾ Replace' : '▸ Replace'}
          </button>
          {searchQuery && (
            <span className="text-xs ml-auto" style={{ color: currentTheme.textMuted }}>
              {results.length} result{results.length !== 1 ? 's' : ''} in {Object.keys(grouped).length} file{Object.keys(grouped).length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="py-1">
        {Object.entries(grouped).map(([filePath, matches]: [string, typeof results]) => (
          <div key={filePath}>
            <div
              className="px-3 py-1 text-xs font-semibold flex items-center justify-between"
              style={{ color: currentTheme.text }}
            >
              <span className="truncate">{filePath}</span>
              <span className="text-xs ml-1" style={{ color: currentTheme.textMuted }}>
                {matches.length}
              </span>
            </div>
            {matches.slice(0, 20).map((match, i) => (
              <div
                key={i}
                className="px-4 py-0.5 text-xs cursor-pointer hover:bg-white/5 truncate"
                style={{ color: currentTheme.textMuted }}
                onClick={() => openFile(match.node, match.filePath)}
              >
                <span className="mr-2 opacity-40">{match.line}:</span>
                <HighlightedText text={match.text} query={searchQuery} accent={currentTheme.accent} isRegex={isRegex} />
              </div>
            ))}
            {matches.length > 20 && (
              <div className="px-4 py-0.5 text-xs opacity-40" style={{ color: currentTheme.textMuted }}>
                +{matches.length - 20} more matches
              </div>
            )}
          </div>
        ))}
        {searchQuery && results.length === 0 && (
          <div className="px-4 py-6 text-center text-xs" style={{ color: currentTheme.textMuted }}>
            No results found
          </div>
        )}
      </div>
    </div>
  );
}

function HighlightedText({ text, query, accent, isRegex }: { text: string; query: string; accent: string; isRegex?: boolean }) {
  if (!query) return <span>{text}</span>;
  try {
    const escaped = isRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => {
          const re = new RegExp(`^${escaped}$`, 'i');
          return re.test(part) ? (
            <span key={i} style={{ backgroundColor: accent + '40', color: accent }}>{part}</span>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
      </span>
    );
  } catch {
    return <span>{text}</span>;
  }
}
