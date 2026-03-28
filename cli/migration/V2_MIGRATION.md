# CLI v2.0.0 Migration Plan

> ⚠️ NOT YET IMPLEMENTED. Placeholder only.
> Flag Harold when ready to execute.

---

## When to Do This

Trigger: **LemonSqueezy approved + first paying Pro subscriber**

---

## What Changes in v2.0.0

| Feature | v1.x (Current) | v2.0.0 (Planned) |
|---------|----------------|------------------|
| Free languages | All 12 (legacy) | Python, JS, Java only |
| Pro languages | N/A | All 12 (license key) |
| License check | None | `poly-glot auth login` |
| Deprecation warning | None | Shows on every run in v1.x |
| Auto-update nudge | None | Yes — shown after gate hit |

---

## Step-by-Step Execution Plan

### Step 1 — Add Deprecation Warning to v1.5.x (Before v2)
Bump to `v1.5.3` — add this warning on every run:

```bash
⚠️  poly-glot v1.5.x is deprecated.
    Upgrade to v2.0.0: npm install -g poly-glot-ai-cli@latest
    Free tier: Python · JavaScript · Java
    Pro (all 12 languages): https://poly-glot.ai/#pricing
```

### Step 2 — Build License Key Auth (v2.0.0)
Add `poly-glot auth login` command:

```bash
$ poly-glot auth login
  Enter your Poly-Glot Pro license key: ********
  ✅ Authenticated as harold@example.com (Pro plan)
  🔓 All 12 languages unlocked
```

- License key stored in `~/.poly-glot/config.json`
- Validated against Supabase/Cloudflare Worker on each run
- Free users: no key needed, 3 languages only
- Pro users: key unlocks all 12

### Step 3 — Add `poly-glot auth` Commands

```bash
poly-glot auth login     # enter license key
poly-glot auth logout    # remove stored key
poly-glot auth status    # show current plan + email
```

### Step 4 — Publish v2.0.0
```bash
cd cli
npm version major        # bumps to 2.0.0
npm publish
```

### Step 5 — Notify Legacy Users
- Add notice to npm package page
- Add banner to poly-glot.ai
- Email waitlist (via Web3Forms export)

---

## License Key Validation (How It Works)

```
User runs poly-glot comment main.go
        ↓
CLI reads ~/.poly-glot/config.json
        ↓
If no key → block (free tier, 3 languages)
If key exists → POST to poly-glot.ai/api/validate-key
        ↓
Cloudflare Worker checks key against KV store
        ↓
Returns { valid: true, plan: 'pro', email: '...' }
        ↓
All 12 languages unlocked for this run
```

---

## Files to Create When Ready

```
cli/src/auth.ts          → login/logout/status commands
cli/src/license.ts       → key storage + validation
workers/license/         → Cloudflare Worker (key validation API)
```

---

## Estimated Build Time

| Task | Time |
|------|------|
| Deprecation warning (v1.5.3) | 30 mins |
| License key storage (local) | 2 hours |
| Cloudflare Worker validator | 3 hours |
| Auth commands (login/logout/status) | 3 hours |
| LemonSqueezy → key generation webhook | 3 hours |
| Testing + publish | 2 hours |
| **Total** | **~1.5 days** |
