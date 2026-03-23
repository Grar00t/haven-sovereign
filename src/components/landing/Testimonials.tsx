import { motion } from 'motion/react';
import { ScrollReveal } from '../shared/ScrollReveal';
import { GlowCard } from '../shared/GlowCard';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/translations';
import { Star, Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  roleAr: string;
  avatar: string;
  quote: string;
  quoteAr: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: 'Early Adopter',
    role: 'Full-Stack Developer',
    roleAr: 'مطور Full-Stack',
    avatar: 'D',
    quote: 'Finally an IDE that doesn\'t send my code to someone else\'s server. The local AI is fast enough for real work.',
    quoteAr: 'أخيراً بيئة تطوير لا ترسل كودي لخوادم خارجية. الذكاء الاصطناعي المحلي سريع بما يكفي للعمل الحقيقي.',
    rating: 5,
  },
  {
    name: 'Beta Tester',
    role: 'Security Engineer',
    roleAr: 'مهندس أمن معلومات',
    avatar: 'S',
    quote: 'The zero-telemetry approach is real — I verified it. No outbound connections except what you explicitly allow.',
    quoteAr: 'نهج عدم التتبع حقيقي — تحققت منه. لا اتصالات صادرة إلا ما تسمح به صراحة.',
    rating: 5,
  },
  {
    name: 'Community Member',
    role: 'AI/ML Researcher',
    roleAr: 'باحث ذكاء اصطناعي',
    avatar: 'R',
    quote: 'The Niyah Engine concept is interesting — understanding intent rather than just pattern matching. Still early, but the direction is solid.',
    quoteAr: 'مفهوم محرك النية مثير للاهتمام — فهم القصد بدلاً من مطابقة الأنماط فقط. لا يزال مبكراً، لكن الاتجاه صحيح.',
    rating: 4,
  },
  {
    name: 'Open Source Contributor',
    role: 'Backend Developer',
    roleAr: 'مطور Backend',
    avatar: 'C',
    quote: 'Clean codebase, runs well on modest hardware. The multi-model routing is a nice touch — swap models per task.',
    quoteAr: 'كود نظيف، يعمل جيداً على أجهزة متواضعة. التوجيه متعدد النماذج لمسة جميلة.',
    rating: 4,
  },
  {
    name: 'Early User',
    role: 'DevOps Engineer',
    roleAr: 'مهندس DevOps',
    avatar: 'E',
    quote: 'Set it up in under an hour. Ollama integration works out of the box. Built-in terminal and git are solid.',
    quoteAr: 'أعددته في أقل من ساعة. تكامل Ollama يعمل مباشرة. الطرفية والـ git المدمجان ممتازان.',
    rating: 5,
  },
  {
    name: 'Arabic Developer',
    role: 'NLP Engineer',
    roleAr: 'مهندس معالجة لغات',
    avatar: 'A',
    quote: 'The Arabic root tokenizer is a real feature, not an afterthought. Handles morphological analysis properly.',
    quoteAr: 'محلل الجذور العربي ميزة حقيقية وليس فكرة لاحقة. يتعامل مع التحليل الصرفي بشكل صحيح.',
    rating: 5,
  },
];

const TestimonialCard = ({ t, language, index }: { t: Testimonial; language: string; index: number }) => (
  <GlowCard className="glass rounded-3xl p-8 border-white/5 h-full flex flex-col">
    <div className="flex items-start gap-4 mb-6">
      <div className="w-12 h-12 rounded-2xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center text-neon-green font-bold text-lg shrink-0">
        {t.avatar}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold truncate">{t.name}</div>
        <div className="text-xs text-white/40 truncate">{language === 'ar' ? t.roleAr : t.role}</div>
      </div>
    </div>
    <div className="flex gap-0.5 mb-4">
      {Array.from({ length: t.rating }).map((_, i) => (
        <Star key={i} size={12} className="text-neon-green fill-neon-green" />
      ))}
    </div>
    <div className="relative flex-1">
      <Quote size={20} className="text-neon-green/10 absolute -top-1 -left-1" />
      <p className="text-sm text-white/60 leading-relaxed pl-2">
        {language === 'ar' ? t.quoteAr : t.quote}
      </p>
    </div>
  </GlowCard>
);

export const Testimonials = () => {
  const { language } = useStore();
  const t = useTranslation(language);

  return (
    <section id="testimonials" className="py-32 px-6 bg-white/[0.01] border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-20">
          <div className="text-xs font-mono text-neon-green mb-4 uppercase tracking-widest">// EARLY FEEDBACK</div>
          <h2 className="text-4xl md:text-6xl font-bold leading-none tracking-tighter">
            {language === 'ar' ? 'آراء المطورين.' : 'Developer Feedback.'} <br/>
            <span className="text-white/20">{language === 'ar' ? 'من المجتمع.' : 'From the Community.'}</span>
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <ScrollReveal key={i} delay={i * 0.08}>
              <TestimonialCard t={testimonial} language={language} index={i} />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-3 glass px-8 py-4 rounded-full border-neon-green/10">
              <div className="flex -space-x-2">
                {['D', 'S', 'R', 'C', 'E'].map((a, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-neon-green/10 border-2 border-black flex items-center justify-center text-[10px] text-neon-green font-bold">
                    {a}
                  </div>
                ))}
              </div>
              <span className="text-xs text-white/40">
                {language === 'ar' ? 'انضم إلى مجتمع HAVEN المتنامي' : 'Join the HAVEN community'}
              </span>
            </div>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
};
