import { useState, useEffect, useCallback } from 'react';
import { useIDEStore } from '../useIDEStore';
import { threeLobeAgent } from '../engine/ThreeLobeAgent';
import { modelRouter, LOBE_CONFIGS, ALL_LOBE_IDS, type LobeId, type LobeModelInfo } from '../engine/ModelRouter';
import { ollamaService, type ConnectionStatus } from '../engine/OllamaService';
import { getFIMCacheSize } from '../engine/NiyahCompletionProvider';
import {
  GitBranch, AlertTriangle, XCircle, Bell,
  Monitor, Sparkles, Settings, Zap, HardDrive, Eye, Brain, Wifi, WifiOff,
  Database, Layers, Activity, Cpu, Shield,
} from 'lucide-react';

// ── Live Sovereignty Score ───────────────────────────────────
function useSovereigntyScore(intervalMs = 30000) {
  const [score, setScore] = useState(100);

  useEffect(() => {
    const check = () => {
      try {
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const telemetryKw = ['telemetry', 'analytics', 'tracking', 'pixel', 'beacon', 'doubleclick', 'google-analytics', 'sentry', 'hotjar'];
        let telCount = 0;
        const seen = new Set<string>();

        for (const e of entries) {
          try {
            const h = new URL(e.name).hostname;
            if (!seen.has(h) && !['localhost', '127.0.0.1', ''].includes(h) && !h.endsWith('.local')) {
              seen.add(h);
              if (telemetryKw.some(kw => h.includes(kw))) telCount++;
            }
          } catch { /* ignore */ }
        }

        const trackingNames = ['_ga', '_gid', '_fbp', '__utma', 'NID'];
        const cookies = document.cookie ? document.cookie.split(';').map(c => c.trim()).filter(Boolean) : [];
        const trackingCookies = cookies.filter(c => trackingNames.some(t => c.startsWith(t))).length;

        let deductions = telCount * 15 + trackingCookies * 10 + seen.size * 2;
        setScore(Math.max(0, 100 - deductions));
      } catch {
        setScore(100);
      }
    };

    check();
    const id = setInterval(check, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return score;
}

// ── Live Engine Stats ────────────────────────────────────────
interface EngineStats {
  ollamaStatus: ConnectionStatus;
  activeModel: string | null;
  endpointLabel: string;
  totalVramGB: number;
  loadedModels: number;
  fimCacheHits: number;
  responseCacheSize: number;
  lobes: { id: LobeId; model: string | null; loaded: boolean; vramGB: number }[];
}

function useEngineStats(intervalMs = 3000): EngineStats {
  const [stats, setStats] = useState<EngineStats>({
    ollamaStatus: 'disconnected',
    activeModel: null,
    endpointLabel: ollamaService.endpointLabel,
    totalVramGB: 0,
    loadedModels: 0,
    fimCacheHits: 0,
    responseCacheSize: 0,
    lobes: ALL_LOBE_IDS.map(id => ({ id, model: null, loaded: false, vramGB: 0 })),
  });

  const refresh = useCallback(() => {
    const lobes = ALL_LOBE_IDS.map(id => {
      const info: Readonly<LobeModelInfo> = modelRouter.getLobeModelInfo(id);
      return {
        id,
        model: info.current,
        loaded: info.runtime.loaded,
        vramGB: info.runtime.vramGB,
      };
    });

    const totalVramGB = lobes.reduce((sum, l) => sum + l.vramGB, 0);
    const loadedModels = lobes.filter(l => l.loaded).length;
    const cacheStats = modelRouter.getCacheStats();
    const activeModel = lobes.find(l => l.loaded)?.model || lobes[0]?.model || null;

    setStats({
      ollamaStatus: ollamaService.getStatus(),
      activeModel,
      endpointLabel: ollamaService.endpointLabel,
      totalVramGB,
      loadedModels,
      fimCacheHits: getFIMCacheSize(),
      responseCacheSize: cacheStats.size,
      lobes,
    });
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  // Also refresh on Ollama status change
  useEffect(() => {
    const unsub = threeLobeAgent.onStatusChange(() => refresh());
    return unsub;
  }, [refresh]);

  return stats;
}

export function StatusBar() {
  const {
    currentTheme, themeName, activeTabId, openTabs,
    cursorLine, cursorCol, terminalVisible, toggleTerminal,
    notifications, zenMode, toggleZenMode, toggleSettings,
    toggleGoToLine, toggleCommandPalette, isRealFS,
  } = useIDEStore();

  const activeTab = openTabs.find((t) => t.id === activeTabId);

  // ── Live engine telemetry (replaces fake CPU/RAM) ──────────
  const engine = useEngineStats(3000);
  const sovereigntyScore = useSovereigntyScore(30000);

  const vramColor = engine.totalVramGB > 8 ? '#ff5555' : engine.totalVramGB > 4 ? '#ffb86c' : currentTheme.accent;
  const lobeColor = engine.loadedModels >= 3 ? currentTheme.accent : engine.loadedModels > 0 ? '#ffb86c' : currentTheme.textMuted;

  return (
    <div
      className="flex items-center justify-between px-3 py-0.5 text-[11px] select-none shrink-0"
      style={{
        backgroundColor: currentTheme.accent + '15',
        borderTop: `1px solid ${currentTheme.border}`,
        color: currentTheme.textMuted,
        height: 24,
      }}
      role="status"
      aria-label="Status Bar"
    >
      {/* Left section */}
      <div className="flex items-center gap-3.5">
        {/* Brand */}
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: currentTheme.accent }}
          />
          <span style={{ color: currentTheme.accent, fontWeight: 700, letterSpacing: '0.05em' }}>HAVEN</span>
        </span>

        {/* Branch */}
        <span className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
          <GitBranch className="w-3 h-3" />
          <span>main</span>
        </span>

        {/* Errors/Warnings */}
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-0.5">
            <AlertTriangle className="w-3 h-3" style={{ color: '#ffb86c' }} />
            <span>0</span>
          </span>
          <span className="flex items-center gap-0.5">
            <XCircle className="w-3 h-3" style={{ color: '#ff5555' }} />
            <span>0</span>
          </span>
        </span>

        {/* Notifications */}
        {notifications.length > 0 && (
          <span className="flex items-center gap-1" style={{ color: currentTheme.accent }}>
            <Bell className="w-3 h-3" />
            <span>{notifications.length}</span>
          </span>
        )}

        {/* Real FS indicator */}
        {isRealFS && (
          <span className="flex items-center gap-1" style={{ color: '#22c55e', fontWeight: 600 }}>
            <HardDrive className="w-3 h-3" />
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#22c55e' }} />
            <span>LIVE FS</span>
          </span>
        )}

        {/* Sovereignty Score — live */}
        <button
          onClick={() => useIDEStore.getState().setActiveSidebarPanel('dashboard')}
          className="flex items-center gap-1 hover:opacity-100 transition-opacity"
          style={{
            color: sovereigntyScore >= 90 ? '#00FF00' : sovereigntyScore >= 70 ? '#FFD700' : '#FF0040',
            opacity: 0.9,
          }}
          title={`Sovereignty Score: ${sovereigntyScore}/100 — Click to open Dashboard`}
        >
          <Shield className="w-3 h-3" />
          <span className="font-mono font-bold">{sovereigntyScore}</span>
          {sovereigntyScore === 100 && (
            <span className="text-[8px]">🇸🇦</span>
          )}
        </button>

        {/* VRAM / Loaded Models / FIM Cache */}
        <span className="flex items-center gap-2.5" title={`VRAM ${engine.totalVramGB.toFixed(1)} GB | ${engine.loadedModels}/3 lobes loaded | FIM cache: ${engine.fimCacheHits} | Response cache: ${engine.responseCacheSize}`}>
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3" style={{ color: vramColor }} />
            <span style={{ color: vramColor, fontWeight: 600 }}>{engine.totalVramGB.toFixed(1)}G</span>
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" style={{ color: lobeColor }} />
            <span style={{ color: lobeColor, fontWeight: 600 }}>{engine.loadedModels}/3</span>
          </span>
          {engine.fimCacheHits > 0 && (
            <span className="flex items-center gap-1" title={`FIM cache: ${engine.fimCacheHits} entries`}>
              <Database className="w-3 h-3" style={{ color: currentTheme.accent, opacity: 0.7 }} />
              <span style={{ color: currentTheme.accent, fontWeight: 600, opacity: 0.7 }}>{engine.fimCacheHits}</span>
            </span>
          )}
        </span>

        {/* Active model indicator */}
        {engine.activeModel && engine.ollamaStatus === 'connected' && (
          <span
            className="flex items-center gap-1 text-[10px] truncate max-w-[120px]"
            title={`Active: ${engine.activeModel}`}
            style={{ color: currentTheme.accent, opacity: 0.7 }}
          >
            <Activity className="w-3 h-3 shrink-0" />
            <span className="truncate">{engine.activeModel.split(':')[0]}</span>
          </span>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {activeTab && (
          <>
            <button
              onClick={toggleGoToLine}
              className="hover:opacity-100 opacity-70 transition-opacity"
              aria-label={`Go to line. Current: Line ${cursorLine}, Column ${cursorCol}`}
            >
              Ln {cursorLine}, Col {cursorCol}
            </button>
            <span>Spaces: 2</span>
            <span>UTF-8</span>
            <span>CRLF</span>
            <span
              className="capitalize cursor-pointer hover:opacity-80 transition-opacity"
              onClick={toggleCommandPalette}
              aria-label="Change language mode"
            >
              {activeTab.language}
            </span>
          </>
        )}

        <button
          onClick={toggleTerminal}
          className="hover:opacity-100 transition-opacity flex items-center gap-1"
          style={{ opacity: terminalVisible ? 1 : 0.5 }}
          aria-label="Toggle Terminal"
          aria-pressed={terminalVisible}
        >
          <Monitor className="w-3 h-3" />
          <span>Terminal</span>
        </button>

        <button
          onClick={toggleZenMode}
          className="hover:opacity-100 transition-opacity"
          style={{ opacity: zenMode ? 1 : 0.5 }}
          title="Zen Mode (Ctrl+K Z)"
          aria-label="Toggle Zen Mode"
          aria-pressed={zenMode}
        >
          {zenMode ? <Sparkles className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </button>

        <button
          onClick={toggleSettings}
          className="hover:opacity-100 transition-opacity opacity-70"
          aria-label="Open Settings"
        >
          <Settings className="w-3 h-3" />
        </button>

        <span className="capitalize" style={{ color: currentTheme.accent, fontWeight: 600 }}>
          {themeName.replace(/-/g, ' ')}
        </span>

        {/* Three-Lobe AI Status */}
        <button
          onClick={() => threeLobeAgent.connect()}
          className="flex items-center gap-1 hover:opacity-100 transition-opacity"
          style={{
            color: engine.ollamaStatus === 'connected' ? '#22c55e' : engine.ollamaStatus === 'connecting' ? '#f59e0b' : currentTheme.textMuted,
            opacity: engine.ollamaStatus === 'connected' ? 1 : 0.6,
          }}
          title={`Three-Lobe AI: ${engine.ollamaStatus} → ${engine.endpointLabel}${engine.ollamaStatus === 'connected' ? ' — Click to refresh' : ' — Click to connect'}`}
          aria-label={`AI Status: ${engine.ollamaStatus}`}
        >
          <Brain className="w-3 h-3" />
          <span style={{ fontWeight: 600 }}>
            {engine.ollamaStatus === 'connected' ? engine.endpointLabel : engine.ollamaStatus === 'connecting' ? '...' : 'Offline'}
          </span>
          {engine.ollamaStatus === 'connected' && (
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#22c55e' }} />
          )}
        </button>

        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3" style={{ color: currentTheme.accent }} />
          <span>Haven IDE v5.0</span>
        </span>
      </div>
    </div>
  );
}
