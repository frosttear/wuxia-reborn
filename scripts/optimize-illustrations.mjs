// Reads PNGs from assets/illustrations/origins/, outputs compressed JPEG to
// assets/illustrations/ (HQ, quality 85) and assets/illustrations/low/ (LQ, 600px, quality 20).
// Run: node scripts/optimize-illustrations.mjs
import sharp from 'sharp';
import { readdir, mkdir, stat } from 'fs/promises';
import { join, basename } from 'path';

const ORIGINS_DIR = 'assets/illustrations/origins';
const HQ_DIR      = 'assets/illustrations';
const LOW_DIR     = 'assets/illustrations/low';

await mkdir(LOW_DIR, { recursive: true });

const files = (await readdir(ORIGINS_DIR)).filter(f => f.endsWith('.png'));

let totalBefore = 0, totalAfter = 0;

for (const file of files) {
    const base   = basename(file, '.png');
    const srcPng = join(ORIGINS_DIR, file);
    const dstJpg = join(HQ_DIR, `${base}.jpg`);
    const lowJpg = join(LOW_DIR, `${base}.jpg`);

    const before = (await stat(srcPng)).size;
    totalBefore += before;

    // HQ JPEG at quality 85
    await sharp(srcPng).jpeg({ quality: 85, mozjpeg: true }).toFile(dstJpg);

    // Low thumbnail: max 600px wide, quality 20
    await sharp(srcPng)
        .resize({ width: 600, withoutEnlargement: true })
        .jpeg({ quality: 20, mozjpeg: true })
        .toFile(lowJpg);

    const hqSize  = (await stat(dstJpg)).size;
    const lowSize = (await stat(lowJpg)).size;
    totalAfter += hqSize;

    const pct = Math.round((1 - hqSize / before) * 100);
    console.log(`${base}: ${kb(before)} → HQ ${kb(hqSize)} (${pct}% smaller), LQ ${kb(lowSize)}`);
}

if (files.length === 0) {
    console.log('No PNG files found in ' + ORIGINS_DIR);
} else {
    console.log(`\nTotal HQ: ${kb(totalBefore)} → ${kb(totalAfter)} (${Math.round((1 - totalAfter / totalBefore) * 100)}% smaller)`);
}

function kb(bytes) { return `${Math.round(bytes / 1024)}KB`; }
