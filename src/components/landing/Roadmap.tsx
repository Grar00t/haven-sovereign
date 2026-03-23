import { type FC } from 'react';
import { motion } from 'motion/react';
import { ScrollReveal } from '../shared/ScrollReveal';
import { useStore } from '../../store/useStore';
import { Rocket, Shield, Code, Globe, Brain, Flag, Zap, Star } from 'lucide-react';

interface Milestone {
  date: string;
  dateAr: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: typeof Rocket;
  color: string;
  status: 'completed' | 'current' | 'upcoming';
}

const milestones: Milestone[] = [
  {
    date: 'Q1 2025',
    dateAr: 'الربع الأول 2025',
    title: 'Genesis',
    titleAr: 'البداية',
    description: 'HAVEN concept born after GitHub deleted our repositories. The algorithm comes home.',
    descriptionAr: 'ولادة فكرة HAVEN بعد حذف GitHub لمستودعاتنا. الخوارزمية تعود للوطن.',
    icon: Flag,
    color: '#e06c75',
    status: 'completed',
  },
  {
    date: 'Q2 2025',
    dateAr: 'الربع الثاني 2025',
    title: 'Three-Lobe Architecture',
    titleAr: 'البنية الثلاثية',
    description: 'Designed and built the cognitive engine with Executive, Sensory, and Cognitive lobes.',
    descriptionAr: 'تصميم وبناء المحرك الإدراكي بثلاثة فصوص: التنفيذي، الحسي، والإدراكي.',
    icon: Brain,
    color: '#61afef',
    status: 'completed',
  },
  {
    date: 'Q3 2025',
    dateAr: 'الربع الثالث 2025',
    title: 'Haven Desktop Alpha',
    titleAr: 'Haven Desktop ألفا',
    description: 'First working prototype — transparent overlay AI living on your desktop.',
    descriptionAr: 'أول نموذج عامل — ذكاء اصطناعي شفاف يعيش على سطح مكتبك.',
    icon: Code,
    color: '#98c379',
    status: 'completed',
  },
  {
    date: 'Q4 2025',
    dateAr: 'الربع الرابع 2025',
    title: 'Haven Browser + IDE',
    titleAr: 'متصفح وبيئة تطوير HAVEN',
    description: 'Launch of the sovereign browser and IDE with zero telemetry. K-Forge goes live.',
    descriptionAr: 'إطلاق المتصفح وبيئة التطوير السيادية بدون تتبع. K-Forge يبدأ العمل.',
    icon: Globe,
    color: '#e5c07b',
    status: 'completed',
  },
  {
    date: 'Q1 2026',
    dateAr: 'الربع الأول 2026',
    title: 'Niyah Logic v2',
    titleAr: 'منطق النية v2',
    description: 'Advanced intent comprehension engine. Arabic-first NLP with contextual understanding.',
    descriptionAr: 'محرك فهم النية المتقدم. معالجة لغة عربية أولاً مع فهم سياقي.',
    icon: Zap,
    color: '#c678dd',
    status: 'current',
  },
  {
    date: 'Q2 2026',
    dateAr: 'الربع الثاني 2026',
    title: 'Sovereign Mesh Network',
    titleAr: 'شبكة سيادية لامركزية',
    description: 'Full P2P mesh deployment across Saudi Arabia. Air-gapped sovereign infrastructure.',
    descriptionAr: 'نشر شبكة P2P الكاملة عبر المملكة العربية السعودية. بنية تحتية سيادية معزولة.',
    icon: Shield,
    color: '#56b6c2',
    status: 'upcoming',
  },
  {
    date: 'Q4 2026',
    dateAr: 'الربع الرابع 2026',
    title: 'HAVEN 6.0 — The Absolute Arsenal',
    titleAr: 'HAVEN 6.0 — الترسانة المطلقة',
    description: 'Vision, Voice, Video — the full sensory sovereign AI. Ready for enterprise deployment.',
    descriptionAr: 'رؤية، صوت، فيديو — الذكاء الاصطناعي السيادي الحسي الكامل. جاهز للمؤسسات.',
    icon: Star,
    color: '#00ff41',
    status: 'upcoming',
  },
];

const StatusDot: FC<{ status: 'completed' | 'current' | 'upcoming'; color: string }> = ({ status, color }) => {
  const isCurrent = status === 'current';
  return (
    <div className="relative w-5 h-5 flex items-center justify-center">
      <div
        className="w-4 h-4 rounded-full z-10 relative transition-all duration-300"
        style={{
          backgroundColor: status === 'completed' ? color : 'transparent',
          border: status === 'upcoming' ? `2px dashed ${color}60` : `2px solid ${color}`,
          boxShadow: isCurrent || status === 'completed' ? `0 0 12px ${color}40` : 'none',
        }}
      />
      {isCurrent && (
        <motion.div
          animate={{ scale: [1, 1.6, 1], opacity: [0.35, 0.08, 0.35] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${color}` }}
        />
      )}
    </div>
  );
};

export const Roadmap: FC = () => {
  const { language } = useStore();

  return (
    <section id="roadmap" className="py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal className="text-center mb-20">
          <div className="text-xs font-mono text-neon-green mb-4 uppercase tracking-widest">// ROADMAP</div>
          <h2 className="text-4xl md:text-6xl font-bold leading-none tracking-tighter">
            {language === 'ar' ? 'خارطة الطريق.' : 'The Roadmap.'} <br />
            <span className="text-white/20">{language === 'ar' ? 'من الحلم إلى السيادة.' : 'From Dream to Sovereignty.'}</span>
          </h2>
        </ScrollReveal>

        <div role="list" className="relative">
          {/* Vertical line — fades at bottom */}
          <div className="absolute left-[18px] md:left-1/2 md:-translate-x-px top-8 bottom-12 w-[2px] bg-gradient-to-b from-neon-green/30 via-white/10 to-transparent pointer-events-none" />

          {milestones.map((m, i) => {
            const Icon = m.icon;
            const isRight = i % 2 === 0;
            return (
              <ScrollReveal key={i} delay={i * 0.08}>
                <article role="listitem" className={`relative flex items-start gap-6 mb-14 md:mb-20 last:mb-0 ${isRight ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Content */}
                  <div className={`flex-1 ml-12 md:ml-0 ${isRight ? 'md:text-right md:pr-14' : 'md:text-left md:pl-14'}`}>
                    <time className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2 block">
                      {language === 'ar' ? m.dateAr : m.date}
                    </time>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${m.color}12`, border: `1px solid ${m.color}30` }}>
                        <Icon size={18} style={{ color: m.color }} />
                      </div>
                      <h3 className="text-xl font-bold tracking-tight">{language === 'ar' ? m.titleAr : m.title}</h3>
                      {m.status === 'current' && (
                        <span className="ml-1 text-[9px] font-mono px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider font-medium">
                          {language === 'ar' ? 'الآن' : 'Now'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed">{language === 'ar' ? m.descriptionAr : m.description}</p>
                  </div>

                  {/* Dot — better vertical centering */}
                  <div className="absolute left-[8px] md:left-1/2 md:-translate-x-1/2 top-2 md:top-3">
                    <StatusDot status={m.status} color={m.color} />
                  </div>

                  {/* Spacer for the other side on desktop */}
                  <div className="hidden md:block flex-1" />
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
