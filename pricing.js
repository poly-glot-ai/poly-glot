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
     Replace these with real LemonSqueezy variant URLs
     after running: node setup-lemonsqueezy.js
  ──────────────────────────────────────────────────────── */
  const CHECKOUT = {
    pro_monthly:       'https://poly-glot.lemonsqueezy.com/checkout/buy/1459809',
    pro_yearly:        'https://poly-glot.lemonsqueezy.com/checkout/buy/1459821',
    team5_monthly:     'https://poly-glot.lemonsqueezy.com/checkout/buy/1459834',
    team5_yearly:      'https://poly-glot.lemonsqueezy.com/checkout/buy/1459831',
    team15_monthly:    'https://poly-glot.lemonsqueezy.com/checkout/buy/1459834',
    team15_yearly:     'https://poly-glot.lemonsqueezy.com/checkout/buy/1459831',
    enterprise_monthly:'#',
    enterprise_yearly: '#',
  };

  const PROMO = 'EARLYBIRD3';

  function checkoutUrl(key) {
    const base = CHECKOUT[key] || '#';
    return base + (base !== '#' ? `?checkout[discount_code]=${PROMO}` : '');
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
        { text: 'CLI tool',                   check: false },
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
      cta:       'Coming Soon',
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
      monthlyLarge: 59,
      yearlyLarge:  499,
      desc:      'For engineering teams. 5 or 15 seats.',
      cta:       'Coming Soon',
      ctaClass:  'pg-cta-team',
      ctaAction: 'checkout_team',
      popular:   false,
      teamSizes: [
        { label: '5 seats',  monthly: 29,  yearly: 249 },
        { label: '15 seats', monthly: 59,  yearly: 499 },
      ],
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
  let teamSize  = 5; // default 5 seats

  /* ── Helpers ───────────────────────────────────────────── */
  function savings(plan) {
    if (plan.monthly === 0) return '';
    const monthly = plan.id === 'team' ? (teamSize === 15 ? plan.monthlyLarge : plan.monthly) : plan.monthly;
    const yearly  = plan.id === 'team' ? (teamSize === 15 ? plan.yearlyLarge  : plan.yearly)  : plan.yearly;
    const saved   = (monthly * 12) - yearly;
    return `Save $${saved}/yr`;
  }

  function displayPrice(plan) {
    if (plan.monthly === 0) return 0;
    if (plan.id === 'team') {
      const m = teamSize === 15 ? plan.monthlyLarge : plan.monthly;
      const y = teamSize === 15 ? plan.yearlyLarge  : plan.yearly;
      return isYearly ? Math.round(y / 12) : m;
    }
    return isYearly ? Math.round(plan.yearly / 12) : plan.monthly;
  }

  function yearlyTotal(plan) {
    if (plan.monthly === 0) return '';
    if (!isYearly) return '';
    const y = (plan.id === 'team')
      ? (teamSize === 15 ? plan.yearlyLarge : plan.yearly)
      : plan.yearly;
    return `$${y} billed annually`;
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

    const teamSelectorHTML = plan.id === 'team' ? `
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        ${plan.teamSizes.map(s => `
          <button
            class="pg-team-size-btn ${teamSize === parseInt(s.label) ? 'active' : ''}"
            data-size="${parseInt(s.label)}"
            style="
              flex:1;padding:6px 0;border-radius:6px;font-size:12px;font-weight:600;
              font-family:'Inter',sans-serif;cursor:pointer;transition:all 0.2s;
              background:${teamSize === parseInt(s.label) ? 'rgba(125,211,252,0.15)' : 'transparent'};
              border:1.5px solid ${teamSize === parseInt(s.label) ? 'rgba(125,211,252,0.4)' : 'rgba(125,211,252,0.15)'};
              color:${teamSize === parseInt(s.label) ? '#7dd3fc' : '#64748b'};
            "
          >${s.label}</button>
        `).join('')}
      </div>
    ` : '';

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
          <span>💰 Simple, Transparent Pricing</span>
        </div>
        <h2 class="pg-pricing-heading">Start free. Grow when ready.</h2>
        <p class="pg-pricing-sub">
          All plans include a free trial for waitlist members.<br>
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

        <!-- Cards -->
        <div class="pg-pricing-grid" id="pg-pricing-grid">
          ${PLANS.map(renderCard).join('')}
        </div>

        <!-- Early access note -->
        <div class="pg-early-access-note">
          <div class="pg-ea-left">
            <span class="pg-ea-icon">🎁</span>
            <div class="pg-ea-text">
              <strong>On the waitlist? Get 3 months free.</strong>
              <span>Use code <strong>EARLYBIRD3</strong> at checkout — applied automatically for waitlist members.</span>
            </div>
          </div>
          <button class="pg-ea-cta" id="pg-ea-join-btn">Join Waitlist Free →</button>
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
              <div class="pg-faq-a">All major credit cards, PayPal, and more — via <strong>LemonSqueezy</strong>, which handles all billing and tax compliance globally.</div>
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
        /* ── PAYMENTS COMING SOON — re-enable after LemonSqueezy approval ── */
        const existing = document.getElementById('pg-coming-soon-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.id = 'pg-coming-soon-toast';
        toast.style.cssText = [
          'position:fixed','bottom:32px','left:50%','transform:translateX(-50%)',
          'background:#1a1d27','border:1px solid #7dd3fc','color:#f0f9ff',
          'padding:14px 28px','border-radius:10px','font-size:14px','font-weight:500',
          'box-shadow:0 8px 32px rgba(0,0,0,0.4)','z-index:99999',
          'display:flex','align-items:center','gap:10px','white-space:nowrap'
        ].join(';');
        toast.innerHTML = '🔜 <span>Payments launching very soon — <strong>join the waitlist</strong> for early access!</span>';
        toast.style.cursor = 'pointer';
        toast.addEventListener('click', function () {
          toast.remove();
          if (window.PolyGlotWaitlist) window.PolyGlotWaitlist.open('pricing_toast');
        });
        document.body.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
      }
    });

    /* Team size selector */
    section.addEventListener('click', function (e) {
      const btn = e.target.closest('.pg-team-size-btn');
      if (!btn) return;
      teamSize = parseInt(btn.dataset.size, 10);
      updateTeamCard();
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

  function updateTeamCard() {
    const card = document.querySelector('[data-plan="team"]');
    if (!card) return;
    const plan = PLANS.find(p => p.id === 'team');

    /* Update price */
    const amountEl = card.querySelector('.pg-price-amount');
    if (amountEl) amountEl.textContent = displayPrice(plan);

    /* Update yearly note */
    const yearlyEl = card.querySelector('.pg-price-yearly-note');
    if (yearlyEl) {
      const tot   = yearlyTotal(plan);
      const saved = isYearly ? savings(plan) : '';
      yearlyEl.innerHTML = tot
        ? `<span style="color:#34d399">${tot}</span>`
        : (saved ? `<span style="color:#34d399">${saved}</span>` : '&nbsp;');
    }

    /* Update button styles */
    card.querySelectorAll('.pg-team-size-btn').forEach(btn => {
      const size    = parseInt(btn.dataset.size, 10);
      const active  = size === teamSize;
      btn.style.background    = active ? 'rgba(125,211,252,0.15)' : 'transparent';
      btn.style.borderColor   = active ? 'rgba(125,211,252,0.4)'  : 'rgba(125,211,252,0.15)';
      btn.style.color         = active ? '#7dd3fc' : '#64748b';
    });
  }

  function updateToggleLabels() {
    const mLabel = document.getElementById('pg-toggle-monthly');
    const yLabel = document.getElementById('pg-toggle-yearly');
    if (mLabel) mLabel.classList.toggle('active', !isYearly);
    if (yLabel) yLabel.classList.toggle('active',  isYearly);
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    renderSection();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
