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
 *   - First page load  → fetches from APIs immediately
 *   - Poll interval    → re-fetches every 60 seconds while tab is visible
 *   - Tab hidden       → polling pauses (saves API calls)
 *   - Tab refocused    → fetches immediately + resumes polling
 *   - Cache TTL        → 3 hours (used only for instant first paint)
 *
 * pg2CounterVSCode → combined extension installs: VS Code + Open VSX (animated)
 *
 * data-live targets updated:
 *   npm-version    → poly-glot-ai-cli latest version  (e.g. "2.0.1")
 *   mcp-version    → poly-glot-mcp latest version     (e.g. "1.0.0")
 *   vscode-version → VS Code ext version              (e.g. "1.4.10")
 *   dl-week        → npm weekly downloads             (e.g. "936")
 *   dl-total       → npm all-time downloads           (e.g. "1,858")
 *
 * CLI terminal demo:
 *   Updates the npm install output line
 *   (.cli-demo-body .cli-line.cli-output starting with "+")
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  var CACHE_KEY      = 'pg_live_data_v8';
  var CACHE_TTL_MS   = 3 * 60 * 60 * 1000; // 3 hours
  var POLL_INTERVAL_MS = 60 * 1000;         // 60 seconds

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

      // ── Known floors (verified from dashboards — public API undercounts) ─
      var VS_FLOOR  = 87;   // VS Code "Till Date" from publisher dashboard
      var OVX_FLOOR = 124;  // Open VSX downloadCount (API accurate here)

      // Open VSX — apply floor so count never goes backwards
      try {
        var ovxCount = ovxResp && typeof ovxResp.downloadCount === 'number'
                       ? ovxResp.downloadCount : 0;
        data.openVsxInstalls = Math.max(OVX_FLOOR, ovxCount);
      } catch (e) {
        data.openVsxInstalls = OVX_FLOOR;
      }

      // VS Code Marketplace — apply floor (public API lags ~48hrs)
      data.vscodeMarketplaceInstalls = Math.max(VS_FLOOR, data.vscodeMarketplaceInstalls || 0);

      // Store each separately for display, combined for legacy usage
      data.vscodeInstalls = data.vscodeMarketplaceInstalls + data.openVsxInstalls;

      return data;
    });
  }

  // ── Animated counter roll-up ────────────────────────────────────────────────
  // Track running animation handles per element to allow cancellation
  var _rafHandles = {};

  function animateCounter(el, targetVal) {
    if (!el) return;
    var id = el.id || el.className;

    // Cancel any existing animation on this element before starting a new one
    if (_rafHandles[id]) {
      cancelAnimationFrame(_rafHandles[id]);
      delete _rafHandles[id];
    }

    var duration  = 1800;
    var startTime = null;

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

  // ── Animate first time, snap on poll updates ────────────────────────────────
  function setCounter(el, val) {
    if (!el || !val) return;
    if (!el.hasAttribute('data-animated')) {
      animateCounter(el, val);
      el.setAttribute('data-animated', '1');
    } else {
      el.textContent = val.toLocaleString();
    }
    el.setAttribute('data-target', val);
  }

  // ── Update install counter widget ───────────────────────────────────────────
  function updateInstallCounter(data) {
    try {
      // Stat 1 — npm total installs
      setCounter(document.getElementById('pg2CounterTotal'),  data.dlTotal                      || 0);
      // Stat 2 — npm this week
      setCounter(document.getElementById('pg2CounterWeek'),   data.dlWeek                       || 0);
      // Stat 3 — VS Code Marketplace (with floor)
      setCounter(document.getElementById('pg2CounterVSCode'), data.vscodeMarketplaceInstalls     || 0);
      // Stat 4 — Open VSX (with floor)
      setCounter(document.getElementById('pg2CounterOVX'),    data.openVsxInstalls              || 0);
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

  // ── Single fetch + apply cycle ───────────────────────────────────────────────
  function fetchAndApply() {
    fetchLiveData()
      .then(function (data) {
        if (data && Object.keys(data).length > 0) {
          writeCache(data);
          applyData(data);
          updateInstallCounter(data);
        }
      })
      .catch(function () { /* silent */ });
  }

  // ── Boot ────────────────────────────────────────────────────────────────────
  function init() {
    // 1. Paint immediately from cache if available (instant render)
    var cached = readCache();
    if (cached) {
      applyData(cached);
      // Set up IntersectionObserver — it will trigger updateInstallCounter once visible
      observeCounter(cached);
    } else {
      // No cache — fetchAndApply will drive first paint via IntersectionObserver
      var el = document.getElementById('pg2InstallCounter');
      if (el) {
        fetchLiveData().then(function(data) {
          if (data && Object.keys(data).length > 0) {
            writeCache(data);
            applyData(data);
            observeCounter(data);
          }
        }).catch(function() {});
        return; // polling started below handles subsequent updates
      }
    }

    // 2. Fetch fresh data — but delay slightly so observeCounter animation fires first
    setTimeout(fetchAndApply, 2000);

    // 3. Poll every 60 seconds while the tab is open
    //    Uses visibilitychange to pause when tab is hidden — saves API calls
    var pollTimer = null;

    function startPolling() {
      if (pollTimer) return; // already running
      pollTimer = setInterval(fetchAndApply, POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }

    // Start polling immediately
    startPolling();

    // Pause when tab is hidden, resume when visible
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopPolling();
      } else {
        // Tab came back into focus — fetch immediately then resume polling
        fetchAndApply();
        startPolling();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
