/**
 * Poly-Glot — Animated RAG & GEO Scores  (v3)
 *
 * Exposes window.pgShowScores(lang) so cli-terminal-demo.js can call it
 * directly after revealing #codeOutputSection — no MutationObserver,
 * no timing races, always the right language.
 *
 * Still handles replay / close cleanup internally.
 * Zero globals leaked beyond window.pgShowScores.
 */
(function () {
  'use strict';

  /* ── Per-language score data ────────────────────────────────────────────── */
  var SCORES = {
    javascript: {
      rag: 89, geo: 86,
      why: 'Dynamic typing makes intent comments critical for AI retrieval'
    },
    typescript: {
      rag: 93, geo: 91,
      why: 'Type annotations + why-comments = highest AI comprehension'
    },
    python: {
      rag: 94, geo: 91,
      why: 'Docstrings natively parsed by RAG — best-in-class retrieval'
    },
    java: {
      rag: 92, geo: 88,
      why: 'Javadoc structure maps perfectly to RAG chunking strategies'
    },
    go: {
      rag: 87, geo: 84,
      why: 'GoDoc conventions align well with semantic search indexing'
    },
    rust: {
      rag: 88, geo: 85,
      why: "Safety comments explain borrow decisions AI can't infer"
    },
    cpp: {
      rag: 85, geo: 82,
      why: 'Doxygen comments bridge complex pointer logic for AI context'
    },
    csharp: {
      rag: 91, geo: 87,
      why: 'XML doc comments provide structured metadata for GEO indexing'
    },
    ruby: {
      rag: 84, geo: 81,
      why: "YARD comments add type hints Ruby's dynamic nature hides"
    },
    php: {
      rag: 83, geo: 80,
      why: "PHPDoc fills gaps in loosely-typed code AI struggles with"
    },
    swift: {
      rag: 86, geo: 84,
      why: 'Swift markup comments clarify optionals and protocol intent'
    },
    kotlin: {
      rag: 88, geo: 85,
      why: 'KDoc + coroutine comments explain async intent to AI tools'
    }
  };

  /* ── Bar gradient colour based on score ────────────────────────────────── */
  function barColor(score) {
    if (score >= 90) return 'linear-gradient(90deg,#22c55e,#4ade80)';
    if (score >= 85) return 'linear-gradient(90deg,#7dd3fc,#38bdf8)';
    return 'linear-gradient(90deg,#a78bfa,#c4b5fd)';
  }

  /* ── Count-up animation on a single element ────────────────────────────── */
  function animateBar(fillEl, scoreEl, target, delayMs) {
    setTimeout(function () {
      /* Reset before animating so replays look clean */
      fillEl.style.width      = '0%';
      scoreEl.textContent     = '0';
      fillEl.style.background = barColor(target); /* always correct colour */

      var start    = null;
      var duration = 900; /* ms */

      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var ease     = 1 - Math.pow(1 - progress, 3); /* ease-out cubic */
        fillEl.style.width  = (ease * target) + '%';
        scoreEl.textContent = Math.round(ease * target);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delayMs);
  }

  /* ── Build the widget DOM ──────────────────────────────────────────────── */
  function buildWidget(data) {
    var w = document.createElement('div');
    w.id  = 'pg-rag-widget';
    w.style.cssText = [
      'margin-top:20px',
      'background:linear-gradient(135deg,rgba(125,211,252,0.07),rgba(167,139,250,0.07))',
      'border:1px solid rgba(125,211,252,0.18)',
      'border-radius:12px',
      'padding:18px 20px',
      'animation:pg-rs-fadein 0.4s ease'
    ].join(';');

    w.innerHTML = [
      /* Header */
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">',
        '<span style="font-size:1.1rem">🧠</span>',
        '<strong style="font-size:0.88rem;color:#7dd3fc;letter-spacing:0.04em">',
          'RAG &amp; GEO IMPACT — with Poly-Glot why-comments',
        '</strong>',
      '</div>',

      /* RAG bar row */
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">',
        '<span style="font-size:0.68rem;font-weight:700;color:#64748b;',
          'width:28px;letter-spacing:.05em">RAG</span>',
        '<div style="flex:1;height:8px;background:rgba(255,255,255,0.07);',
          'border-radius:99px;overflow:hidden">',
          /* background set dynamically in animateBar so colour is always fresh */
          '<div id="pg-rag-fill" style="height:100%;border-radius:99px;',
            'width:0%;transition:none"></div>',
        '</div>',
        '<span id="pg-rag-score" style="font-size:0.78rem;font-weight:700;',
          'color:#e2e8f0;width:22px;text-align:right;',
          'font-variant-numeric:tabular-nums">0</span>',
        '<span style="font-size:0.68rem;color:#64748b">/100</span>',
      '</div>',

      /* GEO bar row */
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">',
        '<span style="font-size:0.68rem;font-weight:700;color:#64748b;',
          'width:28px;letter-spacing:.05em">GEO</span>',
        '<div style="flex:1;height:8px;background:rgba(255,255,255,0.07);',
          'border-radius:99px;overflow:hidden">',
          '<div id="pg-geo-fill" style="height:100%;border-radius:99px;',
            'width:0%;transition:none"></div>',
        '</div>',
        '<span id="pg-geo-score" style="font-size:0.78rem;font-weight:700;',
          'color:#e2e8f0;width:22px;text-align:right;',
          'font-variant-numeric:tabular-nums">0</span>',
        '<span style="font-size:0.68rem;color:#64748b">/100</span>',
      '</div>',

      /* Why note — set via textContent after insertion to avoid XSS / escape issues */
      '<p id="pg-why-text" style="font-size:0.73rem;color:#64748b;margin:0;',
        'line-height:1.5;font-style:italic;',
        'border-top:1px solid rgba(255,255,255,0.05);padding-top:10px">',
      '</p>'
    ].join('');

    return w;
  }

  /* ── Main entry-point: show / refresh scores for a given language ───────── */
  function showScores(lang) {
    var section = document.getElementById('codeOutputSection');
    if (!section) return;

    var data = SCORES[lang] || SCORES.javascript;

    /* Always remove any existing widget first so we rebuild fresh */
    var old = document.getElementById('pg-rag-widget');
    if (old) old.remove();

    var widget = buildWidget(data);
    section.appendChild(widget);

    /* Set why-text via textContent (safe, correct for any language) */
    var whyEl = document.getElementById('pg-why-text');
    if (whyEl) whyEl.textContent = '💡 ' + data.why;

    /* Animate bars — colours are applied inside animateBar so they're always fresh */
    animateBar(
      document.getElementById('pg-rag-fill'),
      document.getElementById('pg-rag-score'),
      data.rag, 80
    );
    animateBar(
      document.getElementById('pg-geo-fill'),
      document.getElementById('pg-geo-score'),
      data.geo, 280
    );
  }

  /* ── Expose globally so cli-terminal-demo.js can call it directly ───────── */
  window.pgShowScores = showScores;

  /* ── Cleanup hooks (replay clears widget; close hides section) ──────────── */
  function init() {
    var replayBtn = document.getElementById('replayDemo');
    if (replayBtn) {
      replayBtn.addEventListener('click', function () {
        var old = document.getElementById('pg-rag-widget');
        if (old) old.remove();
      });
    }

    var closeBtn = document.getElementById('closeDemo');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        var old = document.getElementById('pg-rag-widget');
        if (old) old.remove();
      });
    }
  }

  /* ── Fade-in keyframe ───────────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent =
    '@keyframes pg-rs-fadein{' +
      'from{opacity:0;transform:translateY(8px)}' +
      'to{opacity:1;transform:translateY(0)}' +
    '}';
  document.head.appendChild(style);

  /* ── Boot ───────────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
