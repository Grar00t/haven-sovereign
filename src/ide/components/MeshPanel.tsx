/**
 * K-FORGE MESH — P2P Network Panel
 * Real peer discovery, node visualization, and sync status.
 * 
 * KHAWRIZM Labs — Dragon403
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useIDEStore } from '../useIDEStore';
import {
  Wifi, WifiOff, Radio, Globe, Server, RefreshCw,
  Shield, Loader2, CheckCircle, XCircle, Users, Zap,
  Play, Square, Search,
} from 'lucide-react';

interface MeshPeer {
  address: string;
  hostname?: string;
  platform?: string;
  ide?: string;
  version?: string;
  lastSeen: number;
  latencyMs?: number;
  status: 'active' | 'syncing' | 'offline';
}

interface MeshStatus {
  running: boolean;
  port: number;
  peersCount: number;
  objectsSynced: number;
  lastSync: number | null;
}

export function MeshPanel() {
  const { currentTheme } = useIDEStore();
  const [meshStatus, setMeshStatus] = useState<MeshStatus>({
    running: false,
    port: 9403,
    peersCount: 0,
    objectsSynced: 0,
    lastSync: null,
  });
  const [peers, setPeers] = useState<MeshPeer[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [localSubnet, setLocalSubnet] = useState('');
  const [customPeer, setCustomPeer] = useState('');

  const hasNativeApi = typeof window !== 'undefined' && 'haven' in window;

  // Start mesh server
  const startMesh = async () => {
    setIsStarting(true);
    try {
      if (hasNativeApi) {
        const result = await (window as any).haven.mesh.start();
        setMeshStatus(prev => ({ ...prev, running: result.status === 'started' || result.status === 'already_running', port: result.port || 9403 }));
      } else {
        setMeshStatus(prev => ({ ...prev, running: true }));
      }
    } catch (err) {
      console.error('Mesh start error:', err);
    }
    setIsStarting(false);
  };

  // Stop mesh
  const stopMesh = async () => {
    try {
      if (hasNativeApi) {
        await (window as any).haven.mesh.stop();
      }
      setMeshStatus(prev => ({ ...prev, running: false }));
    } catch {}
  };

  // Discover peers
  const discoverPeers = async () => {
    setIsScanning(true);
    try {
      if (hasNativeApi) {
        const discovered = await (window as any).haven.mesh.discover(localSubnet || undefined);
        const newPeers: MeshPeer[] = discovered.map((p: any) => ({
          address: p.address,
          hostname: p.hostname || 'Unknown',
          platform: p.platform || '?',
          ide: p.ide || 'K-Forge',
          version: p.version || '?',
          lastSeen: Date.now(),
          status: 'active' as const,
        }));
        setPeers(prev => {
          const existing = new Map(prev.map(p => [p.address, p]));
          newPeers.forEach(p => existing.set(p.address, p));
          return Array.from(existing.values());
        });
        setMeshStatus(prev => ({ ...prev, peersCount: newPeers.length }));
      }
    } catch (err) {
      console.error('Discovery error:', err);
    }
    setIsScanning(false);
  };

  // Listen for new peers
  useEffect(() => {
    if (hasNativeApi) {
      (window as any).haven.mesh.onPeerDiscovered((peer: any) => {
        setPeers(prev => {
          const exists = prev.find(p => p.address === peer.address);
          if (exists) return prev;
          return [...prev, { ...peer, status: 'active', lastSeen: Date.now() }];
        });
      });
    }
  }, []);

  // Add manual peer
  const addManualPeer = () => {
    if (!customPeer.trim()) return;
    const newPeer: MeshPeer = {
      address: customPeer.trim(),
      hostname: 'Manual',
      status: 'active',
      lastSeen: Date.now(),
    };
    setPeers(prev => [...prev, newPeer]);
    setCustomPeer('');
  };

  const theme = currentTheme;

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ width: 260 }}>
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-2">
          <Radio size={14} style={{ color: meshStatus.running ? '#10b981' : theme.textMuted }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text }}>
            K-Forge Mesh
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{
              background: meshStatus.running ? '#10b98120' : '#ef444420',
              color: meshStatus.running ? '#10b981' : '#ef4444',
            }}>
            {meshStatus.running ? 'ACTIVE' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Status Dashboard */}
      <div className="px-3 py-2 grid grid-cols-2 gap-2"
        style={{ borderBottom: `1px solid ${theme.border}40` }}>
        <div className="text-center p-2 rounded-lg" style={{ background: theme.sidebar }}>
          <div className="text-lg font-bold" style={{ color: theme.accent }}>{peers.length}</div>
          <div className="text-[9px] uppercase" style={{ color: theme.textMuted }}>Peers</div>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ background: theme.sidebar }}>
          <div className="text-lg font-bold" style={{ color: '#10b981' }}>{meshStatus.objectsSynced}</div>
          <div className="text-[9px] uppercase" style={{ color: theme.textMuted }}>Synced</div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-3 py-2 space-y-2" style={{ borderBottom: `1px solid ${theme.border}40` }}>
        <div className="flex gap-1">
          {!meshStatus.running ? (
            <button
              onClick={startMesh}
              disabled={isStarting}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:brightness-110"
              style={{ background: '#10b98130', color: '#10b981' }}
            >
              {isStarting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              Start Mesh
            </button>
          ) : (
            <button
              onClick={stopMesh}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:brightness-110"
              style={{ background: '#ef444430', color: '#ef4444' }}
            >
              <Square size={12} />
              Stop
            </button>
          )}
          <button
            onClick={discoverPeers}
            disabled={isScanning || !meshStatus.running}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:brightness-110"
            style={{
              background: theme.accent + '20',
              color: theme.accent,
              opacity: meshStatus.running ? 1 : 0.4,
            }}
          >
            {isScanning ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
            Scan
          </button>
        </div>

        {/* Add peer manually */}
        <div className="flex gap-1">
          <input
            type="text"
            value={customPeer}
            onChange={(e) => setCustomPeer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addManualPeer()}
            placeholder="192.168.1.100"
            className="flex-1 bg-transparent text-[11px] px-2 py-1 rounded outline-none"
            style={{
              border: `1px solid ${theme.border}`,
              color: theme.text,
            }}
          />
          <button
            onClick={addManualPeer}
            className="px-2 py-1 rounded text-[11px]"
            style={{ background: theme.accent + '20', color: theme.accent }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Peers List */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {peers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Globe size={32} style={{ color: theme.textMuted, opacity: 0.3 }} />
            <p className="text-[11px] mt-2" style={{ color: theme.textMuted }}>
              No peers discovered yet.
              {!meshStatus.running && ' Start the mesh first.'}
            </p>
            <p className="text-[10px] mt-1" style={{ color: theme.textMuted, opacity: 0.6 }}>
              P2P code is undeletable. No central server.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {peers.map((peer) => (
              <div
                key={peer.address}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:brightness-110"
                style={{ background: theme.sidebar }}
              >
                <div className="relative">
                  <Server size={14} style={{ color: peer.status === 'active' ? '#10b981' : theme.textMuted }} />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
                    style={{
                      background: peer.status === 'active' ? '#10b981' :
                        peer.status === 'syncing' ? '#f59e0b' : '#6b7280',
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium truncate" style={{ color: theme.text }}>
                    {peer.hostname || peer.address}
                  </div>
                  <div className="text-[9px] truncate" style={{ color: theme.textMuted }}>
                    {peer.address} {peer.platform && `· ${peer.platform}`}
                  </div>
                </div>
                <div className="text-[9px]" style={{ color: theme.textMuted }}>
                  {peer.status === 'syncing' && <Loader2 size={10} className="animate-spin" />}
                  {peer.status === 'active' && <CheckCircle size={10} style={{ color: '#10b981' }} />}
                  {peer.status === 'offline' && <XCircle size={10} style={{ color: '#6b7280' }} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 text-[9px] flex items-center justify-between"
        style={{ borderTop: `1px solid ${theme.border}40`, color: theme.textMuted }}>
        <span>Port: {meshStatus.port}</span>
        <span className="flex items-center gap-1">
          <Shield size={9} />
          K-Forge v2.0
        </span>
      </div>
    </div>
  );
}

export default MeshPanel;
