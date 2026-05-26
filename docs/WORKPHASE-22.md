# Workphase 22 — Order timeline + Post detail (threaded comments)

**Tiers:** Backend (tests) + Web + Mobile · **Status:** ✅ Done

## Goal
Two "detail screen" features that deep-link from notifications and lists:
1. **Post detail** with full **threaded comments** — view a post on its own
   page/screen and reply to comments (one level deep), delete your own.
2. **Order detail** with the full **status-history timeline**, itemised
   breakdown (incl. variant/add-on labels), payment, and delivery partner.

The threaded-comment API (parent_id, single-level nesting, reply notifications,
cascade delete) and the `GET /posts/{post}` / `GET /orders/{order}` endpoints
already existed since P1; this phase builds the client experiences and locks
the API contract with tests.

## Backend (`FoodZoneServer/`)
- No new endpoints — `CommentController` already returns top-level comments with
  nested `replies`, enforces single-level nesting, notifies, and cascade-deletes;
  `OrderController@show` eager-loads `statusHistory`.
- `SocialTest` +2 tests locking the client-facing structure: index returns
  replies nested under top-level comments (top-level count only); deleting a
  parent removes its replies and corrects `comments_count`.

## Web (`foodzoneweb/`)
- **Threaded comments** — `CommentSection` rewritten with a recursive
  `CommentItem`: per-comment **Reply** (top-level only) + inline reply composer,
  **Delete** for own comments/admin, nested replies indented. `useAddComment`
  now takes `{ body, parentId }`; added `useDeleteComment`, `usePost`.
- **Post detail** — `/posts/[id]` renders the post with comments open
  (`PostCard` gained `defaultShowComments`); the feed card's timestamp links here.
- **Order detail** — `/orders/[id]` shows items (+customization labels), totals,
  payment, delivery partner, and a vertical **status timeline**; the orders list
  links here. `useOrder(id)` added.

## Mobile (`FoodZoneApp/`)
- Comment hooks added (`usePost`, `useComments`, `useAddComment`,
  `useDeleteComment`).
- **`post/[id]`** — post + threaded comments (`CommentRow` recursive: reply +
  delete, nested replies), keyboard-aware composer; the post card's comment
  button opens it.
- **`order/[id]`** — itemised breakdown (+customization labels), totals, payment,
  delivery partner, and a status timeline (reuses `useOrderDetail`); the orders
  list row opens it. Both screens registered in the root stack.

## Scope note
The roadmap originally bundled **vendor menu CRUD on mobile** into P22. To keep
each phase a coherent, reviewable slice, that is split into its own upcoming
phase (still tracked in `PROGRESS.md` backlog). P22 ships the two detail
features end-to-end.

## Key files
- Backend: `tests/Feature/SocialTest.php` (+2)
- Web: `lib/hooks/use-comments.ts` (usePost/useDeleteComment + reply),
  `components/feed/CommentSection.tsx`, `components/feed/PostCard.tsx`,
  `lib/hooks/use-orders.ts` (`useOrder`), `app/(app)/posts/[id]/page.tsx`,
  `app/(app)/orders/[id]/page.tsx`, `app/(app)/orders/page.tsx`
- Mobile: `src/lib/hooks.ts` (post/comment hooks), `src/lib/types.ts`,
  `src/app/post/[id].tsx`, `src/app/order/[id].tsx`, `src/app/_layout.tsx`,
  `src/components/post-card.tsx`, `src/app/(tabs)/orders.tsx`

## Verification
Backend **125 tests passing** (2 new). Web `build` + `lint` clean
(`/posts/[id]`, `/orders/[id]`). Mobile `tsc` + `expo lint` clean and
`expo export` bundles iOS + Android + web (**27 routes**, +2 for `/post/[id]`
and `/order/[id]`).
