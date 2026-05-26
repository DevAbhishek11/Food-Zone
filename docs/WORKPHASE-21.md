# Workphase 21 — Delivery partner flow

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done

## Goal
Activate the `delivery` role (scaffolded in the schema since P1 but with no
endpoints): let users become delivery partners, **claim** available orders,
and drive them through **pick-up → out for delivery → delivered**, with the
customer and vendor notified at each step. COD is settled on delivery.

## Backend (`FoodZoneServer/`)
- **Schema** — `orders` gains `delivery_partner_id` (plain indexed column, *no*
  DB-level FK so the ALTER runs on both MySQL & SQLite — app-layer integrity,
  same pattern as `voucher_id`), `assigned_at`, `picked_up_at`.
- **Relations** — `Order::deliveryPartner()`, `User::deliveries()`.
- **`DeliveryController`** (routes under `delivery/`):
  - `POST /delivery/register` (any authed `user`) — promote to the `delivery`
    role (idempotent; vendors/admins rejected).
  - `role:delivery,admin` group:
    - `GET /delivery/available` — unassigned orders in `preparing`/`ready` at
      delivery-enabled vendors (auto-refreshes on the clients).
    - `POST /delivery/orders/{order}/accept` — **atomic** claim (conditional
      `whereNull(delivery_partner_id)` update; only one partner wins); notifies
      customer + vendor.
    - `POST /delivery/orders/{order}/release` — unassign before pickup.
    - `POST /delivery/orders/{order}/pick-up` — `ready` → `out_for_delivery`
      (sets `picked_up_at`; notifies customer).
    - `POST /delivery/orders/{order}/deliver` — `out_for_delivery` → `delivered`
      (sets `delivered_at`, settles COD `payment_status=paid`; notifies both).
    - `GET /delivery/orders?status=active|completed` — the partner's deliveries.
    - `GET /delivery/stats` — active / delivered-today / total-delivered.
  - All actions guard ownership (`assertAssigned`) and fire `OrderStatusUpdated`
    so the customer's existing real-time/polling order view updates.
- `OrderResource` gains `delivery_partner_id`, `delivery_partner`,
  `assigned_at`, `picked_up_at`.
- `DeliveryTest` — 7 tests (register, available list, atomic accept + second
  partner rejected, pick-up→deliver + COD settled, non-assignee 403, release,
  non-delivery 403).

## Web (`foodzoneweb/`)
- `lib/hooks/use-delivery.ts` (stats, available, mine, accept/release/pick-up/
  deliver, become-partner).
- `/delivery` page: stat cards + **Available / Active / Completed** tabs with the
  right action per order status; non-partners see a "Become a delivery partner"
  CTA. A **Deliveries** nav item shows for the `delivery` role; the Profile page
  links here for `user`/`delivery` roles.

## Mobile (`FoodZoneApp/`)
- Delivery hooks mirrored in `src/lib/hooks.ts`.
- `deliver/index` screen (stats + tabs + per-status actions, pull-to-refresh,
  paginated) with the same "Become a delivery partner" CTA; reached from a
  Profile button. Registered in the root stack.

## Key files
- Backend: `database/migrations/..._add_delivery_partner_to_orders.php`,
  `app/Models/{Order,User}.php`, `app/Http/Controllers/Api/V1/DeliveryController.php`,
  `app/Http/Resources/OrderResource.php`, `routes/api.php`, `tests/Feature/DeliveryTest.php`
- Web: `lib/hooks/use-delivery.ts`, `app/(app)/delivery/page.tsx`,
  `components/AppShell.tsx`, `app/(app)/profile/page.tsx`, `lib/types.ts`
- Mobile: `src/lib/hooks.ts`, `src/app/deliver/index.tsx`, `src/app/_layout.tsx`,
  `src/app/(tabs)/profile.tsx`, `src/lib/types.ts`

## Verification
Backend **123 tests passing** (7 new). Web `build` + `lint` clean. Mobile `tsc`
+ `expo lint` clean and `expo export` bundles iOS + Android + web (**25 routes**,
+1 for `/deliver`). All 8 `delivery/*` routes registered and role-gated.
