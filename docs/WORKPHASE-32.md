# Workphase 32 — Admin Console v3

**Tiers:** Backend + Web · **Status:** ✅ Done · **v3.0 roadmap**

## Goal
Turn the admin console into a real moderation + operations centre: a unified
reports queue (posts / comments / users), one-click moderation actions, a
revenue breakdown over windows, a vendor-feature toggle, a platform-wide
broadcast, and a system-health snapshot.

## Schema reality check
`violations` + `violation_actions` already existed (since P1) with a nullable
morph subject, `reported_by`, `handled_by`, and the right status set. **No new
schema needed** — those tables become the unified reports queue.

## Backend (`FoodZoneServer/`)
- **User-facing report endpoints** (auth) — each opens a `Violation`:
  - `POST /posts/{post}/report`
  - `POST /comments/{comment}/report`
  - `POST /users/{user}/report`
  Self-reports are rejected (422); the offender is the post/comment owner or
  the target user, the reporter is the caller.
- **Admin endpoints** (role `admin`/`super_admin`):
  - `GET /admin/violations?status=&type=&page=` — filterable, paginated, eager
    loads `user`/`reporter`/`actions`. `ViolationResource` returns a `subject_kind`
    (`post`/`comment`/`user`), the subject id, and a snippet of the offending
    body when applicable.
  - `POST /admin/violations/{violation}/action` `{action_type, days?, notes?}`
    — applies `dismiss | warn | suspend | ban | remove_content` atomically:
    notifies the offender, mutates user status / suspended_until / token list
    or deletes the subject as needed, writes a `ViolationAction` row, marks the
    violation `resolved/dismissed`, and records an `AuditLog` entry.
  - `GET /admin/revenue?days=N` — `{gross, commission, refunded, net}` plus a
    top-10 vendor slice for the window.
  - `PUT /admin/vendors/{vendor}/feature` — toggles `vendors.is_featured`
    (audit-logged as `vendor.featured` / `vendor.unfeatured`).
  - `POST /admin/broadcast` `{title, message, segment?}` — chunked sends a
    system notification to all users / users / vendors / admins / verified.
  - `GET /admin/system-health` — wraps the existing `HealthController` checks
    (database / cache / queue / storage) for the admin home.
- `AdminConsoleV3Test` (8) → **183 tests**.

## Web (`foodzoneweb/`)
- `AdminNav` gains **Reports** and **Broadcast** tabs.
- **`/admin/reports`** — open/resolved/dismissed/all status tabs, paginated
  violation cards with subject icon (post/comment/user), a snippet quote of the
  reported body, reporter link, and a **Resolve** button that opens a dialog
  with radio actions (Dismiss / Warn / Suspend [7-14-30] / Ban / Remove
  content) + optional notes for the audit log.
- **`/admin/broadcast`** — audience picker (All / Customers / Vendors /
  Verified), title + message inputs (char counter), and a live preview of the
  notification card; submit confirms before sending.
- Hooks `useViolations`, `useResolveViolation`, `useBroadcast` in
  `lib/hooks/use-admin-v3.ts`.

## Scope notes
The `/admin/revenue` chart page and the system-health widget on `/admin` home
are tracked as polish (the APIs are live). Mobile out of scope (admin is web).

## Key files
- Backend: `app/Http/Controllers/Api/V1/{AdminController,PostController,
  CommentController,UserController}.php`, `app/Http/Resources/ViolationResource.php`,
  `routes/api.php`, `tests/Feature/AdminConsoleV3Test.php`
- Web: `components/admin/AdminNav.tsx`, `lib/hooks/use-admin-v3.ts`,
  `app/(app)/admin/{reports,broadcast}/page.tsx`

## Verification
Backend **183 tests passing** (8 new). Web `build` + `lint` clean — **36 pages**
(was 34; +`/admin/reports`, `/admin/broadcast`). Mobile unchanged.
