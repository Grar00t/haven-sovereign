import { type FC } from 'react';
import { motion } from 'motion/react';
import { ScrollReveal } from '../shared/ScrollReveal';
import { useStore } from '../../store/useStore';
import { Download, ArrowRight, Shield, Zap, Lock } from 'lucide-react';

export const CallToAction: FC = () => {
  const { language } = useStore();

  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Ambient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-neon-green/[0.04] blur-[150px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto relative">
        <ScrollReveal>
          {/* Animated border gradient card */}
          <div className="relative rounded-[32px] p-[1px] overflow-hidden">
            {/* Animated gradient border */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-[-100%] z-0"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0%, #00ff41 10%, transparent 20%, #00ff41 30%, transparent 40%)',
              }}
            />

            {/* Inner card */}
            <div className="relative z-10 bg-haven-black rounded-[31px] p-12 md:p-16 text-center overflow-hidden">
              {/* Grid background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative z-10"
              >
                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  {[
                    { icon: Shield, label: 'SDAIA Compliant' },
                    { icon: Lock, label: 'Zero Telemetry' },
                    { icon: Zap, label: 'Local Processing' },
                  ].map((badge, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[9px] font-mono text-neon-green/60 uppercase tracking-wider">
                      <badge.icon size={12} />
                      {badge.label}
                    </div>
                  ))}
                </div>

                <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 leading-none">
                  {language === 'ar' ? (
                    <>حان وقت السيادة.<br /><span className="text-white/20">بياناتك. قواعدك.</span></>
                  ) : (
                    <>Time for Sovereignty.<br /><span className="text-white/20">Your Data. Your Rules.</span></>
                  )}
                </h2>

                <p className="text-white/40 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                  {language === 'ar'
                    ? 'انضم إلى الآلاف الذين استعادوا سيادتهم الرقمية. حمّل HAVEN مجاناً — لا بطاقة ائتمان، لا تتبع، لا حلول وسط.'
                    : 'Join thousands who reclaimed their digital sovereignty. Download HAVEN for free — no credit card, no tracking, no compromises.'
                  }
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(0,255,0,0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-neon-green text-black px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-2.5 shadow-[0_0_40px_rgba(0,255,0,0.2)]"
                  >
                    <Download size={20} />
                    {language === 'ar' ? 'حمّل HAVEN مجاناً' : 'Download HAVEN Free'}
                  </motion.button>
                  <motion.a
                    whileHover={{ scale: 1.03, x: 5 }}
                    whileTap={{ scale: 0.97 }}
                    href="#products"
                    className="flex items-center gap-2 text-white/50 hover:text-neon-green transition-colors text-lg font-medium px-6 py-5"
                  >
                    {language === 'ar' ? 'استكشف المنتجات' : 'Explore Products'} <ArrowRight size={18} />
                  </motion.a>
                </div>

                {/* Bottom text */}
                <div className="mt-10 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                  {language === 'ar' ? 'لا بطاقة ائتمان · بدون تتبع · مفتوح المصدر' : 'No Credit Card · Zero Telemetry · Open Source'}
                </div>
              </motion.div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
