/**
 * Create placeholder PWA icons
 * Quick script to generate simple placeholder icons for testing
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '../public/icons');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Creating placeholder PWA icons...\n');

// Generate simple colored squares with "iSAR" text
async function createPlaceholderIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2196F3;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1976D2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size/10}"/>
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="${size/4}"
        font-weight="bold"
        fill="white">iSAR</text>
    </svg>
  `;

  const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`✅ Created icon-${size}x${size}.png`);
}

// Generate all sizes
Promise.all(sizes.map(size => createPlaceholderIcon(size)))
  .then(() => {
    console.log('\n🎉 All placeholder icons created successfully!');
    console.log(`Location: ${outputDir}\n`);
    console.log('Note: These are placeholder icons. Replace them with your actual logo later.\n');
  })
  .catch(error => {
    console.error('❌ Error creating icons:', error);
    process.exit(1);
  });
