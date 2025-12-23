/**
 * PWA Icon Generator Script
 *
 * This script helps you generate PWA icons from a source image.
 *
 * Prerequisites:
 * 1. Install sharp: npm install --save-dev sharp
 * 2. Prepare a source image (1024x1024 PNG recommended)
 * 3. Place it at: public/icon-source.png
 *
 * Usage:
 * node scripts/generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('PWA Icon Generator');
console.log('==================\n');

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.log('❌ Sharp is not installed.');
  console.log('\nTo generate icons automatically, install sharp:');
  console.log('   npm install --save-dev sharp\n');
  console.log('Then run this script again.');
  console.log('\nAlternatively, manually create these icons:');
  sizes.forEach(size => {
    console.log(`   - icon-${size}x${size}.png (${size}x${size} pixels)`);
  });
  console.log('\nPlace them in: public/icons/\n');
  process.exit(1);
}

const sourceImage = path.join(__dirname, '../public/icon-source.png');
const outputDir = path.join(__dirname, '../public/icons');

// Check if source image exists
if (!fs.existsSync(sourceImage)) {
  console.log('❌ Source image not found.');
  console.log(`\nPlease create a source image at: ${sourceImage}`);
  console.log('Recommended size: 1024x1024 pixels\n');
  console.log('For now, create placeholder icons manually or:');
  console.log('1. Create a 1024x1024 PNG image');
  console.log('2. Save it as: public/icon-source.png');
  console.log('3. Run this script again\n');
  process.exit(1);
}

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Generating icons...\n');

// Generate each size
Promise.all(
  sizes.map(size =>
    sharp(sourceImage)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
      .then(() => {
        console.log(`✅ Generated icon-${size}x${size}.png`);
      })
  )
)
  .then(() => {
    console.log('\n🎉 All icons generated successfully!');
    console.log(`Output directory: ${outputDir}\n`);
  })
  .catch(error => {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  });
