# Poly-Glot Auth Worker

Cloudflare Worker that powers magic link authentication for poly-glot.ai.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Send magic link email |
| `POST` | `/api/auth/free-signup` | "Start for Free" — register free account + send magic link |
| `POST` | `/api/auth/verify` | Validate magic-link token (one-time use) → session |
| `POST` | `/api/auth/refresh` | Validate session token (non-destructive) |
| `POST` | `/api/auth/check-plan` | Verify session → `{ valid, plan }` |
| `POST` | `/api/auth/set-plan` | Admin: set plan for email (requires `ADMIN_SECRET`) |
| `POST` | `/api/auth/validate-key` | Verify OpenAI/Anthropic/Google key (zero tokens) |
| `GET`  | `/api/auth/get-usage` | Return current usage for a session token (`?token=`) |
| `POST` | `/api/auth/track-usage` | Increment server-side file counter |
| `POST` | `/api/auth/register-device` | Register a device fingerprint |
| `POST` | `/api/auth/device-usage` | Get usage for a device |
| `POST` | `/api/auth/webhook/stripe` | Stripe subscription lifecycle events |
| `GET`  | `/api/auth/gh-proxy` | GitHub App installations proxy |
| `GET`  | `/api/auth/cws-proxy` | Chrome Web Store installs proxy |
| `POST` | `/api/auth/vsc-proxy` | VS Code Marketplace stats proxy |

### KV Key Schema

| Key | Value | TTL |
|-----|-------|-----|
| `ratelimit:{email}` | `"1"` | 60 s |
| `token:{token}` | `{"email","plan","created"}` | 900 s (15 min) |
| `session:{token}` | `{"email","plan","created"}` | 30 days |
| `plan:{email}` | `"free"` / `"pro"` / `"team"` / `"enterprise"` | none |
| `usage:{email}:{YYYY-MM}` | integer string | 35 days |
| `stripe_customer:{customerId}` | email string | none |

## Deploy in 5 steps

### 1. Install Wrangler
```bash
cd poly-glot-auth-worker
npm install
```

### 2. Login to Cloudflare
```bash
npx wrangler login
```

### 3. Create KV namespace
```bash
npx wrangler kv namespace create AUTH_KV
```
Copy the `id` from the output and paste it into `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "AUTH_KV"
id      = "PASTE_ID_HERE"
```

### 4. Set secrets
```bash
npx wrangler secret put RESEND_API_KEY
# Paste your Resend API key when prompted
# Get one free at https://resend.com — add poly-glot.ai as a domain
```

### 5. Deploy
```bash
npx wrangler deploy
```

## Resend setup (required)

1. Go to [resend.com](https://resend.com) → sign up free
2. Add domain: **poly-glot.ai**
3. Add the DNS TXT record Resend gives you to Cloudflare DNS
4. Wait for verification (usually < 5 min)
5. Create an API key → use in step 4 above

## How it works

```
User enters email
      ↓
Worker generates 32-byte hex token
      ↓
Stored in KV: token:{token} → {email, plan} TTL=15min
Rate limit stored: ratelimit:{email} TTL=60s
      ↓
Resend sends branded email with magic link:
https://poly-glot.ai/?token=abc123&plan=free&email=user@example.com
      ↓
User clicks link → auth.v7.js reads URL params
      ↓
auth.v7.js calls POST /api/auth/verify with token
      ↓
Worker returns {email, plan} and deletes token (one-time use)
      ↓
auth.v7.js stores token + plan in localStorage, applies plan gating
```

## Plan management (future)

To upgrade a user to Pro after Stripe payment:
```bash
# Set plan in KV via wrangler
npx wrangler kv key put --binding AUTH_KV "plan:user@example.com" "pro"
```

Or add a Stripe webhook handler that writes to AUTH_KV automatically.

## Monitoring
```bash
npx wrangler tail
```
