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
    pro_monthly:       'https://buy.stripe.com/bJe3cx7cU1Na4nY8bO14400',
    pro_yearly:        'https://buy.stripe.com/00w5kF40I0J62fQ63G14401',
    team_monthly:      'https://buy.stripe.com/9B65kFfJq9fCbQq3Vy14402',
    team_yearly:       'https://buy.stripe.com/4gM4gBcxeajGdYyajW14403',
    enterprise_monthly:'#',
    enterprise_yearly: '#',
  };

  const PROMO = 'EARLYBIRD3';

  function checkoutUrl(key) {
    const base = CHECKOUT[key] || '#';
    if (!base || base === '#' || base.startsWith('STRIPE_LINK')) return '#';
    // Stripe Payment Links accept ?prefilled_promo_code= for auto-applying coupons
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
      desc:      'Perfect for exploring. No credit card required.',
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
      desc:      'For individual developers who ship fast.',
      cta:       'Get Started →',
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
      desc:      'For engineering teams. Up to 5 seats.',
      cta:       'Get Started →',
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
    {
      id:        'enterprise',
      tier:      'Enterprise',
      name:      'Enterprise',
      monthly:   99,
      yearly:    899,
      desc:      'For large teams with compliance and custom needs.',
      cta:       'Contact Sales →',
      ctaClass:  'pg-cta-enterprise',
      ctaAction: 'scroll_enterprise',
      popular:   false,
      features: [
        { text: 'Everything in Team',          check: true },
        { text: 'Unlimited seats',             check: true },
        { text: 'SSO / SAML',                  check: true, soon: true },
        { text: 'Audit logs',                  check: true, soon: true },
        { text: 'Private deployment',          check: true, soon: true },
        { text: 'SLA guarantee',               check: true },
        { text: 'Dedicated onboarding',        check: true },
        { text: 'White-label option',          check: true, soon: true },
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

    const featuresHTML = plan.features.map(f => `
      <li>
        <span class="pg-feat-check">${f.check ? '✓' : '–'}</span>
        <span style="${!f.check ? 'opacity:0.4' : ''}">${f.text}${f.soon ? '<span class="pg-feat-soon">Soon</span>' : ''}</span>
      </li>
    `).join('');

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
        <div class="pg-card-divider"></div>
        <div class="pg-features-title">What's included</div>
        <ul class="pg-features-list">${featuresHTML}</ul>
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
          Start free, no credit card required.<br>
          Upgrade, downgrade, or cancel anytime.
        </p>

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
            <span class="pg-ea-icon">🎁</span>
            <div class="pg-ea-text">
              <strong>Early bird offer — get 3 months free on any paid plan.</strong>
              <span>Use code <strong>EARLYBIRD3</strong> at checkout. <span id="pg-promo-countdown" class="pg-promo-countdown">Loading spots…</span></span>
            </div>
          </div>
          <button class="pg-ea-cta" id="pg-ea-join-btn" onclick="
            var el = document.getElementById('pg-pricing-grid');
            if(el) el.scrollIntoView({behavior:'smooth'});
          ">Get Started Free →</button>
        </div>

        <!-- Cards -->
        <div class="pg-pricing-grid" id="pg-pricing-grid">
          ${PLANS.map(renderCard).join('')}
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
              <div class="pg-faq-q">What happens after the 3 free months?</div>
              <div class="pg-faq-a">Your subscription auto-bills at the standard rate. You'll get an email reminder 7 days before. <strong>Cancel anytime.</strong></div>
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
      } else if (action === 'scroll_enterprise') {
        document.querySelector('.enterprise-section')?.scrollIntoView({ behavior: 'smooth' });
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
          window.location.href = url;
        }
      }
    });

    /* Early access CTA */
    const eaBtn = section.querySelector('#pg-ea-join-btn');
    if (eaBtn) {
      eaBtn.addEventListener('click', function () {
        if (window.PolyGlotWaitlist) {
          window.PolyGlotWaitlist.open('pricing');
        } else {
          const wlSection = document.getElementById('pg-waitlist-section');
          if (wlSection) wlSection.scrollIntoView({ behavior: 'smooth' });
        }
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

  /* ── Promo countdown ────────────────────────────────────── */
  function loadPromoCount() {
    fetch('https://poly-glot.ai/api/auth/promo-count', { cache: 'no-store' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var banner    = document.getElementById('pg-promo-banner');
        var countdown = document.getElementById('pg-promo-countdown');
        if (!banner || !countdown) return;

        var remaining = data.remaining != null ? data.remaining : (data.limit - data.count);

        if (remaining <= 0) {
          // Hide banner entirely — offer exhausted
          banner.style.display = 'none';
          return;
        }

        // Update text with live count
        countdown.textContent = remaining + ' of 50 spots remaining.';
        countdown.classList.add('pg-promo-countdown--live');

        // Pulse urgency colours
        if (remaining <= 10) {
          countdown.classList.add('pg-promo-countdown--urgent');
        }
      })
      .catch(function() {
        // Network failure — show static fallback, don't break
        var countdown = document.getElementById('pg-promo-countdown');
        if (countdown) countdown.textContent = 'Limited spots remaining.';
      });
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    renderSection();
    loadPromoCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
