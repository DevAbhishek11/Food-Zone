# Workphase 9 — Search & Discovery

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done

## Goal
Global search across people, restaurants, and posts — usable by every persona,
implemented DB-backed (no Meilisearch dependency).

## Backend (`FoodZoneServer/`)
- New **`GET /search`** (optional auth):
  - `?q=term` → a combined bundle: top 5 each of `users`, `vendors`, `posts`.
  - `?q=term&type=users|vendors|posts` → a paginated single-type result set.
- Rules: min 2 chars (typed queries 422 below that); users match name/username and
  exclude blocked accounts; vendors are approved-only (match name/city/description);
  posts are public-only and exclude blocked authors. `LIKE` wildcards in user input
  are escaped.
- `SearchController` reuses `UserSummaryResource` / `VendorResource` / `PostResource`
  (so posts still carry `liked_by_me`).
- `SearchTest` — 6 tests (combined grouping, typed pagination, min-length 422,
  unapproved-vendor exclusion, public-only posts, blocked-user exclusion).

## Web (`foodzoneweb/`)
- `/search` page: debounced input + tabs **All / People / Restaurants / Posts**.
  "All" shows grouped previews with "See all" jumps; typed tabs paginate with Load more.
  People link to `/u/[username]`, restaurants reuse `VendorCard`, posts reuse `PostCard`.
- A search icon in the Feed header opens it.
- `lib/use-debounce.ts`, `lib/hooks/use-search.ts`.

## Mobile (`FoodZoneApp/`)
- `/search` screen: debounced search box + segmented tabs; "All" uses a `ScrollView`
  of capped sections, typed tabs use `FlatList` with infinite scroll. Rows navigate to
  `/user/[username]` and `/vendor/[id]`; posts reuse `PostCard`.
- A search icon in the Feed header opens it.
- `src/hooks/use-debounce.ts`, search hooks in `src/lib/hooks.ts`.

## Key files
- Backend: `app/Http/Controllers/Api/V1/SearchController.php`, `routes/api.php`,
  `tests/Feature/SearchTest.php`
- Web: `app/(app)/search/page.tsx`, `lib/hooks/use-search.ts`, `lib/use-debounce.ts`,
  `app/(app)/page.tsx` (header icon)
- Mobile: `src/app/search.tsx`, `src/lib/hooks.ts`, `src/hooks/use-debounce.ts`,
  `src/app/_layout.tsx`, `src/app/(tabs)/index.tsx` (header icon)

## Verification
Backend **65 tests passing**; web build + lint clean (`/search`); mobile tsc + lint +
export clean (20 routes incl. `/search`). Live: combined `?q=kitchen` returned 4
restaurants; typed vendor search paginated; a 1-char typed query returned **422**.
