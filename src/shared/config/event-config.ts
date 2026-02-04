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
    tagline: 'The Games we played. The Things we made.',
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
    tagline: 'Blessed be the Educators',
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
    name: 'S-Tier Gaming',
    emoji: '🎮',
    description: 'Greatest in-game or on video/stream moment in gaming',
    bannerImage: 'best-game.gif',
    headerImage: '/images/award-headers/best-gaming-moment.png',
    headerTextAlign: 'right',
    iconPath: '/images/icons/awards/Peak Gaming Moment Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)'
  },
  {
    id: 'holy-grail-collectible',
    categoryGroup: 'gaming-hobbies',
    name: 'Holy Grail',
    emoji: '🏆',
    description: 'The single most desirable collectible released in the past year',
    bannerImage: 'most-collectable.gif',
    headerImage: '/images/award-headers/holy-grail-collectible.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Holy Grail Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #4facfe 0%, #667eea 100%)'
  },
  {
    id: 'most-quotable-quote-fiction',
    categoryGroup: 'gaming-hobbies',
    name: 'Most Quotable',
    emoji: '💬',
    description: 'Book, short story, post, or other work of fiction most worth quoting',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/most-quotable-quote-fiction.png',
    headerTextAlign: 'right',
    iconPath: '/images/icons/awards/Most Quotable Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  },
  {
    id: 'best-artistic-creation',
    categoryGroup: 'gaming-hobbies',
    name: 'Artistic Masterpiece',
    emoji: '🎨',
    description: 'Best original artistic creation in art, design, or crafts',
    bannerImage: 'best-creation.gif',
    headerImage: '/images/award-headers/best-artistic-creation.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Artistic Masterpiece Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)'
  },

  // FUNNY & CUTE (4 awards)
  {
    id: 'funniest-original-content',
    categoryGroup: 'funny-cute',
    name: 'Comedic Gold',
    emoji: '😂',
    description: 'Funniest original humor skit, clip, or joke',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/funniest-original-content.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Comedy Gold Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #ffd93d 0%, #ff8c42 100%)'
  },
  {
    id: 'outstanding-aww',
    categoryGroup: 'funny-cute',
    name: 'Outstanding Aww',
    emoji: '🐾',
    description: 'Most adorable animal on the internet',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/outstanding-aww.png',
    headerTextAlign: 'right',
    iconPath: '/images/icons/awards/Outstanding Aww Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #ffafbd 0%, #ffc3a0 100%)'
  },
  {
    id: 'meme-won-internet',
    categoryGroup: 'funny-cute',
    name: 'Top Shelf Meme',
    emoji: '🔥',
    description: 'The meme that understood its assignment',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/meme-won-internet.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Top Shelf Meme Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)'
  },
  {
    id: 'wholesomest-moment',
    categoryGroup: 'funny-cute',
    name: 'Faith in Humanity Restorer',
    emoji: '❤️',
    description: 'Most wholesome moment or thing of the year',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/wholesomest-moment.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Faith in Humanity Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },

  // KNOWLEDGE (4 awards)
  {
    id: 'best-plot-twist',
    categoryGroup: 'knowledge',
    name: 'Real Life Plot Twist',
    emoji: '🤯',
    description: 'Most unexpected news/event in the past year',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/best-plot-twist.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Real Life Plot Twist Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #7b2ff7 0%, #1e3a8a 100%)'
  },
  {
    id: 'most-innovative-tech',
    categoryGroup: 'knowledge',
    name: 'Tech that Delivered',
    emoji: '🚀',
    description: 'Tech Innovation that lived up to the hype',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/most-innovative-tech.png',
    headerTextAlign: 'right',
    iconPath: '/images/icons/awards/Tech that Delivered Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)'
  },
  {
    id: 'breakthrough-scientific-discovery',
    categoryGroup: 'knowledge',
    name: 'Mind-Blowing Discovery',
    emoji: '🔬',
    description: 'Outstanding Research, discovery, or finding in a field of Science',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/breakthrough-scientific-discovery.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Mind-Blowing Discovery Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
  },
  {
    id: 'most-informative-episode',
    categoryGroup: 'knowledge',
    name: 'Most Digestable Data Dump',
    emoji: '🎙️',
    description: 'Most Informative episode (Podcast/Video/Stream) of the year',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/most-informative-episode.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Information Transfer Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #4776e6 0%, #8e54e9 100%)'
  },

  // LIFESTYLE & ADVICE (4 awards)
  {
    id: 'life-hack-changed-everything',
    categoryGroup: 'lifestyle-advice',
    name: 'Life-Changing Life Hack',
    emoji: '💡',
    description: 'A life hack that actually changed everything.',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/life-hack-changed-everything.png',
    headerTextAlign: 'right',
    iconPath: '/images/icons/awards/Life-Changing Life Hack Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #f7ff00 0%, #db36a4 100%)'
  },
  {
    id: 'destination-having-moment',
    categoryGroup: 'lifestyle-advice',
    name: 'Detour Destination',
    emoji: '✈️',
    description: 'Most underrated travel destination worth visiting',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/destination-having-moment.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Detour Destination Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #0acffe 0%, #495aff 100%)'
  },
  {
    id: 'best-fashion-style-trend',
    categoryGroup: 'lifestyle-advice',
    name: 'The Look',
    emoji: '👗',
    description: 'Style / fashion / beauty trend that dominated the discourse',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/best-fashion-style-trend.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/The Look Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  {
    id: 'best-original-dish',
    categoryGroup: 'lifestyle-advice',
    name: 'Chef\'s Kiss',
    emoji: '🍳',
    description: 'Best Culinary contribution this year',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/best-original-dish.png',
    headerTextAlign: 'right',
    iconPath: '/images/icons/awards/Chef\'s Kiss Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)'
  },

  // POP CULTURE (4 awards)
  {
    id: 'best-show-episode',
    categoryGroup: 'pop-culture',
    name: 'Redemption Arc',
    emoji: '📺',
    description: 'Best episode or story arc in a series',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/best-show-episode.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Redemption Arc Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #b92b27 0%, #1565c0 100%)'
  },
  {
    id: 'absolute-cinema-moment',
    categoryGroup: 'pop-culture',
    name: 'Absolute Cinema',
    emoji: '🎬',
    description: 'The film most worth talking about',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/absolute-cinema-moment.png',
    headerTextAlign: 'right',
    iconPath: '/images/icons/awards/Absolute Cinema Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #fdc830 0%, #f37335 100%)'
  },
  {
    id: 'best-sports-moment',
    categoryGroup: 'pop-culture',
    name: 'Peak Sports',
    emoji: '⚽',
    description: 'Best sports highlight',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/best-sports-moment.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Peak Sports Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)'
  },
  {
    id: 'hottest-earworm',
    categoryGroup: 'pop-culture',
    name: 'Hottest Earworm',
    emoji: '🎵',
    description: 'Best musical contribution',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/hottest-earworm.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Hottest Earworm Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)'
  },

  // THE INTERNET (5 awards)
  {
    id: 'community-moment',
    categoryGroup: 'the-internet',
    name: 'Community Moment',
    emoji: '🤝',
    description: 'The moment that brought a community and the internet together',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/community-moment.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Community Moment Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)'
  },
  {
    id: 'most-rewarding-rabbit-hole',
    categoryGroup: 'the-internet',
    name: 'The Rabbit Hole',
    emoji: '🐰',
    description: 'Deepest, most rewarding thread or thought-starter on the internet',
    bannerImage: 'internet-awards.gif',
    cardColor: 'linear-gradient(135deg, #5f72bd 0%, #9b23ea 100%)'
  },
  {
    id: 'best-channel-stream-podcast',
    categoryGroup: 'the-internet',
    name: 'Positive Influence',
    emoji: '🎙️',
    description: 'The channel/stream/podcast that had the best influence on internet discourse',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/best-channel-stream-podcast.png',
    headerTextAlign: 'right',
    iconPath: '/images/icons/awards/Positive Influence Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)'
  },
  {
    id: 'best-internet-trend',
    categoryGroup: 'the-internet',
    name: 'Viral Trend',
    emoji: '📈',
    description: 'The most memorable trend that spread across the internet',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/best-internet-trend.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Viral Trend Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)'
  },
  {
    id: 'most-quotable-ama',
    categoryGroup: 'the-internet',
    name: 'Ask Me Anything',
    emoji: '💭',
    description: 'The best Reddit AMA of the year',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/most-quotable-ama.png',
    headerTextAlign: 'right',
    iconPath: '/images/icons/awards/Ask Me Anything Award_80x80px@1x.png',
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
