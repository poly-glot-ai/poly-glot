/**
 * Poly-Glot Demo Recorder v9 — No jumping, stay in frame, 50% slower
 * ─────────────────────────────────────────────────────────────────────────────
 * headless: true  → zero browser chrome, pure site content in every frame
 * FPS: 20         → steady, readable pace
 *
 * Scene flow — camera never jumps backward:
 *   1. Hero (top of page) — intro captions
 *   2. Why it matters — captions on hero
 *   3. Smooth scroll → CLI Flags section — open panel, read flags
 *   4. Smooth scroll → "See How It Works" — language + mode selectors
 *   5. Select Kotlin → Select Both mode (stay in frame, no jump)
 *   6. Glow + click #cliDemoBtn
 *   7. Terminal slides in — stay on terminal, show all output
 *   8. Smooth scroll → #codeOutputSection — stay on it, read through output
 *   9. Captions on code output: "Supports 12 languages" + 922 stat
 *  10. Smooth scroll → .enterprise-section ("Need Poly-Glot for Your Team?")
 *  11. Captions: "Developers already shipping" → "If this saves you time" → poly-glot.ai URL
 *
 * Outputs → ~/Downloads: MP4 · WEBM (no GIF)
 */

'use strict';

const { chromium } = require('playwright');
const { execSync } = require('child_process');
const path         = require('path');
const fs           = require('fs');
const os           = require('os');

// ── Config ────────────────────────────────────────────────────────────────────
const W          = 1440;
const H          = 900;
const FPS        = 15;
const DOWNLOADS  = path.join(os.homedir(), 'Downloads');
const OUT_DIR    = path.join(__dirname, 'out');
const FRAMES_DIR = path.join(OUT_DIR, 'frames');
const MP4        = path.join(DOWNLOADS, 'poly-glot-demo.mp4');
const WEBM       = path.join(DOWNLOADS, 'poly-glot-demo.webm');

// ── Setup ─────────────────────────────────────────────────────────────────────
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(FRAMES_DIR, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Frame capture (headless — pure page content, zero chrome) ─────────────────
let frameIndex = 0, capturing = false, capTimer = null;

async function startCapture(page) {
  capturing = true;
  const tick = async () => {
    if (!capturing) return;
    const f = path.join(FRAMES_DIR, `frame_${String(frameIndex).padStart(6,'0')}.png`);
    try { await page.screenshot({ path: f, type: 'png' }); } catch(_) {}
    frameIndex++;
    if (capturing) capTimer = setTimeout(tick, Math.floor(1000 / FPS));
  };
  capTimer = setTimeout(tick, Math.floor(1000 / FPS));
  await sleep(200);
}

async function stopCapture() {
  capturing = false;
  clearTimeout(capTimer);
  await sleep(600);
}

// ── Cubic-ease-in-out window scroll — zero jumps ──────────────────────────────
async function smoothScroll(page, toY, ms = 1800) {
  await page.evaluate(({ toY, ms }) => new Promise(resolve => {
    const from = window.scrollY;
    const dist = toY - from;
    if (Math.abs(dist) < 1) { resolve(); return; }
    const start = performance.now();
    const ease  = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    const tick  = now => {
      const p = Math.min((now - start) / ms, 1);
      window.scrollTo(0, from + dist * ease(p));
      p < 1 ? requestAnimationFrame(tick) : (window.scrollTo(0, toY), resolve());
    };
    requestAnimationFrame(tick);
  }), { toY, ms });
  await sleep(ms + 120);
}

// Scroll page so element sits at `offset` px from top of viewport
async function scrollToEl(page, selector, offset = 80, ms = 2200) {
  const y = await page.evaluate(({ sel, off }) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    return Math.max(0, el.getBoundingClientRect().top + window.scrollY - off);
  }, { sel: selector, off: offset });
  if (y !== null) await smoothScroll(page, y, ms);
}

// Cubic-ease-in-out scroll inside an overflow element
async function smoothScrollEl(page, selector, toTop, ms = 1400) {
  await page.evaluate(({ sel, to, ms }) => new Promise(resolve => {
    const el = document.querySelector(sel);
    if (!el) { resolve(); return; }
    const from = el.scrollTop;
    const dist = to - from;
    if (Math.abs(dist) < 1) { resolve(); return; }
    const start = performance.now();
    const ease  = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    const tick  = now => {
      const p = Math.min((now - start) / ms, 1);
      el.scrollTop = from + dist * ease(p);
      p < 1 ? requestAnimationFrame(tick) : (el.scrollTop = to, resolve());
    };
    requestAnimationFrame(tick);
  }), { sel: selector, to: toTop, ms });
  await sleep(ms + 120);
}

// ── Caption system ────────────────────────────────────────────────────────────
const CAP_STYLE = {
  position:       'fixed',
  bottom:         '44px',
  left:           '50%',
  transform:      'translateX(-50%)',
  maxWidth:       '860px',
  width:          'max-content',
  background:     'rgba(4,6,20,0.97)',
  color:          '#e2e8f0',
  fontSize:       '20px',
  fontWeight:     '600',
  fontFamily:     'Inter,system-ui,sans-serif',
  lineHeight:     '1.7',
  padding:        '16px 44px',
  borderRadius:   '16px',
  border:         '1.5px solid rgba(99,102,241,0.65)',
  boxShadow:      '0 12px 48px rgba(0,0,0,0.9)',
  zIndex:         '2147483647',
  textAlign:      'center',
  pointerEvents:  'none',
  backdropFilter: 'blur(16px)',
  opacity:        '0',
  transition:     'opacity 0.35s ease',
};

async function caption(page, html, holdMs) {
  await page.evaluate(({ html, style }) => {
    document.getElementById('_cap')?.remove();
    const d = document.createElement('div');
    d.id = '_cap';
    d.innerHTML = html;
    Object.assign(d.style, style);
    document.body.appendChild(d);
    requestAnimationFrame(() => requestAnimationFrame(() => { d.style.opacity = '1'; }));
  }, { html, style: CAP_STYLE });
  await sleep(holdMs);
  await page.evaluate(() => {
    const d = document.getElementById('_cap');
    if (d) d.style.opacity = '0';
  });
  await sleep(400);
  await page.evaluate(() => document.getElementById('_cap')?.remove());
}

async function pinCaption(page, html) {
  await page.evaluate(({ html, style }) => {
    document.getElementById('_cap')?.remove();
    const d = document.createElement('div');
    d.id = '_cap';
    d.innerHTML = html;
    Object.assign(d.style, style);
    document.body.appendChild(d);
    requestAnimationFrame(() => requestAnimationFrame(() => { d.style.opacity = '1'; }));
  }, { html, style: CAP_STYLE });
  await sleep(500);
}

async function unpinCaption(page) {
  await page.evaluate(() => {
    const d = document.getElementById('_cap');
    if (d) d.style.opacity = '0';
  });
  await sleep(400);
  await page.evaluate(() => document.getElementById('_cap')?.remove());
}

// ── Glow ──────────────────────────────────────────────────────────────────────
async function glow(page, sel, color = '#6366f1', ms = 1000) {
  await page.evaluate(({ s, c }) => {
    const el = document.querySelector(s);
    if (!el) return;
    el.style.transition = 'outline .25s, box-shadow .25s';
    el.style.outline    = `3px solid ${c}`;
    el.style.boxShadow  = `0 0 0 6px ${c}22, 0 0 32px ${c}88`;
  }, { s: sel, c: color });
  await sleep(ms);
  await page.evaluate(s => {
    const el = document.querySelector(s);
    if (el) { el.style.outline = ''; el.style.boxShadow = ''; }
  }, sel);
}

// ── Visual dropdown (animated hover through options) ──────────────────────────
async function visualSelect(page, selectId, optionValue, optionLabel, accent = '#6366f1') {
  await glow(page, `#${selectId}`, accent, 600);

  // Inject floating dropdown UI over the real <select>
  await page.evaluate(({ id, accent }) => {
    const sel  = document.getElementById(id);
    if (!sel) return;
    const rect = sel.getBoundingClientRect();
    const wrap = document.createElement('div');
    wrap.id = '_vsel';
    Object.assign(wrap.style, {
      position: 'fixed', top: rect.top + 'px', left: rect.left + 'px',
      width: rect.width + 'px', zIndex: '2147483640',
      fontFamily: 'Inter,system-ui,sans-serif', fontSize: '14px', fontWeight: '500',
    });
    // Face (selected value display)
    const face = document.createElement('div');
    Object.assign(face.style, {
      background: 'rgba(99,102,241,0.14)', border: `1.5px solid ${accent}`,
      borderRadius: '8px', color: '#e2e8f0', padding: '8px 32px 8px 12px',
      position: 'relative', boxShadow: `0 0 0 3px ${accent}44`,
    });
    face.textContent = sel.options[sel.selectedIndex]?.text || '';
    const arrow = document.createElement('span');
    Object.assign(arrow.style, {
      position: 'absolute', right: '10px', top: '50%',
      transform: 'translateY(-50%)', fontSize: '10px', color: '#94a3b8',
    });
    arrow.textContent = '▼';
    face.appendChild(arrow);
    wrap.appendChild(face);
    // Dropdown list
    const list = document.createElement('div');
    list.id = '_vsel_list';
    Object.assign(list.style, {
      background: '#1a1d27', border: `1.5px solid ${accent}`, borderRadius: '8px',
      marginTop: '4px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
      opacity: '0', transform: 'translateY(-8px)', transition: 'opacity 0.22s, transform 0.22s',
    });
    Array.from(sel.options).forEach(opt => {
      const item = document.createElement('div');
      item.dataset.val = opt.value;
      Object.assign(item.style, {
        padding: '10px 14px', color: '#e2e8f0',
        transition: 'background 0.14s', background: 'transparent',
      });
      item.textContent = opt.text;
      list.appendChild(item);
    });
    wrap.appendChild(list);
    document.body.appendChild(wrap);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      list.style.opacity = '1';
      list.style.transform = 'translateY(0)';
    }));
  }, { id: selectId, accent });

  await sleep(500);

  // Animate hover through each option to the target
  const targetIdx = await page.evaluate(({ id, val }) =>
    Array.from(document.getElementById(id)?.options || []).findIndex(o => o.value === val),
    { id: selectId, val: optionValue });

  for (let i = 0; i <= targetIdx; i++) {
    await page.evaluate(i => {
      document.querySelectorAll('#_vsel_list div').forEach((it, j) => {
        it.style.background = j === i ? 'rgba(99,102,241,0.30)' : 'transparent';
      });
    }, i);
    await sleep(130);
  }

  // Lock in the selection
  await page.evaluate(val => {
    document.querySelectorAll('#_vsel_list div').forEach(it => {
      if (it.dataset.val === val) {
        it.style.background = 'rgba(99,102,241,0.65)';
        it.style.color      = '#fff';
        it.style.fontWeight = '700';
      }
    });
  }, optionValue);
  await sleep(400);

  // Commit to real <select>, update face, close list
  await page.selectOption(`#${selectId}`, optionValue);
  await page.evaluate(label => {
    const face = document.querySelector('#_vsel > div:first-child');
    if (face) {
      const span = face.querySelector('span');
      face.textContent = label;
      if (span) face.appendChild(span);
    }
    const list = document.getElementById('_vsel_list');
    if (list) { list.style.opacity = '0'; list.style.transform = 'translateY(-8px)'; }
  }, optionLabel);
  await sleep(320);
  await page.evaluate(() => document.getElementById('_vsel')?.remove());
  await sleep(220);
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('🚀  Poly-Glot Demo Recorder v9');
  console.log(`    ${W}×${H} @2x retina · headless · ${FPS}fps · no GIF`);
  console.log(`    Kotlin · both mode · live terminal demo`);
  console.log(`    Output → ${DOWNLOADS}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-infobars'],
  });

  const ctx = await browser.newContext({
    viewport:        { width: W, height: H },
    deviceScaleFactor: 2,
    colorScheme:     'dark',
  });

  // Hide scrollbars + suppress any install-prompt banners
  await ctx.addInitScript(() => {
    const s = document.createElement('style');
    s.textContent = [
      '::-webkit-scrollbar { display: none !important }',
      '* { scrollbar-width: none !important; -ms-overflow-style: none !important }',
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  });

  const page = await ctx.newPage();

  // Block analytics only — never touch demo scripts
  await page.route(/googletagmanager|google-analytics|gtag/, r => r.abort());

  // ── Load ──────────────────────────────────────────────────────────────────
  console.log('🌐  Loading poly-glot.ai …');
  await page.goto('https://poly-glot.ai/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(3800);

  console.log('🎥  Recording …\n');
  await startCapture(page);
  await sleep(1200);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 1 — Hero (stay on hero, no scroll)
  // ══════════════════════════════════════════════════════════════════════════
  await caption(page,
    '🦜 <strong style="color:#a5b4fc">Poly-Glot</strong> — AI-Powered Code Comment Generation',
    11500);

  await caption(page,
    'Transforms undocumented code into<br><strong style="color:#6ee7b7">professional-grade documentation</strong> — instantly.',
    11500);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 2 — Why it matters (still on hero)
  // ══════════════════════════════════════════════════════════════════════════
  await caption(page,
    'Well-documented code makes <strong style="color:#fbbf24">AI work better</strong>:',
    8400);
  await caption(page,
    '📚 <strong>Searchable</strong> — supercharges RAG retrieval',
    8000);
  await caption(page,
    '🧠 <strong>Understandable</strong> — AI grasps intent instantly',
    8000);
  await caption(page,
    '🎯 <strong>Discoverable</strong> — Generative Engine Optimized',
    8000);
  await caption(page,
    '🛡️ <strong>Safer</strong> — preserves critical context across teams',
    8000);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 3 — CLI Flags Reference
  // ══════════════════════════════════════════════════════════════════════════
  await caption(page,
    '🛠️ Ships with <strong style="color:#fbbf24">safety flags</strong> — know exactly what changes before it changes.',
    10500);

  await scrollToEl(page, '#cliFlagsRef', 60, 5100);
  await sleep(1700);

  // Open panel if collapsed
  const flagsOpen = await page.evaluate(() =>
    document.getElementById('cliFlagsBody')?.classList.contains('open') ?? false);
  if (!flagsOpen) {
    await page.evaluate(() =>
      document.getElementById('cliFlagsToggle')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await sleep(1700);
  }

  await caption(page,
    '📋 <strong>CLI Flags Reference</strong> — every flag, mode, and example in one place.',
    10500);
  await caption(page,
    '<code style="font-family:monospace;background:rgba(99,102,241,0.2);padding:4px 16px;border-radius:6px">' +
    '--dry-run &nbsp;·&nbsp; --diff &nbsp;·&nbsp; --backup &nbsp;·&nbsp; --dir &nbsp;·&nbsp; --why &nbsp;·&nbsp; --both' +
    '</code>',
    10500);

  // Slow pan down through the flags panel — linger on every row
  await smoothScroll(page, await page.evaluate(() => window.scrollY) + 320, 5100); await sleep(1300);
  await smoothScroll(page, await page.evaluate(() => window.scrollY) + 320, 5100); await sleep(1300);
  await smoothScroll(page, await page.evaluate(() => window.scrollY) + 220, 4700); await sleep(1700);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 4 — "See How It Works" — selectors in frame
  // ══════════════════════════════════════════════════════════════════════════
  await caption(page,
    'Now let\'s <strong style="color:#a5b4fc">see it in action</strong>…',
    6300);

  await scrollToEl(page, '.cli-demo-cta', 60, 4700);
  await sleep(2100);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 5 — Visual Language select → Kotlin (stay in frame)
  // ══════════════════════════════════════════════════════════════════════════
  await caption(page,
    'Selecting language: <strong style="color:#a5b4fc">Kotlin</strong>',
    5900);
  await visualSelect(page, 'cliDemoLanguage', 'kotlin', 'Kotlin', '#a5b4fc');
  await sleep(1300);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 6 — Visual Mode select → Both (stay in frame)
  // ══════════════════════════════════════════════════════════════════════════
  await caption(page,
    'Mode: <strong style="color:#c4b5fd">Both</strong> — doc-comments + why-comments in one pass',
    8000);
  await visualSelect(page, 'cliDemoMode', 'both', '📝💬 Both', '#7c3aed');
  await sleep(1300);

  await caption(page,
    '✅ Two AI passes, one command: ' +
    '<code style="font-family:monospace;background:rgba(124,58,237,0.2);padding:2px 14px;border-radius:5px">' +
    'poly-glot both ListUtils.kt</code>',
    9500);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 7 — Glow + click the live button (stay in frame)
  // ══════════════════════════════════════════════════════════════════════════
  // Scroll just enough so the button is comfortably visible
  await scrollToEl(page, '#cliDemoBtn', 240, 3300);
  await sleep(1300);

  await glow(page, '#cliDemoBtn', '#6366f1', 3000);
  await sleep(900);
  await caption(page, '▶️ Running the live CLI demo…', 4700);

  console.log('  🖱  Clicking #cliDemoBtn …');
  await page.evaluate(() =>
    document.getElementById('cliDemoBtn')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 8 — Terminal slides in — scroll to it, stay on it
  // ══════════════════════════════════════════════════════════════════════════
  console.log('  ⏳  Waiting for terminal …');
  await page.waitForFunction(() => {
    const el = document.getElementById('cliTerminalDemo');
    return el && el.classList.contains('active') && el.style.display !== 'none';
  }, { timeout: 10000 });

  // Scroll so terminal fills the viewport — stay here for the whole animation
  await scrollToEl(page, '#cliTerminalDemo', 40, 3800);
  await sleep(1700);

  await pinCaption(page,
    '⚡ <strong style="color:#6ee7b7">CLI running</strong> — two AI passes on ' +
    '<code style="font-family:monospace;background:rgba(99,102,241,0.2);padding:1px 10px;border-radius:4px">ListUtils.kt</code>');

  // Wait for terminal to finish — "File updated" is the last line
  console.log('  ⏳  Waiting for terminal output to finish …');
  await page.waitForFunction(() => {
    const el = document.getElementById('terminalOutput');
    return el && el.textContent.includes('File updated');
  }, { timeout: 25000 });
  console.log('  ✅  Terminal output complete');

  await sleep(3800);
  await unpinCaption(page);
  await sleep(1300);

  // If terminalOutput overflows, scroll it so all lines are visible
  const termScrollable = await page.evaluate(() => {
    const el = document.getElementById('terminalOutput');
    return el ? Math.max(0, el.scrollHeight - el.clientHeight) : 0;
  });
  if (termScrollable > 0) {
    console.log(`  terminalOutput overflow: ${termScrollable}px — scrolling`);
    await smoothScrollEl(page, '#terminalOutput', termScrollable, 5100);
    await sleep(2600);
  }

  // Hold on the completed terminal output so viewer can read every line
  await sleep(4200);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 9 — Scroll to code output panel — stay on it
  // ══════════════════════════════════════════════════════════════════════════
  console.log('  ⏳  Waiting for #codeOutputSection …');
  await page.waitForFunction(() => {
    const el = document.getElementById('codeOutputSection');
    return el && el.style.display !== 'none' && el.innerHTML.trim().length > 100;
  }, { timeout: 12000 });
  console.log('  ✅  Code output ready');

  await caption(page,
    '📄 <strong style="color:#a5b4fc">ListUtils.kt</strong> — fully documented in seconds',
    8400);

  // Scroll so code output panel is at the top of viewport — stay here
  await scrollToEl(page, '#codeOutputSection', 40, 4700);
  await sleep(2100);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 10 — Read through the code output (slow, steady, stay in frame)
  // ══════════════════════════════════════════════════════════════════════════
  const codeScrollable = await page.evaluate(() => {
    const el = document.getElementById('codeOutputBody');
    return el ? Math.max(0, el.scrollHeight - el.clientHeight) : 0;
  });
  console.log(`  codeOutputBody scrollable: ${codeScrollable}px`);

  if (codeScrollable > 0) {
    // Tiny steps, very long duration — viewer reads every single comment line
    const STEP    = 22;
    const STEP_MS = 3400;
    const steps   = Math.ceil(codeScrollable / STEP);
    console.log(`  ${steps} steps × ${STEP}px @ ${STEP_MS}ms`);
    for (let i = 0; i < steps; i++) {
      await smoothScrollEl(
        page, '#codeOutputBody',
        Math.min((i + 1) * STEP, codeScrollable),
        STEP_MS);
      await sleep(250);
    }
    await smoothScrollEl(page, '#codeOutputBody', codeScrollable, 2100);
    await sleep(4700);
  } else {
    // Not overflow — page-scroll through the section
    console.log('  codeOutputBody: page-scroll mode');
    await smoothScroll(page, await page.evaluate(() => window.scrollY) + 280, 4700); await sleep(1500);
    await smoothScroll(page, await page.evaluate(() => window.scrollY) + 280, 4700); await sleep(1500);
    await smoothScroll(page, await page.evaluate(() => window.scrollY) + 200, 4200); await sleep(2000);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 11 — Stats captions on code output (stay in this frame)
  // ══════════════════════════════════════════════════════════════════════════
  await caption(page,
    'Supports <strong style="color:#6ee7b7">12 languages</strong>.<br>' +
    'Safety flags. One command. Zero friction.',
    11500);

  await caption(page,
    '<span style="font-size:30px">🚀</span><br>' +
    '<strong style="color:#fbbf24;font-size:24px">922 CLI installs</strong>' +
    '<span style="color:#94a3b8;font-size:17px"> on feature launch day</span>',
    12600);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 12 — Scroll to enterprise section ("Need Poly-Glot for Your Team?")
  // ══════════════════════════════════════════════════════════════════════════
  await scrollToEl(page, '.enterprise-section', 40, 5900);
  await sleep(2600);

  await caption(page,
    'Developers are already shipping cleaner,<br>' +
    '<strong style="color:#6ee7b7">better-documented code</strong> with Poly-Glot.<br>' +
    '<span style="color:#94a3b8;font-size:16px">Join them.</span>',
    11500);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 13 — Closing (stay on enterprise section)
  // ══════════════════════════════════════════════════════════════════════════
  await caption(page,
    '⭐ <strong>If this saves you time — star us on GitHub.</strong><br>' +
    '<span style="color:#94a3b8;font-size:15px">Every star helps other developers find Poly-Glot.</span>',
    11500);

  await caption(page,
    '<span style="font-size:26px;color:#a5b4fc;font-weight:800">poly-glot.ai</span><br>' +
    '<span style="font-size:15px;color:#94a3b8">Free web UI &nbsp;·&nbsp; Open source CLI &nbsp;·&nbsp; OpenAI &amp; Anthropic</span>',
    13700);

  await sleep(4700);

  // ── Stop capture ───────────────────────────────────────────────────────────
  console.log('\n⏹  Stopping capture …');
  await stopCapture();
  await browser.close();

  const secs = (frameIndex / FPS).toFixed(0);
  console.log(`📸  ${frameIndex} frames (~${secs}s @ ${FPS}fps)\n`);

  // ── Encode MP4 ─────────────────────────────────────────────────────────────
  console.log('🎞  Encoding MP4 …');
  execSync([
    'ffmpeg -y',
    `-framerate ${FPS}`,
    '-pattern_type glob',
    `-i "${FRAMES_DIR}/frame_*.png"`,
    `-vf "scale=${W*2}:${H*2}:flags=lanczos,format=yuv420p"`,
    '-c:v libx264 -preset slow -crf 16',
    '-movflags +faststart',
    `"${MP4}"`,
  ].join(' '), { stdio: 'inherit' });
  console.log(`✅  MP4  → ${MP4}`);

  // ── Encode WEBM ────────────────────────────────────────────────────────────
  console.log('\n🎞  Encoding WEBM …');
  execSync([
    'ffmpeg -y',
    `-framerate ${FPS}`,
    '-pattern_type glob',
    `-i "${FRAMES_DIR}/frame_*.png"`,
    `-vf "scale=${W*2}:${H*2}:flags=lanczos,format=yuv420p"`,
    '-c:v libvpx-vp9 -crf 24 -b:v 0 -row-mt 1',
    `"${WEBM}"`,
  ].join(' '), { stdio: 'inherit' });
  console.log(`✅  WEBM → ${WEBM}`);

  const mp4MB  = (fs.statSync(MP4).size  / 1e6).toFixed(1);
  const webmMB = (fs.statSync(WEBM).size / 1e6).toFixed(1);

  console.log(`
╔══════════════════════════════════════════════════════════╗
║  🎬  Poly-Glot Demo v9 — Done!                           ║
╠══════════════════════════════════════════════════════════╣
║  Duration : ~${String(secs).padEnd(3)}s · ${String(frameIndex).padEnd(5)} frames · ${FPS}fps          ║
║  MP4      : ${mp4MB.padStart(5)} MB → poly-glot-demo.mp4           ║
║  WEBM     : ${webmMB.padStart(5)} MB → poly-glot-demo.webm          ║
║  Saved to : ~/Downloads                                  ║
╚══════════════════════════════════════════════════════════╝
`);

})().catch(e => {
  console.error('\n❌  Fatal:', e.message);
  console.error(e.stack);
  process.exit(1);
});
