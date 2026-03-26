/**
 * AI Comment Generator
 * Handles API calls to OpenAI and Anthropic for code comment generation.
 * Runs entirely in the browser — your API key and code never leave your machine.
 */
class AICommentGenerator {
    constructor() {
        this.apiKey   = this.loadAPIKey();
        this.provider = this.loadProvider() || 'openai';
        this.model    = this.loadModel();
        this.costEstimate = 0;
    }

    /** Load API key from localStorage */
    loadAPIKey() {
        return localStorage.getItem('polyglot_api_key') || '';
    }

    /** Save API key to localStorage */
    saveAPIKey(key) {
        localStorage.setItem('polyglot_api_key', key);
        this.apiKey = key;
    }

    /** Load provider preference from localStorage */
    loadProvider() {
        return localStorage.getItem('polyglot_ai_provider') || 'openai';
    }

    /** Save provider preference */
    saveProvider(provider) {
        localStorage.setItem('polyglot_ai_provider', provider);
        this.provider = provider;
    }

    /** Load model preference from localStorage */
    loadModel() {
        const defaultModels = {
            openai: 'gpt-4.1-mini',
            anthropic: 'claude-sonnet-4-5'
        };
        return localStorage.getItem('polyglot_ai_model') || defaultModels[this.provider];
    }

    /** Save model preference */
    saveModel(model) {
        localStorage.setItem('polyglot_ai_model', model);
        this.model = model;
    }

    /** Check if API key is configured */
    isConfigured() {
        return this.apiKey && this.apiKey.trim().length > 10;
    }

    /**
     * Parse API error response and return a clear human-readable message.
     * Handles CORS pre-flight failures, auth errors, rate limits, etc.
     */
    _parseError(error, provider) {
        const msg = error?.message || '';

        // Network/CORS failure — fetch itself throws a TypeError
        if (error instanceof TypeError || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')) {
            if (provider === 'anthropic') {
                return 'Network error reaching Anthropic. Make sure your API key is correct and your network allows outbound HTTPS. If you are behind a VPN or firewall, try disabling it.';
            }
            return 'Network error reaching OpenAI. Make sure your API key is correct and your network allows outbound HTTPS. If you are behind a VPN or firewall, try disabling it.';
        }
        if (msg.includes('401') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('authentication')) {
            return `Invalid API key. Please check your ${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key and try again.`;
        }
        if (msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('quota')) {
            return 'Rate limit or quota exceeded. Please wait a moment and try again, or check your API plan limits.';
        }
        if (msg.includes('500') || msg.includes('502') || msg.includes('503')) {
            return `${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} servers are temporarily unavailable. Please try again in a moment.`;
        }
        return msg || `Unknown error from ${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}. Please try again.`;
    }

    /**
     * Generate comments for code using AI
     */
    async generateComments(code, language, commentStyle = 'jsdoc') {
        if (!this.isConfigured()) {
            throw new Error('API key not configured. Please add your API key in settings.');
        }
        try {
            if (this.provider === 'openai') {
                return await this.generateWithOpenAI(code, language, commentStyle);
            } else if (this.provider === 'anthropic') {
                return await this.generateWithAnthropic(code, language, commentStyle);
            } else {
                throw new Error('Invalid provider selected.');
            }
        } catch (error) {
            throw new Error(this._parseError(error, this.provider));
        }
    }

    /**
     * Generate comments using OpenAI API
     */
    async generateWithOpenAI(code, language, commentStyle) {
        const prompt = this.buildPrompt(code, language, commentStyle);

        let response;
        try {
            response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert code documentation assistant. Generate professional, standardized comments following the specified documentation style. Return ONLY the commented code, no explanations.'
                        },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                })
            });
        } catch (networkErr) {
            throw new Error(this._parseError(networkErr, 'openai'));
        }

        if (!response.ok) {
            let errBody = {};
            try { errBody = await response.json(); } catch (_) {}
            throw new Error(errBody.error?.message || `OpenAI error ${response.status}`);
        }

        const data = await response.json();
        const inputTokens  = data.usage?.prompt_tokens || 0;
        const outputTokens = data.usage?.completion_tokens || 0;
        this.costEstimate  = this.calculateOpenAICost(inputTokens, outputTokens);

        return {
            code: data.choices[0].message.content.trim(),
            provider: 'openai',
            model: this.model,
            usage: data.usage,
            cost: this.costEstimate
        };
    }

    /**
     * Generate comments using Anthropic API
     */
    async generateWithAnthropic(code, language, commentStyle) {
        const prompt = this.buildPrompt(code, language, commentStyle);

        let response;
        try {
            response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 2000,
                    messages: [
                        {
                            role: 'user',
                            content: `You are an expert code documentation assistant. Generate professional, standardized comments following the specified documentation style. Return ONLY the commented code, no explanations.\n\n${prompt}`
                        }
                    ],
                    temperature: 0.3
                })
            });
        } catch (networkErr) {
            throw new Error(this._parseError(networkErr, 'anthropic'));
        }

        if (!response.ok) {
            let errBody = {};
            try { errBody = await response.json(); } catch (_) {}
            throw new Error(errBody.error?.message || `Anthropic error ${response.status}`);
        }

        const data = await response.json();
        const inputTokens  = data.usage?.input_tokens || 0;
        const outputTokens = data.usage?.output_tokens || 0;
        this.costEstimate  = this.calculateAnthropicCost(inputTokens, outputTokens);

        return {
            code: data.content[0].text.trim(),
            provider: 'anthropic',
            model: this.model,
            usage: data.usage,
            cost: this.costEstimate
        };
    }

    /**
     * Analyze / explain code using AI
     */
    async analyzeCode(code, language) {
        if (!this.isConfigured()) {
            throw new Error('API key not configured. Please add your API key in settings.');
        }

        const prompt = this.buildExplainPrompt(code, language);

        try {
            if (this.provider === 'openai') {
                let response;
                try {
                    response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.apiKey}`
                        },
                        body: JSON.stringify({
                            model: this.model,
                            messages: [
                                {
                                    role: 'system',
                                    content: 'You are a senior software engineer and code reviewer. Provide deep, structured analysis of code. Be concise but thorough. Always respond with valid JSON.'
                                },
                                { role: 'user', content: prompt }
                            ],
                            temperature: 0.2,
                            max_tokens: 2000
                        })
                    });
                } catch (networkErr) {
                    throw new Error(this._parseError(networkErr, 'openai'));
                }

                if (!response.ok) {
                    let errBody = {};
                    try { errBody = await response.json(); } catch (_) {}
                    throw new Error(errBody.error?.message || `OpenAI error ${response.status}`);
                }

                const data = await response.json();
                const inputTokens  = data.usage?.prompt_tokens || 0;
                const outputTokens = data.usage?.completion_tokens || 0;
                this.costEstimate  = this.calculateOpenAICost(inputTokens, outputTokens);

                return {
                    analysis: JSON.parse(data.choices[0].message.content.trim()),
                    provider: 'openai',
                    model: this.model,
                    usage: data.usage,
                    cost: this.costEstimate
                };

            } else if (this.provider === 'anthropic') {
                let response;
                try {
                    response = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': this.apiKey,
                            'anthropic-version': '2023-06-01',
                            'anthropic-dangerous-direct-browser-access': 'true'
                        },
                        body: JSON.stringify({
                            model: this.model,
                            max_tokens: 2000,
                            messages: [
                                {
                                    role: 'user',
                                    content: `You are a senior software engineer and code reviewer. Provide deep, structured analysis of code. Be concise but thorough. Always respond with valid JSON.\n\n${prompt}`
                                }
                            ],
                            temperature: 0.2
                        })
                    });
                } catch (networkErr) {
                    throw new Error(this._parseError(networkErr, 'anthropic'));
                }

                if (!response.ok) {
                    let errBody = {};
                    try { errBody = await response.json(); } catch (_) {}
                    throw new Error(errBody.error?.message || `Anthropic error ${response.status}`);
                }

                const data = await response.json();
                const inputTokens  = data.usage?.input_tokens || 0;
                const outputTokens = data.usage?.output_tokens || 0;
                this.costEstimate  = this.calculateAnthropicCost(inputTokens, outputTokens);

                return {
                    analysis: JSON.parse(data.content[0].text.trim()),
                    provider: 'anthropic',
                    model: this.model,
                    usage: data.usage,
                    cost: this.costEstimate
                };

            } else {
                throw new Error('Invalid provider selected.');
            }
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error('AI returned an unexpected response format. Please try again.');
            }
            throw new Error(this._parseError(error, this.provider));
        }
    }

    /**
     * Generate "why" comments — inline reasoning, intent, and decision comments.
     * Works for all 12 supported languages; uses correct single-line comment syntax per language.
     */
    async generateWhyComments(code, language) {
        if (!this.isConfigured()) {
            throw new Error('API key not configured. Please add your API key in settings.');
        }
        const prompt = this.buildWhyPrompt(code, language);
        if (this.provider === 'openai') {
            return await this._callOpenAIRaw(prompt,
                'You are a senior software engineer doing a code review. Add inline why-comments that explain reasoning and intent. Return ONLY the commented code, no explanations.');
        } else if (this.provider === 'anthropic') {
            return await this._callAnthropicRaw(prompt,
                'You are a senior software engineer doing a code review. Add inline why-comments that explain reasoning and intent. Return ONLY the commented code, no explanations.');
        }
        throw new Error('Invalid provider selected.');
    }

    /**
     * Two-pass generation: doc-comments first, then why-comments on the result.
     * Returns merged output with both types of comments, plus combined cost.
     */
    async generateBoth(code, language) {
        if (!this.isConfigured()) {
            throw new Error('API key not configured. Please add your API key in settings.');
        }
        // Pass 1 — doc-comments
        const docResult = await this.generateComments(code, language, this._getCommentStyle(language));
        // Pass 2 — why-comments applied to the doc-commented code
        const whyResult = await this.generateWhyComments(docResult.code, language);
        return {
            code:     whyResult.code,
            provider: whyResult.provider,
            model:    whyResult.model,
            cost:     (docResult.cost || 0) + (whyResult.cost || 0),
        };
    }

    /** Map language to its doc-comment style */
    _getCommentStyle(language) {
        const styles = {
            javascript: 'jsdoc', typescript: 'jsdoc', java: 'javadoc',
            python: 'pydoc', cpp: 'doxygen', csharp: 'xmldoc',
            go: 'godoc', rust: 'rustdoc', ruby: 'rdoc',
            php: 'phpdoc', swift: 'swift', kotlin: 'kotlin'
        };
        return styles[language] || 'jsdoc';
    }

    /** Shared OpenAI call returning { code, provider, model, cost } */
    async _callOpenAIRaw(prompt, systemMsg) {
        let response;
        try {
            response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: systemMsg },
                        { role: 'user',   content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                })
            });
        } catch (e) { throw new Error(this._parseError(e, 'openai')); }
        if (!response.ok) {
            let b = {}; try { b = await response.json(); } catch (_) {}
            throw new Error(b.error?.message || `OpenAI error ${response.status}`);
        }
        const data = await response.json();
        const inputTokens  = data.usage?.prompt_tokens     || 0;
        const outputTokens = data.usage?.completion_tokens || 0;
        this.costEstimate  = this.calculateOpenAICost(inputTokens, outputTokens);
        return { code: data.choices[0].message.content.trim(), provider: 'openai', model: this.model, cost: this.costEstimate };
    }

    /** Shared Anthropic call returning { code, provider, model, cost } */
    async _callAnthropicRaw(prompt, systemMsg) {
        let response;
        try {
            response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 2000,
                    messages: [{ role: 'user', content: `${systemMsg}\n\n${prompt}` }],
                    temperature: 0.3
                })
            });
        } catch (e) { throw new Error(this._parseError(e, 'anthropic')); }
        if (!response.ok) {
            let b = {}; try { b = await response.json(); } catch (_) {}
            throw new Error(b.error?.message || `Anthropic error ${response.status}`);
        }
        const data = await response.json();
        const inputTokens  = data.usage?.input_tokens  || 0;
        const outputTokens = data.usage?.output_tokens || 0;
        this.costEstimate  = this.calculateAnthropicCost(inputTokens, outputTokens);
        return { code: data.content[0].text.trim(), provider: 'anthropic', model: this.model, cost: this.costEstimate };
    }

    /**
     * Build the why-comments prompt — language-aware, all 12 languages supported.
     */
    buildWhyPrompt(code, language) {
        // Map language → correct single-line comment token
        const commentToken = {
            javascript: '//', typescript: '//', java: '//', cpp: '//',
            csharp: '//', go: '//', rust: '//', kotlin: '//', swift: '//',
            python: '#', ruby: '#', php: '//'
        }[language] || '//';

        return `You are a senior ${language} engineer doing a code review. Add inline "why" comments to the following code.

Rules:
- Focus exclusively on WHY decisions were made — not WHAT the code does
- Explain: algorithmic trade-offs, non-obvious choices, performance decisions, edge-case handling, and anything a new engineer would ask "why not just…?" about
- Use ${commentToken} for all comments (correct ${language} single-line syntax)
- Place comments on the line immediately above the code they describe, or inline at the end of short lines
- Do NOT restate what the code literally does — only explain the reasoning
- Do NOT add comments to self-explanatory lines (trivial assignments, obvious returns, etc.)
- Keep each comment to one line — concise and precise
- Keep existing code exactly as-is — only add comments
- Return ONLY the commented code, no explanations or markdown fences

Code:
${code}`;
    }

    /** Alias so app.js explainBtn works (calls explainCode → analyzeCode) */
    async explainCode(code, language) {
        return this.analyzeCode(code, language);
    }

    /**
     * Build the explain/analyze prompt
     */
    buildExplainPrompt(code, language) {
        return `Analyze this ${language} code and return a JSON object with exactly this structure:
{
  "summary": "One sentence summary of what this code does",
  "complexity": "Simple|Moderate|Complex",
  "purpose": "2-3 sentences explaining the purpose and use case",
  "keyComponents": ["component1", "component2", "component3"],
  "potentialIssues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "timeComplexity": "O(n) or similar if applicable, otherwise null",
  "dependencies": ["dependency1", "dependency2"]
}

Code to analyze:
\`\`\`${language}
${code}
\`\`\``;
    }

    /**
     * Build prompt for comment generation
     */
    buildPrompt(code, language, commentStyle) {
        const styleGuides = {
            jsdoc:    'JSDoc style with @param, @returns, @throws tags',
            javadoc:  'Javadoc style with @param, @return, @throws tags',
            pydoc:    'Python docstring style (Google or NumPy format)',
            doxygen:  'Doxygen style with @brief, @param, @return',
            xmldoc:   'XML documentation comments for C#',
            godoc:    'Go documentation style',
            rustdoc:  'Rust documentation style with ///',
            rdoc:     'Ruby RDoc style',
            phpdoc:   'PHPDoc style',
            swift:    'Swift documentation style',
            kotlin:   'KDoc style for Kotlin'
        };

        const style = styleGuides[commentStyle] || styleGuides.jsdoc;

        return `Add professional, standardized documentation comments to this ${language} code.

Requirements:
- Use ${style}
- Document all functions, classes, and methods
- Include parameter descriptions, return types, and exceptions
- Add brief descriptions for complex logic
- Follow ${language} best practices
- Keep comments concise but complete
- Return ONLY the commented code

Code to document:
\`\`\`${language}
${code}
\`\`\``;
    }

    /** Calculate OpenAI API cost estimate */
    calculateOpenAICost(inputTokens, outputTokens) {
        const pricing = {
            'o3':              { input: 0.010 / 1000,   output: 0.040 / 1000 },
            'o3-mini':         { input: 0.0011 / 1000,  output: 0.0044 / 1000 },
            'o1':              { input: 0.015 / 1000,   output: 0.060 / 1000 },
            'o1-mini':         { input: 0.0011 / 1000,  output: 0.0044 / 1000 },
            'gpt-4.1':         { input: 0.002 / 1000,   output: 0.008 / 1000 },
            'gpt-4.1-mini':    { input: 0.0004 / 1000,  output: 0.0016 / 1000 },
            'gpt-4.1-nano':    { input: 0.0001 / 1000,  output: 0.0004 / 1000 },
            'gpt-4o':          { input: 0.0025 / 1000,  output: 0.010 / 1000 },
            'gpt-4o-mini':     { input: 0.00015 / 1000, output: 0.0006 / 1000 },
            'gpt-4-turbo':     { input: 0.010 / 1000,   output: 0.030 / 1000 },
            'gpt-4':           { input: 0.030 / 1000,   output: 0.060 / 1000 },
            'gpt-3.5-turbo':   { input: 0.0005 / 1000,  output: 0.0015 / 1000 },
        };
        const p = pricing[this.model] || pricing['gpt-4o-mini'];
        return (inputTokens * p.input) + (outputTokens * p.output);
    }

    /** Calculate Anthropic API cost estimate */
    calculateAnthropicCost(inputTokens, outputTokens) {
        const pricing = {
            'claude-opus-4-5':            { input: 0.015 / 1000,   output: 0.075 / 1000 },
            'claude-sonnet-4-5':          { input: 0.003 / 1000,   output: 0.015 / 1000 },
            'claude-haiku-4-5':           { input: 0.0008 / 1000,  output: 0.004 / 1000 },
            'claude-3-5-sonnet-20241022': { input: 0.003 / 1000,   output: 0.015 / 1000 },
            'claude-3-5-haiku-20241022':  { input: 0.0008 / 1000,  output: 0.004 / 1000 },
            'claude-3-opus-20240229':     { input: 0.015 / 1000,   output: 0.075 / 1000 },
            'claude-3-haiku-20240307':    { input: 0.00025 / 1000, output: 0.00125 / 1000 },
        };
        const p = pricing[this.model] || pricing['claude-sonnet-4-5'];
        return (inputTokens * p.input) + (outputTokens * p.output);
    }

    /** Get available models for current provider */
    getAvailableModels() {
        const models = {
            openai: [
                { value: 'gpt-4.1',        label: 'GPT-4.1 ✨ (Recommended)', cost: 'Low' },
                { value: 'gpt-4.1-mini',   label: 'GPT-4.1 Mini (Fast)', cost: 'Very Low' },
                { value: 'gpt-4.1-nano',   label: 'GPT-4.1 Nano (Cheapest)', cost: 'Minimal' },
                { value: 'gpt-4o',         label: 'GPT-4o', cost: 'Low' },
                { value: 'gpt-4o-mini',    label: 'GPT-4o Mini', cost: 'Very Low' },
                { value: 'o3',             label: 'o3 (Reasoning)', cost: 'High' },
                { value: 'o3-mini',        label: 'o3-mini (Reasoning, Fast)', cost: 'Low' },
                { value: 'o1',             label: 'o1 (Reasoning)', cost: 'Very High' },
                { value: 'o1-mini',        label: 'o1-mini (Reasoning, Fast)', cost: 'Low' },
                { value: 'gpt-4-turbo',    label: 'GPT-4 Turbo', cost: 'High' },
                { value: 'gpt-4',          label: 'GPT-4', cost: 'Very High' },
                { value: 'gpt-3.5-turbo',  label: 'GPT-3.5 Turbo (Legacy)', cost: 'Very Low' }
            ],
            anthropic: [
                { value: 'claude-sonnet-4-5',          label: 'Claude Sonnet 4 ✨ (Recommended)', cost: 'Low' },
                { value: 'claude-opus-4-5',            label: 'Claude Opus 4 (Most Powerful)', cost: 'Very High' },
                { value: 'claude-haiku-4-5',           label: 'Claude Haiku 4 (Fast)', cost: 'Very Low' },
                { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', cost: 'Low' },
                { value: 'claude-3-5-haiku-20241022',  label: 'Claude 3.5 Haiku', cost: 'Very Low' },
                { value: 'claude-3-opus-20240229',     label: 'Claude 3 Opus', cost: 'High' },
                { value: 'claude-3-haiku-20240307',    label: 'Claude 3 Haiku (Legacy)', cost: 'Minimal' }
            ]
        };
        return models[this.provider] || [];
    }
}

// Initialize global AI generator
window.aiGenerator = new AICommentGenerator();
