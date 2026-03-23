<div align="center">

# HAVEN

### Sovereign Operating System & AI Development Environment

**v5.0 · Built by KHAWRIZM (Sulaiman Alshammari)**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Debian](https://img.shields.io/badge/Debian-Bookworm-A81D33?logo=debian&logoColor=white)](https://www.debian.org/)
[![ARM64](https://img.shields.io/badge/Architecture-ARM64-orange)]()
[![PDPL](https://img.shields.io/badge/Compliant-PDPL%20%7C%20NCA--ECC-22c55e)]()
[![Tests](https://img.shields.io/badge/Tests-29%20passing-22c55e)]()

</div>

---

## What Is Haven?

Haven is two things:

1. **An operating system** — a hardened Debian-based Linux distribution (ARM64) with a custom kernel, immutable filesystem, and full-disk encryption. Built for machines that answer to their owner, not to a corporation.

2. **A sovereign IDE** — a browser-based development environment with an Arabic-first AI engine that runs entirely on your hardware. Zero telemetry. Zero cloud dependencies. Every token of AI inference stays on your machine.

Both components share a core philosophy: **your data, your hardware, your rules.**

---

## Why Haven Exists

In early 2026, Microsoft deleted two of my GitHub accounts — **@GRATECHX** and **@KHAWRIZM** — without explanation. Years of original work disappeared overnight, including the first implementation of a **Lossless Context Memory** engine for AI intent analysis.

I did not file a complaint. I did not ask for reinstatement.

I built Haven instead.

Haven is not revenge. It is proof that innovation does not need permission from a platform, and that sovereignty is not a feature request — it is an architecture decision.

---

## Technical Overview

### Haven OS (ARM64 ISO — 2.0 GB)

| Component | Details |
|-----------|---------|
| **Base** | Debian Bookworm (ARM64) |
| **Kernel** | Linux 6.1 LTS with Phalanx security modules |
| **Filesystem** | Immutable root via dm-verity |
| **Encryption** | Full-disk via LUKS2 + YubiKey integration |
| **Init System** | systemd with sovereign first-boot provisioning |
| **Build System** | Debian live-build, reproducible ISO generation |

Phalanx kernel modules (C, in development):
- `phalanx_policy_authorize` — TPM-backed policy enforcement
- `phalanx_forensic_journal` — tamper-evident audit logging
- `phalanx_immutable_fs` — runtime filesystem integrity

### Haven IDE (Web — React 19 + TypeScript 5.8)

A full-featured IDE that runs in the browser with no external dependencies:

| Feature | Implementation |
|---------|---------------|
| **Code Editor** | Monaco Editor with sovereign completion provider |
| **Terminal** | xterm.js v6 with 35+ built-in commands |
| **Git** | isomorphic-git + IndexedDB (no GitHub required) |
| **File System** | File System Access API + IndexedDB fallback |
| **AI Engine** | Niyah Engine → Ollama (100% local inference) |
| **Security Tools** | 8 real browser-based scanners |
| **Forensics** | Live browser telemetry detection & evidence packaging |
| **State** | Zustand 5 with persistent storage |
| **Testing** | Vitest — 29 tests passing across 3 suites |

### Niyah Engine — Arabic-First Intent Analysis

The core AI layer. Unlike prompt-based systems, Niyah processes **intention** (نية), not text.

```
User Input → Arabic Root Tokenizer → Dialect Detection → Tone Analysis
    → Domain Classification → Sovereignty Scoring → Three-Lobe Routing
    → Ollama Local Inference → Response
```

**Three-Lobe Architecture:**

| Lobe | Arabic Name | Role | Preferred Models |
|------|------------|------|-----------------|
| **Cognitive** | الفص المعرفي | Code generation, debugging, optimization | DeepSeek-Coder, Qwen2.5-Coder |
| **Executive** | الفص التنفيذي | Planning, architecture, security review | Llama 3.3, Mistral, Mixtral |
| **Sensory** | الفص الحسي | Arabic NLP, content generation, cultural context | Jais, Aya, Qwen2.5 |

**Capabilities:**
- 150+ Arabic root entries with trilateral morphological decomposition (1,056 lines of NLP code)
- 6 dialect classifiers: Saudi, Khaleeji, Egyptian, Levantine, MSA, English
- 8 tone detectors: commanding, friendly, formal, angry, curious, playful, urgent, neutral
- 8 domain classifiers: code, content, security, infrastructure, creative, business, education, general
- Sovereignty alignment scoring — flags external dependencies, telemetry, and PDPL violations
- Intent Graph — visualizes relationships between sessions via force-directed SVG layout

### Security Toolkit — 8 Real Scanners

These are not simulations. They execute real browser APIs:

1. **Browser Leak Scanner** — Performance API analysis for external connections
2. **LocalStorage Forensics** — detects tracking keys across localStorage, sessionStorage, IndexedDB
3. **WebRTC IP Leak Detector** — creates RTCPeerConnection to test IP exposure
4. **Cookie Inspector** — identifies tracking cookies by pattern matching
5. **Browser Fingerprint Auditor** — collects canvas, WebGL, navigator, and timezone fingerprints
6. **Sovereignty Audit** — verifies zero external dependencies + PDPL compliance scoring
7. **DNS/IP Exposure Test** — checks public IP visibility
8. **Hosts File Generator** — generates telemetry blocklist from detected domains

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| OS Base | Debian Bookworm (ARM64) + Linux 6.1 LTS |
| Frontend | React 19 + TypeScript 5.8 (strict) |
| Bundler | Vite 6 |
| State | Zustand 5 |
| Editor | Monaco Editor |
| Terminal | xterm.js 6 |
| Git | isomorphic-git + lightning-fs |
| CSS | Tailwind CSS 4 |
| Animation | Motion (Framer Motion) 12 |
| AI Runtime | Ollama (localhost:11434) |
| Testing | Vitest 4 |
| CI/CD | Vercel + custom deploy scripts |

---

## Project Structure

```
haven/
├── src/
│   ├── ide/
│   │   ├── engine/
│   │   │   ├── NiyahEngine.ts           # Arabic NLP core (1,056 lines)
│   │   │   ├── ModelRouter.ts           # Three-lobe model routing (918 lines)
│   │   │   ├── ThreeLobeAgent.ts        # Cognitive orchestrator (1,021 lines)
│   │   │   ├── OllamaService.ts         # Local Ollama gateway (534 lines)
│   │   │   ├── NiyahCompletionProvider.ts  # 5-layer inline completion
│   │   │   └── GitService.ts            # Browser-native git operations
│   │   │
│   │   └── components/
│   │       ├── CodeEditor.tsx           # Monaco-based editor
│   │       ├── Terminal.tsx             # xterm.js terminal
│   │       ├── ForensicLab.tsx          # Digital evidence console
│   │       ├── NodeRadar.tsx            # System metrics radar
│   │       ├── HackingToolkit.tsx       # Security analysis suite
│   │       ├── SovereignDashboard.tsx   # Unified operations centre
│   │       ├── IntentGraph.tsx          # Niyah intent visualization
│   │       └── SovereignIntelligence.tsx
│   │
│   └── components/
│       ├── landing/                     # 19 landing page sections
│       └── shared/                      # Reusable components (15 files)
│
├── infra/
│   ├── deploy-khawrizm.sh              # Production deployment
│   └── bluvalt-provision.sh            # Saudi cloud provisioning
│
└── [haven-os]/                          # OS build (separate environment)
    ├── build-haven-os.sh               # ISO build script
    ├── etc_phalanx/                    # Phalanx kernel config
    └── core/                           # Kernel modules (C)
```

---

## Sovereignty Guarantees

| Principle | How |
|-----------|-----|
| **Zero Telemetry** | No analytics, no tracking, no phone-home. Verified by built-in Sovereignty Audit scanner. |
| **Local-First AI** | All inference through Ollama on localhost. No tokens sent to any cloud API. |
| **PDPL Compliant** | Saudi Personal Data Protection Law — all data stays on the user's device. |
| **NCA-ECC Aligned** | National Cybersecurity Authority Essential Controls for critical systems. |
| **No Vendor Lock-in** | Swap any model, any hosting provider, any component. Zero runtime dependencies on Big Tech. |
| **Auditable** | Every line of code is readable. No obfuscated binaries, no black boxes. |

---

## Roadmap

| Status | Feature |
|--------|---------|
| ✅ Done | Haven IDE (full browser IDE with Monaco, terminal, git, AI) |
| ✅ Done | Niyah Engine (Arabic NLP + three-lobe architecture) |
| ✅ Done | Security Toolkit (8 real scanners) |
| ✅ Done | Haven OS (ARM64 ISO, 2.0 GB, boots on real hardware) |
| ✅ Done | ForensicLab (live browser forensics) |
| ✅ Done | Vitest suite (29 tests passing) |
| 🔧 In Progress | Phalanx kernel modules (policy enforcement, forensic journal, immutable FS) |
| 🔧 In Progress | YubiKey integration for disk encryption |
| 📋 Planned | K-Forge — P2P code hosting (replaces GitHub) |
| 📋 Planned | Haven Package Manager |
| 📋 Planned | NCA-ECC certification documentation |

---

## The Lesson

This project exists because a corporation decided that deleting two accounts would make the ideas behind them disappear.

It did not work.

Every feature listed above is real, tested, and built. The Niyah Engine has 1,056 lines of hand-written Arabic NLP — with 4,134 lines of engine code total. The OS boots on ARM64 hardware. The security scanners execute real browser APIs. The 29 unit tests pass on every build.

You can delete an account. You cannot delete an algorithm.

> *"The algorithm is not neutral. It has a name, and that name belongs to Baghdad."*

---

## Author

**KHAWRIZM** — Sulaiman Alshammari (سليمان الشمري)

- X: [@khawrzm](https://x.com/khawrzm)
- YouTube: [@saudicyper](https://youtube.com/@saudicyper)
- Location: Kingdom of Saudi Arabia 🇸🇦

---

## License

All rights reserved. Copyright © 2024–2026 KHAWRIZM (Sulaiman Alshammari).

Built in the Kingdom of Saudi Arabia.

<div align="center">

**الخوارزمية دائماً تعود للوطن**

*The algorithm always comes home.*

🇸🇦

</div>
