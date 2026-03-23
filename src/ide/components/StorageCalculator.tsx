// ══════════════════════════════════════════════════════════════
// StorageCalculator — Cloud vs Sovereign Storage Cost Exposé
// Pure CSS bars — Zero Recharts. Zero cloud. Zero bullshit.
// Ported from HaveMesh → HAVEN OFFICIAL by أبو خوارزم
// ══════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface StorageProvider {
  name: string;
  nameAr: string;
  costUSD: number;
  period: string;
  color: string;
  sovereign: boolean;
  icon: string;
  details: string;
}

const PROVIDERS: StorageProvider[] = [
  {
    name: 'OneDrive 1TB',
    nameAr: 'ون درايف',
    costUSD: 2600,
    period: '10yr',
    color: '#0078D4',
    sovereign: false,
    icon: '☁️',
    details: 'Microsoft servers. Your data in Arizona/Virginia. Subject to US law.',
  },
  {
    name: 'Google One 2TB',
    nameAr: 'قوقل ون',
    costUSD: 3700,
    period: '10yr',
    color: '#EA4335',
    sovereign: false,
    icon: '🔴',
    details: 'Google servers. Zero privacy. Your files train their AI. PRISM participant.',
  },
  {
    name: 'iCloud 2TB',
    nameAr: 'آي كلاود',
    costUSD: 4500,
    period: '10yr',
    color: '#A2AAAD',
    sovereign: false,
    icon: '🍎',
    details: 'Apple servers. "Privacy" marketing. Still US jurisdiction. Still read by FISA courts.',
  },
  {
    name: 'AWS S3 1TB',
    nameAr: 'أمازون',
    costUSD: 2800,
    period: '10yr',
    color: '#FF9900',
    sovereign: false,
    icon: '📦',
    details: 'Amazon infrastructure. US CLOUD Act applies. They own the keys.',
  },
  {
    name: 'DRAGON_HDD 10TB',
    nameAr: 'القرص السيادي',
    costUSD: 200,
    period: '10yr',
    color: '#00FF00',
    sovereign: true,
    icon: '🐉',
    details: 'Your hardware. Your keys. Your kingdom. 10TB for $200 once. Zero monthly.',
  },
  {
    name: 'Bluvalt VDC 1TB',
    nameAr: 'بلوفالت',
    costUSD: 1200,
    period: '10yr',
    color: '#FFD700',
    sovereign: true,
    icon: '🇸🇦',
    details: 'Saudi data center. PDPL compliant. Data never leaves the kingdom.',
  },
];

export const StorageCalculator = () => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showSovereign, setShowSovereign] = useState(false);

  const maxCost = useMemo(() => Math.max(...PROVIDERS.map(p => p.costUSD)), []);

  const filtered = useMemo(
    () => showSovereign ? PROVIDERS.filter(p => p.sovereign) : PROVIDERS,
    [showSovereign]
  );

  const totalCloud = PROVIDERS.filter(p => !p.sovereign).reduce((s, p) => s + p.costUSD, 0);
  const totalSovereign = PROVIDERS.filter(p => p.sovereign).reduce((s, p) => s + p.costUSD, 0);
  const savings = totalCloud - totalSovereign;

  return (
    <div className="h-full flex flex-col bg-black/40">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-bold text-green-400 flex items-center gap-2">
          <span className="text-lg">💰</span>
          STORAGE COST — 10yr ANALYSIS
        </h2>
        <p className="text-[10px] text-white/40 mt-1">
          كم تدفع لوادي السيليكون؟ — How much are you paying Silicon Valley?
        </p>
      </div>

      {/* Filter toggle */}
      <div className="px-4 py-2 flex items-center gap-3">
        <button
          onClick={() => setShowSovereign(!showSovereign)}
          className={`text-[10px] px-3 py-1 rounded-full border transition-all ${
            showSovereign
              ? 'border-green-500 bg-green-500/20 text-green-400'
              : 'border-white/20 text-white/50 hover:border-white/40'
          }`}
        >
          {showSovereign ? '🇸🇦 Sovereign Only' : '📊 All Providers'}
        </button>
        <span className="text-[10px] text-yellow-400/70">
          Savings: ${savings.toLocaleString()}/10yr
        </span>
      </div>

      {/* Bars */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((provider, idx) => {
            const pct = (provider.costUSD / maxCost) * 100;
            const globalIdx = PROVIDERS.indexOf(provider);
            const isSelected = selectedIdx === globalIdx;

            return (
              <motion.div
                key={provider.name}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedIdx(isSelected ? null : globalIdx)}
                className={`cursor-pointer rounded-lg p-2 transition-all border ${
                  isSelected
                    ? 'border-white/30 bg-white/5'
                    : 'border-transparent hover:bg-white/5'
                }`}
              >
                {/* Label row */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{provider.icon}</span>
                    <span className="text-[11px] font-medium" style={{ color: provider.color }}>
                      {provider.name}
                    </span>
                    {provider.sovereign && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-bold">
                        SOVEREIGN
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] font-mono font-bold ${
                    provider.sovereign ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${provider.costUSD.toLocaleString()}
                  </span>
                </div>

                {/* Bar */}
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: provider.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.08 }}
                  />
                </div>

                {/* Details (expanded) */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[10px] text-white/50 mt-2 leading-relaxed pl-6">
                        {provider.details}
                      </p>
                      {!provider.sovereign && (
                        <p className="text-[10px] text-red-400/70 mt-1 pl-6 font-mono">
                          ⚠️ NOT SOVEREIGN — DATA LEAVES YOUR JURISDICTION
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Summary footer */}
      <div className="px-4 py-3 border-t border-white/10 space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-red-400">☁️ Cloud Total (10yr):</span>
          <span className="text-red-400 font-mono font-bold">${totalCloud.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-green-400">🐉 Sovereign Total (10yr):</span>
          <span className="text-green-400 font-mono font-bold">${totalSovereign.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-[10px] pt-1 border-t border-white/10">
          <span className="text-yellow-400 font-bold">💰 You Save:</span>
          <span className="text-yellow-400 font-mono font-bold">${savings.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
