import { motion } from 'motion/react';
import { ScrollReveal } from '../shared/ScrollReveal';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/translations';
import { useInView } from '../../hooks/useInView';
import { useCountUp } from '../../hooks/useCountUp';

interface Benchmark {
  label: string;
  haven: number;
  copilot: number;
  grok: number;
  gemini: number;
  unit: string;
}

const benchmarks: Benchmark[] = [
  { label: 'Context Retention', haven: 100, copilot: 34, grok: 52, gemini: 61, unit: '%' },
  { label: 'Privacy Score', haven: 100, copilot: 22, grok: 15, gemini: 18, unit: '%' },
  { label: 'Data Sovereignty', haven: 100, copilot: 0, grok: 0, gemini: 0, unit: '%' },
  { label: 'Arabic NLP Accuracy', haven: 96, copilot: 68, grok: 43, gemini: 74, unit: '%' },
  { label: 'Niyah Logic Index', haven: 100, copilot: 0, grok: 0, gemini: 0, unit: '%' },
  { label: 'Routing Transparency', haven: 100, copilot: 0, grok: 0, gemini: 0, unit: '%' },
  { label: 'Zero Token Leakage', haven: 100, copilot: 0, grok: 0, gemini: 0, unit: '%' },
];

const BarChart = ({ value, max = 100, color, delay = 0 }: { value: number; max?: number; color: string; delay?: number }) => (
  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
    <motion.div
      initial={{ width: 0 }}
      whileInView={{ width: `${(value / max) * 100}%` }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`h-full rounded-full ${color}`}
    />
  </div>
);

export const Benchmarks = () => {
  const { language } = useStore();
  const t = useTranslation(language);
  const { ref, inView } = useInView(0.2);
  const overall = useCountUp(100, 2500, inView);

  return (
    <section id="benchmarks" className="py-32 px-6 bg-white/[0.01] border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-20">
          <div className="text-xs font-mono text-neon-green mb-4 uppercase tracking-widest">// SOVEREIGN BENCHMARKS</div>
          <h2 className="text-4xl md:text-6xl font-bold leading-none tracking-tighter">
            {language === 'ar' ? 'اختبارات الأداء.' : 'Performance Benchmarks.'} <br/>
            <span className="text-white/20">{language === 'ar' ? 'الأرقام لا تكذب.' : 'Numbers Don\'t Lie.'}</span>
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Score Card */}
          <ScrollReveal>
            <div ref={ref} className="glass p-10 rounded-[40px] border-neon-green/20 text-center sticky top-32">
              <div className="text-[10px] font-mono text-neon-green uppercase tracking-widest mb-6">Overall Sovereign Score</div>
              <div className="text-8xl font-black text-neon-green mb-2 tabular-nums gradient-text">{overall}</div>
              <div className="text-sm text-white/40 mb-8">/ 100</div>
              <div className="space-y-3">
                {[
                  { label: 'HAVEN', color: 'bg-neon-green', dot: 'bg-neon-green' },
                  { label: 'Copilot', color: 'bg-blue-500', dot: 'bg-blue-500' },
                  { label: 'Grok', color: 'bg-orange-500', dot: 'bg-orange-500' },
                  { label: 'Gemini', color: 'bg-purple-500', dot: 'bg-purple-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-white/40">
                    <div className={`w-2 h-2 rounded-full ${item.dot}`} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Benchmark Bars */}
          <div className="lg:col-span-2 space-y-8">
            {benchmarks.map((b, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <div className="glass p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold">{b.label}</span>
                    <span className="text-[10px] font-mono text-neon-green">{b.haven}{b.unit}</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-white/30 w-14 text-right">HAVEN</span>
                      <BarChart value={b.haven} color="bg-neon-green" delay={i * 0.05} />
                      <span className="text-[9px] font-mono text-white/30 w-8">{b.haven}{b.unit}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-white/30 w-14 text-right">Copilot</span>
                      <BarChart value={b.copilot} color="bg-blue-500/60" delay={i * 0.05 + 0.1} />
                      <span className="text-[9px] font-mono text-white/30 w-8">{b.copilot}{b.unit}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-white/30 w-14 text-right">Grok</span>
                      <BarChart value={b.grok} color="bg-orange-500/60" delay={i * 0.05 + 0.2} />
                      <span className="text-[9px] font-mono text-white/30 w-8">{b.grok}{b.unit}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-white/30 w-14 text-right">Gemini</span>
                      <BarChart value={b.gemini} color="bg-purple-500/60" delay={i * 0.05 + 0.3} />
                      <span className="text-[9px] font-mono text-white/30 w-8">{b.gemini}{b.unit}</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <ScrollReveal>
          <div className="mt-16 text-center text-[10px] font-mono text-white/20">
            Benchmarks measured on HAVEN internal testing protocol. Context Retention = Memory persistence across sessions.
            Privacy Score = % of data processed locally. Data Sovereignty = On-device processing guarantee.
            Routing Transparency = User can inspect which model/lobe handles each query. Zero Token Leakage = No inference tokens sent to external servers.
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
