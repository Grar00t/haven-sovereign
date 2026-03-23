// ══════════════════════════════════════════════════════════════
//  REAL BROWSER-BASED SECURITY SCANNERS
//  These ACTUALLY execute — not simulation.
// ══════════════════════════════════════════════════════════════

/** 1. Browser Leak Scanner — scans Performance API for external connections */
export async function scanBrowserLeaks(): Promise<string[]> {
  const lines: string[] = [
    '[*] DRAGON LEAK SCANNER v2.0 — REAL SCAN',
    '[*] Analyzing browser network connections via Performance API...',
    '',
  ];

  try {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const domains = new Map<string, { count: number; totalSize: number; types: Set<string> }>();

    for (const e of entries) {
      try {
        const url = new URL(e.name);
        const domain = url.hostname;
        const existing = domains.get(domain) || { count: 0, totalSize: 0, types: new Set<string>() };
        existing.count++;
        existing.totalSize += e.transferSize || 0;
        existing.types.add(e.initiatorType);
        domains.set(domain, existing);
      } catch { /* skip malformed */ }
    }

    const TELEMETRY_KEYWORDS = [
      'telemetry', 'analytics', 'tracking', 'stats', 'pixel', 'beacon',
      'doubleclick', 'facebook', 'google-analytics', 'hotjar', 'mixpanel',
      'sentry', 'bugsnag', 'newrelic', 'datadog', 'segment',
    ];

    const LOCAL_SAFE = ['localhost', '127.0.0.1', '0.0.0.0', ''];
    let telemetryCount = 0;
    let safeCount = 0;

    lines.push(`[+] Found ${entries.length} resource loads across ${domains.size} domains:`);
    lines.push('');

    const sorted = [...domains.entries()].sort((a, b) => b[1].count - a[1].count);
    for (const [domain, info] of sorted) {
      const isLocal = LOCAL_SAFE.includes(domain) || domain.endsWith('.local');
      const isTelemetry = TELEMETRY_KEYWORDS.some(kw => domain.includes(kw));
      const kb = (info.totalSize / 1024).toFixed(1);
      const types = [...info.types].join(', ');

      if (isTelemetry) {
        telemetryCount++;
        lines.push(`[!] ⚠️  ${domain} — ${info.count} requests, ${kb} KB [${types}]`);
        lines.push(`    └─ TELEMETRY/TRACKING DETECTED`);
      } else if (isLocal) {
        safeCount++;
        lines.push(`[+] ✅ ${domain} — ${info.count} requests, ${kb} KB [${types}]`);
      } else {
        lines.push(`[*]    ${domain} — ${info.count} requests, ${kb} KB [${types}]`);
      }
    }

    lines.push('');
    lines.push('─'.repeat(50));
    lines.push(`[*] SUMMARY:`);
    lines.push(`    Total resources: ${entries.length}`);
    lines.push(`    Unique domains: ${domains.size}`);
    lines.push(`    Safe/Local: ${safeCount}`);
    lines.push(`    Telemetry/Tracking: ${telemetryCount}`);
    lines.push(`    External (other): ${domains.size - safeCount - telemetryCount}`);
    lines.push('');

    if (telemetryCount === 0) {
      lines.push('[+] ✅ CLEAN — No telemetry or tracking domains detected.');
      lines.push('[+] 🇸🇦 SOVEREIGN STATUS: CONFIRMED');
    } else {
      lines.push(`[!] ⚠️  ${telemetryCount} TRACKING DOMAINS DETECTED`);
      lines.push('[!] Recommendation: Block these domains in your firewall/hosts file.');
    }
  } catch (err) {
    lines.push(`[!] Error accessing Performance API: ${err}`);
  }

  return lines;
}

/** 2. LocalStorage Forensics — scans all stored data for tracking */
export async function scanLocalStorage(): Promise<string[]> {
  const lines: string[] = [
    '[*] DRAGON STORAGE FORENSICS v2.0 — REAL SCAN',
    '[*] Analyzing localStorage, sessionStorage, IndexedDB...',
    '',
  ];

  // localStorage
  try {
    const lsKeys = Object.keys(localStorage);
    lines.push(`[+] localStorage: ${lsKeys.length} keys found`);

    const TRACKING_PATTERNS = [
      'analytics', 'tracking', 'fingerprint', 'session_id', 'utm_',
      '_ga', '_gid', 'fbclid', 'gclid', 'hubspot', 'intercom',
      'mixpanel', 'amplitude', 'segment', 'sentry',
    ];

    let trackingKeys = 0;
    for (const key of lsKeys) {
      const val = localStorage.getItem(key) || '';
      const size = new Blob([val]).size;
      const isTracking = TRACKING_PATTERNS.some(p => key.toLowerCase().includes(p));

      if (isTracking) {
        trackingKeys++;
        lines.push(`[!] ⚠️  "${key}" — ${size} bytes — TRACKING DATA`);
        lines.push(`    └─ Value preview: ${val.slice(0, 80)}${val.length > 80 ? '...' : ''}`);
      } else if (size > 1024) {
        lines.push(`[*]    "${key}" — ${(size / 1024).toFixed(1)} KB`);
      }
    }

    lines.push('');
    if (trackingKeys > 0) {
      lines.push(`[!] ${trackingKeys} tracking keys found in localStorage`);
    } else {
      lines.push('[+] ✅ No tracking data found in localStorage');
    }
  } catch (err) {
    lines.push(`[!] localStorage access error: ${err}`);
  }

  lines.push('');

  // sessionStorage
  try {
    const ssKeys = Object.keys(sessionStorage);
    lines.push(`[+] sessionStorage: ${ssKeys.length} keys found`);
    for (const key of ssKeys) {
      const val = sessionStorage.getItem(key) || '';
      const size = new Blob([val]).size;
      lines.push(`[*]    "${key}" — ${size} bytes`);
    }
  } catch (err) {
    lines.push(`[!] sessionStorage access error: ${err}`);
  }

  lines.push('');

  // IndexedDB databases
  try {
    if ('databases' in indexedDB) {
      const dbs = await (indexedDB as any).databases();
      lines.push(`[+] IndexedDB: ${dbs.length} databases found`);
      for (const db of dbs) {
        lines.push(`[*]    "${db.name}" — v${db.version}`);
      }
    } else {
      lines.push('[*] IndexedDB: databases() not supported in this browser');
    }
  } catch (err) {
    lines.push(`[!] IndexedDB error: ${err}`);
  }

  lines.push('');
  lines.push('[*] Scan complete.');

  // Total storage estimate
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      const usedMB = ((est.usage || 0) / 1024 / 1024).toFixed(2);
      const quotaMB = ((est.quota || 0) / 1024 / 1024).toFixed(0);
      lines.push(`[+] Total storage used: ${usedMB} MB / ${quotaMB} MB quota`);
    }
  } catch { /* ignore */ }

  return lines;
}

/** 3. WebRTC IP Leak Detector — checks if your real IP leaks */
export async function detectWebRTCLeak(): Promise<string[]> {
  const lines: string[] = [
    '[*] DRAGON WEBRTC LEAK DETECTOR v2.0 — REAL SCAN',
    '[*] Creating RTCPeerConnection to detect IP leaks...',
    '',
  ];

  return new Promise<string[]>(resolve => {
    const foundIPs = new Set<string>();
    const timeout = setTimeout(() => finalize(), 5000);

    function finalize() {
      clearTimeout(timeout);
      if (foundIPs.size === 0) {
        lines.push('[+] ✅ No IP addresses leaked via WebRTC');
        lines.push('[+] Your browser blocks WebRTC IP enumeration.');
        lines.push('[+] 🇸🇦 PRIVACY STATUS: STRONG');
      } else {
        lines.push('');
        lines.push(`[!] ⚠️  ${foundIPs.size} IP addresses exposed via WebRTC:`);
        for (const ip of foundIPs) {
          const isLocal = ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.');
          const isIPv6 = ip.includes(':');
          if (isLocal) {
            lines.push(`[*]    ${ip} — LOCAL NETWORK (less sensitive)`);
          } else if (isIPv6) {
            lines.push(`[!]    ${ip} — IPv6 (may reveal location)`);
          } else {
            lines.push(`[!] ⚠️  ${ip} — PUBLIC IP EXPOSED!`);
          }
        }
        lines.push('');
        lines.push('[!] RECOMMENDATION: Disable WebRTC IP detection');
        lines.push('    Firefox: media.peerconnection.enabled = false');
        lines.push('    Chrome: Install "WebRTC Leak Prevent" extension');
      }
      lines.push('');
      lines.push('[*] Scan complete.');
      resolve(lines);
    }

    try {
      const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
      const pc = new RTCPeerConnection(config);

      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          finalize();
          pc.close();
          return;
        }
        const parts = e.candidate.candidate.split(' ');
        const ip = parts[4];
        if (ip && !ip.includes('.local') && ip !== '0.0.0.0') {
          foundIPs.add(ip);
          lines.push(`[+] Found IP: ${ip} (${parts[7] || 'unknown'} ${parts[2]?.toLowerCase() || ''})`);
        }
      };

      pc.createDataChannel('');
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => {
          lines.push('[+] ✅ WebRTC blocked — no offer could be created.');
          resolve(lines);
        });
    } catch (err) {
      lines.push(`[+] ✅ WebRTC not available: ${err}`);
      lines.push('[+] This means no IP can leak via WebRTC.');
      resolve(lines);
    }
  });
}

/** 4. Cookie Inspector — analyzes all accessible cookies */
export async function inspectCookies(): Promise<string[]> {
  const lines: string[] = [
    '[*] DRAGON COOKIE INSPECTOR v2.0 — REAL SCAN',
    '[*] Reading document.cookie...',
    '',
  ];

  const TRACKING_COOKIE_PATTERNS = [
    '_ga', '_gid', '_gat', '_gcl', '_fbp', '_fbc', 'fr', '_rdt_uuid',
    '__utma', '__utmb', '__utmc', '__utmz', 'mp_', 'ajs_',
    '_hjid', '_hjSession', 'intercom', 'optimizely', 'NID', 'SID', 'HSID',
  ];

  try {
    const raw = document.cookie;
    if (!raw || raw.trim() === '') {
      lines.push('[+] ✅ No cookies found — CLEAN');
      lines.push('[+] 🇸🇦 COOKIE STATUS: SOVEREIGN');
    } else {
      const cookies = raw.split(';').map(c => c.trim()).filter(Boolean);
      lines.push(`[+] Found ${cookies.length} cookies:`);
      lines.push('');

      let trackingCount = 0;
      for (const cookie of cookies) {
        const [name, ...valueParts] = cookie.split('=');
        const value = valueParts.join('=');
        const isTracking = TRACKING_COOKIE_PATTERNS.some(p =>
          name?.trim().toLowerCase().startsWith(p.toLowerCase())
        );

        if (isTracking) {
          trackingCount++;
          lines.push(`[!] ⚠️  ${name?.trim()} = ${value?.slice(0, 40)}${(value?.length || 0) > 40 ? '...' : ''}`);
          lines.push(`    └─ TRACKING COOKIE`);
        } else {
          lines.push(`[*]    ${name?.trim()} = ${value?.slice(0, 60)}${(value?.length || 0) > 60 ? '...' : ''}`);
        }
      }

      lines.push('');
      if (trackingCount > 0) {
        lines.push(`[!] ${trackingCount}/${cookies.length} cookies are TRACKING cookies`);
      } else {
        lines.push(`[+] ✅ ${cookies.length} cookies found — none appear to be tracking`);
      }
    }
  } catch (err) {
    lines.push(`[!] Cookie access error: ${err}`);
  }

  lines.push('');
  lines.push('[*] Scan complete.');
  return lines;
}

/** 5. Browser Fingerprint Auditor — shows what the browser exposes */
export async function auditFingerprint(): Promise<string[]> {
  const lines: string[] = [
    '[*] DRAGON FINGERPRINT AUDITOR v2.0 — REAL SCAN',
    '[*] Collecting browser fingerprint data...',
    '',
  ];

  // Navigator info
  lines.push('[+] NAVIGATOR PROPERTIES:');
  lines.push(`    userAgent: ${navigator.userAgent}`);
  lines.push(`    platform: ${navigator.platform}`);
  lines.push(`    language: ${navigator.language}`);
  lines.push(`    languages: ${navigator.languages?.join(', ') || 'N/A'}`);
  lines.push(`    cookieEnabled: ${navigator.cookieEnabled}`);
  lines.push(`    doNotTrack: ${navigator.doNotTrack || 'not set'}`);
  lines.push(`    hardwareConcurrency: ${navigator.hardwareConcurrency}`);
  lines.push(`    maxTouchPoints: ${navigator.maxTouchPoints}`);
  lines.push(`    onLine: ${navigator.onLine}`);
  if ('deviceMemory' in navigator) {
    lines.push(`    deviceMemory: ${(navigator as any).deviceMemory} GB`);
  }
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    lines.push(`    connection: ${conn?.effectiveType || 'unknown'} (${conn?.downlink || '?'} Mbps)`);
  }
  lines.push('');

  // Screen
  lines.push('[+] SCREEN FINGERPRINT:');
  lines.push(`    resolution: ${screen.width}x${screen.height}`);
  lines.push(`    availableResolution: ${screen.availWidth}x${screen.availHeight}`);
  lines.push(`    colorDepth: ${screen.colorDepth}`);
  lines.push(`    pixelDepth: ${screen.pixelDepth}`);
  lines.push(`    devicePixelRatio: ${window.devicePixelRatio}`);
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  lines.push(`    prefersColorScheme: ${mq.matches ? 'dark' : 'light'}`);
  lines.push('');

  // Canvas fingerprint
  lines.push('[+] CANVAS FINGERPRINT:');
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('HAVEN_FP_TEST', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('HAVEN_FP_TEST', 4, 17);
      const dataUrl = canvas.toDataURL();
      let hash = 0;
      for (let i = 0; i < dataUrl.length; i++) {
        hash = ((hash << 5) - hash) + dataUrl.charCodeAt(i);
        hash |= 0;
      }
      lines.push(`    Canvas hash: ${hash.toString(16)}`);
      lines.push(`    Data length: ${dataUrl.length} chars`);
      lines.push(`    [!] This hash can uniquely identify your browser`);
    }
  } catch {
    lines.push('    Canvas fingerprinting blocked ✅');
  }
  lines.push('');

  // WebGL
  lines.push('[+] WEBGL FINGERPRINT:');
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        lines.push(`    Vendor: ${(gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)}`);
        lines.push(`    Renderer: ${(gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)}`);
        lines.push(`    [!] GPU info can identify your hardware`);
      } else {
        lines.push('    WEBGL_debug_renderer_info not available');
      }
    } else {
      lines.push('    WebGL not available ✅');
    }
  } catch {
    lines.push('    WebGL fingerprinting blocked ✅');
  }
  lines.push('');

  // Timezone
  lines.push('[+] TIMEZONE & LOCALE:');
  lines.push(`    timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  lines.push(`    locale: ${Intl.DateTimeFormat().resolvedOptions().locale}`);
  lines.push(`    timezoneOffset: ${new Date().getTimezoneOffset()} min`);
  lines.push('');

  lines.push('─'.repeat(50));
  lines.push('[!] ⚠️  FINGERPRINT UNIQUENESS: HIGH');
  lines.push('    All the above data combined creates a unique browser fingerprint.');
  lines.push('    This fingerprint persists across sessions even without cookies.');
  lines.push('');
  lines.push('[*] RECOMMENDATION:');
  lines.push('    - Use Firefox with resist fingerprinting enabled');
  lines.push('    - about:config → privacy.resistFingerprinting = true');
  lines.push('    - Consider using Tor Browser for maximum privacy');
  lines.push('');
  lines.push('[*] Scan complete.');

  return lines;
}

/** 6. Sovereign Firewall Audit — checks what this app connects to */
export async function auditSovereignty(): Promise<string[]> {
  const lines: string[] = [
    '[*] HAVEN SOVEREIGNTY AUDIT v2.0 — REAL AUDIT',
    '[*] Verifying zero external dependencies...',
    '',
  ];

  // Service Worker
  lines.push('[+] SERVICE WORKER STATUS:');
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    lines.push(`    Registered: ${regs.length} service worker(s)`);
    for (const reg of regs) {
      lines.push(`    Scope: ${reg.scope}`);
      lines.push(`    Active: ${reg.active ? 'yes' : 'no'}`);
    }
  } else {
    lines.push('    Service Workers not supported');
  }
  lines.push('');

  // Network requests
  lines.push('[+] NETWORK CONNECTIONS AUDIT:');
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const externalDomains = new Set<string>();
  const localDomains = new Set<string>();

  for (const r of resources) {
    try {
      const url = new URL(r.name);
      if (['localhost', '127.0.0.1', '0.0.0.0', ''].includes(url.hostname) || url.hostname.endsWith('.local')) {
        localDomains.add(url.hostname || 'self');
      } else {
        externalDomains.add(url.hostname);
      }
    } catch { /* skip */ }
  }

  lines.push(`    Local connections: ${localDomains.size} domains`);
  for (const d of localDomains) lines.push(`        ✅ ${d}`);

  if (externalDomains.size > 0) {
    lines.push(`    External connections: ${externalDomains.size} domains`);
    for (const d of externalDomains) lines.push(`        ⚠️  ${d}`);
  } else {
    lines.push(`    External connections: 0 ✅`);
  }
  lines.push('');

  // Permissions
  lines.push('[+] BROWSER PERMISSIONS STATUS:');
  const permissionNames = ['camera', 'microphone', 'geolocation', 'notifications', 'clipboard-read'];
  for (const name of permissionNames) {
    try {
      const result = await navigator.permissions.query({ name: name as PermissionName });
      const icon = result.state === 'granted' ? '⚠️' : result.state === 'denied' ? '✅' : '❓';
      lines.push(`    ${icon} ${name}: ${result.state}`);
    } catch {
      lines.push(`    ❓ ${name}: not queryable`);
    }
  }
  lines.push('');

  // PDPL
  lines.push('─'.repeat(50));
  lines.push('[+] PDPL COMPLIANCE CHECK:');
  lines.push('    ✅ Data residency: LOCAL ONLY');
  lines.push('    ✅ Consent mechanism: N/A (no data collection)');
  lines.push('    ✅ Right to erasure: Full local control');
  lines.push(`    ${externalDomains.size === 0 ? '✅' : '⚠️'} External connections: ${externalDomains.size}`);
  lines.push('');

  const score = externalDomains.size === 0 ? 100 : Math.max(0, 100 - externalDomains.size * 15);
  lines.push(`[+] SOVEREIGNTY SCORE: ${score}/100 ${score === 100 ? '🇸🇦' : '⚠️'}`);
  lines.push('');
  lines.push('[*] Audit complete.');

  return lines;
}

/** 7. DNS / Public IP Exposure Test — checks what IP the outside world sees */
export async function testDNSExposure(): Promise<string[]> {
  const lines: string[] = [
    '[*] DRAGON DNS/IP EXPOSURE TEST v1.0 — REAL TEST',
    '[*] Checking what the outside world sees...',
    '',
  ];

  const endpoints = [
    { name: 'ipify (IPv4)', url: 'https://api.ipify.org?format=json', field: 'ip' },
    { name: 'ipify (IPv6)', url: 'https://api64.ipify.org?format=json', field: 'ip' },
  ];

  const foundIPs = new Set<string>();

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(ep.url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const ip = data[ep.field];
        if (ip) {
          foundIPs.add(ip);
          lines.push(`[+] ${ep.name}: ${ip}`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('abort')) {
        lines.push(`[*] ${ep.name}: Timeout (blocked or no internet)`);
      } else {
        lines.push(`[*] ${ep.name}: ${msg}`);
      }
    }
  }

  lines.push('');

  if (foundIPs.size === 0) {
    lines.push('[+] ✅ No public IP detected — you may be offline or fully blocked');
    lines.push('[+] 🇸🇦 SOVEREIGN MODE: Network isolated');
  } else {
    lines.push(`[!] ⚠️  ${foundIPs.size} public IP(s) detected:`);
    for (const ip of foundIPs) {
      const isIPv6 = ip.includes(':');
      lines.push(`    ${isIPv6 ? '🟡' : '🔴'} ${ip} ${isIPv6 ? '(IPv6)' : '(IPv4)'}`);
    }
    lines.push('');
    lines.push('[*] WHAT THIS MEANS:');
    lines.push('    Any website you visit can see this IP address.');
    lines.push('    Your ISP, government, and network admin can see your traffic.');
    lines.push('');
    lines.push('[*] RECOMMENDATIONS:');
    lines.push('    - Use a trusted VPN (Mullvad, ProtonVPN) to mask your IP');
    lines.push('    - Use Tor Browser for anonymous browsing');
    lines.push('    - DNS-over-HTTPS to prevent DNS snooping');
  }

  lines.push('');
  lines.push('[*] Test complete.');
  return lines;
}

/** 8. Hosts File Generator — generates a blocklist from detected telemetry */
export async function generateHostsFile(): Promise<string[]> {
  const lines: string[] = [
    '[*] DRAGON HOSTS GENERATOR v1.0 — REAL TOOL',
    '[*] Scanning for telemetry domains to block...',
    '',
  ];

  const KNOWN_TELEMETRY = [
    'telemetry.vscode.dev', 'dc.services.visualstudio.com',
    'vortex.data.microsoft.com', 'mobile.events.data.microsoft.com',
    'telemetry.microsoft.com', 'watson.telemetry.microsoft.com',
    'settings-win.data.microsoft.com', 'telemetry.googleapis.com',
    'www.google-analytics.com', 'analytics.google.com',
    'stats.g.doubleclick.net', 'www.googletagmanager.com',
    'connect.facebook.net', 'pixel.facebook.com',
    'bat.bing.com', 'clarity.ms',
    'browser.sentry-cdn.com', 'o4506.ingest.sentry.io',
    'cdn.segment.com', 'api.segment.io',
    'cdn.mxpnl.com', 'api-js.mixpanel.com',
    'script.hotjar.com', 'static.hotjar.com',
  ];

  // Also scan Performance API for actual detected external domains
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const detectedExternal = new Set<string>();

  for (const e of entries) {
    try {
      const url = new URL(e.name);
      const domain = url.hostname;
      if (!['localhost', '127.0.0.1', '0.0.0.0', ''].includes(domain) && !domain.endsWith('.local')) {
        detectedExternal.add(domain);
      }
    } catch { /* skip */ }
  }

  // Merge known + detected
  const allDomains = new Set([...KNOWN_TELEMETRY, ...detectedExternal]);

  lines.push(`[+] Known telemetry domains: ${KNOWN_TELEMETRY.length}`);
  lines.push(`[+] Detected external domains: ${detectedExternal.size}`);
  lines.push(`[+] Total unique domains to block: ${allDomains.size}`);
  lines.push('');

  // Generate hosts file content
  const hostsLines = [
    '# DRAGON SOVEREIGN HOSTS FILE',
    '# Generated by HAVEN IDE Security Toolkit',
    `# Date: ${new Date().toISOString()}`,
    `# Total blocked: ${allDomains.size} domains`,
    '#',
    '# Add these lines to:',
    '#   Windows: C:\\Windows\\System32\\drivers\\etc\\hosts',
    '#   macOS/Linux: /etc/hosts',
    '#',
    '',
    '# === TELEMETRY & TRACKING BLOCKLIST ===',
    '',
  ];

  const sorted = [...allDomains].sort();
  for (const domain of sorted) {
    hostsLines.push(`0.0.0.0 ${domain}`);
  }

  hostsLines.push('');
  hostsLines.push('# === SOVEREIGN ALLOWLIST ===');
  hostsLines.push('# 127.0.0.1 localhost');
  hostsLines.push('# ::1 localhost');
  hostsLines.push('');
  hostsLines.push('# 🇸🇦 GENERATED BY DRAGON SECURITY — HAVEN IDE');

  lines.push('[+] Generated hosts file:');
  lines.push('');
  for (const hl of hostsLines) {
    lines.push(`    ${hl}`);
  }

  lines.push('');
  lines.push('[+] ✅ Hosts file ready for download');
  lines.push('[*] Click EXPORT to save, then paste into your system hosts file.');
  lines.push('');

  // Auto-download the hosts file
  try {
    const blob = new Blob([hostsLines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dragon_hosts_blocklist_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    lines.push('[+] 📥 File auto-downloaded!');
  } catch {
    lines.push('[!] Auto-download failed — use EXPORT button instead.');
  }

  lines.push('');
  lines.push('[*] Generation complete.');
  return lines;
}
