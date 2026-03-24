/**
 * Poly-Glot Scorer — RAG & GEO quality scoring engine
 * Computes real scores from actual content heuristics.
 * Shared between poly-glot.ai and markdown.poly-glot.ai
 */

const PolyGlotScorer = (() => {

    // ── RAG Score (0–100) ────────────────────────────────────────────────
    // Measures how well a document can be retrieved by RAG systems
    function scoreRAG(text) {
        let score = 0;
        const lines  = text.split('\n');
        const words  = text.trim().split(/\s+/).length;

        // 1. Frontmatter (20pts) — YAML block at top
        if (/^---\s*\n[\s\S]*?\n---/m.test(text)) {
            score += 12;
            if (/title\s*:/i.test(text))       score += 3;
            if (/description\s*:/i.test(text)) score += 3;
            if (/tags\s*:/i.test(text))         score += 2;
        }

        // 2. Heading structure (20pts)
        const h1 = (text.match(/^# .+/gm)  || []).length;
        const h2 = (text.match(/^## .+/gm) || []).length;
        const h3 = (text.match(/^### .+/gm)|| []).length;
        if (h1 === 1)    score += 8;
        if (h2 >= 2)     score += 7;
        if (h3 >= 1)     score += 5;

        // 3. RAG chunk markers / summary blocks (20pts)
        const ragMarkers = (text.match(/>\s*\*\*RAG|>\s*\*\*Summary|>\s*\*\*Chunk/gi) || []).length;
        score += Math.min(ragMarkers * 7, 20);

        // 4. Code blocks (10pts) — help chunking boundaries
        const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length;
        score += Math.min(codeBlocks * 3, 10);

        // 5. Lists (10pts) — structured data retrieval
        const listItems = (text.match(/^[-*] .+/gm) || []).length;
        score += Math.min(listItems * 2, 10);

        // 6. Length sweet spot (10pts) — 150-2000 words ideal for RAG
        if (words >= 150 && words <= 2000) score += 10;
        else if (words >= 50)              score += 5;

        // 7. Tables (5pts) — structured data
        const tables = (text.match(/\|.+\|/g) || []).length;
        if (tables >= 2) score += 5;

        // 8. Internal links / See Also (5pts)
        const links = (text.match(/\[.+\]\(.+\)/g) || []).length;
        score += Math.min(links * 2, 5);

        return Math.min(Math.round(score), 100);
    }

    // ── GEO Score (0–100) ────────────────────────────────────────────────
    // Measures how well a document will be discovered by AI/search engines
    function scoreGEO(text) {
        let score = 0;

        // 1. Title in frontmatter or H1 (20pts)
        const hasTitle = /^title\s*:/mi.test(text) || /^# .{10,}/m.test(text);
        if (hasTitle) score += 20;

        // 2. Description (15pts)
        if (/^description\s*:/mi.test(text)) score += 15;

        // 3. Tags/keywords (15pts)
        if (/^tags\s*:/mi.test(text)) {
            score += 10;
            const tagLine = text.match(/^tags\s*:.*$/mi)?.[0] || '';
            const tagCount = (tagLine.match(/\w+/g) || []).length;
            score += Math.min(tagCount, 5);
        }

        // 4. Bold keyword emphasis (15pts) — **keyword** pattern
        const boldTerms = (text.match(/\*\*[A-Za-z][\w\s-]{2,30}\*\*/g) || []).length;
        score += Math.min(boldTerms * 3, 15);

        // 5. Date metadata (5pts)
        if (/^date\s*:/mi.test(text)) score += 5;

        // 6. Author metadata (5pts)
        if (/^author\s*:/mi.test(text)) score += 5;

        // 7. Descriptive headings (10pts) — headings > 3 words
        const richHeadings = (text.match(/^#{1,3} .{15,}/gm) || []).length;
        score += Math.min(richHeadings * 2, 10);

        // 8. Cross-links (5pts)
        const links = (text.match(/\[.+\]\(.+\.md\)/g) || []).length;
        score += Math.min(links * 2, 5);

        // 9. Difficulty/audience metadata (5pts)
        if (/^difficulty\s*:|^audience\s*:|^level\s*:/mi.test(text)) score += 5;

        return Math.min(Math.round(score), 100);
    }

    // ── Score a code document (for poly-glot.ai) ────────────────────────
    function scoreRAGCode(text) {
        let score = 0;
        const lines = text.split('\n');

        // 1. JSDoc/comment blocks (30pts)
        const docBlocks = (text.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
        score += Math.min(docBlocks * 8, 30);

        // 2. @param annotations (20pts)
        const params = (text.match(/@param\s+/g) || []).length;
        score += Math.min(params * 4, 20);

        // 3. @returns (10pts)
        if (/@returns?|@return\s/i.test(text)) score += 10;

        // 4. @example blocks (10pts)
        const examples = (text.match(/@example/gi) || []).length;
        score += Math.min(examples * 5, 10);

        // 5. @throws/@exception (10pts)
        if (/@throws|@exception/i.test(text)) score += 10;

        // 6. Function coverage (20pts) — % of functions documented
        const funcs   = (text.match(/^(?:export\s+)?(?:async\s+)?function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\(/gm) || []).length;
        const docBlks = (text.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
        if (funcs > 0) {
            const ratio = Math.min(docBlks / funcs, 1);
            score += Math.round(ratio * 20);
        } else if (docBlks > 0) {
            score += 10;
        }

        return Math.min(Math.round(score), 100);
    }

    function scoreGEOCode(text) {
        let score = 0;

        // 1. Descriptive function names (20pts)
        const descriptiveFns = (text.match(/function\s+[a-z][a-zA-Z]{4,}/g) || []).length;
        score += Math.min(descriptiveFns * 5, 20);

        // 2. @description tags (15pts)
        const descriptions = (text.match(/@description|@summary|@overview/gi) || []).length;
        score += Math.min(descriptions * 8, 15);

        // 3. @param type annotations (20pts)
        const typedParams = (text.match(/@param\s+\{[^}]+\}/g) || []).length;
        score += Math.min(typedParams * 4, 20);

        // 4. Module/class-level docs (15pts)
        const moduleDoc = (text.match(/\/\*\*[\s\S]{100,}?\*\//g) || []).length;
        score += Math.min(moduleDoc * 8, 15);

        // 5. @author/@version (10pts)
        if (/@author|@version|@since/i.test(text)) score += 10;

        // 6. @see links (10pts)
        const seeLinks = (text.match(/@see\s+/g) || []).length;
        score += Math.min(seeLinks * 5, 10);

        // 7. Inline comments density (10pts)
        const inlineComments = (text.match(/\/\/[^\n]{10,}/g) || []).length;
        const lines = text.split('\n').length;
        const ratio = inlineComments / Math.max(lines, 1);
        score += Math.round(Math.min(ratio * 100, 10));

        return Math.min(Math.round(score), 100);
    }

    // ── Build the score modal HTML ───────────────────────────────────────
    function buildModal(inputText, outputText, isCodeSite) {
        const scoreFnRAG = isCodeSite ? scoreRAGCode : scoreRAG;
        const scoreFnGEO = isCodeSite ? scoreGEOCode : scoreGEO;

        const ragBefore = inputText  ? scoreFnRAG(inputText)  : null;
        const geoBefore = inputText  ? scoreFnGEO(inputText)  : null;
        const ragAfter  = outputText ? scoreFnRAG(outputText) : null;
        const geoAfter  = outputText ? scoreFnGEO(outputText) : null;

        const hasInput  = inputText  && inputText.trim().length > 0;
        const hasOutput = outputText && outputText.trim().length > 0;
        const hasBoth   = hasInput && hasOutput;

        const ragLabel = isCodeSite ? 'RAG Retrieval Score' : 'RAG Retrieval Score';
        const geoLabel = isCodeSite ? 'GEO Discoverability Score' : 'GEO Discoverability Score';

        function scoreColor(n) {
            if (n >= 75) return '#34d399';
            if (n >= 45) return '#fbbf24';
            return '#f87171';
        }

        function scoreEmoji(n) {
            if (n >= 75) return '🟢';
            if (n >= 45) return '🟡';
            return '🔴';
        }

        function renderScoreRow(label, before, after) {
            const bColor = scoreColor(before);
            const aColor = after !== null ? scoreColor(after) : null;
            const delta  = after !== null ? after - before : null;
            const deltaStr = delta !== null
                ? (delta > 0 ? `<span class="pg-score-delta positive">▲ +${delta} pts</span>`
                  : delta < 0 ? `<span class="pg-score-delta negative">▼ ${delta} pts</span>`
                  : `<span class="pg-score-delta neutral">→ No change</span>`)
                : '';

            return `
            <div class="pg-score-row">
                <div class="pg-score-row-label">${label}</div>
                <div class="pg-score-meters">
                    <div class="pg-score-col">
                        <div class="pg-score-sublabel">Before</div>
                        <div class="pg-score-num" style="color:${bColor}">${before}<span class="pg-score-slash">/100</span></div>
                        <div class="pg-score-bar-track">
                            <div class="pg-score-bar" data-width="${before}" style="background:${bColor}; width:0%"></div>
                        </div>
                        <div class="pg-score-emoji">${scoreEmoji(before)}</div>
                    </div>
                    ${after !== null ? `
                    <div class="pg-score-arrow-col">→</div>
                    <div class="pg-score-col">
                        <div class="pg-score-sublabel">After</div>
                        <div class="pg-score-num" style="color:${aColor}">${after}<span class="pg-score-slash">/100</span></div>
                        <div class="pg-score-bar-track">
                            <div class="pg-score-bar" data-width="${after}" style="background:${aColor}; width:0%"></div>
                        </div>
                        <div class="pg-score-emoji">${scoreEmoji(after)}</div>
                    </div>
                    ${deltaStr}` : ''}
                </div>
            </div>`;
        }

        function renderPills(text, isCode) {
            if (!text || !text.trim()) return '';
            const checks = isCode ? [
                { label: 'JSDoc blocks',   pass: /\/\*\*[\s\S]*?\*\//m.test(text) },
                { label: '@param types',   pass: /@param\s+\{/.test(text) },
                { label: '@returns',       pass: /@returns?/.test(text) },
                { label: '@example',       pass: /@example/i.test(text) },
                { label: '@throws',        pass: /@throws/i.test(text) },
                { label: 'Inline comments',pass: /\/\/[^\n]{10,}/.test(text) },
            ] : [
                { label: 'Frontmatter',    pass: /^---\s*\n[\s\S]*?\n---/m.test(text) },
                { label: 'H1 heading',     pass: /^# .+/m.test(text) },
                { label: 'H2 sections',    pass: (text.match(/^## .+/gm)||[]).length >= 2 },
                { label: 'RAG chunks',     pass: />\s*\*\*(RAG|Summary|Chunk)/i.test(text) },
                { label: 'Code blocks',    pass: /```/.test(text) },
                { label: 'Tags metadata',  pass: /^tags\s*:/mi.test(text) },
                { label: 'Bold keywords',  pass: (text.match(/\*\*\w/g)||[]).length >= 3 },
                { label: 'Cross-links',    pass: /\[.+\]\(.+\)/.test(text) },
            ];
            return `<div class="pg-score-pills">
                ${checks.map(c => `<span class="pg-score-pill ${c.pass ? 'pass' : 'fail'}">${c.pass ? '✅' : '❌'} ${c.label}</span>`).join('')}
            </div>`;
        }

        const pillsInput  = hasInput  ? renderPills(inputText,  isCodeSite) : '';
        const pillsOutput = hasOutput ? renderPills(outputText, isCodeSite) : '';

        return `
        <div class="pg-score-overlay" id="pgScoreOverlay">
            <div class="pg-score-modal" id="pgScoreModal">
                <div class="pg-score-header">
                    <div class="pg-score-header-left">
                        <span class="pg-score-title-icon">📊</span>
                        <div>
                            <h3 class="pg-score-title">RAG &amp; GEO Score Analysis</h3>
                            <p class="pg-score-subtitle">${hasBoth ? 'Before vs. after optimization comparison' : hasOutput ? 'Optimized output scores' : 'Input document scores'}</p>
                        </div>
                    </div>
                    <button class="pg-score-close" id="pgScoreClose">✕</button>
                </div>
                <div class="pg-score-body">
                    ${renderScoreRow(`🤖 ${ragLabel}`, ragBefore ?? 0, ragAfter)}
                    <div class="pg-score-divider"></div>
                    ${renderScoreRow(`🌐 ${geoLabel}`, geoBefore ?? 0, geoAfter)}
                    <div class="pg-score-divider"></div>
                    <div class="pg-score-checks-section">
                        <div class="pg-score-checks-title">✨ Checklist</div>
                        ${hasBoth ? `
                        <div class="pg-score-checks-cols">
                            <div>
                                <div class="pg-score-checks-label">Input</div>
                                ${pillsInput}
                            </div>
                            <div>
                                <div class="pg-score-checks-label">Output</div>
                                ${pillsOutput}
                            </div>
                        </div>` : `${pillsInput || pillsOutput}`}
                    </div>
                </div>
                <div class="pg-score-footer">
                    <span class="pg-score-note">Scores are computed from document heuristics. Higher = better AI retrieval &amp; discoverability.</span>
                    <button class="pg-score-close-btn" id="pgScoreCloseBtn">Close</button>
                </div>
            </div>
        </div>`;
    }

    // ── Show the modal ────────────────────────────────────────────────────
    function show(inputText, outputText, isCodeSite = false) {
        // Remove existing modal
        const existing = document.getElementById('pgScoreOverlay');
        if (existing) existing.remove();

        // Build and inject
        const wrapper = document.createElement('div');
        wrapper.innerHTML = buildModal(inputText, outputText, isCodeSite);
        document.body.appendChild(wrapper.firstElementChild);

        // Animate bars after paint
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.querySelectorAll('.pg-score-bar').forEach(bar => {
                    const w = bar.dataset.width;
                    bar.style.transition = 'width 1.2s cubic-bezier(0.22,1,0.36,1)';
                    bar.style.width = w + '%';
                });
            });
        });

        // Close handlers
        const close = () => {
            const overlay = document.getElementById('pgScoreOverlay');
            if (overlay) {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.2s ease';
                setTimeout(() => overlay.remove(), 200);
            }
        };
        document.getElementById('pgScoreClose').addEventListener('click', close);
        document.getElementById('pgScoreCloseBtn').addEventListener('click', close);
        document.getElementById('pgScoreOverlay').addEventListener('click', e => {
            if (e.target.id === 'pgScoreOverlay') close();
        });

        // Track event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'score_modal_opened', {
                has_input: !!(inputText && inputText.trim()),
                has_output: !!(outputText && outputText.trim()),
                site: isCodeSite ? 'poly-glot' : 'poly-glot-markdown'
            });
        }
    }

    return { show, scoreRAG, scoreGEO, scoreRAGCode, scoreGEOCode };
})();
