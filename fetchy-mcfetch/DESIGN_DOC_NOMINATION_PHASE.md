# Design Doc: The Internet Awards – Nomination Phase (fetchy-mcfetch)

**Authors:** Glass House Productions  
**Responsible Team:** [External / Community Apps; or Reddit Devvit Platform]  
**Status:** Work in Progress  
**Created:** February 2026, based on Design Doc Template (Thin)  
**This doc:** [add shortlink when published]

---

## Goals & Background

### Goals

- **Enable community-driven award nominations** for The Internet Awards inside Reddit: users submit and view nominations by category; moderators manage the event and export data for judging.
- **Run entirely on Reddit’s Devvit platform** (WebView + serverless backend + Redis) so the experience is native to Reddit and does not require external hosting.
- **Support many categories in one app:** a single event with multiple award categories (e.g. 25 awards in 6 groups), with filtering, previews, and CSV export for organizers.
- **Keep moderator tooling in-app:** mod-only admin panel (stats, export, clear) and mod menu action to create nomination posts, using Reddit’s moderator APIs correctly (e.g. `getModerators().all()`, caching, request context).

We will **not** in this phase: run the voting/ballot experience (that is a separate app, ballot-box), host user data outside Reddit/Devvit, or support non-Devvit clients.

### Non-Goals

- Voting, finalist selection, or tallying (Phase 2; separate design).
- Internationalization (i18n) or formal accessibility (a11y) beyond basic responsive UI (see checklists).
- Running experiments or defining new analytics events for Reddit’s data pipeline.
- Replacing or modifying Reddit’s core content or ads systems; we consume existing Reddit post metadata and store only nomination records in Redis.

### Background

The Internet Awards is a community awards program. Phase 1 is **nominations only**: users nominate Reddit posts (or link-free entries) to award categories; moderators export nominations (e.g. CSV) for judging and later use Phase 2 (ballot-box) for voting on finalists.

**Technical context for reviewers:**

- **Devvit:** Reddit’s app platform. Apps run in a WebView (client) and a serverless Node backend. Client and server are bundled and deployed together; the client calls server endpoints via relative `/api/*` URLs. Permissions: `reddit` (read post metadata, create custom posts, list moderators) and `redis` (persist nominations).
- **Data model:** Nominations are stored in Redis: one sorted set for ordering (e.g. by timestamp), one hash per nomination (postId, title, author, category, nominatedBy, reason, URL, etc.). Identity is per (category, postId) or (category, thingSlug) for link-free entries.
- **Moderator check:** Implemented per Reddit guidance: `reddit.getModerators({ subredditName }).all()` (Listing must be resolved with `.all()`), result cached, and user/subreddit taken from request context first (`req.context`) then global `context`. Requires @devvit/web ^0.12.8. See LEARNINGS (e.g. `BALLOT_BOX_MOD_CHECK_FIX_FEB_2026.md`) for the same pattern used in the voting app.
- **Reddit API caching:** All Reddit API calls are cached (e.g. via Devvit `cache()` or equivalent) to avoid hammering Reddit services and to respect platform guidance. This includes getModerators, getPostById (for preview and nomination metadata), and any other reddit.* usage.

---

## Downstream Dependencies (Outside Dev Platform)

For teams that need to monitor systems during the event, the nomination experience depends on the following **outside of the Devvit app code itself**:

| Dependency | How we use it | Notes for monitoring |
|------------|----------------|----------------------|
| **Devvit Platform** | Hosting, WebView delivery, serverless runtime, request routing. Our app is deployed and invoked by the platform. | Platform health, cold starts, routing. |
| **Redis** (via Devvit) | Persistence for all nomination data: sorted set for ordering, hashes per nomination. Keys are scoped by app/event (e.g. `nominations:all`, `nomination:${memberKey}`). Read/write on submit, list, export, delete. | Redis availability and latency; key space and memory for this app’s keys. |
| **Reddit Core Platform / APIs** (via Devvit) | We call only what Devvit exposes: **getPostById** (preview + submit flow for post metadata), **getModerators** (mod check for admin panel and menu), **submitCustomPost** (mod menu “create post”). All calls are cached per platform guidance. | Any Core services that back these APIs (e.g. post metadata, moderator listing, custom post creation). Traffic is bounded by subreddit usage and our caching. |

**What we do *not* use:** R2, external HTTP domains from the server, or other shared infrastructure. The client only talks to the same origin (`/api/*`); the server only talks to Devvit-provided Redis and Reddit APIs.

---

## Ratelimit and Shutdown (Event Popularity / Instability)

**Current state:** We do **not** have a built-in ratelimit or a simple “shutdown” switch. If the event gets very popular or Reddit wants to quickly reduce load, the options today are:

1. **Platform-level (recommended):** Disable or throttle the app via Devvit / Mission Control (or equivalent) if that exists—e.g. disable the app for the subreddit or globally. We have not implemented app-internal controls and would rely on platform tooling first.
2. **App-level kill switch (could add):** A simple “pause event” flag in Redis (e.g. `event:paused` or `event:disabled`) that the server checks on `POST /api/submit-nomination` (and optionally on list/export). If set, return `503 Service Unavailable` or a clear “event paused” response. A mod or support could set/clear the key via a one-off script or a future admin action. This would require a small code change and a documented procedure.
3. **Ratelimit (implemented):** Per-user limit of 30 new nominations across the experience. Enforced via Redis key `user_nomination_count:${username}`; 429 when exceeded; client shows X/30 and disables submit at limit; delete-all resets counters.

**Recommendation:** We can add (2) as a minimal “event pause” so there is a simple way to stop new submissions without taking the whole app down. For hard ratelimiting or global shutdown, we’d rely on Devvit/Platform capabilities and would align with the platform team on the preferred approach.

---

## High-Level Design

- **Client (WebView):** React SPA served from Devvit assets. Users pick a category, see existing nominations, submit a nomination (Reddit URL and/or name/description), and get live post preview. Moderators see an admin entry (e.g. hotkey or button) that opens a panel for event stats, CSV export, and clear-all. All server access is via `fetch('/api/...')` to the same origin.
- **Server (Devvit serverless):** Express app mounted on the Devvit server. Exposes REST-style endpoints (e.g. `GET /api/event/config`, `GET /api/nominations`, `POST /api/submit-nomination`, `GET /api/export-csv`, `GET /api/user/is-moderator`) and internal hooks (`/internal/menu/post-create`, `/internal/on-app-install`). Uses Redis for persistence and Reddit API (e.g. `getPostById`, `getModerators`) where needed.
- **Reddit integration:** Custom posts are created via `reddit.submitCustomPost` (mod menu → post-create). Post content is the WebView; no new content type beyond existing custom post behavior. Nominations reference Reddit post IDs and public metadata (title, author, subreddit, karma) fetched server-side for preview and export.
- **Data flow:** Submit → server validates and optionally fetches post → write to Redis (sorted set + hash). List/export → read from Redis and optionally filter by category. Mod actions (export, delete) are gated by is-moderator check and same Redis keys.

```
[User] → WebView (React) → fetch /api/* → [Devvit Server] → Redis + Reddit API
                ↑                                    ↓
         [Devvit assets]                    [Nominations, config]
```

---

## Alternatives Considered

- **External backend:** Rejected so the app stays within Reddit’s trust and deployment model; no extra infra or auth.
- **Using Listing `.children` or skipping `.all()` for getModerators:** Rejected; Reddit guidance is to call `.all()` and cache the result. Skipping or using `.children` leads to incorrect mod detection.
- **Storing nominations outside Redis (e.g. Reddit wiki or external DB):** Rejected; Redis is the supported persistent store for Devvit and keeps latency and complexity low.
- **Single monolithic “nominations + voting” app:** Deferred; we split into fetchy-mcfetch (nominations) and ballot-box (voting) so each app has a clear scope and can be installed and reviewed independently.

---

## Detailed Design

### API surface (server)

| Method + Path | Purpose | Auth / side effects |
|---------------|---------|----------------------|
| GET /api/event/config | Event and category list (groups, awards, copy) | None |
| GET /api/nominations | List nominations, optional ?category= | None |
| GET /api/preview-post | Preview a Reddit post by URL (title, thumbnail, etc.) | Server calls reddit.getPostById |
| POST /api/submit-nomination | Create or “nominate too” one nomination | Writes Redis |
| GET /api/stats/event | Event-level counts for admin | None |
| GET /api/export-csv | Full (or filtered) nominations as CSV | Intended for mod use; no separate auth beyond session context |
| POST /api/delete | Clear all nominations (admin) | Requires confirmation; writes Redis |
| GET /api/user/is-moderator | Whether current user is subreddit mod | Uses getModerators().all(), cache, req.context |
| POST /internal/menu/post-create | Mod menu “create post” | Creates custom post; returns navigateTo |
| POST /internal/on-app-install | App install hook | Optional setup |

### Reddit API caching

**All Reddit API calls are cached.** We do not call reddit.* on every request. Caching uses the Devvit platform cache (e.g. `cache()` from @devvit/web) with appropriate keys and TTLs (e.g. 5 minutes for getModerators; configurable for getPostById/preview). This reduces load on Reddit services and aligns with platform guidance.

### Redis schema (conceptual)

- **Ordering:** Sorted set key (e.g. by event/category); member = nomination id (e.g. `category:postId` or category + thing slug); score = timestamp.
- **Per-nomination data:** Hash key per nomination; fields include postId, title, author, subreddit, karma, url, category, nominatedBy, nominationReason, fetchedAt, thumbnail, permalink; for link-free, thingSlug and similar.
- **Mod list:** Not stored in Redis by this app; moderator list is obtained via Reddit API and cached in the platform cache (key pattern e.g. `moderators_${subredditName}`), TTL 5 minutes.

### Client entrypoints and menu

- **devvit.json:** `post.dir` = dist/client; entrypoints for splash and main (index). Menu item for mods: “The Internet Awards - Nominations” → `/internal/menu/post-create`. Triggers: onAppInstall.
- **Mod detection:** Client calls GET /api/user/is-moderator on load; server uses `req.context` / `context` and cached getModerators().all() to set isModerator. Admin panel and destructive actions are shown only when isModerator is true.

### Security and data

- **Input:** Post URLs validated as Reddit URLs; server fetches post metadata via Reddit API. Free-text fields (e.g. reason, name/description) are stored as provided; no PII beyond what Reddit already exposes (username, post content).
- **No new Reddit content type:** Only custom posts and existing post IDs; no new media type or storage of Reddit content outside standard APIs.
- **Subreddit scope:** App runs in the context of one subreddit per install; Redis keys and mod check are scoped to that subreddit.

### Processing nomination data with an LLM (planned)

We plan to process exported nomination data using a **script that calls an LLM API**. The script will run outside the Devvit runtime (e.g. as a one-off or scheduled job), consuming nomination data (e.g. CSV export or a dump of Redis-backed records) and calling the LLM for tasks such as summarization, deduplication, eligibility checks, or preparing structured inputs for judging or Phase 2 (voting).

- **Provider-agnostic:** The specific LLM provider (e.g. OpenAI, Anthropic, Gemini) has not yet been decided. The design and script will reference a generic **“LLM API”** so we can swap in the chosen provider (and SDK) later without changing the overall flow.
- **Data source:** Input to the script will be nomination data exported from this app (e.g. via the existing CSV export or an equivalent bulk dump). No direct Redis or Reddit API access from the script is required for the base design; the script operates on exported payloads.
- **Scope:** This processing is **post-nomination** and **off-platform** (not part of the Devvit server or client). It does not affect real-time submission, listing, or moderation inside the app. Details (exact prompts, output schema, and where results are stored or used) will be documented when the script is implemented and the LLM API provider is selected.

---

## Future Work

- **Phase 2 (voting):** Separate app (ballot-box) for finalist selection and voting; not in scope for this doc.
- **i18n / a11y:** No current plan; if we target international or accessibility requirements, we will follow Reddit’s i18n and a11y guidance and update the doc.
- **Experimentation / analytics:** No new events or experiments in scope; if we add metrics or experiments later, we will coordinate with Data Science and use standard event specs.
- **Rate limiting / abuse:** See **Ratelimit and Shutdown** above. We do not implement limits today; we can add an app-level “event pause” (Redis flag) and/or per-user ratelimits in a future iteration and document the procedure.

---

## Useful Checklists

**Internationalization**  
- User-facing text exists (category names, buttons, messages). We do not currently plan translation or i18n; we do not target international users with a dedicated i18n strategy. If that changes, we will engage #i18n and document the plan here.

**Accessibility**  
- The design uses standard WebView UI (forms, lists, buttons). We have not yet had Accessibility team review or defined a formal a11y test plan. If the project becomes a Tier 0/1 or replaces core UI, we will work with the Accessibility team on specs and testing (#a11y).

**Experimentation and Analysis**  
- No experiments or new analytics events are in scope. If we add experiments or new events, we will work with Data Science and link an Experiment Spec or V2 Event Spec here.

**Reliability and Capacity Planning**  
- Load is bounded by subreddit usage (nominations and exports). We do not expect this to be a Tier 0/1 service. We rely on Devvit/Redis capacity; no separate capacity or quota system is proposed. Under dependency failure (e.g. Reddit API or Redis), the app can degrade gracefully (e.g. preview fails, list/export may fail); we do not currently implement fallback caches for nomination list.

**Financial Considerations**  
- No headcount or vendor cost exceeding $10k/month is anticipated; this is a community app built on existing Devvit and Redis.

**SOX/SOC2/Compliance**  
- This design does not propose a new Tier 0 service for serving Reddit content or Ads. It does not create components that modify or create financial data, pricing, billing, or ad impressions. We do not consider this in scope for SOX; if that changes, we will engage @GRC.

**Product Risk Evaluation Process (PREP)**  
- The project allows Redditors to create nomination content (references to posts and optional text). It uses existing Reddit and Devvit APIs and does not introduce new media types or new external API surfaces beyond Devvit’s standard. It does not change how Reddit stores or uses personal data beyond what is already exposed in APIs. It affects moderator abilities (admin panel, create post, export data). If Reddit requires a Launch in Mission Control and PREP review, we will create the Launch and link this document. We will answer PREP questions (spam/limits, eligibility, reporting, monetization, harm) in that process.

---

## Appendix / Related Resources

- **Repo:** [internet-awards](https://github.com/...) – fetchy-mcfetch app in `fetchy-mcfetch/`.
- **Docs:**  
  - fetchy-mcfetch [README.md](README.md) – overview, API, Redis, troubleshooting.  
  - [NOMINATION_LINK_FREE_PLAN.md](../NOMINATION_LINK_FREE_PLAN.md) – product/design for link-optional nominations and “resolved thing” layers.  
  - [LEARNINGS/AGENT_HANDOFF_INTERNET_AWARDS.md](../LEARNINGS/AGENT_HANDOFF_INTERNET_AWARDS.md) – current state for both apps.  
  - [LEARNINGS/BALLOT_BOX_MOD_CHECK_FIX_FEB_2026.md](../LEARNINGS/BALLOT_BOX_MOD_CHECK_FIX_FEB_2026.md) – moderator check pattern (same as fetchy).
- **Devvit:** [Reddit Devvit docs](https://developers.reddit.com/docs) – platform, custom posts, Redis, permissions.
- **Config:** `fetchy-mcfetch/devvit.json` – app name, permissions, menu, entrypoints, triggers.

---

*Approvals: To be collected via Design Docs GitHub repo or Mission Control (PREP) as applicable.*
