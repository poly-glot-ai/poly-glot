/**
 * Poly-Glot Scorer — RAG & GEO inline scoring engine
 * Renders animated inline score panels inside the input/output panels.
 * Shared between poly-glot.ai and markdown.poly-glot.ai
 */

const PolyGlotScorer = (() => {

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
            const tagLine = text.match(/^tags\s*:.*$/mi)?.[0] || '';
            score += Math.min((tagLine.match(/\w+/g) || []).length, 5);
        }
        const boldTerms = (text.match(/\*\*[A-Za-z][\w\s-]{2,30}\*\*/g) || []).length;
        score += Math.min(boldTerms * 3, 15);
        if (/^date\s*:/mi.test(text))   score += 5;
        if (/^author\s*:/mi.test(text)) score += 5;
        const richHeadings = (text.match(/^#{1,3} .{15,}/gm) || []).length;
        score += Math.min(richHeadings * 2, 10);
        const links = (text.match(/\[.+\]\(.+\.md\)/g) || []).length;
        score += Math.min(links * 2, 5);
        if (/^difficulty\s*:|^audience\s*:|^level\s*:/mi.test(text)) score += 5;
        return Math.min(Math.round(score), 100);
    }

    // ── RAG Score: Code (0–100) ──────────────────────────────────────────
    function scoreRAGCode(text) {
        if (!text || !text.trim()) return 0;
        let score = 0;
        const docBlocks = (text.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
        score += Math.min(docBlocks * 8, 30);
        const params = (text.match(/@param\s+/g) || []).length;
        score += Math.min(params * 4, 20);
        if (/@returns?|@return\s/i.test(text)) score += 10;
        const examples = (text.match(/@example/gi) || []).length;
        score += Math.min(examples * 5, 10);
        if (/@throws|@exception/i.test(text)) score += 10;
        const funcs = (text.match(/^(?:export\s+)?(?:async\s+)?function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\(/gm) || []).length;
        if (funcs > 0) {
            score += Math.round(Math.min(docBlocks / funcs, 1) * 20);
        } else if (docBlocks > 0) {
            score += 10;
        }
        return Math.min(Math.round(score), 100);
    }

    // ── GEO Score: Code (0–100) ──────────────────────────────────────────
    function scoreGEOCode(text) {
        if (!text || !text.trim()) return 0;
        let score = 0;
        const descriptiveFns = (text.match(/function\s+[a-z][a-zA-Z]{4,}/g) || []).length;
        score += Math.min(descriptiveFns * 5, 20);
        const descriptions = (text.match(/@description|@summary|@overview/gi) || []).length;
        score += Math.min(descriptions * 8, 15);
        const typedParams = (text.match(/@param\s+\{[^}]+\}/g) || []).length;
        score += Math.min(typedParams * 4, 20);
        const moduleDoc = (text.match(/\/\*\*[\s\S]{100,}?\*\//g) || []).length;
        score += Math.min(moduleDoc * 8, 15);
        if (/@author|@version|@since/i.test(text)) score += 10;
        const seeLinks = (text.match(/@see\s+/g) || []).length;
        score += Math.min(seeLinks * 5, 10);
        const inlineComments = (text.match(/\/\/[^\n]{10,}/g) || []).length;
        const lines = text.split('\n').length;
        score += Math.round(Math.min((inlineComments / Math.max(lines, 1)) * 100, 10));
        return Math.min(Math.round(score), 100);
    }

    // ── Checklist ────────────────────────────────────────────────────────
    function getChecklist(text, isCode) {
        if (isCode) return [
            { label: 'JSDoc blocks',    pass: /\/\*\*[\s\S]*?\*\//m.test(text) },
            { label: '@param types',    pass: /@param\s+\{/.test(text) },
            { label: '@returns',        pass: /@returns?/.test(text) },
            { label: '@example',        pass: /@example/i.test(text) },
            { label: '@throws',         pass: /@throws/i.test(text) },
            { label: 'Inline comments', pass: /\/\/[^\n]{10,}/.test(text) },
        ];
        return [
            { label: 'Frontmatter',   pass: /^---\s*\n[\s\S]*?\n---/m.test(text) },
            { label: 'H1 heading',    pass: /^# .+/m.test(text) },
            { label: 'H2 sections',   pass: (text.match(/^## .+/gm)||[]).length >= 2 },
            { label: 'RAG chunks',    pass: />\s*\*\*(RAG|Summary|Chunk)/i.test(text) },
            { label: 'Code blocks',   pass: /```/.test(text) },
            { label: 'Tags metadata', pass: /^tags\s*:/mi.test(text) },
            { label: 'Bold keywords', pass: (text.match(/\*\*\w/g)||[]).length >= 3 },
            { label: 'Cross-links',   pass: /\[.+\]\(.+\)/.test(text) },
        ];
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
    function buildInlinePanel(inputText, outputText, isCode) {
        const scoreFnRAG = isCode ? scoreRAGCode : scoreRAG;
        const scoreFnGEO = isCode ? scoreGEOCode : scoreGEO;

        const hasBoth = !!(inputText && outputText);
        const text    = outputText || inputText || '';

        const ragIn  = inputText  ? scoreFnRAG(inputText)  : null;
        const geoIn  = inputText  ? scoreFnGEO(inputText)  : null;
        const ragOut = outputText ? scoreFnRAG(outputText) : null;
        const geoOut = outputText ? scoreFnGEO(outputText) : null;

        function scoreBar(id, value, color, showFrom = null) {
            const fromVal = showFrom !== null ? showFrom : value;
            return `
            <div class="isp-score-block">
                <div class="isp-score-nums">
                    ${showFrom !== null ? `<span class="isp-score-from" style="color:${scoreColor(showFrom)}">${showFrom}</span><span class="isp-score-arrow">→</span>` : ''}
                    <span class="isp-score-val" id="${id}-val" style="color:${color}">0</span>
                    <span class="isp-score-max">/100</span>
                    ${showFrom !== null ? `<span class="isp-score-delta ${value - showFrom >= 0 ? 'pos' : 'neg'}" id="${id}-delta">
                        ${value - showFrom >= 0 ? '▲' : '▼'} ${Math.abs(value - showFrom)} pts
                    </span>` : `<span class="isp-score-grade" style="color:${color}">${scoreGrade(value).grade}</span>`}
                </div>
                <div class="isp-bar-track">
                    ${showFrom !== null ? `<div class="isp-bar-from" style="width:${fromVal}%"></div>` : ''}
                    <div class="isp-bar-fill" id="${id}-bar" data-val="${value}" style="background:${color}; width:0%"></div>
                </div>
                <div class="isp-score-label-row">
                    ${showFrom !== null ? `<span class="isp-sublabel">Before</span><span></span><span class="isp-sublabel after">After</span>` : ''}
                </div>
            </div>`;
        }

        const ragColor = scoreColor(ragOut ?? ragIn ?? 0);
        const geoColor = scoreColor(geoOut ?? geoIn ?? 0);

        const checklist = getChecklist(text, isCode);
        const passCount = checklist.filter(c => c.pass).length;
        const total     = checklist.length;

        return `
        <div class="isp-panel" id="ispPanel">
            <div class="isp-header">
                <span class="isp-title">📊 RAG &amp; GEO Score${hasBoth ? ' — Before vs. After' : ''}</span>
                <button class="isp-close" id="ispClose">✕</button>
            </div>
            <div class="isp-body">
                <div class="isp-scores-row">
                    <!-- RAG -->
                    <div class="isp-score-section">
                        <div class="isp-section-label">🤖 RAG Retrieval</div>
                        ${scoreBar('isp-rag', ragOut ?? ragIn ?? 0, ragColor, hasBoth ? ragIn : null)}
                    </div>
                    <div class="isp-divider-v"></div>
                    <!-- GEO -->
                    <div class="isp-score-section">
                        <div class="isp-section-label">🌐 GEO Discoverability</div>
                        ${scoreBar('isp-geo', geoOut ?? geoIn ?? 0, geoColor, hasBoth ? geoIn : null)}
                    </div>
                </div>
                <div class="isp-divider-h"></div>
                <!-- Checklist -->
                <div class="isp-checklist">
                    <div class="isp-checklist-header">
                        <span class="isp-checklist-title">✨ Checklist</span>
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
        // Animate number counters
        function countUp(id, to, duration = 1000) {
            const el = document.getElementById(id + '-val');
            if (!el) return;
            const start = performance.now();
            const from  = 0;
            function tick(now) {
                const p = Math.min((now - start) / duration, 1);
                const e = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(from + (to - from) * e);
                if (p < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        }

        // Animate bars
        function animBar(id, duration = 1100) {
            const el = document.getElementById(id + '-bar');
            if (!el) return;
            const val = el.dataset.val;
            el.style.transition = `width ${duration}ms cubic-bezier(0.22,1,0.36,1)`;
            setTimeout(() => { el.style.width = val + '%'; }, 60);
        }

        // Animate delta badge
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

        // Animate checklist pills
        function animPills() {
            document.querySelectorAll('#ispPanel .isp-pill').forEach(pill => {
                pill.style.opacity = '1';
            });
        }

        // Fire in sequence
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
    function renderInline(containerId, inputText, outputText, isCode) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Toggle off if already open
        const existing = container.querySelector('.isp-panel');
        if (existing) {
            existing.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            existing.style.opacity = '0';
            existing.style.transform = 'translateY(-8px)';
            setTimeout(() => existing.remove(), 200);
            return;
        }

        const scoreFnRAG = isCode ? scoreRAGCode : scoreRAG;
        const scoreFnGEO = isCode ? scoreGEOCode : scoreGEO;
        const text   = outputText || inputText || '';
        const ragVal = scoreFnRAG(text);
        const geoVal = scoreFnGEO(text);

        // Insert panel HTML
        container.insertAdjacentHTML('afterbegin', buildInlinePanel(inputText, outputText, isCode));

        // Wire close button
        document.getElementById('ispClose').addEventListener('click', () => {
            const panel = document.getElementById('ispPanel');
            if (!panel) return;
            panel.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(-8px)';
            setTimeout(() => panel.remove(), 200);
        });

        // Animate in
        requestAnimationFrame(() => {
            const panel = document.getElementById('ispPanel');
            if (panel) {
                panel.style.opacity = '0';
                panel.style.transform = 'translateY(-10px)';
                requestAnimationFrame(() => {
                    panel.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
                    panel.style.opacity = '1';
                    panel.style.transform = 'translateY(0)';
                });
            }
            animatePanel(ragVal, geoVal);
        });

        // Track
        if (typeof gtag !== 'undefined') {
            gtag('event', 'score_panel_opened', {
                rag_score: ragVal, geo_score: geoVal,
                has_comparison: !!(inputText && outputText),
                site: isCode ? 'poly-glot' : 'poly-glot-markdown'
            });
        }
    }

    // Legacy modal show — now delegates to inline
    function show(inputText, outputText, isCode, containerId) {
        if (containerId) {
            renderInline(containerId, inputText, outputText, isCode);
        }
    }

    return { renderInline, show, scoreRAG, scoreGEO, scoreRAGCode, scoreGEOCode };
})();
