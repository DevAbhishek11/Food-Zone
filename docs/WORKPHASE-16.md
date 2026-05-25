# Workphase 16 — Meilisearch via Laravel Scout

**Tiers:** Backend (infra; clients benefit transparently) · **Status:** ✅ Done

## Goal
Add fast, relevant full-text search via **Laravel Scout + Meilisearch**, while keeping
the proven DB-`LIKE` `/search` as a graceful fallback so nothing regresses without a
search server.

## What was built
- **`laravel/scout` + `meilisearch/meilisearch-php`** installed.
- **`config/scout.php`** — default driver **`null`** (no-op engine; safe everywhere),
  `meilisearch` host/key from env, and **`index-settings`** declaring `filterableAttributes`
  (`status`, `city`, `privacy`, `user_id`) and sortable `rating_avg`.
- **`Searchable`** trait on `Vendor`, `User`, `Post`, each with:
  - `toSearchableArray()` — the indexed fields.
  - `shouldBeSearchable()` — **only approved vendors / public posts / non-banned users**
    are indexed (scoping enforced at index time, so it holds for Meilisearch too).
- **`SearchController`** now routes through Scout (`Model::search()`) **when
  `SCOUT_DRIVER=meilisearch`**, otherwise uses the existing DB-`LIKE` queries. Blocked
  users are excluded when hydrating results via Scout's `->query()` callback (works
  across engines since results are loaded from the DB).
- **`.env.example`** documents the production switch + `php artisan scout:import` step;
  `phpunit.xml` pins `SCOUT_DRIVER=null`.

## Production setup (documented)
```
# .env
SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_KEY=...
# index existing records + sync filterable settings
php artisan scout:sync-index-settings
php artisan scout:import "App\Models\Vendor"
php artisan scout:import "App\Models\User"
php artisan scout:import "App\Models\Post"
```

## Sandbox caveat
Meilisearch isn't running here, so the engine path is verified at the **config/code
level** (driver resolves to `meilisearch`, models are `Searchable`, index definitions
unit-tested). Dev/tests use `SCOUT_DRIVER=null` + the DB `/search` fallback, which stays
fully green.

## Key files
- `composer.json` (scout + meilisearch), `config/scout.php`, `.env.example`, `phpunit.xml`
- `app/Models/{Vendor,User,Post}.php` (Searchable + toSearchableArray + shouldBeSearchable)
- `app/Http/Controllers/Api/V1/SearchController.php` (Scout branch + DB fallback)
- `tests/Feature/ScoutSearchableTest.php`

## Verification
Backend **97 tests passing** — `ScoutSearchableTest` (index arrays + searchable scoping)
and the unchanged `SearchTest` (DB fallback) both green. `config('scout.driver')`
resolves to `meilisearch` when the env is set.
