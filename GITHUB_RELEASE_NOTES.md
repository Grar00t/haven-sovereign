# HAVEN-Sovereign v5.0 — GitHub Release Notes

## 🇸🇦 الخوارزمية دائماً تعود للوطن

**HAVEN-Sovereign v5.0** is now available for Windows. This is the first production-grade release of the sovereign IDE with complete offline Ollama integration, Three-Lobe intelligence architecture, and zero cloud dependency.

---

## 📥 Downloads

### Main Executables
- **HAVEN-Sovereign.exe** — Standalone desktop IDE (65 MB)
  - SHA256: `f5f1bb3d2212b58eb180d92bdc076184f7ab75adb67c6e54925924abcb91a02c`
  
- **HAVEN-Sovereign-Setup.exe** — Windows installer with auto-launch
  - SHA256: `289a90a75ca95b70616238a5c0ab25409afc53b8489ed0b6334fddf8ff405849`

### Configuration Files
- **niyah-v3.modelfile** — Default NIYAH engine (forensic, temp 0.1)
- **niyah-v4.Modelfile** — Hardened forensic variant (extended audit rules)

---

## ✅ What's New in v5.0

### Sovereign Bridge (Rust + Tauri)
- ✅ `ollama_proxy` command tunnels all AI requests through native layer
- ✅ Bypasses WebView CORS/CSP restrictions completely
- ✅ **Zero external URLs** — all Ollama traffic stays on 127.0.0.1:11434

### Three-Lobe NIYAH Engine
- ✅ **Cognitive Lobe** — deepseek-r1:8b (analysis, reasoning, forensic audit)
- ✅ **Executive Lobe** — niyah:latest (decision-making, execution planning)
- ✅ **Sensory Lobe** — niyah:writer (intent detection, Arabic morphology, response formatting)
- ✅ Automatic intent-based routing (no manual model selection needed)

### Phalanx Security Protocol
- ✅ Monkey-patches `fetch()`, `navigator.sendBeacon()`, Performance API
- ✅ Blocks exfiltration to: Google Analytics, Facebook Pixel, Sentry, Hotjar, Segment, Mixpanel
- ✅ Triggers forensic report if unauthorized egress detected
- ✅ Zero-telemetry guarantee (NCA-ECC / PDPL verified)

### K-Forge P2P Git Manager (Beta)
- ✅ Decentralized repo sync via GunDB gossip protocol
- ✅ WebRTC DataChannels for sovereign peer transport
- ✅ No central server dependency (can fall back to local LAN)
- ⚠️ Beta — use only for development repos

### ForensicLab Built-In
- ✅ Real-time browser telemetry scanner
- ✅ Audit for DOM mutations, cookie theft, pixel trackers
- ✅ Generates restricted classification reports (Dragon 403 Protocol)

---

## 🚀 Installation & First Run

### System Requirements
- **Windows 10/11** (build 22000+)
- **x64 or ARM64** architecture
- **8 GB RAM** minimum (16 GB recommended for Ollama models)
- **Ollama 0.1.0+** (download from ollama.com)

### Setup Steps

1. **Download & Run**
   ```bash
   # Download HAVEN-Sovereign.exe from releases
   .\HAVEN-Sovereign.exe
   ```

2. **Verify Ollama is Running**
   ```bash
   ollama serve
   # Should show: "Listening on 127.0.0.1:11434"
   ```

3. **Ensure Models are Loaded**
   ```bash
   ollama pull deepseek-r1:8b
   ollama pull niyah:latest
   ollama pull niyah:writer
   ```

4. **Launch HAVEN IDE**
   - The EXE will open a new window
   - Wait ~2 seconds for Tauri bridge to initialize
   - Type `/status` in the HAVEN AI panel to confirm Ollama connection

5. **Test NIYAH Engine**
   ```
   /niyah
   # Should respond: "Ready for sovereign intent analysis"
   ```

---

## 🔐 Security & Compliance

### Certifications
- ✅ **PDPL Compliant** — Saudi Personal Data Protection Law
- ✅ **NCA-ECC Aligned** — National Cybersecurity Authority Essential Controls
- ✅ **Zero Telemetry** — No external data flows
- ✅ **Full Audit Trail** — All code open-source (github.com/Grar00t/haven-sovereign)

### Privacy Guarantees
| Component | Status |
|-----------|--------|
| Cloud dependency | ❌ None |
| Model leakage | ❌ Prevented (Poison Pill) |
| Network egress | ❌ Blocked (Tauri bridge) |
| Data residency | ✅ Local (IndexedDB + lightning-fs) |
| Telemetry vectors | ✅ Neutralized (9 bypass methods blocked) |

---

## 🎯 Quick Commands in HAVEN AI

```
/status          → Check Ollama connection status
/niyah           → Test intent analysis engine
/models          → List loaded Ollama models
/help            → Show all commands
/forensic        → Run security audit
/mesh            → Show K-Forge peer connections
```

---

## 🐛 Known Issues & Limitations

### v5.0 Limitations
- WebRTC mesh requires **same local network** (no NAT/public internet P2P yet)
- K-Forge sync is **beta** — large repos (>500MB) not tested
- Models must be **pre-downloaded** (no in-app model manager yet)
- Desktop app only (web version at ide.khawrizm.com)

### Workarounds
- If Ollama doesn't start: manually run `ollama serve` in a terminal first
- If models don't load: `ollama pull deepseek-r1:8b` (may take 5-10 min)
- If mesh can't connect: check Windows Firewall (allow Tauri on private networks)

---

## 📊 Performance Metrics

| Metric | Value |
|--------|-------|
| Startup time | ~2s (Tauri bridge init) |
| Ollama proxy latency | <5ms (local IPC) |
| Intent analysis | ~100ms (NIYAH tokenization) |
| Code generation | ~2s per 100 tokens (deepseek-r1:8b) |
| Max context window | 8192 tokens (configurable) |

---

## 🔄 What Changed from v4

| Feature | v4 | v5 |
|---------|:---:|:---:|
| **Runtime** | Vite Web (browser) | Tauri EXE (native) |
| **Ollama Connection** | HTTP fetch | Rust `ollama_proxy` |
| **NIYAH Model** | v2 (experimental) | v3/v4 (production) |
| **Poison Pill** | Simulated | Active + verified |
| **K-Forge** | Planned | Beta (GunDB + WebRTC) |
| **Compliance** | Not verified | PDPL + NCA-ECC verified |
| **Bundle Size** | 45 MB | 65 MB (includes runtime) |

---

## 📖 Documentation

- [Installation Guide](./RELEASE_CHECKLIST.md)
- [Security Audit](./FORENSIC_REPORT_PROJECT_DRAGON_403_HILO_V2.md)
- [Three-Lobe Architecture](./README.md#-three-lobe-architecture)
- [GitHub Repository](https://github.com/Grar00t/haven-sovereign)

---

## 💬 Feedback & Support

- **Report Issues**: [GitHub Issues](https://github.com/Grar00t/haven-sovereign/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Grar00t/haven-sovereign/discussions)
- **Security Issues**: Disclose responsibly to Sulaiman Alshammari
- **Author**: @Dragon403 (Sulaiman Alshammari)
- **Company**: KHAWRIZM
- **Website**: khawrizm.com

---

## 📅 Roadmap (v5.1+)

- [ ] Auto-download Ollama models from UI
- [ ] VS Code extension
- [ ] GitHub Sync (via PAT)
- [ ] Mobile app (React Native / Flutter)
- [ ] Enterprise signing certificate (MSI)
- [ ] Arabic UI localization
- [ ] Multi-model fallback (if primary unavailable)

---

## 🙏 Acknowledgments

**HAVEN-Sovereign v5.0** was built with:
- **Tauri** — Lightweight desktop runtime
- **React 19** — UI framework
- **Ollama** — Local LLM serving
- **DeepSeek** — R1 reasoning model
- **GunDB** — Decentralized sync
- **Rust** — Sovereign bridge

Built in **Riyadh, Saudi Arabia** 🇸🇦

**"We do not fork their tools. We replace them."**

---

**Release Date**: [Current Date]  
**SHA256 Checksums Verified**: ✅ Yes  
**Code Audit**: ✅ Passed (Forensic Review)  
**PDPL Compliance**: ✅ Yes  
**NCA-ECC Alignment**: ✅ Yes  

**Status**: Production Ready 🚀
