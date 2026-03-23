import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/translations';

interface Command {
  id: string;
  label: string;
  labelAr?: string;
  shortcut?: string;
  section: string;
  action: () => void;
}

export const CommandPalette = () => {
  const { commandPaletteOpen, setCommandPaletteOpen, language, toggleLanguage, toggleSovereign, isSovereign } = useStore();
  const t = useTranslation(language);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    { id: 'products', label: 'Go to Products', labelAr: 'اذهب للمنتجات', section: 'Navigation', action: () => { document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); close(); } },
    { id: 'models', label: 'Go to Models', labelAr: 'اذهب للنماذج', section: 'Navigation', action: () => { document.getElementById('models')?.scrollIntoView({ behavior: 'smooth' }); close(); } },
    { id: 'niyah', label: 'Go to Niyah Logic', labelAr: 'اذهب لمنطق النية', section: 'Navigation', action: () => { document.getElementById('niyah')?.scrollIntoView({ behavior: 'smooth' }); close(); } },
    { id: 'expose', label: 'Go to Exposé', labelAr: 'اذهب للفضائح', section: 'Navigation', action: () => { document.getElementById('expose')?.scrollIntoView({ behavior: 'smooth' }); close(); } },
    { id: 'story', label: 'Go to Our Story', labelAr: 'اذهب لقصتنا', section: 'Navigation', action: () => { document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' }); close(); } },
    { id: 'team', label: 'Go to Team', labelAr: 'اذهب للفريق', section: 'Navigation', action: () => { document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' }); close(); } },
    { id: 'pricing', label: 'Go to Pricing', labelAr: 'اذهب للأسعار', section: 'Navigation', action: () => { document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); close(); } },
    { id: 'faq', label: 'Go to FAQ', labelAr: 'اذهب للأسئلة الشائعة', section: 'Navigation', action: () => { document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); close(); } },
    { id: 'top', label: 'Scroll to Top', labelAr: 'اذهب للأعلى', section: 'Navigation', action: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); close(); } },
    { id: 'ide', label: 'Open HAVEN IDE', labelAr: 'افتح بيئة التطوير', shortcut: '', section: 'Apps', action: () => { window.location.href = '/ide'; } },
    { id: 'lang', label: language === 'en' ? 'Switch to Arabic' : 'Switch to English', labelAr: language === 'en' ? 'التبديل إلى العربية' : 'التبديل إلى الإنجليزية', section: 'Settings', action: () => { toggleLanguage(); close(); } },
    { id: 'sovereign', label: isSovereign ? 'Deactivate Royal Mode' : 'Activate Royal Mode', labelAr: isSovereign ? 'إلغاء الوضع الملكي' : 'تفعيل الوضع الملكي', section: 'Settings', action: () => { toggleSovereign(); close(); } },
    { id: 'youtube', label: 'Watch on YouTube', labelAr: 'شاهد على يوتيوب', section: 'External', action: () => { window.open('https://www.youtube.com/@saudicyper', '_blank'); close(); } },
    { id: 'twitter', label: 'Follow on X', labelAr: 'تابعنا على X', section: 'External', action: () => { window.open('https://x.com/khawrzm', '_blank'); close(); } },
  ];

  const close = () => { setCommandPaletteOpen(false); setQuery(''); setSelectedIndex(0); };

  const filtered = commands.filter(cmd => {
    const label = language === 'ar' && cmd.labelAr ? cmd.labelAr : cmd.label;
    return label.toLowerCase().includes(query.toLowerCase()) || cmd.section.toLowerCase().includes(query.toLowerCase());
  });

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    (acc[cmd.section] ??= []).push(cmd);
    return acc;
  }, {});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape' && commandPaletteOpen) close();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen]);

  // Reset selection when query changes
  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter' && filtered.length > 0) {
      e.preventDefault();
      filtered[selectedIndex]?.action();
    }
  };

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500]"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[90%] max-w-[560px] z-[501] glass rounded-2xl border-neon-green/20 overflow-hidden shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={t.command.title}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <span className="text-neon-green text-lg">⌘</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handlePaletteKeyDown}
                placeholder={t.command.placeholder}
                className="bg-transparent border-none outline-none flex-1 text-sm text-white placeholder:text-white/30 font-mono"
                aria-label={t.command.title}
              />
              <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/30 border border-white/10">ESC</kbd>
            </div>

            <div className="max-h-[320px] overflow-y-auto p-2" role="listbox">
              {(() => {
                let flatIdx = 0;
                return Object.entries(grouped).map(([section, cmds]) => (
                  <div key={section} role="group" aria-label={section}>
                    <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest px-3 py-2">{section}</div>
                    {cmds.map((cmd) => {
                      const idx = flatIdx++;
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={cmd.id}
                          role="option"
                          aria-selected={isSelected}
                          onClick={cmd.action}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors group ${isSelected ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                        >
                          <span>{language === 'ar' && cmd.labelAr ? cmd.labelAr : cmd.label}</span>
                          {cmd.shortcut && <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/20 border border-white/5">{cmd.shortcut}</kbd>}
                      <span className="text-[10px] text-neon-green opacity-0 group-hover:opacity-100 transition-opacity">↵</span>
                    </button>
                      );
                    })}
                  </div>
                ));
              })()}
              {filtered.length === 0 && (
                <div className="text-center text-white/20 text-sm py-8 font-mono">No results found</div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[9px] font-mono text-white/20">HAVEN Command Palette</span>
              <div className="flex items-center gap-2">
                <kbd className="text-[8px] font-mono px-1 py-0.5 rounded bg-white/5 text-white/20 border border-white/5">↑↓</kbd>
                <span className="text-[8px] text-white/10">Navigate</span>
                <kbd className="text-[8px] font-mono px-1 py-0.5 rounded bg-white/5 text-white/20 border border-white/5">↵</kbd>
                <span className="text-[8px] text-white/10">Select</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
