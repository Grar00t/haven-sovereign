// ══════════════════════════════════════════════════════════════
// HackingToolkit — REAL + Simulated Sovereign Security Tools
// Browser-based defensive security — your RIGHT to self-defense.
// من حق كل إنسان الدفاع عن نفسه.
// Built for HAVEN OFFICIAL by أبو خوارزم
// ══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap, Play, Square, Trash2, Download, Brain, PlayCircle,
} from 'lucide-react';
import { TOOLS, CATEGORY_COLORS } from './tools';

export const HackingToolkit = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [niyahSummary, setNiyahSummary] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedTool = TOOLS.find(t => t.id === activeTool);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const runTool = useCallback(async () => {
    if (!selectedTool || running) return;
    setRunning(true);
    setOutput([`$ ${selectedTool.command}`, '']);

    if (selectedTool.isReal && selectedTool.runner) {
      try {
        const results = await selectedTool.runner();
        setOutput(prev => [...prev, ...results]);
        generateNiyahSummary(results);
      } catch (err) {
        setOutput(prev => [...prev, `[!] Error: ${err}`, '', '[*] Scan failed.']);
      }
      setRunning(false);
    } else if (selectedTool.simulatedOutput) {
      const lines = selectedTool.simulatedOutput;
      const interval = selectedTool.duration / lines.length;
      let idx = 0;
      timerRef.current = setInterval(() => {
        if (idx < lines.length) {
          setOutput(prev => [...prev, lines[idx]]);
          idx++;
        } else {
          if (timerRef.current) clearInterval(timerRef.current);
          setOutput(prev => [...prev, '', '[*] Simulation complete.']);
          setRunning(false);
        }
      }, interval);
    }
  }, [selectedTool, running]);

  const stopTool = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setOutput(prev => [...prev, '', '[!] Aborted by operator.']);
    setRunning(false);
  }, []);

  const clearOutput = useCallback(() => { setOutput([]); setNiyahSummary(null); }, []);

  /** Niyah Interpretation — auto-summarize scan findings */
  const generateNiyahSummary = useCallback((results: string[]) => {
    const warnings = results.filter(l => l.includes('⚠️') || l.includes('[!]')).length;
    const safe = results.filter(l => l.includes('✅')).length;
    const total = results.length;

    let summary: string;
    if (warnings === 0 && safe > 0) {
      summary = `🟢 تحليل نية: النظام نظيف — ${safe} فحوصات آمنة، لا تهديدات. السيادة مؤكدة.`;
    } else if (warnings > 5) {
      summary = `🔴 تحليل نية: ${warnings} تحذير من ${total} نتيجة — مستوى التهديد عالٍ. يُنصح بالحظر الفوري.`;
    } else if (warnings > 0) {
      summary = `🟡 تحليل نية: ${warnings} تحذير(ات) و ${safe} آمن. فحص يدوي مُوصى به.`;
    } else {
      summary = `⚪ تحليل نية: ${total} سطر من النتائج. لم يُكتشف نمط واضح.`;
    }

    setNiyahSummary(summary);
  }, []);

  /** Run ALL real scans sequentially */
  const runAllScans = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setNiyahSummary(null);
    setOutput(['$ dragon_toolkit --run-all --real-only', '', '[*] DRAGON FULL SECURITY AUDIT', '']);

    const realTools = TOOLS.filter(t => t.isReal && t.runner);
    let allResults: string[] = [];

    for (const tool of realTools) {
      setOutput(prev => [...prev, `\n${'═'.repeat(50)}`, `[*] Running: ${tool.name} (${tool.nameAr})`, '═'.repeat(50), '']);
      try {
        const results = await tool.runner!();
        allResults = [...allResults, ...results];
        setOutput(prev => [...prev, ...results]);
      } catch (err) {
        setOutput(prev => [...prev, `[!] ${tool.name} failed: ${err}`]);
      }
    }

    setOutput(prev => [...prev, '', '═'.repeat(50), '[+] 🇸🇦 FULL AUDIT COMPLETE', '═'.repeat(50)]);
    generateNiyahSummary(allResults);
    setRunning(false);
  }, [running, generateNiyahSummary]);

  const exportOutput = useCallback(() => {
    if (output.length === 0) return;
    const blob = new Blob([output.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haven_scan_${selectedTool?.id || 'output'}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [output, selectedTool]);

  return (
    <div className="h-full flex flex-col bg-black/40">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-bold text-green-400 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          SOVEREIGN SECURITY TOOLKIT
        </h2>
        <p className="text-[10px] text-white/40 mt-1">
          من حق كل إنسان الدفاع عن نفسه — Digital self-defense
        </p>
        {/* Run All button */}
        <button
          onClick={runAllScans}
          disabled={running}
          className="mt-2 w-full text-[10px] px-3 py-1.5 rounded flex items-center justify-center gap-2 font-bold transition-all
                     bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-30"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          RUN ALL REAL SCANS ({TOOLS.filter(t => t.isReal).length} tools)
        </button>
      </div>

      {/* Tool selector */}
      <div className="px-3 py-2 space-y-0.5 border-b border-white/10 max-h-[220px] overflow-y-auto">
        <div className="text-[8px] font-mono text-green-500/50 uppercase tracking-widest pt-1 pb-0.5 px-1">
          ● REAL — Actually runs in your browser
        </div>
        {TOOLS.filter(t => t.isReal).map(tool => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => { if (!running) setActiveTool(tool.id); }}
              disabled={running}
              className={`w-full text-left px-2 py-1.5 rounded transition-all flex items-center gap-2 ${isActive ? 'bg-white/10 border border-green-500/30' : 'border border-transparent hover:bg-white/5'
                } ${running && !isActive ? 'opacity-40' : ''}`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: tool.color }} />
              <span className="text-[11px] font-medium flex-1" style={{ color: isActive ? tool.color : '#aaa' }}>
                {tool.name}
              </span>
              <span className="text-[7px] px-1 py-0.5 rounded bg-green-500/15 text-green-400 font-bold">REAL</span>
            </button>
          );
        })}

        <div className="text-[8px] font-mono text-yellow-500/50 uppercase tracking-widest pt-2 pb-0.5 px-1">
          ○ SIMULATED — Educational
        </div>
        {TOOLS.filter(t => !t.isReal).map(tool => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          const cat = CATEGORY_COLORS[tool.category];
          return (
            <button
              key={tool.id}
              onClick={() => { if (!running) setActiveTool(tool.id); }}
              disabled={running}
              className={`w-full text-left px-2 py-1.5 rounded transition-all flex items-center gap-2 ${isActive ? 'bg-white/10 border border-white/20' : 'border border-transparent hover:bg-white/5'
                } ${running && !isActive ? 'opacity-40' : ''}`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: tool.color }} />
              <span className="text-[11px] font-medium flex-1" style={{ color: isActive ? tool.color : '#666' }}>
                {tool.name}
              </span>
              <span className="text-[7px] px-1 py-0.5 rounded font-bold"
                style={{ backgroundColor: cat.color + '15', color: cat.color }}>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      {selectedTool && (
        <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2">
          <button
            onClick={running ? stopTool : runTool}
            className={`text-[10px] px-3 py-1 rounded flex items-center gap-1.5 font-bold transition-all ${running
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
              }`}
          >
            {running ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {running ? 'ABORT' : selectedTool.isReal ? 'SCAN' : 'SIMULATE'}
          </button>
          <button onClick={clearOutput} disabled={running}
            className="text-[10px] px-2 py-1 rounded text-white/40 hover:text-white/70 border border-white/10 
                       hover:border-white/20 flex items-center gap-1 disabled:opacity-30">
            <Trash2 className="w-3 h-3" />
          </button>
          {output.length > 0 && !running && (
            <button onClick={exportOutput}
              className="text-[10px] px-2 py-1 rounded text-cyan-400/60 hover:text-cyan-400 border border-cyan-500/20 
                         hover:border-cyan-500/40 flex items-center gap-1">
              <Download className="w-3 h-3" /> EXPORT
            </button>
          )}
          {running && (
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] text-green-400/70 font-mono">
                {selectedTool.isReal ? 'SCANNING...' : 'SIMULATING...'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Niyah Interpretation */}
      {niyahSummary && !running && (
        <div className="mx-3 my-1.5 px-3 py-2 rounded border border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center gap-1.5 mb-1">
            <Brain className="w-3 h-3 text-purple-400" />
            <span className="text-[9px] text-purple-400 font-bold">NIYAH INTERPRETATION</span>
          </div>
          <p className="text-[10px] text-white/60 leading-relaxed" dir="auto">{niyahSummary}</p>
        </div>
      )}

      {/* Output */}
      <div ref={outputRef} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[10px]"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        {output.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-1">
              <span className="text-white/20 text-[11px] block">
                {activeTool ? `Press ${selectedTool?.isReal ? 'SCAN' : 'SIMULATE'}` : 'Select a tool'}
              </span>
              {!activeTool && (
                <span className="text-green-500/20 text-[9px] block">● REAL tools run actual browser scans</span>
              )}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {output.map((line, i) => (
              <motion.div
                key={`${i}-${line.slice(0, 20)}`}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.05 }}
                className={`leading-relaxed whitespace-pre-wrap break-all ${line.startsWith('[+] ✅') ? 'text-green-400' :
                  line.startsWith('[+]') ? 'text-green-400/80' :
                    line.startsWith('[!] ⚠️') ? 'text-red-400 font-bold' :
                      line.startsWith('[!]') ? 'text-red-400' :
                        line.startsWith('[*]') ? 'text-cyan-400/80' :
                          line.startsWith('$') ? 'text-yellow-400 font-bold' :
                            line.startsWith('    ✅') ? 'text-green-400/70' :
                              line.startsWith('    ⚠️') ? 'text-red-400/70' :
                                line.startsWith('─') ? 'text-white/10' :
                                  'text-white/40'
                  }`}
              >
                {line || '\u00A0'}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        {running && <span className="inline-block w-2 h-3.5 bg-green-400 animate-pulse ml-0.5" />}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between">
        <span className="text-[9px] text-white/30 font-mono">
          {TOOLS.filter(t => t.isReal).length} real + {TOOLS.filter(t => !t.isReal).length} sim
        </span>
        <span className="text-[9px] text-green-400/40 font-mono">🇸🇦 DRAGON SECURITY</span>
      </div>
    </div>
  );
};
