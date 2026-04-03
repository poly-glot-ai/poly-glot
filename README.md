# 🦜 Poly-Glot AI — AI Code Documentation Platform

> **AI-powered code documentation for 12 languages — web, VS Code, CLI, MCP, and GitHub App.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-poly--glot.ai-blue?style=for-the-badge)](https://poly-glot.ai/)
[![VS Code](https://img.shields.io/badge/VS_Code-Extension-007ACC?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)
[![npm CLI](https://img.shields.io/badge/npm-poly--glot--ai--cli-CB3837?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/poly-glot-ai-cli)
[![GitHub App](https://img.shields.io/badge/GitHub_App-poly--glot--ai-181717?style=for-the-badge&logo=github)](https://github.com/apps/poly-glot-ai)

> Thanks for being one of our **1,200+ early CLI users**. The full platform is now open for subscriptions.
>
> 🎁 **Early bird offer** — use code **EARLYBIRD3** at checkout for **3 months completely free** on any paid plan.
> ⚡ Limited to the first 50 subscribers — [grab it now →](https://poly-glot.ai/#pg-pricing-section)

---

## What is Poly-Glot AI?

Poly-Glot AI transforms undocumented code into professionally commented code — instantly.

- **12 programming languages** — JS, TS, Python, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin
- **Three comment modes** — doc-comments (JSDoc/PyDoc/Javadoc…), why-comments (reasoning & intent), or both in one pass
- **Bring your own API key** — OpenAI and Anthropic supported; your key never leaves your machine
- **Available everywhere** — Web · VS Code · CLI · MCP · GitHub Copilot Chat · GitHub App

---

## 🛠️ Available Tools

| Tool | Description | Install |
|------|-------------|---------|
| 🌐 **Web App** | Paste code, get documented code back | [poly-glot.ai →](https://poly-glot.ai) |
| 💻 **VS Code Extension** | `Cmd+Shift+/` to comment inline | [Marketplace →](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot) |
| ⌨️ **CLI** | Comment files & directories from terminal | `npm install -g poly-glot-ai-cli` |
| 🔌 **MCP Server** | Use `@poly-glot` in Claude, Goose, Cursor | `npx poly-glot-mcp` |
| 🐙 **GitHub App** | Auto-documents every PR with inline review comments | [github.com/apps/poly-glot-ai →](https://github.com/apps/poly-glot-ai) |
| 🤖 **Copilot Chat** | `@poly-glot /comment` inside VS Code | Included with VS Code extension |

---

## 💰 Pricing

| Feature | Free | 💎 Pro | 👥 Team | 🏢 Enterprise |
|---------|------|--------|---------|---------------|
| Generate doc-comments (JSDoc, Javadoc, PyDoc…) | ✅ | ✅ | ✅ | ✅ |
| Explain Code — deep AI analysis panel | ✅ | ✅ | ✅ | ✅ |
| JavaScript, TypeScript, Python, Java | ✅ | ✅ | ✅ | ✅ |
| C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin | 🔒 | ✅ | ✅ | ✅ |
| Why-Comments — intent & trade-off inline notes | 🔒 | ✅ | ✅ | ✅ |
| Both Mode — doc + why comments in one pass | 🔒 | ✅ | ✅ | ✅ |
| Templates Sidebar | ✅ | ✅ | ✅ | ✅ |
| Real-time cost tracking in status bar | ✅ | ✅ | ✅ | ✅ |
| GitHub App — auto-document PRs | ✅ | ✅ | ✅ | ✅ |
| Files generated per month | 50 | Unlimited | Unlimited | Unlimited |
| Seats | 1 | 1 | 5 | Custom |
| Team analytics dashboard | ❌ | ❌ | ✅ | ✅ |
| SSO / SAML | ❌ | ❌ | ❌ | ✅ |
| Custom model / private deployment | ❌ | ❌ | ❌ | ✅ |
| SLA + dedicated support | ❌ | ❌ | ❌ | ✅ |
| Priority support | ❌ | ✅ | ✅ | ✅ |
| **Price** | **$0/mo** | **$9/mo** | **$29/mo** | **Contact us** |
| | [Get started →](https://poly-glot.ai) | [Upgrade →](https://poly-glot.ai/#pg-pricing-section) | [Upgrade →](https://poly-glot.ai/#pg-pricing-section) | [hwmoses2@icloud.com](mailto:hwmoses2@icloud.com) |

> 🎁 Use code **EARLYBIRD3** at checkout — 3 months free on Pro or Team. [See plans →](https://poly-glot.ai/#pg-pricing-section)

---

## 🚀 Quick Start

### Web App
Visit **[poly-glot.ai](https://poly-glot.ai)** — no installation required.

1. Click **⚙️ AI Settings** → paste your OpenAI or Anthropic API key
2. Paste your code into the editor
3. Click **Generate Comments**

### VS Code Extension

```bash
# Search in Extensions (Cmd+Shift+X)
Poly-Glot
```

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+/` | Generate doc-comments |
| `Cmd+Shift+W` | Generate why-comments (Pro) |
| `Cmd+Shift+B` | Both modes in one pass (Pro) |
| `Cmd+Shift+E` | Explain Code — deep analysis |

### CLI

```bash
# Install
npm install -g poly-glot-ai-cli

# Sign in (creates free account, tracks usage server-side)
poly-glot login

# One-time setup — add your API key
poly-glot config

# Comment a single file
poly-glot comment src/auth.js

# Comment an entire directory
poly-glot comment --dir src/ --yes

# Why-comments
poly-glot why src/auth.js

# Both modes in one pass (Pro)
poly-glot both src/auth.js

# Deep analysis
poly-glot explain src/auth.js
poly-glot bugs src/auth.js
poly-glot refactor src/utils.ts
poly-glot test src/auth.js
```

### GitHub App

```bash
# 1. Install at github.com/apps/poly-glot-ai
# 2. Add .polyglot.yml to your repo root:
```

```yaml
# .polyglot.yml
provider: openai
openai_api_key: sk-your-key-here
mode: doc                  # doc | why | both
coverage_threshold: 0.5    # files below 50% get suggestions
max_files: 15
```

```bash
# 3. Open a Pull Request — Poly-Glot AI will:
#    ✅ Analyze every changed file for documentation coverage
#    ✅ Post inline JSDoc/PyDoc/Javadoc suggestions as review comments
#    ✅ Run a GitHub Check showing per-file coverage scores
#    ✅ Include a deep-link to open any file in the web editor
```

### MCP Server

```json
{
  "command": "npx",
  "args": ["-y", "poly-glot-mcp"],
  "env": {
    "POLYGLOT_PROVIDER": "openai",
    "POLYGLOT_API_KEY": "sk-..."
  }
}
```

Works with: Goose · Claude Desktop · Cursor · Windsurf · any MCP client

---

## 📋 Supported Languages

| Language | Doc-comment style | Free | Pro |
|----------|------------------|------|-----|
| JavaScript | JSDoc | ✅ | ✅ |
| TypeScript | TSDoc / JSDoc | ✅ | ✅ |
| Python | Google-style docstrings | ✅ | ✅ |
| Java | Javadoc | ✅ | ✅ |
| C / C++ | Doxygen | 🔒 | ✅ |
| C# | XML doc comments | 🔒 | ✅ |
| Go | GoDoc | 🔒 | ✅ |
| Rust | `///` Rustdoc | 🔒 | ✅ |
| Ruby | YARD | 🔒 | ✅ |
| PHP | PHPDoc | 🔒 | ✅ |
| Swift | Swift Markup | 🔒 | ✅ |
| Kotlin | KDoc | 🔒 | ✅ |

---

## 🤖 Supported AI Models

### OpenAI

| Model | Notes |
|-------|-------|
| `gpt-4.1-mini` ⭐ | **Recommended** — best quality-to-cost ratio |
| `gpt-4.1` | Best GPT-4.1 quality |
| `gpt-4.1-nano` | Fastest & cheapest OpenAI option |
| `gpt-4o` / `gpt-4o-mini` | Great quality, widely supported |
| `o3` / `o3-mini` | Reasoning models |
| `o1` / `o1-mini` | Full reasoning |
| `gpt-4-turbo` / `gpt-4` / `gpt-3.5-turbo` | Legacy |

### Anthropic

| Model | Notes |
|-------|-------|
| `claude-sonnet-4-5` ⭐ | **Recommended** — excellent quality & speed |
| `claude-opus-4-5` | Most powerful Claude |
| `claude-haiku-4-5` | Fastest & cheapest Anthropic |
| `claude-3-5-sonnet-20241022` | Proven quality, previous gen |
| `claude-3-5-haiku-20241022` | Budget Claude |
| `claude-3-opus-20240229` | Deep reasoning |
| `claude-3-haiku-20240307` | Lightest legacy Claude |

> Custom model IDs also supported — pass any valid model ID via `poly-glot config --model <id>`

---

## ⚙️ CLI — Full Reference

```bash
poly-glot login                                     # Sign in / create free account
poly-glot config                                    # Interactive setup
poly-glot config --key sk-... --provider openai     # Non-interactive setup
poly-glot config --token <license-token>            # Activate Pro

poly-glot comment src/auth.js                       # Doc-comment a file
poly-glot comment src/auth.js --dry-run             # Preview without writing
poly-glot comment src/auth.js --diff                # Show unified diff
poly-glot comment src/auth.js --backup              # Write + save .orig backup
poly-glot comment src/auth.js --why                 # Why-comments (Pro)
poly-glot comment src/auth.js --both                # Doc + why (Pro)
poly-glot comment --dir src/ --yes                  # Comment entire directory

poly-glot why src/auth.js                           # Why-comments shorthand (Pro)
poly-glot both src/auth.js                          # Both modes shorthand (Pro)
poly-glot bugs src/auth.js                          # Find bugs & edge cases
poly-glot refactor src/utils.ts                     # Before/after refactor diffs
poly-glot test src/auth.js                          # Generate unit tests
poly-glot explain src/utils.ts                      # Deep code analysis
```

### Environment variables (CI/CD)

```bash
POLYGLOT_API_KEY=sk-proj-...
POLYGLOT_PROVIDER=openai          # openai | anthropic
POLYGLOT_MODEL=gpt-4.1-mini
POLYGLOT_MODE=both                # comment | why | both
POLYGLOT_LICENSE_TOKEN=...        # Pro license token
```

### GitHub Actions example

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

## 🔒 Privacy & Security

- **Your code never touches Poly-Glot servers** — all AI calls go directly from your machine to OpenAI/Anthropic
- **API keys stored locally** — in browser localStorage (web) or `~/.config/polyglot/config.json` (CLI), never sent to us
- **GitHub App** — reads only changed PR files, never stores code, requests minimal permissions (`pull_requests:write`, `checks:write`, `contents:read`)
- **Zero telemetry by default** — opt in with `poly-glot config --telemetry`

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
