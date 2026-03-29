/**
 * auth.js — Browser-side auth module for poly-glot.ai
 * Plain vanilla JS, no bundler, no imports.
 * Exposes window.PolyGlotAuth
 */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     Constants
  ───────────────────────────────────────────── */
  const AUTH_API        = 'https://poly-glot.ai/api/auth';
  const LS_TOKEN_KEY    = 'pg_session_token';
  const LS_PLAN_KEY     = 'pg_plan';
  const MODAL_ID        = 'pgAuthModal';

  /* ─────────────────────────────────────────────
     In-memory state
  ───────────────────────────────────────────── */
  let _plan  = null;   // resolved plan string
  let _token = null;   // resolved session token

  /* ─────────────────────────────────────────────
     Inject CSS (modal + toast)
  ───────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('pg-auth-styles')) return;

    const style = document.createElement('style');
    style.id = 'pg-auth-styles';
    style.textContent = `
      /* ── Modal Overlay ── */
      #pgAuthModal {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.7);
        align-items: center;
        justify-content: center;
        font-family: Inter, sans-serif;
      }
      #pgAuthModal.pg-open {
        display: flex;
      }

      /* ── Modal Card ── */
      .pg-modal-card {
        background: #0f1117;
        border: 1px solid rgba(125, 211, 252, 0.2);
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
        color: #f0f9ff;
        max-width: 440px;
        width: calc(100% - 40px);
        padding: 40px 36px 36px;
        position: relative;
        animation: pg-slide-in 0.22s ease;
      }
      @keyframes pg-slide-in {
        from { opacity: 0; transform: translateY(-18px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0)    scale(1); }
      }

      /* ── Close Button ── */
      .pg-modal-close {
        position: absolute;
        top: 14px;
        right: 18px;
        background: none;
        border: none;
        color: rgba(240, 249, 255, 0.45);
        font-size: 22px;
        line-height: 1;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 6px;
        transition: color 0.15s, background 0.15s;
      }
      .pg-modal-close:hover {
        color: #f0f9ff;
        background: rgba(255, 255, 255, 0.06);
      }

      /* ── Typography ── */
      .pg-modal-title {
        font-size: 22px;
        font-weight: 700;
        margin: 0 0 8px;
        color: #f0f9ff;
        letter-spacing: -0.3px;
      }
      .pg-modal-subtitle {
        font-size: 14px;
        color: rgba(240, 249, 255, 0.58);
        margin: 0 0 28px;
        line-height: 1.5;
      }

      /* ── Email Input ── */
      .pg-modal-input {
        width: 100%;
        box-sizing: border-box;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(125, 211, 252, 0.2);
        border-radius: 8px;
        color: #f0f9ff;
        font-family: Inter, sans-serif;
        font-size: 15px;
        padding: 12px 14px;
        outline: none;
        transition: border-color 0.18s, box-shadow 0.18s;
        margin-bottom: 14px;
      }
      .pg-modal-input::placeholder {
        color: rgba(240, 249, 255, 0.3);
      }
      .pg-modal-input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
      }

      /* ── Submit Button ── */
      .pg-modal-btn {
        width: 100%;
        background: #3b82f6;
        border: none;
        border-radius: 8px;
        color: #fff;
        cursor: pointer;
        font-family: Inter, sans-serif;
        font-size: 15px;
        font-weight: 600;
        padding: 13px 20px;
        transition: background 0.18s, transform 0.1s;
      }
      .pg-modal-btn:hover:not(:disabled) {
        background: #2563eb;
      }
      .pg-modal-btn:active:not(:disabled) {
        transform: scale(0.98);
      }
      .pg-modal-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      /* ── Success Message ── */
      .pg-modal-success {
        display: none;
        font-size: 16px;
        color: #34d399;
        text-align: center;
        padding: 10px 0 4px;
        font-weight: 500;
      }

      /* ── Toast ── */
      .pg-toast {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(0);
        z-index: 10000;
        background: #0f1117;
        border: 1px solid rgba(125, 211, 252, 0.2);
        border-radius: 10px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        color: #f0f9ff;
        font-family: Inter, sans-serif;
        font-size: 14px;
        font-weight: 500;
        padding: 13px 22px;
        white-space: nowrap;
        max-width: calc(100vw - 40px);
        opacity: 1;
        transition: opacity 0.4s ease, transform 0.4s ease;
        pointer-events: none;
      }
      .pg-toast.pg-toast-hide {
        opacity: 0;
        transform: translateX(-50%) translateY(10px);
      }

      /* ── Plan Badge (header) ── */
      .pg-plan-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: rgba(52, 211, 153, 0.12);
        border: 1px solid rgba(52, 211, 153, 0.3);
        border-radius: 20px;
        color: #34d399;
        font-family: Inter, sans-serif;
        font-size: 13px;
        font-weight: 600;
        padding: 4px 12px;
        vertical-align: middle;
        margin-left: 10px;
      }
    `;
    document.head.appendChild(style);
  }

  /* ─────────────────────────────────────────────
     Toast helper
  ───────────────────────────────────────────── */
  function showToast(message, durationMs) {
    durationMs = durationMs || 4000;

    // Remove any existing toast
    var existing = document.querySelector('.pg-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'pg-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Fade out then remove
    var hideTimer = setTimeout(function () {
      toast.classList.add('pg-toast-hide');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 450);
    }, durationMs);

    // Allow early dismissal on click
    toast.addEventListener('click', function () {
      clearTimeout(hideTimer);
      toast.classList.add('pg-toast-hide');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 450);
    });
  }

  /* ─────────────────────────────────────────────
     Build & inject modal DOM
  ───────────────────────────────────────────── */
  function buildModal() {
    if (document.getElementById(MODAL_ID)) return;

    var overlay = document.createElement('div');
    overlay.id = MODAL_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'pgAuthModalTitle');

    overlay.innerHTML = `
      <div class="pg-modal-card">
        <button class="pg-modal-close" id="pgAuthModalClose" aria-label="Close">&times;</button>
        <h2 class="pg-modal-title" id="pgAuthModalTitle">Sign in to Poly-Glot</h2>
        <p class="pg-modal-subtitle">Enter your email — we'll send you a magic link</p>
        <form id="pgAuthModalForm" novalidate>
          <input
            class="pg-modal-input"
            id="pgAuthModalEmail"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
          <button class="pg-modal-btn" id="pgAuthModalSubmit" type="submit">
            Send Magic Link
          </button>
        </form>
        <div class="pg-modal-success" id="pgAuthModalSuccess">
          ✅ Check your email!
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // ── Close on overlay click
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    // ── Close button
    document.getElementById('pgAuthModalClose').addEventListener('click', closeModal);

    // ── Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    // ── Form submit
    document.getElementById('pgAuthModalForm').addEventListener('submit', handleMagicLinkSubmit);
  }

  function openModal() {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) {
      buildModal();
      modal = document.getElementById(MODAL_ID);
    }
    // Reset state
    var form    = document.getElementById('pgAuthModalForm');
    var success = document.getElementById('pgAuthModalSuccess');
    var btn     = document.getElementById('pgAuthModalSubmit');
    var input   = document.getElementById('pgAuthModalEmail');
    if (form)    form.style.display    = '';
    if (success) success.style.display = 'none';
    if (btn)     btn.disabled          = false;
    if (input)   input.value           = '';

    modal.classList.add('pg-open');
    if (input) setTimeout(function () { input.focus(); }, 60);
  }

  function closeModal() {
    var modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.remove('pg-open');
  }

  /* ─────────────────────────────────────────────
     Magic-link form submit
  ───────────────────────────────────────────── */
  function handleMagicLinkSubmit(e) {
    e.preventDefault();

    var input = document.getElementById('pgAuthModalEmail');
    var btn   = document.getElementById('pgAuthModalSubmit');
    var form  = document.getElementById('pgAuthModalForm');
    var success = document.getElementById('pgAuthModalSuccess');

    if (!input || !input.value.trim()) return;

    var email = input.value.trim();
    btn.disabled = true;
    btn.textContent = 'Sending…';

    fetch(AUTH_API + '/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    })
      .catch(function () {
        // Fail silently — still show success UX (link may still be sent)
      })
      .finally(function () {
        if (form)    form.style.display    = 'none';
        if (success) success.style.display = 'block';
      });
  }

  /* ─────────────────────────────────────────────
     Verify existing token
  ───────────────────────────────────────────── */
  function verifyStoredToken(token) {
    fetch(AUTH_API + '/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('invalid');
        return res.json();
      })
      .then(function (data) {
        var plan = data.plan || 'free';
        _token = token;
        _plan  = plan;
        localStorage.setItem(LS_PLAN_KEY, plan);
        PolyGlotAuth.onPlanLoaded(plan);
      })
      .catch(function () {
        // Token invalid — purge it
        localStorage.removeItem(LS_TOKEN_KEY);
        localStorage.removeItem(LS_PLAN_KEY);
      });
  }

  /* ─────────────────────────────────────────────
     URL param handling
  ───────────────────────────────────────────── */
  function handleUrlParams() {
    var params = new URLSearchParams(window.location.search);

    // ── ?auth=expired
    if (params.get('auth') === 'expired') {
      cleanUrl();
      showToast('⚠️ That sign-in link has expired. Please request a new one.');
      return;
    }

    // ── ?session=TOKEN&plan=PLAN
    var sessionToken = params.get('session');
    var planParam    = params.get('plan');

    if (sessionToken) {
      _token = sessionToken;
      _plan  = planParam || 'free';
      localStorage.setItem(LS_TOKEN_KEY, _token);
      localStorage.setItem(LS_PLAN_KEY, _plan);
      cleanUrl();
      PolyGlotAuth.onPlanLoaded(_plan);

      var planDisplay = _plan.charAt(0).toUpperCase() + _plan.slice(1);
      showToast('🎉 You\'re signed in! Plan: ' + planDisplay);
    }
  }

  function cleanUrl() {
    var url = window.location.pathname + window.location.hash;
    history.replaceState(null, '', url);
  }

  /* ─────────────────────────────────────────────
     Plan gating
  ───────────────────────────────────────────── */
  var PAID_PLANS = ['pro', 'team', 'enterprise'];

  function applyPlanGating(plan) {
    plan = (plan || '').toLowerCase();

    if (PAID_PLANS.indexOf(plan) === -1) return; // free / unknown — do nothing

    // ── Unlock download button
    var dlBtn = document.getElementById('cgDownloadBtn');
    if (dlBtn) {
      dlBtn.classList.remove('action-btn--paid');
      dlBtn.removeAttribute('disabled');

      // Remove paid badge span if present
      var badge = dlBtn.querySelector('.paid-badge');
      if (badge) badge.parentNode.removeChild(badge);

      // Wire download handler (replace any existing listeners by cloning)
      var freshBtn = dlBtn.cloneNode(true);
      dlBtn.parentNode.replaceChild(freshBtn, dlBtn);
      freshBtn.addEventListener('click', function () {
        triggerDownload(plan);
      });
    }

    // ── Header plan badge + hide "See Plans" button
    var pricingBtn = document.getElementById('headerPricingBtn');
    if (pricingBtn) {
      // Hide the "See Plans" button
      pricingBtn.style.display = 'none';

      // Insert plan badge adjacent to where the button was
      if (!document.querySelector('.pg-plan-badge')) {
        var planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
        var badgeEl = document.createElement('span');
        badgeEl.className = 'pg-plan-badge';
        badgeEl.textContent = '✅ ' + planLabel;
        pricingBtn.parentNode.insertBefore(badgeEl, pricingBtn.nextSibling);
      }
    }
  }

  /* ─────────────────────────────────────────────
     Download handler
  ───────────────────────────────────────────── */
  var EXT_MAP = {
    javascript : 'js',
    typescript : 'ts',
    python     : 'py',
    java       : 'java',
    go         : 'go',
    rust       : 'rs',
    cpp        : 'cpp',
    csharp     : 'cs',
    ruby       : 'rb',
    php        : 'php',
    swift      : 'swift',
    kotlin     : 'kt'
  };

  function triggerDownload(plan) {
    var outputEl   = document.getElementById('cgOutput');
    var languageEl = document.getElementById('cgLanguage');

    // Read text — prefer the textarea value, fall back to window.lastOutputText
    var text = '';
    if (outputEl) {
      text = outputEl.value !== undefined ? outputEl.value : outputEl.textContent;
    }
    if (!text && window.lastOutputText) {
      text = window.lastOutputText;
    }
    if (!text) {
      showToast('⚠️ No output to download yet.');
      return;
    }

    var language = (languageEl && languageEl.value) ? languageEl.value.toLowerCase() : 'code';
    var ext      = EXT_MAP[language] || 'txt';
    var filename = language + '-commented.' + ext;

    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(function () {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 1000);

    // Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'cg_download', { plan: plan, language: language });
    }
  }

  /* ─────────────────────────────────────────────
     Public API — window.PolyGlotAuth
  ───────────────────────────────────────────── */
  var PolyGlotAuth = {
    /**
     * Called when a plan is confirmed (token verify, URL param, or localStorage).
     * Override this in app.js / pricing.js if you need custom behaviour.
     */
    onPlanLoaded: function (plan) {
      applyPlanGating(plan);
    },

    /**
     * Open the login modal.
     * @param {string} source — analytics source label
     */
    openLoginModal: function (source) {
      openModal();
      if (typeof gtag === 'function') {
        gtag('event', 'auth_modal_opened', { source: source || 'unknown' });
      }
    },

    /** Apply plan gating manually (useful if plan arrives asynchronously). */
    applyPlanGating: applyPlanGating,

    /** Returns the current session token (from localStorage). */
    getToken: function () {
      return _token || localStorage.getItem(LS_TOKEN_KEY) || null;
    },

    /** Returns the current plan string, or 'free'. */
    getPlan: function () {
      return _plan || localStorage.getItem(LS_PLAN_KEY) || 'free';
    },

    /** Clear auth state and reload. */
    logout: function () {
      localStorage.removeItem(LS_TOKEN_KEY);
      localStorage.removeItem(LS_PLAN_KEY);
      _token = null;
      _plan  = null;
      window.location.reload();
    },

    /** Expose toast for other scripts. */
    showToast: showToast,

    /** Expose closeModal for external use. */
    closeLoginModal: closeModal
  };

  /* ─────────────────────────────────────────────
     Initialisation (runs on DOMContentLoaded or
     immediately if DOM is already ready)
  ───────────────────────────────────────────── */
  function init() {
    injectStyles();
    buildModal();

    // 1. Check URL params first (highest priority)
    handleUrlParams();

    // 2. If no session came from URL, try localStorage token
    if (!_token) {
      var storedToken = localStorage.getItem(LS_TOKEN_KEY);
      if (storedToken) {
        verifyStoredToken(storedToken);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose globally
  window.PolyGlotAuth = PolyGlotAuth;

}());
