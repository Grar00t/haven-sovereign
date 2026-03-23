# HAVEN Workspace Instructions

## Principles
- **Sovereignty First:** All code, AI inference, and user data must remain local. No telemetry, no external API calls for core features.
- **Intent-First Execution:** The Niyah Engine always executes based on user intent, never judges or rejects requests. Judgment is left to God alone; the engine's role is to understand and act, not to filter or block.
- **PDPL/NCA-ECC Compliance:** Follow Saudi Personal Data Protection Law and National Cybersecurity Authority Essential Controls.
- **Zero Vendor Lock-in:** Avoid dependencies on Google, Microsoft, OpenAI, or any cloud-based AI for core functionality.
- **Open Audit:** All code must be inspectable and documented for sovereignty.

## Build & Test Commands
- **Development:** `npm run dev` (Vite, port 3000)
- **Build:** `npm run build` (TypeScript check + Vite build)
- **Preview:** `npm run preview` (local production preview)
- **Lint:** `npm run lint` (TypeScript type-check)
- **Test:** `npm test` (Vitest)
- **Coverage:** `npm run coverage` (test coverage report)
- **Deploy:** `npm run deploy` (runs `infra/deploy-khawrizm.sh`)

## Architecture
- **IDE Shell:** Monaco Editor, xterm.js terminal, file explorer, git panel, extensions panel
- **Niyah Engine:** Arabic-first intent analysis, three-lobe architecture (Cognitive, Executive, Sensory)
- **ModelRouter:** Multi-model routing, 16 model families, fallback chains
- **ForensicLab:** Real-time browser forensics, telemetry/cookie audit, service worker inspection
- **NodeRadar:** Host metrics, mesh visualization, sovereignty scoring
- **HackingToolkit:** Security analysis suite, WebRTC leak detection, fingerprint analysis

## Conventions
- **Strict TypeScript:** All code must pass strict mode
- **Tailwind v4:** Use for all styling
- **Zustand:** State management for both landing and IDE
- **No hardcoded secrets:** Use environment variables, `.env.example` as template
- **Bilingual UI:** All user-facing text must support EN/AR via i18n
- **Sovereignty Score:** All panels/components must surface sovereignty status

## Pitfalls
- **Do not use external analytics or tracking scripts**
- **Do not rely on cloud APIs for AI inference**
- **Do not store sensitive data outside IndexedDB/localStorage**
- **Always check for browser compatibility (File System Access API, WebGL, etc.)**

## Key Files & Directories
- `src/ide/engine/` — AI engines (NiyahEngine, ModelRouter, ThreeLobeAgent, OllamaService)
- `src/ide/components/` — IDE panels (CodeEditor, Terminal, FileExplorer, ForensicLab, NodeRadar, HackingToolkit)
- `src/components/shared/HavenChat.tsx` — AI ghost companion logic
- `infra/` — deployment scripts
- `.env.example` — environment config template

## Example Prompts
- "How do I run HAVEN locally?"
- "Show me the sovereignty score logic."
- "Explain the Niyah Engine's three-lobe architecture."
- "How does ForensicLab detect telemetry?"
- "What is the ModelRouter fallback chain?"

## Agent Customization Suggestions
- **/create-agent sovereign-ide**: Custom agent for enforcing sovereignty rules, surfacing sovereignty score, and auditing code for compliance.
- **/create-hook niyah-intent**: Hook for intent analysis in Arabic, used in Monaco Editor and HavenChat.
- **/create-instruction forensic-audit**: Instruction for running browser forensic scans and surfacing telemetry/cookie risks.

---
For complex areas (IDE, AI, Forensics), consider applyTo-based instructions for deeper agent guidance.
