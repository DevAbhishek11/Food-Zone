# Workphase 11 — Address Book & Checkout Addresses

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done

## Goal
Close the ordering gap: let customers manage saved delivery addresses and attach
one to an order at checkout (orders previously carried no delivery address from the
clients).

## Backend (`FoodZoneServer/`)
- The address API already existed (`GET/POST/PUT/DELETE /addresses`, first address
  auto-default, marking default unsets others, ownership-guarded). This phase adds the
  missing **`AddressTest`** (5 tests): first-address-default, default switching,
  list/update/delete, cross-user 403, and that placing an order with `address_id`
  **snapshots** the address into `order.delivery_address`.

## Web (`foodzoneweb/`)
- `/addresses` page: list, add, edit, delete, and "set as default" (inline form).
- Checkout (vendor menu cart): a **"Deliver to"** address selector that defaults to the
  user's default address and passes `address_id` when placing the order; if none,
  a link to add one.
- A "Delivery addresses" entry on Profile.
- `lib/hooks/use-addresses.ts` (`useAddresses`, `useSaveAddress`).

## Mobile (`FoodZoneApp/`)
- `/addresses` screen: list, inline add form, delete, set default.
- Checkout: the cart bar shows the chosen delivery address (tap to manage) and the
  order is placed with the default address's `address_id`.
- A "Delivery addresses" button on Profile.
- Address hooks added to `src/lib/hooks.ts`.

## Key files
- Backend: `tests/Feature/AddressTest.php` (controller already existed)
- Web: `app/(app)/addresses/page.tsx`, `lib/hooks/use-addresses.ts`,
  `app/(app)/vendors/[id]/page.tsx` (cart selector), `app/(app)/profile/page.tsx`
- Mobile: `src/app/addresses.tsx`, `src/lib/hooks.ts`, `src/app/vendor/[id].tsx`,
  `src/app/_layout.tsx`, `src/app/(tabs)/profile.tsx`

## Verification
Backend **76 tests passing**; web build + lint clean (`/addresses`); mobile tsc + lint +
export clean (21 routes incl. `/addresses`). The order-snapshot test confirms a selected
address lands in `order.delivery_address`.
