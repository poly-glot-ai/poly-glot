#!/usr/bin/env node
/**
 * Poly-Glot MCP Server
 *
 * Exposes Poly-Glot's AI comment generation as MCP tools so any MCP-compatible
 * client (Goose, Claude Desktop, Cursor, Windsurf, etc.) can generate
 * professional code documentation without leaving their AI chat interface.
 *
 * Tools:
 *   polyglot_add_doc_comments    — Add JSDoc / Javadoc / PyDoc / etc.
 *   polyglot_add_why_comments    — Add inline WHY reasoning comments
 *   polyglot_add_all_comments    — Doc-comments + WHY comments in one pass
 *   polyglot_explain_code        — Deep code analysis (complexity, bugs, quality)
 *   polyglot_list_languages      — List supported languages + comment styles
 *   polyglot_list_models         — List available models for a provider
 *   polyglot_github_app_info     — Q&A about the Poly-Glot AI GitHub App
 *
 * Configuration (environment variables):
 *   POLYGLOT_PROVIDER   openai | anthropic   (default: openai)
 *   POLYGLOT_API_KEY    your API key          (required)
 *   POLYGLOT_MODEL      model ID              (optional — uses smart default)
 *
 * Usage:
 *   POLYGLOT_PROVIDER=openai POLYGLOT_API_KEY=sk-... npx poly-glot-mcp
 */