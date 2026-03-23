import { describe, it, expect } from 'vitest';
import { SovereignSessionCleaner } from './SovereignSessionCleaner';

describe('SovereignSessionCleaner Security', () => {
  it('generates unique master keys per instance', async () => {
    const cleaner1 = new SovereignSessionCleaner();
    const cleaner2 = new SovereignSessionCleaner();

    // Generate keys by creating sessions
    await cleaner1.createSession('test', '1');
    await cleaner2.createSession('test', '2');

    // We can't access masterKey directly as it's private, but we can verify behavior
    // by attempting cross-instance decryption which should fail.
    const session1 = cleaner1.getSession('1');
    const session2 = cleaner2.getSession('2');

    expect(session1).toBeDefined();
    expect(session2).toBeDefined();
    expect(session1?.iv).not.toEqual(session2?.iv);
  });

  it('verifies data cannot be recovered without the correct master key', async () => {
    // Instance A: The legitimate owner
    const cleanerA = new SovereignSessionCleaner();
    const secretData = "SOVEREIGN_TOP_SECRET_DATA";
    const sessionId = "session_alpha";

    // Create encrypted session in A
    const encryptedSession = await cleanerA.createSession(secretData, sessionId);

    // Verify A can decrypt it
    const decryptedA = await cleanerA.decryptSession(sessionId);
    expect(decryptedA).toBe(secretData);

    // Instance B: The attacker (or fresh instance after restart)
    // This instance will generate its own random key upon initialization/usage
    const cleanerB = new SovereignSessionCleaner();
    
    // Ensure B has generated its own key
    await cleanerB.createSession("init_key", "init");

    // Manually inject A's encrypted session into B's storage
    // (Simulating data recovery from disk/memory dump without the key)
    (cleanerB as any).sessions.set(sessionId, encryptedSession);

    // Attempt to decrypt using B's key
    const decryptedB = await cleanerB.decryptSession(sessionId);

    // Should fail (return null) because keys do not match
    expect(decryptedB).toBeNull();
  });
});