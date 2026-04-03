/**
 * usage.ts — Monthly file-usage tracking for the Free tier.
 *
 * Storage: ~/.config/polyglot/usage.json
 * Schema:  { "YYYY-MM": number }   (one key per calendar month)
 *
 * Rules:
 *  - Free plan: 50 files per calendar month (UTC).
 *  - Pro/Team/Enterprise: unlimited, this module is never called.
 *  - Counter increments AFTER a file is successfully written so failed
 *    attempts don't eat quota.
 *  - Month key rolls automatically — January counter doesn't affect February.
 */

import * as fs   from 'fs';
import * as path from 'path';
import * as os   from 'os';

// ─── Constants ────────────────────────────────────────────────────────────────

export const FREE_MONTHLY_LIMIT = 50;

const USAGE_DIR  = path.join(os.homedir(), '.config', 'polyglot');
const USAGE_FILE = path.join(USAGE_DIR, 'usage.json');

// ─── Types ────────────────────────────────────────────────────────────────────

type UsageStore = Record<string, number>; // { "2026-03": 12, "2026-04": 0, … }

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the current month key in "YYYY-MM" format (UTC). */
function monthKey(): string {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

/** First day of the *next* calendar month, formatted for display. */
function nextResetDate(): string {
    const d   = new Date();
    const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    return next.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** Full month name for display ("March 2026"). */
function currentMonthLabel(): string {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// ─── Read / Write ─────────────────────────────────────────────────────────────

function readStore(): UsageStore {
    try {
        if (!fs.existsSync(USAGE_FILE)) return {};
        const raw = fs.readFileSync(USAGE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) return parsed as UsageStore;
    } catch {
        // Corrupt file — start fresh
    }
    return {};
}

function writeStore(store: UsageStore): void {
    try {
        fs.mkdirSync(USAGE_DIR, { recursive: true });
        fs.writeFileSync(USAGE_FILE, JSON.stringify(store, null, 2), 'utf8');
        fs.chmodSync(USAGE_FILE, 0o600);
    } catch {
        // Non-fatal — don't crash the CLI if we can't write usage
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns how many files have been processed this calendar month.
 */
export function getMonthlyUsage(): number {
    const store = readStore();
    return store[monthKey()] ?? 0;
}

/**
 * Returns true if the free user has NOT yet hit their monthly limit.
 * Always returns true for Pro users (caller must check plan first).
 */
export function hasRemainingQuota(): boolean {
    return getMonthlyUsage() < FREE_MONTHLY_LIMIT;
}

/**
 * Increment the usage counter by `count` (default 1).
 * Call this AFTER a file is successfully written.
 */
export function incrementUsage(count = 1): void {
    const store = readStore();
    const key   = monthKey();
    store[key]  = (store[key] ?? 0) + count;
    writeStore(store);
}

/**
 * Assert that the free user still has quota remaining.
 * If they've hit 50, print a clear upgrade message and exit(1).
 *
 * @param filesNeeded  How many files are about to be processed (default 1).
 *                     For --dir runs we check upfront whether the batch would
 *                     exceed the limit.
 */
export function assertQuota(filesNeeded = 1): void {
    const used      = getMonthlyUsage();
    const remaining = FREE_MONTHLY_LIMIT - used;

    if (remaining <= 0) {
        // ── Hard limit reached ───────────────────────────────────────────────
        console.error(
            `\n  \x1b[31m✗  Free plan limit reached — ${FREE_MONTHLY_LIMIT} files this month\x1b[0m\n` +
            `\n  \x1b[2mYou've used \x1b[0m\x1b[1m${used}/${FREE_MONTHLY_LIMIT}\x1b[0m\x1b[2m files on the Free plan for ${currentMonthLabel()}.\x1b[0m` +
            `\n  \x1b[2mResets \x1b[0m\x1b[36m${nextResetDate()}\x1b[0m\x1b[2m · Upgrade for unlimited files.\x1b[0m\n` +
            `\n  \x1b[1mUpgrade → \x1b[36mhttps://poly-glot.ai/#pg-pricing-section\x1b[0m` +
            `\n  \x1b[2mPlans: Free $0 · Pro \x1b[0m\x1b[1m$9/mo\x1b[0m\x1b[2m unlimited · Team \x1b[0m\x1b[1m$29/mo\x1b[0m\x1b[2m · Enterprise custom\x1b[0m\n` +
            `\n  \x1b[2mAlready have Pro? Run: \x1b[0m\x1b[36mpoly-glot config --token YOUR_TOKEN\x1b[0m\n`
        );
        process.exit(1);
    }

    if (filesNeeded > remaining) {
        // ── Batch would exceed limit — warn exactly how many are left ────────
        console.error(
            `\n  \x1b[31m✗  Not enough quota for this batch\x1b[0m\n` +
            `\n  \x1b[2mThis batch needs \x1b[0m\x1b[1m${filesNeeded} files\x1b[0m\x1b[2m but you only have \x1b[0m\x1b[1m${remaining} remaining\x1b[0m\x1b[2m this month.\x1b[0m` +
            `\n  \x1b[2mUsed: \x1b[0m\x1b[1m${used}/${FREE_MONTHLY_LIMIT}\x1b[0m\x1b[2m · Resets \x1b[0m\x1b[36m${nextResetDate()}\x1b[0m\n` +
            `\n  \x1b[1mUpgrade → \x1b[36mhttps://poly-glot.ai/#pg-pricing-section\x1b[0m` +
            `\n  \x1b[2mPlans: Free $0 · Pro \x1b[0m\x1b[1m$9/mo\x1b[0m\x1b[2m unlimited · Team \x1b[0m\x1b[1m$29/mo\x1b[0m\x1b[2m · Enterprise custom\x1b[0m\n` +
            `\n  \x1b[2mAlready have Pro? Run: \x1b[0m\x1b[36mpoly-glot config --token YOUR_TOKEN\x1b[0m\n`
        );
        process.exit(1);
    }

    // ── Soft warning: last 10 files ───────────────────────────────────────────
    if (remaining <= 10) {
        console.warn(
            `\n  \x1b[33m⚠️   Free plan: \x1b[1m${remaining} file${remaining === 1 ? '' : 's'} remaining\x1b[0m\x1b[33m this month\x1b[0m` +
            `  \x1b[2m(resets ${nextResetDate()})\x1b[0m\n`
        );
    }
}
