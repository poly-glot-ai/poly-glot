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
 *   POLYGLOT_SESSION_TOKEN  your poly-glot.ai session token  (required — Pro+ plan)
 *   POLYGLOT_PROVIDER       openai | anthropic                (default: openai)
 *   POLYGLOT_API_KEY        your API key                      (required)
 *   POLYGLOT_MODEL          model ID                          (optional — uses smart default)
 *
 * Plans & Quotas (per calendar month):
 *   Free       — blocked (403)
 *   Pro        — 200 MCP calls/mo
 *   Team       — 1,000 MCP calls/mo
 *   Enterprise — unlimited
 *
 * Usage:
 *   POLYGLOT_SESSION_TOKEN=pg_... POLYGLOT_PROVIDER=openai POLYGLOT_API_KEY=sk-... npx poly-glot-mcp
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

// ─── Auth constants ───────────────────────────────────────────────────────────

const POLYGLOT_AUTH_BASE = 'https://poly-glot.ai';
const PLAN_LABELS: Record<string, string> = {
  pro:        'Pro (200 calls/mo)',
  team:       'Team (1,000 calls/mo)',
  enterprise: 'Enterprise (unlimited)',
};
// ─── Per-call usage tracking ─────────────────────────────────────────────────

/**
 * Fire-and-forget POST to /api/auth/mcp-track-usage.
 * Called inside every generative tool handler BEFORE the AI call.
 * Returns:
 *   { ok: true, used, remaining, limit }  — quota incremented, call allowed
 *   { ok: false, error, code }            — quota exceeded (429) or plan blocked (403)
 * Never throws — catches all network errors so a connectivity blip never
 * breaks a paying user mid-session. On network failure: logs warning, allows call.
 */
async function trackMcpUsage(token: string): Promise<{ allowed: boolean; message?: string }> {
  const url = `${POLYGLOT_AUTH_BASE}/api/auth/mcp-track-usage`;
  try {
    const res = await fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':   'poly-glot-mcp/tool-call',
      },
      body:   JSON.stringify({ token }),
      signal: AbortSignal.timeout(6_000),
    });

    if (res.status === 403) {
      // Free plan — hard block
      return { allowed: false, message: '❌ MCP requires a Pro plan. Upgrade at https://poly-glot.ai/#pricing' };
    }

    if (res.status === 429) {
      // Quota exhausted
      let body: { used?: number; limit?: number; month?: string } = {};
      try { body = (await res.json()) as typeof body; } catch { /* ignore */ }
      return {
        allowed: false,
        message: `❌ MCP quota exhausted (${body.used ?? '?'}/${body.limit ?? '?'} calls used in ${body.month ?? 'this month'}).\n` +
                 `Quota resets on the 1st of next month. Upgrade at https://poly-glot.ai/#pricing`,
      };
    }

    if (res.status === 401) {
      return { allowed: false, message: '❌ POLYGLOT_SESSION_TOKEN is invalid or expired. Get a new token at https://poly-glot.ai/dashboard' };
    }

    if (!res.ok) {
      // Unexpected server error — fail open so paying users aren't blocked
      process.stderr.write(`[poly-glot-mcp] ⚠️  mcp-track-usage returned ${res.status} — allowing call\n`);
      return { allowed: true };
    }

    // Success — quota incremented
    let body: { used?: number; remaining?: number | null; limit?: number | null } = {};
    try { body = (await res.json()) as typeof body; } catch { /* ignore */ }
    const remaining = body.remaining == null ? 'unlimited' : body.remaining;
    process.stderr.write(`[poly-glot-mcp] 📊 MCP usage: ${body.used ?? '?'} calls used · ${remaining} remaining\n`);
    return { allowed: true };

  } catch (err) {
    // Network error — fail CLOSED: block the call to prevent untracked usage
    process.stderr.write(
      `[poly-glot-mcp] ❌ Could not reach auth server: ${(err as Error)?.message ?? String(err)}\n`
    );
    return {
      allowed: false,
      message: '❌ Could not reach Poly-Glot auth server to verify your quota. Check your internet connection and try again.',
    };
  }
}

// ─── Session token validation ─────────────────────────────────────────────────

/**
 * Validates the POLYGLOT_SESSION_TOKEN against the Poly-Glot auth worker.
 * Calls GET /api/auth/mcp-get-usage?token=<token> (non-destructive quota check).
 * Exits with error if:
 *   - No token provided
 *   - Token invalid / 401
 *   - Plan is Free (403)
 *   - Monthly quota already exhausted (429)
 *   - Network error after 2 retries
 */
async function validateSessionToken(token: string): Promise<void> {
  const url = `${POLYGLOT_AUTH_BASE}/api/auth/mcp-get-usage?token=${encodeURIComponent(token)}`;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method:  'GET',
        headers: { 'User-Agent': 'poly-glot-mcp/startup-check' },
        signal:  AbortSignal.timeout(8_000),
      });

      if (res.status === 401) {
        die(
          'POLYGLOT_SESSION_TOKEN is invalid or expired.\n\n' +
          'Get your session token at: https://poly-glot.ai/dashboard → Account → API Token\n' +
          'Then set:  POLYGLOT_SESSION_TOKEN=pg_...'
        );
      }

      if (res.status === 403) {
        let plan = 'free';
        try { plan = ((await res.json()) as { plan?: string })?.plan ?? 'free'; } catch { /* ignore */ }
        die(
          `Your Poly-Glot plan (${plan}) does not include MCP access.\n\n` +
          'MCP is available on Pro and above.\n' +
          'Upgrade at: https://poly-glot.ai/#pricing'
        );
      }

      if (res.status === 429) {
        let body: { used?: number; limit?: number; month?: string } = {};
        try { body = (await res.json()) as typeof body; } catch { /* ignore */ }
        die(
          `MCP quota exhausted for ${body.month ?? 'this month'}.\n` +
          `Used: ${body.used ?? '?'} / ${body.limit ?? '?'} calls.\n\n` +
          'Quota resets on the 1st of next month.\n' +
          'Upgrade for a higher quota: https://poly-glot.ai/#pricing'
        );
      }

      if (!res.ok) {
        // Unexpected error — log and exit
        const text = await res.text().catch(() => '(no body)');
        die(`Auth server returned ${res.status}: ${text}`);
      }

      // Success — parse and print quota info for the user
      let body: { plan?: string; used?: number; limit?: number | null; remaining?: number | null; month?: string } = {};
      try { body = (await res.json()) as typeof body; } catch { /* ignore */ }

      const planLabel = PLAN_LABELS[body.plan ?? ''] ?? body.plan ?? 'unknown';
      const remaining = body.remaining == null ? 'unlimited' : String(body.remaining);
      const limit     = body.limit     == null ? 'unlimited' : String(body.limit);

      process.stderr.write(
        `[poly-glot-mcp] 🔐 Authenticated · plan: ${planLabel}\n` +
        `[poly-glot-mcp] 📊 MCP quota: ${body.used ?? 0}/${limit} used this month · ${remaining} remaining\n`
      );
      return; // success — exit validation

    } catch (err) {
      lastErr = err;
      if (attempt < 3) {
        process.stderr.write(`[poly-glot-mcp] ⚠️  Auth check attempt ${attempt} failed, retrying...\n`);
        await new Promise(r => setTimeout(r, 1_500 * attempt));
      }
    }
  }

  // All 3 attempts failed — warn but don't block (network may be temporarily down)
  process.stderr.write(
    `[poly-glot-mcp] ⚠️  WARNING: Could not reach auth server after 3 attempts.\n` +
    `[poly-glot-mcp] ⚠️  Proceeding, but API calls may fail if token is invalid.\n` +
    `[poly-glot-mcp] ⚠️  Last error: ${(lastErr as Error)?.message ?? String(lastErr)}\n`
  );
}

function loadConfig(): GeneratorConfig {
  // ── Session token (Pro+ required) ──────────────────────────────────────────
  const sessionToken = process.env.POLYGLOT_SESSION_TOKEN ?? '';
  if (!sessionToken) {
    die(
      'POLYGLOT_SESSION_TOKEN is required for MCP access.\n\n' +
      'MCP is a Pro+ feature. Get your session token at:\n' +
      '  https://poly-glot.ai/dashboard → Account → API Token\n\n' +
      'Then start the server with:\n' +
      '  POLYGLOT_SESSION_TOKEN=pg_... POLYGLOT_PROVIDER=openai POLYGLOT_API_KEY=sk-... npx poly-glot-mcp\n\n' +
      'Upgrade to Pro at: https://poly-glot.ai/#pricing'
    );
  }

  // ── Provider + API key ────────────────────────────────────────────────────
  const provider = (process.env.POLYGLOT_PROVIDER ?? 'openai').toLowerCase();
  if (provider !== 'openai' && provider !== 'anthropic') {
    die(`POLYGLOT_PROVIDER must be "openai" or "anthropic", got: "${provider}"`);
  }

  const apiKey = process.env.POLYGLOT_API_KEY ?? '';
  if (!apiKey) {
    die(
      'POLYGLOT_API_KEY is required.\n\n' +
      'Set it before starting the server:\n' +
      '  POLYGLOT_SESSION_TOKEN=pg_... POLYGLOT_PROVIDER=openai POLYGLOT_API_KEY=sk-... npx poly-glot-mcp\n\n' +
      'Get an OpenAI key:    https://platform.openai.com/api-keys\n' +
      'Get an Anthropic key: https://console.anthropic.com/settings/keys'
    );
  }

  return {
    provider: provider as 'openai' | 'anthropic',
    apiKey,
    model:         process.env.POLYGLOT_MODEL || undefined,
    sessionToken,  // passed through for per-call tracking
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
  costUSD: number,
): string {
  return (
    `\n\n---\n_Provider: ${provider} · Model: ${model} · ` +
    `Tokens: ${inputTokens} in / ${outputTokens} out · ` +
    `Cost: ${formatCost(costUSD)}_`
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const cfg = loadConfig();

  // ── Validate session token against auth server (Pro+ plan required) ─────────
  // This is a non-destructive quota check — it does NOT consume a call.
  // Exits with a clear error if the token is invalid, plan is Free, or quota exhausted.
  await validateSessionToken(cfg.sessionToken!);

  // Session token reference for per-call tracking
  const sessionToken = cfg.sessionToken!;

  const generator = new PolyGlotGenerator(cfg);

  const server = new McpServer({
    name:    'poly-glot-mcp',
    version: '1.0.0',
  });

  // ── Tool 1: polyglot_add_doc_comments ───────────────────────────────────────
  server.registerTool(
    'polyglot_add_doc_comments',
    {
      title:       'Add Documentation Comments',
      description:
        'Adds professional documentation comments to source code using the standard ' +
        'format for the given language (JSDoc for JavaScript/TypeScript, PyDoc for Python, ' +
        'Javadoc for Java, KDoc for Kotlin, Doxygen for C/C++, etc.). ' +
        'Returns the fully documented code.',
      inputSchema: {
        code:     codeSchema.describe('The source code to document'),
        language: languageEnum.describe('Programming language of the code'),
      },
    },
    async ({ code, language }) => {
      const quota = await trackMcpUsage(sessionToken);
      if (!quota.allowed) return { content: [{ type: 'text' as const, text: quota.message! }], isError: true };
      try {
        const r = await generator.generateComments(code, language);
        const text = r.code + usageFooter(r.provider, r.model, r.inputTokens, r.outputTokens, r.costUSD);
        return { content: [{ type: 'text' as const, text }] };
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
        'Adds inline WHY-comments to source code — explaining the reasoning, trade-offs, ' +
        'and non-obvious decisions in the code. WHY comments are placed near the relevant ' +
        'code as inline comments and explain intent rather than what the code does. ' +
        'These are especially useful for AI coding assistants (Copilot, Cursor, etc.) ' +
        'which use comments to understand developer intent.',
      inputSchema: {
        code:     codeSchema.describe('The source code to annotate with WHY comments'),
        language: languageEnum.describe('Programming language of the code'),
      },
    },
    async ({ code, language }) => {
      const quota = await trackMcpUsage(sessionToken);
      if (!quota.allowed) return { content: [{ type: 'text' as const, text: quota.message! }], isError: true };
      try {
        const r = await generator.generateWhyComments(code, language);
        const text = r.code + usageFooter(r.provider, r.model, r.inputTokens, r.outputTokens, r.costUSD);
        return { content: [{ type: 'text' as const, text }] };
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
        'Adds BOTH documentation comments (JSDoc, PyDoc, Javadoc, etc.) AND inline ' +
        'WHY-comments in a single pass. This is the most comprehensive commenting mode — ' +
        'it produces documentation for function signatures AND reasoning comments for ' +
        'non-obvious logic. Equivalent to running add_doc_comments + add_why_comments ' +
        'but more efficient (single API call).',
      inputSchema: {
        code:     codeSchema.describe('The source code to fully document'),
        language: languageEnum.describe('Programming language of the code'),
      },
    },
    async ({ code, language }) => {
      const quota = await trackMcpUsage(sessionToken);
      if (!quota.allowed) return { content: [{ type: 'text' as const, text: quota.message! }], isError: true };
      try {
        const r = await generator.generateBoth(code, language);
        const text = r.code + usageFooter(r.provider, r.model, r.inputTokens, r.outputTokens, r.costUSD);
        return { content: [{ type: 'text' as const, text }] };
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
      title:       'Explain Code',
      description:
        'Performs a deep analysis of source code and returns a structured report ' +
        'covering: complexity score, potential bugs, documentation quality score (0–100), ' +
        'function-by-function breakdown, and improvement recommendations. ' +
        'Use this when you want to understand what code does, assess its quality, ' +
        'or get a detailed technical explanation.',
      inputSchema: {
        code:     codeSchema.describe('The source code to analyse'),
        language: languageEnum.describe('Programming language of the code'),
      },
    },
    async ({ code, language }) => {
      const quota = await trackMcpUsage(sessionToken);
      if (!quota.allowed) return { content: [{ type: 'text' as const, text: quota.message! }], isError: true };
      try {
        const r = await generator.explainCode(code, language);
        const text = [
          `## 🔍 Code Analysis`,
          `**Summary:** ${r.summary}`,
          `**Complexity:** ${r.complexity} (score: ${r.complexityScore})`,
          `**Language:** ${r.language}`,
          r.functions.length ? `\n**Functions (${r.functions.length}):**\n` + r.functions.map(f =>
            `- \`${f.name}\` — ${f.purpose}${f.params.length ? ` | params: ${f.params.join(', ')}` : ''}${f.returns ? ` | returns: ${f.returns}` : ''}`
          ).join('\n') : '',
          r.potentialBugs.length ? `\n**⚠️ Potential Bugs:**\n` + r.potentialBugs.map(b => `- ${b}`).join('\n') : '',
          r.suggestions.length ? `\n**💡 Suggestions:**\n` + r.suggestions.map(s => `- ${s}`).join('\n') : '',
          `\n**📊 Doc Quality:** ${r.docQuality.score}/100 — ${r.docQuality.label}`,
          r.docQuality.issues.length ? r.docQuality.issues.map(i => `  - ${i}`).join('\n') : '',
          usageFooter(r.provider, r.model, r.inputTokens, r.outputTokens, r.costUSD),
        ].filter(Boolean).join('\n');
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

  // ── Tool 7: polyglot_github_app_info ────────────────────────────────────────
  server.registerTool(
    'polyglot_github_app_info',
    {
      title:       'GitHub App — Questions & Answers',
      description:
        'Answers questions about the Poly-Glot AI GitHub App — what it does, how to ' +
        'install it, how it works on pull requests, configuration via .polyglot.yml, ' +
        'supported languages, privacy, pricing, and how it compares to the VS Code extension. ' +
        'Use this when a user asks anything about the Poly-Glot GitHub App or how to ' +
        'auto-document pull requests.',
      inputSchema: {
        question: z
          .string()
          .min(1)
          .describe(
            'The question to answer about the Poly-Glot AI GitHub App. ' +
            'Examples: "What does the GitHub App do?", "How do I install it?", ' +
            '"What languages are supported?", "How is my code kept private?", ' +
            '"How do I configure .polyglot.yml?", "What does the Check Run show?"'
          ),
      },
    },
    async ({ question }) => {
      const q = question.toLowerCase();

      const QA: Array<{ keywords: string[]; answer: string }> = [
        {
          keywords: ['what', 'does', 'github app', 'do', 'overview', 'about'],
          answer: `## 🐙 What does the Poly-Glot AI GitHub App do?

The Poly-Glot AI GitHub App automatically reviews every pull request and adds professional documentation comments to undocumented code. Install it once and it works on every PR — no manual steps required.

**When a PR is opened or updated, the app:**
1. 📂 Scans all changed files for missing documentation
2. 📊 Calculates a per-file documentation coverage score
3. 🤖 Generates doc comments using OpenAI or Anthropic AI
4. 💬 Posts inline review suggestions directly on the PR
5. ✅ Creates a GitHub Check Run with coverage metrics

**Example PR review output:**
\`\`\`
🤖 Poly-Glot AI Documentation Analysis
Files analyzed: 3 · Needing docs: 2 · Coverage: 45%

📝 auth.js — JSDoc suggestion:
/**
 * Authenticates a user with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<AuthResult>}
 */
✓ Posted as inline review comment
\`\`\`

**Install free:** https://github.com/apps/poly-glot-ai
**Source code:** https://github.com/hmoses/poly-glot-github-app`,
        },
        {
          keywords: ['install', 'setup', 'get started', 'how to use', 'add to repo'],
          answer: `## 🚀 How do I install the Poly-Glot AI GitHub App?

**Step 1 — Install from GitHub Marketplace:**
👉 https://github.com/apps/poly-glot-ai

Click "Install" and choose which repositories to grant access to (all repos or specific ones).

**Step 2 — Configure (optional):**
Add a \`.polyglot.yml\` to your repo root to customize behavior — mode, languages, thresholds, and more.

**Step 3 — Open a Pull Request:**
That's it! Poly-Glot AI automatically analyzes your PR and posts documentation suggestions as inline review comments.

> 🔒 Your code is never stored. No data retention. Open source under MIT License.`,
        },
        {
          keywords: ['language', 'support', 'jsdoc', 'pydoc', 'javadoc', 'doxygen', 'kdoc', 'godoc', 'rustdoc', '12'],
          answer: `## 🌐 What languages does the GitHub App support?

The GitHub App supports **12 programming languages** with their standard documentation formats:

| Language   | Doc Format   | File Extensions          |
|------------|-------------|--------------------------|
| JavaScript | JSDoc        | .js, .jsx, .mjs, .cjs    |
| TypeScript | TSDoc        | .ts, .tsx                |
| Python     | PyDoc        | .py, .pyi                |
| Java       | Javadoc      | .java                    |
| Kotlin     | KDoc         | .kt, .kts                |
| C          | Doxygen      | .c, .h                   |
| C++        | Doxygen      | .cpp, .hpp, .cc, .cxx    |
| C#         | XML Doc      | .cs                      |
| Go         | GoDoc        | .go                      |
| Rust       | Rustdoc      | .rs                      |
| Swift      | Swift Markup | .swift                   |
| PHP        | PHPDoc       | .php                     |
| Ruby       | YARD         | .rb, .rake               |`,
        },
        {
          keywords: ['polyglot.yml', 'config', 'configure', 'settings', 'customize', 'options', 'yaml'],
          answer: `## ⚙️ How do I configure the GitHub App with .polyglot.yml?

Add a \`.polyglot.yml\` file to your repository root to customize behavior:

\`\`\`yaml
# AI provider: 'openai' or 'anthropic'
provider: openai

# Comment mode:
# - doc:  Standard documentation comments (JSDoc, PyDoc, Javadoc, etc.)
# - why:  Explain reasoning, trade-offs, and edge cases
# - both: Doc comments AND why-comments in one pass
mode: doc

# Only suggest docs for files below this coverage ratio (0.0–1.0)
coverage_threshold: 0.5

# Maximum files to process per PR
max_files: 15

# Maximum file size in bytes to process
max_file_size: 50000

# Review style: 'inline' (per-file) or 'summary' (single comment)
review_style: inline

# File patterns to exclude
exclude:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/vendor/**"
  - "**/node_modules/**"

# Create a GitHub Check Run with coverage analysis
check_run: true
\`\`\``,
        },
        {
          keywords: ['privacy', 'private', 'secure', 'data', 'store', 'retention', 'code sent', 'safe'],
          answer: `## 🔒 Is my code private? How is data handled?

**Yes — your code stays completely private.**

- ❌ Code is **never stored** on Poly-Glot servers
- ❌ **No data retention** — code is processed in memory and discarded immediately
- ❌ Code is **never used for AI training**
- ✅ Code is only sent to your configured AI provider (OpenAI or Anthropic)
- ✅ Both providers prohibit training on API inputs
- ✅ You can **self-host** the app to keep all processing within your own infrastructure

**Data flow:**
\`\`\`
GitHub PR → App Server (in-memory only) → OpenAI/Anthropic → PR Review Comment
                                                 ↓
                                          Memory cleared immediately
\`\`\`

Full privacy policy: https://github.com/hmoses/poly-glot-github-app/blob/main/PRIVACY.md`,
        },
        {
          keywords: ['price', 'pricing', 'cost', 'free', 'paid', 'plan'],
          answer: `## 💰 How much does the GitHub App cost?

The Poly-Glot AI GitHub App is **free to install** from the GitHub Marketplace.

**What you pay for:**
- The app itself: **Free**
- AI API calls: You bring your own OpenAI or Anthropic API key — you pay only for what you use, directly to the provider

**Typical cost per PR:**
- OpenAI gpt-4.1-mini: ~$0.002/PR (most cost-effective)
- Anthropic claude-sonnet: ~$0.005/PR

**Install free:** https://github.com/apps/poly-glot-ai`,
        },
        {
          keywords: ['check run', 'coverage', 'score', 'metric', 'analysis', 'report'],
          answer: `## 📊 What is the GitHub Check Run / coverage analysis?

After analyzing a PR, Poly-Glot AI creates a **GitHub Check Run** on the head commit showing:

\`\`\`
Poly-Glot AI — 2 file(s) need documentation

Files analyzed:     3
Files needing docs: 2
Average coverage:   45%
Comment mode:       doc
Provider:           openai
\`\`\`

**Per-file breakdown:**
| File     | Status | Score | Reason                                    |
|----------|--------|-------|-------------------------------------------|
| auth.js  | ⚠️     | 0.23  | 2/9 functions documented (23%)            |
| utils.py | ✅     | 0.85  | 11/13 functions documented (85%)          |
| index.ts | ⚠️     | 0.10  | 1/10 functions documented (10%)           |

The check shows ✅ when all files meet the threshold, or ⚠️ when suggestions are available.`,
        },
        {
          keywords: ['web editor', 'open in', 'poly-glot.ai', 'deep link', 'button', 'interface', 'browser'],
          answer: `## 🌐 Can I edit and regenerate docs in the Poly-Glot AI web editor?

Yes! Every PR review comment includes an **"Open in Poly-Glot AI"** button that deep-links to the web editor:

\`\`\`
| Action                               | Link                                 |
|--------------------------------------|--------------------------------------|
| 🌐 Edit & regenerate in Poly-Glot AI  | Open auth.js in web editor →         |
| 💻 Use in VS Code                     | Install VS Code Extension →          |
| ⌨️  Use CLI                           | npx poly-glot-ai-cli comment auth.js |
\`\`\`

Clicking the web editor link opens poly-glot.ai with:
- ✅ Your file's code **pre-loaded** in the generator
- ✅ A banner: "Opened from GitHub PR Review · auth.js"
- ✅ Page auto-scrolls to the generator
- ✅ Use your own API key, change mode (doc/why/both), regenerate

**Web editor:** https://poly-glot.ai`,
        },
        {
          keywords: ['source', 'open source', 'self host', 'github repo', 'mit', 'license'],
          answer: `## 📦 Is the GitHub App open source? Can I self-host it?

Yes! The Poly-Glot AI GitHub App is **fully open source** under the MIT License.

**Source code:** https://github.com/hmoses/poly-glot-github-app

**Self-hosting with Docker:**
\`\`\`bash
git clone https://github.com/hmoses/poly-glot-github-app.git
cd poly-glot-github-app
cp .env.example .env
# Add your GitHub App credentials and AI API key to .env
docker-compose up -d
\`\`\`

**Required environment variables:**
\`\`\`
GITHUB_APP_ID=your-app-id
GITHUB_PRIVATE_KEY=your-private-key.pem
GITHUB_WEBHOOK_SECRET=your-webhook-secret
OPENAI_API_KEY=sk-...
\`\`\``,
        },
        {
          keywords: ['vs code', 'vscode', 'extension', 'difference', 'compare', 'versus'],
          answer: `## 💻 How does the GitHub App compare to the VS Code Extension?

| Feature               | VS Code Extension          | GitHub App                    |
|-----------------------|---------------------------|-------------------------------|
| Where you interact    | Inside VS Code editor     | GitHub PR review page         |
| Trigger               | You click Generate        | Automatic on every PR         |
| See results           | Inline in your file       | As PR review comments         |
| API key               | Paste in VS Code settings | Add to .polyglot.yml or env   |
| Languages             | Same 12 languages         | Same 12 languages             |
| Doc styles            | JSDoc, PyDoc, Javadoc...  | Same                          |
| Web editor bridge     | N/A                       | Deep-link to poly-glot.ai     |

**Install VS Code Extension:** https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot
**Install GitHub App:** https://github.com/apps/poly-glot-ai`,
        },
      ];

      // Find best matching Q&A entry by keyword score
      let bestMatch = QA[0];
      let bestScore = 0;

      for (const entry of QA) {
        const score = entry.keywords.filter(kw => q.includes(kw)).length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = entry;
        }
      }

      // If no keyword match, return overview + topic list
      if (bestScore === 0) {
        const topics = [
          '• What does the GitHub App do?',
          '• How do I install it?',
          '• What languages are supported?',
          '• How do I configure .polyglot.yml?',
          '• Is my code private?',
          '• How much does it cost?',
          '• What does the Check Run show?',
          '• Can I use the web editor from a PR?',
          '• Is it open source / can I self-host?',
          '• How does it compare to the VS Code Extension?',
        ].join('\n');

        return {
          content: [{
            type: 'text' as const,
            text: QA[0].answer + '\n\n---\n\n**Ask me about:**\n' + topics,
          }],
        };
      }

      return {
        content: [{ type: 'text' as const, text: bestMatch.answer }],
      };
    }
  );

  // ── Start ───────────────────────────────────────────────────────────────────

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const modelInfo = cfg.model ? ` · model: ${cfg.model}` : '';
  process.stderr.write(
    `[poly-glot-mcp] ✅ Server running · provider: ${cfg.provider}${modelInfo}\n` +
    `[poly-glot-mcp] 🦜 7 tools ready: add_doc_comments, add_why_comments, add_all_comments, explain_code, list_languages, list_models, github_app_info\n` +
    `[poly-glot-mcp] ℹ️  Each tool call tracks against your MCP quota via /api/auth/mcp-track-usage\n`
  );
}

main().catch(err => {
  process.stderr.write(`[poly-glot-mcp] FATAL: ${(err as Error).message}\n`);
  process.exit(1);
});
