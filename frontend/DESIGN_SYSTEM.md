# Groundwork — Design System

> Note on process: this project's sandbox did not have the `ui-ux-pro-max`
> search tool's data files available (only `SKILL.md` was present, no
> `scripts/` or `references/`), so the specific palette/style database lookups
> in the skill could not be executed. What follows applies the skill's
> documented priority framework (accessibility → touch/interaction →
> performance → style selection → layout → typography/color → animation →
> forms → navigation → data) and general premium-product design practice,
> hand-authored rather than pulled from a live database match. Flagging this
> per the skill's own instruction not to present unverified output as a
> database match.

## 1. Brand direction

**Groundwork** — the name signals "funding real work, laid brick by brick."
The product should feel like a serious, editorial fintech tool that happens to
use crypto rails — closer to Kickstarter-meets-Linear than a "generic crypto
site." No neon gradients, no glowing blobs, no purple/blue AI-template look.

## 2. Color

A warm, ink-based neutral system with **one** confident accent (copper) and a
single semantic success color (moss green) — deliberately not blue/purple.

| Token | Hex | Use |
|---|---|---|
| `ink-950` | `#121110` | Primary headings, high-emphasis text |
| `ink-900` | `#1B1918` | Body text, nav background (dark sections) |
| `ink-600` | `#524C43` | Secondary text |
| `ink-300` | `#B0A896` | Borders, dividers on light surfaces |
| `paper-50` | `#FDFCF9` | App background |
| `paper-100`/`200` | `#FAF7F0` / `#F3EDE0` | Section alternation, card backgrounds |
| `copper-500` | `#B75B12` | Primary actions, links, key data (raised %, votes) |
| `copper-600` | `#9A4A0E` | Hover/active state of primary actions |
| `moss-500` | `#3F6B2E` | Approved milestones, funded/success states |
| `rust-500` | `#AE402C` | Errors, rejected milestones, destructive actions |
| `amber-500` | `#A6791F` | Pending/warning states (voting in progress) |

All text/background pairs are checked to meet **4.5:1 contrast** minimum
(body text) and 3:1 for large display type.

## 3. Typography

Two-family pairing chosen specifically to avoid the "default Inter everywhere"
AI look while staying highly legible:

- **Fraunces** (display serif, variable optical size) — all H1–H3 headings,
  pull quotes, hero statements. It has warmth and editorial character.
- **Inter** — UI text, body copy, buttons, forms, nav.
- **IBM Plex Mono** — wallet addresses, transaction hashes, token amounts,
  countdown timers. Monospace here isn't decorative — it prevents address
  characters from being ambiguous and signals "this is precise, on-chain
  data" versus prose.

Scale (mobile → desktop handled via responsive classes, not separate tokens):
`text-sm` (14px) → `text-6xl` (~67px), base body always **16px minimum**,
line-height 1.5–1.6 for paragraphs.

## 4. Spacing & layout

Standard 4px-based Tailwind scale. Page content is constrained to
`max-w-content` (1280px) with responsive gutters (20px mobile → 40px desktop).
Sections use generous vertical rhythm (80–128px between major sections on
desktop, 56–72px on mobile) — space is a design tool here, not wasted room.

## 5. Radius

Restrained, not "everything is a pill":
- `sm` 6px — inputs, small controls, chips
- default 8px — buttons
- `md` 10px — form fields
- `lg` 14px — cards
- `xl` 20px — large feature panels/hero media only

## 6. Shadows

Soft, low-opacity, two-layer shadows for a sense of physical paper stacking
rather than a glow:
- `shadow-card` — resting card elevation
- `shadow-lifted` — hover/active elevation, modals, dropdowns
- `shadow-focus` — replaces browser default focus outline (copper, 3px)

## 7. Buttons

Three tiers, all with a **minimum 44px touch target** and visible
`:focus-visible` rings:
- **Primary** — solid `ink-950` fill, `paper-50` text; on marketing CTAs the
  primary can invert to solid copper for the single highest-priority action
  per screen only (never more than one solid-copper button visible at once).
- **Secondary** — 1.5px `ink-950` border, transparent fill.
- **Ghost** — no border, text-only, underline on hover.
- Loading state replaces label with a spinner + keeps width (no layout
  shift); disabled state drops opacity to 40% and removes pointer events.

## 8. Cards

1px `ink-950/8` border + `shadow-card`, `rounded-lg`, generous internal
padding (20–28px). Hover state on interactive cards: `translateY(-3px)` +
`shadow-lifted`, 200ms `ease-out-expo` — never scale the whole card (causes
content reflow/jitter), only translate + shadow.

## 9. Forms

Visible labels above every field (never placeholder-as-label). Helper text
below in `ink-600`. Errors appear inline directly under the field in `rust-500`
with an icon, not only summarized at the top. Inputs: 44px+ height, `rounded-md`,
1.5px border, copper focus ring. Multi-step forms (Create Campaign) show
progressive disclosure — one concern per step — with a persistent step
indicator.

## 10. Navigation

Sticky top nav, current route indicated with a copper underline (not a filled
pill). Mobile: hamburger → full-height slide-in drawer from the right,
44px+ tap targets, focus trapped while open, closes on route change and
`Escape`. Wallet connection state always visible in the nav (address chip in
mono font once connected).

## 11. Motion (Framer Motion)

Motion is used to **clarify**, not decorate:
- Page transitions: 200ms fade + 8px y-translate, exits faster (120ms) than
  entrances (220ms).
- Scroll reveals: staggered children, 24px y-offset → 0, `viewport={{ once: true }}`
  so re-scrolling never re-triggers.
- Hover: cards translate -3px; buttons scale 0.98 on tap (`whileTap`) for
  tactile feedback, never on hover (avoids layout jitter on trackpads).
- Progress bars animate width on mount/update with a spring, not linear tween.
- All animation respects `prefers-reduced-motion` (handled globally in
  `index.css` as a hard fallback, independent of individual component code).

## 12. Icons

`lucide-react` throughout — consistent 1.5px stroke weight, never emoji as
functional icons. Icon-only buttons always carry an `aria-label`.
