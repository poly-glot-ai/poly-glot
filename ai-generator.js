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
            openai: 'gpt-4o-mini',
            anthropic: 'claude-3-5-sonnet-20241022'
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
            'gpt-4':         { input: 0.03 / 1000,    output: 0.06 / 1000 },
            'gpt-4-turbo':   { input: 0.01 / 1000,    output: 0.03 / 1000 },
            'gpt-4o':        { input: 0.005 / 1000,   output: 0.015 / 1000 },
            'gpt-4o-mini':   { input: 0.00015 / 1000, output: 0.0006 / 1000 },
            'gpt-3.5-turbo': { input: 0.0005 / 1000,  output: 0.0015 / 1000 }
        };
        const p = pricing[this.model] || pricing['gpt-4o-mini'];
        return (inputTokens * p.input) + (outputTokens * p.output);
    }

    /** Calculate Anthropic API cost estimate */
    calculateAnthropicCost(inputTokens, outputTokens) {
        const pricing = {
            'claude-3-5-sonnet-20241022': { input: 0.003 / 1000,   output: 0.015 / 1000 },
            'claude-3-opus-20240229':     { input: 0.015 / 1000,   output: 0.075 / 1000 },
            'claude-3-sonnet-20240229':   { input: 0.003 / 1000,   output: 0.015 / 1000 },
            'claude-3-haiku-20240307':    { input: 0.00025 / 1000, output: 0.00125 / 1000 }
        };
        const p = pricing[this.model] || pricing['claude-3-5-sonnet-20241022'];
        return (inputTokens * p.input) + (outputTokens * p.output);
    }

    /** Get available models for current provider */
    getAvailableModels() {
        const models = {
            openai: [
                { value: 'gpt-4o',        label: 'GPT-4o (Recommended)', cost: 'Low' },
                { value: 'gpt-4o-mini',   label: 'GPT-4o Mini (Cheapest)', cost: 'Very Low' },
                { value: 'gpt-4-turbo',   label: 'GPT-4 Turbo', cost: 'Medium' },
                { value: 'gpt-4',         label: 'GPT-4', cost: 'High' },
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', cost: 'Very Low' }
            ],
            anthropic: [
                { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Recommended)', cost: 'Low' },
                { value: 'claude-3-haiku-20240307',    label: 'Claude 3 Haiku (Cheapest)', cost: 'Very Low' },
                { value: 'claude-3-sonnet-20240229',   label: 'Claude 3 Sonnet', cost: 'Low' },
                { value: 'claude-3-opus-20240229',     label: 'Claude 3 Opus', cost: 'High' }
            ]
        };
        return models[this.provider] || [];
    }
}

// Initialize global AI generator
window.aiGenerator = new AICommentGenerator();
