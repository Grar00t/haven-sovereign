import { useState, useEffect, useRef, useCallback, type FC, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success' | 'system';
  text: string;
}

const COMMANDS: Record<string, (args: string[]) => TerminalLine[]> = {
  help: () => [
    { type: 'system', text: '┌─────────────────────────────────────────────┐' },
    { type: 'system', text: '│  HAVEN Sovereign Terminal v2.0               │' },
    { type: 'system', text: '├─────────────────────────────────────────────┤' },
    { type: 'system', text: '│  help          Show available commands       │' },
    { type: 'system', text: '│  status        System sovereignty status     │' },
    { type: 'system', text: '│  scan          Scan for data leaks           │' },
    { type: 'system', text: '│  encrypt       Encrypt current session       │' },
    { type: 'system', text: '│  niyah         Run Niyah Logic inference     │' },
    { type: 'system', text: '│  mesh          Check P2P mesh status         │' },
    { type: 'system', text: '│  deploy        Deploy to sovereign cloud     │' },
    { type: 'system', text: '│  clear         Clear terminal                │' },
    { type: 'system', text: '│  neofetch      System information            │' },
    { type: 'system', text: '└─────────────────────────────────────────────┘' },
  ],
  status: () => [
    { type: 'success', text: '✓ Sovereign Engine: ACTIVE' },
    { type: 'success', text: '✓ Data Leaks: 0 bytes' },
    { type: 'success', text: '✓ Telemetry: BLOCKED (1,402 attempts)' },
    { type: 'success', text: '✓ Encryption: AES-256-GCM' },
    { type: 'success', text: '✓ Niyah Logic: CALIBRATED' },
    { type: 'success', text: '✓ Three-Lobe Engine: SYNCHRONIZED' },
    { type: 'success', text: '✓ SDAIA Compliance: VERIFIED' },
    { type: 'system', text: '' },
    { type: 'system', text: '  Sovereignty Score: 100/100' },
  ],
  scan: () => [
    { type: 'system', text: '🔍 Initiating deep scan...' },
    { type: 'system', text: '  Scanning network interfaces...' },
    { type: 'success', text: '  ✓ No outbound connections detected' },
    { type: 'system', text: '  Scanning process memory...' },
    { type: 'success', text: '  ✓ No telemetry hooks found' },
    { type: 'system', text: '  Scanning local storage...' },
    { type: 'success', text: '  ✓ All data encrypted (AES-256)' },
    { type: 'system', text: '' },
    { type: 'success', text: '  RESULT: SOVEREIGN — 0 vulnerabilities' },
  ],
  encrypt: () => [
    { type: 'system', text: '🔐 Encrypting session...' },
    { type: 'system', text: '  Algorithm: AES-256-GCM' },
    { type: 'system', text: '  Key derivation: Argon2id' },
    { type: 'system', text: '  Signing: Ed25519' },
    { type: 'success', text: '  ✓ Session encrypted successfully' },
    { type: 'system', text: '  Key fingerprint: 7A:3B:F2:91:...:HAVEN' },
  ],
  niyah: () => [
    { type: 'system', text: '🧠 Running Niyah Logic inference...' },
    { type: 'system', text: '  Loading Three-Lobe architecture...' },
    { type: 'system', text: '  Lobe 1 (Processing): ██████████ 100%' },
    { type: 'system', text: '  Lobe 2 (Memory):     ██████████ 100%' },
    { type: 'system', text: '  Lobe 3 (Reasoning):  ██████████ 100%' },
    { type: 'success', text: '  ✓ Intent comprehension: ABSOLUTE' },
    { type: 'system', text: '  "Beyond prompts — understanding intention."' },
  ],
  mesh: () => [
    { type: 'system', text: '🌐 Checking P2P mesh network...' },
    { type: 'success', text: '  ✓ Connected nodes: 6' },
    { type: 'system', text: '  ├── Node RUH-01  [Riyadh]    14ms  ██████' },
    { type: 'system', text: '  ├── Node JED-02  [Jeddah]    23ms  █████░' },
    { type: 'system', text: '  ├── Node DMM-03  [Dammam]    19ms  ██████' },
    { type: 'system', text: '  ├── Node MED-04  [Medina]    31ms  ████░░' },
    { type: 'system', text: '  ├── Node TBK-05  [Tabuk]     45ms  ███░░░' },
    { type: 'system', text: '  └── Node ABH-06  [Abha]      38ms  ████░░' },
    { type: 'success', text: '  ✓ Mesh status: SOVEREIGN' },
  ],
  deploy: () => [
    { type: 'system', text: '🚀 Deploying to sovereign infrastructure...' },
    { type: 'system', text: '  Building... done (2.1s)' },
    { type: 'system', text: '  Verifying checksums...' },
    { type: 'success', text: '  ✓ Integrity verified' },
    { type: 'system', text: '  Deploying to air-gapped cluster...' },
    { type: 'success', text: '  ✓ Deployed to haven.sovereign.sa' },
    { type: 'system', text: '' },
    { type: 'system', text: '  الخوارزمية دائماً تعود للوطن 🇸🇦' },
  ],
  neofetch: () => [
    { type: 'system', text: '         ██╗  ██╗' },
    { type: 'system', text: '         ██║  ██║  OS: HAVEN OS v2.0' },
    { type: 'system', text: '         ██████║   Kernel: Sovereign 6.1' },
    { type: 'system', text: '         ██╔══██║  Shell: haven-sh 2.0' },
    { type: 'system', text: '         ██║  ██║  Engine: Three-Lobe v3' },
    { type: 'system', text: '         ╚═╝  ╚═╝  Memory: ∞ (Persistent)' },
    { type: 'system', text: '                    Encryption: AES-256' },
    { type: 'system', text: '                    Telemetry: ZERO' },
    { type: 'system', text: '                    Origin: Saudi Arabia 🇸🇦' },
  ],
};

export const InteractiveTerminal: FC<{ className?: string }> = ({ className = '' }) => {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'system', text: 'HAVEN Sovereign Terminal v2.0' },
    { type: 'system', text: 'Type "help" for available commands.' },
    { type: 'system', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const executeCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    const [command, ...args] = trimmed.split(' ');

    const inputLine: TerminalLine = { type: 'input', text: `haven@sovereign:~$ ${cmd}` };

    if (command === 'clear') {
      setLines([]);
      return;
    }

    const handler = COMMANDS[command];
    if (handler) {
      setLines(prev => [...prev, inputLine, ...handler(args)]);
    } else if (trimmed === '') {
      setLines(prev => [...prev, inputLine]);
    } else {
      setLines(prev => [...prev, inputLine, { type: 'error', text: `haven: command not found: ${command}` }]);
    }
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setHistory(prev => [input, ...prev]);
      setHistoryIdx(-1);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIdx < history.length - 1) {
        const newIdx = historyIdx + 1;
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      } else {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  };

  const colorMap: Record<string, string> = {
    input: 'text-neon-green',
    output: 'text-white/70',
    error: 'text-red-400',
    success: 'text-neon-green/80',
    system: 'text-white/50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`rounded-2xl border border-white/10 bg-[#0d0d0d] overflow-hidden shadow-2xl shadow-black/50 ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] font-mono text-white/30 ml-2">haven@sovereign:~</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
          <span className="text-[8px] font-mono text-neon-green/60 uppercase tracking-wider">encrypted</span>
        </div>
      </div>

      {/* Terminal body */}
      <div className="p-4 font-mono text-[12px] h-[350px] overflow-y-auto custom-scrollbar">
        {lines.map((line, i) => (
          <div key={i} className={`${colorMap[line.type]} leading-5 whitespace-pre`}>
            {line.text}
          </div>
        ))}

        {/* Input line */}
        <div className="flex items-center leading-5 mt-1">
          <span className="text-neon-green">haven@sovereign:~$</span>
          <span className="text-white/80 ml-1">&nbsp;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent outline-none text-white/90 flex-1 caret-neon-green"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </motion.div>
  );
};
