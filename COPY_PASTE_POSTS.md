# HackerNews + Reddit Post Templates (Copy-Paste Ready)

## 🔴 FOR HACKERNEWS (Just the Title & URL)

**Title to Copy:**
```
HAVEN-Sovereign: Building a Local-First Offline AI IDE with Zero Cloud Dependency
```

**URL to Copy:**
```
https://github.com/Grar00t/haven-sovereign/releases/tag/v5.0-exe
```

**Instructions:**
1. Go to: https://news.ycombinator.com/submit
2. Paste title above
3. Paste URL above
4. Click "submit"
5. Come back to this in 1 hour and respond to comments

---

## 🟠 FOR REDDIT r/cybersecurity (Copy-Paste All)

**SUBREDDIT**: cybersecurity

**TITLE to copy:**
```
[OC] I Built a Sovereign AI IDE That Runs 100% Offline - Full Security Audit Inside
```

**TEXT to copy:**
```
After 15 years of security research (discovered Hotmail & Google Brazil vulnerabilities, zone-h contributor), I decided to build what I always wanted: an IDE where my code NEVER leaves my machine.

**HAVEN-Sovereign is production-ready, PDPL-compliant, built in Riyadh, Saudi Arabia.**

---

## Key Features:

**✅ Three-Lobe AI Architecture** (Deterministic Routing)
- Cognitive Lobe: deepseek-r1:8b (analysis)
- Executive Lobe: niyah:latest (code generation)
- Sensory Lobe: niyah:writer (Arabic intent recognition)

**✅ Tauri + Rust Bridge** (Zero Cloud Leakage)
- `ollama_proxy` command bypasses WebView CORS/CSP
- All HTTP traffic stays on 127.0.0.1:11434
- Zero external URLs (verified with network sniffer)

**✅ Phalanx Protocol** (Real-Time Telemetry Detection)
- Blocks Google Analytics, Facebook Pixel, Sentry, Hotjar, etc.
- Monkey-patches fetch(), sendBeacon(), PerformanceObserver
- Generates forensic reports on breach attempts

**✅ Full Compliance**
- PDPL (Saudi Personal Data Protection Law) ✅
- NCA-ECC (National Cybersecurity Authority) ✅

---

## Performance:

| Metric | Value |
|--------|-------|
| Startup | ~2s |
| Ollama proxy latency | <5ms |
| Intent analysis | ~100ms |
| Code generation (100 tokens) | ~2s |
| Max context | 8192 tokens |

---

## Download:

**GitHub Release**: https://github.com/Grar00t/haven-sovereign/releases/tag/v5.0-exe

- HAVEN-Sovereign.exe (standalone)
- HAVEN-Sovereign-Setup.exe (installer)
- Full source code (open-source)

---

## Q&A:

**"Why not just use Cursor + offline mode?"**
- Cursor still phones home for updates/crash reports
- No deterministic model routing
- No Arabic intent analysis
- No compliance verification

**"Is this production-ready?"**
- Yes. Deployed and tested. v5.0 is stable.
- K-Forge P2P is beta, but core IDE is solid.

**"Can I contribute?"**
- Yes! GitHub issues + discussions open.
- Looking for: Rust developers, security researchers, Arabic NLP experts.

**"How do I run it?"**
```bash
# Ensure Ollama running
ollama serve

# Download + run EXE
.\HAVEN-Sovereign.exe

# Test connection
/status  (in HAVEN AI panel)
```

---

الخوارزمية دائماً تعود للوطن 🇸🇦⚡

Happy to answer technical questions or security concerns in comments.
```

**INSTRUCTIONS:**
1. Go to: https://reddit.com/r/cybersecurity/submit
2. Select "Post"
3. Paste title above into "Title"
4. Paste text above into body
5. Click "Post"
6. Wait 10 minutes, then check comments

---

## 🟣 FOR REDDIT r/rust (Different Angle)

**SUBREDDIT**: rust

**TITLE to copy:**
```
I Built a Sovereign AI IDE with Tauri & Rust - Bypassing WebView CORS/CSP for Local Ollama
```

**TEXT to copy:**
```
**HAVEN-Sovereign** is a production-grade IDE that runs 100% offline, built with Tauri + Rust in Riyadh, Saudi Arabia.

---

## The Problem We Solved:

Tauri's WebView (Chromium-based) has strict CORS/CSP. Direct `fetch()` calls to localhost break in production builds.

**Solution**: Full HTTP handler in Rust, bypassing browser security entirely.

---

## The `ollama_proxy` Command:

Located in `src-tauri/src/lib.rs`:

```rust
#[tauri::command]
fn ollama_proxy(request: OllamaProxyRequest) -> Result<Value, String> {
  if !ollama_is_available() {
    ensure_local_ollama()?;
  }

  match request.path.as_str() {
    "/api/tags" => ollama_http_get("/api/tags"),
    "/api/chat" => ollama_http_post("/api/chat", ...),
    "/api/generate" => ollama_http_post("/api/generate", ...),
    _ => Err("Unsupported path"),
  }
}
```

**Key properties:**
- ✅ No `fetch()` — pure Rust via `reqwest`
- ✅ Whitelist-only routing
- ✅ Automatic Ollama startup
- ✅ Zero external URLs

---

## Performance:

- **IPC latency**: <5ms (vs 50-100ms for network)
- **Model switch**: ~50ms
- **Code generation**: ~2s per 100 tokens (deepseek-r1:8b)

---

## Architecture:

Three-Lobe cognitive design:
- Cognitive: `deepseek-r1:8b` (reasoning)
- Executive: `niyah:latest` (decisions)
- Sensory: `niyah:writer` (Arabic morphology)

Intent-based routing (not keyword matching) cuts model selection overhead by 80%.

---

## Stack:

- Frontend: React 19 + TypeScript
- Editor: Monaco (VS Code)
- Desktop: Tauri + Rust
- AI: Ollama (local)
- Storage: lightning-fs + IndexedDB

---

## Code:

https://github.com/Grar00t/haven-sovereign

Download EXE: https://github.com/Grar00t/haven-sovereign/releases/tag/v5.0-exe

Happy to discuss Rust patterns, Tauri IPC, or Ollama integration in comments.
```

**INSTRUCTIONS:**
1. Go to: https://reddit.com/r/rust/submit
2. Select "Post"
3. Paste title
4. Paste text
5. Click "Post"

---

## ✅ CHECKLIST

```
☐ HackerNews submitted
☐ Reddit r/cybersecurity submitted
☐ Reddit r/rust submitted
☐ GitHub Discussions posted
☐ Twitter posted (if applicable)
☐ Come back to HN in 1 hour to respond to comments
☐ Check Reddit for questions
☐ Track upvotes
☐ Screenshot for portfolio
```

---

## 🎬 TIMING SUGGESTIONS

**Best times (PT):**
- HackerNews: Tuesday 8-9 AM (highest visibility)
- Reddit: Tuesday 2-3 PM (after HN peak)
- Twitter: Afternoon same day

**If you're not in PT timezone:**
- Don't worry, time is flexible
- Consistency matters more than perfect time
- Just post when you're alert to respond

---

**You're ready. Go get 'em. 🚀**

الخوارزمية دائماً تعود للوطن 🇸🇦⚡
