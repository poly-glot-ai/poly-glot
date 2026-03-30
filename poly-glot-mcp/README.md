# 🦜 poly-glot-mcp

**MCP server for [Poly-Glot AI](https://poly-glot.ai)** — generate professional code comments and documentation in 12 languages directly from Claude Desktop, Goose, Cursor, Windsurf, or any MCP-compatible AI client.

[![npm version](https://img.shields.io/npm/v/poly-glot-mcp?color=blue)](https://www.npmjs.com/package/poly-glot-mcp)
[![MCP](https://img.shields.io/badge/MCP-compatible-8b5cf6)](https://modelcontextprotocol.io)
[![Languages](https://img.shields.io/badge/languages-12-green)](https://poly-glot.ai)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-orange)](../LICENSE)

---

## What it does

Instead of copying code to a web app, you stay in your AI chat and say:

> *"Add JSDoc comments to this function"*
> *"Explain this Python class and score the documentation quality"*
> *"Add WHY-comments to this Go code"*

Poly-Glot handles the rest — using your own OpenAI or Anthropic API key, so **your code never touches Poly-Glot's servers**.

---

## Tools

| Tool | What it does |
|------|-------------|
| `polyglot_add_doc_comments` | JSDoc · Javadoc · PyDoc · Doxygen · XML docs · GoDoc · Rustdoc · YARD · PHPDoc · KDoc · Swift markup |
| `polyglot_add_why_comments` | Inline WHY-comments explaining decisions, trade-offs, edge-case reasoning |
| `polyglot_add_all_comments` | Both passes in one call — fully commented, review-ready code |
| `polyglot_explain_code` | Complexity score, function breakdown, bug detection, doc quality score |
| `polyglot_list_languages` | All 12 supported languages with comment styles |
| `polyglot_list_models` | All available models with cost tiers |

---

## Supported Languages

| Language | Comment Style |
|----------|--------------|
| `javascript` | JSDoc |
| `typescript` | TSDoc / JSDoc |
| `python` | Google-style docstrings |
| `java` | Javadoc |
| `cpp` | Doxygen |
| `csharp` | XML doc-comments (`///`) |
| `go` | GoDoc |
| `rust` | Rustdoc (`///`) |
| `ruby` | YARD |
| `php` | PHPDoc |
| `swift` | Swift markup (`///`) |
| `kotlin` | KDoc |

---

## Quick Start

### 1. Get an API key

- **OpenAI:** https://platform.openai.com/api-keys
- **Anthropic:** https://console.anthropic.com/settings/keys

### 2. Configure your MCP client

#### Goose

Add to your Goose config (`~/.config/goose/config.yaml` or via `goose configure`):

```yaml
extensions:
  poly-glot:
    type: stdio
    cmd: npx
    args:
      - "-y"
      - "poly-glot-mcp"
    env:
      POLYGLOT_PROVIDER: openai
      POLYGLOT_API_KEY: sk-your-key-here
      POLYGLOT_MODEL: gpt-4.1-mini   # optional
    enabled: true
    name: poly-glot
    description: AI code documentation — JSDoc, Javadoc, PyDoc and more in 12 languages
```

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

#### Cursor / Windsurf

Add to `.cursor/mcp.json` or `.windsurf/mcp.json` in your project:

```json
{
  "mcpServers": {
    "poly-glot": {
      "command": "npx",
      "args": ["-y", "poly-glot-mcp"],
      "env": {
        "POLYGLOT_PROVIDER": "anthropic",
        "POLYGLOT_API_KEY": "sk-ant-your-key-here",
        "POLYGLOT_MODEL": "claude-haiku-4-5"
      }
    }
  }
}
```

### 3. Use it

Just talk to your AI client naturally:

```
"Add JSDoc to this TypeScript file"
"Explain this Python class"
"Add WHY-comments to this Go code"
"What languages does Poly-Glot support?"
```

---

## Configuration

| Environment Variable | Required | Default | Description |
|----------------------|----------|---------|-------------|
| `POLYGLOT_API_KEY` | ✅ Yes | — | Your OpenAI or Anthropic API key |
| `POLYGLOT_PROVIDER` | No | `openai` | `openai` or `anthropic` |
| `POLYGLOT_MODEL` | No | Smart default | Any model ID (see `polyglot_list_models`) |

### Recommended models

| Use case | Provider | Model | Cost/request* |
|----------|----------|-------|--------------|
| Best balance | OpenAI | `gpt-4.1-mini` | ~$0.0003 |
| Cheapest | OpenAI | `gpt-4.1-nano` | ~$0.00008 |
| Most accurate | OpenAI | `gpt-4.1` | ~$0.0015 |
| Best balance | Anthropic | `claude-haiku-4-5` | ~$0.0003 |
| Most accurate | Anthropic | `claude-sonnet-4-5` | ~$0.002 |

*Estimates based on ~200 token input / 400 token output.

---

## Privacy

- Your **code** goes directly from this MCP server → OpenAI/Anthropic API
- Your **API key** is set as an environment variable — never sent to Poly-Glot servers
- **Nothing** is logged or stored by Poly-Glot
- Each tool call is a single, stateless API call

---

## Links

- 🌐 Website: [poly-glot.ai](https://poly-glot.ai)
- 💻 VS Code Extension: [Marketplace](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)
- ⌨️ CLI: [`poly-glot-ai-cli`](https://www.npmjs.com/package/poly-glot-ai-cli)
- 🐛 Issues: [GitHub](https://github.com/poly-glot-ai/poly-glot/issues)

---

## License

AGPL-3.0-or-later © Harold Moses
