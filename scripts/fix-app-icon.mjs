/**
 * Fix stoodioz-app-icon.png: make checkered/light background truly transparent and trim.
 * The "transparent" checkered grid is usually baked in as light gray/white pixels;
 * this sets those to alpha=0 and trims to the logo.
 */
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const path = join(root, 'assets', 'stoodioz-app-icon.png');

const { data, info } = await sharp(path)
  .raw()
  .ensureAlpha()
  .toBuffer({ resolveWithObject: true });

// Make checkered/light-background pixels truly transparent.
// Typical checker: white and light gray (e.g. 255,255,255 and ~220–240).
// Threshold: if R,G,B are all >= 208, treat as background.
const THRESHOLD = 208;
for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD) {
    data[i + 3] = 0;
  }
}

const trimmed = await sharp(new Uint8Array(data), {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .trim({ threshold: 1 })
  .toBuffer();

await sharp(trimmed).png().toFile(path);
console.log('Fixed assets/stoodioz-app-icon.png: checkered background set to transparent and trimmed.');
