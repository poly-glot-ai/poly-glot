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

      /* ── Free CTA panel (post sign-in) ── */
      .pg-modal-free-cta {
        text-align: center;
        padding: 8px 0 4px;
      }
      .pg-modal-free-cta__icon {
        font-size: 36px;
        margin-bottom: 10px;
        animation: pg-parrot-bob 3s ease-in-out infinite;
      }
      .pg-modal-free-cta__title {
        font-size: 17px;
        font-weight: 700;
        color: #f1f5f9;
        margin: 0 0 10px;
      }
      .pg-modal-free-cta__body {
        font-size: 13px;
        color: #94a3b8;
        line-height: 1.6;
        margin: 0 0 18px;
      }
      .pg-modal-free-cta__body strong {
        color: #e2e8f0;
      }
      .pg-modal-free-cta__btn {
        display: block;
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: #fff;
        font-size: 15px;
        font-weight: 700;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        margin-bottom: 12px;
        font-family: Inter, sans-serif;
        transition: opacity 0.2s;
      }
      .pg-modal-free-cta__btn:hover { opacity: 0.88; }
      .pg-modal-free-cta__divider {
        font-size: 12px;
        color: #475569;
        margin-bottom: 10px;
      }
      .pg-modal-free-cta__plans {
        display: block;
        width: 100%;
        padding: 11px;
        background: rgba(79, 70, 229, 0.15);
        color: #a5b4fc;
        font-size: 14px;
        font-weight: 600;
        border: 1.5px solid rgba(99, 102, 241, 0.35);
        border-radius: 10px;
        cursor: pointer;
        font-family: Inter, sans-serif;
        transition: background 0.2s;
      }
      .pg-modal-free-cta__plans:hover { background: rgba(79,70,229,0.25); }

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
      }

      /* ── User chip (replaces Sign In button after auth) ── */
      .pg-user-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 5px 14px 5px 6px;
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(100, 116, 139, 0.3);
        border-radius: 100px;
        font-family: Inter, sans-serif;
        font-size: 13px;
        font-weight: 500;
        color: #94a3b8;
        cursor: default;
        white-space: nowrap;
        position: relative;
      }
      .pg-user-chip__avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
        color: #fff;
        flex-shrink: 0;
        text-transform: uppercase;
      }
      .pg-user-chip__email {
        max-width: 130px;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #cbd5e1;
        font-weight: 500;
      }
      .pg-user-chip__plan {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        padding: 2px 7px;
        border-radius: 10px;
        white-space: nowrap;
      }
      .pg-user-chip__plan--free {
        background: rgba(100, 116, 139, 0.2);
        color: #94a3b8;
      }
      .pg-user-chip__plan--pro {
        background: rgba(79, 70, 229, 0.2);
        color: #a5b4fc;
      }
      .pg-user-chip__plan--team {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
      }
      .pg-user-chip__plan--enterprise {
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
      }
      /* dropdown on hover */
      .pg-user-chip:hover .pg-user-chip__menu {
        display: flex;
      }
      .pg-user-chip__menu {
        display: none;
        flex-direction: column;
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        background: #1e293b;
        border: 1px solid rgba(100,116,139,0.3);
        border-radius: 10px;
        overflow: hidden;
        min-width: 160px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        z-index: 9999;
      }
      .pg-user-chip__menu-item {
        padding: 10px 16px;
        font-size: 13px;
        color: #94a3b8;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
        text-align: left;
        border: none;
        background: none;
        width: 100%;
        font-family: Inter, sans-serif;
        white-space: nowrap;
      }
      .pg-user-chip__menu-item:hover {
        background: rgba(255,255,255,0.05);
        color: #e2e8f0;
      }
      .pg-user-chip__menu-item--upgrade {
        color: #4ade80;
        font-weight: 600;
      }
      .pg-user-chip__menu-item--upgrade:hover {
        background: rgba(74,222,128,0.08);
        color: #86efac;
      }
      .pg-user-chip__menu-item--danger {
        color: #f87171;
      }
      .pg-user-chip__menu-item--danger:hover {
        background: rgba(248,113,113,0.08);
        color: #fca5a5;
      }

      /* ── Locked button state ── */
      .btn-locked {
        opacity: 0.38 !important;
        cursor: not-allowed !important;
        position: relative;
      }

      /* ── Locked CLI demo language tile ── */
      .cli-demo-lang--locked {
        opacity: 0.38 !important;
        cursor: not-allowed !important;
        pointer-events: none;
        position: relative;
      }
      .cli-demo-lang--locked::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: rgba(0,0,0,0.15);
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
        <div class="pg-modal-success" id="pgAuthModalSuccess" style="display:none;">
          ✅ Check your email!
        </div>
        <div class="pg-modal-free-cta" id="pgAuthModalFreeCta" style="display:none;">
          <div class="pg-modal-free-cta__icon">🦜</div>
          <h3 class="pg-modal-free-cta__title">You're all set to explore!</h3>
          <p class="pg-modal-free-cta__body">
            While you wait for your magic link, you can use <strong>Poly-Glot free</strong> right now —
            Python, JavaScript &amp; Java with doc-comments included.
          </p>
          <button class="pg-modal-free-cta__btn" id="pgAuthModalStartFree">Start Using Free →</button>
          <div class="pg-modal-free-cta__divider">or</div>
          <button class="pg-modal-free-cta__plans" id="pgAuthModalSeePlans">⭐ See Pro Plans</button>
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

    var input   = document.getElementById('pgAuthModalEmail');
    var btn     = document.getElementById('pgAuthModalSubmit');
    var form    = document.getElementById('pgAuthModalForm');
    var success = document.getElementById('pgAuthModalSuccess');

    if (!input || !input.value.trim()) return;

    var email = input.value.trim();
    btn.disabled    = true;
    btn.textContent = 'Sending…';

    fetch(AUTH_API + '/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: email })
    })
      .then(function (res) { return res.json().then(function(d){ return { httpOk: res.ok, status: res.status, data: d }; }); })
      .then(function (result) {
        // Success only if HTTP 2xx AND data.ok === true
        if (result.httpOk && result.data && result.data.ok === true) {
          // Show email confirmation
          if (form) form.style.display = 'none';
          if (success) {
            success.style.display = 'block';
            success.innerHTML = '✅ Magic link sent to <strong>' + email + '</strong>'
              + '<br><span style="font-size:12px;color:#64748b;display:block;margin-top:4px;">'
              + 'Check your inbox &amp; spam folder — link expires in 15 min.</span>';
          }
          var freeCta = document.getElementById('pgAuthModalFreeCta');
          if (freeCta) {
            freeCta.style.display = 'block';
            var startFreeBtn = document.getElementById('pgAuthModalStartFree');
            if (startFreeBtn) {
              startFreeBtn.addEventListener('click', function () {
                closeModal();
                applyPlanGating('free');
                scrollToTool();
                showToast('👋 Using Poly-Glot free — Python, JS & Java unlocked. Click your email link anytime to restore your session.');
              });
            }
            var seePlansBtn = document.getElementById('pgAuthModalSeePlans');
            if (seePlansBtn) {
              seePlansBtn.addEventListener('click', function () {
                closeModal();
                var el = document.getElementById('pg-pricing-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                if (typeof gtag === 'function') gtag('event', 'modal_see_plans_click');
              });
            }
          }
          if (typeof gtag === 'function') gtag('event', 'magic_link_sent', { method: 'email' });
        } else {
          // Worker returned an error — surface the real message
          var msg = (result.data && result.data.error)
            ? result.data.error
            : result.status === 429
              ? 'A link was already sent. Please wait 60 seconds and try again.'
              : result.status === 502
                ? 'Email delivery failed — please try again in a moment.'
                : 'Something went wrong. Please try again.';
          btn.disabled    = false;
          btn.textContent = 'Send Magic Link';
          input.style.borderColor = '#f87171';
          showAuthError(btn, msg);
          if (typeof gtag === 'function') gtag('event', 'magic_link_error', { status: result.status });
        }
      })
      .catch(function (err) {
        btn.disabled    = false;
        btn.textContent = 'Send Magic Link';
        showAuthError(btn, 'Network error — please check your connection and try again.');
        console.error('Auth login fetch error:', err);
      });
  }

  /** Show an error message below the Send button, creating the element if needed */
  function showAuthError(btn, msg) {
    var errEl = document.getElementById('pgAuthModalError');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.id = 'pgAuthModalError';
      errEl.style.cssText = 'color:#f87171;font-size:13px;margin:8px 0 0;text-align:center;';
      if (btn && btn.parentNode) btn.parentNode.insertBefore(errEl, btn.nextSibling);
      else document.body.appendChild(errEl);
    }
    errEl.textContent = msg;
    errEl.style.display = 'block';
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
        var plan  = data.plan  || 'free';
        var email = data.email || localStorage.getItem('pg_email') || '';
        _token = token;
        _plan  = plan;
        localStorage.setItem(LS_PLAN_KEY, plan);
        if (email) localStorage.setItem('pg_email', email);
        PolyGlotAuth.onPlanLoaded(plan);
        updateHeaderForUser(email, plan);
      })
      .catch(function () {
        // Token invalid — purge it
        localStorage.removeItem(LS_TOKEN_KEY);
        localStorage.removeItem(LS_PLAN_KEY);
        localStorage.removeItem('pg_email');
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
      var emailParam = params.get('email') || '';
      localStorage.setItem(LS_TOKEN_KEY, _token);
      localStorage.setItem(LS_PLAN_KEY, _plan);
      if (emailParam) localStorage.setItem('pg_email', emailParam);
      cleanUrl();
      PolyGlotAuth.onPlanLoaded(_plan);

      var storedEmail = emailParam || localStorage.getItem('pg_email') || '';
      updateHeaderForUser(storedEmail, _plan);

      if (PAID_PLANS.indexOf(_plan) !== -1) {
        var planDisplay = _plan.charAt(0).toUpperCase() + _plan.slice(1);
        showToast('🎉 Welcome! Your ' + planDisplay + ' plan is active — all languages unlocked.', 5000);
      } else {
        showToast('👋 Signed in on Free plan — Python, JS & Java available. Upgrade anytime to unlock all 12 languages.', 6000);
      }
    }
  }

  function cleanUrl() {
    var url = window.location.pathname + window.location.hash;
    history.replaceState(null, '', url);
  }

  /* ─────────────────────────────────────────────
     Plan gating
  ───────────────────────────────────────────── */
  var PAID_PLANS     = ['pro', 'team', 'enterprise'];
  var FREE_LANGUAGES = ['python', 'javascript', 'java'];

  function applyPlanGating(plan) {
    plan = (plan || '').toLowerCase();
    var isPaid = PAID_PLANS.indexOf(plan) !== -1;

    // ── Helper: lock/unlock a <select>'s options ──────────────────────
    function gateSelect(selectId, freeValues) {
      var sel = document.getElementById(selectId);
      if (!sel) return;
      var opts = sel.querySelectorAll('option');
      for (var i = 0; i < opts.length; i++) {
        var opt  = opts[i];
        var val  = opt.value.toLowerCase();
        var free = !freeValues || freeValues.indexOf(val) !== -1;
        if (isPaid) {
          opt.disabled    = false;
          opt.textContent = opt.textContent.replace(' 🔒', '').replace(' (Pro)', '');
        } else if (!free) {
          opt.disabled = true;
          if (opt.textContent.indexOf('🔒') === -1) opt.textContent += ' 🔒';
        }
      }
      // If selected option is now locked, reset to first free value
      if (!isPaid && sel.selectedOptions[0] && sel.selectedOptions[0].disabled) {
        sel.value = freeValues ? freeValues[0] : sel.querySelector('option:not([disabled])').value;
      }
    }

    // ── Helper: lock/unlock a button ─────────────────────────────────
    function gateBtn(id, lockedTitle, unlockedTitle) {
      var btn = document.getElementById(id);
      if (!btn) return;
      if (isPaid) {
        btn.disabled = false;
        btn.title    = unlockedTitle;
        btn.classList.remove('btn-locked');
        // Remove any lock badge injected previously
        var badge = btn.querySelector('.btn-pro-lock');
        if (badge) badge.parentNode.removeChild(badge);
      } else {
        btn.disabled = true;
        btn.title    = lockedTitle;
        btn.classList.add('btn-locked');
        // Inject a small 🔒 Pro badge if not already there
        if (!btn.querySelector('.btn-pro-lock')) {
          var span = document.createElement('span');
          span.className   = 'btn-pro-lock';
          span.textContent = ' 🔒';
          span.style.cssText = 'font-size:11px;opacity:0.7;';
          btn.appendChild(span);
        }
      }
    }

    // Free comment styles match the free languages
    var FREE_STYLES = ['jsdoc', 'javadoc', 'pydoc'];

    // ── 1. Main language select (#language) ──────────────────────────
    gateSelect('language', FREE_LANGUAGES);

    // ── 2. Comment Generator language select (#cgLanguage) ───────────
    gateSelect('cgLanguage', FREE_LANGUAGES);

    // ── 3. Comment Style select (#cgStyle) ───────────────────────────
    gateSelect('cgStyle', FREE_STYLES);

    // ── 4. Why Comments + Both buttons ───────────────────────────────
    gateBtn('whyBtn',
      'Why Comments — Pro plan required. See Plans ↑',
      'Add inline why-comments explaining decisions & intent (⌘⇧↵)');
    gateBtn('bothBtn',
      'Both modes — Pro plan required. See Plans ↑',
      'Add doc-comments AND why-comments in one two-pass run (⌘⌥↵)');

    // ── 5. CLI demo language select (#cliDemoLanguage) ───────────────
    gateSelect('cliDemoLanguage', FREE_LANGUAGES);

    // ── 6. CLI demo mode select (#cliDemoMode) ───────────────────────
    gateSelect('cliDemoMode', ['comment']); // why + both are Pro

    // ── 5. CLI demo language grid tiles ──────────────────────────────
    var grid = document.getElementById('cliDemoLanguageGrid');
    if (grid) {
      var tiles = grid.querySelectorAll('[data-language],[data-lang]');
      for (var t = 0; t < tiles.length; t++) {
        var tile = tiles[t];
        var tileLang = (tile.getAttribute('data-language') || tile.getAttribute('data-lang') || '').toLowerCase();
        var tileLabel = tile.querySelector('.cli-demo-lang-label') || tile;
        if (isPaid) {
          tile.classList.remove('cli-demo-lang--locked');
          tile.removeAttribute('disabled');
          tileLabel.textContent = tileLabel.textContent.replace(' 🔒', '');
        } else if (FREE_LANGUAGES.indexOf(tileLang) === -1) {
          tile.classList.add('cli-demo-lang--locked');
          if (tileLabel.textContent.indexOf('🔒') === -1) tileLabel.textContent += ' 🔒';
        }
      }
    }

    if (!isPaid) {
      // Show the nudge bar for free users (delayed slightly so page renders first)
      setTimeout(showNudgeBar, 2000);
      return;
    }

    // Paid user — hide nudge bar permanently
    hideNudgeBarForPaidUser();

    // ── Unlock download button ──
    var dlBtn = document.getElementById('cgDownloadBtn');
    if (dlBtn) {
      dlBtn.classList.remove('action-btn--paid');
      dlBtn.removeAttribute('disabled');

      var badge = dlBtn.querySelector('.paid-badge');
      if (badge) badge.parentNode.removeChild(badge);

      var freshBtn = dlBtn.cloneNode(true);
      dlBtn.parentNode.replaceChild(freshBtn, dlBtn);
      freshBtn.addEventListener('click', function () {
        triggerDownload(plan);
      });
    }

    // ── Header plan badge + hide "See Plans" button ──
    var pricingBtn = document.getElementById('headerPricingBtn');
    if (pricingBtn) {
      pricingBtn.style.display = 'none';
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
     Header user chip
  ───────────────────────────────────────────── */
  function updateHeaderForUser(email, plan) {
    plan = (plan || 'free').toLowerCase();
    var isPaid = PAID_PLANS.indexOf(plan) !== -1;

    // Replace Sign In button with user chip
    var signInBtn = document.getElementById('headerSignInBtn');
    if (!signInBtn) return;
    if (document.getElementById('pg-user-chip')) return; // already inserted

    var initial  = (email || '?').charAt(0).toUpperCase();
    var planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
    var planClass = 'pg-user-chip__plan--' + plan;

    var chip = document.createElement('div');
    chip.id        = 'pg-user-chip';
    chip.className = 'pg-user-chip';
    chip.setAttribute('role', 'button');
    chip.setAttribute('aria-label', 'Account menu');
    chip.innerHTML =
      '<div class="pg-user-chip__avatar">' + initial + '</div>' +
      '<span class="pg-user-chip__email">' + email + '</span>' +
      '<span class="pg-user-chip__plan ' + planClass + '">' + planLabel + '</span>' +
      '<div class="pg-user-chip__menu">' +
        (isPaid ? '' :
          '<button class="pg-user-chip__menu-item pg-user-chip__menu-item--upgrade" id="pg-chip-upgrade">⭐ Upgrade to Pro</button>'
        ) +
        '<button class="pg-user-chip__menu-item pg-user-chip__menu-item--danger" id="pg-chip-signout">Sign out</button>' +
      '</div>';

    signInBtn.parentNode.replaceChild(chip, signInBtn);

    // Upgrade → scroll to pricing
    var upgradeBtn = document.getElementById('pg-chip-upgrade');
    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', function () {
        var el = document.getElementById('pg-pricing-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        if (typeof gtag === 'function') gtag('event', 'chip_upgrade_click', { plan: plan });
      });
    }

    // Sign out
    document.getElementById('pg-chip-signout').addEventListener('click', function () {
      localStorage.removeItem(LS_TOKEN_KEY);
      localStorage.removeItem(LS_PLAN_KEY);
      _token = null;
      _plan  = null;
      showToast('👋 Signed out.');
      setTimeout(function () { window.location.reload(); }, 1200);
    });

    // For paid users: also hide See Plans and show plan badge
    if (isPaid) {
      var pricingBtn = document.getElementById('headerPricingBtn');
      if (pricingBtn) pricingBtn.style.display = 'none';
      if (!document.querySelector('.pg-plan-badge')) {
        var badgeEl = document.createElement('span');
        badgeEl.className = 'pg-plan-badge';
        badgeEl.textContent = '✅ ' + planLabel;
        chip.parentNode.insertBefore(badgeEl, chip);
      }
    }
  }

  /* ─────────────────────────────────────────────
     Scroll to tool helper
  ───────────────────────────────────────────── */
  function scrollToTool() {
    var el = document.getElementById('commentGenerator');
    if (!el) return;
    var rect      = el.getBoundingClientRect();
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    window.scrollTo({ top: rect.top + scrollTop - 24, behavior: 'smooth' });
  }

  /* ─────────────────────────────────────────────
     Free-user nudge bar (global, non-intrusive)
     Shown to all non-subscribed visitors.
     Dismissed permanently via localStorage.
     Hidden once user has a paid plan.
  ───────────────────────────────────────────── */
  var NUDGE_DISMISSED_KEY = 'pg_nudge_dismissed';

  function injectNudgeBarStyles() {
    var s = document.createElement('style');
    s.textContent = `
      .pg-nudge-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 9990;
        background: linear-gradient(90deg, #0d1f12 0%, #0f1f2e 50%, #0d1f12 100%);
        border-top: 1px solid rgba(52, 211, 153, 0.25);
        box-shadow: 0 -4px 24px rgba(0,0,0,0.4);
        padding: 12px 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        flex-wrap: wrap;
        animation: pg-nudge-slide-up 0.5s cubic-bezier(0.34,1.56,0.64,1);
      }
      @keyframes pg-nudge-slide-up {
        from { transform: translateY(100%); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
      }
      .pg-nudge-bar.pg-nudge-hiding {
        animation: pg-nudge-slide-down 0.3s ease forwards;
      }
      @keyframes pg-nudge-slide-down {
        to { transform: translateY(100%); opacity: 0; }
      }
      .pg-nudge-bar__text {
        font-family: Inter, sans-serif;
        font-size: 14px;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: center;
      }
      .pg-nudge-bar__text strong {
        color: #e2e8f0;
      }
      .pg-nudge-bar__cta {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 18px;
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        border: none;
        border-radius: 100px;
        cursor: pointer;
        font-family: Inter, sans-serif;
        box-shadow: 0 2px 10px rgba(34,197,94,0.35);
        transition: opacity 0.2s, transform 0.2s;
        white-space: nowrap;
      }
      .pg-nudge-bar__cta:hover { opacity: 0.88; transform: translateY(-1px); }
      .pg-nudge-bar__plans {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 18px;
        background: transparent;
        color: #a5b4fc;
        font-size: 13px;
        font-weight: 600;
        border: 1.5px solid rgba(99,102,241,0.35);
        border-radius: 100px;
        cursor: pointer;
        font-family: Inter, sans-serif;
        transition: background 0.2s;
        white-space: nowrap;
      }
      .pg-nudge-bar__plans:hover { background: rgba(79,70,229,0.15); }
      .pg-nudge-bar__dismiss {
        background: none;
        border: none;
        color: #475569;
        font-size: 18px;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: Inter, sans-serif;
        transition: color 0.2s;
        line-height: 1;
      }
      .pg-nudge-bar__dismiss:hover { color: #94a3b8; }
    `;
    document.head.appendChild(s);
  }

  function showNudgeBar() {
    // Don't show if: already dismissed, already paid, already shown
    if (localStorage.getItem(NUDGE_DISMISSED_KEY)) return;
    if (document.getElementById('pg-nudge-bar')) return;

    injectNudgeBarStyles();

    var bar = document.createElement('div');
    bar.id        = 'pg-nudge-bar';
    bar.className = 'pg-nudge-bar';
    bar.setAttribute('role', 'complementary');
    bar.innerHTML =
      '<span class="pg-nudge-bar__text">' +
        '🦜 <strong>Poly-Glot is free to use</strong> — Python, JavaScript &amp; Java with doc-comments, no account needed.' +
      '</span>' +
      '<button class="pg-nudge-bar__cta" id="pg-nudge-try">Try It Free Now ↓</button>' +
      '<button class="pg-nudge-bar__plans" id="pg-nudge-plans">⭐ See Pro Plans</button>' +
      '<button class="pg-nudge-bar__dismiss" id="pg-nudge-dismiss" aria-label="Dismiss" title="Dismiss">×</button>';

    document.body.appendChild(bar);

    // Try It Free — scroll to tool
    document.getElementById('pg-nudge-try').addEventListener('click', function () {
      dismissNudgeBar(false); // hide but don't permanently dismiss
      scrollToTool();
      if (typeof gtag === 'function') gtag('event', 'nudge_bar_try_free');
    });

    // See Pro Plans — scroll to pricing
    document.getElementById('pg-nudge-plans').addEventListener('click', function () {
      dismissNudgeBar(true);
      var el = document.getElementById('pg-pricing-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      if (typeof gtag === 'function') gtag('event', 'nudge_bar_see_plans');
    });

    // Dismiss — hide permanently
    document.getElementById('pg-nudge-dismiss').addEventListener('click', function () {
      dismissNudgeBar(true);
      if (typeof gtag === 'function') gtag('event', 'nudge_bar_dismissed');
    });
  }

  function dismissNudgeBar(permanent) {
    var bar = document.getElementById('pg-nudge-bar');
    if (!bar) return;
    if (permanent) localStorage.setItem(NUDGE_DISMISSED_KEY, '1');
    bar.classList.add('pg-nudge-hiding');
    setTimeout(function () { if (bar.parentNode) bar.parentNode.removeChild(bar); }, 320);
  }

  function hideNudgeBarForPaidUser() {
    // Called when plan resolves to paid — remove bar and mark dismissed
    var bar = document.getElementById('pg-nudge-bar');
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    localStorage.setItem(NUDGE_DISMISSED_KEY, '1');
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

    // 1. Apply free-tier locks immediately so UI is correct before auth resolves
    applyPlanGating('free');

    // 2. Check URL params first (highest priority)
    handleUrlParams();

    // 3. If no session came from URL, try localStorage token
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
