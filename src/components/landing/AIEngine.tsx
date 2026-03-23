import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, ShieldCheck, X, Youtube, Brain, Zap, Eye, MemoryStick, Activity, ArrowRight, Lock, Server } from 'lucide-react';
import { ScrollReveal } from '../shared/ScrollReveal';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/translations';

// ── Three-Lobe Brain Visualization ───────────────────────────

const LOBES = [
  { id: 'executive', label: 'Executive', labelAr: 'التنفيذي', icon: Zap, color: '#00FF00', angle: 270, desc: 'Orchestrates multi-step reasoning. Routes tasks across lobes, manages execution flow and decision trees.', descAr: 'يُنسّق التفكير المتعدد الخطوات. يوزّع المهام بين الفصوص ويُدير سير التنفيذ.' },
  { id: 'sensory', label: 'Sensory', labelAr: 'الحسي', icon: Eye, color: '#00BFFF', angle: 150, desc: 'Processes multimodal input — code, text, voice. Converts raw input into structured intent signals.', descAr: 'يعالج المدخلات المتعددة — كود، نصوص، صوت. يحوّل المدخلات الخام إلى إشارات نية مهيكلة.' },
  { id: 'cognitive', label: 'Cognitive', labelAr: 'الإدراكي', icon: MemoryStick, color: '#a855f7', angle: 30, desc: 'Maintains session context and user alignment. Houses the Niyah vector engine for intent-aware responses.', descAr: 'يحافظ على سياق الجلسة وتوافق المستخدم. يحتضن محرك النية للاستجابات الواعية بالقصد.' },
] as const;

const BrainVisualization = ({ activeLobe, onLobeHover }: { activeLobe: string | null; onLobeHover: (id: string | null) => void }) => {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPulse(p => (p + 1) % 360), 50);
    return () => clearInterval(id);
  }, []);

  const cx = 160, cy = 160, r = 95;

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-[320px] mx-auto">
      <defs>
        <radialGradient id="core-glow">
          <stop offset="0%" stopColor="#00FF00" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00FF00" stopOpacity="0" />
        </radialGradient>
        {LOBES.map(l => (
          <radialGradient key={l.id} id={`${l.id}-glow`}>
            <stop offset="0%" stopColor={l.color} stopOpacity={activeLobe === l.id ? 0.6 : 0.2} />
            <stop offset="100%" stopColor={l.color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {/* Neural grid */}
      {Array.from({ length: 6 }).map((_, i) => (
        <circle key={i} cx={cx} cy={cy} r={40 + i * 20} fill="none" stroke="rgba(0,255,0,0.04)" strokeWidth="0.5" />
      ))}

      {/* Rotating scan line */}
      <line
        x1={cx} y1={cy}
        x2={cx + Math.cos((pulse * Math.PI) / 180) * 140}
        y2={cy + Math.sin((pulse * Math.PI) / 180) * 140}
        stroke="rgba(0,255,0,0.08)" strokeWidth="1"
      />

      {/* Core */}
      <circle cx={cx} cy={cy} r="50" fill="url(#core-glow)" />
      <circle cx={cx} cy={cy} r="18" fill="none" stroke="#00FF00" strokeWidth="1.5" opacity="0.6" />
      <circle cx={cx} cy={cy} r="5" fill="#00FF00" opacity="0.8" />

      {/* Connection lines to lobes */}
      {LOBES.map(l => {
        const rad = (l.angle * Math.PI) / 180;
        const lx = cx + Math.cos(rad) * r;
        const ly = cy + Math.sin(rad) * r;
        const isActive = activeLobe === l.id;
        return (
          <g key={l.id}>
            <line x1={cx} y1={cy} x2={lx} y2={ly}
              stroke={l.color} strokeWidth={isActive ? 2 : 0.8}
              opacity={isActive ? 0.8 : 0.2} strokeDasharray={isActive ? 'none' : '4 4'} />

            <circle r="3" fill={l.color} opacity={0.8}>
              <animateMotion dur="2s" repeatCount="indefinite" path={`M${cx},${cy} L${lx},${ly}`} />
            </circle>

            <circle cx={lx} cy={ly} r="40" fill={`url(#${l.id}-glow)`} />
            <circle cx={lx} cy={ly} r={isActive ? 22 : 18}
              fill="rgba(0,0,0,0.6)" stroke={l.color}
              strokeWidth={isActive ? 2 : 1} opacity={isActive ? 1 : 0.6}
              className="cursor-pointer transition-all duration-300"
              onMouseEnter={() => onLobeHover(l.id)}
              onMouseLeave={() => onLobeHover(null)} />

            <text x={lx} y={ly + (l.angle === 270 ? -30 : 36)}
              textAnchor="middle" fill={l.color}
              fontSize="9" fontFamily="monospace" fontWeight="bold"
              opacity={isActive ? 1 : 0.5}>
              {l.label.toUpperCase()}
            </text>
          </g>
        );
      })}

      <text x={cx} y={cy + 3} textAnchor="middle" fill="#00FF00" fontSize="8" fontFamily="monospace" fontWeight="bold">NIYAH</text>
    </svg>
  );
};

// ── Live Processing Terminal ─────────────────────────────────

const PROCESS_LINES_EN = [
  { text: '$ niyah analyze --input "Build a REST API"', color: '#00FF00' },
  { text: '  ↳ Tokenizing intent vector...', color: '#666' },
  { text: '  ↳ Arabic root extraction: ب-ن-ي (build)', color: '#a855f7' },
  { text: '  ↳ Domain: CODE | Tone: DIRECT | Confidence: 0.94', color: '#00BFFF' },
  { text: '  ↳ Executive Lobe → planning task sequence', color: '#00FF00' },
  { text: '  ↳ Cognitive Lobe → loading session context', color: '#a855f7' },
  { text: '  ↳ Routing to: Meta-Llama-3.3-70B via Ollama', color: '#00BFFF' },
  { text: '  ✓ Response generated — context preserved', color: '#00FF00' },
];

const PROCESS_LINES_AR = [
  { text: '$ niyah analyze --input "ابني لي API"', color: '#00FF00' },
  { text: '  ← تحليل متجه النية...', color: '#666' },
  { text: '  ← استخراج الجذور: ب-ن-ي (بناء)', color: '#a855f7' },
  { text: '  ← المجال: كود | النبرة: مباشر | الثقة: 0.94', color: '#00BFFF' },
  { text: '  ← الفص التنفيذي → تخطيط تسلسل المهام', color: '#00FF00' },
  { text: '  ← الفص الإدراكي → تحميل سياق الجلسة', color: '#a855f7' },
  { text: '  ← التوجيه إلى: Meta-Llama-3.3-70B عبر Ollama', color: '#00BFFF' },
  { text: '  ✓ تم توليد الرد — السياق محفوظ', color: '#00FF00' },
];

const ProcessingTerminal = ({ isAr }: { isAr: boolean }) => {
  const [visibleLines, setVisibleLines] = useState(0);
  const lines = isAr ? PROCESS_LINES_AR : PROCESS_LINES_EN;

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines(prev => {
        if (prev >= lines.length) {
          setTimeout(() => setVisibleLines(0), 1500);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [lines.length]);

  return (
    <div className="bg-black/80 rounded-2xl border border-white/10 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[9px] font-mono text-white/30 ml-2">niyah-engine v5.0</span>
        <div className="ml-auto flex items-center gap-1">
          <Activity className="w-3 h-3 text-neon-green animate-pulse" />
          <span className="text-[8px] font-mono text-neon-green">LIVE</span>
        </div>
      </div>
      <div className="p-4 font-mono text-[11px] leading-relaxed min-h-[200px]" dir="ltr">
        {lines.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={`${i}-${visibleLines > lines.length ? 'r' : ''}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{ color: line.color }}
          >
            {line.text}
          </motion.div>
        ))}
        {visibleLines < lines.length && (
          <span className="text-neon-green animate-pulse">▊</span>
        )}
      </div>
    </div>
  );
};

// ── Animated Metric ──────────────────────────────────────────

const AnimatedMetric: React.FC<{ label: string; value: number; suffix: string; color: string; delay: number }> = ({ label, value, suffix, color, delay }) => {
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);

  const startAnimation = useCallback(() => {
    if (started) return;
    setStarted(true);
    let frame = 0;
    const total = 40;
    const step = () => {
      frame++;
      setCurrent(Math.min(Math.round((frame / total) * value), value));
      if (frame < total) requestAnimationFrame(step);
    };
    setTimeout(step, delay * 1000);
  }, [started, value, delay]);

  return (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      viewport={{ once: true }}
      onViewportEnter={startAnimation}
      className="relative"
    >
      <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-mono font-bold" style={{ color }}>{current}{suffix}</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color, width: `${current}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </motion.div>
  );
};

// ── Model Cards — actual models we use ───────────────────────

const MODELS = [
  { name: 'Meta-Llama 3.3', param: '70B', type: 'Primary', typeAr: 'الأساسي', desc: 'General reasoning, code generation, Arabic support', descAr: 'استدلال عام، توليد كود، دعم عربي', tags: ['Reasoning', 'Code', 'Arabic'], color: '#00FF00' },
  { name: 'Qwen3', param: '32B', type: 'Specialist', typeAr: 'المتخصص', desc: 'Fast code completion and logical tasks', descAr: 'إكمال كود سريع ومهام منطقية', tags: ['Fast', 'Code', 'Logic'], color: '#00BFFF' },
  { name: 'DeepSeek-R1', param: '70B', type: 'Deep Reasoning', typeAr: 'التفكير العميق', desc: 'Complex multi-step problem solving', descAr: 'حل مشكلات معقدة متعددة الخطوات', tags: ['Chain-of-Thought', 'Math', 'Analysis'], color: '#a855f7' },
];

// ── Architecture Facts ───────────────────────────────────────

const ARCH_FACTS = [
  { icon: Server, label: 'Inference', labelAr: 'الاستدلال', value: 'Ollama / SambaNova', desc: 'Local-first via Ollama. Cloud fallback via SambaNova when needed.', descAr: 'محلي أولاً عبر Ollama. احتياطي سحابي عبر SambaNova عند الحاجة.', color: '#00FF00' },
  { icon: Lock, label: 'Privacy', labelAr: 'الخصوصية', value: 'Zero Telemetry', desc: 'No tracking, no analytics, no data collection. Period.', descAr: 'بدون تتبع، بدون تحليلات، بدون جمع بيانات. نقطة.', color: '#FFD700' },
  { icon: Brain, label: 'Intent Engine', labelAr: 'محرك النية', value: 'Niyah v5', desc: 'Three-lobe processing: intent vectors, Arabic root analysis, context memory.', descAr: 'معالجة ثلاثية الفصوص: متجهات النية، تحليل الجذور العربية، ذاكرة السياق.', color: '#a855f7' },
  { icon: Cpu, label: 'Models', labelAr: 'النماذج', value: '15+ Open Source', desc: 'We don\'t train models. We integrate the best open-source ones and add the Niyah layer.', descAr: 'لا ندّعي تدريب نماذج. ندمج أفضل النماذج مفتوحة المصدر ونضيف طبقة النية.', color: '#00BFFF' },
];

// ══════════════════════════════════════════════════════════════
//  AI ENGINE — MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

export const AIEngine = () => {
  const { language } = useStore();
  const t = useTranslation(language);
  const isAr = language === 'ar';
  const [activeLobe, setActiveLobe] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(0);

  // Auto-cycle lobes when not hovered
  useEffect(() => {
    if (activeLobe) return;
    let i = 0;
    const id = setInterval(() => {
      setActiveLobe(LOBES[i % LOBES.length].id);
      setTimeout(() => setActiveLobe(null), 2000);
      i++;
    }, 3000);
    return () => clearInterval(id);
  }, [activeLobe]);

  const activeLobeData = LOBES.find(l => l.id === activeLobe);

  return (
    <>
      {/* ═══════════ SECTION 1: THE AI ENGINE ═══════════ */}
      <section id="models" className="py-32 px-6 bg-white/[0.02] border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-green/5 blur-[200px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <ScrollReveal className="text-center mb-20">
            <div className="text-xs font-mono text-neon-green mb-4 uppercase tracking-widest">{t.sections.sovereignEngine}</div>
            <h2 className="text-4xl md:text-7xl font-black leading-none tracking-tighter mb-6">
              {isAr ? 'محرك' : 'The'} <span className="text-neon-green italic">{isAr ? 'الذكاء' : 'AI'}</span> <br />
              <span className="text-white/20">{isAr ? 'كيف يعمل فعلاً.' : 'How It Actually Works.'}</span>
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? 'نحن لا ندّعي أننا بنينا نموذج لغوي. نحن بنينا طبقة ذكاء فوق أفضل النماذج مفتوحة المصدر — منطق النية، ذاكرة السياق، واستدلال محلي بدون تتبع.'
                : 'We didn\'t build a language model. We built an intelligence layer on top of the best open-source models — intent logic, context memory, and local inference with zero telemetry.'}
            </p>
          </ScrollReveal>

          {/* Architecture Facts Grid */}
          <ScrollReveal delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
              {ARCH_FACTS.map((fact, i) => (
                <motion.div
                  key={fact.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="glass p-5 rounded-2xl border-white/5 hover:border-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${fact.color}10`, border: `1px solid ${fact.color}20` }}>
                      <fact.icon className="w-4 h-4" style={{ color: fact.color }} />
                    </div>
                    <div className="text-[10px] font-mono text-white/30 uppercase">{isAr ? fact.labelAr : fact.label}</div>
                  </div>
                  <div className="text-sm font-bold mb-1" style={{ color: fact.color }}>{fact.value}</div>
                  <div className="text-[11px] text-white/40 leading-relaxed">{isAr ? fact.descAr : fact.desc}</div>
                </motion.div>
              ))}
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left: Brain Visualization + Lobe Info */}
            <div>
              <ScrollReveal>
                <div className="glass rounded-[32px] border-neon-green/10 p-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                  <div className="text-center mb-4">
                    <div className="text-[10px] font-mono text-neon-green/60 uppercase tracking-[0.3em]">
                      {isAr ? 'معمارية ثلاثية الفصوص — ابتكار HAVEN' : 'THREE-LOBE ARCHITECTURE — HAVEN\'S ORIGINAL DESIGN'}
                    </div>
                  </div>

                  <BrainVisualization activeLobe={activeLobe} onLobeHover={setActiveLobe} />

                  {/* Active lobe info panel */}
                  <AnimatePresence mode="wait">
                    {activeLobeData && (
                      <motion.div
                        key={activeLobeData.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 p-4 rounded-xl border"
                        style={{
                          borderColor: `${activeLobeData.color}30`,
                          backgroundColor: `${activeLobeData.color}08`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <activeLobeData.icon className="w-4 h-4" style={{ color: activeLobeData.color }} />
                          <span className="text-sm font-bold" style={{ color: activeLobeData.color }}>
                            {isAr ? activeLobeData.labelAr : activeLobeData.label}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed">
                          {isAr ? activeLobeData.descAr : activeLobeData.desc}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!activeLobeData && (
                    <div className="mt-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center">
                      <p className="text-[10px] font-mono text-white/20">
                        {isAr ? 'حرّك المؤشر على فص لرؤية التفاصيل' : 'HOVER A LOBE TO INSPECT'}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollReveal>

              {/* What we actually built vs what we use */}
              <ScrollReveal delay={0.2}>
                <div className="mt-6 glass rounded-2xl border-white/5 p-6">
                  <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-neon-green" />
                    {isAr ? 'الصراحة أولاً — ماذا بنينا فعلاً' : 'HONESTY FIRST — WHAT WE ACTUALLY BUILT'}
                  </div>
                  <div className="space-y-3">
                    {(isAr ? [
                      { built: true, text: 'محرك النية (Niyah Engine) — معمارية معالجة فريدة من تصميمنا' },
                      { built: true, text: 'بيئة تطوير متكاملة (IDE) — محرر، ترمنال، Git، مدير ملفات' },
                      { built: true, text: 'بنية الخصوصية — صفر تتبع، صفر تحليلات، بياناتك ما تطلع' },
                      { built: true, text: 'تكامل ذكي مع 15+ نموذج مفتوح المصدر عبر Ollama' },
                      { built: false, text: 'لم ندرّب نموذج لغوي خاص — النماذج مفتوحة المصدر (وهذا شيء نفتخر فيه)' },
                      { built: false, text: 'لسنا شركة بمليارات — نحن فريق صغير يبني بذكاء' },
                    ] : [
                      { built: true, text: 'Niyah Engine — original three-lobe processing architecture' },
                      { built: true, text: 'Full IDE — editor, terminal, Git integration, file system' },
                      { built: true, text: 'Privacy-first architecture — zero telemetry, zero analytics' },
                      { built: true, text: 'Smart integration with 15+ open-source models via Ollama' },
                      { built: false, text: 'We didn\'t train a custom LLM — we use open-source models (and we\'re proud of that)' },
                      { built: false, text: 'We\'re not a billion-dollar company — we\'re a small team building smart' },
                    ]).map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-start gap-2.5 text-[11px]"
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          item.built ? 'bg-neon-green/10' : 'bg-white/5'
                        }`}>
                          {item.built
                            ? <ShieldCheck className="w-3 h-3 text-neon-green" />
                            : <span className="text-[8px] text-white/30">✦</span>}
                        </div>
                        <span className={item.built ? 'text-white/60' : 'text-white/30 italic'}>{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right: Model Cards + Terminal */}
            <div>
              {/* Model Selector */}
              <ScrollReveal direction="right">
                <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-neon-green" />
                  {isAr ? 'النماذج المدمجة — مفتوحة المصدر' : 'INTEGRATED MODELS — OPEN SOURCE'}
                </div>
                <div className="space-y-3 mb-6">
                  {MODELS.map((model, i) => (
                    <motion.div
                      key={model.name}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedModel(i)}
                      className={`glass p-5 rounded-2xl cursor-pointer transition-all duration-300 border ${
                        selectedModel === i
                          ? 'border-opacity-40 shadow-lg'
                          : 'border-white/5 hover:border-white/10'
                      }`}
                      style={{
                        borderColor: selectedModel === i ? model.color : undefined,
                        boxShadow: selectedModel === i ? `0 0 30px ${model.color}15` : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${model.color}15`, border: `1px solid ${model.color}30` }}>
                            <Cpu className="w-5 h-5" style={{ color: model.color }} />
                          </div>
                          <div>
                            <div className="text-sm font-bold">{model.name}</div>
                            <div className="text-[10px] text-white/30">{isAr ? model.descAr : model.desc}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black font-mono" style={{ color: model.color }}>{model.param}</div>
                          <div className="text-[9px] text-white/30 uppercase">{isAr ? model.typeAr : model.type}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {model.tags.map(tag => (
                          <span key={tag} className="text-[8px] font-mono uppercase px-2 py-0.5 rounded-full border"
                            style={{
                              color: `${model.color}99`,
                              borderColor: `${model.color}20`,
                              backgroundColor: `${model.color}08`,
                            }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollReveal>

              {/* Live Processing Terminal */}
              <ScrollReveal delay={0.15} direction="right">
                <ProcessingTerminal isAr={isAr} />
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 2: NIYAH LOGIC ═══════════ */}
      <section id="niyah" className="py-32 px-6 border-b border-white/5 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/5 blur-[200px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal className="text-center mb-20">
            <div className="text-xs font-mono text-neon-green mb-4 uppercase tracking-widest">{t.sections.newScience}</div>
            <h2 className="text-4xl md:text-7xl font-black leading-none tracking-tighter mb-6">
              {t.sections.niyahLogic} <span className="text-white/20">LOGIC</span>. <br />
              <span className="text-white/20 italic">{t.sections.beyondPrompt}</span>
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? <>الأوامر ميكانيكية. النية واعية. هذه ليست كلمات تسويقية — هذا فرق بنيوي في كيف يتفاعل النظام مع المستخدم.</>
                : <>Prompts are mechanical. Intent is aware. This isn't marketing — it's a structural difference in how the system interacts with the user.</>}
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Old Way */}
            <ScrollReveal direction="left">
              <div className="glass p-10 rounded-[32px] border-white/5 relative group h-full">
                <motion.div
                  className="absolute inset-0 bg-red-500/5 rounded-[32px] pointer-events-none"
                  animate={{ opacity: [0, 0.03, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <div className="absolute -top-3 left-6 bg-white/10 text-white/40 text-[9px] font-mono px-3 py-1 rounded-full uppercase tracking-widest">
                  {isAr ? 'الطريقة السائدة' : 'The Standard Approach'}
                </div>
                <div className="text-2xl font-bold mb-8 text-white/20 mt-2">Prompt Engineering</div>
                <ul className="space-y-5">
                  {(isAr
                    ? ['المستخدم يصيغ الأمر يدوياً كل مرة', 'النموذج ينسى السياق بين الجلسات', 'لا يوجد فهم للنية — فقط مطابقة نصية', 'الاستجابة عامة بغض النظر عن المستخدم', 'لا يتعلم من أنماط الاستخدام']
                    : ['User manually crafts every prompt', 'Model forgets context between sessions', 'No intent understanding — just text matching', 'Generic responses regardless of user', 'Doesn\'t learn from usage patterns']
                  ).map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-3 text-sm text-white/20"
                    >
                      <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                        <X className="w-3 h-3 text-red-500/60" />
                      </div>
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

            {/* The Niyah Approach */}
            <ScrollReveal direction="right">
              <div className="glass p-10 rounded-[32px] border-neon-green/20 relative overflow-hidden h-full">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.03, 0.08, 0.03] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute inset-0 bg-neon-green pointer-events-none rounded-[32px]"
                />
                <div className="absolute -top-3 right-6 bg-neon-green text-black text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  {isAr ? 'نهج HAVEN' : 'The HAVEN Approach'}
                </div>
                <div className="text-2xl font-bold mb-8 text-neon-green mt-2">
                  {isAr ? 'منطق النية (L.O.I)' : 'NIYAH LOGIC (L.O.I)'}
                </div>
                <ul className="space-y-5">
                  {(isAr
                    ? ['يحلل نيتك من السياق — مش بس كلماتك', 'يحفظ ذاكرة الجلسة كاملة بدون فقدان', 'يستخرج الجذور اللغوية العربية لفهم أعمق', 'يتكيف مع أسلوبك وأنماط عملك', 'يوجّه الاستجابة عبر ثلاث فصوص متخصصة']
                    : ['Analyzes your intent from context — not just words', 'Maintains full session memory without loss', 'Extracts Arabic linguistic roots for deeper understanding', 'Adapts to your style and workflow patterns', 'Routes responses through three specialized lobes']
                  ).map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-3 text-sm text-white/80"
                    >
                      <div className="w-6 h-6 rounded-full bg-neon-green/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-3 h-3 text-neon-green" />
                      </div>
                      {item}
                    </motion.li>
                  ))}
                </ul>
                <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
                  <div>
                    <div className="text-[9px] font-mono text-neon-green uppercase tracking-widest mb-2">
                      {isAr ? 'ملاحظة المعماري:' : "Architect's Note:"}
                    </div>
                    <div className="text-xs text-white/40 italic leading-relaxed">
                      {isAr
                        ? '"بنينا منطق النية لأن الأوامر النصية لا تكفي. الخوارزمية تحتاج تفهم ليش تكتب، مش بس وش تكتب."'
                        : '"We built Niyah Logic because text prompts aren\'t enough. The algorithm needs to understand why you\'re writing, not just what you\'re writing."'}
                    </div>
                  </div>
                  <a href="https://www.youtube.com/watch?v=bMIIC9FYpJM" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[10px] font-mono text-neon-green hover:text-neon-green/80 transition-colors group">
                    <Youtube className="w-3.5 h-3.5" />
                    {isAr ? 'شاهد النية في العمل' : 'Watch Niyah in Action'}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
};
