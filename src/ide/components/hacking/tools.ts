import {
  Shield, Terminal, Wifi, Database, Globe, Zap,
  Fingerprint, Cookie, Eye, HardDrive, Search,
  FileText, Network,
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
  // ── SIMULATED TOOLS ────────────────────────────────────────
  {
    id: 'msf', name: 'Metasploit Scanner', nameAr: 'ماسح ميتاسبلويت',
    icon: Terminal, color: '#FF0040', category: 'exploit',
    description: 'Network vulnerability scanner (simulated)',
    isReal: false, command: 'msf> use auxiliary/scanner/portscan/tcp',
    simulatedOutput: [
      '[*] Initializing Metasploit Framework v6.4...',
      '[*] Loading module: auxiliary/scanner/portscan/tcp',
      '[+] Target: 192.168.1.0/24',
      '[*] Scanning 254 hosts...',
      '[+] 192.168.1.1:22   - SSH (OpenSSH 8.9)',
      '[+] 192.168.1.1:443  - HTTPS (TLS 1.3)',
      '[+] 192.168.1.100:11434 - Ollama API ✅ SOVEREIGN',
      '[*] Scan complete. 3 services found.',
    ], duration: 3000,
  },
  {
    id: 'sqlmap', name: 'SQLMap Injection Test', nameAr: 'فحص حقن SQL',
    icon: Database, color: '#FF6B00', category: 'exploit',
    description: 'SQL injection vulnerability tester (simulated)',
    isReal: false, command: "sqlmap -u 'http://target/api?id=1' --dbs",
    simulatedOutput: [
      '[*] Starting sqlmap v1.8...',
      '[*] Testing parameter: id',
      '[+] Parameter "id" is vulnerable (time-based blind)',
      '[+] Back-end DBMS: MySQL >= 5.7',
      '[!] WARNING: This is a SIMULATION.',
      '[*] Recommendation: Use parameterized queries.',
    ], duration: 3000,
  },
  {
    id: 'nj_rat', name: 'NJ_RAT Detector', nameAr: 'كاشف الاختراق',
    icon: Eye, color: '#FF4444', category: 'defense',
    description: 'Remote Access Trojan detection (simulated)',
    isReal: false, command: 'dragon_scan --detect-rat --deep',
    simulatedOutput: [
      '[*] DRAGON RAT Detector v2.0',
      '[*] Scanning processes, registry, network...',
      '    njRAT: NOT FOUND ✅',
      '    DarkComet: NOT FOUND ✅',
      '    AsyncRAT: NOT FOUND ✅',
      '[+] System is CLEAN.',
    ], duration: 2500,
  },
  {
    id: 'firewall', name: 'Telemetry Firewall', nameAr: 'جدار الحماية',
    icon: Globe, color: '#00FF00', category: 'defense',
    description: 'Block surveillance endpoints (simulated)',
    isReal: false, command: 'dragon_firewall --block-telemetry --sovereign',
    simulatedOutput: [
      '[*] DRAGON Firewall — Sovereign Bypass Mode',
      '[+] BLOCKED: telemetry.microsoft.com',
      '[+] BLOCKED: telemetry.vscode.dev',
      '[+] BLOCKED: analytics.google.com',
      '[+] ALLOWED: localhost:11434 (Ollama) ✅',
      '[*] 2,847 surveillance domains blocked.',
      '[*] Sovereign mode: ACTIVE 🇸🇦',
    ], duration: 2000,
  },
];

export const CATEGORY_COLORS: Record<string, { color: string; label: string }> = {
  real:    { color: '#00FF00', label: 'REAL' },
  recon:   { color: '#FFD700', label: 'RECON' },
  exploit: { color: '#FF0040', label: 'SIM' },
  defense: { color: '#00BFFF', label: 'SIM' },
  audit:   { color: '#00FF00', label: 'AUDIT' },
};
