/**
 * Poly-Glot — LemonSqueezy: Fetch Variant IDs
 * Run AFTER manually creating products in dashboard:
 * LEMONSQUEEZY_API_KEY=xxx node get-variant-ids.js
 */

const API_KEY = process.env.LEMONSQUEEZY_API_KEY;
const STORE_ID = '329358';

async function api(path) {
  const res = await fetch('https://api.lemonsqueezy.com/v1' + path, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/vnd.api+json',
    },
  });
  return res.json();
}

async function main() {
  console.log('🦜 Poly-Glot — Fetching LemonSqueezy Variant IDs\n');

  const products = await api(`/products?filter[store_id]=${STORE_ID}`);

  if (!products.data || products.data.length === 0) {
    console.log('❌ No products found. Create them manually first (see instructions below).\n');
    printInstructions();
    return;
  }

  console.log(`✅ Found ${products.data.length} product(s):\n`);

  const output = { store_id: STORE_ID, variants: [], promo_code: 'EARLYBIRD3', discount_id: '977965' };

  for (const product of products.data) {
    const { name, status } = product.attributes;
    console.log(`📦 ${name} (ID: ${product.id}, status: ${status})`);

    const variants = await api(`/variants?filter[product_id]=${product.id}`);
    for (const v of variants.data) {
      const { name: vname, price, interval, status: vstatus } = v.attributes;
      const priceFormatted = `$${(price / 100).toFixed(2)}`;
      const checkoutUrl = `https://poly-glot.lemonsqueezy.com/checkout/buy/${v.id}?checkout[discount_code]=EARLYBIRD3`;
      console.log(`   💲 ${vname} — ${priceFormatted}/${interval || 'once'} (variant ID: ${v.id})`);
      console.log(`      → ${checkoutUrl}`);
      output.variants.push({
        product: name,
        variant: vname,
        id: v.id,
        price,
        interval,
        checkout_url: checkoutUrl,
      });
    }
    console.log('');
  }

  const fs = require('fs');
  fs.writeFileSync('lemonsqueezy-ids.json', JSON.stringify(output, null, 2));
  console.log('💾 Saved to lemonsqueezy-ids.json');
  console.log('\n📋 Copy these variant IDs into pricing.js CHECKOUT object.\n');
}

function printInstructions() {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CREATE PRODUCTS MANUALLY IN LEMONSQUEEZY DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Go to: https://app.lemonsqueezy.com/products

Create 4 products with these settings:

──────────────────────────────────────────────
1. POLY-GLOT PRO — MONTHLY
   Price: $9.00 / month (recurring)
   Name: "Poly-Glot Pro Monthly"

2. POLY-GLOT PRO — YEARLY  
   Price: $79.00 / year (recurring)
   Name: "Poly-Glot Pro Yearly"

3. POLY-GLOT TEAM — MONTHLY
   Price: $29.00 / month (recurring)
   Name: "Poly-Glot Team Monthly"

4. POLY-GLOT TEAM — YEARLY
   Price: $249.00 / year (recurring)
   Name: "Poly-Glot Team Yearly"
──────────────────────────────────────────────

After creating all 4, run this script again:
  node get-variant-ids.js

EARLYBIRD3 promo code is already created ✅
Discount ID: 977965
  `);
}

main().catch(e => {
  console.error('❌ Failed:', e.message);
  process.exit(1);
});
