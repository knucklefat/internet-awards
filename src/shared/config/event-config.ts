/**
 * The Internet Awards - Event Configuration
 * Single 3-Day Event with 6 Category Groups
 */

import { EventConfig, CategoryGroup, AwardCategory } from '../types/event';

// Category Groups
export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'gaming-hobbies',
    name: 'Gaming & Hobbies',
    tagline: 'The Games we played. The things we made. The legends we forged on the quest for a trade.',
    description: 'From technological breakthroughs, to passions turned side hustles turned careers, this category celebrates the builders, players, and makers who made our world their playground.',
    emoji: '🎮',
    accentColor: '#ff6b6b',
  },
  {
    id: 'funny-cute',
    name: 'Funny & Cute',
    tagline: 'Live. Laugh. Cuddle.',
    description: 'From belly laughs to heartwarming awws, this category honors the content that brought joy, spread smiles, and reminded us that the internet can be a delightful place.',
    emoji: '😂',
    accentColor: '#ffd93d',
  },
  {
    id: 'knowledge',
    name: 'Knowledge',
    tagline: 'The more you know',
    description: 'In celebration of the thinkers, the teachers, and the everyday experts that turned curiosity into connection.',
    emoji: '🧠',
    accentColor: '#3282b8',
  },
  {
    id: 'lifestyle-advice',
    name: 'Lifestyle & Advice',
    tagline: 'Words to live by',
    description: 'Reddit has always been home to real people helping real people. This category honors the wisdom, encouragement, support, and honesty that made us better humans.',
    emoji: '💡',
    accentColor: '#00adb5',
  },
  {
    id: 'pop-culture',
    name: 'Pop Culture',
    tagline: 'For the Culture',
    description: 'From binge-worthy shows to unforgettable sports moments, this category celebrates the entertainment and media that dominated our screens, playlists, and conversations.',
    emoji: '🎬',
    accentColor: '#ea5455',
  },
  {
    id: 'the-internet',
    name: 'The Internet',
    tagline: 'The Heart of the Internet',
    description: 'Celebrating the communities, trends, and moments that made Reddit the front page of the internet—where strangers became friends and ideas became movements.',
    emoji: '🌐',
    accentColor: '#ff6b6b',
  },
];

// All Award Categories (25 total)
export const AWARD_CATEGORIES: AwardCategory[] = [
  // GAMING & HOBBIES (4 awards)
  {
    id: 'best-gaming-moment',
    categoryGroup: 'gaming-hobbies',
    name: 'Best Gaming Moment',
    emoji: '🎮',
    description: 'The most memorable, epic, or entertaining gaming moment shared on Reddit',
    bannerImage: 'best-game.gif',
    iconPath: '/images/icons/awards/icon-award-A.png',
    cardColor: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)'
  },
  {
    id: 'holy-grail-collectible',
    categoryGroup: 'gaming-hobbies',
    name: 'Holy Grail Collectible',
    emoji: '🏆',
    description: 'The most coveted, rare, or impressive collectible discovered or shared',
    bannerImage: 'most-collectable.gif',
    iconPath: '/images/icons/awards/icon-award-B.png',
    cardColor: 'linear-gradient(135deg, #4facfe 0%, #667eea 100%)'
  },
  {
    id: 'most-quotable-quote-fiction',
    categoryGroup: 'gaming-hobbies',
    name: 'Most Quotable Quote (fiction)',
    emoji: '💬',
    description: 'The most memorable line from games, books, or creative fiction',
    bannerImage: 'internet-awards.gif',
    iconPath: '/images/icons/awards/icon-award-C.png',
    cardColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  },
  {
    id: 'best-artistic-creation',
    categoryGroup: 'gaming-hobbies',
    name: 'Best Artistic Creation',
    emoji: '🎨',
    description: 'The most impressive artistic work, from digital art to handmade crafts',
    bannerImage: 'best-creation.gif',
    iconPath: '/images/icons/awards/icon-award-D.png',
    cardColor: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)'
  },

  // FUNNY & CUTE (4 awards)
  {
    id: 'funniest-original-content',
    categoryGroup: 'funny-cute',
    name: 'Funniest Original Content',
    emoji: '😂',
    description: 'The post that made Reddit laugh the hardest',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #ffd93d 0%, #ff8c42 100%)'
  },
  {
    id: 'outstanding-aww',
    categoryGroup: 'funny-cute',
    name: 'Outstanding Aww',
    emoji: '🐾',
    description: 'The most adorable animal on the internet',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #ffafbd 0%, #ffc3a0 100%)'
  },
  {
    id: 'meme-won-internet',
    categoryGroup: 'funny-cute',
    name: 'Meme that won the Internet',
    emoji: '🔥',
    description: 'The meme that spread like wildfire and defined the year',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)'
  },
  {
    id: 'wholesomest-moment',
    categoryGroup: 'funny-cute',
    name: 'The Wholesomest Moment',
    emoji: '❤️',
    description: 'The most heartwarming piece of content that restored faith in humanity',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },

  // KNOWLEDGE (4 awards)
  {
    id: 'best-plot-twist',
    categoryGroup: 'knowledge',
    name: 'Best Plot Twist',
    emoji: '🤯',
    description: 'The most unexpected news or event that shocked Reddit',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #7b2ff7 0%, #1e3a8a 100%)'
  },
  {
    id: 'most-innovative-tech',
    categoryGroup: 'knowledge',
    name: 'Most Innovative Tech',
    emoji: '🚀',
    description: 'The technological breakthrough or innovation that changed the game',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)'
  },
  {
    id: 'breakthrough-scientific-discovery',
    categoryGroup: 'knowledge',
    name: 'Breakthrough Scientific Discovery',
    emoji: '🔬',
    description: 'The scientific discovery or research that expanded our understanding',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
  },
  {
    id: 'most-informative-episode',
    categoryGroup: 'knowledge',
    name: 'Most Informative Episode',
    emoji: '🎙️',
    description: 'The podcast, video, or stream episode that educated and enlightened',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #4776e6 0%, #8e54e9 100%)'
  },

  // LIFESTYLE & ADVICE (4 awards)
  {
    id: 'life-hack-changed-everything',
    categoryGroup: 'lifestyle-advice',
    name: 'Life Hack That Actually Changed Everything',
    emoji: '💡',
    description: 'The practical tip or advice that genuinely improved lives',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #f7ff00 0%, #db36a4 100%)'
  },
  {
    id: 'destination-having-moment',
    categoryGroup: 'lifestyle-advice',
    name: 'Destination Having Its Moment',
    emoji: '✈️',
    description: 'The travel destination where everyone suddenly went',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #0acffe 0%, #495aff 100%)'
  },
  {
    id: 'best-fashion-style-trend',
    categoryGroup: 'lifestyle-advice',
    name: 'Best Fashion/Style Trend',
    emoji: '👗',
    description: 'The fashion trend or style moment that defined the year',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  {
    id: 'best-original-dish',
    categoryGroup: 'lifestyle-advice',
    name: 'Best Original Dish',
    emoji: '🍳',
    description: 'The most creative, delicious, or impressive original recipe',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)'
  },

  // POP CULTURE (4 awards)
  {
    id: 'best-show-episode',
    categoryGroup: 'pop-culture',
    name: 'Best Show Episode',
    emoji: '📺',
    description: 'The TV episode that had everyone talking',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #b92b27 0%, #1565c0 100%)'
  },
  {
    id: 'absolute-cinema-moment',
    categoryGroup: 'pop-culture',
    name: 'Absolute Cinema Moment',
    emoji: '🎬',
    description: 'The movie scene or moment that was pure cinematic perfection',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #fdc830 0%, #f37335 100%)'
  },
  {
    id: 'best-sports-moment',
    categoryGroup: 'pop-culture',
    name: 'Best Sports Moment',
    emoji: '⚽',
    description: 'The sports highlight or achievement that amazed the world',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)'
  },
  {
    id: 'hottest-earworm',
    categoryGroup: 'pop-culture',
    name: 'Hottest Earworm',
    emoji: '🎵',
    description: 'The song that got stuck in everyone\'s head',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)'
  },

  // THE INTERNET (5 awards)
  {
    id: 'community-moment',
    categoryGroup: 'the-internet',
    name: 'Community Moment',
    emoji: '🤝',
    description: 'The moment when a community came together and made magic happen',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)'
  },
  {
    id: 'most-rewarding-rabbit-hole',
    categoryGroup: 'the-internet',
    name: 'Most Rewarding Rabbit Hole',
    emoji: '🐰',
    description: 'The deep dive or thread that was worth every minute spent',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #5f72bd 0%, #9b23ea 100%)'
  },
  {
    id: 'best-channel-stream-podcast',
    categoryGroup: 'the-internet',
    name: 'Best Channel/Stream/Podcast',
    emoji: '🎙️',
    description: 'The content creator or show that consistently delivered excellence',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)'
  },
  {
    id: 'best-internet-trend',
    categoryGroup: 'the-internet',
    name: 'Best Internet Trend',
    emoji: '📈',
    description: 'The trend that swept across the internet and brought joy',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)'
  },
  {
    id: 'most-quotable-ama',
    categoryGroup: 'the-internet',
    name: 'Most Quotable AMA',
    emoji: '💭',
    description: 'The Ask Me Anything session filled with memorable quotes and wisdom',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
  },
];

// Main Event Configuration
export const INTERNET_AWARDS_EVENT: EventConfig = {
  name: 'The Internet Awards 2026',
  description: 'Celebrating the best of Reddit - 25 Awards in 6 categories over 3 days',
  startDate: '2026-02-01', // TBD
  endDate: '2026-02-03',   // TBD
  categories: AWARD_CATEGORIES,
  categoryGroups: CATEGORY_GROUPS,
};

// Helper Functions
export function getCategoryById(categoryId: string): AwardCategory | undefined {
  return AWARD_CATEGORIES.find(cat => cat.id === categoryId);
}

export function getCategoryGroupById(groupId: string): CategoryGroup | undefined {
  return CATEGORY_GROUPS.find(group => group.id === groupId);
}

export function getCategoriesByGroup(groupId: string): AwardCategory[] {
  return AWARD_CATEGORIES.filter(cat => cat.categoryGroup === groupId);
}

export function getAllCategories(): AwardCategory[] {
  return AWARD_CATEGORIES;
}

export function getAllCategoryGroups(): CategoryGroup[] {
  return CATEGORY_GROUPS;
}
