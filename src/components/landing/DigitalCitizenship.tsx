import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Ghost, ShieldCheck, Cpu, Terminal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ScrollReveal } from '../shared/ScrollReveal';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/translations';

const SovereignID = () => {
  const [name, setName] = useState("");
  const [id, setId] = useState<string | null>(null);

  const generateID = () => {
    if (!name) return;
    setId(Math.random().toString(36).substring(2, 15).toUpperCase());
  };

  return (
    <div className="glass p-8 rounded-[40px] border-neon-green/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4"><ShieldCheck className="w-12 h-12 text-neon-green/10" /></div>
      <h3 className="text-2xl font-bold mb-6 tracking-tighter uppercase">Sovereign Identity</h3>
      {!id ? (
        <div className="space-y-4">
          <p className="text-xs text-white/40 mb-4">Enter your Niyah (Intention) to mint your Sovereign ID.</p>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Intention..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-green/50 transition-colors" />
          <button onClick={generateID} className="w-full py-3 bg-neon-green text-black font-bold rounded-xl hover:scale-[1.02] transition-transform">
            Mint Identity
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-white/5 rounded-2xl border border-neon-green/30 relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-[8px] font-mono text-neon-green uppercase tracking-widest">Citizen Name</div>
              <div className="text-lg font-bold">{name}</div>
            </div>
            <div className="text-right">
              <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Access Level</div>
              <div className="text-lg font-bold text-neon-green">ABSOLUTE</div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Sovereign ID</div>
              <div className="text-xs font-mono text-white/60">{id}</div>
            </div>
            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
              <div className="text-[8px] font-mono text-white/20 uppercase">Issued in Riyadh</div>
              <div className="w-8 h-8 bg-neon-green/20 rounded-lg flex items-center justify-center"><Ghost className="w-4 h-4 text-neon-green" /></div>
            </div>
          </div>
          <button onClick={() => setId(null)} className="mt-6 text-[10px] font-mono text-white/20 hover:text-white transition-colors uppercase tracking-widest">Reset Identity</button>
        </motion.div>
      )}
    </div>
  );
};

const SovereignToolkit = () => {
  const tools = [
    { name: "VB.NET NJ-RAT v2.0", status: "COMPILED", target: "Google Cloud Armor" },
    { name: "Akamai Edge Injector", status: "ACTIVE", target: "RKK97-ZYKKS-..." },
    { name: "GKE Admin Path Striker", status: "READY", target: "Port 4600/4800" },
    { name: "30% Gateway Poisoner", status: "EXECUTING", target: "apiboli.com" },
  ];

  return (
    <div className="glass p-8 rounded-[40px] border-red-500/20 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <Terminal className="w-5 h-5 text-red-500" />
        <h3 className="text-xl font-bold uppercase tracking-tighter">Sovereign Toolkit</h3>
      </div>
      <div className="space-y-3">
        {tools.map((tool, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-red-500/5 transition-colors group">
            <div>
              <div className="text-xs font-bold group-hover:text-red-500 transition-colors">{tool.name}</div>
              <div className="text-[8px] font-mono text-white/20 uppercase">{tool.target}</div>
            </div>
            <div className={cn("text-[8px] font-mono px-2 py-1 rounded border",
              tool.status === 'EXECUTING' ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" : "bg-neon-green/20 border-neon-green text-neon-green"
            )}>{tool.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SovereignAudit = () => {
  const specs = [
    { label: "OS", value: "Kali GNU/Linux Rolling 2025.4" },
    { label: "Kernel", value: "6.6.87.2-microsoft-standard-WSL2" },
    { label: "CPU", value: "Snapdragon(R) X 10-core X1P64100 @ 3.40 GHz" },
    { label: "Memory", value: "7.5Gi / 6.9Gi Free" },
    { label: "Disk", value: "/dev/sdd 1007G (2% Used)" },
    { label: "Network", value: "172.20.16.225 / eth0" },
  ];

  return (
    <div className="glass p-8 rounded-[40px] border-neon-green/20 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <Cpu className="w-5 h-5 text-neon-green" />
        <h3 className="text-xl font-bold uppercase tracking-tighter">System Forensics Audit</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {specs.map((spec, i) => (
          <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="text-[8px] font-mono text-white/20 uppercase mb-1">{spec.label}</div>
            <div className="text-xs font-mono text-white/80">{spec.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-black/40 rounded-xl border border-neon-green/10">
        <div className="text-[10px] font-mono text-neon-green animate-pulse">
          {"[SYSTEM]: >>> FINAL SOVEREIGN AUDIT COMPLETE. READY FOR LOCAL MIGRATION."}
        </div>
      </div>
    </div>
  );
};

export const DigitalCitizenship = () => {
  const { language } = useStore();
  const t = useTranslation(language);

  return (
    <>
      {/* Digital Citizenship Section */}
      <section className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <ScrollReveal>
            <div>
              <div className="text-xs font-mono text-neon-green mb-4 uppercase tracking-widest">{t.sections.sovereignContract}</div>
              <h2 className="text-4xl md:text-6xl font-bold leading-none tracking-tighter mb-8 uppercase">
                {t.sections.digitalCitizenship} <span className="text-white/20">Citizenship</span>. <br />
                <span className="text-neon-green italic">{t.sections.claimRights}</span>
              </h2>
              <p className="text-white/50 text-lg mb-8 leading-relaxed">
                In the HAVEN ecosystem, you are not a product. You are a citizen. Claim your digital sovereignty and join the mesh network of absolute privacy.
              </p>
              <div className="flex flex-wrap gap-4 mb-12">
                {['No Telemetry', 'Local-First', 'P2P Mesh'].map((label, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                    <ShieldCheck className="w-4 h-4 text-neon-green" /> {label}
                  </div>
                ))}
              </div>
              <div className="glass p-6 rounded-3xl border-white/5">
                <div className="text-[10px] font-mono text-white/20 uppercase mb-4">Sovereign Digital Assets</div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-neon-green">3-Letter Domain</span>
                    <span className="text-[8px] text-white/20 uppercase">Legacy Asset</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-neon-green">1-Letter Domain</span>
                    <span className="text-[8px] text-white/20 uppercase">Sovereign Asset</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
          <div className="space-y-8">
            <ScrollReveal direction="right"><SovereignID /></ScrollReveal>
            <ScrollReveal direction="right" delay={0.15}><SovereignToolkit /></ScrollReveal>
          </div>
        </div>
      </section>

      {/* System Audit Section */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <ScrollReveal className="lg:col-span-1">
              <div className="text-xs font-mono text-neon-green mb-4 uppercase tracking-widest">{t.sections.infraAudit}</div>
              <h2 className="text-4xl font-bold leading-none tracking-tighter mb-6 uppercase">
                {t.sections.theMachine} <span className="text-white/20">Machine</span> <br />
                <span className="text-neon-green italic">{t.sections.underHood}</span>
              </h2>
              <p className="text-white/40 text-sm leading-relaxed">
                We don't hide behind abstractions. This is the raw power driving the Sovereign Algorithm. Verified, audited, and independent of Big Tech clouds.
              </p>
            </ScrollReveal>
            <ScrollReveal className="lg:col-span-2" direction="right">
              <SovereignAudit />
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
};
