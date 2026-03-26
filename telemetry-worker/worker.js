/**
 * Poly-Glot Telemetry Receiver
 * Cloudflare Worker — endpoint: https://telemetry.poly-glot.ai/cli
 *
 * Accepts anonymous usage pings from poly-glot-ai-cli.
 * Zero PII collected. Stores to Cloudflare Analytics Engine.
 *
 * Expected payload (POST /cli):
 *   { v, cmd, lang, provider, mode, os, node }
 *
 * All writes are fire-and-forget from the worker's perspective —
 * if Analytics Engine is unavailable we still return 200 so the CLI
 * never retries or blocks.
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

  // Write to Analytics Engine (non-blocking — use ctx.waitUntil so the worker
  // doesn't close the connection before the write is flushed)
  if (env.TELEMETRY) {
    ctx.waitUntil(writeAnalytics(env.TELEMETRY, event));
  }

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
// Sanitiser — accepts only known shapes, strips unknown keys
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_CMDS      = new Set(['comment', 'explain', 'config', 'help']);
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
