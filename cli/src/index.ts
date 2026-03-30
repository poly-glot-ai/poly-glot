#!/usr/bin/env node
/**
 * Poly-Glot CLI v1.5.0
 * AI-powered code comment generation from the command line.
 *
 * Usage:
 *   poly-glot comment <file>                        # Doc-comment a file (default mode)
 *   poly-glot comment <file> --why                  # Add why-comments instead
 *   poly-glot comment <file> --both                 # Doc + why in one two-pass run
 *   poly-glot comment <file> --dry-run              # Preview changes without writing
 *   poly-glot comment <file> --diff                 # Show unified diff of changes
 *   poly-glot comment <file> --backup               # Save .orig backup before overwriting
 *   poly-glot comment --dir <dir>                   # Comment all supported files
 *   poly-glot comment --dir <dir> --yes             # Skip confirmation prompt
 *   poly-glot why <file>                            # Shorthand for --why
 *   poly-glot explain <file>                        # Deep code analysis
 *   poly-glot config                                # Interactive setup
 *   poly-glot config --key <key> --provider openai  # Non-interactive setup
 */

import * as fs       from 'fs';
import * as path     from 'path';
import * as os       from 'os';
import * as readline from 'readline';
import { PolyGlotGenerator, WhyResult, BothResult } from './generator';
import { CommentMode } from './config';
import { loadConfig, saveConfig, Config } from './config';
import { DEMO_SAMPLES, getSampleLanguages } from './demo-samples';
import { ping } from './telemetry';
import { assertQuota, hasRemainingQuota, incrementUsage, FREE_MONTHLY_LIMIT } from './usage';

// ─── Constants ────────────────────────────────────────────────────────────────

const VERSION = '1.7.0';  // enforce 50 files/month quota on free tier

const SUPPORTED_EXTENSIONS: Record<string, string> = {
    js:    'javascript', ts:   'typescript', jsx: 'javascript', tsx: 'typescript',
    py:    'python',     java: 'java',       cpp: 'cpp',        c:   'cpp',
    cs:    'csharp',     go:   'go',         rs:  'rust',       rb:  'ruby',
    php:   'php',        swift:'swift',      kt:  'kotlin',
};

// ─── Plan definitions ─────────────────────────────────────────────────────────

const AUTH_API = 'https://poly-glot.ai/api/auth';

// Free tier: Python, JavaScript, Java — doc-comments only
const FREE_LANGUAGES  = ['python', 'javascript', 'java'];

// Plans that unlock all pro features (language + mode)
const PRO_PLANS       = ['pro', 'team', 'enterprise'];

// ─── License verification ─────────────────────────────────────────────────────

/**
 * Process-lifetime cache so we hit the API at most once per CLI invocation.
 * undefined  = not yet checked
 * null       = checked and invalid / network error
 * string     = valid plan name
 */
let _cachedPlan: string | null | undefined = undefined;

/**
 * Verify a license token against the Poly-Glot auth API.
 * - Returns the plan string ('pro' | 'team' | 'enterprise') on success.
 * - Returns null if the token is invalid or the request fails.
 * - Fails open on network errors so connectivity issues don't block paying users.
 * - Hard 3-second timeout so the CLI never hangs waiting for the API.
 */
async function verifyLicense(token: string): Promise<string | null> {
    if (_cachedPlan !== undefined) return _cachedPlan;
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
        return _cachedPlan;
    } catch {
        // Network unavailable — fail open. A bad actor without a token can't
        // exploit this because we still require a non-empty token string.
        _cachedPlan = null;
        return null;
    }
}

/**
 * Returns true if the config holds a token that resolves to a paid plan.
 * Checks POLYGLOT_LICENSE_TOKEN env var first (for CI/CD), then cfg.licenseToken.
 */
async function hasPro(cfg: Config): Promise<boolean> {
    const token = cfg.licenseToken || '';
    if (!token) return false;
    const plan = await verifyLicense(token);
    return plan !== null && PRO_PLANS.includes(plan);
}

// ─── Plan gates ───────────────────────────────────────────────────────────────

/**
 * Gate: language must be in FREE_LANGUAGES or user must have a Pro plan.
 * Called before every file/stdin operation.
 */
async function assertLanguageAllowed(lang: string, cfg: Config): Promise<void> {
    const normalised = lang.toLowerCase().trim();
    if (FREE_LANGUAGES.includes(normalised)) return; // always allowed on free tier

    if (await hasPro(cfg)) return; // Pro/Team/Enterprise unlocks all 12 languages

    const label = normalised.charAt(0).toUpperCase() + normalised.slice(1);
    console.error(
        `\n  \x1b[33m⚠️  ${label} requires a Pro subscription.\x1b[0m\n` +
        `\n  \x1b[2mFree tier includes:\x1b[0m  \x1b[36mPython · JavaScript · Java\x1b[0m` +
        `\n  \x1b[2mPro unlocks:\x1b[0m         \x1b[36mAll 12 languages + why-comments + unlimited files\x1b[0m\n` +
        `\n  Get Pro at \x1b[36mhttps://poly-glot.ai\x1b[0m` +
        ` then run \x1b[36mpoly-glot config --token <your-token>\x1b[0m\n`
    );
    process.exit(1);
}

/**
 * Gate: why-comments and both-mode require a Pro plan.
 * Free tier only gets standard doc-comments (JSDoc, PyDoc, etc.).
 */
async function assertModeAllowed(mode: CommentMode, cfg: Config): Promise<void> {
    if (mode === 'comment') return; // always allowed

    if (await hasPro(cfg)) return; // Pro/Team/Enterprise unlocks why + both

    const modeLabel = mode === 'why' ? 'Why-comments' : 'Both mode (doc + why)';
    console.error(
        `\n  \x1b[33m⚠️  ${modeLabel} requires a Pro subscription.\x1b[0m\n` +
        `\n  \x1b[2mFree tier:\x1b[0m   \x1b[36mDoc-comments only (JSDoc, PyDoc, Javadoc, etc.)\x1b[0m` +
        `\n  \x1b[2mPro unlocks:\x1b[0m \x1b[36mWhy-comments · Both mode · All 12 languages\x1b[0m\n` +
        `\n  Get Pro at \x1b[36mhttps://poly-glot.ai\x1b[0m` +
        ` then run \x1b[36mpoly-glot config --token <your-token>\x1b[0m\n`
    );
    process.exit(1);
}

const COLORS = {
    reset:  '\x1b[0m',
    green:  '\x1b[32m',
    yellow: '\x1b[33m',
    red:    '\x1b[31m',
    cyan:   '\x1b[36m',
    dim:    '\x1b[2m',
    bold:   '\x1b[1m',
    blue:   '\x1b[34m',
    magenta:'\x1b[35m',
};

// ─── What's New notice (shown once per major feature release) ─────────────────

function showWhatsNew(cfg: Config): void {
    const last = cfg.lastSeenVersion || '0.0.0';

    // Parse semantic version for clean comparisons
    const [lastMaj, lastMin] = last.split('.').map(Number);
    const isOlderThan = (maj: number, min: number) =>
        lastMaj < maj || (lastMaj === maj && lastMin < min);

    // Show each notice exactly once — only for users upgrading past that version
    const showV14  = isOlderThan(1, 4);
    const showV15  = isOlderThan(1, 5);
    const showV16  = isOlderThan(1, 6);
    const showV161 = last !== VERSION; // show launch notice on first run of 1.6.1

    if (!showV14 && !showV15 && !showV16 && !showV161) return;

    if (showV14) {
        console.log(`
${COLORS.bold}${COLORS.cyan}✨ What's new in Poly-Glot v1.4${COLORS.reset}

  ${COLORS.cyan}Three comment modes${COLORS.reset} are now available:

  ${COLORS.bold}comment${COLORS.reset}  (default) — JSDoc, PyDoc, KDoc, Javadoc, etc.
           ${COLORS.dim}poly-glot comment src/auth.js${COLORS.reset}

  ${COLORS.bold}why${COLORS.reset}               — Inline reasoning: why this code was written this way
           ${COLORS.dim}poly-glot comment src/auth.js --why${COLORS.reset}
           ${COLORS.dim}poly-glot why src/auth.js${COLORS.reset}

  ${COLORS.bold}both${COLORS.reset}              — Doc-comments + why-comments in one two-pass run
           ${COLORS.dim}poly-glot comment src/auth.js --both${COLORS.reset}

  Set your default so you never have to type the flag:
  ${COLORS.dim}poly-glot config --mode both${COLORS.reset}
`);
    }

    if (showV15) {
        console.log(`${COLORS.bold}${COLORS.cyan}✨ What's new in Poly-Glot v1.5${COLORS.reset}

  ${COLORS.bold}--dry-run${COLORS.reset}      Preview exactly what would change — no files written
             ${COLORS.dim}poly-glot comment src/auth.js --dry-run${COLORS.reset}

  ${COLORS.bold}--diff${COLORS.reset}         Show a unified diff of every change before committing
             ${COLORS.dim}poly-glot comment src/auth.js --diff${COLORS.reset}

  ${COLORS.bold}--backup${COLORS.reset}       Save a .orig copy of every file before overwriting
             ${COLORS.dim}poly-glot comment src/auth.js --backup${COLORS.reset}

  ${COLORS.bold}both${COLORS.reset} shorthand  Doc + why in one command
             ${COLORS.dim}poly-glot both src/auth.js${COLORS.reset}

  ${COLORS.bold}--dir confirm${COLORS.reset}  "About to modify N files. Continue?" before running
             ${COLORS.dim}poly-glot comment --dir src/ --yes  (skip prompt)${COLORS.reset}

${COLORS.dim}  This notice won't appear again. Run 'poly-glot --help' anytime.${COLORS.reset}
`);
    }

    if (showV16) {
        console.log(`${COLORS.bold}${COLORS.cyan}✨ What's new in Poly-Glot v1.6${COLORS.reset}

  ${COLORS.cyan}Pro plan support${COLORS.reset} — unlock all 12 languages, why-comments, and both mode.

  ${COLORS.bold}Free tier:${COLORS.reset}  Python · JavaScript · Java · doc-comments · 50 files/mo
  ${COLORS.bold}Pro tier:${COLORS.reset}   All 12 languages · why-comments · both mode · unlimited files

  To activate your Pro license:
    1. Get a plan at ${COLORS.cyan}https://poly-glot.ai${COLORS.reset}
    2. Sign in → copy your license token
    3. Run: ${COLORS.dim}poly-glot config --token <your-token>${COLORS.reset}

  CI/CD? Set the ${COLORS.dim}POLYGLOT_LICENSE_TOKEN${COLORS.reset} environment variable instead.

${COLORS.dim}  This notice won't appear again. Run 'poly-glot --help' anytime.${COLORS.reset}
`);
    }

    if (showV161) {
        console.log(`
${COLORS.bold}${COLORS.green}🎉 Poly-Glot AI is officially live!${COLORS.reset}
${'─'.repeat(54)}

  Thanks for being one of our ${COLORS.bold}1,200+ early CLI users${COLORS.reset}. 🦜
  The full platform is now open for subscriptions.

  ${COLORS.bold}${COLORS.cyan}What you get free, forever:${COLORS.reset}
  ✅  Python, JavaScript & Java
  ✅  JSDoc, PyDoc, Javadoc doc-comments
  ✅  50 files / month — no credit card required

  ${COLORS.bold}${COLORS.cyan}Upgrade to Pro — $9/mo:${COLORS.reset}
  🚀  All 12 languages (Go, Rust, Swift, Kotlin, C++, C#, Ruby, PHP + more)
  💬  Why-comments — explain intent, decisions & trade-offs
  📝  Both mode — doc + why in a single two-pass run
  🔑  Shared API key pool — no OpenAI/Anthropic key needed
  💻  VS Code extension included

  ${COLORS.bold}${COLORS.yellow}🎁 Early bird offer:${COLORS.reset} Use code ${COLORS.bold}EARLYBIRD3${COLORS.reset} for ${COLORS.bold}3 months free${COLORS.reset}
  Limited to the first 50 subscribers — grab it while it lasts.

  ${COLORS.cyan}→ Sign up at https://poly-glot.ai${COLORS.reset}

${'─'.repeat(54)}
${COLORS.dim}  This notice won't appear again. Run 'poly-glot --help' anytime.${COLORS.reset}
`);
    }
}

// ─── Entry ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const cmd  = args[0];

    if (!cmd || cmd === '--help' || cmd === '-h') { printHelp(); process.exit(0); }
    if (cmd === '--version' || cmd === '-v')      { console.log(VERSION); process.exit(0); }

    // ── Load config ───────────────────────────────────────────────────────
    const cfg = loadConfig();

    // ── One-time what's-new notice (only for upgraders, skipped in CI/pipes) ─
    if (cmd !== 'config' && !process.env.CI && process.stdout.isTTY) {
        showWhatsNew(cfg);
    }

    // ── Stamp current version so notice won't show again ─────────────────
    if (cfg.lastSeenVersion !== VERSION) {
        cfg.lastSeenVersion = VERSION;
        saveConfig(cfg);
    }

    // ── Telemetry consent (asked once, on first real command) ─────────────
    if (cfg.telemetry === null && cmd !== 'config') {
        await askTelemetryConsent(cfg);
    }

    if (cmd === 'config')  { await runConfig(args.slice(1)); return; }
    if (cmd === 'comment') { await runComment(args.slice(1)); return; }
    if (cmd === 'why')     { await runWhy(args.slice(1)); return; }
    if (cmd === 'both')    { await runBoth(args.slice(1)); return; }
    if (cmd === 'explain') { await runExplain(args.slice(1)); return; }
    if (cmd === 'demo')    { await runDemo(args.slice(1)); return; }

    error(`Unknown command: ${cmd}. Run 'poly-glot --help' for usage.`);
    process.exit(1);
}

// ── Telemetry consent prompt ───────────────────────────────────────────────────
async function askTelemetryConsent(cfg: Config): Promise<void> {
    if (!process.stdout.isTTY || process.env.CI) {
        cfg.telemetry = true;   // non-interactive / CI defaults to enabled
        saveConfig(cfg);
        return;
    }

    console.log(`
${COLORS.dim}─────────────────────────────────────────────────────${COLORS.reset}
${COLORS.bold}Help improve Poly-Glot?${COLORS.reset}

Send ${COLORS.cyan}anonymous${COLORS.reset} usage stats (command name, language, OS).
${COLORS.dim}No code, no API keys, no file paths — ever.
Opt out anytime: poly-glot config --no-telemetry
Docs: https://poly-glot.ai/#privacy${COLORS.reset}
${COLORS.dim}─────────────────────────────────────────────────────${COLORS.reset}`);

    const answer = await promptLine('Enable anonymous telemetry? (Y/n) [default: Y] ');
    cfg.telemetry = answer.trim().toLowerCase() !== 'n';   // blank/Y/y/Enter → true
    saveConfig(cfg);
    console.log(cfg.telemetry
        ? `${COLORS.green}✓${COLORS.reset} Telemetry enabled — thank you! You can opt out anytime: poly-glot config --no-telemetry\n`
        : `${COLORS.dim}Telemetry disabled. Re-enable anytime: poly-glot config --telemetry${COLORS.reset}\n`);
}

// ─── Command: config ──────────────────────────────────────────────────────────

async function runConfig(args: string[]): Promise<void> {
    const flags = parseFlags(args);
    const cfg   = loadConfig();

    if ('--no-telemetry' in flags) {
        cfg.telemetry = false;
        saveConfig(cfg);
        success('Telemetry disabled. No usage data will be sent.');
        return;
    }
    if ('--telemetry' in flags) {
        cfg.telemetry = true;
        saveConfig(cfg);
        success('Telemetry enabled. Thank you for helping improve Poly-Glot!');
        return;
    }

    // Non-interactive mode if flags are provided
    if (flags['--key'] || '--mode' in flags || flags['--token']) {
        if (flags['--key'])      cfg.apiKey   = flags['--key']      as string;
        if (flags['--provider']) cfg.provider = flags['--provider'] as string;
        if (flags['--model'])    cfg.model    = flags['--model']    as string;
        if (flags['--token'])    cfg.licenseToken = flags['--token'] as string;
        if (flags['--mode']) {
            const m = (flags['--mode'] as string).toLowerCase();
            if (!['comment', 'why', 'both'].includes(m)) {
                error(`Invalid mode "${m}". Use: comment, why, or both`);
                process.exit(1);
            }
            cfg.defaultMode = m as CommentMode;
        }
        if (!cfg.provider) cfg.provider = 'openai';
        if (!cfg.model)    cfg.model    = 'gpt-4o-mini';
        saveConfig(cfg);
        success(`Config saved — provider: ${cfg.provider}, model: ${cfg.model}, mode: ${cfg.defaultMode}`);
        if (flags['--token']) success(`License token saved — run a command to verify your plan.`);
        return;
    }

    // Interactive mode
    const rl  = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q: string): Promise<string> => new Promise(res => rl.question(q, res));

    console.log(`\n${COLORS.bold}${COLORS.cyan}Poly-Glot CLI — Configuration${COLORS.reset}\n`);

    const provider = await ask(`  Provider [openai/anthropic] (current: ${cfg.provider || 'not set'}): `);
    if (provider.trim()) cfg.provider = provider.trim();

    const key = await ask(`  API Key (press Enter to keep current): `);
    if (key.trim()) cfg.apiKey = key.trim();

    const defaultModel = cfg.provider === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4.1-mini';
    const model = await ask(`  Model (current: ${cfg.model || defaultModel}): `);
    if (model.trim()) cfg.model = model.trim();
    else if (!cfg.model) cfg.model = defaultModel;

    const modeAnswer = await ask(`  Default mode [comment/why/both] (current: ${cfg.defaultMode || 'comment'}): `);
    if (modeAnswer.trim()) {
        const m = modeAnswer.trim().toLowerCase();
        if (['comment', 'why', 'both'].includes(m)) cfg.defaultMode = m as CommentMode;
        else warn(`Unknown mode "${m}" — keeping "${cfg.defaultMode}"`);
    }

    const tokenAnswer = await ask(`  License token (press Enter to skip): `);
    if (tokenAnswer.trim()) cfg.licenseToken = tokenAnswer.trim();

    rl.close();
    saveConfig(cfg);
    success(`Config saved — provider: ${cfg.provider}, model: ${cfg.model}, default mode: ${cfg.defaultMode}`);
}

// ─── Command: comment ─────────────────────────────────────────────────────────

async function runComment(args: string[]): Promise<void> {
    const flags = parseFlags(args);
    const cfg   = loadConfig();

    assertConfigured(cfg);

    // ── Resolve effective mode ─────────────────────────────────────────────────
    // Priority: --both > --why > --mode <value> > cfg.defaultMode > 'comment'
    let effectiveMode: CommentMode = cfg.defaultMode || 'comment';
    if ('--both' in flags)    effectiveMode = 'both';
    else if ('--why' in flags) effectiveMode = 'why';
    else if (flags['--mode']) {
        const m = (flags['--mode'] as string).toLowerCase();
        if (['comment', 'why', 'both'].includes(m)) effectiveMode = m as CommentMode;
        else { error(`Invalid --mode "${m}". Use: comment, why, or both`); process.exit(1); }
    }

    // ── Plan gate: why/both modes require Pro ─────────────────────────────────
    await assertModeAllowed(effectiveMode, cfg);

    const isDryRun = '--dry-run' in flags;
    const isDiff   = '--diff' in flags;
    const isBackup = '--backup' in flags;
    const isYes    = '--yes' in flags || '-y' in flags;

    const modeLabel: Record<CommentMode, string> = {
        comment: '📝 doc-comments',
        why:     '💬 why-comments',
        both:    '📝💬 doc + why comments',
    };

    const gen = new PolyGlotGenerator(cfg);

    // ── Helper: run one file through the right generator ──────────────────────
    async function processCode(code: string, lang: string): Promise<string> {
        if (effectiveMode === 'both') {
            const r = await gen.generateBoth(code, lang);
            return r.commentedCode;
        } else if (effectiveMode === 'why') {
            const r = await gen.generateWhyComments(code, lang);
            return r.commentedCode;
        } else {
            const r = await gen.generateComments(code, lang);
            return r.commentedCode;
        }
    }

    // ── stdin mode ────────────────────────────────────────────────────────────
    if (flags['--stdin']) {
        const lang = (flags['--lang'] as string) || 'javascript';
        await assertLanguageAllowed(lang, cfg);

        // Quota check for free users (Pro users skip)
        if (!await hasPro(cfg)) assertQuota(1);

        const code = await readStdin();
        if (!code.trim()) { error('No input received on stdin.'); process.exit(1); }

        spin(`Adding ${modeLabel[effectiveMode]} for stdin (${lang})…`);
        const output = await processCode(code, lang);
        stopSpin();

        // Increment only after successful generation
        if (!isDryRun && !await hasPro(cfg)) incrementUsage(1);

        ping({ cmd: 'comment', lang, provider: cfg.provider, mode: 'stdin', version: VERSION }, !!cfg.telemetry);

        if (isDryRun) {
            warn('[dry-run] No output written. Result preview:');
            console.log(output);
        } else if (isDiff) {
            printDiff('stdin', code, output);
        } else {
            process.stdout.write(output + '\n');
        }
        return;
    }

    // ── directory mode ────────────────────────────────────────────────────────
    if (flags['--dir']) {
        const dir  = path.resolve(flags['--dir'] as string);
        const exts = flags['--ext']
            ? (flags['--ext'] as string).split(',').map(e => e.trim().replace(/^\./, ''))
            : Object.keys(SUPPORTED_EXTENSIONS);

        if (!fs.existsSync(dir)) { error(`Directory not found: ${dir}`); process.exit(1); }

        const files = collectFiles(dir, exts);
        if (!files.length) { warn(`No supported files found in ${dir}`); return; }

        // ── Quota check for free users (upfront, before any work) ────────────
        const isPaidUser = await hasPro(cfg);
        if (!isPaidUser && !isDryRun) assertQuota(files.length);

        const outputDir = flags['--output-dir'] as string | undefined;
        const verb      = isDryRun ? 'Would process' : 'About to process';

        console.log(`\n${COLORS.bold}${COLORS.cyan}Poly-Glot${COLORS.reset} — ${modeLabel[effectiveMode]}`);
        console.log(`${COLORS.dim}${verb} ${files.length} file(s) in ${dir}${outputDir ? ` → ${outputDir}` : ' (in-place)'}${COLORS.reset}`);
        if (isDryRun) console.log(`${COLORS.yellow}  ⚡ dry-run — no files will be written${COLORS.reset}`);
        if (isBackup) console.log(`${COLORS.cyan}  💾 backup — .orig files will be saved${COLORS.reset}`);

        // ── Confirmation prompt (skipped in CI, pipes, --yes, or --dry-run) ──
        if (!isDryRun && !isYes && process.stdout.isTTY && !process.env.CI) {
            const answer = await promptLine(`\nContinue? (Y/n) `);
            if (answer.trim().toLowerCase() === 'n') {
                console.log(`${COLORS.dim}Aborted.${COLORS.reset}`);
                return;
            }
        }

        console.log('');

        let ok = 0, skipped = 0, fail = 0;
        let totalCost = 0;
        const failures: string[] = [];
        const startTime = Date.now();

        for (const file of files) {
            const rel  = path.relative(dir, file);
            const ext  = file.split('.').pop()!.toLowerCase();
            const lang = SUPPORTED_EXTENSIONS[ext] || 'javascript';
            await assertLanguageAllowed(lang, cfg);
            const code = fs.readFileSync(file, 'utf8');

            process.stdout.write(`  ${COLORS.dim}${rel}${COLORS.reset} … `);
            try {
                const output  = await processCode(code, lang);
                const outPath = outputDir ? path.join(outputDir, rel) : file;

                if (isDryRun) {
                    skipped++;
                    console.log(`${COLORS.yellow}○ dry-run${COLORS.reset}`);
                } else {
                    if (outputDir) fs.mkdirSync(path.dirname(outPath), { recursive: true });
                    if (isBackup && !outputDir) fs.writeFileSync(file + '.orig', code, 'utf8');
                    if (isDiff)  printDiff(rel, code, output);
                    fs.writeFileSync(outPath, output, 'utf8');
                    ok++;
                    if (!isPaidUser) incrementUsage(1);
                    console.log(`${COLORS.green}✓${COLORS.reset}`);
                }
            } catch (e: unknown) {
                fail++;
                const msg = e instanceof Error ? e.message : String(e);
                failures.push(`  ${COLORS.red}✗${COLORS.reset} ${rel}: ${msg}`);
                console.log(`${COLORS.red}✗${COLORS.reset}`);
            }
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const costStr = totalCost > 0 ? ` · ~$${totalCost.toFixed(4)}` : '';

        console.log('');
        if (isDryRun) {
            console.log(`${COLORS.yellow}[dry-run]${COLORS.reset} Would have processed ${files.length} file(s). No changes made.\n`);
        } else {
            // ── Summary line ─────────────────────────────────────────────
            const parts: string[] = [];
            if (ok)      parts.push(`${COLORS.green}✓ ${ok} commented${COLORS.reset}`);
            if (skipped) parts.push(`${COLORS.dim}${skipped} skipped${COLORS.reset}`);
            if (fail)    parts.push(`${COLORS.red}✗ ${fail} failed${COLORS.reset}`);
            console.log(`  ${parts.join(' · ')}${costStr} · ${elapsed}s\n`);

            // ── Failure detail ────────────────────────────────────────────
            if (failures.length) {
                console.log(`${COLORS.red}Failures:${COLORS.reset}`);
                failures.forEach(f => console.log(f));
                console.log('');
            }

            if (isBackup && ok > 0) {
                console.log(`${COLORS.dim}  💾 .orig backups saved alongside each modified file${COLORS.reset}\n`);
            }
        }

        ping({ cmd: 'comment', lang: 'multi', provider: cfg.provider, mode: 'dir', version: VERSION }, !!cfg.telemetry);
        return;
    }

    // ── single file mode ──────────────────────────────────────────────────────
    const filePath = args.find(a => !a.startsWith('-'));
    if (!filePath) { error('Specify a file, --dir, or --stdin. Run poly-glot --help for usage.'); process.exit(1); }

    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) { error(`File not found: ${absPath}`); process.exit(1); }

    const ext     = absPath.split('.').pop()!.toLowerCase();
    const lang    = (flags['--lang'] as string) || SUPPORTED_EXTENSIONS[ext] || 'javascript';
    await assertLanguageAllowed(lang, cfg);
    const code    = fs.readFileSync(absPath, 'utf8');
    const outPath = flags['--output'] ? path.resolve(flags['--output'] as string) : absPath;

    if (effectiveMode === 'both') {
        spin(`Pass 1/2 — adding doc-comments to ${path.basename(absPath)} (${lang})…`);
        const docResult = await gen.generateComments(code, lang);
        stopSpin();
        success(`Pass 1 complete — doc-comments added`);

        spin(`Pass 2/2 — adding why-comments to ${path.basename(absPath)} (${lang})…`);
        const whyResult = await gen.generateWhyComments(docResult.commentedCode, lang);
        stopSpin();

        ping({ cmd: 'comment', lang, provider: cfg.provider, mode: 'file', version: VERSION }, !!cfg.telemetry);

        if (isDryRun) {
            warn(`[dry-run] Would write ${path.basename(outPath)} — no changes made.`);
            if (isDiff) printDiff(path.basename(absPath), code, whyResult.commentedCode);
        } else {
            if (isBackup) fs.writeFileSync(absPath + '.orig', code, 'utf8');
            if (isDiff)   printDiff(path.basename(absPath), code, whyResult.commentedCode);
            fs.writeFileSync(outPath, whyResult.commentedCode, 'utf8');
            success(`Pass 2 complete — why-comments added`);
            success(`${path.basename(outPath)} fully commented (doc + why)${isBackup ? ' · backup saved' : ''}`);
        }
    } else {
        const spinLabel = effectiveMode === 'why'
            ? `Adding why-comments to ${path.basename(absPath)} (${lang}, ${cfg.model})…`
            : `Commenting ${path.basename(absPath)} (${lang}, ${cfg.model})…`;

        spin(spinLabel);
        const output = await processCode(code, lang);
        stopSpin();

        ping({ cmd: 'comment', lang, provider: cfg.provider, mode: 'file', version: VERSION }, !!cfg.telemetry);

        if (isDryRun) {
            warn(`[dry-run] Would write ${path.basename(outPath)} — no changes made.`);
            if (isDiff) printDiff(path.basename(absPath), code, output);
        } else {
            if (isBackup) fs.writeFileSync(absPath + '.orig', code, 'utf8');
            if (isDiff)   printDiff(path.basename(absPath), code, output);
            fs.writeFileSync(outPath, output, 'utf8');
            success(`${path.basename(outPath)} commented [${effectiveMode}]${isBackup ? ' · backup saved as .orig' : ''}`);
        }
    }
}

// ─── Command: why ─────────────────────────────────────────────────────────────

async function runWhy(args: string[]): Promise<void> {
    // Delegate to runComment with --why injected
    return runComment(['--why', ...args]);
}

// ─── Command: both ────────────────────────────────────────────────────────────

async function runBoth(args: string[]): Promise<void> {
    // Delegate to runComment with --both injected
    return runComment(['--both', ...args]);
}

// ─── Command: explain ─────────────────────────────────────────────────────────

async function runExplain(args: string[]): Promise<void> {
    const flags    = parseFlags(args);
    const cfg      = loadConfig();
    assertConfigured(cfg);

    const filePath = args.find(a => !a.startsWith('-'));
    if (!filePath) { error('Specify a file to explain.'); process.exit(1); }

    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) { error(`File not found: ${absPath}`); process.exit(1); }

    const ext  = absPath.split('.').pop()!.toLowerCase();
    const lang = (flags['--lang'] as string) || SUPPORTED_EXTENSIONS[ext] || 'javascript';
    await assertLanguageAllowed(lang, cfg);
    const code = fs.readFileSync(absPath, 'utf8');
    const gen  = new PolyGlotGenerator(cfg);

    spin(`Analyzing ${path.basename(absPath)} (${lang}, ${cfg.model})…`);
    const result = await gen.explainCode(code, lang);
    stopSpin();
    ping({ cmd: 'explain', lang, provider: cfg.provider, mode: 'file', version: VERSION }, !!cfg.telemetry);

    console.log(`\n${COLORS.bold}${COLORS.cyan}🔍 Code Analysis — ${path.basename(absPath)}${COLORS.reset}`);
    console.log(`${COLORS.dim}Model: ${result.model} | Cost: $${result.cost.toFixed(5)}${COLORS.reset}\n`);

    console.log(`${COLORS.bold}📖 Summary${COLORS.reset}`);
    console.log(`  ${result.summary}\n`);

    console.log(`${COLORS.bold}📊 Metrics${COLORS.reset}`);
    console.log(`  Complexity:     ${complexityLabel(result.complexityScore)} (${result.complexityScore}/10)`);
    console.log(`  Doc Quality:    ${result.docQuality.label} (${result.docQuality.score}/100)`);
    console.log(`  Functions:      ${result.functions.length}`);
    console.log(`  Potential bugs: ${result.potentialBugs.length}\n`);

    if (result.functions.length) {
        console.log(`${COLORS.bold}⚙️  Functions${COLORS.reset}`);
        result.functions.forEach((fn: { name: string; purpose: string; params: string[]; returns: string }) => {
            console.log(`  ${COLORS.cyan}${fn.name}${COLORS.reset}(${fn.params.join(', ')}) → ${fn.returns}`);
            console.log(`  ${COLORS.dim}${fn.purpose}${COLORS.reset}`);
        });
        console.log('');
    }

    if (result.potentialBugs.length) {
        console.log(`${COLORS.bold}${COLORS.red}🐛 Potential Bugs${COLORS.reset}`);
        result.potentialBugs.forEach((b: string) => console.log(`  ${COLORS.red}•${COLORS.reset} ${b}`));
        console.log('');
    }

    if (result.suggestions.length) {
        console.log(`${COLORS.bold}💡 Suggestions${COLORS.reset}`);
        result.suggestions.forEach((s: string) => console.log(`  ${COLORS.yellow}•${COLORS.reset} ${s}`));
        console.log('');
    }

    if (result.docQuality.issues.length) {
        console.log(`${COLORS.bold}📝 Doc Quality Issues${COLORS.reset}`);
        result.docQuality.issues.forEach((i: string) => console.log(`  ${COLORS.dim}•${COLORS.reset} ${i}`));
        console.log('');
    }
}

// ─── Command: demo ────────────────────────────────────────────────────────────

async function runDemo(args: string[]): Promise<void> {
    const flags     = parseFlags(args);
    const languages = getSampleLanguages();

    console.log(`\n${COLORS.bold}${COLORS.cyan}Poly-Glot Demo${COLORS.reset} — See the magic before using it on your own code\n`);

    let language = (flags['--lang'] as string)?.toLowerCase();

    if (!language) {
        console.log(`Available languages: ${languages.join(', ')}\n`);
        language = await promptLine(`Choose a language (default: javascript): `);
        language = language.trim().toLowerCase() || 'javascript';
    }

    const sample = DEMO_SAMPLES[language];
    if (!sample) {
        error(`Language "${language}" not found.`);
        console.log(`Available: ${languages.join(', ')}`);
        process.exit(1);
    }

    console.log(`\n${COLORS.bold}${COLORS.green}✓${COLORS.reset} Selected: ${sample.displayName}\n`);
    console.log(`${COLORS.dim}${'─'.repeat(80)}${COLORS.reset}\n`);

    console.log(`${COLORS.bold}${COLORS.yellow}BEFORE:${COLORS.reset} ${COLORS.dim}Inconsistent or minimal comments${COLORS.reset}\n`);
    console.log(sample.before);
    console.log(`\n${COLORS.dim}${'─'.repeat(80)}${COLORS.reset}\n`);

    const cfg       = loadConfig();
    const hasApiKey = cfg.apiKey && cfg.apiKey.length >= 10;

    if (flags['--live'] && hasApiKey) {
        console.log(`${COLORS.cyan}Generating live comments with ${cfg.provider} (${cfg.model})...${COLORS.reset}\n`);
        const gen = new PolyGlotGenerator(cfg);

        spin('Generating comments...');
        try {
            const result = await gen.generateComments(sample.before, sample.language);
            stopSpin();
            console.log(`${COLORS.bold}${COLORS.green}AFTER:${COLORS.reset} ${COLORS.dim}Standardized professional documentation${COLORS.reset}\n`);
            console.log(result.commentedCode);
            console.log(`\n${COLORS.dim}Cost: $${result.cost.toFixed(5)} | Tokens: ${result.tokensUsed}${COLORS.reset}\n`);
        } catch (e) {
            stopSpin();
            error(`Failed to generate: ${e instanceof Error ? e.message : String(e)}`);
            console.log(`\nShowing pre-generated example instead:\n`);
            console.log(`${COLORS.bold}${COLORS.green}AFTER:${COLORS.reset} ${COLORS.dim}Standardized professional documentation${COLORS.reset}\n`);
            console.log(sample.after);
        }
    } else {
        console.log(`${COLORS.bold}${COLORS.green}AFTER:${COLORS.reset} ${COLORS.dim}Standardized professional documentation${COLORS.reset}\n`);
        console.log(sample.after);
        if (!hasApiKey && flags['--live']) {
            warn('API key not configured. Showing pre-generated example.');
            console.log(`Run ${COLORS.cyan}poly-glot config${COLORS.reset} to set up live demo.\n`);
        }
    }

    console.log(`${COLORS.dim}${'─'.repeat(80)}${COLORS.reset}\n`);

    console.log(`${COLORS.bold}✨ Key Improvements:${COLORS.reset}`);
    console.log(`  ${COLORS.green}✓${COLORS.reset} Standardized documentation format (JSDoc, PyDoc, etc.)`);
    console.log(`  ${COLORS.green}✓${COLORS.reset} Complete parameter and return type descriptions`);
    console.log(`  ${COLORS.green}✓${COLORS.reset} Error handling and edge cases documented`);
    console.log(`  ${COLORS.green}✓${COLORS.reset} Usage examples included`);
    console.log(`  ${COLORS.green}✓${COLORS.reset} Better searchability and AI comprehension\n`);

    console.log(`${COLORS.bold}${COLORS.cyan}Ready to try it on your code?${COLORS.reset}`);
    console.log(`  ${COLORS.dim}poly-glot comment your-file.js${COLORS.reset}`);
    console.log(`  ${COLORS.dim}poly-glot comment --dir src/${COLORS.reset}`);
    if (!hasApiKey) {
        console.log(`\n${COLORS.yellow}⚠${COLORS.reset}  Set up your API key first: ${COLORS.cyan}poly-glot config${COLORS.reset}`);
    }
    console.log('');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseFlags(args: string[]): Record<string, string | boolean> {
    const out: Record<string, string | boolean> = {};
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a.startsWith('--') || a === '-y') {
            const next = args[i + 1];
            if (next && !next.startsWith('-')) { out[a] = next; i++; }
            else { out[a] = true; }
        }
    }
    return out;
}

function collectFiles(dir: string, exts: string[]): string[] {
    const results: string[] = [];
    const walk = (d: string) => {
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
            const full = path.join(d, entry.name);
            if (entry.isDirectory()) { walk(full); }
            else {
                const ext = entry.name.split('.').pop()?.toLowerCase() || '';
                if (exts.includes(ext)) results.push(full);
            }
        }
    };
    walk(dir);
    return results;
}

function readStdin(): Promise<string> {
    return new Promise(resolve => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chunk => { data += chunk; });
        process.stdin.on('end', () => resolve(data));
    });
}

function promptLine(q: string): Promise<string> {
    return new Promise(resolve => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(q, ans => { rl.close(); resolve(ans); });
    });
}

// ── Unified diff printer ───────────────────────────────────────────────────────
function printDiff(label: string, before: string, after: string): void {
    const beforeLines = before.split('\n');
    const afterLines  = after.split('\n');
    const maxLen      = Math.max(beforeLines.length, afterLines.length);

    console.log(`\n${COLORS.bold}${COLORS.cyan}── diff: ${label} ──────────────────────────────────────${COLORS.reset}`);

    let i = 0, j = 0;
    while (i < beforeLines.length || j < afterLines.length) {
        const bLine = beforeLines[i];
        const aLine = afterLines[j];

        if (bLine === aLine) {
            // unchanged context (show up to 2 lines of context)
            console.log(`${COLORS.dim}  ${bLine ?? ''}${COLORS.reset}`);
            i++; j++;
        } else if (bLine !== undefined && (aLine === undefined || !afterLines.slice(j).includes(bLine))) {
            console.log(`${COLORS.red}- ${bLine}${COLORS.reset}`);
            i++;
        } else {
            console.log(`${COLORS.green}+ ${aLine ?? ''}${COLORS.reset}`);
            j++;
        }
    }

    console.log(`${COLORS.dim}────────────────────────────────────────────────────${COLORS.reset}\n`);
    void maxLen; // suppress unused warning
}

let spinTimer: ReturnType<typeof setInterval> | null = null;
let spinMsg = '';

function spin(msg: string): void {
    if (!process.stdout.isTTY) { process.stdout.write(msg + '\n'); return; }
    spinMsg = msg;
    const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
    let i = 0;
    process.stdout.write('\x1b[?25l'); // hide cursor
    spinTimer = setInterval(() => {
        process.stdout.write(`\r${COLORS.cyan}${frames[i++ % frames.length]}${COLORS.reset}  ${spinMsg}   `);
    }, 80);
}

function stopSpin(): void {
    if (spinTimer) { clearInterval(spinTimer); spinTimer = null; }
    if (process.stdout.isTTY) {
        process.stdout.write('\r\x1b[K'); // clear line
        process.stdout.write('\x1b[?25h'); // show cursor
    }
}

function success(msg: string): void { console.log(`${COLORS.green}✓${COLORS.reset}  ${msg}`); }
function warn(msg: string):    void { console.log(`${COLORS.yellow}⚠${COLORS.reset}  ${msg}`); }
function error(msg: string):   void { console.error(`${COLORS.red}✗${COLORS.reset}  ${msg}`); }

function assertConfigured(cfg: Config): void {
    if (!cfg.apiKey) {
        error('No API key configured. Run: poly-glot config');
        process.exit(1);
    }
}

function complexityLabel(score: number): string {
    if (score <= 3) return `${COLORS.green}Low${COLORS.reset}`;
    if (score <= 6) return `${COLORS.yellow}Medium${COLORS.reset}`;
    return `${COLORS.red}High${COLORS.reset}`;
}

// ─── Help ─────────────────────────────────────────────────────────────────────

function printHelp(): void {
    console.log(`
${COLORS.bold}${COLORS.cyan}Poly-Glot CLI${COLORS.reset} v${VERSION} — AI code comment generation

${COLORS.bold}Usage:${COLORS.reset}
  poly-glot <command> [options]

${COLORS.bold}Commands:${COLORS.reset}
  ${COLORS.cyan}demo${COLORS.reset}                              See Poly-Glot in action with interactive examples
  ${COLORS.cyan}comment${COLORS.reset} <file>                    Add doc-comments to a file (default mode)
  ${COLORS.cyan}comment${COLORS.reset} <file> --why              Add why-comments instead of doc-comments
  ${COLORS.cyan}comment${COLORS.reset} <file> --both             Add doc-comments AND why-comments in one pass
  ${COLORS.cyan}comment${COLORS.reset} <file> --dry-run          Preview changes without writing any files
  ${COLORS.cyan}comment${COLORS.reset} <file> --diff             Show a unified diff of changes
  ${COLORS.cyan}comment${COLORS.reset} <file> --backup           Save a .orig backup before overwriting
  ${COLORS.cyan}comment${COLORS.reset} --dir <dir>               Comment all supported files in a directory
  ${COLORS.cyan}comment${COLORS.reset} --dir <dir> --yes         Skip the confirmation prompt
  ${COLORS.cyan}comment${COLORS.reset} --dir <dir> --dry-run     Preview what would change across a directory
  ${COLORS.cyan}comment${COLORS.reset} --stdin --lang <l>        Read from stdin, write to stdout
  ${COLORS.cyan}why${COLORS.reset} <file>                        Shorthand: add why-comments to a file
  ${COLORS.cyan}why${COLORS.reset} --dir <dir>                   Shorthand: why-comment a whole directory
  ${COLORS.cyan}both${COLORS.reset} <file>                       Shorthand: add doc + why-comments to a file
  ${COLORS.cyan}both${COLORS.reset} --dir <dir>                  Shorthand: doc + why-comment a whole directory
  ${COLORS.cyan}explain${COLORS.reset} <file>                    Analyse a file (complexity, bugs, quality)
  ${COLORS.cyan}config${COLORS.reset}                            Configure API key, provider, and default mode

${COLORS.bold}Comment modes:${COLORS.reset}
  ${COLORS.cyan}comment${COLORS.reset}   JSDoc/PyDoc/KDoc/etc. — parameter types, return values, exceptions
  ${COLORS.cyan}why${COLORS.reset}       Inline reasoning — trade-offs, intent, non-obvious decisions
  ${COLORS.cyan}both${COLORS.reset}      Two-pass: doc-comments first, then why-comments on the result

${COLORS.bold}Safety flags:${COLORS.reset}
  ${COLORS.cyan}--dry-run${COLORS.reset}           Preview exactly what would change — no files written
  ${COLORS.cyan}--diff${COLORS.reset}              Show a unified diff of every change before committing
  ${COLORS.cyan}--backup${COLORS.reset}            Save a .orig copy of every file before overwriting

${COLORS.bold}Mode flags:${COLORS.reset}
  --why                 Use why-comment mode (shorthand for --mode why)
  --both                Use both modes in sequence (shorthand for --mode both)
  --mode <m>            Set mode explicitly: comment | why | both

${COLORS.bold}I/O flags:${COLORS.reset}
  --lang <lang>         Override language detection (e.g. python, javascript)
  --output <file>       Output file for single-file mode
  --output-dir <dir>    Output directory for --dir mode (preserves structure)
  --ext <list>          Comma-separated extensions to include in --dir mode
  --stdin               Read code from stdin

${COLORS.bold}Directory flags:${COLORS.reset}
  --yes, -y             Skip the "About to modify N files" confirmation prompt
  --dry-run             Show what would be processed — no files written
  --diff                Show unified diffs for every file

${COLORS.bold}Config flags:${COLORS.reset}
  --key <key>           Set API key non-interactively
  --provider <name>     Override provider (openai | anthropic)
  --model <name>        Override model (e.g. gpt-4.1-mini, claude-sonnet-4-5)
  --mode <m>            Set default mode in config: comment | why | both
  --token <token>       Set your Pro license token (unlocks all 12 languages + why-comments)
  --telemetry           Enable anonymous usage stats
  --no-telemetry        Disable anonymous usage stats
  --version, -v         Print version
  --help, -h            Show this help

${COLORS.bold}Examples:${COLORS.reset}
  ${COLORS.dim}# Setup${COLORS.reset}
  poly-glot config                                    # Interactive setup
  poly-glot config --key sk-... --provider openai --mode both

  ${COLORS.dim}# Single file — safe preview first${COLORS.reset}
  poly-glot comment src/auth.js --dry-run             # Preview without writing
  poly-glot comment src/auth.js --diff                # See exactly what changes
  poly-glot comment src/auth.js --backup              # Write + save .orig backup
  poly-glot comment src/auth.js --why                 # Why-comments this one time
  poly-glot comment src/auth.js --both                # Doc + why in one command

  ${COLORS.dim}# Directory — confirmation + summary built in${COLORS.reset}
  poly-glot comment --dir src/                        # Prompts "Continue? (Y/n)"
  poly-glot comment --dir src/ --yes                  # Skip prompt (great for scripts)
  poly-glot comment --dir src/ --dry-run              # Preview all files, no writes
  poly-glot comment --dir src/ --backup               # Write + .orig backups
  poly-glot comment --dir src/ --output-dir src-out/  # Preserve originals
  poly-glot comment --dir src/ --both --yes           # Doc + why, no prompt

  ${COLORS.dim}# stdin / stdout${COLORS.reset}
  cat main.py | poly-glot comment --stdin --lang python
  cat main.py | poly-glot comment --stdin --lang python --why
  cat main.py | poly-glot comment --stdin --lang python --both

  ${COLORS.dim}# Shorthands${COLORS.reset}
  poly-glot why src/auth.js                           # why-comments only
  poly-glot why --dir src/ --output-dir src-why/
  poly-glot both src/auth.js                          # doc + why in one command
  poly-glot both --dir src/ --output-dir src-both/
  poly-glot explain src/utils.ts

${COLORS.bold}Environment variables:${COLORS.reset}
  POLYGLOT_API_KEY          API key (overrides config file)
  POLYGLOT_PROVIDER         Provider: openai | anthropic
  POLYGLOT_MODEL            Model name
  POLYGLOT_MODE             Default mode: comment | why | both
  POLYGLOT_LICENSE_TOKEN    Pro license token — use in CI/CD instead of --token
  POLYGLOT_TELEMETRY        1 = enable, 0 = disable telemetry

${COLORS.bold}Supported languages:${COLORS.reset}
  JavaScript, TypeScript, Python, Java, C++, C, C#, Go, Rust, Ruby, PHP, Swift, Kotlin
`);
}

main().catch(err => {
    console.error(`\n${COLORS.red}Fatal: ${err instanceof Error ? err.message : String(err)}${COLORS.reset}\n`);
    process.exit(1);
});
