# Workphase 28 — Profile Experience

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done · **v3.0 roadmap**

## Goal
Rich, trust-building profiles: cover photo, verified badge, location/website,
mutual followers, top food hashtags, and content tabs (posts / food journey /
tagged-in / saved-for-self) — plus profile editing for those fields.

## Schema reality check
Confirmed: `user_profiles` had `bio/avatar/cover/website/is_private` etc. but
**no `location`**, `users` had **no `is_verified`**, and there was **no
`story_highlights` table**. Migration adds those three.

## Backend (`FoodZoneServer/`)
- Migration `extend_profile_and_highlights`: `users.is_verified` (bool index),
  `user_profiles.location` (string 100), and a new `story_highlights` table
  (user_id, name, cover_url, story_ids JSON).
- `UserResource` gains `is_verified`; `UserProfileResource` gains `location`.
- **`GET /users/{username}`** now includes `member_since` (formatted),
  `top_food_tags` (top 5 hashtags from the user's public posts), and
  `mutual_followers` (up to 3, viewer-specific).
- **`GET /users/{username}/food-journey`** — own posts with a vendor or item tag.
- **`GET /users/{username}/tagged-in`** — public posts that `@mention` the user.
- **`GET /users/{username}/highlights`** + `POST/DELETE /story-highlights` —
  user-managed highlights pulled from their own stories (server validates
  ownership).
- `ProfileController@update` accepts `location` (was: name/username/bio/website/
  avatar/cover/is_private/food_preferences/dietary_restrictions).
- `ProfileExperienceTest` (8) → **154 tests** total — hits the v3.0 ≥150 goal.

## Web (`foodzoneweb/`)
- **`/u/[username]` rebuild** — cover banner (image or brand gradient fallback),
  avatar overlapping the cover, verified badge inline, bio, location/website/
  member-since row, top food-tag chips (linked to `/hashtag/{tag}`), a "Followed
  by …" mutual-followers callout, and a tab strip: **Posts / Food journey /
  Tagged / Saved** (Saved shows only on own profile). For self the action button
  is "Edit profile" → `/profile`; for others Message + Follow/Following.
- **`/profile`** gets an inline **About you** editor — bio, location, website,
  private-account toggle — via `useUpdateProfile`.
- Hooks `useUserFoodJourney`, `useUserTaggedIn`; types extend `User`
  (`is_verified`, `member_since`, `top_food_tags`, `mutual_followers`) and
  `UserProfile.location`.

## Mobile (`FoodZoneApp/`)
- **Profile tab** — cover banner above the profile card (image when set, brand
  tint otherwise), `is_verified` shield badge alongside the existing email-verified
  check, plus a new **About you** inline editor (bio / location / website / a
  Switch for private account) backed by the extended `useUpdateProfile`.
- Types mirrored: `UserProfile.location`, `User.is_verified`.

## Scope note
Story-highlights backend is complete; surfacing them on the web profile and a
"create highlight from past stories" UI are deferred to a later UI pass (the
endpoints + tests + own-only delete already work). User-reports also deferred
to P32 (Admin v3 — content moderation).

## Key files
- Backend: `database/migrations/..._extend_profile_and_highlights.php`,
  `app/Models/StoryHighlight.php`, `app/Http/Resources/{UserResource,UserProfileResource}.php`,
  `app/Http/Controllers/Api/V1/{UserController,ProfileController,StoryHighlightController}.php`,
  `routes/api.php`, `tests/Feature/ProfileExperienceTest.php`
- Web: `app/(app)/u/[username]/page.tsx`, `app/(app)/profile/page.tsx`,
  `lib/hooks/{use-users,use-profile}.ts`, `lib/types.ts`
- Mobile: `src/app/(tabs)/profile.tsx`, `src/lib/{hooks,types}.ts`

## Verification
Backend **154 tests passing** (8 new). Web `build` + `lint` clean (31 pages).
Mobile `tsc` + `expo lint` clean and `expo export` bundles iOS + Android + web
(27 routes). New routes registered: `food-journey`, `tagged-in`, `highlights`,
`story-highlights` POST/DELETE.
