# Workphase 25 — Public Landing Page + Role-Separated Auth

**Tiers:** Web · **Status:** ✅ Done · **First phase of the v3.0 enhancement roadmap (P25–P36)**

## Goal
A world-class public marketing landing page at `/`, and separate login/signup
flows for users, vendors, and admins with role-based post-login routing.

## Route restructure
- **Feed moved** `app/(app)/page.tsx` → `app/(app)/feed/page.tsx` (so `/` is free
  for the public landing; the authenticated home is now `/feed`).
- **`lib/redirect.ts`** — `redirectAfterLogin(role)`: `user`→`/feed`,
  `vendor`→`/vendor`, `admin`/`super_admin`→`/admin`, `delivery`→`/delivery`.
  Applied in every login/register flow + the authed-redirect effects.
- Updated all `/`-links to `/feed`: `AppShell` (Feed nav item, logo, `isActive`),
  `posts/[id]`, `u/[username]`.

## Landing page (`app/page.tsx`, public)
Client component; redirects to `/feed` if a token is present. Sections: sticky
blurred **top nav** (Sign in / Get Started), **hero** (animated radial-gradient
backdrop `.fz-hero`, gradient headline, floating food emoji, dual CTAs, social
proof), **features** (3 glass cards w/ hover lift), **how it works** (4-step
timeline), **stats** (scroll-triggered count-up via IntersectionObserver +
`requestAnimationFrame`), **trending categories** (horizontal chips →
`/vendors?category=`), **app download** (CSS-drawn phone mockup + store badges
with UTM), **vendor CTA** → `/vendor/register`, and a full **footer**.
`globals.css` gained `.fz-hero`, `.fz-gradient-text`, `.fz-float` (+
`prefers-reduced-motion` guard).

## Auth pages
- **`/login`** — role-based redirect; added Vendor Login / Admin Login cross-links.
- **`/register`** — rebuilt as a **3-step** wizard (progress bar; step 1 name/
  username/email, step 2 password/confirm/phone, step 3 DOB/gender) with
  per-step `trigger()` validation; sends only API-accepted fields.
- **`/vendor/login`** — amber-accented "Vendor Portal"; → `/vendor`; links to apply.
- **`/vendor/register`** — public application: creates the owner account
  (`/auth/register`, derived username) then submits the vendor application
  (`/vendors/register`), then an "Application received" success screen. Desktop
  benefits panel.
- **`/admin/login`** — neutral/slate console login with a 2FA code field that
  appears once a password is entered (scaffold; not yet wired). → `/admin`.

## Design note
Role-based **redirect** is implemented; hard route-blocking (preventing a vendor
from viewing the social feed) was intentionally *not* added — FoodZone is a
social+food app where every role can browse the feed. The redirect sends each
role to its home on login; cross-navigation stays open.

## Key files
- `lib/redirect.ts`, `app/page.tsx`, `app/globals.css`,
  `app/(app)/feed/page.tsx` (moved), `app/login/page.tsx`, `app/register/page.tsx`,
  `app/vendor/login/page.tsx`, `app/vendor/register/page.tsx`,
  `app/admin/login/page.tsx`, `components/AppShell.tsx`,
  `app/(app)/posts/[id]/page.tsx`, `app/(app)/u/[username]/page.tsx`

## Verification
Web `npm run build` + `npm run lint` clean. **30 pages** built (was 24): added
`/` landing, `/feed`, `/vendor/login`, `/vendor/register`, `/admin/login`
(register became multi-step in place). No route collision; backend + mobile
untouched this phase.
