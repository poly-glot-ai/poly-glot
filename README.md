# 🌐 Poly-Glot — Code Comment Library

> **A comprehensive, AI-powered library of coding comment patterns and best practices for 12 programming languages.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-poly--glot.ai-blue?style=for-the-badge)](https://poly-glot.ai/)
[![Built with Goose](https://img.shields.io/badge/Built_with-Goose_AI-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyeiIvPjwvc3ZnPg==)](https://github.com/block/goose)
[![AGPL-3.0 License](https://img.shields.io/badge/License-AGPL--3.0-blue?style=for-the-badge)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Hosted_on-GitHub_Pages-222?style=for-the-badge&logo=github)](https://poly-glot.ai/)
[![GitHub stars](https://img.shields.io/github/stars/hmoses/poly-glot?style=for-the-badge&logo=github&color=yellow)](https://github.com/hmoses/poly-glot)

> ⭐ **922 installs on Day 1. If Poly-Glot saves you time, a star helps other developers find it.**  
> → [**Star this repo**](https://github.com/hmoses/poly-glot)

<!-- npm-stats-start -->
> 📦 **npm install stats** *(updated daily)*
> | Period | Downloads |
> |--------|-----------|
> | Yesterday | **846** |
> | Last 7 days | **922** |
> | All time | **922** |
>
> *Last updated: 2026-03-27*
<!-- npm-stats-end -->

---

**Before:** Inconsistent AI comments → **After:** Professional JSDoc standard
**Result:** 12% comment coverage → 85% coverage (+73% improvement)

[Try the live demo](https://hmoses.github.io/poly-glot/) and click "▶️ Play Demo" to see the transformation!

---

## ✨ Features

### 🤖 **AI-Powered Comment Generation** ⚡ NEW!
- **Generate professional comments instantly** using GPT-4o, Claude 3.5, or other AI models
- **Bring your own API key** — Works with OpenAI and Anthropic APIs
- **Privacy-first**: Your API key stays in your browser (localStorage), never sent to our servers
- **Cost-effective**: Most requests cost less than $0.01 (as low as $0.001 with GPT-4o-mini)
- **Smart formatting**: Automatically applies language-specific documentation standards
- **Real-time cost tracking**: See estimated cost before and after each generation
- **One-click integration**: Copy or replace your code with AI-generated comments

### 📚 **Comprehensive Language Support**
- **12 Programming Languages**: Python, JavaScript, Java, C++, C#, Go, Rust, Ruby, PHP, TypeScript, Swift, and Kotlin
- Language-specific documentation standards (JSDoc, Javadoc, PyDoc, Doxygen, etc.)
- Single-line, multi-line, and documentation comment syntax for each language

### 🎨 **Interactive Templates**
- Pre-built, well-commented function examples
- Class documentation templates
- Real-world code snippets
- Copy-to-clipboard functionality for instant use

### 🔍 **Code Analysis Tool**
- Analyze your code for comment coverage
- Identify undocumented functions and classes
- Calculate comment-to-code ratios
- Get actionable suggestions for improvement

### 📖 **Best Practices Guide**
- Language-specific commenting conventions
- General documentation principles
- When to comment vs. when to refactor
- Industry-standard documentation formats

### 💾 **Favorites System**
- Bookmark frequently used templates
- Persistent storage using localStorage
- Quick access to saved snippets

### 🎓 **Learning Resources**
- Side-by-side template and code editor view
- Curated examples for common patterns
- Search functionality across all templates
- Export templates as text files

---

## 🔒 Security

Poly-Glot is designed from the ground up with a **privacy-first, zero-trust architecture**. Your code and credentials never leave your machine.

### 🏗️ Architecture: Fully Client-Side

Poly-Glot is a **100% static, client-side application** — there is no backend server, no database, and no middleman. Everything runs directly in your browser.

| Component | Where it runs | Data stored |
|-----------|--------------|-------------|
| Templates & Language Data | Your browser | None (bundled in JS) |
| AI API calls | Direct browser → OpenAI/Anthropic | Never cached server-side |
| API Keys | Your browser `localStorage` only | Never transmitted to us |
| Favorites | Your browser `localStorage` | Never leaves your device |
| Usage Analytics | Your browser `localStorage` | Session data only, local |

### 🔑 API Key Handling

- Your OpenAI or Anthropic API key is stored **only in your browser's `localStorage`**
- API calls are made **directly from your browser** to OpenAI/Anthropic — Poly-Glot servers are never in the request path
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

### 1. **Configure AI Settings** 🤖 (Optional but Recommended)
1. Click the **"⚙️ AI Settings"** button in the header
2. Choose your AI provider (OpenAI or Anthropic)
3. Select your preferred model (GPT-4o-mini recommended for cost)
4. Enter your API key from [OpenAI](https://platform.openai.com/api-keys) or [Anthropic](https://console.anthropic.com/settings/keys)
5. Click **"Test Connection"** to verify your key works
6. Click **"Save Settings"** — your key is stored locally in your browser only

> **Privacy Note:** Your API key never leaves your browser and is stored in `localStorage`. All AI calls go directly from your browser to OpenAI/Anthropic.

### 2. **Generate AI Comments** ⚡
1. Select your programming language from the dropdown
2. Paste your undocumented code into the editor
3. Click **"🤖 Generate Comments"**
4. Review the AI-generated comments with proper documentation format
5. Click **"Apply"** to replace your code or **"Copy"** to use it elsewhere

### 3. **Browse Templates**
1. Select a language from the sidebar
2. Choose a category (Syntax, Functions, Classes, Best Practices)
3. Click any template to view it in full
4. Use **"Copy"** to grab the snippet instantly

### 4. **Analyze Your Code**
1. Navigate to the **"Interactive Editor"** category
2. Paste your code into the right panel
3. Click **"Analyze"** to get a comment coverage report
4. Review suggestions and apply templates as needed

### 5. **Save Favorites** ⭐
- Click the ⭐ on any template to save it
- Access all saved templates under the **"⭐ Favorites"** sidebar item
- Favorites persist across browser sessions via `localStorage`

---

## 📁 Project Structure

```
poly-glot/
├── index.html                    # Main application entry point
├── styles.css                    # All styling (CSS variables, responsive design)
├── app.js                        # Application logic and templates
├── ai-generator.js               # AI comment generation (OpenAI/Anthropic)
├── analytics.js                  # Privacy-first analytics system
├── README.md                     # This file
├── ANALYTICS.md                  # Analytics documentation
├── CHANGELOG.md                  # Version history
├── GOOGLE_ANALYTICS_SETUP.md     # GA4 setup guide
├── LICENSE                       # MIT License
└── .gitignore                    # Git ignore rules
```

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 🎯 Supported Languages & Documentation Standards

| Language   | Doc Standard        | Comment Syntax       |
|------------|---------------------|----------------------|
| Python     | Sphinx/Google/NumPy | `#`, `"""`           |
| JavaScript | JSDoc               | `//`, `/* */`, `/**` |
| Java       | Javadoc             | `//`, `/* */`, `/**` |
| C++        | Doxygen             | `//`, `/* */`, `/**` |
| C#         | XML Documentation   | `//`, `/* */`, `///` |
| Go         | GoDoc               | `//`, `/* */`        |
| Rust       | Rustdoc             | `//`, `/* */`, `///` |
| Ruby       | RDoc/YARD           | `#`, `=begin/end`    |
| PHP        | PHPDoc              | `//`, `/* */`, `/**` |
| TypeScript | TSDoc               | `//`, `/* */`, `/**` |
| Swift      | Swift Markup        | `//`, `/* */`, `///` |
| Kotlin     | KDoc                | `//`, `/* */`, `/**` |

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Adding New Languages
1. Fork the repository
2. Add language patterns to `commentPatterns` object in `app.js`
3. Include: single-line, multi-line, and docstring syntax
4. Add function and class examples
5. List best practices (minimum 5)
6. Submit a pull request

### Adding Examples
Add real-world code examples to the `examples` object in `app.js`:

```javascript
languagename: [
    {
        title: 'Example Title',
        category: 'Category Name',
        code: `your code here`
    }
]
```

### Reporting Issues
Found a bug or have a suggestion? Please open an issue with:
- Clear description
- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Browser and version

---

## 📝 License

Poly-Glot AI is licensed under **GNU Affero General Public License v3.0 (AGPL-3.0)**.

### What This Means:

✅ **Free to use** - For personal, educational, and open-source projects  
✅ **Free to modify** - Fork, customize, and improve  
✅ **Network copyleft** - If you run modified versions as a service, you must share source code  

### 💼 Commercial & Enterprise Licensing

Need to integrate Poly-Glot into proprietary software or offer it as a service without open-sourcing your modifications?

**Commercial licenses available for:**
- 🏢 **Enterprise Integration** - Embed Poly-Glot in your commercial product
- ☁️ **SaaS/Hosting** - Run Poly-Glot as a service without AGPL obligations
- 🎯 **Custom Features** - Priority development and support
- 🔒 **White-label** - Rebrand and resell

**Contact:** hwmoses2@icloud.com

See [LICENSE](LICENSE) for full terms.

---

## 🌟 Acknowledgments

- Inspired by the need for quick reference to commenting conventions across languages
- Built with ❤️ for the developer community
- Font: [Inter](https://fonts.google.com/specimen/Inter) & [Fira Code](https://fonts.google.com/specimen/Fira+Code)
- **Built entirely with [Goose](https://github.com/block/goose)** — an open-source AI agent by [Block](https://block.xyz) that autonomously planned, scaffolded, and iterated on every feature in this project

---

## 🤖 Built with Goose

Poly-Glot was designed and built end-to-end using **[Goose](https://github.com/block/goose)**, an open-source, extensible AI agent developed by [Block](https://block.xyz) (the parent company of Square, Cash App, and Tidal).

Goose autonomously:
- 🏗️ Scaffolded the entire project architecture
- 🎨 Designed and implemented the UI/UX
- 🤖 Built the AI comment generation engine
- 🔒 Implemented the privacy-first analytics system
- 📦 Wrote all 12 language template libraries
- 🚀 Set up GitHub Pages deployment
- 📊 Integrated Google Analytics
- 📝 Authored and maintained this documentation

> *This project is a real-world showcase of what's possible when you pair a developer with an AI agent. Every commit, every feature, every line of documentation was guided by a human but executed by Goose.*

**Try Goose yourself:** [github.com/block/goose](https://github.com/block/goose)

---

## 📬 Contact

- **GitHub**: [@hmoses](https://github.com/hmoses)
- **Issues**: [GitHub Issues](https://github.com/hmoses/poly-glot/issues)

---

## 🗺️ Roadmap

- [x] **AI-powered comment generation** ✅ (GPT-4o, Claude 3.5 — LIVE!)
- [x] **Google Analytics integration** ✅
- [x] **Privacy-first local analytics** ✅
- [ ] Add syntax highlighting to code editor
- [ ] More language support (SQL, R, Scala, Dart, etc.)
- [ ] Dark/light theme toggle
- [ ] Export to various formats (Markdown, JSON)
- [ ] Backend API for premium features
- [ ] GitHub Sponsors integration
- [ ] VS Code extension
- [ ] Mobile app version
- [ ] Team collaboration features
- [ ] CI/CD integration plugins

---

---

# 🚀 Prompt Poly-Glot.AI ⚡ NEW!

> **Professional Prompt Engineering with Human-in-the-Loop Testing**

**🌐 Live App:** [https://hmoses.github.io/poly-glot/prompt/](https://hmoses.github.io/poly-glot/prompt/)

## Overview

**Prompt Poly-Glot.AI** is the second tool in the Poly-Glot Suite - a professional prompt engineering platform for creating, testing, and refining prompts for OpenAI and Anthropic APIs. With advanced Human-in-the-Loop testing, quality metrics, and intelligent suggestions, it's the professional's choice for prompt engineering.

## 🌟 Key Features

### 🔄 Human-in-the-Loop Testing
- Test prompts with mock AI responses
- Quality metrics dashboard (Clarity, Completeness, Tone)
- Smart improvement suggestions powered by analysis
- Version control with diff view
- A/B comparison mode for testing variants

### 🎨 Variable System
- Use `{{variable}}` syntax for reusable templates
- Auto-detection of variables from template
- Configurable input types (text, textarea, dropdown, number)
- Real-time preview updates as you type

### 🌐 Multi-Provider Export
- **OpenAI Format**: Valid JSON for GPT-4, GPT-3.5, etc.
- **Anthropic Format**: Valid JSON for Claude 3.5 Sonnet, Opus, etc.
- **cURL Commands**: Ready-to-use API calls for both providers
- **Plain Text**: Simple rendered output

### 📚 Template Library
8 professional pre-built templates:
- **Code Review Assistant** - Review code for security, performance, best practices
- **Content Writer** - Create blog posts, articles, marketing copy
- **Data Analyst** - Analyze datasets and generate insights
- **Translation Expert** - Accurate, context-aware translations
- **Summarization Tool** - Concise summaries of any content
- **Creative Storyteller** - Narrative writing and storytelling
- **Technical Documentation** - Developer docs and guides
- **Customer Support** - Empathetic customer service responses

### 💾 Advanced Features
- Auto-save to localStorage every 2 seconds
- Character and token counter (real-time)
- Real-time syntax highlighting for `{{variables}}`
- Import/export templates as JSON
- Share prompts via URL (base64 encoded)
- Export test reports with iteration history
- Works completely offline after first load

## 🎯 Quick Example

Create a reusable template:
```
You are a {{role}} assistant with expertise in {{domain}}.

Task: {{task}}

Requirements:
- Tone: {{tone}}
- Output format: {{format}}

Additional context:
{{context}}
```

Then:
1. Fill in the variables (auto-detected on right panel)
2. Test with mock AI in Human-in-the-Loop tab
3. Review quality metrics
4. Apply improvement suggestions
5. Export in OpenAI or Anthropic format
6. Use in production!

## 📖 Documentation

See [/prompt/README.md](./prompt/README.md) for detailed documentation.

## 🚀 Get Started

**Visit:** [https://hmoses.github.io/poly-glot/prompt/](https://hmoses.github.io/poly-glot/prompt/)

Start engineering better prompts today - no installation or account required!

---

<div align="center">

**Made with 💻 and ☕ by developers, for developers**

**Powered by [Goose](https://github.com/block/goose) 🪿 — the open-source AI agent by [Block](https://block.xyz)**

⭐ Star this repository if you found it helpful!

</div>
