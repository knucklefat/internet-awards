import express from 'express';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

/**
 * Extract post ID from Reddit URL
 */
function extractPostId(url: string): string | null {
  const patterns = [
    /reddit\.com\/r\/\w+\/comments\/([a-z0-9]+)/i,
    /redd\.it\/([a-z0-9]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Preview a post before submitting
 */
router.get('/api/preview-post', async (req, res): Promise<void> => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      res.status(400).json({
        error: 'Missing or invalid url parameter',
        success: false
      });
      return;
    }
    
    // Extract post ID from URL
    const postId = extractPostId(url);
    
    if (!postId) {
      res.status(400).json({
        error: 'Invalid Reddit URL format',
        success: false
      });
      return;
    }
    
    // Fetch the post from Reddit
    const post = await reddit.getPostById(`t3_${postId}`);
    
    if (!post) {
      res.status(404).json({
        error: 'Post not found',
        success: false
      });
      return;
    }
    
    // Return minimal preview data
    res.json({
      success: true,
      data: {
        title: post.title,
        thumbnail: post.thumbnail?.url || null
      }
    });
  } catch (error) {
    console.error('Error fetching post preview:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch post preview',
      success: false
    });
  }
});

/**
 * Submit a nomination (with category)
 */
router.post('/api/submit-nomination', async (req, res): Promise<void> => {
  try {
    const { postUrl, category, reason } = req.body;
    
    if (!postUrl) {
      res.status(400).json({
        error: 'Missing postUrl parameter',
        success: false
      });
      return;
    }

    if (!category) {
      res.status(400).json({
        error: 'Missing category parameter',
        success: false
      });
      return;
    }
    
    // Extract post ID from URL
    const postId = extractPostId(postUrl);
    
    if (!postId) {
      res.status(400).json({
        error: 'Invalid Reddit URL format',
        success: false
      });
      return;
    }
    
    console.log(`Fetching post data for ID: ${postId} in category: ${category}`);
    
    // Use Devvit's Reddit API to fetch post data
    const post = await reddit.getPostById(`t3_${postId}`);
    
    if (!post) {
      res.status(404).json({
        error: 'Post not found',
        success: false
      });
      return;
    }

    // Get nominator username from context
    const nominatedBy = context.username || 'anonymous';
    
    // Get thumbnail URL (if available)
    let thumbnailUrl = '';
    if (post.thumbnail && post.thumbnail.url) {
      thumbnailUrl = post.thumbnail.url;
    }

    // Create nomination object (all values must be strings for Redis hash)
    const nomination = {
      postId: post.id,
      title: post.title,
      author: post.authorName,
      subreddit: post.subredditName,
      karma: post.score.toString(),
      url: postUrl,
      category: category,
      nominatedBy: nominatedBy,
      nominationReason: reason || '',
      fetchedAt: Date.now().toString(),
      thumbnail: thumbnailUrl,
      permalink: post.permalink
    };
    
    // Store in Redis sorted set (using timestamp as score for chronological ordering)
    // Use a unique member key combining category and postId
    const memberKey = `${category}:${postId}`;
    await redis.zAdd('nominations', {
      member: memberKey,
      score: Date.now()
    });
    
    // Store the full nomination data in a hash (all values are now strings)
    await redis.hSet(`nomination:${memberKey}`, nomination);
    
    // Return formatted data
    res.json({
      success: true,
      data: {
        title: post.title,
        author: post.authorName,
        subreddit: `r/${post.subredditName}`,
        karma: post.score,
        category: category,
        nominatedBy: nominatedBy
      }
    });
    
  } catch (error) {
    console.error('Error submitting nomination:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    });
  }
});

/**
 * PUBLIC endpoint for fetching Reddit post data (for Google Sheets)
 * No auth required - this is the key!
 */
router.post('/api/fetch-post-data', async (req, res): Promise<void> => {
  // Add CORS headers to allow Google Sheets to call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  try {
    const { postUrl } = req.body;
    
    if (!postUrl) {
      res.status(400).json({
        error: 'Missing postUrl parameter',
        success: false
      });
      return;
    }
    
    // Extract post ID from URL
    const postId = extractPostId(postUrl);
    
    if (!postId) {
      res.status(400).json({
        error: 'Invalid Reddit URL format',
        success: false
      });
      return;
    }
    
    console.log(`Fetching post data for ID: ${postId}`);
    
    // Use Devvit's Reddit API to fetch post data
    const post = await reddit.getPostById(`t3_${postId}`);
    
    if (!post) {
      res.status(404).json({
        error: 'Post not found',
        success: false
      });
      return;
    }
    
    // Return formatted data for Google Sheets
    res.json({
      success: true,
      data: {
        title: post.title,
        author: post.authorName,
        subreddit: `r/${post.subredditName}`,
        karma: post.score,
        created: new Date(post.createdAt).toISOString(),
        url: postUrl
      }
    });
    
  } catch (error) {
    console.error('Error fetching post data:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    });
  }
});

/**
 * Handle OPTIONS for CORS preflight
 */
router.options('/api/fetch-post-data', (_req, res): void => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

/**
 * Get all nominations stored in Redis
 * PUBLIC - no auth required
 * Supports filtering by category via query param
 */
router.get('/api/nominations', async (req, res): Promise<void> => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const { category } = req.query;
    
    // Get all member keys from the sorted set (sorted by timestamp)
    const members = await redis.zRange('nominations', 0, -1, { by: 'rank' });
    
    // Fetch the full nomination data for each member
    const nominations = await Promise.all(
      members.map(async (item) => {
        try {
          const data = await redis.hGetAll(`nomination:${item.member}`);
          return data ? {
            ...data,
            karma: parseInt(data.karma || '0'),
            fetchedAt: parseInt(data.fetchedAt || '0')
          } : null;
        } catch (e) {
          console.error('Failed to fetch nomination:', e);
          return null;
        }
      })
    );
    
    let validNominations = nominations.filter(n => n !== null);
    
    // Filter by category if specified
    if (category && category !== 'all') {
      validNominations = validNominations.filter(n => n.category === category);
    }
    
    res.json({
      success: true,
      count: validNominations.length,
      nominations: validNominations
    });
    
  } catch (error) {
    console.error('Error fetching nominations:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    });
  }
});

/**
 * Export nominations as CSV
 * PUBLIC - no auth required
 */
router.get('/api/export-csv', async (req, res): Promise<void> => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="reddit-nominations.csv"');
  
  try {
    const { category } = req.query;
    
    // Get all member keys from the sorted set
    const members = await redis.zRange('nominations', 0, -1, { by: 'rank' });
    
    // Fetch the full nomination data for each member
    const nominations = await Promise.all(
      members.map(async (item) => {
        try {
          const data = await redis.hGetAll(`nomination:${item.member}`);
          return data ? {
            ...data,
            karma: parseInt(data.karma || '0'),
            fetchedAt: parseInt(data.fetchedAt || '0')
          } : null;
        } catch (e) {
          return null;
        }
      })
    );
    
    const validNominations = nominations.filter(n => n !== null);
    
    // Filter by category if specified
    const filtered = category && category !== 'all'
      ? validNominations.filter(n => n.category === category)
      : validNominations;
    
    // Create CSV
    let csv = 'Category,Post Title,Author,Subreddit,Karma,URL,Nominated By,Reason,Fetched At\n';
    
    filtered.forEach(nom => {
      const categoryName = nom.category || 'unknown';
      const title = `"${nom.title.replace(/"/g, '""')}"`;
      const author = nom.author;
      const subreddit = `r/${nom.subreddit}`;
      const karma = nom.karma;
      const url = nom.url;
      const nominatedBy = nom.nominatedBy || 'anonymous';
      const reason = `"${(nom.nominationReason || '').replace(/"/g, '""')}"`;
      const date = new Date(nom.fetchedAt).toISOString();
      
      csv += `${categoryName},${title},${author},${subreddit},${karma},${url},${nominatedBy},${reason},${date}\n`;
    });
    
    res.send(csv);
    
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).send('Error generating CSV');
  }
});

/**
 * Clear all nominations (for testing)
 */
router.delete('/api/nominations', async (_req, res): Promise<void> => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Get all member keys
    const members = await redis.zRange('nominations', 0, -1, { by: 'rank' });
    
    // Delete all nomination hashes
    for (const item of members) {
      await redis.del(`nomination:${item.member}`);
    }
    
    // Delete the sorted set
    await redis.del('nominations');
    
    res.json({
      success: true,
      message: `Cleared ${members.length} nominations`
    });
    
  } catch (error) {
    console.error('Error clearing nominations:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false
    });
  }
});

/**
 * Health check endpoint - PUBLIC
 */
router.get('/api/health', (_req, res): void => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    status: 'ok',
    service: 'The Internet Awards',
    timestamp: new Date().toISOString()
  });
});

// Menu and trigger handlers
router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();
    
    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();
    
    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Use router middleware
app.use(router);

// Start server
const port = getServerPort();
const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);

console.log(`🚀 The Internet Awards server running on port ${port}`);