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

// All Award Categories (24 total) – finalized names, descriptions, resolution guidance
export const AWARD_CATEGORIES: AwardCategory[] = [
  // GAMING & HOBBIES (4 awards)
  {
    id: 'best-gaming-moment',
    categoryGroup: 'gaming-hobbies',
    name: 'S-Tier Game',
    emoji: '🎮',
    description: 'Greatest, most enjoyable overall gaming experience',
    resolutionGuidance: 'Game Title',
    bannerImage: 'best-game.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_S-Tier Gaming Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Peak Gaming Moment Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)'
  },
  {
    id: 'holy-grail-collectible',
    categoryGroup: 'gaming-hobbies',
    name: 'Holy Grail',
    emoji: '🏆',
    description: 'The most desirable collectible released in the past year',
    resolutionGuidance: 'Title of Something that people collect',
    bannerImage: 'most-collectable.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Holy Grail Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Holy Grail Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #4facfe 0%, #667eea 100%)'
  },
  {
    id: 'best-artistic-creation',
    categoryGroup: 'gaming-hobbies',
    name: 'Artistic Masterpiece',
    emoji: '🎨',
    description: 'Best original artistic creation',
    resolutionGuidance: 'Link or image of a Piece of art',
    bannerImage: 'best-creation.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Artistic Masterpiece Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Artistic Masterpiece Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)'
  },
  {
    id: 'most-quotable-quote-fiction',
    categoryGroup: 'gaming-hobbies',
    name: 'Most Quotable',
    emoji: '💬',
    description: 'Work of fiction most worth quoting',
    resolutionGuidance: 'Literary Title or Author',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Most Quotable Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Most Quotable Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  },

  // FUNNY & CUTE (4 awards)
  {
    id: 'funniest-original-content',
    categoryGroup: 'funny-cute',
    name: 'Comedy Gold',
    emoji: '😂',
    description: 'Funniest original humor skit, comic, or joke',
    resolutionGuidance: 'Title of a published comic or Comedian',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Comedy Gold Award_1200x300px@2x.png',
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
    resolutionGuidance: 'Specific animal',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Outstanding Aww Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Outstanding Aww Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #ffafbd 0%, #ffc3a0 100%)'
  },
  {
    id: 'meme-won-internet',
    categoryGroup: 'funny-cute',
    name: 'Top Shelf Meme',
    emoji: '🔥',
    description: 'Meme that understood the assignment',
    resolutionGuidance: 'Single Meme',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Top Shelf Meme Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Top Shelf Meme Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)'
  },
  {
    id: 'wholesomest-moment',
    categoryGroup: 'funny-cute',
    name: 'Faith in Humanity',
    emoji: '❤️',
    description: 'Most wholesome or heartwarming piece of content',
    resolutionGuidance: 'Title or Description of a piece of content',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Faith in Humanity Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Faith in Humanity Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },

  // KNOWLEDGE (4 awards)
  {
    id: 'best-plot-twist',
    categoryGroup: 'knowledge',
    name: 'Deepest Learning',
    emoji: '🤯',
    description: 'Deepest, most rewarding thread or thought-starter on the internet',
    resolutionGuidance: 'Title or Description of a subject',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Real Life Plot Twist Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Real Life Plot Twist Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #7b2ff7 0%, #1e3a8a 100%)'
  },
  {
    id: 'most-innovative-tech',
    categoryGroup: 'knowledge',
    name: 'Tech that Delivered',
    emoji: '🚀',
    description: 'Tech innovation that lived up to the hype',
    resolutionGuidance: 'Title of a technology or name of company',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Tech that Delivered Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Tech that Delivered Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)'
  },
  {
    id: 'breakthrough-scientific-discovery',
    categoryGroup: 'knowledge',
    name: 'Mind-Blowing Discovery',
    emoji: '🔬',
    description: 'Research, discovery, or finding in a field of science',
    resolutionGuidance: 'Title or description of subject',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Mind-Blowing Discovery Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Mind-Blowing Discovery Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
  },
  {
    id: 'most-informative-episode',
    categoryGroup: 'knowledge',
    name: 'Stream of Consciousness',
    emoji: '🎙️',
    description: 'Most Informative episode this past year',
    resolutionGuidance: 'Title of a podcast, stream, or streamer',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Information Transfer Award_1200x300px@2x.png',
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
    resolutionGuidance: 'Title or Description',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Life-Changing Life Hack Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Life-Changing Life Hack Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #f7ff00 0%, #db36a4 100%)'
  },
  {
    id: 'destination-having-moment',
    categoryGroup: 'lifestyle-advice',
    name: 'Pinned Destination',
    emoji: '✈️',
    description: 'Travel destination worth every step of the trip',
    resolutionGuidance: 'Name of a physical location',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Detour Destination Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Detour Destination Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #0acffe 0%, #495aff 100%)'
  },
  {
    id: 'best-fashion-style-trend',
    categoryGroup: 'lifestyle-advice',
    name: 'The Look',
    emoji: '👗',
    description: 'Style trend that dominated the discourse',
    resolutionGuidance: 'Name of a style or brand',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_The Look Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/The Look Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  {
    id: 'best-original-dish',
    categoryGroup: 'lifestyle-advice',
    name: 'Chef\'s Kiss',
    emoji: '🍳',
    description: 'Most impressive culinary contribution',
    resolutionGuidance: 'Title or description of a recipe, dish, or drink',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Chef\'s Kiss Award_1200x300px@2x.png',
    headerTextAlign: 'left',
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
    resolutionGuidance: 'Title of a show and/or episode of a show',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Redemption Arc Award_1200x300px@2x.png',
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
    resolutionGuidance: 'Title of a Movie',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Absolute Cinema Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Absolute Cinema Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #fdc830 0%, #f37335 100%)'
  },
  {
    id: 'best-sports-moment',
    categoryGroup: 'pop-culture',
    name: 'Peak Sports',
    emoji: '⚽',
    description: 'Best highlight or moment in sports',
    resolutionGuidance: 'Title or description of an athletic team, player or game',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Peak Sports Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Peak Sports Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)'
  },
  {
    id: 'hottest-earworm',
    categoryGroup: 'pop-culture',
    name: 'Hottest Earworm',
    emoji: '🎵',
    description: 'The song you still can\'t stop listening to',
    resolutionGuidance: 'Title of a song or musical artist',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Hottest Earworm Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Hottest Earworm Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)'
  },

  // THE INTERNET (4 awards)
  {
    id: 'community-moment',
    categoryGroup: 'the-internet',
    name: 'Community of the Moment',
    emoji: '🤝',
    description: 'A community that brought the internet together',
    resolutionGuidance: 'Name of a subreddit or community',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Community Moment Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Community Moment Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)'
  },
  {
    id: 'best-channel-stream-podcast',
    categoryGroup: 'the-internet',
    name: 'Positive Influence',
    emoji: '🎙️',
    description: 'A channel, stream, or podcast moment that had a positive effect',
    resolutionGuidance: 'Title or name of a podcast, podcaster or streamer',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Positive Influence Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Positive Influence Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)'
  },
  {
    id: 'best-internet-trend',
    categoryGroup: 'the-internet',
    name: 'Viral Trend',
    emoji: '📈',
    description: 'The most memorable trend that spread across the internet',
    resolutionGuidance: 'Name or Description of an internet trend',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Viral Trend Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Viral Trend Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)'
  },
  {
    id: 'most-quotable-ama',
    categoryGroup: 'the-internet',
    name: 'Ask Me Anything',
    emoji: '💭',
    description: 'The AMA most worth reading',
    resolutionGuidance: 'Title or name or reddit post title',
    bannerImage: 'internet-awards.gif',
    headerImage: '/images/award-headers/The Internet Awards_Award Banner_Ask Me Anything Award_1200x300px@2x.png',
    headerTextAlign: 'left',
    iconPath: '/images/icons/awards/Ask Me Anything Award_80x80px@1x.png',
    cardColor: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
  },
];

// Main Event Configuration
export const INTERNET_AWARDS_EVENT: EventConfig = {
  name: 'The Internet Awards 2026',
  description: 'Celebrating the best of Reddit - 24 Awards in 6 categories over 3 days',
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
