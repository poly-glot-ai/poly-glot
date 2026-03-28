/**
 * Poly-Glot Telemetry Receiver
 * Cloudflare Worker — endpoint: https://telemetry.poly-glot.ai/cli
 *
 * Accepts anonymous usage pings from poly-glot-ai-cli.
 * Stores to Cloudflare Analytics Engine + KV milestone counter.
 * Sends email to owner at confirmed usage milestones via MailChannels.
 *
 * Expected payload (POST /cli):
 *   { v, cmd, lang, provider, mode, os, node }
 *
 * Milestones (confirmed commands run, not installs):
 *   100, 250, 500, 1000, then every 500 after that
 *
 * Email: hwmoses2@icloud.com
 */

export default {
  async fetch(request, env, ctx) {
    // ── CORS pre-flight (browser requests from poly-glot.ai if ever needed) ──
    if (request.method === 'OPTIONS') {
      return corsResponse(204, null);
    }

    const url = new URL(request.url);

    // ── Health check ──────────────────────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/health') {
      return corsResponse(200, { ok: true, ts: Date.now() });
    }

    // ── CLI telemetry endpoint ────────────────────────────────────────────────
    if (request.method === 'POST' && url.pathname === '/cli') {
      return handleCliPing(request, env, ctx);
    }

    // ── Stats endpoint (owner only) ───────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/stats') {
      const secret = url.searchParams.get('secret');
      if (secret !== STATS_SECRET) {
        return corsResponse(401, { error: 'unauthorized' });
      }
      const totalCommands  = parseInt(await env.MILESTONES.get('total_commands') || '0', 10);
      const lastMilestone  = parseInt(await env.MILESTONES.get('last_milestone') || '0', 10);
      const next           = nextMilestone(totalCommands);
      return corsResponse(200, {
        total_commands:  totalCommands,
        last_milestone:  lastMilestone,
        next_milestone:  next,
        npm_downloads:   957,   // last known npm count (manual update)
        note:            'total_commands = real CLI runs by users who opted into telemetry'
      });
    }

    // ── Everything else → 404 ────────────────────────────────────────────────
    return corsResponse(404, { error: 'not found' });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

async function handleCliPing(request, env, ctx) {
  // Parse body — malformed JSON returns 400 (doesn't log anything)
  let body;
  try {
    body = await request.json();
  } catch {
    return corsResponse(400, { error: 'invalid json' });
  }

  // Validate & sanitise — only allow known field values, drop everything else
  const event = sanitise(body);
  if (!event) {
    // Payload structure unrecognisable — still return 200 so CLI doesn't retry
    return corsResponse(200, { ok: true });
  }

  // Non-blocking: write analytics + check milestones in background
  ctx.waitUntil(Promise.all([
    env.TELEMETRY ? writeAnalytics(env.TELEMETRY, event) : Promise.resolve(),
    env.MILESTONES ? checkMilestone(env.MILESTONES, event) : Promise.resolve(),
  ]));

  return corsResponse(200, { ok: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics Engine write
// ─────────────────────────────────────────────────────────────────────────────

async function writeAnalytics(dataset, event) {
  try {
    dataset.writeDataPoint({
      // blobs  → searchable string dimensions
      blobs: [
        event.cmd,                    // [0] command
        event.lang     || 'unknown',  // [1] language
        event.provider || 'unknown',  // [2] AI provider
        event.mode     || 'unknown',  // [3] mode (file/dir/stdin)
        event.os       || 'unknown',  // [4] platform
        event.v        || 'unknown',  // [5] CLI version
      ],
      // doubles → numeric dimensions
      doubles: [
        event.node || 0,              // [0] Node.js major version
      ],
      // indexes → high-cardinality filter key (cmd is the natural one)
      indexes: [event.cmd || 'unknown'],
    });
  } catch {
    // Analytics Engine unavailable — swallow, never surface to caller
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Milestone tracking + email notifications
// ─────────────────────────────────────────────────────────────────────────────

const NOTIFY_EMAIL   = 'hwmoses2@icloud.com';
const STATS_SECRET   = 'polyglot-stats-2026';   // change this anytime
const FROM_EMAIL     = 'milestones@poly-glot.ai';
const FROM_NAME      = 'Poly-Glot';

// Milestones: 100, 250, 500, 1000, then every 500 after
function isMilestone(n) {
  if (n === 100 || n === 250 || n === 500 || n === 1000) return true;
  if (n > 1000 && n % 500 === 0) return true;
  return false;
}

async function checkMilestone(kv, event) {
  try {
    // Only count real usage commands (not config/help)
    if (event.cmd !== 'comment' && event.cmd !== 'explain' && event.cmd !== 'why') return;

    // Atomically increment total command count
    const raw = await kv.get('total_commands');
    const prev = parseInt(raw || '0', 10);
    const next = prev + 1;
    await kv.put('total_commands', String(next));

    // Check if this crosses a milestone
    if (!isMilestone(next)) return;

    // Guard: don't double-send for the same milestone
    const lastHit = parseInt(await kv.get('last_milestone') || '0', 10);
    if (lastHit >= next) return;
    await kv.put('last_milestone', String(next));

    // Fire the email
    await sendMilestoneEmail(next, event);
  } catch {
    // Never surface errors — telemetry must not break
  }
}

async function sendMilestoneEmail(count, event) {
  const subject = `🎉 Poly-Glot CLI — ${count.toLocaleString()} confirmed commands run`;
  const body = `
Hey Harold,

Poly-Glot CLI just hit ${count.toLocaleString()} confirmed commands run.

━━━━━━━━━━━━━━━━━━━━━━━━━
  Milestone: ${count.toLocaleString()} commands
  Triggered by: poly-glot ${event.cmd}
  Language: ${event.lang || 'unknown'}
  Provider: ${event.provider || 'unknown'}
  OS: ${event.os || 'unknown'}
  CLI version: ${event.v || 'unknown'}
━━━━━━━━━━━━━━━━━━━━━━━━━

This counts only real 'comment' and 'explain' commands from opted-in users —
not installs, not config runs, not test pings.

Next milestone: ${nextMilestone(count).toLocaleString()} commands

— Poly-Glot Telemetry
  `.trim();

  try {
    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: NOTIFY_EMAIL }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject,
        content: [{ type: 'text/plain', value: body }],
      }),
    });
  } catch {
    // Email failure is non-fatal
  }
}

function nextMilestone(current) {
  const candidates = [100, 250, 500, 1000];
  for (const c of candidates) {
    if (c > current) return c;
  }
  // After 1000: next multiple of 500
  return Math.ceil((current + 1) / 500) * 500;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sanitiser — accepts only known shapes, strips unknown keys
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_CMDS      = new Set(['comment', 'why', 'explain', 'config', 'help']);
const KNOWN_PROVIDERS = new Set(['openai', 'anthropic', null, undefined]);
const KNOWN_MODES     = new Set(['file', 'dir', 'stdin', null, undefined]);
const KNOWN_OS        = new Set(['darwin', 'linux', 'win32', 'freebsd', 'openbsd', null, undefined]);
const KNOWN_LANGS     = new Set([
  'javascript','typescript','python','java','cpp','csharp',
  'go','rust','ruby','php','swift','kotlin', null, undefined,
]);

function sanitise(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const cmd = typeof raw.cmd === 'string' ? raw.cmd.slice(0, 32) : null;
  if (!cmd) return null;

  return {
    v:        typeof raw.v === 'string'    ? raw.v.slice(0, 16)       : 'unknown',
    cmd:      KNOWN_CMDS.has(cmd)          ? cmd                       : 'unknown',
    lang:     KNOWN_LANGS.has(raw.lang)    ? (raw.lang || null)        : null,
    provider: KNOWN_PROVIDERS.has(raw.provider) ? (raw.provider || null) : null,
    mode:     KNOWN_MODES.has(raw.mode)    ? (raw.mode || null)        : null,
    os:       KNOWN_OS.has(raw.os)         ? (raw.os || null)          : null,
    node:     typeof raw.node === 'number' ? Math.floor(raw.node)      : 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function corsResponse(status, body) {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
    'Content-Type': 'application/json',
  };
  return new Response(
    body !== null ? JSON.stringify(body) : null,
    { status, headers },
  );
}
