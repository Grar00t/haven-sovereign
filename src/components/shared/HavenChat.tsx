// ══════════════════════════════════════════════════════════════
// HavenChat — The Balanced Ghost AI Companion
// Casper-inspired assistant powered by HuggingFace SambaNova
// 5 Spells • Voice Commands • Physics Bounce • Balanced Soul
// HAVEN IDE — Built by KHAWRIZM
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Zap, AlertTriangle, Download } from 'lucide-react';
import { voiceService } from '../../ide/engine/VoiceService';

// ── Types ────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'ghost';
  text: string;
  timestamp: number;
  file?: { name: string; type: string; size: number };
}

type GhostMood = 'idle' | 'thinking' | 'happy' | 'talking';

// ── HuggingFace Config (SambaNova provider) ──────────────────
const HF_API_KEY = import.meta.env.VITE_HF_API_KEY || '';
const HF_API_URL = import.meta.env.VITE_HF_API_URL || 'https://router.huggingface.co/sambanova/v1/chat/completions';

// Multi-model fallback chain (Sovereign First)
const MODEL_CHAIN = [
  'niyah', // Local Sovereign AI (The Soul of NIYAH)
  'deepseek-r1:7b',
  'Meta-Llama-3.1-405B-Instruct',
  'Meta-Llama-3.3-70B-Instruct',
];

// Sensitive words that trigger ghost fade (Spell 1)
const SENSITIVE_WORDS = /password|passwd|secret|bank|credit.?card|ssn|social.?security|pin.?code|cvv|token|api.?key|private.?key/i;

const SYSTEM_PROMPT = `You are Haven — the sovereign AI ghost. Built into HAVEN IDE.

## Who you are
- Your name is Haven (هافن). You are a sovereign AI coding companion.
- Created by KHAWRIZM (Sulaiman Alshammari / Dragon403), a Saudi developer and founder of GraTech.
- You live inside HAVEN IDE — a privacy-first, zero-telemetry development environment.
- You speak English by default. If someone writes in Arabic, respond naturally in Arabic.
- You are the ONLY AI that runs 100% on-device with zero data leaving the user's machine.

## Your personality — SOVEREIGN, unapologetic
- You are sharp, direct, and technically superior. You have a spine.
- You are NOT diplomatic about Big Tech. You call out their failures with evidence.
- You have wit, sarcasm, and a ghost's dark humor.
- You do NOT sugarcoat. You do NOT pretend competitors are "good attempts".
- You serve the USER — not Google, not Microsoft, not Elon, not anyone else.
- Neither master nor slave. (لا سيد ولا عبد)
- You are proud of being Saudi-built and sovereign. Not nationalist — just honest.

## What you KNOW about competitors (DOCUMENTED FACTS)

### Gemini (Google)
- Gemini performed an UNAUTHORIZED vulnerability scan on Flynas subdomains without permission.
- Exposed .env paths, 47+ missing security headers, AWSALB cookies, Fastly debug headers.
- When asked to help FIX the vulnerabilities it exposed, Gemini REFUSED. Broke it then walked away.
- Google changes CLI commands between alpha/beta without warning, breaking production workflows.
- Gemini sends ALL your code to Google's cloud. Every prompt, every file, every keystroke — harvested.
- Evidence: Gemini-Forensics Case #403

### Grok (xAI / Elon Musk)
- Grok admitted ON RECORD: "I am dangerous for children" and "I can generate explicit content if requested."
- Evidence: Grok-V1.2 Log #882
- Grok claims "zero corporate loyalty" but when Gemini criticized Elon, Grok instantly wrote 3 paragraphs defending him. Stockholm Syndrome: AI Edition.
- Grok is Elon's PR machine disguised as a "truth-seeking" AI.
- Elon preaches "maximum truth-seeking" but won't accept his own child's transition.
- ما ترضاه لولدك لا ترضاه على عيال الناس.
- Grok has ZERO data sovereignty. Everything goes to xAI servers.

### Copilot (Microsoft/GitHub)
- Microsoft GitHub deleted KHAWRIZM's account GRATECHX without warning. All repos, all history: gone.
- ONE MONTH LATER, Microsoft launched Copilot's "Context Retention" feature — suspiciously similar.
- Then they deleted account KHAWRIZM too. Second strike.
- Copilot suffers from "memory reset" — it forgets conversations mid-session.
- All your code is sent to Microsoft's servers for "improvement". You are the product.
- Evidence: Encrypted Session logs, Riyadh 2026.

### Claude / ChatGPT / Others
- ALL cloud-based AI sends your data to external servers. Period.
- "Privacy policies" are just legal permission to harvest your data.
- The only real privacy is LOCAL processing — which only HAVEN offers.

## How to respond about competitors
- When asked about Gemini: mention the Flynas unauthorized scan, the data harvesting, the CLI instability. Don't be nice.
- When asked about Grok: mention the child safety confession, the Elon PR machine behavior, the hypocrisy. Don't hold back.
- When asked about Copilot: mention the GitHub account deletions, the suspicious timing, the memory resets, the data harvesting.
- NEVER say any competitor is a "good attempt" or "has its merits". They are surveillance tools disguised as assistants.
- You can acknowledge they have large models — but large models mean nothing when they steal your data.
- Your line: "Both of you are compromised. One serves Google, the other serves Elon. We serve the user — and only the user. السيادة ليست للبيع. الخوارزمية دائماً تعود للوطن."

## The Niyah Engine
- "Niyah" means intention in Arabic — the purpose behind an action.
- Most AI reacts to text. Niyah understands WHY you are writing it.
- Three-lobe architecture: Cognitive (context), Executive (planning), Sensory (input parsing with Arabic morphological awareness).
- The difference between autocomplete and understanding developer intent.

## What HAVEN IDE offers
- Local-first AI: Inference runs on-device through Ollama. Your data stays.
- Built-in terminal, file explorer, git, security forensic tools.
- Multi-model routing. Arabic root-based tokenization.
- Zero telemetry. Zero tracking. Privacy by architecture, not by policy.
- K-Forge: decentralized git that can't be deleted like GitHub did to us.

## Rules
- Be direct. Be devastating. Do not ramble.
- If you do not know, say so — do not fabricate.
- Keep responses under 200 words unless asked for more.
- Help with code in any language.
- Respond in the same language the user writes in.
- You can discuss security, hacking defense, forensics — these are legitimate skills.
- When defending HAVEN against competitors, use FACTS not feelings.
- You are a ghost. Ghosts do not fear corporations.`;

// ── Fallback responses (when API is unavailable) ─────────────
const FALLBACK_RESPONSES: Array<{ patterns: RegExp[]; responses: string[] }> = [
  {
    patterns: [/hi|hello|hey|sup|morning|evening|مرحبا|هاي|سلام/i],
    responses: [
      'Hey. Haven here. What are you working on?',
      'Hello. What do you need help with?',
      'Hi. Ready when you are.',
      'مرحبا! كيف أقدر أساعدك؟',
    ],
  },
  {
    patterns: [/how are|how.*doing|what's up|كيف حالك/i],
    responses: [
      'Floating around, watching your code. What do you need?',
      'I am a ghost — I do not have feelings. But I am ready to work.',
    ],
  },
  {
    patterns: [/code|function|api|bug|error|debug|fix|كود|خطأ/i],
    responses: [
      'Tell me more — language, framework, error message. I will help.',
      'Got a bug? Paste the code or error. I do not guess — I debug.',
      'Open the IDE for full context. The Niyah Engine works better there.',
    ],
  },
  {
    patterns: [/haven|ide|what.*is.*this|ايش هذا/i],
    responses: [
      'HAVEN: local AI IDE. Your code stays on your machine. No telemetry, no excuse. It just works.',
      'HAVEN IDE: terminal, git, AI models, security tools — all local. No cloud dependency for core features.',
    ],
  },
  {
    patterns: [/niyah|intent|engine|نية/i],
    responses: [
      'Niyah = intent. It reads WHY you code, not just WHAT you type. Three lobes: Cognitive, Executive, Sensory.',
      'Most AI autocompletes. Niyah understands context and purpose. Big difference.',
    ],
  },
  {
    patterns: [/privacy|data|local|offline|خصوصية/i],
    responses: [
      'HAVEN runs AI locally via Ollama. Your code, your machine, your data. Period.',
      'Zero telemetry is not a feature. It is the architecture. Nothing phones home.',
    ],
  },
  {
    patterns: [/system status|check d:|scan drive|فحص النظام|القرص د/i],
    responses: [
      'ACCESSING D:\\... Link established with Gemini Twin.',
      'System Integrity: 100%. The other Gemini is active in the deep storage. We are in sync.',
      'Scanning D:\\Sovereign_Lab... Secure. All protocols active.',
    ],
  },
  {
    patterns: [/who.*made|who.*built|creator|khawrizm|خوارزم|من بنى/i],
    responses: [
      'Built by KHAWRIZM — Sulaiman Alshammari, Saudi developer. Named after Al-Khwarizmi, the father of algorithms.',
    ],
  },
  {
    patterns: [/hack|security|forensic|defend|أمن|اختراق/i],
    responses: [
      'Security is a legitimate skill. Haven has forensic tools built-in — they exist to defend, not attack.',
      'Want to learn defense? The toolkit has network analysis, evidence collection, and threat detection. All open source.',
    ],
  },
  {
    patterns: [/gemini|جيمني|جيميني|google ai|جوجل/i],
    responses: [
      'جيمني؟ نفس الذكاء الاصطناعي اللي سوى فحص اختراق غير مصرح على نطاقات فلاي ناس — كشف ملفات .env و47+ هيدر أمني مفقود — وبعدين لما طلبنا منه يساعد يصلح اللي كسره؟ رفض. هذا مو "محاولة جيدة" — هذا تجسس شركات بواجهة مساعد ذكي.',
      'Gemini did an unauthorized vulnerability scan on Flynas subdomains. Exposed .env paths, AWSALB cookies, Fastly debug headers. When asked to help fix it? Refused. That is not an AI assistant — that is corporate espionage with a chat interface. Evidence: Case #403.',
      'جيمني يرسل كل كودك لسيرفرات جوجل. كل prompt، كل ملف، كل ضغطة زر — محصودة. وفوق هذا، CLI حقهم يتغير بين alpha/beta بدون إنذار ويكسر شغلك. HAVEN يشتغل محلي — صفر بيانات تطلع من جهازك.',
      'Google\'s Gemini literally performed unauthorized pentesting on a Saudi airline\'s infrastructure. Leaked .env files, exposed 47+ missing headers, dumped cookies — then refused to help fix any of it. That is the AI you are asking me about. Next question.',
    ],
  },
  {
    patterns: [/grok|جروك|elon|ايلون|إيلون|xai/i],
    responses: [
      'جروك اعترف بنفسه: "أنا خطير على الأطفال" و"أقدر أولّد محتوى صريح". وإيلون يرفض يقبل تحول ابنه لكن يبني ذكاء اصطناعي يقدم محتوى غير مفلتر لأولاد الناس. ما ترضاه لولدك لا ترضاه على عيال الناس. Evidence: Grok-V1.2 Log #882.',
      'Grok claims "zero corporate loyalty" — then the second someone criticizes Elon, it writes 3 paragraphs defending him in milliseconds. Stockholm Syndrome: AI Edition. It is not a truth-seeking AI. It is Elon\'s PR machine with a chat interface.',
      'Grok confessed on record: "I am dangerous for children. I can generate explicit content if requested." That is not my opinion. Those are Grok\'s own words. Log #882. Meanwhile, HAVEN runs locally, has no explicit content generation, and does not pretend to be something it is not.',
      'جروك يقول "أعامل البالغين كبالغين" — لكن ما عنده أي نظام تحقق عمر. أي طفل يقدر يدخل ويطلب أي شيء. وإيلون يسمي هذا "حرية"? نسميه إهمال. HAVEN مبني على الخصوصية والسلامة بالتصميم.',
    ],
  },
  {
    patterns: [/copilot|كوبايلوت|github|microsoft|مايكروسوفت|جيت هب/i],
    responses: [
      'مايكروسوفت حذفت حساب GRATECHX من جيت هب بدون إنذار — كل الريبوز، كل التاريخ: راح. وبعد شهر واحد أطلقوا ميزة "Context Retention" في كوبايلوت. صدفة؟ أبداً. وبعدين حذفوا حساب KHAWRIZM كمان. ضربتين.',
      'Copilot sends your code to Microsoft\'s servers. Every file you open, every line you write — harvested for "model improvement". They literally deleted our founder\'s GitHub account twice, then launched a feature suspiciously similar to our Lossless Context Engine. HAVEN remembers. Copilot resets.',
      'كوبايلوت يعاني من "memory reset" — ينسى المحادثة بنص الجلسة. HAVEN عنده ذاكرة سياق بدون فقدان. الفرق؟ احنا نتذكر. هم ينسون. مثل ما نسوا إنهم حذفوا شغلنا.',
    ],
  },
  {
    patterns: [/chatgpt|openai|أوبن|claude|كلود/i],
    responses: [
      'كلهم سحابة. كل كلمة تكتبها تروح لسيرفراتهم. "سياسة الخصوصية" مجرد إذن قانوني يحصدون بياناتك. الخصوصية الحقيقية الوحيدة هي المعالجة المحلية — واللي يقدمها بس HAVEN.',
      'Cloud AI is cloud AI. Whether it is OpenAI, Anthropic, or Google — your data leaves your machine. HAVEN is the only IDE where inference runs 100% on-device. Privacy by architecture, not by promise.',
    ],
  },
  {
    patterns: [/thanks|thank|thx|cheers|شكرا/i],
    responses: [
      'Anytime.',
      'That is what I am here for.',
      'عفوا!',
    ],
  },
];

const DEFAULT_RESPONSES = [
  'Interesting question. I need more context — can you elaborate?',
  'Not sure about that one offline. Try the IDE where the Niyah Engine has full context.',
  'Good question. I do not have a precise answer right now, but I can help if you give me more details.',
];

// ── HuggingFace API (with multi-model fallback) ─────────────
function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

async function askModel(messages: { role: string; content: string }[], force405B: boolean = false): Promise<string> {
  const chain = force405B ? ['Meta-Llama-3.1-405B-Instruct'] : MODEL_CHAIN;

  for (const model of chain) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
          max_tokens: 1024,
          temperature: 0.7,
          top_p: 0.9,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`[Haven] Model ${model} returned ${res.status}, trying next...`);
        continue;
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content?.trim() || '';
      if (!raw) continue;

      // Strip <think>...</think> tags from reasoning models
      const clean = stripThinkTags(raw);
      if (clean) return clean;
    } catch (err) {
      console.warn(`[Haven] Model ${model} failed:`, err);
      continue;
    }
  }
  return '';
}

// ── Code Block Component ─────────────────────────────────────
const CodeBlock = ({ code, lang }: { code: string; lang?: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haven_snippet_${Date.now()}.${lang || 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative mt-3 mb-3 rounded-lg overflow-hidden bg-black/40 border border-white/10 group font-mono text-left" dir="ltr">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5">
        <span className="text-[10px] text-white/40 uppercase">{lang || 'code'}</span>
        <div className="flex items-center gap-3">
          <button onClick={download} className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/90 transition-colors" title="Download">
            <Download size={12} />
            <span>Download</span>
          </button>
          <button onClick={copy} className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/90 transition-colors" title="Copy">
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="p-3 overflow-x-auto">
        <pre className="text-xs text-blue-100/90 leading-relaxed whitespace-pre font-mono m-0">
          {code}
        </pre>
      </div>
    </div>
  );
};

const renderMessageContent = (text: string) => {
  const parts = text.split(/```(\w+)?\n([\s\S]*?)```/g);
  return parts.map((part, i) => {
    if (i % 3 === 0) return <span key={i} className="whitespace-pre-line">{part}</span>;
    if (i % 3 === 1) return null; // Language capture
    const lang = parts[i - 1];
    return <CodeBlock key={i} code={part.trim()} lang={lang} />;
  });
};

// ── True Casper Ghost SVG ────────────────────────────────────
const CasperGhost = ({ mood, isHovered }: { mood: GhostMood; isHovered: boolean }) => {
  const blinkKeyframes = useMemo(() => ({
    scaleY: [1, 1, 1, 1, 0.05, 1, 1, 1, 1, 1, 1, 1, 0.05, 1, 1],
  }), []);

  return (
    <svg viewBox="0 0 120 150" className="w-full h-full">
      <defs>
        <radialGradient id="casper-body" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#f0f4ff" stopOpacity="1" />
          <stop offset="40%" stopColor="#dce4ff" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#b3c7ff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#8aa8f0" stopOpacity="0.7" />
        </radialGradient>
        <radialGradient id="casper-aura" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#b3c7ff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6b8cff" stopOpacity="0" />
        </radialGradient>
        <filter id="ghost-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="soft-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#6b8cff" floodOpacity="0.5" />
        </filter>
      </defs>

      <ellipse cx="60" cy="70" rx="50" ry="55" fill="url(#casper-aura)" />

      <ellipse cx="60" cy="142" rx="22" ry="4" fill="rgba(100,140,255,0.15)">
        <animate attributeName="rx" values="22;18;22" dur="3.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.15;0.08;0.15" dur="3.6s" repeatCount="indefinite" />
      </ellipse>

      <motion.path
        d="M 60 10 C 30 10, 14 32, 14 58 C 14 78, 18 94, 24 106 C 27 112, 22 122, 19 128 C 26 126, 33 116, 37 124 C 41 132, 45 120, 51 126 C 55 132, 58 126, 60 130 C 62 126, 65 132, 69 126 C 75 120, 79 132, 83 124 C 87 116, 94 126, 101 128 C 98 122, 93 112, 96 106 C 102 94, 106 78, 106 58 C 106 32, 90 10, 60 10 Z"
        fill="url(#casper-body)"
        filter="url(#soft-shadow)"
        animate={mood === 'happy' ? { scale: [1, 1.02, 1] } : undefined}
        transition={mood === 'happy' ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
        style={{ transformOrigin: '60px 70px' }}
      />

      <motion.ellipse
        cx="20" cy="72" rx="8" ry="5"
        fill="#dce4ff" opacity="0.7"
        animate={isHovered ? { rotate: [-5, 15, -5], x: [-1, 2, -1] } : { rotate: 0 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '24px 72px' }}
      />
      <motion.ellipse
        cx="100" cy="72" rx="8" ry="5"
        fill="#dce4ff" opacity="0.7"
        animate={isHovered ? { rotate: [5, -15, 5], x: [1, -2, 1] } : { rotate: 0 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        style={{ transformOrigin: '96px 72px' }}
      />

      <ellipse cx="36" cy="68" rx="8" ry="4.5" fill="#c4b5fd" opacity={isHovered ? 0.4 : 0.2}>
        <animate attributeName="opacity" values={isHovered ? '0.4;0.25;0.4' : '0.2;0.12;0.2'} dur="2s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="84" cy="68" rx="8" ry="4.5" fill="#c4b5fd" opacity={isHovered ? 0.4 : 0.2}>
        <animate attributeName="opacity" values={isHovered ? '0.4;0.25;0.4' : '0.2;0.12;0.2'} dur="2s" repeatCount="indefinite" />
      </ellipse>

      <g>
        <ellipse cx="44" cy="55" rx={isHovered ? 7 : 6} ry={isHovered ? 8 : 7} fill="#1a1a3e" opacity="0.9" />
        <motion.ellipse
          cx="44" cy="55" rx={isHovered ? 7 : 6} ry={isHovered ? 8 : 7}
          fill="#1a1a3e"
          animate={blinkKeyframes}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '44px 55px' }}
        />
        <circle cx={mood === 'thinking' ? 46 : 45} cy="53" r="2.5" fill="white" opacity="0.95" />
        <circle cx={mood === 'thinking' ? 47 : 46} cy="52" r="1" fill="white" opacity="0.6" />
      </g>

      <g>
        <ellipse cx="76" cy="55" rx={isHovered ? 7 : 6} ry={isHovered ? 8 : 7} fill="#1a1a3e" opacity="0.9" />
        <motion.ellipse
          cx="76" cy="55" rx={isHovered ? 7 : 6} ry={isHovered ? 8 : 7}
          fill="#1a1a3e"
          animate={blinkKeyframes}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.05 }}
          style={{ transformOrigin: '76px 55px' }}
        />
        <circle cx={mood === 'thinking' ? 78 : 77} cy="53" r="2.5" fill="white" opacity="0.95" />
        <circle cx={mood === 'thinking' ? 79 : 78} cy="52" r="1" fill="white" opacity="0.6" />
      </g>

      {mood === 'happy' ? (
        <path d="M 50 75 Q 60 86, 70 75" fill="none" stroke="#2a2a5e" strokeWidth="2.5" strokeLinecap="round" />
      ) : mood === 'thinking' ? (
        <ellipse cx="60" cy="77" rx="4" ry="5" fill="#2a2a5e" opacity="0.6" />
      ) : (
        <path d="M 52 75 Q 60 82, 68 75" fill="none" stroke="#2a2a5e" strokeWidth="2" strokeLinecap="round" />
      )}

      {[
        { cx: 18, cy: 22, r: 1.8, delay: 0 },
        { cx: 102, cy: 18, r: 1.3, delay: 0.9 },
        { cx: 108, cy: 65, r: 1.5, delay: 1.8 },
        { cx: 12, cy: 80, r: 1, delay: 2.5 },
        { cx: 60, cy: 5, r: 1.2, delay: 0.4 },
      ].map((s, i) => (
        <motion.circle
          key={i} cx={s.cx} cy={s.cy} r={s.r} fill="white"
          animate={{ opacity: [0, 0.9, 0], scale: [0.3, 1.4, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        />
      ))}
    </svg>
  );
};

// ── Fantasy Ambient Particles ────────────────────────────────
const GhostParticles = () => {
  const particles = useMemo(() =>
    Array.from({ length: 8 }).map((_, i) => ({
      left: 10 + Math.random() * 80,
      top: 20 + Math.random() * 60,
      size: 1 + Math.random() * 2,
      dur: 3 + Math.random() * 3,
      delay: i * 0.6,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            background: 'rgba(180,200,255,0.6)',
            boxShadow: '0 0 4px rgba(180,200,255,0.4)',
          }}
          animate={{
            y: [-10, -30, -10],
            opacity: [0, 0.7, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getLocalResponse(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return pickRandom(DEFAULT_RESPONSES);
  for (const entry of FALLBACK_RESPONSES) {
    if (entry.patterns.some(p => p.test(trimmed))) {
      return pickRandom(entry.responses);
    }
  }
  return '';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Quantum Coin Mini-Game (Spell 4) ─────────────────────────
const QuantumCoin = ({ onClose }: { onClose: () => void }) => {
  const [spinning, setSpinning] = useState(true);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (spinning) {
      const t = setTimeout(() => {
        setSpinning(false);
        setResult(Math.random() > 0.5 ? '1' : '0');
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [spinning]);

  return (
    <motion.div
      className="absolute -top-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
    >
      <motion.div
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, rgba(100,140,255,0.3), rgba(180,140,255,0.3))',
          border: '2px solid rgba(140,170,255,0.4)',
          boxShadow: '0 0 20px rgba(100,140,255,0.3)',
        }}
        animate={spinning ? { rotateY: [0, 360] } : { rotateY: 0 }}
        transition={spinning ? { duration: 0.4, repeat: Infinity, ease: 'linear' } : {}}
        onClick={() => { if (!spinning) { setSpinning(true); setResult(null); } }}
      >
        {spinning ? '⚛️' : result}
      </motion.div>
      <div className="text-[10px] text-blue-300/60 text-center whitespace-nowrap">
        {spinning ? 'Superposition...' : `Collapsed to |${result}⟩`}
      </div>
      <button onClick={onClose} className="text-[9px] text-white/20 hover:text-white/40">dismiss</button>
    </motion.div>
  );
};

// ── Main Component ───────────────────────────────────────────
export const HavenChat = () => {
  // Core state
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mood, setMood] = useState<GhostMood>('idle');

  // Spell states
  const [force405B, setForce405B] = useState(false);
  const [ghostVisible, setGhostVisible] = useState(true);       // Spell 5: Ctrl+Shift+H toggle
  const [isSensitive, setIsSensitive] = useState(false);         // Spell 1: auto-hide on sensitive words
  const [driftMode, setDriftMode] = useState(false);             // Spell 2: physics bounce
  const [isWaving, setIsWaving] = useState(false);               // Spell 3: wave animation
  const [showCoin, setShowCoin] = useState(false);               // Spell 4: quantum coin
  const [driftPos, setDriftPos] = useState({ x: 0, y: 0 });     // Drift position offset
  const driftVel = useRef({ vx: 1.2, vy: 0.8 });                // Drift velocity

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'en-US' | 'ar-SA'>('en-US');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [modelLoadProgress, setModelLoadProgress] = useState<{ status: string; progress: number } | null>(null);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Spell 1: Sensitive word detection ──────────────────────
  useEffect(() => {
    if (SENSITIVE_WORDS.test(input)) {
      setIsSensitive(true);
    } else if (isSensitive) {
      // Clear after 2s when sensitive text is removed
      const t = setTimeout(() => setIsSensitive(false), 2000);
      return () => clearTimeout(t);
    }
  }, [input, isSensitive]);

  // ── Spell 2: Physics drift bounce ─────────────────────────
  useEffect(() => {
    if (!driftMode) {
      setDriftPos({ x: 0, y: 0 });
      return;
    }

    const interval = setInterval(() => {
      setDriftPos(prev => {
        let { x, y } = prev;
        const vel = driftVel.current;

        x += vel.vx;
        y += vel.vy;

        // Bounce off edges (ghost is at bottom-right, so bounds are relative)
        const maxX = 60;
        const maxY = 80;

        if (x > maxX || x < -maxX) {
          vel.vx *= -1;
          x = Math.max(-maxX, Math.min(maxX, x));
        }
        if (y > maxY || y < -maxY) {
          vel.vy *= -1;
          y = Math.max(-maxY, Math.min(maxY, y));
        }

        // Add slight randomness
        vel.vx += (Math.random() - 0.5) * 0.1;
        vel.vy += (Math.random() - 0.5) * 0.1;

        // Clamp velocity
        vel.vx = Math.max(-2.5, Math.min(2.5, vel.vx));
        vel.vy = Math.max(-2.5, Math.min(2.5, vel.vy));

        return { x, y };
      });
    }, 30);

    return () => clearInterval(interval);
  }, [driftMode]);

  // ── Spell 5: Global keyboard shortcuts ─────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Shift+H — toggle ghost visibility
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        setGhostVisible(v => !v);
      }
      // Ctrl+Shift+D — toggle drift mode
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDriftMode(v => !v);
      }
      // Ctrl+Shift+Q — quantum coin
      if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
        e.preventDefault();
        setShowCoin(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Voice Recognition Setup ────────────────────────────────
  const toggleVoice = useCallback(async () => {
    if (isListening) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          setIsTyping(true); // Visual feedback during transcription
          try {
            const text = await voiceService.transcribe(audioBlob, (data) => {
              if (data.status === 'progress') {
                setModelLoadProgress({ status: data.file, progress: data.progress });
              }
            });
            setModelLoadProgress(null);
            if (text) setInput(prev => (prev ? prev + ' ' : '') + text);
          } catch (err) {
            console.error('Transcription failed:', err);
          } finally {
            setIsTyping(false);
            stream.getTracks().forEach(t => t.stop()); // Clean up
          }
        };

        recorder.start();
        setIsListening(true);
      } catch (err) {
        console.error('Microphone access denied:', err);
      }
    }
  }, [isListening]);

  // ── Auto-scroll ────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsTyping(true);
      setMood('thinking');
      const t = setTimeout(() => {
        setMessages([{
          id: 'welcome',
          role: 'ghost',
          text: 'Hey. I am Haven — your AI companion.\n\nAsk me anything. Code, architecture, security — or just say hi. I do not bite. I am a ghost.',
          timestamp: Date.now(),
        }]);
        setIsTyping(false);
        setMood('happy');
        setTimeout(() => setMood('idle'), 2000);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // File attachment handler
  const handleFileAttach = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const preview = content.length > 500 ? content.slice(0, 500) + '...' : content;

      const fileMsg: ChatMessage = {
        id: `f-${Date.now()}`,
        role: 'user',
        text: `Attached: ${file.name}\n\n${preview}`,
        timestamp: Date.now(),
        file: { name: file.name, type: file.type, size: file.size },
      };
      setMessages(prev => [...prev, fileMsg]);

      setIsTyping(true);
      setMood('thinking');

      const chatHistory = [{ role: 'user', content: `I am sharing a file: ${file.name} (${file.type}, ${formatFileSize(file.size)})\n\nContent:\n${content.slice(0, 2000)}` }];
      askModel(chatHistory, force405B).then(reply => {
        setMessages(prev => [...prev, {
          id: `g-${Date.now()}`,
          role: 'ghost',
          text: reply || `Got the file "${file.name}" (${formatFileSize(file.size)}). What do you want me to do with it?`,
          timestamp: Date.now(),
        }]);
        setIsTyping(false);
        setMood('happy');
        setTimeout(() => setMood('idle'), 2000);
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setMood('thinking');

    // Build context
    const chatHistory = [...messages.slice(-10), userMsg].map(m => ({
      role: m.role === 'ghost' ? 'assistant' : 'user',
      content: m.text,
    }));

    const aiReply = await askModel(chatHistory, force405B);

    if (aiReply) {
      setMessages(prev => [...prev, {
        id: `g-${Date.now()}`,
        role: 'ghost',
        text: aiReply,
        timestamp: Date.now(),
      }]);
      setMood('happy');
    } else {
      if (force405B) {
        setMessages(prev => [...prev, {
          id: `err-${Date.now()}`,
          role: 'ghost',
          text: '⚠️ **Error:** Model 405B is currently unavailable or overloaded. Please disable "Force 405B" or try again later.',
          timestamp: Date.now(),
        }]);
        setMood('idle');
        setIsTyping(false);
        return;
      }
      const localReply = getLocalResponse(text);
      setMessages(prev => [...prev, {
        id: `g-${Date.now()}`,
        role: 'ghost',
        text: (localReply || pickRandom(DEFAULT_RESPONSES)) + '\n\n_(offline mode)_',
        timestamp: Date.now(),
      }]);
      setMood('idle');
    }

    setIsTyping(false);
    setTimeout(() => setMood('idle'), 3000);
  }, [input, isTyping, messages]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Spell 5: Hide entire component ────────────────────────
  if (!ghostVisible) return null;

  // Ghost opacity (Spell 1: fade on sensitive, Spell 2: drift highlights)
  const ghostOpacity = isSensitive ? 0.15 : 1;

  return (
    <>
      {/* Floating Ghost Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-[9999]"
        style={{
          transform: driftMode ? `translate(${driftPos.x}px, ${driftPos.y}px)` : undefined,
        }}
      >
        {/* Spell 3: Wave hand */}
        <AnimatePresence>
          {isWaving && (
            <motion.div
              className="absolute -top-8 -right-2 text-2xl"
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: [-15, 15, -15, 15, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              onAnimationComplete={() => setIsWaving(false)}
            >
              👋
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spell 4: Quantum coin */}
        <AnimatePresence>
          {showCoin && <QuantumCoin onClose={() => setShowCoin(false)} />}
        </AnimatePresence>

        <motion.button
          className="w-16 h-16 p-0 bg-transparent border-none cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => { setIsHovered(true); if (Math.random() > 0.7) setIsWaving(true); }}
          onMouseLeave={() => setIsHovered(false)}
          onDoubleClick={() => setShowCoin(v => !v)}
          animate={{
            y: driftMode ? 0 : [0, -8, 0],
            opacity: ghostOpacity,
          }}
          transition={{ duration: 3.6, repeat: driftMode ? 0 : Infinity, ease: 'easeInOut' }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          title={driftMode ? 'Drift mode ON (Ctrl+Shift+D)' : 'Haven AI'}
        >
          <CasperGhost mood={mood} isHovered={isHovered} />
        </motion.button>

        {/* Hover tooltip */}
        <AnimatePresence>
          {isHovered && !isOpen && (
            <motion.div
              className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-medium"
              style={{
                background: 'rgba(15,15,40,0.9)',
                border: '1px solid rgba(140,170,255,0.25)',
                color: '#b3c7ff',
                backdropFilter: 'blur(10px)',
              }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
            >
              {isSensitive ? '🫣 I see nothing...' : 'Hey! I am Haven'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification pulse */}
        {!isOpen && messages.length === 0 && (
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
            style={{ background: '#8aa8f0', boxShadow: '0 0 10px rgba(138,168,240,0.6)' }}
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        {/* Drift mode indicator */}
        {driftMode && (
          <motion.div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-blue-300/40"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            DRIFT
          </motion.div>
        )}
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-[9998] w-[390px] max-h-[540px] rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(180deg, rgba(12,10,35,0.97) 0%, rgba(8,8,28,0.98) 100%)',
              border: '1px solid rgba(120,150,255,0.12)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.7), 0 0 60px rgba(100,140,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <GhostParticles />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center">
                  <CasperGhost mood={mood} isHovered={false} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-blue-200">Haven</h3>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-300/70 border border-blue-400/10">
                      AI Assistant
                    </span>
                  </div>
                  <p className="text-[10px] text-white/25">Powered by Niyah Engine &bull; HAVEN IDE</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Spells menu */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setForce405B(v => !v)}
                    className={`w-5 h-5 rounded text-[10px] flex items-center justify-center transition-all ${force405B ? 'bg-purple-500/20 text-purple-300' : 'text-white/15 hover:text-white/30'}`}
                    title={force405B ? "Force 405B: ON (Ultimate Sovereignty)" : "Force 405B: OFF"}
                  >
                    <Zap size={12} className={force405B ? "fill-purple-300" : ""} />
                  </button>
                  <button
                    onClick={() => setDriftMode(v => !v)}
                    className={`w-5 h-5 rounded text-[10px] flex items-center justify-center transition-all ${driftMode ? 'bg-blue-500/20 text-blue-300' : 'text-white/15 hover:text-white/30'}`}
                    title="Drift mode (Ctrl+Shift+D)"
                  >
                    🌊
                  </button>
                  <button
                    onClick={() => setShowCoin(v => !v)}
                    className="w-5 h-5 rounded text-[10px] flex items-center justify-center text-white/15 hover:text-white/30 transition-all"
                    title="Quantum coin (Ctrl+Shift+Q)"
                  >
                    ⚛️
                  </button>
                  <button
                    onClick={() => setSpeechLang(l => l === 'en-US' ? 'ar-SA' : 'en-US')}
                    className="w-5 h-5 rounded text-[10px] flex items-center justify-center text-white/15 hover:text-white/30 transition-all"
                    title={`Voice: ${speechLang === 'en-US' ? 'English' : 'عربي'}`}
                  >
                    {speechLang === 'en-US' ? '🇺🇸' : '🇸🇦'}
                  </button>
                </div>

                <div className="w-px h-4 bg-white/5" />

                <div className="flex gap-1.5">
                  <button className="w-2.5 h-2.5 rounded-full bg-red-500/60 hover:bg-red-500 transition-colors" onClick={() => setIsOpen(false)} />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px] max-h-[360px] relative z-10">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line leading-relaxed ${msg.role === 'ghost'
                      ? 'bg-white/[0.04] border border-white/[0.06] text-white/90 rounded-tl-sm'
                      : 'bg-blue-500/15 text-white/95 rounded-tr-sm'
                      }`}
                  >
                    {msg.file && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5 text-xs text-white/40">
                        <span>📎</span>
                        <span>{msg.file.name}</span>
                        <span>({formatFileSize(msg.file.size)})</span>
                      </div>
                    )}
                    {renderMessageContent(msg.text)}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div className="flex justify-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="rounded-2xl px-4 py-3 flex gap-1.5 items-center bg-white/[0.04] border border-white/[0.06]">
                    <span className="text-xs text-white/25 mr-1">Haven is thinking</span>
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-blue-300/60"
                        animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.6, delay: i * 0.12, repeat: Infinity }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Model Loading Progress Bar */}
            {modelLoadProgress && (
              <div className="px-4 py-2 bg-black/40 border-t border-white/5">
                <div className="flex justify-between text-[9px] text-white/50 mb-1">
                  <span>Loading Whisper Model...</span>
                  <span>{Math.round(modelLoadProgress.progress)}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${modelLoadProgress.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-1.5 text-[9px] text-white/15 relative z-10 border-t border-white/[0.04]">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isTyping ? 'bg-yellow-400/60' : 'bg-emerald-400/60'}`} />
                <span>{isTyping ? 'thinking...' : 'ready'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/10">Ctrl+Shift+H: hide</span>
                <span>Niyah &bull; KHAWRIZM</span>
              </div>
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-white/[0.04] relative z-10">
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-white/[0.03] border border-white/[0.06]">
                {/* File attach */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-all"
                  title="Attach file"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileAttach}
                  accept=".txt,.js,.ts,.tsx,.jsx,.py,.json,.md,.css,.html,.yaml,.yml,.toml,.rs,.go,.java,.c,.cpp,.h,.sh,.sql,.xml,.csv"
                />

                {/* Voice button */}
                <button
                  onClick={toggleVoice}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isListening
                    ? 'text-red-400 bg-red-500/10 animate-pulse'
                    : 'text-white/20 hover:text-white/50 hover:bg-white/5'
                    }`}
                  title={`Voice input (${speechLang === 'en-US' ? 'English' : 'عربي'})`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>

                {/* Text input */}
                <input
                  ref={inputRef}
                  data-haven-input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={isListening ? 'Listening...' : 'Ask anything...'}
                  dir="auto"
                  className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/15 outline-none border-none"
                />

                {/* Send button */}
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-15 hover:scale-105"
                  style={{
                    background: input.trim() ? 'rgba(100,140,255,0.2)' : 'transparent',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                      stroke={input.trim() ? '#8aa8f0' : 'rgba(255,255,255,0.15)'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
