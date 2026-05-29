# Workphase 35 — Performance

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done · **v3.0 roadmap**

## Goal
Tighten the parts of the system that got slower as P25–P34 layered more
features on top of the same tables and pages: hot DB scans, expensive
read-only endpoints, and large client bundles.

## Schema check
The base schema already has good index coverage from P1. Only five
composite indexes were genuinely missing for hot query paths added by
P33/P34. They live in
`2026_05_29_000002_performance_indexes` and nothing else changes.

## Backend (`FoodZoneServer/`)
### Composite indexes (5)
- `orders(vendor_id, created_at)` — trending vendors (P33) + admin/vendor
  revenue windows.
- `orders(user_id, created_at)` — paginated order history sorted by
  recency for `/orders`.
- `notifications(user_id, created_at)` — the grouped-notifications query
  added in P34 sorts by recency within a user's bucket.
- `follows(follower_id, status)` — "who am I following" walks for feed
  composition and suggested-users.
- `post_comments(post_id, created_at)` — paginated comment scroll.

The existing `(user_id, read_at)` index on notifications stays — it
covers the unread-count query path.

### Caching (2 new keys)
- `vendor:{id}:menu` (60 s) wraps the expensive
  `GET /vendors/{idOrSlug}/menu` payload (categories + items + variants +
  addons + popular ids). The vendor-attached transient fields
  (`has_offer`, `opens_at`, delivery estimates) stay out of the cache
  because they depend on the request time. TTL is kept short
  (60 s) so menu edits show up fast without bookkeeping invalidation.
- `explore:shared` (60 s) wraps the three globally-shared sections of
  `GET /explore`: `trending_vendors`, `trending_hashtags`, `trending_items`.
  Per-viewer sections (`trending_posts`, `suggested_users`,
  `nearby_vendors`) are computed every request because they depend on the
  caller / coords.

Pre-existing caches retained: `admin:analytics:{days}`,
`vendor:{id}:analytics:{days}`, health checks.

### Tests
`PerformanceCacheTest` (3): explore shared cache is hot then stale until
`Cache::forget`, vendor menu cache survives a behind-the-scenes DB edit,
the five new indexes are present after migrations run → **204 tests**.

## Web (`foodzoneweb/`)
- `components/admin/Charts.tsx` (Recharts: ~100 KB of D3 internals on the
  initial JS) is no longer a static import on `/admin` or `/vendor`.
  Both pages now use `next/dynamic({ ssr: false, loading: Skeleton })`
  per-chart, so the bundles split and the charts render after the
  dashboard shell. Skeleton-of-the-right-height keeps layout stable.

## Mobile (`FoodZoneApp/`)
- Migrated four high-traffic lists from `FlatList` to `FlashList` v2
  (matches the P33 cadence — never pass `estimatedItemSize`):
  - `(tabs)/vendors.tsx` — paginated vendor list
  - `(tabs)/orders.tsx` — paginated order history
  - `messages/index.tsx` — conversation list (per-row long-press handler
    kept)
  - `search.tsx` — three `FlashList`s (People / Food / Posts result tabs)
- FlashList v2 doesn't support the `gap` prop in
  `contentContainerStyle`; replaced with `marginBottom` on the rendered
  row wrappers.
- Lists left as `FlatList` (small/short, no expected scrolling cost):
  addresses, post detail comments, manage screens, deliver, post detail,
  user profile, admin index.

## Key files
- Backend: `database/migrations/2026_05_29_000002_performance_indexes.php`,
  `app/Http/Controllers/Api/V1/{ExploreController,VendorController}.php`,
  `tests/Feature/PerformanceCacheTest.php`
- Web: `app/(app)/admin/page.tsx`, `app/(app)/vendor/page.tsx`
- Mobile: `src/app/(tabs)/{vendors,orders}.tsx`,
  `src/app/messages/index.tsx`, `src/app/search.tsx`

## Verification
Backend **204 tests passing** (3 new). Web `build` + `lint` clean (still
39 pages — no route changes). Mobile `tsc` + `expo lint` + `expo export`
clean (still 30 routes).
