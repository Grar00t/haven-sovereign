// ══════════════════════════════════════════════════════════════
// ThreeLobeAgent — Sovereign Cognitive Orchestrator
// Coordinates Cognitive, Executive, and Sensory lobes through
// Ollama local models. Every neuron fires on YOUR machine.
// Built by أبو خوارزم — Sulaiman Alshammari
// ══════════════════════════════════════════════════════════════

import { ollamaService, type OllamaChatMessage, type ConnectionStatus } from './OllamaService';
import { modelRouter, LOBE_CONFIGS, ALL_LOBE_IDS, type LobeId, type RoutingDecision } from './ModelRouter';
import { niyahEngine, type NiyahSession, type NiyahVector } from './NiyahEngine';
import { gitService, type GitFileStatus } from './GitService';
import { sovereignSessionCleaner } from './SovereignSessionCleaner';

// ── Types ────────────────────────────────────────────────────

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  lobe?: LobeId;
  lobeNameAr?: string;
  model?: string;
  niyahSession?: NiyahSession;
  routing?: RoutingDecision;
  tokens?: number;
  latencyMs?: number;
}

export interface AgentContext {
  activeFile?: string;
  language?: string;
  selectedCode?: string;
  recentFiles?: string[];
  openFiles?: string[];
}

export interface LobeStatus {
  id: LobeId;
  model: string;
  available: boolean;
  busy: boolean;
}

export interface StreamCallbacks {
  onToken: (token: string, lobe: LobeId) => void;
  onLobeStart: (lobe: LobeId, model: string) => void;
  onLobeEnd: (lobe: LobeId, latencyMs: number) => void;
  onNiyahVector: (vector: NiyahVector) => void;
  onRouting: (decision: RoutingDecision) => void;
  onComplete: (message: AgentMessage) => void;
  onError: (error: string) => void;
}

// ── Slash Command Definitions ────────────────────────────────

interface SlashCommand {
  name: string;
  description: string;
  descriptionAr: string;
  handler: (args: string, ctx: AgentContext, callbacks: StreamCallbacks) => Promise<string>;
}

// ── Agent ────────────────────────────────────────────────────

class ThreeLobeAgent {
  private history: AgentMessage[] = [];
  private maxHistory = 30;
  private activeLobe: LobeId | null = null;
  private slashCommands: Map<string, SlashCommand> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();

  constructor() {
    this.registerSlashCommands();
    // Forward Ollama status changes
    ollamaService.on('status-change', (s: ConnectionStatus) => {
      this.statusListeners.forEach(fn => fn(s));
    });
  }

  // ── Connection lifecycle ───────────────────────────────────

  async connect(): Promise<boolean> {
    return ollamaService.connect();
  }

  disconnect() {
    ollamaService.disconnect();
  }

  getConnectionStatus(): ConnectionStatus {
    return ollamaService.getStatus();
  }

  onStatusChange(fn: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  // ── Lobe status ────────────────────────────────────────────

  getLobeStatuses(): LobeStatus[] {
    return ALL_LOBE_IDS.map(id => ({
      id,
      model: modelRouter.resolveModel(id),
      available: ollamaService.hasModel(LOBE_CONFIGS[id].model) ||
                 ollamaService.hasModel(LOBE_CONFIGS[id].fallbackModel),
      busy: this.activeLobe === id,
    }));
  }

  getActiveLobe(): LobeId | null {
    return this.activeLobe;
  }

  getHistory(): AgentMessage[] {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
  }

  // ── Model management ──────────────────────────────────────

  /**
   * Pull all required models for the three lobes.
   */
  async pullRequiredModels(
    onProgress?: (lobe: LobeId, status: string, pct: number) => void,
  ): Promise<{ lobe: LobeId; success: boolean }[]> {
    const results: { lobe: LobeId; success: boolean }[] = [];

    for (const id of ALL_LOBE_IDS) {
      const config = LOBE_CONFIGS[id];
      if (ollamaService.hasModel(config.model) || ollamaService.hasModel(config.fallbackModel)) {
        results.push({ lobe: id, success: true });
        continue;
      }
      const success = await ollamaService.pullModel(config.model, (status, completed, total) => {
        const pct = total ? Math.round((completed || 0) / total * 100) : 0;
        onProgress?.(id, status, pct);
      });
      results.push({ lobe: id, success });
    }
    return results;
  }

  // ── Main entry: chat ──────────────────────────────────────

  /**
   * Process a user message with full Three-Lobe pipeline.
   * Streams tokens via callbacks.
   */
  async chat(
    input: string,
    context: AgentContext,
    callbacks: Partial<StreamCallbacks>,
  ): Promise<AgentMessage> {
    const startTime = performance.now();

    // Add user message to history
    const userMsg: AgentMessage = {
      id: `user-${Date.now().toString(36)}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    this.addToHistory(userMsg);

    // Check for slash commands first
    if (input.startsWith('/')) {
      const spaceIdx = input.indexOf(' ');
      const cmd = spaceIdx !== -1 ? input.slice(0, spaceIdx) : input;
      const args = spaceIdx !== -1 ? input.slice(spaceIdx + 1).trim() : '';
      const handler = this.slashCommands.get(cmd.toLowerCase());
      if (handler) {
        try {
          const result = await handler.handler(args, context, callbacks as StreamCallbacks);
          const msg: AgentMessage = {
            id: `agent-${Date.now().toString(36)}`,
            role: 'assistant',
            content: result,
            timestamp: Date.now(),
            latencyMs: performance.now() - startTime,
          };
          this.addToHistory(msg);
          callbacks.onComplete?.(msg);
          return msg;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Command failed';
          callbacks.onError?.(errMsg);
          const msg: AgentMessage = {
            id: `agent-${Date.now().toString(36)}`,
            role: 'assistant',
            content: `❌ ${errMsg}`,
            timestamp: Date.now(),
            latencyMs: performance.now() - startTime,
          };
          this.addToHistory(msg);
          callbacks.onComplete?.(msg);
          return msg;
        }
      }
    }

    // ── Step 1: NiyahEngine analysis ─────────────────────────
    const niyahSession = niyahEngine.process(input, context);
    callbacks.onNiyahVector?.(niyahSession.vector);

    // ── Step 2: Route to correct lobe(s) ─────────────────────
    const routing = modelRouter.route(niyahSession.vector, input);
    callbacks.onRouting?.(routing);

    // ── Step 3: Check Ollama connection ──────────────────────
    if (ollamaService.getStatus() !== 'connected') {
      const ok = await ollamaService.connect();
      if (!ok) {
        // Fallback to NiyahEngine template response
        return this.fallbackResponse(niyahSession, routing, startTime, callbacks);
      }
    }

    // ── Step 4: Execute through lobe(s) ──────────────────────
    try {
      let response: string;

      if (routing.parallel && routing.secondary) {
        response = await this.executeParallel(
          input, routing.primary, routing.secondary, context, niyahSession, callbacks,
        );
      } else if (routing.secondary) {
        response = await this.executeChained(
          input, routing.primary, routing.secondary, context, niyahSession, callbacks,
        );
      } else {
        response = await this.executeSingle(
          input, routing.primary, context, niyahSession, callbacks,
        );
      }

      const latencyMs = performance.now() - startTime;
      const msg: AgentMessage = {
        id: `agent-${Date.now().toString(36)}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        lobe: routing.primary,
        lobeNameAr: LOBE_CONFIGS[routing.primary].nameAr,
        model: modelRouter.resolveModel(routing.primary),
        niyahSession,
        routing,
        latencyMs,
      };
      this.addToHistory(msg);
      callbacks.onComplete?.(msg);
      return msg;

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Agent processing failed';
      callbacks.onError?.(errMsg);
      return this.fallbackResponse(niyahSession, routing, startTime, callbacks);
    }
  }

  // ── Single lobe execution (streaming) ─────────────────────

  private async executeSingle(
    input: string,
    lobeId: LobeId,
    context: AgentContext,
    niyah: NiyahSession,
    callbacks: Partial<StreamCallbacks>,
  ): Promise<string> {
    const model = modelRouter.resolveModel(lobeId);
    const systemPrompt = modelRouter.getSystemPrompt(lobeId, context);
    const options = modelRouter.getModelOptions(lobeId);

    this.activeLobe = lobeId;
    callbacks.onLobeStart?.(lobeId, model);
    const startTime = performance.now();

    // Build chat messages
    const messages = this.buildMessages(systemPrompt, input, context, niyah);

    let fullResponse = '';
    for await (const chunk of ollamaService.chatStream({
      model,
      messages,
      options,
    })) {
      fullResponse += chunk.token;
      callbacks.onToken?.(chunk.token, lobeId);
      if (chunk.done) break;
    }

    this.activeLobe = null;
    callbacks.onLobeEnd?.(lobeId, performance.now() - startTime);

    return fullResponse || niyah.response; // Fallback to NiyahEngine template
  }

  // ── Parallel lobe execution ───────────────────────────────

  private async executeParallel(
    input: string,
    primaryId: LobeId,
    secondaryId: LobeId,
    context: AgentContext,
    niyah: NiyahSession,
    callbacks: Partial<StreamCallbacks>,
  ): Promise<string> {
    // Run both lobes simultaneously
    const [primaryResult, secondaryResult] = await Promise.all([
      this.executeSingleSilent(input, primaryId, context, niyah),
      this.executeSingleSilent(input, secondaryId, context, niyah),
    ]);

    // Stream the combined result
    const combined = this.mergeLobeResults(primaryId, primaryResult, secondaryId, secondaryResult);
    for (const char of combined) {
      callbacks.onToken?.(char, primaryId);
    }

    return combined;
  }

  // ── Chained lobe execution ────────────────────────────────

  private async executeChained(
    input: string,
    primaryId: LobeId,
    secondaryId: LobeId,
    context: AgentContext,
    niyah: NiyahSession,
    callbacks: Partial<StreamCallbacks>,
  ): Promise<string> {
    // Primary lobe first (streaming)
    const primaryResult = await this.executeSingle(input, primaryId, context, niyah, callbacks);

    // Secondary lobe enriches (silent, non-streaming)
    const enrichPrompt = `Based on this analysis, add your perspective:\n\nOriginal question: ${input}\n\nPrimary lobe (${LOBE_CONFIGS[primaryId].name}) response:\n${primaryResult.slice(0, 800)}`;

    const secondaryResult = await this.executeSingleSilent(
      enrichPrompt, secondaryId, context, niyah,
    );

    // If secondary added value, append it
    if (secondaryResult && secondaryResult.length > 20) {
      const separator = `\n\n---\n*${LOBE_CONFIGS[secondaryId].nameAr}:*\n`;
      callbacks.onToken?.(separator, secondaryId);
      for (const char of secondaryResult) {
        callbacks.onToken?.(char, secondaryId);
      }
      return primaryResult + separator + secondaryResult;
    }

    return primaryResult;
  }

  // ── Silent single execution (no streaming) ────────────────

  private async executeSingleSilent(
    input: string,
    lobeId: LobeId,
    context: AgentContext,
    niyah?: NiyahSession,
  ): Promise<string> {
    const model = modelRouter.resolveModel(lobeId);
    const systemPrompt = modelRouter.getSystemPrompt(lobeId, context);
    const options = modelRouter.getModelOptions(lobeId);
    const messages = this.buildMessages(systemPrompt, input, context, niyah);

    const result = await ollamaService.chat({
      model,
      messages,
      options,
    });

    return result?.message?.content || '';
  }

  // ── Build chat messages with context ──────────────────────

  private buildMessages(
    systemPrompt: string,
    input: string,
    context: AgentContext,
    niyah?: NiyahSession,
  ): OllamaChatMessage[] {
    const messages: OllamaChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add recent history (last 6 messages for context window efficiency)
    const recentHistory = this.history.slice(-6);
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content.slice(0, 1000), // Truncate long messages
        });
      }
    }

    // Inject Niyah analysis as structured XML when available
    if (niyah) {
      const niyahXml = [
        '<niyah-analysis>',
        `  <dialect>${niyah.vector.dialect}</dialect>`,
        `  <tone>${niyah.vector.tone}</tone>`,
        `  <domain>${niyah.vector.domain}</domain>`,
        `  <confidence>${(niyah.vector.confidence * 100).toFixed(0)}%</confidence>`,
        niyah.vector.roots.length > 0 ? `  <arabic-roots>${niyah.vector.roots.join(', ')}</arabic-roots>` : '',
        `  <intent>${niyah.vector.intent}</intent>`,
        niyah.vector.flags.sovereign ? '  <flag>SOVEREIGN</flag>' : '',
        niyah.vector.flags.deepMode ? '  <flag>DEEP_ANALYSIS</flag>' : '',
        niyah.vector.flags.urgent ? '  <flag>URGENT</flag>' : '',
        '</niyah-analysis>',
      ].filter(Boolean).join('\n');
      messages.push({ role: 'system', content: niyahXml });
    }

    // Build user message with code context
    let userContent = input;

    if (context.selectedCode) {
      userContent = `Selected code:\n\`\`\`${context.language || ''}\n${context.selectedCode}\n\`\`\`\n\n${input}`;
    }

    messages.push({ role: 'user', content: userContent });

    return messages;
  }

  // ── Merge parallel lobe results ───────────────────────────

  private mergeLobeResults(
    primaryId: LobeId,
    primaryResult: string,
    secondaryId: LobeId,
    secondaryResult: string,
  ): string {
    if (!secondaryResult || secondaryResult.length < 20) return primaryResult;

    return `**${LOBE_CONFIGS[primaryId].nameAr}:**\n${primaryResult}\n\n---\n\n**${LOBE_CONFIGS[secondaryId].nameAr}:**\n${secondaryResult}`;
  }

  // ── Fallback to NiyahEngine templates ─────────────────────

  private fallbackResponse(
    niyah: NiyahSession,
    routing: RoutingDecision,
    startTime: number,
    callbacks: Partial<StreamCallbacks>,
  ): AgentMessage {
    const content = `⚡ **Offline Mode** — Ollama not connected\n\n${niyah.response}\n\n---\n*Routing: ${routing.primary} → ${routing.reason}*\n*Connect Ollama for full Three-Lobe intelligence.*`;

    // Stream the fallback
    for (const char of content) {
      callbacks.onToken?.(char, routing.primary);
    }

    const msg: AgentMessage = {
      id: `agent-${Date.now().toString(36)}`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
      lobe: routing.primary,
      lobeNameAr: LOBE_CONFIGS[routing.primary].nameAr,
      niyahSession: niyah,
      routing,
      latencyMs: performance.now() - startTime,
    };
    this.addToHistory(msg);
    callbacks.onComplete?.(msg);
    return msg;
  }

  // ── History management ────────────────────────────────────

  private addToHistory(msg: AgentMessage) {
    this.history.push(msg);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  // ── Slash commands ────────────────────────────────────────

  private registerSlashCommands() {
    this.registerCommand({
      name: '/help',
      description: 'Show all available commands',
      descriptionAr: 'عرض جميع الأوامر المتاحة',
      handler: async () => {
        const lines = [
          '## HAVEN — Three-Lobe AI Commands',
          '',
          '| Command | Description |',
          '|---------|------------|',
        ];
        for (const [, cmd] of this.slashCommands) {
          lines.push(`| \`${cmd.name}\` | ${cmd.description} — ${cmd.descriptionAr} |`);
        }
        lines.push('', '---', '*Powered by Three-Lobe Architecture: Cognitive × Executive × Sensory*');
        return lines.join('\n');
      },
    });

    this.registerCommand({
      name: '/models',
      description: 'Show installed models, lobe assignments, VRAM, and quality scores',
      descriptionAr: 'عرض النماذج والتعيينات والـ VRAM والجودة',
      handler: async () => {
        const allModels = ollamaService.getModels();
        const lines = [
          '## Three-Lobe Model Intelligence',
          '',
        ];

        for (const lobeId of ALL_LOBE_IDS) {
          const config = LOBE_CONFIGS[lobeId];
          const info = modelRouter.getLobeModelInfo(lobeId);
          const status = this.getLobeStatuses().find(s => s.id === lobeId)!;
          const icon = status.available ? '🟢' : '🔴';
          const loadIcon = info.runtime.loaded ? '⚡' : '💤';

          lines.push(`${icon} **${config.emoji} ${config.nameAr}** (${config.name})`);
          lines.push(`   Model: \`${info.current || 'none'}\` ${status.available ? '— Ready' : '— Not installed'}`);
          if (info.preferred) lines.push(`   🔒 Override: \`${info.preferred}\``);
          lines.push(`   ${loadIcon} VRAM: ${info.runtime.loaded ? info.runtime.vramGB + ' GB' : 'not loaded'}`);

          if (info.metadata) {
            lines.push(`   📊 ${info.metadata.parameterSize} params | ${info.metadata.quantization} | ctx: ${info.metadata.defaultCtx.toLocaleString()}`);
          }

          // Show top 3 ranked models for this lobe
          if (info.ranked.length > 0) {
            const top3 = info.ranked.slice(0, 3).map(s => `\`${s.name}\`(${s.score})`).join(', ');
            lines.push(`   🏆 Top: ${top3}`);
          }
          lines.push('');
        }

        if (allModels.length > 0) {
          lines.push('### All Installed Models');
          for (const m of allModels) {
            const sizeGB = (m.size / 1e9).toFixed(1);
            lines.push(`- \`${m.name}\` (${sizeGB} GB)`);
          }
        } else {
          lines.push('⚠️ No models installed. Run \`/pull\` to download.');
        }

        lines.push('', '---', '*Use \`/setmodel <lobe> <model>\` to override | \`/setctx <lobe> <size>\` to change context*');
        return lines.join('\n');
      },
    });

    this.registerCommand({
      name: '/pull',
      description: 'Download all required models',
      descriptionAr: 'تحميل جميع النماذج المطلوبة',
      handler: async (_args, _ctx, callbacks) => {
        const lines = ['## Pulling Three-Lobe Models...', ''];
        const results = await this.pullRequiredModels((lobe, status, pct) => {
          callbacks?.onToken?.(`${LOBE_CONFIGS[lobe].nameAr}: ${status} ${pct}%\n`, lobe);
        });
        for (const r of results) {
          const icon = r.success ? '✅' : '❌';
          lines.push(`${icon} ${LOBE_CONFIGS[r.lobe].nameAr} (${LOBE_CONFIGS[r.lobe].model})`);
        }
        return lines.join('\n');
      },
    });

    this.registerCommand({
      name: '/niyah',
      description: 'Analyze intent with Niyah Engine',
      descriptionAr: 'تحليل النية باستخدام محرك النية',
      handler: async (args, ctx) => {
        if (!args) return '*Usage:* `/niyah <your text>`';
        const session = niyahEngine.process(args, ctx);
        const viz = niyahEngine.getLobeVisualization(session);
        const vec = niyahEngine.getVectorDisplay(session.vector);
        const routing = modelRouter.route(session.vector, args);
        return `\`\`\`\n${viz}\n\`\`\`\n\n**Niyah Vector:**\n\`\`\`\n${vec}\n\`\`\`\n\n**Routing Decision:** ${routing.primary} (${routing.reason})\n**Confidence:** ${(routing.confidence * 100).toFixed(0)}%`;
      },
    });

    this.registerCommand({
      name: '/status',
      description: 'Show agent connection status',
      descriptionAr: 'حالة اتصال الوكيل',
      handler: async () => {
        const status = ollamaService.getStatus();
        const icon = status === 'connected' ? '🟢' : status === 'connecting' ? '🟡' : '🔴';
        const models = ollamaService.getModels();
        return `${icon} **Ollama:** ${status}\n**Models:** ${models.length} installed\n**History:** ${this.history.length} messages`;
      },
    });

    this.registerCommand({
      name: '/clear',
      description: 'Clear conversation history',
      descriptionAr: 'مسح سجل المحادثة',
      handler: async () => {
        this.clearHistory();
        return '🗑️ Conversation history cleared.';
      },
    });

    this.registerCommand({
      name: '/explain',
      description: 'Explain selected code',
      descriptionAr: 'شرح الكود المحدد',
      handler: async (args, ctx, callbacks) => {
        const code = ctx.selectedCode || args;
        if (!code) return '*Select some code or provide it after the command.*';
        return this.chatThroughLobe(
          `Explain this code in detail:\n\`\`\`\n${code}\n\`\`\``,
          'cognitive', ctx, callbacks,
        );
      },
    });

    this.registerCommand({
      name: '/fix',
      description: 'Fix bugs in selected code',
      descriptionAr: 'إصلاح الأخطاء في الكود',
      handler: async (args, ctx, callbacks) => {
        const code = ctx.selectedCode || args;
        if (!code) return '*Select some code or provide it after the command.*';
        return this.chatThroughLobe(
          `Find and fix all bugs in this code. Return the corrected code with explanations:\n\`\`\`\n${code}\n\`\`\``,
          'cognitive', ctx, callbacks,
        );
      },
    });

    this.registerCommand({
      name: '/optimize',
      description: 'Optimize selected code',
      descriptionAr: 'تحسين الكود المحدد',
      handler: async (args, ctx, callbacks) => {
        const code = ctx.selectedCode || args;
        if (!code) return '*Select some code or provide it after the command.*';
        return this.chatThroughLobe(
          `Optimize this code for performance and readability. Return the improved version:\n\`\`\`\n${code}\n\`\`\``,
          'cognitive', ctx, callbacks,
        );
      },
    });

    this.registerCommand({
      name: '/test',
      description: 'Generate tests for selected code',
      descriptionAr: 'إنشاء اختبارات للكود',
      handler: async (args, ctx, callbacks) => {
        const code = ctx.selectedCode || args;
        if (!code) return '*Select some code or provide it after the command.*';
        return this.chatThroughLobe(
          `Write comprehensive tests for this code using Vitest/Jest:\n\`\`\`\n${code}\n\`\`\``,
          'cognitive', ctx, callbacks,
        );
      },
    });

    this.registerCommand({
      name: '/refactor',
      description: 'Refactor selected code',
      descriptionAr: 'إعادة هيكلة الكود',
      handler: async (args, ctx, callbacks) => {
        const code = ctx.selectedCode || args;
        if (!code) return '*Select some code or provide it after the command.*';
        return this.chatThroughLobe(
          `Refactor this code following best practices. Modern TypeScript/React patterns:\n\`\`\`\n${code}\n\`\`\``,
          'cognitive', ctx, callbacks,
        );
      },
    });

    this.registerCommand({
      name: '/plan',
      description: 'Create a project plan or architecture',
      descriptionAr: 'إنشاء خطة مشروع أو هيكلة',
      handler: async (args, ctx, callbacks) => {
        if (!args) return '*Usage:* `/plan <description of what you want to build>`';
        return this.chatThroughLobe(
          `Create a detailed project plan and architecture for: ${args}`,
          'executive', ctx, callbacks,
        );
      },
    });

    this.registerCommand({
      name: '/expose',
      description: 'Generate an expose thread',
      descriptionAr: 'إنشاء ثريد فضيحة',
      handler: async (args, ctx, callbacks) => {
        if (!args) return '*Usage:* `/expose <target and topic>`';
        return this.chatThroughLobe(
          `Write a devastating, factual expose thread about: ${args}\nMake it viral-worthy for Saudi/Arab tech Twitter. Use Arabic.`,
          'sensory', ctx, callbacks,
        );
      },
    });

    this.registerCommand({
      name: '/tweet',
      description: 'Generate a tweet/thread',
      descriptionAr: 'إنشاء تغريدة',
      handler: async (args, ctx, callbacks) => {
        if (!args) return '*Usage:* `/tweet <topic>`';
        return this.chatThroughLobe(
          `Write an engaging tweet/thread about: ${args}`,
          'sensory', ctx, callbacks,
        );
      },
    });

    this.registerCommand({
      name: '/sovereign',
      description: 'Check sovereignty compliance',
      descriptionAr: 'فحص الامتثال السيادي',
      handler: async (args, ctx, callbacks) => {
        const code = ctx.selectedCode || args;
        if (!code) return '*Select code or describe what to check.*';
        return this.chatThroughLobe(
          `Analyze this for Saudi digital sovereignty compliance (PDPL, NCA-ECC, SDAIA). Flag any external dependencies, telemetry, or data leaks:\n\`\`\`\n${code}\n\`\`\``,
          'cognitive', ctx, callbacks,
        );
      },
    });

    // ── NEW: Model management commands ──────────────────────

    this.registerCommand({
      name: '/setmodel',
      description: 'Set a specific model for a lobe',
      descriptionAr: 'تعيين نموذج محدد لفص',
      handler: async (args) => {
        const parts = args.trim().split(/\s+/);
        if (parts.length < 2) {
          return '*Usage:* `/setmodel <lobe> <model>`\n\nLobes: `cognitive`, `executive`, `sensory`\n\nExample: `/setmodel cognitive deepseek-coder-v2:16b`';
        }
        const lobeName = parts[0].toLowerCase();
        const modelName = parts.slice(1).join(' ');
        const validLobes: Record<string, LobeId> = {
          cognitive: 'cognitive', cog: 'cognitive', معرفي: 'cognitive',
          executive: 'executive', exec: 'executive', تنفيذي: 'executive',
          sensory: 'sensory', sens: 'sensory', حسي: 'sensory',
        };
        const lobeId = validLobes[lobeName];
        if (!lobeId) return `❌ Unknown lobe: \`${lobeName}\`\nValid: cognitive, executive, sensory`;
        if (!ollamaService.hasModel(modelName)) return `❌ Model \`${modelName}\` not installed.\nRun \`/pull\` or \`ollama pull ${modelName}\` first.`;
        modelRouter.setLobeModel(lobeId, modelName);
        const cfg = LOBE_CONFIGS[lobeId];
        return `✅ **${cfg.emoji} ${cfg.nameAr}** now uses \`${modelName}\`\n\n*Override active — use \`/setmodel ${lobeName} auto\` to revert to auto-assignment.*`;
      },
    });

    this.registerCommand({
      name: '/setctx',
      description: 'Set context window size for a lobe',
      descriptionAr: 'تعيين حجم نافذة السياق لفص',
      handler: async (args) => {
        const parts = args.trim().split(/\s+/);
        if (parts.length < 2) {
          return '*Usage:* `/setctx <lobe> <num_ctx>`\n\nExample: `/setctx cognitive 8192`';
        }
        const lobeName = parts[0].toLowerCase();
        const numCtx = parseInt(parts[1], 10);
        const validLobes: Record<string, LobeId> = {
          cognitive: 'cognitive', cog: 'cognitive',
          executive: 'executive', exec: 'executive',
          sensory: 'sensory', sens: 'sensory',
        };
        const lobeId = validLobes[lobeName];
        if (!lobeId) return `❌ Unknown lobe: \`${lobeName}\``;
        if (isNaN(numCtx) || numCtx < 256 || numCtx > 131072) return `❌ Invalid context size. Must be 256–131072.`;
        modelRouter.setLobeContext(lobeId, numCtx);
        const cfg = LOBE_CONFIGS[lobeId];
        return `✅ **${cfg.emoji} ${cfg.nameAr}** context set to **${numCtx.toLocaleString()}** tokens`;
      },
    });

    // ── NEW: Endpoint management ────────────────────────────────

    this.registerCommand({
      name: '/endpoint',
      description: 'Switch or list Ollama inference endpoints',
      descriptionAr: 'تبديل أو عرض نقاط اتصال Ollama',
      handler: async (args) => {
        const parts = args.trim().split(/\s+/);
        const sub = parts[0]?.toLowerCase();

        // No args → show current + list all
        if (!sub) {
          const eps = ollamaService.getEndpoints();
          const current = ollamaService.baseUrl;
          const lines = [
            '## Ollama Endpoints',
            '',
            ...eps.map(e =>
              `${e.url === current ? '▸ ' : '  '} **${e.label}** — \`${e.url}\`${e.url === current ? ' *(active)*' : ''}`
            ),
            '',
            '*Usage:*',
            '`/endpoint set <url> [label]` — switch to endpoint',
            '`/endpoint add <url> <label>` — save endpoint',
            '`/endpoint remove <url>` — remove saved endpoint',
            '`/endpoint test [url]` — test connectivity',
            '`/endpoint auth <token>` — set Bearer token for active endpoint',
            '`/endpoint auth clear` — remove auth token',
            '`/endpoint keygen` — generate a 256-bit sovereign token',
            '',
            ...(ollamaService.hasAuth ? ['🔒 Active endpoint has auth configured'] : []),
          ];
          return lines.join('\n');
        }

        // /endpoint set <url> [label]
        if (sub === 'set' || sub === 'switch' || sub === 'use') {
          const url = parts[1];
          if (!url) return '❌ Usage: `/endpoint set <url> [label]`';
          const label = parts.slice(2).join(' ') || undefined;
          const ok = await ollamaService.setEndpoint(url, label);
          const lbl = ollamaService.endpointLabel;
          return ok
            ? `✅ Switched to **${lbl}** (\`${ollamaService.baseUrl}\`)\n\n${ollamaService.getModels().length} models available.`
            : `❌ Cannot reach \`${url}\` — check the URL and ensure Ollama is running there.`;
        }

        // /endpoint add <url> <label>
        if (sub === 'add' || sub === 'save') {
          const url = parts[1];
          const label = parts.slice(2).join(' ');
          if (!url || !label) return '❌ Usage: `/endpoint add <url> <label>`';
          const normalized = url.replace(/\/+$/, '');
          const eps = ollamaService.getEndpoints();
          if (eps.find(e => e.url === normalized)) {
            return `⚠️ Endpoint \`${normalized}\` already exists.`;
          }
          // Save by switching briefly, then record
          await ollamaService.setEndpoint(normalized, label);
          return `✅ Saved & switched to **${label}** (\`${normalized}\`).`;
        }

        // /endpoint remove <url>
        if (sub === 'remove' || sub === 'delete' || sub === 'rm') {
          const url = parts[1];
          if (!url) return '❌ Usage: `/endpoint remove <url>`';
          const ok = ollamaService.removeEndpoint(url);
          return ok ? `✅ Removed \`${url}\` from saved endpoints.` : `❌ Cannot remove active endpoint. Switch first.`;
        }

        // /endpoint test [url]
        if (sub === 'test' || sub === 'ping') {
          const url = parts[1] || ollamaService.baseUrl;
          try {
            const start = performance.now();
            const res = await fetch(`${url}/api/tags`, {
              signal: AbortSignal.timeout(5000),
              headers: ollamaService.getAuthToken(url)
                ? { 'Authorization': `Bearer ${ollamaService.getAuthToken(url)}` }
                : {},
            });
            const latency = (performance.now() - start).toFixed(0);
            if (res.ok) {
              const data = await res.json();
              const models = data.models?.length || 0;
              return `✅ **${url}** is alive — ${models} model(s), ${latency}ms latency`;
            }
            return `⚠️ Reachable but returned HTTP ${res.status}`;
          } catch (err) {
            return `❌ Cannot reach \`${url}\`\n${err instanceof Error ? err.message : 'Connection failed'}`;
          }
        }

        // /endpoint auth <token> | auth clear | auth (show status)
        if (sub === 'auth' || sub === 'token') {
          const tokenArg = parts[1];

          // /endpoint auth — show status
          if (!tokenArg) {
            const has = ollamaService.hasAuth;
            return has
              ? `🔒 Auth token is set for **${ollamaService.endpointLabel}** (\`${ollamaService.baseUrl}\`).\nUse \`/endpoint auth clear\` to remove.`
              : `🔓 No auth token set for **${ollamaService.endpointLabel}**.`;
          }

          // /endpoint auth clear
          if (tokenArg === 'clear' || tokenArg === 'remove' || tokenArg === 'delete') {
            ollamaService.setAuthToken('');
            return `🔓 Auth token cleared for **${ollamaService.endpointLabel}**.`;
          }

          // /endpoint auth <token>
          ollamaService.setAuthToken(tokenArg);
          return `🔒 Bearer token set for **${ollamaService.endpointLabel}** (\`${ollamaService.baseUrl}\`).\n\nUse \`/endpoint test\` to verify connectivity.`;
        }

        // /endpoint keygen — generate cryptographically secure token
        if (sub === 'keygen' || sub === 'generate') {
          const bytes = new Uint8Array(32); // 256-bit
          crypto.getRandomValues(bytes);
          const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
          const token = `sk-haven-${hex}`;

          const lines = [
            '## 🔑 Sovereign Token Generated',
            '',
            '```',
            token,
            '```',
            '',
            '**256-bit** cryptographic entropy via Web Crypto API.',
            '',
            '*Usage:*',
            '1. Copy this token into your `bluvalt-provision.sh`:',
            '   ```bash',
            `   API_KEY="${token}" bash bluvalt-provision.sh`,
            '   ```',
            '2. Then in HAVEN IDE:',
            `   \`/endpoint auth ${token}\``,
            '',
            '⚠️ **Store this securely** — it will not be shown again.',
          ];
          return lines.join('\n');
        }

        // Unknown subcommand — assume it's a URL, try to switch
        const ok = await ollamaService.setEndpoint(sub);
        return ok
          ? `✅ Switched to **${ollamaService.endpointLabel}** (\`${ollamaService.baseUrl}\`)\n\n${ollamaService.getModels().length} models available.`
          : `❌ Cannot reach \`${sub}\` — use \`/endpoint set <url>\` with a valid Ollama URL.`;
      },
    });

    // ── NEW: Niyah Auto-Commit ──────────────────────────────

    this.registerCommand({
      name: '/autocommit',
      description: 'Generate commit message from staged diffs using AI',
      descriptionAr: 'توليد رسالة الالتزام تلقائياً من التغييرات بالذكاء الاصطناعي',
      handler: async (args, ctx, callbacks) => {
        // 1. Get current status from git
        let statuses: GitFileStatus[];
        try {
          statuses = await gitService.status();
        } catch {
          return '❌ Git not initialized. Use the **Initialize Repository** button first.';
        }

        const allChanged = statuses.filter(s => s.status !== 'unmodified');
        if (allChanged.length === 0) return '✅ Working tree clean — nothing to commit.';

        // Prefer staged files, fallback to all changes
        const target = allChanged.filter(s => s.staged);
        const filesToAnalyze = target.length > 0 ? target : allChanged;
        const scope = target.length > 0 ? 'staged' : 'unstaged';

        // 2. Gather diffs (cap at 8 files, 2000 chars each to fit context)
        const MAX_FILES = 8;
        const MAX_CHARS = 2000;
        const diffs: string[] = [];

        for (const f of filesToAnalyze.slice(0, MAX_FILES)) {
          try {
            const d = await gitService.diffFile(f.filepath);
            if (d) {
              const oldSnip = d.old.slice(0, MAX_CHARS);
              const newSnip = d.new.slice(0, MAX_CHARS);
              diffs.push(`--- ${f.filepath} (${f.status})\nOLD:\n${oldSnip}\nNEW:\n${newSnip}`);
            } else {
              diffs.push(`--- ${f.filepath} (${f.status}) [new file]`);
            }
          } catch {
            diffs.push(`--- ${f.filepath} (${f.status}) [diff unavailable]`);
          }
        }
        if (filesToAnalyze.length > MAX_FILES) {
          diffs.push(`... and ${filesToAnalyze.length - MAX_FILES} more files`);
        }

        const diffBlock = diffs.join('\n\n');

        // 3. Two-lobe pipeline: Cognitive analyzes → Sensory writes message
        const analysisPrompt = `You are a senior engineer. Analyze these git diffs and produce a structured summary of what changed and why. Be concise.\n\nScope: ${scope} (${filesToAnalyze.length} file${filesToAnalyze.length > 1 ? 's' : ''})\n\n${diffBlock}`;

        let analysis: string;
        try {
          callbacks.onToken?.('🧠 Cognitive lobe analyzing diffs...\n', 'cognitive');
          analysis = await this.executeSingleSilent(analysisPrompt, 'cognitive', ctx);
        } catch {
          // Fallback: build a basic summary for Sensory
          analysis = filesToAnalyze.map(f => `${f.status}: ${f.filepath}`).join('\n');
        }

        // 4. Sensory lobe writes the commit message in user's tone
        const style = args.trim() || 'conventional commits (type: description)';
        const msgPrompt = `Based on this change analysis, write a single git commit message.\nStyle: ${style}\nRules:\n- First line: type(scope): description (max 72 chars)\n- Optional body: bullet points of key changes\n- Be specific, not generic\n- Do NOT include markdown formatting or backticks\n- Output ONLY the commit message, nothing else\n\nAnalysis:\n${analysis}`;

        try {
          callbacks.onToken?.('✍️ Sensory lobe composing message...\n', 'sensory');
          const msg = await this.executeSingleSilent(msgPrompt, 'sensory', ctx);
          const cleaned = msg.replace(/^```[\s\S]*?\n/, '').replace(/```$/, '').trim();
          return `📝 **Auto-Generated Commit Message:**\n\n\`\`\`\n${cleaned}\n\`\`\`\n\n*${filesToAnalyze.length} ${scope} file(s) analyzed via Cognitive → Sensory pipeline.*\n*Copy the message above, or edit it to your liking.*`;
        } catch (err) {
          return `❌ Message generation failed: ${err instanceof Error ? err.message : 'unknown'}\n\n**Fallback summary:**\n${analysis}`;
        }
      },
    });

    this.registerCommand({
      name: '/blacklist',
      description: 'Blacklist or unblacklist a model for a lobe',
      descriptionAr: 'حظر أو إلغاء حظر نموذج لفص',
      handler: async (args) => {
        const parts = args.trim().split(/\s+/);
        if (parts.length < 2) {
          // Show current blacklists
          const lines = ['## Model Blacklists', ''];
          for (const lobeId of ALL_LOBE_IDS) {
            const bl = modelRouter.getBlacklist(lobeId);
            const cfg = LOBE_CONFIGS[lobeId];
            lines.push(`**${cfg.emoji} ${cfg.nameAr}:** ${bl.length > 0 ? bl.map(m => `\`${m}\``).join(', ') : '*none*'}`);
          }
          lines.push('', '*Usage:* `/blacklist <lobe> <model>` to toggle | `/blacklist clear <lobe>` to clear all');
          return lines.join('\n');
        }
        // Handle "clear" subcommand
        if (parts[0].toLowerCase() === 'clear') {
          const lobeName = parts[1]?.toLowerCase();
          const validLobes: Record<string, LobeId> = {
            cognitive: 'cognitive', cog: 'cognitive', معرفي: 'cognitive',
            executive: 'executive', exec: 'executive', تنفيذي: 'executive',
            sensory: 'sensory', sens: 'sensory', حسي: 'sensory',
          };
          const lobeId = validLobes[lobeName];
          if (!lobeId) return `❌ Unknown lobe: \`${lobeName}\``;
          const bl = modelRouter.getBlacklist(lobeId);
          for (const m of bl) modelRouter.removeFromBlacklist(lobeId, m);
          return `✅ Cleared blacklist for **${LOBE_CONFIGS[lobeId].nameAr}**`;
        }
        const lobeName = parts[0].toLowerCase();
        const modelName = parts.slice(1).join(' ');
        const validLobes: Record<string, LobeId> = {
          cognitive: 'cognitive', cog: 'cognitive', معرفي: 'cognitive',
          executive: 'executive', exec: 'executive', تنفيذي: 'executive',
          sensory: 'sensory', sens: 'sensory', حسي: 'sensory',
        };
        const lobeId = validLobes[lobeName];
        if (!lobeId) return `❌ Unknown lobe: \`${lobeName}\`\nValid: cognitive, executive, sensory`;
        // Toggle: if already blacklisted, remove; otherwise add
        const existing = modelRouter.getBlacklist(lobeId);
        if (existing.includes(modelName)) {
          modelRouter.removeFromBlacklist(lobeId, modelName);
          return `✅ Removed \`${modelName}\` from **${LOBE_CONFIGS[lobeId].nameAr}** blacklist`;
        } else {
          modelRouter.addToBlacklist(lobeId, modelName);
          return `🚫 Blacklisted \`${modelName}\` for **${LOBE_CONFIGS[lobeId].nameAr}**\nThe next-best model will be auto-assigned.`;
        }
      },
    });

    // ── Sovereign Session Purge ──────────────────────────────

    this.registerCommand({
      name: '/purge',
      description: 'Execute Sovereign Purification Protocol — wipe session state',
      descriptionAr: 'تنفيذ بروتوكول التطهير السيادي — مسح حالة الجلسة',
      handler: async (args) => {
        const depth = (['soft', 'deep', 'total'] as const).includes(args.trim() as any)
          ? (args.trim() as 'soft' | 'deep' | 'total')
          : 'deep';
        const manifest = await sovereignSessionCleaner.purge(depth);
        return sovereignSessionCleaner.formatManifest(manifest);
      },
    });
  }

  private registerCommand(cmd: SlashCommand) {
    this.slashCommands.set(cmd.name, cmd);
  }

  getSlashCommands(): { name: string; description: string; descriptionAr: string }[] {
    return Array.from(this.slashCommands.values()).map(({ name, description, descriptionAr }) => ({
      name, description, descriptionAr,
    }));
  }

  // ── Direct lobe chat (for slash commands) ─────────────────

  private async chatThroughLobe(
    prompt: string,
    lobeId: LobeId,
    context: AgentContext,
    callbacks: Partial<StreamCallbacks>,
  ): Promise<string> {
    const niyah = niyahEngine.process(prompt, context);

    if (ollamaService.getStatus() !== 'connected') {
      await ollamaService.connect();
    }

    if (ollamaService.getStatus() === 'connected') {
      try {
        // Check VRAM feasibility before firing
        const vram = modelRouter.checkVRAMFeasibility(lobeId);
        if (!vram.feasible) {
          callbacks.onError?.(`VRAM check failed: ${vram.reason}`);
          return `⚠️ ${vram.reason}\n\n${niyah.response}`;
        }
        return await this.executeSingle(prompt, lobeId, context, niyah, callbacks);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Lobe execution failed';
        callbacks.onError?.(errMsg);
        return `❌ **${LOBE_CONFIGS[lobeId].nameAr} Error:** ${errMsg}\n\n⚡ Falling back to Niyah templates:\n${niyah.response}`;
      }
    }

    // Offline fallback
    return `⚡ **Offline Mode**\n\n${niyah.response}`;
  }

  // ── Inline completion (for CodeEditor) ────────────────────

  /**
   * Get a code completion from the Cognitive lobe.
   * Optimized for speed: uses generate endpoint with FIM tokens.
   */
  async complete(
    prefix: string,
    suffix: string = '',
    language?: string,
  ): Promise<string | null> {
    if (ollamaService.getStatus() !== 'connected') return null;

    const model = modelRouter.resolveModel('cognitive');
    return ollamaService.complete(model, prefix, suffix, {
      maxTokens: 128,
      temperature: 0.2,
    });
  }

  /**
   * Get a multi-line code completion from the Cognitive lobe.
   * Slower but more complete — for explicit completion requests.
   */
  async completeBlock(
    prefix: string,
    instruction: string,
    language?: string,
  ): Promise<string | null> {
    if (ollamaService.getStatus() !== 'connected') return null;

    const model = modelRouter.resolveModel('cognitive');
    const result = await ollamaService.generate({
      model,
      prompt: `${modelRouter.getSystemPrompt('cognitive')}\n\nLanguage: ${language || 'typescript'}\n\nExisting code:\n${prefix}\n\nInstruction: ${instruction}\n\nGenerate ONLY the code, no explanations:`,
      options: {
        temperature: 0.3,
        num_predict: 512,
      },
    });

    return result?.response?.trim() || null;
  }
}

// ── Singleton ────────────────────────────────────────────────
export const threeLobeAgent = new ThreeLobeAgent();
