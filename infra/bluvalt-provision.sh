#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# HAVEN VDC — Bluvalt Ollama Server Provisioning
# Sets up a secure, production-ready Ollama inference endpoint
# on a Bluvalt R2-CPU-32-128 (or any Ubuntu 22.04+ VPS).
#
# Run as root:  bash bluvalt-provision.sh
#
# What it does:
#   1. Installs Ollama
#   2. Configures systemd (OLLAMA_HOST=0.0.0.0, 127.0.0.1-only listen)
#   3. Installs Nginx + Certbot for HTTPS reverse proxy
#   4. Generates a random API key for HAVEN IDE auth
#   5. Locks down firewall (UFW) — only SSH + HTTPS open
#   6. Pulls default models (configurable)
#
# Built by أبو خوارزم — Sulaiman Alshammari
# ══════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────
# Override these before running, or pass as env vars:
DOMAIN="${DOMAIN:-ollama.yourdomain.com}"       # Your DNS A-record pointing to this server
EMAIL="${EMAIL:-admin@yourdomain.com}"           # For Let's Encrypt certificate
ALLOWED_IP="${ALLOWED_IP:-0.0.0.0/0}"            # Restrict to your IP (e.g. 1.2.3.4/32)
MODELS="${MODELS:-deepseek-coder-v2:16b qwen2.5:14b}"  # Space-separated models to pull
API_KEY="${API_KEY:-$(openssl rand -hex 32)}"     # Auto-generated if not provided
OLLAMA_PORT="${OLLAMA_PORT:-11434}"               # Internal Ollama port (Nginx proxies to this)

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  HAVEN VDC — Sovereign Inference Endpoint Provisioning  ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Domain:      ${DOMAIN}"
echo "║  Email:       ${EMAIL}"
echo "║  Allowed IP:  ${ALLOWED_IP}"
echo "║  Models:      ${MODELS}"
echo "║  API Key:     ${API_KEY:0:8}..."
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── 1. System update ─────────────────────────────────────────
echo "▶ [1/7] Updating system..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Install Ollama ─────────────────────────────────────────
echo "▶ [2/7] Installing Ollama..."
if command -v ollama &>/dev/null; then
  echo "  Ollama already installed: $(ollama --version)"
else
  curl -fsSL https://ollama.com/install.sh | sh
fi

# ── 3. Configure Ollama systemd service ──────────────────────
echo "▶ [3/7] Configuring Ollama for network access..."

# Create systemd override to bind to all interfaces
mkdir -p /etc/systemd/system/ollama.service.d
cat > /etc/systemd/system/ollama.service.d/override.conf << 'UNIT'
[Service]
Environment="OLLAMA_HOST=127.0.0.1"
Environment="OLLAMA_KEEP_ALIVE=10m"
Environment="OLLAMA_NUM_PARALLEL=4"
Environment="OLLAMA_MAX_LOADED_MODELS=3"
UNIT

# Note: OLLAMA_HOST=127.0.0.1 means Ollama only listens locally.
# Nginx will be the public-facing endpoint with auth + TLS.

systemctl daemon-reload
systemctl enable ollama
systemctl restart ollama

# Wait for Ollama to be ready
echo "  Waiting for Ollama to start..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:${OLLAMA_PORT}/api/tags &>/dev/null; then
    echo "  Ollama is running."
    break
  fi
  sleep 1
done

# ── 4. Install Nginx + Certbot ───────────────────────────────
echo "▶ [4/7] Installing Nginx & Certbot..."
apt-get install -y -qq nginx certbot python3-certbot-nginx

# ── 5. Configure Nginx reverse proxy ─────────────────────────
echo "▶ [5/7] Configuring Nginx reverse proxy with API key auth..."

cat > /etc/nginx/sites-available/ollama << NGINX
# HAVEN VDC — Ollama Reverse Proxy
# Terminates TLS, validates API key, proxies to local Ollama

upstream ollama_backend {
    server 127.0.0.1:${OLLAMA_PORT};
    keepalive 32;
}

server {
    listen 80;
    server_name ${DOMAIN};

    # Redirect HTTP → HTTPS (Certbot will manage this after cert issuance)
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    # SSL certs (Certbot will populate these)
    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # IP allowlist (optional — set ALLOWED_IP to restrict)
    # Uncomment the next two lines to restrict by IP:
    # allow ${ALLOWED_IP};
    # deny all;

    # API key validation
    # HAVEN IDE sends: Authorization: Bearer <api-key>
    set \$api_key "${API_KEY}";

    location / {
        # Validate bearer token
        if (\$http_authorization != "Bearer \$api_key") {
            return 401 '{"error": "unauthorized", "message": "Invalid or missing API key"}';
        }

        # Proxy to local Ollama
        proxy_pass http://ollama_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection "";

        # Streaming support (critical for token-by-token generation)
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;

        # Max body size (for large prompts/contexts)
        client_max_body_size 50m;
    }

    # Health check endpoint (no auth required)
    location = /health {
        proxy_pass http://ollama_backend/api/tags;
        proxy_http_version 1.1;
        proxy_buffering off;
    }
}
NGINX

# Enable the site
ln -sf /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/ollama
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t

# ── 6. SSL Certificate ──────────────────────────────────────
echo "▶ [6/7] Obtaining SSL certificate..."

# First start Nginx without SSL to allow Certbot HTTP challenge
# Create a temporary config for initial cert request
cat > /etc/nginx/sites-available/ollama-temp << TEMPNGINX
server {
    listen 80;
    server_name ${DOMAIN};
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    location / {
        return 200 'HAVEN VDC provisioning...';
    }
}
TEMPNGINX
ln -sf /etc/nginx/sites-available/ollama-temp /etc/nginx/sites-enabled/ollama
systemctl restart nginx

# Get cert
certbot certonly --nginx -d "${DOMAIN}" --email "${EMAIL}" --agree-tos --non-interactive || {
  echo "  ⚠ Certificate request failed. If DNS is not ready yet,"
  echo "    run after DNS propagation:  certbot --nginx -d ${DOMAIN}"
  echo "    Continuing without SSL for now..."
}

# Restore full config
ln -sf /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/ollama
rm -f /etc/nginx/sites-available/ollama-temp
systemctl restart nginx || echo "  ⚠ Nginx restart failed (cert may not be ready). Fix and restart manually."

# Auto-renew cert
systemctl enable certbot.timer

# ── 7. Firewall (UFW) ───────────────────────────────────────
echo "▶ [7/7] Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp      # HTTP (for cert renewal + redirect)
ufw allow 443/tcp     # HTTPS (main endpoint)
# Do NOT expose 11434 — Nginx handles it
ufw --force enable
ufw status verbose

# ── 8. Pull models ──────────────────────────────────────────
echo "▶ [Bonus] Pulling sovereign models..."
for model in ${MODELS}; do
  echo "  Pulling ${model}..."
  ollama pull "${model}" || echo "  ⚠ Failed to pull ${model}, skipping."
done

# ── Save credentials ─────────────────────────────────────────
CRED_FILE="/root/.haven-vdc-credentials"
cat > "${CRED_FILE}" << CREDS
# HAVEN VDC Credentials — Generated $(date -Iseconds)
# Keep this file secure!
HAVEN_VDC_URL=https://${DOMAIN}
HAVEN_API_KEY=${API_KEY}
HAVEN_ALLOWED_IP=${ALLOWED_IP}
CREDS
chmod 600 "${CRED_FILE}"

# ── Done ─────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ HAVEN VDC PROVISIONING COMPLETE                     ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  Endpoint:  https://${DOMAIN}"
echo "║  API Key:   ${API_KEY}"
echo "║                                                          ║"
echo "║  Connect from HAVEN IDE:                                 ║"
echo "║    /endpoint set https://${DOMAIN} Bluvalt VDC"
echo "║    /endpoint auth ${API_KEY}"
echo "║    /endpoint test                                        ║"
echo "║                                                          ║"
echo "║  Credentials saved to: ${CRED_FILE}"
echo "║                                                          ║"
echo "║  Test:  curl -H 'Authorization: Bearer ${API_KEY:0:8}...' \\"
echo "║         https://${DOMAIN}/api/tags"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
