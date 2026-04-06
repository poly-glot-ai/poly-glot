# 🏗️ Team Dashboard — NOT YET IMPLEMENTED

> **Status: Planned — do not build until Harold says go.**
> All files in this directory are architecture placeholders only.
> Zero production code. Zero dependencies installed.

---

## Overview

Team dashboard for Poly-Glot Pro Team tier ($29/mo, 5 seats).
Allows teams to share usage, history, templates, and exports.

**Stack:** Cloudflare Workers + KV (no external DB — consistent with existing auth infra)

---

## Planned Features

- [ ] Team creation + invite links
- [ ] Per-member usage analytics (languages, files, comments generated)
- [ ] Shared export history (JSONL downloads)
- [ ] Shared API key pool (team pays once, members use it)
- [ ] Admin panel (add/remove members, view usage breakdown)
- [ ] MCP usage tracking per team member
- [ ] Subscription management (Stripe webhook → KV plan updates)

---

## When to Build

Trigger: **$1k MRR or 10 paying Team subscribers** — whichever comes first.

---

## Pricing Context

| Plan | Seats | MCP calls/mo | Price |
|------|:-----:|:------------:|-------|
| Pro | 1 | 200 | $9/mo |
| **Team** | **5** | **1,000** | **$29/mo** |
| Enterprise | Custom | Unlimited | Custom |

---

## Architecture Notes

- Auth: reuse existing `session:{token}` KV pattern from auth-worker
- Usage: `usage:{email}:{YYYY-MM}` already per-member — just aggregate on team ID
- MCP: `mcp-usage:{email}:{YYYY-MM}` — same pattern, pool across team
- Team KV keys: `team:{teamId}` → `{members:[emails], plan, adminEmail}`

See `ARCHITECTURE.md` for full technical plan.
