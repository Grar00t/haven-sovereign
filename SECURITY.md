# Security Policy

## Supported Versions

| Version | Supported          | Sovereignty Status |
| ------- | ------------------ | ------------------ |
| 5.x     | :white_check_mark: | **Active**         |
| 4.x     | :x:                | Deprecated         |

## The Phalanx Protocol

HAVEN implements the **Phalanx Protocol**, a sovereign security architecture designed to enforce zero-trust boundaries at the application and network level.

### Core Guarantees
1.  **Zero Telemetry**: No data leaves the user's machine. Network traffic is monitored by `NodeRadar` and blocked by default unless explicitly user-initiated (e.g., model downloads).
2.  **Local-First AI**: All AI inference occurs on-device via Ollama. No tokens are sent to cloud providers (OpenAI, Anthropic, Google, etc.).
3.  **Encrypted Sessions**: All session data, including Niyah intent graphs and chat history, is encrypted at rest using **AES-256-GCM**.
4.  **Sovereign Isolation**: The IDE runs in a sandboxed environment to prevent unauthorized file system access beyond the project root.

## Reporting a Vulnerability

If you discover a security vulnerability in HAVEN, Niyah Engine, or the Phalanx Protocol, please report it privately.

### How to Report
Please email the core team at **admin@gratech.sa** or **shammar403@gmail.com**.

- **Do not** open a public GitHub issue for sensitive security vulnerabilities.
- Provide a detailed description of the vulnerability and steps to reproduce.
- We will acknowledge your report within 48 hours.

### Scope
- **In Scope**: 
    - Niyah Engine intent parsing bypasses.
    - ModelRouter context leakage.
    - SovereignBridge isolation failures.
    - Local storage encryption weaknesses.
- **Out of Scope**: 
    - Vulnerabilities requiring physical access to the user's unlocked machine.
    - Issues in third-party LLM weights (e.g., Llama 3) unless related to HAVEN's integration.
    - Social engineering attacks.

## Sovereignty Assurance

We guarantee that HAVEN does not and will never include "backdoors," mandatory telemetry, or "safety" filters that report usage to central authorities. 

Every line of code is open for audit to ensure compliance with:
- **Saudi Personal Data Protection Law (PDPL)**
- **NCA-ECC** (National Cybersecurity Authority Essential Controls)

---

**الخوارزمية السيادية**
*The algorithm is not neutral. It protects its home.*