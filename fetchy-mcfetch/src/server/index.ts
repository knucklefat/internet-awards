import express from 'express';
import { cache, redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import {
  INTERNET_AWARDS_EVENT,
  getAwardById,
  getAllCategories,
  getAllAwards,
} from '../shared/config/event-config';
import type { Nomination } from '../shared/types/event';

/**
 * Safely extract error message from any error type
 */
function getErrorMessage(error: unknown): string {
  try {
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return String(error);
  } catch (e) {
    return 'Unknown error';
  }
}

// Extend Express Request type to include Devvit context
declare global {
  namespace Express {
    interface Request {
      context?: {
        username?: string;
        subredditName?: string;
        [key: string]: any;
      };
    }
  }
}

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

/**
 * Get nominator username from request. Prefer context; fall back to devvit-user header
 * so submissions from different entry points (e.g. menu vs post) still get the correct user.
 * Reddit sends user as t2_xxxx; we strip the prefix for consistent display and unique count.
 */
function getNominatorUsername(req: express.Request): string {
  const fromContext = req.context?.username;
  if (fromContext && fromContext.trim().length > 0) return fromContext.trim().replace(/^t2_/, '');
  const fromHeader = (req.headers['devvit-user'] as string) ?? '';
  const stripped = fromHeader.trim().replace(/^t2_/, '');
  return stripped.length > 0 ? stripped : 'anonymous';
}

const HIDDEN_NOMINATIONS_KEY = 'hidden_nominations';
const SHADOW_BANNED_USERS_KEY = 'shadow_banned_users';

/** Returns true if the request user is a subreddit moderator. Used for admin-only actions. */
async function isModeratorUser(req: express.Request): Promise<boolean> {
  const username = (req.context?.username || context.username || '').trim().replace(/^t2_/, '');
  const subredditName =
    req.context?.subredditName || context.subredditName || context.subredditId;
  if (!username || !subredditName) return false;
  const moderatorUsernames = await cache(
    async (): Promise<string[]> => {
      const moderators = await reddit
        .getModerators({ subredditName })
        .all();
      return moderators.map((mod) => mod.username);
    },
    { key: `moderators_${subredditName}`, ttl: 60 * 5 }
  );
  return moderatorUsernames.includes(username);
}

/** Returns true if the username is shadow banned (no new submissions or seconds recorded). */
async function isShadowBanned(username: string): Promise<boolean> {
  if (!username || !username.trim()) return false;
  const normalized = username.trim().replace(/^t2_/, '');
  const val = await redis.hGet(SHADOW_BANNED_USERS_KEY, normalized);
  return val === '1';
}

/**
 * Extract post ID from Reddit URL (post links only)
 */
function extractPostId(url: string): string | undefined {
  const patterns = [
    /reddit\.com\/r\/[\w-]+\/comments\/([a-z0-9]+)/i,
    /reddit\.com\/comments\/([a-z0-9]+)/i,
    /redd\.it\/([a-z0-9]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

/** Subreddit URL pattern: reddit.com/r/SubredditName (optional trailing slash/query) */
const SUBREDDIT_URL_REGEX = /reddit\.com\/r\/([a-z0-9_]+)/i;

function isSubredditUrl(url: string): boolean {
  return SUBREDDIT_URL_REGEX.test(url.trim());
}

function getSubredditNameFromUrl(url: string): string | undefined {
  const m = url.trim().match(SUBREDDIT_URL_REGEX);
  return m ? m[1] : undefined;
}

/** Reddit short link: e.g. reddit.com/r/sub/s/ABC123 or redd.it/ABC123 */
const REDDIT_SHORT_LINK_REGEX = /reddit\.com\/.*\/s\/[a-z0-9]+/i;

function isRedditShortLink(url: string): boolean {
  const u = url.trim();
  return REDDIT_SHORT_LINK_REGEX.test(u) || /^https?:\/\/redd\.it\/[a-z0-9]+/i.test(u);
}

const REDDIT_JSON_USER_AGENT = 'InternetAwards/1.0 (Devvit; fetchy-mcfetch)';

/**
 * Resolve Reddit short link to final URL by following redirects.
 * Returns the final URL if resolution succeeds, null otherwise.
 */
async function resolveRedditShortLink(url: string): Promise<string | null> {
  try {
    const normalized = url.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      return null;
    }
    const response = await fetch(normalized, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': REDDIT_JSON_USER_AGENT },
    });
    const finalUrl = response.url;
    if (finalUrl && finalUrl !== normalized) {
      return finalUrl;
    }
    return null;
  } catch (e) {
    console.error('resolveRedditShortLink failed:', e);
    return null;
  }
}

/**
 * Get post ID from a Reddit short link by using the .json API.
 * Short links (reddit.com/r/sub/s/{id} or redd.it/{id}) redirect to
 * reddit.com/r/sub/comments/{submission_id}/_/{comment_id}; we need the submission_id.
 * - PRAW handles this via submission(url=short_link); we have no PRAW, so we fetch .json.
 * - Unauthenticated GET from servers can get 403 (Reddit may block datacenter IPs).
 * See: https://www.reddit.com/r/redditdev/comments/18i7lxa/ and .../1ervz8l/
 */
async function getPostIdFromShortLink(url: string): Promise<string | null> {
  try {
    const normalized = url.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      return null;
    }
    const jsonUrl = normalized.replace(/\/*(\?.*)?$/, '') + '.json';
    const response = await fetch(jsonUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': REDDIT_JSON_USER_AGENT, Accept: 'application/json' },
    });

    if (response.status === 403) {
      console.warn('getPostIdFromShortLink: Reddit returned 403 (short-link resolve may be blocked from this environment)');
      return null;
    }

    const finalUrl = response.url || jsonUrl;
    const fromUrl = extractPostId(finalUrl);
    if (fromUrl) {
      return fromUrl;
    }

    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return null;
    }

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }
    const first = data[0] as { data?: { children?: Array<{ data?: { id?: string } }> } };
    const id = first?.data?.children?.[0]?.data?.id;
    return typeof id === 'string' && /^[a-z0-9]+$/i.test(id) ? id : null;
  } catch (e) {
    console.error('getPostIdFromShortLink failed:', e);
    return null;
  }
}

/** Max length for thing slug in Redis key (safe, readable) */
const THING_SLUG_MAX_LENGTH = 80;

/**
 * Normalize title to a slug for link-free "thing" identity (Layer 2).
 * Same normalized string => same nomination bucket for voteCount.
 */
function normalizeThingSlug(title: string): string {
  const t = title.trim().toLowerCase().replace(/\s+/g, ' ');
  const slug = t
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug.slice(0, THING_SLUG_MAX_LENGTH);
}

/** Per-user nomination limit across the entire experience (new nominations only; "nominate too" does not count) */
const NOMINATION_LIMIT_PER_USER = 30;

function userNominationCountKey(username: string): string {
  return `user_nomination_count:${username}`;
}

/**
 * Get current nomination count for a user. If the counter key does not exist (e.g. first request after deploy),
 * count from existing nomination hashes and set the key (lazy init).
 */
async function ensureUserNominationCount(username: string): Promise<number> {
  const key = userNominationCountKey(username);
  const exists = await redis.exists(key);
  if (exists) {
    const val = await redis.get(key);
    return parseInt(val ?? '0', 10);
  }
  const memberKeys = await redis.zRange('nominations:all', 0, -1, { by: 'rank' });
  let count = 0;
  for (const m of memberKeys) {
    const data = await redis.hGetAll(`nomination:${m.member}`);
    if (data?.nominatedBy === username) count++;
  }
  await redis.set(key, count.toString());
  return count;
}

/**
 * Increment per-user nomination count (call only when creating a new nomination).
 * Returns the new count. Use with NOMINATION_LIMIT_PER_USER to enforce limit.
 */
async function incrementUserNominationCount(username: string): Promise<number> {
  const key = userNominationCountKey(username);
  await redis.incrBy(key, 1);
  const val = await redis.get(key);
  return parseInt(val ?? '0', 10);
}

/** Decrement per-user nomination count (e.g. when rejecting due to limit after incr) */
async function decrementUserNominationCount(username: string): Promise<void> {
  const key = userNominationCountKey(username);
  await redis.incrBy(key, -1);
}

/**
 * Reserve one nomination slot for the user. Call only when about to create a new nomination.
 * If over limit, sends 429 and returns false; otherwise returns true.
 */
async function reserveNominationSlot(
  username: string,
  res: express.Response
): Promise<boolean> {
  const newCount = await incrementUserNominationCount(username);
  if (newCount > NOMINATION_LIMIT_PER_USER) {
    await decrementUserNominationCount(username);
    res.status(429).json({
      error: `You've reached the limit of ${NOMINATION_LIMIT_PER_USER} nominations.`,
      success: false,
      limit: NOMINATION_LIMIT_PER_USER,
      used: newCount - 1,
    });
    return false;
  }
  return true;
}

/**
 * Check if current user is a moderator
 */
router.get('/api/user/is-moderator', async (req, res): Promise<void> => {
  try {
    const username = req.context?.username || context.username;
    const subredditName =
      req.context?.subredditName || context.subredditName || context.subredditId;

    if (!username) {
      res.json({ success: true, isModerator: false });
      return;
    }

    if (!subredditName) {
      res.json({ success: true, isModerator: false });
      return;
    }

    const moderatorUsernames = await cache(
      async (): Promise<string[]> => {
        const moderators = await reddit
          .getModerators({
            subredditName,
          })
          .all();
        return moderators.map((moderator) => moderator.username);
      },
      {
        key: `moderators_${subredditName}`,
        ttl: 60 * 5,
      }
    );

    const isModerator = moderatorUsernames.includes(username);

    res.json({ success: true, isModerator });
  } catch (error) {
    console.error('[MOD CHECK] Error:', error);
    res.json({ success: true, isModerator: false });
  }
});

/**
 * Get current user's nomination count (for rate limit display).
 * Returns used count and limit; used only counts new nominations (not "nominate too").
 */
router.get('/api/user/nomination-count', async (req, res): Promise<void> => {
  try {
    const username = getNominatorUsername(req);
    const used = await ensureUserNominationCount(username);
    res.json({
      success: true,
      used,
      limit: NOMINATION_LIMIT_PER_USER,
    });
  } catch (error) {
    console.error('Error getting nomination count:', error);
    res.status(500).json({
      error: getErrorMessage(error) || 'Failed to get nomination count',
      success: false,
    });
  }
});

/**
 * Get event configuration
 */
router.get('/api/event/config', async (_req, res): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        eventName: INTERNET_AWARDS_EVENT.name,
        eventDescription: INTERNET_AWARDS_EVENT.description,
        startDate: INTERNET_AWARDS_EVENT.startDate,
        endDate: INTERNET_AWARDS_EVENT.endDate,
        categories: INTERNET_AWARDS_EVENT.categories,
        awards: INTERNET_AWARDS_EVENT.awards,
      },
    });
  } catch (error) {
    console.error('Error fetching event config:', error);
    res.status(500).json({
      error: getErrorMessage(error) || 'Failed to fetch event config',
      success: false,
    });
  }
});

/**
 * Preview a post before submitting
 */
router.get('/api/preview-post', async (req, res): Promise<void> => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      res.status(400).json({
        error: 'Missing or invalid url parameter',
        success: false,
      });
      return;
    }

    let postId = extractPostId(url);

    if (!postId && isRedditShortLink(url)) {
      const fromShort = await getPostIdFromShortLink(url);
      if (fromShort) {
        postId = fromShort;
      }
    }

    if (!postId) {
      // Accept subreddit URLs as "supporting community" (no post preview)
      if (isSubredditUrl(url)) {
        const subName = getSubredditNameFromUrl(url);
        res.json({
          success: true,
          data: {
            title: subName ? `r/${subName}` : url,
            thumbnail: null,
            permalink: null,
          },
        });
        return;
      }
      res.status(400).json({
        error: 'Invalid Reddit URL format. Use a post link (reddit.com/r/.../comments/...) or a subreddit link (reddit.com/r/SubredditName).',
        success: false,
      });
      return;
    }

    const post = await reddit.getPostById(`t3_${postId}`);

    if (!post) {
      res.status(404).json({
        error: 'Post not found',
        success: false,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        title: post.title,
        thumbnail: post.thumbnail?.url || null,
        permalink: post.permalink || null,
      },
    });
  } catch (error) {
    console.error('Error fetching post preview:', error);
    res.status(500).json({
      error: getErrorMessage(error) || 'Failed to fetch post preview',
      success: false,
    });
  }
});

/**
 * Submit a nomination (link optional; name/description required when no link).
 * Layer 2: link-free uses normalized thing slug for identity and "Nominate too" dedupe.
 */
router.post('/api/submit-nomination', async (req, res): Promise<void> => {
  try {
    const { postUrl, category, reason, title: bodyTitle, thingSlug: bodyThingSlug } = req.body;

    if (!category) {
      res.status(400).json({
        error: 'Missing category parameter',
        success: false,
      });
      return;
    }

    const awardInfo = getAwardById(category);
    if (!awardInfo) {
      res.status(400).json({
        error: 'Invalid category',
        success: false,
      });
      return;
    }

    const nominatedBy = getNominatorUsername(req);

    if (await isShadowBanned(nominatedBy)) {
      res.status(403).json({
        error: 'You cannot submit or second nominations.',
        success: false,
      });
      return;
    }

    const currentCount = await ensureUserNominationCount(nominatedBy);
    if (currentCount >= NOMINATION_LIMIT_PER_USER) {
      res.status(429).json({
        error: `You've reached the limit of ${NOMINATION_LIMIT_PER_USER} nominations.`,
        success: false,
        limit: NOMINATION_LIMIT_PER_USER,
        used: currentCount,
      });
      return;
    }

    const hasLink = typeof postUrl === 'string' && postUrl.trim().length > 0;
    const title = typeof bodyTitle === 'string' ? bodyTitle.trim() : '';
    const thingSlugParam = typeof bodyThingSlug === 'string' ? bodyThingSlug.trim() : '';

    if (hasLink) {
      let postId = extractPostId(postUrl);

      if (!postId) {
        // Second by thingSlug when user sent thingSlug and no title (e.g. "Second" on link-free or short-link nomination)
        if (thingSlugParam.length > 0 && !title) {
          const slugForKey = thingSlugParam.slice(0, THING_SLUG_MAX_LENGTH);
          const memberKey = `${category}:free:${slugForKey}`;
          const nominationKey = `nomination:${memberKey}`;
          const existing = await redis.hGetAll(nominationKey);
          if (Object.keys(existing).length > 0) {
            const alreadySeconded = await redis.hGet(`user_seconded:${nominatedBy}`, memberKey);
            if (alreadySeconded === '1') {
              res.status(400).json({
                error: 'You have already seconded this nominee',
                success: false,
              });
              return;
            }
            const currentVoteCount = parseInt(existing.voteCount || '1');
            const newVoteCount = currentVoteCount + 1;
            await redis.hSet(nominationKey, { voteCount: newVoteCount.toString() });
            await redis.hSet(`user_seconded:${nominatedBy}`, { [memberKey]: '1' });
            res.json({
              success: true,
              isAdditionalVote: true,
              voteCount: newVoteCount,
              data: existing,
            });
            return;
          }
          res.status(404).json({
            error: 'Nomination not found for this thing',
            success: false,
          });
          return;
        }

        // Resolve Reddit short link via .json API to get post ID
        if (isRedditShortLink(postUrl)) {
          const resolvedId = await getPostIdFromShortLink(postUrl);
          if (resolvedId) {
            postId = resolvedId;
          }
        }

        if (!postId) {
          // Subreddit URL: treat as "supporting community" link, use link-free identity
          if (isSubredditUrl(postUrl)) {
            const subName = getSubredditNameFromUrl(postUrl);
            if (!title) {
              res.status(400).json({
                error: 'Nominee name or description is required',
                success: false,
              });
              return;
            }
          const slug = normalizeThingSlug(title);
          const slugForKey = slug.length > 0 ? slug.slice(0, THING_SLUG_MAX_LENGTH) : crypto.randomUUID();
          const memberKey = `${category}:free:${slugForKey}`;
          const nominationKey = `nomination:${memberKey}`;
          const existing = await redis.hGetAll(nominationKey);
          if (Object.keys(existing).length > 0) {
            const alreadySeconded = await redis.hGet(`user_seconded:${nominatedBy}`, memberKey);
            if (alreadySeconded === '1') {
              res.status(400).json({
                error: 'You have already seconded this nominee',
                success: false,
              });
              return;
            }
            const currentVoteCount = parseInt(existing.voteCount || '1');
            const newVoteCount = currentVoteCount + 1;
            await redis.hSet(nominationKey, { voteCount: newVoteCount.toString() });
            await redis.hSet(`user_seconded:${nominatedBy}`, { [memberKey]: '1' });
            res.json({
              success: true,
              isAdditionalVote: true,
              voteCount: newVoteCount,
              data: existing,
            });
            return;
          }
          if (!(await reserveNominationSlot(nominatedBy, res))) return;
          const nomination: Record<string, string> = {
            postId: '',
            title,
            author: '',
            subreddit: subName ? `r/${subName}` : '',
            karma: '0',
            url: postUrl.trim(),
            category,
            nominatedBy,
            nominationReason: reason || '',
            fetchedAt: Date.now().toString(),
            thumbnail: '',
            permalink: '',
            voteCount: '1',
            thingSlug: slugForKey,
          };
          await redis.zAdd('nominations:all', { member: memberKey, score: Date.now() });
          await redis.hSet(nominationKey, nomination);
          res.json({ success: true, isAdditionalVote: false, data: nomination });
          return;
          }

        res.status(400).json({
          error: 'Invalid Reddit URL format. Use a post link (reddit.com/r/.../comments/...) or a subreddit link (reddit.com/r/SubredditName).',
          success: false,
        });
        return;
        }
      }

      // Post URL: fetch post, use category:postId identity
      const post = await reddit.getPostById(`t3_${postId}`);
      if (!post) {
        res.status(404).json({
          error: 'Post not found',
          success: false,
        });
        return;
      }

      let thumbnailUrl = '';
      if (post.thumbnail && post.thumbnail.url) {
        thumbnailUrl = post.thumbnail.url;
      }

      const memberKey = `${category}:${postId}`;
      const nominationKey = `nomination:${memberKey}`;
      const existing = await redis.hGetAll(nominationKey);

      if (Object.keys(existing).length > 0) {
        const alreadySeconded = await redis.hGet(`user_seconded:${nominatedBy}`, memberKey);
        if (alreadySeconded === '1') {
          res.status(400).json({
            error: 'You have already seconded this nominee',
            success: false,
          });
          return;
        }
        const currentVoteCount = parseInt(existing.voteCount || '1');
        const newVoteCount = currentVoteCount + 1;
        await redis.hSet(nominationKey, { voteCount: newVoteCount.toString() });
        await redis.hSet(`user_seconded:${nominatedBy}`, { [memberKey]: '1' });
        res.json({
          success: true,
          isAdditionalVote: true,
          voteCount: newVoteCount,
          data: existing,
        });
        return;
      }

      if (!(await reserveNominationSlot(nominatedBy, res))) return;
      const nomination: Record<string, string> = {
        postId: post.id,
        title: title || post.title,
        postTitle: post.title,
        author: post.authorName,
        subreddit: post.subredditName,
        karma: post.score.toString(),
        url: postUrl,
        category,
        nominatedBy,
        nominationReason: reason || '',
        fetchedAt: Date.now().toString(),
        thumbnail: thumbnailUrl,
        permalink: post.permalink || '',
        voteCount: '1',
      };
      await redis.zAdd('nominations:all', { member: memberKey, score: Date.now() });
      await redis.hSet(nominationKey, nomination);
      res.json({ success: true, isAdditionalVote: false, data: nomination });
      return;
    }

    // Link-free "Nominate too": thingSlug provided, no new title -> increment existing
    if (thingSlugParam.length > 0 && !title) {
      const memberKey = `${category}:free:${thingSlugParam}`;
      const nominationKey = `nomination:${memberKey}`;
      const existing = await redis.hGetAll(nominationKey);
      if (Object.keys(existing).length > 0) {
        const alreadySeconded = await redis.hGet(`user_seconded:${nominatedBy}`, memberKey);
        if (alreadySeconded === '1') {
          res.status(400).json({
            error: 'You have already seconded this nominee',
            success: false,
          });
          return;
        }
        const currentVoteCount = parseInt(existing.voteCount || '1');
        const newVoteCount = currentVoteCount + 1;
        await redis.hSet(nominationKey, { voteCount: newVoteCount.toString() });
        await redis.hSet(`user_seconded:${nominatedBy}`, { [memberKey]: '1' });
        res.json({
          success: true,
          isAdditionalVote: true,
          voteCount: newVoteCount,
          data: existing,
        });
        return;
      }
      res.status(404).json({
        error: 'Nomination not found for this thing',
        success: false,
      });
      return;
    }

    // Link-free new submission: require title, use category:free:slug identity
    if (!title) {
      res.status(400).json({
        error: 'Nominee name or description is required when no link is provided',
        success: false,
      });
      return;
    }

    const slug = normalizeThingSlug(title);
    const slugForKey = slug.length > 0 ? slug : crypto.randomUUID();
    const memberKey = `${category}:free:${slugForKey}`;
    const nominationKey = `nomination:${memberKey}`;
    const existing = await redis.hGetAll(nominationKey);

    if (Object.keys(existing).length > 0) {
      const alreadySeconded = await redis.hGet(`user_seconded:${nominatedBy}`, memberKey);
      if (alreadySeconded === '1') {
        res.status(400).json({
          error: 'You have already seconded this nominee',
          success: false,
        });
        return;
      }
      const currentVoteCount = parseInt(existing.voteCount || '1');
      const newVoteCount = currentVoteCount + 1;
      await redis.hSet(nominationKey, { voteCount: newVoteCount.toString() });
      await redis.hSet(`user_seconded:${nominatedBy}`, { [memberKey]: '1' });
      res.json({
        success: true,
        isAdditionalVote: true,
        voteCount: newVoteCount,
        data: existing,
      });
      return;
    }

    if (!(await reserveNominationSlot(nominatedBy, res))) return;
    const nomination: Record<string, string> = {
      postId: '',
      title,
      author: '',
      subreddit: '',
      karma: '0',
      url: '',
      category,
      nominatedBy,
      nominationReason: reason || '',
      fetchedAt: Date.now().toString(),
      thumbnail: '',
      permalink: '',
      voteCount: '1',
      thingSlug: slugForKey,
    };

    await redis.zAdd('nominations:all', { member: memberKey, score: Date.now() });
    await redis.hSet(nominationKey, nomination);
    console.log(`Link-free nomination stored: ${nominationKey} (thingSlug: ${slugForKey})`);
    res.json({ success: true, isAdditionalVote: false, data: nomination });
  } catch (error) {
    console.error('Error submitting nomination:', error);
    res.status(500).json({
      error: getErrorMessage(error) || 'Failed to submit nomination',
      success: false,
    });
  }
});

/**
 * Get nominations (filtered by category).
 * Includes currentUserHasSeconded per nomination when the current user has seconded it.
 * Public list excludes hidden nominations. Mods can pass ?includeHidden=1 to get all and see hidden flag + memberKey.
 */
router.get('/api/nominations', async (req, res): Promise<void> => {
  try {
    const { category, includeHidden } = req.query;
    const currentUsername = getNominatorUsername(req);
    const modRequestingHidden = includeHidden === '1' && (await isModeratorUser(req));

    // Get all nominations from sorted set
    let memberKeys = await redis.zRange('nominations:all', 0, -1, { by: 'rank', reverse: true });

    // Filter by category if specified
    if (category && typeof category === 'string') {
      memberKeys = memberKeys.filter((key) => key.member.startsWith(`${category}:`));
    }

    const hiddenHash = await redis.hGetAll(HIDDEN_NOMINATIONS_KEY);
    const hiddenSet = new Set(Object.keys(hiddenHash));

    // Which nomination memberKeys has the current user seconded?
    const secondedKey = `user_seconded:${currentUsername}`;
    const secondedHash = await redis.hGetAll(secondedKey);

    const nominations: Nomination[] = [];
    for (const memberKey of memberKeys) {
      const mem = memberKey.member;
      if (!modRequestingHidden && hiddenSet.has(mem)) continue;

      const nominationKey = `nomination:${mem}`;
      const data = await redis.hGetAll(nominationKey);

      if (Object.keys(data).length > 0) {
        const nom = data as unknown as Nomination;
        nom.currentUserHasSeconded = secondedHash[mem] === '1';
        if (modRequestingHidden) {
          nom.memberKey = mem;
          nom.hidden = hiddenSet.has(mem);
        }
        nominations.push(nom);
      }
    }

    res.json({
      success: true,
      data: nominations,
      total: nominations.length,
    });
  } catch (error) {
    console.error('Error fetching nominations:', error);
    res.status(500).json({
      error: getErrorMessage(error) || 'Failed to fetch nominations',
      success: false,
    });
  }
});

/**
 * Hide a nomination from public "Other Nominees" lists (mod only).
 */
router.post('/api/admin/hide-nomination', async (req, res): Promise<void> => {
  try {
    if (!(await isModeratorUser(req))) {
      res.status(403).json({ error: 'Moderator only', success: false });
      return;
    }
    const { memberKey } = req.body;
    if (typeof memberKey !== 'string' || !memberKey.trim()) {
      res.status(400).json({ error: 'memberKey required', success: false });
      return;
    }
    await redis.hSet(HIDDEN_NOMINATIONS_KEY, { [memberKey.trim()]: '1' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error hiding nomination:', error);
    res.status(500).json({
      error: getErrorMessage(error) || 'Failed to hide nomination',
      success: false,
    });
  }
});

/**
 * Unhide a nomination so it appears again in public lists (mod only).
 */
router.post('/api/admin/unhide-nomination', async (req, res): Promise<void> => {
  try {
    if (!(await isModeratorUser(req))) {
      res.status(403).json({ error: 'Moderator only', success: false });
      return;
    }
    const { memberKey } = req.body;
    if (typeof memberKey !== 'string' || !memberKey.trim()) {
      res.status(400).json({ error: 'memberKey required', success: false });
      return;
    }
    await redis.hDel(HIDDEN_NOMINATIONS_KEY, [memberKey.trim()]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error unhiding nomination:', error);
    res.status(500).json({
      error: getErrorMessage(error) || 'Failed to unhide nomination',
      success: false,
    });
  }
});

/**
 * List nominators with nomination counts (mod only).
 * sort=active: only non–shadow-banned, sorted by count desc.
 * sort=shadow_banned: only shadow-banned users (with their counts).
 */
router.get('/api/admin/nominators', async (req, res): Promise<void> => {
  try {
    if (!(await isModeratorUser(req))) {
      res.status(403).json({ error: 'Moderator only', success: false });
      return;
    }
    const sort = (req.query.sort as string) || 'active';
    const memberKeys = await redis.zRange('nominations:all', 0, -1, { by: 'rank' });
    const countByUser: Record<string, number> = {};
    for (const memberKey of memberKeys) {
      const data = await redis.hGetAll(`nomination:${memberKey.member}`);
      const user = data?.nominatedBy?.trim();
      if (user) {
        countByUser[user] = (countByUser[user] || 0) + 1;
      }
    }
    const bannedHash = await redis.hGetAll(SHADOW_BANNED_USERS_KEY);
    const bannedSet = new Set(Object.keys(bannedHash));
    const users = Object.entries(countByUser).map(([username, count]) => ({
      username,
      count,
      shadowBanned: bannedSet.has(username),
    }));
    if (sort === 'shadow_banned') {
      const list = users.filter((u) => u.shadowBanned).sort((a, b) => b.count - a.count);
      res.json({ success: true, data: list });
      return;
    }
    const list = users.filter((u) => !u.shadowBanned).sort((a, b) => b.count - a.count);
    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Error fetching nominators:', error);
    res.status(500).json({
      error: getErrorMessage(error) || 'Failed to fetch nominators',
      success: false,
    });
  }
});

/**
 * Shadow ban a user: no new submissions or seconds will be recorded (mod only).
 */
router.post('/api/admin/shadow-ban', async (req, res): Promise<void> => {
  try {
    if (!(await isModeratorUser(req))) {
      res.status(403).json({ error: 'Moderator only', success: false });
      return;
    }
    const { username } = req.body;
    const u = typeof username === 'string' ? username.trim().replace(/^t2_/, '') : '';
    if (!u) {
      res.status(400).json({ error: 'username required', success: false });
      return;
    }
    await redis.hSet(SHADOW_BANNED_USERS_KEY, { [u]: '1' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error shadow banning:', error);
    res.status(500).json({
      error: getErrorMessage(error) || 'Failed to shadow ban',
      success: false,
    });
  }
});

/**
 * Unban a user: resume recording submissions/seconds from now (mod only).
 */
router.post('/api/admin/unban', async (req, res): Promise<void> => {
  try {
    if (!(await isModeratorUser(req))) {
      res.status(403).json({ error: 'Moderator only', success: false });
      return;
    }
    const { username } = req.body;
    const u = typeof username === 'string' ? username.trim().replace(/^t2_/, '') : '';
    if (!u) {
      res.status(400).json({ error: 'username required', success: false });
      return;
    }
    await redis.hDel(SHADOW_BANNED_USERS_KEY, [u]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error unbanning:', error);
    res.status(500).json({
      error: getErrorMessage(error) || 'Failed to unban',
      success: false,
    });
  }
});

/**
 * Get overall event statistics
 */
router.get('/api/stats/event', async (_req, res): Promise<void> => {
  try {
    // Get all nominations
    const allMemberKeys = await redis.zRange('nominations:all', 0, -1, { by: 'rank' });

    const nominators = new Set<string>();
    const nominationsByAward: Record<string, number> = {};
    const nominationsByCategory: Record<string, number> = {};
    const postCounts: Record<string, { title: string; count: number }> = {};

    for (const memberKey of allMemberKeys) {
      const nominationKey = `nomination:${memberKey.member}`;
      const data = await redis.hGetAll(nominationKey);

      if (
        Object.keys(data).length > 0 &&
        data.nominatedBy &&
        data.category &&
        (data.title || data.postId)
      ) {
        nominators.add(data.nominatedBy);
        const awardId = data.category;
        nominationsByAward[awardId] = (nominationsByAward[awardId] || 0) + 1;
        const awardInfo = getAwardById(awardId);
        if (awardInfo) {
          const catId = awardInfo.category;
          nominationsByCategory[catId] = (nominationsByCategory[catId] || 0) + 1;
        }
        const id = (data.postId && data.postId.length > 0) ? data.postId : memberKey.member;
        if (!postCounts[id]) {
          postCounts[id] = { title: data.title || '(no title)', count: 0 };
        }
        postCounts[id].count += parseInt(data.voteCount || '1', 10);
      }
    }

    // Get top posts
    const topPosts = Object.entries(postCounts)
      .map(([postId, data]) => ({
        postId,
        title: data.title,
        nominationCount: data.count,
      }))
      .sort((a, b) => b.nominationCount - a.nominationCount)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        totalNominations: allMemberKeys.length,
        totalNominators: nominators.size,
        totalCategories: getAllCategories().length,
        nominationsByCategory,
        nominationsByAward,
        topPosts,
      },
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({
      error: getErrorMessage(error) || 'Failed to fetch event stats',
      success: false,
    });
  }
});

/**
 * Export nominations to CSV
 */
router.get('/api/export-csv', async (req, res): Promise<void> => {
  try {
    const { category } = req.query;

    // Get all nominations
    let memberKeys = await redis.zRange('nominations:all', 0, -1, { by: 'rank', reverse: true });

    // Filter by category if specified
    if (category && typeof category === 'string') {
      memberKeys = memberKeys.filter((key) => key.member.startsWith(`${category}:`));
    }

    // Build CSV (Layer 2: Thing Slug, Vote Count). Award = award id; Category = category id (the 6).
    const headers = [
      'Award',
      'Category',
      'Post Title',
      'Author',
      'Subreddit',
      'Karma',
      'URL',
      'Nominated By',
      'Reason',
      'Thing Slug',
      'Vote Count',
      'Timestamp',
    ];
    let csv = headers.join(',') + '\n';

    for (const memberKey of memberKeys) {
      const nominationKey = `nomination:${memberKey.member}`;
      const data = await redis.hGetAll(nominationKey);

      if (Object.keys(data).length > 0) {
        const awardInfo = data.category ? getAwardById(data.category) : undefined;
        const row = [
          data.category || '',
          awardInfo?.category || '',
          `"${(data.title || '').replace(/"/g, '""')}"`,
          data.author || '',
          data.subreddit || '',
          data.karma || '0',
          data.url || '',
          data.nominatedBy || '',
          `"${(data.nominationReason || '').replace(/"/g, '""')}"`,
          data.thingSlug || '',
          data.voteCount || '1',
          data.fetchedAt ? new Date(parseInt(data.fetchedAt)).toISOString() : '',
        ];
        csv += row.join(',') + '\n';
      }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="internet-awards-nominations-${Date.now()}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error('Error exporting nominations:', error);
    res.status(500).json({
      error: getErrorMessage(error) || 'Failed to export nominations',
      success: false,
    });
  }
});

/**
 * Delete all nominations (admin only - requires confirmation key)
 */
router.post('/api/delete', async (req, res): Promise<void> => {
  try {
    const { category, confirmationKey } = req.body;

    // Simple confirmation check (in production, use proper auth)
    if (confirmationKey !== 'DELETE_INTERNET_AWARDS_2026') {
      res.status(403).json({
        error: 'Invalid confirmation key',
        success: false,
      });
      return;
    }

    let deletedCount = 0;
    let memberKeys = await redis.zRange('nominations:all', 0, -1, { by: 'rank' });

    // Filter by category if specified
    if (category && typeof category === 'string') {
      memberKeys = memberKeys.filter((key) => key.member.startsWith(`${category}:`));
    }

    const usersToReset = new Set<string>();
    for (const memberKey of memberKeys) {
      const nominationKey = `nomination:${memberKey.member}`;
      const data = await redis.hGetAll(nominationKey);
      if (data?.nominatedBy) usersToReset.add(data.nominatedBy);
      await redis.del(nominationKey);
      await redis.zRem('nominations:all', [memberKey.member]);
      deletedCount++;
    }
    for (const username of usersToReset) {
      await redis.del(userNominationCountKey(username));
    }

    res.json({
      success: true,
      deletedCount,
    });
  } catch (error) {
    console.error('Error deleting nominations:', error);
    res.status(500).json({
      error: getErrorMessage(error) || 'Failed to delete nominations',
      success: false,
    });
  }
});

/**
 * Handle app installation
 */
router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    console.log('Internet Awards app installed successfully');
    res.json({
      status: 'success',
      message: 'Internet Awards app installed',
    });
  } catch (error) {
    console.error(`Error installing app: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to install app',
    });
  }
});

// Mount router

/**
 * Create new post (menu action)
 */
router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const subredditName = context.subredditName;
    if (!subredditName) {
      throw new Error('Subreddit name not found in context');
    }
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error('Error creating post:', getErrorMessage(error));
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

app.use(router);

/**
 * Internal API endpoints
 */

// Endpoint to create new post

// Start server with devvit web server
const port = getServerPort();
const server = createServer(app);
server.on('error', (err) => console.error(`Server error: ${err.stack}`));
server.listen(port);
console.log(`Server listening on port ${port}`);

// Prevent server crashes from unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', getErrorMessage(error));
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', getErrorMessage(reason));
});
