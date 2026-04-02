/**
 * Poly-Glot — Animated RAG & GEO Scores  (v4)
 *
 * Exposes window.pgShowScores(lang, mode) — called directly from
 * cli-terminal-demo.js after revealing #codeOutputSection.
 *
 * mode: 'comment' | 'why' | 'both'
 *
 * Scores and why-text are per-language × per-mode so the widget
 * always reflects exactly what was just generated.
 */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────────────
   * SCORES — per language × per mode
   * comment = doc-block only  (JSDoc / PyDoc / Javadoc …)
   * why     = inline why-comments only
   * both    = doc-block + inline why-comments (two passes)
   * ───────────────────────────────────────────────────────────────────────── */
  var SCORES = {
    javascript: {
      comment: {
        rag: 89, geo: 82,
        why: 'JSDoc blocks give AI retrievers structured param/return metadata — dramatically improves snippet ranking'
      },
      why: {
        rag: 78, geo: 86,
        why: 'Inline why-comments explain dynamic-typing intent AI can\'t infer — critical for GEO discoverability'
      },
      both: {
        rag: 93, geo: 91,
        why: 'JSDoc structure + why-comments = AI understands both the contract and the reasoning — highest combined score'
      }
    },
    typescript: {
      comment: {
        rag: 93, geo: 85,
        why: 'TSDoc + type annotations give RAG retrievers rich, structured signal — best doc-only RAG in the set'
      },
      why: {
        rag: 80, geo: 91,
        why: 'Why-comments explain generic constraints and type decisions TypeScript\'s types alone can\'t convey'
      },
      both: {
        rag: 96, geo: 94,
        why: 'TSDoc + type annotations + why-comments = highest AI comprehension of any language in the set'
      }
    },
    python: {
      comment: {
        rag: 94, geo: 83,
        why: 'Google/NumPy docstrings are natively parsed by RAG chunkers — best-in-class doc-only retrieval score'
      },
      why: {
        rag: 79, geo: 91,
        why: 'Inline # why-comments expose dynamic-language intent that docstrings and type hints don\'t capture'
      },
      both: {
        rag: 97, geo: 94,
        why: 'Docstrings + why-comments give AI the full picture — Python\'s readable syntax makes this the top overall scorer'
      }
    },
    java: {
      comment: {
        rag: 92, geo: 84,
        why: 'Javadoc\'s @param/@return/@throws tags map directly to RAG chunking strategies — structured and reliable'
      },
      why: {
        rag: 76, geo: 88,
        why: 'Why-comments surface OOP design decisions and inheritance intent that Javadoc tags alone don\'t explain'
      },
      both: {
        rag: 95, geo: 92,
        why: 'Javadoc + why-comments let AI understand the API contract and the architectural reasoning behind it'
      }
    },
    go: {
      comment: {
        rag: 87, geo: 80,
        why: 'GoDoc // comments feed directly into pkg.go.dev indexing — concise format aligns well with RAG chunking'
      },
      why: {
        rag: 74, geo: 84,
        why: 'Why-comments explain error-handling choices and goroutine patterns that GoDoc conventions don\'t cover'
      },
      both: {
        rag: 91, geo: 88,
        why: 'GoDoc structure + why-comments help AI reason about concurrency and error propagation decisions'
      }
    },
    rust: {
      comment: {
        rag: 88, geo: 81,
        why: 'Rustdoc /// comments with # Examples sections are parsed by docs.rs and RAG tools with high fidelity'
      },
      why: {
        rag: 76, geo: 85,
        why: 'Why-comments explain borrow checker decisions and lifetime choices AI can\'t infer from types alone'
      },
      both: {
        rag: 92, geo: 89,
        why: 'Rustdoc + why-comments give AI full context on safety guarantees and the reasoning behind ownership choices'
      }
    },
    cpp: {
      comment: {
        rag: 85, geo: 78,
        why: 'Doxygen @param/@brief tags provide structured metadata that RAG tools parse reliably despite C++\'s complexity'
      },
      why: {
        rag: 73, geo: 82,
        why: 'Why-comments explain pointer ownership, RAII patterns, and template decisions that Doxygen can\'t capture'
      },
      both: {
        rag: 89, geo: 86,
        why: 'Doxygen structure + why-comments bridge C++\'s notoriously opaque pointer logic for AI code assistants'
      }
    },
    csharp: {
      comment: {
        rag: 91, geo: 84,
        why: 'XML doc comments (///) are parsed by IntelliSense and RAG tools — structured metadata with high retrieval fidelity'
      },
      why: {
        rag: 77, geo: 87,
        why: 'Why-comments surface async/await patterns and LINQ decisions that XML tags alone leave unexplained'
      },
      both: {
        rag: 94, geo: 91,
        why: 'XML doc + why-comments give AI both the API contract and the reasoning — ideal for enterprise codebases'
      }
    },
    ruby: {
      comment: {
        rag: 84, geo: 77,
        why: 'YARD @param/@return tags add type hints Ruby\'s dynamic nature hides — essential for RAG retrieval accuracy'
      },
      why: {
        rag: 72, geo: 81,
        why: 'Why-comments explain metaprogramming choices and duck-typing intent that YARD tags can\'t describe'
      },
      both: {
        rag: 88, geo: 85,
        why: 'YARD structure + why-comments help AI navigate Ruby\'s flexibility without losing intent along the way'
      }
    },
    php: {
      comment: {
        rag: 83, geo: 76,
        why: 'PHPDoc @param/@return fill type gaps in loosely-typed code — gives RAG tools signal they\'d otherwise miss'
      },
      why: {
        rag: 71, geo: 80,
        why: 'Why-comments explain type coercion decisions and security choices that PHPDoc annotations can\'t convey'
      },
      both: {
        rag: 87, geo: 84,
        why: 'PHPDoc + why-comments give AI the structured types and the intent behind dynamic PHP patterns'
      }
    },
    swift: {
      comment: {
        rag: 86, geo: 80,
        why: 'Swift markup /// comments with - Parameter / - Returns are parsed cleanly by Xcode and RAG retrievers'
      },
      why: {
        rag: 75, geo: 84,
        why: 'Why-comments clarify optional-unwrapping choices and protocol conformance decisions Swift types don\'t explain'
      },
      both: {
        rag: 90, geo: 88,
        why: 'Swift markup + why-comments give AI full context on safety-critical optional handling and protocol design'
      }
    },
    kotlin: {
      comment: {
        rag: 88, geo: 82,
        why: 'KDoc @param/@return tags are indexed by Dokka and RAG tools — structured coroutine docs improve AI suggestions'
      },
      why: {
        rag: 76, geo: 85,
        why: 'Why-comments explain coroutine scope choices and null-safety decisions that KDoc annotations leave implicit'
      },
      both: {
        rag: 92, geo: 89,
        why: 'KDoc + why-comments let AI understand both the coroutine contract and the concurrency reasoning behind it'
      }
    }
  };

  /* ── Bar gradient colour based on score ────────────────────────────────── */
  function barColor(score) {
    if (score >= 90) return 'linear-gradient(90deg,#22c55e,#4ade80)';
    if (score >= 85) return 'linear-gradient(90deg,#7dd3fc,#38bdf8)';
    return 'linear-gradient(90deg,#a78bfa,#c4b5fd)';
  }

  /* ── Mode label shown in the widget header ──────────────────────────────── */
  function modeLabel(mode) {
    if (mode === 'why')  return 'why-comments';
    if (mode === 'both') return 'doc + why-comments';
    return 'doc-comments';
  }

  /* ── Count-up / bar animation ───────────────────────────────────────────── */
  function animateBar(fillEl, scoreEl, target, delayMs) {
    setTimeout(function () {
      fillEl.style.width      = '0%';
      scoreEl.textContent     = '0';
      fillEl.style.background = barColor(target);

      var start    = null;
      var duration = 900;

      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var ease     = 1 - Math.pow(1 - progress, 3);
        fillEl.style.width  = (ease * target) + '%';
        scoreEl.textContent = Math.round(ease * target);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delayMs);
  }

  /* ── Build the widget DOM ───────────────────────────────────────────────── */
  function buildWidget(mode) {
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

    var label = modeLabel(mode);

    w.innerHTML = [
      /* Header */
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">',
        '<span style="font-size:1.1rem">🧠</span>',
        '<strong id="pg-widget-title" style="font-size:0.88rem;color:#7dd3fc;letter-spacing:0.04em">',
          'RAG &amp; GEO IMPACT — with Poly-Glot ' + escapeAttr(label),
        '</strong>',
      '</div>',

      /* RAG bar row */
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">',
        '<span style="font-size:0.68rem;font-weight:700;color:#64748b;',
          'width:28px;letter-spacing:.05em">RAG</span>',
        '<div style="flex:1;height:8px;background:rgba(255,255,255,0.07);',
          'border-radius:99px;overflow:hidden">',
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

      /* Why note */
      '<p id="pg-why-text" style="font-size:0.73rem;color:#64748b;margin:0;',
        'line-height:1.5;font-style:italic;',
        'border-top:1px solid rgba(255,255,255,0.05);padding-top:10px">',
      '</p>'
    ].join('');

    return w;
  }

  /* Safe attribute escaping for the header label */
  function escapeAttr(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ── Main entry-point: show / refresh scores for lang + mode ────────────── */
  function showScores(lang, mode) {
    var section = document.getElementById('codeOutputSection');
    if (!section) return;

    var safeMode = (mode === 'why' || mode === 'both') ? mode : 'comment';
    var langData = SCORES[lang] || SCORES.javascript;
    var data     = langData[safeMode] || langData.comment;

    /* Rebuild widget fresh every time */
    var old = document.getElementById('pg-rag-widget');
    if (old) old.remove();

    var widget = buildWidget(safeMode);
    section.appendChild(widget);

    /* Set why-text safely via textContent */
    var whyEl = document.getElementById('pg-why-text');
    if (whyEl) whyEl.textContent = '💡 ' + data.why;

    /* Animate bars with correct colours for this score */
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

  /* ── Expose globally — cli-terminal-demo.js calls window.pgShowScores(lang, mode) */
  window.pgShowScores = showScores;

  /* ── Cleanup hooks ──────────────────────────────────────────────────────── */
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
