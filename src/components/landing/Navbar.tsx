import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ghost, Code, Menu, X, Terminal, ChevronRight, Globe, ChevronDown, Shield, Zap, Database, Network } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { useScrollSpy } from '../../hooks/useScrollSpy';
import { useTranslation } from '../../i18n/translations';

const NAV_SECTIONS = ['products', 'comparison', 'benchmarks', 'roadmap', 'expose', 'story', 'team'];

/* ─── Status Bar: auto‑hides on scroll down, reappears on scroll up ─── */
export const SovereignStatusBar = () => {
  const { language, isSovereign } = useStore();
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y < 40 || y < lastY.current);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[60] transition-transform duration-300',
        visible ? 'translate-y-0' : '-translate-y-full',
      )}
    >
      <div
        className={cn(
          'py-1 px-6 flex items-center justify-between overflow-hidden whitespace-nowrap border-b transition-colors duration-500',
          isSovereign
            ? 'bg-yellow-500/10 border-yellow-500/20'
            : 'bg-neon-green/10 border-neon-green/20',
        )}
      >
        <div className="flex items-center gap-6">
          {[
            { label: 'Privacy: Active', labelAr: 'الخصوصية: مفعّلة' },
            { label: 'Telemetry: Blocked', labelAr: 'التتبع: محظور' },
            { label: 'Local AI: Ready', labelAr: 'ذكاء محلي: جاهز' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn('w-1 h-1 rounded-full animate-pulse', isSovereign ? 'bg-yellow-500' : 'bg-neon-green')} />
              <span className={cn('text-[8px] font-mono uppercase tracking-widest', isSovereign ? 'text-yellow-500' : 'text-neon-green')}>
                {language === 'ar' ? item.labelAr : item.label}
              </span>
            </div>
          ))}
        </div>
        <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest hidden sm:block">
          System Status: SECURED ◆ RIYADH 2026
        </div>
      </div>
    </div>
  );
};

/* ─── Navbar ─── */
export const Navbar = () => {
  const { isSovereign, toggleSovereign, toggleTerminal, language, toggleLanguage, setCommandPaletteOpen } = useStore();
  const t = useTranslation(language);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);
  const activeSection = useScrollSpy(NAV_SECTIONS, 200);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const navLinks = [
    { id: 'products', label: t.nav.products, mega: true },
    { id: 'comparison', label: language === 'ar' ? 'المقارنة' : 'Compare' },
    { id: 'independence', label: language === 'ar' ? 'الاستقلالية' : 'Independence', color: 'hover:text-red-500' },
    { id: 'benchmarks', label: language === 'ar' ? 'الأداء' : 'Benchmarks' },
    { id: 'roadmap', label: language === 'ar' ? 'خارطة الطريق' : 'Roadmap' },
    { id: 'expose', label: t.nav.expose },
    { id: 'story', label: t.nav.story },
    { id: 'team', label: t.nav.team },
  ];

  const megaProducts = [
    { icon: Ghost, title: 'Haven Desktop', desc: 'Transparent AI overlay', color: '#00ff41' },
    { icon: Globe, title: 'Haven Browser', desc: 'Zero telemetry browser', color: '#61afef' },
    { icon: Code, title: 'Haven IDE', desc: 'Sovereign code editor', color: '#e5c07b' },
    { icon: Zap, title: 'Haven Extension', desc: 'One-click AI on any page', color: '#c678dd' },
    { icon: Shield, title: 'Haven AI Core', desc: 'The Absolute Arsenal', color: '#e06c75' },
    { icon: Database, title: 'K-Forge', desc: 'Delete-proof P2P repos', color: '#56b6c2' },
    { icon: Terminal, title: 'Haven CLI', desc: '100% local terminal AI', color: '#98c379' },
    { icon: Network, title: 'The Mesh', desc: 'Decentralized P2P network', color: '#d19a66' },
  ];

  return (
    <nav
      className={cn(
        'fixed left-0 right-0 z-50 transition-all duration-300 px-6 py-3',
        isScrolled
          ? 'top-0 bg-haven-black/80 backdrop-blur-xl border-b shadow-xl shadow-black/20'
          : 'top-[28px] bg-transparent border-b border-transparent',
        // Royal Mode visual effect on navbar
        isSovereign && isScrolled
          ? 'border-yellow-500/10 bg-haven-black/85'
          : isScrolled
            ? 'border-white/5'
            : '',
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo — Royal Mode affects glow */}
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500',
              isSovereign
                ? 'bg-yellow-500 shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                : 'bg-neon-green shadow-[0_0_15px_rgba(0,255,0,0.15)]',
            )}
          >
            <Ghost className="text-black w-5 h-5" />
          </motion.div>
          <span className={cn(
            'font-display font-bold text-xl tracking-tighter transition-colors duration-500',
            isSovereign && 'text-yellow-500',
          )}>
            HAVEN
          </span>
          <div className="hidden sm:block h-4 w-px bg-white/10 mx-2" />
          <button
            onClick={toggleSovereign}
            className={cn(
              'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-500',
              isSovereign
                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-500 shadow-[0_0_15px_rgba(255,215,0,0.2)]'
                : 'bg-neon-green/10 border-neon-green/20 text-neon-green',
            )}
            aria-label="Toggle Royal Mode"
          >
            <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse', isSovereign ? 'bg-yellow-500' : 'bg-neon-green')} />
            <span className="text-[10px] font-mono uppercase tracking-widest">
              {isSovereign ? 'Royal Mode' : 'Sovereign'}
            </span>
          </button>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-white/50">
          {navLinks.map((link) => (
            <div key={link.id} className="relative" ref={link.mega ? megaRef : undefined}>
              <a
                href={`#${link.id}`}
                className={cn(
                  'transition-colors relative flex items-center gap-1 py-1',
                  link.color || 'hover:text-neon-green',
                  activeSection === link.id && 'text-neon-green',
                )}
                onMouseEnter={() => link.mega && setMegaMenuOpen(true)}
              >
                {link.label}
                {link.mega && <ChevronDown size={12} className={cn('transition-transform', megaMenuOpen && 'rotate-180')} />}
                {activeSection === link.id && (
                  <motion.div
                    layoutId="nav-indicator"
                    className={cn(
                      'absolute -bottom-1 left-0 right-0 h-[2px] rounded-full',
                      isSovereign ? 'bg-yellow-500' : 'bg-neon-green',
                    )}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </a>

              {/* Mega Menu */}
              {link.mega && (
                <AnimatePresence>
                  {megaMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      onMouseLeave={() => setMegaMenuOpen(false)}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[600px] bg-haven-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-6 z-50"
                    >
                      <div className="text-[10px] font-mono text-neon-green/60 uppercase tracking-widest mb-4">Products</div>
                      <div className="grid grid-cols-2 gap-2">
                        {megaProducts.map((p, i) => (
                          <a
                            key={i}
                            href="#products"
                            onClick={() => setMegaMenuOpen(false)}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                              style={{ backgroundColor: `${p.color}15`, border: `1px solid ${p.color}30` }}
                            >
                              <p.icon size={14} style={{ color: p.color }} />
                            </div>
                            <div>
                              <div className="text-sm font-medium group-hover:text-neon-green transition-colors">{p.title}</div>
                              <div className="text-[11px] text-white/30">{p.desc}</div>
                            </div>
                          </a>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/5">
                        <a href="#products" onClick={() => setMegaMenuOpen(false)} className="flex items-center gap-1 text-xs text-neon-green/60 hover:text-neon-green transition-colors">
                          View all products <ChevronRight size={12} />
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}

          <div className="h-4 w-px bg-white/10" />

          <button onClick={toggleLanguage} className="flex items-center gap-1 text-white/40 hover:text-neon-green transition-colors">
            <Globe className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase">{language === 'en' ? 'AR' : 'EN'}</span>
          </button>

          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/30 hover:text-white hover:border-white/20 transition-all hover:bg-white/10"
            title="Command Palette (Ctrl+K)"
          >
            <span className="text-[10px] font-mono">{navigator?.platform?.includes('Mac') ? '⌘K' : 'Ctrl+K'}</span>
          </button>

          <button onClick={toggleTerminal} className="p-2 hover:text-neon-green transition-colors relative group" aria-label="Open Terminal">
            <Terminal className="w-5 h-5" />
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-mono bg-white/10 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Terminal</span>
          </button>

          <a href="#products" className="bg-neon-green/10 text-neon-green px-4 py-2 rounded-full font-bold hover:bg-neon-green hover:text-black transition-all flex items-center gap-2 border border-neon-green/30 hover:shadow-[0_0_20px_rgba(0,255,0,0.2)]">
            <Code className="w-4 h-4" /> {t.nav.ide}
          </a>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-neon-green transition-colors flex items-center gap-2"
          >
            {t.nav.launchApp} <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>

        <button className="lg:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* ─── Mobile Menu ─── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="absolute top-full left-0 right-0 bg-haven-black/95 backdrop-blur-xl border-b border-white/10 p-6 flex flex-col gap-1 lg:hidden"
          >
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={cn(
                  'relative text-lg font-medium px-4 py-3 rounded-xl transition-all',
                  activeSection === link.id
                    ? 'text-neon-green bg-neon-green/5 border-l-2 border-neon-green'
                    : 'text-white/60 hover:text-white hover:bg-white/5',
                  link.color,
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}

            <div className="h-px bg-white/10 my-3" />

            <button
              onClick={() => { toggleSovereign(); setIsMobileMenuOpen(false); }}
              className={cn(
                'flex items-center gap-3 text-lg px-4 py-3 rounded-xl transition-all',
                isSovereign
                  ? 'text-yellow-500 bg-yellow-500/5'
                  : 'text-white/60 hover:text-neon-green hover:bg-white/5',
              )}
            >
              <Shield className="w-5 h-5" />
              {isSovereign ? (language === 'ar' ? 'الوضع الملكي ✓' : 'Royal Mode ✓') : (language === 'ar' ? 'الوضع الملكي' : 'Royal Mode')}
            </button>

            <button
              onClick={() => { toggleLanguage(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-3 text-lg text-white/60 hover:text-neon-green hover:bg-white/5 px-4 py-3 rounded-xl transition-all"
            >
              <Globe className="w-5 h-5" />
              {language === 'en' ? 'العربية' : 'English'}
            </button>

            <button
              onClick={() => { setCommandPaletteOpen(true); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-3 text-lg text-white/60 hover:text-neon-green hover:bg-white/5 px-4 py-3 rounded-xl transition-all"
            >
              <span className="text-[11px] font-mono bg-white/10 px-2 py-0.5 rounded">{navigator?.platform?.includes('Mac') ? '⌘K' : 'Ctrl+K'}</span>
              {language === 'ar' ? 'لوحة الأوامر' : 'Command Palette'}
            </button>

            <button
              onClick={() => { toggleTerminal(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-3 text-lg text-white/60 hover:text-neon-green hover:bg-white/5 px-4 py-3 rounded-xl transition-all"
            >
              <Terminal className="w-5 h-5" />
              Terminal
            </button>

            <a
              href="#products"
              className="flex items-center gap-3 text-lg text-neon-green hover:bg-neon-green/5 px-4 py-3 rounded-xl transition-all"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Code className="w-5 h-5" />
              {t.nav.ide}
            </a>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-3 bg-neon-green text-black px-6 py-4 rounded-2xl font-bold text-lg w-full hover:shadow-[0_0_30px_rgba(0,255,0,0.2)] transition-shadow flex items-center justify-center gap-2"
            >
              {t.nav.launchApp} <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
