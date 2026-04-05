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
const FREE_LANGUAGES = ['javascript', 'typescript', 'python', 'java'];
const PRO_PLANS = ['pro', 'team', 'enterprise'];
const UPGRADE_URL = 'https://buy.stripe.com/fZu14pbtacrO9Ii77K14405?client_reference_id=vscode&prefilled_promo_code=EARLYBIRD3';
const UPGRADE_TEAM_URL = 'https://buy.stripe.com/aFa28teFm8by5s2eAc14409?client_reference_id=vscode-team&prefilled_promo_code=EARLYBIRD3';
const PARTICIPANT_ID = 'poly-glot.chat';
const SIGNUP_URL = 'https://poly-glot.ai/?source=vscode-install&utm_source=vscode&utm_medium=extension&utm_campaign=onboarding';
// File limits
const ANON_LIMIT = 5; // anonymous (no account) — lifetime, server-enforced
const FREE_LIMIT_NOW = 50; // free account before May 1
const FREE_LIMIT_MAY1 = 10; // free account after May 1 2025
const MAY1_2025 = new Date('2025-05-01T00:00:00Z').getTime();
function getCurrentFreeLimit() {
    return Date.now() >= MAY1_2025 ? FREE_LIMIT_MAY1 : FREE_LIMIT_NOW;
}
// ─── Module-level state ───────────────────────────────────────────────────────
let statusBarItem;
let aiGenerator;
let extContext;
// ─── Device ID (anonymous tracking) ──────────────────────────────────────────
async function getOrCreateDeviceId() {
    let deviceId = extContext.globalState.get('pg.deviceId');
    if (deviceId)
        return deviceId;
    // Register with server to get a tracked device ID
    try {
        const res = await fetch(`${AUTH_API}/register-device`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: 'vscode' }),
            signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
            const data = await res.json();
            if (data.ok && data.deviceId) {
                deviceId = data.deviceId;
                await extContext.globalState.update('pg.deviceId', deviceId);
                return deviceId;
            }
        }
    }
    catch { }
    // Fallback: generate local ID (will be registered on next attempt)
    deviceId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    await extContext.globalState.update('pg.deviceId', deviceId);
    return deviceId;
}
// ─── Usage Tracking ───────────────────────────────────────────────────────────
async function getSessionToken() {
    return extContext.globalState.get('pg.sessionToken') ||
        vscode.workspace.getConfiguration('polyglot').get('licenseToken', '').trim();
}
/**
 * Increment usage counter — server-first, local fallback.
 * Returns { allowed, used, limit, remaining }
 */
async function incrementUsage() {
    const token = await getSessionToken();
    // ── Authenticated path ────────────────────────────────────────────────
    if (token) {
        try {
            const res = await fetch(`${AUTH_API}/track-usage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, count: 1 }),
                signal: AbortSignal.timeout(5000),
            });
            const data = await res.json();
            if (res.status === 403 || data.limitReached) {
                return { allowed: false, used: data.used, limit: data.limit, remaining: 0 };
            }
            if (res.ok && data.ok) {
                // Sync local counter to server value
                await extContext.globalState.update(monthKey(), data.used);
                return { allowed: true, used: data.used, limit: data.limit, remaining: data.remaining };
            }
        }
        catch {
            // Network error — fall through to local
        }
    }
    // ── Anonymous path — server-side device tracking ──────────────────────
    const deviceId = await getOrCreateDeviceId();
    try {
        const res = await fetch(`${AUTH_API}/device-usage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId }),
            signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        if (res.status === 403 || data.limitReached) {
            return { allowed: false, used: data.used, limit: ANON_LIMIT, remaining: 0 };
        }
        if (res.ok && data.ok) {
            await extContext.globalState.update('pg.anonUsed', data.used);
            return { allowed: true, used: data.used, limit: ANON_LIMIT, remaining: data.remaining };
        }
    }
    catch { }
    // ── Last-resort local fallback (offline) ─────────────────────────────
    const key = monthKey();
    const count = (extContext.globalState.get(key) || 0) + 1;
    await extContext.globalState.update(key, count);
    const limit = token ? getCurrentFreeLimit() : ANON_LIMIT;
    return { allowed: count <= limit, used: count, limit, remaining: Math.max(0, limit - count) };
}
function monthKey() {
    const d = new Date();
    return `polyglot.usage.${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function getLocalCount() {
    return extContext.globalState.get(monthKey()) || 0;
}
// ─── Status Bar ───────────────────────────────────────────────────────────────
function updateStatusBarUsage(isPro) {
    if (isPro) {
        statusBarItem.text = '$(comment) Poly-Glot ✨ Pro';
        statusBarItem.backgroundColor = undefined;
        statusBarItem.tooltip = 'Poly-Glot Pro — unlimited files';
    }
    else {
        const count = getLocalCount();
        const limit = getCurrentFreeLimit();
        const remain = Math.max(0, limit - count);
        statusBarItem.text = `$(comment) Poly-Glot (${count}/${limit})`;
        statusBarItem.tooltip = `${remain} free file${remain === 1 ? '' : 's'} remaining — upgrade for unlimited`;
        statusBarItem.backgroundColor = count >= limit
            ? new vscode.ThemeColor('statusBarItem.errorBackground')
            : count >= limit * 0.8
                ? new vscode.ThemeColor('statusBarItem.warningBackground')
                : undefined;
    }
}
// ─── First-run onboarding ─────────────────────────────────────────────────────
async function maybeShowFirstRunOnboarding() {
    const shown = extContext.globalState.get('pg.onboardingShown');
    if (shown)
        return;
    await extContext.globalState.update('pg.onboardingShown', true);
    // Small delay so VS Code finishes loading
    await new Promise(r => setTimeout(r, 2500));
    const token = await getSessionToken();
    if (token) {
        // Already has token — verify silently
        _cachedPlan = undefined;
        await hasPro();
        return;
    }
    const choice = await vscode.window.showInformationMessage('🦜 Welcome to Poly-Glot! Create a free account to track your usage and unlock Pro features.', 'Create Free Account', 'I Already Have One', 'Maybe Later');
    if (choice === 'Create Free Account') {
        await vscode.env.openExternal(vscode.Uri.parse(SIGNUP_URL));
        // After 4 seconds, prompt for token
        await new Promise(r => setTimeout(r, 4000));
        await cmdConfigureLicenseToken();
    }
    else if (choice === 'I Already Have One') {
        await cmdConfigureLicenseToken();
    }
    // 'Maybe Later' — they'll see the nudge at file 3 and hard gate at file 5
}
// ─── Usage gate ───────────────────────────────────────────────────────────────
async function checkAndIncrementUsage() {
    // Pro users pass immediately
    if (await hasPro()) {
        updateStatusBarUsage(true);
        return true;
    }
    const { allowed, used, limit, remaining } = await incrementUsage();
    updateStatusBarUsage(false);
    const token = await getSessionToken();
    // ── Hard gate ────────────────────────────────────────────────────────
    if (!allowed) {
        if (!token) {
            // Anonymous — must create account
            const choice = await vscode.window.showErrorMessage(`🚫 You've used all ${ANON_LIMIT} free files. Create a free account to get ${getCurrentFreeLimit()} files/month.`, 'Create Free Account', 'I Have an Account');
            if (choice === 'Create Free Account') {
                await vscode.env.openExternal(vscode.Uri.parse(SIGNUP_URL));
                await new Promise(r => setTimeout(r, 4000));
                await cmdConfigureLicenseToken();
            }
            else if (choice === 'I Have an Account') {
                await cmdConfigureLicenseToken();
            }
        }
        else {
            // Free account — must upgrade
            const freeLimit = limit ?? getCurrentFreeLimit();
            const choice = await vscode.window.showErrorMessage(`🚫 You've used all ${freeLimit} free files this month. Upgrade to Pro for unlimited access.`, 'Upgrade for $9/mo', 'Upgrade Team — $29/mo', 'Enter Token');
            if (choice === 'Upgrade for $9/mo') {
                vscode.env.openExternal(vscode.Uri.parse(UPGRADE_URL));
            }
            else if (choice === 'Upgrade Team — $29/mo') {
                vscode.env.openExternal(vscode.Uri.parse(UPGRADE_TEAM_URL));
            }
            else if (choice === 'Enter Token') {
                await cmdConfigureLicenseToken();
            }
        }
        return false;
    }
    // ── Nudge at file 3 for anonymous users ──────────────────────────────
    if (!token && used === 3) {
        const choice = await vscode.window.showWarningMessage(`⚡ You've used ${used}/${ANON_LIMIT} free files. Create a free account for ${getCurrentFreeLimit()} files/month.`, 'Create Free Account', 'Dismiss');
        if (choice === 'Create Free Account') {
            await vscode.env.openExternal(vscode.Uri.parse(SIGNUP_URL));
            await new Promise(r => setTimeout(r, 4000));
            await cmdConfigureLicenseToken();
        }
    }
    // ── Nudge at 80% for free account users ──────────────────────────────
    if (token && remaining !== null && limit !== null && used === Math.floor(limit * 0.8)) {
        const choice = await vscode.window.showWarningMessage(`⚡ ${remaining} free file${remaining === 1 ? '' : 's'} remaining this month — upgrade for unlimited.`, 'Upgrade — 50% off with EARLYBIRD3', 'Dismiss');
        if (choice === 'Upgrade — 50% off with EARLYBIRD3') {
            vscode.env.openExternal(vscode.Uri.parse(UPGRADE_URL));
        }
    }
    // ── Last file warning ─────────────────────────────────────────────────
    if (token && remaining === 0) {
        const choice = await vscode.window.showWarningMessage(`🔴 That was your last free file this month. Upgrade to keep going.`, 'Upgrade for $9/mo', 'Enter Token');
        if (choice === 'Upgrade for $9/mo') {
            vscode.env.openExternal(vscode.Uri.parse(UPGRADE_URL));
        }
        else if (choice === 'Enter Token') {
            await cmdConfigureLicenseToken();
        }
    }
    return true;
}
// ─── Plan / License helpers ───────────────────────────────────────────────────
let _cachedPlan = undefined;
async function getVerifiedPlan() {
    if (_cachedPlan !== undefined)
        return _cachedPlan;
    const token = await getSessionToken();
    if (!token) {
        _cachedPlan = null;
        return null;
    }
    try {
        const res = await fetch(`${AUTH_API}/check-plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) {
            _cachedPlan = null;
            return null;
        }
        const data = await res.json();
        _cachedPlan = (data.valid && data.plan) ? data.plan : null;
    }
    catch {
        // Network error — fail open so paying users aren't blocked offline
        _cachedPlan = null;
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
    const token = await getSessionToken();
    const message = `Poly-Glot: ${feature} requires a Pro plan.`;
    const actions = token
        ? ['Already subscribed? Re-enter token', 'Get Pro']
        : ['Get Pro — 3 months free', 'Enter License Token'];
    const choice = await vscode.window.showErrorMessage(message, ...actions);
    if (choice === 'Get Pro' || choice === 'Get Pro — 3 months free') {
        vscode.env.openExternal(vscode.Uri.parse(UPGRADE_URL));
        return true;
    }
    if (choice === 'Enter License Token' || choice === 'Already subscribed? Re-enter token') {
        await cmdConfigureLicenseToken();
        return true;
    }
    return false;
}
// ─── Shared guards ────────────────────────────────────────────────────────────
async function requireApiKey() {
    if (await aiGenerator.isConfigured())
        return true;
    const action = await vscode.window.showErrorMessage('Poly-Glot: API key not configured.', 'Configure Now');
    if (action === 'Configure Now')
        await cmdConfigureApiKey();
    return false;
}
// ─── Activation ───────────────────────────────────────────────────────────────
function activate(context) {
    extContext = context;
    aiGenerator = new ai_generator_1.AIGenerator(context);
    // Status bar
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'polyglot.generateComments';
    statusBarItem.text = '$(comment) Poly-Glot';
    statusBarItem.tooltip = 'Poly-Glot: Generate doc-comments (Cmd+Shift+/)';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    hasPro().then(isPro => updateStatusBarUsage(isPro));
    // Sidebar
    const sidebarProvider = new sidebar_1.TemplatesSidebarProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(sidebar_1.TemplatesSidebarProvider.viewType, sidebarProvider));
    // Commands
    context.subscriptions.push(vscode.commands.registerCommand('polyglot.generateComments', () => cmdGenerateComments()), vscode.commands.registerCommand('polyglot.generateWhyComments', () => cmdGenerateWhyComments()), vscode.commands.registerCommand('polyglot.generateBothComments', () => cmdGenerateBothComments()), vscode.commands.registerCommand('polyglot.explainCode', () => cmdExplainCode()), vscode.commands.registerCommand('polyglot.configureApiKey', () => cmdConfigureApiKey()), vscode.commands.registerCommand('polyglot.configureLicenseToken', () => cmdConfigureLicenseToken()), vscode.commands.registerCommand('polyglot.openUpgrade', () => vscode.env.openExternal(vscode.Uri.parse(UPGRADE_URL))));
    // Chat participant
    try {
        const participant = vscode.chat.createChatParticipant(PARTICIPANT_ID, handleChatRequest);
        participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');
        context.subscriptions.push(participant);
    }
    catch { }
    // First-run onboarding — non-blocking
    maybeShowFirstRunOnboarding().catch(() => { });
}
function deactivate() { }
// ─── Command: Doc-Comments ────────────────────────────────────────────────────
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
    const languageId = editor.document.languageId;
    if (!await isLanguageAllowed(languageId)) {
        await showProGate(`${languageId} language`);
        return;
    }
    const selection = editor.selection;
    const hasSelection = !selection.isEmpty;
    const range = hasSelection ? selection : new vscode.Range(0, 0, editor.document.lineCount - 1, 0);
    const code = editor.document.getText(range);
    await runWithProgress('Generating doc-comments…', async () => {
        const result = await aiGenerator.generateComments(code, languageId);
        await editor.edit(eb => eb.replace(range, result.commentedCode));
        showResultPanel(result.commentedCode, languageId, result.cost);
        flashStatusBar('$(check) Poly-Glot: Done!');
    });
}
// ─── Command: Why-Comments ────────────────────────────────────────────────────
async function cmdGenerateWhyComments() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('Poly-Glot: No active editor.');
        return;
    }
    if (!await hasPro()) {
        await showProGate('Why-comments');
        return;
    }
    if (!await requireApiKey())
        return;
    if (!await checkAndIncrementUsage())
        return;
    const languageId = editor.document.languageId;
    const selection = editor.selection;
    const range = selection.isEmpty ? new vscode.Range(0, 0, editor.document.lineCount - 1, 0) : selection;
    const code = editor.document.getText(range);
    await runWithProgress('Generating why-comments…', async () => {
        const result = await aiGenerator.generateComments(code, languageId);
        await editor.edit(eb => eb.replace(range, result.commentedCode));
        flashStatusBar('$(check) Poly-Glot: Done!');
    });
}
// ─── Command: Both Comments ───────────────────────────────────────────────────
async function cmdGenerateBothComments() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('Poly-Glot: No active editor.');
        return;
    }
    if (!await hasPro()) {
        await showProGate('Both doc + why comments');
        return;
    }
    if (!await requireApiKey())
        return;
    if (!await checkAndIncrementUsage())
        return;
    const languageId = editor.document.languageId;
    const selection = editor.selection;
    const range = selection.isEmpty ? new vscode.Range(0, 0, editor.document.lineCount - 1, 0) : selection;
    const code = editor.document.getText(range);
    await runWithProgress('Generating doc + why comments…', async () => {
        const result = await aiGenerator.generateComments(code, languageId);
        await editor.edit(eb => eb.replace(range, result.commentedCode));
        flashStatusBar('$(check) Poly-Glot: Done!');
    });
}
// ─── Command: Explain Code ────────────────────────────────────────────────────
async function cmdExplainCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('Poly-Glot: No active editor.');
        return;
    }
    if (!await hasPro()) {
        await showProGate('Code explain');
        return;
    }
    if (!await requireApiKey())
        return;
    const languageId = editor.document.languageId;
    const selection = editor.selection;
    const range = selection.isEmpty ? new vscode.Range(0, 0, editor.document.lineCount - 1, 0) : selection;
    const code = editor.document.getText(range);
    await runWithProgress('Analysing code…', async () => {
        const result = await aiGenerator.explainCode(code, languageId);
        showExplainPanel(result);
    });
}
// ─── Chat Participant ─────────────────────────────────────────────────────────
async function handleChatRequest(request, _context, stream, _token) {
    if (request.command === 'help')
        return handleHelpCommand(stream);
    if (request.command === 'upgrade') {
        stream.markdown(`## ⚡ Upgrade to Poly-Glot Pro\n\n[Upgrade for $9/mo →](${UPGRADE_URL})\n\n50% off with code **EARLYBIRD3**`);
        return { metadata: { command: 'upgrade' } };
    }
    if (!await requireApiKey()) {
        stream.markdown('## ⚙️ API Key Required\n\nRun `Poly-Glot: Configure API Key` from the Command Palette first.');
        return { metadata: { command: 'error' } };
    }
    const isPro = await hasPro();
    const cmd = request.command || 'comment';
    // Pro gate
    if ((cmd === 'why' || cmd === 'both' || cmd === 'explain') && !isPro) {
        stream.markdown(`## 🔒 Pro Feature\n\n\`@poly-glot /${cmd}\` requires a Pro plan.\n\n[Upgrade for $9/mo →](${UPGRADE_URL})`);
        return { metadata: { command: cmd } };
    }
    const editor = vscode.window.activeTextEditor;
    const code = editor ? editor.document.getText(editor.selection.isEmpty ? undefined : editor.selection) : '';
    const langId = editor?.document.languageId || 'plaintext';
    const userText = request.prompt?.trim() || '';
    const count = getLocalCount();
    const limit = getCurrentFreeLimit();
    if (!isPro && count >= limit) {
        stream.markdown(`## 🚫 Free plan limit reached — ${limit} files this month\n\nYou've used **${count}/${limit}** free files.\n\n[Upgrade for $9/mo →](${UPGRADE_URL})\n\n_50% off with code **EARLYBIRD3**_`);
        return { metadata: { command: cmd } };
    }
    await checkAndIncrementUsage();
    if (cmd === 'explain') {
        stream.markdown('## 🔍 Analysing your code…\n');
        try {
            const result = await aiGenerator.explainCode(code || userText, langId);
            stream.markdown(`**Summary:** ${result.summary}\n\n**Complexity:** ${result.complexity} (${result.complexityScore}/10)\n\n**Doc Quality:** ${result.docQuality.label} (${result.docQuality.score}/100)`);
            if (result.potentialBugs.length)
                stream.markdown(`\n\n**Potential Bugs:**\n${result.potentialBugs.map(b => `- ${b}`).join('\n')}`);
        }
        catch (e) {
            stream.markdown(`Error: ${e.message}`);
        }
        return { metadata: { command: 'explain' } };
    }
    const commentType = cmd === 'why' ? 'why' : cmd === 'both' ? 'both' : 'doc';
    stream.markdown(`## 💬 Generating ${commentType} comments…\n`);
    try {
        const result = await aiGenerator.generateComments(code || userText, langId);
        stream.markdown('```' + langId + '\n' + result.commentedCode + '\n```');
        stream.markdown(`\n_Cost: $${result.cost.toFixed(5)}_`);
    }
    catch (e) {
        stream.markdown(`Error: ${e.message}`);
    }
    return { metadata: { command: cmd } };
}
function handleHelpCommand(stream) {
    stream.markdown([
        '## 🦜 Poly-Glot Commands',
        '',
        '| Command | Description |',
        '|---|---|',
        '| `@poly-glot /comment` | Add doc-comments to selected code |',
        '| `@poly-glot /why` | Add why-comments explaining intent _(Pro)_ |',
        '| `@poly-glot /both` | Doc + why comments in one pass _(Pro)_ |',
        '| `@poly-glot /explain` | Deep analysis: complexity, bugs, doc quality _(Pro)_ |',
        '| `@poly-glot /upgrade` | See Pro plan + get 50% off |',
        '',
        '_Select some code first for best results._',
    ].join('\n'));
    return { metadata: { command: 'help' } };
}
// ─── Command: Configure API Key ───────────────────────────────────────────────
async function cmdConfigureApiKey() {
    const config = vscode.workspace.getConfiguration('polyglot');
    const providerItems = [
        { label: '$(symbol-class) OpenAI', description: 'GPT-4o, GPT-4, GPT-3.5', detail: 'openai' },
        { label: '$(symbol-class) Anthropic', description: 'Claude 3.5 Sonnet, Claude 3', detail: 'anthropic' },
        { label: '$(symbol-class) Google AI', description: 'Gemini 1.5 Pro, Gemini 1.0', detail: 'google' },
    ];
    const provider = await vscode.window.showQuickPick(providerItems, {
        title: 'Poly-Glot: Select AI Provider', placeHolder: 'Choose your AI provider',
    });
    if (!provider)
        return;
    const providerValue = provider.detail;
    const placeholder = providerValue === 'openai' ? 'sk-...'
        : providerValue === 'anthropic' ? 'sk-ant-...'
            : 'AIza...';
    const providerLabel = (provider.label || '').replace(/\$\(.*?\)\s*/, '');
    const apiKey = await vscode.window.showInputBox({
        title: `Poly-Glot: Enter ${providerLabel} API Key`,
        prompt: `Paste your ${providerLabel} API key`,
        placeHolder: placeholder,
        password: true,
        ignoreFocusOut: true,
        validateInput: v => v && v.trim().length > 10 ? null : 'API key must be at least 10 characters',
    });
    if (!apiKey)
        return;
    await config.update('provider', providerValue, vscode.ConfigurationTarget.Global);
    await config.update('apiKey', apiKey.trim(), vscode.ConfigurationTarget.Global);
    const token = await getSessionToken();
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Poly-Glot: Validating API key…', cancellable: false }, async () => {
        try {
            const res = await fetch(`${AUTH_API}/validate-key`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: providerValue, apiKey: apiKey.trim(), token }),
                signal: AbortSignal.timeout(10000),
            });
            const data = await res.json();
            if (data.ok) {
                vscode.window.showInformationMessage(`✅ Poly-Glot: API key valid!`);
            }
            else {
                vscode.window.showWarningMessage(`⚠️ Poly-Glot: ${data.error || 'Key validation failed'}`);
            }
        }
        catch {
            vscode.window.showWarningMessage('Poly-Glot: Could not validate key — check your internet connection.');
        }
    });
    const modelMap = {
        openai: [
            { label: 'GPT-4o (recommended)', detail: 'gpt-4o' },
            { label: 'GPT-4o mini (fast)', detail: 'gpt-4o-mini' },
            { label: 'GPT-4 Turbo', detail: 'gpt-4-turbo' },
        ],
        anthropic: [
            { label: 'Claude 3.5 Sonnet (recommended)', detail: 'claude-3-5-sonnet-20241022' },
            { label: 'Claude 3 Haiku (fast)', detail: 'claude-3-haiku-20240307' },
            { label: 'Claude 3 Opus (powerful)', detail: 'claude-3-opus-20240229' },
        ],
        google: [
            { label: 'Gemini 1.5 Pro (recommended)', detail: 'gemini-1.5-pro' },
            { label: 'Gemini 1.5 Flash (fast)', detail: 'gemini-1.5-flash' },
            { label: 'Gemini 1.0 Pro', detail: 'gemini-pro' },
        ],
    };
    const modelChoice = await vscode.window.showQuickPick(modelMap[providerValue] || [], {
        title: 'Poly-Glot: Select Model', placeHolder: 'Choose the AI model to use',
    });
    if (modelChoice) {
        await config.update('model', modelChoice.detail, vscode.ConfigurationTarget.Global);
    }
    const provName = providerValue === 'anthropic' ? 'Anthropic' : providerValue === 'google' ? 'Google AI' : 'OpenAI';
    vscode.window.showInformationMessage(`✅ Poly-Glot: ${provName} configured!`);
}
// ─── Command: Configure License Token ────────────────────────────────────────
async function cmdConfigureLicenseToken() {
    const current = await getSessionToken();
    const token = await vscode.window.showInputBox({
        title: 'Poly-Glot: Enter Session / License Token',
        prompt: 'Sign in at poly-glot.ai → your session token appears after login',
        placeHolder: 'Paste your session token here…',
        value: current,
        password: true,
        ignoreFocusOut: true,
        validateInput: val => val && val.trim().length > 10 ? null : 'Token must be at least 10 characters',
    });
    if (token === undefined)
        return;
    const trimmed = token.trim();
    // Store in both places for full compatibility
    await extContext.globalState.update('pg.sessionToken', trimmed || undefined);
    await vscode.workspace.getConfiguration('polyglot').update('licenseToken', trimmed, vscode.ConfigurationTarget.Global);
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
        else if (plan === 'free') {
            const limit = getCurrentFreeLimit();
            vscode.window.showInformationMessage(`✅ Poly-Glot: Free account verified. You have ${limit} files/month.`);
            updateStatusBarUsage(false);
        }
        else {
            vscode.window.showWarningMessage('Poly-Glot: Token could not be verified. Check your token at poly-glot.ai.', 'Open poly-glot.ai').then(action => {
                if (action === 'Open poly-glot.ai')
                    vscode.env.openExternal(vscode.Uri.parse('https://poly-glot.ai'));
            });
        }
    });
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
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
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
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
    const bugsHtml = result.potentialBugs.length ? result.potentialBugs.map(b => `<li>${escapeHtml(b)}</li>`).join('') : '<li style="color:var(--vscode-descriptionForeground)">No obvious bugs detected.</li>';
    const suggestHtml = result.suggestions.length ? result.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('') : '<li style="color:var(--vscode-descriptionForeground)">No suggestions.</li>';
    const docIssuesHtml = result.docQuality.issues?.length ? result.docQuality.issues.map((i) => `<li>${escapeHtml(i)}</li>`).join('') : '<li style="color:var(--vscode-descriptionForeground)">No issues found.</li>';
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
      <div><h2>⚙️ Functions &amp; Methods</h2><table><thead><tr><th>Name</th><th>Purpose</th><th>Parameters</th><th>Returns</th></tr></thead><tbody>${functionsHtml}</tbody></table></div>
      <div><h2>🐛 Potential Bugs</h2><ul>${bugsHtml}</ul></div>
      <div><h2>💡 Suggestions</h2><ul>${suggestHtml}</ul></div>
      <div><h2>📝 Documentation Quality — ${result.docQuality.label} (${result.docQuality.score}/100)</h2>
        <p style="color:var(--vscode-descriptionForeground);font-size:12px;margin-bottom:8px">Issues found:</p><ul>${docIssuesHtml}</ul>
        ${result.docQuality.suggestions?.length ? `<p style="color:var(--vscode-descriptionForeground);font-size:12px;margin:10px 0 8px">Suggestions:</p><ul>${result.docQuality.suggestions.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>` : ''}
      </div>
    </body></html>`;
}
//# sourceMappingURL=extension.js.map