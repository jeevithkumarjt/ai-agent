/* ==========================================================================
   Voice UI — Hero (assets/js/hero.js) — M3
   --------------------------------------------------------------------------
   Wire-up for the hero section:
   * entrance choreography — staggered .vui-enter elements, ~900ms total
   * voice-level meter — bars driven by utils.organic (never a loop)
   * cursor parallax — [data-depth] children via the shared CursorTracker
   * reveal-on-scroll — [data-reveal] .vui-enter elements below the hero
   Load order: utils.js → motion-engine.js → hero.js.
   Namespace: window.VUI.hero.
   ========================================================================== */

(function (VUI) {
  'use strict';

  var utils = VUI.utils;

  var STAGGER_MS = 70;
  var IDLE_MS = 1500;

  var sharedTracker = null;
  var trackerRefs = 0;

  function acquireTracker(motion) {
    if (sharedTracker) { sharedTracker.enable(); trackerRefs += 1; return sharedTracker; }
    sharedTracker = new motion.CursorTracker();
    sharedTracker.enable();
    trackerRefs = 1;
    return sharedTracker;
  }

  function releaseTracker() {
    trackerRefs = Math.max(0, trackerRefs - 1);
    if (trackerRefs === 0 && sharedTracker) {
      sharedTracker.destroy();
      sharedTracker = null;
    }
  }

  /* ========================================================================
     Hero
     ======================================================================== */
  function Hero(root) {
    this.root = root;
    this.el = root.querySelector('.vui-hero');
    this.motion = VUI.motion;
    this.reduced = utils.prefersReducedMotion();
    this.unsubs = [];
    this.tracker = null;
    this._entranceTimer = null;
    this._idleZero = false;
    if (!this.el) return;
    this._entrance();
    this._meter();
    this._parallax();
  }

  Hero.prototype._entrance = function () {
    if (!this.el) return;
    var self = this;
    var items = this.el.querySelectorAll('.vui-enter');
    for (var i = 0; i < items.length; i++) {
      items[i].style.setProperty('--vui-enter-delay', (i * STAGGER_MS) + 'ms');
    }
    if (this.reduced) {
      this.el.classList.add('is-in');
      return;
    }
    this._entranceTimer = setTimeout(function () {
      self.el.classList.add('is-in');
    }, 80);
  };

  Hero.prototype._meter = function () {
    if (!this.el || !this.motion) return;
    var bars = this.el.querySelectorAll('.vui-hero__bar');
    if (!bars.length) return;
    if (this.reduced) return; /* CSS static scaleY is the fallback */
    var self = this;
    var t = utils.randomRange(0, 40);
    var seeds = [];
    var speeds = [];
    for (var i = 0; i < bars.length; i++) {
      seeds.push(utils.randomRange(0, Math.PI * 2));
      speeds.push(utils.randomRange(0.9, 1.5));
    }
    var unsub = this.motion.subscribe(function (dt) {
      t += dt;
      for (var b = 0; b < bars.length; b++) {
        var v = 0.5 + 0.5 * utils.organic(t + b * 1.9, seeds[b], speeds[b]);
        bars[b].style.transform = 'scaleY(' + (0.3 + 0.7 * v).toFixed(3) + ')';
      }
    });
    this.unsubs.push(unsub);
  };

  Hero.prototype._parallax = function () {
    if (!this.el || !this.motion) return;
    if (this.reduced) return;
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
    var targets = this.el.querySelectorAll('[data-depth]');
    if (!targets.length) return;
    var self = this;
    var tracker = acquireTracker(this.motion);
    this.tracker = tracker;
    var unsub = this.motion.subscribe(function () {
      var idle = utils.clamp(1 - (utils.now() - tracker.lastMove) / IDLE_MS, 0, 1);
      if (idle <= 0) {
        if (!self._idleZero) {
          self._idleZero = true;
          for (var j = 0; j < targets.length; j++) {
            targets[j].style.transform = 'translate3d(0,0,0)';
          }
        }
        return;
      }
      self._idleZero = false;
      var ox = tracker.sx * idle;
      var oy = tracker.sy * idle;
      for (var i = 0; i < targets.length; i++) {
        var depth = parseFloat(targets[i].getAttribute('data-depth')) || 0;
        targets[i].style.transform =
          'translate3d(' + (ox * depth).toFixed(2) + 'px,' + (oy * depth * 0.55).toFixed(2) + 'px,0)';
      }
    });
    this.unsubs.push(unsub);
  };

  Hero.prototype.destroy = function () {
    if (this._entranceTimer) clearTimeout(this._entranceTimer);
    for (var i = 0; i < this.unsubs.length; i++) this.unsubs[i]();
    this.unsubs = [];
    if (this.tracker) { releaseTracker(); this.tracker = null; }
  };

  /* ========================================================================
     Reveal on scroll — adds .is-in to .vui-enter[data-reveal] elements.
     ======================================================================== */
  function revealOnScroll(root) {
    var items = root.querySelectorAll('.vui-enter[data-reveal]');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      for (var k = 0; k < items.length; k++) items[k].classList.add('is-in');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('is-in');
          io.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    for (var j = 0; j < items.length; j++) io.observe(items[j]);
  }

  VUI.hero = {
    init: function (root) {
      var r = root || document;
      revealOnScroll(r);
      return new Hero(r);
    },
    revealOnScroll: revealOnScroll
  };
})(window.VUI = window.VUI || {});
