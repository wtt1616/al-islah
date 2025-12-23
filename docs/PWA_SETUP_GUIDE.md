# iSAR PWA Setup Guide

Complete guide for the Progressive Web App implementation of iSAR.

---

## Table of Contents

1. [What is a PWA?](#what-is-a-pwa)
2. [Features Enabled](#features-enabled)
3. [Installation Complete](#installation-complete)
4. [How to Test](#how-to-test)
5. [How to Install on Mobile](#how-to-install-on-mobile)
6. [Deployment Checklist](#deployment-checklist)
7. [Troubleshooting](#troubleshooting)

---

## What is a PWA?

A **Progressive Web App (PWA)** is a web application that can be installed on mobile devices and desktops, providing an app-like experience without app stores.

### Benefits of PWA

✅ **No App Store Required** - Install directly from browser
✅ **Works Offline** - Cached content available offline
✅ **Fast Loading** - Service workers cache resources
✅ **Push Notifications** - (Can be added in future)
✅ **Home Screen Icon** - Like a native app
✅ **Cross-Platform** - Works on iOS, Android, Desktop
✅ **Auto-Updates** - No manual updates needed
✅ **Smaller Size** - No download from app store

### Limitations

❌ **No Full Offline Functionality** - API calls need internet
❌ **Limited iOS Features** - No push notifications on iOS
❌ **Not in App Stores** - Can't be discovered via stores

---

## Features Enabled

### ✅ Completed PWA Features

1. **Service Worker**
   - Caches static assets (JS, CSS, images)
   - Caches API responses (24-hour TTL)
   - Offline fallback page
   - Auto-updates in background

2. **Web App Manifest**
   - App name, description, colors
   - Icons (8 sizes: 72px to 512px)
   - Home screen shortcuts
   - Standalone display mode

3. **Offline Support**
   - Offline detection page (`/offline`)
   - Cached schedules viewable offline
   - Auto-redirect when back online

4. **Mobile Optimization**
   - Viewport configuration
   - Touch-friendly UI (Bootstrap)
   - Apple-specific meta tags
   - Theme color for status bar

5. **Installation Prompts**
   - Browser install banner (Chrome, Edge)
   - iOS "Add to Home Screen" support
   - Desktop install option

---

## Installation Complete

### Files Created/Modified

#### Created Files:
- ✅ `public/manifest.json` - PWA configuration
- ✅ `public/icons/icon-*.png` - 8 app icons (72px to 512px)
- ✅ `app/offline/page.tsx` - Offline fallback page
- ✅ `scripts/create-placeholder-icons.js` - Icon generator
- ✅ `scripts/generate-pwa-icons.js` - Custom icon generator

#### Modified Files:
- ✅ `next.config.js` - Added PWA configuration with next-pwa
- ✅ `app/layout.tsx` - Added PWA meta tags
- ✅ `.gitignore` - Ignore auto-generated service worker files

#### Dependencies Installed:
- ✅ `next-pwa` - PWA plugin for Next.js
- ✅ `sharp` - Image processing for icons

---

## How to Test

### Step 1: Build the App

PWA features only work in **production mode**, not development.

```bash
# Build production version
npm run build

# Start production server
npm start
```

The app will run on `http://localhost:3000`

---

### Step 2: Test in Browser (Desktop)

#### Google Chrome / Edge

1. **Open** `http://localhost:3000`
2. **Login** with test credentials
3. **Look for install prompt** in address bar (+ icon or ⊕ Install app)
4. **Click Install**
5. **App opens** in standalone window

**Verify Installation:**
- Open `chrome://apps` - iSAR should be listed
- Check Application panel in DevTools:
  - Service Worker should be registered
  - Manifest should show all icons
  - Cache Storage should have cached files

#### Firefox

1. Open `http://localhost:3000`
2. Click menu (☰) > Install
3. Follow prompts

---

### Step 3: Test on Mobile

#### Android (Chrome)

1. **Open** `https://isar.myopensoft.net` on mobile Chrome
2. **Tap menu** (⋮)
3. **Select** "Add to Home screen" or "Install app"
4. **Tap Install**
5. **Icon appears** on home screen
6. **Open from home screen** - launches in fullscreen

**Verify:**
- Opens in fullscreen (no browser UI)
- Status bar color is blue (#2196F3)
- Works offline (try airplane mode)

#### iOS (Safari)

1. **Open** `https://isar.myopensoft.net` in Safari
2. **Tap Share** button (□↑)
3. **Scroll down** and tap "Add to Home Screen"
4. **Edit name** if desired
5. **Tap Add**
6. **Icon appears** on home screen

**Note:** iOS has limitations:
- No automatic install prompt
- No push notifications
- Service worker support limited

---

### Step 4: Test Offline Mode

1. **Install the PWA** (see above)
2. **Open the app** and navigate around
3. **Open DevTools** > Network tab
4. **Check** "Offline" mode
5. **Refresh page** - should show cached content
6. **Visit /offline** - should see offline page
7. **Uncheck** "Offline" - auto-redirects to dashboard

---

## How to Install on Mobile

### Quick Install Guide (for Users)

#### Android

1. Open **Chrome** browser
2. Go to `https://isar.myopensoft.net`
3. Log in
4. Tap **"Install"** when prompted OR
5. Tap menu (⋮) > **"Install app"**
6. Find **iSAR** icon on home screen

#### iPhone/iPad

1. Open **Safari** browser
2. Go to `https://isar.myopensoft.net`
3. Log in
4. Tap **Share** button (bottom center)
5. Scroll and tap **"Add to Home Screen"**
6. Tap **"Add"**
7. Find **iSAR** icon on home screen

---

## Deployment Checklist

Before deploying PWA to production:

### Required:

- [x] ✅ next-pwa installed
- [x] ✅ manifest.json created
- [x] ✅ PWA icons generated (8 sizes)
- [x] ✅ Service worker configured
- [x] ✅ Meta tags added to layout
- [x] ✅ Offline page created
- [ ] ⚠️ Replace placeholder icons with real logo
- [ ] ⚠️ Test on real mobile devices
- [ ] ⚠️ Run Lighthouse audit (score > 90)
- [ ] ⚠️ HTTPS enabled on production (required for PWA)

### Optional but Recommended:

- [ ] Add app screenshots to manifest
- [ ] Configure push notifications
- [ ] Add install prompt UI
- [ ] Create onboarding tutorial
- [ ] Add "Update Available" notification

---

## Replacing Placeholder Icons

Current icons are blue placeholders with "iSAR" text. Replace them:

### Option 1: Automatic Generation

1. **Create** a 1024x1024 PNG logo
2. **Save as** `public/icon-source.png`
3. **Run:**
   ```bash
   node scripts/generate-pwa-icons.js
   ```

### Option 2: Manual Upload

1. Create icons at these sizes: 72, 96, 128, 144, 152, 192, 384, 512
2. Name them: `icon-{size}x{size}.png`
3. Place in `public/icons/`

### Option 3: Online Tools

Use tools like:
- https://www.pwabuilder.com/
- https://realfavicongenerator.net/
- https://favicon.io/

---

## Testing Checklist

Use this checklist to verify PWA functionality:

### Desktop Testing

- [ ] Install prompt appears
- [ ] App installs successfully
- [ ] App opens in standalone window
- [ ] Service worker registers
- [ ] Manifest loads correctly
- [ ] All icons load
- [ ] Offline page works
- [ ] Cache updates on refresh

### Mobile Testing (Android)

- [ ] Install banner appears
- [ ] App installs to home screen
- [ ] Opens in fullscreen
- [ ] Status bar color is blue
- [ ] Navigation works
- [ ] Forms submit correctly
- [ ] Works offline
- [ ] Updates automatically

### Mobile Testing (iOS)

- [ ] "Add to Home Screen" works
- [ ] Icon appears on home screen
- [ ] Opens in fullscreen
- [ ] Status bar color applied
- [ ] Basic functionality works
- [ ] Acceptable performance

### Lighthouse Audit

Run Lighthouse in Chrome DevTools:

```
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Click "Generate report"
```

**Target Scores:**
- PWA: 100 (or close)
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

---

## Troubleshooting

### Issue: Install Prompt Doesn't Appear

**Possible Causes:**
- Not running in production mode (`npm start`, not `npm run dev`)
- Not using HTTPS (required except localhost)
- Service worker not registered
- Manifest.json has errors
- PWA already installed

**Solutions:**
1. Check DevTools > Application > Manifest
2. Verify service worker is registered
3. Clear site data and try again
4. Check console for errors

---

### Issue: Service Worker Not Registering

**Check:**
```javascript
// Browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registrations:', regs);
});
```

**Solutions:**
1. Rebuild: `npm run build`
2. Clear cache: DevTools > Application > Clear storage
3. Check next.config.js has withPWA wrapper
4. Verify no errors in console

---

### Issue: Icons Not Loading

**Check:**
- Files exist in `public/icons/`
- Correct naming: `icon-72x72.png`, etc.
- Valid PNG format
- Correct sizes

**Solutions:**
1. Run `node scripts/create-placeholder-icons.js`
2. Check manifest.json paths
3. Hard refresh (Ctrl+Shift+R)

---

### Issue: Offline Mode Not Working

**Check:**
- Service worker installed
- Cache storage populated
- Correct cache strategy

**Debug:**
```javascript
// Check cache
caches.keys().then(names => console.log(names));
```

---

### Issue: iOS Not Working Properly

**Known Limitations:**
- No install prompt (manual only)
- Limited service worker support
- No push notifications
- Some PWA features disabled

**Solutions:**
- Ensure HTTPS
- Test in Safari specifically
- Keep offline features simple
- Provide manual install instructions

---

### Issue: App Not Updating

**Force Update:**
1. Uninstall PWA
2. Clear browser cache
3. Re-install

**For Users:**
```javascript
// Add to app (optional)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.update());
  });
}
```

---

## Service Worker Caching Strategy

The PWA uses these caching strategies:

| Asset Type | Strategy | TTL |
|------------|----------|-----|
| Fonts | CacheFirst | 1 year |
| Images | StaleWhileRevalidate | 24 hours |
| CSS/JS | StaleWhileRevalidate | 24 hours |
| API calls | NetworkFirst | 24 hours |
| HTML pages | NetworkFirst | 24 hours |

**Strategies Explained:**

- **CacheFirst**: Serve from cache, update in background
- **NetworkFirst**: Try network, fallback to cache
- **StaleWhileRevalidate**: Serve cached, update in background

---

## Advanced Configuration

### Customize Service Worker

Edit `next.config.js` to modify caching:

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // Add custom caching rules here
  ]
});
```

### Add Push Notifications

Future enhancement - requires:
1. Push notification service (Firebase, OneSignal)
2. User permission request
3. Backend notification endpoint
4. Service worker notification handler

---

## Performance Tips

### Optimize for Mobile

1. **Minimize JavaScript**
   - Code splitting
   - Dynamic imports
   - Tree shaking

2. **Optimize Images**
   - Use WebP format
   - Lazy loading
   - Responsive images

3. **Reduce Bundle Size**
   - Remove unused dependencies
   - Use lightweight alternatives
   - Compress assets

### Improve Lighthouse Score

1. **Performance**
   - Minimize main thread work
   - Reduce JavaScript execution time
   - Optimize images

2. **Accessibility**
   - Add alt text to images
   - Proper heading hierarchy
   - Sufficient color contrast

3. **Best Practices**
   - Use HTTPS
   - No console errors
   - Proper error handling

---

## User Guide

### For End Users

**Installing iSAR on Your Phone:**

1. **Open** your phone's browser (Chrome on Android, Safari on iPhone)
2. **Visit** https://isar.myopensoft.net
3. **Log in** with your credentials
4. **Install:**
   - **Android**: Tap "Install" or menu > "Install app"
   - **iPhone**: Tap Share > "Add to Home Screen"
5. **Open** from your home screen

**Benefits:**
- ✅ Quick access from home screen
- ✅ Works offline (view cached schedules)
- ✅ Faster loading
- ✅ Looks like a real app

---

## Comparison: PWA vs Native App

| Feature | PWA | Native App |
|---------|-----|------------|
| Development Time | 1-2 weeks | 9-13 weeks |
| Cost | $2k-$5k | $18k-$32.5k |
| App Store | Not needed | Required |
| Installation | 1 click | Download + install |
| Updates | Instant | Review + download |
| Offline Mode | Limited | Full |
| Push Notifications | Yes (Android) | Yes (both) |
| Performance | Good | Excellent |
| Device Features | Limited | Full access |
| Discoverability | Web search | App store |

**Recommendation:** Start with PWA, build native app later if needed.

---

## Next Steps

### Immediate Actions:

1. **Test locally:**
   ```bash
   npm run build
   npm start
   ```

2. **Test on mobile:**
   - Deploy to production
   - Test install on real devices

3. **Replace icons:**
   - Create proper logo
   - Generate icons
   - Test appearance

### Future Enhancements:

1. **Add Push Notifications**
   - Schedule reminders
   - Assignment notifications
   - System alerts

2. **Improve Offline Mode**
   - Sync queued changes
   - Better offline detection
   - Offline data editing

3. **Add Install Prompt UI**
   - Custom install button
   - Onboarding flow
   - Installation tutorial

4. **Analytics**
   - Track installs
   - Monitor usage
   - Measure engagement

---

## Resources

### Documentation

- **Next.js PWA:** https://github.com/shadowwalker/next-pwa
- **Web.dev PWA Guide:** https://web.dev/progressive-web-apps/
- **MDN PWA:** https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- **PWA Builder:** https://www.pwabuilder.com/

### Testing Tools

- **Lighthouse:** Built into Chrome DevTools
- **PWA Builder:** https://www.pwabuilder.com/
- **What Web Can Do:** https://whatwebcando.today/

### Icon Generators

- **RealFaviconGenerator:** https://realfavicongenerator.net/
- **Favicon.io:** https://favicon.io/
- **App Icon Generator:** https://appicon.co/

---

## Support

### Common Questions

**Q: Do users need to install from app store?**
A: No! Install directly from the website.

**Q: Will it work offline?**
A: Yes, but limited. Cached schedules viewable, but can't fetch new data offline.

**Q: How do users update the app?**
A: Automatic! Updates happen in background when website is updated.

**Q: Can we send push notifications?**
A: Yes on Android, no on iOS (iOS limitation).

**Q: Is this better than a native app?**
A: Faster to deploy, cheaper, but fewer features. Good starting point!

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-19 | Initial PWA implementation |

---

**Document Version:** 1.0
**Last Updated:** 2025-11-19
**Status:** ✅ PWA Ready for Testing

**Next:** Test on production and real devices!
