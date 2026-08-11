/* ==========================================================================
   Voice UI — Orb Engine (assets/js/orb-engine.js) — M5
   --------------------------------------------------------------------------
   Procedural living orb rendered to a canvas: an organic blob whose radius
   follows utils.organic (incommensurate sine sums + per-instance seed), a
   liquid three-stop palette gradient, soft glow, inner shading, specular.
   Full state table from docs §8.2:

     idle / connecting / listening / thinking / speaking / muted /
     disconnected / error / success

   * Every orb subscribes to the single shared rAF loop; off-screen orbs
     unsubscribe (IntersectionObserver) and the loop pauses itself when the
     last subscriber leaves.
   * DPR capped at 2. Reduced motion renders one static frame.
   * Palette resolves from the CSS tokens (--vui-orb-<name>) so dark mode is
     automatic, and re-resolves when data-theme changes.

   Load order: utils.js → motion-engine.js → orb-engine.js.
   Namespace: window.VUI.orb.
   ========================================================================== */

(function (VUI) {
  'use strict';

  var utils = VUI.utils;

  var STATES = {
    idle:         { amp: 0.028, speed: 0.45, glow: 0.55, tint: null,      spin: 0, audio: false },
    connecting:   { amp: 0.020, speed: 0.60, glow: 0.60, tint: '#4A5CFF', spin: 0, audio: false },
    listening:    { amp: 0.055, speed: 0.85, glow: 0.80, tint: null,      spin: 0, audio: true  },
    thinking:     { amp: 0.045, speed: 1.35, glow: 0.75, tint: null,      spin: 1, audio: false },
    speaking:     { amp: 0.075, speed: 1.10, glow: 0.95, tint: null,      spin: 0, audio: true  },
    muted:        { amp: 0.012, speed: 0.30, glow: 0.35, tint: '#6B6C66', spin: 0, audio: false },
    disconnected: { amp: 0.006, speed: 0.20, glow: 0.25, tint: '#8A8B85', spin: 0, audio: false },
    error:        { amp: 0.020, speed: 0.60, glow: 0.65, tint: '#E5482F', spin: 0, audio: false },
    success:      { amp: 0.050, speed: 0.80, glow: 0.85, tint: '#2FA36B', spin: 1, audio: false }
  };

  var PALETTES = {
    sky:   ['--vui-blue-50',  '--vui-blue-500',  '--vui-blue-700'],
    mint:  ['--vui-mint-100', '--vui-mint-500',  '--vui-mint-700'],
    coral: ['--vui-coral-100', '--vui-coral-500', '--vui-coral-700'],
    gold:  ['--vui-gold-100',  '--vui-gold-500',  '--vui-gold-700']
  };
  var FALLBACK = { sky: ['#BFEBFF', '#4FB4EE', '#2E7FD1'] };

  var POINTS = 44;

  function Orb(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.size = this.opts.size || 96;
    this.reduced = utils.prefersReducedMotion();
    this.motion = VUI.motion;
    this.t = utils.randomRange(0, 100);
    this.seed = utils.randomRange(0, Math.PI * 2);
    this.curAmp = 0;
    this.curGlow = 0;
    this.level = 0;
    this.cfg = null;
    this.palette = FALLBACK.sky.slice();
    this.canvas = null;
    this.ctx = null;
    this.dpr = 1;
    this.unsub = null;
    this._ro = null;
    this._mo = null;
    this._io = null;
    this.visible = true;
    this._build();
    this._resolvePalette();
    this.setPalette = this._resolvePalette.bind(this);
    this.setState(this.opts.state || 'idle');
    this._watchTheme();
    this._watchVisibility();
  }

  /* ---- Setup ------------------------------------------------------------ */

  Orb.prototype._build = function () {
    var canvas = document.createElement('canvas');
    canvas.className = 'vui-orb__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    this.container.appendChild(canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    var self = this;
    this._resize();
    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(function () { self._resize(); });
      this._ro.observe(this.container);
    } else {
      this._resizeBound = function () { self._resize(); };
      window.addEventListener('resize', this._resizeBound);
    }
  };

  Orb.prototype._resize = function () {
    var w = this.container.clientWidth || this.size;
    var h = this.container.clientHeight || w;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    if (this.reduced) this._drawStatic();
  };

  Orb.prototype._resolvePalette = function () {
    if (Array.isArray(this.opts.palette)) {
      this.palette = this.opts.palette.slice();
      return;
    }
    var name = this.opts.palette || 'sky';
    var props = PALETTES[name] || PALETTES.sky;
    var cs = getComputedStyle(this.container);
    var out = [];
    for (var i = 0; i < 3; i++) {
      var v = (cs.getPropertyValue(props[i]) || '').trim();
      out.push(v || FALLBACK.sky[i]);
    }
    this.palette = out;
    if (this.reduced) this._drawStatic();
  };

  Orb.prototype._watchTheme = function () {
    var self = this;
    this._mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].attributeName === 'data-theme') { self._resolvePalette(); break; }
      }
    });
    this._mo.observe(document.documentElement, { attributes: true });
  };

  Orb.prototype._watchVisibility = function () {
    var self = this;
    if (!('IntersectionObserver' in window)) { this._setActive(true); return; }
    this._io = new IntersectionObserver(function (entries) {
      self._setActive(entries[0] && entries[0].isIntersecting);
    }, { threshold: 0.05 });
    this._io.observe(this.container);
  };

  Orb.prototype._setActive = function (visible) {
    this.visible = visible;
    if (this.reduced) return;
    if (visible && !this.unsub) {
      var self = this;
      this.unsub = this.motion.subscribe(function (dt) { self._frame(dt); });
    } else if (!visible && this.unsub) {
      this.unsub();
      this.unsub = null;
    }
  };

  /* ---- State ------------------------------------------------------------ */

  Orb.prototype.setState = function (state) {
    this.cfg = STATES[state] || STATES.idle;
    this.container.classList.toggle('is-live',
      state === 'listening' || state === 'speaking');
    if (this.reduced) this._drawStatic();
  };

  Orb.prototype.setLevel = function (level) {
    this.level = utils.clamp(level, 0, 1);
  };

  /* ---- Frame ------------------------------------------------------------ */

  Orb.prototype._frame = function (dt) {
    if (!this.cfg || !this.ctx) return;
    this.t += dt * this.cfg.speed;
    var k = Math.min(1, dt * 8);
    this.curAmp += (this.cfg.amp - this.curAmp) * k;
    this.curGlow += (this.cfg.glow - this.curGlow) * k;
    this._render(this.curAmp, this.curGlow);
  };

  Orb.prototype._drawStatic = function () {
    if (!this.ctx) return;
    this._render(0.006, 0.3);
  };

  /* ---- Render ----------------------------------------------------------- */

  Orb.prototype._render = function (amp, glow) {
    var ctx = this.ctx;
    var w = this.canvas.width;
    var h = this.canvas.height;
    if (!w || !h) return;
    var d = this.dpr;
    var cx = w / 2;
    var cy = h / 2;
    var R = Math.min(w, h) / 2 - 4 * d;

    ctx.clearRect(0, 0, w, h);

    /* Outer glow */
    var mid = this._tintHex(this.palette[1], this.cfg.tint);
    var gR = R * (1.9 + glow);
    var glowA = 0.34 * glow;
    var gg = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, gR);
    gg.addColorStop(0, utils.hexToRgba(mid, glowA));
    gg.addColorStop(1, utils.hexToRgba(mid, 0));
    ctx.fillStyle = gg;
    ctx.fillRect(cx - gR, cy - gR, gR * 2, gR * 2);

    /* Organic blob */
    var spin = this.cfg.spin ? this.t * 0.12 : 0;
    var swell = this.cfg.audio ? this.level * R * 0.14 : 0;
    var pts = [];
    for (var i = 0; i < POINTS; i++) {
      var ang = spin + (i / POINTS) * Math.PI * 2;
      var o1 = utils.organic(this.t + i * 0.35, this.seed, 1);
      var o2 = utils.organic(this.t * 0.53 + i * 0.7, this.seed * 1.7, 1);
      var r = R * (1 + amp * (o1 + 0.6 * o2)) + swell;
      pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
    }

    ctx.beginPath();
    var n = pts.length;
    ctx.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
    for (var p = 0; p < n; p++) {
      var p0 = pts[p];
      var p1 = pts[(p + 1) % n];
      ctx.quadraticCurveTo(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
    }
    ctx.closePath();

    var grad = ctx.createRadialGradient(
      cx - R * 0.35, cy - R * 0.4, R * 0.1,
      cx, cy, R * 1.4);
    grad.addColorStop(0, this.palette[0]);
    grad.addColorStop(0.55, this.palette[1]);
    grad.addColorStop(1, this.palette[2]);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.save();
    ctx.clip();

    /* State tint (connecting indigo, error red, success green, muted slate) */
    if (this.cfg.tint) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = utils.hexToRgba(this.cfg.tint, 0.38);
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }

    /* Inner shading + specular */
    var hl = ctx.createRadialGradient(cx - R * 0.45, cy - R * 0.5, R * 0.05, cx - R * 0.45, cy - R * 0.5, R * 1.1);
    hl.addColorStop(0, 'rgba(255,255,255,0.35)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    var sh = ctx.createRadialGradient(cx + R * 0.5, cy + R * 0.55, R * 0.05, cx + R * 0.5, cy + R * 0.55, R * 1.25);
    sh.addColorStop(0, 'rgba(23,24,26,0.22)');
    sh.addColorStop(1, 'rgba(23,24,26,0)');
    ctx.fillStyle = sh;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    var sp = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.42, 0, cx - R * 0.3, cy - R * 0.42, R * 0.36);
    sp.addColorStop(0, 'rgba(255,255,255,0.55)');
    sp.addColorStop(0.35, 'rgba(255,255,255,0.16)');
    sp.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sp;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    ctx.restore();
  };

  /* ---- Helpers ---------------------------------------------------------- */

  Orb.prototype._tintHex = function (base, tint) {
    if (!tint) return base;
    var b = hexRgb(base), t = hexRgb(tint);
    return 'rgb(' + Math.round((b[0] + t[0]) / 2) + ',' +
      Math.round((b[1] + t[1]) / 2) + ',' + Math.round((b[2] + t[2]) / 2) + ')';
  };

  function hexRgb(hex) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16)
    ];
  }

  Orb.prototype.destroy = function () {
    if (this.unsub) { this.unsub(); this.unsub = null; }
    if (this._io) this._io.disconnect();
    if (this._mo) this._mo.disconnect();
    if (this._ro) this._ro.disconnect();
    if (this._resizeBound) window.removeEventListener('resize', this._resizeBound);
    if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
  };

  VUI.orb = { Orb: Orb, STATES: STATES };
})(window.VUI = window.VUI || {});
