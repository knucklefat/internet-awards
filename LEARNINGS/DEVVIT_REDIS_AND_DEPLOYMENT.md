# Devvit Redis and Deployment Learnings

*Created: November 24, 2025*  
*Project: The Internet Awards - Nomination System*  
*Final Working Version: 0.0.15*

## Overview

This document captures critical learnings from building a Reddit Awards nomination system using Devvit, focusing on Redis data storage, permissions, caching, and deployment workflows.

---

## 🔴 CRITICAL: Devvit Caching Behavior

### The Problem
**Devvit aggressively caches webview content.** When you deploy a new version, existing posts continue showing the old cached version indefinitely.

### The Solution
**Always create a NEW post after deploying** - don't try to refresh old posts.

### Why This Happens
- Devvit caches webview assets for performance
- Old posts are "frozen" with their deployed version
- New posts load the latest deployed version
- **Build success ≠ live update on existing posts**

### Workflow
```bash
# 1. Make code changes
# 2. Deploy
npm run deploy

# 3. Create NEW post via mod menu
# (Don't refresh old posts - they won't update)

# 4. Test the new post
# 5. Repeat for each deployment
```

---

## 🔴 CRITICAL: Devvit Redis API Constraints

### What Devvit Redis DOES NOT Support
❌ **`redis.keys()`** - No support for listing keys  
❌ **`redis.lpush()` / `redis.lrange()`** - No list operations  
❌ **Sets** - Only sorted sets are supported  
❌ **Lua scripts** - No custom logic execution  
❌ **Pipelining** - Not supported

### What Devvit Redis DOES Support
✅ **Strings** - `get`, `set`, `getRange`, `setRange`, `strLen`  
✅ **Numbers** - `incr`, `decr`, `incrBy`, `decrBy`  
✅ **Sorted Sets** - `zAdd`, `zRange`, `zRem`, `zScore`, `zRank`, `zIncrBy`, `zScan`  
✅ **Hashes** - `hSet`, `hGet`, `hGetAll`, `hKeys`, `hDel`, `hIncrBy`, `hLen`, `hScan`  
✅ **Bitfields** - Efficient bit operations  
✅ **Transactions** - Atomic operations

### Our Solution: Sorted Sets + Hashes

**Problem:** Need to store and retrieve multiple nominations with metadata.

**Initial Attempts (Failed):**
1. ❌ `redis.keys('nomination:*')` - Method doesn't exist
2. ❌ `redis.lpush()` / `redis.lrange()` - List operations not supported

**Final Solution (Working):**

```typescript
// STORING A NOMINATION
// 1. Create unique member key
const memberKey = `${category}:${postId}`;

// 2. Add to sorted set (for indexing with timestamp)
await redis.zAdd('nominations', {
  member: memberKey,
  score: Date.now()
});

// 3. Store full data in hash (ALL VALUES MUST BE STRINGS!)
const nomination = {
  postId: post.id,
  title: post.title,
  author: post.authorName,
  subreddit: post.subredditName,
  karma: post.score.toString(), // ⚠️ Convert to string!
  url: postUrl,
  category: category,
  nominatedBy: nominatedBy,
  nominationReason: reason || '',
  fetchedAt: Date.now().toString() // ⚠️ Convert to string!
};

await redis.hSet(`nomination:${memberKey}`, nomination);
```

```typescript
// RETRIEVING ALL NOMINATIONS
// 1. Get all member keys from sorted set
const members = await redis.zRange('nominations', 0, -1, { by: 'rank' });

// 2. Fetch each nomination's full data
const nominations = await Promise.all(
  members.map(async (item) => {
    const data = await redis.hGetAll(`nomination:${item.member}`);
    return data ? {
      ...data,
      karma: parseInt(data.karma || '0'), // Convert back to number
      fetchedAt: parseInt(data.fetchedAt || '0')
    } : null;
  })
);
```

### Key Redis Insights

1. **Hash values MUST be strings**
   - Error: `"The 'string' argument must be of type string... Received type number"`
   - Solution: Convert all numbers to strings with `.toString()`

2. **Sorted sets are perfect for indexing**
   - Use timestamp as score for chronological ordering
   - Use unique keys as members
   - Fast retrieval with `zRange`

3. **Hashes are perfect for structured data**
   - Store full object data
   - Efficient field-level access
   - Use with sorted sets for best results

---

## 🔴 CRITICAL: Devvit Permissions

### The Problem
Apps fail silently without proper permissions configured in `devvit.json`.

### Required Permissions Format

```json
{
  "permissions": {
    "reddit": {},
    "redis": true
  }
}
```

### Common Permission Errors

❌ **Wrong Format #1:**
```json
"reddit": true  // Error: "not of a type(s) object"
```

❌ **Wrong Format #2:**
```json
"reddit": {
  "read": true,
  "write": true
}  // Error: "not exactly one from [subschema 0],[subschema 1]"
```

❌ **Wrong Format #3:**
```json
"reddit": ["read", "write"]  // Error: "not exactly one from..."
```

✅ **Correct Format:**
```json
"reddit": {},  // Empty object for web apps
"redis": true  // Boolean for Redis
```

### Symptoms of Missing Permissions
- **Missing Redis permission:** `redis.zAdd is not a function`
- **Missing Reddit permission:** `reddit.getPostById is not a function`
- **Wrong format:** Build fails with schema validation error

---

## 🟡 Important: Devvit Entry Points

### The Problem
Post preview not clickable or webview not loading.

### Solution: Specify Entry Point

```typescript
// src/server/core/post.ts
export const createPost = async () => {
  return await reddit.submitCustomPost({
    subredditName: subredditName,
    title: '🎮 The Internet Awards - Day 1: Games & Hobbies',
    entry: 'default', // ⚠️ IMPORTANT: Specify which entrypoint to use
    preview: {
      text: 'Click to open The Internet Awards nomination system',
    },
  });
};
```

### devvit.json Configuration

```json
{
  "post": {
    "dir": "dist/client",
    "entrypoints": {
      "default": {
        "entry": "index.html"  // Must match the file in dist/client
      }
    }
  }
}
```

### Common Errors
- **Error:** `"useWebView fullscreen request failed; web view asset could not be found"`
- **Cause:** Missing `entry: 'default'` in `submitCustomPost()`
- **Fix:** Add `entry` parameter matching your entrypoint name

---

## 🟢 Deployment Workflow

### Standard Deployment Process

```bash
# 1. Make code changes

# 2. Build and deploy
cd /Users/dante/devvit/fetchy-mcfetch
npm run deploy

# 3. Wait for remote build to complete
# (Watch for "App is building remotely... done")

# 4. Create NEW post
# - Go to playtest subreddit
# - Use mod menu: "The Internet Awards - Nominations"
# - Creates fresh post with new version

# 5. Test in new post
# (Old posts will still show old version)
```

### Version Bumping
- Devvit automatically bumps version on each deploy
- Version format: `0.0.X` (increments X)
- Each version is immutable once deployed

### Build Output Locations
```
dist/
├── client/          # Webview assets
│   ├── index.html
│   ├── index.js
│   ├── index.css
│   └── images/
└── server/          # Server bundle
    └── index.cjs
```

---

## 🟢 Debugging Strategies

### 1. Console Logging (Client-Side)

```typescript
// Add detailed logging to track flow
console.log('Submitting nomination:', { postUrl, category, reason });

const response = await fetch('/api/submit-nomination', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ postUrl, category, reason })
});

console.log('Response status:', response.status);

const data = await response.json();
console.log('Response data:', data);
```

### 2. Server Logs

```bash
# View live server logs
devvit logs fetchy-mcfetch --subreddit t5_fxjagx --since 10m
```

### 3. Network Tab Inspection
- Open browser DevTools → Network tab
- Submit nomination
- Check `/api/submit-nomination` request:
  - Status code (200, 400, 500)
  - Request payload
  - Response body

### 4. Common Error Patterns

| Error | Cause | Fix |
|-------|-------|-----|
| `redis.keys is not a function` | Unsupported Redis method | Use sorted sets + hashes |
| `redis.lpush is not a function` | Unsupported Redis method | Use sorted sets + hashes |
| `"string" argument must be... Received type number` | Hash values must be strings | Convert numbers with `.toString()` |
| `permissions.reddit is not of a type(s) object` | Wrong permission format | Use `"reddit": {}` |
| `useWebView fullscreen request failed` | Missing entry point | Add `entry: 'default'` |
| `500 Internal Server Error` | Server crash | Check server logs |

---

## 📊 Architecture Overview

### Data Flow

```
User Action (Submit Nomination)
    ↓
React Client (App.tsx)
    ↓
fetch('/api/submit-nomination')
    ↓
Express Server (index.ts)
    ↓
Reddit API (reddit.getPostById)
    ↓
Redis Storage (zAdd + hSet)
    ↓
Response to Client
    ↓
Reload Nominations List
```

### Storage Schema

```
Redis Structure:
├── nominations (Sorted Set)
│   ├── member: "best-game:abc123" → score: 1732483200000
│   ├── member: "most-collectable:def456" → score: 1732483201000
│   └── ...
│
├── nomination:best-game:abc123 (Hash)
│   ├── postId: "abc123"
│   ├── title: "Amazing Game Post"
│   ├── author: "username"
│   ├── subreddit: "gaming"
│   ├── karma: "1234"
│   ├── url: "https://..."
│   ├── category: "best-game"
│   ├── nominatedBy: "moderator"
│   ├── nominationReason: "This is awesome"
│   └── fetchedAt: "1732483200000"
│
└── nomination:most-collectable:def456 (Hash)
    └── ...
```

---

## 🎯 Key Takeaways

### DO:
1. ✅ Always create NEW posts after deploying
2. ✅ Convert all numbers to strings for Redis hashes
3. ✅ Use sorted sets + hashes for complex data
4. ✅ Set correct permissions in `devvit.json`
5. ✅ Specify `entry` parameter in `submitCustomPost()`
6. ✅ Add comprehensive console logging for debugging
7. ✅ Test in fresh posts, not old cached ones

### DON'T:
1. ❌ Don't use `redis.keys()` - not supported
2. ❌ Don't use `redis.lpush()` / `redis.lrange()` - not supported
3. ❌ Don't store numbers directly in Redis hashes
4. ❌ Don't expect old posts to update after deployment
5. ❌ Don't use `"reddit": true` in permissions
6. ❌ Don't forget to specify entry point in post creation
7. ❌ Don't assume build success means the app is live in old posts

---

## 🚀 Working Version Reference

**Version:** 0.0.15  
**Status:** ✅ Fully functional  
**Date:** November 24, 2025

### What Works:
- ✅ Nomination submission with category selection
- ✅ Reddit post data fetching via API
- ✅ Redis storage (sorted sets + hashes)
- ✅ Nomination list display with filtering
- ✅ CSV export functionality
- ✅ Category dropdown filter
- ✅ "The Internet Awards" branding
- ✅ SVG banner display

### File Structure:
```
fetchy-mcfetch/
├── devvit.json (permissions, entry points)
├── src/
│   ├── client/
│   │   ├── App.tsx (React UI)
│   │   ├── index.html (entry point)
│   │   ├── main.tsx (React bootstrap)
│   │   ├── public/
│   │   │   └── images/
│   │   │       └── internet-awards-banner.svg
│   │   └── vite.config.ts
│   ├── server/
│   │   ├── index.ts (API endpoints)
│   │   └── core/
│   │       └── post.ts (post creation)
│   └── shared/
│       └── types/
│           └── api.ts (TypeScript types)
└── LEARNINGS/ (this file)
```

---

## 🎮 The Internet Awards - Day 1 Categories

1. 🎮 **Best Game - Digital or Analog**
2. 🏆 **Most Collectable Collectable**
3. 🎨 **Best Original Creation**
4. 📖 **Best Original Story**

---

## 📝 Future Considerations

### Potential Enhancements:
- Add duplicate post detection (same postId + category)
- Implement nomination voting system
- Add moderation tools (delete nominations)
- Create separate views for each day's awards
- Add image upload for banner customization
- Implement real-time updates with polling
- Add nomination count limits per category
- Create admin dashboard for managing awards

### Scaling Considerations:
- Redis has 500 MB storage limit per installation
- Max 40,000 commands per second
- Each subreddit installation has isolated data
- Consider pagination for large nomination lists

---

## 🔗 Related Documentation

- [Devvit Redis Docs](https://developers.reddit.com/docs/capabilities/server/redis)
- [Devvit Web Apps](https://developers.reddit.com/docs/capabilities/web-apps)
- [Devvit Permissions](https://developers.reddit.com/docs/capabilities/permissions)

---

**Remember:** When in doubt, create a new post! 🎯

