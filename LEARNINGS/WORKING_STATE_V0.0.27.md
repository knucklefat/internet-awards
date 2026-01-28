# Working State Snapshot - v0.0.27

**Date**: December 9, 2024
**Status**: ✅ Fully Functional & Deployed
**Version**: 0.0.27

## 🎯 Current Features

### 1. **Streamlined UX Flow**
- Launch → Category selection (4 categories)
- Pick category → Submit form immediately
- Nominations list hidden behind "Show Nominees" toggle
- Real-time post preview on URL entry

### 2. **Category System**
**Day 1: Games & Hobbies**
- 🎮 Best Game - Digital or Analog
- 🏆 Most Collectable Collectable  
- 🎨 Best Original Creation
- 📖 Best Original Story

### 3. **Visual Elements**
- ✅ Animated GIF banners (category-specific)
- ✅ Custom splash screen configuration
- ✅ Compact category buttons (40% reduced height)
- ✅ "DAY 1 AWARD CATEGORIES" label (8pt)
- ✅ Toast notifications for feedback
- ✅ Skeleton loading states
- ✅ Smooth transitions & animations

### 4. **Post Preview Feature** (NEW in v0.0.27)
- Real-time preview when valid Reddit URL entered
- Shows thumbnail (60x60px) + title
- 500ms debounce for performance
- Skeleton loading with shimmer animation
- Appears between URL field and reason field

### 5. **Nomination Cards**
- Thumbnail previews
- Share buttons
- View Post buttons
- Karma/author/subreddit metadata
- Truncated titles (80 chars max)
- Nomination reason display

### 6. **Data Management**
- Redis sorted sets for nomination storage
- Export to CSV functionality
- Category filtering
- Chronological ordering

## 📁 Key Files & Configuration

### Core Files

#### `/src/client/App.tsx` (1,899 lines)
**Key State:**
```typescript
const [postPreview, setPostPreview] = useState<{ title: string; thumbnail?: string } | null>(null);
const [previewLoading, setPreviewLoading] = useState(false);
const [showNominees, setShowNominees] = useState(false);
```

**Key Functions:**
- `selectCategory()` - Goes directly to submit form
- `loadNominations()` - Fetches from `/api/nominations?category=X`
- `submitNomination()` - Posts to `/api/submit-nomination`
- `renderNominationCard()` - Reusable card component
- Post preview `useEffect` with 500ms debounce

**Flow:**
1. `renderCategorySelect()` - Shows 4 categories with animated banner
2. `renderSubmitForm()` - URL input → Preview → Reason → Submit → Toggle nominees
3. `renderNominationsList()` - Full list view (not currently used in main flow)

#### `/src/server/index.ts` (418 lines)
**Endpoints:**
- `GET /api/preview-post?url=...` - Returns `{ title, thumbnail }` for preview
- `POST /api/submit-nomination` - Saves nomination to Redis
- `GET /api/nominations?category=X` - Retrieves nominations for category
- `GET /api/export-csv?category=X` - Exports to CSV
- `DELETE /api/nominations?category=X` - Clears all nominations

**Redis Structure:**
```typescript
// Sorted set for IDs
zAdd('nominations', { member: `${category}:${postId}`, score: Date.now() })

// Hash for data
hSet(`nomination:${category}:${postId}`, {
  postId, title, author, subreddit, karma, url, 
  category, nominatedBy, nominationReason, thumbnail, fetchedAt
})
```

#### `/src/server/core/post.ts` (17 lines)
**Splash Screen Config:**
```typescript
splash: {
  appDisplayName: 'The Internet Awards',
  heading: '🎮 Day 1: Games & Hobbies',
  description: 'Nominate the best posts...',
  buttonLabel: 'Start Nominating',
  backgroundUri: 'default-splash.png',
  appIconUri: 'default-icon.png',
  entryUri: 'index.html',
}
```

#### `/devvit.json` (37 lines)
```json
{
  "permissions": { "reddit": {}, "redis": true },
  "post": {
    "dir": "dist/client",
    "entrypoints": { "default": { "entry": "index.html" } }
  },
  "media": { "dir": "assets" }
}
```

### Asset Structure

```
/assets/
  - default-icon.png (app icon for splash screen)
  - default-splash.png (splash background)
  - loading.gif

/src/client/public/images/
  - internet-awards.gif (main category selection banner)
  - internet-awards-banner.svg (fallback)
  /banners/
    - best-game.gif ✅
    - most-collectable.gif ✅
    - best-creation.gif ✅
    - best-story.gif ❌ (missing - falls back to SVG)
```

## 🎨 Styling Highlights

### Button Styles
```css
.btn-primary { background: #FF6B35; } /* Orange */
.btn-success { background: #28a745; } /* Green */
.btn-toggle { background: #f8f9fa; border: 2px solid #dee2e6; }
```

### Category Buttons (Compact)
```css
padding: 16px 20px; /* Was 32px 24px */
font-size: 16px; /* Was 20px */
icon: 28px; /* Was 48px */
gap: 12px; /* Was 20px */
```

### Post Preview
```css
.post-preview {
  padding: 12px;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  animation: slideInUp 0.3s;
}
.preview-thumbnail { width: 60px; height: 60px; }
```

## 🔧 Build & Deploy

### Commands
```bash
npm run build    # Builds client + server
npm run deploy   # Builds & uploads to Reddit
devvit upload    # Upload only (after manual build)
```

### Build Process
1. Vite builds `/src/client` → `/dist/client`
2. Vite builds `/src/server` → `/dist/server`
3. Assets copied from `/assets` → `/dist/client` (via media.dir config)
4. WebView assets uploaded (12 files)
5. Version auto-bumped (currently 0.0.27)

### Important Notes
- ⚠️ **Always create a NEW post** after deployment to see changes
- Devvit aggressively caches webview content
- Background images must be in `/assets` folder
- WebView images must be in `/src/client/public/images`

## 🐛 Known Issues & Limitations

### Working Solutions
✅ Redis sorted sets + hashes (not keys/lpush/lrange)
✅ All hash values must be strings
✅ Splash screen requires `splash` object (not `preview`)
✅ Entry point must be `index.html` in `devvit.json`

### Current Limitations
- No duplicate detection (same post can be nominated multiple times)
- No voting/ranking system for nominations
- No moderation tools (delete individual nominations)
- Missing `best-story.gif` banner
- CSV export opens in new tab (not direct download)

## 📊 User Flow

```
┌─────────────────────┐
│  Launch App         │
│  (Splash Screen)    │
└──────────┬──────────┘
           │ Click "Start Nominating"
           ▼
┌─────────────────────┐
│  Category Selection │
│  4 award categories │
│  Animated GIF banner│
└──────────┬──────────┘
           │ Select category
           ▼
┌─────────────────────┐
│  Submit Form        │
│  ├─ URL input       │
│  ├─ Post Preview ✨ │ ← NEW!
│  ├─ Reason (opt)    │
│  ├─ Submit button   │
│  └─ Show Nominees ▼ │
└──────────┬──────────┘
           │ Toggle nominees
           ▼
┌─────────────────────┐
│  Nominees List      │
│  (Inline, hidden)   │
│  ├─ Nomination cards│
│  └─ Export CSV      │
└─────────────────────┘
```

## 🎯 Performance Metrics

- **Preview debounce**: 500ms (prevents excessive API calls)
- **Skeleton loading**: Shows immediately on data fetch
- **Animation duration**: 0.3s (smooth, not sluggish)
- **Toast timeout**: 4000ms (4 seconds)
- **Image fallback**: GIF → PNG → SVG → Placeholder

## 🚀 Next Steps Ideas

### Potential Enhancements
1. Add duplicate detection (check if postId already exists)
2. Add voting/upvote system for nominations
3. Add moderation panel (delete, approve, feature)
4. Add Day 2-6 categories with date-based switching
5. Add search/filter within category
6. Add nomination leaderboard
7. Add social sharing with preview cards
8. Add analytics dashboard
9. Create missing `best-story.gif` banner
10. Add undo/edit nomination functionality

### Code Quality
- Consider extracting nomination card to separate component
- Move API calls to separate service file
- Add TypeScript strict mode
- Add error boundary for React errors
- Add loading states for all async operations

## 📝 Testing Checklist

Before making major changes, verify:
- [ ] Category selection shows all 4 categories
- [ ] Selecting category goes to submit form
- [ ] Entering valid Reddit URL shows preview
- [ ] Preview shows thumbnail + title
- [ ] Submit nomination shows success toast
- [ ] Toggle shows/hides nominees list
- [ ] Export CSV downloads data
- [ ] Back button returns to categories
- [ ] Banners load correctly (GIF → fallback)
- [ ] Mobile responsive (test viewport)

## 🔐 Critical Don'ts

❌ Don't use `redis.keys()` - not supported
❌ Don't use `redis.lpush()/lrange()` - not supported  
❌ Don't store non-string values in Redis hashes
❌ Don't use `preview` object in post creation (use `splash`)
❌ Don't forget to create NEW post after deployment
❌ Don't edit existing posts expecting changes
❌ Don't remove `permissions.redis: true` from devvit.json

## 📚 References

- Devvit Docs: https://developers.reddit.com/docs
- Splash Screens: https://developers.reddit.com/docs/capabilities/server/splash-screen
- Redis API: https://developers.reddit.com/docs/capabilities/redis
- App Dashboard: https://developers.reddit.com/apps/fetchy-mcfetch

---

**Snapshot Created**: Dec 9, 2024
**Last Tested**: v0.0.27 - All features working ✅
**Backup Complete**: Safe to proceed with new features 🎉

