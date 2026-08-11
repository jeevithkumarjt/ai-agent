/* ==========================================================================
   Voice UI — App (assets/js/app.js) — M8 / M13
   --------------------------------------------------------------------------
   Boot layer. One pass over every `.vui-root` (multi-widget safe), wiring:

     background → hero → carousel → modal → session

   Configuration comes from `window.VoiceUIConfig` (wp_localize_script, M13)
   or a built-in demo dataset. In demo mode the conversation is scripted;
   production passes a real API through the same interface.
   ========================================================================== */

(function (VUI) {
  'use strict';

  /* Inline icon sprite injected at boot so `<use href="#icon-*">` references
     always resolve — the same sprite that ships as assets/svg/icons/icons.svg.
     Keeps the Elementor fragment free of any inline markup. */
  var SPRITE = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' +
    '<symbol id="icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></symbol>' +
    '<symbol id="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></symbol>' +
    '<symbol id="icon-chevron-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></symbol>' +
    '<symbol id="icon-chevron-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></symbol>' +
    '<symbol id="icon-mic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></symbol>' +
    '<symbol id="icon-mic-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></symbol>' +
    '<symbol id="icon-send" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></symbol>' +
    '<symbol id="icon-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.86.57 2.81.7A2 2 0 0 1 22 16.92z"/></symbol>' +
    '<symbol id="icon-hangup" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.86.57 2.81.7A2 2 0 0 1 22 16.92z"/><line x1="3" y1="3" x2="21" y2="21"/></symbol>' +
    '<symbol id="icon-retry" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></symbol>' +
    '<symbol id="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></symbol>' +
    '<symbol id="icon-sparkle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/><path d="M18.5 15.5l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1z"/></symbol>' +
    '</svg>';

  function injectSprite() {
    if (document.getElementById('vui-sprite')) return;
    var holder = document.createElement('div');
    holder.id = 'vui-sprite';
    holder.innerHTML = SPRITE;
    document.body.appendChild(holder.firstChild);
    holder.remove();
  }

  var DEMO_SCENARIOS = [
    {
      id: 'your-company', title: 'Your Company', tag: 'Concierge', orb: 'sky',
      blurb: 'Route, answer and escalate — the way your front desk would.',
      greeting: 'Hi, you\u2019ve reached Tryvium Concierge. I can help with bookings, billing and directions — what do you need?',
      replies: [
        'Got it — I\u2019ve checked your account and pulled up the options.',
        'Consider it handled. Is there anything else I can do for you?',
        'You\u2019re all set — I\u2019ll send a confirmation to your email.'
      ],
      prompts: [
        'You can say \u201cI need to reschedule\u201d or type it below.',
        'While we wait — I can also help with nearby offices or parking.'
      ]
    },
    {
      id: 'healthcare', title: 'Healthcare', tag: 'Patient services', orb: 'mint',
      blurb: 'Book, reschedule and check-in without holding.',
      greeting: 'Hi, I\u2019m the patient services assistant. I can help you book or reschedule appointments — how can I help today?',
      replies: [
        'I found an opening tomorrow at 10:30 — would that work for you?',
        'I\u2019ve rescheduled your appointment. A confirmation is on its way.',
        'No problem. I\u2019ve noted it and notified the clinic.'
      ],
      prompts: [
        'You can say \u201creschedule my Thursday appointment\u201d or type it here.'
      ]
    },
    {
      id: 'insurance', title: 'Insurance', tag: 'Claims', orb: 'coral',
      blurb: 'Start a claim or check a status in seconds.',
      greeting: 'Hi, welcome to claims support. Are you starting a new claim or checking an existing one?',
      replies: [
        'I\u2019ve filed the claim — your reference number is CL-2048.',
        'Your claim is under review and should be resolved within 48 hours.',
        'I\u2019ve attached those documents to your claim file.'
      ],
      prompts: [
        'Try saying \u201ccheck my claim status\u201d or type it below.'
      ]
    },
    {
      id: 'financial', title: 'Financial', tag: 'Accounts', orb: 'gold',
      blurb: 'Balance checks, transfers and account help — secured.',
      greeting: 'Hi, this is account services. For your security, how can I verify you today?',
      replies: [
        'Verified. I can help with your balance, transfers or statements.',
        'Transfer complete — you\u2019ll see it in your activity shortly.',
        'I\u2019ve flagged that transaction for review as you asked.'
      ],
      prompts: [
        'You can ask about your balance, recent activity or transfers.'
      ]
    }
  ];

  function getConfig() {
    var cfg = window.VoiceUIConfig || {};
    cfg.mode = cfg.mode || 'demo';
    return cfg;
  }

  function scenarios() {
    var cfg = getConfig();
    if (Array.isArray(cfg.scenarios) && cfg.scenarios.length) return cfg.scenarios;
    return DEMO_SCENARIOS;
  }

  function scenariosFor(root) {
    var att = root ? root.getAttribute('data-scenarios') : null;
    if (att) {
      try {
        var parsed = JSON.parse(att);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      } catch (err) { /* ignore malformed data-scenarios */ }
    }
    return scenarios();
  }

  function initRoot(root) {
    var registry = { root: root };

    var bgEl = root.querySelector('.vui-bg');
    if (bgEl && VUI.background) {
      registry.background = new VUI.background.VoiceBackground(bgEl, {
        blobCount: 4, blobOpacity: 0.5, particleCount: 20, particleAlpha: 0.5,
        speed: 1, cursorLight: true, noise: true
      });
    }

    if (VUI.hero) registry.hero = VUI.hero.init(root);

    var modal = null;
    var session = null;
    if (VUI.modal && VUI.voice) {
      modal = new VUI.modal.Modal({ mount: root });
      session = new VUI.voice.Session({ modal: modal, root: root });
      modal.opts.onHangup = function () { session._end(); };
      modal.opts.onRetry = function () { session._tryMic(); };
      modal.opts.onSend = function (text) { session._handleUserText(text); };
      modal.opts.onToggleType = function () { session._toggleType(); };
      modal.opts.onClose = function () { session.reset(); };
      registry.modal = modal;
      registry.session = session;
    }

    var carouselEl = root.querySelector('.vui-carousel');
    if (carouselEl && VUI.carousel) {
      registry.carousel = new VUI.carousel.Carousel(carouselEl, {
        scenarios: scenariosFor(root),
        onOpen: function (scenario, fromEl) {
          if (session) session.openScenario(scenario, fromEl);
        }
      });
    }

    var primary = root.querySelector('.vui-hero__cta .vui-btn--primary');
    if (primary && registry.carousel && session) {
      primary.addEventListener('click', function () {
        var idx = registry.carousel.index;
        var scenario = registry.carousel.getCurrent();
        var fromEl = registry.carousel.cards[idx] || null;
        session.openScenario(scenario, fromEl);
      });
    }

    var ghost = root.querySelector('.vui-hero__cta .vui-btn--ghost');
    if (ghost && carouselEl) {
      ghost.addEventListener('click', function () {
        carouselEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    return registry;
  }

  function boot() {
    injectSprite();
    var roots = document.querySelectorAll('.vui-root');
    var out = [];
    for (var i = 0; i < roots.length; i++) {
      if (roots[i].hasAttribute('data-vui-booted')) continue;
      roots[i].setAttribute('data-vui-booted', '1');
      out.push(initRoot(roots[i]));
    }
    return out;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  VUI.app = {
    initRoot: initRoot,
    boot: boot,
    getConfig: getConfig,
    demoScenarios: DEMO_SCENARIOS
  };
})(window.VUI = window.VUI || {});
