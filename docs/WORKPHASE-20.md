# Workphase 20 — Checkout depth (variants/add-ons + voucher UX)

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done

## Goal
Let customers actually use item **variants** and **add-ons** at checkout (the
backend supported them but the clients only sent base items), and apply
**voucher / promo codes** in the cart with a live, server-accurate preview of
the discount before placing the order.

## Backend (`FoodZoneServer/`)
- **`OrderService::quote()`** — extracted all pricing/validation from `place()`
  into a reusable method that returns the vendor + resolved line items + the
  full money breakdown (subtotal/discount/delivery/tax/total/commission) + the
  applied voucher, **without persisting**. `place()` now calls `quote()` then
  persists, so a preview is guaranteed to match the real charge. A
  `strictVoucher` flag controls whether an invalid voucher throws (placement)
  or is surfaced in `voucher_error` while pricing continues (preview).
- **`POST /checkout/quote`** (`CheckoutController`, auth) — prices the current
  cart (variant/add-on aware) and applies a voucher leniently: an invalid code
  returns the base totals plus a `voucher_error` rather than failing, so the
  cart never blanks out. Returns `subtotal/discount/delivery_charge/tax/total`,
  `voucher`, `voucher_error`, and the priced `lines`.
- The menu API (`GET /vendors/{id}/menu`) already eager-loads and exposes each
  item's `variants` + `addons`; `StoreOrderRequest` already accepts
  `variant_id` / `addon_ids` per line and `voucher_code`.
- `CheckoutQuoteTest` — 4 tests (totals incl. delivery, valid voucher applied,
  invalid voucher reported without failing, variant + add-on pricing).

## Web (`foodzoneweb/`)
- **Cart store** now keys lines by item + variant + add-on combination
  (`CartLine.key`, `unitPrice`, `label`); distinct customizations are distinct
  lines. (`persist` version bumped to drop old-shape carts.)
- **`ItemCustomizeDialog`** — variant radios + add-on checkboxes with a live
  unit price; customizable items show **Choose** (opens the dialog) instead of
  **Add**.
- **Cart panel** renders each line's customization label, has a **promo code**
  input + Apply/Remove, shows the applied discount, and uses the authoritative
  `useCheckoutQuote` total once a voucher is applied (re-runs as the cart
  changes). Placement sends `variant_id`/`addon_ids` per line and the
  `voucher_code` only when the server confirmed it.

## Mobile (`FoodZoneApp/`)
- Cart store mirrored (keyed lines + `remove`).
- **`CustomizeSheet`** — bottom-sheet variant/add-on picker with live price;
  customizable items show **Choose**, plain items keep the inline stepper.
- **`CartReviewModal`** — a proper cart review sheet (line steppers + remove,
  promo code input with live quote, totals, delivery address, place order). The
  menu screen's bottom bar now opens this review instead of placing directly.
- `useCheckoutQuote` hook added; `PlaceOrderInput` carries
  `variant_id`/`addon_ids`/`voucher_code`.

## Key files
- Backend: `app/Services/OrderService.php` (extracted `quote()`),
  `app/Http/Controllers/Api/V1/CheckoutController.php`, `routes/api.php`,
  `tests/Feature/CheckoutQuoteTest.php`
- Web: `lib/cart-store.ts`, `components/vendors/ItemCustomizeDialog.tsx`,
  `lib/hooks/use-orders.ts` (`useCheckoutQuote`, `PlaceOrderItem`),
  `app/(app)/vendors/[id]/page.tsx`
- Mobile: `src/lib/cart-store.ts`, `src/components/customize-sheet.tsx`,
  `src/components/cart-review-modal.tsx`, `src/lib/hooks.ts`, `src/lib/types.ts`,
  `src/app/vendor/[id].tsx`

## Verification
Backend **116 tests passing** (4 new; `OrderTest` still green, confirming the
`place()`/`quote()` refactor is behaviour-preserving). Web `build` + `lint`
clean. Mobile `tsc` + `expo lint` clean and `expo export` bundles iOS + Android
+ web (24 routes). `POST /checkout/quote` registered. The quote endpoint is the
single pricing source of truth shared with order placement.
