#!/bin/zsh
# vsix-watcher.sh — watches for new .vsix builds and copies latest to Desktop
# Runs as a LaunchAgent — starts on login, restarts on crash

VSIX_DIR="$HOME/poly-glot/vscode-extension"
DESKTOP="$HOME/Desktop"
LAST_FILE=""

while true; do
  # Find the newest .vsix in the extension directory
  LATEST=$(ls -t "$VSIX_DIR"/*.vsix 2>/dev/null | head -1)

  if [[ -n "$LATEST" && "$LATEST" != "$LAST_FILE" ]]; then
    FILENAME=$(basename "$LATEST")
    VERSION=$(echo "$FILENAME" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')

    # Copy to Desktop (overwrite previous)
    cp "$LATEST" "$DESKTOP/$FILENAME"

    # Remove old .vsix files from Desktop (keep only latest)
    ls "$DESKTOP"/poly-glot-*.vsix 2>/dev/null | grep -v "$FILENAME" | xargs rm -f 2>/dev/null

    # macOS notification
    osascript -e "display notification \"poly-glot-${VERSION}.vsix copied to Desktop\" with title \"✅ VS Code Extension Built\" sound name \"Glass\""

    LAST_FILE="$LATEST"
  fi

  # Poll every 10 seconds
  sleep 10
done
