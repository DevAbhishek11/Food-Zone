# Workphase 29 — Chat v2

**Tiers:** Backend + Web + Mobile · **Status:** ✅ Done · **v3.0 roadmap**

## Goal
Bring chat to WhatsApp/Telegram quality: pin & mute conversations, message
reactions, reply-to with quoted snippet, soft-delete-self ("This message was
deleted"), starred messages, in-conversation search, message forwarding, a
broadcast typing event, and support for non-text message types.

## Schema reality check
`messages` only had `id/conversation_id/user_id/body/timestamps`; no reactions,
reply, type, media, or soft-delete. `conversation_user` only had `last_read_at`.
This phase adds: `is_pinned/is_muted/muted_until` on the pivot, and
`replied_to_message_id/type/media_url/deleted_at` on messages, plus new
`message_reactions` and `starred_messages` tables.

## Backend (`FoodZoneServer/`)
- `Message` model uses `SoftDeletes`; new `repliedTo()`, `reactions()`,
  `starred()` relations. `Conversation::participants` exposes the new pivot
  columns.
- **Endpoints** (all participant-guarded):
  - `PUT /conversations/{c}/pin` — toggle.
  - `PUT /conversations/{c}/mute` `{muted, minutes?}` — sets `is_muted` +
    optional `muted_until`.
  - `POST /conversations/{c}/typing` — fires a `UserTyping` ShouldBroadcast
    event on the conversation channel (`user.typing`) for clients to subscribe.
  - `POST /messages/{m}/react` `{emoji}` — toggles (add/remove).
  - `POST/DELETE /messages/{m}/star` + `GET /conversations/{c}/starred`.
  - `DELETE /messages/{m}` — soft-delete; only the sender can.
  - `GET /conversations/{c}/search?q=…`.
  - `POST /conversations/{c}/forward` `{message_id}` — copies body/type/
    media_url into the target conversation; sender must be in the source.
  - `POST /conversations/{c}/messages` now also accepts `replied_to_message_id`
    (validated as same-conversation), `type`, and `media_url`.
- `MessageResource` carries `type`, `media_url`, `is_deleted`,
  `replied_to_message_id`, a `replied_to` snippet (when loaded), `reactions`
  grouped by emoji with `{emoji, count, mine}`, and `is_starred`. Trashed rows
  hide their body/media_url and clients render a "deleted" placeholder.
  `ConversationResource` adds `is_pinned`, `is_muted`, `muted_until`. Index
  orders pinned conversations first (`orderByPivot`).
- `ChatV2Test` (9) — pin ordering, mute, typing broadcast, reactions toggle,
  reply, soft-delete + non-sender 403, star list, in-conversation search,
  forward. **163 tests** total.

## Web (`foodzoneweb/`)
- **Thread page** rewritten: per-bubble hover toolbar (React picker, Reply,
  Delete-own); a reactions row underneath; a quoted `replied_to` mini-card
  inside the bubble; a deleted placeholder for trashed messages; a reply
  preview bar above the input that submits with `replied_to_message_id`.
- **Conversation list**: pin/mute icons inline next to the name; hover
  reveals quick Pin and Mute buttons; pinned items already come first from the
  server.
- Hooks: `useToggleReact`, `useDeleteMessage`, `useTogglePinConversation`,
  `useMuteConversation`, `useTyping`; `useSendMessage` accepts an object input
  (`SendMessageInput`).

## Mobile (`FoodZoneApp/`)
- **Thread screen**: long-press on a bubble opens an action sheet
  (`ActionSheetIOS` on iOS, a reactions bottom-sheet with Reply/Delete on
  Android/web) → React / Reply / Delete; reactions row; replied-to mini-card;
  "This message was deleted" italic placeholder; reply preview above input.
- **Conversation list**: pin icon shown next to the name when pinned, muted
  icon when muted; long-press → Pin/Unpin and Mute-for-1h / Unmute
  (`ActionSheetIOS` / Alert fallback).
- Hooks mirrored; types extended (`Conversation` pin/mute, `Message`
  reactions/replied_to/is_deleted/etc.).

## Scope notes
Reactions on the web open via a small picker; voice messages and the rich
message-attach UI are deferred (the schema already supports `type=image|voice|
file` + `media_url` so it's a UI follow-up). Starred-messages list endpoints
are live; a dedicated "Starred" UI page is deferred to a later polish pass.

## Key files
- Backend: `database/migrations/..._chat_v2_schema.php`,
  `app/Models/{Message,Conversation,MessageReaction,StarredMessage}.php`,
  `app/Events/UserTyping.php`,
  `app/Http/Resources/{MessageResource,ConversationResource}.php`,
  `app/Http/Controllers/Api/V1/ChatController.php`, `routes/api.php`,
  `tests/Feature/ChatV2Test.php`
- Web: `lib/types.ts`, `lib/hooks/use-chat.ts`,
  `app/(app)/messages/page.tsx`, `app/(app)/messages/[id]/page.tsx`
- Mobile: `src/lib/types.ts`, `src/lib/hooks.ts`,
  `src/app/messages/index.tsx`, `src/app/messages/[id].tsx`

## Verification
Backend **163 tests passing** (9 new). Web `build` + `lint` clean (31 pages).
Mobile `tsc` + `expo lint` clean and `expo export` bundles iOS + Android + web
(27 routes). 10 new chat v2 routes registered.
