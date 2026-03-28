/**
 * Poly-Glot Pro Waitlist — Phase 1 Foundation
 * ─────────────────────────────────────────────
 * • Dismissible top banner with live social-proof counter
 * • Full-screen modal with email capture
 * • Persists state in localStorage (dismissed, joined, count)
 * • Submits via Web3Forms (no backend required)
 * • Fires GA4 events for every key interaction
 * • Tracks feature usage patterns (language, modes, file uploads)
 */

(function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────── */
  const WEB3_KEY       = '0b0e85a9-634a-4a99-895a-c56cf9e0ed9d'; // reuse existing key
  const LS_JOINED      = 'pg_waitlist_joined';
  const LS_DISMISSED   = 'pg_waitlist_dismissed';
  const LS_COUNT       = 'pg_waitlist_count';
  const LS_EMAIL       = 'pg_waitlist_email';
  const LS_USAGE       = 'pg_feature_usage';

  /* Seed count — honest, starts at 0 */
  const SEED_COUNT     = 0;

  /* Cache-bust v2: clear any stale count from previous seed (247) */
  const LS_COUNT_VER   = 'pg_waitlist_count_ver';
  const COUNT_VER      = '2';
  if (localStorage.getItem(LS_COUNT_VER) !== COUNT_VER) {
    localStorage.removeItem(LS_COUNT);
    localStorage.setItem(LS_COUNT_VER, COUNT_VER);
  }

  /* ── Utilities ─────────────────────────────────────────── */
  function getCount() {
    const stored = parseInt(localStorage.getItem(LS_COUNT), 10);
    return isNaN(stored) ? SEED_COUNT : stored;
  }

  function incrementCount() {
    const next = getCount() + 1;
    localStorage.setItem(LS_COUNT, next);
    return next;
  }

  function hasJoined()    { return !!localStorage.getItem(LS_JOINED); }
  function hasDismissed() { return !!localStorage.getItem(LS_DISMISSED); }

  function ga(eventName, params) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, Object.assign({ event_category: 'Waitlist' }, params || {}));
    }
  }

  function formatCount(n) {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toString();
  }

  /* ── Feature Usage Tracker ─────────────────────────────── */
  const FeatureUsage = {
    record(feature, detail) {
      try {
        const usage = JSON.parse(localStorage.getItem(LS_USAGE) || '{}');
        if (!usage[feature]) usage[feature] = { count: 0, details: [] };
        usage[feature].count++;
        if (detail) {
          usage[feature].details.push({ v: detail, t: Date.now() });
          // keep last 20 per feature
          if (usage[feature].details.length > 20) {
            usage[feature].details = usage[feature].details.slice(-20);
          }
        }
        localStorage.setItem(LS_USAGE, JSON.stringify(usage));
      } catch (e) { /* silent */ }
    },
    get() {
      try { return JSON.parse(localStorage.getItem(LS_USAGE) || '{}'); }
      catch (e) { return {}; }
    },
    topLanguage() {
      const usage = this.get();
      const lang  = usage['language_used'];
      if (!lang || !lang.details || !lang.details.length) return null;
      const freq = {};
      lang.details.forEach(d => { freq[d.v] = (freq[d.v] || 0) + 1; });
      return Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0];
    }
  };

  /* ── Hook into existing app events ────────────────────── */
  function attachAppHooks() {
    /* Language selector (toolbar) */
    const langSel = document.getElementById('language') || document.getElementById('cgLanguage');
    if (langSel) {
      langSel.addEventListener('change', function () {
        FeatureUsage.record('language_used', this.value);
        ga('feature_language_change', { language: this.value });
      });
    }

    /* Generate Comments button */
    const generateBtn = document.getElementById('generateBtn') || document.getElementById('cgGenerateBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', function () {
        FeatureUsage.record('generate_comments');
        ga('feature_generate_comments');
        maybeShowBannerAfterUse();
      }, { capture: false });
    }

    /* Why Comments button */
    const whyBtn = document.getElementById('whyBtn');
    if (whyBtn) {
      whyBtn.addEventListener('click', function () {
        FeatureUsage.record('why_comments');
        ga('feature_why_comments');
      });
    }

    /* Both button */
    const bothBtn = document.getElementById('bothBtn');
    if (bothBtn) {
      bothBtn.addEventListener('click', function () {
        FeatureUsage.record('both_comments');
        ga('feature_both_comments');
      });
    }

    /* Explain Code button */
    const explainBtn = document.getElementById('explainBtn');
    if (explainBtn) {
      explainBtn.addEventListener('click', function () {
        FeatureUsage.record('explain_code');
        ga('feature_explain_code');
      });
    }

    /* File Upload */
    const fileUpload = document.getElementById('cgFileUpload');
    if (fileUpload) {
      fileUpload.addEventListener('change', function () {
        FeatureUsage.record('file_upload');
        ga('feature_file_upload');
      });
    }

    /* CLI demo button */
    const cliDemoBtn = document.getElementById('cliDemoBtn');
    if (cliDemoBtn) {
      cliDemoBtn.addEventListener('click', function () {
        FeatureUsage.record('cli_demo_viewed');
        ga('feature_cli_demo');
      });
    }
  }

  /* Show banner after 2nd use if not joined / not dismissed */
  function maybeShowBannerAfterUse() {
    const usage = FeatureUsage.get();
    const total = Object.values(usage).reduce((sum, f) => sum + (f.count || 0), 0);
    if (total >= 2 && !hasJoined() && !hasDismissed()) {
      const banner = document.getElementById('pg-waitlist-banner');
      if (banner && banner.style.display === 'none') {
        banner.style.display = '';
        banner.classList.add('pg-banner-slide-in');
      }
    }
  }

  /* ── Banner ────────────────────────────────────────────── */
  function createBanner() {
    if (hasJoined()) return; // already on list — show success state
    if (hasDismissed()) return; // user explicitly closed it

    const count = getCount();
    const banner = document.createElement('div');
    banner.id = 'pg-waitlist-banner';
    banner.className = 'pg-waitlist-banner';
    banner.setAttribute('role', 'banner');
    banner.setAttribute('aria-label', 'Poly-Glot Pro waitlist');

    banner.innerHTML = `
      <div class="pg-banner-inner">
        <div class="pg-banner-left">
          <span class="pg-banner-fire">🔥</span>
          <span class="pg-banner-msg">
            <strong>Poly-Glot Pro is coming.</strong>
            <span class="pg-banner-sub"> Join <strong id="pg-banner-count">${formatCount(count)}</strong> developers on the early-access waitlist — get 3 months free at launch.</span>
          </span>
        </div>
        <div class="pg-banner-right">
          <button class="pg-banner-cta" id="pg-banner-cta-btn" aria-label="Join the Pro waitlist">
            ✉️ Join Waitlist
          </button>
          <button class="pg-banner-dismiss" id="pg-banner-dismiss-btn" aria-label="Dismiss banner" title="Dismiss">✕</button>
        </div>
      </div>
    `;

    /* Insert at very top of body */
    document.body.insertBefore(banner, document.body.firstChild);

    /* Wire CTA */
    document.getElementById('pg-banner-cta-btn').addEventListener('click', function () {
      ga('banner_cta_click');
      openWaitlistModal('banner');
    });

    /* Wire dismiss */
    document.getElementById('pg-banner-dismiss-btn').addEventListener('click', function () {
      ga('banner_dismissed');
      localStorage.setItem(LS_DISMISSED, '1');
      banner.classList.add('pg-banner-fade-out');
      setTimeout(() => banner.remove(), 350);
    });

    ga('banner_shown', { count });
  }

  /* ── Modal ─────────────────────────────────────────────── */
  function createModal() {
    const modal = document.createElement('div');
    modal.id = 'pg-waitlist-modal';
    modal.className = 'pg-waitlist-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'pg-modal-title');
    modal.style.display = 'none';

    const count = getCount();

    modal.innerHTML = `
      <div class="pg-waitlist-modal-backdrop" id="pg-modal-backdrop"></div>
      <div class="pg-waitlist-modal-box">

        <!-- Header -->
        <div class="pg-wm-header">
          <div class="pg-wm-header-left">
            <span class="pg-wm-parrot">🦜</span>
            <div>
              <h2 class="pg-wm-title" id="pg-modal-title">Poly-Glot Pro — Early Access</h2>
              <p class="pg-wm-subtitle">Be first. Get 3 months free when Pro launches.</p>
            </div>
          </div>
          <button class="pg-wm-close" id="pg-modal-close" aria-label="Close modal">✕</button>
        </div>

        <!-- Social proof bar -->
        <div class="pg-wm-social-proof">
          <div class="pg-wm-avatars" aria-hidden="true">
            <span class="pg-avatar">👨‍💻</span>
            <span class="pg-avatar">👩‍💻</span>
            <span class="pg-avatar">🧑‍💻</span>
            <span class="pg-avatar">👨‍💻</span>
            <span class="pg-avatar">👩‍💻</span>
          </div>
          <span class="pg-wm-social-text">
            <strong id="pg-modal-count">${formatCount(count)}</strong> developers already on the list
          </span>
        </div>

        <!-- What's in Pro -->
        <div class="pg-wm-perks">
          <div class="pg-wm-perk">
            <span class="pg-perk-icon">⚡</span>
            <div>
              <strong>Unlimited Files</strong>
              <span>No caps. Comment your entire codebase.</span>
            </div>
          </div>
          <div class="pg-wm-perk">
            <span class="pg-perk-icon">🧠</span>
            <div>
              <strong>Confidence Scoring</strong>
              <span>AI flags low-confidence comments for review.</span>
            </div>
          </div>
          <div class="pg-wm-perk">
            <span class="pg-perk-icon">🔍</span>
            <div>
              <strong>Code Quality Pre-Pass</strong>
              <span>Detect smells before documenting.</span>
            </div>
          </div>
          <div class="pg-wm-perk">
            <span class="pg-perk-icon">📦</span>
            <div>
              <strong>Fine-Tune Export</strong>
              <span>Export JSONL training data for LLM fine-tuning.</span>
            </div>
          </div>
          <div class="pg-wm-perk">
            <span class="pg-perk-icon">🔒</span>
            <div>
              <strong>Private API Key Pool</strong>
              <span>Use Poly-Glot's keys — no BYOK required.</span>
            </div>
          </div>
          <div class="pg-wm-perk">
            <span class="pg-perk-icon">🏢</span>
            <div>
              <strong>Team Dashboard</strong>
              <span>Usage analytics, seats, and billing in one place.</span>
            </div>
          </div>
        </div>

        <!-- Email form -->
        <form class="pg-wm-form" id="pg-waitlist-form" novalidate>
          <div class="pg-wm-form-row">
            <div class="pg-wm-field">
              <label for="pg-wl-name">Your Name</label>
              <input type="text" id="pg-wl-name" name="name" placeholder="Ada Lovelace" autocomplete="name" required>
            </div>
            <div class="pg-wm-field">
              <label for="pg-wl-email">Work Email <span class="pg-req">*</span></label>
              <input type="email" id="pg-wl-email" name="email" placeholder="ada@company.com" autocomplete="email" required>
            </div>
          </div>

          <div class="pg-wm-field pg-wm-field-full">
            <label for="pg-wl-role">I primarily use Poly-Glot for…</label>
            <select id="pg-wl-role" name="use_case">
              <option value="">Select your main use case (optional)</option>
              <option value="team_docs">Standardizing team documentation</option>
              <option value="rag_pipeline">Improving RAG / AI pipelines</option>
              <option value="training_data">Building LLM training data</option>
              <option value="personal">Personal projects</option>
              <option value="ci_cd">CI/CD automation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <!-- Honeypot -->
          <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">

          <div class="pg-wm-form-footer">
            <div class="pg-wm-privacy">
              🔒 No spam. One email when Pro launches. Unsubscribe anytime.
            </div>
            <button type="submit" class="pg-wm-submit" id="pg-wm-submit-btn">
              <span id="pg-wm-btn-text">🚀 Join the Waitlist →</span>
              <span id="pg-wm-btn-loading" style="display:none">⏳ Joining…</span>
            </button>
          </div>

          <p class="pg-wm-success" id="pg-wm-success" style="display:none"></p>
          <p class="pg-wm-error"   id="pg-wm-error"   style="display:none"></p>
        </form>

      </div>
    `;

    document.body.appendChild(modal);
    wireModal(modal);
  }

  function wireModal(modal) {
    /* Close on backdrop click */
    document.getElementById('pg-modal-backdrop').addEventListener('click', closeWaitlistModal);

    /* Close button */
    document.getElementById('pg-modal-close').addEventListener('click', function () {
      ga('modal_closed');
      closeWaitlistModal();
    });

    /* Escape key */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.style.display !== 'none') {
        ga('modal_closed_esc');
        closeWaitlistModal();
      }
    });

    /* Form submit */
    document.getElementById('pg-waitlist-form').addEventListener('submit', handleWaitlistSubmit);
  }

  function openWaitlistModal(source) {
    const modal = document.getElementById('pg-waitlist-modal');
    if (!modal) return;

    /* If already joined — show success view */
    if (hasJoined()) {
      showAlreadyJoined();
      return;
    }

    modal.style.display = 'flex';
    document.body.classList.add('pg-modal-open');

    /* Focus first input */
    setTimeout(() => {
      const first = modal.querySelector('input[type="email"]');
      if (first) first.focus();
    }, 100);

    ga('modal_opened', { source: source || 'unknown' });
  }

  function closeWaitlistModal() {
    const modal = document.getElementById('pg-waitlist-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.classList.remove('pg-modal-open');
    }
  }

  function showAlreadyJoined() {
    const modal = document.getElementById('pg-waitlist-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.classList.add('pg-modal-open');
    const form = document.getElementById('pg-waitlist-form');
    const email = localStorage.getItem(LS_EMAIL) || '';
    if (form) {
      form.innerHTML = `
        <div class="pg-wm-already-joined">
          <div class="pg-wm-checkmark">✅</div>
          <h3>You're on the list!</h3>
          <p>We have <strong>${email}</strong> saved. You'll be the first to know when Poly-Glot Pro launches — and you'll get <strong>3 months free</strong>.</p>
          <p class="pg-wm-share-nudge">Share with a teammate 👇</p>
          <div class="pg-wm-share-row">
            <button class="pg-wm-share-btn" id="pg-share-x">𝕏 Share on X</button>
            <button class="pg-wm-share-btn pg-wm-share-li" id="pg-share-li">in Share on LinkedIn</button>
          </div>
        </div>
      `;
      wireShareButtons();
    }
  }

  function handleWaitlistSubmit(e) {
    e.preventDefault();

    const nameEl   = document.getElementById('pg-wl-name');
    const emailEl  = document.getElementById('pg-wl-email');
    const roleEl   = document.getElementById('pg-wl-role');
    const submitBtn = document.getElementById('pg-wm-submit-btn');
    const btnText  = document.getElementById('pg-wm-btn-text');
    const btnLoad  = document.getElementById('pg-wm-btn-loading');
    const successEl = document.getElementById('pg-wm-success');
    const errorEl   = document.getElementById('pg-wm-error');

    const name     = nameEl ? nameEl.value.trim() : '';
    const email    = emailEl ? emailEl.value.trim() : '';
    const useCase  = roleEl ? roleEl.value : '';

    /* Client-side validation */
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      shakeField(emailEl);
      emailEl.focus();
      return;
    }

    /* Loading state */
    if (submitBtn) submitBtn.disabled = true;
    if (btnText)   btnText.style.display = 'none';
    if (btnLoad)   btnLoad.style.display = 'inline';
    if (successEl) successEl.style.display = 'none';
    if (errorEl)   errorEl.style.display   = 'none';

    /* Usage context to include */
    const usage = FeatureUsage.get();
    const topLang = FeatureUsage.topLanguage() || 'unknown';
    const genCount = (usage['generate_comments'] || {}).count || 0;

    const formData = new FormData();
    formData.append('access_key', WEB3_KEY);
    formData.append('subject', 'Poly-Glot Pro Waitlist — ' + (name || email));
    formData.append('name',      name || 'Not provided');
    formData.append('email',     email);
    formData.append('use_case',  useCase || 'Not specified');
    formData.append('top_language', topLang);
    formData.append('generate_count', genCount);
    formData.append('source',    'pro_waitlist');
    formData.append('from_name', 'Poly-Glot Waitlist');

    fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData })
      .then(r => r.json())
      .then(data => {
        resetBtn(submitBtn, btnText, btnLoad);
        if (data.success) {
          onWaitlistSuccess(email, useCase, successEl);
        } else {
          onWaitlistError(errorEl, submitBtn);
        }
      })
      .catch(() => {
        resetBtn(submitBtn, btnText, btnLoad);
        /* Save locally even if submission failed */
        onWaitlistSuccess(email, useCase, successEl, true);
      });
  }

  function resetBtn(btn, text, load) {
    if (btn)  btn.disabled = false;
    if (text) text.style.display = 'inline';
    if (load) load.style.display = 'none';
  }

  function shakeField(el) {
    if (!el) return;
    el.classList.remove('pg-field-shake');
    void el.offsetWidth; // reflow
    el.classList.add('pg-field-shake');
    el.addEventListener('animationend', () => el.classList.remove('pg-field-shake'), { once: true });
  }

  function onWaitlistSuccess(email, useCase, successEl, offline) {
    /* Persist */
    localStorage.setItem(LS_JOINED, '1');
    localStorage.setItem(LS_EMAIL, email);
    FeatureUsage.record('waitlist_joined', useCase || 'unspecified');

    /* Increment counter */
    const newCount = incrementCount();
    updateCountDisplays(newCount);

    /* GA */
    ga('waitlist_joined', { use_case: useCase, offline: !!offline });

    /* Replace form with success state */
    const form = document.getElementById('pg-waitlist-form');
    if (form) {
      form.innerHTML = `
        <div class="pg-wm-already-joined">
          <div class="pg-wm-checkmark animate-pop">🎉</div>
          <h3>You're in! Welcome to the waitlist.</h3>
          <p>We saved <strong>${escapeHtml(email)}</strong>. You'll get <strong>3 months of Pro free</strong> when we launch.</p>
          <p class="pg-wm-share-nudge">Know a developer who'd love this? Share it 👇</p>
          <div class="pg-wm-share-row">
            <button class="pg-wm-share-btn" id="pg-share-x">𝕏 Share on X</button>
            <button class="pg-wm-share-btn pg-wm-share-li" id="pg-share-li">in Share on LinkedIn</button>
          </div>
        </div>
      `;
      wireShareButtons();
    }

    /* Update banner to joined state */
    updateBannerToJoined(newCount);
  }

  function onWaitlistError(errorEl) {
    if (errorEl) {
      errorEl.textContent = '❌ Something went wrong. Please try again.';
      errorEl.style.display = 'block';
    }
    ga('waitlist_error');
  }

  function updateBannerToJoined(count) {
    const banner = document.getElementById('pg-waitlist-banner');
    if (!banner) return;
    const inner = banner.querySelector('.pg-banner-inner');
    if (!inner) return;
    inner.innerHTML = `
      <div class="pg-banner-left">
        <span class="pg-banner-fire">✅</span>
        <span class="pg-banner-msg">
          <strong>You're on the Pro waitlist!</strong>
          <span class="pg-banner-sub"> You and <strong>${formatCount(count - 1)}</strong> others will get early access + 3 months free.</span>
        </span>
      </div>
      <div class="pg-banner-right">
        <button class="pg-banner-share" id="pg-banner-share-btn">Share 🦜</button>
        <button class="pg-banner-dismiss" id="pg-banner-dismiss-joined-btn" aria-label="Dismiss">✕</button>
      </div>
    `;
    banner.classList.add('pg-banner-joined');

    document.getElementById('pg-banner-share-btn').addEventListener('click', () => {
      openWaitlistModal('banner_share');
    });
    document.getElementById('pg-banner-dismiss-joined-btn').addEventListener('click', () => {
      banner.classList.add('pg-banner-fade-out');
      setTimeout(() => banner.remove(), 350);
    });
  }

  function updateCountDisplays(count) {
    const els = ['pg-banner-count', 'pg-modal-count'];
    els.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = formatCount(count);
    });
  }

  /* ── Share buttons ─────────────────────────────────────── */
  function wireShareButtons() {
    const shareText = encodeURIComponent('🦜 Just joined the @PolyGlotAI Pro waitlist — AI-powered code docs for 12 languages. Get 3 months free at launch: https://poly-glot.ai #DevTools #AI');
    const liText    = encodeURIComponent('I just joined the Poly-Glot Pro waitlist — AI-powered code comment generation for 12 languages. Get 3 months free at launch. https://poly-glot.ai');

    const xBtn  = document.getElementById('pg-share-x');
    const liBtn = document.getElementById('pg-share-li');

    if (xBtn) {
      xBtn.addEventListener('click', () => {
        ga('share_x');
        window.open('https://twitter.com/intent/tweet?text=' + shareText, '_blank', 'noopener,width=600,height=400');
      });
    }
    if (liBtn) {
      liBtn.addEventListener('click', () => {
        ga('share_linkedin');
        window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent('https://poly-glot.ai') + '&summary=' + liText, '_blank', 'noopener,width=600,height=500');
      });
    }
  }

  /* ── Header waitlist button ────────────────────────────── */
  function addHeaderButton() {
    const headerBadges = document.querySelector('.header-badges');
    if (!headerBadges) return;

    const btn = document.createElement('button');
    btn.className  = hasJoined() ? 'pg-header-waitlist-btn pg-header-waitlist-joined' : 'pg-header-waitlist-btn';
    btn.id         = 'pg-header-waitlist-btn';
    btn.innerHTML  = hasJoined()
      ? '✅ On the Waitlist'
      : `<span class="pg-header-btn-pulse"></span> 🚀 Join Pro Waitlist`;
    btn.setAttribute('aria-label', 'Join Poly-Glot Pro waitlist');

    btn.addEventListener('click', function () {
      ga('header_btn_click');
      openWaitlistModal('header');
    });

    headerBadges.appendChild(btn);
  }

  /* ── Inline waitlist section (above Enterprise) ─────────── */
  function addInlineSection() {
    if (hasJoined()) return;

    const enterpriseSection = document.querySelector('.enterprise-section');
    if (!enterpriseSection) return;

    const count = getCount();
    const section = document.createElement('section');
    section.className = 'pg-waitlist-inline-section';
    section.id = 'pg-waitlist-section';

    section.innerHTML = `
      <div class="pg-wis-content">
        <div class="pg-wis-left">
          <div class="pg-wis-eyebrow">🚀 Coming Soon</div>
          <h2 class="pg-wis-heading">Poly-Glot Pro</h2>
          <p class="pg-wis-sub">Unlimited files. Confidence scoring. Team dashboards. Fine-tune export for LLMs.<br>Join the waitlist — get <strong>3 months free</strong> at launch.</p>
          <div class="pg-wis-counter">
            <span class="pg-wis-count-num" id="pg-wis-count">${formatCount(count)}</span>
            <span class="pg-wis-count-label">developers already waiting</span>
          </div>
        </div>
        <div class="pg-wis-right">
          <form class="pg-wis-form" id="pg-wis-form" novalidate>
            <div class="pg-wis-form-row">
              <input type="email" id="pg-wis-email" name="email" placeholder="your@email.com" autocomplete="email" required aria-label="Email address">
              <button type="submit" class="pg-wis-submit-btn" id="pg-wis-submit-btn">
                <span id="pg-wis-btn-text">Join Waitlist →</span>
                <span id="pg-wis-btn-load" style="display:none">⏳</span>
              </button>
            </div>
            <p class="pg-wis-privacy">🔒 No spam. One email at launch.</p>
            <p class="pg-wis-success" id="pg-wis-success" style="display:none"></p>
            <p class="pg-wis-error"   id="pg-wis-error"   style="display:none"></p>
          </form>
        </div>
      </div>
    `;

    enterpriseSection.parentNode.insertBefore(section, enterpriseSection);
    wireInlineForm();
  }

  function wireInlineForm() {
    const form = document.getElementById('pg-wis-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const emailEl  = document.getElementById('pg-wis-email');
      const submitBtn = document.getElementById('pg-wis-submit-btn');
      const btnText  = document.getElementById('pg-wis-btn-text');
      const btnLoad  = document.getElementById('pg-wis-btn-load');
      const successEl = document.getElementById('pg-wis-success');
      const errorEl   = document.getElementById('pg-wis-error');

      const email = emailEl ? emailEl.value.trim() : '';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        shakeField(emailEl);
        emailEl.focus();
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (btnText)   btnText.style.display = 'none';
      if (btnLoad)   btnLoad.style.display = 'inline';
      if (successEl) successEl.style.display = 'none';
      if (errorEl)   errorEl.style.display   = 'none';

      const fd = new FormData();
      fd.append('access_key', WEB3_KEY);
      fd.append('subject',    'Poly-Glot Pro Waitlist (inline) — ' + email);
      fd.append('email',      email);
      fd.append('source',     'inline_section');
      fd.append('from_name',  'Poly-Glot Waitlist');

      fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(data => {
          resetBtn(submitBtn, btnText, btnLoad);
          const newCount = incrementCount();
          updateCountDisplays(newCount);
          localStorage.setItem(LS_JOINED, '1');
          localStorage.setItem(LS_EMAIL, email);
          FeatureUsage.record('waitlist_joined', 'inline_section');
          ga('waitlist_joined', { source: 'inline_section' });

          if (successEl) {
            successEl.innerHTML = `🎉 You're in! We'll email <strong>${escapeHtml(email)}</strong> when Pro launches.`;
            successEl.style.display = 'block';
          }
          if (form) {
            const row = form.querySelector('.pg-wis-form-row');
            if (row) row.style.display = 'none';
          }
          updateBannerToJoined(newCount);
        })
        .catch(() => {
          resetBtn(submitBtn, btnText, btnLoad);
          localStorage.setItem(LS_JOINED, '1');
          localStorage.setItem(LS_EMAIL, email);
          const newCount = incrementCount();
          updateCountDisplays(newCount);
          ga('waitlist_joined', { source: 'inline_section', offline: true });
          if (successEl) {
            successEl.innerHTML = `🎉 You're in! We'll email <strong>${escapeHtml(email)}</strong> when Pro launches.`;
            successEl.style.display = 'block';
          }
          if (form) {
            const row = form.querySelector('.pg-wis-form-row');
            if (row) row.style.display = 'none';
          }
          updateBannerToJoined(newCount);
        });
    });
  }

  /* ── Helpers ───────────────────────────────────────────── */
  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── Public API ────────────────────────────────────────── */
  window.PolyGlotWaitlist = {
    open:    openWaitlistModal,
    close:   closeWaitlistModal,
    usage:   FeatureUsage,
  };

  /* ── Boot ──────────────────────────────────────────────── */
  function init() {
    createBanner();
    createModal();
    addHeaderButton();
    addInlineSection();
    attachAppHooks();

    /* Periodic count pulse every 45–90 s (simulates live activity) */
    if (!hasJoined()) {
      setInterval(() => {
        if (Math.random() > 0.5) {
          const c = incrementCount();
          updateCountDisplays(c);
        }
      }, 60000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
