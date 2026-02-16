# Nominee Card Design: Reddit Post Mapping

Nominee list cards are structured to resemble Reddit post cards for consistency and familiarity.

## Reddit → Nominee Mapping

| Reddit element        | Our element              | Notes |
|-----------------------|--------------------------|--------|
| **Header row**        | Category pill + "Nominee" | Left-aligned. Category = award name (like subreddit/context). No avatar; we use award icon in pill or next to name. |
| **Post title**        | `nomination.title`       | Main line; bold, can wrap. Clickable when there’s a link. |
| **Post flairs**       | `secondLine`             | Author/sub/karma or reason snippet. Small, grey, below title. |
| **Thumbnail**         | `nom.thumbnail` or award icon | Top-right, fixed size, rounded. Aligned with title block (two-column content row). |
| **Action bar**        | Second + Link            | Single row: Second (arrow + "+1" / "Seconded!"), then Link. Vote count is **not** shown in UI. |
| **Vote score**        | `nom.voteCount`          | Stored and included in CSV export only; never displayed to users. |
| **Card boundary**     | Divider, not box         | Thin horizontal divider between cards; minimal or no heavy border. |

## Layout (Reddit-like)

1. **Content row (two columns)**  
   - **Left:** Header (category pill) → Title → Second line.  
   - **Right:** Thumbnail (fixed size, same vertical band as title).

2. **Action row (full width)**  
   - One horizontal row: Second (arrow + "+1" by default, "Seconded!" after tap; arrow turns orange when seconded) → Link (icon).

3. **Card container**  
   - Padding, optional very subtle background, `border-bottom` or gap between cards (no thick border).

4. **Pills**  
   - Category and Second use the same pill style (rounded, solid or subtle fill).

## Data

- **voteCount:** Stored in Redis and included in CSV export; **not** shown in the app UI (to avoid tipping scales).
- **secondLine:** `getNominationSecondLine(nom)` (author, sub, karma or reason).
- **Thumbnail:** Post image or category award icon when no image.
