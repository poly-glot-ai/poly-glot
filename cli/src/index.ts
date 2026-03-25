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
import { PolyGlotGenerator } from './generator';
import { loadConfig, saveConfig, Config } from './config';

// ─── Constants ────────────────────────────────────────────────────────────────

const VERSION = '1.0.0';

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

// ─── Entry ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const args  = process.argv.slice(2);
    const cmd   = args[0];

    if (!cmd || cmd === '--help' || cmd === '-h') { printHelp(); process.exit(0); }
    if (cmd === '--version' || cmd === '-v')      { console.log(VERSION); process.exit(0); }

    if (cmd === 'config')  { await runConfig(args.slice(1)); return; }
    if (cmd === 'comment') { await runComment(args.slice(1)); return; }
    if (cmd === 'explain') { await runExplain(args.slice(1)); return; }

    error(`Unknown command: ${cmd}. Run 'poly-glot --help' for usage.`);
    process.exit(1);
}

// ─── Command: config ──────────────────────────────────────────────────────────

async function runConfig(args: string[]): Promise<void> {
    const flags = parseFlags(args);
    const cfg   = loadConfig();

    // Non-interactive mode if flags are provided
    if (flags['--key']) {
        cfg.apiKey   = flags['--key'] as string;
        cfg.provider = (flags['--provider'] as string) || cfg.provider || 'openai';
        cfg.model    = (flags['--model']    as string) || cfg.model    || 'gpt-4o-mini';
        saveConfig(cfg);
        success(`Config saved — provider: ${cfg.provider}, model: ${cfg.model}`);
        return;
    }

    // Interactive mode
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q: string): Promise<string> => new Promise(res => rl.question(q, res));

    console.log(`\n${COLORS.bold}${COLORS.cyan}Poly-Glot CLI — Configuration${COLORS.reset}\n`);

    const provider = await ask(`Provider [openai/anthropic] (current: ${cfg.provider || 'not set'}): `);
    if (provider.trim()) cfg.provider = provider.trim();

    const key = await ask(`API Key (input hidden — press Enter to keep current): `);
    if (key.trim()) cfg.apiKey = key.trim();

    const defaultModel = cfg.provider === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4o-mini';
    const model = await ask(`Model (current: ${cfg.model || defaultModel}): `);
    if (model.trim()) cfg.model = model.trim();
    else if (!cfg.model) cfg.model = defaultModel;

    rl.close();
    saveConfig(cfg);
    success(`Config saved — provider: ${cfg.provider}, model: ${cfg.model}`);
}

// ─── Command: comment ─────────────────────────────────────────────────────────

async function runComment(args: string[]): Promise<void> {
    const flags  = parseFlags(args);
    const cfg    = loadConfig();

    assertConfigured(cfg);

    const gen = new PolyGlotGenerator(cfg);

    // ── stdin mode ──
    if (flags['--stdin']) {
        const lang = (flags['--lang'] as string) || 'javascript';
        const code = await readStdin();
        if (!code.trim()) { error('No input received on stdin.'); process.exit(1); }

        spin(`Generating comments for stdin (${lang})…`);
        const result = await gen.generateComments(code, lang);
        stopSpin();
        process.stdout.write(result.commentedCode + '\n');
        dim(`  cost: $${result.cost.toFixed(5)} | tokens: ${result.tokensUsed}`);
        return;
    }

    // ── directory mode ──
    if (flags['--dir']) {
        const dir   = path.resolve(flags['--dir'] as string);
        const exts  = flags['--ext']
            ? (flags['--ext'] as string).split(',').map(e => e.trim().replace(/^\./, ''))
            : Object.keys(SUPPORTED_EXTENSIONS);

        if (!fs.existsSync(dir)) { error(`Directory not found: ${dir}`); process.exit(1); }

        const files = collectFiles(dir, exts);
        if (!files.length) { warn(`No supported files found in ${dir}`); return; }

        console.log(`\n${COLORS.cyan}${COLORS.bold}Poly-Glot${COLORS.reset} — commenting ${files.length} file(s) in ${COLORS.dim}${dir}${COLORS.reset}\n`);

        let totalCost = 0;
        let ok = 0;
        let fail = 0;

        for (const file of files) {
            const rel  = path.relative(dir, file);
            const ext  = file.split('.').pop()!.toLowerCase();
            const lang = SUPPORTED_EXTENSIONS[ext] || 'javascript';
            const code = fs.readFileSync(file, 'utf8');

            process.stdout.write(`  ${COLORS.dim}${rel}${COLORS.reset} … `);
            try {
                const result = await gen.generateComments(code, lang);
                const outPath = flags['--output-dir']
                    ? path.join(flags['--output-dir'] as string, rel)
                    : file;

                if (flags['--output-dir']) {
                    fs.mkdirSync(path.dirname(outPath), { recursive: true });
                }
                fs.writeFileSync(outPath, result.commentedCode, 'utf8');
                totalCost += result.cost;
                ok++;
                console.log(`${COLORS.green}✓${COLORS.reset} ${COLORS.dim}$${result.cost.toFixed(5)}${COLORS.reset}`);
            } catch (e: unknown) {
                fail++;
                console.log(`${COLORS.red}✗ ${e instanceof Error ? e.message : String(e)}${COLORS.reset}`);
            }
        }

        console.log(`\n${ok} commented, ${fail} failed — total cost: ${COLORS.green}$${totalCost.toFixed(5)}${COLORS.reset}\n`);
        return;
    }

    // ── single file mode ──
    const filePath = args.find(a => !a.startsWith('-'));
    if (!filePath) { error('Specify a file, --dir, or --stdin. Run poly-glot --help for usage.'); process.exit(1); }

    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) { error(`File not found: ${absPath}`); process.exit(1); }

    const ext    = absPath.split('.').pop()!.toLowerCase();
    const lang   = (flags['--lang'] as string) || SUPPORTED_EXTENSIONS[ext] || 'javascript';
    const code   = fs.readFileSync(absPath, 'utf8');
    const outPath = flags['--output']
        ? path.resolve(flags['--output'] as string)
        : absPath;

    spin(`Commenting ${path.basename(absPath)} (${lang}, ${cfg.model})…`);
    const result = await gen.generateComments(code, lang);
    stopSpin();

    fs.writeFileSync(outPath, result.commentedCode, 'utf8');
    success(`${path.basename(outPath)} commented — $${result.cost.toFixed(5)} | ${result.tokensUsed} tokens`);
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
  ${COLORS.cyan}comment${COLORS.reset} <file>               Comment a single file (edits in place)
  ${COLORS.cyan}comment${COLORS.reset} <file> --output <f>  Write commented code to a different file
  ${COLORS.cyan}comment${COLORS.reset} --dir <dir>          Comment all supported files in a directory
  ${COLORS.cyan}comment${COLORS.reset} --stdin --lang <l>   Read code from stdin, write to stdout
  ${COLORS.cyan}explain${COLORS.reset} <file>               Analyse a file (complexity, bugs, quality)
  ${COLORS.cyan}config${COLORS.reset}                       Configure API key and provider interactively

${COLORS.bold}Options:${COLORS.reset}
  --lang <lang>         Override language detection (e.g. python, javascript)
  --output <file>       Output file for single-file mode
  --output-dir <dir>    Output directory for --dir mode (preserves structure)
  --ext <list>          Comma-separated extensions to include in --dir mode
  --provider <name>     Override provider (openai | anthropic)
  --model <name>        Override model (e.g. gpt-4o, claude-sonnet-4-5)
  --key <key>           Set API key non-interactively (use with config command)
  --version, -v         Print version
  --help, -h            Show this help

${COLORS.bold}Examples:${COLORS.reset}
  polyglot config --key sk-... --provider openai --model gpt-4o-mini
  polyglot comment src/auth.js
  polyglot comment src/auth.js --output src/auth.documented.js
  polyglot comment --dir src/ --ext js,ts
  polyglot comment --dir src/ --output-dir src-commented/
  cat main.py | polyglot comment --stdin --lang python > main_commented.py
  polyglot explain src/utils.ts

${COLORS.bold}Supported languages:${COLORS.reset}
  JavaScript, TypeScript, Python, Java, C++, C, C#, Go, Rust, Ruby, PHP, Swift, Kotlin
`);
}

main().catch(err => {
    console.error(`\n${COLORS.red}Fatal: ${err instanceof Error ? err.message : String(err)}${COLORS.reset}\n`);
    process.exit(1);
});
