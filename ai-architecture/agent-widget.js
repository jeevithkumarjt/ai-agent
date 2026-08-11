/* ==========================================================================
   Agent Widget — v2 (premium orb edition)

   Enqueue as a static file via wp_enqueue_script (see functions-php-snippet.php).
   Do NOT paste this inline into an Elementor HTML widget — it is long enough
   that Elementor's textarea handling / LiteSpeed's JS combine has previously
   truncated inline scripts of this size on this site.

   Deliberately written in ES5 (var, string concatenation, no template
   literals) to stay clear of the LiteSpeed "combine + minify breaks ${...}"
   issue seen elsewhere on tryvium.ai.
   ========================================================================== */

(function () {
  "use strict";

  /* ============================================================
     0. MOTION ENGINE
     Small reusable primitives: a shared rAF ticker (one loop for
     the whole page, not one per orb), a critically-damped spring,
     and a cheap "organic" oscillator built from a handful of sine
     waves at incommensurate frequencies with a random per-instance
     phase seed. That last part is the trick that makes nothing
     look like a perfect loop: any two orbs, and any one orb across
     two arbitrary points in time, are on a different point in a
     very long (practically non-repeating) combined cycle.
     ============================================================ */
  var Motion = (function () {
    var listeners = [];
    var running = false;
    var lastT = null;

    function tick(t) {
      if (!running) return;
      var dt = lastT === null ? 16 : Math.min(t - lastT, 48); // clamp to avoid huge jumps on tab-back
      lastT = t;
      for (var i = 0; i < listeners.length; i++) {
        if (listeners[i]) listeners[i](dt / 1000, t);
      }
      requestAnimationFrame(tick);
    }

    function start() {
      if (running) return;
      running = true;
      lastT = null;
      requestAnimationFrame(tick);
    }

    function stopIfIdle() {
      if (listeners.length === 0) running = false;
    }

    return {
      subscribe: function (fn) {
        listeners.push(fn);
        start();
        return function unsubscribe() {
          var idx = listeners.indexOf(fn);
          if (idx > -1) listeners.splice(idx, 1);
          stopIfIdle();
        };
      }
    };
  })();

  /* Critically-damped spring: call every frame with current state,
     get back the next value + velocity. stiffness/damping tuned so
     it settles without overshoot ringing (feels "premium", not bouncy). */
  function springStep(value, target, velocity, stiffness, damping, dt) {
    var force = (target - value) * stiffness - velocity * damping;
    var newVelocity = velocity + force * dt;
    var newValue = value + newVelocity * dt;
    return { value: newValue, velocity: newVelocity };
  }

  /* Sum of a few sine terms at irrational-ish frequency ratios plus a
     random phase seed per call site. Cheap, deterministic, and for any
     practical viewing session (hours) never visibly repeats. */
  function organic(t, seed, speed) {
    var s = speed || 1;
    return (
      Math.sin(t * 0.61 * s + seed) * 0.5 +
      Math.sin(t * 1.27 * s + seed * 1.7) * 0.3 +
      Math.sin(t * 2.03 * s + seed * 2.3) * 0.2
    );
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function lerp(a, b, n) { return a + (b - a) * n; }

  /* ============================================================
     1. LIVING ORB
     Canvas-rendered blob: N control points around a circle, each
     perturbed by organic() with its own seed, connected with a
     smooth closed curve, filled with a layered radial gradient
     (dark rim -> mid -> hot core) plus a soft glow pass and a
     drifting specular highlight for a glassy, dimensional look.
     One instance per canvas; each subscribes to the shared Motion
     ticker and unsubscribes when off-screen or hidden.
     ============================================================ */
  var ORB_STATES = {
    sleeping:    { amp: 0.010, speed: 0.25, glow: 0.30 },
    idle:        { amp: 0.028, speed: 0.45, glow: 0.55 },
    listening:   { amp: 0.055, speed: 0.85, glow: 0.80 },
    thinking:    { amp: 0.045, speed: 1.35, glow: 0.75, spin: true },
    speaking:    { amp: 0.075, speed: 1.1,  glow: 0.95 },
    error:       { amp: 0.020, speed: 0.6,  glow: 0.65, tint: "#E5482F" },
    disconnected:{ amp: 0.006, speed: 0.2,  glow: 0.25 }
  };

  function LivingOrb(canvas, palette, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.palette = palette; // { light, mid, dark }
    this.points = 7;
    this.seeds = [];
    for (var i = 0; i < this.points; i++) this.seeds.push(Math.random() * 100);
    this.rotSeed = Math.random() * 100;
    this.state = "idle";
    this.audioLevel = 0;           // 0..1, set externally from an AnalyserNode
    this.audioLevelDisplay = 0;    // spring-smoothed version of the above
    this.audioVelocity = 0;
    this.t = Math.random() * 50;   // random start phase so instances never sync
    this.reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._unsub = null;
    this._visible = true;
    this._resize();
    this._bindVisibility();
    this.start();
  }

  LivingOrb.prototype._resize = function () {
    var rect = this.canvas.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height) || 160;
    this.canvas.width = size * this.dpr;
    this.canvas.height = size * this.dpr;
    this.cx = this.canvas.width / 2;
    this.cy = this.canvas.height / 2;
    this.r = (this.canvas.width / 2) * 0.62;
  };

  LivingOrb.prototype._bindVisibility = function () {
    var self = this;
    if ("IntersectionObserver" in window) {
      this._io = new IntersectionObserver(function (entries) {
        self._visible = entries[0].isIntersecting;
        self._syncRunning();
      }, { threshold: 0.05 });
      this._io.observe(this.canvas);
    }
    this._onVis = function () { self._syncRunning(); };
    document.addEventListener("visibilitychange", this._onVis);
  };

  LivingOrb.prototype._syncRunning = function () {
    var shouldRun = this._visible && !document.hidden;
    if (shouldRun && !this._unsub) this.start();
    if (!shouldRun && this._unsub) this.stop();
  };

  LivingOrb.prototype.setState = function (state) {
    this.state = ORB_STATES[state] ? state : "idle";
  };

  LivingOrb.prototype.setAudioLevel = function (level) {
    this.audioLevel = clamp(level, 0, 1);
  };

  LivingOrb.prototype.start = function () {
    if (this._unsub) return;
    var self = this;
    this._unsub = Motion.subscribe(function (dt) { self._frame(dt); });
  };

  LivingOrb.prototype.stop = function () {
    if (this._unsub) { this._unsub(); this._unsub = null; }
  };

  LivingOrb.prototype.destroy = function () {
    this.stop();
    if (this._io) this._io.disconnect();
    document.removeEventListener("visibilitychange", this._onVis);
  };

  LivingOrb.prototype._frame = function (dt) {
    var cfg = ORB_STATES[this.state];
    var speedMul = this.reduced ? 0.12 : 1;
    var ampMul = this.reduced ? 0.25 : 1;
    this.t += dt * cfg.speed * speedMul;

    // Smooth the raw audio level toward a spring target so speech-driven
    // pulses feel elastic rather than jittery frame-to-frame.
    var sp = springStep(this.audioLevelDisplay, this.audioLevel, this.audioVelocity, 90, 14, dt);
    this.audioLevelDisplay = sp.value; this.audioVelocity = sp.velocity;

    this._draw(cfg, ampMul);
  };

  LivingOrb.prototype._draw = function (cfg, ampMul) {
    var ctx = this.ctx, cx = this.cx, cy = this.cy, r = this.r;
    var w = this.canvas.width, h = this.canvas.height;
    var t = this.t;
    var p = this.palette;
    var audioBoost = (this.state === "listening" || this.state === "speaking") ? this.audioLevelDisplay * 0.55 : 0;
    var amp = r * (cfg.amp + audioBoost) * ampMul;

    ctx.clearRect(0, 0, w, h);

    // ---- outer glow pass (blurred, drawn first, sits behind everything) ----
    ctx.save();
    ctx.filter = "blur(" + Math.round(r * 0.35) + "px)";
    var glowGrad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.25);
    var glowColor = cfg.tint || p.mid;
    glowGrad.addColorStop(0, hexToRgba(glowColor, cfg.glow * 0.55));
    glowGrad.addColorStop(1, hexToRgba(glowColor, 0));
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ---- build the organic blob outline ----
    var pts = [];
    var spin = cfg.spin ? t * 0.6 : 0;
    for (var i = 0; i < this.points; i++) {
      var angle = (i / this.points) * Math.PI * 2 + spin;
      var n = organic(t, this.seeds[i], 1);
      var radius = r + n * amp;
      pts.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
    }

    ctx.save();
    ctx.beginPath();
    drawSmoothClosedPath(ctx, pts);
    ctx.clip();

    // base fill: dark rim -> mid -> bright core, core drifts slightly for a
    // "liquid" internal-light feel rather than a static gradient.
    var driftX = organic(t, this.rotSeed, 0.5) * r * 0.18;
    var driftY = organic(t, this.rotSeed + 11, 0.5) * r * 0.18;
    var core = ctx.createRadialGradient(
      cx + driftX - r * 0.15, cy + driftY - r * 0.2, r * 0.05,
      cx, cy, r * 1.05
    );
    var tint = cfg.tint;
    core.addColorStop(0, tint ? hexToRgba(tint, 0.9) : "#ffffff");
    core.addColorStop(0.42, tint || p.light);
    core.addColorStop(0.75, p.mid);
    core.addColorStop(1, p.dark);
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, w, h);

    // secondary color-diffusion pass — a soft second light source that
    // drifts independently, giving depth without another blur pass.
    var d2x = organic(t, this.rotSeed + 30, 0.35) * r * 0.5;
    var d2y = organic(t, this.rotSeed + 41, 0.35) * r * 0.5;
    var diffuse = ctx.createRadialGradient(cx + d2x, cy + d2y, 0, cx + d2x, cy + d2y, r * 0.9);
    diffuse.addColorStop(0, hexToRgba(p.light, 0.35));
    diffuse.addColorStop(1, hexToRgba(p.light, 0));
    ctx.fillStyle = diffuse;
    ctx.fillRect(0, 0, w, h);

    // specular highlight — small bright ellipse, fixed-ish upper-left with
    // a slow independent drift, reads as a glass/light reflection.
    var hx = cx - r * 0.32 + organic(t, this.rotSeed + 5, 0.4) * r * 0.08;
    var hy = cy - r * 0.38 + organic(t, this.rotSeed + 6, 0.4) * r * 0.08;
    var spec = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 0.4);
    spec.addColorStop(0, "rgba(255,255,255,0.85)");
    spec.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = spec;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();

    // thin rim light so the edge doesn't look flat against the page
    ctx.save();
    ctx.beginPath();
    drawSmoothClosedPath(ctx, pts);
    ctx.lineWidth = Math.max(1, r * 0.012);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.stroke();
    ctx.restore();
  };

  function drawSmoothClosedPath(ctx, pts) {
    var n = pts.length;
    ctx.moveTo((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
    for (var i = 0; i < n; i++) {
      var p0 = pts[i], p1 = pts[(i + 1) % n];
      var midX = (p0.x + p1.x) / 2, midY = (p0.y + p1.y) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    ctx.closePath();
  }

  function hexToRgba(hex, alpha) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  }

  /* ============================================================
     2. CONTENT
     ============================================================ */
  var SCENARIOS = [
    { key: "blue",  tag: "Your Company", title: "Ask anything",     light: "#BFEBFF", mid: "#4FB4EE", dark: "#2E7FD1" },
    { key: "green", tag: "Healthcare",   title: "Patient services", light: "#E4FFB8", mid: "#8FD94A", dark: "#4E9C1E" },
    { key: "coral", tag: "Insurance",    title: "Claims & service", light: "#FFD8CE", mid: "#F0716B", dark: "#D33E52" },
    { key: "amber", tag: "Financial",    title: "Customer service", light: "#FFEBB8", mid: "#F5B94A", dark: "#D68A1E" }
  ];
  var N = SCENARIOS.length;
  var PLAY_ICON = '<svg viewBox="0 0 24 24" fill="#17181A"><path d="M8 5v14l11-7z"/></svg>';

  /* ============================================================
     3. AGENT API — demo/prod switch, dev team edits BASE_URL/API_KEY only.
     ============================================================ */
  var AgentAPI = (function () {
    var DEMO_MODE = true;
    var BASE_URL  = "https://api.yourcompany.com/v1"; // TODO: dev team
    var API_KEY   = null; // TODO: inject server-side only, never in this file
    var sessionId = null;
    function demoDelay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    return {
      async startSession(mode) {
        if (DEMO_MODE) { await demoDelay(500); sessionId = "demo-" + Date.now(); return { sessionId: sessionId, agentName: "Ava" }; }
        var res = await fetch(BASE_URL + "/sessions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + API_KEY }, body: JSON.stringify({ mode: mode }) });
        if (!res.ok) throw new Error("Failed to start session: " + res.status);
        var data = await res.json(); sessionId = data.sessionId; return data;
      },
      async sendMessage(text) {
        if (DEMO_MODE) {
          await demoDelay(700 + Math.random() * 500);
          var canned = ["Got it — can you tell me a bit more?", "I can help with that, one moment.", "Noted. Anything else I can check?", "Let me look into this for you."];
          return canned[Math.floor(Math.random() * canned.length)];
        }
        var res = await fetch(BASE_URL + "/sessions/" + sessionId + "/messages", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + API_KEY }, body: JSON.stringify({ text: text }) });
        if (!res.ok) throw new Error("Message failed: " + res.status);
        var data = await res.json(); return data.reply;
      },
      async endSession() {
        if (!sessionId) return;
        if (DEMO_MODE) { await demoDelay(150); sessionId = null; return; }
        await fetch(BASE_URL + "/sessions/" + sessionId, { method: "DELETE", headers: { "Authorization": "Bearer " + API_KEY } });
        sessionId = null;
      },
      hasSession: function () { return !!sessionId; }
    };
  })();

  /* ============================================================
     4. INIT — one widget instance per .aw-root found on the page
     ============================================================ */
  function initWidget(root) {
    var stage = root.querySelector(".aw-stage");
    var dotsWrap = root.querySelector(".aw-dots");
    var prevBtn = root.querySelector(".aw-nav-prev");
    var nextBtn = root.querySelector(".aw-nav-next");
    var captionBtn = root.querySelector(".aw-caption");
    var current = 0;
    var cardEls = [];
    var cardOrbs = [];

    function signedDiff(i) { var raw = i - current; while (raw > N / 2) raw -= N; while (raw < -N / 2) raw += N; return raw; }

    function layout() {
      cardEls.forEach(function (el, i) {
        var d = signedDiff(i), abs = Math.abs(d);
        var x = d * 236, rot = d * -16, scale = Math.max(1 - abs * 0.08, 0.72), z = 100 - abs;
        var opacity = abs > 2 ? 0 : (abs === 2 ? 0.35 : 1);
        el.style.transform = "translateX(" + x + "px) rotateY(" + rot + "deg) scale(" + scale + ")";
        el.style.zIndex = z; el.style.opacity = opacity;
        el.style.pointerEvents = abs > 2 ? "none" : "auto";
        el.setAttribute("data-front", d === 0 ? "true" : "false");
        el.setAttribute("aria-hidden", d === 0 ? "false" : "true");
        el.tabIndex = d === 0 ? 0 : -1;
        // pause off-card orbs' higher-cost states; front card stays lively
        if (cardOrbs[i]) cardOrbs[i].setState(d === 0 ? "idle" : "sleeping");
      });
      Array.prototype.forEach.call(dotsWrap.children, function (dot, i) { dot.classList.toggle("is-active", i === current); dot.setAttribute("aria-current", i === current ? "true" : "false"); });
    }

    function buildCards() {
      stage.innerHTML = ""; dotsWrap.innerHTML = ""; cardEls = []; cardOrbs = [];
      SCENARIOS.forEach(function (s, i) {
        var el = document.createElement("div");
        el.className = "aw-card";
        el.setAttribute("role", "button");
        el.setAttribute("aria-label", "Talk to " + s.tag + " agent: " + s.title);
        el.innerHTML =
          '<div class="aw-orb-slot"><canvas></canvas><div class="aw-play-btn">' + PLAY_ICON + '</div></div>' +
          '<div class="aw-card-tag">' + s.tag + '</div><div class="aw-card-title">' + s.title + '</div>';
        el.addEventListener("click", function () {
          if (dragMoved) return;
          if (signedDiff(i) === 0) { openCall(s); } else { goTo(i); }
        });
        el.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (signedDiff(i) === 0) openCall(s); else goTo(i); }
        });
        stage.appendChild(el); cardEls.push(el);
        var canvas = el.querySelector("canvas");
        cardOrbs.push(new LivingOrb(canvas, s));

        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "aw-dot-btn"; dot.setAttribute("aria-label", "Go to slide " + (i + 1) + " of " + N);
        dot.addEventListener("click", function () { goTo(i); });
        dotsWrap.appendChild(dot);
      });
      layout();
    }
    function goTo(i) { current = ((i % N) + N) % N; layout(); restartAutoplay(); }
    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }
    buildCards();
    prevBtn.addEventListener("click", prev);
    nextBtn.addEventListener("click", next);
    captionBtn.addEventListener("click", function () { openCall(SCENARIOS[current]); });

    var autoplayTimer = null;
    function startAutoplay() { autoplayTimer = setInterval(next, 3600); }
    function restartAutoplay() { clearInterval(autoplayTimer); if (!modalOpen) startAutoplay(); }
    startAutoplay();
    stage.addEventListener("mouseenter", function () { clearInterval(autoplayTimer); });
    stage.addEventListener("mouseleave", function () { if (!modalOpen) startAutoplay(); });

    var dragging = false, dragStartX = 0, dragMoved = false;
    function dragStart(x) { dragging = true; dragMoved = false; dragStartX = x; clearInterval(autoplayTimer); stage.classList.add("is-dragging"); }
    function dragMove(x) {
      if (!dragging) return;
      var delta = x - dragStartX; if (Math.abs(delta) > 6) dragMoved = true;
      cardEls.forEach(function (el, i) {
        var d = signedDiff(i), baseX = d * 236;
        el.style.transform = "translateX(" + (baseX + delta) + "px) rotateY(" + (d * -16) + "deg) scale(" + Math.max(1 - Math.abs(d) * 0.08, 0.72) + ")";
      });
    }
    function dragEnd(x) {
      if (!dragging) return;
      dragging = false; stage.classList.remove("is-dragging");
      var delta = x - dragStartX;
      if (delta < -60) next(); else if (delta > 60) prev(); else layout();
      if (!modalOpen) startAutoplay();
    }
    stage.addEventListener("mousedown", function (e) { dragStart(e.clientX); });
    window.addEventListener("mousemove", function (e) { dragMove(e.clientX); });
    window.addEventListener("mouseup", function (e) { dragEnd(e.clientX); });
    stage.addEventListener("touchstart", function (e) { dragStart(e.touches[0].clientX); }, { passive: true });
    stage.addEventListener("touchmove", function (e) { dragMove(e.touches[0].clientX); }, { passive: true });
    stage.addEventListener("touchend", function (e) { dragEnd(e.changedTouches[0].clientX); });

    /* --------------------------------------------------------
       Call modal
       -------------------------------------------------------- */
    var overlay = root.querySelector(".aw-call-overlay");
    var callOrbSlot = overlay.querySelector(".aw-call-orb-slot");
    var callMessage = overlay.querySelector("#aw-call-message, .aw-call-message");
    var callStatus = overlay.querySelector(".aw-call-status");
    var callTag = overlay.querySelector(".aw-call-tag");
    var callTitle = overlay.querySelector(".aw-call-title");
    var voiceMode = overlay.querySelector(".aw-voice-mode");
    var chatModeEl = overlay.querySelector(".aw-chat-mode");
    var voiceFoot = overlay.querySelector(".aw-voice-foot");
    var chatFoot = overlay.querySelector(".aw-chat-foot");
    var chatLog = overlay.querySelector(".aw-call-chatlog");
    var closeBtn = overlay.querySelector(".aw-call-close");
    var hangupBtn = overlay.querySelector(".aw-hangup-btn");
    var typeInsteadBtn = overlay.querySelector(".aw-type-instead");
    var backToVoiceBtn = overlay.querySelector(".aw-back-to-voice");
    var chatInput = overlay.querySelector(".aw-call-input");
    var chatSend = overlay.querySelector(".aw-call-send");

    var micStream = null, audioCtx = null, analyser = null, audioRafId = null;
    var callOrb = null;
    var modalOpen = false;
    var lastFocusedEl = null;

    function readMicLevel() {
      if (!analyser) return;
      var data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      var sum = 0;
      for (var i = 0; i < data.length; i++) sum += data[i];
      var avg = sum / data.length / 255; // 0..1
      if (callOrb) callOrb.setAudioLevel(avg);
      audioRafId = requestAnimationFrame(readMicLevel);
    }

    async function openCall(scenario) {
      lastFocusedEl = document.activeElement;
      callTag.textContent = scenario.tag.toUpperCase();
      callTitle.textContent = scenario.title;
      callOrbSlot.innerHTML = "";
      var canvas = document.createElement("canvas");
      callOrbSlot.appendChild(canvas);
      callOrb = new LivingOrb(canvas, scenario);
      callOrb.setState("idle");

      callMessage.className = "aw-call-message";
      callMessage.textContent = "";
      callStatus.textContent = "Connecting";
      callStatus.setAttribute("data-live", "false");
      voiceMode.style.display = "flex"; chatModeEl.style.display = "none";
      voiceFoot.style.display = "flex"; chatFoot.style.display = "none";
      chatLog.innerHTML = "";
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", trapFocus, true);
      document.addEventListener("keydown", onEscape);
      modalOpen = true;
      clearInterval(autoplayTimer);

      try {
        await AgentAPI.startSession("voice");
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        var AC = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AC();
        var source = audioCtx.createMediaStreamSource(micStream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        readMicLevel();

        callStatus.textContent = "Listening";
        callStatus.setAttribute("data-live", "true");
        callOrb.setState("listening");
        callMessage.className = "aw-call-message is-muted";
        callMessage.textContent = "Go ahead, I'm listening…";
        focusFirstIn(overlay);
      } catch (err) {
        callStatus.textContent = "Ended";
        callStatus.setAttribute("data-live", "error");
        callOrb.setState("error");
        callMessage.className = "aw-call-message is-error";
        callMessage.textContent = "Microphone access is blocked. Turn it on in your browser, then try again.";
        console.warn("[AgentAPI] mic permission error:", err);
        focusFirstIn(overlay);
      }
    }

    function stopMic() {
      if (audioRafId) { cancelAnimationFrame(audioRafId); audioRafId = null; }
      if (micStream) { micStream.getTracks().forEach(function (t) { t.stop(); }); micStream = null; }
      if (audioCtx) { audioCtx.close().catch(function () {}); audioCtx = null; }
      analyser = null;
    }

    function endCallSession() {
      stopMic();
      if (callOrb) { callOrb.setState("disconnected"); }
      return AgentAPI.endSession().catch(function (e) { console.error(e); });
    }

    function closeCall() {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", trapFocus, true);
      document.removeEventListener("keydown", onEscape);
      modalOpen = false;
      endCallSession();
      if (callOrb) { callOrb.destroy(); callOrb = null; }
      if (lastFocusedEl && typeof lastFocusedEl.focus === "function") lastFocusedEl.focus();
      startAutoplay();
    }

    function onEscape(e) { if (e.key === "Escape" && overlay.classList.contains("is-open")) closeCall(); }

    function focusableEls(container) {
      return Array.prototype.slice.call(container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter(function (el) { return el.offsetParent !== null; });
    }
    function focusFirstIn(container) {
      var els = focusableEls(container);
      if (els.length) els[0].focus();
    }
    function trapFocus(e) {
      if (e.key !== "Tab" || !overlay.classList.contains("is-open")) return;
      var els = focusableEls(overlay.querySelector(".aw-call-card"));
      if (!els.length) return;
      var first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    closeBtn.addEventListener("click", closeCall);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeCall(); });

    hangupBtn.addEventListener("click", function () {
      endCallSession();
      callStatus.textContent = "Ended";
      callStatus.setAttribute("data-live", "false");
      callMessage.className = "aw-call-message is-muted";
      callMessage.textContent = "Call ended.";
    });

    typeInsteadBtn.addEventListener("click", switchToChat);
    backToVoiceBtn.addEventListener("click", function () {
      voiceMode.style.display = "flex"; chatModeEl.style.display = "none";
      voiceFoot.style.display = "flex"; chatFoot.style.display = "none";
    });

    function switchToChat() {
      stopMic();
      if (callOrb) callOrb.setState("idle");
      voiceMode.style.display = "none"; chatModeEl.style.display = "flex";
      voiceFoot.style.display = "none"; chatFoot.style.display = "flex";
      callStatus.textContent = "Online";
      callStatus.setAttribute("data-live", "true");
      if (chatLog.children.length === 0) addChatMessage("agent", "Hi! What can I help you with today?");
      chatInput.focus();
    }

    function addChatMessage(who, text) {
      var el = document.createElement("div"); el.className = "aw-msg " + who; el.textContent = text;
      chatLog.appendChild(el); chatLog.scrollTop = chatLog.scrollHeight; return el;
    }
    function showTyping() {
      var el = document.createElement("div"); el.className = "aw-msg agent typing"; el.setAttribute("aria-hidden", "true");
      el.innerHTML = "<span></span><span></span><span></span>";
      chatLog.appendChild(el); chatLog.scrollTop = chatLog.scrollHeight; return el;
    }
    async function sendChat() {
      var text = chatInput.value.trim(); if (!text) return;
      addChatMessage("user", text); chatInput.value = ""; chatSend.disabled = true;
      var typingEl = showTyping();
      if (callOrb) callOrb.setState("thinking");
      try {
        var reply = await AgentAPI.sendMessage(text);
        typingEl.remove();
        if (callOrb) callOrb.setState("speaking");
        addChatMessage("agent", reply);
        setTimeout(function () { if (callOrb) callOrb.setState("idle"); }, 1400);
      } catch (err) {
        typingEl.remove();
        if (callOrb) callOrb.setState("error");
        addChatMessage("agent", "Sorry — something went wrong reaching the agent.");
        console.error(err);
      } finally {
        chatSend.disabled = false; chatInput.focus();
      }
    }
    chatSend.addEventListener("click", sendChat);
    chatInput.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } });
  }

  function boot() {
    var roots = document.querySelectorAll(".aw-root");
    for (var i = 0; i < roots.length; i++) initWidget(roots[i]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
