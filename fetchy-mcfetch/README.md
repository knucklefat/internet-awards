# 🏆 The Internet Awards - Nomination System

**App folder:** `fetchy-mcfetch/`. Run all commands from that folder.

**A Reddit-native nomination and voting platform for community-driven awards**

A comprehensive Devvit app for managing award nominations across multiple categories. Built for The Internet Awards to recognize the best posts in Games & Hobbies, with support for multi-day events and various award types.

---

## 📋 **OVERVIEW**

### **Current Status**
- **Version:** 0.0.88 (Latest)
- **Status:** ✅ Production Ready
- **Live on:** r/internetawards_dev (via CLI install)
- **Last Updated:** January 15, 2026
- **Event:** Single Event - 25 Awards in 6 Categories
- **Installation:** Via CLI (`devvit install`) or Mod Panel (after review approval)

### **What It Does**
The Internet Awards app allows Reddit users to:
- **Nominate posts** across multiple award categories
- **View nominations** with rich post previews and metadata
- **Export data** to CSV for organizers and judges
- **Browse categories** with animated GIF banners
- **Preview posts** in real-time during nomination

---

## 🎯 **FEATURES**

### **Core Functionality**
✅ **Multi-Category System** - Single app supports multiple award categories  
✅ **Automatic Post Fetching** - Extracts title, author, karma, subreddit from Reddit URLs  
✅ **Rich Post Previews** - Thumbnails and metadata display  
✅ **CSV Export** - One-click export of all nominations for judges  
✅ **Redis Data Storage** - Persistent nomination tracking  
✅ **Mobile-Optimized** - Responsive design for Reddit mobile  

### **All 24 Award Categories**

**🎮 Games & Hobbies:**
1. Best Game - Digital or Analog
2. Most Collectable Collectable
3. Best Original Creation
4. Best Original Story

**🎥 Content Creators:**
5. Best YouTuber/Video Creator
6. Best Streamer
7. Best Digital Artist
8. Best Musician/Music Creator

**🌐 Communities & Culture:**
9. Best Subreddit
10. Best Meme/Viral Post
11. Most Wholesome Moment
12. Best Community Effort

**📚 Knowledge & Education:**
13. Best ELI5/Explanation
14. Best Tutorial/How-To
15. Best Expert Insight
16. Best Research/Scientific Discussion

**🎬 Entertainment & Media:**
17. Best Movie Discussion/Review
18. Best TV Show Discussion
19. Best Book Discussion/Review
20. Best Entertainment News/Analysis

**🌟 Life & Lifestyle:**
21. Best Life Advice/Wisdom
22. Best Transformation Story
23. Best Food/Recipe Post
24. Best DIY/Home Project

### **UX Features**
- **Animated Banners** - GIF support for category headers
- **Post Preview** - Real-time preview as you type URL
- **Compact Stats** - Karma, user, subreddit in single row
- **Skeleton Loading** - Smooth loading states
- **Toast Notifications** - User feedback for actions
- **Share Buttons** - Easy sharing to Reddit
- **Title Truncation** - Long titles elegantly handled

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### **Technology Stack**
- **Platform:** Reddit Devvit
- **Frontend:** React 19 + TypeScript
- **Backend:** Express 5
- **Database:** Redis (sorted sets + hashes)
- **Build Tool:** Vite
- **Styling:** Custom CSS with animations

### **Project Structure**
```
fetchy-mcfetch/
├── src/
│   ├── client/              # React webview
│   │   ├── App.tsx         # Main app component
│   │   ├── main.tsx        # Entry point
│   │   └── index.html      # HTML template
│   ├── server/
│   │   ├── index.ts        # Express server & API
│   │   └── core/
│   │       └── post.ts     # Reddit post creation
│   └── shared/
│       └── types/
│           └── api.ts      # TypeScript interfaces
├── assets/                  # Static assets (splash images)
├── devvit.json            # Devvit configuration
└── package.json           # Dependencies
```
(Shared learnings live in repo root: `../LEARNINGS/`.)

### **Redis Data Structure**
```typescript
// Sorted set for chronological ordering
nominations (sorted set)
  → member: "category:postId"
  → score: timestamp

// Hash for each nomination's data
nomination:category:postId (hash)
  → postId: string
  → title: string
  → author: string
  → subreddit: string
  → karma: string
  → url: string
  → category: string
  → nominatedBy: string
  → nominationReason: string
  → fetchedAt: string
  → thumbnail: string
  → permalink: string
```

---

## 🚀 **GETTING STARTED**

### **Prerequisites**
- Node.js 22+ required
- Devvit CLI: `npm install -g devvit`
- Reddit account with developer access

### **Installation**
```bash
# From repo root, go into this app's folder
cd fetchy-mcfetch

# Install dependencies
npm install

# Start development server
npm run dev
```

### **Development Workflow**

**Internal Test Subreddit:** r/internetawards_dev (configured in `devvit.json`)

```bash
# Live development on Reddit (uses r/internetawards_dev by default)
npm run dev

# Build for production
npm run build

# Deploy new version
npm run deploy

# View logs from test subreddit
devvit logs internetawards_dev
```

### **Installing the App**

**Option 1: Via Command Line (Immediate)**
```bash
# Install on any subreddit you moderate
devvit install <subreddit-name> fetchy-mcfetch

# Internal test subreddit
devvit install internetawards_dev fetchy-mcfetch

# Or other subreddits
devvit install your_subreddit fetchy-mcfetch
```

**Option 2: Via Reddit Mod Panel (Requires Review)**
1. Publish the app: `devvit publish fetchy-mcfetch@0.0.55`
2. Wait for Reddit review approval (for apps that create custom posts)
3. Once approved, go to your subreddit's mod tools
4. Navigate to "Installed Apps" → "Add App"
5. Search for "The Internet Awards" and install

### **Creating a New Award Post**
1. Go to your subreddit where the app is installed
2. Click "Mod Tools" → "Create Post" (or the + button)
3. Select "The Internet Awards - Nominations"
4. The app will create a custom post with the nomination interface

---

## 📖 **API ENDPOINTS**

### **GET /api/event/config**
Get event configuration including all categories and groups.

**Response:**
```typescript
{
  success: boolean;
  data?: {
    eventName: string;
    eventDescription: string;
    startDate: string;
    endDate: string;
    categories: Category[];
    categoryGroups: CategoryGroup[];
  };
}
```

### **POST /api/submit-nomination**
Submit a new nomination for an award category.

**Request Body:**
```typescript
{
  postUrl: string;      // Reddit post URL
  category: string;     // Award category ID
  reason?: string;      // Optional nomination reason
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    postId: string;
    title: string;
    // ... other post data
  };
  error?: string;
}
```

### **GET /api/nominations**
Retrieve all nominations, optionally filtered by category.

**Query Parameters:**
- `category` (optional): Filter by award category

**Response:**
```typescript
{
  success: boolean;
  data?: Array<Nomination>;
  error?: string;
}
```

### **GET /api/export-csv**
Export all nominations as CSV for download.

**Response:** CSV file download

### **GET /api/preview-post**
Get preview data for a Reddit post URL (for UI preview).

**Query Parameters:**
- `url`: Reddit post URL

**Response:**
```typescript
{
  success: boolean;
  data?: {
    title: string;
    thumbnail: string;
    permalink: string;
  };
  error?: string;
}
```

### **POST /api/delete**
Clear all nominations (moderator only).

---

## 🎨 **CUSTOMIZATION**

### **Adding New Award Categories**
Edit `src/client/App.tsx`:

```typescript
const AWARD_CATEGORIES = [
  {
    id: 'new-category',
    name: 'New Award Name',
    emoji: '🎯',
    description: 'Description of the award'
  },
  // ... existing categories
];
```

### **Banner Images**
Place images in `src/client/public/images/banners/`:
- Category banners: `{category-id}.gif` (or .png, .svg)
- Main banner: `internet-awards.gif`

**Specifications:**
- **Format:** GIF (animated), PNG, or SVG
- **Dimensions:** 1200x300px recommended
- **File size:** <2MB for GIFs

### **Splash Screen**
Edit `src/server/core/post.ts`:

```typescript
splash: {
  appDisplayName: 'The Internet Awards',
  heading: '🎮 Day 1: Games & Hobbies',
  description: 'Your description here',
  buttonLabel: 'Start Nominating',
  backgroundUri: 'your-image.png',  // From assets/
  appIconUri: 'your-icon.png',
  entryUri: 'index.html'
}
```

---

## 📚 **LEARNINGS & DOCUMENTATION**

### **Shared Learnings (repo root)**
See `../LEARNINGS/` for documentation used by both apps:
- **DEVVIT_REDIS_AND_DEPLOYMENT.md** - Redis patterns and deployment workflow
- **UX_REFINEMENTS_AND_ANIMATED_BANNERS.md** - UI/UX decisions and implementations
- **WORKING_STATE_*.md** - Snapshots of working states

---

## 🐛 **TROUBLESHOOTING**

### **Post Creation Not Working (FIXED in v0.0.55)**
**Issue:** Clicking "Create Post" in mod menu fails or errors  
**Root Causes:**
1. `/internal/menu/post-create` endpoint defined after router mount
2. Endpoint on `app` instead of `router`
3. Wrong response format (needs `navigateTo` key)

**Solution (v0.0.55):**
```typescript
// Endpoint MUST be on router BEFORE app.use(router)
router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const subredditName = context.subredditName;
    const post = await createPost();
    res.json({
      navigateTo: `https://reddit.com/r/${subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: 'Failed to create post' });
  }
});
```

### **Server Crashes/HTTP Not Responding (FIXED in v0.0.54)**
**Issue:** "HTTP server isn't listening anymore" - Server crashes on errors  
**Root Cause:** Unsafe error handling using `'in' operator` on unknown error types

**Solution:**
```typescript
// Safe error message extraction
function getErrorMessage(error: unknown): string {
  try {
    if (error && typeof error === "object" && "message" in error) {
      return String(error.message);
    }
    return String(error);
  } catch (e) {
    return "Unknown error";
  }
}

// Process-level crash prevention
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', getErrorMessage(error));
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', getErrorMessage(reason));
});
```

### **App Not Appearing in Mod Panel**
**Issue:** Can install via CLI but not visible in Reddit mod tools  
**Solution:** App must be **published** for mod panel visibility:
```bash
devvit publish fetchy-mcfetch@0.0.55
```
**Note:** Apps that create custom posts require Reddit review before appearing in mod panel. You'll receive an email when approved.

### **App Not Updating After Deploy**
**Issue:** Changes not visible after `devvit upload`  
**Solution:** Devvit aggressively caches webview content. Create a **new post** to see updates.

### **Nominations Not Saving**
**Issue:** POST to `/api/submit-nomination` returns 500 error  
**Causes:**
1. Redis permissions not set in `devvit.json`
2. Data not converted to strings before storing in hash
3. Invalid Reddit URL format

**Fix:**
```json
// devvit.json
{
  "permissions": {
    "redis": true,
    "reddit": {}
  }
}
```

### **Preview Window Not Loading**
**Issue:** Click on post does nothing  
**Solution:** Check `devvit.json` → `post.entrypoints.default.entry` points to `index.html`

### **Images Not Loading**
**Issue:** Banners or icons show broken image icon  
**Solution:**
1. Place images in `assets/` folder (for splash screen)
2. Place images in `src/client/public/images/` (for webview)
3. Run `npm run build` to copy assets to `dist/`

### **Installation Fails on Specific Subreddit**
**Issue:** App installs fine on most subreddits but consistently fails on one specific subreddit (e.g., r/internetawards_dev)  
**Symptom:** "Installation failed due to app error" but only on that subreddit  
**Diagnosis:** Likely cached/corrupted state on Reddit's side for that specific app+subreddit combination  
**Solutions:**
1. Try installing on a different test subreddit (e.g., r/fetchytest)
2. Contact Reddit Devvit support with the specific subreddit name
3. The app code is likely fine if it works elsewhere

---

## 📊 **USAGE STATS**

### **Deployment History**
- **Total Versions:** 59+
- **Development Period:** November 2024 - January 2026
- **Major Milestones:**
  - v0.0.12: First working nomination system
  - v0.0.14: Redis sorted sets implementation
  - v0.0.27: UX refinements and animated banners
  - v0.0.33: Custom splash screen
  - v0.0.34: Multi-day event system (6-day architecture)
  - v0.0.54: Fixed server crash issues (error handling)
  - v0.0.55: Fixed post creation + Reddit review approval
  - v0.0.58: Switched admin icon from SVG to PNG
  - **v0.0.59: Updated to Devvit 0.12.8** ✨ **CURRENT**

### **Current Version: v0.0.59** ✅
- **Single Event Platform** - Converted from multi-day to unified event
- **24 Award Categories** - All categories in one event
- **Category Groups:** Games, Creators, Communities, Knowledge, Entertainment, Lifestyle
- **Post Creation Working** - Moderators can create nomination posts via mod menu
- **Server Stability Fixed** - Safe error handling and crash prevention
- **Admin Icon Fixed** - Switched from SVG to PNG for proper display
- **Devvit 0.12.8** - Updated to latest platform version
- **Test Subreddit:** r/internetawards_dev

### **Key Metrics** (Design Goals)
- Nominations per category: 20-100 expected
- Load time: <2s for nomination list
- Mobile users: Primary audience (70%+)

---

## 🔜 **FUTURE ENHANCEMENTS**

### **Planned Features**
- [ ] Voting system for community choice awards
- [ ] User profiles with nomination history
- [ ] Admin dashboard for moderation
- [ ] Real-time nomination updates
- [ ] Category-specific rules and guidelines
- [ ] Duplicate post detection
- [ ] Nomination leaderboards

### **Multi-Day Event Support**
- [ ] Day 2-6 category configurations
- [ ] Event scheduling system
- [ ] Historical nomination archive
- [ ] Cross-day analytics

---

## 🤝 **CONTRIBUTING**

### **Making Changes**
1. Test locally with `npm run dev`
2. Document learnings in `../LEARNINGS/`
3. Build with `npm run build`
4. Deploy with `npm run deploy`
5. Create new post to test changes

### **Code Standards**
- TypeScript strict mode
- ESLint + Prettier formatting
- Component-based architecture
- Comprehensive error handling
- Mobile-first responsive design

---

## 📞 **SUPPORT**

### **Common Resources**
- [Devvit Documentation](https://developers.reddit.com/)
- Shared learnings: `../LEARNINGS/`

### **Debugging Checklist**
- [ ] Check `devvit logs` for errors
- [ ] Verify Redis permissions
- [ ] Confirm build output exists
- [ ] Test with new post (not cached)
- [ ] Review browser console for client errors

---

## 📝 **CHANGELOG**

### **v0.0.55** (January 13, 2026) ✅ **CURRENT**
- ✅ **FIXED:** Post creation now working from mod menu
- Moved `/internal/menu/post-create` endpoint to router before mount
- Changed response format to return `navigateTo` for proper Reddit navigation
- Uses global `context.subredditName` for reliable subreddit detection
- All 24 categories displaying correctly

### **v0.0.54** (January 13, 2026)
- ✅ **FIXED:** Server crash prevention
- Added safe `getErrorMessage()` function to prevent "'in' operator" errors
- Added process-level error handlers (`uncaughtException`, `unhandledRejection`)
- Server now stays running even when errors occur

### **v0.0.34** (January 6, 2026)
- Converted to 6-day multi-event platform
- Added day selection UI
- Restructured Redis with day-based keys
- Added admin panel for event management
- Cross-day analytics

### **v0.0.33** (January 6, 2026)
- Updated splash screen copy and images
- Latest asset deployment

### **v0.0.27** (December 2024)
- Animated GIF banner support
- Enhanced nomination cards
- Compact stats layout
- Post preview during submission
- Title truncation for long posts

### **v0.0.14** (November 2024)
- Redis sorted sets + hashes implementation
- Fixed nomination persistence
- Added CSV export

### **v0.0.12** (November 2024)
- Initial working nomination system
- Multi-category support
- Basic UI implementation

---

**Built with ❤️ by Glass House Productions**  
**Platform:** Reddit Devvit | **License:** MIT
