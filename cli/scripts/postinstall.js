#!/usr/bin/env node
'use strict';

// Only show on interactive terminals — skip CI/CD pipelines
if (!process.stdout.isTTY) process.exit(0);

const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const CYAN   = '\x1b[36m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const DIM    = '\x1b[2m';
const LINE   = '─'.repeat(56);

// Read version from package.json
let VERSION = '2.1.37';
try {
  const pkg = require('./package.json');
  VERSION = pkg.version || VERSION;
} catch(e) {
  try {
    const pkg = require('../package.json');
    VERSION = pkg.version || VERSION;
  } catch(e2) {}
}

// Dynamic EARLYBIRD3 countdown — null if expired
function earlyBirdLine() {
  const EXPIRY = new Date('2026-05-01T00:00:00Z').getTime();
  const msLeft = EXPIRY - Date.now();
  if (msLeft <= 0) return null;
  const days  = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  const color = days <= 7 ? RED : YELLOW;
  const label = days <= 7 ? `🚨 Only ${days} day${days === 1 ? '' : 's'} left!` : `⏳ ${days} days left`;
  return `${color}${BOLD}🏷  EARLYBIRD3 — ${label}${RESET}${YELLOW}  Lock Pro at $9/mo forever${RESET}`;
}

const eb = earlyBirdLine();

console.log(`
${GREEN}${BOLD}🦜 Poly-Glot AI CLI v${VERSION} installed!${RESET}
${LINE}

  ${BOLD}Step 1 — Create your free account (30 seconds):${RESET}

  ${CYAN}${BOLD}poly-glot login${RESET}

  ${DIM}Enter your email → magic link → you're in. No password.${RESET}
  ${DIM}No credit card. 10 files/month free.${RESET}

${LINE}

  ${BOLD}Step 2 — Document any file or entire directory:${RESET}

  ${CYAN}poly-glot comment src/app.py${RESET}          ${DIM}# Python${RESET}
  ${CYAN}poly-glot both --dir ./src${RESET}             ${DIM}# doc + why, whole dir${RESET}
  ${CYAN}poly-glot comment src/index.ts${RESET}         ${DIM}# TypeScript${RESET}

${LINE}

  ${BOLD}Free plan:${RESET}
    ✅ Python · JavaScript · Java
    ✅ 10 files/month
    ✅ Doc-comments (JSDoc, PyDoc, JavaDoc)

  ${BOLD}${CYAN}Pro — $9/mo:${RESET}
    ✅ All 12 languages · unlimited files
    ✅ Why-comments · Both mode
    ✅ CLI + VS Code + Chrome extension

${eb ? `  ${eb}` : ''}
  ${CYAN}→ https://poly-glot.ai/#pg-pricing-section${RESET}

${LINE}

  ${RED}${BOLD}→ Run this now:${RESET} ${CYAN}${BOLD}poly-glot login${RESET}

${LINE}
`);
