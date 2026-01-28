import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  // Using HTML launch screen (splash.html) as default entry point
  return await reddit.submitCustomPost({
    subredditName: subredditName,
    title: '🏆 The Internet Awards',
    entry: 'default', // Points to splash.html (inline mode)
  });
};
