# Team Dashboard — Database Schema

> ⚠️ NOT IMPLEMENTED. Placeholder only.
> Run this SQL in Supabase when ready.

---

## Tables

### teams
```sql
CREATE TABLE teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  owner_id        TEXT NOT NULL,          -- Clerk user ID
  plan            TEXT DEFAULT 'team5',   -- 'team5' | 'team15'
  seat_limit      INT DEFAULT 5,
  ls_subscription_id TEXT,               -- LemonSqueezy subscription ID
  ls_variant_id   TEXT,                  -- LemonSqueezy variant ID
  status          TEXT DEFAULT 'active', -- 'active' | 'cancelled' | 'past_due'
  trial_ends_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### team_members
```sql
CREATE TABLE team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,             -- Clerk user ID
  email       TEXT NOT NULL,
  role        TEXT DEFAULT 'member',     -- 'admin' | 'member'
  joined_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### usage_events
```sql
CREATE TABLE usage_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,             -- Clerk user ID
  event_type  TEXT NOT NULL,             -- 'comment' | 'why' | 'both' | 'explain' | 'export'
  language    TEXT,                      -- 'python' | 'javascript' etc
  file_count  INT DEFAULT 1,
  model       TEXT,                      -- 'gpt-4.1-mini' etc
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### exports
```sql
CREATE TABLE exports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  format      TEXT DEFAULT 'jsonl',      -- 'jsonl' | 'csv'
  file_count  INT,
  size_bytes  INT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### invites
```sql
CREATE TABLE invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID REFERENCES teams(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  token       TEXT UNIQUE NOT NULL,
  accepted    BOOLEAN DEFAULT FALSE,
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row Level Security (RLS) Policies

```sql
-- Users can only see their own team's data
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- Team members can read their team
CREATE POLICY "team_members_read_own_team"
ON teams FOR SELECT
USING (id IN (
  SELECT team_id FROM team_members WHERE user_id = auth.uid()
));
```
