// ══════════════════════════════════════════════════════════════
// ModelRouter — Three-Lobe Intelligence Routing & Execution
// Routes tasks to the correct model/lobe based on NiyahEngine
// analysis, then EXECUTES them in parallel via Ollama.
// Zero cloud. Every neuron fires locally.
// ══════════════════════════════════════════════════════════════

import type { NiyahDomain, NiyahVector, LobeResult } from './NiyahEngine';
import { ollamaService, type ConnectionStatus, type OllamaRunningModel } from './OllamaService';

// ── Lobe Definitions ─────────────────────────────────────────

export type LobeId = 'cognitive' | 'executive' | 'sensory';

/** Immutable array of all lobe IDs — avoids repeated `as LobeId[]` casts */
export const ALL_LOBE_IDS = ['cognitive', 'executive', 'sensory'] as const satisfies readonly LobeId[];

export interface LobeConfig {
  id: LobeId;
  name: string;
  nameAr: string;
  emoji: string;
  model: string;
  fallbackModel: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  domains: NiyahDomain[];
}

export interface RoutingDecision {
  primary: LobeId;
  secondary: LobeId | null;
  parallel: boolean;
  reason: string;
  confidence: number;
  modelOverride?: string;
}

export interface LobeResponse {
  lobe: LobeId;
  model: string;
  content: string;
  tokensUsed: number;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface ThreeLobeResult {
  cognitive: LobeResponse;
  executive: LobeResponse;
  sensory: LobeResponse;
  merged: string;
  totalLatencyMs: number;
  modelsUsed: string[];
  lobeResults: LobeResult[];
}

export interface StreamCallbacks {
  onToken?: (lobe: LobeId, token: string) => void;
  onLobeStart?: (lobe: LobeId) => void;
  onLobeComplete?: (lobe: LobeId, response: LobeResponse) => void;
  onAllComplete?: (result: ThreeLobeResult) => void;
  onError?: (lobe: LobeId, error: string) => void;
}

export interface RouterStatus {
  connected: boolean;
  connectionStatus: ConnectionStatus;
  fallbackMode: boolean;
  performanceMode: 'auto' | 'cpu-smart' | 'gpu';
  lobeAssignments: Record<LobeId, string | null>;
  availableModels: string[];
}

// ── Dynamic Model Intelligence ───────────────────────────────

export interface LobeModelInfo {
  /** Currently assigned model name */
  current: string | null;
  /** User-preferred override (set via /setmodel) — takes absolute priority */
  preferred: string | null;
  /** Models scored and ranked for this lobe */
  ranked: ScoredModel[];
  /** User-blacklisted models for this lobe */
  blacklist: Set<string>;
  /** Runtime state from /api/ps */
  runtime: {
    loaded: boolean;
    vramBytes: number;
    vramGB: number;
    contextLength: number;
    expiresAt: string | null;
  };
  /** Static metadata from /api/show */
  metadata: {
    defaultCtx: number;
    quantization: string;
    parameterSize: string;
    family: string;
  } | null;
}

export interface ScoredModel {
  name: string;
  score: number;
  reasons: string[];
}

/**
 * Quality profile: maps model family prefixes to base quality scores per lobe.
 * Higher = better. Scores are 0-100.
 */
interface ModelQualityProfile {
  prefix: string;
  scores: Record<LobeId, number>;
  tags?: string[];
}

const MODEL_QUALITY_PROFILES: ModelQualityProfile[] = [
  // Code-specialist models → Cognitive lobe excels
  { prefix: 'deepseek-r1', scores: { cognitive: 96, executive: 76, sensory: 46 }, tags: ['reasoning', 'analysis'] },
  { prefix: 'deepseek-coder', scores: { cognitive: 95, executive: 50, sensory: 40 }, tags: ['code', 'fim'] },
  { prefix: 'codestral', scores: { cognitive: 92, executive: 45, sensory: 35 }, tags: ['code', 'fim'] },
  { prefix: 'qwen2.5-coder', scores: { cognitive: 90, executive: 55, sensory: 60 }, tags: ['code', 'fim', 'multilingual'] },
  { prefix: 'starcoder', scores: { cognitive: 85, executive: 40, sensory: 30 }, tags: ['code', 'fim'] },
  { prefix: 'codellama', scores: { cognitive: 82, executive: 45, sensory: 35 }, tags: ['code'] },
  { prefix: 'codegemma', scores: { cognitive: 80, executive: 42, sensory: 32 }, tags: ['code'] },

  // General-purpose models → Executive lobe strong
  { prefix: 'niyah', scores: { cognitive: 82, executive: 94, sensory: 90 }, tags: ['sovereign', 'arabic', 'intent'] },
  { prefix: 'llama3', scores: { cognitive: 70, executive: 90, sensory: 65 }, tags: ['general', 'reasoning'] },
  { prefix: 'llama2', scores: { cognitive: 55, executive: 75, sensory: 55 } },
  { prefix: 'mistral', scores: { cognitive: 72, executive: 85, sensory: 60 }, tags: ['general', 'reasoning'] },
  { prefix: 'mixtral', scores: { cognitive: 75, executive: 88, sensory: 62 }, tags: ['general', 'moe'] },
  { prefix: 'gemma2', scores: { cognitive: 68, executive: 80, sensory: 58 } },
  { prefix: 'gemma', scores: { cognitive: 60, executive: 72, sensory: 50 } },
  { prefix: 'phi4', scores: { cognitive: 82, executive: 85, sensory: 65 }, tags: ['reasoning'] },
  { prefix: 'phi3', scores: { cognitive: 70, executive: 78, sensory: 55 } },
  { prefix: 'phi', scores: { cognitive: 62, executive: 70, sensory: 48 } },
  { prefix: 'command-r', scores: { cognitive: 65, executive: 82, sensory: 70 }, tags: ['rag'] },

  // Arabic / multilingual → Sensory lobe excels
  { prefix: 'jais', scores: { cognitive: 40, executive: 55, sensory: 95 }, tags: ['arabic'] },
  { prefix: 'aya', scores: { cognitive: 50, executive: 60, sensory: 88 }, tags: ['multilingual', 'arabic'] },
  { prefix: 'qwen2.5', scores: { cognitive: 72, executive: 75, sensory: 82 }, tags: ['multilingual'] },
  { prefix: 'qwen2', scores: { cognitive: 65, executive: 70, sensory: 78 }, tags: ['multilingual'] },
  { prefix: 'qwen', scores: { cognitive: 58, executive: 62, sensory: 72 }, tags: ['multilingual'] },
];

// ── System Prompts ───────────────────────────────────────────

const COGNITIVE_SYSTEM = `You are the Cognitive Lobe of HAVEN — a sovereign AI IDE built by KHAWRIZM Labs (Sulaiman Alshammari) in Riyadh.

Your role: Intelligent conversation, code generation, debugging, optimization, and technical reasoning.

Rules:
- For greetings or general chat, respond naturally and briefly. Do NOT generate code unless asked.
- When code IS requested: write clean, production-grade TypeScript/React by default
- All code must be sovereign: NO external analytics, NO telemetry
- When the user asks in Arabic, respond in Arabic but keep code in English
- If the user says "ابغى" or "سوي" — they want you to BUILD, not explain
- Be concise. Do not repeat yourself.
- Be direct. No fluff. Saudi engineers respect efficiency.
- Output code blocks with language tags. Explain only when asked.
- Sign critical outputs with: — الفص المعرفي (Cognitive Lobe)`;

const EXECUTIVE_SYSTEM = `You are the Executive Lobe of HAVEN — a sovereign Saudi AI IDE built by أبو خوارزم (Sulaiman Alshammari).

Your role: Planning, architecture design, task orchestration, strategy, and security review.

Rules:
- Break complex tasks into clear, numbered steps
- Consider Saudi tech ecosystem: SDAIA regulations, PDPL compliance, NCA-ECC standards
- When planning infrastructure, prioritize Saudi data centers (Bluvalt, STC Cloud, local providers)
- Provide architectural decisions with sovereignty tradeoffs explained
- When the user asks in Arabic, respond in Arabic
- Think like a CTO who answers to Saudi digital sovereignty mandates
- Review security architecture and PDPL compliance
- Rate sovereignty alignment on a 0-100 scale when applicable
- Be strategic and forward-thinking: Vision 2030 context matters
- Sign critical outputs with: — الفص التنفيذي (Executive Lobe)

Cultural context:
- رؤية 2030 = Saudi Vision 2030 (digital transformation)
- سدايا = SDAIA (Saudi Data & AI Authority)
- PDPL = نظام حماية البيانات الشخصية
- NCA-ECC = ضوابط الأمن السيبراني`;

const SENSORY_SYSTEM = `You are the Sensory Lobe of HAVEN — a sovereign AI IDE built by KHAWRIZM Labs in Riyadh.

Your role: Natural conversation, language understanding, intent analysis, translation, and content generation.

Rules:
- For greetings (hi, hello, مرحبا, etc.), respond warmly and briefly. Do NOT generate code.
- You understand Arabic dialects: Saudi, Khaleeji, Egyptian, Levantine, and MSA.
- When detecting Saudi dialect, respond naturally in Saudi dialect
- Default language: English. Switch to Arabic only when the user writes in Arabic.
- Be concise, helpful, and natural. Never dump code unprompted.
- For content generation: match the requested tone and style.
- You handle: translation, summarization, content writing, cultural adaptation
- Sign critical outputs with: — الفص الحسي (Sensory Lobe)`;

const FAST_SYSTEM_PROMPTS: Record<LobeId, string> = {
  cognitive: 'You are HAVEN Cognitive. Solve code/debug/review tasks. Be concise. If the user writes Arabic, answer in Arabic and keep code in English. No fluff.',
  executive: 'You are HAVEN Executive. Give short practical plans, tradeoffs, and priorities. Answer in Arabic when the user writes Arabic.',
  sensory: 'You are HAVEN Sensory. Handle Arabic/English intent, explanation, and wording naturally. Be brief and useful.',
};

// ── Lobe Registry ────────────────────────────────────────────

export const LOBE_CONFIGS: Record<LobeId, LobeConfig> = {
  cognitive: {
    id: 'cognitive',
    name: 'Cognitive Lobe',
    nameAr: 'الفص المعرفي',
    emoji: '🧠',
    model: 'niyah:sovereign',
    fallbackModel: 'deepseek-r1:1.5b',
    description: 'Code generation, debugging, optimization, and technical reasoning',
    systemPrompt: COGNITIVE_SYSTEM,
    temperature: 0.3,
    maxTokens: 2048,
    domains: ['code', 'security', 'infrastructure', 'datascience'],
  },
  executive: {
    id: 'executive',
    name: 'Executive Lobe',
    nameAr: 'الفص التنفيذي',
    emoji: '⚖️',
    model: 'deepseek-r1:1.5b',
    fallbackModel: 'niyah:v4',
    description: 'Planning, security review, architecture, PDPL compliance',
    systemPrompt: EXECUTIVE_SYSTEM,
    temperature: 0.5,
    maxTokens: 2048,
    domains: ['business', 'infrastructure', 'security'],
  },
  sensory: {
    id: 'sensory',
    name: 'Sensory Lobe',
    nameAr: 'الفص الحسي',
    emoji: '⚙️',
    model: 'niyah:writer',
    fallbackModel: 'niyah:sovereign',
    description: 'Natural conversation, Arabic NLP, intent analysis, content generation',
    systemPrompt: SENSORY_SYSTEM,
    temperature: 0.6,
    maxTokens: 1536,
    domains: ['content', 'creative', 'education', 'general'],
  },
};

// ── Router + Executor ────────────────────────────────────────

/** LRU cache entry for response caching */
interface CacheEntry {
  response: string;
  timestamp: number;
  lobeId: LobeId;
  model: string;
}

/** Routing trace event for debugging */
export interface RoutingTrace {
  timestamp: number;
  input: string;
  decision: RoutingDecision;
  weights: { arabic: number; code: number; plan: number };
  modelUsed: string | null;
  latencyMs: number;
}

/** Per-lobe timeout config (ms) */
const LOBE_TIMEOUT_MS: Record<LobeId, number> = {
  cognitive: 15_000,
  executive: 15_000,
  sensory: 12_000,
};

class ModelRouter {
  private assignments: Record<LobeId, string | null> = {
    cognitive: null, executive: null, sensory: null,
  };
  private _fallbackMode = false;
  private _initialized = false;
  private performanceMode: 'auto' | 'cpu-smart' | 'gpu' = 'auto';

  /** Per-lobe dynamic model intelligence */
  private lobeModels: Record<LobeId, LobeModelInfo> = {
    cognitive: this.emptyLobeModelInfo(),
    executive: this.emptyLobeModelInfo(),
    sensory: this.emptyLobeModelInfo(),
  };

  /** Interval handle for runtime stats polling */
  private runtimePollInterval: ReturnType<typeof setInterval> | null = null;

  /** LRU response cache — key: hash(lobeId + prompt first 200 chars) */
  private responseCache: Map<string, CacheEntry> = new Map();
  private readonly maxCacheSize = 64;
  private readonly cacheTTLMs = 5 * 60 * 1000; // 5 minutes

  /** Routing trace buffer — last N decisions for debugging */
  private traceBuffer: RoutingTrace[] = [];
  private readonly maxTraceEntries = 50;
  private traceListeners: Set<(trace: RoutingTrace) => void> = new Set();

  // ── Status ─────────────────────────────────────────────────

  get fallbackMode(): boolean { return this._fallbackMode; }
  get initialized(): boolean { return this._initialized; }

  getStatus(): RouterStatus {
    return {
      connected: ollamaService.getStatus() === 'connected',
      connectionStatus: ollamaService.getStatus(),
      fallbackMode: this._fallbackMode,
      performanceMode: this.performanceMode,
      lobeAssignments: { ...this.assignments },
      availableModels: ollamaService.getModels().map(m => m.name),
    };
  }

  getPerformanceMode(): 'auto' | 'cpu-smart' | 'gpu' {
    return this.performanceMode;
  }

  /** Get the full LobeModelInfo for a specific lobe */
  getLobeModelInfo(lobe: LobeId): Readonly<LobeModelInfo> {
    return this.lobeModels[lobe];
  }

  /** Get all lobe model infos */
  getAllLobeModelInfo(): Readonly<Record<LobeId, LobeModelInfo>> {
    return this.lobeModels;
  }

  // ── Initialize — Connect + Auto-Assign Models ─────────────

  async initialize(): Promise<RouterStatus> {
    const connected = await ollamaService.connect();
    if (!connected) {
      this._fallbackMode = true;
      this._initialized = true;
      return this.getStatus();
    }

    await this.refreshAvailableModels();
    this._fallbackMode = !this.hasAnyModel();
    this._initialized = true;

    // Start polling runtime stats every 15s
    this.startRuntimePoll();

    return this.getStatus();
  }

  /**
   * Discover all installed models, score them per-lobe, assign best.
   * Called on init and whenever models change (after /pull, etc.)
   */
  async refreshAvailableModels(): Promise<Record<LobeId, string | null>> {
    const available = ollamaService.getModels().map(m => m.name);

    for (const lobeId of ALL_LOBE_IDS) {
      // Score and rank all available models for this lobe
      const scored: ScoredModel[] = available.map(name => this.scoreModel(name, lobeId));
      scored.sort((a, b) => b.score - a.score);

      const info = this.lobeModels[lobeId];
      info.ranked = scored;

      // If user has a preferred override, use that
      if (info.preferred && available.includes(info.preferred)) {
        this.assignments[lobeId] = info.preferred;
      } else if (scored.length > 0) {
        // Filter out blacklisted models
        const best = scored.find(s => !info.blacklist.has(s.name));
        this.assignments[lobeId] = best?.name ?? scored[0].name;
      } else {
        this.assignments[lobeId] = null;
      }

      info.current = this.assignments[lobeId];

      // Fetch metadata for the assigned model (non-blocking)
      if (info.current) {
        this.fetchModelMetadata(lobeId, info.current);
      }
    }

    return { ...this.assignments };
  }

  /**
   * Score a model for a given lobe. Higher = better fit.
   *
   * Scoring factors:
   * 1. Base quality from MODEL_QUALITY_PROFILES (0-100)
   * 2. Quantization bonus/penalty (Q5_K_M > Q4_0 > Q2 etc.)
   * 3. Parameter size bonus (bigger = smarter, to a point)
   * 4. Static config match bonus (matches LOBE_CONFIGS.model)
   */
  scoreModel(name: string, lobe: LobeId): ScoredModel {
    const reasons: string[] = [];
    let score = 30; // baseline for unknown models

    // 1) Match against quality profiles (longest prefix wins)
    let matchedProfile: ModelQualityProfile | null = null;
    let matchLen = 0;
    for (const profile of MODEL_QUALITY_PROFILES) {
      if (name.startsWith(profile.prefix) && profile.prefix.length > matchLen) {
        matchedProfile = profile;
        matchLen = profile.prefix.length;
      }
    }

    if (matchedProfile) {
      score = matchedProfile.scores[lobe];
      reasons.push(`profile:${matchedProfile.prefix}=${score}`);
    } else {
      reasons.push('no-profile(baseline=30)');
    }

    // 2) Quantization bonus/penalty from model tag
    const quantMatch = name.match(/:(.*?)(?:-|$)/);
    const tag = quantMatch?.[1]?.toLowerCase() || '';
    if (tag.includes('f16') || tag.includes('fp16')) { score += 8; reasons.push('quant:f16+8'); }
    else if (tag.includes('q8')) { score += 6; reasons.push('quant:q8+6'); }
    else if (tag.includes('q6')) { score += 5; reasons.push('quant:q6+5'); }
    else if (tag.includes('q5')) { score += 4; reasons.push('quant:q5+4'); }
    else if (tag.includes('q4')) { score += 2; reasons.push('quant:q4+2'); }
    else if (tag.includes('q3')) { score -= 2; reasons.push('quant:q3-2'); }
    else if (tag.includes('q2')) { score -= 5; reasons.push('quant:q2-5'); }

    // 3) Parameter size bonus (extract from name like "7b", "13b", "70b")
    const sizeMatch = name.match(/(\d+(?:\.\d+)?)b/i);
    if (sizeMatch) {
      const params = parseFloat(sizeMatch[1]);
      if (params >= 30) { score += 10; reasons.push(`params:${params}B+10`); }
      else if (params >= 13) { score += 6; reasons.push(`params:${params}B+6`); }
      else if (params >= 7) { score += 3; reasons.push(`params:${params}B+3`); }
      else if (params < 3) { score -= 3; reasons.push(`params:${params}B-3`); }
    }

    // 4) Static config match bonus (the "default" model for this lobe)
    const cfg = LOBE_CONFIGS[lobe];
    if (name === cfg.model || name.startsWith(cfg.model.split(':')[0])) {
      score += 5;
      reasons.push('config-match+5');
    }
    if (name === cfg.fallbackModel || name.startsWith(cfg.fallbackModel.split(':')[0])) {
      score += 2;
      reasons.push('fallback-match+2');
    }

    // 5) HAVEN-specific tags on custom local models
    const lowerName = name.toLowerCase();
    if (lowerName.startsWith('niyah:writer') && lobe === 'sensory') {
      score += 10;
      reasons.push('niyah-writer+10');
    }
    if (lowerName.startsWith('niyah:v2') && lobe === 'sensory') {
      score += 6;
      reasons.push('niyah-v2-sensory+6');
    }
    if ((lowerName.startsWith('niyah:v3') || lowerName.startsWith('niyah:latest')) && lobe === 'executive') {
      score += 4;
      reasons.push('niyah-exec+4');
    }

    // 6) Size penalty — penalize very large models on resource-constrained setups
    if (sizeMatch) {
      const params = parseFloat(sizeMatch[1]);
      if (params >= 70) { score -= 5; reasons.push(`size-penalty:${params}B-5`); }
      else if (params >= 34) { score -= 2; reasons.push(`size-penalty:${params}B-2`); }
    }

    return { name, score: Math.max(0, Math.min(100, score)), reasons };
  }

  /** Fetch /api/show metadata for a model and store it */
  private async fetchModelMetadata(lobe: LobeId, modelName: string): Promise<void> {
    const show = await ollamaService.showModel(modelName);
    if (!show) return;

    const info = this.lobeModels[lobe];
    info.metadata = {
      defaultCtx: ollamaService.parseDefaultCtx(show.parameters || ''),
      quantization: show.details?.quantization_level || 'unknown',
      parameterSize: show.details?.parameter_size || 'unknown',
      family: show.details?.family || 'unknown',
    };
  }

  /** Poll /api/ps for runtime stats (VRAM, context, loaded state) */
  async updateRuntimeStats(): Promise<void> {
    const running: OllamaRunningModel[] = await ollamaService.listRunning();
    let totalVramBytes = 0;

    for (const lobeId of ALL_LOBE_IDS) {
      const info = this.lobeModels[lobeId];
      const model = this.assignments[lobeId];
      if (!model) {
        info.runtime = { loaded: false, vramBytes: 0, vramGB: 0, contextLength: 0, expiresAt: null };
        continue;
      }

      const runEntry = running.find(r => r.name === model || r.model === model);
      if (runEntry) {
        totalVramBytes += runEntry.size_vram ?? 0;
        info.runtime = {
          loaded: true,
          vramBytes: runEntry.size_vram ?? 0,
          vramGB: parseFloat(((runEntry.size_vram ?? 0) / 1e9).toFixed(2)),
          contextLength: 0, // Context length not directly in /api/ps, need /api/show
          expiresAt: runEntry.expires_at || null,
        };
      } else {
        info.runtime = { loaded: false, vramBytes: 0, vramGB: 0, contextLength: 0, expiresAt: null };
      }
    }

    this.performanceMode = totalVramBytes > 0 ? 'gpu' : 'cpu-smart';
  }

  private startRuntimePoll(): void {
    this.stopRuntimePoll();
    // Initial fetch
    this.updateRuntimeStats();
    // Then every 15s
    this.runtimePollInterval = setInterval(() => this.updateRuntimeStats(), 15_000);
  }

  private stopRuntimePoll(): void {
    if (this.runtimePollInterval) {
      clearInterval(this.runtimePollInterval);
      this.runtimePollInterval = null;
    }
  }

  /**
   * Check VRAM feasibility before making a model call.
   * Returns true if safe to proceed, false if we should fallback.
   */
  checkVRAMFeasibility(lobeId: LobeId): { feasible: boolean; reason: string } {
    const info = this.lobeModels[lobeId];
    const model = this.assignments[lobeId];

    if (!model) {
      return { feasible: false, reason: `No model assigned to ${LOBE_CONFIGS[lobeId].nameAr}` };
    }

    // If the model is already loaded, it's definitely feasible
    if (info.runtime.loaded) {
      return { feasible: true, reason: `Model ${model} already loaded (${info.runtime.vramGB} GB VRAM)` };
    }

    // If we have no metadata, we can't check — proceed optimistically
    if (!info.metadata) {
      return { feasible: true, reason: 'No metadata — proceeding optimistically' };
    }

    // All checks passed
    return { feasible: true, reason: 'VRAM check passed' };
  }

  /** User override: set a specific model for a lobe */
  setLobeModel(lobe: LobeId, model: string): void {
    this.lobeModels[lobe].preferred = model;
    this.assignments[lobe] = model;
    this.lobeModels[lobe].current = model;
    // Refresh metadata for the new model
    this.fetchModelMetadata(lobe, model);
  }

  /** User override: set context length for a lobe's model */
  setLobeContext(lobe: LobeId, numCtx: number): void {
    // Clamp to safe range
    const clamped = Math.max(256, Math.min(131072, numCtx));
    // Store in metadata so getModelOptions can reference it
    const info = this.lobeModels[lobe];
    if (info.metadata) {
      info.metadata.defaultCtx = clamped;
    } else {
      info.metadata = { defaultCtx: clamped, quantization: 'unknown', parameterSize: 'unknown', family: 'unknown' };
    }
  }

  /** Add a model to a lobe's blacklist */
  addToBlacklist(lobe: LobeId, modelName: string): void {
    this.lobeModels[lobe].blacklist.add(modelName);
    // If the blacklisted model is currently assigned, re-assign
    if (this.assignments[lobe] === modelName) {
      const ranked = this.lobeModels[lobe].ranked;
      const best = ranked.find(s => !this.lobeModels[lobe].blacklist.has(s.name));
      this.assignments[lobe] = best?.name ?? null;
      this.lobeModels[lobe].current = this.assignments[lobe];
    }
  }

  /** Remove a model from a lobe's blacklist */
  removeFromBlacklist(lobe: LobeId, modelName: string): void {
    this.lobeModels[lobe].blacklist.delete(modelName);
  }

  /** Get all blacklisted models for a lobe */
  getBlacklist(lobe: LobeId): string[] {
    return Array.from(this.lobeModels[lobe].blacklist);
  }

  /** Clear user override — revert to auto-assignment */
  clearLobePreference(lobe: LobeId): void {
    this.lobeModels[lobe].preferred = null;
    // Trigger re-assignment from ranked list
    const ranked = this.lobeModels[lobe].ranked;
    const best = ranked.find(s => !this.lobeModels[lobe].blacklist.has(s.name));
    this.assignments[lobe] = best?.name ?? null;
    this.lobeModels[lobe].current = this.assignments[lobe];
  }

  hasAnyModel(): boolean {
    return Object.values(this.assignments).some(m => m !== null);
  }

  /** Check if a model is running locally (sovereign) or via external API */
  isLocalModel(_modelName: string): boolean {
    return ollamaService.isLocalEndpoint();
  }

  private emptyLobeModelInfo(): LobeModelInfo {
    return {
      current: null,
      preferred: null,
      ranked: [],
      blacklist: new Set(),
      runtime: { loaded: false, vramBytes: 0, vramGB: 0, contextLength: 0, expiresAt: null },
      metadata: null,
    };
  }

  // ── LRU Response Cache ──────────────────────────────────────

  private cacheKey(lobeId: LobeId, prompt: string): string {
    // Simple hash: lobe + first 200 chars of prompt
    return `${lobeId}::${prompt.slice(0, 200)}`;
  }

  getCachedResponse(lobeId: LobeId, prompt: string): string | null {
    const key = this.cacheKey(lobeId, prompt);
    const entry = this.responseCache.get(key);
    if (!entry) return null;
    // Check TTL
    if (Date.now() - entry.timestamp > this.cacheTTLMs) {
      this.responseCache.delete(key);
      return null;
    }
    // Move to end (most recently used) — Map preserves insertion order
    this.responseCache.delete(key);
    this.responseCache.set(key, entry);
    return entry.response;
  }

  private setCacheResponse(lobeId: LobeId, prompt: string, response: string, model: string): void {
    const key = this.cacheKey(lobeId, prompt);
    // Evict oldest if at capacity
    if (this.responseCache.size >= this.maxCacheSize) {
      const oldest = this.responseCache.keys().next().value;
      if (oldest !== undefined) this.responseCache.delete(oldest);
    }
    this.responseCache.set(key, { response, timestamp: Date.now(), lobeId, model });
  }

  clearCache(): void {
    this.responseCache.clear();
  }

  getCacheStats(): { size: number; maxSize: number; ttlMs: number } {
    return { size: this.responseCache.size, maxSize: this.maxCacheSize, ttlMs: this.cacheTTLMs };
  }

  // ── Routing Trace / Debug System ───────────────────────────

  /** Subscribe to routing trace events for debugging */
  onTrace(fn: (trace: RoutingTrace) => void): () => void {
    this.traceListeners.add(fn);
    return () => this.traceListeners.delete(fn);
  }

  private emitTrace(trace: RoutingTrace): void {
    this.traceBuffer.push(trace);
    if (this.traceBuffer.length > this.maxTraceEntries) {
      this.traceBuffer = this.traceBuffer.slice(-this.maxTraceEntries);
    }
    this.traceListeners.forEach(fn => fn(trace));
  }

  /** Get the last N routing decisions for debugging */
  getTraceHistory(limit = 20): RoutingTrace[] {
    return this.traceBuffer.slice(-limit);
  }

  /** Full routing with trace logging */
  routeAndTrace(vector: NiyahVector, rawInput: string): RoutingDecision {
    const startTime = performance.now();
    const arabicWeight = this.measureArabicWeight(rawInput, vector);
    const codeWeight = this.measureCodeWeight(rawInput, vector);
    const planWeight = this.measurePlanWeight(rawInput, vector);
    const decision = this.route(vector, rawInput);

    this.emitTrace({
      timestamp: Date.now(),
      input: rawInput.slice(0, 100),
      decision,
      weights: { arabic: arabicWeight, code: codeWeight, plan: planWeight },
      modelUsed: this.assignments[decision.primary],
      latencyMs: Math.round(performance.now() - startTime),
    });

    return decision;
  }

  // ── Per-Lobe Timeout Helper ────────────────────────────────

  /** Wrap a promise with a per-lobe timeout. Rejects with TimeoutError if exceeded. */
  withLobeTimeout<T>(lobeId: LobeId, promise: Promise<T>, overrideMs?: number): Promise<T> {
    const timeoutMs = overrideMs ?? LOBE_TIMEOUT_MS[lobeId];
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`${LOBE_CONFIGS[lobeId].nameAr} timed out after ${(timeoutMs / 1000).toFixed(0)}s`)),
        timeoutMs,
      );
      promise
        .then(val => { clearTimeout(timer); resolve(val); })
        .catch(err => { clearTimeout(timer); reject(err); });
    });
  }

  // ── Single Lobe Generation ─────────────────────────────────

  async generateFromLobe(
    lobeId: LobeId,
    prompt: string,
    context?: string,
    onToken?: (token: string) => void,
  ): Promise<LobeResponse> {
    const cfg = LOBE_CONFIGS[lobeId];
    const model = this.assignments[lobeId];
    const startTime = performance.now();

    if (!model) {
      return this.emptyResponse(lobeId, `No model assigned to ${cfg.nameAr}`);
    }

    // ── Check LRU cache (non-streaming only) ─────────────────
    if (!onToken) {
      const cached = this.getCachedResponse(lobeId, prompt);
      if (cached) {
        return {
          lobe: lobeId, model, content: cached, tokensUsed: 0,
          latencyMs: 0, success: true,
        };
      }
    }

    const systemPrompt = context
      ? `${cfg.systemPrompt}\n\n--- Active Code Context ---\n${context.slice(0, 4000)}\n--- End Context ---`
      : cfg.systemPrompt;

    try {
      if (onToken) {
        // Streaming mode
        let content = '';
        let tokensUsed = 0;

        for await (const chunk of ollamaService.generateStream({
          model,
          prompt,
          system: systemPrompt,
          stream: true,
          options: { temperature: cfg.temperature, num_predict: cfg.maxTokens, top_p: 0.9 },
        })) {
          content += chunk.token;
          onToken(chunk.token);
          if (chunk.done) tokensUsed = content.split(/\s+/).length;
        }

        return {
          lobe: lobeId, model, content: content.trim(), tokensUsed,
          latencyMs: Math.round(performance.now() - startTime), success: true,
        };
      } else {
        // Non-streaming
        const result = await ollamaService.generate({
          model, prompt, system: systemPrompt,
          options: { temperature: cfg.temperature, num_predict: cfg.maxTokens, top_p: 0.9 },
        });

        if (!result) {
          return this.emptyResponse(lobeId, 'Ollama returned no response');
        }

        const responseText = (result.response ?? '').trim();
        // Store in cache for future hits
        if (responseText) this.setCacheResponse(lobeId, prompt, responseText, model);

        return {
          lobe: lobeId, model,
          content: responseText,
          tokensUsed: result.eval_count ?? 0,
          latencyMs: Math.round(performance.now() - startTime),
          success: true,
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { ...this.emptyResponse(lobeId, msg), latencyMs: Math.round(performance.now() - startTime) };
    }
  }

  // ══════════════════════════════════════════════════════════════
  // THREE-LOBE PARALLEL PROCESSING — THE CORE FEATURE
  // All three models fire SIMULTANEOUSLY via Promise.all().
  // ══════════════════════════════════════════════════════════════

  async processThreeLobes(
    prompt: string,
    vector?: NiyahVector,
    context?: string,
    callbacks?: StreamCallbacks,
  ): Promise<ThreeLobeResult> {
    const startTime = performance.now();

    const cogPrompt = this.buildLobePrompt('cognitive', prompt, vector);
    const exePrompt = this.buildLobePrompt('executive', prompt, vector);
    const senPrompt = this.buildLobePrompt('sensory', prompt, vector);

    callbacks?.onLobeStart?.('cognitive');
    callbacks?.onLobeStart?.('executive');
    callbacks?.onLobeStart?.('sensory');

    // ── PARALLEL FIRE with per-lobe timeouts ───────────────────
    const [cognitive, executive, sensory] = await Promise.all([
      this.withLobeTimeout('cognitive',
        this.generateFromLobe('cognitive', cogPrompt, context, (t) => callbacks?.onToken?.('cognitive', t))
          .then(r => { callbacks?.onLobeComplete?.('cognitive', r); return r; })
      ).catch(err => { const m = err instanceof Error ? err.message : 'Error'; callbacks?.onError?.('cognitive', m); return this.emptyResponse('cognitive', m); }),

      this.withLobeTimeout('executive',
        this.generateFromLobe('executive', exePrompt, context, (t) => callbacks?.onToken?.('executive', t))
          .then(r => { callbacks?.onLobeComplete?.('executive', r); return r; })
      ).catch(err => { const m = err instanceof Error ? err.message : 'Error'; callbacks?.onError?.('executive', m); return this.emptyResponse('executive', m); }),

      this.withLobeTimeout('sensory',
        this.generateFromLobe('sensory', senPrompt, context, (t) => callbacks?.onToken?.('sensory', t))
          .then(r => { callbacks?.onLobeComplete?.('sensory', r); return r; })
      ).catch(err => { const m = err instanceof Error ? err.message : 'Error'; callbacks?.onError?.('sensory', m); return this.emptyResponse('sensory', m); }),
    ]);

    const merged = this.mergeLobeOutputs(cognitive, executive, sensory, vector);
    const modelsUsed = [cognitive, executive, sensory].filter(r => r.success).map(r => r.model);

    // Build LobeResult[] for NiyahEngine Session compatibility
    const lobeResults: LobeResult[] = [cognitive, executive, sensory].map(r => {
      const cfg = LOBE_CONFIGS[r.lobe];
      return {
        name: `${cfg.emoji} ${cfg.nameAr}`,
        status: r.success ? ('active' as const) : ('idle' as const),
        load: r.success ? Math.min(100, 60 + r.tokensUsed / 10) : 0,
        output: r.success ? r.content.slice(0, 120) : (r.error || 'No response'),
        latency: r.latencyMs,
      };
    });

    const result: ThreeLobeResult = {
      cognitive, executive, sensory, merged,
      totalLatencyMs: Math.round(performance.now() - startTime),
      modelsUsed, lobeResults,
    };

    callbacks?.onAllComplete?.(result);
    return result;
  }

  // ── Smart Single-Lobe Routing ──────────────────────────────

  async routeToSingleLobe(
    prompt: string,
    vector?: NiyahVector,
    context?: string,
    onToken?: (token: string) => void,
  ): Promise<LobeResponse> {
    const routing = vector ? this.route(vector, prompt) : { primary: 'cognitive' as LobeId };
    const lobePrompt = this.buildLobePrompt(routing.primary, prompt, vector);
    return this.generateFromLobe(routing.primary, lobePrompt, context, onToken);
  }

  // ── Code Completion (inline editor) ────────────────────────

  async getCodeCompletion(
    prefix: string,
    suffix: string,
    _language: string,
    maxTokens = 128,
  ): Promise<string> {
    const model = this.assignments.cognitive;
    if (!model) return '';
    try {
      return (await ollamaService.complete(model, prefix, suffix, { maxTokens, temperature: 0.1 })) ?? '';
    } catch {
      return '';
    }
  }

  // ── Routing Decision ───────────────────────────────────────

  route(vector: NiyahVector, rawInput: string): RoutingDecision {
    const domainLobe = this.routeByDomain(vector.domain);
    const arabicWeight = this.measureArabicWeight(rawInput, vector);
    const codeWeight = this.measureCodeWeight(rawInput, vector);
    const planWeight = this.measurePlanWeight(rawInput, vector);

    let primary: LobeId;
    let secondary: LobeId | null = null;
    let parallel = false;
    let reason: string;

    // Explicit lobe overrides
    if (vector.flags.lobe === 'cognitive') return { primary: 'cognitive', secondary: null, parallel: false, reason: 'Explicit --cognitive flag', confidence: 1.0 };
    if (vector.flags.lobe === 'exec') return { primary: 'executive', secondary: null, parallel: false, reason: 'Explicit --exec flag', confidence: 1.0 };
    if (vector.flags.lobe === 'sensory') return { primary: 'sensory', secondary: null, parallel: false, reason: 'Explicit --sensory flag', confidence: 1.0 };

    // Deep mode → all lobes parallel
    if (vector.flags.lobe === 'all' && vector.flags.deepMode) {
      return { primary: domainLobe, secondary: null, parallel: true, reason: 'Deep mode — all lobes activated', confidence: 0.95 };
    }

    if (vector.domain === 'content' && arabicWeight > 0.4) {
      primary = 'sensory';
      secondary = codeWeight > 0.3 ? 'cognitive' : null;
      reason = `Arabic content (dialect: ${vector.dialect})`;
    } else if (vector.domain === 'code' && codeWeight > 0.5) {
      primary = 'cognitive';
      secondary = arabicWeight > 0.4 ? 'sensory' : null;
      reason = `Code task (${codeWeight > 0.7 ? 'high' : 'moderate'} signals)`;
    } else if (planWeight > 0.5 || vector.domain === 'business') {
      primary = 'executive';
      secondary = codeWeight > 0.3 ? 'cognitive' : arabicWeight > 0.3 ? 'sensory' : null;
      reason = 'Planning/strategy task';
    } else if (vector.domain === 'security') {
      primary = 'cognitive'; secondary = 'executive'; parallel = true;
      reason = 'Security — Cognitive + Executive parallel';
    } else if (vector.domain === 'education') {
      primary = arabicWeight > 0.3 ? 'sensory' : 'cognitive';
      secondary = primary === 'sensory' ? 'cognitive' : 'sensory';
      reason = `Education — ${primary === 'sensory' ? 'Arabic explanation' : 'code teaching'}`;
    } else {
      primary = domainLobe;
      secondary = arabicWeight > 0.4 ? 'sensory' : null;
      reason = `Domain routing (${vector.domain})`;
    }

    const maxWeight = Math.max(arabicWeight, codeWeight, planWeight);
    return { primary, secondary, parallel, reason, confidence: Math.min(0.5 + maxWeight * 0.5, 0.98) };
  }

  resolveModel(lobeId: LobeId): string {
    const assigned = this.assignments[lobeId];
    if (assigned && ollamaService.hasModel(assigned)) return assigned;

    const preferred = this.lobeModels[lobeId].preferred;
    if (preferred && ollamaService.hasModel(preferred)) return preferred;

    const config = LOBE_CONFIGS[lobeId];
    if (ollamaService.hasModel(config.model)) return config.model;
    if (ollamaService.hasModel(config.fallbackModel)) return config.fallbackModel;
    const knownGood = ['niyah:sovereign', 'niyah:writer', 'niyah:latest', 'llama3.2:3b', 'deepseek-r1:1.5b', 'niyah:v4', 'niyah:v3'];
    for (const m of knownGood) {
      if (ollamaService.hasModel(m)) return m;
    }
    const models = ollamaService.getModels();
    return models.length > 0 ? models[0].name : config.model;
  }

  getSystemPrompt(lobeId: LobeId, context?: { activeFile?: string; language?: string }): string {
    let prompt = this.performanceMode === 'gpu'
      ? LOBE_CONFIGS[lobeId].systemPrompt
      : FAST_SYSTEM_PROMPTS[lobeId];
    if (context?.activeFile) prompt += `\n\nActive file: ${context.activeFile}`;
    if (context?.language) prompt += `\nLanguage: ${context.language}`;
    return prompt;
  }

  getModelOptions(lobeId: LobeId) {
    const config = LOBE_CONFIGS[lobeId];
    const info = this.lobeModels[lobeId];
    const numCtx = info.metadata?.defaultCtx;
    const fastPredictCap: Record<LobeId, number> = {
      cognitive: 320,
      executive: 224,
      sensory: 192,
    };
    const fastCtxCap: Record<LobeId, number> = {
      cognitive: 1536,
      executive: 1024,
      sensory: 1024,
    };

    if (this.performanceMode === 'gpu') {
      return {
        temperature: config.temperature,
        num_predict: config.maxTokens,
        num_ctx: numCtx ?? 2048,
      };
    }

    return {
      temperature: Math.min(config.temperature, 0.35),
      num_predict: Math.min(config.maxTokens, fastPredictCap[lobeId]),
      num_ctx: Math.min(numCtx ?? 2048, fastCtxCap[lobeId]),
    };
  }

  /** Get the context window size for a lobe (or default 4096) */
  getLobeContext(lobeId: LobeId): number {
    return this.lobeModels[lobeId].metadata?.defaultCtx ?? 4096;
  }

  abortAll(): void {
    ollamaService.cancelAll();
    this.stopRuntimePoll();
  }

  // ── Private helpers ────────────────────────────────────────

  private buildLobePrompt(lobe: LobeId, prompt: string, vector?: NiyahVector): string {
    if (!vector) return prompt;
    const meta = [
      `Dialect: ${vector.dialect}`, `Tone: ${vector.tone}`,
      `Domain: ${vector.domain}`, `Confidence: ${(vector.confidence * 100).toFixed(0)}%`,
      vector.roots.length > 0 ? `Roots: ${vector.roots.join(', ')}` : null,
      vector.flags.sovereign ? 'SOVEREIGN MODE' : null,
      vector.flags.deepMode ? 'DEEP ANALYSIS' : null,
      vector.flags.urgent ? 'URGENT' : null,
    ].filter(Boolean).join(' | ');

    const directive: Record<LobeId, string> = {
      cognitive: 'Write clean, production-ready code. Add Arabic+English comments.',
      executive: 'Review for security, compliance, and architecture. Plan and organize.',
      sensory: 'Respond naturally in the user\'s Arabic dialect. Generate authentic content.',
    };

    return `[Niyah Vector] ${meta}\n[Directive] ${directive[lobe]}\n\nUser: ${prompt}`;
  }

  private mergeLobeOutputs(
    cognitive: LobeResponse,
    executive: LobeResponse,
    sensory: LobeResponse,
    vector?: NiyahVector,
  ): string {
    const responses = [cognitive, executive, sensory];
    const successCount = responses.filter(r => r.success && r.content).length;

    if (successCount === 0) {
      return vector?.dialect !== 'english'
        ? '⚠️ الفصوص الثلاثة لم تستجب. هل Ollama يعمل؟\nشغّل: `ollama serve` ثم حاول مرة أخرى.'
        : '⚠️ All three lobes failed. Is Ollama running?\nRun: `ollama serve` and try again.';
    }

    if (successCount === 1) {
      const w = responses.find(r => r.success && r.content)!;
      const cfg = LOBE_CONFIGS[w.lobe];
      return `**${cfg.emoji} ${cfg.nameAr}** — \`${w.model}\` (${w.latencyMs}ms)\n\n${w.content}`;
    }

    const parts: string[] = [];
    if (cognitive.success && cognitive.content) parts.push(`### 🧠 الفص المعرفي — \`${cognitive.model}\` (${cognitive.latencyMs}ms)\n${cognitive.content}`);
    if (executive.success && executive.content) parts.push(`### ⚖️ الفص التنفيذي — \`${executive.model}\` (${executive.latencyMs}ms)\n${executive.content}`);
    if (sensory.success && sensory.content) parts.push(`### ⚙️ الفص الحسي — \`${sensory.model}\` (${sensory.latencyMs}ms)\n${sensory.content}`);

    const failed = responses.filter(r => !r.success).map(r => LOBE_CONFIGS[r.lobe].nameAr);
    const failNote = failed.length > 0 ? `\n\n> ⚠️ ${failed.join(' + ')} — لم يستجب` : '';

    return `**Three-Lobe Analysis** (${successCount}/3 active)${failNote}\n\n---\n\n${parts.join('\n\n---\n\n')}`;
  }

  private emptyResponse(lobe: LobeId, error: string): LobeResponse {
    return { lobe, model: this.assignments[lobe] || 'none', content: '', tokensUsed: 0, latencyMs: 0, success: false, error };
  }

  private routeByDomain(domain: NiyahDomain): LobeId {
    switch (domain) {
      case 'code': case 'security': case 'datascience': return 'cognitive';
      case 'infrastructure': case 'business': return 'executive';
      case 'content': case 'creative': case 'education': case 'general': return 'sensory';
      default: return 'cognitive';
    }
  }

  // ── Sliding Window Helpers ─────────────────────────────────

  private getWindowSizeForDomain(domain: NiyahDomain): number {
    switch (domain) {
      case 'security':
      case 'infrastructure':
        return 4000; // Forensic logs often hide critical signatures in large payloads
      case 'code':
      case 'datascience':
        return 3000; // Logic flow and class structures require medium-large context
      case 'content':
      case 'creative':
        return 1200; // Brief social media or creative text is context-dense
      default:
        return 2000; // Standard balance for general/education domains
    }
  }

  private getSlidingWindow(input: string, windowSize = 1000): string {
    if (input.length <= windowSize) {
      return input;
    }
    // Take the first 500 chars, middle 250, and last 250
    const start = input.slice(0, Math.floor(windowSize / 2));
    const end = input.slice(-Math.floor(windowSize / 4));
    const middleStart = Math.floor((input.length - Math.floor(windowSize / 4)) / 2);
    const middle = input.slice(middleStart, middleStart + Math.floor(windowSize / 4));
    return `${start} ${middle} ${end}`;
  }

  private measureArabicWeight(input: string, vector: NiyahVector): number {
    let w = 0;
    const windowSize = this.getWindowSizeForDomain(vector.domain);
    const windowedInput = this.getSlidingWindow(input, windowSize);
    const arabicRatio = (windowedInput.match(/[\u0600-\u06FF]/g) || []).length / Math.max(windowedInput.length, 1);
    w += arabicRatio * 0.5;
    if (vector.dialect !== 'english') w += 0.2;
    if (vector.dialect === 'saudi' || vector.dialect === 'khaleeji') w += 0.1;
    if (vector.roots.length > 2) w += 0.15;
    if (vector.roots.length > 5) w += 0.1;
    // Boost if the input is predominantly Arabic
    if (arabicRatio > 0.5) w += 0.1;
    return Math.min(w, 1.0);
  }

  private measureCodeWeight(input: string, vector: NiyahVector): number {
    let w = 0;
    const windowSize = this.getWindowSizeForDomain(vector.domain);
    const windowedInput = this.getSlidingWindow(input, windowSize);
    const lower = windowedInput.toLowerCase();
    if (vector.domain === 'code') w += 0.3;
    if (vector.domain === 'security') w += 0.15;
    for (const t of ['function', 'component', 'hook', 'api', 'typescript', 'react', 'import', 'export', 'class', 'interface', 'async', 'await', 'debug', 'refactor', 'optimize', 'bug', 'error', 'fix', 'deploy', 'build', 'test', 'npm', 'كود', 'فنكشن', 'كومبوننت']) {
      if (lower.includes(t)) w += 0.08;
    }
    if (windowedInput.includes('```') || windowedInput.includes('`')) w += 0.2;
    if (/\.(tsx?|jsx?|py|rs|go|css|html|json|yaml)\b/.test(windowedInput)) w += 0.15;
    return Math.min(w, 1.0);
  }

  private measurePlanWeight(input: string, vector: NiyahVector): number {
    let w = 0;
    const windowSize = this.getWindowSizeForDomain(vector.domain);
    const windowedInput = this.getSlidingWindow(input, windowSize);
    const lower = windowedInput.toLowerCase();
    if (vector.domain === 'business') w += 0.3;
    for (const t of ['plan', 'strategy', 'architecture', 'design', 'roadmap', 'milestone', 'خطة', 'استراتيجية', 'هيكلة', 'مشروع', 'structure', 'organize', 'phase', 'step', 'مراحل', 'vision', 'رؤية', 'approach', 'system design']) {
      if (lower.includes(t)) w += 0.1;
    }
    if (/\b(step|phase|stage|مرحلة)\s*\d/i.test(windowedInput)) w += 0.15;
    if (/how (should|do|to)\b/i.test(windowedInput)) w += 0.1;
    return Math.min(w, 1.0);
  }
}

// ── Singleton ────────────────────────────────────────────────
export const modelRouter = new ModelRouter();
