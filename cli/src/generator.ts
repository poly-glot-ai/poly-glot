/**
 * Poly-Glot CLI — AI generator
 * Mirrors the logic in vscode-extension/src/ai-generator.ts but with no VS Code dependency.
 * Uses the native Node.js fetch (available in Node 18+).
 */

import { Config } from './config';

// ─── Language → comment style ─────────────────────────────────────────────────

const LANGUAGE_STYLE: Record<string, string> = {
    javascript: 'JSDoc',
    typescript: 'TSDoc/JSDoc',
    python:     'Google-style docstrings',
    java:       'Javadoc',
    csharp:     'XML doc comments (/// <summary>)',
    cpp:        'Doxygen',
    c:          'Doxygen',
    go:         'GoDoc',
    rust:       'Rust doc comments (///)',
    ruby:       'YARD',
    php:        'PHPDoc',
    swift:      'Swift markup (///)',
    kotlin:     'KDoc',
};

// ─── Pricing (per 1K tokens) ──────────────────────────────────────────────────

const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
    'gpt-4o':        { input: 0.0025,  output: 0.010  },
    'gpt-4o-mini':   { input: 0.00015, output: 0.0006 },
    'gpt-4-turbo':   { input: 0.01,    output: 0.03   },
    '_default':      { input: 0.002,   output: 0.008  },
};

const ANTHROPIC_PRICING: Record<string, { input: number; output: number }> = {
    'claude-sonnet-4-5':          { input: 0.003,  output: 0.015 },
    'claude-3-5-sonnet-20241022': { input: 0.003,  output: 0.015 },
    'claude-3-5-haiku-20241022':  { input: 0.0008, output: 0.004 },
    'claude-3-opus-20240229':     { input: 0.015,  output: 0.075 },
    '_default':                   { input: 0.003,  output: 0.015 },
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface GenerateResult {
    commentedCode: string;
    model: string;
    cost: number;
    tokensUsed: number;
}

export interface FunctionInfo {
    name: string;
    purpose: string;
    params: string[];
    returns: string;
}

export interface DocQuality {
    score: number;
    label: string;
    issues: string[];
    suggestions: string[];
}

export interface ExplainResult {
    summary: string;
    complexity: string;
    complexityScore: number;
    language: string;
    functions: FunctionInfo[];
    potentialBugs: string[];
    suggestions: string[];
    docQuality: DocQuality;
    model: string;
    cost: number;
}

export interface WhyResult {
    commentedCode: string;
    model: string;
    cost: number;
    tokensUsed: number;
}

export interface BothResult {
    commentedCode: string;  // doc-comments + why-comments merged
    model: string;
    cost: number;
    tokensUsed: number;
}

// ─── Generator ────────────────────────────────────────────────────────────────

export class PolyGlotGenerator {
    private cfg: Config;

    constructor(cfg: Config) {
        this.cfg = cfg;
    }

    async generateComments(code: string, languageId: string): Promise<GenerateResult> {
        const style = LANGUAGE_STYLE[languageId] || 'inline comments';
        const prompt = this._buildCommentPrompt(code, languageId, style);
        const raw    = await this._call(prompt);

        // Strip markdown fences if the model wrapped the output
        const commentedCode = raw
            .replace(/^```[\w]*\n?/m, '')
            .replace(/\n?```$/m, '')
            .trim();

        return {
            commentedCode,
            model:      raw,  // overwritten below
            cost:       0,
            tokensUsed: 0,
        };
    }

    /**
     * Run comment + why in sequence.
     * Pass 1: add full doc-comments (JSDoc / PyDoc / etc.)
     * Pass 2: add why-comments to the already-documented output
     * Result: both types of comments coexist in a single file.
     */
    async generateBoth(code: string, languageId: string): Promise<BothResult> {
        const style   = LANGUAGE_STYLE[languageId] || 'inline comments';

        // Pass 1 — doc-comments
        const docPrompt = this._buildCommentPrompt(code, languageId, style);
        const docRaw    = await this._call(docPrompt);
        const docCode   = docRaw
            .replace(/^```[\w]*\n?/m, '')
            .replace(/\n?```$/m, '')
            .trim();

        // Pass 2 — why-comments applied to the doc-commented output
        const whyPrompt = this._buildWhyPrompt(docCode, languageId);
        const whyRaw    = await this._call(whyPrompt);
        const bothCode  = whyRaw
            .replace(/^```[\w]*\n?/m, '')
            .replace(/\n?```$/m, '')
            .trim();

        return {
            commentedCode: bothCode,
            model:         this.cfg.model || '',
            cost:          0,
            tokensUsed:    0,
        };
    }

    async generateWhyComments(code: string, languageId: string): Promise<WhyResult> {
        const prompt = this._buildWhyPrompt(code, languageId);
        const raw    = await this._call(prompt);

        const commentedCode = raw
            .replace(/^```[\w]*\n?/m, '')
            .replace(/\n?```$/m, '')
            .trim();

        return {
            commentedCode,
            model:      this.cfg.model || '',
            cost:       0,
            tokensUsed: 0,
        };
    }

    async explainCode(code: string, languageId: string): Promise<ExplainResult> {
        const prompt = this._buildExplainPrompt(code, languageId);
        const raw    = await this._call(prompt);

        try {
            const jsonMatch = raw.match(/```json\n?([\s\S]*?)\n?```/) || raw.match(/(\{[\s\S]*\})/);
            const parsed = JSON.parse(jsonMatch ? jsonMatch[1] : raw);
            return { ...parsed, model: this.cfg.model, cost: 0 };
        } catch {
            return {
                summary: raw,
                complexity: 'Unknown',
                complexityScore: 5,
                language: languageId,
                functions: [],
                potentialBugs: [],
                suggestions: [],
                docQuality: { score: 0, label: 'Unknown', issues: [], suggestions: [] },
                model: this.cfg.model,
                cost: 0,
            };
        }
    }

    // ─── Private: call the right API ──────────────────────────────────────────

    private async _call(prompt: string): Promise<string> {
        return this.cfg.provider === 'anthropic'
            ? this._callAnthropic(prompt)
            : this._callOpenAI(prompt);
    }

    private async _callOpenAI(prompt: string): Promise<string> {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.cfg.apiKey}`,
            },
            body: JSON.stringify({
                model: this.cfg.model || 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2,
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: { message: res.statusText } })) as { error?: { message?: string } };
            throw new Error(`OpenAI ${res.status}: ${err?.error?.message || res.statusText}`);
        }

        const data = await res.json() as { choices: Array<{ message: { content: string } }> };
        return data.choices[0]?.message?.content ?? '';
    }

    private async _callAnthropic(prompt: string): Promise<string> {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type':      'application/json',
                'x-api-key':         this.cfg.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: this.cfg.model || 'claude-sonnet-4-5',
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: { message: res.statusText } })) as { error?: { message?: string } };
            throw new Error(`Anthropic ${res.status}: ${err?.error?.message || res.statusText}`);
        }

        const data = await res.json() as { content: Array<{ type: string; text: string }> };
        return data.content.find(b => b.type === 'text')?.text ?? '';
    }

    // ─── Prompts ──────────────────────────────────────────────────────────────

    private _buildWhyPrompt(code: string, lang: string): string {
        return `You are a senior ${lang} engineer doing a code review. Add inline "why" comments to the following code.

Rules:
- Focus exclusively on WHY decisions were made, not WHAT the code does
- Comment on: algorithmic trade-offs, non-obvious choices, performance decisions, edge-case handling, historical context clues, and anything a new engineer would ask "why not just…?" about
- Use the correct single-line comment syntax for ${lang} (// for most languages, # for Python/Ruby/Shell, -- for SQL/Lua, ' for VBA)
- Place comments on the line immediately above the code they describe, or inline at the end of short lines
- Do NOT restate what the code does literally — only explain the reasoning behind it
- Do NOT add comments to self-explanatory lines (trivial assignments, obvious returns, etc.)
- Keep each comment to one line — concise and precise
- Keep existing code exactly as-is — only add comments
- Return ONLY the commented code, no explanations or markdown fences

Code:
${code}`;
    }

    private _buildCommentPrompt(code: string, lang: string, style: string): string {
        return `You are an expert ${lang} developer. Add comprehensive ${style} comments to the following code.

Rules:
- Use ${style} format strictly
- Add comments to all functions, classes, methods, and complex logic
- Include @param, @returns, @throws where applicable
- Keep existing code exactly as-is — only add comments
- Return ONLY the commented code, no explanations or markdown fences

Code:
${code}`;
    }

    private _buildExplainPrompt(code: string, lang: string): string {
        return `You are an expert code reviewer. Analyze this ${lang} code and return a JSON object with this exact structure:
{
  "summary": "One paragraph summary of what the code does",
  "complexity": "Low|Medium|High",
  "complexityScore": <1-10>,
  "language": "${lang}",
  "functions": [{ "name": "...", "purpose": "...", "params": ["..."], "returns": "..." }],
  "potentialBugs": ["..."],
  "suggestions": ["..."],
  "docQuality": {
    "score": <0-100>,
    "label": "Excellent|Good|Fair|Poor",
    "issues": ["..."],
    "suggestions": ["..."]
  }
}

Return ONLY valid JSON, no markdown.

Code:
${code}`;
    }
}
