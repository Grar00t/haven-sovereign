# Unified Architecture

This document turns HAVEN from a set of overlapping experiments into one canonical engineering direction.

## Product Thesis

HAVEN is a local-first developer environment built to serve humans before markets.

It is not a cloud-first chat wrapper. It is a sovereign workbench:

- local by default
- multilingual by design
- inspectable in code
- useful on modest hardware
- honest about tradeoffs

The winning edge is not "more AI magic." The winning edge is trustworthy local intelligence with real developer utility: code work, memory, routing, ops, and forensics.

## Canonical Source Of Truth

Official source of truth:

- `C:\Users\Iqd20\OneDrive\OFFICIAL`

Reference only:

- `C:\Users\Iqd20\Downloads\haven-electron`

Do not treat extracted, portable, unpacked, or `.exe` artifacts as development sources.

## Current Repo Mapping

The current repository already contains the main layers we need:

- Frontend shell: `src/`
- IDE and orchestration logic: `src/ide/engine/`
- Desktop native bridge: `src-tauri/src/lib.rs`
- Portable Rust core candidates: `niyah-core/`

Important live modules:

- `src/ide/engine/NiyahEngine.ts`
- `src/ide/engine/ModelRouter.ts`
- `src/ide/engine/ThreeLobeAgent.ts`
- `src/ide/engine/OllamaService.ts`
- `src/ide/engine/SovereignTauri.ts`
- `src-tauri/src/lib.rs`
- `niyah-core/bridge.rs`
- `niyah-core/forensics.rs`

## Salvage Strategy

Downloads contains useful ideas, but not canonical code.

What to port deliberately:

- `niyah_v4.py`: command surface, provider switching, SQLite memory patterns
- `dragon403.py`: ops and forensics workflows worth translating into stable modules
- `master_Building_v5.sh`: deployment ideas only, not raw production logic

What not to port directly:

- hardcoded IPs
- environment-specific shell automation
- extracted app bundles
- duplicated packaging outputs

## Target Architecture

The long-term architecture should converge on five layers.

### 1. Shared Core

Rust core shared by desktop and future CLI:

- model routing
- privacy policy enforcement
- workspace state
- memory access
- forensics packaging
- health checks

This should grow inside `niyah-core/` until it becomes the reusable heart of the product.

### 2. Desktop Shell

Tauri remains the official desktop runtime because it is lighter and cleaner than the Electron copies.

Responsibilities:

- native window shell
- secure local IPC
- updater hooks
- local Ollama bootstrap
- file-system and process capabilities

### 3. IDE Surface

React + Monaco remains the visual workbench.

Responsibilities:

- code editing
- conversation panel
- memory viewer
- model/router status
- forensics and ops panels

### 4. CLI

Build a real `niyah` or `haven` CLI from the same shared core instead of letting scripts drift separately.

Minimum command surface:

- `niyah ask`
- `niyah model`
- `niyah memory`
- `niyah ops`
- `niyah forensics`
- `niyah doctor`

The CLI must call the same routing and storage logic as the desktop app.

### 5. Extensions

Plugins must be capability-based and local-first.

Preferred order:

1. local internal commands
2. file-based extensions
3. sandboxed Wasm plugins

Do not build a cloud marketplace.

## Product Rules

Non-negotiables:

- no telemetry by default
- no dark patterns
- no fake "fully local" claims if any feature is remote
- no premium lock on dignity, privacy, or basic access
- no Arabic-only design; Arabic matters, but the tool must serve all humans

The product must remain useful for:

- Arabic speakers
- English speakers
- low-budget users
- offline users
- high-sensitivity engineering work

## Privacy And Trust Model

Every architecture decision should support verification, not just policy language.

Required properties:

- local-first model routing
- explicit remote opt-in only
- auditable outbound behavior
- local memory ownership
- reproducible builds when possible
- signed releases when practical

Target trust features:

- audit log for model/provider usage
- visible local-vs-remote status in UI
- safe browser-mode behavior
- no hidden external calls from editor/runtime assets

## Implementation Priorities

Priority 1: Stabilize the current Tauri desktop experience.

- remove reload loops
- keep local model startup reliable
- make IDE launch deterministic
- keep browser fallback safe

Priority 2: Extract shared core logic.

- move routing and diagnostic logic toward `niyah-core`
- reduce duplication between frontend orchestration and native bridge

Priority 3: Build the real CLI.

- port the best ideas from `niyah_v4.py`
- keep command grammar stable
- make it scriptable and human-readable

Priority 4: Add disciplined ops and forensics.

- package evidence locally
- run health checks cleanly
- never ship environment-specific server assumptions

Priority 5: Add memory that stays understandable.

- start with SQLite relational memory
- add semantic retrieval only after the base is reliable
- include expiration and deletion controls

## What We Should Not Do

Avoid these traps:

- competing with cloud tools on hype or feature count
- keeping multiple "official" codebases alive
- building a chat toy instead of an engineering tool
- adding cloud sync early
- adding plugin hosting before local capability boundaries are real

## 30-Day Execution Frame

Week 1:

- stabilize desktop runtime
- confirm one source of truth
- clean identity and metadata

Week 2:

- define shared core interfaces
- extract or mirror routing/health primitives into `niyah-core`

Week 3:

- scaffold CLI commands against the shared core
- port minimal memory and model status flows

Week 4:

- wire forensics packaging and doctor/health flows
- document architecture and operating model

## Success Metric

HAVEN wins if a developer can say:

"My code stayed on my machine, the tool was useful, and I can inspect what it did."

That is a better north star than trying to look like a cloud copilot.
