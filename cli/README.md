# Poly-Glot CLI

AI-powered code comment generation from the command line.  
Supports **OpenAI** and **Anthropic** — same engine as [poly-glot.ai](https://poly-glot.ai).

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
# 1. Configure your API key (stored in ~/.config/polyglot/config.json)
poly-glot config --key sk-... --provider openai

# 2. Add doc-comments to a file (JSDoc, PyDoc, Javadoc, etc.)
poly-glot comment src/auth.js

# 3. Add why-comments — inline reasoning, trade-offs & intent
poly-glot comment src/auth.js --why

# 4. Add both doc-comments AND why-comments in one pass
poly-glot comment src/auth.js --both

# 5. Write commented output to a new file
poly-glot comment src/auth.js --output src/auth.documented.js

# 6. Comment every JS/TS file in a directory
poly-glot comment --dir src/

# 7. Comment a directory and write output to a separate folder
poly-glot comment --dir src/ --output-dir src-commented/

# 8. Pipe from stdin
cat main.py | poly-glot comment --stdin --lang python > main_commented.py

# 9. Analyse code quality
poly-glot explain src/utils.ts
```

---

## Comment modes

Poly-Glot supports three comment modes — choose the one that fits your workflow:

| Mode | Flag | What it adds |
|------|------|-------------|
| **comment** | *(default)* | Standardized doc-comments — JSDoc, PyDoc, Javadoc, KDoc, etc. Parameters, return types, exceptions. |
| **why** | `--why` | Inline comments explaining *why* decisions were made — reasoning, trade-offs, intent. Not what the code does. |
| **both** | `--both` | Two sequential passes: doc-comments first, then why-comments applied to the result. Best of both worlds. |

### Examples

```bash
# Doc-comments only (default)
poly-glot comment src/auth.js

# Why-comments only
poly-glot comment src/auth.js --why

# Both in one command (two-pass)
poly-glot comment src/auth.js --both

# Shorthand for why-comments
poly-glot why src/auth.js

# Set mode explicitly
poly-glot comment src/auth.js --mode why

# Set your default mode so you never have to type the flag
poly-glot config --mode both
```

### Setting a default mode

Your preferred mode is saved to `~/.config/polyglot/config.json` and used automatically on every run:

```bash
# Set default to "both" — all future runs use doc + why
poly-glot config --mode both

# Or interactively
poly-glot config
# → Prompts: Default mode [comment/why/both] (current: comment)
```

Override the default for a single run with any flag (`--why`, `--both`, `--mode <m>`).

**Priority order:** `--both` > `--why` > `--mode <value>` > saved `defaultMode` > `comment`

---

## Commands

### `poly-glot demo`

**See Poly-Glot in action** with interactive code examples before using it on your own files.

```bash
# Interactive demo — choose a language
poly-glot demo

# View a specific language example
poly-glot demo --lang javascript
poly-glot demo --lang python

# Generate live comments using your API key (requires configuration)
poly-glot demo --lang rust --live
```

**Features:**
- 📚 Pre-built examples for 12 languages
- 🎯 See before/after transformations instantly
- ⚡ No API key required for static examples
- 🔴 Optional `--live` mode to test with your configured API
- 💡 Learn what Poly-Glot can do for your codebase

---

### `poly-glot config`

Set your API key, preferred provider/model, and default comment mode.

```bash
# Interactive
poly-glot config

# Non-interactive (great for CI/CD)
poly-glot config --key sk-... --provider openai --model gpt-4o-mini
poly-glot config --key sk-ant-... --provider anthropic --model claude-sonnet-4-5

# Set default comment mode
poly-glot config --mode both
poly-glot config --mode why
poly-glot config --mode comment
```

**Environment variables** (override config file — ideal for CI):

```bash
export POLYGLOT_API_KEY=sk-...
export POLYGLOT_PROVIDER=openai
export POLYGLOT_MODEL=gpt-4o-mini
export POLYGLOT_MODE=both        # comment | why | both
poly-glot comment src/auth.js
```

---

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
| `--why` | Add why-comments (reasoning & intent) instead of doc-comments |
| `--both` | Add doc-comments AND why-comments in one two-pass run |
| `--mode <m>` | Explicit mode: `comment`, `why`, or `both` |
| `--provider <name>` | Override provider for this run |
| `--model <name>` | Override model for this run |

---

### `poly-glot why`

Shorthand for `poly-glot comment <file> --why`.

```bash
poly-glot why src/auth.js
poly-glot why src/auth.js --output src/auth.why.js
```

---

### `poly-glot explain`

Analyse a file for complexity, bugs, documentation quality, and more.

```bash
poly-glot explain src/auth.js
```

Output includes:
- Summary
- Complexity score (1–10)
- All functions with purpose and parameters
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
    POLYGLOT_MODE: both           # doc + why in one pass
  run: |
    npm install -g poly-glot-ai-cli
    poly-glot comment --dir src/ --output-dir src-commented/
```

---

## License

MIT © Harold Moses

---

Please share if you find this helpful 🚀
