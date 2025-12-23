# Testing PWA Locally - Quick Guide

## ✅ Server is Now Running!

Your production server is running at: **http://localhost:3000**

---

## How to Test the PWA

### Step 1: Open in Chrome/Edge

1. Open **Google Chrome** or **Microsoft Edge** browser
2. Go to: **http://localhost:3000**
3. You should see the iSAR login page

### Step 2: Login

Use any test credentials:
- **Email:** `imam1@isar.com`
- **Password:** `admin123`

Or:
- **Email:** `headimam@isar.com`
- **Password:** `admin123`

### Step 3: Check for Install Prompt

After logging in, look for the **install prompt**:

**Option 1: Browser Address Bar**
- Look for a **⊕ Install** icon or **+** button in the address bar (right side)
- Click it to install

**Option 2: Browser Menu**
- Click the **3 dots (⋮)** menu in top-right corner
- Look for **"Install iSAR"** or **"Install app"**
- Click to install

**Option 3: Check manually**
- Press **F12** to open DevTools
- Go to **Application** tab
- Click **Manifest** in the left sidebar
- You should see:
  - ✅ Name: "iSAR - Prayer Schedule Management"
  - ✅ Short name: "iSAR"
  - ✅ Start URL: "/"
  - ✅ 8 icons displayed

### Step 4: Verify Service Worker

While in DevTools (F12):

1. Go to **Application** tab
2. Click **Service Workers** in left sidebar
3. You should see:
   - ✅ Status: "activated and is running"
   - ✅ Source: "sw.js"
   - ✅ Scope: "/"

### Step 5: Test Offline Mode

1. In DevTools, go to **Network** tab
2. Check the **"Offline"** checkbox
3. Refresh the page
4. You should see the offline fallback page (or cached content)
5. Uncheck **"Offline"** to go back online

### Step 6: Install the PWA

1. Click the install prompt
2. Confirm installation
3. The app should open in a new window (standalone mode)
4. Check your desktop or taskbar - you should see an iSAR shortcut

---

## What to Look For

### ✅ Install Prompt Appears
- In address bar or menu
- Shows "Install iSAR" or similar

### ✅ Manifest Loads
- Check DevTools > Application > Manifest
- All 8 icons visible
- Correct app name and colors

### ✅ Service Worker Active
- Check DevTools > Application > Service Workers
- Status: "activated and is running"

### ✅ Offline Support
- Enable offline mode in DevTools
- App still loads (shows cached content or offline page)

### ✅ Standalone Mode
- After install, app opens in its own window
- No browser address bar
- Looks like a native app

---

## Troubleshooting

### Issue: No Install Prompt

**Possible Causes:**
1. Using HTTP instead of HTTPS (localhost is OK)
2. Service worker not registered
3. Already installed (check installed apps)
4. Wrong browser (must use Chrome/Edge)

**Solutions:**
- Hard refresh: **Ctrl + Shift + R**
- Clear site data: DevTools > Application > Storage > Clear site data
- Check console for errors
- Try in incognito/private window

### Issue: Service Worker Not Found

**Check:**
```bash
# Verify files exist
ls public/sw.js
ls public/workbox-*.js
```

**Fix:**
```bash
# Rebuild
npm run build
# Create missing manifest if needed
# (Already done automatically)
# Restart server
npm start
```

### Issue: Manifest Errors

**Check in DevTools:**
- Application > Manifest
- Look for error messages

**Common Issues:**
- Icons not found (check `public/icons/` folder)
- Invalid JSON (check `public/manifest.json`)

---

## Testing Checklist

Use this to verify everything works:

### Desktop Testing

- [ ] Server running on http://localhost:3000
- [ ] Login page loads correctly
- [ ] Can log in successfully
- [ ] Install prompt appears
- [ ] Manifest shows in DevTools
- [ ] Service worker registers
- [ ] 8 icons visible in manifest
- [ ] Can install the PWA
- [ ] Installed app opens in standalone window
- [ ] Offline mode works

### Lighthouse Audit (Optional)

1. Open DevTools (F12)
2. Go to **Lighthouse** tab
3. Select **"Progressive Web App"**
4. Click **"Generate report"**
5. Check score (aim for 90+)

---

## Expected Results

### Manifest Information

```json
{
  "name": "iSAR - Prayer Schedule Management",
  "short_name": "iSAR",
  "theme_color": "#2196F3",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/"
}
```

### Service Worker

```
Source: /sw.js
Status: activated and is running
Scope: /
```

### Icons

8 icons should be visible:
- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512

---

## Screenshots Guide

### Where to Find Install Prompt

**Chrome Address Bar:**
```
┌─────────────────────────────────────┐
│ http://localhost:3000    [⊕ Install]│  ← Click here
└─────────────────────────────────────┘
```

**Chrome Menu:**
```
☰ Menu
├── New tab
├── ...
├── Install iSAR...  ← Click here
└── ...
```

### DevTools - Manifest View

```
Application
├── Manifest
│   ├── Identity
│   │   ├── Name: iSAR - Prayer...
│   │   └── Short name: iSAR
│   ├── Presentation
│   │   ├── Display: standalone
│   │   └── Theme color: #2196F3
│   └── Icons (8)  ← Should see all 8 icons
└── Service Workers
    └── sw.js (activated) ← Should be active
```

---

## Stop the Server

When you're done testing:

```bash
# Press Ctrl+C in the terminal where npm start is running
# Or just close the terminal
```

Or if running in background, kill the process:

```bash
# Find the process
netstat -ano | findstr :3000

# Kill it (replace PID with actual process ID)
taskkill /PID <PID> /F
```

---

## Next Steps After Local Testing

1. **✅ Verify everything works locally**
2. **Deploy to production:**
   ```bash
   # On production server
   git pull origin main
   npm install
   npm run build
   pm2 restart isar
   ```

3. **Test on real mobile devices:**
   - Android (Chrome)
   - iPhone (Safari)

4. **Share user guide:**
   - `docs/PWA_USER_GUIDE.md`

---

## Quick Reference

### Server Commands

```bash
# Start production server
npm start

# Stop server
# Press Ctrl+C

# Rebuild if needed
npm run build
```

### Test URLs

- **App:** http://localhost:3000
- **Service Worker:** http://localhost:3000/sw.js
- **Manifest:** http://localhost:3000/manifest.json

### DevTools Shortcuts

- **F12** - Open DevTools
- **Ctrl+Shift+R** - Hard refresh
- **Ctrl+Shift+C** - Inspect element

---

## Success Criteria

Your PWA is working correctly if:

✅ Install prompt appears
✅ Service worker activates
✅ Manifest loads with all icons
✅ Can install to desktop
✅ Installed app opens standalone
✅ Offline mode shows fallback

**If all checked, your PWA is ready for production! 🎉**

---

**Last Updated:** 2025-11-19
**Status:** Server Running ✅
**URL:** http://localhost:3000
