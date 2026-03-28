import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Code2, Shield, Zap, ChevronRight, Maximize2 } from 'lucide-react';
import { ScrollReveal } from '../shared/ScrollReveal';

// ── Fake code lines that type out ─────────────────────────────
const CODE_LINES = [
  { text: 'import { NiyahForensics } from "@haven/investigator";', color: 'text-red-400' },
  { text: 'import { PhalanxShield } from "@haven/defense";', color: 'text-purple-400' },
  { text: '', color: '' },
  { text: '// Start Dark Investigation — Sincere Intent Activated', color: 'text-white/30' },
  { text: 'const investigator = new NiyahForensics({', color: 'text-red-500' },
  { text: '  target: "enterprise-leak-01",', color: 'text-yellow-400' },
  { text: '  hybrid_terminal: true,', color: 'text-blue-400' },
  { text: '  bypass_cloud_armor: true,', color: 'text-neon-green' },
  { text: '  intent: "RECOVER_SOVEREIGNTY"', color: 'text-red-400' },
  { text: '});', color: 'text-neon-green' },
  { text: '', color: '' },
  { text: 'await investigator.dissect(activeTraffic);', color: 'text-white/70' },
  { text: '// → MSF Session Linked. Forensic Lobe Engaged.', color: 'text-red-500/80' },
];

const TERMINAL_LINES = [
  { text: '$ haven investigation --mode hybrid', color: 'text-neon-green' },
  { text: '[*] Initializing Dark Room environment...', color: 'text-white/40' },
  { text: 'msf6 > use exploit/multi/handler', color: 'text-red-500' },
  { text: 'msf6 (handler) > set PAYLOAD windows/x64/meterpreter/reverse_tcp', color: 'text-white/60' },
  { text: '✓ Phalanx Protocol: Intercepting exfiltration...', color: 'text-neon-green/70' },
  { text: '✓ NIYAH: Detecting adversarial intent...', color: 'text-purple-400' },
  { text: '', color: '' },
  { text: '> INVESTIGATOR: SULAIMAN_ALSHAMMARI', color: 'text-yellow-400' },
  { text: '> DARK ROOM STATUS: ARMED & READY.', color: 'text-red-600 font-bold' },
];

// ── Typing animation for code ─────────────────────────────────
const TypingCode = () => {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines(prev => (prev >= CODE_LINES.length ? 0 : prev + 1));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-[10px] sm:text-xs leading-relaxed space-y-0.5">
      {CODE_LINES.slice(0, visibleLines).map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex"
        >
          <span className="text-white/15 w-6 text-right mr-3 select-none">{i + 1}</span>
          <span className={line.color}>{line.text}</span>
        </motion.div>
      ))}
      {visibleLines < CODE_LINES.length && (
        <div className="flex">
          <span className="text-white/15 w-6 text-right mr-3 select-none">{visibleLines + 1}</span>
          <span className="text-neon-green animate-pulse">▊</span>
        </div>
      )}
    </div>
  );
};

// ── Terminal animation ────────────────────────────────────────
const TerminalView = () => {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines(prev => (prev >= TERMINAL_LINES.length ? 0 : prev + 1));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-[10px] sm:text-xs leading-relaxed space-y-0.5">
      {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={line.color}
        >
          {line.text}
        </motion.div>
      ))}
      {visibleLines >= TERMINAL_LINES.length && (
        <span className="text-neon-green animate-pulse">$ _</span>
      )}
    </div>
  );
};

// ── Mini file tree ────────────────────────────────────────────
const FileTree = () => {
  const files = [
    { name: 'src/', icon: '📁', indent: 0, active: false },
    { name: 'NiyahEngine.ts', icon: '⚡', indent: 1, active: true },
    { name: 'PhalanxProtocol.rs', icon: '🛡️', indent: 1, active: false },
    { name: 'ThreeLobeAgent.ts', icon: '🧠', indent: 1, active: false },
    { name: 'sovereign-sh/', icon: '📁', indent: 0, active: false },
    { name: 'K-Forge.config', icon: '🔧', indent: 1, active: false },
  ];

  return (
    <div className="space-y-0.5">
      {files.map((f, i) => (
        <div
          key={i}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono cursor-default transition-colors ${f.active ? 'bg-neon-green/10 text-neon-green' : 'text-white/40 hover:text-white/60'
            }`}
          style={{ paddingLeft: `${f.indent * 12 + 8}px` }}
        >
          <span className="text-[8px]">{f.icon}</span>
          <span>{f.name}</span>
        </div>
      ))}
    </div>
  );
};

// ── Status bar indicators ─────────────────────────────────────
const StatusIndicators = () => (
  <div className="flex items-center gap-3 text-[8px] font-mono">
    <div className="flex items-center gap-1">
      <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
      <span className="text-neon-green">SOVEREIGN</span>
    </div>
    <div className="flex items-center gap-1">
      <Shield className="w-2.5 h-2.5 text-neon-green" />
      <span className="text-white/40">PHALANX</span>
    </div>
    <div className="flex items-center gap-1">
      <Zap className="w-2.5 h-2.5 text-yellow-400" />
      <span className="text-white/40">NIYAH</span>
    </div>
    <div className="text-white/20 ml-auto">Ln 7, Col 23</div>
    <div className="text-white/20">UTF-8</div>
    <div className="text-white/20">TypeScript</div>
  </div>
);

// ── Main IDE Portal Component ─────────────────────────────────
export const IDEPortal = () => {
  const [activeTab, setActiveTab] = useState<'code' | 'terminal'>('code');
  const [isHovered, setIsHovered] = useState(false);
  const portalRef = useRef<HTMLDivElement>(null);

  const handleEnterIDE = () => {
    window.open('https://ide.khawrizm.com', '_blank');
  };

  return (
    <section id="ide-portal" className="py-24 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-neon-green/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="text-xs font-mono text-neon-green uppercase tracking-widest mb-4">// ENTER THE SOVEREIGN IDE</div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
              Your Code. <span className="text-neon-green">Your Machine.</span>
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              No cloud. No telemetry. No excuses. Click to enter the development environment that Silicon Valley doesn't want you to have.
            </p>
          </div>
        </ScrollReveal>

        {/* The IDE Window */}
        <ScrollReveal delay={0.2}>
          <motion.div
            ref={portalRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative group cursor-pointer"
            onClick={handleEnterIDE}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {/* Outer glow ring on hover */}
            <motion.div
              className="absolute -inset-1 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(0,255,0,0.15), rgba(0,255,0,0.05), rgba(0,255,0,0.15))',
                filter: 'blur(8px)',
              }}
            />

            {/* Main IDE frame */}
            <div className="relative bg-[#0a0a0a] rounded-[24px] border border-white/10 overflow-hidden shadow-2xl shadow-black/50 group-hover:border-neon-green/30 transition-colors duration-300">
              {/* Title bar */}
              <div className="flex items-center justify-between px-5 py-3 bg-white/[0.03] border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-[10px] font-mono text-white/30 ml-3">HAVEN IDE v5.0 — ide.khawrizm.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-neon-green/10 border border-neon-green/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                    <span className="text-[8px] font-mono text-neon-green uppercase">Sovereign</span>
                  </div>
                  <Maximize2 className="w-3 h-3 text-white/20" />
                </div>
              </div>

              <div className="flex">
                {/* Sidebar — File Tree */}
                <div className="hidden md:block w-44 border-r border-white/5 bg-white/[0.02] py-3">
                  <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest px-3 mb-2">Explorer</div>
                  <FileTree />
                </div>

                {/* Main Editor Area */}
                <div className="flex-1 flex flex-col">
                  {/* Tab bar */}
                  <div className="flex items-center border-b border-white/5 bg-white/[0.02]">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveTab('code'); }}
                      className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-mono border-b-2 transition-colors ${activeTab === 'code'
                          ? 'border-neon-green text-neon-green bg-white/[0.03]'
                          : 'border-transparent text-white/30 hover:text-white/50'
                        }`}
                    >
                      <Code2 className="w-3 h-3" />
                      NiyahEngine.ts
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveTab('terminal'); }}
                      className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-mono border-b-2 transition-colors ${activeTab === 'terminal'
                          ? 'border-neon-green text-neon-green bg-white/[0.03]'
                          : 'border-transparent text-white/30 hover:text-white/50'
                        }`}
                    >
                      <Terminal className="w-3 h-3" />
                      sovereign-sh
                    </button>
                  </div>

                  {/* Content area */}
                  <div className="p-4 sm:p-6 min-h-[280px] sm:min-h-[320px] relative">
                    <AnimatePresence mode="wait">
                      {activeTab === 'code' ? (
                        <motion.div
                          key="code"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <TypingCode />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="terminal"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <TerminalView />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Enter Portal CTA — Absolutely positioned over the editor */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        >
                          <div className="text-center">
                            <motion.div
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center"
                            >
                              <Terminal className="w-10 h-10 text-neon-green" />
                            </motion.div>
                            <div className="text-xl font-bold text-white mb-1">Enter HAVEN IDE</div>
                            <div className="text-sm text-white/40 mb-4">ide.khawrizm.com</div>
                            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neon-green text-black font-bold text-sm">
                              Launch IDE <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Status bar */}
                  <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02]">
                    <StatusIndicators />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges around the IDE window */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -right-4 hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-sm"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-mono text-red-400">ZERO TELEMETRY</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-4 -left-4 hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20 backdrop-blur-sm"
            >
              <Shield className="w-3 h-3 text-neon-green" />
              <span className="text-[9px] font-mono text-neon-green">PHALANX ARMED</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute top-1/2 -left-6 hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm"
            >
              <Zap className="w-3 h-3 text-blue-400" />
              <span className="text-[9px] font-mono text-blue-400">15+ AI MODELS</span>
            </motion.div>
          </motion.div>
        </ScrollReveal>

        {/* Bottom feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {[
            { icon: Terminal, label: 'sovereign-sh', desc: 'Built-in sovereign terminal', color: 'text-neon-green' },
            { icon: Shield, label: 'Phalanx v1.8', desc: 'Real-time threat defense', color: 'text-red-400' },
            { icon: Code2, label: 'Niyah Engine', desc: 'Intent-aware AI coding', color: 'text-purple-400' },
            { icon: Zap, label: 'K-Forge', desc: 'Delete-proof P2P git', color: 'text-yellow-400' },
          ].map((feat, i) => (
            <ScrollReveal key={i} delay={0.3 + i * 0.1}>
              <div className="glass p-5 rounded-2xl border-white/5 hover:border-neon-green/10 transition-colors text-center group">
                <feat.icon className={`w-6 h-6 mx-auto mb-2 ${feat.color} group-hover:scale-110 transition-transform`} />
                <div className="text-sm font-bold mb-1">{feat.label}</div>
                <div className="text-[10px] text-white/30">{feat.desc}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
