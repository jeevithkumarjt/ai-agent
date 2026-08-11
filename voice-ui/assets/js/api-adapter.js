/* ==========================================================================
   Voice UI — API Adapter (assets/js/api-adapter.js)
   --------------------------------------------------------------------------
   Keeps the frontend independent of the backend. Resolves scenarios through
   a fallback chain and normalizes every payload to one internal card shape.

   Chain (first hit wins):
     1. root[data-scenarios]   — PHP shortcode injected JSON
     2. window.VoiceUIConfig.scenarios — wp_localize_script / inline config
     3. window.VoiceUIConfig.endpoint  — GET /solutions (REST, enterprise)
     4. data/demo.json         — static demo payload
     5. built-in demo set      — always-present fallback (no network)

   Accepted REST shapes:
     { success:true, data:[ {id, industry, title, description, theme,
                             icon, orb, cta, api} ] }
     { solutions:[ ... ] }
     [ { ... } ]

   Load order: utils.js → ... → api-adapter.js → app.js.
   Namespace: window.VUI.adapter.
   ========================================================================== */

(function (VUI) {
  'use strict';

  var THEME_TO_PALETTE = {
    emerald: 'mint', mint: 'mint', green: 'mint', teal: 'mint',
    sky: 'sky', azure: 'sky', blue: 'sky', violet: 'sky', indigo: 'sky',
    coral: 'coral', rose: 'coral', red: 'coral', pink: 'coral',
    gold: 'gold', amber: 'gold', yellow: 'gold'
  };

  var DEMO = [
    {
      id: 'your-company', industry: 'Concierge', title: 'Your Company',
      description: 'Route, answer and escalate — the way your front desk would.',
      theme: 'sky', orb: 'sky', icon: 'mic', cta: 'Start a call',
      tags: ['Routing', 'Handoff', 'Billing'],
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
      id: 'healthcare', industry: 'Healthcare', title: 'Patient Support AI',
      description: 'Book, reschedule and check-in without holding.',
      theme: 'emerald', orb: 'mint', icon: 'phone', cta: 'Explore solution',
      tags: ['Appointments', 'Check-in', 'Notifications'],
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
      id: 'insurance', industry: 'Insurance', title: 'Claims Assistant',
      description: 'Start a claim or check a status in seconds.',
      theme: 'coral', orb: 'coral', icon: 'check', cta: 'Explore solution',
      tags: ['Claims', 'Status', 'Documents'],
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
      id: 'financial', industry: 'Financial', title: 'Account Services',
      description: 'Balance checks, transfers and account help — secured.',
      theme: 'gold', orb: 'gold', icon: 'sparkle', cta: 'Explore solution',
      tags: ['Balances', 'Transfers', 'Security'],
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

  function paletteFor(theme) {
    return THEME_TO_PALETTE[theme] || theme || 'sky';
  }

  /* Normalize any contract shape to the internal card shape. */
  function normalize(item, i) {
    var s = item || {};
    var orbName = paletteFor(s.orb || s.theme);
    return {
      id: s.id != null ? s.id : i,
      industry: s.industry || s.tag || 'Solutions',
      title: s.title || 'Solution',
      description: s.description || s.blurb || '',
      tags: Array.isArray(s.tags) ? s.tags.slice() : [],
      icon: s.icon || null,
      cta: s.cta || 'Talk to an agent',
      api: s.api || '',
      theme: s.theme || orbName,
      orb: orbName,
      greeting: s.greeting || 'Hi, how can I help you today?',
      replies: (Array.isArray(s.replies) && s.replies.length) ? s.replies.slice() :
               ['Got it — one moment.', 'Done — anything else?'],
      prompts: (Array.isArray(s.prompts) && s.prompts.length) ? s.prompts.slice() :
               ['You can type below anytime.']
    };
  }

  function normalizeAll(arr) {
    var out = [];
    for (var i = 0; i < arr.length; i++) out.push(normalize(arr[i], i));
    return out;
  }

  function fetchJson(url) {
    if (typeof fetch !== 'function') {
      return Promise.reject(new Error('fetch unavailable'));
    }
    return fetch(url, { credentials: 'same-origin' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (json) {
      if (json && json.success && Array.isArray(json.data)) return json.data;
      if (Array.isArray(json)) return json;
      if (json && Array.isArray(json.solutions)) return json.solutions;
      throw new Error('unexpected payload');
    });
  }

  function getConfig() {
    var cfg = window.VoiceUIConfig || {};
    cfg.mode = cfg.mode || 'demo';
    return cfg;
  }

  function readAttr(root) {
    if (!root) return null;
    var att = root.getAttribute('data-scenarios');
    if (!att) return null;
    try {
      var parsed = JSON.parse(att);
      return (Array.isArray(parsed) && parsed.length) ? parsed : null;
    } catch (err) {
      return null;
    }
  }

  function loadDemo(cfg) {
    var url = (cfg && cfg.demoUrl) || 'data/demo.json';
    return fetchJson(url).then(normalizeAll).catch(function () {
      return normalizeAll(DEMO);
    });
  }

  function load(root) {
    var cfg = getConfig();
    var fromAttr = readAttr(root);
    if (fromAttr) return Promise.resolve(normalizeAll(fromAttr));
    if (Array.isArray(cfg.scenarios) && cfg.scenarios.length) {
      return Promise.resolve(normalizeAll(cfg.scenarios));
    }
    if (cfg.endpoint) {
      return fetchJson(cfg.endpoint).then(normalizeAll).catch(function () {
        return normalizeAll(DEMO);
      });
    }
    return loadDemo(cfg);
  }

  VUI.adapter = {
    load: load,
    demoScenarios: function () { return normalizeAll(DEMO); },
    normalize: normalize
  };
})(window.VUI = window.VUI || {});
