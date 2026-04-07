# 🔌 poly-glot-mcp

> MCP server for Poly-Glot AI — two tools in one package:
> - **Code Documentation** — generate JSDoc, Javadoc, PyDoc, WHY-comments & more in 12 languages
> - **Prompt Studio** — use your saved prompt templates from any MCP client

**Jump to:** [Code Documentation MCP](#-code-documentation-mcp) · [Prompt Studio MCP](#-prompt-studio-mcp)

[![npm version](https://img.shields.io/npm/v/poly-glot-mcp?color=CB3837&logo=npm&style=flat-square)](https://www.npmjs.com/package/poly-glot-mcp)
[![npm downloads](https://img.shields.io/npm/dm/poly-glot-mcp?color=CB3837&logo=npm&style=flat-square)](https://www.npmjs.com/package/poly-glot-mcp)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green?style=flat-square)](LICENSE)

---

---

## 📝 Code Documentation MCP

Generate professional code comments in 12 languages directly from any MCP client.

## ⚠️ Pro Plan Required

The MCP server is available on **Pro, Team, and Enterprise plans only**.

| Plan | MCP calls/month | Price |
|------|:--------------:|-------|
| Free | 🔒 Not available | $0 |
| **Pro** | **200** | **$9/mo** |
| **Team** | **1,000** | **$29/mo** |
| **Enterprise** | **Unlimited** | Custom |

👉 [Upgrade at poly-glot.ai →](https://poly-glot.ai/#pg-pricing-section)

You need a `POLYGLOT_SESSION_TOKEN` from your account dashboard. Usage is tracked server-side — limits reset on the 1st of each month.

---

## Tools

| Tool | Description |
|------|-------------|
| `polyglot_add_doc_comments` | Add JSDoc, Javadoc, PyDoc, Doxygen, KDoc, rustdoc, GoDoc, PHPDoc, YARD, Swift markup |
| `polyglot_add_why_comments` | Add inline WHY-comments explaining reasoning & intent |
| `polyglot_add_all_comments` | Doc-comments + WHY-comments in one pass |
| `polyglot_explain_code` | Deep analysis: complexity, bugs, quality score, suggestions |
| `polyglot_list_languages` | List all 12 supported languages + comment styles |
| `polyglot_list_models` | List available models for your provider |
| `polyglot_github_app_info` | Q&A about the Poly-Glot GitHub App |

---

## Setup

### 1. Get your session token

1. Sign up / log in at [poly-glot.ai](https://poly-glot.ai)
2. Upgrade to Pro or Team
3. Copy your session token from the account dashboard

### 2. Configure your MCP client

#### Goose

```yaml
# ~/.config/goose/config.yaml
extensions:
  poly-glot:
    type: stdio
    cmd: npx
    args: ["-y", "poly-glot-mcp"]
    env:
      POLYGLOT_PROVIDER: openai
      POLYGLOT_API_KEY: sk-your-key-here
      POLYGLOT_MODEL: gpt-4.1-mini
      POLYGLOT_SESSION_TOKEN: your-session-token
    name: poly-glot
    description: AI code documentation — JSDoc, Javadoc, PyDoc and more in 12 languages
```

#### Claude Desktop

```json
{
  "mcpServers": {
    "poly-glot": {
      "command": "npx",
      "args": ["-y", "poly-glot-mcp"],
      "env": {
        "POLYGLOT_PROVIDER": "openai",
        "POLYGLOT_API_KEY": "sk-your-key-here",
        "POLYGLOT_MODEL": "gpt-4.1-mini",
        "POLYGLOT_SESSION_TOKEN": "your-session-token"
      }
    }
  }
}
```

Add to: `~/Library/Application Support/Claude/claude_desktop_config.json`

#### Cursor / Windsurf

```json
{
  "mcpServers": {
    "poly-glot": {
      "command": "npx",
      "args": ["-y", "poly-glot-mcp"],
      "env": {
        "POLYGLOT_PROVIDER": "anthropic",
        "POLYGLOT_API_KEY": "sk-ant-your-key-here",
        "POLYGLOT_MODEL": "claude-haiku-4-5",
        "POLYGLOT_SESSION_TOKEN": "your-session-token"
      }
    }
  }
}
```

Add to `.cursor/mcp.json` or `.windsurf/mcp.json` in your project root.

### 3. Use it

```
"Add JSDoc comments to this TypeScript file"
"Explain this Python class"
"Add WHY-comments to this Go code"
"Document this entire file with doc + why comments"
"What languages does Poly-Glot support?"
```

---

## Configuration

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `POLYGLOT_SESSION_TOKEN` | ✅ Yes | — | Session token from poly-glot.ai (Pro+ required) |
| `POLYGLOT_API_KEY` | ✅ Yes | — | Your OpenAI, Anthropic, or Google AI API key |
| `POLYGLOT_PROVIDER` | No | `openai` | `openai` \| `anthropic` \| `google` |
| `POLYGLOT_MODEL` | No | Smart default | Any valid model ID (see `polyglot_list_models`) |

---

## Supported Models

### OpenAI
| Model | Notes |
|-------|-------|
| `gpt-4.1-mini` ⭐ | **Recommended** — best quality-to-cost |
| `gpt-4.1` | Best quality |
| `gpt-4.1-nano` | Fastest & cheapest |
| `gpt-4o` | Great quality, widely supported |
| `o3` | Most powerful reasoning |

### Anthropic
| Model | Notes |
|-------|-------|
| `claude-sonnet-4-5` ⭐ | **Recommended** — excellent quality & speed |
| `claude-opus-4-5` | Most powerful Claude |
| `claude-haiku-4-5` | Fastest & cheapest |

### Google
| Model | Notes |
|-------|-------|
| `gemini-2.5-flash` ⭐ | **Recommended** — fast, accurate, low cost |
| `gemini-2.5-pro` | Most powerful Gemini |
| `gemini-2.5-flash-lite` | Cheapest Gemini |

---

## Supported Languages

JavaScript · TypeScript · Python · Java · C++ · C · C# · Go · Rust · Ruby · PHP · Swift · Kotlin · SQL

---

## Privacy

- Your **code** goes directly from this MCP server → OpenAI/Anthropic/Google API — never to Poly-Glot servers
- Your **API key** is an environment variable — never logged or stored by Poly-Glot
- **Session token** is verified server-side for plan/quota only — your code is never sent to us
- Each tool call is a single, stateless AI API call

---

## Links

- 🌐 Website: [poly-glot.ai](https://poly-glot.ai)
- 💰 Pricing: [poly-glot.ai/#pg-pricing-section](https://poly-glot.ai/#pg-pricing-section)
- 💻 VS Code Extension: [Marketplace](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)
- ⌨️ CLI: [`poly-glot-ai-cli`](https://www.npmjs.com/package/poly-glot-ai-cli)
- 🐙 GitHub App: [github.com/apps/poly-glot-ai](https://github.com/apps/poly-glot-ai)
- 🐛 Issues: [GitHub](https://github.com/poly-glot-ai/poly-glot/issues)

---

---

## ✨ Prompt Studio MCP

Use your saved **Poly-Glot Prompt Studio** templates as tools directly from Claude Desktop, Goose, Cursor, Windsurf, or any MCP client.

**Prompt Studio** is a browser-based prompt engineering tool at [poly-glot.ai/prompt/](https://poly-glot.ai/prompt/) — create templates with `{{variables}}`, test against real AI models, version and share them.

### ⚠️ Pro Plan Required

| Plan | MCP calls/month | Price |
|------|:--------------:|-------|
| Free | 🔒 Not available | $0 |
| **Pro** | **200** | **$9/mo** |
| **Team** | **1,000** | **$29/mo** |
| **Enterprise** | **Unlimited** | Custom |

👉 [Get Pro at poly-glot.ai/prompt/ →](https://poly-glot.ai/prompt/#pga-pricing)

### Tools

| Tool | Description |
|------|-------------|
| `prompt_list_templates` | List all your saved prompt templates (name, description, variable names) |
| `prompt_get_template` | Fetch a template by name — returns body + variable schema |
| `prompt_render` | Render a template with filled variable values — returns the final prompt string |
| `prompt_run` | Render + run a template against an AI model — returns the model response |
| `prompt_save_version` | Save a new version of a template to your Prompt Studio library |
| `prompt_share` | Generate a shareable URL for a template |

### Setup

#### 1. Get your session token
1. Sign up / log in at [poly-glot.ai/prompt/](https://poly-glot.ai/prompt/)
2. Upgrade to Pro or Team
3. Copy your `PG_PROMPT_SESSION_TOKEN` from the account dashboard

#### 2. Configure your MCP client

**Goose**
```yaml
# ~/.config/goose/config.yaml
extensions:
  poly-glot-prompt:
    type: stdio
    cmd: npx
    args: ["-y", "poly-glot-mcp"]
    env:
      PG_PROMPT_SESSION_TOKEN: pgp_your-token-here
      PG_PROMPT_PROVIDER: openai
      PG_PROMPT_API_KEY: sk-your-key-here
      PG_PROMPT_MODEL: gpt-4o-mini
    name: poly-glot-prompt
    description: Poly-Glot Prompt Studio — use saved prompt templates as tools
```

**Claude Desktop**
```json
{
  "mcpServers": {
    "poly-glot-prompt": {
      "command": "npx",
      "args": ["-y", "poly-glot-mcp"],
      "env": {
        "PG_PROMPT_SESSION_TOKEN": "pgp_your-token-here",
        "PG_PROMPT_PROVIDER": "openai",
        "PG_PROMPT_API_KEY": "sk-your-key-here",
        "PG_PROMPT_MODEL": "gpt-4o-mini"
      }
    }
  }
}
```

Add to: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Cursor / Windsurf**
```json
{
  "mcpServers": {
    "poly-glot-prompt": {
      "command": "npx",
      "args": ["-y", "poly-glot-mcp"],
      "env": {
        "PG_PROMPT_SESSION_TOKEN": "pgp_your-token-here",
        "PG_PROMPT_PROVIDER": "anthropic",
        "PG_PROMPT_API_KEY": "sk-ant-your-key-here",
        "PG_PROMPT_MODEL": "claude-haiku-4-5"
      }
    }
  }
}
```

#### 3. Use it

```
"List my saved prompt templates"
"Run my 'Code Review Assistant' template on this file"
"Render my 'Blog Post Writer' template with topic='AI trends'"
"Save a new version of my 'Email Drafter' template"
"Share my 'Meeting Summary' template"
```

### Configuration

| Variable | Required | Description |
|----------|:--------:|-------------|
| `PG_PROMPT_SESSION_TOKEN` | ✅ Yes | Session token from poly-glot.ai/prompt/ (Pro+ required) |
| `PG_PROMPT_API_KEY` | ✅ Yes | Your OpenAI, Anthropic, or Google AI API key |
| `PG_PROMPT_PROVIDER` | No | `openai` \| `anthropic` \| `google` (default: `openai`) |
| `PG_PROMPT_MODEL` | No | Any valid model ID (default: `gpt-4o-mini`) |

### Privacy

- Your **prompt templates** are fetched from Poly-Glot servers using your session token
- Your **API key** is an environment variable — never logged or stored by Poly-Glot
- **Model responses** go directly from the AI provider to your MCP client — not through Poly-Glot
- Full privacy policy: [poly-glot.ai/prompt/privacy/](https://poly-glot.ai/prompt/privacy/)

---

## License

AGPL-3.0-or-later © Harold Moses
