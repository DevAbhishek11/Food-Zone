# Workphase 26 — Design System Overhaul

**Tiers:** Web + Mobile · **Status:** ✅ Done · **v3.0 roadmap**

## Goal
A consistent, premium token system and rebuilt core components, shared between
web and mobile. Refreshes the whole app's look from a slate-tinted palette to a
neutral-zinc dark theme — without breaking any of the 30 existing pages.

## Web tokens (`app/globals.css`)
Extended the `@theme` block to the full P26 set while **keeping the original
token names as working aliases** (so existing `bg-bg`, `text-content`,
`border-line`, `bg-surface`, etc. keep compiling — only their values changed):
- Brand: `brand`, `brand-hover`, `brand-light`, `brand-dark`, `brand-glow`
- Backgrounds: `bg`(=base), `bg-base`, `bg-soft`(=elevated), `bg-elevated`,
  `bg-overlay`, `bg-card`, `bg-hover`
- Surfaces: `surface`(=card), `surface-hover`, `surface-1/2/3`
- Text: `content`/`muted` (aliases) + `text-primary/secondary/tertiary/disabled/inverse`
- Borders: `line`(=subtle), `border`, `border-strong`, `border-brand`
- Semantic: `success/warning/danger/info` + matching `*-bg`
- Radii (`sm/md/lg/xl/full/card`), shadows (`sm/md/lg/brand/glow`)
- `:root` non-utility tokens: `--gradient-brand`, `--gradient-brand-subtle`,
  `--gradient-card`, easings + durations
- Helper classes: `.fz-gradient-brand`, `.fz-shake` (form error), plus P25's
  `.fz-hero/.fz-gradient-text/.fz-float`.

## Web components
- **Button** — added `outline` variant + `xs`/`xl` sizes + `leftIcon`/`rightIcon`
  props + `active:scale-[0.98]`; `primary` now uses the brand gradient +
  `shadow-brand`. Backward compatible.
- **Card** (new) — `default` / `elevated` / `interactive` (hover lift + glow) /
  `glass` (backdrop blur) variants.
- **Badge** (new) — filled & outline variants in 6 semantic colours + optional
  status dot.
- **Avatar** — kept the numeric `size` API; added optional `ring` (gradient
  story ring), `online` (green dot), `verified` (blue check), and deterministic
  gradient initials. Decoration-free calls render identically to before.
- **Input** — built-in password show/hide toggle (Eye/EyeOff), error shake
  (`.fz-shake`), full-width fix. Backward compatible.

(The project imports components directly — there is no `components/index.ts`
barrel — so new components follow that same convention.)

## Mobile tokens (`src/constants/theme.ts`)
Refreshed the dark palette to neutral zinc and **added** keys to both schemes
(`textTertiary`, `borderStrong`, `surface1`, `surface2`, `brandLight`,
`brandDark`, `info`) — all existing keys preserved so screens keep rendering.
Added `Shadows` (`sm`/`md`/`brand`, iOS shadow + Android elevation) and `Radii`
(`sm/md/lg/xl/full`) exports alongside the existing `Spacing`.

## Key files
- Web: `app/globals.css`, `components/ui/{Button,Card,Badge,Avatar,Input}.tsx`
- Mobile: `src/constants/theme.ts`

## Verification
Web `build` + `lint` clean (30 pages). Mobile `tsc` + `expo lint` clean and
`expo export` bundles iOS + Android + web (27 routes). No backend changes. The
neutral-zinc values propagate everywhere automatically via the aliased tokens.
