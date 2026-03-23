// ═══════════════════════════════════════════════════════════════════════
// NIYAH GUARD — Sovereign Intent Governance Engine
// Browser-compatible enforcement of sovereignty policies.
// Zero dependencies on filesystem — uses browser APIs + localStorage.
// ═══════════════════════════════════════════════════════════════════════

interface Governance {
  roles: string[];
  policies: {
    allowTelemetry: boolean;
    dataResidency: string;
    intentAudit: boolean;
  };
  rules: Array<{ intent: string; allowed: string[] }>;
  emergency_protocols?: {
    on_breach_detected: string;
    local_only_mode: boolean;
  };
}

const DEFAULT_GOVERNANCE: Governance = {
  roles: ['user', 'admin', 'developer', 'auditor'],
  policies: {
    allowTelemetry: false,
    dataResidency: 'local',
    intentAudit: true,
  },
  rules: [
    { intent: 'storage', allowed: ['user', 'admin', 'developer'] },
    { intent: 'api_call', allowed: ['developer', 'admin'] },
    { intent: 'debug', allowed: ['developer', 'admin'] },
    { intent: 'telemetry', allowed: [] }, // Explicitly blocked
  ],
  emergency_protocols: {
    on_breach_detected: 'lockdown',
    local_only_mode: true,
  },
};

export class NiyahGuard {
  private config: Governance;
  private violations: Array<{ intent: string; role: string; timestamp: number }> = [];
  private readonly storageKey = 'haven_governance_config';
  private readonly violationsKey = 'haven_violations_audit';

  constructor(configPath?: string) {
    // Load from localStorage or use defaults
    if (configPath) {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        try {
          this.config = JSON.parse(stored);
        } catch {
          this.config = DEFAULT_GOVERNANCE;
        }
      } else {
        this.config = DEFAULT_GOVERNANCE;
      }
    } else {
      this.config = DEFAULT_GOVERNANCE;
    }

    // Load violations audit log
    const auditStored = localStorage.getItem(this.violationsKey);
    if (auditStored) {
      try {
        this.violations = JSON.parse(auditStored);
      } catch {
        this.violations = [];
      }
    }
  }

  public authorize(intent: string, userRole: string): boolean {
    // Telemetry check
    if (!this.config.policies.allowTelemetry && intent === 'telemetry') {
      console.warn('[NiyahGuard] Blocking outbound telemetry as per sovereign policy.');
      this.recordViolation(intent, userRole);
      return false;
    }

    // Find rule for intent
    const rule = this.config.rules.find(r => r.intent === intent);
    if (!rule) {
      console.error(`[NiyahGuard] Unauthorized Intent: ${intent} is not defined in governance.`);
      this.recordViolation(intent, userRole);
      return false;
    }

    // Check role permission
    const isAllowed = rule.allowed.includes(userRole);
    if (isAllowed) {
      this.logIntent(intent, userRole, 'SUCCESS');
      return true;
    } else {
      this.logIntent(intent, userRole, 'BLOCKED');
      this.recordViolation(intent, userRole);
      this.handleViolation(intent);
      return false;
    }
  }

  private logIntent(intent: string, role: string, status: string): void {
    if (this.config.policies.intentAudit) {
      const timestamp = new Date().toISOString();
      console.log(`[AUDIT] ${timestamp} - Role: ${role} - Intent: ${intent} - Status: ${status}`);
    }
  }

  private recordViolation(intent: string, role: string): void {
    this.violations.push({
      intent,
      role,
      timestamp: Date.now(),
    });

    // Keep only last 1000 violations
    if (this.violations.length > 1000) {
      this.violations = this.violations.slice(-1000);
    }

    try {
      localStorage.setItem(this.violationsKey, JSON.stringify(this.violations));
    } catch {
      // Silently fail if storage is full
    }
  }

  private handleViolation(intent: string): void {
    const protocol = this.config.emergency_protocols;
    if (protocol?.local_only_mode) {
      console.error(`[CRITICAL] Breach detected on intent: ${intent}`);
      this.executeSovereignLockdown();
    }
  }

  private executeSovereignLockdown(): void {
    // Browser-level lockdown: clear potentially compromised storage
    try {
      // Clear sensitive data but keep governance config
      const keysToPreserve = [this.storageKey, this.violationsKey];
      const allKeys = Object.keys(localStorage);

      for (const key of allKeys) {
        if (!keysToPreserve.includes(key) && key.includes('session')) {
          localStorage.removeItem(key);
        }
      }

      console.log('[NiyahGuard] Sovereign lockdown activated — sensitive sessions cleared.');
    } catch {
      console.error('[NiyahGuard] Lockdown procedure failed.');
    }
  }

  public getConfig(): Governance {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<Governance>): void {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch {
      console.error('[NiyahGuard] Failed to persist config.');
    }
  }

  public getViolations(): Array<{ intent: string; role: string; timestamp: number }> {
    return [...this.violations];
  }

  public clearViolations(): void {
    this.violations = [];
    localStorage.removeItem(this.violationsKey);
  }

  public isLocalOnly(): boolean {
    return this.config.policies.dataResidency === 'local';
  }
}

// Global instance
export const niyahGuard = new NiyahGuard();
