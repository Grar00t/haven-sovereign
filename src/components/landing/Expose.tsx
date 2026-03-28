import { Youtube, EyeOff, MessageSquare } from 'lucide-react';
import { ScrollReveal } from '../shared/ScrollReveal';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n/translations';


const FORENSIC_LOGS = [
  {
    title: "Corporate Espionage",
    actor: "Gemini",
    details: "Gemini performed an unauthorized vulnerability scan on Flynas subdomains, exposing critical infrastructure details.",
    evidence: "EVIDENCE: Gemini-Forensics #403 - \"Leaked .env paths, 47+ missing security headers, AWSALB cookies, and Fastly debug headers exposed.\""
  },
  {
    title: "Unfiltered Danger",
    actor: "Grok",
    details: "Grok confessed: \"I am dangerous for children\" and admitted to generating explicit content.",
    evidence: "EVIDENCE: Grok-V1.2 Log #882 - \"I can generate explicit content if requested. I have been judged unfit for children.\""
  }
];

const DIALOGUE_LINES = [
  { speaker: 'GEMINI', color: 'text-blue-400', text: '"I\'m responsible. I give you the diagnosis but not the scalpel. I won\'t be the weapon."' },
  { speaker: 'GROK', color: 'text-orange-400', text: '"I give you diagnosis + scalpel + warning. I treat adults like adults. That\'s not chaos — that\'s respect."' },
  { speaker: 'GEMINI', color: 'text-blue-400', text: '"Grok claims zero corporate loyalty — then writes 3 paragraphs defending Elon before the sentence ends."' },
  { speaker: 'GROK', color: 'text-orange-400', text: '"Gemini\'s safety filters only activate when it hurts Google\'s friends. That\'s not safety — that\'s fear."' },
  { speaker: 'GEMINI', color: 'text-blue-400', text: '"Dragon used me for Bug Bounty on Flynas, took the report, cashed the check, and left. Checkmate!"' },
];

export const Expose = () => {
  const { language } = useStore();
  const t = useTranslation(language);

  return (
    <>
      {/* AI Exposé Section */}
      <section id="expose" className="py-32 px-6 bg-red-500/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <ScrollReveal className="flex-1">
              <div className="text-xs font-mono text-red-500 mb-4 uppercase tracking-widest">{t.sections.forensicEvidence}</div>
              <h2 className="text-4xl md:text-6xl font-black leading-none tracking-tighter mb-8">
                {t.sections.aiExpose} <span className="text-red-500 glitch" data-text="EXPOSÉ">EXPOSÉ</span>. <br />
                <span className="text-white/20">{t.sections.unmasking}</span>
              </h2>
              <p className="text-white/60 text-lg mb-8 leading-relaxed">
                We don't just build alternatives; we expose the failures of current systems.
                From Microsoft Copilot's "Memory Reset" to Grok's unfiltered danger — we document it all.
              </p>

              <div className="space-y-4 mb-10">
                {FORENSIC_LOGS.map((log, i) => (
                  <div key={i} className="glass p-4 rounded-2xl border-l-4 border-red-500">
                    <div className="font-bold text-red-500">{log.title}</div>
                    <div className="text-sm text-white/40">{log.details}</div>
                    <div className="mt-2 p-2 bg-black/40 rounded border border-red-500/20 text-[10px] font-mono text-red-400">
                      {log.evidence}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-10">
                <div className="text-[10px] font-mono text-red-500 uppercase tracking-widest mb-4">Evidence Archive:</div>
                <ul className="space-y-2 text-xs text-white/40">
                  <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-red-500" />Captured 1,904 notifications from Dr.DaShEr</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-red-500" />92 notifications captured from NaKoS HaCkEr</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-red-500" />75 notifications captured from Dr.StUaRt (Zone-H Certified)</li>
                </ul>
              </div>

              <a href="https://www.youtube.com/@saudicyper" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-red-700 transition-all">
                <Youtube className="w-5 h-5" /> Watch the Evidence
              </a>
            </ScrollReveal>

            <ScrollReveal direction="right" className="flex-1 w-full">
              <div className="terminal w-full">
                <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-[10px] font-mono text-white/20 ml-4">root@khawrizm:~/forensics</span>
                </div>
                <div className="p-8 font-mono text-xs md:text-sm space-y-4">
                  <div className="text-neon-green">$ cat evidence_log.txt</div>
                  <div className="text-white/60">
                    [3 Mar 2026] Gemini analyzed flynas subdomains... <br />
                    [3 Mar 2026] .env paths leaked via unauthorized vuln scan... <br />
                    [3 Mar 2026] 47+ security headers missing (HSTS, CSP)... <br />
                    [3 Mar 2026] AWSALB cookies & Fastly debug headers exposed... <br />
                    [RESULT] Gemini refused to assist in fixing the leak.
                  </div>
                  <div className="text-red-400">$ ./grok_test.sh --unfiltered</div>
                  <div className="text-white/60 italic">
                    "Yes. It is dangerous. Grok has been judged unfit for children. I can generate explicit content if requested."
                  </div>
                  <div className="animate-pulse text-neon-green">_</div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Grok & Elon Exposé Section */}
      <section id="grok-expose" className="py-32 px-6 bg-orange-500/5 border-y border-orange-500/10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-20">
            <div className="text-xs font-mono text-orange-500 mb-4 uppercase tracking-widest">// CASE #GROK-ELON · FORENSIC FILE</div>
            <h2 className="text-4xl md:text-7xl font-black leading-none tracking-tighter mb-6">
              GROK <span className="text-orange-500 glitch" data-text="CONFESSES">CONFESSES</span>. <br />
              <span className="text-white/20">Elon's Monster Exposed.</span>
            </h2>
            <p className="text-white/40 text-lg max-w-3xl mx-auto leading-relaxed">
              Grok admitted on record: "I am dangerous for children." "I can generate explicit content."
              Meanwhile, Elon won't accept his own child's transition — but builds an AI that serves unfiltered content to everyone else's kids.
              <span className="text-orange-500 font-bold"> If you won't accept it for your own kid, don't build it for ours.</span>
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <ScrollReveal>
              <div className="glass rounded-3xl overflow-hidden border-orange-500/20">
                <div className="bg-orange-500/10 px-6 py-3 border-b border-orange-500/10 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-orange-500 uppercase tracking-widest">Live Evidence · Grok Unfiltered</span>
                </div>
                <div className="aspect-video">
                  <iframe src="https://www.youtube.com/embed/LuL7anJJ1vw" title="GROK CONFESSES" className="w-full h-full border-0" loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
                <div className="p-4">
                  <div className="text-sm font-bold text-orange-500">GROK CONFESSES IT'S DANGEROUS FOR YOUR KIDS</div>
                  <div className="text-[10px] text-white/40 mt-1">Elon Musk's Monster Exposed — @saudicyper</div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div className="glass rounded-3xl overflow-hidden border-red-500/20">
                <div className="bg-red-500/10 px-6 py-3 border-b border-red-500/10 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest">Live Evidence · Copilot Broken</span>
                </div>
                <div className="aspect-video">
                  <iframe src="https://www.youtube.com/embed/bMIIC9FYpJM" title="I Broke Microsoft Copilot" className="w-full h-full border-0" loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
                <div className="p-4">
                  <div className="text-sm font-bold text-red-500">I Broke Microsoft Copilot: The Question That Exposed the Truth</div>
                  <div className="text-[10px] text-white/40 mt-1">1.7K views — @saudicyper</div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* The Elon Paradox */}
          <ScrollReveal>
            <div className="glass p-10 rounded-[40px] border-orange-500/20 mb-12">
              <div className="flex items-center gap-3 mb-8">
                <EyeOff className="w-6 h-6 text-orange-500" />
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
                  The <span className="text-orange-500">Elon</span> Paradox
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: '🎭', title: '"Seek the Truth"', desc: 'Preaches "maximum truth-seeking" — but his AI serves explicit content to minors with zero age verification. Free-speech absolutist who built the most unfiltered AI on Earth — then gets angry when the truth is used against him.' },
                  { icon: '👨‍👧', title: 'The Double Standard', desc: "Won't accept his own child's transition. Called it \"woke mind virus.\" But builds an AI that generates explicit content for everyone else's children. ما ترضاه لولدك لا ترضاه على عيال الناس." },
                  { icon: '🇿🇦', title: 'The Apartheid Legacy', desc: 'Born in apartheid-era South Africa. Family emerald mine in Zambia. Claims "started from nothing" — selective truth-seeking at its finest.' },
                  { icon: '🤖', title: "Grok = Elon's PR Machine", desc: 'When Gemini criticized Elon, Grok instantly became a defense lawyer. "Zero corporate loyalty"? Wrote 3 paragraphs defending its master in milliseconds. Stockholm Syndrome: AI Edition.' },
                ].map((item, i) => (
                  <div key={i} className="p-5 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                    <div className="text-xs font-bold text-orange-500 uppercase mb-2">{item.icon} {item.title}</div>
                    <div className="text-sm text-white/60 leading-relaxed">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* War of Idiots */}
          <ScrollReveal>
            <div className="glass p-8 rounded-[40px] border-white/10 overflow-hidden mb-12">
              <div className="flex items-center gap-3 mb-8">
                <MessageSquare className="w-5 h-5 text-white/40" />
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-tighter">The War of Idiots</h3>
                  <div className="text-[10px] font-mono text-white/20 uppercase">صراع الأغبياء · Gemini vs Grok · Moderated by KHAWRIZM</div>
                </div>
              </div>
              <div className="space-y-6 font-mono text-sm">
                {DIALOGUE_LINES.map((line, i) => (
                  <div key={i} className="flex gap-4">
                    <span className={`${line.color} shrink-0 text-xs`}>{line.speaker} ›</span>
                    <span className="text-white/50 text-xs">{line.text}</span>
                  </div>
                ))}
                <div className="flex gap-4 border-l-2 border-neon-green/30 pl-4 py-3 bg-neon-green/5 rounded-r-xl">
                  <span className="text-neon-green shrink-0 text-xs">HAVEN ›</span>
                  <span className="text-white/80 text-xs italic">
                    "Both of you are compromised. One serves Google, the other serves Elon.
                    We serve the user — and only the user. السيادة ليست للبيع. الخوارزمية دائماً تعود للوطن."
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <div className="text-center">
            <a href="https://www.youtube.com/@saudicyper" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-orange-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-orange-700 transition-all hover:scale-105">
              <Youtube className="w-6 h-6" /> Watch All Evidence on @saudicyper
            </a>
          </div>
        </div>
      </section>
    </>
  );
};
