# UI Performance Polish – fetchy-mcfetch

**Purpose:** Analysis of CSS and rendering patterns that can improve app responsiveness. Use this doc when the user refers to "UI performance polish" to plan or implement changes.

**Context:** Removing the white glow/drop shadow from award icons improved perceived performance. The recommendations below are in the same spirit: reduce expensive filters, shadows, and paint work, especially where many elements share the same costly styles.

---

## 1. Same Family as the Icon Change (Filters / Shadows)

### Main screen – award card icons (~25 cards)
- Each card still has **8× `drop-shadow()`** on `.award-icon-img` and **8× `text-shadow`** on `.award-icon > span` (black stroke).
- **Cost:** Many layers of `filter` and `text-shadow` on a grid of cards; compositing and repaints add up, especially on low-end/mobile WebViews.
- **Idea:** Reduce to 4 directions, or remove the stroke on mobile only (e.g. in a `@media (max-width: 767px)` block) so the main screen stays lighter when space is tight.

### Splash – logo (`splash.html`)
- `.logo img` uses **9× `drop-shadow()`** for the outline (same “stroke” pattern).
- **Cost:** One element, but the same kind of work as before; can matter on first paint.
- **Idea:** Fewer shadow directions, or drop the filter on very small viewports if the stroke isn’t critical there.

### Category group headers (6 sections)
- `.award-header` has a **3-layer `box-shadow`** (two glows + one solid).
- `.award-header-title` has **2× `text-shadow`** layers.
- **Cost:** Moderate; 6 headers × (box-shadow + text-shadow). Simpler shadows or removing the glow would reduce work.

---

## 2. Hover and Transition Cost

### Box-shadow on hover
- Award cards, “Nominate another”, related-award buttons, admin trigger, etc. use **`box-shadow` on `:hover`** (and sometimes `transform`).
- **Cost:** Changing `box-shadow` triggers layout/paint; it’s heavier than changing only `transform` or `opacity`.
- **Idea:** Prefer a thin `border` or a single, small `box-shadow` on hover instead of large/blurred glows.

### Transitions that include box-shadow
- e.g. `transition: opacity 0.2s ease, box-shadow 0.2s ease` on nomination thumbnails and similar.
- **Cost:** Animating `box-shadow` is more expensive than animating `transform`/`opacity`.
- **Idea:** Transition only `transform` and `opacity` where possible; keep `box-shadow` instant or use a very subtle shadow.

---

## 3. Repeated Background Texture

- **`.award-gradient-section::after`** uses `background-image: url('/images/patterns/texture.png')` on **every award card** (~25).
- **Cost:** Many elements with the same tiled background; can increase paint and memory.
- **Idea:** One shared texture layer behind the grid, or a smaller/simpler pattern; or disable texture on mobile.

---

## 4. List and Layout

- **List view** renders the full list with `nominations.map(...)` (no virtualization).
- **Cost:** Many DOM nodes and styles (e.g. category pills, thumbnails) when the list is long; scroll and interaction can get heavier.
- **Idea:** For very long lists, virtualize or paginate (submit view already shows 5 at a time; list view could do the same or use a “load more” pattern).

---

## 5. Splash

- **Background:** Full-bleed image + **30s `panBackground`** keyframe animation.
- **Cost:** Constant animation can keep the compositor busy; image size affects load and decode.
- **Idea:** Ensure the background image is appropriately sized/compressed; consider pausing or simplifying the animation when the tab isn’t visible (e.g. `prefers-reduced-motion` or pause when not focused).

---

## Summary (What to Try First)

| Priority | Area | Change |
|----------|------|--------|
| High | Main-screen award icons | Fewer stroke shadows or no stroke on mobile |
| High | Splash logo | Fewer `drop-shadow` directions or remove on small viewports |
| Medium | Category headers | Simpler or fewer box-shadow/text-shadow layers |
| Medium | Hover states | Prefer border or lighter box-shadow; avoid animating box-shadow |
| Medium | Award card texture | One shared texture layer or no texture on mobile |
| Lower | List view | Virtualize or paginate if lists get long |
| Lower | Splash | Optimize background image; consider reducing or pausing animation |

**Principle:** Reducing `filter` (and heavy `box-shadow`/`text-shadow`) on elements that are repeated many times or are always on screen tends to give the biggest wins in this app.
