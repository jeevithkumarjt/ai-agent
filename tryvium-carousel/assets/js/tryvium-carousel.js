/* ============================================================================
   TRYVIUM AI · SOLUTIONS SHOWCASE  —  engine bundle
   ----------------------------------------------------------------------------
   Vanilla ES5 IIFE (LiteSpeed / old-browser safe — no template literals, no
   modules, no inline script). Namespaced to window.TryviumCarousel.

   Architecture (one file, clearly-sectioned modules):
     1. Utils            — math + easing helpers
     2. Perlin noise     — procedural, seeded (never repeats)
     3. Spring           — damped harmonic oscillator (momentum/inertia)
     4. Themes           — orb palettes + per-feature accent (light B2B)
     5. Orb              — generative living sphere (Canvas 2D)
     6. Ambient          — aurora-on-paper background
     7. Built-in demo    — zero-network fallback payload
     8. API adapter      — GET /solutions → normalize → cards
     9. Agent factory    — PER-FEATURE API: one endpoint per solution
    10. Carousel         — spring coverflow + drag/momentum + keyboard
    11. Modal            — voice call, states, mic, chat, focus trap
    12. Engine + boot    — one shared rAF loop, multi-instance

   Data chain (first hit wins):
     a. [data-solutions] attribute  → JSON injected by the PHP shortcode
     b. window.TryviumCarousel.solutions  → wp_localize_script
     c. window.TryviumCarousel.endpoint  → GET /solutions (REST)
     d. built-in demo set               → always works, zero network

   Each solution carries its own `api` block. When api.baseUrl + api.key are
   set, EVERY call for that feature (session, message, hangup) routes to that
   feature's endpoint. If baseUrl/key are absent the widget runs in demo mode.
   ============================================================================ */

(function (window, document) {
  'use strict';

  /* ================================================================
     1 · UTILITIES
     ================================================================ */
  var TAU = Math.PI * 2;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function damp(current, target, lambda, dt) { return lerp(current, target, 1 - Math.exp(-lambda * dt)); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function hexToRgb(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ================================================================
     2 · PERLIN NOISE  (procedural, deterministic, seeded)
     ================================================================ */
  var perm = new Uint8Array(512);
  (function seedPerm() {
    var p = [], i, j, tmp, s = 1337;
    function rnd() { s = (s * 1664525 + 1013904223) >>> 0; return s; }
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) { j = rnd() % (i + 1); tmp = p[i]; p[i] = p[j]; p[j] = tmp; }
    for (i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();
  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function grad(h, x, y) {
    switch (h & 3) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      default: return -x - y;
    }
  }
  function pnoise(x, y) {
    var X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    var u = fade(x), v = fade(y);
    var A = perm[X] + Y, B = perm[X + 1] + Y;
    return lerp(
      lerp(grad(perm[A], x, y), grad(perm[B], x - 1, y), u),
      lerp(grad(perm[A + 1], x, y - 1), grad(perm[B + 1], x - 1, y - 1), u), v
    ) * 1.5;
  }

  /* ================================================================
     3 · SPRING  (damped harmonic oscillator)
     ================================================================ */
  function Spring(o) {
    this.x = o.x || 0;
    this.v = o.v || 0;
    this.k = o.k || 160;
    this.c = o.c || 18;
    this.target = (o.target !== undefined) ? o.target : this.x;
  }
  Spring.prototype.step = function (dt) {
    var a = (this.target - this.x) * this.k - this.v * this.c;
    this.v += a * dt;
    this.x += this.v * dt;
  };
  Spring.prototype.set = function (t) { this.target = t; };

  /* ================================================================
     4 · THEMES  — light, B2B orb palettes + per-feature accent
     ================================================================ */
  var THEMES = {
    sky:    { accent: '#2E6BFF', light: [138, 217, 255], mid: [46, 155, 238], deep: [11, 74, 140], glow: [88, 185, 255] },
    mint:   { accent: '#1E7D32', light: [200, 240, 185], mid: [87, 177, 70], deep: [20, 74, 38], glow: [134, 224, 90] },
    coral:  { accent: '#D6333D', light: [255, 198, 180], mid: [226, 94, 92], deep: [126, 36, 64], glow: [255, 138, 107] },
    gold:   { accent: '#B25E09', light: [255, 228, 160], mid: [232, 168, 58], deep: [110, 62, 18], glow: [255, 192, 74] },
    violet: { accent: '#5B3DF5', light: [200, 190, 255], mid: [124, 110, 236], deep: [60, 50, 140], glow: [160, 140, 255] },
    rose:   { accent: '#C2185B', light: [255, 190, 215], mid: [226, 94, 150], deep: [126, 36, 90], glow: [255, 140, 180] },
    azure:  { accent: '#0077C8', light: [138, 217, 255], mid: [46, 155, 238], deep: [11, 74, 140], glow: [88, 185, 255] }
  };
  function themeFor(name) { return THEMES[name] || THEMES.azure; }

  /* ================================================================
     5 · ORB  — generative living sphere (Canvas 2D)
     ================================================================ */
  var STATE_CFG = {
    idle:       { breath: 0.028, glow: 0.50, speed: 0.55, fade: 1.0, ripple: 0, err: 0, circ: 0.0, halo: 0.5 },
    sleeping:   { breath: 0.008, glow: 0.35, speed: 0.20, fade: 1.0, ripple: 0, err: 0, circ: 0.0, halo: 0.3 },
    connecting: { breath: 0.020, glow: 0.60, speed: 0.80, fade: 1.0, ripple: 0, err: 0, circ: 0.0, halo: 0.5 },
    listening:  { breath: 0.050, glow: 0.72, speed: 1.00, fade: 1.0, ripple: 1, err: 0, circ: 0.0, halo: 0.6 },
    speaking:   { breath: 0.060, glow: 0.95, speed: 1.70, fade: 1.0, ripple: 0, err: 0, circ: 0.0, halo: 0.9 },
    thinking:   { breath: 0.032, glow: 0.65, speed: 1.15, fade: 1.0, ripple: 0, err: 0, circ: 0.5, halo: 0.55 },
    error:      { breath: 0.022, glow: 0.50, speed: 0.50, fade: 1.0, ripple: 0, err: 1, circ: 0.0, halo: 0.45 },
    ended:      { breath: 0.005, glow: 0.22, speed: 0.12, fade: 0.4, ripple: 0, err: 0, circ: 0.0, halo: 0.18 }
  };

  function Orb(canvas, palette, size) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.palette = palette;
    this.t = 0;
    this.state = 'idle';
    this.circ = rand(0, TAU);
    this.circV = 0;
    this.speed = 0.55;
    this.ripple = 0;
    this.err = 0;
    this.energy = 0;
    this.nextPulse = rand(4, 9);
    this.inputEnergy = null;
    this.breath = new Spring({ k: 130, c: 19, x: 0.028, target: 0.028 });
    this.glow = new Spring({ k: 110, c: 15, x: 0.5, target: 0.5 });
    this.fade = new Spring({ k: 90, c: 13, x: 1, target: 1 });
    this.pulse = new Spring({ k: 240, c: 26, x: 0, target: 0 });
    this.resize(size);
  }
  Orb.prototype.resize = function (size) {
    this.S = size;
    this.R = size / 2;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.cv.width = Math.round(size * dpr);
    this.cv.height = Math.round(size * dpr);
    this.buildGradients();
    this.buildBlobs();
    if (this.t > 0) this.draw();
  };
  Orb.prototype.buildGradients = function () {
    var ctx = this.ctx, R = this.R, p = this.palette, g;

    g = ctx.createRadialGradient(0, -R * 0.3, 0, 0, 0, R * 1.15);
    g.addColorStop(0, rgba(p.light, 0.6));
    g.addColorStop(0.55, rgba(p.mid, 0.85));
    g.addColorStop(1, rgba(p.deep, 1));
    this.baseGrad = g;

    g = ctx.createRadialGradient(0, 0, R * 0.05, 0, 0, R * 1.5);
    g.addColorStop(0, rgba(p.glow, 0.4));
    g.addColorStop(0.55, rgba(p.glow, 0.12));
    g.addColorStop(1, rgba(p.glow, 0));
    this.haloGrad = g;

    g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.6);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.32, rgba(p.light, 0.22));
    g.addColorStop(1, rgba(p.light, 0));
    this.coreGrad = g;

    g = ctx.createRadialGradient(0, R * 0.3, R * 0.2, 0, R * 0.3, R * 1.25);
    g.addColorStop(0, 'rgba(5,8,16,0)');
    g.addColorStop(0.72, 'rgba(5,8,16,0.08)');
    g.addColorStop(1, 'rgba(5,8,16,0.55)');
    this.shadeGrad = g;

    g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.62);
    g.addColorStop(0, 'rgba(255,255,255,0.6)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.16)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    this.specGrad = g;

    g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.25);
    g.addColorStop(0, 'rgba(255,64,74,0.5)');
    g.addColorStop(1, 'rgba(255,64,74,0)');
    this.errGrad = g;

    this.rimColor = rgba([18, 24, 40], 0.16);
    this.rimGlow = rgba(p.glow, 0.4);
  };
  Orb.prototype.buildBlobs = function () {
    var ctx = this.ctx, R = this.R, p = this.palette;
    var trios = [
      [p.light, p.mid], [p.mid, p.deep], [p.light, p.deep],
      [p.mid, p.deep], [p.light, p.mid], [p.light, p.deep]
    ];
    this.blobs = [];
    var i, rr, g, cA, cB;
    for (i = 0; i < 6; i++) {
      rr = R * rand(0.3, 0.62);
      g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
      cA = trios[i][0]; cB = trios[i][1];
      g.addColorStop(0, rgba(cA, 0.5));
      g.addColorStop(0.6, rgba(cB, 0.18));
      g.addColorStop(1, rgba(cB, 0));
      this.blobs.push({
        grad: g, radius: rr, orbit: R * rand(0.26, 0.56),
        sp: rand(0.10, 0.22), ph: rand(0, TAU), alpha: rand(0.7, 1)
      });
    }
    this.dust = [];
    for (i = 0; i < 5; i++) {
      this.dust.push({ r: R * rand(0.5, 0.82), sp: rand(0.12, 0.4), ph: rand(0, TAU), sz: rand(1.2, 2.6) });
    }
  };
  Orb.prototype.setState = function (s) { this.state = s; };

  Orb.prototype.update = function (dt) {
    this.t += dt;
    var cfg = STATE_CFG[this.state] || STATE_CFG.idle;

    this.breath.set(cfg.breath);
    this.glow.set(cfg.glow);
    this.fade.set(cfg.fade);
    this.speed = damp(this.speed, cfg.speed, 2.5, dt);
    this.ripple = damp(this.ripple, cfg.ripple, 3, dt);
    this.err = damp(this.err, cfg.err, 3, dt);
    this.circV = damp(this.circV, cfg.circ, 2, dt);
    this.circ += this.circV * dt;

    var inp = this.inputEnergy ? this.inputEnergy() : 0;
    this.energy = damp(this.energy, inp, 6, dt);

    if ((this.state === 'idle' || this.state === 'sleeping') && this.t > this.nextPulse) {
      this.pulse.set(1);
      this.nextPulse = this.t + rand(5, 14);
    } else if (this.pulse.target === 1 && this.pulse.x > 0.55) {
      this.pulse.set(0);
    }

    this.breath.step(dt);
    this.glow.step(dt);
    this.fade.step(dt);
    this.pulse.step(dt);
    this.draw();
  };

  Orb.prototype.draw = function () {
    var ctx = this.ctx, R = this.R, S = this.S;
    var fadeA = this.fade.x, i, b, d;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, S, S);

    ctx.save();
    ctx.translate(S / 2, S / 2);

    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = (this.glow.x * (0.3 + this.energy * 0.6) + this.pulse.x * 0.2) * fadeA;
    ctx.fillStyle = this.haloGrad;
    ctx.beginPath(); ctx.arc(0, 0, R * 1.5, 0, TAU); ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = fadeA;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();

    ctx.fillStyle = this.baseGrad;
    ctx.fillRect(-R, -R, R * 2, R * 2);

    ctx.save();
    var nb = pnoise(this.t * 0.26, 7.7);
    ctx.translate(0, nb * 3.2);
    var swell = 1 + this.breath.x * (0.5 + 0.5 * (nb * 0.5 + 0.5)) + this.pulse.x * 0.05;
    ctx.scale(swell, swell);
    ctx.rotate(this.circ);

    ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < this.blobs.length; i++) {
      b = this.blobs[i];
      var a = b.ph + this.t * b.sp * 0.9 + pnoise(this.t * b.sp, 13.1 + i * 7.7) * 2.4;
      var rr = b.orbit * (1 + 0.3 * pnoise(this.t * b.sp * 0.7 + i * 3.3, 21.7));
      var bx = Math.cos(a) * rr, by = Math.sin(a) * rr * 0.92;
      ctx.globalAlpha = (0.62 + this.energy * 0.4) * b.alpha * fadeA;
      ctx.fillStyle = b.grad;
      ctx.save(); ctx.translate(bx, by); ctx.fillRect(-b.radius, -b.radius, b.radius * 2, b.radius * 2); ctx.restore();
    }
    for (i = 0; i < this.dust.length; i++) {
      d = this.dust[i];
      var da = d.ph + this.t * d.sp * 1.5 + pnoise(this.t * 0.2, 40 + i) * 1.6;
      ctx.globalAlpha = (0.14 + 0.1 * (0.5 + 0.5 * Math.sin(this.t * d.sp + d.ph))) * fadeA;
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.beginPath();
      ctx.arc(Math.cos(da) * d.r, Math.sin(da) * d.r * 0.9, d.sz, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = fadeA;
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (0.45 + this.energy * 0.55) * fadeA;
    ctx.fillStyle = this.coreGrad;
    ctx.fillRect(-R, -R, R * 2, R * 2);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = fadeA;
    ctx.fillStyle = this.shadeGrad;
    ctx.fillRect(-R, -R, R * 2, R * 2);

    if (this.ripple > 0.05) {
      ctx.globalCompositeOperation = 'lighter';
      var amp = 0.1 + this.energy * 0.9;
      for (i = 0; i < 3; i++) {
        var ph = (this.t * (0.55 + amp * 0.9) + i / 3) % 1;
        var rad = ph * R * 1.15;
        ctx.globalAlpha = (1 - ph) * 0.22 * amp * fadeA;
        ctx.strokeStyle = rgba([255, 255, 255], 1);
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(0, 0, Math.max(rad, 2), 0, TAU); ctx.stroke();
      }
      ctx.globalAlpha = fadeA;
      ctx.globalCompositeOperation = 'source-over';
    }

    if (this.err > 0.05) {
      var pulseA = 0.14 + 0.2 * (0.5 + 0.5 * Math.sin(this.t * 2.6));
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = this.err * pulseA * fadeA;
      ctx.fillStyle = this.errGrad;
      ctx.fillRect(-R, -R, R * 2, R * 2);
      ctx.globalAlpha = fadeA;
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();

    ctx.lineWidth = 1.25;
    ctx.strokeStyle = this.rimColor;
    ctx.beginPath(); ctx.arc(0, 0, R - 0.6, 0, TAU); ctx.stroke();

    if (this.state === 'connecting') {
      var ca = (this.t * 0.9) % 1;
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = this.rimGlow;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, R + 6 + ca * 14, ca * TAU, ca * TAU + TAU * 0.7);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = (0.5 + this.glow.x * 0.4) * fadeA;
    ctx.fillStyle = this.specGrad;
    ctx.save();
    ctx.translate(-R * 0.34, -R * 0.38);
    ctx.scale(1, 0.82);
    ctx.rotate(-0.5);
    ctx.fillRect(-R * 0.62, -R * 0.62, R * 1.24, R * 1.24);
    ctx.restore();

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  /* ================================================================
     6 · AMBIENT  — aurora-on-paper, very subtle (B2B), low-res canvas
     ================================================================ */
  function Ambient(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.mx = 0; this.my = 0; this.smx = 0; this.smy = 0;
    this.parts = [];
    this.auroras = [
      { x: 0.18, y: 0.22, r: 0.75, hue: 212, off: 0,  alpha: 0.14, par: 30 },
      { x: 0.85, y: 0.8,  r: 0.8,  hue: 262, off: 40, alpha: 0.10, par: -40 },
      { x: 0.55, y: 0.45, r: 0.6,  hue: 182, off: 90, alpha: 0.09, par: 14 }
    ];
    for (var i = 0; i < 22; i++) {
      this.parts.push({ x: Math.random(), y: Math.random(), sp: rand(0.02, 0.09), r: rand(0.6, 1.8), ph: rand(0, TAU) });
    }
    this.resize();
  }
  Ambient.prototype.resize = function () {
    var rect = this.cv.parentNode ? this.cv.parentNode.getBoundingClientRect() : null;
    this.w = rect ? rect.width : window.innerWidth;
    this.h = rect ? rect.height : window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2) * 0.5;
    this.cv.width = Math.round(this.w * dpr);
    this.cv.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  Ambient.prototype.update = function (dt, t) {
    var ctx = this.ctx, w = this.w, h = this.h, i, a, p;
    this.smx = damp(this.smx, this.mx, 1.6, dt);
    this.smy = damp(this.smy, this.my, 1.6, dt);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#F7F8FA';
    ctx.fillRect(0, 0, w, h);

    var minDim = Math.min(w, h), g;
    ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < this.auroras.length; i++) {
      a = this.auroras[i];
      var cx = (a.x + pnoise(t * 0.03, i * 9.1) * 0.05) * w + this.smx * a.par;
      var cy = (a.y + pnoise(t * 0.025 + 40, i * 9.1) * 0.05) * h + this.smy * a.par;
      var hue = a.hue + Math.sin(t * 0.02 + a.off) * 8;
      g = ctx.createRadialGradient(cx, cy, 0, cx, cy, a.r * minDim);
      g.addColorStop(0, 'hsla(' + hue + ',72%,52%,' + a.alpha + ')');
      g.addColorStop(1, 'hsla(' + hue + ',72%,52%,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, a.r * minDim, 0, TAU); ctx.fill();
    }
    for (i = 0; i < this.parts.length; i++) {
      p = this.parts[i];
      p.y -= p.sp * dt * 0.05;
      if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
      ctx.globalAlpha = 0.14 + 0.10 * (0.5 + 0.5 * Math.sin(t * p.sp * 4 + p.ph));
      ctx.fillStyle = '#9db4ff';
      ctx.beginPath();
      ctx.arc(p.x * w + this.smx * 6, p.y * h + this.smy * 6, p.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  };

  /* ================================================================
     7 · BUILT-IN DEMO PAYLOAD  (zero-network fallback)
     ================================================================ */
  var DEMO_SOLUTIONS = [
    {
      id: 'healthcare', industry: 'Healthcare', title: 'Patient Support AI',
      description: 'Book, reschedule and check-in without holding. EHR-aware, HIPAA-ready.',
      theme: 'mint', icon: 'phone', cta: 'Explore solution', link: null,
      api: { baseUrl: null, path: '/voice/healthcare', key: null },
      tags: ['Appointments', 'Check-in', 'Prescriptions'], agent: 'Nora',
      greeting: "Hi, I'm Nora from patient services. I can help you book or reschedule an appointment — how can I help today?",
      speak: 'I can check your appointment or refill a prescription. What do you need?',
      replies: ["I found an opening tomorrow at 10:30 — would that work for you?", "I've rescheduled your appointment. A confirmation is on its way.", "No problem. I've noted it and notified the clinic."]
    },
    {
      id: 'insurance', industry: 'Insurance', title: 'Claims Assistant',
      description: 'Start a claim or check a status in seconds. Fraud-screened at intake.',
      theme: 'coral', icon: 'check', cta: 'Explore solution', link: null,
      api: { baseUrl: null, path: '/voice/insurance', key: null },
      tags: ['Claims', 'Status', 'Documents'], agent: 'Rae',
      greeting: "Hi, I'm Rae from claims. Are you starting a new claim or checking an existing one?",
      speak: 'I can check a claim status or walk you through a filing. Where should we start?',
      replies: ["I've filed the claim — your reference number is CL-2048.", 'Your claim is under review and should be resolved within 48 hours.', "I've attached those documents to your claim file."]
    },
    {
      id: 'financial', industry: 'Financial Services', title: 'Account Services',
      description: 'Balance checks, transfers and account help — secured and verified.',
      theme: 'gold', icon: 'sparkle', cta: 'Explore solution', link: null,
      api: { baseUrl: null, path: '/voice/financial', key: null },
      tags: ['Balances', 'Transfers', 'Security'], agent: 'Milo',
      greeting: "Hi, I'm Milo from account services. For your security, how can I verify you today?",
      speak: 'I can help with transactions, statements, or your account. What do you need?',
      replies: ['Verified. I can help with your balance, transfers or statements.', "Transfer complete — you'll see it in your activity shortly.", "I've flagged that transaction for review as you asked."]
    },
    {
      id: 'retail', industry: 'Retail & E-commerce', title: 'Order Assistant',
      description: 'Track orders, process returns and recommend products — live.',
      theme: 'sky', icon: 'bag', cta: 'Explore solution', link: null,
      api: { baseUrl: null, path: '/voice/retail', key: null },
      tags: ['Orders', 'Returns', 'Recommendations'], agent: 'Ava',
      greeting: "Hi, I'm Ava. I can track an order, start a return, or find something for you.",
      speak: 'I can pull up your order, process a return, or make a recommendation. What do you need?',
      replies: ["Your order is out for delivery and should arrive by 6pm.", "I've started the return — the label is on its way to your email.", 'Based on what you bought, you might like the new X-series too.']
    },
    {
      id: 'travel', industry: 'Travel & Hospitality', title: 'Trip Desk',
      description: 'Change bookings, check-in and get real-time flight help.',
      theme: 'violet', icon: 'plane', cta: 'Explore solution', link: null,
      api: { baseUrl: null, path: '/voice/travel', key: null },
      tags: ['Bookings', 'Check-in', 'Flights'], agent: 'Sia',
      greeting: "Hi, I'm Sia from the trip desk. How can I help with your travel plans?",
      speak: 'I can change a booking, check you in, or help with flight issues. What do you need?',
      replies: ["I found a direct flight tomorrow morning — shall I hold it?", "You're checked in. Seat 14A, boarding at 10:40.", 'Your booking is confirmed — the confirmation is in your email.']
    },
    {
      id: 'realestate', industry: 'Real Estate', title: 'Leasing Assistant',
      description: 'Schedule viewings, answer property questions and qualify leads 24/7.',
      theme: 'rose', icon: 'home', cta: 'Explore solution', link: null,
      api: { baseUrl: null, path: '/voice/realestate', key: null },
      tags: ['Viewings', 'Leads', 'Amenities'], agent: 'Eli',
      greeting: "Hi, I'm Eli. I can schedule a viewing or tell you about the property.",
      speak: 'I can book a viewing, answer questions about the property, or take your details. Where should we start?',
      replies: ["I've booked a viewing for Saturday at 11am — you're all set.", 'That unit has in-unit laundry, parking, and a gym on the second floor.', "I've passed your details to the leasing team — expect a call shortly."]
    }
  ];

  /* ================================================================
     8 · API ADAPTER  — GET /solutions → normalized cards
     ----------------------------------------------------------------
     Accepted wire shapes: { success, data:[...] } | { solutions:[...] } | [...]
     Normalizes contract fields and fills safe defaults so enterprise
     cards work even without voice fields.
     ================================================================ */
  function normalizeSolutions(raw, apiBase) {
    if (!raw) return [];
    var list = raw.data || raw.solutions || raw;
    if (!Array.isArray(list)) return [];
    return list.map(function (s) {
      var api = s.api || {};
      return {
        id: s.id || String(Math.random()).slice(2),
        industry: s.industry || 'Solution',
        title: s.title || s.name || 'Untitled',
        description: s.description || '',
        theme: s.theme || 'azure',
        icon: s.icon || 'phone',
        cta: s.cta || 'Explore solution',
        link: s.link || null,
        api: {
          baseUrl: api.baseUrl || apiBase || null,
          path: api.path || s.api_path || '/voice/' + (s.id || 'generic'),
          key: api.key || null
        },
        tags: Array.isArray(s.tags) ? s.tags.slice(0, 3) : [],
        agent: s.agent || 'Ava',
        greeting: s.greeting || "Hi! I'm here to help. What do you need today?",
        speak: s.speak || 'I can help with that — what would you like to do?',
        replies: Array.isArray(s.replies) && s.replies.length ? s.replies.slice(0, 4) : ["Got it — can you tell me a bit more?", 'Let me look into this for you.', 'All set. Anything else I can do?']
      };
    });
  }

  /* ================================================================
     9 · AGENT FACTORY — PER-FEATURE API ROUTING
     ----------------------------------------------------------------
     Every solution gets its own agent instance bound to its own
     `api` block:  { baseUrl, path, key }.
       startSession → POST {baseUrl}{path}/sessions
       sendMessage  → POST {baseUrl}{path}/sessions/{id}/messages
       endSession   → DELETE {baseUrl}{path}/sessions/{id}
     When baseUrl OR key is missing → demo mode (simulated, per-feature
     replies from the solution payload). Nothing hardcoded in JS; the
     WordPress config injects baseUrl/key server-side.
     ================================================================ */
  function createAgent(solution) {
    var api = solution.api || {};
    var demo = !api.baseUrl || !api.key;
    var baseUrl = (api.baseUrl || '').replace(/\/+$/, '');
    var path = (api.path || '').replace(/\/+$/, '');
    var key = api.key || '';
    var sessionId = null;

    function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function headers() {
      var h = { 'Content-Type': 'application/json' };
      if (key) h.Authorization = 'Bearer ' + key;
      return h;
    }

    return {
      _demo: demo,
      _path: path,
      startSession: function (mode) {
        if (demo) {
          return delay(450).then(function () {
            sessionId = 'demo-' + solution.id + '-' + Date.now();
            return { sessionId: sessionId, agentName: solution.agent, feature: solution.id, demo: true };
          });
        }
        return fetch(baseUrl + path + '/sessions', {
          method: 'POST', headers: headers(),
          body: JSON.stringify({ mode: mode, feature: solution.id, agent: solution.agent })
        }).then(function (res) {
          if (!res.ok) throw new Error('Session failed: ' + res.status);
          return res.json().then(function (d) { sessionId = d.sessionId; return d; });
        });
      },
      sendMessage: function (text) {
        if (demo) {
          return delay(700 + Math.random() * 600).then(function () {
            return pick(solution.replies || ['Got it — can you tell me a bit more?']);
          });
        }
        return fetch(baseUrl + path + '/sessions/' + sessionId + '/messages', {
          method: 'POST', headers: headers(),
          body: JSON.stringify({ text: text })
        }).then(function (res) {
          if (!res.ok) throw new Error('Message failed: ' + res.status);
          return res.json().then(function (d) { return d.reply; });
        });
      },
      endSession: function () {
        if (demo) {
          return delay(120).then(function () { sessionId = null; });
        }
        return fetch(baseUrl + path + '/sessions/' + sessionId, {
          method: 'DELETE', headers: headers()
        }).then(function () { sessionId = null; }).catch(function () { sessionId = null; });
      }
    };
  }

  /* ================================================================
     ICONS · inline SVG strings (cheap, no external sprite requests)
     ================================================================ */
  var ICONS = {
    chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v3M8 21h8"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    hangup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 13.5L21 3M16 3h5v5M3 3l3.5 8L3 14.5a15 15 0 0 0 10 10L16.5 21 21 20.5"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>'
  };

  /* ================================================================
     10 · CAROUSEL + MODAL — one instance per .tvx-root
     ================================================================ */
  function Widget(root, options) {
    this.root = root;
    this.solutions = options.solutions;
    this.opts = options;
    this.N = this.solutions.length;
    this.current = 0;
    this.cardEls = [];
    this.spacing = 240;
    this.autoplayTimer = null;
    this.overlayOpen = false;
    this.ended = false;
    this.mode = 'voice';
    this.meter = null;
    this.micStream = null;
    this.lastFocused = null;
    this.activeScenario = this.solutions[0];
    this.activeAgent = createAgent(this.solutions[0]);
    this.callOrb = null;
    this.timers = [];
    this.orbTimers = [];
    this.running = false;
    this.visible = true;
    this.REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.COURSE = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    this.drag = null;

    this.build();
  }

  Widget.prototype.build = function () {
    var self = this;
    var root = this.root;

    /* ambient + vignette (create if the shortcode left them out) */
    if (!root.querySelector('.tvx-ambient')) {
      var cv = el('canvas', 'tvx-ambient');
      cv.setAttribute('aria-hidden', 'true');
      root.insertBefore(cv, root.firstChild);
    }
    if (!root.querySelector('.tvx-vignette')) {
      var vg = el('div', 'tvx-vignette');
      vg.setAttribute('aria-hidden', 'true');
      root.insertBefore(vg, root.querySelector('.tvx-ambient') ? root.querySelector('.tvx-ambient').nextSibling : root.firstChild);
    }
    this.ambient = new Ambient(root.querySelector('.tvx-ambient'));

    /* stage zone */
    var zone = root.querySelector('[data-zone="stage"]');
    if (!zone) {
      zone = el('div', 'tvx-stage-zone');
      zone.setAttribute('data-zone', 'stage');
      root.appendChild(zone);
    }
    this.zone = zone;

    this.stage = el('nav', 'tvx-stage');
    this.stage.setAttribute('aria-label', 'Choose a solution');
    this.stage.setAttribute('aria-roledescription', 'carousel');
    this.stage.setAttribute('role', 'group');

    this.prevBtn = el('button', 'tvx-nav tvx-nav-prev', ICONS.chevL);
    this.prevBtn.setAttribute('aria-label', 'Previous solution');
    this.prevBtn.addEventListener('click', function () { self.prev(); });

    this.nextBtn = el('button', 'tvx-nav tvx-nav-next', ICONS.chevR);
    this.nextBtn.setAttribute('aria-label', 'Next solution');
    this.nextBtn.addEventListener('click', function () { self.next(); });

    this.stage.appendChild(this.prevBtn);
    this.stage.appendChild(this.nextBtn);

    this.dotsWrap = el('div', 'tvx-dots');
    this.dotsWrap.setAttribute('aria-label', 'Solutions');

    this.buildCards();

    var ctaRow = el('div', 'tvx-cta-row');
    this.ctaBtn = el('button', 'tvx-cta', ICONS.mic + '<span>Speak with an agent</span>');
    this.ctaBtn.addEventListener('click', function () { self.openCall(self.solutions[self.current]); });
    ctaRow.appendChild(this.ctaBtn);

    this.caption = el('p', 'tvx-caption');
    this.caption.id = 'tvx-caption-' + this.uid();
    this.caption.setAttribute('aria-hidden', 'true');

    zone.appendChild(this.stage);
    zone.appendChild(this.dotsWrap);
    zone.appendChild(ctaRow);
    zone.appendChild(this.caption);

    /* modal into <body> */
    this.buildModal();
    this.buildInteractions();

    /* reduced motion → static render */
    if (this.REDUCED) {
      var i;
      for (i = 0; i < this.cardEls.length; i++) { this.cardEls[i].orb.setState('idle'); this.cardEls[i].orb.update(0); }
      this.callOrb.setState('idle'); this.callOrb.update(0);
      this.ambient.update(0, 0);
      return;
    }
    this.startEngine();
    if (!this.COURSE) this.startAutoplay();
  };

  Widget.prototype.uid = function () {
    return 'w' + Math.random().toString(36).slice(2, 8);
  };

  Widget.prototype.signedDiff = function (i) {
    var raw = i - this.current;
    while (raw > this.N / 2) raw -= this.N;
    while (raw < -this.N / 2) raw += this.N;
    return raw;
  };

  Widget.prototype.cardTransform = function (card, t, frontBob) {
    var d = card.spring.x;
    var abs = Math.min(Math.abs(d), 2.4);
    var x = d * this.spacing;
    var rot = d * -15;
    var scale = Math.max(1 - abs * 0.085, 0.72);
    var y = frontBob * (1 - Math.min(abs * 0.5, 1));
    card.el.style.transform = 'translate(-50%,-50%) translate(' + x + 'px,' + y + 'px) rotateY(' + rot + 'deg) scale(' + scale + ')';
    card.el.style.zIndex = Math.round(100 - abs * 40);
    card.el.style.opacity = (abs > 2.3) ? 0 : (1 - smoothstep(1.6, 2.3, abs));
    card.el.style.pointerEvents = (abs > 2.3) ? 'none' : 'auto';
    var front = d === 0;
    card.el.setAttribute('data-front', front ? 'true' : 'false');
    /* wake/sleep card orbs only near the front — huge perf win */
    if (front && card.orb.state === 'sleeping') card.orb.setState('idle');
    else if (!front && card.orb.state === 'idle') card.orb.setState('sleeping');
  };

  Widget.prototype.buildCards = function () {
    var self = this;
    var i, s;
    for (i = 0; i < this.solutions.length; i++) {
      s = this.solutions[i];
      var theme = themeFor(s.theme);

      var cardEl = el('article', 'tvx-card');
      cardEl.tabIndex = 0;
      cardEl.setAttribute('role', 'group');
      cardEl.setAttribute('aria-roledescription', 'slide');
      cardEl.setAttribute('aria-label', s.industry + ' — ' + s.title + '. Activate to speak with an agent.');
      cardEl.style.setProperty('--tvx-accent', theme.accent);

      var orbWrap = el('div', 'tvx-orb');
      var cv = document.createElement('canvas');
      orbWrap.appendChild(cv);
      var play = el('span', 'tvx-play', ICONS.play);
      play.setAttribute('aria-hidden', 'true');
      orbWrap.appendChild(play);

      var tag = el('p', 'tvx-card-tag', esc(s.industry.toUpperCase()));
      var title = el('h3', 'tvx-card-title', esc(s.title));

      cardEl.appendChild(orbWrap);
      cardEl.appendChild(tag);
      cardEl.appendChild(title);

      var desc = el('p', 'tvx-card-desc', esc(s.description));
      cardEl.appendChild(desc);

      var tags = el('div', 'tvx-card-tags');
      s.tags.forEach(function (tg) { tags.appendChild(el('span', null, esc(tg))); });
      cardEl.appendChild(tags);

      var card = { el: cardEl, orb: null, index: i, spring: new Spring({ k: 130, c: 17, x: this.signedDiff(i), target: this.signedDiff(i) }) };

      var cta = el('button', 'tvx-card-cta', esc(s.cta) + ICONS.arrow);
      if (s.link) {
        cta.classList.add('is-link');
        cta.addEventListener('click', function (link, e) { e.stopPropagation(); window.location.href = link; }.bind(null, s.link));
      } else {
        cta.addEventListener('click', function (idx, e) { e.stopPropagation(); self.activate(idx); }.bind(null, i));
      }
      cardEl.appendChild(cta);

      this.stage.appendChild(cardEl);

      var orb = new Orb(cv, { light: theme.light, mid: theme.mid, deep: theme.deep, glow: theme.glow }, orbWrap.clientWidth || 148);
      card.orb = orb;
      this.cardEls.push(card);
      orb.setState(i === 0 ? 'idle' : 'sleeping');
      orb.update(0);

      cardEl.addEventListener('keydown', function (idx, e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.activate(idx); }
      }.bind(null, i));

      if (window.ResizeObserver) {
        new ResizeObserver(function (wrap, orbEl) { orbEl.resize(wrap.clientWidth || 148); }.bind(null, orbWrap, orb)).observe(orbWrap);
      }

      var dot = el('button', 'tvx-dot');
      dot.setAttribute('aria-label', 'Go to ' + s.industry);
      dot.addEventListener('click', function (idx) { self.goTo(idx); }.bind(null, i));
      this.dotsWrap.appendChild(dot);
    }
    this.reflow();
    this.layout();
  };

  Widget.prototype.reflow = function () {
    var w = window.innerWidth;
    this.spacing = w < 480 ? 118 : w < 768 ? 160 : 240;
  };

  Widget.prototype.layout = function () {
    var t = performance.now() / 1000;
    var self = this;
    this.cardEls.forEach(function (card) {
      card.spring.x = self.signedDiff(card.index);
      card.spring.v = 0;
      self.cardTransform(card, t, pnoise(t * 0.3, card.index * 3.7) * 3);
    });
    this.updateDots();
  };

  Widget.prototype.goTo = function (i) {
    var self = this;
    this.current = ((i % this.N) + this.N) % this.N;
    this.cardEls.forEach(function (card) { card.spring.set(self.signedDiff(card.index)); });
    if (this.REDUCED) this.layout();
    this.updateDots();
    this.restartAutoplay();
  };

  Widget.prototype.next = function () { this.goTo(this.current + 1); };
  Widget.prototype.prev = function () { this.goTo(this.current - 1); };

  Widget.prototype.updateDots = function () {
    Array.prototype.forEach.call(this.dotsWrap.children, function (dot, i) {
      if (i === this.current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    }.bind(this));
  };

  Widget.prototype.activate = function (index) {
    if (this.signedDiff(index) === 0) this.openCall(this.solutions[this.current]);
    else this.goTo(index);
  };

  Widget.prototype.startAutoplay = function () {
    var self = this;
    if (this.REDUCED || this.overlayOpen || this.COURSE) return;
    this.stopAutoplay();
    this.autoplayTimer = setInterval(function () { self.next(); }, this.opts.delay || 4200);
  };
  Widget.prototype.stopAutoplay = function () { clearInterval(this.autoplayTimer); };
  Widget.prototype.restartAutoplay = function () { this.stopAutoplay(); this.startAutoplay(); };

  /* ---- drag + inertia ---- */
  Widget.prototype.dragStart = function (x) {
    if (this.drag) return;
    this.drag = { startX: x, dx: 0, moved: false, vel: 0, samples: [] };
    this.stopAutoplay();
    this.stage.classList.add('is-dragging');
  };
  Widget.prototype.dragMove = function (x) {
    var self = this;
    if (!this.drag) return;
    this.drag.dx = x - this.drag.startX;
    if (!this.drag.moved && Math.abs(this.drag.dx) > 6) this.drag.moved = true;
    if (!this.drag.moved) return;
    var now = performance.now();
    this.drag.samples.push({ t: now, dx: this.drag.dx });
    while (this.drag.samples.length && now - this.drag.samples[0].t > 90) this.drag.samples.shift();
    this.cardEls.forEach(function (card) {
      card.spring.x = self.signedDiff(card.index) + self.drag.dx / self.spacing;
      card.spring.v = 0;
    });
  };
  Widget.prototype.dragEnd = function (x) {
    var self = this;
    if (!this.drag) return;
    var d = this.drag;
    this.drag = null;
    this.stage.classList.remove('is-dragging');
    var now = performance.now();
    if (d.samples.length) {
      var s0 = d.samples[0], s1 = d.samples[d.samples.length - 1];
      var dt = (s1.t - s0.t) / 1000 || 0.001;
      d.vel = (s1.dx - s0.dx) / dt;
    }
    var threshold = this.spacing * 0.35;
    if (d.moved && (d.dx < -threshold || (Math.abs(d.dx) < threshold && d.vel < -500))) this.next();
    else if (d.moved && (d.dx > threshold || d.vel > 500)) this.prev();
    else this.layout();
    this.cardEls.forEach(function (card) { card.spring.v = clamp(d.vel / self.spacing * 0.45, -7, 7); });
    this.startAutoplay();
  };
  Widget.prototype.dragClick = function (x, y) {
    var elTarget = document.elementFromPoint(x, y);
    if (!elTarget) return;
    var cardEl = elTarget.closest ? elTarget.closest('.tvx-card') : null;
    if (!cardEl) return;
    var idx = this.cardEls.findIndex(function (c) { return c.el === cardEl; });
    if (idx >= 0) this.activate(idx);
  };

  Widget.prototype.buildInteractions = function () {
    var self = this;
    this.stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      self.stage.setPointerCapture(e.pointerId);
      self.dragStart(e.clientX);
      e.preventDefault();
    });
    this.stage.addEventListener('pointermove', function (e) {
      if (self.drag) { self.dragMove(e.clientX); e.preventDefault(); }
    });
    this.stage.addEventListener('pointerup', function (e) {
      if (!self.drag) return;
      var wasMoved = self.drag.moved;
      self.dragEnd(e.clientX);
      if (!wasMoved) self.dragClick(e.clientX, e.clientY);
    });
    this.stage.addEventListener('pointercancel', function () { if (self.drag) self.dragEnd(0); });
    this.stage.addEventListener('mouseenter', function () { self.stopAutoplay(); });
    this.stage.addEventListener('mouseleave', function () { self.startAutoplay(); });

    document.addEventListener('keydown', function (e) {
      if (self.overlayOpen) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowLeft') self.prev();
      else if (e.key === 'ArrowRight') self.next();
      else if (e.key === 'Home') self.goTo(0);
      else if (e.key === 'End') self.goTo(self.N - 1);
    });
  };

  /* ================================================================
     11 · CALL MODAL
     ================================================================ */
  Widget.prototype.buildModal = function () {
    var self = this;

    this.overlay = el('div', 'tvx-overlay');
    this.overlay.setAttribute('role', 'presentation');

    this.modal = el('div', 'tvx-modal');
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-modal', 'true');
    this.modal.tabIndex = -1;

    var head = el('header', 'tvx-modal-head');
    var headLeft = el('div');
    this.callTag = el('div', 'tvx-modal-eyebrow');
    this.callTitle = el('h3', 'tvx-modal-title');
    this.callTitle.id = 'tvx-call-title-' + this.uid();
    headLeft.appendChild(this.callTag);
    headLeft.appendChild(this.callTitle);

    var headRight = el('div', 'tvx-modal-right');
    this.statusEl = el('span', 'tvx-status');
    this.statusEl.setAttribute('data-state', 'connecting');
    this.statusText = el('span');
    this.statusText.textContent = 'Connecting';
    this.statusEl.appendChild(el('i'));
    this.statusEl.appendChild(this.statusText);
    this.statusEl.setAttribute('aria-live', 'polite');

    this.closeBtn = el('button', 'tvx-icon-btn', ICONS.close);
    this.closeBtn.setAttribute('aria-label', 'Close call');
    this.closeBtn.addEventListener('click', function () { self.closeCall(); });

    headRight.appendChild(this.statusEl);
    headRight.appendChild(this.closeBtn);
    head.appendChild(headLeft);
    head.appendChild(headRight);

    var body = el('div', 'tvx-modal-body');

    /* voice panel */
    this.voiceEl = el('div', 'tvx-voice');
    var orbCallWrap = el('div', 'tvx-orb-call');
    var halo = el('div', 'tvx-orb-halo');
    halo.setAttribute('aria-hidden', 'true');
    var cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    orbCallWrap.appendChild(halo);
    orbCallWrap.appendChild(cv);
    this.orbCallWrap = orbCallWrap;
    this.callMessage = el('p', 'tvx-call-msg is-muted');
    this.callMessage.id = 'tvx-call-message-' + this.uid();
    this.callMessage.setAttribute('aria-live', 'polite');
    this.retryBtn = el('button', 'tvx-retry', 'Enable microphone');
    this.retryBtn.hidden = true;
    this.retryBtn.addEventListener('click', function () { self.retryMic(); });
    this.voiceEl.appendChild(orbCallWrap);
    this.voiceEl.appendChild(this.callMessage);
    this.voiceEl.appendChild(this.retryBtn);

    /* chat panel */
    this.chatEl = el('div', 'tvx-chat');
    this.chatEl.hidden = false;
    this.chatLog = el('div', 'tvx-chat-log');
    this.chatLog.setAttribute('role', 'log');
    this.chatLog.setAttribute('aria-live', 'polite');
    this.chatInput = document.createElement('textarea');
    this.chatInput.rows = 1;
    this.chatInput.setAttribute('aria-label', 'Message the agent');
    this.chatInput.placeholder = 'Type a message…';
    this.chatSend = el('button', null, ICONS.send);
    this.chatSend.type = 'submit';
    this.chatSend.setAttribute('aria-label', 'Send');
    this.chatSend.disabled = false;
    this.composer = document.createElement('form');
    this.composer.className = 'tvx-composer';
    this.composer.appendChild(this.chatInput);
    this.composer.appendChild(this.chatSend);
    this.composer.addEventListener('submit', function (e) { e.preventDefault(); self.sendChat(); });
    this.chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); self.sendChat(); }
    });
    this.chatInput.addEventListener('input', function () { self.resizeInput(); });
    this.chatEl.appendChild(this.chatLog);
    this.chatEl.appendChild(this.composer);

    body.appendChild(this.voiceEl);
    body.appendChild(this.chatEl);

    /* voice foot */
    this.voiceFoot = el('footer', 'tvx-modal-foot');
    this.hangupBtn = el('button', 'tvx-hangup', ICONS.hangup);
    this.hangupBtn.setAttribute('aria-label', 'End call');
    this.hangupBtn.addEventListener('click', function () { self.hangup(); });
    this.typeBtn = el('button', 'tvx-link', 'Type instead');
    this.typeBtn.addEventListener('click', function () { self.setMode('chat'); });
    this.voiceFoot.appendChild(this.hangupBtn);
    this.voiceFoot.appendChild(this.typeBtn);

    /* chat foot */
    this.chatFoot = el('footer', 'tvx-modal-foot');
    this.chatFoot.hidden = false;
    this.voiceBackBtn = el('button', 'tvx-link', 'Return to voice');
    this.voiceBackBtn.addEventListener('click', function () { self.setMode('voice'); });
    this.chatFoot.appendChild(this.voiceBackBtn);

    this.modal.appendChild(head);
    this.modal.appendChild(body);
    this.modal.appendChild(this.voiceFoot);
    this.modal.appendChild(this.chatFoot);
    this.modal.setAttribute('aria-labelledby', this.callTitle.id);
    this.modal.setAttribute('aria-describedby', this.callMessage.id);
    this.overlay.appendChild(this.modal);

    document.body.appendChild(this.overlay);

    this.callOrb = new Orb(cv, { light: [138, 217, 255], mid: [46, 155, 238], deep: [11, 74, 140], glow: [88, 185, 255] }, 200);
    this.callOrb.setState('idle');

    /* panels: class-driven cross-fade */
    this.setPanelActive(this.voiceEl, true);
    this.voiceFoot.classList.remove('tvx-foot-off');
    this.setPanelActive(this.chatEl, false);
    this.chatFoot.classList.add('tvx-foot-off');

    /* modal events */
    this.overlay.addEventListener('pointerdown', function (e) { if (e.target === self.overlay) self.closeCall(); });

    /* focus trap */
    this.modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var focusables = self.modal.querySelectorAll('button, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    /* global Esc + resize */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && self.overlay.classList.contains('is-open')) self.closeCall();
    });
  };

  Widget.prototype.setPanelActive = function (panelEl, active) {
    if (active) { panelEl.classList.remove('tvx-panel-off'); panelEl.inert = false; }
    else { panelEl.classList.add('tvx-panel-off'); panelEl.inert = true; }
  };

  Widget.prototype.setStatus = function (state, label) {
    this.statusEl.setAttribute('data-state', state);
    this.statusText.textContent = label;
  };
  Widget.prototype.setMessage = function (text, cls) {
    this.callMessage.textContent = text || '';
    this.callMessage.className = 'tvx-call-msg' + (cls ? ' ' + cls : '');
  };

  Widget.prototype.applyScenario = function (scenario) {
    var theme = themeFor(scenario.theme);
    this.activeScenario = scenario;
    this.callTag.textContent = scenario.industry.toUpperCase();
    this.callTitle.textContent = scenario.title;
    this.callOrb.palette = { light: theme.light, mid: theme.mid, deep: theme.deep, glow: theme.glow };
    this.callOrb.buildGradients();
    this.callOrb.buildBlobs();
    this.modal.style.setProperty('--tvx-accent', theme.accent);
    this.modal.style.setProperty('--tvx-orb-glow', rgba(theme.glow, 0.42));
    this.modal.style.setProperty('--tvx-msg-glow', rgba(theme.glow, 1));
  };

  Widget.prototype.stopMic = function () {
    if (this.micStream) { this.micStream.getTracks().forEach(function (t) { t.stop(); }); this.micStream = null; }
    if (this.meter && this.meter.ctx && this.meter.ctx.state === 'running') { this.meter.ctx.close(); }
    this.meter = null;
    this.callOrb.inputEnergy = null;
  };

  Widget.prototype.stopTimers = function () {
    var self = this;
    this.timers.forEach(clearTimeout);
    this.timers = [];
  };

  Widget.prototype.callEnergy = function () {
    var self = this;
    if (this.activeAgent._demo && this.callOrb.state === 'speaking') return this.synthEnergy;
    if (this.meter) return this.meter.sample(1 / 60);
    return this.synthEnergy * 0.55;
  };

  Widget.prototype.openCall = function (scenario) {
    var self = this;
    if (this.overlay.classList.contains('is-open') && !this.ended) return;
    this.activeAgent = createAgent(scenario);
    this.lastFocused = document.activeElement;
    this.ended = false;
    this.overlayOpen = true;

    this.applyScenario(scenario);
    this.stopMic();
    this.stopTimers();

    this.setStatus('connecting', 'Connecting');
    this.setMessage('Waking the agent…', 'is-muted');
    this.callOrb.setState('connecting');

    this.mode = 'voice';
    this.setPanelActive(this.voiceEl, true);
    this.voiceFoot.classList.remove('tvx-foot-off');
    this.voiceFoot.hidden = false;
    this.setPanelActive(this.chatEl, false);
    this.chatFoot.classList.add('tvx-foot-off');
    this.chatFoot.hidden = true;
    this.chatLog.innerHTML = '';
    this.chatInput.value = '';
    this.retryBtn.hidden = true;
    this.hangupBtn.setAttribute('data-restart', 'false');
    this.hangupBtn.setAttribute('aria-label', 'End call');

    this.overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    this.modal.focus({ preventScroll: true });

    this.beginSession();
  };

  Widget.prototype.beginSession = function () {
    var self = this;
    this.activeAgent.startSession('voice').then(function () {
      var onStream = function (stream) {
        self.micStream = stream;
        self.meter = new AudioMeter(stream);
        self.callOrb.inputEnergy = function () { return self.callEnergy(); };
        self.setStatus('listening', 'Listening');
        self.setMessage("Go ahead — I'm listening…", 'is-muted');
        self.callOrb.setState('listening');
        if (self.activeAgent._demo) self.runDemoConversation();
      };
      var onFail = function () {
        if (self.activeAgent._demo) {
          self.callOrb.inputEnergy = function () { return self.callEnergy(); };
          self.setStatus('listening', 'Demo · simulated audio');
          self.setMessage('Mic off — running a simulated call…', 'is-muted');
          self.callOrb.setState('listening');
          self.runDemoConversation();
        } else {
          self.setStatus('error', 'Mic unavailable');
          self.setMessage('Microphone access is blocked. Turn it on in your browser, then try again.', 'is-error');
          self.callOrb.setState('error');
          self.retryBtn.hidden = false;
        }
      };
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true, echoCancellation: true, noiseSuppression: true })
          .then(onStream, onFail);
      } else {
        onFail();
      }
    }).catch(function (err) {
      self.setStatus('error', 'Unavailable');
      self.setMessage('Sorry — the agent could not be reached right now.', 'is-error');
      self.callOrb.setState('error');
      if (window.console) console.error('[Tryvium] session failed:', err);
    });
  };

  Widget.prototype.runDemoConversation = function () {
    var self = this;
    this.stopTimers();
    this.timers.push(setTimeout(function () {
      self.callOrb.setState('thinking');
      self.setStatus('thinking', 'Thinking');
      self.setMessage('Just a moment…', 'is-muted');
    }, 2600));
    this.timers.push(setTimeout(function () {
      self.callOrb.setState('speaking');
      self.setStatus('speaking', 'Speaking');
      self.setMessage(self.activeScenario.speak || "Here's what I can do for you.", '');
      self.synthEnergy = 0.85;
    }, 3600));
    this.timers.push(setTimeout(function () {
      self.callOrb.setState('listening');
      self.setStatus('listening', 'Listening');
      self.setMessage('Anything else I can help with?', 'is-muted');
    }, 6200));
    this.timers.push(setTimeout(function () {
      self.runDemoConversation();
    }, 7600));
  };

  Widget.prototype.closeCall = function () {
    var self = this;
    if (!this.overlay.classList.contains('is-open')) return;
    this.overlayOpen = false;
    this.overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    this.stopMic();
    this.stopTimers();
    this.callOrb.inputEnergy = null;
    this.activeAgent.endSession().catch(function (e) { if (window.console) console.error(e); });
    this.restartAutoplay();
    if (this.lastFocused) this.lastFocused.focus({ preventScroll: true });
  };

  Widget.prototype.hangup = function () {
    var self = this;
    if (this.ended) { this.openCall(this.solutions[this.current]); return; }
    this.ended = true;
    this.stopMic();
    this.stopTimers();
    this.callOrb.setState('ended');
    this.setStatus('ended', 'Call ended');
    this.setMessage('Call ended.', 'is-muted');
    this.hangupBtn.setAttribute('data-restart', 'true');
    this.hangupBtn.setAttribute('aria-label', 'Start a new call');
  };

  Widget.prototype.retryMic = function () {
    var self = this;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    this.retryBtn.hidden = true;
    this.setStatus('connecting', 'Connecting');
    this.setMessage('Reconnecting…', 'is-muted');
    this.callOrb.setState('connecting');
    navigator.mediaDevices.getUserMedia({ audio: true, echoCancellation: true, noiseSuppression: true })
      .then(function (stream) {
        self.micStream = stream;
        self.meter = new AudioMeter(stream);
        self.callOrb.inputEnergy = function () { return self.callEnergy(); };
        self.setStatus('listening', 'Listening');
        self.setMessage("Go ahead — I'm listening…", 'is-muted');
        self.callOrb.setState('listening');
        if (self.activeAgent._demo) self.runDemoConversation();
      })
      .catch(function () {
        self.callOrb.setState('error');
        self.setStatus('error', 'Mic unavailable');
      });
  };

  Widget.prototype.setMode = function (next) {
    var self = this;
    if (next === this.mode) return;
    this.mode = next;
    this.stopMic();
    this.stopTimers();
    var toChat = next === 'chat';
    var outEl = toChat ? this.voiceEl : this.chatEl;
    var innEl = toChat ? this.chatEl : this.voiceEl;
    var outFoot = toChat ? this.voiceFoot : this.chatFoot;
    var innFoot = toChat ? this.chatFoot : this.voiceFoot;
    this.setPanelActive(outEl, false);
    outFoot.classList.add('tvx-foot-off');
    setTimeout(function () {
      outFoot.hidden = true;
      innFoot.hidden = false;
      self.setPanelActive(innEl, true);
      innFoot.classList.remove('tvx-foot-off');
      if (toChat) {
        self.setStatus('online', 'Online');
        if (self.chatLog.children.length === 0) self.addChatMessage('agent', self.activeScenario.greeting || 'Hi! What can I help you with today?');
        self.chatInput.focus();
      } else {
        self.setStatus('listening', 'Listening');
        self.callOrb.setState('listening');
        if (self.activeAgent._demo) self.runDemoConversation();
      }
    }, 300);
  };

  Widget.prototype.addChatMessage = function (who, text) {
    var elMsg = el('div', 'tvx-msg ' + who);
    if (who === 'agent') elMsg.innerHTML = '<span class="tvx-msg-dot" aria-hidden="true"></span>';
    elMsg.appendChild(document.createTextNode(text));
    this.chatLog.appendChild(elMsg);
    this.chatLog.scrollTop = this.chatLog.scrollHeight;
    return elMsg;
  };

  Widget.prototype.showTyping = function () {
    var elMsg = el('div', 'tvx-msg agent typing');
    elMsg.setAttribute('aria-label', 'Agent is typing');
    elMsg.innerHTML = '<span></span><span></span><span></span>';
    this.chatLog.appendChild(elMsg);
    this.chatLog.scrollTop = this.chatLog.scrollHeight;
    return elMsg;
  };

  Widget.prototype.sendChat = function () {
    var self = this;
    var text = this.chatInput.value.trim();
    if (!text) return;
    this.addChatMessage('user', text);
    this.chatInput.value = '';
    this.resizeInput();
    this.chatSend.disabled = true;
    var typingEl = this.showTyping();
    this.activeAgent.sendMessage(text).then(function (reply) {
      typingEl.remove();
      self.addChatMessage('agent', reply);
    }).catch(function (err) {
      typingEl.remove();
      self.addChatMessage('agent', 'Sorry — something went wrong reaching the agent.');
      if (window.console) console.error(err);
    }).then(function () {
      self.chatSend.disabled = false;
      self.chatInput.focus();
    });
  };

  Widget.prototype.resizeInput = function () {
    this.chatInput.style.height = 'auto';
    this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
  };

  /* ================================================================
     12 · ENGINE — one shared rAF loop per instance, delta-time
     ================================================================ */
  Widget.prototype.startEngine = function () {
    var self = this;
    this.running = true;
    this.last = performance.now();
    this.clock = 0;
    this.synthEnergy = 0;
    var synthTimer = 0;

    function tick(now) {
      if (!self.running) return;
      var dt = clamp((now - self.last) / 1000, 0, 0.05);
      self.last = now;
      self.clock += dt;
      var t = self.clock;

      if (!self.overlayOpen) {
        self.cardEls.forEach(function (card) {
          card.spring.step(dt);
          self.cardTransform(card, t, pnoise(t * 0.3, card.index * 3.7) * 3);
          /* perf: only live-update orbs near the front; far orbs repaint at 3fps */
          if (Math.abs(card.spring.x) < 1.5) {
            card.orb.update(dt);
          } else {
            card.orbTimer -= dt;
            if (card.orbTimer <= 0) { card.orbTimer = 0.3; card.orb.update(dt); }
          }
        });
      }
      self.ambient.update(dt, t);

      /* synthetic "speaking" envelope */
      synthTimer -= dt;
      if (synthTimer <= 0) {
        synthTimer = rand(0.07, 0.2);
        if (Math.random() < 0.55) self.synthEnergy = rand(0.4, 1);
      }
      self.synthEnergy = Math.pow(0.02, dt) * self.synthEnergy;
      self.callOrb.update(dt);

      requestAnimationFrame(tick);
    }
    this._tick = tick;
    requestAnimationFrame(tick);
  };

  Widget.prototype.pause = function () { this.running = false; this.stopAutoplay(); };
  Widget.prototype.resume = function () {
    if (this.REDUCED || this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._tick);
    if (!this.COURSE && !this.overlayOpen) this.startAutoplay();
  };

  /* ================================================================
     AUDIO METER — mic analyser (lightweight, reused pattern)
     ================================================================ */
  function AudioMeter(stream) {
    this.energy = 0;
    this.ctx = null; this.analyser = null; this.buf = null;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.55;
      this.ctx.createMediaStreamSource(stream).connect(this.analyser);
      this.buf = new Uint8Array(this.analyser.frequencyBinCount);
    } catch (e) {
      if (window.console) console.warn('[Tryvium] audio analyser unavailable:', e);
    }
  }
  AudioMeter.prototype.sample = function (dt) {
    if (!this.analyser) return 0;
    this.analyser.getByteFrequencyData(this.buf);
    var sum = 0, i;
    for (i = 0; i < 24; i++) sum += this.buf[i];
    return damp(this.energy, (sum / (24 * 255)), 9, dt);
  };

  /* ================================================================
     BOOT — read config, fetch solutions, init all .tvx-root instances
     ================================================================ */
  function boot() {
    var globals = window.TryviumCarousel || {};

    function buildFor(root) {
      var cfg = globals || {};
      var solutions = null;

      var attr = root.getAttribute('data-solutions');
      if (attr && attr.length && attr !== '[]') {
        try {
          var parsed = JSON.parse(attr);
          if (Array.isArray(parsed) && parsed.length) solutions = parsed;
          else if (parsed && Array.isArray(parsed.data) && parsed.data.length) solutions = parsed.data;
        } catch (e) { solutions = null; }
      }
      if (!solutions && Array.isArray(cfg.solutions) && cfg.solutions.length) solutions = cfg.solutions;

      var apiBase = cfg.apiBase || root.getAttribute('data-api-base') || '';
      var delayAttr = parseInt(root.getAttribute('data-delay'), 10);
      var delay = (!isNaN(delayAttr) && delayAttr > 0) ? delayAttr : (cfg.delay || 4200);

      function init(list) {
        var normalized = normalizeSolutions(list, apiBase);
        if (!normalized.length) normalized = DEMO_SOLUTIONS.slice();
        var w = new Widget(root, { solutions: normalized, delay: delay });

        /* visibility + intersection gating (performance) */
        document.addEventListener('visibilitychange', function () {
          if (document.hidden) w.pause();
          else w.resume();
        });
        if (window.IntersectionObserver) {
          var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
              if (en.isIntersecting) w.resume();
              else w.pause();
            });
          }, { rootMargin: '100px' });
          io.observe(root);
        }
      }

      if (solutions) {
        init(solutions);
        return;
      }
      var endpoint = cfg.endpoint || root.getAttribute('data-endpoint') || '';
      if (endpoint) {
        fetch(endpoint, { headers: cfg.headers || {} })
          .then(function (res) { return res.json(); })
          .then(function (json) { init(json.data || json.solutions || json); })
          .catch(function (err) { if (window.console) console.warn('[Tryvium] solutions fetch failed, using demo:', err); init(DEMO_SOLUTIONS); });
      } else {
        init(DEMO_SOLUTIONS);
      }
    }

    var roots = document.querySelectorAll('.tvx-root');
    Array.prototype.forEach.call(roots, buildFor);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* public API */
  window.TryviumCarousel = window.TryviumCarousel || {};
  window.TryviumCarousel.THEMES = THEMES;
  window.TryviumCarousel.normalize = normalizeSolutions;
  window.TryviumCarousel.createAgent = createAgent;

})(window, document);
