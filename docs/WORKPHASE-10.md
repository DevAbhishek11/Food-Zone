# Workphase 10 — Favorites & Reorder

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done

## Goal
Make the app feel "lived-in": let customers save favorite restaurants and re-place a
past order in one tap.

## Backend (`FoodZoneServer/`)
- New `favorites` table + `Favorite` model (unique `user_id` + `vendor_id`).
- Endpoints: `POST/DELETE /vendors/{vendor}/favorite` (idempotent), `GET /favorites`
  (paginated saved vendors). Vendor queries are annotated with **`is_favorited`** for
  the current viewer via `withExists` (no N+1); also a `?favorites=1` filter on the
  vendor list.
- **`POST /orders/{order}/reorder`** — rebuilds a new order from the past order's
  still-available items at current prices (re-validates via `OrderService`; reuses the
  original address only if it still belongs to the user; 422 if nothing is orderable).
- `FavoriteReorderTest` — 6 tests (favorite/unfavorite, idempotency, `is_favorited`
  flag, successful reorder, reorder-with-no-available-items 422, cross-user 403).

## Web (`foodzoneweb/`)
- `FavoriteButton` (heart) on every `VendorCard` and on the vendor menu header,
  with optimistic toggle.
- `/favorites` page listing saved restaurants; a "Saved" link in the Order Food header.
- **Reorder** button on terminal orders (delivered/cancelled/rejected) in `/orders`.
- `lib/hooks/use-favorites.ts` (`useFavorites`, `useToggleFavorite`, `useReorder`).

## Mobile (`FoodZoneApp/`)
- `FavoriteHeart` on the vendor screen header (optimistic).
- **Reorder** button on terminal orders in the Orders tab.
- `useToggleFavorite` / `useReorder` in `src/lib/hooks.ts`.

## Key files
- Backend: `database/migrations/..._create_favorites_table.php`, `app/Models/Favorite.php`,
  `app/Http/Controllers/Api/V1/VendorController.php` (favorite/unfavorite/favorites + flag),
  `app/Http/Controllers/Api/V1/OrderController.php` (reorder), `tests/Feature/FavoriteReorderTest.php`
- Web: `components/vendors/FavoriteButton.tsx`, `app/(app)/favorites/page.tsx`,
  `lib/hooks/use-favorites.ts`, `app/(app)/orders/page.tsx`
- Mobile: `src/components/favorite-heart.tsx`, `src/app/vendor/[id].tsx`,
  `src/app/(tabs)/orders.tsx`, `src/lib/hooks.ts`

## Verification
Backend **71 tests passing**; web build + lint clean (`/favorites`); mobile tsc + lint +
export clean (20 routes). Live: favoriting a vendor returned `is_favorited: true` and the
favorites list returned it.
