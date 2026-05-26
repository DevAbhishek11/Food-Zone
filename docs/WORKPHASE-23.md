# Workphase 23 — Push notifications + Email-verification UX

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done

## Goal
1. **Push notifications** — deliver in-app notifications to mobile devices via
   Expo (which fans out to FCM/APNs), reusing the single `NotificationService`
   chokepoint so every existing notification type pushes for free.
2. **Email-verification UX** — surface the existing verify-email API on both
   clients: a web verify page that consumes the emailed link, and a "resend
   verification" action for unverified users on both clients.

## Backend (`FoodZoneServer/`)
- **`push_tokens`** table (user_id, unique `token`, `platform`) + `PushToken`
  model + `User::pushTokens()`.
- **`POST /push-tokens`** (upsert a device token onto the current user — handles
  a device reused across accounts) and **`DELETE /push-tokens`** (unregister).
- **`SendPushNotification`** queued job — loads the user's tokens and POSTs a
  batch to the Expo push endpoint (optional `EXPO_ACCESS_TOKEN`); no-ops when
  push is disabled or there are no tokens, and swallows/logs transport errors.
- `NotificationService::notify()` dispatches the job **only when**
  `config('push.enabled')` is true — so dev/tests never call Expo.
- `config/push.php` (`PUSH_ENABLED` default **false**, Expo endpoint/token);
  `.env.example` documents production values.
- `PushNotificationTest` — 5 tests (register, token reassignment/upsert,
  unregister, notify dispatches the push job when enabled, and does **not** when
  disabled).
- Email verification needed no backend change — `POST /auth/verify-email`
  (token+email) and `POST /auth/resend-verification` already exist.

## Web (`foodzoneweb/`)
- **`/verify-email`** — a public page that reads `token`/`email` from the emailed
  link, calls `/auth/verify-email`, and shows verifying / success / error states
  (Suspense-wrapped per Next 16's `useSearchParams` requirement; initial state
  derived at render to satisfy the `set-state-in-effect` lint rule).
- Profile page: a **Resend verification email** action beside the "Unverified"
  badge (`POST /auth/resend-verification`).

## Mobile (`FoodZoneApp/`)
- Installed `expo-notifications` (SDK-55 pinned) + added the config plugin.
- `src/lib/use-push.ts` — sets the SDK-55 foreground handler
  (`shouldShowBanner`/`shouldShowList`), creates the Android channel, requests
  permission, fetches the Expo push token (with `projectId`), and registers it
  via `POST /push-tokens`. **Guarded**: skips on web, simulators, Expo Go
  (Android, SDK 53+), or when no EAS `projectId` is configured — all
  non-fatal — so the bundle is clean everywhere. Mounted in the root navigator,
  fires once authenticated.
- Profile: a **Resend** action beside an "Unverified" label.

## Scope note
Web push (service workers / VAPID) is out of scope — the web already gets
real-time updates via Reverb (P17) + polling. Push here is the Expo/mobile path.

## Key files
- Backend: `database/migrations/..._create_push_tokens_table.php`,
  `app/Models/PushToken.php`, `app/Jobs/SendPushNotification.php`,
  `app/Http/Controllers/Api/V1/PushTokenController.php`, `config/push.php`,
  `app/Services/NotificationService.php`, `app/Models/User.php`, `routes/api.php`,
  `tests/Feature/PushNotificationTest.php`, `.env.example`
- Web: `app/verify-email/page.tsx`, `app/(app)/profile/page.tsx`
- Mobile: `src/lib/use-push.ts`, `src/app/_layout.tsx`, `src/app/(tabs)/profile.tsx`,
  `app.json`, `package.json` (+`expo-notifications`)

## Verification
Backend **130 tests passing** (5 new). Web `build` + `lint` clean
(`/verify-email`). Mobile `tsc` + `expo lint` clean and `expo export` bundles
iOS + Android + web (27 routes). `push-tokens` routes registered. Real Expo
delivery requires `PUSH_ENABLED=true` + a development build with an EAS project
(same sandbox caveat as the other infra phases).
