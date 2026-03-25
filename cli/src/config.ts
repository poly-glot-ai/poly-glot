import * as fs   from 'fs';
import * as path from 'path';
import * as os   from 'os';

export interface Config {
    apiKey:   string;
    provider: string;
    model:    string;
}

const CONFIG_DIR  = path.join(os.homedir(), '.config', 'polyglot');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function loadConfig(): Config {
    // Env vars take priority — useful in CI/CD
    if (process.env.POLYGLOT_API_KEY) {
        return {
            apiKey:   process.env.POLYGLOT_API_KEY,
            provider: process.env.POLYGLOT_PROVIDER || 'openai',
            model:    process.env.POLYGLOT_MODEL    || 'gpt-4o-mini',
        };
    }

    if (!fs.existsSync(CONFIG_FILE)) {
        return { apiKey: '', provider: 'openai', model: 'gpt-4o-mini' };
    }

    try {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(raw) as Config;
    } catch {
        return { apiKey: '', provider: 'openai', model: 'gpt-4o-mini' };
    }
}

export function saveConfig(cfg: Config): void {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
    // Restrict permissions so only the owner can read the file (contains API key)
    fs.chmodSync(CONFIG_FILE, 0o600);
}
