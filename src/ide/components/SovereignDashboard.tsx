// ══════════════════════════════════════════════════════════════
// SovereignDashboard — Unified Operations Centre
// One pane to rule them all. NodeRadar mini, IntentGraph mini,
// ForensicAlerts, GitStatus, System Metrics, Sovereignty Score.
// Zero cloud. Full sovereignty. Your kingdom at a glance.
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useIDEStore } from '../useIDEStore';
import {
  Shield, Radar, Network, Fingerprint, GitBranch,
  Cpu, MemoryStick, HardDrive, Wifi, WifiOff, Activity,
  AlertTriangle, CheckCircle, Eye, Zap, Brain, Crown,
  RefreshCw, Trash2, Ban, RadioTower, Lightbulb,
} from 'lucide-react';
import { sovereignSessionCleaner, type PurgeManifest } from '../engine/SovereignSessionCleaner';

// Lazy load heavy sub-components
const IntentGraph = lazy(() =>
  import('./IntentGraph').then(m => ({ default: m.IntentGraph }))
);

// ── Real system metrics (shared with NodeRadar) ──────────────

interface SystemSnapshot {
  cpuCores: number;
  deviceMemoryGB: number;
  heapUsedMB: number;
  heapLimitMB: number;
  storageUsedMB: number;
  storageTotalMB: number;
  isOnline: boolean;
  connectionType: string;
  downlinkMbps: number;
  serviceWorkers: number;
  resourceLoads: number;
  externalDomains: number;
  telemetryDomains: number;
  trackingCookies: number;
  localStorageKeys: number;
  trackingKeys: number;
  sovereigntyScore: number;
}

async function getSystemSnapshot(): Promise<SystemSnapshot> {
  const snap: SystemSnapshot = {
    cpuCores: navigator.hardwareConcurrency || 0,
    deviceMemoryGB: (navigator as any).deviceMemory || 0,
    heapUsedMB: 0, heapLimitMB: 0,
    storageUsedMB: 0, storageTotalMB: 0,
    isOnline: navigator.onLine,
    connectionType: 'unknown', downlinkMbps: 0,
    serviceWorkers: 0,
    resourceLoads: 0, externalDomains: 0, telemetryDomains: 0,
    trackingCookies: 0, localStorageKeys: 0, trackingKeys: 0,
    sovereigntyScore: 100,
  };

  // Heap
  try {
    const perf = (performance as any);
    if (perf.memory) {
      snap.heapUsedMB = Math.round(perf.memory.usedJSHeapSize / 1024 / 1024);
      snap.heapLimitMB = Math.round(perf.memory.jsHeapSizeLimit / 1024 / 1024);
    }
  } catch { /* ignore */ }

  // Storage
  try {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      snap.storageUsedMB = Math.round((est.usage || 0) / 1024 / 1024);
      snap.storageTotalMB = Math.round((est.quota || 0) / 1024 / 1024);
    }
  } catch { /* ignore */ }

  // Network
  try {
    const conn = (navigator as any).connection;
    if (conn) {
      snap.connectionType = conn.effectiveType || 'unknown';
      snap.downlinkMbps = conn.downlink || 0;
    }
  } catch { /* ignore */ }

  // Service workers
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      snap.serviceWorkers = regs.length;
    }
  } catch { /* ignore */ }

  // Performance API scan
  try {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    snap.resourceLoads = entries.length;
    const telemetryKw = ['telemetry', 'analytics', 'tracking', 'pixel', 'beacon', 'doubleclick', 'google-analytics', 'sentry', 'hotjar'];
    const extDomains = new Set<string>();
    const telDomains = new Set<string>();

    for (const e of entries) {
      try {
        const url = new URL(e.name);
        const h = url.hostname;
        if (!['localhost', '127.0.0.1', ''].includes(h) && !h.endsWith('.local')) {
          extDomains.add(h);
          if (telemetryKw.some(kw => h.includes(kw))) telDomains.add(h);
        }
      } catch { /* ignore */ }
    }
    snap.externalDomains = extDomains.size;
    snap.telemetryDomains = telDomains.size;
  } catch { /* ignore */ }

  // Cookies
  try {
    const trackingNames = ['_ga', '_gid', '_fbp', '__utma', 'NID', 'SID'];
    const cookies = document.cookie ? document.cookie.split(';').map(c => c.trim()).filter(Boolean) : [];
    snap.trackingCookies = cookies.filter(c => trackingNames.some(t => c.startsWith(t))).length;
  } catch { /* ignore */ }

  // localStorage
  try {
    const trackingKw = ['analytics', 'tracking', '_ga', 'fbclid', 'hubspot', 'mixpanel', 'segment'];
    const keys = Object.keys(localStorage);
    snap.localStorageKeys = keys.length;
    snap.trackingKeys = keys.filter(k => trackingKw.some(t => k.toLowerCase().includes(t))).length;
  } catch { /* ignore */ }

  // Sovereignty Score
  let deductions = 0;
  deductions += snap.telemetryDomains * 15;
  deductions += snap.trackingCookies * 10;
  deductions += snap.trackingKeys * 5;
  deductions += snap.externalDomains * 3;
  snap.sovereigntyScore = Math.max(0, 100 - deductions);

  return snap;
}

// ── Sovereign Purge — wipe all tracking in one shot ──────────

interface PurgeResult {
  cookiesCleared: number;
  keysCleared: number;
  hostsEntries: string[];
}

function executeSovereignPurge(snapshot: SystemSnapshot | null): PurgeResult {
  const result: PurgeResult = { cookiesCleared: 0, keysCleared: 0, hostsEntries: [] };
  if (!snapshot) return result;

  // Clear tracking cookies
  try {
    const trackingNames = ['_ga', '_gid', '_fbp', '__utma', '__utmb', '__utmc', '__utmz', 'NID', 'SID'];
    const cookies = document.cookie ? document.cookie.split(';').map(c => c.trim()) : [];
    for (const c of cookies) {
      const name = c.split('=')[0];
      if (trackingNames.some(t => name.startsWith(t))) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        result.cookiesCleared++;
      }
    }
  } catch { /* ignore */ }

  // Clear tracking localStorage keys
  try {
    const trackingKw = ['analytics', 'tracking', '_ga', 'fbclid', 'hubspot', 'mixpanel', 'segment'];
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (trackingKw.some(t => k.toLowerCase().includes(t))) {
        localStorage.removeItem(k);
        result.keysCleared++;
      }
    }
  } catch { /* ignore */ }

  // Generate hosts blocklist from detected external domains
  try {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const telemetryKw = ['telemetry', 'analytics', 'tracking', 'pixel', 'beacon', 'doubleclick', 'google-analytics', 'sentry', 'hotjar'];
    const blocked = new Set<string>();
    for (const e of entries) {
      try {
        const h = new URL(e.name).hostname;
        if (telemetryKw.some(kw => h.includes(kw))) blocked.add(h);
      } catch { /* ignore */ }
    }
    result.hostsEntries = Array.from(blocked).map(d => `0.0.0.0 ${d}`);
  } catch { /* ignore */ }

  return result;
}

// ── Live Leak Monitor — PerformanceObserver for real-time ────

interface LiveLeak {
  hostname: string;
  type: 'telemetry' | 'external';
  timestamp: number;
}

// ── Executive Lobe Recommendations ───────────────────────────

function getRecommendations(snapshot: SystemSnapshot | null): string[] {
  if (!snapshot) return [];
  const recs: string[] = [];

  if (snapshot.telemetryDomains > 0)
    recs.push(`حظر ${snapshot.telemetryDomains} نطاق تتبع في /etc/hosts`);
  if (snapshot.trackingCookies > 0)
    recs.push(`مسح ${snapshot.trackingCookies} كوكيز تتبع`);
  if (snapshot.trackingKeys > 0)
    recs.push(`إزالة ${snapshot.trackingKeys} مفتاح تتبع من localStorage`);
  if (snapshot.heapLimitMB > 0 && (snapshot.heapUsedMB / snapshot.heapLimitMB) > 0.7)
    recs.push('ذاكرة الـ Heap مرتفعة — أعد تشغيل التبويب');
  if (!snapshot.isOnline)
    recs.push('وضع الطيران نشط — سيادة كاملة');
  if (snapshot.serviceWorkers === 0)
    recs.push('لا يوجد Service Worker — فعّل PWA للعمل بلا اتصال');
  if (recs.length === 0)
    recs.push('لا توصيات — النظام سيادي بالكامل');

  return recs;
}

// ── Mini Radar SVG ───────────────────────────────────────────

function MiniRadar({ nodeCount = 8 }: { nodeCount?: number }) {
  const [sweep, setSweep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSweep(s => (s + 3) % 360), 50);
    return () => clearInterval(id);
  }, []);

  const nodes = useMemo(() =>
    Array.from({ length: nodeCount }, (_, i) => ({
      x: 50 + Math.cos((i / nodeCount) * Math.PI * 2) * (15 + Math.random() * 30),
      y: 50 + Math.sin((i / nodeCount) * Math.PI * 2) * (15 + Math.random() * 30),
      active: Math.random() > 0.2,
    }))
  , [nodeCount]);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Grid circles */}
      <circle cx="50" cy="50" r="15" fill="none" stroke="#00FF00" strokeWidth="0.3" opacity="0.2" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#00FF00" strokeWidth="0.3" opacity="0.15" />
      <circle cx="50" cy="50" r="45" fill="none" stroke="#00FF00" strokeWidth="0.3" opacity="0.1" />
      {/* Crosshairs */}
      <line x1="50" y1="5" x2="50" y2="95" stroke="#00FF00" strokeWidth="0.2" opacity="0.1" />
      <line x1="5" y1="50" x2="95" y2="50" stroke="#00FF00" strokeWidth="0.2" opacity="0.1" />
      {/* Sweep */}
      <line
        x1="50" y1="50"
        x2={50 + Math.cos(sweep * Math.PI / 180) * 48}
        y2={50 + Math.sin(sweep * Math.PI / 180) * 48}
        stroke="#00FF00" strokeWidth="0.8" opacity="0.4"
      />
      {/* Nodes */}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.active ? 2 : 1.5}
          fill={n.active ? '#00FF00' : '#666'} opacity={n.active ? 0.8 : 0.3} />
      ))}
      {/* Center */}
      <circle cx="50" cy="50" r="3" fill="#00FFFF" opacity="0.6" />
    </svg>
  );
}

// ── Sovereignty Gauge ────────────────────────────────────────

function SovereigntyGauge({ score }: { score: number }) {
  const color = score >= 90 ? '#00FF00' : score >= 70 ? '#FFD700' : score >= 50 ? '#FF6B00' : '#FF0040';
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-full aspect-square flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#333" strokeWidth="6" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black font-mono" style={{ color }}>{score}</span>
        <span className="text-[7px] font-mono text-white/40">SOVEREIGNTY</span>
      </div>
    </div>
  );
}

// ── Metric Card ──────────────────────────────────────────────

function MetricCard({ icon, label, value, color = '#888', alert }: {
  icon: React.ReactNode; label: string; value: string; color?: string; alert?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded border transition-all ${
      alert ? 'border-red-500/30 bg-red-500/5' : 'border-white/5 bg-white/[0.02]'
    }`}>
      <div style={{ color }} className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[8px] text-white/30 uppercase tracking-wider">{label}</div>
        <div className="text-[11px] font-mono font-bold truncate" style={{ color }}>{value}</div>
      </div>
    </div>
  );
}

// ── Alert Item ───────────────────────────────────────────────

function AlertItem({ severity, text }: { severity: 'critical' | 'warning' | 'ok'; text: string; key?: React.Key }) {
  const colors = {
    critical: { bg: '#FF004015', border: '#FF004040', text: '#FF0040', icon: '🔴' },
    warning: { bg: '#FFD70015', border: '#FFD70040', text: '#FFD700', icon: '🟡' },
    ok: { bg: '#00FF0015', border: '#00FF0040', text: '#00FF00', icon: '🟢' },
  };
  const c = colors[severity];
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-mono"
      style={{ backgroundColor: c.bg, borderLeft: `2px solid ${c.border}`, color: c.text }}>
      <span>{c.icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  SOVEREIGN DASHBOARD COMPONENT
// ══════════════════════════════════════════════════════════════

export const SovereignDashboard = () => {
  const { currentTheme, sidebarWidth } = useIDEStore();
  const niyahVector = useIDEStore(s => s.niyahVector);
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [liveLeaks, setLiveLeaks] = useState<LiveLeak[]>([]);
  const [purgeResult, setPurgeResult] = useState<PurgeResult | null>(null);
  const [purging, setPurging] = useState(false);
  const [sessionManifest, setSessionManifest] = useState<PurgeManifest | null>(null);
  const clearNiyahHistory = useIDEStore(s => s.clearNiyahHistory);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getSystemSnapshot();
      setSnapshot(s);
      setLastRefresh(Date.now());
      setPurgeResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 10s
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [refresh]);

  // Live Leak Monitor via PerformanceObserver
  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return;

    const telemetryKw = ['telemetry', 'analytics', 'tracking', 'pixel', 'beacon', 'doubleclick', 'google-analytics', 'sentry', 'hotjar'];

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          try {
            const h = new URL(entry.name).hostname;
            if (['localhost', '127.0.0.1', ''].includes(h) || h.endsWith('.local')) continue;
            const isTelemetry = telemetryKw.some(kw => h.includes(kw));
            setLiveLeaks(prev => {
              const next = [...prev, { hostname: h, type: isTelemetry ? 'telemetry' as const : 'external' as const, timestamp: Date.now() }];
              return next.slice(-20); // keep last 20
            });
          } catch { /* ignore */ }
        }
      });
      observer.observe({ type: 'resource', buffered: false });
      return () => observer.disconnect();
    } catch { /* PerformanceObserver not supported */ }
  }, []);

  // Sovereign Purge handler — surface + deep session cleanse
  const handlePurge = useCallback(async () => {
    setPurging(true);
    try {
      // Phase 1: Surface purge (cookies, localStorage tracking, hosts)
      const result = executeSovereignPurge(snapshot);
      setPurgeResult(result);

      // Phase 2: Deep session purge (agent history, niyah memory, Ollama context)
      const manifest = await sovereignSessionCleaner.purge('deep');
      setSessionManifest(manifest);

      // Phase 3: Zustand niyah slice reset
      clearNiyahHistory();

      // Re-scan after purge
      setTimeout(refresh, 500);
    } finally {
      setPurging(false);
    }
  }, [snapshot, refresh, clearNiyahHistory]);

  // Executive Lobe recommendations
  const recommendations = useMemo(() => getRecommendations(snapshot), [snapshot]);

  const alerts = useMemo(() => {
    if (!snapshot) return [];
    const a: { severity: 'critical' | 'warning' | 'ok'; text: string }[] = [];

    if (snapshot.telemetryDomains > 0) a.push({ severity: 'critical', text: `${snapshot.telemetryDomains} telemetry domains detected` });
    if (snapshot.trackingCookies > 0) a.push({ severity: 'warning', text: `${snapshot.trackingCookies} tracking cookies found` });
    if (snapshot.trackingKeys > 0) a.push({ severity: 'warning', text: `${snapshot.trackingKeys} tracking localStorage keys` });
    if (snapshot.externalDomains > 0) a.push({ severity: 'warning', text: `${snapshot.externalDomains} external domain connections` });
    if (!snapshot.isOnline) a.push({ severity: 'ok', text: 'Network OFFLINE — air-gapped mode' });
    if (snapshot.sovereigntyScore === 100) a.push({ severity: 'ok', text: 'SOVEREIGNTY CONFIRMED — 100/100' });
    if (snapshot.serviceWorkers > 0) a.push({ severity: 'ok', text: `${snapshot.serviceWorkers} service worker(s) active` });
    if (a.length === 0) a.push({ severity: 'ok', text: 'No alerts — system sovereign' });

    return a;
  }, [snapshot]);

  return (
    <div
      className="flex flex-col h-full overflow-y-auto overflow-x-hidden select-none"
      style={{
        width: Math.max(sidebarWidth, 280),
        backgroundColor: currentTheme.bg,
        borderRight: `1px solid ${currentTheme.border}`,
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2 shrink-0"
        style={{ borderBottom: `1px solid ${currentTheme.border}` }}
      >
        <Crown className="w-4 h-4" style={{ color: '#FFD700' }} />
        <div className="flex-1">
          <div className="text-[11px] font-bold tracking-wider" style={{ color: '#FFD700' }}>
            SOVEREIGN DASHBOARD
          </div>
          <div className="text-[8px] text-white/30 font-mono">مركز العمليات السيادية</div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1 rounded hover:bg-white/5 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: currentTheme.accent }} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* ── Top Row: Sovereignty Gauge + Mini Radar ────────── */}
        <div className="grid grid-cols-2 gap-2">
          {/* Sovereignty Score Gauge */}
          <div className="bg-black/40 border border-white/5 rounded p-2">
            <div className="text-[8px] text-white/30 font-mono text-center mb-1">SOVEREIGNTY</div>
            <div className="w-20 h-20 mx-auto">
              <SovereigntyGauge score={snapshot?.sovereigntyScore ?? 100} />
            </div>
            {snapshot && (
              <div className="text-[8px] text-center font-mono mt-1" style={{
                color: snapshot.sovereigntyScore >= 90 ? '#00FF00' : snapshot.sovereigntyScore >= 70 ? '#FFD700' : '#FF0040'
              }}>
                {snapshot.sovereigntyScore >= 90 ? '🇸🇦 SOVEREIGN' : snapshot.sovereigntyScore >= 70 ? '⚠️ PARTIAL' : '🔴 COMPROMISED'}
              </div>
            )}
          </div>

          {/* Mini Radar */}
          <div className="bg-black/40 border border-white/5 rounded p-2">
            <div className="text-[8px] text-white/30 font-mono text-center mb-1">MESH RADAR</div>
            <div className="w-20 h-20 mx-auto">
              <MiniRadar />
            </div>
            <div className="text-[8px] text-center font-mono mt-1 text-green-400/60">
              16 NODES ACTIVE
            </div>
          </div>
        </div>

        {/* ── System Metrics Grid ───────────────────────────── */}
        <div className="space-y-1">
          <div className="text-[8px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3" />
            REAL SYSTEM METRICS
          </div>
          <div className="grid grid-cols-2 gap-1">
            <MetricCard
              icon={<Cpu className="w-3.5 h-3.5" />}
              label="CPU Cores"
              value={`${snapshot?.cpuCores ?? '—'}`}
              color="#00FF00"
            />
            <MetricCard
              icon={<MemoryStick className="w-3.5 h-3.5" />}
              label="RAM"
              value={snapshot?.deviceMemoryGB ? `${snapshot.deviceMemoryGB} GB` : 'N/A'}
              color="#a855f7"
            />
            <MetricCard
              icon={<HardDrive className="w-3.5 h-3.5" />}
              label="JS Heap"
              value={snapshot ? `${snapshot.heapUsedMB}/${snapshot.heapLimitMB} MB` : '—'}
              color="#00BFFF"
              alert={snapshot ? snapshot.heapLimitMB > 0 && (snapshot.heapUsedMB / snapshot.heapLimitMB) > 0.8 : false}
            />
            <MetricCard
              icon={snapshot?.isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              label="Network"
              value={snapshot ? `${snapshot.connectionType} ${snapshot.downlinkMbps > 0 ? `${snapshot.downlinkMbps}Mbps` : ''}` : '—'}
              color={snapshot?.isOnline ? '#22c55e' : '#ef4444'}
            />
            <MetricCard
              icon={<HardDrive className="w-3.5 h-3.5" />}
              label="Storage"
              value={snapshot ? `${snapshot.storageUsedMB}/${snapshot.storageTotalMB} MB` : '—'}
              color="#FFD700"
            />
            <MetricCard
              icon={<Network className="w-3.5 h-3.5" />}
              label="Resources"
              value={snapshot ? `${snapshot.resourceLoads} loads` : '—'}
              color="#888"
            />
          </div>
        </div>

        {/* ── Security Alerts ───────────────────────────────── */}
        <div className="space-y-1">
          <div className="text-[8px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            SECURITY ALERTS
          </div>
          <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
            {alerts.map((a, i) => (
              <AlertItem key={i} severity={a.severity} text={a.text} />
            ))}
          </div>
        </div>

        {/* ── Forensic Summary ──────────────────────────────── */}
        <div className="space-y-1">
          <div className="text-[8px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1">
            <Fingerprint className="w-3 h-3" />
            FORENSIC SNAPSHOT
          </div>
          <div className="grid grid-cols-3 gap-1 text-center">
            <div className="bg-black/40 border border-white/5 rounded p-1.5">
              <div className="text-lg font-black font-mono" style={{ color: snapshot?.telemetryDomains ? '#FF0040' : '#00FF00' }}>
                {snapshot?.telemetryDomains ?? 0}
              </div>
              <div className="text-[7px] text-white/30">TELEMETRY</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded p-1.5">
              <div className="text-lg font-black font-mono" style={{ color: snapshot?.trackingCookies ? '#FFD700' : '#00FF00' }}>
                {snapshot?.trackingCookies ?? 0}
              </div>
              <div className="text-[7px] text-white/30">COOKIES</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded p-1.5">
              <div className="text-lg font-black font-mono" style={{ color: snapshot?.trackingKeys ? '#FFD700' : '#00FF00' }}>
                {snapshot?.trackingKeys ?? 0}
              </div>
              <div className="text-[7px] text-white/30">TRACKING</div>
            </div>
          </div>
        </div>

        {/* ── Sovereign Purge ──────────────────────────────── */}
        {snapshot && (snapshot.trackingCookies > 0 || snapshot.trackingKeys > 0 || snapshot.telemetryDomains > 0) && (
          <div className="space-y-1">
            <button
              onClick={handlePurge}
              disabled={purging}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded font-mono text-[10px] font-bold uppercase tracking-wider transition-all hover:brightness-125 active:scale-[0.98]"
              style={{
                backgroundColor: '#FF004020',
                border: '1px solid #FF004060',
                color: '#FF0040',
              }}
            >
              <Trash2 className={`w-3.5 h-3.5 ${purging ? 'animate-spin' : ''}`} />
              {purging ? 'جاري التطهير...' : 'SOVEREIGN PURGE — تطهير سيادي'}
            </button>
            {purgeResult && (
              <div className="bg-green-500/5 border border-green-500/20 rounded p-2 space-y-0.5">
                <div className="text-[8px] font-mono text-green-400">
                  ✅ {purgeResult.cookiesCleared} cookies cleared
                </div>
                <div className="text-[8px] font-mono text-green-400">
                  ✅ {purgeResult.keysCleared} localStorage keys removed
                </div>
                {purgeResult.hostsEntries.length > 0 && (
                  <div className="text-[8px] font-mono text-yellow-400">
                    📋 {purgeResult.hostsEntries.length} hosts entries ready — copy to /etc/hosts
                  </div>
                )}
                {sessionManifest && (
                  <>
                    <div className="text-[8px] font-mono text-cyan-400">
                      🧠 {sessionManifest.agentHistoryCleared} agent messages purged
                    </div>
                    <div className="text-[8px] font-mono text-cyan-400">
                      🔮 {sessionManifest.niyahSessionsCleared} niyah sessions cleared
                    </div>
                    <div className="text-[8px] font-mono text-cyan-400">
                      💾 {(sessionManifest.bytesOverwritten / 1024 / 1024).toFixed(0)}MB heap overwritten
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Live Leak Monitor ──────────────────────────────── */}
        {liveLeaks.length > 0 && (
          <div className="space-y-1">
            <div className="text-[8px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1">
              <RadioTower className="w-3 h-3" />
              LIVE NETWORK LEAKS
              <span className="ml-auto text-[7px] px-1 py-0.5 rounded bg-red-500/20 text-red-400 font-mono">
                {liveLeaks.filter(l => l.type === 'telemetry').length} TELEMETRY
              </span>
            </div>
            <div className="space-y-0.5 max-h-[80px] overflow-y-auto">
              {liveLeaks.slice(-8).reverse().map((leak, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-mono" style={{
                  backgroundColor: leak.type === 'telemetry' ? '#FF004010' : '#FFD70010',
                  borderLeft: `2px solid ${leak.type === 'telemetry' ? '#FF004040' : '#FFD70040'}`,
                  color: leak.type === 'telemetry' ? '#FF0040' : '#FFD700',
                }}>
                  <Ban className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{leak.hostname}</span>
                  <span className="ml-auto text-[7px] opacity-50">
                    {new Date(leak.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Executive Lobe Recommendations ─────────────────── */}
        <div className="space-y-1">
          <div className="text-[8px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            EXECUTIVE LOBE — توصيات
          </div>
          <div className="space-y-0.5">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-1.5 px-2 py-1 rounded text-[9px] font-mono bg-cyan-500/5 border-l-2 border-cyan-500/30 text-cyan-400/80">
                <Zap className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Niyah Vector Status ───────────────────────────── */}
        <div className="space-y-1">
          <div className="text-[8px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1">
            <Brain className="w-3 h-3" />
            NIYAH COGNITIVE STATE
          </div>
          {niyahVector ? (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded p-2 space-y-1">
              <div className="flex items-center gap-2 text-[9px] font-mono">
                <span className="text-purple-400">Domain:</span>
                <span className="text-white">{niyahVector.vector.domain}</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono">
                <span className="text-purple-400">Tone:</span>
                <span className="text-white">{niyahVector.vector.tone}</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono">
                <span className="text-purple-400">Dialect:</span>
                <span className="text-white">{niyahVector.vector.dialect}</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono">
                <span className="text-purple-400">Confidence:</span>
                <span className="text-white">{(niyahVector.vector.confidence * 100).toFixed(0)}%</span>
              </div>
              {niyahVector.lobes && (
                <div className="flex gap-1 mt-1">
                  {niyahVector.lobes.map((l, i) => (
                    <span key={i} className="text-[7px] px-1 py-0.5 rounded bg-white/5 text-white/40 font-mono">
                      {l.name}: {l.load.toFixed(0)}%
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/5 rounded p-2 text-[9px] text-white/20 font-mono text-center">
              No active vector — run <code>niyah</code> to activate
            </div>
          )}
        </div>

        {/* ── Mini Intent Graph ──────────────────────────────── */}
        <div className="space-y-1">
          <div className="text-[8px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1">
            <Network className="w-3 h-3" />
            INTENT GRAPH
          </div>
          <Suspense fallback={
            <div className="h-[140px] flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
            </div>
          }>
            <IntentGraph height={140} />
          </Suspense>
        </div>

        {/* ── Footer ────────────────────────────────────────── */}
        <div className="text-center text-[7px] text-white/15 font-mono pt-2 pb-1">
          HAVEN SOVEREIGN OPERATIONS CENTRE v1.0
          <br />
          آخر تحديث: {new Date(lastRefresh).toLocaleTimeString('ar-SA')}
        </div>
      </div>
    </div>
  );
};
