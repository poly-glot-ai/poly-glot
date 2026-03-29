import * as vscode from 'vscode';

// ─── Pricing tables ───────────────────────────────────────────────────────────
const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
    'gpt-4o':           { input: 0.0025,  output: 0.010  },
    'gpt-4o-mini':      { input: 0.00015, output: 0.0006 },
    'gpt-4-turbo':      { input: 0.01,    output: 0.03   },
    'gpt-4':            { input: 0.03,    output: 0.06   },
    'gpt-3.5-turbo':    { input: 0.0005,  output: 0.0015 },
    // fallback
    '_default':         { input: 0.002,   output: 0.008  },
};

const ANTHROPIC_PRICING: Record<string, { input: number; output: number }> = {
    'claude-3-5-sonnet-20241022': { input: 0.003,  output: 0.015 },
    'claude-3-5-haiku-20241022':  { input: 0.0008, output: 0.004 },
    'claude-3-opus-20240229':     { input: 0.015,  output: 0.075 },
    'claude-3-sonnet-20240229':   { input: 0.003,  output: 0.015 },
    'claude-3-haiku-20240307':    { input: 0.00025,output: 0.00125 },
    // fallback
    '_default':                   { input: 0.003,  output: 0.015 },
};

// ─── Language → comment-style map ────────────────────────────────────────────
const LANGUAGE_STYLE: Record<string, string> = {
    javascript:   'JSDoc',
    typescript:   'TSDoc/JSDoc',
    python:       'Google-style docstrings',
    java:         'Javadoc',
    csharp:       'XML doc comments (/// <summary>)',
    cpp:          'Doxygen',
    c:            'Doxygen',
    go:           'GoDoc',
    rust:         'Rust doc comments (///)',
    ruby:         'YARD',
    php:          'PHPDoc',
    swift:        'Swift markup (///)',
    kotlin:       'KDoc',
    scala:        'ScalaDoc',
    r:            'roxygen2',
    shell:        'inline # comments',
    bash:         'inline # comments',
    powershell:   'comment-based help',
    sql:          'inline -- comments',
    html:         '<!-- HTML comments -->',
    css:          '/* CSS comments */',
};

export interface ModelInfo {
    value: string;
    label: string;
    cost: string;
}

export interface GenerateResult {
    commentedCode: string;
    model: string;
    cost: number;
    tokensUsed: number;
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

export interface FunctionInfo {
    name: string;
    purpose: string;
    params: string[];
    returns: string;
    sideEffects: string[];
}

export interface DocQuality {
    score: number;
    label: string;
    issues: string[];
    suggestions: string[];
}

export class AIGenerator {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    // ── Settings persistence ──────────────────────────────────────────────────

    async getApiKey(): Promise<string | undefined> {
        return this.context.secrets.get('polyglot.apiKey');
    }

    async saveApiKey(key: string): Promise<void> {
        await this.context.secrets.store('polyglot.apiKey', key);
    }

    async isConfigured(): Promise<boolean> {
        const key = await this.getApiKey();
        return !!(key && key.trim().length > 0);
    }

    getProvider(): string {
        return vscode.workspace.getConfiguration('polyglot').get('provider', 'openai');
    }

    getModel(): string {
        return vscode.workspace.getConfiguration('polyglot').get('model', 'gpt-4o-mini');
    }

    getCommentStyle(languageId: string): string {
        return LANGUAGE_STYLE[languageId] ?? 'inline comments appropriate for the language';
    }

    getAvailableModels(provider?: string): ModelInfo[] {
        const p = provider ?? this.getProvider();
        if (p === 'anthropic') {
            return [
                { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet',    cost: 'medium' },
                { value: 'claude-3-5-haiku-20241022',  label: 'Claude 3.5 Haiku',     cost: 'low'    },
                { value: 'claude-3-opus-20240229',      label: 'Claude 3 Opus',        cost: 'high'   },
                { value: 'claude-3-haiku-20240307',     label: 'Claude 3 Haiku',       cost: 'low'    },
            ];
        }
        return [
            { value: 'gpt-4o-mini',   label: 'GPT-4o Mini (Recommended)', cost: 'very low' },
            { value: 'gpt-4o',        label: 'GPT-4o',                     cost: 'medium'   },
            { value: 'gpt-4-turbo',   label: 'GPT-4 Turbo',               cost: 'high'     },
            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo',            cost: 'low'      },
        ];
    }

    // ── Core: Generate Comments ───────────────────────────────────────────────

    async generateComments(code: string, languageId: string): Promise<GenerateResult> {
        const apiKey  = await this.getApiKey();
        if (!apiKey)  throw new Error('API key not configured. Run "Poly-Glot: Configure API Key".');

        const provider = this.getProvider();
        const model    = this.getModel();
        const style    = this.getCommentStyle(languageId);
        const prompt   = this.buildGeneratePrompt(code, languageId, style);

        if (provider === 'anthropic') {
            return this.callAnthropic(apiKey, model, prompt, code);
        }
        return this.callOpenAI(apiKey, model, prompt, code);
    }

    // ── Core: Why-Comments ────────────────────────────────────────────────────

    async generateWhyComments(code: string, languageId: string): Promise<GenerateResult> {
        const apiKey = await this.getApiKey();
        if (!apiKey) throw new Error('API key not configured. Run "Poly-Glot: Configure API Key".');

        const provider = this.getProvider();
        const model    = this.getModel();
        const prompt   = this.buildWhyPrompt(code, languageId);

        if (provider === 'anthropic') {
            return this.callAnthropic(apiKey, model, prompt, code);
        }
        return this.callOpenAI(apiKey, model, prompt, code);
    }

    // ── Core: Explain Code ────────────────────────────────────────────────────

    async explainCode(code: string, languageId: string): Promise<ExplainResult> {
        const apiKey = await this.getApiKey();
        if (!apiKey) throw new Error('API key not configured. Run "Poly-Glot: Configure API Key".');

        const provider = this.getProvider();
        const model    = this.getModel();
        const prompt   = this.buildExplainPrompt(code, languageId);

        let raw: string;
        let cost = 0;

        if (provider === 'anthropic') {
            const res = await this.callAnthropicRaw(apiKey, model, prompt);
            raw  = res.content;
            cost = res.cost;
        } else {
            const res = await this.callOpenAIRaw(apiKey, model, prompt);
            raw  = res.content;
            cost = res.cost;
        }

        try {
            // Strip markdown code fences if present
            const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
            const parsed = JSON.parse(json) as ExplainResult;
            parsed.model = model;
            parsed.cost  = cost;
            return parsed;
        } catch {
            throw new Error(`Failed to parse AI response as JSON. Raw response:\n\n${raw}`);
        }
    }

    // ── Prompt builders ───────────────────────────────────────────────────────

    private buildGeneratePrompt(code: string, languageId: string, style: string): string {
        return `You are an expert ${languageId} developer. Add comprehensive, professional documentation comments to the following code using ${style} format.

Rules:
- Use ONLY ${style} comment syntax — never mix styles
- Add a top-level file/module comment if appropriate
- Document every function/method/class with purpose, params (@param), and return value (@returns)
- Add brief inline comments on non-obvious logic
- RETURN ONLY the fully-commented code — no explanations, no markdown fences, no preamble
- Preserve all original formatting and indentation exactly

Code to document:
${code}`;
    }

    private buildWhyPrompt(code: string, languageId: string): string {
        return `Add inline WHY comments to this ${languageId} code.

Rules:
- Explain WHY — not what. Focus on trade-offs, non-obvious design choices, edge-case reasoning, and intent.
- Use correct single-line comment syntax for ${languageId}.
- Skip self-explanatory lines (variable assignments, simple returns, obvious loops).
- Place comments above the relevant line, or inline at end of line for short notes.
- Return ONLY the commented code — no markdown fences, no explanations, no preamble.

${code}`;
    }

    private buildExplainPrompt(code: string, languageId: string): string {
        return `You are a senior ${languageId} engineer performing a thorough code review.
Analyze the following code and return a JSON object ONLY — no markdown, no prose outside JSON.

JSON schema (fill all fields):
{
  "summary": "string — 2-3 sentence plain English explanation",
  "complexity": "string — one of: Simple, Moderate, Complex, Very Complex",
  "complexityScore": number 1-10,
  "language": "string",
  "functions": [
    {
      "name": "string",
      "purpose": "string",
      "params": ["string"],
      "returns": "string",
      "sideEffects": ["string"]
    }
  ],
  "potentialBugs": ["string — describe issue and line/context if possible"],
  "suggestions": ["string — concrete improvement suggestion"],
  "docQuality": {
    "score": number 0-100,
    "label": "string — None/Poor/Fair/Good/Excellent",
    "issues": ["string"],
    "suggestions": ["string"]
  }
}

Code to analyze:
\`\`\`${languageId}
${code}
\`\`\``;
    }

    // ── API callers ───────────────────────────────────────────────────────────

    private async callOpenAI(
        apiKey: string, model: string, prompt: string, _originalCode: string
    ): Promise<GenerateResult> {
        const res = await this.callOpenAIRaw(apiKey, model, prompt);
        return {
            commentedCode: res.content,
            model,
            cost: res.cost,
            tokensUsed: res.tokensUsed,
        };
    }

    private async callOpenAIRaw(apiKey: string, model: string, prompt: string) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 4096,
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(`OpenAI API error ${response.status}: ${(err as any).error?.message ?? response.statusText}`);
        }

        const data = await response.json() as any;
        const content    = data.choices?.[0]?.message?.content ?? '';
        const inputTok   = data.usage?.prompt_tokens     ?? 0;
        const outputTok  = data.usage?.completion_tokens ?? 0;
        const tokensUsed = inputTok + outputTok;
        const pricing    = OPENAI_PRICING[model] ?? OPENAI_PRICING['_default'];
        const cost       = (inputTok / 1_000_000) * pricing.input + (outputTok / 1_000_000) * pricing.output;

        return { content, tokensUsed, cost };
    }

    private async callAnthropic(
        apiKey: string, model: string, prompt: string, _originalCode: string
    ): Promise<GenerateResult> {
        const res = await this.callAnthropicRaw(apiKey, model, prompt);
        return {
            commentedCode: res.content,
            model,
            cost: res.cost,
            tokensUsed: res.tokensUsed,
        };
    }

    private async callAnthropicRaw(apiKey: string, model: string, prompt: string) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(`Anthropic API error ${response.status}: ${(err as any).error?.message ?? response.statusText}`);
        }

        const data = await response.json() as any;
        const content    = data.content?.[0]?.text ?? '';
        const inputTok   = data.usage?.input_tokens  ?? 0;
        const outputTok  = data.usage?.output_tokens ?? 0;
        const tokensUsed = inputTok + outputTok;
        const pricing    = ANTHROPIC_PRICING[model] ?? ANTHROPIC_PRICING['_default'];
        const cost       = (inputTok / 1_000_000) * pricing.input + (outputTok / 1_000_000) * pricing.output;

        return { content, tokensUsed, cost };
    }
}
