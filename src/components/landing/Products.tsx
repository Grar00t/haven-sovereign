import React from 'react';
import { motion } from 'motion/react';
import { Ghost, Globe, Code, Zap, ShieldCheck, Database, Terminal, Network, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ScrollReveal } from '../shared/ScrollReveal';
import { GlowCard } from '../shared/GlowCard';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/translations';

interface ProductCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  tags: string[];
  color?: string;
}

const ProductCard = ({ icon: Icon, title, description, tags, color = "neon-green" }: ProductCardProps) => {
  const colorClasses: Record<string, string> = {
    "neon-green": "bg-neon-green/10 text-neon-green",
    "red-500": "bg-red-500/10 text-red-500",
    "yellow-500": "bg-yellow-500/10 text-yellow-500",
    "orange-500": "bg-orange-500/10 text-orange-500",
  };
  return (
    <GlowCard className="glass p-8 rounded-3xl flex flex-col h-full group">
      <motion.div whileHover={{ y: -4 }} className="flex flex-col h-full">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", colorClasses[color] || "bg-white/10 text-white")}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-bold mb-3 group-hover:text-neon-green transition-colors">{title}</h3>
        <p className="text-white/50 mb-6 flex-grow leading-relaxed">{description}</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: string, i: number) => (
            <span key={i} className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/5 text-white/40 border border-white/5 group-hover:border-neon-green/10 transition-colors">
              {tag}
            </span>
          ))}
        </div>
      </motion.div>
    </GlowCard>
  );
};

export const Products = () => {
  const { language } = useStore();
  const t = useTranslation(language);

  const products = [
    { icon: Ghost, title: "Haven Desktop", description: "Transparent AI overlay floating above every application on your computer. Always on top. Always listening (locally). Never uploading your screen to foreign servers.", tags: ["Electron", "Always-On-Top", "Screen Capture", "Click-Through"] },
    { icon: Globe, title: "Haven Browser", description: "The first Saudi browser with 100% local AI. Zero telemetry. No Microsoft Edge. No Google sync. Your browsing history stays on your machine, encrypted.", tags: ["Chromium", "Zero Telemetry", "Three-Lobe AI"] },
    { icon: Code, title: "Haven IDE", description: "A code editor that doesn't phone home to Microsoft. AI completion powered locally through Haven Desktop. HAVEN model routing.", tags: ["No Telemetry", "HAVEN Model", "Local AI", "Arabic Support"] },
    { icon: Zap, title: "Haven Extension", description: "The lightweight companion extension. One click to summon Haven AI on any webpage, analyze content, translate, summarize, fact-check.", tags: ["Extension", "Any Browser", "Instant AI"] },
    { icon: ShieldCheck, title: "Haven AI Core", description: "The Absolute Arsenal. A unified sovereign engine with full sensory capabilities: Voice, Vision, and Video. Built on the Three-Lobe architecture for lossless reasoning.", tags: ["Absolute Arsenal", "Sovereign Engine", "SDAIA", "PDPL"] },
    { icon: Database, title: "K-Forge", description: "The only home for the algorithm. Since GitHub deleted our history, K-Forge was born as a decentralized, delete-proof P2P repository. Your code, your sovereignty.", tags: ["P2P", "Delete-Proof", "Git Compatible", "Sovereign"] },
    { icon: Terminal, title: "Haven CLI", description: "Control the entire sovereign ecosystem from your terminal. Lightweight, fast, and 100% local. No cloud dependencies.", tags: ["CLI", "Developer Tool", "Local Control"] },
    { icon: Network, title: "The Mesh", description: "A decentralized P2P network for absolute privacy. No central server. No single point of failure. Your data, your network.", tags: ["P2P", "Privacy", "Decentralized"] },
    { icon: Search, title: "Telescope", description: "Advanced OSINT intelligence tool. Monitor, analyze, and track digital footprints with sovereign AI precision.", tags: ["OSINT", "Intelligence", "AI Tracking"] },
  ];

  return (
    <section id="products" className="py-32 px-6 max-w-7xl mx-auto">
      <ScrollReveal className="mb-16">
        <div className="text-xs font-mono text-neon-green mb-4 uppercase tracking-widest">{t.sections.ecosystem}</div>
        <h2 className="text-4xl md:text-6xl font-bold leading-none tracking-tighter">
          {t.sections.oneVision} <br />
          <span className="text-white/20">{t.sections.nineProducts}</span>
        </h2>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, i) => (
          <ScrollReveal key={i} delay={i * 0.06}>
            <ProductCard {...product} />
          </ScrollReveal>
        ))}
        <ScrollReveal delay={0.5}>
          <div className="glass p-10 rounded-[40px] flex flex-col items-center justify-center border-dashed border-white/10 h-full">
            <div className="text-xs font-mono text-white/40 mb-2 uppercase tracking-widest">Encyclopedia of Alternatives</div>
            <div className="text-sm text-center text-white/60">We are building the sovereign alternative to every Silicon Valley tool.</div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
