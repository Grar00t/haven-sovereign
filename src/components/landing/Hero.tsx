import { motion } from 'motion/react';
import { Download, ChevronRight, ArrowDown } from 'lucide-react';
import { NeuralNetwork } from './Decorations';
import { ScrollReveal } from '../shared/ScrollReveal';
import { AnimatedText } from '../shared/AnimatedText';
import { GlowCard } from '../shared/GlowCard';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/translations';
import { useInView } from '../../hooks/useInView';
import { useCountUp } from '../../hooks/useCountUp';
import { useTypewriter } from '../../hooks/useTypewriter';
import { useParallax } from '../../hooks/useParallax';

export const Hero = () => {
  const { language } = useStore();
  const t = useTranslation(language);
  const { ref: statsRef, inView: statsVisible } = useInView(0.3);
  const parallaxOffset = useParallax(0.15);

  const modelsCount = useCountUp(15, 2000, statsVisible);
  const contextCount = useCountUp(100, 2000, statsVisible);

  const typewriterStrings = language === 'ar'
    ? ['ذكاء اصطناعي محلي.', 'خصوصية مطلقة.', 'بدون تتبع.', 'محرك نية ذكي.']
    : ['Local AI. Full Privacy.', 'Intent-Aware Coding.', 'Zero Telemetry.', 'Your Code Stays Yours.'];
  const { text: typewriterText, isTyping } = useTypewriter(typewriterStrings, 60, 35, 2200);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-6 overflow-hidden">
      <NeuralNetwork />
      {/* Parallax ambient glows */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-neon-green/8 blur-[180px] rounded-full pointer-events-none"
        style={{ y: parallaxOffset }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-green/5 blur-[160px] rounded-full pointer-events-none"
        style={{ y: -parallaxOffset }}
      />
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center z-10 max-w-5xl"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-neon-green mb-10 backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green" />
          </span>
          {t.hero.badge}
          <ChevronRight size={12} className="text-white/30" />
        </motion.div>

        <h1 className="text-7xl md:text-9xl font-bold mb-6 leading-[0.85] tracking-tighter">
          <AnimatedText text={t.hero.title} mode="word" staggerChildren={0.08} />
          <br />
          <span className="text-white/15 italic">
            <AnimatedText text={t.hero.titleSub} mode="word" delay={0.4} staggerChildren={0.06} />
          </span>
        </h1>

        {/* Typewriter subtitle */}
        <div className="h-10 flex items-center justify-center mb-10">
          <span className="text-lg md:text-xl font-mono text-neon-green/80">
            {typewriterText}
            <span className={`${isTyping ? 'opacity-100' : 'animate-pulse'} text-neon-green`}>▊</span>
          </span>
        </div>

        <p className="text-xl md:text-2xl text-white/50 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          {t.hero.desc}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0,255,0,0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto bg-neon-green text-black px-10 py-4.5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(0,255,0,0.15)]"
          >
            <Download className="w-5 h-5" /> {t.hero.download}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto glass px-10 py-4.5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2.5"
          >
            {t.hero.whyBuilt} <ChevronRight className="w-5 h-5 text-white/30" />
          </motion.button>
        </div>
      </motion.div>

      {/* Animated Stats Grid */}
      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-28 max-w-5xl w-full px-6">
        {[
          { value: `${modelsCount}+`, label: t.stats.models },
          { value: `${contextCount}%`, label: t.stats.context },
          { value: '∞', label: t.stats.memory },
          { value: '✓', label: t.stats.sdaia },
        ].map((stat, i) => (
          <ScrollReveal key={i} delay={i * 0.1}>
            <GlowCard className="glass p-7 rounded-2xl text-center group hover:border-neon-green/20 transition-colors">
              <div className="text-4xl font-bold font-display mb-1.5 group-hover:text-neon-green transition-colors">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{stat.label}</div>
            </GlowCard>
          </ScrollReveal>
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          <ArrowDown size={18} className="text-white/20" />
        </motion.div>
      </motion.div>
    </section>
  );
};
