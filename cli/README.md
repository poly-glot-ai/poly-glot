# Poly-Glot CLI

[![npm version](https://img.shields.io/npm/v/poly-glot-ai-cli?color=blue&label=npm)](https://www.npmjs.com/package/poly-glot-ai-cli)
[![license](https://img.shields.io/npm/l/poly-glot-ai-cli)](https://github.com/hmoses/poly-glot/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/poly-glot-ai-cli)](https://nodejs.org)
[![downloads](https://img.shields.io/npm/dm/poly-glot-ai-cli)](https://www.npmjs.com/package/poly-glot-ai-cli)
[![GitHub stars](https://img.shields.io/github/stars/hmoses/poly-glot?style=social)](https://github.com/hmoses/poly-glot)

AI-powered code comment generation from the command line.  
Supports **OpenAI** and **Anthropic** — same engine as [poly-glot.ai](https://poly-glot.ai).

> ⭐ **If this saves you time, a GitHub star goes a long way.**  
> It helps other developers discover Poly-Glot and keeps the project growing.  
> → [**Star on GitHub**](https://github.com/hmoses/poly-glot)

<!-- npm-stats-start -->
> 📦 **npm install stats** *(updated daily)*
> | Period | Downloads |
> |--------|-----------|
> | Yesterday | **922** |
> | Last 7 days | **922** |
> | All time | **922** |
>
> *Last updated: 2026-03-27*
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

## Install

```bash
npm install -g poly-glot-ai-cli
```

Or run without installing:

```bash
npx poly-glot-ai-cli comment src/auth.js
```

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

| Language | Doc-comment style | Why-comment style |
|----------|-------------------|-------------------|
| JavaScript / TypeScript | JSDoc / TSDoc | `// why:` inline |
| Python | Google-style docstrings | `# why:` inline |
| Java | Javadoc | `// why:` inline |
| C / C++ | Doxygen | `// why:` inline |
| C# | XML doc comments | `// why:` inline |
| Go | GoDoc | `// why:` inline |
| Rust | `///` doc comments | `// why:` inline |
| Ruby | YARD | `# why:` inline |
| PHP | PHPDoc | `// why:` inline |
| Swift | Swift markup | `// why:` inline |
| Kotlin | KDoc | `// why:` inline |

---

## CI/CD example (GitHub Actions)

```yaml
- name: Comment code with Poly-Glot
  env:
    POLYGLOT_API_KEY: ${{ secrets.POLYGLOT_API_KEY }}
    POLYGLOT_PROVIDER: openai
    POLYGLOT_MODEL: gpt-4o-mini
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
