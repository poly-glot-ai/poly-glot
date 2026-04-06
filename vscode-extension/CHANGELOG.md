## [1.4.47] — 2026-04-06
- 🔧 maintenance release

---

# Changelog

All notable changes to the Poly-Glot VS Code Extension are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.4.14] — 2026-04-04

### ✨ New
- **Google Gemini support** — add your Google AI Studio key (`AIza…`) and generate documentation with Gemini 2.5 Flash, Gemini 2.5 Pro, Gemini 2.5 Flash Lite, or Gemini 2.0 Flash. All four models available via the OpenAI-compatible Generative Language API endpoint.
- **Chrome Web Store** — Poly-Glot is now available on the Chrome Web Store (`hjpdgilolgcanemmngagpobdgdhpplai`). Use it directly in the browser alongside the VS Code and CLI tools.

### Improved
- **Provider picker** — Google now listed alongside OpenAI and Anthropic in `Configure API Key` quick-pick with `AIza…` placeholder and link to AI Studio
- **Key validation** — cross-provider key detection: warns if you paste an OpenAI key into Google or vice versa
- **README** — Google Gemini section with all 4 models, pricing, and quick-start. Chrome Web Store badge now links to the live store listing.

### Fixed
- **Acquisition counter** — VS Code floor synced to 104 (true publisher dashboard value); auto-raises via PAT API on every cron run — counter never dips below verified value

---

## [1.4.2] — 2026-03-31

### ✨ New
- **MCP Server** — `poly-glot-mcp` is now published on npm. Use Poly-Glot from Claude Desktop, Goose, Cursor, Windsurf, or any MCP-compatible client. Six tools: `polyglot_add_doc_comments`, `polyglot_add_why_comments`, `polyglot_add_all_comments`, `polyglot_explain_code`, `polyglot_list_languages`, `polyglot_list_models`.
- **Chat Assistant** — floating chat bubble on poly-glot.ai lets users ask questions about features, pricing, and how to use the tool.

### Improved
- **Test Connection** — uses zero-cost `GET /v1/models` endpoint for both OpenAI and Anthropic. No tokens burned, works with $0 account balance.
- **Modal note** — "Test Connection checks your key is valid — no tokens are used and nothing is generated" shown below the button.

---

## [1.4.1] — 2026-03-30

### Improved
- **Custom model support** — enter any model ID (e.g. `gpt-4o-2024-11-20`, `claude-3-7-sonnet-20250219`) directly in settings; not limited to the preset list
- **Default model updated** to `gpt-4.1-mini` — better quality, lower cost than `gpt-4o-mini`
- **Updated model tables** in README with accurate per-request cost estimates for all GPT-4.1, GPT-4o, o3, o1, Claude 4, and Claude 3.5 models
- **Marketplace** — expanded to 30 keywords, added Machine Learning category, added badges

---

## [1.4.0] — 2026-03-30

### 🤖 GitHub Copilot Chat Integration
- New `@poly-glot` chat participant in Copilot Chat
- `/comment` — generate doc-comments from selected code
- `/why` — add why-comments explaining intent & trade-offs _(Pro)_
- `/both` — doc-comments + why-comments in one pass _(Pro)_
- `/explain` — deep analysis: complexity, bugs, doc quality score
- `/upgrade` — show Pro plan info + EARLYBIRD3 promo
- Follow-up suggestions after every response
- Plan gating: Pro features prompt upgrade inline in chat
- API key check: guides user to configure if not set

### Changed
- Marketplace SEO: 19 keywords, 4 categories, optimised description
- Min VS Code engine bumped to `^1.95.0` (required for chat API)

---

## [1.3.1] — 2026-03-29

### Changed
- Set marketplace pricing to **Trial** (free tier + Pro plan) — correctly reflects freemium model
- Updated description to surface free tier and Pro plan features upfront

---

## [1.3.0] — 2026-03-29

### 🎉 Initial Release

---

### Commands

- **`polyglot.generateComments`** — Select code (or leave nothing selected for the whole file) and generate professional, language-aware documentation comments inserted directly into the editor (`Cmd+Shift+/` / `Ctrl+Shift+/`)
- **`polyglot.explainCode`** — Perform a deep AI analysis of selected code and open a rich side panel with structured results (`Cmd+Shift+E` / `Ctrl+Shift+E`)
- **`polyglot.configureApiKey`** — Interactive setup wizard: choose provider via QuickPick, enter API key securely via password input, and select a model — all stored in VS Code SecretStorage (OS keychain)
- **`polyglot.openTemplates`** — Focus the Poly-Glot sidebar to browse comment templates

---

### AI & Provider Support

- **OpenAI** provider support with models: `gpt-4o-mini` (default), `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`
- **Anthropic** provider support with models: `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, `claude-3-opus-20240229`, `claude-3-haiku-20240307`
- Custom model ID support — use any model string your provider supports; cost calculation falls back to the closest known model
- Per-request token cost calculated from live usage data and displayed in the status bar for 8 seconds after every generation
- Cost falls back to sane defaults for unknown or custom model IDs

---

### Generate Comments

- Generates comments in the **native documentation style** for each language — never mixes styles
- Supports **whole-file mode** (no selection) and **selection mode** (comment only selected code)
- `polyglot.insertInline` setting: insert comments directly into the editor (`true`, default) or open a read-only side panel (`false`)
- Code block in side panel shows language ID and per-request cost
- Error handling with actionable prompts — offers "Configure Now" if API key is missing

---

### Explain Code

Structured analysis panel opened alongside the editor (`ViewColumn.Beside`) with:

- **Plain-English summary** (2–3 sentences)
- **Complexity card** — label (`Simple` / `Moderate` / `Complex` / `Very Complex`) + score 1–10 + animated progress bar
- **Doc Quality card** — label (`None` / `Poor` / `Fair` / `Good` / `Excellent`) + score 0–100 + animated progress bar, color-coded green/yellow/red
- **Function/method table** — name, purpose, parameters, return value for every detected function
- **Potential bugs list** — concrete descriptions with line/context where possible; shows success message if none found
- **Improvement suggestions** list
- **Documentation issues** and doc improvement suggestions
- Panel styled with VS Code theme variables — works correctly in all themes (light, dark, high-contrast)
- Model name, language, and per-request cost shown in panel header

---

### Comment Templates Sidebar

- Activity bar icon and dedicated sidebar panel (`polyglot.templatesView`)
- Templates for **12 languages**: JavaScript, TypeScript, Python, Java, C#, C/C++, Go, Rust, Ruby, PHP, Swift, SQL
- Each language includes: single-line example, multi-line example, full function/method documentation example, and a pro tip
- Language dropdown — switch templates instantly without re-opening
- **Copy button** for each template section with visual `✓ Copied!` confirmation (1.8s, no alert)
- Templates stored as a plain object serialized to JSON — safe injection into webview with no backtick/escaping issues
- Content Security Policy (`nonce`-gated scripts) on all webview HTML

---

### Security & Privacy

- API key stored exclusively in **VS Code SecretStorage** (backed by the OS keychain on macOS/Windows/Linux) — never written to `settings.json` or any file
- All API requests go directly from the extension to OpenAI / Anthropic — no proxy, no backend, no telemetry
- Webview HTML uses strict CSP (`default-src 'none'`) with per-load nonce for inline scripts

---

### Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `polyglot.provider` | `string` | `openai` | AI provider: `openai` or `anthropic` |
| `polyglot.model` | `string` | `gpt-4o-mini` | Model ID — any valid ID from your provider |
| `polyglot.insertInline` | `boolean` | `true` | Insert comments into editor; if `false`, shows a side panel |

---

### Editor & UI Integration

- **Status bar item** (right-aligned) — always visible, doubles as a clickable shortcut to generate comments; flashes with cost and result icon for 8 seconds after each operation
- **Right-click context menu** — "Generate AI Comments" and "Explain Code" appear when text is selected
- **Editor title bar button** — generate comments icon appears when text is selected
- **Keybindings** work on both macOS (`Cmd`) and Windows/Linux (`Ctrl`)
- `withProgress` notification shown during API calls so the user knows work is in progress
- All error messages include the full API error text for easy debugging

---

### TypeScript & Build

- Strict TypeScript (`"strict": true`, ES2020 target, CommonJS output)
- Fully typed interfaces: `GenerateResult`, `ExplainResult`, `FunctionInfo`, `DocQuality`, `ModelInfo`
- Compiled to `/out` with source maps; zero TypeScript errors
- `.vscodeignore` excludes `src/`, `node_modules/`, and `*.map` from the packaged `.vsix`
