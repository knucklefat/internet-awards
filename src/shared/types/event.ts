/**
 * Event Configuration Types
 * Defines the structure for The Internet Awards multi-day event
 */

export interface AwardCategory {
  id: string;
  categoryGroup: string; // e.g., "Games & Hobbies"
  name: string;
  emoji: string;
  description: string;
  bannerImage?: string;
  headerImage?: string; // Award header background for nomination page (1200x300px)
  headerTextAlign?: 'left' | 'right'; // Text alignment for header title (default: center)
  iconPath?: string; // Optional custom icon path (e.g., "/images/icons/awards/icon-award-A.png")
  cardColor?: string; // Background color for the card's top section
}

export interface CategoryGroup {
  id: string;
  name: string;
  tagline: string; // Short catchy phrase
  description: string;
  emoji: string;
  accentColor?: string;
}

export interface EventConfig {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  categories: AwardCategory[];
  categoryGroups: CategoryGroup[];
}

export interface Nomination {
  postId: string;
  title: string;
  author: string;
  subreddit: string;
  karma: string;
  url: string;
  category: string;       // Category ID
  nominatedBy: string;
  nominationReason?: string;
  fetchedAt: string;
  thumbnail?: string;
  permalink?: string;
}

export interface EventStats {
  totalNominations: number;
  totalNominators: number;
  totalCategories: number;
  nominationsByCategory: Record<string, number>;
  nominationsByCategoryGroup: Record<string, number>;
  topPosts: Array<{
    postId: string;
    title: string;
    nominationCount: number;
  }>;
}

