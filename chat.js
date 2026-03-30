/**
 * Poly-Glot Chat Assistant
 * Floating chat bubble that answers questions about poly-glot.ai features,
 * pricing, MCP, CLI, VS Code extension, and how to use everything.
 *
 * Uses the user's own configured OpenAI or Anthropic key (from localStorage)
 * — or falls back to a lightweight rule-based engine with no API needed.
 *
 * No external dependencies. Pure vanilla JS.
 */
(function () {
  'use strict';

  // ── Knowledge base ──────────────────────────────────────────────────────────
  // Used by both the rule-based fallback AND as system-prompt context for AI.

  const KNOWLEDGE = `
You are the Poly-Glot AI assistant on poly-glot.ai. You help users understand and use Poly-Glot.
Be friendly, concise, and specific. Use bullet points for lists. Keep answers under 150 words unless the question needs more detail.

== WHAT IS POLY-GLOT ==
Poly-Glot is an AI-powered code documentation tool. It generates professional comments for code in 12 languages. It runs in the browser, in VS Code, via CLI, and now via MCP. Your API key and code never leave your machine.

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
- Free tier: Generate doc-comments, Explain Code, JS/TS/Python/Java, 50 files/month
- Pro: $9/month — WHY-comments, Both mode, all 12 languages, unlimited files
- Promo code EARLYBIRD3 = 3 months free
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

  // ── Rule-based fallback (no API key needed) ─────────────────────────────────

  const RULES = [
    {
      patterns: [/get.?start|how.?(do|to|can).?use|first.?time|begin|setup|start/i],
      answer: `**Getting started is quick:**\n\n1. Click **⚙️ AI Settings** on this page\n2. Choose **OpenAI** or **Anthropic**\n3. Paste your API key\n4. Pick a model (GPT-4.1 Mini is great)\n5. Paste code in the editor → click **Generate Comments**\n\nNeed an API key? Get one at [platform.openai.com](https://platform.openai.com) or [console.anthropic.com](https://console.anthropic.com).`,
    },
    {
      patterns: [/mcp|model.?context|goose|cursor|windsurf|claude.?desktop/i],
      answer: `**Poly-Glot MCP Server** is live on npm!\n\nAdd to your MCP client config:\n\`\`\`json\n{\n  "command": "npx",\n  "args": ["-y", "poly-glot-mcp"],\n  "env": {\n    "POLYGLOT_PROVIDER": "openai",\n    "POLYGLOT_API_KEY": "sk-..."\n  }\n}\`\`\`\n\n6 tools: doc-comments, why-comments, both, explain, list-languages, list-models.\n\n[See full docs →](https://www.npmjs.com/package/poly-glot-mcp)`,
    },
    {
      patterns: [/vscode|vs.?code|extension|marketplace|editor/i],
      answer: `**VS Code Extension** is live on the marketplace!\n\n- Search **"Poly-Glot"** in Extensions (Cmd+Shift+X)\n- **Cmd+Shift+/** — generate doc-comments inline\n- **Cmd+Shift+W** — add WHY-comments (Pro)\n- **Cmd+Shift+B** — both passes (Pro)\n- **Cmd+Shift+E** — deep code analysis\n\nAPI key stored in OS keychain — never in settings.json.\n\n[Install free →](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)`,
    },
    {
      patterns: [/cli|command.?line|terminal|npm|npx/i],
      answer: `**Poly-Glot CLI** on npm:\n\n\`\`\`bash\nnpm install -g poly-glot-ai-cli\npoly-glot comment file.js\npoly-glot why file.py\npoly-glot both src/\npoly-glot explain file.ts\n\`\`\`\n\nSet your key: \`export POLYGLOT_API_KEY=sk-...\`\n\n[npm →](https://www.npmjs.com/package/poly-glot-ai-cli)`,
    },
    {
      patterns: [/why.?comment|reasoning|intent|decision|trade.?off/i],
      answer: `**WHY-comments** explain *why* code was written a certain way — not what it does.\n\nThey cover:\n- Non-obvious trade-offs\n- Edge-case reasoning\n- Algorithm choices\n- Business constraints\n\nExample: \`// Using a map here instead of nested loops — O(n) vs O(n²) at scale\`\n\n**WHY-comments are a Pro feature.** Get 3 months free with code **EARLYBIRD3** at [poly-glot.ai](https://poly-glot.ai/#pg-pricing-section).`,
    },
    {
      patterns: [/price|pricing|cost|plan|pro|free|paid|subscription|earlybird/i],
      answer: `**Pricing:**\n\n🆓 **Free** — doc-comments, Explain Code, JS/TS/Python/Java, 50 files/month\n💎 **Pro** — $9/month — WHY-comments, Both mode, all 12 languages, unlimited\n\n🎉 Use code **EARLYBIRD3** for **3 months free**!\n\n[See plans →](https://poly-glot.ai/#pg-pricing-section)`,
    },
    {
      patterns: [/language|support|java(?!script|doc)|python|typescript|cpp|c\+\+|csharp|c#|go|rust|ruby|php|swift|kotlin/i],
      answer: `**12 supported languages:**\n\nJavaScript · TypeScript · Python · Java · C++ · C# · Go · Rust · Ruby · PHP · Swift · Kotlin\n\nEach uses the native comment standard:\nJSDoc, Javadoc, PyDoc, Doxygen, XML docs, GoDoc, Rustdoc, YARD, PHPDoc, KDoc, Swift markup.`,
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

  // ── Simple markdown renderer ────────────────────────────────────────────────

  function renderMarkdown(text) {
    return text
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
        `<pre class="pg-chat-code"><code>${escHtml(code.trim())}</code></pre>`)
      // Inline code
      .replace(/`([^`]+)`/g, (_, c) => `<code class="pg-chat-inline-code">${escHtml(c)}</code>`)
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener" class="pg-chat-link">$1 ↗</a>')
      // Bullet lists
      .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)+/g, m => `<ul class="pg-chat-list">${m}</ul>`)
      // Line breaks
      .replace(/\n{2,}/g, '</p><p class="pg-chat-p">')
      .replace(/\n/g, '<br>');
  }

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── AI call ─────────────────────────────────────────────────────────────────

  async function askAI(question, history) {
    const provider = localStorage.getItem('polyglot_ai_provider') || 'openai';
    const apiKey   = localStorage.getItem('polyglot_api_key') || '';
    if (!apiKey) return null;

    const messages = [
      { role: 'system', content: KNOWLEDGE },
      ...history.slice(-6), // last 6 turns for context
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
        return data.choices?.[0]?.message?.content?.trim() || null;

      } else if (provider === 'anthropic') {
        const model = localStorage.getItem('polyglot_ai_model') || 'claude-haiku-4-5';
        const anthropicMsgs = messages.filter(m => m.role !== 'system');
        const systemMsg     = messages.find(m => m.role === 'system')?.content || '';
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
        return data.content?.[0]?.text?.trim() || null;
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  // ── Suggested questions ─────────────────────────────────────────────────────

  const SUGGESTIONS = [
    'How do I get started?',
    'What languages are supported?',
    'How does the MCP server work?',
    "What's the difference between doc and WHY comments?",
    'Is my code private?',
    'How much does Pro cost?',
  ];

  // ── Build UI ────────────────────────────────────────────────────────────────

  function buildWidget() {
    // Inject styles
    const style = document.createElement('style');
    style.id = 'pg-chat-styles';
    style.textContent = `
      /* ── Chat bubble trigger ── */
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
        font-size: 22px;
        line-height: 1;
      }
      #pg-chat-trigger:hover {
        transform: scale(1.08) translateY(-2px);
        box-shadow: 0 6px 28px rgba(79,70,229,.65), 0 3px 12px rgba(0,0,0,.35);
      }
      #pg-chat-trigger.open { background: linear-gradient(135deg, #374151 0%, #1f2937 100%); }
      #pg-chat-trigger .pg-chat-icon-open  { display: flex; }
      #pg-chat-trigger .pg-chat-icon-close { display: none; }
      #pg-chat-trigger.open .pg-chat-icon-open  { display: none; }
      #pg-chat-trigger.open .pg-chat-icon-close { display: flex; }

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
        display: flex; align-items: center; justify-content: center;
        border: 2px solid #111;
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
        height: 520px;
        max-height: calc(100vh - 120px);
        background: #13141f;
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 16px;
        box-shadow: 0 24px 60px rgba(0,0,0,.65), 0 4px 16px rgba(79,70,229,.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 9997;
        opacity: 0;
        transform: translateY(16px) scale(.97);
        pointer-events: none;
        transition: opacity .2s ease, transform .2s ease;
      }
      #pg-chat-window.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: all;
      }

      /* Header */
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
      }
      .pg-chat-status-dot {
        width: 6px; height: 6px;
        background: #34d399;
        border-radius: 50%;
        display: inline-block;
      }
      .pg-chat-header-close {
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        padding: 4px;
        border-radius: 6px;
        display: flex; align-items: center;
        transition: color .15s, background .15s;
        flex-shrink: 0;
        width: auto;
      }
      .pg-chat-header-close:hover { color: #f9fafb; background: rgba(255,255,255,.1); }

      /* Messages — scrollable area only, no suggestions inside */
      .pg-chat-messages {
        flex: 1;
        min-height: 0;        /* critical: lets flex child shrink below content size */
        overflow-y: auto;
        padding: 14px 14px 8px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,.1) transparent;
      }
      .pg-chat-messages::-webkit-scrollbar { width: 4px; }
      .pg-chat-messages::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,.1);
        border-radius: 2px;
      }

      /* Message bubbles */
      .pg-chat-msg {
        display: flex;
        flex-direction: column;
        max-width: 88%;
        animation: pg-msg-in .18s ease;
      }
      @keyframes pg-msg-in {
        from { opacity: 0; transform: translateY(6px); }
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
      .pg-chat-msg.bot  .pg-chat-bubble {
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

      /* Markdown inside bot bubbles */
      .pg-chat-bubble strong { color: #f9fafb; }
      .pg-chat-list { margin: 6px 0 4px 16px; padding: 0; }
      .pg-chat-list li { margin-bottom: 3px; }
      .pg-chat-p { margin: 6px 0 0; }
      .pg-chat-code {
        background: rgba(0,0,0,.4);
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

      /* Typing indicator */
      .pg-chat-typing .pg-chat-bubble {
        display: flex; align-items: center; gap: 4px;
        padding: 10px 14px;
      }
      .pg-chat-dot {
        width: 7px; height: 7px;
        background: #6b7280;
        border-radius: 50%;
        animation: pg-dot-bounce .9s ease-in-out infinite;
      }
      .pg-chat-dot:nth-child(2) { animation-delay: .15s; }
      .pg-chat-dot:nth-child(3) { animation-delay: .30s; }
      @keyframes pg-dot-bounce {
        0%, 80%, 100% { transform: translateY(0); opacity: .5; }
        40%            { transform: translateY(-5px); opacity: 1; }
      }

      /* Suggestions strip — fixed between messages and input, never scrolls away */
      .pg-chat-suggestions {
        flex-shrink: 0;                        /* never compressed by flex parent */
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 8px 12px 6px;
        border-top: 1px solid rgba(255,255,255,.06);
        background: rgba(0,0,0,.15);
        overflow-x: auto;                      /* horizontal scroll if chips overflow */
        scrollbar-width: none;                 /* hide scrollbar on suggestions strip */
      }
      .pg-chat-suggestions::-webkit-scrollbar { display: none; }
      .pg-chat-suggestions-label {
        width: 100%;
        font-size: 10.5px;
        color: #4b5563;
        margin-bottom: 3px;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        font-weight: 600;
      }
      .pg-chat-suggestion {
        background: rgba(79,70,229,.12);
        border: 1px solid rgba(79,70,229,.3);
        color: #a5b4fc;
        font-size: 11.5px;
        border-radius: 20px;
        padding: 5px 11px;
        cursor: pointer;
        transition: all .15s;
        white-space: nowrap;
        flex-shrink: 0;
        width: auto;
        line-height: 1.4;
      }
      .pg-chat-suggestion:hover {
        background: rgba(79,70,229,.3);
        border-color: rgba(79,70,229,.65);
        color: #c7d2fe;
        transform: translateY(-1px);
      }
      .pg-chat-suggestion:active {
        transform: translateY(0);
        background: rgba(79,70,229,.4);
      }

      /* Input area */
      .pg-chat-input-row {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        padding: 10px 12px 12px;
        border-top: 1px solid rgba(255,255,255,.07);
        background: rgba(0,0,0,.2);
        flex-shrink: 0;
      }
      #pg-chat-input {
        flex: 1;
        background: rgba(255,255,255,.06);
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 12px;
        color: #f9fafb;
        font-size: 13px;
        font-family: 'Inter', sans-serif;
        padding: 9px 12px;
        resize: none;
        outline: none;
        line-height: 1.4;
        max-height: 100px;
        overflow-y: auto;
        transition: border-color .15s;
      }
      #pg-chat-input:focus { border-color: rgba(79,70,229,.5); }
      #pg-chat-input::placeholder { color: #4b5563; }
      #pg-chat-send {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        border: none;
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: transform .15s, opacity .15s;
        padding: 0;
      }
      #pg-chat-send:hover { transform: scale(1.05); }
      #pg-chat-send:disabled { opacity: .4; cursor: default; transform: none; }
      #pg-chat-send svg { width: 16px; height: 16px; fill: #fff; }

      /* Mobile */
      @media (max-width: 480px) {
        #pg-chat-window {
          bottom: 0; right: 0; left: 0;
          width: 100%;
          max-width: 100%;
          height: 70vh;
          border-radius: 20px 20px 0 0;
        }
        #pg-chat-trigger { bottom: 20px; right: 20px; }
      }
    `;
    document.head.appendChild(style);

    // Build DOM
    const trigger = document.createElement('button');
    trigger.id = 'pg-chat-trigger';
    trigger.setAttribute('aria-label', 'Open Poly-Glot chat assistant');
    trigger.innerHTML = `
      <span class="pg-chat-icon-open">🦜</span>
      <span class="pg-chat-icon-close" style="color:#9ca3af;font-size:20px;">✕</span>
      <span id="pg-chat-badge">1</span>
    `;

    const win = document.createElement('div');
    win.id = 'pg-chat-window';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', 'Poly-Glot chat assistant');
    win.innerHTML = `
      <div class="pg-chat-header">
        <div class="pg-chat-header-avatar">🦜</div>
        <div class="pg-chat-header-info">
          <div class="pg-chat-header-name">Poly-Glot Assistant</div>
          <div class="pg-chat-header-status">
            <span class="pg-chat-status-dot"></span> Online · Ask me anything
          </div>
        </div>
        <button class="pg-chat-header-close" id="pg-chat-close" aria-label="Close chat">✕</button>
      </div>
      <div class="pg-chat-messages" id="pg-chat-messages" role="log" aria-live="polite"></div>
      <div class="pg-chat-suggestions" id="pg-chat-suggestions"></div>
      <div class="pg-chat-input-row">
        <textarea
          id="pg-chat-input"
          placeholder="Ask about features, pricing, how to use…"
          rows="1"
          aria-label="Chat message"
        ></textarea>
        <button id="pg-chat-send" aria-label="Send message" disabled>
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    `;

    document.body.appendChild(trigger);
    document.body.appendChild(win);

    return { trigger, win };
  }

  // ── Controller ──────────────────────────────────────────────────────────────

  function init() {
    if (document.getElementById('pg-chat-trigger')) return; // already mounted

    const { trigger, win } = buildWidget();
    const messagesEl   = document.getElementById('pg-chat-messages');
    const inputEl      = document.getElementById('pg-chat-input');
    const sendBtn      = document.getElementById('pg-chat-send');
    const closeBtn     = document.getElementById('pg-chat-close');
    const suggestionsEl = document.getElementById('pg-chat-suggestions');
    const badge        = document.getElementById('pg-chat-badge');

    let isOpen    = false;
    let isBusy    = false;
    let history   = []; // { role, content } for AI context
    let hasOpened = false;

    // Render suggestion chips — always visible in the fixed strip above input
    function renderSuggestions(items) {
      suggestionsEl.innerHTML = '';
      const label = document.createElement('div');
      label.className = 'pg-chat-suggestions-label';
      label.textContent = 'Suggested questions';
      suggestionsEl.appendChild(label);
      items.forEach(text => {
        const btn = document.createElement('button');
        btn.className = 'pg-chat-suggestion';
        btn.textContent = text;
        btn.addEventListener('click', () => {
          sendMessage(text);
        });
        suggestionsEl.appendChild(btn);
      });
    }

    // Append a message bubble into the scrollable messages area
    function appendMessage(role, htmlContent) {
      const wrapper = document.createElement('div');
      wrapper.className = `pg-chat-msg ${role}`;
      const bubble = document.createElement('div');
      bubble.className = 'pg-chat-bubble';
      bubble.innerHTML = htmlContent;
      wrapper.appendChild(bubble);
      messagesEl.appendChild(wrapper);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return wrapper;
    }

    // Typing indicator
    function showTyping() {
      const el = document.createElement('div');
      el.className = 'pg-chat-msg bot pg-chat-typing';
      el.id = 'pg-chat-typing';
      el.innerHTML = `<div class="pg-chat-bubble">
        <span class="pg-chat-dot"></span>
        <span class="pg-chat-dot"></span>
        <span class="pg-chat-dot"></span>
      </div>`;
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function hideTyping() {
      const el = document.getElementById('pg-chat-typing');
      if (el) el.remove();
    }

    // Core: send a message and get a reply
    async function sendMessage(text) {
      text = text.trim();
      if (!text || isBusy) return;

      isBusy = true;
      sendBtn.disabled = true;
      inputEl.value = '';
      inputEl.style.height = 'auto';

      appendMessage('user', escHtml(text));
      showTyping();

      let answer = null;

      // 1. Try AI if key is configured
      answer = await askAI(text, history);

      // 2. Fall back to rule-based
      if (!answer) {
        answer = ruleBasedAnswer(text);
      }

      // 3. Generic fallback
      if (!answer) {
        answer = `I'm not sure about that specific question. Here are some things I can help with:\n\n- Getting started with Poly-Glot\n- Supported languages and comment styles\n- VS Code extension setup\n- MCP server configuration\n- Pricing and Pro features\n- API key setup\n\nOr visit [poly-glot.ai](https://poly-glot.ai) for full documentation.`;
      }

      // Update history for AI context
      history.push({ role: 'user', content: text });
      history.push({ role: 'assistant', content: answer });
      if (history.length > 20) history = history.slice(-20);

      hideTyping();
      appendMessage('bot', renderMarkdown(answer));

      // Keep suggestions always visible after every reply
      renderSuggestions(SUGGESTIONS);

      isBusy = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }

    // Open / close
    function openChat() {
      isOpen = true;
      win.classList.add('visible');
      trigger.classList.add('open');
      badge.classList.add('hidden');
      inputEl.focus();

      // Greet on first open
      if (!hasOpened) {
        hasOpened = true;
        const greetings = [
          "Hey! 👋 How can I help you with Poly-Glot today?",
          "Hi there! 🦜 What would you like to know about Poly-Glot?",
          "Hello! I'm the Poly-Glot assistant. What can I help you with?",
        ];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        setTimeout(() => {
          appendMessage('bot', greeting);
          renderSuggestions(SUGGESTIONS);
        }, 120);
      }
    }

    function closeChat() {
      isOpen = false;
      win.classList.remove('visible');
      trigger.classList.remove('open');
    }

    trigger.addEventListener('click', () => isOpen ? closeChat() : openChat());
    closeBtn.addEventListener('click', closeChat);

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) closeChat();
    });

    // Auto-resize textarea
    inputEl.addEventListener('input', () => {
      sendBtn.disabled = !inputEl.value.trim();
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
    });

    // Send on Enter (Shift+Enter = newline)
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) sendMessage(inputEl.value);
      }
    });

    sendBtn.addEventListener('click', () => sendMessage(inputEl.value));
  }

  // Mount after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
