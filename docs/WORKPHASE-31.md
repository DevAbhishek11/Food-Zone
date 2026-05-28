# Workphase 31 — Vendor Dashboard v3

**Tiers:** Backend + Web · **Status:** ✅ Done · **v3.0 roadmap**

## Goal
Promote the vendor console from a basic "orders + menu" view to a proper
business dashboard: anonymised customer management with warn / block,
ingredient inventory with low-stock alerts, full promo-code CRUD, per-item
analytics, daily payouts, and a flash-deal creator.

## Schema reality check
`vouchers` already existed and is reused. **No** `inventory_items`, **no**
`flash_deals`, and **no** `vendor_user_blocks` were present. One migration
creates all three.

## Backend (`FoodZoneServer/`)
- New models: `InventoryItem` (with a derived `ok | low | out` status from
  stock vs. threshold), `FlashDeal` (with `scopeActive`), `VendorUserBlock`.
- New endpoints under `/vendor` (`role:vendor,admin` + `active`):
  - **Customers** — `GET /vendor/customers` returns anonymised "Customer #ID"
    rows with orders count, total spend, last-order timestamp, and `is_blocked`
    status, sorted by spend; `POST customers/{userId}/warn` sends a system DM
    via `NotificationService`; `POST/DELETE customers/{userId}/block` toggles
    `vendor_user_blocks`.
  - **Inventory** — `GET/POST/PUT/DELETE /vendor/inventory` and
    `POST /vendor/inventory/{item}/adjust` `{delta, reason?}` for stock
    movements. Status flips between `ok/low/out` automatically.
  - **Vouchers** — `GET/POST/PUT/DELETE /vendor/vouchers` with full validation
    (unique code, percentage/flat, optional min order, caps, validity window).
  - **Item analytics** — `GET /vendor/analytics/items?days=N` returns top items
    by revenue (units + revenue + rating_avg) over the window.
  - **Payouts** — `GET /vendor/payouts` aggregates delivered orders by day for
    the last 30 days into `{date, gross, commission, net}`.
  - **Flash deals** — `POST /vendor/flash-deals` creates one (item must belong
    to the vendor; discount 1–90 %; future ends_at).
- `VendorDashboardV3Test` (7) → **175 tests**.

## Web (`foodzoneweb/`)
- `VendorNav` gains **Customers**, **Inventory**, and **Vouchers** tabs.
- **`/vendor/customers`** — anonymised customers table with Warn (system-DM
  modal) and Block/Unblock actions; blocked rows tinted red.
- **`/vendor/inventory`** — items table with status badges (ok / low / out),
  a top "N items need restocking" alert, an **Adjust** dialog (stepper + reason
  field), an **Add item** dialog (name + unit + initial stock + threshold), and
  delete. Row tint reflects status.
- **`/vendor/vouchers`** — promo-code grid with monospace codes, % vs flat,
  min order, used / max-uses, and active state; a **New voucher** dialog
  (code, type, amount, min order, max uses).
- Shared hooks live in `lib/hooks/use-vendor-dashboard.ts`.

## Scope notes
The Kanban orders board, drag-to-reorder menu categories, satisfaction donut on
the dashboard home, and flash-deal create UI are tracked as polish follow-ups
(the underlying APIs are now live). Mobile was out of scope per the prompt
(vendor admin is web-primary).

## Key files
- Backend: `database/migrations/..._vendor_dashboard_v3.php`,
  `app/Models/{InventoryItem,FlashDeal,VendorUserBlock}.php`,
  `app/Http/Controllers/Api/V1/VendorController.php` (10+ new methods),
  `routes/api.php`, `tests/Feature/VendorDashboardV3Test.php`
- Web: `components/vendor/VendorNav.tsx`,
  `lib/hooks/use-vendor-dashboard.ts`,
  `app/(app)/vendor/{customers,inventory,vouchers}/page.tsx`

## Verification
Backend **175 tests passing** (7 new). Web `build` + `lint` clean — **34
pages** (was 31; +`/vendor/customers`, `/vendor/inventory`, `/vendor/vouchers`).
Mobile unchanged.
