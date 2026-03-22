# Poly-Glot — AI Code Comments

> Intelligent, language-aware documentation comments and deep code analysis — powered by OpenAI or Anthropic, 100% client-side.

![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/PLACEHOLDER_PUBLISHER_ID.poly-glot)
![Installs](https://img.shields.io/visual-studio-marketplace/i/PLACEHOLDER_PUBLISHER_ID.poly-glot)

---

## Features

### 📝 Generate Comments (`Cmd+Shift+/`)
Select any code (or leave nothing selected for the whole file) → Poly-Glot inserts professional, language-aware documentation comments inline.

Supports **12 languages** with their native comment standards:
- **JavaScript/TypeScript** → JSDoc / TSDoc
- **Python** → Google-style docstrings
- **Java** → Javadoc
- **C#** → XML doc comments (`///`)
- **C/C++** → Doxygen
- **Go** → GoDoc
- **Rust** → rustdoc (`///`)
- **Ruby** → YARD
- **PHP** → PHPDoc
- **Swift** → Swift markup
- **Kotlin** → KDoc
- **SQL** → Header block convention

### 🔍 Explain Code (`Cmd+Shift+E`)
Deep AI analysis of selected code, displayed in a side panel:
- Plain-English summary
- Complexity score (1–10) with visual indicator
- Function/method breakdown (params, returns, side effects)
- Potential bugs detected
- Improvement suggestions
- Documentation quality score (0–100)

### 📚 Templates Sidebar
Browse ready-to-use comment templates for all 12 supported languages. One-click copy to clipboard.

### 💰 Cost Tracking
Every generation shows the exact API cost in the status bar for 8 seconds. Ultra-low cost — typical generation is **< $0.001**.

---

## Getting Started

1. **Install** the extension from the VS Code Marketplace
2. **Configure your API key** — open Command Palette → `Poly-Glot: Configure API Key`
3. **Select code** in any editor
4. **Press `Cmd+Shift+/`** to generate comments, or **`Cmd+Shift+E`** to explain

---

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `Poly-Glot: Generate AI Comments` | `Cmd+Shift+/` | Generate and insert comments |
| `Poly-Glot: Explain Code` | `Cmd+Shift+E` | Open deep analysis panel |
| `Poly-Glot: Configure API Key` | — | Set provider, model, and API key |
| `Poly-Glot: Open Templates Sidebar` | — | Focus the templates sidebar |

---

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `polyglot.provider` | `openai` | AI provider: `openai` or `anthropic` |
| `polyglot.model` | `gpt-4o-mini` | Model ID (any valid ID from your provider) |
| `polyglot.insertInline` | `true` | Insert comments directly into editor; if false, opens a side panel |

---

## Supported Models

### OpenAI
| Model | Cost |
|-------|------|
| `gpt-4o-mini` ⭐ | ~$0.001/request |
| `gpt-4o` | ~$0.003/request |
| `gpt-4-turbo` | ~$0.01/request |
| `gpt-3.5-turbo` | ~$0.0005/request |

### Anthropic
| Model | Cost |
|-------|------|
| `claude-3-5-sonnet-20241022` | ~$0.005/request |
| `claude-3-5-haiku-20241022` | ~$0.001/request |
| `claude-3-opus-20240229` | ~$0.02/request |

---

## Privacy

🔒 **100% client-side.** Your API key is stored in VS Code's **SecretStorage** (OS keychain — never in settings.json). All requests go directly from your machine to OpenAI/Anthropic. No telemetry, no backend, no data collection.

---

## Contributing

Built with [Goose](https://github.com/block/goose) by Block.
Source: [github.com/hmoses/poly-glot](https://github.com/hmoses/poly-glot)

Issues and PRs welcome!

---

## License

MIT © Harold Moses II
