#!/bin/zsh
# vsix-watcher.sh — watches for new .vsix releases and copies latest to Desktop
setopt NULL_GLOB   # prevent "no matches found" errors on empty globs
# Runs as a LaunchAgent — starts on login, restarts on crash
#
# Behaviour:
#   1. Every 60s: check the latest GitHub Release tag for a new version
#   2. If a newer version is found: download the .vsix asset from the release
#   3. Save to vscode-extension/ and copy to Desktop, remove old Desktop .vsix files
#   4. Also watches vscode-extension/ for locally-built .vsix files (publish-vscode.sh)
#   5. Show a macOS notification with the version

VSIX_DIR="$HOME/poly-glot/vscode-extension"
REPO_DIR="$HOME/poly-glot"
DESKTOP="$HOME/Desktop"
GH_REPO="poly-glot-ai/poly-glot"
LAST_VERSION=""
LAST_LOCAL_FILE=""

# ── Read GitHub token (same one used by the repo) ────────────────────────────
GH_TOKEN=""
if [[ -f "$HOME/.poly-glot-github-token" ]]; then
  GH_TOKEN=$(cat "$HOME/.poly-glot-github-token" | tr -d '[:space:]')
fi

copy_to_desktop() {
  local src="$1"
  local filename=$(basename "$src")
  local version=$(echo "$filename" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')

  cp "$src" "$DESKTOP/$filename"

  # Remove old poly-glot .vsix files from Desktop (keep only this one)
  for f in "$DESKTOP"/poly-glot-*.vsix; do
    [[ -f "$f" && "$(basename $f)" != "$filename" ]] && rm -f "$f"
  done

  osascript -e "display notification \"poly-glot-${version}.vsix → Desktop\" with title \"✅ VS Code Extension Ready\" sound name \"Glass\"" 2>/dev/null || true
}

while true; do
  # ── Check GitHub Releases for a new version ──────────────────────────────
  if [[ -n "$GH_TOKEN" ]]; then
    RELEASE_JSON=$(curl -sf \
      -H "Authorization: Bearer $GH_TOKEN" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/${GH_REPO}/releases" 2>/dev/null | \
      python3 -c "
import sys, json
releases = json.load(sys.stdin)
# Find latest vscode-vX.Y.Z release
for r in releases:
    if r['tag_name'].startswith('vscode-v'):
        vsix_assets = [a for a in r.get('assets', []) if a['name'].endswith('.vsix')]
        if vsix_assets:
            a = vsix_assets[0]
            print(r['tag_name'].replace('vscode-v','') + '|' + a['browser_download_url'] + '|' + a['name'])
            break
" 2>/dev/null)

    if [[ -n "$RELEASE_JSON" ]]; then
      RELEASE_VERSION=$(echo "$RELEASE_JSON" | cut -d'|' -f1)
      DOWNLOAD_URL=$(echo "$RELEASE_JSON"   | cut -d'|' -f2)
      ASSET_NAME=$(echo "$RELEASE_JSON"     | cut -d'|' -f3)

      if [[ -n "$RELEASE_VERSION" && "$RELEASE_VERSION" != "$LAST_VERSION" ]]; then
        DEST="$VSIX_DIR/$ASSET_NAME"
        if [[ ! -f "$DEST" ]]; then
          # Download the .vsix from the GitHub Release
          curl -sfL \
            -H "Authorization: Bearer $GH_TOKEN" \
            -H "Accept: application/octet-stream" \
            "$DOWNLOAD_URL" \
            -o "$DEST" 2>/dev/null
        fi
        if [[ -f "$DEST" ]]; then
          copy_to_desktop "$DEST"
          LAST_VERSION="$RELEASE_VERSION"
          LAST_LOCAL_FILE="$DEST"
        fi
      fi
    fi
  fi

  # ── Also watch for locally-built .vsix files (publish-vscode.sh builds) ──
  LOCAL_LATEST=$(ls -t "$VSIX_DIR"/*.vsix 2>/dev/null | head -1)
  if [[ -n "$LOCAL_LATEST" && "$LOCAL_LATEST" != "$LAST_LOCAL_FILE" ]]; then
    copy_to_desktop "$LOCAL_LATEST"
    LAST_LOCAL_FILE="$LOCAL_LATEST"
    LOCAL_VERSION=$(basename "$LOCAL_LATEST" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
    LAST_VERSION="$LOCAL_VERSION"
  fi

  sleep 60
done
