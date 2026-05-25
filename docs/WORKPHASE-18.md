# Workphase 18 — Chat / Direct Messages

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done

## Goal
1:1 direct messaging between any two users (customer ↔ customer, customer ↔ vendor),
with real-time delivery over the P17 Reverb channels and a polling fallback.

## Backend (`FoodZoneServer/`)
- Schema: `conversations`, `conversation_user` (pivot with `last_read_at`), `messages`.
- Models: `Conversation` (participants, messages, `latestMessage`, `between()` finder),
  `Message`; `User::conversations()`.
- Endpoints (auth): `GET /conversations`, `POST /conversations` (find-or-create 1:1, block-aware,
  can't-message-self), `GET /conversations/unread-count`, `GET /conversations/{c}/messages`,
  `POST /conversations/{c}/messages`, `POST /conversations/{c}/read` — all participant-guarded.
- `ConversationResource` (other participant, last message, unread), `MessageResource` (`is_mine`).
- **`MessageSent`** broadcast event on `private-conversation.{id}` (`message.sent`); channel
  auth added to `routes/channels.php`. Sending also notifies the recipient (P4 notification +
  P17 broadcast).
- `ChatTest` — 5 tests (idempotent start, can't-self-message, send+read+broadcast,
  non-participant 403, list unread + last message + mark-read).

## Web (`foodzoneweb/`)
- `/messages` (conversation list with unread badges) and `/messages/[id]` (thread with
  bubbles, composer, **load older**, real-time via Echo on the conversation channel +
  mark-read). `lib/hooks/use-chat.ts`.
- A **Message** button on `/u/[username]` starts/opens a conversation.
- A **Messages** nav item with its own unread badge (separate from the notifications badge).

## Mobile (`FoodZoneApp/`)
- `messages/index` (list) + `messages/[id]` (inverted `FlatList` thread, KeyboardAvoiding
  composer, real-time via Echo). Chat hooks added to `src/lib/hooks.ts`.
- A **Message** button on the user profile screen; a chat icon in the Feed header.

## Key files
- Backend: `database/migrations/..._create_conversations_table.php`, `app/Models/{Conversation,Message}.php`,
  `app/Http/Controllers/Api/V1/ChatController.php`, `app/Http/Resources/{Conversation,Message}Resource.php`,
  `app/Events/MessageSent.php`, `routes/channels.php`, `routes/api.php`, `tests/Feature/ChatTest.php`
- Web: `lib/hooks/use-chat.ts`, `app/(app)/messages/page.tsx`, `app/(app)/messages/[id]/page.tsx`,
  `components/AppShell.tsx`, `app/(app)/u/[username]/page.tsx`
- Mobile: `src/lib/hooks.ts`, `src/app/messages/index.tsx`, `src/app/messages/[id].tsx`,
  `src/app/user/[username].tsx`, `src/app/(tabs)/index.tsx`, `src/app/_layout.tsx`

## Verification
Backend **105 tests passing**; web build + lint clean (`/messages`, `/messages/[id]`);
mobile tsc + lint + export clean (24 routes). Live: alice→admin conversation, message
`is_mine=true`, admin's list shows `unread=1` + the last message. Real-time uses Reverb
(P17) when configured; otherwise the list/thread refresh via query polling.
