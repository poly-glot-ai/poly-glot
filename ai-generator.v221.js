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
                            content: 'You are an expert code documentation engineer. You write complete, professional documentation comments for all 12 programming languages. You ALWAYS document every function, method, and class — you never skip any. You return ONLY the commented code — no markdown fences, no explanations.'
                        },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1,
                    max_tokens: 8192
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
            code: this._stripFences(data.choices[0].message.content),
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
                    max_tokens: 8192,
                    system: 'You are an expert code documentation engineer. You write complete, professional documentation comments for all 12 programming languages. You ALWAYS document every function, method, and class — you never skip any. You return ONLY the commented code — no markdown fences, no explanations.',
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1
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
            code: this._stripFences(data.content[0].text),
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
                    temperature: 0.1,
                    max_tokens: 8192
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
        return { code: this._stripFences(data.choices[0].message.content), provider: 'openai', model: this.model, cost: this.costEstimate };
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
                    max_tokens: 8192,
                    system: systemMsg,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1
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
        return { code: this._stripFences(data.content[0].text), provider: 'anthropic', model: this.model, cost: this.costEstimate };
    }

    /**
     * Build the why-comments prompt — language-aware, all 12 languages supported.
     */
    buildWhyPrompt(code, language) {
        const commentToken = {
            javascript: '//', typescript: '//', java: '//', cpp: '//',
            csharp: '//', go: '//', rust: '//', kotlin: '//', swift: '//',
            python: '#', ruby: '#', php: '//'
        }[language] || '//';

        return `You are a senior ${language} engineer performing a thorough code review. Your job is to add WHY-comments to the code below.

WHY-comments explain the REASONING behind decisions — not what the code does.

Good WHY-comment examples:
${commentToken} Using a map instead of nested loops — reduces complexity from O(n²) to O(n)
${commentToken} Check for null before calling — upstream code can return null on auth failure
${commentToken} Retry up to 3 times — transient network errors are common in this environment
${commentToken} Sort descending — UI always shows most recent first per product spec
${commentToken} Deep copy here — mutation of the original would corrupt the undo stack

Bad WHY-comment examples (DO NOT write these):
${commentToken} Loop through the array  ← restates what the code does
${commentToken} Increment i  ← obvious
${commentToken} Return the result  ← pointless

Rules:
1. Use ${commentToken} for ALL comments — correct ${language} single-line syntax
2. Place comment on the line immediately ABOVE the code it explains, or inline at end of short lines
3. Only comment non-obvious lines — skip trivial assignments, obvious returns, simple loops
4. Every comment must answer "why this approach?" not "what does this do?"
5. Keep each comment to ONE line — concise and precise
6. Preserve ALL existing code and ALL existing comments exactly as-is
7. Return ONLY the commented code — no markdown fences, no preamble, no explanations

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
     * Build prompt for comment generation — explicit, prescriptive style per language.
     * Every style includes a concrete example so the model never has to guess format.
     */
    buildPrompt(code, language, commentStyle) {
        const styleGuides = {
            jsdoc: {
                name: 'JSDoc',
                rules: `Use JSDoc format. Every function/method/class gets a doc-comment block.
Format:
/**
 * Brief description of what the function does.
 *
 * @param {Type} name - Description of the parameter.
 * @returns {Type} Description of the return value.
 * @throws {ErrorType} When this error is thrown.
 */`,
            },
            javadoc: {
                name: 'Javadoc',
                rules: `Use Javadoc format. Every public and package-private method/class gets a Javadoc block.
Format:
/**
 * Brief description of what the method does.
 *
 * @param name Description of the parameter.
 * @return Description of the return value.
 * @throws ExceptionType When this exception is thrown.
 */`,
            },
            pydoc: {
                name: 'Google-style Python docstrings',
                rules: `Use Google-style Python docstrings. EVERY function, method, and class MUST get a docstring — no exceptions.
Format for functions:
def my_func(x, y):
    """Brief one-line description.

    Longer description if needed. Explain non-obvious behaviour.

    Args:
        x (int): Description of x.
        y (str): Description of y.

    Returns:
        bool: Description of what is returned.

    Raises:
        ValueError: When x is negative.
    """

Format for classes:
class MyClass:
    """Brief one-line description of the class.

    Longer description of the class purpose and usage.

    Attributes:
        attr_name (type): Description of attribute.
    """

Rules:
- ALWAYS use triple double-quotes """
- The first line is a brief summary on the same line as the opening """
- Args, Returns, Raises sections are REQUIRED when applicable
- Every parameter must be listed under Args with its type in parentheses
- If a function returns something, Returns section is REQUIRED`,
            },
            doxygen: {
                name: 'Doxygen',
                rules: `Use Doxygen format. Every function, struct, and class gets a Doxygen block.
Format:
/**
 * @brief Brief description.
 *
 * Longer description if needed.
 *
 * @param name Description of the parameter.
 * @return Description of the return value.
 * @throws std::exception When this is thrown.
 */`,
            },
            xmldoc: {
                name: 'C# XML documentation',
                rules: `Use C# XML documentation comments (///). Every public member gets XML docs.
Format:
/// <summary>
/// Brief description of what this does.
/// </summary>
/// <param name="paramName">Description of the parameter.</param>
/// <returns>Description of the return value.</returns>
/// <exception cref="ExceptionType">When this is thrown.</exception>`,
            },
            godoc: {
                name: 'GoDoc',
                rules: `Use GoDoc format. Every exported function, type, method, and package gets a comment.
Rules:
- Comment starts with the name of the thing being documented
- Single // comment lines directly above the declaration (no blank line between)
- First sentence is a complete sentence used as the summary
Format:
// FunctionName does X and returns Y.
// It handles Z edge case by doing W.
func FunctionName(param Type) ReturnType {`,
            },
            rustdoc: {
                name: 'Rustdoc',
                rules: `Use Rustdoc format (/// triple-slash). Every public item gets documentation.
Format:
/// Brief one-line description.
///
/// Longer explanation of behaviour, edge cases, panics.
///
/// # Arguments
///
/// * \`param_name\` - Description of the parameter.
///
/// # Returns
///
/// Description of what is returned.
///
/// # Panics
///
/// Describe when this panics (if applicable).
///
/// # Examples
///
/// \`\`\`
/// let result = my_func(42);
/// assert_eq!(result, true);
/// \`\`\``,
            },
            rdoc: {
                name: 'YARD',
                rules: `Use YARD format. Every method, class, and module gets YARD documentation.
Format:
# Brief one-line description.
#
# Longer description if needed.
#
# @param name [Type] Description of the parameter.
# @return [Type] Description of what is returned.
# @raise [ErrorClass] When this error is raised.`,
            },
            phpdoc: {
                name: 'PHPDoc',
                rules: `Use PHPDoc format. Every function, method, and class gets a PHPDoc block.
Format:
/**
 * Brief description.
 *
 * Longer description if needed.
 *
 * @param Type $name Description of the parameter.
 * @return Type Description of the return value.
 * @throws ExceptionClass When this is thrown.
 */`,
            },
            swift: {
                name: 'Swift markup documentation',
                rules: `Use Swift documentation markup (///). Every function, class, struct, and enum gets docs.
Format:
/// Brief one-line description.
///
/// Longer description of behaviour and usage.
///
/// - Parameter name: Description of the parameter.
/// - Returns: Description of what is returned.
/// - Throws: Description of what errors can be thrown.`,
            },
            kotlin: {
                name: 'KDoc',
                rules: `Use KDoc format. Every public function, class, and property gets KDoc.
Format:
/**
 * Brief description.
 *
 * Longer description if needed.
 *
 * @param name Description of the parameter.
 * @return Description of the return value.
 * @throws ExceptionType When this is thrown.
 */`,
            },
        };

        const guide = styleGuides[commentStyle] || styleGuides.jsdoc;

        return `You are an expert ${language} documentation engineer. Add complete, professional documentation comments to EVERY function, class, and method in the code below.

Style: ${guide.name}

${guide.rules}

CRITICAL RULES — you MUST follow all of these:
1. Document EVERY function, method, and class — do NOT skip any
2. Follow the exact format shown above — do not invent a different format
3. Include ALL parameters, return values, and exceptions — leave nothing out
4. Keep ALL existing code exactly as-is — only add comments, change nothing else
5. Return ONLY the commented code — no markdown fences, no explanations, no preamble

Code to document:
${code}`;
    }

    /**
     * Strip markdown code fences that models sometimes add despite instructions.
     * Handles: \`\`\`python, \`\`\`javascript, \`\`\`\`\`\`, etc.
     */
    _stripFences(text) {
        return text
            .replace(/^```[\w]*\r?\n?/m, '')
            .replace(/\r?\n?```\s*$/m, '')
            .trim();
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
