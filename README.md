# 🌐 Poly-Glot — Code Comment Library

> **A comprehensive, AI-powered library of coding comment patterns and best practices for 12 programming languages.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-poly--glot.ai-blue?style=for-the-badge)](https://poly-glot.ai/)
[![NPM Version](https://img.shields.io/npm/v/poly-glot-ai-cli?style=for-the-badge&color=green)](https://www.npmjs.com/package/poly-glot-ai-cli)
[![VS Code](https://img.shields.io/badge/VS_Code-Extension-007ACC?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

> ⭐ **922 installs on Day 1. If Poly-Glot saves you time, a star helps other developers find it.**  

---

> 📦 **npm install stats** *(updated daily)*

---

## 🎯 What is Poly-Glot?

Poly-Glot is an AI-powered code documentation tool that adds standardized comments to your code across 12 programming languages. It supports multiple comment styles:

- **Doc comments** — JSDoc, PyDoc, Javadoc, TSDoc, and more
- **Why comments** — explains the reasoning, trade-offs, and intent
- **Both modes** — two-pass AI run combining doc + why

### Key features

- **Bring your own API key** — Works with OpenAI and Anthropic APIs
- **Privacy-first**: Your API key stays in your browser (localStorage), never sent to our servers
- **Twelve languages**: JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin
- **Multiple interfaces**: Web UI, CLI tool, VS Code Extension, and GitHub Copilot Chat participant
- **Free tier**: JavaScript, Python, and Java — no account required

---

## 🛡️ Privacy & Security

### 🔑 Your API Keys are Safe

- Your OpenAI or Anthropic API key is stored **only in your browser's `localStorage`**
- Keys are **never transmitted to Poly-Glot servers** — there are no Poly-Glot servers involved in AI generation
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

Your code is transformed with:
- **Function-level doc comments** with parameter types and return values
- **Class-level documentation** with purpose and usage examples  
- **Inline code explanations** for complex logic
- **JSDoc/PyDoc/Javadoc formatting** matching your language's conventions

---

## 🌍 Supported Languages

| Language | Doc Style | Free Tier | Pro |
|----------|-----------|-----------|-----|
| JavaScript | JSDoc | ✅ | ✅ |
| Python | Google/NumPy docstrings | ✅ | ✅ |
| Java | Javadoc | ✅ | ✅ |
| TypeScript | TSDoc | — | ✅ |
| C++ | Doxygen | — | ✅ |
| C# | XML doc comments | — | ✅ |
| Go | GoDoc | — | ✅ |
| Rust | `///` doc comments | — | ✅ |
| Ruby | YARD | — | ✅ |
| PHP | PHPDoc | — | ✅ |
| Swift | Swift Markup | — | ✅ |
| Kotlin | KDoc | — | ✅ |

---

## 🤖 Comment Styles

### Doc Comments (default mode)
Standardized language-specific documentation comments:

```javascript
// Before
function calculateDiscount(price, userType, quantity) {
  if (userType === 'premium' && quantity > 10) {
    return price * 0.85;
  }
  return price * (userType === 'premium' ? 0.9 : 0.95);
}
```

```javascript  
// After (Poly-Glot output)
/**
 * Calculates the discount applied to a purchase based on user type and quantity.
 *
 * @param {number} price - The original price before discount
 * @param {string} userType - The customer tier ('premium' or 'standard')
 * @param {number} quantity - Number of items in the order
 * @returns {number} The discounted price after applying tier and volume rules
 */
function calculateDiscount(price, userType, quantity) {
  if (userType === 'premium' && quantity > 10) {
    return price * 0.85;
  }
  return price * (userType === 'premium' ? 0.9 : 0.95);
}
```

### Why Comments (--why mode)
Inline comments explaining reasoning and intent:

```javascript
function calculateDiscount(price, userType, quantity) {
  // why: premium + bulk threshold (>10) triggers the steepest discount (15%)
  // to reward high-value customers and encourage larger order sizes
  if (userType === 'premium' && quantity > 10) {
    return price * 0.85; // why: 15% discount — highest tier
  }
  // why: standard premium discount (10%) for lower quantities;
  // non-premium users get a smaller loyalty discount (5%)
  return price * (userType === 'premium' ? 0.9 : 0.95);
}
```

---

## 🔧 CLI Tool

For batch processing, CI/CD pipelines, and terminal workflows:

```bash
# Install globally
npm install -g poly-glot-ai-cli

# Configure your API key (one-time)
poly-glot config

# Comment a single file
poly-glot comment utils.py

# Comment with why-mode
poly-glot comment utils.py --why

# Preview changes without writing
poly-glot comment utils.py --dry-run

# Comment entire directory
poly-glot comment --dir ./src --output-dir ./commented
```

Full CLI documentation: [cli/README.md](cli/README.md)

---

## 📁 Repository Structure

```
poly-glot/
├── index.html          # Main web app
├── app.js              # Core application logic
├── ai-generator.js     # AI comment generation engine
├── auth.js             # Authentication & user management
├── pricing.js          # Subscription & billing logic
├── scorer.js           # Code quality scoring
├── styles.css          # Main stylesheet
├── phase1.css          # Feature-phase styles
├── pricing.css         # Pricing page styles
├── cli/                # CLI tool source (poly-glot-ai-cli)
│   ├── README.md
│   ├── src/
│   └── package.json
├── vscode-extension/   # VS Code extension source
├── poly-glot-mcp/      # MCP server source
└── team-dashboard/     # Team analytics dashboard
```

---

## 🧰 Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript — no framework dependencies
- **AI Providers**: OpenAI API (GPT-4o-mini, GPT-4o, o3) and Anthropic API (Claude Sonnet, Haiku, Opus)
- **Hosting**: GitHub Pages (zero backend)
- **CLI**: Node.js with zero runtime dependencies
- **Analytics**: Privacy-first local analytics + Google Analytics 4
- **Auth**: Firebase Authentication (Google, GitHub, email)
- **Payments**: LemonSqueezy

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/add-new-language`
3. Make your changes and test them
4. Submit a pull request

Please maintain the existing code style and add tests where applicable.

---

## 📄 License

This project is licensed under the **Poly-Glot Source Available License**. You may use, study, and modify this code for personal and non-commercial purposes. Commercial use, redistribution, and creating competing services are not permitted without explicit written permission.

See the [LICENSE](LICENSE) file for full terms.

---

## 🔗 Links

- **Web App**: [poly-glot.ai](https://poly-glot.ai)
- **VS Code Extension**: [marketplace.visualstudio.com](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)
- **npm Package**: [npmjs.com/package/poly-glot-ai-cli](https://www.npmjs.com/package/poly-glot-ai-cli)
- **Issues**: [GitHub Issues](https://github.com/poly-glot-ai/poly-glot/issues)

---

## 💬 Prompt Engineering Tips

For best results with Poly-Glot:

### Comment density
- Use `--both` mode for maximum documentation density
- Smaller, focused functions get more accurate comments
- Complex algorithms benefit from `--why` mode to explain intent

### Model selection
- **GPT-4.1-mini** or **Claude Sonnet**: Best balance of quality and cost
- **GPT-4.1-nano** or **Claude Haiku**: Maximum speed, great for large codebases
- **o3** or **Claude Opus**: Deepest analysis for critical path code

### Language tips
- Python: Works best with Google-style docstrings for type hints
- TypeScript: TSDoc format integrates with VS Code IntelliSense
- Java: Javadoc output is compatible with Maven Javadoc plugin

---

Start engineering better prompts today - no installation or account required!
