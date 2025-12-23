# PWA Screenshots

## Required Screenshots

PWA screenshots help users preview your app before installing. You need:

1. **Mobile Screenshot** (narrow form factor)
   - Filename: `screenshot-1.png`
   - Size: 540x720 pixels (or similar portrait ratio)
   - Shows: Mobile view of dashboard or main screen

2. **Desktop Screenshot** (wide form factor)
   - Filename: `screenshot-2.png`
   - Size: 1280x720 pixels (or similar landscape ratio)
   - Shows: Desktop view of schedule management

## How to Create Screenshots

### Method 1: Browser DevTools

1. Open your app in Chrome
2. Press F12 to open DevTools
3. Click device toolbar icon (Ctrl+Shift+M)
4. Set device to iPhone 12 Pro for mobile
5. Navigate to key screens
6. Click the screenshot icon or Ctrl+Shift+P > "Capture screenshot"

### Method 2: Lighthouse

1. Run Lighthouse audit
2. Generate screenshots automatically
3. Edit and save

### Method 3: Actual Devices

1. Open app on mobile device
2. Take screenshots of key screens
3. Transfer to computer
4. Resize if needed

## Best Practices

- Show actual app content, not placeholders
- Use real data (but anonymize if needed)
- Highlight key features
- Good lighting and clarity
- No personal/sensitive information

## Current Status

⚠️ **Screenshots not yet created**

For now, the manifest.json has placeholder screenshot entries.
Create actual screenshots before production deployment.

## Temporary Solution

You can temporarily remove the screenshots section from manifest.json:

```json
// Remove or comment out this section in public/manifest.json
"screenshots": [...]
```

Screenshots are optional for PWA but recommended for better user experience.
