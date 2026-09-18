# NexaCRM PWA Icon Generation Guide

## Overview

NexaCRM requires a set of PWA icons for home screen installation across different platforms. This guide explains how to generate and install these icons.

---

## Required Icons

### Standard Icons
```
/public/icons/icon-192x192.png          # Android, Chrome
/public/icons/icon-512x512.png          # Android, Chrome (high-res)
/public/icons/icon-192x192-maskable.png # Android adaptive icon
/public/icons/icon-512x512-maskable.png # Android adaptive icon (high-res)
/public/icons/apple-touch-icon.png      # iOS (180x180)
/public/favicon.ico                     # Browser favicon
```

---

## Icon Generation Steps

### Option 1: Use HTML Generator (Included)

1. **Open the Icon Generator**:
   ```
   apps/web/scripts/generate-icons.html
   ```
   
2. **Open in Browser**:
   - Double-click the file or
   - Right-click → Open with → Your Browser

3. **Download All Icons**:
   - Click "Download PNG" for each icon size
   - Save to your Downloads folder

4. **Rename Files**:
   ```
   icon-192x192.png            → icon-192x192.png
   icon-512x512.png            → icon-512x512.png
   maskable-192x192.png        → icon-192x192-maskable.png
   maskable-512x512.png        → icon-512x512-maskable.png
   apple-touch-icon.png        → apple-touch-icon.png
   ```

5. **Create icons Directory**:
   ```powershell
   mkdir apps\web\public\icons
   ```

6. **Move Icons**:
   ```powershell
   move Downloads\*.png apps\web\public\icons\
   ```

7. **Generate favicon.ico**:
   - Visit: https://favicon.io/favicon-converter/
   - Upload `icon-192x192.png`
   - Download `favicon.ico`
   - Place in `apps\web\public\favicon.ico`

---

### Option 2: Use Online Tools

#### Recommended Tools

**1. RealFaviconGenerator** (https://realfavicongenerator.net/):
- Upload a 512×512 PNG master icon
- Configure platform-specific designs
- Download complete icon package
- Includes all required sizes

**2. PWA Builder Image Generator** (https://www.pwabuilder.com/imageGenerator):
- Upload master icon
- Generates all PWA icon sizes
- Includes maskable variants
- Download ZIP with all icons

**3. Favicon.io** (https://favicon.io/):
- Generate from image
- Create from text
- Generate from emoji
- Handles multiple sizes

#### Master Icon Specifications

**Recommended Master Icon**:
- Size: 1024×1024px or 512×512px
- Format: PNG with transparency
- Content: NexaCRM "N" logo
- Colors: Indigo (#6366F1) to Violet (#8B5CF6) gradient
- Background: Transparent or gradient background

---

### Option 3: Design Software

#### Adobe Illustrator / Figma / Sketch

**1. Create Master Artboard**:
```
Size: 1024×1024px
Background: Gradient from #6366F1 to #8B5CF6
Logo: White "N" centered
Padding: 20% from edges
```

**2. Export Sizes**:
```
192×192px   (Standard)
512×512px   (Standard)
180×180px   (Apple Touch)
```

**3. Export Maskable Versions**:
```
Same sizes with extra padding (25% from edges)
Ensures logo not cut off by masks
```

---

## Icon Design Guidelines

### NexaCRM Brand Identity

**Logo Element**:
- Letter "N" in bold, modern font
- White color for maximum contrast
- Centered in icon
- Professional, clean design

**Background**:
```css
/* Standard Icons */
background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
border-radius: 20%; /* Rounded square */

/* Maskable Icons */
background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
border-radius: 0; /* No rounding, system handles it */
```

**Safe Zone (Maskable)**:
- Logo must fit within 80% center area
- 10% padding on all sides minimum
- Prevents logo being cut by circular masks

### Size-Specific Considerations

**192×192px**:
- Main Android icon
- Visible on home screen
- Logo should be clearly readable

**512×512px**:
- High-resolution Android
- Splash screens
- More detail possible

**180×180px (Apple)**:
- iOS home screen
- System applies its own mask
- Rounded square on iOS

**Maskable Icons**:
- Extra padding required
- Logo smaller to stay in safe zone
- System applies circular/squircle masks

---

## Verification

### Check Icons Are Correct

1. **Verify Files Exist**:
   ```powershell
   ls apps\web\public\icons\
   ls apps\web\public\favicon.ico
   ```

2. **Check Sizes**:
   - icon-192x192.png: 192×192 pixels
   - icon-512x512.png: 512×512 pixels
   - apple-touch-icon.png: 180×180 pixels
   - Maskable icons: Same sizes

3. **Visual Inspection**:
   - Open each icon in image viewer
   - Verify logo is centered
   - Verify colors are correct
   - Verify no pixelation

### Test in Browser

1. **Start Dev Server**:
   ```powershell
   npm run dev --workspace=apps/web
   ```

2. **Open Chrome DevTools**:
   - F12 → Application tab
   - Manifest section
   - Verify all icons load
   - Check icon preview

3. **Test Installation**:
   - Chrome: Address bar → Install icon
   - Should show NexaCRM icon
   - Should show app name

---

## Troubleshooting

### Icons Not Loading

**Problem**: Icons show broken/missing in manifest
**Solution**:
1. Verify file paths match manifest.ts
2. Check file names (case-sensitive)
3. Clear browser cache
4. Rebuild Next.js: `npm run build --workspace=apps/web`

### Favicon Not Showing

**Problem**: Browser tab shows default icon
**Solution**:
1. Verify favicon.ico in `/public/`
2. Hard reload browser (Ctrl+F5)
3. Clear browser cache
4. Check Next.js metadata in layout.tsx

### Icons Look Pixelated

**Problem**: Icons appear blurry on devices
**Solution**:
1. Regenerate from higher resolution source
2. Ensure PNG export is not compressed
3. Use lossless PNG export
4. Verify correct dimensions

### Maskable Icons Cut Off

**Problem**: Logo edges cut off on Android
**Solution**:
1. Increase padding in maskable icons
2. Ensure logo fits in 80% center safe zone
3. Test with different mask shapes:
   - Circle
   - Squircle
   - Rounded square

---

## Platform-Specific Notes

### Android (Chrome/Edge)

**Display**:
- Uses icon-192x192.png or icon-512x512.png
- Applies adaptive icon mask if maskable provided
- Rounded square or circle based on device

**Installation**:
- "Add to Home Screen" prompt
- Icon shows immediately
- Name: "NexaCRM"

### iOS (Safari)

**Display**:
- Uses apple-touch-icon.png (180×180)
- System applies rounded square mask
- No custom mask control

**Installation**:
- Safari → Share → Add to Home Screen
- Manual process (no prompt)
- Icon shows with iOS styling

### Desktop (Chrome/Edge)

**Display**:
- Uses icon-192x192.png
- Shown in OS application menu
- Taskbar/dock when app running

**Installation**:
- Address bar → Install icon
- Appears in Start Menu (Windows)
- Applications folder (macOS)

---

## Icon Updates

### When to Update Icons

- Rebranding
- Logo changes
- Color scheme updates
- Major version changes

### How to Update

1. Generate new icon set
2. Replace files in `/public/icons/`
3. Update `CACHE_VERSION` in service worker
4. Build and deploy
5. Users get new icons on next install

**Note**: Existing installations keep old icon until reinstalled

---

## Quick Reference

### File Structure
```
apps/web/
├── public/
│   ├── favicon.ico
│   ├── manifest.webmanifest (generated)
│   └── icons/
│       ├── icon-192x192.png
│       ├── icon-512x512.png
│       ├── icon-192x192-maskable.png
│       ├── icon-512x512-maskable.png
│       └── apple-touch-icon.png
└── src/
    └── app/
        ├── manifest.ts (source)
        └── layout.tsx (metadata)
```

### Commands
```powershell
# Create icons directory
mkdir apps\web\public\icons

# Open icon generator
start apps\web\scripts\generate-icons.html

# Verify icons
ls apps\web\public\icons\

# Test locally
npm run dev --workspace=apps/web
```

---

## Resources

- [Web.dev PWA Icons](https://web.dev/add-manifest/#icons)
- [Apple Touch Icon Specs](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Adaptive Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [Maskable Icon Editor](https://maskable.app/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

---

**Status**: Icons pending generation
**Next Step**: Generate and place icons using one of the methods above
