# FoodZone — Workphase Index

FoodZone is a social + multi-vendor food-ordering platform spanning **three codebases**:

| Folder | Stack | Role |
|---|---|---|
| `FoodZoneServer/` | Laravel 13 · PHP 8.5 · MySQL · Sanctum | REST API (`/api/v1`) |
| `foodzoneweb/` | Next.js 16 · React 19 · Tailwind v4 · TanStack Query · Zustand | Web app |
| `FoodZoneApp/` | Expo SDK 55 · React Native 0.83 · expo-router · TanStack Query · Zustand | Mobile app |

The full product spec lives in `FoodZone_PROJECT.md`. The API contract is in `FoodZoneServer/API.md`.

## Phases

| # | Phase | Tiers | Status |
|---|---|---|---|
| 1 | [Backend API foundation](WORKPHASE-1.md) | Backend | ✅ Done |
| 2 | [Web application](WORKPHASE-2.md) | Web | ✅ Done |
| 3 | [Mobile application](WORKPHASE-3.md) | Mobile | ✅ Done |
| 4 | [Notifications](WORKPHASE-4.md) | Backend + Web + Mobile | ✅ Done |
| 5 | [Reviews & ratings](WORKPHASE-5.md) | Backend + Web + Mobile | ✅ Done |
| 6 | [User profiles & following](WORKPHASE-6.md) | Backend + Web + Mobile | ✅ Done |
| 7 | [Vendor dashboard](WORKPHASE-7.md) | Backend + Web + Mobile | ✅ Done |
| 8 | [Admin console](WORKPHASE-8.md) | Backend + Web + Mobile | ✅ Done |
| 9 | [Search & discovery](WORKPHASE-9.md) | Backend + Web + Mobile | ✅ Done |
| 10 | [Favorites & reorder](WORKPHASE-10.md) | Backend + Web + Mobile | ✅ Done |
| 11 | [Address book & checkout](WORKPHASE-11.md) | Backend + Web + Mobile | ✅ Done |
| 12 | [Admin dashboard (enterprise)](WORKPHASE-12.md) | Backend + Web | ✅ Done |
| 13 | [Vendor dashboard (business-ready)](WORKPHASE-13.md) | Backend + Web + Mobile | ✅ Done |
| 14 | [Media uploads + auth hardening](WORKPHASE-14.md) | Backend + Web + Mobile | ✅ Done |
| 15 | [Infra: Redis, queues & caching](WORKPHASE-15.md) | Backend (infra) | ✅ Done |
| 16 | [Meilisearch via Scout](WORKPHASE-16.md) | Backend (infra) | ✅ Done |
| 17 | [Real-time via Reverb](WORKPHASE-17.md) | Backend + Web + Mobile | ✅ Done |
| 18 | [Chat / direct messages](WORKPHASE-18.md) | Backend + Web + Mobile | ✅ Done |
| 19 | [Payments (Razorpay/Stripe)](WORKPHASE-19.md) | Backend + Web + Mobile | ✅ Done |
| 20 | [Checkout depth (variants/add-ons + vouchers)](WORKPHASE-20.md) | Backend + Web + Mobile | ✅ Done |
| 21 | [Delivery partner flow](WORKPHASE-21.md) | Backend + Web + Mobile | ✅ Done |
| 22 | [Order timeline + post detail (threaded comments)](WORKPHASE-22.md) | Backend + Web + Mobile | ✅ Done |
| 23 | [Push notifications + email-verification UX](WORKPHASE-23.md) | Backend + Web + Mobile | ✅ Done |
| 24 | [Production hardening](WORKPHASE-24.md) | Backend + Web | ✅ Done |
| 25 | [Public landing page + role-separated auth](WORKPHASE-25.md) | Web | ✅ Done |
| 26 | [Design system overhaul](WORKPHASE-26.md) | Web + Mobile | ✅ Done |
| 27 | [Feed & post experience (stories/saved/share/hashtags)](WORKPHASE-27.md) | Backend + Web + Mobile | ✅ Done |

> 🚀 **v3.0 enhancement roadmap (P25–P36)** — `27May2026Prompt.md`: landing/auth,
> design-system overhaul, feed/profile/chat/vendor/admin/explore upgrades,
> notifications/onboarding, performance, advanced features. P25–P27 done.

> 📋 Live completed/pending work tracker: **[PROGRESS.md](PROGRESS.md)**.
> 🗺️ Production-grade roadmap (P12→P24): **[ROADMAP.md](ROADMAP.md)**.

## Build sequencing

Work was done **backend-first**: phases 1–3 build the API then layer the two clients on top.
From phase 4 onward each phase is a **vertical feature slice** delivered across all three tiers
at once (API → web → mobile), each with automated checks before being considered done.

## Running the whole system

```bash
# 1) API  (http://127.0.0.1:8000)
cd FoodZoneServer
php artisan migrate:fresh --seed
php artisan serve

# 2) Web  (http://localhost:3000)
cd foodzoneweb
npm run dev

# 3) Mobile  (Expo dev server)
cd FoodZoneApp
npm start            # press i / a / w  (Android emulator: set EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1)
```

Seeded logins (password `password`): `admin@foodzone.app`, `alice@example.com`.

## Verification status (latest)

| Tier | Command | Result |
|---|---|---|
| Backend | `php artisan test` | **146 passing** |
| Web | `npm run build` + `npm run lint` | clean (**31 pages**) |
| Mobile | `npx tsc --noEmit` + `npx expo lint` + `npx expo export` | clean (27 routes, iOS+Android+web) |
| CI | `.github/workflows/ci.yml` | backend + web + mobile jobs |
