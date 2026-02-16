# Ballot-Box Moderator Check Fix (Feb 2026)

## Problem

The "Manage finalists" button did not appear for moderators in the ballot-box app. The same issue had occurred in fetchy-mcfetch; a Reddit admin provided the fix.

## Root Cause

1. **`reddit.getModerators()` returns a Listing, not an array**  
   You must call `.all()` to actually load the list. Using `.children` or treating the return value as an array is incorrect and can lead to wrong or empty results.

2. **Context for WebView requests**  
   When the client runs in the Devvit WebView and calls `/api/user/is-moderator`, the server must get the current user and subreddit from **request context first** (`req.context`), then fall back to global `context`. Using only global `context` or only headers can be empty in WebView contexts.

3. **Caching is required**  
   Reddit’s moderator API must be cached. Calling it on every request can overload the service; Reddit has warned about this.

4. **@devvit/web version**  
   The platform fix and the `cache` helper are in **@devvit/web 0.12.8**. ballot-box was on 0.12.0, which did not export `cache` and could behave differently for mod checks.

## Fix (Reddit Admin Pattern)

### 1. Use `getModerators({ subredditName }).all()`

```javascript
// ❌ WRONG – Listing object, not the actual list
const moderators = await reddit.getModerators({ subredditName });

// ✅ CORRECT – .all() returns the array
const moderators = await reddit.getModerators({ subredditName }).all();
```

Do **not** use `.children` or treat the return value as an array without calling `.all()`.

### 2. Get username and subreddit from request, then global context

```javascript
const username = req.context?.username || context.username;
const subredditName =
  req.context?.subredditName || context.subredditName || context.subredditId;
```

### 3. Cache the moderator list

```javascript
import { cache } from '@devvit/web/server';

const moderatorUsernames = await cache(
  async (): Promise<string[]> => {
    const moderators = await reddit.getModerators({ subredditName }).all();
    return (moderators as { username?: string }[]).map((m) => m.username ?? '').filter(Boolean);
  },
  { key: `ballot:moderators_${subredditName}`, ttl: 60 * 5 }
);
```

### 4. Use @devvit/web ^0.12.8

- Upgrade ballot-box (and any similar apps) to **@devvit/web** and **devvit** `^0.12.8` so they get the platform fix and the `cache` export.
- fetchy-mcfetch already uses `^0.12.8`; ballot-box was updated to match.

### 5. Compare username as-is

Use the same casing as returned by the API (e.g. `moderatorUsernames.includes(username)`). Do not rely on `.children` or other Listing internals.

## Files Changed (ballot-box)

- **package.json** – `@devvit/web` and `devvit` set to `^0.12.8`.
- **src/server/index.ts** – Import `cache`; implement is-moderator with `req.context` first, `getModerators({ subredditName }).all()`, and cached moderator list; compare with `includes(username)`.

## References

- fetchy-mcfetch: `src/server/index.ts` `/api/user/is-moderator` (same pattern).
- LEARNINGS: `SESSION_FEB_4_2026_SPLASH_ANIMATIONS_MOD_CHECK.md` (getModerators, caching, context).
- Reddit admin guidance: use `.all()` on `getModerators()`, avoid `.children`, and cache the result.
