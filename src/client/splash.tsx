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
});
