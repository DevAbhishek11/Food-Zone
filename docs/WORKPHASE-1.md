# Workphase 1 — Backend API Foundation

**Tier:** Backend (`FoodZoneServer/`) · **Status:** ✅ Done

## Goal
Build the Laravel API that both clients consume: database schema, authentication,
role-based access, the core social + commerce domains, consistent error handling,
health checks, and an automated test suite.

## What was built

### Data layer
- **26 migrations** covering: users (extended), user_profiles, user_addresses,
  vendors, operating_hours, menu_categories, menu_items, item_variants, item_addons,
  item_images, orders, order_items, order_status_history, order_ratings, posts,
  post_media, post_likes, post_comments, follows, blocks, notifications, vouchers,
  voucher_redemptions, violations.
- **24 Eloquent models** with relationships + PHP enums (`UserRole`, `UserStatus`,
  `VendorStatus`, `OrderStatus` with lifecycle transitions, `PostPrivacy`).
- Schema is portable: runs on **MySQL** (dev) and **SQLite** (tests).

### Auth & access control
- Sanctum **token auth**: register, login (5-attempt / 15-min lockout), email
  verification, password reset, logout, `me`.
- Middleware: `role:` (RBAC, super_admin bypass), `active` (blocks
  banned/suspended/deactivated; auto-lifts expired suspensions), `auth.optional`
  (personalises public endpoints for signed-in callers).

### Domains
- **Social** — posts CRUD, privacy-aware personalised feed, likes, 1-level comments,
  follow/unfollow (private accounts → pending), block.
- **Commerce** — vendor application → admin approval, menu CRUD (categories/items/
  variants/addons/images), order placement (commission, vouchers, delivery fees,
  min-order checks), enforced status transitions, ratings.
- **Admin** — dashboard metrics, user ban/suspend/reinstate, vendor approve/reject.
- **Notifications** + **health** (`/health` + per-service probes).

### Cross-cutting
- One global JSON exception handler → uniform `{ success, message, errors }` envelope
  (validation→422, auth→401, forbidden→403, not-found→404, throttle→429, server→500).
- `App\Support\ApiResponse` (incl. `paginated()`), `App\Exceptions\ApiException`.
- Factories + a demo seeder.

## Key files
- `bootstrap/app.php` — routing, middleware aliases, exception rendering
- `routes/api.php` — all `/api/v1` routes
- `app/Http/Controllers/Api/V1/*`, `app/Http/Resources/*`, `app/Services/*`
- `app/Enums/*`, `app/Models/*`, `database/migrations/*`
- `API.md` — endpoint reference

## Verification
```bash
php artisan migrate:fresh --seed
php artisan test          # feature suite (auth, social, vendor/menu, orders, health)
php artisan serve
```
72 routes registered under `/api/v1`. (Test count grows in later phases.)
