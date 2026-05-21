# Workphase 5 — Reviews & Ratings

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done

## Goal
Let customers rate delivered orders, read a vendor's reviews, and let vendors reply —
closing the loop on the existing `order_ratings` data.

## Backend (`FoodZoneServer/`)
- `OrderRatingResource` (nested reviewer info).
- **Public** `GET /vendors/{idOrSlug}/reviews` — paginated, newest first.
- **Vendor** `GET /vendor/reviews` and `POST /vendor/reviews/{rating}/reply`
  (sets `vendor_reply`/`vendor_replied_at`, notifies the reviewer, ownership-guarded).
- `OrderController@index` eager-loads `rating` so clients know which delivered orders
  still need a review.
- `ReviewTest` — 4 tests (public listing, vendor reply, cross-store 403,
  rate→appears-in-reviews). The `POST /orders/{id}/rate` endpoint already existed.

## Web (`foodzoneweb/`)
- `Stars` component; `VendorReviews` section on `/vendors/[id]` (avatars, stars,
  text, owner replies).
- `RateOrderDialog` + a **"Rate order"** action on delivered orders in `/orders`
  (shows stars once rated).

## Mobile (`FoodZoneApp/`)
- RN `Stars`; reviews section on the vendor screen.
- `RateOrderModal` + a **"Rate order"** action on delivered orders in the orders tab.

## Key files
- Backend: `app/Http/Resources/OrderRatingResource.php`,
  `app/Http/Controllers/Api/V1/ReviewController.php`, `tests/Feature/ReviewTest.php`
- Web: `components/ui/Stars.tsx`, `components/vendors/VendorReviews.tsx`,
  `components/orders/RateOrderDialog.tsx`, `lib/hooks/use-vendors.ts`, `lib/hooks/use-orders.ts`
- Mobile: `src/components/stars.tsx`, `src/components/vendor-reviews.tsx`,
  `src/components/rate-order-modal.tsx`, `src/lib/hooks.ts`

## Notes
A review must be **≥ 20 characters** when provided (rating-only is allowed).

## Verification
Backend tests pass; web build + mobile bundle clean. Live: a seeded rating appeared
in `GET /vendors/{slug}/reviews` with the nested user.
