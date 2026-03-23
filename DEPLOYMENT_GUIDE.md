# HAVEN IDE — Deployment & Integration Guide

**Built by:** Sulaiman Alshammari (@khawrzm, github:Grar00t)  
**Status:** Production Ready  
**Last Updated:** 2026-03-20

---

## 🚀 Quick Start (3 Minutes)

### 1. Local Development
```bash
cd C:\Users\Iqd20\OneDrive\OFFICIAL
npm install
npm run dev
# Open http://localhost:3000
```

### 2. Production Build
```bash
npm run build
npm run preview
# Output in dist/
```

### 3. Vercel Deployment
```bash
npm run deploy:vercel
# Deploys to ide.khawrizm.com
```

---

## 🎯 Environment Setup

### Ollama Configuration
Ollama is running at **http://127.0.0.1:11434**

**To connect the IDE to Ollama:**

1. Create `.env` file in OFFICIAL folder:
```env
VITE_OLLAMA_HOST=http://127.0.0.1:11434
VITE_APP_NAME=HAVEN
VITE_SOVEREIGN_MODE=true
VITE_DEBUG=false
```

2. Verify Ollama is running:
```powershell
curl http://127.0.0.1:11434/api/tags
```

3. Available models:
```powershell
ollama list
# Should show: llama3, qwen, deepseek-coder, etc.
```

---

## 📁 Project Structure

```
C:\Users\Iqd20\OneDrive\OFFICIAL\
├── src/
│   ├── main.tsx                  # Entry point (routing logic)
│   ├── App.tsx                   # Landing page (19 sections)
│   ├── index.css                 # Tailwind + sovereign theme
│   ├── ide/
│   │   ├── HavenIDE.tsx          # IDE shell
│   │   ├── components/           # Editor, Terminal, Chat, etc.
│   │   ├── engine/               # NiyahEngine, ModelRouter, etc.
│   │   └── store/                # State management (Zustand)
│   ├── components/               # Landing sections
│   ├── hooks/                    # Custom hooks
│   ├── store/                    # Global store
│   └── i18n/                     # Translations (EN/AR)
├── public/                       # Static assets
├── dist/                         # Production build (generated)
├── package.json                  # Dependencies
├── vite.config.ts                # Vite config
├── tsconfig.json                 # TypeScript config
├── vercel.json                   # Vercel config
├── .env.example                  # Environment template
└── README.md                     # Project overview
```

---

## 🔧 Core Systems

### NiyahEngine (Arabic NLP)
- **1,056 lines** of Arabic language processing
- **90+ Arabic roots** extracted
- **12 dialect profiles** (Gulf, Egyptian, Levantine, MSA, etc.)
- **Intent classification** (academic, casual, technical, security, etc.)
- **Tone detection** (commanding, friendly, formal, angry, etc.)

**File:** `src/ide/engine/NiyahEngine.ts`

### ModelRouter (Multi-Model Routing)
- **16 model families** supported
- **Three-lobe routing logic**:
  - Cognitive Lobe: Context & memory
  - Executive Lobe: Planning & routing
  - Sensory Lobe: Input parsing (Arabic morphology)
- **Automatic fallback chain**

**File:** `src/ide/engine/ModelRouter.ts`

### ThreeLobeAgent (AI Orchestration)
- **Parallel processing** for fast responses
- **Consensus routing** for complex tasks
- **Sequential execution** for dependent tasks

**File:** `src/ide/engine/ThreeLobeAgent.ts`

### OllamaService (Local AI Integration)
- **Direct connection** to Ollama at http://127.0.0.1:11434
- **Zero telemetry** - all processing local
- **Model management** - list, pull, delete models

**File:** `src/ide/engine/OllamaService.ts`

---

## 🌐 Deployment Targets

### 1. Local Development
```bash
npm run dev
# http://localhost:3000
```

### 2. Desktop (Electron)
```bash
cd D:\HAVEN-Desktop
npm run build:win
# Creates .exe installer in dist/
```

### 3. Production (Vercel)
```bash
npm run deploy:vercel
# https://ide.khawrizm.com
```

---

## ✅ Verification Checklist

- [ ] Ollama running at http://127.0.0.1:11434
- [ ] Models available: `ollama list`
- [ ] .env file configured with OLLAMA_HOST
- [ ] `npm install` succeeds with no errors
- [ ] `npm run build` produces dist/ folder
- [ ] Local dev server runs: `npm run dev`
- [ ] IDE loads at http://localhost:3000/ide
- [ ] NiyahEngine initializes (check console)
- [ ] Ollama connection successful (check DevTools)

---

## 🐛 Troubleshooting

### Build Fails - TypeScript Errors
```bash
npm run lint
# Run type-checking to identify issues
```

### Ollama Connection Failed
```bash
# Check if Ollama is running
curl http://127.0.0.1:11434/api/tags

# If not running, start Ollama
ollama serve
```

### Port Already in Use (3000)
```bash
npm run dev -- --port 3001
```

### Clear Cache & Rebuild
```bash
npm run clean
rm -r node_modules
npm install
npm run build
```

---

## 📦 Available NPM Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server (http://localhost:3000) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type-checking |
| `npm run test` | Run tests with Vitest |
| `npm run clean` | Remove `dist/` directory |
| `npm run deploy` | Deploy via infra/deploy-khawrizm.sh |
| `npm run deploy:vercel` | Deploy to ide.khawrizm.com |

---

## 🔐 Security & Sovereignty

**Zero Telemetry:** All processing happens locally  
**No Cloud Vendor Lock-in:** Swap models without changing code  
**PDPL Compliant:** Saudi Personal Data Protection Law adherence  
**Open Audit:** Every line of code is inspectable  
**Local Storage:** IndexedDB via lightning-fs (no cloud sync)

---

## 📞 Support

**Author:** Sulaiman Alshammari (@khawrzm)  
**GitHub:** github.com/grar00t  
**Email:** admin@gratech.sa  
**Website:** khawrizm.com

---

**Build Status:** ✅ Production Ready  
**Last Deployment:** Vercel (ide.khawrizm.com)  
**Ollama Integration:** ✅ Active at http://127.0.0.1:11434
