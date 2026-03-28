# 🏗️ Team Dashboard — NOT YET IMPLEMENTED

> **Status: Planned — do not build until Harold says go.**
> All files in this directory are architecture placeholders only.
> Zero production code. Zero dependencies installed.

---

## Overview

Team dashboard for Poly-Glot Pro Team tier ($29/mo).
Allows teams of 5 or 15 to share usage, history, and exports.

**Stack:** Supabase (DB + Auth) + Clerk (Auth UI) + Next.js or vanilla JS

---

## Planned Features

- [ ] Team creation + invite links
- [ ] Per-member usage analytics (languages, files, comments generated)
- [ ] Shared export history (JSONL downloads)
- [ ] Shared API key pool (team pays once, members use it)
- [ ] Admin panel (add/remove members, view usage)
- [ ] Subscription management (LemonSqueezy webhook → Supabase)

---

## When to Build

Trigger: **$1k MRR or 10 paying Team subscribers** — whichever comes first.

---

## Architecture

See `ARCHITECTURE.md` for full technical plan.
See `SCHEMA.md` for database schema.
See `AUTH.md` for authentication flow.
See `API.md` for planned API endpoints.
