import React, { useState, useCallback, useMemo, Suspense, lazy, useEffect } from 'react';
import { useIDEStore } from '../useIDEStore';
import { niyahEngine } from '../engine/NiyahEngine';
import type { NiyahSession } from '../engine/NiyahEngine';
import {
  Brain, Eye, Cpu, Activity, Zap, Globe, Shield, Hash,
  ChevronDown, ChevronRight, Send, Sparkles, Clock, Target,
  Languages, MessageCircle, BarChart3, Network, GitGraph, Loader2,
} from 'lucide-react';

const IntentGraph = lazy(() => import('./IntentGraph'));

export function NiyahPanel() {
  const { currentTheme } = useIDEStore();
  const [input, setInput] = useState('');
  const [sessions, setSessions] = useState<NiyahSession[]>([]);
  const [activeSession, setActiveSession] = useState<NiyahSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['lobes', 'vector', 'response', 'graph'])
  );
  const [expanded, setExpanded] = useState(false);

  const activeTab = useIDEStore(s => s.openTabs.find(t => t.id === s.activeTabId));
  const globalVector = useIDEStore(s => s.niyahVector);

  // Sync from global store (terminal `niyah` command broadcasts here)
  useEffect(() => {
    if (globalVector && (!activeSession || globalVector.id !== activeSession.id)) {
      setSessions(prev => {
        const exists = prev.some(s => s.id === globalVector.id);
        if (exists) return prev;
        const updated = [...prev, globalVector];
        return updated.length > 50 ? updated.slice(-50) : updated;
      });
      setActiveSession(globalVector);
    }
  }, [globalVector]);

  // ── Persistence: restore sessions from localStorage ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem('niyah-sessions');
      if (saved) {
        const parsed: NiyahSession[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed.slice(-50));
          setActiveSession(parsed[parsed.length - 1]);
        }
      }
    } catch (_) { /* ignore corrupt storage */ }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('niyah-sessions', JSON.stringify(sessions.slice(-50)));
    }
  }, [sessions]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  const handleProcess = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);

    setTimeout(() => {
      try {
        const session = niyahEngine.process(input, {
          activeFile: activeTab?.name,
          language: activeTab?.language,
        });
        setSessions(prev => {
          const updated = [...prev, session];
          return updated.length > 50 ? updated.slice(-50) : updated;
        });
        setActiveSession(session);
        setInput('');
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown processing error';
        useIDEStore.getState().addNotification({ type: 'error', message: `Niyah failed: ${msg}` });
      } finally {
        setIsProcessing(false);
      }
    }, 300 + Math.random() * 500);
  }, [input, activeTab]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleProcess(e as unknown as React.FormEvent);
    } else if (e.key === 'Escape') {
      setInput('');
    }
  }, [handleProcess]);

  const memoryStats = useMemo(() => niyahEngine.getMemoryStats(), [sessions.length]);

  const LobeCard: React.FC<{ lobe: { name: string; status: string; load: number; output: string; latency: number } }> = ({ lobe }) => {
    const icon = lobe.name.includes('Sensory') ? Eye :
                 lobe.name.includes('Cognitive') ? Brain : Cpu;
    const Icon = icon;
    const barWidth = `${lobe.load}%`;

    return (
      <div
        className="rounded-lg p-3 border transition-all"
        style={{
          backgroundColor: currentTheme.bg,
          borderColor: lobe.load > 80 ? currentTheme.accent + '60' : currentTheme.border,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ backgroundColor: currentTheme.accent + '15' }}
          >
            <Icon size={14} style={{ color: currentTheme.accent }} />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold" style={{ color: currentTheme.text }}>
              {lobe.name}
            </div>
            <div className="text-[10px]" style={{ color: currentTheme.textMuted }}>
              {lobe.latency}ms latency
            </div>
          </div>
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor: lobe.status === 'active' ? '#22c55e' :
                              lobe.status === 'processing' ? currentTheme.accent : currentTheme.textMuted,
            }}
          />
        </div>

        {/* Load bar */}
        <div className="w-full h-1.5 rounded-full mb-1.5" style={{ backgroundColor: currentTheme.border }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: barWidth,
              backgroundColor: lobe.load > 80 ? currentTheme.accent :
                              lobe.load > 50 ? currentTheme.accent + 'aa' : currentTheme.textMuted,
            }}
          />
        </div>

        <div className="text-[10px]" style={{ color: currentTheme.textMuted }}>
          {lobe.output}
        </div>
      </div>
    );
  };

  const SectionHeader = ({ id, title, icon: Icon, count }: { id: string; title: string; icon: React.ElementType; count?: number }) => (
    <button
      className="flex items-center gap-2 w-full py-1.5 text-left"
      onClick={() => toggleSection(id)}
      style={{ color: currentTheme.text }}
    >
      {expandedSections.has(id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      <Icon size={12} style={{ color: currentTheme.accent }} />
      <span className="text-xs font-semibold flex-1">{title}</span>
      {count !== undefined && (
        <span className="text-[10px] px-1.5 rounded" style={{ backgroundColor: currentTheme.accent + '15', color: currentTheme.accent }}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: currentTheme.sidebar }}>
      {/* Header */}
      <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: currentTheme.border }}>
        <Brain size={14} style={{ color: currentTheme.accent }} />
        <span className="text-xs font-bold tracking-wide" style={{ color: currentTheme.accent }}>
          NIYAH ENGINE
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: currentTheme.accent + '15', color: currentTheme.accent }}>
          L.O.I v2
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: currentTheme.textMuted }}>
          <Activity size={10} />
          {memoryStats.sessions} sessions
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">

        {/* Active Session Display */}
        {activeSession ? (
          <>
            {/* Three Lobes */}
            <SectionHeader id="lobes" title="Three-Lobe Architecture" icon={Network} count={activeSession.lobes.length} />
            {expandedSections.has('lobes') && (
              <div className="space-y-2 pl-1">
                {activeSession.lobes.map((lobe, i) => (
                  <LobeCard key={i} lobe={lobe} />
                ))}
              </div>
            )}

            {/* Niyah Vector */}
            <SectionHeader id="vector" title="Niyah Vector" icon={Target} />
            {expandedSections.has('vector') && (
              <div
                className="rounded-lg p-3 border space-y-2"
                style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.border }}
              >
                <div className="flex items-center gap-2">
                  <Hash size={10} style={{ color: currentTheme.accent }} />
                  <span className="text-[10px] font-mono" style={{ color: currentTheme.textMuted }}>
                    {activeSession.id}
                  </span>
                </div>

                <VectorRow icon={Target} label="Intent" value={`"${activeSession.vector.intent.slice(0, 50)}"`} theme={currentTheme} />
                <VectorRow icon={BarChart3} label="Confidence" value={`${(activeSession.vector.confidence * 100).toFixed(1)}%`} theme={currentTheme} accent />
                <VectorRow icon={Languages} label="Dialect" value={activeSession.vector.dialect} theme={currentTheme} />
                <VectorRow icon={MessageCircle} label="Tone" value={activeSession.vector.tone} theme={currentTheme} />
                <VectorRow icon={Globe} label="Domain" value={activeSession.vector.domain} theme={currentTheme} />
                <VectorRow icon={Shield} label="Alignment" value={`${activeSession.alignmentScore}/100`} theme={currentTheme} accent={activeSession.alignmentScore >= 90} />

                {activeSession.vector.roots.length > 0 && (
                  <div className="pt-1 border-t" style={{ borderColor: currentTheme.border + '60' }}>
                    <div className="text-[10px] mb-1" style={{ color: currentTheme.textMuted }}>Arabic Roots:</div>
                    <div className="flex flex-wrap gap-1">
                      {activeSession.vector.roots.map((root, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                          style={{ backgroundColor: currentTheme.accent + '10', color: currentTheme.accent }}
                        >
                          {root}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Response */}
            <SectionHeader id="response" title="Niyah Response" icon={Sparkles} />
            {expandedSections.has('response') && (
              <div
                className="rounded-lg p-3 border text-xs leading-relaxed flex items-start gap-2"
                style={{
                  backgroundColor: currentTheme.bg,
                  borderColor: currentTheme.accent + '30',
                  borderLeft: `3px solid ${currentTheme.accent}`,
                  color: currentTheme.text,
                }}
              >
                <pre className="whitespace-pre-wrap font-sans flex-1">{activeSession.response}</pre>
                <button
                  className="p-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 text-[10px] font-bold"
                  title="تشغيل الصوت"
                  onClick={() => {
                    if ('speechSynthesis' in window) {
                      const utter = new window.SpeechSynthesisUtterance(activeSession.response);
                      utter.lang = 'ar-SA';
                      utter.rate = 1.05;
                      utter.pitch = 1.1;
                      window.speechSynthesis.speak(utter);
                    } else {
                      alert('ميزة الصوت غير مدعومة في هذا المتصفح');
                    }
                  }}
                >🔊 صوت</button>
              </div>
            )}

            {/* Session History */}
            {sessions.length > 1 && (
              <>
                <SectionHeader id="history" title="Session History" icon={Clock} count={sessions.length} />
                {expandedSections.has('history') && (
                  <div className="space-y-1 pl-1">
                    {sessions.slice().reverse().map((s) => (
                      <button
                        key={s.id}
                        className="w-full text-left rounded px-2 py-1.5 text-[11px] transition-colors"
                        style={{
                          backgroundColor: s.id === activeSession?.id ? currentTheme.accent + '15' : 'transparent',
                          color: s.id === activeSession?.id ? currentTheme.accent : currentTheme.textMuted,
                        }}
                        onClick={() => setActiveSession(s)}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="truncate flex-1">{s.vector.intent.slice(0, 40)}</span>
                          <span className="text-[9px] opacity-60">{s.vector.dialect}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Intent Graph — Visual Map */}
            <SectionHeader id="graph" title="Intent Graph" icon={GitGraph} count={sessions.length} />
            {expandedSections.has('graph') && (
              <Suspense fallback={
                <div className="flex items-center justify-center py-6 gap-2" style={{ color: currentTheme.textMuted }}>
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-[11px]">Loading Intent Graph...</span>
                </div>
              }>
                <IntentGraph height={expanded ? 400 : 260} />
              </Suspense>
            )}
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: currentTheme.accent + '10' }}
            >
              <Brain size={24} style={{ color: currentTheme.accent, opacity: 0.6 }} />
            </div>
            <div className="text-sm font-semibold mb-1" style={{ color: currentTheme.text }}>
              Niyah Engine Ready
            </div>
            <div className="text-[11px] leading-relaxed" style={{ color: currentTheme.textMuted }}>
              Enter your intent below — in any language or dialect.
              The engine will process it through Arabic Root Tokenization,
              Dialect Detection, and Three-Lobe Architecture.
            </div>
            <div className="text-[10px] mt-3 font-mono" style={{ color: currentTheme.accent + '80' }}>
              "نحن لا نأمر الآلة — نتواصل بالنية"
            </div>
          </div>
        )}
      </div>

      {/* Input form */}
      <form
        onSubmit={handleProcess}
        className="p-2 border-t"
        style={{ borderColor: currentTheme.border }}
      >
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}` }}
        >
          <Zap size={12} style={{ color: currentTheme.accent, opacity: isProcessing ? 1 : 0.4 }} className={isProcessing ? 'animate-pulse' : ''} />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ادخل نيتك... (Ctrl+Enter)"
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: currentTheme.text }}
            dir="auto"
            disabled={isProcessing}
          />
          <button
            type="submit"
            className="p-1 rounded transition-colors hover:brightness-125"
            style={{
              backgroundColor: input.trim() ? currentTheme.accent + '20' : 'transparent',
              color: currentTheme.accent,
              opacity: input.trim() ? 1 : 0.3,
            }}
            disabled={!input.trim() || isProcessing}
          >
            <Send size={12} />
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Helper component ─────────────────────────────────────────────────

const VectorRow = React.memo(function VectorRow({ icon: Icon, label, value, theme, accent }: {
  icon: React.ElementType;
  label: string;
  value: string;
  theme: { accent: string; text: string; textMuted: string };
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <Icon size={10} style={{ color: theme.textMuted }} />
      <span style={{ color: theme.textMuted }}>{label}:</span>
      <span className="font-mono" style={{ color: accent ? theme.accent : theme.text }}>{value}</span>
    </div>
  );
});
