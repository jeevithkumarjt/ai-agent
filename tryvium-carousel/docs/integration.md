# Tryvium AI · Solutions Showcase — Integration Guide

Light, enterprise B2B showcase module. WordPress shortcode, data-driven carousel,
**one API endpoint per feature**, 60fps canvas engines, no dark theme.

```
tryvium-carousel/
├─ index.html                       preview harness (identical to shortcode output)
├─ assets/
│  ├─ css/tryvium-carousel.css      single scoped stylesheet (.tvx-root namespace)
│  └─ js/tryvium-carousel.js        single ES5 bundle (12 clearly-sectioned modules)
├─ data/demo.json                   sample solutions payload (server reference)
├─ wordpress/
│  ├─ tryvium-carousel.php          drop-in plugin (activate in Plugins)
│  └─ functions-php-snippet.php     theme functions.php alternative
└─ docs/integration.md              this file
```

---

## 1 · Install

**Option A — plugin (recommended)**
1. Upload `tryvium-carousel/` to `wp-content/plugins/`.
2. Activate **"Tryvium AI — Solutions Showcase"**.
3. Add the shortcode to any page.

**Option B — theme snippet**
1. Upload the module folder into your theme (e.g. `wp-content/themes/<theme>/tryvium-carousel/`).
2. In `functions.php`, set `TRYVIUM_CAROUSEL_URI` if the assets live somewhere else.
3. Copy `functions-php-snippet.php` into `functions.php`.

**Shortcode**
```
[tryvium_carousel]
[tryvium_carousel eyebrow="AI Solutions" title="Talk to your customers <em>in their voice.</em>"]
[tryvium_carousel api_base="https://api.tryvium.ai/v1"]
[tryvium_carousel endpoint="https://api.tryvium.ai/v1/solutions"]
[tryvium_carousel delay="3600"]
```

Elementor: paste the same fragment into an HTML widget and enqueue the CSS/JS via the
plugin/snippet (never inline — LiteSpeed can truncate long inline scripts).

---

## 2 · How the data flows

```
Page loads
  ├─ [data-solutions] (JSON from PHP)   ← first priority
  ├─ window.TryviumCarousel.solutions   ← wp_localize_script
  ├─ window.TryviumCarousel.endpoint    → GET /solutions   (REST)
  └─ built-in demo set                  ← always works, zero network
        │
        ▼
  normalizeSolutions()  →  cards rendered by the carousel engine
        │
User clicks a card      →  createAgent(card.api)   ← PER-FEATURE API
        ▼
  POST   {baseUrl}{path}/sessions
  POST   {baseUrl}{path}/sessions/{id}/messages
  DELETE {baseUrl}{path}/sessions/{id}
```

**Every feature talks to its own endpoint.** Healthcare cards only ever hit
`/voice/healthcare/…`, Insurance cards only `/voice/insurance/…`, etc. The agent
factory (`createAgent`) is instantiated per card with that card's `api` block, so
separate features = separate API calls, always.

### Contract

```json
{
  "success": true,
  "data": [
    {
      "id": "healthcare",
      "industry": "Healthcare",
      "title": "Patient Support AI",
      "description": "Book, reschedule and check-in without holding.",
      "theme": "mint",
      "icon": "phone",
      "cta": "Explore solution",
      "link": "/solutions/healthcare/",
      "api": {
        "baseUrl": "https://api.tryvium.ai/v1",
        "path": "/voice/healthcare",
        "key": "sk-live-xxxx"
      },
      "tags": ["Appointments", "Check-in", "Prescriptions"],
      "agent": "Nora",
      "greeting": "Hi, I'm Nora…",
      "speak": "I can check your appointment…",
      "replies": ["…"]
    }
  ]
}
```

Accepted wire shapes: `{ success, data:[…] }`, `{ solutions:[…] }`, or a bare array.

| Field | Required | Notes |
|---|---|---|
| `id` | yes | feature key, sent as `feature` in `POST /sessions` |
| `industry`, `title`, `description` | yes | card content |
| `theme` | no | `sky · mint · coral · gold · violet · rose` (default `azure`) |
| `tags` | no | up to 3 chips on the front card |
| `link` | no | if set, the card CTA navigates there instead of opening a call |
| `api.baseUrl` | no | **missing → demo mode** (simulated conversation) |
| `api.key` | no | server-injected token; sent as `Authorization: Bearer` |
| `api.path` | no | defaults to `/voice/{id}` |
| `greeting`/`speak`/`replies` | no | voice fields; safe defaults supplied by the adapter |

> Never hardcode keys in JS. Inject `baseUrl`/`key` server-side (PHP filter or
> `wp_localize_script`) so keys never ship in page HTML.

---

## 3 · Per-feature API (backend)

The widget makes three calls per feature (replace `{baseUrl}`/`{path}` with the
card's `api` values):

```
POST   {baseUrl}{path}/sessions
  body: { "mode": "voice", "feature": "healthcare", "agent": "Nora" }
  resp: { "sessionId": "…", "agentName": "Nora", … }

POST   {baseUrl}{path}/sessions/{sessionId}/messages
  body: { "text": "…" }
  resp: { "reply": "…" }

DELETE {baseUrl}{path}/sessions/{sessionId}
```

If `api.baseUrl` **and** `api.key` are both present the widget is fully live.
If either is missing the widget runs in **demo mode** with per-feature simulated
replies, so the page never breaks on an unreachable backend.

---

## 4 · Configuration in WordPress

Two extensible filters:

```php
// solutions — array of contract objects above
add_filter( 'tryvium_carousel_solutions', function ( $solutions ) {
    return array(
        array(
            'id'    => 'healthcare',
            'industry' => 'Healthcare',
            'title' => 'Patient Support AI',
            'description' => 'Book, reschedule and check-in without holding.',
            'theme' => 'mint',
            'api'   => array(
                'baseUrl' => 'https://api.tryvium.ai/v1',
                'path'    => '/voice/healthcare',
                'key'     => getenv( 'TRYVIUM_HEALTHCARE_KEY' ),
            ),
            'tags'  => array( 'Appointments', 'Check-in' ),
        ),
        // insurance, financial, retail, …
    );
} );

// global settings
add_filter( 'tryvium_carousel_settings', function ( $s ) {
    $s['endpoint'] = 'https://api.tryvium.ai/v1/solutions';  // GET list
    $s['apiBase']  = 'https://api.tryvium.ai/v1';            // default per-card base
    $s['delay']    = 4200;                                   // autoplay ms
    return $s;
} );
```

---

## 5 · Performance (why it stays fast)

- One shared `requestAnimationFrame` loop per instance; delta-time, spring physics.
- **Orb gating:** only the front card's orb renders every frame; side cards repaint
  at ~3fps. `IntersectionObserver` + `visibilitychange` pause the whole engine
  when off-screen or the tab is hidden.
- Tiny DOM: cards are canvas + a handful of nodes; description/tags/CTA are
  opacity-hidden (not removed) so side cards cost ~nothing.
- Low-res ambient canvas (DPR ×0.5) stretched with CSS → free blur.
- `prefers-reduced-motion` → fully static render, no springs, no autoplay.
- Autoplay disabled on touch (`pointer: coarse`) and reduced-motion.
- CSS/JS enqueued only on pages using the shortcode; excluded from LiteSpeed
  combine/minify (filters are built into the plugin/snippet).

---

## 6 · Accessibility

- Full keyboard carousel: `←`/`→`, `Home`/`End`, card `Enter`/`Space`.
- Modal: focus trap, `Esc` closes, focus returns to the trigger.
- `aria-roledescription="carousel"`, dots use `aria-current`, chat is `role="log"`.
- Status conveyed by label + color (never color alone); `aria-live` regions.
- Contrast meets WCAG AA; `prefers-contrast: more` raises borders/ink.

---

## 7 · Testing checklist

- [ ] Page with `[tryvium_carousel]` renders, autoplay advances cards.
- [ ] Drag/swipe with momentum snaps to the nearest card.
- [ ] Clicking a side card springs it to front; clicking the front card opens the call.
- [ ] With `api.baseUrl`+`key` set: `POST /sessions` hits the **correct feature path**.
- [ ] Chat messages hit `POST {path}/sessions/{id}/messages` for the same feature.
- [ ] Hangup fires `DELETE /sessions/{id}` and resets the widget.
- [ ] Remove the key → demo mode takes over without errors.
- [ ] DevTools Performance: no long tasks; orbs off-screen are paused.
- [ ] `prefers-reduced-motion` on → static, calm, fully usable.
- [ ] Keyboard-only and screen-reader pass.
