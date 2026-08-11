# Voice UI — Phase 0 UX Architecture & Phase 1 Design System

**Product:** Tryvium AI Voice Experience
**Build:** WordPress + Elementor, HTML5 / CSS Variables / SVG / Vanilla JS (ES6 modules)
**Status:** Module 0 — Architecture & Design System spec (awaiting approval)

---

## 1. Context & relationship to existing code

`ai-architecture/` contains a working v2 prototype (`agent-widget.js/css`, Elementor fragment, `functions-php-snippet.php`). It validated: a canvas living orb, cover-flow carousel, morph-style voice modal, chat fallback, and a LiteSpeed-safe WP enqueue path (ES5, no inline styles/scripts, exclude filters).

`voice-ui/` is the **production modularization and redesign**. Decisions:

- Keep `ai-architecture/` untouched as reference. Never ship both to the same page.
- New class namespace `vui-` (scoped under `.vui-root`) so a legacy widget on a page can never collide.
- Reuse proven mechanics from v2 (organic oscillator, single shared rAF loop, IntersectionObserver gating, LiteSpeed exclusion filters) and elevate them into named modules.

### Production constraints that shaped the architecture (from v2 learnings)

| Constraint | Consequence |
|---|---|
| LiteSpeed CSS/JS combine can reorder or truncate scripts | All assets enqueued via `wp_enqueue_*`, excluded from combine, no inline `<style>/<script>` |
| Elementor HTML widget textarea can truncate long inline scripts | Ship markup fragment only; JS/CSS as static files |
| Template-literal `${}` minification breakages observed | Production bundle written in ES2017 without template literals; dev sources are ES6 modules |
| Multiple widgets per page | One boot pass over all `.vui-root` nodes, per-instance state, shared rAF loop |

---

## 2. Product principles

1. **Calm intelligence** — motion breathes, never shouts. Nothing loops mechanically.
2. **Organic over mechanical** — every cycle differs (sum-of-sines at incommensurate ratios + random phase seeds).
3. **Trustworthy** — explicit status, honest mic permission flow, graceful fallback to typing.
4. **Enterprise-grade** — accessible, keyboard-driven, 60 fps, resilient when the API is absent (demo mode).
5. **Original** — no copied Bland.ai patterns; warm-light "aurora on paper" identity unique to Tryvium.

---

## 3. Layout architecture

### 3.1 Desktop (≥ 1024px)
```
┌──────────────────────────────────────────────────────────────┐
│  background system (fixed aurora + noise + particles)        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  HERO  — headline, subcopy, CTA, trust row             │  │
│  │          (glass panels, cursor light, gradient motion) │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  CAROUSEL — stage max 900px, 5 cards visible,          │  │
│  │             3D cover-flow, nav buttons at stage edges, │  │
│  │             dots + caption CTA below                   │  │
│  └────────────────────────────────────────────────────────┘  │
│  [call modal — 420×min(680,90vh) centered overlay]           │
└──────────────────────────────────────────────────────────────┘
```
- Stage height fixed ~428px; cards 328×404 at z=0.
- Nav buttons: `left/right: max(0, calc(50% - 470px))` (v2 pattern).

### 3.2 Tablet (768–1023px)
- Hero stacks to one column; stage max-width 720px, **3 cards visible**.
- Call card `min(90vh, 720px)` wide, max 420px. Nav buttons pinned to stage edges.
- Touch targets ≥ 44px everywhere.

### 3.3 Mobile (≤ 767px)
- Single column. Stage max-width 420px, 3 cards visible with tighter card scale.
- Call card becomes near-fullscreen sheet (`inset 12px`, rounded 22px) — still a *morph*, not a popup.
- Dots large enough to tap; autoplay **off** on touch + reduced-motion.
- All interactive targets ≥ 44×44px.

### 3.4 Ultra-wide (≥ 1600px), landscape, foldable
- Stage max 1200px on ultra-wide; background aurora widens with viewport.
- Use logical viewport (`100dvh`), no hard page heights; container-query driven density.
- Landscape short viewports: hero collapses, carousel shrinks via `min()`.

### 3.5 Container strategy
- `.vui-root` uses `min()` + clamp fluid widths; no media-query re-layout of the carousel math beyond the visible-card count.

---

## 4. User journey

```
Land ─▶ Hero (value + trust) ─▶ Carousel (explore scenarios)
        │
        └─ select card / caption CTA
           │
           ▼ (MORPH: card rect → call card)
        CONNECTING (orb pulses, status "Connecting")
           │
           ├─ mic permission denied ─▶ ERROR state + guidance + "Type instead" fallback
           │
        LISTENING (orb blooms, live mic level)
           │
           ▼
        CONVERSATION (voice) ⇄ (auto-detect silence → thinking → speaking)
           │
           ├─ "Type instead" ─▶ CHAT (same session, orb idle → thinking → speaking)
           │
           ▼
        HANGUP / ESC / close ─▶ ENDED (orb fades to disconnected) ─▶ return to carousel (state reset)
```

---

## 5. Component inventory

| # | Component | Module | Notes |
|---|---|---|---|
| 1 | Background system | M2 | aurora mesh, noise, cursor light, soft particles |
| 2 | Hero | M3 | headline, subcopy, CTA, glass panels, trust indicators |
| 3 | Carousel | M6 | cover-flow, physics, keyboard, wheel, touch |
| 4 | Scenario card | M6 | orb slot, play badge, tag, title |
| 5 | Orb | M5 | procedural living orb (shared by card + modal) |
| 6 | Nav buttons | M6 | prev/next chevrons |
| 7 | Dots | M6 | tablist, active pill |
| 8 | Caption CTA | M6 | "Click to speak with an agent" |
| 9 | Call modal | M7 | morph card, focus trap, esc |
| 10 | Call head | M7 | tag, title, status chip, close |
| 11 | Status chip | M8 | per-state dot + label |
| 12 | Hangup button | M8 | red circle, stop icon |
| 13 | Chat fallback | M8 | log, input, send, back-to-voice |
| 14 | Typing indicator | M9 | 3-dot pulse |
| 15 | Trust indicators | M3 | SOC2/uptime/latency pills (config) |
| 16 | Live region | M8 | sr-only state announcements |

---

## 6. Interaction map

| Element | Event | Response |
|---|---|---|
| Card | hover | play badge scales 1.1, orb brightens to `idle+`, shadow-3 |
| Card | click (front) | morph → open call for that scenario |
| Card | click (side) | carousel springs to it (v2 pattern) |
| Stage | drag / swipe | direct manipulation, momentum, release snap |
| Stage | wheel | next/prev (debounced, direction-locked) |
| Keyboard | ← / → | prev/next; front card Enter/Space opens; Esc closes modal |
| Nav / dots | click | spring settle to target, autoplay resets |
| Caption CTA | click | opens current scenario |
| Modal | backdrop click / Esc / close | morph close, focus restore |
| Hangup | click | end session → ENDED state → return |
| "Type instead" | click | switch to chat, orb → `idle` |
| Send | Enter/click | user msg, orb `thinking` → `speaking`, typing dots |

---

## 7. Animation storyboard (card → call morph)

| # | Beat | 0–100% | Duration | Easing |
|---|---|---|---|---|
| 1 | Card lifts & scales up | 0–20% | 320ms | `--ease-out` |
| 2 | Backdrop fades in, blur 6px | 10–40% | 300ms | linear |
| 3 | Card bounds morph to call card (fixed → fixed, FLIP) | 25–75% | 480ms | `--ease-in-out` |
| 4 | Header row slides down, status chip fades in | 55–80% | 240ms | `--ease-out` |
| 5 | Orb re-creates larger, `connecting` pulse | 60–100% | 600ms | spring 170/26 |
| 6 | Mic permission resolves → `listening` bloom | after 1 | 700ms | spring |

- Implemented via FLIP + Web Animations API transform `interpolate` (no layout reads per frame).
- Reduced motion: all beats collapse to a 150ms crossfade.

---

## 8. State diagram

### 8.1 Widget-level states
```
CAROUSEL → CONNECTING → LISTENING → CONVERSATION
                          └─▶ ERROR ──▶ (retry | CHAT)
CONVERSATION → CHAT (toggle, same session)
CONVERSATION/CHAT → ENDED → CAROUSEL
```

### 8.2 Orb states (movement, lighting, glow, speed all unique)

| State | amp | speed | glow | tint | spin | audio-reactive |
|---|---|---|---|---|---|---|
| `idle` | 0.028 | 0.45 | 0.55 | — | no | no |
| `connecting` | 0.020 | 0.60 | 0.60 | indigo | no | no |
| `listening` | 0.055 | 0.85 | 0.80 | — | no | **yes** |
| `thinking` | 0.045 | 1.35 | 0.75 | — | yes | no |
| `speaking` | 0.075 | 1.10 | 0.95 | — | no | **yes** |
| `muted` | 0.012 | 0.30 | 0.35 | slate | no | no |
| `disconnected` | 0.006 | 0.20 | 0.25 | grey | no | no |
| `error` | 0.020 | 0.60 | 0.65 | `#E5482F` | no | no |
| `success` | 0.050 | 0.80 | 0.85 | `#2FA36B` | yes | no |

- Reduced motion: all amplitudes ×0.25, speeds ×0.12; orb renders a static frame.
- Colorblind-safe: status conveyed by icon/shape + label, never color alone.

---

## 9. Accessibility strategy

- **Keyboard:** full carousel (←/→/Home/End), card Enter/Space, modal focus trap (Tab wraps), Esc closes, focus returns to trigger.
- **ARIA:** `.vui-root` region; stage `aria-label`; cards `role=button`; dots `role=tablist/tab` + `aria-current`; modal `role=dialog aria-modal`; chat `role=log`; orb aria-hidden; status via `aria-live=polite`.
- **Focus:** 2px `--accent` outline + 4px offset; never `outline:none`.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` kills transitions/animations; JS reads it once and disables springs; autoplay off.
- **Contrast:** body ≥ 4.5:1, large text ≥ 3:1 (WCAG AA). Slate `#6B6C66` only for non-essential text.
- **Touch:** all targets ≥ 44px; drag requires 6px threshold before it disables click (v2 pattern).
- **Screen readers:** sr-only labels on all icon buttons; state changes announced; no color-only status.

---

## 10. Performance strategy

- One shared `requestAnimationFrame` loop (MotionEngine); every animated system subscribes/unsubscribes. No per-orb loops.
- `IntersectionObserver` gates all orbs (off-screen = paused); `visibilitychange` pauses the whole loop.
- Canvas: DPR capped at 2; redraws only while visible; `getContext('2d', { alpha:false })` where supported.
- Pointer Events (pointerdown/move/up) replace duplicate mouse + touch listeners; `touch-action: pan-y`.
- No layout reads inside the frame loop; rects cached; transforms-only animation (`will-change: transform, opacity`).
- No inline CSS/JS; everything enqueued, versioned, excluded from LiteSpeed combine.
- Budgets: JS ≤ 60KB gz, CSS ≤ 30KB gz, 60fps mid-range, 0 long tasks, hero LCP < 2.5s.

---

## 11. Motion guidelines

**Duration tokens**
```
--dur-micro:      120ms   (focus, hover)
--dur-fast:       200ms   (press, toggle)
--dur-base:       300ms   (state change, dots)
--dur-smooth:     450ms   (carousel settle, panel slide)
--dur-expressive: 700ms   (modal morph, orb bloom)
--dur-hero:       900ms   (hero entrance, staggered)
```

**Easing tokens**
```
--ease-out:     cubic-bezier(.16, 1, .3, 1)   (decelerate — "calm arrival")
--ease-inout:   cubic-bezier(.65, 0, .35, 1)  (morphs, reveals)
--ease-linear:  linear                        (aurora drift only)
```

**Springs (motion-engine)**
```
spring-settle:   stiffness 170, damping 26   (UI settle, no ringing)
spring-carousel: stiffness 220, damping 30   (cover-flow snap)
spring-audio:    stiffness 90,  damping 14   (mic level smoothing)
```

**Organic non-repetition**
```
organic(t, seed) = Σ aᵢ·sin(t·fᵢ·speed + seedᵢ)   f ∈ {0.61, 1.27, 2.03} (incommensurate)
seed: per-instance random phase;  t: per-instance random start
```
→ any two orbs, or one orb at two times, are at different points on an effectively non-repeating cycle (proven in v2).

**Hierarchy** — hero 900ms entrance first, carousel 450ms, modal 700ms; micro-interactions ≤ 300ms. Never two `--expressive` motions on screen at once.

---

## 12. Spacing system (4px grid)

```
--space-1: 4    --space-2: 8    --space-3: 12   --space-4: 16
--space-5: 20   --space-6: 24   --space-8: 32   --space-10: 40
--space-12: 48  --space-16: 64  --space-20: 80  --space-24: 96
```
**Rhythm (sections):** `--rhythm-sm: 48px`, `--rhythm-md: 80px`, `--rhythm-lg: 128px`.

**Grid rules:** card internal padding `--space-6`; section padding `var(--rhythm-*)`; content column `min(100% - 48px, 1180px)`.

---

## 13. Typography scale (fluid, clamp)

Families: **Manrope** (display, 600/700/800) · **Inter** (body, 400/500/600) — already enqueued on tryvium.ai.

```
--text-2xs:  11px    (tags, overline, tracking .08em, uppercase)
--text-xs:   12px    (meta)
--text-sm:   13px    (chat, captions)
--text-base: 15px    (body)
--text-md:   16px    (emphatic body)
--text-lg:   18px    (lead)
--text-xl:   clamp(20px, 1.6vw, 24px)
--text-2xl:  clamp(24px, 2.4vw, 34px)   (card/panel titles)
--text-3xl:  clamp(30px, 3.6vw, 48px)   (section headings)
--text-4xl:  clamp(40px, 5.2vw, 68px)   (hero secondary)
--text-hero: clamp(48px, 6.4vw, 96px)   (hero headline, Manrope 800, -0.03em)
```
Line-height: display 1.05–1.15, body 1.55. Letter-spacing: display -0.01→-0.03em, overline +0.08em.

---

## 14. Color tokens (Phase 1 — Design System)

### 14.1 Light theme (default)
| Token | Value | Use |
|---|---|---|
| `--paper` | `#FAF9F4` | page background (warm ivory) |
| `--surface` | `#F7F5EE` | cards, modal |
| `--surface-2` | `#EFEDE4` | chat bubbles (agent), wells |
| `--line` | `#E8E5DA` | hairline borders |
| `--ink` | `#17181A` | primary text |
| `--slate` | `#6B6C66` | secondary text |
| `--muted` | `#8A8B85` | tertiary / disabled |
| `--accent` | `#4A5CFF` | primary action (Tryvium indigo) |
| `--accent-strong` | `#3B4BE0` | hover / active |
| `--success` | `#2FA36B` | live, success |
| `--warning` | `#E8902C` | warning |
| `--error` | `#E5482F` | error, hangup |

Aurora (background + orb palettes):
```
--aurora-sky:    #BFEBFF
--aurora-violet: #D6C7FF
--aurora-mint:   #E4FFB8
--aurora-coral:  #FFD8CE
--aurora-gold:   #FFEBB8
```

Scenario orb palettes (`{light, mid, dark}`):
```
Your Company : #BFEBFF / #4FB4EE / #2E7FD1   (sky)
Healthcare   : #E4FFB8 / #8FD94A / #4E9C1E   (mint)
Insurance    : #FFD8CE / #F0716B / #D33E52   (coral)
Financial    : #FFEBB8 / #F5B94A / #D68A1E   (gold)
```

### 14.2 Dark theme
| Token | Value |
|---|---|
| `--paper` | `#0A0B10` |
| `--surface` | `#12141C` |
| `--surface-2` | `#1A1D27` |
| `--line` | `#262A36` |
| `--ink` | `#F5F4F0` |
| `--slate` | `#9AA0AE` |
| `--accent` | `#6C7BFF` (lifted for contrast) |
| aurora | darkened: `#0E2A3D / #2A2350 / #1B2E22 / #33191A / #33290F` |

Dark mode is defined via `@media (prefers-color-scheme: dark)` under `[data-theme]` override so Elementor/browser settings both work. Default follows system; toggle is opt-in (not shipped in v1 widget chrome).

### 14.3 Gradient system
```
--grad-aurora:  linear-gradient(120deg, var(--aurora-sky), var(--aurora-violet), var(--aurora-coral))
--grad-hero:    radial-gradient(120% 120% at 20% 0%, var(--aurora-sky), transparent 55%) ... layered
--grad-indigo:  linear-gradient(135deg, #4A5CFF, #7C5CFF)
```
Gradients only on decorative surfaces; text stays solid `--ink` (contrast).

---

## 15. Elevation, shadows, borders, radius

### 15.1 Elevation system (layers 0–5)
| Layer | Surface | Border | Shadow |
|---|---|---|---|
| 0 | transparent | none | none |
| 1 | `--surface` | `--line` | `--shadow-1` |
| 2 | `--surface` | `--line` | `--shadow-2` |
| 3 | `#FCFBF7` | `--line` | `--shadow-3` |
| 4 | `#FFFFFF` | `--line` | `--shadow-4` (modal) |
| 5 | `#FFFFFF` | `--line` | `--shadow-5` (hero glass) |

### 15.2 Shadows (light)
```
--shadow-1: 0 1px 2px rgba(23,24,26,.04), 0 4px 12px -6px rgba(23,24,26,.08)
--shadow-2: 0 2px 4px rgba(23,24,26,.04), 0 12px 24px -8px rgba(23,24,26,.12)
--shadow-3: 0 4px 8px rgba(23,24,26,.05), 0 20px 40px -12px rgba(23,24,26,.18)
--shadow-4: 0 8px 16px rgba(23,24,26,.06), 0 32px 64px -16px rgba(23,24,26,.24)
--shadow-5: 0 12px 24px rgba(23,24,26,.08), 0 48px 100px -20px rgba(23,24,26,.30)
```
(Dark theme: shadows lift toward black, `rgba(0,0,0,.5+)`, plus inset `rgba(255,255,255,.04)`.)

### 15.3 Radius
```
--radius-sm:  10px   (inputs, chips)
--radius-md:  16px   (buttons, bubbles)
--radius-lg:  22px   (cards, modal, stage)
--radius-xl:  28px   (hero panels)
--radius-full: 999px (orbs, pills, nav)
```

### 15.4 Borders
- Default hairline: `1px solid var(--line)`.
- Glass surfaces: `1px solid color-mix(in srgb, #fff 60%, transparent)` (light) / `color-mix(in srgb, #fff 12%, transparent)` (dark).

---

## 16. Glassmorphism rules

1. **Only on:** hero panels, modal backdrop, nav buttons, status chip. Never the primary content card.
2. **Recipe (light):** `background: color-mix(in srgb, var(--surface) 55%, transparent); backdrop-filter: blur(18px) saturate(140%); border: 1px solid rgba(255,255,255,.6); box-shadow: inset 0 1px 0 rgba(255,255,255,.5);`
3. **Recipe (dark):** `background: color-mix(in srgb, var(--surface) 60%, transparent); backdrop-filter: blur(18px) saturate(120%); border: 1px solid rgba(255,255,255,.08); box-shadow: inset 0 1px 0 rgba(255,255,255,.06);`
4. **Contrast:** any text over glass must also sit on a solid-elevated surface behind it, or use a ≥65% opacity surface.
5. **Reduced motion:** drop `backdrop-filter` (render solid `--surface`).
6. **Fallback:** if `backdrop-filter` unsupported, render solid surface (feature-detect once, apply a class).

---

## 17. Button & icon systems

### 17.1 Buttons
- **Primary:** `--accent` fill, white text, radius `--radius-md`, elevation `--shadow-2`, hover `--accent-strong` + `translateY(-1px)`, active scale `.97`, focus ring.
- **Secondary:** `--surface` fill, `--line` border, `--ink` text.
- **Ghost:** transparent, `--slate` text, hover `--surface-2`.
- **Icon-only:** 44×44, radius full, hover `--surface-2`; always `aria-label`.
- **Hangup:** 62×62 `--error` fill, shadow `0 10px 24px -6px rgba(229,72,47,.5)`, hover scale 1.05, active .94.

### 17.2 Icons (`assets/svg/icons/`)
24px stroke set (1.75px, round caps): play, close, chevron-l/r, mic, mic-off, send, stop, phone, retry, check. Individual `.svg` files + one sprite `icons.svg` with `<symbol>`s referenced via `<use>`. All `aria-hidden` (buttons carry labels).

---

## 18. WordPress / Elementor strategy (Module 13)

- **Shortcode:** `[voice_ui scenarios="healthcare,financial" theme="auto"]`.
- **Elementor HTML widget:** paste the markup fragment; CSS/JS enqueued by the plugin/theme snippet (never inline).
- **Enqueue:** only on pages using the shortcode or a configured condition; versioned; footer JS.
- **Config:** `wp_localize_script('voice_ui', 'VoiceUIConfig', [...])` — API base/key (server-side only), scenarios, flags, copy. **Never hardcode secrets in JS.**
- **Extensibility:** `apply_filters('voice_ui_scenarios', $scenarios)` and `apply_filters('voice_ui_settings', $settings)` so agencies/theme devs can override.
- **LiteSpeed:** exclude `voice-ui.*` from combine/minify (reuse v2 pattern).
- **No inline CSS/JS** anywhere.

---

## 19. Target file map

```
voice-ui/
├─ docs/architecture.md            (this spec)
├─ preview/index.html              (dev harness — never shipped)
├─ assets/
│  ├─ css/
│  │  ├─ variables.css             (M1 tokens: color, type, space, shadow, motion)
│  │  ├─ base.css                  (M1 reset, a11y, focus, sr-only, typography)
│  │  ├─ layout.css                (M3 grid, sections, container)
│  │  ├─ hero.css                  (M3)
│  │  ├─ carousel.css              (M6)
│  │  ├─ cards.css                 (M6)
│  │  ├─ orb.css                   (M5 orb slot + play badge)
│  │  ├─ modal.css                 (M7 morph + chat)
│  │  ├─ animation.css             (M1+ M9 keyframes, reduced-motion)
│  │  └─ responsive.css            (M11 breakpoints)
│  ├─ js/
│  │  ├─ utils.js                  (M4: clamp/lerp/spring/hexToRgba/organic/rM)
│  │  ├─ motion-engine.js          (M4: shared rAF loop, springs, tween, cursor)
│  │  ├─ orb-engine.js             (M5: procedural orb renderer + states)
│  │  ├─ carousel.js               (M6: physics cover-flow)
│  │  ├─ modal.js                  (M7: FLIP morph, focus trap)
│  │  ├─ audio.js                  (M8: getUserMedia, AnalyserNode, level)
│  │  ├─ voice-ui.js               (M8: state machine, message layer, chat)
│  │  └─ app.js                    (M8/M13: boot, multi-instance, config)
│  └─ svg/icons/                   (M1: icon set + icons.svg sprite)
├─ build/                          (M13: concatenated ES2017 prod bundle, no template literals)
│  ├─ voice-ui.min.js
│  └─ voice-ui.min.css
└─ wordpress/                      (M13)
   ├─ voice-ui-shortcode.php
   ├─ functions-php-snippet.php
   └─ elementor-fragment.html
```

Every JS module is written as an **ES6-syntax namespace module** — one file = one `VUI.<name>` namespace (e.g. `VUI.utils`, `VUI.motion`, `VUI.background`), attached to `window.VUI`. No `import`/`export` statements. This is deliberate:

- It renders from `file://`, so the preview harness works by double-clicking the HTML (strict ES modules are blocked over `file://` by CORS).
- The WordPress/LiteSpeed production artifact is a plain ordered concatenation of these files into one minified IIFE — zero transforms, nothing for combine/minify to break (proven v2 constraint).
- Modules remain one-per-file, dependency-ordered and individually readable.

Convertible to strict ESM later if a bundler pipeline (vite/webpack) is ever introduced.

---

## 20. Module build plan (each = review gate)

| M | Phase(s) | Deliverable | Review |
|---|---|---|---|
| 0 | 0–1 | **This spec** | ← **awaiting approval** |
| 1 | 1 | Design System: `variables.css`, `base.css`, `animation.css` skeleton, icon set, token preview page | gate |
| 2 | 7 | Background system: aurora, noise, cursor light, particles | gate |
| 3 | 2 | Hero: layout, glass panels, entrance choreography, trust row | gate |
| 4 | 8 | Motion Engine + `utils.js` (rAF loop, springs, cursor tracker) | gate |
| 5 | 4 | Orb Engine (mesh gradient, turbulence noise, glow, specular, states) | gate |
| 6 | 3 | Carousel + cards (physics, keyboard, wheel, touch, dots, autoplay) | gate |
| 7 | 5 | Voice Modal (card→call morph via FLIP, focus trap, Esc) | gate |
| 8 | 6,9 | Voice states + audio + chat fallback (`audio.js`, `voice-ui.js`, `app.js`) | gate |
| 9 | 9 | Micro-interactions pass (hover/press/focus/typing/thinking) | gate |
| 10 | 10 | Performance audit (frame budget, gating, bundles) | gate |
| 11 | 11 | Responsive pass (desktop→foldable, landscape) | gate |
| 12 | 12 | Accessibility audit (keyboard, ARIA, contrast, reduced motion) | gate |
| 13 | 13 | WordPress/Elementor packaging (shortcode, enqueue, build, fragment) | gate |
| 14 | — | Final QA: multi-widget, error paths, docs, `preview/index.html` polish | ship |

---

## 21. Open decisions (please confirm or adjust)

1. **Namespace & folder** — build in `voice-ui/` with `vui-` prefix; leave `ai-architecture/` untouched. ✅ proposed
2. **JS delivery** — ES6-syntax namespace modules (`window.VUI.<name>`, one file per module), no import/export; WordPress ships a plain ordered concatenation into one minified IIFE. Resolved in M2 (see §19) so the preview works from `file://` and LiteSpeed combine can't break anything. ✅
3. **Dark mode default** — follow system preference (`prefers-color-scheme`), light default. Confirm.
4. **Typefaces** — keep Manrope + Inter (already on the site). Confirm.
5. **Scenarios** — keep the four (Your Company / Healthcare / Insurance / Financial). Confirm or replace.
6. **Autoplay** — on for mouse, off for touch + reduced-motion (v2 behavior). Confirm.
7. **Demo/prod** — keep demo mode with configurable API via `wp_localize_script`. Confirm.
