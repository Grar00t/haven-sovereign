// ══════════════════════════════════════════════════════════════
// NodeRadar — Real-time sovereign infrastructure radar
// Host metrics from real browser APIs. Mesh nodes represent
// the sovereign network topology. Built by KHAWRIZM.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Cpu, MemoryStick, Wifi, WifiOff, HardDrive, BatteryCharging, Monitor, Timer } from 'lucide-react';

interface RadarNode {
  id: number;
  x: number;
  y: number;
  type: 'VALIDATOR' | 'FULL_NODE' | 'HOST_MACHINE';
  status: 'ACTIVE' | 'INACTIVE' | 'OFFLINE';
  ip: string;
  lastSeen: string;
  cpu: number;
  ram: number;
  alert: boolean;
  niyahScore: number;
  intent: string;
  isReal?: boolean;
}

/** REAL system metrics from browser APIs */
interface RealSystemMetrics {
  cpuCores: number;
  deviceMemoryGB: number;
  usedStorageMB: number;
  totalStorageMB: number;
  connectionType: string;
  downlinkMbps: number;
  isOnline: boolean;
  performanceHeapMB: number;
  performanceHeapLimitMB: number;
  batteryLevel: number;
  batteryCharging: boolean;
  gpuVendor: string;
  gpuRenderer: string;
  pageLoadMs: number;
  domNodes: number;
}

async function getRealMetrics(): Promise<RealSystemMetrics> {
  const metrics: RealSystemMetrics = {
    cpuCores: navigator.hardwareConcurrency || 0,
    deviceMemoryGB: (navigator as any).deviceMemory || 0,
    usedStorageMB: 0,
    totalStorageMB: 0,
    connectionType: 'unknown',
    downlinkMbps: 0,
    isOnline: navigator.onLine,
    performanceHeapMB: 0,
    performanceHeapLimitMB: 0,
    batteryLevel: -1,
    batteryCharging: false,
    gpuVendor: '',
    gpuRenderer: '',
    pageLoadMs: 0,
    domNodes: 0,
  };

  // Storage estimate
  try {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      metrics.usedStorageMB = Math.round((est.usage || 0) / 1024 / 1024);
      metrics.totalStorageMB = Math.round((est.quota || 0) / 1024 / 1024);
    }
  } catch { /* ignore */ }

  // Network info
  try {
    const conn = (navigator as any).connection;
    if (conn) {
      metrics.connectionType = conn.effectiveType || 'unknown';
      metrics.downlinkMbps = conn.downlink || 0;
    }
  } catch { /* ignore */ }

  // Performance memory (Chrome only)
  try {
    const perf = (performance as any);
    if (perf.memory) {
      metrics.performanceHeapMB = Math.round(perf.memory.usedJSHeapSize / 1024 / 1024);
      metrics.performanceHeapLimitMB = Math.round(perf.memory.jsHeapSizeLimit / 1024 / 1024);
    }
  } catch { /* ignore */ }

  // Battery status
  try {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      metrics.batteryLevel = Math.round(battery.level * 100);
      metrics.batteryCharging = battery.charging;
    }
  } catch { /* ignore */ }

  // GPU info from WebGL
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        metrics.gpuVendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || '';
        metrics.gpuRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
      }
    }
  } catch { /* ignore */ }

  // Page load timing
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      metrics.pageLoadMs = Math.round(nav.loadEventEnd - nav.startTime);
    }
  } catch { /* ignore */ }

  // DOM complexity
  try {
    metrics.domNodes = document.querySelectorAll('*').length;
  } catch { /* ignore */ }

  return metrics;
}

const INTENTS = [
  'BLOCK_TELEMETRY', 'DECRYPT_HANDSHAKE', 'AUDIT_COMPLIANCE',
  'ROUTE_SOVEREIGN_TRAFFIC', 'PHALANX_SHIELD_ACTIVE', 'MESH_RELAY',
  'NLP_PROCESSING', 'MODEL_INFERENCE', 'GIT_SYNC',
];

function generateNodes(): RadarNode[] {
  // Node 0 = HOST_MACHINE (real), rest = simulated mesh
  return [
    {
      id: 0, x: 50, y: 50, type: 'HOST_MACHINE', status: 'ACTIVE',
      ip: '127.0.0.1', lastSeen: new Date().toISOString(),
      cpu: 0, ram: 0, alert: false, niyahScore: 100, intent: 'HOST_MACHINE', isReal: true,
    },
    ...Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      x: 8 + Math.random() * 84,
      y: 8 + Math.random() * 84,
      type: (Math.random() > 0.5 ? 'VALIDATOR' : 'FULL_NODE') as RadarNode['type'],
      status: (Math.random() > 0.8 ? 'OFFLINE' : Math.random() > 0.6 ? 'INACTIVE' : 'ACTIVE') as RadarNode['status'],
      ip: `10.0.${Math.floor(Math.random() * 255)}.${10 + i}`,
      lastSeen: new Date().toISOString(),
      cpu: Math.floor(Math.random() * 100),
      ram: Math.floor(Math.random() * 100),
      alert: Math.random() > 0.88,
      niyahScore: Math.floor(Math.random() * 35) + 65,
      intent: INTENTS[Math.floor(Math.random() * INTENTS.length)],
    })),
  ];
}

export const NodeRadar = () => {
  const [nodes, setNodes] = useState<RadarNode[]>(generateNodes);
  const [selected, setSelected] = useState<RadarNode | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [lastSync, setLastSync] = useState<number>(Date.now());
  const [syncAgo, setSyncAgo] = useState('0s');
  const [realMetrics, setRealMetrics] = useState<RealSystemMetrics | null>(null);

  // Fetch REAL system metrics on mount + every 5s
  useEffect(() => {
    const fetchMetrics = async () => {
      const m = await getRealMetrics();
      setRealMetrics(m);
      // Update Host Machine node with real data
      setNodes(prev => prev.map(n => n.id === 0 ? {
        ...n,
        cpu: m.performanceHeapLimitMB > 0 ? Math.round((m.performanceHeapMB / m.performanceHeapLimitMB) * 100) : 0,
        ram: m.deviceMemoryGB > 0 ? Math.round((m.performanceHeapMB / 1024) / m.deviceMemoryGB * 100) : 0,
        status: m.isOnline ? 'ACTIVE' : 'OFFLINE',
        alert: m.performanceHeapLimitMB > 0 && (m.performanceHeapMB / m.performanceHeapLimitMB) > 0.8,
        lastSeen: new Date().toISOString(),
      } : n));
    };
    fetchMetrics();
    const id = setInterval(fetchMetrics, 5000);
    return () => clearInterval(id);
  }, []);

  // Simulate live updates every 3s for mesh nodes — stable positions
  useEffect(() => {
    const timer = setInterval(() => {
      setNodes(prev => prev.map(n => n.isReal ? n : ({
        ...n,
        cpu: Math.min(100, Math.max(0, n.cpu + Math.floor(Math.random() * 21) - 10)),
        ram: Math.min(100, Math.max(0, n.ram + Math.floor(Math.random() * 11) - 5)),
        status: Math.random() > 0.95
          ? (Math.random() > 0.5 ? 'OFFLINE' : 'INACTIVE')
          : n.status === 'OFFLINE' && Math.random() > 0.7 ? 'ACTIVE' : n.status,
        alert: Math.random() > 0.92,
        lastSeen: new Date().toISOString(),
      })));
      setLastSync(Date.now());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Last sync timer
  useEffect(() => {
    const tick = setInterval(() => {
      const diff = Math.floor((Date.now() - lastSync) / 1000);
      setSyncAgo(diff < 60 ? `${diff}s` : `${Math.floor(diff / 60)}m`);
    }, 1000);
    return () => clearInterval(tick);
  }, [lastSync]);

  const filtered = useMemo(() => nodes.filter(n => {
    const sm = filterStatus === 'ALL' || n.status === filterStatus;
    const tm = filterType === 'ALL' || n.type === filterType;
    return sm && tm;
  }), [nodes, filterStatus, filterType]);

  const stats = useMemo(() => ({
    active: nodes.filter(n => n.status === 'ACTIVE').length,
    inactive: nodes.filter(n => n.status === 'INACTIVE').length,
    offline: nodes.filter(n => n.status === 'OFFLINE').length,
    alerts: nodes.filter(n => n.alert).length,
  }), [nodes]);

  return (
    <div className="space-y-3 text-white">
      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-black/80 border border-green-900/30 text-[10px] font-mono uppercase p-1.5 text-green-400/70 outline-none"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="OFFLINE">Offline</option>
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-black/80 border border-green-900/30 text-[10px] font-mono uppercase p-1.5 text-green-400/70 outline-none"
        >
          <option value="ALL">All Types</option>
          <option value="VALIDATOR">Validator</option>
          <option value="FULL_NODE">Full Node</option>
          <option value="HOST_MACHINE">Host (Real)</option>
        </select>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 text-[9px] font-mono items-center">
        <span className="text-green-400">{stats.active} active</span>
        <span className="text-yellow-400">{stats.inactive} warn</span>
        <span className="text-zinc-600">{stats.offline} off</span>
        {stats.alerts > 0 && <span className="text-red-500 animate-pulse">{stats.alerts} alerts</span>}
        <span className="ml-auto text-white/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Last sync: {syncAgo} ago
        </span>
      </div>

      {/* REAL SYSTEM METRICS PANEL */}
      {realMetrics && (
        <div className="bg-black/80 border border-cyan-900/30 rounded p-2 space-y-1.5">
          <div className="text-[8px] font-mono text-cyan-400/80 font-bold flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            REAL SYSTEM METRICS
            <span className="ml-auto text-[7px] text-cyan-400/40">LIVE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-mono">
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-green-400/60" />
              <span className="text-white/40">CPU Cores:</span>
              <span className="text-white ml-auto">{realMetrics.cpuCores}</span>
            </div>
            <div className="flex items-center gap-1">
              <MemoryStick className="w-3 h-3 text-purple-400/60" />
              <span className="text-white/40">RAM:</span>
              <span className="text-white ml-auto">{realMetrics.deviceMemoryGB > 0 ? `${realMetrics.deviceMemoryGB} GB` : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-blue-400/60" />
              <span className="text-white/40">Heap:</span>
              <span className={`ml-auto ${realMetrics.performanceHeapLimitMB > 0 && (realMetrics.performanceHeapMB / realMetrics.performanceHeapLimitMB) > 0.7 ? 'text-red-400' : 'text-white'}`}>
                {realMetrics.performanceHeapMB}MB / {realMetrics.performanceHeapLimitMB}MB
              </span>
            </div>
            <div className="flex items-center gap-1">
              {realMetrics.isOnline ? <Wifi className="w-3 h-3 text-green-400/60" /> : <WifiOff className="w-3 h-3 text-red-400/60" />}
              <span className="text-white/40">Net:</span>
              <span className="text-white ml-auto">{realMetrics.connectionType} {realMetrics.downlinkMbps > 0 ? `${realMetrics.downlinkMbps}Mbps` : ''}</span>
            </div>
            <div className="flex items-center gap-1 col-span-2">
              <HardDrive className="w-3 h-3 text-yellow-400/60" />
              <span className="text-white/40">Storage:</span>
              <span className="text-white ml-auto">{realMetrics.usedStorageMB}MB / {realMetrics.totalStorageMB}MB used</span>
            </div>
            {realMetrics.batteryLevel >= 0 && (
              <div className="flex items-center gap-1">
                <BatteryCharging className="w-3 h-3 text-green-400/60" />
                <span className="text-white/40">Battery:</span>
                <span className={`ml-auto ${realMetrics.batteryLevel < 20 ? 'text-red-400' : 'text-white'}`}>
                  {realMetrics.batteryLevel}%{realMetrics.batteryCharging ? ' ⚡' : ''}
                </span>
              </div>
            )}
            {realMetrics.gpuRenderer && (
              <div className="flex items-center gap-1 col-span-2">
                <Monitor className="w-3 h-3 text-indigo-400/60" />
                <span className="text-white/40">GPU:</span>
                <span className="text-white ml-auto truncate max-w-[180px]" title={realMetrics.gpuRenderer}>
                  {realMetrics.gpuRenderer.length > 30 ? realMetrics.gpuRenderer.substring(0, 30) + '...' : realMetrics.gpuRenderer}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Timer className="w-3 h-3 text-orange-400/60" />
              <span className="text-white/40">Load:</span>
              <span className="text-white ml-auto">{realMetrics.pageLoadMs}ms</span>
            </div>
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-pink-400/60" />
              <span className="text-white/40">DOM:</span>
              <span className="text-white ml-auto">{realMetrics.domNodes.toLocaleString()} nodes</span>
            </div>
          </div>
          {/* Heap usage bar */}
          {realMetrics.performanceHeapLimitMB > 0 && (
            <div className="space-y-0.5">
              <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${(realMetrics.performanceHeapMB / realMetrics.performanceHeapLimitMB) > 0.7 ? 'bg-red-500' : 'bg-cyan-500'}`}
                  style={{ width: `${Math.min(100, (realMetrics.performanceHeapMB / realMetrics.performanceHeapLimitMB) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Radar display */}
      <div className="relative w-full aspect-square max-h-[320px] bg-black/80 border border-green-900/20 overflow-hidden rounded">
        {/* Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full">
            <circle cx="50%" cy="50%" r="12%" fill="none" stroke="#00FF00" strokeWidth="0.5" />
            <circle cx="50%" cy="50%" r="24%" fill="none" stroke="#00FF00" strokeWidth="0.5" />
            <circle cx="50%" cy="50%" r="36%" fill="none" stroke="#00FF00" strokeWidth="0.5" />
            <circle cx="50%" cy="50%" r="48%" fill="none" stroke="#00FF00" strokeWidth="0.5" />
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#00FF00" strokeWidth="0.5" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#00FF00" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Center glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,0,0.05),transparent_60%)] pointer-events-none" />

        {/* Sweep */}
        <div
          className="absolute top-1/2 left-1/2 w-[160%] h-[160%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,255,0,0.06) 60deg, rgba(0,255,0,0.12) 90deg, transparent 90deg)',
            animation: 'spin 5s linear infinite',
          }}
        />

        {/* Nodes */}
        <div className="relative w-full h-full">
          {filtered.map(node => (
            <button
              key={node.id}
              onClick={() => setSelected(node)}
              className={`absolute transition-all duration-300 -translate-x-1/2 -translate-y-1/2 ${
                node.isReal
                  ? 'w-4 h-4 bg-cyan-400 shadow-[0_0_14px_rgba(0,255,255,0.6)] rounded-sm rotate-45 scale-125 border border-cyan-300'
                  : node.alert
                    ? 'w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_red] animate-pulse scale-150'
                    : node.status === 'OFFLINE'
                      ? 'w-2.5 h-2.5 rounded-full bg-zinc-700 opacity-40'
                      : node.status === 'INACTIVE'
                        ? 'w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.4)]'
                        : 'w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(0,255,0,0.5)]'
              }`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              title={`${node.type} — ${node.ip}${node.isReal ? ' [REAL]' : ''}`}
            >
              {node.alert && (
                <span className="absolute -inset-2 border border-red-500 rounded-full animate-ping opacity-40" />
              )}
            </button>
          ))}
        </div>

        {/* Label */}
        <div className="absolute top-1.5 left-2 text-[8px] font-mono text-green-500/40 uppercase tracking-[0.3em]">
          Sovereign_Infra_Radar
        </div>

        {/* Legend */}
        <div className="absolute bottom-1.5 right-2 flex gap-2 text-[7px] font-mono text-white/25">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-cyan-400 rounded-sm rotate-45" />Host</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full" />OK</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />Warn</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" />Alert</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />Off</span>
        </div>
      </div>

      {/* Selected node detail */}
      {selected && (
        <div className="bg-black/90 border border-green-900/30 p-3 rounded space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                selected.alert ? 'bg-red-500 animate-pulse' :
                selected.status === 'ACTIVE' ? 'bg-green-400' :
                selected.status === 'INACTIVE' ? 'bg-yellow-500' : 'bg-zinc-700'
              }`} />
              <span className="text-[10px] font-mono font-bold text-white uppercase">
                Node #{selected.id} — {selected.type}
              </span>
            </div>
            <button onClick={() => setSelected(null)} className="text-zinc-600 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
            <div>
              <span className="text-zinc-600 block">IP</span>
              <span className="text-white">{selected.ip}</span>
            </div>
            <div>
              <span className="text-zinc-600 block">STATUS</span>
              <span className={selected.alert ? 'text-red-500' : selected.status === 'ACTIVE' ? 'text-green-400' : 'text-yellow-500'}>
                {selected.alert ? 'CRITICAL' : selected.status}
              </span>
            </div>
          </div>

          {/* CPU bar */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-[8px] font-mono">
              <span className="text-zinc-600">CPU</span>
              <span className="text-white">{selected.cpu}%</span>
            </div>
            <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
              <div className={`h-full transition-all ${selected.cpu > 80 ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${selected.cpu}%` }} />
            </div>
          </div>

          {/* RAM bar */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-[8px] font-mono">
              <span className="text-zinc-600">RAM</span>
              <span className="text-white">{selected.ram}%</span>
            </div>
            <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
              <div className={`h-full transition-all ${selected.ram > 80 ? 'bg-red-500' : 'bg-cyan-500'}`}
                style={{ width: `${selected.ram}%` }} />
            </div>
          </div>

          {/* Niyah */}
          <div className="bg-zinc-950 p-2 border border-zinc-800 rounded space-y-1">
            <div className="flex justify-between text-[8px] font-mono">
              <span className="text-green-600">NIYAH_INTENT</span>
              <span className="text-green-400">{selected.niyahScore}%</span>
            </div>
            <p className="text-[9px] font-mono text-white/60">{selected.intent}</p>
            <div className="w-full h-0.5 bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-600 to-green-500" style={{ width: `${selected.niyahScore}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
