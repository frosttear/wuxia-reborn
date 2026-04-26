// Dev test server with simulated slow HQ loading.
// Usage:
//   node scripts/test-server.mjs                   # port 3000, HQ delay 3 s
//   node scripts/test-server.mjs --hq-delay=5000   # 5 s HQ delay
//   node scripts/test-server.mjs --hq-delay=0      # no delay (plain static server)
//   node scripts/test-server.mjs --port=8080
//
// Special routes:
//   /test/true-ending   game page with a "触发真结局" debug button (skips all unlock conditions)

import http from 'http';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const args = Object.fromEntries(
    process.argv.slice(2)
        .filter(a => a.startsWith('--'))
        .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? 'true']; })
);
const PORT     = parseInt(args.port     ?? 3000);
const HQ_DELAY = parseInt(args['hq-delay'] ?? 3000);

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css',
    '.js':   'text/javascript; charset=utf-8',
    '.mjs':  'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.svg':  'image/svg+xml',
    '.webp': 'image/webp',
    '.ico':  'image/x-icon',
};

// HQ illustrations: assets/illustrations/<id>.jpg  (NOT inside low/ or thumbnail/)
// Character HQ:     assets/characters/<id>.jpg      (NOT inside low/ or thumbnail/)
const isHq = p =>
    /^\/assets\/illustrations\/[^/]+\.jpe?g$/i.test(p) ||
    /^\/assets\/characters\/[^/]+\.jpe?g$/i.test(p);
const isLq    = p => /\/low\//i.test(p);
const isThumb = p => /\/thumbnail\//i.test(p);

const C = { reset: '\x1b[0m', dim: '\x1b[2m', cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', magenta: '\x1b[35m' };

// ── Debug injection for /test/true-ending ───────────────────────────────────
// Injected into index.html; sets up minimal Engine state then calls
// triggerTrueVictory() — all unlock conditions are bypassed.
const TRUE_ENDING_DEBUG = `
<script>
(function () {
  // Floating debug panel
  const panel = document.createElement('div');
  panel.style.cssText = [
    'position:fixed', 'bottom:16px', 'right:16px', 'z-index:99999',
    'display:flex', 'flex-direction:column', 'gap:6px', 'align-items:flex-end'
  ].join(';');

  const badge = document.createElement('div');
  badge.textContent = '🛠 DEBUG';
  badge.style.cssText = 'font-size:10px;color:#888;letter-spacing:.06em;text-align:right;';
  panel.appendChild(badge);

  const btn = document.createElement('button');
  btn.textContent = '▶ 触发真结局';
  btn.style.cssText = [
    'background:#1a3a1a', 'border:1px solid #4a8a4a', 'color:#7ddb7d',
    'padding:8px 16px', 'cursor:pointer', 'border-radius:6px',
    'font-size:13px', 'letter-spacing:.05em', 'font-family:inherit'
  ].join(';');

  btn.onclick = function () {
    if (typeof Engine === 'undefined') {
      alert('Engine 尚未加载，请稍候再试。');
      return;
    }

    // Build minimal state so triggerTrueVictory() and showVictoryScreen() both work
    Engine.state = Engine.state || {};
    Engine.state.autoAdvance = false;
    Engine.state.autoTimer   = null;
    Engine.state.gamePhase   = 'playing';
    Engine.state.jobs        = Engine.state.jobs  || [];
    Engine.state.bonds       = Engine.state.bonds || {};
    Engine.state.npcs        = Engine.state.npcs  || [];
    Engine.state.chains      = Engine.state.chains || [];
    if (!Engine.state.char) {
      Engine.state.char = {
        name: '测试主角', age: 20, gender: 'male',
        strength: 10, agility: 10, constitution: 10,
        innerForce: 10, comprehension: 10, luck: 10, reputation: 0,
        hp: 100, maxHp: 100, kills: 0,
        flags: {}, unlockedIllustrations: [],
        bondLevels: {}, lifetimeBondLevels: {},
        chainProgress: {}, lifetimeChainsDone: [],
        talents: [], skills: [],
      };
    }

    // Switch to event-log tab if the UI has a tab switcher
    if (typeof UI !== 'undefined' && typeof UI.switchTab === 'function') {
      UI.switchTab('event');
    }

    btn.disabled = true;
    btn.textContent = '▶ 演出进行中…';
    Engine.triggerTrueVictory();
    console.log('[debug] triggerTrueVictory() called');
  };

  panel.appendChild(btn);
  document.body.appendChild(panel);
})();
</script>
`;

const server = http.createServer((req, res) => {
    const urlPath  = req.url.split('?')[0];

    // ── Special test route ──────────────────────────────────────────────────
    if (urlPath === '/test/true-ending') {
        console.log(`${C.magenta}[TEST]  ${C.reset} /test/true-ending`);
        let html;
        try { html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'); }
        catch { res.writeHead(500); res.end('index.html not found'); return; }
        const injected = html
            .replace('<head>', '<head>\n<base href="/">')
            .replace('</body>', TRUE_ENDING_DEBUG + '\n</body>');
        const buf = Buffer.from(injected, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': buf.length, 'Cache-Control': 'no-store' });
        res.end(buf);
        return;
    }

    // ── Static file serving ─────────────────────────────────────────────────
    const filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
    const ext      = path.extname(filePath).toLowerCase();
    const mime     = MIME[ext] || 'application/octet-stream';

    const hq    = isHq(urlPath);
    const lq    = isLq(urlPath);
    const thumb = isThumb(urlPath);

    const label = hq    ? `${C.yellow}[HQ +${HQ_DELAY}ms]${C.reset}`
                : lq    ? `${C.green}[LQ      ]${C.reset}`
                : thumb ? `${C.dim}[thumb    ]${C.reset}`
                :         `${C.cyan}[static  ]${C.reset}`;

    console.log(`${label} ${urlPath}`);

    let data;
    try {
        data = fs.readFileSync(filePath);
    } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        console.log(`${C.red}[404]${C.reset} ${urlPath}`);
        return;
    }

    const send = () => {
        res.writeHead(200, {
            'Content-Type':   mime,
            'Content-Length': data.length,
            'Cache-Control':  'no-store',
        });
        res.end(data);
    };

    if (hq && HQ_DELAY > 0) setTimeout(send, HQ_DELAY);
    else send();
});

server.listen(PORT, () => {
    console.log(`\nTest server  →  http://localhost:${PORT}`);
    console.log(`HQ delay     →  ${HQ_DELAY} ms  (illustrations and character portraits)`);
    console.log(`LQ/thumb     →  no delay`);
    console.log(`\nDebug routes:`);
    console.log(`  /test/true-ending  →  game + "触发真结局" button (bypasses all unlock conditions)`);
    console.log(`\nLog format:  [HQ +Xms] = slow  [LQ] = fast  [thumb] = fast  [static] = instant`);
    console.log('Press Ctrl+C to stop.\n');
});
