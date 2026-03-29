import * as vscode from 'vscode';
import { AIGenerator, ExplainResult } from './ai-generator';
import { TemplatesSidebarProvider } from './sidebar';

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTH_API       = 'https://poly-glot.ai/api/auth';
const FREE_LANGUAGES = ['javascript', 'typescript', 'python', 'java'];
const PRO_PLANS      = ['pro', 'team', 'enterprise'];
const UPGRADE_URL    = 'https://poly-glot.ai/#pg-pricing-section';

// ─── Module-level state ───────────────────────────────────────────────────────

let statusBarItem: vscode.StatusBarItem;
let aiGenerator: AIGenerator;

/** Per-session plan cache — verified once, reused for the session lifetime. */
let _cachedPlan: string | null | undefined = undefined;

// ─── Activation ───────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
    aiGenerator = new AIGenerator(context);

    // Status bar
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'polyglot.generateComments';
    statusBarItem.text    = '$(comment) Poly-Glot';
    statusBarItem.tooltip = 'Poly-Glot: Generate doc-comments (Cmd+Shift+/)';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Sidebar
    const sidebarProvider = new TemplatesSidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            TemplatesSidebarProvider.viewType,
            sidebarProvider,
        ),
    );

    // Register all commands
    context.subscriptions.push(
        vscode.commands.registerCommand('polyglot.generateComments',        () => cmdGenerateComments()),
        vscode.commands.registerCommand('polyglot.whyComments',             () => cmdWhyComments()),
        vscode.commands.registerCommand('polyglot.bothComments',            () => cmdBothComments()),
        vscode.commands.registerCommand('polyglot.commentFile',             () => cmdCommentFile()),
        vscode.commands.registerCommand('polyglot.commentFileFromExplorer', (uri: vscode.Uri) => cmdCommentFileFromExplorer(uri)),
        vscode.commands.registerCommand('polyglot.whyFileFromExplorer',     (uri: vscode.Uri) => cmdWhyFileFromExplorer(uri)),
        vscode.commands.registerCommand('polyglot.explainCode',             () => cmdExplainCode()),
        vscode.commands.registerCommand('polyglot.configureApiKey',         () => cmdConfigureApiKey()),
        vscode.commands.registerCommand('polyglot.configureLicenseToken',   () => cmdConfigureLicenseToken()),
        vscode.commands.registerCommand('polyglot.openTemplates',           () =>
            vscode.commands.executeCommand('polyglot.templatesView.focus'),
        ),
    );
}

export function deactivate(): void {
    statusBarItem?.dispose();
}

// ─── Plan / License helpers ───────────────────────────────────────────────────

async function getVerifiedPlan(): Promise<string | null> {
    if (_cachedPlan !== undefined) return _cachedPlan;

    const token = vscode.workspace.getConfiguration('polyglot').get<string>('licenseToken', '').trim();
    if (!token) { _cachedPlan = null; return null; }

    try {
        const res = await fetch(`${AUTH_API}/verify`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ token }),
            signal:  AbortSignal.timeout(3000),
        });
        if (!res.ok) { _cachedPlan = null; return null; }
        const data = await res.json() as { valid: boolean; plan?: string };
        _cachedPlan = (data.valid && data.plan) ? data.plan : null;
    } catch {
        // Network error — fail open so paying users aren't blocked offline
        _cachedPlan = null;
    }
    return _cachedPlan;
}

async function hasPro(): Promise<boolean> {
    const plan = await getVerifiedPlan();
    return plan !== null && PRO_PLANS.includes(plan);
}

/**
 * Check if the current file's language is allowed on the free tier.
 * Returns true if allowed, false if Pro is required.
 */
async function isLanguageAllowed(languageId: string): Promise<boolean> {
    if (FREE_LANGUAGES.includes(languageId)) return true;
    return hasPro();
}

/**
 * Show a Pro upgrade prompt when a user hits a gated feature.
 * Returns true if user clicked "Upgrade", false otherwise.
 */
async function showProGate(feature: string): Promise<boolean> {
    const token = vscode.workspace.getConfiguration('polyglot').get<string>('licenseToken', '').trim();
    const hasToken = !!token;

    const message = `Poly-Glot: ${feature} requires a Pro plan.`;
    const actions = hasToken
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

// ─── Shared: guard API key configured ─────────────────────────────────────────

async function requireApiKey(): Promise<boolean> {
    if (await aiGenerator.isConfigured()) return true;
    const action = await vscode.window.showErrorMessage(
        'Poly-Glot: API key not configured.',
        'Configure Now',
    );
    if (action === 'Configure Now') await cmdConfigureApiKey();
    return false;
}

// ─── Command: Doc-Comments (selection or whole file) ─────────────────────────

async function cmdGenerateComments(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { vscode.window.showErrorMessage('Poly-Glot: No active editor.'); return; }
    if (!await requireApiKey()) return;

    const languageId = editor.document.languageId;
    if (!await isLanguageAllowed(languageId)) {
        await showProGate(`${languageId} language`);
        return;
    }

    const selection = editor.selection;
    const code = editor.document.getText(selection.isEmpty ? undefined : selection);
    if (!code.trim()) { vscode.window.showWarningMessage('Poly-Glot: File is empty.'); return; }

    await runWithProgress(`Generating doc-comments (${aiGenerator.getModel()})…`, async () => {
        const result = await aiGenerator.generateComments(code, languageId);
        await applyResult(editor, selection, result.commentedCode, result.cost, 'commented');
    });
}

// ─── Command: Why-Comments ────────────────────────────────────────────────────

async function cmdWhyComments(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { vscode.window.showErrorMessage('Poly-Glot: No active editor.'); return; }
    if (!await requireApiKey()) return;

    if (!await hasPro()) {
        await showProGate('Why-comments');
        return;
    }

    const languageId = editor.document.languageId;
    if (!await isLanguageAllowed(languageId)) {
        await showProGate(`${languageId} language`);
        return;
    }

    const selection = editor.selection;
    const code = editor.document.getText(selection.isEmpty ? undefined : selection);
    if (!code.trim()) { vscode.window.showWarningMessage('Poly-Glot: File is empty.'); return; }

    await runWithProgress(`Adding why-comments (${aiGenerator.getModel()})…`, async () => {
        const result = await aiGenerator.generateWhyComments(code, languageId);
        await applyResult(editor, selection, result.commentedCode, result.cost, 'why-commented');
    });
}

// ─── Command: Both (Doc + Why) ────────────────────────────────────────────────

async function cmdBothComments(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { vscode.window.showErrorMessage('Poly-Glot: No active editor.'); return; }
    if (!await requireApiKey()) return;

    if (!await hasPro()) {
        await showProGate('Both mode (doc + why comments)');
        return;
    }

    const languageId = editor.document.languageId;
    if (!await isLanguageAllowed(languageId)) {
        await showProGate(`${languageId} language`);
        return;
    }

    const selection = editor.selection;
    const code = editor.document.getText(selection.isEmpty ? undefined : selection);
    if (!code.trim()) { vscode.window.showWarningMessage('Poly-Glot: File is empty.'); return; }

    await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Poly-Glot: Pass 1/2 — doc-comments…', cancellable: false },
        async (progress) => {
            try {
                const docResult = await aiGenerator.generateComments(code, languageId);
                progress.report({ message: 'Pass 2/2 — why-comments…' });
                const whyResult = await aiGenerator.generateWhyComments(docResult.commentedCode, languageId);
                const totalCost = docResult.cost + whyResult.cost;
                await applyResult(editor, selection, whyResult.commentedCode, totalCost, 'fully commented (doc + why)');
            } catch (err: unknown) {
                vscode.window.showErrorMessage(`Poly-Glot: ${err instanceof Error ? err.message : String(err)}`);
            }
        },
    );
}

// ─── Command: Comment Entire Active File ──────────────────────────────────────

async function cmdCommentFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { vscode.window.showErrorMessage('Poly-Glot: No active editor.'); return; }
    await _commentDocument(editor.document, 'comment');
}

// ─── Command: Comment File from Explorer ──────────────────────────────────────

async function cmdCommentFileFromExplorer(uri: vscode.Uri): Promise<void> {
    if (!uri) { vscode.window.showErrorMessage('Poly-Glot: No file selected.'); return; }
    try {
        const doc = await vscode.workspace.openTextDocument(uri);
        await _commentDocument(doc, 'comment');
    } catch (err: unknown) {
        vscode.window.showErrorMessage(`Poly-Glot: Could not open file — ${err instanceof Error ? err.message : String(err)}`);
    }
}

// ─── Command: Why-Comments File from Explorer ─────────────────────────────────

async function cmdWhyFileFromExplorer(uri: vscode.Uri): Promise<void> {
    if (!uri) { vscode.window.showErrorMessage('Poly-Glot: No file selected.'); return; }

    if (!await hasPro()) {
        await showProGate('Why-comments');
        return;
    }

    try {
        const doc = await vscode.workspace.openTextDocument(uri);
        await _commentDocument(doc, 'why');
    } catch (err: unknown) {
        vscode.window.showErrorMessage(`Poly-Glot: Could not open file — ${err instanceof Error ? err.message : String(err)}`);
    }
}

// ─── Shared: Comment a TextDocument ───────────────────────────────────────────

async function _commentDocument(doc: vscode.TextDocument, mode: 'comment' | 'why'): Promise<void> {
    const code = doc.getText();
    if (!code.trim()) { vscode.window.showWarningMessage('Poly-Glot: File is empty.'); return; }
    if (!await requireApiKey()) return;

    const languageId = doc.languageId;
    const fileName   = doc.fileName.split('/').pop() ?? doc.fileName;

    if (!await isLanguageAllowed(languageId)) {
        await showProGate(`${languageId} language`);
        return;
    }

    if (mode === 'why' && !await hasPro()) {
        await showProGate('Why-comments');
        return;
    }

    const label = mode === 'why' ? 'Adding why-comments' : 'Commenting';

    await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: `Poly-Glot: ${label} ${fileName} (${aiGenerator.getModel()})…`, cancellable: false },
        async () => {
            try {
                const result = mode === 'why'
                    ? await aiGenerator.generateWhyComments(code, languageId)
                    : await aiGenerator.generateComments(code, languageId);

                const insertInline = vscode.workspace.getConfiguration('polyglot').get<boolean>('insertInline', true);
                if (insertInline) {
                    const editor = await vscode.window.showTextDocument(doc);
                    await editor.edit(eb => {
                        eb.replace(
                            new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length)),
                            result.commentedCode,
                        );
                    });
                    const modeLabel = mode === 'why' ? 'why-commented' : 'commented';
                    flashStatusBar(`$(check) $${result.cost.toFixed(4)} — ${fileName} ${modeLabel}`);
                    vscode.window.showInformationMessage(`✅ Poly-Glot: ${fileName} ${modeLabel} ($${result.cost.toFixed(4)})`);
                } else {
                    showResultPanel(result.commentedCode, languageId, result.cost);
                }
            } catch (err: unknown) {
                vscode.window.showErrorMessage(`Poly-Glot: ${err instanceof Error ? err.message : String(err)}`);
            }
        },
    );
}

// ─── Command: Explain Code ────────────────────────────────────────────────────

async function cmdExplainCode(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { vscode.window.showErrorMessage('Poly-Glot: No active editor.'); return; }
    if (!await requireApiKey()) return;

    const selection = editor.selection;
    const code = editor.document.getText(selection.isEmpty ? undefined : selection);
    if (!code.trim()) { vscode.window.showWarningMessage('Poly-Glot: Select some code to explain.'); return; }

    const languageId = editor.document.languageId;
    await runWithProgress(`Analyzing code (${aiGenerator.getModel()})…`, async () => {
        const result = await aiGenerator.explainCode(code, languageId);
        flashStatusBar(`$(search) $${result.cost.toFixed(4)} — analysis complete`);
        showExplainPanel(result);
    });
}

// ─── Command: Configure API Key ───────────────────────────────────────────────

async function cmdConfigureApiKey(): Promise<void> {
    const provider = await vscode.window.showQuickPick(
        [
            { label: '$(cloud) OpenAI',    description: 'GPT-4o, GPT-4o-mini, GPT-4 Turbo…',  value: 'openai'    },
            { label: '$(cloud) Anthropic', description: 'Claude Sonnet 4, Claude 3.5 Sonnet…', value: 'anthropic' },
        ],
        { title: 'Poly-Glot: Select AI Provider', placeHolder: 'Choose your provider' },
    );
    if (!provider) return;

    const apiKey = await vscode.window.showInputBox({
        title:       `Poly-Glot: Enter ${provider.value === 'anthropic' ? 'Anthropic' : 'OpenAI'} API Key`,
        prompt:      provider.value === 'anthropic'
            ? 'Get your key at console.anthropic.com/settings/keys'
            : 'Get your key at platform.openai.com/api-keys',
        placeHolder: provider.value === 'anthropic' ? 'sk-ant-…' : 'sk-…',
        password:    true,
        ignoreFocusOut: true,
        validateInput: val => val && val.trim().length > 10 ? null : 'Key must be at least 10 characters',
    });
    if (!apiKey) return;

    await aiGenerator.saveApiKey(apiKey.trim());
    await vscode.workspace.getConfiguration('polyglot').update('provider', provider.value, vscode.ConfigurationTarget.Global);

    const models = aiGenerator.getAvailableModels(provider.value);
    const modelChoice = await vscode.window.showQuickPick(
        models.map(m => ({ label: m.label, description: `${m.cost} cost`, value: m.value })),
        { title: 'Poly-Glot: Select Model', placeHolder: 'Choose a model' },
    );
    if (modelChoice) {
        await vscode.workspace.getConfiguration('polyglot').update('model', modelChoice.value, vscode.ConfigurationTarget.Global);
    }

    vscode.window.showInformationMessage(`✅ Poly-Glot: ${provider.value === 'anthropic' ? 'Anthropic' : 'OpenAI'} configured!`);
}

// ─── Command: Configure License Token ────────────────────────────────────────

async function cmdConfigureLicenseToken(): Promise<void> {
    const current = vscode.workspace.getConfiguration('polyglot').get<string>('licenseToken', '');

    const token = await vscode.window.showInputBox({
        title:          'Poly-Glot: Enter Pro License Token',
        prompt:         'Find your token at poly-glot.ai → Sign In → your account',
        placeHolder:    'Paste your license token here…',
        value:          current,
        password:       true,
        ignoreFocusOut: true,
        validateInput:  val => val && val.trim().length > 10 ? null : 'Token must be at least 10 characters',
    });
    if (token === undefined) return; // dismissed

    const trimmed = token.trim();
    await vscode.workspace.getConfiguration('polyglot').update('licenseToken', trimmed, vscode.ConfigurationTarget.Global);

    // Reset cached plan so it's re-verified on next use
    _cachedPlan = undefined;

    if (!trimmed) {
        vscode.window.showInformationMessage('Poly-Glot: License token cleared. Using Free plan.');
        return;
    }

    // Verify immediately and show result
    await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Poly-Glot: Verifying token…', cancellable: false },
        async () => {
            const plan = await getVerifiedPlan();
            if (plan && PRO_PLANS.includes(plan)) {
                const label = plan.charAt(0).toUpperCase() + plan.slice(1);
                vscode.window.showInformationMessage(`✅ Poly-Glot: ${label} plan activated! All features unlocked.`);
                flashStatusBar(`$(star) Poly-Glot ${label}`, 6000);
            } else {
                vscode.window.showWarningMessage(
                    'Poly-Glot: Token could not be verified. Check your token at poly-glot.ai.',
                    'Open poly-glot.ai',
                ).then(action => {
                    if (action === 'Open poly-glot.ai') vscode.env.openExternal(vscode.Uri.parse('https://poly-glot.ai'));
                });
            }
        },
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function runWithProgress(title: string, fn: () => Promise<void>): Promise<void> {
    await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: `Poly-Glot: ${title}`, cancellable: false },
        async () => {
            try {
                await fn();
            } catch (err: unknown) {
                vscode.window.showErrorMessage(`Poly-Glot: ${err instanceof Error ? err.message : String(err)}`);
            }
        },
    );
}

async function applyResult(
    editor: vscode.TextEditor,
    selection: vscode.Selection,
    commentedCode: string,
    cost: number,
    modeLabel: string,
): Promise<void> {
    const insertInline = vscode.workspace.getConfiguration('polyglot').get<boolean>('insertInline', true);
    const languageId   = editor.document.languageId;

    if (insertInline) {
        await editor.edit(eb => {
            if (selection.isEmpty) {
                eb.replace(
                    new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length)),
                    commentedCode,
                );
            } else {
                eb.replace(selection, commentedCode);
            }
        });
        flashStatusBar(`$(check) $${cost.toFixed(4)} — ${modeLabel}`);
        vscode.window.showInformationMessage(`✅ Poly-Glot: ${modeLabel} ($${cost.toFixed(4)})`);
    } else {
        showResultPanel(commentedCode, languageId, cost);
    }
}

function flashStatusBar(message: string, durationMs = 8000): void {
    statusBarItem.text            = message;
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    setTimeout(() => {
        statusBarItem.text            = '$(comment) Poly-Glot';
        statusBarItem.backgroundColor = undefined;
    }, durationMs);
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ─── Webview: Result Panel ────────────────────────────────────────────────────

function showResultPanel(commentedCode: string, languageId: string, cost: number): void {
    const panel = vscode.window.createWebviewPanel(
        'polyglotResult',
        'Poly-Glot: Commented Code',
        vscode.ViewColumn.Beside,
        { enableScripts: false },
    );
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

function showExplainPanel(result: ExplainResult): void {
    const panel = vscode.window.createWebviewPanel(
        'polyglotExplain',
        'Poly-Glot: Code Analysis',
        vscode.ViewColumn.Beside,
        { enableScripts: false },
    );
    const scoreColor    = result.docQuality.score >= 80 ? '#4ade80' : result.docQuality.score >= 50 ? '#facc15' : '#f87171';
    const cx            = (s: number) => s <= 3 ? '#4ade80' : s <= 6 ? '#facc15' : '#f87171';
    const functionsHtml = result.functions.map(fn =>
        `<tr><td><code>${escapeHtml(fn.name)}</code></td><td>${escapeHtml(fn.purpose)}</td><td>${fn.params.map((p: string) => `<code>${escapeHtml(p)}</code>`).join(', ')}</td><td>${escapeHtml(fn.returns)}</td></tr>`
    ).join('');
    const bugsHtml      = result.potentialBugs.length
        ? result.potentialBugs.map(b => `<li>${escapeHtml(b)}</li>`).join('')
        : '<li style="color:var(--vscode-descriptionForeground)">No obvious bugs detected.</li>';
    const suggestHtml   = result.suggestions.length
        ? result.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')
        : '<li style="color:var(--vscode-descriptionForeground)">No suggestions.</li>';
    const docIssuesHtml = result.docQuality.issues?.length
        ? result.docQuality.issues.map((i: string) => `<li>${escapeHtml(i)}</li>`).join('')
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
            ? `<p style="color:var(--vscode-descriptionForeground);font-size:12px;margin:10px 0 8px">Suggestions:</p><ul>${result.docQuality.suggestions.map((s: string) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
            : ''}
      </div>
    </body></html>`;
}
