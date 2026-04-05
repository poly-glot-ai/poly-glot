/**
 * Poly-Glot Chat Assistant v4
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes in v4:
 *  1. Send icon — crisp SVG arrow, always visible, correct fill
 *  2. Scroll isolation — chat window captures wheel/touch, body never scrolls
 *  3. Click-to-populate — suggestion click fills textarea, user reviews + sends
 *  4. Auto-scroll on response — messages panel scrolls to bottom after every reply
 *  5. Persistent suggestions — always visible above input, never inside scroll area
 *  6. Single suggestion chip — one random question shown; rotates after each send
 *  7. Branded fallback — styled error message when no answer found
 *
 * Zero external dependencies. Pure vanilla JS.
 */
(function () {
  'use strict';

  // ─── Knowledge base ──────────────────────────────────────────────────────────

  const KNOWLEDGE = `
You are the Poly-Glot AI assistant embedded on poly-glot.ai.
Be friendly, concise, and specific. Use bullet points for lists.
Keep answers under 150 words unless the question genuinely needs more detail.
Only answer questions about Poly-Glot features, pricing, setup, languages, and usage.
If a question is completely unrelated to Poly-Glot, respond ONLY with the exact token: __UNRELATED__

== WHAT IS POLY-GLOT ==
Poly-Glot is an AI-powered code documentation tool. It generates professional comments for code in 12 languages. Runs in the browser, VS Code, CLI, and via MCP. Your API key and code never leave your machine.

== FEATURES ==
1. Web tool at poly-glot.ai — paste code, get documented code back
2. VS Code Extension — Cmd+Shift+/ to comment selected code inline
3. CLI — npx poly-glot-ai-cli comment file.js
4. MCP Server — poly-glot-mcp for Claude Desktop, Goose, Cursor, Windsurf
5. Copilot Chat — @poly-glot /comment, /why, /both, /explain in Copilot Chat

== COMMENT TYPES ==
- Doc-comments: JSDoc (JS/TS), Javadoc (Java), PyDoc (Python), Doxygen (C++), XML docs (C#), GoDoc, Rustdoc, YARD (Ruby), PHPDoc, Swift markup, KDoc (Kotlin)
- WHY-comments: inline reasoning, trade-offs, non-obvious decisions (Pro)
- Both: two-pass generation — doc then WHY in one call (Pro)

== LANGUAGES ==
JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin (12 total)

== AI PROVIDERS ==
- OpenAI: GPT-4.1-mini (recommended), GPT-4.1, GPT-4.1-nano, GPT-4o, o3, o1, and more
- Anthropic: Claude Sonnet 4 (recommended), Claude Opus 4, Claude Haiku 4, and more
- Custom model IDs are supported — type any valid model ID
- You bring your own API key — costs go directly to OpenAI/Anthropic, no markup

== PRICING ==
- Free tier: doc-comments, Explain Code, JS/TS/Python/Java, 50 files/month
- Pro: $9/month — WHY-comments, Both mode, all 12 languages, unlimited files
- Promo code EARLYBIRD3 = Pro locked at $9/mo forever (expires May 1, 2026, Pro goes to $12/mo after)
- Get Pro at poly-glot.ai/#pg-pricing-section

== VS CODE EXTENSION ==
- Install: search "Poly-Glot" in VS Code Extensions (Cmd+Shift+X)
- Configure API key: Command Palette → "Poly-Glot: Configure API Key"
- Shortcuts: Cmd+Shift+/ (doc-comments), Cmd+Shift+W (why), Cmd+Shift+B (both), Cmd+Shift+E (explain)
- Keys stored in OS keychain, never in settings.json

== MCP SERVER (poly-glot-mcp) ==
- Install: npx poly-glot-mcp (or add to MCP client config)
- Tools: polyglot_add_doc_comments, polyglot_add_why_comments, polyglot_add_all_comments, polyglot_explain_code, polyglot_list_languages, polyglot_list_models
- Works with: Goose, Claude Desktop, Cursor, Windsurf, any MCP client
- Config: set POLYGLOT_PROVIDER, POLYGLOT_API_KEY, POLYGLOT_MODEL env vars

== CLI ==
- Install: npm install -g poly-glot-ai-cli
- Commands: poly-glot comment file.js, poly-glot why file.py, poly-glot both dir/, poly-glot explain file.ts
- Flags: --lang, --model, --provider, --dry-run, --diff, --backup

== TEST CONNECTION ==
- Uses GET /v1/models (free endpoint) — zero tokens burned, works with $0 balance
- Tests that your API key is valid without generating anything

== PRIVACY ==
- API keys stored locally (browser localStorage or OS keychain in VS Code)
- Code goes directly from your browser/editor to OpenAI/Anthropic — not through Poly-Glot servers
- No telemetry, no data collection by Poly-Glot

== GETTING STARTED ==
1. Go to poly-glot.ai
2. Click "AI Settings" (gear icon)
3. Choose OpenAI or Anthropic, enter your API key, pick a model
4. Paste code in the editor
5. Click "Generate Comments"
`.trim();

  // ─── Rule-based fallback ──────────────────────────────────────────────────────

  const RULES = [
    {
      patterns: [/get.?start|how.?(do|to|can).?use|first.?time|begin|setup|start/i],
      answer: `**Getting started is quick:**\n\n1. Click **⚙️ AI Settings** on this page\n2. Choose **OpenAI** or **Anthropic**\n3. Paste your API key\n4. Pick a model (GPT-4.1 Mini is great)\n5. Paste code → click **Generate Comments**\n\nNeed an API key? [OpenAI →](https://platform.openai.com/api-keys) · [Anthropic →](https://console.anthropic.com/settings/keys)`,
    },
    {
      patterns: [/mcp|model.?context|goose|cursor|windsurf|claude.?desktop/i],
      answer: `**Poly-Glot MCP Server** is live on npm!\n\nAdd to your MCP client config:\n\`\`\`json\n{\n  "command": "npx",\n  "args": ["-y", "poly-glot-mcp"],\n  "env": {\n    "POLYGLOT_PROVIDER": "openai",\n    "POLYGLOT_API_KEY": "sk-..."\n  }\n}\`\`\`\n\n6 tools: doc-comments, why-comments, both, explain, list-languages, list-models.\n\n[See full docs →](https://www.npmjs.com/package/poly-glot-mcp)`,
    },
    {
      patterns: [/vscode|vs.?code|extension|marketplace|editor/i],
      answer: `**VS Code Extension** is live on the marketplace!\n\n- Search **"Poly-Glot"** in Extensions (Cmd+Shift+X)\n- **Cmd+Shift+/** — doc-comments inline\n- **Cmd+Shift+W** — WHY-comments (Pro)\n- **Cmd+Shift+B** — both passes (Pro)\n- **Cmd+Shift+E** — deep code analysis\n\nAPI key stored in OS keychain — never in settings.json.\n\n[Install free →](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)`,
    },
    {
      patterns: [/cli|command.?line|terminal|npm|npx/i],
      answer: `**Poly-Glot CLI** on npm:\n\n\`\`\`bash\nnpm install -g poly-glot-ai-cli\npoly-glot comment file.js\npoly-glot why file.py\npoly-glot both src/\npoly-glot explain file.ts\n\`\`\`\n\nSet your key: \`export POLYGLOT_API_KEY=sk-...\`\n\n[npm →](https://www.npmjs.com/package/poly-glot-ai-cli)`,
    },
    {
      patterns: [/why.?comment|reasoning|intent|decision|trade.?off/i],
      answer: `**WHY-comments** explain *why* code was written a certain way — not what it does.\n\nThey cover:\n- Non-obvious trade-offs\n- Edge-case reasoning\n- Algorithm choices\n- Business constraints\n\nExample: \`// Using a Map here instead of nested loops — O(n) vs O(n²) at scale\`\n\n**WHY-comments are a Pro feature.** Get locked at $9/mo forever with code **EARLYBIRD3** (expires May 1, 2026) at [poly-glot.ai](https://poly-glot.ai/#pg-pricing-section).`,
    },
    {
      patterns: [/price|pricing|cost|plan|pro|free|paid|subscription|earlybird/i],
      answer: `**Pricing:**\n\n🆓 **Free** — doc-comments, Explain Code, JS/TS/Python/Java, 50 files/month\n💎 **Pro** — $9/month — WHY-comments, Both mode, all 12 languages, unlimited\n\n🎁 Early bird: use code **EARLYBIRD3** at Pro Monthly checkout to lock Pro at **$9/mo forever** (expires May 1, 2026).\n\n[See plans →](https://poly-glot.ai/#pg-pricing-section)`,
    },
    {
      patterns: [/language|support|java(?!script|doc)|python|typescript|cpp|c\+\+|csharp|c#|go|rust|ruby|php|swift|kotlin/i],
      answer: `**12 supported languages:**\n\nJavaScript · TypeScript · Python · Java · C++ · C# · Go · Rust · Ruby · PHP · Swift · Kotlin\n\nEach uses the native comment standard: JSDoc, Javadoc, PyDoc, Doxygen, XML docs, GoDoc, Rustdoc, YARD, PHPDoc, KDoc, Swift markup.`,
    },
    {
      patterns: [/api.?key|openai|anthropic|provider|model|gpt|claude/i],
      answer: `**Poly-Glot works with your own API key:**\n\n- **OpenAI:** GPT-4.1 Mini (recommended), GPT-4.1, GPT-4.1 Nano, GPT-4o, o3, o1\n- **Anthropic:** Claude Sonnet 4 (recommended), Claude Opus 4, Claude Haiku 4\n- Custom model IDs supported — type any valid ID\n\nYour key goes directly to OpenAI/Anthropic — Poly-Glot never sees it.\n\nGet a key: [OpenAI](https://platform.openai.com/api-keys) · [Anthropic](https://console.anthropic.com/settings/keys)`,
    },
    {
      patterns: [/privacy|secure|safe|data|collect|telemetry|store/i],
      answer: `**100% private:**\n\n- 🔑 API keys stored locally — never sent to Poly-Glot\n- 📡 Code goes directly from your browser → OpenAI/Anthropic\n- 🚫 Zero telemetry, zero data collection\n- 🏠 Poly-Glot has no backend that touches your code\n\nYou own your data. Always.`,
    },
    {
      patterns: [/test.?connection|valid|key.?work|check.*key/i],
      answer: `**Test Connection** validates your API key for free:\n\n- Uses \`GET /v1/models\` — a read-only endpoint\n- **Zero tokens burned** — works even with $0 balance\n- Returns a clear error if the key is wrong or expired\n\nClick **Test Connection** in the AI Settings modal to verify your key instantly.`,
    },
    {
      patterns: [/explain|analys|analyze|complexity|bug|quality|score/i],
      answer: `**Explain Code** gives you a deep analysis:\n\n- Plain-English summary\n- Complexity score (1–10)\n- Function-by-function breakdown\n- Potential bugs list\n- Refactoring suggestions\n- Documentation quality score (0–100)\n\nSelect code → Cmd+Shift+E in VS Code, or use the Explain button on the web tool.`,
    },
    {
      patterns: [/copilot|@poly|chat.?participant/i],
      answer: `**Copilot Chat integration** is built in!\n\nIn VS Code with GitHub Copilot:\n- \`@poly-glot /comment\` — generate doc-comments\n- \`@poly-glot /why\` — WHY-comments (Pro)\n- \`@poly-glot /both\` — both passes (Pro)\n- \`@poly-glot /explain\` — deep analysis\n\nInstall the [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot) to enable it.`,
    },
  ];

  function ruleBasedAnswer(question) {
    for (const rule of RULES) {
      if (rule.patterns.some(p => p.test(question))) {
        return rule.answer;
      }
    }
    return null;
  }

  // ─── Branded fallback message ─────────────────────────────────────────────────

  const BRANDED_FALLBACK = `__BRANDED_FALLBACK__`;

  function brandedFallbackHTML() {
    return `
      <div class="pg-chat-fallback">
        <div class="pg-chat-fallback-icon">🦜</div>
        <div class="pg-chat-fallback-text">
          <strong>That one's outside my territory!</strong><br>
          I'm scoped to Poly-Glot topics — here's what I know best:
        </div>
        <ul class="pg-chat-fallback-list">
          <li>🚀 Getting started &amp; setup</li>
          <li>💬 Comment types (Doc, WHY, Both)</li>
          <li>🌐 Languages &amp; style guides</li>
          <li>🔌 VS Code · CLI · MCP · Copilot Chat</li>
          <li>💳 Pricing &amp; Pro features</li>
          <li>🔒 Privacy &amp; API key security</li>
        </ul>
        <a href="https://poly-glot.ai" target="_blank" rel="noopener" class="pg-chat-fallback-link">
          Visit poly-glot.ai for full docs ↗
        </a>
      </div>
    `.trim();
  }

  // ─── Markdown renderer ────────────────────────────────────────────────────────

  function renderMarkdown(text) {
    return text
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
        `<pre class="pg-chat-code"><code>${escHtml(code.trim())}</code></pre>`)
      .replace(/`([^`]+)`/g, (_, c) => `<code class="pg-chat-inline-code">${escHtml(c)}</code>`)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener" class="pg-chat-link">$1 ↗</a>')
      .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)+/g, m => `<ul class="pg-chat-list">${m}</ul>`)
      .replace(/\n{2,}/g, '</p><p class="pg-chat-p">')
      .replace(/\n/g, '<br>');
  }

  function escHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ─── AI call ──────────────────────────────────────────────────────────────────

  async function askAI(question, history) {
    const provider = localStorage.getItem('polyglot_ai_provider') || 'openai';
    const apiKey   = localStorage.getItem('polyglot_api_key') || '';
    if (!apiKey) return null;

    const messages = [
      { role: 'system', content: KNOWLEDGE },
      ...history.slice(-6),
      { role: 'user', content: question },
    ];

    try {
      if (provider === 'openai') {
        const model = localStorage.getItem('polyglot_ai_model') || 'gpt-4.1-mini';
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body:    JSON.stringify({ model, messages, max_tokens: 400, temperature: 0.4 }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content?.trim() || null;
        if (reply === '__UNRELATED__') return BRANDED_FALLBACK;
        return reply;

      } else if (provider === 'anthropic') {
        const model        = localStorage.getItem('polyglot_ai_model') || 'claude-haiku-4-5';
        const anthropicMsgs = messages.filter(m => m.role !== 'system');
        const systemMsg    = messages.find(m => m.role === 'system')?.content || '';
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key':    apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model,
            max_tokens: 400,
            system:   systemMsg,
            messages: anthropicMsgs,
          }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const reply = data.content?.[0]?.text?.trim() || null;
        if (reply === '__UNRELATED__') return BRANDED_FALLBACK;
        return reply;
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  // ─── Suggestion pool (one shown at a time, rotates) ──────────────────────────

  const SUGGESTIONS = [
    'How do I get started?',
    'What languages are supported?',
    'How does the MCP server work?',
    "What's the difference between Doc and WHY comments?",
    'Is my code private?',
    'How much does Pro cost?',
    'How do I install the VS Code extension?',
    'What models are supported?',
    'How do I use the CLI?',
    'What is Explain Code?',
  ];

  let suggestionIndex = Math.floor(Math.random() * SUGGESTIONS.length);

  function nextSuggestion() {
    suggestionIndex = (suggestionIndex + 1) % SUGGESTIONS.length;
    return SUGGESTIONS[suggestionIndex];
  }

  // ─── Styles ───────────────────────────────────────────────────────────────────

  const CSS = `
    /* ── Trigger bubble ── */
    #pg-chat-trigger {
      position: fixed;
      bottom: 28px;
      right: 28px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(79,70,229,.5), 0 2px 8px rgba(0,0,0,.3);
      z-index: 9998;
      transition: transform .2s, box-shadow .2s;
      font-size: 24px;
      line-height: 1;
      padding: 0;
    }
    #pg-chat-trigger:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 6px 28px rgba(79,70,229,.65), 0 3px 12px rgba(0,0,0,.35);
    }
    #pg-chat-trigger.open {
      background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
    }
    .pg-icon-open  { display: flex; align-items: center; justify-content: center; }
    .pg-icon-close { display: none; align-items: center; justify-content: center; }
    #pg-chat-trigger.open .pg-icon-open  { display: none; }
    #pg-chat-trigger.open .pg-icon-close { display: flex; }

    /* Unread badge */
    #pg-chat-badge {
      position: absolute;
      top: -3px; right: -3px;
      width: 18px; height: 18px;
      background: #ef4444;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #0d0e1a;
      pointer-events: none;
    }
    #pg-chat-badge.hidden { display: none; }

    /* ── Chat window ── */
    #pg-chat-window {
      position: fixed;
      bottom: 96px;
      right: 28px;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 540px;
      max-height: calc(100vh - 120px);
      background: #13141f;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 16px;
      box-shadow: 0 24px 60px rgba(0,0,0,.7), 0 4px 16px rgba(79,70,229,.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 9997;
      opacity: 0;
      transform: translateY(16px) scale(.97);
      pointer-events: none;
      transition: opacity .22s ease, transform .22s ease;
    }
    #pg-chat-window.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    /* ── Header ── */
    .pg-chat-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      background: linear-gradient(135deg, rgba(79,70,229,.25) 0%, rgba(124,58,237,.15) 100%);
      border-bottom: 1px solid rgba(255,255,255,.08);
      flex-shrink: 0;
    }
    .pg-chat-header-avatar {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }
    .pg-chat-header-info { flex: 1; min-width: 0; }
    .pg-chat-header-name {
      font-size: 13px;
      font-weight: 700;
      color: #f9fafb;
      line-height: 1.2;
    }
    .pg-chat-header-status {
      font-size: 11px;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 1px;
    }
    .pg-chat-status-dot {
      width: 6px; height: 6px;
      background: #34d399;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }
    .pg-chat-header-close {
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      padding: 6px;
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      transition: color .15s, background .15s;
      flex-shrink: 0;
      width: 32px; height: 32px;
    }
    .pg-chat-header-close:hover { color: #f9fafb; background: rgba(255,255,255,.1); }

    /* ── Messages — the ONLY scroll zone ── */
    .pg-chat-messages {
      flex: 1;
      min-height: 0;          /* critical: allows flex child to shrink below content */
      overflow-y: auto;
      overflow-x: hidden;
      padding: 16px 14px 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,.1) transparent;
      overscroll-behavior: contain;   /* stop scroll leaking to page */
    }
    .pg-chat-messages::-webkit-scrollbar { width: 4px; }
    .pg-chat-messages::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,.12);
      border-radius: 2px;
    }

    /* ── Message bubbles ── */
    .pg-chat-msg {
      display: flex;
      flex-direction: column;
      max-width: 88%;
      animation: pg-msg-in .18s ease both;
    }
    @keyframes pg-msg-in {
      from { opacity: 0; transform: translateY(7px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .pg-chat-msg.bot  { align-self: flex-start; }
    .pg-chat-msg.user { align-self: flex-end; }

    .pg-chat-bubble {
      padding: 9px 12px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.55;
      word-break: break-word;
    }
    .pg-chat-msg.bot .pg-chat-bubble {
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.08);
      color: #e5e7eb;
      border-radius: 4px 14px 14px 14px;
    }
    .pg-chat-msg.user .pg-chat-bubble {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #fff;
      border-radius: 14px 4px 14px 14px;
    }

    /* Markdown elements inside bot bubbles */
    .pg-chat-bubble strong { color: #f9fafb; }
    .pg-chat-list { margin: 6px 0 4px 16px; padding: 0; }
    .pg-chat-list li { margin-bottom: 3px; }
    .pg-chat-p { margin: 6px 0 0; }
    .pg-chat-code {
      background: rgba(0,0,0,.45);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 11.5px;
      overflow-x: auto;
      margin: 6px 0 2px;
      font-family: 'Fira Code', 'Menlo', monospace;
      color: #a5f3fc;
      white-space: pre;
    }
    .pg-chat-inline-code {
      background: rgba(0,0,0,.35);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 11.5px;
      font-family: 'Fira Code', 'Menlo', monospace;
      color: #a5f3fc;
    }
    .pg-chat-link { color: #818cf8; text-decoration: none; }
    .pg-chat-link:hover { text-decoration: underline; }

    /* ── Typing indicator ── */
    .pg-chat-typing .pg-chat-bubble {
      display: flex; align-items: center; gap: 5px;
      padding: 11px 14px;
    }
    .pg-chat-dot {
      width: 7px; height: 7px;
      background: #6b7280;
      border-radius: 50%;
      animation: pg-dot-bounce .9s ease-in-out infinite;
      flex-shrink: 0;
    }
    .pg-chat-dot:nth-child(2) { animation-delay: .15s; }
    .pg-chat-dot:nth-child(3) { animation-delay: .30s; }
    @keyframes pg-dot-bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: .4; }
      40%            { transform: translateY(-5px); opacity: 1; }
    }

    /* ── Branded fallback card ── */
    .pg-chat-fallback {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .pg-chat-fallback-icon {
      font-size: 22px;
      line-height: 1;
    }
    .pg-chat-fallback-text {
      font-size: 13px;
      color: #e5e7eb;
      line-height: 1.5;
    }
    .pg-chat-fallback-list {
      margin: 2px 0 4px 4px;
      padding: 0;
      list-style: none;
      font-size: 12.5px;
      color: #9ca3af;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .pg-chat-fallback-link {
      display: inline-block;
      margin-top: 4px;
      font-size: 12.5px;
      color: #818cf8;
      text-decoration: none;
      font-weight: 600;
    }
    .pg-chat-fallback-link:hover { text-decoration: underline; }

    /* ── Suggestion strip — fixed between messages and input ── */
    .pg-chat-suggestions {
      flex-shrink: 0;
      padding: 8px 12px 7px;
      border-top: 1px solid rgba(255,255,255,.06);
      background: rgba(0,0,0,.18);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pg-chat-suggestions-label {
      font-size: 10px;
      color: #4b5563;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-weight: 700;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .pg-chat-suggestion {
      background: rgba(79,70,229,.13);
      border: 1px solid rgba(79,70,229,.35);
      color: #a5b4fc;
      font-size: 12px;
      border-radius: 20px;
      padding: 5px 13px;
      cursor: pointer;
      transition: background .14s, border-color .14s, color .14s, transform .14s;
      white-space: nowrap;
      flex-shrink: 0;
      line-height: 1.4;
      font-family: inherit;
    }
    .pg-chat-suggestion:hover {
      background: rgba(79,70,229,.3);
      border-color: rgba(79,70,229,.7);
      color: #c7d2fe;
      transform: translateY(-1px);
    }
    .pg-chat-suggestion:active {
      transform: translateY(0);
      background: rgba(79,70,229,.45);
    }
    /* Populate-mode: chip turns yellow to signal "ready to send" */
    .pg-chat-suggestion.populated {
      background: rgba(234,179,8,.15);
      border-color: rgba(234,179,8,.5);
      color: #fde68a;
    }

    /* ── Input row ── */
    .pg-chat-input-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding: 10px 12px 14px;
      border-top: 1px solid rgba(255,255,255,.07);
      background: rgba(0,0,0,.22);
      flex-shrink: 0;
    }
    #pg-chat-input {
      flex: 1;
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 12px;
      color: #f9fafb;
      font-size: 13px;
      font-family: inherit;
      padding: 9px 12px;
      resize: none;
      outline: none;
      line-height: 1.45;
      min-height: 38px;
      max-height: 100px;
      overflow-y: auto;
      transition: border-color .15s;
      box-sizing: border-box;
    }
    #pg-chat-input:focus { border-color: rgba(79,70,229,.6); }
    #pg-chat-input::placeholder { color: #4b5563; }

    /* ── Send button ── */
    #pg-chat-send {
      width: 38px;
      height: 38px;
      min-width: 38px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border: none;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform .15s, opacity .15s, box-shadow .15s;
      padding: 0;
      position: relative;
      overflow: visible;
    }
    #pg-chat-send:hover:not(:disabled) {
      transform: scale(1.07);
      box-shadow: 0 3px 12px rgba(79,70,229,.55);
    }
    #pg-chat-send:disabled {
      opacity: .35;
      cursor: default;
      transform: none;
    }
    #pg-chat-send svg {
      width: 17px;
      height: 17px;
      display: block;
      flex-shrink: 0;
    }

    /* ── Mobile full-sheet ── */
    @media (max-width: 480px) {
      #pg-chat-window {
        bottom: 0; right: 0; left: 0;
        width: 100%;
        max-width: 100%;
        height: 72vh;
        max-height: 100dvh;
        border-radius: 20px 20px 0 0;
      }
      #pg-chat-trigger { bottom: 20px; right: 20px; }
    }
  `;

  // ─── DOM builder ──────────────────────────────────────────────────────────────

  function buildWidget() {
    const style = document.createElement('style');
    style.id = 'pg-chat-styles';
    style.textContent = CSS;
    document.head.appendChild(style);

    // ── Trigger button
    const trigger = document.createElement('button');
    trigger.id = 'pg-chat-trigger';
    trigger.setAttribute('aria-label', 'Open Poly-Glot chat assistant');
    // Parrot SVG for open state; X for close state
    trigger.innerHTML = `
      <span class="pg-icon-open" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="18" fill="none"/>
          <text x="18" y="24" text-anchor="middle" font-size="22" font-family="serif">🦜</text>
        </svg>
      </span>
      <span class="pg-icon-close" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </span>
      <span id="pg-chat-badge" aria-label="1 unread message">1</span>
    `;

    // ── Chat window
    const win = document.createElement('div');
    win.id = 'pg-chat-window';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-modal', 'true');
    win.setAttribute('aria-label', 'Poly-Glot chat assistant');
    win.innerHTML = `
      <div class="pg-chat-header">
        <div class="pg-chat-header-avatar" aria-hidden="true">🦜</div>
        <div class="pg-chat-header-info">
          <div class="pg-chat-header-name">Poly-Glot Assistant</div>
          <div class="pg-chat-header-status">
            <span class="pg-chat-status-dot"></span>
            Online · Ask me anything
          </div>
        </div>
        <button class="pg-chat-header-close" id="pg-chat-close" aria-label="Close chat">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="pg-chat-messages" id="pg-chat-messages" role="log" aria-live="polite" aria-atomic="false"></div>

      <div class="pg-chat-suggestions" id="pg-chat-suggestions" aria-label="Suggested questions"></div>

      <div class="pg-chat-input-row">
        <textarea
          id="pg-chat-input"
          placeholder="Ask about features, pricing, how to use…"
          rows="1"
          aria-label="Chat message"
          autocomplete="off"
          spellcheck="true"
        ></textarea>
        <button id="pg-chat-send" aria-label="Send message" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(trigger);
    document.body.appendChild(win);

    return { trigger, win };
  }

  // ─── Controller ───────────────────────────────────────────────────────────────

  function init() {
    if (document.getElementById('pg-chat-trigger')) return; // guard double-mount

    const { trigger, win } = buildWidget();

    const messagesEl    = document.getElementById('pg-chat-messages');
    const inputEl       = document.getElementById('pg-chat-input');
    const sendBtn       = document.getElementById('pg-chat-send');
    const closeBtn      = document.getElementById('pg-chat-close');
    const suggestionsEl = document.getElementById('pg-chat-suggestions');
    const badge         = document.getElementById('pg-chat-badge');

    let isOpen    = false;
    let isBusy    = false;
    let history   = [];   // { role, content } conversation context for AI
    let hasOpened = false;

    // ── Scroll isolation: prevent wheel/touch from bleeding to the page ────────
    // messagesEl already has overscroll-behavior: contain but we reinforce with JS
    win.addEventListener('wheel', e => { e.stopPropagation(); }, { passive: true });
    win.addEventListener('touchmove', e => { e.stopPropagation(); }, { passive: true });

    // ── Suggestion chip — renders ONE question chip + label ────────────────────
    function renderSuggestion(text) {
      suggestionsEl.innerHTML = '';

      const label = document.createElement('span');
      label.className = 'pg-chat-suggestions-label';
      label.textContent = 'Try:';
      suggestionsEl.appendChild(label);

      const btn = document.createElement('button');
      btn.className = 'pg-chat-suggestion';
      btn.textContent = text;
      btn.setAttribute('aria-label', `Suggested question: ${text}`);

      // Click → populate textarea (don't auto-send; let user review + hit send)
      btn.addEventListener('click', () => {
        if (isBusy) return;
        inputEl.value = text;
        inputEl.style.height = 'auto';
        inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
        sendBtn.disabled = false;
        btn.classList.add('populated');  // visual feedback: chip highlights
        inputEl.focus();
        // Place cursor at end of populated text
        const len = inputEl.value.length;
        inputEl.setSelectionRange(len, len);
      });

      suggestionsEl.appendChild(btn);
    }

    // ── Append a message bubble ────────────────────────────────────────────────
    function appendMessage(role, content, isHtml = false) {
      const wrapper = document.createElement('div');
      wrapper.className = `pg-chat-msg ${role}`;

      const bubble = document.createElement('div');
      bubble.className = 'pg-chat-bubble';

      if (isHtml) {
        bubble.innerHTML = content;
      } else {
        // Plain-text user messages: escape HTML
        bubble.textContent = content;
      }

      wrapper.appendChild(bubble);
      messagesEl.appendChild(wrapper);
      scrollToBottom();
      return wrapper;
    }

    function scrollToBottom() {
      // Use requestAnimationFrame so the DOM paint has completed first
      requestAnimationFrame(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      });
    }

    // ── Typing indicator ───────────────────────────────────────────────────────
    function showTyping() {
      const el = document.createElement('div');
      el.className = 'pg-chat-msg bot pg-chat-typing';
      el.id = 'pg-chat-typing-indicator';
      el.innerHTML = `<div class="pg-chat-bubble">
        <span class="pg-chat-dot"></span>
        <span class="pg-chat-dot"></span>
        <span class="pg-chat-dot"></span>
      </div>`;
      messagesEl.appendChild(el);
      scrollToBottom();
    }

    function hideTyping() {
      const el = document.getElementById('pg-chat-typing-indicator');
      if (el) el.remove();
    }

    // ── Core: send message → get reply ────────────────────────────────────────
    async function sendMessage(text) {
      text = text.trim();
      if (!text || isBusy) return;

      isBusy = true;
      sendBtn.disabled = true;
      inputEl.value = '';
      inputEl.style.height = 'auto';

      // Remove populated styling from suggestion chip if present
      const chip = suggestionsEl.querySelector('.pg-chat-suggestion');
      if (chip) chip.classList.remove('populated');

      // User bubble (plain text, escape HTML)
      appendMessage('user', text, false);
      showTyping();

      // 1 – Try AI (if user has a key configured)
      let answer = await askAI(text, history);

      // 2 – Rule-based fallback
      if (!answer) {
        answer = ruleBasedAnswer(text);
      }

      // 3 – Branded fallback (question is completely out of scope)
      const isBrandedFallback = !answer || answer === BRANDED_FALLBACK;

      hideTyping();

      if (isBrandedFallback) {
        // Render the branded HTML card directly
        appendMessage('bot', brandedFallbackHTML(), true);
      } else {
        // Render markdown-processed answer
        appendMessage('bot', renderMarkdown(answer), true);
      }

      // Update conversation history for AI context
      history.push({ role: 'user', content: text });
      history.push({ role: 'assistant', content: isBrandedFallback ? '[out of scope]' : answer });
      if (history.length > 20) history = history.slice(-20);

      // Rotate to next suggestion chip after each exchange
      renderSuggestion(nextSuggestion());

      isBusy = false;
      sendBtn.disabled = !inputEl.value.trim();
      inputEl.focus();
    }

    // ── Open / close ──────────────────────────────────────────────────────────
    function openChat() {
      isOpen = true;
      win.classList.add('visible');
      trigger.classList.add('open');
      badge.classList.add('hidden');

      if (!hasOpened) {
        hasOpened = true;
        const greetings = [
          "Hey! 👋 How can I help you with Poly-Glot today?",
          "Hi there! 🦜 What would you like to know about Poly-Glot?",
          "Hello! I'm the Poly-Glot assistant — what can I help you with?",
        ];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        setTimeout(() => {
          appendMessage('bot', greeting, false);
          renderSuggestion(SUGGESTIONS[suggestionIndex]);
          scrollToBottom();
        }, 120);
      }

      // Delay focus slightly so the open animation doesn't fight it
      setTimeout(() => inputEl.focus(), 180);
    }

    function closeChat() {
      isOpen = false;
      win.classList.remove('visible');
      trigger.classList.remove('open');
    }

    // ── Event listeners ───────────────────────────────────────────────────────
    trigger.addEventListener('click', () => isOpen ? closeChat() : openChat());
    closeBtn.addEventListener('click', closeChat);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) closeChat();
    });

    // Auto-resize textarea + enable/disable send button
    inputEl.addEventListener('input', () => {
      const hasText = !!inputEl.value.trim();
      sendBtn.disabled = !hasText;
      // Remove populated highlight once user edits the field
      const chip = suggestionsEl.querySelector('.pg-chat-suggestion');
      if (chip) chip.classList.remove('populated');
      // Auto-grow
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
    });

    // Enter to send, Shift+Enter for newline
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled && !isBusy) sendMessage(inputEl.value);
      }
    });

    sendBtn.addEventListener('click', () => {
      if (!sendBtn.disabled && !isBusy) sendMessage(inputEl.value);
    });
  }

  // ─── Mount ────────────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
