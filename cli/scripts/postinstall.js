#!/usr/bin/env node
'use strict';

// Only show on interactive terminals — skip CI/CD pipelines
if (!process.stdout.isTTY) process.exit(0);

const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const CYAN   = '\x1b[36m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM    = '\x1b[2m';
const RED    = '\x1b[31m';
const LINE   = '─'.repeat(56);

// Read version from package.json in the same directory
let VERSION = '2.1.31';
try {
  const pkg = require('./package.json');
  VERSION = pkg.version || VERSION;
} catch(e) {
  try {
    const pkg = require('../package.json');
    VERSION = pkg.version || VERSION;
  } catch(e2) {}
}

console.log(`
${GREEN}${BOLD}🦜 Poly-Glot AI CLI v${VERSION} installed!${RESET}
${LINE}

  ${BOLD}Step 1 — Create your free account (30 seconds):${RESET}

  ${CYAN}${BOLD}poly-glot login${RESET}

  ${DIM}Enter your email → get a magic link → you're in.${RESET}
  ${DIM}No password. No credit card. 50 files/month free.${RESET}

${LINE}

  ${BOLD}Step 2 — Add doc-comments to any file:${RESET}

  ${CYAN}poly-glot comment src/app.py${RESET}         ${DIM}# Python${RESET}
  ${CYAN}poly-glot comment src/index.ts${RESET}       ${DIM}# TypeScript${RESET}
  ${CYAN}poly-glot comment src/Main.java${RESET}      ${DIM}# Java${RESET}

${LINE}

  ${BOLD}Free plan (no signup needed for first 5 files):${RESET}
    ✅ Python · JavaScript · Java
    ✅ 50 files/month
    ✅ Doc-comments (JSDoc, PyDoc, JavaDoc)

  ${BOLD}${CYAN}Pro — $9/mo:${RESET}
    ✅ All 12 languages · unlimited files
    ✅ Why-comments · Both mode
    ✅ CLI + VS Code + Chrome extension

  ${YELLOW}${BOLD}🎁 EARLYBIRD3${RESET}${YELLOW} — locks Pro at $9/mo forever (expires May 1, 2026)${RESET}
  ${CYAN}   → https://poly-glot.ai/#pg-pricing-section${RESET}

${LINE}

  ${RED}${BOLD}→ Run this now:${RESET} ${CYAN}${BOLD}poly-glot login${RESET}

${LINE}
`);
