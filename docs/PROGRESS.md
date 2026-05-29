# FoodZone — Progress Tracker

Living checklist of **completed** and **pending** work. Each completed feature was
delivered across all relevant tiers and verified (`php artisan test` / web `build`+`lint`
/ mobile `tsc`+`expo lint`+`expo export`). Per-phase detail lives in `WORKPHASE-N.md`;
the index is `WORKPHASES.md`.

_Last updated: 2026-05-29 · Backend tests: **212** · Mobile routes: **32** · Web pages: **43** · Roadmaps: [ROADMAP.md](ROADMAP.md) (P12→P24 ✅) + **v3.0 enhancement (P25→P36 ✅ complete)**_

### v3.0 enhancement roadmap (P25–P36, from `27May2026Prompt.md`)
- [x] **P25 — Landing page + role-separated auth**: public `/` marketing landing (hero/features/
  how-it-works/animated stats/trending/app/vendor-CTA/footer); feed moved to `/feed`;
  `redirectAfterLogin(role)`; multi-step `/register`; `/vendor/login`, `/vendor/register`,
  `/admin/login`. _(Web)_
- [x] **P26 — Design system overhaul**: full `@theme` token set (neutral-zinc palette, gradients,
  shadows, radii, motion) with old names kept as aliases; Button (outline/xs-xl/icons/gradient),
  new Card + Badge, Avatar (ring/online/verified/gradient initials), Input password toggle;
  mobile `theme.ts` palette + `Shadows`/`Radii`. _(Web + Mobile)_
- [x] **P27 — Feed & post experience**: saved/share/liked-by/trending/suggested + hashtags + stories
  (4 new tables, 13 tests); web StoryBar+viewer, PostCard save/share/hashtag-links, TrendingSidebar,
  `/hashtag/[tag]`; mobile FlashList feed + story bar + double-tap-like/haptics + save. Polls deferred.
  _(Backend + Web + Mobile)_
- [x] **P28 — Profile experience**: `users.is_verified`, `user_profiles.location`, `story_highlights`
  table; `/users/{u}` adds member_since/top_food_tags/mutual_followers; food-journey + tagged-in
  endpoints; highlights CRUD; web `/u/[username]` rebuild (cover/verified/tabs/mutuals) + `/profile`
  details editor; mobile cover banner + verified + about-you editor (bio/location/website/private).
  _(Backend + Web + Mobile)_
- [x] **P29 — Chat v2**: pin/mute on pivot; messages +replied_to/type/media_url/SoftDeletes;
  `message_reactions` + `starred_messages` tables; 10 new endpoints (pin/mute/typing/react/star
  /unstar/starred/delete-message/search/forward); `UserTyping` broadcast; resources enriched
  (reactions grouped, replied_to snippet, is_deleted placeholder, is_starred); web hover toolbar
  (React/Reply/Delete) + reactions row + reply preview + pin/mute on list; mobile long-press
  action sheet + reactions row + pin/mute list. +9 tests. _(Backend + Web + Mobile)_
- [x] **P30 — Vendor store UI**: vendors.tags + vendor_reports migration; `/vendors/{id}` adds
  delivery_estimate_min/max + opens_at + tags + has_offer; `/vendors/{id}/menu` adds popular_items;
  Haversine `/vendors/nearby` (PHP impl for SQLite portability); `/items/trending`;
  `POST vendors/{id}/report`; web vendor page hero polish (status pill / delivery strip / tags /
  veg-dot / 🔥 Popular badge); mobile vendor screen polish. +5 tests. _(Backend + Web + Mobile)_
- [x] **P31 — Vendor dashboard v3**: `vendor_user_blocks` + `inventory_items` + `flash_deals`
  migration; customers (anonymized + warn DM + block/unblock), inventory CRUD + adjust (with
  ok/low/out status), vouchers full CRUD, item analytics, daily payouts, flash-deal create;
  web `/vendor/customers` + `/vendor/inventory` + `/vendor/vouchers` + nav tabs. +7 tests.
  _(Backend + Web; mobile out of scope)_
- [x] **P32 — Admin console v3**: reuses existing `violations`/`violation_actions` as unified
  reports queue; `POST /{posts,comments,users}/{id}/report` opens violations; admin list/resolve
  (dismiss/warn/suspend/ban/remove_content) writes ViolationAction + AuditLog; `/admin/revenue`
  breakdown; `PUT /admin/vendors/{id}/feature` toggle; `POST /admin/broadcast` segmented system
  notify; `GET /admin/system-health` wraps HealthController; web `/admin/reports` queue +
  resolve dialog and `/admin/broadcast` composer + preview; +8 tests. _(Backend + Web)_
- [x] **P33 — Explore & discovery**: `ExploreController::index` returns a curated payload
  (`trending_posts` 6 h weighted, `trending_vendors` with `order_delta` % vs prior window,
  `trending_hashtags` runtime-regex, `trending_items` 24 h, `suggested_users` friends-of-friends
  with `popular` fallback, `nearby_vendors` PHP-Haversine when lat/lng given); `GET /explore/map`
  feeds Leaflet view. Web `/explore`: hero search + category chips + sections + dynamic Leaflet
  map (OpenStreetMap) + nav entry. Mobile `(tabs)/explore.tsx`: FlashList v2 `masonry` prop +
  segmented control + expo-location nearby. +9 tests. _(Backend + Web + Mobile)_
- [x] **P34 — Notifications grouping + onboarding wizard**: migration adds
  `users.onboarding_completed` + `notification_preferences (user_id,type,channel,enabled)`;
  `GET /notifications?grouped=1` returns Today/This Week/Earlier buckets, `?type=` filter;
  `GET/POST /notifications/preferences` defaulted matrix w/ sparse overrides; new types
  `story_mention`/`post_tagged`/`vendor_offer`/`flash_deal`; `POST /onboarding/{complete,skip}`
  upsert profile + create follows + flip flag; `UserResource` exposes flag. Web `/notifications`
  grouped sections + per-type icons + hover mark-as-read + inline action buttons,
  `/notifications/preferences` matrix, `/onboarding` 4-step wizard, login/register reroute via
  `redirectAfterLogin`. Mobile grouped inbox + `/onboarding` screen + `_layout` gating. +9 tests.
  _(Backend + Web + Mobile)_
- [x] **P35 — Performance**: migration adds 5 composite indexes for hot scan paths
  (`orders(vendor_id,created_at)`, `orders(user_id,created_at)`,
  `notifications(user_id,created_at)`, `follows(follower_id,status)`,
  `post_comments(post_id,created_at)`); `Cache::remember` on `vendor:{id}:menu` (60 s)
  and `explore:shared` (global trending sections, 60 s); Recharts code-split via
  `next/dynamic({ssr:false})` on `/admin` + `/vendor`; 4 hot mobile lists migrated
  to FlashList v2 (`vendors`, `orders`, `messages/index`, `search`). +3 tests.
  _(Backend + Web + Mobile)_
- [x] **P36 — Advanced features**: migration adds `user_loyalty`, `loyalty_transactions`,
  `badges`, `user_badges`; `LoyaltyService::awardForDelivery` idempotent (1 pt per ₹10 +
  50 pt first-order bonus, tier bronze/silver/gold/platinum); `checkBadges` awards
  `first_order`/`order_century`/`social_butterfly`/`food_explorer`; `OrderController`
  hooks into delivered transitions; `GET /me/loyalty` snapshot + `GET /leaderboard`
  (points/orders/reviews, top 50) + public `GET /flash-deals`. Web `/settings`
  consolidation + `/leaderboard` + `LoyaltyCard` on `/profile`. Mobile `settings.tsx`
  + `leaderboard.tsx` + `LoyaltyCard` on profile tab. +8 tests. _(Backend + Web + Mobile)_

**v3.0 enhancement roadmap (P25–P36) — complete.** 🎉
  _(+ deferred: post polls, story-highlight UI, voice/file messages UI, starred-messages page,
  sticky category tab bar, Kanban orders board, satisfaction donut, flash-deal create UI,
  /admin/revenue chart page, system-health widget)_


---

## ✅ Completed

### Foundation
- [x] **P1 — Backend API** (Laravel 13): schema (27 migrations), models+enums, Sanctum auth,
  RBAC, social, vendors/menu, orders, admin, notifications, health, JSON error envelope.
- [x] **P2 — Web app** (Next.js 16): auth, app shell, feed, vendor browse, cart/checkout,
  orders, profile; React Query + Zustand; dark theme.
- [x] **P3 — Mobile app** (Expo SDK 55): auth, tabs, feed, vendor browse, cart/checkout,
  orders, profile.

### Features (full-stack vertical slices)
- [x] **P4 — Notifications**: enriched actor data, inbox + live unread badge (web & mobile),
  delete/clear endpoints.
- [x] **P5 — Reviews & ratings**: public vendor reviews, rate delivered orders, vendor replies.
- [x] **P6 — Profiles & following**: public profile pages, privacy-aware user posts,
  follow/unfollow, clickable authors.
- [x] **P7 — Vendor dashboard**: stats, store open/close, order management, menu CRUD (web),
  review replies.
- [x] **P8 — Admin console**: dashboard metrics, user moderation (ban/suspend/reinstate),
  vendor approve/reject.
- [x] **P9 — Search & discovery**: combined + typed search across people/restaurants/posts.
- [x] **P10 — Favorites & reorder**: save vendors, `is_favorited` flag, one-tap reorder.
- [x] **P11 — Address book**: manage delivery addresses, select at checkout (order snapshots it).

### Production-grade (P12+)
- [x] **P12 — Admin dashboard (enterprise)**: analytics + charts (Recharts), order
  monitoring table, bulk user actions, CSV export. _(Backend + Web)_
- [x] **P13 — Vendor dashboard (business-ready)**: sales analytics + charts, operating-hours
  editor, menu variants/add-ons editor, order timelines. _(Backend + Web + Mobile)_
- [x] **P14 — Media uploads + auth hardening**: `POST /media` (env-driven disk, CDN/S3-ready),
  web AuthContext (guaranteed non-null user), image uploads for avatars/posts/menu items
  on web + mobile (expo-image-picker). _(Backend + Web + Mobile)_
- [x] **P15 — Infra: Redis, queues & caching**: predis; queued jobs (`RecalculateVendorRating`,
  queued verification email); `Cache::remember` on admin/vendor analytics; env-driven Redis
  with DB/sync fallback. _(Backend infra; not runtime-verified in sandbox)_
- [x] **P16 — Meilisearch via Scout**: Searchable Vendor/User/Post (index scoping via
  `shouldBeSearchable`); `/search` routes through Scout when `SCOUT_DRIVER=meilisearch`,
  DB-LIKE fallback otherwise. _(Backend infra; engine not runtime-verified in sandbox)_
- [x] **P17 — Real-time via Reverb**: `NotificationCreated` + `OrderStatusUpdated` broadcast
  events on private channels; web + mobile Echo clients (env-guarded) refresh queries live,
  polling fallback. _(All tiers; WS server not runtime-verified in sandbox)_
- [x] **P18 — Chat / DMs**: conversations + messages schema, participant-guarded endpoints,
  `MessageSent` broadcast; web `/messages` + thread, mobile messages screens, "Message" on
  profiles. _(Backend + Web + Mobile)_
- [x] **P19 — Payments**: pluggable `PaymentGateway` (mock default + real Razorpay/Stripe
  HTTP drivers), `payments` table, `POST /orders/{id}/pay` intent, signature-verified
  `POST /payments/webhook`, mock `confirm`, refund-on-cancel; web + mobile "Pay now" on
  unpaid online orders. Also added `@react-native-community/netinfo` (fixes native bundling
  of the P17 Reverb client). _(Backend + Web + Mobile)_
- [x] **P20 — Checkout depth**: `OrderService::quote()` extracted + `POST /checkout/quote`
  (variant/add-on pricing + lenient voucher preview); web `ItemCustomizeDialog` + promo code
  in cart; mobile `CustomizeSheet` + `CartReviewModal` (line editor + promo). Clients now send
  `variant_id`/`addon_ids`/`voucher_code`. _(Backend + Web + Mobile)_
- [x] **P21 — Delivery partner flow**: `delivery` role activated; `delivery_partner_id` on orders;
  `DeliveryController` (register, available, atomic accept, release, pick-up, deliver, my orders,
  stats); customer/vendor notified + COD settled on delivery; web `/delivery` + mobile `/deliver`
  dashboards (available/active/completed). _(Backend + Web + Mobile)_
- [x] **P22 — Order timeline + post detail**: web `/posts/[id]` + `/orders/[id]`, mobile `post/[id]`
  + `order/[id]`; threaded comment replies + delete (recursive UI both clients); full order
  status-history timeline; +2 backend comment tests. _(Backend + Web + Mobile)_
- [x] **P23 — Push + email-verification UX**: `push_tokens` + register/unregister + `SendPushNotification`
  (Expo, env-gated, dispatched from `NotificationService`); mobile `expo-notifications` registration
  (guarded); web `/verify-email` page + resend; mobile resend on profile. _(Backend + Web + Mobile)_
- [x] **P24 — Production hardening**: `SecurityHeaders` middleware; config-gated API/auth rate
  limiting; immutable `audit_logs` + `AuditService` wired into all admin moderation +
  `GET /admin/audit-logs` + web `/admin/audit` viewer; GitHub Actions CI (backend/web/mobile);
  +3 tests. _(Backend + Web)_

---

## ⏳ Pending / Backlog

Ordered roughly by value. Each would follow the same convention (next phase number,
all tiers, tests, a `WORKPHASE-N.md`).

### Backlog (roadmap P12→P24 complete)
- [ ] **Vendor menu CRUD on mobile** — full category/item management (web-primary today);
  split out of P22 to keep phases coherent.
- [ ] **Stories** — 24h ephemeral posts (`stories` + `story_views` tables, endpoints, UI rails).

### Platform / quality
- [ ] **Policy enforcement automation** — `violations` tables exist; auto warn/suspend/ban.
- [ ] **Analytics dashboards** — richer vendor/admin charts over time.
- [ ] **Frontend tests** — Playwright (web) / RNTL (mobile); currently typecheck+build+bundle only.
- [ ] **Search infra** — swap DB `LIKE` for Meilisearch when available.
- [ ] **i18n / accessibility pass**, rate-limit tuning, image CDN, CI pipeline.

### Known limitations / tech debt
- No Redis/Meilisearch in this environment → cache/queue/session use the database driver;
  search is DB-backed.
- `orders.voucher_id` has no DB-level FK (app-enforced) to keep MySQL+SQLite portable.
- Notification unread count polls (30s) rather than pushing.
- Media fields store URLs; no upload pipeline yet.
- Reorder re-prices at current prices and silently drops unavailable items.
