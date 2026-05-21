# FoodZone API — Reference (v1)

Base URL (local): `http://127.0.0.1:8000/api/v1`

## Conventions

**Auth:** Bearer token (Laravel Sanctum). Send `Authorization: Bearer <token>` and
`Accept: application/json` on every request. Tokens are returned by `register` and `login`.

**Standard response envelope:**

```json
{ "success": true,  "message": "OK", "data": { } }
{ "success": false, "message": "...", "errors": { "field": ["..."] } }
```

Paginated lists add a `meta` block: `{ current_page, last_page, per_page, total, has_more }`.

**HTTP error codes:** 401 unauthenticated · 403 forbidden / banned / suspended ·
404 not found · 422 validation or business-rule failure · 429 rate limited · 500 server error.

---

## Auth  `/auth`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/register` | – | name, username, email, password(+confirmation), phone?, dob?, gender? |
| POST | `/login` | – | email, password. 5 failed attempts → 15-min lockout |
| POST | `/verify-email` | – | email, token |
| POST | `/forgot-password` | – | email |
| POST | `/reset-password` | – | token, email, password(+confirmation) |
| POST | `/logout` | ✓ | revokes current token |
| GET | `/me` | ✓ | current user + profile |
| POST | `/resend-verification` | ✓ | |

## Account  (auth required)
| Method | Path | Notes |
|---|---|---|
| PUT | `/profile` | name, username, bio, website, avatar, cover, is_private, food_preferences[], dietary_restrictions[] |
| POST | `/profile/deactivate` | soft-deactivate + revoke tokens |
| GET·POST·PUT·DELETE | `/addresses[/{id}]` | saved delivery addresses |

## Social
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/feed` | ✓ | personalized: followed + own + followers-only |
| GET | `/explore` | optional | recent public posts |
| POST | `/posts` | ✓ | body and/or media[] (≤10), privacy, location, tags |
| GET | `/posts/{id}` | optional | privacy enforced |
| PUT·DELETE | `/posts/{id}` | ✓ | owner/admin only |
| POST·DELETE | `/posts/{id}/like` | ✓ | idempotent |
| GET·POST | `/posts/{id}/comments` | optional·✓ | 1-level nesting |
| DELETE | `/comments/{id}` | ✓ | owner/admin |
| GET | `/users/{username}` | optional | profile + is_following/is_blocked |
| GET | `/users/{id}/followers`·`/following` | optional | |
| POST·DELETE | `/users/{id}/follow` | ✓ | private accounts → pending |
| POST·DELETE | `/users/{id}/block` | ✓ | block removes follows both ways |

## Notifications  (auth required)
`GET /notifications` · `GET /notifications/unread-count` ·
`POST /notifications/{id}/read` · `POST /notifications/read-all`

## Vendors & Menu
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/vendors` | optional | filters: city, q, open_now, min_rating |
| GET | `/vendors/{id-or-slug}` | optional | |
| GET | `/vendors/{id-or-slug}/menu` | optional | grouped by category |
| POST | `/vendors/register` | ✓ | submit application (→ pending) |
| GET | `/vendor/me` | ✓ | own vendor profile |
| PUT | `/vendor/store` | vendor | store settings |
| POST | `/vendor/store/toggle-open` | vendor | |
| GET·POST·PUT·DELETE | `/vendor/categories[/{id}]` | vendor | |
| GET·POST·PUT·DELETE | `/vendor/items[/{id}]` | vendor | variants/addons/images inline |
| POST | `/vendor/items/{id}/toggle-availability` | vendor | |

## Orders
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/orders` | user/admin | vendor_id, payment_method, items[], address_id?, voucher_code? |
| GET | `/orders` | ✓ | customer history (filter: status) |
| GET | `/orders/{id}` | ✓ | customer / vendor-owner / admin |
| POST | `/orders/{id}/cancel` | ✓ | customer, pending only |
| POST | `/orders/{id}/rate` | ✓ | delivered only, once, review ≥20 chars |
| GET | `/vendor/orders` | vendor | received orders |
| POST | `/vendor/orders/{id}/status` | vendor/admin | enforces lifecycle transitions |

Order lifecycle: `pending → accepted → preparing → ready → out_for_delivery → delivered`
(plus `cancelled`/`rejected`). Totals = subtotal − discount + delivery + tax; commission = subtotal × rate%.

## Admin  `/admin`  (role: admin)
`GET /dashboard` · `GET /users` · `PUT /users/{id}/ban|suspend|unban` ·
`GET /vendors` · `PUT /vendors/{id}/approve|reject`

## Health  `/health`  (public)
`GET /health` (aggregate) · `/health/database` · `/health/cache` · `/health/queue` · `/health/storage`

---

## Local setup

```bash
# DB: MySQL database `foodzoneserver` (configured in .env)
php artisan migrate:fresh --seed   # schema + demo data
php artisan serve                  # http://127.0.0.1:8000
php artisan test                   # 37 tests
```

Seeded logins (password `password`): `admin@foodzone.app`, `alice@example.com`.
