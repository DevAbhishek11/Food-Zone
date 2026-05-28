<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\MessageSent;
use App\Events\UserTyping;
use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageReaction;
use App\Models\StarredMessage;
use App\Models\User;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ChatController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    /** The current user's conversations, newest activity first. */
    public function index(Request $request): JsonResponse
    {
        $me = $request->user();

        $conversations = $me->conversations()
            ->with(['participants.profile', 'latestMessage'])
            ->orderByPivot('is_pinned', 'desc')
            ->orderByDesc('last_message_at')
            ->paginate(20);

        $conversations->getCollection()->each(function (Conversation $c) use ($me) {
            $pivot = $c->participants->firstWhere('id', $me->id)?->pivot;
            $lastRead = $pivot?->last_read_at;
            $c->unread_count = $c->messages()
                ->where('user_id', '!=', $me->id)
                ->when($lastRead, fn ($q) => $q->where('created_at', '>', $lastRead))
                ->count();
            $c->is_pinned = (bool) ($pivot?->is_pinned ?? false);
            $c->is_muted = (bool) ($pivot?->is_muted ?? false);
            $c->muted_until = $pivot?->muted_until;
        });

        return ApiResponse::paginated($conversations, ConversationResource::class, 'Conversations loaded.');
    }

    /** Find or start a 1:1 conversation with another user. */
    public function store(Request $request): JsonResponse
    {
        $me = $request->user();
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id', 'not_in:'.$me->id],
        ]);

        $other = User::findOrFail($data['user_id']);
        if ($me->hasBlocked($other->id) || $other->hasBlocked($me->id)) {
            return ApiResponse::error('You cannot message this user.', 403);
        }

        $conversation = Conversation::between($me->id, $other->id);
        if (! $conversation) {
            $conversation = DB::transaction(function () use ($me, $other) {
                $c = Conversation::create();
                $c->participants()->attach([
                    $me->id => ['last_read_at' => now()],
                    $other->id => ['last_read_at' => null],
                ]);

                return $c;
            });
        }

        $conversation->load(['participants.profile', 'latestMessage']);

        return ApiResponse::success(new ConversationResource($conversation), 'Conversation ready.', 201);
    }

    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        $this->assertParticipant($request, $conversation);
        $me = $request->user();

        $messages = $conversation->messages()
            ->withTrashed()                       // include soft-deleted with placeholder rendering
            ->with(['sender.profile', 'reactions', 'repliedTo'])
            ->withExists(['starred as is_starred' => fn ($q) => $q->where('user_id', $me->id)])
            ->latest()
            ->paginate(30);

        return ApiResponse::paginated($messages, MessageResource::class, 'Messages loaded.');
    }

    public function send(Request $request, Conversation $conversation): JsonResponse
    {
        $this->assertParticipant($request, $conversation);
        $me = $request->user();
        $data = $request->validate([
            'body' => ['nullable', 'string', 'max:5000'],
            'type' => ['nullable', Rule::in(['text', 'image', 'voice', 'file'])],
            'media_url' => ['nullable', 'string', 'max:2048'],
            'replied_to_message_id' => ['nullable', 'integer'],
        ]);

        $type = $data['type'] ?? 'text';
        if ($type === 'text' && empty($data['body'])) {
            return ApiResponse::error('Message body is required.', 422);
        }
        if ($type !== 'text' && empty($data['media_url'])) {
            return ApiResponse::error('media_url is required for non-text messages.', 422);
        }

        // Parent message must live in the same conversation.
        if (! empty($data['replied_to_message_id'])) {
            $parent = Message::find($data['replied_to_message_id']);
            if (! $parent || $parent->conversation_id !== $conversation->id) {
                return ApiResponse::error('Reply target is not in this conversation.', 422);
            }
        }

        $message = DB::transaction(function () use ($conversation, $me, $data, $type) {
            $message = $conversation->messages()->create([
                'user_id' => $me->id,
                'body' => $data['body'] ?? null,
                'type' => $type,
                'media_url' => $data['media_url'] ?? null,
                'replied_to_message_id' => $data['replied_to_message_id'] ?? null,
            ]);
            $conversation->update(['last_message_at' => now()]);
            $conversation->participants()->updateExistingPivot($me->id, ['last_read_at' => now()]);

            return $message;
        });

        $message->load(['sender.profile', 'repliedTo']);
        event(new MessageSent($message));

        // Notify the other participant.
        $other = $conversation->participants->firstWhere('id', '!=', $me->id)
            ?? $conversation->participants()->where('users.id', '!=', $me->id)->first();
        if ($other) {
            $preview = $type === 'text'
                ? str($data['body'] ?? '')->limit(60)
                : '📎 '.ucfirst($type);
            $this->notifications->notify(
                $other->id,
                'message',
                'New message',
                "{$me->username}: ".$preview,
                ['conversation_id' => $conversation->id],
                actor: $me,
            );
        }

        return ApiResponse::success(new MessageResource($message), 'Message sent.', 201);
    }

    public function markRead(Request $request, Conversation $conversation): JsonResponse
    {
        $this->assertParticipant($request, $conversation);
        $conversation->participants()->updateExistingPivot($request->user()->id, ['last_read_at' => now()]);

        return ApiResponse::success(null, 'Marked as read.');
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $me = $request->user();
        $count = 0;
        foreach ($me->conversations()->with('participants')->get() as $c) {
            $lastRead = $c->participants->firstWhere('id', $me->id)?->pivot?->last_read_at;
            $has = $c->messages()
                ->where('user_id', '!=', $me->id)
                ->when($lastRead, fn ($q) => $q->where('created_at', '>', $lastRead))
                ->exists();
            if ($has) {
                $count++;
            }
        }

        return ApiResponse::success(['unread' => $count], 'Unread conversations.');
    }

    /** Toggle pinned-for-me on this conversation. */
    public function pin(Request $request, Conversation $conversation): JsonResponse
    {
        $this->assertParticipant($request, $conversation);
        $me = $request->user();

        $current = (bool) $conversation->participants()->where('users.id', $me->id)->first()->pivot->is_pinned;
        $conversation->participants()->updateExistingPivot($me->id, ['is_pinned' => ! $current]);

        return ApiResponse::success(['is_pinned' => ! $current], ! $current ? 'Pinned.' : 'Unpinned.');
    }

    /** Set muted-for-me on this conversation, optionally with a duration. */
    public function mute(Request $request, Conversation $conversation): JsonResponse
    {
        $this->assertParticipant($request, $conversation);
        $data = $request->validate([
            'muted' => ['required', 'boolean'],
            'minutes' => ['nullable', 'integer', 'min:0', 'max:43200'],
        ]);

        $update = ['is_muted' => $data['muted'], 'muted_until' => null];
        if ($data['muted'] && ! empty($data['minutes'])) {
            $update['muted_until'] = now()->addMinutes($data['minutes']);
        }
        $conversation->participants()->updateExistingPivot($request->user()->id, $update);

        return ApiResponse::success($update, 'Mute updated.');
    }

    /** Broadcast a transient "user is typing" event. */
    public function typing(Request $request, Conversation $conversation): JsonResponse
    {
        $this->assertParticipant($request, $conversation);
        $me = $request->user();
        event(new UserTyping($conversation->id, $me->id, $me->username));

        return ApiResponse::success(null, 'Typing event sent.');
    }

    /** Toggle an emoji reaction on a message (one reaction-per-emoji per user). */
    public function react(Request $request, Message $message): JsonResponse
    {
        $this->assertParticipant($request, $message->conversation);
        $data = $request->validate(['emoji' => ['required', 'string', 'max:8']]);
        $me = $request->user();

        $existing = MessageReaction::where('message_id', $message->id)
            ->where('user_id', $me->id)
            ->where('emoji', $data['emoji'])
            ->first();

        if ($existing) {
            $existing->delete();
            $action = 'removed';
        } else {
            MessageReaction::create(['message_id' => $message->id, 'user_id' => $me->id, 'emoji' => $data['emoji']]);
            $action = 'added';
        }

        return ApiResponse::success(['action' => $action, 'emoji' => $data['emoji']], 'Reaction toggled.');
    }

    public function star(Request $request, Message $message): JsonResponse
    {
        $this->assertParticipant($request, $message->conversation);
        StarredMessage::firstOrCreate(['message_id' => $message->id, 'user_id' => $request->user()->id]);

        return ApiResponse::success(null, 'Message starred.', 201);
    }

    public function unstar(Request $request, Message $message): JsonResponse
    {
        $this->assertParticipant($request, $message->conversation);
        StarredMessage::where('message_id', $message->id)->where('user_id', $request->user()->id)->delete();

        return ApiResponse::success(null, 'Star removed.');
    }

    public function starred(Request $request, Conversation $conversation): JsonResponse
    {
        $this->assertParticipant($request, $conversation);
        $me = $request->user();

        $starredIds = StarredMessage::where('user_id', $me->id)
            ->whereIn('message_id', $conversation->messages()->withTrashed()->select('id'))
            ->pluck('message_id');

        $messages = Message::withTrashed()->whereIn('id', $starredIds)
            ->with(['sender.profile', 'reactions', 'repliedTo'])
            ->latest()
            ->paginate(30);

        $messages->getCollection()->each(fn ($m) => $m->is_starred = true);

        return ApiResponse::paginated($messages, MessageResource::class, 'Starred messages.');
    }

    /** Soft-delete the sender's own message — clients show a "deleted" placeholder. */
    public function deleteMessage(Request $request, Message $message): JsonResponse
    {
        if ($message->user_id !== $request->user()->id) {
            abort(403, 'You can only delete your own messages.');
        }
        $message->delete();

        return ApiResponse::success(null, 'Message deleted.');
    }

    /** Search a conversation's messages by body substring. */
    public function search(Request $request, Conversation $conversation): JsonResponse
    {
        $this->assertParticipant($request, $conversation);
        $q = trim((string) $request->query('q', ''));
        if (mb_strlen($q) < 2) {
            return ApiResponse::error('Search query must be at least 2 characters.', 422);
        }

        $messages = $conversation->messages()
            ->where('body', 'like', '%'.$q.'%')
            ->with('sender.profile')
            ->latest()
            ->paginate(20);

        return ApiResponse::paginated($messages, MessageResource::class, 'Search results.');
    }

    /** Forward an existing message into another conversation. */
    public function forward(Request $request, Conversation $conversation): JsonResponse
    {
        $this->assertParticipant($request, $conversation);
        $data = $request->validate(['message_id' => ['required', 'integer', 'exists:messages,id']]);

        $src = Message::findOrFail($data['message_id']);
        if (! $src->conversation->hasParticipant($request->user()->id)) {
            abort(403, 'You cannot forward a message from a conversation you are not in.');
        }

        $me = $request->user();
        $copy = $conversation->messages()->create([
            'user_id' => $me->id,
            'body' => $src->body,
            'type' => $src->type ?? 'text',
            'media_url' => $src->media_url,
        ]);
        $conversation->update(['last_message_at' => now()]);
        $copy->load(['sender.profile']);
        event(new MessageSent($copy));

        return ApiResponse::success(new MessageResource($copy), 'Message forwarded.', 201);
    }

    private function assertParticipant(Request $request, Conversation $conversation): void
    {
        if (! $conversation->hasParticipant($request->user()->id)) {
            abort(403, 'You are not part of this conversation.');
        }
    }
}
