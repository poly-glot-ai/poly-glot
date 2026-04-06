#!/bin/zsh
# vsix-watcher.sh — watches for new .vsix builds and copies latest to Desktop
# Runs as a LaunchAgent — starts on login, restarts on crash
#
# Behaviour:
#   1. Every 30s: git pull (fast-forward only) so CI-built .vsix files land locally
#   2. If a new .vsix appears in vscode-extension/ → copy to Desktop, remove old ones
#   3. Show a macOS notification with the version

VSIX_DIR="$HOME/poly-glot/vscode-extension"
REPO_DIR="$HOME/poly-glot"
DESKTOP="$HOME/Desktop"
LAST_FILE=""

while true; do
  # ── Auto-pull from origin so CI-committed .vsix files arrive locally ──────
  git -C "$REPO_DIR" pull --ff-only --quiet 2>/dev/null || true

  # ── Find the newest .vsix in the extension directory ──────────────────────
  LATEST=$(ls -t "$VSIX_DIR"/*.vsix 2>/dev/null | head -1)

  if [[ -n "$LATEST" && "$LATEST" != "$LAST_FILE" ]]; then
    FILENAME=$(basename "$LATEST")
    VERSION=$(echo "$FILENAME" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')

    # Copy to Desktop (overwrite if same name)
    cp "$LATEST" "$DESKTOP/$FILENAME"

    # Remove old poly-glot .vsix files from Desktop (keep only the latest)
    ls "$DESKTOP"/poly-glot-*.vsix 2>/dev/null | grep -v "$FILENAME" | xargs rm -f 2>/dev/null

    # macOS notification
    osascript -e "display notification \"poly-glot-${VERSION}.vsix → Desktop\" with title \"✅ VS Code Extension Ready\" sound name \"Glass\""

    LAST_FILE="$LATEST"
  fi

  # Poll every 30 seconds (git pull + file check)
  sleep 30
done
