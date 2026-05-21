<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks suspended/banned/deactivated accounts from acting on the platform,
 * even if they hold a valid token. Auto-lifts an expired suspension.
 */
class EnsureActiveUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        // Auto-lift suspension once the window has passed.
        if ($user->status === UserStatus::Suspended
            && $user->suspended_until !== null
            && now()->greaterThanOrEqualTo($user->suspended_until)) {
            $user->forceFill([
                'status' => UserStatus::Active,
                'suspended_until' => null,
            ])->save();
        }

        return match ($user->status) {
            UserStatus::Banned => ApiResponse::error('Your account has been permanently banned.', 403),
            UserStatus::Suspended => ApiResponse::error(
                'Your account is suspended until '.optional($user->suspended_until)->toDateTimeString().'.',
                403
            ),
            UserStatus::Deactivated => ApiResponse::error('Your account is deactivated. Reactivate it to continue.', 403),
            default => $next($request),
        };
    }
}
