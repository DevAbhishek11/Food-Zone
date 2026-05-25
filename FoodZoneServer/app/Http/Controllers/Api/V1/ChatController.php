<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\User;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    /** The current user's conversations, newest activity first. */
    public function index(Request $request): JsonResponse
    {
        $me = $request->user();

        $conversations = $me->conversations()
            ->with(['participants.profile', 'latestMessage'])
            ->orderByDesc('last_message_at')
            ->paginate(20);

        $conversations->getCollection()->each(function (Conversation $c) use ($me) {
            $lastRead = $c->participants->firstWhere('id', $me->id)?->pivot?->last_read_at;
            $c->unread_count = $c->messages()
                ->where('user_id', '!=', $me->id)
                ->when($lastRead, fn ($q) => $q->where('created_at', '>', $lastRead))
                ->count();
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

        $messages = $conversation->messages()
            ->with('sender.profile')
            ->latest()
            ->paginate(30);

        return ApiResponse::paginated($messages, MessageResource::class, 'Messages loaded.');
    }

    public function send(Request $request, Conversation $conversation): JsonResponse
    {
        $this->assertParticipant($request, $conversation);
        $me = $request->user();
        $data = $request->validate(['body' => ['required', 'string', 'max:5000']]);

        $message = DB::transaction(function () use ($conversation, $me, $data) {
            $message = $conversation->messages()->create([
                'user_id' => $me->id,
                'body' => $data['body'],
            ]);
            $conversation->update(['last_message_at' => now()]);
            // Sender has implicitly read up to their own message.
            $conversation->participants()->updateExistingPivot($me->id, ['last_read_at' => now()]);

            return $message;
        });

        $message->load('sender.profile');
        event(new MessageSent($message));

        // Notify the other participant.
        $other = $conversation->participants->firstWhere('id', '!=', $me->id)
            ?? $conversation->participants()->where('users.id', '!=', $me->id)->first();
        if ($other) {
            $this->notifications->notify(
                $other->id,
                'message',
                'New message',
                "{$me->username}: ".str($data['body'])->limit(60),
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

    private function assertParticipant(Request $request, Conversation $conversation): void
    {
        if (! $conversation->hasParticipant($request->user()->id)) {
            abort(403, 'You are not part of this conversation.');
        }
    }
}
