/**
 * Poly-Glot Auth Worker
 * ─────────────────────
 * POST /api/auth/login   — generate + email a magic link
 * POST /api/auth/verify  — validate token → return { email, plan }
 * POST /api/auth/refresh — validate token without consuming it
 *
 * KV binding : AUTH_KV
 * Env vars   : RESEND_API_KEY, BASE_URL
 */

const CORS = {
  'Access-Control-Allow-Origin':  'https://poly-glot.ai',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

/** Cryptographically secure random hex token */
async function randomToken() {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Magic link email HTML — dark theme, purple CTA */
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

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#1e1b4b 0%,#1e1035 100%);padding:32px 40px 28px;text-align:center;border-bottom:1px solid rgba(139,92,246,0.15);">
          <div style="font-size:28px;font-weight:800;letter-spacing:-0.5px;color:#fff;">
            🦜 Poly-Glot
          </div>
          <div style="font-size:13px;color:#a78bfa;margin-top:4px;letter-spacing:0.05em;text-transform:uppercase;">
            AI Code Comment Generator
          </div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:36px 40px 32px;">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#f1f5f9;line-height:1.3;">
            Your magic link is ready ✨
          </h1>
          <p style="margin:0 0 8px;font-size:15px;color:#94a3b8;line-height:1.6;">
            Click the button below to sign in to Poly-Glot. This link expires in <strong style="color:#c4b5fd;">15 minutes</strong> and can only be used once.
          </p>
          <p style="margin:0 0 28px;font-size:13px;color:#64748b;">
            Signing in as: <strong style="color:#a78bfa;">${email}</strong>
          </p>

          <!-- CTA Button -->
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center">
                <a href="${magicUrl}"
                   style="display:inline-block;padding:15px 36px;background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.01em;box-shadow:0 4px 20px rgba(124,58,237,0.4);">
                  Sign in to Poly-Glot →
                </a>
              </td>
            </tr>
          </table>

          <!-- Fallback link -->
          <p style="margin:24px 0 0;font-size:12px;color:#475569;text-align:center;line-height:1.6;">
            Button not working? Copy and paste this link into your browser:<br>
            <a href="${magicUrl}" style="color:#7c3aed;word-break:break-all;font-size:11px;">${magicUrl}</a>
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
            If you didn't request this, you can safely ignore this email.<br>
            Your account will not be affected.
          </p>
          <p style="margin:10px 0 0;font-size:11px;color:#334155;">
            © 2026 Poly-Glot · <a href="https://poly-glot.ai" style="color:#7c3aed;text-decoration:none;">poly-glot.ai</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** Send magic link email via Resend */
async function sendMagicLinkEmail(env, email, magicUrl) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    'Poly-Glot <noreply@poly-glot.ai>',
      to:      [email],
      subject: 'Your Poly-Glot magic link',
      html:    magicLinkEmail(magicUrl, email),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', res.status, err);
    return false;
  }
  return true;
}

/** POST /api/auth/login */
async function handleLogin(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Valid email required' }, 400);
  }

  // Rate limit: 1 magic link per email per 60s
  const rateLimitKey = `ratelimit:${email}`;
  const limited = await env.AUTH_KV.get(rateLimitKey);
  if (limited) {
    return json({ error: 'A link was already sent. Please wait 60 seconds and try again.' }, 429);
  }

  // Generate token
  const token = await randomToken();

  // Look up existing plan for this email
  const existingPlan = await env.AUTH_KV.get(`plan:${email}`) || 'free';

  // Store token in KV with 15min TTL
  await env.AUTH_KV.put(
    `token:${token}`,
    JSON.stringify({ email, plan: existingPlan, created: Date.now() }),
    { expirationTtl: 900 }
  );

  // Set rate limit key (60s TTL)
  await env.AUTH_KV.put(rateLimitKey, '1', { expirationTtl: 60 });

  // Build magic link URL
  const baseUrl = env.BASE_URL || 'https://poly-glot.ai';
  const magicUrl = `${baseUrl}/?token=${token}&plan=${existingPlan}&email=${encodeURIComponent(email)}`;

  // Send email
  const sent = await sendMagicLinkEmail(env, email, magicUrl);
  if (!sent) {
    // Clean up token if email failed
    await env.AUTH_KV.delete(`token:${token}`);
    return json({ error: 'Email delivery failed — please try again in a moment.' }, 502);
  }

  // Increment global promo counter for this unique email (fire and forget)
  incrementPromoCount(env, email).catch(() => {});

  return json({ ok: true });
}

/** POST /api/auth/verify */
async function handleVerify(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const token = (body.token || '').trim();
  if (!token) return json({ error: 'Token required' }, 400);

  const raw = await env.AUTH_KV.get(`token:${token}`);
  if (!raw) return json({ error: 'Invalid or expired token' }, 401);

  let data;
  try { data = JSON.parse(raw); } catch { return json({ error: 'Malformed token data' }, 500); }

  // One-time use — delete immediately
  await env.AUTH_KV.delete(`token:${token}`);

  const { email, plan } = data;
  return json({ email, plan: plan || 'free' });
}

/** POST /api/auth/refresh — verify without consuming */
async function handleRefresh(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const token = (body.token || '').trim();
  if (!token) return json({ error: 'Token required' }, 400);

  const raw = await env.AUTH_KV.get(`token:${token}`);
  if (!raw) return json({ error: 'Invalid or expired token' }, 401);

  let data;
  try { data = JSON.parse(raw); } catch { return json({ error: 'Malformed token data' }, 500); }

  return json({ email: data.email, plan: data.plan || 'free' });
}

const PROMO_LIMIT = 50;

/**
 * GET /api/auth/promo-count
 * Returns global signup count + remaining spots.
 * { count, limit, remaining }
 */
async function handlePromoCount(env) {
  const raw   = await env.AUTH_KV.get('promo:count');
  const count = raw ? parseInt(raw, 10) : 0;
  const remaining = Math.max(0, PROMO_LIMIT - count);
  return json({ count, limit: PROMO_LIMIT, remaining });
}

/**
 * Increment global promo counter for a new unique email.
 * Uses KV key `promo:seen:{email}` to ensure each email only counts once.
 */
async function incrementPromoCount(env, email) {
  const seenKey = `promo:seen:${email}`;
  const seen    = await env.AUTH_KV.get(seenKey);
  if (seen) return; // already counted

  // Mark as seen (no TTL — permanent)
  await env.AUTH_KV.put(seenKey, '1');

  // Increment global counter atomically (best-effort with KV)
  const raw   = await env.AUTH_KV.get('promo:count');
  const count = raw ? parseInt(raw, 10) : 0;
  await env.AUTH_KV.put('promo:count', String(count + 1));
}

/** Main fetch handler */
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return preflight();

    const url      = new URL(request.url);
    const pathname = url.pathname.replace(/\/$/, '');

    // GET /api/auth/promo-count — public, no auth needed
    if (request.method === 'GET' && pathname === '/api/auth/promo-count') {
      return handlePromoCount(env);
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    if (pathname === '/api/auth/login')   return handleLogin(request, env);
    if (pathname === '/api/auth/verify')  return handleVerify(request, env);
    if (pathname === '/api/auth/refresh') return handleRefresh(request, env);

    return json({ error: 'Not found' }, 404);
  },
};
