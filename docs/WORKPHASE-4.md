# Workphase 4 — Notifications

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done

## Goal
Surface the in-app notifications the backend already generates (likes, comments,
follows, order updates) as a real inbox with a live unread badge on both clients.

## Backend (`FoodZoneServer/`)
- `NotificationService` now accepts an optional `actor` and embeds an **actor
  snapshot** (`id/name/username/avatar`) into the notification `data` — wired through
  the like / comment / follow code paths.
- `NotificationResource` (returns `is_read`).
- New endpoints: `DELETE /notifications/{id}` and `DELETE /notifications` (clear all),
  alongside existing list / unread-count / mark-read / mark-all-read.
- `NotificationTest` — 6 tests (actor enrichment, listing isolation, unread count,
  mark one/all, ownership 403, delete/clear).

## Web (`foodzoneweb/`)
- An **"Inbox"** nav item in `AppShell` with a **live unread badge** (`useUnreadCount`,
  30s poll).
- `/notifications` page: per-type icons, actor avatars, unread dots, relative time,
  **mark-all-read** + **clear**, click-to-read with order deep-linking.

## Mobile (`FoodZoneApp/`)
- A 5th **"Inbox" tab** with a native `tabBarBadge` from the unread count.
- `(tabs)/inbox.tsx`: pull-to-refresh list, actor avatars / type icons, unread
  highlighting, tap-to-read, mark-all-read.

## Key files
- Backend: `app/Services/NotificationService.php`, `app/Http/Resources/NotificationResource.php`,
  `app/Http/Controllers/Api/V1/NotificationController.php`, `tests/Feature/NotificationTest.php`
- Web: `lib/hooks/use-notifications.ts`, `components/AppShell.tsx`, `app/(app)/notifications/page.tsx`
- Mobile: `src/lib/hooks.ts`, `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/inbox.tsx`

## Verification
Backend tests pass; web build + mobile bundle clean. Live: a like raised the
recipient's unread count to 1 with the enriched actor present.
