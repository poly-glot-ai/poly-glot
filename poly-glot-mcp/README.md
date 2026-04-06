# 🔌 poly-glot-mcp

> MCP server for Poly-Glot AI — generate professional code comments & documentation in 12 languages directly from Claude, Goose, Cursor, Windsurf, or any MCP-compatible AI client.

[![npm version](https://img.shields.io/npm/v/poly-glot-mcp?color=CB3837&logo=npm&style=flat-square)](https://www.npmjs.com/package/poly-glot-mcp)
[![npm downloads](https://img.shields.io/npm/dm/poly-glot-mcp?color=CB3837&logo=npm&style=flat-square)](https://www.npmjs.com/package/poly-glot-mcp)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green?style=flat-square)](LICENSE)

---

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

## License

AGPL-3.0-or-later © Harold Moses
