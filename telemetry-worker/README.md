# 📊 Poly-Glot Telemetry Worker

Cloudflare Worker that receives opt-in anonymous CLI telemetry pings, aggregates command counts, and serves stats to the admin dashboard.

**Base URL:** `https://telemetry.poly-glot.ai`

> Telemetry is **opt-in only** — disabled by default. Users enable it with `poly-glot config --telemetry`. No code, no emails, no API keys are ever sent.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/cli` | Receive a telemetry ping from the CLI |
| `GET`  | `/health` | Worker heartbeat — returns `{"ok":true}` |
| `GET`  | `/stats` | Aggregate stats — `?secret=<TEL_SECRET>` required |

### `/stats` Response

```json
{
  "ok": true,
  "total_commands": 1234,
  "next_milestone": 2000,
  "npm_downloads": 4496,
  "period": "2026-04"
}
```

### `/cli` Ping Payload

```json
{
  "v": "2.1.32",
  "cmd": "comment",
  "lang": "python",
  "provider": "openai",
  "mode": "file",
  "os": "darwin",
  "node": 20
}
```

No email, no API key, no code — only usage shape.

---

## Deploy

### 1. Create Analytics Engine dataset

1. Cloudflare dashboard → **Workers & Pages → Analytics Engine**
2. Create dataset named exactly: `cli_telemetry`

### 2. Add DNS record

In the `poly-glot.ai` Cloudflare zone:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `telemetry` | `polyglot-telemetry.<subdomain>.workers.dev` | ✅ On |

### 3. Deploy

```bash
cd telemetry-worker
npm install
npx wrangler login
npx wrangler deploy
```

### 4. Verify

```bash
curl https://telemetry.poly-glot.ai/health
# → {"ok":true}

curl -X POST https://telemetry.poly-glot.ai/cli \
  -H "Content-Type: application/json" \
  -d '{"v":"2.1.32","cmd":"comment","lang":"python","provider":"openai","mode":"file","os":"darwin","node":20}'
# → {"ok":true}
```

---

## Local Development

```bash
npx wrangler dev
curl -X POST http://localhost:8787/cli \
  -H "Content-Type: application/json" \
  -d '{"v":"2.1.32","cmd":"comment","lang":"go","provider":"anthropic","mode":"file","os":"linux","node":20}'
```

> Analytics Engine writes are no-ops in local dev — they won't error, just won't persist.

---

## Analytics Engine SQL Queries

```sql
-- Commands run per day
SELECT toStartOfDay(timestamp) AS day, blob1 AS cmd, count() AS runs
FROM cli_telemetry GROUP BY day, cmd ORDER BY day DESC LIMIT 100;

-- Language breakdown
SELECT blob2 AS lang, count() AS n
FROM cli_telemetry GROUP BY lang ORDER BY n DESC;

-- Provider split
SELECT blob3 AS provider, count() AS n
FROM cli_telemetry GROUP BY provider;
```

---

## Environment Variables

| Name | Required | Description |
|------|:--------:|-------------|
| `TEL_SECRET` | ✅ | Secret for `/stats` endpoint |
| `AE_DATASET` | ✅ | Analytics Engine binding name (`cli_telemetry`) |

---

## Links

- 🌐 Website: [poly-glot.ai](https://poly-glot.ai)
- ⌨️ CLI: [poly-glot-ai-cli](https://www.npmjs.com/package/poly-glot-ai-cli)
- 🔐 Auth Worker: [auth-worker/README.md](../auth-worker/README.md)
