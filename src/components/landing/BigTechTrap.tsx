import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollReveal } from '../shared/ScrollReveal';
import { useStore } from '../../store/useStore';
import {
  AlertTriangle, Server, Cloud, Lock, ShieldOff, ShieldCheck,
  ArrowRight, Globe, Eye, XCircle, CheckCircle2, Zap, Brain,
  Building2, Unlink, Link2, ChevronDown, ChevronUp,
} from 'lucide-react';

/* ─── Live Dependency Counter ─── */
const DependencyCounter = () => {
  const [count, setCount] = useState(0);
  const target = 147;
  useEffect(() => {
    const interval = setInterval(() => setCount(c => (c < target ? c + 1 : c)), 18);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="text-center">
      <div className="text-6xl md:text-8xl font-black text-red-500 tabular-nums drop-shadow-[0_0_30px_rgba(239,68,68,0.4)]">
        {count}
      </div>
      <div className="text-xs font-mono text-white/30 mt-2 uppercase tracking-widest">
        external dependencies per average SaaS app
      </div>
    </div>
  );
};

/* ─── Animated Lock-In Chain ─── */
const LockInChain = ({ isAr }: { isAr: boolean }) => {
  const steps = isAr
    ? [
        { icon: <Cloud size={20} />, label: 'خدمة سحابية "مجانية"', sub: 'البداية البريئة' },
        { icon: <Server size={20} />, label: 'ربط البيانات', sub: 'نقطة اللاعودة' },
        { icon: <Lock size={20} />, label: 'احتكار التسعير', sub: 'الفخ ينغلق' },
        { icon: <ShieldOff size={20} />, label: 'فقدان السيطرة', sub: 'بياناتك رهينة' },
      ]
    : [
        { icon: <Cloud size={20} />, label: '"Free" Cloud Tier', sub: 'The Bait' },
        { icon: <Server size={20} />, label: 'Data Lock-In', sub: 'Point of No Return' },
        { icon: <Lock size={20} />, label: 'Price Monopoly', sub: 'The Trap Closes' },
        { icon: <ShieldOff size={20} />, label: 'Loss of Control', sub: 'Data Hostage' },
      ];

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-0">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="flex flex-col items-center gap-2 px-4"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
              i === 3 ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-white/5 border-white/10 text-white/50'
            }`}>
              {step.icon}
            </div>
            <span className="text-xs font-bold text-center leading-tight">{step.label}</span>
            <span className="text-[8px] font-mono text-white/20 uppercase">{step.sub}</span>
          </motion.div>
          {i < steps.length - 1 && (
            <ArrowRight size={16} className="text-white/10 mx-1 hidden md:block flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
};

/* ─── Real Incident Cards ─── */
const incidents = [
  {
    provider: 'Google Cloud',
    icon: <Cloud size={18} />,
    color: 'border-blue-500/30 hover:border-blue-500/60',
    titleEn: 'CLI Alpha/Beta Purgatory',
    titleAr: 'جحيم أوامر Alpha/Beta',
    descEn: 'Domain mapping commands change between release tracks. Developers forced to guess which version works. Commands that worked yesterday fail today.',
    descAr: 'أوامر ربط النطاقات تتغير بين إصدارات alpha و beta. المطورين مجبرين على التخمين. أوامر عملت أمس تفشل اليوم.',
    year: '2026',
    severity: 'HIGH',
  },
  {
    provider: 'GitHub (Microsoft)',
    icon: <Server size={18} />,
    color: 'border-purple-500/30 hover:border-purple-500/60',
    titleEn: 'Repository Deletion',
    titleAr: 'حذف المستودعات',
    descEn: 'Microsoft owns your code hosting. One policy change, one flag, one automated system — and years of work vanish. No appeal. No backup plan.',
    descAr: 'مايكروسوفت تملك استضافة أكوادك. تغيير سياسة واحد، قرار واحد — وسنون من العمل تختفي. بدون استئناف. بدون خطة بديلة.',
    year: '2024–2025',
    severity: 'CRITICAL',
  },
  {
    provider: 'OpenAI / Copilot',
    icon: <Eye size={18} />,
    color: 'border-emerald-500/30 hover:border-emerald-500/60',
    titleEn: 'Context Sent to Cloud',
    titleAr: 'إرسال السياق للسحابة',
    descEn: 'Every line you type, every variable name, every API key accidentally exposed in a prompt — all processed on remote servers you don\'t own.',
    descAr: 'كل سطر تكتبه، كل اسم متغير، كل مفتاح API تعرضه بالخطأ — كلها تُعالج على سيرفرات لا تملكها.',
    year: '2023–2026',
    severity: 'HIGH',
  },
  {
    provider: 'Vercel / Netlify',
    icon: <Globe size={18} />,
    color: 'border-orange-500/30 hover:border-orange-500/60',
    titleEn: 'Build-Time Vendor Lock',
    titleAr: 'احتكار وقت البناء',
    descEn: 'Free tier gets you hooked. Production traffic? That\'ll be $20/100GB. Custom domains require their DNS. Ejecting means rebuilding everything.',
    descAr: 'الباقة المجانية تجذبك. حركة مرور الإنتاج؟ $20 لكل 100GB. النطاقات تتطلب DNS الخاص بهم. الخروج يعني إعادة بناء كل شيء.',
    year: '2024–2026',
    severity: 'MEDIUM',
  },
];

const IncidentCard: React.FC<{ incident: typeof incidents[0]; isAr: boolean }> = ({ incident, isAr }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`glass rounded-2xl border ${incident.color} p-5 cursor-pointer transition-all duration-300`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-white/30">{incident.icon}</div>
          <div>
            <div className="text-xs font-mono text-white/30">{incident.provider}</div>
            <div className="text-sm font-bold mt-0.5">{isAr ? incident.titleAr : incident.titleEn}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[8px] font-mono px-2 py-0.5 rounded border ${
            incident.severity === 'CRITICAL' ? 'bg-red-500/20 border-red-500 text-red-500' :
            incident.severity === 'HIGH' ? 'bg-orange-500/20 border-orange-500 text-orange-500' :
            'bg-yellow-500/20 border-yellow-500 text-yellow-500'
          }`}>{incident.severity}</span>
          {expanded ? <ChevronUp size={14} className="text-white/20" /> : <ChevronDown size={14} className="text-white/20" />}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-white/40 mt-3 leading-relaxed">{isAr ? incident.descAr : incident.descEn}</p>
            <div className="text-[8px] font-mono text-white/15 mt-2 uppercase">{incident.year}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── Haven vs Big Tech Side-by-Side ─── */
const HavenAlternative = ({ isAr }: { isAr: boolean }) => {
  const rows = isAr
    ? [
        { trap: 'بياناتك على سيرفراتهم', haven: 'بياناتك على جهازك', icon: <Lock size={14} /> },
        { trap: 'أوامر CLI تتغير بدون إنذار', haven: 'منطق النية — تكلم، يفهم', icon: <Brain size={14} /> },
        { trap: 'حذف حسابك = فقدان كل شيء', haven: 'ملفاتك محلية، لا أحد يحذفها', icon: <ShieldCheck size={14} /> },
        { trap: 'تسعير يرتفع بعد الإدمان', haven: 'مفتوح المصدر، مجاني للأبد', icon: <Zap size={14} /> },
        { trap: 'مشاريع مبعثرة بدون ذاكرة', haven: 'ذاكرة سياقية لا تنسى', icon: <Brain size={14} /> },
        { trap: 'الذكاء الاصطناعي يسرب أسرارك', haven: 'معالجة محلية 100%', icon: <Eye size={14} /> },
      ]
    : [
        { trap: 'Your data on their servers', haven: 'Your data on your machine', icon: <Lock size={14} /> },
        { trap: 'CLI commands change without notice', haven: 'Niyah Logic — speak, it understands', icon: <Brain size={14} /> },
        { trap: 'Account deleted = everything lost', haven: 'Local files, no one deletes them', icon: <ShieldCheck size={14} /> },
        { trap: 'Pricing rises after addiction', haven: 'Open source, free forever', icon: <Zap size={14} /> },
        { trap: 'Scattered projects, no memory', haven: 'Context memory that never forgets', icon: <Brain size={14} /> },
        { trap: 'AI leaks your secrets to cloud', haven: '100% on-device processing', icon: <Eye size={14} /> },
      ];

  return (
    <div className="glass rounded-3xl border-white/5 overflow-hidden">
      <div className="grid grid-cols-3 border-b border-white/5">
        <div className="py-4 px-6 text-xs font-mono text-white/20 uppercase" />
        <div className="py-4 px-4 text-center">
          <span className="text-xs font-bold text-red-400">{isAr ? 'فخ التبعية' : 'Big Tech Trap'}</span>
        </div>
        <div className="py-4 px-4 text-center">
          <span className="text-xs font-bold text-neon-green drop-shadow-[0_0_8px_rgba(0,255,0,0.5)]">HAVEN</span>
        </div>
      </div>
      {rows.map((row, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06 }}
          className="grid grid-cols-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
        >
          <div className="py-4 px-6 flex items-center gap-2">
            <span className="text-neon-green/50">{row.icon}</span>
          </div>
          <div className="py-4 px-4 flex items-center gap-2 text-xs text-red-400/70">
            <XCircle size={12} className="flex-shrink-0 text-red-500/50" />
            <span>{row.trap}</span>
          </div>
          <div className="py-4 px-4 flex items-center gap-2 text-xs text-neon-green/80">
            <CheckCircle2 size={12} className="flex-shrink-0 text-neon-green" />
            <span>{row.haven}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

/* ─── Sovereignty Score ─── */
const SovereigntyScore = ({ isAr }: { isAr: boolean }) => {
  const [score, setScore] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setScore(s => (s < 100 ? s + 1 : s)), 15);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass rounded-3xl border-neon-green/20 p-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 to-transparent" />
      <div className="relative z-10">
        <div className="text-[10px] font-mono text-neon-green uppercase tracking-widest mb-4">
          {isAr ? 'درجة السيادة' : 'Sovereignty Score'}
        </div>
        <div className="text-7xl font-black text-neon-green tabular-nums drop-shadow-[0_0_30px_rgba(0,255,0,0.3)]">
          {score}<span className="text-3xl text-neon-green/50">%</span>
        </div>
        <div className="mt-4 w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-neon-green/50 to-neon-green rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: '100%' }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          {(isAr
            ? [
                { label: 'معالجة محلية', value: '100%' },
                { label: 'بدون تتبع', value: 'صفر' },
                { label: 'متوافق PDPL', value: '✓' },
              ]
            : [
                { label: 'On-Device', value: '100%' },
                { label: 'Telemetry', value: 'Zero' },
                { label: 'PDPL Compliant', value: '✓' },
              ]
          ).map((item, i) => (
            <div key={i} className="p-3 bg-white/5 rounded-xl">
              <div className="text-lg font-bold text-neon-green">{item.value}</div>
              <div className="text-[8px] font-mono text-white/30 uppercase">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Economic Impact Numbers ─── */
const EconomicImpact = ({ isAr }: { isAr: boolean }) => {
  const stats = isAr
    ? [
        { num: '$500B+', label: 'خسائر الشركات من احتكار السحابة سنوياً', icon: <Building2 size={20} /> },
        { num: '73%', label: 'من الشركات عالقة بمزود واحد', icon: <Link2 size={20} /> },
        { num: '40%', label: 'زيادة أسعار بعد الاعتماد الكامل', icon: <AlertTriangle size={20} /> },
        { num: '0', label: 'بيانات تخرج من جهازك مع HAVEN', icon: <Unlink size={20} /> },
      ]
    : [
        { num: '$500B+', label: 'Annual cost of cloud vendor lock-in', icon: <Building2 size={20} /> },
        { num: '73%', label: 'Of enterprises locked to one vendor', icon: <Link2 size={20} /> },
        { num: '40%', label: 'Price increase after full dependency', icon: <AlertTriangle size={20} /> },
        { num: '0', label: 'Bytes leaving your machine with HAVEN', icon: <Unlink size={20} /> },
      ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="glass rounded-2xl border-white/5 p-6 text-center hover:border-neon-green/20 transition-colors"
        >
          <div className="text-white/20 mb-3 flex justify-center">{stat.icon}</div>
          <div className="text-2xl md:text-3xl font-black text-neon-green">{stat.num}</div>
          <div className="text-[10px] text-white/30 mt-2 leading-tight">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════
   MAIN SECTION: Big Tech Trap → Independence
   ═══════════════════════════════════════════ */
export const BigTechTrap = () => {
  const { language } = useStore();
  const isAr = language === 'ar';
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section id="independence" className="py-32 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-green/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10" ref={scrollRef}>
        {/* ── Header ── */}
        <ScrollReveal className="text-center mb-20">
          <div className="text-xs font-mono text-red-400 mb-4 uppercase tracking-widest">
            {isAr ? '// الاستقلالية الرقمية' : '// DIGITAL INDEPENDENCE'}
          </div>
          <h2 className="text-4xl md:text-7xl font-bold leading-none tracking-tighter">
            {isAr ? 'فخ' : 'The Big Tech'} <span className="text-red-500">{isAr ? 'البيغ تك' : 'Trap'}</span>
            <br />
            <span className="text-white/15">
              {isAr ? 'وكيف نحررك منه.' : 'And How We Break Free.'}
            </span>
          </h2>
          <p className="text-white/40 text-lg mt-6 max-w-2xl mx-auto">
            {isAr
              ? 'كل "خدمة مجانية" هي باب لفخ الاعتماد. كل سطر كود على سيرفراتهم هو رهينة. كل أمر CLI يتغير هو سلسلة تُشد. HAVEN يكسر هذه السلاسل.'
              : 'Every "free service" is a door to dependency. Every line of code on their servers is a hostage. Every CLI command that changes is a chain pulled tighter. HAVEN breaks these chains.'}
          </p>
        </ScrollReveal>

        {/* ── Dependency Counter ── */}
        <ScrollReveal className="mb-20">
          <div className="glass rounded-3xl border-red-500/10 p-12">
            <DependencyCounter />
          </div>
        </ScrollReveal>

        {/* ── Lock-In Chain Visualization ── */}
        <ScrollReveal className="mb-20">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold tracking-tighter">
              {isAr ? 'دورة الاحتكار' : 'The Lock-In Cycle'}
            </h3>
          </div>
          <div className="glass rounded-3xl border-white/5 p-8">
            <LockInChain isAr={isAr} />
          </div>
        </ScrollReveal>

        {/* ── Real Incident Cards ── */}
        <ScrollReveal className="mb-20">
          <div className="text-center mb-8">
            <div className="text-xs font-mono text-orange-400 mb-2 uppercase tracking-widest">
              {isAr ? '// حوادث حقيقية' : '// REAL INCIDENTS'}
            </div>
            <h3 className="text-2xl font-bold tracking-tighter">
              {isAr ? 'هذا ليس نظرية. هذا واقع.' : 'This Is Not Theory. This Is Reality.'}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents.map((incident, i) => (
              <IncidentCard key={i} incident={incident} isAr={isAr} />
            ))}
          </div>
        </ScrollReveal>

        {/* ── Economic Impact ── */}
        <ScrollReveal className="mb-20">
          <div className="text-center mb-8">
            <div className="text-xs font-mono text-white/20 mb-2 uppercase tracking-widest">
              {isAr ? '// الأثر الاقتصادي' : '// ECONOMIC IMPACT'}
            </div>
            <h3 className="text-2xl font-bold tracking-tighter">
              {isAr ? 'الحقائق بالأرقام' : 'The Numbers Don\'t Lie'}
            </h3>
          </div>
          <EconomicImpact isAr={isAr} />
        </ScrollReveal>

        {/* ── Haven vs Big Tech Table ── */}
        <ScrollReveal className="mb-20">
          <div className="text-center mb-8">
            <div className="text-xs font-mono text-neon-green mb-2 uppercase tracking-widest">
              {isAr ? '// البديل السيادي' : '// THE SOVEREIGN ALTERNATIVE'}
            </div>
            <h3 className="text-2xl font-bold tracking-tighter">
              {isAr ? 'فخ التبعية vs الاستقلالية' : 'Dependency Trap vs Independence'}
            </h3>
          </div>
          <HavenAlternative isAr={isAr} />
        </ScrollReveal>

        {/* ── Sovereignty Score ── */}
        <ScrollReveal className="mb-16">
          <div className="max-w-lg mx-auto">
            <SovereigntyScore isAr={isAr} />
          </div>
        </ScrollReveal>

        {/* ── Final CTA ── */}
        <ScrollReveal className="text-center">
          <div className="glass rounded-3xl border-neon-green/10 p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-green/5 via-transparent to-neon-green/5" />
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">
                {isAr ? 'استقلاليتك تبدأ الآن.' : 'Your Independence Starts Now.'}
              </h3>
              <p className="text-white/40 text-sm max-w-lg mx-auto mb-8">
                {isAr
                  ? 'لا مزيد من الاعتماد على خدمات تتحكم ببياناتك. HAVEN يعطيك الذكاء الاصطناعي الكامل على جهازك — مجاناً ومفتوح المصدر.'
                  : 'No more depending on services that control your data. HAVEN gives you full AI on your device — free and open source.'}
              </p>
              <button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3 bg-neon-green text-black font-bold rounded-xl hover:scale-105 transition-transform text-sm"
              >
                {isAr ? 'ابدأ مجاناً' : 'Get Started Free'} →
              </button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
