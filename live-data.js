/**
 * Poly-Glot Live Data Injector v9
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches live npm + VS Code + Open VSX data at page load and patches the UI
 * with up-to-the-minute values — without requiring a site redeploy.
 *
 * Runs AFTER all other scripts (loaded last, defer).
 * 100% non-breaking: every operation is wrapped in try/catch.
 * Falls back silently to whatever the HTML already shows.
 *
 * Cache strategy: sessionStorage (per browser tab session).
 *   - First page load  → fetches from APIs (6 parallel requests)
 *   - Same-tab revisit → instant from cache (no network)
 *   - Next session     → fresh fetch
 *   - Cache TTL        → 3 hours
 *
 * Polling: every 60 seconds while tab is visible. Pauses when hidden.
 *
 * data-live targets updated:
 *   npm-version    → poly-glot-ai-cli latest version  (e.g. "2.1.4")
 *   mcp-version    → poly-glot-mcp latest version     (e.g. "1.0.0")
 *   vscode-version → VS Code ext version              (e.g. "1.4.11")
 *   dl-week        → npm weekly downloads             (e.g. "936")
 *   dl-total       → npm all-time downloads           (e.g. "1,858")
 *
 * CLI terminal demo:
 *   Updates the npm install output line
 *   (.cli-demo-body .cli-line.cli-output starting with "+")
 *
 * Install counters (IDs):
 *   pg2CounterTotal  → dlTotal
 *   pg2CounterWeek   → dlWeek
 *   pg2CounterVSCode → vscodeInstalls (VS Code Marketplace + Open VSX combined)
 *
 * Floor logic (never show less than dashboard numbers):
 *   VS_FLOOR  = 87   (VS Code Marketplace "Till Date" dashboard count)
 *   OVX_FLOOR = 124  (Open VSX all-time count)
 *   Combined  = Math.max(VS_FLOOR, api) + Math.max(OVX_FLOOR, ovxApi)
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  var CACHE_KEY    = 'pg_live_data_v9';
  var CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours
  var VS_FLOOR     = 87;   // VS Code Marketplace dashboard minimum
  var OVX_FLOOR    = 124;  // Open VSX minimum
  var POLL_MS      = 60 * 1000; // 60-second poll interval

  // Track running requestAnimationFrame handles to prevent concurrent animations
  var _rafHandles  = {};

  // ── Tiny fetch helper — returns Promise<json|null>, never rejects ───────────
  function safeFetch(url, opts) {
    return fetch(url, opts)
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function ()  { return null; });
  }

  // ── sessionStorage cache ────────────────────────────────────────────────────
  function readCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (Date.now() - obj._ts > CACHE_TTL_MS) return null;
      return obj.data;
    } catch (e) { return null; }
  }

  function writeCache(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ _ts: Date.now(), data: data }));
    } catch (e) { /* quota exceeded — ignore */ }
  }

  // ── Apply data to DOM ───────────────────────────────────────────────────────
  function setAll(selector, fn) {
    try {
      document.querySelectorAll(selector).forEach(function (el) {
        var val = fn(el);
        if (val != null) el.textContent = val;
      });
    } catch (e) { /* silent */ }
  }

  function applyData(data) {
    try {
      // 1. [data-live="npm-version"] spans
      setAll('[data-live="npm-version"]', function () { return data.npmVersion || null; });

      // 2. [data-live="mcp-version"] spans
      setAll('[data-live="mcp-version"]', function () { return data.mcpVersion || null; });

      // 3. [data-live="vscode-version"] spans
      setAll('[data-live="vscode-version"]', function () { return data.vscodeVersion || null; });

      // 4. [data-live="dl-week"] spans
      setAll('[data-live="dl-week"]', function () {
        return data.dlWeek != null ? Number(data.dlWeek).toLocaleString() : null;
      });

      // 5. [data-live="dl-total"] spans
      setAll('[data-live="dl-total"]', function () {
        return data.dlTotal != null ? Number(data.dlTotal).toLocaleString() : null;
      });

      // 6. CLI terminal demo install output line
      try {
        var cliOut = document.querySelector('.cli-demo-body .cli-line.cli-output');
        if (cliOut && data.npmVersion) {
          var txt = cliOut.textContent || '';
          if (txt.startsWith('+')) {
            cliOut.textContent = '+ poly-glot-ai-cli@' + data.npmVersion + ' installed';
          }
        }
      } catch (e) {}

      // 7. data-build meta (for debugging)
      try {
        document.documentElement.setAttribute('data-live-fetched', new Date().toISOString());
      } catch (e) {}

    } catch (e) {
      // Silent — never break the page
    }
  }

  // ── Fetch all live data in parallel ────────────────────────────────────────
  function fetchLiveData() {
    return Promise.all([

      // 1. npm CLI — latest version
      safeFetch('https://registry.npmjs.org/poly-glot-ai-cli/latest'),

      // 2. npm MCP — latest version
      safeFetch('https://registry.npmjs.org/poly-glot-mcp/latest'),

      // 3. npm CLI — weekly downloads
      safeFetch('https://api.npmjs.org/downloads/point/last-week/poly-glot-ai-cli'),

      // 4. npm CLI — total downloads (all time)
      safeFetch('https://api.npmjs.org/downloads/range/2026-01-01:2099-01-01/poly-glot-ai-cli'),

      // 5. VS Code Marketplace — extension version + install count
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

      // 6. Open VSX Registry — install count
      safeFetch('https://open-vsx.org/api/poly-glot-ai/poly-glot')

    ]).then(function (res) {
      var cliLatest  = res[0];
      var mcpLatest  = res[1];
      var cliWeek    = res[2];
      var cliRange   = res[3];
      var vscResp    = res[4];
      var ovxResp    = res[5];

      var data = {};

      if (cliLatest && cliLatest.version) data.npmVersion = cliLatest.version;
      if (mcpLatest && mcpLatest.version) data.mcpVersion = mcpLatest.version;
      if (cliWeek   && typeof cliWeek.downloads === 'number') data.dlWeek  = cliWeek.downloads;
      if (cliRange  && Array.isArray(cliRange.downloads)) {
        data.dlTotal = cliRange.downloads.reduce(function (s, d) { return s + (d.downloads || 0); }, 0);
      }

      // VS Code Marketplace: combine install + downloadCount, apply floor
      try {
        var ext     = vscResp.results[0].extensions[0];
        data.vscodeVersion = ext.versions[0].version;
        var vsInstall = 0, vsDownload = 0;
        (ext.statistics || []).forEach(function (s) {
          if (s.statisticName === 'install')       vsInstall  = s.value || 0;
          if (s.statisticName === 'downloadCount') vsDownload = s.value || 0;
        });
        data.vscodeMarketplaceInstalls = Math.max(VS_FLOOR, vsInstall + vsDownload);
      } catch (e) {
        data.vscodeMarketplaceInstalls = VS_FLOOR;
      }

      // Open VSX: apply floor
      try {
        var ovxCount = 0;
        if (ovxResp) {
          ovxCount = ovxResp.downloadCount || ovxResp.allVersions && ovxResp.allVersions.reduce
            ? 0
            : 0;
          // Try downloadCount directly
          if (typeof ovxResp.downloadCount === 'number') ovxCount = ovxResp.downloadCount;
        }
        data.openVsxInstalls = Math.max(OVX_FLOOR, ovxCount);
      } catch (e) {
        data.openVsxInstalls = OVX_FLOOR;
      }

      // Combined VS Code installs (both registries)
      data.vscodeInstalls = (data.vscodeMarketplaceInstalls || VS_FLOOR) + (data.openVsxInstalls || OVX_FLOOR);

      return data;
    });
  }

  // ── Animated counter roll-up ────────────────────────────────────────────────
  function animateCounter(el, targetVal) {
    if (!el) return;
    var id = el.id || ('_el_' + Math.random());

    // Cancel any running animation on this element
    if (_rafHandles[id]) {
      cancelAnimationFrame(_rafHandles[id]);
      delete _rafHandles[id];
    }

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
        _rafHandles[id] = requestAnimationFrame(step);
      } else {
        el.textContent = targetVal.toLocaleString();
        delete _rafHandles[id];
      }
    }
    _rafHandles[id] = requestAnimationFrame(step);
  }

  // ── Update install counter widget ───────────────────────────────────────────
  function updateInstallCounter(data, forceAnimate) {
    try {
      var total  = data.dlTotal        || 0;
      var week   = data.dlWeek         || 0;
      var vscode = data.vscodeInstalls || 0;

      var elTotal  = document.getElementById('pg2CounterTotal');
      var elWeek   = document.getElementById('pg2CounterWeek');
      var elVSCode = document.getElementById('pg2CounterVSCode');

      // Animate on first view, snap on subsequent polls
      function applyCounter(el, val) {
        if (!el || !val) return;
        var alreadyAnimated = el.getAttribute('data-animated') === '1';
        if (!alreadyAnimated || forceAnimate) {
          animateCounter(el, val);
          el.setAttribute('data-animated', '1');
        } else {
          // Snap silently to new value
          el.textContent = Number(val).toLocaleString();
        }
        el.setAttribute('data-target', val);
      }

      applyCounter(elTotal,  total);
      applyCounter(elWeek,   week);
      applyCounter(elVSCode, vscode);

    } catch (e) { /* silent */ }
  }

  // ── Intersection Observer — animate when counter scrolls into view ──────────
  var _counterObserved = false;
  function observeCounter(data) {
    try {
      if (_counterObserved) return;
      var el = document.getElementById('pg2InstallCounter');
      if (!el) return;

      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              _counterObserved = true;
              updateInstallCounter(data, false);
              observer.disconnect();
            }
          });
        }, { threshold: 0.3 });
        observer.observe(el);
      } else {
        _counterObserved = true;
        updateInstallCounter(data, false);
      }
    } catch (e) { /* silent */ }
  }

  // ── Fetch + apply (used for both init and polling) ──────────────────────────
  var _latestData = null;

  function fetchAndApply() {
    return fetchLiveData()
      .then(function (data) {
        if (data && Object.keys(data).length > 0) {
          _latestData = data;
          writeCache(data);
          applyData(data);
          // If counter already in view, update it (snap, no re-animation)
          if (_counterObserved) {
            updateInstallCounter(data, false);
          }
        }
      })
      .catch(function () { /* silent */ });
  }

  // ── 60-second polling (pauses when tab hidden) ──────────────────────────────
  var _pollTimer = null;

  function startPolling() {
    if (_pollTimer) return;
    _pollTimer = setInterval(function () {
      if (!document.hidden) {
        fetchAndApply();
      }
    }, POLL_MS);
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      // Tab became visible — fetch immediately then resume polling
      fetchAndApply();
    }
  });

  // ── Boot ────────────────────────────────────────────────────────────────────
  function init() {
    var cached = readCache();
    if (cached) {
      _latestData = cached;
      applyData(cached);
      observeCounter(cached);
      startPolling();
      return;
    }

    fetchAndApply().then(function () {
      if (_latestData) observeCounter(_latestData);
      startPolling();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
