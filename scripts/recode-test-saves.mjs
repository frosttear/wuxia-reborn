// One-shot script: re-encode test save codes from old format (btoa(encodeURIComponent(json)))
// to the format importSave expects: btoa(unescape(encodeURIComponent(json)))
// Run: node scripts/recode-test-saves.mjs
import { readFileSync } from 'fs';

const md = readFileSync('tests/test-saves.md', 'utf8');
const codeBlocks = [...md.matchAll(/```\n([A-Za-z0-9+/=]+)\n```/g)].map(m => m[1].trim());

for (const [i, b64] of codeBlocks.entries()) {
    const raw = Buffer.from(b64, 'base64').toString('latin1');
    const json = raw.startsWith('%') ? decodeURIComponent(raw) : (() => {
        // new format — already correct, just echo
        return raw;
    })();
    const data = JSON.parse(json);
    const reEncoded = Buffer.from(unescape(encodeURIComponent(JSON.stringify(data))), 'latin1').toString('base64');
    console.log(`\n=== Save ${String.fromCharCode(65 + i)} ===`);
    console.log(reEncoded);
}
