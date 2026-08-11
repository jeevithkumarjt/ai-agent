/* ==========================================================================
   Voice UI — Carousel (assets/js/carousel.js) — M6
   --------------------------------------------------------------------------
   Physics cover-flow. Cards are positioned per-frame by damped springs
   (220/30 — "carousel snap") toward their target offset, which gives the
   direct-manipulation rubber-band feel from the v2 prototype.

   Inputs
   ------
   * drag / swipe (pointer events, 6px threshold before click is suppressed)
   * wheel (debounced, direction-locked)
   * keyboard (← → Home End, Enter/Space opens the front card)
   * nav buttons, dots, caption CTA
   * autoplay — on for mouse, off for touch + reduced motion

   The DOM for cards, dots and nav is generated from `opts.scenarios`.
   Load order: utils.js → motion-engine.js → orb-engine.js → carousel.js.
   Namespace: window.VUI.carousel.
   ========================================================================== */

(function (VUI) {
  'use strict';

  var utils = VUI.utils;

  var MIN_DRAG = 6;
  var WHEEL_MS = 380;

  function Carousel(el, opts) {
    this.el = el;
    this.opts = opts || {};
    this.scenarios = this.opts.scenarios || [];
    this.onOpen = this.opts.onOpen || null;
    this.onChange = this.opts.onChange || null;
    this.autoplayMs = this.opts.autoplayMs == null ? 4500 : this.opts.autoplayMs;
    this.reduced = utils.prefersReducedMotion();
    this.motion = VUI.motion;
    this.index = 0;
    this.cards = [];
    this.orbs = [];
    this.springs = [];
    this.dots = [];
    this.unsubs = [];
    this.stage = null;
    this.cardW = 328;
    this.cardGap = 24;
    this._drag = null;
    this._wheelT = 0;
    this._autoTimer = null;
    this._visible = true;
    this._build();
  }

  /* ---- Build ------------------------------------------------------------ */

  Carousel.prototype._build = function () {
    var self = this;

    var stage = document.createElement('div');
    stage.className = 'vui-stage';
    stage.setAttribute('aria-label', 'Voice scenarios');
    this.stage = stage;

    var prev = this._iconBtn('vui-nav vui-nav--prev', 'icon-chevron-left', 'Previous scenario');
    var next = this._iconBtn('vui-nav vui-nav--next', 'icon-chevron-right', 'Next scenario');
    prev.addEventListener('click', function () { self.prev(); });
    next.addEventListener('click', function () { self.next(); });

    var dots = document.createElement('div');
    dots.className = 'vui-dots';
    dots.setAttribute('role', 'tablist');
    dots.setAttribute('aria-label', 'Choose a scenario');
    this.dotsEl = dots;

    var cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'vui-caption-cta';
    cta.innerHTML =
      '<svg class="vui-icon vui-icon--sm" aria-hidden="true"><use href="#icon-phone"></use></svg>' +
      'Click to speak with an agent';
    cta.addEventListener('click', function () { self.open(); });

    this.el.appendChild(stage);
    this.el.appendChild(prev);
    this.el.appendChild(next);
    this.el.appendChild(dots);
    this.el.appendChild(cta);

    this.scenarios.forEach(function (s, i) {
      self._buildCard(s, i);
      self._buildDot(s, i);
    });

    this._wire();
    this.setIndex(0, true);
    if (!this.reduced && this.motion) {
      var unsub = this.motion.subscribe(function (dt) { self._frame(dt); });
      this.unsubs.push(unsub);
    }
    this._startAutoplay();
  };

  Carousel.prototype._buildCard = function (scenario, i) {
    var self = this;
    var card = document.createElement('article');
    card.className = 'vui-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', scenario.title + ' — click to talk');

    var orbSlot = document.createElement('div');
    orbSlot.className = 'vui-orb vui-orb--card';

    card.innerHTML =
      '<div class="vui-card__media"></div>' +
      '<div class="vui-card__body">' +
      '<span class="vui-overline"></span>' +
      '<h3 class="vui-title vui-card__title"></h3>' +
      '<p class="vui-card__blurb"></p>' +
      '</div>';

    var media = card.querySelector('.vui-card__media');
    var badge = document.createElement('span');
    badge.className = 'vui-play-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = '<svg class="vui-icon"><use href="#icon-play"></use></svg>';
    media.appendChild(orbSlot);
    media.appendChild(badge);

    card.querySelector('.vui-overline').textContent = scenario.tag;
    card.querySelector('.vui-card__title').textContent = scenario.title;
    card.querySelector('.vui-card__blurb').textContent = scenario.blurb;

    card.addEventListener('click', function (e) {
      if (self._drag && self._drag.moved) return;
      if (Math.abs(self.targetFor(i)) < 0.5) self._openScenario(scenario);
      else self.setIndex(i);
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (Math.abs(self.targetFor(i)) < 0.5) self._openScenario(scenario);
        else self.setIndex(i);
      }
    });

    this.stage.appendChild(card);
    this.cards.push(card);

    if (!this.reduced && this.motion) {
      this.springs[i] = new this.motion.Spring(220, 30, i);
    }

    if (window.VUI.orb) {
      var orb = new window.VUI.orb.Orb(orbSlot, {
        size: 112,
        palette: scenario.orb || 'sky',
        state: 'idle'
      });
      this.orbs.push(orb);
    } else {
      this.orbs.push(null);
    }
  };

  Carousel.prototype._buildDot = function (scenario, i) {
    var self = this;
    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'vui-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', 'Go to scenario: ' + scenario.title);
    dot.addEventListener('click', function () { self.setIndex(i); });
    this.dots.push(dot);
    this.dotsEl.appendChild(dot);
  };

  Carousel.prototype._iconBtn = function (className, icon, label) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.setAttribute('aria-label', label);
    btn.innerHTML = '<svg class="vui-icon" aria-hidden="true"><use href="#' + icon + '"></use></svg>';
    return btn;
  };

  /* ---- Geometry --------------------------------------------------------- */

  Carousel.prototype.targetFor = function (i) {
    return i - this.index;
  };

  Carousel.prototype.setIndex = function (i, immediate) {
    this.index = utils.clamp(i, 0, this.scenarios.length - 1);
    var self = this;
    this.cards.forEach(function (card, ci) {
      var t = self.targetFor(ci);
      if (immediate && self.springs[ci]) self.springs[ci].set(t);
    });
    this._syncDots();
    this._renderAll();
    if (this.onChange) this.onChange(this.index);
    this._resetAutoplay();
  };

  Carousel.prototype.next = function () {
    if (this.index < this.scenarios.length - 1) this.setIndex(this.index + 1);
    else this.setIndex(0);
  };

  Carousel.prototype.prev = function () {
    if (this.index > 0) this.setIndex(this.index - 1);
    else this.setIndex(this.scenarios.length - 1);
  };

  Carousel.prototype.open = function () {
    this._openScenario(this.scenarios[this.index]);
  };

  Carousel.prototype.getCurrent = function () {
    return this.scenarios[this.index];
  };

  Carousel.prototype._openScenario = function (scenario) {
    if (this.onOpen) this.onOpen(scenario, this.cards[this.scenarios.indexOf(scenario)]);
  };

  Carousel.prototype._syncDots = function () {
    for (var i = 0; i < this.dots.length; i++) {
      var on = i === this.index;
      this.dots[i].classList.toggle('is-active', on);
      this.dots[i].setAttribute('aria-selected', on ? 'true' : 'false');
      this.dots[i].setAttribute('aria-current', on ? 'true' : 'false');
    }
  };

  /* ---- Per-frame physics ------------------------------------------------ */

  Carousel.prototype._frame = function (dt) {
    if (!this._visible) return;
    if (this._drag) this._updateDrag();
    var self = this;
    var settled = true;
    for (var i = 0; i < this.cards.length; i++) {
      var spring = this.springs[i];
      var target = this.targetFor(i) + (this._drag ? this._drag.px / this.spacing() : 0);
      if (!spring) continue;
      var cur = spring.update(target, dt);
      if (Math.abs(cur - target) > 0.02) settled = false;
      this._render(i, cur);
    }
    this._settled = settled;
  };

  Carousel.prototype._render = function (i, cur) {
    var card = this.cards[i];
    if (!card) return;
    var step = Math.abs(cur);
    var rotateY = cur * -14;
    var scale = 1 - Math.min(step, 2) * 0.07;
    var x = cur * this.spacing();
    var z = -Math.min(step, 3) * 90;
    var opacity = Math.max(0.25, 1 - step * 0.28);
    card.style.transform = 'translate(-50%,-50%) translate3d(' +
      x.toFixed(2) + 'px,0,' + z.toFixed(2) + 'px) rotateY(' +
      rotateY.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
    card.style.opacity = opacity.toFixed(3);
    card.style.zIndex = String(100 - Math.round(step));
    card.classList.toggle('is-front', step < 0.5);
  };

  Carousel.prototype._renderAll = function () {
    var self = this;
    this.cards.forEach(function (card, i) {
      self._render(i, self.springs[i] ? self.springs[i].value : self.targetFor(i));
    });
  };

  Carousel.prototype._measure = function () {
    if (this.cards[0]) this.cardW = this.cards[0].getBoundingClientRect().width || 328;
  };

  Carousel.prototype.spacing = function () {
    return this.cardW * 0.72 + this.cardGap;
  };

  /* ---- Direct manipulation --------------------------------------------- */

  Carousel.prototype._updateDrag = function () {
    var drag = this._drag;
    if (!drag) return;
    var dx = drag.x - drag.startX;
    var dy = drag.y - drag.startY;
    if (!drag.moved && Math.sqrt(dx * dx + dy * dy) > MIN_DRAG) {
      drag.moved = true;
      this.stage.classList.add('is-dragging');
    }
    if (drag.moved) {
      this._drag.px = drag.x - drag.downX;
    }
  };

  Carousel.prototype._endDrag = function () {
    var drag = this._drag;
    if (!drag) return;
    this._drag = null;
    this.stage.classList.remove('is-dragging');
    if (!drag.moved) return;
    var units = drag.px / this.spacing();
    if (Math.abs(units) < 0.35) {
      this.setIndex(this.index);
    } else {
      this.setIndex(this.index - Math.round(units));
    }
  };

  /* ---- Events ----------------------------------------------------------- */

  Carousel.prototype._wire = function () {
    var self = this;
    var stage = this.stage;

    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      self._drag = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        downX: e.clientX,
        downY: e.clientY,
        x: e.clientX,
        y: e.clientY,
        px: 0,
        moved: false
      };
      self._pauseAutoplay();
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    stage.addEventListener('pointermove', function (e) {
      if (!self._drag || self._drag.id !== e.pointerId) return;
      self._drag.x = e.clientX;
      self._drag.y = e.clientY;
      self._updateDrag();
    });
    stage.addEventListener('pointerup', function (e) {
      if (self._drag && self._drag.id === e.pointerId) self._endDrag();
      self._resetAutoplay();
    });
    stage.addEventListener('pointercancel', function () {
      self._drag = null;
      self.stage.classList.remove('is-dragging');
      self._resetAutoplay();
    });

    stage.addEventListener('wheel', function (e) {
      var now = utils.now();
      if (now - self._wheelT < WHEEL_MS) return;
      if (Math.abs(e.deltaY) < 10) return;
      e.preventDefault();
      self._wheelT = now;
      if (e.deltaY > 0) self.next(); else self.prev();
    }, { passive: false });

    this.el.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowLeft') { e.preventDefault(); self.prev(); }
      else if (k === 'ArrowRight') { e.preventDefault(); self.next(); }
      else if (k === 'Home') { e.preventDefault(); self.setIndex(0); }
      else if (k === 'End') { e.preventDefault(); self.setIndex(self.scenarios.length - 1); }
      else return;
    });

    this.el.addEventListener('pointerenter', function () { self._pauseAutoplay(); });
    this.el.addEventListener('pointerleave', function () { self._resetAutoplay(); });
    this.el.addEventListener('focusin', function () { self._pauseAutoplay(); });
    this.el.addEventListener('focusout', function () { self._resetAutoplay(); });

    if ('IntersectionObserver' in window) {
      this._io = new IntersectionObserver(function (entries) {
        self._visible = entries[0] && entries[0].isIntersecting;
      }, { threshold: 0.05 });
      this._io.observe(this.el);
    }

    var self2 = this;
    var debounced = utils.debounce(function () { self2._measure(); self2._renderAll(); }, 150);
    window.addEventListener('resize', debounced);
    this._onResize = debounced;
  };

  /* ---- Autoplay --------------------------------------------------------- */

  Carousel.prototype._startAutoplay = function () {
    if (this.reduced) return;
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
    var self = this;
    this._pauseAutoplay();
    this._autoTimer = setTimeout(function () { self.next(); }, this.autoplayMs);
  };

  Carousel.prototype._pauseAutoplay = function () {
    if (this._autoTimer) { clearTimeout(this._autoTimer); this._autoTimer = null; }
  };

  Carousel.prototype._resetAutoplay = function () {
    this._startAutoplay();
  };

  /* ---- Teardown --------------------------------------------------------- */

  Carousel.prototype.destroy = function () {
    this._pauseAutoplay();
    if (this._io) this._io.disconnect();
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    for (var i = 0; i < this.unsubs.length; i++) this.unsubs[i]();
    this.unsubs = [];
    for (var o = 0; o < this.orbs.length; o++) {
      if (this.orbs[o]) this.orbs[o].destroy();
    }
    this.el.innerHTML = '';
  };

  VUI.carousel = { Carousel: Carousel };
})(window.VUI = window.VUI || {});
