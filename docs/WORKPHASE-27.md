# Workphase 27 — Feed & Post Experience

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done · **v3.0 roadmap**

## Goal
Make the social feed world-class: stories, saved posts, sharing, trending
hashtags, engagement-ranked discovery, and a richer post card. (Polls are
**deferred** — they need their own option/vote schema; tracked in backlog.)

## Schema reality check
The prompt assumed `stories`/`story_views`/`post_shares`/`saved_posts`/poll
tables existed — they did **not** (only `posts.shares_count`/`shared_post_id`/
`type` were present). So this phase **creates** `saved_posts`, `post_shares`,
`stories`, `story_views` (one migration) and defers polls.

## Backend (`FoodZoneServer/`)
- **Saved posts** — `POST/DELETE /posts/{id}/save`, `GET /saved`; `is_saved`
  flag on `PostResource` (via `withExists` in feed/saved/show).
- **Share** — `POST /posts/{id}/share` (idempotent per user via `post_shares`,
  bumps `shares_count`, notifies author); `GET /posts/{id}/shares` (sharers).
- **Liked-by** — `GET /posts/{id}/liked-by` (paginated likers).
- **Discovery** — `GET /feed/suggested` (public posts from non-followed users,
  engagement-ranked) and `GET /posts/trending?hours=N`; feed posts now carry a
  `source` field (`following` | `suggested`).
- **Hashtags** — `GET /hashtags/trending` (parses `#tags` from recent public
  bodies → top 10) and `GET /hashtags/{tag}/posts`.
- **Stories** — `GET /stories` (active, grouped by user, `has_unseen`),
  `POST /stories` (24h expiry), `DELETE /stories/{id}`, `POST /stories/{id}/view`,
  `GET /stories/{id}/views` (owner only). `Story`/`StoryView`/`SavedPost`/
  `PostShare` models; `StoryResource`.
- `FeedEngagementTest` (8) + `StoriesTest` (5) → **146 tests** total.

## Web (`foodzoneweb/`)
- **StoryBar** + full-screen **StoryViewer** (progress bars, auto-advance, tap
  zones, view-recording) + a story composer (ImageUpload + caption).
- **PostCard** rebuild — save (bookmark), share (copies link + records),
  "Suggested" source pill, and `#hashtag`/`@mention` linkification.
- **TrendingSidebar** (desktop right rail) — trending hashtags; feed is now a
  centered column + sidebar layout.
- **`/hashtag/[tag]`** page. Hooks: `use-stories`, `use-hashtags`, +
  `useToggleSave`/`useSharePost`/`useSaved`.

## Mobile (`FoodZoneApp/`)
- Installed `@shopify/flash-list` (v2) + `expo-haptics`.
- Feed now renders with **FlashList**; a horizontal **StoryBar** + viewer above
  it; story creation via the existing image picker.
- **PostCard** — double-tap-to-like with a heart-burst `Animated` overlay +
  light haptic, plus save (bookmark) and native share buttons; wrapped in `memo`.
- Hooks mirrored (`useStories`/`useCreateStory`/`useViewStory`/`useToggleSave`/
  `useSharePost`); `Post.is_saved`/`source` + `Story`/`StoryGroup` types.

## Key files
- Backend: `database/migrations/..._create_feed_engagement_tables.php`,
  `app/Models/{Story,StoryView,SavedPost,PostShare}.php`,
  `app/Http/Controllers/Api/V1/{PostController,HashtagController,StoryController}.php`,
  `app/Http/Resources/{PostResource,StoryResource}.php`, `routes/api.php`,
  `tests/Feature/{FeedEngagementTest,StoriesTest}.php`
- Web: `components/feed/{PostCard,StoryBar,TrendingSidebar}.tsx`,
  `lib/hooks/{use-feed,use-stories,use-hashtags}.ts`, `app/(app)/feed/page.tsx`,
  `app/(app)/hashtag/[tag]/page.tsx`, `lib/types.ts`
- Mobile: `src/components/{post-card,story-bar}.tsx`, `src/app/(tabs)/index.tsx`,
  `src/lib/{hooks,types}.ts`, `package.json` (+flash-list, +expo-haptics)

## Verification
Backend **146 tests passing** (13 new). Web `build` + `lint` clean (**31 pages**,
+`/hashtag/[tag]`). Mobile `tsc` + `expo lint` clean and `expo export` bundles
iOS + Android + web (27 routes). 15 feed/story/hashtag routes registered.

## Deferred
Polls (option/vote schema + composer + voting UI) and the prompt's
PostComposer rich rebuild (audience selector exists; poll builder/mention
autocomplete deferred) — tracked for a later pass.
