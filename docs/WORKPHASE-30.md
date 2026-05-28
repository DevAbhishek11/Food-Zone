# Workphase 30 — Vendor Store UI

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done · **v3.0 roadmap**

## Goal
Make the vendor store experience first-rate: a richer hero with open/closed
state and delivery details, cuisine tag chips, "popular" item badges, plus
discovery endpoints (nearby vendors, trending items) and the ability to report
a vendor.

## Schema reality check
`vendors` already had `lat`/`lng`/`is_open`/`closed_message`/`prep_time_minutes`
/`banner`/`logo` — but **no `tags`** and **no vendor-reports table**. Migration
adds `vendors.tags` (JSON) and a new `vendor_reports` table. Delivery estimates
are *derived* from `prep_time_minutes` (no new columns).

## Backend (`FoodZoneServer/`)
- **`VendorResource`** gains `tags`, `has_offer`, `delivery_estimate_min/max`,
  `opens_at` — all populated by a private `annotateDiscovery()` helper called by
  `show()` and `menu()`: `has_offer` from the `vouchers` table; estimates from
  `prep_time_minutes` ± a 15-minute buffer; `opens_at` walks `operating_hours`
  forward up to 7 days to find the next opening boundary (when closed now).
- **`GET /vendors/{id}/menu`** now returns `popular_items` — top 5 available
  item ids by `orders_count`.
- **`GET /vendors/nearby?lat=&lng=&radius=`** — Haversine implemented **in PHP**
  (SQLite lacks `acos/sin/cos` and tests must stay portable); attaches
  `distance_km` per vendor, sorts ascending, filters by radius.
- **`GET /items/trending`** — globally top-ordered menu items in the last 24 h
  (`order_items` grouped by `item_id` joined back to `MenuItem`).
- **`POST /vendors/{id}/report`** `{reason, detail?}` — creates a
  `vendor_reports` row (queued for admin review in P32).
- `VendorStoreTest` (5) → **168 tests**.

## Web (`foodzoneweb/`)
- **`/vendors/[id]` hero**: open/closed status pill (green / red, with the
  formatted `opens_at` when closed), 🎟 Offers chip when `has_offer`, a delivery
  strip (`🚴 X–Y min · ₹fee · Free above ₹N · Min ₹M`), and cuisine tag chips.
- **Menu items**: a 🔥 Popular badge for ids in `popular_items`, and an
  inline veg/non-veg dot icon based on `dietary_tags`.
- Types extended (`Vendor.tags/has_offer/delivery_estimate_*​/opens_at`,
  `VendorMenu.popular_items`).

## Mobile (`FoodZoneApp/`)
- **`vendor/[id]` header**: open/closed pill, opens-at hint, Offers chip,
  delivery-estimate text, and cuisine tag chips.
- **`MenuRow`**: 🔥 popular badge next to the item name.
- Types mirrored.

## Scope note
A sticky category tab bar and a vendor-detail item bottom sheet are deferred to
a polish pass (the data fields are now in place; UI follow-up).

## Key files
- Backend: `database/migrations/..._vendor_discovery.php`,
  `app/Models/{Vendor,VendorReport}.php`, `app/Http/Resources/VendorResource.php`,
  `app/Http/Controllers/Api/V1/VendorController.php`, `routes/api.php`,
  `tests/Feature/VendorStoreTest.php`
- Web: `lib/types.ts`, `app/(app)/vendors/[id]/page.tsx`
- Mobile: `src/lib/types.ts`, `src/app/vendor/[id].tsx`

## Verification
Backend **168 tests passing** (5 new). Web `build` + `lint` clean. Mobile `tsc`
+ `expo lint` clean and `expo export` bundles iOS + Android + web. `nearby`,
`items/trending`, and `vendors/{id}/report` routes registered.
