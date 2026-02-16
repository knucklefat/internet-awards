import { requestExpandedMode } from '@devvit/web/client';

document.addEventListener('DOMContentLoaded', () => {
  const launchButton = document.getElementById('launch-button');

  if (launchButton) {
    launchButton.addEventListener('click', async (event) => {
      try {
        // Request to expand into the main app
        await requestExpandedMode(event, 'main');
      } catch (error) {
        console.error('Failed to launch app:', error);
      }
    });
  }

  // Rotating word animation
  const words = [
    'Moment',
    'Masterpiece',
    'Plot Twist',
    'Gut Buster',
    'Ear Worm',
    'Plot Twist',
    'Technology',
    'Life Hack',
    'Hot Take',
    'Tutorial'
  ];
  let currentIndex = 0;
  const rotatingWordElement = document.getElementById('rotating-word');
  const rotatingTextElement = rotatingWordElement?.querySelector('.rotating-text');

  if (rotatingTextElement) {
    function rotateWord() {
      // Fade out only the text (line stays visible)
      rotatingTextElement.style.opacity = '0';

      setTimeout(() => {
        // Change word
        currentIndex = (currentIndex + 1) % words.length;
        rotatingTextElement.textContent = words[currentIndex];

        // Fade in
        rotatingTextElement.style.opacity = '1';
      }, 700);
    }

    // Rotate every 3 seconds
    setInterval(rotateWord, 3000);
  }
});
