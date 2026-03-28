import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Database, Download, FolderOpen, HardDrive, RefreshCw, Shield, Trash2,
} from 'lucide-react';
import { useIDEStore } from '../useIDEStore';

interface StorageSnapshot {
  usageMB: number;
  quotaMB: number;
  usagePct: number;
  persisted: boolean | null;
  localStorageKeys: number;
  localStorageKB: number;
  sessionStorageKeys: number;
  sessionStorageKB: number;
  cacheCount: number;
  cacheNames: string[];
  indexedDbCount: number;
  indexedDbNames: string[];
  serviceWorkers: number;
}

async function collectStorageSnapshot(): Promise<StorageSnapshot> {
  const estimate = await navigator.storage?.estimate?.();
  const persisted = await navigator.storage?.persisted?.().catch(() => null);
  const cacheNames = await caches?.keys?.().catch(() => []) ?? [];
  const serviceWorkers = await navigator.serviceWorker?.getRegistrations?.()
    .then((registrations) => registrations.length)
    .catch(() => 0) ?? 0;
  const indexedDbNames = 'databases' in indexedDB
    ? await (indexedDB as IDBFactory & { databases?: () => Promise<Array<{ name?: string }>> }).databases?.()
      .then((databases) => (databases || []).map((database) => database.name || 'unnamed'))
      .catch(() => [])
    : [];

  const localStorageKeys = Object.keys(localStorage);
  const sessionStorageKeys = Object.keys(sessionStorage);
  const localStorageBytes = localStorageKeys.reduce((total, key) => total + new Blob([localStorage.getItem(key) || '']).size, 0);
  const sessionStorageBytes = sessionStorageKeys.reduce((total, key) => total + new Blob([sessionStorage.getItem(key) || '']).size, 0);
  const usageMB = Number((((estimate?.usage || 0) / 1024 / 1024)).toFixed(2));
  const quotaMB = Number((((estimate?.quota || 0) / 1024 / 1024)).toFixed(0));
  const usagePct = quotaMB > 0 ? Math.round((usageMB / quotaMB) * 100) : 0;

  return {
    usageMB,
    quotaMB,
    usagePct,
    persisted: persisted ?? null,
    localStorageKeys: localStorageKeys.length,
    localStorageKB: Number((localStorageBytes / 1024).toFixed(2)),
    sessionStorageKeys: sessionStorageKeys.length,
    sessionStorageKB: Number((sessionStorageBytes / 1024).toFixed(2)),
    cacheCount: cacheNames.length,
    cacheNames,
    indexedDbCount: indexedDbNames.length,
    indexedDbNames,
    serviceWorkers,
  };
}

export const StorageCalculator = () => {
  const {
    openRealFolder, isRealFS, directoryHandle, addNotification,
  } = useIDEStore();
  const [snapshot, setSnapshot] = useState<StorageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await collectStorageSnapshot();
      setSnapshot(next);
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Storage inspection failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const clearCaches = useCallback(async () => {
    setClearing(true);
    try {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      addNotification({
        type: 'success',
        message: `Cleared ${names.length} cache storages`,
      });
      await refresh();
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Cache cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setClearing(false);
    }
  }, [addNotification, refresh]);

  const exportSnapshot = useCallback(() => {
    if (!snapshot) return;
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `haven-local-storage-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [snapshot]);

  const recommendations = useMemo(() => {
    if (!snapshot) return [];
    const tips: string[] = [];
    if (snapshot.usagePct >= 80) tips.push('Storage pressure is high. Clear caches or reduce large offline artifacts.');
    if (snapshot.cacheCount > 0) tips.push(`You have ${snapshot.cacheCount} cache namespaces. Clear stale caches after major UI changes.`);
    if (!snapshot.persisted) tips.push('Persistent storage is not guaranteed. Export important data or keep a real folder open.');
    if (!isRealFS) tips.push('A real folder is not connected yet. Open one to work against disk, not only browser state.');
    if (tips.length === 0) tips.push('Local storage posture looks healthy and practical.');
    return tips;
  }, [isRealFS, snapshot]);

  return (
    <div className="h-full flex flex-col bg-black/40">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-bold text-green-400 flex items-center gap-2">
          <HardDrive className="w-4 h-4" />
          LOCAL STORAGE LAB
        </h2>
        <p className="text-[10px] text-white/40 mt-1">
          Practical local storage, cache, and persistence diagnostics for HAVEN.
        </p>
      </div>

      <div className="px-4 py-2 flex items-center gap-2 border-b border-white/10">
        <button
          onClick={() => void refresh()}
          disabled={loading}
          className="text-[10px] px-3 py-1 rounded border border-white/15 text-white/70 hover:border-white/30 flex items-center gap-1.5 disabled:opacity-40"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <button
          onClick={exportSnapshot}
          disabled={!snapshot}
          className="text-[10px] px-3 py-1 rounded border border-cyan-500/20 text-cyan-400/80 hover:border-cyan-500/40 flex items-center gap-1.5 disabled:opacity-40"
        >
          <Download className="w-3 h-3" />
          Export
        </button>
        <button
          onClick={() => void clearCaches()}
          disabled={clearing}
          className="text-[10px] px-3 py-1 rounded border border-yellow-500/20 text-yellow-400/80 hover:border-yellow-500/40 flex items-center gap-1.5 disabled:opacity-40"
        >
          <Trash2 className={`w-3 h-3 ${clearing ? 'animate-spin' : ''}`} />
          Clear Cache
        </button>
        {!isRealFS && (
          <button
            onClick={() => void openRealFolder()}
            className="ml-auto text-[10px] px-3 py-1 rounded border border-green-500/20 text-green-400/90 hover:border-green-500/40 flex items-center gap-1.5"
          >
            <FolderOpen className="w-3 h-3" />
            Open Folder
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-[9px] uppercase text-white/35">Usage</div>
            <div className="mt-1 text-lg font-mono font-bold text-white">
              {snapshot ? `${snapshot.usageMB} / ${snapshot.quotaMB} MB` : '...'}
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${snapshot?.usagePct || 0}%`,
                  backgroundColor: snapshot && snapshot.usagePct >= 80 ? '#f59e0b' : '#22c55e',
                }}
              />
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-[9px] uppercase text-white/35">Persistence</div>
            <div className="mt-1 text-lg font-mono font-bold" style={{ color: snapshot?.persisted ? '#22c55e' : '#f59e0b' }}>
              {snapshot?.persisted === true ? 'PERSISTED' : snapshot?.persisted === false ? 'BEST-EFFORT' : '...'}
            </div>
            <div className="mt-2 text-[10px] text-white/45">
              {isRealFS ? `Working on disk: ${directoryHandle?.name || 'connected'}` : 'Browser-only until a folder is opened'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 text-[10px] uppercase text-white/35">
              <Database className="w-3 h-3" />
              IndexedDB
            </div>
            <div className="mt-2 text-lg font-mono font-bold text-white">{snapshot?.indexedDbCount ?? '...'}</div>
            <div className="mt-2 text-[10px] text-white/45 break-all">
              {snapshot?.indexedDbNames.length ? snapshot.indexedDbNames.join(', ') : 'No databases detected'}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 text-[10px] uppercase text-white/35">
              <Shield className="w-3 h-3" />
              Runtime State
            </div>
            <div className="mt-2 text-[11px] text-white/70 font-mono">
              Cache namespaces: {snapshot?.cacheCount ?? '...'}
            </div>
            <div className="mt-1 text-[11px] text-white/70 font-mono">
              Service workers: {snapshot?.serviceWorkers ?? '...'}
            </div>
            <div className="mt-1 text-[11px] text-white/70 font-mono">
              localStorage: {snapshot ? `${snapshot.localStorageKeys} keys / ${snapshot.localStorageKB} KB` : '...'}
            </div>
            <div className="mt-1 text-[11px] text-white/70 font-mono">
              sessionStorage: {snapshot ? `${snapshot.sessionStorageKeys} keys / ${snapshot.sessionStorageKB} KB` : '...'}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] uppercase text-white/35 mb-2">Cache Namespaces</div>
          {snapshot?.cacheNames.length ? (
            <div className="space-y-1">
              {snapshot.cacheNames.map((name) => (
                <div key={name} className="rounded border border-white/5 bg-black/20 px-2 py-1 text-[10px] font-mono text-cyan-300/80 break-all">
                  {name}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-white/45">No Cache Storage entries detected.</div>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] uppercase text-white/35 mb-2">Recommendations</div>
          <div className="space-y-1.5">
            {recommendations.map((tip) => (
              <div key={tip} className="rounded border border-green-500/15 bg-green-500/5 px-2 py-1.5 text-[11px] text-green-300/80">
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
