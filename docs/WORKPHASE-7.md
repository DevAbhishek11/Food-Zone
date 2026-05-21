# Workphase 7 — Vendor Dashboard

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done

## Goal
Give vendors operational screens for their store. The management APIs already
existed (orders, menu, reviews); this phase adds a stats endpoint and the
vendor-facing UI on both clients.

## Backend (`FoodZoneServer/`)
- New **`GET /vendor/stats`** — `is_open`, pending/active order counts, orders &
  revenue today, total orders, rating avg/count, menu-item count.
- Reused existing vendor APIs: `GET /vendor/orders`, `POST /vendor/orders/{id}/status`
  (lifecycle-enforced), categories & items CRUD + `toggle-availability`,
  `GET /vendor/reviews` + `POST /vendor/reviews/{id}/reply`, `POST /vendor/store/toggle-open`.
- `VendorDashboardTest` — 3 tests (stats metrics, non-vendor 403, list+advance orders).

## Web (`foodzoneweb/`)
Role-gated **`/vendor`** area (a "My Store" nav item appears only for `vendor`/`admin`),
with a `VendorNav` sub-navigation across four pages:
- `/vendor` — stat cards + open/close store toggle.
- `/vendor/orders` — incoming orders with status-advance buttons (accept/reject →
  preparing → ready → out-for-delivery → delivered).
- `/vendor/menu` — category add/delete, item add/edit/delete, availability toggle.
- `/vendor/reviews` — reviews with inline reply.

## Mobile (`FoodZoneApp/`)
A **"Manage store"** button on Profile (vendor/admin only) opens the stack:
- `/manage` — stat cards, open/close toggle, incoming orders with status-advance
  actions (pull-to-refresh), and a link to reviews.
- `/manage/reviews` — reviews with inline reply.

(Full menu CRUD is web-primary; mobile focuses on the time-sensitive order/review ops.)

## Key files
- Backend: `app/Http/Controllers/Api/V1/VendorController.php` (`stats`), `routes/api.php`,
  `tests/Feature/VendorDashboardTest.php`
- Web: `lib/hooks/use-vendor-admin.ts`, `components/vendor/VendorNav.tsx`,
  `app/(app)/vendor/*`, `components/AppShell.tsx` (role-gated nav)
- Mobile: `src/lib/hooks.ts` (vendor hooks), `src/app/manage/index.tsx`,
  `src/app/manage/reviews.tsx`, `src/app/_layout.tsx`, `src/app/(tabs)/profile.tsx`

## Verification
Backend **52 tests passing**; web build + lint clean (`/vendor`, `/vendor/orders`,
`/vendor/menu`, `/vendor/reviews`); mobile tsc + lint + export clean (18 routes incl.
`/manage`). Live: `GET /vendor/stats` returned correct pending/today/menu-item counts.
