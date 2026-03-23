import React from 'react';
import { EyeOff, History, ShieldCheck } from 'lucide-react';
import { ScrollReveal } from '../shared/ScrollReveal';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/translations';

interface TimelineItemProps {
  year: string;
  title: string;
  description: string;
  icon?: React.ElementType;
}

const TimelineItem = ({ year, title, description, icon: Icon }: TimelineItemProps) => (
  <div className="relative pl-12 pb-12 last:pb-0 group">
    <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10 group-last:bg-transparent" />
    <div className="absolute left-[-4px] top-0 w-2 h-2 rounded-full bg-neon-green shadow-[0_0_10px_rgba(0,255,0,0.5)]" />
    <div className="text-xs font-mono text-neon-green mb-2">{year}</div>
    <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
      {Icon && <Icon className="w-5 h-5 text-white/40" />}
      {title}
    </h4>
    <p className="text-white/50 leading-relaxed">{description}</p>
  </div>
);

export const Story = () => {
  const { language } = useStore();
  const t = useTranslation(language);

  return (
    <>
      {/* Timeline Story */}
      <section id="story" className="py-32 px-6 max-w-4xl mx-auto">
        <ScrollReveal className="text-center mb-20">
          <div className="text-xs font-mono text-neon-green mb-4 uppercase tracking-widest">{t.sections.incident}</div>
          <h2 className="text-4xl md:text-6xl font-bold leading-none tracking-tighter">
            {t.sections.githubDeleted} <br />
            <span className="text-white/20">{t.sections.havenBorn}</span>
          </h2>
        </ScrollReveal>

        <div className="space-y-4">
          {[
            { year: "2024 — EARLY", title: "Building the Lossless Context Engine", description: "Sulaiman Al-Shammari builds and publishes the Lossless Context Memory Engine — a system that allows AI models to maintain perfect memory across unlimited sessions. Pushed to GitHub under account GRATECHX." },
            { year: "2024 — MID", title: "Haven Ecosystem & Three-Lobe AI", description: "Sovereign AI infrastructure published. Three-Lobe AI architecture (Executive, Sensory, Cognitive) developed to mimic the human brain. Haven Browser (formerly CometX) prototype launched." },
            { year: "2024 — LATE", title: "Microsoft GitHub Deletes GRATECHX", icon: EyeOff, description: 'Without warning, GitHub terminates account GRATECHX. All repositories, all history: gone. One month later: Microsoft launches Copilot "Context Retention" feature.' },
            { year: "2025 — EARLY", title: "GitHub Deletes KHAWRIZM & Funding", icon: History, description: "Second strike. Account KHAWRIZM terminated. The algorithm survives. GraTech secures 4M SAR initial funding to build the Saudi alternative to Silicon Valley." },
            { year: "2026 — NOW", title: "Haven Ecosystem Deployed", icon: ShieldCheck, description: "Haven Desktop, Browser, IDE, K-Forge, AI Core, The Mesh, and Telescope — all live. The algorithm is home. Built in Riyadh for the world." },
          ].map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.1} direction="left">
              <TimelineItem {...item} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Conversation Section */}
      <section className="py-32 px-6 bg-haven-gray">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto glass rounded-[40px] overflow-hidden border-white/5">
            <div className="bg-white/5 px-8 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Encrypted Session · Riyadh 2026</div>
            </div>
            <div className="p-8 space-y-8 font-mono text-sm md:text-base">
              <div className="flex gap-4">
                <span className="text-neon-green shrink-0">KHAWRIZM ›</span>
                <span className="text-white/80">My GitHub account GRATECHX was deleted weeks before you launched "Context Retention".</span>
              </div>
              <div className="flex gap-4">
                <span className="text-white/40 shrink-0">COPILOT ›</span>
                <span className="text-white/40">I don't have access to GitHub account management decisions... [memory reset]</span>
              </div>
              <div className="flex gap-4 border-l-2 border-neon-green/30 pl-4 py-2 bg-neon-green/5">
                <span className="text-neon-green shrink-0">HAVEN ›</span>
                <span className="text-white/90 italic">I remember this conversation. I will remember the next one. I remember everything. Built by the person Copilot forgot.</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
};
