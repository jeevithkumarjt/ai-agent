/* ==========================================================================
   Voice UI — Background demo (preview/background-demo.js)
   --------------------------------------------------------------------------
   DEV ONLY. Instantiates the VoiceBackground module into #bg-root on the
   background preview page. Never shipped to WordPress.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.getElementById('bg-root');
  if (!root) return;
  if (!window.VUI || !window.VUI.background) {
    // eslint-disable-next-line no-console
    console.error('background.js failed to load. Load order: utils → motion-engine → background.');
    return;
  }

  var bg = new window.VUI.background.VoiceBackground(root, {
    blobCount: 4,
    blobOpacity: 0.5,
    particleCount: 20,
    particleAlpha: 0.5,
    speed: 1,
    cursorLight: true,
    noise: true
  });

  // Expose for console tinkering during review.
  window.__vuiBgDemo = bg;
})();
