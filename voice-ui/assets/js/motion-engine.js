/* ==========================================================================
   Voice UI — Motion Engine (assets/js/motion-engine.js)
   --------------------------------------------------------------------------
   The single source of animation for the whole product.

   Design goals (see docs/architecture.md §8, §10, §11)
   ----------------------------------------------------
   * ONE requestAnimationFrame loop per page, not one per animated element.
     Every animated system subscribes a per-frame callback and unsubscribes
     when idle/off-screen. When the last subscriber leaves, the loop stops.
   * Delta-time based: all callbacks receive seconds; large jumps (tab-back,
     throttled tabs) are clamped to 48ms so springs never explode.
   * No CSS animation driven per-frame for core motion — the loop, springs
     and tweens here are what move things. CSS keyframes remain for ambient
     loops only.
   * prefers-reduced-motion is honored at the consumer level (consumers
     simply don't subscribe).

   Load order: utils.js → motion-engine.js.
   Namespace: window.VUI.motion.
   ========================================================================== */

(function (VUI) {
  'use strict';

  var utils = VUI.utils;

  /* ========================================================================
     Shared rAF loop
     ======================================================================== */
  var listeners = [];
  var running = false;
  var lastT = null;

  function tick(t) {
    if (!running) return;
    var dt = lastT === null ? 16 : Math.min(t - lastT, 48);
    lastT = t;
    // While the tab is hidden we keep the clock but skip work; on return the
    // clamped dt prevents a single giant step from catapulting springs.
    if (!document.hidden) {
      for (var i = 0; i < listeners.length; i++) {
        if (listeners[i]) listeners[i](dt / 1000, t);
      }
    }
    requestAnimationFrame(tick);
  }

  function ensureRunning() {
    if (running) return;
    running = true;
    lastT = null;
    requestAnimationFrame(tick);
  }

  function subscribe(fn) {
    if (typeof fn !== 'function') throw new Error('motion.subscribe: fn must be a function');
    listeners.push(fn);
    ensureRunning();
    var active = true;
    return function unsubscribe() {
      if (!active) return;
      active = false;
      var idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);
      if (listeners.length === 0) running = false; // idle → loop halts
    };
  }

  /* ========================================================================
     Spring — damped-spring numeric value with velocity.
     stiffness 170 / damping 26  → "calm settle" for UI
     stiffness 220 / damping 30  → carousel snap
     stiffness 90  / damping 14  → audio level smoothing
     ======================================================================== */
  function Spring(stiffness, damping, initial) {
    this.stiffness = stiffness;
    this.damping = damping;
    this.value = initial == null ? 0 : initial;
    this.velocity = 0;
  }
  Spring.prototype.set = function (v) { this.value = v; this.velocity = 0; };
  Spring.prototype.update = function (target, dt) {
    var s = utils.springStep(this.value, target, this.velocity, this.stiffness, this.damping, dt);
    this.value = s.value;
    this.velocity = s.velocity;
    return this.value;
  };

  /* ========================================================================
     Tween — one-shot raf animation with easing + cancel.
     ======================================================================== */
  function easeOutQuint(t) { return 1 - Math.pow(1 - t, 5); }
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function tween(duration, ease, onUpdate, onComplete) {
    var start = utils.now();
    var cancelled = false;
    var rafId = null;
    var easeFn = ease || easeOutQuint;
    function frame() {
      if (cancelled) return;
      var t = utils.clamp((utils.now() - start) / duration, 0, 1);
      onUpdate(easeFn(t));
      if (t < 1) {
        rafId = requestAnimationFrame(frame);
      } else if (onComplete) {
        onComplete();
      }
    }
    rafId = requestAnimationFrame(frame);
    return function cancel() { cancelled = true; if (rafId) cancelAnimationFrame(rafId); };
  }

  /* ========================================================================
     CursorTracker — viewport-normalized pointer (-1..1), spring-smoothed.
     Drives the hero cursor-light, orb parallax and background lighting.
     ======================================================================== */
  function CursorTracker() {
    this.enabled = false;
    this.x = 0; this.y = 0;          // raw target, normalized -1..1
    this.sx = 0; this.sy = 0;        // spring-smoothed output
    this.springX = new Spring(30, 9, 0);
    this.springY = new Spring(30, 9, 0);
    this.unsub = null;
    this.lastMove = 0;
    this._onMove = this._onMove.bind(this);
  }

  CursorTracker.prototype.enable = function () {
    if (this.enabled) return;
    this.enabled = true;
    window.addEventListener('pointermove', this._onMove, { passive: true });
    var self = this;
    this.unsub = subscribe(function (dt) {
      self.sx = self.springX.update(self.x, dt);
      self.sy = self.springY.update(self.y, dt);
    });
  };

  CursorTracker.prototype.disable = function () {
    if (!this.enabled) return;
    this.enabled = false;
    window.removeEventListener('pointermove', this._onMove);
    if (this.unsub) { this.unsub(); this.unsub = null; }
  };

  CursorTracker.prototype.destroy = function () { this.disable(); };

  CursorTracker.prototype._onMove = function (e) {
    this.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.y = (e.clientY / window.innerHeight) * 2 - 1;
    this.lastMove = utils.now();
  };

  VUI.motion = {
    subscribe: subscribe,
    Spring: Spring,
    tween: tween,
    easeOutQuint: easeOutQuint,
    easeInOutCubic: easeInOutCubic,
    CursorTracker: CursorTracker
  };
})(window.VUI = window.VUI || {});
