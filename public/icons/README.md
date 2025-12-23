# PWA Icons Directory

## Required Icons

This directory should contain the following icon files for the PWA:

- `icon-72x72.png` (72x72 pixels)
- `icon-96x96.png` (96x96 pixels)
- `icon-128x128.png` (128x128 pixels)
- `icon-144x144.png` (144x144 pixels)
- `icon-152x152.png` (152x152 pixels)
- `icon-192x192.png` (192x192 pixels)
- `icon-384x384.png` (384x384 pixels)
- `icon-512x512.png` (512x512 pixels)

## How to Generate Icons

### Option 1: Automatic Generation (Recommended)

1. Install sharp:
   ```bash
   npm install --save-dev sharp
   ```

2. Create a source image (1024x1024 PNG) and save it as:
   ```
   public/icon-source.png
   ```

3. Run the generator:
   ```bash
   node scripts/generate-pwa-icons.js
   ```

### Option 2: Online Tools

Use online icon generators:
- **PWA Asset Generator**: https://www.pwabuilder.com/
- **RealFaviconGenerator**: https://realfavicongenerator.net/
- **Favicon.io**: https://favicon.io/

Upload your logo and download the generated icons.

### Option 3: Manual Creation

Use image editing software (Photoshop, GIMP, etc.) to resize your logo to each size listed above.

## Design Guidelines

### Icon Design Tips

1. **Simple Design**: Icons should be simple and recognizable at small sizes
2. **High Contrast**: Use colors that stand out against white and colored backgrounds
3. **No Text**: Avoid text in icons (too small to read)
4. **Safe Zone**: Keep important content within 80% of the icon area
5. **Transparent Background**: Use PNG with transparency for best results

### Recommended Source Image

- **Format**: PNG
- **Size**: 1024x1024 pixels minimum
- **Background**: Transparent or solid color
- **Content**: Centered logo/symbol

## Quick Placeholder Icons

For testing purposes, you can create simple placeholder icons:

### Using ImageMagick

```bash
# Generate all sizes at once
for size in 72 96 128 144 152 192 384 512; do
  convert -size ${size}x${size} xc:#2196F3 \
    -gravity center \
    -pointsize $((size/3)) \
    -fill white \
    -annotate +0+0 "iSAR" \
    public/icons/icon-${size}x${size}.png
done
```

### Using Node.js (Canvas)

```javascript
const { createCanvas } = require('canvas');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#2196F3';
  ctx.fillRect(0, 0, size, size);

  // Text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size/3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('iSAR', size/2, size/2);

  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/icons/icon-${size}x${size}.png`, buffer);
  console.log(`Generated icon-${size}x${size}.png`);
});
```

## Current Status

⚠️ **Icons not yet generated**

Please generate icons using one of the methods above before deploying the PWA.

## Testing Icons

After generating icons, test them by:

1. Build the app: `npm run build`
2. Run production server: `npm start`
3. Open DevTools > Application > Manifest
4. Verify all icons are loaded correctly
