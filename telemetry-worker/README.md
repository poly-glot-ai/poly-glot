# polyglot-telemetry — Cloudflare Worker

Receives anonymous usage pings from `poly-glot-ai-cli`.

**Endpoint:** `https://telemetry.poly-glot.ai/cli`  
**Method:** `POST`  
**Health check:** `GET https://telemetry.poly-glot.ai/health`

---

## Payload (zero PII)

```json
{
  "v":        "1.1.0",
  "cmd":      "comment",
  "lang":     "python",
  "provider": "openai",
  "mode":     "file",
  "os":       "darwin",
  "node":     20
}
```

No API keys, no code, no file paths, no usernames — ever.

---

## One-time Cloudflare setup (do this before deploying)

### 1 — Create the Analytics Engine dataset

1. Go to **Cloudflare dashboard → Workers & Pages → Analytics Engine**
2. Click **Create dataset**
3. Name it exactly: `cli_telemetry`

### 2 — Add the DNS record

In the **poly-glot.ai** zone add:

| Type  | Name      | Content                                            | Proxy |
|-------|-----------|----------------------------------------------------|-------|
| CNAME | telemetry | `polyglot-telemetry.<YOUR_SUBDOMAIN>.workers.dev` | ✅ On |

Get your workers.dev subdomain from **Workers & Pages → Overview → subdomain**.

---

## Deploy

```bash
cd telemetry-worker
npm install
npx wrangler login          # one-time auth
npx wrangler deploy
```

### Verify

```bash
# Health check
curl https://telemetry.poly-glot.ai/health

# Simulate a CLI ping
curl -X POST https://telemetry.poly-glot.ai/cli \
  -H "Content-Type: application/json" \
  -d '{"v":"1.1.0","cmd":"comment","lang":"python","provider":"openai","mode":"file","os":"darwin","node":20}'
```

Both should return `{"ok":true}`.

---

## Query data (Cloudflare Analytics Engine SQL API)

```sql
-- Commands run per day
SELECT
  toStartOfDay(timestamp) AS day,
  blob1 AS cmd,
  count() AS runs
FROM cli_telemetry
GROUP BY day, cmd
ORDER BY day DESC
LIMIT 100;

-- Language breakdown
SELECT blob2 AS lang, count() AS n
FROM cli_telemetry
GROUP BY lang
ORDER BY n DESC;

-- Provider split
SELECT blob3 AS provider, count() AS n
FROM cli_telemetry
GROUP BY provider;
```

Run these at:  
`https://api.cloudflare.com/client/v4/accounts/{account_id}/analytics_engine/sql`

---

## Local dev

```bash
npx wrangler dev
# Worker runs on http://localhost:8787
curl -X POST http://localhost:8787/cli \
  -H "Content-Type: application/json" \
  -d '{"v":"1.1.0","cmd":"comment","lang":"go","provider":"anthropic","mode":"file","os":"linux","node":20}'
```

> Note: Analytics Engine writes are no-ops in local dev — they don't error, just don't persist.
