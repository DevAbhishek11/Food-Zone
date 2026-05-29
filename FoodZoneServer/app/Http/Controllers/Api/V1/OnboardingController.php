<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Follow;
use App\Models\UserProfile;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OnboardingController extends Controller
{
    /**
     * Finalise the 4-step new-user onboarding wizard.
     * Persists food preferences + (optional) profile location and a starter
     * follow set, then flips `users.onboarding_completed`.
     */
    public function complete(Request $request): JsonResponse
    {
        $data = $request->validate([
            'food_preferences' => ['nullable', 'array', 'max:20'],
            'food_preferences.*' => ['string', 'max:50'],
            'dietary_restrictions' => ['nullable', 'array', 'max:20'],
            'dietary_restrictions.*' => ['string', 'max:50'],
            'location' => ['nullable', 'string', 'max:100'],
            'follow_user_ids' => ['nullable', 'array', 'max:50'],
            'follow_user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $me = $request->user();

        DB::transaction(function () use ($me, $data) {
            UserProfile::updateOrCreate(
                ['user_id' => $me->id],
                array_filter([
                    'food_preferences' => $data['food_preferences'] ?? null,
                    'dietary_restrictions' => $data['dietary_restrictions'] ?? null,
                    'location' => $data['location'] ?? null,
                ], fn ($v) => $v !== null),
            );

            foreach ($data['follow_user_ids'] ?? [] as $userId) {
                if ($userId === $me->id) continue;
                Follow::firstOrCreate(
                    ['follower_id' => $me->id, 'following_id' => $userId],
                    ['status' => 'accepted'],
                );
            }

            $me->update(['onboarding_completed' => true]);
        });

        $me->load('profile');

        return ApiResponse::success(new UserResource($me), 'Onboarding completed.');
    }

    /** Skip the wizard but still mark it done so we don't re-prompt. */
    public function skip(Request $request): JsonResponse
    {
        $request->user()->update(['onboarding_completed' => true]);

        return ApiResponse::success(new UserResource($request->user()->load('profile')), 'Onboarding skipped.');
    }
}
