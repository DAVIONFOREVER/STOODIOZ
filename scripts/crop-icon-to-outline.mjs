#!/usr/bin/env node
/**
 * Script to crop an image to its outline/shape
 * Removes transparent/white background and crops to the actual content
 * 
 * Usage: 
 * 1. Place your new icon image in: assets/new-icon-source.png
 * 2. Run: node scripts/crop-icon-to-outline.mjs
 * 3. It will create the cropped version and copy to both locations
 */

import sharp from 'sharp';
import { existsSync } from 'fs';
import { join } from 'path';

const assetsDir = join(process.cwd(), 'assets');
const publicDir = join(process.cwd(), 'public');
const sourcePath = join(assetsDir, 'new-icon-source.png');
const outputPath = join(assetsDir, 'stoodioz-app-icon.png');
const publicIconPath = join(publicDir, 'icon.png');

console.log('🎨 Cropping icon to outline...\n');

if (!existsSync(sourcePath)) {
  console.error(`❌ Source image not found: ${sourcePath}`);
  console.error('\n💡 Steps to fix:');
  console.error('   1. Place your new icon image in: assets/new-icon-source.png');
  console.error('   2. Make sure it has a transparent background or clear outline');
  console.error('   3. Run this script again');
  process.exit(1);
}

try {
  console.log('📝 Processing image...');
  
  // Read metadata
  const metadata = await sharp(sourcePath).metadata();
  console.log(`   Original size: ${metadata.width}x${metadata.height}`);
  
  // Extract alpha channel to find the bounding box of non-transparent content
  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .extractChannel(3) // Alpha channel
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // Find bounding box of non-transparent pixels
  let minX = metadata.width;
  let minY = metadata.height;
  let maxX = 0;
  let maxY = 0;
  
  for (let y = 0; y < metadata.height; y++) {
    for (let x = 0; x < metadata.width; x++) {
      const idx = y * metadata.width + x;
      const alpha = data[idx];
      
      // If pixel is not fully transparent
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  // Add padding (10% on each side)
  const padding = Math.max(20, Math.floor((maxX - minX) * 0.1));
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(metadata.width - 1, maxX + padding);
  maxY = Math.min(metadata.height - 1, maxY + padding);
  
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  
  console.log(`   Content bounds: ${minX},${minY} to ${maxX},${maxY}`);
  console.log(`   Cropped size: ${width}x${height}`);
  
  // Crop to bounding box
  await sharp(sourcePath)
    .extract({
      left: minX,
      top: minY,
      width: width,
      height: height
    })
    .png()
    .toFile(outputPath);
  
  // Also copy to public folder
  await sharp(outputPath).toFile(publicIconPath);
  
  console.log('\n✅ Success! Icon cropped to outline:');
  console.log(`   - ${outputPath}`);
  console.log(`   - ${publicIconPath}`);
  console.log('\n💡 The icon is now cropped to its actual content with padding.');
  console.log('💡 All spinners and favicons will use this new icon.');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\n💡 Make sure:');
  console.error('   - The source image is a PNG with transparency');
  console.error('   - The file is named: assets/new-icon-source.png');
  console.error('   - The image has a clear outline/shape');
  process.exit(1);
}
