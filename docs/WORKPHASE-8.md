# Workphase 8 — Admin Console

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done

## Goal
Complete the third persona. The admin APIs existed but had no UI and little test
coverage; this phase adds tests, a richer dashboard, the full web console, and a
mobile admin entry.

## Backend (`FoodZoneServer/`)
- Enriched `GET /admin/dashboard` with `vendors_approved`, `orders_total`, `posts_total`
  (alongside users/vendors/orders/revenue/commission metrics).
- Reused existing admin APIs: `GET /admin/users` (q/role/status filters),
  `PUT /admin/users/{id}/ban|suspend|unban`, `GET /admin/vendors`,
  `PUT /admin/vendors/{id}/approve|reject`.
- New **`AdminTest`** — 7 tests: dashboard metrics, non-admin 403, user search,
  ban/suspend/reinstate, can't-ban-an-admin (422), vendor approve+reject, and that a
  banned user loses access via the `active` middleware.

## Web (`foodzoneweb/`)
Role-gated **`/admin`** area (an "Admin" nav item appears only for `admin`/`super_admin`),
with an `AdminNav` sub-navigation:
- `/admin` — platform overview (today vs. totals stat cards; pending vendors highlighted).
- `/admin/users` — search + status filter; per-user **suspend (7/14/30d)**, **ban**, or
  **reinstate** (actions hidden for admin accounts).
- `/admin/vendors` — status chips (pending/approved/rejected/all); **approve** and
  **reject-with-reason** for pending applications.

Also refined `AppShell` so "My Store" shows only for `vendor` and "Admin" only for admins.

## Mobile (`FoodZoneApp/`)
An **"Admin console"** button on Profile (admin/super_admin only) → `/admin`:
dashboard stat cards + a pending-vendor queue with **approve** / **reject-with-reason**.
(User moderation is web-primary.)

## Key files
- Backend: `app/Http/Controllers/Api/V1/AdminController.php`, `tests/Feature/AdminTest.php`
- Web: `lib/hooks/use-admin.ts`, `components/admin/AdminNav.tsx`, `app/(app)/admin/*`,
  `components/AppShell.tsx`
- Mobile: `src/lib/hooks.ts` (admin hooks), `src/app/admin/index.tsx`,
  `src/app/_layout.tsx`, `src/app/(tabs)/profile.tsx`

## Verification
Backend **59 tests passing**; web build + lint clean (`/admin`, `/admin/users`,
`/admin/vendors`); mobile tsc + lint + export clean (19 routes incl. `/admin`).
Live: admin dashboard returned enriched metrics; a non-admin (`alice`) received **403**.
