// ─────────────────────────────────────────────────────────────────────
// P2-8 — Hero asset optimizer
//
// Generates WebP + AVIF siblings for `public/campus-hero.png`. Run
// once after the asset changes; commit the output. Browsers that
// support AVIF (~94% global) will pick it; others fall back to WebP
// (~97% global); the original PNG is the last-resort fallback only
// for the < 3% of legacy browsers.
//
// Usage:
//   npm run optimize:hero
//
// Tuning rationale:
//   - WebP quality 78: visually lossless on the existing photo,
//     ~85% smaller file vs PNG.
//   - AVIF quality 55: AVIF maps quality differently — 55 is roughly
//     equivalent to WebP 78 in perceived quality and typically
//     ~25-40% smaller still.
// ─────────────────────────────────────────────────────────────────────

import sharp from 'sharp';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');
const source = join(publicDir, 'campus-hero.png');
const targets = [
  { ext: 'webp', encode: (img) => img.webp({ quality: 78 }) },
  { ext: 'avif', encode: (img) => img.avif({ quality: 55 }) },
];

const fmtKb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

const sourceStat = statSync(source);
console.log(`source: campus-hero.png (${fmtKb(sourceStat.size)})`);

await Promise.all(
  targets.map(async ({ ext, encode }) => {
    const out = join(publicDir, `campus-hero.${ext}`);
    await encode(sharp(source)).toFile(out);
    const stat = statSync(out);
    const ratio = ((1 - stat.size / sourceStat.size) * 100).toFixed(0);
    console.log(`  → campus-hero.${ext}  ${fmtKb(stat.size)}  (-${ratio}%)`);
  }),
);

console.log('done.');
