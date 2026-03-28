import { invoke, isTauri } from '@tauri-apps/api/core';

// ══════════════════════════════════════════════════════════════
// Sovereign Tauri Bridge
// Securely tunnels requests from the React frontend to the Rust
// Core via Tauri IPC / Unix Domain Sockets.
// Built by أبو خوارزم
// ══════════════════════════════════════════════════════════════

export interface IpcResponse {
    status: 'OK' | 'ERROR';
    code: string;
    timestamp: number;
    payload?: unknown;
}

export type ThreatCategory = 'SovereigntyViolation' | 'RemoteAccess' | 'TrafficInspection';

export interface ForensicFinding {
    process_name: string;
    indicator: string;
    category: ThreatCategory;
}

export interface ForensicReport {
    scanned_processes: number;
    findings: ForensicFinding[];
}

export interface UpdaterStatus {
    configured: boolean;
    currentVersion: string;
    channel: string;
    endpoints: string[];
}

export interface AppUpdateMetadata {
    configured: boolean;
    available: boolean;
    currentVersion: string;
    version?: string | null;
    notes?: string | null;
    pubDate?: string | null;
}

export interface AppUpdateInstallResult {
    installed: boolean;
    restarted: boolean;
    detail: string;
}

export interface EnsureLocalOllamaResult {
    available: boolean;
    started: boolean;
    detail: string;
    path?: string | null;
}

export interface TerminalToolStatus {
    name: string;
    category: string;
    available: boolean;
    launchable: boolean;
    interactive: boolean;
    path?: string | null;
    note: string;
}

export interface TerminalCommandResult {
    ok: boolean;
    command: string;
    exitCode?: number | null;
    stdout: string;
    stderr: string;
    cwd: string;
    durationMs: number;
}

export type ReviewSeverity = 'Info' | 'Warning' | 'Critical';
export type ReviewCategory = 'ExternalConnection' | 'HardcodedEndpoint' | 'TelemetryHook' | 'NetworkPrimitive';

export interface SovereignReviewFinding {
    title: string;
    detail: string;
    severity: ReviewSeverity;
    category: ReviewCategory;
    line: number;
    evidence: string;
}

export interface SovereignCodeReview {
    file_path: string;
    language: string;
    sovereignty_score: number;
    findings: SovereignReviewFinding[];
    summary: string;
}

type SovereignCommand =
    | 'gratech_route'
    | 'phalanx_health_check'
    | 'forensics_scan'
    | 'ollama_proxy'
    | 'ensure_local_ollama'
    | 'list_terminal_tools'
    | 'run_terminal_command'
    | 'updater_status'
    | 'fetch_app_update'
    | 'install_app_update'
    | 'sovereign_code_review'
    | 'emergency_shred';

/**
 * THE SOVEREIGN KERNEL WRAPPER
 * Bridges the User Plane (IDE) to the Sovereign Core (Rust).
 */
export class SovereignTauriBridge {
    private readonly isDesktop = typeof window !== 'undefined' && isTauri();
    private readonly trustedStoragePrefixes = [
        'haven',
        'sovereign',
        'niyah',
        'react',
        'router',
        'rr',
        'zustand',
        'monaco',
        'workbox',
        'vite',
        'theme',
    ];
    private readonly suspiciousStoragePatterns = [
        /^_ga/i,
        /^_gid/i,
        /^_gat/i,
        /^fbclid$/i,
        /^gclid$/i,
        /^ajs_/i,
        /^mp_/i,
        /^sentry/i,
        /^hj/i,
        /^hotjar/i,
        /^intercom/i,
        /^segment/i,
        /^mixpanel/i,
        /^amplitude/i,
        /^hubspot/i,
        /telemetry/i,
        /tracking/i,
        /analytics/i,
    ];

    constructor() {
        if (this.isDesktop) {
            console.log('[SovereignTauri] Initialized in Desktop Mode 🖥️');
        } else {
            console.log('[SovereignTauri] Initialized in Browser Mode 🌐 (Simulated)');
        }
        this.injectPoisonPill();
        this.startHeartbeat();
    }

    /**
     * POISON PILL LAYER
     * Detects and neutralizes Big Tech telemetry, FLoC, and tracking pixels
     * before they can egress data.
     */
    private injectPoisonPill() {
        if (typeof window === 'undefined') return;

        // 1. Strip FLoC / Topics API
        if ('document' in window && 'interestCohort' in window.document) {
            Object.defineProperty(window.document, 'interestCohort', { value: null });
        }

        // 2. Audit fetch/XHR/Beacons for exfiltration patterns
        const sovereignWhitelist = ['localhost', '127.0.0.1', 'khawrizm.sa'];
        const isSuspicious = (url: string) => {
            try {
                const hostname = new URL(url).hostname;
                const isLocal = sovereignWhitelist.some(d => hostname === d || hostname.endsWith(`.${d}`));
                const hasTelemetryKw = /google-analytics|facebook|sentry|hotjar|segment|mixpanel|telemetry|track/.test(url);
                return !isLocal || hasTelemetryKw;
            } catch { return true; }
        };

        // Monkey-patch Fetch
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
            if (isSuspicious(url)) {
                console.warn('🛡️ [POISON PILL] Fetch exfiltration blocked:', url);
                this.triggerPurge('FETCH_EXFILTRATION_ATTEMPT');
                throw new TypeError('Sovereign Policy Violation');
            }
            return originalFetch(...args);
        };

        // Monkey-patch sendBeacon (Critical for sophisticated trackers)
        const originalSendBeacon = navigator.sendBeacon;
        navigator.sendBeacon = (url, data) => {
            if (isSuspicious(typeof url === 'string' ? url : url.toString())) {
                console.warn('🛡️ [POISON PILL] Beacon exfiltration neutralized');
                return true; // Pretend it succeeded
            }
            return originalSendBeacon.call(navigator, url, data);
        };

        // 3. Monitor Resource Timing for stealth egress (DNS Prefetching, etc.)
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                const url = (entry as any).name || '';
                if (isSuspicious(url)) {
                    console.warn('🛡️ [POISON PILL] Neutralized tracker:', url);
                    this.triggerPurge('TELEMETRY_ATTEMPT_DETECTED');
                }
            });
        });
        observer.observe({ entryTypes: ['resource'] });
    }

    /**
     * Send a payload to the Gratech Gateway via IPC.
     * The payload should already be encrypted by the time it reaches here.
     */
    async dispatchSecurePayload(targetNode: string, encryptedPayload: string): Promise<IpcResponse> {
        if (!this.isDesktop) {
            return this.simulateDispatch(targetNode);
        }

        try {
            const result = await this.invokeCommand<IpcResponse>('gratech_route', {
                target: targetNode,
                payload: encryptedPayload,
            });
            return result;
        } catch (err) {
            console.error('[SovereignTauri] IPC Bridge Error:', err);
            return { status: 'ERROR', code: 'IPC_FAILURE', timestamp: Date.now() };
        }
    }

    /**
     * Check the health of the Phalanx Kernel modules.
     */
    async checkPhalanxHealth(): Promise<boolean> {
        if (!this.isDesktop) return true; // Always healthy in simulation
        try {
            return await this.invokeCommand<boolean>('phalanx_health_check');
        } catch {
            return false;
        }
    }

    async scanForensics(): Promise<ForensicReport> {
        if (!this.isDesktop) {
            return this.simulateForensicsScan();
        }

        try {
            return await this.invokeCommand<ForensicReport>('forensics_scan');
        } catch (err) {
            console.error('[SovereignTauri] Forensics scan failed:', err);
            return { scanned_processes: 0, findings: [] };
        }
    }

    /**
     * Tunnels Ollama requests through the Rust Core to bypass WebView CORS/CSP.
     */
    async ollamaProxy(method: string, path: string, body?: unknown): Promise<any> {
        if (!this.isDesktop) {
            // In browser mode, we attempt a direct fetch as a fallback
            const resp = await fetch(`http://127.0.0.1:11434${path}`, {
                method,
                body: body ? JSON.stringify(body) : undefined,
            });
            return resp.json();
        }
        return await this.invokeCommand<any>('ollama_proxy', {
            method,
            path,
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async ensureLocalOllama(): Promise<EnsureLocalOllamaResult> {
        if (!this.isDesktop) {
            return {
                available: false,
                started: false,
                detail: 'Auto-start is only available inside the desktop shell.',
                path: null,
            };
        }

        try {
            return await this.invokeCommand<EnsureLocalOllamaResult>('ensure_local_ollama');
        } catch (err) {
            console.error('[SovereignTauri] ensure_local_ollama failed:', err);
            return {
                available: false,
                started: false,
                detail: 'Failed to reach the desktop Ollama bridge.',
                path: null,
            };
        }
    }

    async listTerminalTools(): Promise<TerminalToolStatus[]> {
        if (!this.isDesktop) {
            return [
                {
                    name: 'desktop-shell',
                    category: 'Desktop Bridge',
                    available: false,
                    launchable: false,
                    interactive: false,
                    path: null,
                    note: 'Real tool discovery only works inside the Tauri desktop shell.',
                },
            ];
        }

        try {
            return await this.invokeCommand<TerminalToolStatus[]>('list_terminal_tools');
        } catch (err) {
            console.error('[SovereignTauri] Terminal tool discovery failed:', err);
            return [
                {
                    name: 'desktop-shell',
                    category: 'Desktop Bridge',
                    available: false,
                    launchable: false,
                    interactive: false,
                    path: null,
                    note: 'Failed to reach the desktop shell bridge.',
                },
            ];
        }
    }

    async runTerminalCommand(command: string, args: string[] = [], cwd?: string, timeoutMs = 15000): Promise<TerminalCommandResult> {
        if (!this.isDesktop) {
            return {
                ok: false,
                command: [command, ...args].join(' ').trim(),
                exitCode: null,
                stdout: '',
                stderr: 'Real terminal execution only works inside the desktop Tauri shell.',
                cwd: cwd || 'browser-preview',
                durationMs: 0,
            };
        }

        try {
            return await this.invokeCommand<TerminalCommandResult>('run_terminal_command', {
                request: {
                    command,
                    args,
                    cwd,
                    timeoutMs,
                },
            });
        } catch (err) {
            console.error('[SovereignTauri] Terminal command failed:', err);
            return {
                ok: false,
                command: [command, ...args].join(' ').trim(),
                exitCode: null,
                stdout: '',
                stderr: err instanceof Error ? err.message : 'Desktop terminal command failed.',
                cwd: cwd || 'desktop-shell',
                durationMs: 0,
            };
        }
    }

    async getUpdaterStatus(): Promise<UpdaterStatus> {
        if (!this.isDesktop) {
            return {
                configured: false,
                currentVersion: 'browser-preview',
                channel: 'stable',
                endpoints: [],
            };
        }

        try {
            return await this.invokeCommand<UpdaterStatus>('updater_status');
        } catch (err) {
            console.error('[SovereignTauri] Updater status failed:', err);
            return {
                configured: false,
                currentVersion: 'unknown',
                channel: 'stable',
                endpoints: [],
            };
        }
    }

    async checkForAppUpdate(): Promise<AppUpdateMetadata> {
        if (!this.isDesktop) {
            return {
                configured: false,
                available: false,
                currentVersion: 'browser-preview',
                notes: 'Desktop updates are only available in the Tauri shell.',
            };
        }

        try {
            return await this.invokeCommand<AppUpdateMetadata>('fetch_app_update');
        } catch (err) {
            console.error('[SovereignTauri] Fetch update failed:', err);
            return {
                configured: false,
                available: false,
                currentVersion: 'unknown',
                notes: 'Failed to reach the desktop update service.',
            };
        }
    }

    async installAppUpdate(): Promise<AppUpdateInstallResult> {
        if (!this.isDesktop) {
            return {
                installed: false,
                restarted: false,
                detail: 'Desktop updates are only available in the Tauri shell.',
            };
        }

        return this.invokeCommand<AppUpdateInstallResult>('install_app_update');
    }

    async reviewCode(code: string, filePath: string, language?: string): Promise<SovereignCodeReview> {
        if (!this.isDesktop) {
            return this.simulateCodeReview(code, filePath, language);
        }

        // Integration Point: Call NIYAH for a real forensic audit
        // This tunnels through the ollama_proxy to stay sovereign
        /*
        const niyahAnalysis = await this.ollamaProxy('POST', '/api/generate', {
            model: 'niyah:v4',
            prompt: `AUDIT_SOVEREIGNTY: ${code}`,
            stream: false
        });
        // Parse and return niyahAnalysis.response
        */

        try {
            return await this.invokeCommand<SovereignCodeReview>('sovereign_code_review', {
                code,
                filePath,
                language,
            });
        } catch (err) {
            console.error('[SovereignTauri] Sovereign code review failed:', err);
            return {
                file_path: filePath,
                language: language || 'plaintext',
                sovereignty_score: 100,
                findings: [],
                summary: 'Sovereign code review failed to execute in the desktop bridge.',
            };
        }
    }

    /**
     * EMERGENCY PURGE & SHRED
     * Triggers the Rust kernel to overwrite memory and delete session files.
     */
    async triggerPurge(reason: string): Promise<void> {
        console.error(`💀 [SOVEREIGN KERNEL] PURGE TRIGGERED: ${reason}`);
        if (this.isDesktop) {
            await this.invokeCommand<IpcResponse>('emergency_shred', { reason });
        } else {
            console.warn('[SovereignTauri] Browser-mode purge downgraded to safe cleanup.');
            this.removeSuspiciousStorageKeys();
        }
    }

    private invokeCommand<T>(cmd: SovereignCommand, args?: Record<string, unknown>): Promise<T> {
        return invoke<T>(cmd, args);
    }

    isDesktopShell(): boolean {
        return this.isDesktop;
    }

    private isTrustedStorageKey(key: string): boolean {
        return this.trustedStoragePrefixes.some(prefix =>
            key === prefix || key.startsWith(`${prefix}_`) || key.startsWith(`${prefix}-`)
        );
    }

    private isSuspiciousStorageKey(key: string): boolean {
        return this.suspiciousStoragePatterns.some(pattern => pattern.test(key));
    }

    private removeSuspiciousStorageKeys() {
        if (typeof window === 'undefined') return;

        for (const key of Object.keys(localStorage)) {
            if (this.isSuspiciousStorageKey(key)) {
                localStorage.removeItem(key);
            }
        }

        for (const key of Object.keys(sessionStorage)) {
            if (this.isSuspiciousStorageKey(key)) {
                sessionStorage.removeItem(key);
            }
        }
    }

    private startHeartbeat() {
        // Check for telemetry-like storage keys without breaking normal app state.
        setInterval(async () => {
            const suspicious = Object.keys(localStorage).filter(key =>
                !this.isTrustedStorageKey(key) && this.isSuspiciousStorageKey(key)
            );

            if (suspicious.length > 0) {
                await this.triggerPurge('UNAUTHORIZED_STORAGE_DETECTED');
            }
        }, 5000);
    }

    private async simulateDispatch(target: string): Promise<IpcResponse> {
        // Simulate network delay
        await new Promise(r => setTimeout(r, 600));

        console.log(`[SovereignTauri] 📡 Mock Payload dispatched to ${target} via Gratech Gateway`);

        return {
            status: 'OK',
            code: 'DISPATCHED_SIMULATED',
            timestamp: Date.now(),
            payload: { route: 'DIRECT', latency: 45 }
        };
    }

    private async simulateForensicsScan(): Promise<ForensicReport> {
        await new Promise(r => setTimeout(r, 350));

        return {
            scanned_processes: 3,
            findings: [],
        };
    }

    private async simulateCodeReview(code: string, filePath: string, language?: string): Promise<SovereignCodeReview> {
        await new Promise(r => setTimeout(r, 300));

        const lower = code.toLowerCase();
        const findings: SovereignReviewFinding[] = [];

        if (lower.includes('fetch(')) {
            findings.push({
                title: 'Dynamic fetch detected',
                detail: 'The browser fallback found a fetch call in the active source.',
                severity: 'Warning',
                category: 'ExternalConnection',
                line: 1,
                evidence: 'fetch(...)',
            });
        }

        if (lower.includes('http://') || lower.includes('https://')) {
            findings.push({
                title: 'Remote endpoint hardcoded',
                detail: 'The browser fallback found a hardcoded URL in source.',
                severity: lower.includes('localhost') || lower.includes('127.0.0.1') ? 'Info' : 'Warning',
                category: 'HardcodedEndpoint',
                line: 1,
                evidence: code.slice(0, 120),
            });
        }

        const severityPenalty = findings.reduce((total, finding) => {
            switch (finding.severity) {
                case 'Critical':
                    return total + 30;
                case 'Warning':
                    return total + 15;
                default:
                    return total + 5;
            }
        }, 0);

        return {
            file_path: filePath,
            language: language || 'plaintext',
            sovereignty_score: Math.max(0, 100 - severityPenalty),
            findings,
            summary: findings.length > 0
                ? `Detected ${findings.length} sovereignty risk indicator(s) in the active source file.`
                : 'No external egress indicators were detected in the reviewed source.',
        };
    }
}

export const sovereignTauri = new SovereignTauriBridge();
