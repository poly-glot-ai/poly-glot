# 🦜 Poly-Glot AI — AI Code Documentation Platform

> **AI-powered code documentation for 12 languages — Web, VS Code, CLI, MCP, and GitHub App.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-poly--glot.ai-blue?style=for-the-badge)](https://poly-glot.ai/)
[![VS Code](https://img.shields.io/badge/VS_Code-Extension-007ACC?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)
[![npm CLI](https://img.shields.io/badge/npm-poly--glot--ai--cli-CB3837?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/poly-glot-ai-cli)
[![MCP](https://img.shields.io/badge/npm-poly--glot--mcp-CB3837?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/poly-glot-mcp)
[![GitHub App](https://img.shields.io/badge/GitHub_App-poly--glot--ai-181717?style=for-the-badge&logo=github)](https://github.com/apps/poly-glot-ai)

---

## What is Poly-Glot AI?

Poly-Glot AI transforms undocumented code into professionally commented code — instantly.

- **12 programming languages** — JS, TS, Python, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin
- **Three comment modes** — doc-comments (JSDoc/PyDoc/Javadoc…), why-comments (reasoning & intent), or both in one pass
- **Bring your own API key** — OpenAI, Anthropic, and Google Gemini supported; your key never leaves your machine
- **Available everywhere** — Web · VS Code · CLI · MCP · GitHub Copilot Chat · GitHub App

---

## 🛠️ Available Tools

| Tool | Description | Install |
|------|-------------|---------|
| 🌐 **Web App** | Paste code, get documented code back | [poly-glot.ai →](https://poly-glot.ai) |
| 💻 **VS Code Extension** | `Cmd+Shift+/` to comment inline | [Marketplace →](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot) |
| ⌨️ **CLI** | Comment files & directories from terminal | `npm install -g poly-glot-ai-cli` |
| 🔌 **MCP Server** | Use Poly-Glot from Claude, Goose, Cursor, Windsurf | `npx poly-glot-mcp` (**Pro+ only**) |
| 🐙 **GitHub App** | Auto-documents every PR with inline review comments | [github.com/apps/poly-glot-ai →](https://github.com/apps/poly-glot-ai) |
| 🤖 **Copilot Chat** | `@poly-glot /comment` inside VS Code | Included with VS Code extension |

---

## 💰 Pricing

| Feature | Free | 💎 Pro ($9/mo) | 👥 Team ($29/mo) | 🏢 Enterprise |
|---------|:----:|:--------------:|:----------------:|:-------------:|
| Web UI generator | ✅ | ✅ | ✅ | ✅ |
| JS, TS, Python, Java | ✅ | ✅ | ✅ | ✅ |
| All 12 languages | 🔒 | ✅ | ✅ | ✅ |
| Why-Comments & Both mode | 🔒 | ✅ | ✅ | ✅ |
| CLI tool | ✅ 50 files/mo | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| VS Code Extension | ✅ 50 files/mo | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| **MCP Server** | 🔒 | ✅ 200 calls/mo | ✅ 1,000 calls/mo | ✅ Unlimited |
| GitHub App | ✅ | ✅ | ✅ | ✅ |
| Seats | 1 | 1 | 5 | Custom |
| Support | Community | Email | Priority | Dedicated |

> 🎁 Use code **`EARLYBIRD3`** at Pro checkout to lock $9/mo forever (expires May 1, 2026).

---

## 🔐 Authentication & Plans

Every surface requires a free account or higher plan:

- **Web UI** — sign in required before any generation
- **CLI v1.9.0+** — `poly-glot login` required; server-side quota enforced
- **VS Code Extension v1.4.40+** — device fingerprint + session token enforced
- **MCP Server** — `POLYGLOT_SESSION_TOKEN` required; **Pro, Team, or Enterprise only**
- **GitHub App** — API key required in `.polyglot.yml`

> Old CLI versions (v1.0–v1.6) are deprecated on npm and blocked from all server endpoints.

---

## 🚀 Quick Start

### Web
Go to [poly-glot.ai](https://poly-glot.ai), sign up free, paste code → get docs.

### VS Code
```bash
# Install from Marketplace
code --install-extension poly-glot-ai.poly-glot
```
Then `Cmd+Shift+/` (Mac) or `Ctrl+Shift+/` (Windows/Linux) to generate comments.

### CLI
```bash
npm install -g poly-glot-ai-cli
poly-glot login                          # create free account
poly-glot config --provider openai       # set your API key
poly-glot comment src/auth.js            # comment a file
poly-glot comment --dir src/ --yes       # comment entire directory
```

### MCP (Pro+ only)
```bash
# Add POLYGLOT_SESSION_TOKEN from your poly-glot.ai account dashboard
# Then add to your MCP client config:
npx poly-glot-mcp
```

---

## ⌨️ CLI Full Reference

```bash
# Account
poly-glot login                                      # sign in / create free account
poly-glot config                                     # interactive setup
poly-glot config --key sk-... --provider openai      # OpenAI
poly-glot config --key sk-ant-... --provider anthropic # Anthropic
poly-glot config --key AIza... --provider google     # Google Gemini
poly-glot config --token <session-token>             # activate Pro

# Single file
poly-glot comment src/auth.js                        # doc-comments
poly-glot comment src/auth.js --dry-run              # preview without writing
poly-glot comment src/auth.js --diff                 # show unified diff
poly-glot comment src/auth.js --backup               # write + save .orig backup
poly-glot comment src/auth.js --why                  # why-comments (Pro)
poly-glot comment src/auth.js --both                 # doc + why (Pro)

# Directory
poly-glot comment --dir src/ --yes                   # comment entire directory
poly-glot comment --dir src/ --dry-run               # preview all files
poly-glot comment --dir src/ --output-dir src-out/   # preserve originals

# Analysis (Pro)
poly-glot bugs src/auth.js                           # find bugs & edge cases
poly-glot refactor src/utils.ts                      # before/after refactor diffs
poly-glot test src/auth.js                           # generate unit tests
poly-glot explain src/utils.ts                       # deep code analysis
```

### Environment variables (CI/CD)

```bash
POLYGLOT_API_KEY=sk-proj-...
POLYGLOT_PROVIDER=openai               # openai | anthropic | google
POLYGLOT_MODEL=gpt-4.1-mini
POLYGLOT_MODE=both                     # comment | why | both
POLYGLOT_LICENSE_TOKEN=<session-token> # Pro license token — skips login in CI
```

### GitHub Actions

```yaml
- name: Document code with Poly-Glot
  env:
    POLYGLOT_API_KEY: ${{ secrets.POLYGLOT_API_KEY }}
    POLYGLOT_PROVIDER: openai
    POLYGLOT_MODEL: gpt-4.1-mini
    POLYGLOT_LICENSE_TOKEN: ${{ secrets.POLYGLOT_LICENSE_TOKEN }}
  run: |
    npm install -g poly-glot-ai-cli
    poly-glot comment --dir src/ --output-dir src-commented/ --yes
```

---

## 🔌 MCP Server (Pro+ only)

The MCP server lets Claude Desktop, Goose, Cursor, Windsurf, and any MCP-compatible client call Poly-Glot directly.

**Requires:** Pro, Team, or Enterprise plan + `POLYGLOT_SESSION_TOKEN`

```json
{
  "mcpServers": {
    "poly-glot": {
      "command": "npx",
      "args": ["-y", "poly-glot-mcp"],
      "env": {
        "POLYGLOT_PROVIDER": "openai",
        "POLYGLOT_API_KEY": "sk-your-key-here",
        "POLYGLOT_MODEL": "gpt-4.1-mini",
        "POLYGLOT_SESSION_TOKEN": "your-session-token-from-poly-glot.ai"
      }
    }
  }
}
```

| Plan | MCP calls/month |
|------|----------------|
| Free | 🔒 Not available |
| Pro | 200 |
| Team | 1,000 |
| Enterprise | Unlimited |

---

## 🔒 Privacy & Security

- **Your code never touches Poly-Glot servers** — all AI calls go directly from your machine to OpenAI, Anthropic, or Google
- **API keys stored locally** — in `~/.config/polyglot/config.json` (CLI) or VS Code SecretStorage, never sent to us
- **Session tokens** — server-verified, 30-day TTL, stored in KV
- **GitHub App** — reads only changed PR files, never stores code
- **Zero telemetry by default** — opt in with `poly-glot config --telemetry`

---

## 🏗️ Repo Structure

```
poly-glot/
├── index.html              # Main website (poly-glot.ai)
├── dashboard/              # Admin health dashboard (/dashboard)
├── cli/                    # CLI source (poly-glot-ai-cli on npm)
├── poly-glot-mcp/          # MCP server source (poly-glot-mcp on npm)
├── vscode-extension/       # VS Code extension source
├── auth-worker/            # Cloudflare Worker — auth + usage (source copy)
├── telemetry-worker/       # Cloudflare Worker — CLI telemetry
├── team-dashboard/         # Team analytics dashboard
└── .github/workflows/      # CI/CD — publish CLI, MCP, VS Code, purge cache
```

---

## 📬 Enterprise & Contact

For enterprise plans, custom deployments, SSO, or volume pricing:

📧 **[hwmoses2@icloud.com](mailto:hwmoses2@icloud.com)**
🌐 **[poly-glot.ai](https://poly-glot.ai)**

---

## License

MIT © Poly-Glot AI

---

> ⭐ If Poly-Glot saves you time, a star helps other developers find it. Found a bug? [Open an issue →](https://github.com/poly-glot-ai/poly-glot/issues)
