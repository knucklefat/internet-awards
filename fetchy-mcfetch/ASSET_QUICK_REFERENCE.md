# 🎨 Asset Quick Reference - The Internet Awards

**Quick checklist for designers**

---

## 📊 **SUMMARY**

| Category | Count | Sizes |
|----------|-------|-------|
| **Main Banner** | 1 | 375×200px, 768×300px, 1200×300px |
| **Day Banners** | 6 | 375×150px, 768×250px, 1200×300px |
| **Category Icons** | 24 | 80×80px (1x), 160×160px (2x) |
| **Admin Icon** | 1 | 32×32px (1x), 64×64px (2x) or SVG |
| **Admin Panel Icons** | 6 | 24×24px |
| **Status Indicators** | 2 | 16×16px |
| **TOTAL FILES** | 40-64 | (depending on responsive versions) |

---

## 🎯 **PRIORITY ORDER**

### **Phase 1: Launch Essentials** (11 files)
1. ✅ Main event banner (1 file)
2. ✅ Day 1 banner (1 file)
3. ✅ Day 1 category icons (4 icons × 2 sizes = 8 files)
4. ✅ Admin icon (1 file)

### **Phase 2: Additional Days** (45 files)
- Day 2-6 banners (5 files)
- Day 2-6 category icons (20 icons × 2 sizes = 40 files)

### **Phase 3: Admin Polish** (8 files)
- Admin panel icons (6 files)
- Status indicators (2 files)

---

## 📐 **QUICK SIZE GUIDE**

### **Banners**
```
Main Event Banner:
- Mobile:  375×200px
- Tablet:  768×300px
- Desktop: 1200×300px

Day Banners:
- Mobile:  375×150px
- Tablet:  768×250px
- Desktop: 1200×300px
```

### **Icons**
```
Category Icons:
- Standard: 80×80px
- Retina:   160×160px

Admin Icon:
- Standard: 32×32px
- Retina:   64×64px
- Or SVG (preferred)

Admin Panel Icons:
- Size: 24×24px

Status Indicators:
- Size: 16×16px
```

---

## 🎨 **COLOR PALETTE**

### **Day Themes**
```
Day 1 (Games):        #ff6b6b (Red)
Day 2 (Creators):     #f39c12 (Orange)
Day 3 (Community):    #e94560 (Pink)
Day 4 (Knowledge):    #3282b8 (Blue)
Day 5 (Entertainment):#ea5455 (Red)
Day 6 (Lifestyle):    #00adb5 (Cyan)
```

### **Backgrounds**
```
Dark BG:    #0a0a0a
Card BG:    #1a1a2e
Card Hover: #2a2a3e
```

### **Text**
```
Primary:   #ffffff
Secondary: #b0b0b0
Border:    rgba(255,255,255,0.1)
```

---

## 📝 **NAMING CONVENTION**

```
Banners:
- main-event-banner.png
- day-1-games-banner.png
- day-2-creators-banner.png
- [etc...]

Category Icons:
- icon-best-game.png
- icon-best-game@2x.png
- icon-most-collectable.png
- icon-most-collectable@2x.png
- [etc...]

Admin Icons:
- admin-icon.svg (or .png)
- icon-stats.png
- icon-calendar.png
- icon-export.png
- icon-warning.png
- status-active.png
- status-inactive.png
```

---

## 🏆 **CATEGORY ICONS NEEDED**

### **Day 1: Games & Hobbies**
1. `icon-best-game.png` - Game controller
2. `icon-most-collectable.png` - Trophy/collectible
3. `icon-best-creation.png` - Paintbrush/art
4. `icon-best-story.png` - Book/scroll

### **Day 2: Content Creators**
5. `icon-best-youtuber.png` - Video camera
6. `icon-best-streamer.png` - Microphone
7. `icon-best-artist.png` - Digital tablet
8. `icon-best-musician.png` - Musical notes

### **Day 3: Communities & Culture**
9. `icon-best-subreddit.png` - Community/people
10. `icon-best-meme.png` - Speech bubble
11. `icon-wholesome-moment.png` - Heart
12. `icon-community-effort.png` - Handshake

### **Day 4: Knowledge & Education**
13. `icon-best-explanation.png` - Brain/lightbulb
14. `icon-best-tutorial.png` - Books/checklist
15. `icon-expert-insight.png` - Graduation cap
16. `icon-research-discussion.png` - Microscope

### **Day 5: Entertainment & Media**
17. `icon-movie-discussion.png` - Clapperboard
18. `icon-tv-show.png` - Television
19. `icon-book-discussion.png` - Bookmark
20. `icon-entertainment-news.png` - Megaphone

### **Day 6: Life & Lifestyle**
21. `icon-life-advice.png` - Lightbulb/compass
22. `icon-transformation.png` - Butterfly
23. `icon-food-recipe.png` - Chef's hat
24. `icon-diy-project.png` - Hammer/tools

---

## 📁 **FILE STRUCTURE**

```
src/client/public/images/
├── main-event-banner.png
├── banners/
│   ├── day-1-games-banner.png
│   ├── day-2-creators-banner.png
│   ├── day-3-community-banner.png
│   ├── day-4-knowledge-banner.png
│   ├── day-5-entertainment-banner.png
│   └── day-6-lifestyle-banner.png
└── icons/
    ├── categories/
    │   ├── icon-best-game.png
    │   ├── icon-best-game@2x.png
    │   └── [... all 24 icons in 1x and 2x]
    └── admin/
        ├── admin-icon.svg
        ├── icon-stats.png
        ├── icon-calendar.png
        ├── icon-export.png
        ├── icon-warning.png
        ├── status-active.png
        └── status-inactive.png
```

---

## 💾 **FILE FORMATS & SIZES**

| Asset Type | Format | Max Size | Alpha |
|------------|--------|----------|-------|
| Banners | PNG/WebP | < 500KB | Yes |
| Category Icons | PNG | < 50KB | Yes |
| Admin Icons | SVG/PNG | < 10KB | Yes |
| Status Icons | PNG | < 5KB | Yes |

---

## ✅ **DESIGN CHECKLIST**

### **Before You Start:**
- [ ] Review color palette
- [ ] Check size requirements
- [ ] Understand file naming
- [ ] Note transparent background requirement
- [ ] Review dark background compatibility

### **For Each Icon:**
- [ ] Created at correct size
- [ ] Transparent background
- [ ] Centered with 10% padding
- [ ] Works on dark background (#2a2a3e)
- [ ] 2-3px stroke weight
- [ ] Created @2x version (retina)
- [ ] Optimized file size
- [ ] Correct file name

### **For Each Banner:**
- [ ] Created in 3 sizes (mobile/tablet/desktop)
- [ ] Text in safe area (center 80%)
- [ ] Works on dark background (#0a0a0a)
- [ ] Optimized file size
- [ ] Correct file name
- [ ] Matches day theme color

### **Quality Check:**
- [ ] All assets compressed
- [ ] File sizes within limits
- [ ] Consistent style across all assets
- [ ] Tested on dark background
- [ ] Checked at actual size
- [ ] Named correctly
- [ ] Organized in correct folders

---

## 🚀 **DELIVERY**

### **When Complete:**
1. Organize in folder structure above
2. Compress all files
3. Create ZIP archive
4. Include ASSET_MANIFEST.md
5. Test a few assets in app

### **Testing:**
```bash
# Place assets in:
src/client/public/images/

# Rebuild:
npm run build

# Test:
npm run dev
```

---

## 📞 **QUESTIONS?**

See full specifications in: `ASSET_SPECIFICATIONS.md`

**Key Details:**
- All icons need transparent background
- Icons should work on dark backgrounds
- Banners should be center-focused
- Consistent style across all assets
- File size matters for performance

---

**This is your quick reference. For full details, see ASSET_SPECIFICATIONS.md**

**Last Updated:** January 6, 2026  
**Total Assets Needed:** 40-64 files


