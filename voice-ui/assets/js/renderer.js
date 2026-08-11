/* ==========================================================================
   Voice UI — Renderer (assets/js/renderer.js)
   --------------------------------------------------------------------------
   Pure DOM factory. Builds card, dot, nav and chrome elements from normalized
   scenario objects so the carousel engine stays focused on physics + input.

   Card contract (normalized by api-adapter.js):
     { id, industry, title, description, tags[], icon, cta, api,
       theme, orb, greeting, replies[], prompts[] }

   All text is set via textContent (no innerHTML with user data).
   Load order: utils.js → motion-engine.js → renderer.js → carousel.js.
   Namespace: window.VUI.renderer.
   ========================================================================== */

(function (VUI) {
  'use strict';

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function icon(id, size) {
    var cls = size ? 'vui-icon ' + size : 'vui-icon';
    return '<svg class="' + cls + '" aria-hidden="true"><use href="#icon-' + id + '"></use></svg>';
  }

  /* ---- Card -------------------------------------------------------------- */

  function card(scenario, index) {
    var c = document.createElement('article');
    c.className = 'vui-card';
    c.tabIndex = 0;
    c.setAttribute('role', 'button');
    c.setAttribute('aria-label', scenario.title + ' — click to talk');

    var media = el('div', 'vui-card__media');

    var orbSlot = el('div', 'vui-orb vui-orb--card');
    media.appendChild(orbSlot);

    if (scenario.icon) {
      var iconMark = el('span', 'vui-card__icon');
      iconMark.setAttribute('aria-hidden', 'true');
      iconMark.innerHTML = icon(scenario.icon, 'vui-icon--lg');
      media.appendChild(iconMark);
    }

    var badge = el('span', 'vui-play-badge');
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = icon('play');
    media.appendChild(badge);

    var body = el('div', 'vui-card__body');

    var overline = el('span', 'vui-overline');
    overline.textContent = scenario.industry;
    body.appendChild(overline);

    var title = el('h3', 'vui-title vui-card__title');
    title.textContent = scenario.title;
    body.appendChild(title);

    var desc = el('p', 'vui-card__blurb');
    desc.textContent = scenario.description;
    body.appendChild(desc);

    if (scenario.tags && scenario.tags.length) {
      var tags = document.createElement('ul');
      tags.className = 'vui-tags';
      for (var t = 0; t < scenario.tags.length; t++) {
        var li = el('li', 'vui-tag');
        li.textContent = scenario.tags[t];
        tags.appendChild(li);
      }
      body.appendChild(tags);
    }

    var footer = el('div', 'vui-card__footer');
    var ctaLabel = el('span', 'vui-card__cta');
    ctaLabel.textContent = scenario.cta || 'Talk to an agent';
    var ctaIcon = el('span', 'vui-card__cta-icon');
    ctaIcon.setAttribute('aria-hidden', 'true');
    ctaIcon.innerHTML = icon('chevron-right', 'vui-icon--sm');
    footer.appendChild(ctaLabel);
    footer.appendChild(ctaIcon);
    body.appendChild(footer);

    var overlay = el('div', 'vui-card__overlay');
    overlay.setAttribute('aria-hidden', 'true');
    var overlayCta = el('span', 'vui-card__overlay-cta');
    overlayCta.innerHTML = icon('phone', 'vui-icon--sm');
    overlayCta.appendChild(document.createTextNode(' ' + (scenario.cta || 'Talk to an agent')));
    overlay.appendChild(overlayCta);

    c.appendChild(media);
    c.appendChild(body);
    c.appendChild(overlay);

    c._orbSlot = orbSlot;
    c._data = scenario;
    return c;
  }

  /* ---- Chrome (stage, nav, dots, caption CTA) ---------------------------- */

  function chrome() {
    var stage = el('div', 'vui-stage');
    stage.setAttribute('aria-label', 'Voice scenarios');

    var prev = iconBtn('vui-nav vui-nav--prev', 'chevron-left', 'Previous scenario');
    var next = iconBtn('vui-nav vui-nav--next', 'chevron-right', 'Next scenario');

    var dots = el('div', 'vui-dots');
    dots.setAttribute('role', 'tablist');
    dots.setAttribute('aria-label', 'Choose a scenario');

    var cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'vui-caption-cta';
    cta.innerHTML = icon('phone', 'vui-icon--sm');
    var ctaLabel = el('span');
    ctaLabel.textContent = 'Click to speak with an agent';
    cta.appendChild(ctaLabel);

    return { stage: stage, prev: prev, next: next, dots: dots, cta: cta };
  }

  function dot(scenario) {
    var d = document.createElement('button');
    d.type = 'button';
    d.className = 'vui-dot';
    d.setAttribute('role', 'tab');
    d.setAttribute('aria-label', 'Go to scenario: ' + scenario.title);
    return d;
  }

  function iconBtn(className, iconId, label) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = className;
    b.setAttribute('aria-label', label);
    b.innerHTML = icon(iconId);
    return b;
  }

  VUI.renderer = {
    card: card,
    chrome: chrome,
    dot: dot,
    iconBtn: iconBtn
  };
})(window.VUI = window.VUI || {});
