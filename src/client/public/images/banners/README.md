# Category Banner Images

Place category-specific banner images in this directory with the following naming convention:

## File Names

You can use **PNG, JPG, or GIF** (including animated GIFs!):

### Category-Specific Banners
- `best-game.gif` ✅ - Best Game - Digital or Analog
- `most-collectable.gif` ✅ - Most Collectable Collectable
- `best-creation.gif` ✅ - Best Original Creation
- `best-story.gif` - Best Original Story

### Main Selection Screen Banner
- `internet-awards.gif` ✅ - Main category selection screen (replaces SVG)

## Specifications

- **Format**: GIF (animated supported!), PNG, or JPG
- **Dimensions**: 1200px × 300px (or similar aspect ratio, 4:1 ratio recommended)
- **File Size**: 
  - Static images: Keep under 500KB
  - Animated GIFs: Keep under 2MB for optimal loading
- **Animation**: Keep frame count reasonable (10-30 frames) for smooth performance

## Animated GIF Tips

- Use tools like Photoshop, After Effects, or online GIF makers
- Optimize with tools like ezgif.com to reduce file size
- Test on mobile to ensure smooth playback
- Consider loop count (infinite loop recommended)

## Fallback

The app will try to load banners in this order:
1. `/images/banners/{category-id}.gif`
2. `/images/banners/{category-id}.png`
3. `/images/internet-awards-banner.svg` (default banner)
4. Placeholder with gradient background

## Usage

The app automatically loads banners based on the selected category:
- Category selection screen: Shows default banner
- Nominations list: Shows category-specific banner
- Submit form: Shows category-specific banner

## How to Add Your GIF

1. Save your animated GIF to this directory
2. Name it according to the category ID (e.g., `best-game.gif`)
3. Deploy the app: `npm run deploy`
4. Create a new post to see the animated banner!

