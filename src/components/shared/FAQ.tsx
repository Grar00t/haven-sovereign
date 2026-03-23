import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/translations';
import { cn } from '../../lib/utils';

export const FAQ = () => {
  const { language } = useStore();
  const t = useTranslation(language);
  const shouldReduceMotion = useReducedMotion();

  // Multi-open: allow several answers visible at once
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    setOpenIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const allOpen = openIndices.size === t.faq.length;
  const toggleAll = () =>
    setOpenIndices(allOpen ? new Set() : new Set(t.faq.map((_, i) => i)));

  return (
    <section id="faq" className="py-32 px-6 border-t border-white/5">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal className="text-center mb-16">
          <div className="text-xs font-mono text-neon-green mb-4 uppercase tracking-widest">
            // FAQ
          </div>
          <h2 className="text-4xl md:text-6xl font-bold leading-none tracking-tighter mb-4">
            {t.sections.faqTitle}
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            {t.sections.faqSub}
          </p>
        </ScrollReveal>

        {/* Expand / Collapse All */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleAll}
            className="text-xs font-mono text-white/30 hover:text-neon-green transition-colors uppercase tracking-wider"
          >
            {allOpen
              ? language === 'ar' ? 'طي الكل' : 'Collapse All'
              : language === 'ar' ? 'توسيع الكل' : 'Expand All'}
          </button>
        </div>

        <div className="space-y-4" role="list">
          {t.faq.map((item, i) => {
            const isOpen = openIndices.has(i);

            return (
              <ScrollReveal key={i} delay={i * 0.07}>
                <div
                  role="listitem"
                  className={cn(
                    'glass rounded-2xl overflow-hidden border border-white/5 transition-all duration-300',
                    isOpen
                      ? 'border-neon-green/30 shadow-[0_0_25px_rgba(0,255,0,0.08)]'
                      : 'hover:border-neon-green/15',
                  )}
                >
                  <button
                    id={`faq-q-${i}`}
                    onClick={() => toggleItem(i)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 group"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  >
                    <span className="font-semibold text-base md:text-lg group-hover:text-neon-green transition-colors">
                      {item.q}
                    </span>

                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
                      className="text-white/30 shrink-0"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${i}`}
                        role="region"
                        aria-labelledby={`faq-q-${i}`}
                        initial={
                          shouldReduceMotion
                            ? { opacity: 0 }
                            : { height: 0, opacity: 0 }
                        }
                        animate={
                          shouldReduceMotion
                            ? { opacity: 1 }
                            : { height: 'auto', opacity: 1 }
                        }
                        exit={
                          shouldReduceMotion
                            ? { opacity: 0 }
                            : { height: 0, opacity: 0 }
                        }
                        transition={{
                          duration: shouldReduceMotion ? 0.1 : 0.35,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                        className="overflow-hidden"
                      >
                        <div
                          className="px-6 pb-6 pt-2 text-sm md:text-base text-white/60 leading-relaxed border-t border-white/5"
                          dir={language === 'ar' ? 'rtl' : 'ltr'}
                        >
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
