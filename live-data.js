/**
 * Poly-Glot Live Data Injector
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches live npm + VS Code marketplace data at page load and patches the UI
 * with up-to-the-minute values — without requiring a site redeploy.
 *
 * Runs AFTER all other scripts (loaded last, defer).
 * 100% non-breaking: every operation is wrapped in try/catch.
 * Falls back silently to whatever the HTML already shows.
 *
 * Cache strategy: sessionStorage (per browser tab session).
 * This means:
 *   - First page load  → fetches from APIs (≤ 2 requests)
 *   - Subsequent navigations in same tab → uses cached data instantly
 *   - Next browser session → fresh fetch
 *
 * Data sources:
 *   - https://registry.npmjs.org/poly-glot-ai-cli/latest  (version)
 *   - https://api.npmjs.org/downloads/point/last-week/... (downloads)
 *   - VS Code Marketplace extension query API             (ext version)
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  // ── Config ─────────────────────────────────────────────────────────────────
  var CACHE_KEY    = 'pg_live_data_v2';
  var CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours — matches the Actions cron

  // ── Tiny fetch helper (returns Promise<JSON|null>, never rejects) ───────────
  function safeFetch(url, opts) {
    return fetch(url, opts || {})
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  // ── Read/write sessionStorage safely ───────────────────────────────────────
  function readCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (Date.now() - obj._ts > CACHE_TTL_MS) return null;
      return obj;
    } catch (e) { return null; }
  }

  function writeCache(data) {
    try {
      data._ts = Date.now();
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) { /* quota exceeded or private mode — ignore */ }
  }

  // ── DOM helpers ─────────────────────────────────────────────────────────────
  function setText(selector, text) {
    try {
      var el = document.querySelector(selector);
      if (el) el.textContent = text;
    } catch (e) {}
  }

  function setAttr(selector, attr, value) {
    try {
      var el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    } catch (e) {}
  }

  function setAll(selector, fn) {
    try {
      document.querySelectorAll(selector).forEach(fn);
    } catch (e) {}
  }

  // ── Apply data to the DOM ───────────────────────────────────────────────────
  function applyData(data) {
    try {
      var ver     = data.npmVersion    || '';
      var vscVer  = data.vscodeVersion || '';
      var week    = data.dlWeek        || 0;
      var total   = data.dlTotal       || 0;

      // 1. CLI terminal demo: the "npm install" output line
      //    Targets the sentinel comment we add in update-site.py
      //    AND falls back to class-based targeting
      try {
        var termLines = document.querySelectorAll('.cli-demo-body .cli-line.cli-output');
        termLines.forEach(function (el) {
          // Match lines that look like "+ poly-glot-ai-cli@..."
          // The CF email anchor replaces the @ so we check the rendered text too
          var txt = el.textContent || '';
          if (txt.trim().startsWith('+') && txt.indexOf('poly-glot') !== -1) {
            // Replace the entire inner content with the live version
            el.innerHTML = '+ poly-glot-ai-cli@' + ver;
          }
        });
      } catch (e) {}

      // 2. "Live on npm" badge — add version next to it
      try {
        var liveBadges = document.querySelectorAll('.live-badge');
        liveBadges.forEach(function (badge) {
          if (badge.textContent.indexOf('npm') !== -1 && ver) {
            badge.textContent = 'v' + ver + ' on npm';
          }
        });
      } catch (e) {}

      // 3. Any element with data-live="npm-version" gets the npm version injected
      setAll('[data-live="npm-version"]', function (el) {
        if (ver) el.textContent = ver;
      });

      // 4. Any element with data-live="vscode-version" gets VS Code ext version
      setAll('[data-live="vscode-version"]', function (el) {
        if (vscVer) el.textContent = vscVer;
      });

      // 5. Any element with data-live="dl-week"
      setAll('[data-live="dl-week"]', function (el) {
        if (week) el.textContent = week.toLocaleString();
      });

      // 6. Any element with data-live="dl-total"
      setAll('[data-live="dl-total"]', function (el) {
        if (total) el.textContent = total.toLocaleString();
      });

      // 7. Update document <html> data-live-version attribute (for debugging)
      try {
        document.documentElement.setAttribute('data-live-version', ver);
        document.documentElement.setAttribute('data-live-fetched', new Date().toISOString());
      } catch (e) {}

    } catch (e) {
      // Silently swallow — never break the page
    }
  }

  // ── Fetch from APIs ─────────────────────────────────────────────────────────
  function fetchLiveData() {
    return Promise.all([
      // npm latest version (tiny, fast endpoint)
      safeFetch('https://registry.npmjs.org/poly-glot-ai-cli/latest'),

      // npm weekly downloads
      safeFetch('https://api.npmjs.org/downloads/point/last-week/poly-glot-ai-cli'),

      // npm total downloads
      safeFetch('https://api.npmjs.org/downloads/range/2026-01-01:2099-01-01/poly-glot-ai-cli'),

      // VS Code marketplace (POST)
      safeFetch(
        'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept':       'application/json;api-version=3.0-preview.1'
          },
          body: JSON.stringify({
            filters: [{ criteria: [{ filterType: 7, value: 'poly-glot-ai.poly-glot' }] }],
            flags: 914
          })
        }
      )
    ]).then(function (results) {
      var npmLatest  = results[0];
      var npmWeek    = results[1];
      var npmRange   = results[2];
      var vscResp    = results[3];

      var data = {};

      if (npmLatest && npmLatest.version) {
        data.npmVersion = npmLatest.version;
      }

      if (npmWeek && typeof npmWeek.downloads === 'number') {
        data.dlWeek = npmWeek.downloads;
      }

      if (npmRange && Array.isArray(npmRange.downloads)) {
        data.dlTotal = npmRange.downloads.reduce(function (sum, d) {
          return sum + (d.downloads || 0);
        }, 0);
      }

      try {
        var exts = vscResp.results[0].extensions;
        if (exts && exts.length > 0) {
          data.vscodeVersion = exts[0].versions[0].version;
        }
      } catch (e) {}

      return data;
    });
  }

  // ── Main entry point ────────────────────────────────────────────────────────
  function init() {
    // Try cache first
    var cached = readCache();
    if (cached) {
      applyData(cached);
      return;
    }

    // Fetch live, then apply + cache
    fetchLiveData()
      .then(function (data) {
        if (data && Object.keys(data).length > 0) {
          writeCache(data);
          applyData(data);
        }
      })
      .catch(function () {
        // Completely silent — never break the page
      });
  }

  // ── Boot ────────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already ready (script loaded late via defer)
    init();
  }

})();
