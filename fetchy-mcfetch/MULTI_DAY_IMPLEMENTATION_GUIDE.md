# 🎯 The Internet Awards - Multi-Day Implementation Guide

**Complete guide for deploying and managing the 6-day event system**

---

## 📋 **OVERVIEW**

The Internet Awards has been upgraded to a unified multi-day event system that supports 6 days of awards across different themes. This guide covers everything you need to know to deploy, manage, and run the event.

---

## 🏗️ **ARCHITECTURE SUMMARY**

### **What Changed**

#### **Before** (Single Day System)
- Hard-coded categories for Day 1 only
- No day selection
- Simple category → nomination flow
- Limited scalability

#### **After** (Multi-Day System)
- 6 configurable event days
- Day selection → Category selection → Nomination flow
- Unified data structure with day prefixes
- Cross-day analytics and export
- Admin panel for management
- Easy to extend for future events

### **Technical Architecture**

```
User Flow:
┌─────────────────┐
│  Day Selection  │ → User sees all 6 days (active ones clickable)
└────────┬────────┘
         ↓
┌─────────────────┐
│ Category Select │ → Shows 4-6 categories for chosen day
└────────┬────────┘
         ↓
┌─────────────────┐
│ Nomination Form │ → Submit with post URL + optional reason
└────────┬────────┘
         ↓
┌─────────────────┐
│  View Nominees  │ → Browse nominations for that category
└─────────────────┘

Admin Access:
Type "admin" anywhere or click 🔧 button → Full admin panel
```

### **Data Structure**

```typescript
Redis Keys:
- nominations:all → Sorted set of ALL nominations across days
- nominations:{dayId} → Sorted set per day (e.g., nominations:day-1-games)
- nomination:{dayId}:{category}:{postId} → Hash with nomination details

Example:
- nominations:day-1-games (sorted set)
- nomination:day-1-games:day1-best-game:abc123 (hash)

Hash Contents:
{
  dayId: "day-1-games",
  category: "day1-best-game",
  postId: "abc123",
  title: "Amazing Post Title",
  author: "username",
  subreddit: "gaming",
  karma: "15234",
  url: "https://reddit.com/...",
  nominatedBy: "nominator_username",
  nominationReason: "This is incredible because...",
  fetchedAt: "1704567890123",
  thumbnail: "https://...",
  permalink: "/r/gaming/comments/..."
}
```

---

## 🚀 **DEPLOYMENT WORKFLOW**

### **Prerequisites**
- Node.js 22+ installed
- Devvit CLI: `npm install -g devvit`
- Reddit developer account with app access
- Subreddit with mod permissions

### **Initial Deployment (First Time)**

```bash
# 1. Navigate to project
cd "/Users/dante/devvit/GLASS HOUSE PRODUCTIONS/internet-awards"

# 2. Install dependencies (if not already done)
npm install

# 3. Build the app
npm run build

# 4. Deploy to Devvit
npm run deploy

# 5. Install to your subreddit
devvit install [your-subreddit-name]

# 6. Create the award post
# Go to your subreddit → Mod Tools → Create Post
# Select "The Internet Awards - Nominations"
```

### **Updating After Changes**

```bash
# 1. Make your changes to code
# 2. Build
npm run build

# 3. Deploy (auto-bumps version)
npm run deploy

# 4. Create a NEW post to see changes
# (Devvit caches heavily - always create new post for testing)
```

### **Version Management**

The app auto-increments version on each `npm run deploy`:
- v0.0.33 → v0.0.34 → v0.0.35, etc.

Track major changes in `LEARNINGS/` folder.

---

## 📅 **EVENT DAY MANAGEMENT**

### **Activating Days**

Days are controlled in the configuration file:

**File:** `src/shared/config/event-config.ts`

```typescript
{
  id: 'day-2-creators',
  name: 'Day 2: Content Creators',
  // ... other properties
  active: false,  // ← Change to true to activate
  categories: [...]
}
```

**To Activate a New Day:**

1. Edit `src/shared/config/event-config.ts`
2. Find the day you want to activate
3. Change `active: false` to `active: true`
4. Run `npm run build && npm run deploy`
5. Create a NEW post (or users refresh existing post)

### **Event Schedule**

```
Day 1: January 6-7   → Games & Hobbies
Day 2: January 7-8   → Content Creators
Day 3: January 8-9   → Communities & Culture
Day 4: January 9-10  → Knowledge & Education
Day 5: January 10-11 → Entertainment & Media
Day 6: January 11-12 → Life & Lifestyle
```

**Recommended Activation Strategy:**
- **Option A - Manual**: Activate each day manually when ready
- **Option B - Scheduled**: Activate all on Day 1, let users see "Coming Soon" for future days
- **Option C - Gradual**: Activate 1 day ahead to build anticipation

---

## 🎨 **CUSTOMIZATION**

### **Adding/Editing Categories**

**File:** `src/shared/config/event-config.ts`

```typescript
categories: [
  {
    id: 'day1-best-game',           // Unique ID (include day prefix)
    dayId: 'day-1-games',           // Parent day ID
    name: 'Best Game - Digital or Analog',
    emoji: '🎮',
    description: 'The most engaging, innovative, or entertaining game'
  },
  // Add more categories here
]
```

**Rules:**
- Category ID must be unique across ALL days
- Include day prefix in ID (e.g., `day1-`, `day2-`)
- Emoji is optional but recommended
- Keep descriptions concise (under 100 chars)

### **Changing Day Themes/Colors**

```typescript
{
  id: 'day-1-games',
  name: 'Day 1: Games & Hobbies',
  theme: 'Games & Hobbies',        // Short theme name
  backgroundColor: '#1a1a2e',      // Card background
  accentColor: '#ff6b6b',          // Border/highlights
  bannerImage: 'internet-awards.gif',  // From assets/
}
```

### **Banner Images**

**Location:** `src/client/public/images/banners/`

**Naming Convention:**
- Main banner: `internet-awards.gif`
- Day banners: `day-{number}-{theme}.gif`

**Specifications:**
- Format: GIF (animated), PNG, or SVG
- Dimensions: 1200x300px recommended
- File size: <2MB for GIFs
- Fallback: Text banner renders if image fails

**Adding New Banners:**
1. Place image in `src/client/public/images/banners/`
2. Update `bannerImage` in day config
3. Rebuild and deploy

---

## 🛠️ **ADMIN PANEL**

### **Accessing the Admin Panel**

**Method 1:** Type `admin` anywhere in the app  
**Method 2:** Click the floating 🔧 button (bottom-right)

### **Admin Features**

#### **1. Event Statistics Dashboard**
- Total nominations across all days
- Unique nominators count
- Active days count
- Total categories

#### **2. Day Management**
View all 6 days with:
- Active/inactive status
- Date ranges
- Category counts
- Per-day nomination stats
- Activate/deactivate buttons (info only - requires code change)

#### **3. Data Export**
- Export all nominations (CSV)
- Export per-day nominations
- Export per-category (via query params)

#### **4. Danger Zone**
- Delete all nominations (requires confirmation key)
- Confirmation key: `DELETE_INTERNET_AWARDS_2026`
- **WARNING:** This is permanent and irreversible!

### **Admin Panel Technical Notes**

**Security:**
- Currently accessible to all users (MVP)
- For production, add role checking:
  ```typescript
  if (context.userRole !== 'moderator') {
    return <div>Unauthorized</div>;
  }
  ```
- Delete operation requires confirmation key

**Current Limitations:**
- Day activation toggle shows info message (requires config file edit)
- No real-time updates (refresh admin panel to see latest stats)
- Stats calculated on-demand (can be slow with many nominations)

---

## 📊 **DATA MANAGEMENT**

### **Viewing Nominations**

**Via App:**
- Select day → Select category → Click "Show Nominees"
- Admin panel → Stats section

**Via Redis (Direct Access):**
```bash
# Get all nomination keys for a day
devvit logs [subreddit]
# In logs, you'll see Redis operations

# Count nominations per day
# nominations:day-1-games → Check sorted set size
```

### **Exporting Data**

**Method 1: Through App**
- Go to nomination list
- Click "⬇️ Export CSV"
- Filters by current day/category

**Method 2: Through Admin Panel**
- Click "📊 Export All Nominations" → Everything
- Click "📥 Export Day X" → Single day
- Files named: `nominations-{scope}-{timestamp}.csv`

**CSV Format:**
```csv
Day ID,Category,Post Title,Author,Subreddit,Karma,URL,Nominated By,Reason,Timestamp
day-1-games,day1-best-game,"Amazing Post",user123,gaming,15234,https://...,nominator,"Great because...",2026-01-06T...
```

### **Backing Up Data**

**Before Major Changes:**
1. Open admin panel
2. Export all nominations
3. Save CSV to safe location
4. Proceed with changes

**Automated Backup (Optional):**
Set up a cron job to hit `/api/export-csv` daily and save the result.

### **Clearing Data**

**Clear Specific Day:**
```typescript
// Use admin panel delete with dayId filter
// Or manually via Redis if you have access
```

**Clear All Data:**
1. Open admin panel
2. Scroll to Danger Zone
3. Click "Delete All Nominations"
4. Type confirmation key: `DELETE_INTERNET_AWARDS_2026`
5. Confirm dialog
6. All nominations deleted

---

## 🧪 **TESTING CHECKLIST**

### **Before Event Launch**

- [ ] All 6 days configured with correct categories
- [ ] Day 1 activated, Days 2-6 inactive
- [ ] Banner images uploaded and displaying
- [ ] Test nomination submission (all fields)
- [ ] Verify post preview works
- [ ] Check nomination display
- [ ] Test CSV export
- [ ] Admin panel accessible
- [ ] Event stats calculating correctly
- [ ] Mobile responsive design working

### **During Event (Daily)**

- [ ] Activate next day's categories
- [ ] Verify previous days still accessible
- [ ] Monitor nomination counts
- [ ] Export daily backup
- [ ] Check for spam/duplicate nominations
- [ ] Respond to user issues

### **Post-Event**

- [ ] Export final CSV of all nominations
- [ ] Generate event statistics report
- [ ] Archive data
- [ ] Deactivate all days OR
- [ ] Keep as historical reference

---

## 🐛 **TROUBLESHOOTING**

### **Common Issues**

#### **"App not updating after deploy"**
**Cause:** Devvit aggressive caching  
**Solution:** Create a NEW post, don't reuse old one

#### **"Nominations not saving"**
**Causes:**
1. Redis permissions not set → Check `devvit.json`
2. Day not active → Verify in config file
3. Invalid Reddit URL → Check format

**Debug:**
```bash
devvit logs [subreddit]
# Look for errors in server logs
```

#### **"Day X categories not showing"**
**Cause:** Day not activated  
**Solution:** Edit `event-config.ts`, set `active: true`, rebuild, deploy

#### **"Images not loading"**
**Causes:**
1. Wrong path → Check `src/client/public/images/banners/`
2. File not copied → Run `npm run build`
3. Large file size → Compress image

#### **"Admin panel won't open"**
**Solution:**
- Try typing "admin" (lowercase, all at once)
- Try clicking 🔧 button
- Check browser console for errors

### **Performance Issues**

**Slow nomination loading:**
- Too many nominations (500+) → Implement pagination
- Large thumbnails → Lazy load images
- Complex queries → Add Redis indexing

**Admin panel slow:**
- Stats calculation intensive → Cache results
- Many days active → Filter by active only

---

## 📈 **SCALING RECOMMENDATIONS**

### **For Large Events (1000+ Nominations)**

1. **Add Pagination**
```typescript
// Update API to support offset/limit
GET /api/nominations?dayId=...&limit=50&offset=0
```

2. **Cache Statistics**
```typescript
// Cache event stats for 5 minutes
const cachedStats = await redis.get('cached:event:stats');
if (cachedStats) return JSON.parse(cachedStats);
// Calculate and cache...
```

3. **Rate Limiting**
```typescript
// Limit nominations per user
const userNomCount = await redis.get(`user:${username}:nom_count`);
if (parseInt(userNomCount) > 10) {
  return res.status(429).json({ error: 'Too many nominations' });
}
```

4. **Thumbnail CDN**
- Store thumbnails in external CDN
- Use lazy loading for images
- Compress images before display

### **For Multiple Events**

Create separate apps or add event versioning:
```typescript
{
  eventId: 'internet-awards-2026',
  eventName: 'The Internet Awards 2026',
  // ... days config
}

// Redis keys become:
nominations:2026:day-1-games
```

---

## 🔐 **SECURITY CONSIDERATIONS**

### **Current Implementation (MVP)**
- ✅ Reddit authentication (via Devvit context)
- ✅ Post validation (checks if post exists)
- ✅ Input sanitization (URL extraction)
- ⚠️ No rate limiting
- ⚠️ Admin panel open to all
- ⚠️ Delete requires key but no role check

### **Production Recommendations**

1. **Rate Limiting**
```typescript
// Limit nominations per user per hour
const key = `ratelimit:${username}:${Date.now() / 3600000}`;
const count = await redis.incr(key);
if (count > 5) return res.status(429).json({error: 'Rate limit exceeded'});
```

2. **Role-Based Access**
```typescript
// Admin panel access
if (context.userRole !== 'moderator') {
  return res.status(403).json({error: 'Unauthorized'});
}
```

3. **Duplicate Prevention**
```typescript
// Check if user already nominated this post in this category
const existing = await redis.get(`dup:${username}:${category}:${postId}`);
if (existing) return res.status(409).json({error: 'Already nominated'});
```

4. **Input Validation**
- Validate URL format server-side
- Sanitize nomination reasons
- Check post age (optional)
- Verify subreddit allowlist (optional)

---

## 📝 **MAINTENANCE TASKS**

### **Daily (During Event)**
- [ ] Check logs for errors
- [ ] Monitor nomination counts
- [ ] Export daily backup
- [ ] Review admin panel stats

### **Weekly**
- [ ] Review storage usage
- [ ] Check performance metrics
- [ ] Update documentation if needed

### **Post-Event**
- [ ] Final export
- [ ] Generate reports
- [ ] Archive data
- [ ] Document learnings
- [ ] Plan improvements for next event

---

## 🎓 **LEARNING RESOURCES**

### **Project Documentation**
- `README.md` - App overview
- `LEARNINGS/DEVVIT_REDIS_AND_DEPLOYMENT.md` - Redis patterns
- `LEARNINGS/UX_REFINEMENTS_AND_ANIMATED_BANNERS.md` - UI decisions
- `/LEARNINGS/` (root) - Platform-wide knowledge base

### **Devvit Resources**
- [Devvit Docs](https://developers.reddit.com/)
- [Redis Commands](https://developers.reddit.com/docs/redis)
- [Webview Guide](https://developers.reddit.com/docs/webview)

### **Code Architecture**
```
Key Files:
- src/shared/config/event-config.ts → Event configuration
- src/shared/types/event.ts → Type definitions
- src/server/index.ts → API endpoints
- src/client/App.tsx → Main UI
- src/client/components/AdminPanel.tsx → Admin interface
```

---

## 🚨 **EMERGENCY PROCEDURES**

### **"Need to rollback deployment"**
```bash
# Check version history
devvit logs [subreddit]

# Note: Devvit doesn't support direct rollback
# You must redeploy a previous version manually

# Option 1: Git checkout
git checkout [previous-commit]
npm run build && npm run deploy

# Option 2: Restore from backup
# Copy BACKUPS/v0.0.X/ files
npm run build && npm run deploy
```

### **"App is broken in production"**
1. Check logs: `devvit logs [subreddit]`
2. Identify error
3. Fix locally
4. Test with `npm run dev`
5. Deploy fix: `npm run build && npm run deploy`
6. Create new post to test

### **"Need to delete all data immediately"**
1. Open admin panel
2. Danger Zone → Delete All
3. Enter key: `DELETE_INTERNET_AWARDS_2026`
4. Confirm

### **"Redis is full / performance degraded"**
```bash
# Check Redis usage (if you have access)
# Contact Reddit if Redis limits hit

# Short-term: Delete old data
# Long-term: Implement data archival
```

---

## 📞 **SUPPORT**

### **Internal**
- Check `/LEARNINGS/` folder for documented solutions
- Review this implementation guide
- Check app `README.md`

### **Devvit Platform**
- [Developer Forums](https://www.reddit.com/r/Devvit/)
- [Official Docs](https://developers.reddit.com/)
- [GitHub Issues](https://github.com/reddit/devvit/issues)

### **Quick Reference Commands**
```bash
# View logs
devvit logs [subreddit]

# Check app status
devvit list [subreddit]

# Reinstall app
devvit uninstall [subreddit]
devvit install [subreddit]

# Build and deploy
npm run build && npm run deploy
```

---

## ✅ **SUCCESS METRICS**

Track these KPIs during the event:
- Total nominations per day
- Unique nominators
- Average nominations per user
- Most popular categories
- Peak activity times
- Mobile vs desktop usage

**Export stats daily from admin panel!**

---

**Last Updated:** January 6, 2026  
**Version:** 1.0  
**Maintained by:** Glass House Productions

🎉 **Happy Event Running!**

