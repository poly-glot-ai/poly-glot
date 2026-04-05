/**
 * Poly-Glot Live Data Injector v11
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches live install stats at page load and patches the UI with up-to-the-
 * minute values — without requiring a site redeploy.
 *
 * v11 changes vs v10:
 *   - Removed npm weekly/total download fetches (not shown in UI)
 *   - GitHub App counter always shown (no longer hidden behind > 0 guard)
 *   - Counter widget: VS Code · Open VSX · GitHub repos (3 stats)
 *   - applyData() no longer writes dl-week / dl-total targets (removed from HTML)
 *
 * Floor fix (Apr 4 2026):
 *   - VS_FLOOR / OVX_FLOOR lifted to module scope
 *   - applyFloors() called on BOTH cached and fresh data before any render
 *   - Guarantees counters never animate to a sub-floor value, even from cache
 *   - Cache key bumped → pg_live_data_v13 to bust all stale sub-floor entries
 *
 * Cache strategy: sessionStorage (per browser tab session).
 *   - First page load  → fetches from APIs immediately
 *   - Poll interval    → re-fetches every 60 seconds while tab is visible
 *   - Tab hidden       → polling pauses (saves API calls)
 *   - Tab refocused    → fetches immediately + resumes polling
 *   - Cache TTL        → 3 hours (used only for instant first paint)
 *
 * data-live targets updated:
 *   npm-version    → poly-glot-ai-cli latest version  (e.g. "2.1.10")
 *   mcp-version    → poly-glot-mcp latest version     (e.g. "1.0.1")
 *   vscode-version → VS Code ext version              (e.g. "1.4.12")
 *
 * Counter widget elements:
 *   pg2CounterVSCode  → VS Code Marketplace installs  (animated, with floor)
 *   pg2CounterOVX     → Open VSX downloads            (animated, with floor)
 *   pg2CounterGitHub  → GitHub App installations      (animated, always shown)
 *   pg2CounterChrome  → Chrome Web Store installs     (floor-based, manual update)
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  var CACHE_KEY        = 'pg_live_data_v13';  // bumped: bust stale sub-floor cache entries (Apr 4 2026)
  var CACHE_TTL_MS     = 3 * 60 * 60 * 1000; // 3 hours
  var POLL_INTERVAL_MS = 60 * 1000;           // 60 seconds

  // ── Known floors (module scope — applied to BOTH cached and fresh data) ──────
  // These are verified "Total Acquisition Till Date" values from publisher dashboards.
  // The public APIs undercount vs dashboard by ~48 hrs; floors ensure we never
  // animate backwards to a stale API value.
  var VS_FLOOR     = 118;  // VS Code "Total Acquisition" (verified Apr 4 2026 — dashboard shows 104, public API lags ~48hrs)
  var OVX_FLOOR    = 592;  // Open VSX downloadCount               (verified Apr 3 2026)
  var CHROME_FLOOR = 0;    // Chrome Web Store — no public API (updated by scripts/update-site.py)

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
      if (!obj || (Date.now() - (obj._ts || 0)) > CACHE_TTL_MS) return null;
      // Re-apply floors on read — guards against any cached value written before
      // a floor was raised (e.g. old entry with vscodeMarketplaceInstalls: 96).
      applyFloors(obj);
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

  // ── Apply floors to any data object (cached or fresh) ───────────────────────
  // Must be called before any data is rendered or written to cache.
  // Guarantees counters never display a value below the verified dashboard floor.
  function applyFloors(data) {
    if (!data) return data;
    data.vscodeMarketplaceInstalls = Math.max(VS_FLOOR,     data.vscodeMarketplaceInstalls || 0);
    data.openVsxInstalls           = Math.max(OVX_FLOOR,    data.openVsxInstalls           || 0);
    data.chromeInstalls            = Math.max(CHROME_FLOOR, data.chromeInstalls             || 0);
    return data;
  }

  // ── Apply fetched data to the DOM ───────────────────────────────────────────
  function applyData(data) {
    try {
      var npmVer = data.npmVersion    || '';
      var mcpVer = data.mcpVersion    || '';
      var vscVer = data.vscodeVersion || '';

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

      // 4. CLI terminal demo install output line
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

      // 5. Set debug attributes on <html>
      try {
        document.documentElement.setAttribute('data-live-npm',     npmVer);
        document.documentElement.setAttribute('data-live-vscode',  vscVer);
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

      // VS Code Marketplace — routed through our auth worker proxy (avoids CORS block)
      safeFetch(
        'https://poly-glot.ai/api/auth/vsc-proxy',
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
      safeFetch('https://open-vsx.org/api/poly-glot-ai/poly-glot'),

      // GitHub App — routed through auth worker proxy (avoids Render CORS issue)
      safeFetch('https://poly-glot.ai/api/auth/gh-proxy?endpoint=stats'),

      // Chrome Web Store — via cws-proxy (OAuth2 refresh → access token → CWS API)
      safeFetch('https://poly-glot.ai/api/auth/cws-proxy')

    ]).then(function (res) {
      var cliLatest = res[0];
      var mcpLatest = res[1];
      var vscResp   = res[2];
      var ovxResp   = res[3];
      var ghResp    = res[4];
      // res[5] = cwsResp — handled below

      var data = {};

      if (cliLatest && cliLatest.version) data.npmVersion = cliLatest.version;
      if (mcpLatest && mcpLatest.version) data.mcpVersion = mcpLatest.version;

      // VS Code Marketplace — version + combined install count
      try {
        var ext = vscResp.results[0].extensions[0];
        data.vscodeVersion = ext.versions[0].version;
        var vsInstall  = 0;
        var vsDownload = 0;
        (ext.statistics || []).forEach(function (s) {
          if (s.statisticName === 'install')       vsInstall  = s.value || 0;
          if (s.statisticName === 'downloadCount') vsDownload = s.value || 0;
        });
        data.vscodeMarketplaceInstalls = vsInstall + vsDownload;
      } catch (e) {}

      // Open VSX — raw count (floor applied later via applyFloors)
      try {
        data.openVsxInstalls = (ovxResp && typeof ovxResp.downloadCount === 'number')
          ? ovxResp.downloadCount : 0;
      } catch (e) {
        data.openVsxInstalls = 0;
      }

      // GitHub App installations — always set (0 is a valid starting value)
      try {
        data.githubInstallations = (ghResp && typeof ghResp.installations === 'number')
          ? ghResp.installations
          : 0;
      } catch (e) {
        data.githubInstallations = 0;
      }

      // Chrome Web Store — via cws-proxy worker (OAuth2 → CWS Publish API)
      var cwsResp = res[5];
      try {
        data.chromeInstalls = (cwsResp && typeof cwsResp.installs === 'number')
          ? cwsResp.installs : 0;
      } catch (e) {
        data.chromeInstalls = 0;
      }

      // Apply all floors in one place (VS Code, Open VSX, Chrome)
      applyFloors(data);

      return data;
    });
  }

  // ── Animated counter roll-up ────────────────────────────────────────────────
  var _rafHandles = {};

  function animateCounter(el, targetVal) {
    if (!el) return;
    var id = el.id || el.className;

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
    if (!el) return;
    var n = val || 0;
    if (!el.hasAttribute('data-animated')) {
      animateCounter(el, n);
      el.setAttribute('data-animated', '1');
    } else {
      el.textContent = n.toLocaleString();
    }
    el.setAttribute('data-target', n);
  }

  // ── Update install counter widget ───────────────────────────────────────────
  function updateInstallCounter(data) {
    try {
      // VS Code Marketplace (with floor)
      setCounter(document.getElementById('pg2CounterVSCode'),  data.vscodeMarketplaceInstalls || 0);
      // Open VSX (with floor)
      setCounter(document.getElementById('pg2CounterOVX'),     data.openVsxInstalls           || 0);
      // GitHub App — always shown, even at 0
      setCounter(document.getElementById('pg2CounterGitHub'),  data.githubInstallations        || 0);
      // Chrome Web Store — floor-based, updated manually until CWS API available
      setCounter(document.getElementById('pg2CounterChrome'),  data.chromeInstalls             || 0);
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
      // IntersectionObserver drives the counter animation once visible
      observeCounter(cached);
    } else {
      // No cache — fetch now, observe after
      fetchLiveData().then(function (data) {
        if (data && Object.keys(data).length > 0) {
          writeCache(data);
          applyData(data);
          observeCounter(data);
        }
      }).catch(function () {});
    }

    // 2. Fetch fresh data after a short delay (lets animation fire first)
    setTimeout(fetchAndApply, 2000);

    // 3. Poll every 60 seconds while tab is visible
    var pollTimer = null;

    function startPolling() {
      if (pollTimer) return;
      pollTimer = setInterval(fetchAndApply, POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }

    startPolling();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopPolling();
      } else {
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
