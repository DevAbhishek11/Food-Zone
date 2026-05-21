# Workphase 6 — User Profiles & Following

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done

## Goal
Make the social side feel complete: view any user's profile, see their posts, and
follow/unfollow from that profile on both clients.

## Backend (`FoodZoneServer/`)
- New **`GET /users/{username}/posts`** — a user's posts, privacy-aware relative to
  the viewer (public to all; followers-only to followers; everything to self/admin;
  blocked → 404). Uses optional auth and powers `liked_by_me`.
- Existing endpoints reused: `GET /users/{username}` (profile + `is_following` /
  `is_blocked` / `follows_me`), `POST|DELETE /users/{id}/follow`.
- 2 new tests in `SocialTest` (profile relationship flags; posts-visibility by viewer).

## Web (`foodzoneweb/`)
- New route **`/u/[username]`** — profile header (avatar, name, bio, stats), a
  Follow/Following/Request button (hidden for self), and the user's posts (reusing
  `PostCard`).
- `PostCard` authors now **link** to `/u/{username}`.
- Hooks: `lib/hooks/use-users.ts` (`useUserProfile`, `useUserPosts`, `useToggleFollow`).

## Mobile (`FoodZoneApp/`)
- New stack screen **`user/[username]`** with the same profile + follow + posts.
- `PostCard` authors are **tappable** → `/user/{username}`.
- Hooks added to `src/lib/hooks.ts`; route registered in root `_layout.tsx`.

## Key files
- Backend: `app/Http/Controllers/Api/V1/UserController.php` (`posts`), `routes/api.php`,
  `tests/Feature/SocialTest.php`
- Web: `app/(app)/u/[username]/page.tsx`, `lib/hooks/use-users.ts`, `components/feed/PostCard.tsx`
- Mobile: `src/app/user/[username].tsx`, `src/lib/hooks.ts`, `src/components/post-card.tsx`,
  `src/app/_layout.tsx`

## Verification
Backend **49 tests passing**; web build clean (`/u/[username]` route); mobile
typecheck + lint + bundle clean (16 routes incl. `/user/[username]`). Live: following
flipped `is_following` to `true` and the posts endpoint returned the user's public posts.
