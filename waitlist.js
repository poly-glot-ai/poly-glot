/**
 * Poly-Glot Pro Waitlist — v11
 * ─────────────────────────────────────────────
 * • Dismissible top banner with live social-proof counter
 * • Full-screen modal with email capture + EARLYBIRD3 promo code field
 * • Persists state in localStorage (dismissed, joined, count)
 * • Submits via Web3Forms (no backend required)
 * • Fires GA4 events for every key interaction
 * • Tracks feature usage patterns (language, modes, file uploads)
 * • Global email deduplication across ALL forms (modal, inline, enterprise)
 * • EARLYBIRD3 promo code tracking — tags users for 3 months free
 * • Email notification to hwmoses2@icloud.com on every unique new signup
 * • SignupTracker: secure localStorage log with CSV + email export
 * • "developers already waiting" badge removed from inline section
 */

(function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────── */
  const WEB3_KEY       = '6c8b494a-b8eb-4c6b-ac68-4481e9845530';
  const NOTIFY_EMAIL   = 'hwmoses2@icloud.com';
  const COUNTER_URL    = 'https://poly-glot.ai/api/counter';
  const LS_JOINED      = 'pg_waitlist_joined';
  const LS_DISMISSED   = 'pg_waitlist_dismissed';
  const LS_COUNT       = 'pg_waitlist_count';
  const LS_EMAIL       = 'pg_waitlist_email';
  const LS_USAGE       = 'pg_feature_usage';
  const LS_SIGNUPS     = 'pg_waitlist_signups';   // full signup log
  const LS_ALL_EMAILS  = 'pg_waitlist_all_emails'; // global dedup registry
  const LS_PROMO       = 'pg_promo_users';         // EARLYBIRD3 promo log
  const PROMO_CODE     = 'EARLYBIRD3';

  /* Seed count — honest, starts at 0 */
  const SEED_COUNT = 0;

  /* Cache-bust: wipe stale count from previous seed */
  localStorage.removeItem(LS_COUNT);
  localStorage.removeItem('pg_waitlist_count_ver');

  /* ── Global Email Registry (dedup across ALL forms) ───── */
  const EmailRegistry = {
    /**
     * Return the normalized set of all registered emails.
     * @returns {string[]}
     */
    getAll() {
      try {
        return JSON.parse(localStorage.getItem(LS_ALL_EMAILS) || '[]');
      } catch (e) {
        return [];
      }
    },

    /**
     * Check whether an email is already registered.
     * @param {string} email
     * @returns {boolean}
     */
    has(email) {
      const norm = email.toLowerCase().trim();
      return this.getAll().indexOf(norm) !== -1;
    },

    /**
     * Register an email. No-op if already present.
     * @param {string} email
     */
    add(email) {
      const norm = email.toLowerCase().trim();
      if (this.has(norm)) return;
      const all = this.getAll();
      all.push(norm);
      try {
        localStorage.setItem(LS_ALL_EMAILS, JSON.stringify(all));
      } catch (e) {
        console.warn('EmailRegistry: could not persist to localStorage', e);
      }
    },

    /** Total count */
    count() {
      return this.getAll().length;
    }
  };

  /* ── Promo Code Tracker ────────────────────────────────── */
  const PromoTracker = {
    /**
     * Return all promo-code signups.
     * @returns {object[]}
     */
    getAll() {
      try {
        return JSON.parse(localStorage.getItem(LS_PROMO) || '[]');
      } catch (e) {
        return [];
      }
    },

    /**
     * Check if an email already has the promo registered.
     * @param {string} email
     * @returns {boolean}
     */
    has(email) {
      const norm = email.toLowerCase().trim();
      return this.getAll().some(p => p.email === norm);
    },

    /**
     * Save a promo-code user record.
     * @param {string} email
     * @param {string} source  — which form they used
     * @param {object} [extra] — any additional metadata
     */
    save(email, source, extra) {
      if (this.has(email)) return; // idempotent
      const norm = email.toLowerCase().trim();
      const record = {
        id:         Date.now(),
        ts:         new Date().toISOString(),
        email:      norm,
        promo_code: PROMO_CODE,
        promo_perk: '3 months free',
        source:     source || 'unknown',
        name:       (extra && extra.name)    || '',
        company:    (extra && extra.company) || '',
        team_size:  (extra && extra.teamSize) || ''
      };
      const all = this.getAll();
      all.push(record);
      try {
        localStorage.setItem(LS_PROMO, JSON.stringify(all));
      } catch (e) {
        console.warn('PromoTracker: could not persist', e);
      }
      console.log('%c🎁 EARLYBIRD3 promo user saved:', 'color:#f59e0b;font-weight:bold', record);
    },

    /** Count of promo users */
    count() {
      return this.getAll().length;
    },

    /** Export promo users as CSV */
    exportCSV() {
      const users = this.getAll();
      if (!users.length) { alert('No EARLYBIRD3 users yet.'); return; }
      const headers = ['#', 'Timestamp', 'Email', 'Name', 'Company', 'Team Size', 'Promo Code', 'Perk', 'Source'];
      const rows = users.map((u, i) => [
        i + 1,
        u.ts,
        u.email,
        '"' + (u.name     || '').replace(/"/g, '""') + '"',
        '"' + (u.company  || '').replace(/"/g, '""') + '"',
        u.team_size  || '',
        u.promo_code || PROMO_CODE,
        '"' + (u.promo_perk || '3 months free') + '"',
        u.source     || ''
      ]);
      const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'poly-glot-earlybird3-' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click();
      URL.revokeObjectURL(url);
      console.log('%c🎁 EARLYBIRD3 CSV downloaded: ' + users.length + ' user(s)', 'color:#f59e0b;font-weight:bold');
    }
  };

  /* ── Signup Tracker ────────────────────────────────────── */
  const SignupTracker = {
    /**
     * Save a signup record to localStorage.
     * @param {object} data
     */
    save(data) {
      try {
        const signups = this.getAll();
        const record = {
          id:         Date.now(),
          ts:         new Date().toISOString(),
          name:       data.name       || '',
          email:      data.email      || '',
          use_case:   data.use_case   || '',
          language:   data.language   || '',
          gen_count:  data.gen_count  || 0,
          source:     data.source     || '',
          promo_code: data.promo_code || '',
          company:    data.company    || '',
          team_size:  data.team_size  || ''
        };
        signups.push(record);
        localStorage.setItem(LS_SIGNUPS, JSON.stringify(signups));
      } catch (e) {
        console.warn('SignupTracker: could not save', e);
      }
    },

    /** Return all signup records. */
    getAll() {
      try {
        return JSON.parse(localStorage.getItem(LS_SIGNUPS) || '[]');
      } catch (e) {
        return [];
      }
    },

    /** Total signup count */
    count() {
      return this.getAll().length;
    },

    /**
     * Format all signups as a plain-text summary for email.
     * @returns {string}
     */
    toEmailBody() {
      const signups = this.getAll();
      if (!signups.length) return 'No signups recorded in this browser session.';
      let body = '🦜 Poly-Glot Pro Waitlist — Full Signup List\n';
      body += '═══════════════════════════════════════════\n\n';
      signups.forEach((s, i) => {
        body += `#${i + 1}  ${s.name || '(no name)'} <${s.email}>\n`;
        body += `    Company:    ${s.company    || 'not specified'}\n`;
        body += `    Team Size:  ${s.team_size  || 'not specified'}\n`;
        body += `    Use Case:   ${s.use_case   || 'not specified'}\n`;
        body += `    Language:   ${s.language   || 'unknown'}\n`;
        body += `    Gen Count:  ${s.gen_count}\n`;
        body += `    Promo Code: ${s.promo_code || 'none'}\n`;
        body += `    Source:     ${s.source}\n`;
        body += `    Signed up:  ${s.ts}\n\n`;
      });
      body += `═══════════════════════════════════════════\n`;
      body += `Total: ${signups.length} signup(s)\n`;
      body += `EARLYBIRD3 users: ${PromoTracker.count()}\n`;
      body += `Exported: ${new Date().toUTCString()}\n`;
      return body;
    },

    /**
     * Email the full list to Harold via Web3Forms.
     * @returns {Promise}
     */
    emailListToHarold() {
      const body  = this.toEmailBody();
      const count = this.count();
      const fd    = new FormData();
      fd.append('access_key', WEB3_KEY);
      fd.append('subject',    '🦜 Poly-Glot Waitlist Export — ' + count + ' signup(s)');
      fd.append('from_name',  'Poly-Glot Waitlist Tracker');
      fd.append('replyto',    NOTIFY_EMAIL);
      fd.append('name',       'Poly-Glot System');
      fd.append('email',      NOTIFY_EMAIL);
      fd.append('message',    body);

      return fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            console.log('%c🦜 Waitlist export emailed to ' + NOTIFY_EMAIL, 'color:#10b981;font-weight:bold');
          } else {
            const subj  = encodeURIComponent('🦜 Poly-Glot Waitlist Export — ' + count + ' signup(s)');
            const mbody = encodeURIComponent(body);
            window.open('mailto:' + NOTIFY_EMAIL + '?subject=' + subj + '&body=' + mbody);
          }
          return d;
        })
        .catch(() => {
          const subj  = encodeURIComponent('🦜 Poly-Glot Waitlist Export');
          const mbody = encodeURIComponent(body);
          window.open('mailto:' + NOTIFY_EMAIL + '?subject=' + subj + '&body=' + mbody);
        });
    },

    /**
     * Export signups as a downloadable CSV file.
     */
    exportCSV() {
      const signups = this.getAll();
      if (!signups.length) { alert('No signups to export yet.'); return; }
      const headers = ['#', 'Timestamp', 'Name', 'Email', 'Company', 'Team Size', 'Use Case', 'Language', 'Gen Count', 'Promo Code', 'Source'];
      const rows    = signups.map((s, i) => [
        i + 1,
        s.ts,
        '"' + (s.name      || '').replace(/"/g, '""') + '"',
        s.email,
        '"' + (s.company   || '').replace(/"/g, '""') + '"',
        s.team_size  || '',
        '"' + (s.use_case  || '').replace(/"/g, '""') + '"',
        s.language   || '',
        s.gen_count  || 0,
        s.promo_code || '',
        s.source     || ''
      ]);
      const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'poly-glot-waitlist-' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click();
      URL.revokeObjectURL(url);
      console.log('%c🦜 CSV downloaded: ' + signups.length + ' signups', 'color:#10b981;font-weight:bold');
    }
  };

  /* Expose trackers publicly for console access */
  window.PolyGlotWaitlistTracker = SignupTracker;
  window.PolyGlotPromoTracker    = PromoTracker;
  window.PolyGlotEmailRegistry   = EmailRegistry;

  /* ── Feature Usage Tracker ─────────────────────────────── */
  const FeatureUsage = {
    record(feature, detail) {
      try {
        const usage = JSON.parse(localStorage.getItem(LS_USAGE) || '{}');
        if (!usage[feature]) usage[feature] = [];
        usage[feature].push({ ts: new Date().toISOString(), detail: detail || '' });
        localStorage.setItem(LS_USAGE, JSON.stringify(usage));
      } catch (e) {}
    },
    get(feature) {
      try {
        const usage = JSON.parse(localStorage.getItem(LS_USAGE) || '{}');
        return usage[feature] || [];
      } catch (e) {
        return [];
      }
    },
    totalUses() {
      try {
        const usage = JSON.parse(localStorage.getItem(LS_USAGE) || '{}');
        return Object.values(usage).reduce((sum, arr) => sum + arr.length, 0);
      } catch (e) {
        return 0;
      }
    }
  };

  /* ── Utilities ─────────────────────────────────────────── */

  /** GA4 helper — fires events silently if gtag not present */
  function ga(eventName, params) {
    try {
      if (typeof gtag === 'function') {
        gtag('event', 'pg_waitlist_' + eventName, Object.assign({ event_category: 'Waitlist' }, params || {}));
      }
    } catch (e) {}
  }

  function formatCount(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  function shakeField(el) {
    if (!el) return;
    el.classList.remove('pg-shake');
    void el.offsetWidth; // reflow
    el.classList.add('pg-shake');
    setTimeout(() => el.classList.remove('pg-shake'), 500);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ── Counter helpers ───────────────────────────────────── */

  function fetchGlobalCount() {
    return fetch(COUNTER_URL + '/count')
      .then(r => r.json())
      .then(d => {
        const count = typeof d.count === 'number' ? d.count : 0;
        localStorage.setItem(LS_COUNT, count);
        return count;
      })
      .catch(() => {
        const stored = parseInt(localStorage.getItem(LS_COUNT), 10);
        return isNaN(stored) ? SEED_COUNT : stored;
      });
  }

  function incrementGlobalCount() {
    return fetch(COUNTER_URL + '/increment', { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        const count = typeof d.count === 'number' ? d.count : getLocalCount() + 1;
        localStorage.setItem(LS_COUNT, count);
        updateCountDisplays(count);
        return count;
      })
      .catch(() => {
        const next = getLocalCount() + 1;
        localStorage.setItem(LS_COUNT, next);
        updateCountDisplays(next);
        return next;
      });
  }

  function getLocalCount() {
    const stored = parseInt(localStorage.getItem(LS_COUNT), 10);
    return isNaN(stored) ? SEED_COUNT : stored;
  }

  function getCount() {
    return getLocalCount();
  }

  function hasJoined() {
    return !!localStorage.getItem(LS_JOINED);
  }

  function resetBtn(btn, textEl, loadEl) {
    if (btn)    btn.disabled = false;
    if (textEl) textEl.style.display = '';
    if (loadEl) loadEl.style.display = 'none';
  }

  function updateCountDisplays(count) {
    /* Counter displays removed — no developer count shown to users */
  }

  /* ── Notification to Harold on every new signup ─────────── */
  /**
   * Send an immediate email to hwmoses2@icloud.com for each new signup.
   * @param {object} data — { name, email, company, teamSize, source, promoCode }
   */
  function notifyHarold(data) {
    const isPromo   = (data.promoCode || '').toUpperCase() === PROMO_CODE;
    const promoLine = isPromo ? '\n🎁 PROMO CODE: ' + PROMO_CODE + ' — 3 months free' : '';
    const message   =
      '🦜 New Poly-Glot Pro Waitlist Signup\n' +
      '═══════════════════════════════════\n\n' +
      'Name:       ' + (data.name     || 'not provided') + '\n' +
      'Email:      ' + (data.email    || '') + '\n' +
      'Company:    ' + (data.company  || 'not provided') + '\n' +
      'Team Size:  ' + (data.teamSize || 'not provided') + '\n' +
      'Source:     ' + (data.source   || 'unknown') + '\n' +
      'Time:       ' + new Date().toUTCString() +
      promoLine + '\n\n' +
      '─── Total signups in this browser: ' + SignupTracker.count() + ' ───\n' +
      '─── EARLYBIRD3 users:              ' + PromoTracker.count()  + ' ───';

    const subjectTag = isPromo ? '🎁 [EARLYBIRD3] ' : '🦜 ';
    const subject    = subjectTag + 'New Waitlist Signup — ' + (data.email || 'unknown');

    const fd = new FormData();
    fd.append('access_key', WEB3_KEY);
    fd.append('subject',    subject);
    fd.append('from_name',  'Poly-Glot Waitlist');
    fd.append('replyto',    data.email || NOTIFY_EMAIL);
    fd.append('name',       data.name  || 'Waitlist User');
    fd.append('email',      NOTIFY_EMAIL);
    fd.append('message',    message);

    fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          console.log('%c📧 Harold notified of new signup: ' + data.email, 'color:#10b981;font-weight:bold');
        } else {
          console.warn('notifyHarold: Web3Forms returned non-success', d);
        }
      })
      .catch(err => {
        console.warn('notifyHarold: fetch failed (network)', err);
      });
  }

  /* ── Banner ────────────────────────────────────────────── */

  function createBanner() {
    if (localStorage.getItem(LS_DISMISSED)) return;

    const count  = getCount();
    const banner = document.createElement('div');
    banner.id        = 'pg-waitlist-banner';
    banner.className = 'pg-waitlist-banner';
    banner.setAttribute('role', 'banner');
    banner.setAttribute('aria-label', 'Poly-Glot Pro waitlist');

    if (hasJoined()) {
      banner.innerHTML = `
        <div class="pg-banner-inner">
          <div class="pg-banner-left">
            <span class="pg-banner-fire">✅</span>
            <span class="pg-banner-msg">
              <strong>You're on the Pro waitlist!</strong>
              <span class="pg-banner-sub"> You'll get early access + 3 months free at launch.</span>
            </span>
          </div>
          <div class="pg-banner-right">
            <button class="pg-banner-share" id="pg-banner-share-btn">Share 🦜</button>
            <button class="pg-banner-dismiss" id="pg-banner-dismiss-btn" aria-label="Dismiss banner" title="Dismiss">✕</button>
          </div>
        </div>`;
      banner.classList.add('pg-banner-joined');
    } else {
      banner.innerHTML = `
        <div class="pg-banner-inner">
          <div class="pg-banner-left">
            <span class="pg-banner-fire">🔥</span>
            <span class="pg-banner-msg">
              <strong>Poly-Glot Pro — Early Access</strong>
              <span class="pg-banner-sub"> Join the early-access waitlist — get 3 months free at launch.</span>
            </span>
          </div>
          <div class="pg-banner-right">
            <button class="pg-banner-cta" id="pg-banner-cta-btn" aria-label="Join the Pro waitlist">
              🚀 Join Free →
            </button>
            <button class="pg-banner-dismiss" id="pg-banner-dismiss-btn" aria-label="Dismiss banner" title="Dismiss">✕</button>
          </div>
        </div>`;
    }

    document.body.insertBefore(banner, document.body.firstChild);

    const ctaBtn = document.getElementById('pg-banner-cta-btn');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', function () {
        ga('banner_cta_click');
        openWaitlistModal('banner');
      });
    }

    const shareBtn = document.getElementById('pg-banner-share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', function () {
        openWaitlistModal('banner_share');
      });
    }

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
    modal.id        = 'pg-waitlist-modal';
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
            Be among the first to get early access 🚀
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
              <strong>SSO & Team Controls</strong>
              <span>SAML, SCIM, and per-team style rules.</span>
            </div>
          </div>
          <div class="pg-wm-perk">
            <span class="pg-perk-icon">🎁</span>
            <div>
              <strong>3 Months Free</strong>
              <span>Early-access members get the first 3 months on us.</span>
            </div>
          </div>
        </div>

        <!-- Form -->
        <form class="pg-wm-form" id="pg-waitlist-form" novalidate>

          <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">

          <div class="pg-wm-fields">
            <div class="pg-wm-field">
              <label for="pg-wl-name">Name</label>
              <input type="text" id="pg-wl-name" name="name" placeholder="Your name" autocomplete="name">
            </div>
            <div class="pg-wm-field pg-wm-field-required">
              <label for="pg-wl-email">Work Email <span class="pg-wm-req">*</span></label>
              <input type="email" id="pg-wl-email" name="email" placeholder="you@company.com" required autocomplete="email">
            </div>
            <div class="pg-wm-field">
              <label for="pg-wl-role">Role / Use Case</label>
              <select id="pg-wl-role" name="role">
                <option value="">Select your role…</option>
                <option value="frontend">Frontend Developer</option>
                <option value="backend">Backend Developer</option>
                <option value="fullstack">Full-Stack Developer</option>
                <option value="devops">DevOps / SRE</option>
                <option value="ml">ML / AI Engineer</option>
                <option value="manager">Engineering Manager</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="pg-wm-field">
              <label for="pg-wl-promo">Promo Code <span class="pg-wm-promo-hint">(optional)</span></label>
              <input type="text" id="pg-wl-promo" name="promo_code" placeholder="e.g. EARLYBIRD3" autocomplete="off" style="text-transform:uppercase;">
            </div>
          </div>

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
    document.getElementById('pg-modal-backdrop').addEventListener('click', closeWaitlistModal);

    document.getElementById('pg-modal-close').addEventListener('click', function () {
      ga('modal_closed');
      closeWaitlistModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.style.display !== 'none') {
        ga('modal_closed_esc');
        closeWaitlistModal();
      }
    });

    document.getElementById('pg-waitlist-form').addEventListener('submit', handleWaitlistSubmit);

    /* Auto-uppercase the promo code field */
    const promoInput = document.getElementById('pg-wl-promo');
    if (promoInput) {
      promoInput.addEventListener('input', function () {
        const pos = promoInput.selectionStart;
        promoInput.value = promoInput.value.toUpperCase();
        promoInput.setSelectionRange(pos, pos);
      });
    }
  }

  function openWaitlistModal(source) {
    const modal = document.getElementById('pg-waitlist-modal');
    if (!modal) return;

    if (hasJoined()) {
      showAlreadyJoined();
      return;
    }

    modal.style.display = 'flex';
    document.body.classList.add('pg-modal-open');

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
    const form  = document.getElementById('pg-waitlist-form');
    const email = localStorage.getItem(LS_EMAIL) || '';
    if (form) {
      form.innerHTML = `
        <div class="pg-wm-already-joined">
          <div class="pg-wm-checkmark">✅</div>
          <h3>You're on the list!</h3>
          <p>We have <strong>${escapeHtml(email)}</strong> saved. You'll be the first to know when Poly-Glot Pro launches — and you'll get <strong>3 months free</strong>.</p>
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

    const nameEl    = document.getElementById('pg-wl-name');
    const emailEl   = document.getElementById('pg-wl-email');
    const roleEl    = document.getElementById('pg-wl-role');
    const promoEl   = document.getElementById('pg-wl-promo');
    const submitBtn = document.getElementById('pg-wm-submit-btn');
    const btnText   = document.getElementById('pg-wm-btn-text');
    const btnLoad   = document.getElementById('pg-wm-btn-loading');
    const successEl = document.getElementById('pg-wm-success');
    const errorEl   = document.getElementById('pg-wm-error');

    const name      = nameEl    ? nameEl.value.trim()    : '';
    const email     = emailEl   ? emailEl.value.trim()   : '';
    const role      = roleEl    ? roleEl.value            : '';
    const promoCode = promoEl   ? promoEl.value.trim().toUpperCase() : '';

    /* Validate email */
    if (!email || !isValidEmail(email)) {
      shakeField(emailEl);
      if (emailEl) emailEl.focus();
      return;
    }

    /* ── Global email deduplication ── */
    if (EmailRegistry.has(email)) {
      if (errorEl) {
        errorEl.innerHTML =
          '🎉 Great news — you\'re already on our early-access list! ' +
          'We\'ll email <strong>' + escapeHtml(email) + '</strong> the moment Pro launches, ' +
          'and you\'ll get your first 3 months on us. Stay tuned! 🚀';
        errorEl.style.display = 'block';
      }
      ga('duplicate_email_modal');
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (btnText)   btnText.style.display   = 'none';
    if (btnLoad)   btnLoad.style.display   = 'inline';
    if (successEl) successEl.style.display = 'none';
    if (errorEl)   errorEl.style.display   = 'none';

    const isPromo   = promoCode === PROMO_CODE;
    const genCount  = FeatureUsage.totalUses();
    const language  = (function () {
      const sel = document.getElementById('cgLanguage') || document.getElementById('language');
      return sel ? sel.value : '';
    }());

    const fd = new FormData();
    fd.append('access_key', WEB3_KEY);
    fd.append('subject',    (isPromo ? '🎁 [EARLYBIRD3] ' : '🦜 ') + 'Waitlist Signup — ' + email);
    fd.append('from_name',  'Poly-Glot Waitlist');
    fd.append('replyto',    email);
    fd.append('name',       name || email);
    fd.append('email',      email);
    fd.append('role',       role);
    fd.append('promo_code', promoCode || 'none');
    fd.append('promo_perk', isPromo ? '3 months free' : 'standard');
    fd.append('gen_count',  genCount);
    fd.append('language',   language);
    fd.append('source',     'modal');
    fd.append('timestamp',  new Date().toISOString());
    /* honeypot */
    fd.append('_honey', '');

    fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(data => {
        if (!data.success) throw new Error(data.message || 'submission failed');
        onWaitlistSuccess({ name, email, role, promoCode, genCount, language, source: 'modal' }, submitBtn, btnText, btnLoad, successEl, errorEl);
      })
      .catch(() => {
        /* Offline / network error — still register them locally */
        onWaitlistSuccess({ name, email, role, promoCode, genCount, language, source: 'modal_offline' }, submitBtn, btnText, btnLoad, successEl, errorEl);
        ga('waitlist_error');
      });
  }

  /**
   * Shared success handler for the modal form.
   */
  function onWaitlistSuccess(data, submitBtn, btnText, btnLoad, successEl, errorEl) {
    resetBtn(submitBtn, btnText, btnLoad);

    /* Register email globally */
    EmailRegistry.add(data.email);

    /* Persist joined state */
    localStorage.setItem(LS_JOINED, '1');
    localStorage.setItem(LS_EMAIL,   data.email);

    /* Save to full signup log */
    SignupTracker.save({
      name:       data.name,
      email:      data.email,
      use_case:   data.role,
      language:   data.language,
      gen_count:  data.genCount,
      source:     data.source,
      promo_code: data.promoCode
    });

    /* Save promo user if applicable */
    if (data.promoCode === PROMO_CODE) {
      PromoTracker.save(data.email, data.source, { name: data.name });
    }

    /* Notify Harold immediately */
    notifyHarold({ name: data.name, email: data.email, source: data.source, promoCode: data.promoCode });

    FeatureUsage.record('waitlist_joined', data.source);
    ga('waitlist_joined', { source: data.source, promo: data.promoCode || 'none' });

    const isPromo = data.promoCode === PROMO_CODE;
    if (successEl) {
      successEl.innerHTML = isPromo
        ? '🎉 Welcome, early bird! You\'re on the list + your <strong>EARLYBIRD3</strong> promo code is saved — enjoy <strong>3 months free</strong> when Pro launches. Check your inbox! 🚀'
        : '🎉 You\'re in! We\'ll email <strong>' + escapeHtml(data.email) + '</strong> when Pro launches — and you\'ll get 3 months free.';
      successEl.style.display = 'block';
    }

    /* Reset form & increment counter */
    const form = document.getElementById('pg-waitlist-form');
    if (form) form.reset();

    incrementGlobalCount().then(c => updateBannerToJoined(c));
  }

  /* ── Banner: update to "joined" state ──────────────────── */

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
          <span class="pg-banner-sub"> You'll get early access + 3 months free at launch.</span>
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

  /* ── Header button ─────────────────────────────────────── */

  function addHeaderButton() {
    const headerBadges = document.querySelector('.header-badges');
    if (!headerBadges) return;

    const btn     = document.createElement('button');
    btn.className = hasJoined() ? 'pg-header-waitlist-btn pg-header-waitlist-joined' : 'pg-header-waitlist-btn';
    btn.id        = 'pg-header-waitlist-btn';
    btn.innerHTML = hasJoined()
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

    const section     = document.createElement('section');
    section.className = 'pg-waitlist-inline-section';
    section.id        = 'pg-waitlist-section';

    /* NOTE: "developers already waiting" badge/label intentionally removed */
    section.innerHTML = `
      <div class="pg-wis-content">
        <div class="pg-wis-left">
          <div class="pg-wis-eyebrow">🚀 Coming Soon</div>
          <h2 class="pg-wis-heading">Poly-Glot Pro</h2>
          <p class="pg-wis-sub">Unlimited files. Confidence scoring. Team dashboards. Fine-tune export for LLMs.<br>Join the waitlist — get <strong>3 months free</strong> at launch.</p>
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

      const emailEl   = document.getElementById('pg-wis-email');
      const submitBtn = document.getElementById('pg-wis-submit-btn');
      const btnText   = document.getElementById('pg-wis-btn-text');
      const btnLoad   = document.getElementById('pg-wis-btn-load');
      const successEl = document.getElementById('pg-wis-success');
      const errorEl   = document.getElementById('pg-wis-error');

      const email = emailEl ? emailEl.value.trim() : '';

      if (!email || !isValidEmail(email)) {
        shakeField(emailEl);
        if (emailEl) emailEl.focus();
        return;
      }

      /* ── Global email deduplication ── */
      if (EmailRegistry.has(email)) {
        if (errorEl) {
          errorEl.innerHTML =
            '🎉 You\'re already on our early-access list! ' +
            'We\'ll email you the moment Pro launches + <strong>3 months free</strong>. You\'re all set! 🚀';
          errorEl.style.display = 'block';
        }
        ga('duplicate_email_inline');
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (btnText)   btnText.style.display = 'none';
      if (btnLoad)   btnLoad.style.display = 'inline';
      if (successEl) successEl.style.display = 'none';
      if (errorEl)   errorEl.style.display   = 'none';

      const fd = new FormData();
      fd.append('access_key', WEB3_KEY);
      fd.append('subject',    '🦜 New Pro Waitlist Signup — ' + email);
      fd.append('from_name',  'Poly-Glot Waitlist');
      fd.append('replyto',    email);
      fd.append('name',       email);
      fd.append('email',      email);
      fd.append('source',     'inline_section');
      fd.append('timestamp',  new Date().toISOString());
      fd.append('message',
        '🦜 New Poly-Glot Pro Waitlist Signup\n\n' +
        'Email:  ' + email + '\n' +
        'Source: Inline Section\n' +
        'Time:   ' + new Date().toUTCString()
      );

      fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(data => {
          resetBtn(submitBtn, btnText, btnLoad);
          onInlineSuccess(email, successEl, form);
        })
        .catch(() => {
          resetBtn(submitBtn, btnText, btnLoad);
          onInlineSuccess(email, successEl, form);
          ga('waitlist_inline_error');
        });
    });
  }

  /**
   * Shared success handler for the inline section form.
   */
  function onInlineSuccess(email, successEl, form) {
    /* Register email globally */
    EmailRegistry.add(email);

    localStorage.setItem(LS_JOINED, '1');
    localStorage.setItem(LS_EMAIL, email);

    FeatureUsage.record('waitlist_joined', 'inline_section');
    ga('waitlist_joined', { source: 'inline_section' });

    SignupTracker.save({ email: email, source: 'inline_section' });
    notifyHarold({ email: email, source: 'inline_section' });

    if (successEl) {
      successEl.innerHTML = `🎉 You're in! We'll email <strong>${escapeHtml(email)}</strong> when Pro launches.`;
      successEl.style.display = 'block';
    }
    if (form) {
      const row = form.querySelector('.pg-wis-form-row');
      if (row) row.style.display = 'none';
    }

    incrementGlobalCount().then(c => updateBannerToJoined(c));
  }

  /* ── Enterprise form deduplication hook ─────────────────── */
  /**
   * Patch the existing enterprise form (from index.html) to enforce global
   * email deduplication and EARLYBIRD3 promo tracking. We do this by
   * intercepting the form's submit event before the inline handler runs.
   * We use `capture: true` so we see the event first.
   */
  function patchEnterpriseForm() {
    const form = document.getElementById('enterpriseForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      const emailInput = document.getElementById('formEmail');
      const email      = emailInput ? emailInput.value.trim() : '';
      const promoInput = document.getElementById('formPromo'); // may not exist yet
      const promoCode  = promoInput ? promoInput.value.trim().toUpperCase() : '';

      if (!email) return; // let the existing handler validate

      /* ── Global email deduplication ── */
      if (EmailRegistry.has(email)) {
        e.preventDefault();
        e.stopImmediatePropagation();

        /* Re-enable button if it was disabled */
        const submitBtn = document.getElementById('submitBtn');
        const btnText   = document.getElementById('btnText');
        const btnLoading = document.getElementById('btnLoading');
        if (submitBtn)  submitBtn.disabled = false;
        if (btnText)    btnText.style.display  = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';

        const errorMsg = document.getElementById('formError');
        if (errorMsg) {
          errorMsg.innerHTML =
            '🎉 Great news! You\'re already on our VIP waitlist — ' +
            'we\'ll reach out to <strong>' + escapeHtml(email) + '</strong> as soon as a spot opens up. ' +
            'Your early-access status and 3 months free are locked in! 🚀';
          errorMsg.style.display = 'block';
        }

        const successMsg = document.getElementById('formSuccess');
        if (successMsg) successMsg.style.display = 'none';

        ga('duplicate_email_enterprise');
        return;
      }

      /* Not a duplicate — register the email immediately so if Web3Forms
         fires twice (e.g. retry) we don't double-count. The rest of the
         existing submission logic will run normally. */
      EmailRegistry.add(email);

      /* Hook into the existing WaitlistManager.addEmail callback by
         monkey-patching the success path. We listen for formSuccess
         visibility to fire our side-effects. */
      const origAdd = (typeof WaitlistManager !== 'undefined') && WaitlistManager.addEmail
        ? WaitlistManager.addEmail.bind(WaitlistManager)
        : null;

      if (origAdd) {
        WaitlistManager.addEmail = function (em, userData, callback) {
          WaitlistManager.addEmail = origAdd; // restore immediately
          origAdd(em, userData, function (added, count) {
            /* Our side-effects */
            const name      = document.getElementById('formName')     ? document.getElementById('formName').value     : '';
            const company   = document.getElementById('formCompany')  ? document.getElementById('formCompany').value  : '';
            const teamSize  = document.getElementById('formTeamSize') ? document.getElementById('formTeamSize').value : '';

            SignupTracker.save({
              name:      name,
              email:     em,
              company:   company,
              team_size: teamSize,
              source:    'enterprise_form',
              promo_code: promoCode
            });

            if (promoCode === PROMO_CODE) {
              PromoTracker.save(em, 'enterprise_form', { name: name, company: company, teamSize: teamSize });
            }

            notifyHarold({
              name:      name,
              email:     em,
              company:   company,
              teamSize:  teamSize,
              source:    'enterprise_form',
              promoCode: promoCode
            });

            if (typeof callback === 'function') callback(added, count);
          });
        };
      }

    }, true /* capture = true so we run BEFORE the existing handler */);
  }

  /* ── App usage hooks ───────────────────────────────────── */

  function attachAppHooks() {
    /* Track feature usage to surface banner after 2nd use */
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('#generateBtn, #cgGenerateBtn, #whyBtn, #bothBtn, #explainBtn');
      if (!btn) return;

      const lang = (document.getElementById('cgLanguage') || document.getElementById('language'));
      FeatureUsage.record('generate_click', lang ? lang.value : 'unknown');

      /* Show banner after 2nd use if not joined / not dismissed */
      const total = FeatureUsage.totalUses();
      if (total >= 2 && !hasJoined() && !localStorage.getItem(LS_DISMISSED)) {
        const banner = document.getElementById('pg-waitlist-banner');
        if (banner && banner.style.display === 'none') {
          banner.style.display = '';
          banner.classList.add('pg-banner-slide-in');
        }
      }
    });
  }

  /* ── Console tips ──────────────────────────────────────── */

  function printConsoleTips() {
    console.log('%c🦜 Poly-Glot Waitlist — Owner Commands', 'color:#a78bfa;font-size:14px;font-weight:bold;');
    console.log('%c─────────────────────────────────────────────────────────', 'color:#4b5563');
    console.log('%c PolyGlotWaitlist.listSignups()    %c← view all signups as a table', 'color:#7dd3fc;font-weight:600', 'color:#64748b');
    console.log('%c PolyGlotWaitlist.exportCSV()      %c← download signups as .csv',    'color:#7dd3fc;font-weight:600', 'color:#64748b');
    console.log('%c PolyGlotWaitlist.emailList()      %c← email full list to hwmoses2@icloud.com', 'color:#7dd3fc;font-weight:600', 'color:#64748b');
    console.log('%c PolyGlotWaitlist.listPromo()      %c← view EARLYBIRD3 users',       'color:#f59e0b;font-weight:600', 'color:#64748b');
    console.log('%c PolyGlotWaitlist.exportPromoCSV() %c← download EARLYBIRD3 list',    'color:#f59e0b;font-weight:600', 'color:#64748b');
    console.log('%c PolyGlotWaitlist.listEmails()     %c← view all registered emails',  'color:#34d399;font-weight:600', 'color:#64748b');
    console.log('%c─────────────────────────────────────────────────────────', 'color:#4b5563');
    console.log('%c Unique signups (this browser): ' + EmailRegistry.count(), 'color:#10b981;font-weight:600');
    console.log('%c EARLYBIRD3 users:              ' + PromoTracker.count(),  'color:#f59e0b;font-weight:600');
  }

  /* ── Public API ────────────────────────────────────────── */
  window.PolyGlotWaitlist = {
    open:           openWaitlistModal,
    close:          closeWaitlistModal,
    usage:          FeatureUsage,
    tracker:        SignupTracker,
    emailList:      ()  => SignupTracker.emailListToHarold(),
    exportCSV:      ()  => SignupTracker.exportCSV(),
    listSignups:    ()  => { const s = SignupTracker.getAll(); console.table(s); return s; },
    listPromo:      ()  => { const p = PromoTracker.getAll();  console.table(p); return p; },
    exportPromoCSV: ()  => PromoTracker.exportCSV(),
    listEmails:     ()  => { const e = EmailRegistry.getAll(); console.table(e.map((m,i) => ({['#']: i+1, email: m}))); return e; }
  };

  /* ── Boot ──────────────────────────────────────────────── */
  function init() {
    createBanner();
    createModal();
    addHeaderButton();
    addInlineSection();
    patchEnterpriseForm();
    attachAppHooks();
    printConsoleTips();

    /* Fetch real global count and update all displays */
    fetchGlobalCount().then(count => updateCountDisplays(count));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
