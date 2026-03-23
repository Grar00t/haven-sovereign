import { motion } from 'motion/react';
import { ScrollReveal } from '../shared/ScrollReveal';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/translations';
import { Check, X, Minus, Shield, Brain, Eye, Lock, Zap } from 'lucide-react';

interface Feature {
  name: string;
  nameAr: string;
  icon: import('react').ReactNode;
  haven: 'yes' | 'no' | 'partial';
  copilot: 'yes' | 'no' | 'partial';
  grok: 'yes' | 'no' | 'partial';
  gemini: 'yes' | 'no' | 'partial';
}

const features: Feature[] = [
  { name: 'On-Device Processing', nameAr: 'معالجة محلية', icon: <Shield size={14} />, haven: 'yes', copilot: 'no', grok: 'no', gemini: 'no' },
  { name: 'Data Sovereignty', nameAr: 'سيادة البيانات', icon: <Lock size={14} />, haven: 'yes', copilot: 'no', grok: 'no', gemini: 'no' },
  { name: 'Arabic-First NLP', nameAr: 'معالجة عربية أولاً', icon: <Brain size={14} />, haven: 'yes', copilot: 'partial', grok: 'no', gemini: 'partial' },
  { name: 'Niyah (Intent) Logic', nameAr: 'منطق النية', icon: <Eye size={14} />, haven: 'yes', copilot: 'no', grok: 'no', gemini: 'no' },
  { name: 'Three-Lobe Architecture', nameAr: 'بنية ثلاثية الفصوص', icon: <Brain size={14} />, haven: 'yes', copilot: 'no', grok: 'no', gemini: 'no' },
  { name: 'No Telemetry', nameAr: 'بدون تتبع', icon: <Shield size={14} />, haven: 'yes', copilot: 'no', grok: 'no', gemini: 'no' },
  { name: 'Infinite Context', nameAr: 'سياق لا نهائي', icon: <Zap size={14} />, haven: 'yes', copilot: 'partial', grok: 'partial', gemini: 'partial' },
  { name: 'Sovereign Command', nameAr: 'الأمر السيادي', icon: <Lock size={14} />, haven: 'yes', copilot: 'no', grok: 'no', gemini: 'no' },
  { name: 'Digital Citizenship', nameAr: 'المواطنة الرقمية', icon: <Shield size={14} />, haven: 'yes', copilot: 'no', grok: 'no', gemini: 'no' },
  { name: 'Open Source', nameAr: 'مفتوح المصدر', icon: <Zap size={14} />, haven: 'yes', copilot: 'no', grok: 'no', gemini: 'partial' },
];

const StatusIcon = ({ status }: { status: 'yes' | 'no' | 'partial' }) => {
  if (status === 'yes') return <Check size={16} className="text-neon-green" />;
  if (status === 'partial') return <Minus size={16} className="text-yellow-400" />;
  return <X size={16} className="text-red-400/60" />;
};

const StatusCell = ({ status, delay }: { status: 'yes' | 'no' | 'partial'; delay: number }) => (
  <motion.td
    initial={{ opacity: 0, scale: 0.5 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.3, delay }}
    className="py-4 text-center"
  >
    <div className="flex items-center justify-center">
      <StatusIcon status={status} />
    </div>
  </motion.td>
);

export const Comparison = () => {
  const { language } = useStore();
  const t = useTranslation(language);

  const providers = [
    { key: 'haven', name: 'HAVEN', color: 'text-neon-green', glow: true },
    { key: 'copilot', name: 'Copilot', color: 'text-blue-400', glow: false },
    { key: 'grok', name: 'Grok', color: 'text-orange-400', glow: false },
    { key: 'gemini', name: 'Gemini', color: 'text-purple-400', glow: false },
  ];

  return (
    <section id="comparison" className="py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal className="text-center mb-20">
          <div className="text-xs font-mono text-neon-green mb-4 uppercase tracking-widest">// SIDE-BY-SIDE</div>
          <h2 className="text-4xl md:text-6xl font-bold leading-none tracking-tighter">
            {language === 'ar' ? 'لماذا HAVEN؟' : 'Why HAVEN?'} <br/>
            <span className="text-white/20">{language === 'ar' ? 'المقارنة تتحدث.' : 'The Comparison Speaks.'}</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal>
          <div className="glass rounded-3xl border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="py-5 px-6 text-left text-xs font-mono text-white/30 uppercase tracking-wider">Feature</th>
                    {providers.map(p => (
                      <th key={p.key} className="py-5 px-4 text-center">
                        <span className={`text-sm font-bold ${p.color} ${p.glow ? 'drop-shadow-[0_0_8px_rgba(0,255,0,0.5)]' : ''}`}>
                          {p.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((f, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <span className="text-neon-green/60">{f.icon}</span>
                          <span className="text-sm font-medium">{language === 'ar' ? f.nameAr : f.name}</span>
                        </div>
                      </td>
                      <StatusCell status={f.haven} delay={i * 0.04 + 0.1} />
                      <StatusCell status={f.copilot} delay={i * 0.04 + 0.15} />
                      <StatusCell status={f.grok} delay={i * 0.04 + 0.2} />
                      <StatusCell status={f.gemini} delay={i * 0.04 + 0.25} />
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Summary Row */}
            <div className="grid grid-cols-4 gap-px bg-white/5 border-t border-white/5">
              {providers.map(p => {
                const score = features.filter(f => f[p.key as keyof Feature] === 'yes').length;
                return (
                  <div key={p.key} className="py-5 text-center bg-black/40">
                    <div className={`text-2xl font-black ${p.color}`}>{score}/{features.length}</div>
                    <div className="text-[10px] text-white/30 mt-1">{p.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="mt-12 text-center">
            <p className="text-white/30 text-xs font-mono">
              {language === 'ar'
                ? 'المقارنة مبنية على الوثائق المتاحة اعتباراً من 2026.'
                : 'Comparison based on publicly available documentation as of 2026.'
              }
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
