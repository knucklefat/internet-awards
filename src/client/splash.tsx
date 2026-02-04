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
    'Meme',
    'Plot Twist',
    'Gut Buster',
    'Creation',
    'Rabbit Hole',
    'Technology',
    'Life Hack',
    'Highlight',
    'Tutorial'
  ];
  let currentIndex = 0;
  const rotatingWordElement = document.getElementById('rotating-word');

  if (rotatingWordElement) {
    function rotateWord() {
      // Fade out
      rotatingWordElement.style.opacity = '0';
      
      setTimeout(() => {
        // Change word
        currentIndex = (currentIndex + 1) % words.length;
        rotatingWordElement.textContent = words[currentIndex];
        
        // Fade in
        rotatingWordElement.style.opacity = '1';
      }, 300);
    }

    // Rotate every 5 seconds
    setInterval(rotateWord, 5000);
  }
});
