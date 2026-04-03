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
 *   - First page load  → fetches from APIs (≤ 6 requests, parallel)
 *   - Same-tab revisit → instant from cache (no network)
 *   - Next session     → fresh fetch
 *   - Cache TTL        → 3 hours (matches Actions cron schedule)
 *
 * data-live targets updated:
 *   npm-version    → poly-glot-ai-cli latest version  (e.g. "2.0.1")
 *   mcp-version    → poly-glot-mcp latest version     (e.g. "1.0.0")
 *   vscode-version → VS Code ext version              (e.g. "1.4.10")
 *   dl-week        → npm weekly downloads             (e.g. "936")
 *   dl-total       → npm all-time downloads           (e.g. "1,858")
 *
 * Install counter widget:
 *   pg2CounterTotal  → npm all-time downloads (animated)
 *   pg2CounterWeek   → npm weekly downloads   (animated)
 *   pg2CounterVSCode → combined extension installs: VS Code + Open VSX (animated)
 *
 * CLI terminal demo:
 *   Updates the npm install output line
 *   (.cli-demo-body .cli-line.cli-output starting with "+")
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  var CACHE_KEY    = 'pg_live_data_v5';
  var CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

  // ── Tiny fetch helper — returns Promise<json|null>, never rejects ───────────
  function safeFetch(url, opts) {
    return fetch(url, opts || {})
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  // ── sessionStorage cache ────────────────────────────────────────────────────
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
    } catch (e) { /* quota / private mode — ignore */ }
  }

  // ── DOM helpers ─────────────────────────────────────────────────────────────
  function setAll(selector, fn) {
    try { document.querySelectorAll(selector).forEach(fn); } catch (e) {}
  }

  function setText(el, text) {
    try { if (el) el.textContent = text; } catch (e) {}
  }

  // ── Apply fetched data to the DOM ───────────────────────────────────────────
  function applyData(data) {
    try {
      var npmVer  = data.npmVersion    || '';
      var mcpVer  = data.mcpVersion    || '';
      var vscVer  = data.vscodeVersion || '';
      var dlWeek  = data.dlWeek        || 0;
      var dlTotal = data.dlTotal       || 0;

      // 1. All [data-live="npm-version"] spans
      setAll('[data-live="npm-version"]', function (el) {
        if (npmVer) setText(el, npmVer);
      });

      // 2. All [data-live="mcp-version"] spans
      setAll('[data-live="mcp-version"]', function (el) {
        if (mcpVer) setText(el, mcpVer);
      });

      // 3. All [data-live="vscode-version"] spans
      setAll('[data-live="vscode-version"]', function (el) {
        if (vscVer) setText(el, vscVer);
      });

      // 4. Download counts
      setAll('[data-live="dl-week"]', function (el) {
        if (dlWeek) setText(el, dlWeek.toLocaleString());
      });

      setAll('[data-live="dl-total"]', function (el) {
        if (dlTotal) setText(el, dlTotal.toLocaleString());
      });

      // 5. CLI terminal demo install output line
      //    Targets the line starting with "+" inside .cli-demo-body
      if (npmVer) {
        try {
          var termLines = document.querySelectorAll('.cli-demo-body .cli-line.cli-output');
          termLines.forEach(function (el) {
            var txt = (el.textContent || '').trim();
            if (txt.charAt(0) === '+' && txt.indexOf('poly-glot') !== -1) {
              el.innerHTML = '+ poly-glot-ai-cli@' + npmVer;
            }
          });
        } catch (e) {}
      }

      // 6. Set debug attributes on <html>
      try {
        document.documentElement.setAttribute('data-live-npm', npmVer);
        document.documentElement.setAttribute('data-live-vscode', vscVer);
        document.documentElement.setAttribute('data-live-fetched', new Date().toISOString());
      } catch (e) {}

    } catch (e) {
      // Silent — never break the page
    }
  }

  // ── Fetch all live data in parallel ────────────────────────────────────────
  function fetchLiveData() {
    return Promise.all([

      // npm CLI — latest version
      safeFetch('https://registry.npmjs.org/poly-glot-ai-cli/latest'),

      // npm MCP — latest version
      safeFetch('https://registry.npmjs.org/poly-glot-mcp/latest'),

      // npm CLI — weekly downloads
      safeFetch('https://api.npmjs.org/downloads/point/last-week/poly-glot-ai-cli'),

      // npm CLI — total downloads (all time)
      safeFetch('https://api.npmjs.org/downloads/range/2026-01-01:2099-01-01/poly-glot-ai-cli'),

      // VS Code Marketplace — extension version + install count
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
      ),

      // Open VSX Registry — extension download count
      safeFetch('https://open-vsx.org/api/poly-glot-ai/poly-glot')

    ]).then(function (res) {
      var cliLatest  = res[0];
      var mcpLatest  = res[1];
      var cliWeek    = res[2];
      var cliRange   = res[3];
      var vscResp    = res[4];
      var ovxResp    = res[5];

      var data = {};

      if (cliLatest && cliLatest.version)  data.npmVersion    = cliLatest.version;
      if (mcpLatest && mcpLatest.version)  data.mcpVersion    = mcpLatest.version;
      if (cliWeek   && typeof cliWeek.downloads === 'number')
                                           data.dlWeek        = cliWeek.downloads;
      if (cliRange  && Array.isArray(cliRange.downloads))
                                           data.dlTotal       = cliRange.downloads
                                             .reduce(function (s, d) { return s + (d.downloads || 0); }, 0);
      try {
        var ext = vscResp.results[0].extensions[0];
        data.vscodeVersion = ext.versions[0].version;
        // VS Code Marketplace: install (from VS Code app) + downloadCount (from web)
        var vsInstall  = 0;
        var vsDownload = 0;
        (ext.statistics || []).forEach(function (s) {
          if (s.statisticName === 'install')       vsInstall  = s.value || 0;
          if (s.statisticName === 'downloadCount') vsDownload = s.value || 0;
        });
        data.vscodeMarketplaceInstalls = vsInstall + vsDownload;
      } catch (e) {}

      // Open VSX Registry — downloadCount
      try {
        var ovxCount = ovxResp && typeof ovxResp.downloadCount === 'number'
                       ? ovxResp.downloadCount : 0;
        data.openVsxInstalls = ovxCount;
      } catch (e) {}

      // Combined extension installs: VS Code Marketplace + Open VSX
      // This is the true total across all stores — shown in the landing page counter
      var mkt = data.vscodeMarketplaceInstalls || 0;
      var ovx = data.openVsxInstalls           || 0;
      if (mkt > 0 || ovx > 0) data.vscodeInstalls = mkt + ovx;

      return data;
    });
  }

  // ── Animated counter roll-up ────────────────────────────────────────────────
  function animateCounter(el, targetVal) {
    if (!el) return;
    var start     = 0;
    var duration  = 1800; // ms
    var startTime = null;

    // Ease out cubic
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var current  = Math.round(easeOut(progress) * targetVal);
      el.textContent = current.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = targetVal.toLocaleString();
      }
    }
    requestAnimationFrame(step);
  }

  // ── Update install counter widget ───────────────────────────────────────────
  function updateInstallCounter(data) {
    try {
      var total   = data.dlTotal        || 0;
      var week    = data.dlWeek         || 0;
      var vscode  = data.vscodeInstalls || 0;

      var elTotal  = document.getElementById('pg2CounterTotal');
      var elWeek   = document.getElementById('pg2CounterWeek');
      var elVSCode = document.getElementById('pg2CounterVSCode');

      // Only animate if we have real data
      if (total  && elTotal)  animateCounter(elTotal,  total);
      if (week   && elWeek)   animateCounter(elWeek,   week);
      if (vscode && elVSCode) animateCounter(elVSCode, vscode);

      // Also update data-target attributes for future reference
      if (elTotal)  elTotal.setAttribute('data-target',  total);
      if (elWeek)   elWeek.setAttribute('data-target',   week);
      if (elVSCode) elVSCode.setAttribute('data-target', vscode);

    } catch (e) { /* silent */ }
  }

  // ── Intersection Observer — animate when counter scrolls into view ──────────
  function observeCounter(data) {
    try {
      var el = document.getElementById('pg2InstallCounter');
      if (!el) return;

      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              updateInstallCounter(data);
              observer.disconnect();
            }
          });
        }, { threshold: 0.3 });
        observer.observe(el);
      } else {
        // Fallback — just update immediately
        updateInstallCounter(data);
      }
    } catch (e) { /* silent */ }
  }

  // ── Boot ────────────────────────────────────────────────────────────────────
  function init() {
    var cached = readCache();
    if (cached) {
      applyData(cached);
      observeCounter(cached);
      return;
    }

    fetchLiveData()
      .then(function (data) {
        if (data && Object.keys(data).length > 0) {
          writeCache(data);
          applyData(data);
          observeCounter(data);
        }
      })
      .catch(function () { /* silent */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();