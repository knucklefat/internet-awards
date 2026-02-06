import express from 'express';
import { cache, redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import {
  INTERNET_AWARDS_EVENT,
  getCategoryById,
  getAllCategories,
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
 * Extract post ID from Reddit URL
 */
function extractPostId(url: string): string | undefined {
  const patterns = [/reddit\.com\/r\/\w+\/comments\/([a-z0-9]+)/i, /redd\.it\/([a-z0-9]+)/i];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
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

/**
 * Check if current user is a moderator
 */
router.get('/api/user/is-moderator', async (req, res): Promise<void> => {
  try {
    const username = req.context?.username || context.username;
    const subredditName =
      req.context?.subredditName || context.subredditName || context.subredditId;

    if (!username) {
      res.json({
        success: true,
        isModerator: false,
        debug: {
          username,
          subredditName,
          reason: 'Missing username',
        },
      });
      return;
    }

    if (!subredditName) {
      res.json({
        success: true,
        isModerator: false,
        debug: {
          username,
          subredditName,
          reason: 'Missing subreddit',
        },
      });
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

    res.json({
      success: true,
      isModerator,
      debug: {
        username,
        subredditName,
        moderatorCount: moderatorUsernames.length,
        moderators: moderatorUsernames,
        checkedUsername: username,
      },
    });
  } catch (error) {
    console.error('[MOD CHECK] Error:', error);
    res.json({
      success: true,
      isModerator: false,
      debug: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
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
        categoryGroups: INTERNET_AWARDS_EVENT.categoryGroups,
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

    const postId = extractPostId(url);

    if (!postId) {
      res.status(400).json({
        error: 'Invalid Reddit URL format',
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

    const categoryInfo = getCategoryById(category);
    if (!categoryInfo) {
      res.status(400).json({
        error: 'Invalid category',
        success: false,
      });
      return;
    }

    const nominatedBy = req.context?.username || 'anonymous';
    const hasLink = typeof postUrl === 'string' && postUrl.trim().length > 0;
    const title = typeof bodyTitle === 'string' ? bodyTitle.trim() : '';
    const thingSlugParam = typeof bodyThingSlug === 'string' ? bodyThingSlug.trim() : '';

    if (hasLink) {
      // Link-based flow: validate URL, fetch post, use category:postId identity
      const postId = extractPostId(postUrl);
      if (!postId) {
        res.status(400).json({
          error: 'Invalid Reddit URL format',
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

      let thumbnailUrl = '';
      if (post.thumbnail && post.thumbnail.url) {
        thumbnailUrl = post.thumbnail.url;
      }

      const memberKey = `${category}:${postId}`;
      const nominationKey = `nomination:${memberKey}`;
      const existing = await redis.hGetAll(nominationKey);

      if (Object.keys(existing).length > 0) {
        const currentVoteCount = parseInt(existing.voteCount || '1');
        const newVoteCount = currentVoteCount + 1;
        await redis.hSet(nominationKey, { voteCount: newVoteCount.toString() });
        res.json({
          success: true,
          isAdditionalVote: true,
          voteCount: newVoteCount,
          data: existing,
        });
        return;
      }

      const nomination: Record<string, string> = {
        postId: post.id,
        title: post.title,
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
        const currentVoteCount = parseInt(existing.voteCount || '1');
        const newVoteCount = currentVoteCount + 1;
        await redis.hSet(nominationKey, { voteCount: newVoteCount.toString() });
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
      const currentVoteCount = parseInt(existing.voteCount || '1');
      const newVoteCount = currentVoteCount + 1;
      await redis.hSet(nominationKey, { voteCount: newVoteCount.toString() });
      res.json({
        success: true,
        isAdditionalVote: true,
        voteCount: newVoteCount,
        data: existing,
      });
      return;
    }

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
 * Get nominations (filtered by category)
 */
router.get('/api/nominations', async (req, res): Promise<void> => {
  try {
    const { category } = req.query;

    // Get all nominations from sorted set
    let memberKeys = await redis.zRange('nominations:all', 0, -1, { by: 'rank', reverse: true });

    // Filter by category if specified
    if (category && typeof category === 'string') {
      memberKeys = memberKeys.filter((key) => key.member.startsWith(`${category}:`));
    }

    // Fetch nomination details
    const nominations: Nomination[] = [];
    for (const memberKey of memberKeys) {
      const nominationKey = `nomination:${memberKey.member}`;
      const data = await redis.hGetAll(nominationKey);

      if (Object.keys(data).length > 0) {
        nominations.push(data as unknown as Nomination);
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
 * Get overall event statistics
 */
router.get('/api/stats/event', async (_req, res): Promise<void> => {
  try {
    // Get all nominations
    const allMemberKeys = await redis.zRange('nominations:all', 0, -1, { by: 'rank' });

    const nominators = new Set<string>();
    const nominationsByCategory: Record<string, number> = {};
    const nominationsByCategoryGroup: Record<string, number> = {};
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
        const category = data.category;
        nominationsByCategory[category] = (nominationsByCategory[category] || 0) + 1;
        const categoryInfo = getCategoryById(category);
        if (categoryInfo) {
          const group = categoryInfo.categoryGroup;
          nominationsByCategoryGroup[group] = (nominationsByCategoryGroup[group] || 0) + 1;
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
        nominationsByCategoryGroup,
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

    // Build CSV (Layer 2: Thing Slug, Vote Count)
    const headers = [
      'Category',
      'Category Group',
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
        const categoryInfo = data.category ? getCategoryById(data.category) : undefined;
        const row = [
          data.category || '',
          categoryInfo?.categoryGroup || '',
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

    for (const memberKey of memberKeys) {
      const nominationKey = `nomination:${memberKey.member}`;
      await redis.del(nominationKey);
      await redis.zRem('nominations:all', [memberKey.member]);
      deletedCount++;
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
