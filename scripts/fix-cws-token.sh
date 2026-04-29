#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# fix-cws-token.sh — Regenerate CWS OAuth refresh token + push to Wrangler
# Run: bash scripts/fix-cws-token.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

ACCOUNT_ID="2cabfc7790be3c1b60b990b6dec400a3"
WORKER_NAME="poly-glot-auth"

echo ""
echo "🦜 Poly-Glot CWS Token Regenerator"
echo "════════════════════════════════════"
echo ""

# ── Step 1: CF API Token ──────────────────────────────────────────────────────
echo "STEP 1 of 5 — Cloudflare API Token"
echo "  Get one at: https://dash.cloudflare.com/profile/api-tokens"
echo "  (Use 'Edit Cloudflare Workers' template)"
echo ""
read -p "  Paste your CF_API_TOKEN: " CF_TOKEN
echo ""
export CLOUDFLARE_API_TOKEN="$CF_TOKEN"
export CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID"

# ── Step 2: Get CWS_CLIENT_ID from worker secrets list ───────────────────────
echo "STEP 2 of 5 — Reading secrets from worker..."
SECRETS=$(npx wrangler secret list --name "$WORKER_NAME" 2>/dev/null || echo "")
echo "  Secrets found on worker:"
echo "$SECRETS" | grep -o '"name":"[^"]*"' | sed 's/"name":"//;s/"//' | sed 's/^/    • /'
echo ""

# ── Step 3: Get CWS_CLIENT_ID ────────────────────────────────────────────────
echo "STEP 3 of 5 — CWS OAuth Credentials"
echo "  Find CWS_CLIENT_ID at: https://console.cloud.google.com/apis/credentials"
echo "  (OAuth 2.0 Client IDs → your Chrome Web Store client)"
echo ""
read -p "  Paste CWS_CLIENT_ID: " CWS_CLIENT_ID
read -p "  Paste CWS_CLIENT_SECRET: " CWS_CLIENT_SECRET
echo ""

# ── Step 4: Open browser for OAuth consent ───────────────────────────────────
OAUTH_URL="https://accounts.google.com/o/oauth2/auth?client_id=${CWS_CLIENT_ID}&redirect_uri=http://localhost&response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&access_type=offline&prompt=consent"

echo "STEP 4 of 5 — Get Authorization Code"
echo "  Opening browser for Google OAuth consent..."
echo ""
echo "  URL: $OAUTH_URL"
echo ""
open "$OAUTH_URL" 2>/dev/null || echo "  (Open the URL above manually if browser didn't open)"
echo ""
echo "  After you click 'Allow', browser will redirect to http://localhost/?code=XXXX"
echo "  It will show an error page — THAT IS FINE. Copy the 'code=' value from the URL."
echo ""
read -p "  Paste the code= value here: " AUTH_CODE
echo ""

# ── Step 5: Exchange code for refresh token ───────────────────────────────────
echo "STEP 5 of 5 — Exchanging code for refresh token..."
RESPONSE=$(curl -s -X POST https://oauth2.googleapis.com/token \
  -d "client_id=${CWS_CLIENT_ID}" \
  -d "client_secret=${CWS_CLIENT_SECRET}" \
  -d "code=${AUTH_CODE}" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=http://localhost")

echo "  Google response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

REFRESH_TOKEN=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('refresh_token',''))" 2>/dev/null)

if [ -z "$REFRESH_TOKEN" ]; then
  echo "❌ No refresh_token in response! Check your CLIENT_ID, SECRET, and CODE."
  exit 1
fi

echo "✅ Got refresh_token!"
echo ""

# ── Push to Wrangler ──────────────────────────────────────────────────────────
echo "  Pushing CWS_REFRESH_TOKEN to Cloudflare Worker..."
echo "$REFRESH_TOKEN" | npx wrangler secret put CWS_REFRESH_TOKEN --name "$WORKER_NAME"

echo ""
echo "════════════════════════════════════"
echo "✅ ALL DONE! CWS_REFRESH_TOKEN updated."
echo "   Dashboard Chrome install count will show live data within ~60 seconds."
echo "════════════════════════════════════"
echo ""

# ── Verify ────────────────────────────────────────────────────────────────────
echo "🔍 Verifying cws-proxy endpoint..."
sleep 3
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://poly-glot.ai/api/auth/cws-proxy")
BODY=$(curl -s "https://poly-glot.ai/api/auth/cws-proxy")
echo "  HTTP Status: $STATUS"
echo "  Response: $BODY"
echo ""
if [ "$STATUS" = "200" ] && echo "$BODY" | grep -q '"installs":[0-9]'; then
  echo "🎉 CWS proxy is LIVE and returning install count!"
else
  echo "⚠️  Still returning cached/error. Wait 60s and check dashboard."
fi
