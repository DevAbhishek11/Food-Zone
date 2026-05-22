# Workphase 13 — Vendor Dashboard (Business-Ready)

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done

## Goal
Make the vendor dashboard a daily-use business tool: sales analytics, an operating-hours
editor, full menu management with **variants & add-ons**, and order timelines.

## Backend (`FoodZoneServer/`)
- **`GET /vendor/analytics?days=N`** — daily revenue/orders series, status distribution,
  top-selling items, lifetime revenue (scoped to the vendor).
- **`GET /vendor/hours`** + **`PUT /vendor/hours`** — read/upsert the 7-day operating-hours
  schedule (per-day open/close/closed; idempotent per day).
- Variants & add-ons were already accepted by `MenuItemController` (store/update) and
  exposed by `MenuItemResource`; this phase surfaces them in the clients.
- `VendorAnalyticsTest` — 4 tests (analytics shape + lifetime, non-vendor 403, hours
  upsert + read, per-day idempotency).

## Web (`foodzoneweb/`)
- **`/vendor` dashboard** now has a 7/14/30-day range selector and charts (revenue area,
  orders bar, status donut) + a **top-items** list and lifetime revenue (reuses
  `components/admin/Charts.tsx`).
- **`/vendor/menu`** item form gains dynamic **variants** and **add-ons** row editors.
- New **`/vendor/hours`** page: per-day open toggle + time pickers (seeded via a child
  component's `useState` initializer to avoid effect-driven state).
- **`/vendor/orders`** cards get an expandable **timeline** (fetches status history on demand).
- `VendorNav` gains an **Hours** tab.

## Mobile (`FoodZoneApp/`)
- New **`/manage/hours`** screen (per-day open switch + open/close times).
- `/manage` dashboard links to Operating hours, and each order card has an expandable
  **timeline** (status history on demand).
- Hooks added: `useVendorHours`, `useUpdateHours`, `useOrderDetail`.

## Key files
- Backend: `app/Http/Controllers/Api/V1/VendorController.php` (analytics/hours/updateHours),
  `routes/api.php`, `tests/Feature/VendorAnalyticsTest.php`
- Web: `lib/hooks/use-vendor-admin.ts`, `app/(app)/vendor/page.tsx`,
  `app/(app)/vendor/hours/page.tsx`, `app/(app)/vendor/menu/page.tsx`,
  `app/(app)/vendor/orders/page.tsx`, `components/vendor/VendorNav.tsx`
- Mobile: `src/lib/hooks.ts`, `src/app/manage/hours.tsx`, `src/app/manage/index.tsx`,
  `src/app/_layout.tsx`

## Verification
Backend **85 tests passing**; web build + lint clean (`/vendor`, `/vendor/hours`,
`/vendor/menu`, `/vendor/orders`, `/vendor/reviews`); mobile tsc + lint + export clean
(22 routes incl. `/manage/hours`). Live (port 8011): analytics returned a 7-day series;
hours upsert returned the saved row.

> Note: another local project occupies port 8000; run the API on an alternate port for
> smoke tests in this environment.
