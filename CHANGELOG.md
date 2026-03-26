# 📝 Poly-Glot Changelog

All notable changes to Poly-Glot will be documented in this file.

---

## [v1.5.2] — 2026-03-26

### ✨ Polish

- **"Try It Now Below" CTA** — button is now perfectly centered on all screen sizes (desktop, tablet, mobile)
- **Clickable CTA** — clicking "Try It Now Below ↓" smoothly scrolls to the ⚙️ API Settings section on all devices
- Added subtle pulse animation to CTA button so it draws the eye without being distracting
- Hover pauses pulse; active state gives tactile press feedback
- Responsive max-width caps (320px tablet, 280px mobile) keep button from stretching edge-to-edge
- Asset cache-bust bumped to `?v=205`

---

## [v1.5.1] — 2026-04-02

### 🚀 New Features

#### 📝💬 `poly-glot both` — New Shorthand Command

- `poly-glot both <file>` — shorthand for `poly-glot comment <file> --both`
- `poly-glot both --dir <dir>` — runs two-pass doc + why across a whole directory
- Accepts all the same flags as `comment`: `--dry-run`, `--diff`, `--backup`, `--yes`, `--output`, `--output-dir`, `--lang`, etc.
- Completes the pattern: `poly-glot comment` / `poly-glot why` / `poly-glot both`

#### 📝💬 **Both** button in Web UI

- New purple **📝💬 Both** button in the sticky toolbar alongside Generate Comments and Why Comments
- Runs two sequential AI passes client-side — doc-comments first, then why-comments on the result
- Results panel shows **BOTH** badge + combined cost display with `(2 passes)` note
- Keyboard shortcut: `Cmd+Alt+Enter` / `Ctrl+Alt+Enter`

#### 💲 Cost shown on every generation (web UI)

- Generate Comments, Why Comments, and Both all show `Cost: $0.0012` in the results panel
- Both mode shows combined cost with `(2 passes)` label for transparency

#### ⌨️ `Cmd+E` / `Ctrl+E` keyboard shortcut for Explain Code

- Completes the full shortcut set: `⌘↵` Generate · `⌘⇧↵` Why · `⌘⌥↵` Both · `⌘E` Explain
- Shown as `⌘E` hint directly on the Explain Code button

#### 📋 Copy button on every flags example

- Every command example in the CLI Flags Reference panel now has a 📋 copy button that appears on hover
- One click copies the exact command to clipboard, button flashes ✅ to confirm
- Works like GitHub code block copy — no friction, no highlighting required

#### 🔍 Filter on CLI Flags Reference panel

- New `🔍 Filter flags…` input at the top of the panel
- Type any keyword (`--dry`, `dir`, `backup`, `why`) to instantly filter rows
- Groups with no matching rows are hidden automatically
- Filter input doesn't trigger the panel collapse toggle

#### 📋 README quick-reference table

- New **"At a glance"** section at the very top of the npm README (before Quick Start)
- Two tables: all commands + all safety flags — copy-ready in under 5 seconds

### 📦 Published
- `poly-glot-ai-cli@1.5.1` — [npmjs.com/package/poly-glot-ai-cli](https://www.npmjs.com/package/poly-glot-ai-cli)

---

## [v1.5.0] — 2026-04-02

### 🚀 New Features

#### 🛡️ Safety Flags — `--dry-run`, `--diff`, `--backup`

- **`--dry-run`** — Preview exactly what poly-glot *would* do without writing a single byte. Works on files, `--dir`, and `--stdin`. The single biggest trust barrier for new users, now removed.
- **`--diff`** — Shows a `+/-` unified diff of every change inline before committing. Combine with `--dry-run` to see the diff without writing: `poly-glot comment auth.js --dry-run --diff`
- **`--backup`** — Saves a `.orig` copy of every file before overwriting. Restore anytime with `mv auth.js.orig auth.js`. Works on single files and across `--dir` runs.
- All three safety flags work with every mode (`comment`, `why`, `both`) and every input type (file, `--dir`, `--stdin`)

#### 📁 Directory Mode — Confirmation Prompt + Run Summary

- **Confirmation prompt** — `poly-glot comment --dir src/` now shows *"About to process N file(s). Continue? (Y/n)"* before writing anything. Automatically skipped in CI (`process.env.CI`), non-TTY environments (pipes, scripts), and when `--yes` / `-y` is passed.
- **`--yes` / `-y` flag** — Skip the prompt for scripts, CI, and power users: `poly-glot comment --dir src/ --yes`
- **Run summary** — After every directory run: `✓ 21 commented · 2 skipped · ~$0.06 · 22s`
- **Failure detail** — If any files fail, a full list of failures with error messages is printed after the summary. No silent drops.

#### ⌨️ Web UI Keyboard Shortcuts

- **`Cmd+Enter` / `Ctrl+Enter`** — Generate Comments (doc mode)
- **`Cmd+Shift+Enter` / `Ctrl+Shift+Enter`** — Why Comments
- Keyboard hints shown directly on the buttons so users discover them immediately
- Skipped when focus is on an input or select element to avoid conflicts

#### 📋 CLI Flags Reference Panel (Web UI)

- New collapsible **"📋 CLI Flags Reference"** section on poly-glot.ai inside the CLI Tool section
- Four groups: Comment Modes, Safety Flags, Directory Mode, Shorthands & Stdin
- Each flag shown with a badge, plain-English description, and a copy-ready example command
- Directory mode group includes a live-look mini terminal showing the confirmation prompt and summary line
- Fully responsive — collapses to stacked layout on mobile

### 🔧 Improvements

- `runWhy()` now delegates to `runComment(['--why', ...args])` — single code path, zero duplication
- `--both` single-file progress now shows `Pass 1/2` and `Pass 2/2` labels for clarity
- Help text (`poly-glot --help`) reorganised into labelled flag groups: Safety, Mode, I/O, Directory, Config
- Environment variables section added to help text
- COLORS map gains `blue` and `magenta` for future use

### 📦 Published
- `poly-glot-ai-cli@1.5.0` — [npmjs.com/package/poly-glot-ai-cli](https://www.npmjs.com/package/poly-glot-ai-cli)

---

## [v1.4.0] — 2026-04-01

### 🚀 New Features

#### 📝💬 Three Comment Modes — `comment`, `why`, `both`

- **`--why` flag** — `poly-glot comment <file> --why` adds inline *why-comments* explaining reasoning, trade-offs, and intent (not what the code does — that's what the code is for)
- **`--both` flag** — `poly-glot comment <file> --both` runs two sequential AI passes: doc-comments first, then why-comments applied to the result. Both types coexist in the final output
- **`--mode <m>` flag** — explicit mode selection: `comment`, `why`, or `both`. Works alongside all input modes (file, dir, stdin)
- **`poly-glot why <file>`** — shorthand alias for `poly-glot comment <file> --why`
- All three modes work with every input mode: single file, `--dir`, and `--stdin`

#### ⚙️ Persistent Default Mode

- **`poly-glot config --mode <m>`** — saves your preferred mode to `~/.config/polyglot/config.json`
- Interactive `poly-glot config` now prompts: *"Default mode [comment/why/both] (current: …)"*
- **`POLYGLOT_MODE` environment variable** — override default mode in CI/CD without touching config
- **Priority order:** `--both` > `--why` > `--mode <value>` > saved `defaultMode` > `comment`

#### 🎬 Updated Demo — All 12 Languages × 3 Modes

- **Mode dropdown** added to "See CLI in Action" section — switch between 🤖 Comment, 💬 Why, 📝💬 Both
- All 12 languages now have realistic `afterWhy` and `afterBoth` code samples showing real transformed output
- **Two-pass terminal animation** for `both` mode: *📝 Pass 1 — doc-comments… ✓ | 💬 Pass 2 — why-comments… ✓ | ✅ Both passes complete!*
- Code panel header updates per mode: "after documentation" / "after why-comments" / "after doc + why comments"

#### 🌐 Web UI — Why Comments Button

- New amber **💬 Why** button in the AI toolbar alongside the existing Generate Comments button
- Results panel shows WHY badge + description: *"Inline comments explaining reasoning & intent"*
- Copy, replace, and close actions all supported

#### 🛠️ CLI 1–2–3 Setup Steps Updated

- Step 2 now correctly shows `--provider openai` in the `poly-glot config` command
- Step 3 now surfaces all three modes: `comment`, `--why`, `--both`

### 📦 Published
- `poly-glot-ai-cli@1.4.0` — [npmjs.com/package/poly-glot-ai-cli](https://www.npmjs.com/package/poly-glot-ai-cli)

---

## [v1.3.0] — 2026-03-28

### 🚀 New Features

#### 💬 Why Comments — Web UI

- **Why Comments feature** launched on [poly-glot.ai](https://poly-glot.ai) — add inline comments that explain *why* code was written the way it was, not just what it does
- Language-aware comment syntax for all 12 languages (JS/TS `// why:`, Python `# why:`, Java/Go/Rust/C++/C#/PHP/Swift/Kotlin `// why:`)
- New `generateWhyComments()` method in `ai-generator.js` — builds why-prompt, calls AI, strips markdown fences, returns annotated code
- New `generateBoth()` method — sequential two-pass generation (doc-comments → why-comments)
- `buildWhyPrompt()` — language-specific prompts that explicitly instruct the AI to explain reasoning, trade-offs, and intent rather than describe the code

#### 🎨 Styles

- `.why-btn` — amber gradient (`#d97706 → #b45309`) to visually distinguish from the primary Generate button
- `.why-badge` — inline amber "WHY" label in results panel
- Spinner animation for `#whyBtn.loading`

#### ⌨️ CLI — `poly-glot why` Command

- `poly-glot why <file>` — initial release of why-comment generation from the terminal
- Supports all 12 detected languages with correct per-language comment syntax
- Identical input/output options to `poly-glot comment` (file, dir, stdin, --output, --output-dir)

#### 🌐 All 12 Languages

- Why-comment support fully available across: JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin

### 📦 Published
- `poly-glot-ai-cli@1.3.0` — [npmjs.com/package/poly-glot-ai-cli](https://www.npmjs.com/package/poly-glot-ai-cli)

---

## [v1.2.0] — 2026-03-26

### 🐛 Bug Fixes

#### 🔍 Language Detection — Complete Rewrite
- **Replaced broken if-else chain with confidence-scoring system** — every language accumulates points across multiple signals; highest score wins
- Go: `package main`, `import (`, `chan`, `defer`, `:=`, `sync.` — was being misidentified as Python or Swift
- Ruby: standalone `end`, `def`+`end` combo, `@ivar`, `elsif`, `attr_*` — was being misidentified as Python
- PHP: `<?php`, `$this->`, `$var=` — was being misidentified as Python
- Swift: `import Foundation/UIKit`, `guard let` — guarded against false positives with Go's `package main`
- Kotlin: `data class`, `fun`, `when()`, `val x: Type`
- All 12 languages verified correct on real-world poorly-commented code samples

#### 🎨 Syntax Highlighter — Complete Rewrite
- **Replaced chained regex approach with single-pass token-based parser**
- Old approach re-processed already-injected HTML — string regex `"[^"]*"` matched `"syntax-keyword"` inside span attributes, causing corrupted nested tags in C#, Rust, Go, C++, Kotlin, Swift, PHP
- New approach: scans source character-by-character into typed tokens (`comment | string | keyword | number | decorator | code`), HTML-escapes exactly once during final emit — never on already-rendered output
- Full keyword sets for all 12 languages (150–200 keywords each)
- Handles: `/* */` blocks, `///` triple-slash, `//` line comments, `#` hash comments, `"""` triple-quoted strings, template literals, escape sequences, hex/float numbers, `@decorators`, C++ `#include`

#### ⚡ Auto Language Detection on Paste
- **Paste always triggers fresh language detection** — clears any manual override, updates both Language and Comment Style dropdowns immediately
- **Score button now always uses the correct language** — detection runs synchronously before scoring, eliminating the race condition where the debounce hadn't fired yet
- Unified `applyDetectedLanguage()` function replaces three separate code paths that could get out of sync
- Auto-detection badge visible for 5 seconds (extended from 3s) with smooth fade

### 🔭 New Features

#### 📡 Anonymous Opt-In Telemetry (CLI)
- CLI now asks once on first use: *"Help improve Poly-Glot by sharing anonymous usage data?"*
- **Strictly opt-in** — nothing is sent until the user explicitly agrees
- **Zero PII** — no API keys, no code, no file paths, no usernames
- Payload: CLI version, command name, language, provider, mode, OS platform, Node.js major version
- Fire-and-forget with 2.5s timeout — never delays a command, never throws, never logs errors
- Control via `poly-glot config --telemetry` / `--no-telemetry`

#### 🛰️ Telemetry Receiver Endpoint
- New Cloudflare Worker deployed at `https://telemetry.poly-glot.ai/cli`
- Full input sanitisation — unknown cmd/lang/provider/os values are replaced, never stored raw
- Writes to Cloudflare Analytics Engine (`cli_telemetry` dataset) — free tier, 100k writes/day, SQL-queryable
- `GET /health` endpoint for smoke testing
- Zero impact on web UI or VS Code extension

#### 🧪 "Try a Sample" Code Strip
- **One-click sample code buttons** above the textarea — no API key needed to see the tool in action
- 6 languages: Python, JavaScript, TypeScript, Go, Rust, Java
- Each button loads a real ~40-line uncommented snippet (caches, rate limiters, event buses, LRU caches — real-world patterns)
- Auto-detects language and syncs Comment Style dropdown on click
- Active button highlights to show which sample is loaded
- Tracks `sample_loaded` event in GA4 per language
- Addresses high bounce rate (67%) caused by users landing on a blank textarea with no clear starting point

### 📦 Published
- `poly-glot-ai-cli@1.2.0` — [npmjs.com/package/poly-glot-ai-cli](https://www.npmjs.com/package/poly-glot-ai-cli)

---

## [v1.1.0] — 2026-03-25

### 🚀 New Features

#### ⌨️ CLI Tool — `poly-glot-ai-cli` (now live on npm!)
- **`npm install -g poly-glot-ai-cli`** — zero-dependency CLI for AI-powered comment generation
- `poly-glot comment <file>` — comment a single file inline
- `poly-glot comment --dir <dir> --output-dir <out>` — recursively comment an entire directory
- `poly-glot comment --stdin --lang python` — pipe code from stdin/stdout
- `poly-glot explain <file>` — deep AI analysis from the terminal
- `poly-glot config` — interactive API key + provider setup
- Supports env vars: `POLYGLOT_API_KEY`, `POLYGLOT_PROVIDER`, `POLYGLOT_MODEL`
- Config stored in `~/.config/polyglot/config.json` with secure `0o600` permissions
- OpenAI + Anthropic support, spinner animations, ANSI colour output

#### 💻 VS Code Extension — `Poly-Glot` (coming soon to Marketplace)
- New command: **"Poly-Glot: Comment File"** — comments entire active file (`Cmd+Shift+Alt+/`)
- New command: **"Poly-Glot: Comment This File"** — right-click any file in Explorer sidebar
- Auto comment style detection based on file language (JSDoc, Javadoc, PyDoc, Doxygen, etc.)
- `polyglot.commentStyle` config setting (default: `auto`)
- Editor title bar button for "Comment File"
- Explorer context menu for all supported file types

#### 🎨 Web App Improvements
- Auto-select comment style on language change with animated "auto" badge feedback
- Updated "Paste your code" → "Paste or upload your code" in How It Works
- New VS Code Extension and CLI sections in overview with install steps
- Version bump to v1.1.0

### 📦 Published
- `poly-glot-ai-cli@1.0.0` → [npmjs.com/package/poly-glot-ai-cli](https://www.npmjs.com/package/poly-glot-ai-cli)

---

## [1.0.0] - 2024-03-22 🎉 LAUNCH!

### 🚀 Major Release: AI-Powered Comment Generation

**Poly-Glot v1.0** transforms from a template library into a complete AI-era documentation tool. Now featuring real-time AI comment generation with OpenAI and Anthropic integration!

### ✨ NEW: AI Comment Generation

**The Game Changer:**
- 🤖 **AI-Powered Generation** - Generate professional JSDoc, Javadoc, PyDoc, and more with GPT-4o, Claude 3.5, and other leading AI models
- 🔑 **Bring Your Own API Key** - Works with your OpenAI or Anthropic API key (stored locally, never sent to our servers)
- 💰 **Cost-Effective** - Most requests cost less than $0.01 (as low as $0.001 with GPT-4o-mini)
- ⚡ **Lightning Fast** - Generate comments in 2-5 seconds
- 🎯 **Smart Formatting** - Automatically applies correct documentation style for each language
- 📊 **Cost Transparency** - See exact cost before and after each generation
- 🔒 **Privacy-First** - Your API key stays in your browser, direct connection to AI providers

**Supported AI Models:**
- **OpenAI**: GPT-4o, GPT-4o-mini ⭐ (recommended), GPT-4-turbo, GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude 3.5 Sonnet ⭐ (recommended), Claude 3 Haiku, Claude 3 Sonnet, Claude 3 Opus

### 🎨 UI/UX Enhancements

**AI Settings Modal:**
- Beautiful dark-themed settings interface
- Provider selection (OpenAI/Anthropic)
- Model selection with cost indicators
- Secure password input with visibility toggle
- Test API connection feature
- Live status indicators (configured/error/not-configured)
- Cost information cards
- Privacy & security documentation

**Generate Comments Workflow:**
- "🤖 Generate Comments" button in main toolbar
- Loading state with professional spinner animation
- Results panel with generated code preview
- Copy to clipboard or replace code options
- Real-time cost display per generation

**Mobile Optimizations:**
- ✨ **NEW**: Horizontal scrolling for "How It Works" steps (1-2-3)
- Smooth scroll-snap behavior for better UX
- iOS momentum scrolling optimization
- Touch-optimized controls throughout
- Zero horizontal overflow (fixed!)
- Responsive modal design
- Full-width buttons on mobile

### 📚 Core Features (v1.0)

**Language Support:**
- 12+ programming languages: Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin
- Language-specific documentation standards (JSDoc, Javadoc, PyDoc, Doxygen, XML docs, GoDoc, Rustdoc, RDoc, PHPDoc, TSDoc, Swift Markup, KDoc)

**Documentation Tools:**
- 🔍 **Code Analysis** - Analyze comment coverage, identify undocumented functions/classes
- 📋 **Copy Templates** - One-click copy for all comment patterns
- 💾 **Favorites System** - Save frequently used templates (localStorage)
- 🔎 **Search Functionality** - Find templates quickly
- 📤 **Export Templates** - Download language-specific templates as text files

**Interactive Features:**
- 🎬 **Animated Demo** - See Poly-Glot transform inconsistent AI comments into standardized docs
- Line-by-line typing animation
- Badge reveal animations
- Before/after comparison
- Statistics showcase (+73% improvement)

**Monetization:**
- ☕ **Buy Me a Coffee** integration - Support development with one-click donations

**Analytics:**
- 📊 **Privacy-First Analytics** - Client-side event tracking (no external servers)
- Track feature usage, demo interactions, AI generation success/failure
- No personal data collection
- Full transparency (see ANALYTICS.md)

### 🛠️ Technical Improvements

**Architecture:**
- Pure HTML/CSS/JavaScript (no frameworks, no build step)
- Client-side AI API integration (no backend required)
- localStorage for API keys, favorites, and settings
- Direct browser → AI provider communication
- Responsive design with CSS Grid & Flexbox
- Mobile-first approach with 3 breakpoints (1024px, 768px, 480px)

**Performance:**
- Lazy initialization of AI generator
- Efficient DOM manipulation
- Smooth animations with CSS transitions
- Optimized for mobile devices
- Fast page load (static HTML)

**Security:**
- API keys stored in browser localStorage only
- No server-side storage or transmission
- Secure password input fields
- Content Security Policy ready
- No third-party tracking scripts

### 📖 Documentation

**New Documentation:**
- Comprehensive README with AI generation guide
- ANALYTICS.md - Privacy-focused analytics documentation
- CHANGELOG.md - This file!
- Inline code documentation (JSDoc)

**Usage Guide:**
- Step-by-step AI settings configuration
- API key acquisition links (OpenAI, Anthropic)
- Cost breakdown and recommendations
- Privacy guarantees
- Troubleshooting tips

### 🎯 Value Proposition

**For Individual Developers:**
- Save hours writing documentation
- Ensure consistency across projects
- Learn proper documentation styles
- Cost: ~$0.10 for 100 functions

**For AI Users (ChatGPT, Copilot, Claude):**
- Transform inconsistent AI-generated comments
- Apply team standards to AI code
- Fix poorly formatted documentation
- Production-ready comments instantly

**For Teams:**
- Standardize documentation across codebase
- Onboard new developers faster
- Improve code review quality
- Reduce technical debt
- Enforce documentation standards

### 🐛 Bug Fixes

- Fixed horizontal overflow on mobile devices
- Fixed vertical scrolling issues on mobile
- Improved responsive layout for demo section
- Fixed demo animation timing
- Resolved scale transform issues on mobile (disabled for touch devices)

### 🔧 Technical Details

**Files Added:**
- `ai-generator.js` - AI comment generation engine (330 lines)
- `CHANGELOG.md` - This changelog
- Enhanced `index.html` with AI Settings modal
- Enhanced `app.js` with AI integration (400+ new lines)
- Enhanced `styles.css` with modal styles (450+ new lines)

**Dependencies:**
- None! Pure vanilla JavaScript
- Google Fonts: Inter & Fira Code
- AI APIs: OpenAI, Anthropic (user-provided)

**Browser Support:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

### 📊 Statistics

**Launch Metrics:**
- 1,500+ lines of code added
- 19 commits to main branch
- 8 major features shipped
- 12+ languages supported
- 2 AI providers integrated
- 9 AI models available
- 100% mobile responsive
- 0 external dependencies
- $0.001 minimum cost per generation

### 🙏 Acknowledgments

Built with ❤️ for the developer community. Special thanks to:
- The AI coding community for inspiration
- OpenAI and Anthropic for powerful APIs
- Early testers and feedback providers
- Buy Me a Coffee supporters ☕

### 🔮 What's Next?

**Planned for v1.1:**
- Syntax highlighting in code editor
- More language support (SQL, R, Scala, Dart)
- Custom documentation templates
- Batch processing (multiple files)

**Future Vision:**
- VS Code extension
- GitHub Actions integration
- Team collaboration features
- CI/CD pipeline plugins
- Premium tier with managed API keys

---

## Release Notes

### How to Upgrade

This is the initial v1.0 release. No upgrade needed!

### Breaking Changes

None - first release!

### Migration Guide

Not applicable for v1.0.

---

## Support

- 🐛 **Report Bugs**: [GitHub Issues](https://github.com/hmoses/poly-glot/issues)
- 💡 **Feature Requests**: [GitHub Issues](https://github.com/hmoses/poly-glot/issues)
- ☕ **Support Development**: [Buy Me a Coffee](https://buymeacoffee.com/hmoses)
- 📧 **Contact**: [@hmoses](https://github.com/hmoses)

---

**[View on GitHub](https://github.com/hmoses/poly-glot)** | **[Live Demo](https://hmoses.github.io/poly-glot/)** | **[Documentation](https://github.com/hmoses/poly-glot#readme)**

---

*Poly-Glot - Transform AI comments into standardized documentation. Privacy-first. Cost-effective. Production-ready.*

**Made with 💻 and ☕ by developers, for developers**
