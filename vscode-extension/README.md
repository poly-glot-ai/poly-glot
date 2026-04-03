# Poly-Glot — AI Code Comments, JSDoc Generator & Code Documentation

> **The fastest way to generate JSDoc, Javadoc, PyDoc, Doxygen, KDoc, rustdoc, and "why" comments** — powered by OpenAI (GPT-4.1, GPT-4o, o3) or Anthropic (Claude Sonnet 4, Claude Opus 4, Claude Haiku 4). Works in VS Code, CLI, MCP, and Copilot Chat. 100% client-side. Your API key never leaves your machine.

[![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/poly-glot-ai.poly-glot?label=version&color=007acc&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/poly-glot-ai.poly-glot?label=installs&color=007acc&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/poly-glot-ai.poly-glot?label=rating&color=f5a623&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

---

## 🎬 See It In Action

[![Poly-Glot AI — Demo Video](https://img.youtube.com/vi/uIi7pbe5H6c/hqdefault.jpg)](https://youtu.be/uIi7pbe5H6c)

> *Click the thumbnail to watch the demo on YouTube*

---

## ✨ What is Poly-Glot?

**Poly-Glot** is a VS Code extension that uses AI to write your code documentation for you — in seconds. Select a function, press a shortcut, and get perfect, language-native comments inserted directly into your file.

- 🗂 **JSDoc / TSDoc** for JavaScript & TypeScript
- 📖 **Javadoc** for Java
- 🐍 **PyDoc / Google-style docstrings** for Python
- ⚙️ **Doxygen** for C / C++
- 📝 **XML doc comments** for C#
- 🦀 **rustdoc** for Rust
- 🐹 **GoDoc** for Go
- 🐘 **PHPDoc** for PHP
- 💎 **YARD** for Ruby
- 🍎 **Swift markup** for Swift
- 🎯 **KDoc** for Kotlin
- 🗃 **SQL header blocks** for SQL

Powered by **OpenAI** (GPT-4o, GPT-4, o1, o3-mini) and **Anthropic** (Claude Sonnet 4, Claude Opus 4, Claude Haiku). You bring your own API key — **no middleman, no markup, no data collection**.

---

## 🆓 Free vs 💎 Pro vs 👥 Team vs 🏢 Enterprise

| Feature | Free | Pro | Team | Enterprise |
|---|:---:|:---:|:---:|:---:|
| Generate doc-comments (JSDoc, Javadoc, PyDoc…) | ✅ | ✅ | ✅ | ✅ |
| Explain Code — deep AI analysis panel | ✅ | ✅ | ✅ | ✅ |
| JavaScript, TypeScript, Python, Java | ✅ | ✅ | ✅ | ✅ |
| C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin, SQL | 🔒 | ✅ | ✅ | ✅ |
| **Why-Comments** — intent & trade-off inline notes | 🔒 | ✅ | ✅ | ✅ |
| **Both Mode** — doc + why comments in one pass | 🔒 | ✅ | ✅ | ✅ |
| Templates Sidebar | ✅ | ✅ | ✅ | ✅ |
| Real-time cost tracking in status bar | ✅ | ✅ | ✅ | ✅ |
| Files generated per month | 50 | **Unlimited** | **Unlimited** | **Unlimited** |
| Shared team license token | ❌ | ❌ | ✅ | ✅ |
| Priority support | ❌ | ✅ | ✅ | ✅ |
| SLA + private deployment | ❌ | ❌ | ❌ | ✅ |
| **Seats** | **1** | **1** | **Up to 5** | **Contact us** |
| **Price** | **$0** | **$9/mo** | **$29/mo** | **Custom** |

### 💎 Upgrade

👉 **[View plans → poly-glot.ai/#pg-pricing-section](https://poly-glot.ai/#pg-pricing-section)**

📧 **Enterprise & Team inquiries: [hwmoses2@icloud.com](mailto:hwmoses2@icloud.com)**

After subscribing, open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) → **`Poly-Glot: Configure License Token`** to activate instantly.

---

## 🚀 Getting Started in 60 Seconds

1. **Install** Poly-Glot from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)
2. **Add your API key** → Command Palette → `Poly-Glot: Configure API Key`
   - Choose **OpenAI** or **Anthropic** as your provider
   - Pick your preferred model (we recommend `gpt-4.1-mini` or `claude-sonnet-4-5`) — or enter any custom model ID
   - Paste your API key (stored securely in the OS keychain — never in `settings.json`)
3. **Select any function or block of code** in the editor
4. **Press `Cmd+Shift+/`** (`Ctrl+Shift+/` on Windows/Linux) → comments appear inline instantly

That's it. No backend, no account required for the Free tier, no telemetry.

---

## 🛠 Features

### 📝 Generate AI Comments — `Cmd+Shift+/` / `Ctrl+Shift+/` (Free)

Select code (or leave nothing selected for the whole file) and Poly-Glot writes perfectly formatted, language-native documentation comments and inserts them directly into your file.

**What gets generated:**
- Function/method summaries in plain English
- `@param` / `@returns` / `@throws` tags (JSDoc, Javadoc, KDoc…)
- Type annotations where applicable
- Edge-case and exception notes
- Language-appropriate formatting — always

No more manually writing boilerplate Javadoc or hunting for the correct JSDoc syntax.

---

### 💡 Why-Comments — `Cmd+Shift+W` / `Ctrl+Shift+W` (Pro)

AI inserts **inline comments that explain *why* the code exists** — not just what it does.

Captures:
- Trade-offs and design decisions
- Non-obvious algorithmic choices
- Performance or security considerations
- Historical context that would otherwise live only in a developer's head

Why-Comments give AI assistants (GitHub Copilot, Cursor, etc.) the context they need to give *you* better suggestions. They make PRs self-reviewing and onboarding dramatically faster.

---

### 🔀 Both Mode — `Cmd+Shift+B` / `Ctrl+Shift+B` (Pro)

Generates **doc-comments AND why-comments in a single API call**. One shortcut, full documentation coverage. Use this on any function you want fully documented before a code review.

---

### 🔍 Explain Code — `Cmd+Shift+E` / `Ctrl+Shift+E` (Free)

Select any code and open a rich side panel that shows:

| Analysis | Detail |
|---|---|
| 📖 Plain-English summary | What this code does, for any audience |
| 📊 Complexity score (1–10) | Cyclomatic complexity with visual indicator |
| 🔬 Function/method breakdown | Params, return types, side effects |
| 🐛 Potential bugs | Issues the AI detected |
| 💡 Improvement suggestions | Refactoring and optimization ideas |
| 📈 Documentation quality score | 0–100 rating of existing comments |

---

### 📚 Templates Sidebar (Free)

Browse a curated library of comment templates for all 12 supported languages. One-click copy to clipboard for:
- Class/module headers
- Function doc-comment skeletons
- License headers
- TODO / FIXME / HACK / DEPRECATED blocks
- API endpoint documentation stubs

---

### 💰 Real-Time Cost Tracking (Free)

Every generation displays the **exact token cost in the status bar**. A typical function documentation costs **< $0.001**. Document an entire file for pennies.

---

## ⌨️ All Commands & Shortcuts

| Command | Mac | Windows / Linux | Plan | Description |
|---|---|---|:---:|---|
| `Poly-Glot: Generate AI Comments` | `Cmd+Shift+/` | `Ctrl+Shift+/` | Free | Generate & insert doc-comments inline |
| `Poly-Glot: Why Comments` | `Cmd+Shift+W` | `Ctrl+Shift+W` | **Pro** | Insert intent & trade-off inline notes |
| `Poly-Glot: Both Comments` | `Cmd+Shift+B` | `Ctrl+Shift+B` | **Pro** | Doc-comments + why-comments in one pass |
| `Poly-Glot: Explain Code` | `Cmd+Shift+E` | `Ctrl+Shift+E` | Free | Open deep AI analysis side panel |
| `Poly-Glot: Configure API Key` | — | — | Free | Set provider, model & API key |
| `Poly-Glot: Configure License Token` | — | — | Pro | Activate Pro license |
| `Poly-Glot: Open Templates Sidebar` | — | — | Free | Browse comment templates |

---

## ⚙️ Settings

| Setting | Default | Description |
|---|---|---|
| `polyglot.provider` | `openai` | AI provider: `openai` or `anthropic` |
| `polyglot.model` | `gpt-4.1-mini` | Any valid model ID from your provider (see tables below, or enter a custom ID) |
| `polyglot.licenseToken` | — | Pro license token from poly-glot.ai |
| `polyglot.insertInline` | `true` | `true` = insert into file · `false` = open side panel |
| `polyglot.commentStyle` | `auto` | Force a style: `jsdoc`, `javadoc`, `pydoc`, `doxygen`, etc. |

---

## 🤖 Supported AI Models

Poly-Glot accepts **any valid model ID** from OpenAI or Anthropic — including models not listed here. Just type the model ID into the `polyglot.model` setting. The extension will use it directly.

### OpenAI Models

| Model | Notes | Est. cost / request* |
|---|---|---|
| `gpt-4.1-mini` ⭐ **Recommended** | Best quality-to-cost ratio | ~$0.001 |
| `gpt-4.1` | Best GPT-4.1 quality | ~$0.004 |
| `gpt-4.1-nano` 💵 **Cheapest** | Fastest & lowest cost | ~$0.0002 |
| `gpt-4o` | Great quality, widely supported | ~$0.005 |
| `gpt-4o-mini` | Budget option, very fast | ~$0.0003 |
| `o3-mini` | Fast reasoning model | ~$0.002 |
| `o3` | Most powerful reasoning | ~$0.018 |
| `o1-mini` | Budget reasoning | ~$0.002 |
| `o1` | Full reasoning, slower | ~$0.027 |
| `gpt-4-turbo` | Previous-gen turbo | ~$0.014 |
| `gpt-4` | Classic GPT-4 | ~$0.030 |
| `gpt-3.5-turbo` | Legacy, lightest output | ~$0.0007 |

Get an OpenAI API key at [platform.openai.com](https://platform.openai.com).

### Anthropic Models

| Model | Notes | Est. cost / request* |
|---|---|---|
| `claude-sonnet-4-5` ⭐ **Recommended** | Excellent quality & speed | ~$0.007 |
| `claude-opus-4-5` 🏆 **Most Powerful** | Deepest analysis | ~$0.033 |
| `claude-haiku-4-5` 💵 **Cheapest** | Fastest & lowest cost | ~$0.002 |
| `claude-3-5-sonnet-20241022` | Proven quality, previous gen | ~$0.007 |
| `claude-3-5-haiku-20241022` | Budget Claude, very fast | ~$0.002 |
| `claude-3-opus-20240229` | Deep reasoning, older gen | ~$0.033 |
| `claude-3-haiku-20240307` | Lightest legacy Claude | ~$0.0006 |

Get an Anthropic API key at [console.anthropic.com](https://console.anthropic.com).

> \* **Estimates** based on ~200-token input / 400-token output (a typical small function). Costs scale with file size. Check [platform.openai.com/pricing](https://platform.openai.com/pricing) and [anthropic.com/pricing](https://www.anthropic.com/pricing) for current rates.

### Using a custom or unlisted model

Set `polyglot.model` in VS Code settings to any model ID your provider supports:

```json
// settings.json
{
  "polyglot.provider": "openai",
  "polyglot.model": "gpt-4o-2024-11-20"
}
```

```json
{
  "polyglot.provider": "anthropic",
  "polyglot.model": "claude-3-7-sonnet-20250219"
}
```

---

## 🌍 Supported Languages

| Language | Comment Standard | Format |
|---|---|---|
| JavaScript | JSDoc | `/** @param … */` |
| TypeScript | TSDoc / JSDoc | `/** @param … */` |
| Python | Google-style docstrings | `"""Args: …"""` |
| Java | Javadoc | `/** @param … */` |
| C# | XML doc comments | `/// <summary>…` |
| C / C++ | Doxygen | `/** \param … */` |
| Go | GoDoc | `// FunctionName …` |
| Rust | rustdoc | `/// …` |
| Ruby | YARD | `# @param …` |
| PHP | PHPDoc | `/** @param … */` |
| Swift | Swift markup | `/// - Parameter …` |
| Kotlin | KDoc | `/** @param … */` |
| SQL | Header block | `-- ============…` |

---

## 🔌 MCP Server — Use Poly-Glot from Goose, Claude Desktop & Cursor

**`poly-glot-mcp`** is now live on npm — use Poly-Glot's full feature set from any MCP-compatible AI client without leaving your chat interface.

```json
{
  "mcpServers": {
    "poly-glot": {
      "command": "npx",
      "args": ["-y", "poly-glot-mcp"],
      "env": {
        "POLYGLOT_PROVIDER": "openai",
        "POLYGLOT_API_KEY": "sk-your-key-here",
        "POLYGLOT_MODEL": "gpt-4.1-mini"
      }
    }
  }
}
```

**6 MCP tools available:**

| Tool | Description |
|------|-------------|
| `polyglot_add_doc_comments` | JSDoc, Javadoc, PyDoc, Doxygen — all 12 styles |
| `polyglot_add_why_comments` | Inline WHY-comments explaining intent & trade-offs |
| `polyglot_add_all_comments` | Doc + WHY in one two-pass call |
| `polyglot_explain_code` | Complexity score, bugs, doc quality analysis |
| `polyglot_list_languages` | All 12 supported languages |
| `polyglot_list_models` | Models + cost tiers for your provider |

Compatible with: **Goose** · **Claude Desktop** · **Cursor** · **Windsurf** · any MCP client

[Full MCP docs on npm →](https://www.npmjs.com/package/poly-glot-mcp)

---

## 🤖 GitHub Copilot Chat Integration

> **Prerequisite:** The **Poly-Glot VS Code Extension** must be installed and configured with an API key before using Poly-Glot in Copilot Chat. Requires **VS Code v1.95+** and an active **GitHub Copilot** subscription.

Poly-Glot registers itself as a **Copilot Chat participant** (`@poly-glot`), so you can generate comments, explain code, and get documentation analysis directly inside the Copilot Chat panel — no switching tabs, no copy-paste.

### 🔧 Setup (3 steps)

1. **Install the Poly-Glot extension** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)
2. **Configure your API key** → Command Palette (`Cmd+Shift+P`) → `Poly-Glot: Configure API Key` → choose provider, paste key, pick model
3. **Open Copilot Chat** → `Cmd+Shift+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux) → type `@poly-glot` to activate

That's it. No extra config. The participant is registered automatically when the extension is active.

---

### 💬 Commands

| Command | What it does | Plan |
|---|---|:---:|
| `@poly-glot /comment` | Generate doc-comments for selected code | Free |
| `@poly-glot /explain` | Deep code analysis — complexity, bugs, doc quality | Free |
| `@poly-glot /why` | Add WHY-comments explaining intent & trade-offs | **Pro** |
| `@poly-glot /both` | Doc-comments + WHY-comments in one pass | **Pro** |

---

### 🗣 Prompt Examples

**Generate doc-comments for a function:**
```
@poly-glot /comment
```
> Select the function in the editor first, then send the command. Poly-Glot generates JSDoc, Javadoc, PyDoc, etc. and shows an **Apply to Editor** button to insert inline.

---

**Explain what a block of code does:**
```
@poly-glot /explain
```
> Returns a plain-English summary, complexity score (1–10), function-by-function breakdown, potential bugs, refactoring suggestions, and a documentation quality score (0–100).

---

**Add WHY-comments to explain decisions (Pro):**
```
@poly-glot /why
```
> Inserts inline comments explaining *why* the code is written the way it is — trade-offs, algorithm choices, business constraints. Makes PRs self-reviewing and helps Copilot give you better suggestions.

---

**Document everything in one shot (Pro):**
```
@poly-glot /both
```
> Runs two passes — first generates doc-comments, then adds WHY-comments — and delivers both in a single response with an **Apply to Editor** button.

---

**Ask a follow-up question after `/explain`:**
```
@poly-glot /explain
Why is the time complexity O(n²) here? Can it be improved?
```
> Poly-Glot uses the same AI context window as your configured model, so you can follow up with natural language questions after any command.

---

### ❓ Copilot Chat FAQ

**Does `@poly-glot` use my API key?**
Yes — Poly-Glot uses the OpenAI or Anthropic key you configured in the extension. GitHub Copilot and Poly-Glot are completely separate; Poly-Glot does not use your Copilot subscription's token budget.

**Why doesn't `@poly-glot` appear in chat?**
The participant only registers if the extension is active and VS Code v1.95+ is installed. Try: Command Palette → `Developer: Reload Window`.

**Can I use `/why` and `/both` without Pro?**
No — WHY-comments and Both mode are Pro features. [Upgrade at poly-glot.ai](https://poly-glot.ai/#pg-pricing-section) — start a **14-day free trial**, use code **`EARLYBIRD3`** for 50% off your first 3 months.

**Does it work with VS Code Insiders?**
Yes — any VS Code build ≥ 1.95 with Copilot Chat enabled works.

---

## 🔒 Privacy & Security

Your code and API keys are **100% private**:

- 🔑 **API keys stored in OS keychain** — VS Code `SecretStorage` (macOS Keychain, Windows Credential Manager, Linux `libsecret`). Never written to `settings.json` or any log file.
- 📡 **Direct API calls only** — requests go from your machine straight to OpenAI or Anthropic. Poly-Glot has no backend server, no relay, no proxy.
- 🚫 **Zero telemetry** — no usage data, no error reporting, no analytics are ever collected.
- 🏠 **Your code never touches our servers** — because we don't have any.

**OpenAI** and **Anthropic** may use API request data per their own privacy policies. If you're working with sensitive code, check your provider's data-handling settings (both offer zero-data-retention options for API users).

---

## 💎 Unlock Pro — 14-Day Free Trial + `EARLYBIRD3`

If you've tried the Pro features and want to unlock them permanently:

1. Visit **[poly-glot.ai/#pg-pricing-section](https://poly-glot.ai/#pg-pricing-section)**
2. Choose a plan and enter code **`EARLYBIRD3`** at checkout
3. Get **14 days completely free** — no charge until day 15
4. Copy your license token from your account dashboard
5. In VS Code: Command Palette → `Poly-Glot: Configure License Token` → paste token → Pro activates instantly

Pro unlocks:
- ✅ **Why-Comments** (`Cmd+Shift+W`)
- ✅ **Both Mode** (`Cmd+Shift+B`)
- ✅ All 12 language support (C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin, SQL)
- ✅ Unlimited file generations per month

---

## ❓ FAQ

**Do I need a Poly-Glot account?**
No account is required for the Free tier. Just bring your own OpenAI or Anthropic API key.

**Does Poly-Glot work offline?**
No — it needs to reach the OpenAI or Anthropic API. But no other internet connection is required.

**Can I use both OpenAI and Anthropic?**
You can switch providers any time via `Poly-Glot: Configure API Key`. Only one provider is active at a time.

**Will comments be inserted into my file or shown in a panel?**
By default, comments are inserted **inline** at the correct position in your file. Set `polyglot.insertInline: false` to open a diff panel instead.

**What if I select nothing?**
Poly-Glot documents the **entire active file** — great for batch documentation.

**Is there a team or enterprise plan?**
Email [support@poly-glot.ai](mailto:support@poly-glot.ai) for team licensing.

---

## 🗺 Roadmap

- [ ] Auto-comment on save
- [ ] Bulk comment entire workspace / folder
- [ ] GitHub Actions integration
- [ ] Custom comment templates editor
- [ ] Team shared templates

Have a feature request? [Open an issue on GitHub](https://github.com/poly-glot-ai/poly-glot/issues) or email [support@poly-glot.ai](mailto:support@poly-glot.ai).

---

## 📦 About

**Version:** 1.4.2  
**Publisher:** poly-glot-ai  
**Marketplace:** [poly-glot-ai.poly-glot](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)  
**Website:** [poly-glot.ai](https://poly-glot.ai)  
**License:** MIT © Harold Moses

---

*Keywords: AI code comments, JSDoc generator, Javadoc generator, PyDoc generator, Doxygen, KDoc, rustdoc, GoDoc, PHPDoc, YARD, Swift markup, code documentation, why comments, code explainer, OpenAI, Anthropic, Claude, GPT-4, GPT-4o, o3-mini, Claude Sonnet, Claude Opus, AI documentation, automatic comments, VS Code AI, code commenting tool*
