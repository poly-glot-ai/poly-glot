/**
 * Poly-Glot CLI — Anonymous Usage Telemetry
 *
 * Design principles:
 *  - Opt-in only: never sends anything until user explicitly agrees
 *  - Fire-and-forget: never delays a command, never throws, never logs
 *  - Zero PII: no API keys, no code, no file paths, no usernames
 *  - Transparent: exactly what is sent is documented here
 *
 * Payload (all fields anonymous):
 *  {
 *    v:        CLI version string          e.g. "1.1.0"
 *    cmd:      command name                e.g. "comment" | "explain" | "config"
 *    lang:     language if applicable      e.g. "python" | "go" | null
 *    provider: AI provider                 e.g. "openai" | "anthropic" | null
 *    mode:     sub-mode                    e.g. "file" | "dir" | "stdin" | null
 *    os:       platform string             e.g. "darwin" | "linux" | "win32"
 *    node:     Node.js major version       e.g. 20
 *  }
 */

import * as os from 'os';

const TELEMETRY_ENDPOINT = 'https://telemetry.poly-glot.ai/cli';
const TIMEOUT_MS         = 2500;  // never wait more than 2.5s for network

export interface TelemetryEvent {
    cmd:      string;
    lang?:    string | null;
    provider?: string | null;
    mode?:    string | null;
    version:  string;
}

/**
 * Fire an anonymous telemetry ping.
 * Returns immediately — the HTTP request runs in the background.
 * Safe to call unconditionally; respects the opted-in flag internally.
 */
export function ping(event: TelemetryEvent, optedIn: boolean): void {
    if (!optedIn) return;

    // Build lean payload — nothing sensitive
    const payload = {
        v:        event.version,
        cmd:      event.cmd,
        lang:     event.lang     || null,
        provider: event.provider || null,
        mode:     event.mode     || null,
        os:       os.platform(),
        node:     parseInt(process.versions.node.split('.')[0], 10),
    };

    // Fire and forget — absorb all errors silently
    void (async () => {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
            await fetch(TELEMETRY_ENDPOINT, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json',
                           'User-Agent':   `poly-glot-cli/${event.version}` },
                body:    JSON.stringify(payload),
                signal:  controller.signal,
            });
            clearTimeout(timer);
        } catch {
            // Swallow all errors — network down, endpoint unreachable, etc.
        }
    })();
}
