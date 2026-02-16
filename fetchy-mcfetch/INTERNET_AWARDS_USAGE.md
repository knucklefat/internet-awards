# 🏆 The Internet Awards - Nomination System

**App folder:** `fetchy-mcfetch/`. Run all commands from that folder.

**A Reddit-native nomination and voting platform for community-driven awards**

A comprehensive Devvit app for managing award nominations across multiple categories. Built for The Internet Awards to recognize the best posts in Games & Hobbies, with support for multi-day events and various award types.

---

## 📋 **OVERVIEW**

### **Current Status**
- **Version:** 0.0.290+ (see `devvit upload` / Developer Portal)
- **Status:** ✅ Production Ready
- **Live on:** r/internetawards_dev (dev); install on main Reddit subreddit via CLI or Mod Panel
- **Last Updated:** February 5, 2026
- **Event:** Single Event - 24 Awards in 6 Categories
- **Installation:** `devvit install <subreddit> fetchy-mcfetch` from `fetchy-mcfetch/`; or publish then install from Mod Tools → Installed Apps

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

**🎮 Gaming & Hobbies:**
1. S-Tier Game – Best overall gaming experience *(Game Title)*
2. Holy Grail – The most desirable collectible released in the past year *(Title of Something that people collect)*
3. Artistic Masterpiece – Best original artistic creation *(Link or image of a Piece of art)*
4. Most Quotable – Work of fiction most worth quoting *(Literary Title or Author)*

**😂 Funny & Cute:**
5. Comedy Gold – Funniest original humor skit, comic, or joke *(Title of a published comic or Comedian)*
6. Outstanding Aww – Most adorable animal on the internet *(Specific animal)*
7. Top Shelf Meme – Meme that understood the assignment *(Single Meme)*
8. Faith in Humanity – Most wholesome or heartwarming piece of content *(Title or Description of a piece of content)*

**🧠 Knowledge:**
9. Deepest Learning – Deepest, most rewarding thread or thought-starter on the internet *(Title or Description of a subject)*
10. Tech that Delivered – Tech innovation that lived up to the hype *(Title of a technology or name of company)*
11. Mind-Blowing Discovery – Research, discovery, or finding in a field of science *(Title or description of subject)*
12. Stream of Consciousness – Most Informative episode this past year *(Title of a podcast, stream, or streamer)*

**💡 Lifestyle & Advice:**
13. Life-Changing Life Hack – A life hack that actually changed everything *(Title or Description)*
14. Pinned Destination – Travel destination worth every step of the trip *(Name of a physical location)*
15. The Look – Style trend that dominated the discourse *(Name of a style or brand)*
16. Chef's Kiss – Most impressive culinary contribution *(Title or description of a recipe, dish, or drink)*

**🎬 Pop Culture:**
17. Redemption Arc – Best episode or story arc in a series *(Title of a show and/or episode of a show)*
18. Absolute Cinema – The film most worth talking about *(Title of a Movie)*
19. Peak Sports – Best highlight or moment in sports *(Title or description of an athletic team, player or game)*
20. Hottest Earworm – The song you still can't stop listening to *(Title of a song or musical artist)*

**🌐 The Internet:**
21. Community of the Moment – A community that brought the internet together *(Name of a subreddit or community)*
22. Positive Influence – A channel, stream, or podcast moment that had a positive effect *(Title or name of a podcast, podcaster or streamer)*
23. Viral Trend – The most memorable trend that spread across the internet *(Name or Description of an internet trend)*
24. Ask Me Anything – The AMA most worth reading *(Title or name or reddit post title)*

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

### **Fetch Domains**

This app uses Devvit’s [HTTP Fetch](https://developers.reddit.com/docs/capabilities/server/http-fetch) to resolve Reddit short links for post previews. The following domains are requested in `devvit.json` under `permissions.http.domains`:

| Domain | Purpose |
|--------|---------|
| **reddit.com** | Resolve Reddit short links (e.g. `https://reddit.com/r/sub/s/XXXXX`) via the public `.json` API so we can show post title/thumbnail in the nomination form. |
| **www.reddit.com** | Same as above for `www`-prefixed URLs (e.g. iOS “Copy link” often produces these). |
| **redd.it** | Resolve `redd.it/XXXXX` short links to their full post URL so we can extract the post ID and fetch metadata for preview. |

**Usage:** Server-side only. When a user pastes a short link into the “Supporting Post” field, the server fetches the URL with `.json` appended, follows redirects or parses the response to obtain the post ID, then uses Devvit’s `reddit.getPostById()` for title/thumbnail. No user data is sent to these domains; we only read public post metadata. Usage complies with Reddit’s API and Devvit fetch guidelines.

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

(See main [README.md](README.md) for the tool’s API reference; endpoints are the same.)

---

## 🎨 **CUSTOMIZATION**

### **Adding New Award Categories**
Edit `src/shared/config/event-config.ts`: add entries to `AWARD_CATEGORIES` and optionally `CATEGORY_GROUPS`.

### **Banner Images**
Place images in `src/client/public/images/banners/` and reference in event config. Main banner: `main-banner.png` (or path in config).

### **Splash Screen**
Edit `src/client/splash.html` and assets; post creation in `src/server/core/post.ts` for splash/heading/button when creating posts.

---

## 📚 **LEARNINGS & DOCUMENTATION**

- **Shared Learnings (repo root):** `../LEARNINGS/`
- **Tool overview and options:** [README.md](README.md)
- **Design doc:** [DESIGN_DOC_NOMINATION_PHASE.md](DESIGN_DOC_NOMINATION_PHASE.md)

---

## 🐛 **TROUBLESHOOTING**

(See main [README.md](README.md) for troubleshooting, deployment, and caching notes.)

---

## 📝 **CHANGELOG**

(See repo history and main README for version history.)

---

**Built with ❤️ by Glass House Productions**  
**Platform:** Reddit Devvit | **License:** MIT
