# Workphase 19 — Payments (Razorpay / Stripe)

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done

## Goal
Charge for online (non-COD) orders through a pluggable payment gateway:
create a payment intent, confirm it (via the gateway's webhook), and refund it
on cancellation. A built-in **mock** gateway makes the whole
intent → confirm → refund flow runnable in development and tests with no
external service; **Razorpay** and **Stripe** drivers talk to the real REST
APIs (no SDK dependency) and activate via env.

## Backend (`FoodZoneServer/`)
- **Gateway abstraction** — `App\Contracts\PaymentGateway` (`name`,
  `createIntent`, `verifyWebhook`, `refund`); drivers in `app/Services/Payments/`:
  - `MockPaymentGateway` — generates fake intent ids; verifies webhooks with an
    HMAC of the raw body + `payments.webhook_secret`. Default driver.
  - `RazorpayPaymentGateway` — `POST /v1/orders` (amount in paise, basic auth),
    `X-Razorpay-Signature` HMAC webhook verification, `POST /payments/{id}/refund`.
  - `StripePaymentGateway` — `POST /v1/payment_intents` (amount in cents, bearer
    auth, returns `client_secret`), `Stripe-Signature` (`t=…,v1=…`) verification,
    `POST /v1/refunds`.
  - Resolved by `config('payments.gateway')` in `AppServiceProvider::register()`
    (singleton). Default **mock**.
- **Schema/model** — `payments` table (order_id, user_id, gateway, amount,
  currency, status `created|paid|failed|refunded`, intent_id, reference, meta) +
  `Payment` model; `Order::payments()` relation.
- **Endpoints**
  - `POST /orders/{order}/pay` (auth, owner) — creates a `Payment` (status
    `created`) + a gateway intent for an online, unpaid, non-terminal order.
    Rejects COD (422), already-paid (422), others' orders (403).
  - `POST /payments/{payment}/confirm` (auth, owner) — **mock-only** helper that
    marks the payment paid without a real callback (real gateways confirm via
    webhook). Returns 422 under a real gateway.
  - `POST /payments/webhook` (**public**, signature-verified) — verifies the
    signature for the active gateway, finds the payment by `intent_id`
    (generic shape + best-effort Razorpay/Stripe event mapping), marks it paid.
    Idempotent (duplicate deliveries are no-ops). Bad signature → 401.
  - On paid, the order's `payment_status` → `paid` and the vendor gets an
    `order_paid` notification.
- **Refund** — cancelling a paid order calls `gateway->refund()` (best-effort,
  logged on failure) and marks the `Payment` + order `refunded`.
- `OrderResource` gains a `payable` flag (online + unpaid + non-terminal) that
  drives the clients' "Pay now" affordance.
- `PaymentTest` — 7 tests: create intent, reject COD, reject others' orders,
  confirm→paid+notify, webhook valid-signature→paid, webhook bad-signature→401,
  cancel-paid→refund.

## Web (`foodzoneweb/`)
- `usePayOrder()` (`lib/hooks/use-orders.ts`): `POST /orders/{id}/pay`, then for
  the mock gateway `POST /payments/{payment_id}/confirm`; real gateways would
  hand the intent to their checkout SDK. `Order.payable` added to types.
- Orders page (`/orders`): a payment row on online orders shows **Paid online /
  Awaiting payment / Refunded** plus a **Pay {total}** button when `payable`.

## Mobile (`FoodZoneApp/`)
- `usePayOrder()` mirrored in `src/lib/hooks.ts`; `Order.payable` added.
- Orders tab (`(tabs)/orders.tsx`): payment status line + **Pay** button on
  unpaid online orders, with success/error `Alert`s.
- Installed `@react-native-community/netinfo` (SDK-55 pinned) — the documented
  companion for `pusher-js` on React Native; this also fixes native bundling of
  the P17 Reverb/Echo client so `expo export` now bundles iOS + Android + web.

## Configuration (`.env`)
`PAYMENT_GATEWAY=mock` (default) · `PAYMENT_CURRENCY` · `PAYMENT_SIGNATURE_HEADER`
· `PAYMENT_WEBHOOK_SECRET` · `RAZORPAY_KEY/SECRET/WEBHOOK_SECRET` ·
`STRIPE_KEY/SECRET/WEBHOOK_SECRET`. Point the gateway dashboard webhook at
`POST /api/v1/payments/webhook` and set the signature header to match.

## Key files
- Backend: `app/Contracts/PaymentGateway.php`,
  `app/Services/Payments/{Mock,Razorpay,Stripe}PaymentGateway.php`,
  `app/Models/Payment.php`, `app/Http/Controllers/Api/V1/PaymentController.php`,
  `app/Http/Resources/PaymentResource.php`,
  `database/migrations/2026_05_26_000001_create_payments_table.php`,
  `config/payments.php`, `app/Providers/AppServiceProvider.php`,
  `app/Http/Controllers/Api/V1/OrderController.php` (refund on cancel),
  `routes/api.php`, `tests/Feature/PaymentTest.php`
- Web: `lib/hooks/use-orders.ts`, `lib/types.ts`, `app/(app)/orders/page.tsx`
- Mobile: `src/lib/hooks.ts`, `src/lib/types.ts`, `src/app/(tabs)/orders.tsx`,
  `package.json` (+`@react-native-community/netinfo`)

## Verification
Backend **112 tests passing** (7 new). Web `build` + `lint` clean. Mobile `tsc`
+ `expo lint` clean and `expo export` now bundles **all platforms** (iOS +
Android + web, 24 routes). Runtime smoke: webhook bad-signature → 401, `pay`
without auth → 401, all three payment routes registered. The mock gateway
exercises the full flow end-to-end; real Razorpay/Stripe HTTP + signed webhooks
are implemented at the code level and verified by signature tests — live gateway
runtime needs credentials (same caveat as the P15–P17 infra phases).
