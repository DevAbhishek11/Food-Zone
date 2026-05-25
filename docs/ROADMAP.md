# FoodZone — Production-Grade Roadmap (P12 →)

Foundations (P1–P3) and feature slices (P4–P11) are complete (see `WORKPHASES.md`).
This roadmap takes FoodZone to production grade. Each phase ships across the relevant
tiers with tests + a `WORKPHASE-N.md`, and updates `PROGRESS.md`.

| # | Phase | Focus | Status |
|---|---|---|---|
| 12 | **Admin Dashboard** | Analytics, charts, order monitoring, bulk user actions, CSV | ✅ Done |
| 13 | **Vendor Dashboard** | Sales analytics, full menu (variants/add-ons), hours editor, timeline | ✅ Done |
| 14 | **Media uploads** | `POST /media`, Laravel Filesystem (local→S3/Cloudinary), image optimize; wire avatars/posts/vendor/menu | ✅ Done |
| 15 | **Infra: Redis + Queues** | predis driver, queued jobs (notifications/email/media), cache strategy | ✅ Done |
| 16 | **Meilisearch (Scout)** | Fast relevant search with graceful DB fallback | ✅ Done |
| 17 | **Real-time (Reverb)** | Live notifications + order status; replace 30s polling | ✅ Done |
| 18 | **Chat / DMs** | User↔vendor messaging (real-time) | ✅ Done |
| 19 | **Payments** | Razorpay/Stripe: intent, webhook, refund | ⏳ Next |
| 20 | **Checkout depth** | Variants/add-ons + voucher/promo UX at checkout | ⏳ |
| 21 | **Delivery partner** | `delivery` role: assignment, accept, live status | ⏳ |
| 22 | **Order timeline + post detail** | Status history UI, threaded comments, mobile menu mgmt | ⏳ |
| 23 | **Push + email verification UX** | Expo push (FCM/APNs); verify-email screens | ⏳ |
| 24 | **Production hardening** | Security headers, rate limits, audit logs, logging/monitoring, CI, more tests | ⏳ |

## Notes on infrastructure phases (P15–P19)
Redis, Meilisearch, Reverb, and payment gateways are **not running in the current
sandbox**. They are implemented env-driven with graceful fallbacks and documented setup,
and verified at the code level (tests + build) — full runtime verification happens in an
environment where those services are available. Default `.env` keeps the working
database/array drivers; `.env.example` documents the production (Redis/Meilisearch) values.

## Conventions
- Backend-tested (`php artisan test`), web (`npm run build` + `lint`), mobile
  (`tsc` + `expo lint` + `expo export`) before a phase is "done".
- Structured API responses via `ApiResponse`; validation via Form Requests; RBAC via
  `role`/`active` middleware.
