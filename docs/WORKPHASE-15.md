# Workphase 15 — Infra: Redis, Queues & Caching

**Tiers:** Backend (infra; clients benefit transparently) · **Status:** ✅ Done

## Goal
Make cache/queue/session Redis-ready, move side-effects to background **queued jobs**,
and add a **caching layer** for hot analytics — without breaking the working dev setup.

## What was built
- **predis/predis** installed → `REDIS_CLIENT=predis` works without the PHP redis
  extension. `php artisan about` confirms cache/queue resolve to `redis` when env is set.
- **Queued jobs (`ShouldQueue`):**
  - `App\Jobs\RecalculateVendorRating` — recomputes a vendor's rating aggregate off the
    request path; dispatched from `OrderController@rate` (after the rating commits).
  - `VerifyEmailNotification` now implements `ShouldQueue` (email sent via the queue).
  - Both run **inline** under the `sync` driver (dev/tests) and **async** on Redis (prod),
    so behaviour is identical and tests stay green.
- **Caching:** admin analytics (`admin:analytics:{days}`) and vendor analytics
  (`vendor:{id}:analytics:{days}`) wrapped in `Cache::remember(..., 5 min)`. Heavy
  aggregate queries are computed once and served from cache (Redis in prod).
- **`.env.example`** documents the production switch: `CACHE_STORE`, `QUEUE_CONNECTION`,
  `SESSION_DRIVER` → `redis`, `REDIS_CLIENT=predis`, plus `MEDIA_DISK`. Dev keeps the
  database/local drivers so nothing requires extra services.

## Production runbook (documented)
```
# .env (production)
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_CLIENT=predis
# run a worker (e.g. via supervisor / horizon)
php artisan queue:work redis --tries=3
```

## Sandbox caveat
Redis is **not running** in this environment, so the Redis path is verified at the
**config/code level** (drivers resolve, predis autoloads, jobs dispatch & handle under
`sync`). Full runtime verification happens where a Redis server is available. Dev/test
defaults (database/array/sync) keep everything green here.

## Key files
- `composer.json` (predis), `config/media.php` (P14), `.env.example`
- `app/Jobs/RecalculateVendorRating.php`, `app/Http/Controllers/Api/V1/OrderController.php`
- `app/Notifications/VerifyEmailNotification.php`
- `app/Http/Controllers/Api/V1/AdminController.php`, `.../VendorController.php` (caching)
- `tests/Feature/QueueCacheTest.php`

## Verification
Backend **93 tests passing** (incl. `QueueCacheTest`: job dispatched on rate, job
recomputes aggregate, admin + vendor analytics cached). `php artisan about` with
`CACHE_STORE=redis QUEUE_CONNECTION=redis` resolves both to redis; predis autoloads.
