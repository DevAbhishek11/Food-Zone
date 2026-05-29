# Workphase 34 — Notifications & Onboarding Polish

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done · **v3.0 roadmap**

## Goal
Turn the inbox from "infinite scroll list of mixed events" into a grouped,
typed, controllable experience — and give brand-new customers a four-step
guided onboarding before they hit the feed.

## Schema reality check
The `notifications` table already exists (since P1) with `type` as a free
string (no enum). Two things were missing and added in
`2026_05_29_000001_notifications_v3_and_onboarding`:
- `users.onboarding_completed` (boolean, default `false`, after `status`).
- `notification_preferences` (`user_id`, `type`, `channel`, `enabled`,
  unique `[user_id, type, channel]`) — sparse storage: a missing row means
  *enabled by default*.

`user_profiles.food_preferences` / `dietary_restrictions` (JSON) already
existed, so the wizard just writes into them.

## Backend (`FoodZoneServer/`)
- `NotificationController::index` — gains `?grouped=1` mode that returns
  `{today, this_week, earlier}` (one bucket each, up to 100 rows total, no
  pagination). Also accepts `?type=` to filter by a notification type.
- `NotificationController::preferences` — `GET /notifications/preferences`
  returns a defaulted matrix (`{type => {push,email,in_app}}`); every cell
  is `true` unless an explicit override row says otherwise.
- `NotificationController::savePreferences` — `POST` accepts
  `{preferences: [{type, channel, enabled}]}`, upserts each, re-returns the
  matrix. Validates `type` against `NotificationPreference::TYPES` and
  `channel` against `NotificationPreference::CHANNELS`.
- New notification types are recognised (model constants): `story_mention`,
  `post_tagged`, `vendor_offer`, `flash_deal` (in addition to the existing
  `like`/`comment`/`follow`/`mention`/`order_status`/`system`).
- `OnboardingController::complete` — `POST /onboarding/complete`
  `{food_preferences?, dietary_restrictions?, location?, follow_user_ids?}`.
  Inside a transaction: upserts the `user_profiles` row, creates `Follow`
  rows (`firstOrCreate`, status=`accepted`, never self-follow), then flips
  `users.onboarding_completed = true`.
- `OnboardingController::skip` — `POST /onboarding/skip` just flips the flag.
- `UserResource` now exposes `onboarding_completed` so `/auth/me` and login
  responses can drive client-side gating.
- Route ordering: `notifications/preferences` registered **before**
  `notifications/{notification}` to avoid the `{notification}` param
  swallowing the literal segment.
- `NotificationsV3Test` (9): grouped buckets, type filter, default matrix,
  save updates row, save upserts existing, validation rejects unknown
  type/channel, onboarding persists + flips, skip just flips, `/auth/me`
  exposes the flag → **201 tests**.

## Web (`foodzoneweb/`)
- `/notifications` rewritten to use `useGroupedNotifications`. Groups render
  as `Today` / `This week` / `Earlier` sections with per-type icons
  (`Heart`, `MessageCircle`, `AtSign`, `UserPlus`, `Receipt`, `Tag`,
  `Store`, `Flame`, `Sparkles`). Inline action buttons appear when the
  notification carries the right payload (e.g. `data.order_id` → "Track
  order", `data.post_id` → "View post", `data.actor.username` → "Follow
  back", `data.vendor_slug` → "View offer"). Hover marks unread items as
  read (the blue dot fades on the same hover via `group-hover:opacity-0`).
- `/notifications/preferences` — matrix table (rows = types, columns =
  push/email/in-app, checkboxes). Sparse-overrides pattern (only changed
  cells are saved); the React Compiler `set-state-in-effect` rule is
  satisfied by computing `merged = data + changes` at render time instead
  of mirroring `data` into local state via `useEffect`.
- `/onboarding` — 4-step wizard: cuisines (need ≥3 to continue), dietary
  restrictions, location (manual or `navigator.geolocation`), suggested
  follows (reuses `/explore` `suggested_users`). Progress dots, Back/
  Continue/Skip controls, redirects authenticated users with the flag
  already set straight to `/feed`.
- `redirectAfterLogin(role, onboardingCompleted)` — customers without the
  flag get routed to `/onboarding` after login/register.
- Web pages 37 → 39 (+`/notifications/preferences`, +`/onboarding`).

## Mobile (`FoodZoneApp/`)
- `(tabs)/inbox.tsx` rewritten to use `useGroupedNotifications` — `Today`/
  `This week`/`Earlier` sections; per-type Ionicons (`heart`, `chatbubble`,
  `at`, `pricetag`, `storefront`, `flame`, `sparkles`, `receipt`, …);
  pressing a row routes by payload (`post_id` → `/post/[id]`, `order_id` →
  `/orders`, `actor.username` → `/u/[username]`).
- `src/app/onboarding.tsx` — 4-step screen mirroring web: chip selectors
  for cuisine / dietary restrictions, manual + `expo-location` city,
  follow row from `/explore` suggestions. Progress pills at top.
- `_layout.tsx` — `useAuthRedirect` now also forces customers with
  `onboarding_completed === false` to `/onboarding` (won't fight the auth
  redirect because the check is segment-aware).
- Mobile routes 28 → 30 (+`onboarding`, the inbox refactor stays at the
  existing route).

## Dependencies
None added — `expo-location` already shipped in P33.

## Key files
- Backend: `app/Models/NotificationPreference.php`,
  `app/Http/Controllers/Api/V1/{NotificationController,OnboardingController}.php`,
  `app/Http/Resources/UserResource.php`, `app/Models/User.php`,
  `database/migrations/2026_05_29_000001_notifications_v3_and_onboarding.php`,
  `routes/api.php`, `tests/Feature/NotificationsV3Test.php`
- Web: `app/(app)/notifications/page.tsx`,
  `app/(app)/notifications/preferences/page.tsx`,
  `app/(app)/onboarding/page.tsx`, `lib/hooks/use-notifications.ts`,
  `lib/redirect.ts`, `lib/types.ts`,
  `app/login/page.tsx`, `app/register/page.tsx`
- Mobile: `src/app/(tabs)/inbox.tsx`, `src/app/onboarding.tsx`,
  `src/app/_layout.tsx`, `src/lib/hooks.ts`, `src/lib/types.ts`

## Verification
Backend **201 tests passing** (9 new). Web `build` + `lint` clean — 39
pages. Mobile `tsc` + `expo lint` + `expo export` clean (30 routes,
iOS+Android+web bundles).
