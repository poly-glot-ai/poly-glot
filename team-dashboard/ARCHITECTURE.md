# Team Dashboard — Architecture Plan

> ⚠️ NOT IMPLEMENTED. Placeholder only.

---

## Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Database | Supabase (Postgres) | Free tier, built-in auth, realtime |
| Auth UI | Clerk | Best-in-class login/signup UI, team invites |
| Frontend | Vanilla JS (matches existing site) | No framework overhead |
| API | Supabase Edge Functions | Serverless, no server to manage |
| Payments | LemonSqueezy (already set up) | Webhooks → Supabase |
| Hosting | Cloudflare Pages or GitHub Pages | Already on Cloudflare |

---

## High-Level Flow

```
User pays on LemonSqueezy
        ↓
LemonSqueezy webhook → Supabase Edge Function
        ↓
Creates team record in DB + sends invite email via Clerk
        ↓
Team members sign in via Clerk
        ↓
Each action (comment, export, explain) logged to Supabase
        ↓
Dashboard reads from Supabase → renders usage stats
```

---

## Services to Set Up (When Ready)

1. **Supabase**
   - Create project at supabase.com
   - Run schema from SCHEMA.md
   - Set up Row Level Security (RLS) policies
   - Get SUPABASE_URL + SUPABASE_ANON_KEY

2. **Clerk**
   - Create app at clerk.com
   - Configure organization/team features
   - Get CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY

3. **LemonSqueezy Webhooks**
   - Add webhook URL → Supabase Edge Function
   - Events: subscription_created, subscription_cancelled, subscription_updated

---

## Environment Variables Needed (Future)

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
LEMONSQUEEZY_WEBHOOK_SECRET=
```

---

## Estimated Build Time

| Phase | Task | Time |
|-------|------|------|
| 1 | Supabase + Clerk setup | 4 hours |
| 2 | Auth flow (login/signup/invite) | 4 hours |
| 3 | Usage logging hooks | 4 hours |
| 4 | Dashboard UI | 8 hours |
| 5 | LemonSqueezy webhook handler | 4 hours |
| 6 | Testing + deployment | 4 hours |
| **Total** | | **~2-3 days** |
