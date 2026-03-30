# Poly-Glot CLI

[![npm version](https://img.shields.io/npm/v/poly-glot-ai-cli?color=blue&label=npm)](https://www.npmjs.com/package/poly-glot-ai-cli)
[![license](https://img.shields.io/npm/l/poly-glot-ai-cli)](https://github.com/hmoses/poly-glot/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/poly-glot-ai-cli)](https://nodejs.org)
[![downloads](https://img.shields.io/npm/dm/poly-glot-ai-cli)](https://www.npmjs.com/package/poly-glot-ai-cli)
[![GitHub stars](https://img.shields.io/github/stars/hmoses/poly-glot?style=social)](https://github.com/hmoses/poly-glot)

AI-powered code comment generation from the command line.  
Supports **OpenAI** and **Anthropic** — same engine as [poly-glot.ai](https://poly-glot.ai).

---

## 🎉 Poly-Glot AI is officially live!

> Thanks for being one of our **1,200+ early CLI users**. The full platform is now open for subscriptions.
>
> 🎁 **Early bird offer** — use code **`EARLYBIRD3`** at checkout for **3 months completely free** on any paid plan.  
> ⚡ Limited to the first **50 subscribers** — [grab it now →](https://poly-glot.ai)
>
> | Plan | Price | What you get |
> |------|-------|-------------|
> | **Free** | $0/mo | Python · JS · Java · doc-comments · 50 files/mo · BYOK |
> | **Pro** | $9/mo | All 12 languages · why-comments · both mode · shared API key pool |
> | **Team** | $29/mo | Everything in Pro · 5 seats · team analytics |
>
> → [**Sign up at poly-glot.ai**](https://poly-glot.ai)

---

> ⭐ **If this saves you time, a GitHub star goes a long way.**  
> It helps other developers discover Poly-Glot and keeps the project growing.  
> → [**Star on GitHub**](https://github.com/hmoses/poly-glot)

<!-- npm-stats-start -->
> 📦 **npm install stats** *(updated daily)*
> | Period | Downloads |
> |--------|-----------|
> | Yesterday | **272** |
> | Last 7 days | **1,229** |
> | All time | **1,229** |
>
> *Last updated: 2026-03-30*
<!-- npm-stats-end -->

---

## At a glance

| Command | What it does |
|---------|-------------|
| `poly-glot comment <file>` | Add standardized doc-comments (JSDoc, PyDoc, Javadoc…) |
| `poly-glot comment <file> --why` | Add inline why-comments explaining reasoning & intent |
| `poly-glot comment <file> --both` | Doc-comments + why-comments in one two-pass run |
| `poly-glot why <file>` | Shorthand for `--why` |
| `poly-glot both <file>` | Shorthand for `--both` |
| `poly-glot comment --dir <dir>` | Comment every supported file in a directory |
| `poly-glot explain <file>` | Deep analysis: complexity, bugs, doc quality |
| `poly-glot config` | Set API key, provider, model, and default mode |
| `poly-glot demo` | See before/after examples without an API key |

**Safety flags** (use before any file is written):

| Flag | What it does |
|------|-------------|
| `--dry-run` | Preview changes — no files written |
| `--diff` | Show a `+/-` unified diff before writing |
| `--backup` | Save `.orig` copy of every file before overwriting |
| `--yes` / `-y` | Skip `--dir` confirmation prompt |

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
| **CLI tool** | ✅ (3 languages) | ✅ (all 12 languages) |
| **Web UI** | ✅ | ✅ |
| **Confidence scoring** | ✗ | ✅ |
| **Fine-tune export (JSONL)** | ✗ | ✅ |
| **Price** | Free forever | Coming soon |

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

```bash
# 1. Configure — works with OpenAI or Anthropic
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

# 8. Directory run, no prompt (great for CI)
poly-glot comment --dir src/ --yes

# 9. Pipe from stdin
cat main.py | poly-glot comment --stdin --lang python > main_commented.py

# 10. Analyse code quality
poly-glot explain src/utils.ts
```

---

## Comment modes

| Mode | Flag | What it adds |
|------|------|-------------|
| **comment** | *(default)* | Standardized doc-comments — JSDoc, PyDoc, Javadoc, KDoc, etc. |
| **why** | `--why` | Inline comments explaining *why* decisions were made — reasoning, trade-offs, intent. |
| **both** | `--both` | Two sequential passes: doc-comments first, then why-comments. Best of both worlds. |

```bash
poly-glot comment src/auth.js           # doc-comments (default)
poly-glot comment src/auth.js --why     # why-comments
poly-glot comment src/auth.js --both    # doc + why
poly-glot why src/auth.js               # shorthand for --why
poly-glot comment src/auth.js --mode both  # explicit mode flag
```

### Set a default mode

```bash
poly-glot config --mode both   # all future runs use doc + why
poly-glot config               # interactive — prompts for mode
```

**Priority order:** `--both` > `--why` > `--mode <value>` > saved `defaultMode` > `comment`

---

## Safety flags

These flags give you full control before anything is written to disk.

### `--dry-run` — preview without writing

```bash
poly-glot comment src/auth.js --dry-run
poly-glot comment --dir src/ --dry-run   # shows what would be processed
```

No files are created or modified. Use this to see what poly-glot *would* do before committing.

### `--diff` — unified diff of every change

```bash
poly-glot comment src/auth.js --diff
poly-glot comment --dir src/ --diff --yes
```

Shows a `+/-` unified diff for every file before writing. Combine with `--dry-run` to see the diff without writing:

```bash
poly-glot comment src/auth.js --dry-run --diff
```

### `--backup` — save `.orig` files before overwriting

```bash
poly-glot comment src/auth.js --backup
# → writes src/auth.js (commented) + src/auth.js.orig (original)

poly-glot comment --dir src/ --backup --yes
# → saves .orig alongside every modified file
```

Restore any file instantly: `mv src/auth.js.orig src/auth.js`

---

## Directory mode

Running on a directory prompts for confirmation before writing anything:

```
Poly-Glot — 📝 doc-comments
About to process 23 file(s) in /src (in-place)

Continue? (Y/n)
```

After the run, a summary line shows exactly what happened:

```
  ✓ 21 commented · 2 skipped · ~$0.06 · 22s
```

If any files fail, the failures are listed with their error messages after the summary — no silent drops.

### Directory flags

| Flag | Description |
|------|-------------|
| `--yes`, `-y` | Skip the confirmation prompt (use in scripts / CI) |
| `--dry-run` | Show what would be processed — no files written |
| `--diff` | Show unified diffs for every file |
| `--backup` | Save `.orig` alongside each modified file |
| `--output-dir <dir>` | Write to a separate directory (preserves structure, originals untouched) |
| `--ext <list>` | Comma-separated extensions to include, e.g. `js,ts,py` |

---

## Commands

### `poly-glot demo`

See Poly-Glot in action with interactive code examples before using it on your own files.

```bash
poly-glot demo                    # interactive — choose a language
poly-glot demo --lang python      # jump straight to Python example
poly-glot demo --lang rust --live # generate live using your API key
```

### `poly-glot config`

Configure your API key, provider, model, and default comment mode.

```bash
# Interactive
poly-glot config

# Non-interactive
poly-glot config --key sk-... --provider openai --model gpt-4o-mini
poly-glot config --key sk-ant-... --provider anthropic --model claude-sonnet-4-5
poly-glot config --mode both
```

**Environment variables** (override config file — ideal for CI):

```bash
export POLYGLOT_API_KEY=sk-...
export POLYGLOT_PROVIDER=openai
export POLYGLOT_MODEL=gpt-4o-mini
export POLYGLOT_MODE=both         # comment | why | both
poly-glot comment src/auth.js
```

### `poly-glot comment`

Comment a file, directory, or stdin.

| Flag | Description |
|------|-------------|
| `<file>` | Single file to comment (edited in place) |
| `--output <file>` | Write to a different file instead |
| `--dir <dir>` | Comment all supported files in a directory (recursive) |
| `--output-dir <dir>` | Output directory for `--dir` mode (preserves structure) |
| `--ext <list>` | Comma-separated extensions to include, e.g. `js,ts,py` |
| `--stdin` | Read from stdin (must also set `--lang`) |
| `--lang <lang>` | Override language detection |
| `--why` | Add why-comments instead of doc-comments |
| `--both` | Add doc-comments AND why-comments in one two-pass run |
| `--mode <m>` | Explicit mode: `comment`, `why`, or `both` |
| `--dry-run` | Preview changes — no files written |
| `--diff` | Show unified diff of changes |
| `--backup` | Save `.orig` backup before overwriting |
| `--yes`, `-y` | Skip `--dir` confirmation prompt |
| `--provider <name>` | Override provider for this run |
| `--model <name>` | Override model for this run |

### `poly-glot why`

Shorthand for `poly-glot comment <file> --why`. Accepts all the same flags.

```bash
poly-glot why src/auth.js
poly-glot why src/auth.js --output src/auth.why.js
poly-glot why --dir src/ --output-dir src-why/
```

### `poly-glot both`

Shorthand for `poly-glot comment <file> --both`. Runs two sequential passes — doc-comments first, then why-comments. Accepts all the same flags.

```bash
poly-glot both src/auth.js
poly-glot both src/auth.js --output src/auth.both.js
poly-glot both --dir src/ --output-dir src-both/
poly-glot both src/auth.js --dry-run    # preview without writing
poly-glot both src/auth.js --backup     # save .orig before overwriting
```

### `poly-glot explain`

Deep analysis: complexity, bugs, documentation quality, and improvement suggestions.

```bash
poly-glot explain src/auth.js
```

Output includes:
- Summary
- Complexity score (1–10) and label
- All functions with purpose, parameters, and return type
- Potential bugs
- Documentation quality score (0–100)
- Improvement suggestions

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
