# ⌨️ poly-glot-ai-cli

> AI-powered code documentation for 12 languages — generate JSDoc, Javadoc, PyDoc, Doxygen, KDoc, rustdoc, GoDoc and "why" comments from your terminal.

[![npm version](https://img.shields.io/npm/v/poly-glot-ai-cli?color=CB3837&logo=npm&style=flat-square)](https://www.npmjs.com/package/poly-glot-ai-cli)
[![npm downloads](https://img.shields.io/npm/dm/poly-glot-ai-cli?color=CB3837&logo=npm&style=flat-square)](https://www.npmjs.com/package/poly-glot-ai-cli)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green?style=flat-square)](LICENSE)

---

## Install

```bash
npm install -g poly-glot-ai-cli
```

Requires Node.js 18+.

---

## Quick Start

```bash
poly-glot login                           # create free account (required)
poly-glot config --provider openai        # set your API key interactively
poly-glot comment src/auth.js             # add doc-comments to a file
poly-glot comment --dir src/ --yes        # comment entire directory
```

---

## Plans & Limits

Every user must sign in. Limits are enforced server-side.

| Plan | Files/month | Languages | Features | Price |
|------|:-----------:|-----------|----------|-------|
| **Free** | 50 | JS, TS, Python, Java | Doc-comments, Web UI, CLI | $0 |
| **Pro** | Unlimited | All 12 | Why-comments, Both mode, MCP (200 calls/mo) | $9/mo |
| **Team** | Unlimited | All 12 | Everything Pro + MCP (1,000 calls/mo), 5 seats | $29/mo |
| **Enterprise** | Unlimited | All 12 | Custom seats, SSO, dedicated support | Custom |

> 🎁 Use code **`EARLYBIRD3`** at Pro checkout to lock $9/mo forever (expires May 1, 2026).
> [Upgrade at poly-glot.ai →](https://poly-glot.ai/#pg-pricing-section)

---

## Commands

```bash
# Account
poly-glot login                           # sign in / create free account
poly-glot config                          # interactive setup wizard

# Single file
poly-glot comment <file>                  # add doc-comments
poly-glot comment <file> --dry-run        # preview without writing
poly-glot comment <file> --diff           # show unified diff before writing
poly-glot comment <file> --backup         # write + save .orig backup
poly-glot comment <file> --why            # why-comments (Pro)
poly-glot comment <file> --both           # doc + why in one pass (Pro)
poly-glot why <file>                      # shorthand: why-comments only (Pro)
poly-glot both <file>                     # shorthand: both modes (Pro)

# Directory
poly-glot comment --dir <dir>             # comment all supported files
poly-glot comment --dir <dir> --yes       # skip confirmation prompt
poly-glot comment --dir <dir> --dry-run   # preview all files, no writes
poly-glot comment --dir <dir> --diff      # show diffs for every file
poly-glot comment --dir <dir> --backup    # write + .orig backups
poly-glot comment --dir <dir> --output-dir <out>  # preserve originals

# stdin / stdout
cat main.py | poly-glot comment --stdin --lang python
cat main.py | poly-glot comment --stdin --lang python --why

# Analysis (Pro)
poly-glot bugs <file>                     # find bugs & edge cases
poly-glot refactor <file>                 # before/after refactor diffs
poly-glot test <file>                     # generate unit tests
poly-glot explain <file>                  # deep code analysis

# Config flags
poly-glot config --key <key>              # set API key non-interactively
poly-glot config --provider <name>        # openai | anthropic | google
poly-glot config --model <id>             # override model
poly-glot config --mode <m>               # comment | why | both
poly-glot config --token <token>          # set session token (Pro)
poly-glot --version                       # print version
```

---

## Supported Languages

| Language | Comment Style |
|----------|--------------|
| JavaScript | JSDoc |
| TypeScript | TSDoc |
| Python | Google-style docstrings |
| Java | Javadoc |
| C++ | Doxygen |
| C | Doxygen |
| C# | XML doc comments |
| Go | GoDoc |
| Rust | rustdoc |
| Ruby | YARD |
| PHP | PHPDoc |
| Swift | Swift markup |
| Kotlin | KDoc |
| SQL | Header blocks |

Free plan: JS, TS, Python, Java only. All 12 on Pro+.

---

## Supported Models

### OpenAI
| Model | Notes |
|-------|-------|
| `gpt-4.1-mini` ⭐ | **Recommended** — best quality-to-cost |
| `gpt-4.1` | Best GPT-4.1 quality |
| `gpt-4.1-nano` | Fastest & cheapest |
| `gpt-4o` | Great quality, widely supported |
| `o3` | Most powerful reasoning |

### Anthropic
| Model | Notes |
|-------|-------|
| `claude-sonnet-4-5` ⭐ | **Recommended** — excellent quality & speed |
| `claude-opus-4-5` | Most powerful Claude |
| `claude-haiku-4-5` | Fastest & cheapest |

### Google
| Model | Notes |
|-------|-------|
| `gemini-2.5-flash` ⭐ | **Recommended** — fast, accurate, low cost |
| `gemini-2.5-pro` | Most powerful Gemini |
| `gemini-2.5-flash-lite` | Cheapest Gemini |
| `gemini-2.0-flash-001` | Stable, widely available |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `POLYGLOT_API_KEY` | OpenAI, Anthropic, or Google AI API key |
| `POLYGLOT_PROVIDER` | `openai` \| `anthropic` \| `google` |
| `POLYGLOT_MODEL` | Model ID override |
| `POLYGLOT_MODE` | `comment`, `why`, or `both` |
| `POLYGLOT_LICENSE_TOKEN` | Session token — skips login gate in CI/CD |
| `CI` | Set to `true` to skip interactive prompts |

---

## CI/CD (GitHub Actions)

```yaml
- name: Add doc comments with Poly-Glot
  env:
    POLYGLOT_API_KEY: ${{ secrets.POLYGLOT_API_KEY }}
    POLYGLOT_PROVIDER: openai
    POLYGLOT_MODEL: gpt-4.1-mini
    POLYGLOT_MODE: both
    POLYGLOT_LICENSE_TOKEN: ${{ secrets.POLYGLOT_LICENSE_TOKEN }}
  run: |
    npm install -g poly-glot-ai-cli
    poly-glot comment --dir src/ --output-dir src-commented/ --yes
```

> `POLYGLOT_LICENSE_TOKEN` is your session token from poly-glot.ai. Pro required for `--why` / `--both` / `--mode both` in CI.

---

## GitHub App

Poly-Glot also runs as a **GitHub App** — automatically reviews pull requests, scores documentation coverage, and posts inline comment suggestions on every PR.

👉 [Install the GitHub App](https://github.com/apps/poly-glot-ai)

---

## MCP Server (Pro+ only)

Use Poly-Glot from Claude Desktop, Goose, Cursor, Windsurf and any MCP client.

```bash
npx poly-glot-mcp
```

Requires a Pro or higher plan + `POLYGLOT_SESSION_TOKEN`. [See MCP README →](../poly-glot-mcp/README.md)

---

## npm-stats-start
<!-- npm-stats-end -->

---

## License

AGPL-3.0-or-later © Harold Moses

---

## Support & Enterprise

📧 **[hwmoses2@icloud.com](mailto:hwmoses2@icloud.com)**
🌐 **[poly-glot.ai](https://poly-glot.ai)**
⭐ **[GitHub](https://github.com/poly-glot-ai/poly-glot)**
