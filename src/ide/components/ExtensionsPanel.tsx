import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Copy,
  FolderOpen,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  TerminalSquare,
} from 'lucide-react';
import { useIDEStore } from '../useIDEStore';
import { ollamaService, type ConnectionStatus } from '../engine/OllamaService';
import styles from './ExtensionsPanel.module.css';

interface CapabilityCard {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'ready' | 'warning' | 'info';
  detail: string;
  actionLabel?: string;
  action?: () => void | Promise<void>;
}

interface RuntimeSnapshot {
  connectionStatus: ConnectionStatus;
  modelNames: string[];
  persisted: boolean | null;
  storageQuotaMB: number;
  storageUsageMB: number;
  hasDirectoryPicker: boolean;
  isTauriDesktop: boolean;
}

const STATUS_STYLES: Record<CapabilityCard['status'], { color: string; icon: typeof CheckCircle2 }> = {
  ready: { color: '#22c55e', icon: CheckCircle2 },
  warning: { color: '#f59e0b', icon: AlertTriangle },
  info: { color: '#38bdf8', icon: ShieldCheck },
};

export function ExtensionsPanel() {
  const {
    currentTheme,
    sidebarWidth,
    addNotification,
    openRealFolder,
    isRealFS,
    directoryHandle,
  } = useIDEStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCard, setCopiedCard] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<RuntimeSnapshot>({
    connectionStatus: ollamaService.getStatus(),
    modelNames: ollamaService.getModels().map((model) => model.name),
    persisted: null,
    storageQuotaMB: 0,
    storageUsageMB: 0,
    hasDirectoryPicker: typeof window !== 'undefined' && 'showDirectoryPicker' in window,
    isTauriDesktop: typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window,
  });

  const refreshRuntime = useCallback(async () => {
    setRefreshing(true);
    try {
      await ollamaService.connect();
      const estimate = await navigator.storage?.estimate?.();
      const persisted = await navigator.storage?.persisted?.().catch(() => null);
      setRuntime({
        connectionStatus: ollamaService.getStatus(),
        modelNames: ollamaService.getModels().map((model) => model.name),
        persisted: persisted ?? null,
        storageQuotaMB: Number((((estimate?.quota || 0) / 1024 / 1024)).toFixed(0)),
        storageUsageMB: Number((((estimate?.usage || 0) / 1024 / 1024)).toFixed(2)),
        hasDirectoryPicker: typeof window !== 'undefined' && 'showDirectoryPicker' in window,
        isTauriDesktop: typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Runtime refresh failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setRefreshing(false);
    }
  }, [addNotification]);

  useEffect(() => {
    void refreshRuntime();
    const unsubscribe = ollamaService.on('status-change', (status: ConnectionStatus) => {
      setRuntime((prev) => ({ ...prev, connectionStatus: status }));
    });
    return unsubscribe;
  }, [refreshRuntime]);

  const copyCommand = useCallback(async (id: string, command: string) => {
    await navigator.clipboard.writeText(command);
    setCopiedCard(id);
    addNotification({ type: 'success', message: `Copied: ${command}` });
    setTimeout(() => setCopiedCard(null), 1800);
  }, [addNotification]);

  const cards = useMemo<CapabilityCard[]>(() => {
    const modelSummary = runtime.modelNames.length > 0
      ? runtime.modelNames.slice(0, 3).join(', ')
      : 'No local Ollama models detected yet';

    return [
      {
        id: 'workspace',
        name: 'Real Workspace',
        description: 'Work on disk instead of only browser state.',
        category: 'Workspace',
        status: isRealFS ? 'ready' : 'warning',
        detail: isRealFS
          ? `Connected to ${directoryHandle?.name || 'a real folder'}`
          : 'Still using the virtual workspace. Open a folder to edit actual project files.',
        actionLabel: isRealFS ? undefined : 'Open Folder',
        action: isRealFS ? undefined : () => openRealFolder(),
      },
      {
        id: 'ollama',
        name: 'Local AI Runtime',
        description: 'Uses local Ollama instead of a fake cloud copilot.',
        category: 'Runtime',
        status: runtime.connectionStatus === 'connected' ? 'ready' : 'warning',
        detail: runtime.connectionStatus === 'connected'
          ? `${runtime.modelNames.length} model(s) ready: ${modelSummary}`
          : 'Ollama is not connected right now. Local AI will stay limited until the runtime comes back.',
        actionLabel: 'Refresh Runtime',
        action: () => refreshRuntime(),
      },
      {
        id: 'storage',
        name: 'Local Persistence',
        description: 'Browser storage and offline persistence health.',
        category: 'Runtime',
        status: runtime.persisted ? 'ready' : 'info',
        detail: runtime.storageQuotaMB > 0
          ? `${runtime.storageUsageMB} / ${runtime.storageQuotaMB} MB used • persistence ${runtime.persisted ? 'enabled' : 'best-effort'}`
          : 'Storage estimate is unavailable in this shell.',
      },
      {
        id: 'toolkit',
        name: 'Built-in Tooling',
        description: 'Toolkit, Forensics, Storage Lab, and dashboard are already in HAVEN.',
        category: 'Built-in',
        status: 'ready',
        detail: 'These modules should be improved directly. They are not third-party “extensions” to install.',
      },
      {
        id: 'cli',
        name: 'Niyah CLI',
        description: 'Shared local CLI for doctor, gateway, and future ask/memory flows.',
        category: 'Built-in',
        status: 'info',
        detail: 'Use the same local core outside the GUI to verify the app from terminal level.',
        actionLabel: copiedCard === 'cli' ? 'Copied' : 'Copy Command',
        action: () => copyCommand('cli', 'npm run niyah:cli -- doctor --json'),
      },
      {
        id: 'desktop',
        name: 'Desktop Bridge',
        description: 'Tauri desktop bridge status for local-only shell features.',
        category: 'Platform',
        status: runtime.isTauriDesktop ? 'ready' : 'info',
        detail: runtime.isTauriDesktop
          ? 'Running inside the desktop shell with local bridge access.'
          : 'Running in browser/dev mode. Desktop-only bridge features are currently simulated.',
      },
      {
        id: 'filesystem-api',
        name: 'Filesystem Access API',
        description: 'Required for opening real folders directly from the browser shell.',
        category: 'Platform',
        status: runtime.hasDirectoryPicker ? 'ready' : 'warning',
        detail: runtime.hasDirectoryPicker
          ? 'Folder picker is available.'
          : 'Folder picker is unavailable in this shell, so real-disk workflows are limited.',
      },
    ];
  }, [
    copiedCard,
    copyCommand,
    directoryHandle?.name,
    isRealFS,
    openRealFolder,
    refreshRuntime,
    runtime.connectionStatus,
    runtime.hasDirectoryPicker,
    runtime.isTauriDesktop,
    runtime.modelNames,
    runtime.persisted,
    runtime.storageQuotaMB,
    runtime.storageUsageMB,
  ]);

  const categories = [...new Set(cards.map((card) => card.category))];

  const filtered = cards.filter((card) => {
    const query = search.toLowerCase();
    const matchesSearch = !search
      || card.name.toLowerCase().includes(query)
      || card.description.toLowerCase().includes(query)
      || card.detail.toLowerCase().includes(query);
    const matchesCategory = !activeCategory || card.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const readyCount = cards.filter((card) => card.status === 'ready').length;

  return (
    <div
      className={`${styles.panel} h-full overflow-y-auto overflow-x-hidden select-none flex flex-col`}
      style={{ width: sidebarWidth, backgroundColor: currentTheme.sidebar }}
      data-theme={currentTheme.name}
    >
      <div
        className={`${styles.header} px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center justify-between`}
        style={{ color: currentTheme.textMuted }}
      >
        <span>Local Capabilities</span>
        <span
          className={`${styles.count} text-xs px-1.5 py-0.5 rounded`}
          style={{ backgroundColor: currentTheme.accent + '20', color: currentTheme.accent }}
        >
          {readyCount}
        </span>
      </div>

      <div className={`${styles.searchWrap} px-3 pb-2`}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search local capabilities..."
          className={`${styles.searchInput} w-full bg-transparent border rounded px-2 py-1.5 text-xs outline-none`}
          style={{ borderColor: currentTheme.border, color: currentTheme.text }}
        />
      </div>

      <div className={`${styles.categories} px-3 pb-2 flex flex-wrap gap-1`}>
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`${styles.categoryBtn} text-[10px] px-1.5 py-0.5 rounded transition-colors`}
          style={{
            backgroundColor: !activeCategory ? currentTheme.accent + '20' : 'transparent',
            color: !activeCategory ? currentTheme.accent : currentTheme.textMuted,
          }}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(activeCategory === category ? null : category)}
            className={`${styles.categoryBtn} text-[10px] px-1.5 py-0.5 rounded transition-colors`}
            style={{
              backgroundColor: activeCategory === category ? currentTheme.accent + '20' : 'transparent',
              color: activeCategory === category ? currentTheme.accent : currentTheme.textMuted,
            }}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => void refreshRuntime()}
          className="w-full text-[10px] px-2.5 py-1.5 rounded border flex items-center justify-center gap-1.5"
          style={{ borderColor: currentTheme.border, color: currentTheme.textMuted }}
        >
          <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
          Refresh Local Runtime
        </button>
      </div>

      <div className={`${styles.list} flex-1 overflow-y-auto px-2 space-y-1`}>
        {filtered.map((card) => {
          const statusStyle = STATUS_STYLES[card.status];
          const StatusIcon = statusStyle.icon;
          const CategoryIcon = card.category === 'Workspace'
            ? FolderOpen
            : card.category === 'Runtime'
              ? Bot
              : card.category === 'Built-in'
                ? ShieldCheck
                : HardDrive;

          return (
            <div
              key={card.id}
              className={`${styles.extensionCard} p-2.5 rounded-lg transition-colors hover:bg-white/5 group`}
              style={{ border: `1px solid ${currentTheme.border}30` }}
            >
              <div className="flex items-start gap-2.5">
                <CategoryIcon size={18} style={{ color: statusStyle.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold truncate" style={{ color: currentTheme.text }}>
                      {card.name}
                    </span>
                    <span
                      className="text-[9px] px-1 rounded flex items-center gap-1"
                      style={{ backgroundColor: statusStyle.color + '15', color: statusStyle.color }}
                    >
                      <StatusIcon size={9} />
                      {card.status}
                    </span>
                  </div>
                  <div className="text-[10px] truncate" style={{ color: currentTheme.textMuted }}>
                    {card.category}
                  </div>
                  <div className="text-[10px] mt-0.5 line-clamp-2" style={{ color: currentTheme.textMuted, opacity: 0.8 }}>
                    {card.description}
                  </div>
                  <div className="mt-1.5 text-[10px] leading-relaxed" style={{ color: currentTheme.textMuted, opacity: 0.9 }}>
                    {card.detail}
                  </div>
                </div>
              </div>

              {card.action && card.actionLabel && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void card.action?.()}
                    className="text-[10px] px-2.5 py-1 rounded border flex items-center gap-1.5"
                    style={{
                      borderColor: statusStyle.color + '40',
                      color: statusStyle.color,
                      backgroundColor: statusStyle.color + '10',
                    }}
                  >
                    {card.id === 'cli'
                      ? <Copy size={10} />
                      : card.id === 'ollama'
                        ? <RefreshCw size={10} />
                        : card.id === 'workspace'
                          ? <FolderOpen size={10} />
                          : <TerminalSquare size={10} />}
                    {card.actionLabel}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
