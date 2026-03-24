/**
 * Poly-Glot Scorer — RAG & GEO inline scoring engine
 * Language-aware scoring for 12 languages + Markdown.
 * Shared between poly-glot.ai and markdown.poly-glot.ai
 */

const PolyGlotScorer = (() => {

    // ── Language detection from content ──────────────────────────────────
    function detectLanguage(text) {
        if (!text) return 'javascript';
        // Python
        if (/^\s*(def |class |import |from .+ import|if __name__|""")/m.test(text)) return 'python';
        // Java
        if (/\bpublic\s+(class|interface|enum|static|void|final)\b/.test(text) && /;$/.test(text.split('\n')[0]||'')) return 'java';
        if (/\bpublic\s+(class|interface|enum)\b/.test(text)) return 'java';
        // C#
        if (/\bnamespace\b|\busing\s+System/.test(text)) return 'csharp';
        // C++
        if (/#include\s*<|std::|cout\s*<</.test(text)) return 'cpp';
        // Go
        if (/^package\s+\w+/m.test(text) || /func\s+\w+\s*\(/.test(text) && /^import\s+\(/m.test(text)) return 'go';
        // Rust
        if (/\bfn\s+\w+|use\s+std::|impl\s+\w+/.test(text)) return 'rust';
        // Ruby
        if (/^\s*(def |end$|class .+ < |require |attr_)/m.test(text)) return 'ruby';
        // PHP
        if (/<\?php|\$[a-zA-Z_]/.test(text)) return 'php';
        // Swift
        if (/\bfunc\s+\w+|var\s+\w+\s*:\s*\w+|import\s+Foundation/.test(text)) return 'swift';
        // Kotlin
        if (/\bfun\s+\w+|val\s+\w+\s*=|data\s+class\b/.test(text)) return 'kotlin';
        // TypeScript
        if (/:\s*(string|number|boolean|void|any|never)\b|interface\s+\w+|type\s+\w+\s*=/.test(text)) return 'typescript';
        // Default JavaScript
        return 'javascript';
    }

    // ── Language-specific comment patterns ───────────────────────────────
    const LANG_PATTERNS = {
        javascript: {
            blockDoc:    /\/\*\*[\s\S]*?\*\//gm,
            param:       /@param\s+\{[^}]+\}/g,
            returns:     /@returns?/g,
            example:     /@example/gi,
            throws:      /@throws/gi,
            inline:      /\/\/[^\n]{8,}/g,
            moduleDoc:   /\/\*\*[\s\S]{60,}?\*\//,
            author:      /@author|@version|@since/gi,
            see:         /@see\s+/g,
            fnDecl:      /function\s+[a-zA-Z_]\w*\s*\(|const\s+[a-zA-Z_]\w*\s*=\s*(async\s+)?\(?[^)]*\)?\s*=>/gm,
            style:       'JSDoc',
        },
        typescript: {
            blockDoc:    /\/\*\*[\s\S]*?\*\//gm,
            param:       /@param\s+\{[^}]+\}|@param\s+\w+/g,
            returns:     /@returns?/g,
            example:     /@example/gi,
            throws:      /@throws/gi,
            inline:      /\/\/[^\n]{8,}/g,
            moduleDoc:   /\/\*\*[\s\S]{60,}?\*\//,
            author:      /@author|@version|@since/gi,
            see:         /@see\s+/g,
            fnDecl:      /function\s+[a-zA-Z_]\w*\s*\(|const\s+[a-zA-Z_]\w*\s*=.*=>/gm,
            style:       'TSDoc',
        },
        python: {
            blockDoc:    /"""[\s\S]*?"""|'''[\s\S]*?'''/gm,
            param:       /Args:\s*\n(\s+\w+[^:]*:)/gm,
            returns:     /Returns?:\s*\n|-> \w+/g,
            example:     /Examples?:\s*\n|>>>/g,
            throws:      /Raises?:\s*\n/g,
            inline:      /#[^\n]{8,}/g,
            moduleDoc:   /^"""[\s\S]{40,}?"""/m,
            author:      /__author__|__version__|:author:/gi,
            see:         /See Also:\s*\n|.. seealso::/g,
            fnDecl:      /^def\s+[a-zA-Z_]\w*\s*\(/gm,
            style:       'PyDoc',
        },
        java: {
            blockDoc:    /\/\*\*[\s\S]*?\*\//gm,
            param:       /@param\s+\w+/g,
            returns:     /@return\b/g,
            example:     /@example|<pre>[\s\S]*?<\/pre>/gi,
            throws:      /@throws\s+\w+/g,
            inline:      /\/\/[^\n]{8,}/g,
            moduleDoc:   /\/\*\*[\s\S]{60,}?\*\//,
            author:      /@author|@version|@since/gi,
            see:         /@see\s+/g,
            fnDecl:      /\b(public|private|protected)\s+[\w<>[\]]+\s+\w+\s*\(/gm,
            style:       'Javadoc',
        },
        csharp: {
            blockDoc:    /\/\/\/\s*<summary>[\s\S]*?<\/summary>/gm,
            param:       /\/\/\/\s*<param\s+name=/g,
            returns:     /\/\/\/\s*<returns>/g,
            example:     /\/\/\/\s*<example>/g,
            throws:      /\/\/\/\s*<exception/g,
            inline:      /\/\/[^\n]{8,}/g,
            moduleDoc:   /\/\/\/\s*<summary>[\s\S]{30,}?<\/summary>/,
            author:      /\/\/\/\s*<author>|\/\/\/\s*@version/gi,
            see:         /\/\/\/\s*<see\s+/g,
            fnDecl:      /\b(public|private|protected|internal)\s+[\w<>[\]]+\s+\w+\s*\(/gm,
            style:       'XMLDoc',
        },
        cpp: {
            blockDoc:    /\/\*\*[\s\S]*?\*\/|\/\/\/[^\n]*/gm,
            param:       /@param\s+\w+|\\param\s+\w+/g,
            returns:     /@return\b|\\return\b/g,
            example:     /@example|\\example/gi,
            throws:      /@throws|\\throws/gi,
            inline:      /\/\/[^\n]{8,}/g,
            moduleDoc:   /\/\*\*[\s\S]{60,}?\*\//,
            author:      /@author|\\author|@version/gi,
            see:         /@see\s+|\\see\s+/g,
            fnDecl:      /\w[\w\s*&<>]+\s+\w+\s*\([^)]*\)\s*(?:const)?\s*\{/gm,
            style:       'Doxygen',
        },
        go: {
            blockDoc:    /\/\/\s+[A-Z][^\n]{10,}/gm,
            param:       /\/\/\s+\w+\s+(is|sets|returns|specifies)/g,
            returns:     /\/\/\s+returns?\s+/gi,
            example:     /func\s+Example\w+/g,
            throws:      /\/\/\s+(error|err)\s+/gi,
            inline:      /\/\/[^\n]{8,}/g,
            moduleDoc:   /\/\/ Package\s+\w+/,
            author:      /@author|Package\s+\w+\s+provides/gi,
            see:         /\/\/ See\s+/g,
            fnDecl:      /^func\s+\w+/gm,
            style:       'GoDoc',
        },
        rust: {
            blockDoc:    /\/\/\/[^\n]*/gm,
            param:       /\/\/\/\s*#\s*Arguments|\/\/\/\s*-\s+`\w+`/g,
            returns:     /\/\/\/\s*#\s*Returns|\/\/\/\s*Returns/g,
            example:     /\/\/\/\s*#\s*Examples|\/\/\/\s*```/g,
            throws:      /\/\/\/\s*#\s*(Errors|Panics)/g,
            inline:      /\/\/[^\n]{8,}/g,
            moduleDoc:   /\/\/!\s+.+/,
            author:      /#!\[doc\s*=|\/\/!\s+@author/gi,
            see:         /\/\/\/\s*\[.*\]\(.*\)/g,
            fnDecl:      /^pub\s+(async\s+)?fn\s+\w+|^fn\s+\w+/gm,
            style:       'RustDoc',
        },
        ruby: {
            blockDoc:    /##\n(#[^\n]*\n)*/gm,
            param:       /@param\s+\[|# @param/g,
            returns:     /@return\s+\[|# @return/g,
            example:     /@example|# @example/gi,
            throws:      /@raise\s+\[|# @raise/g,
            inline:      /#[^\n]{8,}/g,
            moduleDoc:   /# [\w\s]{20,}\n(# [^\n]+\n)+/,
            author:      /@author|@version|# Author:/gi,
            see:         /@see\s+|# @see\s+/g,
            fnDecl:      /^\s*def\s+\w+/gm,
            style:       'RDoc',
        },
        php: {
            blockDoc:    /\/\*\*[\s\S]*?\*\//gm,
            param:       /@param\s+[\w|]+\s+\$/g,
            returns:     /@return\s+\w+/g,
            example:     /@example/gi,
            throws:      /@throws\s+\w+/g,
            inline:      /\/\/[^\n]{8,}/g,
            moduleDoc:   /\/\*\*[\s\S]{60,}?\*\//,
            author:      /@author|@version|@package/gi,
            see:         /@see\s+/g,
            fnDecl:      /function\s+\w+\s*\(/gm,
            style:       'PHPDoc',
        },
        swift: {
            blockDoc:    /\/\/\/[^\n]*/gm,
            param:       /- Parameter\s+\w+:|\/\/\/\s*- parameter/gi,
            returns:     /- Returns:|\/\/\/\s*- returns:/gi,
            example:     /\/\/\/\s*Example:|- Note:/gi,
            throws:      /- Throws:|\/\/\/\s*- throws:/gi,
            inline:      /\/\/[^\n]{8,}/g,
            moduleDoc:   /\/\/\/\s*.{30,}/,
            author:      /- Author:|- Version:|- Since:/gi,
            see:         /- SeeAlso:|- See:/gi,
            fnDecl:      /\bfunc\s+\w+/gm,
            style:       'Swift Doc',
        },
        kotlin: {
            blockDoc:    /\/\*\*[\s\S]*?\*\//gm,
            param:       /@param\s+\w+/g,
            returns:     /@return\b/g,
            example:     /@sample\s+|@see\s+/g,
            throws:      /@throws\s+\w+/g,
            inline:      /\/\/[^\n]{8,}/g,
            moduleDoc:   /\/\*\*[\s\S]{60,}?\*\//,
            author:      /@author|@since|@version/gi,
            see:         /@see\s+/g,
            fnDecl:      /\bfun\s+\w+/gm,
            style:       'KDoc',
        },
    };

    // ── RAG Score: Markdown (0–100) ──────────────────────────────────────
    function scoreRAG(text) {
        if (!text || !text.trim()) return 0;
        let score = 0;
        const words = text.trim().split(/\s+/).length;
        if (/^---\s*\n[\s\S]*?\n---/m.test(text)) {
            score += 12;
            if (/title\s*:/i.test(text))       score += 3;
            if (/description\s*:/i.test(text)) score += 3;
            if (/tags\s*:/i.test(text))         score += 2;
        }
        const h1 = (text.match(/^# .+/gm)   || []).length;
        const h2 = (text.match(/^## .+/gm)  || []).length;
        const h3 = (text.match(/^### .+/gm) || []).length;
        if (h1 === 1) score += 8;
        if (h2 >= 2)  score += 7;
        if (h3 >= 1)  score += 5;
        const ragMarkers = (text.match(/>\s*\*\*(RAG|Summary|Chunk)/gi) || []).length;
        score += Math.min(ragMarkers * 7, 20);
        const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length;
        score += Math.min(codeBlocks * 3, 10);
        const listItems = (text.match(/^[-*] .+/gm) || []).length;
        score += Math.min(listItems * 2, 10);
        if (words >= 150 && words <= 2000) score += 10;
        else if (words >= 50) score += 5;
        const tables = (text.match(/\|.+\|/g) || []).length;
        if (tables >= 2) score += 5;
        const links = (text.match(/\[.+\]\(.+\)/g) || []).length;
        score += Math.min(links * 2, 5);
        return Math.min(Math.round(score), 100);
    }

    // ── GEO Score: Markdown (0–100) ──────────────────────────────────────
    function scoreGEO(text) {
        if (!text || !text.trim()) return 0;
        let score = 0;
        const hasTitle = /^title\s*:/mi.test(text) || /^# .{10,}/m.test(text);
        if (hasTitle) score += 20;
        if (/^description\s*:/mi.test(text)) score += 15;
        if (/^tags\s*:/mi.test(text)) {
            score += 10;
            const tagLine = text.match(/^tags\s*:\s*\[([^\]]+)\]/mi);
            if (tagLine && tagLine[1].split(',').length >= 3) score += 5;
        }
        if (/^keywords\s*:/mi.test(text)) score += 8;
        const boldCount = (text.match(/\*\*[^*]{3,}\*\*/g) || []).length;
        score += Math.min(boldCount * 3, 18);
        if (/^author\s*:/mi.test(text)) score += 5;
        if (/^date\s*:/mi.test(text))   score += 4;
        const words = text.trim().split(/\s+/).length;
        if (words >= 200) score += 10;
        else if (words >= 100) score += 5;
        if (/^## /m.test(text)) score += 5;
        return Math.min(Math.round(score), 100);
    }

    // ── RAG Score: Code — language-aware (0–100) ─────────────────────────
    function scoreRAGCode(text, language) {
        if (!text || !text.trim()) return 0;
        const lang = language || detectLanguage(text);
        const p    = LANG_PATTERNS[lang] || LANG_PATTERNS.javascript;
        let score  = 0;

        const lines     = text.split('\n').length;
        const fnMatches = (text.match(p.fnDecl) || []).length;
        const docBlocks = (text.match(p.blockDoc) || []).length;

        // Documentation coverage (most important — up to 35pts)
        const docRatio = fnMatches > 0 ? docBlocks / fnMatches : 0;
        if (docRatio >= 1.0)      score += 35;
        else if (docRatio >= 0.7) score += 25;
        else if (docRatio >= 0.4) score += 15;
        else if (docRatio >= 0.1) score += 8;
        else if (docBlocks > 0)   score += 5;

        // Module-level doc (up to 10pts)
        if (p.moduleDoc.test(text)) score += 10;

        // @param / parameter docs (up to 15pts)
        const params = (text.match(p.param) || []).length;
        score += Math.min(params * 3, 15);

        // @returns / return docs (up to 10pts)
        const returns = (text.match(p.returns) || []).length;
        score += Math.min(returns * 5, 10);

        // @throws / error docs (up to 8pts)
        const throws = (text.match(p.throws) || []).length;
        score += Math.min(throws * 4, 8);

        // Inline comments (up to 10pts)
        const inlineComments = (text.match(p.inline) || []).length;
        score += Math.round(Math.min((inlineComments / Math.max(lines, 1)) * 120, 10));

        // Examples (up to 8pts)
        const examples = (text.match(p.example) || []).length;
        score += Math.min(examples * 4, 8);

        // Author/version metadata (4pts)
        if (p.author.test(text)) { score += 4; p.author.lastIndex = 0; }

        return Math.min(Math.round(score), 100);
    }

    // ── GEO Score: Code — language-aware (0–100) ─────────────────────────
    function scoreGEOCode(text, language) {
        if (!text || !text.trim()) return 0;
        const lang = language || detectLanguage(text);
        const p    = LANG_PATTERNS[lang] || LANG_PATTERNS.javascript;
        let score  = 0;

        const fnMatches = (text.match(p.fnDecl) || []).length;

        // Descriptive function names (4+ chars after prefix) — up to 20pts
        let descriptiveFns = 0;
        const fnNames = text.match(p.fnDecl) || [];
        fnNames.forEach(fn => {
            const name = fn.match(/[a-zA-Z_]\w{3,}/);
            if (name) descriptiveFns++;
        });
        score += Math.min(descriptiveFns * 4, 20);

        // @description / summary tags — up to 15pts
        const descriptions = (text.match(p.returns) || []).length; // reuse returns as proxy
        score += Math.min(descriptions * 5, 15);

        // Typed parameters — up to 20pts
        const typedParams = (text.match(p.param) || []).length;
        score += Math.min(typedParams * 4, 20);

        // Module-level doc — up to 15pts
        const moduleDoc = (text.match(p.blockDoc) || []).length;
        score += Math.min(moduleDoc * 5, 15);

        // Author/version/since — 10pts
        if (p.author.test(text)) { score += 10; p.author.lastIndex = 0; }

        // @see / cross-reference links — up to 10pts
        const seeLinks = (text.match(p.see) || []).length;
        score += Math.min(seeLinks * 5, 10);

        // Inline comment density — up to 10pts
        const lines = text.split('\n').length;
        const inlineComments = (text.match(p.inline) || []).length;
        score += Math.round(Math.min((inlineComments / Math.max(lines, 1)) * 120, 10));

        return Math.min(Math.round(score), 100);
    }

    // ── Language-aware Checklist ─────────────────────────────────────────
    function getChecklist(text, isCode, language) {
        if (!isCode) return [
            { label: 'Frontmatter',   pass: /^---\s*\n[\s\S]*?\n---/m.test(text) },
            { label: 'H1 heading',    pass: /^# .+/m.test(text) },
            { label: 'H2 sections',   pass: (text.match(/^## .+/gm)||[]).length >= 2 },
            { label: 'RAG chunks',    pass: />\s*\*\*(RAG|Summary|Chunk)/i.test(text) },
            { label: 'Code blocks',   pass: /```/.test(text) },
            { label: 'Tags metadata', pass: /^tags\s*:/mi.test(text) },
            { label: 'Bold keywords', pass: (text.match(/\*\*\w/g)||[]).length >= 3 },
            { label: 'Cross-links',   pass: /\[.+\]\(.+\)/.test(text) },
        ];

        const lang = language || detectLanguage(text);
        const p    = LANG_PATTERNS[lang] || LANG_PATTERNS.javascript;

        // Build language-specific checklist
        const checks = [
            {
                label: `${p.style} blocks`,
                pass:  (text.match(p.blockDoc) || []).length > 0
            },
            {
                label: 'Param docs',
                pass:  (text.match(p.param) || []).length > 0
            },
            {
                label: 'Return docs',
                pass:  (text.match(p.returns) || []).length > 0
            },
            {
                label: 'Examples',
                pass:  (text.match(p.example) || []).length > 0
            },
            {
                label: 'Error/throws docs',
                pass:  (text.match(p.throws) || []).length > 0
            },
            {
                label: 'Inline comments',
                pass:  (text.match(p.inline) || []).length >= 2
            },
            {
                label: 'Module/file doc',
                pass:  p.moduleDoc.test(text)
            },
            {
                label: 'Author/version',
                pass:  (() => { const r = p.author.test(text); p.author.lastIndex = 0; return r; })()
            },
        ];

        return checks;
    }

    // ── Color helpers ────────────────────────────────────────────────────
    function scoreColor(n) {
        if (n >= 75) return '#34d399';
        if (n >= 45) return '#fbbf24';
        return '#f87171';
    }
    function scoreGrade(n) {
        if (n >= 85) return { grade: 'A', label: 'Excellent' };
        if (n >= 70) return { grade: 'B', label: 'Good' };
        if (n >= 50) return { grade: 'C', label: 'Fair' };
        if (n >= 30) return { grade: 'D', label: 'Weak' };
        return { grade: 'F', label: 'Poor' };
    }

    // ── Build inline score panel HTML ────────────────────────────────────
    function buildInlinePanel(inputText, outputText, isCode, language) {
        const lang = isCode ? (language || detectLanguage(outputText || inputText || '')) : null;

        const scoreFnRAG = (t) => isCode ? scoreRAGCode(t, lang) : scoreRAG(t);
        const scoreFnGEO = (t) => isCode ? scoreGEOCode(t, lang) : scoreGEO(t);

        const hasBoth = !!(inputText && outputText);
        const text    = outputText || inputText || '';

        const ragIn  = inputText  ? scoreFnRAG(inputText)  : null;
        const geoIn  = inputText  ? scoreFnGEO(inputText)  : null;
        const ragOut = outputText ? scoreFnRAG(outputText) : null;
        const geoOut = outputText ? scoreFnGEO(outputText) : null;

        const langLabel = isCode && lang
            ? (LANG_PATTERNS[lang]?.style || lang)
            : null;

        function scoreBar(id, value, color, showFrom = null) {
            return `
            <div class="isp-score-block">
                <div class="isp-score-nums">
                    ${showFrom !== null ? `<span class="isp-score-from" style="color:${scoreColor(showFrom)}">${showFrom}</span><span class="isp-score-arrow">→</span>` : ''}
                    <span class="isp-score-val" id="${id}-val" style="color:${color}">0</span>
                    <span class="isp-score-max">/100</span>
                    ${showFrom !== null
                        ? `<span class="isp-score-delta ${value - showFrom >= 0 ? 'pos' : 'neg'}" id="${id}-delta">
                            ${value - showFrom >= 0 ? '▲' : '▼'} ${Math.abs(value - showFrom)} pts
                           </span>`
                        : `<span class="isp-score-grade" style="color:${color}">${scoreGrade(value).grade}</span>`
                    }
                </div>
                <div class="isp-bar-track">
                    ${showFrom !== null ? `<div class="isp-bar-from" style="width:${showFrom}%"></div>` : ''}
                    <div class="isp-bar-fill" id="${id}-bar" data-val="${value}" style="background:${color}; width:0%"></div>
                </div>
                <div class="isp-score-label-row">
                    ${showFrom !== null ? `<span class="isp-sublabel">Before</span><span></span><span class="isp-sublabel after">After</span>` : ''}
                </div>
            </div>`;
        }

        const ragColor = scoreColor(ragOut ?? ragIn ?? 0);
        const geoColor = scoreColor(geoOut ?? geoIn ?? 0);

        const checklist = getChecklist(text, isCode, lang);
        const passCount = checklist.filter(c => c.pass).length;
        const total     = checklist.length;

        return `
        <div class="isp-panel" id="ispPanel">
            <div class="isp-header">
                <span class="isp-title">📊 RAG &amp; GEO Score${hasBoth ? ' — Before vs. After' : ''}${langLabel ? ` <span class="isp-lang-badge">${langLabel}</span>` : ''}</span>
                <button class="isp-close" id="ispClose">✕</button>
            </div>
            <div class="isp-body">
                <div class="isp-scores-row">
                    <div class="isp-score-section">
                        <div class="isp-section-label">🤖 RAG Retrieval</div>
                        ${scoreBar('isp-rag', ragOut ?? ragIn ?? 0, ragColor, hasBoth ? ragIn : null)}
                    </div>
                    <div class="isp-divider-v"></div>
                    <div class="isp-score-section">
                        <div class="isp-section-label">🌐 GEO Discoverability</div>
                        ${scoreBar('isp-geo', geoOut ?? geoIn ?? 0, geoColor, hasBoth ? geoIn : null)}
                    </div>
                </div>
                <div class="isp-divider-h"></div>
                <div class="isp-checklist">
                    <div class="isp-checklist-header">
                        <span class="isp-checklist-title">✨ ${langLabel ? langLabel + ' ' : ''}Checklist</span>
                        <span class="isp-checklist-score">${passCount}/${total} passed</span>
                    </div>
                    <div class="isp-pills">
                        ${checklist.map((c, i) => `
                        <span class="isp-pill ${c.pass ? 'pass' : 'fail'}" style="opacity:0; transition-delay:${i * 80}ms">
                            ${c.pass ? '✅' : '❌'} ${c.label}
                        </span>`).join('')}
                    </div>
                </div>
            </div>
        </div>`;
    }

    // ── Animate the panel after insert ───────────────────────────────────
    function animatePanel(ragVal, geoVal) {
        function countUp(id, to, duration) {
            const el = document.getElementById(id + '-val');
            if (!el) return;
            const start = performance.now();
            function tick(now) {
                const p = Math.min((now - start) / duration, 1);
                const e = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round((to) * e);
                if (p < 1) requestAnimationFrame(tick);
                else el.textContent = to;
            }
            requestAnimationFrame(tick);
        }
        function animBar(id, duration) {
            const el = document.getElementById(id + '-bar');
            if (!el) return;
            const val = el.dataset.val;
            el.style.transition = `width ${duration}ms cubic-bezier(0.22,1,0.36,1)`;
            setTimeout(() => { el.style.width = val + '%'; }, 60);
        }
        function animDelta(id) {
            const el = document.getElementById(id + '-delta');
            if (!el) return;
            el.style.opacity = '0';
            el.style.transform = 'translateY(4px)';
            setTimeout(() => {
                el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 900);
        }
        function animPills() {
            document.querySelectorAll('#ispPanel .isp-pill').forEach(pill => {
                pill.style.opacity = '1';
            });
        }
        countUp('isp-rag', ragVal, 1000);
        animBar('isp-rag', 1100);
        animDelta('isp-rag');
        setTimeout(() => {
            countUp('isp-geo', geoVal, 1000);
            animBar('isp-geo', 1100);
            animDelta('isp-geo');
        }, 300);
        setTimeout(animPills, 900);
    }

    // ── Public: render inline in a container ─────────────────────────────
    function renderInline(containerId, inputText, outputText, isCode, language) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Toggle off if already open
        const existing = container.querySelector('.isp-panel');
        if (existing) {
            existing.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            existing.style.opacity    = '0';
            existing.style.transform  = 'translateY(-8px)';
            setTimeout(() => existing.remove(), 200);
            return;
        }

        // Detect language if not passed
        const lang    = isCode ? (language || detectLanguage(outputText || inputText || '')) : null;
        const text    = outputText || inputText || '';
        const scoreFnRAG = (t) => isCode ? scoreRAGCode(t, lang) : scoreRAG(t);
        const scoreFnGEO = (t) => isCode ? scoreGEOCode(t, lang) : scoreGEO(t);
        const ragVal  = scoreFnRAG(text);
        const geoVal  = scoreFnGEO(text);

        container.insertAdjacentHTML('afterbegin', buildInlinePanel(inputText, outputText, isCode, lang));

        document.getElementById('ispClose').addEventListener('click', () => {
            const panel = document.getElementById('ispPanel');
            if (!panel) return;
            panel.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            panel.style.opacity    = '0';
            panel.style.transform  = 'translateY(-8px)';
            setTimeout(() => panel.remove(), 200);
        });

        requestAnimationFrame(() => {
            const panel = document.getElementById('ispPanel');
            if (panel) {
                panel.style.opacity   = '0';
                panel.style.transform = 'translateY(-10px)';
                requestAnimationFrame(() => {
                    panel.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
                    panel.style.opacity    = '1';
                    panel.style.transform  = 'translateY(0)';
                });
            }
            animatePanel(ragVal, geoVal);
        });

        if (typeof gtag !== 'undefined') {
            gtag('event', 'score_panel_opened', {
                rag_score:      ragVal,
                geo_score:      geoVal,
                has_comparison: !!(inputText && outputText),
                language:       lang || 'markdown',
                site:           isCode ? 'poly-glot' : 'poly-glot-markdown'
            });
        }
    }

    // Legacy modal show — delegates to inline
    function show(inputText, outputText, isCode, containerId, language) {
        if (containerId) renderInline(containerId, inputText, outputText, isCode, language);
    }

    return { renderInline, show, scoreRAG, scoreGEO, scoreRAGCode, scoreGEOCode, detectLanguage };
})();
