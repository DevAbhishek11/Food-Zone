<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\UserProfile;
use App\Notifications\VerifyEmailNotification;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $token = Str::random(64);

        $user = DB::transaction(function () use ($request, $token) {
            $user = User::create([
                'name' => $request->string('name'),
                'username' => $request->string('username'),
                'email' => $request->string('email'),
                'phone' => $request->input('phone'),
                'password' => $request->string('password'),
                'role' => UserRole::User->value,
                'status' => UserStatus::Active->value,
                'dob' => $request->input('dob'),
                'gender' => $request->input('gender'),
                'referral_code' => $this->uniqueReferralCode(),
            ]);

            $user->forceFill(['email_verification_token' => $token])->save();
            UserProfile::create(['user_id' => $user->id]);

            return $user;
        });

        $user->notify(new VerifyEmailNotification($token));

        $accessToken = $user->createToken('auth')->plainTextToken;

        return ApiResponse::success([
            'user' => new UserResource($user->load('profile')),
            'token' => $accessToken,
            'token_type' => 'Bearer',
        ], 'Registration successful. Please verify your email.', 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $request->authenticate();

        /** @var User $user */
        $user = $request->user() ?? User::where('email', $request->string('email'))->firstOrFail();

        if ($user->status === UserStatus::Banned) {
            return ApiResponse::error('Your account has been permanently banned.', 403);
        }

        $user->forceFill(['last_active_at' => now()])->save();

        $accessToken = $user->createToken('auth')->plainTextToken;

        return ApiResponse::success([
            'user' => new UserResource($user->load('profile')),
            'token' => $accessToken,
            'token_type' => 'Bearer',
        ], 'Login successful.');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return ApiResponse::success(null, 'Logged out successfully.');
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success(
            new UserResource($request->user()->load('profile')),
            'Authenticated user.'
        );
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || $user->email_verification_token === null
            || ! hash_equals($user->email_verification_token, $data['token'])) {
            return ApiResponse::error('Invalid or expired verification token.', 422);
        }

        $user->forceFill([
            'email_verified_at' => now(),
            'email_verification_token' => null,
        ])->save();

        return ApiResponse::success(null, 'Email verified successfully.');
    }

    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->email_verified_at !== null) {
            return ApiResponse::error('Your email is already verified.', 422);
        }

        $token = Str::random(64);
        $user->forceFill(['email_verification_token' => $token])->save();
        $user->notify(new VerifyEmailNotification($token));

        return ApiResponse::success(null, 'Verification email resent.');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        // Always return success to avoid leaking which emails are registered.
        Password::sendResetLink($request->only('email'));

        return ApiResponse::success(null, 'If that email exists, a reset link has been sent.');
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
                // Invalidate existing tokens after a password reset.
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PasswordReset) {
            return ApiResponse::error(__($status), 422);
        }

        return ApiResponse::success(null, 'Password reset successfully.');
    }

    private function uniqueReferralCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (User::where('referral_code', $code)->exists());

        return $code;
    }
}
