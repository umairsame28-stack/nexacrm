# Install Button Troubleshooting Guide

## Why the Install Button May Not Appear

The install button only appears when the browser's `beforeinstallprompt` event fires. This event is controlled by the browser and only fires when **ALL** PWA installability criteria are met.

---

## ✅ Check These First

### 1. Browser Compatibility
**Supported Browsers**:
- ✅ Chrome/Chromium 90+ (Windows, Mac, Linux, Android)
- ✅ Edge 90+ (Windows, Mac)
- ✅ Samsung Internet 14+ (Android)
- ❌ Firefox Desktop (doesn't support PWA install button)
- ⚠️ Safari 16.4+ (iOS only - uses "Add to Home Screen")

**Current Browser**: Check what browser you're using

### 2. Already Installed?
The install button won't show if the app is already installed.

**Check if installed**:
```
Chrome: chrome://apps (look for NexaCRM)
Edge: edge://apps
```

**If installed, uninstall**:
1. Right-click the app icon
2. Select "Uninstall" or "Remove from Chrome"
3. Refresh the page

### 3. HTTPS or Localhost
PWAs require a secure context:
- ✅ http://localhost:3000 (allowed for development)
- ✅ https://your-domain.com (production)
- ❌ http://192.168.x.x (NOT secure, won't install)

**Current URL**: http://localhost:3000 ✅ GOOD

### 4. Service Worker Registered
**Check in DevTools**:
1. Open DevTools (F12)
2. Go to: Application → Service Workers
3. Should see: `sw.js` with status "activated"

**If not registered**:
- Wait 5-10 seconds and refresh
- Check Console for errors
- Clear site data and reload

### 5. Manifest Valid
**Check in DevTools**:
1. Open DevTools (F12)
2. Go to: Application → Manifest
3. Should see: NexaCRM manifest with icons

**Common issues**:
- 404 error on manifest
- Icons returning 404
- JSON parse errors

---

## 🔍 Debugging Steps

### Step 1: Open Browser Console
```
1. Press F12
2. Go to Console tab
3. Refresh the page (Ctrl+R)
4. Look for [PWA] log messages
```

**Expected logs**:
```
[PWA] Not installed yet, waiting for beforeinstallprompt event
[PWA] Service Worker registered successfully
[PWA] beforeinstallprompt event fired!  ← This means button will show
```

**If you see**:
```
[PWA] Already installed, hiding install button
```
→ Uninstall the app first (see step 2 above)

```
[PWA] beforeinstallprompt event not fired yet
[PWA] Checking PWA criteria...
```
→ Continue to Step 2

### Step 2: Check PWA Criteria in DevTools

**Application Tab → Manifest**:
```
✓ Identity
  ✓ name: "NexaCRM"
  ✓ short_name: "NexaCRM"
  ✓ start_url: "/"
  
✓ Presentation
  ✓ display: "standalone"
  ✓ theme_color: "#6366F1"
  ✓ background_color: "#0B1020"
  
✓ Icons
  ✓ 192x192 icon
  ✓ 512x512 icon
  ✓ maskable icons
```

**Application Tab → Service Workers**:
```
✓ Status: activated
✓ Source: /sw.js
✓ Scope: /
```

### Step 3: Test Manifest Endpoint
Open in browser:
```
http://localhost:3000/manifest.webmanifest
```

**Expected**: JSON response with manifest data
**If 404**: Manifest not generated, restart dev server

### Step 4: Test Icons
Open in browser:
```
http://localhost:3000/icons/icon-192x192.png
http://localhost:3000/icons/icon-512x512.png
http://localhost:3000/favicon.ico
```

**Expected**: PNG images displayed
**If 404**: Icons missing (check ICON_GENERATION_STEPS.md)

### Step 5: Run Verification Script
In Console, paste:
```javascript
fetch('/scripts/verify-pwa.js')
  .then(r => r.text())
  .then(code => eval(code));
```

**Expected output**:
```
🎉 PWA IS FULLY FUNCTIONAL!
✅ Passed: 15+
❌ Failed: 0
```

---

## 🛠️ Common Fixes

### Fix 1: Clear Site Data
Sometimes the browser caches old versions:

```
1. F12 → Application → Storage
2. Click "Clear site data"
3. Close all tabs for localhost:3000
4. Reopen http://localhost:3000
5. Wait 10 seconds
6. Check if button appears
```

### Fix 2: Hard Refresh
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### Fix 3: Restart Dev Server
```powershell
# Stop current server (Ctrl+C in terminal)
npm run dev --workspace=apps/web
```

### Fix 4: Check for Console Errors
Look for red errors in Console that might block PWA:
```
- "Failed to register service worker"
- "Manifest parse error"
- "net::ERR_FAILED" for icons
```

### Fix 5: Wait Longer
The `beforeinstallprompt` event can take 30-60 seconds on first load:
```
1. Open http://localhost:3000
2. Wait 1 full minute
3. Browse to a few pages (dashboard, contacts, etc.)
4. Return to dashboard
5. Check if button appears
```

---

## 🧪 Manual Testing (Bypass Button)

If the install button still doesn't appear, you can manually trigger install:

### Method 1: Browser Install Icon (Chrome/Edge)
```
1. Look at the address bar (right side)
2. You should see a ⊕ icon or "Install" icon
3. Click it to install
```

### Method 2: Browser Menu
```
Chrome:
  Menu (⋮) → "Install NexaCRM..."
  
Edge:
  Menu (⋮) → Apps → "Install NexaCRM"
```

### Method 3: Manual Console Trigger (Advanced)
```javascript
// In Console, paste:
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Install prompt available!');
  e.prompt();
});
```

---

## 📱 Mobile Testing

### Android (Chrome)
```
1. Find your PC's local IP:
   ipconfig → Look for IPv4 (e.g., 192.168.1.6)

2. On phone, visit:
   http://192.168.1.6:3000
   
3. Install:
   Menu (⋮) → "Install app" or "Add to Home screen"
```

⚠️ **Note**: `beforeinstallprompt` works differently on mobile - you may see the menu option without the button appearing.

### iOS (Safari)
```
iOS doesn't use beforeinstallprompt. Install manually:

1. Open Safari (not Chrome!)
2. Visit: http://192.168.1.6:3000
3. Tap Share button (square with arrow)
4. Scroll down: "Add to Home Screen"
5. Confirm
```

---

## ✅ Success Checklist

After following the steps above, you should have:

- [ ] Correct browser (Chrome/Edge, not Firefox desktop)
- [ ] App not already installed (checked chrome://apps)
- [ ] Using http://localhost:3000 (secure context)
- [ ] Service worker activated (Application → Service Workers)
- [ ] Manifest loads without errors (Application → Manifest)
- [ ] All icons return 200 (not 404)
- [ ] Console shows `[PWA]` logs
- [ ] Waited 30-60 seconds
- [ ] Cleared site data and hard refreshed

**If all checked** and button still doesn't appear:
→ Use Method 1 or 2 from "Manual Testing" section above

---

## 🎯 What You Should See

### Before Install
```
Top Nav: [Search] [Install App] [New] [Help] [Theme] [Notifications] [Profile]
                      ↑
              Should appear here
```

### After Install
```
App opens in standalone window:
- No browser address bar
- No browser tabs
- No browser chrome
- Full screen content
- Desktop shortcut created
```

---

## 📊 Browser Install Criteria (Technical)

The `beforeinstallprompt` event fires when:

1. ✅ Web app manifest exists with:
   - `name` or `short_name`
   - `icons` (192px and 512px)
   - `start_url`
   - `display` (standalone, fullscreen, or minimal-ui)

2. ✅ Served over HTTPS or localhost

3. ✅ Service worker registered with fetch event handler

4. ✅ User has engaged with the site (visited at least once)

5. ✅ Not already installed

6. ✅ Browser supports PWA installation

**Our implementation**: ✅ All criteria met

---

## 🚀 Alternative: InstallPrompt Banner

If the button still doesn't work, you can also use the automatic install banner that appears at the bottom of the page:

1. The `InstallPrompt` component is already active
2. It shows a banner at the bottom when installable
3. Look for a banner with "Install NexaCRM" message
4. Click "Install" in the banner

**If banner also doesn't appear**: All troubleshooting above applies.

---

## 🔧 Need More Help?

1. **Share Console Logs**:
   - Open Console (F12)
   - Copy all `[PWA]` messages
   - Look for error messages

2. **Share DevTools Screenshots**:
   - Application → Manifest (full view)
   - Application → Service Workers (status)
   - Console (any errors)

3. **Check These Files Exist**:
   ```powershell
   ls "apps\web\public\icons"
   # Should show: icon-192x192.png, icon-512x512.png, etc.
   
   ls "apps\web\public" | Select-String "favicon.ico"
   # Should show: favicon.ico
   
   ls "apps\web\public\sw.js"
   # Should show: sw.js
   ```

---

**Last Updated**: After PWA implementation
**Next Steps**: Follow debugging steps above in order
