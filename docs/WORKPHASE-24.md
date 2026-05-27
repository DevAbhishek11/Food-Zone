# Workphase 24 — Production hardening

**Tiers:** Backend + Web · **Status:** ✅ Done · **Final roadmap phase**

## Goal
Harden the platform for production: security response headers, API rate
limiting, an immutable audit trail of moderation actions, and a CI pipeline.

## Backend (`FoodZoneServer/`)
- **Security headers** — `SecurityHeaders` middleware appended to the `api`
  group: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-XSS-Protection: 0`,
  `Permissions-Policy`, and HSTS over HTTPS only.
- **Rate limiting** — named limiters in `AppServiceProvider`: `api` (120/min by
  user-or-IP) on the whole `/v1` group, and a stricter `auth` (20/min by IP) on
  the unauthenticated credential endpoints. Gated by `config('hardening.rate_limit')`
  so the functional test suite isn't throttled (set to false in `phpunit.xml`).
  429s already render in the standard envelope (`bootstrap/app.php`).
- **Audit logs** — `audit_logs` table + immutable `AuditLog` model (created_at
  only) + `AuditService::log(actor, action, target?, meta?)`. Wired into every
  admin moderation action (`user.banned/suspended/reinstated` incl. bulk,
  `vendor.approved/rejected`). `GET /admin/audit-logs` (filter by action/user)
  via `AuditLogResource`.
- `config/hardening.php` + `.env.example` document the knobs.
- `HardeningTest` — 3 tests (security headers present; auth endpoint returns 429
  past the limit with limiting enabled; admin ban writes an audit row and it is
  listed with its actor).

## Web (`foodzoneweb/`)
- `/admin/audit` page — filterable, paginated audit-log viewer with colour-coded
  actions, actor, target, reason, and time; an **Audit** tab added to `AdminNav`.
  `useAuditLogs` hook + `AuditLog` type.

## CI (`.github/workflows/ci.yml`)
- Three jobs on push/PR: **backend** (PHP 8.3 + Composer + `php artisan test` on
  in-memory SQLite), **web** (`npm ci` + `lint` + `build`), **mobile**
  (`npm ci` + `tsc --noEmit` + `expo lint`). Dependency caching for Composer/npm.

## Scope note
Mobile had no changes this phase (hardening is backend + the admin web console;
the mobile admin surface is minimal). Web push / VAPID remains out of scope.

## Key files
- Backend: `app/Http/Middleware/SecurityHeaders.php`, `bootstrap/app.php`,
  `app/Providers/AppServiceProvider.php` (rate limiters), `config/hardening.php`,
  `database/migrations/..._create_audit_logs_table.php`, `app/Models/AuditLog.php`,
  `app/Services/AuditService.php`, `app/Http/Resources/AuditLogResource.php`,
  `app/Http/Controllers/Api/V1/AdminController.php`, `routes/api.php`,
  `phpunit.xml`, `.env.example`, `tests/Feature/HardeningTest.php`
- Web: `lib/hooks/use-admin.ts` (`useAuditLogs`), `lib/types.ts` (`AuditLog`),
  `components/admin/AdminNav.tsx`, `app/(app)/admin/audit/page.tsx`
- CI: `.github/workflows/ci.yml`

## Verification
Backend **133 tests passing** (3 new; the rate-limit gate keeps the rest green).
Web `build` + `lint` clean (`/admin/audit`). Mobile unchanged (27 routes, last
green in P23). `admin/audit-logs` route registered; security headers verified on
live responses; auth throttle verified to 429.
