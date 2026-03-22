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
let statusBarItem;
let aiGenerator;
// ─── Activation ───────────────────────────────────────────────────────────────
function activate(context) {
    aiGenerator = new ai_generator_1.AIGenerator(context);
    // Status bar
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'polyglot.generateComments';
    statusBarItem.text = '$(comment) Poly-Glot';
    statusBarItem.tooltip = 'Generate AI comments (Cmd+Shift+/)';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    // Sidebar
    const sidebarProvider = new sidebar_1.TemplatesSidebarProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(sidebar_1.TemplatesSidebarProvider.viewType, sidebarProvider));
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('polyglot.generateComments', () => cmdGenerateComments()), vscode.commands.registerCommand('polyglot.explainCode', () => cmdExplainCode()), vscode.commands.registerCommand('polyglot.configureApiKey', () => cmdConfigureApiKey()), vscode.commands.registerCommand('polyglot.openTemplates', () => vscode.commands.executeCommand('polyglot.templatesView.focus')));
}
function deactivate() {
    statusBarItem?.dispose();
}
// ─── Command: Generate Comments ───────────────────────────────────────────────
async function cmdGenerateComments() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('Poly-Glot: No active editor.');
        return;
    }
    const selection = editor.selection;
    const code = editor.document.getText(selection.isEmpty ? undefined : selection);
    if (!code.trim()) {
        vscode.window.showWarningMessage('Poly-Glot: Select some code first (or open a file).');
        return;
    }
    if (!(await aiGenerator.isConfigured())) {
        const action = await vscode.window.showErrorMessage('Poly-Glot: API key not configured.', 'Configure Now');
        if (action === 'Configure Now') {
            vscode.commands.executeCommand('polyglot.configureApiKey');
        }
        return;
    }
    const languageId = editor.document.languageId;
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Poly-Glot: Generating comments (${aiGenerator.getModel()})…`,
        cancellable: false,
    }, async () => {
        try {
            const result = await aiGenerator.generateComments(code, languageId);
            const insertInline = vscode.workspace
                .getConfiguration('polyglot')
                .get('insertInline', true);
            if (insertInline) {
                await editor.edit(editBuilder => {
                    if (selection.isEmpty) {
                        const fullRange = new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length));
                        editBuilder.replace(fullRange, result.commentedCode);
                    }
                    else {
                        editBuilder.replace(selection, result.commentedCode);
                    }
                });
                flashStatusBar(`$(check) $${result.cost.toFixed(4)} — comments inserted`);
            }
            else {
                // Show in a side panel instead
                showResultPanel(result.commentedCode, languageId, result.cost);
            }
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`Poly-Glot: ${msg}`);
        }
    });
}
// ─── Command: Explain Code ────────────────────────────────────────────────────
async function cmdExplainCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('Poly-Glot: No active editor.');
        return;
    }
    const selection = editor.selection;
    const code = editor.document.getText(selection.isEmpty ? undefined : selection);
    if (!code.trim()) {
        vscode.window.showWarningMessage('Poly-Glot: Select some code to explain.');
        return;
    }
    if (!(await aiGenerator.isConfigured())) {
        const action = await vscode.window.showErrorMessage('Poly-Glot: API key not configured.', 'Configure Now');
        if (action === 'Configure Now') {
            vscode.commands.executeCommand('polyglot.configureApiKey');
        }
        return;
    }
    const languageId = editor.document.languageId;
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Poly-Glot: Analyzing code (${aiGenerator.getModel()})…`,
        cancellable: false,
    }, async () => {
        try {
            const result = await aiGenerator.explainCode(code, languageId);
            flashStatusBar(`$(search) $${result.cost.toFixed(4)} — analysis complete`);
            showExplainPanel(result);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`Poly-Glot: ${msg}`);
        }
    });
}
// ─── Command: Configure API Key ───────────────────────────────────────────────
async function cmdConfigureApiKey() {
    const provider = await vscode.window.showQuickPick([
        { label: '$(cloud) OpenAI', description: 'GPT-4o, GPT-4o-mini, GPT-4 Turbo…', value: 'openai' },
        { label: '$(cloud) Anthropic', description: 'Claude 3.5 Sonnet, Claude 3 Opus…', value: 'anthropic' },
    ], { title: 'Poly-Glot: Select AI Provider', placeHolder: 'Choose your provider' });
    if (!provider)
        return;
    const keyPlaceholder = provider.value === 'anthropic' ? 'sk-ant-…' : 'sk-…';
    const keyHint = provider.value === 'anthropic'
        ? 'Get your key at console.anthropic.com/settings/keys'
        : 'Get your key at platform.openai.com/api-keys';
    const apiKey = await vscode.window.showInputBox({
        title: `Poly-Glot: Enter ${provider.value === 'anthropic' ? 'Anthropic' : 'OpenAI'} API Key`,
        prompt: keyHint,
        placeHolder: keyPlaceholder,
        password: true,
        ignoreFocusOut: true,
        validateInput: val => val && val.trim().length > 10 ? null : 'Key must be at least 10 characters',
    });
    if (!apiKey)
        return;
    await aiGenerator.saveApiKey(apiKey.trim());
    // Also update the provider setting
    await vscode.workspace
        .getConfiguration('polyglot')
        .update('provider', provider.value, vscode.ConfigurationTarget.Global);
    // Pick model
    const models = aiGenerator.getAvailableModels(provider.value);
    const modelChoice = await vscode.window.showQuickPick(models.map(m => ({ label: m.label, description: `${m.cost} cost`, value: m.value })), { title: 'Poly-Glot: Select Model', placeHolder: 'Choose a model' });
    if (modelChoice) {
        await vscode.workspace
            .getConfiguration('polyglot')
            .update('model', modelChoice.value, vscode.ConfigurationTarget.Global);
    }
    vscode.window.showInformationMessage(`✅ Poly-Glot: ${provider.value === 'anthropic' ? 'Anthropic' : 'OpenAI'} configured!`);
}
// ─── Webview: Result Panel (commented code) ───────────────────────────────────
function showResultPanel(commentedCode, languageId, cost) {
    const panel = vscode.window.createWebviewPanel('polyglot.result', 'Poly-Glot — Generated Comments', vscode.ViewColumn.Beside, { enableScripts: false });
    const escaped = escapeHtml(commentedCode);
    panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Comments</title>
  <style>
    body { font-family: var(--vscode-editor-font-family); font-size: 13px; padding: 16px;
           background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
    .meta { color: var(--vscode-descriptionForeground); font-size: 12px; margin-bottom: 12px; }
    pre { white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body>
  <div class="meta">Language: <strong>${escapeHtml(languageId)}</strong> &nbsp;|&nbsp; Cost: <strong>$${cost.toFixed(5)}</strong></div>
  <pre>${escaped}</pre>
</body>
</html>`;
}
// ─── Webview: Explain Panel ───────────────────────────────────────────────────
function showExplainPanel(result) {
    const panel = vscode.window.createWebviewPanel('polyglot.explain', 'Poly-Glot — Code Analysis', vscode.ViewColumn.Beside, { enableScripts: false });
    const scoreColor = result.docQuality.score >= 70
        ? '#4ade80' : result.docQuality.score >= 40 ? '#facc15' : '#f87171';
    const complexityColor = (score) => {
        if (score <= 3)
            return '#4ade80';
        if (score <= 6)
            return '#facc15';
        return '#f87171';
    };
    const functionsHtml = result.functions.length
        ? result.functions.map(fn => `
            <tr>
              <td><code>${escapeHtml(fn.name)}</code></td>
              <td>${escapeHtml(fn.purpose)}</td>
              <td>${fn.params.map(p => `<code>${escapeHtml(p)}</code>`).join(', ') || '—'}</td>
              <td>${escapeHtml(fn.returns || '—')}</td>
            </tr>`).join('')
        : '<tr><td colspan="4" style="color:#888;font-style:italic">No functions detected</td></tr>';
    const bugsHtml = result.potentialBugs.length
        ? result.potentialBugs.map(b => `<li>${escapeHtml(b)}</li>`).join('')
        : '<li style="color:#4ade80">No obvious bugs detected 🎉</li>';
    const suggestionsHtml = result.suggestions.length
        ? result.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')
        : '<li style="color:#888">No suggestions</li>';
    const docIssuesHtml = result.docQuality.issues.length
        ? result.docQuality.issues.map(i => `<li>${escapeHtml(i)}</li>`).join('')
        : '<li style="color:#4ade80">No issues found</li>';
    panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Analysis</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: var(--vscode-font-family, sans-serif); font-size: 13px;
           padding: 20px; background: var(--vscode-editor-background);
           color: var(--vscode-editor-foreground); line-height: 1.6; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    h2 { font-size: 14px; margin: 20px 0 8px; color: var(--vscode-sideBarTitle-foreground, #ccc); }
    .meta { color: var(--vscode-descriptionForeground); font-size: 12px; margin-bottom: 20px; }
    .cards { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 10px; }
    .card {
      flex: 1; min-width: 140px; padding: 14px 16px; border-radius: 8px;
      background: var(--vscode-sideBar-background, #252526);
      border: 1px solid var(--vscode-widget-border, #3c3c3c);
    }
    .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em;
                  color: var(--vscode-descriptionForeground); margin-bottom: 4px; }
    .card-value { font-size: 22px; font-weight: 700; }
    .section { margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--vscode-widget-border, #3c3c3c);
         color: var(--vscode-descriptionForeground); font-weight: 600; }
    td { padding: 6px 8px; border-bottom: 1px solid var(--vscode-widget-border, #2a2a2a); vertical-align: top; }
    tr:hover td { background: var(--vscode-list-hoverBackground); }
    code { font-family: var(--vscode-editor-font-family, monospace); font-size: 11.5px;
           background: var(--vscode-textCodeBlock-background, #1e1e1e); padding: 1px 4px; border-radius: 3px; }
    ul { margin: 0; padding-left: 18px; }
    li { margin-bottom: 4px; }
    .score-bar-wrap { background: #2a2a2a; border-radius: 99px; height: 8px; margin-top: 6px; width: 100%; }
    .score-bar { height: 8px; border-radius: 99px; transition: width .3s; }
  </style>
</head>
<body>
  <h1>🔍 Code Analysis</h1>
  <div class="meta">Model: <strong>${escapeHtml(result.model)}</strong> &nbsp;|&nbsp; Language: <strong>${escapeHtml(result.language)}</strong> &nbsp;|&nbsp; Cost: <strong>$${result.cost.toFixed(5)}</strong></div>

  <div class="cards">
    <div class="card">
      <div class="card-label">Complexity</div>
      <div class="card-value" style="color:${complexityColor(result.complexityScore)}">${escapeHtml(result.complexity)}</div>
      <div style="font-size:12px;color:#888;margin-top:2px">Score: ${result.complexityScore}/10</div>
      <div class="score-bar-wrap"><div class="score-bar" style="width:${result.complexityScore * 10}%;background:${complexityColor(result.complexityScore)}"></div></div>
    </div>
    <div class="card">
      <div class="card-label">Doc Quality</div>
      <div class="card-value" style="color:${scoreColor}">${result.docQuality.label}</div>
      <div style="font-size:12px;color:#888;margin-top:2px">Score: ${result.docQuality.score}/100</div>
      <div class="score-bar-wrap"><div class="score-bar" style="width:${result.docQuality.score}%;background:${scoreColor}"></div></div>
    </div>
    <div class="card">
      <div class="card-label">Functions</div>
      <div class="card-value">${result.functions.length}</div>
    </div>
    <div class="card">
      <div class="card-label">Potential Bugs</div>
      <div class="card-value" style="color:${result.potentialBugs.length ? '#f87171' : '#4ade80'}">${result.potentialBugs.length}</div>
    </div>
  </div>

  <div class="section">
    <h2>📖 Summary</h2>
    <p>${escapeHtml(result.summary)}</p>
  </div>

  <div class="section">
    <h2>⚙️ Functions & Methods</h2>
    <table>
      <thead><tr><th>Name</th><th>Purpose</th><th>Parameters</th><th>Returns</th></tr></thead>
      <tbody>${functionsHtml}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>🐛 Potential Bugs</h2>
    <ul>${bugsHtml}</ul>
  </div>

  <div class="section">
    <h2>💡 Suggestions</h2>
    <ul>${suggestionsHtml}</ul>
  </div>

  <div class="section">
    <h2>📝 Documentation Quality — ${result.docQuality.label} (${result.docQuality.score}/100)</h2>
    <p style="color:var(--vscode-descriptionForeground);font-size:12px;margin-bottom:8px">Issues found:</p>
    <ul>${docIssuesHtml}</ul>
    ${result.docQuality.suggestions.length ? `
      <p style="color:var(--vscode-descriptionForeground);font-size:12px;margin:10px 0 8px">Suggestions:</p>
      <ul>${result.docQuality.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>` : ''}
  </div>
</body>
</html>`;
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function flashStatusBar(message, durationMs = 8000) {
    statusBarItem.text = message;
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    setTimeout(() => {
        statusBarItem.text = '$(comment) Poly-Glot';
        statusBarItem.backgroundColor = undefined;
    }, durationMs);
}
//# sourceMappingURL=extension.js.map