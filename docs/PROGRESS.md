# FoodZone — Progress Tracker

Living checklist of **completed** and **pending** work. Each completed feature was
delivered across all relevant tiers and verified (`php artisan test` / web `build`+`lint`
/ mobile `tsc`+`expo lint`+`expo export`). Per-phase detail lives in `WORKPHASE-N.md`;
the index is `WORKPHASES.md`.

_Last updated: 2026-05-20 · Backend tests: **76** · Mobile routes: **21**_

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

---

## ⏳ Pending / Backlog

Ordered roughly by value. Each would follow the same convention (next phase number,
all tiers, tests, a `WORKPHASE-N.md`).

### Next up (proposed P12+)
- [ ] **Post detail & share** — dedicated post page/screen with full comment threads,
  reply-to-comment UI, share/repost.
- [ ] **Image uploads** — real media for avatars, post media, vendor logo/banner, menu
  images (currently URLs only). Needs a storage/upload endpoint (`POST /media`) + client pickers.
- [ ] **Stories** — 24h ephemeral posts (`stories` + `story_views` tables, endpoints, UI rails).
- [ ] **Real-time** — chat/DMs and live order/notification updates via Laravel Reverb
  (WebSockets). Currently notifications poll every 30s.

### Commerce depth
- [ ] **Payments** — real Razorpay/Stripe gateway (intent, webhook, refund); today payment
  is recorded but not charged.
- [ ] **Item variants & add-ons at checkout** — backend supports them; clients only send base items.
- [ ] **Vouchers UX** — apply promo codes at checkout (backend validates; no client UI yet).
- [ ] **Delivery partner flow** — `delivery` role: assignment, accept, live status.
- [ ] **Vendor menu CRUD on mobile** — currently web-primary.
- [ ] **Order detail screen** — full timeline/status history (web & mobile).

### Platform / quality
- [ ] **Push notifications** — Expo push tokens + FCM/APNs.
- [ ] **Policy enforcement automation** — `violations` tables exist; auto warn/suspend/ban.
- [ ] **Analytics dashboards** — richer vendor/admin charts over time.
- [ ] **Email verification UX** — verify-email screen/flow on clients (API exists).
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
