# GitHub Actions — Required Secrets

Add these secrets at:
**https://github.com/poly-glot-ai/poly-glot/settings/secrets/actions**

---

## `GH_PAT` — GitHub Personal Access Token
**Required by:** All workflows (checkout, release creation, repo dispatch)

**Scopes needed:**
- `repo` (full)
- `workflow`

**Create at:** https://github.com/settings/tokens?type=beta

---

## `VSCE_PAT` — VS Code Marketplace Personal Access Token
**Required by:** `publish-vscode.yml` → Publish to Marketplace step

**How to create:**
1. Go to https://dev.azure.com
2. Click your profile icon → **Personal Access Tokens**
3. Click **New Token**
4. Set name: `poly-glot-vsce`
5. Set organization: **All accessible organizations**
6. Set expiration: 1 year (max)
7. Under **Scopes** → **Custom defined** → check **Marketplace → Manage**
8. Click **Create** and copy the token
9. Add to GitHub repo secrets as `VSCE_PAT`

**Without this secret:** The Marketplace publish step is skipped (workflow still runs — GitHub Release + CHANGELOG + version bump all complete).

**Local alternative:** Use `./scripts/publish-vscode.sh` — caches PAT in macOS keychain:
```bash
# First time (supply PAT):
./scripts/publish-vscode.sh --pat YOUR_PAT

# Subsequent runs (uses cached keychain PAT):
./scripts/publish-vscode.sh
```

---

## `NPM_TOKEN` — npm Publish Token
**Required by:** `publish-cli.yml` and `publish-mcp.yml`

**Create at:** https://www.npmjs.com/settings/~/tokens → **Generate New Token** → **Automation**

---

## Quick-add all secrets

| Secret | Where to get it |
|--------|----------------|
| `GH_PAT` | https://github.com/settings/tokens?type=beta |
| `VSCE_PAT` | https://dev.azure.com → Personal Access Tokens → Marketplace Manage |
| `NPM_TOKEN` | https://www.npmjs.com/settings/~/tokens → Automation |
