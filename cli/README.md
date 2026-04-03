# Poly-Glot CLI

[![npm version](https://img.shields.io/npm/v/poly-glot-ai-cli?color=CB3837&label=npm)](https://www.npmjs.com/package/poly-glot-ai-cli)
[![installs](https://img.shields.io/npm/dt/poly-glot-ai-cli?label=installs)](https://www.npmjs.com/package/poly-glot-ai-cli)
[![license](https://img.shields.io/npm/l/poly-glot-ai-cli)](https://github.com/poly-glot-ai/poly-glot/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/poly-glot-ai-cli)](https://www.npmjs.com/package/poly-glot-ai-cli)

AI-powered code documentation, bug finding, refactoring, and test generation — from your terminal. Supports 12 languages via OpenAI or Anthropic.

```bash
npm install -g poly-glot-ai-cli
poly-glot login            # free account required
poly-glot config           # add your API key
poly-glot comment src/auth.js
```

---

## Pricing

| Tier | Price | Files/month | Languages | Commands |
|------|-------|-------------|-----------|----------|
| **Free** | $0 | 50 | Python · JS · TS · Java | `comment` |
| **Pro** | $9/mo | Unlimited | All 12 | All commands |
| **Team** | $29/mo | Unlimited | All 12 | All commands + shared team token |
| **Enterprise** | Custom | Unlimited | All 12 | Everything + SLA + private deploy |

👉 [poly-glot.ai](https://poly-glot.ai/#pg-pricing-section) · 📧 [hwmoses2@icloud.com](mailto:hwmoses2@icloud.com)

---

## What it does

### Comment modes

| Mode | What gets added |
|------|-----------------|
| `comment` | Standardized doc-comments — JSDoc, PyDoc, Javadoc, TSDoc, Doxygen, KDoc… |
| `why` | Inline `// why:` comments explaining reasoning, trade-offs, and intent |
| `both` | Both types in one pass |

### Analysis commands (Pro)

| Command | What it does |
|---------|--------------|
| 🐛 `bugs` | Find bugs, edge cases, null dereferences, and error handling gaps |
| ⚡ `refactor` | Concrete, actionable improvement suggestions with before/after examples |
| 🧪 `test` | Generate unit tests directly from function signatures and doc comments |
| 🔍 `explain` | Deep analysis — complexity score, potential bugs, doc quality score |

---

## Commands

```bash
# Comment a single file
poly-glot comment src/auth.js

# Why-comments on a file
poly-glot why src/auth.js

# Both in one pass
poly-glot both src/auth.js

# Entire directory (recursive)
poly-glot comment --dir src/ --output-dir src-commented/

# From stdin
cat src/auth.js | poly-glot comment --stdin --lang js

# Pro commands
poly-glot bugs src/auth.js
poly-glot refactor src/auth.js
poly-glot test src/auth.js
poly-glot explain src/auth.js
```

---

## Setup

```bash
# 1. Install
npm install -g poly-glot-ai-cli

# 2. Create your free account
poly-glot login

# 3. Add your API key (OpenAI or Anthropic)
poly-glot config --provider openai --key sk-...
poly-glot config --provider anthropic --key sk-ant-...

# 4. Run
poly-glot comment src/index.ts
```

---

## Supported languages

| Language | Free | Pro | Doc style |
|----------|------|-----|-----------|
| JavaScript | ✅ | ✅ | JSDoc |
| TypeScript | ✅ | ✅ | TSDoc |
| Python | ✅ | ✅ | PyDoc |
| Java | ✅ | ✅ | Javadoc |
| C++ | ❌ | ✅ | Doxygen |
| C# | ❌ | ✅ | XML doc comments |
| Go | ❌ | ✅ | GoDoc |
| Rust | ❌ | ✅ | `///` doc comments |
| Ruby | ❌ | ✅ | YARD |
| PHP | ❌ | ✅ | PHPDoc |
| Swift | ❌ | ✅ | Swift markup |
| Kotlin | ❌ | ✅ | KDoc |

---

## Supported models

Works with **any model ID** from OpenAI or Anthropic.

### OpenAI

| Model | Notes |
|-------|-------|
| `gpt-4.1-mini` ⭐ | **Recommended** — best quality-to-cost ratio |
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

```bash
poly-glot config --provider openai --model gpt-4.1-mini
poly-glot config --provider anthropic --model claude-sonnet-4-5

# Override per-run
poly-glot comment src/auth.js --provider openai --model gpt-4.1-nano
```

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

> CI/CD environments (`CI=true`) skip the login gate automatically. Set `POLYGLOT_LICENSE_TOKEN` for Pro features in automation.

---

## GitHub App

Poly-Glot also runs as a **GitHub App** — automatically reviews pull requests, scores documentation coverage, and posts inline suggestions.

👉 [Install the GitHub App](https://github.com/apps/poly-glot-ai)

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `POLYGLOT_API_KEY` | OpenAI or Anthropic API key |
| `POLYGLOT_PROVIDER` | `openai` or `anthropic` |
| `POLYGLOT_MODEL` | Model ID override |
| `POLYGLOT_MODE` | `comment`, `why`, or `both` |
| `POLYGLOT_LICENSE_TOKEN` | Pro/Team license token (skips login gate in CI) |
| `CI` | Set to `true` to skip login gate in automated environments |

---

## License

AGPL-3.0-or-later © Harold Moses

---

## Support & Enterprise

📧 **[hwmoses2@icloud.com](mailto:hwmoses2@icloud.com)**  
🌐 **[poly-glot.ai](https://poly-glot.ai)**  
⭐ **[GitHub](https://github.com/poly-glot-ai/poly-glot)**
