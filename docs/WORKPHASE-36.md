# Workphase 36 — Advanced Features

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done · **v3.0 roadmap (final phase)**

## Goal
Close out the v3.0 enhancement roadmap with a small, well-scoped set of
"competitive edge" features: a loyalty + badges system, a global
leaderboard, a public flash-deals listing, and consolidated **Settings**
pages on both clients.

Scope decisions: video reviews and happy-hours are deferred (storage tier
+ schema cost not justified at current scale); flash-deal *creation* UI
remains a P31 carry-over; collaborative orders / 2FA / theme switcher
remain TBD. What ships covers the items with the clearest user value and
zero ambiguity in implementation.

## Schema reality check
- `flash_deals` already existed (P31 vendor dashboard v3) — only the
  public read endpoint is new.
- **No** `user_loyalty`, `loyalty_transactions`, `badges`, or
  `user_badges` tables existed. All four are added in
  `2026_05_29_000003_loyalty_and_badges`.
- `order_ratings` is unchanged — review helpfulness / video reviews would
  require column additions and are out of scope.

## Backend (`FoodZoneServer/`)
- Migration adds:
  - `user_loyalty (user_id PK, points, lifetime_points, tier)` — one row per
    user, created lazily on first earn.
  - `loyalty_transactions (user_id, amount, reason, order_id?)` —
    audit log. Uniqueness via the (`user_id`, `reason='order'`, `order_id`)
    triple serves as a dedup key.
  - `badges (key, name, description, icon, threshold)` — seeded by
    `BadgesSeeder` with `first_order` / `order_century` /
    `social_butterfly` / `food_explorer`.
  - `user_badges (user_id, badge_id, awarded_at)` unique.
- `LoyaltyService`:
  - `awardForDelivery(Order)` — idempotent. Earns 1 pt per ₹10 of
    `order.total`. Adds a 50-pt first-order bonus on the user's first
    `reason='order'` transaction. Promotes tier from the static map
    `bronze 0 / silver 500 / gold 2000 / platinum 5000` based on
    `lifetime_points`. Calls `checkBadges` at the end.
  - `checkBadges(User)` — counts orders / followers / distinct vendors
    once each and creates any missing `user_badges` rows whose threshold
    is met. Cheap to call on hot paths.
- `OrderController::applyStatus` now calls `LoyaltyService::awardForDelivery`
  when an order transitions to `delivered`.
- `LoyaltyController`:
  - `GET /me/loyalty` — `{points, lifetime_points, tier, next_tier,
    badges[], recent_transactions[]}`. Each badge carries an `unlocked`
    flag so the UI can render locked/unlocked side-by-side.
  - `GET /leaderboard?type=points|orders|reviews` — top-50, joins users
    on the relevant aggregate (sum of `lifetime_points`, count of
    delivered orders, count of order ratings).
- `FlashDealsController::index` — `GET /flash-deals` returns active
  deals (`FlashDeal::active`) sorted by ascending `ends_at`, decorated
  with the item snapshot + computed `deal_price` and
  `seconds_remaining`.
- `LoyaltyAndFlashDealsTest` (8) → **212 tests**.

## Web (`foodzoneweb/`)
- **`/settings`** — sectioned navigation hub (Account, Privacy,
  Notifications, Loyalty, About) wiring real endpoints; a Danger Zone
  card with a two-tap deactivate flow (`POST /profile/deactivate`).
- **`/leaderboard`** — tabbed Points/Orders/Reviews, top-3 get crown +
  medal icons, all entries link to `/u/{username}`.
- Loyalty hooks: `useLoyalty`, `useLeaderboard` in
  `lib/hooks/use-loyalty.ts`.
- `/profile` gains a **LoyaltyCard** (tier ring, points, progress bar to
  next tier, earned-badges chip row) and a Settings nav row.
- Web pages 39 → 43 (+`/settings`, +`/leaderboard`, +/notifications/preferences
  and /onboarding which were P34 — staying at 43).

## Mobile (`FoodZoneApp/`)
- `(tabs)/profile.tsx` gains the **LoyaltyCard** component above
  `DetailsEditor` and a Settings button. Same tier-tint logic as web.
- `src/app/settings.tsx` — sectioned screen mirroring web (Account /
  Notifications / Loyalty / About) using `Linking.openURL` for external
  links and the same two-tap deactivate flow.
- `src/app/leaderboard.tsx` — FlashList with the same tabs + top-3
  medal icons.
- Both screens registered as `presentation: 'card'` in `_layout.tsx`.
- Mobile routes 30 → 32.

## Dependencies
None added.

## Key files
- Backend:
  `database/migrations/2026_05_29_000003_loyalty_and_badges.php`,
  `database/seeders/BadgesSeeder.php`, `database/seeders/DatabaseSeeder.php`,
  `app/Models/{UserLoyalty,LoyaltyTransaction,Badge,UserBadge}.php`,
  `app/Services/LoyaltyService.php`,
  `app/Http/Controllers/Api/V1/{LoyaltyController,FlashDealsController,OrderController}.php`,
  `routes/api.php`, `tests/Feature/LoyaltyAndFlashDealsTest.php`
- Web: `app/(app)/settings/page.tsx`, `app/(app)/leaderboard/page.tsx`,
  `app/(app)/profile/page.tsx`, `lib/hooks/use-loyalty.ts`,
  `lib/hooks/use-profile.ts`
- Mobile: `src/app/settings.tsx`, `src/app/leaderboard.tsx`,
  `src/app/(tabs)/profile.tsx`, `src/app/_layout.tsx`,
  `src/lib/hooks.ts`

## Verification
Backend **212 tests passing** (8 new). Web `build` + `lint` clean — 43
pages. Mobile `tsc` + `expo lint` + `expo export` clean (32 routes,
iOS+Android+web bundles).

## v3.0 roadmap status
**Complete.** P25 → P36 all shipped across the three codebases.
