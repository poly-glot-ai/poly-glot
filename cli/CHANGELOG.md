## [2.1.32] — 2026-04-05
- ✨ feat: email-first VS Code onboarding + CLI postinstall CTA overhaul (v2.1.31 / vscode 1.4.41)

---

## [2.1.21] — 2026-04-05
- pricing: purge all stale EARLYBIRD3/trial messaging — Pro locked $9/mo forever, expires May 1 2026

---

## [2.1.20] — 2026-04-05
- 🐛 fix: close all 3 circumvention gaps — machine fingerprint, offline hard-block, CI bypass removed [deploy]

---

## [2.1.15] — 2026-04-05
- 🐛 fix(cli/index): verifyLicense → /check-plan; hasPro checks sessionToken; CI only skips prompt

---

## [2.1.14] — 2026-04-05
- 🐛 fix(cli/usage): UTM tags on Stripe URLs; CI env no longer bypasses usage tracking
- 🐛 fix: close conversion funnel holes + UI polish [deploy]
- 🐛 fix: require sign-up for try-it-free, fix all buttons + messages, fix VS Code counter

---

## [2.1.13] — 2026-04-04
- 🐛 fix: global server-side quota enforcement — all CLI usage tracked + CTA warnings
- 🐛 fix: wire CLI usage enforcement to correct server endpoints

---

## [2.1.10] — 2026-04-03
- chore: CLI v2.1.9 — direct Stripe CTAs, zero pricing-page redirects [deploy]
- ✨ feat: VS Code v1.4.12 + CLI v2.1.8 — zero pricing-page redirects, all CTAs direct Stripe

---

## [2.1.5] — 2026-04-03
- 🐛 fix: v2.0.0 — fix login gate, sessionToken typed in Config, verify uses /verify endpoint [deploy]

---

## [1.9.9] — 2026-04-03
- ✨ feat: v1.9.8 — close quota gaps in bugs/refactor/test/explain, full flags README [deploy]

---

## [1.9.7] — 2026-04-03
- 🐛 fix: v1.9.6 — close quota gaps in bugs/refactor/test/explain commands [deploy]
- 🐛 fix: correct repository URL to poly-glot-ai org, add homepage, bump to v1.9.5
- 🐛 fix: rewrite npm README — remove EARLYBIRD3, update pricing, fix repo URLs
- 🐛 fix: rewrite npm README — remove EARLYBIRD3, update pricing, fix repo URLs
- ✨ feat: hard exit if npm deprecated, await version check before commands
- ✨ feat: startup version check + deprecate all versions <=1.8.0 on npm
- ✨ feat: send X-CLI-Version header on all worker requests, handle 426 upgrade_required
- cli: add pricing line to soft quota warning (10 files remaining)
- cli: replace EARLYBIRD3 promo with current pricing (Free $0 · Pro $9/mo · Team $29/mo)
- ✨ feat(cli): gate all commands behind login + full server-side usage sync
- ✨ feat(cli): gate all commands behind login — require free account on first run
- 🐛 fix: update enterprise contact to hwmoses2@icloud.com in cli/README.md
- chore(cli): bump version to 1.9.0
- ✨ feat(cli): add poly-glot login + server-side usage sync v1.9.0
- ✨ feat(cli): add poly-glot login command + server-side usage sync v1.9.0
