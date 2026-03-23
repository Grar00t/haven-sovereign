import { useState, useRef, useEffect, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useIDEStore } from '../useIDEStore';
import { Loader2, FolderOpen, Keyboard, AlertTriangle, ZoomIn, ZoomOut, RotateCcw, ImageIcon, FileText, Columns, Sparkles, Brain } from 'lucide-react';
import { getNiyahCompletionAsync, cancelPendingFIM, type CompletionContext } from '../engine/NiyahCompletionProvider';

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp']);

export function CodeEditor() {
  const {
    openTabs, activeTabId, updateTabContent, currentTheme, minimapVisible,
    setCursorPosition, openRealFolder, isRealFS, getSetting,
    markdownPreviewVisible, toggleMarkdownPreview,
  } = useIDEStore();

  // ── Settings ─────────────────────────────────────────────────
  const fontSize = getSetting('editor.fontSize') as number || 14;
  const tabSize = getSetting('editor.tabSize') as number || 2;
  const wordWrap = getSetting('editor.wordWrap') as string || 'on';
  const lineNumbers = getSetting('editor.lineNumbers') as string || 'on';
  const cursorBlinking = getSetting('editor.cursorBlinking') as string || 'smooth';
  const fontLigatures = getSetting('editor.fontLigatures') as boolean;
  const renderWhitespace = getSetting('editor.renderWhitespace') as string || 'selection';
  const cursorStyle = getSetting('editor.cursorStyle') as string || 'line';
  const scrollBeyondLastLine = getSetting('editor.scrollBeyondLastLine') as boolean;
  const formatOnType = getSetting('editor.formatOnType') as boolean;
  const formatOnPaste = getSetting('editor.formatOnPaste') as boolean;
  const bracketPairColor = getSetting('editor.bracketPairColorization') as boolean;
  const guidesIndent = getSetting('editor.guides.indentation') as boolean;
  const guidesBracket = getSetting('editor.guides.bracketPairs') as boolean;
  const renderLineHighlight = getSetting('editor.renderLineHighlight') as string || 'all';
  const smoothScrolling = getSetting('editor.smoothScrolling') as boolean;

  // ── Error / loading state ────────────────────────────────────
  const [monacoError, setMonacoError] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const mdPreviewRef = useRef<HTMLDivElement>(null);

  const activeTab = openTabs.find((t) => t.id === activeTabId);

  // Reset image zoom when tab changes
  useEffect(() => { setImageZoom(1); }, [activeTabId]);

  // ── Welcome screen (no tab open) ────────────────────────────
  if (!activeTab) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-6 select-none"
        style={{ backgroundColor: currentTheme.editor, color: currentTheme.textMuted }}
      >
        {/* Logo */}
        <div className="relative">
          <div
            className="text-7xl font-black tracking-tighter opacity-[0.08]"
            style={{ color: currentTheme.accent }}
          >
            HAVEN
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center text-5xl opacity-20"
            style={{ filter: `drop-shadow(0 0 40px ${currentTheme.accent}40)` }}
          >
            ⚡
          </div>
        </div>

        <div className="text-center space-y-3 max-w-md">
          <p className="text-lg font-semibold" style={{ color: currentTheme.accent, opacity: 0.5 }}>
            The Sovereign Development Environment
          </p>

          {/* Open Folder */}
          <button
            onClick={openRealFolder}
            className="mt-4 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 flex items-center gap-2 mx-auto"
            style={{
              backgroundColor: currentTheme.accent + '15',
              color: currentTheme.accent,
              border: `1px solid ${currentTheme.accent}40`,
            }}
            aria-label="Open folder from disk"
          >
            <FolderOpen className="w-4 h-4" />
            Open Folder
          </button>

          {isRealFS && (
            <p className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: '#22c55e' }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Connected to real file system
            </p>
          )}

          {/* Keyboard Shortcuts */}
          <div className="mt-8 space-y-2.5 text-xs opacity-50">
            {[
              ['Ctrl+S', 'Save File to Disk'],
              ['Ctrl+P', 'Quick Open File'],
              ['Ctrl+Shift+P', 'Command Palette'],
              ['Ctrl+`', 'Toggle Terminal'],
              ['Ctrl+B', 'Toggle Sidebar'],
              ['Ctrl+K Z', 'Zen Mode'],
            ].map(([key, desc]) => (
              <p key={key} className="flex items-center justify-center gap-2">
                <kbd
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-medium"
                  style={{
                    backgroundColor: currentTheme.border,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  {key}
                </kbd>
                <span>{desc}</span>
              </p>
            ))}
            <p className="mt-4 opacity-70 italic">or drag & drop files/folders anywhere</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Image preview (with zoom controls) ───────────────────────
  const ext = activeTab.name.split('.').pop()?.toLowerCase() || '';
  const isImage = IMAGE_EXTS.has(ext);

  if (isImage && activeTab.content.startsWith('data:')) {
    return (
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ backgroundColor: currentTheme.editor }}
      >
        {/* Image toolbar */}
        <div
          className="flex items-center gap-2 px-4 py-2 border-b shrink-0"
          style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.bg }}
        >
          <ImageIcon className="w-3.5 h-3.5" style={{ color: currentTheme.textMuted }} />
          <span className="text-xs font-mono" style={{ color: currentTheme.textMuted }}>
            {activeTab.name}
          </span>
          <span className="text-xs opacity-40 ml-2">{Math.round(imageZoom * 100)}%</span>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setImageZoom(z => Math.max(0.1, z - 0.25))}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              style={{ color: currentTheme.textMuted }}
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setImageZoom(1)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              style={{ color: currentTheme.textMuted }}
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setImageZoom(z => Math.min(5, z + 0.25))}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              style={{ color: currentTheme.textMuted }}
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Image canvas */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-8">
          <img
            src={activeTab.content}
            alt={activeTab.name}
            className="object-contain rounded-lg shadow-xl transition-transform duration-200"
            style={{
              border: `1px solid ${currentTheme.border}`,
              maxWidth: '100%',
              maxHeight: '100%',
              transform: `scale(${imageZoom})`,
              transformOrigin: 'center center',
            }}
          />
        </div>
      </div>
    );
  }

  // ── Markdown split preview ───────────────────────────────────
  if (ext === 'md' && markdownPreviewVisible) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: currentTheme.editor }}>
        {/* Toolbar */}
        <div
          className="flex items-center gap-2 px-4 py-1.5 border-b shrink-0"
          style={{ borderColor: currentTheme.border, backgroundColor: currentTheme.bg }}
        >
          <FileText className="w-3.5 h-3.5" style={{ color: currentTheme.textMuted }} />
          <span className="text-xs font-mono" style={{ color: currentTheme.textMuted }}>
            {activeTab.name}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={toggleMarkdownPreview}
              className="p-1 rounded hover:bg-white/10 transition-colors flex items-center gap-1.5"
              style={{ color: currentTheme.accent }}
              aria-label="Toggle markdown preview"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono">Preview</span>
            </button>
          </div>
        </div>

        {/* Split view */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language="markdown"
              value={activeTab.content}
              onChange={(v) => v !== undefined && updateTabContent(activeTab.id, v)}
              theme="haven-dark"
              options={{
                fontSize,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                wordWrap: 'on',
                minimap: { enabled: false },
                automaticLayout: true,
                lineNumbers: 'on',
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          <div
            ref={mdPreviewRef}
            className="flex-1 overflow-auto p-8 prose prose-invert max-w-none
                       prose-headings:text-current prose-a:text-blue-400
                       prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                       prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-lg
                       prose-blockquote:border-l-2 prose-img:rounded-lg"
            style={{
              borderLeft: `1px solid ${currentTheme.border}`,
              color: currentTheme.text,
              borderColor: `${currentTheme.accent}40`,
            }}
            dangerouslySetInnerHTML={{ __html: richMarkdown(activeTab.content, currentTheme.accent) }}
          />
        </div>
      </div>
    );
  }

  // ── Monaco Error Fallback ────────────────────────────────────
  if (monacoError) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-4 p-8"
        style={{ backgroundColor: currentTheme.editor, color: currentTheme.text }}
      >
        <AlertTriangle className="w-10 h-10 text-amber-400 opacity-60" />
        <p className="text-sm font-semibold opacity-80">Failed to load Monaco Editor</p>
        <p className="text-xs opacity-40 max-w-md text-center">{monacoError}</p>
        <button
          onClick={() => { setMonacoError(null); }}
          className="mt-2 px-4 py-2 rounded-lg text-xs font-mono transition-all hover:scale-105"
          style={{ backgroundColor: currentTheme.accent + '20', color: currentTheme.accent, border: `1px solid ${currentTheme.accent}40` }}
        >
          Retry
        </button>
        {/* Fallback textarea */}
        <textarea
          value={activeTab.content}
          onChange={(e) => updateTabContent(activeTab.id, e.target.value)}
          className="w-full max-w-3xl h-64 mt-4 rounded-lg p-4 font-mono text-sm resize-none outline-none"
          style={{
            backgroundColor: currentTheme.bg,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`,
          }}
          spellCheck={false}
        />
      </div>
    );
  }

  // ── Main Monaco Editor ───────────────────────────────────────
  const handleEditorMount: OnMount = (editor, monaco) => {
    // Define HAVEN theme
    monaco.editor.defineTheme('haven-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '4a5568', fontStyle: 'italic' },
        { token: 'keyword', foreground: currentTheme.accent.replace('#', '') },
        { token: 'keyword.control', foreground: 'ff79c6' },
        { token: 'string', foreground: 'a3e635' },
        { token: 'string.escape', foreground: '6ee7b7' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'number.hex', foreground: 'f59e0b' },
        { token: 'type', foreground: '60a5fa' },
        { token: 'type.identifier', foreground: '38bdf8' },
        { token: 'function', foreground: 'c084fc' },
        { token: 'function.declaration', foreground: 'a78bfa' },
        { token: 'variable', foreground: 'e0e0e0' },
        { token: 'variable.predefined', foreground: 'cbd5e1' },
        { token: 'operator', foreground: 'f472b6' },
        { token: 'delimiter', foreground: '94a3b8' },
        { token: 'delimiter.bracket', foreground: '94a3b8' },
        { token: 'tag', foreground: 'f87171' },
        { token: 'tag.delimiter', foreground: '6b7280' },
        { token: 'attribute.name', foreground: 'fbbf24' },
        { token: 'attribute.value', foreground: 'a3e635' },
        { token: 'regexp', foreground: 'f97316' },
        { token: 'annotation', foreground: '34d399' },
        { token: 'constant', foreground: 'fb923c' },
        { token: 'namespace', foreground: '67e8f9' },
      ],
      colors: {
        'editor.background': currentTheme.editor,
        'editor.foreground': currentTheme.text,
        'editor.lineHighlightBackground': currentTheme.lineHighlight,
        'editor.selectionBackground': currentTheme.selection,
        'editorCursor.foreground': currentTheme.accent,
        'editorLineNumber.foreground': '#444444',
        'editorLineNumber.activeForeground': currentTheme.accent,
        'editorIndentGuide.background': '#1a1a1a',
        'editorIndentGuide.activeBackground': '#2a2a2a',
        'editor.selectionHighlightBackground': `${currentTheme.accent}15`,
        'editorBracketMatch.background': `${currentTheme.accent}20`,
        'editorBracketMatch.border': `${currentTheme.accent}50`,
        'editorBracketHighlight.foreground1': '#fbbf24',
        'editorBracketHighlight.foreground2': '#a78bfa',
        'editorBracketHighlight.foreground3': '#34d399',
        'editorBracketHighlight.foreground4': '#f472b6',
        'editorBracketHighlight.foreground5': '#60a5fa',
        'editorBracketHighlight.foreground6': '#fb923c',
        'scrollbarSlider.background': '#ffffff08',
        'scrollbarSlider.hoverBackground': '#ffffff15',
        'scrollbarSlider.activeBackground': `${currentTheme.accent}30`,
        'editorOverviewRuler.border': '#00000000',
        'editorGutter.background': currentTheme.editor,
        'editorWidget.background': currentTheme.bg,
        'editorWidget.border': currentTheme.border,
        'editorSuggestWidget.background': currentTheme.bg,
        'editorSuggestWidget.border': currentTheme.border,
        'editorSuggestWidget.selectedBackground': `${currentTheme.accent}20`,
        'editorHoverWidget.background': currentTheme.bg,
        'editorHoverWidget.border': currentTheme.border,
        'peekView.border': currentTheme.accent,
        'peekViewEditor.background': currentTheme.editor,
        'peekViewTitle.background': currentTheme.bg,
        'minimap.background': currentTheme.editor,
      },
    });
    monaco.editor.setTheme('haven-dark');

    // Cursor tracking
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition(e.position.lineNumber, e.position.column);
    });

    // Register custom actions
    editor.addAction({
      id: 'haven.toggleTerminal',
      label: 'HAVEN: Toggle Terminal',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote],
      run: () => useIDEStore.getState().toggleTerminal(),
    });

    editor.addAction({
      id: 'haven.commandPalette',
      label: 'HAVEN: Command Palette',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP],
      run: () => useIDEStore.getState().toggleCommandPalette(),
    });

    editor.addAction({
      id: 'haven.saveFile',
      label: 'HAVEN: Save File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        const state = useIDEStore.getState();
        if (state.activeTabId) state.saveFile(state.activeTabId);
      },
    });

    // ── Niyah Inline Completion Provider (Sovereign Copilot) ──────
    // Unified FIM-first pipeline: cache → pattern → Ollama FIM → pattern fallback
    monaco.languages.registerInlineCompletionsProvider('*', {
      provideInlineCompletions: async (model, position, _context, _token) => {
        const lineContent = model.getLineContent(position.lineNumber).substring(0, position.column - 1);
        const fullText = model.getValue();
        const language = model.getLanguageId();
        const fileName = activeTab?.name || 'untitled.ts';

        // Build rich context for Niyah
        const startLine = Math.max(1, position.lineNumber - 5);
        const prevLines: string[] = [];
        for (let i = startLine; i < position.lineNumber; i++) {
          prevLines.push(model.getLineContent(i));
        }

        // Build prefix (all text before cursor) and suffix (all text after cursor)
        const offset = model.getOffsetAt(position);
        const prefix = fullText.substring(0, offset);
        const suffix = fullText.substring(offset);

        const ctx: CompletionContext = {
          lineContent,
          fullText,
          language,
          fileName,
          lineNumber: position.lineNumber,
          column: position.column,
          prevLines,
        };

        // Unified async pipeline: cache → high-confidence pattern → Ollama FIM → pattern fallback
        try {
          const suggestion = await getNiyahCompletionAsync(prefix, suffix, ctx);
          if (suggestion) {
            return {
              items: [{
                insertText: suggestion.text,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                },
              }],
            };
          }
        } catch {
          // All layers failed — no completion
        }

        return { items: [] };
      },
      freeInlineCompletions: () => { cancelPendingFIM(); },
    });

    // Register HAVEN + Niyah code actions (lightbulb menu)
    monaco.languages.registerCodeActionProvider('*', {
      provideCodeActions: (_model, _range, _context, _token) => {
        return {
          actions: [
            {
              title: '⚡ HAVEN: Explain this code',
              kind: 'quickfix',
              diagnostics: [],
              isPreferred: false,
            },
            {
              title: '⚡ HAVEN: Optimize selection',
              kind: 'quickfix',
              diagnostics: [],
              isPreferred: false,
            },
            {
              title: '🧠 Niyah: Sovereign intent analysis',
              kind: 'quickfix',
              diagnostics: [],
              isPreferred: false,
            },
          ],
          dispose: () => {},
        };
      },
    });

    editor.focus();
  };

  return (
    <div className="flex-1 overflow-hidden relative" style={{ backgroundColor: currentTheme.editor }}>
      {/* Niyah Completion Indicator */}
      <div
        className="absolute top-2 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wide select-none pointer-events-none"
        style={{
          backgroundColor: `${currentTheme.accent}12`,
          color: `${currentTheme.accent}90`,
          border: `1px solid ${currentTheme.accent}20`,
        }}
      >
        <Brain className="w-3 h-3" />
        <span>Niyah</span>
        <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: currentTheme.accent }} />
      </div>
      <Editor
        key={activeTab.id}
        height="100%"
        language={activeTab.language}
        value={activeTab.content}
        onChange={(value) => {
          if (value !== undefined) updateTabContent(activeTab.id, value);
        }}
        onMount={handleEditorMount}
        onValidate={(markers) => {
          // Could integrate with StatusBar error/warning counts
        }}
        options={{
          fontSize,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures,
          minimap: { enabled: minimapVisible, scale: 1, showSlider: 'mouseover', renderCharacters: false },
          scrollBeyondLastLine,
          smoothScrolling,
          cursorBlinking: cursorBlinking as any,
          cursorStyle: cursorStyle as any,
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: renderLineHighlight as any,
          bracketPairColorization: { enabled: bracketPairColor },
          guides: { bracketPairs: guidesBracket, indentation: guidesIndent, highlightActiveIndentation: true },
          padding: { top: 16, bottom: 16 },
          lineNumbers: lineNumbers as any,
          renderWhitespace: renderWhitespace as any,
          wordWrap: wordWrap as any,
          automaticLayout: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: { other: 'on', comments: 'off', strings: 'on' },
          tabSize,
          formatOnPaste,
          formatOnType,
          stickyScroll: { enabled: true, maxLineCount: 5 },
          inlineSuggest: { enabled: true },
          parameterHints: { enabled: true, cycle: true },
          folding: true,
          foldingHighlight: true,
          foldingStrategy: 'auto',
          showFoldingControls: 'mouseover',
          matchBrackets: 'always',
          occurrencesHighlight: 'singleFile',
          selectionHighlight: true,
          codeLens: true,
          lightbulb: { enabled: 'on' as any },
          accessibilitySupport: 'off',
          linkedEditing: true,
          colorDecorators: true,
          columnSelection: false,
          dragAndDrop: true,
          dropIntoEditor: { enabled: true },
          mouseWheelZoom: true,
          overviewRulerBorder: false,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            verticalSliderSize: 6,
            horizontalSliderSize: 6,
          },
          find: {
            addExtraSpaceOnTop: false,
            seedSearchStringFromSelection: 'selection',
          },
        }}
        theme="haven-dark"
        loading={
          <div
            className="flex items-center justify-center h-full"
            style={{ backgroundColor: currentTheme.editor, color: currentTheme.accent }}
          >
            <div className="text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin mx-auto opacity-60" />
              <p className="text-xs font-mono opacity-40 tracking-wider uppercase">Loading Monaco Engine</p>
            </div>
          </div>
        }
      />
    </div>
  );
}

// ── Rich Markdown → HTML (no dependencies, much better than simpleMarkdown) ───
function richMarkdown(md: string, accent: string): string {
  let html = md;

  // 1. Fenced code blocks (```lang ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const escaped = escHtml(code.trimEnd());
    return `<pre style="background:#0a0a0a;border:1px solid #222;border-radius:8px;padding:12px 16px;overflow-x:auto;font-size:13px;line-height:1.6"><code class="language-${lang || 'text'}">${escaped}</code></pre>`;
  });

  // 2. Inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background:#1a1a1a;padding:2px 6px;border-radius:4px;font-size:0.9em">$1</code>');

  // 3. Tables
  html = html.replace(/^(\|.+\|)\n(\|[-:\s|]+\|)\n((?:\|.+\|\n?)*)/gm, (_m, headerRow, _divider, bodyRows) => {
    const headers = headerRow.split('|').filter((c: string) => c.trim()).map((c: string) =>
      `<th style="padding:8px 12px;border:1px solid #333;text-align:left;font-weight:600">${c.trim()}</th>`
    ).join('');
    const rows = bodyRows.trim().split('\n').map((row: string) => {
      const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) =>
        `<td style="padding:8px 12px;border:1px solid #222">${c.trim()}</td>`
      ).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table style="border-collapse:collapse;width:100%;margin:16px 0"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // 4. Headings
  html = html.replace(/^#### (.+)$/gm, `<h4 style="color:${accent};margin:20px 0 8px">$1</h4>`);
  html = html.replace(/^### (.+)$/gm, `<h3 style="color:${accent};margin:24px 0 8px">$1</h3>`);
  html = html.replace(/^## (.+)$/gm, '<h2 style="margin:28px 0 12px">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="margin:32px 0 16px">$1</h1>');

  // 5. Horizontal rule
  html = html.replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid #333;margin:24px 0">');

  // 6. Blockquotes
  html = html.replace(/^> (.+)$/gm, `<blockquote style="border-left:3px solid ${accent};padding:4px 12px;margin:12px 0;opacity:0.8">$1</blockquote>`);

  // 7. Task lists
  html = html.replace(/^- \[x\] (.+)$/gm, `<div style="display:flex;align-items:center;gap:6px;margin:4px 0"><input type="checkbox" checked disabled style="accent-color:${accent}"><span style="text-decoration:line-through;opacity:0.6">$1</span></div>`);
  html = html.replace(/^- \[ \] (.+)$/gm, `<div style="display:flex;align-items:center;gap:6px;margin:4px 0"><input type="checkbox" disabled style="accent-color:${accent}"><span>$1</span></div>`);

  // 8. Unordered / ordered lists
  html = html.replace(/^- (.+)$/gm, '<li style="margin:2px 0;list-style:disc;margin-left:24px">$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin:2px 0;list-style:decimal;margin-left:24px">$1</li>');

  // 9. Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:12px 0">');

  // 10. Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" style="color:#60a5fa;text-decoration:underline" target="_blank" rel="noopener">$1</a>`);

  // 11. Bold, italic, strikethrough
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del style="opacity:0.5">$1</del>');

  // 12. Line breaks (but skip inside <pre>)
  html = html.replace(/\n/g, '<br>');
  // Clean up extra <br> inside pre blocks
  html = html.replace(/<pre([^>]*)>([\s\S]*?)<\/pre>/g, (_, attrs, content) =>
    `<pre${attrs}>${content.replace(/<br>/g, '\n')}</pre>`
  );

  return html;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
