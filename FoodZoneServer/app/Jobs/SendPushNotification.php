<?php

namespace App\Jobs;

use App\Models\PushToken;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Deliver a push notification to all of a user's registered devices via the
 * Expo push service (which fans out to FCM/APNs). No-ops when push is disabled
 * or the user has no tokens, so it is safe to dispatch from every in-app
 * notification.
 */
class SendPushNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** @param array<string,mixed> $data */
    public function __construct(
        public int $userId,
        public string $title,
        public string $body,
        public array $data = [],
    ) {}

    public function handle(): void
    {
        if (! config('push.enabled')) {
            return;
        }

        $tokens = PushToken::where('user_id', $this->userId)->pluck('token')->all();
        if (empty($tokens)) {
            return;
        }

        $messages = array_map(fn ($token) => [
            'to' => $token,
            'title' => $this->title,
            'body' => $this->body,
            'data' => $this->data,
            'sound' => 'default',
        ], $tokens);

        $request = Http::acceptJson();
        if ($accessToken = config('push.expo_access_token')) {
            $request = $request->withToken($accessToken);
        }

        try {
            $response = $request->post((string) config('push.expo_endpoint'), $messages);
            if ($response->failed()) {
                Log::warning('Expo push failed', ['user' => $this->userId, 'body' => $response->body()]);
            }
        } catch (\Throwable $e) {
            Log::warning('Expo push threw', ['user' => $this->userId, 'error' => $e->getMessage()]);
        }
    }
}
