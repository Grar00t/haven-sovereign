/**
 * SovereignSessionCleaner — Encrypted Session Management
 * AES-256-GCM encryption for session data with TTL and LRU eviction
 */

export interface SessionConfig {
  encryptionAlgorithm: string;
  keyDerivationIterations: number;
  sessionTTL: number;
  maxSessions: number;
}

export interface EncryptedSession {
  id: string;
  encrypted: string;
  iv: string;
  tag: string;
  timestamp: number;
  expiresAt: number;
}

export interface PurgeManifest {
  deletedCount: number;
  freedBytes: number;
  remainingSessions: number;
  timestamp: number;
}

export class SovereignSessionCleaner {
  private config: SessionConfig;
  private sessions: Map<string, EncryptedSession>;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private masterKey: CryptoKey | null = null;

  constructor(config?: Partial<SessionConfig>) {
    this.config = {
      encryptionAlgorithm: 'AES-256-GCM',
      keyDerivationIterations: 100000,
      sessionTTL: 3600000, // 1 hour
      maxSessions: 100,
      ...config,
    };
    this.sessions = new Map();
    this.startCleanupTimer();
  }

  private startCleanupTimer() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
  }

  private async getMasterKey(): Promise<CryptoKey> {
    if (this.masterKey) return this.masterKey;
    // Generate a session-specific master key in memory
    this.masterKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    return this.masterKey;
  }

  private cleanup() {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(id);
      }
    }

    // LRU eviction if exceeding max
    if (this.sessions.size > this.config.maxSessions) {
      const sorted = Array.from(this.sessions.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = sorted.length - this.config.maxSessions;
      for (let i = 0; i < toRemove; i++) {
        this.sessions.delete(sorted[i][0]);
      }
    }
  }

  async createSession(data: string, sessionId: string): Promise<EncryptedSession> {
    const key = await this.getMasterKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);

    // Perform actual encryption
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    const now = Date.now();
    // Store as Base64 to keep interface consistent
    const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));

    const session: EncryptedSession = {
      id: sessionId,
      encrypted: encryptedBase64,
      iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
      tag: '',
      timestamp: now,
      expiresAt: now + this.config.sessionTTL,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async decryptSession(sessionId: string): Promise<string | null> {
    const session = this.getSession(sessionId);
    if (!session || !this.masterKey) return null;

    try {
      const key = this.masterKey;
      const iv = new Uint8Array(session.iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      const ciphertext = Uint8Array.from(atob(session.encrypted), c => c.charCodeAt(0));

      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
      return new TextDecoder().decode(decrypted);
    } catch (err) {
      console.error('[SovereignSessionCleaner] Decryption failed:', err);
      return null;
    }
  }

  getSession(sessionId: string): EncryptedSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (session.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  getAllSessions(): EncryptedSession[] {
    return Array.from(this.sessions.values()).filter(
      s => s.expiresAt >= Date.now()
    );
  }

  /**
   * Execute Sovereign Purification Protocol
   * Wipes session state based on depth level
   */
  async purge(depth: 'soft' | 'deep' | 'total'): Promise<PurgeManifest> {
    const initialCount = this.sessions.size;
    let deleted = 0;
    let bytesFreed = 0;

    if (depth === 'total') {
      // Full wipe including keys
      this.sessions.forEach(s => bytesFreed += s.encrypted.length);
      this.sessions.clear();
      deleted = initialCount;
      this.masterKey = null; // Destroy key
    } else {
      // Wipe expired or overflow
      this.cleanup();
      deleted = initialCount - this.sessions.size;
    }

    return {
      deletedCount: deleted,
      freedBytes: bytesFreed, // Approximation
      remainingSessions: this.sessions.size,
      timestamp: Date.now()
    };
  }

  formatManifest(manifest: PurgeManifest): string {
    return `🛡️ **Sovereign Purge Complete**\n` +
      `- Sessions incinerated: ${manifest.deletedCount}\n` +
      `- Memory reclaimed: ~${(manifest.freedBytes / 1024).toFixed(2)} KB\n` +
      `- Active active contexts: ${manifest.remainingSessions}`;
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessions.clear();
    this.masterKey = null;
  }
}

// Singleton instance
export const sovereignSessionCleaner = new SovereignSessionCleaner();
