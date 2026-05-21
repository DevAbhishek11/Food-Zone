# Workphase 2 — Web Application

**Tier:** Web (`foodzoneweb/`) · **Status:** ✅ Done

## Goal
A client-rendered Next.js 16 app that consumes the Phase 1 API with bearer-token
auth, matching the spec's stack (TanStack Query + Zustand) and dark-first design.

## Notes on the framework
`foodzoneweb` runs **Next.js 16** (App Router, Turbopack, React 19) — newer than
typical training data. Conventions followed: `useParams()` in client components
(`params` is async in server components), `middleware`→`proxy` rename, flat ESLint.
Bundled docs live in `node_modules/next/dist/docs/`.

## What was built

### Core library (`lib/`)
- `api.ts` — typed `fetch` client that unwraps the `{success,message,data}` envelope,
  attaches the bearer token, and auto-logs-out on 401; `ApiError` class.
- `token.ts` (localStorage), `auth-store.ts` (Zustand, hydrates session via `/auth/me`),
  `cart-store.ts` (persisted, single-vendor), `toast-store.ts`.
- `app/providers.tsx` — React Query provider with a global 401 → `/login` handler.
- Design tokens in `app/globals.css` (Tailwind v4 `@theme`, dark-first).

### Routes
- `/login`, `/register` — Zod + react-hook-form, server-error mapping.
- Guarded `(app)` group with a sidebar + mobile bottom-bar shell:
  - `/` — feed (composer, infinite scroll, optimistic likes, comments)
  - `/vendors` — restaurant search + filters
  - `/vendors/[id]` — menu grouped by category, cart, checkout (places real orders)
  - `/orders` — order history with status badges
  - `/profile` — account info + logout
- Loading skeletons, error-with-retry, and empty states throughout.

## Key files
- `lib/api.ts`, `lib/auth-store.ts`, `lib/hooks/*`
- `components/AppShell.tsx`, `components/ui/*`, `components/feed/*`, `components/vendors/*`
- `app/(app)/*`, `app/login`, `app/register`
- `.env.local` → `NEXT_PUBLIC_API_URL`

## Verification
```bash
npm run build     # TypeScript + route generation
npm run lint
npm run dev       # http://localhost:3000  (needs API on :8000)
```
