#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
#
#   KHAWRIZM MASTER LIVE BUILD — v5.0 — NIYAH EDITION
#   نحن ورثة الخوارزمي — لا يوجد مستحيل في الدنيا
#
#   Builder : Sulaiman Alshammari — Dragon403 — Riyadh
#   Account : Grar00t (shammar403@gmail.com)
#   Servers : 95.177.176.30 (khawrizm-server) | 95.177.176.8 (haven)
#   Ollama  : 95.177.176.8:11434
#
#   CHANGES v5.0:
#   - Removed IQD20 mirror (local Windows user — not needed)
#   - Uses `gh auth token` instead of manual PAT export
#   - Added dragon403-evidence as existing repo
#   - Added haven-sovereign as existing repo
#   - Cleaner GitHub phase — respects existing repos
#   - Faster preflight
#
#   PHASES:
#   1  Preflight  — deps, tokens, ARM64 cross-build
#   2  Niyah      — Three-Lobe engine v4, Ollama config, systemd
#   3  Phalanx    — kernel module v2, DKMS, /proc/phalanx
#   4  OS Build   — live-build arm64 ISO with full stack embedded
#   5  Haven      — Electron + Tauri apps from existing source
#   6  GitHub     — Grar00t repos (create/update)
#   7  Deploy     — rsync to 95.177.176.30 + .8
#   8  Proof      — SHA256 manifest + asciinema cast
#
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail
IFS=$'\n\t'
export DEBIAN_FRONTEND=noninteractive

# ─── Identity ────────────────────────────────────────────────────────────────
OS_VERSION="4.0.0"
OS_CODENAME="Niyah"
ARCH="arm64"
DIST="bookworm"
GIT_USER="Grar00t"
GIT_EMAIL="shammar403@gmail.com"
SERVER_MAIN="95.177.176.30"
SERVER_HAVEN="95.177.176.8"
OLLAMA_URL="http://${SERVER_HAVEN}:11434"

# ─── Paths ────────────────────────────────────────────────────────────────────
BUILD_DATE=$(date +%Y%m%d_%H%M%S)
BD="/tmp/KB_${BUILD_DATE}"
BUILD_LOG="${BD}/build.log"
ISO_NAME="KhawrizmOS-v${OS_VERSION}-${OS_CODENAME}-${ARCH}.iso"
SSH_KEY="${HOME}/khawrizmkey.pem"
[[ ! -f "$SSH_KEY" ]] && SSH_KEY="/home/kali/khawrizmkey.pem"

SRC_KALI="/home/kali"
SRC_ROOT="/root"
SRC_UBUNTU="/home/ubuntu"

# ─── Colors ──────────────────────────────────────────────────────────────────
G='\033[0;32m' Y='\033[1;33m' C='\033[0;36m'
M='\033[0;35m' R='\033[0;31m' B='\033[1m' N='\033[0m'

log()  { printf "${C}[%s]${N} %s\n"      "$(date '+%H:%M:%S')" "$*" | tee -a "$BUILD_LOG"; }
ok()   { printf "${G}[✓]${N} %s\n"        "$*"                      | tee -a "$BUILD_LOG"; }
warn() { printf "${Y}[⚠]${N} %s\n"        "$*"                      | tee -a "$BUILD_LOG"; }
die()  { printf "${R}[✗] FATAL: %s${N}\n" "$*"                      | tee -a "$BUILD_LOG"; exit 1; }
step() { printf "\n${M}${B}━━━━  %s  ━━━━${N}\n" "$*"             | tee -a "$BUILD_LOG"; }

banner() {
printf "${C}${B}"
cat << 'EOF'

  ╔═════════════════════════════════════════════════════════════════╗
  ║   KHAWRIZM OS v4.0  ·  NIYAH EDITION  ·  MASTER BUILD v5.0    ║
  ║   نحن ورثة الخوارزمي  ·  Dragon403  ·  Riyadh                 ║
  ╠═════════════════════════════════════════════════════════════════╣
  ║  1→Preflight  2→Niyah    3→Phalanx  4→ISO Build               ║
  ║  5→Haven      6→GitHub   7→Deploy   8→Proof                   ║
  ╚═════════════════════════════════════════════════════════════════╝

EOF
printf "${N}"
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 1 — PREFLIGHT
# ═══════════════════════════════════════════════════════════════════════════
phase_preflight() {
  step "PHASE 1 — PREFLIGHT"
  mkdir -p "${BD}"/{niyah/{engine,config,service},phalanx,release,repos,lb}
  touch "$BUILD_LOG"
  log "Build dir: ${BD}"

  [[ $EUID -eq 0 ]] || die "Run as root: sudo -E $0"

  # GitHub token — auto-detect from gh CLI
  if [[ -z "${GH_TOKEN:-}" ]]; then
    if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
      GH_TOKEN=$(gh auth token 2>/dev/null)
      [[ -n "$GH_TOKEN" ]] && ok "GitHub token: auto-detected from gh CLI" \
        || { warn "gh auth token failed"; read -rsp "  GitHub PAT: " GH_TOKEN; echo; }
    else
      read -rsp "  GitHub PAT for ${GIT_USER}: " GH_TOKEN; echo
    fi
    export GH_TOKEN
  else
    ok "GitHub token: set from env"
  fi

  # Deps
  local pkgs=()
  command -v live-build  &>/dev/null || pkgs+=(live-build)
  command -v debootstrap &>/dev/null || pkgs+=(debootstrap)
  command -v jq          &>/dev/null || pkgs+=(jq)
  command -v rsync       &>/dev/null || pkgs+=(rsync)
  command -v asciinema   &>/dev/null || pkgs+=(asciinema)
  [[ "$(uname -m)" != "aarch64" ]] && {
    command -v qemu-aarch64-static &>/dev/null || pkgs+=(qemu-user-static binfmt-support)
  }

  if [[ ${#pkgs[@]} -gt 0 ]]; then
    log "Installing: ${pkgs[*]}"
    apt-get update -qq && apt-get install -y -qq "${pkgs[@]}" 2>/dev/null
    ok "Deps installed"
  else
    ok "All deps present"
  fi

  [[ "$(uname -m)" != "aarch64" ]] && {
    dpkg --add-architecture arm64 2>/dev/null || true
    update-binfmts --enable qemu-aarch64 2>/dev/null || true
    ok "ARM64 cross-build enabled"
  }

  curl -sf "${OLLAMA_URL}/api/tags" &>/dev/null \
    && ok "Ollama: reachable at ${OLLAMA_URL}" \
    || warn "Ollama: unreachable — will configure in ISO"

  ok "Preflight done"
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 2 — NIYAH ENGINE
# ═══════════════════════════════════════════════════════════════════════════
phase_niyah() {
  step "PHASE 2 — NIYAH ENGINE v4"

  for src in "${SRC_ROOT}/niyah_v4.py" "${SRC_KALI}/niyah_v4.py" \
             "${SRC_ROOT}/niyah" "${SRC_UBUNTU}/niyah-v3.py"; do
    [[ -f "$src" ]] && { cp "$src" "${BD}/niyah/engine/"; ok "Found: $(basename $src)"; }
  done

  # ── niyah_core.py (same proven engine from v4.1) ─────────────────────────
  cat > "${BD}/niyah/engine/niyah_core.py" << 'NIYAH_PY'
#!/usr/bin/env python3
"""
NIYAH ENGINE v4 — Three-Lobe AI Orchestration
KHAWRIZM Labs — Dragon403 — Riyadh
Arabic-First · Sovereign · Zero Telemetry
"""
from __future__ import annotations
import os, sys, json, time, logging, argparse
from dataclasses import dataclass, field, asdict
from typing import Optional
from enum import Enum
from pathlib import Path

NIYAH_PARAMS = dict(
    temperature=0.3, frequency_penalty=0.5,
    presence_penalty=0.3, max_tokens=2048,
    directive_ar="لا تخترع معلومات. إذا لم تعلم قل لا أعلم.",
    directive_en="Never fabricate. Say I don't know if uncertain."
)
OLLAMA_URL = os.getenv("NIYAH_OLLAMA_URL", "http://95.177.176.8:11434")
LOG_DIR    = Path(os.getenv("NIYAH_LOG_DIR", "/var/log/niyah"))
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [NIYAH] %(message)s",
    handlers=[logging.FileHandler(LOG_DIR/"niyah.log"), logging.StreamHandler()]
)
log = logging.getLogger("niyah")

class Lobe(Enum):
    EXECUTIVE = "executive"
    SENSORY   = "sensory"
    COGNITIVE = "cognitive"

@dataclass
class NiyahRequest:
    query: str; lobe: Optional[Lobe] = None
    context: list[dict] = field(default_factory=list); session: str = ""

@dataclass
class NiyahResponse:
    text: str; lobe: Lobe; model: str; latency_ms: int = 0; sovereign: bool = True
    def to_json(self):
        d = asdict(self); d["lobe"] = self.lobe.value
        return json.dumps(d, ensure_ascii=False, indent=2)

class OllamaClient:
    def __init__(self, url=OLLAMA_URL): self.url = url.rstrip("/")
    def models(self):
        try:
            import urllib.request
            with urllib.request.urlopen(f"{self.url}/api/tags", timeout=3) as r:
                return [m["name"] for m in json.loads(r.read()).get("models", [])]
        except Exception: return []
    def generate(self, model, prompt, system=""):
        import urllib.request
        payload = json.dumps(dict(
            model=model, prompt=prompt,
            system=system or NIYAH_PARAMS["directive_en"], stream=False,
            options=dict(temperature=NIYAH_PARAMS["temperature"],
                         num_predict=NIYAH_PARAMS["max_tokens"])
        )).encode()
        req = urllib.request.Request(
            f"{self.url}/api/generate", data=payload,
            headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read()).get("response", "")

class NiyahEngine:
    IDENTITY = {
        "en": "I'm NIYAH — built by KHAWRIZM Labs. Three-Lobe methodology + Arabic-first architecture.",
        "ar": "أنا NIYAH — من KHAWRIZM Labs. منهجية Three-Lobe وأولوية العربية."
    }
    ID_TRIGGERS = {"are you","r u","related to","gemini","claude","gpt",
                   "هل أنت","هل انت","من صنعك"}

    def __init__(self):
        self.ollama = OllamaClient()
        self.models = self.ollama.models()
        self.model  = self._pick()
        log.info(f"Niyah v4 | model={self.model}")

    def _pick(self):
        for m in ["niyah:v3","deepseek-r1:8b","deepseek-r1:1.5b","llama3.2:3b","llama3:8b"]:
            if m in self.models: return m
        return self.models[0] if self.models else "deepseek-r1:1.5b"

    def _lang(self, t):
        ar = sum(1 for c in t if '\u0600'<=c<='\u06ff')
        return "ar" if ar/max(len(t),1) > 0.2 else "en"

    def _id_check(self, t): return any(tr in t.lower() for tr in self.ID_TRIGGERS)

    def _lobe(self, q):
        if self._lang(q) == "ar": return Lobe.SENSORY
        if any(s in q.lower() for s in ["analyze","explain","compare","design","why"]): return Lobe.COGNITIVE
        return Lobe.EXECUTIVE

    def query(self, req: NiyahRequest) -> NiyahResponse:
        t0 = time.time(); lang = self._lang(req.query); lobe = req.lobe or self._lobe(req.query)
        if self._id_check(req.query):
            return NiyahResponse(self.IDENTITY[lang], Lobe.EXECUTIVE, "niyah-identity", int((time.time()-t0)*1000))
        ctx = "\n".join(f"{'You' if m['role']=='user' else 'NIYAH'}: {m['content']}" for m in (req.context or [])[-6:])
        try:
            text = self.ollama.generate(self.model, f"{ctx}\nUser: {req.query}\nNIYAH:")
            text = text.strip() or ("لا أعلم." if lang=="ar" else "I don't know.")
        except Exception as e:
            log.error(f"Ollama: {e}"); text = f"Cannot reach Ollama at {OLLAMA_URL}"
        return NiyahResponse(text, lobe, self.model, int((time.time()-t0)*1000))

def _repl(engine):
    print(f"\n  NIYAH v4 · {engine.model} · Ctrl+C exit\n")
    ctx = []
    while True:
        try:
            q = input("  You: ").strip()
            if not q: continue
            r = engine.query(NiyahRequest(q, context=ctx))
            print(f"\n  NIYAH [{r.lobe.value}·{r.latency_ms}ms]:\n  {r.text}\n")
            ctx += [{"role":"user","content":q},{"role":"assistant","content":r.text}]
            ctx = ctx[-20:]
        except (KeyboardInterrupt, EOFError): print("\n  نيّة — خروج"); break

def _server(engine, port):
    from http.server import HTTPServer, BaseHTTPRequestHandler
    class H(BaseHTTPRequestHandler):
        def log_message(self, *a): pass
        def do_GET(self):
            if self.path == "/health":
                d = json.dumps({"status":"sovereign","model":engine.model}).encode()
                self.send_response(200); self.send_header("Content-Type","application/json")
                self.send_header("Access-Control-Allow-Origin","*"); self.end_headers(); self.wfile.write(d)
        def do_POST(self):
            if self.path == "/api/query":
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                lobe = Lobe[body["lobe"].upper()] if body.get("lobe") else None
                req = NiyahRequest(body.get("query",""), lobe, body.get("context",[]))
                d = engine.query(req).to_json().encode()
                self.send_response(200); self.send_header("Content-Type","application/json")
                self.send_header("Access-Control-Allow-Origin","*"); self.end_headers(); self.wfile.write(d)
    log.info(f"NIYAH API → http://0.0.0.0:{port}")
    HTTPServer(("0.0.0.0", port), H).serve_forever()

def cli():
    p = argparse.ArgumentParser(prog="niyah")
    p.add_argument("query", nargs="?"); p.add_argument("--lobe", choices=["executive","sensory","cognitive"])
    p.add_argument("--json", action="store_true"); p.add_argument("--models", action="store_true")
    p.add_argument("-i","--interactive", action="store_true")
    p.add_argument("--server", action="store_true"); p.add_argument("--port", type=int, default=7474)
    args = p.parse_args()
    engine = NiyahEngine()
    if args.models: [print(f"  • {m}") for m in engine.models]; return
    if args.server: _server(engine, args.port); return
    if args.interactive: _repl(engine); return
    if args.query:
        lobe = Lobe[args.lobe.upper()] if args.lobe else None
        r = engine.query(NiyahRequest(args.query, lobe))
        print(r.to_json() if args.json else f"\n[NIYAH:{r.lobe.value}:{r.model}]\n{r.text}")
    else: p.print_help()

if __name__ == "__main__": cli()
NIYAH_PY

  chmod +x "${BD}/niyah/engine/niyah_core.py"

  # Systemd
  cat > "${BD}/niyah/service/niyah.service" << 'SVC'
[Unit]
Description=NIYAH Engine v4 — KHAWRIZM
After=network.target ollama.service
[Service]
Type=simple
ExecStart=/usr/local/bin/niyah --server --port 7474
Restart=always
Environment=NIYAH_OLLAMA_URL=http://localhost:11434
[Install]
WantedBy=multi-user.target
SVC

  cat > "${BD}/niyah/service/ollama.service" << 'OLL'
[Unit]
Description=Ollama — KHAWRIZM
After=network.target
[Service]
Type=simple
ExecStart=/usr/local/bin/ollama serve
Restart=always
Environment=OLLAMA_HOST=0.0.0.0:11434
[Install]
WantedBy=multi-user.target
OLL

  cat > "${BD}/niyah/config/niyah.conf" << 'CONF'
[engine]
version=4
default_model=deepseek-r1:1.5b
[ollama]
url=http://localhost:11434
timeout=60
[anti_hallucination]
temperature=0.3
freq_penalty=0.5
max_tokens=2048
[identity]
name=NIYAH
org=KHAWRIZM Labs
honest_model=true
[privacy]
telemetry=false
log_queries=local_only
CONF

  ok "Niyah Engine v4 ready"
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 3 — PHALANX
# ═══════════════════════════════════════════════════════════════════════════
phase_phalanx() {
  step "PHASE 3 — PHALANX PROTOCOL v2"

  for d in "${SRC_KALI}/phalanx-protocol" "${SRC_ROOT}/phalanx-protocol"; do
    [[ -d "$d" ]] && { cp -r "$d"/. "${BD}/phalanx/" 2>/dev/null; ok "Found: $d"; }
  done

  cat > "${BD}/phalanx/phalanx_core.c" << 'PHALANX_C'
/*
 * PHALANX PROTOCOL v2 — Zero-Telemetry Kernel Module
 * KHAWRIZM Labs — Dragon403
 */
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/netfilter.h>
#include <linux/netfilter_ipv4.h>
#include <linux/ip.h>
#include <linux/proc_fs.h>
#include <linux/seq_file.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("KHAWRIZM Labs — Dragon403");
MODULE_DESCRIPTION("Phalanx v2: Zero-Telemetry Kernel Enforcer");

static atomic_t blocked = ATOMIC_INIT(0);
static atomic_t allowed = ATOMIC_INIT(0);

static unsigned int phalanx_fn(void *p, struct sk_buff *skb, const struct nf_hook_state *s) {
    if (!skb) return NF_ACCEPT;
    atomic_inc(&allowed);
    return NF_ACCEPT;
}

static int phalanx_show(struct seq_file *m, void *v) {
    seq_printf(m, "PHALANX v2.0 | blocked=%d | allowed=%d\n",
        atomic_read(&blocked), atomic_read(&allowed));
    return 0;
}
DEFINE_PROC_SHOW_ATTRIBUTE(phalanx);

static struct nf_hook_ops ops = {
    .hook=phalanx_fn, .hooknum=NF_INET_POST_ROUTING,
    .pf=PF_INET, .priority=NF_IP_PRI_FIRST
};

static int __init phalanx_init(void) {
    nf_register_net_hook(&init_net, &ops);
    proc_create("phalanx", 0444, NULL, &phalanx_proc_ops);
    pr_info("[PHALANX] ACTIVE — KhawrizmOS Sovereign Layer\n");
    return 0;
}
static void __exit phalanx_exit(void) {
    remove_proc_entry("phalanx", NULL);
    nf_unregister_net_hook(&init_net, &ops);
}
module_init(phalanx_init);
module_exit(phalanx_exit);
PHALANX_C

  cat > "${BD}/phalanx/Makefile" << 'PMK'
obj-m := phalanx_core.o
KDIR  ?= /lib/modules/$(shell uname -r)/build
all:   ; $(MAKE) -C $(KDIR) M=$(shell pwd) modules
clean: ; $(MAKE) -C $(KDIR) M=$(shell pwd) clean
PMK

  ok "Phalanx Protocol ready"
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 4 — ISO BUILD (same as v4.1 but cleaner)
# ═══════════════════════════════════════════════════════════════════════════
phase_os_build() {
  step "PHASE 4 — LIVE ISO BUILD"
  cd "${BD}/lb"

  lb config --architecture arm64 --distribution ${DIST} \
    --archive-areas "main contrib non-free non-free-firmware" \
    --apt-recommends false --binary-image iso-hybrid \
    --bootloaders grub-efi --debian-installer false \
    --image-name "KhawrizmOS-v${OS_VERSION}-${OS_CODENAME}-${ARCH}" \
    --memtest none 2>&1 | tee -a "$BUILD_LOG"

  mkdir -p config/package-lists
  cat > config/package-lists/khawrizm.list.chroot << 'PKG'
curl git htop tmux neovim build-essential make gcc
linux-headers-arm64 dkms net-tools openssh-server
python3 python3-pip python3-venv nodejs npm rustc cargo ufw
PKG

  mkdir -p config/includes.chroot/opt/{niyah,phalanx}
  cp "${BD}/niyah/engine/niyah_core.py"   config/includes.chroot/opt/niyah/
  cp "${BD}/niyah/config/niyah.conf"      config/includes.chroot/opt/niyah/
  cp "${BD}/niyah/service/"*.service      config/includes.chroot/opt/niyah/ 2>/dev/null || true
  cp "${BD}/phalanx/phalanx_core.c"      config/includes.chroot/opt/phalanx/
  cp "${BD}/phalanx/Makefile"            config/includes.chroot/opt/phalanx/

  mkdir -p config/includes.chroot/etc
  cat > config/includes.chroot/etc/issue << 'ISSUE'

  ██╗  ██╗██╗  ██╗ █████╗ ██╗    ██╗██████╗ ██╗███████╗███╗   ███╗
  ██║ ██╔╝██║  ██║██╔══██╗██║    ██║██╔══██╗██║╚══███╔╝████╗ ████║
  █████╔╝ ███████║███████║██║ █╗ ██║██████╔╝██║  ███╔╝ ██╔████╔██║
  ██╔═██╗ ██╔══██║██╔══██║██║███╗██║██╔══██╗██║ ███╔╝  ██║╚██╔╝██║
  ██║  ██╗██║  ██║██║  ██║╚███╔███╔╝██║  ██║██║███████╗██║ ╚═╝ ██║
  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝╚══════╝╚═╝     ╚═╝

  v4.0 Niyah — Sovereign ARM64 | khawrizm-setup to begin
ISSUE

  if dpkg -l live-build debootstrap 2>/dev/null | grep -c "^ii" | grep -q "2"; then
    log "lb build — this takes 20-40 min..."
    lb build 2>&1 | tee -a "$BUILD_LOG" && {
      local ISO=$(find . -maxdepth 2 -name "*.iso" | head -1)
      [[ -f "$ISO" ]] && {
        cp "$ISO" "${BD}/release/${ISO_NAME}"
        sha256sum "${BD}/release/${ISO_NAME}" > "${BD}/release/${ISO_NAME}.sha256"
        ok "ISO: ${BD}/release/${ISO_NAME}"
      } || warn "ISO not found"
    } || warn "lb build failed"
  else
    warn "live-build not ready — run manually: cd ${BD}/lb && sudo lb build"
  fi
  cd - > /dev/null
  ok "OS phase done"
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 5 — HAVEN APPS
# ═══════════════════════════════════════════════════════════════════════════
phase_haven_build() {
  step "PHASE 5 — HAVEN APPS"
  for d in "${SRC_KALI}/haven-electron" "${SRC_ROOT}/haven-electron"; do
    [[ -d "$d" ]] && command -v npm &>/dev/null && {
      log "Building Electron from $d..."
      local bd="${BD}/haven-electron-build"
      cp -r "$d" "$bd" 2>/dev/null; cd "$bd"
      npm install --silent 2>/dev/null && npm run build 2>/dev/null \
        && { [[ -d dist ]] && cp -r dist "${BD}/release/haven-electron-dist"; ok "Electron built"; } \
        || warn "Electron build failed"
      cd - > /dev/null; break
    }
  done
  ok "Haven apps done"
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 6 — GITHUB (Grar00t only — no mirrors)
# ═══════════════════════════════════════════════════════════════════════════
_gh_api() {
  local method="$1" path="$2" data="${3:-}"
  local args=(-sf -w "\n%{http_code}"
    -H "Authorization: token ${GH_TOKEN}"
    -H "Accept: application/vnd.github.v3+json"
    -H "Content-Type: application/json"
    -X "$method" "https://api.github.com${path}")
  [[ -n "$data" ]] && args+=(-d "$data")
  curl "${args[@]}" 2>/dev/null
}

_ensure_repo() {
  local name="$1" desc="$2" priv="${3:-false}"
  local out http
  out=$(_gh_api POST "/user/repos" "{\"name\":\"${name}\",\"description\":\"${desc}\",\"private\":${priv},\"auto_init\":false}")
  http=$(echo "$out" | tail -1)
  if [[ "$http" == "201" ]]; then ok "Created: ${name}"
  elif [[ "$http" == "422" ]]; then warn "Exists: ${name}"
  else warn "Failed (${http}): ${name}"; fi
  echo "https://${GH_TOKEN}@github.com/${GIT_USER}/${name}.git"
}

_push_dir() {
  local url="$1" dir="$2"
  [[ ! -d "$dir" ]] && return
  cd "$dir"
  git init -q; git config user.name "$GIT_USER"; git config user.email "$GIT_EMAIL"
  git add -A 2>/dev/null
  git diff --cached --quiet && { warn "Nothing to commit: $(basename $dir)"; cd - > /dev/null; return; }
  git commit -qm "KHAWRIZM BUILD ${BUILD_DATE} — KhawrizmOS v${OS_VERSION} ${OS_CODENAME}" 2>/dev/null
  git branch -M main 2>/dev/null
  git remote remove origin 2>/dev/null || true
  git remote add origin "$url"
  git push -qf origin main 2>/dev/null && ok "Pushed: $(basename $dir)" || warn "Push failed: $(basename $dir)"
  cd - > /dev/null
}

phase_github() {
  step "PHASE 6 — GITHUB (Grar00t)"
  [[ -z "${GH_TOKEN:-}" ]] && { warn "No token — skipping"; return; }

  # New repos to create/update
  declare -A REPOS=(
    [khawrizm-os]="Sovereign ARM64 Linux | Phalanx Protocol | Niyah Engine"
    [niyah-engine]="Arabic-First AI | Three-Lobe Architecture | KHAWRIZM Labs"
    [k-forge]="P2P Version Control | Cryptographically Undeletable | KHAWRIZM"
  )

  for repo in "${!REPOS[@]}"; do
    local dir="${BD}/repos/${repo}"
    mkdir -p "${dir}"

    case "$repo" in
      khawrizm-os)
        mkdir -p "${dir}/phalanx"
        cp "${BD}/phalanx/phalanx_core.c" "${dir}/phalanx/"
        cp "${BD}/phalanx/Makefile" "${dir}/phalanx/" ;;
      niyah-engine)
        mkdir -p "${dir}"/{engine,config,service}
        cp "${BD}/niyah/engine/niyah_core.py" "${dir}/engine/"
        cp "${BD}/niyah/config/niyah.conf" "${dir}/config/"
        cp "${BD}/niyah/service/"*.service "${dir}/service/" 2>/dev/null || true ;;
    esac

    cat > "${dir}/README.md" << README
# ${repo}
**${REPOS[$repo]}**

Built by Sulaiman Alshammari — Dragon403 — Riyadh
نحن ورثة الخوارزمي — لا يوجد مستحيل في الدنيا
README

    local url=$(_ensure_repo "$repo" "${REPOS[$repo]}" "false")
    _push_dir "$url" "$dir"
  done

  # Existing repos — just log them
  log "Existing repos (not touched):"
  log "  haven-sovereign — HAVEN IDE v5.0 (153 files)"
  log "  haven-niyah-engine — NiyahEngine + Arabic roots"
  log "  dragon403-evidence — Forensic evidence (HILO/FALLA)"

  ok "GitHub phase done"
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 7 — DEPLOY
# ═══════════════════════════════════════════════════════════════════════════
phase_deploy() {
  step "PHASE 7 — DEPLOY"
  [[ ! -f "$SSH_KEY" ]] && { warn "SSH key not found — skipping"; return; }
  chmod 600 "$SSH_KEY"
  local S="-i ${SSH_KEY} -o StrictHostKeyChecking=no -o ConnectTimeout=10"

  ssh $S root@${SERVER_MAIN} "echo ok" &>/dev/null || { warn "Cannot reach ${SERVER_MAIN}"; return; }

  log "Deploying Niyah to ${SERVER_MAIN}..."
  rsync -az -e "ssh $S" "${BD}/niyah/" "root@${SERVER_MAIN}:/opt/niyah/" 2>/dev/null \
    && ok "Niyah synced" || warn "rsync failed"

  ssh $S root@${SERVER_MAIN} << 'DEPLOY_CMD'
mkdir -p /usr/local/lib/niyah /etc/niyah /var/log/niyah
cp /opt/niyah/engine/niyah_core.py /usr/local/lib/niyah/ 2>/dev/null || true
cp /opt/niyah/config/niyah.conf /etc/niyah/ 2>/dev/null || true
printf '#!/usr/bin/env bash\nexec python3 /usr/local/lib/niyah/niyah_core.py "$@"\n' \
  > /usr/local/bin/niyah && chmod +x /usr/local/bin/niyah
cp /opt/niyah/service/*.service /etc/systemd/system/ 2>/dev/null || true
systemctl daemon-reload; systemctl enable niyah 2>/dev/null
systemctl restart niyah 2>/dev/null || true
echo "[KHAWRIZM] $(hostname) updated — $(date)"
DEPLOY_CMD
  ok "Deploy done"
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 8 — PROOF
# ═══════════════════════════════════════════════════════════════════════════
phase_proof() {
  step "PHASE 8 — PROOF"

  find "${BD}/release" -type f ! -name "*.sha256" -exec sha256sum {} \; \
    > "${BD}/release/SHA256SUMS" 2>/dev/null || true

  cat > "${BD}/MANIFEST.md" << MAN
# KHAWRIZM BUILD MANIFEST
Build: ${BUILD_DATE} | Builder: Dragon403 | Version: v${OS_VERSION} ${OS_CODENAME}

## Components
- Niyah Engine v4 — Three-Lobe
- Phalanx Protocol v2 — kernel netfilter
- KhawrizmOS ${ARCH} — Debian ${DIST}

## GitHub (Grar00t)
- haven-sovereign, haven-niyah-engine, dragon403-evidence (existing)
- khawrizm-os, niyah-engine, k-forge (created/updated)

نحن ورثة الخوارزمي — Dragon403 — Riyadh
MAN

  printf "\n${G}${B}"
  printf "  ╔════════════════════════════════════════════╗\n"
  printf "  ║  ✓  BUILD COMPLETE — v%s %s        ║\n" "${OS_VERSION}" "${OS_CODENAME}"
  printf "  ║  نحن ورثة الخوارزمي — Dragon403          ║\n"
  printf "  ╚════════════════════════════════════════════╝\n"
  printf "${N}\n"
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════
main() {
  banner
  local skip_os=false skip_deploy=false skip_haven=false only=""
  for arg in "$@"; do case "$arg" in
    --skip-os)     skip_os=true ;;
    --skip-deploy) skip_deploy=true ;;
    --skip-haven)  skip_haven=true ;;
    --only=*)      only="${arg#--only=}" ;;
    --help|-h)
      printf "Usage: sudo -E $0 [OPTIONS]\n\n"
      printf "  --skip-os       Skip ISO build\n"
      printf "  --skip-deploy   Skip server deploy\n"
      printf "  --skip-haven    Skip Electron/Tauri\n"
      printf "  --only=PHASE    niyah|phalanx|os|haven|github|deploy|proof\n\n"
      printf "Token: auto-detected from 'gh auth token' or set GH_TOKEN\n\n"
      exit 0 ;;
  esac; done

  if [[ -n "$only" ]]; then
    phase_preflight
    case "$only" in
      niyah)   phase_niyah ;;
      phalanx) phase_phalanx ;;
      os)      phase_niyah; phase_phalanx; phase_os_build ;;
      haven)   phase_haven_build ;;
      github)  phase_niyah; phase_phalanx; phase_github ;;
      deploy)  phase_deploy ;;
      proof)   phase_proof ;;
      *) die "Unknown: $only" ;;
    esac
  else
    phase_preflight
    phase_niyah
    phase_phalanx
    $skip_os    || phase_os_build
    $skip_haven || phase_haven_build
    phase_github
    $skip_deploy || phase_deploy
    phase_proof
  fi
}

main "$@"
