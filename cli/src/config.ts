import * as fs   from 'fs';
import * as path from 'path';
import * as os   from 'os';

export interface Config {
    apiKey:    string;
    provider:  string;
    model:     string;
    telemetry: boolean | null;   // null = not yet asked, true = opted in, false = opted out
}

const CONFIG_DIR  = path.join(os.homedir(), '.config', 'polyglot');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function loadConfig(): Config {
    // Env vars take priority — useful in CI/CD
    if (process.env.POLYGLOT_API_KEY) {
        return {
            apiKey:    process.env.POLYGLOT_API_KEY,
            provider:  process.env.POLYGLOT_PROVIDER  || 'openai',
            model:     process.env.POLYGLOT_MODEL      || 'gpt-4o-mini',
            // CI/CD: respect POLYGLOT_TELEMETRY=0 to disable, default off in CI
            telemetry: process.env.POLYGLOT_TELEMETRY === '1' ? true
                     : process.env.POLYGLOT_TELEMETRY === '0' ? false
                     : process.env.CI ? false  // never ping in CI unless explicit
                     : null,
        };
    }

    if (!fs.existsSync(CONFIG_FILE)) {
        return { apiKey: '', provider: 'openai', model: 'gpt-4o-mini', telemetry: null };
    }

    try {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
        const parsed = JSON.parse(raw) as Partial<Config>;
        return {
            apiKey:    parsed.apiKey    || '',
            provider:  parsed.provider  || 'openai',
            model:     parsed.model     || 'gpt-4o-mini',
            telemetry: parsed.telemetry ?? null,
        };
    } catch {
        return { apiKey: '', provider: 'openai', model: 'gpt-4o-mini', telemetry: null };
    }
}

export function saveConfig(cfg: Config): void {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
    // Restrict permissions so only the owner can read the file (contains API key)
    fs.chmodSync(CONFIG_FILE, 0o600);
}
