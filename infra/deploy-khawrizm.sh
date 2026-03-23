#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# HAVEN IDE — Deploy to khawrizm.com
# Supports two deployment modes:
#   1. Firebase Hosting (default — likely current setup)
#   2. Google Cloud Run (container-based)
#
# Prerequisites:
#   - Firebase CLI: npm install -g firebase-tools
#   - OR gcloud CLI authenticated
#
# Usage:
#   bash infra/deploy-khawrizm.sh              # Firebase (default)
#   bash infra/deploy-khawrizm.sh cloudrun     # Cloud Run
#
# Built by أبو خوارزم — Sulaiman Alshammari
# ══════════════════════════════════════════════════════════════

set -euo pipefail

MODE="${1:-firebase}"
PROJECT="${GCP_PROJECT:-studio-9604630528-7aef6}"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  HAVEN IDE — Deploy to khawrizm.com                     ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Mode:    ${MODE}"
echo "║  Project: ${PROJECT}"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Build production PWA ─────────────────────────────
echo "▶ [1/3] Building production PWA..."
npm run build

echo "▶ [2/3] Build complete. dist/ contents:"
ls -lah dist/

# ══════════════════════════════════════════════════════════════
# MODE: Firebase Hosting
# ══════════════════════════════════════════════════════════════
if [ "$MODE" = "firebase" ]; then

  # Check if firebase.json exists in project root, if not create it
  if [ ! -f "firebase.json" ]; then
    echo "▶ Creating firebase.json..."
    cat > firebase.json << 'FIREBASE'
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/assets/**",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      },
      {
        "source": "/sw.js",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
        ]
      },
      {
        "source": "/manifest.webmanifest",
        "headers": [
          { "key": "Content-Type", "value": "application/manifest+json" }
        ]
      },
      {
        "source": "**",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
        ]
      }
    ]
  }
}
FIREBASE
  fi

  # Create .firebaserc if missing
  if [ ! -f ".firebaserc" ]; then
    echo "▶ Creating .firebaserc..."
    cat > .firebaserc << FIREBASERC
{
  "projects": {
    "default": "${PROJECT}"
  }
}
FIREBASERC
  fi

  echo "▶ [3/3] Deploying to Firebase Hosting..."
  firebase deploy --only hosting --project "${PROJECT}"

# ══════════════════════════════════════════════════════════════
# MODE: Cloud Run (container-based)
# ══════════════════════════════════════════════════════════════
elif [ "$MODE" = "cloudrun" ]; then

  REGION="${GCP_REGION:-me-central1}"
  SERVICE="haven-ide"

  echo "▶ [2.5/3] Preparing container..."
  cat > dist/Dockerfile << 'DOCKERFILE'
FROM nginx:alpine
COPY . /usr/share/nginx/html/
RUN echo 'server { \
    listen 8080; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    gzip on; \
    gzip_types text/plain text/css application/javascript application/json image/svg+xml; \
    gzip_min_length 1000; \
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; } \
    location = /sw.js { expires off; add_header Cache-Control "no-cache, no-store, must-revalidate"; } \
    location / { try_files $uri $uri/ /index.html; } \
}' > /etc/nginx/conf.d/default.conf
DOCKERFILE

  echo "▶ [3/3] Deploying to Cloud Run..."
  cd dist
  gcloud run deploy "${SERVICE}" \
    --source . \
    --project "${PROJECT}" \
    --region "${REGION}" \
    --allow-unauthenticated \
    --port 8080 \
    --memory 256Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 3
  cd ..

  echo ""
  echo "⚠️  Don't forget to map your domain:"
  echo "  gcloud run domain-mappings create --service=${SERVICE} --domain=khawrizm.com --region=${REGION} --project=${PROJECT}"

else
  echo "❌ Unknown mode: ${MODE}"
  echo "Usage: bash infra/deploy-khawrizm.sh [firebase|cloudrun]"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ HAVEN IDE deployed to khawrizm.com                  ║"
echo "║                                                          ║"
echo "║  Users can now:                                          ║"
echo "║    1. Visit https://khawrizm.com                         ║"
echo "║    2. Click 'Install' in browser toolbar                 ║"
echo "║    3. Use HAVEN IDE as a desktop app (offline-capable)   ║"
echo "║                                                          ║"
echo "║  The Sovereign Algorithm lives.                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
