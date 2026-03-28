# HAVEN-Sovereign

[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/khawrizm/haven-sovereign?style=social)](https://github.com/khawrizm/haven-sovereign)
[![Arabic](https://img.shields.io/badge/Language-Arabic%20%2B%20English-blue.svg)](#-العربية)
[![Zero Telemetry](https://img.shields.io/badge/Telemetry-None-brightgreen.svg)](#security)
[![Ollama](https://img.shields.io/badge/Models-Ollama%20Integrated-blueviolet.svg)](#architecture)

**Sovereign IDE with Arabic-First NLP, Three-Lobe Architecture, and Zero Cloud Dependency**

Built by Sulaiman Alshammari (@Dragon403) in Riyadh, Saudi Arabia. Powered by **KHAWRIZM** — the sovereign technology framework.

---

## Human-First Charter

HAVEN is built to serve humans before markets.

- It must serve any person, not only Arabs, not only locals, and not only people with money.
- Privacy, dignity, and access are defaults, not premium features.
- Arabic matters deeply here, but the product must remain multilingual and globally useful.
- We aim for honest, local, inspectable intelligence rather than theatrical claims.

Read the full charter here:

- [PRINCIPLES.md](./PRINCIPLES.md)
- [docs/UNIFIED_ARCHITECTURE.md](./docs/UNIFIED_ARCHITECTURE.md)

Project identity:

- Maintainer: Sulaiman Alshammari
- Primary email: `iqd@hotmail.com`
- Backup email: `shammar403@gmail.com`

---

## 🏗️ Three-Lobe Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HAVEN-Sovereign                           │
│                   (Desktop IDE + Runtime)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────▼──────┐ ┌────▼────────┐ ┌──▼──────────┐
    │ COGNITIVE  │ │ EXECUTIVE   │ │  SENSORY    │
    │ LOBE       │ │ LOBE        │ │  LOBE       │
    │            │ │             │ │             │
    │ Analysis   │ │ Decision    │ │ Perception  │
    │ Reasoning  │ │ Making      │ │ Feedback    │
    │ Planning   │ │ Execution   │ │ Response    │
    │            │ │             │ │             │
    │deepseek-r1 │ │ niyah:latest│ │niyah:writer │
    │  :8b       │ │             │ │             │
    └─────┬──────┘ └────┬────────┘ └──┬──────────┘
          │              │              │
          └──────────────┼──────────────┘
                         │
              ┌──────────▼──────────┐
              │  NIYAH Intent       │
              │  Router             │
              │  (Arabic Root Lex)  │
              └─────────────────────┘
                         │
              ┌──────────▼──────────┐
              │  Ollama Local       │
              │  127.0.0.1:11434    │
              └─────────────────────┘
```

---

## 📊 Comparison: HAVEN vs VSCode vs Cursor

| Feature | **HAVEN-Sovereign** | VSCode | Cursor |
|---------|:---:|:---:|:---:|
| **Language** | TypeScript + Rust | C/C++ | C/C++ |
| **AI Model** | Local Ollama | Cloud (GitHub Copilot) | Cloud (OpenAI) |
| **Privacy** | ✅ 100% Local | ❌ Proprietary | ❌ Proprietary |
| **Arabic NLP** | ✅ Native | ❌ No | ❌ No |
| **Three-Lobe Architecture** | ✅ Yes | ❌ No | ❌ No |
| **Telemetry** | ✅ None | ⚠️ Microsoft | ⚠️ Anthropic |
| **Cost** | Free | Free ($4/mo Pro) | $20/mo |
| **Offline Mode** | ✅ Full | ⚠️ Limited | ❌ No |
| **Model Routing** | ✅ Automatic | N/A | N/A |
| **Desktop Runtime** | ✅ Tauri | N/A | N/A |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ or **Bun**
- **Ollama** (local)
- **Rust** 1.70+ (for Tauri desktop build)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/khawrizm/haven-sovereign.git
   cd haven-sovereign
   ```

2. **Install Ollama** (if not already installed)
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Windows
   # Download from https://ollama.ai
   ```

3. **Pull required models**
   ```bash
   ollama pull deepseek-r1:8b
   ollama pull niyah:latest
   ollama pull niyah:writer
   ```

4. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

5. **Start Ollama daemon**
   ```bash
   ollama serve
   ```

6. **Run HAVEN IDE (Web)**
   ```bash
   npm run dev
   # Opens http://localhost:5173
   ```

7. **Build Desktop App (Tauri)**
   ```bash
   npm run tauri dev
   ```

---

## 📋 Project Structure

```
haven-sovereign/
├── src/
│   ├── components/          # React + TSX UI components
│   │   ├── Hero.tsx         # Main interface
│   │   ├── Navbar.tsx       # Navigation
│   │   └── Editor.tsx       # Code editor with syntax highlighting
│   ├── lib/
│   │   ├── OllamaService.ts # Ollama API integration
│   │   ├── NiyahEngine.ts   # Intent recognition + routing
│   │   └── ModelRouter.ts   # Three-lobe decision engine
│   ├── store/               # State management (Zustand/Pinia)
│   ├── App.tsx              # Main entry
│   └── main.tsx             # Bootstrap
├── src-tauri/               # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs          # Desktop app entry
│   │   ├── lib.rs           # Sovereign logic
│   │   └── ollama.rs        # Ollama bridge
│   └── Cargo.toml
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tauri.conf.json
└── README.md
```

---

## 🧠 How NIYAH Works

### Intent Recognition (Arabic-First)
```typescript
// Input: "اشرح لي كيفية بناء API بـ Node.js"
// Intent detected: educational + technical

const intent = analyzeNiyah(userInput);
// {
//   type: 'COGNITIVE',
//   confidence: 0.92,
//   language: 'ar-gulf',
//   domain: 'backend'
// }
```

### Model Routing
```
User Query
    ↓
NIYAH Intent Analysis
    ↓
    ├→ COGNITIVE (analysis) → deepseek-r1:8b
    ├→ EXECUTIVE (code gen) → niyah:latest
    └→ SENSORY (feedback)   → niyah:writer
    ↓
Aggregated Response
```

### Temperature & Context Settings
- **Cognitive**: temp=0.3, ctx=2048 (analytical, precise)
- **Executive**: temp=0.5, ctx=4096 (balanced execution)
- **Sensory**: temp=0.7, ctx=1024 (creative, responsive)

---

## 🔐 Security & Privacy

✅ **No cloud connectivity** — 100% local processing  
✅ **No telemetry** — No data collection, no tracking  
✅ **No API keys** — Runs entirely on your machine  
✅ **Audit-grade code** — Fully open source, peer-reviewable  
✅ **Sovereign jurisdiction** — Built in Saudi Arabia, owned by creators  

---

## 🌍 العربية

### ما هو HAVEN-Sovereign؟

**هيفن               -سوفرين** هي بيئة تطوير متكاملة تجمع بين:

- **محرر أكواد ذكي** مع إكمال تلقائي
- **محرك نية عربي** يفهم النصوص بلهجة الخليج
- **معمارية ثلاثية الفصوص** (معرفي + تنفيذي + حسي)
- **نماذج محلية** عبر Ollama بدون تبعية سحابية

### المتطلبات

```bash
# تثبيت Ollama
brew install ollama

# تحميل النماذج
ollama pull deepseek-r1:8b
ollama pull niyah:latest

# تشغيل البيئة
npm install
npm run dev
```

### المميزات

| الميزة | التفاصيل |
|-------|---------|
| **الخصوصية** | 100% محلي، لا توجد بيانات سحابية |
| **الفهم العربي** | تحليل نصوص باللهجة الخليجية |
| **الأداء** | سرعة فائقة (لا توجد تأخيرات شبكة) |
| **التحكم الكامل** | مفتوح المصدر، قابل للتخصيص |

---

## 🛠️ Configuration

### `.env` (Optional)
```env
OLLAMA_HOST=127.0.0.1:11434
OLLAMA_MODELS_DIR=/path/to/models
HAVEN_THEME=dark
NIYAH_TEMPERATURE=0.3
```

### `tauri.conf.json` (Desktop)
```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:5173"
  },
  "app": {
    "windows": [{
      "title": "HAVEN-Sovereign",
      "width": 1200,
      "height": 800
    }]
  }
}
```

---

## 📦 Available Commands

```bash
# Development
npm run dev              # Start web IDE (port 5173)
npm run tauri dev       # Start desktop app with live reload

# Building
npm run build           # Build web bundle
npm run tauri build     # Build standalone desktop EXE

# Testing & Quality
npm run lint            # Run ESLint
npm run type-check      # TypeScript validation
npm run test            # Unit tests

# Ollama Management
npm run ollama:pull     # Download models
npm run ollama:list     # List available models
npm run ollama:stop     # Stop Ollama daemon
```

---

## 🔗 Technology Stack

| Layer | Technology |
|-------|-----------|
| **UI** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + Radix UI |
| **State** | Zustand / Pinia |
| **Desktop** | Tauri + Rust |
| **AI/ML** | Ollama + deepseek-r1 + niyah |
| **Backend** | Node.js (optional server) |
| **Build** | Vite + SWC (lightning fast) |

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Code of Conduct**: Be respectful, technical, and direct.

---

## 📄 License

MIT License — See [LICENSE](LICENSE) file for details.

**Copyright © 2025 Sulaiman Alshammari (@Dragon403)**  
Built with 🇸🇦 in Riyadh, Saudi Arabia.

---

## 📞 Support & Community

- **GitHub Issues**: [Report bugs](https://github.com/khawrizm/haven-sovereign/issues)
- **Discussions**: [Ask questions](https://github.com/khawrizm/haven-sovereign/discussions)
- **Twitter**: [@Dragon403](https://twitter.com/Dragon403)
- **Website**: [khawrizm.com](https://khawrizm.com)
- **IDE**: [ide.khawrizm.com](https://ide.khawrizm.com)

---

## 🚀 Roadmap

- [x] Three-Lobe architecture core
- [x] Ollama integration & model routing
- [x] Arabic NLP intent engine
- [x] Desktop (Tauri) build
- [ ] Mobile version (React Native)
- [ ] K-Forge (P2P network layer)
- [ ] VS Code extension
- [ ] Plugin marketplace
- [ ] Multi-language code analysis

---

**Built by the people, for the people. Sovereign technology starts here. 🇸🇦⚡**
