# HAVEN-Sovereign v5.0 Release

**Sovereign Algorithm Returns Home — الخوارزمية دائماً تعود للوطن**

## 🇸🇦 What's Included

### Download
- **HAVEN-Sovereign.exe** — Standalone desktop IDE (Tauri + React)
- **HAVEN-Sovereign-Setup.exe** — Windows installer
- **HAVEN-Sovereign.msi** — MSI package for enterprise deployment

### Key Features

✅ **Offline-First Architecture**
- Zero cloud dependency for AI inference
- All models run locally via Ollama (127.0.0.1:11434)
- Three-Lobe cognitive engine (Cognitive/Executive/Sensory)

✅ **Sovereign Bridge (Rust)**
- `ollama_proxy` command tunnels all AI requests through native Tauri layer
- Bypasses WebView CORS/CSP restrictions
- Phalanx security protocol monitors telemetry exfiltration attempts

✅ **NIYAH Engine v4 (Intent Analysis)**
- Arabic root lexicon tokenization (س-و-د, خ-و-ز-ر-م)
- Cold, technical, forensic-grade responses
- Temperature: 0.1 (deterministic, no hallucinations)

✅ **K-Forge P2P Git Manager**
- Decentralized repository sync via GunDB gossip
- WebRTC DataChannels for sovereign peer-to-peer transport
- SovereignMeshManager coordinates signaling

✅ **ForensicLab Built-In**
- Real-time telemetry scanner
- Audits browser for tracking vectors (Google Analytics, Facebook Pixel, etc.)
- Generates restricted classification reports (Dragon 403 Protocol)

### Installation

**Windows (Direct)**
```bash
# Download HAVEN-Sovereign.exe
.\HAVEN-Sovereign.exe
```

**Requirements**
- Windows 10/11 (x64 or ARM64)
- Ollama running: `ollama serve` (port 11434)
- Models pre-downloaded:
  ```bash
  ollama pull deepseek-r1:8b
  ollama pull niyah:latest
  ollama pull niyah:writer
  ```

### First Run

1. Launch HAVEN-Sovereign.exe
2. Wait for Tauri bridge to initialize (~2s)
3. Type `/status` in HAVEN AI panel to verify Ollama connection
4. Try `/niyah` to test intent recognition engine

### Compliance

- ✅ **PDPL Compliant** (Saudi Personal Data Protection Law)
- ✅ **NCA-ECC Aligned** (National Cybersecurity Authority)
- ✅ **Zero Telemetry** — No external data exfiltration
- ✅ **Full Audit Trail** — All code open-source

### Known Limitations

- WebRTC mesh requires local network (no NAT traversal in this release)
- K-Forge sync is beta; use for development repos only
- Ollama models must be pulled manually (no auto-installer yet)

### What Changed from v4

| Feature | v4 | v5 |
|---------|:---:|:---:|
| Desktop App | Vite Web | Tauri EXE |
| Ollama Bridge | HTTP Proxy | Rust `ollama_proxy` |
| NIYAH Model | v2 | v3/v4 (cold, forensic) |
| K-Forge | Planned | Beta (GunDB + WebRTC) |
| Phalanx Shield | Simulated | Active (monkey-patch Fetch/Beacon) |

### Security Audit Findings

**Poison Pill Status**: ✅ Active
- Monitors `fetch()`, `navigator.sendBeacon()`, `Performance API`
- Blocks suspicious URLs to: google-analytics, facebook, sentry, hotjar, segment, mixpanel
- Triggers purge if exfiltration detected

**Telemetry Vectors Neutralized**:
- ✅ PerformanceObserver hijacking
- ✅ DNS prefetch leakage
- ✅ sendBeacon persistence attacks
- ✅ FLoC/InteresetCohort tracking

### Next Release (v5.1)

- [ ] Auto-download Ollama models from UI
- [ ] K-Forge GitHub sync (via PAT)
- [ ] VS Code extension
- [ ] Mobile app (React Native)
- [ ] Enterprise deployment docs

### Support

**Report Issues**: [GitHub Issues](https://github.com/Grar00t/haven-sovereign/issues)
**Chat**: Join the sovereign mesh
**Author**: Sulaiman Alshammari (@Dragon403)
**Company**: KHAWRIZM (khawrizm.com)

---

**Built in the Kingdom of Saudi Arabia 🇸🇦⚡**

*"We do not fork their tools. We replace them."*
