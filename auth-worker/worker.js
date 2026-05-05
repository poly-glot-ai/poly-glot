/**
 * ============================================================
 *  Poly-Glot AI — Auth + Usage Worker
 *  Cloudflare Worker — production-ready
 * ============================================================
 *
 *  Endpoints
 *  ---------
 *  POST /api/auth/login              — request a magic-link email
 *  POST /api/auth/verify             — verify token (one-time use, deletes token)
 *  POST /api/auth/refresh            — validate session token, return email + plan
 *  POST /api/auth/set-plan           — admin: set plan for email
 *  POST /api/usage/get               — get current month usage + limit for session
 *  POST /api/usage/increment         — increment usage counter by N files
 *  GET  /api/auth/get-usage          — CLI alias: get usage via ?token= query param
 *  POST /api/auth/track-usage        — CLI alias: increment usage (body: {token, count})
 *  POST /api/auth/free-signup        — "Start for Free" signup (email → magic link, plan=free)
 *  POST /api/stripe/webhook          — Stripe webhook: subscription lifecycle events
 *  OPTIONS *                         — CORS preflight → 204
 *
 *  KV bindings   : AUTH_KV
 *  Env secrets   : RESEND_API_KEY, BASE_URL, ADMIN_SECRET
 *
 *  KV key schema
 *  -------------
 *  ratelimit:{email}           → "1"                (TTL = 60 s)
 *  token:{token}               → JSON payload       (TTL = 900 s)
 *  session:{token}             → JSON payload       (TTL = 30 days)
 *  plan:{email}                → plan string        (no TTL — permanent)
 *  usage:{email}:{YYYY-MM}     → integer string     (TTL = 35 days)
 *  stripe:{customerId}         → email              (no TTL — permanent)
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const RATE_LIMIT_TTL  = 60;          // 1 request per email per 60 seconds
const TOKEN_TTL       = 900;         // 15 minutes (magic link)
const SESSION_TTL     = 30 * 24 * 60 * 60; // 30 days

// ── Usage / quota constants ───────────────────────────────────────────────
const FREE_MONTHLY_LIMIT = 50;       // files per calendar month (UTC)
const USAGE_TTL          = 35 * 24 * 60 * 60; // 35 days — outlasts the month
const PRO_PLANS          = ['pro', 'team', 'enterprise'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://poly-glot.ai',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

/** Attach CORS headers to any existing Response. */
function withCors(response) {
  const res = new Response(response.body, response);
  for (const [key, val] of Object.entries(CORS_HEADERS)) {
    res.headers.set(key, val);
  }
  return res;
}

/** Build a JSON Response with CORS headers already attached. */
function jsonResponse(data, status = 200) {
  return withCors(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

/** Generate a cryptographically secure 32-byte (64 hex char) token. */
function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Very basic but solid email validation. */
function isValidEmail(email) {
  return (
    typeof email === 'string' &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  );
}

// ── Disposable / throwaway email domain blocklist ─────────────────────────────
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com','10minutemail.net','10minutemail.org','10minutemail.de',
  '10minutemail.nl','10minutemail.be','10minutemail.co.uk','10minutemail.info',
  '10minutemail.us','10minemail.com','10mail.org','10minutemail.cf',
  'mailinator.com','guerrillamail.com','guerrillamail.net','guerrillamail.org',
  'guerrillamail.biz','guerrillamail.de','guerrillamail.info',
  'tempmail.com','temp-mail.org','temp-mail.io','throwam.com',
  'sharklasers.com','guerrillamailblock.com','grr.la','guerrillamail.de',
  'spam4.me','yopmail.com','yopmail.fr','cool.fr.nf','jetable.fr.nf',
  'nospam.ze.tc','nomail.xl.cx','mega.zik.dj','speed.1s.fr',
  'courriel.fr.nf','moncourrier.fr.nf','monemail.fr.nf',
  'dispostable.com','mailnull.com','spamgourmet.com','trashmail.at',
  'trashmail.me','trashmail.io','trashmail.net','trashmail.org',
  'trashmail.com','discard.email','maildrop.cc','throwaway.email',
  'getnada.com','mohmal.com','fakeinbox.com','mailnesia.com',
  'mailnull.com','spamevader.com','spamfree24.org','spamgap.com',
  'spamgourmet.org','spamherelots.com','spamthisplease.com',
  'spamtrail.com','speed.1s.fr','super-auswahl.de','trbvm.com',
  'trickmail.net','trillianpro.com','tryalert.com','tugnutt.co.uk',
  'twinmail.de','tyldd.com','uggsrock.com','umail.net',
  'uroid.com','us.af','venompen.com','veryrealemail.com',
  'vidchart.com','viditag.com','viewcastmedia.com','vomoto.com',
  'vpn.st','vsimcard.com','vubby.com','wasteland.rr.nu',
  'webemail.me','weg-werf-email.de','wegwerf-email.at',
  'wegwerf-emails.de','wegwerfadresse.de','wegwerfemail.com',
  'wegwerfemail.de','wegwerfemails.de','wegwerfmail.de',
  'wegwerfmail.info','wegwerfmail.net','wegwerfmail.org',
  'wetrainbayarea.com','wetrainbayarea.org','wh4f.org','whopy.com',
  'wilemail.com','willhackforfood.biz','willselfdestruct.com',
  'wMailer.com','wolfsmail.tk','writeme.us','wronghead.com',
  'wuzup.net','wuzupmail.net','www.e4ward.com','www.mailinator.com',
  'xagloo.com','xemaps.com','xents.com','xmaily.com',
  'xoxy.net','xyzfree.net','yapped.net','yeah.net',
  'yesey.net','yodx.ro','yogamaven.com','yopmail.pp.ua',
  'yopmail.usa.cc','youmailr.com','ypmail.webarnak.fr.eu.org',
  'yuurok.com','z1p.biz','za.com','zehnminuten.de',
  'zehnminutenmail.de','zetmail.com','zippymail.info','zoaxe.com',
  'zoemail.net','zoemail.org','zomg.info','zxcv.com',
  'zxcvbnm.com','zzz.com','test.com','example.com',
  'sample.com','fake.com','invalid.com','noreply.com',
]);

function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return DISPOSABLE_DOMAINS.has(domain);
}

// ── Test/fake address heuristic ───────────────────────────────────────────────
function isTestEmail(email) {
  const local = email.split('@')[0]?.toLowerCase() ?? '';
  return (
    /^(test|smoke|demo|fake|dummy|noreply|example|sample|temp|throwaway|disposable|spam|trash|junk|delete|remove|bounce|invalid)\b/.test(local) ||
    /-(test|smoke|demo|fake|audit)\d*$/.test(local) ||
    /\.(test|smoke|demo|fake|audit)\d*$/.test(local)
  );
}

// ─────────────────────────────────────────────────────────────
// Magic-link email HTML (dark theme, purple gradient branding)
// ─────────────────────────────────────────────────────────────

function buildEmailHtml(magicLink, toEmail) {
  const year = new Date().getFullYear();
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Poly-Glot Magic Link</title>
</head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
         style="background:#0f0f13;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <!-- ── Outer card ─────────────────────────────────── -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
               style="max-width:520px;background:#18181f;border-radius:20px;
                      border:1px solid #2a2a38;overflow:hidden;
                      box-shadow:0 24px 64px rgba(0,0,0,0.6);">

          <!-- Top gradient accent bar -->
          <tr>
            <td style="height:4px;
                       background:linear-gradient(90deg,#7c3aed 0%,#6d28d9 50%,#4f46e5 100%);">
            </td>
          </tr>

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:40px 40px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <!-- Icon badge -->
                  <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);
                             border-radius:14px;padding:10px 14px;
                             box-shadow:0 4px 16px rgba(124,58,237,0.45);">
                    <span style="font-size:22px;font-weight:900;color:#fff;
                                 letter-spacing:-1px;line-height:1;">P</span>
                  </td>
                  <!-- Wordmark -->
                  <td style="padding-left:14px;vertical-align:middle;">
                    <div style="font-size:22px;font-weight:800;color:#f4f4f6;
                                letter-spacing:-0.5px;line-height:1.1;">Poly-Glot</div>
                    <div style="font-size:10px;font-weight:600;color:#7c3aed;
                                letter-spacing:3px;text-transform:uppercase;
                                margin-top:3px;">AI</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td style="padding:32px 40px 0;">
              <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;
                         color:#f4f4f6;line-height:1.25;letter-spacing:-0.3px;">
                Your magic link is here&nbsp;✨
              </h1>
              <p style="margin:0 0 10px;font-size:15px;color:#9ca3af;line-height:1.65;">
                Click the button below to sign in instantly — no password needed.
                This link expires in <strong style="color:#e5e7eb;">15&nbsp;minutes</strong>
                and is single-use.
              </p>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                Signing in as:&nbsp;<span style="color:#a78bfa;font-weight:600;">${toEmail}</span>
              </p>
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td align="center" style="padding:40px 40px 36px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius:14px;
                             background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);
                             box-shadow:0 6px 28px rgba(124,58,237,0.5);">
                    <a href="${magicLink}" target="_blank"
                       style="display:inline-block;padding:16px 44px;
                              font-size:16px;font-weight:700;color:#ffffff;
                              text-decoration:none;letter-spacing:0.1px;
                              border-radius:14px;line-height:1;">
                      Sign in to Poly-Glot&nbsp;→
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#2a2a38;"></div>
            </td>
          </tr>

          <!-- Fallback URL -->
          <tr>
            <td style="padding:24px 40px 28px;">
              <p style="margin:0 0 8px;font-size:12px;color:#6b7280;line-height:1.5;">
                Button not working? Paste this URL into your browser:
              </p>
              <p style="margin:0;font-size:11px;color:#7c3aed;
                        word-break:break-all;line-height:1.6;">
                ${magicLink}
              </p>
            </td>
          </tr>

          <!-- Security notice + footer -->
          <tr>
            <td style="background:#131318;border-top:1px solid #2a2a38;
                       padding:20px 40px;border-radius:0 0 20px 20px;">
              <p style="margin:0 0 6px;font-size:12px;color:#4b5563;
                        line-height:1.6;text-align:center;">
                🔒&nbsp;If you didn't request this link, you can safely ignore this email.
                No account has been created.
              </p>
              <p style="margin:0;font-size:11px;color:#374151;
                        text-align:center;line-height:1.6;">
                © ${year} Poly-Glot AI&nbsp;·&nbsp;All rights reserved
              </p>
            </td>
          </tr>

        </table>
        <!-- ── / Outer card ───────────────────────────────── -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// Resend email sender
// ─────────────────────────────────────────────────────────────

async function sendMagicLinkEmail(env, toEmail, magicLink) {
  const payload = {
    from:    'Poly-Glot <noreply@poly-glot.ai>',
    to:      [toEmail],
    subject: 'Your Poly-Glot magic link',
    html:    buildEmailHtml(magicLink, toEmail),
  };

  let res;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (networkErr) {
    console.error('Resend network error:', networkErr);
    return { ok: false, reason: 'network_error' };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`Resend HTTP ${res.status}: ${text}`);
    return { ok: false, reason: `resend_${res.status}`, detail: text };
  }

  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// Route handlers
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 *
 * 1. Validate email
 * 2. Rate-limit check (1 req / email / 60 s)
 * 3. Look up plan in KV (default: 'free')
 * 4. Generate secure token, store in KV with 15-min TTL
 * 5. Send magic-link email via Resend
 * 6. Return { ok: true } or appropriate error
 */
async function handleLogin(request, env) {
  // ── Parse body ──────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
  }

  const rawEmail = body?.email;
  if (!rawEmail || !isValidEmail(rawEmail)) {
    return jsonResponse({ error: 'A valid email address is required' }, 400);
  }

  const email = rawEmail.trim().toLowerCase();

  // ── Disposable / test email block ──────────────────────────
  if (isDisposableEmail(email) || isTestEmail(email)) {
    return jsonResponse({ error: 'Disposable or test email addresses are not allowed. Please use a real email.' }, 400);
  }

  // ── Rate limiting ───────────────────────────────────────────
  const rateLimitKey = `ratelimit:${email}`;
  const rateLimitHit = await env.AUTH_KV.get(rateLimitKey);

  if (rateLimitHit !== null) {
    return jsonResponse(
      { error: 'Too many requests. Please wait 60 seconds before trying again.' },
      429
    );
  }

  // Reserve rate-limit slot immediately
  await env.AUTH_KV.put(rateLimitKey, '1', { expirationTtl: RATE_LIMIT_TTL });

  // ── Plan lookup + new-user registration ─────────────────────
  // If no plan: key exists, this is a first-time signup — write 'free' immediately.
  // This ensures admin/users counts ALL signups, not just paid upgrades.
  const existingPlan = await env.AUTH_KV.get(`plan:${email}`);
  if (!existingPlan) {
    await env.AUTH_KV.put(`plan:${email}`, 'free');
  }
  const plan = existingPlan ?? 'free';

  // ── Token generation + storage ──────────────────────────────
  const token     = generateToken();
  const tokenData = JSON.stringify({ email, plan, created: Date.now() });
  await env.AUTH_KV.put(`token:${token}`, tokenData, { expirationTtl: TOKEN_TTL });

  // ── Build magic link ────────────────────────────────────────
  const baseUrl   = (env.BASE_URL ?? 'https://poly-glot.ai').replace(/\/$/, '');
  const magicLink = `${baseUrl}/?token=${token}&plan=${encodeURIComponent(plan)}&email=${encodeURIComponent(email)}`;

  // ── Send email ──────────────────────────────────────────────
  const result = await sendMagicLinkEmail(env, email, magicLink);

  if (!result.ok) {
    // Roll back rate-limit and token so the user can retry immediately
    await Promise.allSettled([
      env.AUTH_KV.delete(rateLimitKey),
      env.AUTH_KV.delete(`token:${token}`),
    ]);
    return jsonResponse(
      { error: 'Failed to send magic link email. Please try again.' },
      502
    );
  }

  return jsonResponse({ ok: true });
}

/**
 * POST /api/auth/verify
 *
 * Validate token (one-time use — token is deleted after successful lookup).
 * Returns: { email, plan }
 */
async function handleVerify(request, env) {
  return resolveToken(request, env, /* deleteAfter= */ true);
}

/**
 * POST /api/auth/set-plan
 *
 * Write (or overwrite) the plan for an email address in KV.
 * Protected by ADMIN_SECRET env var — callers must supply:
 *   { email, plan, secret }
 *
 * Valid plans: free | pro | team | enterprise
 * No TTL — persists until explicitly changed (mirrors a DB row).
 *
 * Used by:
 *  - Stripe webhook handler (when implemented)
 *  - Manual admin calls to fix/upgrade a user
 */
/**
 * Shared admin auth check — accepts secret via:
 *   1. X-Admin-Secret header  (preferred — used by dashboard-stats)
 *   2. ?secret= query param   (legacy — used by admin/users)
 */
function checkAdminAuth(request, env) {
  const url          = new URL(request.url);
  const headerSecret = request.headers.get('X-Admin-Secret') ?? '';
  const querySecret  = url.searchParams.get('secret') ?? '';
  const adminSecret  = env.ADMIN_SECRET ?? '';
  return adminSecret && (headerSecret === adminSecret || querySecret === adminSecret);
}

/**
 * Core dashboard data builder — shared by handleAdminUsers and handleDashboardStats.
 *
 * BUG FIX (2026-05): active_unique_users was previously set to sessionKeys.length
 * (total raw session: token count). This was wrong — one user can have many sessions
 * (each login creates a new 30-day token). Fixed to read each session payload, extract
 * the email, and count unique emails with at least one active session.
 */
async function buildDashboardData(env) {
  // ── List all KV keys ──────────────────────────────────────
  const allKeys = [];
  let cursor;
  do {
    const opts = { limit: 1000 };
    if (cursor) opts.cursor = cursor;
    const page = await env.AUTH_KV.list(opts);
    allKeys.push(...page.keys);
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);

  const YYYY_MM = new Date().toISOString().slice(0, 7);

  // ── Separate key types ────────────────────────────────────
  const planKeys       = allKeys.filter(k => k.name.startsWith('plan:'));
  const sessionKeys    = allKeys.filter(k => k.name.startsWith('session:'));
  const signupKeys     = allKeys.filter(k => k.name.startsWith('signup:'));
  const promptPlanKeys = allKeys.filter(k => k.name.startsWith('prompt_plan:'));
  const promptSigKeys  = allKeys.filter(k => k.name.startsWith('prompt_signup:'));
  const iapTxKeys      = allKeys.filter(k => k.name.startsWith('iap:tx:'));
  const stripeTxKeys   = allKeys.filter(k => k.name.startsWith('stripe:sub:') || k.name.startsWith('stripe:cust:'));

  // ── Build set of emails that came via Apple IAP ───────────
  const iapEmailSet = new Set();
  const iapTxValues = await Promise.all(iapTxKeys.map(k => env.AUTH_KV.get(k.name).catch(() => null)));
  for (const val of iapTxValues) {
    if (val && val.includes('@')) iapEmailSet.add(val.trim().toLowerCase());
  }

  // ── FIX: count unique emails with active sessions ─────────
  // Read all session payloads in parallel, extract email, deduplicate.
  const sessionPayloads = await Promise.all(
    sessionKeys.map(k => env.AUTH_KV.get(k.name).catch(() => null))
  );
  const activeEmailSet = new Set();
  for (const raw of sessionPayloads) {
    if (!raw) continue;
    try {
      const data = JSON.parse(raw);
      if (data?.email) activeEmailSet.add(data.email.toLowerCase());
    } catch {}
  }
  const activeUnique = activeEmailSet.size; // FIXED: was sessionKeys.length

  // ── AI App users (plan: keys) ─────────────────────────────
  // Read plan + signup metadata in parallel
  const allUsers = await Promise.all(planKeys.map(async k => {
    const email = k.name.slice('plan:'.length);
    const [plan, usageVal, signupRaw] = await Promise.all([
      env.AUTH_KV.get(k.name),
      env.AUTH_KV.get(`usage:${email}:${YYYY_MM}`),
      env.AUTH_KV.get(`signup:${email}`),
    ]);
    let signupMeta = {};
    try { signupMeta = signupRaw ? JSON.parse(signupRaw) : {}; } catch {}
    return {
      email,
      plan:             plan ?? 'free',
      usage_this_month: usageVal ? parseInt(usageVal, 10) : 0,
      surface:          signupMeta.surface  ?? 'app',
      source:           signupMeta.source   ?? 'website',
      signup_ts:        signupMeta.ts       ?? k.expiration ? (Date.now() - 30 * 24 * 60 * 60 * 1000) : Date.now(),
      iap_source:       iapEmailSet.has(email) ? 'apple' : null,
    };
  }));

  // Deduplicate + filter test/disposable/probe addresses
  const seen  = new Set();
  const OWNER_EMAILS = new Set([
    'hwmoses2@icloud.com',
    'haroldwebstermoses2@gmail.com',
    // Internal probe / gate-check addresses created during testing
    'canon.test+alias@gmail.com',
    'turnstile-probe@gmail.com',
    'realuser@gmail.com',
    'realuser-abc123@gmail.com',
    'probe-harold@hey.com',
    'probe-verify-2026@protonmail.com',
    'live-check@test-domain.com',
    'lockdowntest11775685840@protonmail.com',
    'lockdowntest21775685842@protonmail.com',
    'lockdowntest31775685844@protonmail.com',
    'harold+probea@poly-glot.ai',
    'harold+probeb@poly-glot.ai',
    'harold+devicetest@poly-glot.ai',
    'harold+devicetest2@poly-glot.ai',
    'harold.probe.2026@gmail.com',
    'harold.test.probe.2026@outlook.com',
    'device-test-real@gmail.com',
    'different-person-2026@protonmail.com',
    // Disposable domain probes (gate-check accounts, never real users)
    'user@10minutemail.com',
    'probe@10minutemail.com',
    'test123@proton.me',
    // Prompt Studio internal test
    'harold+prompttest@poly-glot.ai',
  ]);
  const users = allUsers.filter(u => {
    if (seen.has(u.email))            return false;
    seen.add(u.email);
    if (OWNER_EMAILS.has(u.email))    return false;
    if (isDisposableEmail(u.email))   return false;
    if (isTestEmail(u.email))         return false;
    return true;
  });

  // Plan breakdown (AI App — plan: namespace)
  const breakdown = { free: 0, pro: 0, team: 0, enterprise: 0 };
  users.forEach(u => { breakdown[u.plan] = (breakdown[u.plan] ?? 0) + 1; });

  // Surface breakdown (app vs prompt signups on main AI App)
  const surfaceBreakdown = { app: 0, prompt: 0 };
  users.forEach(u => {
    const s = u.surface === 'prompt' ? 'prompt' : 'app';
    surfaceBreakdown[s]++;
  });

  // ── Prompt Studio users (prompt_plan: keys) ───────────────
  const allPromptUsers = await Promise.all(promptPlanKeys.map(async k => {
    const email = k.name.slice('prompt_plan:'.length);
    const [plan, sigRaw] = await Promise.all([
      env.AUTH_KV.get(k.name),
      env.AUTH_KV.get(`prompt_signup:${email}`),
    ]);
    let sigMeta = {};
    try { sigMeta = sigRaw ? JSON.parse(sigRaw) : {}; } catch {}
    return {
      email,
      plan:      plan ?? 'prompt_free',
      source:    sigMeta.source ?? 'prompt_page',
      signup_ts: sigMeta.ts    ?? Date.now(),
    };
  }));

  const seenPrompt = new Set();
  const promptUsers = allPromptUsers.filter(u => {
    if (seenPrompt.has(u.email))            return false;
    seenPrompt.add(u.email);
    if (OWNER_EMAILS.has(u.email))          return false;
    if (isDisposableEmail(u.email))         return false;
    if (isTestEmail(u.email))               return false;
    return true;
  });

  const promptBreakdown = { prompt_free: 0, prompt_pro: 0, prompt_team: 0 };
  promptUsers.forEach(u => {
    const plan = u.plan || 'prompt_free';
    promptBreakdown[plan] = (promptBreakdown[plan] ?? 0) + 1;
  });

  // ── Apple IAP subscription stats ─────────────────────────
  // Count paying users whose plan was set via Apple IAP (iap:tx: keys)
  const appleSubUsers = users.filter(u => u.iap_source === 'apple' && u.plan !== 'free');
  const appleSubFree  = users.filter(u => u.iap_source === 'apple' && u.plan === 'free');
  const appleBreakdown = { pro: 0, team: 0, free: 0 };
  users.filter(u => u.iap_source === 'apple').forEach(u => {
    appleBreakdown[u.plan] = (appleBreakdown[u.plan] ?? 0) + 1;
  });

  // Active Apple IAP transactions (iap:tx: keys still in KV = within 400-day TTL)
  const apple_active_txs   = iapTxKeys.length;
  const apple_paying_users = appleSubUsers.length;
  const apple_mrr_est      = (appleBreakdown.pro || 0) * 9.99 + (appleBreakdown.team || 0) * 29.99;

  return {
    ok:                    true,
    unique_users:          users.length,
    active_sessions:       sessionKeys.length,
    active_unique_users:   activeUnique,
    plan_breakdown:        breakdown,
    surface_breakdown:     surfaceBreakdown,
    prompt_unique_users:   promptUsers.length,
    prompt_plan_breakdown: promptBreakdown,
    // ── Apple IAP ──────────────────────────────────────────
    apple_active_txs,
    apple_paying_users,
    apple_mrr_est,
    apple_breakdown:       appleBreakdown,
    // ── Stripe tx count (proxy indicator) ─────────────────
    stripe_tx_keys:        stripeTxKeys.length,
    period:                YYYY_MM,
    users:                 users.sort((a, b) => b.signup_ts - a.signup_ts),
    prompt_users:          promptUsers.sort((a, b) => b.signup_ts - a.signup_ts),
  };
}

/**
 * GET /api/auth/dashboard-stats
 * Header: X-Admin-Secret: <ADMIN_SECRET>
 *
 * Full dashboard metrics — used by poly-glot.ai/dashboard/.
 * Returns all signups, sessions, plan breakdown, prompt studio stats.
 */
async function handleDashboardStats(request, env) {
  if (!checkAdminAuth(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const data = await buildDashboardData(env);
  return jsonResponse(data);
}

/**
 * GET /api/auth/admin/users?secret=<ADMIN_SECRET>
 *
 * Legacy endpoint — kept for backward compatibility.
 * Delegates to the same buildDashboardData() function.
 */
async function handleAdminUsers(request, env) {
  if (!checkAdminAuth(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const data = await buildDashboardData(env);
  return jsonResponse(data);
}

async function handleSetPlan(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
  }

  const { email, plan, secret } = body ?? {};

  // ── Auth check ─────────────────────────────────────────────
  const adminSecret = env.ADMIN_SECRET ?? '';
  if (!adminSecret || secret !== adminSecret) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // ── Validate inputs ─────────────────────────────────────────
  if (!email || !isValidEmail(email)) {
    return jsonResponse({ error: 'A valid email address is required' }, 400);
  }

  const VALID_PLANS = ['free', 'pro', 'team', 'enterprise'];
  const normalPlan  = (plan || '').trim().toLowerCase();
  if (!VALID_PLANS.includes(normalPlan)) {
    return jsonResponse({ error: `Invalid plan. Must be one of: ${VALID_PLANS.join(', ')}` }, 400);
  }

  // ── Write to KV ─────────────────────────────────────────────
  const kvKey = `plan:${email.trim().toLowerCase()}`;
  await env.AUTH_KV.put(kvKey, normalPlan);  // no TTL — permanent until changed

  console.log(`[set-plan] ${email} → ${normalPlan}`);
  return jsonResponse({ ok: true, email: email.trim().toLowerCase(), plan: normalPlan });
}

/**
 * POST /api/auth/refresh
 *
 * Validate session token (keeps token alive).
 * Returns: { email, plan }
 */
async function handleRefresh(request, env) {
  return resolveToken(request, env, /* deleteAfter= */ false);
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/check-plan
//
// Non-destructive token → plan lookup. Used by:
//   - CLI  (verifyLicense)
//   - VS Code extension (getVerifiedPlan / hasPro)
//
// Body: { token: string }
// Returns: { valid: bool, plan: string, email: string }
// Never deletes the token — safe to call on every command.
// ─────────────────────────────────────────────────────────────
async function handleCheckPlan(request, env) {
  // Support both GET (?token=...) and POST ({ token: ... })
  let token = '';
  if (request.method === 'GET') {
    token = new URL(request.url).searchParams.get('token') ?? '';
  } else {
    let body;
    try { body = await request.json(); } catch {
      return jsonResponse({ valid: false, error: 'token is required' }, 401);
    }
    token = (body?.token ?? '').trim();
  }
  if (!token) return jsonResponse({ valid: false, error: 'token is required' }, 401);

  // Check session: prefix first (long-lived 30-day tokens from login flow)
  for (const prefix of ['session:', 'token:']) {
    const raw = await env.AUTH_KV.get(`${prefix}${token}`);
    if (raw) {
      try {
        const data    = JSON.parse(raw);
        const email   = data.email ?? '';
        // Always read live plan from KV — catches post-payment upgrades immediately
        const planRaw = await env.AUTH_KV.get(`plan:${email}`);
        const plan    = planRaw || data.plan || 'free';
        return jsonResponse({ valid: true, plan, email });
      } catch {
        return jsonResponse({ valid: false, error: 'Corrupt token data' }, 400);
      }
    }
  }

  return jsonResponse({ valid: false, error: 'Invalid or expired token' }, 401);
}

// ─────────────────────────────────────────────────────────────
// Session auth helper — resolves sessionToken → { email, plan }
// Used by usage endpoints.
// ─────────────────────────────────────────────────────────────
async function resolveSession(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;

  // Accept both session: keys (30-day) and legacy token: keys
  for (const prefix of ['session:', 'token:']) {
    const raw = await env.AUTH_KV.get(`${prefix}${token}`);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        // Look up current plan (may have changed since token was issued)
        const planRaw = await env.AUTH_KV.get(`plan:${data.email}`);
        return { email: data.email, plan: planRaw || data.plan || 'free' };
      } catch { return null; }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Usage helpers
// ─────────────────────────────────────────────────────────────

/** Returns YYYY-MM string for current UTC month */
function currentMonthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Get current monthly usage for an email. Returns integer. */
async function getUsageCount(email, env) {
  const key = `usage:${email}:${currentMonthKey()}`;
  const raw = await env.AUTH_KV.get(key);
  return raw ? parseInt(raw, 10) : 0;
}

/** Increment monthly usage for an email by n. Returns new count. */
async function incrementUsageCount(email, n, env) {
  const key     = `usage:${email}:${currentMonthKey()}`;
  const current = await getUsageCount(email, env);
  const next    = current + n;
  await env.AUTH_KV.put(key, String(next), { expirationTtl: USAGE_TTL });
  return next;
}

/** Returns monthly limit for a given plan */
function planLimit(plan) {
  return PRO_PLANS.includes(plan) ? null : FREE_MONTHLY_LIMIT; // null = unlimited
}

// ─────────────────────────────────────────────────────────────
// POST /api/usage/get
// Headers: Authorization: Bearer {sessionToken}
// Returns: { email, plan, used, limit, remaining, month }
// ─────────────────────────────────────────────────────────────
async function handleUsageGet(request, env) {
  const session = await resolveSession(request, env);
  if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { email, plan } = session;
  const used            = await getUsageCount(email, env);
  const limit           = planLimit(plan);
  const remaining       = limit === null ? null : Math.max(0, limit - used);

  return jsonResponse({
    email,
    plan,
    used,
    limit,        // null = unlimited (pro/team/enterprise)
    remaining,    // null = unlimited
    month: currentMonthKey(),
    reset: (() => {
      const d = new Date();
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString();
    })()
  });
}

// ─────────────────────────────────────────────────────────────
// POST /api/usage/increment
// Headers: Authorization: Bearer {sessionToken}
// Body:    { files: number }
// Returns: { used, limit, remaining, allowed, month }
// ─────────────────────────────────────────────────────────────
async function handleUsageIncrement(request, env) {
  const session = await resolveSession(request, env);
  if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body;
  try { body = await request.json(); } catch {
    return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
  }

  const files = Math.max(1, parseInt(body?.files ?? 1, 10));
  const { email, plan } = session;
  const limit           = planLimit(plan);

  // ── Pre-check: would this increment exceed the limit? ────────
  if (limit !== null) {
    const current = await getUsageCount(email, env);
    if (current >= limit) {
      return jsonResponse({
        error:     'Monthly limit reached',
        used:      current,
        limit,
        remaining: 0,
        allowed:   false,
        month:     currentMonthKey(),
      }, 429);
    }
  }

  // ── Increment ─────────────────────────────────────────────────
  const used      = await incrementUsageCount(email, files, env);
  const remaining = limit === null ? null : Math.max(0, limit - used);

  console.log(`[usage] ${email} → ${used}/${limit ?? '∞'} (${currentMonthKey()})`);

  return jsonResponse({
    used,
    limit,
    remaining,
    allowed: true,
    month:   currentMonthKey(),
  });
}

/**
 * Shared token-resolution logic for verify & refresh.
 */
async function resolveToken(request, env, deleteAfter) {
  // ── Parse body ──────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
  }

  const { token } = body ?? {};
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return jsonResponse({ error: 'token is required' }, 400);
  }

  const kvKey = `token:${token.trim()}`;

  // ── KV lookup ───────────────────────────────────────────────
  const raw = await env.AUTH_KV.get(kvKey);

  if (raw === null) {
    return jsonResponse({ error: 'Invalid or expired token' }, 401);
  }

  // ── Parse stored data ───────────────────────────────────────
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    // Corrupted entry — clean up and reject
    await env.AUTH_KV.delete(kvKey).catch(() => {});
    return jsonResponse({ error: 'Invalid or expired token' }, 401);
  }

  // ── Consume or retain token ─────────────────────────────────
  if (deleteAfter) {
    await env.AUTH_KV.delete(kvKey);
  }

  return jsonResponse({ email: data.email, plan: data.plan });
}

// ─────────────────────────────────────────────────────────────
// Stripe webhook handler
// ─────────────────────────────────────────────────────────────

/**
 * Maps Stripe price IDs → plan names.
 * Update these IDs if you create new prices in the Stripe dashboard.
 */
const STRIPE_PRICE_TO_PLAN = {
  'price_1THTUgRQVeNj16c8TvAVPfTJ': 'pro',   // Pro Monthly  $9/mo
  'price_1TGL4gRQVeNj16c8K085nwl2': 'pro',   // Pro Yearly   $79/yr
  'price_1THTpsRQVeNj16c8IcauulXJ': 'team',  // Team Monthly $29/mo
  'price_1TI9q1RQVeNj16c8BDKYHS3y': 'team',  // Team Yearly  $249/yr
};

/**
 * Resolve plan from a Stripe subscription object.
 * Looks at the first line item's price ID.
 */
function resolvePlanFromSubscription(subscription) {
  try {
    const items = subscription?.items?.data || [];
    for (const item of items) {
      const priceId = item?.price?.id;
      if (priceId && STRIPE_PRICE_TO_PLAN[priceId]) {
        return STRIPE_PRICE_TO_PLAN[priceId];
      }
      // Fallback: check product metadata for plan name
      const meta = item?.price?.product?.metadata;
      if (meta?.plan) return meta.plan.toLowerCase();
    }
    // Last resort: check subscription metadata
    if (subscription?.metadata?.plan) return subscription.metadata.plan.toLowerCase();
  } catch { /* ignore */ }
  return 'pro'; // default to pro if we can't resolve (they paid, give them access)
}

/**
 * Verify Stripe webhook signature using HMAC-SHA256.
 * Stripe sends: Stripe-Signature: t=timestamp,v1=signature
 */
async function verifyStripeSignature(payload, sigHeader, secret) {
  try {
    const parts    = sigHeader.split(',');
    const tPart    = parts.find(p => p.startsWith('t='));
    const v1Part   = parts.find(p => p.startsWith('v1='));
    if (!tPart || !v1Part) return false;

    const timestamp = tPart.slice(2);
    const signature = v1Part.slice(3);

    // Reject webhooks older than 5 minutes (replay attack protection)
    const age = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
    if (age > 300) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const enc           = new TextEncoder();
    const key           = await crypto.subtle.importKey(
      'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const mac    = await crypto.subtle.sign('HMAC', key, enc.encode(signedPayload));
    const hexMac = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('');

    return hexMac === signature;
  } catch {
    return false;
  }
}

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe subscription lifecycle events:
 *   checkout.session.completed       → activate plan
 *   customer.subscription.updated    → update plan
 *   customer.subscription.deleted    → downgrade to free
 *   invoice.payment_failed           → log (don't downgrade immediately — Stripe retries)
 */
async function handleStripeWebhook(request, env) {
  const sigHeader = request.headers.get('Stripe-Signature');
  if (!sigHeader) return jsonResponse({ error: 'Missing Stripe-Signature header' }, 400);

  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[stripe] STRIPE_WEBHOOK_SECRET not configured');
    return jsonResponse({ error: 'Webhook secret not configured' }, 500);
  }

  // Read raw body (must be raw string for signature verification)
  const rawBody = await request.text();

  // Verify signature
  const isValid = await verifyStripeSignature(rawBody, sigHeader, webhookSecret);
  if (!isValid) {
    console.warn('[stripe] Invalid webhook signature — rejecting');
    return jsonResponse({ error: 'Invalid signature' }, 401);
  }

  // Parse event
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { type, data } = event;
  console.log(`[stripe] Event: ${type}`);

  try {
    switch (type) {

      // ── New subscription / one-time payment ──────────────────────────────
      case 'checkout.session.completed': {
        const session      = data.object;
        const email        = session?.customer_details?.email
                          || session?.customer_email
                          || null;
        const customerId   = session?.customer;
        const subscription = session?.subscription;

        if (!email) {
          console.warn('[stripe] checkout.session.completed — no email found');
          break;
        }

        // Store customer ID → email mapping for future events
        if (customerId) {
          await env.AUTH_KV.put(`stripe:${customerId}`, email.toLowerCase());
        }

        // Determine plan from the subscription line items; fall back to 'pro'
        let plan = 'pro';
        if (subscription) {
          // Fetch full subscription object so we have line items + price IDs
          try {
            const subRaw = await env.AUTH_KV.get(`stripe:sub:${subscription}`);
            if (subRaw) plan = resolvePlanFromSubscription(JSON.parse(subRaw));
          } catch { /* use default */ }
        }
        // Also check session metadata for an explicit plan hint from Stripe
        if (session?.metadata?.plan) plan = session.metadata.plan.toLowerCase();

        const kvKey = `plan:${email.trim().toLowerCase()}`;
        await env.AUTH_KV.put(kvKey, plan);

        console.log(`[stripe] ✅ Activated ${plan} for ${email} (customer: ${customerId})`);
        break;
      }

      // ── Subscription updated (upgrade/downgrade/reactivation) ────────────
      case 'customer.subscription.updated': {
        const subscription = data.object;
        const customerId   = subscription?.customer;
        if (!customerId) break;

        // Look up email from customer ID
        const email = await env.AUTH_KV.get(`stripe:${customerId}`);
        if (!email) {
          console.warn(`[stripe] subscription.updated — no email for customer ${customerId}`);
          break;
        }

        const status = subscription?.status;
        // Only activate on active/trialing — not past_due/canceled
        if (status === 'active' || status === 'trialing') {
          const plan  = resolvePlanFromSubscription(subscription);
          const kvKey = `plan:${email}`;
          await env.AUTH_KV.put(kvKey, plan);
          console.log(`[stripe] ✅ Updated plan → ${plan} for ${email} (status: ${status})`);
        } else {
          console.log(`[stripe] ⚠️ Subscription status ${status} for ${email} — no plan change`);
        }
        break;
      }

      // ── Subscription cancelled / expired ─────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = data.object;
        const customerId   = subscription?.customer;
        if (!customerId) break;

        const email = await env.AUTH_KV.get(`stripe:${customerId}`);
        if (!email) {
          console.warn(`[stripe] subscription.deleted — no email for customer ${customerId}`);
          break;
        }

        // Downgrade to free
        await env.AUTH_KV.put(`plan:${email}`, 'free');
        console.log(`[stripe] ⬇️ Downgraded to free for ${email} (subscription cancelled)`);
        break;
      }

      // ── Payment failed — log only, Stripe will retry ──────────────────────
      case 'invoice.payment_failed': {
        const invoice    = data.object;
        const customerId = invoice?.customer;
        const email      = customerId ? await env.AUTH_KV.get(`stripe:${customerId}`) : null;
        console.warn(`[stripe] ⚠️ Payment failed for customer ${customerId} (${email || 'unknown'})`);
        // Don't downgrade yet — Stripe retries 3x before cancelling subscription
        break;
      }

      default:
        console.log(`[stripe] Unhandled event type: ${type}`);
    }
  } catch (err) {
    console.error(`[stripe] Error processing event ${type}:`, err?.message);
    return jsonResponse({ error: 'Internal error processing webhook' }, 500);
  }

  // Always return 200 to Stripe — even for events we don't handle
  return jsonResponse({ received: true });
}

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// Chrome Web Store proxy — GET /api/auth/cws-proxy
// ─────────────────────────────────────────────────────────────
// Returns { installs: N } using the Chrome Web Store Publish API.
// Requires env secrets:
//   CWS_CLIENT_ID      — OAuth2 client ID from Google Cloud Console
//   CWS_CLIENT_SECRET  — OAuth2 client secret
//   CWS_REFRESH_TOKEN  — long-lived refresh token (one-time setup)
//   CWS_EXTENSION_ID   — Chrome extension ID (hjpdgilolgcanemmngagpobdgdhpplai)
//
// Flow: refresh_token → access_token → items API → userCount
// ─────────────────────────────────────────────────────────────
async function handleCwsProxy(request, env) {
  try {
    // 1. Exchange refresh token for a fresh access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     env.CWS_CLIENT_ID,
        client_secret: env.CWS_CLIENT_SECRET,
        refresh_token: env.CWS_REFRESH_TOKEN,
        grant_type:    'refresh_token',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('CWS token exchange failed:', err);
      return jsonResponse({ error: 'token_exchange_failed', installs: null }, 502);
    }

    const { access_token } = await tokenRes.json();
    if (!access_token) {
      return jsonResponse({ error: 'no_access_token', installs: null }, 502);
    }

    // 2. Fetch extension item from Chrome Web Store Publish API
    const extId = env.CWS_EXTENSION_ID || 'hjpdgilolgcanemmngagpobdgdhpplai';
    const cwsRes = await fetch(
      `https://www.googleapis.com/chromewebstore/v1.1/items/${extId}?projection=DRAFT`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'x-goog-api-version': '2',
        },
      }
    );

    if (!cwsRes.ok) {
      const err = await cwsRes.text();
      console.error('CWS items API failed:', err);
      return jsonResponse({ error: 'cws_api_failed', installs: null }, 502);
    }

    const item = await cwsRes.json();

    // userCount is the install count — may be 0 or absent for new extensions
    const installs = typeof item.userCount === 'number'
      ? item.userCount
      : parseInt(item.userCount || '0', 10) || 0;

    return new Response(JSON.stringify({ installs, id: extId }), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        // Cache for 1 hour at the edge — CWS updates slowly
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (err) {
    console.error('handleCwsProxy error:', err?.stack ?? err);
    return jsonResponse({ error: 'internal_error', installs: null }, 500);
  }
}

// ─────────────────────────────────────────────────────────────
// VS Code Marketplace proxy — POST /api/auth/vsc-proxy
// Proxies the marketplace extension query API (avoids CORS)
// ─────────────────────────────────────────────────────────────
async function handleVscProxy(request, env) {
  try {
    const body = await request.text();
    const res = await fetch(
      'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json;api-version=3.0-preview.1',
        },
        body,
      }
    );
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('handleVscProxy error:', err?.stack ?? err);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/free-signup
// "Start for Free" button — registers a new free account via
// magic-link email exactly like /api/auth/login.
// Body: { email }
// Accepts GET too (for redirect-based flows).
// ─────────────────────────────────────────────────────────────
async function handleFreeSignup(request, env) {
  let email;
  if (request.method === 'GET') {
    email = new URL(request.url).searchParams.get('email') ?? '';
  } else {
    let body;
    try { body = await request.json(); } catch {
      return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
    }
    email = (body?.email ?? '').trim().toLowerCase();
  }

  if (!email || !isValidEmail(email)) {
    return jsonResponse({ error: 'A valid email address is required' }, 400);
  }

  // ── Disposable / test email block ──────────────────────────
  if (isDisposableEmail(email) || isTestEmail(email)) {
    return jsonResponse({ error: 'Disposable or test email addresses are not allowed. Please use a real email.' }, 400);
  }

  // Rate-limit (shared with /api/auth/login — same 60 s window)
  const rateLimitKey = `ratelimit:${email}`;
  if (await env.AUTH_KV.get(rateLimitKey) !== null) {
    return jsonResponse(
      { error: 'Too many requests. Please wait 60 seconds before trying again.' },
      429
    );
  }
  await env.AUTH_KV.put(rateLimitKey, '1', { expirationTtl: RATE_LIMIT_TTL });

  // Ensure plan is set to 'free' for new signups (never overwrite a paid plan)
  const existingPlan = await env.AUTH_KV.get(`plan:${email}`);
  if (!existingPlan) {
    await env.AUTH_KV.put(`plan:${email}`, 'free');
  }

  // Generate magic-link token
  const token     = generateToken();
  const plan      = existingPlan ?? 'free';
  const tokenData = JSON.stringify({ email, plan, created: Date.now() });
  await env.AUTH_KV.put(`token:${token}`, tokenData, { expirationTtl: TOKEN_TTL });

  const baseUrl   = (env.BASE_URL ?? 'https://poly-glot.ai').replace(/\/$/, '');
  const magicLink = `${baseUrl}/?token=${token}&plan=${encodeURIComponent(plan)}&email=${encodeURIComponent(email)}`;

  const result = await sendMagicLinkEmail(env, email, magicLink);

  if (!result.ok) {
    await Promise.allSettled([
      env.AUTH_KV.delete(rateLimitKey),
      env.AUTH_KV.delete(`token:${token}`),
    ]);
    return jsonResponse(
      { error: 'Failed to send magic link email. Please try again.' },
      502
    );
  }

  console.log(`[free-signup] ✅ Magic link sent to ${email} (plan: ${plan})`);
  return jsonResponse({ ok: true, message: 'Check your email for a magic link to sign in.' });
}

// ─────────────────────────────────────────────────────────────
// GET /api/auth/get-usage  (CLI alias for /api/usage/get)
// Query: ?token=<sessionToken>
// ─────────────────────────────────────────────────────────────
async function handleCliGetUsage(request, env) {
  const token = new URL(request.url).searchParams.get('token') ?? '';
  if (!token) return jsonResponse({ error: 'token query param required' }, 400);

  // Resolve session from token (reuse resolveSession logic directly)
  for (const prefix of ['session:', 'token:']) {
    const raw = await env.AUTH_KV.get(`${prefix}${token.trim()}`);
    if (raw) {
      try {
        const data  = JSON.parse(raw);
        const email = data.email;
        const planRaw = await env.AUTH_KV.get(`plan:${email}`);
        const plan    = planRaw || data.plan || 'free';
        const used    = await getUsageCount(email, env);
        const limit   = planLimit(plan);
        const remaining = limit === null ? null : Math.max(0, limit - used);
        return jsonResponse({
          ok: true,
          email,
          plan,
          used,
          limit,
          remaining,
          month: currentMonthKey(),
        });
      } catch { return jsonResponse({ error: 'Invalid token data' }, 401); }
    }
  }
  return jsonResponse({ error: 'Invalid or expired token' }, 401);
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/github-app-track-usage
// Called by the GitHub App on every PR review to track monthly usage
// per installation and enforce the free-tier PR limit (25/month).
// Body: { installationId, owner, repo, month }
// Returns:
//   200 { ok:true, allowed:true,  used, limit }   — under quota
//   429 { ok:false, allowed:false, used, limit }   — quota exceeded
// ─────────────────────────────────────────────────────────────
const GITHUB_APP_FREE_LIMIT = 25; // PRs per calendar month on free plan

async function handleGithubAppTrackUsage(request, env) {
  let body;
  try { body = await request.json(); } catch {
    return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
  }

  const { installationId, month } = body ?? {};
  if (!installationId) {
    return jsonResponse({ error: 'installationId is required' }, 400);
  }

  // Resolve month key — use caller's value or fall back to server UTC month
  const monthKey = (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month))
    ? month
    : currentMonthKey();

  const kvKey = `gh-app-usage:${installationId}:${monthKey}`;

  // Read current count
  const raw  = await env.AUTH_KV.get(kvKey);
  const used = raw ? parseInt(raw, 10) : 0;

  if (used >= GITHUB_APP_FREE_LIMIT) {
    // Already over limit — do not increment, return 429
    return jsonResponse(
      { ok: false, allowed: false, used, limit: GITHUB_APP_FREE_LIMIT, month: monthKey },
      429,
    );
  }

  // Increment and persist (TTL: 35 days — safely covers the calendar month)
  const next = used + 1;
  await env.AUTH_KV.put(kvKey, String(next), { expirationTtl: 35 * 24 * 60 * 60 });

  return jsonResponse({
    ok: true, allowed: true, used: next, limit: GITHUB_APP_FREE_LIMIT, month: monthKey,
  });
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/track-usage  (CLI alias for /api/usage/increment)
// Body: { token, count }
// ─────────────────────────────────────────────────────────────
async function handleCliTrackUsage(request, env) {
  let body;
  try { body = await request.json(); } catch {
    return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
  }

  const token = (body?.token ?? '').trim();
  const count = Math.max(1, parseInt(body?.count ?? 1, 10));
  if (!token) return jsonResponse({ error: 'token is required' }, 400);

  for (const prefix of ['session:', 'token:']) {
    const raw = await env.AUTH_KV.get(`${prefix}${token}`);
    if (raw) {
      try {
        const data    = JSON.parse(raw);
        const email   = data.email;
        const planRaw = await env.AUTH_KV.get(`plan:${email}`);
        const plan    = planRaw || data.plan || 'free';
        const limit   = planLimit(plan);

        // Pre-check quota
        if (limit !== null) {
          const current = await getUsageCount(email, env);
          if (current >= limit) {
            return jsonResponse({
              ok:        false,
              error:     'Monthly limit reached',
              used:      current,
              limit,
              remaining: 0,
              allowed:   false,
              month:     currentMonthKey(),
            }, 429);
          }
        }

        const used      = await incrementUsageCount(email, count, env);
        const remaining = limit === null ? null : Math.max(0, limit - used);
        console.log(`[track-usage] ${email} → ${used}/${limit ?? '∞'} (${currentMonthKey()})`);
        return jsonResponse({ ok: true, used, limit, remaining, allowed: true, month: currentMonthKey() });
      } catch { return jsonResponse({ error: 'Invalid token data' }, 401); }
    }
  }
  return jsonResponse({ error: 'Invalid or expired token' }, 401);
}

// ─────────────────────────────────────────────────────────────
// GET /api/auth/billing-portal
// Headers: Authorization: Bearer {sessionToken}
// Redirects authenticated user to their Stripe customer portal.
// Returns 401 if no valid session, 404 if no Stripe customer found.
// ─────────────────────────────────────────────────────────────
async function handleBillingPortal(request, env) {
  const session = await resolveSession(request, env);
  if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);

  const stripeKey = env.STRIPE_SECRET_KEY;
  if (!stripeKey) return jsonResponse({ error: 'Billing not configured' }, 503);

  // Find Stripe customer ID for this email
  // We store stripe:{customerId} → email, so we need to search by email
  // Use Stripe API to find customer by email
  try {
    const searchRes = await fetch(
      `https://api.stripe.com/v1/customers/search?query=email:'${encodeURIComponent(session.email)}'&limit=1`,
      { headers: { 'Authorization': `Bearer ${stripeKey}` } }
    );
    if (!searchRes.ok) return jsonResponse({ error: 'Stripe error' }, 502);
    const searchData = await searchRes.json();
    const customerId = searchData?.data?.[0]?.id;
    if (!customerId) return jsonResponse({ error: 'No billing account found' }, 404);

    const baseUrl = (env.BASE_URL ?? 'https://poly-glot.ai').replace(/\/$/, '');
    const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer:   customerId,
        return_url: `${baseUrl}/`,
      }),
    });
    if (!portalRes.ok) return jsonResponse({ error: 'Could not create portal session' }, 502);
    const portal = await portalRes.json();
    return Response.redirect(portal.url, 302);
  } catch (err) {
    console.error('handleBillingPortal error:', err?.stack ?? err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/auth/tel-proxy
// Proxies telemetry stats from telemetry.poly-glot.ai/stats
// using the TEL_SECRET env var server-side (never exposed to browser).
// ─────────────────────────────────────────────────────────────
async function handleTelProxy(request, env) {
  const telSecret = env.TEL_SECRET;
  if (!telSecret) return jsonResponse({ error: 'Telemetry not configured', total_commands: 0 }, 200);
  try {
    const res = await fetch('https://telemetry.poly-glot.ai/stats', {
      headers: { 'X-Secret': telSecret },
    });
    if (!res.ok) return jsonResponse({ error: 'Telemetry error', total_commands: 0 }, 200);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('handleTelProxy error:', err?.stack ?? err);
    return jsonResponse({ error: 'Telemetry unavailable', total_commands: 0 }, 200);
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/auth/health-report
// Returns worker self-diagnostic: KV reachability, secrets present, version.
// ─────────────────────────────────────────────────────────────
async function handleHealthReport(request, env) {
  const t0 = Date.now();
  let kvOk = false;
  try {
    await env.AUTH_KV.get('__health_probe__');
    kvOk = true;
  } catch {}
  const kvMs = Date.now() - t0;

  const missingSecrets = [];
  if (!env.RESEND_API_KEY)        missingSecrets.push('RESEND_API_KEY');
  if (!env.ADMIN_SECRET)          missingSecrets.push('ADMIN_SECRET');
  if (!env.STRIPE_WEBHOOK_SECRET) missingSecrets.push('STRIPE_WEBHOOK_SECRET');
  if (!env.STRIPE_SECRET_KEY)     missingSecrets.push('STRIPE_SECRET_KEY');

  // CWS cache probe
  let cwsCache = { present: false };
  try {
    const cached = await env.AUTH_KV.get('cws:cached');
    if (cached) {
      const d = JSON.parse(cached);
      cwsCache = { present: true, cachedAt: d.cachedAt };
    }
  } catch {}

  return jsonResponse({
    healthy: kvOk && missingSecrets.length === 0,
    version: '4',
    ts: Date.now(),
    kv: { ok: kvOk, ms: kvMs },
    missing_secrets: missingSecrets,
    cws_cache: cwsCache,
  });
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/activate-iap
// Body: { token, receiptData, transactionId }
// Links an Apple in-app purchase to an authenticated account.
// ─────────────────────────────────────────────────────────────
async function handleActivateIAP(request, env) {
  let body;
  try { body = await request.json(); } catch {
    return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
  }

  const token = (body?.token ?? '').trim();
  if (!token) return jsonResponse({ error: 'token is required' }, 400);

  // Resolve session
  let email = null;
  for (const prefix of ['session:', 'token:']) {
    const raw = await env.AUTH_KV.get(`${prefix}${token}`);
    if (raw) {
      try { email = JSON.parse(raw).email; break; } catch {}
    }
  }
  if (!email) return jsonResponse({ error: 'Invalid or expired token' }, 401);

  const { transactionId, productId } = body ?? {};
  if (!transactionId) return jsonResponse({ error: 'transactionId is required' }, 400);

  // Determine plan from productId
  const IAP_PRODUCT_TO_PLAN = {
    'ai.polyglot.promptstudio.pro.monthly':  'pro',
    'ai.polyglot.promptstudio.pro.yearly':   'pro',
    'ai.polyglot.promptstudio.team.monthly': 'team',
    'ai.polyglot.promptstudio.team.yearly':  'team',
  };
  const plan = IAP_PRODUCT_TO_PLAN[productId] ?? 'pro';

  // Prevent replay: check if transaction already activated
  const txKey = `iap:tx:${transactionId}`;
  const existing = await env.AUTH_KV.get(txKey);
  if (existing) return jsonResponse({ ok: true, plan, email, already_activated: true });

  // Activate plan + record transaction
  await Promise.all([
    env.AUTH_KV.put(`plan:${email}`, plan),
    env.AUTH_KV.put(txKey, email, { expirationTtl: 400 * 24 * 60 * 60 }), // ~13 months
  ]);

  console.log(`[iap] ✅ Activated ${plan} for ${email} (tx: ${transactionId})`);
  return jsonResponse({ ok: true, plan, email });
}

// ─────────────────────────────────────────────────────────────
// POST /api/apple/webhook
// Apple App Store Server Notifications V2
// Verifies JWS payload and handles subscription events.
// ─────────────────────────────────────────────────────────────
async function handleAppleWebhook(request, env) {
  let body;
  try { body = await request.json(); } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const signedPayload = body?.signedPayload;
  if (!signedPayload) return jsonResponse({ error: 'Missing signedPayload' }, 400);

  // Decode JWS payload (header.payload.signature — base64url encoded)
  try {
    const parts = signedPayload.split('.');
    if (parts.length < 2) return jsonResponse({ error: 'Invalid JWS format' }, 400);

    const payloadJson = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const notifType   = payloadJson?.notificationType;
    const subtype     = payloadJson?.subtype;
    const txInfo      = payloadJson?.data?.signedTransactionInfo;

    let txPayload = null;
    if (txInfo) {
      const txParts = txInfo.split('.');
      if (txParts.length >= 2) {
        try {
          txPayload = JSON.parse(atob(txParts[1].replace(/-/g, '+').replace(/_/g, '/')));
        } catch {}
      }
    }

    const productId     = txPayload?.productId ?? '';
    const transactionId = txPayload?.originalTransactionId ?? txPayload?.transactionId ?? '';
    const appAccountToken = txPayload?.appAccountToken ?? ''; // email stored here if set at purchase

    const IAP_PRODUCT_TO_PLAN = {
      'ai.polyglot.promptstudio.pro.monthly':  'pro',
      'ai.polyglot.promptstudio.pro.yearly':   'pro',
      'ai.polyglot.promptstudio.team.monthly': 'team',
      'ai.polyglot.promptstudio.team.yearly':  'team',
    };
    const plan = IAP_PRODUCT_TO_PLAN[productId] ?? 'pro';

    console.log(`[apple] Event: ${notifType}/${subtype} · product: ${productId} · tx: ${transactionId}`);

    switch (notifType) {
      case 'DID_RENEW':
      case 'SUBSCRIBED': {
        if (appAccountToken && appAccountToken.includes('@')) {
          const email = appAccountToken.trim().toLowerCase();
          await env.AUTH_KV.put(`plan:${email}`, plan);
          if (transactionId) {
            await env.AUTH_KV.put(`iap:tx:${transactionId}`, email, { expirationTtl: 400 * 24 * 60 * 60 });
          }
          console.log(`[apple] ✅ Activated ${plan} for ${email}`);
        }
        break;
      }
      case 'EXPIRED':
      case 'DID_FAIL_TO_RENEW': {
        if (appAccountToken && appAccountToken.includes('@')) {
          const email = appAccountToken.trim().toLowerCase();
          await env.AUTH_KV.put(`plan:${email}`, 'free');
          console.log(`[apple] ⬇️ Downgraded to free for ${email} (${notifType})`);
        }
        break;
      }
      default:
        console.log(`[apple] Unhandled notification type: ${notifType}`);
    }

    return jsonResponse({ received: true });
  } catch (err) {
    console.error('[apple] Webhook error:', err?.stack ?? err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/admin/delete-user
// Header: X-Admin-Secret or body.secret
// Body: { email, secret? }
// Purges ALL KV keys for a given email (plan, sessions, usage, signup).
// ─────────────────────────────────────────────────────────────
async function handleDeleteUser(request, env) {
  if (!checkAdminAuth(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let body;
  try { body = await request.json(); } catch {
    return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
  }

  const email = (body?.email ?? '').trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return jsonResponse({ error: 'A valid email is required' }, 400);
  }

  // List all keys and delete those belonging to this email
  const allKeys = [];
  let cursor;
  do {
    const opts = { limit: 1000 };
    if (cursor) opts.cursor = cursor;
    const page = await env.AUTH_KV.list(opts);
    allKeys.push(...page.keys);
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);

  // Keys that directly reference this email
  const directPrefixes = [
    `plan:${email}`,
    `signup:${email}`,
    `prompt_plan:${email}`,
    `prompt_signup:${email}`,
    `ratelimit:${email}`,
  ];
  // Usage keys: usage:{email}:{YYYY-MM}
  const usageKeys = allKeys
    .filter(k => k.name.startsWith(`usage:${email}:`))
    .map(k => k.name);

  // Session keys: need to read payload to match email
  const sessionKeys = allKeys.filter(k =>
    k.name.startsWith('session:') || k.name.startsWith('token:')
  );
  const sessionPayloads = await Promise.all(
    sessionKeys.map(k => env.AUTH_KV.get(k.name).catch(() => null))
  );
  const matchedSessionKeys = sessionKeys
    .filter((k, i) => {
      try { return JSON.parse(sessionPayloads[i])?.email === email; } catch { return false; }
    })
    .map(k => k.name);

  const toDelete = [...new Set([...directPrefixes, ...usageKeys, ...matchedSessionKeys])];

  await Promise.allSettled(toDelete.map(k => env.AUTH_KV.delete(k)));

  console.log(`[delete-user] Purged ${toDelete.length} KV keys for ${email}`);
  return jsonResponse({ ok: true, email, deleted_keys: toDelete.length });
}

// ─────────────────────────────────────────────────────────────
// POST /api/prompt/get-template
// Headers: Authorization: Bearer {sessionToken}
// Body: { name: string }
// Fetches a saved prompt template from KV for the authenticated user.
// ─────────────────────────────────────────────────────────────
async function handleGetTemplate(request, env) {
  const session = await resolveSession(request, env);
  if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body;
  try { body = await request.json(); } catch {
    return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
  }

  const name = (body?.name ?? '').trim();
  if (!name) return jsonResponse({ error: 'name is required' }, 400);

  const key = `prompt_template:${session.email}:${name}`;
  const raw = await env.AUTH_KV.get(key);
  if (!raw) return jsonResponse({ error: 'Template not found' }, 404);

  try {
    const template = JSON.parse(raw);
    return jsonResponse({ ok: true, template });
  } catch {
    return jsonResponse({ error: 'Corrupt template data' }, 500);
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/prompt/sync-pick
// Headers: Authorization: Bearer {sessionToken}
// Body: { templateId: string }
// Saves the user's favourite template pick to KV.
// ─────────────────────────────────────────────────────────────
async function handleSyncPick(request, env) {
  const session = await resolveSession(request, env);
  if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body;
  try { body = await request.json(); } catch {
    return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
  }

  const templateId = (body?.templateId ?? '').trim();
  if (!templateId) return jsonResponse({ error: 'templateId is required' }, 400);

  const key = `prompt_pick:${session.email}`;
  await env.AUTH_KV.put(key, JSON.stringify({ templateId, updatedAt: Date.now() }));

  return jsonResponse({ ok: true, templateId });
}

// ─────────────────────────────────────────────────────────────
// POST /api/prompt/get-pick
// Headers: Authorization: Bearer {sessionToken}
// Retrieves the user's saved favourite template pick from KV.
// ─────────────────────────────────────────────────────────────
async function handleGetPick(request, env) {
  const session = await resolveSession(request, env);
  if (!session) return jsonResponse({ error: 'Unauthorized' }, 401);

  const key = `prompt_pick:${session.email}`;
  const raw = await env.AUTH_KV.get(key);
  if (!raw) return jsonResponse({ ok: true, templateId: null });

  try {
    const data = JSON.parse(raw);
    return jsonResponse({ ok: true, templateId: data.templateId, updatedAt: data.updatedAt });
  } catch {
    return jsonResponse({ ok: true, templateId: null });
  }
}

// ─────────────────────────────────────────────────────────────
// GitHub App stats proxy — GET /api/auth/gh-proxy
// Returns { installations: N } from the GitHub App
// ─────────────────────────────────────────────────────────────
async function handleGhProxy(request, env) {
  try {
    const url = new URL(request.url);
    const endpoint = url.searchParams.get('endpoint') || 'stats';
    // Route to the Render-hosted GitHub App stats endpoint
    const ghRes = await fetch(
      `https://poly-glot-github-app.onrender.com/${endpoint}`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!ghRes.ok) return jsonResponse({ installations: 0 }, 200);
    const data = await ghRes.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('handleGhProxy error:', err?.stack ?? err);
    return jsonResponse({ installations: 0 }, 200);
  }
}

// Main fetch handler (entry point)
// ─────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, _ctx) {

    // ── CORS preflight ────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status:  204,
        headers: CORS_HEADERS,
      });
    }

    const url      = new URL(request.url);
    const pathname = url.pathname;

    // ── GET routes ────────────────────────────────────────────
    if (request.method === 'GET') {
      switch (pathname) {
        case '/api/auth/ping':
          return jsonResponse({ ok: true, ts: Date.now() }, 200);

        case '/api/auth/admin/users':
          return await handleAdminUsers(request, env);

        case '/api/auth/dashboard-stats':
          return await handleDashboardStats(request, env);

        case '/api/auth/check-plan':
          // CLI + VS Code extension use this to verify token and get live plan from KV
          // Must be GET-compatible (some callers send GET, others POST)
          return await handleCheckPlan(request, env);
        case '/api/auth/cws-proxy':
          return await handleCwsProxy(request, env);
        case '/api/auth/gh-proxy':
          return await handleGhProxy(request, env);
        // CLI alias — GET /api/auth/get-usage?token=<sessionToken>
        case '/api/auth/get-usage':
          return await handleCliGetUsage(request, env);
        case '/api/auth/billing-portal':
          return await handleBillingPortal(request, env);
        case '/api/auth/tel-proxy':
          return await handleTelProxy(request, env);
        case '/api/auth/health-report':
          return await handleHealthReport(request, env);
        default:
          return jsonResponse({ error: 'Not found' }, 404);
      }
    }

    // ── Only POST allowed past this point ─────────────────────
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // ── POST route dispatch ───────────────────────────────────
    try {
      switch (pathname) {
        case '/api/auth/check-plan':
          return await handleCheckPlan(request, env);

        case '/api/auth/login':
          return await handleLogin(request, env);

        case '/api/auth/verify':
          return await handleVerify(request, env);

        case '/api/auth/refresh':
          return await handleRefresh(request, env);

        case '/api/auth/set-plan':
          return await handleSetPlan(request, env);

        // "Start for Free" button — website & extension
        case '/api/auth/free-signup':
          return await handleFreeSignup(request, env);

        case '/api/usage/get':
          return await handleUsageGet(request, env);

        case '/api/usage/increment':
          return await handleUsageIncrement(request, env);

        // CLI aliases — keep old paths working
        case '/api/auth/track-usage':
          return await handleCliTrackUsage(request, env);

        case '/api/auth/github-app-track-usage':
          return await handleGithubAppTrackUsage(request, env);

        case '/api/auth/vsc-proxy':
          return await handleVscProxy(request, env);

        case '/api/stripe/webhook':
          // Stripe sends POST with raw body — must NOT require JSON content-type
          return await handleStripeWebhook(request, env);

        case '/api/auth/activate-iap':
          return await handleActivateIAP(request, env);

        case '/api/apple/webhook':
          return await handleAppleWebhook(request, env);

        case '/api/auth/admin/delete-user':
          return await handleDeleteUser(request, env);

        case '/api/prompt/get-template':
          return await handleGetTemplate(request, env);

        case '/api/prompt/sync-pick':
          return await handleSyncPick(request, env);

        case '/api/prompt/get-pick':
          return await handleGetPick(request, env);

        default:
          return jsonResponse({ error: 'Not found' }, 404);
      }
    } catch (err) {
      // Last-resort catch — should never be reached in normal operation
      console.error('Unhandled worker error:', err?.stack ?? err);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  },
};
