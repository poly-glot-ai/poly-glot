/**
 * Poly-Glot Auth Worker
 * ─────────────────────
 * POST /api/auth/login           — generate + email a magic link
 * POST /api/auth/verify          — validate magic-link token → session
 * POST /api/auth/refresh         — validate session token (non-destructive)
 * POST /api/auth/validate-key    — verify OpenAI/Anthropic/Google key (zero tokens)
 * POST /api/auth/track-usage     — server-side file counter (50/mo free limit)
 * GET  /api/auth/get-usage       — return current usage for a session token
 * POST /api/auth/webhook/stripe  — Stripe webhook: activate plan on payment
 * POST /api/auth/set-plan        — admin: manually set a plan for an email
 * POST /api/auth/check-plan      — extension/CLI: verify session → { valid, plan }
 *
 * KV binding : AUTH_KV
 * Env vars   : RESEND_API_KEY, BASE_URL, STRIPE_WEBHOOK_SECRET, ADMIN_SECRET
 */

/* ── Version gate ─────────────────────────────────────────────────────────── */
const MINIMUM_CLI_VERSION = '2.1.15';

function semverLt(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) < (pb[i] || 0)) return true;
    if ((pa[i] || 0) > (pb[i] || 0)) return false;
  }
  return false;
}

function checkVersion(request) {
  const clientVersion = (request.headers.get('X-CLI-Version') || '').trim();
  if (!clientVersion) return null;
  if (semverLt(clientVersion, MINIMUM_CLI_VERSION)) {
    return json({
      error: 'upgrade_required',
      message: `🚫 poly-glot v${clientVersion} is no longer supported.\n\nRun: npm install -g poly-glot-ai-cli\n\nThen: poly-glot login\n\nFree accounts get ${getFreeLimit()} files/month. Pro is $9/mo at poly-glot.ai`,
      minimum_version: MINIMUM_CLI_VERSION,
    }, 426);
  }
  return null;
}

/* ── Disposable email domain blocklist ─────────────────────────────────────── */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','guerrillamail.net','guerrillamail.org',
  'guerrillamail.biz','guerrillamail.de','guerrillamailblock.com',
  'tempmail.com','tempmail.net','tempmail.org','temp-mail.org','temp-mail.io',
  'throwam.com','throwaway.email','sharklasers.com','guerrillamail.info',
  'grr.la','guerrillamail.biz','spam4.me','yopmail.com','yopmail.fr',
  'cool.fr.nf','jetable.fr.nf','nospam.ze.tc','nomail.xl.cx','mega.zik.dj',
  'speed.1s.fr','courriel.fr.nf','moncourrier.fr.nf','monemail.fr.nf',
  'monmail.fr.nf','maildrop.cc','mailnull.com','mailnull.net',
  'dispostable.com','fakeinbox.com','filzmail.com','spamgourmet.com',
  'trashmail.at','trashmail.com','trashmail.io','trashmail.me','trashmail.net',
  'trashmail.org','trashmail.xyz','discard.email','spamspot.com','spamtrap.ro',
  'spamevader.com','anonbox.net','anonymbox.com','dispostable.com',
  'throwam.com','mailexpire.com','spamfree24.org','spamfree.eu',
  'mailzilla.org','inoutmail.eu','inoutmail.info','inoutmail.net','inoutmail.de',
  'filzmail.com','spamfree.eu','spamgourmet.net','spamgourmet.org',
]);

const CORS = {
  'Access-Control-Allow-Origin':  'https://poly-glot.ai',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function preflight() {
  return new Response(null, { status: 204, headers: CORS });
}

async function randomToken() {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* Returns YYYY-MM key for the current UTC month */
function monthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const PAID_PLANS = ['pro', 'team', 'enterprise'];
const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days

/* ── Magic link email HTML ───────────────────────────────────────────────── */
function magicLinkEmail(magicUrl, email) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your Poly-Glot magic link</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#161b27;border-radius:16px;border:1px solid rgba(139,92,246,0.2);overflow:hidden;max-width:560px;width:100%;">
      <tr>
        <td style="background:linear-gradient(135deg,#1e1b4b 0%,#1e1035 100%);padding:32px 40px 28px;text-align:center;border-bottom:1px solid rgba(139,92,246,0.15);">
          <div style="font-size:28px;font-weight:800;letter-spacing:-0.5px;color:#fff;">🦜 Poly-Glot</div>
          <div style="font-size:13px;color:#a78bfa;margin-top:4px;letter-spacing:0.05em;text-transform:uppercase;">AI Code Comment Generator</div>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 40px 32px;">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#f1f5f9;line-height:1.3;">Your magic link is ready ✨</h1>
          <p style="margin:0 0 8px;font-size:15px;color:#94a3b8;line-height:1.6;">Click the button below to sign in to Poly-Glot. This link expires in <strong style="color:#c4b5fd;">15 minutes</strong> and can only be used once.</p>
          <p style="margin:0 0 28px;font-size:13px;color:#64748b;">Signing in as: <strong style="color:#a78bfa;">${email}</strong></p>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center">
                <a href="${magicUrl}" style="display:inline-block;padding:15px 36px;background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.01em;box-shadow:0 4px 20px rgba(124,58,237,0.4);">Sign in to Poly-Glot →</a>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0;font-size:12px;color:#475569;text-align:center;line-height:1.6;">Button not working? Copy and paste this link into your browser:<br><a href="${magicUrl}" style="color:#7c3aed;word-break:break-all;font-size:11px;">${magicUrl}</a></p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">If you didn't request this, you can safely ignore this email.<br>Your account will not be affected.</p>
          <p style="margin:10px 0 0;font-size:11px;color:#334155;">© 2026 Poly-Glot · <a href="https://poly-glot.ai" style="color:#7c3aed;text-decoration:none;">poly-glot.ai</a></p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/* ── Plan-activated email HTML ─────────────────────────────────────────────── */
function planActivatedEmail(email, plan) {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Your Poly-Glot ${planLabel} plan is active</title></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#161b27;border-radius:16px;border:1px solid rgba(52,211,153,0.2);overflow:hidden;max-width:560px;width:100%;">
      <tr>
        <td style="background:linear-gradient(135deg,#052e16 0%,#0f1f2e 100%);padding:32px 40px 28px;text-align:center;border-bottom:1px solid rgba(52,211,153,0.15);">
          <div style="font-size:28px;font-weight:800;color:#fff;">🦜 Poly-Glot</div>
          <div style="font-size:13px;color:#34d399;margin-top:4px;letter-spacing:0.05em;text-transform:uppercase;">${planLabel} Plan — Active</div>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 40px 32px;">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#f1f5f9;">🎉 You're on ${planLabel}!</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">Thank you for subscribing. Your <strong style="color:#34d399;">${planLabel} plan</strong> is now active on <strong style="color:#a78bfa;">${email}</strong>.</p>
          <p style="margin:0 0 8px;font-size:14px;color:#94a3b8;">To activate Pro features in VS Code or the CLI, sign in with this email:</p>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center" style="padding:8px 0 24px;">
                <a href="https://poly-glot.ai/?source=payment-email" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#16a34a 0%,#059669 100%);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">Sign in to activate →</a>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 6px;font-size:13px;color:#64748b;font-weight:600;">VS Code extension:</p>
          <p style="margin:0 0 16px;font-size:13px;color:#64748b;">Open Command Palette → <strong>Poly-Glot: Configure License Token</strong> → paste your session token after signing in.</p>
          <p style="margin:0 0 6px;font-size:13px;color:#64748b;font-weight:600;">CLI:</p>
          <p style="margin:0 0 0;font-size:13px;color:#64748b;">Run <code style="background:#1e293b;padding:2px 6px;border-radius:4px;color:#7dd3fc;">poly-glot login</code> and enter this email address.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:11px;color:#334155;">© 2026 Poly-Glot · <a href="https://poly-glot.ai" style="color:#34d399;text-decoration:none;">poly-glot.ai</a></p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

async function sendMagicLinkEmail(env, email, magicUrl) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'Poly-Glot <noreply@poly-glot.ai>',
      to:      [email],
      subject: 'Your Poly-Glot magic link',
      html:    magicLinkEmail(magicUrl, email),
    }),
  });
  if (!res.ok) { console.error('Resend error:', res.status, await res.text()); return false; }
  return true;
}

async function sendPlanActivatedEmail(env, email, plan) {
  if (!env.RESEND_API_KEY) return;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'Poly-Glot <noreply@poly-glot.ai>',
        to:      [email],
        subject: `Your Poly-Glot ${planLabel} plan is now active 🎉`,
        html:    planActivatedEmail(email, plan),
      }),
    });
  } catch (e) { console.error('Plan email error:', e.message); }
}

/** POST /api/auth/login */
async function handleLogin(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Valid email required' }, 400);
  }

  const domain = email.split('@')[1] || '';
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return json({ error: 'Disposable email addresses are not allowed. Please use a real email.' }, 400);
  }

  // Rate limit: 1 magic link per email per 60s
  const rateLimitKey = `ratelimit:${email}`;
  const limited = await env.AUTH_KV.get(rateLimitKey);
  if (limited) {
    return json({ error: 'A link was already sent. Please wait 60 seconds and try again.' }, 429);
  }

  // Fingerprint-based rate limit: max 3 unique emails per device fingerprint per day
  // Prevents multiple-email abuse from the same machine
  const fingerprint = (body.fingerprint || '').trim();
  if (fingerprint) {
    const fpEmailsKey = `fp-emails:${fingerprint}`;
    const fpEmailsRaw = await env.AUTH_KV.get(fpEmailsKey);
    const fpEmails    = fpEmailsRaw ? JSON.parse(fpEmailsRaw) : [];
    if (!fpEmails.includes(email)) {
      if (fpEmails.length >= 3) {
        return json({
          error: 'Too many accounts created from this device. Please use an existing account or contact support@poly-glot.ai.',
        }, 429);
      }
      fpEmails.push(email);
      // TTL: 24 hours — resets daily
      await env.AUTH_KV.put(fpEmailsKey, JSON.stringify(fpEmails), { expirationTtl: 86400 });
    }
  }

  const token = await randomToken();
  const existingPlan = await env.AUTH_KV.get(`plan:${email}`) || 'free';

  await env.AUTH_KV.put(
    `token:${token}`,
    JSON.stringify({ email, plan: existingPlan, created: Date.now() }),
    { expirationTtl: 900 }
  );
  await env.AUTH_KV.put(rateLimitKey, '1', { expirationTtl: 60 });

  const baseUrl = env.BASE_URL || 'https://poly-glot.ai';
  // source param for UTM attribution on login page
  const source = (body.source || '').trim();
  const magicUrl = `${baseUrl}/?token=${token}&plan=${existingPlan}&email=${encodeURIComponent(email)}${source ? `&source=${encodeURIComponent(source)}` : ''}`;

  const sent = await sendMagicLinkEmail(env, email, magicUrl);
  if (!sent) {
    await env.AUTH_KV.delete(`token:${token}`);
    return json({ error: 'Email delivery failed — please try again in a moment.' }, 502);
  }

  incrementPromoCount(env, email).catch(() => {});
  return json({ ok: true });
}

/** POST /api/auth/verify — magic link token → long-lived session */
async function handleVerify(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const token = (body.token || '').trim();
  if (!token) return json({ error: 'Token required' }, 400);

  const raw = await env.AUTH_KV.get(`token:${token}`);
  if (!raw) return json({ error: 'Invalid or expired token' }, 401);

  let data;
  try { data = JSON.parse(raw); } catch { return json({ error: 'Malformed token data' }, 500); }

  // One-time use — delete magic link token immediately
  await env.AUTH_KV.delete(`token:${token}`);

  const { email } = data;
  // Always read the authoritative plan from KV (may have been upgraded since login)
  const plan = await env.AUTH_KV.get(`plan:${email}`) || data.plan || 'free';

  const sessionPayload = JSON.stringify({ email, plan, created: Date.now() });
  await env.AUTH_KV.put(`session:${token}`, sessionPayload, { expirationTtl: SESSION_TTL });

  return json({ email, plan, session: token, valid: true });
}

/** POST /api/auth/refresh — validate a session token (non-destructive) */
async function handleRefresh(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const token = (body.token || '').trim();
  if (!token) return json({ error: 'Token required' }, 400);

  const raw = await env.AUTH_KV.get(`session:${token}`);
  if (!raw) return json({ error: 'Invalid or expired session' }, 401);

  let data;
  try { data = JSON.parse(raw); } catch { return json({ error: 'Malformed session data' }, 500); }

  // Always re-read plan from authoritative KV key (catches upgrades)
  const livePlan = await env.AUTH_KV.get(`plan:${data.email}`) || data.plan || 'free';

  // If plan changed, patch the session record in place
  if (livePlan !== data.plan) {
    data.plan = livePlan;
    await env.AUTH_KV.put(`session:${token}`, JSON.stringify(data), { expirationTtl: SESSION_TTL });
  }

  return json({ email: data.email, plan: livePlan, valid: true });
}

/**
 * POST /api/auth/check-plan
 * Unified endpoint for extension + CLI license verification.
 * Accepts either a session token or a licenseToken (both stored as session: keys).
 * Returns { valid: bool, plan: string, email: string }
 * Never destroys the token — safe to call repeatedly.
 */
async function handleCheckPlan(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ valid: false, plan: 'free', error: 'Invalid JSON' }, 400); }

  const token = (body.token || '').trim();
  if (!token) return json({ valid: false, plan: 'free', error: 'Token required' }, 400);

  // Try session: key first (normal flow)
  const sessionRaw = await env.AUTH_KV.get(`session:${token}`);
  if (sessionRaw) {
    let data;
    try { data = JSON.parse(sessionRaw); } catch { return json({ valid: false, plan: 'free', error: 'Malformed session' }, 500); }
    const livePlan = await env.AUTH_KV.get(`plan:${data.email}`) || data.plan || 'free';
    if (livePlan !== data.plan) {
      data.plan = livePlan;
      await env.AUTH_KV.put(`session:${token}`, JSON.stringify(data), { expirationTtl: SESSION_TTL });
    }
    return json({ valid: true, plan: livePlan, email: data.email });
  }

  return json({ valid: false, plan: 'free', error: 'Invalid or expired token' }, 401);
}

const PROMO_LIMIT = 50;

async function handlePromoCount(env) {
  const raw   = await env.AUTH_KV.get('promo:count');
  const count = raw ? parseInt(raw, 10) : 0;
  const remaining = Math.max(0, PROMO_LIMIT - count);
  return json({ count, limit: PROMO_LIMIT, remaining });
}

async function incrementPromoCount(env, email) {
  const seenKey = `promo:seen:${email}`;
  const seen    = await env.AUTH_KV.get(seenKey);
  if (seen) return;
  await env.AUTH_KV.put(seenKey, '1');
  const raw   = await env.AUTH_KV.get('promo:count');
  const count = raw ? parseInt(raw, 10) : 0;
  await env.AUTH_KV.put('promo:count', String(count + 1));
}

/** POST /api/auth/validate-key */
async function handleValidateKey(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON' }, 400); }

  const provider = (body.provider || 'openai').toLowerCase();
  const apiKey   = (body.apiKey   || '').trim();

  if (!apiKey) return json({ ok: false, error: 'API key required' }, 400);

  try {
    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (res.ok) return json({ ok: true });
      const err = await res.json().catch(() => ({}));
      return json({ ok: false, error: err?.error?.message || `OpenAI returned ${res.status}` });

    } else if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      });
      if (res.ok) return json({ ok: true });
      const err = await res.json().catch(() => ({}));
      return json({ ok: false, error: err?.error?.message || `Anthropic returned ${res.status}` });

    } else if (provider === 'google') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
      );
      if (res.ok) return json({ ok: true });
      const err = await res.json().catch(() => ({}));
      return json({ ok: false, error: err?.error?.message || `Google returned ${res.status}` });

    } else {
      return json({ ok: false, error: 'Unknown provider — use openai, anthropic, or google' }, 400);
    }
  } catch (e) {
    return json({ ok: false, error: e.message || 'Network error' }, 502);
  }
}

/* ── Stripe Webhook ──────────────────────────────────────────────────────────
 * Handles checkout.session.completed and customer.subscription.* events.
 * Writes plan:${email} to KV and patches all active sessions for that email.
 * Also refreshes the session plan cache so next /refresh returns the new plan.
 */
async function handleStripeWebhook(request, env) {
  const sig     = request.headers.get('Stripe-Signature') || '';
  const rawBody = await request.text();

  // Verify Stripe signature if secret is configured
  if (env.STRIPE_WEBHOOK_SECRET) {
    const valid = await verifyStripeSignature(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
    if (!valid) return json({ error: 'Invalid signature' }, 400);
  }

  let event;
  try { event = JSON.parse(rawBody); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const type = event.type || '';
  let email = '';
  let plan  = 'free';

  // checkout.session.completed — new subscription started
  if (type === 'checkout.session.completed') {
    const obj = event.data?.object || {};
    email = (obj.customer_email || obj.customer_details?.email || '').toLowerCase().trim();
    // Map Stripe price IDs to plan names via metadata or amount
    plan = stripePlanFromSession(obj);
  }
  // customer.subscription.updated — plan change or renewal
  else if (type === 'customer.subscription.updated' || type === 'customer.subscription.created') {
    const obj = event.data?.object || {};
    email = await emailFromStripeCustomer(obj.customer, env);
    plan  = stripePlanFromSubscription(obj);
  }
  // customer.subscription.deleted — cancellation
  else if (type === 'customer.subscription.deleted') {
    const obj = event.data?.object || {};
    email = await emailFromStripeCustomer(obj.customer, env);
    plan  = 'free';
  }
  // invoice.payment_succeeded — renewal guard (belt-and-suspenders)
  else if (type === 'invoice.payment_succeeded') {
    const obj = event.data?.object || {};
    email = (obj.customer_email || '').toLowerCase().trim();
    if (!email) { return json({ received: true }); }
    // Refresh plan from existing KV rather than overwriting (subscription.updated handles promotion)
    const existingPlan = await env.AUTH_KV.get(`plan:${email}`) || 'free';
    plan = existingPlan; // just keep what we have — subscription.updated already set it
  }
  else {
    // Unhandled event type — acknowledge without processing
    return json({ received: true });
  }

  if (!email) return json({ received: true, warning: 'No email found in event' });

  // Write authoritative plan to KV (no TTL — persists until subscription.deleted)
  await activatePlan(env, email, plan);

  return json({ received: true, email, plan });
}

/**
 * Core plan-activation logic — used by webhook, set-plan, and any future flows.
 * 1. Writes plan:${email}
 * 2. Patches all active session: keys for this email so /refresh picks it up instantly
 * 3. Sends plan-activated email (only on upgrades, not on 'free')
 */
async function activatePlan(env, email, plan) {
  const prevPlan = await env.AUTH_KV.get(`plan:${email}`) || 'free';
  await env.AUTH_KV.put(`plan:${email}`, plan);

  // Patch active session keys — list sessions owned by this email
  // We store a reverse-index: sessions:{email} = comma-separated list of token keys
  const sessionIndex = await env.AUTH_KV.get(`sessions:${email}`) || '';
  const tokens = sessionIndex.split(',').filter(Boolean);

  for (const tok of tokens) {
    const sessionRaw = await env.AUTH_KV.get(`session:${tok}`);
    if (!sessionRaw) continue;
    try {
      const data = JSON.parse(sessionRaw);
      data.plan = plan;
      await env.AUTH_KV.put(`session:${tok}`, JSON.stringify(data), { expirationTtl: SESSION_TTL });
    } catch { /* non-fatal */ }
  }

  // Send email notification on first upgrade (free → paid)
  const isUpgrade = PAID_PLANS.includes(plan) && !PAID_PLANS.includes(prevPlan);
  if (isUpgrade) {
    sendPlanActivatedEmail(env, email, plan).catch(() => {});
  }
}

/** Register a session token in the per-email reverse index */
async function indexSession(env, email, token) {
  const existing = await env.AUTH_KV.get(`sessions:${email}`) || '';
  const tokens   = existing.split(',').filter(Boolean);
  if (!tokens.includes(token)) {
    tokens.push(token);
    // Keep last 20 sessions per user — trim oldest
    const trimmed = tokens.slice(-20);
    await env.AUTH_KV.put(`sessions:${email}`, trimmed.join(','));
  }
}

/* Map Stripe checkout session to plan name */
function stripePlanFromSession(obj) {
  // Check metadata first (set this in your Stripe payment links)
  const meta = obj.metadata || {};
  if (meta.plan) return meta.plan.toLowerCase();

  // Fallback: map by amount_total (in cents)
  const amount = obj.amount_total || 0;
  if (amount >= 24900) return 'team';   // Team Yearly
  if (amount >= 2900)  return 'team';   // Team Monthly
  if (amount >= 7900)  return 'pro';    // Pro Yearly
  if (amount >= 900)   return 'pro';    // Pro Monthly
  return 'pro'; // default paid = pro
}

/* Map Stripe subscription to plan name */
function stripePlanFromSubscription(obj) {
  const meta = obj.metadata || {};
  if (meta.plan) return meta.plan.toLowerCase();
  // Check items
  const items = obj.items?.data || [];
  for (const item of items) {
    const amount = item.price?.unit_amount || 0;
    if (amount >= 24900) return 'team';
    if (amount >= 2900)  return 'team';
    if (amount >= 900)   return 'pro';
  }
  return obj.status === 'active' ? 'pro' : 'free';
}

/* Fetch email for a Stripe customer ID — cached in KV */
async function emailFromStripeCustomer(customerId, env) {
  if (!customerId) return '';
  // Check cache first
  const cached = await env.AUTH_KV.get(`stripe_customer:${customerId}`);
  if (cached) return cached;
  // Don't have STRIPE_SECRET_KEY to call Stripe API directly from worker easily
  // Fall back to empty string — webhook handlers that carry email in the event body take priority
  return '';
}

/* Minimal Stripe signature verification using Web Crypto */
async function verifyStripeSignature(body, header, secret) {
  try {
    const parts   = header.split(',').reduce((acc, part) => {
      const [k, v] = part.split('=');
      if (k === 't') acc.t = v;
      if (k === 'v1') acc.v1 = v;
      return acc;
    }, { t: '', v1: '' });

    if (!parts.t || !parts.v1) return false;

    const payload   = `${parts.t}.${body}`;
    const keyBytes  = new TextEncoder().encode(secret);
    const msgBytes  = new TextEncoder().encode(payload);
    const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig       = await crypto.subtle.sign('HMAC', cryptoKey, msgBytes);
    const sigHex    = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

    return sigHex === parts.v1;
  } catch { return false; }
}

/**
 * POST /api/auth/set-plan
 * Admin endpoint to manually set a plan for any email.
 * Requires ADMIN_SECRET env var to be set.
 * Body: { secret: 'admin-secret', email: 'user@example.com', plan: 'pro' }
 */
async function handleSetPlan(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const adminSecret = (env.ADMIN_SECRET || '').trim();
  if (!adminSecret) return json({ error: 'Admin endpoint not configured' }, 503);
  if ((body.secret || '').trim() !== adminSecret) return json({ error: 'Unauthorized' }, 401);

  const email = (body.email || '').trim().toLowerCase();
  const plan  = (body.plan  || 'free').trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Valid email required' }, 400);
  }
  if (!['free', 'pro', 'team', 'enterprise'].includes(plan)) {
    return json({ error: 'plan must be free, pro, team, or enterprise' }, 400);
  }

  await activatePlan(env, email, plan);
  return json({ ok: true, email, plan });
}

/* ── Anonymous device tracking ───────────────────────────────────────────── */
const ANON_LIFETIME_LIMIT = 5; // anonymous devices — lifetime, not monthly

/* ── REGISTER-DEVICE ─────────────────────────────────────────────────────── */
async function handleRegisterDevice(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const fingerprint = (body.fingerprint || '').trim();
  let deviceId = (body.deviceId || '').trim();

  // Check if this machine fingerprint already has a device registered
  // Prevents VM resets and multiple registrations per machine
  if (fingerprint) {
    const fpKey = `fingerprint:${fingerprint}`;
    const existingId = await env.AUTH_KV.get(fpKey);
    if (existingId) {
      const existing = await env.AUTH_KV.get(`device:${existingId}`);
      if (existing) {
        const d = JSON.parse(existing);
        return json({ ok: true, deviceId: existingId, used: d.used || 0, limit: ANON_LIFETIME_LIMIT });
      }
    }
  }

  // If deviceId provided, verify it exists
  if (deviceId) {
    const existing = await env.AUTH_KV.get(`device:${deviceId}`);
    if (existing) {
      const d = JSON.parse(existing);
      // Verify fingerprint matches — prevent deviceId sharing across machines
      if (fingerprint && d.fingerprint && d.fingerprint !== fingerprint) {
        // Fingerprint mismatch — this deviceId belongs to a different machine
        // Register a new device for this machine
        deviceId = '';
      } else {
        return json({ ok: true, deviceId, used: d.used || 0, limit: ANON_LIFETIME_LIMIT });
      }
    }
  }

  // Create new device record
  deviceId = await randomToken();
  const record = {
    used:        0,
    createdAt:   Date.now(),
    source:      body.source || 'vscode',
    fingerprint: fingerprint || '',
  };
  await env.AUTH_KV.put(`device:${deviceId}`, JSON.stringify(record));

  // Index fingerprint → deviceId (1 device per machine, ever)
  if (fingerprint) {
    await env.AUTH_KV.put(`fingerprint:${fingerprint}`, deviceId);
  }

  // Increment global device counter
  const countRaw = await env.AUTH_KV.get('devices:count');
  await env.AUTH_KV.put('devices:count', String((countRaw ? parseInt(countRaw, 10) : 0) + 1));

  return json({ ok: true, deviceId, used: 0, limit: ANON_LIFETIME_LIMIT });
}

/* ── DEVICE-USAGE ─────────────────────────────────────────────────────────── */
async function handleDeviceUsage(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const deviceId    = (body.deviceId    || '').trim();
  const fingerprint = (body.fingerprint || '').trim();
  if (!deviceId) return json({ ok: false, error: 'deviceId required' }, 400);

  const key = `device:${deviceId}`;
  const raw = await env.AUTH_KV.get(key);
  if (!raw) return json({ ok: false, error: 'Unknown device — please re-register' }, 404);

  const record = JSON.parse(raw);

  // Fingerprint verification — detect VM resets or deviceId sharing
  if (fingerprint && record.fingerprint && record.fingerprint !== fingerprint) {
    // Fingerprint changed — this is a VM reset or copied device state
    // Check if the new fingerprint has its own registered device
    const fpKey = `fingerprint:${fingerprint}`;
    const altId = await env.AUTH_KV.get(fpKey);
    if (altId && altId !== deviceId) {
      // Different machine — redirect to its own device record
      const altRaw = await env.AUTH_KV.get(`device:${altId}`);
      if (altRaw) {
        const altRecord = JSON.parse(altRaw);
        const used = altRecord.used || 0;
        if (used >= ANON_LIFETIME_LIMIT) {
          return json({ ok: false, limitReached: true, used, limit: ANON_LIFETIME_LIMIT, remaining: 0 }, 403);
        }
        altRecord.used = used + 1;
        altRecord.lastAt = Date.now();
        await env.AUTH_KV.put(`device:${altId}`, JSON.stringify(altRecord));
        return json({ ok: true, used: altRecord.used, limit: ANON_LIFETIME_LIMIT, remaining: ANON_LIFETIME_LIMIT - altRecord.used, limitReached: altRecord.used >= ANON_LIFETIME_LIMIT });
      }
    }
    // New fingerprint with no device — register it and count from 0
    // But first check global rate limit: max 3 devices per day per IP
    const newDeviceId = await randomToken();
    const newRecord   = { used: 1, createdAt: Date.now(), source: 'vscode', fingerprint };
    await env.AUTH_KV.put(`device:${newDeviceId}`, JSON.stringify(newRecord));
    await env.AUTH_KV.put(fpKey, newDeviceId);
    return json({ ok: true, used: 1, limit: ANON_LIFETIME_LIMIT, remaining: ANON_LIFETIME_LIMIT - 1, limitReached: false });
  }

  const used = record.used || 0;

  // Already over limit
  if (used >= ANON_LIFETIME_LIMIT) {
    return json({ ok: false, limitReached: true, used, limit: ANON_LIFETIME_LIMIT, remaining: 0 }, 403);
  }

  const newUsed    = used + 1;
  record.used      = newUsed;
  record.lastAt    = Date.now();
  if (fingerprint) record.fingerprint = fingerprint; // update fingerprint if changed
  await env.AUTH_KV.put(key, JSON.stringify(record));

  return json({
    ok:           true,
    used:         newUsed,
    limit:        ANON_LIFETIME_LIMIT,
    remaining:    ANON_LIFETIME_LIMIT - newUsed,
    limitReached: newUsed >= ANON_LIFETIME_LIMIT,
  });
}

/* ── Usage tracking ──────────────────────────────────────────────────────── */
const FREE_MONTHLY_LIMIT = 50;

async function handleTrackUsage(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON' }, 400); }

  const token = (body.token || '').trim();
  const count = parseInt(body.count, 10) || 1;

  if (!token) return json({ ok: false, error: 'Session token required' }, 401);

  const raw = await env.AUTH_KV.get(`token:${token}`);
  let email, plan;

  if (raw) {
    try { ({ email, plan } = JSON.parse(raw)); } catch { return json({ ok: false, error: 'Malformed session' }, 500); }
  } else {
    const sessionRaw = await env.AUTH_KV.get(`session:${token}`);
    if (!sessionRaw) return json({ ok: false, error: 'Invalid session' }, 401);
    try { ({ email, plan } = JSON.parse(sessionRaw)); } catch { return json({ ok: false, error: 'Malformed session' }, 500); }
  }

  // Always read live plan
  plan = (await env.AUTH_KV.get(`plan:${email}`) || plan || 'free').toLowerCase();
  const isPaid = PAID_PLANS.includes(plan);

  if (isPaid) {
    const usageKey = `usage:${email}:${monthKey()}`;
    const cur = parseInt(await env.AUTH_KV.get(usageKey) || '0', 10);
    const newCount = cur + count;
    await env.AUTH_KV.put(usageKey, String(newCount), { expirationTtl: 35 * 24 * 60 * 60 });
    return json({ ok: true, used: newCount, limit: null, remaining: null, plan });
  }

  const usageKey = `usage:${email}:${monthKey()}`;
  const cur = parseInt(await env.AUTH_KV.get(usageKey) || '0', 10);

  if (cur >= FREE_MONTHLY_LIMIT) {
    return json({ ok: false, error: 'Monthly limit reached', used: cur, limit: FREE_MONTHLY_LIMIT, remaining: 0, plan }, 403);
  }

  const newCount = Math.min(cur + count, FREE_MONTHLY_LIMIT);
  await env.AUTH_KV.put(usageKey, String(newCount), { expirationTtl: 35 * 24 * 60 * 60 });

  return json({ ok: true, used: newCount, limit: FREE_MONTHLY_LIMIT, remaining: FREE_MONTHLY_LIMIT - newCount, plan });
}

async function handleGetUsage(request, env) {
  const url   = new URL(request.url);
  const token = (url.searchParams.get('token') || '').trim();

  if (!token) return json({ error: 'Token required' }, 401);

  const sessionRaw = await env.AUTH_KV.get(`session:${token}`);
  if (!sessionRaw) return json({ error: 'Invalid session' }, 401);

  let email, plan;
  try { ({ email, plan } = JSON.parse(sessionRaw)); } catch { return json({ error: 'Malformed session' }, 500); }

  // Always read live plan
  plan = (await env.AUTH_KV.get(`plan:${email}`) || plan || 'free').toLowerCase();
  const isPaid   = PAID_PLANS.includes(plan);
  const usageKey = `usage:${email}:${monthKey()}`;
  const used     = parseInt(await env.AUTH_KV.get(usageKey) || '0', 10);

  return json({
    used,
    limit:     isPaid ? null : FREE_MONTHLY_LIMIT,
    remaining: isPaid ? null : Math.max(0, FREE_MONTHLY_LIMIT - used),
    plan,
  });
}

/* ── Proxy handlers (unchanged) ──────────────────────────────────────────── */
function isAllowedOrigin(request) {
  const origin  = request.headers.get('Origin')     || '';
  const referer = request.headers.get('Referer')    || '';
  const ua      = request.headers.get('User-Agent') || '';
  return origin.startsWith('https://poly-glot.ai') ||
         referer.startsWith('https://poly-glot.ai') ||
         ua.startsWith('poly-glot-');
}

async function handleVscProxy(request) {
  if (!isAllowedOrigin(request)) return json({ error: 'Forbidden' }, 403);
  try {
    const body = await request.text();
    const res  = await fetch(
      'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery',
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':       'application/json;api-version=3.0-preview.1',
          'User-Agent':   'poly-glot-dashboard/1.0',
        },
        body: body || JSON.stringify({
          filters: [{ criteria: [{ filterType: 7, value: 'poly-glot-ai.poly-glot' }] }],
          flags: 914
        }),
      }
    );
    const data = await res.json();
    return json(data, res.status);
  } catch(e) {
    return json({ error: 'VSC proxy error: ' + e.message }, 502);
  }
}

async function handleGhProxy(request) {
  const url      = new URL(request.url);
  const endpoint = url.searchParams.get('endpoint') || 'health';
  const GH_APP_BASE = 'https://poly-glot-github-app.onrender.com';
  const allowed = ['health', 'stats'];
  if (!allowed.includes(endpoint)) return json({ error: 'Invalid endpoint' }, 400);
  try {
    const res  = await fetch(`${GH_APP_BASE}/${endpoint}`, {
      headers: { 'User-Agent': 'poly-glot-dashboard/1.0' },
    });
    const data = await res.json().catch(() => ({}));
    return json(data, res.status);
  } catch(e) {
    return json({ error: 'GH App proxy error: ' + e.message }, 502);
  }
}

async function handleCwsProxy(env) {
  try {
    const clientId     = env.CWS_CLIENT_ID     || '';
    const clientSecret = env.CWS_CLIENT_SECRET || '';
    const refreshToken = env.CWS_REFRESH_TOKEN || '';
    const extensionId  = env.CWS_EXTENSION_ID  || 'hjpdgilolgcanemmngagpobdgdhpplai';

    if (!clientId || !clientSecret || !refreshToken) {
      return new Response(JSON.stringify({ installs: 0, error: 'CWS OAuth secrets not configured' }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=300', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type:    'refresh_token',
      }),
    });
    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ installs: 0, error: 'OAuth token exchange failed: ' + (tokenData.error || 'unknown') }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=60', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const cwsRes = await fetch(
      `https://www.googleapis.com/chromewebstore/v1.1/items/${extensionId}?projection=DRAFT`,
      { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
    );
    const cwsData = await cwsRes.json().catch(() => ({}));
    const installs = parseInt(cwsData.userCount || cwsData.installCount || '0', 10) || 0;

    return new Response(JSON.stringify({ installs }), {
      headers: {
        'Content-Type':                'application/json',
        'Cache-Control':               'max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ installs: 0, error: e.message }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=60', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

/**
 * POST /api/auth/free-signup
 * "Start for Free" button — website pricing card, VS Code extension (1.4.38+).
 * Identical to /api/auth/login but:
 *  - Always sets plan to 'free' for brand-new emails (never downgrades existing paid)
 *  - source is always 'free_signup' for attribution
 */
async function handleFreeSignup(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Valid email required' }, 400);
  }

  // Never downgrade a paying user — only set 'free' for brand-new accounts
  const existingPlan = await env.AUTH_KV.get(`plan:${email}`);
  if (!existingPlan) {
    await env.AUTH_KV.put(`plan:${email}`, 'free');
  }

  // Delegate to handleLogin with source attribution baked in
  const enriched = new Request(request.url, {
    method:  'POST',
    headers: request.headers,
    body:    JSON.stringify({ email, source: 'free_signup', fingerprint: body.fingerprint || '' }),
  });
  return handleLogin(enriched, env);
}

/** Main fetch handler */
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return preflight();

    const url      = new URL(request.url);
    const pathname = url.pathname.replace(/\/$/, '');

    // Stripe webhook — skip version check (not a CLI client)
    // Handle both the canonical path AND the legacy path already configured in Stripe
    if (pathname === '/api/auth/webhook/stripe' || pathname === '/api/auth/stripe-webhook') {
      return handleStripeWebhook(request, env);
    }

    // Version gate — reject CLI clients older than MINIMUM_CLI_VERSION
    const versionError = checkVersion(request);
    if (versionError) return versionError;

    // GET endpoints
    if (request.method === 'GET') {
      if (pathname === '/api/auth/promo-count') return handlePromoCount(env);
      if (pathname === '/api/auth/get-usage')   return handleGetUsage(request, env);
      if (pathname === '/api/auth/gh-proxy')    return handleGhProxy(request);
      if (pathname === '/api/auth/cws-proxy')   return handleCwsProxy(env);
      return json({ error: 'Not found' }, 404);
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    // POST endpoints
    if (pathname === '/api/auth/login')            return handleLogin(request, env);
    if (pathname === '/api/auth/free-signup')      return handleFreeSignup(request, env);
    if (pathname === '/api/auth/verify')           return handleVerify(request, env);
    if (pathname === '/api/auth/refresh')          return handleRefresh(request, env);
    if (pathname === '/api/auth/check-plan')       return handleCheckPlan(request, env);
    if (pathname === '/api/auth/set-plan')         return handleSetPlan(request, env);
    if (pathname === '/api/auth/validate-key')     return handleValidateKey(request, env);
    if (pathname === '/api/auth/track-usage')      return handleTrackUsage(request, env);
    if (pathname === '/api/auth/register-device')  return handleRegisterDevice(request, env);
    if (pathname === '/api/auth/device-usage')     return handleDeviceUsage(request, env);
    if (pathname === '/api/auth/vsc-proxy')        return handleVscProxy(request);

    return json({ error: 'Not found' }, 404);
  },
};
