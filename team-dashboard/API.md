# Team Dashboard — API Endpoints Plan

> ⚠️ NOT IMPLEMENTED. Placeholder only.
> These will be Supabase Edge Functions when built.

---

## Endpoints

### Webhooks (LemonSqueezy → Supabase)

```
POST /api/webhooks/lemonsqueezy
  Events handled:
  - subscription_created  → create team, send welcome email
  - subscription_updated  → update plan/seats
  - subscription_cancelled → mark team inactive
  - subscription_resumed  → reactivate team
```

### Teams

```
GET  /api/team                    → get current user's team
POST /api/team/invite             → invite a member by email
DEL  /api/team/members/:userId    → remove a member
GET  /api/team/members            → list all members + usage
```

### Usage

```
POST /api/usage/log               → log a usage event (comment/explain/export)
GET  /api/usage/summary           → get team usage summary (last 30 days)
GET  /api/usage/member/:userId    → get per-member usage
```

### Exports

```
POST /api/exports/jsonl           → generate + log JSONL export
GET  /api/exports/history         → list past exports
```

---

## Usage Logging (How the App Calls It)

```javascript
// Add this to waitlist.js or a new analytics.js
// when team dashboard is built

async function logUsage(eventType, language) {
  if (!window.PolyGlotAuth?.teamId) return; // skip if not a team user
  await fetch('/api/usage/log', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${window.PolyGlotAuth.token}` },
    body: JSON.stringify({
      event_type: eventType,
      language: language,
      model: currentModel
    })
  });
}
```

---

## Dashboard UI Pages (When Built)

```
/dashboard              → overview (usage chart, recent activity)
/dashboard/members      → member list + per-member stats
/dashboard/exports      → export history + new export
/dashboard/settings     → team name, seats, billing, cancel
/invite/:token          → accept team invite
```
