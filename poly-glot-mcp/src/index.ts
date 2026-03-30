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
 *
 * Configuration (environment variables):
 *   POLYGLOT_PROVIDER   openai | anthropic   (default: openai)
 *   POLYGLOT_API_KEY    your API key          (required)
 *   POLYGLOT_MODEL      model ID              (optional — uses smart default)
 *
 * Usage:
 *   POLYGLOT_PROVIDER=openai POLYGLOT_API_KEY=sk-... npx poly-glot-mcp
 */

import { McpServer }          from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z }                  from 'zod';
import {
  PolyGlotGenerator,
  SUPPORTED_LANGUAGES,
  LANGUAGE_STYLE,
  LANGUAGE_STYLE_DETAIL,
  OPENAI_MODELS,
  ANTHROPIC_MODELS,
  type Language,
  type GeneratorConfig,
} from './generator.js';

// ─── Config from environment ──────────────────────────────────────────────────

function loadConfig(): GeneratorConfig {
  const provider = (process.env.POLYGLOT_PROVIDER ?? 'openai').toLowerCase();
  if (provider !== 'openai' && provider !== 'anthropic') {
    die(`POLYGLOT_PROVIDER must be "openai" or "anthropic", got: "${provider}"`);
  }

  const apiKey = process.env.POLYGLOT_API_KEY ?? '';
  if (!apiKey) {
    die(
      'POLYGLOT_API_KEY is required.\n\n' +
      'Set it before starting the server:\n' +
      '  POLYGLOT_PROVIDER=openai POLYGLOT_API_KEY=sk-... npx poly-glot-mcp\n\n' +
      'Get an OpenAI key:    https://platform.openai.com/api-keys\n' +
      'Get an Anthropic key: https://console.anthropic.com/settings/keys'
    );
  }

  return {
    provider: provider as 'openai' | 'anthropic',
    apiKey,
    model: process.env.POLYGLOT_MODEL || undefined,
  };
}

function die(msg: string): never {
  process.stderr.write(`[poly-glot-mcp] ERROR: ${msg}\n`);
  process.exit(1);
}

// ─── Shared Zod schemas ───────────────────────────────────────────────────────

const languageEnum = z.enum(
  SUPPORTED_LANGUAGES as unknown as [Language, ...Language[]],
  {
    errorMap: () => ({
      message: `language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`,
    }),
  }
);

const codeSchema = z
  .string()
  .min(1, 'code must not be empty')
  .max(100_000, 'code must be under 100,000 characters');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a USD cost as a human-readable string. */
function formatCost(usd: number): string {
  if (usd < 0.000001) return '<$0.000001';
  if (usd < 0.01)     return `$${usd.toFixed(6)}`;
  return `$${usd.toFixed(4)}`;
}

/** Build a consistent usage footer for tool results. */
function usageFooter(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  costUSD: number
): string {
  return (
    `\n\n---\n` +
    `🦜 **Poly-Glot AI** | ${provider} / ${model}\n` +
    `📊 Tokens: ${inputTokens} in · ${outputTokens} out · ` +
    `💰 Cost: ${formatCost(costUSD)}`
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const cfg       = loadConfig();
  const generator = new PolyGlotGenerator(cfg);

  const server = new McpServer(
    {
      name:    'poly-glot',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ── Tool 1: polyglot_add_doc_comments ───────────────────────────────────────
  server.registerTool(
    'polyglot_add_doc_comments',
    {
      title:       'Add Documentation Comments',
      description:
        'Add professional documentation comments to code using the correct style for the ' +
        'language (JSDoc for JavaScript/TypeScript, Javadoc for Java, PyDoc for Python, ' +
        'Doxygen for C++, XML docs for C#, GoDoc, Rustdoc, YARD, PHPDoc, KDoc, Swift markup). ' +
        'Preserves all existing code — only adds comments.',
      inputSchema: {
        code: codeSchema.describe(
          'The source code to document. Paste the full function, class, or file.'
        ),
        language: languageEnum.describe(
          `Programming language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`
        ),
      },
    },
    async ({ code, language }) => {
      try {
        const result = await generator.generateComments(code, language);
        const style  = LANGUAGE_STYLE[language];
        return {
          content: [
            {
              type: 'text' as const,
              text:
                `## ${style} comments added ✅\n\n` +
                '```' + language + '\n' +
                result.code + '\n' +
                '```' +
                usageFooter(result.provider, result.model, result.inputTokens, result.outputTokens, result.costUSD),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `❌ Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // ── Tool 2: polyglot_add_why_comments ───────────────────────────────────────
  server.registerTool(
    'polyglot_add_why_comments',
    {
      title:       'Add WHY Comments',
      description:
        'Add inline WHY-comments to code — explaining non-obvious decisions, trade-offs, ' +
        'edge-case reasoning, and algorithmic choices. These are the comments that make ' +
        'code reviews faster and onboarding easier. Different from doc-comments: ' +
        'WHY-comments explain intent, not structure.',
      inputSchema: {
        code: codeSchema.describe(
          'The source code to annotate with WHY-comments.'
        ),
        language: languageEnum.describe(
          `Programming language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`
        ),
      },
    },
    async ({ code, language }) => {
      try {
        const result = await generator.generateWhyComments(code, language);
        return {
          content: [
            {
              type: 'text' as const,
              text:
                `## WHY-comments added ✅\n\n` +
                '```' + language + '\n' +
                result.code + '\n' +
                '```' +
                usageFooter(result.provider, result.model, result.inputTokens, result.outputTokens, result.costUSD),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `❌ Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // ── Tool 3: polyglot_add_all_comments ───────────────────────────────────────
  server.registerTool(
    'polyglot_add_all_comments',
    {
      title:       'Add All Comments (Doc + WHY)',
      description:
        'Two-pass comment generation: first adds documentation comments (JSDoc, Javadoc, etc.) ' +
        'then adds WHY-comments explaining intent and reasoning. ' +
        'The most thorough option — produces fully commented, review-ready code in one call.',
      inputSchema: {
        code: codeSchema.describe(
          'The source code to fully document.'
        ),
        language: languageEnum.describe(
          `Programming language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`
        ),
      },
    },
    async ({ code, language }) => {
      try {
        const result = await generator.generateBoth(code, language);
        const style  = LANGUAGE_STYLE[language];
        return {
          content: [
            {
              type: 'text' as const,
              text:
                `## ${style} + WHY-comments added ✅\n\n` +
                '```' + language + '\n' +
                result.code + '\n' +
                '```' +
                usageFooter(result.provider, result.model, result.inputTokens, result.outputTokens, result.costUSD),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `❌ Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // ── Tool 4: polyglot_explain_code ───────────────────────────────────────────
  server.registerTool(
    'polyglot_explain_code',
    {
      title:       'Explain & Analyse Code',
      description:
        'Deep code analysis: plain-English summary, complexity score (1–10), ' +
        'function-by-function breakdown, potential bugs, refactoring suggestions, ' +
        'and a documentation quality score. Great for code review, onboarding, ' +
        'or understanding unfamiliar code.',
      inputSchema: {
        code: codeSchema.describe(
          'The source code to analyse.'
        ),
        language: languageEnum.describe(
          `Programming language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`
        ),
      },
    },
    async ({ code, language }) => {
      try {
        const r = await generator.explainCode(code, language);

        const fnLines = r.functions.length > 0
          ? r.functions.map(f =>
              `  - **${f.name}(${f.params.join(', ')})** → ${f.returns}\n    ${f.purpose}`
            ).join('\n')
          : '  _No named functions found_';

        const bugLines = r.potentialBugs.length > 0
          ? r.potentialBugs.map(b => `  - ⚠️ ${b}`).join('\n')
          : '  ✅ No obvious bugs detected';

        const suggLines = r.suggestions.length > 0
          ? r.suggestions.map(s => `  - 💡 ${s}`).join('\n')
          : '  ✅ No suggestions';

        const docIssues = r.docQuality.issues.length > 0
          ? r.docQuality.issues.map(i => `  - ${i}`).join('\n')
          : '  ✅ No issues';

        const text =
          `## Code Analysis — ${language} ✅\n\n` +
          `### Summary\n${r.summary}\n\n` +
          `### Complexity\n${r.complexity} (${r.complexityScore}/10)\n\n` +
          `### Functions\n${fnLines}\n\n` +
          `### Potential Bugs\n${bugLines}\n\n` +
          `### Suggestions\n${suggLines}\n\n` +
          `### Documentation Quality\n` +
          `**${r.docQuality.label}** (${r.docQuality.score}/100)\n${docIssues}` +
          usageFooter(r.provider, r.model, 0, 0, r.costUSD);

        return { content: [{ type: 'text' as const, text }] };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `❌ Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  // ── Tool 5: polyglot_list_languages ─────────────────────────────────────────
  server.registerTool(
    'polyglot_list_languages',
    {
      title:       'List Supported Languages',
      description:
        'Returns all 12 languages supported by Poly-Glot, with the comment style used ' +
        'for each. Use this to check which language identifier to pass to the other tools.',
      inputSchema: {},
    },
    async () => {
      const rows = SUPPORTED_LANGUAGES.map(lang =>
        `| \`${lang}\` | ${LANGUAGE_STYLE[lang]} | ${LANGUAGE_STYLE_DETAIL[lang]} |`
      ).join('\n');

      return {
        content: [
          {
            type: 'text' as const,
            text:
              `## Poly-Glot Supported Languages\n\n` +
              `| Language | Style | Detail |\n` +
              `|----------|-------|--------|\n` +
              rows +
              `\n\n_Pass the \`language\` column value to any Poly-Glot tool._`,
          },
        ],
      };
    }
  );

  // ── Tool 6: polyglot_list_models ────────────────────────────────────────────
  server.registerTool(
    'polyglot_list_models',
    {
      title:       'List Available Models',
      description:
        'Returns all available AI models for a given provider (openai or anthropic), ' +
        'with cost tier information. Use this to choose a model before setting ' +
        'POLYGLOT_MODEL, or just to understand your cost options.',
      inputSchema: {
        provider: z
          .enum(['openai', 'anthropic'])
          .describe('AI provider to list models for'),
      },
    },
    async ({ provider }) => {
      const models = provider === 'anthropic' ? ANTHROPIC_MODELS : OPENAI_MODELS;

      const rows = models.map(m =>
        `| \`${m.id}\` | ${m.label} | ${m.costTier} |`
      ).join('\n');

      const defaultModel = provider === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4.1-mini';

      return {
        content: [
          {
            type: 'text' as const,
            text:
              `## ${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} Models\n\n` +
              `| Model ID | Name | Cost Tier |\n` +
              `|----------|------|-----------|\n` +
              rows +
              `\n\n**Default:** \`${defaultModel}\`\n` +
              `**To override:** set \`POLYGLOT_MODEL=<model-id>\` when starting the server.`,
          },
        ],
      };
    }
  );

  // ── Start ───────────────────────────────────────────────────────────────────

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const modelInfo = cfg.model ? ` · model: ${cfg.model}` : '';
  process.stderr.write(
    `[poly-glot-mcp] ✅ Server running · provider: ${cfg.provider}${modelInfo}\n` +
    `[poly-glot-mcp] 🦜 6 tools ready: add_doc_comments, add_why_comments, add_all_comments, explain_code, list_languages, list_models\n`
  );
}

main().catch(err => {
  process.stderr.write(`[poly-glot-mcp] FATAL: ${(err as Error).message}\n`);
  process.exit(1);
});
