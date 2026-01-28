import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  return await reddit.submitCustomPost({
    subredditName: subredditName,
    title: '🎮 The Internet Awards - Day 1: Games & Hobbies',
    splash: {
      appDisplayName: 'The Internet Awards', // Required
      heading: '🎮 Day 1: Games & Hobbies',
      description: 'Nominate the best posts in gaming and hobbies for Reddit\'s Internet Awards!',
      buttonLabel: 'Start Nominating',
      backgroundUri: 'default-splash.png', // Optional: Place image in assets/ folder
      appIconUri: 'default-icon.png', // Optional: Custom app icon
      entryUri: 'index.html', // Which HTML file to load
    },
  });
};