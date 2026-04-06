"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ai_generator_1 = require("./ai-generator");
const sidebar_1 = require("./sidebar");
// ─── Constants ────────────────────────────────────────────────────────────────
const AUTH_API = 'https://poly-glot.ai/api/auth';
/**
 * Base headers sent with every request to the Poly-Glot auth worker.
 * X-Extension-Version lets the worker enforce a minimum version floor —
 * any version below MIN_EXTENSION_VERSION is rejected with HTTP 426.
 */
function authHeaders(extra = {}) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ver = require('../package.json').version ?? '0.0.0';
    return { 'Content-Type': 'application/json', 'X-Extension-Version': ver, ...extra };
}
const FREE_LANGUAGES = ['javascript', 'typescript', 'python', 'java'];
const PRO_PLANS = ['pro', 'team', 'enterprise'];
// EARLYBIRD3 locks Pro at $9/mo forever — applies to Pro Monthly only (expires May 1, 2026)
const UPGRADE_URL = 'https://buy.stripe.com/fZu14pbtacrO9Ii77K14405?prefilled_promo_code=EARLYBIRD3&client_reference_id=vscode';
const UPGRADE_TEAM_URL = 'https://buy.stripe.com/bJebJ30Ow1Na6w6ajW14408?client_reference_id=vscode-team';
const FREE_SIGNUP_URL = 'https://poly-glot.ai/api/auth/free-signup';
const PARTICIPANT_ID = 'poly-glot.chat';
const FREE_LIMIT = 50;
const FIRST_NUDGE_AT = 10;
// Minimum extension version — older installs are blocked from generating.
// Bump this any time a security-critical auth change ships.
// 1.4.49 — hard sign-up gate: anonymous device fallback removed, account required before first use.
const MINIMUM_VERSION = '1.4.53';
const MAY1_2025 = new Date('2025-05-01T00:00:00Z').getTime();
function getCurrentFreeLimit() { return Date.now() >= MAY1_2025 ? 10 : 50; }
// ─── Module-level state ───────────────────────────────────────────────────────
let statusBarItem;
let aiGenerator;
let extContext;
// ─── Version gate ─────────────────────────────────────────────────────────────
function semverLt(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        if ((pa[i] || 0) < (pb[i] || 0))
            return true;
        if ((pa[i] || 0) > (pb[i] || 0))
            return false;
    }
    return false;
}
async function checkVersionGate(context) {
    const currentVersion = context.extension.packageJSON.version;
    if (!semverLt(currentVersion, MINIMUM_VERSION))
        return true; // version is fine
    const choice = await vscode.window.showErrorMessage(`🚫 Poly-Glot v${currentVersion} is no longer supported. Please update to v${MINIMUM_VERSION}+ to continue.`, 'Update Now', 'Dismiss');
    if (choice === 'Update Now') {
        await vscode.commands.executeCommand('workbench.extensions.action.showExtensionsWithIds', ['poly-glot-ai.poly-glot']);
    }
    return false;
}
// ─── Usage Tracking ───────────────────────────────────────────────────────────
/** Returns the storage key for the current month e.g. "polyglot.usage.2026-04" */
function monthKey() {
    const d = new Date();
    return `polyglot.usage.${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
/** Gets how many files have been processed this month (local cache) */
function getMonthlyCount() {
    return extContext.globalState.get(monthKey(), 0);
}
/** Increments the local monthly counter and returns the new value */
async function incrementMonthlyCount() {
    const key = monthKey();
    const count = extContext.globalState.get(key, 0) + 1;
    await extContext.globalState.update(key, count);
    return count;
}
/** Sync local counter DOWN to a server-authoritative value */
async function syncLocalCount(serverCount) {
    await extContext.globalState.update(monthKey(), serverCount);
}
/** Updates the status bar to show usage e.g. "$(comment) Poly-Glot (12/50)" */
function updateStatusBarUsage(isPro) {
    if (isPro) {
        statusBarItem.text = '$(comment) Poly-Glot ✨ Pro';
        statusBarItem.backgroundColor = undefined;
        statusBarItem.tooltip = 'Poly-Glot Pro — unlimited files';
    }
    else {
        const count = getMonthlyCount();
        const remain = Math.max(0, FREE_LIMIT - count);
        statusBarItem.text = `$(comment) Poly-Glot (${count}/${FREE_LIMIT})`;
        statusBarItem.tooltip = `${remain} free file${remain === 1 ? '' : 's'} remaining this month — upgrade for unlimited`;
        statusBarItem.backgroundColor = count >= FREE_LIMIT
            ? new vscode.ThemeColor('statusBarItem.errorBackground')
            : count >= FREE_LIMIT * 0.8
                ? new vscode.ThemeColor('statusBarItem.warningBackground')
                : undefined;
    }
}
/**
 * Server-aware usage increment.
 * Requires a valid session token — no anonymous fallback.
 * Users without an account are directed to sign up before any generation.
 * Returns false if the limit is exceeded or user is not signed in.
 */
/**
 * Flush any usage counts that were queued offline (Pro users only).
 * Called at the top of checkAndIncrementUsage() whenever we have a token,
 * so offline usage is always reconciled on next successful connection.
 * Fire-and-forget — never blocks generation.
 */
async function flushOfflineUsageQueue(token) {
    const queued = extContext.globalState.get('pg.offlineUsageQueue', 0);
    if (queued <= 0)
        return;
    try {
        const res = await fetch(`${AUTH_API}/track-usage`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ token, count: queued }),
            signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
            // Successfully flushed — clear the queue
            await extContext.globalState.update('pg.offlineUsageQueue', 0);
            const data = await res.json();
            if (typeof data.used === 'number')
                await syncLocalCount(data.used);
        }
        // If flush fails, leave queue intact — retry next invocation
    }
    catch {
        // Still offline — leave queue intact
    }
}
async function checkAndIncrementUsage() {
    const sessionToken = extContext.globalState.get('pg.sessionToken', '');
    const licenseToken = vscode.workspace.getConfiguration('polyglot').get('licenseToken', '').trim();
    const token = sessionToken || licenseToken;
    // ── No token: hard sign-up gate — no anonymous fallback ──────────────
    if (!token) {
        await requireSignUp('generate');
        return false;
    }
    // ── Flush any offline-queued usage before checking plan ──────────────
    // This ensures Pro users who generated offline have accurate server counts
    // before we check quota — prevents undercounting from offline sessions.
    await flushOfflineUsageQueue(token);
    if (await hasPro()) {
        updateStatusBarUsage(true);
        return true;
    }
    // ── Server-side tracking (authoritative) ─────────────────────────────
    try {
        const res = await fetch(`${AUTH_API}/track-usage`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ token, count: 1 }),
            signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        // Sync local to server count
        if (typeof data.used === 'number') {
            await syncLocalCount(data.used);
        }
        // Limit reached (429 from server)
        if (!data.ok && data.remaining !== null && data.remaining <= 0) {
            updateStatusBarUsage(false);
            await showLimitReached(data.used, data.limit ?? FREE_LIMIT);
            return false;
        }
        updateStatusBarUsage(false);
        // Nudge messages
        const used = data.used ?? getMonthlyCount();
        const remaining = data.remaining ?? Math.max(0, FREE_LIMIT - used);
        await showUsageNudge(used, remaining);
        return true;
    }
    catch {
        // Server unreachable — hard block for free/unknown users.
        // Pro users with a verified cached plan are allowed through,
        // but usage is queued locally and flushed on next successful connection.
        const lastKnownPlan = extContext?.globalState.get('pg.lastKnownPlan', '');
        if (lastKnownPlan && PRO_PLANS.includes(lastKnownPlan)) {
            // Pro user offline — allow through but queue the usage for later reconciliation
            const queued = extContext.globalState.get('pg.offlineUsageQueue', 0);
            await extContext.globalState.update('pg.offlineUsageQueue', queued + 1);
            updateStatusBarUsage(true);
            vscode.window.showWarningMessage('⚠️ Poly-Glot: Server unreachable — generating offline. Usage will sync when reconnected.');
            return true;
        }
        // Free/unknown user offline — fail closed, no generation without server verification
        const choice = await vscode.window.showErrorMessage(`🚫 Poly-Glot cannot reach the server to verify your account. Please check your internet connection.`, 'Retry', 'Open poly-glot.ai');
        if (choice === 'Retry') {
            _cachedPlan = undefined;
            return checkAndIncrementUsage();
        }
        if (choice === 'Open poly-glot.ai') {
            vscode.env.openExternal(vscode.Uri.parse('https://poly-glot.ai'));
        }
        return false;
    }
}
/**
 * Hard sign-up gate — shown whenever a user without a session token tries to
 * run any generation command. Offers inline email-entry (sends magic link) or
 * opens poly-glot.ai. No bypass: returns without generating.
 * Re-fires every time until the user signs up (no "Later forever" escape hatch).
 */
async function requireSignUp(source) {
    const SIGNUP_URL = `https://poly-glot.ai/?source=vscode-${source}&utm_source=vscode&utm_medium=extension&utm_campaign=gate`;
    // Inline email-first flow — keep user in VS Code
    const email = await vscode.window.showInputBox({
        title: '🦜 Poly-Glot — Free account required',
        prompt: 'Enter your email to create a free account — we\'ll send a magic link (no password needed)',
        placeHolder: 'you@example.com',
        ignoreFocusOut: true,
        validateInput: (v) => (!v || !v.includes('@') || !v.includes('.')) ? 'Enter a valid email address' : null,
    });
    if (email) {
        try {
            const res = await fetch(`${AUTH_API}/login`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ email: email.trim().toLowerCase(), source: `vscode-${source}` }),
                signal: AbortSignal.timeout(8000),
            });
            if (res.ok) {
                const rsDomain = email.trim().split('@')[1]?.toLowerCase() ?? '';
                const rsEmailUrl = rsDomain.includes('gmail') ? 'https://mail.google.com'
                    : rsDomain.includes('outlook') || rsDomain.includes('hotmail') || rsDomain.includes('live') ? 'https://outlook.live.com'
                        : rsDomain.includes('yahoo') ? 'https://mail.yahoo.com'
                            : rsDomain.includes('icloud') || rsDomain.includes('me.com') || rsDomain.includes('mac.com') ? 'https://www.icloud.com/mail'
                                : rsDomain.includes('proton') ? 'https://mail.proton.me'
                                    : rsDomain.includes('hey') ? 'https://app.hey.com'
                                        : rsDomain.includes('fastmail') ? 'https://app.fastmail.com'
                                            : `https://${rsDomain}`;
                vscode.window.showInformationMessage(`✅ Magic link sent! Click it in your email and VS Code will sign you in automatically — no copy-paste needed.`, 'Open Email', 'Enter Token Manually').then(async (choice) => {
                    if (choice === 'Open Email') {
                        vscode.env.openExternal(vscode.Uri.parse(rsEmailUrl));
                    }
                    else if (choice === 'Enter Token Manually') {
                        await cmdConfigureLicenseToken();
                    }
                });
            }
            else {
                // Already registered — go straight to token entry
                vscode.window.showInformationMessage(`🦜 Poly-Glot: Account found for ${email}. Enter your session token to sign in.`, 'Enter Token').then(async (choice) => {
                    if (choice === 'Enter Token')
                        await cmdConfigureLicenseToken();
                });
            }
        }
        catch {
            vscode.window.showErrorMessage('🚫 Poly-Glot: Could not reach the server. Please check your connection.', 'Try Again', 'Sign Up on Web').then(async (choice) => {
                if (choice === 'Try Again') {
                    await requireSignUp(source);
                }
                else if (choice === 'Sign Up on Web') {
                    vscode.env.openExternal(vscode.Uri.parse(SIGNUP_URL));
                }
            });
        }
    }
    else {
        // User pressed Escape — show persistent non-dismissable prompt
        // (no "Later" option — they must sign up to use the tool)
        vscode.window.showWarningMessage('🦜 Poly-Glot requires a free account. Sign up in 30 seconds — no credit card needed.', 'Sign Up Free', 'I Already Have an Account').then(async (choice) => {
            if (choice === 'Sign Up Free') {
                vscode.env.openExternal(vscode.Uri.parse(SIGNUP_URL));
            }
            else if (choice === 'I Already Have an Account') {
                await cmdConfigureLicenseToken();
            }
            // No "Dismiss" or "Later" — message disappears but next generate click re-triggers
        });
    }
}
/** Show the hard-stop message and upgrade buttons */
async function showLimitReached(used, limit) {
    const choice = await vscode.window.showErrorMessage(`🚫 Free plan limit reached — ${used}/${limit} files this month.`, 'Upgrade for $9/mo', 'Enter Session Token');
    if (choice === 'Upgrade for $9/mo') {
        vscode.env.openExternal(vscode.Uri.parse(UPGRADE_URL));
    }
    else if (choice === 'Enter Session Token') {
        await cmdConfigureLicenseToken();
    }
}
/** Show nudges at the right thresholds */
async function showUsageNudge(used, remaining) {
    // First nudge — at file 10 (early, gentle)
    if (used === FIRST_NUDGE_AT) {
        const choice = await vscode.window.showInformationMessage(`💡 Poly-Glot: ${remaining} free files left this month. Upgrade for unlimited.`, 'See Pro Plans', 'Dismiss');
        if (choice === 'See Pro Plans') {
            vscode.env.openExternal(vscode.Uri.parse(UPGRADE_URL));
        }
    }
    // Midpoint nudge — at file 25 (post-generation, user just saw value)
    else if (used === Math.floor(FREE_LIMIT * 0.5)) {
        const choice = await vscode.window.showInformationMessage(`✅ Done — ${used} files used, ${remaining} remaining this month. Upgrade for unlimited.`, 'Upgrade for $9/mo', 'Dismiss');
        if (choice === 'Upgrade for $9/mo') {
            vscode.env.openExternal(vscode.Uri.parse(UPGRADE_URL));
        }
    }
    // 80% warning
    else if (used === Math.floor(FREE_LIMIT * 0.8)) {
        const choice = await vscode.window.showWarningMessage(`⚡ ${remaining} free files remaining this month — use code EARLYBIRD3 to lock Pro at $9/mo forever (expires May 1, 2026).`, 'Upgrade Now', 'Dismiss');
        if (choice === 'Upgrade Now') {
            vscode.env.openExternal(vscode.Uri.parse(UPGRADE_URL));
        }
    }
    // Last file warning
    else if (used === FREE_LIMIT) {
        const choice = await vscode.window.showWarningMessage(`🔴 That was your last free file this month. Upgrade to keep going.`, 'Upgrade for $9/mo', 'Enter Session Token');
        if (choice === 'Upgrade for $9/mo') {
            vscode.env.openExternal(vscode.Uri.parse(UPGRADE_URL));
        }
        else if (choice === 'Enter Session Token') {
            await cmdConfigureLicenseToken();
        }
    }
}
// ─── Plan / License helpers ───────────────────────────────────────────────────
/** Per-session plan cache — verified once, reused for VS Code session lifetime. */
let _cachedPlan = undefined;
/**
 * Verify the stored session/license token against /api/auth/check-plan.
 * Uses the new dedicated endpoint that:
 *   - Never destroys the token (unlike /verify)
 *   - Always reads the live plan from KV (catches post-payment upgrades)
 *   - Returns { valid: bool, plan: string, email: string }
 */
async function getVerifiedPlan() {
    if (_cachedPlan !== undefined)
        return _cachedPlan;
    // Prefer session token (from login flow), fall back to licenseToken setting
    const sessionToken = extContext.globalState.get('pg.sessionToken', '');
    const licenseToken = vscode.workspace.getConfiguration('polyglot').get('licenseToken', '').trim();
    const token = sessionToken || licenseToken;
    if (!token) {
        _cachedPlan = null;
        return null;
    }
    try {
        const res = await fetch(`${AUTH_API}/check-plan`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ token }),
            signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) {
            _cachedPlan = null;
            return null;
        }
        const data = await res.json();
        if (data.valid && data.plan) {
            _cachedPlan = data.plan;
            // Persist plan + email so Pro users can work offline
            await extContext.globalState.update('pg.lastKnownPlan', data.plan);
            if (data.email) {
                await extContext.globalState.update('pg.sessionEmail', data.email);
                await extContext.globalState.update('pg.lastKnownEmail', data.email);
            }
        }
        else {
            _cachedPlan = null;
            // Clear cached plan so a downgraded user can't stay Pro offline
            await extContext.globalState.update('pg.lastKnownPlan', '');
        }
    }
    catch {
        // Network error — return cached plan only for Pro users (they paid).
        // checkAndIncrementUsage() handles the offline queue tracking separately.
        // Free/unknown users: return null so checkAndIncrementUsage() fails closed.
        const lastKnownPlan = extContext?.globalState.get('pg.lastKnownPlan', '');
        if (lastKnownPlan && PRO_PLANS.includes(lastKnownPlan)) {
            _cachedPlan = lastKnownPlan; // Pro user offline — hasPro() returns true,
            // checkAndIncrementUsage() queues usage for flush
        }
        else {
            _cachedPlan = null; // Free/unknown offline — checkAndIncrementUsage() blocks
        }
    }
    return _cachedPlan;
}
async function hasPro() {
    const plan = await getVerifiedPlan();
    return plan !== null && PRO_PLANS.includes(plan);
}
async function isLanguageAllowed(languageId) {
    if (FREE_LANGUAGES.includes(languageId))
        return true;
    return hasPro();
}
async function showProGate(feature) {
    const hasToken = !!(extContext.globalState.get('pg.sessionToken', '') ||
        vscode.workspace.getConfiguration('polyglot').get('licenseToken', '').trim());
    const message = `Poly-Glot: ${feature} requires a Pro plan.`;
    const actions = hasToken
        ? ['Already subscribed? Re-enter token', 'Get Pro']
        : ['Get Pro — $9/mo Forever', 'Enter Session Token'];
    const choice = await vscode.window.showErrorMessage(message, ...actions);
    if (choice === 'Get Pro' || choice === 'Get Pro — $9/mo Forever') {
        vscode.env.openExternal(vscode.Uri.parse(UPGRADE_URL));
        return true;
    }
    if (choice === 'Enter Session Token' || choice === 'Already subscribed? Re-enter token') {
        await cmdConfigureLicenseToken();
        return true;
    }
    return false;
}
// ─── Version check ───────────────────────────────────────────────────────────
async function checkForNewerVersion(context) {
    try {
        const currentVersion = context.extension.packageJSON.version;
        const lastChecked = extContext.globalState.get('pg.versionCheckedAt', 0);
        const now = Date.now();
        // Only check once every 24 hours
        if (now - lastChecked < 24 * 60 * 60 * 1000)
            return;
        await extContext.globalState.update('pg.versionCheckedAt', now);
        // Fetch latest version from VS Code Marketplace via our proxy
        const res = await fetch(`${AUTH_API}/vsc-proxy`, {
            method: 'POST',
            headers: authHeaders({ 'User-Agent': 'poly-glot-extension/1.0' }),
            body: JSON.stringify({
                filters: [{ criteria: [{ filterType: 7, value: 'poly-glot-ai.poly-glot' }] }],
                flags: 914,
            }),
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok)
            return;
        const data = await res.json();
        const latestVersion = data?.results?.[0]?.extensions?.[0]?.versions?.[0]?.version || '';
        if (!latestVersion || latestVersion === currentVersion)
            return;
        // Compare versions — if current < latest, show update prompt
        const [cMaj, cMin, cPatch] = currentVersion.split('.').map(Number);
        const [lMaj, lMin, lPatch] = latestVersion.split('.').map(Number);
        const isOutdated = lMaj > cMaj ||
            (lMaj === cMaj && lMin > cMin) ||
            (lMaj === cMaj && lMin === cMin && lPatch > cPatch);
        if (!isOutdated)
            return;
        // Show non-blocking notification
        const choice = await vscode.window.showWarningMessage(`🦜 Poly-Glot v${latestVersion} is available (you have v${currentVersion}). Update now to get the latest features and security fixes.`, 'Update Now', 'Later');
        if (choice === 'Update Now') {
            // Open the Extensions view filtered to poly-glot
            await vscode.commands.executeCommand('workbench.extensions.action.showExtensionsWithIds', ['poly-glot-ai.poly-glot']);
        }
    }
    catch {
        // Non-fatal — version check is best-effort
    }
}
// ─── First-run onboarding ─────────────────────────────────────────────────────
/**
 * Called on every activation for unsigned users.
 * 1.4.49: version bumped to re-fire for ALL legacy users who dismissed before.
 * No "Later" escape — every user must sign up before the tool works.
 * Signed-in users skip this immediately.
 */
async function maybeShowFirstRunOnboarding() {
    const hasSession = !!extContext.globalState.get('pg.sessionToken', '');
    const hasLicenseToken = !!vscode.workspace.getConfiguration('polyglot').get('licenseToken', '').trim();
    // Already signed in — nothing to do
    if (hasSession || hasLicenseToken)
        return;
    // Bump version string to re-engage ALL legacy dismissed users
    const ONBOARDING_VERSION = '1.4.53';
    const shownForVersion = extContext.globalState.get('pg.onboardingShownVersion', '');
    if (shownForVersion >= ONBOARDING_VERSION)
        return;
    // Mark as shown for this version before the prompt (prevents duplicate prompts on rapid reload)
    await extContext.globalState.update('pg.onboardingShownVersion', ONBOARDING_VERSION);
    await extContext.globalState.update('pg.onboardingShown', true);
    // Short delay so VS Code UI finishes loading before we interrupt
    await new Promise(r => setTimeout(r, 1500));
    const SIGNUP_URL = 'https://poly-glot.ai/?source=vscode-install&utm_source=vscode&utm_medium=extension&utm_campaign=onboarding';
    // ── Step 1: ask for email inline ──────────────────────────────────────
    const email = await vscode.window.showInputBox({
        title: '🦜 Poly-Glot — Free account required to generate',
        prompt: '50 files/month free · no credit card · magic link (no password)',
        placeHolder: 'you@example.com',
        ignoreFocusOut: true,
        validateInput: (v) => (!v || !v.includes('@') || !v.includes('.')) ? 'Please enter a valid email address' : null,
    });
    if (!email) {
        // Dismissed the input box — show a persistent notification with no "Later"
        vscode.window.showWarningMessage('🦜 Poly-Glot requires a free account to generate comments. Sign up in 30 seconds.', 'Sign Up Free', 'I Already Have an Account').then(async (choice) => {
            if (choice === 'Sign Up Free') {
                await vscode.env.openExternal(vscode.Uri.parse(SIGNUP_URL));
            }
            else if (choice === 'I Already Have an Account') {
                await cmdConfigureLicenseToken();
            }
            // No dismiss / Later — next command run re-triggers requireSignUp()
        });
        return;
    }
    // ── Step 2: send magic link ───────────────────────────────────────────
    try {
        const res = await fetch(`${AUTH_API}/login`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ email: email.trim().toLowerCase(), source: 'vscode-install' }),
            signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
            // Magic link sent — clicking it will fire the vscode:// deep link
            // which auto-saves the token. No copy-paste needed.
            vscode.window.showInformationMessage(`✅ Check your inbox for ${email} — click the magic link and VS Code will sign you in automatically.`, 'Open Email', 'Enter Token Manually').then(async (choice) => {
                if (choice === 'Open Email') {
                    // Try to detect email provider from domain
                    const domain = email.split('@')[1]?.toLowerCase() ?? '';
                    const emailUrl = domain.includes('gmail') ? 'https://mail.google.com'
                        : domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live') ? 'https://outlook.live.com'
                            : domain.includes('yahoo') ? 'https://mail.yahoo.com'
                                : domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com') ? 'https://www.icloud.com/mail'
                                    : domain.includes('proton') ? 'https://mail.proton.me'
                                        : domain.includes('hey') ? 'https://app.hey.com'
                                            : domain.includes('fastmail') ? 'https://app.fastmail.com'
                                                : `https://${domain}`;
                    await vscode.env.openExternal(vscode.Uri.parse(emailUrl));
                }
                else if (choice === 'Enter Token Manually') {
                    await cmdConfigureLicenseToken();
                    const hasKey = await aiGenerator.isConfigured();
                    if (!hasKey) {
                        const apiChoice = await vscode.window.showInformationMessage('🔑 Almost there! Add your AI API key to start generating.', 'Configure API Key', 'Later');
                        if (apiChoice === 'Configure API Key')
                            await cmdConfigureApiKey();
                    }
                }
                // If dismissed: vscode:// deep link will still fire when they click email
            });
        }
        else {
            // Rate-limited or already registered — go straight to token entry
            const tokenChoice2 = await vscode.window.showInformationMessage(`🦜 Account found for ${email}. Enter your session token to sign in.`, 'Enter Token');
            if (tokenChoice2 === 'Enter Token') {
                await cmdConfigureLicenseToken();
                const hasKey = await aiGenerator.isConfigured();
                if (!hasKey) {
                    const apiChoice = await vscode.window.showInformationMessage('🔑 Almost there! Set up your AI API key to start generating.', 'Configure API Key', 'Later');
                    if (apiChoice === 'Configure API Key')
                        await cmdConfigureApiKey();
                }
            }
        }
    }
    catch {
        // Network error
        vscode.window.showErrorMessage('🚫 Poly-Glot: Could not reach the server. Please check your connection, then try generating to sign up.', 'Sign Up on Web').then(async (choice) => {
            if (choice === 'Sign Up on Web') {
                await vscode.env.openExternal(vscode.Uri.parse(SIGNUP_URL));
            }
        });
    }
}
// ─── URI Handler (vscode://poly-glot-ai.poly-glot/auth?token=...) ────────────
/**
 * Handles the deep-link callback from the magic-link flow.
 * When a user clicks their magic link on poly-glot.ai, the page fires:
 *   vscode://poly-glot-ai.poly-glot/auth?token=<session_token>&email=<email>&plan=<plan>
 * VS Code intercepts it and calls this handler — zero copy-paste required.
 */
class PolyGlotUriHandler {
    async handleUri(uri) {
        if (uri.path !== '/auth')
            return;
        const params = new URLSearchParams(uri.query);
        const token = params.get('token')?.trim();
        const email = params.get('email') ?? '';
        const plan = params.get('plan') ?? 'free';
        if (!token) {
            vscode.window.showErrorMessage('Poly-Glot: Invalid sign-in link — no token found. Please try again.');
            return;
        }
        // Save token — same as cmdConfigureLicenseToken does
        await extContext.globalState.update('pg.sessionToken', token);
        await vscode.workspace.getConfiguration('polyglot').update('licenseToken', token, vscode.ConfigurationTarget.Global);
        if (email) {
            await extContext.globalState.update('pg.sessionEmail', email);
            await extContext.globalState.update('pg.lastKnownEmail', email);
        }
        await extContext.globalState.update('pg.lastKnownPlan', plan);
        // Reset plan cache so next command re-verifies from server
        _cachedPlan = undefined;
        // Confirm to user
        const isPaid = PRO_PLANS.includes(plan);
        vscode.window.showInformationMessage(isPaid
            ? `🎉 Poly-Glot ${plan.charAt(0).toUpperCase() + plan.slice(1)} activated! All features unlocked.`
            : `✅ Poly-Glot: Signed in as ${email || 'free user'}. You have 50 files/month free.`, ...(isPaid ? [] : ['Upgrade to Pro'])).then(async (choice) => {
            if (choice === 'Upgrade to Pro') {
                vscode.env.openExternal(vscode.Uri.parse(UPGRADE_URL));
            }
        });
        // Immediately check API key — if missing, offer to set it up now
        const hasKey = await aiGenerator.isConfigured();
        if (!hasKey) {
            const apiChoice = await vscode.window.showInformationMessage('🔑 Almost there! Add your AI API key to start generating comments.', 'Configure API Key', 'Later');
            if (apiChoice === 'Configure API Key') {
                await cmdConfigureApiKey();
            }
        }
        else {
            // Already have API key — they can generate immediately
            vscode.window.showInformationMessage('🚀 Ready! Run Poly-Glot: Generate Comments on any file to get started.', 'Generate Now').then(async (choice) => {
                if (choice === 'Generate Now') {
                    vscode.commands.executeCommand('polyglot.generateComments');
                }
            });
        }
        // Track sign-in event
        try {
            await fetch(`${AUTH_API}/track-usage`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ token, count: 0 }), // count:0 = ping only, no usage increment
                signal: AbortSignal.timeout(4000),
            });
        }
        catch { /* non-critical */ }
    }
}
// ─── Activate ────────────────────────────────────────────────────────────────
function activate(context) {
    extContext = context;
    aiGenerator = new ai_generator_1.AIGenerator(context);
    // ── Version gate — MUST run before any command is registered ─────────────
    // If the installed version is below MINIMUM_VERSION, we register stub
    // handlers for all commands that immediately show the upgrade prompt and
    // return — no generation is possible until the user updates.
    const currentVersion = context.extension.packageJSON.version;
    const isVersionBlocked = semverLt(currentVersion, MINIMUM_VERSION);
    if (isVersionBlocked) {
        // Show the blocking prompt once on activation (non-blocking async)
        checkVersionGate(context).catch(() => { });
        // Register every command as a hard stub — clicking anything shows upgrade
        const blockedHandler = async () => { await checkVersionGate(context); };
        const blockedCmds = [
            'polyglot.generateComments', 'polyglot.whyComments', 'polyglot.bothComments',
            'polyglot.commentFile', 'polyglot.commentFileFromExplorer',
            'polyglot.whyFileFromExplorer', 'polyglot.explainCode',
            'polyglot.configureApiKey', 'polyglot.configureLicenseToken',
            'polyglot.startForFree', 'polyglot.openTemplates',
        ];
        for (const cmd of blockedCmds) {
            context.subscriptions.push(vscode.commands.registerCommand(cmd, blockedHandler));
        }
        // Degraded status bar — visually signals the block
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.command = 'polyglot.generateComments';
        statusBarItem.text = '$(warning) Poly-Glot (update required)';
        statusBarItem.tooltip = `Poly-Glot v${currentVersion} is no longer supported. Please update to v${MINIMUM_VERSION}+.`;
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        statusBarItem.show();
        context.subscriptions.push(statusBarItem);
        return; // ← EXIT EARLY — nothing else activates on blocked versions
    }
    // ── URI handler — receives vscode://poly-glot-ai.poly-glot/auth?token=... ─
    // This is the deep-link callback from the magic-link flow.
    // User clicks magic link → poly-glot.ai fires vscode:// URI → VS Code calls this → token saved automatically.
    context.subscriptions.push(vscode.window.registerUriHandler(new PolyGlotUriHandler()));
    // Status bar
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'polyglot.generateComments';
    statusBarItem.text = '$(comment) Poly-Glot';
    statusBarItem.tooltip = 'Poly-Glot: Generate doc-comments (Cmd+Shift+/)';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    // Show usage count in status bar — resolves plan from server
    hasPro().then(isPro => updateStatusBarUsage(isPro));
    // Sidebar
    const sidebarProvider = new sidebar_1.TemplatesSidebarProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(sidebar_1.TemplatesSidebarProvider.viewType, sidebarProvider));
    // Register all commands
    context.subscriptions.push(vscode.commands.registerCommand('polyglot.generateComments', () => cmdGenerateComments()), vscode.commands.registerCommand('polyglot.whyComments', () => cmdWhyComments()), vscode.commands.registerCommand('polyglot.bothComments', () => cmdBothComments()), vscode.commands.registerCommand('polyglot.commentFile', () => cmdCommentFile()), vscode.commands.registerCommand('polyglot.commentFileFromExplorer', (uri) => cmdCommentFileFromExplorer(uri)), vscode.commands.registerCommand('polyglot.whyFileFromExplorer', (uri) => cmdWhyFileFromExplorer(uri)), vscode.commands.registerCommand('polyglot.explainCode', () => cmdExplainCode()), vscode.commands.registerCommand('polyglot.configureApiKey', () => cmdConfigureApiKey()), vscode.commands.registerCommand('polyglot.configureLicenseToken', () => cmdConfigureLicenseToken()), vscode.commands.registerCommand('polyglot.startForFree', () => cmdStartForFree()), vscode.commands.registerCommand('polyglot.openTemplates', () => vscode.commands.executeCommand('polyglot.templatesView.focus')));
    // ── Copilot Chat Participant ──────────────────────────────────────────
    if (typeof vscode.chat?.createChatParticipant === 'function') {
        const participant = vscode.chat.createChatParticipant(PARTICIPANT_ID, handleChatRequest);
        participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');
        participant.followupProvider = {
            provideFollowups(_result, _context, _token) {
                return [
                    { prompt: '/comment', label: '$(comment) Add doc-comments', command: 'comment' },
                    { prompt: '/why', label: '$(comment-discussion) Add why-comments', command: 'why' },
                    { prompt: '/explain', label: '$(search) Explain this code', command: 'explain' },
                ];
            },
        };
        context.subscriptions.push(participant);
    }
    // First-run onboarding — fires once, non-blocking, captures legacy users
    maybeShowFirstRunOnboarding().catch(() => { });
    // Version check — warn if a newer version is available on the marketplace
    checkForNewerVersion(context).catch(() => { });
}
function deactivate() {
    statusBarItem?.dispose();
}
// ─── Copilot Chat Handler ─────────────────────────────────────────────────────
async function handleChatRequest(request, _chatContext, stream, token) {
    const cmd = request.command;
    const userText = (request.prompt || '').trim().toLowerCase();
    if (cmd === 'upgrade' || userText.includes('price') || userText.includes('pro') || userText.includes('plan')) {
        stream.markdown([
            '## 💎 Poly-Glot Pro',
            '',
            '| Feature | Free | Pro |',
            '|---------|------|-----|',
            '| Doc-comments (`/comment`) | ✅ | ✅ |',
            '| Explain Code (`/explain`) | ✅ | ✅ |',
            '| Languages: JS, TS, Python, Java | ✅ | ✅ |',
            '| Languages: C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin | 🔒 | ✅ |',
            '| Why-comments (`/why`) | 🔒 | ✅ |',
            '| Both mode (`/both`) | 🔒 | ✅ |',
            '| Files per month | 50 | Unlimited |',
            '',
            '**Pro — $9/mo locked forever with code `EARLYBIRD3`** *(expires May 1, 2026 — after that Pro goes to $12/mo)*',
            '',
            `[**→ Upgrade to Pro — $9/mo**](${UPGRADE_URL})`,
            '',
            'After subscribing, sign in at poly-glot.ai, then run **Poly-Glot: Configure License Token** in the Command Palette.',
        ].join('\n'));
        return { metadata: { command: 'upgrade' } };
    }
    const editor = vscode.window.activeTextEditor;
    const selection = editor?.selection;
    const code = editor
        ? (selection && !selection.isEmpty
            ? editor.document.getText(selection)
            : editor.document.getText())
        : '';
    const langId = editor?.document.languageId ?? 'plaintext';
    if (!code && cmd !== 'upgrade') {
        stream.markdown('> **No code found.** Open a file (or select some code) then try again.\n\n_Tip: select a function and type `@poly-glot /comment`_');
        return { metadata: { command: cmd } };
    }
    const cfg = vscode.workspace.getConfiguration('polyglot');
    const apiKey = await aiGenerator.context?.secrets?.get(`polyglot.apiKey.${cfg.get('provider', 'openai')}`);
    const hasKey = !!cfg.get('openaiApiKey') || !!cfg.get('anthropicApiKey') || !!apiKey;
    if (!hasKey) {
        stream.markdown([
            '## 🔑 API Key Required',
            '',
            'Poly-Glot uses your own API key — your code never goes through our servers.',
            '',
            '**Set it up in 10 seconds:**',
            '1. Open Command Palette (`Cmd+Shift+P`)',
            '2. Run **Poly-Glot: Configure API Key**',
            '3. Choose **OpenAI**, **Anthropic**, or **Google** and paste your key',
            '   - OpenAI: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)',
            '   - Anthropic: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)',
            '   - Google: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)',
            '',
            'Then come back and try again!',
        ].join('\n'));
        stream.button({ command: 'polyglot.configureApiKey', title: '$(key) Configure API Key' });
        return { metadata: { command: 'setup' } };
    }
    if (cmd === 'comment' || cmd === 'why' || cmd === 'both' || cmd === 'explain' || !cmd) {
        // ── Hard gate: account required before any generation via Copilot Chat ──
        // checkAndIncrementUsage() calls requireSignUp() if no token, blocks if over quota.
        const allowed = await checkAndIncrementUsage();
        if (!allowed) {
            // requireSignUp() or showLimitReached() already showed the appropriate prompt
            return { metadata: { command: cmd } };
        }
    }
    if ((cmd === 'why' || cmd === 'both') && !await hasPro()) {
        stream.markdown([
            `## 🔒 Pro Plan Required`,
            '',
            `**Why-comments** and **Both mode** require a Pro plan.`,
            '',
            `[**→ Upgrade to Pro — $9/mo**](${UPGRADE_URL})`,
            '',
            '🏷 Use code **`EARLYBIRD3`** to lock Pro at **$9/mo forever** *(expires May 1, 2026)*',
        ].join('\n'));
        return { metadata: { command: cmd } };
    }
    if (cmd === 'comment' || cmd === 'both' || !cmd) {
        stream.progress('Generating doc-comments…');
        try {
            const result = await aiGenerator.generateComments(code, langId);
            if (token.isCancellationRequested) {
                return;
            }
            stream.markdown([
                `## 📝 Doc-Comments — ${langId}`,
                `_Cost: $${result.cost.toFixed(5)}_`,
                '',
                '```' + langId,
                result.commentedCode,
                '```',
            ].join('\n'));
            stream.button({
                command: 'polyglot.generateComments',
                title: '$(comment) Apply to Editor',
                arguments: [],
            });
            if (cmd !== 'both') {
                return { metadata: { command: 'comment' } };
            }
        }
        catch (err) {
            stream.markdown(`> ❌ **Error:** ${err.message}`);
            return { metadata: { command: 'comment' } };
        }
    }
    if (cmd === 'why' || cmd === 'both') {
        stream.progress('Generating why-comments…');
        try {
            const result = await aiGenerator.generateWhyComments(code, langId);
            if (token.isCancellationRequested) {
                return;
            }
            stream.markdown([
                `## 💡 Why-Comments — ${langId}`,
                `_Cost: $${result.cost.toFixed(5)}_`,
                '',
                '```' + langId,
                result.commentedCode,
                '```',
            ].join('\n'));
            stream.button({
                command: 'polyglot.whyComments',
                title: '$(comment-discussion) Apply Why-Comments to Editor',
                arguments: [],
            });
            return { metadata: { command: cmd } };
        }
        catch (err) {
            stream.markdown(`> ❌ **Error:** ${err.message}`);
            return { metadata: { command: cmd } };
        }
    }
    stream.markdown([
        '## 🦜 Poly-Glot AI — Copilot Chat',
        '',
        'I can comment and analyse your code. Try:',
        '',
        '| Command | What it does |',
        '|---------|-------------|',
        '| `@poly-glot /comment` | Add JSDoc / Javadoc / PyDoc to selected code |',
        '| `@poly-glot /why` | Add why-comments explaining intent & trade-offs _(Pro)_ |',
        '| `@poly-glot /both` | Doc-comments + why-comments in one pass _(Pro)_ |',
        '| `@poly-glot /explain` | Deep analysis: complexity, bugs, doc quality |',
        '| `@poly-glot /upgrade` | See Pro plan — lock in $9/mo forever with EARLYBIRD3 |',
        '',
        '_Select some code first for best results._',
    ].join('\n'));
    return { metadata: { command: 'help' } };
}
// ─── Commands ─────────────────────────────────────────────────────────────────
async function cmdGenerateComments() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('Poly-Glot: No active editor.');
        return;
    }
    if (!await requireApiKey())
        return;
    if (!await checkAndIncrementUsage())
        return;
    const selection = editor.selection;
    const code = editor.document.getText(selection.isEmpty ? undefined : selection);
    const languageId = editor.document.languageId;
    if (!await isLanguageAllowed(languageId)) {
        await showProGate(`${languageId} language`);
        return;
    }
    await runWithProgress(`Generating doc-comments (${aiGenerator.getModel()})…`, async () => {
        const result = await aiGenerator.generateComments(code, languageId);
        if (selection.isEmpty) {
            await editor.edit(eb => {
                eb.replace(new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length)), result.commentedCode);
            });
        }
        else {
            await editor.edit(eb => eb.replace(selection, result.commentedCode));
        }
        flashStatusBar(`$(check) $${result.cost.toFixed(4)} — commented`);
        vscode.window.showInformationMessage(`✅ Poly-Glot: Doc-comments added ($${result.cost.toFixed(4)})`);
    });
}
async function cmdWhyComments() {
    // Account gate first — no token means no access regardless of plan
    if (!await checkAndIncrementUsage())
        return;
    if (!await hasPro()) {
        await showProGate('Why-comments');
        return;
    }
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('Poly-Glot: No active editor.');
        return;
    }
    if (!await requireApiKey())
        return;
    const selection = editor.selection;
    const code = editor.document.getText(selection.isEmpty ? undefined : selection);
    const languageId = editor.document.languageId;
    await runWithProgress(`Generating why-comments (${aiGenerator.getModel()})…`, async () => {
        const result = await aiGenerator.generateWhyComments(code, languageId);
        if (selection.isEmpty) {
            await editor.edit(eb => {
                eb.replace(new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length)), result.commentedCode);
            });
        }
        else {
            await editor.edit(eb => eb.replace(selection, result.commentedCode));
        }
        flashStatusBar(`$(check) $${result.cost.toFixed(4)} — why-commented`);
        vscode.window.showInformationMessage(`✅ Poly-Glot: Why-comments added ($${result.cost.toFixed(4)})`);
    });
}
async function cmdBothComments() {
    // Account gate first — no token means no access regardless of plan
    if (!await checkAndIncrementUsage())
        return;
    if (!await hasPro()) {
        await showProGate('Both mode');
        return;
    }
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('Poly-Glot: No active editor.');
        return;
    }
    if (!await requireApiKey())
        return;
    const code = editor.document.getText();
    const languageId = editor.document.languageId;
    await runWithProgress(`Generating doc + why-comments (${aiGenerator.getModel()})…`, async () => {
        const doc = await aiGenerator.generateComments(code, languageId);
        const why = await aiGenerator.generateWhyComments(doc.commentedCode, languageId);
        await editor.edit(eb => {
            eb.replace(new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length)), why.commentedCode);
        });
        const totalCost = doc.cost + why.cost;
        flashStatusBar(`$(check) $${totalCost.toFixed(4)} — doc + why`);
        vscode.window.showInformationMessage(`✅ Poly-Glot: Both modes applied ($${totalCost.toFixed(4)})`);
    });
}
async function cmdCommentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('Poly-Glot: No active editor.');
        return;
    }
    await _commentDocument(editor.document, 'comment');
}
async function cmdCommentFileFromExplorer(uri) {
    if (!uri) {
        vscode.window.showErrorMessage('Poly-Glot: No file selected.');
        return;
    }
    try {
        const doc = await vscode.workspace.openTextDocument(uri);
        await _commentDocument(doc, 'comment');
    }
    catch (err) {
        vscode.window.showErrorMessage(`Poly-Glot: Could not open file — ${err instanceof Error ? err.message : String(err)}`);
    }
}
async function cmdWhyFileFromExplorer(uri) {
    if (!uri) {
        vscode.window.showErrorMessage('Poly-Glot: No file selected.');
        return;
    }
    if (!await hasPro()) {
        await showProGate('Why-comments');
        return;
    }
    try {
        const doc = await vscode.workspace.openTextDocument(uri);
        await _commentDocument(doc, 'why');
    }
    catch (err) {
        vscode.window.showErrorMessage(`Poly-Glot: Could not open file — ${err instanceof Error ? err.message : String(err)}`);
    }
}
async function _commentDocument(doc, mode) {
    const code = doc.getText();
    if (!code.trim()) {
        vscode.window.showWarningMessage('Poly-Glot: File is empty.');
        return;
    }
    if (!await requireApiKey())
        return;
    if (!await checkAndIncrementUsage())
        return;
    const languageId = doc.languageId;
    const fileName = doc.fileName.split('/').pop() ?? doc.fileName;
    if (!await isLanguageAllowed(languageId)) {
        await showProGate(`${languageId} language`);
        return;
    }
    if (mode === 'why' && !await hasPro()) {
        await showProGate('Why-comments');
        return;
    }
    const label = mode === 'why' ? 'Adding why-comments' : 'Commenting';
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Poly-Glot: ${label} ${fileName} (${aiGenerator.getModel()})…`, cancellable: false }, async () => {
        try {
            const result = mode === 'why'
                ? await aiGenerator.generateWhyComments(code, languageId)
                : await aiGenerator.generateComments(code, languageId);
            const insertInline = vscode.workspace.getConfiguration('polyglot').get('insertInline', true);
            if (insertInline) {
                const editor = await vscode.window.showTextDocument(doc);
                await editor.edit(eb => {
                    eb.replace(new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length)), result.commentedCode);
                });
                const modeLabel = mode === 'why' ? 'why-commented' : 'commented';
                flashStatusBar(`$(check) $${result.cost.toFixed(4)} — ${fileName} ${modeLabel}`);
                vscode.window.showInformationMessage(`✅ Poly-Glot: ${fileName} ${modeLabel} ($${result.cost.toFixed(4)})`);
            }
            else {
                showResultPanel(result.commentedCode, languageId, result.cost);
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(`Poly-Glot: ${err instanceof Error ? err.message : String(err)}`);
        }
    });
}
async function cmdExplainCode() {
    // Account gate — explain code requires a free account like all other commands
    if (!await checkAndIncrementUsage())
        return;
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('Poly-Glot: No active editor.');
        return;
    }
    if (!await requireApiKey())
        return;
    const selection = editor.selection;
    const code = editor.document.getText(selection.isEmpty ? undefined : selection);
    if (!code.trim()) {
        vscode.window.showWarningMessage('Poly-Glot: Select some code to explain.');
        return;
    }
    const languageId = editor.document.languageId;
    await runWithProgress(`Analyzing code (${aiGenerator.getModel()})…`, async () => {
        const result = await aiGenerator.explainCode(code, languageId);
        flashStatusBar(`$(search) $${result.cost.toFixed(4)} — analysis complete`);
        showExplainPanel(result);
    });
}
async function cmdConfigureApiKey() {
    const provider = await vscode.window.showQuickPick([
        { label: '$(cloud) OpenAI', description: 'GPT-4.1, GPT-4.1 Mini, GPT-4o, o3…', value: 'openai' },
        { label: '$(cloud) Anthropic', description: 'Claude Sonnet 4, Claude Opus 4, Haiku 4…', value: 'anthropic' },
        { label: '$(cloud) Google', description: 'Gemini 2.5 Flash, Gemini 2.5 Pro, Flash Lite…', value: 'google' },
    ], { title: 'Poly-Glot: Select AI Provider', placeHolder: 'Choose your provider' });
    if (!provider)
        return;
    const keyPrompt = provider.value === 'anthropic'
        ? 'Get your key at console.anthropic.com/settings/keys'
        : provider.value === 'google'
            ? 'Get your key at aistudio.google.com/app/apikey'
            : 'Get your key at platform.openai.com/api-keys';
    const keyPlaceholder = provider.value === 'anthropic' ? 'sk-ant-…'
        : provider.value === 'google' ? 'AIza…'
            : 'sk-…';
    const apiKey = await vscode.window.showInputBox({
        title: `Poly-Glot: Enter ${provider.value === 'anthropic' ? 'Anthropic' : provider.value === 'google' ? 'Google AI' : 'OpenAI'} API Key`,
        prompt: keyPrompt,
        placeHolder: keyPlaceholder,
        password: true,
        ignoreFocusOut: true,
        validateInput: val => val && val.trim().length > 10 ? null : 'Key must be at least 10 characters',
    });
    if (!apiKey)
        return;
    await aiGenerator.saveApiKey(apiKey.trim());
    await vscode.workspace.getConfiguration('polyglot').update('provider', provider.value, vscode.ConfigurationTarget.Global);
    const models = aiGenerator.getAvailableModels(provider.value);
    const modelChoice = await vscode.window.showQuickPick(models.map(m => ({ label: m.label, description: `${m.cost} cost`, value: m.value })), { title: 'Poly-Glot: Select Model', placeHolder: 'Choose a model' });
    if (modelChoice) {
        await vscode.workspace.getConfiguration('polyglot').update('model', modelChoice.value, vscode.ConfigurationTarget.Global);
    }
    const provName = provider.value === 'anthropic' ? 'Anthropic'
        : provider.value === 'google' ? 'Google AI'
            : 'OpenAI';
    vscode.window.showInformationMessage(`✅ Poly-Glot: ${provName} configured!`);
}
async function cmdConfigureLicenseToken() {
    const currentToken = extContext.globalState.get('pg.sessionToken', '');
    const currentLicense = vscode.workspace.getConfiguration('polyglot').get('licenseToken', '');
    const current = currentToken || currentLicense;
    const token = await vscode.window.showInputBox({
        title: 'Poly-Glot: Enter Session / License Token',
        prompt: 'Sign in at poly-glot.ai → copy your session token. Or use your Pro license token.',
        placeHolder: 'Paste your token here…',
        value: current,
        password: true,
        ignoreFocusOut: true,
        validateInput: val => val && val.trim().length > 10 ? null : 'Token must be at least 10 characters',
    });
    if (token === undefined)
        return;
    const trimmed = token.trim();
    // Store in both places for compatibility: globalState (preferred) + settings (legacy)
    await extContext.globalState.update('pg.sessionToken', trimmed || '');
    await vscode.workspace.getConfiguration('polyglot').update('licenseToken', trimmed, vscode.ConfigurationTarget.Global);
    // Reset plan cache so it re-verifies
    _cachedPlan = undefined;
    if (!trimmed) {
        vscode.window.showInformationMessage('Poly-Glot: Token cleared. Using Free plan.');
        updateStatusBarUsage(false);
        return;
    }
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Poly-Glot: Verifying token…', cancellable: false }, async () => {
        const plan = await getVerifiedPlan();
        if (plan && PRO_PLANS.includes(plan)) {
            const label = plan.charAt(0).toUpperCase() + plan.slice(1);
            vscode.window.showInformationMessage(`✅ Poly-Glot: ${label} plan activated! All features unlocked.`);
            flashStatusBar(`$(star) Poly-Glot ${label}`, 6000);
            updateStatusBarUsage(true);
        }
        else {
            vscode.window.showWarningMessage('Poly-Glot: Token saved (Free plan). Upgrade to Pro at poly-glot.ai.', 'See Pro Plans').then(action => {
                if (action === 'See Pro Plans')
                    vscode.env.openExternal(vscode.Uri.parse(UPGRADE_URL));
            });
            updateStatusBarUsage(false);
        }
    });
}
// ─── Command: Start for Free ──────────────────────────────────────────────────
// Triggered by "Start for Free" pricing card and any unauthenticated sign-up prompt.
// Posts to /api/auth/free-signup → worker sends a magic-link email → user clicks it
// → session token stored → usage tracking active (1.4.38 build).
async function cmdStartForFree() {
    // If already signed in with a session token, nothing to do
    const existing = extContext.globalState.get('pg.sessionToken', '').trim();
    if (existing) {
        vscode.window.showInformationMessage('Poly-Glot: You already have a free account. Run "Poly-Glot: Configure License Token" to upgrade.', 'See Pro Plans').then(a => { if (a === 'See Pro Plans')
            vscode.env.openExternal(vscode.Uri.parse(UPGRADE_URL)); });
        return;
    }
    const email = await vscode.window.showInputBox({
        title: 'Poly-Glot: Create Free Account',
        prompt: 'Enter your email — we\'ll send a magic link. No password needed.',
        placeHolder: 'you@example.com',
        ignoreFocusOut: true,
        validateInput: val => val && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim())
            ? null
            : 'Please enter a valid email address',
    });
    if (!email)
        return;
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Poly-Glot: Sending magic link…', cancellable: false }, async () => {
        try {
            const res = await fetch(FREE_SIGNUP_URL, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
                signal: AbortSignal.timeout(8000),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.ok) {
                // Prompt user to paste the token from the magic-link URL
                const action = await vscode.window.showInformationMessage(`✅ Magic link sent to ${email.trim()}! Check your inbox, click the link, then paste your token below.`, 'Enter Token', 'Later');
                if (action === 'Enter Token') {
                    await cmdConfigureLicenseToken();
                }
            }
            else {
                vscode.window.showErrorMessage(`Poly-Glot: ${data.error || 'Failed to send magic link. Please try again.'}`);
            }
        }
        catch {
            vscode.window.showErrorMessage('Poly-Glot: Network error — check your connection and try again.');
        }
    });
}
// ─── Shared helpers ───────────────────────────────────────────────────────────
async function requireApiKey() {
    if (await aiGenerator.isConfigured())
        return true;
    const action = await vscode.window.showErrorMessage('Poly-Glot: API key not configured.', 'Configure Now');
    if (action === 'Configure Now')
        await cmdConfigureApiKey();
    return false;
}
async function runWithProgress(title, fn) {
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Poly-Glot: ${title}`, cancellable: false }, async () => {
        try {
            await fn();
        }
        catch (err) {
            vscode.window.showErrorMessage(`Poly-Glot: ${err instanceof Error ? err.message : String(err)}`);
        }
    });
}
function flashStatusBar(message, durationMs = 8000) {
    statusBarItem.text = message;
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    setTimeout(() => {
        hasPro().then(isPro => updateStatusBarUsage(isPro));
    }, durationMs);
}
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
// ─── Webview: Result Panel ────────────────────────────────────────────────────
function showResultPanel(commentedCode, languageId, cost) {
    const panel = vscode.window.createWebviewPanel('polyglotResult', 'Poly-Glot: Commented Code', vscode.ViewColumn.Beside, { enableScripts: false });
    panel.webview.html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>
      body{margin:0;padding:16px;font-family:var(--vscode-font-family);background:var(--vscode-editor-background);color:var(--vscode-editor-foreground)}
      .meta{font-size:12px;color:var(--vscode-descriptionForeground);margin-bottom:12px}
      pre{margin:0;white-space:pre-wrap;word-break:break-word;font-family:var(--vscode-editor-font-family,monospace);font-size:var(--vscode-editor-font-size,13px);line-height:1.6}
    </style></head><body>
      <p class="meta">Language: <strong>${escapeHtml(languageId)}</strong> &nbsp;|&nbsp; Cost: <strong>$${cost.toFixed(5)}</strong></p>
      <pre><code>${escapeHtml(commentedCode)}</code></pre>
    </body></html>`;
}
// ─── Webview: Explain Panel ───────────────────────────────────────────────────
function showExplainPanel(result) {
    const panel = vscode.window.createWebviewPanel('polyglotExplain', 'Poly-Glot: Code Analysis', vscode.ViewColumn.Beside, { enableScripts: false });
    const scoreColor = result.docQuality.score >= 80 ? '#4ade80' : result.docQuality.score >= 50 ? '#facc15' : '#f87171';
    const cx = (s) => s <= 3 ? '#4ade80' : s <= 6 ? '#facc15' : '#f87171';
    const functionsHtml = result.functions.map(fn => `<tr><td><code>${escapeHtml(fn.name)}</code></td><td>${escapeHtml(fn.purpose)}</td><td>${fn.params.map((p) => `<code>${escapeHtml(p)}</code>`).join(', ')}</td><td>${escapeHtml(fn.returns)}</td></tr>`).join('');
    const bugsHtml = result.potentialBugs.length
        ? result.potentialBugs.map(b => `<li>${escapeHtml(b)}</li>`).join('')
        : '<li style="color:var(--vscode-descriptionForeground)">No obvious bugs detected.</li>';
    const suggestHtml = result.suggestions.length
        ? result.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')
        : '<li style="color:var(--vscode-descriptionForeground)">No suggestions.</li>';
    const docIssuesHtml = result.docQuality.issues?.length
        ? result.docQuality.issues.map((i) => `<li>${escapeHtml(i)}</li>`).join('')
        : '<li style="color:var(--vscode-descriptionForeground)">No issues found.</li>';
    panel.webview.html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>
      body{margin:0;padding:20px;font-family:var(--vscode-font-family);background:var(--vscode-editor-background);color:var(--vscode-editor-foreground);font-size:13px}
      h1{font-size:18px;margin-bottom:4px}h2{font-size:14px;margin:20px 0 8px;color:var(--vscode-sideBarTitle-foreground,#ccc)}
      .meta{color:var(--vscode-descriptionForeground);font-size:12px;margin-bottom:20px}
      .cards{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px}
      .card{flex:1;min-width:140px;padding:14px 16px;border-radius:8px;background:var(--vscode-sideBar-background,#252526);border:1px solid var(--vscode-widget-border,#3c3c3c)}
      .card-label{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--vscode-descriptionForeground);margin-bottom:4px}
      .card-value{font-size:22px;font-weight:700}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{text-align:left;padding:6px 8px;border-bottom:1px solid var(--vscode-widget-border,#3c3c3c);color:var(--vscode-descriptionForeground);font-weight:600}
      td{padding:6px 8px;border-bottom:1px solid var(--vscode-widget-border,#2a2a2a);vertical-align:top}
      tr:hover td{background:var(--vscode-list-hoverBackground)}
      code{font-family:var(--vscode-editor-font-family,monospace);font-size:11.5px;background:var(--vscode-textCodeBlock-background,#1e1e1e);padding:1px 4px;border-radius:3px}
      ul{margin:0;padding-left:18px}li{margin-bottom:4px}
      .bar-wrap{background:#2a2a2a;border-radius:99px;height:8px;margin-top:6px;width:100%}
      .bar{height:8px;border-radius:99px}
    </style></head><body>
      <h1>🔍 Code Analysis</h1>
      <div class="meta">Model: <strong>${escapeHtml(result.model)}</strong> &nbsp;|&nbsp; Language: <strong>${escapeHtml(result.language)}</strong> &nbsp;|&nbsp; Cost: <strong>$${result.cost.toFixed(5)}</strong></div>
      <div class="cards">
        <div class="card"><div class="card-label">Complexity</div><div class="card-value" style="color:${cx(result.complexityScore)}">${escapeHtml(result.complexity)}</div><div style="font-size:12px;color:#888;margin-top:2px">Score: ${result.complexityScore}/10</div><div class="bar-wrap"><div class="bar" style="width:${result.complexityScore * 10}%;background:${cx(result.complexityScore)}"></div></div></div>
        <div class="card"><div class="card-label">Doc Quality</div><div class="card-value" style="color:${scoreColor}">${result.docQuality.label}</div><div style="font-size:12px;color:#888;margin-top:2px">Score: ${result.docQuality.score}/100</div><div class="bar-wrap"><div class="bar" style="width:${result.docQuality.score}%;background:${scoreColor}"></div></div></div>
        <div class="card"><div class="card-label">Functions</div><div class="card-value">${result.functions.length}</div></div>
        <div class="card"><div class="card-label">Potential Bugs</div><div class="card-value" style="color:${result.potentialBugs.length ? '#f87171' : '#4ade80'}">${result.potentialBugs.length}</div></div>
      </div>
      <div><h2>📖 Summary</h2><p>${escapeHtml(result.summary)}</p></div>
      <div><h2>⚙️ Functions & Methods</h2><table><thead><tr><th>Name</th><th>Purpose</th><th>Parameters</th><th>Returns</th></tr></thead><tbody>${functionsHtml}</tbody></table></div>
      <div><h2>🐛 Potential Bugs</h2><ul>${bugsHtml}</ul></div>
      <div><h2>💡 Suggestions</h2><ul>${suggestHtml}</ul></div>
      <div><h2>📝 Documentation Quality — ${result.docQuality.label} (${result.docQuality.score}/100)</h2>
        <p style="color:var(--vscode-descriptionForeground);font-size:12px;margin-bottom:8px">Issues found:</p><ul>${docIssuesHtml}</ul>
        ${result.docQuality.suggestions?.length
        ? `<p style="color:var(--vscode-descriptionForeground);font-size:12px;margin:10px 0 8px">Suggestions:</p><ul>${result.docQuality.suggestions.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
        : ''}
      </div>
    </body></html>`;
}
//# sourceMappingURL=extension.js.map