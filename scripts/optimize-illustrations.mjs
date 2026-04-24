// Reads PNGs from assets/illustrations/origins/, outputs three JPEG tiers:
//   HQ  (quality 85)              → assets/illustrations/<id>.jpg
//   LQ  (600px wide, quality 20)  → assets/illustrations/low/<id>.jpg
//   Thumb (100px wide, quality 10) → assets/illustrations/thumbnail/<id>.jpg
// Run: node scripts/optimize-illustrations.mjs
import sharp from 'sharp';
import { readdir, mkdir, stat } from 'fs/promises';
import { join, basename } from 'path';

const ORIGINS_DIR = 'assets/illustrations/origins';
const HQ_DIR      = 'assets/illustrations';
const LOW_DIR     = 'assets/illustrations/low';
const THUMB_DIR   = 'assets/illustrations/thumbnail';

await mkdir(LOW_DIR,   { recursive: true });
await mkdir(THUMB_DIR, { recursive: true });

const files = (await readdir(ORIGINS_DIR)).filter(f => f.endsWith('.png'));

let totalBefore = 0, totalAfter = 0;

for (const file of files) {
    const base     = basename(file, '.png');
    const srcPng   = join(ORIGINS_DIR, file);
    const dstJpg   = join(HQ_DIR,    `${base}.jpg`);
    const lowJpg   = join(LOW_DIR,   `${base}.jpg`);
    const thumbJpg = join(THUMB_DIR, `${base}.jpg`);

    const before = (await stat(srcPng)).size;
    totalBefore += before;

    // HQ JPEG at quality 85
    await sharp(srcPng).jpeg({ quality: 85, mozjpeg: true }).toFile(dstJpg);

    // LQ: max 600px wide, quality 20
    await sharp(srcPng)
        .resize({ width: 600, withoutEnlargement: true })
        .jpeg({ quality: 20, mozjpeg: true })
        .toFile(lowJpg);

    // Thumbnail: fixed 100x133 crop (3:4), quality 10 — shown first while LQ/HQ load
    await sharp(srcPng)
        .resize({ width: 100, height: 133, fit: 'cover' })
        .jpeg({ quality: 10, mozjpeg: true })
        .toFile(thumbJpg);

    const hqSize    = (await stat(dstJpg)).size;
    const lowSize   = (await stat(lowJpg)).size;
    const thumbSize = (await stat(thumbJpg)).size;
    totalAfter += hqSize;

    const pct = Math.round((1 - hqSize / before) * 100);
    console.log(`${base}: ${kb(before)} → HQ ${kb(hqSize)} (${pct}% smaller), LQ ${kb(lowSize)}, thumb ${kb(thumbSize)}`);
}

if (files.length === 0) {
    console.log('No PNG files found in ' + ORIGINS_DIR);
} else {
    console.log(`\nTotal HQ: ${kb(totalBefore)} → ${kb(totalAfter)} (${Math.round((1 - totalAfter / totalBefore) * 100)}% smaller)`);
}

function kb(bytes) { return `${Math.round(bytes / 1024)}KB`; }
