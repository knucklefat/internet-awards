/**
 * Event Configuration Types
 * Defines the structure for The Internet Awards multi-day event
 * Naming: category = one of the 6 groups (e.g. Gaming & Hobbies); award = one of the 24 (e.g. S-Tier Game).
 */

export type AwardCategory = Award;

export interface Award {
  id: string;
  category: string; // id of the category (6 groups), e.g. "gaming-hobbies"
  name: string;
  emoji: string;
  description: string;
  /** Short instruction for LLM/resolve script: what to return (e.g. "Game Title", "Name of a subreddit") */
  resolutionGuidance?: string;
  /** Placeholder for the nominee name/description input on the nomination form (e.g. "e.g. Elden Ring, a game title") */
  nomineeNamePlaceholder?: string;
  bannerImage?: string;
  headerImage?: string; // Award header background for nomination page (1200x300px)
  headerTextAlign?: 'left' | 'right'; // Text alignment for header title (default: center)
  iconPath?: string; // Optional custom icon path (e.g., "/images/icons/awards/icon-award-A.png")
  cardColor?: string; // Background color for the card's top section
}

/** One of the 6 top-level categories (e.g. Gaming & Hobbies). Formerly "category group" / "award group". */
export interface Category {
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
  categories: Category[]; // The 6 groups
  awards: Award[]; // The 24 awards
}

/** @deprecated Use Category */
export type CategoryGroup = Category;

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
  /** True if at least one user has flagged this nomination; only in admin responses */
  flagged?: boolean;
}

export interface EventStats {
  totalNominations: number;
  totalNominators: number;
  totalCategories: number;
  nominationsByCategory: Record<string, number>; // category id (6) -> count
  nominationsByAward: Record<string, number>; // award id (24) -> count
  topPosts: Array<{
    postId: string;
    title: string;
    nominationCount: number;
  }>;
}

