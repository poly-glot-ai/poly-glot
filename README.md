# 🌐 Poly-Glot — Code Comment Library

> **A comprehensive, AI-powered library of coding comment patterns and best practices for 12 programming languages.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-poly--glot.ai-blue?style=for-the-badge)](https://poly-glot.ai/)
[![VS Code](https://img.shields.io/badge/VS_Code-Extension-007ACC?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)
[![npm CLI](https://img.shields.io/badge/npm-poly--glot--ai--cli-CB3837?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/poly-glot-ai-cli)

> ⭐ **922 installs on Day 1. If Poly-Glot saves you time, a star helps other developers find it.**  
> Found a bug or have a feature request? [Open an issue](https://github.com/hmoses/poly-glot/issues)

> 📦 **npm install stats** *(updated daily)*

---

## What is Poly-Glot?

Poly-Glot is a **zero-backend, privacy-first AI tool** that transforms undocumented code into professionally commented code — instantly.

- **Works in 12 programming languages** — JavaScript, Python, TypeScript, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin
- **Three comment modes** — doc-comments (JSDoc/PyDoc/Javadoc…), why-comments (reasoning & intent), or both in one pass
- **Bring your own API key** — Works with OpenAI and Anthropic APIs
- **Privacy-first**: Your API key stays in your browser (localStorage), never sent to our servers
- **Available everywhere** — Web UI, CLI tool, VS Code extension, GitHub Copilot Chat participant

---

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| 🌐 **Web UI** | Browser-based editor at [poly-glot.ai](https://poly-glot.ai/) — no install needed |
| 📦 **CLI** | `npm install -g poly-glot-ai-cli` — batch processing, CI/CD, scripting |
| 🔌 **VS Code Extension** | Inline comments via Command Palette or keyboard shortcut |
| 🤖 **Copilot Chat** | `@poly-glot` participant — works directly in GitHub Copilot Chat |

---

## 🔒 Privacy & Security

### Your API Key
- Your OpenAI or Anthropic API key is stored **only in your browser's `localStorage`**
- **Zero backend** — Poly-Glot has no server, no proxy, no middleman
- All AI API calls go **directly from your browser to OpenAI/Anthropic**
- You can inspect every network request in your browser's DevTools — there are zero calls to any Poly-Glot backend
- Keys can be cleared at any time via the AI Settings panel or by clearing browser storage

### 📊 Analytics & Privacy

Poly-Glot uses a **dual-layer analytics approach**, both fully transparent:

1. **Built-in Privacy Analytics** (`analytics.js`)
   - Tracks only anonymous usage patterns (language selections, feature clicks, session duration)
   - **No personally identifiable information (PII) collected — ever**
   - All data stored locally in `localStorage` — never sent to external servers
   - You can export or delete your analytics data at any time via the browser console:
     ```js
     showAnalytics()           // View your session stats
     polyglotAnalytics.exportData()  // Download as JSON
     polyglotAnalytics.clearData()   // Delete everything
     ```

2. **Google Analytics 4** (GA4)
   - Used to understand aggregate traffic patterns (page views, geography, device type)
   - Subject to [Google's Privacy Policy](https://policies.google.com/privacy)
   - Can be blocked with any standard ad-blocker or privacy extension (uBlock Origin, Privacy Badger, etc.)
   - No cross-site tracking; no ad retargeting

### 🌐 Content Security

- The app is hosted on **GitHub Pages** — a trusted, audited static hosting platform
- All source code is **fully open source** and publicly auditable at [github.com/hmoses/poly-glot](https://github.com/hmoses/poly-glot)
- No third-party SDKs beyond Google Fonts and the gtag.js analytics snippet
- No cookies set by Poly-Glot itself
- No user accounts, no sign-up, no email collection

### 🔐 What Poly-Glot Will Never Do

- ❌ Store or log your API keys on any server
- ❌ Proxy your AI requests through our infrastructure
- ❌ Sell or share your usage data
- ❌ Require an account or authentication
- ❌ Set tracking cookies

> **TL;DR:** Poly-Glot has no backend. Your keys, your code, and your data stay in your browser. Always.

---

## 🚀 Quick Start

### Online Version
Simply visit **[https://hmoses.github.io/poly-glot/](https://hmoses.github.io/poly-glot/)** — no installation required.

```bash
# Clone the repository
git clone https://github.com/hmoses/poly-glot.git

# Navigate to the directory
cd poly-glot

# Open in your browser
open index.html
# or serve locally
python -m http.server 8000  # Then visit http://localhost:8000
```

### Local Development Server

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

---

## 📋 Usage Guide

### 1. **Add Your API Key** 🔑
1. Click the **"⚙️ AI Settings"** button in the header
2. Choose your AI provider (OpenAI or Anthropic)
3. Select your preferred model (GPT-4o-mini recommended for cost)
4. Enter your API key from [OpenAI](https://platform.openai.com/api-keys) or [Anthropic](https://console.anthropic.com/settings/keys)
5. Click **"Test Connection"** to verify your key works
6. Click **"Save Settings"** — your key is stored locally in your browser only

> **Privacy Note:** Your API key never leaves your browser and is stored in `localStorage`. All AI calls go directly from your browser to OpenAI/Anthropic.

### 2. **Install the CLI, Paste, or Upload Your Code** ⚡
- **Web:** Select your programming language from the dropdown and paste your undocumented code into the editor
- **Upload:** Drag and drop or use the upload button to load a code file directly
- **CLI:** See below for full setup instructions ↓

#### CLI Setup

**Install:**
```bash
npm install -g poly-glot-ai-cli
```

**Add your API key** (one-time setup):
```bash
poly-glot config
```
You will be prompted to choose your provider (OpenAI or Anthropic), paste your API key, and pick a default model.

Get your key from:
- OpenAI → [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Anthropic → [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

Or pass it non-interactively:
```bash
# OpenAI
poly-glot config --key sk-proj-... --provider openai --model gpt-4.1-mini

# Anthropic
poly-glot config --key sk-ant-api03-... --provider anthropic --model claude-sonnet-4-5
```

Or via environment variables (ideal for CI/CD):
```bash
export POLYGLOT_API_KEY=sk-proj-...
export POLYGLOT_PROVIDER=openai    # openai | anthropic
export POLYGLOT_MODEL=gpt-4.1-mini
```

> 🔒 Your key is stored locally only — never sent to Poly-Glot servers. All AI calls go directly from your machine to OpenAI/Anthropic.

**Then run:**
```bash
poly-glot comment yourfile.js
```

### 3. **Click "Generate Comments"** 🤖
1. Click **"🤖 Generate Comments"**
2. Review the AI-generated comments with proper documentation format
3. Click **"Apply"** to replace your code or **"Copy"** to use it elsewhere

### 4. **Get Standardized Docs Instantly** 📄
