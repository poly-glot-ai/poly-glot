/**
 * CLI usage tracking — Poly-Glot
 * ─────────────────────────────────
 * Server storage: Cloudflare KV  usage:{email}:{YYYY-MM}  (authoritative)
 * Local storage:  ~/.config/polyglot/usage.json           (fast fallback)
 *
 *  - Free plan: 50 files per calendar month (UTC).
 *  - Pro/Team/Enterprise: unlimited (limit === null from server).
 *  - Server is authoritative — local is a fast fallback for offline use.
 *  - CI bypass: login gate is skipped in CI but usage is still tracked
 *    server-side when a sessionToken is present.
 */

import * as fs   from 'fs';
import * as path from 'path';
import * as os   from 'os';
import { loadConfig } from './config';

export const FREE_MONTHLY_LIMIT = 50;

const AUTH_API   = 'https://poly-glot.ai/api';
const USAGE_DIR  = path.join(os.homedir(), '.config', 'polyglot');
const USAGE_FILE = path.join(USAGE_DIR, 'usage.json');

// UTM-tagged links so CLI conversions are attributed correctly in Stripe
const UPGRADE_PRO_URL  = 'https://buy.stripe.com/fZu14pbtacrO9Ii77K14405?prefilled_promo_code=EARLYBIRD3&client_reference_id=cli';
const UPGRADE_TEAM_URL = 'https://buy.stripe.com/aFa28teFm8by5s2eAc14409?prefilled_promo_code=EARLYBIRD3&client_reference_id=cli-team';

// ─── Types ────────────────────────────────────────────────────────────────────

type UsageStore = Record<string, number>; // { "2026-04": 12 }

interface ServerUsageResponse {
    ok?:       boolean;
    used:      number;
    limit:     number | null;  // null = unlimited (Pro/Team)
    remaining: number | null;
    plan?:     string;
    error?:    string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function monthKey(): string {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

function currentMonthLabel(): string {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function nextResetDate(): string {
    const now  = new Date();
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

// ─── Local store ─────────────────────────────────────────────────────────────

function readStore(): UsageStore {
    try {
        if (!fs.existsSync(USAGE_FILE)) return {};
        const raw    = fs.readFileSync(USAGE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) return parsed as UsageStore;
    } catch { /* corrupt — start fresh */ }
    return {};
}

function writeStore(store: UsageStore): void {
    try {
        fs.mkdirSync(USAGE_DIR, { recursive: true });
        fs.writeFileSync(USAGE_FILE, JSON.stringify(store, null, 2), 'utf8');
        fs.chmodSync(USAGE_FILE, 0o600);
    } catch { /* non-fatal */ }
}

export function getMonthlyUsage(): number {
    const store = readStore();
    return store[monthKey()] ?? 0;
}

export function hasRemainingQuota(): boolean {
    return getMonthlyUsage() < FREE_MONTHLY_LIMIT;
}

// ─── Server-side quota ───────────────────────────────────────────────────────

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
    return Promise.race([
        promise,
        new Promise<null>(res => setTimeout(() => res(null), ms))
    ]);
}

async function getServerUsage(): Promise<ServerUsageResponse | null> {
    try {
        const cfg = loadConfig();
        if (!cfg.sessionToken) return null;
        const res = await withTimeout(
            fetch(`${AUTH_API}/auth/get-usage?token=${encodeURIComponent(cfg.sessionToken)}`, {
                method:  'GET',
                headers: { 'Content-Type': 'application/json' },
            }),
            4000
        );
        if (!res || !res.ok) return null;
        return await (res as Response).json() as ServerUsageResponse;
    } catch { return null; }
}

async function incrementServerUsage(count = 1): Promise<ServerUsageResponse | null> {
    try {
        const cfg = loadConfig();
        if (!cfg.sessionToken) return null;
        const res = await fetch(`${AUTH_API}/auth/track-usage`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ token: cfg.sessionToken, count }),
        });
        if (res.status === 403 || res.status === 429) {
            try {
                const data = await res.json() as ServerUsageResponse;
                syncLocalToServer(data.used);
                return data;
            } catch { return null; }
        }
        if (!res.ok) return null;
        const data = await res.json() as ServerUsageResponse;
        syncLocalToServer(data.used);
        return data;
    } catch { return null; }
}

function syncLocalToServer(serverCount: number): void {
    try {
        const store = readStore();
        store[monthKey()] = serverCount;
        writeStore(store);
    } catch { /* non-fatal */ }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Increment the usage counter.
 * Always updates local immediately; syncs to server when a session exists.
 * NOTE: In CI environments with POLYGLOT_LICENSE_TOKEN, we still track
 * server-side if a sessionToken is present — the login gate bypass does
 * NOT bypass usage tracking.
 */
export async function incrementUsage(count = 1): Promise<void> {
    // Update local immediately for responsiveness
    const store = readStore();
    const key   = monthKey();
    store[key]  = (store[key] ?? 0) + count;
    writeStore(store);

    // Sync server — await so we can surface post-generation warnings
    try {
        const result = await incrementServerUsage(count);
        if (!result) {
            // Server unreachable — show local-based warning only
            const localUsed      = store[key] ?? 0;
            const localRemaining = Math.max(0, FREE_MONTHLY_LIMIT - localUsed);
            if (localRemaining <= 10 && localRemaining > 0) {
                printSoftWarning(localRemaining);
            }
            return;
        }

        // Server authoritative — sync local to match
        syncLocalToServer(result.used);

        if (result.limit === null) return; // Pro/Team — unlimited, no warnings

        const remaining = Math.max(0, (result.limit ?? FREE_MONTHLY_LIMIT) - result.used);

        if (!result.ok && remaining <= 0) {
            printHardStop(result.used, result.limit ?? FREE_MONTHLY_LIMIT);
            process.exit(1);
        }
        if (remaining <= 0) {
            printHardStop(result.used, result.limit ?? FREE_MONTHLY_LIMIT);
            process.exit(1);
        } else if (remaining <= 5) {
            printSoftWarning(remaining, true);
        } else if (remaining <= 10) {
            printSoftWarning(remaining, false);
        }
    } catch {
        // Non-fatal — local already updated
    }
}

/**
 * Assert that the user still has quota remaining before processing files.
 * Server-first (authoritative), falls back to local if offline or no session.
 */
export async function assertQuota(filesNeeded = 1): Promise<void> {
    const cfg = loadConfig();

    // ── No session token = hard block, no fallback ───────────────────────────
    if (!cfg.sessionToken) {
        console.error(
            `\n  \x1b[31m✗  Account required\x1b[0m\n\n` +
            `  A free account is required to use Poly-Glot CLI.\n\n` +
            `  \x1b[36mpoly-glot login\x1b[0m\n\n` +
            `  Free accounts: ${getFreeMonthlyLimit()} files/month\n` +
            `  Pro ($9/mo):   unlimited · https://poly-glot.ai\n`
        );
        process.exit(1);
    }

    const server = await getServerUsage();

    if (server) {
        if (server.limit === null) return; // Pro/Team — unlimited

        const used      = server.used;
        const limit     = server.limit;
        const remaining = Math.max(0, limit - used);

        if (remaining <= 0) {
            printHardStop(used, limit);
            process.exit(1);
        }
        if (filesNeeded > remaining) {
            printBatchExceeds(filesNeeded, remaining, used, limit);
            process.exit(1);
        }
        if (remaining <= 5)       { printSoftWarning(remaining, true);  }
        else if (remaining <= 10) { printSoftWarning(remaining, false); }
        return;
    }

    // ── Server unreachable — hard block, no local fallback ───────────────────
    // We do NOT fall back to local usage.json — that is circumventable.
    // If our server is down, we fail closed to prevent quota abuse.
    console.error(
        `\n  \x1b[31m✗  Could not verify quota\x1b[0m\n\n` +
        `  Unable to reach poly-glot.ai to verify your usage quota.\n` +
        `  Please check your internet connection and try again.\n\n` +
        `  \x1b[2mIf this persists, contact support@poly-glot.ai\x1b[0m\n`
    );
    process.exit(1);
}

function getFreeMonthlyLimit(): number {
    const MAY1 = new Date('2025-05-01T00:00:00Z').getTime();
    return Date.now() >= MAY1 ? 10 : 50;
}

// ─── Upgrade messages ────────────────────────────────────────────────────────

function printHardStop(used: number, limit: number): void {
    console.error(
        `\n  \x1b[31m✗  Free plan limit reached — ${limit} files this month\x1b[0m\n` +
        `\n  \x1b[2mYou've used \x1b[0m\x1b[1m${used}/${limit}\x1b[0m\x1b[2m files on the Free plan for ${currentMonthLabel()}.\x1b[0m` +
        `\n  \x1b[2mResets \x1b[0m\x1b[36m${nextResetDate()}\x1b[0m\x1b[2m · Upgrade for unlimited files.\x1b[0m\n` +
        `\n  \x1b[33m🏷  Use code \x1b[1mEARLYBIRD3\x1b[0m\x1b[33m for 50% off your first 3 months\x1b[0m\n` +
        `\n  \x1b[1m  Pro $9/mo   → \x1b[36m${UPGRADE_PRO_URL}\x1b[0m` +
        `\n  \x1b[1m  Team $29/mo → \x1b[36m${UPGRADE_TEAM_URL}\x1b[0m\n` +
        `\n  \x1b[2mAlready subscribed? Run: \x1b[0m\x1b[36mpoly-glot login\x1b[0m\n`
    );
}

function printBatchExceeds(filesNeeded: number, remaining: number, used: number, limit: number): void {
    console.error(
        `\n  \x1b[31m✗  Not enough quota for this batch\x1b[0m\n` +
        `\n  \x1b[2mThis batch needs \x1b[0m\x1b[1m${filesNeeded} files\x1b[0m\x1b[2m but you only have \x1b[0m\x1b[1m${remaining} remaining\x1b[0m\x1b[2m this month.\x1b[0m` +
        `\n  \x1b[2mUsed: \x1b[0m\x1b[1m${used}/${limit}\x1b[0m\x1b[2m · Resets \x1b[0m\x1b[36m${nextResetDate()}\x1b[0m\n` +
        `\n  \x1b[33m🏷  Use code \x1b[1mEARLYBIRD3\x1b[0m\x1b[33m for 50% off your first 3 months\x1b[0m\n` +
        `\n  \x1b[1m  Pro $9/mo   → \x1b[36m${UPGRADE_PRO_URL}\x1b[0m` +
        `\n  \x1b[1m  Team $29/mo → \x1b[36m${UPGRADE_TEAM_URL}\x1b[0m\n` +
        `\n  \x1b[2mAlready subscribed? Run: \x1b[0m\x1b[36mpoly-glot login\x1b[0m\n`
    );
}

function printSoftWarning(remaining: number, urgent = false): void {
    const color = urgent ? '\x1b[31m' : '\x1b[33m';
    const icon  = urgent ? '🚨' : '⚠️ ';
    console.warn(
        `\n  ${color}${icon}  Free plan: \x1b[1m${remaining} file${remaining === 1 ? '' : 's'} remaining\x1b[0m${color} this month\x1b[0m` +
        `  \x1b[2m(resets ${nextResetDate()})\x1b[0m\n` +
        `\n  \x1b[33m🏷  Use code \x1b[1mEARLYBIRD3\x1b[0m\x1b[33m for 50% off your first 3 months\x1b[0m\n` +
        `\n  \x1b[1m  Pro $9/mo   → \x1b[36m${UPGRADE_PRO_URL}\x1b[0m` +
        `\n  \x1b[1m  Team $29/mo → \x1b[36m${UPGRADE_TEAM_URL}\x1b[0m\n`
    );
}
