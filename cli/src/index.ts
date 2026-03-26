#!/usr/bin/env node
/**
 * Poly-Glot CLI
 * AI-powered code comment generation from the command line.
 *
 * Usage:
 *   polyglot comment <file>                     # Comment a single file (inline)
 *   polyglot comment <file> --output <out>      # Write to a different file
 *   polyglot comment --dir <dir>                # Comment all supported files in a directory
 *   polyglot comment --dir <dir> --ext js,ts    # Limit to specific extensions
 *   polyglot comment --stdin --lang python      # Read from stdin
 *   polyglot explain <file>                     # Explain / analyse a file
 *   polyglot config                             # Set API key and provider interactively
 *   polyglot config --key <key> --provider openai --model gpt-4o-mini
 */

import * as fs   from 'fs';
import * as path from 'path';
import * as os   from 'os';
import * as readline from 'readline';
import { PolyGlotGenerator, WhyResult, BothResult } from './generator';
import { CommentMode } from './config';
import { loadConfig, saveConfig, Config } from './config';
import { DEMO_SAMPLES, getSampleLanguages } from './demo-samples';
import { ping } from './telemetry';

// ─── Constants ────────────────────────────────────────────────────────────────

const VERSION = '1.4.2';  // one-time what's-new notice + generic provider step in setup

const SUPPORTED_EXTENSIONS: Record<string, string> = {
    js:    'javascript', ts:   'typescript', jsx: 'javascript', tsx: 'typescript',
    py:    'python',     java: 'java',       cpp: 'cpp',        c:   'cpp',
    cs:    'csharp',     go:   'go',         rs:  'rust',       rb:  'ruby',
    php:   'php',        swift:'swift',      kt:  'kotlin',
};

const COLORS = {
    reset:  '\x1b[0m',
    green:  '\x1b[32m',
    yellow: '\x1b[33m',
    red:    '\x1b[31m',
    cyan:   '\x1b[36m',
    dim:    '\x1b[2m',
    bold:   '\x1b[1m',
};

// ─── What's New notice (shown once per major feature release) ─────────────────

function showWhatsNew(cfg: Config): void {
    const last = cfg.lastSeenVersion || '0.0.0';

    // Show notice when upgrading from any version before 1.3.0 (pre-why-comments)
    const isOld = last === '' || last === '0.0.0' ||
        last.startsWith('1.0') || last.startsWith('1.1') || last.startsWith('1.2');

    if (!isOld) return;

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

${COLORS.dim}  This notice won't appear again. Run 'poly-glot --help' anytime.${COLORS.reset}
`);
}

// ─── Entry ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const args  = process.argv.slice(2);
    const cmd   = args[0];

    if (!cmd || cmd === '--help' || cmd === '-h') { printHelp(); process.exit(0); }
    if (cmd === '--version' || cmd === '-v')      { console.log(VERSION); process.exit(0); }

    // ── Load config ───────────────────────────────────────────────────────
    const cfg = loadConfig();

    // ── One-time what's-new notice (only for users upgrading from < v1.3.0) ─
    if (cmd !== 'config' && !process.env.CI && process.stdout.isTTY) {
        showWhatsNew(cfg);
    }

    // ── Stamp the current version so notice won't show again ─────────────
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
    if (cmd === 'explain') { await runExplain(args.slice(1)); return; }
    if (cmd === 'demo')    { await runDemo(args.slice(1)); return; }

    error(`Unknown command: ${cmd}. Run 'poly-glot --help' for usage.`);
    process.exit(1);
}

// ── Telemetry consent prompt ───────────────────────────────────────────────────
async function askTelemetryConsent(cfg: Config): Promise<void> {
    // Skip in non-interactive environments (CI, pipes, etc.)
    if (!process.stdout.isTTY || process.env.CI) {
        cfg.telemetry = false;
        saveConfig(cfg);
        return;
    }

    console.log(`
${COLORS.dim}─────────────────────────────────────────────────────${COLORS.reset}
${COLORS.bold}Help improve Poly-Glot?${COLORS.reset}

Send ${COLORS.cyan}anonymous${COLORS.reset} usage stats (command name, language, OS).
${COLORS.dim}No code, no API keys, no file paths — ever.
Docs: https://github.com/hmoses/poly-glot#telemetry${COLORS.reset}
${COLORS.dim}─────────────────────────────────────────────────────${COLORS.reset}`);

    const answer = await promptLine('Enable anonymous telemetry? (Y/n) ');
    cfg.telemetry = answer.trim().toLowerCase() !== 'n';
    saveConfig(cfg);

    if (cfg.telemetry) {
        console.log(`${COLORS.dim}  ✓ Thanks! You can opt out anytime: poly-glot config --no-telemetry${COLORS.reset}`);
    } else {
        console.log(`${COLORS.dim}  ✓ No problem. Telemetry disabled.${COLORS.reset}`);
    }
    console.log();
}

function promptLine(question: string): Promise<string> {
    return new Promise(resolve => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(`  ${question}`, ans => { rl.close(); resolve(ans); });
    });
}

// ─── Command: config ──────────────────────────────────────────────────────────

async function runConfig(args: string[]): Promise<void> {
    const flags = parseFlags(args);
    const cfg   = loadConfig();

    // Telemetry opt-out / opt-in flags
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
    if (flags['--key'] || '--mode' in flags) {
        if (flags['--key'])      cfg.apiKey   = flags['--key']      as string;
        if (flags['--provider']) cfg.provider = flags['--provider'] as string;
        if (flags['--model'])    cfg.model    = flags['--model']    as string;
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
        success(`Config saved — provider: ${cfg.provider}, model: ${cfg.model}, default mode: ${cfg.defaultMode}`);
        return;
    }

    // Interactive mode
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
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
        if (['comment', 'why', 'both'].includes(m)) {
            cfg.defaultMode = m as CommentMode;
        } else {
            warn(`Unknown mode "${m}" — keeping "${cfg.defaultMode}"`);
        }
    }

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
    // Priority: --both flag > --why flag > --mode <value> > cfg.defaultMode
    let effectiveMode: CommentMode = cfg.defaultMode || 'comment';
    if ('--both' in flags)                        effectiveMode = 'both';
    else if ('--why' in flags)                    effectiveMode = 'why';
    else if (flags['--mode']) {
        const m = (flags['--mode'] as string).toLowerCase();
        if (['comment', 'why', 'both'].includes(m)) effectiveMode = m as CommentMode;
        else { error(`Invalid --mode "${m}". Use: comment, why, or both`); process.exit(1); }
    }

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
        const code = await readStdin();
        if (!code.trim()) { error('No input received on stdin.'); process.exit(1); }

        spin(`Adding ${modeLabel[effectiveMode]} for stdin (${lang})…`);
        const output = await processCode(code, lang);
        stopSpin();
        ping({ cmd: 'comment', lang, provider: cfg.provider, mode: 'stdin', version: VERSION }, !!cfg.telemetry);
        process.stdout.write(output + '\n');
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

        console.log(`\n${COLORS.cyan}${COLORS.bold}Poly-Glot${COLORS.reset} — ${modeLabel[effectiveMode]} on ${files.length} file(s) in ${COLORS.dim}${dir}${COLORS.reset}\n`);

        let ok = 0, fail = 0;

        for (const file of files) {
            const rel  = path.relative(dir, file);
            const ext  = file.split('.').pop()!.toLowerCase();
            const lang = SUPPORTED_EXTENSIONS[ext] || 'javascript';
            const code = fs.readFileSync(file, 'utf8');

            process.stdout.write(`  ${COLORS.dim}${rel}${COLORS.reset} … `);
            try {
                const output  = await processCode(code, lang);
                const outPath = flags['--output-dir']
                    ? path.join(flags['--output-dir'] as string, rel)
                    : file;
                if (flags['--output-dir']) fs.mkdirSync(path.dirname(outPath), { recursive: true });
                fs.writeFileSync(outPath, output, 'utf8');
                ok++;
                console.log(`${COLORS.green}✓${COLORS.reset}`);
            } catch (e: unknown) {
                fail++;
                console.log(`${COLORS.red}✗ ${e instanceof Error ? e.message : String(e)}${COLORS.reset}`);
            }
        }

        ping({ cmd: 'comment', lang: 'multi', provider: cfg.provider, mode: 'dir', version: VERSION }, !!cfg.telemetry);
        console.log(`\n${ok} done, ${fail} failed\n`);
        return;
    }

    // ── single file mode ──────────────────────────────────────────────────────
    const filePath = args.find(a => !a.startsWith('-'));
    if (!filePath) { error('Specify a file, --dir, or --stdin. Run poly-glot --help for usage.'); process.exit(1); }

    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) { error(`File not found: ${absPath}`); process.exit(1); }

    const ext     = absPath.split('.').pop()!.toLowerCase();
    const lang    = (flags['--lang'] as string) || SUPPORTED_EXTENSIONS[ext] || 'javascript';
    const code    = fs.readFileSync(absPath, 'utf8');
    const outPath = flags['--output'] ? path.resolve(flags['--output'] as string) : absPath;

    if (effectiveMode === 'both') {
        spin(`Adding doc-comments to ${path.basename(absPath)} (${lang})…`);
        // show two-pass progress for 'both'
        const docResult = await gen.generateComments(code, lang);
        stopSpin();
        success(`Pass 1 complete — doc-comments added`);

        spin(`Adding why-comments to ${path.basename(absPath)} (${lang})…`);
        const whyPrompt = await gen.generateWhyComments(docResult.commentedCode, lang);
        stopSpin();

        ping({ cmd: 'comment', lang, provider: cfg.provider, mode: 'file', version: VERSION }, !!cfg.telemetry);
        fs.writeFileSync(outPath, whyPrompt.commentedCode, 'utf8');
        success(`Pass 2 complete — why-comments added`);
        success(`${path.basename(outPath)} fully commented (doc + why)`);
    } else {
        const spinLabel = effectiveMode === 'why'
            ? `Adding why-comments to ${path.basename(absPath)} (${lang}, ${cfg.model})…`
            : `Commenting ${path.basename(absPath)} (${lang}, ${cfg.model})…`;

        spin(spinLabel);
        const output = await processCode(code, lang);
        stopSpin();

        ping({ cmd: 'comment', lang, provider: cfg.provider, mode: 'file', version: VERSION }, !!cfg.telemetry);
        fs.writeFileSync(outPath, output, 'utf8');
        success(`${path.basename(outPath)} commented [${effectiveMode}]`);
    }
}

// ─── Command: why ─────────────────────────────────────────────────────────────

async function runWhy(args: string[]): Promise<void> {
    const flags   = parseFlags(args);
    const cfg     = loadConfig();

    assertConfigured(cfg);

    const gen = new PolyGlotGenerator(cfg);

    // ── stdin mode ──
    if (flags['--stdin']) {
        const lang = (flags['--lang'] as string) || 'javascript';
        const code = await readStdin();
        if (!code.trim()) { error('No input received on stdin.'); process.exit(1); }

        spin(`Adding why-comments for stdin (${lang})…`);
        const result = await gen.generateWhyComments(code, lang);
        stopSpin();
        ping({ cmd: 'why', lang, provider: cfg.provider, mode: 'stdin', version: VERSION }, !!cfg.telemetry);
        process.stdout.write(result.commentedCode + '\n');
        return;
    }

    // ── directory mode ──
    if (flags['--dir']) {
        const dir  = path.resolve(flags['--dir'] as string);
        const exts = flags['--ext']
            ? (flags['--ext'] as string).split(',').map(e => e.trim().replace(/^\./, ''))
            : Object.keys(SUPPORTED_EXTENSIONS);

        if (!fs.existsSync(dir)) { error(`Directory not found: ${dir}`); process.exit(1); }

        const files = collectFiles(dir, exts);
        if (!files.length) { warn(`No supported files found in ${dir}`); return; }

        console.log(`\n${COLORS.cyan}${COLORS.bold}Poly-Glot${COLORS.reset} — why-commenting ${files.length} file(s) in ${COLORS.dim}${dir}${COLORS.reset}\n`);

        let ok = 0;
        let fail = 0;

        for (const file of files) {
            const rel  = path.relative(dir, file);
            const ext  = file.split('.').pop()!.toLowerCase();
            const lang = SUPPORTED_EXTENSIONS[ext] || 'javascript';
            const code = fs.readFileSync(file, 'utf8');

            process.stdout.write(`  ${COLORS.dim}${rel}${COLORS.reset} … `);
            try {
                const result = await gen.generateWhyComments(code, lang);
                const outPath = flags['--output-dir']
                    ? path.join(flags['--output-dir'] as string, rel)
                    : file;

                if (flags['--output-dir']) {
                    fs.mkdirSync(path.dirname(outPath), { recursive: true });
                }
                fs.writeFileSync(outPath, result.commentedCode, 'utf8');
                ok++;
                console.log(`${COLORS.green}✓${COLORS.reset}`);
            } catch (e: unknown) {
                fail++;
                console.log(`${COLORS.red}✗ ${e instanceof Error ? e.message : String(e)}${COLORS.reset}`);
            }
        }

        ping({ cmd: 'why', lang: 'multi', provider: cfg.provider, mode: 'dir', version: VERSION }, !!cfg.telemetry);
        console.log(`\n${ok} done, ${fail} failed\n`);
        return;
    }

    // ── single file mode ──
    const filePath = args.find(a => !a.startsWith('-'));
    if (!filePath) { error('Specify a file, --dir, or --stdin. Run poly-glot --help for usage.'); process.exit(1); }

    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) { error(`File not found: ${absPath}`); process.exit(1); }

    const ext     = absPath.split('.').pop()!.toLowerCase();
    const lang    = (flags['--lang'] as string) || SUPPORTED_EXTENSIONS[ext] || 'javascript';
    const code    = fs.readFileSync(absPath, 'utf8');
    const outPath = flags['--output']
        ? path.resolve(flags['--output'] as string)
        : absPath;

    spin(`Why-commenting ${path.basename(absPath)} (${lang}, ${cfg.model})…`);
    const result = await gen.generateWhyComments(code, lang);
    stopSpin();

    ping({ cmd: 'why', lang, provider: cfg.provider, mode: 'file', version: VERSION }, !!cfg.telemetry);
    fs.writeFileSync(outPath, result.commentedCode, 'utf8');
    success(`${path.basename(outPath)} why-commented`);
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
    console.log(`  Complexity:    ${complexityLabel(result.complexityScore)} (${result.complexityScore}/10)`);
    console.log(`  Doc Quality:   ${result.docQuality.label} (${result.docQuality.score}/100)`);
    console.log(`  Functions:     ${result.functions.length}`);
    console.log(`  Potential bugs: ${result.potentialBugs.length}\n`);

    if (result.functions.length) {
        console.log(`${COLORS.bold}⚙️  Functions${COLORS.reset}`);
        result.functions.forEach((fn: { name: string; purpose: string; params: string[]; returns: string }) => {
            console.log(`  ${COLORS.cyan}${fn.name}${COLORS.reset}(${fn.params.join(', ')}) → ${fn.returns}`);
            console.log(`    ${COLORS.dim}${fn.purpose}${COLORS.reset}`);
        });
        console.log('');
    }

    if (result.potentialBugs.length) {
        console.log(`${COLORS.bold}🐛 Potential Bugs${COLORS.reset}`);
        result.potentialBugs.forEach((b: string) => console.log(`  ${COLORS.red}•${COLORS.reset} ${b}`));
        console.log('');
    }

    if (result.suggestions.length) {
        console.log(`${COLORS.bold}💡 Suggestions${COLORS.reset}`);
        result.suggestions.forEach((s: string) => console.log(`  ${COLORS.yellow}•${COLORS.reset} ${s}`));
        console.log('');
    }
}

// ─── Command: demo ────────────────────────────────────────────────────────────

async function runDemo(args: string[]): Promise<void> {
    const flags = parseFlags(args);
    
    console.log(`\n${COLORS.bold}${COLORS.cyan}🎬 Poly-Glot Demo — See It In Action${COLORS.reset}\n`);
    console.log(`Watch how Poly-Glot transforms code with professional comments\n`);
    
    // Get available languages
    const languages = getSampleLanguages();
    
    // If --lang specified, use that directly
    let selectedLang = flags['--lang'] as string;
    
    // Interactive language selection if not specified
    if (!selectedLang) {
        console.log(`${COLORS.bold}Available languages:${COLORS.reset}`);
        languages.forEach((lang, idx) => {
            const sample = DEMO_SAMPLES[lang];
            console.log(`  ${COLORS.cyan}${idx + 1}.${COLORS.reset} ${sample.displayName} ${COLORS.dim}(${sample.description})${COLORS.reset}`);
        });
        console.log('');
        
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const ask = (q: string): Promise<string> => new Promise(res => rl.question(q, res));
        
        const choice = await ask(`Select a language [1-${languages.length}] or name: `);
        rl.close();
        
        // Parse selection
        const choiceNum = parseInt(choice.trim());
        if (!isNaN(choiceNum) && choiceNum >= 1 && choiceNum <= languages.length) {
            selectedLang = languages[choiceNum - 1];
        } else {
            selectedLang = choice.trim().toLowerCase();
        }
    }
    
    // Get the sample
    const sample = DEMO_SAMPLES[selectedLang];
    if (!sample) {
        error(`Language '${selectedLang}' not found in demo samples.`);
        console.log(`Available: ${languages.join(', ')}`);
        process.exit(1);
    }
    
    console.log(`\n${COLORS.bold}${COLORS.green}✓${COLORS.reset} Selected: ${sample.displayName}\n`);
    console.log(`${COLORS.dim}${'─'.repeat(80)}${COLORS.reset}\n`);
    
    // Show BEFORE
    console.log(`${COLORS.bold}${COLORS.yellow}BEFORE:${COLORS.reset} ${COLORS.dim}Inconsistent or minimal comments${COLORS.reset}\n`);
    console.log(sample.before);
    console.log(`\n${COLORS.dim}${'─'.repeat(80)}${COLORS.reset}\n`);
    
    // Option to generate live or show static
    const cfg = loadConfig();
    const hasApiKey = cfg.apiKey && cfg.apiKey.length >= 10;
    
    if (flags['--live'] && hasApiKey) {
        // Generate live comments using API
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
            console.log('');
        }
    } else {
        // Show static after example
        console.log(`${COLORS.bold}${COLORS.green}AFTER:${COLORS.reset} ${COLORS.dim}Standardized professional documentation${COLORS.reset}\n`);
        console.log(sample.after);
        console.log('');
        
        if (!hasApiKey && flags['--live']) {
            warn('API key not configured. Showing pre-generated example.');
            console.log(`Run ${COLORS.cyan}poly-glot config${COLORS.reset} to set up live demo.\n`);
        }
    }
    
    console.log(`${COLORS.dim}${'─'.repeat(80)}${COLORS.reset}\n`);
    
    // Show benefits
    console.log(`${COLORS.bold}✨ Key Improvements:${COLORS.reset}`);
    console.log(`  ${COLORS.green}✓${COLORS.reset} Standardized documentation format (JSDoc, PyDoc, etc.)`);
    console.log(`  ${COLORS.green}✓${COLORS.reset} Complete parameter and return type descriptions`);
    console.log(`  ${COLORS.green}✓${COLORS.reset} Error handling and edge cases documented`);
    console.log(`  ${COLORS.green}✓${COLORS.reset} Usage examples included`);
    console.log(`  ${COLORS.green}✓${COLORS.reset} Better searchability and AI comprehension\n`);
    
    // CTA
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
        if (a.startsWith('--')) {
            const next = args[i + 1];
            if (next && !next.startsWith('--')) { out[a] = next; i++; }
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

function assertConfigured(cfg: Config): void {
    if (!cfg.apiKey || cfg.apiKey.length < 10) {
        error('API key not configured. Run: polyglot config');
        process.exit(1);
    }
}

let _spinTimer: NodeJS.Timeout | null = null;
function spin(msg: string): void {
    const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
    let i = 0;
    process.stdout.write('  ');
    _spinTimer = setInterval(() => {
        process.stdout.write(`\r  ${COLORS.cyan}${frames[i % frames.length]}${COLORS.reset} ${msg}`);
        i++;
    }, 80);
}
function stopSpin(): void {
    if (_spinTimer) { clearInterval(_spinTimer); _spinTimer = null; }
    process.stdout.write('\r' + ' '.repeat(80) + '\r');
}

function success(msg: string): void { console.log(`  ${COLORS.green}✓${COLORS.reset} ${msg}`); }
function warn(msg: string):    void { console.log(`  ${COLORS.yellow}⚠${COLORS.reset}  ${msg}`); }
function error(msg: string):   void { console.error(`  ${COLORS.red}✗${COLORS.reset} ${msg}`); }
function dim(msg: string):     void { console.log(`${COLORS.dim}${msg}${COLORS.reset}`); }

function complexityLabel(score: number): string {
    if (score <= 3) return `${COLORS.green}Low${COLORS.reset}`;
    if (score <= 6) return `${COLORS.yellow}Medium${COLORS.reset}`;
    return `${COLORS.red}High${COLORS.reset}`;
}

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
  ${COLORS.cyan}comment${COLORS.reset} <file> --mode <m>         Explicit mode: comment | why | both
  ${COLORS.cyan}comment${COLORS.reset} --dir <dir>               Comment all supported files in a directory
  ${COLORS.cyan}comment${COLORS.reset} --dir <dir> --both        Both comment types across a whole directory
  ${COLORS.cyan}comment${COLORS.reset} --stdin --lang <l>        Read from stdin, write to stdout
  ${COLORS.cyan}why${COLORS.reset} <file>                        Shorthand: add why-comments to a file
  ${COLORS.cyan}why${COLORS.reset} --dir <dir>                   Shorthand: why-comment a whole directory
  ${COLORS.cyan}why${COLORS.reset} --stdin --lang <l>            Shorthand: why-comment from stdin
  ${COLORS.cyan}explain${COLORS.reset} <file>                    Analyse a file (complexity, bugs, quality)
  ${COLORS.cyan}config${COLORS.reset}                            Configure API key, provider, and default mode

${COLORS.bold}Comment modes:${COLORS.reset}
  ${COLORS.cyan}comment${COLORS.reset}   JSDoc/PyDoc/KDoc/etc. — parameter types, return values, exceptions
  ${COLORS.cyan}why${COLORS.reset}       Inline reasoning — trade-offs, intent, non-obvious decisions
  ${COLORS.cyan}both${COLORS.reset}      Two-pass: doc-comments first, then why-comments on the result

${COLORS.bold}Options:${COLORS.reset}
  --why                 Use why-comment mode (shorthand for --mode why)
  --both                Use both modes in sequence (shorthand for --mode both)
  --mode <m>            Set mode explicitly: comment | why | both
  --lang <lang>         Override language detection (e.g. python, javascript)
  --output <file>       Output file for single-file mode
  --output-dir <dir>    Output directory for --dir mode (preserves structure)
  --ext <list>          Comma-separated extensions to include in --dir mode
  --provider <name>     Override provider (openai | anthropic)
  --model <name>        Override model (e.g. gpt-4.1-mini, claude-sonnet-4-5)
  --key <key>           Set API key non-interactively (use with config command)
  --mode <m>            Set default mode in config: comment | why | both
  --telemetry           Enable anonymous usage stats (config command)
  --no-telemetry        Disable anonymous usage stats (config command)
  --version, -v         Print version
  --help, -h            Show this help

${COLORS.bold}Examples:${COLORS.reset}
  poly-glot config                                    # Interactive setup (sets API key + default mode)
  poly-glot config --key sk-... --provider openai --mode both
  poly-glot config --mode why                         # Set why-comments as your default

  poly-glot comment src/auth.js                       # Doc-comments (or your configured default)
  poly-glot comment src/auth.js --why                 # Why-comments this one time
  poly-glot comment src/auth.js --both                # Doc + why in one command
  poly-glot comment src/auth.js --output src/auth.documented.js

  poly-glot comment --dir src/ --ext js,ts            # Doc-comment entire directory
  poly-glot comment --dir src/ --both                 # Doc + why entire directory
  poly-glot comment --dir src/ --output-dir src-out/

  cat main.py | poly-glot comment --stdin --lang python          # Doc-comments from stdin
  cat main.py | poly-glot comment --stdin --lang python --why    # Why-comments from stdin
  cat main.py | poly-glot comment --stdin --lang python --both   # Both from stdin

  poly-glot why src/auth.js                           # Shorthand for --why
  poly-glot why --dir src/ --output-dir src-why/
  poly-glot explain src/utils.ts

${COLORS.bold}Supported languages:${COLORS.reset}
  JavaScript, TypeScript, Python, Java, C++, C, C#, Go, Rust, Ruby, PHP, Swift, Kotlin
`);
}

main().catch(err => {
    console.error(`\n${COLORS.red}Fatal: ${err instanceof Error ? err.message : String(err)}${COLORS.reset}\n`);
    process.exit(1);
});
