#!/bin/zsh
# publish-vscode.sh — publish the VS Code extension to the Marketplace
#
# Usage:
#   ./scripts/publish-vscode.sh                 # uses cached PAT from keychain
#   ./scripts/publish-vscode.sh --pat YOUR_PAT  # uses supplied PAT + caches it
#
# On first run it will prompt for your VSCE PAT if not cached.
# Get a PAT at: https://dev.azure.com → User Settings → Personal Access Tokens
# Required scope: Marketplace → Manage

set -euo pipefail

KEYCHAIN_SERVICE="poly-glot-vsce-pat"
KEYCHAIN_ACCOUNT="vsce"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT_DIR="$REPO_ROOT/vscode-extension"

# ─── Resolve PAT ─────────────────────────────────────────────────────────────

PAT=""

# Check for --pat flag
if [[ "${1:-}" == "--pat" && -n "${2:-}" ]]; then
  PAT="$2"
  echo "💾 Saving PAT to macOS keychain (service: $KEYCHAIN_SERVICE)..."
  security add-generic-password \
    -U -s "$KEYCHAIN_SERVICE" -a "$KEYCHAIN_ACCOUNT" -w "$PAT" 2>/dev/null \
    && echo "✅ PAT saved." || echo "⚠️  Could not save to keychain — will use for this session only."
fi

# Try keychain if no --pat flag
if [[ -z "$PAT" ]]; then
  PAT=$(security find-generic-password -s "$KEYCHAIN_SERVICE" -a "$KEYCHAIN_ACCOUNT" -w 2>/dev/null || true)
fi

# Prompt if still empty
if [[ -z "$PAT" ]]; then
  echo ""
  echo "🔑 VSCE PAT not found in keychain."
  echo "   Get one at: https://dev.azure.com → User Settings → Personal Access Tokens"
  echo "   Required scope: Marketplace → Manage"
  echo ""
  read -rs "PAT?Paste your VSCE PAT and press Enter: "
  echo ""
  if [[ -z "$PAT" ]]; then
    echo "❌ No PAT provided. Aborting."
    exit 1
  fi
  echo "💾 Saving PAT to macOS keychain..."
  security add-generic-password \
    -U -s "$KEYCHAIN_SERVICE" -a "$KEYCHAIN_ACCOUNT" -w "$PAT" 2>/dev/null \
    && echo "✅ PAT saved — future runs won't ask again." \
    || echo "⚠️  Could not save to keychain."
fi

# ─── Resolve vsix path ───────────────────────────────────────────────────────

VERSION=$(node -p "require('$EXT_DIR/package.json').version")
VSIX_DESKTOP="$HOME/Desktop/poly-glot-${VERSION}.vsix"
VSIX_LOCAL="$EXT_DIR/poly-glot-${VERSION}.vsix"

if [[ -f "$VSIX_DESKTOP" ]]; then
  VSIX="$VSIX_DESKTOP"
elif [[ -f "$VSIX_LOCAL" ]]; then
  VSIX="$VSIX_LOCAL"
else
  echo "⚠️  No pre-built .vsix found for v${VERSION} — building now..."
  cd "$EXT_DIR"
  npm run compile 2>&1 | tail -5
  vsce package --no-dependencies --out "poly-glot-${VERSION}.vsix"
  VSIX="$EXT_DIR/poly-glot-${VERSION}.vsix"
  cp "$VSIX" "$HOME/Desktop/"
  echo "✅ Built and copied to Desktop."
fi

echo ""
echo "📦 Publishing poly-glot-${VERSION}.vsix to VS Code Marketplace..."
echo "   VSIX: $VSIX"
echo ""

# ─── Publish ─────────────────────────────────────────────────────────────────

VSCE_PAT="$PAT" vsce publish \
  --no-dependencies \
  --packagePath "$VSIX"

echo ""
echo "✅ Published poly-glot v${VERSION} to VS Code Marketplace!"
echo "   View at: https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot"
echo ""

# ─── Notify ──────────────────────────────────────────────────────────────────

osascript -e "display notification \"v${VERSION} published to VS Code Marketplace\" with title \"✅ Poly-Glot Published\" sound name \"Glass\"" 2>/dev/null || true
