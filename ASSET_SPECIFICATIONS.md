# 🎨 Asset Specifications - The Internet Awards

**Version:** 0.0.34+  
**Date:** January 6, 2026  
**Purpose:** Custom image assets to replace emojis and placeholders

---

## 📋 **COMPLETE ASSET LIST**

### **SUMMARY**
- **Total Assets Needed:** 33
- **Main Banners:** 2
- **Day Banners:** 6
- **Category Icons:** 24
- **Admin Icon:** 1

---

## 🏆 **1. MAIN EVENT BANNER**

### **Asset ID:** `main-event-banner`
**Location:** Day selection screen (top)  
**Current:** `internet-awards.gif`  
**Purpose:** Main event branding, shown when users first open app

### **Specifications:**

| Device | Width | Height | Format | Notes |
|--------|-------|--------|--------|-------|
| **Mobile** | 375px | 200px | PNG/WebP | Primary target |
| **Tablet** | 768px | 300px | PNG/WebP | Scales up from mobile |
| **Desktop** | 1200px | 300px | PNG/WebP | Max width |

**Recommended Format:** PNG with transparency OR WebP  
**File Size Target:** < 500KB  
**Animation:** Static or GIF (< 2MB if animated)

**Design Considerations:**
- Should work on dark background (#0a0a0a)
- Include event name: "The Internet Awards 2026"
- Optional: "6 Days of Celebrating Reddit"
- Center-focused design (safe area 80% width)

**File Name:** `main-event-banner.png` (or `.webp`)  
**Location:** `src/client/public/images/`

---

## 📅 **2. DAY-SPECIFIC BANNERS**

### **Asset IDs:** 6 banners (one per day)

**Current:** 
- Day 1: `internet-awards.gif` (reused)
- Days 2-6: Various `.gif` files

**Purpose:** Day-specific branding on category selection screen

### **Specifications:**

| Device | Width | Height | Format | Notes |
|--------|-------|--------|--------|-------|
| **Mobile** | 375px | 150px | PNG/WebP | Compact for mobile |
| **Tablet** | 768px | 250px | PNG/WebP | Medium size |
| **Desktop** | 1200px | 300px | PNG/WebP | Full width |

**Recommended Format:** PNG with transparency  
**File Size Target:** < 300KB each

### **Required Banners:**

#### **Banner 1: Games & Hobbies**
**File Name:** `day-1-games-banner.png`  
**Theme Colors:** Dark blue (#1a1a2e) / Red accent (#ff6b6b)  
**Keywords:** Gaming, hobbies, controllers, dice, collectibles  
**Status:** Active (Day 1)

#### **Banner 2: Content Creators**
**File Name:** `day-2-creators-banner.png`  
**Theme Colors:** Dark navy (#16213e) / Orange accent (#f39c12)  
**Keywords:** Video, streaming, art, music, creation  
**Status:** Coming soon

#### **Banner 3: Communities & Culture**
**File Name:** `day-3-community-banner.png`  
**Theme Colors:** Deep blue (#0f3460) / Pink accent (#e94560)  
**Keywords:** People, community, memes, wholesome, collaboration  
**Status:** Coming soon

#### **Banner 4: Knowledge & Education**
**File Name:** `day-4-knowledge-banner.png`  
**Theme Colors:** Dark slate (#1b262c) / Blue accent (#3282b8)  
**Keywords:** Books, science, learning, expertise, research  
**Status:** Coming soon

#### **Banner 5: Entertainment & Media**
**File Name:** `day-5-entertainment-banner.png`  
**Theme Colors:** Navy gray (#2d4059) / Red accent (#ea5455)  
**Keywords:** Movies, TV, books, entertainment, pop culture  
**Status:** Coming soon

#### **Banner 6: Life & Lifestyle**
**File Name:** `day-6-lifestyle-banner.png`  
**Theme Colors:** Charcoal (#222831) / Cyan accent (#00adb5)  
**Keywords:** Food, DIY, transformation, advice, lifestyle  
**Status:** Coming soon

**Location:** `src/client/public/images/banners/`

---

## 🏅 **3. CATEGORY ICONS**

### **Asset IDs:** 24 icons (4 per day × 6 days)

**Current:** Emoji (🎮, 🏆, 🎨, etc.)  
**Purpose:** Category identification in selection grid

### **Specifications:**

| Size | Dimensions | Format | Usage |
|------|------------|--------|-------|
| **1x** | 80×80px | PNG | Standard displays |
| **2x** | 160×160px | PNG | Retina displays |
| **3x** | 240×240px | PNG | High-DPI displays |

**Recommended Format:** PNG with transparency  
**File Size Target:** < 50KB per icon  
**Alternative:** SVG (scalable, smaller file size)

**Design Considerations:**
- Transparent background
- Center the icon (leave 10% padding)
- Monochrome or 2-color recommended
- Should work on dark background (#2a2a3e)
- Line weight: 2-3px for clarity
- Rounded corners optional

### **Required Icons:**

#### **Day 1: Games & Hobbies**
1. **Best Game** - `icon-best-game.png`
   - Current: 🎮
   - Suggestion: Game controller, D-pad, joystick
   
2. **Most Collectable** - `icon-most-collectable.png`
   - Current: 🏆
   - Suggestion: Trophy, collectible shelf, rare item
   
3. **Best Creation** - `icon-best-creation.png`
   - Current: 🎨
   - Suggestion: Paintbrush, palette, craft tools
   
4. **Best Story** - `icon-best-story.png`
   - Current: 📖
   - Suggestion: Open book, scroll, quill

#### **Day 2: Content Creators**
5. **Best YouTuber** - `icon-best-youtuber.png`
   - Current: 📹
   - Suggestion: Video camera, play button, film reel
   
6. **Best Streamer** - `icon-best-streamer.png`
   - Current: 🎥
   - Suggestion: Microphone, streaming setup, live icon
   
7. **Best Artist** - `icon-best-artist.png`
   - Current: 🎨
   - Suggestion: Digital tablet, stylus, color wheel
   
8. **Best Musician** - `icon-best-musician.png`
   - Current: 🎵
   - Suggestion: Musical notes, headphones, instruments

#### **Day 3: Communities & Culture**
9. **Best Subreddit** - `icon-best-subreddit.png`
   - Current: 👥
   - Suggestion: Group of people, community circle, upvote
   
10. **Best Meme** - `icon-best-meme.png`
    - Current: 😂
    - Suggestion: Speech bubble, viral arrows, share icon
    
11. **Wholesome Moment** - `icon-wholesome-moment.png`
    - Current: ❤️
    - Suggestion: Heart, helping hands, warm glow
    
12. **Community Effort** - `icon-community-effort.png`
    - Current: 🤝
    - Suggestion: Handshake, puzzle pieces, collaboration

#### **Day 4: Knowledge & Education**
13. **Best Explanation** - `icon-best-explanation.png`
    - Current: 🧠
    - Suggestion: Brain, lightbulb, question mark to exclamation
    
14. **Best Tutorial** - `icon-best-tutorial.png`
    - Current: 📚
    - Suggestion: Stack of books, checklist, step diagram
    
15. **Expert Insight** - `icon-expert-insight.png`
    - Current: 🎓
    - Suggestion: Graduation cap, expert badge, glasses
    
16. **Research Discussion** - `icon-research-discussion.png`
    - Current: 🔬
    - Suggestion: Microscope, test tubes, chart graph

#### **Day 5: Entertainment & Media**
17. **Movie Discussion** - `icon-movie-discussion.png`
    - Current: 🎬
    - Suggestion: Clapperboard, film strip, popcorn
    
18. **TV Show** - `icon-tv-show.png`
    - Current: 📺
    - Suggestion: Television, remote, binge icon
    
19. **Book Discussion** - `icon-book-discussion.png`
    - Current: 📖
    - Suggestion: Bookmark, reading light, page corner
    
20. **Entertainment News** - `icon-entertainment-news.png`
    - Current: 🎪
    - Suggestion: News ticker, megaphone, spotlight

#### **Day 6: Life & Lifestyle**
21. **Life Advice** - `icon-life-advice.png`
    - Current: 💡
    - Suggestion: Lightbulb, compass, guiding star
    
22. **Transformation** - `icon-transformation.png`
    - Current: ✨
    - Suggestion: Butterfly, arrow up, sparkle trail
    
23. **Food/Recipe** - `icon-food-recipe.png`
    - Current: 🍳
    - Suggestion: Chef's hat, cooking pan, recipe card
    
24. **DIY Project** - `icon-diy-project.png`
    - Current: 🔨
    - Suggestion: Hammer, wrench, toolbox

**Location:** `src/client/public/images/icons/`

---

## 🔧 **4. ADMIN ICON**

### **Asset ID:** `admin-icon`

**Current:** 🔧 emoji in floating button  
**Purpose:** Admin panel access button (bottom-right corner)

### **Specifications:**

| Size | Dimensions | Format | Usage |
|------|------------|--------|-------|
| **1x** | 32×32px | PNG | Standard |
| **2x** | 64×64px | PNG | Retina |
| **SVG** | Vector | SVG | Preferred |

**Recommended Format:** SVG (scalable) or PNG with transparency  
**File Size Target:** < 10KB

**Design Considerations:**
- Transparent background
- White or light color (shows on gradient button)
- Simple, recognizable icon
- Suggestions: Gear/cog, settings sliders, admin badge

**File Name:** `admin-icon.svg` or `admin-icon.png`  
**Location:** `src/client/public/images/icons/`

---

## 🎨 **5. ADMIN PANEL REPLACEMENTS**

### **Emoji to Replace in Admin Panel:**

#### **Statistics Section Icons**
| Current | Purpose | Replacement Asset | Size |
|---------|---------|-------------------|------|
| 📊 | Overall Stats | `icon-stats.png` | 24×24px |
| 📅 | Day Management | `icon-calendar.png` | 24×24px |
| 📥 | Data Export | `icon-export.png` | 24×24px |
| ⚠️ | Danger Zone | `icon-warning.png` | 24×24px |

#### **Status Indicators**
| Current | Purpose | Replacement Asset | Size |
|---------|---------|-------------------|------|
| 🟢 | Active status | `status-active.png` | 16×16px |
| ⚪ | Inactive status | `status-inactive.png` | 16×16px |

#### **Stat Cards (keep or replace)**
These appear in the stat values, optional to replace:
- Numbers only (no emoji needed)
- Could add small icons: nominations, users, days, categories

**Recommended:** Keep these as plain numbers for clean design

**Location:** `src/client/public/images/icons/admin/`

---

## 📐 **RESPONSIVE BREAKPOINTS**

### **Image Loading Strategy**

```css
/* Mobile First (default) */
.banner-image {
  content: url('/images/banner-mobile.png');
}

/* Tablet */
@media (min-width: 768px) {
  .banner-image {
    content: url('/images/banner-tablet.png');
  }
}

/* Desktop */
@media (min-width: 1200px) {
  .banner-image {
    content: url('/images/banner-desktop.png');
  }
}
```

### **Retina Display Support**

```css
.category-icon {
  background-image: url('/images/icons/icon-name.png');
  background-size: 80px 80px;
}

@media (-webkit-min-device-pixel-ratio: 2),
       (min-resolution: 192dpi) {
  .category-icon {
    background-image: url('/images/icons/icon-name@2x.png');
  }
}
```

---

## 📁 **FILE ORGANIZATION**

### **Recommended Structure:**

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
├── icons/
│   ├── categories/
│   │   ├── icon-best-game.png
│   │   ├── icon-best-game@2x.png
│   │   ├── icon-most-collectable.png
│   │   ├── icon-most-collectable@2x.png
│   │   └── [... all 24 category icons]
│   ├── admin/
│   │   ├── admin-icon.svg
│   │   ├── icon-stats.png
│   │   ├── icon-calendar.png
│   │   ├── icon-export.png
│   │   ├── icon-warning.png
│   │   ├── status-active.png
│   │   └── status-inactive.png
│   └── README.md
└── README.md
```

---

## 🎯 **DESIGN SPECIFICATIONS**

### **Color Palette**

```css
/* Background Colors */
--bg-dark: #0a0a0a;
--bg-card: #1a1a2e;
--bg-card-hover: #2a2a3e;

/* Accent Colors by Day */
--day1-accent: #ff6b6b;  /* Games - Red */
--day2-accent: #f39c12;  /* Creators - Orange */
--day3-accent: #e94560;  /* Community - Pink */
--day4-accent: #3282b8;  /* Knowledge - Blue */
--day5-accent: #ea5455;  /* Entertainment - Red */
--day6-accent: #00adb5;  /* Lifestyle - Cyan */

/* UI Colors */
--text-primary: #ffffff;
--text-secondary: #b0b0b0;
--border: rgba(255, 255, 255, 0.1);
```

### **Typography**
- **Headers:** SF Pro Display / Roboto
- **Body:** System font stack
- **Sizes:** 12px (small), 14px (body), 16px (large), 24px (headers)

### **Spacing**
- **Icons:** 10% padding around edge
- **Banners:** Safe area 80% width for text
- **Cards:** 20px padding, 12px border-radius

---

## 🔧 **TECHNICAL REQUIREMENTS**

### **Image Formats**

| Format | Use Case | Pros | Cons |
|--------|----------|------|------|
| **PNG** | Icons, banners | Transparency, wide support | Larger file size |
| **WebP** | Banners, photos | Smaller size, good quality | Less browser support |
| **SVG** | Icons, logos | Scalable, tiny file size | Not for photos |
| **GIF** | Animated banners | Animation support | Limited colors |

### **Optimization**

**Before Upload:**
- Compress PNGs with TinyPNG or similar
- Optimize SVGs with SVGO
- Use WebP with PNG fallback
- Test on actual devices

**File Size Targets:**
- Icons: < 50KB
- Banners: < 300KB
- Main banner: < 500KB
- Animated GIF: < 2MB

### **Naming Convention**

```
[type]-[identifier]-[variant].[ext]

Examples:
main-event-banner.png
day-1-games-banner.png
icon-best-game.png
icon-best-game@2x.png
admin-icon.svg
status-active.png
```

---

## ✅ **ASSET CHECKLIST**

### **Priority 1: Core Assets**
- [ ] Main event banner (1)
- [ ] Day 1 banner (1)
- [ ] Day 1 category icons (4 icons × 2 sizes = 8 files)
- [ ] Admin icon (1)

**Total Priority 1:** 11 assets

### **Priority 2: Remaining Days**
- [ ] Day 2-6 banners (5)
- [ ] Day 2-6 category icons (20 icons × 2 sizes = 40 files)

**Total Priority 2:** 45 assets

### **Priority 3: Admin Enhancements**
- [ ] Admin panel icons (6)
- [ ] Status indicators (2)

**Total Priority 3:** 8 assets

### **Grand Total: 64 asset files**
(Including 1x and 2x versions for icons)

---

## 📤 **DELIVERY FORMAT**

When you're ready to provide assets:

### **Folder Structure:**
```
internet-awards-assets/
├── banners/
│   ├── main-event-banner.png
│   ├── day-1-games-banner.png
│   ├── day-2-creators-banner.png
│   └── [etc...]
├── icons/
│   ├── categories/
│   │   ├── icon-best-game.png
│   │   ├── icon-best-game@2x.png
│   │   └── [etc...]
│   └── admin/
│       ├── admin-icon.svg
│       └── [etc...]
└── ASSET_MANIFEST.md  (this file)
```

### **Asset Manifest File:**
Include a text file listing:
- Asset filename
- Dimensions
- File size
- Purpose
- Any special notes

---

## 🎨 **DESIGN TIPS**

### **For Icons:**
1. **Keep it simple** - Icons should be recognizable at small sizes
2. **Consistent style** - Use same line weight and corner radius across all icons
3. **Test small** - View at 40×40px to ensure clarity
4. **Contrast** - Ensure icons work on dark backgrounds
5. **Padding** - Leave breathing room around the icon

### **For Banners:**
1. **Safe area** - Keep important content in center 80%
2. **Text readable** - High contrast for any text
3. **Aspect ratio** - Maintain consistent proportions across sizes
4. **Focal point** - Center the key visual element
5. **File size** - Compress without visible quality loss

### **For Branding:**
1. **Consistency** - Use event colors and style throughout
2. **Hierarchy** - Main banner > Day banners > Icons
3. **Recognition** - Icons should be distinctive but cohesive
4. **Accessibility** - Ensure sufficient color contrast

---

## 🚀 **IMPLEMENTATION PLAN**

### **Phase 1: Core Assets (Launch Day)**
1. Main event banner
2. Day 1 banner  
3. Day 1 category icons (4)
4. Admin icon

### **Phase 2: Additional Days (As Activated)**
1. Day 2-6 banners (add as each day activates)
2. Day 2-6 category icons (add as needed)

### **Phase 3: Polish (Optional)**
1. Admin panel icons
2. Status indicators
3. Loading states
4. Error states

---

## 📞 **QUESTIONS TO CONSIDER**

### **Before Creating Assets:**
1. **Style:** Minimalist, detailed, abstract, or realistic?
2. **Color:** Full color or monochrome/duotone?
3. **Brand:** Existing brand guidelines to follow?
4. **Animation:** Any icons/banners need animation?
5. **SVG:** Prefer SVG for scalability or PNG for control?
6. **Fallbacks:** Need fallback images if assets fail to load?

---

## ✨ **EXAMPLE ASSET SPECS**

### **Main Event Banner**
```
Filename: main-event-banner.png
Dimensions: 1200×300px (desktop)
            768×300px (tablet)
            375×200px (mobile)
Format: PNG-24 with alpha
Color Space: sRGB
File Size: < 500KB
Content: "The Internet Awards 2026" text
         Reddit-themed design elements
         Dark background compatible
```

### **Category Icon Example**
```
Filename: icon-best-game.png (1x)
          icon-best-game@2x.png (2x)
Dimensions: 80×80px (1x), 160×160px (2x)
Format: PNG-24 with alpha
Color Space: sRGB
File Size: < 50KB per file
Content: Game controller icon
         2px stroke weight
         Transparent background
         Centered with 10% padding
```

---

**This specification document serves as your complete guide for creating all necessary assets for The Internet Awards. Use it as a checklist and reference during the design process.**

**Last Updated:** January 6, 2026  
**Version:** 1.0  
**Status:** Ready for Design Phase

