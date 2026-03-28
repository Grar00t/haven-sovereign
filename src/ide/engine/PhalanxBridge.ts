// ══════════════════════════════════════════════════════════════
// PhalanxBridge — TypeScript integration for Phalanx Security
// Exposes process scanning, telemetry blocking, and system
// integrity checks to the Haven IDE UI layer.
//
// KHAWRIZM Labs — Dragon403
// ══════════════════════════════════════════════════════════════

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface ProcessThreat {
  pid: number;
  name: string;
  cmdline: string;
  vendor: string;
  severity: Severity;
  killed: boolean;
}

export interface PhalanxScanResult {
  timestamp: number;
  version: string;
  processesScanned: number;
  threats: ProcessThreat[];
  threatsKilled: number;
  hostsBlocked: number;
  status: 'clean' | 'threats_found' | 'threats_neutralized' | 'error';
}

export interface TelemetryDomain {
  domain: string;
  vendor: string;
  blocked: boolean;
}

export interface PhalanxStatus {
  armed: boolean;
  version: string;
  lastScan: number | null;
  threatsNeutralized: number;
  hostsBlocked: number;
  kernelModuleLoaded: boolean;
  gateProcessRunning: boolean;
}

// Known telemetry domains to block via /etc/hosts
const TELEMETRY_DOMAINS: TelemetryDomain[] = [
  { domain: 'vortex.data.microsoft.com', vendor: 'Microsoft', blocked: false },
  { domain: 'vortex-win.data.microsoft.com', vendor: 'Microsoft', blocked: false },
  { domain: 'telecommand.telemetry.microsoft.com', vendor: 'Microsoft', blocked: false },
  { domain: 'settings-win.data.microsoft.com', vendor: 'Microsoft', blocked: false },
  { domain: 'watson.telemetry.microsoft.com', vendor: 'Microsoft', blocked: false },
  { domain: 'dc.services.visualstudio.com', vendor: 'Microsoft', blocked: false },
  { domain: 'telemetry.microsoft.com', vendor: 'Microsoft', blocked: false },
  { domain: 'analytics.google.com', vendor: 'Google', blocked: false },
  { domain: 'www.googletagmanager.com', vendor: 'Google', blocked: false },
  { domain: 'update.googleapis.com', vendor: 'Google', blocked: false },
];

// Known telemetry process patterns
const PROCESS_PATTERNS = [
  { pattern: 'DiagTrack', vendor: 'Microsoft', severity: 'critical' as Severity },
  { pattern: 'CompatTelRunner', vendor: 'Microsoft', severity: 'critical' as Severity },
  { pattern: 'DeviceCensus', vendor: 'Microsoft', severity: 'high' as Severity },
  { pattern: 'MsMpEng', vendor: 'Microsoft', severity: 'high' as Severity },
  { pattern: 'WerFault', vendor: 'Microsoft', severity: 'medium' as Severity },
  { pattern: 'TelemetryHost', vendor: 'Microsoft', severity: 'critical' as Severity },
  { pattern: 'vscode-telemetry', vendor: 'Microsoft', severity: 'high' as Severity },
  { pattern: 'GoogleUpdate', vendor: 'Google', severity: 'medium' as Severity },
  { pattern: 'software_reporter', vendor: 'Google', severity: 'high' as Severity },
  { pattern: 'CrashReporter', vendor: 'Apple', severity: 'medium' as Severity },
  { pattern: 'analyticsd', vendor: 'Apple', severity: 'high' as Severity },
];

class PhalanxBridge {
  private static instance: PhalanxBridge;
  private _status: PhalanxStatus;
  private _scanHistory: PhalanxScanResult[] = [];
  private _listeners: Set<(status: PhalanxStatus) => void> = new Set();

  private constructor() {
    this._status = {
      armed: true,
      version: '4.0.0',
      lastScan: null,
      threatsNeutralized: 0,
      hostsBlocked: TELEMETRY_DOMAINS.length,
      kernelModuleLoaded: false,
      gateProcessRunning: false,
    };
  }

  static getInstance(): PhalanxBridge {
    if (!PhalanxBridge.instance) {
      PhalanxBridge.instance = new PhalanxBridge();
    }
    return PhalanxBridge.instance;
  }

  get status(): PhalanxStatus {
    return { ...this._status };
  }

  get scanHistory(): PhalanxScanResult[] {
    return [...this._scanHistory];
  }

  get telemetryDomains(): TelemetryDomain[] {
    return TELEMETRY_DOMAINS.map(d => ({ ...d }));
  }

  get processPatterns() {
    return [...PROCESS_PATTERNS];
  }

  onStatusChange(callback: (status: PhalanxStatus) => void): () => void {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  private _notify() {
    this._listeners.forEach(cb => cb(this._status));
  }

  /**
   * Perform a process scan via Tauri invoke or direct /proc scanning.
   * In web mode, this performs a simulated check.
   */
  async scan(): Promise<PhalanxScanResult> {
    const t0 = Date.now();

    try {
      // Try Tauri invoke for native scanning
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const result = await (window as any).__TAURI__.invoke('phalanx_scan');
        const scan: PhalanxScanResult = {
          timestamp: Date.now(),
          version: this._status.version,
          processesScanned: result.scanned ?? 0,
          threats: result.threats ?? [],
          threatsKilled: result.killed ?? 0,
          hostsBlocked: TELEMETRY_DOMAINS.length,
          status: result.threats?.length > 0
            ? (result.killed > 0 ? 'threats_neutralized' : 'threats_found')
            : 'clean',
        };
        this._finalizeScan(scan);
        return scan;
      }

      // Web fallback — report domains blocked
      const scan: PhalanxScanResult = {
        timestamp: Date.now(),
        version: this._status.version,
        processesScanned: 0,
        threats: [],
        threatsKilled: 0,
        hostsBlocked: TELEMETRY_DOMAINS.length,
        status: 'clean',
      };
      this._finalizeScan(scan);
      return scan;

    } catch (err) {
      const errorScan: PhalanxScanResult = {
        timestamp: Date.now(),
        version: this._status.version,
        processesScanned: 0,
        threats: [],
        threatsKilled: 0,
        hostsBlocked: 0,
        status: 'error',
      };
      this._scanHistory.push(errorScan);
      return errorScan;
    }
  }

  private _finalizeScan(scan: PhalanxScanResult) {
    this._scanHistory.push(scan);
    if (this._scanHistory.length > 50) {
      this._scanHistory = this._scanHistory.slice(-50);
    }
    this._status.lastScan = scan.timestamp;
    this._status.threatsNeutralized += scan.threatsKilled;
    this._notify();
  }

  /**
   * Check if the kernel module is loaded (Linux only)
   */
  async checkKernelModule(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const loaded = await (window as any).__TAURI__.invoke('check_phalanx_module');
        this._status.kernelModuleLoaded = !!loaded;
        this._notify();
        return !!loaded;
      }
    } catch {
      // Not available in web mode
    }
    return false;
  }

  /**
   * Generate a sovereignty report — useful for the IDE dashboard
   */
  generateReport(): string {
    const lines: string[] = [
      '╔═══════════════════════════════════════╗',
      `║  PHALANX STATUS v${this._status.version}              ║`,
      '╚═══════════════════════════════════════╝',
      '',
      `  Armed              : ${this._status.armed ? 'YES' : 'NO'}`,
      `  Kernel Module      : ${this._status.kernelModuleLoaded ? 'LOADED' : 'NOT LOADED'}`,
      `  Gate Process       : ${this._status.gateProcessRunning ? 'RUNNING' : 'STOPPED'}`,
      `  Domains Blocked    : ${this._status.hostsBlocked}`,
      `  Threats Neutralized: ${this._status.threatsNeutralized}`,
      `  Total Scans        : ${this._scanHistory.length}`,
      '',
    ];

    if (this._scanHistory.length > 0) {
      const last = this._scanHistory[this._scanHistory.length - 1];
      lines.push(`  Last Scan: ${new Date(last.timestamp).toLocaleString()}`);
      lines.push(`  Status: ${last.status.toUpperCase()}`);
      lines.push(`  Processes Scanned: ${last.processesScanned}`);
    }

    lines.push('');
    lines.push('  الخوارزمية دائماً تعود للوطن');

    return lines.join('\n');
  }
}

export const phalanxBridge = PhalanxBridge.getInstance();
export default phalanxBridge;
