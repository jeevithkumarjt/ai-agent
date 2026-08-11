/* ==========================================================================
   Voice UI — Utils (assets/js/utils.js)
   --------------------------------------------------------------------------
   Math, timing and environment helpers shared by every module.

   Module contract (see docs/architecture.md §19)
   ----------------------------------------------
   Each module file attaches a namespace to the shared `window.VUI` object.
   No import/export statements: this keeps the exact same file usable as a
   plain <script> (so the preview harness runs from file:// without a server)
   and lets the WordPress build (M13) concatenate modules in dependency order
   into one minified IIFE with zero transforms — immune to the LiteSpeed
   combine/minify issues that forced the previous ES5 approach.

   Load order: utils.js → motion-engine.js → background.js → … → app.js
   ========================================================================== */

(function (VUI) {
  'use strict';

  /* ---- clamp: keep v within [lo, hi] ---- */
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  /* ---- lerp: linear interpolation ---- */
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---- sign: -1 / 0 / +1 ---- */
  function sign(n) { return n < 0 ? -1 : (n > 0 ? 1 : 0); }

  /* ---- now: high-res timestamp with fallback ---- */
  function now() {
    return (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();
  }

  /* ---- randomRange: float in [min, max) ---- */
  function randomRange(min, max) { return min + Math.random() * (max - min); }

  /* ---- springStep --------------------------------------------------------
     One integration step of a damped spring toward `target`. Tuned so the
     system settles without ringing (feels "premium", never bouncy). Returns
     the next { value, velocity }. dt is in seconds.
     ------------------------------------------------------------------------ */
  function springStep(value, target, velocity, stiffness, damping, dt) {
    var force = (target - value) * stiffness - velocity * damping;
    var newVelocity = velocity + force * dt;
    return { value: value + newVelocity * dt, velocity: newVelocity };
  }

  /* ---- organic -----------------------------------------------------------
     Sum of a few sine terms at incommensurate frequency ratios plus a random
     phase seed. Cheap, deterministic, and for any practical viewing session
     never visibly repeats. This is what keeps every orb/blob/particle from
     ever looking like a perfect loop. Returns a value roughly in [-1, 1].
     ------------------------------------------------------------------------ */
  function organic(t, seed, speed) {
    var s = speed || 1;
    return (
      Math.sin(t * 0.61 * s + seed) * 0.5 +
      Math.sin(t * 1.27 * s + seed * 1.7) * 0.3 +
      Math.sin(t * 2.03 * s + seed * 2.3) * 0.2
    );
  }

  /* ---- hexToRgba: '#RRGGBB' → 'rgba(r,g,b,a)'. Accepts 3-digit hex. ---- */
  function hexToRgba(hex, alpha) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  /* ---- prefersReducedMotion: cached-ish accessibility check ---- */
  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ---- debounce: trailing-edge debounce, returns wrapped fn ---- */
  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var self = this, args = arguments;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { timer = null; fn.apply(self, args); }, wait);
    };
  }

  VUI.utils = {
    clamp: clamp,
    lerp: lerp,
    sign: sign,
    now: now,
    randomRange: randomRange,
    springStep: springStep,
    organic: organic,
    hexToRgba: hexToRgba,
    prefersReducedMotion: prefersReducedMotion,
    debounce: debounce
  };
})(window.VUI = window.VUI || {});
