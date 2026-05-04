# DESIGN.md — Forum de l'Excellence

> **Direction:** Apple-inspired public marketing × Notion-inspired operator dashboards.
> **Brand anchor:** natural warm "oak" palette (olive · chartreuse · peach · gold).

This file is the single source of truth for UI decisions. Every surface in the app
must map back to one of the two **modes** described below. When in doubt, pick the
mode that matches the *user's intent* on that screen (discover vs. operate).

---

## 1. Modes

### 1.1 `public` — Accueil, Programmes, Admissions, Vie de Campus
Apple-inspired: cinematic, confident, spacious, quiet-luxury.

- **Goal:** convince a parent to trust us with their child.
- **Feel:** calm, premium, editorial.
- **Motion:** big hero video, subtle parallax, slow reveals. No cartoon bounces.
- **Density:** generous (section padding ≥ `py-24`).

### 1.2 `ops` — every authenticated dashboard (admin / teacher / student / parent)
Notion-inspired: minimal, document-like, keyboard-friendly.

- **Goal:** let a user get work done fast without ceremony.
- **Feel:** warm minimalism, soft surfaces, serif-accented headings.
- **Motion:** almost none. Hover tints, focus rings, 150-ms transitions max.
- **Density:** compact (section padding ≤ `py-8`, 8-pt grid, 44 px row height).

---

## 2. Tokens (already in `app/src/index.css`, keep as-is)

Brand palette lives under `--oak-*`:

| Token | Hex | Usage |
|---|---|---|
| `--oak-olive` | `#aac240` | primary action, sidebar active, gradients |
| `--oak-sage` | `#bccdb6` | muted chips, subtle fills |
| `--oak-chartreuse` | `#eff3a2` | highlights, hover tints |
| `--oak-peach` | `#ffe2ad` | secondary CTAs, warm accents |
| `--oak-dark` | `#1e1e1e` | text on light |
| `--oak-bg` | `#f2f5ee` | page background (public) |
| `--oak-surface` | `#ffffff` | cards, dashboard canvas |

Role colors stay role-scoped — do not use them decoratively:
`--color-student` (blue), `--color-parent` (green), `--color-teacher` (purple),
`--color-admin` (amber).

---

## 3. Typography

| Role | Family | Weight | Used in |
|---|---|---|---|
| Display (hero, section titles) | `Cabinet Grotesk` | 700–800 | public mode only |
| UI / body | `Satoshi` | 400–600 | both modes |
| Editorial accent (ops headings) | system serif stack | 600 | ops mode only — see §5 |

Type scale tokens live in `--text-xs`..`--text-xl`. Do not introduce new sizes;
use `clamp()`-based responsive sizing from `index.css`.

### Gradient "living text"
Reserved for **public mode only**, last 2–3 words of a display heading.
Class: `.oak-living-text-hero` (hero) / `.oak-living-text` (section).
Never apply inside dashboards.

---

## 4. Public mode — Apple playbook

### 4.1 Hero (Accueil, Programmes, Admissions, Vie de Campus)
Must match `LivingHero` (`app/src/components/public/living.tsx`).

- Full-bleed autoplay `<video>` (currently `/excz.mp4`), `object-cover`,
  `preload="metadata"`, WebP poster when available.
- Dark-to-olive radial gradient overlay at 30 % / 20 % + soft-light peach overlay.
- Three `oak-blob` decorations with staggered `oak-parallax-*` classes.
- Eyebrow pill uses `.oak-glass` + `.oak-pulse-ring` dot.
- `min-height` ≥ `min(82vh, 760px)`. Accueil may push to `min(92vh, 880px)`.

### 4.2 Buttons
- **Primary:** olive gradient (`#c9dba8 → #aac240 → #8aa02f`), dark text,
  rounded-2xl, large shadow `0 14px 32px rgba(140,170,60,0.45)`, `.oak-shine`.
- **Secondary:** `.oak-glass` pill, white text, no fill on hover.
- Icon + label, `ArrowRight` trailing icon on primary.

### 4.3 Sections
- Section wrapper: `section-content py-24 md:py-32 lg:py-36`.
- Headings use the 3-part `SectionTitle` (eyebrow → title lead + accent + tail → description).
- Cards: `oak-spotlight` + `oak-tilt` for interactive, `oak-glass` for floating panels.
- Reveal-on-scroll via `<Reveal>` (IntersectionObserver + `.oak-reveal`).

### 4.4 Footer CTA
`LivingCTA` — dark mesh background, big gradient title, badge row.
Use once per page, just before the footer.

### 4.5 Do / Don't
- ✅ Big whitespace, few words per screen, one hero image/video per page.
- ✅ Conic-gradient rings (`.oak-ring-rotate`) around avatars / logos / key icons.
- ❌ No dense tables on public pages. Link out to ops views instead.
- ❌ No role colors in public surfaces.

---

## 5. Ops mode — Notion playbook

### 5.1 Canvas
- Background: `--color-surface` (`#f8faf4`).
- Content max-width: `1200px` centered, `px-8`.
- Sidebar: 256 px, `--color-surface-2`, 1-px right border `--color-divider`.

### 5.2 Headings (serif accent)
Notion-like: use a system serif for H1/H2/H3 in ops pages to create editorial
contrast with Satoshi body text.

```css
.ops-title {
  font-family: ui-serif, Georgia, 'Times New Roman', serif;
  font-weight: 600;
  letter-spacing: -0.01em;
}
```

Applied automatically to every `h1`, `h2`, `h3` inside `.dashboard-main` — no
per-page class needed. Opt out with `font-sans` when a heading must stay in
Satoshi (e.g. small uppercase section labels).

H1 = `text-2xl`, H2 = `text-xl`, H3 = `text-lg` (card subtitles).
**No gradient text in ops mode.**

### 5.3 Cards & rows
- Cards: `rounded-lg`, 1-px border `--color-border`, `bg-white`, `shadow-sm` on hover only.
- Table rows: 44 px tall, zebra off, 1-px bottom divider `--color-divider`.
- Hover: background `color-mix(in oklch, var(--oak-chartreuse) 25 %, white)`.
- Active/selected: left-border 2 px `--oak-olive` + same hover fill.

### 5.4 Buttons
- **Primary:** solid `--oak-olive`, white text, `rounded-md`, 36 px tall.
- **Secondary:** `bg-white`, 1-px border `--color-border`, neutral text, same size.
- **Ghost:** transparent, hover bg `--color-surface-offset`.
- Icon-only: 32 × 32, `rounded-md`, same ghost recipe.

### 5.5 Forms
- Input: 36 px tall, 1-px border `--color-border`, `rounded-md`, focus ring 2 px
  `color-mix(in oklch, var(--oak-olive) 35 %, white)`.
- Labels: `text-xs`, `uppercase`, `tracking-wider`, `--color-text-muted`.
- Help text: `text-xs`, `--color-text-faint`.

### 5.6 Role color discipline
Only four places may use role colors:
1. Role badge next to user's name.
2. Avatar ring.
3. Left-border stripe on role-specific filter chips.
4. Empty-state illustration tint.

Never fill a whole button or card in a role color — it breaks the calm.

### 5.7 Motion
- Only `var(--transition-fast)` (150 ms) on hover/focus.
- No parallax, no blobs, no `.oak-ring-rotate`, no gradient text.
- Skeleton loaders, not spinners, for list/table loading.

---

## 6. Shared components — usage matrix

| Component | Public | Ops | Notes |
|---|:---:|:---:|---|
| `LivingHero` | ✅ | ❌ | Hero video only allowed on public pages |
| `LivingCTA` | ✅ | ❌ | |
| `MarqueeStrip` | ✅ | ❌ | |
| `SectionTitle` | ✅ | ❌ | Ops uses plain `.ops-title` |
| `Reveal` | ✅ | ⚠️ opt-in | Avoid on tables/forms |
| `.oak-glass` | ✅ | ❌ | Glass is a public-mode signal |
| `.oak-ring-rotate` | ✅ | ❌ | Public-only decoration |
| `.oak-spotlight` | ✅ | ⚠️ | Ops: only on interactive cards, never on rows |
| `oak-blob` | ✅ | ❌ | |
| Role badge | ⚠️ | ✅ | Public only if user is logged in (nav avatar) |

---

## 7. Accessibility rules (both modes)

- Respect `prefers-reduced-motion` for **parallax and reveals** only. The hero
  `<video>` still plays (matches Accueil behaviour); this is intentional so
  Programmes / Admissions / Vie de Campus stay consistent.
- Minimum contrast: 4.5 : 1 on body text, 3 : 1 on large display.
- All interactive elements must have a visible focus ring (2 px olive with 2 px
  offset on light, 2 px chartreuse on dark overlays).
- Keyboard: sidebar collapsible via `Cmd/Ctrl+B`, command palette via `Cmd/Ctrl+K`
  (future).

---

## 8. Asset conventions

- Hero videos: `/excz.mp4` (main) + optional per-page fallback. Always provide
  a poster (`.png` / `.jpg`). Pre-generate `.webp` + `.avif` siblings only for
  posters registered in `deriveOptimisedSiblings` (`living.tsx`).
- Icons: Lucide only. Keep stroke width default (`2`). Size multiples of 4 px.
- Photography: editorial, candid, warm white-balance. No stock overlays with
  students posing at a camera.

---

## 9. Checklist when shipping a new page

1. Is this `public` or `ops`? Pick one mode and stay in it.
2. Tokens only — no hex literals outside `index.css`.
3. Does the hero / title follow §4.1 or §5.2?
4. Buttons follow §4.2 or §5.4?
5. Reduced-motion tested? (Chrome devtools → Rendering → Emulate prefers-reduced-motion.)
6. Dark overlays present on video heroes? Minimum 40 % at top.
7. Focus rings visible on every interactive element?
8. No role color used decoratively?

---

*Last updated with the `oak` v2 palette. Keep this file next to `README.md` and
reference it in PR descriptions when touching UI.*
