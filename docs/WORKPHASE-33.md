# Workphase 33 — Explore & Discovery

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done · **v3.0 roadmap**

## Goal
Turn the legacy `/explore` (a plain list of recent public posts) into a
curated discovery hub — six algorithmically-built sections, an OpenStreetMap
view, and matching UI on web (`/explore`) and mobile (Explore tab).

## Schema reality check
No new tables. P33 rides on what already exists:
`posts.{likes_count, comments_count, shares_count}` (denormalised in P1),
`follows`, `post_shares` (P27), `vendors.{lat, lng, orders_count,
is_featured}`, `orders`. Hashtags continue to be extracted at request time
from post bodies via regex (no `hashtags` table exists — the build-plan memory
that claimed otherwise was aspirational).

## Backend (`FoodZoneServer/`)
- **`ExploreController::index`** — `GET /explore` returns a curated payload:
  - `trending_posts` — public posts in the last 6 h ordered by
    `(likes + comments*2 + shares*3) DESC`, then `created_at DESC` (12 rows).
  - `trending_vendors` — most-ordered vendors in the last 24 h with an
    `order_delta` (% change vs the prior 24-48 h window). Approved-only.
  - `trending_hashtags` — top-10 hashtags by `preg_match_all('/#(\w+)/u')`
    over the last 24 h of public post bodies (case-folded).
  - `trending_items` — top-10 menu items by `SUM(order_items.quantity)`
    over the last 24 h.
  - `suggested_users` — friends-of-friends: counts how many of the caller's
    `accepted` followees follow each candidate (excluding self / blocks /
    already-followed); falls back to `popular` (most followers) when the
    caller follows nobody. Anonymous callers get an empty array.
  - `nearby_vendors` — if `?lat` + `?lng` query params are present, runs a
    PHP-based Haversine (reusing the P30 helper pattern — never SQL trig so
    SQLite tests pass) and returns vendors within `radius` km (default 10,
    clamped 0.5-50).
- **`ExploreController::map`** — `GET /explore/map` — up to 500 approved
  vendors with coordinates for embedded map rendering.
- The previous `PostController::explore` method (route `/explore` → recent
  posts) is replaced; the method is no longer reachable. Discovery still
  has `posts/trending`, `hashtags/trending`, `items/trending`, `vendors/nearby`
  for callers that want a single section.
- `ExploreTest` (9) → **192 tests**.

## Web (`foodzoneweb/`)
- New `/explore` page (App Router, route group `(app)`) with:
  - Hero search bar with rotating placeholder (`Search restaurants…` /
    `Find food lovers…` / `Discover trending posts…`).
  - Category filter chips: **All / Food / People / Vendors / Hashtags**.
  - Sections (Netflix-style): Trending Now (grid), 🔥 Hot Restaurants Today
    (horizontal scroll w/ ±% delta badge), 📈 Trending Hashtags (chip cloud
    where font size scales with volume), 🍽 Most Ordered Today (item grid),
    👥 People You May Know (Follow button + mutual count), Near you (10 km
    radius, distance badge).
  - **Map view toggle** — dynamically-imported `<ExploreMap>` (SSR off, no
    window crashes during build) using `react-leaflet` + Leaflet + OpenStreetMap
    tiles. Markers render as inline SVG data URIs (no broken default-asset
    404s). Popups link to `/vendors/{slug}`.
- Geolocation: `navigator.geolocation.getCurrentPosition` on mount, sent
  to `/explore` as `?lat=&lng=&radius=10`. Permission denial gracefully
  hides the "Near you" section.
- `AppShell` gains an **Explore** sidebar/tab entry (Compass icon).
- Hook `useExplore(coords?)` + `useExploreMap()` in `lib/hooks/use-explore.ts`.

## Mobile (`FoodZoneApp/`)
- New `(tabs)/explore.tsx` (Compass tab inserted between Feed and Order):
  - Always-visible search bar at top.
  - Horizontal segmented control: **All / Restaurants / People / Hashtags**.
  - Trending posts use **FlashList v2 with `masonry` prop** (3-height
    rotation for visual interest) — no `estimatedItemSize` (banned in v2).
  - Vendor + people sections are horizontal `ScrollView` rows.
- Geolocation via `expo-location` (newly added: `expo-location@~55.1.10`,
  installed via `npx expo install`). Permission denied → nearby section
  silently omitted.

## Dependencies added
- Web: `leaflet@^1.9.4`, `react-leaflet@^5.0.0`, `@types/leaflet@^1.9.21`
- Mobile: `expo-location@~55.1.10`

## Key files
- Backend: `app/Http/Controllers/Api/V1/ExploreController.php`,
  `routes/api.php`, `tests/Feature/ExploreTest.php`
- Web: `app/(app)/explore/page.tsx`, `components/explore/ExploreMap.tsx`,
  `lib/hooks/use-explore.ts`, `components/AppShell.tsx`
- Mobile: `src/app/(tabs)/explore.tsx`, `src/app/(tabs)/_layout.tsx`,
  `src/lib/hooks.ts`

## Verification
Backend **192 tests passing** (9 new in `ExploreTest`). Web `build` + `lint`
clean — `/explore` registered. Mobile `tsc` + `expo lint` + `expo export`
clean on iOS / Android / web bundles.
