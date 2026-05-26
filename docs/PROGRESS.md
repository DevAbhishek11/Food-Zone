# FoodZone — Progress Tracker

Living checklist of **completed** and **pending** work. Each completed feature was
delivered across all relevant tiers and verified (`php artisan test` / web `build`+`lint`
/ mobile `tsc`+`expo lint`+`expo export`). Per-phase detail lives in `WORKPHASE-N.md`;
the index is `WORKPHASES.md`.

_Last updated: 2026-05-26 · Backend tests: **130** · Mobile routes: **27** · Production roadmap: [ROADMAP.md](ROADMAP.md)_

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

---

## ⏳ Pending / Backlog

Ordered roughly by value. Each would follow the same convention (next phase number,
all tiers, tests, a `WORKPHASE-N.md`).

### Next up (per [ROADMAP.md](ROADMAP.md))
- [ ] **P24 — Production hardening** — security headers, rate limiting, audit logs,
  structured logging/monitoring, CI-friendly structure, more tests.
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
