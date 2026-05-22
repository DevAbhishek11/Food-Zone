# Workphase 12 — Admin Dashboard (Enterprise-Grade)

**Tiers:** Backend + Web · **Status:** ✅ Done
**Roadmap:** first of the production-grade phases (P12–P24). See `ROADMAP.md`.

## Goal
Turn the basic admin pages into a professional, data-rich console: real KPIs, charts,
platform-wide order monitoring, and advanced user management with bulk actions and CSV export.

## Backend (`FoodZoneServer/`)
- **`GET /admin/analytics?days=N`** — daily revenue/orders series (N=1–90), order
  **status distribution**, **top vendors**, and new-users series. Uses portable
  `DATE()` grouping with zero-filled day buckets.
- **`GET /admin/orders`** — platform-wide order monitoring, filterable by status,
  vendor, payment_status, and order-number search; returns vendor + customer.
- **`POST /admin/users/bulk`** — apply ban / suspend(7·14·30d) / unban to many users at
  once; admins are protected; tokens revoked on ban/suspend.
- `OrderResource` now exposes a `customer` block (when the user relation is loaded).
- `AdminAnalyticsTest` — 5 tests (series shape, order filtering + customer, bulk ban
  protects admins, suspend-needs-days 422, non-admin 403).

## Web (`foodzoneweb/`)
- **Recharts** added. `/admin` overview now has KPI cards + a range selector (7/14/30d)
  and four charts: revenue area, orders/day bar, status donut, and a top-vendors list.
- New **`/admin/orders`** monitoring page: a responsive data table with search + status
  filter and **CSV export**.
- `/admin/users` upgraded: row checkboxes, **select-all**, a **bulk action bar**
  (suspend/ban/reinstate) and **CSV export**.
- Reusable `lib/csv.ts` (client-side CSV download) and `components/admin/Charts.tsx`.
- `AdminNav` gains an **Orders** tab.

## Key files
- Backend: `app/Http/Controllers/Api/V1/AdminController.php` (analytics/orders/bulkUsers),
  `app/Http/Resources/OrderResource.php`, `routes/api.php`, `tests/Feature/AdminAnalyticsTest.php`
- Web: `lib/hooks/use-admin.ts`, `components/admin/Charts.tsx`, `lib/csv.ts`,
  `app/(app)/admin/page.tsx`, `app/(app)/admin/orders/page.tsx`, `app/(app)/admin/users/page.tsx`,
  `components/admin/AdminNav.tsx`

## Verification
Backend **81 tests passing**; web build + lint clean (`/admin`, `/admin/orders`,
`/admin/users`, `/admin/vendors`). Live: `analytics?days=7` returned a 7-point series,
status distribution and top vendors; `/admin/orders` returned orders with customer info.

> Mobile admin remains the lightweight screen from P8 (dashboard + vendor approvals);
> richer mobile analytics can follow if needed.
