# Workphase 3 — Mobile Application

**Tier:** Mobile (`FoodZoneApp/`) · **Status:** ✅ Done

## Goal
An Expo (React Native) app on the same API, mirroring the web app's flows with a
native tab navigation and dark-first theme.

## Notes on the framework
`FoodZoneApp` runs **Expo SDK 55** (React Native 0.83, React 19, expo-router 55,
typed routes, React Compiler) — newer than typical training data. Styling is
**StyleSheet-based** (no NativeWind). `Tabs`/`Stack`/`useLocalSearchParams` come
from `expo-router` (standard API). Token storage uses **expo-secure-store**
(with a web `localStorage` fallback).

## What was built

### Core library (`src/lib/`)
- `api.ts` — typed fetch client with the envelope + bearer token; `ApiError`.
- `token.ts` — SecureStore (native) / localStorage (web) + in-memory cache.
- `auth-store.ts` (Zustand, hydrates on launch), `cart-store.ts`, `hooks.ts`.
- `query-client.ts` — TanStack Query client.
- Theme extended in `src/constants/theme.ts` (brand/border/card/status colors,
  both light + dark).

### Routing & screens (`src/app/`)
- Root `_layout.tsx` — providers + auth-redirect gate (spinner until session resolves).
- `login`, `register`.
- `(tabs)` group via `Tabs` + Ionicons: `index` (feed), `vendors` (order),
  `orders`, `profile`.
- `vendor/[id]` — stack screen: menu, inline cart steppers, sticky checkout that
  places real orders.
- Loading / error / empty states throughout.

## Key files
- `src/lib/*`, `src/components/ui.tsx`, `src/components/post-card.tsx`
- `src/app/_layout.tsx`, `src/app/(tabs)/*`, `src/app/vendor/[id].tsx`
- `.env` → `EXPO_PUBLIC_API_URL`

## Verification
```bash
npx tsc --noEmit
npx expo lint
npx expo export --platform web      # Metro bundles all routes
npm start                           # press i / a / w
```
> Android emulator: set `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1`.
> Verification is via typecheck + lint + Metro bundle (no simulator in CI).
