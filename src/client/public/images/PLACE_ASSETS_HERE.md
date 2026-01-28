# 📁 Asset Placement Guide

**Put your custom assets in this folder structure**

---

## 🎯 **WHERE TO PUT ASSETS**

### **Main Event Banner**
📂 **Location:** `/images/` (this folder)  
📝 **Filename:** `main-event-banner.png` (or `.webp`)  
📐 **Size:** 1200×300px (desktop), 768×300px (tablet), 375×200px (mobile)

**Example:**
```
images/
└── main-event-banner.png
```

---

### **Day Banners**
📂 **Location:** `/images/banners/`  
📝 **Filenames:**
- `day-1-games-banner.png`
- `day-2-creators-banner.png`
- `day-3-community-banner.png`
- `day-4-knowledge-banner.png`
- `day-5-entertainment-banner.png`
- `day-6-lifestyle-banner.png`

📐 **Size:** 1200×300px (desktop), 768×250px (tablet), 375×150px (mobile)

**Example:**
```
images/banners/
├── day-1-games-banner.png
├── day-2-creators-banner.png
└── [etc...]
```

---

### **Category Icons**
📂 **Location:** `/images/icons/categories/`  
📝 **Filenames:** (24 icons × 2 sizes = 48 files)
- `icon-best-game.png` + `icon-best-game@2x.png`
- `icon-most-collectable.png` + `icon-most-collectable@2x.png`
- `icon-best-creation.png` + `icon-best-creation@2x.png`
- [... all 24 categories]

📐 **Size:** 80×80px (standard), 160×160px (@2x retina)

**Example:**
```
images/icons/categories/
├── icon-best-game.png
├── icon-best-game@2x.png
├── icon-most-collectable.png
├── icon-most-collectable@2x.png
└── [etc...]
```

---

### **Admin Icons**
📂 **Location:** `/images/icons/admin/`  
📝 **Filenames:**
- `admin-icon.svg` (or `.png`) - Main admin button icon
- `icon-stats.png` - Statistics section
- `icon-calendar.png` - Day management
- `icon-export.png` - Export section
- `icon-warning.png` - Danger zone
- `status-active.png` - Active status indicator
- `status-inactive.png` - Inactive status indicator

📐 **Sizes:**
- Admin icon: 32×32px (1x), 64×64px (2x) or SVG
- Section icons: 24×24px
- Status icons: 16×16px

**Example:**
```
images/icons/admin/
├── admin-icon.svg
├── icon-stats.png
├── icon-calendar.png
├── icon-export.png
├── icon-warning.png
├── status-active.png
└── status-inactive.png
```

---

## 📋 **COMPLETE STRUCTURE**

Here's what your final structure should look like:

```
src/client/public/images/
├── main-event-banner.png           ← Main banner
│
├── banners/                         ← Day-specific banners
│   ├── day-1-games-banner.png
│   ├── day-2-creators-banner.png
│   ├── day-3-community-banner.png
│   ├── day-4-knowledge-banner.png
│   ├── day-5-entertainment-banner.png
│   └── day-6-lifestyle-banner.png
│
└── icons/
    ├── categories/                  ← Category award icons
    │   ├── icon-best-game.png
    │   ├── icon-best-game@2x.png
    │   ├── icon-most-collectable.png
    │   ├── icon-most-collectable@2x.png
    │   ├── icon-best-creation.png
    │   ├── icon-best-creation@2x.png
    │   ├── icon-best-story.png
    │   ├── icon-best-story@2x.png
    │   └── [... 20 more icons for Days 2-6]
    │
    └── admin/                       ← Admin panel icons
        ├── admin-icon.svg
        ├── icon-stats.png
        ├── icon-calendar.png
        ├── icon-export.png
        ├── icon-warning.png
        ├── status-active.png
        └── status-inactive.png
```

---

## 🚀 **AFTER ADDING ASSETS**

### **Step 1: Place Assets**
Copy your files into the correct folders above

### **Step 2: Rebuild**
```bash
cd "/Users/dante/devvit/GLASS HOUSE PRODUCTIONS/internet-awards"
npm run build
```

### **Step 3: Test Locally**
```bash
npm run dev
```

### **Step 4: Deploy**
```bash
npm run deploy
```

### **Step 5: Create New Post**
Create a new Reddit post to see the changes (Devvit caches old posts)

---

## ✅ **CHECKLIST**

Before deploying, verify:
- [ ] All files in correct folders
- [ ] File names match exactly (case-sensitive)
- [ ] Images optimized (compressed)
- [ ] File sizes within limits
- [ ] Transparent backgrounds (icons)
- [ ] Works on dark backgrounds
- [ ] Build completes successfully

---

## 📏 **QUICK SIZE REFERENCE**

| Asset Type | Standard | Retina | Desktop |
|-----------|----------|--------|---------|
| Main Banner | 375×200px | 768×300px | 1200×300px |
| Day Banners | 375×150px | 768×250px | 1200×300px |
| Category Icons | 80×80px | 160×160px | - |
| Admin Icon | 32×32px | 64×64px | - |
| Admin Panel Icons | 24×24px | - | - |
| Status Icons | 16×16px | - | - |

---

## 🎨 **FILE FORMATS**

- **Banners:** PNG or WebP (< 500KB)
- **Icons:** PNG with transparency (< 50KB)
- **Admin Icon:** SVG preferred, or PNG (< 10KB)
- **All must have transparent backgrounds** (except banners)

---

## 💡 **TIPS**

1. **Start with Day 1 assets** - Get those working first
2. **Test one at a time** - Easier to debug
3. **Keep backups** - Save originals before optimizing
4. **Check on mobile** - Most users will see mobile version
5. **Dark backgrounds** - All assets display on dark BG

---

## 🆘 **TROUBLESHOOTING**

**Images not showing?**
- Check file names match exactly (case-sensitive)
- Check files in correct folders
- Run `npm run build` again
- Create NEW post (don't refresh old one)

**Build errors?**
- Check file sizes aren't too large
- Ensure valid PNG/WebP/SVG format
- Remove special characters from filenames

---

**For full specifications, see:**
- `ASSET_SPECIFICATIONS.md` (detailed specs)
- `ASSET_QUICK_REFERENCE.md` (quick checklist)

**Current folder:** `/Users/dante/devvit/GLASS HOUSE PRODUCTIONS/internet-awards/src/client/public/images/`


