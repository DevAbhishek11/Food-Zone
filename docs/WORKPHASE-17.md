# Workphase 17 — Real-time via Laravel Reverb

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done

## Goal
Push live updates (new notifications, order-status changes) over WebSockets with
**Laravel Reverb**, replacing the 30s polling — while keeping polling as a graceful
fallback when realtime isn't configured.

## Backend (`FoodZoneServer/`)
- **`laravel/reverb`** installed; `config/broadcasting.php` with `reverb` (+ pusher/redis/
  log/null) connections, default `null` (dev `log`, prod `reverb`).
- **Broadcast events (`ShouldBroadcast`):**
  - `App\Events\NotificationCreated` → `private-user.{id}`, event `notification.created`;
    fired from `NotificationService` on every new notification.
  - `App\Events\OrderStatusUpdated` → `private-order.{id}` + `private-user.{customerId}`,
    event `order.status`; fired from order status changes and cancellation.
- **Channel auth** (`routes/channels.php`): `user.{id}` (self) and `order.{id}`
  (customer / owning vendor / admin). `AppServiceProvider` registers
  `Broadcast::routes(['middleware' => ['auth:sanctum']])` so the `/broadcasting/auth`
  endpoint works with token auth (no session).
- `.env.example` documents `BROADCAST_CONNECTION=reverb` + `REVERB_*` + the public client vars.
- `RealtimeTest` — 3 tests (like broadcasts `NotificationCreated`, status change broadcasts
  `OrderStatusUpdated`, events target the expected private channels).

## Web (`foodzoneweb/`)
- **`laravel-echo` + `pusher-js`** installed. `lib/echo.ts` builds an Echo (Reverb) client
  **only when `NEXT_PUBLIC_REVERB_KEY` is set and in the browser**, dynamically importing
  the libs so they never run during SSR/build; authenticates via Bearer token against
  `/broadcasting/auth`.
- `useRealtime(userId)` subscribes to the user's private channel and invalidates the
  `notifications` / `orders` queries on live events. Wired in `AppShell`. Polling remains
  the fallback when Reverb is unset.

## Mobile (`FoodZoneApp/`)
- Same `lib/echo.ts` (guarded by `EXPO_PUBLIC_REVERB_KEY`, dynamic import) + `useRealtime`
  hook, wired into the tabs layout.

## Sandbox caveat
Reverb's WebSocket server can't run here, so the realtime path is verified at the
**config/code/test level** (events dispatch to the right channels; clients build/bundle
with realtime guarded off). With env unset, both clients stay on polling — fully green.
Production: set `BROADCAST_CONNECTION=reverb` + `REVERB_*`, run `php artisan reverb:start`,
and set the `*_PUBLIC_REVERB_*` client vars.

## Key files
- Backend: `config/broadcasting.php`, `routes/channels.php`, `app/Providers/AppServiceProvider.php`,
  `app/Events/{NotificationCreated,OrderStatusUpdated}.php`, `app/Services/NotificationService.php`,
  `app/Http/Controllers/Api/V1/OrderController.php`, `tests/Feature/RealtimeTest.php`, `.env.example`
- Web: `lib/echo.ts`, `lib/hooks/use-realtime.ts`, `components/AppShell.tsx`
- Mobile: `src/lib/echo.ts`, `src/hooks/use-realtime.ts`, `src/app/(tabs)/_layout.tsx`

## Verification
Backend **100 tests passing** (incl. `RealtimeTest`); web build + lint clean; mobile tsc +
lint + export clean (Echo/Pusher dynamically imported, not evaluated without env).
