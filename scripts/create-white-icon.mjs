#!/usr/bin/env node
/**
 * Script to create a pure white version of the app icon
 * Removes all grey/black and checkerboard patterns, makes everything pure white
 */

import sharp from 'sharp';
import { existsSync } from 'fs';
import { join } from 'path';

const assetsDir = join(process.cwd(), 'assets');
const publicDir = join(process.cwd(), 'public');
const iconPath = join(assetsDir, 'stoodioz-app-icon.png');
const publicIconPath = join(publicDir, 'icon.png');

console.log('🎨 Creating pure white app icon...\n');

if (!existsSync(iconPath)) {
  console.error(`❌ Source icon not found: ${iconPath}`);
  process.exit(1);
}

try {
  console.log('📝 Processing icon to pure white...');
  
  // Read metadata first
  const metadata = await sharp(iconPath).metadata();
  console.log(`   Original size: ${metadata.width}x${metadata.height}`);
  
  // Create pure white version:
  // 1. Extract alpha channel to preserve shape
  // 2. Create white RGB image
  // 3. Combine white RGB with original alpha
  
  const alphaBuffer = await sharp(iconPath)
    .ensureAlpha()
    .extractChannel(3)
    .toBuffer();
  
  // Create white image with same dimensions
  const whiteBuffer = await sharp({
    create: {
      width: metadata.width,
      height: metadata.height,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })
  .png()
  .toBuffer();
  
  // Combine: white RGB + original alpha
  await sharp(whiteBuffer)
    .ensureAlpha()
    .joinChannel(alphaBuffer)
    .png()
    .toFile(publicIconPath);
  
  // Also update the assets version
  await sharp(publicIconPath).toFile(iconPath);
  
  console.log('\n✅ Success! Created pure white icon:');
  console.log(`   - ${publicIconPath}`);
  console.log(`   - ${iconPath}`);
  console.log('\n💡 The icon is now pure white with no grey/black or checkerboard patterns.');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\n💡 The icon processing failed. You can manually edit the icon:');
  console.error('   1. Open assets/stoodioz-app-icon.png in an image editor');
  console.error('   2. Select all grey/black areas and fill with pure white (#FFFFFF)');
  console.error('   3. Remove any checkerboard patterns');
  console.error('   4. Save and copy to public/icon.png');
  console.error('\n   Or the current icon will work, just update all spinners to use it.');
  process.exit(1);
}
