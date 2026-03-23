// ═══════════════════════════════════════════════════════════════════════
// NIYAH COMPLETION PROVIDER — Sovereign Inline Intelligence
// FIM-first architecture: Ollama local LLM → pattern fallback → Niyah intent
// Built by أبو خوارزم — Sulaiman Alshammari
// ═══════════════════════════════════════════════════════════════════════
// Architecture (2026 production-grade):
//   Layer 0: Debounce + LRU cache (instant, no compute)
//   Layer 1: Ollama FIM completion (real AI, local, context-aware)
//   Layer 2: Pattern-based completions (zero-latency fallback)
//   Layer 3: File context suggestions (component/hook/store aware)
//   Layer 4: Niyah Intent Memory (recent session awareness)
//   Layer 5: Sovereign templates (PDPL-compliant patterns)
//   Layer 6: Arabic-aware comments
// All layers run 100% on-device. Zero cloud. Zero telemetry.
// ═══════════════════════════════════════════════════════════════════════

import { niyahEngine } from './NiyahEngine';
import { ollamaService } from './OllamaService';
import { modelRouter } from './ModelRouter';

// ── Types ────────────────────────────────────────────────────────────

export interface CompletionContext {
  lineContent: string;      // Current line up to cursor
  fullText: string;         // Full file content
  language: string;         // Language ID
  fileName: string;         // Active file name
  lineNumber: number;       // 1-based line number
  column: number;           // 1-based column
  prevLines: string[];      // Previous 5 lines for context
}

export interface NiyahSuggestion {
  text: string;
  kind: 'pattern' | 'context' | 'intent' | 'sovereign' | 'arabic' | 'fim';
  confidence: number;       // 0..1
  label?: string;           // Description for UI
}

// ── Import Analysis ──────────────────────────────────────────────────

function getImports(text: string): Set<string> {
  const imports = new Set<string>();
  const patterns = [
    /import\s+\{([^}]+)\}\s+from/g,
    /import\s+(\w+)\s+from/g,
    /const\s+\{([^}]+)\}\s*=\s*require/g,
    /from\s+['"]([^'"]+)['"]/g,
  ];
  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(text)) !== null) {
      const items = m[1].split(',').map(s => s.trim().split(' as ')[0].trim());
      items.forEach(i => { if (i) imports.add(i); });
    }
  }
  return imports;
}

function getDefinedVariables(text: string): string[] {
  const vars: string[] = [];
  const patterns = [
    /(?:const|let|var)\s+(\w+)/g,
    /function\s+(\w+)/g,
    /(?:interface|type|class|enum)\s+(\w+)/g,
  ];
  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(text)) !== null) vars.push(m[1]);
  }
  return vars;
}

function detectFileContext(fileName: string): {
  isComponent: boolean;
  isHook: boolean;
  isUtil: boolean;
  isTest: boolean;
  isApi: boolean;
  isStore: boolean;
  isEngine: boolean;
} {
  const lower = fileName.toLowerCase();
  return {
    isComponent: /\.(tsx|jsx)$/.test(lower) && !lower.includes('test') && !lower.startsWith('use'),
    isHook: lower.startsWith('use') && /\.(ts|tsx)$/.test(lower),
    isUtil: lower.includes('util') || lower.includes('helper') || lower.includes('lib'),
    isTest: lower.includes('test') || lower.includes('spec'),
    isApi: lower.includes('api') || lower.includes('route') || lower.includes('handler'),
    isStore: lower.includes('store') || lower.includes('zustand') || lower.includes('state'),
    isEngine: lower.includes('engine') || lower.includes('core') || lower.includes('service'),
  };
}

// ── Pattern-Based Completions (Enhanced) ─────────────────────────────

const PATTERNS: Record<string, { trigger: RegExp; suggest: (m: RegExpMatchArray, ctx: CompletionContext) => string | null; confidence: number }[]> = {
  typescript: [
    // React hooks
    { trigger: /const \[(\w+), set(\w+)\] = useState\($/,
      suggest: (m) => {
        const name = m[1];
        if (name.startsWith('is') || name.startsWith('has') || name.startsWith('show')) return 'false);';
        if (name.includes('count') || name.includes('index') || name.includes('page')) return '0);';
        if (name.includes('list') || name.includes('items') || name.includes('data')) return '[]);';
        if (name.includes('text') || name.includes('input') || name.includes('query') || name.includes('search')) return "'');";
        return 'null);';
      }, confidence: 0.95 },

    // useEffect with smart dependency
    { trigger: /useEffect\(\(\) => \{$/,
      suggest: (_m, ctx) => {
        const vars = getDefinedVariables(ctx.fullText);
        const stateVars = vars.filter(v => v.startsWith('is') || v.startsWith('has') || v.includes('data'));
        const dep = stateVars.length > 0 ? stateVars[0] : '';
        return `\n    // Effect logic\n    return () => {\n      // Cleanup\n    };\n  }, [${dep}]);`;
      }, confidence: 0.9 },

    // Function component
    { trigger: /export (?:default )?function (\w+)\($/,
      suggest: (m, ctx) => {
        const name = m[1];
        if (ctx.fileName.includes('Page') || name.includes('Page')) {
          return `) {\n  return (\n    <div className="min-h-screen p-8">\n      <h1 className="text-2xl font-bold mb-4">${name}</h1>\n    </div>\n  );\n}`;
        }
        return `) {\n  return (\n    <div className="flex items-center gap-2">\n      \n    </div>\n  );\n}`;
      }, confidence: 0.85 },

    // Interface with smart fields
    { trigger: /interface (\w+) \{$/,
      suggest: (m) => {
        const name = m[1].toLowerCase();
        if (name.includes('user') || name.includes('profile')) return '\n  id: string;\n  name: string;\n  email: string;\n  avatar?: string;\n  createdAt: Date;\n}';
        if (name.includes('post') || name.includes('article')) return '\n  id: string;\n  title: string;\n  content: string;\n  author: string;\n  publishedAt: Date;\n  tags: string[];\n}';
        if (name.includes('config') || name.includes('settings')) return '\n  enabled: boolean;\n  value: string;\n  description?: string;\n}';
        if (name.includes('response') || name.includes('result')) return '\n  success: boolean;\n  data: unknown;\n  error?: string;\n}';
        return '\n  id: string;\n  name: string;\n  createdAt: Date;\n}';
      }, confidence: 0.85 },

    // Async function with try/catch
    { trigger: /const (\w+) = async \($/,
      suggest: (m) => {
        const name = m[1].toLowerCase();
        if (name.includes('fetch') || name.includes('get') || name.includes('load')) {
          return ") => {\n  try {\n    const response = await fetch(url);\n    if (!response.ok) throw new Error(response.statusText);\n    return response.json();\n  } catch (error) {\n    console.error(`Failed to ${name}:`, error);\n    throw error;\n  }\n};";
        }
        return ') => {\n  try {\n    \n  } catch (error) {\n    console.error(error);\n    throw error;\n  }\n};';
      }, confidence: 0.85 },

    // Import completion
    { trigger: /import \{ (\w+) \} from '$/,
      suggest: (m) => {
        const name = m[1];
        if (['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext'].includes(name)) return "react';";
        if (['useRouter', 'usePathname', 'useSearchParams'].includes(name)) return "next/navigation';";
        if (['motion', 'AnimatePresence'].includes(name)) return "motion/react';";
        return null;
      }, confidence: 0.95 },

    // Error handling
    { trigger: /try \{$/,
      suggest: () => '\n    \n  } catch (error) {\n    const message = error instanceof Error ? error.message : "Unknown error";\n    console.error(message);\n  }',
      confidence: 0.85 },

    // Arrow function with common patterns
    { trigger: /\.map\(\((\w+)\) =>$/,
      suggest: (m) => {
        const item = m[1];
        return ` (\n    <div key={${item}.id}>\n      {${item}.name}\n    </div>\n  ))`;
      }, confidence: 0.8 },

    { trigger: /\.filter\(\((\w+)\) =>$/,
      suggest: (m) => ` ${m[1]}.isActive)`,
      confidence: 0.75 },

    { trigger: /\.reduce\(\(acc, (\w+)\) =>$/,
      suggest: (m) => ` acc + ${m[1]}.value, 0)`,
      confidence: 0.75 },

    // Console with context
    { trigger: /console\.log\($/,
      suggest: (_m, ctx) => {
        const fnMatch = ctx.fullText.match(/function (\w+)/);
        if (fnMatch) return `'[${fnMatch[1]}]', `;
        return "'Debug:', ";
      }, confidence: 0.7 },

    // Fetch
    { trigger: /fetch\($/,
      suggest: () => "'/api/data', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify(data),\n  })",
      confidence: 0.75 },

    // className
    { trigger: /className="$/,
      suggest: (_m, ctx) => {
        if (ctx.fileName.includes('Button') || ctx.lineContent.includes('<button')) return 'px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90"';
        if (ctx.lineContent.includes('<input') || ctx.lineContent.includes('<textarea')) return 'w-full px-3 py-2 rounded-lg border outline-none transition-colors"';
        return 'flex items-center gap-2 p-4 rounded-lg"';
      }, confidence: 0.7 },

    // Event handler
    { trigger: /onClick=\{$/,
      suggest: () => '() => {\n      \n    }}',
      confidence: 0.7 },

    // Zustand store
    { trigger: /create<\w+>\(\(set(, get)?\) => \(\{$/,
      suggest: () => '\n  // State\n  count: 0,\n  loading: false,\n\n  // Actions\n  increment: () => set((state) => ({ count: state.count + 1 })),\n  setLoading: (loading: boolean) => set({ loading }),\n}));',
      confidence: 0.85 },
  ],

  css: [
    { trigger: /display:\s*$/, suggest: () => 'flex;', confidence: 0.9 },
    { trigger: /\.(\w+) \{$/, suggest: () => '\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}', confidence: 0.7 },
    { trigger: /@media \($/, suggest: () => 'min-width: 768px) {\n  \n}', confidence: 0.8 },
    { trigger: /transition:\s*$/, suggest: () => 'all 0.2s ease-in-out;', confidence: 0.85 },
    { trigger: /background:\s*$/, suggest: () => 'linear-gradient(135deg, #0a0a0a, #1a1a1a);', confidence: 0.7 },
    { trigger: /animation:\s*$/, suggest: () => 'fadeIn 0.3s ease-in-out;', confidence: 0.8 },
  ],

  python: [
    { trigger: /def (\w+)\(self$/, suggest: (m) => {
      if (m[1] === '__init__') return '):\n        """Initialize instance."""\n        pass';
      return '):\n        """Method docstring."""\n        pass';
    }, confidence: 0.85 },
    { trigger: /class (\w+):$/, suggest: (m) => `\n    """${m[1]} class."""\n\n    def __init__(self):\n        pass`, confidence: 0.85 },
    { trigger: /if __name__ == $/, suggest: () => "'__main__':\n    main()", confidence: 0.95 },
    { trigger: /try:$/, suggest: () => '\n        result = None\n    except Exception as e:\n        print(f"Error: {e}")', confidence: 0.8 },
    { trigger: /with open\($/, suggest: () => "path, 'r') as f:\n        data = f.read()", confidence: 0.85 },
  ],

  rust: [
    { trigger: /fn (\w+)\($/, suggest: () => ') -> Result<(), Box<dyn std::error::Error>> {\n    Ok(())\n}', confidence: 0.8 },
    { trigger: /struct (\w+) \{$/, suggest: (m) => `\n    id: u64,\n    name: String,\n}\n\nimpl ${m[1]} {\n    fn new() -> Self {\n        Self { id: 0, name: String::new() }\n    }\n}`, confidence: 0.85 },
    { trigger: /match (\w+) \{$/, suggest: () => '\n    Some(val) => val,\n    None => todo!(),\n}', confidence: 0.8 },
  ],

  json: [
    { trigger: /"scripts":\s*\{$/, suggest: () => '\n    "dev": "vite",\n    "build": "tsc && vite build",\n    "preview": "vite preview"\n  }', confidence: 0.9 },
    { trigger: /"dependencies":\s*\{$/, suggest: () => '\n    "react": "^19.0.0",\n    "react-dom": "^19.0.0"\n  }', confidence: 0.85 },
  ],

  markdown: [
    { trigger: /^# $/, suggest: () => 'Project Title\n\n## Overview\n\nDescription here.\n\n## Installation\n\n```bash\nnpm install\n```', confidence: 0.75 },
    { trigger: /```(\w*)$/, suggest: () => '\ncode here\n```', confidence: 0.7 },
  ],
};

// ── Sovereign Templates ──────────────────────────────────────────────
// Patterns that embed sovereignty-by-design into code

const SOVEREIGN_COMPLETIONS: { trigger: RegExp; suggest: (ctx: CompletionContext) => string | null; confidence: number }[] = [
  // localStorage / encryption pattern
  {
    trigger: /(?:localStorage|sessionStorage)\.setItem\($/,
    suggest: () => {
      return "key, JSON.stringify(data)); // HAVEN: Consider encrypting sensitive data before storage";
    },
    confidence: 0.8,
  },
  // fetch with privacy header
  {
    trigger: /headers:\s*\{$/,
    suggest: () => "\n      'Content-Type': 'application/json',\n      'X-Sovereign': 'true', // No tracking, no telemetry\n    }",
    confidence: 0.7,
  },
  // Zero-telemetry pattern
  {
    trigger: /\/\/ (?:TODO|FIXME):\s*(?:add|implement)\s*(?:analytics|tracking|telemetry)/i,
    suggest: () => '\n// HAVEN: Sovereign by design — no external analytics.\n// All metrics stay on-device via localStorage.',
    confidence: 0.95,
  },
];

// ── Arabic Comment Suggestions ───────────────────────────────────────

const ARABIC_COMMENTS: { trigger: RegExp; suggest: string; confidence: number }[] = [
  { trigger: /\/\/ نية:?\s*$/, suggest: ' المكون الأساسي للواجهة', confidence: 0.7 },
  { trigger: /\/\/ هدف:?\s*$/, suggest: ' معالجة البيانات محليًا بدون أي اتصال خارجي', confidence: 0.7 },
  { trigger: /\/\/ ملاحظة:?\s*$/, suggest: ' تأكد من التشفير قبل التخزين', confidence: 0.7 },
  { trigger: /\/\/ سيادي:?\s*$/, suggest: ' 100% محلي — لا تتبع، لا سحابة، لا تحيز', confidence: 0.85 },
  { trigger: /\/\/ أمان:?\s*$/, suggest: ' AES-256-GCM + Argon2 + Ed25519', confidence: 0.8 },
];

// ── Intent-Aware Completions (uses NiyahEngine memory) ───────────────

function getIntentCompletion(ctx: CompletionContext): NiyahSuggestion | null {
  const recentSessions = niyahEngine.getRecentSessions(5);
  if (recentSessions.length === 0) return null;

  const lastSession = recentSessions[recentSessions.length - 1];
  const recentDomain = lastSession.vector.domain;
  const recentIntent = lastSession.vector.intent.toLowerCase();

  // If user was recently working on security → suggest security patterns
  if (recentDomain === 'security' && /(?:function|const|let)\s+\w*(?:auth|login|pass|crypt|token|key)/i.test(ctx.lineContent)) {
    return {
      text: ' // HAVEN: Niyah detected security intent — use Argon2 + AES-256-GCM for sovereign-grade protection',
      kind: 'intent',
      confidence: 0.6,
      label: 'Niyah: Security context detected',
    };
  }

  // If user was working on content → suggest content helpers
  if (recentDomain === 'content' && /(?:const|let)\s+\w*(?:text|content|message|post|tweet)/i.test(ctx.lineContent)) {
    return {
      text: " = ''; // Niyah: Content intent active — consider dialect-aware formatting",
      kind: 'intent',
      confidence: 0.5,
      label: 'Niyah: Content context',
    };
  }

  // If user was working on code and mentions similar intent
  if (recentDomain === 'code' && recentIntent.includes('api') && /fetch|axios|request/i.test(ctx.lineContent)) {
    return {
      text: ' // Niyah: In-kingdom API endpoint recommended for sovereignty compliance',
      kind: 'intent',
      confidence: 0.55,
      label: 'Niyah: API sovereignty hint',
    };
  }

  return null;
}

// ── File Context Completions ─────────────────────────────────────────

function getFileContextCompletion(ctx: CompletionContext): NiyahSuggestion | null {
  const fileCtx = detectFileContext(ctx.fileName);
  const imports = getImports(ctx.fullText);
  const line = ctx.lineContent;

  // Hook file → suggest hook boilerplate
  if (fileCtx.isHook && /^export\s*$/.test(line.trim())) {
    const hookName = ctx.fileName.replace(/\.(ts|tsx)$/, '');
    return {
      text: `function ${hookName}() {\n  const [state, setState] = useState(null);\n\n  useEffect(() => {\n    // Effect\n  }, []);\n\n  return { state };\n}`,
      kind: 'context',
      confidence: 0.8,
      label: `Hook boilerplate for ${hookName}`,
    };
  }

  // Store file → Zustand boilerplate
  if (fileCtx.isStore && /^(?:export\s+)?(?:const|interface)\s*$/.test(line.trim())) {
    return {
      text: "interface StoreState {\n  // State\n  loading: boolean;\n  error: string | null;\n  \n  // Actions\n  setLoading: (v: boolean) => void;\n  reset: () => void;\n}",
      kind: 'context',
      confidence: 0.75,
      label: 'Zustand store type',
    };
  }

  // Component file — suggest return JSX if function body is empty
  if (fileCtx.isComponent && /^\s*return\s*\(\s*$/.test(line)) {
    const compName = ctx.fileName.replace(/\.(tsx|jsx)$/, '');
    return {
      text: `\n    <div className="flex flex-col gap-4 p-4">\n      <h1 className="text-xl font-bold">${compName}</h1>\n    </div>\n  );`,
      kind: 'context',
      confidence: 0.7,
      label: `JSX for ${compName}`,
    };
  }

  // Test file → suggest test boilerplate
  if (fileCtx.isTest && /^(?:describe|it|test)\($/.test(line.trim())) {
    return {
      text: "'should work correctly', () => {\n    expect(true).toBe(true);\n  });",
      kind: 'context',
      confidence: 0.8,
      label: 'Test case boilerplate',
    };
  }

  // Missing import detection
  if (imports.has('useState') && !imports.has('useEffect') && ctx.fullText.includes('useEffect')) {
    // Doesn't trigger as inline, but could be a diagnostic
  }

  return null;
}

// ══════════════════════════════════════════════════════════════════════
// MAIN COMPLETION FUNCTION
// ══════════════════════════════════════════════════════════════════════

export function getNiyahCompletion(ctx: CompletionContext): NiyahSuggestion | null {
  const { lineContent, language } = ctx;
  const trimmed = lineContent.trimEnd();

  // ── 1. Sovereign completions (highest priority for sovereign patterns) ──
  for (const s of SOVEREIGN_COMPLETIONS) {
    const m = trimmed.match(s.trigger);
    if (m) {
      const text = s.suggest(ctx);
      if (text) return { text, kind: 'sovereign', confidence: s.confidence, label: 'Sovereign pattern' };
    }
  }

  // ── 2. Arabic comment completions ──
  for (const a of ARABIC_COMMENTS) {
    if (a.trigger.test(trimmed)) {
      return { text: a.suggest, kind: 'arabic', confidence: a.confidence, label: 'Arabic comment' };
    }
  }

  // ── 3. Pattern-based (language-specific) ──
  const langPatterns = PATTERNS[language] || PATTERNS['typescript'] || [];
  for (const p of langPatterns) {
    const m = trimmed.match(p.trigger);
    if (m) {
      const text = p.suggest(m, ctx);
      if (text) return { text, kind: 'pattern', confidence: p.confidence };
    }
  }

  // ── 4. File context completions ──
  const fileCtx = getFileContextCompletion(ctx);
  if (fileCtx) return fileCtx;

  // ── 5. Intent-aware completions (Niyah Memory) ──
  const intentComp = getIntentCompletion(ctx);
  if (intentComp) return intentComp;

  // ── 6. Smart fallbacks ──
  if (/const \w+\s*$/.test(trimmed)) return { text: ' = ', kind: 'pattern', confidence: 0.5 };
  if (/function \w+$/.test(trimmed)) return { text: '() {\n  \n}', kind: 'pattern', confidence: 0.5 };

  return null;
}

// ══════════════════════════════════════════════════════════════════════
// MULTI-SUGGESTION API (returns ranked alternatives)
// ══════════════════════════════════════════════════════════════════════

export function getNiyahCompletions(ctx: CompletionContext, maxResults = 3): NiyahSuggestion[] {
  const results: NiyahSuggestion[] = [];

  // Collect from all sources
  for (const s of SOVEREIGN_COMPLETIONS) {
    const m = ctx.lineContent.trimEnd().match(s.trigger);
    if (m) {
      const text = s.suggest(ctx);
      if (text) results.push({ text, kind: 'sovereign', confidence: s.confidence, label: 'Sovereign' });
    }
  }

  for (const a of ARABIC_COMMENTS) {
    if (a.trigger.test(ctx.lineContent.trimEnd())) {
      results.push({ text: a.suggest, kind: 'arabic', confidence: a.confidence, label: 'Arabic' });
    }
  }

  const langPatterns = PATTERNS[ctx.language] || PATTERNS['typescript'] || [];
  for (const p of langPatterns) {
    const m = ctx.lineContent.trimEnd().match(p.trigger);
    if (m) {
      const text = p.suggest(m, ctx);
      if (text) results.push({ text, kind: 'pattern', confidence: p.confidence });
    }
  }

  const fileCtx = getFileContextCompletion(ctx);
  if (fileCtx) results.push(fileCtx);

  const intent = getIntentCompletion(ctx);
  if (intent) results.push(intent);

  // Sort by confidence (descending) and limit
  return results
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxResults);
}

// ══════════════════════════════════════════════════════════════════════
// FIM-FIRST ASYNC COMPLETION (Ollama LLM + pattern fallback)
// This is the production API — CodeEditor should use this.
// ══════════════════════════════════════════════════════════════════════

/** Extended suggestion type that includes FIM results */
export interface NiyahFIMSuggestion extends NiyahSuggestion {
  kind: 'fim' | 'pattern' | 'context' | 'intent' | 'sovereign' | 'arabic';
  source: 'fim' | 'ollama' | 'cache' | 'pattern' | 'context' | 'intent' | 'sovereign' | 'arabic';
  model?: string;
  latencyMs?: number;
}

// ── FIM Completion Cache ─────────────────────────────────────────────

interface FIMCacheEntry {
  text: string;
  timestamp: number;
  model: string;
}

class FIMCompletionCache {
  private cache: Map<string, FIMCacheEntry> = new Map();
  private readonly maxSize = 128;
  private readonly ttlMs = 30_000; // 30 seconds — code context changes fast

  private makeKey(prefix: string, suffix: string): string {
    // Hash based on last 150 chars of prefix + first 100 chars of suffix
    return `${prefix.slice(-150)}|||${suffix.slice(0, 100)}`;
  }

  get(prefix: string, suffix: string): FIMCacheEntry | null {
    const key = this.makeKey(prefix, suffix);
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    // LRU: move to end
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry;
  }

  set(prefix: string, suffix: string, text: string, model: string): void {
    const key = this.makeKey(prefix, suffix);
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(key, { text, timestamp: Date.now(), model });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

const fimCache = new FIMCompletionCache();

// ── Debounce State ───────────────────────────────────────────────────

let pendingFIMTimer: ReturnType<typeof setTimeout> | null = null;
let pendingFIMReject: ((reason: string) => void) | null = null;

/** Cancel any in-flight FIM request */
export function cancelPendingFIM(): void {
  if (pendingFIMTimer) {
    clearTimeout(pendingFIMTimer);
    pendingFIMTimer = null;
  }
  if (pendingFIMReject) {
    pendingFIMReject('cancelled');
    pendingFIMReject = null;
  }
}

// ── Main Async FIM Completion ────────────────────────────────────────

/**
 * Production-grade completion function.
 * Order of resolution:
 *   1. FIM cache hit → instant (0ms)
 *   2. Fast pattern match → instant (0ms, for common triggers)
 *   3. Ollama FIM completion → ~100-2000ms (real AI, debounced)
 *   4. Pattern fallback if Ollama unavailable
 *
 * @param prefix   All text before cursor
 * @param suffix   All text after cursor
 * @param ctx      Completion context (line, file, language, etc.)
 * @param opts     FIM options
 */
export async function getNiyahCompletionAsync(
  prefix: string,
  suffix: string,
  ctx: CompletionContext,
  opts: {
    debounceMs?: number;
    maxTokens?: number;
    temperature?: number;
    timeoutMs?: number;
  } = {},
): Promise<NiyahFIMSuggestion | null> {
  const {
    debounceMs = 150,
    maxTokens = 180,
    temperature = 0.1,
    timeoutMs = 8000,
  } = opts;

  // ── Layer 0: Cache Hit ─────────────────────────────────────
  const cached = fimCache.get(prefix, suffix);
  if (cached) {
    return {
      text: cached.text,
      kind: 'fim',
      source: 'cache',
      confidence: 0.85,
      model: cached.model,
      latencyMs: 0,
      label: 'Cached FIM',
    };
  }

  // ── Layer 1: Fast pattern check (sovereign + arabic + common triggers) ──
  // These are instant and high-confidence — serve them immediately
  const patternResult = getNiyahCompletion(ctx);
  if (patternResult && patternResult.confidence >= 0.85) {
    return {
      ...patternResult,
      source: patternResult.kind,
      label: patternResult.label || `Pattern (${patternResult.kind})`,
    };
  }

  // ── Layer 2: Ollama FIM (debounced) ────────────────────────
  if (ollamaService.getStatus() === 'connected') {
    try {
      // Cancel previous pending request
      cancelPendingFIM();

      const fimResult = await new Promise<string | null>((resolve, reject) => {
        pendingFIMReject = reject as (reason: string) => void;
        pendingFIMTimer = setTimeout(async () => {
          pendingFIMTimer = null;
          pendingFIMReject = null;
          try {
            const model = modelRouter.resolveModel('cognitive');
            const timeoutId = setTimeout(() => resolve(null), timeoutMs);

            const result = await ollamaService.complete(model, prefix, suffix, {
              maxTokens,
              temperature,
            });

            clearTimeout(timeoutId);

            if (result && result.trim()) {
              // Clean up common FIM artifacts
              let cleaned = result.trim();
              // Stop at obvious cutoffs
              for (const marker of ['<|', '\n\n\n']) {
                const idx = cleaned.indexOf(marker);
                if (idx > 5) cleaned = cleaned.substring(0, idx).trimEnd();
              }

              if (cleaned) {
                fimCache.set(prefix, suffix, cleaned, model);
                resolve(cleaned);
                return;
              }
            }
            resolve(null);
          } catch (err) {
            if ((err as Error).name === 'AbortError') {
              resolve(null);
            } else {
              resolve(null); // Don't propagate — fall through to pattern
            }
          }
        }, debounceMs);
      });

      if (fimResult) {
        return {
          text: fimResult,
          kind: 'fim',
          source: 'ollama',
          confidence: 0.9,
          model: modelRouter.resolveModel('cognitive'),
          label: 'Ollama FIM',
        };
      }
    } catch {
      // Debounce cancelled or timeout — fall through
    }
  }

  // ── Layer 3: Pattern fallback (the result we skipped for low confidence) ──
  if (patternResult) {
    return {
      ...patternResult,
      source: patternResult.kind,
      label: patternResult.label || `Pattern (${patternResult.kind})`,
    };
  }

  return null;
}

// ── Cache Management API ─────────────────────────────────────────────

export function clearFIMCache(): void {
  fimCache.clear();
}

export function getFIMCacheSize(): number {
  return fimCache.size;
}
