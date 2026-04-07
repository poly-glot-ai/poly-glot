import * as vscode from 'vscode';

const PROMPT_STUDIO_URL = 'https://poly-glot.ai/prompt/';
const AUTH_API          = 'https://poly-glot.ai/api/auth';
const UPGRADE_URL       = 'https://buy.stripe.com/fZu14pbtacrO9Ii77K14405';

// ─── Templates (21 total: 13 free, 8 pro) ─────────────────────────────────────
interface Template {
  name: string;
  desc: string;
  plan: 'free' | 'pro';
  vars: Record<string, string>;
  tpl: string;
}

const TEMPLATES: Template[] = [
  { plan:'free', name:'💻 Code Review Assistant',    desc:'Structured code review with specific focus areas',
    vars:{ language:'TypeScript', focus:'performance, security', code:'// paste your code here' },
    tpl:`You are an expert {{language}} developer. Review the following code for {{focus}}.\n\nCode:\n\`\`\`\n{{code}}\n\`\`\`\n\nProvide:\n1. Summary of issues found\n2. Specific line-by-line feedback\n3. Refactored version with improvements\n4. Best practices recommendations` },

  { plan:'free', name:'✍️ Blog Post Writer',          desc:'SEO-optimised blog posts with clear structure',
    vars:{ topic:'AI productivity tools', audience:'developers', tone:'informative and engaging', length:'1000 words' },
    tpl:`Write a {{length}} blog post about {{topic}} for {{audience}}.\n\nTone: {{tone}}\n\nStructure:\n- Compelling headline\n- Hook introduction (2-3 sentences)\n- 3-5 main sections with subheadings\n- Actionable takeaways\n- Strong conclusion with CTA\n\nInclude relevant examples and make it SEO-friendly.` },

  { plan:'free', name:'📧 Email Drafter',             desc:'Professional emails for any business context',
    vars:{ purpose:'follow up on a proposal', recipient:'potential client', tone:'professional', context:'we met at a conference last week' },
    tpl:`Write a professional email to {{recipient}}.\n\nPurpose: {{purpose}}\nContext: {{context}}\nTone: {{tone}}\n\nRequirements:\n- Subject line\n- Brief, clear body (under 150 words)\n- Specific call to action\n- Professional sign-off` },

  { plan:'free', name:'📋 Meeting Summary',           desc:'Structured meeting notes and action items',
    vars:{ meeting_type:'product planning', attendees:'engineering team', duration:'60 minutes', notes:'// paste raw notes here' },
    tpl:`Summarise this {{duration}} {{meeting_type}} meeting attended by {{attendees}}.\n\nRaw notes:\n{{notes}}\n\nFormat the output as:\n## Meeting Summary\n[2-3 sentence overview]\n\n## Key Decisions\n[bullet list]\n\n## Action Items\n[name — task — due date]\n\n## Next Steps\n[follow-up items]` },

  { plan:'free', name:'📄 Job Description Writer',    desc:'Compelling JDs that attract top candidates',
    vars:{ role:'Senior Software Engineer', company:'a fast-growing startup', requirements:'5+ years TypeScript, React, Node.js', salary:'$150k-$180k' },
    tpl:`Write a compelling job description for a {{role}} at {{company}}.\n\nRequirements: {{requirements}}\nCompensation: {{salary}}\n\nInclude:\n- Role overview (2-3 sentences)\n- What you'll do (5-7 bullets)\n- What we're looking for (5-7 bullets)\n- What we offer (benefits, culture)\n- How to apply` },

  { plan:'free', name:'📢 LinkedIn Post Generator',   desc:'Engaging LinkedIn content that drives engagement',
    vars:{ topic:'launching a new product', tone:'excited and professional', hook:'surprising insight or stat', cta:'follow for more' },
    tpl:`Write a LinkedIn post about {{topic}}.\n\nTone: {{tone}}\nOpen with: {{hook}}\nEnd with: {{cta}}\n\nFormat:\n- Strong first line (no "I am excited to announce")\n- 3-5 short paragraphs\n- Line breaks for readability\n- 3-5 relevant hashtags\n- Under 300 words` },

  { plan:'free', name:'🐛 Bug Report Writer',         desc:'Clear, reproducible bug reports for dev teams',
    vars:{ bug_summary:'button not responding on mobile', environment:'iOS 17, Safari', steps:'1. Open app 2. Tap button', expected:'modal opens', actual:'nothing happens' },
    tpl:`Write a clear bug report.\n\n**Summary:** {{bug_summary}}\n**Environment:** {{environment}}\n\n**Steps to Reproduce:**\n{{steps}}\n\n**Expected Behaviour:** {{expected}}\n**Actual Behaviour:** {{actual}}\n\nInclude:\n- Severity assessment (critical/high/medium/low)\n- Suggested investigation areas\n- Any relevant logs or screenshots to request` },

  { plan:'free', name:'📖 API Documentation',         desc:'Developer-friendly API endpoint documentation',
    vars:{ endpoint:'POST /api/auth/login', purpose:'authenticate a user via magic link', params:'email: string', response:'{ ok: boolean }' },
    tpl:`Write developer documentation for this API endpoint.\n\n**Endpoint:** {{endpoint}}\n**Purpose:** {{purpose}}\n**Parameters:** {{params}}\n**Response:** {{response}}\n\nDocument:\n- Overview\n- Request format (with example)\n- Response format (success + error)\n- Code examples (curl + JavaScript)\n- Rate limits and error codes` },

  { plan:'free', name:'📝 User Story Writer',         desc:'Agile user stories with acceptance criteria',
    vars:{ feature:'password reset flow', persona:'registered user', goal:'regain account access', context:'forgot password' },
    tpl:`Write an agile user story for: {{feature}}\n\n**As a** {{persona}}\n**I want to** {{goal}}\n**So that** I can resolve the situation when {{context}}\n\nWrite:\n1. User story (As a / I want / So that format)\n2. Acceptance criteria (5-8 Given/When/Then)\n3. Definition of Done\n4. Story points estimate with reasoning\n5. Edge cases to consider` },

  { plan:'free', name:'🔍 SWOT Analysis',             desc:'Strategic SWOT analysis for any business or product',
    vars:{ subject:'a SaaS productivity app', industry:'B2B software', competitors:'Notion, Linear, Asana', target_market:'remote teams' },
    tpl:`Conduct a thorough SWOT analysis for {{subject}} in the {{industry}} industry.\n\nContext:\n- Competitors: {{competitors}}\n- Target market: {{target_market}}\n\nFormat:\n## Strengths\n[4-6 internal advantages]\n\n## Weaknesses\n[4-6 internal limitations]\n\n## Opportunities\n[4-6 external growth areas]\n\n## Threats\n[4-6 external risks]\n\n## Strategic Recommendations\n[3 actionable strategies based on SWOT]` },

  { plan:'free', name:'🎯 Cold Email Outreach',       desc:'High-converting cold emails that get replies',
    vars:{ prospect_company:'Acme Corp', pain_point:'manual reporting taking hours each week', solution:'automated analytics dashboard', sender:'Alex from DataFlow' },
    tpl:`Write a cold outreach email from {{sender}} to {{prospect_company}}.\n\nPain point: {{pain_point}}\nSolution: {{solution}}\n\nRequirements:\n- Subject line with <30% open rate bait\n- First line references something specific about their company\n- Pain → Solution → Proof structure\n- Single, low-friction CTA\n- Under 120 words\n- No buzzwords or "hope this email finds you well"` },

  { plan:'free', name:'📊 Product Requirements Doc',  desc:'Comprehensive PRD for product and engineering teams',
    vars:{ product:'mobile app feature', problem:'users lose track of tasks', solution:'smart notification system', stakeholders:'PM, Engineering, Design' },
    tpl:`Write a Product Requirements Document for {{product}}.\n\nProblem: {{problem}}\nProposed solution: {{solution}}\nStakeholders: {{stakeholders}}\n\nInclude:\n## Overview\n## Problem Statement\n## Goals & Success Metrics\n## User Stories\n## Functional Requirements\n## Non-Functional Requirements\n## Out of Scope\n## Timeline & Milestones\n## Open Questions` },

  { plan:'free', name:'🏆 Competitor Analysis',       desc:'In-depth competitive analysis framework',
    vars:{ your_product:'project management tool', competitors:'Asana, Monday.com, Linear', differentiator:'AI-powered task prioritisation', target_segment:'engineering teams' },
    tpl:`Write a competitor analysis for {{your_product}} vs {{competitors}}.\n\nOur differentiator: {{differentiator}}\nTarget segment: {{target_segment}}\n\nFor each competitor analyse:\n- Core features\n- Pricing model\n- Target customer\n- Strengths vs us\n- Weaknesses vs us\n\nConclude with:\n- Our positioning recommendation\n- Top 3 battlecard talking points\n- Gaps we should fill` },

  // ── PRO TEMPLATES ──────────────────────────────────────────────────────────
  { plan:'pro',  name:'⚖️ Legal Contract Reviewer',   desc:'Risk identification in contracts and agreements',
    vars:{ contract_type:'SaaS subscription agreement', party:'vendor', focus:'liability, termination, IP ownership', jurisdiction:'US' },
    tpl:`Review this {{contract_type}} from the perspective of the {{party}} under {{jurisdiction}} law.\n\nFocus on: {{focus}}\n\n[PASTE CONTRACT TEXT HERE]\n\nProvide:\n1. Executive summary (3 sentences)\n2. High-risk clauses with line references\n3. Missing standard protections\n4. Negotiation recommendations for each risk\n5. Overall risk rating (Low/Medium/High)` },

  { plan:'pro',  name:'💰 Financial Analysis',        desc:'Structured financial analysis and forecasting',
    vars:{ analysis_type:'SaaS revenue forecast', period:'Q2 2026', metrics:'MRR, churn, LTV, CAC', data:'// paste financial data here' },
    tpl:`Conduct a {{analysis_type}} for {{period}}.\n\nKey metrics to analyse: {{metrics}}\n\nData:\n{{data}}\n\nProvide:\n1. Executive summary\n2. Trend analysis with % changes\n3. Key drivers and headwinds\n4. 3-scenario forecast (bear/base/bull)\n5. Recommendations and risk factors` },

  { plan:'pro',  name:'🏥 Medical Case Summary',      desc:'Structured clinical case documentation',
    vars:{ case_type:'outpatient consultation', specialty:'cardiology', presenting_complaint:'chest pain on exertion', notes:'// paste clinical notes here' },
    tpl:`Summarise this {{case_type}} in {{specialty}}.\n\nPresenting complaint: {{presenting_complaint}}\n\nClinical notes:\n{{notes}}\n\nFormat:\n## Chief Complaint\n## History of Present Illness\n## Relevant Past History\n## Examination Findings\n## Assessment & Differential\n## Plan\n\n*For clinical documentation purposes only. Always verify with qualified medical professional.*` },

  { plan:'pro',  name:'🔒 Security Audit',            desc:'Security vulnerability assessment and remediation',
    vars:{ target:'REST API endpoints', scope:'authentication and authorisation', stack:'Node.js, JWT, PostgreSQL', code:'// paste code or architecture description' },
    tpl:`Conduct a security audit of {{target}}.\n\nScope: {{scope}}\nStack: {{stack}}\n\nCode/Architecture:\n{{code}}\n\nAssess for:\n1. Authentication vulnerabilities (OWASP Top 10)\n2. Authorisation flaws\n3. Input validation issues\n4. Data exposure risks\n5. Dependency vulnerabilities\n\nFor each finding:\n- Severity (Critical/High/Medium/Low)\n- Description\n- Proof of concept\n- Remediation steps` },

  { plan:'pro',  name:'🎬 YouTube Script Writer',     desc:'Engaging YouTube scripts with strong hooks',
    vars:{ topic:'how to build a SaaS in 30 days', duration:'10 minutes', audience:'indie hackers', style:'educational and entertaining' },
    tpl:`Write a {{duration}} YouTube script about {{topic}} for {{audience}}.\n\nStyle: {{style}}\n\nStructure:\n[HOOK - 30 seconds]\nOpen with a surprising statement or question\n\n[INTRO - 1 minute]\nWho this is for + what they'll learn\n\n[MAIN CONTENT - 7 minutes]\n3-4 main sections with clear transitions\n\n[CTA - 30 seconds]\nSubscribe ask + next video tease\n\nInclude: B-roll suggestions, on-screen text callouts, chapter timestamps` },

  { plan:'pro',  name:'🏗️ System Design Doc',         desc:'Comprehensive system design for engineering teams',
    vars:{ system:'real-time notification service', scale:'1M users', requirements:'low latency, high availability', constraints:'budget: AWS, timeline: 3 months' },
    tpl:`Design a {{system}} at {{scale}} scale.\n\nRequirements: {{requirements}}\nConstraints: {{constraints}}\n\nDocument:\n## Requirements (Functional + Non-Functional)\n## Capacity Estimation\n## High-Level Architecture\n## Component Deep Dive\n## Data Model\n## API Design\n## Scalability & Bottlenecks\n## Failure Modes & Mitigations\n## Monitoring & Alerting\n## Trade-offs & Alternatives Considered` },

  { plan:'pro',  name:'📈 Performance Review',        desc:'Structured employee performance review writing',
    vars:{ employee_role:'Senior Engineer', review_period:'H1 2026', achievements:'shipped auth system, mentored 2 juniors', areas_to_improve:'communication in cross-team meetings' },
    tpl:`Write a performance review for a {{employee_role}} for {{review_period}}.\n\nAchievements: {{achievements}}\nDevelopment areas: {{areas_to_improve}}\n\nInclude:\n## Overall Performance Summary\n## Key Achievements (with impact)\n## Technical Skills Assessment\n## Collaboration & Communication\n## Areas for Development (constructive, specific)\n## Goals for Next Period (3-5 SMART goals)\n## Overall Rating Recommendation` },

  { plan:'pro',  name:'🎯 Sales Deck Narrative',      desc:'Compelling sales deck story and talking points',
    vars:{ product:'B2B analytics platform', prospect:'enterprise retail company', pain:'manual inventory forecasting costing $2M/yr', proof:'reduced forecast error by 40% for similar client' },
    tpl:`Write a sales deck narrative for {{product}} pitched to {{prospect}}.\n\nPain: {{pain}}\nProof: {{proof}}\n\nCreate talking points for:\n1. Opening hook (the "so what" moment)\n2. Problem slide (make them feel the pain)\n3. Solution slide (your approach, not features)\n4. Demo flow narrative\n5. Proof/social proof slide\n6. ROI calculation framework\n7. Objection handling (top 3)\n8. Close and next steps` },
];

// ─── Webview HTML ─────────────────────────────────────────────────────────────
function getSidebarHtml(webview: vscode.Webview, extensionUri: vscode.Uri, plan: string, token: string): string {
  const nonce = getNonce();
  const freeTpl  = TEMPLATES.filter(t => t.plan === 'free');
  const proTpl   = TEMPLATES.filter(t => t.plan === 'pro');
  const isPro    = plan === 'pro' || plan === 'team' || plan === 'enterprise';

  const renderCard = (t: Template, locked: boolean) => `
    <div class="tpl-card ${locked ? 'locked' : ''}" data-name="${escHtml(t.name)}" onclick="pickTemplate('${escHtml(t.name)}')">
      <div class="tpl-name">${escHtml(t.name)}</div>
      <div class="tpl-desc">${escHtml(t.desc)}</div>
      ${locked ? '<div class="tpl-lock">💎 Pro</div>' : ''}
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style nonce="${nonce}">
  :root {
    --bg:      var(--vscode-sideBar-background, #0a0b14);
    --bg2:     var(--vscode-editor-background, #13141f);
    --border:  var(--vscode-panel-border, rgba(255,255,255,.08));
    --text:    var(--vscode-foreground, #e2e8f0);
    --muted:   var(--vscode-descriptionForeground, #64748b);
    --accent:  var(--vscode-textLink-foreground, #7dd3fc);
    --purple:  #a78bfa;
    --green:   #34d399;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: var(--vscode-font-family, system-ui); font-size: 12px; padding: 8px; }

  .header { padding: 8px 4px 12px; border-bottom: 1px solid var(--border); margin-bottom: 10px; }
  .header h1 { font-size: 13px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 6px; }
  .header p  { font-size: 11px; color: var(--muted); margin-top: 4px; line-height: 1.4; }

  .plan-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700;
    padding: 2px 8px; border-radius: 10px; margin-top: 6px; }
  .plan-badge.free { background: rgba(100,116,139,.2); color: var(--muted); }
  .plan-badge.pro  { background: rgba(167,139,250,.15); color: var(--purple); }

  .section-label { font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
    color: var(--muted); margin: 12px 4px 6px; display: flex; align-items: center; gap: 6px; }
  .section-label::after { content:''; flex:1; height:1px; background:var(--border); }

  .tpl-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 6px;
    padding: 8px 10px; margin-bottom: 6px; cursor: pointer; transition: border-color .15s; position: relative; }
  .tpl-card:hover:not(.locked) { border-color: var(--accent); }
  .tpl-card.locked { opacity: .55; cursor: default; }
  .tpl-card.locked:hover { border-color: var(--border); }
  .tpl-name { font-size: 12px; font-weight: 600; color: var(--text); }
  .tpl-desc { font-size: 10px; color: var(--muted); margin-top: 2px; line-height: 1.3; }
  .tpl-lock { position: absolute; top: 6px; right: 8px; font-size: 9px; font-weight: 700;
    color: var(--purple); background: rgba(167,139,250,.12); padding: 1px 5px; border-radius: 4px; }

  .btn { display: block; width: 100%; padding: 7px 12px; border-radius: 6px; border: none;
    font-size: 12px; font-weight: 600; cursor: pointer; text-align: center; margin-bottom: 6px; transition: opacity .15s; }
  .btn:hover { opacity: .85; }
  .btn-primary { background: linear-gradient(135deg,#7c3aed,#4f46e5); color: #fff; }
  .btn-secondary { background: var(--bg2); border: 1px solid var(--border); color: var(--accent); }
  .btn-upgrade { background: linear-gradient(135deg,#f59e0b,#d97706); color: #000; }

  .search { width: 100%; background: var(--bg2); border: 1px solid var(--border); border-radius: 6px;
    padding: 6px 10px; color: var(--text); font-size: 12px; margin-bottom: 8px; outline: none; }
  .search:focus { border-color: var(--accent); }

  #viewer { display: none; }
  .viewer-name { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
  .var-row { margin-bottom: 6px; }
  .var-label { font-size: 10px; color: var(--muted); margin-bottom: 2px; text-transform: uppercase; letter-spacing: .05em; }
  .var-input { width: 100%; background: var(--bg2); border: 1px solid var(--border); border-radius: 4px;
    padding: 5px 8px; color: var(--text); font-size: 11px; font-family: monospace; resize: vertical; outline: none; }
  .var-input:focus { border-color: var(--accent); }
  .rendered-label { font-size: 10px; color: var(--muted); margin: 10px 0 4px; text-transform: uppercase; letter-spacing: .05em; }
  .rendered { background: var(--bg2); border: 1px solid var(--border); border-radius: 4px;
    padding: 8px 10px; font-size: 11px; font-family: monospace; line-height: 1.6;
    white-space: pre-wrap; word-break: break-word; max-height: 220px; overflow-y: auto; color: #a5f3fc; }
  .copy-ok { color: var(--green); font-size: 11px; margin-top: 4px; display: none; }
</style>
</head>
<body>

<div id="list">
  <div class="header">
    <h1>🦜 Prompt Studio</h1>
    <p>Pick a template, fill in variables, copy the rendered prompt.</p>
    <div class="plan-badge ${isPro ? 'pro' : 'free'}">${isPro ? '💎 Pro' : '🆓 Free'}</div>
  </div>

  ${!token ? `<button class="btn btn-primary" onclick="signIn()">🚀 Sign In to Prompt Studio</button>` : ''}
  ${isPro ? '' : `<button class="btn btn-upgrade" onclick="upgrade()">💎 Upgrade to Pro — Unlock All 21</button>`}
  <button class="btn btn-secondary" onclick="openWeb()">🌐 Open in Browser</button>

  <input class="search" id="search" placeholder="Search templates…" oninput="filterTemplates(this.value)">

  <div class="section-label">✅ Free Templates (${freeTpl.length})</div>
  <div id="freeList">
    ${freeTpl.map(t => renderCard(t, false)).join('')}
  </div>

  <div class="section-label">💎 Pro Templates (${proTpl.length})</div>
  <div id="proList">
    ${proTpl.map(t => renderCard(t, !isPro)).join('')}
  </div>
</div>

<div id="viewer">
  <button class="btn btn-secondary" onclick="backToList()" style="margin-bottom:10px;">← Back</button>
  <div class="viewer-name" id="viewerName"></div>
  <div id="varFields"></div>
  <div class="rendered-label">Rendered Prompt</div>
  <div class="rendered" id="renderedOutput"></div>
  <div class="copy-ok" id="copyOk">✅ Copied to clipboard!</div>
  <button class="btn btn-primary" onclick="copyPrompt()" style="margin-top:8px;">📋 Copy Prompt</button>
  <button class="btn btn-secondary" onclick="insertPrompt()" style="margin-top:4px;">⬇️ Insert at Cursor</button>
</div>

<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
const TEMPLATES = ${JSON.stringify(TEMPLATES)};
let activeTpl = null;

function pickTemplate(name) {
  const tpl = TEMPLATES.find(t => t.name === name);
  if (!tpl) return;
  const isPro = ${isPro};
  if (tpl.plan === 'pro' && !isPro) {
    vscode.postMessage({ type: 'upgrade' });
    return;
  }
  activeTpl = tpl;
  document.getElementById('list').style.display = 'none';
  document.getElementById('viewer').style.display = 'block';
  document.getElementById('viewerName').textContent = tpl.name;
  const varFields = document.getElementById('varFields');
  varFields.innerHTML = Object.keys(tpl.vars).map(k => \`
    <div class="var-row">
      <div class="var-label">\${k.replace(/_/g,' ')}</div>
      <textarea class="var-input" id="var_\${k}" rows="2" oninput="renderPrompt()">\${tpl.vars[k]}</textarea>
    </div>\`).join('');
  renderPrompt();
}

function renderPrompt() {
  if (!activeTpl) return;
  let out = activeTpl.tpl;
  Object.keys(activeTpl.vars).forEach(k => {
    const el = document.getElementById('var_' + k);
    const val = el ? (el.value.trim() || activeTpl.vars[k]) : ('{{' + k + '}}');
    out = out.replace(new RegExp('{{' + k + '}}', 'g'), val);
  });
  document.getElementById('renderedOutput').textContent = out;
}

function copyPrompt() {
  const text = document.getElementById('renderedOutput').textContent;
  vscode.postMessage({ type: 'copy', text });
  const ok = document.getElementById('copyOk');
  ok.style.display = 'block';
  setTimeout(() => { ok.style.display = 'none'; }, 2000);
}

function insertPrompt() {
  const text = document.getElementById('renderedOutput').textContent;
  vscode.postMessage({ type: 'insert', text });
}

function backToList() {
  document.getElementById('list').style.display = 'block';
  document.getElementById('viewer').style.display = 'none';
  activeTpl = null;
}

function filterTemplates(q) {
  const lq = q.toLowerCase();
  document.querySelectorAll('.tpl-card').forEach(el => {
    const name = el.querySelector('.tpl-name').textContent.toLowerCase();
    const desc = el.querySelector('.tpl-desc').textContent.toLowerCase();
    el.style.display = (name.includes(lq) || desc.includes(lq)) ? '' : 'none';
  });
}

function signIn()   { vscode.postMessage({ type: 'signIn' }); }
function upgrade()  { vscode.postMessage({ type: 'upgrade' }); }
function openWeb()  { vscode.postMessage({ type: 'openWeb' }); }

window.addEventListener('message', e => {
  if (e.data.type === 'planUpdate') {
    // reload sidebar with updated plan
    vscode.postMessage({ type: 'reload' });
  }
});
</script>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

// ─── Sidebar Provider ─────────────────────────────────────────────────────────
class PromptStudioSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'promptStudio.sidebar';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true, localResourceRoots: [this._extensionUri] };
    this._refreshView();

    webviewView.webview.onDidReceiveMessage(async msg => {
      switch (msg.type) {
        case 'copy':
          await vscode.env.clipboard.writeText(msg.text);
          vscode.window.showInformationMessage('✅ Prompt copied to clipboard!');
          break;
        case 'insert':
          await insertTextAtCursor(msg.text);
          break;
        case 'signIn':
          vscode.env.openExternal(vscode.Uri.parse(PROMPT_STUDIO_URL));
          break;
        case 'upgrade':
          vscode.env.openExternal(vscode.Uri.parse(UPGRADE_URL));
          break;
        case 'openWeb':
          vscode.env.openExternal(vscode.Uri.parse(PROMPT_STUDIO_URL));
          break;
        case 'reload':
          this._refreshView();
          break;
      }
    });
  }

  private _refreshView(): void {
    if (!this._view) return;
    const config = vscode.workspace.getConfiguration('promptStudio');
    const token  = config.get<string>('sessionToken') || '';
    const plan   = getPlanFromToken(token);
    this._view.webview.html = getSidebarHtml(this._view.webview, this._extensionUri, plan, token);
  }

  refresh(): void { this._refreshView(); }
}

// ─── Plan from token (local decode — no network) ──────────────────────────────
function getPlanFromToken(token: string): string {
  // Token is opaque — we just check if it's set and trust the sidebar state
  // Real plan verification happens server-side when prompts are run
  if (!token) return 'free';
  // Pro tokens start with pgp_ (Prompt Studio Pro)
  if (token.startsWith('pgp_pro') || token.startsWith('pgp_team')) return 'pro';
  return 'free';
}

// ─── Insert at cursor ─────────────────────────────────────────────────────────
async function insertTextAtCursor(text: string): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active editor — open a file first.');
    return;
  }
  await editor.edit(editBuilder => {
    const pos = editor.selection.active;
    editBuilder.insert(pos, text);
  });
  vscode.window.showInformationMessage('✅ Prompt inserted at cursor!');
}

// ─── Main panel (full webview) ────────────────────────────────────────────────
function openMainPanel(context: vscode.ExtensionContext): void {
  const panel = vscode.window.createWebviewPanel(
    'promptStudio',
    '🦜 Prompt Studio',
    vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  const config = vscode.workspace.getConfiguration('promptStudio');
  const token  = config.get<string>('sessionToken') || '';
  const plan   = getPlanFromToken(token);

  panel.webview.html = getSidebarHtml(panel.webview, context.extensionUri, plan, token);

  panel.webview.onDidReceiveMessage(async msg => {
    switch (msg.type) {
      case 'copy':
        await vscode.env.clipboard.writeText(msg.text);
        vscode.window.showInformationMessage('✅ Prompt copied!');
        break;
      case 'insert':
        await insertTextAtCursor(msg.text);
        panel.dispose();
        break;
      case 'signIn':
      case 'openWeb':
        vscode.env.openExternal(vscode.Uri.parse(PROMPT_STUDIO_URL));
        break;
      case 'upgrade':
        vscode.env.openExternal(vscode.Uri.parse(UPGRADE_URL));
        break;
    }
  });
}

// ─── Activate ─────────────────────────────────────────────────────────────────
export function activate(context: vscode.ExtensionContext): void {
  const sidebarProvider = new PromptStudioSidebarProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(PromptStudioSidebarProvider.viewType, sidebarProvider),

    vscode.commands.registerCommand('promptStudio.open', () => openMainPanel(context)),

    vscode.commands.registerCommand('promptStudio.insertPrompt', async () => {
      // Quick pick from free templates
      const items = TEMPLATES
        .filter(t => t.plan === 'free')
        .map(t => ({ label: t.name, description: t.desc, tpl: t }));
      const pick = await vscode.window.showQuickPick(items, { placeHolder: 'Pick a template to insert…' });
      if (!pick) return;
      // Render with defaults
      let rendered = pick.tpl.tpl;
      for (const [k, v] of Object.entries(pick.tpl.vars)) {
        rendered = rendered.replace(new RegExp(`{{${k}}}`, 'g'), v);
      }
      await insertTextAtCursor(rendered);
    }),

    vscode.commands.registerCommand('promptStudio.newTemplate', () => {
      vscode.env.openExternal(vscode.Uri.parse(PROMPT_STUDIO_URL));
    }),
  );

  // Status bar button
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
  statusBar.text    = '$(notebook-open-as-text) Prompts';
  statusBar.tooltip = 'Poly-Glot Prompt Studio — click to open';
  statusBar.command = 'promptStudio.open';
  statusBar.show();
  context.subscriptions.push(statusBar);
}

export function deactivate(): void {}
