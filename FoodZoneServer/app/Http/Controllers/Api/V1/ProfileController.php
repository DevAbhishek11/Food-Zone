<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $me = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'username' => [
                'sometimes', 'string', 'min:3', 'max:50', 'regex:/^[A-Za-z0-9_.]+$/',
                Rule::unique('users', 'username')->ignore($me->id),
            ],
            'bio' => ['nullable', 'string', 'max:500'],
            'website' => ['nullable', 'url', 'max:255'],
            'location' => ['nullable', 'string', 'max:100'],
            'avatar' => ['nullable', 'string', 'max:2048'],
            'cover' => ['nullable', 'string', 'max:2048'],
            'is_private' => ['sometimes', 'boolean'],
            'food_preferences' => ['nullable', 'array'],
            'dietary_restrictions' => ['nullable', 'array'],
        ]);

        $me->fill(array_filter(
            $request->only(['name', 'username']),
            fn ($v) => $v !== null
        ))->save();

        $me->profile()->updateOrCreate(
            ['user_id' => $me->id],
            $request->only(['bio', 'website', 'location', 'avatar', 'cover', 'is_private', 'food_preferences', 'dietary_restrictions'])
        );

        return ApiResponse::success(
            new UserResource($me->fresh()->load('profile')),
            'Profile updated.'
        );
    }

    public function deactivate(Request $request): JsonResponse
    {
        $me = $request->user();
        $me->forceFill([
            'status' => UserStatus::Deactivated->value,
            'deactivated_at' => now(),
        ])->save();
        $me->tokens()->delete();

        return ApiResponse::success(null, 'Account deactivated.');
    }

    /**
     * Request permanent deletion (spec §8.2, §22.4). The account is
     * deactivated immediately; a scheduled command purges it 30 days later
     * unless the user logs back in and calls reactivate() before then.
     */
    public function requestDeletion(Request $request): JsonResponse
    {
        $me = $request->user();

        $request->validate(['password' => ['required', 'string']]);
        if (! Hash::check($request->string('password'), $me->password)) {
            return ApiResponse::error('Incorrect password.', 422, ['password' => ['Incorrect password.']]);
        }

        $me->forceFill([
            'status' => UserStatus::Deactivated->value,
            'deactivated_at' => now(),
            'deletion_requested_at' => now(),
        ])->save();
        $me->tokens()->delete();

        return ApiResponse::success(null, 'Account deletion requested. Your account will be permanently deleted in 30 days — log back in before then to cancel.');
    }

    /**
     * Reactivate a deactivated account. If a deletion was pending, logging
     * back in and calling this cancels it — the account's data is safe.
     */
    public function reactivate(Request $request): JsonResponse
    {
        $me = $request->user();

        if ($me->status !== UserStatus::Deactivated) {
            return ApiResponse::error('Your account is not deactivated.', 422);
        }

        $me->forceFill([
            'status' => UserStatus::Active->value,
            'deactivated_at' => null,
            'deletion_requested_at' => null,
        ])->save();

        return ApiResponse::success(new UserResource($me->fresh()->load('profile')), 'Welcome back — your account is active again.');
    }
}
