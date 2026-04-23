// Converts all illustration PNGs to JPEG and regenerates low/ thumbnails.
// Originals are backed up to assets/illustrations/originals/.
// Run: node scripts/optimize-illustrations.mjs
import sharp from 'sharp';
import { readdir, mkdir, copyFile, stat } from 'fs/promises';
import { join, basename } from 'path';

const HQ_DIR  = 'assets/illustrations';
const LOW_DIR = 'assets/illustrations/low';
const BAK_DIR = 'assets/illustrations/originals';

await mkdir(LOW_DIR, { recursive: true });
await mkdir(BAK_DIR, { recursive: true });

const files = (await readdir(HQ_DIR)).filter(f => f.endsWith('.png'));

let totalBefore = 0, totalAfter = 0;

for (const file of files) {
    const base   = basename(file, '.png');
    const srcPng = join(HQ_DIR, file);
    const dstJpg = join(HQ_DIR, `${base}.jpg`);
    const lowJpg = join(LOW_DIR, `${base}.jpg`);
    const bakPng = join(BAK_DIR, file);

    const before = (await stat(srcPng)).size;
    totalBefore += before;

    // Backup original PNG
    await copyFile(srcPng, bakPng);

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

console.log(`\nTotal HQ: ${kb(totalBefore)} → ${kb(totalAfter)} (${Math.round((1 - totalAfter / totalBefore) * 100)}% smaller)`);
console.log(`Originals backed up to ${BAK_DIR}/`);

function kb(bytes) { return `${Math.round(bytes / 1024)}KB`; }
