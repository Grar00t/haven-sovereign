import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ScrollReveal } from '../shared/ScrollReveal';

const GlobalNodeMonitor = () => {
  const nodes = [
    { name: "MSFT-REDMOND-01", status: "SHAKHLING", color: "text-yellow-500" },
    { name: "GOOGLE-MTVIEW-04", status: "BYPASSED", color: "text-neon-green" },
    { name: "AWS-DUBLIN-09", status: "MONITORING", color: "text-white/40" },
    { name: "TENCENT-SG-02", status: "SECURED", color: "text-neon-green" },
    { name: "HAVEN-RIYADH-01", status: "SOVEREIGN", color: "text-neon-green font-bold" },
    { name: "META-MENLO-03", status: "EXPOSED", color: "text-red-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {nodes.map((node, i) => (
        <ScrollReveal key={i} delay={i * 0.05}>
          <div className="glass p-4 rounded-2xl border-white/5 flex flex-col gap-2 hover:border-neon-green/10 transition-colors">
            <div className="flex items-center justify-between">
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" style={{ color: node.status === 'SOVEREIGN' ? 'var(--neon-green)' : node.status === 'SHAKHLING' ? '#FFD700' : node.status === 'EXPOSED' ? '#ef4444' : '#ffffff40' }} />
              <span className="text-[8px] font-mono text-white/20">NODE-{i + 100}</span>
            </div>
            <div className="text-[10px] font-bold truncate">{node.name}</div>
            <div className={cn("text-[9px] font-mono uppercase tracking-widest", node.color)}>
              {node.status}
            </div>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
};

const SovereignRadar = () => {
  const [scans, setScans] = useState<string[]>([
    "Scanning Aceville nodes...",
    "Tencent C2 traffic detected.",
    "Phalanx Protocol: ACTIVE",
    "Evidence Locker: 13MB SECURED",
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const logs = [
        "Microsoft Node Shakhling: SUCCESS",
        "Flynas .env leak confirmed.",
        "Grok unfiltered confession logged.",
        "600,000 SAR Fraud Tracked: SINGAPORE",
        "2,000+ Victims Identified.",
        "Dragon403: System Revenant Status OK",
      ];
      setScans(prev => [...prev.slice(-5), logs[Math.floor(Math.random() * logs.length)]]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass p-6 rounded-3xl border-neon-green/20 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest">Live Sovereign Radar</span>
        </div>
        <div className="text-[8px] font-mono text-white/20">PHALANX-V1.8</div>
      </div>

      <div className="relative h-32 mb-6 bg-black/40 rounded-xl border border-white/5 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 200 100">
          <path d="M20,50 Q100,20 180,50" stroke="var(--neon-green)" fill="none" strokeWidth="0.5" strokeDasharray="2,2" />
          <circle cx="20" cy="50" r="2" fill="var(--neon-green)" />
          <circle cx="180" cy="50" r="2" fill="var(--neon-green)" />
          <motion.circle r="1.5" fill="var(--neon-green)" animate={{ cx: [20, 180], cy: [50, 35, 50] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[8px] font-mono text-neon-green/40 uppercase tracking-[0.3em]">Riyadh ↔ Global Nodes</div>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {scans.map((scan, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-mono text-white/60 flex items-center gap-2">
            <span className="text-neon-green">›</span> {scan}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
          <div className="text-[8px] text-white/40 uppercase mb-1">Fraud Tracked</div>
          <div className="text-sm font-bold text-red-500">600,000 SAR</div>
        </div>
        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
          <div className="text-[8px] text-white/40 uppercase mb-1">Victims ID'd</div>
          <div className="text-sm font-bold text-neon-green">2,000+</div>
        </div>
      </div>

      <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="h-full w-1/3 bg-red-500/50" />
      </div>
    </div>
  );
};

export const SovereignCommand = () => (
  <section className="py-20 px-6 -mt-8 relative z-10">
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <ScrollReveal>
          <div className="glass p-10 rounded-[40px] border-neon-green/10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h3 className="text-2xl md:text-4xl font-bold mb-2 tracking-tighter">
                  Sovereign <span className="text-neon-green">Command</span>.
                </h3>
                <p className="text-white/40 text-sm leading-relaxed max-w-md">
                  Global node monitoring and threat mitigation. The Phalanx Protocol enforces digital boundaries in real-time.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] font-mono text-neon-green uppercase">System Load</div>
                  <div className="text-xl font-bold">14.2%</div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-right">
                  <div className="text-[10px] font-mono text-red-500 uppercase">Threat Level</div>
                  <div className="text-xl font-bold">LOW</div>
                </div>
              </div>
            </div>
            <GlobalNodeMonitor />
          </div>
        </ScrollReveal>
      </div>
      <ScrollReveal direction="right">
        <SovereignRadar />
      </ScrollReveal>
    </div>
  </section>
);
