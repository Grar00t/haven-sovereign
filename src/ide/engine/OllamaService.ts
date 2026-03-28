// ══════════════════════════════════════════════════════════════
// OllamaService — Local LLM Gateway for HAVEN IDE
// Talks to Ollama (localhost:11434) for sovereign inference.
// Zero cloud. Zero telemetry. Every token stays on YOUR machine.
// ══════════════════════════════════════════════════════════════

import { invoke, isTauri } from '@tauri-apps/api/core';

export interface OllamaModel {
  name: string;
  size: number;          // bytes
  digest: string;
  modified_at: string;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  raw?: boolean;            // If true, Ollama won't wrap in chat template
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;   // max tokens
    num_ctx?: number;       // context window size
    stop?: string[];
    seed?: number;
  };
  context?: number[];       // conversation context from previous responses
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  options?: OllamaGenerateRequest['options'];
}

export interface OllamaChatResponse {
  model: string;
  message: OllamaChatMessage;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

// ── /api/show response (model metadata) ─────────────────────
export interface OllamaModelDetails {
  parent_model: string;
  format: string;
  family: string;
  families: string[] | null;
  parameter_size: string;   // e.g. "7B", "13B", "34B"
  quantization_level: string; // e.g. "Q4_0", "Q5_K_M", "F16"
}

export interface OllamaShowResponse {
  modelfile: string;
  parameters: string;
  template: string;
  details: OllamaModelDetails;
  model_info: Record<string, unknown>;
}

// ── /api/ps response (running models) ────────────────────────
export interface OllamaRunningModel {
  name: string;
  model: string;
  size: number;              // total model bytes
  digest: string;
  details: OllamaModelDetails;
  expires_at: string;
  size_vram: number;         // VRAM bytes actively used
  size_disk: number;         // disk bytes (if partially offloaded)
}

export interface OllamaPsResponse {
  models: OllamaRunningModel[];
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// ── Endpoint Profiles ──────────────────────────────────────────
export interface OllamaEndpoint {
  url: string;
  label: string;          // e.g. 'Local', 'Bluvalt VDC', 'Home Server'
  addedAt: number;        // Unix ms
}

const ENDPOINTS_KEY = 'haven-ollama-endpoints';
const ACTIVE_EP_KEY = 'haven-ollama-active-endpoint';
const AUTH_TOKENS_KEY = 'haven-ollama-auth-tokens';

function loadEndpoints(): OllamaEndpoint[] {
  try {
    const raw = localStorage.getItem(ENDPOINTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveEndpoints(eps: OllamaEndpoint[]) {
  localStorage.setItem(ENDPOINTS_KEY, JSON.stringify(eps));
}

function loadActiveUrl(): string {
  try { return localStorage.getItem(ACTIVE_EP_KEY) || 'http://localhost:11434'; }
  catch { return 'http://localhost:11434'; }
}

function loadAuthTokens(): Record<string, string> {
  try {
    const raw = localStorage.getItem(AUTH_TOKENS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveAuthTokens(tokens: Record<string, string>) {
  localStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify(tokens));
}

// ── Event system ──────────────────────────────────────────────
type OllamaEvent = 'status-change' | 'model-loaded' | 'stream-token' | 'error' | 'endpoint-change';
type OllamaListener = (...args: any[]) => void;

class OllamaService {
  private _baseUrl: string;
  private status: ConnectionStatus = 'disconnected';
  private availableModels: OllamaModel[] = [];
  private listeners: Map<OllamaEvent, Set<OllamaListener>> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private endpoints: OllamaEndpoint[] = [];
  private _endpointLabel: string = 'Local';
  private authTokens: Record<string, string> = {};
  private readonly desktopBridge = typeof window !== 'undefined' && isTauri();

  constructor(baseUrl = 'http://localhost:11434') {
    // Restore persisted endpoint
    const saved = loadActiveUrl();
    this._baseUrl = saved || baseUrl;
    this.endpoints = loadEndpoints();
    this.authTokens = loadAuthTokens();

    // Ensure default 'Local' is always in list
    if (!this.endpoints.find(e => e.url === 'http://localhost:11434')) {
      this.endpoints.unshift({ url: 'http://localhost:11434', label: 'Local', addedAt: Date.now() });
      saveEndpoints(this.endpoints);
    }

    // Update label from stored endpoints
    const active = this.endpoints.find(e => e.url === this._baseUrl);
    this._endpointLabel = active?.label || this.deriveLabel(this._baseUrl);
  }

  /** Public accessor for base URL — used by ModelRouter for /api/show + /api/ps */
  get baseUrl(): string { return this._baseUrl; }

  /** Human-readable label for current endpoint */
  get endpointLabel(): string { return this._endpointLabel; }

  /** Whether the active endpoint is truly local to this machine */
  isLocalEndpoint(): boolean {
    try {
      const url = new URL(this._baseUrl);
      return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    } catch {
      return false;
    }
  }

  /** Get all saved endpoints */
  getEndpoints(): OllamaEndpoint[] { return [...this.endpoints]; }

  /** Switch to a different endpoint URL. Reconnects automatically. */
  async setEndpoint(url: string, label?: string): Promise<boolean> {
    // Normalize URL (strip trailing slash)
    const normalized = url.replace(/\/+$/, '');
    const resolvedLabel = label || this.endpoints.find(e => e.url === normalized)?.label || this.deriveLabel(normalized);

    // Add to endpoints if not already present
    if (!this.endpoints.find(e => e.url === normalized)) {
      this.endpoints.push({ url: normalized, label: resolvedLabel, addedAt: Date.now() });
      saveEndpoints(this.endpoints);
    } else if (label) {
      // Update label if explicitly provided
      const ep = this.endpoints.find(e => e.url === normalized)!;
      ep.label = resolvedLabel;
      saveEndpoints(this.endpoints);
    }

    // Disconnect current, switch, reconnect
    this.disconnect();
    this._baseUrl = normalized;
    this._endpointLabel = resolvedLabel;
    localStorage.setItem(ACTIVE_EP_KEY, normalized);
    this.emit('endpoint-change', normalized, resolvedLabel);

    return this.connect();
  }

  /** Remove a saved endpoint (cannot remove active) */
  removeEndpoint(url: string): boolean {
    if (url === this._baseUrl) return false; // can't remove active
    this.endpoints = this.endpoints.filter(e => e.url !== url);
    saveEndpoints(this.endpoints);
    return true;
  }

  private deriveLabel(url: string): string {
    if (url.includes('localhost') || url.includes('127.0.0.1')) return 'Local';
    try {
      const hostname = new URL(url).hostname;
      if (hostname.includes('bluvalt')) return 'Bluvalt VDC';
      return hostname.split('.')[0] || 'Remote';
    } catch { return 'Remote'; }
  }

  // ── Auth token management ────────────────────────────────

  /** Set auth token for a specific endpoint (or current if no url). Persisted. */
  setAuthToken(token: string, url?: string): void {
    const target = url?.replace(/\/+$/, '') || this._baseUrl;
    if (token) {
      this.authTokens[target] = token;
    } else {
      delete this.authTokens[target];
    }
    saveAuthTokens(this.authTokens);
  }

  /** Get auth token for a specific endpoint (or current) */
  getAuthToken(url?: string): string | null {
    const target = url?.replace(/\/+$/, '') || this._baseUrl;
    return this.authTokens[target] || null;
  }

  /** Check if current endpoint has auth configured */
  get hasAuth(): boolean {
    return !!this.authTokens[this._baseUrl];
  }

  /** Build headers with auth if token exists for the given endpoint (or current endpoint). */
  private authHeadersFor(url: string, extra: Record<string, string> = {}): Record<string, string> {
    const normalized = url.replace(/\/+$/, '');
    const token = this.authTokens[normalized];
    return {
      ...extra,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  /** Build headers with auth if token exists for current endpoint */
  private authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return this.authHeadersFor(this._baseUrl, extra);
  }

  private async proxy<T>(path: string, body?: unknown): Promise<T> {
    return invoke<T>('ollama_proxy', {
      request: {
        path,
        ...(body !== undefined ? { body } : {}),
      },
    });
  }

  private chunkText(text: string): string[] {
    if (!text) return [];
    const chunks = text.match(/.{1,24}(\s|$)/g)?.map(part => part) ?? [];
    return chunks.length > 0 ? chunks : [text];
  }

  // ── Event emitter ──────────────────────────────────────────
  on(event: OllamaEvent, fn: OllamaListener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return () => {
      void this.listeners.get(event)?.delete(fn);
    };
  }

  private emit(event: OllamaEvent, ...args: any[]) {
    this.listeners.get(event)?.forEach(fn => fn(...args));
  }

  // ── Connection management ──────────────────────────────────
  getStatus(): ConnectionStatus { return this.status; }
  getModels(): OllamaModel[] { return [...this.availableModels]; }

  private setStatus(s: ConnectionStatus) {
    if (this.status !== s) {
      this.status = s;
      this.emit('status-change', s);
    }
  }

  async connect(): Promise<boolean> {
    this.setStatus('connecting');
    if (this.desktopBridge) {
      try {
        const data = await this.proxy<{ models?: OllamaModel[] }>('/api/tags');
        this.availableModels = data.models || [];
        this._baseUrl = 'http://127.0.0.1:11434';
        this._endpointLabel = 'Local';
        this.setStatus('connected');
        this.stopHealthCheck();
        this.healthCheckInterval = setInterval(() => this.healthPing(), 30_000);
        return true;
      } catch (err) {
        this.setStatus('error');
        this.emit('error', err instanceof Error ? err.message : 'Cannot reach Ollama');
        return false;
      }
    }

    const candidates = Array.from(new Set([
      this._baseUrl,
      'http://127.0.0.1:11434',
      'http://localhost:11434',
    ].map(url => url.replace(/\/+$/, ''))));

    let lastError: unknown = null;

    for (const candidate of candidates) {
      try {
        const res = await fetch(`${candidate}/api/tags`, {
          signal: AbortSignal.timeout(5000),
          headers: this.authHeadersFor(candidate),
        });
        if (!res.ok) throw new Error(`Ollama returned ${res.status}`);

        const data = await res.json();
        this.availableModels = data.models || [];

        if (candidate !== this._baseUrl) {
          this._baseUrl = candidate;
          const existing = this.endpoints.find(e => e.url === candidate);
          if (!existing) {
            this.endpoints.unshift({ url: candidate, label: this.deriveLabel(candidate), addedAt: Date.now() });
            saveEndpoints(this.endpoints);
          }
          this._endpointLabel = existing?.label || this.deriveLabel(candidate);
          localStorage.setItem(ACTIVE_EP_KEY, candidate);
          this.emit('endpoint-change', candidate, this._endpointLabel);
        }

        this.setStatus('connected');

        // Start health check every 30s
        this.stopHealthCheck();
        this.healthCheckInterval = setInterval(() => this.healthPing(), 30_000);

        return true;
      } catch (err) {
        lastError = err;
      }
    }

    this.setStatus('error');
    this.emit('error', lastError instanceof Error ? lastError.message : 'Cannot reach Ollama');
    return false;
  }

  private async healthPing() {
    if (this.desktopBridge) {
      try {
        const data = await this.proxy<{ models?: OllamaModel[] }>('/api/tags');
        this.availableModels = data.models || [];
        this.setStatus('connected');
      } catch {
        this.setStatus('error');
      }
      return;
    }

    try {
      const res = await fetch(`${this._baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
        headers: this.authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        this.availableModels = data.models || [];
        this.setStatus('connected');
      } else {
        this.setStatus('error');
      }
    } catch {
      this.setStatus('disconnected');
    }
  }

  private stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  disconnect() {
    this.stopHealthCheck();
    this.abortControllers.forEach(ac => ac.abort());
    this.abortControllers.clear();
    this.setStatus('disconnected');
  }

  hasModel(name: string): boolean {
    return this.availableModels.some(m =>
      m.name === name || m.name.startsWith(name + ':')
    );
  }

  // ── Pull a model (download) ────────────────────────────────
  async pullModel(
    name: string,
    onProgress?: (status: string, completed?: number, total?: number, digest?: string) => void,
  ): Promise<boolean> {
    try {
      const res = await fetch(`${this._baseUrl}/api/pull`, {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name, stream: true }),
      });
      if (!res.ok || !res.body) return false;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const j = JSON.parse(line);
            onProgress?.(j.status || '', j.completed, j.total, j.digest);
          } catch { /* skip parse errors in stream */ }
        }
      }
      // Refresh models list
      await this.connect();
      this.emit('model-loaded', name);
      return true;
    } catch (err) {
      this.emit('error', `Failed to pull ${name}: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }

  // ── Generate (non-streaming) ───────────────────────────────
  async generate(req: OllamaGenerateRequest): Promise<OllamaGenerateResponse | null> {
    if (this.status !== 'connected') {
      const ok = await this.connect();
      if (!ok) return null;
    }

    if (this.desktopBridge) {
      try {
        return await this.proxy<OllamaGenerateResponse>('/api/generate', { ...req, stream: false });
      } catch (err) {
        this.emit('error', `Generate failed: ${(err as Error).message}`);
        return null;
      }
    }

    const id = `gen-${Date.now()}`;
    const ac = new AbortController();
    this.abortControllers.set(id, ac);

    try {
      const res = await fetch(`${this._baseUrl}/api/generate`, {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ...req, stream: false }),
        signal: ac.signal,
      });
      if (!res.ok) throw new Error(`Ollama ${res.status}`);
      return await res.json();
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        this.emit('error', `Generate failed: ${(err as Error).message}`);
      }
      return null;
    } finally {
      this.abortControllers.delete(id);
    }
  }

  // ── Generate (streaming) ───────────────────────────────────
  async *generateStream(
    req: OllamaGenerateRequest,
  ): AsyncGenerator<{ token: string; done: boolean }> {
    if (this.status !== 'connected') {
      const ok = await this.connect();
      if (!ok) return;
    }

    if (this.desktopBridge) {
      const result = await this.generate({ ...req, stream: false });
      const response = result?.response || '';
      const chunks = this.chunkText(response);
      for (const chunk of chunks) {
        this.emit('stream-token', chunk);
        yield { token: chunk, done: false };
      }
      yield { token: '', done: true };
      return;
    }

    const id = `stream-${Date.now()}`;
    const ac = new AbortController();
    this.abortControllers.set(id, ac);

    try {
      const res = await fetch(`${this._baseUrl}/api/generate`, {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ...req, stream: true }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const j = JSON.parse(line) as OllamaGenerateResponse;
            this.emit('stream-token', j.response);
            yield { token: j.response, done: j.done };
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        this.emit('error', `Stream failed: ${(err as Error).message}`);
      }
    } finally {
      this.abortControllers.delete(id);
    }
  }

  // ── Chat (non-streaming) ───────────────────────────────────
  async chat(req: OllamaChatRequest): Promise<OllamaChatResponse | null> {
    if (this.status !== 'connected') {
      const ok = await this.connect();
      if (!ok) return null;
    }

    if (this.desktopBridge) {
      try {
        return await this.proxy<OllamaChatResponse>('/api/chat', { ...req, stream: false });
      } catch (err) {
        this.emit('error', `Chat failed: ${(err as Error).message}`);
        return null;
      }
    }

    try {
      const res = await fetch(`${this._baseUrl}/api/chat`, {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ...req, stream: false }),
      });
      if (!res.ok) throw new Error(`Ollama ${res.status}`);
      return await res.json();
    } catch (err) {
      this.emit('error', `Chat failed: ${(err as Error).message}`);
      return null;
    }
  }

  // ── Chat (streaming) ──────────────────────────────────────
  async *chatStream(
    req: OllamaChatRequest,
  ): AsyncGenerator<{ token: string; done: boolean }> {
    if (this.status !== 'connected') {
      const ok = await this.connect();
      if (!ok) return;
    }

    if (this.desktopBridge) {
      const result = await this.chat({ ...req, stream: false });
      const response = result?.message?.content || '';
      const chunks = this.chunkText(response);
      for (const chunk of chunks) {
        this.emit('stream-token', chunk);
        yield { token: chunk, done: false };
      }
      yield { token: '', done: true };
      return;
    }

    const id = `chat-stream-${Date.now()}`;
    const ac = new AbortController();
    this.abortControllers.set(id, ac);

    try {
      const res = await fetch(`${this._baseUrl}/api/chat`, {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ...req, stream: true }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const j = JSON.parse(line) as OllamaChatResponse;
            const token = j.message?.content || '';
            if (token) {
              this.emit('stream-token', token);
              yield { token, done: j.done };
            }
            if (j.done) return;
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        this.emit('error', `Chat stream failed: ${(err as Error).message}`);
      }
    } finally {
      this.abortControllers.delete(id);
    }
  }

  // ── /api/show — Model metadata (parameter size, quantization, default ctx) ──
  async showModel(name: string): Promise<OllamaShowResponse | null> {
    if (this.desktopBridge) {
      try {
        return await this.proxy<OllamaShowResponse>('/api/show', { name });
      } catch {
        return null;
      }
    }
    try {
      const res = await fetch(`${this._baseUrl}/api/show`, {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /** Parse num_ctx from model parameters string (e.g. "num_ctx 4096") */
  parseDefaultCtx(parameters: string): number {
    const match = parameters.match(/num_ctx\s+(\d+)/);
    return match ? parseInt(match[1], 10) : 2048; // default 2048
  }

  // ── /api/ps — Running models (VRAM, context, expiry) ──────
  async listRunning(): Promise<OllamaRunningModel[]> {
    if (this.desktopBridge) {
      try {
        const data = await this.proxy<OllamaPsResponse>('/api/ps');
        return data.models || [];
      } catch {
        return [];
      }
    }
    try {
      const res = await fetch(`${this._baseUrl}/api/ps`, {
        signal: AbortSignal.timeout(3000),
        headers: this.authHeaders(),
      });
      if (!res.ok) return [];
      const data: OllamaPsResponse = await res.json();
      return data.models || [];
    } catch {
      return [];
    }
  }

  // ── Cancel all pending requests ────────────────────────────
  cancelAll() {
    this.abortControllers.forEach(ac => ac.abort());
    this.abortControllers.clear();
  }

  // ── Quick completions (optimized for code / FIM) ───────────
  async complete(
    model: string,
    prefix: string,
    suffix: string = '',
    opts?: { maxTokens?: number; temperature?: number },
  ): Promise<string | null> {
    // Use Fill-In-the-Middle (FIM) tokens for DeepSeek Coder format
    const prompt = suffix
      ? `<|fim_prefix|>${prefix}<|fim_suffix|>${suffix}<|fim_middle|>`
      : prefix;

    const result = await this.generate({
      model,
      prompt,
      raw: true, // Prevent Ollama from wrapping in chat template
      options: {
        temperature: opts?.temperature ?? 0.1,
        num_predict: opts?.maxTokens ?? 128,
        stop: ['\n\n', '<|fim_pad|>', '<|endoftext|>', '<|fim_prefix|>', '<|fim_suffix|>', '<|fim_middle|>'],
      },
    });
    return result?.response?.trim() || null;
  }
}

// ── Singleton ────────────────────────────────────────────────
export const ollamaService = new OllamaService();
