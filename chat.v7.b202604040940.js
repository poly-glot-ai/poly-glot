/**
 * Poly-Glot Chat Assistant v7
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes in v7 (Google / Gemini onboarding):
 *  1. KNOWLEDGE updated — Google provider, Gemini models, AI Studio docs
 *  2. New RULES: "google key", "gemini", "ai studio", "which provider", provider compare
 *  3. askAI() — added Google (Gemini) provider path via OpenAI-compat endpoint
 *  4. All "getting started" rules updated to mention OpenAI / Anthropic / Google
 *  5. API key rules include Google AI Studio link + AIza key format
 *  6. Models rule updated to include 4 Gemini models
 *  7. Greetings updated to mention Google
 *  8. Suggestions pool — 3 new Google/Gemini prompts added
 *
 * Changes in v6 (code-assist upgrade):
 *  1. KNOWLEDGE system prompt expanded — assistant now answers code questions:
 *     explain, debug/find bugs, refactor, write tests, JSDoc generation, and
 *     general code Q&A — framed as showcasing Poly-Glot capabilities
 *  2. CODE_ASSIST_KNOWLEDGE — separate prompt injected when code is detected
 *  3. detectCodeInMessage() — heuristic to identify when user pastes code
 *  4. askAI() — dynamically selects knowledge base (site vs code-assist)
 *     and raises max_tokens to 800 for code responses
 *  5. Rule-based engine — new code-assist rules added (before fallback)
 *  6. Suggestions pool — 4 new code-assist prompts added
 *  7. Fallback UI — code-assist capabilities listed
 *  8. Input placeholder updated to hint at code capabilities
 *  9. Greetings updated to mention code-assist mode
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
Answer questions about Poly-Glot features, pricing, setup, languages, usage, and how to navigate the site.
Also answer code questions: explain code, find bugs, suggest refactors, write tests, generate JSDoc/PyDoc/Javadoc comments, and general programming help — these showcase exactly what Poly-Glot does.
If a question is completely unrelated to both Poly-Glot AND code/programming, respond ONLY with the exact token: __UNRELATED__

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
6. GitHub App — install once, auto-documents every PR with inline review comments and a coverage check run

== GITHUB APP ==
- Install: github.com/apps/poly-glot-ai
- Triggers on every pull_request opened or synchronized
- Fetches changed files, analyzes documentation coverage, posts inline review comments
- Posts a summary review with avg coverage score and action links
- Creates a GitHub Check Run (pass/fail based on coverage_threshold)
- Each inline comment includes the full suggested documented file + deep-link to poly-glot.ai web editor
- Deep link opens poly-glot.ai with file code pre-loaded (base64 encoded in URL) and shows "Opened from GitHub PR Review" banner
- Configure via .polyglot.yml in repo root
- Key .polyglot.yml options: provider, model, mode (doc/why/both), coverage_threshold (default 0.5), max_files (default 15), max_file_size (default 50000 bytes), include/exclude (glob patterns), review_style (inline/summary), check_run (true/false)
- API key: add openai_api_key or anthropic_api_key to .polyglot.yml (or set OPENAI_API_KEY/ANTHROPIC_API_KEY env vars on server)
- If no API key found: posts a "Setup required" comment on the PR with instructions
- Supports all 12 languages, auto-detected from file extension
- Skips: deleted files, binary files, files over max_file_size, excluded patterns, files already meeting coverage threshold
- Privacy: code is fetched temporarily to generate docs, never stored; only reads changed PR files; permissions: pull_requests:write, checks:write, contents:read, metadata:read

== COMMENT TYPES ==
- Doc-comments: JSDoc (JS/TS), Javadoc (Java), PyDoc (Python), Doxygen (C++), XML docs (C#), GoDoc, Rustdoc, YARD (Ruby), PHPDoc, Swift markup, KDoc (Kotlin)
- WHY-comments: inline reasoning, trade-offs, non-obvious decisions (Pro)
- Both: two-pass generation — doc then WHY in one call (Pro)

== SUPPORTED LANGUAGES (12 total) ==
JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin

== SUPPORTED AI MODELS ==
OpenAI: GPT-4.1 (recommended), GPT-4.1 Mini (fast & cheap), GPT-4.1 Nano (cheapest), GPT-4o, GPT-4o Mini, o3, o3-mini, o1, o1-mini, GPT-4 Turbo, GPT-4, GPT-3.5 Turbo (legacy), plus any custom model ID
Anthropic: Claude Sonnet 4 (recommended), Claude Opus 4 (most powerful), Claude Haiku 4 (fast), Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus, Claude 3 Haiku (legacy), plus any custom model ID
Google: Gemini 2.5 Flash ✨ (recommended — best balance of speed/quality), Gemini 2.5 Pro (most powerful), Gemini 2.5 Flash Lite (cheapest), Gemini 2.0 Flash (stable GA release)
- You bring your own API key — costs go directly to OpenAI/Anthropic/Google, no markup
- Custom model IDs: type any valid model ID in the AI Settings modal

== GOOGLE / GEMINI SETUP ==
- Get a Google API key at: https://aistudio.google.com/app/apikey (free, no credit card required for free tier)
- Google AI Studio API keys start with "AIza" — they are different from OpenAI (sk-...) and Anthropic (sk-ant-...) keys
- In AI Settings: select "Google" as provider, paste your AIza... key, choose a Gemini model, click Test Connection
- The free tier of Google AI Studio has rate limits but no cost — great for trying out Poly-Glot
- Paid usage billed to your Google Cloud / AI Studio account
- Gemini 2.5 Flash is the recommended starting model — fast, accurate, and very affordable
- Gemini 2.5 Pro is the most powerful for complex codebases
- Gemini 2.5 Flash Lite is the cheapest option
- Gemini 2.0 Flash is a stable GA release, good for production use
- Google keys are validated via GET https://generativelanguage.googleapis.com/v1beta/models — zero tokens used
- The Generative Language API must be enabled in your Google Cloud project (AI Studio does this automatically)

== PROVIDER COMPARISON ==
OpenAI: Most popular, widest model selection, GPT-4.1 is great for documentation. Keys start with "sk-". Get at platform.openai.com/api-keys.
Anthropic: Claude models excel at following complex instructions and long context. Keys start with "sk-ant-". Get at console.anthropic.com/settings/keys.
Google: Gemini 2.5 Flash is very fast and affordable. Free tier available. Keys start with "AIza". Get at aistudio.google.com/app/apikey.
All three providers: your key goes directly from your browser to the provider — Poly-Glot never sees it.

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
- Click Test Connection in AI Settings modal to verify your API key instantly

== PRIVACY & SECURITY ==
- API keys stored locally in browser localStorage or OS keychain (VS Code) — never sent to Poly-Glot servers
- Your code goes directly from your browser to OpenAI, Anthropic, or Google — Poly-Glot never sees it
- No telemetry, no data collection, no backend that touches your code
- You own your data. Always.

== GETTING STARTED ==
1. Go to poly-glot.ai
2. Click the ⚙️ gear icon (top-right) → AI Settings
3. Choose OpenAI, Anthropic, or Google, paste your API key, pick a model
4. Paste code in the editor
5. Click "Generate Comments"

== WHERE TO GET API KEYS ==
- OpenAI: platform.openai.com/api-keys — key starts with "sk-"
- Anthropic: console.anthropic.com/settings/keys — key starts with "sk-ant-"
- Google (Gemini): aistudio.google.com/app/apikey — key starts with "AIza" — free tier available, no credit card required

== CODE ASSISTANT CAPABILITIES ==
You can help users directly with these code questions — this demonstrates what Poly-Glot does under the hood.
ALLOWED:
- Explain code: break down what a function or block does in plain English
- Find bugs: audit for edge cases, null checks, type errors, off-by-one errors, race conditions
- Suggest refactors: concrete improvements with before/after examples
- Write tests: generate unit tests (Jest, Pytest, JUnit, etc.) from function signatures
- Write WHY comments: explain intent, trade-offs, non-obvious decisions inline
- General code Q&A: answer language-specific questions, explain patterns, compare approaches

NOT ALLOWED — redirect to Poly-Glot tool:
- Do NOT generate full doc-comment blocks (JSDoc, PyDoc, Javadoc, etc.) for entire functions or files
- Do NOT generate full commented versions of pasted codebases or large code blocks
- If asked to document/comment code, explain that generating comments for code is what Poly-Glot does — direct them to use the tool at poly-glot.ai (free for JS/TS/Python/Java, Pro for all 12 languages)

When a user pastes code or asks a code question:
1. Answer it directly and helpfully (for allowed capabilities above)
2. If they want code commented/documented, redirect them warmly to poly-glot.ai — that's the product
3. Keep code examples in fenced code blocks with the language name
4. Be precise — name specific bugs, give specific fixes, not vague suggestions
5. After helping with a snippet, note that Poly-Glot can do this for entire files/codebases automatically
`.trim();

  // ─── Rule-based engine ────────────────────────────────────────────────────────
  // Rules are tested IN ORDER — more specific rules come first.
  // Each pattern is carefully scoped to avoid cross-firing.

  const RULES = [
    // ── UI NAVIGATION — most specific first, no overlapping patterns ───────────

    {
      // PROMO CODE — must come before pricing AND before api-key rules
      // matches: "where do I enter a promo code" / "where is the promo code field" / "earlybird"
      patterns: [
        /promo.?code|coupon|discount.?code|earlybird/i,
        /where.{0,40}(enter|put|add|use|apply).{0,20}code/i,
        /how.{0,20}(use|apply|redeem|enter).{0,20}(promo|coupon|discount|earlybird)/i,
      ],
      answer: `**Promo code field is on the checkout page:**\n\n1. Go to [poly-glot.ai/#pg-pricing-section](https://poly-glot.ai/#pg-pricing-section)\n2. Click **Upgrade to Pro**\n3. On the checkout page, enter your promo code in the **"Promo code"** field\n4. Click **Apply** — the discount is applied instantly\n\n🎉 Current code: **EARLYBIRD3** — Pro locked at **$9/mo forever** (expires May 1, 2026)`,
    },
    {
      // API KEY location — scoped tightly to "api key" or "ai settings", NOT just "key" or "enter"
      patterns: [
        /where.{0,30}api.?key/i,
        /where.{0,30}ai.?settings/i,
        /where.{0,30}(add|enter|put|paste|find).{0,20}(api|openai|anthropic).{0,10}key/i,
        /how.{0,20}(add|enter|set|configure|find|paste).{0,20}api.?key/i,
        /api.?key.{0,30}(where|find|add|enter|set|go|put)/i,
      ],
      answer: `**Your API key lives in AI Settings:**\n\n1. Click the **⚙️ gear icon** (top-right of the page)\n2. The **AI Settings** modal opens\n3. Choose **OpenAI**, **Anthropic**, or **Google**\n4. Paste your API key\n5. Pick a model → click **Test Connection**\n\nYour key is saved locally — Poly-Glot never sees it.\n\nGet a key: [OpenAI →](https://platform.openai.com/api-keys) · [Anthropic →](https://console.anthropic.com/settings/keys) · [Google AI Studio →](https://aistudio.google.com/app/apikey)`,
    },
    {
      // GENERATE COMMENTS — scoped to editor/generate, NOT "promo code" or "source code"
      patterns: [
        /where.{0,30}(generate.?comment|paste.?code|code.?editor|code.?input)/i,
        /where.{0,30}generate.{0,20}button/i,
        /how.{0,20}(generate|run|create).{0,20}(comment|doc|documentation)/i,
        /where.{0,20}(output.?panel|result.?panel|editor.?panel)/i,
      ],
      answer: `**Generating comments is 3 steps:**\n\n1. **Paste your code** into the editor on the homepage\n2. Choose your **language** and **comment type** (Doc / WHY / Both) from the dropdowns above the editor\n3. Click **Generate Comments** ↓\n\nThe documented code appears in the output panel on the right. Use **Copy** or **Download** to grab it.\n\n💡 Need to set up your API key first? Click the **⚙️ gear icon** top-right.`,
    },
    {
      // PRICING / UPGRADE / PRO — scoped, won't catch "promo code" (handled above)
      patterns: [
        /where.{0,30}(pricing|pric.?section|upgrade|billing|payment)/i,
        /how.{0,20}(upgrade|get.?pro|buy.?pro|subscribe)/i,
        /where.{0,20}(pro.?plan|free.?plan|plans)/i,
      ],
      answer: `**Pricing is at the bottom of the homepage:**\n\n- Scroll down to the **Pricing** section, or click any **"Upgrade to Pro"** link\n\n💎 **Pro is $9/month** — WHY-comments, Both mode, all 12 languages, unlimited files\n\n🎉 Use code **EARLYBIRD3** at Pro Monthly checkout to lock Pro at **$9/mo forever** (expires May 1, 2026).\n\n[Jump to pricing →](https://poly-glot.ai/#pg-pricing-section)`,
    },
    {
      // SIGN IN
      patterns: [
        /where.{0,30}(sign.?in|log.?in|login|my.?account|sign.?up)/i,
        /how.{0,20}(sign.?in|log.?in|login|sign.?up|register)/i,
      ],
      answer: `**Sign In is in the top navigation bar:**\n\n- Look for the **Sign In** button in the top-right corner\n- Click it → enter your email → a **magic link** is sent to your inbox\n- Click the link to sign in instantly (no password needed)\n\nDon't see the email? Check your spam folder. The link expires in 15 minutes.`,
    },
    {
      // TEST CONNECTION
      patterns: [
        /where.{0,30}test.?connection/i,
        /how.{0,20}(test|verify|validate|check).{0,20}(api.?key|connection)/i,
        /test.?connection/i,
      ],
      answer: `**Test Connection is inside AI Settings:**\n\n1. Click the **⚙️ gear icon** (top-right)\n2. Paste your API key\n3. Click **Test Connection** — calls \`GET /v1/models\`, a free read-only endpoint\n4. ✅ Green = valid · ❌ Red = wrong or expired\n\n**Zero tokens burned** — works even with a $0 balance.`,
    },
    {
      // LANGUAGE SELECTOR
      patterns: [
        /where.{0,30}language.{0,20}(select|dropdown|choose|pick|change)/i,
        /how.{0,20}(change|select|pick|choose|set).{0,20}(language|lang)\b/i,
        /language.{0,20}(selector|dropdown|picker)/i,
      ],
      answer: `**The language dropdown is in the generator panel:**\n\n- Dropdown **above the code editor** on the homepage\n- Choose from **12 languages**: JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin\n\nPoly-Glot auto-detects the right comment style for each language (JSDoc, PyDoc, Javadoc, etc.).`,
    },
    {
      // EXPLAIN CODE location
      patterns: [
        /where.{0,30}explain.{0,20}(button|code|feature)/i,
        /how.{0,20}(use|find|access|run).{0,20}explain.?code/i,
        /what.{0,20}explain.?code.{0,20}(do|does)/i,
      ],
      answer: `**Explain Code is next to the Generate button:**\n\n- **Homepage**: generator panel → **Explain** button beside Generate Comments\n- **VS Code**: select code → **Cmd+Shift+E**\n- **Copilot Chat**: \`@poly-glot /explain\`\n\nReturns:\n- Plain-English summary\n- Complexity score (1–10)\n- Bug list & refactoring suggestions\n- Documentation quality score (0–100)`,
    },
    {
      // DOWNLOAD BUTTON
      patterns: [
        /where.{0,30}download/i,
        /how.{0,20}(download|save|export).{0,20}(output|result|comment|file)/i,
      ],
      answer: `**The Download button appears after generation:**\n\n1. Generate your comments\n2. In the **output panel** (right side), click **⬇️ Download**\n3. The documented file is saved to your machine\n\n⚠️ Download is a **Pro feature**. Upgrade at [poly-glot.ai/#pg-pricing-section](https://poly-glot.ai/#pg-pricing-section) — use code **EARLYBIRD3** to lock Pro at **$9/mo forever** (expires May 1, 2026).`,
    },

    // ── FEATURES & HOW-TO ──────────────────────────────────────────────────────

    {
      // "how do I get started" / "first time" / "how to use"
      // Deliberately AFTER the specific navigation rules above
      patterns: [/^(how.{0,10}(get.?start|do i start|begin|use poly|use this)|first.?time|getting.?start|set.?up poly)/i],
      answer: `**Getting started in 60 seconds:**\n\n1. Click the **⚙️ gear icon** (top-right) → AI Settings\n2. Choose **OpenAI**, **Anthropic**, or **Google**\n3. Paste your API key → click **Test Connection**\n4. Back on the homepage — paste code in the editor\n5. Choose language + comment type → **Generate Comments**\n\nNeed an API key?\n- [OpenAI →](https://platform.openai.com/api-keys) (key starts with \`sk-\`)\n- [Anthropic →](https://console.anthropic.com/settings/keys) (key starts with \`sk-ant-\`)\n- [Google AI Studio →](https://aistudio.google.com/app/apikey) (key starts with \`AIza\` — free tier!)`,
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
      answer: `**WHY-comments** explain *why* code was written a certain way — not just what it does.\n\nThey cover:\n- Non-obvious trade-offs\n- Edge-case reasoning\n- Algorithm choices\n- Business constraints\n\nExample:\n\`// Using a Map here instead of nested loops — O(n) vs O(n²) at scale\`\n\n**WHY-comments are a Pro feature.** Use code **EARLYBIRD3** to lock Pro at **$9/mo forever** (expires May 1, 2026) → [poly-glot.ai](https://poly-glot.ai/#pg-pricing-section)`,
    },
    {
      // Pricing — scoped to pricing/cost/pro/plan words, not "model" or "language"
      patterns: [/\bpric(e|ing)\b|\bcost\b|\bpro\b.{0,20}(plan|feature|tier|month|\$)|\bfree.?tier\b|\bsubscri|\bearlybird\b|\bupgrade\b|\b\$9\b|how much/i],
      answer: `**Pricing:**\n\n🆓 **Free** — doc-comments, Explain Code, JS/TS/Python/Java, 50 files/month\n💎 **Pro** — $9/month — WHY-comments, Both mode, all 12 languages, unlimited\n\n🎉 Use code **EARLYBIRD3** to lock Pro at **$9/mo forever** (expires May 1, 2026).\n\n[See plans →](https://poly-glot.ai/#pg-pricing-section)`,
    },
    {
      // Supported languages — only when asking about languages/programming languages
      patterns: [/what.{0,20}language|which.{0,20}language|supported.{0,20}language|language.{0,20}support|\blanguages\b.{0,20}(list|available|support|work)/i],
      answer: `**12 supported languages:**\n\nJavaScript · TypeScript · Python · Java · C++ · C# · Go · Rust · Ruby · PHP · Swift · Kotlin\n\nEach uses its native comment standard:\nJSDoc · Javadoc · PyDoc · Doxygen · XML docs · GoDoc · Rustdoc · YARD · PHPDoc · KDoc · Swift markup`,
    },
    {
      // AI models — only when asking about models specifically, NOT languages
      patterns: [/what.{0,20}model|which.{0,20}model|supported.{0,20}model|model.{0,20}(list|available|support|work|use)|openai.*model|anthropic.*model|google.*model|gemini.*model|custom.*model/i],
      answer: `**All supported AI models:**\n\n**OpenAI:**\n- GPT-4.1 ⭐ (recommended)\n- GPT-4.1 Mini (fast & cheap)\n- GPT-4.1 Nano (cheapest)\n- GPT-4o · GPT-4o Mini\n- o3 · o3-mini (reasoning)\n- o1 · o1-mini (reasoning)\n- GPT-4 Turbo · GPT-4 · GPT-3.5 Turbo (legacy)\n\n**Anthropic:**\n- Claude Sonnet 4 ⭐ (recommended)\n- Claude Opus 4 (most powerful)\n- Claude Haiku 4 (fast)\n- Claude 3.5 Sonnet · Claude 3.5 Haiku\n- Claude 3 Opus · Claude 3 Haiku (legacy)\n\n**Google (Gemini):**\n- Gemini 2.5 Flash ⭐ (recommended — fast & affordable)\n- Gemini 2.5 Pro (most powerful)\n- Gemini 2.5 Flash Lite (cheapest)\n- Gemini 2.0 Flash (stable GA)\n\n✏️ **Custom model IDs** also supported — type any valid ID in ⚙️ AI Settings.`,
    },
    {
      // API key setup — scoped to key setup, not location (location handled above)
      patterns: [/\bapi.?key\b.{0,40}(get|obtain|create|generate|need|require|what is|explain)/i,
                 /(get|obtain|create).{0,20}\bapi.?key\b/i,
                 /\bopenai\b.{0,20}(key|account|sign.?up)/i,
                 /\banthopic\b.{0,20}(key|account|sign.?up)/i,
                 /\bgoogle\b.{0,20}(key|account|sign.?up|api)/i,
                 /\bgemini\b.{0,20}(key|account|api)/i,
                 /\baistudio\b|ai.?studio/i],
      answer: `**Poly-Glot uses your own API key — choose any provider:**\n\n- **OpenAI** → [platform.openai.com/api-keys ↗](https://platform.openai.com/api-keys)\n  Key format: \`sk-...\`\n- **Anthropic** → [console.anthropic.com/settings/keys ↗](https://console.anthropic.com/settings/keys)\n  Key format: \`sk-ant-...\`\n- **Google (Gemini)** → [aistudio.google.com/app/apikey ↗](https://aistudio.google.com/app/apikey)\n  Key format: \`AIza...\` · **Free tier available — no credit card required**\n\nOnce you have it:\n1. Click **⚙️ AI Settings** (top-right)\n2. Select your provider → paste key → click **Test Connection**\n\nYour key goes **directly to the provider** — Poly-Glot never sees it.`,
    },
    {
      // Privacy — specifically about privacy/data/security of CODE and keys
      patterns: [/\bprivat|is my code (safe|secure|private|sent|shared)|does poly.?glot (see|store|collect|send|share)|my (code|data).{0,30}(safe|private|secure|sent|stored)|data.{0,20}(collect|telemetry|privacy|safe)|who (sees|has|gets).{0,20}(code|key|data)/i],
      answer: `**Your code and keys are 100% private:**\n\n- 🔑 API keys stored **locally** in your browser — never sent to Poly-Glot\n- 📡 Your code goes **directly** from your browser → OpenAI / Anthropic / Google\n- 🚫 Zero telemetry · zero data collection\n- 🏠 Poly-Glot has **no backend** that ever touches your code\n\nYou own your data. Always.`,
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
    // ── GITHUB APP — full block of rules, most specific first ───────────────────
    {
      // Install the GitHub App
      patterns: [
        /how.{0,20}(install|add|set.?up|get|enable|use).{0,20}github.?app/i,
        /github.?app.{0,20}(install|setup|get.?started|add|enable)/i,
        /install.{0,20}poly.?glot.{0,20}(on|to|for).{0,20}(github|repo|repository)/i,
        /where.{0,20}(install|find|get).{0,20}github.?app/i,
      ],
      answer: `**Install the Poly-Glot AI GitHub App in 3 steps:**

**1. Install the App**
Go to [github.com/apps/poly-glot-ai →](https://github.com/apps/poly-glot-ai) and click **Install**.
Choose to install on all repositories or specific ones.

**2. Add your API key (one of two ways)**
- **Option A — Repo config:** Add a \`.polyglot.yml\` file to your repo root:
\`\`\`yaml
provider: openai
openai_api_key: sk-your-key-here
\`\`\`
- **Option B — Server key:** If you're self-hosting, set \`OPENAI_API_KEY\` or \`ANTHROPIC_API_KEY\` as environment variables on the server.

**3. Open a Pull Request**
That's it — Poly-Glot AI will automatically analyze the PR, post inline documentation suggestions as review comments, and run a coverage check.

💡 No API key yet? [Get an OpenAI key →](https://platform.openai.com/api-keys) · [Get an Anthropic key →](https://console.anthropic.com/settings/keys)`,
    },
    {
      // What does the GitHub App do / overview
      patterns: [
        /what.{0,20}(does|is).{0,30}github.?app/i,
        /github.?app.{0,20}(what|how|work|do|does|overview|explain)/i,
        /how.{0,20}(does|do).{0,20}(poly.?glot|the).{0,20}github.?app.{0,20}work/i,
        /tell.{0,20}(me|us).{0,20}about.{0,20}github.?app/i,
        /what.{0,20}github.?app/i,
      ],
      answer: `**Poly-Glot AI GitHub App — automatic PR documentation:**

🔁 **How it works:**
1. You open or push to a Pull Request
2. The app receives a webhook from GitHub
3. It fetches every changed file in the PR
4. It analyzes each file for documentation coverage
5. Files below the threshold get AI-generated doc suggestions
6. Results are posted as **inline review comments** on the PR
7. A **Check Run** appears showing coverage scores for each file

📝 **What you get on every PR:**
- Inline JSDoc / PyDoc / Javadoc / Doxygen suggestions per file
- A documentation coverage score (0–100%)
- A deep-link to open the file in the [Poly-Glot web editor](https://poly-glot.ai) to regenerate with custom settings
- A summary review comment with avg coverage, files analyzed, and action buttons

⚙️ **Fully configurable** via \`.polyglot.yml\` in your repo root — set provider, model, mode, thresholds, include/exclude patterns, and more.

[Install the App →](https://github.com/apps/poly-glot-ai) · [See docs →](https://poly-glot.ai)`,
    },
    {
      // How does it document PRs / what comments does it post
      patterns: [
        /how.{0,30}(document|comment|annotate|analyze|review).{0,20}(pr|pull.?request)/i,
        /what.{0,30}(comment|post|suggest|review|add).{0,20}(pr|pull.?request)/i,
        /inline.{0,20}(comment|suggestion|review).{0,20}(pr|pull.?request|github)/i,
        /pr.{0,20}(review|comment|documentation|doc|suggestion)/i,
        /pull.?request.{0,20}(review|comment|documentation|doc)/i,
      ],
      answer: `**On every PR, Poly-Glot AI posts:**

**1. Inline review comments** (one per underdocumented file)
Each comment includes:
- The file name, language, and doc style (e.g. JSDoc, PyDoc, Javadoc)
- A documentation coverage score (e.g. 42%)
- A collapsible \`<details>\` block with the full suggested documented version
- A table with action links:
  - 🌐 Open the file in the Poly-Glot web editor (code pre-loaded)
  - 💻 Install the VS Code extension
  - ⌨️ Run the CLI command for that file

**2. A review summary** at the top of the PR with:
- Total files analyzed
- Files needing docs
- Average coverage score
- Links to the web editor, VS Code extension, and CLI

**3. A GitHub Check Run** named "Poly-Glot AI"
- Shows pass/fail based on your coverage threshold
- Lists per-file scores in the check details

💡 **Tip:** Copy the suggested code from the \`<details>\` block and commit it — or click the web editor link to regenerate with different settings.`,
    },
    {
      // Configure / polyglot.yml
      patterns: [
        /\.polyglot\.yml|polyglot\.yml|polyglot yaml|config.{0,20}(file|github|app)/i,
        /how.{0,20}(configure|config|customize|change.?settings|set.?up).{0,20}(github.?app|poly.?glot.?app)/i,
        /github.?app.{0,20}(configure|config|settings|options|customize)/i,
        /coverage.?threshold|max.?files|max.?file.?size|include.?pattern|exclude.?pattern/i,
      ],
      answer: `**Configure Poly-Glot AI with \`.polyglot.yml\` in your repo root:**

\`\`\`yaml
# .polyglot.yml
provider: openai          # openai | anthropic
model: gpt-4.1            # any valid model ID
mode: doc                 # doc | why | both
openai_api_key: sk-...    # your OpenAI key (optional if set server-side)
anthopic_api_key: sk-...  # your Anthropic key (optional)
coverage_threshold: 0.5   # 0.0–1.0 — files below this get suggestions
max_files: 15             # max files to process per PR
max_file_size: 50000      # skip files larger than this (bytes)
review_style: inline      # inline | summary
check_run: true           # show GitHub Check Run with coverage
include:                  # only process these paths (optional)
  - src/
  - lib/
exclude:                  # skip these paths
  - tests/
  - '*.test.js'
  - '*.spec.ts'
\`\`\`

**Defaults (no config needed to get started):**
- Provider: OpenAI · Model: GPT-4.1 · Mode: doc
- Threshold: 50% · Max files: 15 · Max file size: 50KB
- Review style: inline · Check run: enabled

💡 Commit this file to your repo root and the app picks it up on the next PR.`,
    },
    {
      // Coverage score / threshold
      patterns: [
        /coverage.{0,20}(score|check|threshold|percentage|percent|rating)/i,
        /documentation.{0,20}(score|coverage|percentage|percent|threshold)/i,
        /what.{0,20}coverage.{0,20}(mean|means|is|does)/i,
        /how.{0,20}(is|does).{0,20}coverage.{0,20}(calculated|measured|work|score)/i,
      ],
      answer: `**Documentation coverage score (0–100%):**

Poly-Glot AI analyzes each file and scores how well it's documented:

- **100%** — every function/class/method has a doc comment
- **50%** — about half are documented (the default threshold)
- **0%** — no doc comments at all

**How it's calculated:**
The app scans for doc comment patterns per language:
- JS/TS → \`/** ... */\` JSDoc blocks
- Python → \`""" ... """\` docstrings
- Java → \`/** ... */\` Javadoc blocks
- C++ → \`/** ... */\` or \`/// ...\` Doxygen
- etc.

**What triggers a suggestion:**
If a file scores below your \`coverage_threshold\` (default: 50%), Poly-Glot AI generates doc suggestions for that file and posts them as a review comment.

**Change the threshold** in \`.polyglot.yml\`:
\`\`\`yaml
coverage_threshold: 0.8  # require 80% coverage
\`\`\``,
    },
    {
      // Check run
      patterns: [
        /check.?run|github.{0,10}check|check.{0,10}(pass|fail|status)/i,
        /github.?app.{0,20}(check|status|badge|ci)/i,
        /why.{0,20}(check|failing|failed|red|green).{0,20}(poly|run)/i,
        /poly.?glot.{0,20}check/i,
      ],
      answer: `**Poly-Glot AI creates a GitHub Check Run on every PR:**

You'll see it in the PR's **Checks** tab or status area:

- ✅ **Pass** — all analyzed files meet the coverage threshold
- ❌ **Fail** — one or more files are below the threshold
- ⚪ **Neutral** — no API key configured (setup required)

**What the check shows:**
- Files analyzed · files needing docs · average coverage score
- Per-file breakdown in the check details

**Disable the check run** if you just want suggestions without blocking CI:
\`\`\`yaml
# .polyglot.yml
check_run: false
\`\`\`

💡 The check run is informational by default — it won't block merges unless you configure branch protection rules to require it.`,
    },
    {
      // Deep link / web editor link from PR comment
      patterns: [
        /deep.?link|open.{0,20}(web|editor|poly.?glot).{0,20}(from|in|link)/i,
        /open.{0,20}(in|with).{0,20}poly.?glot/i,
        /web.?editor.{0,20}link|editor.{0,20}link.{0,20}(pr|pull)/i,
        /pre.?load|preloaded.{0,20}code/i,
        /regenerate.{0,20}(in|with|using).{0,20}(web|editor|poly.?glot)/i,
      ],
      answer: `**Every PR comment includes a "Open in Poly-Glot AI" link:**

When the GitHub App posts a suggestion on your PR, there's a table with:

| Action | What it does |
|--------|--------------|
| 🌐 Open in web editor | Opens poly-glot.ai with that file's code **pre-loaded** |
| 💻 VS Code extension | Links to the marketplace install page |
| ⌨️ CLI command | Shows the exact \`npx poly-glot-ai-cli\` command for that file |

**The web editor deep link:**
- Encodes the file's source code as a base64 URL param
- Opens poly-glot.ai with the code in the editor, language auto-set
- Shows a banner: *"Opened from GitHub PR Review"*
- You can change the model, mode (doc/WHY/both), or settings and regenerate
- No copy-paste needed — everything is pre-loaded

💡 Use this when you want to tweak the generated documentation before committing it.`,
    },
    {
      // Supported languages for the GitHub App
      patterns: [
        /github.?app.{0,30}language|language.{0,30}github.?app/i,
        /what.{0,20}language.{0,20}(github.?app|app.{0,10}support)/i,
        /github.?app.{0,20}(support|work|handle).{0,20}(language|file|code)/i,
      ],
      answer: `**The GitHub App supports all 12 Poly-Glot languages:**

| Language | Doc Style | Tier |
|----------|-----------|------|
| JavaScript | JSDoc | Free |
| TypeScript | JSDoc | Free |
| Python | PyDoc (Google/NumPy) | Free |
| Java | Javadoc | Free |
| C++ | Doxygen | Pro |
| C# | XML Docs | Pro |
| Go | GoDoc | Pro |
| Rust | Rustdoc | Pro |
| Ruby | YARD | Pro |
| PHP | PHPDoc | Pro |
| Swift | Swift Markup | Pro |
| Kotlin | KDoc | Pro |

Language is **auto-detected** from file extension — no configuration needed.

Files with unsupported extensions (images, lock files, build artifacts, etc.) are automatically skipped.

[Install the App →](https://github.com/apps/poly-glot-ai)`,
    },
    {
      // Privacy / security for GitHub App
      patterns: [
        /github.?app.{0,30}(private|privacy|secure|security|safe|data|code|send|store)/i,
        /(private|secure|safe).{0,30}github.?app/i,
        /does.{0,20}(app|poly.?glot).{0,20}(see|store|collect|send|share).{0,20}(code|repo|data)/i,
        /github.?app.{0,20}(access|permission|scope)/i,
      ],
      answer: `**The GitHub App is private and secure:**

🔑 **API keys:** Stored in your repo's \`.polyglot.yml\` (add to \`.gitignore\` if needed) or as server environment variables — never logged or stored by Poly-Glot

📡 **Your code:** Fetched temporarily via the GitHub API to generate docs, then discarded — never stored

🔒 **GitHub permissions the app requests:**
- \`pull_requests: write\` — to post review comments
- \`checks: write\` — to create the coverage check run
- \`contents: read\` — to read your source files
- \`metadata: read\` — to identify the repo

🚫 **What the app does NOT do:**
- Does not store your source code
- Does not share your code with anyone except OpenAI/Anthropic (your chosen provider)
- Does not read files outside of changed PR files
- Does not access your Git history or other branches

[Privacy Policy →](https://poly-glot.ai/privacy) · [Terms →](https://poly-glot.ai/terms)`,
    },
    {
      // Troubleshooting GitHub App
      patterns: [
        /github.?app.{0,30}(not.?work|broken|error|fail|issue|problem|bug|wrong|setup.?comment)/i,
        /(not.?work|broken|fail|error).{0,30}github.?app/i,
        /why.{0,20}(isn't|is.?not|didn't|does.?not).{0,20}(app|poly.?glot).{0,20}(work|run|post|comment|fire)/i,
        /app.{0,20}(not|never).{0,20}(post|comment|run|trigger|respond)/i,
        /no.{0,20}(comment|review|check|suggestion).{0,20}(from|by).{0,20}(poly.?glot|app)/i,
      ],
      answer: `**Troubleshooting the Poly-Glot AI GitHub App:**

**App posted "Setup required" comment:**
→ No API key found. Add \`openai_api_key\` or \`anthropic_api_key\` to \`.polyglot.yml\` in your repo root.

**No comment posted at all:**
→ Check the app is installed on the repo (Settings → Integrations → Applications)
→ Verify the PR has changed files with supported extensions (.js, .ts, .py, .java, etc.)
→ All files may already meet the coverage threshold — try lowering it in \`.polyglot.yml\`

**Check run failing:**
→ Files are below your \`coverage_threshold\` (default 50%). Either add docs or lower the threshold:
\`\`\`yaml
coverage_threshold: 0.3
\`\`\`

**All files being skipped:**
→ Check your \`exclude:\` patterns in \`.polyglot.yml\` — you may be excluding too broadly
→ Max files limit hit (default 15) — increase with \`max_files: 30\`

**App hitting API errors:**
→ Verify your API key is valid (test it at [poly-glot.ai](https://poly-glot.ai) → ⚙️ AI Settings → Test Connection)
→ Check your OpenAI/Anthropic account has credits

[GitHub App Source →](https://github.com/hmoses/poly-glot-github-app)`,
    },

    {
      // Copilot Chat integration
      patterns: [/copilot|@poly.?glot|copilot.?chat|chat.?participant|github.?copilot/i],
      answer: `**GitHub Copilot Chat integration is built in!**\n\nIn VS Code with GitHub Copilot:\n- \`@poly-glot /comment\` — doc-comments\n- \`@poly-glot /why\` — WHY-comments (Pro)\n- \`@poly-glot /both\` — both passes (Pro)\n- \`@poly-glot /explain\` — deep analysis\n\nRequires VS Code v1.95+ and GitHub Copilot.\n\n[Install Extension →](https://marketplace.visualstudio.com/items?itemName=poly-glot-ai.poly-glot)`,
    },
    {
      // Getting started — catch-all after specific rules
      patterns: [/get.?start|how.{0,10}(to use|do i use|use this|begin)|first.?time|set.?up|quick.?start/i],
      answer: `**Getting started in 60 seconds:**\n\n1. Click the **⚙️ gear icon** (top-right) → AI Settings\n2. Choose **OpenAI**, **Anthropic**, or **Google**\n3. Paste your API key → click **Test Connection**\n4. Back on the homepage — paste code in the editor\n5. Choose language + comment type → **Generate Comments**\n\nNeed an API key?\n- [OpenAI →](https://platform.openai.com/api-keys) · [Anthropic →](https://console.anthropic.com/settings/keys) · [Google AI Studio →](https://aistudio.google.com/app/apikey) *(free tier)*`,
    },

    // ── GOOGLE / GEMINI ONBOARDING ─────────────────────────────────────────────

    {
      // "how do I use Google" / "gemini" / "AI Studio" / "AIza key"
      patterns: [
        /\bgemini\b/i,
        /google.{0,20}(provider|model|key|api|setup|use|start|work)/i,
        /ai.?studio/i,
        /\bAIza\b/i,
        /how.{0,20}(use|set.?up|configure|add).{0,20}google/i,
        /google.{0,20}(gemini|flash|pro)/i,
      ],
      answer: `**Using Google (Gemini) with Poly-Glot:**\n\n**1. Get a free API key:**\n→ [aistudio.google.com/app/apikey ↗](https://aistudio.google.com/app/apikey)\n- Free tier — no credit card required\n- Key starts with \`AIza...\`\n\n**2. Add it in AI Settings:**\n1. Click **⚙️ gear icon** (top-right)\n2. Select **Google** as provider\n3. Paste your \`AIza...\` key\n4. Choose a model (Gemini 2.5 Flash ⭐ recommended)\n5. Click **Test Connection**\n\n**Available models:**\n- **Gemini 2.5 Flash** — best balance of speed & quality\n- **Gemini 2.5 Pro** — most powerful\n- **Gemini 2.5 Flash Lite** — cheapest\n- **Gemini 2.0 Flash** — stable GA release\n\n💡 Google's free tier has rate limits but zero cost — great for getting started!`,
    },
    {
      // "which provider should I use" / "openai vs anthropic vs google" / "best provider"
      patterns: [
        /which.{0,20}provider/i,
        /openai.{0,20}vs.{0,20}(anthropic|google|gemini)/i,
        /anthropic.{0,20}vs.{0,20}(openai|google|gemini)/i,
        /google.{0,20}vs.{0,20}(openai|anthropic)/i,
        /best.{0,20}provider/i,
        /what.{0,20}(provider|difference).{0,20}(openai|anthropic|google)/i,
        /compare.{0,20}(provider|openai|anthropic|google|gemini)/i,
      ],
      answer: `**Choosing a provider — quick comparison:**\n\n| Provider | Best for | Key format | Free tier? |\n|---|---|---|---|\n| **OpenAI** | Most popular, widest model range | \`sk-...\` | No (pay-as-you-go) |\n| **Anthropic** | Long context, precise instructions | \`sk-ant-...\` | No (pay-as-you-go) |\n| **Google** | Fast & affordable, free to start | \`AIza...\` | ✅ Yes! |\n\n**Recommended picks:**\n- 🆓 **Free to try:** Google Gemini 2.5 Flash — [aistudio.google.com/app/apikey ↗](https://aistudio.google.com/app/apikey)\n- ⚡ **Best quality/speed:** OpenAI GPT-4.1 — [platform.openai.com/api-keys ↗](https://platform.openai.com/api-keys)\n- 🧠 **Complex codebases:** Anthropic Claude Sonnet 4 — [console.anthropic.com/settings/keys ↗](https://console.anthropic.com/settings/keys)\n\nAll providers: your key goes directly from browser → provider. Poly-Glot never sees it.`,
    },
    {
      // "is google free" / "free tier" / "do I need a credit card for google"
      patterns: [
        /google.{0,30}free/i,
        /gemini.{0,30}free/i,
        /free.{0,30}(google|gemini)/i,
        /credit.?card.{0,20}google/i,
        /google.{0,20}(cost|price|paid|charge)/i,
        /do i (need|have to).{0,20}(pay|credit.?card).{0,20}google/i,
      ],
      answer: `**Google AI Studio has a free tier — no credit card required!**\n\n✅ Get a free API key at [aistudio.google.com/app/apikey ↗](https://aistudio.google.com/app/apikey)\n\n**Free tier limits (as of 2025):**\n- Gemini 2.5 Flash: 500 requests/day, 10 requests/minute\n- Gemini 2.0 Flash: 1,500 requests/day, 15 requests/minute\n\n**Paid usage** (if you exceed free limits):\n- Gemini 2.5 Flash: ~$0.30/1M input tokens · $2.50/1M output tokens\n- Gemini 2.5 Pro: ~$1.25/1M input tokens · $10/1M output tokens\n- Billing is through your Google Cloud account\n\n💡 For most Poly-Glot users, the free tier is more than enough to get started!`,
    },
    {
      // "my google key doesn't work" / "AIza key not working" / "google api error"
      patterns: [
        /google.{0,30}(key|api).{0,20}(not.?work|error|fail|invalid|wrong|reject)/i,
        /AIza.{0,20}(not.?work|error|fail|invalid)/i,
        /gemini.{0,30}(error|fail|not.?work)/i,
        /(invalid|wrong|bad).{0,20}google.{0,20}key/i,
        /google.{0,20}(403|401|429|quota)/i,
      ],
      answer: `**Troubleshooting your Google API key:**\n\n**Key format check:**\n- Google keys start with \`AIza\` — if yours starts with \`sk-\` that's an OpenAI key\n- Make sure you selected **Google** (not OpenAI/Anthropic) in ⚙️ AI Settings\n\n**Common errors:**\n- ❌ **403 / API not enabled** → Go to [Google Cloud Console](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com) and enable the *Generative Language API* (AI Studio does this automatically)\n- ❌ **401 / Invalid key** → Double-check the key at [aistudio.google.com/app/apikey ↗](https://aistudio.google.com/app/apikey)\n- ❌ **429 / Quota exceeded** → You've hit the free tier rate limit — wait a minute or upgrade to paid\n- ❌ **400 / Model not found** → Try switching to **Gemini 2.5 Flash** in the model dropdown\n\n**Quick fix:** Click **Test Connection** in ⚙️ AI Settings to see the exact error message.`,
    },

    // ── CODE ASSIST — direct code help (requires AI, shown as no-key hint if missing) ──

    {
      // Explain code — user asks assistant to explain a function/block
      patterns: [
        /explain.{0,30}(this|the|my).{0,20}(code|function|method|class|snippet|block)/i,
        /what.{0,20}(does|is).{0,30}(this|the).{0,20}(code|function|method|do)/i,
        /can you.{0,20}explain/i,
        /break.?down.{0,20}(this|the|my).{0,20}(code|function)/i,
        /walk me through/i,
      ],
      answer: `**Paste your code below and I'll explain it!**\n\nI can break down:\n- 📝 What the function/class does in plain English\n- 🔍 What each parameter and return value means\n- ⚠️ Any edge cases or issues I spot\n- 📊 Complexity notes\n\nJust paste your code (any language) and ask away.\n\n💡 **Tip:** Poly-Glot's **Explain Code** feature does this for entire files — [try it on the homepage →](https://poly-glot.ai)`,
    },
    {
      // Find bugs / debug
      patterns: [
        /find.{0,20}(bug|issue|error|problem|mistake)/i,
        /debug.{0,30}(this|my|the).{0,20}(code|function|script)/i,
        /what.{0,20}(wrong|broken|issue).{0,20}(with|in).{0,20}(this|my)/i,
        /audit.{0,20}(this|my|the).{0,20}(code|function)/i,
        /edge.?case/i,
        /null.?check|undefined.?check/i,
      ],
      answer: `**Paste your code and I'll audit it for bugs!**\n\nI'll check for:\n- 🐛 Null/undefined edge cases\n- 🔢 Off-by-one errors\n- 🔄 Missing error handling\n- 🔒 Type mismatches\n- ⚡ Race conditions / async issues\n- 📦 Scope and closure traps\n\nPaste your code snippet and I'll give you specific fixes.\n\n💡 **Tip:** Poly-Glot's **Explain Code** mode generates a full bug list for any file automatically.`,
    },
    {
      // Refactor
      patterns: [
        /refactor.{0,30}(this|my|the).{0,20}(code|function|class|method)/i,
        /improve.{0,30}(this|my|the).{0,20}(code|function)/i,
        /how.{0,20}(to|can i|should i|would you).{0,20}refactor/i,
        /make.{0,20}(this|my).{0,20}(code|function).{0,20}(better|cleaner|cleaner|faster|simpler)/i,
        /clean.{0,20}(up|this).{0,20}(code|function)/i,
        /optimi[sz]e.{0,20}(this|my|the).{0,20}(code|function)/i,
      ],
      answer: `**Paste your code and I'll suggest concrete refactors!**\n\nI'll look for:\n- ♻️ Repeated logic that can be extracted\n- 📏 Functions that are too long (>20 lines)\n- 🔀 Nested conditionals that can be flattened\n- 💡 More readable alternatives\n- ⚡ Performance improvements\n\nI'll show before/after examples, not just vague advice.\n\n💡 **Tip:** Poly-Glot's WHY-comments mode adds inline reasoning about *why* your refactored code was written the way it was.`,
    },
    {
      // Write tests
      patterns: [
        /write.{0,20}(unit.?test|test|spec|jest|pytest|junit)/i,
        /generate.{0,20}(test|spec|unit.?test)/i,
        /test.{0,20}(this|my|the).{0,20}(code|function|method|class)/i,
        /how.{0,20}(to|do i|should i).{0,20}test.{0,20}(this|my|the)/i,
        /add.{0,20}(test|coverage|spec).{0,20}(for|to)/i,
      ],
      answer: `**Paste your function and I'll write tests for it!**\n\nI can generate:\n- ✅ Happy-path tests\n- ❌ Edge case / error tests\n- 🎭 Mock setups\n- Framework-specific syntax: **Jest, Vitest, Mocha, Pytest, JUnit, RSpec, go test**\n\nJust paste the function signature + body and tell me the test framework.\n\n💡 **Tip:** Once Poly-Glot generates your doc-comments, your test runner's autocomplete gets dramatically more accurate.`,
    },
    {
      // Write JSDoc / doc comments — redirect to the product (don't do it inline)
      patterns: [
        /write.{0,30}(jsdoc|pydoc|javadoc|kdoc|doxygen|godoc|rustdoc|phpDoc|doc.?comment|docstring)/i,
        /generate.{0,30}(jsdoc|pydoc|javadoc|doc.?comment|docstring|comment)/i,
        /add.{0,30}(jsdoc|comment|documentation|doc).{0,20}(to|for).{0,20}(this|my|the)/i,
        /comment.{0,30}(this|my|the).{0,20}(code|function|class|method)/i,
        /document.{0,20}(this|my|the).{0,20}(code|function|class)/i,
      ],
      answer: `**That's exactly what Poly-Glot is built for!** 🦜\n\nGenerating professional doc-comments is the core product — paste your code directly into the **generator** on this page and get:\n\n- 📝 **JSDoc** (JS/TS) · **PyDoc** (Python) · **Javadoc** (Java) — free\n- 🦀 **Rustdoc, GoDoc, KDoc, Doxygen, PHPDoc, Swift** — Pro\n- ✍️ **WHY-comments** — explains intent & trade-offs (Pro)\n- 📝 **Both** — doc + WHY in one pass (Pro)\n\n👆 **[Use the generator above ↑](https://poly-glot.ai#commentGenerator)** — paste your code, pick your language, click Generate.\n\nPro tip: use code **EARLYBIRD3** to lock Pro at **$9/mo forever** (expires May 1, 2026) → [See plans →](https://poly-glot.ai/#pg-pricing-section)`,
    },
    {
      // WHY comments
      patterns: [
        /write.{0,30}why.{0,20}comment/i,
        /add.{0,30}(intent|reasoning|why).{0,20}comment/i,
        /explain.{0,30}why.{0,20}(this|the|my).{0,20}(code|decision|choice|approach)/i,
        /what.{0,20}(is|are).{0,30}why.{0,20}comment/i,
      ],
      answer: `**WHY-comments explain intent, not just what the code does.**\n\nExample:\n\`\`\`js\n// Using a Map instead of an array — O(1) lookups at scale (10k+ records)\nconst lookup = new Map(items.map(i => [i.id, i]));\n\`\`\`\n\nPaste code and I'll add WHY-comments to every non-obvious decision.\n\n💡 **Poly-Glot's WHY mode** does this automatically for entire files — it's a **Pro feature**. Use code **EARLYBIRD3** to lock Pro at **$9/mo forever** (expires May 1, 2026) → [poly-glot.ai](https://poly-glot.ai/#pg-pricing-section)`,
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
        <strong>Great question — but that's a bit outside what I cover!</strong><br>
        I'm best at helping with Poly-Glot and code. Here's what I can do:
      </div>
      <ul class="pg-chat-fallback-list">
        <li>🧠 Explain, debug, or refactor your code</li>
        <li>📝 Generate JSDoc, PyDoc, Javadoc &amp; more</li>
        <li>✅ Write unit tests from functions</li>
        <li>💬 Add WHY-comments &amp; inline reasoning</li>
        <li>📍 Help you find anything on the site</li>
        <li>🚀 Get you set up — API keys, CLI, VS Code</li>
        <li>💳 Answer pricing &amp; Pro feature questions</li>
      </ul>
      <div class="pg-chat-fallback-text" style="font-size:12px;color:#9ca3af;margin-top:4px;">
        Try pasting a code snippet, or ask me something like <em>"How do I install the CLI?"</em>
      </div>
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

  // ─── Code detection heuristic ────────────────────────────────────────────────
  // Returns true if the message looks like it contains pasted code or is a
  // code-related question, so we can bump max_tokens accordingly.

  function detectCodeInMessage(text) {
    // Fenced code block
    if (/```[\s\S]{20,}```/.test(text)) return true;
    // Indented block (4+ spaces or tab at line start, 3+ lines)
    const indentedLines = text.split('\n').filter(l => /^(\t|    )/.test(l));
    if (indentedLines.length >= 3) return true;
    // Common code tokens that appear in real code snippets
    const codeTokens = [
      /\bfunction\s+\w+\s*\(/,
      /\bconst\s+\w+\s*=/,
      /\blet\s+\w+\s*=/,
      /\bvar\s+\w+\s*=/,
      /\bdef\s+\w+\s*\(/,
      /\bclass\s+\w+[\s:{]/,
      /\bimport\s+[\w{]/,
      /\bexport\s+(default\s+)?[\w{(]/,
      /\breturn\s+.{5,}/,
      /=>\s*[{(]/,
      /\bif\s*\(.{3,}\)\s*[{]/,
      /\bfor\s*\(.{3,}\)\s*[{]/,
      /\bpublic\s+(static\s+)?\w+\s+\w+\s*\(/,
      /\bfunc\s+\w+\s*\(/,
      /\bfn\s+\w+\s*\(/,
    ];
    if (codeTokens.some(rx => rx.test(text))) return true;
    // Code-question keywords
    if (/\b(explain|debug|refactor|bug|unit test|jsdoc|pydoc|javadoc|docstring|comment this|what does this (code|function|method)|write a test|find the (bug|issue|error))\b/i.test(text)) return true;
    return false;
  }

  // ─── AI call ──────────────────────────────────────────────────────────────────

  async function askAI(question, history) {
    const provider = localStorage.getItem('polyglot_ai_provider') || 'openai';
    const apiKey   = localStorage.getItem('polyglot_api_key') || '';
    if (!apiKey) return null;

    // Use higher token limit for code-related questions
    const isCodeQuestion = detectCodeInMessage(question);
    const maxTokens = isCodeQuestion ? 800 : 400;

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
          body:    JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.3 }),
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
          body: JSON.stringify({ model, max_tokens: maxTokens, system: sysmsg, messages: anthropicMs }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const reply = data.content?.[0]?.text?.trim() || null;
        return reply === '__UNRELATED__' ? BRANDED_FALLBACK : reply;

      } else if (provider === 'google') {
        // Uses Google's OpenAI-compatible endpoint — same format as OpenAI
        const model = localStorage.getItem('polyglot_ai_model') || 'gemini-2.5-flash';
        const res = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
          {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.3 }),
          }
        );
        if (!res.ok) return null;
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content?.trim() || null;
        return reply === '__UNRELATED__' ? BRANDED_FALLBACK : reply;
      }
    } catch (_) { return null; }
    return null;
  }

  // ─── Suggestions pool ─────────────────────────────────────────────────────────
  // Mix of feature questions AND navigation questions

  const SUGGESTIONS = [
    // — GitHub App
    'How do I install the GitHub App?',
    'What does the GitHub App do?',
    'How does the GitHub App document pull requests?',
    // — UI / navigation
    'Where do I add my API key?',
    'Where is the pricing?',
    'How do I install the VS Code extension?',
    'How does the MCP server work?',
    'Where do I enter a promo code?',
    'How do I use the CLI?',
    // — Provider / Google onboarding
    'How do I use Google Gemini with Poly-Glot?',
    'Is Google AI Studio free?',
    'Which provider should I use — OpenAI, Anthropic, or Google?',
    'Where do I get a Google API key?',
    // — Features
    'What AI models are supported?',
    'What languages are supported?',
    'Is my code private?',
    "What's the difference between Doc and WHY comments?",
    'How much does Pro cost?',
    'How do I test my API key?',
    // — Code analysis
    'Explain this function for me',
    'Find bugs in my code',
    'Help me refactor this function',
    'Write unit tests for this code',
    'What edge cases am I missing?',
    'Add WHY-comments to my code',
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
      width: 390px; max-width: calc(100vw - 32px);
      height: 580px; max-height: calc(100vh - 120px);
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
      display: flex; align-items: center; gap: 12px;
      padding: 16px 16px 14px;
      background: linear-gradient(135deg, rgba(79,70,229,.3) 0%, rgba(124,58,237,.18) 100%);
      border-bottom: 1px solid rgba(255,255,255,.09);
      flex-shrink: 0;
      position: relative;
    }
    .pg-chat-header-avatar {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; flex-shrink: 0;
      box-shadow: 0 2px 10px rgba(79,70,229,.45);
    }
    .pg-chat-header-info { flex: 1; min-width: 0; }
    .pg-chat-header-name {
      font-size: 14px; font-weight: 700; color: #f9fafb; line-height: 1.25;
      letter-spacing: -.01em;
    }
    .pg-chat-header-status {
      font-size: 11.5px; color: #6b7280;
      display: flex; align-items: center; gap: 5px; margin-top: 3px;
    }
    .pg-chat-status-dot {
      width: 7px; height: 7px; background: #34d399;
      border-radius: 50%; display: inline-block; flex-shrink: 0;
      box-shadow: 0 0 5px rgba(52,211,153,.6);
    }
    .pg-chat-header-badge {
      display: inline-flex; align-items: center;
      background: rgba(79,70,229,.25); border: 1px solid rgba(79,70,229,.4);
      color: #a5b4fc; font-size: 9.5px; font-weight: 600;
      border-radius: 20px; padding: 2px 8px; letter-spacing: .03em;
      margin-top: 5px; width: fit-content;
    }
    .pg-chat-header-actions {
      display: flex; align-items: center; gap: 2px; flex-shrink: 0;
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
      flex-shrink: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px;
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
      overflow: hidden; text-overflow: ellipsis;
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
      flex: 0 0 38px;
      width: 38px; height: 38px; min-width: 38px; max-width: 38px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border: none; border-radius: 10px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      padding: 0;
      transition: transform .15s, opacity .15s, box-shadow .15s;
    }
    #pg-chat-send:hover:not(:disabled) {
      transform: scale(1.07); box-shadow: 0 3px 12px rgba(79,70,229,.55);
    }
    #pg-chat-send:disabled { opacity: .35; cursor: default; transform: none; }
    #pg-chat-send svg { width: 17px; height: 17px; display: block; flex-shrink: 0; }

    /* Char counter */
    .pg-chat-char-counter {
      font-size: 10px; color: #4b5563; text-align: right;
      padding: 0 14px 4px; flex-shrink: 0;
      transition: color .15s;
    }
    .pg-chat-char-counter.warn  { color: #f59e0b; }
    .pg-chat-char-counter.error { color: #ef4444; font-weight: 700; }

    /* Tablet */
    @media (max-width: 768px) and (min-width: 481px) {
      #pg-chat-window {
        width: 360px; max-width: calc(100vw - 32px);
        height: 560px;
      }
      .pg-chat-header-avatar { width: 40px; height: 40px; font-size: 20px; }
      .pg-chat-header-name { font-size: 13.5px; }
      .pg-chat-suggestion { font-size: 11px; padding: 5px 10px; }
      .pg-export-bar-btn { font-size: 10.5px; padding: 4px 8px; }
    }

    /* Mobile */
    @media (max-width: 480px) {
      #pg-chat-window {
        bottom: 0; right: 0; left: 0; width: 100%; max-width: 100%;
        height: 82vh; max-height: 100dvh; border-radius: 20px 20px 0 0;
      }
      #pg-chat-trigger { bottom: 18px; right: 16px; width: 46px; height: 46px; font-size: 21px; }
      .pg-chat-msg { max-width: 94%; }
      .pg-chat-bubble {
        font-size: 12.5px; padding: 8px 10px;
        word-break: break-word; overflow-wrap: anywhere;
      }
      .pg-chat-code {
        font-size: 10px; padding: 6px 8px;
        max-width: 100%; box-sizing: border-box;
        overflow-x: auto; white-space: pre;
        -webkit-overflow-scrolling: touch;
        word-break: normal; overflow-wrap: normal;
      }
      .pg-chat-inline-code { font-size: 10.5px; }
      .pg-chat-suggestions {
        flex-direction: row; align-items: center;
        flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden;
        padding: 7px 10px; gap: 6px;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }
      .pg-chat-suggestions::-webkit-scrollbar { display: none; }
      .pg-chat-suggestions-label { display: none; }
      .pg-chat-suggestion {
        font-size: 11.5px; padding: 6px 12px;
        white-space: nowrap; flex-shrink: 0;
        border-radius: 20px;
      }
      .pg-chat-input-row {
        padding: 8px 10px 10px; gap: 8px;
        align-items: flex-end;
      }
      #pg-chat-input {
        flex: 1; min-width: 0;
        font-size: 16px; padding: 8px 10px; min-height: 36px;
        border-radius: 10px;
      }
      #pg-chat-input::placeholder { font-size: 13px; }
      #pg-chat-send {
        flex: 0 0 36px !important;
        width: 36px !important; height: 36px !important;
        min-width: 36px !important; max-width: 36px !important;
        border-radius: 10px;
      }
      #pg-chat-send svg { width: 15px; height: 15px; }
      .pg-chat-header { padding: 14px 12px 12px; }
      .pg-chat-header-avatar { width: 38px; height: 38px; font-size: 19px; }
      .pg-chat-header-name { font-size: 13px; }
      .pg-chat-header-badge { font-size: 9px; padding: 2px 7px; }
      .pg-chat-messages { padding: 12px 10px 8px; }
      .pg-export-bar { padding: 5px 10px 7px; flex-wrap: nowrap; }
      .pg-export-bar-btn { font-size: 10.5px; padding: 4px 8px; gap: 4px; }
      .pg-export-bar-btn svg { width: 11px; height: 11px; }
    }
    @media (max-width: 360px) {
      #pg-chat-window { height: 85vh; }
      #pg-chat-trigger { bottom: 14px; right: 12px; width: 42px; height: 42px; font-size: 19px; }
      .pg-chat-code { font-size: 9.5px; padding: 5px 6px; }
      .pg-chat-bubble { font-size: 12px; padding: 7px 9px; }
      .pg-chat-suggestion { font-size: 11px; padding: 5px 10px; }
      #pg-chat-input { font-size: 16px; }
      .pg-export-bar-label { display: none; }
      .pg-export-bar-btn { font-size: 10px; padding: 3px 7px; }
    }

    /* ── Export footer bar ───────────────────────────────────── */
    .pg-export-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 6px 14px 8px;
      border-top: 1px solid rgba(255,255,255,.05);
      background: rgba(0,0,0,.15);
      flex-shrink: 0;
      gap: 6px;
    }
    .pg-export-bar-label {
      font-size: 9.5px; color: #374151; text-transform: uppercase;
      letter-spacing: .06em; font-weight: 700; white-space: nowrap; flex-shrink: 0;
    }
    .pg-export-bar-actions {
      display: flex; align-items: center; gap: 4px;
    }
    .pg-export-bar-btn {
      background: none; border: 1px solid rgba(79,70,229,.2);
      border-radius: 7px; color: #6b7280; cursor: pointer;
      font-size: 11px; font-family: inherit; font-weight: 500;
      padding: 4px 9px; display: flex; align-items: center; gap: 5px;
      transition: color .14s, background .14s, border-color .14s;
      white-space: nowrap; flex-shrink: 0;
    }
    .pg-export-bar-btn:hover {
      color: #a5b4fc; background: rgba(79,70,229,.15);
      border-color: rgba(79,70,229,.45);
    }
    .pg-export-bar-btn:active {
      background: rgba(79,70,229,.25);
    }
    .pg-export-bar-btn svg { width: 12px; height: 12px; flex-shrink: 0; }
    .pg-export-toast {
      position: fixed; bottom: 80px; right: 32px;
      background: #4f46e5; color: #fff;
      font-size: 12px; font-weight: 600; border-radius: 8px;
      padding: 6px 14px; white-space: nowrap;
      opacity: 0; transition: opacity .2s;
      pointer-events: none; z-index: 10002;
      box-shadow: 0 4px 14px rgba(79,70,229,.4);
    }
    .pg-export-toast.show { opacity: 1; }
    @media (max-width: 480px) {
      .pg-export-bar { padding: 5px 10px 7px; }
      .pg-export-bar-btn { font-size: 10.5px; padding: 4px 8px; }
      .pg-export-toast { bottom: 72px; right: 16px; }
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
          <div class="pg-chat-header-badge">AI-powered · 12 languages</div>
        </div>
        <div class="pg-chat-header-actions">
          <button class="pg-chat-header-close" id="pg-chat-close" aria-label="Close chat">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="pg-chat-messages" id="pg-chat-messages" role="log" aria-live="polite" aria-atomic="false"></div>
      <div class="pg-chat-suggestions" id="pg-chat-suggestions" aria-label="Suggested question"></div>
      <div class="pg-chat-char-counter" id="pg-chat-char-counter" aria-live="polite"></div>
      <div class="pg-chat-input-row">
        <textarea id="pg-chat-input" placeholder="Paste code or ask about Poly-Glot…" rows="1"
          aria-label="Chat message" autocomplete="off" spellcheck="true"></textarea>
        <button id="pg-chat-send" aria-label="Send message" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="pg-export-bar">
        <span class="pg-export-bar-label">Export</span>
        <div class="pg-export-bar-actions">
          <button class="pg-export-bar-btn" id="pg-export-md" title="Download as Markdown">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            .md
          </button>
          <button class="pg-export-bar-btn" id="pg-export-txt" title="Download as plain text">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            .txt
          </button>
          <button class="pg-export-bar-btn" id="pg-export-json" title="Download as JSON">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            .json
          </button>
          <button class="pg-export-bar-btn" id="pg-export-copy" title="Copy to clipboard">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
        </div>
      </div>
      <div class="pg-export-toast" id="pg-export-toast"></div>`;

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
    const charCounter   = document.getElementById('pg-chat-char-counter');
    const MAX_CHARS     = 20000;

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
      label.textContent = 'TRY:';
      suggestionsEl.appendChild(label);

      // Show 3 chips — current + next 2
      const chips = [text];
      let idx = suggestionIndex;
      for (let i = 0; i < 2; i++) {
        idx = (idx + 1) % SUGGESTIONS.length;
        if (!chips.includes(SUGGESTIONS[idx])) chips.push(SUGGESTIONS[idx]);
      }

      chips.forEach(chipText => {
        const btn = document.createElement('button');
        btn.className = 'pg-chat-suggestion';
        btn.textContent = chipText;
        btn.title = chipText;
        btn.setAttribute('aria-label', `Suggested: ${chipText}`);
        btn.addEventListener('click', () => {
          if (isBusy) return;
          inputEl.value = chipText;
          inputEl.style.height = 'auto';
          inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
          sendBtn.disabled = false;
          btn.classList.add('populated');
          inputEl.focus();
          const l = inputEl.value.length;
          inputEl.setSelectionRange(l, l);
        });
        suggestionsEl.appendChild(btn);
      });
    }

    function appendMessage(role, content, isHtml = false) {
      const wrap   = document.createElement('div');
      wrap.className = `pg-chat-msg ${role}`;
      const bubble = document.createElement('div');
      bubble.className = 'pg-chat-bubble';
      if (isHtml) bubble.innerHTML = content;
      else        bubble.textContent = content;
      // Add copy buttons to code blocks
      if (isHtml) {
        bubble.querySelectorAll('pre.pg-chat-code').forEach(pre => {
          const copyBtn = document.createElement('button');
          copyBtn.textContent = 'Copy';
          copyBtn.style.cssText = 'position:absolute;top:6px;right:6px;font-size:10px;padding:2px 8px;background:rgba(79,70,229,.5);color:#fff;border:none;border-radius:5px;cursor:pointer;opacity:.7;transition:opacity .15s;font-family:inherit;';
          copyBtn.addEventListener('mouseenter', () => copyBtn.style.opacity = '1');
          copyBtn.addEventListener('mouseleave', () => copyBtn.style.opacity = '.7');
          copyBtn.addEventListener('click', () => {
            const code = pre.querySelector('code')?.innerText || pre.innerText;
            navigator.clipboard.writeText(code).then(() => {
              copyBtn.textContent = '✓ Copied';
              setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
            });
          });
          pre.style.position = 'relative';
          pre.appendChild(copyBtn);
        });
      }
      wrap.appendChild(bubble);
      messagesEl.appendChild(wrap);
      scrollToBottom();
      return wrap;
    }

    // ─── Export helpers ────────────────────────────────────────────────────────
    function getChatAsMarkdown() {
      const msgs = messagesEl.querySelectorAll('.pg-chat-msg');
      let md = '# Poly-Glot Chat Export\n';
      md += `_Exported ${new Date().toLocaleString()}_\n\n---\n\n`;
      msgs.forEach(msg => {
        const isBot = msg.classList.contains('bot');
        const bubble = msg.querySelector('.pg-chat-bubble');
        if (!bubble) return;
        const label = isBot ? '**🦜 Poly-Glot**' : '**You**';
        // Convert HTML back to readable text/markdown
        let text = bubble.innerHTML
          .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, c) => '\n```\n' + c.replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&') + '\n```\n')
          .replace(/<code[^>]*>([^<]*)<\/code>/gi, (_, c) => '`' + c.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&') + '`')
          .replace(/<strong>([^<]*)<\/strong>/gi, '**$1**')
          .replace(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '[$2]($1)')
          .replace(/<li>([\s\S]*?)<\/li>/gi, '- $1\n')
          .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '$1')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ')
          .trim();
        if (text) md += `${label}\n${text}\n\n`;
      });
      return md;
    }

    function getChatAsText() {
      const msgs = messagesEl.querySelectorAll('.pg-chat-msg');
      let txt = `Poly-Glot Chat Export — ${new Date().toLocaleString()}\n`;
      txt += '='.repeat(50) + '\n\n';
      msgs.forEach(msg => {
        const isBot = msg.classList.contains('bot');
        const bubble = msg.querySelector('.pg-chat-bubble');
        if (!bubble) return;
        const label = isBot ? 'Poly-Glot' : 'You';
        const text = (bubble.innerText || bubble.textContent || '').trim();
        if (text) txt += `[${label}]\n${text}\n\n`;
      });
      return txt;
    }

    function getChatAsJSON() {
      const msgs = messagesEl.querySelectorAll('.pg-chat-msg');
      const data = { exported: new Date().toISOString(), messages: [] };
      msgs.forEach(msg => {
        const isBot = msg.classList.contains('bot');
        const bubble = msg.querySelector('.pg-chat-bubble');
        if (!bubble) return;
        const text = (bubble.innerText || bubble.textContent || '').trim();
        if (text) data.messages.push({ role: isBot ? 'assistant' : 'user', content: text });
      });
      return JSON.stringify(data, null, 2);
    }

    function downloadFile(content, filename, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function showToast(msg) {
      const toast = document.getElementById('pg-export-toast');
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }

    // ─── Export footer bar wiring ──────────────────────────────────────────────
    document.getElementById('pg-export-md').addEventListener('click', () => {
      downloadFile(getChatAsMarkdown(), `poly-glot-chat-${Date.now()}.md`, 'text/markdown');
      showToast('Downloaded as .md');
    });
    document.getElementById('pg-export-txt').addEventListener('click', () => {
      downloadFile(getChatAsText(), `poly-glot-chat-${Date.now()}.txt`, 'text/plain');
      showToast('Downloaded as .txt');
    });
    document.getElementById('pg-export-json').addEventListener('click', () => {
      downloadFile(getChatAsJSON(), `poly-glot-chat-${Date.now()}.json`, 'application/json');
      showToast('Downloaded as .json');
    });
    document.getElementById('pg-export-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(getChatAsMarkdown()).then(() => {
        showToast('Copied to clipboard!');
      });
    });

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
      if (text.length > MAX_CHARS) {
        appendMessage('bot', `⚠️ Message too long (${text.length.toLocaleString()} chars). Please keep it under ${MAX_CHARS.toLocaleString()} characters (~500 lines of code).`, false);
        return;
      }

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
          "Hey! 👋 I'm the Poly-Glot assistant. Ask me about setup, pricing, or any feature — VS Code, GitHub App, CLI, or MCP. New to Poly-Glot? Try Google Gemini — it's free to start at aistudio.google.com. Or paste code and I'll explain it, find bugs, or write tests!",
          "Hi there! 🦜 Ask me anything about Poly-Glot — features, pricing, VS Code, GitHub App, CLI, MCP. Need an API key? Google AI Studio is free to get started. Or paste a function and I'll find bugs, suggest refactors, or write unit tests!",
          "Hello! I'm your Poly-Glot guide. You can use OpenAI, Anthropic, or Google Gemini (free tier available!). Ask me about setup, the GitHub App, VS Code extension, CLI, MCP, pricing, or paste code to explain, debug, or refactor it.",
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

    function updateCharCounter() {
      const len = inputEl.value.length;
      const remaining = MAX_CHARS - len;
      if (len === 0) {
        charCounter.textContent = '';
        charCounter.className = 'pg-chat-char-counter';
      } else if (remaining <= 0) {
        charCounter.textContent = `0 / ${MAX_CHARS.toLocaleString()} — limit reached`;
        charCounter.className = 'pg-chat-char-counter error';
      } else if (remaining <= 2000) {
        charCounter.textContent = `${remaining.toLocaleString()} chars remaining`;
        charCounter.className = 'pg-chat-char-counter warn';
      } else {
        charCounter.textContent = '';
        charCounter.className = 'pg-chat-char-counter';
      }
      sendBtn.disabled = !inputEl.value.trim() || len > MAX_CHARS;
    }

    inputEl.addEventListener('input', () => {
      const chip = suggestionsEl.querySelector('.pg-chat-suggestion');
      if (chip) chip.classList.remove('populated');
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
      updateCharCounter();
    });

    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isBusy && inputEl.value.trim() && inputEl.value.length <= MAX_CHARS) sendMessage(inputEl.value);
      }
    });

    sendBtn.addEventListener('click', () => {
      if (!isBusy && inputEl.value.trim() && inputEl.value.length <= MAX_CHARS) sendMessage(inputEl.value);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();






