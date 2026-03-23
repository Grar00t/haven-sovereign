#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
#
#   ██╗  ██╗ █████╗ ██╗    ██╗ █████╗ ██████╗ ██╗███████╗███╗   ███╗
#   ██║ ██╔╝██╔══██╗██║    ██║██╔══██╗██╔══██╗██║╚══███╔╝████╗ ████║
#   █████╔╝ ███████║██║ █╗ ██║███████║██████╔╝██║  ███╔╝ ██╔████╔██║
#   ██╔═██╗ ██╔══██║██║███╗██║██╔══██║██╔══██╗██║ ███╔╝  ██║╚██╔╝██║
#   ██║  ██╗██║  ██║╚███╔███╔╝██║  ██║██║  ██║██║███████╗██║ ╚═╝ ██║
#   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝
#
#   HAVEN H1 — Sovereign Home Directory Organizer v2.0.0
#   Reorganizes /home/kali/ into a clean, professional, sovereign structure
#
#   SAFE: Uses 'mv' (atomic). Creates dirs first, moves files.
#         If anything fails, original files stay in place.
#         Generates undo script + operation log for full reversibility.
#
#   Usage:
#     sudo bash organize-haven-h1.sh              # Execute
#     sudo bash organize-haven-h1.sh --dry-run    # Preview only
#     sudo bash organize-haven-h1.sh --undo       # Reverse last run
#     sudo bash organize-haven-h1.sh --status     # Show current structure
#     sudo bash organize-haven-h1.sh --verbose    # Detailed output
#
#   Built by KHAWRIZM — Sulaiman Alshammari
#   https://khawrizm.com
#
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
HOME_DIR="/home/kali"
LOG_FILE="${HOME_DIR}/.haven-h1.log"
UNDO_FILE="${HOME_DIR}/.haven-h1-undo.sh"
LOCK_FILE="${HOME_DIR}/.haven-h1.lock"
VERSION="2.0.0"
TIMESTAMP=$(date -Iseconds)
DRY_RUN=false
UNDO_MODE=false
STATUS_MODE=false
VERBOSE=false
MOVE_COUNT=0
SKIP_COUNT=0
FAIL_COUNT=0

# ── Parse arguments ───────────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --dry-run)  DRY_RUN=true   ;;
    --undo)     UNDO_MODE=true ;;
    --status)   STATUS_MODE=true ;;
    --verbose)  VERBOSE=true   ;;
    --help|-h)
      echo "HAVEN H1 — Sovereign Home Directory Organizer v${VERSION}"
      echo ""
      echo "Usage: sudo bash organize-haven-h1.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --dry-run    Preview changes without moving files"
      echo "  --undo       Reverse the last organize operation"
      echo "  --status     Show current directory structure"
      echo "  --verbose    Show detailed output for each operation"
      echo "  --help       Show this help message"
      echo ""
      echo "Built by KHAWRIZM — khawrizm.com"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (use --help)" >&2
      exit 1
      ;;
  esac
done

# Colors
G='\033[0;32m'; Y='\033[1;33m'; C='\033[0;36m'; RD='\033[0;31m'; D='\033[2m'; B='\033[1m'; W='\033[0;37m'; R='\033[0m'

# ── Logging ───────────────────────────────────────────────────────────────────
log() {
  local level="$1"; shift
  local msg="$*"
  if ! $DRY_RUN; then
    echo "[${TIMESTAMP}] [${level}] ${msg}" >> "$LOG_FILE"
  fi
  if $VERBOSE || [ "$level" = "ERROR" ] || [ "$level" = "WARN" ]; then
    case "$level" in
      INFO)  echo -e "  ${D}[info]${R}  ${msg}" ;;
      OK)    echo -e "  ${G}✓${R}  ${msg}" ;;
      SKIP)  echo -e "  ${D}[skip]${R}  ${msg}" ;;
      WARN)  echo -e "  ${Y}⚠${R}  ${msg}" ;;
      ERROR) echo -e "  ${RD}✗${R}  ${msg}" ;;
    esac
  fi
}

# ── Lock (prevent concurrent runs) ───────────────────────────────────────────
acquire_lock() {
  if [ -f "$LOCK_FILE" ]; then
    local pid
    pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo -e "${RD}ERROR: Another H1 instance is running (PID: ${pid}).${R}" >&2
      exit 1
    fi
    rm -f "$LOCK_FILE"
  fi
  echo $$ > "$LOCK_FILE"
  trap 'rm -f "$LOCK_FILE"' EXIT
}

# ── Status mode ───────────────────────────────────────────────────────────────
if $STATUS_MODE; then
  echo ""
  echo -e "${C}╔══════════════════════════════════════════════════════════════╗${R}"
  echo -e "${C}║  ${B}HAVEN H1 — Current Structure${R}${C}                                ║${R}"
  echo -e "${C}╚══════════════════════════════════════════════════════════════╝${R}"
  echo ""
  if command -v tree &>/dev/null; then
    tree -L 2 --dirsfirst -C "$HOME_DIR" 2>/dev/null || ls -la "$HOME_DIR"
  else
    ls -la "$HOME_DIR"
  fi
  echo ""
  if [ -f "$LOG_FILE" ]; then
    log_count=$(wc -l < "$LOG_FILE")
    echo -e "  ${D}Log file: ${LOG_FILE} (${log_count} entries)${R}"
  fi
  if [ -f "$UNDO_FILE" ]; then
    echo -e "  ${D}Undo script: ${UNDO_FILE}${R}"
  fi
  exit 0
fi

# ── Undo mode ─────────────────────────────────────────────────────────────────
if $UNDO_MODE; then
  echo ""
  echo -e "${Y}╔══════════════════════════════════════════════════════════════╗${R}"
  echo -e "${Y}║  ${B}HAVEN H1 — Undo Last Operation${R}${Y}                              ║${R}"
  echo -e "${Y}╚══════════════════════════════════════════════════════════════╝${R}"
  echo ""
  if [ ! -f "$UNDO_FILE" ]; then
    echo -e "  ${RD}No undo script found at ${UNDO_FILE}${R}"
    echo -e "  ${D}Nothing to reverse.${R}"
    exit 1
  fi
  echo -e "  ${Y}This will reverse all moves from the last H1 run.${R}"
  echo -n "  Proceed? [y/N] "
  read -r confirm
  if [[ "$confirm" =~ ^[Yy]$ ]]; then
    bash "$UNDO_FILE" && echo -e "\n  ${G}Undo complete.${R}" || echo -e "\n  ${RD}Some undo operations failed — check manually.${R}"
    rm -f "$UNDO_FILE"
  else
    echo -e "  ${D}Cancelled.${R}"
  fi
  exit 0
fi

# ── Main execution ────────────────────────────────────────────────────────────
acquire_lock

echo ""
echo -e "${C}╔══════════════════════════════════════════════════════════════╗${R}"
echo -e "${C}║                                                            ║${R}"
echo -e "${C}║  ${B}HAVEN H1 — Sovereign Home Directory Organizer${R}${C}            ║${R}"
echo -e "${C}║  ${D}v${VERSION} — Built by KHAWRIZM${R}${C}                              ║${R}"
echo -e "${C}║                                                            ║${R}"
echo -e "${C}║  ${W}Restructuring /home/kali/ into sovereign order${R}${C}            ║${R}"
echo -e "${C}╚══════════════════════════════════════════════════════════════╝${R}"
echo ""

if $DRY_RUN; then
  echo -e "  ${Y}⚠ DRY RUN MODE — no files will be moved${R}"
  echo ""
fi

# Initialize log
if ! $DRY_RUN; then
  echo "# ── HAVEN H1 v${VERSION} — Run: ${TIMESTAMP} ──" >> "$LOG_FILE"
fi

# Initialize undo script
if ! $DRY_RUN; then
  cat > "$UNDO_FILE" << 'UNDO_HEADER'
#!/usr/bin/env bash
# HAVEN H1 — Auto-generated undo script
# Reverses the last organize-haven-h1.sh run
set -euo pipefail
G='\033[0;32m'; Y='\033[1;33m'; RD='\033[0;31m'; R='\033[0m'
echo ""
echo -e "${Y}Reversing HAVEN H1 operations...${R}"
echo ""
UNDO_HEADER
fi

# ── Helpers ───────────────────────────────────────────────────────────────────
safe_mkdir() {
  local dir="$1"
  if $DRY_RUN; then
    echo -e "  ${D}[mkdir]${R} ${dir#$HOME_DIR/}"
  else
    mkdir -p "$dir"
    log "INFO" "Created directory: ${dir#$HOME_DIR/}"
  fi
}

safe_mv() {
  local src="$1" dst="$2"

  # Skip if source doesn't exist
  if [ ! -e "$src" ]; then return; fi

  local basename_src
  basename_src=$(basename "$src")
  local dst_path

  # Determine full destination path
  if [ -d "$dst" ]; then
    dst_path="${dst}/${basename_src}"
  else
    dst_path="$dst"
  fi

  # Collision detection — prevent overwrite
  if [ -e "$dst_path" ]; then
    log "SKIP" "${basename_src} — already exists at ${dst_path#$HOME_DIR/}"
    SKIP_COUNT=$((SKIP_COUNT + 1))
    if ! $VERBOSE; then
      echo -e "  ${D}[skip]${R}  ${basename_src} — already exists"
    fi
    return
  fi

  if $DRY_RUN; then
    echo -e "  ${D}[move]${R} ${basename_src} → ${dst#$HOME_DIR/}"
    MOVE_COUNT=$((MOVE_COUNT + 1))
  else
    local err_output
    if err_output=$(mv "$src" "$dst" 2>&1); then
      log "OK" "${basename_src} → ${dst#$HOME_DIR/}"
      MOVE_COUNT=$((MOVE_COUNT + 1))
      if ! $VERBOSE; then
        echo -e "  ${G}✓${R}  ${basename_src} → ${dst#$HOME_DIR/}"
      fi

      # Write undo entry (reverse the move)
      echo "[ -e \"${dst_path}\" ] && mv \"${dst_path}\" \"${src}\" && echo -e \"  \${G}✓\${R} ${basename_src} restored\" || echo -e \"  \${Y}⚠\${R} ${basename_src} not found\"" >> "$UNDO_FILE"
    else
      log "ERROR" "Failed: ${basename_src} — ${err_output}"
      FAIL_COUNT=$((FAIL_COUNT + 1))
      echo -e "  ${RD}✗${R}  Failed: ${basename_src} — ${err_output}"
    fi
  fi
}

safe_merge() {
  # Merge directory contents using mv per-file (NO cp+rm)
  local src_dir="$1" dst_dir="$2"

  if [ ! -d "$src_dir" ]; then return; fi

  if $DRY_RUN; then
    echo -e "  ${D}[merge]${R} ${src_dir#$HOME_DIR/}/* → ${dst_dir#$HOME_DIR/}/"
    return
  fi

  safe_mkdir "$dst_dir"
  local merge_ok=true

  for item in "${src_dir}/"* "${src_dir}/".[!.]*; do
    [ -e "$item" ] || continue
    local item_name
    item_name=$(basename "$item")
    if [ -e "${dst_dir}/${item_name}" ]; then
      log "SKIP" "merge: ${item_name} already exists in destination"
    elif mv "$item" "$dst_dir/" 2>/dev/null; then
      log "OK" "merge: ${item_name} → ${dst_dir#$HOME_DIR/}/"
      echo "[ -e \"${dst_dir}/${item_name}\" ] && mv \"${dst_dir}/${item_name}\" \"${src_dir}/\" 2>/dev/null" >> "$UNDO_FILE"
    else
      merge_ok=false
      log "ERROR" "merge failed: ${item_name}"
    fi
  done

  # Only remove source dir if it's now empty
  if $merge_ok && [ -d "$src_dir" ] && [ -z "$(ls -A "$src_dir" 2>/dev/null)" ]; then
    rmdir "$src_dir" 2>/dev/null && log "OK" "Removed empty: ${src_dir#$HOME_DIR/}" || true
    echo "mkdir -p \"${src_dir}\"" >> "$UNDO_FILE"
  fi

  echo -e "  ${G}✓${R}  ${src_dir#$HOME_DIR/}/ merged into ${dst_dir#$HOME_DIR/}/"
}

# ══════════════════════════════════════════════════════════════════════════════
# TARGET STRUCTURE:
#
# /home/kali/
# ├── haven/                    ← Main Haven OS project (UNTOUCHED)
# ├── haven-core/               ← Niyah Engine + Shell  (UNTOUCHED)
# ├── haven-kernel/             ← Kernel patches        (UNTOUCHED)
# │
# ├── projects/                 ← Other Haven projects
# │   ├── haven-studio/
# │   ├── phalanx-protocol/
# │   ├── haven_os/
# │   ├── cleanup-haven/
# │   └── HavenIDE.js
# │
# ├── evidence/                 ← Digital forensic evidence
# │   ├── haven_evidence/
# │   ├── HAVEN_EVIDENCE_2026/
# │   ├── GEMINI_EVIDENCE/
# │   ├── FINAL_REVENGE_LOOT/
# │   ├── attachments/
# │   ├── exhibits/             ← Individual exhibit files
# │   └── archives/             ← Compressed evidence
# │
# ├── docs/                     ← Documentation & maps
# │   ├── reports/
# │   └── maps/
# │
# ├── scripts/                  ← Standalone scripts
# │   ├── haven/                ← Haven-related
# │   ├── recon/                ← Reconnaissance
# │   └── tools/                ← Utility & agent scripts
# │
# ├── recon/                    ← Recon results & target data
# │   ├── results/
# │   ├── targets/
# │   └── logs/
# │
# ├── config/                   ← Sensitive config files (chmod 600)
# │
# └── archive/                  ← Old/misc files
#
# ══════════════════════════════════════════════════════════════════════════════

cd "$HOME_DIR"

# ── Step 1: Create directory structure ────────────────────────────────────────
echo -e "${C}▶ [1/8] Creating directory structure...${R}"

for dir in \
  projects \
  evidence/exhibits \
  evidence/archives \
  docs/reports \
  docs/maps \
  scripts/haven \
  scripts/recon \
  scripts/tools \
  recon/results \
  recon/targets \
  recon/logs \
  config \
  archive; do
  safe_mkdir "${HOME_DIR}/${dir}"
done
echo ""

# ── Step 2: Move Haven projects (core repos untouched) ───────────────────────
echo -e "${C}▶ [2/8] Organizing Haven projects...${R}"
echo -e "  ${D}haven/, haven-core/, haven-kernel/ — UNTOUCHED${R}"

safe_mv "${HOME_DIR}/haven-studio"        "${HOME_DIR}/projects/haven-studio"
safe_mv "${HOME_DIR}/phalanx-protocol"    "${HOME_DIR}/projects/phalanx-protocol"
safe_mv "${HOME_DIR}/haven_os"            "${HOME_DIR}/projects/haven_os"
safe_mv "${HOME_DIR}/HavenIDE.js"         "${HOME_DIR}/projects/HavenIDE.js"
safe_mv "${HOME_DIR}/cleanup-haven"       "${HOME_DIR}/projects/cleanup-haven"
echo ""

# ── Step 3: Consolidate evidence ─────────────────────────────────────────────
echo -e "${C}▶ [3/8] Consolidating evidence...${R}"

safe_mv "${HOME_DIR}/haven_evidence"      "${HOME_DIR}/evidence/haven_evidence"
safe_mv "${HOME_DIR}/HAVEN_EVIDENCE_2026" "${HOME_DIR}/evidence/HAVEN_EVIDENCE_2026"
safe_mv "${HOME_DIR}/GEMINI_EVIDENCE"     "${HOME_DIR}/evidence/GEMINI_EVIDENCE"
safe_mv "${HOME_DIR}/FINAL_REVENGE_LOOT"  "${HOME_DIR}/evidence/FINAL_REVENGE_LOOT"
safe_mv "${HOME_DIR}/attachments"         "${HOME_DIR}/evidence/attachments"

# Individual exhibit files
safe_mv "${HOME_DIR}/EXHIBIT_004_GEMINI_PUBLIC_EXECUTION.md"  "${HOME_DIR}/evidence/exhibits/"
safe_mv "${HOME_DIR}/FORENSIC_DOSSIER_6-3808000039722.md"     "${HOME_DIR}/evidence/exhibits/"
safe_mv "${HOME_DIR}/FINAL_PAYLOAD_GDG_2026.md"               "${HOME_DIR}/evidence/exhibits/"
safe_mv "${HOME_DIR}/Copilot_Incriminator.py"                 "${HOME_DIR}/evidence/exhibits/"

# Evidence archives
safe_mv "${HOME_DIR}/sdaia_evidence_final.tar.gz"             "${HOME_DIR}/evidence/archives/"
safe_mv "${HOME_DIR}/PROJECT_KHAWRIZM_MARCH_2026.zip"        "${HOME_DIR}/evidence/archives/"
echo ""

# ── Step 4: Organize documentation (safe merge — no cp+rm) ───────────────────
echo -e "${C}▶ [4/8] Organizing documentation...${R}"

# Merge DOCS/ into docs/reports/ safely (per-file mv, NOT cp+rm)
safe_merge "${HOME_DIR}/DOCS" "${HOME_DIR}/docs/reports"

safe_mv "${HOME_DIR}/Sovereign_Mind_Map.html"        "${HOME_DIR}/docs/maps/"
safe_mv "${HOME_DIR}/seek_the_exploit_museum.html"   "${HOME_DIR}/docs/"
safe_mv "${HOME_DIR}/maybenotebug.txt"               "${HOME_DIR}/docs/"
echo ""

# ── Step 5: Organize scripts ─────────────────────────────────────────────────
echo -e "${C}▶ [5/8] Organizing scripts...${R}"

# Haven-related scripts
safe_mv "${HOME_DIR}/haven_kernel_bootstrap.sh"  "${HOME_DIR}/scripts/haven/"
safe_mv "${HOME_DIR}/haven-kernel-builder.sh"    "${HOME_DIR}/scripts/haven/"
safe_mv "${HOME_DIR}/haven_manifesto_demo.sh"    "${HOME_DIR}/scripts/haven/"
safe_mv "${HOME_DIR}/haven_manifesto.sh"         "${HOME_DIR}/scripts/haven/"

# Recon scripts
safe_mv "${HOME_DIR}/apk_analyzer.sh"            "${HOME_DIR}/scripts/recon/"
safe_mv "${HOME_DIR}/robinhood_recon.sh"         "${HOME_DIR}/scripts/recon/"
safe_mv "${HOME_DIR}/scan_falla.py"              "${HOME_DIR}/scripts/recon/"
safe_mv "${HOME_DIR}/scan_hiloconn.py"           "${HOME_DIR}/scripts/recon/"
safe_mv "${HOME_DIR}/h1_sniper.py"               "${HOME_DIR}/scripts/recon/"
safe_mv "${HOME_DIR}/extract_gpa.py"             "${HOME_DIR}/scripts/recon/"
safe_mv "${HOME_DIR}/hilo_dump.py"               "${HOME_DIR}/scripts/recon/"
safe_mv "${HOME_DIR}/hilo_exploit.py"            "${HOME_DIR}/scripts/recon/"

# Tool scripts
safe_mv "${HOME_DIR}/ai_super_agent_2050.py"     "${HOME_DIR}/scripts/tools/"
safe_mv "${HOME_DIR}/ai_super_agent_2050_v2.py"  "${HOME_DIR}/scripts/tools/"
safe_mv "${HOME_DIR}/ai_super_agent_2050_v3.py"  "${HOME_DIR}/scripts/tools/"
safe_mv "${HOME_DIR}/ai_strike_team_v4_attack.py" "${HOME_DIR}/scripts/tools/"
safe_mv "${HOME_DIR}/strike_2050.py"             "${HOME_DIR}/scripts/tools/"
safe_mv "${HOME_DIR}/strike_engine.py"           "${HOME_DIR}/scripts/tools/"
safe_mv "${HOME_DIR}/proto_strike.py"            "${HOME_DIR}/scripts/tools/"
safe_mv "${HOME_DIR}/meta_lama.py"               "${HOME_DIR}/scripts/tools/"
safe_mv "${HOME_DIR}/liberation_v2.py"           "${HOME_DIR}/scripts/tools/"
safe_mv "${HOME_DIR}/final_gift.py"              "${HOME_DIR}/scripts/tools/"
safe_mv "${HOME_DIR}/syndicate_takeover.py"      "${HOME_DIR}/scripts/tools/"
safe_mv "${HOME_DIR}/khayal_aloulya.py"          "${HOME_DIR}/scripts/tools/"
safe_mv "${HOME_DIR}/khayal_aloulya.sh"          "${HOME_DIR}/scripts/tools/"
safe_mv "${HOME_DIR}/nonstop_khayal.sh"          "${HOME_DIR}/scripts/tools/"
echo ""

# ── Step 6: Organize recon data ──────────────────────────────────────────────
echo -e "${C}▶ [6/8] Organizing recon data...${R}"

safe_mv "${HOME_DIR}/RECON_RESULTS"              "${HOME_DIR}/recon/results/RECON_RESULTS"
safe_mv "${HOME_DIR}/robinhood_apk_analysis"     "${HOME_DIR}/recon/results/robinhood_apk_analysis"
safe_mv "${HOME_DIR}/robinhood_recon"            "${HOME_DIR}/recon/results/robinhood_recon"
safe_mv "${HOME_DIR}/target_extracted"           "${HOME_DIR}/recon/results/target_extracted"
safe_mv "${HOME_DIR}/operation_shakhl"           "${HOME_DIR}/recon/results/operation_shakhl"

safe_mv "${HOME_DIR}/TARGET_LISTS"               "${HOME_DIR}/recon/targets/TARGET_LISTS"
safe_mv "${HOME_DIR}/saudi_targets.txt"          "${HOME_DIR}/recon/targets/"
safe_mv "${HOME_DIR}/live_subs.txt"              "${HOME_DIR}/recon/targets/"
safe_mv "${HOME_DIR}/subs.txt"                   "${HOME_DIR}/recon/targets/"
safe_mv "${HOME_DIR}/temp_subs.txt"              "${HOME_DIR}/recon/targets/"
safe_mv "${HOME_DIR}/findings_google.com.txt"    "${HOME_DIR}/recon/targets/"

safe_mv "${HOME_DIR}/HK_TARGET_DISCOVERY.log"    "${HOME_DIR}/recon/logs/"
echo ""

# ── Step 7: Config & misc (with security hardening) ──────────────────────────
echo -e "${C}▶ [7/8] Config & misc files...${R}"

safe_mv "${HOME_DIR}/ai-master-key.json"         "${HOME_DIR}/config/"
safe_mv "${HOME_DIR}/firebase.json"              "${HOME_DIR}/config/"
safe_mv "${HOME_DIR}/resume.cfg"                 "${HOME_DIR}/config/"

# Protect sensitive config files
if ! $DRY_RUN; then
  for sensitive_file in "${HOME_DIR}/config/ai-master-key.json" "${HOME_DIR}/config/firebase.json"; do
    if [ -f "$sensitive_file" ]; then
      chmod 600 "$sensitive_file"
      log "OK" "Secured: $(basename "$sensitive_file") (chmod 600)"
      echo -e "  ${G}🔒${R} Secured: $(basename "$sensitive_file") (chmod 600)"
    fi
  done
else
  echo -e "  ${D}[chmod 600]${R} ai-master-key.json, firebase.json"
fi

# package-lock.json is NOT config — send to archive
safe_mv "${HOME_DIR}/package-lock.json"          "${HOME_DIR}/archive/"
safe_mv "${HOME_DIR}/falla_admin.js"             "${HOME_DIR}/archive/"
safe_mv "${HOME_DIR}/firebase-debug.log"         "${HOME_DIR}/archive/"
safe_mv "${HOME_DIR}/python3"                    "${HOME_DIR}/archive/"
echo ""

# ── Step 8: Detect remaining unorganized files ───────────────────────────────
echo -e "${C}▶ [8/8] Scanning for remaining files...${R}"

# Known directories that should stay
KNOWN_DIRS="^(haven|haven-core|haven-kernel|projects|evidence|docs|scripts|recon|config|archive|Desktop|Downloads|Documents|Music|Pictures|Videos|Public|Templates|\.)"

remaining=()
while IFS= read -r -d '' entry; do
  name=$(basename "$entry")
  if [[ ! "$name" =~ $KNOWN_DIRS ]] && [[ "$name" != ".haven-h1"* ]]; then
    remaining+=("$name")
  fi
done < <(find "$HOME_DIR" -maxdepth 1 -mindepth 1 -print0 2>/dev/null)

if [ ${#remaining[@]} -gt 0 ]; then
  echo -e "  ${Y}${#remaining[@]} unorganized items remaining:${R}"
  for item in "${remaining[@]}"; do
    if [ -d "${HOME_DIR}/${item}" ]; then
      echo -e "    ${D}dir/${R}  ${item}/"
    else
      echo -e "    ${D}file${R} ${item}"
    fi
  done
  log "WARN" "${#remaining[@]} unorganized items remain in home directory"
else
  echo -e "  ${G}✓${R}  All files organized — zero clutter"
fi
echo ""

# ══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════════════════════

echo -e "${C}══════════════════════════════════════════════════════════════${R}"
echo ""

if $DRY_RUN; then
  echo -e "  ${Y}${B}DRY RUN COMPLETE${R}"
  echo -e "  ${D}${MOVE_COUNT} files would be moved. Run without --dry-run to execute.${R}"
  echo ""
else
  if [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "  ${Y}${B}Organized with ${FAIL_COUNT} warning(s)${R}"
  else
    echo -e "  ${G}${B}  Home directory organized successfully${R}"
  fi
  echo ""
  echo -e "  ${W}${MOVE_COUNT} moved${R}  ${D}${SKIP_COUNT} skipped${R}  ${RD}${FAIL_COUNT} failed${R}"
  echo ""
  echo -e "  ${D}Log:  ${LOG_FILE}${R}"
  echo -e "  ${D}Undo: bash ${UNDO_FILE}${R}"
fi

echo ""
echo -e "${B}  Structure:${R}"
echo -e "  ${C}/home/kali/${R}"
echo -e "  ├── ${G}haven/${R}                 ← ISO build project (untouched)"
echo -e "  ├── ${G}haven-core/${R}            ← Niyah Engine (untouched)"
echo -e "  ├── ${G}haven-kernel/${R}          ← Kernel patches (untouched)"
echo -e "  ├── ${C}projects/${R}"
echo -e "  │   ├── haven-studio/"
echo -e "  │   ├── phalanx-protocol/"
echo -e "  │   ├── haven_os/"
echo -e "  │   └── HavenIDE.js"
echo -e "  ├── ${C}evidence/${R}"
echo -e "  │   ├── haven_evidence/"
echo -e "  │   ├── HAVEN_EVIDENCE_2026/"
echo -e "  │   ├── GEMINI_EVIDENCE/"
echo -e "  │   ├── exhibits/        ${D}(MD files, dossiers)${R}"
echo -e "  │   └── archives/        ${D}(zip, tar.gz)${R}"
echo -e "  ├── ${C}docs/${R}"
echo -e "  │   ├── reports/"
echo -e "  │   └── maps/"
echo -e "  ├── ${C}scripts/${R}"
echo -e "  │   ├── haven/           ${D}(manifesto, bootstrap)${R}"
echo -e "  │   ├── recon/           ${D}(scanners, analyzers)${R}"
echo -e "  │   └── tools/           ${D}(agents, engines)${R}"
echo -e "  ├── ${C}recon/${R}"
echo -e "  │   ├── results/"
echo -e "  │   ├── targets/"
echo -e "  │   └── logs/"
echo -e "  ├── ${C}config/${R}               ${D}(keys 🔒, firebase)${R}"
echo -e "  └── ${C}archive/${R}              ${D}(misc/old files)${R}"
echo ""
echo -e "  ${D}Build scripts reference the same paths (haven/, haven-core/, haven-kernel/).${R}"
echo -e "  ${D}ISO build will not break.${R}"
echo ""
echo -e "  ${C}HAVEN H1 v${VERSION} — Built by KHAWRIZM${R}"
echo -e "  ${D}khawrizm.com${R}"
echo ""
