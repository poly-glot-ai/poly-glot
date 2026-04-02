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

export interface BugsResult {
    output: string;
    model: string;
    cost: number;
    tokensUsed: number;
}

export interface RefactorResult {
    output: string;
    model: string;
    cost: number;
    tokensUsed: number;
}

export interface TestResult {
    testCode: string;
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

    async findBugs(code: string, languageId: string): Promise<BugsResult> {
        const prompt = this._buildBugsPrompt(code, languageId);
        const raw = await this._call(prompt);
        return {
            output:     raw.replace(/^```[\w]*\n?/m, '').replace(/\n?```$/m, '').trim(),
            model:      this.cfg.model || '',
            cost:       0,
            tokensUsed: 0,
        };
    }

    async suggestRefactors(code: string, languageId: string): Promise<RefactorResult> {
        const prompt = this._buildRefactorPrompt(code, languageId);
        const raw = await this._call(prompt);
        return {
            output:     raw.replace(/^```[\w]*\n?/m, '').replace(/\n?```$/m, '').trim(),
            model:      this.cfg.model || '',
            cost:       0,
            tokensUsed: 0,
        };
    }

    async generateTests(code: string, languageId: string): Promise<TestResult> {
        const prompt = this._buildTestPrompt(code, languageId);
        const raw = await this._call(prompt);
        return {
            testCode:   raw.replace(/^```[\w]*\n?/m, '').replace(/\n?```$/m, '').trim(),
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
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${this.cfg.apiKey}`,
            },
            body: JSON.stringify({
                model:      this.cfg.model || 'gpt-4o-mini',
                messages:   [{ role: 'user', content: prompt }],
                temperature: 0,        // deterministic = faster first token
                max_tokens:  2048,     // cap output — enough for any file, ~40% faster
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
                model:      this.cfg.model || 'claude-sonnet-4-5',
                max_tokens: 2048,      // was 4096 — halved for speed
                messages:   [{ role: 'user', content: prompt }],
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
        return `Add inline WHY comments to this ${lang} code. Rules:
- WHY only — not what. Trade-offs, non-obvious choices, edge-case reasoning.
- Correct single-line syntax for ${lang}.
- Skip self-explanatory lines.
- One line per comment, above or inline.
- Return ONLY the commented code, no markdown fences.

${code}`;
    }

    private _buildCommentPrompt(code: string, lang: string, style: string): string {
        return `Add ${style} doc-comments to this ${lang} code. Rules:
- ${style} format only.
- All functions, classes, methods, complex logic.
- @param, @returns, @throws where applicable.
- Keep existing code exactly as-is.
- Return ONLY the commented code, no markdown fences.

${code}`;
    }

    private _buildExplainPrompt(code: string, lang: string): string {
        return `Analyze this ${lang} code. Return ONLY this JSON, no markdown:
{"summary":"...","complexity":"Low|Medium|High","complexityScore":1-10,"language":"${lang}","functions":[{"name":"...","purpose":"...","params":["..."],"returns":"..."}],"potentialBugs":["..."],"suggestions":["..."],"docQuality":{"score":0-100,"label":"Excellent|Good|Fair|Poor","issues":["..."],"suggestions":["..."]}}

${code}`;
    }

    private _buildBugsPrompt(code: string, lang: string): string {
        return `You are a senior ${lang} engineer performing a thorough bug audit.
Analyze this code for bugs, edge cases, null/undefined dereferences, error handling gaps,
off-by-one errors, race conditions, resource leaks, and security vulnerabilities.

For EACH issue found, output:

🐛 [SEVERITY: critical|high|medium|low] <one-line title>
   Line: <approximate line number or range>
   Issue: <what's wrong — be specific>
   Fix: <concrete fix — show the corrected code snippet>

If no issues are found, say "✅ No bugs found — code looks solid."

Rules:
- Be thorough but avoid false positives — only report real issues.
- Sort by severity (critical first).
- Show concrete fix code, not vague advice.
- Use correct ${lang} syntax in all fix snippets.

Code:
${code}`;
    }

    private _buildRefactorPrompt(code: string, lang: string): string {
        return `You are a senior ${lang} engineer suggesting concrete refactors.
Analyze this code and suggest actionable improvements for readability, performance,
maintainability, and idiomatic ${lang} patterns.

For EACH suggestion, output:

⚡ <one-line title>
   Why: <one sentence explaining the benefit>
   Before:
   \`\`\`${lang}
   <original code snippet>
   \`\`\`
   After:
   \`\`\`${lang}
   <refactored code snippet>
   \`\`\`

Rules:
- Be concrete — show before/after diffs, not vague advice.
- Focus on the highest-impact changes first.
- Use idiomatic ${lang} patterns and modern syntax.
- Preserve the original behavior unless a bug fix is part of the refactor.
- 3-7 suggestions max — skip trivial cosmetic changes.

Code:
${code}`;
    }

    private _buildTestPrompt(code: string, lang: string): string {
        const testFrameworks: Record<string, string> = {
            javascript: 'Jest (describe/it/expect)',
            typescript: 'Jest with TypeScript (describe/it/expect)',
            python:     'pytest (def test_*, assert)',
            java:       'JUnit 5 (@Test, assertEquals, assertThrows)',
            csharp:     'xUnit ([Fact], Assert.Equal, Assert.Throws)',
            cpp:        'Google Test (TEST, EXPECT_EQ, EXPECT_THROW)',
            go:         'testing package (func Test*, t.Run, t.Errorf)',
            rust:       '#[cfg(test)] mod tests / #[test] (assert_eq!, assert!)',
            ruby:       'RSpec (describe/it/expect)',
            php:        'PHPUnit (/** @test */, $this->assertEquals)',
            swift:      'XCTest (func test*, XCTAssertEqual)',
            kotlin:     'JUnit 5 / kotlin.test (@Test, assertEquals)',
        };
        const framework = testFrameworks[lang] || 'the standard test framework';

        return `You are a senior ${lang} engineer writing unit tests.
Generate comprehensive unit tests for this code using ${framework}.

Rules:
- Test every public function/method/class.
- Include: happy path, edge cases, error cases, boundary values.
- Use descriptive test names that explain the scenario.
- Mock external dependencies where appropriate.
- Include setup/teardown if needed.
- Use correct ${lang} syntax and idiomatic test patterns.
- Return ONLY the test code — no explanations, no markdown fences.
- Include necessary imports/requires at the top.

Code to test:
${code}`;
    }
}
