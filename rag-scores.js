/**
 * Poly-Glot — Animated RAG & GEO Scores by Language
 * Self-contained IIFE — zero globals, zero interference
 * Injected after CLI demo section
 */
(function () {
  'use strict';

  /* ── Score data per language ─────────────────────────────────────────────── */
  var SCORES = [
    { lang: 'Python',     icon: '🐍', rag: 94, geo: 91, why: 'Rich docstrings + type hints = dense semantic signal' },
    { lang: 'JavaScript', icon: '⚡', rag: 89, geo: 86, why: 'JSDoc tags structure retrieval perfectly for RAG' },
    { lang: 'Java',       icon: '☕', rag: 92, geo: 88, why: 'Javadoc verbosity is exactly what LLMs need' },
    { lang: 'TypeScript', icon: '🔷', rag: 91, geo: 89, why: 'Type info + TSDoc = highest-precision embeddings' },
    { lang: 'Go',         icon: '🐹', rag: 87, geo: 84, why: 'GoDoc simplicity maps cleanly to GEO indexing' },
    { lang: 'Rust',       icon: '🦀', rag: 88, geo: 85, why: 'Safety docs + why-comments reduce hallucinations' },
    { lang: 'C++',        icon: '⚙️', rag: 83, geo: 80, why: 'Doxygen headers improve context window density' },
    { lang: 'C#',         icon: '🎯', rag: 90, geo: 87, why: 'XML docs give structured schema for AI parsing' },
    { lang: 'Ruby',       icon: '💎', rag: 85, geo: 82, why: 'YARD tags help AI trace method contracts' },
    { lang: 'PHP',        icon: '🐘', rag: 82, geo: 79, why: 'PHPDoc enables strong type inference for RAG' },
    { lang: 'Swift',      icon: '🍎', rag: 86, geo: 83, why: 'Swift markup clarity improves code completion' },
    { lang: 'Kotlin',     icon: '🟣', rag: 87, geo: 84, why: 'KDoc + coroutine docs = precise async context' },
  ];

  /* ── Score colour ────────────────────────────────────────────────────────── */
  function scoreColor(n) {
    if (n >= 90) return '#4ade80'; // green
    if (n >= 85) return '#7dd3fc'; // blue
    if (n >= 80) return '#a78bfa'; // purple
    return '#f59e0b';              // amber
  }

  /* ── Build HTML ──────────────────────────────────────────────────────────── */
  function buildHTML() {
    var cards = SCORES.map(function (s) {
      return [
        '<div class="pg-rs-card" data-rag="' + s.rag + '" data-geo="' + s.geo + '">',
          '<div class="pg-rs-lang">',
            '<span class="pg-rs-icon">' + s.icon + '</span>',
            '<span class="pg-rs-name">' + s.lang + '</span>',
          '</div>',
          '<div class="pg-rs-bars">',
            '<div class="pg-rs-bar-row">',
              '<span class="pg-rs-label">RAG</span>',
              '<div class="pg-rs-track">',
                '<div class="pg-rs-fill" data-target="' + s.rag + '" data-color="' + scoreColor(s.rag) + '" style="width:0%;background:' + scoreColor(s.rag) + '"></div>',
              '</div>',
              '<span class="pg-rs-score" data-target="' + s.rag + '">0</span>',
            '</div>',
            '<div class="pg-rs-bar-row">',
              '<span class="pg-rs-label">GEO</span>',
              '<div class="pg-rs-track">',
                '<div class="pg-rs-fill" data-target="' + s.geo + '" data-color="' + scoreColor(s.geo) + '" style="width:0%;background:' + scoreColor(s.geo) + '"></div>',
              '</div>',
              '<span class="pg-rs-score" data-target="' + s.geo + '">0</span>',
            '</div>',
          '</div>',
          '<div class="pg-rs-why">' + s.why + '</div>',
        '</div>',
      ].join('');
    }).join('');

    return [
      '<div class="pg-rs-section" id="pg-rs-section">',
        '<div class="pg-rs-header">',
          '<h2 class="pg-rs-title">📊 RAG &amp; GEO Score by Language</h2>',
          '<p class="pg-rs-subtitle">How well Poly-Glot why-comments improve AI retrieval and generative engine visibility — scored per language after comment generation.</p>',
        '</div>',
        '<div class="pg-rs-grid">' + cards + '</div>',
        '<div class="pg-rs-note">',
          '💡 Scores reflect semantic density improvement after Poly-Glot why-comment generation vs. uncommented code. Higher = better AI context, RAG recall, and GEO discoverability.',
        '</div>',
      '</div>',
    ].join('');
  }

  /* ── Animate bars with IntersectionObserver ──────────────────────────────── */
  function animateBars(section) {
    var fills  = section.querySelectorAll('.pg-rs-fill');
    var scores = section.querySelectorAll('.pg-rs-score');
    var duration = 1200;
    var start    = null;

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      fills.forEach(function (el) {
        var target = parseInt(el.dataset.target, 10);
        el.style.width = (target * ease) + '%';
      });

      scores.forEach(function (el) {
        var target = parseInt(el.dataset.target, 10);
        el.textContent = Math.round(target * ease);
      });

      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  /* ── Inject + observe ────────────────────────────────────────────────────── */
  function init() {
    // Find injection point — after CLI demo section, before Section 7
    var ragSection = document.querySelector('.overview-section-rag');
    if (!ragSection) return;

    // Don't inject twice
    if (document.getElementById('pg-rs-section')) return;

    var wrapper = document.createElement('div');
    wrapper.innerHTML = buildHTML();
    ragSection.parentNode.insertBefore(wrapper.firstChild, ragSection);

    var section = document.getElementById('pg-rs-section');
    var animated = false;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !animated) {
          animated = true;
          animateBars(section);
          observer.disconnect();
        }
      });
    }, { threshold: 0.15 });

    observer.observe(section);
  }

  /* ── Wait for DOM ────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
