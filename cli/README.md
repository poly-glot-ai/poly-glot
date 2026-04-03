# Poly-Glot CLI

[![npm version](https://img.shields.io/npm/v/poly-glot-ai-cli?color=CB3837&label=npm)](https://www.npmjs.com/package/poly-glot-ai-cli)
[![installs](https://img.shields.io/npm/dt/poly-glot-ai-cli?label=installs)](https://www.npmjs.com/package/poly-glot-ai-cli)
[![license](https://img.shields.io/npm/l/poly-glot-ai-cli)](https://github.com/hmoses/poly-glot/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/poly-glot-ai-cli)](https://www.npmjs.com/package/poly-glot-ai-cli)

Add standardized doc-comments and why-comments to your code from the terminal — powered by OpenAI or Anthropic.

```bash
npm install -g poly-glot-ai-cli
poly-glot config          # add your API key once
poly-glot comment src/auth.js
```

---

## Pricing

| Tier | Price | What you get |
|------|-------|--------------|
| **Free** | $0 | Python · JavaScript · Java · 50 files/month · `comment` mode |
| **Pro** | $9/mo | All 12 languages · why-comments · both mode · shared API key pool |

> Join the waitlist at [poly-glot.ai](https://poly-glot.ai/#pricing) and use code **EARLYBIRD3** to get **3 months free** when Pro launches.

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
| ⚡ `refactor` | Concrete, actionable improvement suggestions with before/after diffs |
| 🧪 `test` | Generate unit tests directly from function signatures and doc comments |
| 🔍 `explain` | Deep analysis — complexity score, potential bugs, doc quality |

---

## Commands

| Command | Description |
|---------|-------------|
| `poly-glot comment <file>` | Add standardized doc-comments (JSDoc, PyDoc, Javadoc…) |
| `poly-glot comment <file> --why` | Add inline why-comments explaining reasoning & intent |
| `poly-glot comment <file> --both` | Doc-comments + why-comments in one pass |
| `poly-glot why <file>` | Shorthand for `--why` |
| `poly-glot both <file>` | Shorthand for `--both` |
| `poly-glot comment --dir <dir>` | Comment every supported file in a directory |
| `poly-glot bugs <file>` | 🐛 Find bugs, edge cases, null derefs, error handling gaps |
| `poly-glot refactor <file>` | ⚡ Suggest refactors with concrete before/after diffs |
| `poly-glot test <file>` | 🧪 Generate unit tests from function signatures & docs |
| `poly-glot explain <file>` | 🔍 Deep analysis: complexity, bugs, doc quality |
| `poly-glot config` | Set API key, provider, model, and default mode |
| `poly-glot demo` | See before/after examples without an API key |

**Safety flags** (use before any file is written):

| Flag | What it does |
|------|--------------|
| `--dry-run` | Preview changes — no files written |
| `--diff` | Show a `+/-` unified diff before writing |
| `--backup` | Save `.orig` copy of every file before overwriting |
| `--yes` / `-y` | Skip `--dir` confirmation prompt |
| `--output <file>` | Write output to a specific file (bugs, refactor, test) |

---

## 🤖 Also available in GitHub Copilot Chat

Prefer to stay in your editor? Poly-Glot is a **GitHub Copilot Chat participant** — no terminal needed.

```
@poly-glot /comment    → generate doc-comments for selected code
@poly-glot /why        → add why-comments explaining intent & trade-offs (Pro)
@poly-glot /both       → doc-comments + why-comments in one pass (Pro)
@poly-glot /explain    → deep analysis: complexity, bugs, doc quality score
```

Type `@poly-glot` directly in Copilot Chat inside VS Code. Results appear in chat with an **Apply to Editor** button — no copy-paste needed.

→ [**Install the VS Code extension**](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)

---

## 🐛⚡🧪 Analysis commands (Pro)

Three new commands go beyond documentation — find bugs, improve code quality, and generate tests.

### Find bugs

```bash
poly-glot bugs src/auth.js
```

Audits for edge cases, null dereferences, error handling gaps, race conditions, security vulnerabilities, and off-by-one errors. Each issue includes severity, the affected line, and a concrete fix.

```bash
# Save the report to a file
poly-glot bugs src/auth.js --output bugs-report.md
```

### Suggest refactors

```bash
poly-glot refactor src/utils.ts
```

Generates 3-7 actionable refactoring suggestions with **before/after code diffs**. Focuses on readability, performance, maintainability, and idiomatic patterns.

```bash
# Save suggestions to a file
poly-glot refactor src/utils.ts --output refactor.md
```

### Write tests

```bash
poly-glot test src/auth.js
```

Generates comprehensive unit tests using the standard framework for your language (Jest, pytest, JUnit 5, xUnit, Google Test, RSpec, PHPUnit, XCTest, etc.). Covers happy paths, edge cases, error cases, and boundary values.

```bash
# Custom output filename
poly-glot test src/auth.js --output auth.spec.js

# Preview without writing
poly-glot test src/auth.js --dry-run

# Auto-detects the right test file suffix per language:
#   JavaScript → .test.js    Python → _test.py     Java → Test.java
#   TypeScript → .test.ts    Go     → _test.go     Rust → _test.rs
#   Ruby       → _spec.rb    PHP    → Test.php     Swift → Tests.swift
```

---

## Install

```bash
npm install -g poly-glot-ai-cli
```

Or run without installing:

```bash
npx poly-glot-ai-cli comment src/auth.js
```

---

## Free tier vs Pro

| | Free | Pro |
|---|---|---|
| **Languages** | Python · JavaScript · Java | All 12 languages |
| **Files / month** | 50 | Unlimited |
| **Comment modes** | `comment` only | `comment`, `why`, `both` |
| **Analysis commands** | ✗ | `bugs`, `refactor`, `test`, `explain` |
| **CLI tool** | ✅ (3 languages) | ✅ (all 12 languages) |
| **Web UI** | ✅ | ✅ |
| **Confidence scoring** | ✗ | ✅ |
| **Fine-tune export (JSONL)** | ✗ | ✅ |
| **Price** | Free forever | $9/mo |

### Free languages

The free tier supports **Python**, **JavaScript**, and **Java**.

Picking any other language — TypeScript, Go, Rust, C++, C#, Ruby, PHP, Swift, Kotlin — will exit with:

```
⚠️  TypeScript requires a Pro subscription.

  Free tier includes:  Python · JavaScript · Java
  Pro unlocks:         All 12 languages + unlimited files + why-comments

  Join the waitlist and get 3 months free with code EARLYBIRD3:
  https://poly-glot.ai/#pricing
```

> **Join the waitlist** at [poly-glot.ai](https://poly-glot.ai/#pricing) and use code **EARLYBIRD3** to get **3 months free** when Pro launches.

---

## Quick start

### Step 1 — Install

```bash
npm install -g poly-glot-ai-cli
```

Or run without installing:

```bash
npx poly-glot-ai-cli comment src/auth.js
```

---

### Step 2 — Add your API key

Run the interactive setup wizard:

```bash
poly-glot config
```

You will be prompted to:
1. Choose your provider — **OpenAI** or **Anthropic**
2. Paste your API key
3. Pick a default model (press Enter to accept the recommended default)

**Get your key here:**
- OpenAI → [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Anthropic → [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

Prefer to set it non-interactively? Pass your key directly:

```bash
# OpenAI
poly-glot config --key sk-proj-... --provider openai --model gpt-4.1-mini

# Anthropic
poly-glot config --key sk-ant-api03-... --provider anthropic --model claude-sonnet-4-5
```

Or use environment variables (great for CI/CD — no config file needed):

```bash
export POLYGLOT_API_KEY=sk-proj-...
export POLYGLOT_PROVIDER=openai       # openai | anthropic
export POLYGLOT_MODEL=gpt-4.1-mini   # any valid model ID
```

> **Your key is stored locally** in `~/.config/poly-glot/config.json` and is never sent to Poly-Glot servers.  
> All AI calls go **directly from your machine → OpenAI/Anthropic**.

---

### Step 3 — Comment your first file

```bash
# 1. Configure — works with OpenAI or Anthropic (already done above)
poly-glot config

# 2. Preview before you commit (--dry-run is your safety net)
poly-glot comment src/auth.js --dry-run

# 3. See exactly what changes (unified diff)
poly-glot comment src/auth.js --diff

# 4. Write with a backup just in case
poly-glot comment src/auth.js --backup

# 5. Add why-comments — reasoning, trade-offs, intent
poly-glot comment src/auth.js --why

# 6. Both doc-comments AND why-comments in one pass
poly-glot comment src/auth.js --both

# 7. Shorthand for --both
poly-glot both src/auth.js

# 8. Comment an entire directory (confirms before writing)
poly-glot comment --dir src/

# 9. Directory run, no prompt (great for CI)
poly-glot comment --dir src/ --yes

# 10. Pipe from stdin
cat main.py | poly-glot comment --stdin --lang python > main_commented.py

# 11. Find bugs & edge cases
poly-glot bugs src/auth.js

# 12. Get refactoring suggestions with before/after diffs
poly-glot refactor src/utils.ts

# 13. Generate unit tests
poly-glot test src/auth.js

# 14. Analyse code quality
poly-glot explain src/auth.js
```

---

## Default mode

Set a default so you never need to type a flag again:

```bash
poly-glot config --mode both   # all future runs use doc + why
poly-glot config               # interactive — prompts for mode
```

---

## Supported languages

| Language | Tier | Doc-comment style | Why-comment style |
|----------|------|-------------------|-------------------|
| JavaScript | **Free** | JSDoc | `// why:` inline |
| Python | **Free** | Google-style docstrings | `# why:` inline |
| Java | **Free** | Javadoc | `// why:` inline |
| TypeScript | Pro 🔒 | TSDoc | `// why:` inline |
| C / C++ | Pro 🔒 | Doxygen | `// why:` inline |
| C# | Pro 🔒 | XML doc comments | `// why:` inline |
| Go | Pro 🔒 | GoDoc | `// why:` inline |
| Rust | Pro 🔒 | `///` doc comments | `// why:` inline |
| Ruby | Pro 🔒 | YARD | `# why:` inline |
| PHP | Pro 🔒 | PHPDoc | `// why:` inline |
| Swift | Pro 🔒 | Swift markup | `// why:` inline |
| Kotlin | Pro 🔒 | KDoc | `// why:` inline |

> 🔒 Pro languages require a subscription. [Join the waitlist](https://poly-glot.ai/#pricing) — use code **EARLYBIRD3** for 3 months free.

---

## Supported models

Poly-Glot works with **any model ID** from OpenAI or Anthropic — including brand-new releases. Set your preferred model with `poly-glot config --model <name>` or the `POLYGLOT_MODEL` env var. Pass any valid model ID, even ones not listed here.

### OpenAI

| Model | Type | Approx. cost / request* | Notes |
|-------|------|------------------------|-------|
| `gpt-4.1-mini` ⭐ | Chat | ~$0.001 | **Recommended** — best quality-to-cost ratio |
| `gpt-4.1` | Chat | ~$0.004 | Best GPT-4.1 quality |
| `gpt-4.1-nano` | Chat | ~$0.0002 | Fastest & cheapest OpenAI option |
| `gpt-4o` | Chat | ~$0.005 | Great quality, widely supported |
| `gpt-4o-mini` | Chat | ~$0.0003 | Budget option, very fast |
| `o3-mini` | Reasoning | ~$0.002 | Fast reasoning model |
| `o3` | Reasoning | ~$0.018 | Most powerful reasoning |
| `o1-mini` | Reasoning | ~$0.002 | Budget reasoning |
| `o1` | Reasoning | ~$0.027 | Full reasoning, slower |
| `gpt-4-turbo` | Chat | ~$0.014 | Previous-gen turbo |
| `gpt-4` | Chat | ~$0.030 | Classic GPT-4 |
| `gpt-3.5-turbo` | Chat | ~$0.0007 | Legacy, lightest output |

### Anthropic

| Model | Type | Approx. cost / request* | Notes |
|-------|------|------------------------|-------|
| `claude-sonnet-4-5` ⭐ | Chat | ~$0.007 | **Recommended** — excellent quality & speed |
| `claude-opus-4-5` | Chat | ~$0.033 | Most powerful Claude |
| `claude-haiku-4-5` | Chat | ~$0.002 | Fastest & cheapest Anthropic |
| `claude-3-5-sonnet-20241022` | Chat | ~$0.007 | Proven quality, previous gen |
| `claude-3-5-haiku-20241022` | Chat | ~$0.002 | Budget Claude, very fast |
| `claude-3-opus-20240229` | Chat | ~$0.033 | Deep reasoning, older gen |
| `claude-3-haiku-20240307` | Chat | ~$0.0006 | Lightest & fastest legacy Claude |

> \* Estimates based on a ~200-token input / 400-token output (a typical small function). Costs scale linearly with file size. Check [platform.openai.com/pricing](https://platform.openai.com/pricing) and [anthropic.com/pricing](https://www.anthropic.com/pricing) for current rates.

**Quick recommendation:**
- 🚀 **Best overall** — `gpt-4.1-mini` or `claude-sonnet-4-5`
- 💰 **Lowest cost** — `gpt-4.1-nano` or `claude-3-haiku-20240307`
- 🧠 **Deepest analysis** — `o3` or `claude-opus-4-5`
- 🔬 **Custom / latest model** — pass any model ID directly

```bash
# Set your preferred model
poly-glot config --provider openai --model gpt-4.1-mini
poly-glot config --provider anthropic --model claude-sonnet-4-5

# Or override per-run
poly-glot comment src/auth.js --provider openai --model gpt-4.1-nano
poly-glot comment src/auth.js --provider anthropic --model claude-haiku-4-5

# Use any custom or newly-released model ID
poly-glot comment src/auth.js --provider openai --model gpt-4o-2024-11-20
poly-glot comment src/auth.js --provider anthropic --model claude-3-7-sonnet-20250219
```

---

## CI/CD example (GitHub Actions)

```yaml
- name: Comment code with Poly-Glot
  env:
    POLYGLOT_API_KEY: ${{ secrets.POLYGLOT_API_KEY }}
    POLYGLOT_PROVIDER: openai
    POLYGLOT_MODEL: gpt-4.1-mini
    POLYGLOT_MODE: both
  run: |
    npm install -g poly-glot-ai-cli
    poly-glot comment --dir src/ --output-dir src-commented/ --yes
```

---

## License

MIT © Harold Moses

---

Please share if you find this helpful 🚀


---

## 📬 Support & Enterprise

📧 **[hwmoses2@icloud.com](mailto:hwmoses2@icloud.com)**
🌐 **[poly-glot.ai](https://poly-glot.ai)**
