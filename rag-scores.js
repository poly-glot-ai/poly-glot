/**
 * Poly-Glot — Animated RAG & GEO Scores
 * Shows inside the CLI demo terminal after code output renders.
 * Hooks into cli-terminal-demo.js via MutationObserver on #codeOutputSection.
 * Zero globals, zero interference with existing code.
 */
(function () {
  'use strict';

  /* ── Scores per language ───────────────────────────────────────────────── */
  var SCORES = {
    javascript: { rag: 89, geo: 86, why: 'Dynamic typing makes intent comments critical for AI retrieval' },
    typescript: { rag: 93, geo: 91, why: 'Type annotations + why-comments = highest AI comprehension' },
    python:     { rag: 94, geo: 91, why: 'Docstrings natively parsed by RAG — best-in-class retrieval' },
    java:       { rag: 92, geo: 88, why: 'Javadoc structure maps perfectly to RAG chunking strategies' },
    go:         { rag: 87, geo: 84, why: 'GoDoc conventions align well with semantic search indexing' },
    rust:       { rag: 88, geo: 85, why: 'Safety comments explain borrow decisions AI can\'t infer' },
    cpp:        { rag: 85, geo: 82, why: 'Doxygen comments bridge complex pointer logic for AI context' },
    csharp:     { rag: 91, geo: 87, why: 'XML doc comments provide structured metadata for GEO indexing' },
    ruby:       { rag: 84, geo: 81, why: 'YARD comments add type hints Ruby\'s dynamic nature hides' },
    php:        { rag: 83, geo: 80, why: 'PHPDoc fills gaps in loosely-typed code AI struggles with' },
    swift:      { rag: 86, geo: 84, why: 'Swift markup comments clarify optionals and protocol intent' },
    kotlin:     { rag: 88, geo: 85, why: 'KDoc + coroutine comments explain async intent to AI tools' },
  };

  /* ── Score colour ──────────────────────────────────────────────────────── */
  function barColor(score) {
    if (score >= 90) return 'linear-gradient(90deg, #22c55e, #4ade80)';
    if (score >= 85) return 'linear-gradient(90deg, #7dd3fc, #38bdf8)';
    return 'linear-gradient(90deg, #a78bfa, #c4b5fd)';
  }

  /* ── Animate a single bar ──────────────────────────────────────────────── */
  function animateBar(fillEl, scoreEl, target, delay) {
    setTimeout(function () {
      var start = null;
      var duration = 1100;

      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        var current = Math.round(ease * target);
        fillEl.style.width = (ease * target) + '%';
        scoreEl.textContent = current;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay);
  }

  /* ── Build the scores widget ───────────────────────────────────────────── */
  function buildWidget(lang) {
    var data = SCORES[lang] || SCORES.javascript;

    var widget = document.createElement('div');
    widget.id = 'pg-rag-widget';
    widget.style.cssText = [
      'margin-top:20px',
      'background:linear-gradient(135deg,rgba(125,211,252,0.07),rgba(167,139,250,0.07))',
      'border:1px solid rgba(125,211,252,0.18)',
      'border-radius:12px',
      'padding:18px 20px',
      'animation:pg-rs-fadein 0.4s ease',
    ].join(';');

    widget.innerHTML = [
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">',
        '<span style="font-size:1.1rem">🧠</span>',
        '<strong style="font-size:0.88rem;color:#7dd3fc;letter-spacing:0.04em">',
          'RAG &amp; GEO IMPACT — with Poly-Glot why-comments',
        '</strong>',
      '</div>',

      /* RAG bar */
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">',
        '<span style="font-size:0.68rem;font-weight:700;color:#64748b;width:28px;letter-spacing:.05em">RAG</span>',
        '<div style="flex:1;height:8px;background:rgba(255,255,255,0.07);border-radius:99px;overflow:hidden">',
          '<div id="pg-rag-fill" style="height:100%;border-radius:99px;width:0%;background:' + barColor(data.rag) + ';transition:none"></div>',
        '</div>',
        '<span id="pg-rag-score" style="font-size:0.78rem;font-weight:700;color:#e2e8f0;width:22px;text-align:right;font-variant-numeric:tabular-nums">0</span>',
        '<span style="font-size:0.68rem;color:#64748b">/100</span>',
      '</div>',

      /* GEO bar */
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">',
        '<span style="font-size:0.68rem;font-weight:700;color:#64748b;width:28px;letter-spacing:.05em">GEO</span>',
        '<div style="flex:1;height:8px;background:rgba(255,255,255,0.07);border-radius:99px;overflow:hidden">',
          '<div id="pg-geo-fill" style="height:100%;border-radius:99px;width:0%;background:' + barColor(data.geo) + ';transition:none"></div>',
        '</div>',
        '<span id="pg-geo-score" style="font-size:0.78rem;font-weight:700;color:#e2e8f0;width:22px;text-align:right;font-variant-numeric:tabular-nums">0</span>',
        '<span style="font-size:0.68rem;color:#64748b">/100</span>',
      '</div>',

      /* Why note */
      '<p style="font-size:0.73rem;color:#64748b;margin:0;line-height:1.5;font-style:italic;border-top:1px solid rgba(255,255,255,0.05);padding-top:10px">',
        '💡 ' + data.why,
      '</p>',
    ].join('');

    return widget;
  }

  /* ── Inject or update widget inside codeOutputSection ─────────────────── */
  function showScores(lang) {
    var section = document.getElementById('codeOutputSection');
    if (!section) return;

    /* Remove previous widget */
    var old = document.getElementById('pg-rag-widget');
    if (old) old.remove();

    var widget = buildWidget(lang);
    section.appendChild(widget);

    /* Animate bars */
    var data = SCORES[lang] || SCORES.javascript;
    animateBar(
      document.getElementById('pg-rag-fill'),
      document.getElementById('pg-rag-score'),
      data.rag, 100
    );
    animateBar(
      document.getElementById('pg-geo-fill'),
      document.getElementById('pg-geo-score'),
      data.geo, 300
    );
  }

  /* ── Watch codeOutputSection for display changes ───────────────────────── */
  function init() {
    var section = document.getElementById('codeOutputSection');
    if (!section) return;

    /* MutationObserver watches for display:block */
    var observer = new MutationObserver(function () {
      if (section.style.display !== 'none' && section.style.display !== '') {
        var langSel = document.getElementById('cliDemoLanguage');
        var lang = langSel ? langSel.value : 'javascript';
        showScores(lang);
      }
    });

    observer.observe(section, { attributes: true, attributeFilter: ['style'] });

    /* Also hook replay — language may change between runs */
    var replayBtn = document.getElementById('replayDemo');
    if (replayBtn) {
      replayBtn.addEventListener('click', function () {
        /* Widget will re-render when MutationObserver fires again */
        var old = document.getElementById('pg-rag-widget');
        if (old) old.remove();
      });
    }

    /* Hide widget when demo is closed */
    var closeBtn = document.getElementById('closeDemo');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        var old = document.getElementById('pg-rag-widget');
        if (old) old.remove();
      });
    }
  }

  /* ── Inject fade-in keyframe ────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent = '@keyframes pg-rs-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(style);

  /* ── Boot ───────────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
