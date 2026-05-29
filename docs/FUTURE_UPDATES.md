# FoodZone — Future Updates & Master Enhancement Prompt v4.0

> **How to use this file.** This is a self-contained brief for the next Claude (or human) session. Each section is sized to land in a single workphase. Pick a phase, read the "Schema check" hint, follow the established cadence — verify schema → backend (migration + models + endpoints + tests) → web → mobile → docs (`WORKPHASE-N.md`) → trackers + memory. The same conventions that carried P1–P36 still apply (Laravel 13 + SQLite-tested, Next.js 16 App Router + Tailwind v4 + React Compiler, Expo SDK 55 + FlashList v2 + expo-router).
>
> The repo already ships clean at **212 backend tests / 43 web pages / 32 mobile routes / 3 codebases / CI green**. This file is what comes next.

---

## Table of contents

- [Doctrine: how we work](#doctrine-how-we-work)
- [Carry-over deferred items (must clear first)](#carry-over-deferred-items)
- **Phase 37** — Settings completeness (change-password, 2FA, blocked/muted, theme, language, data export)
- **Phase 38** — Loyalty redemption + referral + review-photo bonus + tier perks at checkout
- **Phase 39** — Composer v2 (polls, food tagging `@vendor:item`, mention picker, draft autosave)
- **Phase 40** — Stories v2 (highlights UI, story replies, story-mention notifications, music sticker)
- **Phase 41** — Chat v3 (voice notes, file/image messages, starred-messages page, message search)
- **Phase 42** — Vendor v4 (Kanban orders board, satisfaction donut, flash-deal create UI, sticky categories, happy hours, drag-to-reorder)
- **Phase 43** — Admin v4 (revenue chart page, system-health widget, audit-log viewer, role/permission matrix, content-moderation queue 2.0)
- **Phase 44** — Delivery v2 (live courier map, route optimization, batch deliveries, courier earnings ledger)
- **Phase 45** — Reviews v2 (helpfulness, video reviews, photo gallery, verified-purchase badge, review moderation)
- **Phase 46** — Performance v2 (ETags + Conditional GET, persistent DB pool, WebP/AVIF pipeline, CDN signed URLs, edge cache, N+1 audit, query cost budget)
- **Phase 47** — Observability + ops (structured logs, OpenTelemetry, Sentry, slow-query monitor, SLO dashboard, on-call runbook)
- **Phase 48** — Security & compliance (rate-limit hardening, audit-log immutability, GDPR data export/delete, PII redaction, CSP, COOP/COEP, OWASP audit)
- **Phase 49** — Accessibility & internationalization (WCAG 2.2 AA pass, RTL, i18n catalog, currency/units, screen-reader testing)
- **Phase 50** — AI assist (smart search, dish recommendations, review summarization, vendor inbox auto-replies, image moderation)
- **Phase 51** — Growth & retention (referrals 2.0, share cards, deep links, email digest, push re-engagement, A/B framework)
- **Phase 52** — Mobile platform polish (haptics everywhere, deep links, share extension, watch widgets, App Clips / Instant Apps)
- **Phase 53** — Web platform polish (PWA, offline cart, install prompt, push, share target, Web Share API, file-system access)
- **Phase 54** — Vendor onboarding 2.0 + KYC, payouts dashboard, tax invoices, multi-outlet, staff roles
- **Phase 55** — Group ordering, scheduled orders, subscriptions, gift cards, corporate accounts
- **Phase 56** — Marketplace & ads (sponsored vendors, promoted items, search ads, attribution)
- **Phase 57** — Data platform (events pipeline, warehouse, dbt, dashboards, experimentation)
- **Phase 58** — DevEx & infra (typed API client gen, error budgets, blue/green deploys, infra-as-code, secrets rotation, preview envs)
- **Phase 59** — Test & QA depth (mutation testing, contract tests, visual regression, E2E with Playwright/Detox, load tests, chaos)
- **Phase 60** — Design system maturity (Storybook, tokens v2, motion spec, dark-mode parity, brand asset kit)
- [Cross-cutting code-quality wins (no migrations)](#cross-cutting-code-quality-wins)
- [UI / UX micro-improvements catalogue](#ui--ux-micro-improvements-catalogue)
- [Schema reality reference (current state, 2026-05-29)](#schema-reality-reference)
- [Glossary of conventions](#glossary-of-conventions)

---

## Doctrine: how we work

Before writing a single line of code, re-read these. They saved hours in P25–P36 and will keep saving them.

1. **Schema-first verification.** The original prompt frequently claimed tables existed that didn't. Always grep migrations + check `Schema::create('foo'` and `app/Models/Foo.php` before referencing anything. Treat the memory notes as hints, not facts; verify before acting on them.
2. **SQLite portability is non-negotiable.** Tests run on `:memory:` SQLite. That means:
   - No SQL trig (`acos`/`sin`) — do Haversine in PHP.
   - No `ALTER TABLE … ADD FOREIGN KEY` — use plain indexed columns.
   - Index introspection in tests via `SELECT name FROM sqlite_master WHERE type='index'`.
   - JSON columns work but expect string-encoded payloads in raw queries.
3. **Eloquent timestamp pitfall.** `Model::create(['created_at' => $past])` doesn't persist that timestamp — `save()` overwrites it because `$timestamps = true`. Use `new Model(...); $m->timestamps = false; $m->created_at = $past; $m->save()`.
4. **Enum casts.** `$model->status` returns the enum instance — use `->value` in tests to compare to strings.
5. **JsonResource in cache.** `Cache::remember(..., fn() => Resource::collection($x))` serializes oddly. Call `->resolve()` first to materialize an array.
6. **React Compiler set-state-in-effect.** Don't mirror query data into local state via `useEffect`. Derive at render: `const merged = data ? { ...data, ...changes } : null`.
7. **FlashList v2.** No `MasonryFlashList` export anymore (use `<FlashList masonry numColumns={2}>`). No `estimatedItemSize`. No `gap` in `contentContainerStyle` — use `marginBottom` on row wrappers.
8. **Leaflet + SSR.** `react-leaflet` touches `window` — always `dynamic(... { ssr: false })` and prefer inline SVG data-URIs for markers (default assets 404 when bundled).
9. **Next.js 16 quirks.** The web AGENTS.md says read versioned docs in `node_modules/next/dist/docs/` before writing code. `useSearchParams` requires Suspense. `useWatch` (`react-hook-form`) over `watch` for React Compiler compatibility.
10. **Route ordering.** Register literal paths (e.g. `notifications/preferences`) **before** wildcard paths (e.g. `notifications/{notification}`) or the wildcard wins.
11. **Test artifacts.** Each phase ships with its own `*Test.php` in `tests/Feature/`. Aim for 6–10 tests per phase covering the golden path + the edge cases that bit you in development. Run the full suite at the end.
12. **Cadence.** Verify → backend → web → mobile → docs → trackers + memory. No phase is "done" until `php artisan test`, `npm run build && npm run lint`, and `npx tsc --noEmit && npx expo lint && npx expo export` are all clean.
13. **Don't widen scope.** A bug fix doesn't need a refactor. A one-shot endpoint doesn't need a helper class. Three similar lines beats a premature abstraction.
14. **Risky actions need confirmation.** Don't destroy local state, don't force-push, don't bypass hooks. If a migration could lose data, ask first.

---

## Carry-over deferred items

These were called out in P25–P36 but never shipped. Clear most of them as part of P37–P45. The list is exhaustive on purpose — pick a row and tick it off.

### From P25 (Landing + auth)
- [ ] Re-introduce brand-icon parity (the lucide brand icons were removed because exports broke). Use `react-icons/si` or inline SVG.
- [ ] Marketing landing page: testimonial carousel, FAQ accordion, real iOS/Android download badges, Open Graph tags + share images.

### From P26 (Design system)
- [ ] Light/dark mode toggle (the tokens exist; the switcher does not).
- [ ] Storybook for `components/ui/*` + per-component snapshot tests.
- [ ] Typography scale audit (one heading hierarchy, no ad-hoc `text-xl font-semibold`).

### From P27 (Feed / posts)
- [ ] Post polls (`type='poll'` is in the enum but composer/render UI is missing).
- [ ] Story highlight management UI on `/profile`.
- [ ] Saved-posts collections (folders).
- [ ] Repost-with-comment composer.
- [ ] Hashtag follow.

### From P28 (Profile experience)
- [ ] Tagged-in tab on profile mobile.
- [ ] Profile share card (image export).
- [ ] Profile activity calendar heatmap.

### From P29 (Chat v2)
- [ ] Voice notes (record, upload, waveform render, playback scrubber).
- [ ] File/image messages (with thumbnail + caption).
- [ ] Starred-messages page (the star endpoint exists; the page doesn't).
- [ ] Message search results page.
- [ ] Forward picker bottom-sheet.
- [ ] Disappearing messages.

### From P30 (Vendor store UI)
- [ ] Sticky category tab bar that activates while scrolling the menu.
- [ ] "Best Seller" / "New" badges on items.
- [ ] Allergen / dietary filter chips above the menu.

### From P31 (Vendor dashboard v3)
- [ ] Kanban orders board (columns = status, drag to advance).
- [ ] Satisfaction donut on `/vendor` home.
- [ ] Flash-deal create UI on web (endpoint already exists).
- [ ] Drag-to-reorder menu categories.
- [ ] Stats ticker auto-refresh.

### From P32 (Admin v3)
- [ ] `/admin/revenue` chart page (API live).
- [ ] System-health widget on `/admin` home.
- [ ] Audit-log viewer page with filter (actor / action / date).
- [ ] Segment-size preview before broadcast send.

### From P33 (Explore)
- [ ] Skeleton variants for each explore section (matching dimensions).
- [ ] Server-cached explore payload with proper invalidation (currently 60 s TTL).
- [ ] Pull-to-refresh on mobile explore.
- [ ] Swipeable section reorder (user pref persisted server-side).

### From P34 (Notifications + onboarding)
- [ ] Do-Not-Disturb time-range picker.
- [ ] Notification sound on/off.
- [ ] Mobile `/notifications/preferences` screen (web exists, mobile doesn't).
- [ ] Per-cell "last updated by" timestamp on preferences (audit).

### From P35 (Performance)
- [ ] ETag + Conditional GET on `/vendors` and `/vendors/{id}`.
- [ ] Persistent DB connection pool (`config/database.php` pdo_options).
- [ ] Feed-payload caching with proper invalidation (touch on post create/like).
- [ ] CDN / Cloudflare for media URLs.
- [ ] Sharp/Intervention WebP+AVIF conversion job for `/media` uploads.

### From P36 (Advanced)
- [ ] Video reviews (30 s, signed-URL upload tier).
- [ ] Happy hours (recurring time-based discount rules).
- [ ] 2FA / TOTP enrolment + QR code.
- [ ] Change-password endpoint + form.
- [ ] Theme switcher / Language switcher in Settings.
- [ ] Downloadable data export job (GDPR).
- [ ] Blocked accounts list page (web + mobile).
- [ ] Muted accounts list page.
- [ ] Points redemption flow at checkout (₹1 per 10 pts).
- [ ] Referral 100-pt bonus claim flow.
- [ ] Review-photo +10 pt bonus.
- [ ] Food tagging in posts via `@vendor:item-name` syntax (DB columns exist).
- [ ] Collaborative orders / cart split-bill.

---

## Phase 37 — Settings completeness

**Tiers:** Backend + Web + Mobile · **Priority:** HIGH · **Est:** 1 phase

### Goal
Make `/settings` actually do everything it advertises. Right now it's a navigational hub.

### Schema check
- Add `users.totp_secret` (nullable string 32) + `users.totp_enabled` (bool) for 2FA.
- Add `data_exports (id, user_id, status, file_url?, expires_at, created_at)` for async export jobs.
- No new tables for theme/language — `user_profiles.preferences` JSON column or just store client-side.

### Backend
- `POST /auth/change-password` — `{current_password, new_password}`; validates current via `Hash::check`, then `Hash::make` + revoke all other tokens.
- `POST /auth/2fa/enroll` — generates TOTP secret, returns `otpauth://` URI for QR.
- `POST /auth/2fa/verify` — accepts 6-digit code, flips `totp_enabled`.
- `DELETE /auth/2fa` — disable.
- `POST /auth/login` — accept optional `totp_code` when user has 2FA on; return `requires_totp: true` 422 if missing.
- `POST /me/data-export` — enqueues an export job (zip of profile + posts + orders + reviews). Returns `data_exports` row.
- `GET /me/data-export` — list past exports with download URLs.
- `GET /me/blocks` + `GET /me/mutes` — return lists for the settings UI (endpoints exist for create/delete but no list).
- Tests: change-password rejects wrong current, 2FA full flow, data export creates job row.

### Web
- `/settings/password` — form with strength meter.
- `/settings/2fa` — QR + 6-digit input + recovery codes (generate 10 one-time codes on enroll).
- `/settings/blocked` + `/settings/muted` — paginated lists with unblock/unmute buttons.
- `/settings/theme` — light/dark/system radio (uses `localStorage` + a `<html data-theme>` attribute consumed by Tailwind).
- `/settings/language` — locale picker (English default, scaffold i18n catalog).
- `/settings/data` — request export → polls status → shows download link.

### Mobile
- All of the above as nested routes under `/settings/*`.
- 2FA QR via `react-native-qrcode-svg`.
- Theme switcher actually flips the `useColorScheme` override.

### Acceptance
- Disabling 2FA requires the current password.
- Blocking from list immediately invalidates feed cache for the blocker.
- Data export emails a download link when ready (queueable job).

---

## Phase 38 — Loyalty depth

**Tiers:** Backend + Web + Mobile · **Priority:** HIGH · **Est:** 1 phase

### Goal
Make the points system the user *earned* in P36 actually *spendable*.

### Schema check
- `voucher_redemptions` already exists (from P20). Loyalty redemption can either piggy-back on `vouchers` (auto-generated voucher per redeem) **or** add `loyalty_redemptions (user_id, points_spent, value_inr, order_id?)`. Pick redemption table — cleaner audit.
- Add `referrals (referrer_id, referred_id, status, awarded_at?)`. `users.referred_by` already exists.

### Backend
- `POST /me/loyalty/redeem` `{points}` — validates balance, debits, creates a single-use voucher (e.g. `LOYALTY-XXX-100` worth ₹points/10), returns the voucher code.
- Tier perks resolved at `/checkout/quote`:
  - Silver: priority-support tag in the order (visible to admin).
  - Gold: free delivery on orders ≥ ₹300.
  - Platinum: extra 5% off, exclusive coupons.
- `POST /me/referral/claim` `{referrer_code}` — once-per-user. Both parties get bonuses (100 / 50).
- Hook into `PostController::store` — if post has at least one image *and* is a review (tagged_vendor_id set), award +10 pts.
- Tests: redeem creates voucher + debits, tier free-delivery applied at quote, referral idempotent, review-photo bonus once-per-post.

### Web + Mobile
- "Redeem points" sheet on profile / settings.
- Tier perk pill on checkout summary ("Free delivery from your Gold tier").
- Referral page with shareable code + share sheet.

---

## Phase 39 — Composer v2

**Tiers:** Backend + Web + Mobile · **Priority:** MEDIUM

### Goal
Make posts richer: polls, food tagging, mentions, drafts.

### Schema check
- `posts.type` already supports `'poll'`. Need `post_polls (post_id, question, multi?, ends_at)` + `post_poll_options (poll_id, body, votes_count)` + `post_poll_votes (poll_id, option_id, user_id)` UNIQUE.
- `posts.tagged_vendor_id` / `tagged_item_id` exist. Re-use.
- `post_drafts (user_id, body, media JSON, updated_at)` for autosave.

### Backend
- `POST /posts` accepts `poll: {question, options[], multi, ends_in_hours}`.
- `POST /posts/{id}/poll/vote` `{option_id}` — single or multi based on `multi`.
- `POST /drafts` upsert / `GET /drafts` / `DELETE /drafts/{id}`.
- `POST /posts/parse-mentions` server-side helper that returns resolved `@username` and `@vendor:item` matches for client preview.

### Web + Mobile
- Composer adds a Poll tab (2–4 options, duration picker).
- Inline `@` mention picker (debounced search). On `@vendor:` start, switch to item-search picker for the selected vendor.
- Draft autosave every 5 s; restored on next open.

---

## Phase 40 — Stories v2

**Tiers:** Backend + Web + Mobile

### Goal
Stories that are actually social, not just a 24 h photo dump.

### Schema check
- `stories` + `story_views` exist (P27). Need `story_highlights` (P28) + `story_replies (story_id, user_id, body, created_at)` + `story_mentions (story_id, mentioned_user_id)`.

### Features
- Story replies → DM the author (re-uses chat infra).
- Story mention `@username` → notification of new type `story_mention` (already in P34 enum).
- Music sticker (link to a track, no actual audio playback in v1).
- Highlights cover editor on `/profile`.
- Story-views list (already in API) with viewer avatars on a sheet.

---

## Phase 41 — Chat v3

**Tiers:** Backend + Web + Mobile · **Priority:** MEDIUM

### Schema check
- `messages` has `body` only. Add `attachments JSON` + `kind` (`text|voice|file|image`).
- `voice_notes (message_id, url, duration_ms, waveform_peaks JSON)`.

### Backend
- `POST /conversations/{id}/messages` accepts attachments array.
- `GET /conversations/{id}/starred` — already in P29; add a page.
- `GET /conversations/search?q=` — global cross-conversation search.

### Features
- Voice notes: hold-to-record button, waveform peaks computed client-side and shipped to server, playback with scrubber.
- File/image messages with thumbnails.
- Starred-messages page.
- Conversation pin / mute already work — surface UI in v3.

---

## Phase 42 — Vendor v4

**Tiers:** Backend + Web (mobile optional)

### Goal
The day-to-day vendor cockpit.

### Schema check
- `happy_hours (vendor_id, days_of_week JSON, starts_at TIME, ends_at TIME, discount_percent, item_id?)`. New table.
- `menu_category.sort_order` exists; need a `PATCH /vendor/menu/categories/reorder` endpoint accepting `[{id, sort_order}]`.

### Features
- **Kanban orders board** at `/vendor/orders` — columns `pending`/`accepted`/`preparing`/`ready`/`out_for_delivery`/`delivered`. Drag to advance.
- **Satisfaction donut** on `/vendor` home (rating distribution last 30 days).
- **Flash-deal create UI** (the endpoint exists since P31).
- **Happy hours** — recurring time-based discount, automatically applied at quote.
- **Sticky category tab bar** that highlights the active category as the menu scrolls.
- **Drag-to-reorder categories** via `@dnd-kit/sortable`.

---

## Phase 43 — Admin v4

**Tiers:** Backend + Web

### Features
- `/admin/revenue` chart page (gross / commission / net over time, by vendor segment).
- System-health widget on `/admin` home (reuses `/admin/system-health` from P32).
- `/admin/audit` log viewer with filter (actor / action / date range).
- `/admin/roles` — role + permission matrix (`spatie/laravel-permission` or hand-rolled if scope is small).
- Content moderation queue 2.0 — auto-flag posts with banned words; flag is just a hint, doesn't auto-act.
- Audit-log immutability (append-only table + hash chain).

---

## Phase 44 — Delivery v2

**Tiers:** Backend + Web + Mobile

### Schema check
- `deliveries` lives inside `orders.delivery_partner_id` (from P26 migration). For batch + routing we likely need a `delivery_batches (id, courier_id, status, started_at, ended_at)` + `order.delivery_batch_id`.

### Features
- Live courier map on `/orders/[id]` (WebSocket position updates from delivery app).
- Route optimization (greedy nearest-neighbour + then 2-opt for small batches; OR-Tools is overkill at this scale).
- Batch deliveries: courier accepts 2–3 nearby orders, app shows ordered stops.
- Courier earnings ledger + weekly summary.

---

## Phase 45 — Reviews v2

**Tiers:** Backend + Web + Mobile

### Schema check
- Add `order_ratings.helpful_count` + `order_ratings.video_url`.
- New `review_votes (review_id, user_id, helpful)` UNIQUE.

### Features
- Thumbs up/down review helpfulness.
- Video reviews (30 s cap, signed URL upload).
- Verified-purchase badge (every review is from an order rating — always true here).
- Photo gallery aggregating all review images on `/vendors/[id]`.
- Vendor reply UI polish (visual distinction, "Vendor" badge).

---

## Phase 46 — Performance v2

**Tiers:** Backend + Web + Mobile

### Goal
Take the savings from P35 and push them further. Measure before AND after — never optimize blind.

### Backend
- **ETags + Conditional GET** on `/vendors`, `/vendors/{id}`, `/menu`, `/explore`. Compute from `updated_at` + child count.
- **N+1 audit** with `barryvdh/laravel-debugbar` + `beyondcode/laravel-query-detector` in dev. Fix anything that fires > 1 query per row.
- **Query cost budget** in CI — fail if any endpoint test exceeds N queries (configurable per endpoint).
- **Persistent DB connection pool** via `pdo_options` (`PDO::ATTR_PERSISTENT => true`) — measure first; if it doesn't help, document why.
- **Cache warming** — schedule a job to pre-warm `explore:shared` and top-10 `vendor:{id}:menu` every minute.
- **Redis-backed broadcast queue** for notifications (currently sync in tests).
- **Read replicas** in `config/database.php` — split SELECTs.

### Media
- **WebP + AVIF** conversion job (Intervention\Image). Store original + 1–2 variants per breakpoint.
- **CDN signed URLs** (Cloudflare R2 + signed URLs or AWS S3 + presigned).
- `<Image>` responsive variants via `srcset`.

### Web
- `next/image` everywhere instead of `<img>`.
- Per-route bundle audit (`@next/bundle-analyzer`).
- Move infrequently-used providers behind `next/dynamic`.
- React Compiler: re-audit memoization (Compiler may now handle what was manually `useMemo`'d).

### Mobile
- `expo-image` everywhere (the prompt called this out — verify).
- `InteractionManager.runAfterInteractions()` for heavy on-mount work.
- Prefetch next feed page at 80% scroll.

---

## Phase 47 — Observability + ops

**Tiers:** Backend + Web + Mobile

### Backend
- **Structured logs** — Monolog JSON formatter; one event per request with `trace_id`, `user_id`, `route`, `duration_ms`.
- **OpenTelemetry** spans for HTTP / DB / Cache / external HTTP. Ship to a collector (Honeycomb / Tempo / Jaeger).
- **Sentry** for backend (`sentry/sentry-laravel`).
- **Slow-query monitor** — log any query > 200 ms with bindings + stack.
- **SLO dashboard** — P95 latency by endpoint, error rate, queue depth.
- **On-call runbook** — `docs/RUNBOOK.md` with: known alerts, dashboards, escalation, rollback.

### Web
- `@sentry/nextjs` integration.
- Web Vitals reporting (`useReportWebVitals`) → analytics.

### Mobile
- `@sentry/react-native`.
- Crash-free sessions tracking.

---

## Phase 48 — Security & compliance

### Backend
- Tighten rate limits per route (login: 5/min/IP, signup: 3/min/IP, password reset: 3/hour/email).
- Audit-log table → append-only constraint (DB trigger on update/delete).
- PII redaction in logs (recursive scrubber for `password`, `token`, `email`, `phone`).
- GDPR: `POST /me/delete` enqueues a hard-delete job (purges posts, orders, reviews, profile, then deletes the user).
- CSP, COOP, COEP headers (Next.js middleware).
- Security headers via `SecurityHeaders` middleware (already exists — audit).
- Dependency scanning (`composer audit`, `npm audit`, Dependabot).
- Secret scanning (gitleaks pre-commit).
- OWASP Top-10 self-audit checklist in `docs/SECURITY.md`.

---

## Phase 49 — Accessibility & i18n

### Goal
A real WCAG 2.2 AA pass. Non-negotiable for any app handling money.

### Web
- Every interactive element has a visible focus ring.
- Color contrast audit (Tailwind tokens — check brand vs bg).
- `aria-label` on icon-only buttons; `aria-live` on toasts.
- Keyboard-only nav pass (every flow reachable without mouse).
- Skip-to-content link.
- Modal focus trap.
- Screen-reader testing (VoiceOver + NVDA).
- `next-intl` or `next-i18next` catalog. Seed English; scaffold ar-SA + hi-IN for RTL + non-Latin tests.

### Mobile
- `accessibilityLabel` / `accessibilityHint` on every Pressable.
- Dynamic type support (respect system font size).
- VoiceOver / TalkBack pass.
- RTL via `I18nManager.forceRTL` toggle.

### Backend
- API responses already use a stable envelope — good for i18n.
- Server-side error messages move to a translations file keyed by code.

---

## Phase 50 — AI assist

### Goal
Tasteful AI, not magic-wand sprinkle. Each feature has a clear job-to-be-done.

### Features
- **Smart search** — embed vendor + dish names; `GET /search?ai=1&q=spicy noodles` falls back to vector similarity when keyword zero-results.
- **Dish recommendations** on home — collaborative filtering over user × item delivered-order matrix.
- **Review summarization** — vendor page shows a 2-sentence digest ("Customers love the biryani; some called delivery slow").
- **Vendor inbox auto-replies** — suggest a draft for a review reply or a customer DM.
- **Image moderation** — pre-check post / story uploads; flag suspected adult/violent content for admin queue.
- **Onboarding interest detection** — given a couple of selected cuisines, suggest the next 3.

### Infra
- Use OpenAI / Anthropic via server-side calls (never expose API keys to client).
- Cache embeddings in `embeddings (subject_type, subject_id, vector)` table (`pgvector` if Postgres, else `numpy.array_str` JSON).
- Rate-limit per-user AI usage to control cost.

---

## Phase 51 — Growth & retention

### Features
- **Referrals 2.0** — share sheet with image card, attribution tracking, anti-abuse.
- **Share cards** — generate an OG image per post / vendor / order (`@vercel/og`).
- **Deep links** — universal links (web → mobile if installed).
- **Email digest** — weekly "your week in food" with stats + recommendations.
- **Push re-engagement** — 7-day inactive users get a nudge.
- **A/B framework** — `experiments (key, variants, weights)` + `experiment_assignments`. Server-side decision, cookie / SecureStore stickiness.

---

## Phase 52 — Mobile platform polish

- **Haptics everywhere** (`expo-haptics`). Light on tap, success on order placed, warning on errors.
- **Deep links** for orders, posts, vendors.
- **Share extension** (iOS) / **Share target** (Android) — share a photo into FoodZone to compose a post.
- **Apple Watch widget** — order status + nearby flash deals.
- **Live Activities** for order tracking.
- **App Clips** (iOS) / **Instant Apps** (Android) — order from a vendor without installing.
- **iOS Shortcuts** integration ("Order my usual").

---

## Phase 53 — Web platform polish

- **PWA** with installable manifest + service worker.
- **Offline cart** — IndexedDB + sync on reconnect.
- **Push notifications** in browser (VAPID).
- **Web Share Target** — receive shares from native apps.
- **File System Access API** — export order receipt as PDF locally.
- **View Transitions API** for cross-route animations.
- **Speculation Rules** for instant nav.

---

## Phase 54 — Vendor onboarding + payouts

### Features
- Onboarding wizard for new vendors (business license upload, KYC, bank verification, menu starter pack).
- Payouts dashboard with per-day breakdown (already partial in P31).
- Auto-generated tax invoices (PDF) per payout.
- Multi-outlet — `vendors` becomes a brand, with `outlets (vendor_id, address, lat, lng)`.
- Staff roles (manager / cashier / cook) with scoped permissions.

---

## Phase 55 — Order modes

### Features
- **Group orders** — host shares a join link, friends add to a shared cart, host pays.
- **Scheduled orders** — order now for delivery at a chosen time.
- **Subscriptions** — weekly recurring orders (lunch every Tue/Thu).
- **Gift cards** — buy + redeem (creates a topup transaction on redemption).
- **Corporate accounts** — billing entity, multiple riders, monthly invoice.

---

## Phase 56 — Marketplace + ads

### Features
- **Sponsored vendors** in `/vendors` + `/explore` (clearly labeled).
- **Promoted items** in search results.
- **Search ads** with `ad_impressions` + `ad_clicks` tables.
- **Attribution** — link sponsored impressions to delivered orders.
- **Bid management** UI for vendors.
- Strict labelling and frequency caps to avoid ad fatigue.

---

## Phase 57 — Data platform

### Build
- **Events pipeline** — every user action emits a typed event (`event_name`, `props`, `ts`, `user_id?`, `device_id`).
- **Sink** — start with Postgres `events` table; later S3 + Athena.
- **Warehouse** — DuckDB locally; BigQuery / Snowflake at scale.
- **dbt** models for revenue, retention, cohorts.
- **Dashboards** — Metabase or Grafana with SQL queries.
- **Experimentation** — log each `experiment_assignment` event; compute lift in dbt.

---

## Phase 58 — DevEx & infra

- **Typed API client** — generate TS types from a Laravel-side schema dump (`spatie/laravel-typescript-transformer`).
- **Error budgets** in CI — fail PR if test coverage drops > 1 pt.
- **Blue/green** deploys on the backend.
- **Infra-as-code** — Terraform for cloud resources, Helm for k8s.
- **Secrets rotation** automation.
- **Preview envs** — every PR gets a throwaway URL on web + a TestFlight build on mobile.
- **Faster CI** — parallel jobs, dependency caching, Docker layer caching.

---

## Phase 59 — Test & QA depth

- **Mutation testing** (`Infection` PHP, `Stryker` TS).
- **Contract tests** between API + clients (pact-php / pact-js).
- **Visual regression** (Chromatic / Percy / Loki).
- **E2E** — Playwright for web, Detox for mobile, against seeded data.
- **Load tests** with k6 against staging.
- **Chaos** — kill the queue worker mid-job, drop the DB connection mid-request; verify graceful recovery.

---

## Phase 60 — Design system maturity

- **Storybook** for every UI primitive (`components/ui/*`).
- **Design tokens v2** — match Figma → code via Style Dictionary.
- **Motion spec** — codify durations / easings / spring configs.
- **Dark-mode parity audit** — every screen has a usable dark variant.
- **Brand asset kit** — logo lockup variants, social card templates, email templates.

---

## Cross-cutting code-quality wins

These don't need a phase — drop them in whenever you touch the file.

### Backend
- Replace ad-hoc DB::raw aggregations with named query scopes (e.g. `Order::scopeDeliveredIn($q, $window)`).
- Extract `LoyaltyService::TIER_THRESHOLDS` to a `config('loyalty.tiers')` so product can tune without a migration.
- Form Requests for every `validate()` call — current code is split.
- Resource `additional()` data for envelope metadata instead of ad-hoc array merging.
- Consolidate "delivered" filters into one constant (right now it's a string in many places, an enum in others).
- Type every controller return as `JsonResponse` — most do; some don't.
- Add `php-cs-fixer` + `phpstan level 8` to CI.

### Web
- Audit every `useEffect` for the React Compiler `set-state-in-effect` rule — derive instead.
- Centralise toast variants (success/error/info) into a single helper instead of `toast.success(...)` calls scattered.
- Standardise pagination via a `usePaginated` hook to kill `data.pages.flatMap` boilerplate.
- Move all role checks behind `useAuth().hasRole('admin')` instead of `user?.role === 'admin'` lookups.
- One canonical `ApiError` handler in `lib/api.ts` (right now error formatting is duplicated).
- Replace `<img>` with `next/image` everywhere (currently fenced with `// eslint-disable-next-line @next/next/no-img-element`).
- Bundle every page below 100 KB First Load JS (check with `@next/bundle-analyzer`).

### Mobile
- Audit `FlatList` remaining usage — there are 8 left after P35; pick the ones with ≥ 50 expected items.
- Wrap every list item with `React.memo` once props are stable.
- Centralise theme tokens — `useTheme()` is good but some screens reach into `Colors[…]` directly.
- Replace `Alert.alert` confirm flows with proper modals (Alert is iOS-modal-heavy).
- `expo-router` typed links — generate `Href` types so `router.push('/u/' + username)` becomes type-safe.

### Shared
- Repository-level `CONTRIBUTING.md` summarising the conventions in this doc.
- Top-level `Makefile` / `justfile` for the three-codebase orchestration (`just dev`, `just test`, `just build`).
- Conventional commits + semver via `release-please`.
- A monorepo move to `pnpm` workspaces if the three codebases get any tighter (don't do this prematurely).

---

## UI / UX micro-improvements catalogue

A grab-bag. Each one is < 1 hour and noticeably improves polish.

### Feedback & affordance
- Loading skeletons that match the shape of the eventual content (not generic boxes).
- Optimistic UI for like / save / follow — no spinner on tap.
- Disabled state for buttons during pending mutations, with a clear hint why.
- Success animations (checkmark draw-in) on order placed, payment done, points earned.
- Error states with retry, not just a frowny face.
- Empty states with a primary action ("No orders yet — Browse restaurants").

### Forms
- Real-time validation with positive feedback ("Looks good ✓").
- Password strength meter (entropy not regex).
- Phone number formatter while typing.
- Address autocomplete (Google Places or OpenStreetMap Nominatim).
- "Show password" toggle.
- Auto-focus the first invalid field after submit.
- Save form drafts across navigation.

### Lists & cards
- Pull-to-refresh on every paginated screen.
- Sticky section headers in long lists.
- "New since last visit" pip on conversation rows.
- Long-press context menu on posts / orders / messages.
- Swipe actions (delete, archive, mark unread).

### Navigation
- Back-swipe gesture on every iOS screen.
- Persistent tab state when returning to a tab.
- Tab badge animations (bounce on increment).
- Modal close on backdrop tap + Esc key.

### Typography & layout
- Single H1 per page.
- Generous whitespace; resist the urge to cram.
- Truncate long names with ellipsis + full text in a tooltip.
- Tabular figures for prices and counts (`font-variant-numeric: tabular-nums`).
- Underline links on hover, not by default.

### Color & contrast
- Dark mode parity (each token has a dark variant).
- WCAG AA contrast on every text block.
- Status colors are semantic (red = danger, amber = warning, green = success) and never the only signal.
- Never relying on color alone (add an icon).

### Motion
- 200–250 ms for most transitions; never longer than 400.
- `prefers-reduced-motion` respected.
- Spring physics on swipe-driven elements, not ease-in-out.
- No motion on initial page load (it feels broken on slow networks).

### Inputs
- Numeric keypad for phone / OTP / price fields.
- `inputMode="email"` / `autoComplete` hints everywhere.
- Submit on Enter for single-field forms.
- Clear button (×) inside long input fields.

### Imagery
- `loading="lazy"` on web images below the fold.
- `expo-image` placeholder with `transition={200}` blur-up.
- Aspect-ratio container to avoid CLS.
- Image fallback to initial letter + brand color.

### Money & dates
- Locale-aware currency formatting (`Intl.NumberFormat`).
- Relative dates for recent (`5 min ago`), absolute for old (`3 Mar`).
- Time zones respected on order timeline.

### Accessibility
- `aria-current="page"` on the active nav item.
- `aria-busy` on loading regions.
- Focus visible ring, not just outline.
- Skip-to-content link.

### Mobile-specific
- Bottom safe-area inset on every scroll view.
- Pull-to-refresh on tabs.
- Keyboard avoidance on inputs (`KeyboardAvoidingView`).
- Tap targets ≥ 44 × 44 pt.
- Haptic feedback on key actions.

### Web-specific
- Hover states for every interactive element.
- Cursor: pointer on clickable non-anchors.
- Focus visible on keyboard nav.
- Sticky table headers in long tables.

---

## Schema reality reference

Current as of 2026-05-29. Verify before relying on this.

### Users / auth
`users`, `user_profiles`, `user_addresses`, `password_reset_tokens`, `sessions`, `personal_access_tokens` (Sanctum).

### Social
`posts` (`likes_count, comments_count, shares_count` denormalised), `post_likes`, `post_comments`, `post_media`, `post_shares`, `saved_posts`, `stories`, `story_views`, `story_highlights`, `follows`, `blocks`.

### Food ordering
`vendors`, `operating_hours`, `menu_categories`, `menu_items` (+ `variants`, `addons`, `images`), `vendor_user_blocks`, `inventory_items`, `flash_deals`, `vouchers`, `voucher_redemptions`.

### Orders
`orders` (+ `delivery_partner_id`), `order_items`, `order_status_history`, `order_ratings`.

### Chat
`conversations`, `conversation_user`, `messages`, chat-v2 tables for star/react/forward (see P29 migration).

### Notifications + onboarding
`notifications`, `notification_preferences` (P34), `push_tokens`. `users.onboarding_completed` (P34).

### Admin
`violations`, `violation_actions`, `audit_logs`, `payments`.

### Loyalty
`user_loyalty`, `loyalty_transactions`, `badges`, `user_badges` (P36).

### NOT in DB (despite what older notes may say)
- `hashtags` / `hashtag_post` — hashtags are extracted at request time via regex.
- No `user_reports` / `post_reports` / `comment_reports` — the unified `violations` queue covers reports (P32).
- No `loyalty_redemptions` yet — add in P38.
- No `referrals` table yet — `users.referred_by` exists; add a referrals table in P38.
- No `data_exports` yet — add in P37.

---

## Glossary of conventions

- **Cadence** — verify schema → backend → web → mobile → docs → trackers + memory.
- **Verify schema** — grep `Schema::create('foo'` and inspect the migration; do not trust memory.
- **Tests live** in `tests/Feature/` named `<Phase><Area>Test.php`.
- **Migrations** named `YYYY_MM_DD_NNNNNN_<topic>.php`.
- **Resources** materialise via `->resolve()` when going into a cache.
- **Web hooks** in `lib/hooks/use-<area>.ts`. Pages in `app/(app)/<area>/page.tsx`.
- **Mobile hooks** in `src/lib/hooks.ts` (single file). Screens in `src/app/<area>.tsx`.
- **Doc per phase** at `docs/WORKPHASE-N.md`, indexed in `docs/WORKPHASES.md`, summarised in `docs/PROGRESS.md`.
- **Memory** — append to `C:\Users\HP\.claude\projects\E--Project\memory\foodzone-v3-roadmap.md` (or start a v4 file for P37+); update `MEMORY.md` index.
- **Definition of done** — full backend suite passes, web `build` + `lint` clean, mobile `tsc` + `expo lint` + `expo export` clean on web/iOS/Android.

---

## Closing note

This document is **not** a contract. It is a menu. Read the relevant section before starting, decide what's in scope, and write a tight workphase doc that explains *what* shipped and *why*. Future-you will thank present-you.

If you finish a phase and it's not in this file, add it. If you read this file and a phase no longer makes sense, delete it. This is a living document, treat it like one.

— Last revised: 2026-05-29
