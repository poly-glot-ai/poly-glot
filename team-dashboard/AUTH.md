# Team Dashboard — Authentication Flow

> ⚠️ NOT IMPLEMENTED. Placeholder only.

---

## Auth Provider: Clerk

Clerk handles all login/signup/invite UI.
Supabase handles all data storage.
They talk to each other via JWT.

---

## User Flows

### Flow 1 — New Team (Owner Signs Up)
```
1. User clicks "Start Team →" on pricing page
2. LemonSqueezy checkout opens (EARLYBIRD3 applied)
3. Payment confirmed → LemonSqueezy fires webhook
4. Webhook handler creates team record in Supabase
5. Sends welcome email with "Set up your team →" link
6. Owner clicks link → Clerk signup/login
7. Owner lands on team dashboard
8. Owner invites members via email
```

### Flow 2 — Team Member Accepts Invite
```
1. Owner clicks "Invite member" in dashboard
2. System creates invite token in Supabase invites table
3. Email sent to member with invite link
4. Member clicks link → Clerk signup/login
5. Invite token validated → member added to team
6. Member lands on shared dashboard
```

### Flow 3 — Subscription Cancelled
```
1. LemonSqueezy fires subscription_cancelled webhook
2. Webhook handler updates team status → 'cancelled'
3. Members lose Pro access on next login
4. Owner sees "Reactivate" prompt in dashboard
```

---

## Clerk Configuration (When Ready)

- Enable "Organizations" feature in Clerk dashboard
- Set up JWT template to include team_id claim
- Configure redirect URLs to /dashboard
- Set up email templates for invites

---

## JWT Flow (Clerk → Supabase)

```javascript
// Clerk issues JWT with custom claims
{
  "sub": "user_clerk_id",
  "team_id": "uuid-from-supabase",
  "role": "admin" | "member",
  "plan": "team5" | "team15"
}

// Supabase RLS reads auth.uid() from JWT
// Automatically scopes all queries to user's team
```
