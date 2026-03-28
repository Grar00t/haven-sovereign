import React, { useState, useRef, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { useIDEStore } from '../useIDEStore';
import { threeLobeAgent } from '../engine/ThreeLobeAgent';
import { modelRouter, LOBE_CONFIGS, ALL_LOBE_IDS, type LobeId, type RoutingTrace, type LobeModelInfo } from '../engine/ModelRouter';
import { ollamaService, type ConnectionStatus } from '../engine/OllamaService';
import { getFIMCacheSize } from '../engine/NiyahCompletionProvider';
import {
  Sparkles, Send, Bot, User, Copy, Check,
  Code2, Zap, Wrench, BookOpen, Paperclip, X,
  Brain, Shield, GitGraph, Loader2, Wifi, WifiOff,
  CircleDot, StopCircle, Activity, Database, ChevronDown, ChevronUp,
} from 'lucide-react';

const IntentGraph = lazy(() => import('./IntentGraph'));

// ── Lobe color map ───────────────────────────────────────────
const LOBE_COLORS: Record<LobeId, string> = {
  cognitive: '#60a5fa',  // blue
  executive: '#f59e0b',  // amber
  sensory: '#34d399',    // green
};

const LOBE_SHORT_LABELS: Record<LobeId, string> = {
  cognitive: 'معرفي',
  executive: 'تنفيذي',
  sensory: 'حسي',
};

// ── Routing Trace Panel ──────────────────────────────────────

function RoutingTracePanel({ theme }: { theme: { accent: string; border: string; text: string; textMuted: string; bg: string; sidebar: string } }) {
  const [traces, setTraces] = useState<RoutingTrace[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Initial load
    setTraces(modelRouter.getTraceHistory(10));
    // Subscribe to new traces
    const unsub = modelRouter.onTrace((trace) => {
      setTraces(prev => [trace, ...prev].slice(0, 10));
    });
    return unsub;
  }, []);

  if (traces.length === 0) {
    return (
      <div className="px-3 py-2 text-[10px]" style={{ color: theme.textMuted }}>
        <Activity size={10} className="inline mr-1" />
        No routing traces yet — send a message to see how Niyah routes it.
      </div>
    );
  }

  const latest = traces[0];
  const ago = Math.round((Date.now() - latest.timestamp) / 1000);

  return (
    <div className="border-b" style={{ borderColor: theme.border + '60' }}>
      {/* Collapsed summary (always visible) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] hover:brightness-110 transition-all"
        style={{ color: theme.textMuted }}
      >
        <span className="flex items-center gap-1.5">
          <Activity size={10} style={{ color: LOBE_COLORS[latest.decision.primary] }} />
          <span style={{ color: LOBE_COLORS[latest.decision.primary], fontWeight: 600 }}>
            {LOBE_CONFIGS[latest.decision.primary].nameAr}
          </span>
          <span className="opacity-60">←</span>
          <span className="truncate max-w-[120px]" title={latest.input}>
            "{latest.input.slice(0, 30)}{latest.input.length > 30 ? '…' : ''}"
          </span>
          <span className="opacity-40">{ago}s ago</span>
        </span>
        {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>

      {/* Expanded: weight breakdown + history */}
      {expanded && (
        <div className="px-3 pb-2 space-y-2">
          {/* Weight breakdown for latest trace */}
          <div className="rounded p-2 space-y-1" style={{ backgroundColor: theme.bg }}>
            <div className="text-[10px] font-semibold" style={{ color: theme.accent }}>
              Niyah Weight Analysis
            </div>
            {(['arabic', 'code', 'plan'] as const).map(key => {
              const value = latest.weights[key];
              const pct = Math.round(value * 100);
              const barColor = key === 'arabic' ? '#34d399' : key === 'code' ? '#60a5fa' : '#f59e0b';
              return (
                <div key={key} className="flex items-center gap-2 text-[10px]">
                  <span className="w-12 text-right" style={{ color: theme.textMuted }}>
                    {key === 'arabic' ? 'عربي' : key === 'code' ? 'كود' : 'خطة'}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.border }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono" style={{ color: barColor }}>{pct}%</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between text-[10px] pt-0.5" style={{ color: theme.textMuted }}>
              <span>
                Confidence: <span style={{ color: theme.accent, fontWeight: 600 }}>{(latest.decision.confidence * 100).toFixed(0)}%</span>
              </span>
              <span>
                Latency: <span style={{ fontWeight: 600 }}>{latest.latencyMs.toFixed(0)}ms</span>
              </span>
              {latest.modelUsed && (
                <span className="truncate max-w-[100px]" title={latest.modelUsed}>
                  {latest.modelUsed.split(':')[0]}
                </span>
              )}
            </div>
          </div>

          {/* Trace history */}
          {traces.length > 1 && (
            <div className="space-y-0.5">
              <div className="text-[9px] font-semibold" style={{ color: theme.textMuted }}>
                Recent Routing ({traces.length})
              </div>
              {traces.slice(1, 6).map((t, i) => {
                const tAgo = Math.round((Date.now() - t.timestamp) / 1000);
                return (
                  <div key={i} className="flex items-center gap-1.5 text-[9px]" style={{ color: theme.textMuted }}>
                    <CircleDot size={6} style={{ color: LOBE_COLORS[t.decision.primary] }} />
                      <span style={{ color: LOBE_COLORS[t.decision.primary] }}>
                        {LOBE_SHORT_LABELS[t.decision.primary]}
                    </span>
                    <span className="truncate flex-1" title={t.input}>
                      {t.input.slice(0, 40)}
                    </span>
                    <span className="opacity-40 shrink-0">{tAgo}s</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Lobe Stats Mini-Panel ────────────────────────────────────

function LobeStatsBar({ theme, activeLobe }: {
  theme: { accent: string; border: string; textMuted: string };
  activeLobe: LobeId | null;
}) {
  const [lobeInfos, setLobeInfos] = useState<Record<LobeId, Readonly<LobeModelInfo>> | null>(null);

  useEffect(() => {
    const refresh = () => {
      const infos = {} as Record<LobeId, Readonly<LobeModelInfo>>;
      for (const id of ALL_LOBE_IDS) {
        infos[id] = modelRouter.getLobeModelInfo(id);
      }
      setLobeInfos(infos);
    };
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1 border-b text-[10px]" style={{ borderColor: theme.border + '60' }}>
      {ALL_LOBE_IDS.map(id => {
        const config = LOBE_CONFIGS[id];
        const isActive = activeLobe === id;
        const info = lobeInfos?.[id];
        const loaded = info?.runtime.loaded;
        const vram = info?.runtime.vramGB || 0;
        const modelShort = info?.current?.split(':')[0] || 'none';
        const hasOverride = !!info?.preferred;

        return (
          <div
            key={id}
            className="flex items-center gap-1 group relative cursor-default"
            style={{
              color: isActive ? LOBE_COLORS[id] : theme.textMuted,
              opacity: isActive ? 1 : loaded ? 0.7 : 0.4,
            }}
            title={`${config.nameAr} (${config.name})\nModel: ${info?.current || 'none'}\nVRAM: ${vram.toFixed(1)} GB\n${loaded ? '⚡ Loaded' : '💤 Idle'}${hasOverride ? '\n🔒 User Override' : ''}`}
          >
            <CircleDot size={8} style={{ color: isActive ? LOBE_COLORS[id] : loaded ? LOBE_COLORS[id] : theme.textMuted }} />
              <span className={isActive ? 'font-semibold' : ''}>
                {LOBE_SHORT_LABELS[id]}
            </span>
            {loaded && (
              <span className="text-[8px] font-mono opacity-60">{vram > 0 ? `${vram.toFixed(1)}G` : '⚡'}</span>
            )}
            {hasOverride && <span className="text-[8px]">🔒</span>}
          </div>
        );
      })}
      {/* Cache stats */}
      <div className="ml-auto flex items-center gap-1" style={{ color: theme.textMuted, opacity: 0.5 }}>
        <Database size={8} />
        <span className="text-[9px] font-mono">{getFIMCacheSize()}</span>
      </div>
    </div>
  );
}

export function AIPanel() {
  const { aiPanelVisible, currentTheme, aiMessages, addAiMessage, openTabs, activeTabId } = useIDEStore();
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [activeLobe, setActiveLobe] = useState<LobeId | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [showTrace, setShowTrace] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTab = useMemo(() => openTabs.find(t => t.id === activeTabId), [openTabs, activeTabId]);
<<<<<<< HEAD
=======

  const handleFileAttach = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setAttachedFile({ name: file.name, content: text });
    } catch {
      setAttachedFile({ name: file.name, content: '[Binary file — cannot read as text]' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

>>>>>>> 4d69da7ded22e131bcf451ba91ae11e28e036300
  // ── Connect to Ollama on mount ─────────────────────────────
  useEffect(() => {
    const unsub = threeLobeAgent.onStatusChange(setConnectionStatus);
    threeLobeAgent.connect();
    return unsub;
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiMessages, streamContent]);

  if (!aiPanelVisible) return null;

  const submitPrompt = useCallback(async (query: string) => {
    if (!query.trim() || isStreaming) return;

    setInput('');
    addAiMessage({ role: 'user', content: query });

    setIsStreaming(true);
    setStreamContent('');
    abortRef.current = false;

<<<<<<< HEAD
    const context = {
      activeFile: activeTab?.name,
      language: activeTab?.language || undefined,
      selectedCode: activeTab?.content?.slice(0, 800) || undefined,
      openFiles: openTabs.map(t => t.name),
      recentFiles: openTabs.slice(-5).map(t => t.name),
=======
    // Build context from active editor tab + attached file
    // Only include code context when the query is about code (not greetings/general chat)
    const isCodeQuery = /\b(code|fix|bug|error|write|build|create|function|class|import|export|refactor|optimize|test|debug|explain.*code|\/\w+)\b/i.test(query)
      || /[\u0627\u0628\u063A\u0633\u0648](كود|برمج|اكتب|سوي|صلح|خطأ)/i.test(query);

    const context: Record<string, string | undefined> = {
      activeFile: activeTab?.name,
      language: activeTab?.language || undefined,
      selectedCode: isCodeQuery ? activeTab?.content?.slice(0, 2000) || undefined : undefined,
>>>>>>> 4d69da7ded22e131bcf451ba91ae11e28e036300
    };
    if (attachedFile) {
      context.attachedFileName = attachedFile.name;
      context.attachedFileContent = attachedFile.content.slice(0, 8000);
      setAttachedFile(null);
    }

    let accumulated = '';

    try {
      await threeLobeAgent.chat(query, context, {
        onToken: (token, lobe) => {
          if (abortRef.current) return;
          accumulated += token;
          setStreamContent(accumulated);
          setActiveLobe(lobe);
        },
        onLobeStart: (lobe) => {
          setActiveLobe(lobe);
        },
        onLobeEnd: () => {
          setActiveLobe(null);
        },
        onRouting: () => {
          if (!showTrace) setShowTrace(true);
        },
        onComplete: (msg) => {
          addAiMessage({
            role: 'assistant',
            content: msg.content,
          });
          setStreamContent('');
          setIsStreaming(false);
          setActiveLobe(null);
        },
        onError: (error) => {
          addAiMessage({
            role: 'assistant',
            content: `⚠️ ${error}`,
          });
          setStreamContent('');
          setIsStreaming(false);
          setActiveLobe(null);
        },
      });
    } catch (err) {
      if (!accumulated) {
        addAiMessage({
          role: 'assistant',
          content: `⚠️ ${err instanceof Error ? err.message : 'Processing failed'}`,
        });
      }
      setStreamContent('');
      setIsStreaming(false);
      setActiveLobe(null);
    }
  }, [activeTab, addAiMessage, isStreaming, openTabs, showTrace]);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleStop = () => {
    abortRef.current = true;
    ollamaService.cancelAll();
    setStreamContent('');
    setIsStreaming(false);
    setActiveLobe(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitPrompt(input);
  };

  const quickActions = [
    {
      icon: Brain,
      label: 'niyah',
      tooltip: 'Run NIYAH intent analysis on the current context',
      prompt: () => `Run NIYAH intent analysis for ${activeTab?.name || 'the current request'} and explain the best routing decision in 4 short bullets max.`,
    },
    {
      icon: Zap,
      label: 'all',
      tooltip: 'Use the full three-lobe pipeline',
      prompt: () => `Use all three lobes together and give me the strongest answer for ${activeTab?.name || 'this request'} in a concise practical format.`,
    },
    {
      icon: Shield,
      label: 'expose',
      tooltip: 'Surface privacy, telemetry, or security risks',
      prompt: () => `Expose the privacy, telemetry, or security risks in ${activeTab?.name || 'the current context'} and rank them by severity with concrete fixes.`,
    },
    {
      icon: Code2,
      label: 'explain',
      tooltip: 'Explain the active file clearly',
      prompt: () => `Explain ${activeTab?.name || 'the active code'} clearly for a human developer. Focus on purpose, flow, and risky edges.`,
    },
    {
      icon: Wrench,
      label: 'fix',
      tooltip: 'Find likely bugs and concrete fixes',
      prompt: () => `Find likely bugs in ${activeTab?.name || 'the current file'} and propose concrete fixes with minimal risk.`,
    },
    {
      icon: Zap,
      label: 'optimize',
      tooltip: 'Suggest practical performance and clarity improvements',
      prompt: () => `Optimize ${activeTab?.name || 'the current file'} for clarity, safety, and performance without changing behavior unnecessarily.`,
    },
  ];

  // ── Connection status indicator ────────────────────────────
  const StatusIcon = connectionStatus === 'connected' ? Wifi : WifiOff;
  const statusColor = connectionStatus === 'connected' ? '#22c55e'
    : connectionStatus === 'connecting' ? '#f59e0b'
    : '#ef4444';
  const statusLabel = connectionStatus === 'connected' ? 'Ollama Connected'
    : connectionStatus === 'connecting' ? 'Connecting...'
    : 'Ollama Offline';

  return (
    <div
      className="flex flex-col border-l"
      style={{
        width: 340,
        backgroundColor: currentTheme.sidebar,
        borderColor: currentTheme.border,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: currentTheme.border }}
      >
        <span className="text-sm font-semibold flex items-center gap-2" style={{ color: currentTheme.accent }}>
          <Sparkles size={14} />
          HAVEN AI
        </span>
        <div className="flex items-center gap-1.5">
          {/* Connection status */}
          <button
            onClick={() => threeLobeAgent.connect()}
            className="p-1 rounded transition-colors hover:brightness-125"
            style={{ color: statusColor }}
            title={statusLabel}
          >
            <StatusIcon size={12} />
          </button>
          {/* Routing trace toggle */}
          <button
            onClick={() => setShowTrace(!showTrace)}
            className="p-1 rounded transition-colors hover:brightness-125"
            style={{
              backgroundColor: showTrace ? currentTheme.accent + '20' : 'transparent',
              color: showTrace ? currentTheme.accent : currentTheme.textMuted,
            }}
            title="Routing Trace"
          >
            <Activity size={12} />
          </button>
          <button
            onClick={() => setShowGraph(!showGraph)}
            className="p-1 rounded transition-colors hover:brightness-125"
            style={{
              backgroundColor: showGraph ? currentTheme.accent + '20' : 'transparent',
              color: showGraph ? currentTheme.accent : currentTheme.textMuted,
            }}
            title="Intent Graph"
          >
            <GitGraph size={13} />
          </button>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: currentTheme.accent + '15', color: currentTheme.accent }}>
            THREE-LOBE
          </span>
        </div>
      </div>

      {/* Lobe status bar (live VRAM + model info) */}
      <LobeStatsBar theme={currentTheme} activeLobe={activeLobe} />

      {/* Routing trace panel (collapsible) */}
      {showTrace && <RoutingTracePanel theme={currentTheme} />}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-1 px-3 py-1.5 border-b" style={{ borderColor: currentTheme.border + '60' }}>
        {quickActions.map(({ icon: Icon, label, tooltip, prompt }) => (
          <button
            key={label}
            className="text-[10px] py-1 rounded flex items-center justify-center gap-1 transition-colors hover:brightness-125"
            style={{ backgroundColor: currentTheme.border, color: currentTheme.textMuted }}
            title={tooltip}
            onClick={() => { void submitPrompt(prompt()); }}
          >
            <Icon size={10} />
            {label}
          </button>
        ))}
      </div>

      {/* Intent Graph (toggleable) */}
      {showGraph && (
        <div className="px-2 py-1.5 border-b" style={{ borderColor: currentTheme.border + '60' }}>
          <Suspense fallback={
            <div className="flex items-center justify-center py-4 gap-2" style={{ color: currentTheme.textMuted }}>
              <Loader2 size={12} className="animate-spin" />
              <span className="text-[10px]">Loading graph...</span>
            </div>
          }>
            <IntentGraph height={200} />
          </Suspense>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {aiMessages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm rounded-lg p-2.5 relative group ${
              msg.role === 'user' ? 'ml-8' : 'mr-2'
            }`}
            style={{
              backgroundColor: msg.role === 'user'
                ? currentTheme.accent + '15'
                : currentTheme.border,
              color: currentTheme.text,
              borderLeft: msg.role === 'assistant'
                ? `2px solid ${currentTheme.accent}`
                : 'none',
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold" style={{ color: msg.role === 'assistant' ? currentTheme.accent : currentTheme.textMuted }}>
              {msg.role === 'assistant' ? <Bot size={11} /> : <User size={11} />}
              {msg.role === 'assistant' ? 'HAVEN AI' : 'You'}
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed break-words">
              {msg.content}
            </pre>
            {msg.role === 'assistant' && (
              <button
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 hover:!opacity-100 p-1 rounded transition-opacity"
                onClick={() => handleCopy(msg.content, i)}
                title="Copy response"
              >
                {copiedIdx === i ? <Check size={12} style={{ color: '#22c55e' }} /> : <Copy size={12} style={{ color: currentTheme.textMuted }} />}
              </button>
            )}
          </div>
        ))}

        {/* Streaming response (live tokens) */}
        {isStreaming && streamContent && (
          <div
            className="text-sm rounded-lg p-2.5 mr-2"
            style={{
              backgroundColor: currentTheme.border,
              color: currentTheme.text,
              borderLeft: `2px solid ${activeLobe ? LOBE_COLORS[activeLobe] : currentTheme.accent}`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold" style={{ color: activeLobe ? LOBE_COLORS[activeLobe] : currentTheme.accent }}>
              <Bot size={11} />
              {activeLobe ? LOBE_CONFIGS[activeLobe].nameAr : 'HAVEN AI'}
              <Loader2 size={10} className="animate-spin ml-1" />
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed break-words">
              {streamContent}
              <span className="animate-pulse">▊</span>
            </pre>
          </div>
        )}

        {/* Typing indicator (before first token) */}
        {isStreaming && !streamContent && (
          <div
            className="text-sm p-2.5 rounded-lg mr-2 flex items-center gap-2"
            style={{ backgroundColor: currentTheme.border, color: activeLobe ? LOBE_COLORS[activeLobe] : currentTheme.accent }}
          >
            <Bot size={12} />
            <div className="flex gap-1 items-center">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
            </div>
            {activeLobe && (
              <span className="text-[10px] ml-1 opacity-70">
                {LOBE_CONFIGS[activeLobe].nameAr}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Context indicator */}
      {activeTab && (
        <div className="px-3 py-1 text-[10px] flex items-center gap-1.5 border-t" style={{ color: currentTheme.textMuted, borderColor: currentTheme.border + '60' }}>
          <BookOpen size={10} />
          Context: <span style={{ color: currentTheme.accent }}>{activeTab.name}</span>
          <span className="opacity-40">({activeTab.language})</span>
        </div>
      )}

      {/* Attached file chip */}
      {attachedFile && (
        <div className="px-3 py-1 flex items-center gap-1.5 border-t text-[10px]" style={{ borderColor: currentTheme.border + '60', color: currentTheme.accent }}>
          <Paperclip size={10} />
          <span className="truncate max-w-[180px]">{attachedFile.name}</span>
          <span style={{ color: currentTheme.textMuted }}>({Math.round(attachedFile.content.length / 1024)}KB)</span>
          <button onClick={() => setAttachedFile(null)} className="ml-auto p-0.5 rounded hover:bg-white/10">
            <X size={10} style={{ color: currentTheme.textMuted }} />
          </button>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-2 border-t"
        style={{ borderColor: currentTheme.border }}
      >
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileAttach}
          accept=".txt,.md,.ts,.tsx,.js,.jsx,.py,.rs,.c,.cpp,.h,.json,.yaml,.yml,.toml,.html,.css,.sh,.sql,.go,.java,.php,.rb,.swift,.kt,.xml,.csv,.log,.env,.conf,.cfg" />
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}` }}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1 rounded transition-colors hover:bg-white/10"
            style={{ color: currentTheme.textMuted }}
            title="Attach file"
          >
            <Paperclip size={13} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={connectionStatus === 'connected' ? 'Ask HAVEN AI... (try /help)' : 'Offline mode — type /help'}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: currentTheme.text }}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="p-1 rounded transition-colors hover:brightness-125"
              style={{ color: '#ef4444' }}
              title="Stop generation"
            >
              <StopCircle size={13} />
            </button>
          ) : (
            <button
              type="submit"
              className="p-1 rounded transition-colors hover:brightness-125"
              style={{
                backgroundColor: input.trim() ? currentTheme.accent + '20' : 'transparent',
                color: currentTheme.accent,
                opacity: input.trim() ? 1 : 0.3,
              }}
              disabled={!input.trim()}
            >
              <Send size={13} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
