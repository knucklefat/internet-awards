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
  /** Short instruction for LLM/resolve script: what to return (e.g. "Game Title", "Name of a subreddit") */
  resolutionGuidance?: string;
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
  /** Reddit post ID when nomination includes a link; empty for link-free submissions */
  postId?: string;
  /** User's name/description (first form field); always set */
  title: string;
  /** Post title from Reddit when nomination includes a post link; empty for link-free */
  postTitle?: string;
  /** Reddit author when nomination includes a link */
  author?: string;
  subreddit?: string;
  karma?: string;
  /** Reddit post URL when provided (optional for link-free) */
  url?: string;
  category: string;
  nominatedBy: string;
  nominationReason?: string;
  fetchedAt: string;
  thumbnail?: string;
  permalink?: string;
  /** Number of "nominate too" votes */
  voteCount?: string;
  /** Normalized slug for link-free dedupe and "nominate too" (Layer 2) */
  thingSlug?: string;
  /** True if the current user has seconded this nomination (for UI highlight) */
  currentUserHasSeconded?: boolean;
  /** Redis member key (e.g. category:postId); only in admin responses */
  memberKey?: string;
  /** True if mod hid this from public lists; only in admin responses */
  hidden?: boolean;
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

