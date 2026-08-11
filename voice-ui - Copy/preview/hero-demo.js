/* ==========================================================================
   Voice UI — Hero demo (preview/hero-demo.js)
   --------------------------------------------------------------------------
   DEV ONLY. Boots the background + hero modules on the hero preview page.
   Never shipped to WordPress.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.getElementById('hero-root');
  if (!root) return;

  if (window.VUI && window.VUI.background) {
    new window.VUI.background.VoiceBackground(document.getElementById('bg-root'), {
      blobCount: 4,
      blobOpacity: 0.5,
      particleCount: 20,
      particleAlpha: 0.5,
      speed: 1,
      cursorLight: true,
      noise: true
    });
  }

  if (window.VUI && window.VUI.hero) {
    window.__vuiHero = window.VUI.hero.init(root);
  }
})();
