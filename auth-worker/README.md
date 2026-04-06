# 🔐 Poly-Glot Auth Worker

Cloudflare Worker powering authentication, session management, usage tracking, and plan enforcement for poly-glot.ai.

---

## Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Send magic link email |
| `POST` | `/api/auth/free-signup` | "Start for Free" — register free account + send magic link |
| `POST` | `/api/auth/verify` | Validate magic-link token (one-time use) → session |
| `POST` | `/api/auth/refresh` | Validate session token (non-destructive) |
| `POST` | `/api/auth/check-plan` | Verify session → `{ valid, plan, email }` |
| `POST` | `/api/auth/set-plan` | Admin: set plan for email (requires `ADMIN_SECRET`) |

### Usage
| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/auth/get-usage` | Return current file usage for a session token (`?token=`) |
| `POST` | `/api/auth/track-usage` | Increment server-side file counter (CLI + VS Code) |
| `POST` | `/api/auth/mcp-track-usage` | Increment MCP call counter — Pro+ only |
| `GET`  | `/api/auth/mcp-get-usage` | Return current MCP usage without incrementing (`?token=`) |
| `POST` | `/api/auth/register-device` | Register VS Code device fingerprint |
| `POST` | `/api/auth/device-usage` | Get/increment usage for anonymous device |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/auth/admin/users` | All users, plan breakdown, usage (requires `ADMIN_SECRET`) |

### Proxies
| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/auth/gh-proxy` | GitHub App installations proxy |
| `GET`  | `/api/auth/cws-proxy` | Chrome Web Store installs proxy |
| `POST` | `/api/auth/vsc-proxy` | VS Code Marketplace stats proxy |
| `POST` | `/api/stripe/webhook` | Stripe subscription lifecycle events |

---

## KV Key Schema

| Key | Value | TTL |
|-----|-------|-----|
| `ratelimit:{email}` | `"1"` | 60 s |
| `token:{token}` | `{"email","plan","created"}` | 900 s (15 min) |
| `session:{token}` | `{"email","plan","created"}` | 30 days |
| `plan:{email}` | `"free"` / `"pro"` / `"team"` / `"enterprise"` | none |
| `usage:{email}:{YYYY-MM}` | integer string (file count) | 35 days |
| `mcp-usage:{email}:{YYYY-MM}` | integer string (MCP call count) | 35 days |
| `device:{deviceId}` | `{"fingerprint","created"}` | none |
| `device-usage:{deviceId}:{YYYY-MM}` | integer string | 35 days |
| `stripe:{customerId}` | email string | none |

---

## MCP Quota Constants

MCP is a Pro+ feature — enforced server-side per calendar month:

| Plan | MCP calls/month |
|------|:--------------:|
| Free | 🔒 0 (blocked) |
| Pro | 200 |
| Team | 1,000 |
| Enterprise | Unlimited |

---

## Version Enforcement

The worker enforces minimum client versions on usage endpoints:

| Header | Minimum | Action if below |
|--------|---------|-----------------|
| `X-CLI-Version` | `1.9.0` | 426 Upgrade Required |
| `X-Extension-Version` | `1.4.40` | 426 Upgrade Required |

Requests with no version header (web UI, unknown clients) pass through — they are still blocked by session/token auth on every usage endpoint.

---

## Security

- Tokens: 32 random bytes (256 bits entropy) — brute-force infeasible
- Magic links: single-use, 15-minute TTL
- Sessions: 30-day TTL, plan read live from KV on every request
- Rate limiting: 1 request per email per 60 seconds
- Disposable email blocklist: 100+ domains + test-pattern regex
- CORS: locked to `https://poly-glot.ai`
- localStorage plan never trusted — server KV is authoritative

---

## Deploy

### 1. Install Wrangler
```bash
cd auth-worker && npm install
```

### 2. Login to Cloudflare
```bash
npx wrangler login
```

### 3. Create KV namespace
```bash
npx wrangler kv namespace create AUTH_KV
```
Paste the `id` into `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "AUTH_KV"
id      = "PASTE_ID_HERE"
```

### 4. Set secrets
```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put ADMIN_SECRET
```

### 5. Deploy
```bash
npx wrangler deploy
```

---

## Local Development

Create `.dev.vars` (git-ignored):
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
BASE_URL=http://localhost:8787
ADMIN_SECRET=your-local-secret
```

```bash
npm run dev
```

Test:
```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com"}'
```

---

## Useful Wrangler Commands

```bash
npm run tail                              # stream live logs from production
npm run kv:list                           # list all KV keys
wrangler kv key get --binding=AUTH_KV "plan:user@example.com"
wrangler kv key put --binding=AUTH_KV "plan:user@example.com" "pro"
wrangler kv key delete --binding=AUTH_KV "session:<token>"
```

---

## Environment Variables

| Name | Required | Description |
|------|:--------:|-------------|
| `RESEND_API_KEY` | ✅ | Resend API key (`re_…`) |
| `BASE_URL` | ✅ | `https://poly-glot.ai` |
| `ADMIN_SECRET` | ✅ | Secret for `/api/auth/admin/users` |
| `AUTH_KV` | ✅ | KV namespace binding |
