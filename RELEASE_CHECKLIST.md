# HAVEN-Sovereign v5.0 GitHub Release Checklist

## ✅ Pre-Release Verification

### Offline Connectivity Test
```bash
# 1. Verify Ollama daemon running
ollama serve
# Expected: Listening on 127.0.0.1:11434

# 2. Check models available
ollama list
# ✅ deepseek-r1:8b (5.2 GB)
# ✅ niyah:v3 (1.1 GB) 
# ✅ niyah:latest (2.0 GB)
# ✅ niyah:writer (2.0 GB)

# 3. Launch HAVEN-Sovereign.exe
.\HAVEN-Sovereign.exe

# 4. Test Ollama proxy connection
curl -X POST http://127.0.0.1:11434/api/tags -H "Content-Type: application/json"
# Expected: JSON list of loaded models (NO ERROR)
```

### NIYAH Engine Responsiveness
```bash
# Test direct model response (no thinking loops)
ollama run niyah:v3 "Who are you?"
# Expected: DIRECT response, <100ms, no "Thinking..." prefix

# Test forensic audit capability
ollama run deepseek-r1:8b "Analyze this code for telemetry: fetch('https://google-analytics.com/collect')"
# Expected: Forensic classification + recommendation
```

### Three-Lobe Architecture Verification
- [ ] Cognitive Lobe (deepseek-r1:8b) routes analysis queries
- [ ] Executive Lobe (niyah:latest) handles decision/execution
- [ ] Sensory Lobe (niyah:writer) processes user intent + response formatting
- [ ] ModelRouter.ts correctly selects model per query intent
- [ ] SovereignTauri.ts `ollama_proxy` bypass works for all three

### Poison Pill (Phalanx Shield) Test
```javascript
// In browser console
fetch('https://google-analytics.com/collect', { 
  method: 'POST', 
  body: JSON.stringify({ event: 'page_view' }) 
});
// Expected: 🛡️ [POISON PILL] Fetch exfiltration blocked
// Expected: TypeError thrown
```

### K-Forge Mesh Test (Optional)
```typescript
// Should NOT error if local mesh relay unavailable
const mesh = new SovereignMeshManager(...);
// Graceful fallback to Gun public relay
```

---

## 📦 Release Assets

### To Upload to GitHub Releases
```
Files:
├── HAVEN-Sovereign.exe (Standalone)
├── HAVEN-Sovereign-Setup.exe (Installer)
├── HAVEN-Sovereign.msi (Enterprise MSI)
├── niyah-v3.modelfile (Ollama model config)
└── niyah-v4.Modelfile (Forensic-grade variant)

Checksums:
├── HAVEN-Sovereign.exe.sha256
├── HAVEN-Sovereign-Setup.exe.sha256
└── niyah-v3.modelfile.sha256
```

### Generate Checksums
```bash
certutil -hashfile HAVEN-Sovereign.exe SHA256
certutil -hashfile HAVEN-Sovereign-Setup.exe SHA256
certutil -hashfile niyah-v3.modelfile SHA256
```

---

## 🔄 Git Commit & Push Flow

### Resolve Auth (Pick One)

**Option A: GitHub CLI (Recommended)**
```bash
gh auth login
# Follow prompts, select SSH
gh release create v5.0-exe \
  --title "HAVEN-Sovereign v5.0 EXE" \
  --notes-file RELEASE_v5.0.md \
  HAVEN-Sovereign.exe HAVEN-Sovereign-Setup.exe niyah-v3.modelfile
```

**Option B: SSH Key Setup**
```bash
# Generate key (if missing)
ssh-keygen -t ed25519 -C "dragon403@khawrizm.sa" -f ~/.ssh/id_ed25519

# Add to GitHub: Settings > SSH Keys > New SSH key

# Update remote
git remote set-url origin git@github.com:Grar00t/haven-sovereign.git

# Push
git push origin main --tags
```

**Option C: Personal Access Token (PAT)**
```bash
# Generate at: GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
# Scopes: repo, read:user

# Export
$env:GITHUB_TOKEN="ghp_xxxxx..."

# Use with git (Windows)
git credential-manager store
# or
git config --global credential.helper manager-core
git push origin main --tags
```

### Commit Message Format
```
git add HAVEN-Sovereign.exe HAVEN-Sovereign.msi niyah-v*.modelfile RELEASE_v5.0.md

git commit -m "🚀 Release v5.0: HAVEN-Sovereign desktop IDE with offline Ollama & Tauri bridge

- Sovereign-first architecture (zero telemetry)
- Three-Lobe NIYAH engine (cognitive/executive/sensory)
- Rust ollama_proxy for WebView CSP bypass
- Phalanx Poison Pill (telemetry detection + neutralization)
- K-Forge P2P git sync (beta, GunDB + WebRTC)
- PDPL/NCA-ECC compliance verified
- Deployed to Windows 10/11 (x64, ARM64)

Assisted-By: Gordon (Docker AI Assistant)
HAVEN-Sovereign v5.0 | Built in Riyadh, KSA 🇸🇦⚡" \
  -m "" \
  -m "Assisted-By: Gordon"

git tag -a v5.0-exe -m "Production release with Tauri desktop, Ollama integration, NIYAH v3/v4"

git push origin main
git push origin --tags
```

---

## 🎯 Verification After Release

### Check GitHub Release Page
- [ ] All 3 exe/msi files uploaded
- [ ] Checksums visible
- [ ] RELEASE_v5.0.md renders correctly
- [ ] Tag v5.0-exe created
- [ ] Commit message visible

### Announce
```
Twitter/X:
"HAVEN-Sovereign v5.0 released! 🇸🇦⚡

✅ Offline-first IDE with local Ollama integration
✅ Three-Lobe NIYAH engine (cognitive/executive/sensory)
✅ Phalanx telemetry neutralization (zero data leakage)
✅ K-Forge P2P git sync (sovereign mesh)
✅ PDPL/NCA-ECC compliance verified

🔗 Download: github.com/Grar00t/haven-sovereign/releases/tag/v5.0-exe

الخوارزمية دائماً تعود للوطن #SovereignTech #KSA"
```

---

## 🔒 Security Checklist

- [ ] No API keys in source (checked .env files)
- [ ] No telemetry URLs in compiled binary
- [ ] Poison Pill active in SovereignTauri.ts
- [ ] Ollama proxy validates all requests
- [ ] Code review passed (forensic audit)
- [ ] No external CDN dependencies (offline-first)

---

## 📋 Post-Release (v5.1 Planning)

- [ ] Auto-download Ollama models UI
- [ ] GitHub Actions deployment automation
- [ ] VS Code extension packaging
- [ ] Mobile app (React Native) kickoff
- [ ] Enterprise MSI signing certificate
- [ ] Localization (Arabic UI + docs)

---

**Status**: Ready for release.
**Date**: 2025
**Author**: Sulaiman Alshammari (@Dragon403)
**Company**: KHAWRIZM
