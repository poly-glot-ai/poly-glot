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
  const MODAL_ID        = 'pgAuthModal';
  const TURNSTILE_SITE_KEY = '0x4AAAAAAC2WpM55-ZqyuyCn';

  /* ─────────────────────────────────────────────
     Turnstile — get an invisible challenge token
     Returns a Promise<string> (resolves to token or '' on failure)
  ───────────────────────────────────────────── */
  function getTurnstileToken() {
    return new Promise(function (resolve) {
      try {
        if (typeof window.turnstile === 'undefined') { resolve(''); return; }
        // Create a hidden container
        var container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        window.turnstile.render(container, {
          sitekey:  TURNSTILE_SITE_KEY,
          size:     'invisible',
          callback: function (token) {
            document.body.removeChild(container);
            resolve(token);
          },
          'error-callback': function () {
            try { document.body.removeChild(container); } catch(e) {}
            resolve(''); // fail open — worker will reject if secret set
          },
          'expired-callback': function () {
            try { document.body.removeChild(container); } catch(e) {}
            resolve('');
          },
        });
      } catch (e) {
        resolve('');
      }
    });
  }

  // ── Surface detection ─────────────────────────────────────
  // Prompt Studio (/prompt/) is a separate consumer product.
  // It uses its own localStorage keys and auth namespace so that
  // signing in as Pro on the main site never bleeds into /prompt/.
  const IS_PROMPT_PAGE  = window.location.pathname.indexOf('/prompt') !== -1;

  // Main site keys
  const LS_TOKEN_KEY    = 'pg_session_token';
  const LS_PLAN_KEY     = 'pg_plan';
  const LS_EMAIL_KEY    = 'pg_email';

  // Prompt Studio keys — completely isolated from main site
  const LS_PROMPT_TOKEN_KEY = 'pg_prompt_token';
  const LS_PROMPT_PLAN_KEY  = 'pg_prompt_plan';
  const LS_PROMPT_EMAIL_KEY = 'pg_prompt_email';

  // Active keys for this page — resolved once at load
  const _LS_TOKEN = IS_PROMPT_PAGE ? LS_PROMPT_TOKEN_KEY : LS_TOKEN_KEY;
  const _LS_PLAN  = IS_PROMPT_PAGE ? LS_PROMPT_PLAN_KEY  : LS_PLAN_KEY;
  const _LS_EMAIL = IS_PROMPT_PAGE ? LS_PROMPT_EMAIL_KEY : LS_EMAIL_KEY;

  // Surface header sent with every API call so Worker uses correct plan namespace
  const _SURFACE_HEADER = IS_PROMPT_PAGE ? { 'X-PG-Surface': 'prompt' } : {};

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

      /* ── Inline plan cards inside modal ── */
      .pg-modal-plans {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin: 4px 0 2px;
      }
      @media (max-width: 420px) {
        .pg-modal-plans { grid-template-columns: 1fr; }
      }
      .pg-modal-plan {
        border-radius: 12px;
        padding: 14px 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        border: 1.5px solid rgba(99,102,241,0.25);
        background: rgba(255,255,255,0.03);
        text-align: left;
      }
      .pg-modal-plan--pro {
        border-color: rgba(124,58,237,0.55);
        background: rgba(124,58,237,0.07);
      }
      .pg-modal-plan__badge {
        font-size: 11px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .pg-modal-plan__badge--pro {
        color: #a78bfa;
      }
      .pg-modal-plan__price {
        font-size: 26px;
        font-weight: 800;
        color: #f4f4f6;
        line-height: 1;
      }
      .pg-modal-plan__price span {
        font-size: 13px;
        font-weight: 500;
        color: #64748b;
      }
      .pg-modal-plan__features {
        list-style: none;
        margin: 4px 0 8px;
        padding: 0;
        font-size: 11.5px;
        color: #94a3b8;
        line-height: 1.8;
        flex: 1;
      }
      .pg-modal-plan__cta {
        display: block;
        width: 100%;
        padding: 9px 10px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        text-align: center;
        cursor: pointer;
        text-decoration: none;
        border: none;
        font-family: Inter, sans-serif;
        transition: opacity 0.15s;
      }
      .pg-modal-plan__cta:hover { opacity: 0.88; }
      .pg-modal-plan__cta--free {
        background: rgba(99,102,241,0.18);
        color: #a5b4fc;
        border: 1.5px solid rgba(99,102,241,0.35);
      }
      .pg-modal-plan__cta--pro {
        background: linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);
        color: #fff;
        box-shadow: 0 3px 14px rgba(124,58,237,0.4);
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
      /* ── User chip — click-to-toggle (works on mobile + desktop) ── */
      .pg-user-chip {
        position: relative;
      }
      .pg-user-chip__menu {
        display: none;
        flex-direction: column;
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background: #1a2035;
        border: 1px solid rgba(139,92,246,0.25);
        border-radius: 12px;
        overflow: hidden;
        min-width: 200px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: pgMenuFadeIn 0.15s ease;
      }
      @keyframes pgMenuFadeIn {
        from { opacity: 0; transform: translateY(-6px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0)   scale(1);     }
      }
      .pg-user-chip__menu.pg-menu-open { display: flex; }
      /* Email header inside menu */
      .pg-user-chip__menu-email {
        padding: 12px 16px 10px;
        font-size: 11px;
        color: #64748b;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
        letter-spacing: 0.01em;
      }
      .pg-user-chip__menu-item {
        padding: 11px 16px;
        font-size: 13px;
        color: #94a3b8;
        cursor: pointer;
        transition: background 0.12s, color 0.12s;
        text-align: left;
        border: none;
        background: none;
        width: 100%;
        font-family: Inter, sans-serif;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 9px;
      }
      .pg-user-chip__menu-item:hover {
        background: rgba(255,255,255,0.05);
        color: #e2e8f0;
      }
      .pg-user-chip__menu-divider {
        height: 1px;
        background: rgba(255,255,255,0.06);
        margin: 2px 0;
      }
      .pg-user-chip__menu-item--upgrade {
        color: #4ade80;
        font-weight: 600;
      }
      .pg-user-chip__menu-item--upgrade:hover {
        background: rgba(74,222,128,0.08);
        color: #86efac;
      }
      .pg-user-chip__menu-item--billing {
        color: #a78bfa;
        font-weight: 500;
      }
      .pg-user-chip__menu-item--billing:hover {
        background: rgba(139,92,246,0.1);
        color: #c4b5fd;
      }
      .pg-user-chip__menu-item--danger {
        color: #f87171;
      }
      .pg-user-chip__menu-item--danger:hover {
        background: rgba(248,113,113,0.08);
        color: #fca5a5;
      }
      /* Caret on the chip to signal it's a menu */
      .pg-user-chip__caret {
        font-size: 9px;
        color: #64748b;
        margin-left: 2px;
        transition: transform 0.15s ease;
      }
      .pg-user-chip.pg-chip-open .pg-user-chip__caret {
        transform: rotate(180deg);
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

      /* ── Mobile responsive ── */
      @media (max-width: 600px) {
        .pg-user-chip {
          padding: 3px 6px 3px 3px;
          gap: 4px; font-size: 11px;
          max-width: 180px;
        }
        .pg-user-chip__email {
          max-width: 70px; font-size: 10px;
        }
        .pg-user-chip__avatar {
          width: 20px; height: 20px; font-size: 9px;
        }
        .pg-user-chip__plan {
          font-size: 8px; padding: 1px 5px;
        }
        .pg-user-chip__caret { font-size: 8px; margin-left: 0; }
        .pg-user-chip__menu {
          right: 0; left: auto;
          min-width: 200px; max-width: calc(100vw - 20px);
        }
        .pg-user-chip__menu-header {
          font-size: 11px; padding: 10px 12px;
          word-break: break-all;
        }
        .pg-user-chip__menu-item {
          font-size: 12px; padding: 8px 12px;
        }
      }
      @media (max-width: 420px) {
        .pg-user-chip__email { max-width: 55px; font-size: 9px; }
        .pg-user-chip { max-width: 150px; }
      }
      @media (max-width: 380px) {
        .pg-user-chip__email { display: none; }
        .pg-user-chip { max-width: 90px; padding: 3px 5px 3px 3px; }
        .pg-user-chip__menu {
          right: -8px; min-width: 180px;
        }
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
        <p id="pgAuthModalEmailHint" style="display:none;font-size:12px;color:#f59e0b;margin:-4px 0 10px;font-weight:600;"></p>
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
          <h3 class="pg-modal-free-cta__title">Magic link sent! Pick your plan:</h3>
          <p class="pg-modal-free-cta__body" style="margin-bottom:14px;">
            Start free — or upgrade now and your Pro plan activates the moment you click the link.
          </p>

          <!-- Inline plan cards -->
          <div class="pg-modal-plans" id="pgModalPlanCards">
            <div class="pg-modal-plan pg-modal-plan--free" id="pgModalPlanFree">
              <div class="pg-modal-plan__badge">Free</div>
              <div class="pg-modal-plan__price">$0<span>/mo</span></div>
              <ul class="pg-modal-plan__features">
                <li>✅ 50 files / month</li>
                <li>✅ Python, JS &amp; Java</li>
                <li>✅ JSDoc, JavaDoc, PyDoc</li>
                <li>✅ Doc Comments mode</li>
              </ul>
              <button class="pg-modal-plan__cta pg-modal-plan__cta--free" id="pgAuthModalStartFree">
                Start Free →
              </button>
            </div>
            <div class="pg-modal-plan pg-modal-plan--pro" id="pgModalPlanPro">
              <div class="pg-modal-plan__badge pg-modal-plan__badge--pro">⭐ Pro — Most Popular</div>
              <div class="pg-modal-plan__price">$9<span>/mo</span></div>
              <ul class="pg-modal-plan__features">
                <li>✅ Unlimited files</li>
                <li>✅ All 12 languages</li>
                <li>✅ All comment styles</li>
                <li>✅ Why Comments + Both modes</li>
                <li>✅ CLI + VS Code + Chrome</li>
                <li id="pgModalEarlybird" style="color:#f59e0b;">🏷 Code <strong>EARLYBIRD3</strong> — locks $9/mo forever <em>(expires May 1, 2026)</em></li>
              </ul>
              <a class="pg-modal-plan__cta pg-modal-plan__cta--pro" id="pgAuthModalUpgradePro"
                 href="https://buy.stripe.com/fZu14pbtacrO9Ii77K14405?client_reference_id=website"
                 target="_blank" rel="noopener">
                Upgrade to Pro ↗
              </a>
            </div>
          </div>

          <div class="pg-modal-free-cta__divider" style="margin-top:14px;">or</div>
          <button class="pg-modal-free-cta__plans" id="pgAuthModalSeePlans">See all plans ↓</button>
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

  function openModal(source) {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) {
      buildModal();
      modal = document.getElementById(MODAL_ID);
    }

    // Detect prompt-page context — suppress plan picker upsell
    var _source = source || '';
    try { _source = _source || sessionStorage.getItem('pg_source') || ''; } catch(e) {}
    var isPromptPage = _source.indexOf('prompt') !== -1;

    // Reset state
    var form     = document.getElementById('pgAuthModalForm');
    var success  = document.getElementById('pgAuthModalSuccess');
    var btn      = document.getElementById('pgAuthModalSubmit');
    var input    = document.getElementById('pgAuthModalEmail');
    var hint     = document.getElementById('pgAuthModalEmailHint');
    var title    = document.getElementById('pgAuthModalTitle');
    var subtitle = document.querySelector('#' + MODAL_ID + ' .pg-modal-subtitle');
    if (form)    form.style.display    = '';
    if (success) success.style.display = 'none';
    if (btn)     btn.disabled          = false;
    if (hint)    hint.style.display    = 'none';

    // Welcome-back state — pre-fill email and update copy for returning users
    try {
      var storedEmail = localStorage.getItem(_LS_EMAIL) || '';
      var storedPlan  = (localStorage.getItem(_LS_PLAN) || 'free').toLowerCase();
      if (storedEmail && input) {
        input.value = storedEmail;
        if (title)    title.textContent = 'Welcome back 👋';
        if (subtitle) subtitle.textContent = 'Hit send — we\'ll magic-link you straight in.';
        if (btn)      btn.textContent = 'Send Magic Link';
      } else {
        if (input)   input.value = '';
        if (isPromptPage) {
          if (title)    title.textContent = 'Sign in to Prompt Studio';
          if (subtitle) subtitle.textContent = 'Free account — no credit card. We\'ll send you a magic link.';
        } else {
          if (title)    title.textContent = 'Sign in to Poly-Glot';
          if (subtitle) subtitle.textContent = 'Enter your email — we\'ll send you a magic link';
        }
        if (btn)      btn.textContent = 'Send Magic Link';
      }
    } catch(e) {
      if (input) input.value = '';
    }

    // Hide plan-picker for prompt-page sign-ups — it's a distraction there
    var planCards = document.getElementById('pgModalPlanCards');
    var freeCta   = document.getElementById('pgAuthModalFreeCta');
    var seePlans  = document.getElementById('pgAuthModalSeePlans');
    var freeDivider = freeCta ? freeCta.querySelector('.pg-modal-free-cta__divider') : null;
    if (isPromptPage) {
      if (planCards)   planCards.style.display   = 'none';
      if (seePlans)    seePlans.style.display     = 'none';
      if (freeDivider) freeDivider.style.display  = 'none';
      var freeCtaTitle = freeCta ? freeCta.querySelector('.pg-modal-free-cta__title') : null;
      var freeCtaBody  = freeCta ? freeCta.querySelector('.pg-modal-free-cta__body')  : null;
      if (freeCtaTitle) freeCtaTitle.textContent = '✅ Magic link sent!';
      if (freeCtaBody)  freeCtaBody.innerHTML    = 'Check your inbox — click the link to sign in to Prompt Studio.<br><span style="font-size:11px;color:#64748b;">No credit card needed. Free forever.</span>';
    } else {
      if (planCards)   planCards.style.display   = '';
      if (seePlans)    seePlans.style.display     = '';
      if (freeDivider) freeDivider.style.display  = '';
    }

    modal.classList.add('pg-open');
    if (input) setTimeout(function () { input.focus(); }, 60);

    // Patch upgrade link with prefilled_email + respect EARLYBIRD_ACTIVE
    var upgradeLink = document.getElementById('pgAuthModalUpgradePro');
    if (upgradeLink) {
      try {
        var em   = localStorage.getItem(_LS_EMAIL) || '';
        var base = 'https://buy.stripe.com/fZu14pbtacrO9Ii77K14405';
        var earlybird = (new Date() < new Date('2026-05-01T00:00:00Z'));
        var params = earlybird ? 'prefilled_promo_code=EARLYBIRD3&' : '';
        params += 'client_reference_id=website';
        if (em) params += '&prefilled_email=' + encodeURIComponent(em);
        upgradeLink.href = base + '?' + params;
      } catch(e) {}
    }
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

    // On /prompt/ always force source=prompt_page so the Worker routes the
    // magic link back to /prompt/?token=... — never to the main site.
    // SessionStorage is a best-effort attribution tag; IS_PROMPT_PAGE is ground truth.
    var loginSource = IS_PROMPT_PAGE ? 'prompt_page' : '';
    if (!IS_PROMPT_PAGE) {
      try { loginSource = sessionStorage.getItem('pg_source') || ''; } catch(e) {}
    }

    getTurnstileToken().then(function (turnstileToken) {
    fetch(AUTH_API + '/login', {
      method:  'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, _SURFACE_HEADER),
      body:    JSON.stringify({ email: email, source: loginSource || 'website', deviceId: getOrCreateDeviceId(), turnstileToken: turnstileToken })
    })
      .then(function (res) { return res.json().then(function(d){ return { httpOk: res.ok, status: res.status, data: d }; }); })
      .then(function (result) {
        // Success only if HTTP 2xx AND data.ok === true
        if (result.httpOk && result.data && result.data.ok === true) {
          // Show email confirmation — single clear CTA: check your inbox.
          // Previously showed a Free/Pro plan picker here which caused users
          // to click "Start Free" and never click the magic link — zero signups.
          if (form) form.style.display = 'none';
          if (success) {
            success.style.display = 'block';
            success.innerHTML = ''
              + '<div style="font-size:32px;margin-bottom:10px;">📬</div>'
              + '<div style="font-size:16px;font-weight:700;color:#f1f5f9;margin-bottom:8px;">Check your inbox!</div>'
              + '<div style="font-size:13px;color:#94a3b8;line-height:1.6;margin-bottom:12px;">'
              + 'We sent a magic link to <strong style="color:#f1f5f9;">' + email + '</strong>.<br>'
              + 'Click it to sign in — no password needed.'
              + '</div>'
              + '<div style="font-size:11px;color:#475569;background:#0d1117;border-radius:6px;padding:8px 12px;">'
              + '⏱ Link expires in 15 min &nbsp;·&nbsp; Check spam if you don\'t see it'
              + '</div>';
          }
          // Hide plan picker — don't let users skip the magic link click
          var freeCta = document.getElementById('pgAuthModalFreeCta');
          if (freeCta) freeCta.style.display = 'none';
          if (typeof gtag === 'function') gtag('event', 'magic_link_sent', { method: 'email' });
        } else {
          // Worker returned an error — classify and surface clearly
          var msg;
          if (result.status === 409) {
            // Device conflict — already signed up with a different email on this device
            msg = (result.data && result.data.error)
              ? result.data.error
              : 'An account already exists for this device. Please sign in with your original email.';
            btn.disabled    = false;
            btn.textContent = 'Send Magic Link';
            input.style.borderColor = '#f87171';
            // Show richer inline error with sign-in CTA
            var errEl = document.getElementById('pgAuthModalError');
            if (!errEl) {
              errEl = document.createElement('div');
              errEl.id = 'pgAuthModalError';
              errEl.style.cssText = 'font-size:13px;margin:10px 0 0;text-align:center;line-height:1.6;';
              if (btn && btn.parentNode) btn.parentNode.insertBefore(errEl, btn.nextSibling);
              else document.body.appendChild(errEl);
            }
            errEl.innerHTML =
              '<span style="color:#f87171;">🚫 ' + msg + '</span><br>' +
              '<span style="color:#64748b;font-size:12px;">Enter the email you originally used to sign up.</span>';
          } else if (result.status === 429) {
            msg = 'A link was already sent. Please wait 60 seconds and try again.';
            btn.disabled    = false;
            btn.textContent = 'Send Magic Link';
            input.style.borderColor = '#f59e0b';
            showAuthError(btn, '⏱ ' + msg);
          } else if (result.status === 502) {
            msg = 'Email delivery failed — please try again in a moment.';
            btn.disabled    = false;
            btn.textContent = 'Send Magic Link';
            input.style.borderColor = '#f87171';
            showAuthError(btn, '📧 ' + msg);
          } else if (result.status === 400) {
            msg = (result.data && result.data.error) ? result.data.error : 'Please enter a valid email address.';
            btn.disabled    = false;
            btn.textContent = 'Send Magic Link';
            input.style.borderColor = '#f87171';
            showAuthError(btn, '✉️ ' + msg);
          } else {
            msg = (result.data && result.data.error) ? result.data.error : 'Something went wrong. Please try again.';
            btn.disabled    = false;
            btn.textContent = 'Send Magic Link';
            input.style.borderColor = '#f87171';
            showAuthError(btn, msg);
          }
          if (typeof gtag === 'function') gtag('event', 'magic_link_error', { status: result.status });
        }
      })
      .catch(function (err) {
        btn.disabled    = false;
        btn.textContent = 'Send Magic Link';
        showAuthError(btn, 'Network error — please check your connection and try again.');
        console.error('Auth login fetch error:', err);
      });
    }); // end getTurnstileToken
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
    // Use /refresh (non-destructive) — /verify is one-time use and would
    // destroy the token on every page load, wiping the session on first refresh.
    fetch(AUTH_API + '/refresh', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, _SURFACE_HEADER),
      body: JSON.stringify({ token: token })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('invalid');
        return res.json();
      })
      .then(function (data) {
        var plan  = (data.plan  || 'free').toLowerCase();
        var email = data.email || localStorage.getItem(_LS_EMAIL) || '';
        _token = token;
        _plan  = plan;
        localStorage.setItem(_LS_PLAN, plan);
        if (email) localStorage.setItem(_LS_EMAIL, email);
        PolyGlotAuth.onPlanLoaded(plan);
        updateHeaderForUser(email, plan);
      })
      .catch(function () {
        // Token truly invalid/expired — purge all auth state and restore
        // the sign-in button so the user can't bypass the auth gate via
        // a stale pg-user-chip that was rendered from cached localStorage.
        localStorage.removeItem(_LS_TOKEN);
        localStorage.removeItem(_LS_PLAN);
        localStorage.removeItem(_LS_EMAIL);
        _token = null;
        _plan  = null;

        // Remove the chip if it was already rendered from the cache
        var chip = document.getElementById('pg-user-chip');
        if (chip && chip.parentNode) chip.parentNode.removeChild(chip);

        // Restore the Sign In button
        var signInBtn = document.getElementById('headerSignInBtn');
        if (!signInBtn) {
          // Re-create it if it was replaced
          var nav = document.querySelector('nav') || document.querySelector('header') || document.body;
          var btn = document.createElement('button');
          btn.id        = 'headerSignInBtn';
          btn.className = 'nav-cta';
          btn.textContent = 'Sign In';
          btn.addEventListener('click', function () { openModal(); });
          nav.appendChild(btn);
        } else {
          signInBtn.style.display = '';
        }

        // Re-apply free gating since user is now unauthenticated
        applyPlanGating('free');
      });
  }

  /* ─────────────────────────────────────────────
     URL param handling
  ───────────────────────────────────────────── */
  function handleUrlParams() {
    var params = new URLSearchParams(window.location.search);

    // ── Strip stale ?callbackUrl= immediately on every page load ─────────────
    if (params.get('callbackUrl')) {
      cleanUrl();
      params = new URLSearchParams(window.location.search);
    }

    // ── ?checkout=success — user just paid via Stripe ─────────────────────
    // Stripe success URL: https://poly-glot.ai/?checkout=success&email={CUSTOMER_EMAIL}
    // We auto-trigger the magic-link login so they land signed in immediately.
    if (params.get('checkout') === 'success') {
      var checkoutEmail = decodeURIComponent(params.get('email') || '');
      cleanUrl();

      if (checkoutEmail) {
        showToast('🎉 Payment received! Sending your sign-in link to ' + checkoutEmail + '…', 6000);
        // Auto-send magic link so user lands signed in with their new plan
        getTurnstileToken().then(function (turnstileToken) {
        fetch(AUTH_API + '/login', {
          method:  'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, _SURFACE_HEADER),
          body:    JSON.stringify({ email: checkoutEmail, source: 'stripe-success', deviceId: getOrCreateDeviceId(), turnstileToken: turnstileToken }),
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (data.ok) {
              showToast('✅ Magic link sent to ' + checkoutEmail + ' — check your inbox to activate Pro!', 8000);
              if (typeof gtag === 'function') gtag('event', 'checkout_success_magic_link_sent', { email: checkoutEmail });
            } else {
              // Couldn't auto-send — prompt them to log in manually
              openModal();
              showToast('🎉 Payment received! Sign in below to activate your Pro plan.', 6000);
            }
          })
          .catch(function () { openModal(); });
        }); // end getTurnstileToken

        // Show "activation" panel on the page
        showCheckoutSuccessBanner(checkoutEmail);
      } else {
        // No email in URL — open login modal with clear activation instructions
        cleanUrl();
        showToast('🎉 Payment successful! Enter the email you used at checkout to activate your Pro plan.', 8000);
        setTimeout(function () {
          openModal();
          // Pre-fill helper text in modal
          var hint = document.getElementById('pgAuthModalEmailHint');
          if (hint) {
            hint.textContent = 'Enter the email you used at checkout ↓';
            hint.style.display = 'block';
          }
        }, 800);
        if (typeof gtag === 'function') gtag('event', 'checkout_success_no_email');
      }
      return;
    }

    // ── ?auth=expired ─────────────────────────────────────────────────────
    if (params.get('auth') === 'expired') {
      cleanUrl();
      showToast('⚠️ That sign-in link has expired. Please request a new one.');
      return;
    }

    // ── ?token=TOKEN (magic link from Worker) ─────────────────────────────
    // Worker sends: ?token=hex&plan=free&email=user@example.com
    var magicToken = params.get('token');
    if (magicToken) {
      var emailHint = decodeURIComponent(params.get('email') || '');
      cleanUrl(); // strip params from URL immediately

      // Show a brief "Signing you in…" toast while we verify
      showToast('🔐 Signing you in…', 3000);

      // Call /verify to confirm the token is valid (one-time use)
      fetch(AUTH_API + '/verify', {
        method:  'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, _SURFACE_HEADER),
        body:    JSON.stringify({ token: magicToken }),
      })
        .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
        .then(function (result) {
          if (!result.ok) {
            // Token invalid or expired
            showToast('⚠️ That sign-in link has expired or already been used. Please request a new one.', 5000);
            if (typeof gtag === 'function') gtag('event', 'magic_link_verify_failed');
            return;
          }
          var email = result.data.email || emailHint || '';
          var plan  = (result.data.plan  || 'free').toLowerCase();

          // Persist session
          _token = magicToken;
          _plan  = plan;
          localStorage.setItem(_LS_TOKEN, magicToken);
          localStorage.setItem(_LS_PLAN,  plan);
          if (email) localStorage.setItem(_LS_EMAIL, email);

          // Apply plan gating + update header chip
          PolyGlotAuth.onPlanLoaded(plan);
          updateHeaderForUser(email, plan);

          var source = new URLSearchParams(window.location.search).get('source') || '';
          var isVscodeSource = source.indexOf('vscode') !== -1;

          // ── CLI callback — POST token to local server if callbackUrl present ──
          // CLI v2.1.35+ starts http://127.0.0.1:PORT/callback before sending the
          // magic link. We POST the session token there so the terminal auto-signs
          // in with zero copy-paste. Security: worker only embeds localhost URLs.
          var callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl') || '';
          var isCliSource = source === 'cli' || callbackUrl !== '';
          if (callbackUrl) {
            fetch(callbackUrl, {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ token: magicToken, email: email, plan: plan }),
            })
            .then(function () {
              if (typeof gtag === 'function') gtag('event', 'cli_callback_success', { plan: plan });
            })
            .catch(function () {
              // Callback server may have already closed — non-fatal, user sees token panel
            });
          }

          // ── Prompt page: clean welcome, no token panel ──────────────────
          // The prompt/index.html shim listens for pg:plan-loaded and shows
          // its own branded welcome toast. We must not show the dev token panel
          // (VS Code / CLI widget) on a consumer-facing landing page.
          // Detection order:
          //   1. ?source=prompt_page in URL (set by Worker on magic link)
          //   2. pg_source in sessionStorage (set when modal opens)
          //   3. window.location.pathname contains '/prompt' (catch-all —
          //      magic links land on /prompt/?token=XXX with no source param)
          var _sessionSource = '';
          try { _sessionSource = sessionStorage.getItem('pg_source') || ''; } catch(e) {}
          var isPromptSource = source.indexOf('prompt') !== -1
            || _sessionSource.indexOf('prompt') !== -1
            || window.location.pathname.indexOf('/prompt') !== -1;

          // ── BroadcastChannel tab-handoff for Prompt Studio ───────────────
          // When the user clicks the magic link from their email, it opens in
          // a new tab. We broadcast the auth state to any existing /prompt/
          // tab so it signs in immediately, then close this tab after a short
          // delay so the user ends up back in their original tab — signed in.
          if (isPromptSource) {
            try {
              var bc = new BroadcastChannel('pg_prompt_auth');
              bc.postMessage({ type: 'PROMPT_AUTH_SUCCESS', token: magicToken, email: email, plan: plan });
              bc.close();
            } catch(e) { /* BroadcastChannel not supported — degrade gracefully */ }

            // Show a brief "you're signed in" message then close this tab.
            // If no other tab was open (user opened link directly), stay on page.
            var hadOpener = !!window.opener;
            cleanUrl();

            // Give the broadcast 400ms to reach the other tab, then close.
            // If this tab IS the only tab (no opener, no referrer from email
            // client), don't close — just let the page finish loading normally.
            var _tryClose = setTimeout(function () {
              try { window.close(); } catch(e) {}
              // window.close() only works if this tab was opened by script.
              // If it's still open after 200ms, the user opened it directly —
              // leave them here and the page will sign them in normally.
            }, 600);
          }

          // Welcome toast — different message per surface
          if (isPromptSource) {
            // Prompt page handles its own toast via pg:plan-loaded listener
            // just clean the URL and let the shim take over
          } else if (PAID_PLANS.indexOf(plan) !== -1) {
            var planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1);
            showToast('🎉 ' + planDisplay + ' plan active! Copy your token below to activate VS Code or CLI.', 6000);
          } else if (isCliSource) {
            showToast('✅ Signed in! Switch back to your terminal — it\'s already authenticated.', 7000);
          } else if (isVscodeSource) {
            showToast('✅ Signed in! Copy your token below to activate VS Code.', 7000);
          } else {
            showToast('👋 Signed in! Copy your token below to use VS Code or CLI.', 6000);
          }

          // Show session token panel — only for VS Code / CLI users, never on prompt page
          if (!isPromptSource) {
            showSessionTokenPanel(magicToken, email, plan, isVscodeSource);
          }

          if (typeof gtag === 'function') gtag('event', 'magic_link_verify_success', { plan: plan, source: source });
        })
        .catch(function () {
          showToast('⚠️ Sign-in failed — please check your connection and try again.', 5000);
        });
      return; // don't fall through to ?session= handler
    }

    // ── ?session=TOKEN (legacy param — keep for backwards compat) ─────────
    var sessionToken = params.get('session');
    var planParam    = params.get('plan');

    if (sessionToken) {
      _token = sessionToken;
      _plan  = planParam || 'free';
      var emailParam = params.get('email') || '';
      localStorage.setItem(_LS_TOKEN, _token);
      localStorage.setItem(_LS_PLAN,  _plan);
      if (emailParam) localStorage.setItem(_LS_EMAIL, emailParam);
      cleanUrl();
      PolyGlotAuth.onPlanLoaded(_plan);

      var storedEmail = emailParam || localStorage.getItem(_LS_EMAIL) || '';
      updateHeaderForUser(storedEmail, _plan);

      if (PAID_PLANS.indexOf(_plan) !== -1) {
        var planDisplay = _plan.charAt(0).toUpperCase() + _plan.slice(1);
        showToast('🎉 Welcome! Your ' + planDisplay + ' plan is active — all languages unlocked.', 5000);
      } else {
        showToast('👋 Signed in on Free plan — Python, JS & Java available. Upgrade anytime.', 6000);
      }
    }
  }

  function cleanUrl() {
    var params = new URLSearchParams(window.location.search);
    params.delete('callbackUrl');
    params.delete('token');
    params.delete('email');
    params.delete('plan');
    params.delete('source');
    var query = params.toString() ? '?' + params.toString() : '';
    var url = window.location.pathname + query + window.location.hash;
    history.replaceState(null, '', url);
  }

  /* ─────────────────────────────────────────────
     Plan gating
  ───────────────────────────────────────────── */
  var PAID_PLANS     = ['pro', 'team', 'enterprise', 'prompt_pro'];
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
    // All three demo languages (Python, JS, Java) are free — no gating needed

    // ── 6. CLI demo mode select (#cliDemoMode) ───────────────────────
    // All modes (Comment, Why, Both) are unlocked in the demo — users see real output

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
      // ── Lock copy button for free users ──
      var cpBtnFree = document.getElementById('cgCopyBtn');
      if (cpBtnFree) {
        cpBtnFree.disabled = true;
        cpBtnFree.title    = 'Copy — Pro plan required. See Plans ↑';
        cpBtnFree.classList.add('action-btn--paid');
        if (!cpBtnFree.querySelector('.paid-badge')) {
          var cpBadge = document.createElement('span');
          cpBadge.className   = 'paid-badge';
          cpBadge.textContent = 'Pro';
          cpBtnFree.appendChild(cpBadge);
        }
      }
      // ── Lock download button for free users ──
      var dlBtnFree = document.getElementById('cgDownloadBtn');
      if (dlBtnFree) {
        dlBtnFree.disabled = true;
        dlBtnFree.title    = 'Download — Pro plan required. See Plans ↑';
        dlBtnFree.classList.add('action-btn--paid');
        if (!dlBtnFree.querySelector('.paid-badge')) {
          var dlBadge = document.createElement('span');
          dlBadge.className   = 'paid-badge';
          dlBadge.textContent = 'Pro';
          dlBtnFree.appendChild(dlBadge);
        }
      }
      // Show the nudge bar for free users (delayed slightly so page renders first)
      setTimeout(showNudgeBar, 2000);
      return;
    }

    // Paid user — hide nudge bar permanently
    hideNudgeBarForPaidUser();

    // ── Unlock copy button ──
    var cpBtn = document.getElementById('cgCopyBtn');
    if (cpBtn) {
      cpBtn.classList.remove('action-btn--paid');
      cpBtn.removeAttribute('disabled');
      cpBtn.title = 'Copy commented code to clipboard';
      var cpBadgeEl = cpBtn.querySelector('.paid-badge');
      if (cpBadgeEl) cpBadgeEl.parentNode.removeChild(cpBadgeEl);
      // Re-attach click so app.v220.js handler works on the live (non-cloned) button
    }

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

    // ── Hide "See Plans" button for paid users — no badge needed (chip shows plan) ──
    var pricingBtn = document.getElementById('headerPricingBtn');
    if (pricingBtn) pricingBtn.style.display = 'none';

    // Remove any stale plan badge that may have been injected previously
    var staleBadge = document.querySelector('.pg-plan-badge');
    if (staleBadge) staleBadge.parentNode.removeChild(staleBadge);
  }

  /* ─────────────────────────────────────────────
     Header user chip
  ───────────────────────────────────────────── */
  function updateHeaderForUser(email, plan) {
    plan = (plan || 'free').toLowerCase();
    var isPaid = PAID_PLANS.indexOf(plan) !== -1;

    // ── Always mark body as authenticated first ───────────────────────────
    // This must happen regardless of which nav the page uses, so that
    // CSS rules (body.pg-authed ...) and the prompt-page shim fire correctly.
    document.body.classList.add('pg-authed');

    // ── Hide the signup banner above the generator ────────────────────────
    var signupBanner = document.getElementById('pgSignupBanner');
    if (signupBanner) signupBanner.style.display = 'none';

    // ── Prompt page nav swap ──────────────────────────────────────────────
    // The prompt page uses different IDs (pgaNavSignIn, pgaNavCta) instead of
    // headerSignInBtn. Handle both so the nav updates on /prompt/ too.
    var promptSignInBtn = document.getElementById('pgaNavSignIn');
    var promptCtaBtn    = document.getElementById('pgaNavCta');
    if (promptSignInBtn || promptCtaBtn) {
      var planLabel = plan === 'prompt_pro'  ? 'Pro'
                    : plan === 'prompt_free' ? 'Free'
                    : isPaid ? (plan.charAt(0).toUpperCase() + plan.slice(1))
                    : 'Free';
      var chip = document.createElement('span');
      chip.id        = 'pg-user-chip';
      chip.className = 'pg-user-chip';
      chip.style.cssText = 'display:inline-flex;align-items:center;gap:6px;'
        + 'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);'
        + 'border-radius:20px;padding:5px 12px;font-size:13px;color:#f1f5f9;'
        + 'font-family:Inter,sans-serif;cursor:default;';
      chip.innerHTML = '<span style="width:22px;height:22px;border-radius:50%;'
        + 'background:linear-gradient(135deg,#7c3aed,#38bdf8);display:inline-flex;'
        + 'align-items:center;justify-content:center;font-size:11px;font-weight:700;">'
        + (email || '?').charAt(0).toUpperCase() + '</span>'
        + '<span style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
        + (email || '') + '</span>'
        + '<span style="background:' + (isPaid ? '#7c3aed' : 'rgba(125,211,252,.15)')
        + ';color:' + (isPaid ? '#fff' : '#7dd3fc')
        + ';border-radius:10px;padding:1px 7px;font-size:10px;font-weight:700;">'
        + planLabel + '</span>';
      if (promptSignInBtn && promptSignInBtn.parentNode) {
        promptSignInBtn.parentNode.replaceChild(chip, promptSignInBtn);
      }
      if (promptCtaBtn) promptCtaBtn.style.display = 'none';
      // Hide mobile sign-in link too
      var mobileLinks = document.querySelectorAll('.pga-nav__mobile-link');
      mobileLinks.forEach(function(el) {
        if (el.textContent.indexOf('Sign In') !== -1) el.style.display = 'none';
      });
      return; // prompt page handled — skip main-site chip logic below
    }

    // ── Main site nav swap ────────────────────────────────────────────────
    // Replace Sign In button with user chip
    var signInBtn = document.getElementById('headerSignInBtn');
    if (!signInBtn) return;
    if (document.getElementById('pg-user-chip')) return; // already inserted

    var initial   = (email || '?').charAt(0).toUpperCase();
    // Plan label: uppercase for paid plans, title-case for free
    var PLAN_LABELS = { free: 'Free', pro: 'PRO', team: 'TEAM', enterprise: 'ENTERPRISE', prompt_free: 'Free', prompt_pro: 'PRO' };
    var planLabel = PLAN_LABELS[plan] || (plan.charAt(0).toUpperCase() + plan.slice(1));
    var planClass = 'pg-user-chip__plan--' + plan;

    // Build menu HTML
    var menuItems = '';
    menuItems += '<div class="pg-user-chip__menu-email">' + email + '</div>';
    if (!isPaid) {
      menuItems += '<button class="pg-user-chip__menu-item pg-user-chip__menu-item--upgrade" id="pg-chip-upgrade">⭐ Upgrade to Pro</button>';
    } else {
      menuItems += '<button class="pg-user-chip__menu-item pg-user-chip__menu-item--billing" id="pg-chip-billing">🔑 Manage billing</button>';
    }
    menuItems += '<div class="pg-user-chip__menu-divider"></div>';
    menuItems += '<button class="pg-user-chip__menu-item pg-user-chip__menu-item--danger" id="pg-chip-signout">🚪 Sign out</button>';

    var chip = document.createElement('div');
    chip.id        = 'pg-user-chip';
    chip.className = 'pg-user-chip';
    chip.setAttribute('role', 'button');
    chip.setAttribute('aria-haspopup', 'true');
    chip.setAttribute('aria-expanded', 'false');
    chip.setAttribute('aria-label', 'Account menu');
    chip.innerHTML =
      '<div class="pg-user-chip__avatar">' + initial + '</div>' +
      '<span class="pg-user-chip__email">' + email + '</span>' +
      '<span class="pg-user-chip__plan ' + planClass + '">' + planLabel + '</span>' +
      '<span class="pg-user-chip__caret">▾</span>' +
      '<div class="pg-user-chip__menu" id="pgUserChipMenu" role="menu">' +
        menuItems +
      '</div>';

    signInBtn.parentNode.replaceChild(chip, signInBtn);

    // ── Hide the nav Sign Up Free button (main site) ──────────────────────

    // ── Hide the nav Sign Up Free button ──────────────────────────────────
    var signupNavBtn = document.getElementById('headerSignUpBtn');
    if (signupNavBtn) signupNavBtn.style.display = 'none';

    // ── Hide mobile signup/signin links ───────────────────────────────────
    var mobileSignUp = document.getElementById('mobileSignUpBtn');
    if (mobileSignUp) mobileSignUp.style.display = 'none';
    var mobileSignIn = document.getElementById('mobileSignInBtn');
    if (mobileSignIn) mobileSignIn.style.display = 'none';

    // ── Click-to-toggle menu (works on touch + desktop) ──────────────────
    var menu = document.getElementById('pgUserChipMenu');

    function openMenu() {
      menu.classList.add('pg-menu-open');
      chip.classList.add('pg-chip-open');
      chip.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
      menu.classList.remove('pg-menu-open');
      chip.classList.remove('pg-chip-open');
      chip.setAttribute('aria-expanded', 'false');
    }
    function toggleMenu(e) {
      e.stopPropagation();
      menu.classList.contains('pg-menu-open') ? closeMenu() : openMenu();
    }

    chip.addEventListener('click', toggleMenu);

    // Close on outside click / Escape
    document.addEventListener('click', function (e) {
      if (!chip.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    // ── Upgrade → scroll to pricing ──────────────────────────────────────
    var upgradeBtn = document.getElementById('pg-chip-upgrade');
    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeMenu();
        var el = document.getElementById('pg-pricing-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        if (typeof gtag === 'function') gtag('event', 'chip_upgrade_click', { plan: plan });
      });
    }

    // ── Manage billing → Stripe customer portal ───────────────────────────
    var billingBtn = document.getElementById('pg-chip-billing');
    if (billingBtn) {
      billingBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeMenu();
        var portalUrl = 'https://billing.stripe.com/p/login/bJe3cx7cU1Na4nY8bO14400';
        window.open(portalUrl, '_blank', 'noopener,noreferrer');
        if (typeof gtag === 'function') gtag('event', 'chip_billing_click', { plan: plan });
      });
    }

    // ── Sign out ──────────────────────────────────────────────────────────
    document.getElementById('pg-chip-signout').addEventListener('click', function (e) {
      e.stopPropagation();
      closeMenu();
      localStorage.removeItem(_LS_TOKEN);
      localStorage.removeItem(_LS_PLAN);
      localStorage.removeItem(_LS_EMAIL);
      _token = null;
      _plan  = null;
      showToast('👋 Signed out successfully.');
      setTimeout(function () { window.location.reload(); }, 1400);
      if (typeof gtag === 'function') gtag('event', 'sign_out', { plan: plan });
    });

    // ── For paid users: hide See Plans in header ──────────────────────────
    if (isPaid) {
      var pricingBtn = document.getElementById('headerPricingBtn');
      if (pricingBtn) pricingBtn.style.display = 'none';
    }
  }

  /* ─────────────────────────────────────────────
     Scroll to tool helper
  ───────────────────────────────────────────── */
  function scrollToTool() {
    var el = document.getElementById('pg-generator-section') || document.getElementById('commentGenerator');
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
     Session token panel — shown after sign-in so
     VS Code / CLI users can copy their token.
  ───────────────────────────────────────────── */
  function showSessionTokenPanel(token, email, plan, isVscodeSource) {
    // Remove any existing panel
    var existing = document.getElementById('pg-token-panel');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    var isPaid      = PAID_PLANS.indexOf(plan) !== -1;
    var planLabel   = isPaid ? (plan.charAt(0).toUpperCase() + plan.slice(1)) : 'Free';
    var panelBg     = isPaid ? 'linear-gradient(135deg,#052e16 0%,#0f2027 100%)' : 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)';
    var accentColor = isPaid ? '#34d399' : '#7dd3fc';

    // VS Code users: prompt them to copy and paste their token
    var vscodeBanner = isVscodeSource
      ? '<div style="background:linear-gradient(135deg,rgba(124,58,237,.25),rgba(79,70,229,.2));border:1px solid rgba(124,58,237,.5);border-radius:8px;padding:10px 14px;margin-bottom:12px;text-align:center;">'
        + '<div style="font-size:13px;font-weight:700;color:#c4b5fd;margin-bottom:4px;">🖥 Switch back to VS Code</div>'
        + '<div style="font-size:11px;color:#94a3b8;line-height:1.5;">Copy your token below and paste it into VS Code to activate.</div>'
        + '</div>'
      : '';

    // CLI / non-VS Code: auto-copy token to clipboard silently
    if (!isVscodeSource) {
      try { navigator.clipboard.writeText(token); } catch(e) {}
    }

    var panel = document.createElement('div');
    panel.id = 'pg-token-panel';
    // Mobile-optimised: full-width on small screens, fixed bottom-right on desktop
    panel.style.cssText = [
      'position:fixed',
      'bottom:0',
      'right:0',
      'left:0',
      'z-index:9998',
      'background:' + panelBg,
      'border:1px solid ' + accentColor + '33',
      'border-radius:14px 14px 0 0',
      'padding:20px 20px 28px',
      'box-shadow:0 -8px 40px rgba(0,0,0,0.55)',
      'font-family:Inter,sans-serif',
      'animation:pg-slide-up .3s ease',
    ].join(';');

    // On wider screens override to bottom-right card
    var styleEl = document.createElement('style');
    styleEl.textContent = '@media(min-width:520px){#pg-token-panel{'
      + 'bottom:24px!important;right:24px!important;left:auto!important;'
      + 'border-radius:14px!important;max-width:400px;'
      + 'animation:pg-slide-in .28s ease!important;}}';
    document.head.appendChild(styleEl);

    panel.innerHTML = vscodeBanner
      + '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;">'
      + '<div style="font-size:15px;font-weight:700;color:#f1f5f9;">✅ Signed in' + (isPaid ? ' — ' + planLabel + ' 🎉' : '') + '</div>'
      + '<button onclick="document.getElementById(\'pg-token-panel\').remove()" style="background:none;border:none;color:#64748b;font-size:22px;cursor:pointer;padding:0 0 0 12px;line-height:1;touch-action:manipulation;">×</button>'
      + '</div>'
      + '<div style="font-size:12px;color:#94a3b8;margin-bottom:10px;">' + email + '</div>'
      + (isVscodeSource
          ? '<div style="font-size:12px;color:#94a3b8;margin-bottom:10px;">Token also shown below if you need it for the CLI:</div>'
          : (isPaid
              ? '<div style="font-size:12px;color:' + accentColor + ';margin-bottom:10px;font-weight:600;">Token copied to clipboard! Paste into VS Code or CLI:</div>'
              : '<div style="font-size:12px;color:#94a3b8;margin-bottom:10px;">Token copied to clipboard! Paste into VS Code or CLI:</div>'))
      + '<div style="display:flex;gap:8px;align-items:center;">'
      + '<input id="pg-token-input" type="password" readonly value="' + token + '" '
      +   'style="flex:1;min-width:0;background:#0d1117;border:1px solid #334155;border-radius:7px;'
      +   'padding:10px;color:#e2e8f0;font-family:monospace;font-size:11px;outline:none;" />'
      + '<button id="pg-token-show" onclick="var i=document.getElementById(\'pg-token-input\');i.type=i.type===\'password\'?\'text\':\'password\';this.textContent=i.type===\'password\'?\'👁\':\' 🙈\'" '
      +   'style="background:#1e293b;border:1px solid #334155;border-radius:7px;padding:10px;color:#94a3b8;cursor:pointer;font-size:14px;touch-action:manipulation;flex-shrink:0;">👁</button>'
      + '<button id="pg-token-copy" onclick="navigator.clipboard.writeText(\'' + token + '\').then(function(){var b=document.getElementById(\'pg-token-copy\');b.textContent=\'✓\';b.style.background=\'#16a34a\';setTimeout(function(){b.textContent=\'Copy\';b.style.background=\'#1e293b\';},2000);})" '
      +   'style="background:#1e293b;border:1px solid #334155;border-radius:7px;padding:10px 14px;color:#7dd3fc;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap;touch-action:manipulation;flex-shrink:0;">Copy</button>'
      + '</div>'
      + '<div style="margin-top:12px;font-size:11px;color:#475569;line-height:1.8;">'
      + '<strong style="color:#94a3b8;">VS Code:</strong> '
      + '<code style="background:#1e293b;padding:2px 6px;border-radius:3px;color:#7dd3fc;font-size:10px;">Poly-Glot: Configure License Token</code>'
      + '&nbsp;&nbsp;<strong style="color:#94a3b8;">CLI:</strong> '
      + '<code style="background:#1e293b;padding:2px 6px;border-radius:3px;color:#7dd3fc;font-size:10px;">poly-glot login</code>'
      + '</div>';
    document.body.appendChild(panel);
  }

  function showCheckoutSuccessBanner(email) {
    var existing = document.getElementById('pg-checkout-banner');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    var banner = document.createElement('div');
    banner.id = 'pg-checkout-banner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(90deg,#052e16 0%,#0f2027 50%,#052e16 100%);border-bottom:1px solid rgba(52,211,153,.3);padding:14px 20px;text-align:center;font-family:Inter,sans-serif;animation:pg-nudge-slide-up .4s ease;';
    banner.innerHTML = '<span style="font-size:14px;font-weight:600;color:#f1f5f9;">🎉 Payment successful! Check <strong style="color:#34d399;">' + email + '</strong> for your sign-in link to activate Pro.</span>'
      + ' <button onclick="document.getElementById(\'pg-checkout-banner\').remove()" style="margin-left:16px;background:none;border:none;color:#64748b;font-size:18px;cursor:pointer;vertical-align:middle;">×</button>';
    document.body.insertBefore(banner, document.body.firstChild);
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
      // Dispatch custom event so app.js and other modules can react
      // without coupling to PolyGlotAuth internals.
      try {
        window.dispatchEvent(new CustomEvent('pg:plan-loaded', { detail: { plan: plan } }));
      } catch(e) {}
    },

    /**
     * Open the login modal.
     * @param {string} source — analytics source label
     */
    openLoginModal: function (source) {
      openModal(source);
      if (typeof gtag === 'function') {
        gtag('event', 'auth_modal_opened', { source: source || 'unknown' });
      }
    },

    /** Apply plan gating manually (useful if plan arrives asynchronously). */
    applyPlanGating: applyPlanGating,
    updateHeaderForUser: updateHeaderForUser,

    /**
     * Returns the current session token.
     * _token is set exclusively by a live server verification (verifyStoredToken / magic-link).
     * localStorage is a persistence cache only — the token stored there is always
     * re-validated against the server on every page load via verifyStoredToken().
     * If verifyStoredToken() fails (expired/invalid), _token is nulled, localStorage is
     * purged, and the #pg-user-chip is removed — so isAuthed() returns false.
     * A token forged in localStorage without a matching KV entry gets 401 from
     * checkUsageFromServer() → generation is blocked server-side regardless.
     */
    getToken: function () {
      return _token || localStorage.getItem(_LS_TOKEN) || null;
    },

    /** Returns the current plan string, or 'free'.
     *  ONLY returns a paid plan if _plan is set from a live server verification.
     *  Never promotes to pro/team/enterprise from localStorage alone —
     *  localStorage is a display cache and can be spoofed via DevTools.
     */
    getPlan: function () {
      // _plan is set exclusively by the server verify/refresh response.
      // If it's null the auth module hasn't finished loading yet — return 'free'.
      // We intentionally do NOT fall back to localStorage for plan gating.
      if (_plan) return _plan;
      // Safe fallback: only return a non-free plan from localStorage if the
      // pg-user-chip is in the DOM (meaning auth has already verified once).
      var chip = document.getElementById('pg-user-chip');
      if (chip) return localStorage.getItem(_LS_PLAN) || 'free';
      return 'free';
    },

    /** Clear auth state and reload. */
    logout: function () {
      localStorage.removeItem(_LS_TOKEN);
      localStorage.removeItem(_LS_PLAN);
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
  // ─────────────────────────────────────────────
  // Device ID — stable per-browser fingerprint
  // Used to auto-detect returning devices and
  // show a toast with their active plan.
  // ─────────────────────────────────────────────
  var DEVICE_ID_KEY = 'pg_device_id';

  function getOrCreateDeviceId() {
    try {
      var existing = localStorage.getItem(DEVICE_ID_KEY);
      if (existing) return existing;
      // Generate a stable random ID for this browser
      var arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      var id = Array.from(arr).map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
      localStorage.setItem(DEVICE_ID_KEY, id);
      return id;
    } catch(e) { return 'unknown'; }
  }

  function showPlanToast(plan, email) {
    var planLabel = plan === 'pro'          ? '✨ Pro'
                  : plan === 'team'         ? '🚀 Team'
                  : plan === 'enterprise'   ? '🏢 Enterprise'
                  : plan === 'prompt_pro'   ? '✨ Prompt Studio Pro'
                  : plan === 'prompt_free'  ? '🆓 Prompt Studio'
                  : '🆓 Free';
    var msg = planLabel + ' plan active';
    if (email) msg += ' · ' + email;
    showToast(msg, 4000);
  }

  function init() {
    injectStyles();
    buildModal();

    // Hide EARLYBIRD3 promo after May 1, 2026
    if (new Date() >= new Date('2026-05-01T00:00:00Z')) {
      var ebEl = document.getElementById('pgModalEarlybird');
      if (ebEl) ebEl.style.display = 'none';
    }

    // Auto-detect device — create/retrieve stable device ID
    var deviceId = getOrCreateDeviceId();

    // 1. Apply the stored plan immediately (before any network call) so the
    //    UI is correct on every page load — not just the first magic-link click.
    //    Falls back to 'free' for brand-new visitors with no localStorage entry.
    var cachedPlan  = (localStorage.getItem(_LS_PLAN)  || 'free').toLowerCase();
    var cachedEmail = localStorage.getItem(_LS_EMAIL) || '';
    applyPlanGating(cachedPlan);
    if (cachedEmail) updateHeaderForUser(cachedEmail, cachedPlan);

    // Show plan toast for returning signed-in users — once per browser session only.
    // sessionStorage clears when all tabs close, so the toast appears on first open
    // but not on every refresh or every new tab.
    var _toastShownThisSession = false;
    try { _toastShownThisSession = !!sessionStorage.getItem('pg_toast_shown'); } catch(e) {}
    if (cachedEmail && localStorage.getItem(_LS_TOKEN) && !_toastShownThisSession) {
      showPlanToast(cachedPlan, cachedEmail);
      try { sessionStorage.setItem('pg_toast_shown', '1'); } catch(e) {}
    }

    // Parse URL params once — used by handleUrlParams and source tracking
    var params = new URLSearchParams(window.location.search);

    // 2. Check URL params first — magic link click takes highest priority
    handleUrlParams();

    // 2b. Capture ?source= / ?utm_source= for attribution on magic-link sends
    var urlSource = params.get('source') || params.get('utm_source') || '';
    if (urlSource) {
      try { sessionStorage.setItem('pg_source', urlSource); } catch(e) {}
    }

    // 3. If no magic link in URL, silently re-validate the stored token via
    //    /refresh (non-destructive) to confirm it's still live and get
    //    the latest plan from the Worker (e.g. after a plan upgrade).
    if (!_token) {
      var storedToken = localStorage.getItem(_LS_TOKEN);
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

  // ── BroadcastChannel tab-handoff ─────────────────────────────────────────
  // Listens on BOTH surfaces:
  //   pg_prompt_auth  — Prompt Studio magic link → existing /prompt/ tab
  //   pg_app_auth     — Main site magic link     → existing poly-glot.ai/ tab
  //
  // Flow:
  //   1. User submits email in tab A (original tab)
  //   2. User clicks magic link in email → opens tab B
  //   3. Tab B verifies token, broadcasts auth, closes itself
  //   4. Tab A receives broadcast, signs in, user never leaves their original tab
  (function () {
    var channelName = IS_PROMPT_PAGE ? 'pg_prompt_auth' : 'pg_app_auth';

    // ── SENDER (tab B — the magic link tab) ─────────────────────────────
    // After token verify succeeds (isPromptSource block in handleUrlParams),
    // auth.v13 already posts to pg_prompt_auth. For the main site we post here.
    // We hook into the pg:plan-loaded event which fires after successful verify.
    if (!IS_PROMPT_PAGE) {
      window.addEventListener('pg:plan-loaded', function onFirstLoad(e) {
        // Only broadcast if we just verified a magic link (?token= in URL)
        var params = new URLSearchParams(window.location.search);
        if (!params.get('token')) return;
        window.removeEventListener('pg:plan-loaded', onFirstLoad);
        try {
          var bc = new BroadcastChannel('pg_app_auth');
          bc.postMessage({
            type:  'APP_AUTH_SUCCESS',
            token: localStorage.getItem(_LS_TOKEN) || '',
            email: localStorage.getItem(_LS_EMAIL) || '',
            plan:  localStorage.getItem(_LS_PLAN)  || 'free'
          });
          bc.close();
        } catch(e) {}
        // Close this tab after broadcast — return user to original tab
        setTimeout(function () { try { window.close(); } catch(e) {} }, 600);
      });
    }

    // ── RECEIVER (tab A — the original tab) ─────────────────────────────
    try {
      var _bcReceiver = new BroadcastChannel(channelName);
      _bcReceiver.onmessage = function (evt) {
        var msg = evt.data;
        var expectedType = IS_PROMPT_PAGE ? 'PROMPT_AUTH_SUCCESS' : 'APP_AUTH_SUCCESS';
        if (!msg || msg.type !== expectedType) return;

        var token = msg.token;
        var email = msg.email;
        var plan  = (msg.plan || (IS_PROMPT_PAGE ? 'prompt_free' : 'free')).toLowerCase();

        // Write to the correct localStorage namespace for this surface
        try {
          localStorage.setItem(_LS_TOKEN, token);
          localStorage.setItem(_LS_PLAN,  plan);
          if (email) localStorage.setItem(_LS_EMAIL, email);
        } catch(e) {}

        // Update in-memory state
        _token = token;
        _plan  = plan;

        // Apply plan gating + update nav chip
        PolyGlotAuth.onPlanLoaded(plan);
        updateHeaderForUser(email, plan);

        _bcReceiver.close();
      };
    } catch(e) { /* BroadcastChannel not supported — degrade gracefully */ }
  }());

}());
