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
| **Free** | $0 | 50 | JS · TS · Python · Java | `comment` |
| **Pro** | $9/mo | Unlimited | All 12 | All commands |
| **Team** | $29/mo | Unlimited | All 12 | All commands + shared team token |
| **Enterprise** | Custom | Unlimited | All 12 | Everything + SLA + private deploy |

> 🎁 Early bird: use code **`EARLYBIRD3`** at checkout to lock Pro at **$9/mo forever** (expires May 1, 2026) → [poly-glot.ai](https://poly-glot.ai/#pg-pricing-section)

---

## What it does

### Comment modes

| Mode | What gets added |
|------|-----------------|
| `comment` | Standardized doc-comments — JSDoc, PyDoc, Javadoc, TSDoc, Doxygen, KDoc… |
| `why` | Inline `// why:` comments explaining reasoning, trade-offs, and intent |
| `both` | Both types in one pass — doc-comments first, then why-comments |

### Analysis commands *(Pro)*

| Command | What it does |
|---------|--------------|
| 🐛 `bugs` | Find bugs, edge cases, null dereferences, and error handling gaps |
| ⚡ `refactor` | Concrete, actionable improvement suggestions with before/after examples |
| 🧪 `test` | Generate unit tests from function signatures and doc comments |
| 🔍 `explain` | Deep analysis — complexity score, potential bugs, doc quality score |

---

## Quick start

```bash
# 1. Install
npm install -g poly-glot-ai-cli

# 2. Create your free account (email only, no password)
poly-glot login

# 3. Add your API key
poly-glot config --provider openai --key sk-...
# or
poly-glot config --provider anthropic --key sk-ant-...
# or
poly-glot config --provider google --key AIza...

# 4. Comment a file
poly-glot comment src/auth.js
```

---

## Commands

### `comment` — Add doc-comments

```bash
# Single file
poly-glot comment src/auth.js

# Preview without writing (safe)
poly-glot comment src/auth.js --dry-run

# Show a unified diff before committing
poly-glot comment src/auth.js --diff

# Save a .orig backup before overwriting
poly-glot comment src/auth.js --backup

# Write to a different output file
poly-glot comment src/auth.js --output src/auth.commented.js

# Override language detection
poly-glot comment src/auth.js --lang python

# Why-comments (inline reasoning)
poly-glot comment src/auth.js --why

# Both doc-comments + why-comments in one pass
poly-glot comment src/auth.js --both

# Entire directory (recursive)
poly-glot comment --dir src/

# Directory — skip confirmation prompt
poly-glot comment --dir src/ --yes

# Directory — write to a separate output folder
poly-glot comment --dir src/ --output-dir src-commented/

# Directory — only process specific extensions
poly-glot comment --dir src/ --ext ts,tsx

# Directory — preview without writing
poly-glot comment --dir src/ --dry-run

# From stdin → stdout (for pipes/scripts)
cat src/auth.js | poly-glot comment --stdin --lang javascript

# Override model for this run only
poly-glot comment src/auth.js --provider openai --model gpt-4.1-nano
```

### `why` — Add why-comments *(shorthand)*

```bash
poly-glot why src/auth.js
poly-glot why --dir src/
poly-glot why src/auth.js --dry-run
poly-glot why src/auth.js --diff
poly-glot why src/auth.js --backup
poly-glot why src/auth.js --output src/auth.why.js
```

### `both` — Doc + why in one pass *(shorthand)*

```bash
poly-glot both src/auth.js
poly-glot both --dir src/
poly-glot both src/auth.js --dry-run
poly-glot both src/auth.js --diff
poly-glot both src/auth.js --backup
```

### `bugs` — Find bugs *(Pro)*

```bash
poly-glot bugs src/auth.js

# Save report to file
poly-glot bugs src/auth.js --output bugs-report.md
```

### `refactor` — Suggest refactors *(Pro)*

```bash
poly-glot refactor src/auth.js

# Save suggestions to file
poly-glot refactor src/auth.js --output refactor-suggestions.md
```

### `test` — Generate unit tests *(Pro)*

```bash
poly-glot test src/auth.js
# Output file auto-named: auth.test.js, auth_test.py, AuthTest.java, etc.

# Override output file
poly-glot test src/auth.js --output tests/auth.test.js

# Preview without writing
poly-glot test src/auth.js --dry-run
```

### `explain` — Deep code analysis *(Pro)*

```bash
poly-glot explain src/auth.js
# Outputs: summary, complexity score, doc quality, functions, potential bugs, suggestions
```

### `login` — Create / restore account

```bash
poly-glot login
# Sends a magic link to your email — no password needed
```

### `config` — Configure settings

```bash
# Interactive setup
poly-glot config

# Set API key
poly-glot config --key sk-...

# Set provider
poly-glot config --provider openai
poly-glot config --provider anthropic
poly-glot config --provider google

# Set model
poly-glot config --model gpt-4.1-mini
poly-glot config --model claude-sonnet-4-5
poly-glot config --model gemini-2.5-flash

# Set default mode
poly-glot config --mode comment
poly-glot config --mode why
poly-glot config --mode both

# Set Pro/Team license token
poly-glot config --token <your-license-token>

# Telemetry
poly-glot config --telemetry          # enable anonymous usage stats
poly-glot config --no-telemetry       # disable
```

### `demo` — See it in action (no account needed)

```bash
poly-glot demo                        # interactive — pick a language
poly-glot demo --lang python          # jump straight to Python sample
poly-glot demo --live                 # use your own API key for a live run
```

---

## All flags reference

### Mode flags

| Flag | Commands | Description |
|------|----------|-------------|
| `--why` | `comment` | Use why-comment mode (inline reasoning) |
| `--both` | `comment` | Use both modes: doc-comments first, then why-comments |
| `--mode <m>` | `comment`, `config` | Set mode: `comment` \| `why` \| `both` |

### Safety flags

| Flag | Commands | Description |
|------|----------|-------------|
| `--dry-run` | `comment`, `why`, `both`, `test` | Preview changes — no files written |
| `--diff` | `comment`, `why`, `both` | Show unified diff of every change |
| `--backup` | `comment`, `why`, `both` | Save `.orig` copy before overwriting |

### I/O flags

| Flag | Commands | Description |
|------|----------|-------------|
| `--lang <lang>` | `comment`, `why`, `both`, `bugs`, `refactor`, `test`, `explain` | Override language detection (e.g. `python`, `typescript`) |
| `--output <file>` | `comment`, `why`, `both`, `bugs`, `refactor`, `test` | Write output to a specific file |
| `--output-dir <dir>` | `comment`, `why`, `both` (with `--dir`) | Write to a separate output directory, preserving structure |
| `--stdin` | `comment`, `why`, `both` | Read from stdin, write to stdout |

### Directory flags

| Flag | Commands | Description |
|------|----------|-------------|
| `--dir <path>` | `comment`, `why`, `both` | Process all supported files in a directory (recursive) |
| `--ext <list>` | `comment --dir` | Comma-separated extensions to include, e.g. `ts,tsx,js` |
| `--yes`, `-y` | `comment --dir` | Skip the "About to modify N files" confirmation prompt |

### Provider / model flags

| Flag | Commands | Description |
|------|----------|-------------|
| `--provider <name>` | all generation commands, `config` | Override provider: `openai` \| `anthropic` \| `google` |
| `--model <name>` | all generation commands, `config` | Override model, e.g. `gpt-4.1-mini`, `claude-sonnet-4-5`, `gemini-2.5-flash` |

### Config flags

| Flag | Command | Description |
|------|---------|-------------|
| `--key <key>` | `config` | Set OpenAI, Anthropic, or Google AI API key |
| `--token <token>` | `config` | Set Pro/Team license token (unlocks all 12 languages + Pro commands) |
| `--mode <m>` | `config` | Set default mode saved to config |
| `--telemetry` | `config` | Enable anonymous usage stats |
| `--no-telemetry` | `config` | Disable anonymous usage stats |

### Demo flags

| Flag | Command | Description |
|------|---------|-------------|
| `--lang <lang>` | `demo` | Jump to a specific language sample |
| `--live` | `demo` | Run against your configured API key instead of static samples |

### Global flags

| Flag | Description |
|------|-------------|
| `--version`, `-v` | Print the installed version |
| `--help`, `-h` | Show help |

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

Works with **any model ID** from OpenAI, Anthropic, or Google.

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

### Google

| Model | Notes |
|-------|-------|
| `gemini-2.5-flash` ⭐ | **Recommended** — fast, accurate, low cost |
| `gemini-2.5-pro` | Most powerful Gemini |
| `gemini-2.5-flash-lite` | Cheapest Gemini |
| `gemini-2.0-flash-001` | Stable, widely available |

```bash
# Set default model
poly-glot config --provider openai --model gpt-4.1-mini
poly-glot config --provider anthropic --model claude-sonnet-4-5
poly-glot config --provider google --model gemini-2.5-flash

# Override per-run
poly-glot comment src/auth.js --provider google --model gemini-2.5-pro
```

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `POLYGLOT_API_KEY` | OpenAI, Anthropic, or Google AI API key |
| `POLYGLOT_PROVIDER` | `openai` \| `anthropic` \| `google` |
| `POLYGLOT_MODEL` | Model ID override |
| `POLYGLOT_MODE` | `comment`, `why`, or `both` |
| `POLYGLOT_LICENSE_TOKEN` | Pro/Team license token — skips login gate in CI |
| `CI` | Set to `true` to skip interactive login prompts |

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
