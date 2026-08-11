/* ==========================================================================
   Voice UI — Background System (assets/js/background.js)
   --------------------------------------------------------------------------
   Premium ambient background: aurora mesh, film-grain noise, cursor light,
   and soft rising particles. Everything is slow, dim and non-distracting —
   the stage the product performs on (see docs/architecture.md §7, §16).

   Rendering strategy (performance — docs §10)
   -------------------------------------------
   * Aurora = 4 large blurred radial-gradient DIVs, animated by transform
     only (translate3d). Blur is applied once; the compositor moves the
     layers, so there is no per-frame paint.
   * Particles = a single canvas, pre-rendered soft-dot sprite reused for
     every particle (no per-particle gradients). DPR capped at 2.
   * Noise = one static SVG feTurbulence data-URI overlay, zero animation.
   * Cursor light = one blurred accent gradient following a spring-smoothed
     pointer; fades to 0 when the mouse is idle and never shows on touch.
   * One subscription to the shared MotionLoop; stops when off-screen.

   Class: new VoiceBackground(rootEl, config)
   Namespace: window.VUI.background.
   ========================================================================== */

(function (VUI) {
  'use strict';

  var utils = VUI.utils;
  var motion = VUI.motion;

  var DEFAULTS = {
    blobCount: 4,        // aurora blobs to build
    blobOpacity: 0.5,    // peak opacity of the aurora mesh (CSS, not alpha-boosted)
    particleCount: 18,   // soft particles on screen
    particleAlpha: 0.5,  // max alpha multiplier for particles
    speed: 1,            // global motion speed multiplier
    cursorLight: true,   // pointer-driven ambient light
    noise: true          // film-grain overlay
  };

  // Decorative anchor positions: left % / top % / size % (of viewport width).
  // Sized and placed off-canvas so the heavy blur clips cleanly at edges.
  var BLOB_LAYOUT = [
    { left: 10, top: -6,  size: 60 },
    { left: 58, top: -10, size: 52 },
    { left: 68, top: 50,  size: 46 },
    { left: -6, top: 42,  size: 44 }
  ];

  var SPRITE_SIZE = 24; // px, pre-rendered soft dot

  function VoiceBackground(root, cfg) {
    if (!root) throw new Error('VoiceBackground: root element is required');
    this.root = root;

    this.cfg = {};
    var k;
    for (k in DEFAULTS) if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) this.cfg[k] = DEFAULTS[k];
    if (cfg) for (k in cfg) if (Object.prototype.hasOwnProperty.call(cfg, k)) this.cfg[k] = cfg[k];

    this.reduced = utils.prefersReducedMotion();
    this.visible = true;
    this.t = utils.randomRange(0, 40);   // random start phase so instances never sync
    this.destroyed = false;

    this.blobs = [];
    this.particles = [];
    this.sprite = null;
    this.ctx = null;
    this.w = 0; this.h = 0; this.dpr = 1;

    this.tracker = null;
    this.cursorEl = null;
    this.cursorOpacity = 0;
    this.rect = { left: 0, top: 0 };

    this._unsub = null;
    this._build();
    this._resolveTheme();
    this._bind();
    this._layout();
    if (!this.reduced) this.start(); else this._drawStatic();
  }

  /* ---- build DOM structure ----------------------------------------------- */
  VoiceBackground.prototype._build = function () {
    var i;
    var cfg = this.cfg;

    for (i = 0; i < cfg.blobCount && i < BLOB_LAYOUT.length; i++) {
      var b = document.createElement('div');
      b.className = 'vui-bg-blob vui-bg-blob--' + (i + 1);
      this.root.appendChild(b);
      this.blobs.push({ el: b, seed: Math.random() * 100, layout: BLOB_LAYOUT[i] });
    }

    if (cfg.noise) {
      var noise = document.createElement('div');
      noise.className = 'vui-bg-noise';
      this.root.appendChild(noise);
    }

    if (cfg.cursorLight) {
      this.cursorEl = document.createElement('div');
      this.cursorEl.className = 'vui-bg-cursor';
      this.root.appendChild(this.cursorEl);
      this.tracker = new motion.CursorTracker();
      this.tracker.enable();
    }

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'vui-bg-particles';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.root.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  };

  /* ---- resolve theme-dependent colors (accent + neutral) from tokens ---- */
  VoiceBackground.prototype._resolveTheme = function () {
    var cs = getComputedStyle(this.root);
    this.themeAccent = cs.getPropertyValue('--accent').trim() || '#4A5CFF';
    this.themeMuted = cs.getPropertyValue('--muted').trim() || '#8A8B85';
    this._rebuildSprite();
  };

  VoiceBackground.prototype._rebuildSprite = function () {
    var c = document.createElement('canvas');
    c.width = c.height = SPRITE_SIZE;
    var g = c.getContext('2d');
    var half = SPRITE_SIZE / 2;
    var grad = g.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0, utils.hexToRgba(this.themeMuted, 1));
    grad.addColorStop(0.45, utils.hexToRgba(this.themeMuted, 0.55));
    grad.addColorStop(1, utils.hexToRgba(this.themeMuted, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    this.sprite = c;
  };

  /* ---- listeners: visibility, resize, scroll, theme ---------------------- */
  VoiceBackground.prototype._bind = function () {
    var self = this;

    if ('IntersectionObserver' in window) {
      this._io = new IntersectionObserver(function (entries) {
        self.visible = entries[0].isIntersecting;
        self._sync();
      }, { threshold: 0.01 });
      this._io.observe(this.root);
    }

    this._onVis = function () { self._sync(); };
    document.addEventListener('visibilitychange', this._onVis);

    // Observe the container itself (covers font-load height changes and
    // window resizes where the root spans the viewport). Fall back to a
    // plain window resize listener when ResizeObserver is unavailable.
    this._onResize = utils.debounce(function () {
      self._layout();
      if (self.reduced) self._drawStatic();
    }, 150);
    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(this._onResize);
      this._ro.observe(this.root);
    } else {
      window.addEventListener('resize', this._onResize, { passive: true });
    }

    this._onScroll = utils.debounce(function () { self._updateRect(); }, 80);
    window.addEventListener('scroll', this._onScroll, { passive: true });

    // Re-resolve tokens when the host flips data-theme (shortcode / toggle)
    // or the OS switches light↔dark.
    this._themeMq = window.matchMedia('(prefers-color-scheme: dark)');
    this._onThemeMq = function () { self._resolveTheme(); };
    if (this._themeMq.addEventListener) this._themeMq.addEventListener('change', this._onThemeMq);
    else if (this._themeMq.addListener) this._themeMq.addListener(this._onThemeMq);

    if (window.MutationObserver) {
      this._mo = new MutationObserver(function () { self._resolveTheme(); });
      this._mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
  };

  VoiceBackground.prototype._sync = function () {
    var shouldRun = this.visible && !document.hidden && !this.reduced;
    if (shouldRun && !this._unsub) this.start();
    if (!shouldRun && this._unsub) this.stop();
  };

  VoiceBackground.prototype.start = function () {
    if (this._unsub || this.reduced) return;
    var self = this;
    this._unsub = motion.subscribe(function (dt) { self._frame(dt); });
  };

  VoiceBackground.prototype.stop = function () {
    if (this._unsub) { this._unsub(); this._unsub = null; }
  };

  /* ---- layout: size canvas, position cursor light ------------------------ */
  VoiceBackground.prototype._layout = function () {
    var rect = this.root.getBoundingClientRect();
    this.w = Math.max(rect.width, 1);
    this.h = Math.max(rect.height, 1);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    if (this.cursorEl) {
      var size = Math.min(this.w, this.h) * 0.44;
      this.cursorSize = Math.max(size, 60);
      this.cursorEl.style.width = this.cursorSize + 'px';
      this.cursorEl.style.height = this.cursorSize + 'px';
    }
    this._updateRect();

    // (Re)seed particle base positions when the canvas is resized.
    if (this.particles.length === 0) {
      for (var i = 0; i < this.cfg.particleCount; i++) this._spawnParticle(true);
    }
  };

  VoiceBackground.prototype._updateRect = function () {
    var r = this.root.getBoundingClientRect();
    this.rect.left = r.left;
    this.rect.top = r.top;
  };

  /* ---- particles ---------------------------------------------------------- */
  VoiceBackground.prototype._spawnParticle = function (initial) {
    this.particles.push({
      x: Math.random(),
      y: initial ? Math.random() : 1.06,
      r: utils.randomRange(1.5, 3.5),
      vy: utils.randomRange(0.008, 0.02),
      sway: utils.randomRange(0.004, 0.012),
      swaySeed: Math.random() * 100,
      swaySpeed: utils.randomRange(0.2, 0.5),
      seed: Math.random() * 100
    });
  };

  VoiceBackground.prototype._drawParticles = function () {
    var ctx = this.ctx;
    var sprite = this.sprite;
    var i, p, alpha, ox, d, x, y;
    ctx.clearRect(0, 0, this.w, this.h);
    for (i = 0; i < this.particles.length; i++) {
      p = this.particles[i];
      d = p.r * 4;
      ox = utils.organic(this.t, p.swaySeed, p.swaySpeed) * p.sway * this.w;
      x = p.x * this.w + ox - d / 2;
      y = p.y * this.h - d / 2;
      alpha = this.cfg.particleAlpha * (0.45 + 0.55 * utils.organic(this.t, p.seed, 0.5));
      ctx.globalAlpha = utils.clamp(alpha, 0.04, 0.75);
      ctx.drawImage(sprite, x, y, d, d);
    }
    ctx.globalAlpha = 1;
  };

  /* ---- per-frame ----------------------------------------------------------- */
  VoiceBackground.prototype._frame = function (dt) {
    if (this.destroyed) return;
    this.t += dt * this.cfg.speed;
    var i, b, ox, oy, drift, reveal;

    for (i = 0; i < this.blobs.length; i++) {
      b = this.blobs[i];
      drift = Math.min(this.w, this.h) * 0.028 * (0.6 + (i % 3) * 0.25);
      ox = utils.organic(this.t, b.seed, 0.08) * drift;
      oy = utils.organic(this.t, b.seed + 9, 0.06) * drift * 0.7;
      reveal = utils.clamp((this.t - i * 0.8) / 2.2, 0, 1);
      b.el.style.opacity = (this.cfg.blobOpacity * motion.easeOutQuint(reveal)).toFixed(3);
      b.el.style.transform = 'translate3d(' + ox.toFixed(2) + 'px,' + oy.toFixed(2) + 'px,0)';
    }

    for (i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      p.y -= p.vy * dt;
      if (p.y < -0.06) this._spawnParticleBase(i);
    }
    this._drawParticles();

    if (this.cursorEl) this._updateCursor();
  };

  VoiceBackground.prototype._spawnParticleBase = function (i) {
    var p = this.particles[i];
    p.x = Math.random();
    p.y = 1.06;
    p.r = utils.randomRange(1.5, 3.5);
    p.vy = utils.randomRange(0.008, 0.02);
    p.sway = utils.randomRange(0.004, 0.012);
    p.swaySeed = Math.random() * 100;
    p.seed = Math.random() * 100;
  };

  VoiceBackground.prototype._updateCursor = function () {
    var idle = utils.now() - this.tracker.lastMove > 2500;
    var target = idle ? 0 : 0.18;
    this.cursorOpacity += (target - this.cursorOpacity) * Math.min(1, 0.06);
    if (this.cursorOpacity < 0.002) this.cursorOpacity = 0;

    var vw = window.innerWidth, vh = window.innerHeight;
    var lx = ((this.tracker.sx + 1) / 2) * vw - this.rect.left - this.cursorSize / 2;
    var ly = ((this.tracker.sy + 1) / 2) * vh - this.rect.top - this.cursorSize / 2;

    this.cursorEl.style.opacity = this.cursorOpacity.toFixed(3);
    this.cursorEl.style.transform = 'translate3d(' + lx.toFixed(1) + 'px,' + ly.toFixed(1) + 'px,0)';
  };

  /* ---- static render for prefers-reduced-motion --------------------------- */
  VoiceBackground.prototype._drawStatic = function () {
    var i, b;
    for (i = 0; i < this.blobs.length; i++) {
      b = this.blobs[i];
      b.el.style.opacity = this.cfg.blobOpacity.toFixed(3);
      b.el.style.transform = 'translate3d(0,0,0)';
    }
    this._drawParticles();
    if (this.cursorEl) { this.cursorEl.style.opacity = '0'; }
  };

  /* ---- teardown ------------------------------------------------------------ */
  VoiceBackground.prototype.destroy = function () {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stop();
    if (this._io) this._io.disconnect();
    if (this._ro) this._ro.disconnect();
    if (this._mo) this._mo.disconnect();
    if (this.tracker) this.tracker.destroy();
    document.removeEventListener('visibilitychange', this._onVis);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('scroll', this._onScroll);
    if (this._themeMq) {
      if (this._themeMq.removeEventListener) this._themeMq.removeEventListener('change', this._onThemeMq);
      else if (this._themeMq.removeListener) this._themeMq.removeListener(this._onThemeMq);
    }
    this.root.innerHTML = '';
  };

  VUI.background = { VoiceBackground: VoiceBackground };
})(window.VUI = window.VUI || {});
