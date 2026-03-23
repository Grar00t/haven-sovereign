#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# Haven OS Sovereign Edition — ISO Builder (ARM64)
# Fixed version: resolves lb config failures
#
# Run on Kali ARM64:
#   sudo bash build-haven-os.sh
#
# Built by أبو خوارزم — Sulaiman Alshammari
# ══════════════════════════════════════════════════════════════

set -euo pipefail

HAVEN_HOME="/home/kali/haven"
ISO_BUILD_DIR="${HAVEN_HOME}/haven_iso_build"
HAVEN_CORE="/home/kali/haven-core"
HAVEN_KERNEL="/home/kali/haven-kernel"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  HAVEN OS — Sovereign ISO Builder (ARM64)               ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Target:  Debian Bookworm ARM64                         ║"
echo "║  Desktop: XFCE + Phalanx Security Layer                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Preflight checks ─────────────────────────────────────────
echo "▶ [0/8] Preflight checks..."

if [ "$(id -u)" -ne 0 ]; then
  echo "❌ Must run as root: sudo bash $0"
  exit 1
fi

for cmd in lb debootstrap; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "❌ Missing: $cmd — install with: apt install live-build debootstrap"
    exit 1
  fi
done

# ── Step 1: Clean previous build ─────────────────────────────
echo "▶ [1/8] Cleaning previous build..."
if [ -d "$ISO_BUILD_DIR" ]; then
  cd "$ISO_BUILD_DIR"
  lb clean --purge 2>/dev/null || true
  cd /
  rm -rf "$ISO_BUILD_DIR"
fi
mkdir -p "$ISO_BUILD_DIR"
cd "$ISO_BUILD_DIR"

# ── Step 2: Configure live-build ─────────────────────────────
# NOTE: --packages-lists and --package-lists are NOT valid in modern lb.
# Package lists are defined manually in config/package-lists/ instead.
echo "▶ [2/8] Configuring live-build (arm64/bookworm)..."
lb config \
  --distribution bookworm \
  --architecture arm64 \
  --debian-installer live \
  --archive-areas "main contrib non-free-firmware" \
  --bootappend-live "quiet splash phalanx_sovereign boot=live overlayroot=tmpfs persistence" \
  --mirror-bootstrap "http://deb.debian.org/debian/" \
  --mirror-chroot "http://deb.debian.org/debian/" \
  --mirror-binary "http://deb.debian.org/debian/"

# Verify config succeeded
if [ ! -f "config/common" ] && [ ! -d "config/bootstrap" ]; then
  echo "❌ lb config failed — check errors above"
  exit 1
fi
echo "  ✓ lb config succeeded"

# ── Step 3: Package lists ─────────────────────────────────────
echo "▶ [3/8] Writing package lists..."
mkdir -p config/package-lists

cat > config/package-lists/desktop.list.chroot << 'PKG_EOF'
task-xfce-desktop
task-laptop
firmware-linux-nonfree
firmware-iwlwifi
firmware-misc-nonfree
firefox-esr
calamares
calamares-settings-debian
cryptsetup
network-manager-gnome
gnome-terminal
tpm2-tools
git
curl
wget
python3-requests
nodejs
build-essential
linux-headers-arm64
PKG_EOF

# ── Step 4: Phalanx sovereign structure ──────────────────────
echo "▶ [4/8] Setting up Phalanx sovereign filesystem..."
mkdir -p config/includes.chroot/etc/phalanx
mkdir -p config/includes.chroot/usr/local/bin
mkdir -p config/includes.chroot/usr/local/lib/haven
mkdir -p config/hooks/live

# Copy Phalanx kernel modules (C sources)
for cfile in phalanx_forensic_journal.c phalanx_immutable_fs.c phalanx_policy_authorize.c; do
  if [ -f "${HAVEN_HOME}/${cfile}" ]; then
    cp "${HAVEN_HOME}/${cfile}" config/includes.chroot/etc/phalanx/
    echo "  ✓ Copied ${cfile}"
  else
    echo "  ⚠ Missing ${cfile} — skipping"
  fi
done

# Copy kernel patches if they exist
if [ -d "${HAVEN_KERNEL}/patches" ]; then
  cp "${HAVEN_KERNEL}/patches/"*.c config/includes.chroot/etc/phalanx/ 2>/dev/null || true
  echo "  ✓ Copied kernel patches"
fi

# Copy Phalanx keys/config
if [ -d "${HAVEN_HOME}/etc_phalanx" ]; then
  cp "${HAVEN_HOME}/etc_phalanx/"* config/includes.chroot/etc/phalanx/ 2>/dev/null || true
  echo "  ✓ Copied Phalanx keys"
fi

# ── Step 5: Niyah Engine ─────────────────────────────────────
echo "▶ [5/8] Installing Niyah Engine..."

# Ensure engine exists
if [ ! -f "${HAVEN_CORE}/engine/niyah-engine.js" ]; then
  echo "  ⚠ Niyah Engine not found at ${HAVEN_CORE}/engine/ — creating..."
  mkdir -p "${HAVEN_CORE}/engine"
  cat > "${HAVEN_CORE}/engine/niyah-engine.js" << 'NIYAH_EOF'
// Niyah Engine — Logic of Intention v2 (Node.js Runtime)
// Sovereign intent analysis for Haven OS terminal & shell
class NiyahEngine {
  constructor() {
    this.roots = {
      'اكتب': 'ك-ت-ب', 'كتابة': 'ك-ت-ب',
      'افهم': 'ف-ه-م', 'فهم': 'ف-ه-م',
      'ابني': 'ب-ن-ي', 'بناء': 'ب-ن-ي',
      'طور': 'ط-و-ر', 'تطوير': 'ط-و-ر',
      'احمي': 'ح-م-ي', 'حماية': 'ح-م-ي',
      'سيادي': 'س-و-د', 'سيادة': 'س-و-د',
    };
  }

  extractRoots(text) {
    const found = [];
    for (const [word, root] of Object.entries(this.roots)) {
      if (text.includes(word)) found.push(root);
    }
    return [...new Set(found)];
  }

  detectDialect(text) {
    if (/وش|شلون|يالله|حياك/.test(text)) return 'khaleeji';
    if (/ازاي|كده|يعني/.test(text)) return 'egyptian';
    if (/كيفك|هلق|شو/.test(text)) return 'levantine';
    return 'msa';
  }

  process(input) {
    const roots = this.extractRoots(input);
    const dialect = this.detectDialect(input);
    const isSovereign = /سيادي|أمن|حماية|sovereign|phalanx/.test(input);

    return {
      intent: isSovereign ? 'sovereign_deep' : 'general',
      confidence: roots.length > 0 ? 0.85 : 0.5,
      dialect,
      roots,
      sovereign: isSovereign,
      timestamp: Date.now(),
    };
  }
}

module.exports = NiyahEngine;
NIYAH_EOF
fi

# Copy engine into the ISO
cp "${HAVEN_CORE}/engine/niyah-engine.js" config/includes.chroot/usr/local/lib/haven/
echo "  ✓ Niyah Engine installed"

# Copy Niyah shell if it exists
if [ -f "${HAVEN_CORE}/shell/niyah-shell.js" ]; then
  cp "${HAVEN_CORE}/shell/niyah-shell.js" config/includes.chroot/usr/local/bin/
  echo "  ✓ Niyah Shell installed"
fi

# Copy other Haven tools
for tool in haven.py haven_action.py phalanx_yubikey_setup.sh niyah_engine.js; do
  src=""
  if [ -f "${HAVEN_HOME}/${tool}" ]; then
    src="${HAVEN_HOME}/${tool}"
  elif [ -f "/root/${tool}" ]; then
    src="/root/${tool}"
  fi
  if [ -n "$src" ]; then
    cp "$src" config/includes.chroot/usr/local/bin/
    echo "  ✓ Copied ${tool}"
  fi
done

# ── Step 6: Kernel module Makefile ───────────────────────────
echo "▶ [6/8] Creating Phalanx module Makefile..."
cat > config/includes.chroot/etc/phalanx/Makefile << 'MK_EOF'
obj-m += phalanx_policy_authorize.o
obj-m += phalanx_forensic_journal.o
obj-m += phalanx_immutable_fs.o

# Kernel patches (if present)
ifneq ($(wildcard phalanx_secure_netlink.c),)
obj-m += phalanx_secure_netlink.o
endif
ifneq ($(wildcard phalanx_telemetry_kill.c),)
obj-m += phalanx_telemetry_kill.o
endif
ifneq ($(wildcard phalanx_pcr_extend.c),)
obj-m += phalanx_pcr_extend.o
endif
ifneq ($(wildcard phalanx_niyah_hook.c),)
obj-m += phalanx_niyah_hook.o
endif

all:
	make -C /lib/modules/$$(shell uname -r)/build M=$$(PWD) modules

clean:
	make -C /lib/modules/$$(shell uname -r)/build M=$$(PWD) clean
MK_EOF
# Ensure Makefile uses tabs (fix potential copy-paste space issues)
sed -i 's/^    /\t/g' config/includes.chroot/etc/phalanx/Makefile

# ── Step 7: Build hooks ─────────────────────────────────────
echo "▶ [7/8] Creating build hooks..."

# Hook: Compile Phalanx kernel modules
cat > config/hooks/live/02-compile-phalanx-modules.hook.chroot << 'HOOK1_EOF'
#!/bin/bash
set -e
echo "[PHALANX] Compiling sovereignty kernel modules..."
apt-get update -qq
apt-get install -y -qq linux-headers-$(uname -r) make gcc build-essential 2>/dev/null || \
  apt-get install -y -qq linux-headers-arm64 make gcc build-essential
cd /etc/phalanx
make 2>&1 || echo "[PHALANX] ⚠ Module compilation deferred (kernel header mismatch in chroot — will compile on first boot)"
HOOK1_EOF
chmod +x config/hooks/live/02-compile-phalanx-modules.hook.chroot

# Hook: Immutable FS setup
if [ -f "${HAVEN_HOME}/immutable_setup.sh" ]; then
  cp "${HAVEN_HOME}/immutable_setup.sh" config/hooks/live/01-phalanx-immutable.hook.chroot
  chmod +x config/hooks/live/01-phalanx-immutable.hook.chroot
  echo "  ✓ Immutable FS hook installed"
fi

# Hook: First-boot Phalanx activation
cat > config/hooks/live/03-haven-firstboot.hook.chroot << 'HOOK3_EOF'
#!/bin/bash
# Create first-boot service to compile modules with correct kernel headers
cat > /etc/systemd/system/phalanx-firstboot.service << 'SVC'
[Unit]
Description=Phalanx Sovereign Module Compiler (first boot)
After=multi-user.target
ConditionPathExists=!/etc/phalanx/.compiled

[Service]
Type=oneshot
ExecStart=/bin/bash -c 'cd /etc/phalanx && make && touch /etc/phalanx/.compiled && insmod phalanx_policy_authorize.ko 2>/dev/null; insmod phalanx_telemetry_kill.ko 2>/dev/null'
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
SVC
systemctl enable phalanx-firstboot.service
HOOK3_EOF
chmod +x config/hooks/live/03-haven-firstboot.hook.chroot

# ── Step 8: Build the ISO ─────────────────────────────────────
echo "▶ [8/8] Building Haven OS ISO..."
echo "  This will take a while — downloading packages + building filesystem..."
echo ""

lb build 2>&1 | tee /tmp/haven-build.log

# ── Check result ─────────────────────────────────────────────
ISO_FILE=$(find . -maxdepth 1 -name "*.iso" -o -name "*.hybrid.iso" 2>/dev/null | head -1)

if [ -n "$ISO_FILE" ] && [ -f "$ISO_FILE" ]; then
  ISO_SIZE=$(du -h "$ISO_FILE" | cut -f1)
  ISO_SHA256=$(sha256sum "$ISO_FILE" | cut -d' ' -f1)
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  ✅ Haven OS ISO Built Successfully                     ║"
  echo "╠══════════════════════════════════════════════════════════╣"
  echo "║  File:   ${ISO_FILE}"
  echo "║  Size:   ${ISO_SIZE}"
  echo "║  SHA256: ${ISO_SHA256}"
  echo "║                                                          ║"
  echo "║  Flash to USB:                                           ║"
  echo "║    sudo dd if=${ISO_FILE} of=/dev/sdX bs=4M status=progress ║"
  echo "║                                                          ║"
  echo "║  Or test in QEMU:                                        ║"
  echo "║    qemu-system-aarch64 -m 2048 -cdrom ${ISO_FILE}       ║"
  echo "╚══════════════════════════════════════════════════════════╝"
else
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  ❌ Build Failed — Check /tmp/haven-build.log           ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo ""
  echo "Last 20 lines of build log:"
  tail -20 /tmp/haven-build.log
  exit 1
fi
