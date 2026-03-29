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
const LINE   = '─'.repeat(54);

console.log(`
${GREEN}${BOLD}🦜 Thanks for installing Poly-Glot AI CLI v1.6.1!${RESET}
${LINE}

  ${BOLD}Get started in 30 seconds:${RESET}

  ${DIM}# Set your API key (OpenAI or Anthropic)${RESET}
  ${CYAN}poly-glot config${RESET}

  ${DIM}# Add doc-comments to any file${RESET}
  ${CYAN}poly-glot comment src/app.py${RESET}

  ${DIM}# Add why-comments explaining intent & trade-offs (Pro)${RESET}
  ${CYAN}poly-glot comment src/app.py --why${RESET}

  ${DIM}# Do both in one pass (Pro)${RESET}
  ${CYAN}poly-glot comment src/app.py --both${RESET}

  ${BOLD}${CYAN}Free forever:${RESET}  Python · JavaScript · Java · doc-comments
  ${BOLD}${CYAN}Pro ($9/mo): ${RESET}  All 12 languages · why + both modes · no API key needed

  ${YELLOW}${BOLD}🎁 Early bird offer:${RESET} Use code ${BOLD}EARLYBIRD3${RESET} at checkout
  ${YELLOW}   → 3 months completely free · limited to first 50 subscribers${RESET}

  ${CYAN}→ Sign up at https://poly-glot.ai${RESET}

${LINE}
`);
