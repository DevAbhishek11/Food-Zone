<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
            $request->only(['bio', 'website', 'avatar', 'cover', 'is_private', 'food_preferences', 'dietary_restrictions'])
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
            'status' => \App\Enums\UserStatus::Deactivated->value,
            'deactivated_at' => now(),
        ])->save();
        $me->tokens()->delete();

        return ApiResponse::success(null, 'Account deactivated.');
    }
}
