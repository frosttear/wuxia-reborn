// Dev test server with simulated slow HQ loading.
// Usage:
//   node scripts/test-server.mjs                   # port 3000, HQ delay 3 s
//   node scripts/test-server.mjs --hq-delay=5000   # 5 s HQ delay
//   node scripts/test-server.mjs --hq-delay=0      # no delay (plain static server)
//   node scripts/test-server.mjs --port=8080

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

const C = { reset: '\x1b[0m', dim: '\x1b[2m', cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m' };

const server = http.createServer((req, res) => {
    const urlPath  = req.url.split('?')[0];
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
            'Cache-Control':  'no-store',   // always re-fetch so delay simulation is observable
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
    console.log(`\nLog format:  [HQ +Xms] = slow  [LQ] = fast  [thumb] = fast  [static] = instant`);
    console.log('Press Ctrl+C to stop.\n');
});
