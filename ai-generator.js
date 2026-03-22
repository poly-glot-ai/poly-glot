/**
 * AI Comment Generator - Option A: Client-Side with User API Keys
 * Supports OpenAI (GPT-4, GPT-3.5) and Anthropic (Claude)
 */

class AICommentGenerator {
    constructor() {
        this.apiKey = this.loadAPIKey();
        this.provider = this.loadProvider() || 'openai';
        this.model = this.loadModel() || 'gpt-4';
        this.costEstimate = 0;
    }

    /**
     * Load API key from localStorage
     */
    loadAPIKey() {
        return localStorage.getItem('polyglot_api_key') || '';
    }

    /**
     * Save API key to localStorage
     */
    saveAPIKey(key) {
        localStorage.setItem('polyglot_api_key', key);
        this.apiKey = key;
    }

    /**
     * Load provider preference from localStorage
     */
    loadProvider() {
        return localStorage.getItem('polyglot_ai_provider') || 'openai';
    }

    /**
     * Save provider preference
     */
    saveProvider(provider) {
        localStorage.setItem('polyglot_ai_provider', provider);
        this.provider = provider;
    }

    /**
     * Load model preference from localStorage
     */
    loadModel() {
        const defaultModels = {
            openai: 'gpt-4o-mini',
            anthropic: 'claude-3-5-sonnet-20241022'
        };
        return localStorage.getItem('polyglot_ai_model') || defaultModels[this.provider];
    }

    /**
     * Save model preference
     */
    saveModel(model) {
        localStorage.setItem('polyglot_ai_model', model);
        this.model = model;
    }

    /**
     * Check if API key is configured
     */
    isConfigured() {
        return this.apiKey && this.apiKey.length > 0;
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
                throw new Error('Invalid provider selected');
            }
        } catch (error) {
            console.error('AI Generation Error:', error);
            throw error;
        }
    }

    /**
     * Generate comments using OpenAI API
     */
    async generateWithOpenAI(code, language, commentStyle) {
        const prompt = this.buildPrompt(code, language, commentStyle);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API request failed');
        }

        const data = await response.json();
        
        // Calculate cost estimate (approximate)
        const inputTokens = data.usage?.prompt_tokens || 0;
        const outputTokens = data.usage?.completion_tokens || 0;
        this.costEstimate = this.calculateOpenAICost(inputTokens, outputTokens);

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
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
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

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Anthropic API request failed');
        }

        const data = await response.json();
        
        // Calculate cost estimate
        const inputTokens = data.usage?.input_tokens || 0;
        const outputTokens = data.usage?.output_tokens || 0;
        this.costEstimate = this.calculateAnthropicCost(inputTokens, outputTokens);

        return {
            code: data.content[0].text.trim(),
            provider: 'anthropic',
            model: this.model,
            usage: data.usage,
            cost: this.costEstimate
        };
    }

    /**
     * Build prompt for AI generation
     */
    buildPrompt(code, language, commentStyle) {
        const styleGuides = {
            jsdoc: 'JSDoc style with @param, @returns, @throws tags',
            javadoc: 'Javadoc style with @param, @return, @throws tags',
            pydoc: 'Python docstring style (Google or NumPy format)',
            doxygen: 'Doxygen style with @brief, @param, @return',
            xmldoc: 'XML documentation comments for C#',
            godoc: 'Go documentation style',
            rustdoc: 'Rust documentation style with ///',
            rdoc: 'Ruby RDoc style',
            phpdoc: 'PHPDoc style',
            swift: 'Swift documentation style',
            kotlin: 'KDoc style for Kotlin'
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

    /**
     * Calculate OpenAI API cost estimate
     */
    calculateOpenAICost(inputTokens, outputTokens) {
        // Pricing as of March 2024 (approximate, check current pricing)
        const pricing = {
            'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
            'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
            'gpt-4o': { input: 0.005 / 1000, output: 0.015 / 1000 },
            'gpt-4o-mini': { input: 0.00015 / 1000, output: 0.0006 / 1000 },
            'gpt-3.5-turbo': { input: 0.0005 / 1000, output: 0.0015 / 1000 }
        };

        const modelPricing = pricing[this.model] || pricing['gpt-4o-mini'];
        const cost = (inputTokens * modelPricing.input) + (outputTokens * modelPricing.output);
        return cost;
    }

    /**
     * Calculate Anthropic API cost estimate
     */
    calculateAnthropicCost(inputTokens, outputTokens) {
        // Pricing as of March 2024 (approximate, check current pricing)
        const pricing = {
            'claude-3-5-sonnet-20241022': { input: 0.003 / 1000, output: 0.015 / 1000 },
            'claude-3-opus-20240229': { input: 0.015 / 1000, output: 0.075 / 1000 },
            'claude-3-sonnet-20240229': { input: 0.003 / 1000, output: 0.015 / 1000 },
            'claude-3-haiku-20240307': { input: 0.00025 / 1000, output: 0.00125 / 1000 }
        };

        const modelPricing = pricing[this.model] || pricing['claude-3-5-sonnet-20241022'];
        const cost = (inputTokens * modelPricing.input) + (outputTokens * modelPricing.output);
        return cost;
    }

    /**
     * Get available models for current provider
     */
    getAvailableModels() {
        const models = {
            openai: [
                { value: 'gpt-4o', label: 'GPT-4o (Recommended)', cost: 'Low' },
                { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Cheapest)', cost: 'Very Low' },
                { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', cost: 'Medium' },
                { value: 'gpt-4', label: 'GPT-4', cost: 'High' },
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', cost: 'Very Low' }
            ],
            anthropic: [
                { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Recommended)', cost: 'Low' },
                { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Cheapest)', cost: 'Very Low' },
                { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', cost: 'Low' },
                { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', cost: 'High' }
            ]
        };

        return models[this.provider] || [];
    }
}

// Initialize global AI generator
window.aiGenerator = new AICommentGenerator();
