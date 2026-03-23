import { Ghost, Twitter, Youtube, MessageSquare } from 'lucide-react';
import { ScrollReveal } from '../shared/ScrollReveal';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/translations';

export const Team = () => {
  const { language } = useStore();
  const t = useTranslation(language);

  return (
    <section id="team" className="py-32 px-6 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-20">
          <div className="text-xs font-mono text-neon-green mb-4 uppercase tracking-widest">{t.sections.minds}</div>
          <h2 className="text-4xl md:text-6xl font-bold leading-none tracking-tighter">
            {t.sections.theTeam} <br />
            <span className="text-white/20">{t.sections.building}</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal>
          <div className="flex justify-center">
            <div className="glass p-10 rounded-[40px] max-w-2xl w-full flex flex-col md:flex-row items-center gap-10">
              <div className="w-32 h-32 rounded-3xl bg-neon-green/10 flex items-center justify-center shrink-0 border border-neon-green/20">
                <Ghost className="w-16 h-16 text-neon-green" />
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-2">Sulaiman Alshammari</h3>
                <div className="text-neon-green font-mono text-sm uppercase tracking-widest mb-6">Founder & CEO</div>
                <p className="text-white/60 leading-relaxed mb-6">
                  Saudi innovator and entrepreneur. Creator of the Three-Lobe AI architecture and the HAVEN ecosystem.
                  Dedicated to achieving digital sovereignty for the Kingdom and the Arab world.
                </p>
                <div className="flex gap-4">
                  <a href="https://x.com/khawrzm" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-neon-green transition-colors"><Twitter className="w-5 h-5" /></a>
                  <a href="https://www.youtube.com/@saudicyper" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-neon-green transition-colors"><Youtube className="w-5 h-5" /></a>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export const Footer = () => {
  const { language } = useStore();
  const t = useTranslation(language);

  return (
    <footer className="py-20 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-neon-green rounded-sm flex items-center justify-center">
                <Ghost className="text-black w-5 h-5" />
              </div>
              <span className="font-display font-bold text-xl tracking-tighter">HAVEN</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed mb-6">{t.footer.tagline}</p>
            <div className="flex gap-4">
              <a href="https://x.com/khawrzm" target="_blank" rel="noopener noreferrer" className="p-2 glass rounded-lg hover:text-neon-green transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="https://www.youtube.com/@saudicyper" target="_blank" rel="noopener noreferrer" className="p-2 glass rounded-lg hover:text-neon-green transition-colors"><Youtube className="w-5 h-5" /></a>
              <a href="#" className="p-2 glass rounded-lg hover:text-neon-green transition-colors"><MessageSquare className="w-5 h-5" /></a>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-12">
            <div>
              <div className="text-xs font-mono text-white/20 uppercase tracking-widest mb-6">Ecosystem</div>
              <ul className="space-y-4 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">Haven Desktop</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Haven Browser</a></li>
                <li><a href="/ide" className="hover:text-white transition-colors">Haven IDE</a></li>
                <li><a href="#" className="hover:text-white transition-colors">K-Forge</a></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-mono text-white/20 uppercase tracking-widest mb-6">Company</div>
              <ul className="space-y-4 text-sm text-white/50">
                <li><a href="#story" className="hover:text-white transition-colors">Our Story</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SDAIA Compliance</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-mono text-white/20 uppercase tracking-widest mb-6">Contact</div>
              <ul className="space-y-4 text-sm text-white/50">
                <li><a href="mailto:contact@khawrizm.com" className="hover:text-white transition-colors">contact@khawrizm.com</a></li>
                <li><a href="https://x.com/khawrzm" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">@khawrzm</a></li>
              </ul>
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-mono text-white/20 uppercase tracking-widest mb-6">Legal</div>
              <div className="text-[10px] font-mono text-white/20 space-y-2">
                <div>CR 7050426415</div>
                <div>RIYADH 2026</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-white/5">
          <div className="text-xs font-mono text-white/20">© {new Date().getFullYear()} HAVEN · KHAWRIZM.COM</div>
          <div className="text-xs font-mono text-neon-green tracking-tighter">
            {t.footer.motto} ◆ BUILT IN RIYADH
          </div>
        </div>
      </div>
    </footer>
  );
};
