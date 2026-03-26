# 📝 Poly-Glot Changelog

All notable changes to Poly-Glot will be documented in this file.

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
