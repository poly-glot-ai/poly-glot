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
poly-glot config

# 2. Comment a file (edits in place)
poly-glot comment src/auth.js

# 3. Write commented output to a new file
poly-glot comment src/auth.js --output src/auth.documented.js

# 4. Comment every JS/TS file in a directory
poly-glot comment --dir src/

# 5. Comment a directory and write output to a separate folder
poly-glot comment --dir src/ --output-dir src-commented/

# 6. Pipe from stdin
cat main.py | poly-glot comment --stdin --lang python > main_commented.py

# 7. Analyse code quality
poly-glot explain src/utils.ts
```

---

## Commands

### `poly-glot config`

Set your API key and preferred provider/model.

```bash
# Interactive
poly-glot config

# Non-interactive (great for CI/CD)
poly-glot config --key sk-... --provider openai --model gpt-4o-mini
poly-glot config --key sk-ant-... --provider anthropic --model claude-sonnet-4-5
```

**Environment variables** (override config file — ideal for CI):

```bash
export POLYGLOT_API_KEY=sk-...
export POLYGLOT_PROVIDER=openai
export POLYGLOT_MODEL=gpt-4o-mini
poly-glot comment src/auth.js
```

---

### `poly-glot comment`

Comment a file, directory, or stdin.

| Flag | Description |
|---|---|
| `<file>` | Single file to comment (edited in place) |
| `--output <file>` | Write to a different file instead |
| `--dir <dir>` | Comment all supported files in a directory (recursive) |
| `--output-dir <dir>` | Output directory for `--dir` mode (preserves structure) |
| `--ext <list>` | Comma-separated extensions to include, e.g. `js,ts,py` |
| `--stdin` | Read from stdin (must also set `--lang`) |
| `--lang <lang>` | Override language detection |
| `--provider <name>` | Override provider for this run |
| `--model <name>` | Override model for this run |

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

| Language | Comment style |
|---|---|
| JavaScript / TypeScript | JSDoc / TSDoc |
| Python | Google-style docstrings |
| Java | Javadoc |
| C / C++ | Doxygen |
| C# | XML doc comments |
| Go | GoDoc |
| Rust | Rust doc comments (`///`) |
| Ruby | YARD |
| PHP | PHPDoc |
| Swift | Swift markup |
| Kotlin | KDoc |

---

## CI/CD example (GitHub Actions)

```yaml
- name: Comment code with Poly-Glot
  env:
    POLYGLOT_API_KEY: ${{ secrets.POLYGLOT_API_KEY }}
    POLYGLOT_PROVIDER: openai
    POLYGLOT_MODEL: gpt-4o-mini
  run: |
    npm install -g poly-glot-ai-cli
    poly-glot comment --dir src/ --output-dir src-commented/
```

---

## License

MIT © Harold Moses
