// ══════════════════════════════════════════════════════════════
// ToolsPanel — Sovereign Arsenal Tab Container
// Houses: Mesh, Radar, Forensics, Hacking, Storage, Intel
// Zero cloud. Full sovereignty. Maximum drip.
// ══════════════════════════════════════════════════════════════

import React, { useState, lazy, Suspense, type ReactNode } from 'react';
import { useIDEStore } from '../useIDEStore';
import { motion, AnimatePresence } from 'motion/react';
import {
  Network, Radar, Fingerprint, Zap, DollarSign, Shield,
} from 'lucide-react';

// Lazy-load heavy panels for snappy switching
const SovereignMesh = lazy(() =>
  import('./SovereignMesh').then(m => ({ default: m.SovereignMesh }))
);
const NodeRadar = lazy(() =>
  import('./NodeRadar').then(m => ({ default: m.NodeRadar }))
);
const ForensicLab = lazy(() =>
  import('./ForensicLab').then(m => ({ default: m.ForensicLab }))
);
const HackingToolkit = lazy(() =>
  import('./HackingToolkit').then(m => ({ default: m.HackingToolkit }))
);
const StorageCalculator = lazy(() =>
  import('./StorageCalculator').then(m => ({ default: m.StorageCalculator }))
);
const SovereignIntelligence = lazy(() =>
  import('./SovereignIntelligence').then(m => ({ default: m.SovereignIntelligence }))
);

interface ToolTab {
  id: string;
  label: string;
  labelAr: string;
  icon: ReactNode;
  color: string;
}

const TABS: ToolTab[] = [
  { id: 'mesh',    label: 'Mesh',      labelAr: 'الشبكة', icon: <Network className="w-3.5 h-3.5" />,     color: '#00FF00' },
  { id: 'radar',   label: 'Radar',     labelAr: 'الرادار', icon: <Radar className="w-3.5 h-3.5" />,       color: '#00FF00' },
  { id: 'forensic',label: 'Forensics', labelAr: 'الأدلة',  icon: <Fingerprint className="w-3.5 h-3.5" />, color: '#FFD700' },
  { id: 'hack',    label: 'Toolkit',   labelAr: 'الترسانة', icon: <Zap className="w-3.5 h-3.5" />,         color: '#FF0040' },
  { id: 'storage', label: 'Storage',   labelAr: 'التخزين', icon: <DollarSign className="w-3.5 h-3.5" />,  color: '#00BFFF' },
  { id: 'intel',   label: 'Intel',     labelAr: 'استخبارات', icon: <Shield className="w-3.5 h-3.5" />,      color: '#FF6B00' },
];

const PANEL_MAP: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  mesh: SovereignMesh,
  radar: NodeRadar,
  forensic: ForensicLab,
  hack: HackingToolkit,
  storage: StorageCalculator,
  intel: SovereignIntelligence,
};

const LoadingFallback = () => (
  <div className="h-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-2">
      <div className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      <span className="text-[10px] text-white/30 font-mono">LOADING MODULE...</span>
    </div>
  </div>
);

export const ToolsPanel = () => {
  const { currentTheme, sidebarWidth } = useIDEStore();
  const [activeTab, setActiveTab] = useState('mesh');
  const [showProjectGen, setShowProjectGen] = useState(false);

  const ActivePanel = PANEL_MAP[activeTab];

  return (
    <div
      className="flex flex-col h-full overflow-hidden select-none"
      style={{
        width: Math.max(sidebarWidth, 280),
        backgroundColor: currentTheme.sidebar,
        borderRight: `1px solid ${currentTheme.border}`,
      }}
    >
      {/* Panel title + Project Generator */}
      <div
        className="px-4 py-2 text-[11px] font-bold tracking-wider flex items-center gap-2 shrink-0"
        style={{ color: currentTheme.accent, borderBottom: `1px solid ${currentTheme.border}` }}
      >
        <Shield className="w-4 h-4" />
        SOVEREIGN ARSENAL
        <span className="text-[8px] ml-auto font-mono opacity-50">v1.0</span>
        <button
          className="ml-2 px-2 py-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 text-[9px] font-bold"
          title="مولد المشاريع الذكي"
          onClick={() => setShowProjectGen(v => !v)}
        >🚀 مولد المشاريع</button>
      </div>

      {/* Project Generator Modal */}
      {showProjectGen && (
        <div className="absolute top-16 left-0 w-full z-50 bg-black/80 border-b border-green-500/30 p-4 flex flex-col gap-2">
          <div className="text-[12px] font-bold text-green-400 mb-2">مولد المشاريع الذكي</div>
          <form
            onSubmit={e => { e.preventDefault(); setShowProjectGen(false); }}
            className="flex flex-col gap-2"
          >
            <input className="px-2 py-1 rounded bg-white/10 text-white text-[11px] border border-green-500/20" placeholder="اسم المشروع (مثال: مشروع علمي، تطبيق ويب، CLI...)" />
            <select className="px-2 py-1 rounded bg-white/10 text-white text-[11px] border border-green-500/20">
              <option>لغة البرمجة</option>
              <option>TypeScript</option>
              <option>Python</option>
              <option>Rust</option>
              <option>Node.js</option>
              <option>React</option>
              <option>Vue</option>
              <option>Go</option>
              <option>HTML/CSS/JS</option>
            </select>
            <button type="submit" className="px-2 py-1 rounded bg-green-500/20 text-green-400 font-bold text-[10px]">إنشاء المشروع</button>
          </form>
          <button className="mt-2 text-[10px] text-red-400 hover:underline" onClick={() => setShowProjectGen(false)}>إغلاق</button>
        </div>
      )}

      {/* Tab bar */}
      <div
        className="flex items-center overflow-x-auto px-1 py-1 gap-0.5 shrink-0"
        style={{ borderBottom: `1px solid ${currentTheme.border}` }}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-[9px] font-medium
                         transition-all whitespace-nowrap shrink-0 ${
                isActive ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
              style={{
                color: isActive ? tab.color : '#666',
                borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
              }}
              title={`${tab.label} — ${tab.labelAr}`}
            >
              {tab.icon}
              <span className="hidden xl:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            <Suspense fallback={<LoadingFallback />}>
              {ActivePanel && <ActivePanel />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
