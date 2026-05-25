# Workphase 14 — Media Uploads + Auth Hardening

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done

## Goal
Replace URL-only media with a real upload pipeline, and harden authentication so
profile/account code can never break on a null/expired session.

## Backend (`FoodZoneServer/`)
- **`POST /media`** (`MediaController`) — validates an image (`mimes`, `max` from
  `config/media.php`), stores it on an **env-driven disk** (`MEDIA_DISK`, default local
  `public`), and returns an **absolute URL** + path + disk.
- `config/media.php` — `disk` / `max_kb` / `mimes`; set `MEDIA_DISK=s3` (or a
  Cloudinary-backed disk with a CDN `url`) in production — returned URLs stay absolute.
- `php artisan storage:link` wired for the local public disk.
- `MediaTest` — 4 tests (upload + path/url, rejects non-images, rejects oversized,
  requires auth).

## Auth hardening (Web)
- New **`lib/auth-context.tsx`** — an `AuthProvider` + `useAuth()` that exposes a
  **guaranteed non-null `user`** inside the authenticated `(app)` area. The guard layout
  only mounts it once the session resolves, so pages never crash on `null`.
- `app/(app)/layout.tsx` renders `<AuthProvider user={user}>`; `profile` and the post
  composer now consume `useAuth()` instead of optional store reads.
- API client already auto-clears the token + redirects on 401 (kept).

## Web media
- API client now sends **`FormData`** (multipart) correctly.
- `useUploadMedia` hook + reusable **`ImageUpload`** component (preview, change, remove).
- `useUpdateProfile` hook. Wired: **profile avatar** edit, **post composer** photo attach,
  **vendor menu item** photo.

## Mobile media
- **expo-image-picker** added (+ `app.json` config plugin with photo-permission string).
- API client `FormData` support; **`useMediaUpload`** (`pickAndUpload`) handles
  permission + pick + multipart upload.
- `useCreatePost` accepts media; `useUpdateProfile` added. Wired: **feed composer**
  photo attach + **profile avatar** (tap to change).

## Key files
- Backend: `app/Http/Controllers/Api/V1/MediaController.php`, `config/media.php`,
  `routes/api.php`, `tests/Feature/MediaTest.php`
- Web: `lib/auth-context.tsx`, `app/(app)/layout.tsx`, `lib/api.ts`,
  `lib/hooks/use-media.ts`, `lib/hooks/use-profile.ts`, `components/ui/ImageUpload.tsx`,
  `app/(app)/profile/page.tsx`, `components/feed/PostComposer.tsx`,
  `app/(app)/vendor/menu/page.tsx`
- Mobile: `src/lib/use-media.ts`, `src/lib/api.ts`, `src/lib/hooks.ts`,
  `src/app/(tabs)/index.tsx`, `src/app/(tabs)/profile.tsx`, `app.json`

## Verification
Backend **89 tests passing**; web build + lint clean; mobile tsc + lint + export clean
(22 routes). Live (port 8011): `POST /media` with a real PNG returned
`{ url, path, disk: "public" }` and persisted the file.

> Image optimization/resize is delegated to the CDN/storage layer (e.g. Cloudinary
> transforms or an S3+CDN image proxy) — the disk + absolute-URL design supports it
> without code changes. Server-side resize (intervention/image) can be added later.
