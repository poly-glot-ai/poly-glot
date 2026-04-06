/**
 * Poly-Glot Chat Assistant v5
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes in v5:
 *  1. Parrot emoji rendered directly in button — no SVG wrapper eating it
 *  2. All rule patterns audited & tightened — no more cross-firing
 *  3. New UI-navigation rules: where/how/what/when questions about the site
 *  4. Suggestions pool updated to include navigation questions
 *  5. Correct answers for every suggested question (models ≠ languages etc.)
 *  6. Copilot badge answer added
 *
 * Zero external dependencies. Pure vanilla JS.
 */
(function () {
  'use strict';

  // ─── Knowledge base (AI system prompt) ───────────────────────────────────────

  const KNOWLEDGE = `
You are the Poly-Glot AI assistant embedded on poly-glot.ai.
Be friendly, concise, and specific. Use bullet points for lists.
Keep answers under 180 words unless the question genuinely needs more detail.
Only answer questions about Poly-Glot features, pricing, setup, languages, usage, and how to navigate the site.
If a question is completely unrelated to Poly-Glot, respond ONLY with the exact token: __UNRELATED__

== SITE NAVIGATION (where things are located) ==
- API key / AI Settings: Click the ⚙️ gear icon in the top-right of the page → "AI Settings" modal opens
- Generate Comments button: In the main code editor panel on the homepage, below the code input area
- Language selector: Dropdown in the generator panel, above the code editor
- Comment type selector (Doc / WHY / Both): Radio buttons or tabs in the generator panel
- Pricing section: Scroll down the homepage OR click any "See plans" / "Upgrade to Pro" link → jumps to #pg-pricing-section
- Sign In button: Top-right of the navigation bar
- VS Code Extension install: Click "VS Code Extension" in the footer, or search "Poly-Glot" in VS Code Extensions (Cmd+Shift+X)
- CLI install: Click "CLI on npm" in the footer, or run: npm install -g poly-glot-ai-cli
- MCP server install: npx poly-glot-mcp, or see the MCP section on the homepage
- Explain Code button: In the generator panel, next to Generate Comments
- Download button: Appears in the output panel after generation (Pro feature)
- Test Connection button: Inside the ⚙️ AI Settings modal, below the API key field
- Promo code field: On the pricing/checkout page when upgrading to Pro

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

== SUPPORTED LANGUAGES (12 total) ==
JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin

== SUPPORTED AI MODELS ==
- OpenAI: GPT-4.1-mini (recommended, cheapest), GPT-4.1, GPT-4.1-nano, GPT-4o, o3, o1, and any custom model ID
- Anthropic: Claude Sonnet 4 (recommended), Claude Opus 4, Claude Haiku 4, and any custom model ID
- You bring your own API key — costs go directly to OpenAI/Anthropic, no markup
- Custom model IDs: type any valid model ID in the AI Settings modal

== PRICING ==
- Free tier: doc-comments, Explain Code, JS/TS/Python/Java, 50 files/month
- Pro: $9/month — WHY-comments, Both mode, all 12 languages, unlimited files
- Promo code EARLYBIRD3 = 50% off your first 3 months on Pro
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
- Click Test Connection in AI Settings modal to verify your API key instantly

== PRIVACY & SECURITY ==
- API keys stored locally in browser localStorage or OS keychain (VS Code) — never sent to Poly-Glot servers
- Your code goes directly from your browser to OpenAI/Anthropic — Poly-Glot never sees it
- No telemetry, no data collection, no backend that touches your code
- You own your data. Always.

== GETTING STARTED ==
1. Go to poly-glot.ai
2. Click the ⚙️ gear icon (top-right) → AI Settings
3. Choose OpenAI or Anthropic, paste your API key, pick a model
4. Paste code in the editor
5. Click "Generate Comments"
`.trim();

  // ─── Rule-based engine ────────────────────────────────────────────────────────
  // Rules are tested IN ORDER — more specific rules come first.
  // Each pattern is carefully scoped to avoid cross-firing.

  const RULES = [
    // ── UI NAVIGATION ─────────────────────────────────────────────────────────

    {
      // "where do I add my api key" / "where is the api key field" / "how do I enter my key"
      patterns: [/where.{0,30}(api.?key|key|settings|configure|setup|add.*key|enter.*key)/i,
                 /how.{0,20}(add|enter|set|configure|find).{0,20}(api.?key|key|provider)/i,
                 /api.?key.{0,30}(where|find|add|enter|set|go|put)/i],
      answer: `**Your API key lives in AI Settings:**\n\n1. Look for the **⚙️ gear icon** in the top-right of the page\n2. Click it → the **AI Settings** modal opens\n3. Choose **OpenAI** or **Anthropic**\n4. Paste your API key in the field\n5. Pick a model → click **Test Connection** to verify\n\nYour key is saved locally — Poly-Glot never sees it.\n\nGet a key: [OpenAI →](https://platform.openai.com/api-keys) · [Anthropic →](https://console.anthropic.com/settings/keys)`,
    },
    {
      // "where is the generate button" / "how do I generate comments" / "where do I paste my code"
      patterns: [/where.{0,30}(generate|paste|code|editor|input)/i,
                 /how.{0,20}(generate|run|create|make).{0,20}(comment|doc|documentation)/i,
                 /where.{0,20}(button|editor|panel)/i],
      answer: `**Generating comments is 3 steps:**\n\n1. **Paste your code** into the editor on the homepage\n2. Choose your **language** and **comment type** (Doc / WHY / Both) from the dropdowns above the editor\n3. Click **Generate Comments** ↓\n\nThe documented code appears in the output panel on the right. Use **Copy** or **Download** to grab it.\n\n💡 Need to set up your API key first? Click the **⚙️ gear icon** top-right.`,
    },
    {
      // "where is pricing" / "where do I upgrade" / "how do I get pro" / "where is the promo code"
      patterns: [/where.{0,30}(pric|plan|pro|upgrade|promo|earlybird|pay|billing)/i,
                 /how.{0,20}(upgrade|get pro|buy pro|subscribe)/i,
                 /where.{0,20}(promo|coupon|discount|code)/i],
      answer: `**Pricing is at the bottom of the homepage:**\n\n- Scroll down to the **Pricing** section, or\n- Click any **"Upgrade to Pro"** or **"See plans"** link\n\n💎 **Pro is $9/month** — WHY-comments, Both mode, all 12 languages, unlimited files\n\n🎉 Use promo code **EARLYBIRD3** for **50% off your first 3 months** — enter it on the checkout page.\n\n[Jump to pricing →](https://poly-glot.ai/#pg-pricing-section)`,
    },
    {
      // "where is sign in" / "where do I log in" / "where is my account"
      patterns: [/where.{0,30}(sign.?in|log.?in|login|account|sign.?up)/i,
                 /how.{0,20}(sign.?in|log.?in|login|sign.?up|register)/i],
      answer: `**Sign In is in the top navigation bar:**\n\n- Look for the **Sign In** button in the top-right corner of the page\n- Click it → enter your email → a **magic link** is sent to your inbox\n- Click the link in the email to sign in instantly (no password needed)\n\nDon't see the email? Check your spam folder. The link expires in 15 minutes.`,
    },
    {
      // "where is test connection" / "how do I test my key"
      patterns: [/where.{0,30}(test|verify|check|validate).{0,20}(connect|key|api)/i,
                 /how.{0,20}(test|verify|check|validate).{0,20}(key|connect|api)/i,
                 /test.?connection.{0,20}(where|find|how|button)/i],
      answer: `**Test Connection is inside AI Settings:**\n\n1. Click the **⚙️ gear icon** (top-right)\n2. Add your API key\n3. Click **Test Connection** — it calls \`GET /v1/models\`, a free read-only endpoint\n4. ✅ Green = key is valid · ❌ Red = key is wrong or expired\n\n**Zero tokens burned** — works even with a $0 balance.`,
    },
    {
      // "where is the language selector" / "how do I change the language"
      patterns: [/where.{0,30}(language|lang).{0,20}(select|choose|change|pick|set|drop)/i,
                 /how.{0,20}(change|select|pick|choose|set).{0,20}(language|lang)/i,
                 /where.{0,20}(select|choose|pick).{0,20}(language|lang)/i],
      answer: `**The language dropdown is in the generator panel:**\n\n- It's the dropdown **above the code editor** on the homepage\n- Choose from **12 languages**: JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin\n\nPoly-Glot auto-detects the right comment style for each language (JSDoc, PyDoc, Javadoc, etc.).`,
    },
    {
      // "where is explain code" / "how does explain work"
      patterns: [/where.{0,30}explain/i,
                 /how.{0,20}(use|work|find|access).{0,20}explain/i],
      answer: `**Explain Code is next to the Generate button:**\n\n- In the **generator panel** on the homepage, look for the **Explain** button beside Generate Comments\n- In **VS Code**: select code → **Cmd+Shift+E**\n- In **Copilot Chat**: \`@poly-glot /explain\`\n\nIt returns:\n- Plain-English summary\n- Complexity score (1–10)\n- Bug list & refactoring suggestions\n- Documentation quality score (0–100)`,
    },
    {
      // "where is the download button" / "how do I download the output"
      patterns: [/where.{0,30}download/i,
                 /how.{0,20}(download|save|export).{0,20}(output|code|result|comment)/i],
      answer: `**The Download button appears after generation:**\n\n1. Generate your comments\n2. In the **output panel** (right side), the **⬇️ Download** button appears\n3. Click it to save the documented file\n\n⚠️ Download is a **Pro feature**. Upgrade at [poly-glot.ai/#pg-pricing-section](https://poly-glot.ai/#pg-pricing-section) — use code **EARLYBIRD3** for 50% off your first 3 months.`,
    },

    // ── FEATURES & HOW-TO ──────────────────────────────────────────────────────

    {
      // "how do I get started" / "first time" / "how to use"
      // Deliberately AFTER the specific navigation rules above
      patterns: [/^(how.{0,10}(get.?start|do i start|begin|use poly|use this)|first.?time|getting.?start|set.?up poly)/i],
      answer: `**Getting started in 60 seconds:**\n\n1. Click the **⚙️ gear icon** (top-right) → AI Settings\n2. Choose **OpenAI** or **Anthropic**\n3. Paste your API key → click **Test Connection**\n4. Back on the homepage — paste code in the editor\n5. Choose language + comment type → **Generate Comments**\n\nNeed an API key? [OpenAI →](https://platform.openai.com/api-keys) · [Anthropic →](https://console.anthropic.com/settings/keys)`,
    },
    {
      // MCP server questions
      patterns: [/\bmcp\b|model.?context.?protocol|poly.?glot.?mcp|goose|windsurf|cursor.{0,20}(poly|mcp)|claude.?desktop/i],
      answer: `**Poly-Glot MCP Server** is live on npm!\n\nAdd to your MCP client config:\n\`\`\`json\n{\n  "command": "npx",\n  "args": ["-y", "poly-glot-mcp"],\n  "env": {\n    "POLYGLOT_PROVIDER": "openai",\n    "POLYGLOT_API_KEY": "sk-..."\n  }\n}\`\`\`\n\n**6 tools:** doc-comments, why-comments, both, explain, list-languages, list-models\n**Works with:** Goose, Claude Desktop, Cursor, Windsurf\n\n[Full docs on npm →](https://www.npmjs.com/package/poly-glot-mcp)`,
    },
    {
      // VS Code extension — NOT triggered by "model" or "provider" alone
      patterns: [/\bvs.?code\b|\bvscode\b|marketplace.*extension|extension.*marketplace|cmd\+shift|install.*extension|extension.*install/i],
      answer: `**VS Code Extension** is on the marketplace!\n\n- Search **"Poly-Glot"** in Extensions (**Cmd+Shift+X**)\n- **Cmd+Shift+/** — doc-comments inline\n- **Cmd+Shift+W** — WHY-comments (Pro)\n- **Cmd+Shift+B** — both passes (Pro)\n- **Cmd+Shift+E** — deep code analysis\n\nAPI key stored in OS keychain — never in settings.json.\n\n[Install free →](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)`,
    },
    {
      // CLI — only when explicitly about CLI/terminal/npm commands
      patterns: [/\bcli\b|command.?line|terminal.*poly|poly.*terminal|\bnpx\b.*poly|poly.*\bnpm\b|install.*poly.*cli|poly.*cli/i],
      answer: `**Poly-Glot CLI** on npm:\n\`\`\`bash\nnpm install -g poly-glot-ai-cli\npoly-glot comment file.js\npoly-glot why file.py\npoly-glot both src/\npoly-glot explain file.ts\n\`\`\`\nSet your key: \`export POLYGLOT_API_KEY=sk-...\`\n\n[npm →](https://www.npmjs.com/package/poly-glot-ai-cli)`,
    },
    {
      // WHY-comments — tightly scoped
      patterns: [/\bwhy.?comment|\bwhy.?mode\b|reasoning comment|intent comment|trade.?off comment|what.*why.*comment|why.*vs.*doc/i],
      answer: `**WHY-comments** explain *why* code was written a certain way — not just what it does.\n\nThey cover:\n- Non-obvious trade-offs\n- Edge-case reasoning\n- Algorithm choices\n- Business constraints\n\nExample:\n\`// Using a Map here instead of nested loops — O(n) vs O(n²) at scale\`\n\n**WHY-comments are a Pro feature.** Use code **EARLYBIRD3** for 50% off your first 3 months → [poly-glot.ai](https://poly-glot.ai/#pg-pricing-section)`,
    },
    {
      // Pricing — scoped to pricing/cost/pro/plan words, not "model" or "language"
      patterns: [/\bpric(e|ing)\b|\bcost\b|\bpro\b.{0,20}(plan|feature|tier|month|\$)|\bfree.?tier\b|\bsubscri|\bearlybird\b|\bupgrade\b|\b\$9\b|how much/i],
      answer: `**Pricing:**\n\n🆓 **Free** — doc-comments, Explain Code, JS/TS/Python/Java, 50 files/month\n💎 **Pro** — $9/month — WHY-comments, Both mode, all 12 languages, unlimited\n\n🎉 Use code **EARLYBIRD3** for **50% off your first 3 months!**\n\n[See plans →](https://poly-glot.ai/#pg-pricing-section)`,
    },
    {
      // Supported languages — only when asking about languages/programming languages
      patterns: [/what.{0,20}language|which.{0,20}language|supported.{0,20}language|language.{0,20}support|\blanguages\b.{0,20}(list|available|support|work)/i],
      answer: `**12 supported languages:**\n\nJavaScript · TypeScript · Python · Java · C++ · C# · Go · Rust · Ruby · PHP · Swift · Kotlin\n\nEach uses its native comment standard:\nJSDoc · Javadoc · PyDoc · Doxygen · XML docs · GoDoc · Rustdoc · YARD · PHPDoc · KDoc · Swift markup`,
    },
    {
      // AI models — only when asking about models specifically, NOT languages
      patterns: [/what.{0,20}model|which.{0,20}model|supported.{0,20}model|model.{0,20}(list|available|support|work|use)|gpt.?4|claude|openai.*model|anthropic.*model|custom.*model/i],
      answer: `**Supported AI models:**\n\n**OpenAI:**\n- GPT-4.1 Mini ⭐ (recommended — fast & cheap)\n- GPT-4.1, GPT-4.1 Nano, GPT-4o, o3, o1\n- Any custom model ID\n\n**Anthropic:**\n- Claude Sonnet 4 ⭐ (recommended)\n- Claude Opus 4, Claude Haiku 4\n- Any custom model ID\n\nSet your model in **⚙️ AI Settings** → model dropdown. Type any valid ID for custom models.`,
    },
    {
      // API key setup — scoped to key setup, not location (location handled above)
      patterns: [/\bapi.?key\b.{0,40}(get|obtain|create|generate|need|require|what is|explain)/i,
                 /(get|obtain|create).{0,20}\bapi.?key\b/i,
                 /\bopenai\b.{0,20}(key|account|sign.?up)/i,
                 /\banthopic\b.{0,20}(key|account|sign.?up)/i],
      answer: `**Poly-Glot uses your own API key:**\n\n- **OpenAI key:** [platform.openai.com/api-keys →](https://platform.openai.com/api-keys)\n- **Anthropic key:** [console.anthropic.com/settings/keys →](https://console.anthropic.com/settings/keys)\n\nOnce you have it:\n1. Click **⚙️ AI Settings** (top-right)\n2. Paste key → click **Test Connection**\n\nYour key goes **directly to OpenAI/Anthropic** — Poly-Glot never sees it.`,
    },
    {
      // Privacy — specifically about privacy/data/security of CODE and keys
      patterns: [/\bprivat|is my code (safe|secure|private|sent|shared)|does poly.?glot (see|store|collect|send|share)|my (code|data).{0,30}(safe|private|secure|sent|stored)|data.{0,20}(collect|telemetry|privacy|safe)|who (sees|has|gets).{0,20}(code|key|data)/i],
      answer: `**Your code and keys are 100% private:**\n\n- 🔑 API keys stored **locally** in your browser — never sent to Poly-Glot\n- 📡 Your code goes **directly** from your browser → OpenAI/Anthropic\n- 🚫 Zero telemetry · zero data collection\n- 🏠 Poly-Glot has **no backend** that ever touches your code\n\nYou own your data. Always.`,
    },
    {
      // Test connection — scoped
      patterns: [/test.?connection|validate.{0,20}key|verify.{0,20}key|check.{0,20}(api.?)?key|key.{0,20}(valid|work|correct|wrong|bad)/i],
      answer: `**Test Connection** validates your key for free:\n\n- Calls \`GET /v1/models\` — a read-only endpoint\n- **Zero tokens burned** — works even with $0 balance\n- ✅ Green = valid · ❌ Red = invalid/expired\n\nFind it in **⚙️ AI Settings** modal → below the API key field.`,
    },
    {
      // Explain Code feature
      patterns: [/explain.?code|code.?explain|\bexplain\b.{0,20}(feature|button|what|how|work)|what.{0,20}explain.{0,20}(do|does|mean)/i],
      answer: `**Explain Code** gives a deep analysis of any code:\n\n- 📝 Plain-English summary\n- 🔢 Complexity score (1–10)\n- 🔍 Function-by-function breakdown\n- 🐛 Potential bugs list\n- ♻️ Refactoring suggestions\n- 📊 Documentation quality score (0–100)\n\n**Where:** Generator panel → **Explain** button (web) · **Cmd+Shift+E** (VS Code) · \`@poly-glot /explain\` (Copilot Chat)`,
    },
    {
      // Copilot Chat integration
      patterns: [/copilot|@poly.?glot|copilot.?chat|chat.?participant|github.?copilot/i],
      answer: `**GitHub Copilot Chat integration is built in!**\n\nIn VS Code with GitHub Copilot:\n- \`@poly-glot /comment\` — doc-comments\n- \`@poly-glot /why\` — WHY-comments (Pro)\n- \`@poly-glot /both\` — both passes (Pro)\n- \`@poly-glot /explain\` — deep analysis\n\nRequires VS Code v1.95+ and GitHub Copilot.\n\n[Install Extension →](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)`,
    },
    {
      // Getting started — catch-all after specific rules
      patterns: [/get.?start|how.{0,10}(to use|do i use|use this|begin)|first.?time|set.?up|quick.?start/i],
      answer: `**Getting started in 60 seconds:**\n\n1. Click the **⚙️ gear icon** (top-right) → AI Settings\n2. Choose **OpenAI** or **Anthropic**\n3. Paste your API key → click **Test Connection**\n4. Back on the homepage — paste code in the editor\n5. Choose language + comment type → **Generate Comments**\n\nNeed an API key? [OpenAI →](https://platform.openai.com/api-keys) · [Anthropic →](https://console.anthropic.com/settings/keys)`,
    },
  ];

  function ruleBasedAnswer(q) {
    for (const rule of RULES) {
      if (rule.patterns.some(p => p.test(q))) return rule.answer;
    }
    return null;
  }

  // ─── Branded fallback ─────────────────────────────────────────────────────────

  const BRANDED_FALLBACK = '__BRANDED_FALLBACK__';

  function brandedFallbackHTML() {
    return `<div class="pg-chat-fallback">
      <div class="pg-chat-fallback-icon">🦜</div>
      <div class="pg-chat-fallback-text">
        <strong>That one's outside my territory!</strong><br>
        I'm scoped to Poly-Glot topics — here's what I can help with:
      </div>
      <ul class="pg-chat-fallback-list">
        <li>📍 Finding things on the site (where is…?)</li>
        <li>🚀 Getting started &amp; setup</li>
        <li>💬 Comment types (Doc, WHY, Both)</li>
        <li>🌐 Languages &amp; AI models</li>
        <li>🔌 VS Code · CLI · MCP · Copilot Chat</li>
        <li>💳 Pricing &amp; Pro features</li>
        <li>🔒 Privacy &amp; API key security</li>
      </ul>
      <a href="https://poly-glot.ai" target="_blank" rel="noopener" class="pg-chat-fallback-link">
        Visit poly-glot.ai for full docs ↗
      </a>
    </div>`;
  }

  // ─── Markdown renderer ────────────────────────────────────────────────────────

  function renderMarkdown(text) {
    return text
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
        `<pre class="pg-chat-code"><code>${escHtml(code.trim())}</code></pre>`)
      .replace(/`([^`]+)`/g, (_, c) =>
        `<code class="pg-chat-inline-code">${escHtml(c)}</code>`)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener" class="pg-chat-link">$1 ↗</a>')
      .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)+/g, m => `<ul class="pg-chat-list">${m}</ul>`)
      .replace(/\n{2,}/g, '</p><p class="pg-chat-p">')
      .replace(/\n/g, '<br>');
  }

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
          body:    JSON.stringify({ model, messages, max_tokens: 400, temperature: 0.3 }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content?.trim() || null;
        return reply === '__UNRELATED__' ? BRANDED_FALLBACK : reply;

      } else if (provider === 'anthropic') {
        const model       = localStorage.getItem('polyglot_ai_model') || 'claude-haiku-4-5';
        const sysmsg      = messages.find(m => m.role === 'system')?.content || '';
        const anthropicMs = messages.filter(m => m.role !== 'system');
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key':    apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({ model, max_tokens: 400, system: sysmsg, messages: anthropicMs }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const reply = data.content?.[0]?.text?.trim() || null;
        return reply === '__UNRELATED__' ? BRANDED_FALLBACK : reply;
      }
    } catch (_) { return null; }
    return null;
  }

  // ─── Suggestions pool ─────────────────────────────────────────────────────────
  // Mix of feature questions AND navigation questions

  const SUGGESTIONS = [
    'Where do I add my API key?',
    'How do I generate comments?',
    'What AI models are supported?',
    'What languages are supported?',
    'Where is the pricing?',
    'Is my code private?',
    "What's the difference between Doc and WHY comments?",
    'How do I install the VS Code extension?',
    'Where is the Explain Code button?',
    'How does the MCP server work?',
    'How much does Pro cost?',
    'Where do I enter a promo code?',
    'How do I test my API key?',
    'How do I use the CLI?',
  ];

  let suggestionIndex = Math.floor(Math.random() * SUGGESTIONS.length);
  function nextSuggestion() {
    suggestionIndex = (suggestionIndex + 1) % SUGGESTIONS.length;
    return SUGGESTIONS[suggestionIndex];
  }

  // ─── CSS ──────────────────────────────────────────────────────────────────────

  const CSS = `
    #pg-chat-trigger {
      position: fixed;
      bottom: 28px; right: 28px;
      width: 56px; height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border: none;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(79,70,229,.5), 0 2px 8px rgba(0,0,0,.3);
      z-index: 9998;
      transition: transform .2s, box-shadow .2s, background .2s;
      padding: 0;
      font-size: 26px;
      line-height: 1;
      /* Ensure emoji renders, not clipped by overflow */
      overflow: visible;
    }
    #pg-chat-trigger:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 6px 28px rgba(79,70,229,.65), 0 3px 12px rgba(0,0,0,.35);
    }
    #pg-chat-trigger.open {
      background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
      font-size: 20px;
    }
    /* Badge */
    #pg-chat-badge {
      position: absolute; top: -3px; right: -3px;
      width: 18px; height: 18px;
      background: #ef4444; border-radius: 50%;
      font-size: 10px; font-weight: 700; color: #fff;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #0d0e1a;
      pointer-events: none;
    }
    #pg-chat-badge.hidden { display: none; }

    /* Window */
    #pg-chat-window {
      position: fixed;
      bottom: 96px; right: 28px;
      width: 384px; max-width: calc(100vw - 32px);
      height: 540px; max-height: calc(100vh - 120px);
      background: #13141f;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 16px;
      box-shadow: 0 24px 60px rgba(0,0,0,.7), 0 4px 16px rgba(79,70,229,.2);
      display: flex; flex-direction: column;
      overflow: hidden;
      z-index: 9997;
      opacity: 0; transform: translateY(16px) scale(.97);
      pointer-events: none;
      transition: opacity .22s ease, transform .22s ease;
    }
    #pg-chat-window.visible {
      opacity: 1; transform: translateY(0) scale(1);
      pointer-events: all;
    }

    /* Header */
    .pg-chat-header {
      display: flex; align-items: center; gap: 10px;
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
      font-size: 19px; flex-shrink: 0;
    }
    .pg-chat-header-info { flex: 1; min-width: 0; }
    .pg-chat-header-name { font-size: 13px; font-weight: 700; color: #f9fafb; line-height: 1.2; }
    .pg-chat-header-status {
      font-size: 11px; color: #6b7280;
      display: flex; align-items: center; gap: 4px; margin-top: 2px;
    }
    .pg-chat-status-dot {
      width: 6px; height: 6px; background: #34d399;
      border-radius: 50%; display: inline-block; flex-shrink: 0;
    }
    .pg-chat-header-close {
      background: none; border: none; color: #6b7280; cursor: pointer;
      padding: 6px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      transition: color .15s, background .15s;
      flex-shrink: 0; width: 30px; height: 30px;
    }
    .pg-chat-header-close:hover { color: #f9fafb; background: rgba(255,255,255,.1); }

    /* Messages */
    .pg-chat-messages {
      flex: 1; min-height: 0;
      overflow-y: auto; overflow-x: hidden;
      padding: 16px 14px 10px;
      display: flex; flex-direction: column; gap: 10px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,.1) transparent;
      overscroll-behavior: contain;
    }
    .pg-chat-messages::-webkit-scrollbar { width: 4px; }
    .pg-chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 2px; }

    /* Bubbles */
    .pg-chat-msg {
      display: flex; flex-direction: column; max-width: 88%;
      animation: pg-msg-in .18s ease both;
    }
    @keyframes pg-msg-in {
      from { opacity: 0; transform: translateY(7px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .pg-chat-msg.bot  { align-self: flex-start; }
    .pg-chat-msg.user { align-self: flex-end; }
    .pg-chat-bubble {
      padding: 9px 12px; border-radius: 14px;
      font-size: 13px; line-height: 1.55; word-break: break-word;
    }
    .pg-chat-msg.bot .pg-chat-bubble {
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.08);
      color: #e5e7eb; border-radius: 4px 14px 14px 14px;
    }
    .pg-chat-msg.user .pg-chat-bubble {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #fff; border-radius: 14px 4px 14px 14px;
    }
    .pg-chat-bubble strong { color: #f9fafb; }
    .pg-chat-list { margin: 6px 0 4px 16px; padding: 0; }
    .pg-chat-list li { margin-bottom: 3px; }
    .pg-chat-p { margin: 6px 0 0; }
    .pg-chat-code {
      background: rgba(0,0,0,.45); border: 1px solid rgba(255,255,255,.1);
      border-radius: 6px; padding: 8px 10px;
      font-size: 11.5px; overflow-x: auto; margin: 6px 0 2px;
      font-family: 'Fira Code','Menlo',monospace; color: #a5f3fc; white-space: pre;
    }
    .pg-chat-inline-code {
      background: rgba(0,0,0,.35); border: 1px solid rgba(255,255,255,.1);
      border-radius: 4px; padding: 1px 5px;
      font-size: 11.5px; font-family: 'Fira Code','Menlo',monospace; color: #a5f3fc;
    }
    .pg-chat-link { color: #818cf8; text-decoration: none; }
    .pg-chat-link:hover { text-decoration: underline; }

    /* Typing */
    .pg-chat-typing .pg-chat-bubble { display: flex; align-items: center; gap: 5px; padding: 11px 14px; }
    .pg-chat-dot {
      width: 7px; height: 7px; background: #6b7280; border-radius: 50%;
      animation: pg-dot-bounce .9s ease-in-out infinite; flex-shrink: 0;
    }
    .pg-chat-dot:nth-child(2) { animation-delay: .15s; }
    .pg-chat-dot:nth-child(3) { animation-delay: .30s; }
    @keyframes pg-dot-bounce {
      0%,80%,100% { transform: translateY(0); opacity: .4; }
      40%          { transform: translateY(-5px); opacity: 1; }
    }

    /* Branded fallback */
    .pg-chat-fallback { display: flex; flex-direction: column; gap: 7px; }
    .pg-chat-fallback-icon { font-size: 20px; line-height: 1; }
    .pg-chat-fallback-text { font-size: 13px; color: #e5e7eb; line-height: 1.5; }
    .pg-chat-fallback-list {
      margin: 2px 0 4px 2px; padding: 0; list-style: none;
      font-size: 12px; color: #9ca3af;
      display: flex; flex-direction: column; gap: 3px;
    }
    .pg-chat-fallback-link {
      display: inline-block; margin-top: 4px; font-size: 12px;
      color: #818cf8; text-decoration: none; font-weight: 600;
    }
    .pg-chat-fallback-link:hover { text-decoration: underline; }

    /* Suggestion strip */
    .pg-chat-suggestions {
      flex-shrink: 0; display: flex; align-items: center; gap: 8px;
      padding: 8px 12px 7px;
      border-top: 1px solid rgba(255,255,255,.06);
      background: rgba(0,0,0,.18);
      overflow: hidden;
    }
    .pg-chat-suggestions-label {
      font-size: 10px; color: #4b5563; letter-spacing: .04em;
      text-transform: uppercase; font-weight: 700;
      white-space: nowrap; flex-shrink: 0;
    }
    .pg-chat-suggestion {
      background: rgba(79,70,229,.13);
      border: 1px solid rgba(79,70,229,.35);
      color: #a5b4fc; font-size: 11.5px; border-radius: 20px;
      padding: 5px 12px; cursor: pointer; white-space: nowrap;
      flex-shrink: 0; line-height: 1.4; font-family: inherit;
      transition: background .14s, border-color .14s, color .14s, transform .14s;
      overflow: hidden; text-overflow: ellipsis; max-width: 260px;
    }
    .pg-chat-suggestion:hover {
      background: rgba(79,70,229,.3); border-color: rgba(79,70,229,.7);
      color: #c7d2fe; transform: translateY(-1px);
    }
    .pg-chat-suggestion:active { transform: translateY(0); background: rgba(79,70,229,.45); }
    .pg-chat-suggestion.populated {
      background: rgba(234,179,8,.15); border-color: rgba(234,179,8,.5); color: #fde68a;
    }

    /* Input row */
    .pg-chat-input-row {
      display: flex; align-items: flex-end; gap: 8px;
      padding: 10px 12px 14px;
      border-top: 1px solid rgba(255,255,255,.07);
      background: rgba(0,0,0,.22); flex-shrink: 0;
    }
    #pg-chat-input {
      flex: 1;
      background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12);
      border-radius: 12px; color: #f9fafb; font-size: 13px; font-family: inherit;
      padding: 9px 12px; resize: none; outline: none;
      line-height: 1.45; min-height: 38px; max-height: 100px;
      overflow-y: auto; transition: border-color .15s; box-sizing: border-box;
    }
    #pg-chat-input:focus { border-color: rgba(79,70,229,.6); }
    #pg-chat-input::placeholder { color: #4b5563; }

    /* Send button */
    #pg-chat-send {
      width: 38px; height: 38px; min-width: 38px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border: none; border-radius: 10px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; padding: 0;
      transition: transform .15s, opacity .15s, box-shadow .15s;
    }
    #pg-chat-send:hover:not(:disabled) {
      transform: scale(1.07); box-shadow: 0 3px 12px rgba(79,70,229,.55);
    }
    #pg-chat-send:disabled { opacity: .35; cursor: default; transform: none; }
    #pg-chat-send svg { width: 17px; height: 17px; display: block; flex-shrink: 0; }

    /* Mobile */
    @media (max-width: 480px) {
      #pg-chat-window {
        bottom: 0; right: 0; left: 0; width: 100%; max-width: 100%;
        height: 72vh; max-height: 100dvh; border-radius: 20px 20px 0 0;
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

    // Trigger — emoji rendered directly as button text, no SVG wrapper
    const trigger = document.createElement('button');
    trigger.id = 'pg-chat-trigger';
    trigger.setAttribute('aria-label', 'Open Poly-Glot chat assistant');
    trigger.setAttribute('data-state', 'closed');
    trigger.innerHTML = `<span id="pg-trigger-icon" aria-hidden="true">🦜</span><span id="pg-chat-badge">1</span>`;

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
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="pg-chat-messages" id="pg-chat-messages" role="log" aria-live="polite" aria-atomic="false"></div>
      <div class="pg-chat-suggestions" id="pg-chat-suggestions" aria-label="Suggested question"></div>
      <div class="pg-chat-input-row">
        <textarea id="pg-chat-input" placeholder="Ask where things are, how features work…" rows="1"
          aria-label="Chat message" autocomplete="off" spellcheck="true"></textarea>
        <button id="pg-chat-send" aria-label="Send message" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>`;

    document.body.appendChild(trigger);
    document.body.appendChild(win);
    return { trigger, win };
  }

  // ─── Controller ───────────────────────────────────────────────────────────────

  function init() {
    if (document.getElementById('pg-chat-trigger')) return;

    const { trigger, win } = buildWidget();
    const messagesEl    = document.getElementById('pg-chat-messages');
    const inputEl       = document.getElementById('pg-chat-input');
    const sendBtn       = document.getElementById('pg-chat-send');
    const closeBtn      = document.getElementById('pg-chat-close');
    const suggestionsEl = document.getElementById('pg-chat-suggestions');
    const badge         = document.getElementById('pg-chat-badge');
    const triggerIcon   = document.getElementById('pg-trigger-icon');

    let isOpen    = false;
    let isBusy    = false;
    let history   = [];
    let hasOpened = false;

    // Scroll isolation
    win.addEventListener('wheel',     e => e.stopPropagation(), { passive: true });
    win.addEventListener('touchmove', e => e.stopPropagation(), { passive: true });

    // Render one suggestion chip
    function renderSuggestion(text) {
      suggestionsEl.innerHTML = '';
      const label = document.createElement('span');
      label.className = 'pg-chat-suggestions-label';
      label.textContent = 'Try:';
      suggestionsEl.appendChild(label);

      const btn = document.createElement('button');
      btn.className = 'pg-chat-suggestion';
      btn.textContent = text;
      btn.title = text;
      btn.setAttribute('aria-label', `Suggested: ${text}`);
      btn.addEventListener('click', () => {
        if (isBusy) return;
        inputEl.value = text;
        inputEl.style.height = 'auto';
        inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
        sendBtn.disabled = false;
        btn.classList.add('populated');
        inputEl.focus();
        const l = inputEl.value.length;
        inputEl.setSelectionRange(l, l);
      });
      suggestionsEl.appendChild(btn);
    }

    function appendMessage(role, content, isHtml = false) {
      const wrap   = document.createElement('div');
      wrap.className = `pg-chat-msg ${role}`;
      const bubble = document.createElement('div');
      bubble.className = 'pg-chat-bubble';
      if (isHtml) bubble.innerHTML = content;
      else        bubble.textContent = content;
      wrap.appendChild(bubble);
      messagesEl.appendChild(wrap);
      scrollToBottom();
      return wrap;
    }

    function scrollToBottom() {
      requestAnimationFrame(() => { messagesEl.scrollTop = messagesEl.scrollHeight; });
    }

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

    async function sendMessage(text) {
      text = text.trim();
      if (!text || isBusy) return;

      isBusy = true;
      sendBtn.disabled = true;
      inputEl.value = '';
      inputEl.style.height = 'auto';

      const chip = suggestionsEl.querySelector('.pg-chat-suggestion');
      if (chip) chip.classList.remove('populated');

      appendMessage('user', text, false);
      showTyping();

      // 1 — AI (if key is configured)
      let answer = await askAI(text, history);

      // 2 — Rule-based (covers all nav + feature questions without a key)
      if (!answer) answer = ruleBasedAnswer(text);

      // 3 — Branded fallback
      const isFallback = !answer || answer === BRANDED_FALLBACK;

      hideTyping();

      if (isFallback) {
        appendMessage('bot', brandedFallbackHTML(), true);
      } else {
        appendMessage('bot', renderMarkdown(answer), true);
      }

      history.push({ role: 'user',      content: text });
      history.push({ role: 'assistant', content: isFallback ? '[out of scope]' : answer });
      if (history.length > 20) history = history.slice(-20);

      renderSuggestion(nextSuggestion());

      isBusy = false;
      sendBtn.disabled = !inputEl.value.trim();
      inputEl.focus();
    }

    function openChat() {
      isOpen = true;
      win.classList.add('visible');
      trigger.classList.add('open');
      triggerIcon.textContent = '✕';
      badge.classList.add('hidden');

      if (!hasOpened) {
        hasOpened = true;
        const greetings = [
          "Hey! 👋 I can help you find anything on the site or answer questions about Poly-Glot. What would you like to know?",
          "Hi there! 🦜 Ask me where things are, how features work, or anything about Poly-Glot!",
          "Hello! I'm the Poly-Glot assistant. Ask me where to find settings, how to generate comments, pricing — anything!",
        ];
        const g = greetings[Math.floor(Math.random() * greetings.length)];
        setTimeout(() => {
          appendMessage('bot', g, false);
          renderSuggestion(SUGGESTIONS[suggestionIndex]);
          scrollToBottom();
        }, 120);
      }
      setTimeout(() => inputEl.focus(), 180);
    }

    function closeChat() {
      isOpen = false;
      win.classList.remove('visible');
      trigger.classList.remove('open');
      triggerIcon.textContent = '🦜';
    }

    trigger.addEventListener('click', () => isOpen ? closeChat() : openChat());
    closeBtn.addEventListener('click', closeChat);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) closeChat(); });

    inputEl.addEventListener('input', () => {
      sendBtn.disabled = !inputEl.value.trim();
      const chip = suggestionsEl.querySelector('.pg-chat-suggestion');
      if (chip) chip.classList.remove('populated');
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
    });

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
