#!/bin/zsh
# setup-vsce-pat.sh — one-time VSCE PAT setup
#
# This script:
#   1. Prompts for your VSCE PAT (or reads from clipboard)
#   2. Saves it to macOS keychain (so publish-vscode.sh never asks again)
#   3. Uploads it to GitHub Actions secrets (so CI auto-publishes forever)
#   4. Immediately publishes poly-glot-1.4.47.vsix to the Marketplace
#
# Get your VSCE PAT:
#   1. Go to https://dev.azure.com
#   2. Profile icon → Personal Access Tokens → New Token
#   3. Name: poly-glot-vsce | Org: All accessible | Expiry: 1 year
#   4. Scopes: Custom → Marketplace → Manage
#   5. Create → Copy token → run this script

set -euo pipefail

REPO="poly-glot-ai/poly-glot"
KEYCHAIN_SERVICE="poly-glot-vsce-pat"
KEYCHAIN_ACCOUNT="vsce"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT_DIR="$REPO_ROOT/vscode-extension"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║        Poly-Glot VS Code Extension — PAT Setup           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "This sets your VSCE PAT once → saves to keychain + GitHub secrets."
echo "After this, every version bump auto-publishes to the Marketplace."
echo ""
echo "Don't have a PAT yet?"
echo "  → https://dev.azure.com → Personal Access Tokens → New Token"
echo "  → Scope: Marketplace → Manage"
echo ""

# ─── Try clipboard first ─────────────────────────────────────────────────────
CLIPBOARD=$(pbpaste 2>/dev/null || true)
PAT=""

if [[ -n "$CLIPBOARD" && "$CLIPBOARD" =~ ^[a-zA-Z0-9]{52}$ ]]; then
  echo "📋 Detected a token in your clipboard."
  read -rk1 "USE_CLIP?   Use clipboard value? [Y/n]: "
  echo ""
  if [[ "$USE_CLIP" == "y" || "$USE_CLIP" == "Y" || "$USE_CLIP" == $'\n' || -z "$USE_CLIP" ]]; then
    PAT="$CLIPBOARD"
    echo "✅ Using clipboard PAT."
  fi
fi

# ─── Prompt if not using clipboard ───────────────────────────────────────────
if [[ -z "$PAT" ]]; then
  read -rs "PAT?Paste your VSCE PAT and press Enter: "
  echo ""
fi

if [[ -z "$PAT" ]]; then
  echo "❌ No PAT provided. Aborting."
  exit 1
fi

echo ""
echo "── Step 1/3: Saving to macOS keychain..."
security add-generic-password \
  -U -s "$KEYCHAIN_SERVICE" -a "$KEYCHAIN_ACCOUNT" -w "$PAT" 2>/dev/null \
  && echo "   ✅ Saved to keychain (service: $KEYCHAIN_SERVICE)" \
  || echo "   ⚠️  Keychain save failed — continuing anyway"

echo ""
echo "── Step 2/3: Uploading to GitHub Actions secrets..."

# Get repo public key for encryption
KEY_JSON=$(gh api "repos/${REPO}/actions/secrets/public-key")
KEY_ID=$(echo "$KEY_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['key_id'])")
PUB_KEY=$(echo "$KEY_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['key'])")

# Encrypt PAT with repo public key using libsodium (via Python)
ENCRYPTED=$(python3 - <<PYEOF
import base64, sys
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PublicKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

try:
    from nacl import encoding, public
    pub_key_bytes = base64.b64decode("$PUB_KEY")
    sealed = public.SealedBox(public.PublicKey(pub_key_bytes))
    encrypted = sealed.encrypt("$PAT".encode())
    print(base64.b64encode(encrypted).decode())
except ImportError:
    # nacl not available — use gh secret set instead
    print("USE_GH_CLI")
PYEOF
)

if [[ "$ENCRYPTED" == "USE_GH_CLI" ]]; then
  # Fallback: use gh secret set directly
  echo "$PAT" | gh secret set VSCE_PAT -R "$REPO" --body -
  echo "   ✅ VSCE_PAT set via gh CLI"
else
  # Upload via API
  gh api -X PUT "repos/${REPO}/actions/secrets/VSCE_PAT" \
    -f "encrypted_value=$ENCRYPTED" \
    -f "key_id=$KEY_ID" 2>&1 \
    && echo "   ✅ VSCE_PAT uploaded to GitHub Actions secrets" \
    || { echo "   Falling back to gh secret set..."; echo "$PAT" | gh secret set VSCE_PAT -R "$REPO" --body -; echo "   ✅ VSCE_PAT set via gh CLI"; }
fi

echo ""
echo "── Step 3/3: Publishing poly-glot v$(node -p "require('$EXT_DIR/package.json').version") to Marketplace..."

VERSION=$(node -p "require('$EXT_DIR/package.json').version")
VSIX_DESKTOP="$HOME/Desktop/poly-glot-${VERSION}.vsix"
VSIX_LOCAL="$EXT_DIR/poly-glot-${VERSION}.vsix"

if [[ -f "$VSIX_DESKTOP" ]]; then
  VSIX="$VSIX_DESKTOP"
elif [[ -f "$VSIX_LOCAL" ]]; then
  VSIX="$VSIX_LOCAL"
else
  echo "   Building .vsix for v${VERSION}..."
  cd "$EXT_DIR"
  npm run compile 2>&1 | tail -3
  vsce package --no-dependencies --out "poly-glot-${VERSION}.vsix"
  VSIX="$EXT_DIR/poly-glot-${VERSION}.vsix"
  cp "$VSIX" "$HOME/Desktop/"
fi

echo "   VSIX: $VSIX"
VSCE_PAT="$PAT" vsce publish --no-dependencies --packagePath "$VSIX"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ COMPLETE                                              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  • poly-glot v${VERSION} is LIVE on VS Code Marketplace"
echo "  • VSCE_PAT saved to macOS keychain"  
echo "  • VSCE_PAT saved to GitHub Actions secrets"
echo "  • Future version bumps will auto-publish via CI"
echo ""
echo "  Marketplace: https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot"
echo ""

osascript -e "display notification \"v${VERSION} is LIVE on VS Code Marketplace\" with title \"✅ Poly-Glot Published\" sound name \"Glass\"" 2>/dev/null || true
