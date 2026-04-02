/**
 * Poly-Glot — Pricing Section
 * ────────────────────────────
 * • Monthly / Yearly toggle with animated price swap
 * • Checkout URLs (update variant IDs after LemonSqueezy setup)
 * • Early access CTA hooks into waitlist modal
 * • All prices in USD cents internally
 */

(function () {
  'use strict';

  /* ── Checkout URLs ─────────────────────────────────────
     Stripe Payment Links — replace STRIPE_LINK_* with
     your real buy.stripe.com/... URLs after creating them
     in the Stripe dashboard.
  ──────────────────────────────────────────────────────── */
  const CHECKOUT = {
    pro_monthly:  'https://buy.stripe.com/fZu14pbtacrO9Ii77K14405',
    pro_yearly:   'https://buy.stripe.com/8x214p54M9fCaMmdw814404',
    team_monthly: 'https://buy.stripe.com/bJebJ30Ow1Na6w6ajW14408',
    team_yearly:  'https://buy.stripe.com/00w8wR7cU63q7Aa77K14406',
  };

  const PROMO = 'EARLYBIRD3';

  function checkoutUrl(key) {
    const base = CHECKOUT[key] || '#';
    if (!base || base === '#' || base.startsWith('STRIPE_LINK')) return '#';
    // ?prefilled_promo_code= auto-applies the code at checkout
    // Only works if "Allow promotion codes" is ON for the Payment Link in Stripe dashboard
    // If not enabled, Stripe silently ignores the param — checkout still works fine
    return base + `?prefilled_promo_code=${PROMO}`;
  }

  /* ── Pricing Data ──────────────────────────────────────── */
  const PLANS = [
    {
      id:        'free',
      tier:      'Free Forever',
      name:      'Free',
      monthly:   0,
      yearly:    0,
      desc:      'Perfect for exploring. 50 files/month, always free.',
      cta:       'Start for Free',
      ctaClass:  'pg-cta-free',
      ctaAction: 'scroll',
      popular:   false,
      features: [
        { text: '50 files / month',           check: true  },
        { text: '3 languages',                check: true  },
        { text: 'Web UI',                     check: true  },
        { text: 'JSDoc, PyDoc, Javadoc',      check: true  },
        { text: 'BYOK (bring your own key)',  check: true  },
        { text: 'CLI tool (3 languages)',     check: true  },
        { text: 'Why comments',               check: false },
        { text: 'Confidence scoring',         check: false },
      ],
    },
    {
      id:        'pro',
      tier:      'Most Popular',
      name:      'Pro',
      monthly:   9,
      yearly:    79,
      desc:      'For individual developers who ship fast. 14-day free trial — cancel anytime.',
      cta:       'Start Free Trial →',
      ctaClass:  'pg-cta-pro',
      ctaAction: 'checkout_pro',
      popular:   true,
      features: [
        { text: 'Unlimited files',             check: true },
        { text: 'All 12 languages',            check: true },
        { text: 'CLI tool + VS Code ext.',     check: true },
        { text: 'Why + Both comment modes',    check: true },
        { text: 'Confidence scoring',          check: true, soon: true },
        { text: 'Code quality pre-pass',       check: true, soon: true },
        { text: 'Fine-tune export (JSONL)',    check: true, soon: true },
        { text: 'Email support',               check: true },
      ],
    },
    {
      id:        'team',
      tier:      'Teams',
      name:      'Team',
      monthly:   29,
      yearly:    249,
      desc:      'For engineering teams. Up to 5 seats. 14-day free trial included.',
      cta:       'Start Free Trial →',
      ctaClass:  'pg-cta-team',
      ctaAction: 'checkout_team',
      popular:   false,
      features: [
        { text: 'Everything in Pro',           check: true },
        { text: 'Shared API key pool',         check: true, soon: true },
        { text: 'Team usage dashboard',        check: true, soon: true },
        { text: 'Batch directory processing',  check: true },
        { text: 'Per-member analytics',        check: true, soon: true },
        { text: 'Custom style templates',      check: true, soon: true },
        { text: 'Priority support',            check: true },
        { text: 'Admin panel',                 check: true, soon: true },
      ],
    },
  ];

  /* ── State ─────────────────────────────────────────────── */
  let isYearly = false;
  /* ── Helpers ───────────────────────────────────────────── */
  function savings(plan) {
    if (plan.monthly === 0) return '';
    const monthly = plan.monthly;
    const yearly  = plan.yearly;
    const saved   = (monthly * 12) - yearly;
    return `Save $${saved}/yr`;
  }

  function displayPrice(plan) {
    if (plan.monthly === 0) return 0;
    return isYearly ? Math.round(plan.yearly / 12) : plan.monthly;
  }

  function yearlyTotal(plan) {
    if (plan.monthly === 0) return '';
    if (!isYearly) return '';
    return `$${plan.yearly} billed annually`;
  }

  /* ── Render ────────────────────────────────────────────── */
  function renderCard(plan) {
    const price     = displayPrice(plan);
    const yearlyTot = yearlyTotal(plan);
    const savingsStr = isYearly ? savings(plan) : '';

    // Split features into live and coming-soon
    const liveFeatures = plan.features.filter(f => !f.soon);
    const soonFeatures = plan.features.filter(f => f.soon);

    const featuresHTML = liveFeatures.map(f => `
      <li>
        <span class="pg-feat-check">${f.check ? '✓' : '–'}</span>
        <span style="${!f.check ? 'opacity:0.4' : ''}">${f.text}</span>
      </li>
    `).join('') + (soonFeatures.length ? `
      <li class="pg-feat-coming-soon-row">
        <span class="pg-feat-check" style="color:#475569">+</span>
        <span style="color:#475569;font-size:11px;">${soonFeatures.length} more feature${soonFeatures.length > 1 ? 's' : ''} on the roadmap</span>
      </li>
    ` : '');

    const teamSelectorHTML = '';

    return `
      <div class="pg-pricing-card ${plan.popular ? 'pg-card-popular' : ''}" data-plan="${plan.id}">
        ${plan.popular ? '<div class="pg-popular-badge">⭐ Most Popular</div>' : ''}
        <div class="pg-card-tier">${plan.tier}</div>
        <div class="pg-card-name">${plan.name}</div>
        <div class="pg-card-price-block">
          <div class="pg-card-price">
            ${plan.monthly > 0 ? '<span class="pg-price-currency">$</span>' : ''}
            <span class="pg-price-amount">${plan.monthly === 0 ? 'Free' : price}</span>
            ${plan.monthly > 0 ? '<span style="font-size:13px;color:#64748b;font-family:\'Inter\',sans-serif;padding-bottom:6px;">/mo</span>' : ''}
          </div>
          <div class="pg-price-yearly-note">
            ${yearlyTot ? `<span style="color:#34d399">${yearlyTot}</span>` : (savingsStr ? `<span style="color:#34d399">${savingsStr}</span>` : '&nbsp;')}
          </div>
        </div>
        <div class="pg-card-desc">${plan.desc}</div>
        ${teamSelectorHTML}
        <button class="pg-card-cta ${plan.ctaClass}" data-action="${plan.ctaAction}" data-plan="${plan.id}">
          ${plan.cta}
        </button>
        <div class="pg-card-features-zone">
          <div class="pg-card-divider"></div>
          <div class="pg-features-title">What's included</div>
          <ul class="pg-features-list">${featuresHTML}</ul>
        </div>
      </div>
    `;
  }

  function renderSection() {
    const existing = document.getElementById('pg-pricing-section');
    if (existing) existing.remove();

    const section = document.createElement('section');
    section.id        = 'pg-pricing-section';
    section.className = 'pg-pricing-section';

    section.innerHTML = `
      <div class="pg-pricing-glow"></div>
      <div class="pg-pricing-inner">

        <div class="pg-pricing-eyebrow">
          <span class="pg-pricing-eyebrow-live">
            <svg class="pg-eyebrow-parrot" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <ellipse cx="14" cy="17" rx="7" ry="8" fill="#22c55e"/>
              <ellipse cx="10" cy="18" rx="3" ry="5" fill="#16a34a" transform="rotate(-10 10 18)"/>
              <ellipse cx="18" cy="18" rx="3" ry="5" fill="#4ade80" transform="rotate(10 18 18)"/>
              <circle cx="14" cy="9" r="5.5" fill="#22c55e"/>
              <circle cx="16" cy="8" r="2" fill="#fff"/>
              <circle cx="16.4" cy="8" r="1.1" fill="#1e293b"/>
              <path d="M12.5 10.5 Q11 12.5 12.8 13 Q14 13.4 14.5 11.5 Z" fill="#facc15"/>
              <ellipse cx="12" cy="6.5" rx="2.5" ry="1.5" fill="#4ade80" opacity="0.6"/>
              <path d="M11 23 Q9 26 7.5 25.5 Q9 23 11 22 Z" fill="#16a34a"/>
              <path d="M14 24 Q13.5 27 12 26.5 Q13 24 14 23 Z" fill="#22c55e"/>
              <path d="M17 23 Q19 26 20.5 25.5 Q19 23 17 22 Z" fill="#4ade80"/>
            </svg>
            <span class="pg-eyebrow-dot"></span>
            Poly-Glot AI is Live — Subscriptions Now Open
          </span>
        </div>
        <h2 class="pg-pricing-heading">Simple pricing. Real results.</h2>
        <p class="pg-pricing-sub">
          Start free. Upgrade, downgrade, or cancel anytime.
        </p>
        <div class="pg-pricing-trust">
          <span class="pg-trust-item">🔒 Payments secured by Stripe</span>
          <span class="pg-trust-divider">·</span>
          <span class="pg-trust-item">🚫 We never store your card details</span>
          <span class="pg-trust-divider">·</span>
          <span class="pg-trust-item">↩️ 30-day money-back guarantee</span>
        </div>

        <!-- Toggle -->
        <div class="pg-pricing-toggle">
          <span class="pg-toggle-label ${!isYearly ? 'active' : ''}" id="pg-toggle-monthly">Monthly</span>
          <label class="pg-toggle-switch" title="Switch to yearly billing">
            <input type="checkbox" id="pg-billing-toggle" ${isYearly ? 'checked' : ''}>
            <div class="pg-toggle-track">
              <div class="pg-toggle-thumb"></div>
            </div>
          </label>
          <span class="pg-toggle-label ${isYearly ? 'active' : ''}" id="pg-toggle-yearly">
            Yearly <span class="pg-save-badge">Save up to 30%</span>
          </span>
        </div>

        <!-- Launch promo note -->
        <div class="pg-early-access-note" id="pg-promo-banner">
          <div class="pg-ea-left">
            <span class="pg-ea-icon">⏳</span>
            <div class="pg-ea-text">
              <strong>Early bird pricing — Pro locked at $9/mo forever.</strong>
              <span>Offer expires <strong id="pg-promo-deadline">May 1, 2026</strong> — after that, Pro goes to $12/mo. Use code <strong>EARLYBIRD3</strong> at checkout.</span>
            </div>
          </div>
          <button class="pg-ea-cta" id="pg-ea-join-btn">Start 14-Day Free Trial →</button>
        </div>

        <!-- Cards -->
        <div class="pg-pricing-grid" id="pg-pricing-grid">
          ${PLANS.map(renderCard).join('')}
        </div>

        <!-- Enterprise nudge -->
        <div class="pg-enterprise-nudge">
          <span class="pg-enterprise-nudge__text">Need more than 5 seats, SSO, or a private deployment?</span>
          <a href="#" class="pg-enterprise-nudge__link" id="pg-enterprise-nudge-link">Let's talk →</a>
        </div>

        <!-- FAQ -->
        <div class="pg-pricing-faq">
          <h3 class="pg-faq-heading">Frequently asked questions</h3>
          <div class="pg-faq-grid">
            <div class="pg-faq-item">
              <div class="pg-faq-q">Do I need my own API key?</div>
              <div class="pg-faq-a">Free plan is BYOK (bring your own key). <strong>Pro and above</strong> uses Poly-Glot's API key pool — no setup needed.</div>
            </div>
            <div class="pg-faq-item">
              <div class="pg-faq-q">What happens after the 14-day free trial?</div>
              <div class="pg-faq-a">Your subscription auto-bills at <strong>$9/mo</strong> (early bird rate — locked for life). You'll get an email reminder 3 days before. <strong>Cancel anytime before the trial ends and you won't be charged.</strong></div>
            </div>
            <div class="pg-faq-item">
              <div class="pg-faq-q">Can I switch plans?</div>
              <div class="pg-faq-a">Yes — upgrade or downgrade anytime. <strong>Prorated billing</strong> means you only pay for what you use.</div>
            </div>
            <div class="pg-faq-item">
              <div class="pg-faq-q">Is my code private?</div>
              <div class="pg-faq-a">Always. Your code goes directly from your browser to the AI provider. <strong>Poly-Glot servers never see your code.</strong></div>
            </div>
            <div class="pg-faq-item">
              <div class="pg-faq-q">What payment methods do you accept?</div>
              <div class="pg-faq-a">All major credit cards, Apple Pay, Google Pay, and more — via <strong>Stripe</strong>, which handles all billing and tax compliance globally.</div>
            </div>
            <div class="pg-faq-item">
              <div class="pg-faq-q">Do you offer refunds?</div>
              <div class="pg-faq-a"><strong>30-day money-back guarantee</strong> on all paid plans. No questions asked.</div>
            </div>
            <div class="pg-faq-item pg-faq-item--wide">
              <div class="pg-faq-q">🗂️ What is the largest directory (codebase) Poly-Glot can update with a single command?</div>
              <div class="pg-faq-a">
                <strong>An entire project directory — no upper limit.</strong> Using the <code class="pg-faq-code-inline">--dir</code> flag, the CLI recursively walks every supported source file across your whole codebase and AI-generates comments in one shot across all 12 languages:
                <pre class="pg-faq-pre"><code class="pg-faq-code">poly-glot comment --dir ./your-project</code></pre>
                Use <code class="pg-faq-code-inline">--dry-run</code> to preview, <code class="pg-faq-code-inline">--diff</code> to review changes, and <code class="pg-faq-code-inline">--backup</code> to save originals before overwriting. Point it at your entire monorepo, your <code class="pg-faq-code-inline">src/</code> folder, or any directory — it handles the rest.
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    /* Insert before enterprise section */
    const enterprise = document.querySelector('.enterprise-section');
    if (enterprise) {
      enterprise.parentNode.insertBefore(section, enterprise);
    } else {
      document.body.appendChild(section);
    }

    wireSection(section);
  }

  /* ── Wire interactions ─────────────────────────────────── */
  function wireSection(section) {
    /* Billing toggle */
    const toggle = section.querySelector('#pg-billing-toggle');
    if (toggle) {
      toggle.addEventListener('change', function () {
        isYearly = this.checked;
        updatePrices();
        updateToggleLabels();
        if (typeof gtag === 'function') {
          gtag('event', 'pricing_toggle', { billing: isYearly ? 'yearly' : 'monthly' });
        }
      });
    }

    /* Monthly/yearly labels clickable */
    section.querySelector('#pg-toggle-monthly').addEventListener('click', () => {
      if (isYearly) { isYearly = false; toggle.checked = false; updatePrices(); updateToggleLabels(); }
    });
    section.querySelector('#pg-toggle-yearly').addEventListener('click', () => {
      if (!isYearly) { isYearly = true; toggle.checked = true; updatePrices(); updateToggleLabels(); }
    });

    /* CTA buttons */
    section.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const plan   = btn.dataset.plan;

      if (typeof gtag === 'function') {
        gtag('event', 'pricing_cta_click', { plan, billing: isYearly ? 'yearly' : 'monthly' });
      }

      if (action === 'scroll') {
        document.getElementById('commentGenerator')?.scrollIntoView({ behavior: 'smooth' });
      } else if (action === 'checkout_pro' || action === 'checkout_team') {
        /* ── Stripe checkout ── */
        const billing  = isYearly ? 'yearly' : 'monthly';
        const sizeKey  = action === 'checkout_team' ? 'team' : 'pro';
        const urlKey   = `${sizeKey}_${billing}`;
        const url      = checkoutUrl(urlKey);

        if (typeof gtag === 'function') {
          gtag('event', 'pricing_cta_click', { plan, billing });
        }

        if (!url || url === '#') {
          // Stripe links not yet configured — open login/waitlist as fallback
          if (window.PolyGlotAuth) {
            window.PolyGlotAuth.openLoginModal('pricing_cta');
          } else if (window.PolyGlotWaitlist) {
            window.PolyGlotWaitlist.open('pricing_cta');
          }
        } else {
          // Open Stripe checkout in new tab so user doesn't lose their place
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }
    });

    /* Enterprise nudge — scroll to enterprise contact form */
    const nudgeLink = section.querySelector('#pg-enterprise-nudge-link');
    if (nudgeLink) {
      nudgeLink.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector('.enterprise-section')?.scrollIntoView({ behavior: 'smooth' });
        if (typeof gtag === 'function') gtag('event', 'enterprise_nudge_click');
      });
    }

    /* Early access CTA — scroll to AI Settings / comment generator */
    const eaBtn = section.querySelector('#pg-ea-join-btn');
    if (eaBtn) {
      eaBtn.addEventListener('click', function () {
        var target = document.getElementById('commentGenerator') ||
                     document.getElementById('aiSettingsBtn');
        if (target) {
          var rect      = target.getBoundingClientRect();
          var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          window.scrollTo({ top: rect.top + scrollTop - 24, behavior: 'smooth' });
        }
        if (typeof gtag === 'function') gtag('event', 'pricing_get_started_free_click');
      });
    }
  }

  /* ── Update functions ──────────────────────────────────── */
  function updatePrices() {
    PLANS.forEach(plan => {
      const card = document.querySelector(`[data-plan="${plan.id}"]`);
      if (!card) return;

      const amountEl  = card.querySelector('.pg-price-amount');
      const yearlyEl  = card.querySelector('.pg-price-yearly-note');

      if (amountEl && plan.monthly > 0) {
        const price = displayPrice(plan);
        amountEl.style.transform = 'translateY(-4px)';
        amountEl.style.opacity   = '0';
        setTimeout(() => {
          amountEl.textContent     = price;
          amountEl.style.transform = 'translateY(0)';
          amountEl.style.opacity   = '1';
        }, 120);
      }

      if (yearlyEl) {
        const tot   = yearlyTotal(plan);
        const saved = isYearly ? savings(plan) : '';
        yearlyEl.innerHTML = tot
          ? `<span style="color:#34d399">${tot}</span>`
          : (saved ? `<span style="color:#34d399">${saved}</span>` : '&nbsp;');
      }
    });
  }

  function updateToggleLabels() {
    const mLabel = document.getElementById('pg-toggle-monthly');
    const yLabel = document.getElementById('pg-toggle-yearly');
    if (mLabel) mLabel.classList.toggle('active', !isYearly);
    if (yLabel) yLabel.classList.toggle('active',  isYearly);
  }

  /* ── Deadline countdown ─────────────────────────────────── */
  /* Replaces the old spot-counter with real deadline urgency.  */
  /* Deadline: May 1 2026 00:00:00 UTC                         */
  var DEADLINE = new Date('2026-05-01T00:00:00Z');

  function updateDeadlineCountdown() {
    var el     = document.getElementById('pg-promo-deadline');
    var banner = document.getElementById('pg-promo-banner');
    if (!el) return;

    var now  = new Date();
    var diff = DEADLINE - now;

    if (diff <= 0) {
      // Offer expired — hide banner, update CTA copy
      if (banner) banner.style.display = 'none';
      return;
    }

    var days    = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var mins    = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    var label;
    if (days > 7) {
      label = 'May 1, 2026';
    } else if (days >= 1) {
      label = days + 'd ' + hours + 'h left';
      el.style.color = '#f59e0b';
      el.style.fontWeight = '700';
    } else {
      label = hours + 'h ' + mins + 'm left';
      el.style.color = '#ef4444';
      el.style.fontWeight = '700';
    }
    el.textContent = label;
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    renderSection();
    updateDeadlineCountdown();
    // Refresh countdown every 60 seconds
    setInterval(updateDeadlineCountdown, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
