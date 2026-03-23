import type { StateCreator } from 'zustand';
import type { FileNode, Tab, TerminalLine, TerminalInstance } from '../types';
import { HAVEN_THEMES } from '../types';
import type { IDEState } from './types';
import { HAVEN_ASCII } from './constants';
import { collectGitChanges } from './helpers';
import { niyahEngine } from '../engine/NiyahEngine';

// ── Terminal command handlers ─────────────────────────────────────
const TERMINAL_COMMANDS: Record<string, (args: string[], state: IDEState) => string> = {
  help: () => `┌──────────────────────────────────────────────────────┐
│  HAVEN IDE v5.0 — Sovereign Terminal                  │
├──────────────────────────────────────────────────────┤
│  ─── General ──────────────────────────────────────   │
│  help              Show this help                     │
│  clear / cls       Clear terminal                     │
│  echo <text>       Print text                         │
│  ls / cat <file>   List files / show contents          │
│  cd / pwd          Change dir / print cwd              │
│  whoami / date     User identity / current date        │
│  touch / mkdir     Create file / folder                │
│  rm <name>         Remove file                         │
│  open <file>       Open file in editor                 │
│  save              Save active file                    │
│  zen               Toggle Zen Mode                     │
│  neofetch / ascii  System info / ASCII art             │
│  ─── Git ──────────────────────────────────────────   │
│  git status / log / add / commit -m "msg"              │
│  ─── Dev Tools ────────────────────────────────────   │
│  npm <cmd>  node -v  ping <host>  curl <url>  uptime   │
│  ─── Sovereign Commands ───────────────────────────   │
│  niyah [intent]    Niyah Logic inference                │
│    --deep --visualize --lobe <exec|sensory|cognitive>   │
│  scan [--deep]     Sovereign security scan              │
│  dragon403         System Revenant status               │
│  expose <target>   AI Exposé (grok/claude/gemini/gpt)   │
│  tweet <topic>     Generate sovereign tweet content     │
│  sovereign <cmd>   login / kit / scan                   │
│  phalanx [scope]   Phalanx threat intelligence          │
│  haven deploy/status  Sovereign infrastructure          │
│  ai analyze/query  AI code analysis & query             │
│  bluvalt status    BluValt cluster health               │
│  theme <name>      Switch theme                         │
│  matrix            Enter the Matrix                     │
└──────────────────────────────────────────────────────┘`,

  echo: (args) => args.join(' ') || '',
  pwd: (_args, state) => state.terminals.find(t => t.id === state.activeTerminalId)?.cwd || '/haven-project',
  whoami: () => 'أبو خوارزم — The Sovereign Architect',
  date: () => new Date().toLocaleString('en-SA', { dateStyle: 'full', timeStyle: 'medium' }),

  neofetch: (_args, state) => `
  ╔══════════════════════════════════════╗
  ║  HAVEN IDE v5.0 — Sovereign Edition ║
  ╠══════════════════════════════════════╣
  ║  OS: HavenOS 403                    ║
  ║  Shell: sovereign-sh 5.0            ║
  ║  Theme: ${state.themeName.padEnd(28)}║
  ║  Engine: Monaco + React 19          ║
  ║  Tabs: ${String(state.openTabs.length).padEnd(30)}║
  ║  RAM: ∞ (sovereign memory)          ║
  ║  CPU: Quantum Sovereign Core        ║
  ╚══════════════════════════════════════╝`,

  matrix: () => `
  ░▒▓█ ENTERING THE MATRIX █▓▒░
  01001000 01000001 01010110 01000101 01001110
  HAVEN DECODED: "You are now sovereign."
  Welcome to the green pill, أبو خوارزم.`,

  ascii: () => HAVEN_ASCII,
  uptime: () => `up ${Math.floor(Math.random() * 1000) + 100} hours, 42 minutes`,

  ping: (args) => {
    const host = args[0] || 'haven.sovereign';
    return `PING ${host}: 64 bytes icmp_seq=0 time=0.042 ms\n64 bytes icmp_seq=1 time=0.038 ms\n--- ${host} ping statistics ---\n3 packets, 0% loss, avg 0.040 ms`;
  },

  curl: (args) => {
    const url = args[0] || 'https://haven.dev';
    return `HTTP/1.1 200 OK\nContent-Type: text/html\n\n<h1>Welcome to ${url}</h1>\n<p>Status: SOVEREIGN 🟢</p>`;
  },

  npm: (args) => {
    const cmd = args[0];
    if (cmd === 'run' && args[1] === 'dev') return `\n  VITE v6.4.1  ready in 234 ms\n\n  ➜  Local:   http://localhost:5173/`;
    if (cmd === 'run' && args[1] === 'build') return '✓ built in 3.21s\ndist/index.js    465.89 kB';
    if (cmd === 'install' || cmd === 'i') return `added ${Math.floor(Math.random() * 200) + 50} packages in ${(Math.random() * 5 + 1).toFixed(1)}s`;
    return `npm ${args.join(' ')}`;
  },

  node: (args) => {
    if (args[0] === '-v' || args[0] === '--version') return 'v22.11.0';
    return 'Welcome to Node.js v22.11.0.';
  },

  haven: (args) => {
    const sub = args[0];
    if (sub === 'deploy') {
      const target = args[1] || 'production';
      return `⚡ HAVEN DEPLOY — Sovereign Deployment Engine
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Target:     ${target}
Region:     SA-CENTRAL-1 (Sovereign Zone)
Nodes:      3 replicas across BluValt cluster
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/4] Building sovereign image...        ✅
[2/4] Pushing to sovereign registry...   ✅
[3/4] Rolling update (0 downtime)...     ✅
[4/4] Health check passed...             ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 Deployed to ${target} in 4.2s
   URL: https://${target}.haven.sovereign`;
    }
    if (sub === 'status') {
      return `⚡ HAVEN Infrastructure — Status Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service          Status    Latency   Uptime
───────────────  ────────  ────────  ──────
API Gateway      🟢 UP     12ms     99.99%
Auth Service     🟢 UP      8ms     99.99%
Sovereign LLM    🟢 UP     45ms     99.97%
BluValt Storage  🟢 UP      3ms    100.00%
Phalanx Radar    🟢 UP     15ms     99.98%
Edge CDN         🟢 UP      2ms    100.00%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall: SOVEREIGN 🟢  |  Region: SA-CENTRAL-1`;
    }
    return `HAVEN — The Sovereign Algorithm v5.0.0
Built by: Sulaiman Alshammari (@saudicyper)
"We don't optimize. We liberate."
Usage: haven <deploy|status>`;
  },

  ai: (args) => {
    const sub = args[0];
    if (sub === 'analyze') {
      const file = args[1] || 'current workspace';
      return `🧠 HAVEN AI — Code Analysis Engine
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Target: ${file}
Model:  Llama 405B (Sovereign Instance)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SCAN]  Analyzing code patterns...       ✅
[PERF]  Performance audit...             ✅
[SEC]   Security vulnerability check... ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Results:
  ✅ No critical vulnerabilities found
  ⚡ 2 performance suggestions available
  📦 3 unused imports detected
  🎯 Code quality score: 94/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Run "ai query" for AI-assisted refactoring.`;
    }
    if (sub === 'query') {
      const prompt = args.slice(1).join(' ').replace(/"/g, '') || 'explain this code';
      return `🧠 HAVEN AI — Sovereign LLM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Model:    Llama 405B (Self-hosted)
VRAM:     78.2 GB / 80 GB
Prompt:   "${prompt}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generating response... (${(Math.random() * 2 + 0.5).toFixed(1)}s)

The sovereign architecture employs event-driven
micro-services with zero-trust networking. Each
node operates independently with local inference.

Tokens: ${Math.floor(Math.random() * 500) + 200} | Latency: ${Math.floor(Math.random() * 100) + 30}ms`;
    }
    return 'Usage: ai <analyze [file]|query "prompt">';
  },

  phalanx: (args) => {
    const scope = args[1] || 'full';
    return `🛡️ PHALANX RADAR — Threat Intelligence
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scan scope: ${scope}
Engine:     Phalanx v3.1 (Sovereign)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/5] Perimeter scan...                  ✅
[2/5] Dependency audit...                ✅
[3/5] Secret detection...                ✅
[4/5] Code injection vectors...          ✅
[5/5] Supply chain analysis...           ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Threats: 0 critical | 1 low (unused port 8080)
Status: FORTRESS 🏰  |  Score: 98/100`;
  },

  bluvalt: (args) => {
    const sub = args[0] || 'status';
    if (sub === 'status') {
      return `💎 BLUVALT — Sovereign Storage Cluster
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cluster:    SA-CENTRAL-1 (3 nodes)
Health:     🟢 ALL NODES HEALTHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Node        CPU     RAM      Disk     GPU
──────────  ──────  ───────  ───────  ──────
BV-Node-1   ${Math.floor(Math.random() * 30 + 10)}%    ${Math.floor(Math.random() * 20 + 40)}%     23%     72%
BV-Node-2   ${Math.floor(Math.random() * 30 + 10)}%    ${Math.floor(Math.random() * 20 + 40)}%     31%     68%
BV-Node-3   ${Math.floor(Math.random() * 30 + 10)}%    ${Math.floor(Math.random() * 20 + 40)}%     19%     75%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Storage: 2.4 TB / 8 TB  |  IOPS: 142K
Llama 405B: LOADED on 3x A100 (80GB each)`;
    }
    return 'Usage: bluvalt status';
  },

  niyah: (args, state) => {
    const inputStr = args.join(' ') || 'sovereign intent analysis';
    const activeTab = state.openTabs.find((t: Tab) => t.id === state.activeTabId);
    const session = niyahEngine.process(inputStr, {
      activeFile: activeTab?.name,
      language: activeTab?.language,
    });
    // Dynamic import to avoid circular — the store reference is passed via state
    (state as IDEState).updateNiyahVector(session);
    return niyahEngine.getTerminalOutput(session);
  },

  scan: (args) => {
    const deep = args.includes('--deep') || args.includes('-d');
    return `🔍 Initiating sovereign security scan...
${deep ? 'Deep scan mode enabled — checking all open files\n' : 'Quick scan mode\n'}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/6] Outbound connection check...         ✅ No leaks
[2/6] Telemetry hooks scan...              ✅ None found
[3/6] Encryption verification...           ✅ AES-256-GCM
[4/6] Dependency audit...                  ✅ Clean
[5/6] Secret detection...                  ✅ No exposed keys
[6/6] Supply chain analysis...             ✅ Verified
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESULT: SOVEREIGN — 0 vulnerabilities
Digital sovereignty score: 100/100`;
  },

  dragon403: () => `🐉 Dragon403 Protocol — System Revenant
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status:          ACTIVE & MONITORING
Network Watch:   ACEVILLE / TENCENT / OPENAI
Evidence Locker: 13MB SECURED (AES-256)
Last Scan:       ${new Date().toLocaleTimeString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"The algorithm always returns home."
الخوارزمية دائماً تعود للوطن 🇸🇦`,

  expose: (args, state) => {
    const target = args[0]?.toLowerCase() || 'grok';
    const inputStr = `افضح ${target} واكتب توويت يضرب في الصميم`;
    const activeTab = state.openTabs.find((t: Tab) => t.id === state.activeTabId);
    const session = niyahEngine.process(inputStr, {
      activeFile: activeTab?.name,
      language: activeTab?.language,
    });
    return `📡 HAVEN AI Exposé — Intelligence Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Target:   ${target.toUpperCase()}
Date:     ${new Date().toLocaleDateString()}
Dialect:  ${session.vector.dialect} | Tone: ${session.vector.tone}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${session.response}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"السيادة مو للبيع."
Usage: expose <grok|claude|gemini|gpt>`;
  },

  tweet: (args, state) => {
    const topic = args.join(' ') || 'سيادة رقمية';
    const inputStr = `اكتبلي توويت قوي عن ${topic} يضرب في الصميم`;
    const activeTab = state.openTabs.find((t: Tab) => t.id === state.activeTabId);
    const session = niyahEngine.process(inputStr, {
      activeFile: activeTab?.name,
      language: activeTab?.language,
    });
    return `📝 HAVEN Content Generator — Tweet
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Topic:    ${topic}
Dialect:  ${session.vector.dialect} | Tone: ${session.vector.tone}
Domain:   ${session.vector.domain}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${session.response}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Usage: tweet <topic>`;
  },

  sovereign: (args, state) => {
    const sub = args[0]?.toLowerCase();
    if (sub === 'login' || sub === 'auth' || sub === 'لوجن') {
      const inputStr = 'أبي لوجن sovereign محلي بدون خدمات خارجية مشفر';
      const activeTab = state.openTabs.find((t: Tab) => t.id === state.activeTabId);
      const session = niyahEngine.process(inputStr, {
        activeFile: activeTab?.name,
        language: activeTab?.language || 'typescript',
      });
      return `🔐 HAVEN Sovereign Code — Login Generator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Intent:   Sovereign local authentication
Dialect:  ${session.vector.dialect} | Domain: ${session.vector.domain}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${session.response}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Usage: sovereign <login|kit|scan>`;
    }
    if (sub === 'kit' || sub === 'product' || sub === 'منتج') {
      const inputStr = 'اكتبلي وصف تسويقي لمنتج Sovereign Kit للجهات الحكومية والشركات';
      const activeTab = state.openTabs.find((t: Tab) => t.id === state.activeTabId);
      const session = niyahEngine.process(inputStr, {
        activeFile: activeTab?.name,
        language: activeTab?.language,
      });
      return `📦 HAVEN Sovereign Kit — Product Description
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Domain:   ${session.vector.domain} | Tone: ${session.vector.tone}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${session.response}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Usage: sovereign <login|kit|scan>`;
    }
    return `🛡️ HAVEN Sovereign Commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sovereign login    Generate sovereign auth code
  sovereign kit      Sovereign Kit product description
  sovereign scan     Security scan (alias for 'scan --deep')
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"السيادة الرقمية مو خيار — هي واجب."`;
  },
};

export interface TerminalSlice {
  terminalVisible: boolean;
  terminals: TerminalInstance[];
  activeTerminalId: string;
  toggleTerminal: () => void;
  addTerminalLine: (line: TerminalLine) => void;
  executeCommand: (command: string) => void;
  createTerminal: (name?: string) => void;
  closeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;
  terminalHeight: number;
  setTerminalHeight: (h: number) => void;
}

export const createTerminalSlice: StateCreator<IDEState, [], [], TerminalSlice> = (set, get) => ({
  terminalVisible: true,
  terminals: [{
    id: 'terminal-1', name: 'sovereign-sh', cwd: '/haven-project',
    lines: [
      { text: HAVEN_ASCII, type: 'system', timestamp: Date.now() },
      { text: '⚡ HAVEN IDE v5.0 — Sovereign Development Environment', type: 'system', timestamp: Date.now() },
      { text: '   Type "help" for available commands.', type: 'system', timestamp: Date.now() },
    ],
  }],
  activeTerminalId: 'terminal-1',
  terminalHeight: 220,
  setTerminalHeight: (h) => set({ terminalHeight: Math.max(80, Math.min(500, h)) }),
  toggleTerminal: () => set((state) => ({ terminalVisible: !state.terminalVisible })),
  addTerminalLine: (line) =>
    set((state) => ({
      terminals: state.terminals.map((t) =>
        t.id === state.activeTerminalId ? { ...t, lines: [...t.lines, line] } : t
      ),
    })),
  createTerminal: (name) =>
    set((state) => {
      const id = `terminal-${Date.now()}`;
      return {
        terminals: [...state.terminals, { id, name: name || `sh-${state.terminals.length + 1}`, cwd: '/haven-project', lines: [{ text: '⚡ New session', type: 'system' as const, timestamp: Date.now() }] }],
        activeTerminalId: id, terminalVisible: true,
      };
    }),
  closeTerminal: (id) =>
    set((state) => {
      const n = state.terminals.filter((t) => t.id !== id);
      if (n.length === 0) return { terminalVisible: false };
      return { terminals: n, activeTerminalId: state.activeTerminalId === id ? n[n.length - 1].id : state.activeTerminalId };
    }),
  setActiveTerminal: (id) => set({ activeTerminalId: id }),
  executeCommand: (command) => {
    const state = get();
    const trimmed = command.trim();
    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    state.addTerminalLine({ text: `$ ${trimmed}`, type: 'input', timestamp: Date.now() });

    if (cmd === 'clear' || cmd === 'cls') {
      set((s) => ({ terminals: s.terminals.map((t) => t.id === s.activeTerminalId ? { ...t, lines: [] } : t) }));
      return;
    }
    if (cmd === 'exit') { state.closeTerminal(state.activeTerminalId); return; }

    if (cmd === 'ls') {
      const files = state.files[0]?.children?.map((f) => f.type === 'folder' ? `  ${f.name}/` : `  ${f.name}`) || [];
      state.addTerminalLine({ text: files.join('\n'), type: 'output', timestamp: Date.now() });
      return;
    }

    if (cmd === 'cat') {
      const fileName = args[0];
      if (!fileName) { state.addTerminalLine({ text: 'Usage: cat <filename>', type: 'error', timestamp: Date.now() }); return; }
      function searchFile(nodes: FileNode[]): string | null {
        for (const node of nodes) {
          if (node.type === 'file' && node.name === fileName) return node.content || '(empty)';
          if (node.children) { const found = searchFile(node.children); if (found) return found; }
        }
        return null;
      }
      const content = searchFile(state.files);
      state.addTerminalLine({ text: content || `cat: ${fileName}: No such file`, type: content ? 'output' : 'error', timestamp: Date.now() });
      return;
    }

    if (cmd === 'touch') {
      const name = args[0];
      if (!name) { state.addTerminalLine({ text: 'Usage: touch <filename>', type: 'error', timestamp: Date.now() }); return; }
      state.createFile('src', name);
      state.addTerminalLine({ text: `Created: ${name}`, type: 'output', timestamp: Date.now() });
      state.addNotification({ type: 'success', message: `File created: ${name}` });
      return;
    }

    if (cmd === 'mkdir') {
      const name = args[0];
      if (!name) { state.addTerminalLine({ text: 'Usage: mkdir <dirname>', type: 'error', timestamp: Date.now() }); return; }
      state.createFolder('src', name);
      state.addTerminalLine({ text: `Created directory: ${name}/`, type: 'output', timestamp: Date.now() });
      return;
    }

    if (cmd === 'rm') {
      const name = args[0];
      if (!name) { state.addTerminalLine({ text: 'Usage: rm <filename>', type: 'error', timestamp: Date.now() }); return; }
      function findFile(nodes: FileNode[]): string | null {
        for (const node of nodes) {
          if (node.name === name) return node.id;
          if (node.children) { const found = findFile(node.children); if (found) return found; }
        }
        return null;
      }
      const fileId = findFile(state.files);
      if (fileId) { state.deleteFile(fileId); state.addTerminalLine({ text: `Removed: ${name}`, type: 'output', timestamp: Date.now() }); }
      else { state.addTerminalLine({ text: `rm: ${name}: No such file`, type: 'error', timestamp: Date.now() }); }
      return;
    }

    if (cmd === 'git') {
      if (args[0] === 'status') {
        const changes = collectGitChanges(state.files);
        if (changes.length === 0) { state.addTerminalLine({ text: 'On branch main\nnothing to commit, working tree clean', type: 'output', timestamp: Date.now() }); }
        else {
          const lines = ['On branch main', 'Changes:', ...changes.map(c => {
            const s = c.node.gitStatus === 'modified' ? 'M' : c.node.gitStatus === 'added' ? 'A' : c.node.gitStatus === 'deleted' ? 'D' : '?';
            return `  ${s}  ${c.path}`;
          })];
          state.addTerminalLine({ text: lines.join('\n'), type: 'output', timestamp: Date.now() });
        }
        return;
      }
      if (args[0] === 'log') {
        state.addTerminalLine({ text: `commit a1b2c3d (HEAD -> main)\nAuthor: أبو خوارزم <sovereign@haven.dev>\nDate:   ${new Date().toLocaleDateString()}\n\n    feat: initialize sovereign algorithm`, type: 'output', timestamp: Date.now() });
        return;
      }
      if (args[0] === 'add') { state.addTerminalLine({ text: 'All changes staged.', type: 'output', timestamp: Date.now() }); return; }
      if (args[0] === 'commit') {
        const msg = args.slice(args.indexOf('-m') + 1).join(' ').replace(/"/g, '') || 'sovereign commit';
        state.addTerminalLine({ text: `[main ${Math.random().toString(36).slice(2, 8)}] ${msg}\n 3 files changed, 42 insertions(+)`, type: 'output', timestamp: Date.now() });
        return;
      }
      state.addTerminalLine({ text: `git: '${args.join(' ')}' is not a git command`, type: 'error', timestamp: Date.now() });
      return;
    }

    if (cmd === 'sovereign') {
      const newTheme = state.themeName === 'sovereign-gold' ? 'haven-dark' : 'sovereign-gold';
      state.setTheme(newTheme);
      state.addTerminalLine({ text: `⚡ Sovereign mode ${newTheme === 'sovereign-gold' ? 'ACTIVATED' : 'DEACTIVATED'}`, type: 'system', timestamp: Date.now() });
      return;
    }

    if (cmd === 'theme') {
      const themeName = args[0];
      if (themeName && HAVEN_THEMES[themeName]) {
        state.setTheme(themeName);
        state.addTerminalLine({ text: `Theme: ${themeName}`, type: 'system', timestamp: Date.now() });
      } else {
        state.addTerminalLine({ text: `Themes: ${Object.keys(HAVEN_THEMES).join(', ')}`, type: 'output', timestamp: Date.now() });
      }
      return;
    }

    if (cmd === 'cd') {
      set((s) => ({
        terminals: s.terminals.map((t) =>
          t.id === s.activeTerminalId ? { ...t, cwd: args[0] || '/haven-project' } : t
        ),
      }));
      return;
    }

    if (cmd === 'zen') {
      state.toggleZenMode();
      state.addTerminalLine({ text: `Zen Mode ${get().zenMode ? 'ACTIVATED — focus absolute' : 'DEACTIVATED'}`, type: 'system', timestamp: Date.now() });
      return;
    }

    if (cmd === 'open') {
      const fileName = args[0];
      if (!fileName) { state.addTerminalLine({ text: 'Usage: open <filename>', type: 'error', timestamp: Date.now() }); return; }
      function searchNode(nodes: FileNode[], path: string): { node: FileNode; path: string } | null {
        for (const n of nodes) {
          const p = path ? `${path}/${n.name}` : n.name;
          if (n.type === 'file' && n.name === fileName) return { node: n, path: p };
          if (n.children) { const f = searchNode(n.children, p); if (f) return f; }
        }
        return null;
      }
      const found = searchNode(state.files, '');
      if (found) { state.openFile(found.node, found.path); state.addTerminalLine({ text: `Opened: ${found.path}`, type: 'success', timestamp: Date.now() }); }
      else { state.addTerminalLine({ text: `open: ${fileName}: No such file`, type: 'error', timestamp: Date.now() }); }
      return;
    }

    if (cmd === 'save') {
      const activeTab = state.openTabs.find(t => t.id === state.activeTabId);
      if (!activeTab) { state.addTerminalLine({ text: 'No active file to save', type: 'error', timestamp: Date.now() }); return; }
      state.saveFile(activeTab.id);
      state.addTerminalLine({ text: `Saved: ${activeTab.name}`, type: 'success', timestamp: Date.now() });
      return;
    }

    const handler = TERMINAL_COMMANDS[cmd];
    if (handler) {
      state.addTerminalLine({ text: handler(args, get()), type: 'output', timestamp: Date.now() });
    } else {
      state.addTerminalLine({ text: `Command not found: ${cmd}. Type "help".`, type: 'error', timestamp: Date.now() });
    }
  },
});
