/**
 * Poly-Glot AI Generator
 * Core generation logic — shared between CLI, VS Code extension, and MCP server.
 * Calls OpenAI or Anthropic APIs server-side; no browser dependencies.
 */

// ─── Language → Comment Style Map ────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'csharp',
  'go',
  'rust',
  'ruby',
  'php',
  'swift',
  'kotlin',
] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STYLE: Record<Language, string> = {
  javascript: 'JSDoc',
  typescript: 'TSDoc / JSDoc',
  python:     'Google-style docstrings',
  java:       'Javadoc',
  cpp:        'Doxygen',
  csharp:     'XML doc-comments (///)',
  go:         'GoDoc',
  rust:       'Rustdoc (///)',
  ruby:       'YARD',
  php:        'PHPDoc',
  swift:      'Swift markup (///)',
  kotlin:     'KDoc',
};

export const LANGUAGE_STYLE_DETAIL: Record<Language, string> = {
  javascript: 'JSDoc style with @param, @returns, @throws tags',
  typescript: 'TSDoc / JSDoc with full type annotations, @param, @returns, @throws',
  python:     'Google-style docstrings with Args:, Returns:, Raises: sections',
  java:       'Javadoc style with @param, @return, @throws tags',
  cpp:        'Doxygen style with @brief, @param, @return, @throws',
  csharp:     'XML documentation comments with <summary>, <param>, <returns>',
  go:         'GoDoc plain-English comments on exported identifiers',
  rust:       'Rustdoc /// with # Examples, # Panics, # Errors sections',
  ruby:       'YARD style with @param, @return, @raise tags',
  php:        'PHPDoc with @param, @return, @throws tags',
  swift:      'Swift markup /// with - Parameter, - Returns, - Throws',
  kotlin:     'KDoc with @param, @return, @throws tags',
};

// ─── OpenAI model list ────────────────────────────────────────────────────────

export const OPENAI_MODELS = [
  { id: 'gpt-4.1',       label: 'GPT-4.1 ✨ (Recommended)',        costTier: 'low'      },
  { id: 'gpt-4.1-mini',  label: 'GPT-4.1 Mini (Fast)',             costTier: 'very-low' },
  { id: 'gpt-4.1-nano',  label: 'GPT-4.1 Nano (Cheapest)',         costTier: 'minimal'  },
  { id: 'gpt-4o',        label: 'GPT-4o',                          costTier: 'low'      },
  { id: 'gpt-4o-mini',   label: 'GPT-4o Mini',                     costTier: 'very-low' },
  { id: 'o3',            label: 'o3 (Reasoning)',                   costTier: 'high'     },
  { id: 'o3-mini',       label: 'o3-mini (Reasoning, Fast)',        costTier: 'low'      },
  { id: 'o1',            label: 'o1 (Reasoning)',                   costTier: 'very-high'},
  { id: 'o1-mini',       label: 'o1-mini (Reasoning, Fast)',        costTier: 'low'      },
  { id: 'gpt-4-turbo',   label: 'GPT-4 Turbo',                     costTier: 'high'     },
  { id: 'gpt-4',         label: 'GPT-4',                           costTier: 'very-high'},
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Legacy)',          costTier: 'very-low' },
] as const;

// ─── Anthropic model list ─────────────────────────────────────────────────────

export const ANTHROPIC_MODELS = [
  { id: 'claude-sonnet-4-5',          label: 'Claude Sonnet 4 ✨ (Recommended)', costTier: 'low'      },
  { id: 'claude-opus-4-5',            label: 'Claude Opus 4 (Most Powerful)',    costTier: 'very-high'},
  { id: 'claude-haiku-4-5',           label: 'Claude Haiku 4 (Fast)',            costTier: 'very-low' },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet',               costTier: 'low'      },
  { id: 'claude-3-5-haiku-20241022',  label: 'Claude 3.5 Haiku',                costTier: 'very-low' },
  { id: 'claude-3-opus-20240229',     label: 'Claude 3 Opus',                   costTier: 'high'     },
  { id: 'claude-3-haiku-20240307',    label: 'Claude 3 Haiku (Legacy)',          costTier: 'minimal'  },
] as const;

// ─── Pricing tables (cost per 1 token) ───────────────────────────────────────

const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
  'o3':              { input: 0.010  / 1000, output: 0.040  / 1000 },
  'o3-mini':         { input: 0.0011 / 1000, output: 0.0044 / 1000 },
  'o1':              { input: 0.015  / 1000, output: 0.060  / 1000 },
  'o1-mini':         { input: 0.0011 / 1000, output: 0.0044 / 1000 },
  'gpt-4.1':         { input: 0.002  / 1000, output: 0.008  / 1000 },
  'gpt-4.1-mini':    { input: 0.0004 / 1000, output: 0.0016 / 1000 },
  'gpt-4.1-nano':    { input: 0.0001 / 1000, output: 0.0004 / 1000 },
  'gpt-4o':          { input: 0.0025 / 1000, output: 0.010  / 1000 },
  'gpt-4o-mini':     { input: 0.00015/ 1000, output: 0.0006 / 1000 },
  'gpt-4-turbo':     { input: 0.010  / 1000, output: 0.030  / 1000 },
  'gpt-4':           { input: 0.030  / 1000, output: 0.060  / 1000 },
  'gpt-3.5-turbo':   { input: 0.0005 / 1000, output: 0.0015 / 1000 },
};

const ANTHROPIC_PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-5':            { input: 0.015   / 1000, output: 0.075   / 1000 },
  'claude-sonnet-4-5':          { input: 0.003   / 1000, output: 0.015   / 1000 },
  'claude-haiku-4-5':           { input: 0.0008  / 1000, output: 0.004   / 1000 },
  'claude-3-5-sonnet-20241022': { input: 0.003   / 1000, output: 0.015   / 1000 },
  'claude-3-5-haiku-20241022':  { input: 0.0008  / 1000, output: 0.004   / 1000 },
  'claude-3-opus-20240229':     { input: 0.015   / 1000, output: 0.075   / 1000 },
  'claude-3-haiku-20240307':    { input: 0.00025 / 1000, output: 0.00125 / 1000 },
};

// ─── Config ───────────────────────────────────────────────────────────────────

export interface GeneratorConfig {
  provider: 'openai' | 'anthropic';
  apiKey:   string;
  model?:   string;
}

// ─── Result types ─────────────────────────────────────────────────────────────

export interface GenerateResult {
  code:       string;
  provider:   string;
  model:      string;
  inputTokens:  number;
  outputTokens: number;
  costUSD:    number;
}

export interface ExplainResult {
  summary:        string;
  complexity:     string;
  complexityScore: number;
  language:       string;
  functions:      Array<{ name: string; purpose: string; params: string[]; returns: string }>;
  potentialBugs:  string[];
  suggestions:    string[];
  docQuality:     { score: number; label: string; issues: string[]; suggestions: string[] };
  provider:       string;
  model:          string;
  costUSD:        number;
  inputTokens:    number;
  outputTokens:   number;
}

// ─── Generator class ──────────────────────────────────────────────────────────

export class PolyGlotGenerator {
  private cfg: GeneratorConfig;

  constructor(cfg: GeneratorConfig) {
    this.cfg = cfg;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Add doc-comments (JSDoc, Javadoc, PyDoc, etc.) to code. */
  async generateComments(code: string, language: Language): Promise<GenerateResult> {
    const style  = LANGUAGE_STYLE_DETAIL[language];
    const prompt = this._buildCommentPrompt(code, language, style);
    return this._call(prompt);
  }

  /** Add inline WHY-comments explaining reasoning and intent. */
  async generateWhyComments(code: string, language: Language): Promise<GenerateResult> {
    const prompt = this._buildWhyPrompt(code, language);
    return this._call(prompt);
  }

  /**
   * Two-pass generation: doc-comments first, then WHY-comments.
   * Returns the fully-commented code with both layers merged.
   */
  async generateBoth(code: string, language: Language): Promise<GenerateResult> {
    const docResult = await this.generateComments(code, language);
    const whyResult = await this.generateWhyComments(docResult.code, language);
    return {
      ...whyResult,
      inputTokens:  docResult.inputTokens  + whyResult.inputTokens,
      outputTokens: docResult.outputTokens + whyResult.outputTokens,
      costUSD:      docResult.costUSD      + whyResult.costUSD,
    };
  }

  /** Deep code analysis — complexity, bugs, suggestions, doc quality score. */
  async explainCode(code: string, language: Language): Promise<ExplainResult> {
    const prompt = this._buildExplainPrompt(code, language);
    const raw    = await this._callRaw(prompt);
    const model  = this.cfg.model ?? this._defaultModel();

    // Strip markdown fences if model wrapped JSON
    const clean = raw.text.trim().replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();

    let parsed: ExplainResult;
    try {
      parsed = JSON.parse(clean) as ExplainResult;
    } catch {
      throw new Error(
        `AI returned malformed JSON for code analysis. Raw response:\n${raw.text.slice(0, 300)}`
      );
    }

    return {
      ...parsed,
      provider:     this.cfg.provider,
      model,
      costUSD:      this._calcCost(raw.inputTokens, raw.outputTokens),
      inputTokens:  raw.inputTokens,
      outputTokens: raw.outputTokens,
    };
  }

  // ── Private: call helpers ───────────────────────────────────────────────────

  private async _call(prompt: string): Promise<GenerateResult> {
    const model = this.cfg.model ?? this._defaultModel();
    const raw   = await this._callRaw(prompt);

    // Strip markdown fences if model wrapped the code
    const code = raw.text
      .trim()
      .replace(/^```[\w]*\n?/m, '')
      .replace(/\n?```$/m, '')
      .trim();

    return {
      code,
      provider:     this.cfg.provider,
      model,
      inputTokens:  raw.inputTokens,
      outputTokens: raw.outputTokens,
      costUSD:      this._calcCost(raw.inputTokens, raw.outputTokens),
    };
  }

  private async _callRaw(prompt: string): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    return this.cfg.provider === 'anthropic'
      ? this._callAnthropic(prompt)
      : this._callOpenAI(prompt);
  }

  private async _callOpenAI(prompt: string): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const model = this.cfg.model ?? 'gpt-4.1-mini';

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${this.cfg.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens:  4096,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } })) as { error?: { message?: string } };
      throw new Error(`OpenAI ${res.status}: ${err?.error?.message ?? res.statusText}`);
    }

    const data = await res.json() as {
      choices: Array<{ message: { content: string } }>;
      usage?:  { prompt_tokens: number; completion_tokens: number };
    };

    return {
      text:         data.choices[0]?.message?.content ?? '',
      inputTokens:  data.usage?.prompt_tokens     ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    };
  }

  private async _callAnthropic(prompt: string): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const model = this.cfg.model ?? 'claude-sonnet-4-5';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         this.cfg.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } })) as { error?: { message?: string } };
      throw new Error(`Anthropic ${res.status}: ${err?.error?.message ?? res.statusText}`);
    }

    const data = await res.json() as {
      content: Array<{ type: string; text: string }>;
      usage?:  { input_tokens: number; output_tokens: number };
    };

    return {
      text:         data.content.find(b => b.type === 'text')?.text ?? '',
      inputTokens:  data.usage?.input_tokens  ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    };
  }

  // ── Private: cost ───────────────────────────────────────────────────────────

  private _calcCost(inputTokens: number, outputTokens: number): number {
    const model   = this.cfg.model ?? this._defaultModel();
    const pricing = this.cfg.provider === 'anthropic' ? ANTHROPIC_PRICING : OPENAI_PRICING;
    const p       = pricing[model] ?? (this.cfg.provider === 'anthropic'
      ? { input: 0.003 / 1000, output: 0.015 / 1000 }   // Sonnet fallback
      : { input: 0.002 / 1000, output: 0.008 / 1000 });  // GPT-4.1 fallback
    return (inputTokens * p.input) + (outputTokens * p.output);
  }

  private _defaultModel(): string {
    return this.cfg.provider === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4.1-mini';
  }

  // ── Private: prompts ────────────────────────────────────────────────────────

  private _buildCommentPrompt(code: string, lang: Language, style: string): string {
    return `Add ${style} documentation comments to this ${lang} code.

Rules:
- Use ${style} format only — correct syntax for ${lang}
- Document all functions, classes, methods, and complex logic
- Include @param / @returns / @throws (or language equivalent) where applicable
- Preserve all existing code exactly — do not change logic
- Return ONLY the commented code, no markdown fences, no explanations

Code:
${code}`;
  }

  private _buildWhyPrompt(code: string, lang: string): string {
    return `Add inline WHY-comments to this ${lang} code.

Rules:
- Explain WHY decisions were made — not WHAT the code does
- Cover: non-obvious trade-offs, edge-case reasoning, algorithm choices, business constraints
- Use correct single-line comment syntax for ${lang}
- Skip self-explanatory lines
- Do NOT restate what the code already says
- Preserve all existing code and existing comments exactly
- Return ONLY the commented code, no markdown fences, no explanations

Code:
${code}`;
  }

  private _buildExplainPrompt(code: string, lang: string): string {
    return `Analyze this ${lang} code deeply. Return ONLY valid JSON matching this exact shape, no markdown:
{
  "summary": "one-paragraph plain-English description",
  "complexity": "Low|Medium|High",
  "complexityScore": 1-10,
  "language": "${lang}",
  "functions": [{"name":"...","purpose":"...","params":["..."],"returns":"..."}],
  "potentialBugs": ["..."],
  "suggestions": ["..."],
  "docQuality": {
    "score": 0-100,
    "label": "Excellent|Good|Fair|Poor|None",
    "issues": ["..."],
    "suggestions": ["..."]
  }
}

Code:
${code}`;
  }
}
