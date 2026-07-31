# FoodZone — Improvement & Feature Roadmap

> Written 2026-07-06, based on an audit of the actual codebase (Laravel API · Next.js web · Expo mobile).
> Updated 2026-07-29: Sprint 1 fully shipped — real-time, order dispute tools, saved collections, hashtag
> follow, review photos, admin user drawer, live new-posts banner, account deletion.
> Updated 2026-07-31: Sprint 2 "money" shipped — wallet + loyalty redemption, vendor payouts page — plus a
> full error-handling pass (18 findings from an independent audit, all HIGH/MEDIUM fixed with regression
> tests). Current state: 284 backend tests, 44 web pages, 26 mobile routes, dedicated admin/vendor
> dashboards, working image + story pipeline + realtime + wallet, dark design system shared across web &
> mobile. Mobile app error-handling audit findings remain open (see §8).

Legend: 🟢 quick win (hours) · 🟡 medium (1–3 days) · 🔴 large (1 week+)

---

## 1. Highest-impact user features (add real value to users)

| # | Feature | Why it matters | Effort |
|---|---------|----------------|--------|
| 1.1 | **Wallet + loyalty redemption** ✅ shipped 2026-07-31 — wallets/wallet_transactions ledger, pay-with-wallet at checkout (full-payment method, marks order paid instantly), POST /loyalty/redeem converts points→credit, all 3 refund paths (cancel, admin refund, auto-cancel) credit the wallet correctly for wallet-paid orders | Done | ✅ |
| 1.2 | ~~One-tap reorder~~ ✅ already built (`POST /orders/{id}/reorder` + Reorder button on orders page) | — | ✅ |
| 1.3 | **Referral program** | `users` invite code + reward both sides on first order (spec §13.3). Viral growth loop; touches signup + checkout only. | 🟡 |
| 1.4 | **Review photos** ✅ shipped 2026-07-29 (helpful votes still todo) | Upload UI on RateOrderDialog + thumbnail strips on both review lists | ✅ |
| 1.5 | **Saved-post collections** ✅ shipped 2026-07-29 (named folders, move-between, chip bar) | Done | ✅ |
| 1.6 | **Post editing** ✅ inline editor shipped 2026-07-07 (edit-history table still todo) | Done in PostCard menu | ✅ |
| 1.7 | **Polls in posts** | Composer already has the layout to host it; 2–4 options + duration (spec §9.1). Great engagement driver. | 🟡 |
| 1.8 | **Pin posts to profile** ✅ shipped 2026-07-07 (`PUT /posts/{id}/pin`, max 3, pinned-first profile, badge + menu UI) | Done | ✅ |
| 1.9 | **Story reactions & reply-to-DM** | Stories work; quick emoji react + "reply" that opens a DM thread (spec §9.2). Chat system already exists to receive them. | 🟡 |
| 1.10 | **Follow hashtags** ✅ shipped 2026-07-29 (follow/unfollow, feed posts from followed tags get a distinct "Hashtag you follow" badge) | Done | ✅ |

## 2. Real-time ✅ activated 2026-07-29

Was completely dead despite Echo being wired on both clients — two separate root causes, both fixed:
1. `BROADCAST_CONNECTION` was `log` and Reverb wasn't running → switched to `reverb`, `reverb:start` now runs
   alongside the API (added to `composer dev`).
2. **Silent killer**: Laravel queues `ShouldBroadcast` events by default (`Illuminate\Broadcasting\BroadcastEvent`
   implements `ShouldQueue`). With `QUEUE_CONNECTION=database` and no `queue:work` process, every broadcast —
   chat messages, order status, notifications — silently piled up in the `jobs` table forever and was never
   delivered. `composer dev` already ran `queue:listen`; it just hadn't been used. Now documented as required.
3. Also missing: `config/cors.php` only allowlisted `api/*` and `sanctum/csrf-cookie` — Echo's private-channel
   auth POSTs to `/broadcasting/auth`, which wasn't covered, so every subscription silently failed CORS preflight
   even with Reverb + queue both running. Added `broadcasting/auth` to the CORS paths.

Verified end-to-end with two independent logged-in browser sessions: Alice sends a chat message via the API,
Admin's already-open thread updates live with zero refresh (`message.sent` WS frame observed), and Admin's
notification bell fires in the same instant (`notification.created`).

**Run all four dev processes together**: `composer dev` (server + queue + vite) — note Reverb was added to
that script; on Windows where `composer dev`'s concurrently wrapper may not suit your shell, run
`php artisan reverb:start`, `php artisan queue:listen`, and `php artisan serve` as three separate processes.
**A queue worker must always be running in production** (Horizon or `queue:work` as a supervised service) or
real-time silently regresses to this exact failure mode with no error anywhere in the stack.

- ✅ **"N new posts — tap to load"** feed banner (spec §8.3) — shipped 2026-07-29: `PostCreated` broadcasts
  on a public `feed` channel for public posts; the feed page counts them live and shows a tap-to-load pill.

Still open:
- 🟡 Typing indicators + read receipts already have endpoints (`conversations/{id}/typing`) — surface them live
  now that the transport actually works.
- 🟡 Vendor new-order sound alert — `order.status` channel already delivers; needs a client-side toast + sound.

## 3. Ordering & payments

- 🟡 **Activate a real payment gateway.** The abstraction is done (`PaymentGateway` contract with
  Mock/Razorpay/Stripe implementations) — needs API keys, webhook endpoint hardening, and an e2e test
  against Razorpay sandbox. Until then everything runs on Mock. As of 2026-07-31 the gateway call sites
  (`pay`, refund x3) are properly try/catch-guarded and never mis-report a failed gateway call as success —
  see §12 — so activating a real gateway now is purely a config/credentials change, no code risk.
- ✅ **Refund flow** — shipped 2026-07-29: `POST /admin/orders/{id}/refund` (full or partial, any order
  status with a captured payment) + a "Manage" dialog on the admin orders page. Hardened 2026-07-31: a
  failed/thrown gateway refund no longer marks the order "refunded" (see §12); wallet-paid orders refund
  to the wallet instantly across all three refund paths.
- ✅ **Scheduled order-acceptance timeout** — shipped 2026-07-07: `orders:cancel-stale` runs every minute,
  window via `ORDER_ACCEPTANCE_WINDOW` (default 15 min), refunds paid orders, notifies both sides.
- 🟡 **Delivery charges** — vendor-configurable flat/threshold-free delivery fee shown before checkout (spec §10.5).
- 🟡 **Invoices** — downloadable PDF invoice per order (spec §8.6); `barryvdh/laravel-dompdf` + one blade template.

## 4. Vendor dashboard

- ✅ **Payouts page** — shipped 2026-07-31: `/vendor/payouts`, day/week grouping, lifetime summary, CSV
  export. Fixed a real bug in the pre-existing endpoint: refunded orders were still counting toward payout
  (spec's "revenue − commission − **refunds**" wasn't actually subtracting refunds). Still open: payout
  *scheduling*, a persisted payout-history/status table, and downloadable tax statements — this shipped the
  revenue-breakdown half of §6.7, not the batch-payout-processing half.
- ✅ **Menu item photos in the list view** — shipped 2026-07-07 (thumbnail or placeholder per row).
- 🟢 **CSV menu import/export** (spec §6.3) — export exists for other admin lists; reuse the csv helper.
- 🟡 **Recipe-level inventory** — map ingredients → menu items with auto-deduction on order (spec §16.1).
  Inventory CRUD exists; the mapping table + deduction hook is the missing half.
- 🟡 **Customer insights** — repeat-customer %, average order value trend, peak hours heatmap (spec §18.2).
  The orders data supports all of it; add one analytics endpoint + charts.

## 5. Advertisement system (biggest unbuilt spec area — §12)

Nothing of the ad system exists yet. Recommended slice order:

1. 🔴 **Sponsored posts MVP**: `ad_campaigns` table (vendor, budget, dates, status), admin review queue,
   "Sponsored" cards injected every Nth feed item, impression + click counters.
2. 🟡 Campaign analytics for vendors (impressions, clicks, CTR) on the vendor dashboard.
3. 🔴 Targeting (city, preferences) + wallet-funded budgets — after the wallet (1.1) lands.

This is a revenue feature; build after wallet + payments so campaigns can actually be paid for.

## 6. Admin panel (toward "complete control")

Already done: user ban/suspend/verify/bulk, vendor approve/reject/feature/commission/force-close,
reports queue, broadcast, audit log, system health, revenue.

Still worth adding:
- 🟡 **Platform settings page** — `settings` key-value table + UI: default commission, maintenance mode
  toggle, feature flags (spec §5.12). Backend reads settings with cache.
- ✅ **User detail drawer** — shipped 2026-07-29: click a user in admin/users → slide-in drawer with
  orders/posts/violations stats + recent activity (spec §5.2).
- ✅ **Admin order dispute tools** — shipped 2026-07-29: status override (admins could already bypass
  transition rules server-side, just needed a UI) + the new refund endpoint, both in one dialog (spec §5.6).
- 🟡 **IP ban list** (spec §11.3) — table + middleware + admin UI.
- 🟡 **Email template management** — editable templates for the transactional emails (spec §5.12).
- 🟢 **Export everywhere** — vendors/orders lists have CSV; add to reports + audit log.

## 7. Search & discovery

- 🔴 **Meilisearch** (spec §19.1) — current search is SQL `LIKE`; fine at this scale, but typo-tolerant
  instant search across users/vendors/items/posts is a visible quality jump. Laravel Scout makes this ~2 days.
- 🟢 **Recent searches** — store last 10 locally + server-side (spec §19.1).
- 🟡 **"Open now" filter + delivery-time estimate** on vendor discovery (spec §19.2).

## 8. Mobile app

- 🟡 **Bring the post composer to parity** — multi-image (10), privacy selector, drag-reorder (web has all three now).
- 🟢 **Media grid + lightbox parity** — port the web MediaGrid layout logic to a RN component.
- 🟡 **Push notifications end-to-end** — `PushTokenController` exists; wire Expo push send into
  NotificationService so orders/likes/DMs actually push when the app is closed.
- 🟢 **Haptics on key actions** (like, order placed) + skeleton loaders on all lists (spec §25.2, §20.3).
- 🟡 **Biometric login** (Face ID / fingerprint) via `expo-local-authentication` (spec §25.2).
- 🟡 **Deep links** — `foodzone://post/123`, `foodzone://vendor/456` (spec §25.2); Expo Router supports this natively.

## 9. Security & account

- 🟡 **2FA (TOTP)** — optional for users, mandatory for admin (spec §22.1). `pragmarx/google2fa` + QR setup screen.
- 🟡 **OAuth login** — Google/Apple via Socialite (spec §22.1); big signup-friction reducer.
- 🟢 **Login attempt lockout** — 5 fails → 15-min lockout (spec §22.1); Laravel rate limiter, mostly config.
- ✅ **Account deletion with 30-day grace** — shipped 2026-07-29: `POST /profile/request-deletion`
  (password-confirmed) + daily `users:purge-deleted` command. Also added `POST /profile/reactivate` and a
  web `ReactivateScreen` — closes a pre-existing gap where a deactivated account had no way back in at all.
- 🟡 **Private accounts done fully** — follow-request approve/deny UI (backend `status` column already exists).

## 10. Performance & infrastructure

- 🟡 **Queue the heavy work** — notifications and (future) push/email sends run inline today
  (`QUEUE_CONNECTION=database` but jobs are few). Move NotificationService writes + mail to queued jobs.
- 🟢 **Image variants** — generate thumbnail + medium sizes on upload (Intervention Image) so feeds don't
  load full-size photos; store variants in the media response.
- 🟡 **Redis for cache/session/queue** in production (`.env` currently database-backed for both).
- 🟢 **API response compression + ETag** on the hot GET endpoints (feed, menu).
- 🟡 **S3/R2 storage in production** — `MEDIA_DISK` env already supports it; needs bucket + CDN config.
- 🟢 **Sentry** on all three apps — error visibility before users report.

## 11. Quality-of-life fixes observed during the audit

- 🟢 Feed pagination: infinite scroll works, but a scroll-to-top + "new posts" pill would help long sessions.
- 🟢 Empty states: some pages (favorites, leaderboard early-on) could suggest actions instead of plain text.
- 🟢 The vendor "Customers" page is anonymised aggregate — add per-customer order counts once privacy rules allow.
- ✅ `admin@foodzone.app` seeded password drifted once — `php artisan dev:reset-demo-users` shipped
  2026-07-29 (resets admin@foodzone.app / alice@example.com to "password"; refuses to run in production).
- 🟢 Add Playwright (or keep the puppeteer scripts) as a committed `e2e/` suite — the browser smoke crawl
  caught every real bug this week; it should run in CI.

## 12. Error handling (independent audit, 2026-07-31)

Ran a dedicated audit for silent failures / bad error handling across all three apps. All HIGH and MEDIUM
web+backend findings are fixed with regression tests (see commit "bug fixes and made error handling
proper"). Fixed: unguarded payment-gateway calls (`pay`, all 3 refund paths — now try/catch'd, and a
failed/thrown refund no longer marks the order "refunded" when no money actually moved), no per-order
isolation in `orders:cancel-stale`/`users:purge-deleted` (one bad row used to be able to silently wedge the
whole scheduled job forever), a vendor-signup flow that permanently locked an applicant out if step 2 failed
after step 1 succeeded, ~12 web mutation call sites with no error feedback at all (delete/toggle/pin/mute
buttons that silently did nothing on failure), search rendering "No results" on an actual API error, and
`auth-store` bouncing an authenticated user to `/login` on a transient network blip instead of only on a
real 401.

**Still open — mobile app** (same audit, not yet applied): no `MutationCache` default error handler in
`FoodZoneApp/src/lib/query-client.ts` (mirrors the web fix, higher leverage since mobile has fewer
per-call-site handlers already) — highest-impact bare `.mutate()` sites: store open/close toggle
(`manage/index.tsx`), story creation (`story-bar.tsx` — upload succeeds, story never appears, no message),
follow/unfollow and message actions (`user/[username].tsx`, `messages/[id].tsx`), image-picker rejection
unhandled in `use-media.ts`.

---

## Suggested build order (next 4 sprints)

1. **Sprint 1 — close the loops** ✅ **COMPLETE 2026-07-29**: Reverb real-time (§2), reorder (1.2),
   pin posts (1.8), post editing (1.6), acceptance timeout (§3), menu photos in vendor list (§4),
   plus opportunistically pulled forward from later sprints: admin refund + status override (§3, §6),
   saved collections (1.5), hashtag follow (1.10), review photos (1.4), admin user detail drawer (§6),
   live new-posts banner (§2), account deletion + reactivation (§9).
2. **Sprint 2 — money** ✅ **COMPLETE 2026-07-31**: wallet + loyalty redemption (1.1), vendor payouts page
   (§4), plus a full error-handling audit and fix pass (§12, web + backend). What's left of "money":
   Razorpay activation + invoices (§3) — both are now lower-risk since the gateway call sites are hardened.
3. **Sprint 3 — growth**: mobile error-handling pass (§12), referrals (1.3), polls (1.7), story
   reactions/reply (1.9), OAuth + 2FA (§9), push notifications e2e (§8), Meilisearch (§7).
4. **Sprint 4 — revenue**: sponsored-posts ad MVP (§5), platform settings + feature flags (§6),
   mobile composer parity (§8).
