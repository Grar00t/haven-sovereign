import { type FC } from 'react';
import { motion } from 'motion/react';
import { ScrollReveal } from '../shared/ScrollReveal';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/translations';

const techCategories = [
  {
    label: 'Core Engine',
    labelAr: 'المحرك الأساسي',
    items: [
      { name: 'Rust', color: '#DEA584' },
      { name: 'WebAssembly', color: '#654FF0' },
      { name: 'TypeScript', color: '#3178C6' },
      { name: 'React', color: '#61DAFB' },
    ],
  },
  {
    label: 'AI / ML',
    labelAr: 'الذكاء الاصطناعي',
    items: [
      { name: 'PyTorch', color: '#EE4C2C' },
      { name: 'ONNX', color: '#005CED' },
      { name: 'TensorRT', color: '#76B900' },
      { name: 'CUDA', color: '#76B900' },
    ],
  },
  {
    label: 'Sovereign Stack',
    labelAr: 'البنية السيادية',
    items: [
      { name: 'SQLite', color: '#003B57' },
      { name: 'libp2p', color: '#0080FF' },
      { name: 'WireGuard', color: '#88171A' },
      { name: 'IPFS', color: '#65C2CB' },
    ],
  },
  {
    label: 'Security',
    labelAr: 'الأمان',
    items: [
      { name: 'AES-256', color: '#00FF41' },
      { name: 'Ed25519', color: '#00FF41' },
      { name: 'Argon2', color: '#00FF41' },
      { name: 'ZK-Proofs', color: '#8B5CF6' },
    ],
  },
];

const TechBadge: FC<{ name: string; color: string; delay: number }> = ({ name, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5, y: 20 }}
    whileInView={{ opacity: 1, scale: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay, type: 'spring', stiffness: 200, damping: 15 }}
    whileHover={{ scale: 1.1, y: -4 }}
    className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm cursor-default flex items-center gap-2.5 group"
  >
    <div className="w-2 h-2 rounded-full transition-shadow duration-300" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }} />
    <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{name}</span>
  </motion.div>
);

const OrbitRing = ({ radius, duration, children }: { radius: number; duration: number; children: import('react').ReactNode }) => (
  <motion.div
    className="absolute rounded-full border border-white/[0.04]"
    style={{
      width: radius * 2,
      height: radius * 2,
      top: '50%',
      left: '50%',
      marginTop: -radius,
      marginLeft: -radius,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: 'linear' }}
  >
    {children}
  </motion.div>
);

const OrbitDot = ({ angle, color }: { angle: number; color: string }) => (
  <div
    className="absolute w-2.5 h-2.5 rounded-full"
    style={{
      backgroundColor: color,
      boxShadow: `0 0 12px ${color}`,
      top: '50%',
      left: '50%',
      transform: `rotate(${angle}deg) translateX(50%) translate(-50%, -50%)`,
    }}
  />
);

export const TechStack = () => {
  const { language } = useStore();
  const t = useTranslation(language);

  return (
    <section id="tech-stack" className="py-32 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-20">
          <div className="text-xs font-mono text-neon-green mb-4 uppercase tracking-widest">// TECHNOLOGY</div>
          <h2 className="text-4xl md:text-6xl font-bold leading-none tracking-tighter">
            {language === 'ar' ? 'البنية التحتية.' : 'The Stack.'} <br/>
            <span className="text-white/20">{language === 'ar' ? 'مبني للسيادة.' : 'Built for Sovereignty.'}</span>
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Tech Cards */}
          <div className="space-y-6">
            {techCategories.map((cat, ci) => (
              <ScrollReveal key={ci} delay={ci * 0.1}>
                <div className="glass p-6 rounded-2xl">
                  <div className="text-[10px] font-mono text-neon-green uppercase tracking-widest mb-4">
                    {language === 'ar' ? cat.labelAr : cat.label}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {cat.items.map((item, ii) => (
                      <TechBadge key={ii} name={item.name} color={item.color} delay={ci * 0.1 + ii * 0.05} />
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Orbit Visualization */}
          <ScrollReveal>
            <div className="relative w-full aspect-square max-w-md mx-auto">
              {/* Center logo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <motion.div
                  animate={{ boxShadow: ['0 0 30px rgba(0,255,65,0.2)', '0 0 60px rgba(0,255,65,0.4)', '0 0 30px rgba(0,255,65,0.2)'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-20 h-20 rounded-3xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center"
                >
                  <span className="text-2xl font-black text-neon-green">H</span>
                </motion.div>
              </div>

              {/* Orbit rings */}
              <OrbitRing radius={80} duration={20}>
                <OrbitDot angle={0} color="#DEA584" />
                <OrbitDot angle={120} color="#3178C6" />
                <OrbitDot angle={240} color="#654FF0" />
              </OrbitRing>
              <OrbitRing radius={130} duration={30}>
                <OrbitDot angle={45} color="#EE4C2C" />
                <OrbitDot angle={165} color="#005CED" />
                <OrbitDot angle={285} color="#76B900" />
              </OrbitRing>
              <OrbitRing radius={180} duration={40}>
                <OrbitDot angle={90} color="#0080FF" />
                <OrbitDot angle={210} color="#88171A" />
                <OrbitDot angle={330} color="#65C2CB" />
              </OrbitRing>

              {/* Background grid */}
              <div className="absolute inset-0 opacity-5">
                <svg width="100%" height="100%" viewBox="0 0 400 400">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <line key={`h${i}`} x1="0" y1={i * 20} x2="400" y2={i * 20} stroke="white" strokeWidth="0.5" />
                  ))}
                  {Array.from({ length: 20 }).map((_, i) => (
                    <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="400" stroke="white" strokeWidth="0.5" />
                  ))}
                </svg>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Bottom Stats */}
        <ScrollReveal>
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '16', label: language === 'ar' ? 'تقنية مدمجة' : 'Integrated Technologies' },
              { value: '0', label: language === 'ar' ? 'اعتماد على خوادم خارجية' : 'External Server Dependencies' },
              { value: '100%', label: language === 'ar' ? 'معالجة محلية' : 'Local Processing' },
              { value: 'AES-256', label: language === 'ar' ? 'تشفير عسكري' : 'Military-Grade Encryption' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-5 rounded-2xl text-center"
              >
                <div className="text-2xl font-black text-neon-green mb-1">{stat.value}</div>
                <div className="text-[10px] text-white/30 font-mono uppercase">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
