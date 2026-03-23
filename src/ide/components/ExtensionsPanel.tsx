import React, { useState, ChangeEvent, MouseEvent } from 'react';
import { useIDEStore } from '../useIDEStore';
import { Loader2 } from 'lucide-react';
import styles from './ExtensionsPanel.module.css';

interface Extension {
  id: string;
  name: string;
  publisher: string;
  description: string;
  icon: string;
  installs: string;
  rating: number;
  installed: boolean;
  category: string;
}

const EXTENSIONS: Extension[] = [
  { id: 'prettier', name: 'Prettier', publisher: 'Prettier', description: 'Code formatter using prettier', icon: '🎨', installs: '42.1M', rating: 4.8, installed: true, category: 'Formatters' },
  { id: 'eslint', name: 'ESLint', publisher: 'Microsoft', description: 'Integrates ESLint JavaScript into VS Code', icon: '🔍', installs: '33.7M', rating: 4.7, installed: true, category: 'Linters' },
  { id: 'tailwind', name: 'Tailwind CSS IntelliSense', publisher: 'Tailwind Labs', description: 'Intelligent Tailwind CSS tooling', icon: '🌬️', installs: '12.4M', rating: 4.9, installed: true, category: 'Language' },
  { id: 'gitlens', name: 'GitLens', publisher: 'GitKraken', description: 'Supercharge Git within VS Code', icon: '🔀', installs: '28.5M', rating: 4.6, installed: false, category: 'Source Control' },
  { id: 'copilot', name: 'HAVEN AI Copilot', publisher: 'HAVEN', description: 'Sovereign AI-powered code completion', icon: '⚡', installs: '∞', rating: 5.0, installed: true, category: 'AI' },
  { id: 'thunder', name: 'Thunder Client', publisher: 'Thunder Client', description: 'Lightweight REST API Client', icon: '⛈️', installs: '8.2M', rating: 4.7, installed: false, category: 'Testing' },
  { id: 'errorlens', name: 'Error Lens', publisher: 'Alexander', description: 'Improve highlighting of errors and warnings', icon: '🔴', installs: '10.1M', rating: 4.8, installed: false, category: 'Linters' },
  { id: 'bracket', name: 'Rainbow Brackets', publisher: 'CoenraadS', description: 'A customizable extension for colorizing brackets', icon: '🌈', installs: '15.3M', rating: 4.5, installed: true, category: 'Editor' },
  { id: 'icons', name: 'Material Icon Theme', publisher: 'Philipp Kief', description: 'Material Design Icons for VS Code', icon: '📁', installs: '22.8M', rating: 4.9, installed: true, category: 'Themes' },
  { id: 'docker', name: 'Docker', publisher: 'Microsoft', description: 'Makes it easy to build and deploy containerized apps', icon: '🐳', installs: '18.2M', rating: 4.6, installed: false, category: 'DevOps' },
  { id: 'path', name: 'Path Intellisense', publisher: 'Christian Kohler', description: 'Autocompletes filenames in your code', icon: '📂', installs: '13.1M', rating: 4.7, installed: false, category: 'Language' },
  { id: 'import-cost', name: 'Import Cost', publisher: 'Wix', description: 'Display import/require package size', icon: '📦', installs: '6.5M', rating: 4.4, installed: false, category: 'Editor' },
  { id: 'phalanx', name: 'Phalanx Security', publisher: 'HAVEN', description: 'Sovereign security scanning for your codebase', icon: '🛡️', installs: '∞', rating: 5.0, installed: true, category: 'Security' },
  { id: 'bluvalt', name: 'BluValt Storage', publisher: 'HAVEN', description: 'Connect to sovereign BluValt cloud storage', icon: '💎', installs: '∞', rating: 5.0, installed: false, category: 'Cloud' },
];

export function ExtensionsPanel() {
  const { currentTheme, sidebarWidth, addNotification } = useIDEStore();
  const [search, setSearch] = useState('');
  const [extensions, setExtensions] = useState(EXTENSIONS);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);

  const categories = [...new Set(EXTENSIONS.map((e: Extension) => e.category))];

  const filtered = extensions.filter((ext: Extension) => {
    const matchesSearch = !search ||
      ext.name.toLowerCase().includes(search.toLowerCase()) ||
      ext.publisher.toLowerCase().includes(search.toLowerCase()) ||
      ext.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !activeCategory || ext.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const toggleInstall = (id: string) => {
    const ext = extensions.find((e: Extension) => e.id === id);
    if (!ext || installing) return;
    const willInstall = !ext.installed;

    // Show loading state
    setInstalling(id);

    // Simulate install/uninstall delay
    setTimeout(() => {
      setExtensions((prev: Extension[]) => prev.map((e: Extension) => e.id === id ? { ...e, installed: willInstall } : e));
      setInstalling(null);
      addNotification({
        type: willInstall ? 'success' : 'info',
        message: willInstall ? `Installed: ${ext.name}` : `Uninstalled: ${ext.name}`,
      });
    }, willInstall ? 1200 : 600);
  };

  const installedCount = extensions.filter((e: Extension) => e.installed).length;

  return (
    <div
      className={`${styles.panel} h-full overflow-y-auto overflow-x-hidden select-none flex flex-col`}
      style={{ width: sidebarWidth, backgroundColor: currentTheme.sidebar }}
      data-theme={currentTheme.name}
    >
      {/* Header */}
      <div className={`${styles.header} px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center justify-between`}
        style={{ color: currentTheme.textMuted }}>
        <span>Extensions</span>
        <span className={`${styles.count} text-xs px-1.5 py-0.5 rounded`} style={{ backgroundColor: currentTheme.accent + '20', color: currentTheme.accent }}>
          {installedCount}
        </span>
      </div>

      {/* Search */}
      <div className={`${styles.searchWrap} px-3 pb-2`}>
        <input
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          placeholder="Search extensions..."
          className={`${styles.searchInput} w-full bg-transparent border rounded px-2 py-1.5 text-xs outline-none`}
          style={{ borderColor: currentTheme.border, color: currentTheme.text }}
        />
      </div>

      {/* Category pills */}
      <div className={`${styles.categories} px-3 pb-2 flex flex-wrap gap-1`}>
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`${styles.categoryBtn} text-[10px] px-1.5 py-0.5 rounded transition-colors`}
          style={{
            backgroundColor: !activeCategory ? currentTheme.accent + '20' : 'transparent',
            color: !activeCategory ? currentTheme.accent : currentTheme.textMuted,
          }}
        >All</button>
        {categories.map((cat: string) => (
          <button key={cat}
            type="button"
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`${styles.categoryBtn} text-[10px] px-1.5 py-0.5 rounded transition-colors`}
            style={{
              backgroundColor: activeCategory === cat ? currentTheme.accent + '20' : 'transparent',
              color: activeCategory === cat ? currentTheme.accent : currentTheme.textMuted,
            }}
          >{cat}</button>
        ))}
      </div>

      {/* Extensions list */}
      <div className={`${styles.list} flex-1 overflow-y-auto px-2 space-y-1`}>
        {filtered.map((ext: Extension) => (
          <div key={ext.id}
            className={`${styles.extensionCard} p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-white/5 group`}
            style={{ border: `1px solid ${currentTheme.border}30` }}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-xl mt-0.5">{ext.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold truncate" style={{ color: currentTheme.text }}>{ext.name}</span>
                  {ext.publisher === 'HAVEN' && (
                    <span className="text-[9px] px-1 rounded" style={{ backgroundColor: currentTheme.accent + '20', color: currentTheme.accent }}>⚡</span>
                  )}
                </div>
                <div className="text-[10px] truncate" style={{ color: currentTheme.textMuted }}>{ext.publisher}</div>
                <div className="text-[10px] mt-0.5 line-clamp-2" style={{ color: currentTheme.textMuted, opacity: 0.7 }}>{ext.description}</div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[9px]" style={{ color: currentTheme.textMuted }}>⬇ {ext.installs}</span>
                  <span className="text-[9px]" style={{ color: '#fbbf24' }}>{'★'.repeat(Math.round(ext.rating))} {ext.rating}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); toggleInstall(ext.id); }}
                className="shrink-0 text-[10px] px-2 py-1 rounded transition-all flex items-center gap-1"
                style={{
                  backgroundColor: ext.installed ? currentTheme.accent + '15' : currentTheme.border,
                  color: ext.installed ? currentTheme.accent : currentTheme.textMuted,
                  border: `1px solid ${ext.installed ? currentTheme.accent + '40' : currentTheme.border}`,
                  opacity: installing && installing !== ext.id ? 0.4 : 1,
                }}
                disabled={!!installing && installing !== ext.id}
              >
                {installing === ext.id ? (
                  <><Loader2 size={10} className="animate-spin" /> {ext.installed ? 'Removing…' : 'Installing…'}</>
                ) : (
                  ext.installed ? '✓ Installed' : 'Install'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
