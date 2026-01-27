#!/usr/bin/env node
/**
 * Script to process logo: remove grey/black, keep only orange and white, make 100% opaque
 */

import sharp from 'sharp';
import { join } from 'path';

const sourcePath = '/Users/DAVIONFOREVER/.cursor/projects/Users-DAVIONFOREVER-Downloads-STOODIOZ-main-2/assets/Stoodioz_App_Icon_True_Transparent-31261441-e0cd-433d-ad82-e913a8fbc091.png';
const outputPath = join(process.cwd(), 'assets/stoodioz-app-icon.png');
const publicIconPath = join(process.cwd(), 'public/icon.png');

console.log('🎨 Processing logo: removing grey/black, keeping only orange and white...\n');

try {
  // Read the image
  const image = sharp(sourcePath);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log(`📝 Original size: ${info.width}x${info.height}`);
  console.log(`📝 Processing ${info.width * info.height} pixels...`);

  // Process each pixel
  const processed = Buffer.alloc(data.length);
  let orangeCount = 0;
  let whiteCount = 0;
  let removedCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Check if pixel is orange (Stoodioz orange: #f97316 or similar)
    const isOrange = r > 200 && g > 100 && g < 150 && b < 100;
    // Check if pixel is white
    const isWhite = r > 240 && g > 240 && b > 240;
    // Check if pixel is grey/black (low saturation, low brightness)
    const isGreyBlack = (r < 200 && g < 200 && b < 200) || 
                        (Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && r < 180);

    if (isOrange) {
      // Keep orange, make fully opaque
      processed[i] = r;
      processed[i + 1] = g;
      processed[i + 2] = b;
      processed[i + 3] = 255; // 100% opaque
      orangeCount++;
    } else if (isWhite) {
      // Keep white, make fully opaque
      processed[i] = 255;
      processed[i + 1] = 255;
      processed[i + 2] = 255;
      processed[i + 3] = 255; // 100% opaque
      whiteCount++;
    } else if (isGreyBlack) {
      // Remove grey/black - make transparent
      processed[i] = 0;
      processed[i + 1] = 0;
      processed[i + 2] = 0;
      processed[i + 3] = 0; // Fully transparent
      removedCount++;
    } else {
      // For other colors, check if they're close to orange or white
      const distToOrange = Math.sqrt((r - 249)**2 + (g - 115)**2 + (b - 22)**2);
      const distToWhite = Math.sqrt((r - 255)**2 + (g - 255)**2 + (b - 255)**2);
      
      if (distToOrange < 50) {
        // Close to orange, keep it
        processed[i] = r;
        processed[i + 1] = g;
        processed[i + 2] = b;
        processed[i + 3] = 255;
        orangeCount++;
      } else if (distToWhite < 30) {
        // Close to white, make pure white
        processed[i] = 255;
        processed[i + 1] = 255;
        processed[i + 2] = 255;
        processed[i + 3] = 255;
        whiteCount++;
      } else {
        // Remove everything else
        processed[i] = 0;
        processed[i + 1] = 0;
        processed[i + 2] = 0;
        processed[i + 3] = 0;
        removedCount++;
      }
    }
  }

  console.log(`   ✅ Kept ${orangeCount} orange pixels`);
  console.log(`   ✅ Kept ${whiteCount} white pixels`);
  console.log(`   🗑️  Removed ${removedCount} grey/black/other pixels`);

  // Create image from processed buffer
  await sharp(processed, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .png()
    .toFile(outputPath);

  // Also copy to public folder
  await sharp(outputPath).toFile(publicIconPath);

  console.log('\n✅ Success! Logo processed:');
  console.log(`   - ${outputPath}`);
  console.log(`   - ${publicIconPath}`);
  console.log('\n💡 Only orange and white remain, 100% opaque, no grey/black!');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
