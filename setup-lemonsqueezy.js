#!/usr/bin/env node
/**
 * Poly-Glot — LemonSqueezy Automated Setup
 * ─────────────────────────────────────────
 * Creates all products, variants, and promo codes via API.
 *
 * Usage:
 *   LEMONSQUEEZY_API_KEY=your_key node setup-lemonsqueezy.js
 *
 * What it creates:
 *   • 1 Store product per tier (Pro, Team Small, Team Large, Enterprise)
 *   • Monthly + Yearly variants for each
 *   • EARLYBIRD3 promo code (100% off, 3 months, all products)
 */

const API_KEY   = process.env.LEMONSQUEEZY_API_KEY;
const BASE_URL  = 'https://api.lemonsqueezy.com/v1';

if (!API_KEY) {
  console.error('❌ Set LEMONSQUEEZY_API_KEY env variable first.');
  console.error('   export LEMONSQUEEZY_API_KEY=your_key_here');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Accept':        'application/vnd.api+json',
  'Content-Type':  'application/vnd.api+json',
};

async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`❌ API Error ${res.status}:`, JSON.stringify(data, null, 2));
    throw new Error(`API ${res.status}`);
  }
  return data;
}

/* ── Product Definitions ──────────────────────────────── */
const PRODUCTS = [
  {
    name:        'Poly-Glot Pro',
    description: 'Unlimited files, all 12 languages, CLI, VS Code extension, why-comments, confidence scoring, and fine-tune export. For individual developers.',
    variants: [
      { name: 'Pro Monthly', interval: 'month', interval_count: 1,  price: 900  }, // $9.00
      { name: 'Pro Yearly',  interval: 'year',  interval_count: 1,  price: 7900 }, // $79.00
    ],
  },
  {
    name:        'Poly-Glot Team (5 seats)',
    description: 'Everything in Pro plus 5 seats, shared API key pool, team usage dashboard, batch directory processing, and priority support.',
    variants: [
      { name: 'Team Small Monthly', interval: 'month', interval_count: 1, price: 2900  }, // $29.00
      { name: 'Team Small Yearly',  interval: 'year',  interval_count: 1, price: 24900 }, // $249.00
    ],
  },
  {
    name:        'Poly-Glot Team (15 seats)',
    description: 'Everything in Team Small plus 15 seats, admin panel, per-member analytics, custom templates, and Slack support.',
    variants: [
      { name: 'Team Large Monthly', interval: 'month', interval_count: 1, price: 5900  }, // $59.00
      { name: 'Team Large Yearly',  interval: 'year',  interval_count: 1, price: 49900 }, // $499.00
    ],
  },
  {
    name:        'Poly-Glot Enterprise',
    description: 'Everything in Team Large plus unlimited seats, SSO/SAML, audit logs, private deployment, SLA, and dedicated onboarding.',
    variants: [
      { name: 'Enterprise Monthly', interval: 'month', interval_count: 1, price: 9900  }, // $99.00
      { name: 'Enterprise Yearly',  interval: 'year',  interval_count: 1, price: 89900 }, // $899.00
    ],
  },
];

async function main() {
  console.log('🦜 Poly-Glot — LemonSqueezy Setup\n');

  /* Step 1: Get store */
  console.log('📦 Fetching your store...');
  const storesRes = await api('GET', '/stores');
  const store     = storesRes.data[0];
  const storeId   = store.id;
  console.log(`✅ Store: ${store.attributes.name} (ID: ${storeId})\n`);

  const createdVariantIds = [];

  /* Step 2: Create products + variants */
  for (const product of PRODUCTS) {
    console.log(`\n🛒 Creating product: ${product.name}`);

    const productRes = await api('POST', '/products', {
      data: {
        type: 'products',
        attributes: {
          name:        product.name,
          description: product.description,
        },
        relationships: {
          store: { data: { type: 'stores', id: String(storeId) } },
        },
      },
    });

    const productId = productRes.data.id;
    console.log(`   ✅ Product created (ID: ${productId})`);

    for (const variant of product.variants) {
      console.log(`   💲 Creating variant: ${variant.name} ($${(variant.price / 100).toFixed(2)}/${variant.interval})`);

      const variantRes = await api('POST', '/variants', {
        data: {
          type: 'variants',
          attributes: {
            name:           variant.name,
            price:          variant.price,
            is_subscription: true,
            interval:       variant.interval,
            interval_count: variant.interval_count,
            has_free_trial: false,
          },
          relationships: {
            product: { data: { type: 'products', id: String(productId) } },
          },
        },
      });

      const variantId = variantRes.data.id;
      createdVariantIds.push({ name: variant.name, id: variantId, price: variant.price });
      console.log(`   ✅ Variant created (ID: ${variantId})`);
    }
  }

  /* Step 3: Create EARLYBIRD3 promo code */
  console.log('\n🎁 Creating EARLYBIRD3 promo code...');

  const discountRes = await api('POST', '/discounts', {
    data: {
      type: 'discounts',
      attributes: {
        name:              'Early Access — 3 Months Free',
        code:              'EARLYBIRD3',
        amount:            100,           // 100% off
        amount_type:       'percent',
        is_limited_to_subscriptions: true,
        duration:          'repeating',
        duration_in_months: 3,            // 3 months free, then full price
        is_limited_redemptions: false,    // unlimited uses
        starts_at:         null,
        expires_at:        null,
      },
      relationships: {
        store: { data: { type: 'stores', id: String(storeId) } },
      },
    },
  });

  const discountId = discountRes.data.id;
  console.log(`✅ Promo code EARLYBIRD3 created (ID: ${discountId})`);
  console.log('   → 100% off for 3 months, then auto-bills at full price\n');

  /* Step 4: Print checkout URLs */
  console.log('\n🔗 Checkout URLs (share these or use in site):');
  console.log('─────────────────────────────────────────────');
  createdVariantIds.forEach(v => {
    const url = `https://poly-glot.lemonsqueezy.com/checkout/buy/${v.id}?checkout[discount_code]=EARLYBIRD3`;
    console.log(`\n${v.name} ($${(v.price/100).toFixed(2)})`);
    console.log(`  ${url}`);
  });

  /* Step 5: Save IDs to file */
  const output = {
    store_id:    storeId,
    discount_id: discountId,
    promo_code:  'EARLYBIRD3',
    variants:    createdVariantIds,
    created_at:  new Date().toISOString(),
  };

  const fs = require('fs');
  fs.writeFileSync('lemonsqueezy-ids.json', JSON.stringify(output, null, 2));
  console.log('\n\n💾 All IDs saved to lemonsqueezy-ids.json');
  console.log('\n🦜 Setup complete! Share checkout URLs with your waitlist.\n');
}

main().catch(e => {
  console.error('❌ Setup failed:', e.message);
  process.exit(1);
});
